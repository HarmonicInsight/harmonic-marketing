import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// --- 環境判定 ---
const isVercel = !!process.env.VERCEL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "HarmonicInsight/harmonic-marketing";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const CATALOG_FILE_PATH = "content/youtube/catalog.json";

// ローカル用パス
const LOCAL_CATALOG_PATH = join(process.cwd(), "..", "..", "..", "content", "youtube", "catalog.json");

// --- 型定義 ---

export interface Video {
  id: string;
  type: "main" | "short";
  parent_id?: string | null;
  title: string;
  series: string | null;
  product: string | null;
  status: string;
  duration: string | null;
  script: string | null;
  slide: string | null;
  thumbnail: string | null;
  youtube_url: string | null;
  publish_date: string | null;
  note_status: string;
  note_url: string | null;
  tags: string[];
  performance: {
    views: number | null;
    ctr: number | null;
    avg_watch_time: string | null;
    likes: number | null;
  };
  memo: string | null;
  shorts: string[];
}

export interface Series {
  id: string;
  name: string;
  description: string;
}

export interface Catalog {
  _meta: {
    description: string;
    last_updated: string;
    total_videos: number;
    total_shorts: number;
    channel_url: string;
  };
  series: Series[];
  tags_master: {
    common: string[];
    by_series: Record<string, string[]>;
  };
  videos: Video[];
}

// --- GitHub API ---

interface GitHubFileResponse {
  content: string;
  sha: string;
}

let cachedSha: string | null = null;

async function githubReadFile(): Promise<{ content: string; sha: string }> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${CATALOG_FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const data: GitHubFileResponse = await res.json();
  cachedSha = data.sha;
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: decoded, sha: data.sha };
}

async function githubWriteFile(content: string, message: string): Promise<void> {
  // 書き込み前に最新のSHAを取得（競合防止）
  if (!cachedSha) {
    await githubReadFile();
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${CATALOG_FILE_PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      sha: cachedSha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // SHA競合の場合リトライ
    if (res.status === 409) {
      cachedSha = null;
      const { sha } = await githubReadFile();
      const retryRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
          branch: GITHUB_BRANCH,
        }),
      });
      if (!retryRes.ok) {
        throw new Error(`GitHub API write retry failed: ${retryRes.status}`);
      }
    } else {
      throw new Error(`GitHub API write error: ${res.status} ${err}`);
    }
  }

  // 書き込み後にSHAを更新
  cachedSha = null;
}

// --- 読み書きの統一インターフェース ---

export async function readCatalog(): Promise<Catalog> {
  if (isVercel) {
    const { content } = await githubReadFile();
    return JSON.parse(content);
  } else {
    const raw = readFileSync(LOCAL_CATALOG_PATH, "utf-8");
    return JSON.parse(raw);
  }
}

export async function writeCatalog(catalog: Catalog, action?: string): Promise<void> {
  catalog._meta.last_updated = new Date().toISOString().split("T")[0];
  catalog._meta.total_videos = catalog.videos.filter((v) => v.type === "main").length;
  catalog._meta.total_shorts = catalog.videos.filter((v) => v.type === "short").length;

  const json = JSON.stringify(catalog, null, 2) + "\n";

  if (isVercel) {
    const message = `[video-manager] ${action || "update catalog"}`;
    await githubWriteFile(json, message);
  } else {
    writeFileSync(LOCAL_CATALOG_PATH, json, "utf-8");
  }
}

// --- ユーティリティ ---

export function nextMainId(catalog: Catalog): string {
  const maxId = catalog.videos
    .filter((v) => v.type === "main")
    .map((v) => parseInt(v.id.replace("VID-", ""), 10))
    .reduce((a, b) => Math.max(a, b), 0);
  return `VID-${String(maxId + 1).padStart(3, "0")}`;
}

export function nextShortId(catalog: Catalog): string {
  const maxId = catalog.videos
    .filter((v) => v.type === "short")
    .map((v) => parseInt(v.id.replace("VID-", ""), 10))
    .reduce((a, b) => Math.max(a, b), 1000);
  return `VID-${String(maxId + 1).padStart(4, "0")}`;
}

export const STATUSES = [
  "idea", "script_wip", "script_done", "slide_wip", "slide_done",
  "recording", "editing", "review", "ready", "published", "unlisted", "archived",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  idea: "企画",
  script_wip: "台本作成中",
  script_done: "台本完了",
  slide_wip: "スライド作成中",
  slide_done: "スライド完了",
  recording: "収録中",
  editing: "編集中",
  review: "レビュー待ち",
  ready: "公開準備完了",
  published: "公開済み",
  unlisted: "限定公開",
  archived: "アーカイブ",
};

export const STATUS_COLORS: Record<string, string> = {
  idea: "#9e9e9e",
  script_wip: "#ff9800",
  script_done: "#4caf50",
  slide_wip: "#ff9800",
  slide_done: "#4caf50",
  recording: "#2196f3",
  editing: "#2196f3",
  review: "#9c27b0",
  ready: "#00bcd4",
  published: "#4caf50",
  unlisted: "#607d8b",
  archived: "#795548",
};
