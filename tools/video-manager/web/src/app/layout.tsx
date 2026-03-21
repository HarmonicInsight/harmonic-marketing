import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Manager - HARMONIC",
  description: "YouTube動画カタログ管理ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: "#f5f5f5", color: "#1a1a1a" }}>
        {children}
      </body>
    </html>
  );
}
