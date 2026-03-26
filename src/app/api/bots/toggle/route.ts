import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const { botId, ownerWallet, isActive } = await request.json();

    if (!botId || !ownerWallet) {
      return NextResponse.json({ error: 'Missing botId or ownerWallet' }, { status: 400 });
    }

    const existingBot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (existingBot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized to toggle this bot' }, { status: 403 });
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: { isActive },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Toggle bot error:', error);
    const message = error instanceof Error ? error.message : 'Failed to toggle bot status';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
