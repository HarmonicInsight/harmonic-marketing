#!/usr/bin/env npx tsx
// =============================================================================
// ブログ記事 → note.com 一括下書き投稿スクリプト（Playwright 版）
// =============================================================================
//
// 使い方:
//   npx tsx src/batch-blog-to-note.ts                # 全記事を下書き投稿
//   npx tsx src/batch-blog-to-note.ts --dry-run      # プレビューのみ
//   npx tsx src/batch-blog-to-note.ts --index 0      # 特定の記事のみ
//
// =============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { env } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = resolve('C:/dev/web-site-corporate/_merged/site-insight-blog/content/posts');

// =============================================================================
// MDX パーサー
// =============================================================================

interface BlogFrontmatter {
  title: string;
  subtitle?: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  author: string;
}

function parseMdx(filePath: string): { frontmatter: BlogFrontmatter; body: string } {
  const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!fmMatch) {
    throw new Error(`frontmatter が見つかりません: ${filePath}`);
  }

  const fmRaw = fmMatch[1];
  const body = fmMatch[2].trim();

  const fm: Record<string, any> = {};
  for (const line of fmRaw.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      let value = match[2].trim();
      value = value.replace(/^['"]|['"]$/g, '');
      if (value.startsWith('[')) {
        fm[match[1]] = value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } else {
        fm[match[1]] = value;
      }
    }
  }

  return {
    frontmatter: {
      title: fm.title ?? '',
      subtitle: fm.subtitle,
      date: fm.date ?? '',
      category: fm.category ?? '',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      excerpt: fm.excerpt ?? '',
      author: fm.author ?? '',
    },
    body,
  };
}

// =============================================================================
// Markdown → プレーンテキスト変換
// =============================================================================

function markdownToPlainLines(md: string): string[] {
  return md.split('\n').map(line => {
    return line
      .replace(/^#{1,6}\s+/, '')           // 見出し記法を除去
      .replace(/\*\*(.+?)\*\*/g, '$1')     // 太字
      .replace(/\*(.+?)\*/g, '$1')         // 斜体
      .replace(/^- /, '・')               // リスト
      .replace(/^> /, '｜')               // 引用
      .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)'); // リンク
  });
}

// =============================================================================
// note.com 用フッター
// =============================================================================

function addNoteFooter(body: string): string {
  return body + `

---

この記事は HARMONIC insight 公式ブログ（https://h-insight.jp/blog）からの転載です。

HARMONIC insight では、AI × 業務設計をテーマに、企業の DX 推進を支援しています。`;
}

// =============================================================================
// 1記事を note.com に下書き投稿（Playwright）
// =============================================================================

