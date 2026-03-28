/**
 * ヘルスチェック & 統計表示
 *
 * 起動: npm run health
 */

import { getQueue, getQueueStats, closeQueue } from './queue.js';

async function main() {
  try {
    const stats = await getQueueStats();
    const queue = getQueue();
    const isPaused = await queue.isPaused();

    console.log('=== Harmonic Job Queue Health ===');
    console.log(`Queue:     ${queue.name}`);
    console.log(`Status:    ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
    console.log('');
    console.log('--- Job Counts ---');
    console.log(`Waiting:   ${stats.waiting}`);
    console.log(`Active:    ${stats.active}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`Failed:    ${stats.failed}`);
    console.log(`Delayed:   ${stats.delayed}`);
    console.log('');

    // 最近の失敗ジョブを表示
    const failedJobs = await queue.getFailed(0, 5);
    if (failedJobs.length > 0) {
      console.log('--- Recent Failures ---');
      for (const job of failedJobs) {
        console.log(`  ${job.id}: ${job.failedReason} (attempts: ${job.attemptsMade})`);
      }
    }

    await closeQueue();
    process.exit(0);
  } catch (err) {
    console.error('Health check failed:', err);
    console.error('Is Redis running?');
    process.exit(1);
  }
}

main();
