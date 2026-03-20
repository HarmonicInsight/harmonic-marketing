#!/usr/bin/env npx tsx
// =============================================================================
// Social Poster CLI — Twitter/X + note.com 自動投稿ツール
// =============================================================================
//
// 使い方:
//   npx tsx src/cli.ts                          # 対話モード
//   npx tsx src/cli.ts --platform twitter       # Twitter のみ
//   npx tsx src/cli.ts --platform note          # note.com のみ
//   npx tsx src/cli.ts --platform all           # 両方
//   npx tsx src/cli.ts --dry-run                # 生成のみ（投稿しない）
//   npx tsx src/cli.ts --type tips --tone casual
//   npx tsx src/cli.ts --topic "IOSH の新機能"
//   npx tsx src/cli.ts --test                   # 接続テスト
//   npx tsx src/cli.ts --history                # 投稿履歴
//
// =============================================================================

import { createInterface } from 'node:readline';
import { generateContent } from './content-generator.js';
import { postToTwitter, testTwitterConnection } from './twitter-client.js';
import { postToNote, testNoteConnection } from './note-client.js';
import { recordPost, getHistory, getTodayPostCount } from './history.js';
import type {
  Platform,
  ContentType,
  Tone,
  GeneratedContent,
  PostResult,
  CliOptions,
} from './types.js';

// =============================================================================
// CLI 引数パース
// =============================================================================

