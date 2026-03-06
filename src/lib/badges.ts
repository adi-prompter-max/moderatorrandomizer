import { SpinResult } from '@/types';
import { getHistory } from './storage';

export interface Badge {
  label: string;
  emoji: string;
  color: string; // tailwind bg color class
}

/**
 * Compute badges for a given member based on spin history.
 * Optionally include a new result that hasn't been saved to history yet.
 */
export function getBadgesForMember(
  memberName: string,
  role: 'moderator' | 'noteTaker',
  pendingResult?: SpinResult
): Badge[] {
  const history = getHistory();
  const allResults = pendingResult ? [...history, pendingResult] : history;

  if (allResults.length === 0) return [];

  const badges: Badge[] = [];
  const nameLower = memberName.toLowerCase();

  // Count total times in each role
  const modCount = allResults.filter(r => r.moderator.name.toLowerCase() === nameLower).length;
  const noteCount = allResults.filter(r => r.noteTaker.name.toLowerCase() === nameLower).length;
  const totalCount = modCount + noteCount;

  // Calculate current streak for the relevant role
  const streak = getCurrentStreak(allResults, nameLower, role);

  // --- First timer badges ---
  if (role === 'moderator' && modCount === 1) {
    badges.push({ label: 'First Time Moderator', emoji: '\u2B50', color: 'bg-yellow-100 text-yellow-800' });
  }
  if (role === 'noteTaker' && noteCount === 1) {
    badges.push({ label: 'First Time Note Taker', emoji: '\u2B50', color: 'bg-yellow-100 text-yellow-800' });
  }

  // --- Streak badges ---
  if (streak >= 2) {
    const streakLabels: Record<number, string> = {
      2: 'On a Roll',
      3: 'Hat Trick',
      4: 'Unstoppable',
      5: 'Legendary',
    };
    const streakLabel = streakLabels[Math.min(streak, 5)] || 'Legendary';
    badges.push({
      label: `${streakLabel} (${streak}x ${role === 'moderator' ? 'Mod' : 'Notes'} streak)`,
      emoji: '\uD83D\uDD25',
      color: 'bg-orange-100 text-orange-800',
    });
  }

  // --- Veteran badges ---
  if (role === 'moderator' && modCount >= 5) {
    badges.push({ label: 'Veteran Moderator', emoji: '\uD83C\uDFC6', color: 'bg-purple-100 text-purple-800' });
  }
  if (role === 'noteTaker' && noteCount >= 5) {
    badges.push({ label: 'Note-Taking Pro', emoji: '\uD83C\uDFC6', color: 'bg-violet-100 text-violet-800' });
  }

  // --- Iron Man badge (10+ total assignments) ---
  if (totalCount >= 10) {
    badges.push({ label: 'Iron Man', emoji: '\uD83E\uDDBE', color: 'bg-red-100 text-red-800' });
  }

  return badges;
}

function getCurrentStreak(
  results: SpinResult[],
  nameLower: string,
  role: 'moderator' | 'noteTaker'
): number {
  let streak = 0;
  // Walk backwards through results
  for (let i = results.length - 1; i >= 0; i--) {
    const holder = role === 'moderator' ? results[i].moderator : results[i].noteTaker;
    if (holder.name.toLowerCase() === nameLower) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
