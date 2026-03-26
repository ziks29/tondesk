import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB per crawled page
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds per URL

function isPrivateHost(hostname: string): boolean {
  // Block loopback, link-local, and RFC-1918 private ranges
  return /^(localhost|127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:)/i.test(
    hostname,
  );
}

async function safeFetch(url: string): Promise<Response> {
  const { hostname } = new URL(url);
  if (isPrivateHost(hostname)) {
    throw new Error(`Blocked private/internal URL: ${url}`);
  }

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }

  return response;
}

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
    const response = await safeFetch(normalizedStartUrl);
    if (!response.ok) return '';

    // Cap response body to avoid loading multi-MB pages into memory
    const reader = response.body?.getReader();
    if (!reader) return '';
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      totalBytes += value.length;
      if (totalBytes > MAX_RESPONSE_BYTES) { reader.cancel(); break; }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function detectFileType(buf: Buffer): 'pdf' | 'docx' | 'text' | 'unknown' {
  // PDF magic: %PDF  (25 50 44 46)
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return 'pdf';
  }
  // ZIP/DOCX magic: PK (50 4B 03 04)
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) {
    return 'docx';
  }
  // TXT / CSV — no magic bytes; allow extension check only
  return 'text';
}

export async function extractFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    console.error(`File ${file.name} exceeds size limit (${file.size} bytes)`);
    return '';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase();

    if (ext.endsWith('.pdf')) {
      if (detectFileType(buffer) !== 'pdf') {
        console.error(`File ${file.name} failed PDF magic-byte check`);
        return '';
      }
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }

    if (ext.endsWith('.docx')) {
      if (detectFileType(buffer) !== 'docx') {
        console.error(`File ${file.name} failed DOCX magic-byte check`);
        return '';
      }
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (ext.endsWith('.txt') || ext.endsWith('.csv')) {
      return buffer.toString('utf-8');
    }

    return '';
  } catch (error) {
    console.error(`Error extracting from file ${file.name}:`, error);
    return '';
  }
}
