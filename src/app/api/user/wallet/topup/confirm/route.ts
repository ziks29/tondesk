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
      console.error('[topup/confirm] NEXT_PUBLIC_MASTER_WALLET_ADDRESS not configured');
      return NextResponse.json({ error: 'Server configuration error. Please contact support.' }, { status: 500 });
    }

    const result = await verifyPendingTopup(transactionId, masterWalletAddress);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify top-up';
    console.error(`[topup/confirm] Verification error for transaction:`, message);

    // Distinguish between different error types for better UX
    let status = 500;
    let userMessage = 'Top-up verification failed. Please try again.';

    if (message.startsWith('Unauthorized')) {
      status = 401;
      userMessage = 'Authentication failed. Please refresh and try again.';
    } else if (message.includes('not found')) {
      status = 400;
      userMessage = 'Top-up not found. Please check if it was already processed.';
    } else if (message.includes('Failed')) {
      userMessage = message;
    }

    return NextResponse.json({ error: userMessage }, { status });
  }
}
