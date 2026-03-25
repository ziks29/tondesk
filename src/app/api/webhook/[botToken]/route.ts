import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

type OpenRouterResult = {
  reply: string;
  intent: {
    intent: 'buy';
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

function buildTonTransferLink(address: string, amountTon: number, item: string): string {
  const nanoTons = Math.max(1, Math.floor(amountTon * 1_000_000_000));
  const text = encodeURIComponent(`TonDesk purchase: ${item}`);
  return `ton://transfer/${address}?amount=${nanoTons}&text=${text}`;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  buyButtonUrl?: string,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };

  if (buyButtonUrl) {
    body.reply_markup = {
      inline_keyboard: [[{ text: 'Pay with TON', url: buyButtonUrl }]],
    };
  }

  await fetch(telegramApiUrl(botToken, 'sendMessage'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function askOpenRouter(knowledgeBaseText: string, aiModel: string, userPrompt: string, customSystemPrompt: string | null, urlsJson: string | null) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      reply: 'OpenRouter API key is not configured on the server.',
      intent: null,
    } as OpenRouterResult;
  }

  const promptParts = [
    customSystemPrompt || 'You are a strict Telegram support agent.',
    'Use ONLY the provided knowledge base to answer.',
    'If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."',
    'If user wants to buy/order/purchase/pay for something clearly listed in KB with a TON price, return intent object.',
    'Return STRICT JSON only with this shape:',
    '{"reply":"string","intent":null | {"intent":"buy","item":"string","price_in_ton":number}}',
    'Never include markdown or extra text outside JSON.',
  ];

  if (urlsJson) {
    try {
      const parsedUrls = JSON.parse(urlsJson) as string[];
      if (parsedUrls.length > 0) {
        promptParts.push(`You may also reference, search on, or provide the following official URLs if relevant: ${parsedUrls.join(', ')}`);
      }
    } catch (e) {
      // Ignore
    }
  }

  let plugins: unknown[] | undefined = undefined;

  if (urlsJson) {
    try {
      const parsedUrls = JSON.parse(urlsJson) as string[];
      if (parsedUrls.length > 0) {
        const domains = parsedUrls.map(u => {
          try {
            return new URL(u).hostname;
          } catch {
            return null;
          }
        }).filter(Boolean);

        if (domains.length > 0) {
          plugins = [
            {
              id: 'web',
              include_domains: Array.from(new Set(domains)),
            }
          ];
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  promptParts.push(`KNOWLEDGE_BASE:\n${knowledgeBaseText}`);

  const systemPrompt = promptParts.join('\n');

  const payload: Record<string, unknown> = {
    model: aiModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (plugins) {
    payload.plugins = plugins;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

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
    return { reply: 'I can only answer from the provided knowledge base.', intent: null };
  }

  const parsed = parseJsonResult(content);
  if (!parsed.reply) {
    parsed.reply = 'I can only answer from the provided knowledge base.';
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
      console.warn(`[Webhook] Bot not found or inactive for token: ${botToken.slice(0, 10)}...`);
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (!headerSecret || headerSecret !== bot.secretToken) {
      console.error(`[Webhook] Unauthorized webhook attempt for bot: ${botToken.slice(0, 10)}...`);
      return NextResponse.json({ ok: false, error: 'Unauthorized webhook.' }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();

    console.log(`[Webhook] Received update for bot: ${botToken.slice(0, 10)}... (chatId: ${chatId})`);
    console.log('[Webhook] Full update structure:', JSON.stringify(update, null, 2));

    if (!chatId || !text) {
      console.log('[Webhook] Update didn\'t contain chatId or text, skipping.');
      return NextResponse.json({ ok: true });
    }

    if (text === '/start' && bot.welcomeMessage) {
      console.log(`[Webhook] Sending welcome message for bot: ${botToken.slice(0, 10)}...`);
      await sendTelegramMessage(botToken, chatId, bot.welcomeMessage);
      return NextResponse.json({ ok: true });
    }

    console.log(`[Webhook] Asking AI (${bot.aiModel}) with prompt: "${text}"`);
    const ai = await askOpenRouter(bot.knowledgeBaseText, bot.aiModel, text, bot.systemPrompt, bot.urls);
    console.log('[Webhook] AI Result:', JSON.stringify(ai, null, 2));

    let buyUrl: string | undefined;
    if (
      ai.intent &&
      ai.intent.intent === 'buy' &&
      ai.intent.item &&
      Number.isFinite(ai.intent.price_in_ton) &&
      ai.intent.price_in_ton > 0
    ) {
      buyUrl = buildTonTransferLink(
        bot.ownerWallet,
        ai.intent.price_in_ton,
        ai.intent.item,
      );
    }

    await sendTelegramMessage(botToken, chatId, ai.reply, buyUrl);

    // Save interaction to database for the owner's dashboard
    try {
      await prisma.interaction.create({
        data: {
          botId: bot.id,
          chatId: chatId.toString(),
          userInput: text,
          aiResponse: ai.reply,
          aiIntent: ai.intent ? JSON.stringify(ai.intent) : null,
        },
      });
    } catch (dbError) {
      console.error('[Webhook] Failed to save interaction to DB:', dbError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook route error:', error);
    return NextResponse.json({ ok: true });
  }
}
