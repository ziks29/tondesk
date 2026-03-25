import { parse } from '@tma.js/init-data-node';
import { headers } from 'next/headers';

import { validateTmaAuth } from '@/lib/auth';

export type TelegramAuthContext = {
  authData: string;
  requestHeaders: Headers;
  telegramUserId: string | null;
  telegramUsername: string | null;
};

export async function requireTelegramAuth(): Promise<TelegramAuthContext> {
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get('authorization');
  const [authType, authData = ''] = (authHeader || '').split(' ');

  if (authType !== 'tma' || !authData) {
    throw new Error('Unauthorized: missing or invalid tma auth header');
  }

  const platformBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!platformBotToken) {
    throw new Error('Server misconfiguration');
  }

  validateTmaAuth(authData, platformBotToken);

  const parsed = parse(authData);

  return {
    authData,
    requestHeaders,
    telegramUserId: parsed.user ? String(parsed.user.id) : null,
    telegramUsername: parsed.user?.username ?? null,
  };
}
