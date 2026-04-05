"use client";

import Link from "next/link";
import { useState } from "react";

type Announcement = {
  date: string;
  vendor: string;
  vendorColor: string;
  title: string;
  summary: string;
  category: string;
  url: string;
};

const vendors = [
  { id: "all", label: "すべて", color: "#1B3A5C" },
  { id: "Anthropic", label: "Anthropic", color: "#D4A574" },
  { id: "OpenAI", label: "OpenAI", color: "#10A37F" },
  { id: "Google", label: "Google", color: "#4285F4" },
  { id: "Microsoft", label: "Microsoft", color: "#00A4EF" },
];

const categories = [
  { id: "all", label: "すべて" },
  { id: "model", label: "モデル" },
  { id: "product", label: "プロダクト" },
  { id: "api", label: "API / 開発者向け" },
  { id: "strategy", label: "戦略 / 提携" },
];

const announcements: Announcement[] = [
  // April 2026
  {
    date: "2026-04-04",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "サードパーティツールでのClaude Pro/Maxサブスクリプション利用をブロック",
    summary: "Anthropicは、OpenClawなどのサードパーティエージェントツール内でのClaude ProおよびMaxサブスクリプションの使用をブロックする措置を開始しました。",
    category: "strategy",
    url: "https://www.anthropic.com/news",
  },
  {
    date: "2026-04-01",
    vendor: "Google",
    vendorColor: "#4285F4",
    title: "Gemma 4をAICore Developer Previewで発表",
    summary: "Googleは最新のオープンモデルGemma 4を発表。次世代Gemini Nanoの基盤となり、Gemma 4向けに書かれたコードは今後のGemini Nano 4搭載デバイスでそのまま動作します。",
    category: "model",
    url: "https://android-developers.googleblog.com/2026/04/AI-Core-Developer-Preview.html",
  },
  // March 2026
  {
    date: "2026-03-30",
    vendor: "Microsoft",
    vendorColor: "#00A4EF",
    title: "Copilot Cowork がFrontierで一般提供開始",
    summary: "長時間・複数ステップの作業を自動処理するCopilot Coworkが、Microsoft 365 Frontierプログラムで利用可能に。Outlook、Teams、Excelをまたいでタスクを完了します。",
    category: "product",
    url: "https://www.microsoft.com/en-us/microsoft-365/blog/2026/03/30/copilot-cowork-now-available-in-frontier/",
  },
  {
    date: "2026-03-24",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Message Batches APIのmax_tokensを300kに引き上げ",
    summary: "Claude Opus 4.6 / Sonnet 4.6向けに、Message Batches APIのmax_tokens上限を300kに拡大。output-300k-2026-03-24ベータヘッダーで利用可能です。",
    category: "api",
    url: "https://platform.claude.com/docs/en/release-notes/overview",
  },
  {
    date: "2026-03-24",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claude コンピュータ操作エージェント機能を発表",
    summary: "Anthropicは、Claudeがユーザーのコンピュータを操作してタスクを完了できるAIエージェント機能を発表。業務自動化の新たな段階に入りました。",
    category: "product",
    url: "https://www.cnbc.com/2026/03/24/anthropic-claude-ai-agent-use-computer-finish-tasks.html",
  },
  {
    date: "2026-03-17",
    vendor: "Microsoft",
    vendorColor: "#00A4EF",
    title: "Copilotリーダーシップ体制を刷新",
    summary: "Ryan Roslansky、Perry Clarke、Charles LamannaがM365アプリとCopilotプラットフォームを率いる新体制を発表。AI統合の加速を目指します。",
    category: "strategy",
    url: "https://blogs.microsoft.com/blog/2026/03/17/announcing-copilot-leadership-update/",
  },
  {
    date: "2026-03-10",
    vendor: "Google",
    vendorColor: "#4285F4",
    title: "Gemini がDocs、Sheets、Slides、Driveに統合拡大",
    summary: "Gmail、Chat、Driveの情報をもとに、フォーマット済みの文書・スライド・スプレッドシートの初稿を瞬時に生成。Workspace全体のAI機能が大幅強化されました。",
    category: "product",
    url: "https://blog.google/products-and-platforms/products/workspace/gemini-workspace-updates-march-2026/",
  },
  {
    date: "2026-03-09",
    vendor: "Microsoft",
    vendorColor: "#00A4EF",
    title: "Microsoft 365 E7: Frontier Suite を発表",
    summary: "5月1日GA予定（$99/ユーザー）。M365 E5、Copilot、Entra Suite、Agent 365を統合したエンタープライズ向けフロンティアスイートです。",
    category: "product",
    url: "https://blogs.microsoft.com/blog/2026/03/09/introducing-the-first-frontier-suite-built-on-intelligence-trust/",
  },
  {
    date: "2026-03",
    vendor: "Google",
    vendorColor: "#4285F4",
    title: "Gemini 3.1 Flash-Lite / Flash Live を発表",
    summary: "Flash-Liteは企業向けの高速・低コストモデル、Flash Liveはリアルタイム音声体験向け。Search LiveはGlobal 200カ国以上に展開されました。",
    category: "model",
    url: "https://blog.google/innovation-and-ai/technology/ai/google-ai-updates-march-2026/",
  },
  {
    date: "2026-03",
    vendor: "OpenAI",
    vendorColor: "#10A37F",
    title: "GPT-5.4 および mini / nano バリアントを発表",
    summary: "OpenAIはGPT-5.4を発表。mini版・nano版も同時リリースし、ChatGPT for Excelに新しい金融データ統合機能を追加しました。",
    category: "model",
    url: "https://openai.com/news/product-releases/",
  },
  {
    date: "2026-03",
    vendor: "OpenAI",
    vendorColor: "#10A37F",
    title: "米国政府へのAIサービス提供契約を締結",
    summary: "OpenAIは米国政府へのAIサービス供給契約を発表。エネルギー省との協力深化や、2026年を「科学の年」と位置づけた戦略的展開を進めています。",
    category: "strategy",
    url: "https://openai.com/index/us-department-of-energy-collaboration/",
  },
  // February 2026
  {
    date: "2026-02-05",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claude Opus 4.6 を発表 — 100万トークンコンテキスト",
    summary: "Anthropicが次世代フラッグシップモデルClaude Opus 4.6を発表。100万トークンのコンテキストウィンドウにより、企業文書ライブラリ全体を1セッションで処理可能に。",
    category: "model",
    url: "https://www.anthropic.com/news",
  },
  {
    date: "2026-02-05",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claude Sonnet 4.6 を発表",
    summary: "速度と知能を両立するバランスモデルSonnet 4.6をリリース。エージェント検索性能が向上し、トークン消費を抑えた効率的な推論を実現します。",
    category: "model",
    url: "https://www.anthropic.com/news",
  },
  {
    date: "2026-02-04",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claude は広告フリーを維持すると発表",
    summary: "Anthropicは、広告インセンティブは有用なAIアシスタントと相容れないとし、Claudeを広告フリーで維持する方針を表明しました。",
    category: "strategy",
    url: "https://www.anthropic.com/news",
  },
  {
    date: "2026-02",
    vendor: "OpenAI",
    vendorColor: "#10A37F",
    title: "AmazonとMicrosoftとの戦略的パートナーシップを発表",
    summary: "OpenAIはAmazonとの新たな戦略的パートナーシップおよびMicrosoftとの共同声明を発表。エンタープライズAI市場での協業体制を強化します。",
    category: "strategy",
    url: "https://openai.com/news/company-announcements/",
  },
  {
    date: "2026-02",
    vendor: "Microsoft",
    vendorColor: "#00A4EF",
    title: "Microsoft 365 Copilot Wave 3 — マルチモデル対応を発表",
    summary: "ClaudeやOpenAI次世代モデルを含むマルチモデル対応を発表。「Critique」機能で異なるモデルが回答をレビューし、「Council」機能でモデル間の回答比較が可能に。",
    category: "product",
    url: "https://techcommunity.microsoft.com/blog/microsoft365copilotblog/what%E2%80%99s-new-in-microsoft-365-copilot--february-2026/4496489",
  },
  // January 2026
  {
    date: "2026-01-22",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claudeの新しいConstitution（行動規範）を公開",
    summary: "Anthropicは、Claudeの価値観と行動に関する詳細なビジョンを記載した新しいConstitutionを公開。AI安全性の透明性向上に取り組んでいます。",
    category: "strategy",
    url: "https://www.anthropic.com/news/claude-new-constitution",
  },
  {
    date: "2026-01",
    vendor: "Anthropic",
    vendorColor: "#D4A574",
    title: "Claude Cowork をリサーチプレビューで公開",
    summary: "弁護士・金融アナリスト向けプラグインやClaude Code内のサイバーセキュリティツールを含むClaude Coworkをリサーチプレビューとして静かにローンチしました。",
    category: "product",
    url: "https://www.anthropic.com/news",
  },
  {
    date: "2026-01-05",
    vendor: "Google",
    vendorColor: "#4285F4",
    title: "CES 2026でテレビ向けGemini新機能をプレビュー",
    summary: "GoogleはCES 2026にて、テレビ向けのGemini AI新機能をプレビュー。リビングルーム体験のAI統合を推進します。",
    category: "product",
    url: "https://techcrunch.com/2026/01/05/google-previews-new-gemini-features-for-tv-at-ces-2026/",
  },
  {
    date: "2026-01",
    vendor: "OpenAI",
    vendorColor: "#10A37F",
    title: "音声ファーストのAI体験に大きく注力",
    summary: "OpenAIが音声中心のAI戦略を推進。シリコンバレーが「スクリーンレス」のインタラクションに向かう流れの中、音声AI体験への投資を拡大しています。",
    category: "strategy",
    url: "https://techcrunch.com/2026/01/01/openai-bets-big-on-audio-as-silicon-valley-declares-war-on-screens/",
  },
];

