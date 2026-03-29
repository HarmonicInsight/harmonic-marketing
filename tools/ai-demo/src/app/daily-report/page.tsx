"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface ReportData {
  date: string;
  weather: string;
  site: string;
  items: string[];
}

interface GeneratedReport {
  formatted: string;
  sections: {
    title: string;
    content: string;
  }[];
  safetyNote: string;
  tomorrowPlan: string;
}

const weatherOptions = ["晴れ", "曇り", "雨", "雪", "晴れ時々曇り", "曇り時々雨"];

const sampleItems = [
  "3F壁面クロス貼り完了",
  "2F電気配線 8割完了",
  "資材搬入 鉄骨20本",
  "午後から雨で外壁作業中断",
  "明日は2F配線残りと4F床施工開始",
  "作業員: 大工3名、電気2名、鍛冶1名",
  "安全巡回実施 指摘なし",
];

function generateReport(data: ReportData): GeneratedReport {
  const items = data.items.filter(item => item.trim());

  // Categorize items
  const completed: string[] = [];
  const inProgress: string[] = [];
  const issues: string[] = [];
  const materials: string[] = [];
  const workers: string[] = [];
  const safety: string[] = [];
  const tomorrow: string[] = [];

  items.forEach(item => {
    const lower = item.toLowerCase();
    if (lower.includes("完了") || lower.includes("終了") || lower.includes("済み") || lower.includes("済")) {
      completed.push(item);
    } else if (lower.includes("中断") || lower.includes("遅延") || lower.includes("問題") || lower.includes("不具合") || lower.includes("トラブル")) {
      issues.push(item);
    } else if (lower.includes("搬入") || lower.includes("資材") || lower.includes("材料") || lower.includes("納品")) {
      materials.push(item);
    } else if (lower.includes("作業員") || lower.includes("人員") || lower.includes("名")) {
      workers.push(item);
    } else if (lower.includes("安全") || lower.includes("巡回") || lower.includes("KY") || lower.includes("危険")) {
      safety.push(item);
    } else if (lower.includes("明日") || lower.includes("予定") || lower.includes("翌日") || lower.includes("次回")) {
      tomorrow.push(item);
    } else if (lower.includes("割") || lower.includes("進行") || lower.includes("途中") || lower.includes("作業中")) {
      inProgress.push(item);
    } else {
      inProgress.push(item);
    }
  });

  const sections: { title: string; content: string }[] = [];

  if (completed.length > 0) {
    sections.push({
      title: "【完了作業】",
      content: completed.map(c => `  ・${c}`).join("\n"),
    });
  }

  if (inProgress.length > 0) {
    sections.push({
      title: "【進行中作業】",
      content: inProgress.map(c => `  ・${c}`).join("\n"),
    });
  }

  if (materials.length > 0) {
    sections.push({
      title: "【資材・搬入】",
      content: materials.map(c => `  ・${c}`).join("\n"),
    });
  }

  if (workers.length > 0) {
    sections.push({
      title: "【人員配置】",
      content: workers.map(c => `  ・${c}`).join("\n"),
    });
  }

  if (issues.length > 0) {
    sections.push({
      title: "【問題・遅延事項】",
      content: issues.map(c => `  ・${c}`).join("\n"),
    });
  }

  if (safety.length > 0) {
    sections.push({
      title: "【安全管理】",
      content: safety.map(c => `  ・${c}`).join("\n"),
    });
  }

  const safetyNote = safety.length > 0
    ? safety.join("、")
    : data.weather.includes("雨") || data.weather.includes("雪")
      ? "悪天候のため足場・通路の滑り止め対策を実施。高所作業は中止判断。"
      : "本日のKY活動実施済み。特記事項なし。";

  const tomorrowPlan = tomorrow.length > 0
    ? tomorrow.map(t => t.replace(/^明日[はの]?/, "")).join("、")
    : "前日からの継続作業を実施予定";

  // Build formatted text
  const dateFormatted = data.date || new Date().toLocaleDateString("ja-JP");
  const formatted = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `           作 業 日 報`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `日  付: ${dateFormatted}`,
    `天  候: ${data.weather}`,
    `現場名: ${data.site || "（未入力）"}`,
    ``,
    `──────────────────────────────`,
    `■ 本日の作業内容`,
    `──────────────────────────────`,
    ...sections.map(s => `\n${s.title}\n${s.content}`),
    ``,
    `──────────────────────────────`,
    `■ 安全管理`,
    `──────────────────────────────`,
    `  ${safetyNote}`,
    ``,
    `──────────────────────────────`,
    `■ 明日の予定`,
    `──────────────────────────────`,
    `  ${tomorrowPlan}`,
    ``,
    `──────────────────────────────`,
    `■ 特記事項`,
    `──────────────────────────────`,
    issues.length > 0
      ? `  ${issues.join("\n  ")}`
      : `  特になし`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `報告者:                   承認:`,
  ].join("\n");

  return { formatted, sections, safetyNote, tomorrowPlan };
}

