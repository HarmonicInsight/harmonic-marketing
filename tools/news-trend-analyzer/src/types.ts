// =============================================================================
// News Trend Analyzer — 型定義
// =============================================================================
// ニュース記事の傾向分析に必要な型を定義する。
// 2つの目的:
//   1. ビジネスインサイト発見（クロスインダストリー分析）
//   2. 傾向分析（時間軸スライス: 1週間 / 半月 / 1ヶ月 / 2ヶ月）
// =============================================================================

// ---------------------------------------------------------------------------
// ニュースカタログ（content/news/catalog.json の型）
// ---------------------------------------------------------------------------

export interface NewsMeta {
  version: string;
  last_updated: string;
  total_articles: number;
}

export interface Industry {
  id: IndustryId;
  name_ja: string;
  name_en: string;
  color: string;
}

export type IndustryId =
  | 'construction'
  | 'real_estate'
  | 'manufacturing'
  | 'ai'
  | 'consulting';

export interface ThemeTag {
  id: string;
  label_ja: string;
  label_en?: string;
}

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type ArticleStatus = 'raw' | 'analyzed' | 'insight_added' | 'used_in_content';

export interface NewsArticle {
  id: string;
  title: string;
  source_name: string;
  source_url?: string;
  published_at: string;        // YYYY-MM-DD
  collected_at: string;        // ISO 8601
  industries: IndustryId[];
  theme_tags?: string[];
  summary: string;
  key_facts?: string[];
  business_insight?: string;
  sentiment?: Sentiment;
  impact_level?: ImpactLevel;
  related_articles?: string[];
  status: ArticleStatus;
}

export interface NewsCatalog {
  _meta: NewsMeta;
  industries: Industry[];
  theme_tags: ThemeTag[];
  articles: NewsArticle[];
}

// ---------------------------------------------------------------------------
// 分析期間
// ---------------------------------------------------------------------------

/** 分析ウィンドウ（時間軸スライス） */
export type AnalysisWindow = '1w' | '2w' | '1m' | '2m';

export const ANALYSIS_WINDOW_DAYS: Record<AnalysisWindow, number> = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
  '2m': 60,
};

export const ANALYSIS_WINDOW_LABELS: Record<AnalysisWindow, string> = {
  '1w': '1週間',
  '2w': '半月',
  '1m': '1ヶ月',
  '2m': '2ヶ月',
};

// ---------------------------------------------------------------------------
// 傾向分析結果
// ---------------------------------------------------------------------------

/** 業界別集計 */
export interface IndustryBreakdown {
  industry_id: IndustryId;
  industry_name: string;
  article_count: number;
  /** 前期間比の増減率 (%) */
  change_rate: number | null;
  top_themes: ThemeCount[];
  sentiment_distribution: Record<Sentiment, number>;
  high_impact_count: number;
}

/** テーマ別カウント */
export interface ThemeCount {
  theme_id: string;
  theme_label: string;
  count: number;
}

/** クロスインダストリー相関 */
export interface CrossIndustryCorrelation {
  /** 業界ペア */
  industries: [IndustryId, IndustryId];
  /** 共通テーマ */
  shared_themes: string[];
  /** 共通記事数 */
  overlap_count: number;
  /** 相関スコア (0-1) */
  correlation_score: number;
}

/** 新興トレンド（急上昇テーマ） */
export interface EmergingTrend {
  theme_id: string;
  theme_label: string;
  /** 今期の記事数 */
  current_count: number;
  /** 前期の記事数 */
  previous_count: number;
  /** 増加率 (%) */
  growth_rate: number;
  /** 関連する業界 */
  related_industries: IndustryId[];
  /** 代表的な記事ID */
  representative_articles: string[];
}

/** ビジネスインサイト候補 */
export interface InsightCandidate {
  /** インサイトの種類 */
  type: 'cross_industry' | 'emerging_trend' | 'sentiment_shift' | 'convergence';
  /** インサイト本文 */
  description: string;
  /** 根拠となる記事ID */
  evidence_articles: string[];
  /** 関連業界 */
  industries: IndustryId[];
  /** 確信度 (0-1) */
  confidence: number;
}

/** 傾向分析レポート */
export interface TrendReport {
  /** レポートID */
  id: string;
  /** 生成日時 */
  generated_at: string;
  /** 分析ウィンドウ */
  window: AnalysisWindow;
  /** 対象期間 */
  period: {
    from: string;
    to: string;
  };
  /** 対象記事数 */
  total_articles: number;
  /** 前期間の記事数 */
  previous_period_articles: number;

  /** サマリー（AI生成テキスト） */
  executive_summary: string;

  /** 業界別ブレイクダウン */
  industry_breakdown: IndustryBreakdown[];

  /** テーマ別ランキング（全業界横断） */
  theme_ranking: ThemeCount[];

  /** クロスインダストリー相関 */
  cross_industry_correlations: CrossIndustryCorrelation[];

  /** 新興トレンド */
  emerging_trends: EmergingTrend[];

  /** ビジネスインサイト候補 */
  insight_candidates: InsightCandidate[];

  /** センチメント全体傾向 */
  overall_sentiment: Record<Sentiment, number>;
}

// ---------------------------------------------------------------------------
// CLI オプション
// ---------------------------------------------------------------------------

export interface AnalyzeOptions {
  window: AnalysisWindow;
  /** 対象業界フィルタ（未指定=全業界） */
  industries?: IndustryId[];
  /** 出力形式 */
  format: 'json' | 'markdown' | 'console';
  /** AI によるインサイト生成を実行するか */
  generateInsights: boolean;
}

export interface CollectOptions {
  /** 業界フィルタ */
  industries?: IndustryId[];
  /** AI による自動分析を実行するか */
  autoAnalyze: boolean;
  /** インポート元 */
  source: 'manual' | 'rss' | 'clipboard';
}
