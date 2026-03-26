#!/usr/bin/env npx tsx
// =============================================================================
// HARMONIC Agent Orchestrator — メイン CLI エントリポイント
// =============================================================================
//
// 使い方:
//   npx tsx src/cli.ts                    # チーム選択メニュー
//   npx tsx src/cli.ts michael            # Michael と直接チャット開始
//   npx tsx src/cli.ts raphael            # Raphael と直接チャット開始
//   npx tsx src/cli.ts gabriel            # Gabriel と直接チャット開始
//   npx tsx src/cli.ts uriel              # Uriel と直接チャット開始
//   npx tsx src/cli.ts --dry-run michael  # DRY RUN モード
//   npx tsx src/cli.ts --list             # チーム一覧
//
// =============================================================================

import { createInterface } from 'node:readline';
import { ChatCLI, ARCHANGELS } from './chat.js';
import type { ArchangelId, OrchestratorConfig } from './types.js';

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gold: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
} as const;

function c(color: keyof typeof COLORS, text: string): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printMainBanner(): void {
  console.log('');
  console.log(c('gold', '  ================================================================'));
  console.log(c('gold', '    HARMONIC Agent Orchestrator'));
  console.log(c('gold', '    AI \u30a8\u30fc\u30b8\u30a7\u30f3\u30c8\u30c1\u30fc\u30e0\u7d71\u62ec\u30b7\u30b9\u30c6\u30e0'));
  console.log(c('gold', '  ================================================================'));
  console.log('');
  console.log(c('dim', '  4 \u4f53\u306e\u5929\u4f7f\u30a8\u30fc\u30b8\u30a7\u30f3\u30c8\u304c\u3042\u306a\u305f\u306e\u88fd\u54c1\u958b\u767a\u3092\u652f\u63f4\u3057\u307e\u3059\u3002'));
  console.log(c('dim', '  \u5bfe\u8a71\u3057\u305f\u3044\u30c1\u30fc\u30e0\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002'));
  console.log('');
}

function printTeamList(): void {
  const teams: Array<{ key: string; id: ArchangelId }> = [
    { key: '1', id: 'michael' },
    { key: '2', id: 'raphael' },
    { key: '3', id: 'gabriel' },
    { key: '4', id: 'uriel' },
  ];

  for (const { key, id } of teams) {
    const angel = ARCHANGELS[id];
    console.log(`  ${c('cyan', `[${key}]`)} ${angel.emoji}  ${c('bold', angel.nameJa)} (${angel.nameEn})`);
    console.log(`      ${c('dim', angel.teamNameJa)}`);
    console.log(`      ${c('dim', angel.description.slice(0, 60) + '...')}`);
    console.log('');
  }

  console.log(`  ${c('cyan', '[q]')} \u7d42\u4e86`);
  console.log('');
}

// ---------------------------------------------------------------------------
// CLI \u5f15\u6570\u30d1\u30fc\u30b9
// ---------------------------------------------------------------------------

interface CliArgs {
  archangelId?: ArchangelId;
  dryRun: boolean;
  verbose: boolean;
  list: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    dryRun: false,
    verbose: false,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
      case '-n':
        result.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--list':
      case '-l':
        result.list = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (!args[i].startsWith('-') && isArchangelId(args[i])) {
          result.archangelId = args[i] as ArchangelId;
        }
    }
  }

  return result;
}

function isArchangelId(value: string): value is ArchangelId {
  return ['michael', 'raphael', 'gabriel', 'uriel'].includes(value);
}

function printHelp(): void {
  console.log(`
  HARMONIC Agent Orchestrator

  \u4f7f\u3044\u65b9:
    npx tsx src/cli.ts [options] [archangel]

  \u5929\u4f7f\u30a8\u30fc\u30b8\u30a7\u30f3\u30c8:
    michael     \u30df\u30ab\u30a8\u30eb \u2014 \u5e02\u5834\u8abf\u67fb\u30fb\u65b0\u88fd\u54c1\u4f01\u753b
    raphael     \u30e9\u30d5\u30a1\u30a8\u30eb \u2014 \u65e2\u5b58\u88fd\u54c1\u30e1\u30f3\u30c6\u30ca\u30f3\u30b9
    gabriel     \u30ac\u30d6\u30ea\u30a8\u30eb \u2014 \u9867\u5ba2\u8981\u671b\u5b9f\u73fe
    uriel       \u30a6\u30ea\u30a8\u30eb   \u2014 \u793e\u5185\u30c4\u30fc\u30eb\u958b\u767a

  \u30aa\u30d7\u30b7\u30e7\u30f3:
    --dry-run, -n     API \u30b3\u30fc\u30eb\u306a\u3057\u3067\u30c6\u30b9\u30c8\u5b9f\u884c
    --verbose, -v     \u8a73\u7d30\u30ed\u30b0\u51fa\u529b
    --list, -l        \u30c1\u30fc\u30e0\u4e00\u89a7\u3092\u8868\u793a
    --help, -h        \u30d8\u30eb\u30d7

  \u4f8b:
    npx tsx src/cli.ts michael              # \u30df\u30ab\u30a8\u30eb\u3068\u30c1\u30e3\u30c3\u30c8
    npx tsx src/cli.ts --dry-run raphael    # \u30e9\u30d5\u30a1\u30a8\u30eb (DRY RUN)
    npx tsx src/cli.ts                      # \u30c1\u30fc\u30e0\u9078\u629e\u30e1\u30cb\u30e5\u30fc
`);
}

// ---------------------------------------------------------------------------
// \u30e1\u30a4\u30f3
// ---------------------------------------------------------------------------

async function selectTeam(): Promise<ArchangelId | null> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    const mapping: Record<string, ArchangelId> = {
      '1': 'michael',
      '2': 'raphael',
      '3': 'gabriel',
      '4': 'uriel',
      'michael': 'michael',
      'raphael': 'raphael',
      'gabriel': 'gabriel',
      'uriel': 'uriel',
    };

    rl.question(c('blue', '  \u30c1\u30fc\u30e0\u3092\u9078\u629e (1-4 or \u540d\u524d): '), answer => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === 'q' || trimmed === 'quit' || trimmed === 'exit') {
        resolve(null);
        return;
      }
      resolve(mapping[trimmed] ?? null);
    });
  });
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    return;
  }

  if (args.list) {
    printMainBanner();
    printTeamList();
    return;
  }

  let archangelId = args.archangelId;

  // \u30c1\u30fc\u30e0\u304c\u6307\u5b9a\u3055\u308c\u3066\u3044\u306a\u3044\u5834\u5408\u306f\u9078\u629e\u30e1\u30cb\u30e5\u30fc
  if (!archangelId) {
    printMainBanner();
    printTeamList();
    archangelId = await selectTeam();
    if (!archangelId) {
      console.log(c('dim', '  \u7d42\u4e86\u3057\u307e\u3059\u3002'));
      return;
    }
  }

  const configOverrides: Partial<OrchestratorConfig> = {};
  if (args.dryRun) configOverrides.dryRun = true;
  if (args.verbose) configOverrides.verbose = true;

  const chat = new ChatCLI(archangelId, configOverrides);
  await chat.start();
}

main().catch(error => {
  console.error(`\u4E88\u671F\u3057\u306A\u3044\u30A8\u30E9\u30FC: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
