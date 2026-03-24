import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { botId, ownerWallet, knowledgeBaseText } = await request.json();

    if (!botId || !ownerWallet || !knowledgeBaseText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (knowledgeBaseText.trim().length < 10) {
      return NextResponse.json({ error: 'Knowledge base is empty or too small.' }, { status: 400 });
    }

    const existingBot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (existingBot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized to edit this bot' }, { status: 403 });
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: { knowledgeBaseText },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Edit bot error:', error);
    return NextResponse.json({ error: 'Failed to edit bot' }, { status: 500 });
  }
}
