import { TeamMember, SpinResult } from '@/types';

const TEAM_KEY = 'standup-wheel-team';
const HISTORY_KEY = 'standup-wheel-history';
const LAST_RESET_KEY = 'standup-wheel-last-reset';
const CURRENT_WEEK_ROLES_KEY = 'standup-wheel-current-week-roles';

export interface CurrentWeekRoles {
  moderator: string;
  noteTaker: string;
}

export function getCurrentWeekRoles(): CurrentWeekRoles | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_WEEK_ROLES_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveCurrentWeekRoles(roles: CurrentWeekRoles): void {
  localStorage.setItem(CURRENT_WEEK_ROLES_KEY, JSON.stringify(roles));
}

export function getTeam(): TeamMember[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TEAM_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTeam(team: TeamMember[]): void {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function getHistory(): SpinResult[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveHistory(history: SpinResult[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function addToHistory(result: SpinResult): void {
  const history = getHistory();
  history.push(result);
  saveHistory(history);
}

export function getLastResetDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_RESET_KEY);
}

export function setLastResetDate(date: string): void {
  localStorage.setItem(LAST_RESET_KEY, date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const DEFAULT_TEAM_NAMES = [
  'Gino', 'Robert', 'Ann-Christine', 'Alina', 'Sebastian',
  'Mauritz', 'Andreas', 'Anna', 'Aditya', 'Joshua',
  'Noor', 'Max', 'Justus', 'Johannes', 'Alessandro', 'Kenan', 'Steven'
];

export function seedDefaultTeam(): TeamMember[] {
  const team: TeamMember[] = DEFAULT_TEAM_NAMES.map(name => ({
    id: generateId(),
    name,
    isActiveThisWeek: true,
    lastModeratorAt: null,
    lastNoteTakerAt: null,
  }));
  saveTeam(team);
  return team;
}
