import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, Chip, Select, MenuItem, FormControl, InputLabel, Slider,
} from '@mui/material';
import { colors } from '../theme';
import {
  BusinessTask, TeamMember, Category, TaskStatus, Priority,
  CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG,
} from '../data/types';

interface TaskDetailDialogProps {
  task: BusinessTask | null;
  members: TeamMember[];
  open: boolean;
  onClose: () => void;
  onSave?: (task: BusinessTask) => void;
  isNew?: boolean;
}

const getCatColor = (cat: string): string => CATEGORIES.find((c) => c.name === cat)?.color ?? colors.brown[400];
const getCatSubCategories = (cat: Category): string[] => CATEGORIES.find((c) => c.name === cat)?.subCategories ?? [];

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, members, open, onClose, onSave, isNew = false }) => {
  const [form, setForm] = React.useState<BusinessTask | null>(null);
  React.useEffect(() => { if (task) setForm({ ...task }); else setForm(null); }, [task]);
  if (!form) return null;

  const catColor = getCatColor(form.category);
  const subCategories = getCatSubCategories(form.category);
  const updateField = <K extends keyof BusinessTask>(key: K, value: BusinessTask[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };
  const handleCategoryChange = (cat: Category) => {
    const newSubs = getCatSubCategories(cat);
    setForm((prev) => prev ? { ...prev, category: cat, subCategory: newSubs[0] ?? '' } : null);
  };
  const handleSave = () => { if (form && onSave) onSave({ ...form, updatedAt: new Date().toISOString() }); };
  const canSave = form.title.trim().length > 0;

  const statusEntries = Object.entries(STATUS_CONFIG) as [TaskStatus, { label: string; color: string }][];
  const priorityEntries = Object.entries(PRIORITY_CONFIG) as [Priority, { label: string; color: string }][];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 560, borderRadius: '10px', overflow: 'hidden' } }}>
      <Box sx={{ height: 4, bgcolor: catColor }} />
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: colors.brown[800], lineHeight: 1.3 }}>{isNew ? 'タスクを追加' : 'タスクを編集'}</Typography>
        {isNew && <Typography sx={{ fontSize: '0.72rem', color: colors.brown[400], mt: 0.5 }}>タイトルと期日を入力すれば登録できます</Typography>}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
          <TextField label="何をする？（タスク名）" value={form.title} onChange={(e) => updateField('title', e.target.value)} size="small" fullWidth autoFocus={isNew} placeholder="例: note記事を下書き" sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.95rem' } }} />
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
            <TextField label="いつまで？" type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} InputLabelProps={{ shrink: true }} />
            <TextField label="開始日" type="date" value={form.startDate || ''} onChange={(e) => updateField('startDate', e.target.value || undefined)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.brown[500], mb: 0.75 }}>優先度</Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {priorityEntries.map(([key, cfg]) => {
                const isSelected = form.priority === key;
                return (
                  <Chip key={key} label={cfg.label} size="small" onClick={() => updateField('priority', key)}
                    sx={{ height: 28, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', bgcolor: isSelected ? cfg.color : `${cfg.color}14`, color: isSelected ? '#fff' : cfg.color, border: `1.5px solid ${isSelected ? cfg.color : `${cfg.color}40`}`, transition: 'all 0.15s ease', '&:hover': { bgcolor: isSelected ? cfg.color : `${cfg.color}24` } }} />
                );
              })}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel sx={{ fontSize: '0.82rem' }}>カテゴリ</InputLabel>
              <Select value={form.category} label="カテゴリ" onChange={(e) => handleCategoryChange(e.target.value as Category)} sx={{ fontSize: '0.85rem' }}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.name} value={c.name} sx={{ fontSize: '0.85rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color }} />{c.name}</Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel sx={{ fontSize: '0.82rem' }}>サブカテゴリ</InputLabel>
              <Select value={form.subCategory} label="サブカテゴリ" onChange={(e) => updateField('subCategory', e.target.value)} sx={{ fontSize: '0.85rem' }}>
                {subCategories.map((s) => (<MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{s}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.brown[500], mb: 0.75 }}>ステータス</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {statusEntries.map(([key, cfg]) => {
                const isSelected = form.status === key;
                return (
                  <Chip key={key} label={cfg.label} size="small" onClick={() => updateField('status', key)}
                    sx={{ height: 28, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', bgcolor: isSelected ? cfg.color : `${cfg.color}14`, color: isSelected ? '#fff' : cfg.color, border: `1.5px solid ${isSelected ? cfg.color : `${cfg.color}40`}`, transition: 'all 0.15s ease', '&:hover': { bgcolor: isSelected ? cfg.color : `${cfg.color}24` } }} />
                );
              })}
            </Box>
          </Box>
          {!isNew && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.brown[500] }}>進捗</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: catColor }}>{form.progress}%</Typography>
              </Box>
              <Slider value={form.progress} onChange={(_, val) => updateField('progress', val as number)} min={0} max={100} step={5} sx={{ color: catColor, height: 6, '& .MuiSlider-thumb': { width: 16, height: 16 } }} />
            </Box>
          )}
          <TextField label="メモ・説明（任意）" value={form.description} onChange={(e) => updateField('description', e.target.value)} multiline rows={2} size="small" fullWidth placeholder="補足があれば入力" sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: colors.brown[500], fontSize: '0.82rem', fontWeight: 600, textTransform: 'none' }}>キャンセル</Button>
        {onSave && (
          <Button onClick={handleSave} variant="contained" disabled={!canSave}
            sx={{ bgcolor: catColor, fontSize: '0.82rem', fontWeight: 600, textTransform: 'none', px: 3, '&:hover': { bgcolor: catColor, filter: 'brightness(0.9)' } }}>
            {isNew ? '追加する' : '保存する'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;
