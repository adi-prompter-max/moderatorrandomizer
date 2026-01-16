import { TeamMember, SpinResult } from '@/types';
import { getHistory } from './storage';

/**
 * Get the last spin result from history
 */
export function getLastSpinResult(): SpinResult | null {
  const history = getHistory();
  if (history.length === 0) return null;
  return history[history.length - 1];
}

/**
 * Role Selection Algorithm with Fair Rotation
 *
 * Priority logic:
 * 1. Exclude last week's role holder (if there are enough members)
 * 2. People who have never held the role get highest priority
 * 3. People who held the role longest ago get next priority
 * 4. Random selection as tie-breaker among equal priority candidates
 *
 * @param members - Array of active team members
 * @param roleKey - Which role timestamp to check ('lastModeratorAt' or 'lastNoteTakerAt')
 * @param excludeIds - Array of member IDs to exclude
 * @returns Selected team member
 */
export function selectWithFairRotation(
  members: TeamMember[],
  roleKey: 'lastModeratorAt' | 'lastNoteTakerAt',
  excludeIds: string[] = []
): TeamMember {
  // Filter out excluded members
  let eligible = members.filter(m => !excludeIds.includes(m.id));

  // If excluding leaves us with no options, fall back to all members
  // (minus the current spin's moderator if selecting note taker)
  if (eligible.length === 0) {
    eligible = members;
  }

  if (eligible.length === 0) {
    throw new Error('No eligible members for selection');
  }

  if (eligible.length === 1) {
    return eligible[0];
  }

  // Sort by role date (null = never held role = highest priority)
  const sorted = [...eligible].sort((a, b) => {
    const dateA = a[roleKey];
    const dateB = b[roleKey];

    // Never held role gets priority
    if (dateA === null && dateB !== null) return -1;
    if (dateA !== null && dateB === null) return 1;
    if (dateA === null && dateB === null) return 0;

    // Earlier date (longer ago) gets priority
    return new Date(dateA!).getTime() - new Date(dateB!).getTime();
  });

  // Find all members with the same priority (same date or all null)
  const highestPriorityDate = sorted[0][roleKey];
  const samePriorityCandidates = sorted.filter(m => {
    const date = m[roleKey];
    if (highestPriorityDate === null) return date === null;
    if (date === null) return false;
    return date === highestPriorityDate;
  });

  // Random tie-breaker among equal priority candidates
  const randomIndex = Math.floor(Math.random() * samePriorityCandidates.length);
  return samePriorityCandidates[randomIndex];
}

/**
 * Get the wheel segment index for a member
 * Used for animating the wheel to stop at the correct position
 */
export function getMemberWheelIndex(members: TeamMember[], memberId: string): number {
  return members.findIndex(m => m.id === memberId);
}
