"use client";

import Link from "next/link";
import { useState } from "react";

type Article = {
  date: string;
  category: string;
  region: string;
  title: string;
  summary: string;
  source: string;
  url: string;
};

const categoryFilters = [
  { id: "all", label: "すべて" },
  { id: "enterprise", label: "企業導入事例" },
  { id: "industry", label: "業界動向" },
  { id: "report", label: "調査レポート" },
  { id: "agentic", label: "エージェントAI" },
];

const regionFilters = [
  { id: "all", label: "すべて" },
  { id: "japan", label: "国内" },
  { id: "global", label: "海外" },
];

const articles: Article[] = [
  // April 2026
  {
    date: "2026-04-01",
    category: "industry",
    region: "global",
    title: "Microsoft：企業AIスケーリングの実態レポートを公開",
    summary: "Microsoftが企業のAI導入拡大に関するレポートを公開。リーダー企業がどのようにAIを活用してエンタープライズ変革を推進しているかを分析しています。",
    source: "Microsoft",
    url: "https://www.microsoft.com/en-us/industry/microsoft-in-business/business-insights/2026/04/01/scaling-ai-with-confidence-how-leaders-are-using-ai-to-drive-enterprise-transformation/",
  },
  {
    date: "2026-04",
    category: "agentic",
    region: "global",
    title: "エージェントAIの台頭：ビジネスにとっての意味",
    summary: "Morgan Lewisのレポート。AIが「アシスタント」から「アクター」へ進化し、自律的にタスクを遂行するエージェントAIが企業に与える影響を分析しています。",
    source: "Morgan Lewis",
    url: "https://www.morganlewis.com/blogs/sourcingatmorganlewis/2026/04/from-assistant-to-actor-what-the-rise-of-agentic-ai-means-for-your-business",
  },
  // March 2026
  {
    date: "2026-03",
    category: "report",
    region: "japan",
    title: "AIトレンドレポート2026：1万件のデータが示す「現場のリアル」",
    summary: "AISmileyが1万件のデータを分析し、日本企業のAI導入の実態を可視化。2026年のAI戦略を左右する重要データが公開されました。",
    source: "AISmiley",
    url: "https://aismiley.co.jp/ai_news/ai-trend-report-2026/",
  },
  {
    date: "2026-03",
    category: "enterprise",
    region: "japan",
    title: "パナソニック コネクト：全社1.2万人のAI導入で18.6万時間削減",
    summary: "ChatGPTベースの社内AI「ConnectAI」を全社員約1.2万人に展開。導入1年間で約18.6万時間の労働時間削減を達成しました。",
    source: "パナソニック IS",
    url: "https://service.is-c.jpn.panasonic.com/column/generative_ai",
  },
  {
    date: "2026-03",
    category: "enterprise",
    region: "japan",
    title: "セブンイレブン：AI発注提案で発注時間を4割削減",
    summary: "セブンイレブン・ジャパンが発注数を提案するAIを導入し、店舗の発注業務時間を40%削減。小売業界のAI活用の先進事例として注目されています。",
    source: "freeconsultant.jp",
    url: "https://mirai-works.co.jp/business-pro/business-column/generative-ai-case-study/",
  },
  {
    date: "2026-03",
    category: "enterprise",
    region: "japan",
    title: "サントリー：生成AIで消費者の声を自動分類・分析",
    summary: "「見える化エンジン」を導入し、消費者の声を自動分類・分析。顧客ニーズの洞察と業務効率化を同時に実現しています。",
    source: "BIZ ROAD",
    url: "https://bizroad-svc.com/blog/seisei-ai-kigyou/",
  },
  {
    date: "2026-03",
    category: "enterprise",
    region: "japan",
    title: "ヤマト運輸：AIで配送業務量を予測し効率化",
    summary: "配送業務量の予測AIを導入。需要予測に基づく最適な人員配置とルート最適化で物流効率を大幅に向上させています。",
    source: "パナソニック IS",
    url: "https://service.is-c.jpn.panasonic.com/column/generative_ai",
  },
  // February 2026
  {
    date: "2026-02",
    category: "report",
    region: "global",
    title: "NVIDIA：2026年のAI活用レポート — 全業界で収益・コスト・生産性に貢献",
    summary: "NVIDIAの調査で回答者の88%がAIが年間収益に好影響と回答。30%は10%以上の大幅な収益増加を報告。86%がAI予算を増額予定です。",
    source: "NVIDIA",
    url: "https://blogs.nvidia.com/blog/state-of-ai-report-2026/",
  },
  {
    date: "2026-02",
    category: "report",
    region: "global",
    title: "Deloitte：The State of AI in the Enterprise 2026",
    summary: "Deloitteの年次AI調査レポート。企業AIが「実験」から「本格運用」フェーズに移行し、測定可能なビジネス価値の創出にフォーカスが移っている状況を報告。",
    source: "Deloitte",
    url: "https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/content/state-of-ai-in-the-enterprise.html",
  },
  {
    date: "2026-02",
    category: "report",
    region: "japan",
    title: "国内企業の57.7%が生成AI導入済み — 2023年の33.8%から急増",
    summary: "野村総合研究所の調査によると、国内企業の生成AI導入率が57.7%に到達。2023年の33.8%から約1.7倍に急増し、AIが標準的な業務ツールとなりつつあります。",
    source: "NRI",
    url: "https://relipasoft.com/blog/top-ai-trend/",
  },
  {
    date: "2026-02",
    category: "report",
    region: "global",
    title: "PwC：2026年AIビジネス予測レポート",
    summary: "PwCが2026年のAIビジネス予測を公開。企業のAI投資の方向性やROI測定の進展、組織変革の必要性について分析しています。",
    source: "PwC",
    url: "https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-predictions.html",
  },
  // January 2026
  {
    date: "2026-01",
    category: "agentic",
    region: "global",
    title: "Gartner：2026年末までにエンタープライズアプリの40%にAIエージェント搭載",
    summary: "Gartnerが予測：タスク特化型AIエージェントを搭載するエンタープライズアプリが2025年の5%未満から2026年末には40%に急増する見通しです。",
    source: "Gartner",
    url: "https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025",
  },
  {
    date: "2026-01",
    category: "industry",
    region: "global",
    title: "300超の企業AI事例が示す2026年のトレンド",
    summary: "Data Innovation Summitで発表された300以上のAI活用事例を分析。カスタマーサポート、サプライチェーン、R&D、ナレッジマネジメント、サイバーセキュリティが高インパクト領域と判明。",
    source: "Hyperight",
    url: "https://hyperight.com/enterprise-ai-operationalization-2026/",
  },
  {
    date: "2026-01",
    category: "agentic",
    region: "global",
    title: "2026年のエージェントAI活用事例 — 業界横断で拡大中",
    summary: "コード開発、法務、財務、管理業務などでエージェントAIが本格展開。「実験」から「フルデプロイ」へ移行する企業が増加しています。",
    source: "TechAhead",
    url: "https://www.techaheadcorp.com/blog/top-use-cases-of-agentic-ai-in-2026-across-industries/",
  },
  {
    date: "2026-01",
    category: "enterprise",
    region: "japan",
    title: "ベネッセ：AIで運用体制を刷新、人員配置を最適化",
    summary: "生成AIの導入により新しい運用体制を確立。人員配置の最適化とコンテンツ制作プロセスの効率化を実現しました。",
    source: "パナソニック IS",
    url: "https://service.is-c.jpn.panasonic.com/column/generative_ai",
  },
  {
    date: "2026-01",
    category: "industry",
    region: "global",
    title: "Constellation Research：2026年エンタープライズ技術15トレンド",
    summary: "AI、SaaS、データ分野を中心に、2026年に注目すべき15のエンタープライズ技術トレンドを分析。AIの実用化フェーズに突入した現状を報告しています。",
    source: "Constellation Research",
    url: "https://www.constellationr.com/blog-news/insights/enterprise-technology-2026-15-ai-saas-data-business-trends-watch",
  },
];

