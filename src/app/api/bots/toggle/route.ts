import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { validateTmaAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
