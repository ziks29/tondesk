import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function extractFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
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
