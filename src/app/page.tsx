'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { TeamMember, SpinResult, SpinPhase } from '@/types';
import { getTeam, saveTeam, addToHistory, seedDefaultTeam } from '@/lib/storage';
import { selectWithFairRotation, getLastSpinResult } from '@/lib/selection';
import TeamRoster from '@/components/TeamRoster';
import Wheel from '@/components/Wheel';
import Results from '@/components/Results';
import Celebration from '@/components/Celebration';

// Extended phases to include celebration screens
type ExtendedPhase = SpinPhase | 'celebrating-moderator' | 'celebrating-notetaker';

export default function Home() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [spinPhase, setSpinPhase] = useState<ExtendedPhase>('idle');
  const [selectedModerator, setSelectedModerator] = useState<TeamMember | null>(null);
  const [selectedNoteTaker, setSelectedNoteTaker] = useState<TeamMember | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load team from localStorage on mount (seed default team if empty)
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
  }, []);

  // Save team to localStorage whenever it changes
  useEffect(() => {
    if (mounted && team.length > 0) {
      saveTeam(team);
    }
  }, [team, mounted]);

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
    setTeam(prev =>
      prev.map(m => ({ ...m, isActiveThisWeek: true }))
    );
    setResult(null);
    setSpinPhase('idle');
    setSelectedModerator(null);
    setSelectedNoteTaker(null);
    setHasPlayedAudio(false); // Allow audio to play again on next week's first spin
  };

  const startSpin = () => {
    if (activeMembers.length < 2) {
      alert('You need at least 2 active members to spin!');
      return;
    }

    // Play the WWTBAM audio on first spin only
    if (!hasPlayedAudio && audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
      setHasPlayedAudio(true);
    }

    // Get last week's result to exclude those members
    const lastResult = getLastSpinResult();
    const excludeFromModerator: string[] = [];

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
  }, [selectedModerator, activeMembers]);

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
      {/* Hidden audio element for WWTBAM sound */}
      <audio ref={audioRef} src="/wwtbam_1000_win.mp3" preload="auto" />

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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Who wants to be the moderator and note taker?
          </h1>
          <div className="relative w-[500px] h-[280px] mx-auto rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/who-wants-moderator.png"
              alt="Who wants to be the moderator?"
              fill
              className="object-cover"
              priority
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
