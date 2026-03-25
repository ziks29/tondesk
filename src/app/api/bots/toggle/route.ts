import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateTmaAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const toggleSchema = z.object({
  botId: z.string().min(1).max(255),
  ownerWallet: z.string().min(1).max(255),
  isActive: z.boolean(),
});

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
