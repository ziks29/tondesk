const fs = require('fs');
const content = fs.readFileSync('src/app/api/bots/edit/route.ts', 'utf8');

const newContent = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractFromFile, extractFromUrl } from '@/lib/extractor';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const botId = formData.get('botId') as string;
    const ownerWallet = formData.get('ownerWallet') as string;
    const manualText = formData.get('knowledgeBaseText') as string;
    const systemPrompt = formData.get('systemPrompt') as string | null;
    const welcomeMessage = formData.get('welcomeMessage') as string | null;
    const urlsJson = formData.get('urls') as string;
    const uploadedFiles = formData.getAll('files') as File[];

    if (!botId || !ownerWallet || !manualText) {
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
    let extractedText = manualText || '';

    // Parse and handle URLs
    const globalState = {
      visited: new Set<string>(),
      pageCount: 0,
      maxPages: 10,
    };

    if (urlsJson) {
      try {
        const urls = JSON.parse(urlsJson) as string[];
        for (const url of urls) {
          if (globalState.pageCount >= globalState.maxPages) break;
          // Process sequentially to respect global limits strictly
          const content = await extractFromUrl(url, 2, globalState);
          if (content) extractedText += \`\\n\\n[Crawl Results for: \${url}]\${content}\`;
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
          if (content) extractedText += \`\\n\\n[Content from File: \${file.name}]\\n\${content}\`;
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
        systemPrompt: systemPrompt || null,
        welcomeMessage: welcomeMessage || null,
      },
    });

    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    console.error('Edit bot error:', error);
    return NextResponse.json({ error: 'Failed to edit bot' }, { status: 500 });
  }
}
`;

fs.writeFileSync('src/app/api/bots/edit/route.ts', newContent);
