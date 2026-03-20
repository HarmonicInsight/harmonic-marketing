// =============================================================================
// Social Poster — 型定義
// =============================================================================

/** 投稿先プラットフォーム */
export type Platform = 'twitter' | 'note' | 'all';

/** コンテンツ種別 */
export type ContentType =
  | 'product_update'      // 製品アップデート告知
  | 'tips'                // 使い方 Tips
  | 'case_study'          // 活用事例
  | 'behind_the_scenes'   // 開発裏話
  | 'industry_insight'    // 業界トレンド × 製品
  | 'comparison'          // 競合比較
  | 'free_plan_promo';    // FREE プラン訴求

/** 投稿のトーン */
export type Tone = 'professional' | 'casual' | 'technical' | 'storytelling';

/** Twitter 投稿データ */
export interface TwitterPost {
  /** メイン投稿テキスト（280文字以内 — 日本語は140文字換算） */
  text: string;
  /** スレッド投稿（オプション） */
  thread?: string[];
  /** メディア（画像パス） */
  mediaFiles?: string[];
}

/** note.com 投稿データ */
export interface NotePost {
  /** 記事タイトル */
  title: string;
  /** 本文（Markdown） */
  body: string;
  /** カテゴリ */
  category: NoteCategory;
  /** タグ（最大5つ） */
  tags: string[];
  /** アイキャッチ画像パス（オプション） */
  eyecatchPath?: string;
  /** 公開設定 */
  publishStatus: 'draft' | 'published';
}

/** note.com カテゴリ */
export type NoteCategory =
  | 'tech'
  | 'business'
  | 'idea'
  | 'lifestyle';

/** 生成リクエスト */
export interface GenerateRequest {
  /** コンテンツ種別 */
  contentType: ContentType;
  /** 対象プラットフォーム */
  platform: Platform;
  /** トーン */
  tone: Tone;
  /** 対象製品コード */
  productCodes?: string[];
  /** カスタムトピック（自由記述） */
  topic?: string;
  /** 追加コンテキスト */
  context?: string;
}

/** 生成結果 */
export interface GeneratedContent {
  twitter?: TwitterPost;
  note?: NotePost;
  generatedAt: string;
  prompt: string;
}

/** 投稿結果 */
export interface PostResult {
  platform: 'twitter' | 'note';
  success: boolean;
  url?: string;
  error?: string;
  postedAt: string;
}

/** CLI オプション */
export interface CliOptions {
  platform: Platform;
  contentType: ContentType;
  tone: Tone;
  productCodes: string[];
  topic?: string;
  dryRun: boolean;
  schedule: boolean;
  templateFile?: string;
  skipConfirm: boolean;
}

/** 投稿履歴エントリ */
export interface PostHistoryEntry {
  id: string;
  generatedAt: string;
  postedAt?: string;
  platform: Platform;
  contentType: ContentType;
  content: GeneratedContent;
  results: PostResult[];
}
