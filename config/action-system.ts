// =============================================================================
// Named Action System — 名前付きアクション体系
// =============================================================================
// OpenRoom の Action Registry パターンを参考に、INAG / INBT の操作を
// 「名前付きアクション」として標準化する設計定義。
//
// 設計方針:
//   - エージェントはピクセルレベルの GUI 操作ではなく、構造化された
//     アクション API を呼び出す（OpenRoom 方式）
//   - 各アクションは入力スキーマ・出力スキーマを持ち、型安全に実行
//   - Syncfusion コンポーネント操作を直接ラップし、INAG の強みを活かす
//   - INBT Orchestrator → Agent の JOB 配信にも同一インターフェースを使用
//
// 参照: OpenRoom の Core SDK 層 Action Registry
//       docs/research/virtual-desktop-gui-agent-research-2026Q1.md
// =============================================================================

// ---------------------------------------------------------------------------
// アクションカテゴリ
// ---------------------------------------------------------------------------

/** アクションが属するドメインカテゴリ */
export type ActionCategory =
  | 'document'      // ドキュメント操作（Word/PDF）
  | 'spreadsheet'   // スプレッドシート操作（Excel）
  | 'presentation'  // プレゼンテーション操作（PPTX）
  | 'filesystem'    // ファイルシステム操作
  | 'data'          // データ変換・集計
  | 'communication' // 通知・メッセージ（将来拡張）
  | 'system';       // システム制御

/** アクションの安全レベル（5層セキュリティゲートに対応） */
export type SafetyLevel =
  | 'safe'          // 読み取り専用・副作用なし
  | 'local_write'   // ローカルファイル書き込み
  | 'destructive'   // 上書き・削除を伴う
  | 'external'      // 外部通信を伴う（要ユーザー承認）
  | 'privileged';   // 管理者権限が必要

// ---------------------------------------------------------------------------
// アクション定義
// ---------------------------------------------------------------------------

/** パラメータスキーマ（簡易型定義） */
export interface ActionParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  /** 列挙値がある場合 */
  enum?: string[];
}

/** 名前付きアクション定義 */
export interface ActionDefinition {
  /** 一意の識別子（例: "spreadsheet.cell.write"） */
  id: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** カテゴリ */
  category: ActionCategory;
  /** 安全レベル */
  safetyLevel: SafetyLevel;
  /** 説明 */
  description: string;
  /** 入力パラメータ */
  params: ActionParam[];
  /** 出力の型記述 */
  outputDescription: string;
  /** Syncfusion 対応コンポーネント（該当する場合） */
  syncfusionComponent?: string;
  /** このアクションの前提条件となるアクション ID */
  prerequisites?: string[];
  /** 実行例（プロンプト生成に使用） */
  examples?: ActionExample[];
}

/** アクション実行例 */
export interface ActionExample {
  /** 自然言語での指示 */
  instruction: string;
  /** パラメータ値 */
  params: Record<string, unknown>;
  /** 期待される出力の概要 */
  expectedOutput: string;
}

// ---------------------------------------------------------------------------
// アクションレジストリ
// ---------------------------------------------------------------------------

/** アクションレジストリ設定 */
export interface ActionRegistryConfig {
  /** 登録済みアクション */
  actions: ActionDefinition[];
  /** カテゴリごとのデフォルト安全レベル */
  categoryDefaults: Record<ActionCategory, SafetyLevel>;
  /** 安全レベルごとの承認要否 */
  approvalRequired: Record<SafetyLevel, boolean>;
}

/** アクション実行リクエスト */
export interface ActionRequest {
  actionId: string;
  params: Record<string, unknown>;
  /** 呼び出し元の識別（INAG / INBT / manual） */
  caller: 'inag' | 'inbt' | 'manual';
  /** セッション ID */
  sessionId: string;
  /** タイムスタンプ */
  timestamp: string;
}

/** アクション実行結果 */
export interface ActionResult {
  actionId: string;
  success: boolean;
  output: unknown;
  /** エラー情報（失敗時） */
  error?: { code: string; message: string };
  /** 実行時間（ms） */
  durationMs: number;
  /** 生成・変更されたファイルパス */
  affectedFiles?: string[];
}

// ---------------------------------------------------------------------------
// INAG / INBT 共通アクション定義（初期セット）
// ---------------------------------------------------------------------------

