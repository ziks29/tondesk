import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || '';
  const protocol = requestHeaders.get('x-forwarded-proto') || 'https';
  const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : '');

  return NextResponse.json({
    url: origin,
    name: 'TonDesk',
    iconUrl: origin ? `${origin}/logo.png` : '/logo.png',
  });
}
