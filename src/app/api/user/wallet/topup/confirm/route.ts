import { NextResponse } from 'next/server';

import { requireTelegramAuth } from '@/lib/server-auth';
import { verifyPendingTopup } from '@/lib/ton-verification';

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const { transactionId } = await request.json();
    const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS;

    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    if (!masterWalletAddress) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_MASTER_WALLET_ADDRESS is not configured.' }, { status: 500 });
    }

    const result = await verifyPendingTopup(transactionId, masterWalletAddress);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify top-up';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
