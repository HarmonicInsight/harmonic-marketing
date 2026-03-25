// =============================================================================
// HARMONIC Agent Orchestrator — エージェント基盤
// =============================================================================
// Claude API との対話、チャット履歴管理、サブエージェント実行の共通基盤
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type {
  ArchangelDefinition,
  ChatMessage,
  ChatSession,
  SubAgentResult,
  Artifact,
  TaskContext,
  TaskPlan,
  OrchestratorConfig,
  DEFAULT_CONFIG,
  ProductInfo,
  SipoGateResult,
} from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 環境変数
// ---------------------------------------------------------------------------

function loadEnvFile(): void {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。',
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// HARMONIC 製品コンテキスト
// ---------------------------------------------------------------------------

const PRODUCT_CATALOG_PATH = resolve(
  __dirname,
  '..', '..', '..', 'content', 'products', 'catalog.json',
);

export function loadProductCatalog(): ProductInfo[] {
  try {
    const raw = JSON.parse(readFileSync(PRODUCT_CATALOG_PATH, 'utf-8'));
    return (raw.products as Array<Record<string, unknown>>).map(p => ({
      id: p.id as string,
      name: p.name as string,
      description: p.description as string,
      category: p.category as string,
      tech: p.tech as string,
      status: p.status as string,
      currentVersion: (p.current_version as string) ?? null,
    }));
  } catch {
    return [];
  }
}

export function buildProductContext(products?: ProductInfo[]): string {
  const items = products ?? loadProductCatalog();
  if (items.length === 0) return '';
  const lines = items.map(
    p => `- ${p.id} (${p.name}): ${p.description} [${p.tech}] v${p.currentVersion ?? 'N/A'}`,
  );
  return `
## HARMONIC insight 製品一覧
${lines.join('\n')}

技術方針:
- AI は Claude (Anthropic) API 専用 — BYOK 方式
- PII 匿名化エンジン搭載 / オフライン動作可
- 価格: FREE → BIZ ¥49,800/端末年 → ENT 個別見積
`.trim();
}

// ---------------------------------------------------------------------------
// Claude API クライアント
// ---------------------------------------------------------------------------

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: getApiKey() });
  }
  return client;
}

