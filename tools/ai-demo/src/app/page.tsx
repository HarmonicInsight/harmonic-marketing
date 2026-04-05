"use client";

import Link from "next/link";

const sections = [
  {
    id: "ai-announcements",
    title: "最新AI動向",
    subtitle: "AI Vendor Announcements",
    description: "Anthropic・OpenAI・Google・Microsoftなど主要AIベンダーの公式発表をいち早くキャッチアップ。ビジネスに影響する最新情報を網羅します。",
    icon: "⚡",
    tags: ["Anthropic", "OpenAI", "Google", "Microsoft"],
    cta: "最新情報を見る →",
    accent: "#0F2A44",
  },
  {
    id: "demos",
    title: "AI業務自動化デモ",
    subtitle: "AI Use Cases & Demos",
    description: "建設・不動産・製造業の現場で使えるAI業務自動化ツールのデモをお試しいただけます。見積書チェック、日報自動生成など。",
    icon: "🚀",
    tags: ["見積書チェック", "日報生成", "建設", "製造業"],
    cta: "デモを試す →",
    accent: "#1B3A5C",
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
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>HARMONIC insight AI</span>
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
          最新AI動向のキャッチアップから業務自動化の体験まで、<br />
          HARMONIC insightがAI活用をサポートします。
        </p>
      </section>

      {/* 2 Cards */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 32,
        }}>
          {sections.map((section) => (
            <Link key={section.id} href={`/${section.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: 40,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                border: "1px solid #E5E7EB",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ fontSize: 56, marginBottom: 20 }}>{section.icon}</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6, color: section.accent }}>{section.title}</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>{section.subtitle}</p>
                <p style={{ fontSize: 15, color: "#374151", marginBottom: 20, lineHeight: 1.8, flex: 1 }}>{section.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                  {section.tags.map((tag) => (
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
                  fontSize: 15,
                  color: "#2E86AB",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  {section.cta}
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
