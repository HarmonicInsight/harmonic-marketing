// =============================================================================
// Social Poster — Web ダッシュボード API サーバー
// =============================================================================

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateContent } from './content-generator.js';
import { postToTwitter, testTwitterConnection } from './twitter-client.js';
import { postToNote, testNoteConnection } from './note-client.js';
import { recordPost, getHistory, getTodayPostCount } from './history.js';
import type { GenerateRequest, GeneratedContent, PostResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3847', 10);

// =============================================================================
// ジョブキュー（生成・投稿の非同期タスク管理）
// =============================================================================

interface Job {
  id: string;
  type: 'generate' | 'post' | 'test';
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  request?: GenerateRequest;
  result?: GeneratedContent;
  postResults?: PostResult[];
  error?: string;
}

const jobs = new Map<string, Job>();
let jobCounter = 0;

function createJob(type: Job['type'], request?: GenerateRequest): Job {
  const job: Job = {
    id: `job-${++jobCounter}-${Date.now()}`,
    type,
    status: 'queued',
    createdAt: new Date().toISOString(),
    request,
  };
  jobs.set(job.id, job);
  return job;
}

// =============================================================================
// API ルーティング
// =============================================================================

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function cors(res: ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method ?? 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    cors(res);
    return;
  }

  // ダッシュボード HTML
  if (path === '/' && method === 'GET') {
    const html = readFileSync(resolve(__dirname, 'dashboard.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // --- API エンドポイント ---

  // GET /api/status — 全体ステータス
  if (path === '/api/status' && method === 'GET') {
    const twitterToday = getTodayPostCount('twitter');
    const noteToday = getTodayPostCount('note');
    const recentJobs = [...jobs.values()].slice(-20).reverse();
    json(res, {
      server: { uptime: process.uptime(), startedAt: serverStartedAt },
      today: {
        twitter: { posted: twitterToday, limit: 10 },
        note: { posted: noteToday, limit: 5 },
      },
      jobs: recentJobs,
    });
    return;
  }

  // GET /api/history — 投稿履歴
  if (path === '/api/history' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') ?? '30', 10);
    json(res, { entries: getHistory(limit) });
    return;
  }

  // POST /api/test — 接続テスト
  if (path === '/api/test' && method === 'POST') {
    const job = createJob('test');
    job.status = 'running';
    job.startedAt = new Date().toISOString();

    // 非同期で実行
    (async () => {
      try {
        const [twitterOk, noteOk] = await Promise.allSettled([
          testTwitterConnection(),
          testNoteConnection(),
        ]);
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.result = {
          generatedAt: job.completedAt,
          prompt: 'connection-test',
          twitter: { text: twitterOk.status === 'fulfilled' && twitterOk.value ? 'connected' : 'failed' },
          note: {
            title: noteOk.status === 'fulfilled' && noteOk.value ? 'connected' : 'failed',
            body: '', category: 'tech', tags: [], publishStatus: 'draft',
          },
        };
      } catch (e) {
        job.status = 'failed';
        job.error = e instanceof Error ? e.message : String(e);
        job.completedAt = new Date().toISOString();
      }
    })();

    json(res, { jobId: job.id }, 202);
    return;
  }

  // POST /api/generate — コンテンツ生成
  if (path === '/api/generate' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as GenerateRequest;
    const job = createJob('generate', body);

    // 非同期で実行
    (async () => {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      try {
        const content = await generateContent(body);
        job.result = content;
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
      } catch (e) {
        job.status = 'failed';
        job.error = e instanceof Error ? e.message : String(e);
        job.completedAt = new Date().toISOString();
      }
    })();

    json(res, { jobId: job.id }, 202);
    return;
  }

  // GET /api/jobs/:id — ジョブ状態取得
  if (path.startsWith('/api/jobs/') && method === 'GET') {
    const jobId = path.slice('/api/jobs/'.length);
    const job = jobs.get(jobId);
    if (!job) {
      json(res, { error: 'Job not found' }, 404);
      return;
    }
    json(res, job);
    return;
  }

  // POST /api/post — 投稿実行（生成済みコンテンツを投稿）
  if (path === '/api/post' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      jobId: string;
      platforms: ('twitter' | 'note')[];
      notePublishStatus?: 'draft' | 'published';
      editedTwitterText?: string;
      editedNoteTitle?: string;
    };

    const sourceJob = jobs.get(body.jobId);
    if (!sourceJob?.result) {
      json(res, { error: 'Source job not found or has no result' }, 400);
      return;
    }

    const postJob = createJob('post');
    postJob.result = { ...sourceJob.result };

    // 編集内容を反映
    if (body.editedTwitterText && postJob.result.twitter) {
      postJob.result.twitter.text = body.editedTwitterText;
    }
    if (body.editedNoteTitle && postJob.result.note) {
      postJob.result.note.title = body.editedNoteTitle;
    }
    if (body.notePublishStatus && postJob.result.note) {
      postJob.result.note.publishStatus = body.notePublishStatus;
    }

    // 非同期で投稿
    (async () => {
      postJob.status = 'running';
      postJob.startedAt = new Date().toISOString();
      const results: PostResult[] = [];

      try {
        for (const platform of body.platforms) {
          if (platform === 'twitter' && postJob.result!.twitter) {
            const r = await postToTwitter(postJob.result!.twitter);
            results.push(r);
          }
          if (platform === 'note' && postJob.result!.note) {
            const r = await postToNote(postJob.result!.note);
            results.push(r);
          }
        }

        postJob.postResults = results;
        postJob.status = 'completed';
        postJob.completedAt = new Date().toISOString();

        // 履歴に記録
        const platform = body.platforms.length > 1 ? 'all' as const : body.platforms[0];
        recordPost(platform, sourceJob.request?.contentType ?? 'tips', postJob.result!, results);
      } catch (e) {
        postJob.status = 'failed';
        postJob.error = e instanceof Error ? e.message : String(e);
        postJob.completedAt = new Date().toISOString();
      }
    })();

    json(res, { jobId: postJob.id }, 202);
    return;
  }

  // 404
  json(res, { error: 'Not found' }, 404);
}

// =============================================================================
// サーバー起動
// =============================================================================

const serverStartedAt = new Date().toISOString();

const server = createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('Request error:', err);
    json(res, { error: 'Internal server error' }, 500);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Social Poster Dashboard');
  console.log(`  http://localhost:${PORT}`);
  console.log('');
  console.log('  Ctrl+C で終了');
  console.log('');
});