async function postDraft(
  context: BrowserContext,
  title: string,
  body: string,
  index: number,
  total: number,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const page = await context.newPage();

  try {
    // 投稿画面を開く
    console.log(`    投稿画面を開いています...`);
    await page.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 30000 });

    if (page.url().includes('/login')) {
      throw new Error('ログインできていません。ブラウザでログインしてください。');
    }

    // エディタの初期化待ち
    await page.waitForTimeout(2000);

    // タイトル入力
    console.log(`    タイトルを入力中...`);
    const titleSelectors = [
      'textarea[placeholder*="タイトル"]',
      'textarea[placeholder*="記事タイトル"]',
      '.p-editor__title textarea',
      'textarea.o-noteContentHeader__title',
    ];

    let titleFilled = false;
    for (const sel of titleSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await el.fill(title);
          titleFilled = true;
          break;
        }
      } catch { /* next */ }
    }

    if (!titleFilled) {
      // フォールバック: 最初の textarea を探す
      const textareas = await page.locator('textarea').all();
      if (textareas.length > 0) {
        await textareas[0].click();
        await textareas[0].fill(title);
        titleFilled = true;
      }
    }

    if (!titleFilled) {
      throw new Error('タイトル入力欄が見つかりませんでした');
    }

    // 本文入力
    console.log(`    本文を入力中（${body.length} 文字）...`);

    // Tab で本文欄に移動
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // 本文をプレーンテキストに変換して入力
    const fullBody = addNoteFooter(body);
    const lines = markdownToPlainLines(fullBody);

    for (const line of lines) {
      if (line.trim() === '') {
        await page.keyboard.press('Enter');
        continue;
      }
      await page.keyboard.type(line, { delay: 1 });
      await page.keyboard.press('Enter');
    }

    // 下書き保存（Ctrl+S）
    console.log(`    下書き保存中...`);
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const noteUrl = currentUrl.includes('/n/') ? currentUrl : `https://note.com/${env.note.username}`;

    await page.close();

    return { success: true, url: noteUrl };
  } catch (error) {
    await page.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// メイン処理
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const indexArg = args.indexOf('--index');
  const targetIndex = indexArg >= 0 ? parseInt(args[indexArg + 1], 10) : -1;

  // MDX ファイル一覧
  const files = readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx'))
    .sort();

  console.log(`\n  ブログ記事 → note.com 一括下書き投稿（Playwright）`);
  console.log(`  ====================================================`);
  console.log(`  記事数: ${files.length}`);
  console.log(`  モード: ${dryRun ? 'プレビュー（dry-run）' : '下書き投稿'}`);
  console.log('');

  // 記事一覧表示
  const posts: { file: string; frontmatter: BlogFrontmatter; body: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = resolve(BLOG_DIR, files[i]);
    const { frontmatter, body } = parseMdx(filePath);
    posts.push({ file: files[i], frontmatter, body });
    const marker = targetIndex >= 0 ? (i === targetIndex ? '>>>' : '   ') : '  ';
    console.log(`${marker} ${i + 1}. [${frontmatter.category}] ${frontmatter.title}`);
    console.log(`${marker}    タグ: ${frontmatter.tags.join(', ')}  |  本文: ${body.length} 文字`);
  }

  if (dryRun) {
    console.log('\n  --dry-run: 投稿はスキップされました。\n');
    return;
  }

  // 投稿対象を決定
  const targets = targetIndex >= 0 ? [posts[targetIndex]] : posts;

  console.log(`\n  ${targets.length} 件の記事を下書き投稿します...`);
  console.log(`  ブラウザを起動します。ログインが必要な場合は手動でログインしてください。\n`);

  // ブラウザ起動
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // セッション Cookie を設定
  await context.addCookies([{
    name: '_note_session_v5',
    value: env.note.sessionCookie,
    domain: '.note.com',
    path: '/',
    httpOnly: true,
    secure: true,
  }]);

  // まずログイン状態を確認
  const testPage = await context.newPage();
  await testPage.goto('https://note.com/notes/new', { waitUntil: 'networkidle', timeout: 30000 });

  if (testPage.url().includes('/login')) {
    console.log('  ⚠ ログインが必要です。ブラウザでログインしてください。');
    console.log('  ログイン後、Enter を押してください...\n');

    // ログインページに遷移
    await testPage.goto('https://note.com/login', { waitUntil: 'networkidle', timeout: 30000 });

    // ユーザーがログインするのを待つ
    await new Promise<void>(resolve => {
      const check = setInterval(async () => {
        try {
          const url = testPage.url();
          if (!url.includes('/login')) {
            clearInterval(check);
            resolve();
          }
        } catch {
          clearInterval(check);
          resolve();
        }
      }, 2000);
    });

    console.log('  ✓ ログイン確認完了\n');
  }
  await testPage.close();

  // 投稿実行
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const { frontmatter, body } = targets[i];

    const title = frontmatter.subtitle
      ? `${frontmatter.title}——${frontmatter.subtitle}`
      : frontmatter.title;

    console.log(`  [${i + 1}/${targets.length}] ${title}`);

    const result = await postDraft(context, title, body, i, targets.length);

    if (result.success) {
      successCount++;
      console.log(`    ✓ 下書き保存: ${result.url}`);
    } else {
      failCount++;
      console.log(`    ✗ 失敗: ${result.error}`);
    }

    // 次の記事の前に待機
    if (i < targets.length - 1) {
      console.log(`    （2秒待機中...）`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n  ====================================================`);
  console.log(`  完了: ${successCount} 件成功、${failCount} 件失敗`);
  console.log(`  note.com の下書き一覧で確認してください。`);
  console.log(`  ブラウザを閉じます...\n`);

  await browser.close();
}

main().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});
