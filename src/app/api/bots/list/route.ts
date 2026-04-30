import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    await requireTelegramAuth();

    const { searchParams } = new URL(request.url);
    const ownerWallet = searchParams.get('wallet');

    if (!ownerWallet) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    const bots = await prisma.bot.findMany({
      where: { ownerWallet: ownerWallet as string },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { interactions: true },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Fetch unique users for all bots belonging to this owner in a single query
    const botIds = bots.map((bot) => bot.id);
    const uniqueUserCounts: Record<string, number> = {};

    if (botIds.length > 0) {
      const countsResult = await prisma.$queryRaw<Array<{ botId: string; count: bigint }>>`
        SELECT "botId", COUNT(DISTINCT "chatId") as count
        FROM "Interaction"
        WHERE "botId" IN (${Prisma.join(botIds)})
        GROUP BY "botId"
      `;
      for (const row of countsResult) {
        uniqueUserCounts[row.botId] = Number(row.count);
      }
    }

    const enrichedBots = bots.map((bot) => ({
      ...bot,
      totalInteractions: bot._count.interactions,
      totalUniqueUsers: uniqueUserCounts[bot.id] || 0,
    }));

    return NextResponse.json({ ok: true, bots: enrichedBots });
  } catch (error) {
    console.error('List bots error:', error);
    return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
  }
}
