#!/usr/bin/env node
// =============================================================================
// News Trend Analyzer — CLI エントリーポイント
// =============================================================================
// Usage:
//   npx tsx src/cli.ts analyze --window 1w          # 1週間の傾向分析
//   npx tsx src/cli.ts analyze --window 2w          # 半月の傾向分析
//   npx tsx src/cli.ts analyze --window 1m          # 1ヶ月の傾向分析
//   npx tsx src/cli.ts analyze --window 2m          # 2ヶ月の傾向分析
//   npx tsx src/cli.ts analyze --window 1m --format markdown --out report.md
//   npx tsx src/cli.ts collect                      # 対話的にニュース登録
//   npx tsx src/cli.ts stats                        # カタログの統計表示
//   npx tsx src/cli.ts compare --windows 1w,1m      # 複数期間の比較
// =============================================================================

import * as fs from 'fs';
import { parseArgs } from 'node:util';
import { loadCatalog, collectInteractive, saveCatalog } from './collector.js';
import { analyze } from './analyzer.js';
import { toMarkdown, toConsole } from './reporter.js';
import {
  type AnalysisWindow,
  ANALYSIS_WINDOW_LABELS,
} from './types.js';

// ---------------------------------------------------------------------------
// コマンド: analyze
// ---------------------------------------------------------------------------

function cmdAnalyze(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: {
      window: { type: 'string', short: 'w', default: '1m' },
      format: { type: 'string', short: 'f', default: 'console' },
      out: { type: 'string', short: 'o' },
    },
    allowPositionals: false,
  });

  const window = values.window as AnalysisWindow;
  if (!['1w', '2w', '1m', '2m'].includes(window)) {
    console.error(`不正なウィンドウ: ${window}。1w / 2w / 1m / 2m から選択してください`);
    process.exit(1);
  }

  const catalog = loadCatalog();
  const report = analyze(catalog, window);

  let output: string;
  if (values.format === 'markdown') {
    output = toMarkdown(report);
  } else if (values.format === 'json') {
    output = JSON.stringify(report, null, 2);
  } else {
    output = toConsole(report);
  }

  if (values.out) {
    fs.writeFileSync(values.out, output, 'utf-8');
    console.log(`レポートを ${values.out} に出力しました`);
  } else {
    console.log(output);
  }
}

// ---------------------------------------------------------------------------
// コマンド: collect
// ---------------------------------------------------------------------------

async function cmdCollect(): Promise<void> {
  const catalog = loadCatalog();
  const article = await collectInteractive();
  catalog.articles.push(article);
  saveCatalog(catalog);
  console.log(`\n✅ ${article.id} を登録しました: ${article.title}`);
}

// ---------------------------------------------------------------------------
// コマンド: stats
// ---------------------------------------------------------------------------

function cmdStats(): void {
  const catalog = loadCatalog();
  const articles = catalog.articles;

  console.log('\n===== ニュースカタログ統計 =====\n');
  console.log(`総記事数: ${articles.length}`);

  // 業界別
  console.log('\n--- 業界別 ---');
  for (const ind of catalog.industries) {
    const count = articles.filter((a) => a.industries.includes(ind.id)).length;
    console.log(`  ${ind.name_ja}: ${count}件`);
  }

  // ステータス別
  console.log('\n--- ステータス別 ---');
  const statusCounts = new Map<string, number>();
  for (const a of articles) {
    statusCounts.set(a.status, (statusCounts.get(a.status) || 0) + 1);
  }
  for (const [status, count] of statusCounts) {
    console.log(`  ${status}: ${count}件`);
  }

  // 月別
  console.log('\n--- 月別推移 ---');
  const monthlyCounts = new Map<string, number>();
  for (const a of articles) {
    const month = a.published_at.substring(0, 7);
    monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
  }
  for (const [month, count] of [...monthlyCounts].sort()) {
    console.log(`  ${month}: ${count}件`);
  }
}

// ---------------------------------------------------------------------------
// コマンド: compare（複数期間比較）
// ---------------------------------------------------------------------------

function cmdCompare(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: {
      windows: { type: 'string', default: '1w,2w,1m,2m' },
    },
    allowPositionals: false,
  });

  const windows = (values.windows || '1w,2w,1m,2m').split(',') as AnalysisWindow[];
  const catalog = loadCatalog();

  console.log('\n===== 複数期間比較 =====\n');
  console.log(
    '| 期間 | 記事数 | 前期比 | トップテーマ | 新興トレンド数 | インサイト候補数 |',
  );
  console.log(
    '|------|--------|--------|------------|--------------|----------------|',
  );

  for (const w of windows) {
    const report = analyze(catalog, w);
    const topTheme = report.theme_ranking[0]?.theme_label || '—';
    const change =
      report.previous_period_articles > 0
        ? `${Math.round(((report.total_articles - report.previous_period_articles) / report.previous_period_articles) * 100)}%`
        : '—';

    console.log(
      `| ${ANALYSIS_WINDOW_LABELS[w]} | ${report.total_articles} | ${change} | ${topTheme} | ${report.emerging_trends.length} | ${report.insight_candidates.length} |`,
    );
  }
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const command = process.argv[2];
  const rest = process.argv.slice(3);

  switch (command) {
    case 'analyze':
      cmdAnalyze(rest);
      break;
    case 'collect':
      await cmdCollect();
      break;
    case 'stats':
      cmdStats();
      break;
    case 'compare':
      cmdCompare(rest);
      break;
    default:
      console.log(`
ニュース傾向分析ツール — HARMONIC insight

Usage:
  npx tsx src/cli.ts <command> [options]

Commands:
  analyze   傾向分析を実行
    --window, -w   分析期間 (1w / 2w / 1m / 2m)  [default: 1m]
    --format, -f   出力形式 (console / markdown / json)  [default: console]
    --out, -o      出力ファイルパス

  collect   ニュース記事を対話的に登録

  stats     カタログ統計を表示

  compare   複数期間を横並び比較
    --windows      カンマ区切りの期間 (1w,2w,1m,2m)  [default: 1w,2w,1m,2m]
`);
  }
}

main().catch(console.error);
