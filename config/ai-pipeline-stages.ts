// =============================================================================
// Staged AI Pipeline — 段階的 AI パイプライン設計
// =============================================================================
// OpenRoom の Vibe Workflow（要件→設計→実装→検証）を参考に、
// INBT の Python スクリプト生成や INAG のドキュメント生成を
// 段階的パイプラインとして構造化する設計定義。
//
// 設計方針:
//   - 各ステージは独立して実行・検証可能
//   - ステージ間のデータは型付きアーティファクトとして受け渡し
//   - 失敗時は該当ステージのみリトライ（全体やり直しを避ける）
//   - SIPO 品質ゲートを各ステージ遷移に適用
//   - ユーザーは任意のステージで介入・修正可能
//
// 参照: OpenRoom の Vibe Workflow パイプライン
//       /vibe AppName → 要件分析 → 設計 → タスク計画 → コード生成 → 統合
// =============================================================================

// ---------------------------------------------------------------------------
// パイプラインステージ
// ---------------------------------------------------------------------------

/** パイプラインの種別 */
export type PipelineType =
  | 'script_generation'      // INBT: Python スクリプト生成
  | 'document_generation'    // INAG: ドキュメント生成
  | 'data_analysis'          // INAG: データ分析レポート
  | 'template_creation';     // IAOF: テンプレート・プロンプト作成

/** ステージ識別子 */
export type StageId =
  | 'requirement_analysis'   // 要件分析
  | 'design'                 // 設計
  | 'task_planning'          // タスク計画
  | 'implementation'         // 実装（コード生成 / ドキュメント生成）
  | 'validation'             // 検証
  | 'integration'            // 統合・出力
  | 'review';                // 最終レビュー

/** ステージの状態 */
export type StageStatus =
  | 'pending'       // 未開始
  | 'running'       // 実行中
  | 'awaiting'      // ユーザー入力待ち
  | 'completed'     // 完了
  | 'failed'        // 失敗
  | 'skipped';      // スキップ

// ---------------------------------------------------------------------------
// ステージ定義
// ---------------------------------------------------------------------------

/** ステージ間で受け渡すアーティファクト */
export interface StageArtifact {
  /** アーティファクト種別 */
  type: 'requirements' | 'design_doc' | 'task_list' | 'code' | 'document' | 'validation_report' | 'final_output';
  /** 内容 */
  content: string;
  /** 構造化データ（JSON parseable な場合） */
  structured?: Record<string, unknown>;
  /** ファイルパス（ファイルとして保存済みの場合） */
  filePath?: string;
  /** メタデータ */
  metadata?: Record<string, string>;
}

/** ステージ定義 */
export interface StageDefinition {
  id: StageId;
  nameJa: string;
  nameEn: string;
  /** このステージで実行する処理の概要 */
  description: string;
  /** 入力として必要なアーティファクト種別 */
  requiredInputs: StageArtifact['type'][];
  /** 出力するアーティファクト種別 */
  outputType: StageArtifact['type'];
  /** LLM プロンプトテンプレートのキー（別途 prompt store で管理） */
  promptTemplateKey: string;
  /** SIPO ゲートチェックを適用するか */
  sipoGateEnabled: boolean;
  /** ユーザー確認を求めるか（false = 自動進行） */
  requiresUserApproval: boolean;
  /** 最大リトライ回数 */
  maxRetries: number;
  /** タイムアウト（秒） */
  timeoutSeconds: number;
}

/** ステージ実行結果 */
export interface StageResult {
  stageId: StageId;
  status: StageStatus;
  artifact?: StageArtifact;
  /** SIPO ゲート結果 */
  sipoResult?: {
    source: { valid: boolean; issues: string[] };
    input: { valid: boolean; issues: string[] };
    process: { valid: boolean; issues: string[] };
    output: { valid: boolean; issues: string[] };
    passed: boolean;
  };
  /** エラー情報 */
  error?: { code: string; message: string; retryable: boolean };
  /** 実行時間（ms） */
  durationMs: number;
  /** リトライ回数 */
  retryCount: number;
  /** タイムスタンプ */
  completedAt: string;
}

// ---------------------------------------------------------------------------
// パイプライン定義
// ---------------------------------------------------------------------------

/** パイプライン全体の定義 */
export interface PipelineDefinition {
  type: PipelineType;
  nameJa: string;
  nameEn: string;
  description: string;
  /** ステージの実行順序 */
  stages: StageDefinition[];
  /** パイプライン全体のタイムアウト（秒） */
  totalTimeoutSeconds: number;
  /** 失敗時の挙動 */
  onFailure: 'stop' | 'skip_and_continue' | 'rollback';
}

