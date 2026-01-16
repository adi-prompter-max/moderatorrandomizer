'use client';

import Image from 'next/image';
import { TeamMember } from '@/types';

interface CelebrationProps {
  member: TeamMember;
  roleType: 'moderator' | 'notetaker';
  onComplete: () => void;
}

export default function Celebration({ member, roleType, onComplete }: CelebrationProps) {
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
            <div className="text-5xl font-black text-yellow-300 drop-shadow-lg mb-4">
              {member.name}
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
            <div className="text-5xl font-black text-yellow-300 drop-shadow-lg mb-4">
              {member.name}
            </div>
          </>
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
