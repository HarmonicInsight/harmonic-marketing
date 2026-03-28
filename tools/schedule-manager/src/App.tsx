import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Chip, Button, ToggleButton, ToggleButtonGroup,
  TextField, InputAdornment, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, TableContainer, IconButton, useMediaQuery, useTheme,
  CssBaseline, ThemeProvider, AppBar, Toolbar, BottomNavigation, BottomNavigationAction,
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { theme, colors } from './theme';
import {
  CATEGORIES, STATUS_CONFIG, type TaskStatus, type BusinessTask,
  type Category, type TeamMember, type Priority, type TaskEvent,
} from './data/types';
import { loadTasks, saveTasks, loadMembers, loadEvents, saveEvents } from './data/storage';
import KanbanBoard from './components/KanbanBoard';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import TaskDetailDialog from './components/TaskDetailDialog';
import AIConcierge from './components/AIConcierge';
import ReminderDashboard from './components/ReminderDashboard';

type ViewMode = 'calendar' | 'timeline' | 'list' | 'kanban' | 'reminder';
type KpiFilter = null | 'active' | 'overdue' | 'dueToday' | 'inProgress';

function App() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [view, setView] = useState<ViewMode>('calendar');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<BusinessTask[]>(() => loadTasks());
  const [members] = useState<TeamMember[]>(() => loadMembers());
  const [events, setEvents] = useState<TaskEvent[]>(() => loadEvents());
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
  const [editingTask, setEditingTask] = useState<BusinessTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const updateTasks = useCallback((newTasks: BusinessTask[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  }, []);

  const updateEvents = useCallback((newEvents: TaskEvent[]) => {
    setEvents(newEvents);
    saveEvents(newEvents);
  }, []);

  const filtered = useMemo(() => {
    let result = tasks;
    if (kpiFilter === 'active') result = result.filter((t) => t.status !== 'done');
    else if (kpiFilter === 'overdue') result = result.filter((t) => t.dueDate < today && t.status !== 'done');
    else if (kpiFilter === 'dueToday') result = result.filter((t) => t.dueDate === today && t.status !== 'done');
    else if (kpiFilter === 'inProgress') result = result.filter((t) => t.status === 'in_progress');
    if (catFilter !== 'all') result = result.filter((t) => t.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.subCategory.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)));
    }
    return result;
  }, [tasks, catFilter, search, kpiFilter, today]);

  const overdue = tasks.filter((t) => t.dueDate < today && t.status !== 'done').length;
  const dueToday = tasks.filter((t) => t.dueDate === today && t.status !== 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const total = tasks.filter((t) => t.status !== 'done').length;

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTasks(tasks.map((t) => t.id === taskId ? { ...t, status: newStatus, progress: newStatus === 'done' ? 100 : t.progress, updatedAt: new Date().toISOString() } : t));
  };

  const handleEdit = (task: BusinessTask) => { setEditingTask(task); setIsNewTask(false); setDialogOpen(true); };

  const handleNew = () => {
    const now = new Date().toISOString();
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 7);
    const cat: Category = (catFilter !== 'all' ? catFilter : 'マーケティング') as Category;
    const catConfig = CATEGORIES.find((c) => c.name === cat);
    const newTask: BusinessTask = {
      id: `task-${Date.now()}`, title: '', description: '', category: cat, assigneeId: members[0]?.id ?? '',
      status: 'todo', priority: 'medium', dueDate: dueDate.toISOString().slice(0, 10), startDate: new Date().toISOString().slice(0, 10),
      subCategory: catConfig?.subCategories[0] ?? '', recurrence: 'none', progress: 0, tags: [], createdAt: now, updatedAt: now,
    };
    setEditingTask(newTask); setIsNewTask(true); setDialogOpen(true);
  };

  const handleSave = (updated: BusinessTask) => {
    if (isNewTask) {
      updateTasks([...tasks, updated]);
    } else {
      updateTasks(tasks.map((t) => t.id === updated.id ? updated : t));
    }
    setDialogOpen(false); setEditingTask(null); setIsNewTask(false);
  };

  const handleDelete = (taskId: string) => { updateTasks(tasks.filter((t) => t.id !== taskId)); };

  const handleKpiClick = (filter: KpiFilter) => {
    setKpiFilter((prev) => (prev === filter ? null : filter));
    if (kpiFilter !== filter) setView('list');
  };

  const handleEventCreate = (ev: Omit<TaskEvent, 'id'>) => {
    updateEvents([...events, { ...ev, id: `ev-${Date.now()}` }]);
  };
  const handleEventUpdate = (ev: TaskEvent) => {
    updateEvents(events.map((e) => e.id === ev.id ? ev : e));
  };
  const handleEventDelete = (eventId: string) => {
    updateEvents(events.filter((e) => e.id !== eventId));
  };

  const kpiItems: { key: KpiFilter; label: string; value: number; color: string }[] = [
    { key: 'active', label: '未完了タスク', value: total, color: colors.brown[800] },
    { key: 'overdue', label: '期限超過', value: overdue, color: overdue > 0 ? '#b5453a' : '#4a7c59' },
    { key: 'dueToday', label: '本日期限', value: dueToday, color: dueToday > 0 ? '#c17817' : colors.brown[600] },
    { key: 'inProgress', label: '進行中', value: inProgress, color: '#1976d2' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.ivory[100] }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: colors.brown[700] }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>
            HARMONIC スケジュール管理
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: colors.ivory[400], ml: 1.5, display: { xs: 'none', sm: 'block' } }}>Marketing & Business Task Manager</Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={() => setConciergeOpen(true)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <SmartToyIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: colors.brown[800] }}>
              <Box component="span" sx={{ color: colors.brown[500], mr: 0.75, fontSize: '0.9rem' }}>&#9632;</Box>
              タスク管理
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}
            sx={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'none', px: 2.5, py: 0.8, display: { xs: 'none', sm: 'flex' } }}>タスク追加</Button>
        </Box>

        {/* View toggle - desktop only */}
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small"
              sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.72rem' } }}>
              <ToggleButton value="calendar"><CalendarMonthIcon sx={{ fontSize: 16, mr: 0.5 }} />カレンダー</ToggleButton>
              <ToggleButton value="timeline"><TimelineIcon sx={{ fontSize: 16, mr: 0.5 }} />タイムライン</ToggleButton>
              <ToggleButton value="list"><ViewListIcon sx={{ fontSize: 16, mr: 0.5 }} />リスト</ToggleButton>
              <ToggleButton value="kanban"><ViewKanbanIcon sx={{ fontSize: 16, mr: 0.5 }} />カンバン</ToggleButton>
              <ToggleButton value="reminder"><NotificationsActiveIcon sx={{ fontSize: 16, mr: 0.5 }} />督促</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* KPI Strip */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: '1px', border: `1px solid ${colors.ivory[400]}`, borderRadius: 1, bgcolor: colors.ivory[400], overflow: 'hidden', mb: 2 }}>
          {kpiItems.map((stat) => (
            <Box key={stat.label} onClick={() => handleKpiClick(stat.key)}
              sx={{ bgcolor: kpiFilter === stat.key ? `${stat.color}10` : '#fff', py: { xs: 0.8, sm: 1.2 }, px: { xs: 1, sm: 1.5 }, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease', borderBottom: kpiFilter === stat.key ? `3px solid ${stat.color}` : '3px solid transparent', '&:hover': { bgcolor: `${stat.color}08` } }}>
              <Typography sx={{ fontSize: '0.62rem', color: colors.brown[500], fontWeight: 500, mb: 0.3 }}>{stat.label}</Typography>
              <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, fontWeight: 700, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</Typography>
            </Box>
          ))}
        </Box>

        {kpiFilter && (
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${kpiItems.find((k) => k.key === kpiFilter)?.label}のみ表示中`} size="small" onDelete={() => setKpiFilter(null)} sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
            <Typography sx={{ fontSize: '0.72rem', color: colors.brown[400] }}>{filtered.length}件</Typography>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1, sm: 1.5 }, mb: 2 }}>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <TextField size="small" placeholder="タスク検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: colors.brown[400] }} /></InputAdornment> }}
              sx={{ width: '100%', '& .MuiInputBase-root': { fontSize: '0.75rem', height: 32 } }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, overflowX: { xs: 'auto', sm: 'visible' }, flexWrap: { xs: 'nowrap', sm: 'wrap' }, pb: { xs: 0.5, sm: 0 } }}>
            <Chip label="全て" size="small" variant={catFilter === 'all' ? 'filled' : 'outlined'} onClick={() => setCatFilter('all')}
              sx={{ fontWeight: 600, fontSize: '0.72rem', flexShrink: 0, bgcolor: catFilter === 'all' ? colors.brown[600] : undefined, color: catFilter === 'all' ? '#fff' : colors.brown[600], borderColor: colors.brown[300] }} />
            {CATEGORIES.map((cat) => (
              <Chip key={cat.name} label={cat.name} size="small" variant={catFilter === cat.name ? 'filled' : 'outlined'} onClick={() => setCatFilter(catFilter === cat.name ? 'all' : cat.name)}
                sx={{ fontWeight: 600, fontSize: '0.72rem', flexShrink: 0, bgcolor: catFilter === cat.name ? cat.color : undefined, color: catFilter === cat.name ? '#fff' : cat.color, borderColor: cat.color + '60', '&:hover': { bgcolor: cat.color + '18' } }} />
            ))}
          </Box>
          <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <TextField size="small" placeholder="タスク検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: colors.brown[400] }} /></InputAdornment> }}
              sx={{ width: 200, '& .MuiInputBase-root': { fontSize: '0.75rem', height: 32 } }} />
          </Box>
        </Box>

        {/* Views */}
        {view === 'calendar' && <CalendarView tasks={filtered} members={members} events={events} onTaskClick={handleEdit} onEventCreate={handleEventCreate} onEventUpdate={handleEventUpdate} onEventDelete={handleEventDelete} />}
        {view === 'timeline' && <TimelineView tasks={filtered} members={members} onTaskClick={handleEdit} />}
        {view === 'list' && <ListView tasks={filtered} members={members} onEdit={handleEdit} onDelete={handleDelete} />}
        {view === 'kanban' && <KanbanBoard tasks={filtered} members={members} onStatusChange={handleStatusChange} onTaskClick={handleEdit} />}
        {view === 'reminder' && <ReminderDashboard tasks={tasks} members={members} />}

        <TaskDetailDialog task={editingTask} members={members} open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingTask(null); setIsNewTask(false); }} onSave={handleSave} isNew={isNewTask} />
        <AIConcierge open={conciergeOpen} onClose={() => setConciergeOpen(false)} tasks={tasks} />

        {/* Spacer for mobile bottom nav */}
        {isMobile && <Box sx={{ height: 64 }} />}
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <>
          <IconButton onClick={handleNew}
            sx={{ position: 'fixed', bottom: 68, right: 16, zIndex: 1100, width: 48, height: 48, bgcolor: colors.brown[600], color: '#fff', boxShadow: '0 4px 12px rgba(93,78,63,0.3)', '&:hover': { bgcolor: colors.brown[700] }, '&:active': { transform: 'scale(0.95)' } }}>
            <AddIcon />
          </IconButton>
          <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: `1px solid ${colors.ivory[400]}` }} elevation={3}>
            <BottomNavigation value={view} onChange={(_, v) => setView(v)} showLabels
              sx={{ height: 56, bgcolor: '#fff', '& .MuiBottomNavigationAction-root': { minWidth: 0, py: 0.5, '&.Mui-selected': { color: colors.brown[700] } }, '& .MuiBottomNavigationAction-label': { fontSize: '0.62rem', '&.Mui-selected': { fontSize: '0.64rem' } } }}>
              <BottomNavigationAction label="カレンダー" value="calendar" icon={<CalendarMonthIcon sx={{ fontSize: 22 }} />} />
              <BottomNavigationAction label="タイムライン" value="timeline" icon={<TimelineIcon sx={{ fontSize: 22 }} />} />
              <BottomNavigationAction label="リスト" value="list" icon={<ViewListIcon sx={{ fontSize: 22 }} />} />
              <BottomNavigationAction label="カンバン" value="kanban" icon={<ViewKanbanIcon sx={{ fontSize: 22 }} />} />
              <BottomNavigationAction label="督促" value="reminder" icon={<NotificationsActiveIcon sx={{ fontSize: 22 }} />} />
            </BottomNavigation>
          </Paper>
        </>
      )}
    </Box>
  );
}

function ListView({ tasks, members, onEdit, onDelete }: { tasks: BusinessTask[]; members: TeamMember[]; onEdit?: (task: BusinessTask) => void; onDelete?: (taskId: string) => void }) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const getCatColor = (cat: string) => CATEGORIES.find((c) => c.name === cat)?.color ?? colors.brown[400];
  const today = new Date().toISOString().slice(0, 10);

  const sorted = useMemo(() => [...tasks].sort((a, b) => {
    const aOverdue = a.dueDate < today && a.status !== 'done' ? 1 : 0;
    const bOverdue = b.dueDate < today && b.status !== 'done' ? 1 : 0;
    if (bOverdue !== aOverdue) return bOverdue - aOverdue;
    const po = { high: 3, medium: 2, low: 1 };
    const pDiff = po[b.priority] - po[a.priority];
    if (pDiff !== 0) return pDiff;
    return a.dueDate.localeCompare(b.dueDate);
  }), [tasks, today]);

  const formatDue = (d: string) => {
    const diff = Math.round((new Date(d + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)}日超過`, color: '#b5453a', bg: '#b5453a' };
    if (diff === 0) return { label: '本日', color: '#c17817', bg: '#c17817' };
    if (diff === 1) return { label: '明日', color: colors.brown[600], bg: colors.ivory[400] };
    const m = new Date(d + 'T00:00:00');
    return { label: `${m.getMonth() + 1}/${m.getDate()}`, color: colors.brown[500], bg: 'transparent' };
  };

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sorted.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ fontSize: '0.82rem', color: colors.brown[400] }}>タスクなし</Typography></Paper>
        )}
        {sorted.map((task) => {
          const statusCfg = STATUS_CONFIG[task.status];
          const catColor = getCatColor(task.category);
          const due = formatDue(task.dueDate);
          const isDone = task.status === 'done';
          const showProgress = task.progress > 0 && task.progress < 100;
          return (
            <Paper key={task.id} onClick={() => onEdit?.(task)}
              sx={{ borderLeft: `3px solid ${catColor}`, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', opacity: isDone ? 0.6 : 1, transition: 'all 0.15s ease', '&:active': { transform: 'scale(0.98)' } }}>
              <Box sx={{ px: 1.5, pt: 1.25, pb: showProgress ? 0.5 : 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Chip label={statusCfg.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: `${statusCfg.color}18`, color: statusCfg.color, '& .MuiChip-label': { px: 0.75 } }} />
                  <Chip label={task.category} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${catColor}14`, color: catColor, '& .MuiChip-label': { px: 0.5 } }} />
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: task.priority === 'high' ? '#b5453a' : task.priority === 'medium' ? '#c17817' : '#4a7c59' }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: due.bg !== 'transparent' ? '#fff' : due.color, bgcolor: due.bg !== 'transparent' ? due.bg : undefined, borderRadius: '10px', px: due.bg !== 'transparent' ? 0.8 : 0, py: 0.1, fontVariantNumeric: 'tabular-nums' }}>{due.label}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.brown[800], textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.3, mb: 0.25 }}>{task.title}</Typography>
                {showProgress && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                    <LinearProgress variant="determinate" value={task.progress} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: colors.ivory[200], '& .MuiLinearProgress-bar': { bgcolor: catColor } }} />
                    <Typography sx={{ fontSize: '0.62rem', color: colors.brown[400], fontVariantNumeric: 'tabular-nums' }}>{task.progress}%</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden', border: `1px solid ${colors.ivory[400]}` }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 50 }}>状態</TableCell>
              <TableCell sx={{ minWidth: 40 }}>優先</TableCell>
              <TableCell>タスク名</TableCell>
              <TableCell sx={{ minWidth: 80 }}>カテゴリ</TableCell>
              <TableCell sx={{ minWidth: 70 }}>期日</TableCell>
              <TableCell align="center" sx={{ minWidth: 60 }}>進捗</TableCell>
              <TableCell align="center" sx={{ minWidth: 60 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status];
              const catColor = getCatColor(task.category);
              const due = formatDue(task.dueDate);
              const isDone = task.status === 'done';
              return (
                <TableRow key={task.id} hover onClick={() => onEdit?.(task)} sx={{ cursor: onEdit ? 'pointer' : 'default', opacity: isDone ? 0.55 : 1, '&:hover': { bgcolor: colors.ivory[200] } }}>
                  <TableCell sx={{ py: '6px', px: 1 }}>
                    <Chip label={statusCfg.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: `${statusCfg.color}18`, color: statusCfg.color, '& .MuiChip-label': { px: 0.75 } }} />
                  </TableCell>
                  <TableCell sx={{ py: '6px', px: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: task.priority === 'high' ? '#b5453a' : task.priority === 'medium' ? '#c17817' : '#4a7c59', display: 'inline-block' }} />
                  </TableCell>
                  <TableCell sx={{ py: '6px', px: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.brown[800], textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{task.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: '6px', px: 1 }}>
                    <Chip label={task.category} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: `${catColor}14`, color: catColor, '& .MuiChip-label': { px: 0.5 } }} />
                  </TableCell>
                  <TableCell sx={{ py: '6px', px: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDone ? colors.brown[400] : due.color, fontVariantNumeric: 'tabular-nums' }}>{due.label}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: '6px', px: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                      <Box sx={{ width: 40, height: 4, bgcolor: colors.ivory[300], borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ width: `${task.progress}%`, height: '100%', bgcolor: catColor, borderRadius: 2 }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: colors.brown[400], fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>{task.progress}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: '6px', px: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => onEdit?.(task)} sx={{ p: 0.5 }}><EditIcon sx={{ fontSize: 16, color: colors.brown[400] }} /></IconButton>
                      <IconButton size="small" onClick={() => onDelete?.(task.id)} sx={{ p: 0.5 }}><DeleteOutlineIcon sx={{ fontSize: 16, color: colors.brown[400] }} /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ fontSize: '0.82rem', color: colors.brown[400] }}>タスクなし</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function Root() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

export default Root;
