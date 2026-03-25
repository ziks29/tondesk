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

  if (transaction.description?.aborted) {
    return false;
  }

  const action = transaction.description?.action;
  if (action && (action.success === false || action.valid === false || action.no_funds === true)) {
    return false;
  }

  const compute = transaction.description?.compute_ph;
  if (compute && (compute.success === false || compute.exit_code && compute.exit_code !== 0)) {
    return false;
  }

  return true;
}

export async function verifyPendingTopup(transactionId: string, masterWalletAddress: string) {
  const pending = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!pending || pending.type !== 'topup') {
    throw new Error('Top-up not found');
  }

  if (pending.status === 'completed') {
    return { status: 'completed' as const, transaction: pending };
  }

  const inboundMessage = await findMatchingInboundMessage(
    pending.walletAddress,
    masterWalletAddress,
    pending.amount,
    pending.createdAt,
  );

  if (!inboundMessage?.in_msg_tx_hash) {
    return { status: 'pending' as const };
  }

  const existingVerified = await prisma.transaction.findFirst({
    where: {
      id: { not: pending.id },
      onchainTxHash: inboundMessage.in_msg_tx_hash,
      status: 'completed',
    },
  });

  if (existingVerified) {
    await prisma.transaction.update({
      where: { id: pending.id },
      data: {
        status: 'failed',
      },
    });
    return { status: 'failed' as const, error: 'This blockchain transaction was already used for another top-up.' };
  }

  const onchainTransaction = await fetchTransactionByHash(inboundMessage.in_msg_tx_hash);
  if (!isSuccessfulTransaction(onchainTransaction)) {
    return { status: 'pending' as const };
  }

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
