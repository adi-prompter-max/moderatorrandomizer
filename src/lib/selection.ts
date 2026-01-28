import { TeamMember, SpinResult } from '@/types';
import { getHistory } from './storage';

// Aditya has a reduced chance of being selected (1 in 20)
const REDUCED_CHANCE_NAME = 'Aditya';
const REDUCED_CHANCE_PROBABILITY = 0.05; // 5% chance (1 in 20)

/**
 * Get the last spin result from history
 */
export function getLastSpinResult(): SpinResult | null {
  const history = getHistory();
  if (history.length === 0) return null;
  return history[history.length - 1];
}

/**
 * Check if a member has reduced selection chance
 */
function hasReducedChance(member: TeamMember): boolean {
  return member.name.toLowerCase() === REDUCED_CHANCE_NAME.toLowerCase();
}

/**
 * Role Selection Algorithm with Fair Rotation
 *
 * Priority logic:
 * 1. Exclude last week's role holder (if there are enough members)
 * 2. People who have never held the role get highest priority
 * 3. People who held the role longest ago get next priority
 * 4. Random selection as tie-breaker among equal priority candidates
 * 5. Special rule: Aditya has only 1/20 chance of being selected
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
  let selectedMember = samePriorityCandidates[Math.floor(Math.random() * samePriorityCandidates.length)];

  // Special rule: If Aditya is selected, apply reduced probability
  if (hasReducedChance(selectedMember)) {
    const roll = Math.random();
    // Only 5% chance (1 in 20) Aditya actually gets selected
    if (roll > REDUCED_CHANCE_PROBABILITY) {
      // Re-select from other candidates (excluding Aditya)
      const otherCandidates = samePriorityCandidates.filter(m => !hasReducedChance(m));

      if (otherCandidates.length > 0) {
        selectedMember = otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
      } else {
        // If no other same-priority candidates, try from all eligible (excluding Aditya)
        const otherEligible = eligible.filter(m => !hasReducedChance(m));
        if (otherEligible.length > 0) {
          selectedMember = otherEligible[Math.floor(Math.random() * otherEligible.length)];
        }
        // If Aditya is the only option, they get selected anyway
      }
    }
  }

  return selectedMember;
}

/**
 * Get the wheel segment index for a member
 * Used for animating the wheel to stop at the correct position
 */
export function getMemberWheelIndex(members: TeamMember[], memberId: string): number {
  return members.findIndex(m => m.id === memberId);
}
