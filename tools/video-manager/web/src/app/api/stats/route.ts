import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/catalog";

export async function GET() {
  const catalog = readCatalog();
  const videos = catalog.videos;

  const mainVideos = videos.filter((v) => v.type === "main");
  const shortVideos = videos.filter((v) => v.type === "short");

  const byStatus: Record<string, number> = {};
  const bySeries: Record<string, number> = {};

  for (const v of videos) {
    byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    const s = v.series || "未分類";
    bySeries[s] = (bySeries[s] || 0) + 1;
  }

  const noteLinked = videos.filter((v) => v.note_status === "済").length;
  const totalViews = videos.reduce((sum, v) => sum + (v.performance.views || 0), 0);

  return NextResponse.json({
    total: videos.length,
    main: mainVideos.length,
    shorts: shortVideos.length,
    byStatus,
    bySeries,
    noteLinked,
    noteTotal: mainVideos.length,
    totalViews,
    series: catalog.series,
  });
}
