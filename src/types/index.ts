export interface TeamMember {
  id: string;
  name: string;
  isActiveThisWeek: boolean;
  lastModeratorAt: string | null; // ISO date string
  lastNoteTakerAt: string | null; // ISO date string
}

export interface SpinResult {
  moderator: TeamMember;
  noteTaker: TeamMember;
  timestamp: string;
}

export type SpinPhase = 'idle' | 'spinning-moderator' | 'spinning-notetaker' | 'complete';
