'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { TeamMember, SpinResult } from '@/types';
import { getBadgesForMember } from '@/lib/badges';

interface CelebrationProps {
  member: TeamMember;
  roleType: 'moderator' | 'notetaker';
  onComplete: () => void;
  pendingResult?: SpinResult;
}

function fireConfetti() {
  // Big burst from both sides
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  confetti({ ...defaults, particleCount: 80, origin: { x: 0.2, y: 0.5 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.8, y: 0.5 } });

  // Delayed center burst
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      zIndex: 100,
    });
  }, 250);

  // Gold stars burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
      shapes: ['star'],
      zIndex: 100,
    });
  }, 500);
}

export default function Celebration({ member, roleType, onComplete, pendingResult }: CelebrationProps) {
  const hasFired = useRef(false);
  const role = roleType === 'moderator' ? 'moderator' : 'noteTaker' as const;
  const badges = getBadgesForMember(member.name, role, pendingResult);

  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      fireConfetti();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadeIn cursor-pointer"
      onClick={onComplete}
    >
      <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-2xl animate-scaleIn max-w-lg">
        {roleType === 'moderator' ? (
          <>
            <div className="relative w-80 h-52 mx-auto mb-4 rounded-xl overflow-hidden">
              <Image
                src="/rock-on.png"
                alt="Rock on!"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="text-3xl font-bold text-white/90 mb-2 tracking-wide uppercase">
              Moderator
            </div>
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-2xl animate-spotlight" />
              <div className="spotlight-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="spotlight-particle" style={{ '--i': i } as React.CSSProperties} />
                ))}
              </div>
              <div className="relative text-5xl font-black text-yellow-300 drop-shadow-lg px-4 py-1">
                {member.name}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-80 h-52 mx-auto mb-4 rounded-xl overflow-hidden">
              <Image
                src="/note-taker.png"
                alt="Taking notes!"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="text-3xl font-bold text-white/90 mb-2 tracking-wide uppercase">
              Note Taker
            </div>
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-2xl animate-spotlight" />
              <div className="spotlight-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="spotlight-particle" style={{ '--i': i } as React.CSSProperties} />
                ))}
              </div>
              <div className="relative text-5xl font-black text-yellow-300 drop-shadow-lg px-4 py-1">
                {member.name}
              </div>
            </div>
          </>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {badges.map((badge, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.color} animate-fadeIn`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {badge.emoji} {badge.label}
              </span>
            ))}
          </div>
        )}
        <div className="text-4xl space-x-2">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>🎉</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '100ms' }}>🎊</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '200ms' }}>🎉</span>
        </div>
        <p className="mt-4 text-white/60 text-sm">Click anywhere to continue</p>
      </div>
    </div>
  );
}
