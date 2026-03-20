// =============================================================================
// note.com クライアント（内部 API 利用）
// =============================================================================
//
// note.com は公式 API を提供していないため、ブラウザと同じ内部 API を利用する。
// セッション Cookie で認証する。
//
// 注意:
// - 内部 API は予告なく変更される可能性がある
// - 利用規約を確認の上、自己責任で使用すること
// - 過度な頻度での投稿は避けること（レートリミットあり）
// =============================================================================

import { readFileSync } from 'node:fs';
import { env } from './env.js';
import type { NotePost, PostResult } from './types.js';

const NOTE_API_BASE = 'https://note.com/api';

interface NoteApiHeaders {
  'Content-Type': string;
  'Cookie': string;
  'User-Agent': string;
  'X-Requested-With': string;
  [key: string]: string;
}

function getHeaders(): NoteApiHeaders {
  return {
    'Content-Type': 'application/json',
    'Cookie': `_note_session_v5=${env.note.sessionCookie}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Requested-With': 'XMLHttpRequest',
  };
}

/**
 * CSRF トークンを取得
 */
async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${NOTE_API_BASE}/v1/csrf_token`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`CSRF トークン取得失敗: ${res.status} ${res.statusText}`);
  }
  const data = await res.json() as { data?: string };
  return data.data ?? '';
}

/**
 * Markdown を note.com の内部フォーマットに変換
 *
 * note.com は独自の JSON ベースのリッチテキストフォーマットを使用。
 * ここでは簡易的に HTML 変換を行う。
 */
function markdownToNoteBody(markdown: string): string {
  let html = markdown
    // 見出し
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 太字・斜体
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    // リスト
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // リンク
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    // 改行
    .replace(/\n/g, '<br>');

  // li タグをまとめる
  html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
  });

  return `<p>${html}</p>`;
}

/**
 * note.com に記事を投稿する
 */
export async function postToNote(post: NotePost): Promise<PostResult> {
  try {
    const csrfToken = await getCsrfToken();

    const headers = {
      ...getHeaders(),
      'X-CSRF-Token': csrfToken,
    };

    // 下書き作成
    const createRes = await fetch(`${NOTE_API_BASE}/v3/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        note_type: 'TextNote',
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`記事作成失敗: ${createRes.status} ${errorText}`);
    }

    const createData = await createRes.json() as { data?: { key?: string; id?: number } };
    const noteKey = createData.data?.key;
    const noteId = createData.data?.id;

    if (!noteKey || !noteId) {
      throw new Error('記事作成レスポンスに key/id がありません');
    }

    // アイキャッチ画像のアップロード
    let eyecatchUrl: string | undefined;
    if (post.eyecatchPath) {
      const imageBuffer = readFileSync(post.eyecatchPath);
      const formData = new FormData();
      const blob = new Blob([imageBuffer], {
        type: post.eyecatchPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });
      formData.append('image', blob, 'eyecatch.jpg');
      formData.append('note_key', noteKey);

      const imgHeaders = { ...headers };
      delete (imgHeaders as Record<string, string>)['Content-Type'];

      const imgRes = await fetch(`${NOTE_API_BASE}/v3/notes/${noteKey}/eyecatch`, {
        method: 'PUT',
        headers: imgHeaders,
        body: formData,
      });

      if (imgRes.ok) {
        const imgData = await imgRes.json() as { data?: { eyecatch?: string } };
        eyecatchUrl = imgData.data?.eyecatch;
      }
    }

    // 記事内容の更新
    const noteBody = markdownToNoteBody(post.body);

    const updateRes = await fetch(`${NOTE_API_BASE}/v3/notes/${noteKey}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: post.title,
        body: noteBody,
        hashtags: post.tags,
        note_type: 'TextNote',
        publish_at: null,
        price: 0,
        can_others_copy: false,
      }),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`記事更新失敗: ${updateRes.status} ${errorText}`);
    }

    // 公開（draft でない場合）
    if (post.publishStatus === 'published') {
      const publishRes = await fetch(`${NOTE_API_BASE}/v3/notes/${noteKey}/publish`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({}),
      });

      if (!publishRes.ok) {
        const errorText = await publishRes.text();
        throw new Error(`記事公開失敗: ${publishRes.status} ${errorText}`);
      }
    }

    const username = env.note.username;
    const statusLabel = post.publishStatus === 'draft' ? '（下書き）' : '';

    return {
      platform: 'note',
      success: true,
      url: `https://note.com/${username}/n/${noteKey}`,
      postedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      platform: 'note',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      postedAt: new Date().toISOString(),
    };
  }
}

/**
 * note.com の接続テスト
 */
export async function testNoteConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${NOTE_API_BASE}/v2/creators/${env.note.username}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { data?: { nickname?: string } };
    console.log(`  note.com 接続OK: ${data.data?.nickname ?? env.note.username}`);
    return true;
  } catch (error) {
    console.error(`  note.com 接続エラー: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}