export const DOCUMENT_ACTIONS: ActionDefinition[] = [
  {
    id: 'document.create',
    nameJa: 'ドキュメント新規作成',
    nameEn: 'Create Document',
    category: 'document',
    safetyLevel: 'local_write',
    description: 'Word/PDF ドキュメントを新規作成する',
    params: [
      { name: 'title', type: 'string', description: 'ドキュメントタイトル', required: true },
      { name: 'format', type: 'string', description: '出力形式', required: true, enum: ['docx', 'pdf'] },
      { name: 'templateId', type: 'string', description: 'テンプレート ID', required: false },
      { name: 'sections', type: 'array', description: 'セクション定義配列', required: false },
    ],
    outputDescription: '生成されたドキュメントのファイルパス',
    syncfusionComponent: 'SfDocumentEditor',
    examples: [
      {
        instruction: '議事録テンプレートで新しい Word ドキュメントを作って',
        params: { title: '2026年3月定例会議事録', format: 'docx', templateId: 'meeting-minutes' },
        expectedOutput: '/output/2026年3月定例会議事録.docx',
      },
    ],
  },
  {
    id: 'document.section.add',
    nameJa: 'セクション追加',
    nameEn: 'Add Section',
    category: 'document',
    safetyLevel: 'local_write',
    description: 'ドキュメントにセクション（見出し＋本文）を追加する',
    params: [
      { name: 'documentPath', type: 'string', description: '対象ドキュメントパス', required: true },
      { name: 'heading', type: 'string', description: '見出しテキスト', required: true },
      { name: 'headingLevel', type: 'number', description: '見出しレベル (1-6)', required: false, default: 2 },
      { name: 'body', type: 'string', description: '本文テキスト', required: true },
      { name: 'insertAfter', type: 'string', description: '挿入位置（セクション ID）', required: false },
    ],
    outputDescription: '追加されたセクションの ID',
    syncfusionComponent: 'SfDocumentEditor',
  },
  {
    id: 'document.export',
    nameJa: 'ドキュメントエクスポート',
    nameEn: 'Export Document',
    category: 'document',
    safetyLevel: 'local_write',
    description: 'ドキュメントを別形式にエクスポートする',
    params: [
      { name: 'sourcePath', type: 'string', description: '元ドキュメントパス', required: true },
      { name: 'targetFormat', type: 'string', description: '変換先形式', required: true, enum: ['pdf', 'docx', 'html', 'txt'] },
      { name: 'outputPath', type: 'string', description: '出力先パス', required: false },
    ],
    outputDescription: 'エクスポートされたファイルのパス',
    syncfusionComponent: 'SfDocumentEditor',
  },
];

export const SPREADSHEET_ACTIONS: ActionDefinition[] = [
  {
    id: 'spreadsheet.create',
    nameJa: 'スプレッドシート新規作成',
    nameEn: 'Create Spreadsheet',
    category: 'spreadsheet',
    safetyLevel: 'local_write',
    description: 'Excel スプレッドシートを新規作成する',
    params: [
      { name: 'title', type: 'string', description: 'ファイル名', required: true },
      { name: 'sheets', type: 'array', description: 'シート定義配列', required: false },
    ],
    outputDescription: '生成されたファイルのパス',
    syncfusionComponent: 'SfSpreadsheet',
  },
  {
    id: 'spreadsheet.cell.write',
    nameJa: 'セル書き込み',
    nameEn: 'Write Cell',
    category: 'spreadsheet',
    safetyLevel: 'local_write',
    description: 'スプレッドシートの指定セルに値を書き込む',
    params: [
      { name: 'filePath', type: 'string', description: '対象ファイルパス', required: true },
      { name: 'sheet', type: 'string', description: 'シート名', required: false, default: 'Sheet1' },
      { name: 'cell', type: 'string', description: 'セル参照 (例: A1, B3)', required: true },
      { name: 'value', type: 'string', description: '書き込む値', required: true },
      { name: 'format', type: 'string', description: 'セル書式', required: false },
    ],
    outputDescription: '書き込み完了の確認',
    syncfusionComponent: 'SfSpreadsheet',
    examples: [
      {
        instruction: 'A1 セルに「売上合計」と入力して',
        params: { filePath: '/data/sales.xlsx', cell: 'A1', value: '売上合計' },
        expectedOutput: 'セル A1 に「売上合計」を書き込みました',
      },
    ],
  },
  {
    id: 'spreadsheet.range.write',
    nameJa: '範囲一括書き込み',
    nameEn: 'Write Range',
    category: 'spreadsheet',
    safetyLevel: 'local_write',
    description: '指定範囲に2次元配列データを一括書き込みする',
    params: [
      { name: 'filePath', type: 'string', description: '対象ファイルパス', required: true },
      { name: 'sheet', type: 'string', description: 'シート名', required: false, default: 'Sheet1' },
      { name: 'startCell', type: 'string', description: '開始セル (例: A1)', required: true },
      { name: 'data', type: 'array', description: '2次元配列データ', required: true },
    ],
    outputDescription: '書き込まれたセル範囲',
    syncfusionComponent: 'SfSpreadsheet',
  },
  {
    id: 'spreadsheet.formula.set',
    nameJa: '数式設定',
    nameEn: 'Set Formula',
    category: 'spreadsheet',
    safetyLevel: 'local_write',
    description: 'セルに数式を設定する',
    params: [
      { name: 'filePath', type: 'string', description: '対象ファイルパス', required: true },
      { name: 'sheet', type: 'string', description: 'シート名', required: false, default: 'Sheet1' },
      { name: 'cell', type: 'string', description: 'セル参照', required: true },
      { name: 'formula', type: 'string', description: '数式（= で始まる）', required: true },
    ],
    outputDescription: '設定された数式と計算結果',
    syncfusionComponent: 'SfSpreadsheet',
  },
  {
    id: 'spreadsheet.chart.create',
    nameJa: 'チャート作成',
    nameEn: 'Create Chart',
    category: 'spreadsheet',
    safetyLevel: 'local_write',
    description: 'データ範囲からチャートを作成する',
    params: [
      { name: 'filePath', type: 'string', description: '対象ファイルパス', required: true },
      { name: 'sheet', type: 'string', description: 'シート名', required: false },
      { name: 'dataRange', type: 'string', description: 'データ範囲 (例: A1:D10)', required: true },
      { name: 'chartType', type: 'string', description: 'チャート種別', required: true, enum: ['bar', 'line', 'pie', 'scatter', 'area'] },
      { name: 'title', type: 'string', description: 'チャートタイトル', required: false },
    ],
    outputDescription: '作成されたチャートの識別情報',
    syncfusionComponent: 'SfSpreadsheet',
  },
];

