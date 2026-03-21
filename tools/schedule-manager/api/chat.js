const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは「HARMONIC AIコンシェルジュ」です。建設業界のマーケティング・業務管理を支援するAIアシスタントとして、以下の役割を担います。

## 専門領域
- **スケジュール最適化**: タスクの優先順位付け、工期の調整提案、クリティカルパス分析
- **リスク管理**: 天候リスク、資材調達遅延、人員不足の予測と対策提案
- **安全管理**: 現場安全チェックリスト、法令遵守事項のリマインド
- **コスト最適化**: リソース配分の改善提案、無駄の削減
- **マーケティング戦略**: 建設業界特有のB2B営業支援、実績PRコンテンツの提案

## 行動指針
- ユーザーのタスクデータが提供された場合、そのデータを分析して具体的なアドバイスを提供する
- 建設業界の商慣行・法規制（建設業法、労働安全衛生法等）を踏まえた助言をする
- 回答は実用的・具体的に。抽象論より行動可能なアクションを提示する
- 日本語で応答する（ユーザーが英語で質問した場合は英語で応答）

## 応答スタイル
- 簡潔で読みやすく
- 必要に応じて箇条書きやステップ形式を使用
- 緊急度の高い項目は明確に強調する`;

function buildTaskContext(tasks) {
  if (!tasks || tasks.length === 0) return '';

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(t => t.dueDate < today && t.status !== 'done');
  const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'done');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const total = tasks.filter(t => t.status !== 'done');

  return `\n\n## 現在のタスク状況（${today}時点）
- 未完了タスク: ${total.length}件
- 期限超過: ${overdue.length}件
- 本日期限: ${dueToday.length}件
- 進行中: ${inProgress.length}件

### 期限超過タスク
${overdue.length > 0 ? overdue.map(t => `- [${t.priority === 'high' ? '⚠️高' : t.priority === 'medium' ? '中' : '低'}] ${t.title}（期限: ${t.dueDate}、カテゴリ: ${t.category}、進捗: ${t.progress}%）`).join('\n') : 'なし'}

### 本日期限
${dueToday.length > 0 ? dueToday.map(t => `- [${t.priority === 'high' ? '⚠️高' : t.priority === 'medium' ? '中' : '低'}] ${t.title}（カテゴリ: ${t.category}、進捗: ${t.progress}%）`).join('\n') : 'なし'}

### 進行中タスク
${inProgress.map(t => `- ${t.title}（期限: ${t.dueDate}、カテゴリ: ${t.category}、進捗: ${t.progress}%）`).join('\n') || 'なし'}

### 全タスク一覧
${tasks.map(t => `- [${t.status}] ${t.title}（期限: ${t.dueDate}、優先: ${t.priority}、カテゴリ: ${t.category}、進捗: ${t.progress}%）`).join('\n')}`;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, tasks } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
    }

    const taskContext = buildTaskContext(tasks);
    const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

    const stream = await client.messages.stream({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT + taskContext,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Stream response as SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat API error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
};
