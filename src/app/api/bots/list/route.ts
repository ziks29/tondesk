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
    const botIds = bots.map((b: any) => b.id);
    const uniqueUsersGroups = await prisma.interaction.groupBy({
      by: ['botId', 'chatId'],
      where: { botId: { in: botIds } },
    });

    const uniqueUserCounts: Record<string, number> = {};
    for (const group of uniqueUsersGroups) {
      uniqueUserCounts[group.botId] = (uniqueUserCounts[group.botId] || 0) + 1;
    }

    const enrichedBots = bots.map((bot: any) => ({
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
