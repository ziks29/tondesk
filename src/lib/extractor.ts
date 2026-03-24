import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function extractFromUrl(url: string): Promise<string> {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL protocol');
    }

    // Basic SSRF protection (hostname checks)
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.local')
    ) {
      throw new Error('Forbidden URL target');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return '';
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and common nav/footer elements to get clean text
    $('script, style, nav, footer, header, noscript').remove();
    
    // Prioritize main content areas if they exist, otherwise use body
    const contentArea = $('main, article, #content, .content, #main, .main').first();
    const text = contentArea.length > 0 ? contentArea.text() : $('body').text();

    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`Error extracting from URL ${url}:`, error);
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

    return '';
  } catch (error) {
    console.error(`Error extracting from file ${file.name}:`, error);
    return '';
  }
}
