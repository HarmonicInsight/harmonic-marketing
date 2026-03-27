/**
 * @harmonic/job-queue
 *
 * Redisベースのジョブキューシステム。
 * ポーリング方式からイベント駆動方式への移行基盤。
 *
 * アーキテクチャ:
 *   ファイルアップロード
 *       ↓
 *   DBにレコード挿入 ＋ Redisキューにジョブ追加
 *       ↓ 即時通知
 *   Workerプロセス（常駐）
 *       ↓ キューを監視
 *   Claude Code CLI起動
 *       ↓ 解析完了
 *   DBに結果書き込み + Webhook通知
 *       ↓
 *   クライアントに結果返却
 */

// Producer API（ジョブ投入側）
export {
  submitAnalysis,
  submitDiff,
  submitContentGeneration,
  submitBatch,
  getJobStatus,
  getQueueStats,
} from './producer.js';

// Queue管理
export {
  getQueue,
  getQueueEvents,
  enqueueJob,
  closeQueue,
} from './queue.js';

// Worker
export { startWorker } from './worker.js';

// Types
export type {
  JobType,
  JobStatus,
  JobData,
  JobPayload,
  JobResult,
  FileAnalysisPayload,
  ContentGenerationPayload,
  DiffAnalysisPayload,
  BatchProcessPayload,
  RedisConfig,
  WorkerConfig,
} from './types.js';
