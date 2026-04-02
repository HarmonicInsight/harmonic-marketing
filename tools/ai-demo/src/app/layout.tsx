import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI業務自動化デモ | HARMONIC insight",
  description: "建設・不動産・製造業向け AI業務自動化デモ。見積書チェック、日報自動生成など、業務効率化AIの体験ができます。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#1C1917",
        background: "#F7F9FB",
        lineHeight: 1.8,
        WebkitFontSmoothing: "antialiased",
      }}>
        {children}
      </body>
    </html>
  );
}
