"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface CheckResult {
  category: string;
  severity: "error" | "warning" | "info" | "ok";
  item: string;
  detail: string;
}

interface AnalysisResult {
  summary: string;
  totalAmount: string;
  itemCount: number;
  checks: CheckResult[];
  score: number;
}

// Simulated AI analysis for demo purposes
function simulateAnalysis(text: string): AnalysisResult {
  const checks: CheckResult[] = [];

  // Simulate various checks based on content
  const hasDate = /\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}/.test(text);
  const hasAmount = /[\d,]+円/.test(text) || /¥[\d,]+/.test(text);
  const hasCompanyName = text.includes("株式会社") || text.includes("有限会社");
  const hasExpiry = text.includes("有効期限") || text.includes("見積期限");
  const hasTax = text.includes("消費税") || text.includes("税込") || text.includes("税抜");
  const hasDelivery = text.includes("納期") || text.includes("工期") || text.includes("納品");
  const hasPayment = text.includes("支払") || text.includes("振込");
  const hasStamp = text.includes("印") || text.includes("承認");
  const hasUnit = text.includes("単価") || text.includes("数量");
  const hasSubtotal = text.includes("小計");

  // 基本情報チェック
  checks.push({
    category: "基本情報",
    severity: hasDate ? "ok" : "error",
    item: "日付の記載",
    detail: hasDate ? "見積日付が記載されています" : "見積日付が見つかりません。日付の記載は必須です",
  });
  checks.push({
    category: "基本情報",
    severity: hasCompanyName ? "ok" : "warning",
    item: "宛先/発行元",
    detail: hasCompanyName ? "会社名が記載されています" : "会社名（株式会社/有限会社）が見つかりません",
  });
  checks.push({
    category: "基本情報",
    severity: hasExpiry ? "ok" : "warning",
    item: "見積有効期限",
    detail: hasExpiry ? "有効期限が設定されています" : "見積有効期限の記載がありません。トラブル防止のため記載を推奨します",
  });

  // 金額チェック
  checks.push({
    category: "金額・計算",
    severity: hasAmount ? "ok" : "error",
    item: "金額の記載",
    detail: hasAmount ? "金額が記載されています" : "金額表記（○○円）が見つかりません",
  });
  checks.push({
    category: "金額・計算",
    severity: hasTax ? "ok" : "error",
    item: "消費税の明記",
    detail: hasTax ? "消費税に関する記載があります" : "消費税の表記がありません。税込/税抜を明記してください",
  });
  checks.push({
    category: "金額・計算",
    severity: hasUnit ? "ok" : "warning",
    item: "単価・数量の明細",
    detail: hasUnit ? "単価・数量の記載があります" : "単価・数量の明細が不明確です。内訳の記載を推奨します",
  });
  checks.push({
    category: "金額・計算",
    severity: hasSubtotal ? "ok" : "info",
    item: "小計の記載",
    detail: hasSubtotal ? "小計が記載されています" : "小計の記載がありません。カテゴリ別の小計があると確認しやすくなります",
  });

  // 条件チェック
  checks.push({
    category: "取引条件",
    severity: hasDelivery ? "ok" : "warning",
    item: "納期・工期",
    detail: hasDelivery ? "納期/工期の記載があります" : "納期・工期の記載がありません。工事・製造案件では必須です",
  });
  checks.push({
    category: "取引条件",
    severity: hasPayment ? "ok" : "warning",
    item: "支払条件",
    detail: hasPayment ? "支払条件の記載があります" : "支払条件の記載がありません。支払方法・期日を明記してください",
  });
  checks.push({
    category: "取引条件",
    severity: hasStamp ? "ok" : "info",
    item: "承認・押印欄",
    detail: hasStamp ? "承認欄の記載があります" : "承認・押印欄が見つかりません",
  });

  // Calculate amounts if present
  const amountMatches = text.match(/[\d,]+円/g) || [];
  const amounts = amountMatches.map(a => parseInt(a.replace(/[,円]/g, ""), 10)).filter(n => !isNaN(n));

  // Check for suspicious values
  if (amounts.length > 1) {
    const max = Math.max(...amounts);
    const others = amounts.filter(a => a !== max);
    const sum = others.reduce((s, v) => s + v, 0);

    if (max > 0 && sum > 0 && Math.abs(max - sum) / max > 0.15 && Math.abs(max - sum) > 1000) {
      checks.push({
        category: "金額・計算",
        severity: "warning",
        item: "合計金額の整合性",
        detail: `明細の合計（${sum.toLocaleString()}円）と合計金額（${max.toLocaleString()}円）に差異があります。消費税を含む可能性がありますが確認してください`,
      });
    } else {
      checks.push({
        category: "金額・計算",
        severity: "ok",
        item: "合計金額の整合性",
        detail: "金額間の大きな矛盾は検出されませんでした",
      });
    }

    // 異常単価チェック
    const smallAmounts = amounts.filter(a => a > 0 && a < 100);
    if (smallAmounts.length > 0) {
      checks.push({
        category: "金額・計算",
        severity: "warning",
        item: "異常単価の検出",
        detail: `${smallAmounts.map(a => a + "円").join(", ")} など非常に小さい金額があります。単位（千円単位等）の誤りがないか確認してください`,
      });
    }
  }

  const totalAmount = amounts.length > 0
    ? `${Math.max(...amounts).toLocaleString()}円`
    : "金額の検出なし";

  const errorCount = checks.filter(c => c.severity === "error").length;
  const warningCount = checks.filter(c => c.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 10);

  return {
    summary: errorCount > 0
      ? `${errorCount}件の重大な問題と${warningCount}件の注意事項が見つかりました`
      : warningCount > 0
        ? `重大な問題はありませんが、${warningCount}件の改善推奨事項があります`
        : "重大な問題は見つかりませんでした",
    totalAmount,
    itemCount: checks.length,
    checks,
    score,
  };
}

