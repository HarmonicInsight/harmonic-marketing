// =============================================================================
// Insight Media Factory — 型定義 (Re-export from insight-common)
// =============================================================================
//
// 型定義・パイプラインエンジンの本体は cross-lib-insight-common に配置:
//   config/media-factory/types.ts
//   config/media-factory/pipeline.ts
//   config/media-factory/index.ts
//
// このファイルは harmonic-marketing 側での利用を簡略化するための re-export。
// insight-common を Git サブモジュールとして追加後、以下のように切り替える:
//
//   export * from '../../../insight-common/config/media-factory';
//
// サブモジュール追加手順:
//   git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
//
// =============================================================================
//
// 現在は insight-common 未接続のため、ローカルコピーとして型定義を保持。
// 正式版は cross-lib-insight-common/config/media-factory/types.ts を参照。
// =============================================================================

// TODO: insight-common サブモジュール接続後に以下に切り替え
// export * from '../../../insight-common/config/media-factory';

// --- 以下はローカルコピー（insight-common 接続前の暫定） ---
// 正式版: https://github.com/HarmonicInsight/cross-lib-insight-common/blob/feat/media-factory-types/config/media-factory/types.ts

/** @see cross-lib-insight-common/config/media-factory/types.ts */
export type ProjectStatus =
  | 'planning'
  | 'scripting'
  | 'script_review'
  | 'slide_production'
  | 'slide_review'
  | 'video_generation'
  | 'video_review'
  | 'publishing'
  | 'published'
  | 'archived';

export type ContentFormat =
  | 'long_video'
  | 'short_video'
  | 'tutorial'
  | 'webinar'
  | 'article_only';

export type DistributionChannel =
  | 'youtube'
  | 'youtube_shorts'
  | 'note'
  | 'twitter'
  | 'all';

export type PipelineTool =
  | 'claude_api'
  | 'pptx_generator'
  | 'inmv'
  | 'youtube_uploader'
  | 'note_publisher'
  | 'twitter_poster'
  | 'human_review';

// 完全な型定義は insight-common を参照
// Full type definitions: cross-lib-insight-common/config/media-factory/types.ts
