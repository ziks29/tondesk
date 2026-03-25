import { NextResponse } from "next/server";

import { INTERACTION_CREDIT_COST } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

type OpenRouterResult = {
  reply: string;
  intent?: {
    intent: "buy";
    item: string;
    price_in_ton: number;
  } | null;
};

type TelegramUpdate = {
  message?: {
    chat?: { id: number };
    text?: string;
  };
};

function telegramApiUrl(botToken: string, method: string) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

function parseJsonResult(content: string): OpenRouterResult {
  try {
    return JSON.parse(content) as OpenRouterResult;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return { reply: content, intent: null };
    }

    try {
      return JSON.parse(match[0]) as OpenRouterResult;
    } catch {
      return { reply: content, intent: null };
    }
  }
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };

  await fetch(telegramApiUrl(botToken, "sendMessage"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function askOpenRouter(
  knowledgeBaseText: string,
  aiModel: string,
  userPrompt: string,
  customSystemPrompt: string | null,
  webSearchEnabled: boolean,
  historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [],
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      reply: "OpenRouter API key is not configured on the server.",
      intent: null,
    } as OpenRouterResult;
  }

  const systemPrompt = [
    customSystemPrompt ||
      [
        "You are a strict Telegram support agent.",
        webSearchEnabled
          ? "You can use web search to find answers. Use the provided knowledge base first, then web search if needed."
          : "Use ONLY the provided knowledge base to answer.",
        !webSearchEnabled
          ? 'If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."'
          : "",
      ]
        .filter((line) => line.length > 0)
        .join("\n"),
    "Return STRICT JSON only with this shape:",
    '{"reply":"string"}',
    "Never include markdown or extra text outside JSON.",
    `KNOWLEDGE_BASE:\n${knowledgeBaseText}`,
  ].join("\n");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        temperature: 0,
        response_format: { type: "json_object" },
        ...(webSearchEnabled ? { plugins: [{ id: "web" }] } : {}),
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: userPrompt },
        ],
      }),
    },
  );

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${raw}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    return {
      reply: "I can only answer from the provided knowledge base.",
      intent: null,
    };
  }

  const parsed = parseJsonResult(content);
  if (!parsed.reply) {
    parsed.reply = "I can only answer from the provided knowledge base.";
  }

  return parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botToken: string }> },
) {
  try {
    const { botToken } = await params;
    const bot = await prisma.bot.findUnique({ where: { botToken } });

    if (!bot || !bot.isActive) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (!headerSecret || headerSecret !== bot.secretToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized webhook." },
        { status: 401 },
      );
    }

    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();

    if (!chatId || !text) {
      return NextResponse.json({ ok: true });
    }

    // Handle /start command
    if (text === "/start") {
      const welcomeMsg = bot.welcomeMessage || "Hi! How can I help you today?";
      await sendTelegramMessage(botToken, chatId, welcomeMsg);
      return NextResponse.json({ ok: true });
    }

    const billingWallet = bot.userWalletAddress ?? bot.ownerWallet;
    const walletUser = await prisma.user.upsert({
      where: { walletAddress: billingWallet },
      update: {},
      create: { walletAddress: billingWallet },
    });

    if (walletUser.credits < INTERACTION_CREDIT_COST) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "This bot is out of credits right now. Please top up the owner wallet in TonDesk to continue.",
      );
      return NextResponse.json({ ok: true });
    }

    // Fetch last 5 interactions for conversation history
    const history = await prisma.interaction.findMany({
      where: { botId: bot.id, chatId: String(chatId) },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    history.reverse(); // oldest first

    // Build history messages for OpenRouter
    const historyMessages = history.flatMap((i) => [
      { role: "user" as const, content: i.userInput },
      { role: "assistant" as const, content: i.aiResponse },
    ]);

    const ai = await askOpenRouter(
      bot.knowledgeBaseText,
      bot.aiModel,
      text,
      bot.systemPrompt,
      bot.webSearchEnabled,
      historyMessages,
    );

    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          botId: bot.id,
          chatId: String(chatId),
          userInput: text,
          aiResponse: ai.reply,
          aiIntent: ai.intent ? JSON.stringify(ai.intent) : null,
          creditsUsed: INTERACTION_CREDIT_COST,
        },
      }),
      prisma.user.update({
        where: { walletAddress: billingWallet },
        data: {
          credits: { decrement: INTERACTION_CREDIT_COST },
        },
      }),
      prisma.transaction.create({
        data: {
          walletAddress: billingWallet,
          amount: 0,
          credits: -INTERACTION_CREDIT_COST,
          type: "usage",
          status: "completed",
        },
      }),
    ]);

    await sendTelegramMessage(botToken, chatId, ai.reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook route error:", error);
    return NextResponse.json({ ok: true });
  }
}
