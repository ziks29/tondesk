import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const { botId, isActive } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: { isActive },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Toggle bot error:', error);
    return NextResponse.json({ error: 'Failed to toggle bot status' }, { status: 500 });
  }
}
