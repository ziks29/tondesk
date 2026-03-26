import { prisma } from '@/lib/prisma';

type TonCenterMessage = {
  hash: string;
  value: string;
  created_at: string;
  source: string | null;
  destination: string | null;
  in_msg_tx_hash?: string | null;
};

type TonCenterTransaction = {
  hash: string;
  emulated?: boolean;
  description?: {
    aborted?: boolean;
    action?: {
      success?: boolean;
      result_code?: number;
      valid?: boolean;
      no_funds?: boolean;
    };
    compute_ph?: {
      success?: boolean;
      skipped?: boolean;
      exit_code?: number;
    };
  };
};

function getToncenterBaseUrl() {
  return process.env.TONCENTER_API_BASE_URL || 'https://toncenter.com/api/v3';
}

async function toncenterFetch<T>(path: string, searchParams: URLSearchParams): Promise<T> {
  const url = `${getToncenterBaseUrl()}${path}?${searchParams.toString()}`;
  const headers: Record<string, string> = {};
  if (process.env.TONCENTER_API_KEY) {
    headers['X-API-Key'] = process.env.TONCENTER_API_KEY;
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`TON verification failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function findMatchingInboundMessage(sourceWallet: string, destinationWallet: string, amountTon: number, createdAt: Date) {
  const expectedNano = Math.round(amountTon * 1_000_000_000);
  const params = new URLSearchParams({
    source: sourceWallet,
    destination: destinationWallet,
    direction: 'in',
    start_utime: String(Math.max(0, Math.floor(createdAt.getTime() / 1000) - 300)),
    end_utime: String(Math.floor(Date.now() / 1000) + 300),
    limit: '20',
    sort: 'desc',
  });

  const body = await toncenterFetch<{ messages: TonCenterMessage[] }>('/messages', params);

  return body.messages.find((message) => {
    const value = Number.parseInt(message.value, 10);
    return Number.isFinite(value) && value >= expectedNano && Boolean(message.in_msg_tx_hash);
  }) ?? null;
}

async function fetchTransactionByHash(hash: string) {
  const params = new URLSearchParams({ hash, limit: '1' });
  const body = await toncenterFetch<{ transactions: TonCenterTransaction[] }>('/transactions', params);
  return body.transactions[0] ?? null;
}

function isSuccessfulTransaction(transaction: TonCenterTransaction | null) {
  if (!transaction || transaction.emulated) {
    return false;
  }

  // Check action phase (determines if transaction succeeded)
  // Even if aborted=true, if action.success=true, the value transfer succeeded
  const action = transaction.description?.action;
  if (action) {
    // Explicit failure conditions
    if (action.success === false || action.valid === false || action.no_funds === true) {
      return false;
    }
    // If action.success is explicitly true, transaction succeeded
    if (action.success === true) {
      return true;
    }
  }

  // Check compute phase for execution errors
  const compute = transaction.description?.compute_ph;
  if (compute) {
    if (compute.success === false) {
      return false;
    }
    // Non-zero exit code (except for certain acceptable codes) = failure
    if (compute.exit_code && compute.exit_code !== 0) {
      return false;
    }
  }

  // If no explicit success/failure indicators, consider it successful
  // (aborted flag alone doesn't mean the transaction failed)
  return true;
}

export async function verifyPendingTopup(transactionId: string, masterWalletAddress: string) {
  const pending = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!pending || pending.type !== 'topup') {
    console.error(`[ton-verification] Transaction not found: ${transactionId}`);
    throw new Error('Top-up not found');
  }

  if (pending.status === 'completed') {
    console.log(`[ton-verification] Transaction already completed: ${transactionId}`);
    return { status: 'completed' as const, transaction: pending };
  }

  console.log(
    `[ton-verification] Verifying pending topup: ${transactionId}, ` +
    `wallet=${pending.walletAddress.slice(0, 10)}..., ` +
    `amount=${pending.amount} TON, age=${Math.round((Date.now() - pending.createdAt.getTime()) / 1000)}s`
  );

  const inboundMessage = await findMatchingInboundMessage(
    pending.walletAddress,
    masterWalletAddress,
    pending.amount,
    pending.createdAt,
  );

  if (!inboundMessage?.in_msg_tx_hash) {
    console.log(`[ton-verification] No inbound message found yet for transaction ${transactionId}`);
    return { status: 'pending' as const };
  }

  console.log(`[ton-verification] Found inbound message for ${transactionId}, hash=${inboundMessage.in_msg_tx_hash}`);

  const existingVerified = await prisma.transaction.findFirst({
    where: {
      id: { not: pending.id },
      onchainTxHash: inboundMessage.in_msg_tx_hash,
      status: 'completed',
    },
  });

  if (existingVerified) {
    console.warn(
      `[ton-verification] Double-spend detected! Transaction ${transactionId} attempted to use ` +
      `already-verified hash ${inboundMessage.in_msg_tx_hash} (previous tx: ${existingVerified.id})`
    );
    await prisma.transaction.update({
      where: { id: pending.id },
      data: {
        status: 'failed',
      },
    });
    return { status: 'failed' as const, error: 'This blockchain transaction was already used for another top-up.' };
  }

  const onchainTransaction = await fetchTransactionByHash(inboundMessage.in_msg_tx_hash);

  if (!onchainTransaction) {
    console.log(`[ton-verification] On-chain transaction ${inboundMessage.in_msg_tx_hash} not found yet (may be emulated)`);
    return { status: 'pending' as const };
  }

  if (!isSuccessfulTransaction(onchainTransaction)) {
    console.warn(
      `[ton-verification] On-chain transaction failed for ${transactionId}. ` +
      `Hash=${inboundMessage.in_msg_tx_hash}, ` +
      `emulated=${onchainTransaction.emulated}, ` +
      `aborted=${onchainTransaction.description?.aborted}`
    );
    await prisma.transaction.update({
      where: { id: pending.id },
      data: {
        status: 'failed',
      },
    });
    return { status: 'failed' as const, error: 'Transaction failed on blockchain. Please check your wallet and try again.' };
  }

  console.log(`[ton-verification] Transaction successful! Crediting user for ${transactionId}`);

  const [user, verifiedTransaction] = await prisma.$transaction([
    prisma.user.upsert({
      where: { walletAddress: pending.walletAddress },
      update: {
        credits: { increment: pending.credits },
        totalTopups: { increment: pending.amount },
      },
      create: {
        walletAddress: pending.walletAddress,
        credits: pending.credits,
        totalTopups: pending.amount,
      },
    }),
    prisma.transaction.update({
      where: { id: pending.id },
      data: {
        status: 'completed',
        onchainTxHash: inboundMessage.in_msg_tx_hash,
        verifiedAt: new Date(),
      },
    }),
  ]);

  console.log(`[ton-verification] Completed! User now has ${user.credits} credits`);

  return {
    status: 'completed' as const,
    wallet: {
      walletAddress: user.walletAddress,
      credits: user.credits,
      totalTopups: user.totalTopups,
    },
    transaction: verifiedTransaction,
  };
}
