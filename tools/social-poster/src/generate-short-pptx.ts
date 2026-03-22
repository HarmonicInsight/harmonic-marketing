// ショート動画用 縦PPTX（9:16）生成スクリプト
import PptxGenJSModule from 'pptxgenjs';
const PptxGenJS = (PptxGenJSModule as any).default || PptxGenJSModule;
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SLIDES_DIR = join(__dirname, '..', '..', '..', 'content', 'youtube', 'shorts');

const GOLD = 'B8942F';
const DARK = '1C1917';
const IVORY = 'FAF8F5';
const WHITE = 'FFFFFF';
const GRAY = '57534E';

interface ShortSlide {
  text: string;
  sub?: string;
  bullets?: string[];
  big?: boolean;
}

interface ShortDef {
  id: string;
  filename: string;
  slides: ShortSlide[];
}

function createShortPptx(def: ShortDef): void {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'SHORT', width: 4.5, height: 8 }); // 9:16
  pptx.layout = 'SHORT';

  for (const [i, s] of def.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: DARK };

    // Main text
    const fontSize = s.big ? 28 : (i === 0 ? 24 : 20);
    slide.addText(s.text, {
      x: 0.3, y: s.sub || s.bullets ? 1.5 : 2.5, w: 3.9, h: 2.5,
      fontSize, fontFace: 'Hiragino Sans', color: WHITE,
      bold: true, align: 'left', valign: 'middle',
      lineSpacingMultiple: 1.3,
    });

    // Bullets
    if (s.bullets) {
      const bulletText = s.bullets.map(b => ({ text: b, options: { fontSize: 14, color: IVORY, bullet: { code: '2022' }, lineSpacingMultiple: 1.5 } }));
      slide.addText(bulletText, {
        x: 0.3, y: 4.0, w: 3.9, h: 2.5,
        fontFace: 'Hiragino Sans', valign: 'top',
      });
    }

    // Sub text
    if (s.sub) {
      slide.addText(s.sub, {
        x: 0.3, y: s.bullets ? 6.2 : 4.5, w: 3.9, h: 1.0,
        fontSize: 12, fontFace: 'Hiragino Sans', color: GRAY,
        align: 'left', valign: 'top',
      });
    }

    // Gold accent line at top
    slide.addShape('rect' as any, { x: 0, y: 0, w: 4.5, h: 0.06, fill: { color: GOLD } });

    // Footer
    slide.addText('HARMONIC insight', {
      x: 0.3, y: 7.3, w: 3.9, h: 0.4,
      fontSize: 9, fontFace: 'Hiragino Sans', color: GOLD,
      align: 'right',
    });
  }

  const outPath = join(SLIDES_DIR, def.filename);
  pptx.writeFile({ fileName: outPath }).then(() => {
    console.log(`Created: ${def.filename} (${def.slides.length} slides)`);
  });
}

// =============================================
// 6本のショート定義
// =============================================

