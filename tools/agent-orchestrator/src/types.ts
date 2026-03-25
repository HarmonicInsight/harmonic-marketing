// =============================================================================
// HARMONIC Agent Orchestrator — 型定義
// =============================================================================
// 4 天使エージェント × チャット CLI システム
//
//   Michael  (ミカエル)  — 市場調査 → 新製品企画チーム
//   Raphael  (ラファエル) — 既存製品メンテナンス・品質向上チーム
//   Gabriel  (ガブリエル) — 顧客要望分析・実現チーム
//   Uriel    (ウリエル)  — 社内ツール開発チーム
//
// 各チームは Claude Code CLI 風の対話型チャットで操作。
// エージェントが自律的にサブタスクを実行し、結果を報告。
// ユーザーは報告を受けて次の指示を出す。
// =============================================================================

// ---------------------------------------------------------------------------
// 天使エージェント
// ---------------------------------------------------------------------------

/** チーム（天使）識別子 */
export type ArchangelId = 'michael' | 'raphael' | 'gabriel' | 'uriel';

/** 天使エージェント定義 */
export interface ArchangelDefinition {
  id: ArchangelId;
  nameEn: string;
  nameJa: string;
  emoji: string;
  teamNameJa: string;
  description: string;
  systemPrompt: string;
  /** このエージェントが使えるサブコマンド */
  commands: SubCommand[];
  /** 配下のサブエージェント役割 */
  subAgents: SubAgentRole[];
}

/** サブエージェント役割 */
export interface SubAgentRole {
  role: string;
  nameJa: string;
  description: string;
  systemPromptSuffix: string;
}

/** チャット内サブコマンド */
export interface SubCommand {
  name: string;
  description: string;
  usage: string;
}

// ---------------------------------------------------------------------------
// チャット
// ---------------------------------------------------------------------------

/** メッセージの送信者 */
export type MessageSender = 'user' | ArchangelId | 'system';

/** チャットメッセージ */
export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  /** サブエージェントからの報告の場合 */
  subAgentRole?: string;
  /** 添付アーティファクト */
  artifacts?: Artifact[];
}

/** アーティファクト（コード・ドキュメント・分析結果等） */
export interface Artifact {
  type: 'code' | 'document' | 'analysis' | 'prd' | 'test_result' | 'data';
  title: string;
  content: string;
  language?: string;
  filePath?: string;
}

/** チャットセッション */
export interface ChatSession {
  id: string;
  archangel: ArchangelId;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** 現在アクティブなタスク */
  activeTask?: TaskContext;
}

// ---------------------------------------------------------------------------
// タスク
// ---------------------------------------------------------------------------

/** タスクの状態 */
export type TaskStatus =
  | 'analyzing'     // タスク分析中
  | 'planning'      // 実行計画作成中
  | 'executing'     // サブエージェント実行中
  | 'reviewing'     // 結果レビュー中
  | 'awaiting_user' // ユーザー指示待ち
  | 'completed'     // 完了
  | 'failed';       // 失敗

/** タスクコンテキスト */
export interface TaskContext {
  id: string;
  description: string;
  status: TaskStatus;
  plan?: TaskPlan;
  results: SubAgentResult[];
  productCodes?: string[];
  createdAt: string;
}

/** 実行計画 */
export interface TaskPlan {
  steps: PlanStep[];
  estimatedSteps: number;
  currentStep: number;
}

/** 計画ステップ */
export interface PlanStep {
  index: number;
  description: string;
  subAgentRole: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

/** サブエージェント実行結果 */
export interface SubAgentResult {
  role: string;
  output: string;
  artifacts?: Artifact[];
  tokenUsage?: { input: number; output: number };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// HARMONIC 製品コンテキスト
// ---------------------------------------------------------------------------

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  tech: string;
  status: string;
  currentVersion: string | null;
}

// ---------------------------------------------------------------------------
// SIPO 品質ゲート
// ---------------------------------------------------------------------------

export interface SipoGateResult {
  source: { valid: boolean; issues: string[] };
  input: { valid: boolean; issues: string[] };
  process: { valid: boolean; issues: string[] };
  output: { valid: boolean; issues: string[] };
  passed: boolean;
}

// ---------------------------------------------------------------------------
// 設定
// ---------------------------------------------------------------------------

export interface OrchestratorConfig {
  model: string;
  maxConcurrentSubAgents: number;
  enableSipoGate: boolean;
  logDir: string;
  dryRun: boolean;
  verbose: boolean;
  /** セッション履歴の保存先 */
  sessionDir: string;
}

export const DEFAULT_CONFIG: OrchestratorConfig = {
  model: 'claude-sonnet-4-20250514',
  maxConcurrentSubAgents: 3,
  enableSipoGate: true,
  logDir: './logs',
  dryRun: false,
  verbose: false,
  sessionDir: './sessions',
};
