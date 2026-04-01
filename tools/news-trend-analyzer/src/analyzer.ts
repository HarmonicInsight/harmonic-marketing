// =============================================================================
// News Trend Analyzer — 傾向分析エンジン
// =============================================================================
// ニュース記事データを時間軸でスライスし、業界横断の傾向を分析する。
//
// 分析の3層構造:
//   Layer 1: 集計（業界別・テーマ別カウント、センチメント分布）
//   Layer 2: 比較（前期間比、増減率、新興トレンド検出）
//   Layer 3: 洞察（クロスインダストリー相関、ビジネスインサイト候補抽出）
// =============================================================================

import {
  type NewsCatalog,
  type NewsArticle,
  type AnalysisWindow,
  type TrendReport,
  type IndustryBreakdown,
  type ThemeCount,
  type CrossIndustryCorrelation,
  type EmergingTrend,
  type InsightCandidate,
  type IndustryId,
  type Sentiment,
  ANALYSIS_WINDOW_DAYS,
  ANALYSIS_WINDOW_LABELS,
} from './types.js';

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

function toDate(dateStr: string): Date {
  return new Date(dateStr);
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateReportId(window: AnalysisWindow, date: Date): string {
  return `TR-${window.toUpperCase()}-${formatDate(date).replace(/-/g, '')}`;
}

// ---------------------------------------------------------------------------
// Layer 1: 集計
// ---------------------------------------------------------------------------

/** 指定期間の記事をフィルタ */
export function filterByPeriod(
  articles: NewsArticle[],
  from: Date,
  to: Date,
): NewsArticle[] {
  return articles.filter((a) => {
    const d = toDate(a.published_at);
    return d >= from && d <= to;
  });
}

/** 業界別の記事数をカウント */
function countByIndustry(articles: NewsArticle[]): Map<IndustryId, NewsArticle[]> {
  const map = new Map<IndustryId, NewsArticle[]>();
  for (const article of articles) {
    for (const ind of article.industries) {
      const list = map.get(ind) || [];
      list.push(article);
      map.set(ind, list);
    }
  }
  return map;
}

/** テーマ別カウント */
function countByTheme(articles: NewsArticle[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.theme_tags || []) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return map;
}

/** センチメント分布を集計 */
function countSentiment(articles: NewsArticle[]): Record<Sentiment, number> {
  const dist: Record<Sentiment, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  };
  for (const a of articles) {
    if (a.sentiment) dist[a.sentiment]++;
  }
  return dist;
}

// ---------------------------------------------------------------------------
// Layer 2: 比較（前期間比）
// ---------------------------------------------------------------------------

function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

// ---------------------------------------------------------------------------
// Layer 3: 洞察
// ---------------------------------------------------------------------------

/** クロスインダストリー相関を計算 */
function computeCorrelations(
  articles: NewsArticle[],
  catalog: NewsCatalog,
): CrossIndustryCorrelation[] {
  const industryIds = catalog.industries.map((i) => i.id);
  const correlations: CrossIndustryCorrelation[] = [];

  for (let i = 0; i < industryIds.length; i++) {
    for (let j = i + 1; j < industryIds.length; j++) {
      const a = industryIds[i];
      const b = industryIds[j];

      // 両方の業界に属する記事
      const overlap = articles.filter(
        (art) => art.industries.includes(a) && art.industries.includes(b),
      );

      if (overlap.length === 0) continue;

      // 共通テーマを抽出
      const themes = new Set<string>();
      for (const art of overlap) {
        for (const tag of art.theme_tags || []) themes.add(tag);
      }

      // 相関スコア = 重複記事数 / 全記事数（Jaccard 的な指標）
      const aCount = articles.filter((art) => art.industries.includes(a)).length;
      const bCount = articles.filter((art) => art.industries.includes(b)).length;
      const union = aCount + bCount - overlap.length;
      const score = union > 0 ? Math.round((overlap.length / union) * 100) / 100 : 0;

      correlations.push({
        industries: [a, b],
        shared_themes: [...themes],
        overlap_count: overlap.length,
        correlation_score: score,
      });
    }
  }

  return correlations.sort((a, b) => b.correlation_score - a.correlation_score);
}

