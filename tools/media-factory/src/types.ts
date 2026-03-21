// =============================================================================
// Insight Media Factory — 型定義
// =============================================================================
//
// コンテンツ企画 → 台本 → パワポ → 動画 → マルチチャネル配信を
// 1つのパイプラインとして統合管理する。
//
// 依存: cross-lib-insight-common
//   - config/video-content-pipeline.ts    (VideoFormatPresetId, SceneTemplate)
//   - config/training-studio-video-api.ts (VideoJobRequest, VideoJobStatus)
//   - config/youtube-integration.ts       (YouTubeUploadConfig)
//   - config/video-production-guide.ts    (PptxDesignRules)
//
// 連携: harmonic-marketing/tools/social-poster
//   - TwitterPost, NotePost の型を再利用
// =============================================================================

// -----------------------------------------------------------------------------
// プロジェクト管理
// -----------------------------------------------------------------------------

/** メディアプロジェクトの全体ステータス */
export type ProjectStatus =
  | 'planning'          // 企画中（テーマ・ターゲット決定）
  | 'scripting'         // 台本作成中
  | 'script_review'     // 台本レビュー待ち
  | 'slide_production'  // パワポ作成中
  | 'slide_review'      // パワポレビュー待ち
  | 'video_generation'  // INMV で動画生成中
  | 'video_review'      // 動画レビュー待ち
  | 'publishing'        // 配信中（YouTube + note + Twitter）
  | 'published'         // 配信完了
  | 'archived';         // アーカイブ済み

/** コンテンツフォーマット */
export type ContentFormat =
  | 'long_video'        // 10〜15分の解説動画（16:9）
  | 'short_video'       // 30〜60秒のショート（9:16）
  | 'tutorial'          // チュートリアル（16:9、長尺）
  | 'webinar'           // ウェビナー録画（16:9、長尺）
  | 'article_only';     // 記事のみ（動画なし）

/** 配信チャネル */
export type DistributionChannel =
  | 'youtube'
  | 'youtube_shorts'
  | 'note'
  | 'twitter'
  | 'all';

