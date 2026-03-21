"use client";

import { useEffect, useState, useCallback } from "react";

interface Video {
  id: string;
  type: "main" | "short";
  parent_id?: string | null;
  title: string;
  series: string | null;
  product: string | null;
  status: string;
  duration: string | null;
  youtube_url: string | null;
  publish_date: string | null;
  note_status: string;
  memo: string | null;
  shorts: string[];
  tags: string[];
  performance: { views: number | null; ctr: number | null };
}

interface Series {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  main: number;
  shorts: number;
  byStatus: Record<string, number>;
  bySeries: Record<string, number>;
  noteLinked: number;
  noteTotal: number;
  totalViews: number;
  series: Series[];
}

const STATUS_LABELS: Record<string, string> = {
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

const STATUS_COLORS: Record<string, string> = {
  idea: "#9e9e9e",
  script_wip: "#ff9800",
  script_done: "#4caf50",
  slide_wip: "#ff9800",
  slide_done: "#4caf50",
  recording: "#2196f3",
  editing: "#2196f3",
  review: "#9c27b0",
  ready: "#00bcd4",
  published: "#388e3c",
  unlisted: "#607d8b",
  archived: "#795548",
};

const STATUSES = [
  "idea", "script_wip", "script_done", "slide_wip", "slide_done",
  "recording", "editing", "review", "ready", "published", "unlisted", "archived",
];

const PRODUCTS = ["IAOF", "INSS", "IOSH", "IOSD", "INBT", "INMV", "INAG", "INCA", "INPY"];

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeries, setFilterSeries] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const fetchVideos = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterSeries) params.set("series", filterSeries);
    if (filterType) params.set("type", filterType);
    if (searchQuery) params.set("q", searchQuery);

    const res = await fetch(`/api/videos?${params}`);
    const data = await res.json();
    setVideos(data.videos);
    setSeriesList(data.series);
  }, [filterStatus, filterSeries, filterType, searchQuery]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [fetchVideos, fetchStats]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setEditingId(null);
    fetchVideos();
    fetchStats();
  };

  const addVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title"),
      type: form.get("type"),
      series: form.get("series") || null,
      product: form.get("product") || null,
      parent_id: form.get("parent_id") || null,
      memo: form.get("memo") || null,
    };
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowAddForm(false);
    fetchVideos();
    fetchStats();
  };

  const seriesName = (id: string | null) => {
    if (!id) return "-";
    return seriesList.find((s) => s.id === id)?.name || id;
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Video Manager
          <span style={{ fontSize: 14, fontWeight: 400, color: "#666", marginLeft: 8 }}>HARMONIC</span>
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: "#1a73e8", color: "#fff", border: "none", borderRadius: 6,
            padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}
        >
          + 動画を追加
        </button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard label="本編" value={stats.main} />
          <StatCard label="ショート" value={stats.shorts} />
          <StatCard label="合計" value={stats.total} />
          <StatCard label="公開済み" value={stats.byStatus["published"] || 0} />
          <StatCard label="制作中" value={stats.total - (stats.byStatus["published"] || 0) - (stats.byStatus["idea"] || 0) - (stats.byStatus["archived"] || 0)} />
          <StatCard label="note連携" value={`${stats.noteLinked}/${stats.noteTotal}`} />
          {stats.totalViews > 0 && <StatCard label="総再生数" value={stats.totalViews.toLocaleString()} />}
        </div>
      )}

      {/* Status Pipeline */}
      {stats && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontSize: 14, color: "#666", marginTop: 0, marginBottom: 12 }}>制作パイプライン</h3>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATUSES.map((s) => {
              const count = stats.byStatus[s] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                  style={{
                    background: filterStatus === s ? STATUS_COLORS[s] : `${STATUS_COLORS[s]}22`,
                    color: filterStatus === s ? "#fff" : STATUS_COLORS[s],
                    border: `1px solid ${STATUS_COLORS[s]}`,
                    borderRadius: 16, padding: "4px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {STATUS_LABELS[s]} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={addVideo} style={{ background: "#fff", borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0 }}>新しい動画を追加</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>タイトル *</label>
              <input name="title" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>種別</label>
              <select name="type" style={inputStyle}>
                <option value="main">本編</option>
                <option value="short">ショート</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>シリーズ</label>
              <select name="series" style={inputStyle}>
                <option value="">-</option>
                {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>対象製品</label>
              <select name="product" style={inputStyle}>
                <option value="">-</option>
                {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>親動画ID（ショートの場合）</label>
              <input name="parent_id" placeholder="VID-001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>メモ</label>
              <input name="memo" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
              追加
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: "#eee", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        />
        <select value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)} style={inputStyle}>
          <option value="">全シリーズ</option>
          {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={inputStyle}>
          <option value="">全タイプ</option>
          <option value="main">本編</option>
          <option value="short">ショート</option>
        </select>
        {(filterStatus || filterSeries || filterType || searchQuery) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterSeries(""); setFilterType(""); setSearchQuery(""); }}
            style={{ background: "none", border: "none", color: "#1a73e8", cursor: "pointer", fontSize: 13 }}
          >
            フィルタ解除
          </button>
        )}
        <span style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>{videos.length}本</span>
      </div>

      {/* Video List */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>タイトル</th>
              <th style={thStyle}>シリーズ</th>
              <th style={thStyle}>ステータス</th>
              <th style={thStyle}>尺</th>
              <th style={thStyle}>note</th>
              <th style={thStyle}>ショート</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdStyle}>
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: v.type === "short" ? "#888" : "#333" }}>
                    {v.type === "short" ? `  ${v.id}` : v.id}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div>
                    {v.type === "short" && <span style={{ color: "#999", marginRight: 4 }}>&#x2514;</span>}
                    {v.youtube_url ? (
                      <a href={v.youtube_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8", textDecoration: "none" }}>
                        {v.title}
                      </a>
                    ) : v.title}
                    {v.product && <span style={{ marginLeft: 6, fontSize: 11, background: "#e3f2fd", color: "#1565c0", borderRadius: 4, padding: "1px 6px" }}>{v.product}</span>}
                  </div>
                  {v.memo && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{v.memo}</div>}
                </td>
                <td style={tdStyle}>{seriesName(v.series)}</td>
                <td style={tdStyle}>
                  {editingId === v.id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => updateStatus(v.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      autoFocus
                      style={{ fontSize: 12, borderRadius: 4, border: "1px solid #ddd", padding: "2px 4px" }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  ) : (
                    <span
                      onClick={() => { setEditingId(v.id); setEditStatus(v.status); }}
                      style={{
                        background: `${STATUS_COLORS[v.status]}22`,
                        color: STATUS_COLORS[v.status],
                        borderRadius: 12, padding: "2px 10px", fontSize: 11,
                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {STATUS_LABELS[v.status] || v.status}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>{v.duration || "-"}</td>
                <td style={tdStyle}>
                  <span style={{ color: v.note_status === "済" ? "#4caf50" : "#999" }}>
                    {v.note_status}
                  </span>
                </td>
                <td style={tdStyle}>
                  {v.type === "main" && v.shorts.length > 0 ? (
                    <span style={{ background: "#f3e5f5", color: "#7b1fa2", borderRadius: 12, padding: "2px 8px", fontSize: 11 }}>
                      {v.shorts.length}本
                    </span>
                  ) : "-"}
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#999", padding: 40 }}>動画がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "#666", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#666", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
