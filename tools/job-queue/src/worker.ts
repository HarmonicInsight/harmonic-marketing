/**
 * Redisキュー ワーカープロセス
 *
 * 常駐プロセスとしてRedisキューを監視し、
 * ジョブを取得してClaude Code CLIで処理する。
 *
 * 【ポーリング方式との違い】
 * - ポーリング: 15秒ごとにDBを問い合わせ → 最大15秒遅延
 * - キュー方式: Redisからプッシュ通知 → ほぼ即時処理開始
 *
 * 起動: npm run worker
 */

import { Worker, Job } from 'bullmq';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import {
  type JobData,
  type JobResult,
  type WorkerConfig,
  DEFAULT_WORKER_CONFIG,
  QUEUE_NAME,
} from './types.js';

/**
 * Claude Code CLIを子プロセスとして実行
 */
async function executeClaudeCli(
  prompt: string,
  workDir: string,
  timeoutMs: number = 300_000,
): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolvePromise, reject) => {
    const cliPath = process.env.CLAUDE_CLI_PATH ?? 'claude';
    const args = ['--print', '--output-format', 'text', prompt];

    console.log(`[CLI] Executing: ${cliPath} --print ...`);
    console.log(`[CLI] Work dir: ${workDir}`);

    const child = spawn(cliPath, args, {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      timeout: timeoutMs,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({ output: stdout, exitCode: code ?? 0 });
      } else {
        reject(new Error(`CLI exited with code ${code}: ${stderr || stdout}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`CLI spawn error: ${err.message}`));
    });
  });
}

/**
 * ジョブペイロードからCLIプロンプトを構築
 */
function buildPrompt(data: JobData): string {
  const { payload } = data;

  switch (payload.type) {
    case 'file_analysis': {
      const refs = payload.referenceFiles?.length
        ? `\n参照ファイル: ${payload.referenceFiles.join(', ')}`
        : '';
      return [
        `以下のファイルを解析してください。`,
        `ファイル: ${payload.filePath}`,
        `ファイル名: ${payload.fileName}`,
        `形式: ${payload.mimeType}`,
        refs,
        payload.analysisPrompt ? `\n指示: ${payload.analysisPrompt}` : '',
        `\n結果はJSON形式で出力してください。`,
      ].filter(Boolean).join('\n');
    }

    case 'content_generation':
      return [
        `以下のファイルを元にコンテンツを生成してください。`,
        `入力: ${payload.sourceFiles.join(', ')}`,
        `出力形式: ${payload.outputFormat}`,
        payload.template ? `テンプレート: ${payload.template}` : '',
        `\n指示: ${payload.instructions}`,
      ].filter(Boolean).join('\n');

    case 'diff_analysis':
      return [
        `以下の2ファイルの差分を解析してください。`,
        `比較元: ${payload.baseFilePath}`,
        `比較先: ${payload.targetFilePath}`,
        payload.focusAreas?.length
          ? `注目領域: ${payload.focusAreas.join(', ')}`
          : '',
        `\n変更点・影響範囲・推奨事項をJSON形式で出力してください。`,
      ].filter(Boolean).join('\n');

    case 'batch_process':
      return [
        `以下のファイル群にバッチ処理を実行してください。`,
        `対象: ${payload.filePaths.join(', ')}`,
        `操作: ${payload.operation}`,
        payload.params ? `パラメータ: ${JSON.stringify(payload.params)}` : '',
        `\n結果はJSON形式で出力してください。`,
      ].filter(Boolean).join('\n');
  }
}

/**
 * ジョブ完了時のWebhook通知
 */
async function notifyCallback(callbackUrl: string, result: JobResult): Promise<void> {
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (!response.ok) {
      console.error(`[Callback] Failed: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.error(`[Callback] Error:`, err);
  }
}

/**
 * ジョブ処理メイン
 */
async function processJob(job: Job<JobData>): Promise<JobResult> {
  const data = job.data;
  const startTime = Date.now();

  console.log(`[Worker] Processing job: ${data.id} (${data.payload.type})`);
  await job.updateProgress(10);

  const prompt = buildPrompt(data);
  const workDir = resolve(process.env.WORK_DIR ?? process.cwd());
  const timeoutMs = data.timeoutMs ?? 300_000;

  await job.updateProgress(20);

  const { output } = await executeClaudeCli(prompt, workDir, timeoutMs);

  await job.updateProgress(90);

  const result: JobResult = {
    jobId: data.id,
    status: 'completed',
    output,
    duration: Date.now() - startTime,
    completedAt: new Date().toISOString(),
  };

  // Webhook通知
  if (data.callbackUrl) {
    await notifyCallback(data.callbackUrl, result);
  }

  await job.updateProgress(100);
  console.log(`[Worker] Completed: ${data.id} (${result.duration}ms)`);

  return result;
}

/**
 * ワーカー起動
 */
export function startWorker(config: WorkerConfig = DEFAULT_WORKER_CONFIG): Worker {
  const worker = new Worker<JobData, JobResult>(
    QUEUE_NAME,
    async (job) => processJob(job),
    {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        maxRetriesPerRequest: null,
      },
      concurrency: config.concurrency,
      limiter: {
        max: 5,           // 最大5ジョブ
        duration: 60_000,  // 1分あたり
      },
    },
  );

  // イベントハンドラ
  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed in ${result.duration}ms`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    // 失敗時もWebhook通知
    if (job?.data.callbackUrl) {
      notifyCallback(job.data.callbackUrl, {
        jobId: job.data.id,
        status: 'failed',
        error: err.message,
        duration: Date.now() - (job.processedOn ?? job.timestamp),
        completedAt: new Date().toISOString(),
      });
    }
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled - will be retried`);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Error:`, err);
  });

  console.log(`[Worker] Started (concurrency: ${config.concurrency})`);
  console.log(`[Worker] Queue: ${QUEUE_NAME}`);
  console.log(`[Worker] Redis: ${config.redis.host}:${config.redis.port}`);

  return worker;
}

// --- メインエントリポイント ---
const worker = startWorker();

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n[Worker] ${signal} received, shutting down gracefully...`);
  await worker.close();
  console.log('[Worker] Stopped.');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
