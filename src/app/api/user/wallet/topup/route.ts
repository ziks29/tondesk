import { NextResponse } from 'next/server';

import { tonToCredits } from '@/lib/billing';
import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const { walletAddress, amountTon, tonConnectTxHash } = await request.json();

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    if (typeof amountTon !== 'number' || !Number.isFinite(amountTon) || amountTon <= 0) {
      return NextResponse.json({ error: 'Invalid top-up amount' }, { status: 400 });
    }

    const normalizedAmount = Number(amountTon.toFixed(4));
    const credits = tonToCredits(normalizedAmount);

    await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    const transaction = await prisma.transaction.create({
      data: {
        walletAddress,
        amount: normalizedAmount,
        credits,
        type: 'topup',
        tonConnectTxHash: typeof tonConnectTxHash === 'string' ? tonConnectTxHash : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      ok: true,
      transaction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize top-up';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
