// =============================================================================
// PPTX アップロード時の自動コンテンツ生成
// スライドテキストを抽出 → 台本・note記事・Twitter文・サムネプロンプトを生成
// =============================================================================

import AdmZip from 'adm-zip';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const CONTENT_ROOT = join(import.meta.dirname, '..', '..', '..', 'content');
const YOUTUBE_DIR = join(CONTENT_ROOT, 'youtube');

// =============================================================================
// PPTX テキスト抽出
// =============================================================================

export function extractPptxText(filePath: string): { slides: string[]; fullText: string } {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const slideEntries = entries
    .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  const slides: string[] = [];

  for (const entry of slideEntries) {
    const xml = entry.getData().toString('utf-8');
    // Extract text from <a:t> tags
    const texts: string[] = [];
    const regex = /<a:t[^>]*>([^<]+)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const text = match[1].trim();
      if (text) texts.push(text);
    }
    slides.push(texts.join(' '));
  }

  return {
    slides,
    fullText: slides.join('\n\n'),
  };
}

// =============================================================================
// 自動コンテンツ生成
// =============================================================================

export interface AutoGenerateResult {
  videoId: string;
  script: string;
  article: string;
  twitterText: string;
  thumbnailPrompt: string;
  slideCount: number;
}

export function autoGenerate(
  videoId: string,
  title: string,
  pptxPath: string,
  tags: string[] = [],
): AutoGenerateResult {
  const { slides, fullText } = extractPptxText(pptxPath);
  const slideCount = slides.length;

  // --- 台本生成 ---
  const scriptLines = slides.map((text, i) => {
    return `### スライド ${i + 1}\n\n${text}\n\n**ナレーション:**\n（このスライドの説明を記述）\n`;
  });

  const script = `# ${title} — 動画台本

動画ID: ${videoId}
スライド数: ${slideCount}枚
タグ: ${tags.join(', ')}

---

${scriptLines.join('\n---\n\n')}

---

## エンディング

チャンネル登録・高評価よろしくお願いします。
HARMONIC insight: https://www.insight-office.com/ja
`;

  // --- note記事生成 ---
  // スライドテキストからセクションを抽出
  const sections = slides
    .filter(s => s.length > 10)
    .slice(1, -1) // 最初（タイトル）と最後（エンディング）を除く
    .map((text, i) => `## ${i + 1}. ${text.split(' ').slice(0, 6).join(' ')}\n\n${text}\n`);

  const article = `# ${title}

タグ: ${tags.join(', ')}

---

## はじめに

この記事では「${title}」について解説します。

${sections.join('\n')}

## まとめ

${slides[slides.length - 1] || ''}

---

**動画で詳しく見る**
この記事の内容はYouTube動画で図解つきで詳しく解説しています。

HARMONIC insight
https://www.insight-office.com/ja
`;

  // --- Twitter文生成 ---
  const keyPoints = slides
    .filter(s => s.length > 5)
    .slice(0, 3)
    .map(s => s.split(' ').slice(0, 8).join(' '));

  const hashTags = tags.slice(0, 3).map(t => `#${t}`).join(' ');
  const twitterText = `${title.slice(0, 60)}

${keyPoints[0] || ''}

${hashTags} #HARMONICinsight`;

  // --- サムネイルプロンプト ---
  const thumbnailPrompt = `YouTube thumbnail for "${title}".
Style: Professional, clean, Japanese business context.
Colors: Gold (#B8942F) accent on dark background.
Text overlay: "${title.slice(0, 20)}" in bold Japanese.
Elements: ${tags.slice(0, 3).join(', ')} related icons/illustrations.
Aspect ratio: 16:9, 1280x720px.`;

  return {
    videoId,
    script,
    article,
    twitterText,
    thumbnailPrompt,
    slideCount,
  };
}

// =============================================================================
// ファイル保存
// =============================================================================

export function saveGeneratedContent(result: AutoGenerateResult, catalogPath: string): void {
  const scriptsDir = join(YOUTUBE_DIR, 'scripts');
  const articlesDir = join(CONTENT_ROOT, 'note', 'articles');
  const assetsDir = join(YOUTUBE_DIR, 'assets', result.videoId);

  if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
  if (!existsSync(articlesDir)) mkdirSync(articlesDir, { recursive: true });
  if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

  // Save script
  const scriptFile = `${result.videoId}_script.md`;
  writeFileSync(join(scriptsDir, scriptFile), result.script, 'utf-8');

  // Save article
  const articleFile = `${result.videoId.toLowerCase()}_article.md`;
  writeFileSync(join(articlesDir, articleFile), result.article, 'utf-8');

  // Update catalog
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  const video = catalog.videos.find((v: any) => v.id === result.videoId);
  if (video) {
    video.script = `scripts/${scriptFile}`;
    video.note_article = `note/articles/${articleFile}`;
    video.thumbnail_prompt = result.thumbnailPrompt;
    if (!video.twitter_posts) video.twitter_posts = [];
    // Save twitter text as draft in a file
    const twitterFile = join(assetsDir, 'twitter_draft.txt');
    writeFileSync(twitterFile, result.twitterText, 'utf-8');
    video.memo = (video.memo || '') + ` | 自動生成済(${result.slideCount}枚)`;
  }
  catalog._meta.last_updated = new Date().toISOString().slice(0, 10);
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
}
