import React, { useState, useMemo } from 'react';
import {
  Box, Typography, IconButton, Paper, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  AppBar, Toolbar,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import FlagIcon from '@mui/icons-material/Flag';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import { colors } from '../theme';
import { BusinessTask, TeamMember, TaskEvent, CATEGORIES, PRIORITY_CONFIG, EVENT_CATEGORY_CONFIG, type EventCategory } from '../data/types';

interface CalendarViewProps {
  tasks: BusinessTask[];
  members: TeamMember[];
  events: TaskEvent[];
  onTaskClick?: (task: BusinessTask) => void;
  onEventCreate?: (event: Omit<TaskEvent, 'id'>) => void;
  onEventUpdate?: (event: TaskEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  meeting: <GroupsIcon sx={{ fontSize: 10 }} />,
  deadline: <FlagIcon sx={{ fontSize: 10 }} />,
  launch: <RocketLaunchIcon sx={{ fontSize: 10 }} />,
  campaign: <CampaignIcon sx={{ fontSize: 10 }} />,
  other: <EventIcon sx={{ fontSize: 10 }} />,
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({ date: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }
  return cells;
}

function EventDialog({ open, event, isNew, onClose, onSave, onDelete }: {
  open: boolean; event: TaskEvent | null; isNew: boolean; onClose: () => void; onSave: (event: TaskEvent) => void; onDelete?: (id: string) => void;
}) {
  const evTheme = useTheme();
  const evMobile = useMediaQuery(evTheme.breakpoints.down('sm'));
  const [form, setForm] = useState<TaskEvent | null>(null);
  React.useEffect(() => { if (event) setForm({ ...event }); }, [event]);
  if (!form) return null;
  const handleChange = (field: keyof TaskEvent, value: string | boolean) => { setForm((prev) => prev ? { ...prev, [field]: value } : prev); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={evMobile}>
      {evMobile ? (
        <AppBar position="static" elevation={0} sx={{ bgcolor: colors.brown[600] }}>
          <Toolbar variant="dense" sx={{ minHeight: 48 }}>
            <IconButton edge="start" onClick={onClose} sx={{ color: '#fff', mr: 1 }}><CloseIcon /></IconButton>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', flex: 1 }}>{isNew ? 'イベント追加' : 'イベント編集'}</Typography>
            <Button onClick={() => { onSave(form); onClose(); }} disabled={!form.title.trim()} sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textTransform: 'none', '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' } }}>
              {isNew ? '追加' : '保存'}
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 700, color: colors.brown[800], pb: 1 }}>{isNew ? 'イベント追加' : 'イベント編集'}</DialogTitle>
      )}
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="タイトル" size="small" value={form.title} onChange={(e) => handleChange('title', e.target.value)} autoFocus required sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }} />
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="日付" type="date" size="small" value={form.date} onChange={(e) => handleChange('date', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.85rem' } }} />
          <TextField label="終了日（任意）" type="date" size="small" value={form.endDate || ''} onChange={(e) => handleChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.85rem' } }} />
        </Box>
        <TextField label="カテゴリ" select size="small" value={form.category} onChange={(e) => handleChange('category', e.target.value)} sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }}>
          {(Object.entries(EVENT_CATEGORY_CONFIG) as [EventCategory, { label: string }][]).map(([key, cfg]) => (
            <MenuItem key={key} value={key} sx={{ fontSize: '0.85rem' }}>{cfg.label}</MenuItem>
          ))}
        </TextField>
        <TextField label="説明（任意）" size="small" multiline rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }} />
        {evMobile && !isNew && onDelete && (
          <Button onClick={() => { onDelete(form.id); onClose(); }} color="error" size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />} sx={{ alignSelf: 'flex-start', fontSize: '0.78rem', mt: 1 }}>削除</Button>
        )}
      </DialogContent>
      {!evMobile && (
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {!isNew && onDelete && (
            <Button onClick={() => { onDelete(form.id); onClose(); }} color="error" size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />} sx={{ mr: 'auto', fontSize: '0.78rem' }}>削除</Button>
          )}
          <Button onClick={onClose} size="small" sx={{ fontSize: '0.78rem' }}>キャンセル</Button>
          <Button variant="contained" onClick={() => { onSave(form); onClose(); }} disabled={!form.title.trim()} size="small" sx={{ fontSize: '0.78rem' }}>{isNew ? '追加' : '保存'}</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, members, events, onTaskClick, onEventCreate, onEventUpdate, onEventDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TaskEvent | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const today = now.toISOString().slice(0, 10);
  const cells = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, BusinessTask[]> = {};
    for (const t of tasks) {
      const d = t.dueDate;
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => { const po = { high: 0, medium: 1, low: 2 }; return po[a.priority] - po[b.priority]; });
    }
    return map;
  }, [tasks]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, TaskEvent[]> = {};
    for (const ev of events) {
      const end = ev.endDate || ev.date;
      let cur = ev.date;
      while (cur <= end) {
        if (!map[cur]) map[cur] = [];
        map[cur].push(ev);
        const d = new Date(cur + 'T00:00:00'); d.setDate(d.getDate() + 1); cur = d.toISOString().slice(0, 10);
      }
    }
    return map;
  }, [events]);

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };
  const prevMonth = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };

  const getCatColor = (cat: string) => CATEGORIES.find((c) => c.name === cat)?.color ?? colors.brown[400];
  const maxShow = isMobile ? 2 : 3;

  const handleAddEvent = (date?: string) => {
    setEditingEvent({ id: `ev-new-${Date.now()}`, title: '', date: date || today, category: 'meeting', description: '', allDay: true });
    setIsNewEvent(true); setEventDialogOpen(true);
  };
  const handleEditEvent = (ev: TaskEvent) => { setEditingEvent(ev); setIsNewEvent(false); setEventDialogOpen(true); };
  const handleSaveEvent = (ev: TaskEvent) => {
    if (isNewEvent) {
      onEventCreate?.({ title: ev.title, date: ev.date, endDate: ev.endDate, category: ev.category, description: ev.description, allDay: ev.allDay, color: ev.color });
    } else {
      onEventUpdate?.(ev);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon sx={{ fontSize: 20, color: colors.brown[600] }} /></IconButton>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.brown[800], minWidth: 140, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{year}年 {month + 1}月</Typography>
        <IconButton size="small" onClick={nextMonth}><ChevronRightIcon sx={{ fontSize: 20, color: colors.brown[600] }} /></IconButton>
        <IconButton size="small" onClick={goToday} title="今日"><TodayIcon sx={{ fontSize: 18, color: colors.brown[500] }} /></IconButton>
        {onEventCreate && (
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => handleAddEvent()}
            sx={{ ml: 1, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', color: '#1565c0', '&:hover': { bgcolor: '#1565c010' } }}>イベント</Button>
        )}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `2px solid ${colors.brown[300]}`, mb: '1px' }}>
        {WEEKDAYS.map((wd, i) => (
          <Box key={wd} sx={{ textAlign: 'center', py: 0.5, fontSize: '0.72rem', fontWeight: 700, color: i === 5 ? '#1565c0' : i === 6 ? '#b5453a' : colors.brown[600], bgcolor: colors.ivory[200] }}>{wd}</Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${colors.ivory[400]}`, borderTop: 'none' }}>
        {cells.map((cell, idx) => {
          const isToday = cell.date === today;
          const dayTasks = tasksByDate[cell.date] || [];
          const dayEvents = eventsByDate[cell.date] || [];
          const dow = idx % 7;
          const totalItems = dayEvents.length + dayTasks.length;
          return (
            <Box key={cell.date} sx={{
              minHeight: isMobile ? 60 : 90,
              borderRight: dow < 6 ? `1px solid ${colors.ivory[400]}` : 'none',
              borderBottom: `1px solid ${colors.ivory[400]}`,
              bgcolor: !cell.isCurrentMonth ? colors.ivory[200] : isToday ? '#fffde7' : dow === 5 ? '#f5f8ff' : dow === 6 ? '#fff8f6' : '#fff',
              p: 0.5, overflow: 'hidden',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                <Typography sx={{
                  fontSize: isMobile ? '0.68rem' : '0.75rem', fontWeight: isToday ? 800 : cell.isCurrentMonth ? 600 : 400,
                  color: !cell.isCurrentMonth ? colors.brown[300] : isToday ? '#c17817' : dow === 6 ? '#b5453a' : dow === 5 ? '#1565c0' : colors.brown[700],
                  ...(isToday && { bgcolor: '#c17817', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }),
                  lineHeight: 1,
                }}>{cell.day}</Typography>
                {totalItems > maxShow && <Typography sx={{ fontSize: '0.58rem', color: colors.brown[400], ml: 'auto' }}>+{totalItems - maxShow}</Typography>}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayEvents.slice(0, maxShow).map((ev) => {
                  const catCfg = EVENT_CATEGORY_CONFIG[ev.category] || EVENT_CATEGORY_CONFIG.other;
                  const evColor = ev.color || catCfg.color;
                  return (
                    <Paper key={`ev-${ev.id}-${cell.date}`} elevation={0} onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5, py: '2px', bgcolor: `${evColor}20`, borderRadius: '3px', cursor: 'pointer', transition: 'all 0.1s ease', '&:hover': { bgcolor: `${evColor}35` }, overflow: 'hidden' }}>
                      <Box sx={{ color: evColor, display: 'flex', flexShrink: 0 }}>{CATEGORY_ICONS[ev.category] || CATEGORY_ICONS.other}</Box>
                      <Typography sx={{ fontSize: isMobile ? '0.58rem' : '0.65rem', fontWeight: 600, color: evColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1.3 }}>{ev.title}</Typography>
                    </Paper>
                  );
                })}
                {dayTasks.slice(0, Math.max(0, maxShow - dayEvents.length)).map((task) => {
                  const catColor = getCatColor(task.category);
                  const isDone = task.status === 'done';
                  return (
                    <Paper key={task.id} elevation={0} onClick={() => onTaskClick?.(task)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5, py: '2px', borderLeft: `2px solid ${catColor}`, borderRadius: '3px', bgcolor: isDone ? `${colors.brown[200]}30` : `${catColor}0a`, cursor: onTaskClick ? 'pointer' : 'default', transition: 'all 0.1s ease', '&:hover': onTaskClick ? { bgcolor: `${catColor}18`, transform: 'translateX(1px)' } : {}, opacity: isDone ? 0.5 : 1, overflow: 'hidden' }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: PRIORITY_CONFIG[task.priority].color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: isMobile ? '0.58rem' : '0.65rem', fontWeight: 600, color: isDone ? colors.brown[400] : colors.brown[800], textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1.3 }}>{task.title}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5, justifyContent: 'center' }}>
        {(Object.entries(EVENT_CATEGORY_CONFIG) as [EventCategory, { label: string; color: string }][]).map(([key, cfg]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ color: cfg.color, display: 'flex' }}>{CATEGORY_ICONS[key]}</Box>
            <Typography sx={{ fontSize: '0.62rem', color: colors.brown[500] }}>{cfg.label}</Typography>
          </Box>
        ))}
        <Box sx={{ mx: 0.5, borderLeft: `1px solid ${colors.ivory[400]}` }} />
        {CATEGORIES.map((cat) => (
          <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 3, bgcolor: cat.color, borderRadius: 1 }} />
            <Typography sx={{ fontSize: '0.62rem', color: colors.brown[500] }}>{cat.name}</Typography>
          </Box>
        ))}
      </Box>
      <EventDialog open={eventDialogOpen} event={editingEvent} isNew={isNewEvent} onClose={() => { setEventDialogOpen(false); setEditingEvent(null); }} onSave={handleSaveEvent} onDelete={onEventDelete} />
    </Box>
  );
};

export default CalendarView;
