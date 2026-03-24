import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { botId, isActive, ownerWallet } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    if (!ownerWallet) {
      return NextResponse.json({ error: 'Missing ownerWallet' }, { status: 400 });
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedBot = await prisma.bot.update({
      where: { id: botId },
      data: { isActive },
    });

    return NextResponse.json({ ok: true, bot: updatedBot });
  } catch (error) {
    console.error('Toggle bot error:', error);
    return NextResponse.json({ error: 'Failed to toggle bot status' }, { status: 500 });
  }
}
