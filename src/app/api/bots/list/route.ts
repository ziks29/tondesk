import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { validateTmaAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const ownerWallet = searchParams.get('wallet');

    if (!ownerWallet) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    const bots = await (prisma.bot as any).findMany({
      where: { ownerWallet },
      orderBy: { createdAt: 'desc' },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ ok: true, bots });
  } catch (error) {
    console.error('List bots error:', error);
    return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
  }
}