/** パイプライン実行状態 */
export interface PipelineExecution {
  id: string;
  pipelineType: PipelineType;
  /** ユーザーの元の指示 */
  userInstruction: string;
  /** 各ステージの結果 */
  stageResults: StageResult[];
  /** 現在のステージ */
  currentStageId: StageId | null;
  /** 全体ステータス */
  status: 'running' | 'paused' | 'completed' | 'failed';
  /** 開始時刻 */
  startedAt: string;
  /** 完了時刻 */
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// パイプライン定義: INBT スクリプト生成
// ---------------------------------------------------------------------------

export const SCRIPT_GENERATION_PIPELINE: PipelineDefinition = {
  type: 'script_generation',
  nameJa: 'スクリプト生成パイプライン',
  nameEn: 'Script Generation Pipeline',
  description: 'ユーザーの自然言語指示から Python スクリプトを段階的に生成する',
  totalTimeoutSeconds: 300,
  onFailure: 'stop',
  stages: [
    {
      id: 'requirement_analysis',
      nameJa: '要件分析',
      nameEn: 'Requirement Analysis',
      description: 'ユーザーの指示を解析し、スクリプトの要件を構造化する。入力データ形式、期待出力、制約条件を明確化',
      requiredInputs: [],
      outputType: 'requirements',
      promptTemplateKey: 'pipeline.script.requirements',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'design',
      nameJa: '設計',
      nameEn: 'Design',
      description: '要件に基づきスクリプトの設計を作成。関数構成、データフロー、エラーハンドリング方針を決定',
      requiredInputs: ['requirements'],
      outputType: 'design_doc',
      promptTemplateKey: 'pipeline.script.design',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'task_planning',
      nameJa: 'タスク計画',
      nameEn: 'Task Planning',
      description: '設計を実装タスクに分解。各タスクの依存関係と実行順序を決定',
      requiredInputs: ['design_doc'],
      outputType: 'task_list',
      promptTemplateKey: 'pipeline.script.tasks',
      sipoGateEnabled: false,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 20,
    },
    {
      id: 'implementation',
      nameJa: 'コード生成',
      nameEn: 'Code Generation',
      description: 'タスク計画に従い Python コードを生成。型ヒント・docstring 付き',
      requiredInputs: ['requirements', 'design_doc', 'task_list'],
      outputType: 'code',
      promptTemplateKey: 'pipeline.script.codegen',
      sipoGateEnabled: true,
      requiresUserApproval: true,
      maxRetries: 3,
      timeoutSeconds: 60,
    },
    {
      id: 'validation',
      nameJa: '検証',
      nameEn: 'Validation',
      description: '生成コードの構文チェック・セキュリティスキャン・要件充足確認',
      requiredInputs: ['code', 'requirements'],
      outputType: 'validation_report',
      promptTemplateKey: 'pipeline.script.validate',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 30,
    },
    {
      id: 'integration',
      nameJa: '統合・出力',
      nameEn: 'Integration',
      description: '検証済みコードを最終成果物として整形・保存',
      requiredInputs: ['code', 'validation_report'],
      outputType: 'final_output',
      promptTemplateKey: 'pipeline.script.integrate',
      sipoGateEnabled: false,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 15,
    },
  ],
};

// ---------------------------------------------------------------------------
// パイプライン定義: INAG ドキュメント生成
// ---------------------------------------------------------------------------

export const DOCUMENT_GENERATION_PIPELINE: PipelineDefinition = {
  type: 'document_generation',
  nameJa: 'ドキュメント生成パイプライン',
  nameEn: 'Document Generation Pipeline',
  description: 'ユーザーの指示と参考資料からドキュメントを段階的に生成する',
  totalTimeoutSeconds: 300,
  onFailure: 'stop',
  stages: [
    {
      id: 'requirement_analysis',
      nameJa: '要件分析',
      nameEn: 'Requirement Analysis',
      description: '指示内容・参考資料・ペルソナ設定を統合し、ドキュメント要件を明確化',
      requiredInputs: [],
      outputType: 'requirements',
      promptTemplateKey: 'pipeline.document.requirements',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'design',
      nameJa: '構成設計',
      nameEn: 'Structure Design',
      description: '目次・セクション構成・各セクションの概要を設計。テンプレートがあれば適用',
      requiredInputs: ['requirements'],
      outputType: 'design_doc',
      promptTemplateKey: 'pipeline.document.structure',
      sipoGateEnabled: true,
      requiresUserApproval: true,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'implementation',
      nameJa: 'コンテンツ生成',
      nameEn: 'Content Generation',
      description: '構成設計に従い各セクションのコンテンツを生成',
      requiredInputs: ['requirements', 'design_doc'],
      outputType: 'document',
      promptTemplateKey: 'pipeline.document.content',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 3,
      timeoutSeconds: 90,
    },
    {
      id: 'validation',
      nameJa: '品質チェック',
      nameEn: 'Quality Check',
      description: '生成ドキュメントの品質チェック（PII 検出・事実確認フラグ・トーン整合性）',
      requiredInputs: ['document', 'requirements'],
      outputType: 'validation_report',
      promptTemplateKey: 'pipeline.document.quality',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 30,
    },
    {
      id: 'integration',
      nameJa: 'フォーマット整形・出力',
      nameEn: 'Format & Output',
      description: 'Syncfusion で最終フォーマット（docx/pdf/pptx）に整形して出力',
      requiredInputs: ['document', 'validation_report'],
      outputType: 'final_output',
      promptTemplateKey: 'pipeline.document.format',
      sipoGateEnabled: false,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 30,
    },
  ],
};

// ---------------------------------------------------------------------------
// パイプライン定義: データ分析レポート
// ---------------------------------------------------------------------------

export const DATA_ANALYSIS_PIPELINE: PipelineDefinition = {
  type: 'data_analysis',
  nameJa: 'データ分析パイプライン',
  nameEn: 'Data Analysis Pipeline',
  description: 'データセットの分析とレポート生成を段階的に実行する',
  totalTimeoutSeconds: 600,
  onFailure: 'stop',
  stages: [
    {
      id: 'requirement_analysis',
      nameJa: '分析要件定義',
      nameEn: 'Analysis Requirements',
      description: '分析目的・対象データ・期待するアウトプット形式を明確化',
      requiredInputs: [],
      outputType: 'requirements',
      promptTemplateKey: 'pipeline.analysis.requirements',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'design',
      nameJa: '分析設計',
      nameEn: 'Analysis Design',
      description: '分析手法・使用する統計指標・可視化方針を設計',
      requiredInputs: ['requirements'],
      outputType: 'design_doc',
      promptTemplateKey: 'pipeline.analysis.design',
      sipoGateEnabled: true,
      requiresUserApproval: true,
      maxRetries: 2,
      timeoutSeconds: 30,
    },
    {
      id: 'implementation',
      nameJa: '分析実行',
      nameEn: 'Execute Analysis',
      description: '設計に基づきデータ分析を実行し、結果をまとめる',
      requiredInputs: ['requirements', 'design_doc'],
      outputType: 'document',
      promptTemplateKey: 'pipeline.analysis.execute',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 3,
      timeoutSeconds: 120,
    },
    {
      id: 'validation',
      nameJa: '結果検証',
      nameEn: 'Result Validation',
      description: '分析結果の妥当性チェック（外れ値、論理的整合性、データ品質）',
      requiredInputs: ['document', 'requirements'],
      outputType: 'validation_report',
      promptTemplateKey: 'pipeline.analysis.validate',
      sipoGateEnabled: true,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 30,
    },
    {
      id: 'integration',
      nameJa: 'レポート出力',
      nameEn: 'Report Output',
      description: '分析結果をチャート付きレポート（Excel + PPTX）として出力',
      requiredInputs: ['document', 'validation_report'],
      outputType: 'final_output',
      promptTemplateKey: 'pipeline.analysis.report',
      sipoGateEnabled: false,
      requiresUserApproval: false,
      maxRetries: 1,
      timeoutSeconds: 30,
    },
  ],
};

// ---------------------------------------------------------------------------
// ユーティリティ型
// ---------------------------------------------------------------------------

/** 全パイプライン定義のレジストリ */
export const PIPELINE_REGISTRY: Record<PipelineType, PipelineDefinition> = {
  script_generation: SCRIPT_GENERATION_PIPELINE,
  document_generation: DOCUMENT_GENERATION_PIPELINE,
  data_analysis: DATA_ANALYSIS_PIPELINE,
  template_creation: {
    type: 'template_creation',
    nameJa: 'テンプレート作成パイプライン',
    nameEn: 'Template Creation Pipeline',
    description: 'IAOF 用のプロンプトテンプレート・ドキュメントテンプレートを作成する（TODO: 詳細定義）',
    totalTimeoutSeconds: 180,
    onFailure: 'stop',
    stages: [], // 後日定義
  },
};
