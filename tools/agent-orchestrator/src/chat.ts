// =============================================================================
// HARMONIC Agent Orchestrator — チャット CLI エンジン
// =============================================================================
// Claude Code CLI 風の対話型チャットインターフェース。
// 各天使エージェントとの対話、サブコマンド実行、タスク管理を統合。
// =============================================================================

import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import type {
  ArchangelDefinition,
  ArchangelId,
  ChatSession,
  TaskContext,
  TaskPlan,
  SubAgentResult,
  OrchestratorConfig,
} from './types.js';
import {
  createSession,
  addMessage,
  saveSession,
  sessionToApiMessages,
  sendToClaudeAPI,
  runSubAgent,
  generateTaskPlan,
  runSipoGate,
  buildProductContext,
} from './agent-base.js';
import { MICHAEL } from './michael.js';
import { RAPHAEL } from './raphael.js';
import { GABRIEL } from './gabriel.js';
import { URIEL } from './uriel.js';
import { DEFAULT_CONFIG } from './types.js';

// ---------------------------------------------------------------------------
// 天使レジストリ
// ---------------------------------------------------------------------------

export const ARCHANGELS: Record<ArchangelId, ArchangelDefinition> = {
  michael: MICHAEL,
  raphael: RAPHAEL,
  gabriel: GABRIEL,
  uriel: URIEL,
};

// ---------------------------------------------------------------------------
// 表示ユーティリティ
// ---------------------------------------------------------------------------

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gold: '\x1b[33m', // HARMONIC brand color approximation
} as const;

function c(color: keyof typeof COLORS, text: string): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printBanner(angel: ArchangelDefinition): void {
  const width = 64;
  const line = '='.repeat(width);
  console.log('');
  console.log(c('gold', line));
  console.log(c('gold', `  ${angel.emoji}  ${angel.nameJa} (${angel.nameEn}) — ${angel.teamNameJa}`));
  console.log(c('dim', `  ${angel.description}`));
  console.log(c('gold', line));
  console.log('');
  console.log(c('dim', '  コマンド一覧:'));
  for (const cmd of angel.commands) {
    console.log(`  ${c('cyan', cmd.name.padEnd(16))} ${cmd.description}`);
  }
  console.log(`  ${c('cyan', '/help'.padEnd(16))} コマンド一覧を表示`);
  console.log(`  ${c('cyan', '/status'.padEnd(16))} 実行中タスクの状態`);
  console.log(`  ${c('cyan', '/history'.padEnd(16))} チャット履歴の表示`);
  console.log(`  ${c('cyan', '/save'.padEnd(16))} セッションを保存`);
  console.log(`  ${c('cyan', '/exit'.padEnd(16))} チャットを終了`);
  console.log('');
  console.log(c('dim', '  自由な日本語での対話もできます。'));
  console.log('');
}

function printAgentReport(
  angel: ArchangelDefinition,
  subAgentRole: string,
  output: string,
  durationMs: number,
): void {
  const subAgent = angel.subAgents.find(sa => sa.role === subAgentRole);
  const name = subAgent?.nameJa ?? subAgentRole;
  console.log('');
  console.log(c('yellow', `  --- ${name} からの報告 (${(durationMs / 1000).toFixed(1)}s) ---`));
  console.log('');
  // インデントされた出力
  const lines = output.split('\n');
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log('');
  console.log(c('dim', `  --- ${name} 報告完了 ---`));
  console.log('');
}

function printSipoResult(result: { passed: boolean; source: { valid: boolean; issues: string[] }; input: { valid: boolean; issues: string[] }; process: { valid: boolean; issues: string[] }; output: { valid: boolean; issues: string[] } }): void {
  const icon = (valid: boolean) => valid ? c('green', 'PASS') : c('red', 'FAIL');
  console.log('');
  console.log(c('yellow', '  --- SIPO 品質ゲート ---'));
  console.log(`  S (Source):  ${icon(result.source.valid)}  ${result.source.issues.join(', ') || 'OK'}`);
  console.log(`  I (Input):   ${icon(result.input.valid)}  ${result.input.issues.join(', ') || 'OK'}`);
  console.log(`  P (Process): ${icon(result.process.valid)}  ${result.process.issues.join(', ') || 'OK'}`);
  console.log(`  O (Output):  ${icon(result.output.valid)}  ${result.output.issues.join(', ') || 'OK'}`);
  console.log(`  総合: ${result.passed ? c('green', 'PASSED') : c('red', 'FAILED')}`);
  console.log('');
}

function printProgress(step: number, total: number, description: string): void {
  const bar = '\u2588'.repeat(step) + '\u2591'.repeat(total - step);
  console.log(c('dim', `  [${bar}] ${step}/${total} ${description}`));
}

