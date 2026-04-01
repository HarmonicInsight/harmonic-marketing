// マーケティング・業務管理用のカテゴリ定義
export type Category = 'マーケティング' | 'ツール開発' | 'コンテンツ' | '販売' | '管理業務';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface TeamMember {
  id: string;
  name: string;
  category: Category;
  role: string;
  avatar?: string;
}

export interface BusinessTask {
  id: string;
  title: string;
  description: string;
  category: Category;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  startDate?: string;
  subCategory: string;
  recurrence: RecurrenceType;
  progress: number; // 0-100
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryConfig {
  name: Category;
  color: string;
  icon: string;
  subCategories: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  { name: 'マーケティング', color: '#7b5ea7', icon: 'Campaign', subCategories: ['SNS運用', 'SEO/記事', 'ブランディング', '広告', 'メルマガ', '分析'] },
  { name: 'ツール開発', color: '#2e7d8c', icon: 'Build', subCategories: ['social-poster', '新規開発', 'バグ修正', 'リファクタ', 'テスト', 'ドキュメント'] },
  { name: 'コンテンツ', color: '#c17817', icon: 'Article', subCategories: ['note記事', 'Twitter投稿', 'BOOTH商品', 'YouTube', 'ブログ', 'プレゼン資料'] },
  { name: '販売', color: '#4a7c59', icon: 'StoreFront', subCategories: ['BOOTH出品', '窓の杜申請', 'Vector登録', '価格設定', '顧客対応', 'パートナー'] },
  { name: '管理業務', color: '#3d7a9e', icon: 'Settings', subCategories: ['経理', '契約', '法務', '事務', '計画策定', '棚卸し'] },
];

export const STATUS_CONFIG = {
  todo: { label: '未着手', color: '#9e9e9e' },
  in_progress: { label: '進行中', color: '#1976d2' },
  review: { label: 'レビュー', color: '#c17817' },
  done: { label: '完了', color: '#4a7c59' },
};

export const PRIORITY_CONFIG = {
  high: { label: '高', color: '#b5453a', dot: '🔴' },
  medium: { label: '中', color: '#c17817', dot: '🟡' },
  low: { label: '低', color: '#4a7c59', dot: '🟢' },
};

// イベント（会議・締切・社内行事等）
export type EventCategory = 'meeting' | 'deadline' | 'launch' | 'campaign' | 'other';

export interface TaskEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  category: EventCategory;
  description: string;
  allDay: boolean;
  color?: string;
}

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; icon: string }> = {
  meeting: { label: '打合せ', color: '#1565c0', icon: 'Groups' },
  deadline: { label: '締切', color: '#b5453a', icon: 'Flag' },
  launch: { label: 'リリース', color: '#7b5ea7', icon: 'Rocket' },
  campaign: { label: 'キャンペーン', color: '#4a7c59', icon: 'Campaign' },
  other: { label: 'その他', color: '#757575', icon: 'Event' },
};

// ─── リマインド・督促機能（コンプル風） ─────────────────────

export type ReminderTiming = 'before_3d' | 'before_1d' | 'on_due' | 'after_1d' | 'after_3d' | 'after_7d';
export type EscalationLevel = 0 | 1 | 2 | 3; // 0=未送信, 1=本人リマインド, 2=上位者通知, 3=最終警告
export type ReminderChannel = 'app' | 'slack' | 'email';

export interface ReminderRule {
  timing: ReminderTiming;
  channel: ReminderChannel;
  enabled: boolean;
}

export interface ReminderLog {
  id: string;
  taskId: string;
  sentAt: string;
  timing: ReminderTiming;
  escalationLevel: EscalationLevel;
  channel: ReminderChannel;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface TaskReminderConfig {
  taskId: string;
  rules: ReminderRule[];
  escalationEnabled: boolean;
  maxEscalationLevel: EscalationLevel;
}

export const REMINDER_TIMING_CONFIG: Record<ReminderTiming, { label: string; days: number; color: string }> = {
  before_3d: { label: '3日前', days: -3, color: '#4a7c59' },
  before_1d: { label: '前日', days: -1, color: '#c17817' },
  on_due: { label: '当日', days: 0, color: '#b5453a' },
  after_1d: { label: '1日超過', days: 1, color: '#b5453a' },
  after_3d: { label: '3日超過', days: 3, color: '#8b1a1a' },
  after_7d: { label: '7日超過', days: 7, color: '#5c0000' },
};

export const ESCALATION_CONFIG: Record<EscalationLevel, { label: string; color: string; icon: string }> = {
  0: { label: '未送信', color: '#9e9e9e', icon: 'Remove' },
  1: { label: '本人リマインド', color: '#c17817', icon: 'NotificationsActive' },
  2: { label: '上位者通知', color: '#b5453a', icon: 'PriorityHigh' },
  3: { label: '最終警告', color: '#8b1a1a', icon: 'Report' },
};

export const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  { timing: 'before_3d', channel: 'app', enabled: true },
  { timing: 'before_1d', channel: 'app', enabled: true },
  { timing: 'on_due', channel: 'app', enabled: true },
  { timing: 'after_1d', channel: 'app', enabled: true },
  { timing: 'after_3d', channel: 'app', enabled: true },
  { timing: 'after_7d', channel: 'app', enabled: true },
];
