#!/usr/bin/env npx tsx
// =============================================================================
// バッチコンテンツ生成 — 複数コンテンツを一括生成してストックに保存
// =============================================================================
//
// 使い方:
//   npx tsx src/batch.ts                              # デフォルト（Twitter 5件）
//   npx tsx src/batch.ts --count 10                   # 10件生成
//   npx tsx src/batch.ts --platform note              # note.com 記事
//   npx tsx src/batch.ts --platform all               # 両方
//   npx tsx src/batch.ts --products INMV,INSS         # 特定製品のみ
//   npx tsx src/batch.ts --stats                      # ストック統計表示
//   npx tsx src/batch.ts --list                       # 未投稿一覧
//   npx tsx src/batch.ts --list --status approved     # 承認済み一覧
//
// =============================================================================

import { generateContent } from './content-generator.js';
import { addToStock, getStock, getStockStats } from './stock.js';
import type { ContentType, Tone, Platform } from './types.js';

// =============================================================================
// バッチ生成の設定
// =============================================================================

/** 生成パターン — 種別 × トーン × トピックの組み合わせ */
const GENERATION_PATTERNS: Array<{
  contentType: ContentType;
  tone: Tone;
  topic?: string;
  productCodes?: string[];
  weight: number; // 選択確率の重み
}> = [
  // 製品紹介系（安定版を優先）
  { contentType: 'tips', tone: 'casual', productCodes: ['INSS'], topic: 'PowerPoint品質チェックの時短術', weight: 3 },
  { contentType: 'tips', tone: 'casual', productCodes: ['IOSH'], topic: 'Excel経営管理をAIで効率化', weight: 3 },
  { contentType: 'tips', tone: 'storytelling', productCodes: ['ISOF'], topic: 'シニアでも使えるAIオフィス', weight: 2 },
  { contentType: 'product_update', tone: 'professional', productCodes: ['INMV'], topic: 'PowerPointから動画を自動作成する新ツール', weight: 3 },

  // AI × 音声 × アナログ（コアメッセージ）
  { contentType: 'industry_insight', tone: 'professional', topic: 'AI×音声×アナログ：デジタル化しないDXという選択肢', weight: 4 },
  { contentType: 'industry_insight', tone: 'storytelling', topic: 'アナログ伝票がなくならない本当の理由', weight: 3 },
  { contentType: 'industry_insight', tone: 'casual', topic: '音声入力で変わるシニア世代のPC体験', weight: 2 },

  // 開発裏話
  { contentType: 'behind_the_scenes', tone: 'casual', topic: 'なぜClaude APIを選んだのか', weight: 2 },
  { contentType: 'behind_the_scenes', tone: 'storytelling', topic: '特許出願中の伝票読み取り技術の裏側', weight: 2 },
  { contentType: 'behind_the_scenes', tone: 'technical', topic: 'MS Office不要のOfficeツールをどう実現したか', weight: 2 },

  // 課題提起（架空事例ではなく、一般的な課題とツールでの解決アプローチ）
  { contentType: 'tips', tone: 'professional', topic: 'PowerPoint品質管理で手戻りを減らすアプローチ', weight: 2 },
  { contentType: 'tips', tone: 'storytelling', productCodes: ['IOSH'], topic: 'Excel管理の属人化リスクとその対策', weight: 2 },

  // FREE プラン
  { contentType: 'free_plan_promo', tone: 'casual', topic: '無料で始められるAI搭載オフィスツール', weight: 2 },

  // 競合比較
  { contentType: 'comparison', tone: 'professional', topic: '従来のRPAツールとInsightBotの違い', weight: 1 },
];

// =============================================================================
// 引数パース
// =============================================================================

interface BatchOptions {
  count: number;
  platform: Platform;
  productCodes?: string[];
  showStats: boolean;
  showList: boolean;
  listStatus?: string;
}

