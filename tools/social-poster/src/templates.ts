// =============================================================================
// 投稿テンプレート定義
// =============================================================================

import type { ContentType, NoteCategory } from './types.js';

// =============================================================================
// Twitter テンプレート
// =============================================================================

export interface TwitterTemplate {
  contentType: ContentType;
  nameJa: string;
  examplesJa: string[];
  hashtagSuggestions: string[];
}

export const TWITTER_TEMPLATES: Record<ContentType, TwitterTemplate> = {
  product_update: {
    contentType: 'product_update',
    nameJa: '製品アップデート',
    examplesJa: [
      'Insight Deck Quality Gate v2.2 をリリースしました。AIコンシェルジュがスライドの品質を自動チェック。差分比較も大幅高速化。 #HARMONIC #DX',
      'IOSH に新機能: セル変更ログの可視化。「誰が・いつ・何を変えたか」が一目瞭然に。経営数値の信頼性を守ります。 #Excel管理 #DX',
    ],
    hashtagSuggestions: ['#HARMONIC', '#DX', '#業務効率化', '#AI活用', '#RPA'],
  },
  tips: {
    contentType: 'tips',
    nameJa: '使い方Tips',
    examplesJa: [
      '知ってました？IOSH の AI アシスタントに「この表の異常値を教えて」と聞くだけで、統計的外れ値を自動検出してくれます。 #Excel #AI活用',
      'INSS の 2ファイル比較、実は Ctrl+D で一発起動できます。修正前後の PPTX を瞬時にチェック。 #PowerPoint #品質管理',
    ],
    hashtagSuggestions: ['#Tips', '#使い方', '#時短', '#AI活用', '#業務効率化'],
  },
  case_study: {
    contentType: 'case_study',
    nameJa: '活用事例',
    examplesJa: [
      'ある製造業のお客様: 月次報告の Excel チェックに毎月 2 日かかっていた作業が、IOSH の差分比較 + AI で半日に短縮。年間 18 日分の工数削減。',
      'RPA 移行プロジェクト: BizRobo 300 シナリオの解析を INCA で自動化。手動解析なら 3 ヶ月のところ、2 週間で完了。',
    ],
    hashtagSuggestions: ['#DX事例', '#業務改善', '#コスト削減', '#RPA', '#AI導入'],
  },
  behind_the_scenes: {
    contentType: 'behind_the_scenes',
    nameJa: '開発裏話',
    examplesJa: [
      'なぜ GPT ではなく Claude を選んだのか。BYOK 方式でお客様の API キーを使う設計にした理由は、データの主権をお客様に残すため。',
      'PII 匿名化エンジンの開発秘話。「田中部長」→「Person_A」に置換してから API に送信。復元マップはメモリ上のみ。セキュリティとAI活用の両立。',
    ],
    hashtagSuggestions: ['#開発', '#エンジニア', '#Claude', '#セキュリティ', '#プライバシー'],
  },
  industry_insight: {
    contentType: 'industry_insight',
    nameJa: '業界トレンド',
    examplesJa: [
      'DX 推進担当者の 73% が「ツール導入後の定着」に課題を感じている。ツールだけでは変わらない。コンサル + ツールの組み合わせが鍵。',
      'AI Office という新カテゴリ。MS Office + AI ではなく、AI ネイティブな Office。プロンプトが資産になる時代。',
    ],
    hashtagSuggestions: ['#DX', '#AI', '#業界動向', '#働き方改革', '#デジタル変革'],
  },
  comparison: {
    contentType: 'comparison',
    nameJa: '競合比較',
    examplesJa: [
      'UiPath vs InsightBot の決定的な違い: UiPath は画面の外から操作する。InsightBot はドキュメントの中から直接操作する。ファイルロック問題ゼロ。',
      'MS Office + ChatGPT vs IAOF: 2つのアプリを行き来する必要なし。IAOF なら AI と Office 編集が同じ画面。プロンプトも蓄積される。',
    ],
    hashtagSuggestions: ['#比較', '#ツール選び', '#UiPath', '#MicrosoftOffice', '#AI'],
  },
  free_plan_promo: {
    contentType: 'free_plan_promo',
    nameJa: 'FREE プラン訴求',
    examplesJa: [
      '¥0 で本格 AI Office。IAOF の FREE プランは永久無料。保存制限はあるけど、AI チャット・Office 編集は制限なし。まず試してみて。',
      'Excel の管理、もう手作業でやらなくていい。IOSH は FREE で差分比較・バージョン管理が使えます。AI アシスタントも BYOK で利用可能。',
    ],
    hashtagSuggestions: ['#無料', '#フリーミアム', '#AI', '#Excel', '#業務効率化'],
  },
};

// =============================================================================
// note.com テンプレート
// =============================================================================

export interface NoteTemplate {
  contentType: ContentType;
  nameJa: string;
  themesJa: string[];
  structureJa: string[];
  defaultCategory: NoteCategory;
}

export const NOTE_TEMPLATES: Record<ContentType, NoteTemplate> = {
  product_update: {
    contentType: 'product_update',
    nameJa: '製品アップデート記事',
    themesJa: ['新機能紹介', 'アップデートの背景', 'ユーザーへのメリット'],
    structureJa: ['背景・課題', '新機能の概要', '具体的な使い方', 'ユーザーメリット', 'まとめ・CTA'],
    defaultCategory: 'tech',
  },
  tips: {
    contentType: 'tips',
    nameJa: '使い方ガイド',
    themesJa: ['知られていない便利機能', '効率化テクニック', '設定のコツ'],
    structureJa: ['こんな困りごとありませんか？', '解決方法', 'ステップバイステップ', '応用例', 'まとめ'],
    defaultCategory: 'tech',
  },
  case_study: {
    contentType: 'case_study',
    nameJa: '導入事例',
    themesJa: ['Before/After', '導入経緯', '定量的効果'],
    structureJa: ['企業・課題の概要', '導入の経緯', '具体的な活用方法', '定量的な効果', '担当者の声'],
    defaultCategory: 'business',
  },
  behind_the_scenes: {
    contentType: 'behind_the_scenes',
    nameJa: '開発ストーリー',
    themesJa: ['技術選定の理由', '設計思想', '失敗と学び'],
    structureJa: ['問題提起', '試行錯誤', '最終的な選択と理由', '得られた知見', '今後の展望'],
    defaultCategory: 'tech',
  },
  industry_insight: {
    contentType: 'industry_insight',
    nameJa: '業界分析',
    themesJa: ['DXトレンド', 'AI活用の現在地', '働き方の変化'],
    structureJa: ['業界の現状', 'データ・統計', '課題の本質', '解決の方向性', '自社の取り組み'],
    defaultCategory: 'business',
  },
  comparison: {
    contentType: 'comparison',
    nameJa: '製品比較',
    themesJa: ['既存ツールとの違い', '選び方のポイント', 'ユースケース別推奨'],
    structureJa: ['比較の前提', '機能比較表', '使用感の違い', 'どんな場合にどちらが適切か', 'まとめ'],
    defaultCategory: 'tech',
  },
  free_plan_promo: {
    contentType: 'free_plan_promo',
    nameJa: '無料で始める系',
    themesJa: ['コストゼロで業務改善', 'FREEプランでできること', '導入の敷居の低さ'],
    structureJa: ['こんな課題ありますよね', 'FREEプランでここまでできる', '使い始めるまでの3ステップ', '有料版との違い', '始めてみよう'],
    defaultCategory: 'idea',
  },
};