// ---------------------------------------------------------------------------
// チャット CLI
// ---------------------------------------------------------------------------

export class ChatCLI {
  private angel: ArchangelDefinition;
  private session: ChatSession;
  private config: OrchestratorConfig;
  private rl: ReadlineInterface | null = null;

  constructor(angelId: ArchangelId, config?: Partial<OrchestratorConfig>) {
    this.angel = ARCHANGELS[angelId];
    if (!this.angel) {
      throw new Error(`Unknown archangel: ${angelId}`);
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.session = createSession(angelId);
  }

  /** チャットループを開始 */
  async start(): Promise<void> {
    printBanner(this.angel);

    // 初期あいさつ
    const greeting = await this.getAngelGreeting();
    addMessage(this.session, this.angel.id, greeting);
    console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: `) + greeting);
    console.log('');

    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const promptStr = c('blue', `  You > `);

    const askQuestion = (): void => {
      this.rl!.question(promptStr, async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
          askQuestion();
          return;
        }

        try {
          const shouldContinue = await this.handleInput(trimmed);
          if (!shouldContinue) {
            this.rl!.close();
            return;
          }
        } catch (error) {
          console.error(c('red', `  Error: ${error instanceof Error ? error.message : error}`));
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  /** ユーザー入力を処理 */
  private async handleInput(input: string): Promise<boolean> {
    // コマンド処理
    if (input.startsWith('/')) {
      return this.handleCommand(input);
    }

    // 通常の対話
    addMessage(this.session, 'user', input);

    console.log('');
    console.log(c('dim', '  考え中...'));

    const response = await this.chat(input);
    addMessage(this.session, this.angel.id, response);

    console.log('');
    console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: `) + response);
    console.log('');

