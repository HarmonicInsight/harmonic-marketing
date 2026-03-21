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
│   │   ├── catalog.json          # 全動画カタログ（本編+ショート）
│   │   ├── catalog-schema.json   # カタログのJSONスキーマ
│   │   ├── scripts/              # 本編スクリプト（VID-XXX_slug.md）
│   │   ├── shorts/               # ショートスクリプト（VID-XXXX_slug.md）
│   │   ├── slides/               # スライド素材（PPTX）
│   │   └── thumbnails/           # サムネイル素材
│   ├── twitter/
│   │   ├── templates/            # ツイートテンプレート
│   │   └── threads/              # スレッド形式の投稿
│   ├── seminars/                 # セミナー・ウェビナー資料
│   ├── templates/                # コンテンツ作成テンプレート
│   └── strategy/                 # マーケティング戦略・ノウハウ
├── tools/
│   ├── social-poster/            # SNS 自動投稿ツール（Twitter/X + note.com）
│   └── video-manager/            # YouTube動画カタログ管理CLI
└── assets/                       # 画像・バナー素材
```

## コンテンツ管理

- **CONTENT-INDEX.md** でnote/Twitter/セミナーの一覧とステータスを管理
- **YouTube動画**は `catalog.json` + CLIで管理（数百本規模対応）
- チャネル別にフォルダを分離（note / youtube / twitter / seminars）
- テンプレートは `templates/` に集約
- 戦略ドキュメントは `strategy/` に集約

## Video Manager

YouTube動画カタログ（本編+ショート）をCLIで管理するツール。

```bash
# 動画を追加
./tools/video-manager/manage.sh add --title "AI議事録の限界" --series ai-practical --product IAOF

# ショート動画を追加（親動画に紐付け）
./tools/video-manager/manage.sh add --title "議事録は作って終わりじゃない" --type short --parent VID-001

# 一覧・フィルタ
./tools/video-manager/manage.sh list
./tools/video-manager/manage.sh list --status published --type main
./tools/video-manager/manage.sh list --series consulting

# ステータス変更
./tools/video-manager/manage.sh status VID-001 published

# 統計・検索
./tools/video-manager/manage.sh stats
./tools/video-manager/manage.sh search "SIPO"

# note連携ステータス更新
./tools/video-manager/manage.sh note VID-001 --status 済 --url https://note.com/xxx

# エクスポート
./tools/video-manager/manage.sh export --format csv
./tools/video-manager/manage.sh export --format md
```

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
