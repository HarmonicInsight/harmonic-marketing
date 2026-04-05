"use client";

import Link from "next/link";

const sections = [
  {
    id: "ai-announcements",
    title: "最新AI動向",
    subtitle: "AI Vendor Announcements",
    description: "Anthropic・OpenAI・Google・Microsoftなど主要AIベンダーの公式発表をいち早くキャッチアップ。",
    icon: "⚡",
    tags: ["Anthropic", "OpenAI", "Google", "Microsoft"],
    cta: "最新情報を見る →",
    accent: "#0F2A44",
  },
  {
    id: "ai-cases",
    title: "AI活用事例",
    subtitle: "AI Use Cases & Industry News",
    description: "国内外の企業がAIをどう業務に活かしているか？導入事例・業界動向・調査レポートを厳選。",
    icon: "📰",
    tags: ["導入事例", "業界ニュース", "国内", "海外"],
    cta: "事例を見る →",
    accent: "#1B3A5C",
  },
  {
    id: "construction",
    title: "建設",
    subtitle: "Construction Industry",
    description: "建設業界におけるAI活用の最前線。施工管理・安全管理・積算・日報など現場DXを推進します。",
    icon: "🏗️",
    tags: ["施工管理", "安全管理", "積算", "日報"],
    cta: "建設AI事例を見る →",
    accent: "#B45309",
  },
  {
    id: "real-estate",
    title: "不動産",
    subtitle: "Real Estate Industry",
    description: "不動産業界のAI革新。物件査定・契約書チェック・顧客マッチング・市場分析の効率化を実現。",
    icon: "🏢",
    tags: ["物件査定", "契約書AI", "市場分析", "顧客対応"],
    cta: "不動産AI事例を見る →",
    accent: "#0E7490",
  },
  {
    id: "manufacturing",
    title: "製造業",
    subtitle: "Manufacturing Industry",
    description: "製造業のAI導入事例。品質検査・予知保全・生産計画・サプライチェーン最適化を支援します。",
    icon: "🏭",
    tags: ["品質検査", "予知保全", "生産計画", "在庫最適化"],
    cta: "製造業AI事例を見る →",
    accent: "#4338CA",
  },
  {
    id: "consulting",
    title: "コンサルティング",
    subtitle: "AI Consulting Services",
    description: "AI導入を検討中の企業様へ。戦略立案から実装・運用まで、HARMONIC insightが伴走支援します。",
    icon: "💼",
    tags: ["戦略立案", "PoC支援", "導入・実装", "運用定着"],
    cta: "サービス詳細を見る →",
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
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#1B3A5C" }}>AI</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>HARMONIC insight</span>
          </Link>
          <span style={{ fontSize: 12, color: "#6B7280" }}>by HARMONIC insight</span>
          <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {sections.slice(0, 2).map((s) => (
              <Link key={s.id} href={`/${s.id}`} style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1B3A5C",
                padding: "5px 12px",
                borderRadius: 20,
                textDecoration: "none",
                border: "1px solid #E5E7EB",
                transition: "all 0.15s",
              }}>
                {s.icon} {s.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0F2A44 0%, #1B3A5C 50%, #2A5580 100%)",
        color: "#fff",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: 16, letterSpacing: "-0.02em" }}>
          AIで業務を、もっと簡単に。
        </h1>
        <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", opacity: 0.9, maxWidth: 640, margin: "0 auto", lineHeight: 1.8 }}>
          建設・不動産・製造業に特化したAI導入支援。<br />
          最新AI動向から業界別活用事例、コンサルティングまで。
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {["建設", "不動産", "製造業", "最新AI動向", "AI活用事例", "コンサル"].map((kw) => (
            <span key={kw} style={{
              fontSize: 12,
              padding: "5px 14px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 20,
              color: "#fff",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.25)",
            }}>{kw}</span>
          ))}
        </div>
      </section>

      {/* 6 Cards */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {sections.map((section) => (
            <Link key={section.id} href={`/${section.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                border: "1px solid #E5E7EB",
                borderTop: `4px solid ${section.accent}`,
                height: "100%",
                display: "flex",
                flexDirection: "column",
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
                <div style={{ fontSize: 40, marginBottom: 12 }}>{section.icon}</div>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: section.accent }}>{section.title}</h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>{section.subtitle}</p>
                <p style={{ fontSize: 14, color: "#374151", marginBottom: 16, lineHeight: 1.8, flex: 1 }}>{section.description}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {section.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      background: "#EDF1F5",
                      borderRadius: 20,
                      color: "#1B3A5C",
                      fontWeight: 500,
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{
                  fontSize: 14,
                  color: "#2E86AB",
                  fontWeight: 700,
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
