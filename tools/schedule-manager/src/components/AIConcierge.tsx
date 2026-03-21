import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, IconButton, TextField, Drawer, InputAdornment,
  Avatar, useMediaQuery, useTheme, Chip, CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { colors } from '../theme';
import { BusinessTask } from '../data/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConciergeProps {
  open: boolean;
  onClose: () => void;
  tasks: BusinessTask[];
}

const QUICK_PROMPTS = [
  '今日のタスク優先順位を教えて',
  '期限超過タスクの対処法は？',
  'スケジュール全体を分析して',
  '安全管理のチェックポイント',
];

const API_URL = process.env.REACT_APP_API_URL || '';

const AIConcierge: React.FC<AIConciergeProps> = ({ open, onClose, tasks }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (open && !isMobile) setTimeout(() => inputRef.current?.focus(), 300); }, [open, isMobile]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, tasks }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              assistantText += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // incomplete JSON chunk
            throw e;
          }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'エラーが発生しました';
      setMessages(prev => {
        const errorContent = `⚠️ ${errMsg}\n\nANTHROPIC_API_KEY が設定されているか確認してください。\nローカル開発: \`npm run dev\` で起動`;
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errorContent };
          return updated;
        }
        return [...prev, { role: 'assistant', content: errorContent }];
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, tasks, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const drawerWidth = isMobile ? '100%' : 420;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: drawerWidth, display: 'flex', flexDirection: 'column', bgcolor: colors.ivory[50] } }}>
      {/* Header */}
      <Box sx={{ bgcolor: colors.brown[700], color: '#fff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#c17817' }}>
          <SmartToyIcon sx={{ fontSize: 20 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700 }}>AI コンシェルジュ</Typography>
          <Typography sx={{ fontSize: '0.62rem', color: colors.ivory[400], letterSpacing: '0.02em' }}>建設業務 × マーケティング支援</Typography>
        </Box>
        <Chip label="Claude" size="small" sx={{ height: 20, fontSize: '0.58rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
        <IconButton onClick={onClose} sx={{ color: '#fff', p: 0.5 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: colors.ivory[400], borderRadius: 2 } }}>
        {messages.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, py: 4 }}>
            <AutoAwesomeIcon sx={{ fontSize: 40, color: colors.brown[300] }} />
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: colors.brown[600], textAlign: 'center' }}>
              何でもお聞きください
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: colors.brown[400], textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
              タスクの優先順位、スケジュール調整、安全管理、マーケティング戦略など、建設業務全般をサポートします。
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center', mt: 1 }}>
              {QUICK_PROMPTS.map((prompt) => (
                <Chip key={prompt} label={prompt} size="small" variant="outlined" onClick={() => sendMessage(prompt)}
                  sx={{ fontSize: '0.68rem', fontWeight: 500, color: colors.brown[600], borderColor: colors.brown[300], cursor: 'pointer', '&:hover': { bgcolor: colors.ivory[200], borderColor: colors.brown[500] } }} />
              ))}
            </Box>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            {msg.role === 'assistant' && (
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#c17817', flexShrink: 0, mt: 0.25 }}>
                <SmartToyIcon sx={{ fontSize: 16 }} />
              </Avatar>
            )}
            <Paper elevation={0} sx={{
              px: 1.5, py: 1, maxWidth: '85%', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              bgcolor: msg.role === 'user' ? colors.brown[600] : '#fff',
              color: msg.role === 'user' ? '#fff' : colors.brown[800],
              border: msg.role === 'assistant' ? `1px solid ${colors.ivory[400]}` : 'none',
            }}>
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
              </Typography>
            </Paper>
          </Box>
        ))}

        {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 5 }}>
            <CircularProgress size={14} sx={{ color: colors.brown[400] }} />
            <Typography sx={{ fontSize: '0.72rem', color: colors.brown[400] }}>考え中...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick prompts after conversation started */}
      {messages.length > 0 && !isStreaming && (
        <Box sx={{ px: 2, pb: 0.5, display: 'flex', gap: 0.5, overflowX: 'auto', flexShrink: 0, '&::-webkit-scrollbar': { height: 0 } }}>
          {['続けて', '具体的に教えて', '他の提案は？'].map((prompt) => (
            <Chip key={prompt} label={prompt} size="small" variant="outlined" onClick={() => sendMessage(prompt)}
              sx={{ fontSize: '0.62rem', fontWeight: 500, flexShrink: 0, color: colors.brown[500], borderColor: colors.ivory[400], cursor: 'pointer', '&:hover': { bgcolor: colors.ivory[200] } }} />
          ))}
        </Box>
      )}

      {/* Input */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${colors.ivory[400]}`, bgcolor: '#fff', flexShrink: 0 }}>
        <TextField fullWidth multiline maxRows={4} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          inputRef={inputRef} placeholder="質問を入力..." disabled={isStreaming}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming} size="small"
                  sx={{ bgcolor: input.trim() && !isStreaming ? colors.brown[600] : 'transparent', color: input.trim() && !isStreaming ? '#fff' : colors.brown[300], '&:hover': { bgcolor: colors.brown[700] }, transition: 'all 0.15s ease', width: 32, height: 32 }}>
                  <SendIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: '12px', bgcolor: colors.ivory[100], '& fieldset': { borderColor: colors.ivory[400] }, '&:hover fieldset': { borderColor: colors.brown[300] }, '&.Mui-focused fieldset': { borderColor: colors.brown[500] } } }}
        />
        <Typography sx={{ fontSize: '0.58rem', color: colors.brown[300], mt: 0.5, textAlign: 'center' }}>
          Powered by Claude API · タスクデータを参照して回答します
        </Typography>
      </Box>
    </Drawer>
  );
};

export default AIConcierge;
