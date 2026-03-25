import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

function normalizeUrl(urlStr: string): string {
  try {
    let processedUrl = urlStr.trim();
    // Add protocol if missing
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl;
    }
    const url = new URL(processedUrl);
    url.hash = ''; // Remove fragment
    let href = url.href;
    if (href.endsWith('/')) {
      href = href.slice(0, -1);
    }
    return href;
  } catch {
    throw new Error(`Invalid URL: ${urlStr}`);
  }
}

export async function extractFromUrl(
  startUrl: string,
  maxDepth: number = 2,
  globalState?: { visited: Set<string>; pageCount: number; maxPages: number }
): Promise<string> {
  const state = globalState || {
    visited: new Set<string>(),
    pageCount: 0,
    maxPages: 10,
  };

  const normalizedStartUrl = normalizeUrl(startUrl);

  // If we already visited or reached max pages, abort
  if (state.visited.has(normalizedStartUrl) || state.pageCount >= state.maxPages) {
    return '';
  }

  state.visited.add(normalizedStartUrl);
  state.pageCount++;

  try {
    const response = await fetch(normalizedStartUrl);
    if (!response.ok) return '';
    const html = await response.text();
    const $ = cheerio.load(html);

    // Find links before we remove nav/header etc.
    const linksToFollow: string[] = [];
    if (maxDepth > 0 && state.pageCount < state.maxPages) {
      let baseDomain = '';
      try {
        baseDomain = new URL(normalizedStartUrl).hostname;
      } catch (e) {
        // ignore invalid URL
      }

      if (baseDomain) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          try {
            // resolve relative URLs
            const resolvedUrl = new URL(href, normalizedStartUrl);

            // Only follow HTTP(S) and same domain
            if (
              (resolvedUrl.protocol === 'http:' || resolvedUrl.protocol === 'https:') &&
              resolvedUrl.hostname === baseDomain
            ) {
              linksToFollow.push(resolvedUrl.href);
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        });
      }
    }

    // Remove scripts, styles, and common nav/footer elements to get clean text
    $('script, style, nav, footer, header, noscript').remove();
    
    // Prioritize main content areas if they exist, otherwise use body
    const contentArea = $('main, article, #content, .content, #main, .main').first();
    const text = contentArea.length > 0 ? contentArea.text() : $('body').text();

    let extractedText = `\n\n--- Source: ${normalizedStartUrl} ---\n`;
    extractedText += text.replace(/\s+/g, ' ').trim();

    // Deduplicate links to follow
    const uniqueLinks = Array.from(new Set(linksToFollow.map(normalizeUrl)));

    // Recursively extract from links (sequentially to strictly respect maxPages, or concurrently if we manually handle limits)
    // We do it sequentially here to accurately respect `state.pageCount < state.maxPages`
    for (const link of uniqueLinks) {
      if (state.pageCount >= state.maxPages) break;
      const childText = await extractFromUrl(link, maxDepth - 1, state);
      if (childText) {
        extractedText += childText;
      }
    }

    return extractedText;
  } catch (error) {
    console.error(`Error extracting from URL ${normalizedStartUrl}:`, error);
    return '';
  }
}

export async function extractFromFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.name.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    } 
    
    if (file.name.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (file.name.toLowerCase().endsWith('.txt')) {
      return buffer.toString('utf-8');
    }

    if (file.name.toLowerCase().endsWith('.csv')) {
      return buffer.toString('utf-8');
    }

    return '';
  } catch (error) {
    console.error(`Error extracting from file ${file.name}:`, error);
    return '';
  }
}
