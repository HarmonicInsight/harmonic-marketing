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
      { text: 'やり直せる力は、\n地味で退屈で最強。', sub: 'HARMONIC insight' },
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
      { text: '仕組みで動かせ。\n属人芸で終わるな。', sub: 'HARMONIC insight' },
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
      { text: '才能じゃない。\n設計で作れ。', sub: 'HARMONIC insight' },
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
      { text: 'Inputの前に、\nSourceを押さえろ。', sub: 'HARMONIC insight' },
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
      { text: 'Sourceが決まれば、\n業務は見える。', sub: 'HARMONIC insight' },
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
      { text: '「楽天AIすごい！」\nって言ってる人、\n使ったことある？', sub: '日本語ベンチ1位のニュースが流れたけど…' },
      { text: 'ベンチマーク1位。\nで、あなたの業務に\n入りますか？', sub: 'APIがない。サーバー自前。GPU月額数百万円。' },
      { text: '「すごいAI」と\n「使えるAI」は\n全く別の話', big: true },
      { text: 'フェラーリが\n最速でも、\n通勤には乗れない', sub: '業務に必要なのは「今日から動く」こと' },
      { text: 'ベンチマークで\nAIを選ぶ会社は、\nカタログスペックで\n車を買う人と同じ', big: true },
      { text: 'AIを選ぶ前に、\n業務を設計しろ', sub: 'HARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_LLM_02',
    filename: 'SHORT_LLM_02_rag_honne.pptx',
    slides: [
      { text: 'RAG導入して\n半年後、\n誰も使ってない', sub: 'これ、あなたの会社でも起きてませんか？' },
      { text: '導入前：\n「社内の知識が\n一瞬で見つかる！」', sub: '経営会議で拍手が起きた' },
      { text: '半年後：\n「Google検索の方が\nマシだった」', sub: '現場の本音がこれ' },
      { text: 'RAGは悪くない。\n食わせたデータが\nゴミだっただけ。', big: true },
      { text: '整理されてない\nデータに\nAIをかぶせても、\n高速でゴミが出る\nだけ', big: true },
      { text: 'AIの前に、\nデータを整理しろ', sub: 'HARMONIC insight' },
    ],
  },
  {
    id: 'SHORT_LLM_03',
    filename: 'SHORT_LLM_03_nihongo_imi.pptx',
    slides: [
      { text: '「国産AIを作れ！」\nという人に\n聞きたい', sub: '楽天、NTT、KDDI…各社が数百億円を投資中' },
      { text: 'その国産AI、\n海外AIの\n50倍のコストで\n同じことしかできない', sub: 'GPU自前運用 vs API呼ぶだけ' },
      { text: '「日本語が得意」\nって言うけど、\nClaudeもGPTも\n日本語で普通に\n仕事できてる', big: true },
      { text: 'モデルを作る\n競争をしている間に、\nモデルを使って\n業務を変えた会社が\n勝っている', big: true },
      { text: '問題は\n「どのAIか」\nじゃない。\n「何をさせるか」', sub: 'Source→Input→Process→Output\n業務設計がすべて', big: true },
      { text: 'モデル選びより、\n業務設計。', sub: 'HARMONIC insight' },
    ],
  },
];

for (const s of llmShorts) {
  createShortPptx(s);
}
