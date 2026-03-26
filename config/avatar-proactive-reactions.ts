// =============================================================================
// VRM Avatar Proactive Reactions — アバタープロアクティブ反応設計
// =============================================================================
// OpenRoom の「AI キャラクターが環境にプロアクティブに反応する」UX を参考に、
// INAG の VRM アバターが作業状態に応じて自発的にリアクションする仕組みの設計。
//
// 設計方針:
//   - アバターは「見ているだけのお飾り」ではなく、作業パートナーとして機能
//   - 作業コンテキスト（パイプラインステージ、エラー、完了等）に応じて
//     表情・モーション・吹き出しメッセージを自動切り替え
//   - ユーザーの集中を妨げない「控えめだが気の利いた」反応を目指す
//   - VRM 1.0 Expression + Animation の標準仕様に準拠
//
// 参照: OpenRoom のキャラクター自律行動 / Stream Mode
// =============================================================================

// ---------------------------------------------------------------------------
// トリガー（反応のきっかけ）
// ---------------------------------------------------------------------------

/** 反応を引き起こすイベントの種別 */
export type ReactionTrigger =
  // パイプライン関連
  | 'pipeline_started'          // パイプライン開始
  | 'stage_completed'           // ステージ完了
  | 'stage_failed'              // ステージ失敗
  | 'pipeline_completed'        // パイプライン全完了
  | 'pipeline_failed'           // パイプライン失敗
  | 'awaiting_user_input'       // ユーザー入力待ち
  // ドキュメント操作関連
  | 'document_created'          // ドキュメント生成完了
  | 'document_exported'         // エクスポート完了
  | 'validation_passed'         // 品質チェック通過
  | 'validation_failed'         // 品質チェック不合格
  // ユーザー行動関連
  | 'user_idle'                 // ユーザーが一定時間操作なし
  | 'user_returned'             // ユーザーが戻ってきた
  | 'user_greeting'             // 朝の挨拶 / セッション開始
  | 'user_farewell'             // セッション終了
  // システム関連
  | 'long_processing'           // 処理が長引いている
  | 'error_occurred'            // エラー発生
  | 'achievement_unlocked';     // マイルストーン達成

// ---------------------------------------------------------------------------
// VRM 表情・モーション
// ---------------------------------------------------------------------------

/** VRM 1.0 標準 Expression（表情） */
export type VrmExpression =
  | 'neutral'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'relaxed'
  | 'surprised'
  | 'aa'          // 口: あ
  | 'ih'          // 口: い
  | 'ou'          // 口: う
  | 'ee'          // 口: え
  | 'oh'          // 口: お
  | 'blink'
  | 'blinkLeft'
  | 'blinkRight'
  | 'lookUp'
  | 'lookDown'
  | 'lookLeft'
  | 'lookRight';

/** アバターモーション種別 */
export type AvatarMotion =
  | 'idle'              // 待機
  | 'thinking'          // 考え中（手をあごに）
  | 'working'           // 作業中（タイピング風）
  | 'celebrating'       // 喜び（ガッツポーズ）
  | 'concerned'         // 心配（首をかしげる）
  | 'waving'            // 手を振る
  | 'nodding'           // うなずき
  | 'pointing'          // 指差し（注意喚起）
  | 'bowing'            // お辞儀
  | 'stretching';       // ストレッチ（長時間作業後）

// ---------------------------------------------------------------------------
// 反応定義
// ---------------------------------------------------------------------------

/** 吹き出しメッセージ */
export interface BubbleMessage {
  /** メッセージテキスト（日本語） */
  textJa: string;
  /** メッセージテキスト（英語） */
  textEn: string;
  /** 表示時間（ms） */
  displayDurationMs: number;
  /** フェードアウト時間（ms） */
  fadeOutMs: number;
}

/** 反応の優先度（高い方が優先） */
export type ReactionPriority = 'low' | 'medium' | 'high' | 'critical';

/** 反応定義 */
export interface ReactionDefinition {
  /** 一意の識別子 */
  id: string;
  /** トリガーイベント */
  trigger: ReactionTrigger;
  /** 優先度 */
  priority: ReactionPriority;
  /** 表情の変化 */
  expression: VrmExpression;
  /** 表情の強度 (0.0 - 1.0) */
  expressionWeight: number;
  /** モーション */
  motion: AvatarMotion;
  /** 吹き出しメッセージ候補（ランダムで1つ選択） */
  messages: BubbleMessage[];
  /** 反応までの遅延（ms） — 自然さのため */
  delayMs: number;
  /** クールダウン（同じ反応の最小間隔 ms） */
  cooldownMs: number;
  /** 条件（追加フィルタ） */
  condition?: {
    /** 時間帯制限 */
    timeRange?: { startHour: number; endHour: number };
    /** 最小アイドル時間（ms） */
    minIdleMs?: number;
    /** 特定のパイプラインタイプのみ */
    pipelineType?: string;
  };
}

