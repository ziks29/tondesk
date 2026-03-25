import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    await requireTelegramAuth();

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    // Verify the bot belongs to the authenticated user
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Fetch all interactions for this bot
    const interactions = await prisma.interaction.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });

    // Group interactions by chatId
    const groupedByChatId = interactions.reduce(
      (acc, interaction) => {
        if (!acc[interaction.chatId]) {
          acc[interaction.chatId] = [];
        }
        acc[interaction.chatId].push(interaction);
        return acc;
      },
      {} as Record<string, typeof interactions>
    );

    // Sort each chat's interactions by createdAt ascending (oldest first)
    Object.keys(groupedByChatId).forEach((chatId) => {
      groupedByChatId[chatId].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    // Convert to array and sort by most recent interaction
    const chatGroups = Object.entries(groupedByChatId)
      .map(([chatId, items]) => ({
        chatId,
        interactions: items,
        lastInteractionAt: items[items.length - 1]?.createdAt || new Date(),
        messageCount: items.length,
      }))
      .sort(
        (a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()
      );

    return NextResponse.json({ ok: true, chatGroups, totalInteractions: interactions.length });
  } catch (error) {
    console.error('Get interactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}