const shorts: ShortDef[] = [
  {
    id: 'SHORT_VID-004',
    filename: 'SHORT_VID-004_yarinaosu.pptx',
    slides: [
      { text: '資料作成、\n15分→1分に\nしました', sub: 'コンサルチームで1ヶ月の実験' },
      { text: '3時間かけた資料を\n「捨てられますか？」', sub: 'ほとんどの人は「修正で何とかしよう」とする' },
      { text: '実験結果', bullets: ['1日目 → 15分', '1週間後 → 5分', '1ヶ月後 → 1〜2分'] },
      { text: '本当に変わったのは\n速さじゃない', sub: '「間違えても捨てられる」ようになったこと', big: true },
      { text: 'やり直しのコストが\nゼロなら、\n常にベストが出せる', sub: 'やり直せる力は、地味で退屈で最強' },
      { text: '詳しくはnoteで', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_VID-005',
    filename: 'SHORT_VID-005_ai_zokuningei.pptx',
    slides: [
      { text: 'ChatGPT導入して\n3ヶ月後の現実', sub: '多くの企業で起きていること' },
      { text: '', bullets: ['「一部の詳しい人しか使っていない」', '「結局、前と同じやり方に戻った」'], sub: '' },
      { text: '原因はツールじゃない', sub: 'Aさんのプロンプトと\nBさんのプロンプトで結果が違う' },
      { text: 'AIは便利。\nでも再現性が\nなければ、\nただの属人芸。', big: true },
      { text: 'IPOを定義する\nだけで変わる', bullets: ['Input → Process → Output', '誰がやっても同じ結果が出る仕組み'] },
      { text: '詳しくはnoteで', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_VID-010',
    filename: 'SHORT_VID-010_dandori.pptx',
    slides: [
      { text: '「資料が\n分かりづらい」\nと言われる人へ', sub: '原因はデザインじゃない' },
      { text: 'いきなり\nPowerPointを\n開いていませんか？', sub: 'これが3時間かけて構成が間違う原因' },
      { text: '段取り八分', bullets: ['① 目的を考える', '② メッセージを作る', '③ ストーリーを作る', '④ Quick & Dirty'] },
      { text: '相手の階層で\n資料を変えて\nいますか？', sub: '経営層は「どうなる？」\n現場は「どうやる？」' },
      { text: '「さすが」と\n言われる資料は、\n才能ではなく\n設計で作れる', big: true },
      { text: '詳しくはnoteで', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_SIPO_01',
    filename: 'SHORT_SIPO_01_dx_tomaranai.pptx',
    slides: [
      { text: '建設業でDXが\n進まない理由、\nわかりますか？', sub: '' },
      { text: 'AIやシステムの\n性能の問題だと\n思っていませんか？', sub: '何社も見てきましたが\n原因はそこじゃありません' },
      { text: '問題は、\n情報がバラバラ\nなこと', bullets: ['図面', '口頭・電話', 'LINE・メール', '写真・Excel'] },
      { text: '情報源が散らばっている', sub: 'だからInputがそろわない\nInputがそろわないから自動化もできない' },
      { text: '建設業で\n最初に見るべきは\nAIの性能ではなく\n情報の出どころ', big: true },
      { text: '次回：\nIPOでは足りない。\nSIPOで見ろ', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_SIPO_02',
    filename: 'SHORT_SIPO_02_sipo_miro.pptx',
    slides: [
      { text: '業務分析で、\nいきなりInputを\n見ていませんか？', sub: '' },
      { text: '従来の業務分析', bullets: ['Input（入力）', 'Process（処理）', 'Output（成果物）'], sub: 'これで十分だと思っていませんか？' },
      { text: 'そのInputは\nどこから来た？', bullets: ['誰が出した？', '図面？会議？メール？口頭？', 'どれが最新版？'] },
      { text: 'Inputの前に\nSourceがある', bullets: ['S（Source）情報源', 'I（Input）入力', 'P（Process）処理', 'O（Output）成果物'] },
      { text: 'これからは\nIPOではなく\nSIPO', big: true },
      { text: '次回：\nAI時代の業務分析は\nSが8割', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_SIPO_03',
    filename: 'SHORT_SIPO_03_s_ga_8wari.pptx',
    slides: [
      { text: 'AI時代の業務分析、\nどこに一番\n時間をかけるべきか？', sub: '' },
      { text: '昔はProcess分析に\n時間をかけていた', sub: '処理手順を細かく人が分解していた' },
      { text: 'でも今は違う', bullets: ['Sourceが明確 → Inputが明確', 'Input + Outputが決まれば', 'ProcessはAIが作れる'] },
      { text: 'AI時代の\n業務分析は、\nSが8割', big: true },
      { text: '建設業の場合', bullets: ['設計変更 → 元情報は会議？メール？', '工程変更 → 施主要望？天候？', '報告書 → 写真、口頭、日報に分散'] },
      { text: 'Sourceが決まれば\n業務は見える', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
];

// 全部生成
for (const s of shorts) {
  createShortPptx(s);
}

// =============================================
// LLM/RAGシリーズ 3本追加
// =============================================

const llmShorts: ShortDef[] = [
  {
    id: 'SHORT_LLM_01',
    filename: 'SHORT_LLM_01_rakuten.pptx',
    slides: [
      { text: '楽天AI 3.0、\n日本語性能トップ。\nで、業務で使えるの？' },
      { text: '確かにすごい', bullets: ['日本語MT-Bench 8.88（GPT-4o超え）', '700Bパラメータ（MoE）', 'Apache 2.0（商用利用可能）'] },
      { text: 'でも、APIがない', bullets: ['公開APIなし（2026年3月）', '使うにはセルフホスト', '700B MoEのGPU代は？'] },
      { text: '一方、Claude Sonnetは', bullets: ['API即使用可能', '$3.00/100万トークン', '1Mコンテキスト', '今すぐ業務に入る'] },
      { text: '性能が高い\n≠\n業務で使える', sub: '必要なのはベンチマークではなく\n明日から使えるかどうか', big: true },
      { text: '次回：\nRAGを入れた会社の本音', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_LLM_02',
    filename: 'SHORT_LLM_02_rag_honne.pptx',
    slides: [
      { text: 'RAGを導入した\n会社に聞いてみた' },
      { text: '期待していたこと', bullets: ['社内文書をAIが検索', '質問すれば的確な答え', 'ナレッジが全社共有'] },
      { text: '実際に起きたこと', bullets: ['検索精度が低い', '回答が的外れ', '結局、人が確認', '「Google検索の方がマシ」'] },
      { text: 'なぜRAGは\n期待を裏切るのか', sub: '元データが整理されていないから\nゴミを入れればゴミが出る' },
      { text: 'RAGの問題は\nAIではない。\nデータの問題。', sub: '検索だけでは業務は変わらない', big: true },
      { text: '次回：\n日本語LLM開発に\n意味はあるか', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_LLM_03',
    filename: 'SHORT_LLM_03_nihongo_imi.pptx',
    slides: [
      { text: '日本語LLMを\n開発する意味は\nあるのか？' },
      { text: '日本企業がLLMを作っている', bullets: ['楽天 700B（APIなし）', 'PLaMo 31B（政府採用）', 'tsuzumi 7B（NTT）', 'ELYZA 32B（KDDI）'] },
      { text: 'グローバルLLMの日本語は\nもう十分に使える', bullets: ['Claude：文化ニュアンス対応済', 'GPT：1.1Mコンテキスト', 'Gemini：$0.10/100万トークン'] },
      { text: 'コスト差は最大50倍', bullets: ['Gemini Flash-Lite: $0.10', '国産セルフホスト: GPU月額数百万円'], sub: '同じ仕事をするのにこの差' },
      { text: '必要なのは\n「日本語モデル」\nではなく\n「業務設計」', sub: 'どのLLMかより\n何をInputに何をOutputにするかが100倍重要', big: true },
      { text: '業務設計 →\nSIPOフレームワーク', sub: 'この動画はPowerPointからInsight Training Studioで自動生成しています\nHARMONIC insight' },
    ],
  },
];

for (const s of llmShorts) {
  createShortPptx(s);
}