/** 新興トレンドを検出 */
function detectEmergingTrends(
  currentArticles: NewsArticle[],
  previousArticles: NewsArticle[],
  catalog: NewsCatalog,
): EmergingTrend[] {
  const currentThemes = countByTheme(currentArticles);
  const previousThemes = countByTheme(previousArticles);
  const trends: EmergingTrend[] = [];

  for (const [themeId, currentCount] of currentThemes) {
    const previousCount = previousThemes.get(themeId) || 0;
    const growthRate = calcChangeRate(currentCount, previousCount);

    // 増加率 50% 以上、かつ今期 2件以上 → 新興トレンド候補
    if (growthRate !== null && growthRate >= 50 && currentCount >= 2) {
      const relatedArticles = currentArticles.filter(
        (a) => a.theme_tags?.includes(themeId),
      );
      const relatedIndustries = [
        ...new Set(relatedArticles.flatMap((a) => a.industries)),
      ];
      const representatives = relatedArticles
        .sort((a, b) => (b.impact_level === 'high' ? 1 : 0) - (a.impact_level === 'high' ? 1 : 0))
        .slice(0, 3)
        .map((a) => a.id);

      const tag = catalog.theme_tags.find((t) => t.id === themeId);

      trends.push({
        theme_id: themeId,
        theme_label: tag?.label_ja || themeId,
        current_count: currentCount,
        previous_count: previousCount,
        growth_rate: growthRate,
        related_industries: relatedIndustries,
        representative_articles: representatives,
      });
    }
  }

  // 新しいテーマ（前期ゼロ → 今期出現）のうち、上のループで未追加のものを検出
  const addedThemes = new Set(trends.map((t) => t.theme_id));
  for (const [themeId, currentCount] of currentThemes) {
    if (!previousThemes.has(themeId) && currentCount >= 2 && !addedThemes.has(themeId)) {
      const relatedArticles = currentArticles.filter(
        (a) => a.theme_tags?.includes(themeId),
      );
      const tag = catalog.theme_tags.find((t) => t.id === themeId);

      trends.push({
        theme_id: themeId,
        theme_label: tag?.label_ja || themeId,
        current_count: currentCount,
        previous_count: 0,
        growth_rate: 100,
        related_industries: [...new Set(relatedArticles.flatMap((a) => a.industries))],
        representative_articles: relatedArticles.slice(0, 3).map((a) => a.id),
      });
    }
  }

  return trends.sort((a, b) => b.growth_rate - a.growth_rate);
}