    return true;
  }

  /** コマンドを処理 */
  private async handleCommand(input: string): Promise<boolean> {
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (cmd) {
      case '/exit':
      case '/quit':
        console.log('');
        console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: またいつでもお声がけください。`));
        console.log('');
        await this.saveCurrentSession();
        return false;

      case '/help':
        printBanner(this.angel);
        return true;

      case '/status':
        this.printTaskStatus();
        return true;

      case '/history':
        this.printHistory();
        return true;

      case '/save':
        await this.saveCurrentSession();
        console.log(c('green', '  セッションを保存しました。'));
        return true;

      default: {
        // チーム固有のコマンド
        const teamCmd = this.angel.commands.find(c => c.name === cmd);
        if (teamCmd) {
          await this.handleTeamCommand(cmd, args);
          return true;
        }

        // フルパイプライン系
        if (cmd === '/fullpipeline' || cmd === '/healthcheck' || cmd === '/fullflow' || cmd === '/fullbuild') {
          await this.runFullPipeline(args);
          return true;
        }

        console.log(c('red', `  不明なコマンド: ${cmd}`));
        console.log(c('dim', '  /help でコマンド一覧を確認'));
        return true;
      }
    }
  }

  /** チーム固有のコマンドを実行 */
  private async handleTeamCommand(cmd: string, args: string): Promise<void> {
    if (!args) {
      const cmdDef = this.angel.commands.find(c => c.name === cmd);
      if (cmdDef) {
        console.log(c('dim', `  使い方: ${cmdDef.usage}`));
      }
      return;
    }

    // コマンドに対応するサブエージェントを特定
    const subAgentMapping = this.getSubAgentForCommand(cmd);
    if (!subAgentMapping) {
      // マッピングがない場合はチーム全体として対話
      addMessage(this.session, 'user', `${cmd} ${args}`);
      const response = await this.chat(`コマンド ${cmd} を実行してください: ${args}`);
      addMessage(this.session, this.angel.id, response);
      console.log('');
      console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: `) + response);
      console.log('');
      return;
    }

    const subAgent = this.angel.subAgents.find(sa => sa.role === subAgentMapping);
    if (!subAgent) return;

    addMessage(this.session, 'user', `${cmd} ${args}`);

    console.log('');
    console.log(c('dim', `  ${subAgent.nameJa} を起動中...`));

    if (this.config.dryRun) {
      console.log(c('yellow', '  [DRY RUN] API コールをスキップ'));
      const mockResult = `[DRY RUN] ${subAgent.nameJa} が「${args}」を分析します。\n\n実際の実行には .env に ANTHROPIC_API_KEY を設定してください。`;
      addMessage(this.session, this.angel.id, mockResult, { subAgentRole: subAgent.role });
      printAgentReport(this.angel, subAgent.role, mockResult, 0);
      return;
    }

    const result = await runSubAgent(
      this.angel.systemPrompt,
      subAgent,
      args,
      [], // 前工程なし（単独実行）
      { model: this.config.model },
    );

    addMessage(this.session, this.angel.id, result.output, { subAgentRole: subAgent.role });
    printAgentReport(this.angel, subAgent.role, result.output, result.durationMs);

    // SIPO ゲート
    if (this.config.enableSipoGate) {
      console.log(c('dim', '  SIPO 品質ゲートを実行中...'));
      const sipoResult = await runSipoGate(result.output, args, { model: this.config.model });
      printSipoResult(sipoResult);
    }
  }

  /** フルパイプライン実行 */
  private async runFullPipeline(taskDescription: string): Promise<void> {
    if (!taskDescription) {
      console.log(c('dim', '  タスクの説明を入力してください。'));
      return;
    }

    addMessage(this.session, 'user', taskDescription);

    console.log('');
    console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: タスクを分析し、実行計画を作成します...`));

    // 1. タスク計画の生成
    let plan: TaskPlan;
    if (this.config.dryRun) {
      plan = {
        steps: this.angel.subAgents.map((sa, i) => ({
          index: i,
          description: `${sa.nameJa}による分析`,
          subAgentRole: sa.role,
          status: 'pending' as const,
        })),
        estimatedSteps: this.angel.subAgents.length,
        currentStep: 0,
      };
    } else {
      plan = await generateTaskPlan(this.angel, taskDescription, { model: this.config.model });
    }

    const task: TaskContext = {
      id: `task-${Date.now()}`,
      description: taskDescription,
      status: 'planning',
      plan,
      results: [],
      createdAt: new Date().toISOString(),
    };
    this.session.activeTask = task;

    console.log('');
    console.log(c('cyan', '  実行計画:'));
    for (const step of plan.steps) {
      const sa = this.angel.subAgents.find(a => a.role === step.subAgentRole);
      console.log(`  ${c('dim', `${step.index + 1}.`)} ${sa?.nameJa ?? step.subAgentRole}: ${step.description}`);
    }
    console.log('');

    // 2. パイプライン実行
    task.status = 'executing';
    const allResults: SubAgentResult[] = [];

    for (const step of plan.steps) {
      step.status = 'running';
      printProgress(step.index, plan.steps.length, step.description);

      const subAgent = this.angel.subAgents.find(sa => sa.role === step.subAgentRole);
      if (!subAgent) {
        step.status = 'failed';
        continue;
      }

      if (this.config.dryRun) {
        const mockResult: SubAgentResult = {
          role: subAgent.role,
          output: `[DRY RUN] ${subAgent.nameJa}: ${step.description}`,
          durationMs: 0,
        };
        allResults.push(mockResult);
        step.status = 'completed';
        step.output = mockResult.output;
        printAgentReport(this.angel, subAgent.role, mockResult.output, 0);
        continue;
      }

      try {
        const result = await runSubAgent(
          this.angel.systemPrompt,
          subAgent,
          `## タスク\n${taskDescription}\n\n## このステップの目的\n${step.description}`,
          allResults, // 前工程の結果を渡す
          { model: this.config.model },
        );
        allResults.push(result);
        task.results.push(result);
        step.status = 'completed';
        step.output = result.output;
        printAgentReport(this.angel, subAgent.role, result.output, result.durationMs);
      } catch (error) {
        step.status = 'failed';
        console.error(c('red', `  ${subAgent.nameJa} でエラー: ${error instanceof Error ? error.message : error}`));
      }
    }

    // 3. 総合レポート
    printProgress(plan.steps.length, plan.steps.length, '完了');
    task.status = 'completed';

    console.log('');
    console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa}: 全工程が完了しました。`));

    // SIPO ゲート（最終出力に対して）
    if (this.config.enableSipoGate && allResults.length > 0 && !this.config.dryRun) {
      console.log(c('dim', '  最終出力の SIPO 品質ゲートを実行中...'));
      const finalOutput = allResults.map(r => r.output).join('\n\n');
      const sipoResult = await runSipoGate(finalOutput, taskDescription, { model: this.config.model });
      printSipoResult(sipoResult);
    }

    // 総合まとめを Claude に生成させる
    if (!this.config.dryRun && allResults.length > 0) {
      const summaryPrompt = `以下の各サブエージェントの報告を総合的にまとめて、経営者向けの簡潔なレポートを作成してください。
次のアクション（推奨事項）を 3 つ以内で提示してください。

