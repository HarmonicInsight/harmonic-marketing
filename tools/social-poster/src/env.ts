// =============================================================================
// 環境変数の読み込み
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

/** .env ファイルを手動パース（dotenv 依存なし） */
function loadEnvFile(): void {
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

export function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(
      `環境変数 ${key} が設定されていません。.env ファイルを確認してください。\n` +
      `参考: .env.example`,
    );
  }
  return value ?? '';
}

export const env = {
  twitter: {
    get apiKey() { return getEnv('TWITTER_API_KEY'); },
    get apiSecret() { return getEnv('TWITTER_API_SECRET'); },
    get accessToken() { return getEnv('TWITTER_ACCESS_TOKEN'); },
    get accessTokenSecret() { return getEnv('TWITTER_ACCESS_TOKEN_SECRET'); },
  },
  note: {
    get sessionCookie() { return getEnv('NOTE_SESSION_COOKIE'); },
    get username() { return getEnv('NOTE_USERNAME'); },
  },
  get anthropicApiKey() { return getEnv('ANTHROPIC_API_KEY'); },
};
