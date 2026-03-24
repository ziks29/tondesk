import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { extractFromFile, extractFromUrl } from '@/lib/extractor';
import { prisma } from '@/lib/prisma';

function telegramApiUrl(botToken: string, method: string) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const botToken = formData.get('botToken') as string;
    const ownerWallet = formData.get('ownerWallet') as string;
    const manualText = formData.get('knowledgeBaseText') as string;
    const aiModel = formData.get('aiModel') as string || 'google/gemini-2.0-flash-001';
    const urlsJson = formData.get('urls') as string;
    const mcpUrl = formData.get('mcpUrl') as string | null;
    const mcpAuthToken = formData.get('mcpAuthToken') as string | null;
    const uploadedFiles = formData.getAll('files') as File[];

    if (!botToken || !ownerWallet) {
      return NextResponse.json({ error: 'Missing mandatory fields.' }, { status: 400 });
    }

    // Extraction Step
    let extractedText = manualText || '';
    
    // Parse and handle URLs
    if (urlsJson) {
      try {
        const urls = JSON.parse(urlsJson) as string[];
        for (const url of urls) {
          const content = await extractFromUrl(url);
          if (content) extractedText += `\n\n[Content from URL: ${url}]\n${content}`;
        }
      } catch (e) {
        console.error('Error parsing URLs JSON:', e);
      }
    }

    // Handle Files
    for (const file of uploadedFiles) {
      const content = await extractFromFile(file);
      if (content) extractedText += `\n\n[Content from File: ${file.name}]\n${content}`;
    }

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

    const requestHeaders = await headers();
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
        mcpUrl: mcpUrl || null,
        mcpAuthToken: mcpAuthToken || null,
      },
      update: {
        ownerWallet,
        knowledgeBaseText: extractedText,
        aiModel,
        isActive: true,
        secretToken,
        mcpUrl: mcpUrl || null,
        mcpAuthToken: mcpAuthToken || null,
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