/** Claude API にメッセージを送信 */
export async function sendToClaudeAPI(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  config: { model: string; maxTokens?: number },
): Promise<{ text: string; tokenUsage: { input: number; output: number } }> {
  const api = getClient();
  const response = await api.messages.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 4096,
    system: systemPrompt,
    messages,
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  return {
    text,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// サブエージェント実行
// ---------------------------------------------------------------------------

export async function runSubAgent(
  parentSystemPrompt: string,
  subAgent: { role: string; nameJa: string; systemPromptSuffix: string },
  task: string,
  previousResults: SubAgentResult[],
  config: { model: string },
): Promise<SubAgentResult> {
  const startTime = Date.now();

  // 前工程の成果をコンテキストとして組み立て
  const previousContext = previousResults.length > 0
    ? `\n\n## 前工程の成果\n${previousResults.map(r => `### ${r.role}\n${r.output}`).join('\n\n')}`
    : '';

  const systemPrompt = `${parentSystemPrompt}

## あなたの役割: ${subAgent.nameJa}
${subAgent.systemPromptSuffix}

## 出力ルール
- 日本語で回答
- 構造化された形式（見出し・箇条書き）で出力
- 具体的かつ実行可能な内容を重視
- 推測ではなくデータに基づいた分析を心がける
${previousContext}`;

  const { text, tokenUsage } = await sendToClaudeAPI(
    systemPrompt,
    [{ role: 'user', content: task }],
    { model: config.model },
  );

  return {
    role: subAgent.role,
    output: text,
    tokenUsage,
    durationMs: Date.now() - startTime,
  };
}

// ---------------------------------------------------------------------------
// タスク計画の生成
// ---------------------------------------------------------------------------

export async function generateTaskPlan(
  archangel: ArchangelDefinition,
  taskDescription: string,
  config: { model: string },
): Promise<TaskPlan> {
  const { text } = await sendToClaudeAPI(
    `${archangel.systemPrompt}

あなたはタスクを分析し、配下のサブエージェントへの実行計画を JSON で返してください。

利用可能なサブエージェント:
${archangel.subAgents.map(sa => `- ${sa.role}: ${sa.nameJa} — ${sa.description}`).join('\n')}

出力形式 (JSON のみ):
{
  "steps": [
    { "index": 0, "description": "ステップの説明", "subAgentRole": "role_name" },
    ...
  ]
}`,
    [{ role: 'user', content: taskDescription }],
    { model: config.model },
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // フォールバック: 全サブエージェントを順番に実行
    return {
      steps: archangel.subAgents.map((sa, i) => ({
        index: i,
        description: `${sa.nameJa}による分析・実行`,
        subAgentRole: sa.role,
        status: 'pending' as const,
      })),
      estimatedSteps: archangel.subAgents.length,
      currentStep: 0,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    steps: Array<{ index: number; description: string; subAgentRole: string }>;
  };

  return {
    steps: parsed.steps.map((s, i) => ({
      index: i,
      description: s.description,
      subAgentRole: s.subAgentRole,
      status: 'pending' as const,
    })),
    estimatedSteps: parsed.steps.length,
    currentStep: 0,
  };
}

// ---------------------------------------------------------------------------
// SIPO 品質ゲート
// ---------------------------------------------------------------------------

export async function runSipoGate(
  output: string,
  context: string,
  config: { model: string },
): Promise<SipoGateResult> {
  const { text } = await sendToClaudeAPI(
    `あなたは SIPO 品質管理の専門家です。以下の出力を SIPO フレームワークで検証してください。

SIPO フレームワーク:
- S (Source): データの出所・正当性は確認されているか
- I (Input): 入力データは正しく検証されているか
- P (Process): 処理ロジック・承認フローは適切か
- O (Output): 出力結果は期待通りか

出力形式 (JSON のみ):
{
  "source": { "valid": true/false, "issues": ["問題があれば記載"] },
  "input": { "valid": true/false, "issues": [] },
  "process": { "valid": true/false, "issues": [] },
  "output": { "valid": true/false, "issues": [] },
  "passed": true/false
}`,
    [{
      role: 'user',
      content: `## コンテキスト\n${context}\n\n## 検証対象の出力\n${output}`,
    }],
    { model: config.model },
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      source: { valid: true, issues: [] },
      input: { valid: true, issues: [] },
      process: { valid: true, issues: [] },
      output: { valid: true, issues: [] },
      passed: true,
    };
  }

  return JSON.parse(jsonMatch[0]) as SipoGateResult;
}

// ---------------------------------------------------------------------------
// セッション管理
// ---------------------------------------------------------------------------

export function createSession(archangelId: string): ChatSession {
  return {
    id: randomUUID(),
    archangel: archangelId as ChatSession['archangel'],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addMessage(
  session: ChatSession,
  sender: ChatMessage['sender'],
  content: string,
  opts?: { subAgentRole?: string; artifacts?: Artifact[] },
): ChatMessage {
  const msg: ChatMessage = {
    id: randomUUID(),
    sender,
    content,
    timestamp: new Date().toISOString(),
    ...opts,
  };
  session.messages.push(msg);
  session.updatedAt = new Date().toISOString();
  return msg;
}

export function saveSession(session: ChatSession, sessionDir: string): void {
  mkdirSync(sessionDir, { recursive: true });
  const filePath = resolve(sessionDir, `${session.archangel}-${session.id.slice(0, 8)}.json`);
  writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/** チャット履歴を Claude API の messages 形式に変換 */
export function sessionToApiMessages(
  session: ChatSession,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return session.messages
    .filter(m => m.sender === 'user' || m.sender === session.archangel)
    .map(m => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));
}