function parseArgs(): CliOptions & { test?: boolean; showHistory?: boolean } {
  const args = process.argv.slice(2);
  const opts: CliOptions & { test?: boolean; showHistory?: boolean } = {
    platform: 'all',
    contentType: 'tips',
    tone: 'professional',
    productCodes: [],
    dryRun: false,
    schedule: false,
    skipConfirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--platform':
      case '-p':
        opts.platform = args[++i] as Platform;
        break;
      case '--type':
      case '-t':
        opts.contentType = args[++i] as ContentType;
        break;
      case '--tone':
        opts.tone = args[++i] as Tone;
        break;
      case '--products':
        opts.productCodes = args[++i].split(',');
        break;
      case '--topic':
        opts.topic = args[++i];
        break;
      case '--dry-run':
      case '-n':
        opts.dryRun = true;
        break;
      case '--skip-confirm':
      case '-y':
        opts.skipConfirm = true;
        break;
      case '--test':
        opts.test = true;
        break;
      case '--history':
        opts.showHistory = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(`
Social Poster — Twitter/X + note.com 自動投稿ツール

使い方:
  npx tsx src/cli.ts [options]

オプション:
  --platform, -p <twitter|note|all>   投稿先 (default: all)
  --type, -t <content_type>           コンテンツ種別 (default: tips)
  --tone <tone>                       トーン (default: professional)
  --products <codes>                  対象製品 (カンマ区切り)
  --topic <text>                      カスタムトピック
  --dry-run, -n                       生成のみ（投稿しない）
  --skip-confirm, -y                  確認をスキップ
  --test                              接続テスト
  --history                           投稿履歴を表示
  --help, -h                          ヘルプ

コンテンツ種別:
  product_update    製品アップデート
  tips              使い方 Tips
  case_study        活用事例
  behind_the_scenes 開発裏話
  industry_insight  業界トレンド
  comparison        競合比較
  free_plan_promo   FREE プラン訴求

トーン:
  professional      プロフェッショナル
  casual            カジュアル
  technical         技術的
  storytelling      ストーリーテリング
`);
}

// =============================================================================
// 対話UI
// =============================================================================

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function confirm(message: string): Promise<boolean> {
  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// =============================================================================
// プレビュー表示
// =============================================================================

function previewContent(content: GeneratedContent): void {
  console.log('\n' + '='.repeat(60));
  console.log('  生成されたコンテンツのプレビュー');
  console.log('='.repeat(60));

  if (content.twitter) {
    console.log('\n--- Twitter/X ---');
    console.log(`\n  ${content.twitter.text}`);
    console.log(`  (${content.twitter.text.length} 文字)`);
    if (content.twitter.thread?.length) {
      console.log('\n  [スレッド]');
      content.twitter.thread.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t}`);
      });
    }
  }

  if (content.note) {
    console.log('\n--- note.com ---');
    console.log(`\n  タイトル: ${content.note.title}`);
    console.log(`  タグ: ${content.note.tags.join(', ')}`);
    console.log(`  カテゴリ: ${content.note.category}`);
    console.log(`  公開: ${content.note.publishStatus === 'draft' ? '下書き' : '公開'}`);
    console.log('\n  --- 本文プレビュー（先頭500文字）---');
    console.log(`  ${content.note.body.slice(0, 500)}...`);
    console.log(`  (全 ${content.note.body.length} 文字)`);
  }

  console.log('\n' + '='.repeat(60));
}

// =============================================================================
// レートリミットチェック
// =============================================================================

const DAILY_LIMITS = {
  twitter: 10,
  note: 5,
} as const;

function checkRateLimits(platform: Platform): boolean {
  const platforms: ('twitter' | 'note')[] =
    platform === 'all' ? ['twitter', 'note'] : [platform as 'twitter' | 'note'];

  for (const p of platforms) {
    const count = getTodayPostCount(p);
    const limit = DAILY_LIMITS[p];
    if (count >= limit) {
      console.error(`\n  ${p} の今日の投稿上限 (${limit}件) に達しています。`);
      return false;
    }
    if (count > 0) {
      console.log(`  ${p}: 今日 ${count}/${limit} 件投稿済み`);
    }
  }
  return true;
}

// =============================================================================
// メイン処理
// =============================================================================

async function runConnectionTest(): Promise<void> {
  console.log('\n接続テスト中...\n');
  const twitterOk = await testTwitterConnection();
  const noteOk = await testNoteConnection();
  console.log(`\n結果: Twitter=${twitterOk ? 'OK' : 'NG'}, note.com=${noteOk ? 'OK' : 'NG'}`);
}

async function showHistory(): Promise<void> {
  const entries = getHistory(10);
  if (entries.length === 0) {
    console.log('\n投稿履歴はありません。');
    return;
  }
  console.log(`\n最近の投稿履歴（${entries.length}件）:\n`);
  for (const entry of entries) {
    const results = entry.results.map(r =>
      `${r.platform}: ${r.success ? 'OK' : 'NG'}${r.url ? ` (${r.url})` : ''}`,
    ).join(' | ');
    console.log(`  ${entry.postedAt ?? entry.generatedAt} [${entry.contentType}] ${results}`);
  }
}

async function main(): Promise<void> {
  const opts = parseArgs();

  console.log('\n  Social Poster — HARMONIC insight');
  console.log('  Twitter/X + note.com 自動投稿ツール\n');

  // 接続テスト
  if (opts.test) {
    await runConnectionTest();
    rl.close();
    return;
  }

  // 履歴表示
  if (opts.showHistory) {
    await showHistory();
    rl.close();
    return;
  }

  // レートリミットチェック
  if (!opts.dryRun && !checkRateLimits(opts.platform)) {
    rl.close();
    process.exit(1);
  }

  // コンテンツ生成
  console.log('コンテンツを生成中...\n');
  console.log(`  プラットフォーム: ${opts.platform}`);
  console.log(`  種別: ${opts.contentType}`);
  console.log(`  トーン: ${opts.tone}`);
  if (opts.topic) console.log(`  トピック: ${opts.topic}`);
  if (opts.productCodes.length) console.log(`  製品: ${opts.productCodes.join(', ')}`);
  console.log('');

  let content: GeneratedContent;
  try {
    content = await generateContent({
      contentType: opts.contentType,
      platform: opts.platform,
      tone: opts.tone,
      productCodes: opts.productCodes.length ? opts.productCodes : undefined,
      topic: opts.topic,
    });
  } catch (error) {
    console.error(`\n生成エラー: ${error instanceof Error ? error.message : error}`);
    rl.close();
    process.exit(1);
  }

  // プレビュー
  previewContent(content);

  // ドライランの場合はここまで
  if (opts.dryRun) {
    console.log('\n  --dry-run: 投稿はスキップされました。\n');
    rl.close();
    return;
  }

  // 確認
  if (!opts.skipConfirm) {
    // 編集オプション
    const editChoice = await ask('\n操作を選択: [p]投稿 / [e]編集 / [r]再生成 / [q]中止: ');

    if (editChoice === 'q') {
      console.log('中止しました。');
      rl.close();
      return;
    }

    if (editChoice === 'r') {
      console.log('\n再生成中...');
      content = await generateContent({
        contentType: opts.contentType,
        platform: opts.platform,
        tone: opts.tone,
        productCodes: opts.productCodes.length ? opts.productCodes : undefined,
        topic: opts.topic,
      });
      previewContent(content);

      const proceedAfterRegen = await confirm('\nこの内容で投稿しますか？');
      if (!proceedAfterRegen) {
        console.log('中止しました。');
        rl.close();
        return;
      }
    }

    if (editChoice === 'e') {
      // Twitter テキストの手動編集
      if (content.twitter) {
        const newText = await ask(`\nTwitter テキスト（Enter でスキップ）:\n> `);
        if (newText) content.twitter.text = newText;
      }
      // note タイトルの手動編集
      if (content.note) {
        const newTitle = await ask(`\nnote タイトル（Enter でスキップ）:\n> `);
        if (newTitle) content.note.title = newTitle;
      }
      previewContent(content);

      const proceedAfterEdit = await confirm('\nこの内容で投稿しますか？');
      if (!proceedAfterEdit) {
        console.log('中止しました。');
        rl.close();
        return;
      }
    }

    if (editChoice === 'p') {
      // note.com の公開設定確認
      if (content.note) {
        const publishNow = await confirm('note.com 記事を公開しますか？（N = 下書き保存）');
        content.note.publishStatus = publishNow ? 'published' : 'draft';
      }
    }
  }

  // 投稿実行
  console.log('\n投稿中...\n');
  const results: PostResult[] = [];

  if (content.twitter) {
    console.log('  Twitter/X に投稿中...');
    const result = await postToTwitter(content.twitter);
    results.push(result);
    if (result.success) {
      console.log(`  OK: ${result.url}`);
    } else {
      console.error(`  NG: ${result.error}`);
    }
  }

  if (content.note) {
    console.log('  note.com に投稿中...');
    const result = await postToNote(content.note);
    results.push(result);
    if (result.success) {
      console.log(`  OK: ${result.url}`);
    } else {
      console.error(`  NG: ${result.error}`);
    }
  }

  // 履歴記録
  recordPost(opts.platform, opts.contentType, content, results);

  // 結果サマリー
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`\n完了: ${successCount} 件成功${failCount > 0 ? `、${failCount} 件失敗` : ''}\n`);

  rl.close();
}

main().catch(error => {
  console.error('予期しないエラー:', error);
  rl.close();
  process.exit(1);
});
