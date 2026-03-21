// =============================================================================
// Social Poster — Web ダッシュボード API サーバー
// =============================================================================

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateContent } from './content-generator.js';
import { autoGenerate, saveGeneratedContent } from './auto-generate.js';
import { postToTwitter, testTwitterConnection } from './twitter-client.js';
import { postToNote, testNoteConnection } from './note-client.js';
import { recordPost, getHistory, getTodayPostCount } from './history.js';
import type { GenerateRequest, GeneratedContent, PostResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3847', 10);
const CONTENT_ROOT = resolve(__dirname, '..', '..', '..', 'content');
const IDEAS_DIR = join(CONTENT_ROOT, 'ideas');
const SCHEDULE_FILE = join(CONTENT_ROOT, 'schedule.json');
const COMMENTS_FILE = join(CONTENT_ROOT, 'pipeline-comments.json');
const YOUTUBE_DIR = join(CONTENT_ROOT, 'youtube');
const SLIDES_DIR = join(YOUTUBE_DIR, 'slides');
const CATALOG_FILE = join(YOUTUBE_DIR, 'catalog.json');

// =============================================================================
// コンテンツ管理ヘルパー
// =============================================================================

interface ContentFile {
  path: string;       // content/ からの相対パス
  name: string;       // ファイル名
  category: string;   // 親ディレクトリ名
  size: number;
  modifiedAt: string;
  title?: string;     // Markdownの最初の # から抽出
}

interface Idea {
  id: string;
  title: string;
  category: string;   // note | twitter | youtube | blog | other
  status: string;     // draft | ready | published | archived
  priority: string;   // high | medium | low
  tags: string[];
  body: string;       // 背景メモ・検討内容（長文OK）
  outline?: string;   // AI生成のアウトライン（JSON文字列）
  deliverables?: { type: string; ref: string; title: string }[]; // 派生コンテンツ
  createdAt: string;
  updatedAt: string;
}

function scanContentFiles(dir: string, base: string = ''): ContentFile[] {
  const results: ContentFile[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // ideas/ は別管理なのでスキップ
      if (entry === 'ideas') continue;
      results.push(...scanContentFiles(full, rel));
    } else if (extname(entry) === '.md' || extname(entry) === '.json') {
      let title: string | undefined;
      if (extname(entry) === '.md') {
        try {
          const text = readFileSync(full, 'utf-8');
          const m = text.match(/^#\s+(.+)/m);
          if (m) title = m[1].trim();
        } catch { /* ignore */ }
      }
      results.push({
        path: rel,
        name: entry,
        category: base.split('/')[0] || 'root',
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        title,
      });
    }
  }
  return results;
}

function readContentFile(relPath: string): string | null {
  const full = join(CONTENT_ROOT, relPath);
  // パストラバーサル防止
  if (!full.startsWith(CONTENT_ROOT)) return null;
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

function writeContentFile(relPath: string, content: string): boolean {
  const full = join(CONTENT_ROOT, relPath);
  if (!full.startsWith(CONTENT_ROOT)) return false;
  const dir = dirname(full);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(full, content, 'utf-8');
  return true;
}

// --- アイデア管理 ---

function loadIdeas(): Idea[] {
  if (!existsSync(IDEAS_DIR)) mkdirSync(IDEAS_DIR, { recursive: true });
  const indexFile = join(IDEAS_DIR, '_index.json');
  if (!existsSync(indexFile)) return [];
  try {
    return JSON.parse(readFileSync(indexFile, 'utf-8'));
  } catch { return []; }
}

function saveIdeas(ideas: Idea[]): void {
  if (!existsSync(IDEAS_DIR)) mkdirSync(IDEAS_DIR, { recursive: true });
  writeFileSync(join(IDEAS_DIR, '_index.json'), JSON.stringify(ideas, null, 2), 'utf-8');
}

// --- スケジュール管理 ---

interface ScheduleItem {
  id: string;
  date: string;         // YYYY-MM-DD
  time?: string;        // HH:MM
  platform: 'twitter' | 'note' | 'youtube' | 'all';
  type: 'post' | 'article' | 'video' | 'short';
  title: string;
  status: 'planned' | 'ready' | 'posted' | 'skipped';
  sourceRef?: string;   // content path or video ID
  memo?: string;
  createdAt: string;
}

function loadSchedule(): ScheduleItem[] {
  if (!existsSync(SCHEDULE_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SCHEDULE_FILE, 'utf-8'));
  } catch { return []; }
}

function saveSchedule(items: ScheduleItem[]): void {
  writeFileSync(SCHEDULE_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

// --- 動画カタログ & スライド管理 ---

function loadCatalog(): any {
  if (!existsSync(CATALOG_FILE)) return { videos: [], series: [] };
  try {
    return JSON.parse(readFileSync(CATALOG_FILE, 'utf-8'));
  } catch { return { videos: [], series: [] }; }
}

function saveCatalog(catalog: any): void {
  catalog._meta.last_updated = new Date().toISOString().slice(0, 10);
  const mains = catalog.videos.filter((v: any) => v.type === 'main');
  const shorts = catalog.videos.filter((v: any) => v.type === 'short');
  catalog._meta.total_videos = mains.length;
  catalog._meta.total_shorts = shorts.length;
  writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
}

function listSlideFiles(): { name: string; size: number; modifiedAt: string }[] {
  if (!existsSync(SLIDES_DIR)) mkdirSync(SLIDES_DIR, { recursive: true });
  return readdirSync(SLIDES_DIR)
    .filter(f => /\.(pptx|ppt|pdf|key)$/i.test(f))
    .map(f => {
      const st = statSync(join(SLIDES_DIR, f));
      return { name: f, size: st.size, modifiedAt: st.mtime.toISOString() };
    });
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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

  // POST /api/plan-topic — アイデアからトピック企画・アウトライン生成
  if (path === '/api/plan-topic' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      ideaId?: string;
      title: string;
      category: string;
      body?: string;
      outputType: 'article' | 'video' | 'both';
    };

    const job = createJob('generate');
    (async () => {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      try {
        const client = (await import('./content-generator.js')).getGeneratorClient();
        const prompt = `
あなたは HARMONIC insight のコンテンツプランナーです。
以下のアイデアを元に、具体的なコンテンツ企画・アウトラインを作成してください。

## アイデア
タイトル: ${body.title}
カテゴリ: ${body.category}
${body.body ? `詳細:\n${body.body}` : ''}

## 出力形式
JSON で出力してください:
{
  "refined_title": "洗練されたタイトル案",
  "target_audience": "想定読者/視聴者",
  "key_message": "核となるメッセージ（1文）",
  "outline": [
    { "section": "セクション名", "points": ["ポイント1", "ポイント2"], "duration_hint": "想定時間/文字数" }
  ],
  "tags": ["タグ1", "タグ2", "タグ3"],
  "article_plan": ${body.outputType !== 'video' ? '"note.com記事の構成案（200字程度）"' : 'null'},
  "video_plan": ${body.outputType !== 'article' ? '{ "estimated_duration": "想定尺", "slide_count": "想定スライド数", "style": "解説/対談/ナレーション等" }' : 'null'},
  "twitter_hooks": ["投稿案1（140字以内）", "投稿案2（140字以内）"]
}`.trim();

        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON抽出失敗');
        const plan = JSON.parse(jsonMatch[0]);

        job.result = { generatedAt: new Date().toISOString(), prompt: 'plan-topic', twitter: { text: JSON.stringify(plan) } } as any;
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

  // POST /api/ideas/:id/create-series — アイデアからシリーズ一括作成
  if (path.match(/^\/api\/ideas\/[^/]+\/create-series$/) && method === 'POST') {
    const id = path.split('/')[3];
    const body = JSON.parse(await readBody(req)) as {
      videos: { title: string; type: 'main' | 'short'; series?: string; tags?: string[]; memo?: string }[];
    };
    const ideas = loadIdeas();
    const idea = ideas.find(i => i.id === id);
    if (!idea) { json(res, { error: 'Idea not found' }, 404); return; }

    const catalog = loadCatalog();
    const created: any[] = [];

    for (const v of body.videos) {
      const existingIds = catalog.videos.map((x: any) => x.id).filter((x: string) => x.startsWith('VID-'));
      const maxNum = existingIds.reduce((max: number, x: string) => {
        const n = parseInt(x.replace('VID-', ''), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newId = v.type === 'short' ? `VID-S${String(maxNum + 1).padStart(3, '0')}` : `VID-${String(maxNum + 1).padStart(3, '0')}`;

      const video = {
        id: newId, type: v.type, parent_id: null,
        title: v.title, series: v.series || null, product: null,
        status: 'idea', duration: null, script: null, slide: null,
        thumbnail: null, youtube_url: null, publish_date: null,
        note_status: '未', note_url: null,
        tags: v.tags || idea.tags || [],
        performance: { views: null, ctr: null, avg_watch_time: null, likes: null },
        memo: v.memo || `企画: ${idea.title}`, shorts: [],
      };
      catalog.videos.push(video);
      created.push(video);
    }
    saveCatalog(catalog);

    // Update idea with deliverables
    const idx = ideas.findIndex(i => i.id === id);
    if (!ideas[idx].deliverables) ideas[idx].deliverables = [];
    for (const c of created) {
      ideas[idx].deliverables!.push({ type: c.type === 'short' ? 'short' : 'video', ref: c.id, title: c.title });
    }
    ideas[idx].status = 'ready';
    ideas[idx].updatedAt = new Date().toISOString();
    saveIdeas(ideas);

    json(res, { created, ideaId: id }, 201);
    return;
  }

  // POST /api/generate-from-content — 既存コンテンツ/動画から投稿を生成
  if (path === '/api/generate-from-content' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      sourceType: 'article' | 'video';
      sourcePath?: string;     // article: content/ からの相対パス
      videoId?: string;        // video: catalog のID
      platform: 'twitter' | 'note' | 'all';
      tone?: string;
      contentType?: string;
    };

    // ソースコンテンツを取得
    let sourceText = '';
    let sourceMeta = '';
    if (body.sourceType === 'article' && body.sourcePath) {
      const content = readContentFile(body.sourcePath);
      if (!content) { json(res, { error: 'Source file not found' }, 404); return; }
      sourceText = content;
      sourceMeta = `ソース記事: ${body.sourcePath}`;
    } else if (body.sourceType === 'video' && body.videoId) {
      const catalog = loadCatalog();
      const video = catalog.videos.find((v: any) => v.id === body.videoId);
      if (!video) { json(res, { error: 'Video not found' }, 404); return; }
      sourceMeta = `動画ID: ${video.id} / タイトル: ${video.title}`;
      // 台本があれば読み込む
      if (video.script) {
        const scriptContent = readContentFile(`youtube/${video.script}`);
        if (scriptContent) sourceText = scriptContent;
      }
      // 動画メタデータをコンテキストに
      sourceText += `\n\n--- 動画情報 ---\nタイトル: ${video.title}\nシリーズ: ${video.series || '未分類'}\nタグ: ${(video.tags || []).join(', ')}\nメモ: ${video.memo || ''}\n製品: ${video.product || '未指定'}`;
    }

    if (!sourceText && !sourceMeta) {
      json(res, { error: 'No source content provided' }, 400);
      return;
    }

    // GenerateRequestに変換
    const genReq: GenerateRequest = {
      platform: body.platform as any,
      contentType: (body.contentType || 'tips') as any,
      tone: (body.tone || 'professional') as any,
      context: `以下の既存コンテンツを元に、投稿用のコンテンツを作成してください。\n${sourceMeta}\n\n--- 元コンテンツ ---\n${sourceText.slice(0, 4000)}`,
    };

    const job = createJob('generate', genReq);
    (async () => {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      try {
        const content = await generateContent(genReq);
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

  // POST /api/post — 投稿実行（生成済み or 既存コンテンツを投稿）
  if (path === '/api/post' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      jobId?: string | null;
      platforms: ('twitter' | 'note')[];
      notePublishStatus?: 'draft' | 'published';
      editedTwitterText?: string;
      editedNoteTitle?: string;
      noteContent?: { title: string; body: string; category: string; tags: string[]; publishStatus: string };
    };

    // 既存コンテンツからの直接投稿
    if (body.noteContent && !body.jobId) {
      const postJob = createJob('post');
      postJob.result = {
        generatedAt: new Date().toISOString(),
        prompt: 'direct-post',
        note: {
          title: body.noteContent.title,
          body: body.noteContent.body,
          category: (body.noteContent.category || 'tech') as any,
          tags: body.noteContent.tags || [],
          publishStatus: (body.noteContent.publishStatus || 'draft') as any,
        },
      };

      (async () => {
        postJob.status = 'running';
        postJob.startedAt = new Date().toISOString();
        try {
          const r = await postToNote(postJob.result!.note!);
          postJob.postResults = [r];
          postJob.status = 'completed';
          postJob.completedAt = new Date().toISOString();
          recordPost('note', 'tips', postJob.result!, [r]);
        } catch (e) {
          postJob.status = 'failed';
          postJob.error = e instanceof Error ? e.message : String(e);
          postJob.completedAt = new Date().toISOString();
        }
      })();

      json(res, { jobId: postJob.id }, 202);
      return;
    }

    const sourceJob = body.jobId ? jobs.get(body.jobId) : null;
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

  // =========================================================================
  // コンテンツ管理 API
  // =========================================================================

  // GET /api/content — コンテンツ一覧
  if (path === '/api/content' && method === 'GET') {
    const files = scanContentFiles(CONTENT_ROOT);
    json(res, { files, root: CONTENT_ROOT });
    return;
  }

  // GET /api/content/read?path=xxx — ファイル読み込み
  if (path === '/api/content/read' && method === 'GET') {
    const filePath = url.searchParams.get('path');
    if (!filePath) { json(res, { error: 'path required' }, 400); return; }
    const content = readContentFile(filePath);
    if (content === null) { json(res, { error: 'File not found' }, 404); return; }
    json(res, { path: filePath, content });
    return;
  }

  // PUT /api/content/write — ファイル保存
  if (path === '/api/content/write' && method === 'PUT') {
    const body = JSON.parse(await readBody(req)) as { path: string; content: string };
    if (!body.path || body.content === undefined) { json(res, { error: 'path and content required' }, 400); return; }
    const ok = writeContentFile(body.path, body.content);
    if (!ok) { json(res, { error: 'Write failed' }, 500); return; }
    json(res, { success: true, path: body.path });
    return;
  }

  // =========================================================================
  // アイデア管理 API
  // =========================================================================

  // GET /api/ideas — アイデア一覧
  if (path === '/api/ideas' && method === 'GET') {
    const ideas = loadIdeas();
    const statusFilter = url.searchParams.get('status');
    const categoryFilter = url.searchParams.get('category');
    let filtered = ideas;
    if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
    if (categoryFilter) filtered = filtered.filter(i => i.category === categoryFilter);
    json(res, { ideas: filtered });
    return;
  }

  // POST /api/ideas — アイデア追加
  if (path === '/api/ideas' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as Partial<Idea>;
    const ideas = loadIdeas();
    const now = new Date().toISOString();
    const idea: Idea = {
      id: randomUUID().slice(0, 8),
      title: body.title ?? '',
      category: body.category ?? 'other',
      status: body.status ?? 'draft',
      priority: body.priority ?? 'medium',
      tags: body.tags ?? [],
      body: body.body ?? '',
      createdAt: now,
      updatedAt: now,
    };
    ideas.unshift(idea);
    saveIdeas(ideas);
    json(res, { idea }, 201);
    return;
  }

  // PUT /api/ideas/:id — アイデア更新
  if (path.startsWith('/api/ideas/') && method === 'PUT') {
    const id = path.slice('/api/ideas/'.length);
    const body = JSON.parse(await readBody(req)) as Partial<Idea>;
    const ideas = loadIdeas();
    const idx = ideas.findIndex(i => i.id === id);
    if (idx === -1) { json(res, { error: 'Idea not found' }, 404); return; }
    const updated = { ...ideas[idx], ...body, id, updatedAt: new Date().toISOString() };
    ideas[idx] = updated;
    saveIdeas(ideas);
    json(res, { idea: updated });
    return;
  }

  // DELETE /api/ideas/:id — アイデア削除
  if (path.startsWith('/api/ideas/') && method === 'DELETE') {
    const id = path.slice('/api/ideas/'.length);
    const ideas = loadIdeas();
    const filtered = ideas.filter(i => i.id !== id);
    if (filtered.length === ideas.length) { json(res, { error: 'Idea not found' }, 404); return; }
    saveIdeas(filtered);
    json(res, { success: true });
    return;
  }

  // =========================================================================
  // =========================================================================
  // スケジュール管理 API
  // =========================================================================

  // GET /api/schedule — スケジュール一覧
  if (path === '/api/schedule' && method === 'GET') {
    const items = loadSchedule();
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    let filtered = items;
    if (from) filtered = filtered.filter(i => i.date >= from);
    if (to) filtered = filtered.filter(i => i.date <= to);
    filtered.sort((a, b) => a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date.localeCompare(b.date));
    json(res, { items: filtered });
    return;
  }

  // POST /api/schedule — スケジュール追加
  if (path === '/api/schedule' && method === 'POST') {
    const body = JSON.parse(await readBody(req)) as Partial<ScheduleItem>;
    const items = loadSchedule();
    const item: ScheduleItem = {
      id: randomUUID().slice(0, 8),
      date: body.date ?? new Date().toISOString().slice(0, 10),
      time: body.time,
      platform: body.platform ?? 'twitter',
      type: body.type ?? 'post',
      title: body.title ?? '',
      status: body.status ?? 'planned',
      sourceRef: body.sourceRef,
      memo: body.memo,
      createdAt: new Date().toISOString(),
    };
    items.push(item);
    saveSchedule(items);
    json(res, { item }, 201);
    return;
  }

  // PUT /api/schedule/:id — スケジュール更新
  if (path.startsWith('/api/schedule/') && method === 'PUT') {
    const id = path.slice('/api/schedule/'.length);
    const body = JSON.parse(await readBody(req)) as Partial<ScheduleItem>;
    const items = loadSchedule();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) { json(res, { error: 'Not found' }, 404); return; }
    items[idx] = { ...items[idx], ...body, id };
    saveSchedule(items);
    json(res, { item: items[idx] });
    return;
  }

  // DELETE /api/schedule/:id — スケジュール削除
  if (path.startsWith('/api/schedule/') && method === 'DELETE') {
    const id = path.slice('/api/schedule/'.length);
    const items = loadSchedule();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) { json(res, { error: 'Not found' }, 404); return; }
    saveSchedule(filtered);
    json(res, { success: true });
    return;
  }

  // =========================================================================
  // 動画カタログ & スライド管理 API
  // =========================================================================

  // GET /api/pipeline — 統合パイプライン
  if (path === '/api/pipeline' && method === 'GET') {
    const ideas = loadIdeas();
    const catalog = loadCatalog();
    const schedule = loadSchedule();
    const slideFiles = listSlideFiles();
    const slideNames = new Set(slideFiles.map(s => s.name));

    // ファイル存在チェックでステージ自動判定
    const items = catalog.videos.filter((v: any) => v.type === 'main').map((v: any) => {
      const shorts = (v.shorts || []).map((sid: string) => catalog.videos.find((vv: any) => vv.id === sid)).filter(Boolean);

      // ファイル存在チェック
      const slideFile = v.slide ? v.slide.replace('slides/', '') : null;
      const hasSlide = slideFile ? slideNames.has(slideFile) : false;
      const hasScript = v.script ? existsSync(join(YOUTUBE_DIR, v.script)) : false;
      const isPublished = v.status === 'published';
      const hasNote = !!v.note_url;
      const hasTwitter = (v.twitter_posts || []).length > 0;
      const shortsPublished = shorts.filter((s: any) => s.status === 'published').length;

      // ステージ自動判定
      let stage = 'idea';
      if (hasSlide || hasScript || ['slide_done','script_done'].includes(v.status)) stage = 'pptx';
      if (isPublished) stage = 'youtube';
      if (isPublished && hasNote) stage = 'note';
      if (isPublished && (hasTwitter || shortsPublished > 0)) stage = 'spread';

      // 次のアクション
      let nextAction = '';
      if (stage === 'idea') nextAction = 'Claude Codeで台本/PPTX作成';
      else if (stage === 'pptx') nextAction = 'YouTube動画を収録・公開';
      else if (stage === 'youtube') nextAction = 'note.com記事を執筆・公開';
      else if (stage === 'note') nextAction = 'ショート/Twitter で拡散';

      // スケジュール
      const scheduled = schedule.filter(s => s.sourceRef === v.id);

      return {
        id: v.id, title: v.title, series: v.series, stage, nextAction,
        slide: v.slide, status: v.status, duration: v.duration,
        youtube_url: v.youtube_url,
        views: v.performance?.views, likes: v.performance?.likes,
        publish_date: v.publish_date,
        shorts: shorts.map((s: any) => ({ id: s.id, title: s.title, status: s.status, views: s.performance?.views })),
        has_note: hasNote, note_url: v.note_url,
        has_twitter: hasTwitter, has_slide: hasSlide, has_script: hasScript,
        tags: v.tags || [], memo: v.memo,
        thumbnail: v.thumbnail, thumbnail_prompt: v.thumbnail_prompt,
        note_article: v.note_article, script: v.script,
        sort_order: v.sort_order ?? 999,
        scheduled: scheduled.length > 0 ? scheduled[0] : null,
      };
    });

    const stages = {
      idea: items.filter((i: any) => i.stage === 'idea').length,
      pptx: items.filter((i: any) => i.stage === 'pptx').length,
      youtube: items.filter((i: any) => i.stage === 'youtube').length,
      note: items.filter((i: any) => i.stage === 'note').length,
      spread: items.filter((i: any) => i.stage === 'spread').length,
    };

    json(res, { items, stages, ideas: ideas.slice(0, 50), series: catalog.series, total_slides: slideFiles.length });
    return;
  }

  // GET /api/videos — 動画カタログ一覧
  if (path === '/api/videos' && method === 'GET') {
    const catalog = loadCatalog();
    const slides = listSlideFiles();
    json(res, { videos: catalog.videos, series: catalog.series, slides });
    return;
  }

  // GET /api/comments — 戦略コメント取得
  if (path === '/api/comments' && method === 'GET') {
    if (!existsSync(COMMENTS_FILE)) { json(res, { strategy: '', projects: {}, updatedAt: null }); return; }
    try {
      json(res, JSON.parse(readFileSync(COMMENTS_FILE, 'utf-8')));
    } catch { json(res, { strategy: '', projects: {}, updatedAt: null }); }
    return;
  }

  // PUT /api/comments — 戦略コメント保存
  if (path === '/api/comments' && method === 'PUT') {
    const body = JSON.parse(await readBody(req));
    body.updatedAt = new Date().toISOString();
    writeFileSync(COMMENTS_FILE, JSON.stringify(body, null, 2), 'utf-8');
    json(res, { success: true });
    return;
  }

  // PUT /api/videos/reorder — 並べ替え（:idより先にマッチさせる）
  if (path === '/api/videos/reorder' && method === 'PUT') {
    const body = JSON.parse(await readBody(req)) as { ids: string[] };
    const catalog = loadCatalog();
    body.ids.forEach((id, idx) => {
      const v = catalog.videos.find((v: any) => v.id === id);
      if (v) v.sort_order = idx;
    });
    saveCatalog(catalog);
    json(res, { success: true });
    return;
  }

  // PUT /api/videos/:id — 動画情報更新
  if (path.startsWith('/api/videos/') && method === 'PUT') {
    const id = path.slice('/api/videos/'.length);
    const body = JSON.parse(await readBody(req));
    const catalog = loadCatalog();
    const idx = catalog.videos.findIndex((v: any) => v.id === id);
    if (idx === -1) { json(res, { error: 'Video not found' }, 404); return; }
    const allowed = ['title', 'series', 'product', 'status', 'duration', 'slide', 'thumbnail', 'thumbnail_prompt', 'youtube_url', 'publish_date', 'note_status', 'note_url', 'tags', 'memo', 'note_article', 'twitter_posts', 'related_content', 'script', 'performance', 'sort_order'];
    for (const key of allowed) {
      if (body[key] !== undefined) catalog.videos[idx][key] = body[key];
    }
    saveCatalog(catalog);
    json(res, { video: catalog.videos[idx] });
    return;
  }

  // POST /api/videos — 動画追加
  if (path === '/api/videos' && method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const catalog = loadCatalog();
    // 次のID自動採番
    const existingIds = catalog.videos.map((v: any) => v.id).filter((id: string) => id.startsWith('VID-'));
    const maxNum = existingIds.reduce((max: number, id: string) => {
      const n = parseInt(id.replace('VID-', ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `VID-${String(maxNum + 1).padStart(3, '0')}`;
    const video = {
      id: newId,
      type: body.type || 'main',
      parent_id: body.parent_id || null,
      title: body.title || '',
      series: body.series || null,
      product: body.product || null,
      status: body.status || 'idea',
      duration: body.duration || null,
      script: body.script || null,
      slide: body.slide || null,
      thumbnail: null,
      youtube_url: null,
      publish_date: null,
      note_status: '未',
      note_url: null,
      tags: body.tags || [],
      performance: { views: null, ctr: null, avg_watch_time: null, likes: null },
      memo: body.memo || null,
      shorts: [],
    };
    catalog.videos.push(video);
    saveCatalog(catalog);
    json(res, { video }, 201);
    return;
  }

  // GET /api/slides — スライドファイル一覧
  if (path === '/api/slides' && method === 'GET') {
    json(res, { slides: listSlideFiles() });
    return;
  }

  // POST /api/slides/upload — スライドアップロード
  if (path === '/api/slides/upload' && method === 'POST') {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // multipart解析（簡易版）
      const raw = await readRawBody(req);
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) { json(res, { error: 'No boundary' }, 400); return; }
      const boundary = boundaryMatch[1].trim();
      const parts = parseMultipart(raw, boundary);

      const filePart = parts.find(p => p.filename);
      if (!filePart || !filePart.filename) {
        json(res, { error: 'No file in upload' }, 400);
        return;
      }

      // ファイル名をサニタイズ
      const safeName = filePart.filename.replace(/[^a-zA-Z0-9._\-\u3000-\u9FFF\uF900-\uFAFF]/g, '_');
      const dest = join(SLIDES_DIR, safeName);
      if (!dest.startsWith(SLIDES_DIR)) { json(res, { error: 'Invalid path' }, 400); return; }
      if (!existsSync(SLIDES_DIR)) mkdirSync(SLIDES_DIR, { recursive: true });
      writeFileSync(dest, filePart.data);

      // 自動生成: PPTX → 台本 + 記事 + Twitter文 + サムネプロンプト + カタログ登録
      let autoResult: any = null;
      try {
        if (/\.pptx$/i.test(safeName)) {
          const catalog = loadCatalog();
          // 新しいVID番号を採番
          const existingNums = catalog.videos.map((v: any) => v.id).filter((id: string) => /^VID-\d+$/.test(id)).map((id: string) => parseInt(id.replace('VID-', ''), 10));
          const maxNum = existingNums.length ? Math.max(...existingNums) : 0;
          const newId = `VID-${String(maxNum + 1).padStart(3, '0')}`;
          const titleFromFile = safeName.replace(/^VID-\d+_/, '').replace(/\.pptx$/i, '').replace(/_/g, ' ');

          // カタログに動画エントリ追加
          catalog.videos.push({
            id: newId, type: 'main', title: titleFromFile, series: null, product: null,
            status: 'slide_done', duration: null, script: null, slide: `slides/${safeName}`,
            thumbnail: null, thumbnail_prompt: null, youtube_url: null, publish_date: null,
            note_status: '未', note_url: null, note_article: null, twitter_posts: [],
            tags: [], performance: { views: null, ctr: null, avg_watch_time: null, likes: null },
            memo: null, shorts: [],
          });
          saveCatalog(catalog);

          // 自動生成実行
          const result = autoGenerate(newId, titleFromFile, dest, []);
          saveGeneratedContent(result, CATALOG_FILE);
          autoResult = { videoId: newId, slideCount: result.slideCount };
          console.log(`Auto-generated content for ${newId}: ${result.slideCount} slides`);
        }
      } catch (e) {
        console.error('Auto-generate error:', e);
      }

      json(res, { success: true, filename: safeName, size: filePart.data.length, auto: autoResult }, 201);
      return;
    }

    json(res, { error: 'Content-Type must be multipart/form-data' }, 400);
    return;
  }

  // POST /api/slides/open/:filename — スライドをOSで開く
  if (path.startsWith('/api/slides/open/') && method === 'POST') {
    const filename = decodeURIComponent(path.slice('/api/slides/open/'.length));
    const filePath = join(SLIDES_DIR, filename);
    if (!filePath.startsWith(SLIDES_DIR) || !existsSync(filePath)) {
      json(res, { error: 'File not found' }, 404);
      return;
    }
    const { exec } = await import('node:child_process');
    // Windows: start, macOS: open, Linux: xdg-open
    const cmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${cmd} "${filePath.replace(/\//g, '\\')}"`, (err) => {
      if (err) console.error('Open slide error:', err);
    });
    json(res, { success: true, path: filePath });
    return;
  }

  // GET /api/slides/download/:filename — スライドダウンロード
  if (path.startsWith('/api/slides/download/') && method === 'GET') {
    const filename = decodeURIComponent(path.slice('/api/slides/download/'.length));
    const filePath = join(SLIDES_DIR, filename);
    if (!filePath.startsWith(SLIDES_DIR) || !existsSync(filePath)) {
      json(res, { error: 'File not found' }, 404);
      return;
    }
    const data = readFileSync(filePath);
    const ext = extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pdf': 'application/pdf',
      '.key': 'application/x-iwork-keynote-sffkey',
    };
    res.writeHead(200, {
      'Content-Type': mimeMap[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  // 404
  json(res, { error: 'Not found' }, 404);
}

// =============================================================================
// Multipart パーサー（簡易版）
// =============================================================================

interface MultipartPart {
  headers: Record<string, string>;
  name?: string;
  filename?: string;
  data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const sep = Buffer.from(`--${boundary}`);
  const end = Buffer.from(`--${boundary}--`);

  let pos = 0;
  // 最初の boundary まで読み飛ばす
  const firstIdx = body.indexOf(sep, pos);
  if (firstIdx === -1) return parts;
  pos = firstIdx + sep.length;
  // CRLFスキップ
  if (body[pos] === 0x0D && body[pos + 1] === 0x0A) pos += 2;

  while (pos < body.length) {
    // 次の boundary を探す
    const nextIdx = body.indexOf(sep, pos);
    if (nextIdx === -1) break;

    const partData = body.subarray(pos, nextIdx);

    // ヘッダとボディを分割 (CRLFCRLF)
    const headerEnd = partData.indexOf('\r\n\r\n');
    if (headerEnd === -1) { pos = nextIdx + sep.length + 2; continue; }

    const headerStr = partData.subarray(0, headerEnd).toString('utf-8');
    const dataStart = headerEnd + 4;
    let dataEnd = partData.length;
    // 末尾のCRLFを除去
    if (partData[dataEnd - 2] === 0x0D && partData[dataEnd - 1] === 0x0A) dataEnd -= 2;
    const fileData = partData.subarray(dataStart, dataEnd);

    const headers: Record<string, string> = {};
    for (const line of headerStr.split('\r\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        headers[line.slice(0, colonIdx).trim().toLowerCase()] = line.slice(colonIdx + 1).trim();
      }
    }

    const disp = headers['content-disposition'] || '';
    const nameMatch = disp.match(/name="([^"]+)"/);
    const filenameMatch = disp.match(/filename="([^"]+)"/);

    parts.push({
      headers,
      name: nameMatch?.[1],
      filename: filenameMatch?.[1],
      data: fileData,
    });

    pos = nextIdx + sep.length;
    // 終了チェック
    if (body.subarray(nextIdx, nextIdx + end.length).equals(end)) break;
    if (body[pos] === 0x0D && body[pos + 1] === 0x0A) pos += 2;
  }

  return parts;
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
