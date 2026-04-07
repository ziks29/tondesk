import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SEARCH_BOT_RE = /googlebot|bingbot|duckduckbot|yahoo.*slurp|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver|semrushbot|ahrefsbot|mj12bot/i;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const ua = request.headers.get('user-agent') ?? '';
    if (SEARCH_BOT_RE.test(ua)) {
      return NextResponse.redirect(new URL('/web', request.url), { status: 301 });
    }
  }
}

export const config = {
  matcher: '/',
};
