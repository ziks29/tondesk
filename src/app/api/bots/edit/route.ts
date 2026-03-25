import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractFromFile, extractFromUrl } from '@/lib/extractor';
import { requireTelegramAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    await requireTelegramAuth();

    const formData = await request.formData();
    const botId = formData.get('botId') as string;
    const ownerWallet = formData.get('ownerWallet') as string;
    const manualText = formData.get('knowledgeBaseText') as string;
    const aiModel = formData.get('aiModel') as string || 'google/gemini-2.0-flash-001';
    const systemPrompt = formData.get('systemPrompt') as string | null;
    const welcomeMessage = formData.get('welcomeMessage') as string | null;
    const webSearchEnabled = formData.get('webSearchEnabled') === 'true';
    const crawlMaxDepth = parseInt(formData.get('crawlMaxDepth') as string) || 2;
    const crawlMaxPages = parseInt(formData.get('crawlMaxPages') as string) || 10;
    const urlsJson = formData.get('urls') as string;
    const uploadedFiles = formData.getAll('files') as File[];

    if (!botId || !ownerWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingBot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (existingBot.ownerWallet !== ownerWallet) {
      return NextResponse.json({ error: 'Unauthorized to edit this bot' }, { status: 403 });
    }

    // Extraction Step
    let extractedText = manualText ? manualText.trim() : '';
    const crawledUrls: string[] = [];

    // Parse and handle URLs
    const globalState = {
      visited: new Set<string>(),
      pageCount: 0,
      maxPages: crawlMaxPages,
    };

    if (urlsJson) {
      try {
        const urls = JSON.parse(urlsJson) as string[];
        for (const url of urls) {
          if (globalState.pageCount >= globalState.maxPages) break;
          try {
            // Process sequentially to respect global limits strictly
            const content = await extractFromUrl(url, crawlMaxDepth, globalState);
            if (content) {
              extractedText += `\n\n[Crawl Results for: ${url}]${content}`;
              crawledUrls.push(url);
            }
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Failed to extract from URL';
            console.error(`Error extracting from URL ${url}:`, errorMsg);
            return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
          }
        }
      } catch (e) {
        console.error('Error parsing URLs JSON:', e);
      }
    }

    // Handle Files
    const filePromises: Promise<void>[] = [];
    for (const file of uploadedFiles) {
      filePromises.push(
        extractFromFile(file).then(content => {
          if (content) extractedText += `\n\n[Content from File: ${file.name}]\n${content}`;
        })
      );
    }

    // Process files concurrently
    await Promise.all(filePromises);

    if (extractedText.trim().length < 10) {
      return NextResponse.json({ error: 'Knowledge base is empty or too small.' }, { status: 400 });
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: {
        knowledgeBaseText: extractedText,
        crawledUrls: JSON.stringify(crawledUrls),
        aiModel,
        systemPrompt: systemPrompt || null,
        welcomeMessage: welcomeMessage || null,
        webSearchEnabled,
        crawlMaxDepth,
        crawlMaxPages,
      },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Edit bot error:', error);
    return NextResponse.json({ error: 'Failed to edit bot' }, { status: 500 });
  }
}
