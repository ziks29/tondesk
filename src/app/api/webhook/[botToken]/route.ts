import { NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

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

async function askOpenRouter(knowledgeBaseText: string, aiModel: string, userPrompt: string, mcpUrl?: string | null, mcpAuthToken?: string | null) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      reply: 'OpenRouter API key is not configured on the server.',
      intent: null,
    } as OpenRouterResult;
  }

  const systemPrompt = [
    'You are a strict Telegram support agent.',
    'Use ONLY the provided knowledge base to answer.',
    'If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."',
    'If user wants to buy/order/purchase/pay for something clearly listed in KB with a TON price, return intent object.',
    'Return STRICT JSON only with this shape:',
    '{"reply":"string","intent":null | {"intent":"buy","item":"string","price_in_ton":number}}',
    'Never include markdown or extra text outside JSON.',
    `KNOWLEDGE_BASE:\n${knowledgeBaseText}`,
  ].join('\n');

  let mcpClient: Client | null = null;
  let tools: any[] = [];

  try {
    if (mcpUrl) {
      console.log(`[MCP] Connecting to ${mcpUrl}`);
      const headers: Record<string, string> = {};
      if (mcpAuthToken) {
        headers['Authorization'] = `Bearer ${mcpAuthToken}`;
      }

      const transport = new SSEClientTransport(new URL(mcpUrl), {
        eventSourceInit: {
          fetch: (url: string | URL | Request, init?: RequestInit) =>
            fetch(url, { ...init, headers: { ...init?.headers, ...headers } }),
        }
      });
      mcpClient = new Client({
        name: 'TonDesk',
        version: '1.0.0',
      }, { capabilities: {} });

      await mcpClient.connect(transport);
      const mcpTools = await mcpClient.listTools();

      tools = mcpTools.tools.map((t: any) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description || '',
          parameters: t.inputSchema,
        },
      }));
      console.log(`[MCP] Fetched ${tools.length} tools`);
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    while (true) {
      const payload: any = {
        model: aiModel,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages,
      };

      if (tools.length > 0) {
        payload.tools = tools;
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

      const body = await response.json();
      const message = body.choices?.[0]?.message;

      if (!message) {
        return { reply: 'I can only answer from the provided knowledge base.', intent: null };
      }

      messages.push(message);

      if (message.tool_calls && message.tool_calls.length > 0 && mcpClient) {
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          console.log(`[MCP] Executing tool: ${fnName}`, fnArgs);

          try {
            const toolResult = await mcpClient.callTool({
              name: fnName,
              arguments: fnArgs,
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: fnName,
              content: JSON.stringify(toolResult.content),
            });
          } catch (toolError) {
            console.error(`[MCP] Tool ${fnName} failed:`, toolError);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: fnName,
              content: JSON.stringify({ error: String(toolError) }),
            });
          }
        }
        continue; // Go back to the top of the loop and call openrouter with the tool results
      }

      const content = message.content;
      if (!content) {
        return { reply: 'I can only answer from the provided knowledge base.', intent: null };
      }

      const parsed = parseJsonResult(content);
      if (!parsed.reply) {
        parsed.reply = 'I can only answer from the provided knowledge base.';
      }

      return parsed;
    }
  } catch (error) {
    console.error('[askOpenRouter] Error:', error);
    return { reply: 'An error occurred while communicating with the AI or MCP server.', intent: null };
  } finally {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (err) {
        console.error('[askOpenRouter] Error closing MCP client:', err);
      }
    }
  }
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

    console.log(`[Webhook] Asking AI (${bot.aiModel}) with prompt: "${text}"`);
    const ai = await askOpenRouter(bot.knowledgeBaseText, bot.aiModel, text, bot.mcpUrl, bot.mcpAuthToken);
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
