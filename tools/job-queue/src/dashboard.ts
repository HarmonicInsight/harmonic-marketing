/**
 * シンプルなキューダッシュボードAPI
 *
 * ジョブの状態確認・キュー統計・ジョブ投入のHTTP API。
 * 本番では既存のExpressサーバーに統合することを推奨。
 *
 * 起動: npm run dashboard
 * デフォルト: http://localhost:3900
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { getJobStatus, getQueueStats, closeQueue } from './queue.js';
import { submitAnalysis } from './producer.js';

const PORT = parseInt(process.env.DASHBOARD_PORT ?? '3900', 10);

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const method = req.method ?? 'GET';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // GET /api/stats - キュー統計
    if (method === 'GET' && url.pathname === '/api/stats') {
      const stats = await getQueueStats();
      return json(res, { queue: 'harmonic:analysis', ...stats });
    }

    // GET /api/jobs/:id - ジョブ状態
    if (method === 'GET' && url.pathname.startsWith('/api/jobs/')) {
      const jobId = url.pathname.split('/').pop();
      if (!jobId) return json(res, { error: 'Job ID required' }, 400);
      const status = await getJobStatus(jobId);
      if (!status) return json(res, { error: 'Job not found' }, 404);
      return json(res, status);
    }

    // POST /api/jobs - ジョブ投入
    if (method === 'POST' && url.pathname === '/api/jobs') {
      const body = JSON.parse(await readBody(req));
      const { filePath, fileName, mimeType, prompt, priority, callbackUrl } = body;
      if (!filePath) return json(res, { error: 'filePath required' }, 400);

      const jobId = await submitAnalysis(
        filePath,
        fileName ?? filePath.split('/').pop(),
        mimeType ?? 'application/octet-stream',
        { analysisPrompt: prompt, priority, callbackUrl },
      );
      return json(res, { jobId, status: 'queued' }, 201);
    }

    // GET / - ヘルスチェック
    if (method === 'GET' && url.pathname === '/') {
      const stats = await getQueueStats();
      return json(res, {
        service: 'harmonic-job-queue',
        status: 'ok',
        queue: stats,
      });
    }

    json(res, { error: 'Not found' }, 404);
  } catch (err) {
    console.error('API error:', err);
    json(res, { error: String(err) }, 500);
  }
}

const server = createServer(handler);
server.listen(PORT, () => {
  console.log(`[Dashboard] http://localhost:${PORT}`);
  console.log(`[Dashboard] Endpoints:`);
  console.log(`  GET  /api/stats     - Queue statistics`);
  console.log(`  GET  /api/jobs/:id  - Job status`);
  console.log(`  POST /api/jobs      - Enqueue job`);
});

async function shutdown() {
  console.log('\n[Dashboard] Shutting down...');
  server.close();
  await closeQueue();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