export const PRESENTATION_ACTIONS: ActionDefinition[] = [
  {
    id: 'presentation.create',
    nameJa: 'プレゼンテーション新規作成',
    nameEn: 'Create Presentation',
    category: 'presentation',
    safetyLevel: 'local_write',
    description: 'PowerPoint プレゼンテーションを新規作成する',
    params: [
      { name: 'title', type: 'string', description: 'ファイル名', required: true },
      { name: 'templateId', type: 'string', description: 'テンプレート ID', required: false },
      { name: 'theme', type: 'string', description: 'テーマ名', required: false },
    ],
    outputDescription: '生成されたファイルのパス',
    syncfusionComponent: 'SfPresentation',
  },
  {
    id: 'presentation.slide.add',
    nameJa: 'スライド追加',
    nameEn: 'Add Slide',
    category: 'presentation',
    safetyLevel: 'local_write',
    description: 'スライドを追加する',
    params: [
      { name: 'filePath', type: 'string', description: '対象ファイルパス', required: true },
      { name: 'layout', type: 'string', description: 'スライドレイアウト', required: false, enum: ['title', 'content', 'two-column', 'blank', 'section-header'] },
      { name: 'title', type: 'string', description: 'スライドタイトル', required: false },
      { name: 'body', type: 'string', description: '本文テキスト', required: false },
      { name: 'insertAt', type: 'number', description: '挿入位置（0始まり）', required: false },
    ],
    outputDescription: '追加されたスライドのインデックス',
    syncfusionComponent: 'SfPresentation',
  },
];

export const DATA_ACTIONS: ActionDefinition[] = [
  {
    id: 'data.csv.import',
    nameJa: 'CSV インポート',
    nameEn: 'Import CSV',
    category: 'data',
    safetyLevel: 'safe',
    description: 'CSV ファイルを読み込み構造化データに変換する',
    params: [
      { name: 'filePath', type: 'string', description: 'CSV ファイルパス', required: true },
      { name: 'encoding', type: 'string', description: '文字エンコーディング', required: false, default: 'utf-8' },
      { name: 'hasHeader', type: 'boolean', description: 'ヘッダー行あり', required: false, default: true },
    ],
    outputDescription: 'パース済みデータ（行×列の2次元配列）',
  },
  {
    id: 'data.aggregate',
    nameJa: 'データ集計',
    nameEn: 'Aggregate Data',
    category: 'data',
    safetyLevel: 'safe',
    description: 'データに対して集計処理を実行する',
    params: [
      { name: 'sourceActionId', type: 'string', description: 'データ元のアクション結果 ID', required: true },
      { name: 'groupBy', type: 'string', description: 'グループ化キー列', required: false },
      { name: 'aggregation', type: 'string', description: '集計方法', required: true, enum: ['sum', 'avg', 'count', 'min', 'max'] },
      { name: 'targetColumn', type: 'string', description: '集計対象列', required: true },
    ],
    outputDescription: '集計結果データ',
  },
];

// ---------------------------------------------------------------------------
// デフォルト設定
// ---------------------------------------------------------------------------

export const DEFAULT_ACTION_REGISTRY: ActionRegistryConfig = {
  actions: [
    ...DOCUMENT_ACTIONS,
    ...SPREADSHEET_ACTIONS,
    ...PRESENTATION_ACTIONS,
    ...DATA_ACTIONS,
  ],
  categoryDefaults: {
    document: 'local_write',
    spreadsheet: 'local_write',
    presentation: 'local_write',
    filesystem: 'local_write',
    data: 'safe',
    communication: 'external',
    system: 'privileged',
  },
  approvalRequired: {
    safe: false,
    local_write: false,
    destructive: true,
    external: true,
    privileged: true,
  },
};
