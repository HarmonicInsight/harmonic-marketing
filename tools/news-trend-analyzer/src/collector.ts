// =============================================================================
// News Trend Analyzer — ニュース記事収集
// =============================================================================
// ニュース記事を catalog.json に追加する。
// 手動入力 / クリップボード / RSS から記事を取り込み、AI で自動分析する。
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { type NewsCatalog, type NewsArticle, type IndustryId } from './types.js';

const CATALOG_PATH = path.resolve(
  import.meta.dirname,
  '../../../content/news/catalog.json',
);

// ---------------------------------------------------------------------------
// カタログ読み書き
// ---------------------------------------------------------------------------

export function loadCatalog(): NewsCatalog {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  return JSON.parse(raw) as NewsCatalog;
}

export function saveCatalog(catalog: NewsCatalog): void {
  catalog._meta.last_updated = new Date().toISOString();
  catalog._meta.total_articles = catalog.articles.length;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// ID 生成
// ---------------------------------------------------------------------------

function nextId(catalog: NewsCatalog): string {
  const maxNum = catalog.articles.reduce((max, a) => {
    const num = parseInt(a.id.replace('NEWS-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `NEWS-${String(maxNum + 1).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// 対話的入力
// ---------------------------------------------------------------------------

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function collectInteractive(): Promise<NewsArticle> {
  const catalog = loadCatalog();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('\n📰 ニュース記事を登録します\n');

    const title = await ask(rl, 'タイトル: ');
    const sourceName = await ask(rl, '出典メディア: ');
    const sourceUrl = await ask(rl, 'URL (省略可): ');
    const publishedAt = await ask(rl, '公開日 (YYYY-MM-DD): ');

    console.log('\n業界選択（カンマ区切りで複数可）:');
    for (const ind of catalog.industries) {
      console.log(`  ${ind.id} — ${ind.name_ja}`);
    }
    const industriesRaw = await ask(rl, '業界: ');
    const industries = industriesRaw.split(',').map((s) => s.trim()) as IndustryId[];

    console.log('\nテーマタグ（カンマ区切りで複数可）:');
    for (const tag of catalog.theme_tags) {
      console.log(`  ${tag.id} — ${tag.label_ja}`);
    }
    const tagsRaw = await ask(rl, 'テーマタグ: ');
    const themeTags = tagsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const summary = await ask(rl, '要約（3-5行）:\n');

    const keyFactsRaw = await ask(rl, 'キーファクト（カンマ区切り）: ');
    const keyFacts = keyFactsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const sentiment = (await ask(
      rl,
      'センチメント (positive/negative/neutral/mixed): ',
    )) as NewsArticle['sentiment'];

    const impactLevel = (await ask(
      rl,
      'インパクト (high/medium/low): ',
    )) as NewsArticle['impact_level'];

    const article: NewsArticle = {
      id: nextId(catalog),
      title,
      source_name: sourceName,
      source_url: sourceUrl || undefined,
      published_at: publishedAt,
      collected_at: new Date().toISOString(),
      industries,
      theme_tags: themeTags.length > 0 ? themeTags : undefined,
      summary,
      key_facts: keyFacts.length > 0 ? keyFacts : undefined,
      sentiment: sentiment || undefined,
      impact_level: impactLevel || undefined,
      status: 'raw',
    };

    return article;
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// バッチ追加（プログラム的に呼び出し）
// ---------------------------------------------------------------------------

export function addArticle(article: Omit<NewsArticle, 'id' | 'collected_at'>): NewsArticle {
  const catalog = loadCatalog();
  const full: NewsArticle = {
    ...article,
    id: nextId(catalog),
    collected_at: new Date().toISOString(),
  };
  catalog.articles.push(full);
  saveCatalog(catalog);
  return full;
}

export function addArticles(
  articles: Omit<NewsArticle, 'id' | 'collected_at'>[],
): NewsArticle[] {
  const catalog = loadCatalog();
  const results: NewsArticle[] = [];

  for (const article of articles) {
    const full: NewsArticle = {
      ...article,
      id: nextId({ ...catalog, articles: [...catalog.articles, ...results] }),
      collected_at: new Date().toISOString(),
    };
    results.push(full);
  }

  catalog.articles.push(...results);
  saveCatalog(catalog);
  return results;
}