${allResults.map(r => `## ${r.role}\n${r.output}`).join('\n\n')}`;

      const { text: summary } = await sendToClaudeAPI(
        this.angel.systemPrompt,
        [{ role: 'user', content: summaryPrompt }],
        { model: this.config.model },
      );

      addMessage(this.session, this.angel.id, summary);
      console.log('');
      console.log(c('gold', `  ${this.angel.emoji} ${this.angel.nameJa} [総合レポート]:`));
      console.log('');
      for (const line of summary.split('\n')) {
        console.log(`  ${line}`);
      }
      console.log('');
    }

    console.log(c('dim', '  次の指示をお待ちしています。'));
    console.log('');
  }

  /** 通常の対話 */
  private async chat(userMessage: string): Promise<string> {
    if (this.config.dryRun) {
      return `[DRY RUN] ${this.angel.nameJa}がメッセージを受信しました: "${userMessage.slice(0, 50)}..."`;
    }

    const messages = sessionToApiMessages(this.session);
    // 最後の user メッセージが含まれていなければ追加
    if (messages.length === 0 || messages[messages.length - 1].content !== userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    const { text } = await sendToClaudeAPI(
      this.angel.systemPrompt,
      messages,
      { model: this.config.model },
    );

    return text;
  }

  /** 初期あいさつを生成 */
  private async getAngelGreeting(): Promise<string> {
    if (this.config.dryRun) {
      return `${this.angel.nameJa}です。${this.angel.teamNameJa}を担当しています。何でもお聞きください。\n（DRY RUN モード — API コールは行いません）`;
    }

    const { text } = await sendToClaudeAPI(
      this.angel.systemPrompt,
      [{
        role: 'user',
        content: 'チャットセッション開始です。簡潔な自己紹介（2-3文）と、今日できることを簡潔に伝えてください。',
      }],
      { model: this.config.model, maxTokens: 512 },
    );

    return text;
  }

  /** コマンドとサブエージェントのマッピング */
  private getSubAgentForCommand(cmd: string): string | null {
    const mapping: Record<string, Record<string, string>> = {
      michael: {
        '/research': 'market_researcher',
        '/compete': 'market_researcher',
        '/ideate': 'idea_generator',
        '/prd': 'product_planner',
        '/feasibility': 'feasibility_analyst',
      },
      raphael: {
        '/review': 'code_reviewer',
        '/test': 'test_engineer',
        '/perf': 'performance_auditor',
        '/docs': 'doc_maintainer',
        '/security': 'code_reviewer',
        '/upgrade': 'performance_auditor',
      },
      gabriel: {
        '/analyze': 'request_analyst',
        '/design': 'solution_architect',
        '/spec': 'spec_writer',
        '/acceptance': 'acceptance_tester',
        '/impact': 'solution_architect',
        '/batch': 'request_analyst',
      },
      uriel: {
        '/build': 'tool_builder',
        '/proto': 'rapid_prototyper',
        '/integrate': 'integrator',
        '/automate': 'rapid_prototyper',
        '/extend': 'tool_builder',
      },
    };

    return mapping[this.angel.id]?.[cmd] ?? null;
  }

  /** タスク状態の表示 */
  private printTaskStatus(): void {
    const task = this.session.activeTask;
    if (!task) {
      console.log(c('dim', '  実行中のタスクはありません。'));
      return;
    }

    console.log('');
    console.log(c('cyan', `  タスク: ${task.description}`));
    console.log(`  状態: ${task.status}`);
    if (task.plan) {
      console.log(`  進捗: ${task.plan.currentStep}/${task.plan.estimatedSteps}`);
      for (const step of task.plan.steps) {
        const icon = step.status === 'completed' ? c('green', 'done')
          : step.status === 'running' ? c('yellow', '...')
          : step.status === 'failed' ? c('red', 'FAIL')
          : c('dim', 'wait');
        console.log(`    [${icon}] ${step.description}`);
      }
    }
    console.log('');
  }

  /** チャット履歴の表示 */
  private printHistory(): void {
    if (this.session.messages.length === 0) {
      console.log(c('dim', '  履歴はありません。'));
      return;
    }

    console.log('');
    console.log(c('cyan', `  チャット履歴 (${this.session.messages.length} 件):`));
    for (const msg of this.session.messages.slice(-20)) {
      const time = msg.timestamp.slice(11, 19);
      const sender = msg.sender === 'user'
        ? c('blue', 'You')
        : c('gold', this.angel.nameJa);
      const preview = msg.content.slice(0, 80).replace(/\n/g, ' ');
      console.log(`  ${c('dim', time)} ${sender}: ${preview}${msg.content.length > 80 ? '...' : ''}`);
    }
    console.log('');
  }

  /** セッション保存 */
  private async saveCurrentSession(): Promise<void> {
    saveSession(this.session, this.config.sessionDir);
  }
}
