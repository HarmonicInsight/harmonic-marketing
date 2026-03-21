# HARMONIC Marketing

HARMONIC insight のマーケティングツール・コンテンツ管理リポジトリ。

## 構成

```
harmonic-marketing/
├── content/
│   ├── CONTENT-INDEX.md          # コンテンツ一覧・ステータス管理
│   ├── note/
│   │   ├── articles/             # note.com 単発記事
│   │   └── series/               # note.com シリーズ記事（動画紹介等）
│   ├── youtube/
│   │   ├── scripts/              # 動画スクリプト・スライド構成
│   │   └── thumbnails/           # サムネイル素材
│   ├── twitter/
│   │   ├── templates/            # ツイートテンプレート
│   │   └── threads/              # スレッド形式の投稿
│   ├── seminars/                 # セミナー・ウェビナー資料
│   ├── templates/                # コンテンツ作成テンプレート
│   └── strategy/                 # マーケティング戦略・ノウハウ
├── tools/
│   └── social-poster/            # SNS 自動投稿ツール（Twitter/X + note.com）
└── assets/                       # 画像・バナー素材
```

## コンテンツ管理

- **CONTENT-INDEX.md** でコンテンツの一覧とステータスを管理
- ステータス: `idea` → `draft` → `review` → `ready` → `published`
- チャネル別にフォルダを分離（note / youtube / twitter / seminars）
- テンプレートは `templates/` に集約
- 戦略ドキュメントは `strategy/` に集約

## Social Poster

AI（Claude）でコンテンツを生成し、Twitter/X と note.com に投稿するツール。

### セットアップ

```bash
cd tools/social-poster
npm install
cp .env.example .env
# .env に API キーを設定
```

### 使い方

```bash
# Web ダッシュボード（GUI）
npm run dashboard
# → http://localhost:3847

# CLI
npm run post              # 対話的に生成・投稿
npm run post:twitter      # Twitter のみ
npm run post:note         # note.com のみ
npm run generate          # 生成のみ（投稿しない）
```

### ダッシュボード機能

- 今日の投稿数・レートリミット表示
- AI コンテンツ生成（種別・トーン・製品・トピック選択）
- リアルタイムジョブモニター
- プレビュー＆インライン編集
- 投稿履歴
- Twitter / note.com 接続テスト
