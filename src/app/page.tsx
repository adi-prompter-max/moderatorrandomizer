'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TeamMember, SpinResult, SpinPhase } from '@/types';
import { getTeam, saveTeam, addToHistory, seedDefaultTeam, getCurrentWeekRoles, saveCurrentWeekRoles, CurrentWeekRoles } from '@/lib/storage';
import { selectWithFairRotation, getLastSpinResult } from '@/lib/selection';
import TeamRoster from '@/components/TeamRoster';
import Wheel from '@/components/Wheel';
import Results from '@/components/Results';
import Celebration from '@/components/Celebration';
import CurrentWeekRolesDisplay from '@/components/CurrentWeekRoles';

// Default initial values for current week roles
const DEFAULT_MODERATOR = 'Gino';
const DEFAULT_NOTE_TAKER = 'Robert';

// Extended phases to include celebration screens
type ExtendedPhase = SpinPhase | 'celebrating-moderator' | 'celebrating-notetaker';

export default function Home() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [spinPhase, setSpinPhase] = useState<ExtendedPhase>('idle');
  const [selectedModerator, setSelectedModerator] = useState<TeamMember | null>(null);
  const [selectedNoteTaker, setSelectedNoteTaker] = useState<TeamMember | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentWeekRoles, setCurrentWeekRoles] = useState<CurrentWeekRoles>({
    moderator: DEFAULT_MODERATOR,
    noteTaker: DEFAULT_NOTE_TAKER,
  });

  // Load team and current week roles from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTeam = getTeam();
    if (savedTeam.length > 0) {
      setTeam(savedTeam);
    } else {
      // Seed with default team members
      const defaultTeam = seedDefaultTeam();
      setTeam(defaultTeam);
    }

    // Load current week roles (or use defaults)
    const savedRoles = getCurrentWeekRoles();
    if (savedRoles) {
      setCurrentWeekRoles(savedRoles);
    } else {
      // Save default roles if none exist
      const defaultRoles = { moderator: DEFAULT_MODERATOR, noteTaker: DEFAULT_NOTE_TAKER };
      saveCurrentWeekRoles(defaultRoles);
    }
  }, []);

  // Save team to localStorage whenever it changes
  useEffect(() => {
    if (mounted && team.length > 0) {
      saveTeam(team);
    }
  }, [team, mounted]);

  // Toggle off current week's moderator and note taker on initial load
  useEffect(() => {
    if (!mounted || team.length === 0) return;

    const moderatorName = currentWeekRoles.moderator.toLowerCase();
    const noteTakerName = currentWeekRoles.noteTaker.toLowerCase();

    // Only run once on initial load to set the correct toggle state
    const needsUpdate = team.some(m => {
      const isModerator = m.name.toLowerCase() === moderatorName;
      const isNoteTaker = m.name.toLowerCase() === noteTakerName;
      return (isModerator || isNoteTaker) && m.isActiveThisWeek;
    });

    if (needsUpdate) {
      setTeam(prev =>
        prev.map(m => {
          const isModerator = m.name.toLowerCase() === moderatorName;
          const isNoteTaker = m.name.toLowerCase() === noteTakerName;
          if (isModerator || isNoteTaker) {
            return { ...m, isActiveThisWeek: false };
          }
          return m;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const activeMembers = team.filter(m => m.isActiveThisWeek);

  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    setTeam(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleAddMember = (member: TeamMember) => {
    setTeam(prev => [...prev, member]);
  };

  const handleRemoveMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const handleResetWeek = () => {
    const moderatorName = currentWeekRoles.moderator.toLowerCase();
    const noteTakerName = currentWeekRoles.noteTaker.toLowerCase();

    setTeam(prev =>
      prev.map(m => {
        const isModerator = m.name.toLowerCase() === moderatorName;
        const isNoteTaker = m.name.toLowerCase() === noteTakerName;
        // Keep current week's moderator and note taker toggled off
        return { ...m, isActiveThisWeek: !(isModerator || isNoteTaker) };
      })
    );
    setResult(null);
    setSpinPhase('idle');
    setSelectedModerator(null);
    setSelectedNoteTaker(null);
  };

  const startSpin = () => {
    if (activeMembers.length < 2) {
      alert('You need at least 2 active members to spin!');
      return;
    }

    // Get last week's result to exclude those members
    const lastResult = getLastSpinResult();
    const excludeFromModerator: string[] = [];

    // Exclude current week's moderator and note taker by name
    const currentWeekExcludedIds = team
      .filter(m =>
        m.name.toLowerCase() === currentWeekRoles.moderator.toLowerCase() ||
        m.name.toLowerCase() === currentWeekRoles.noteTaker.toLowerCase()
      )
      .map(m => m.id);
    excludeFromModerator.push(...currentWeekExcludedIds);

    // Exclude last week's moderator (if we have enough members)
    if (lastResult && activeMembers.length > 2) {
      excludeFromModerator.push(lastResult.moderator.id);
    }

    // Select moderator first
    const moderator = selectWithFairRotation(activeMembers, 'lastModeratorAt', excludeFromModerator);
    setSelectedModerator(moderator);
    setSpinPhase('spinning-moderator');
  };

  // When moderator wheel spin animation completes, show celebration
  const handleModeratorSpinComplete = useCallback(() => {
    setSpinPhase('celebrating-moderator');
  }, []);

  // When moderator celebration is dismissed, start note-taker spin
  const handleModeratorCelebrationComplete = useCallback(() => {
    if (!selectedModerator) return;

    // Get last week's result to exclude those members
    const lastResult = getLastSpinResult();
    const excludeFromNoteTaker: string[] = [selectedModerator.id]; // Always exclude current moderator

    // Exclude current week's moderator and note taker by name
    const currentWeekExcludedIds = team
      .filter(m =>
        m.name.toLowerCase() === currentWeekRoles.moderator.toLowerCase() ||
        m.name.toLowerCase() === currentWeekRoles.noteTaker.toLowerCase()
      )
      .map(m => m.id);
    excludeFromNoteTaker.push(...currentWeekExcludedIds);

    // Exclude last week's note taker (if we have enough members)
    if (lastResult && activeMembers.length > 3) {
      excludeFromNoteTaker.push(lastResult.noteTaker.id);
    }

    // Select note taker (excluding current moderator and last week's note taker)
    const noteTaker = selectWithFairRotation(
      activeMembers,
      'lastNoteTakerAt',
      excludeFromNoteTaker
    );
    setSelectedNoteTaker(noteTaker);
    setSpinPhase('spinning-notetaker');
  }, [selectedModerator, activeMembers, team, currentWeekRoles]);

  // When note-taker wheel spin animation completes, show celebration
  const handleNoteTakerSpinComplete = useCallback(() => {
    setSpinPhase('celebrating-notetaker');
  }, []);

  // When note-taker celebration is dismissed, show final results
  const handleNoteTakerCelebrationComplete = useCallback(() => {
    if (!selectedModerator || !selectedNoteTaker) return;

    const now = new Date().toISOString();

    // Update team with new role timestamps
    setTeam(prev =>
      prev.map(m => {
        if (m.id === selectedModerator.id) {
          return { ...m, lastModeratorAt: now };
        }
        if (m.id === selectedNoteTaker.id) {
          return { ...m, lastNoteTakerAt: now };
        }
        return m;
      })
    );

    // Create and save result
    const spinResult: SpinResult = {
      moderator: selectedModerator,
      noteTaker: selectedNoteTaker,
      timestamp: now,
    };

    addToHistory(spinResult);
    setResult(spinResult);
    setSpinPhase('complete');

    // Update current week roles for next spin
    const newRoles = {
      moderator: selectedModerator.name,
      noteTaker: selectedNoteTaker.name,
    };
    setCurrentWeekRoles(newRoles);
    saveCurrentWeekRoles(newRoles);
  }, [selectedModerator, selectedNoteTaker]);

  const handleReset = () => {
    setResult(null);
    setSpinPhase('idle');
    setSelectedModerator(null);
    setSelectedNoteTaker(null);
  };

  const handleUpdateAssignment = (role: 'moderator' | 'noteTaker', member: TeamMember) => {
    if (!result) return;

    const now = new Date().toISOString();

    // Update the result
    const updatedResult: SpinResult = {
      ...result,
      [role]: member,
      timestamp: now,
    };
    setResult(updatedResult);

    // Update team timestamps for the new assignment
    setTeam(prev =>
      prev.map(m => {
        if (m.id === member.id) {
          return {
            ...m,
            [role === 'moderator' ? 'lastModeratorAt' : 'lastNoteTakerAt']: now,
          };
        }
        return m;
      })
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
      {/* Celebration Overlays */}
      {spinPhase === 'celebrating-moderator' && selectedModerator && (
        <Celebration
          member={selectedModerator}
          roleType="moderator"
          onComplete={handleModeratorCelebrationComplete}
        />
      )}
      {spinPhase === 'celebrating-notetaker' && selectedNoteTaker && (
        <Celebration
          member={selectedNoteTaker}
          roleType="notetaker"
          onComplete={handleNoteTakerCelebrationComplete}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="relative w-[500px] h-[280px] mx-auto rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/who-wants-moderator.png"
              alt="Who wants to be the moderator?"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-4">
            <CurrentWeekRolesDisplay
              moderator={currentWeekRoles.moderator}
              noteTaker={currentWeekRoles.noteTaker}
              teamMembers={team.map(m => m.name)}
              onModeratorChange={(newName) => {
                const oldName = currentWeekRoles.moderator.toLowerCase();
                const newNameLower = newName.toLowerCase();
                const noteTakerName = currentWeekRoles.noteTaker.toLowerCase();

                // Toggle on old moderator (if not the note taker), toggle off new moderator
                setTeam(prev =>
                  prev.map(m => {
                    const memberName = m.name.toLowerCase();
                    if (memberName === oldName && memberName !== noteTakerName) {
                      return { ...m, isActiveThisWeek: true };
                    }
                    if (memberName === newNameLower) {
                      return { ...m, isActiveThisWeek: false };
                    }
                    return m;
                  })
                );

                const newRoles = { ...currentWeekRoles, moderator: newName };
                setCurrentWeekRoles(newRoles);
                saveCurrentWeekRoles(newRoles);
              }}
              onNoteTakerChange={(newName) => {
                const oldName = currentWeekRoles.noteTaker.toLowerCase();
                const newNameLower = newName.toLowerCase();
                const moderatorName = currentWeekRoles.moderator.toLowerCase();

                // Toggle on old note taker (if not the moderator), toggle off new note taker
                setTeam(prev =>
                  prev.map(m => {
                    const memberName = m.name.toLowerCase();
                    if (memberName === oldName && memberName !== moderatorName) {
                      return { ...m, isActiveThisWeek: true };
                    }
                    if (memberName === newNameLower) {
                      return { ...m, isActiveThisWeek: false };
                    }
                    return m;
                  })
                );

                const newRoles = { ...currentWeekRoles, noteTaker: newName };
                setCurrentWeekRoles(newRoles);
                saveCurrentWeekRoles(newRoles);
              }}
            />
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Left Panel - Team Roster */}
          <div className="w-full lg:w-80">
            <TeamRoster
              members={team}
              onUpdateMember={handleUpdateMember}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              disabled={spinPhase !== 'idle' && spinPhase !== 'complete'}
            />

            {team.length > 0 && (
              <button
                onClick={handleResetWeek}
                className="mt-4 w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
              >
                Reset for Next Week
              </button>
            )}
          </div>

          {/* Center Panel - Wheel */}
          <div className="flex flex-col items-center gap-6">
            {activeMembers.length >= 2 ? (
              <>
                {spinPhase === 'idle' && (
                  <div className="flex flex-col items-center gap-4">
                    <Wheel
                      members={activeMembers}
                      isSpinning={false}
                      targetMemberId={null}
                      onSpinComplete={() => {}}
                      label="Ready to Spin"
                      roleType="moderator"
                    />
                    <button
                      onClick={startSpin}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      Spin the Wheel!
                    </button>
                  </div>
                )}

                {(spinPhase === 'spinning-moderator' || spinPhase === 'celebrating-moderator') && (
                  <Wheel
                    members={activeMembers}
                    isSpinning={spinPhase === 'spinning-moderator'}
                    targetMemberId={selectedModerator?.id || null}
                    onSpinComplete={handleModeratorSpinComplete}
                    label="Selecting Moderator..."
                    roleType="moderator"
                  />
                )}

                {(spinPhase === 'spinning-notetaker' || spinPhase === 'celebrating-notetaker') && (
                  <Wheel
                    members={activeMembers}
                    isSpinning={spinPhase === 'spinning-notetaker'}
                    targetMemberId={selectedNoteTaker?.id || null}
                    onSpinComplete={handleNoteTakerSpinComplete}
                    label="Selecting Note Taker..."
                    roleType="notetaker"
                  />
                )}

                {spinPhase === 'complete' && result && (
                  <Results
                    result={result}
                    onReset={handleReset}
                    teamMembers={team}
                    onUpdateAssignment={handleUpdateAssignment}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12 px-8 bg-white/50 rounded-xl">
                <div className="text-6xl mb-4">🎡</div>
                <p className="text-gray-600 mb-2">
                  {team.length === 0
                    ? 'Add team members to get started'
                    : 'Mark at least 2 members as active to spin'}
                </p>
                <p className="text-sm text-gray-500">
                  Toggle members on the left to mark them as joining this week
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
