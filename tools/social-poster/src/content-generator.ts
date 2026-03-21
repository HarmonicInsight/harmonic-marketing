// =============================================================================
// Claude API によるコンテンツ生成
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';
import { TWITTER_TEMPLATES, NOTE_TEMPLATES } from './templates.js';
import type {
  GenerateRequest,
  GeneratedContent,
  TwitterPost,
  NotePost,
  ContentType,
  Platform,
} from './types.js';

let anthropic: Anthropic | null = null;

export function getGeneratorClient(): Anthropic {
  return getClient();
}

function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return anthropic;
}

/**
 * HARMONIC insight 製品情報（プロンプトに含めるコンテキスト）
 */
const PRODUCT_CONTEXT = `
HARMONIC insight は B2B 専業のソフトウェア企業。日本市場をメインターゲットとし、
AI 搭載の業務効率化ツール群「Insight Business Suite」を展開。

主要製品:
- IAOF (Insight AI Office): AI + Office 編集の統合プラットフォーム。フリーミアム。
- INSS (Insight Deck Quality Gate): PPTX 品質管理・比較・AI アシスタント搭載
- IOSH (Insight Performance Management): 経営数値管理・Excel AI 分析
- IOSD (Insight AI Doc Factory): 文書変換・加工・量産エンジン
- INBT (InsightBot): AI エディタ搭載 RPA + Orchestrator
- INMV (Insight Training Studio): PPTX → 動画変換
- INAG (InsightAgent): AI プライベートエージェント（B2C あり: Personal ¥9,800/年）
- INCA (InsightNoCodeAnalyzer): RPA マイグレーション自動化
- INPY (InsightPy): Python 実行基盤

技術的特徴:
- 全 AI 機能は Claude (Anthropic) API を使用（OpenAI/GPT は不使用）
- BYOK（Bring Your Own Key）方式 — クライアントが自社 API キーを使用
- PII 匿名化エンジン搭載
- オフライン動作（クラウド不要）

価格体系:
- FREE → BIZ ¥49,800/端末・年 → ENT 個別見積もり
- INAG/INMV は B2C 個人向けあり（Personal ¥9,800/年 / ¥980/月）

ブランドカラー: Gold (#B8942F) + Ivory (#FAF8F5)
`.trim();

/**
 * Twitter 投稿を生成
 */
async function generateTwitterPost(
  request: GenerateRequest,
): Promise<TwitterPost> {
  const template = TWITTER_TEMPLATES[request.contentType];
  const client = getClient();

  const prompt = `
あなたは HARMONIC insight のソーシャルメディアマネージャーです。
Twitter/X 向けの投稿を作成してください。

## 製品情報
${PRODUCT_CONTEXT}

## 投稿ルール
- 日本語で記述
- メイン投稿は 140 文字以内（日本語の場合）
- ハッシュタグは 2〜3 個（文字数に含む）
- 絵文字は控えめに（0〜2 個）
- トーン: ${request.tone === 'professional' ? 'プロフェッショナル（丁寧語）' : request.tone === 'casual' ? 'カジュアル（です・ます）' : request.tone === 'technical' ? '技術的（開発者向け）' : 'ストーリーテリング'}
- CTA（行動喚起）を含める
- 宣伝臭くなりすぎない。価値提供を先に。
${request.productCodes?.length ? `- 対象製品: ${request.productCodes.join(', ')}` : ''}
${request.topic ? `- トピック: ${request.topic}` : ''}
${request.context ? `- 追加コンテキスト: ${request.context}` : ''}

## テンプレート参考
${template.examplesJa.map((e, i) => `例${i + 1}: ${e}`).join('\n')}

## 出力形式
JSON で出力してください:
{
  "text": "メイン投稿テキスト",
  "thread": ["スレッド1", "スレッド2"]  // 必要な場合のみ。不要なら空配列。
}

スレッドは、メイン投稿の補足情報として 1〜2 件まで。
スレッドでは詳細情報・リンク・追加ハッシュタグを含めてよい。
`.trim();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Claude のレスポンスから JSON を抽出できませんでした');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { text: string; thread?: string[] };
  return {
    text: parsed.text,
    thread: parsed.thread?.length ? parsed.thread : undefined,
  };
}

/**
 * note.com 記事を生成
 */
async function generateNotePost(
  request: GenerateRequest,
): Promise<NotePost> {
  const template = NOTE_TEMPLATES[request.contentType];
  const client = getClient();

  const prompt = `
あなたは HARMONIC insight のコンテンツマーケターです。
note.com 向けの記事を作成してください。

## 製品情報
${PRODUCT_CONTEXT}

## 記事ルール
- 日本語で記述
- タイトルは 30 文字前後（note.com で映えるタイトル）
- 本文は Markdown 形式、1500〜3000 文字程度
- 見出し（##）を 3〜5 個使用
- 読みやすい段落分け
- トーン: ${request.tone === 'professional' ? 'プロフェッショナル' : request.tone === 'casual' ? 'カジュアル・親しみやすい' : request.tone === 'technical' ? '技術的・エンジニア向け' : 'ストーリーテリング・体験談風'}
- 宣伝ではなく価値提供。読者が「読んでよかった」と思える内容
- 最後に CTA（製品紹介は自然に）
${request.productCodes?.length ? `- 対象製品: ${request.productCodes.join(', ')}` : ''}
${request.topic ? `- トピック: ${request.topic}` : ''}
${request.context ? `- 追加コンテキスト: ${request.context}` : ''}

## テンプレート参考
テーマ: ${template.themesJa.join('、')}
構成: ${template.structureJa.join(' → ')}

## 出力形式
JSON で出力してください:
{
  "title": "記事タイトル",
  "body": "Markdown 本文",
  "tags": ["タグ1", "タグ2", "タグ3"]
}

タグは 3〜5 個。note.com で検索されやすいタグを選んでください。
`.trim();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Claude のレスポンスから JSON を抽出できませんでした');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    title: string;
    body: string;
    tags: string[];
  };

  return {
    title: parsed.title,
    body: parsed.body,
    category: template.defaultCategory,
    tags: parsed.tags.slice(0, 5),
    publishStatus: 'draft', // デフォルトは下書き
  };
}

/**
 * コンテンツを生成する（メインエントリポイント）
 */
export async function generateContent(
  request: GenerateRequest,
): Promise<GeneratedContent> {
  const result: GeneratedContent = {
    generatedAt: new Date().toISOString(),
    prompt: `${request.contentType} / ${request.tone} / ${request.productCodes?.join(',') ?? 'all'}`,
  };

  const platforms: ('twitter' | 'note')[] =
    request.platform === 'all' ? ['twitter', 'note'] : [request.platform as 'twitter' | 'note'];

  for (const platform of platforms) {
    if (platform === 'twitter') {
      console.log('  Twitter 投稿を生成中...');
      result.twitter = await generateTwitterPost(request);
    } else {
      console.log('  note.com 記事を生成中...');
      result.note = await generateNotePost(request);
    }
  }

  return result;
}
