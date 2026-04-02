# AI Image Generator — ブラウザ自動化ツール

ChatGPT / Gemini のブラウザUIを Playwright で自動操作し、画像生成プロンプトを投げて結果をダウンロードするツール。

## セットアップ

```bash
pip install playwright requests
playwright install chromium
```

## 使い方

### 1. 初回ログイン（必須）

ブラウザが開くので、手動でログインしてください。ログイン状態は `.browser-data/` に保存されます。

```bash
# ChatGPTにログイン
python generate.py --login chatgpt

# Geminiにログイン
python generate.py --login gemini
```

### 2. 画像生成（単発）

```bash
# ChatGPT (DALL-E / GPT-4o)
python generate.py -p chatgpt -t "富士山の水彩画、朝焼け"

# Gemini
python generate.py -p gemini -t "サイバーパンクな東京の夜景"

# 出力先を指定
python generate.py -p chatgpt -t "猫のイラスト" -o ./my-images
```

### 3. バッチ処理（複数プロンプト一括）

```bash
python generate.py --batch prompts_example.json
```

`prompts_example.json` のフォーマット:

```json
{
  "prompts": [
    {
      "provider": "chatgpt",
      "prompt": "画像の説明",
      "wait": 15
    },
    {
      "provider": "gemini",
      "prompt": "画像の説明",
      "wait": 15
    }
  ]
}
```

### シェルスクリプト版

```bash
./run.sh login chatgpt
./run.sh chatgpt "富士山の水彩画"
./run.sh batch prompts_example.json
```

## オプション

| フラグ | 説明 |
|--------|------|
| `--provider`, `-p` | `chatgpt` or `gemini` (default: chatgpt) |
| `--prompt`, `-t` | 画像生成プロンプト |
| `--batch`, `-b` | バッチ処理用JSONファイル |
| `--output`, `-o` | 出力ディレクトリ (default: `./output`) |
| `--login`, `-l` | ログインモード |
| `--headless` | ヘッドレスモード（ブラウザ非表示） |
| `--debug` | デバッグモード |

## 仕組み

1. **永続ブラウザコンテキスト**: `.browser-data/` にCookieやセッション情報を保存し、ログイン状態を維持
2. **プロンプト投入**: Playwrightで入力欄にプロンプトをタイプし送信
3. **画像検出**: 生成された画像のDOM要素を監視（最大3分待機）
4. **ダウンロード**: 画像URLから直接取得。blob URLやdata URIにも対応。取得できない場合はスクリーンショットでフォールバック

## 注意事項

- ChatGPT/GeminiのUIは頻繁に変更されるため、セレクタの更新が必要になることがあります
- レート制限を避けるため、バッチ処理では `wait` パラメータで間隔を空けてください
- ヘッドレスモードはCAPTCHA検出で失敗する場合があります。その場合はヘッドレスをOFFにしてください
