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
