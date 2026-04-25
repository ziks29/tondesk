import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';
import { verifyPendingTopup } from '@/lib/ton-verification';

export async function GET(request: Request) {
  try {
    await requireTelegramAuth();

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS;
    if (masterWalletAddress) {
      const pendingTopups = await prisma.transaction.findMany({
        where: {
          walletAddress,
          type: 'topup',
          status: 'pending',
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      await Promise.allSettled(
        pendingTopups.map((tx) => verifyPendingTopup(tx.id, masterWalletAddress)),
      );
    }

    // ⚡ Bolt Optimization: Parallelize independent DB queries.
    // 💡 What: Replaced sequential upsert and count queries with Promise.all.
    // 🎯 Why: Reduces latency from O(A+B) to O(max(A, B)).
    // 📊 Impact: Lowers endpoint TTFB by completing both queries concurrently.
    const [user, botCount] = await Promise.all([
      prisma.user.upsert({
        where: { walletAddress },
        update: {},
        create: { walletAddress },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.bot.count({
        where: {
          OR: [
            { userWalletAddress: walletAddress },
            { ownerWallet: walletAddress },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      wallet: {
        walletAddress: user.walletAddress,
        credits: user.credits,
        totalTopups: user.totalTopups,
        botCount,
        transactions: user.transactions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch wallet';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