export default function AICasesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const filtered = articles.filter((a) => {
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    if (selectedRegion !== "all" && a.region !== selectedRegion) return false;
    return true;
  });

  const grouped: Record<string, Article[]> = {};
  for (const a of filtered) {
    const month = a.date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(a);
  }
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    return `${y}年${parseInt(m)}月`;
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "enterprise": return "#059669";
      case "industry": return "#2563EB";
      case "report": return "#7C3AED";
      case "agentic": return "#DC2626";
      default: return "#6B7280";
    }
  };

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
          <Link href="/" style={{ textDecoration: "none", color: "#1B3A5C", fontSize: 14, fontWeight: 500 }}>
            ← トップ
          </Link>
          <span style={{ color: "#E5E7EB" }}>|</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#1B3A5C" }}>AI</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>AI活用事例・ニュース</span>
          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>by HARMONIC insight</span>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #1B3A5C 0%, #2A5580 50%, #3A7BC8 100%)",
        color: "#fff",
        padding: "56px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📰</div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 900, marginBottom: 12, letterSpacing: "-0.02em" }}>
          AI活用事例・ニュース
        </h1>
        <p style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", opacity: 0.85, maxWidth: 640, margin: "0 auto", lineHeight: 1.8 }}>
          国内外の企業がAIをどう業務に活かしているか？<br />
          導入事例・業界動向・調査レポートを厳選してお届けします。
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 28, flexWrap: "wrap" }}>
          {[
            { value: "57.7%", label: "国内企業のAI導入率" },
            { value: "88%", label: "収益に好影響と回答" },
            { value: "40%", label: "アプリにAIエージェント搭載予測" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{stat.value}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginRight: 12 }}>カテゴリ:</span>
            {categoryFilters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  fontSize: 13,
                  padding: "5px 14px",
                  marginRight: 8,
                  marginBottom: 4,
                  borderRadius: 20,
                  border: selectedCategory === c.id ? "none" : "1px solid #D1D5DB",
                  background: selectedCategory === c.id ? "#1B3A5C" : "#fff",
                  color: selectedCategory === c.id ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontWeight: selectedCategory === c.id ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginRight: 12 }}>地域:</span>
            {regionFilters.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                style={{
                  fontSize: 13,
                  padding: "5px 14px",
                  marginRight: 8,
                  marginBottom: 4,
                  borderRadius: 20,
                  border: selectedRegion === r.id ? "none" : "1px solid #D1D5DB",
                  background: selectedRegion === r.id ? "#1B3A5C" : "#fff",
                  color: selectedRegion === r.id ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontWeight: selectedRegion === r.id ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "#6B7280" }}>
          {filtered.length} 件の記事
        </div>
      </section>

      {/* Timeline */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 24px 48px" }}>
        {sortedMonths.map((month) => (
          <div key={month} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#1B3A5C",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "2px solid #1B3A5C",
              display: "inline-block",
            }}>
              {formatMonth(month)}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {grouped[month].map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: "20px 24px",
                      border: "1px solid #E5E7EB",
                      borderLeft: `4px solid ${categoryColor(a.category)}`,
                      transition: "transform 0.15s, box-shadow 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        background: categoryColor(a.category),
                        borderRadius: 20,
                        color: "#fff",
                        fontWeight: 600,
                      }}>{categoryFilters.find((c) => c.id === a.category)?.label}</span>
                      <span style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        background: a.region === "japan" ? "#FEF3C7" : "#DBEAFE",
                        borderRadius: 20,
                        color: a.region === "japan" ? "#92400E" : "#1E40AF",
                        fontWeight: 500,
                      }}>{a.region === "japan" ? "国内" : "海外"}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{a.source}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{a.date}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#1C1917", lineHeight: 1.5 }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.8, margin: 0 }}>
                      {a.summary}
                    </p>
                    <span style={{ fontSize: 12, color: "#2E86AB", fontWeight: 600, marginTop: 8, display: "inline-block" }}>
                      記事を読む →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "64px 24px",
            color: "#6B7280",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16 }}>該当する記事が見つかりません。フィルターを変更してください。</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{
        background: "#F0F4F8",
        padding: "48px 24px",
        textAlign: "center",
        borderTop: "1px solid #E5E7EB",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>
          自社にもAIを導入しませんか？
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.8 }}>
          HARMONIC insightは、最新事例を踏まえた<br />
          AI導入・業務自動化をご支援します。
        </p>
        <a
          href="https://h-insight.jp/contact"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "#1B3A5C",
            color: "#fff",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#2A5580"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1B3A5C"; }}
        >
          お問い合わせ
        </a>
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
