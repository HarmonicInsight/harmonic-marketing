/**
 * Redisキュー ジョブ型定義
 *
 * Insight Series の解析ジョブをRedisキューで管理するための型定義。
 * ポーリング方式からイベント駆動方式への移行基盤。
 */

// ジョブの種類
export type JobType =
  | 'file_analysis'        // ファイル解析（Excel, PPTX等）
  | 'content_generation'   // コンテンツ生成
  | 'diff_analysis'        // 差分解析
  | 'batch_process';       // バッチ処理

// ジョブの状態
export type JobStatus =
  | 'waiting'       // キュー待ち
  | 'active'        // 処理中
  | 'completed'     // 完了
  | 'failed'        // 失敗
  | 'stalled';      // スタック（タイムアウト）

// ジョブペイロード：ファイル解析
export interface FileAnalysisPayload {
  type: 'file_analysis';
  filePath: string;           // BLOBストレージ上のパス
  fileName: string;           // 元のファイル名
  mimeType: string;           // application/vnd.ms-excel 等
  analysisPrompt?: string;    // カスタム解析指示
  referenceFiles?: string[];  // 参照ファイルパス群
}

// ジョブペイロード：コンテンツ生成
export interface ContentGenerationPayload {
  type: 'content_generation';
  sourceFiles: string[];      // 入力ファイル群
  outputFormat: 'markdown' | 'json' | 'html';
  template?: string;          // テンプレート名
  instructions: string;       // 生成指示
}

// ジョブペイロード：差分解析
export interface DiffAnalysisPayload {
  type: 'diff_analysis';
  baseFilePath: string;       // 比較元
  targetFilePath: string;     // 比較先
  focusAreas?: string[];      // 注目領域（シート名、セル範囲等）
}

// ジョブペイロード：バッチ処理
export interface BatchProcessPayload {
  type: 'batch_process';
  filePaths: string[];        // 処理対象ファイル群
  operation: string;          // 操作名
  params?: Record<string, unknown>;
}

// 全ペイロードのユニオン型
export type JobPayload =
  | FileAnalysisPayload
  | ContentGenerationPayload
  | DiffAnalysisPayload
  | BatchProcessPayload;

// ジョブデータ（キューに投入される単位）
export interface JobData {
  id: string;                 // UUID
  payload: JobPayload;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;          // ISO timestamp
  requestedBy?: string;       // リクエスト元ユーザー/API
  callbackUrl?: string;       // 完了通知WebhookURL
  maxRetries?: number;        // 最大リトライ回数（デフォルト: 3）
  timeoutMs?: number;         // タイムアウト（デフォルト: 300000 = 5分）
}

// ジョブ結果
export interface JobResult {
  jobId: string;
  status: 'completed' | 'failed';
  output?: string;            // Claude Code CLIの出力
  error?: string;             // エラーメッセージ
  duration: number;           // 処理時間（ms）
  completedAt: string;        // ISO timestamp
}

// Redis接続設定
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
}

// ワーカー設定
export interface WorkerConfig {
  concurrency: number;        // 同時処理数
  redis: RedisConfig;
  queueName: string;
  claudeCliPath?: string;     // Claude Code CLIのパス
  workDir?: string;           // 作業ディレクトリ
}

// デフォルト設定
export const DEFAULT_REDIS_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
};

export const QUEUE_NAME = 'harmonic:analysis';

export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10),
  redis: DEFAULT_REDIS_CONFIG,
  queueName: QUEUE_NAME,
};
