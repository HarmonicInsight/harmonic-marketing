// =============================================================================
// note.com ブラウザ自動投稿（Playwright）
// =============================================================================
//
// note.com は公式 API を提供していないため、Playwright でブラウザを操作して投稿する。
// セッション Cookie でログイン状態を復元し、投稿画面を自動操作する。
//
// =============================================================================

import { chromium, type Browser, type Page } from 'playwright';
import { env } from './env.js';
import type { NotePost, PostResult } from './types.js';

const NOTE_BASE = 'https://note.com';

/**
 * ログイン済み Cookie を設定してブラウザを起動
 */
async function launchWithSession(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    headless: false, // 投稿内容を確認できるよう可視化
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // セッション Cookie を設定
  await context.addCookies([
    {
      name: '_note_session_v5',
      value: env.note.sessionCookie,
      domain: '.note.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
  ]);

  const page = await context.newPage();
  return { browser, page };
}

/**
 * note.com にテキスト記事を投稿する（Playwright 版）
 */
export async function postToNoteBrowser(post: NotePost): Promise<PostResult> {
  let browser: Browser | null = null;

  try {
    const launched = await launchWithSession();
    browser = launched.browser;
    const page = launched.page;

    // 投稿画面を開く
    console.log('  note.com 投稿画面を開いています...');
    await page.goto(`${NOTE_BASE}/notes/new`, { waitUntil: 'networkidle', timeout: 30000 });

    // ログイン確認
    const url = page.url();
    if (url.includes('/login')) {
      throw new Error('note.com にログインできていません。セッション Cookie を更新してください。');
    }

    // タイトル入力
    console.log('  タイトルを入力中...');
    const titleSelector = 'textarea[placeholder*="タイトル"], [data-testid="note-title"], .p-editor__title textarea, textarea.o-noteContentHeader__title';
    await page.waitForSelector(titleSelector, { timeout: 10000 }).catch(() => null);

    // タイトル欄を探す（複数のセレクタを試行）
    const titleSelectors = [
      'textarea[placeholder*="タイトル"]',
      'textarea[placeholder*="記事タイトル"]',
      '.p-editor__title textarea',
      'textarea.o-noteContentHeader__title',
      '[contenteditable="true"]:first-of-type',
    ];

    let titleFilled = false;
    for (const sel of titleSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await el.fill(post.title);
          titleFilled = true;
          console.log(`  タイトル入力完了（${sel}）`);
          break;
        }
      } catch { /* next */ }
    }

    if (!titleFilled) {
      // フォールバック: Tab でタイトル欄に移動
      await page.keyboard.press('Tab');
      await page.keyboard.type(post.title, { delay: 20 });
      console.log('  タイトル入力完了（キーボード入力）');
    }

    // 本文入力
    console.log('  本文を入力中...');
    const bodySelectors = [
      '.p-editor__body [contenteditable="true"]',
      '[data-testid="note-body"]',
      '.ProseMirror',
      '[contenteditable="true"]',
    ];

    let bodyFilled = false;
    for (const sel of bodySelectors) {
      try {
        const els = await page.$$(sel);
        // タイトル以外の contenteditable を探す
        for (const el of els) {
          const tag = await el.evaluate(e => e.tagName.toLowerCase());
          if (tag !== 'textarea') {
            await el.click();
            // Markdown を段落ごとに入力
            const paragraphs = post.body.split('\n\n');
            for (let i = 0; i < paragraphs.length; i++) {
              const lines = paragraphs[i].split('\n');
              for (const line of lines) {
                // Markdown記法を除去してプレーンテキストとして入力
                const clean = line
                  .replace(/^#{1,6}\s+/, '')  // 見出し
                  .replace(/\*\*(.+?)\*\*/g, '$1')  // 太字
                  .replace(/\*(.+?)\*/g, '$1')  // 斜体
                  .replace(/^- /, '・')  // リスト
                  .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');  // リンク
                await page.keyboard.type(clean, { delay: 5 });
                await page.keyboard.press('Enter');
              }
              if (i < paragraphs.length - 1) {
                await page.keyboard.press('Enter');
              }
            }
            bodyFilled = true;
            console.log(`  本文入力完了（${sel}）`);
            break;
          }
        }
        if (bodyFilled) break;
      } catch { /* next */ }
    }

    if (!bodyFilled) {
      throw new Error('本文入力欄が見つかりませんでした');
    }

    // タグ入力（ハッシュタグ）
    console.log('  タグを設定中...');
    try {
      // タグ追加ボタンやタグ入力欄を探す
      const tagInput = await page.$('input[placeholder*="タグ"], input[placeholder*="ハッシュタグ"], .p-editor__hashtag input');
      if (tagInput) {
        for (const tag of post.tags.slice(0, 5)) {
          await tagInput.click();
          await tagInput.fill(tag);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
        }
        console.log(`  タグ設定完了: ${post.tags.join(', ')}`);
      }
    } catch {
      console.log('  タグ入力をスキップ（手動で追加してください）');
    }

    // 下書き保存 or 公開
    if (post.publishStatus === 'published') {
      console.log('  記事を公開中...');
      // 公開ボタンを探す
      const publishBtn = await page.$('button:has-text("公開"), button:has-text("投稿")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('  下書きとして保存中...');
      // 下書き保存（Ctrl+S または下書きボタン）
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(3000);
    }

    // 現在のURLを取得（投稿後のURLを確認）
    const currentUrl = page.url();
    const noteUrl = currentUrl.includes('/n/') ? currentUrl : `${NOTE_BASE}/${env.note.username}`;

    console.log(`  完了: ${noteUrl}`);

    // ブラウザを開いたままにして確認できるようにする
    console.log('  ブラウザは開いたままです。確認後、手動で閉じてください。');

    return {
      platform: 'note',
      success: true,
      url: noteUrl,
      postedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    return {
      platform: 'note',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      postedAt: new Date().toISOString(),
    };
  }
}

/**
 * note.com の接続テスト（Playwright 版）
 */
export async function testNoteConnectionBrowser(): Promise<boolean> {
  let browser: Browser | null = null;
  try {
    const launched = await launchWithSession();
    browser = launched.browser;
    const page = launched.page;

    await page.goto(`${NOTE_BASE}/${env.note.username}`, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    console.log(`  note.com 接続OK（Playwright）: ${title}`);
    await browser.close();
    return true;
  } catch (error) {
    console.error(`  note.com 接続エラー: ${error instanceof Error ? error.message : error}`);
    if (browser) await browser.close().catch(() => {});
    return false;
  }
}
