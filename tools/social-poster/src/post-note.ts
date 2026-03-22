#!/usr/bin/env npx tsx
// note.com 投稿スクリプト（Playwright）
// 使い方: npx tsx src/post-note.ts [stockId]

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stockPath = resolve(__dirname, '..', '.stock', 'content.json');

// ストックから記事を取得
const stockId = process.argv[2];
const items = JSON.parse(readFileSync(stockPath, 'utf-8'));

let target: any;
if (stockId) {
  target = items.find((i: any) => i.id === stockId || i.id.startsWith(stockId));
} else {
  // note 記事の下書きを一覧表示
  const noteItems = items.filter((i: any) => i.platform === 'note' && i.status === 'draft');
  if (noteItems.length === 0) {
    console.log('投稿可能な note 記事がありません。');
    process.exit(0);
  }
  console.log('\n投稿可能な note 記事:\n');
  noteItems.forEach((item: any, idx: number) => {
    console.log(`  ${idx + 1}. [${item.id.slice(0, 8)}] ${item.content.note?.title}`);
  });
  console.log('\n使い方: npx tsx src/post-note.ts <ID の先頭8文字>\n');
  process.exit(0);
}

if (!target || !target.content.note) {
  console.error('記事が見つかりません: ' + stockId);
  process.exit(1);
}

const note = target.content.note;
console.log('\n投稿する記事: ' + note.title);
console.log('タグ: ' + note.tags.join(', '));
console.log('');

// ブラウザ起動
console.log('ブラウザを起動中...');
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});

await ctx.addCookies([{
  name: '_note_session_v5',
  value: env.note.sessionCookie,
  domain: '.note.com',
  path: '/',
  httpOnly: true,
  secure: true,
}]);

const page = await ctx.newPage();

// 投稿画面を開く
console.log('note.com 投稿画面を開いています...');
await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 30000 });

if (page.url().includes('/login')) {
  console.error('ログインできませんでした。セッション Cookie を更新してください。');
  await browser.close();
  process.exit(1);
}

console.log('エディタ読み込み完了: ' + page.url());

// 少し待ってエディタの初期化を待つ
await page.waitForTimeout(2000);

// タイトル入力
console.log('タイトルを入力中...');
try {
  // note.com のエディタ構造を探索
  const allTextareas = await page.locator('textarea').all();
  console.log('  textarea 数: ' + allTextareas.length);

  if (allTextareas.length > 0) {
    await allTextareas[0].click();
    await allTextareas[0].fill(note.title);
    console.log('  タイトル入力完了');
  } else {
    // contenteditable を探す
    await page.keyboard.type(note.title, { delay: 15 });
    console.log('  タイトル入力完了（キーボード）');
  }
} catch (e: any) {
  console.log('  タイトル入力エラー: ' + e.message);
}

// 本文入力
console.log('本文を入力中...');
await page.keyboard.press('Tab');
await page.waitForTimeout(500);

// Markdown をプレーンテキストに変換して入力
const lines = note.body.split('\n');
for (const line of lines) {
  if (line.trim() === '') {
    await page.keyboard.press('Enter');
    continue;
  }

  let clean = line
    .replace(/^#{1,6}\s+/, '')       // 見出し記法を除去
    .replace(/\*\*(.+?)\*\*/g, '$1') // 太字記法を除去
    .replace(/\*(.+?)\*/g, '$1')     // 斜体記法を除去
    .replace(/^- /, '・ ')           // リストを中点に
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)'); // リンク

  await page.keyboard.type(clean, { delay: 3 });
  await page.keyboard.press('Enter');
}

console.log('  本文入力完了');

// スクリーンショットで確認
await page.screenshot({ path: resolve(__dirname, '..', 'note_preview.png'), fullPage: true });
console.log('\nプレビュー画像: tools/social-poster/note_preview.png');

console.log('\n========================================');
console.log('入力が完了しました。');
console.log('ブラウザで内容を確認し、');
console.log('問題なければ note.com 上で「公開」してください。');
console.log('タグの追加もブラウザ上で行えます。');
console.log('========================================\n');
console.log('ブラウザを閉じるとスクリプトが終了します。');

// ブラウザが閉じられるまで待機
await new Promise<void>((resolve) => {
  const check = setInterval(async () => {
    try {
      await browser.contexts();
    } catch {
      clearInterval(check);
      resolve();
    }
  }, 1000);
});

console.log('完了');
