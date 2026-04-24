import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    await requireTelegramAuth();

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    const ownerWallet = searchParams.get('ownerWallet');
    const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') ?? '20'), 1),
      50,
    );

    if (!botId || !ownerWallet) {
      return NextResponse.json({ error: 'Missing botId or ownerWallet' }, { status: 400 });
    }

    const bot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized to view this bot' }, { status: 403 });
    }

    // Execute independent read operations concurrently to reduce database latency
    const [countResult, chatSummaries] = await Promise.all([
      // Efficient distinct chat count using raw SQL
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "chatId") as count FROM "Interaction" WHERE "botId" = ${botId}
      `,
      // Get paginated chat groups, sorted by most recent interaction
      prisma.interaction.groupBy({
        by: ['chatId'],
        where: { botId },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: 'desc' } },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
    ]);
    const totalChats = Number(countResult[0]?.count ?? 0);

    const chatIds = chatSummaries.map((s) => s.chatId);

    // Early return to prevent unnecessary database queries when there are no chats
    if (chatIds.length === 0) {
      return NextResponse.json({
        ok: true,
        chatGroups: [],
        totalChats,
        page,
        pageSize,
        totalPages: 0,
      });
    }

    // Fetch interactions for this page's chats only
    const interactions = await prisma.interaction.findMany({
      where: { botId, chatId: { in: chatIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by chatId
    const grouped = interactions.reduce(
      (acc, interaction) => {
        if (!acc[interaction.chatId]) acc[interaction.chatId] = [];
        acc[interaction.chatId].push(interaction);
        return acc;
      },
      {} as Record<string, typeof interactions>,
    );

    // Preserve the sort order from chatSummaries (most recent chat first)
    const chatGroups = chatIds.map((chatId) => {
      const items = grouped[chatId] ?? [];
      return {
        chatId,
        interactions: items,
        lastInteractionAt: items[items.length - 1]?.createdAt ?? new Date(),
        messageCount: items.length,
      };
    });

    return NextResponse.json({
      ok: true,
      chatGroups,
      totalChats,
      page,
      pageSize,
      totalPages: Math.ceil(totalChats / pageSize),
    });
  } catch (error) {
    console.error('Get interactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}
