import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const getQuerySchema = z.object({
  wallet: z.string().min(1).max(255), // Basic validation to prevent excessively long strings
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerWalletRaw = searchParams.get('wallet');

    const result = getQuerySchema.safeParse({ wallet: ownerWalletRaw });

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid or missing wallet address' }, { status: 400 });
    }

    const ownerWallet = result.data.wallet;

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