export default function DailyReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [weather, setWeather] = useState("晴れ");
  const [site, setSite] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const addItem = () => setItems([...items, ""]);
  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const loadSample = () => {
    setSite("新宿第3ビル 内装改修工事");
    setWeather("晴れ時々曇り");
    setItems(sampleItems);
    setReport(null);
  };

  const handleGenerate = useCallback(async () => {
    const filledItems = items.filter(item => item.trim());
    if (filledItems.length === 0) return;
    setIsGenerating(true);
    setReport(null);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const result = generateReport({ date, weather, site, items: filledItems });
    setReport(result);
    setIsGenerating(false);
  }, [date, weather, site, items]);

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = report.formatted;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FB" }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "12px 16px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>← 戻る</Link>
          <span style={{ color: "#E5E7EB" }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C" }}>日報AI自動生成</span>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px" }}>
        {/* Input Form - Mobile-optimized */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #E5E7EB",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>作業内容を入力</h2>
            <button onClick={loadSample} style={{
              fontSize: 12,
              padding: "6px 12px",
              background: "#EDF1F5",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "#1B3A5C",
              fontWeight: 500,
            }}>サンプル</button>
          </div>

          {/* Date & Weather - side by side on mobile */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>天候</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 14,
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              >
                {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* Site Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>現場名</label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="例: 新宿第3ビル 内装改修工事"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Work Items - Key input area */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>
              作業メモ（箇条書きで入力）
            </label>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={{
                  width: 24,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#9CA3AF",
                  flexShrink: 0,
                }}>{i + 1}</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  placeholder="作業内容をメモ..."
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                      // Focus next input after render
                      setTimeout(() => {
                        const inputs = document.querySelectorAll<HTMLInputElement>('input[placeholder="作業内容をメモ..."]');
                        inputs[inputs.length - 1]?.focus();
                      }, 50);
                    }
                  }}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      background: "#fff",
                      cursor: "pointer",
                      color: "#9CA3AF",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >×</button>
                )}
              </div>
            ))}
            <button onClick={addItem} style={{
              width: "100%",
              padding: "10px",
              border: "2px dashed #E5E7EB",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              color: "#6B7280",
              fontSize: 13,
              fontWeight: 500,
            }}>
              + 項目を追加
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={items.every(i => !i.trim()) || isGenerating}
            style={{
              width: "100%",
              padding: "16px",
              background: items.some(i => i.trim()) && !isGenerating
                ? "linear-gradient(135deg, #1B3A5C 0%, #2A5580 100%)"
                : "#D1D5DB",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: items.some(i => i.trim()) && !isGenerating ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {isGenerating ? "日報を生成中..." : "日報を自動生成"}
          </button>
        </div>

        {/* Loading */}
        {isGenerating && (
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: 40,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #E5E7EB",
            textAlign: "center",
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: "3px solid #E5E7EB",
              borderTopColor: "#1B3A5C",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ fontSize: 14, color: "#6B7280" }}>AIが日報を整形しています...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Generated Report */}
        {report && !isGenerating && (
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}>
            {/* Report Header */}
            <div style={{
              background: "#1B3A5C",
              color: "#fff",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>生成された日報</span>
              <button
                onClick={copyReport}
                style={{
                  padding: "8px 16px",
                  background: copied ? "#059669" : "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "コピーしました!" : "コピー"}
              </button>
            </div>

            {/* Report Content */}
            <pre style={{
              padding: 20,
              fontSize: 13,
              fontFamily: "'Noto Sans JP', monospace",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              background: "#FAFBFC",
              overflowX: "auto",
            }}>
              {report.formatted}
            </pre>

            {/* Actions */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}>
              <button
                onClick={copyReport}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#1B3A5C",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? "コピー済み" : "クリップボードにコピー"}
              </button>
              <button
                onClick={() => {
                  setReport(null);
                  setItems([""]);
                  setSite("");
                }}
                style={{
                  padding: "12px 20px",
                  background: "#fff",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                新規作成
              </button>
            </div>
          </div>
        )}

        {/* Tips for mobile users */}
        <div style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "#EDF1F5",
          borderRadius: 12,
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.8,
        }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>使い方のヒント</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>箇条書きで作業内容をメモするだけでOK</li>
            <li>「完了」「中断」「搬入」などのキーワードで自動分類</li>
            <li>「明日は〜」と書くと翌日予定に自動反映</li>
            <li>Enter キーで次の項目を追加できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
