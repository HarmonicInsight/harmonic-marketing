// =============================================================================
// Insight Media Factory — パイプラインエンジン
// =============================================================================
//
// MediaProject のライフサイクルを管理し、
// 各フェーズのツール（Claude API / PPTX生成 / INMV / YouTube / note / Twitter）を
// 統合的にオーケストレーションする。
// =============================================================================

import type {
  MediaProject,
  ProjectStatus,
  ProjectSummary,
  PipelineStep,
  TimelineEntry,
  PlanningInfo,
  TargetAudience,
  ContentFormat,
  DistributionChannel,
  NarrationConfig,
  DesignTemplate,
  FactoryDashboard,
  DEFAULT_PIPELINE,
} from './types';

// -----------------------------------------------------------------------------
// プロジェクト生成
// -----------------------------------------------------------------------------

/** プロジェクト新規作成のパラメータ */
export interface CreateProjectParams {
  title: string;
  format: ContentFormat;
  theme: string;
  hook: string;
  keyMessage: string;
  durationSec: number;
  cta: string;
  target: TargetAudience;
  sourceDocuments: string[];
  channels: DistributionChannel[];
  series?: {
    seriesId: string;
    seriesName: string;
    episodeNumber: number;
  };
}

/** プロジェクトを新規作成 */
export function createProject(params: CreateProjectParams): MediaProject {
  const now = new Date().toISOString();
  const id = `mf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title: params.title,
    format: params.format,
    status: 'planning',
    target: params.target,
    planning: {
      theme: params.theme,
      hook: params.hook,
      keyMessage: params.keyMessage,
      durationSec: params.durationSec,
      sourceDocuments: params.sourceDocuments,
      cta: params.cta,
      series: params.series
        ? { ...params.series, previousEpisodeId: undefined, nextEpisodeTeaser: undefined }
        : undefined,
    },
    timeline: [
      {
        timestamp: now,
        phase: 'planning',
        action: 'プロジェクト作成',
        detail: params.title,
        actor: 'human',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

// -----------------------------------------------------------------------------
// ステータス遷移
// -----------------------------------------------------------------------------

/** 許可されるステータス遷移 */
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planning: ['scripting'],
  scripting: ['script_review'],
  script_review: ['scripting', 'slide_production'],     // 差し戻し or 承認
  slide_production: ['slide_review'],
  slide_review: ['slide_production', 'video_generation'], // 差し戻し or 承認
  video_generation: ['video_review'],
  video_review: ['video_generation', 'publishing'],       // 差し戻し or 承認
  publishing: ['published'],
  published: ['archived'],
  archived: [],
};

/** ステータスを遷移する */
export function transitionStatus(
  project: MediaProject,
  newStatus: ProjectStatus,
  action: string,
  actor: 'human' | 'ai' = 'ai',
): MediaProject {
  const allowed = VALID_TRANSITIONS[project.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${project.status} → ${newStatus}. ` +
      `Allowed: ${allowed.join(', ')}`,
    );
  }

  const now = new Date().toISOString();
  return {
    ...project,
    status: newStatus,
    updatedAt: now,
    timeline: [
      ...project.timeline,
      { timestamp: now, phase: newStatus, action, actor },
    ],
  };
}

// -----------------------------------------------------------------------------
// パイプライン進捗
// -----------------------------------------------------------------------------

/** 現在のステップを取得 */
export function getCurrentStep(
  project: MediaProject,
  pipeline: PipelineStep[] = DEFAULT_PIPELINE as unknown as PipelineStep[],
): PipelineStep | undefined {
  return pipeline.find((step) => step.status === project.status);
}

/** 次のアクションを取得 */
export function getNextAction(project: MediaProject): string {
  const actionMap: Record<ProjectStatus, string> = {
    planning: '台本を作成してください',
    scripting: '台本を作成中...',
    script_review: '台本をレビューしてください',
    slide_production: 'パワポを作成中...',
    slide_review: 'パワポをレビューしてください',
    video_generation: 'INMV で動画を生成中...',
    video_review: '動画をレビューしてください',
    publishing: 'YouTube + note.com に配信中...',
    published: 'SNS告知を実行してください',
    archived: '完了',
  };
  return actionMap[project.status] || '不明';
}

/** 進捗率を取得（0〜100） */
export function getProgressPercent(project: MediaProject): number {
  const progressMap: Record<ProjectStatus, number> = {
    planning: 10,
    scripting: 20,
    script_review: 30,
    slide_production: 45,
    slide_review: 55,
    video_generation: 70,
    video_review: 80,
    publishing: 90,
    published: 100,
    archived: 100,
  };
  return progressMap[project.status] || 0;
}

// -----------------------------------------------------------------------------
// プロジェクト一覧
// -----------------------------------------------------------------------------

/** プロジェクトをサマリーに変換 */
export function toProjectSummary(project: MediaProject): ProjectSummary {
  const publishedUrls: Record<string, string> = {};
  if (project.distribution?.channels) {
    for (const ch of project.distribution.channels) {
      if (ch.url) {
        publishedUrls[ch.channel] = ch.url;
      }
    }
  }

  return {
    id: project.id,
    title: project.title,
    format: project.format,
    status: project.status,
    series: project.planning.series?.seriesName,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    nextAction: getNextAction(project),
    publishedUrls: Object.keys(publishedUrls).length > 0
      ? publishedUrls as Record<DistributionChannel, string>
      : undefined,
  };
}

/** ダッシュボードデータを生成 */
export function buildDashboard(projects: MediaProject[]): FactoryDashboard {
  const statusCounts: Record<string, number> = {};
  const reviewStatuses: ProjectStatus[] = ['script_review', 'slide_review', 'video_review'];
  let pendingReviews = 0;
  let publishedThisMonth = 0;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const p of projects) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    if (reviewStatuses.includes(p.status)) {
      pendingReviews++;
    }
    if (p.status === 'published' && p.updatedAt.startsWith(thisMonth)) {
      publishedThisMonth++;
    }
  }

  const seriesMap = new Map<string, typeof projects[0]['planning']['series']>();
  for (const p of projects) {
    if (p.planning.series) {
      seriesMap.set(p.planning.series.seriesId, p.planning.series);
    }
  }

  return {
    statusCounts: statusCounts as Record<ProjectStatus, number>,
    publishedThisMonth,
    pendingReviews,
    recentProjects: projects
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)
      .map(toProjectSummary),
    activeSeries: Array.from(seriesMap.values()).filter(Boolean) as any[],
  };
}

// -----------------------------------------------------------------------------
// デフォルト設定
// -----------------------------------------------------------------------------

/** HARMONIC insight ブランド用デザインテンプレート */
export const HARMONIC_DESIGN_TEMPLATE: DesignTemplate = {
  name: 'HARMONIC insight Standard',
  brandColors: {
    primary: '#B8942F',   // Gold
    secondary: '#FAF8F5', // Ivory
    dark: '#1C1917',
    accent: '#3B82F6',
  },
  fonts: {
    heading: 'Noto Sans JP',
    body: 'Noto Sans JP',
    code: 'JetBrains Mono',
  },
  aspectRatio: '16:9',
};

/** デフォルトナレーション設定 */
export const DEFAULT_NARRATION: NarrationConfig = {
  speaker: 'zundamon',
  speed: 1.0,
  pauseBetweenScenes: 500,
};
