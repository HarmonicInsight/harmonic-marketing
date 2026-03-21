import React from 'react';
import { Box, Typography, Chip, Paper, LinearProgress, IconButton, useMediaQuery, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { colors } from '../theme';
import { BusinessTask, TeamMember, CATEGORIES, PRIORITY_CONFIG } from '../data/types';

interface TaskCardProps {
  task: BusinessTask;
  member?: TeamMember;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const getCatColor = (cat: string): string =>
  CATEGORIES.find((c) => c.name === cat)?.color ?? colors.brown[400];

const formatDueDate = (dueDate: string): { label: string; color: string; bg: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}日超過`, color: '#fff', bg: '#b5453a' };
  if (diffDays === 0) return { label: '本日', color: '#fff', bg: '#c17817' };
  if (diffDays === 1) return { label: '明日', color: colors.brown[700], bg: colors.ivory[300] };
  const d = new Date(dueDate + 'T00:00:00');
  return { label: `${d.getMonth() + 1}/${d.getDate()}`, color: colors.brown[500], bg: 'transparent' };
};

const TaskCard: React.FC<TaskCardProps> = ({ task, member, onClick, onEdit, onDelete, compact = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const catColor = getCatColor(task.category);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const dueFmt = formatDueDate(task.dueDate);
  const showProgress = task.progress > 0 && task.progress < 100;

  if (compact) {
    return (
      <Paper
        onClick={onClick}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
          borderLeft: `3px solid ${catColor}`, cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          '&:hover': onClick ? { boxShadow: '0 2px 8px rgba(93,78,44,0.12)', transform: 'translateY(-1px)' } : {},
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityCfg.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: colors.brown[800], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </Typography>
        <Box sx={{ fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums', color: dueFmt.color, bgcolor: dueFmt.bg, borderRadius: '10px', px: dueFmt.bg !== 'transparent' ? 0.8 : 0, py: 0.1, flexShrink: 0, fontWeight: 500 }}>
          {dueFmt.label}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      onClick={onClick}
      sx={{
        position: 'relative', borderLeft: `3px solid ${catColor}`, borderRadius: '6px', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s ease',
        '&:hover': onClick ? { boxShadow: '0 4px 12px rgba(93,78,44,0.14)', transform: 'translateY(-1px)' } : {},
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.25, pb: showProgress ? 0.5 : 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Chip
            label={task.subCategory}
            size="small"
            sx={{
              height: 18, fontSize: '0.65rem', fontWeight: 600,
              bgcolor: `${catColor}14`, color: catColor, border: `1px solid ${catColor}30`,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {onEdit && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}
                sx={{ p: isMobile ? 0.5 : 0.3, opacity: isMobile ? 0.7 : 0, transition: 'opacity 0.15s', '.MuiPaper-root:hover &': { opacity: 1 }, color: colors.brown[400], '&:hover': { color: colors.brown[700] } }}>
                <EditIcon sx={{ fontSize: isMobile ? 16 : 14 }} />
              </IconButton>
            )}
            {onDelete && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}
                sx={{ p: isMobile ? 0.5 : 0.3, opacity: isMobile ? 0.7 : 0, transition: 'opacity 0.15s', '.MuiPaper-root:hover &': { opacity: 1 }, color: colors.brown[400], '&:hover': { color: '#b5453a' } }}>
                <DeleteOutlineIcon sx={{ fontSize: isMobile ? 16 : 14 }} />
              </IconButton>
            )}
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityCfg.color, flexShrink: 0 }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.brown[800], lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.75 }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip label={task.category} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${catColor}14`, color: catColor, '& .MuiChip-label': { px: 0.5 } }} />
          <Box sx={{ ml: 'auto', flexShrink: 0 }}>
            <Box sx={{ fontSize: '0.68rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: dueFmt.color, bgcolor: dueFmt.bg, borderRadius: '10px', px: dueFmt.bg !== 'transparent' ? 0.8 : 0, py: 0.15, lineHeight: 1.4 }}>
              {dueFmt.label}
            </Box>
          </Box>
        </Box>
      </Box>
      {showProgress && (
        <LinearProgress variant="determinate" value={task.progress}
          sx={{ height: 3, bgcolor: colors.ivory[200], '& .MuiLinearProgress-bar': { bgcolor: catColor } }} />
      )}
    </Paper>
  );
};

export default TaskCard;
