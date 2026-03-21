import React from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import { colors } from '../theme';
import { BusinessTask, TeamMember, Category, CATEGORIES } from '../data/types';

interface TimelineViewProps {
  tasks: BusinessTask[];
  members: TeamMember[];
  months?: number;
  onTaskClick?: (task: BusinessTask) => void;
}

interface MonthColumn { year: number; month: number; label: string; startMs: number; endMs: number; }

const ROW_HEIGHT = 28;
const LABEL_WIDTH_DESKTOP = 200;
const LABEL_WIDTH_MOBILE = 120;
const MONTH_WIDTH_DESKTOP = 120;
const MONTH_WIDTH_MOBILE = 80;

const getOpacityForStatus = (status: string): number => {
  switch (status) {
    case 'done': return 0.4;
    case 'in_progress': return 1.0;
    case 'review': return 0.85;
    default: return 0.7;
  }
};

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, members, months = 6, onTaskClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const LABEL_WIDTH = isMobile ? LABEL_WIDTH_MOBILE : LABEL_WIDTH_DESKTOP;
  const MONTH_WIDTH = isMobile ? MONTH_WIDTH_MOBILE : MONTH_WIDTH_DESKTOP;

  const monthColumns = React.useMemo((): MonthColumn[] => {
    const cols: MonthColumn[] = [];
    const now = new Date();
    const startMonth = now.getMonth() - 1;
    const startYear = now.getFullYear();
    for (let i = 0; i < months; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      const year = d.getFullYear(); const month = d.getMonth();
      const nextMonth = new Date(year, month + 1, 1);
      cols.push({ year, month, label: `${year}/${String(month + 1).padStart(2, '0')}`, startMs: d.getTime(), endMs: nextMonth.getTime() - 1 });
    }
    return cols;
  }, [months]);

  const timelineStartMs = monthColumns[0]?.startMs ?? 0;
  const timelineEndMs = monthColumns[monthColumns.length - 1]?.endMs ?? 0;
  const timelineTotalMs = timelineEndMs - timelineStartMs;

  const groupedByCat = React.useMemo(() => {
    const groups: { cat: Category; catColor: string; tasks: BusinessTask[] }[] = [];
    const catMap = new Map<Category, BusinessTask[]>();
    tasks.forEach((t) => { if (!catMap.has(t.category)) catMap.set(t.category, []); catMap.get(t.category)!.push(t); });
    CATEGORIES.forEach((c) => {
      const catTasks = catMap.get(c.name);
      if (catTasks && catTasks.length > 0) groups.push({ cat: c.name, catColor: c.color, tasks: catTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)) });
    });
    return groups;
  }, [tasks]);

  const nowMs = Date.now();
  const nowPct = timelineTotalMs > 0 ? ((nowMs - timelineStartMs) / timelineTotalMs) * 100 : -1;
  const showNowLine = nowPct >= 0 && nowPct <= 100;

  const getBarPosition = (task: BusinessTask) => {
    const dueMs = new Date(task.dueDate + 'T00:00:00').getTime();
    if (task.startDate) {
      const startMs = new Date(task.startDate + 'T00:00:00').getTime();
      const leftPct = Math.max(0, ((startMs - timelineStartMs) / timelineTotalMs) * 100);
      const rightPct = Math.min(100, ((dueMs - timelineStartMs) / timelineTotalMs) * 100);
      return { type: 'bar' as const, leftPct, widthPct: Math.max(0.5, rightPct - leftPct) };
    }
    const pct = ((dueMs - timelineStartMs) / timelineTotalMs) * 100;
    return { type: 'dot' as const, leftPct: Math.max(0, Math.min(100, pct)), widthPct: 0 };
  };

  const totalWidth = monthColumns.length * MONTH_WIDTH;

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${colors.ivory[400]}`, borderRadius: '8px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, flexShrink: 0, borderRight: `1px solid ${colors.ivory[400]}`, bgcolor: colors.ivory[50] }}>
          <Box sx={{ height: 36, borderBottom: `1px solid ${colors.ivory[400]}`, display: 'flex', alignItems: 'center', px: 1.5 }}>
            <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 600, color: colors.brown[500] }}>タスク</Typography>
          </Box>
          {groupedByCat.map((group) => (
            <React.Fragment key={group.cat}>
              <Box sx={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', gap: 0.75, px: isMobile ? 0.75 : 1.5, bgcolor: `${group.catColor}0C`, borderBottom: `1px solid ${colors.ivory[300]}` }}>
                <Box sx={{ width: 6, height: 14, borderRadius: '2px', bgcolor: group.catColor, flexShrink: 0 }} />
                <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700, color: group.catColor }}>{group.cat}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: colors.brown[400], ml: 'auto', fontVariantNumeric: 'tabular-nums' }}>{group.tasks.length}</Typography>
              </Box>
              {group.tasks.map((task) => (
                <Box key={task.id} sx={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', px: isMobile ? 0.75 : 1.5, pl: isMobile ? 1.5 : 3, borderBottom: `1px solid ${colors.ivory[200]}`, cursor: onTaskClick ? 'pointer' : 'default', '&:hover': onTaskClick ? { bgcolor: colors.ivory[100] } : {} }} onClick={onTaskClick ? () => onTaskClick(task) : undefined}>
                  <Typography sx={{ fontSize: isMobile ? '0.62rem' : '0.7rem', color: colors.brown[700], fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.title}</Typography>
                </Box>
              ))}
            </React.Fragment>
          ))}
        </Box>
        <Box sx={{ flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: colors.ivory[400], borderRadius: 3 } }}>
          <Box sx={{ width: totalWidth, position: 'relative' }}>
            <Box sx={{ display: 'flex', height: 36, borderBottom: `1px solid ${colors.ivory[400]}` }}>
              {monthColumns.map((col, i) => {
                const isCurrentMonth = col.year === new Date().getFullYear() && col.month === new Date().getMonth();
                return (
                  <Box key={i} sx={{ width: MONTH_WIDTH, minWidth: MONTH_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${colors.ivory[300]}`, bgcolor: isCurrentMonth ? `${colors.ivory[300]}60` : 'transparent' }}>
                    <Typography sx={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: isCurrentMonth ? 700 : 500, fontVariantNumeric: 'tabular-nums', color: isCurrentMonth ? colors.brown[700] : colors.brown[500] }}>{col.label}</Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ position: 'relative' }}>
              {monthColumns.map((_, i) => (<Box key={`grid-${i}`} sx={{ position: 'absolute', top: 0, bottom: 0, left: i * MONTH_WIDTH, width: 1, bgcolor: colors.ivory[300], zIndex: 0 }} />))}
              {showNowLine && <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: `${nowPct}%`, width: 1.5, borderLeft: '1.5px dashed #b5453a', zIndex: 3, pointerEvents: 'none' }} />}
              {groupedByCat.map((group) => (
                <React.Fragment key={group.cat}>
                  <Box sx={{ height: ROW_HEIGHT, bgcolor: `${group.catColor}0C`, borderBottom: `1px solid ${colors.ivory[300]}` }} />
                  {group.tasks.map((task) => {
                    const pos = getBarPosition(task);
                    const opacity = getOpacityForStatus(task.status);
                    return (
                      <Box key={task.id} sx={{ height: ROW_HEIGHT, position: 'relative', borderBottom: `1px solid ${colors.ivory[200]}`, cursor: onTaskClick ? 'pointer' : 'default', '&:hover': onTaskClick ? { bgcolor: `${colors.ivory[200]}80` } : {} }} onClick={onTaskClick ? () => onTaskClick(task) : undefined}>
                        {pos.type === 'bar' ? (
                          <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${pos.leftPct}%`, width: `${pos.widthPct}%`, height: 10, bgcolor: group.catColor, borderRadius: '4px', opacity, minWidth: 6 }} />
                        ) : (
                          <Box sx={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: `${pos.leftPct}%`, width: 8, height: 8, borderRadius: '50%', bgcolor: group.catColor, opacity }} />
                        )}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default TimelineView;
