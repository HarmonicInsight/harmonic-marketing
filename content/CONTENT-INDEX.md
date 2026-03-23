# コンテンツ管理インデックス

すべてのマーケティングコンテンツの状態を一元管理します。

---

## note.com 記事

| # | ファイル | タイトル | シリーズ | ステータス | 公開日 |
|---|---------|---------|---------|-----------|--------|
| 1 | `note/articles/sipo-backoffice-reform-construction.md` | 建設業・ハウジング業のバックオフィスが重い本当の理由 | コンサル論 | draft | - |
| 2 | `note/articles/construction-reconciliation-dx.md` | 建設業の「消し込み」が回らない本当の理由 — DXの前に整えるべき3つのこと | コンサル論 | draft | - |

## YouTube 動画

**YouTube動画は `youtube/catalog.json` で管理しています。**
数百本規模のため、JSON形式のデータベースで一元管理。

```bash
# 一覧表示
./tools/video-manager/manage.sh list
./tools/video-manager/manage.sh list --status published
./tools/video-manager/manage.sh list --type short

# 統計
./tools/video-manager/manage.sh stats

# 検索
./tools/video-manager/manage.sh search "SIPO"

# エクスポート（Markdown/CSV）
./tools/video-manager/manage.sh export --format md
```

## Twitter/X

| # | ファイル | テーマ | 形式 | ステータス | 投稿日 |
|---|---------|--------|------|-----------|--------|
| - | - | - | - | - | - |

## セミナー

| # | ファイル | タイトル | ステータス | 開催日 |
|---|---------|---------|-----------|--------|
| - | - | - | - | - |

---

## ステータス定義

| ステータス | 意味 |
|-----------|------|
| `idea` | アイデア段階。タイトルやテーマのみ |
| `draft` | 下書き作成中 |
| `review` | レビュー待ち |
| `ready` | 公開準備完了 |
| `published` | 公開済み |
| `archived` | アーカイブ（非公開化・差し替え済み） |

## シリーズ分類

| シリーズ名 | 対象チャネル | 説明 |
|-----------|-------------|------|
| 製品紹介 | note, YouTube | HARMONIC insight 各製品の機能紹介・デモ |
| DXの誤解 | note, YouTube, Twitter | 「DX＝システム導入」等の誤解を解くコンテンツ |
| AI実務活用 | note, YouTube | AI議事録・検索・要約の実務での使い方 |
| 動画化実務 | note, YouTube | Training Studio（INMV）の活用法 |
| コンサル論 | note, YouTube | SIPO、4層モデル等の業務改革フレームワーク |
| ニュース速報分析 | YouTube Shorts, YouTube, note, Twitter | ニュース発表日を起点に独自分析・アンチテーゼを提供 |
| ツール紹介 | Twitter, note | HARMONIC tools 個別ツールの紹介 |
