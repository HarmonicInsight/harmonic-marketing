import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { colors } from '../theme';
import { BusinessTask, TeamMember, TaskStatus, STATUS_CONFIG } from '../data/types';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: BusinessTask[];
  members: TeamMember[];
  onTaskClick?: (task: BusinessTask) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, members, onTaskClick, onStatusChange }) => {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<TaskStatus | null>(null);

  const memberMap = React.useMemo(() => {
    const map = new Map<string, TeamMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const groupedTasks = React.useMemo(() => {
    const groups: Record<TaskStatus, BusinessTask[]> = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach((t) => { if (groups[t.status]) groups[t.status].push(t); });
    return groups;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };
  const handleDragEnd = () => { setDragId(null); setDropTarget(null); };
  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(status); };
  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(relatedTarget)) return;
    if (dropTarget === status) setDropTarget(null);
  };
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || dragId;
    if (taskId && onStatusChange) onStatusChange(taskId, status);
    setDragId(null);
    setDropTarget(null);
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1, md: 2 }, minHeight: { xs: 'auto', md: 400 } }}>
      {COLUMN_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        const columnTasks = groupedTasks[status];
        const isOver = dropTarget === status && dragId !== null;
        const dragTask = dragId ? tasks.find((t) => t.id === dragId) : null;
        const isDragSource = dragTask?.status === status;

        return (
          <Paper key={status} elevation={0}
            onDragOver={(e) => handleDragOver(e, status)} onDragLeave={(e) => handleDragLeave(e, status)} onDrop={(e) => handleDrop(e, status)}
            sx={{
              bgcolor: isOver && !isDragSource ? `${config.color}0c` : colors.ivory[50],
              border: isOver && !isDragSource ? `2px dashed ${config.color}` : `1px solid ${colors.ivory[400]}`,
              borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: { xs: 120, md: 400 }, overflow: 'hidden', transition: 'background-color 0.15s ease, border 0.15s ease',
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderBottom: `1px solid ${colors.ivory[300]}`, bgcolor: `${config.color}08` }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: config.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.brown[700] }}>{config.label}</Typography>
              <Chip label={columnTasks.length} size="small" sx={{ height: 20, minWidth: 28, fontSize: '0.7rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', bgcolor: `${config.color}18`, color: config.color, ml: 'auto', '& .MuiChip-label': { px: 0.75 } }} />
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: colors.ivory[400], borderRadius: 2 } }}>
              {columnTasks.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px dashed ${isOver ? config.color : colors.ivory[400]}`, borderRadius: '6px', minHeight: { xs: 48, md: 80 }, transition: 'border-color 0.15s ease' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: isOver ? config.color : colors.brown[400] }}>{isOver ? 'ここにドロップ' : 'タスクなし'}</Typography>
                </Box>
              ) : (
                columnTasks.map((task) => (
                  <Box key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onDragEnd={handleDragEnd}
                    sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' }, opacity: dragId === task.id ? 0.4 : 1, transition: 'opacity 0.15s ease' }}>
                    <TaskCard task={task} member={memberMap.get(task.assigneeId)} onClick={onTaskClick ? () => onTaskClick(task) : undefined} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default KanbanBoard;