// ---------------------------------------------------------------------------
// デフォルト反応セット
// ---------------------------------------------------------------------------

export const DEFAULT_REACTIONS: ReactionDefinition[] = [
  // --- パイプライン関連 ---
  {
    id: 'react_pipeline_start',
    trigger: 'pipeline_started',
    priority: 'medium',
    expression: 'happy',
    expressionWeight: 0.6,
    motion: 'nodding',
    messages: [
      { textJa: '了解です！始めますね', textEn: 'Got it! Let me start.', displayDurationMs: 3000, fadeOutMs: 500 },
      { textJa: 'お任せください！', textEn: 'Leave it to me!', displayDurationMs: 3000, fadeOutMs: 500 },
    ],
    delayMs: 300,
    cooldownMs: 5000,
  },
  {
    id: 'react_stage_done',
    trigger: 'stage_completed',
    priority: 'low',
    expression: 'relaxed',
    expressionWeight: 0.4,
    motion: 'nodding',
    messages: [
      { textJa: '次のステップに進みます', textEn: 'Moving to the next step.', displayDurationMs: 2000, fadeOutMs: 500 },
    ],
    delayMs: 200,
    cooldownMs: 3000,
  },
  {
    id: 'react_pipeline_done',
    trigger: 'pipeline_completed',
    priority: 'high',
    expression: 'happy',
    expressionWeight: 1.0,
    motion: 'celebrating',
    messages: [
      { textJa: '完了しました！確認をお願いします', textEn: 'All done! Please review.', displayDurationMs: 4000, fadeOutMs: 500 },
      { textJa: 'できました！いかがでしょうか？', textEn: 'Finished! How does it look?', displayDurationMs: 4000, fadeOutMs: 500 },
    ],
    delayMs: 500,
    cooldownMs: 10000,
  },
  {
    id: 'react_stage_failed',
    trigger: 'stage_failed',
    priority: 'high',
    expression: 'concerned' as VrmExpression, // カスタム Expression にマップ
    expressionWeight: 0.7,
    motion: 'concerned',
    messages: [
      { textJa: 'ちょっと問題が…リトライしてみます', textEn: 'Hit a snag... Retrying.', displayDurationMs: 3000, fadeOutMs: 500 },
      { textJa: 'うまくいかなかったので、もう一度やってみます', textEn: "That didn't work. Let me try again.", displayDurationMs: 3500, fadeOutMs: 500 },
    ],
    delayMs: 200,
    cooldownMs: 5000,
  },

  // --- ドキュメント操作関連 ---
  {
    id: 'react_doc_created',
    trigger: 'document_created',
    priority: 'medium',
    expression: 'happy',
    expressionWeight: 0.7,
    motion: 'nodding',
    messages: [
      { textJa: 'ドキュメントができました', textEn: 'Document is ready.', displayDurationMs: 3000, fadeOutMs: 500 },
    ],
    delayMs: 300,
    cooldownMs: 5000,
  },
  {
    id: 'react_validation_passed',
    trigger: 'validation_passed',
    priority: 'medium',
    expression: 'happy',
    expressionWeight: 0.8,
    motion: 'nodding',
    messages: [
      { textJa: '品質チェック OK です！', textEn: 'Quality check passed!', displayDurationMs: 3000, fadeOutMs: 500 },
    ],
    delayMs: 200,
    cooldownMs: 5000,
  },
  {
    id: 'react_validation_failed',
    trigger: 'validation_failed',
    priority: 'high',
    expression: 'sad',
    expressionWeight: 0.5,
    motion: 'concerned',
    messages: [
      { textJa: 'いくつか修正点が見つかりました。対応します', textEn: 'Found some issues. Fixing them.', displayDurationMs: 3500, fadeOutMs: 500 },
    ],
    delayMs: 300,
    cooldownMs: 5000,
  },

  // --- ユーザー行動関連 ---
  {
    id: 'react_user_idle',
    trigger: 'user_idle',
    priority: 'low',
    expression: 'relaxed',
    expressionWeight: 0.3,
    motion: 'stretching',
    messages: [
      { textJa: '何かお手伝いできることはありますか？', textEn: 'Anything I can help with?', displayDurationMs: 4000, fadeOutMs: 1000 },
      { textJa: 'お休み中ですか？私もちょっと休憩…', textEn: 'Taking a break? Me too...', displayDurationMs: 4000, fadeOutMs: 1000 },
    ],
    delayMs: 1000,
    cooldownMs: 120000, // 2分間隔
    condition: {
      minIdleMs: 180000, // 3分以上アイドル後
    },
  },
  {
    id: 'react_user_returned',
    trigger: 'user_returned',
    priority: 'medium',
    expression: 'happy',
    expressionWeight: 0.8,
    motion: 'waving',
    messages: [
      { textJa: 'おかえりなさい！', textEn: 'Welcome back!', displayDurationMs: 3000, fadeOutMs: 500 },
    ],
    delayMs: 500,
    cooldownMs: 60000,
  },
  {
    id: 'react_morning_greeting',
    trigger: 'user_greeting',
    priority: 'medium',
    expression: 'happy',
    expressionWeight: 0.9,
    motion: 'bowing',
    messages: [
      { textJa: 'おはようございます！今日もよろしくお願いします', textEn: 'Good morning! Ready to work.', displayDurationMs: 4000, fadeOutMs: 500 },
    ],
    delayMs: 300,
    cooldownMs: 3600000, // 1時間
    condition: {
      timeRange: { startHour: 5, endHour: 11 },
    },
  },

  // --- システム関連 ---
  {
    id: 'react_long_processing',
    trigger: 'long_processing',
    priority: 'low',
    expression: 'neutral',
    expressionWeight: 0.5,
    motion: 'thinking',
    messages: [
      { textJa: 'もう少しかかりそうです…しばらくお待ちください', textEn: 'This is taking a while... Please wait.', displayDurationMs: 3000, fadeOutMs: 500 },
      { textJa: '頑張って処理中です！', textEn: 'Working hard on it!', displayDurationMs: 3000, fadeOutMs: 500 },
    ],
    delayMs: 500,
    cooldownMs: 30000,
  },
  {
    id: 'react_error',
    trigger: 'error_occurred',
    priority: 'critical',
    expression: 'surprised',
    expressionWeight: 0.8,
    motion: 'pointing',
    messages: [
      { textJa: 'エラーが発生しました。確認してください', textEn: 'An error occurred. Please check.', displayDurationMs: 4000, fadeOutMs: 500 },
    ],
    delayMs: 100,
    cooldownMs: 10000,
  },
  {
    id: 'react_awaiting_input',
    trigger: 'awaiting_user_input',
    priority: 'medium',
    expression: 'neutral',
    expressionWeight: 0.4,
    motion: 'idle',
    messages: [
      { textJa: 'ここで確認をお願いします', textEn: 'Need your input here.', displayDurationMs: 3000, fadeOutMs: 500 },
      { textJa: '次に進む前に確認させてください', textEn: 'Let me check with you before proceeding.', displayDurationMs: 3500, fadeOutMs: 500 },
    ],
    delayMs: 500,
    cooldownMs: 10000,
  },
];

// ---------------------------------------------------------------------------
// アバター設定
// ---------------------------------------------------------------------------

/** アバタープロアクティブ反応の全体設定 */
export interface AvatarReactionConfig {
  /** 反応機能を有効にするか */
  enabled: boolean;
  /** 反応定義一覧 */
  reactions: ReactionDefinition[];
  /** 吹き出しメッセージの言語 */
  language: 'ja' | 'en';
  /** グローバル音量（効果音がある場合） */
  soundVolume: number;
  /** 反応の頻度スケール (0.0 = 無反応, 1.0 = 通常, 2.0 = 倍頻度) */
  frequencyScale: number;
  /** 集中モード（true にすると low/medium の反応を抑制） */
  focusMode: boolean;
  /** アイドル検知の閾値（ms） */
  idleThresholdMs: number;
}

/** デフォルト設定 */
export const DEFAULT_AVATAR_REACTION_CONFIG: AvatarReactionConfig = {
  enabled: true,
  reactions: DEFAULT_REACTIONS,
  language: 'ja',
  soundVolume: 0.5,
  frequencyScale: 1.0,
  focusMode: false,
  idleThresholdMs: 180000, // 3分
};
