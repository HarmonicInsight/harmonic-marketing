// =============================================================================
// コンテンツストック管理 — 事前生成 → 承認 → 投稿ワークフロー
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { GeneratedContent, ContentType, Tone, Platform } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STOCK_DIR = resolve(__dirname, '..', '.stock');
const STOCK_FILE = resolve(STOCK_DIR, 'content.json');

/** ストックアイテムのステータス */
export type StockStatus = 'draft' | 'approved' | 'rejected' | 'posted';

/** ストックアイテム */
export interface StockItem {
  id: string;
  status: StockStatus;
  contentType: ContentType;
  tone: Tone;
  platform: Platform;
  topic?: string;
  content: GeneratedContent;
  createdAt: string;
  approvedAt?: string;
  postedAt?: string;
  /** 手動で編集されたテキスト（Twitter） */
  editedTwitterText?: string;
  /** 手動で編集されたタイトル（note） */
  editedNoteTitle?: string;
}

function ensureStockDir(): void {
  if (!existsSync(STOCK_DIR)) {
    mkdirSync(STOCK_DIR, { recursive: true });
  }
}

function loadStock(): StockItem[] {
  ensureStockDir();
  if (!existsSync(STOCK_FILE)) return [];
  const raw = readFileSync(STOCK_FILE, 'utf-8');
  return JSON.parse(raw) as StockItem[];
}

function saveStock(items: StockItem[]): void {
  ensureStockDir();
  writeFileSync(STOCK_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

/**
 * 生成したコンテンツをストックに追加
 */
export function addToStock(
  content: GeneratedContent,
  contentType: ContentType,
  tone: Tone,
  platform: Platform,
  topic?: string,
): StockItem {
  const items = loadStock();
  const item: StockItem = {
    id: randomUUID(),
    status: 'draft',
    contentType,
    tone,
    platform,
    topic,
    content,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  saveStock(items);
  return item;
}

/**
 * ストック一覧を取得
 */
export function getStock(filter?: {
  status?: StockStatus;
  platform?: Platform;
  contentType?: ContentType;
  limit?: number;
}): StockItem[] {
  let items = loadStock();

  if (filter?.status) {
    items = items.filter(i => i.status === filter.status);
  }
  if (filter?.platform && filter.platform !== 'all') {
    items = items.filter(i => i.platform === filter.platform || i.platform === 'all');
  }
  if (filter?.contentType) {
    items = items.filter(i => i.contentType === filter.contentType);
  }

  // 新しい順
  items.reverse();

  if (filter?.limit) {
    items = items.slice(0, filter.limit);
  }

  return items;
}

/**
 * ストックアイテムを取得
 */
export function getStockItem(id: string): StockItem | undefined {
  return loadStock().find(i => i.id === id);
}

/**
 * ストックアイテムのステータスを更新
 */
export function updateStockStatus(id: string, status: StockStatus): StockItem | undefined {
  const items = loadStock();
  const item = items.find(i => i.id === id);
  if (!item) return undefined;

  item.status = status;
  if (status === 'approved') item.approvedAt = new Date().toISOString();
  if (status === 'posted') item.postedAt = new Date().toISOString();

  saveStock(items);
  return item;
}

/**
 * ストックアイテムのテキストを編集
 */
export function editStockItem(id: string, updates: {
  twitterText?: string;
  noteTitle?: string;
}): StockItem | undefined {
  const items = loadStock();
  const item = items.find(i => i.id === id);
  if (!item) return undefined;

  if (updates.twitterText !== undefined) {
    item.editedTwitterText = updates.twitterText;
  }
  if (updates.noteTitle !== undefined) {
    item.editedNoteTitle = updates.noteTitle;
  }

  saveStock(items);
  return item;
}

/**
 * ストックアイテムを削除
 */
export function deleteStockItem(id: string): boolean {
  const items = loadStock();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  saveStock(items);
  return true;
}

/**
 * ストックの統計
 */
export function getStockStats(): Record<StockStatus, number> {
  const items = loadStock();
  return {
    draft: items.filter(i => i.status === 'draft').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    posted: items.filter(i => i.status === 'posted').length,
  };
}