function parseArgs(): BatchOptions {
  const args = process.argv.slice(2);
  const opts: BatchOptions = {
    count: 5,
    platform: 'twitter',
    showStats: false,
    showList: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--count':
      case '-c':
        opts.count = parseInt(args[++i], 10);
        break;
      case '--platform':
      case '-p':
        opts.platform = args[++i] as Platform;
        break;
      case '--products':
        opts.productCodes = args[++i].split(',');
        break;
      case '--stats':
        opts.showStats = true;
        break;
      case '--list':
        opts.showList = true;
        break;
      case '--status':
        opts.listStatus = args[++i];
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
バッチコンテンツ生成 — ストック用コンテンツを一括生成

使い方:
  npx tsx src/batch.ts [options]

オプション:
  --count, -c <N>          生成件数 (default: 5)
  --platform, -p <name>    twitter | note | all (default: twitter)
  --products <codes>       対象製品 (カンマ区切り)
  --stats                  ストック統計を表示
  --list                   ストック一覧を表示
  --status <status>        一覧のフィルタ (draft|approved|rejected|posted)
  --help, -h               ヘルプ
`);
}

// =============================================================================
// 重み付きランダム選択
// =============================================================================

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// =============================================================================
// メイン処理
// =============================================================================

async function main(): Promise<void> {
  const opts = parseArgs();

  console.log('\n  Social Poster — バッチ生成');
  console.log('  コンテンツをストックに事前生成\n');

  // 統計表示
  if (opts.showStats) {
    const stats = getStockStats();
    console.log('  ストック統計:');
    console.log(`    下書き:   ${stats.draft} 件`);
    console.log(`    承認済み: ${stats.approved} 件`);
    console.log(`    却下:     ${stats.rejected} 件`);
    console.log(`    投稿済み: ${stats.posted} 件`);
    console.log(`    合計:     ${stats.draft + stats.approved + stats.rejected + stats.posted} 件\n`);
    return;
  }

  // 一覧表示
  if (opts.showList) {
    const items = getStock({
      status: (opts.listStatus as any) ?? 'draft',
      limit: 30,
    });
    if (items.length === 0) {
      console.log(`  該当するストックはありません。\n`);
      return;
    }
    console.log(`  ストック一覧（${opts.listStatus ?? 'draft'}）:\n`);
    for (const item of items) {
      const text = item.editedTwitterText ?? item.content.twitter?.text ?? item.content.note?.title ?? '';
      const preview = text.length > 60 ? text.slice(0, 60) + '...' : text;
      console.log(`  [${item.id.slice(0, 8)}] ${item.contentType.padEnd(18)} ${preview}`);
    }
    console.log('');
    return;
  }

  // バッチ生成
  console.log(`  ${opts.count} 件のコンテンツを生成します...`);
  console.log(`  プラットフォーム: ${opts.platform}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < opts.count; i++) {
    // パターンをランダム選択
    let patterns = GENERATION_PATTERNS;
    if (opts.productCodes) {
      patterns = patterns.filter(p =>
        !p.productCodes || p.productCodes.some(c => opts.productCodes!.includes(c)),
      );
      if (patterns.length === 0) patterns = GENERATION_PATTERNS;
    }
    const pattern = weightedRandom(patterns);

    const label = `[${i + 1}/${opts.count}] ${pattern.contentType} / ${pattern.tone}`;
    process.stdout.write(`  ${label} ...`);

    try {
      const content = await generateContent({
        contentType: pattern.contentType,
        platform: opts.platform,
        tone: pattern.tone,
        productCodes: pattern.productCodes,
        topic: pattern.topic,
      });

      const item = addToStock(content, pattern.contentType, pattern.tone, opts.platform, pattern.topic);

      const preview = content.twitter?.text?.slice(0, 50) ?? content.note?.title ?? '';
      console.log(` OK → ${preview}...`);
      successCount++;
    } catch (error) {
      console.log(` NG: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }

    // API レートリミット対策（1秒待機）
    if (i < opts.count - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n  完了: ${successCount} 件生成、${failCount} 件失敗`);

  // 統計
  const stats = getStockStats();
  console.log(`  ストック合計: 下書き ${stats.draft} 件 / 承認済み ${stats.approved} 件\n`);
}

main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
