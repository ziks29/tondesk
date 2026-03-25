import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const toggleSchema = z.object({
  botId: z.string().min(1).max(255),
  ownerWallet: z.string().min(1).max(255),
  isActive: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = toggleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { botId, isActive, ownerWallet } = result.data;

    // Verify ownership
    const existingBot = await prisma.bot.findUnique({
      where: { id: botId },
    });

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
    return NextResponse.json({ error: 'Failed to toggle bot status' }, { status: 500 });
  }
}
