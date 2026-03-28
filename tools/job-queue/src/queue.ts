/**
 * Redisキュー管理
 *
 * BullMQを使用したジョブキューの生成・管理。
 * Producer（ジョブ投入）とConsumer（ジョブ取得）の両方を提供。
 */

import { Queue, QueueEvents } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  type JobData,
  type JobPayload,
  type RedisConfig,
  DEFAULT_REDIS_CONFIG,
  QUEUE_NAME,
} from './types.js';

// BullMQ優先度マッピング（数値が小さいほど高優先度）
const PRIORITY_MAP = { high: 1, normal: 5, low: 10 } as const;

let queueInstance: Queue | null = null;
let queueEventsInstance: QueueEvents | null = null;

/**
 * キューのシングルトン取得
 */
export function getQueue(redis: RedisConfig = DEFAULT_REDIS_CONFIG): Queue {
  if (!queueInstance) {
    queueInstance = new Queue(QUEUE_NAME, {
      connection: {
        host: redis.host,
        port: redis.port,
        password: redis.password,
        db: redis.db,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },  // 24時間 or 1000件
        removeOnFail: { age: 604800, count: 5000 },     // 7日間 or 5000件
      },
    });
  }
  return queueInstance;
}

/**
 * キューイベント監視のシングルトン取得
 */
export function getQueueEvents(redis: RedisConfig = DEFAULT_REDIS_CONFIG): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = new QueueEvents(QUEUE_NAME, {
      connection: {
        host: redis.host,
        port: redis.port,
        password: redis.password,
        db: redis.db,
        maxRetriesPerRequest: null,
      },
    });
  }
  return queueEventsInstance;
}

/**
 * ジョブをキューに追加
 *
 * @example
 * const jobId = await enqueueJob({
 *   type: 'file_analysis',
 *   filePath: '/data/uploads/report.xlsx',
 *   fileName: 'report.xlsx',
 *   mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 * });
 */
export async function enqueueJob(
  payload: JobPayload,
  options?: {
    priority?: 'high' | 'normal' | 'low';
    requestedBy?: string;
    callbackUrl?: string;
    timeoutMs?: number;
  },
): Promise<string> {
  const queue = getQueue();
  const jobId = randomUUID();

  const jobData: JobData = {
    id: jobId,
    payload,
    priority: options?.priority ?? 'normal',
    createdAt: new Date().toISOString(),
    requestedBy: options?.requestedBy,
    callbackUrl: options?.callbackUrl,
    timeoutMs: options?.timeoutMs,
  };

  await queue.add(payload.type, jobData, {
    jobId,
    priority: PRIORITY_MAP[jobData.priority],
    ...(options?.timeoutMs && { timeout: options.timeoutMs }),
  });

  console.log(`[Queue] Job enqueued: ${jobId} (${payload.type})`);
  return jobId;
}

/**
 * ジョブの状態を取得
 */
export async function getJobStatus(jobId: string) {
  const queue = getQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    data: job.data as JobData,
    progress: job.progress,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

/**
 * キュー統計情報を取得
 */
export async function getQueueStats() {
  const queue = getQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * キューとイベント監視のクリーンアップ
 */
export async function closeQueue(): Promise<void> {
  if (queueEventsInstance) {
    await queueEventsInstance.close();
    queueEventsInstance = null;
  }
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
