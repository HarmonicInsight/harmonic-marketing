/**
 * CLI からジョブを手動投入するユーティリティ
 *
 * 起動: npm run enqueue -- --file /path/to/file.xlsx --type file_analysis
 */

import { submitAnalysis, submitDiff } from './producer.js';
import { closeQueue } from './queue.js';

function usage() {
  console.log(`
Usage:
  npm run enqueue -- --file <path> [--prompt <text>] [--priority high|normal|low]
  npm run enqueue -- --diff <base> <target> [--focus <areas>]

Examples:
  npm run enqueue -- --file /data/report.xlsx
  npm run enqueue -- --file /data/report.xlsx --prompt "売上推移を分析"
  npm run enqueue -- --diff /data/v1.xlsx /data/v2.xlsx --focus "Sheet1,Sheet2"
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    usage();
    process.exit(0);
  }

  try {
    if (args.includes('--diff')) {
      const diffIdx = args.indexOf('--diff');
      const base = args[diffIdx + 1];
      const target = args[diffIdx + 2];
      if (!base || !target) {
        console.error('Error: --diff requires <base> <target>');
        process.exit(1);
      }
      const focusIdx = args.indexOf('--focus');
      const focusAreas = focusIdx >= 0 ? args[focusIdx + 1]?.split(',') : undefined;

      const jobId = await submitDiff(base, target, { focusAreas });
      console.log(`Diff analysis job enqueued: ${jobId}`);

    } else if (args.includes('--file')) {
      const fileIdx = args.indexOf('--file');
      const filePath = args[fileIdx + 1];
      if (!filePath) {
        console.error('Error: --file requires a path');
        process.exit(1);
      }

      const promptIdx = args.indexOf('--prompt');
      const analysisPrompt = promptIdx >= 0 ? args[promptIdx + 1] : undefined;

      const priorityIdx = args.indexOf('--priority');
      const priority = (priorityIdx >= 0 ? args[priorityIdx + 1] : 'normal') as 'high' | 'normal' | 'low';

      const fileName = filePath.split('/').pop() ?? filePath;
      const ext = fileName.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        pdf: 'application/pdf',
        csv: 'text/csv',
      };
      const mimeType = mimeMap[ext ?? ''] ?? 'application/octet-stream';

      const jobId = await submitAnalysis(filePath, fileName, mimeType, {
        analysisPrompt,
        priority,
      });
      console.log(`Analysis job enqueued: ${jobId}`);

    } else {
      usage();
      process.exit(1);
    }

    await closeQueue();
  } catch (err) {
    console.error('Failed to enqueue job:', err);
    process.exit(1);
  }
}

main();
