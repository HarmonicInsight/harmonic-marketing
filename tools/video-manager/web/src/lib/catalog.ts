import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CATALOG_PATH = join(process.cwd(), "..", "..", "content", "youtube", "catalog.json");

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

export function readCatalog(): Catalog {
  const raw = readFileSync(CATALOG_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeCatalog(catalog: Catalog): void {
  catalog._meta.last_updated = new Date().toISOString().split("T")[0];
  catalog._meta.total_videos = catalog.videos.filter((v) => v.type === "main").length;
  catalog._meta.total_shorts = catalog.videos.filter((v) => v.type === "short").length;
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
}

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
