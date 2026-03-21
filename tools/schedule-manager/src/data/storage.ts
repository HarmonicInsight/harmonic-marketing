import { BusinessTask, TaskEvent, TeamMember } from './types';
import { mockTasks, mockMembers, mockEvents } from './mockData';

const STORAGE_KEYS = {
  tasks: 'harmonic-tasks',
  members: 'harmonic-members',
  events: 'harmonic-events',
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadTasks(): BusinessTask[] {
  return load<BusinessTask>(STORAGE_KEYS.tasks, mockTasks);
}

export function saveTasks(tasks: BusinessTask[]) {
  save(STORAGE_KEYS.tasks, tasks);
}

export function loadMembers(): TeamMember[] {
  return load<TeamMember>(STORAGE_KEYS.members, mockMembers);
}

export function saveMembers(members: TeamMember[]) {
  save(STORAGE_KEYS.members, members);
}

export function loadEvents(): TaskEvent[] {
  return load<TaskEvent>(STORAGE_KEYS.events, mockEvents);
}

export function saveEvents(events: TaskEvent[]) {
  save(STORAGE_KEYS.events, events);
}
