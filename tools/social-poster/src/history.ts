// =============================================================================
// 投稿履歴管理
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { PostHistoryEntry, GeneratedContent, PostResult, Platform, ContentType } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = resolve(__dirname, '..', '.history');
const HISTORY_FILE = resolve(HISTORY_DIR, 'posts.json');

function ensureHistoryDir(): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function loadHistory(): PostHistoryEntry[] {
  ensureHistoryDir();
  if (!existsSync(HISTORY_FILE)) return [];
  const content = readFileSync(HISTORY_FILE, 'utf-8');
  return JSON.parse(content) as PostHistoryEntry[];
}

function saveHistory(entries: PostHistoryEntry[]): void {
  ensureHistoryDir();
  writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

/**
 * 投稿履歴を記録
 */
export function recordPost(
  platform: Platform,
  contentType: ContentType,
  content: GeneratedContent,
  results: PostResult[],
): PostHistoryEntry {
  const entries = loadHistory();
  const entry: PostHistoryEntry = {
    id: randomUUID(),
    generatedAt: content.generatedAt,
    postedAt: new Date().toISOString(),
    platform,
    contentType,
    content,
    results,
  };
  entries.push(entry);

  // 直近 200 件のみ保持
  const trimmed = entries.slice(-200);
  saveHistory(trimmed);
  return entry;
}

/**
 * 投稿履歴を取得
 */
export function getHistory(limit = 20): PostHistoryEntry[] {
  return loadHistory().slice(-limit).reverse();
}

/**
 * 今日の投稿数を取得（レートリミット用）
 */
export function getTodayPostCount(platform: 'twitter' | 'note'): number {
  const today = new Date().toISOString().slice(0, 10);
  return loadHistory().filter(
    e => e.postedAt?.startsWith(today) && e.results.some(r => r.platform === platform && r.success),
  ).length;
}
