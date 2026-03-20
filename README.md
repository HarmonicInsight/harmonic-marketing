# HARMONIC Marketing

HARMONIC insight のマーケティングツール・コンテンツ管理リポジトリ。

## 構成

```
harmonic-marketing/
├── tools/
│   └── social-poster/    # SNS 自動投稿ツール（Twitter/X + note.com）
├── content/
│   ├── articles/         # note.com 記事ストック
│   ├── tweets/           # ツイートテンプレート・過去投稿
│   └── know-how/         # マーケティングノウハウ
└── assets/               # 画像・バナー素材
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
