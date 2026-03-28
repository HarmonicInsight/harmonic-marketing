/**
 * ジョブ投入API（Producer）
 *
 * Express/Fastifyなどのサーバーから呼び出して
 * ジョブをRedisキューに追加するためのAPI。
 *
 * 使い方:
 *   import { submitAnalysis, submitDiff } from './producer.js';
 *
 *   // ファイルアップロード時に呼び出し
 *   app.post('/api/upload', async (req, res) => {
 *     const jobId = await submitAnalysis(filePath, fileName, mimeType);
 *     res.json({ jobId, status: 'queued' });
 *   });
 */

import { enqueueJob, getJobStatus, getQueueStats } from './queue.js';
import type {
  FileAnalysisPayload,
  ContentGenerationPayload,
  DiffAnalysisPayload,
  BatchProcessPayload,
} from './types.js';

/**
 * ファイル解析ジョブを投入
 *
 * DBレコード挿入と同時に呼び出すことで、
 * ポーリングの15秒遅延なしに即座にワーカーが処理を開始する。
 */
export async function submitAnalysis(
  filePath: string,
  fileName: string,
  mimeType: string,
  options?: {
    analysisPrompt?: string;
    referenceFiles?: string[];
    priority?: 'high' | 'normal' | 'low';
    callbackUrl?: string;
    requestedBy?: string;
  },
): Promise<string> {
  const payload: FileAnalysisPayload = {
    type: 'file_analysis',
    filePath,
    fileName,
    mimeType,
    analysisPrompt: options?.analysisPrompt,
    referenceFiles: options?.referenceFiles,
  };

  return enqueueJob(payload, {
    priority: options?.priority ?? 'normal',
    callbackUrl: options?.callbackUrl,
    requestedBy: options?.requestedBy,
  });
}

/**
 * 差分解析ジョブを投入
 */
export async function submitDiff(
  baseFilePath: string,
  targetFilePath: string,
  options?: {
    focusAreas?: string[];
    priority?: 'high' | 'normal' | 'low';
    callbackUrl?: string;
    requestedBy?: string;
  },
): Promise<string> {
  const payload: DiffAnalysisPayload = {
    type: 'diff_analysis',
    baseFilePath,
    targetFilePath,
    focusAreas: options?.focusAreas,
  };

  return enqueueJob(payload, {
    priority: options?.priority ?? 'high',
    callbackUrl: options?.callbackUrl,
    requestedBy: options?.requestedBy,
  });
}

/**
 * コンテンツ生成ジョブを投入
 */
export async function submitContentGeneration(
  sourceFiles: string[],
  instructions: string,
  options?: {
    outputFormat?: 'markdown' | 'json' | 'html';
    template?: string;
    priority?: 'high' | 'normal' | 'low';
    callbackUrl?: string;
    requestedBy?: string;
  },
): Promise<string> {
  const payload: ContentGenerationPayload = {
    type: 'content_generation',
    sourceFiles,
    outputFormat: options?.outputFormat ?? 'json',
    instructions,
    template: options?.template,
  };

  return enqueueJob(payload, {
    priority: options?.priority,
    callbackUrl: options?.callbackUrl,
    requestedBy: options?.requestedBy,
  });
}

/**
 * バッチ処理ジョブを投入
 */
export async function submitBatch(
  filePaths: string[],
  operation: string,
  options?: {
    params?: Record<string, unknown>;
    priority?: 'high' | 'normal' | 'low';
    callbackUrl?: string;
    requestedBy?: string;
  },
): Promise<string> {
  const payload: BatchProcessPayload = {
    type: 'batch_process',
    filePaths,
    operation,
    params: options?.params,
  };

  return enqueueJob(payload, {
    priority: options?.priority ?? 'low',
    callbackUrl: options?.callbackUrl,
    requestedBy: options?.requestedBy,
  });
}

// Re-export for convenience
export { getJobStatus, getQueueStats };
