import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, IconButton, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Switch, FormControlLabel, Tooltip, Badge, Divider,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ReportIcon from '@mui/icons-material/Report';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { colors } from '../theme';
import {
  BusinessTask, TeamMember, REMINDER_TIMING_CONFIG, ESCALATION_CONFIG,
  EscalationLevel, ReminderLog, TaskReminderConfig,
} from '../data/types';
import {
  evaluateReminders, sendReminder, acknowledgeReminder,
  calculateComplianceStats, calculateOverallStats,
  loadReminderConfigs, saveReminderConfigs,
  loadReminderLogs, saveReminderLogs,
  PendingReminder,
} from '../data/reminderEngine';

interface ReminderDashboardProps {
  tasks: BusinessTask[];
  members: TeamMember[];
}

const EscalationIcon: React.FC<{ level: EscalationLevel }> = ({ level }) => {
  const cfg = ESCALATION_CONFIG[level];
  if (level === 1) return <NotificationsActiveIcon sx={{ fontSize: 16, color: cfg.color }} />;
  if (level === 2) return <PriorityHighIcon sx={{ fontSize: 16, color: cfg.color }} />;
  if (level === 3) return <ReportIcon sx={{ fontSize: 16, color: cfg.color }} />;
  return null;
};

const ReminderDashboard: React.FC<ReminderDashboardProps> = ({ tasks, members }) => {
  const [configs, setConfigs] = useState<TaskReminderConfig[]>(() => loadReminderConfigs());
  const [logs, setLogs] = useState<ReminderLog[]>(() => loadReminderLogs());
  const [tab, setTab] = useState<'pending' | 'history' | 'compliance'>('pending');

  const today = new Date().toISOString().slice(0, 10);

  const pending = useMemo(
    () => evaluateReminders(tasks, configs, logs, today),
    [tasks, configs, logs, today],
  );

  const overallStats = useMemo(
    () => calculateOverallStats(tasks, logs, today),
    [tasks, logs, today],
  );

  const complianceStats = useMemo(
    () => calculateComplianceStats(tasks, logs),
    [tasks, logs],
  );

  const handleSendReminder = useCallback((p: PendingReminder) => {
    const newLogs = sendReminder(p, logs, configs);
    setLogs(newLogs);
    saveReminderLogs(newLogs);
  }, [logs, configs]);

  const handleSendAll = useCallback(() => {
    let currentLogs = logs;
    for (const p of pending.filter((r) => !r.alreadySent)) {
      currentLogs = sendReminder(p, currentLogs, configs);
    }
    setLogs(currentLogs);
    saveReminderLogs(currentLogs);
  }, [logs, pending, configs]);

  const handleAcknowledge = useCallback((logId: string) => {
    const newLogs = acknowledgeReminder(logId, logs);
    setLogs(newLogs);
    saveReminderLogs(newLogs);
  }, [logs]);

  const pendingUnsent = pending.filter((p) => !p.alreadySent);
  const recentLogs = [...logs].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 50);

  return (
    <Box>
      {/* Overall KPI Strip */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
        gap: '1px', border: `1px solid ${colors.ivory[400]}`, borderRadius: 1,
        bgcolor: colors.ivory[400], overflow: 'hidden', mb: 2,
      }}>
        <KpiBox label="未完了タスク" value={overallStats.totalTasks} color={colors.brown[800]} />
        <KpiBox label="期限超過" value={overallStats.overdueCount} color={overallStats.overdueCount > 0 ? '#b5453a' : '#4a7c59'} />
        <KpiBox label="リマインド送信数" value={overallStats.remindersSent} color="#1976d2" />
        <KpiBox label="対応率" value={`${overallStats.overallComplianceRate}%`} color={overallStats.overallComplianceRate >= 80 ? '#4a7c59' : '#b5453a'} />
        <KpiBox label="要エスカレーション" value={overallStats.chronicallyOverdue.length} color={overallStats.chronicallyOverdue.length > 0 ? '#8b1a1a' : '#4a7c59'} />
      </Box>

      {/* Escalation Breakdown */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {([0, 1, 2, 3] as EscalationLevel[]).map((level) => {
          const cfg = ESCALATION_CONFIG[level];
          const count = overallStats.escalationBreakdown[level];
          return (
            <Chip
              key={level}
              icon={<EscalationIcon level={level} />}
              label={`${cfg.label}: ${count}`}
              size="small"
              sx={{
                fontSize: '0.7rem', fontWeight: 600,
                bgcolor: count > 0 ? `${cfg.color}14` : colors.ivory[100],
                color: cfg.color, borderColor: `${cfg.color}40`,
                border: '1px solid',
              }}
            />
          );
        })}
      </Box>

      {/* Tab Selector */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
        {([
          { key: 'pending' as const, label: '未送信リマインド', badge: pendingUnsent.length },
          { key: 'history' as const, label: '送信履歴', badge: 0 },
          { key: 'compliance' as const, label: '対応状況', badge: 0 },
        ]).map(({ key, label, badge }) => (
          <Badge key={key} badgeContent={badge} color="error"
            invisible={badge === 0}
            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
            <Chip
              label={label} size="small"
              variant={tab === key ? 'filled' : 'outlined'}
              onClick={() => setTab(key)}
              sx={{
                fontWeight: 600, fontSize: '0.72rem',
                bgcolor: tab === key ? colors.brown[600] : undefined,
                color: tab === key ? '#fff' : colors.brown[600],
                borderColor: colors.brown[300],
                cursor: 'pointer',
              }}
            />
          </Badge>
        ))}
      </Box>

      {/* Tab Content */}
      {tab === 'pending' && (
        <PendingTab
          pending={pending}
          tasks={tasks}
          onSend={handleSendReminder}
          onSendAll={handleSendAll}
        />
      )}
      {tab === 'history' && (
        <HistoryTab logs={recentLogs} tasks={tasks} onAcknowledge={handleAcknowledge} />
      )}
      {tab === 'compliance' && (
        <ComplianceTab stats={complianceStats} overallStats={overallStats} tasks={tasks} />
      )}
    </Box>
  );
};