const severityConfig = {
  error: { label: "要修正", bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  warning: { label: "注意", bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
  info: { label: "推奨", bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE" },
  ok: { label: "OK", bg: "#D1FAE5", color: "#059669", border: "#A7F3D0" },
};

const sampleEstimate = `見積書

見積日: 2026年3月28日
見積番号: EST-2026-0412

宛先: 株式会社山田建設 御中

件名: 第3期新棟 内装工事

品目                    数量    単価          金額
──────────────────────────────────────────────
壁面クロス張替え         120m²   3,500円      420,000円
床材フローリング施工      85m²   8,200円      697,000円
天井塗装                 95m²   2,800円      266,000円
電気配線工事              1式  350,000円      350,000円
給排水管接続              1式  180,000円      180,000円
廃材処分費                1式   85,000円       85,000円
──────────────────────────────────────────────
小計                                       1,998,000円
消費税（10%）                                199,800円
合計金額                                   2,197,800円

納期: 2026年5月15日〜6月30日（約45日間）
支払条件: 着工時50%、完工時50%　振込
備考: 見積有効期限 2026年4月30日`;

export default function EstimateCheckerPage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const analysis = simulateAnalysis(inputText);
    setResult(analysis);
    setIsAnalyzing(false);
  }, [inputText]);

  const loadSample = () => {
    setInputText(sampleEstimate);
    setResult(null);
  };

  const categories = result
    ? [...new Set(result.checks.map(c => c.category))]
    : [];

  const filteredChecks = result
    ? activeCategory
      ? result.checks.filter(c => c.category === activeCategory)
      : result.checks
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FB" }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "12px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>← デモ一覧</Link>
          <span style={{ color: "#E5E7EB" }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>見積書AIチェック</span>
        </div>
      </header>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px" }}>
        {/* Description */}
        <div style={{
          background: "linear-gradient(135deg, #1B3A5C 0%, #2A5580 100%)",
          color: "#fff",
          borderRadius: 16,
          padding: "24px 32px",
          marginBottom: 24,
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>見積書AIチェック</h1>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.8 }}>
            見積書のテキストを貼り付けると、AIが以下の観点で自動チェックします：
            <br />必須項目の抜け漏れ / 金額の整合性 / 単価の異常値 / 取引条件の記載
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}>
          {/* Input Panel */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>見積書テキスト入力</h2>
              <button onClick={loadSample} style={{
                fontSize: 12,
                padding: "6px 12px",
                background: "#EDF1F5",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                color: "#1B3A5C",
                fontWeight: 500,
              }}>
                サンプルを読み込む
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ここに見積書のテキストを貼り付けてください...&#10;&#10;（PDFからコピー&ペースト、またはOCRで読み取ったテキストを入力）"
              style={{
                width: "100%",
                minHeight: 400,
                padding: 16,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'Noto Sans JP', monospace",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim() || isAnalyzing}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "14px 24px",
                background: inputText.trim() && !isAnalyzing ? "#1B3A5C" : "#9CA3AF",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: inputText.trim() && !isAnalyzing ? "pointer" : "not-allowed",
                transition: "background 0.2s",
              }}
            >
              {isAnalyzing ? "AIが分析中..." : "AIチェックを実行"}
            </button>
          </div>

          {/* Result Panel */}
          <div>
            {isAnalyzing && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 48,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #E5E7EB",
                textAlign: "center",
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: "4px solid #E5E7EB",
                  borderTopColor: "#1B3A5C",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }} />
                <p style={{ fontSize: 14, color: "#6B7280" }}>AIが見積書を分析しています...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {result && !isAnalyzing && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Score Card */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: result.score >= 80 ? "#D1FAE5" : result.score >= 50 ? "#FEF3C7" : "#FEE2E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: result.score >= 80 ? "#059669" : result.score >= 50 ? "#D97706" : "#DC2626",
                    }}>{result.score}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500, marginBottom: 4 }}>チェックスコア</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{result.summary}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      検出金額: {result.totalAmount} / チェック項目: {result.itemCount}件
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveCategory(null)}
                    style={{
                      fontSize: 12,
                      padding: "6px 14px",
                      background: activeCategory === null ? "#1B3A5C" : "#fff",
                      color: activeCategory === null ? "#fff" : "#374151",
                      border: "1px solid #E5E7EB",
                      borderRadius: 20,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >すべて ({result.checks.length})</button>
                  {categories.map(cat => {
                    const count = result.checks.filter(c => c.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          background: activeCategory === cat ? "#1B3A5C" : "#fff",
                          color: activeCategory === cat ? "#fff" : "#374151",
                          border: "1px solid #E5E7EB",
                          borderRadius: 20,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >{cat} ({count})</button>
                    );
                  })}
                </div>

                {/* Check Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredChecks.map((check, i) => {
                    const cfg = severityConfig[check.severity];
                    return (
                      <div key={i} style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: "14px 18px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        border: `1px solid ${cfg.border}`,
                        borderLeft: `4px solid ${cfg.color}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            background: cfg.bg,
                            color: cfg.color,
                            borderRadius: 4,
                            fontWeight: 700,
                          }}>{cfg.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{check.item}</span>
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{check.category}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{check.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!result && !isAnalyzing && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 48,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #E5E7EB",
                textAlign: "center",
                color: "#9CA3AF",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 14 }}>見積書テキストを入力して<br />「AIチェックを実行」を押してください</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
