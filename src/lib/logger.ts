/**
 * Debug logger with dev/prod modes.
 *
 * In development: all logs are shown (debug, info, warn, error).
 * In production:  only warn and error are shown.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.debug('[MIC]', 'Sending chunk', chunkSize);
 *   log.info('[GEMINI]', 'Connected');
 *   log.warn('[GEMINI]', 'Session closed');
 *   log.error('[GEMINI]', 'Connection failed', err);
 */

const isDev = process.env.NODE_ENV === 'development';

function noop() {}

export const log = {
  /** Verbose debug info — only in dev */
  debug: isDev ? console.log.bind(console) : noop,

  /** General info — only in dev */
  info: isDev ? console.info.bind(console) : noop,

  /** Warnings — always shown */
  warn: console.warn.bind(console),

  /** Errors — always shown */
  error: console.error.bind(console),
};