// ─── Sub-components ────────────────────────────────────

function KpiBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box sx={{
      bgcolor: '#fff', py: { xs: 0.8, sm: 1.2 }, px: { xs: 1, sm: 1.5 },
      textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: '0.62rem', color: colors.brown[500], fontWeight: 500, mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: { xs: '1.1rem', sm: '1.4rem' }, fontWeight: 700,
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function PendingTab({
  pending, tasks, onSend, onSendAll,
}: {
  pending: PendingReminder[];
  tasks: BusinessTask[];
  onSend: (p: PendingReminder) => void;
  onSendAll: () => void;
}) {
  const unsent = pending.filter((p) => !p.alreadySent);

  return (
    <Paper sx={{ overflow: 'hidden', border: `1px solid ${colors.ivory[400]}` }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.2, bgcolor: colors.ivory[100], borderBottom: `1px solid ${colors.ivory[400]}`,
      }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.brown[700] }}>
          リマインド対象: {pending.length}件（未送信: {unsent.length}件）
        </Typography>
        {unsent.length > 0 && (
          <Button
            variant="contained" size="small" startIcon={<SendIcon sx={{ fontSize: 14 }} />}
            onClick={onSendAll}
            sx={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
              bgcolor: '#b5453a', '&:hover': { bgcolor: '#8b1a1a' },
            }}
          >
            一括送信
          </Button>
        )}
      </Box>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 480px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 50 }}>段階</TableCell>
              <TableCell>タスク名</TableCell>
              <TableCell sx={{ minWidth: 70 }}>タイミング</TableCell>
              <TableCell sx={{ minWidth: 60 }}>超過日数</TableCell>
              <TableCell sx={{ minWidth: 50 }}>状態</TableCell>
              <TableCell align="center" sx={{ minWidth: 50 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#4a7c59', mb: 0.5 }} />
                  <Typography sx={{ fontSize: '0.82rem', color: colors.brown[400] }}>
                    リマインド対象なし — 全タスク順調です
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {pending.map((p, i) => {
              const timingCfg = REMINDER_TIMING_CONFIG[p.timing];
              const escCfg = ESCALATION_CONFIG[p.escalationLevel];
              return (
                <TableRow key={`${p.task.id}-${i}`} sx={{
                  bgcolor: p.escalationLevel >= 2 ? '#b5453a08' : undefined,
                  '&:hover': { bgcolor: colors.ivory[200] },
                }}>
                  <TableCell sx={{ py: '6px' }}>
                    <Tooltip title={escCfg.label}>
                      <Chip
                        icon={<EscalationIcon level={p.escalationLevel} />}
                        label={escCfg.label}
                        size="small"
                        sx={{
                          height: 22, fontSize: '0.62rem', fontWeight: 600,
                          bgcolor: `${escCfg.color}14`, color: escCfg.color,
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    <Typography sx={{
                      fontSize: '0.8rem', fontWeight: 600, color: colors.brown[800],
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280,
                    }}>
                      {p.task.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    <Chip label={timingCfg.label} size="small" sx={{
                      height: 20, fontSize: '0.65rem', fontWeight: 600,
                      bgcolor: `${timingCfg.color}18`, color: timingCfg.color,
                    }} />
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    <Typography sx={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: p.daysOverdue > 0 ? '#b5453a' : p.daysOverdue === 0 ? '#c17817' : '#4a7c59',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {p.daysOverdue > 0 ? `+${p.daysOverdue}日` : p.daysOverdue === 0 ? '当日' : `${p.daysOverdue}日`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    {p.alreadySent ? (
                      <Chip label="送信済" size="small" sx={{
                        height: 20, fontSize: '0.62rem', fontWeight: 600,
                        bgcolor: '#4a7c5918', color: '#4a7c59',
                      }} />
                    ) : (
                      <Chip label="未送信" size="small" sx={{
                        height: 20, fontSize: '0.62rem', fontWeight: 600,
                        bgcolor: '#c1781718', color: '#c17817',
                      }} />
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: '6px' }}>
                    {!p.alreadySent && (
                      <IconButton size="small" onClick={() => onSend(p)} sx={{ p: 0.5 }}>
                        <SendIcon sx={{ fontSize: 16, color: '#b5453a' }} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function HistoryTab({
  logs, tasks, onAcknowledge,
}: {
  logs: ReminderLog[];
  tasks: BusinessTask[];
  onAcknowledge: (logId: string) => void;
}) {
  const getTaskTitle = (taskId: string) => tasks.find((t) => t.id === taskId)?.title ?? taskId;

  return (
    <Paper sx={{ overflow: 'hidden', border: `1px solid ${colors.ivory[400]}` }}>
      <Box sx={{
        px: 2, py: 1.2, bgcolor: colors.ivory[100], borderBottom: `1px solid ${colors.ivory[400]}`,
      }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.brown[700] }}>
          送信履歴（直近50件）
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 480px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 50 }}>段階</TableCell>
              <TableCell>タスク名</TableCell>
              <TableCell sx={{ minWidth: 100 }}>送信日時</TableCell>
              <TableCell sx={{ minWidth: 60 }}>対応</TableCell>
              <TableCell align="center" sx={{ minWidth: 50 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: colors.brown[400] }}>
                    送信履歴なし
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => {
              const escCfg = ESCALATION_CONFIG[log.escalationLevel];
              return (
                <TableRow key={log.id} sx={{
                  bgcolor: !log.acknowledged ? '#c1781708' : undefined,
                  '&:hover': { bgcolor: colors.ivory[200] },
                }}>
                  <TableCell sx={{ py: '6px' }}>
                    <Chip
                      icon={<EscalationIcon level={log.escalationLevel} />}
                      label={escCfg.label}
                      size="small"
                      sx={{
                        height: 22, fontSize: '0.62rem', fontWeight: 600,
                        bgcolor: `${escCfg.color}14`, color: escCfg.color,
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    <Typography sx={{
                      fontSize: '0.8rem', fontWeight: 600, color: colors.brown[800],
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250,
                    }}>
                      {getTaskTitle(log.taskId)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: colors.brown[500], fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(log.sentAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: '6px' }}>
                    {log.acknowledged ? (
                      <Chip icon={<DoneAllIcon sx={{ fontSize: 12 }} />} label="対応済" size="small" sx={{
                        height: 20, fontSize: '0.62rem', fontWeight: 600,
                        bgcolor: '#4a7c5918', color: '#4a7c59',
                        '& .MuiChip-icon': { color: '#4a7c59' },
                      }} />
                    ) : (
                      <Chip label="未対応" size="small" sx={{
                        height: 20, fontSize: '0.62rem', fontWeight: 600,
                        bgcolor: '#b5453a18', color: '#b5453a',
                      }} />
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: '6px' }}>
                    {!log.acknowledged && (
                      <IconButton size="small" onClick={() => onAcknowledge(log.id)} sx={{ p: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#4a7c59' }} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function ComplianceTab({
  stats, overallStats, tasks,
}: {
  stats: ReturnType<typeof calculateComplianceStats>;
  overallStats: ReturnType<typeof calculateOverallStats>;
  tasks: BusinessTask[];
}) {
  return (
    <Box>
      {/* Chronically overdue alert */}
      {overallStats.chronicallyOverdue.length > 0 && (
        <Paper sx={{
          p: 2, mb: 2, bgcolor: '#b5453a0a',
          border: '1px solid #b5453a30', borderRadius: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingDownIcon sx={{ fontSize: 18, color: '#b5453a' }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#b5453a' }}>
              常習的未対応タスク ({overallStats.chronicallyOverdue.length}件)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {overallStats.chronicallyOverdue.map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? (
                <Typography key={taskId} sx={{ fontSize: '0.75rem', color: colors.brown[700], pl: 3 }}>
                  - {task.title}
                </Typography>
              ) : null;
            })}
          </Box>
        </Paper>
      )}

      {/* Per-task compliance table */}
      <Paper sx={{ overflow: 'hidden', border: `1px solid ${colors.ivory[400]}` }}>
        <Box sx={{
          px: 2, py: 1.2, bgcolor: colors.ivory[100], borderBottom: `1px solid ${colors.ivory[400]}`,
        }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.brown[700] }}>
            タスク別対応率
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 480px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>タスク名</TableCell>
                <TableCell sx={{ minWidth: 60 }}>送信数</TableCell>
                <TableCell sx={{ minWidth: 60 }}>対応数</TableCell>
                <TableCell sx={{ minWidth: 80 }}>対応率</TableCell>
                <TableCell sx={{ minWidth: 70 }}>最高段階</TableCell>
                <TableCell sx={{ minWidth: 80 }}>平均応答</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: colors.brown[400] }}>
                      データなし — リマインドを送信するとここに表示されます
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {stats.map((s) => {
                const rateColor = s.complianceRate >= 80 ? '#4a7c59' : s.complianceRate >= 50 ? '#c17817' : '#b5453a';
                const escCfg = ESCALATION_CONFIG[s.maxEscalationReached];
                return (
                  <TableRow key={s.taskId} sx={{ '&:hover': { bgcolor: colors.ivory[200] } }}>
                    <TableCell sx={{ py: '6px' }}>
                      <Typography sx={{
                        fontSize: '0.8rem', fontWeight: 600, color: colors.brown[800],
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
                      }}>
                        {s.taskTitle}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: '6px' }}>
                      <Typography sx={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', color: colors.brown[600] }}>
                        {s.totalReminders}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: '6px' }}>
                      <Typography sx={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', color: colors.brown[600] }}>
                        {s.acknowledged}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: '6px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ flex: 1, height: 6, bgcolor: colors.ivory[300], borderRadius: 3, overflow: 'hidden' }}>
                          <Box sx={{ width: `${s.complianceRate}%`, height: '100%', bgcolor: rateColor, borderRadius: 3 }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: rateColor, minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>
                          {s.complianceRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: '6px' }}>
                      <Chip
                        icon={<EscalationIcon level={s.maxEscalationReached} />}
                        label={escCfg.label}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.6rem', fontWeight: 600,
                          bgcolor: `${escCfg.color}14`, color: escCfg.color,
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: '6px' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.brown[500], fontVariantNumeric: 'tabular-nums' }}>
                        {s.avgResponseTimeHours !== null ? `${s.avgResponseTimeHours}h` : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default ReminderDashboard;
