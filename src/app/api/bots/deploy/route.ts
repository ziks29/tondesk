import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { validateTmaAuth } from '@/lib/auth';

import { extractFromFile, extractFromUrl } from '@/lib/extractor';
import { prisma } from '@/lib/prisma';

function telegramApiUrl(botToken: string, method: string) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

export async function POST(request: Request) {
  try {
    const requestHeaders = await headers();
    const authHeader = requestHeaders.get('authorization');
    const [authType, authData = ''] = (authHeader || '').split(' ');

    if (authType !== 'tma' || !authData) {
      return NextResponse.json({ error: 'Unauthorized: missing or invalid tma auth header' }, { status: 401 });
    }

    const platformBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!platformBotToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    try {
      validateTmaAuth(authData, platformBotToken);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: invalid initData' }, { status: 401 });
    }

    const formData = await request.formData();
    const botToken = formData.get('botToken') as string;
    const ownerWallet = formData.get('ownerWallet') as string;
    const manualText = formData.get('knowledgeBaseText') as string;
    const aiModel = formData.get('aiModel') as string || 'google/gemini-2.0-flash-001';
    const systemPrompt = formData.get('systemPrompt') as string | null;
    const welcomeMessage = formData.get('welcomeMessage') as string | null;
    const urlsJson = formData.get('urls') as string;
    const uploadedFiles = formData.getAll('files') as File[];

    if (!botToken || !ownerWallet) {
      return NextResponse.json({ error: 'Missing mandatory fields.' }, { status: 400 });
    }

    // Extraction Step
    let extractedText = manualText || '';
    
    // Parse and handle URLs
    const urlPromises: Promise<void>[] = [];
    if (urlsJson) {
      try {
        const urls = JSON.parse(urlsJson) as string[];
        for (const url of urls) {
          urlPromises.push(
            extractFromUrl(url).then(content => {
              if (content) extractedText += `\n\n[Content from URL: ${url}]\n${content}`;
            })
          );
        }
      } catch (e) {
        console.error('Error parsing URLs JSON:', e);
      }
    }

    // Handle Files
    const filePromises: Promise<void>[] = [];
    for (const file of uploadedFiles) {
      filePromises.push(
        extractFromFile(file).then(content => {
          if (content) extractedText += `\n\n[Content from File: ${file.name}]\n${content}`;
        })
      );
    }

    // Process URLs and files concurrently to optimize performance
    await Promise.all([...urlPromises, ...filePromises]);

    if (extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Knowledge base is empty or too small.' },
        { status: 400 },
      );
    }

    const getMeResponse = await fetch(telegramApiUrl(botToken, 'getMe'));
    const getMeBody = (await getMeResponse.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!getMeResponse.ok || !getMeBody.ok) {
      return NextResponse.json(
        { error: `Invalid Telegram bot token. ${getMeBody.description ?? ''}`.trim() },
        { status: 400 },
      );
    }

    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || '';
    const protocol = requestHeaders.get('x-forwarded-proto') || 'https';

    // Use environment variable if provided, otherwise detect from headers
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : '');
    
    if (!appUrl) {
      return NextResponse.json({ error: 'Unable to detect public host.' }, { status: 500 });
    }

    const secretToken = randomUUID();
    const webhookUrl = `${appUrl}/api/webhook/${botToken}`;

    const webhookResponse = await fetch(telegramApiUrl(botToken, 'setWebhook'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message'],
      }),
    });

    const webhookBody = (await webhookResponse.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!webhookResponse.ok || !webhookBody.ok) {
      console.error(`[Deploy] setWebhook failed: ${webhookBody.description}`);
      return NextResponse.json(
        { error: `setWebhook failed. ${webhookBody.description ?? ''}`.trim() },
        { status: 400 },
      );
    } else {
      console.log(`[Deploy] Webhook successfully set to: ${webhookUrl}`);
    }

    await prisma.bot.upsert({
      where: { botToken },
      create: {
        botToken,
        ownerWallet,
        knowledgeBaseText: extractedText,
        aiModel,
        isActive: true,
        secretToken,
        systemPrompt,
        welcomeMessage,
      },
      update: {
        ownerWallet,
        knowledgeBaseText: extractedText,
        aiModel,
        isActive: true,
        secretToken,
        systemPrompt,
        welcomeMessage,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Bot deployed and webhook registered successfully.',
      webhookUrl,
    });
  } catch (error) {
    console.error('Deploy route error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error while deploying bot.' },
      { status: 500 },
    );
  }
}