/** ビジネスインサイト候補を抽出（ルールベース） */
function extractInsightCandidates(
  articles: NewsArticle[],
  correlations: CrossIndustryCorrelation[],
  emergingTrends: EmergingTrend[],
): InsightCandidate[] {
  const candidates: InsightCandidate[] = [];

  // パターン1: クロスインダストリー — 相関スコアが高い業界ペア
  for (const corr of correlations) {
    if (corr.correlation_score >= 0.15 && corr.overlap_count >= 3) {
      const overlapArticles = articles
        .filter(
          (a) =>
            a.industries.includes(corr.industries[0]) &&
            a.industries.includes(corr.industries[1]),
        )
        .slice(0, 5);

      candidates.push({
        type: 'cross_industry',
        description: `${corr.industries[0]} と ${corr.industries[1]} の接点で ${corr.shared_themes.join('・')} が共通テーマとして浮上（${corr.overlap_count}件）`,
        evidence_articles: overlapArticles.map((a) => a.id),
        industries: [...corr.industries],
        confidence: Math.min(corr.correlation_score * 2, 1),
      });
    }
  }

  // パターン2: 急上昇トレンド
  for (const trend of emergingTrends) {
    if (trend.growth_rate >= 100) {
      candidates.push({
        type: 'emerging_trend',
        description: `「${trend.theme_label}」が急上昇（前期比 +${trend.growth_rate}%）。${trend.related_industries.join('・')} で注目度が高まっている`,
        evidence_articles: trend.representative_articles,
        industries: trend.related_industries,
        confidence: Math.min(trend.growth_rate / 200, 1),
      });
    }
  }

  // パターン3: センチメントシフト — ネガティブ記事が集中する業界
  const industryArticles = countByIndustry(articles);
  for (const [industryId, indArticles] of industryArticles) {
    const sentiment = countSentiment(indArticles);
    const total = indArticles.length;
    if (total >= 3 && sentiment.negative / total >= 0.5) {
      candidates.push({
        type: 'sentiment_shift',
        description: `${industryId} でネガティブニュースが ${Math.round((sentiment.negative / total) * 100)}% を占めている。業界全体の課題や転換点の可能性`,
        evidence_articles: indArticles
          .filter((a) => a.sentiment === 'negative')
          .slice(0, 5)
          .map((a) => a.id),
        industries: [industryId],
        confidence: sentiment.negative / total,
      });
    }
  }

  // パターン4: 業界収束 — 3業界以上で同テーマが出現
  const themeToIndustries = new Map<string, Set<IndustryId>>();
  for (const article of articles) {
    for (const tag of article.theme_tags || []) {
      const set = themeToIndustries.get(tag) || new Set();
      for (const ind of article.industries) set.add(ind);
      themeToIndustries.set(tag, set);
    }
  }
  for (const [themeId, industries] of themeToIndustries) {
    if (industries.size >= 3) {
      const relatedArticles = articles
        .filter((a) => a.theme_tags?.includes(themeId))
        .slice(0, 5);
      candidates.push({
        type: 'convergence',
        description: `「${themeId}」が ${industries.size} 業界で同時に出現 — 業界横断的なメガトレンドの可能性`,
        evidence_articles: relatedArticles.map((a) => a.id),
        industries: [...industries],
        confidence: Math.min(industries.size / 5, 1),
      });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

// ---------------------------------------------------------------------------
// メイン分析関数
// ---------------------------------------------------------------------------

export function analyze(
  catalog: NewsCatalog,
  window: AnalysisWindow,
  baseDate?: Date,
): TrendReport {
  const now = baseDate || new Date();
  const days = ANALYSIS_WINDOW_DAYS[window];
  const periodEnd = now;
  const periodStart = subtractDays(now, days);
  const prevPeriodEnd = subtractDays(periodStart, 1);
  const prevPeriodStart = subtractDays(prevPeriodEnd, days);

  const currentArticles = filterByPeriod(catalog.articles, periodStart, periodEnd);
  const previousArticles = filterByPeriod(catalog.articles, prevPeriodStart, prevPeriodEnd);

  // Layer 1: 業界別集計
  const currentByIndustry = countByIndustry(currentArticles);
  const previousByIndustry = countByIndustry(previousArticles);

  const industryBreakdown: IndustryBreakdown[] = catalog.industries.map((ind) => {
    const current = currentByIndustry.get(ind.id) || [];
    const previous = previousByIndustry.get(ind.id) || [];
    const themes = countByTheme(current);

    const topThemes: ThemeCount[] = [...themes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        theme_id: id,
        theme_label: catalog.theme_tags.find((t) => t.id === id)?.label_ja || id,
        count,
      }));

    return {
      industry_id: ind.id,
      industry_name: ind.name_ja,
      article_count: current.length,
      change_rate: calcChangeRate(current.length, previous.length),
      top_themes: topThemes,
      sentiment_distribution: countSentiment(current),
      high_impact_count: current.filter((a) => a.impact_level === 'high').length,
    };
  });

  // テーマ全体ランキング
  const allThemes = countByTheme(currentArticles);
  const themeRanking: ThemeCount[] = [...allThemes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      theme_id: id,
      theme_label: catalog.theme_tags.find((t) => t.id === id)?.label_ja || id,
      count,
    }));

  // Layer 2 & 3
  const correlations = computeCorrelations(currentArticles, catalog);
  const emergingTrends = detectEmergingTrends(currentArticles, previousArticles, catalog);
  const insightCandidates = extractInsightCandidates(
    currentArticles,
    correlations,
    emergingTrends,
  );

  return {
    id: generateReportId(window, now),
    generated_at: now.toISOString(),
    window,
    period: {
      from: formatDate(periodStart),
      to: formatDate(periodEnd),
    },
    total_articles: currentArticles.length,
    previous_period_articles: previousArticles.length,
    executive_summary: '', // AI 生成で埋める or CLI で後から追加
    industry_breakdown: industryBreakdown,
    theme_ranking: themeRanking,
    cross_industry_correlations: correlations,
    emerging_trends: emergingTrends,
    insight_candidates: insightCandidates,
    overall_sentiment: countSentiment(currentArticles),
  };
}
