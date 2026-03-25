import { validate } from '@tma.js/init-data-node';

/**
 * Validates the Telegram Mini App (TMA) authentication data.
 * In development mode, validation is skipped to allow for local testing with mocked data.
 */
export function validateTmaAuth(authData: string, botToken: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[AUTH] Skipping TMA auth validation in development mode');
    return;
  }
  
  validate(authData, botToken);
}
