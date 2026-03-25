import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

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
    return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 });
  }
}
