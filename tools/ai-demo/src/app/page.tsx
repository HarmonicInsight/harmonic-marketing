"use client";

import Link from "next/link";

const demos = [
  {
    id: "estimate-checker",
    title: "見積書AIチェック",
    subtitle: "Estimate Checker",
    description: "見積書をアップロードすると、AIが項目の抜け漏れ・単価の異常値・合計金額の整合性を自動でチェックします。",
    icon: "📋",
    tags: ["建設", "製造業", "不動産"],
  },
  {
    id: "daily-report",
    title: "日報AI自動生成",
    subtitle: "Daily Report Generator",
    description: "現場でスマホから箇条書きメモを入力するだけで、フォーマット済みの日報を自動生成します。",
    icon: "📝",
    tags: ["建設", "製造業", "モバイル対応"],
  },
  {
    id: "ai-announcements",
    title: "最新AI動向",
    subtitle: "AI Vendor Announcements",
    description: "Anthropic・OpenAI・Google・Microsoftなど主要AIベンダーの公式発表をいち早くキャッチアップ。ビジネスに影響する最新情報を網羅します。",
    icon: "⚡",
    tags: ["Anthropic", "OpenAI", "Google", "Microsoft"],
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "16px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#1B3A5C" }}>AI</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>業務自動化デモ</span>
          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>by HARMONIC insight</span>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #1B3A5C 0%, #2A5580 100%)",
        color: "#fff",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: 16, letterSpacing: "-0.02em" }}>
          AIで業務を、もっと簡単に。
        </h1>
        <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", opacity: 0.9, maxWidth: 600, margin: "0 auto", lineHeight: 1.8 }}>
          建設・不動産・製造業の現場で使える<br />
          AI業務自動化ツールのデモをお試しいただけます。
        </p>
      </section>

      {/* Demo Cards */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {demos.map((demo) => (
            <Link key={demo.id} href={`/${demo.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                border: "1px solid #E5E7EB",
                height: "100%",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>{demo.icon}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{demo.title}</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>{demo.subtitle}</p>
                <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.8 }}>{demo.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {demo.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      background: "#EDF1F5",
                      borderRadius: 20,
                      color: "#1B3A5C",
                      fontWeight: 500,
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{
                  marginTop: 20,
                  fontSize: 14,
                  color: "#2E86AB",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  デモを試す →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "32px 24px",
        color: "#6B7280",
        fontSize: 13,
        borderTop: "1px solid #E5E7EB",
      }}>
        &copy; 2026 HARMONIC insight Inc. All rights reserved.
      </footer>
    </div>
  );
}