export default function AIAnnouncementsPage() {
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = announcements.filter((a) => {
    if (selectedVendor !== "all" && a.vendor !== selectedVendor) return false;
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    return true;
  });

  // Group by month
  const grouped: Record<string, Announcement[]> = {};
  for (const a of filtered) {
    const month = a.date.slice(0, 7); // "2026-03"
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(a);
  }
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    return `${y}年${parseInt(m)}月`;
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
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C" }}>最新AI動向</span>
          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>by HARMONIC insight</span>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0F2A44 0%, #1B3A5C 50%, #2A5580 100%)",
        color: "#fff",
        padding: "56px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 900, marginBottom: 12, letterSpacing: "-0.02em" }}>
          主要AIベンダー公式発表まとめ
        </h1>
        <p style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", opacity: 0.85, maxWidth: 640, margin: "0 auto", lineHeight: 1.8 }}>
          Anthropic・OpenAI・Google・Microsoftの公式発表を<br />
          いち早くキャッチアップ。ビジネスに影響する最新情報を網羅します。
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {vendors.slice(1).map((v) => (
            <span key={v.id} style={{
              fontSize: 13,
              padding: "6px 16px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 20,
              color: "#fff",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.25)",
            }}>{v.label}</span>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section style={{
        maxWidth: 1140,
        margin: "0 auto",
        padding: "24px 24px 0",
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginRight: 12 }}>ベンダー:</span>
            {vendors.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVendor(v.id)}
                style={{
                  fontSize: 13,
                  padding: "5px 14px",
                  marginRight: 8,
                  marginBottom: 4,
                  borderRadius: 20,
                  border: selectedVendor === v.id ? "none" : "1px solid #D1D5DB",
                  background: selectedVendor === v.id ? v.color : "#fff",
                  color: selectedVendor === v.id ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontWeight: selectedVendor === v.id ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginRight: 12 }}>カテゴリ:</span>
            {categories.map((c) => (
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
        </div>

        {/* Result count */}
        <div style={{ marginTop: 16, fontSize: 13, color: "#6B7280" }}>
          {filtered.length} 件の発表
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
                      borderLeft: `4px solid ${a.vendorColor}`,
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
                        background: a.vendorColor,
                        borderRadius: 20,
                        color: "#fff",
                        fontWeight: 600,
                      }}>{a.vendor}</span>
                      <span style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        background: "#EDF1F5",
                        borderRadius: 20,
                        color: "#1B3A5C",
                        fontWeight: 500,
                      }}>{categories.find((c) => c.id === a.category)?.label}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{a.date}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#1C1917", lineHeight: 1.5 }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.8, margin: 0 }}>
                      {a.summary}
                    </p>
                    <span style={{ fontSize: 12, color: "#2E86AB", fontWeight: 600, marginTop: 8, display: "inline-block" }}>
                      公式発表を見る →
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
            <p style={{ fontSize: 16 }}>該当する発表が見つかりません。フィルターを変更してください。</p>
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
          最新AI動向をビジネスに活かしませんか？
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.8 }}>
          HARMONIC insightは、最新AIの技術動向を踏まえた<br />
          業務自動化・DX推進をご支援します。
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