/** メディアプロジェクト — 1つのコンテンツの企画〜配信を管理 */
export interface MediaProject {
  /** プロジェクトID */
  id: string;
  /** タイトル（内部管理用） */
  title: string;
  /** コンテンツフォーマット */
  format: ContentFormat;
  /** 現在のステータス */
  status: ProjectStatus;
  /** ターゲット */
  target: TargetAudience;
  /** 企画情報 */
  planning: PlanningInfo;
  /** 台本 */
  script?: ScriptData;
  /** パワポ */
  slides?: SlideData;
  /** 動画 */
  video?: VideoData;
  /** 配信情報 */
  distribution?: DistributionData;
  /** SNS告知 */
  promotion?: PromotionData;
  /** タイムライン */
  timeline: TimelineEntry[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 企画フェーズ
// -----------------------------------------------------------------------------

/** ターゲットオーディエンス */
export interface TargetAudience {
  /** 業種 */
  industry: string;
  /** 職種・役職 */
  roles: string[];
  /** 課題・ペイン */
  painPoints: string[];
  /** 期待するアクション */
  desiredAction: string;
}

/** 企画情報 */
export interface PlanningInfo {
  /** テーマ */
  theme: string;
  /** フック（最初の30秒で伝えること） */
  hook: string;
  /** キーメッセージ（1文で要約） */
  keyMessage: string;
  /** 想定尺（秒） */
  durationSec: number;
  /** 関連するknow-howドキュメント */
  sourceDocuments: string[];
  /** CTA（Call to Action） */
  cta: string;
  /** シリーズ情報（連作の場合） */
  series?: SeriesInfo;
}

/** シリーズ情報 */
export interface SeriesInfo {
  /** シリーズID */
  seriesId: string;
  /** シリーズ名 */
  seriesName: string;
  /** このエピソードの番号 */
  episodeNumber: number;
  /** 前回のプロジェクトID */
  previousEpisodeId?: string;
  /** 次回予告テーマ */
  nextEpisodeTeaser?: string;
}

// -----------------------------------------------------------------------------
// 台本フェーズ
// -----------------------------------------------------------------------------

/** 台本データ */
export interface ScriptData {
  /** 台本バージョン */
  version: string;
  /** 章構成 */
  chapters: ScriptChapter[];
  /** 想定合計尺（秒） */
  totalDurationSec: number;
  /** 台本ファイルパス（Markdownファイル） */
  scriptFilePath: string;
  /** レビューステータス */
  reviewStatus: ReviewStatus;
  /** レビューコメント */
  reviewComments: string[];
}

/** 台本の章 */
export interface ScriptChapter {
  /** 章番号 */
  number: number;
  /** 章タイトル */
  title: string;
  /** ナレーション原稿 */
  narration: string;
  /** スライド指示（この章で使うスライドの概要） */
  slideDirection: string;
  /** 想定尺（秒） */
  durationSec: number;
  /** スピーカーノート（パワポのノート欄に転記） */
  speakerNotes: string;
}

/** レビューステータス */
export type ReviewStatus =
  | 'draft'
  | 'in_review'
  | 'revision_requested'
  | 'approved';

// -----------------------------------------------------------------------------
// パワポフェーズ
// -----------------------------------------------------------------------------

/** スライドデータ */
export interface SlideData {
  /** PPTX ファイルパス */
  pptxFilePath: string;
  /** スライド枚数 */
  slideCount: number;
  /** デザインテンプレート */
  designTemplate: DesignTemplate;
  /** 各スライドのメタデータ */
  slides: SlideMetadata[];
  /** レビューステータス */
  reviewStatus: ReviewStatus;
}

/** デザインテンプレート */
export interface DesignTemplate {
  /** テンプレート名 */
  name: string;
  /** ブランドカラー */
  brandColors: {
    primary: string;    // Gold: #B8942F
    secondary: string;  // Ivory: #FAF8F5
    dark: string;       // Dark: #1C1917
    accent?: string;
  };
  /** フォント */
  fonts: {
    heading: string;    // Noto Sans JP
    body: string;       // Noto Sans JP
    code?: string;      // JetBrains Mono
  };
  /** アスペクト比 */
  aspectRatio: '16:9' | '9:16';
}

/** スライド1枚のメタデータ */
export interface SlideMetadata {
  /** スライド番号（1始まり） */
  slideNumber: number;
  /** 対応する台本チャプター番号 */
  chapterNumber: number;
  /** スライドタイトル */
  title: string;
  /** スライドタイプ */
  type: SlideType;
  /** ノート欄テキスト（ナレーション原稿） */
  notes: string;
  /** 想定表示時間（秒） */
  durationSec: number;
}

/** スライドタイプ */
export type SlideType =
  | 'title'           // タイトルスライド
  | 'agenda'          // 目次
  | 'content'         // 本文（テキスト + 図解）
  | 'comparison'      // 比較表
  | 'diagram'         // 図解メイン
  | 'quote'           // 引用・メッセージ
  | 'data'            // データ・グラフ
  | 'summary'         // まとめ
  | 'cta'             // CTA（問い合わせ誘導）
  | 'next_preview';   // 次回予告

// -----------------------------------------------------------------------------
// 動画フェーズ
// -----------------------------------------------------------------------------

/** 動画データ */
export interface VideoData {
  /** INMV ジョブID */
  inmvJobId?: string;
  /** INMV ジョブステータス */
  inmvJobStatus?: InmvJobStatus;
  /** 出力ファイルパス */
  outputFilePath?: string;
  /** 出力フォーマット */
  outputFormat: VideoOutputFormat;
  /** ナレーション設定 */
  narration: NarrationConfig;
  /** 字幕設定 */
  subtitles: SubtitleConfig;
  /** サムネイル */
  thumbnail?: ThumbnailData;
  /** レビューステータス */
  reviewStatus: ReviewStatus;
}

/** INMV ジョブステータス */
export type InmvJobStatus =
  | 'queued'
  | 'importing'       // PPTX取り込み中
  | 'narrating'       // VOICEVOX音声生成中
  | 'composing'       // トランジション + 字幕合成中
  | 'exporting'       // MP4出力中
  | 'completed'
  | 'failed';

/** 動画出力フォーマット */
export type VideoOutputFormat =
  | 'mp4_720p'
  | 'mp4_1080p'
  | 'mp4_2k'
  | 'mp4_4k'
  | 'shorts_1080p';

/** ナレーション設定 */
export interface NarrationConfig {
  /** VOICEVOX スピーカー */
  speaker: VoicevoxSpeaker;
  /** 話速（0.5〜2.0、デフォルト1.0） */
  speed: number;
  /** シーン間ポーズ（ms） */
  pauseBetweenScenes: number;
}

/** VOICEVOX スピーカー */
export type VoicevoxSpeaker =
  | 'zundamon'         // ずんだもん（プロフェッショナル）
  | 'shikoku_metan'    // 四国めたん（フレンドリー）
  | 'amahare_hau';     // 雨晴はう（落ち着き）

/** 字幕設定 */
export interface SubtitleConfig {
  /** 字幕を有効にするか */
  enabled: boolean;
  /** フォントサイズ（px） */
  fontSize: number;
  /** 背景の不透明度（0.0〜1.0） */
  backgroundOpacity: number;
  /** 1行あたり最大文字数 */
  maxCharsPerLine: number;
}

/** サムネイルデータ */
export interface ThumbnailData {
  /** サムネイル画像パス */
  imagePath: string;
  /** メインコピー */
  mainCopy: string;
  /** サブコピー */
  subCopy?: string;
}

// -----------------------------------------------------------------------------
// 配信フェーズ
// -----------------------------------------------------------------------------

/** 配信データ */
export interface DistributionData {
  /** 配信チャネルごとの結果 */
  channels: ChannelPublishResult[];
  /** 配信予定日時 */
  scheduledAt?: string;
  /** 同時配信するか */
  simultaneousRelease: boolean;
}

/** チャネル別配信結果 */
export interface ChannelPublishResult {
  /** チャネル */
  channel: DistributionChannel;
  /** 配信ステータス */
  status: PublishStatus;
  /** 公開URL */
  url?: string;
  /** プラットフォーム固有ID */
  platformId?: string;
  /** 配信日時 */
  publishedAt?: string;
  /** エラー */
  error?: string;
}

/** 配信ステータス */
export type PublishStatus =
  | 'pending'
  | 'uploading'
  | 'processing'      // YouTube のエンコード処理等
  | 'published'
  | 'failed';

// -----------------------------------------------------------------------------
// SNS告知フェーズ
// -----------------------------------------------------------------------------

/** SNS告知データ */
export interface PromotionData {
  /** Twitter告知 */
  twitter?: TwitterPromotionPlan;
  /** note.com記事 */
  note?: NotePromotionPlan;
}

/** Twitter告知プラン */
export interface TwitterPromotionPlan {
  /** 公開時の告知ツイート */
  launchTweet: string;
  /** スレッド投稿（要点の抜粋） */
  thread?: string[];
  /** フォローアップ投稿（翌日以降） */
  followUpTweets?: ScheduledTweet[];
  /** 投稿結果 */
  results?: TwitterPostResult[];
}

/** スケジュール投稿 */
export interface ScheduledTweet {
  /** 投稿テキスト */
  text: string;
  /** 予定日時 */
  scheduledAt: string;
  /** 投稿済みか */
  posted: boolean;
}

/** Twitter投稿結果 */
export interface TwitterPostResult {
  tweetId?: string;
  url?: string;
  postedAt: string;
  success: boolean;
  error?: string;
}

/** note.com告知プラン */
export interface NotePromotionPlan {
  /** 記事タイトル */
  title: string;
  /** 記事本文（Markdown） */
  body: string;
  /** カテゴリ */
  category: 'tech' | 'business' | 'idea' | 'lifestyle';
  /** タグ */
  tags: string[];
  /** 動画の文字起こし・図解を含むか */
  includeTranscript: boolean;
  /** 投稿結果 */
  result?: NotePostResult;
}

/** note.com投稿結果 */
export interface NotePostResult {
  noteId?: string;
  url?: string;
  postedAt: string;
  success: boolean;
  error?: string;
}

// -----------------------------------------------------------------------------
// タイムライン
// -----------------------------------------------------------------------------

/** タイムラインエントリ */
export interface TimelineEntry {
  /** タイムスタンプ */
  timestamp: string;
  /** フェーズ */
  phase: ProjectStatus;
  /** アクション */
  action: string;
  /** 詳細 */
  detail?: string;
  /** 実行者（human / ai） */
  actor: 'human' | 'ai';
}

// -----------------------------------------------------------------------------
// パイプライン定義
// -----------------------------------------------------------------------------

/** パイプラインステップ定義 */
export interface PipelineStep {
  /** ステップID */
  id: string;
  /** ステップ名 */
  name: string;
  /** 対応するProjectStatus */
  status: ProjectStatus;
  /** 入力 */
  input: string;
  /** 出力 */
  output: string;
  /** 使用ツール */
  tool: PipelineTool;
  /** 自動実行可能か */
  automatable: boolean;
  /** 前提ステップ */
  dependsOn: string[];
}

/** パイプラインで使用するツール */
export type PipelineTool =
  | 'claude_api'           // Claude API で台本・SNS文面生成
  | 'pptx_generator'       // IOSD / PowerPoint でスライド生成
  | 'inmv'                 // Training Studio で動画生成
  | 'youtube_uploader'     // YouTube アップロード
  | 'note_publisher'       // note.com 記事投稿
  | 'twitter_poster'       // Twitter/X 投稿
  | 'human_review';        // 人間レビュー

/**
 * Insight Media Factory のデフォルトパイプライン
 *
 * 企画 → 台本 → レビュー → パワポ → レビュー → 動画 → レビュー → 配信 → 告知
 */
export const DEFAULT_PIPELINE: PipelineStep[] = [
  {
    id: 'plan',
    name: '企画',
    status: 'planning',
    input: 'テーマ・ターゲット・know-howドキュメント',
    output: 'PlanningInfo（フック・キーメッセージ・CTA）',
    tool: 'claude_api',
    automatable: true,
    dependsOn: [],
  },
  {
    id: 'script',
    name: '台本作成',
    status: 'scripting',
    input: 'PlanningInfo + ソースドキュメント',
    output: 'ScriptData（章構成 + ナレーション原稿）',
    tool: 'claude_api',
    automatable: true,
    dependsOn: ['plan'],
  },
  {
    id: 'script_review',
    name: '台本レビュー',
    status: 'script_review',
    input: 'ScriptData',
    output: '承認済みScriptData',
    tool: 'human_review',
    automatable: false,
    dependsOn: ['script'],
  },
  {
    id: 'slides',
    name: 'パワポ作成',
    status: 'slide_production',
    input: '承認済みScriptData',
    output: 'SlideData（PPTX + ノート欄にナレーション）',
    tool: 'pptx_generator',
    automatable: true,
    dependsOn: ['script_review'],
  },
  {
    id: 'slide_review',
    name: 'パワポレビュー',
    status: 'slide_review',
    input: 'SlideData',
    output: '承認済みSlideData',
    tool: 'human_review',
    automatable: false,
    dependsOn: ['slides'],
  },
  {
    id: 'video',
    name: '動画生成',
    status: 'video_generation',
    input: '承認済みSlideData（PPTX）',
    output: 'VideoData（MP4 + 字幕 + サムネイル）',
    tool: 'inmv',
    automatable: true,
    dependsOn: ['slide_review'],
  },
  {
    id: 'video_review',
    name: '動画レビュー',
    status: 'video_review',
    input: 'VideoData',
    output: '承認済みVideoData',
    tool: 'human_review',
    automatable: false,
    dependsOn: ['video'],
  },
  {
    id: 'publish',
    name: '同時配信',
    status: 'publishing',
    input: '承認済みVideoData + メタデータ',
    output: 'DistributionData（YouTube URL + note URL）',
    tool: 'youtube_uploader',
    automatable: true,
    dependsOn: ['video_review'],
  },
  {
    id: 'promote',
    name: 'SNS告知',
    status: 'publishing',
    input: 'DistributionData（公開URL）',
    output: 'PromotionData（Twitter投稿 + フォローアップ）',
    tool: 'twitter_poster',
    automatable: true,
    dependsOn: ['publish'],
  },
];

// -----------------------------------------------------------------------------
// プロジェクト一覧管理
// -----------------------------------------------------------------------------

/** プロジェクト一覧のサマリー */
export interface ProjectSummary {
  id: string;
  title: string;
  format: ContentFormat;
  status: ProjectStatus;
  series?: string;
  createdAt: string;
  updatedAt: string;
  /** 次にやるべきアクション */
  nextAction: string;
  /** 配信済みURL */
  publishedUrls?: Record<DistributionChannel, string>;
}

/** ダッシュボード統計 */
export interface FactoryDashboard {
  /** ステータス別プロジェクト数 */
  statusCounts: Record<ProjectStatus, number>;
  /** 今月の配信数 */
  publishedThisMonth: number;
  /** レビュー待ちの数 */
  pendingReviews: number;
  /** 直近のプロジェクト */
  recentProjects: ProjectSummary[];
  /** シリーズ一覧 */
  activeSeries: SeriesInfo[];
}
