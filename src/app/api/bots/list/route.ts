import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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
