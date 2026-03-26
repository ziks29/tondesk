import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

function telegramApiUrl(botToken: string, method: string) {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const { botId, ownerWallet } = await request.json();

    if (!botId || !ownerWallet) {
      return NextResponse.json({ error: 'Missing botId or ownerWallet' }, { status: 400 });
    }

    const existingBot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (existingBot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized to delete this bot' }, { status: 403 });
    }

    // Remove webhook from Telegram before deleting so Telegram stops calling the dead URL
    try {
      await fetch(telegramApiUrl(existingBot.botToken, 'deleteWebhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: true }),
      });
    } catch (err) {
      // Non-fatal: bot token may already be invalid; proceed with local deletion
      console.warn('deleteWebhook failed (non-fatal):', err);
    }

    // Delete related interactions first to avoid foreign key constraints
    await prisma.interaction.deleteMany({
      where: { botId: botId },
    });

    const bot = await prisma.bot.delete({
      where: { id: botId },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Delete bot error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete bot';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
