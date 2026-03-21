import { NextRequest, NextResponse } from "next/server";
import { readCatalog, writeCatalog, nextMainId, nextShortId, type Video } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const catalog = readCatalog();
  const params = req.nextUrl.searchParams;

  let videos = catalog.videos;

  const status = params.get("status");
  if (status) videos = videos.filter((v) => v.status === status);

  const series = params.get("series");
  if (series) videos = videos.filter((v) => v.series === series);

  const type = params.get("type");
  if (type) videos = videos.filter((v) => v.type === type);

  const q = params.get("q");
  if (q) {
    const lower = q.toLowerCase();
    videos = videos.filter(
      (v) =>
        v.title.toLowerCase().includes(lower) ||
        (v.memo || "").toLowerCase().includes(lower) ||
        v.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }

  return NextResponse.json({
    videos,
    series: catalog.series,
    total: videos.length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const catalog = readCatalog();

  const vtype = body.type || "main";
  const newId = vtype === "short" ? nextShortId(catalog) : nextMainId(catalog);

  const video: Video = {
    id: newId,
    type: vtype,
    parent_id: body.parent_id || null,
    title: body.title,
    series: body.series || null,
    product: body.product || null,
    status: "idea",
    duration: body.duration || null,
    script: null,
    slide: null,
    thumbnail: null,
    youtube_url: null,
    publish_date: null,
    note_status: "未",
    note_url: null,
    tags: body.tags || [],
    performance: { views: null, ctr: null, avg_watch_time: null, likes: null },
    memo: body.memo || null,
    shorts: [],
  };

  catalog.videos.push(video);

  if (vtype === "short" && body.parent_id) {
    const parent = catalog.videos.find((v) => v.id === body.parent_id);
    if (parent) parent.shorts.push(newId);
  }

  writeCatalog(catalog);
  return NextResponse.json(video, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const catalog = readCatalog();

  const video = catalog.videos.find((v) => v.id === body.id);
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatable = [
    "title", "series", "product", "status", "duration", "script", "slide",
    "thumbnail", "youtube_url", "publish_date", "note_status", "note_url",
    "tags", "memo",
  ] as const;

  for (const key of updatable) {
    if (key in body) {
      (video as Record<string, unknown>)[key] = body[key];
    }
  }

  if (body.performance) {
    Object.assign(video.performance, body.performance);
  }

  writeCatalog(catalog);
  return NextResponse.json(video);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const catalog = readCatalog();

  const idx = catalog.videos.findIndex((v) => v.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const video = catalog.videos[idx];

  // Remove from parent's shorts list
  if (video.parent_id) {
    const parent = catalog.videos.find((v) => v.id === video.parent_id);
    if (parent) {
      parent.shorts = parent.shorts.filter((s) => s !== video.id);
    }
  }

  catalog.videos.splice(idx, 1);
  writeCatalog(catalog);
  return NextResponse.json({ deleted: body.id });
}
