import {
  BusinessTask, ReminderLog, TaskReminderConfig, ReminderTiming,
  EscalationLevel, DEFAULT_REMINDER_RULES, REMINDER_TIMING_CONFIG,
} from './types';

const STORAGE_KEYS = {
  reminderConfigs: 'harmonic-reminder-configs',
  reminderLogs: 'harmonic-reminder-logs',
};

// ─── Storage ────────────────────────────────────────────

export function loadReminderConfigs(): TaskReminderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reminderConfigs);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveReminderConfigs(configs: TaskReminderConfig[]) {
  localStorage.setItem(STORAGE_KEYS.reminderConfigs, JSON.stringify(configs));
}

export function loadReminderLogs(): ReminderLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reminderLogs);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveReminderLogs(logs: ReminderLog[]) {
  localStorage.setItem(STORAGE_KEYS.reminderLogs, JSON.stringify(logs));
}

// ─── Config helpers ─────────────────────────────────────

export function getOrCreateConfig(taskId: string, configs: TaskReminderConfig[]): TaskReminderConfig {
  const existing = configs.find((c) => c.taskId === taskId);
  if (existing) return existing;
  return {
    taskId,
    rules: [...DEFAULT_REMINDER_RULES],
    escalationEnabled: true,
    maxEscalationLevel: 3,
  };
}

// ─── Reminder evaluation ────────────────────────────────

function daysDiff(dueDate: string, today: string): number {
  const due = new Date(dueDate + 'T00:00:00').getTime();
  const now = new Date(today + 'T00:00:00').getTime();
  return Math.round((now - due) / 86400000);
}

function getApplicableTiming(daysOverdue: number): ReminderTiming | null {
  if (daysOverdue >= 7) return 'after_7d';
  if (daysOverdue >= 3) return 'after_3d';
  if (daysOverdue >= 1) return 'after_1d';
  if (daysOverdue === 0) return 'on_due';
  if (daysOverdue >= -1) return 'before_1d';
  if (daysOverdue >= -3) return 'before_3d';
  return null;
}

function calculateEscalation(daysOverdue: number): EscalationLevel {
  if (daysOverdue >= 7) return 3;
  if (daysOverdue >= 3) return 2;
  if (daysOverdue >= 1) return 1;
  return 0;
}

export interface PendingReminder {
  task: BusinessTask;
  timing: ReminderTiming;
  escalationLevel: EscalationLevel;
  daysOverdue: number;
  alreadySent: boolean;
}

export function evaluateReminders(
  tasks: BusinessTask[],
  configs: TaskReminderConfig[],
  logs: ReminderLog[],
  today: string,
): PendingReminder[] {
  const results: PendingReminder[] = [];

  for (const task of tasks) {
    if (task.status === 'done') continue;

    const diff = daysDiff(task.dueDate, today);
    const timing = getApplicableTiming(diff);
    if (!timing) continue;

    const config = getOrCreateConfig(task.id, configs);
    const rule = config.rules.find((r) => r.timing === timing);
    if (!rule?.enabled) continue;

    const escalation = config.escalationEnabled
      ? Math.min(calculateEscalation(diff), config.maxEscalationLevel) as EscalationLevel
      : 0 as EscalationLevel;

    const alreadySent = logs.some(
      (l) => l.taskId === task.id && l.timing === timing && l.sentAt.startsWith(today),
    );

    results.push({
      task,
      timing,
      escalationLevel: escalation,
      daysOverdue: diff,
      alreadySent,
    });
  }

  return results.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ─── Send reminder (log it) ─────────────────────────────

export function sendReminder(
  pending: PendingReminder,
  logs: ReminderLog[],
  configs: TaskReminderConfig[],
): ReminderLog[] {
  const config = getOrCreateConfig(pending.task.id, configs);
  const rule = config.rules.find((r) => r.timing === pending.timing);
  const newLog: ReminderLog = {
    id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: pending.task.id,
    sentAt: new Date().toISOString(),
    timing: pending.timing,
    escalationLevel: pending.escalationLevel,
    channel: rule?.channel ?? 'app',
    acknowledged: false,
  };
  return [...logs, newLog];
}

export function acknowledgeReminder(logId: string, logs: ReminderLog[]): ReminderLog[] {
  return logs.map((l) =>
    l.id === logId ? { ...l, acknowledged: true, acknowledgedAt: new Date().toISOString() } : l,
  );
}

// ─── Analytics ──────────────────────────────────────────

export interface TaskComplianceStats {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  totalReminders: number;
  acknowledged: number;
  unacknowledged: number;
  maxEscalationReached: EscalationLevel;
  avgResponseTimeHours: number | null;
  complianceRate: number; // 0-100
}

export function calculateComplianceStats(
  tasks: BusinessTask[],
  logs: ReminderLog[],
): TaskComplianceStats[] {
  const stats: TaskComplianceStats[] = [];

  for (const task of tasks) {
    const taskLogs = logs.filter((l) => l.taskId === task.id);
    if (taskLogs.length === 0) continue;

    const acked = taskLogs.filter((l) => l.acknowledged);
    const unacked = taskLogs.filter((l) => !l.acknowledged);
    const maxEsc = Math.max(0, ...taskLogs.map((l) => l.escalationLevel)) as EscalationLevel;

    let avgResponse: number | null = null;
    if (acked.length > 0) {
      const responseTimes = acked
        .filter((l) => l.acknowledgedAt)
        .map((l) => (new Date(l.acknowledgedAt!).getTime() - new Date(l.sentAt).getTime()) / 3600000);
      avgResponse = responseTimes.length > 0
        ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
        : null;
    }

    stats.push({
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      totalReminders: taskLogs.length,
      acknowledged: acked.length,
      unacknowledged: unacked.length,
      maxEscalationReached: maxEsc,
      avgResponseTimeHours: avgResponse,
      complianceRate: taskLogs.length > 0 ? Math.round((acked.length / taskLogs.length) * 100) : 100,
    });
  }

  return stats.sort((a, b) => a.complianceRate - b.complianceRate);
}

export interface OverallStats {
  totalTasks: number;
  overdueCount: number;
  remindersSent: number;
  acknowledgedCount: number;
  overallComplianceRate: number;
  escalationBreakdown: Record<EscalationLevel, number>;
  chronicallyOverdue: string[]; // task IDs with repeated escalation level 2+
}

export function calculateOverallStats(
  tasks: BusinessTask[],
  logs: ReminderLog[],
  today: string,
): OverallStats {
  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const overdue = activeTasks.filter((t) => t.dueDate < today);
  const acked = logs.filter((l) => l.acknowledged);

  const escalationBreakdown: Record<EscalationLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const log of logs) {
    escalationBreakdown[log.escalationLevel]++;
  }

  const chronicallyOverdue = [...new Set(
    logs.filter((l) => l.escalationLevel >= 2).map((l) => l.taskId),
  )];

  return {
    totalTasks: activeTasks.length,
    overdueCount: overdue.length,
    remindersSent: logs.length,
    acknowledgedCount: acked.length,
    overallComplianceRate: logs.length > 0 ? Math.round((acked.length / logs.length) * 100) : 100,
    escalationBreakdown,
    chronicallyOverdue,
  };
}
