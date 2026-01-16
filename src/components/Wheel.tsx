'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { TeamMember } from '@/types';

interface WheelProps {
  members: TeamMember[];
  isSpinning: boolean;
  targetMemberId: string | null;
  onSpinComplete: () => void;
  label: string;
  roleType: 'moderator' | 'notetaker';
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

export default function Wheel({
  members,
  isSpinning,
  targetMemberId,
  onSpinComplete,
  label,
  roleType,
}: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const spinStarted = useRef(false);
  const onSpinCompleteRef = useRef(onSpinComplete);

  // Keep callback ref updated
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  const startSpin = useCallback(() => {
    if (!targetMemberId) return;

    const targetIndex = members.findIndex(m => m.id === targetMemberId);
    if (targetIndex === -1) return;

    const segmentAngle = 360 / members.length;
    const targetAngle = segmentAngle * targetIndex + segmentAngle / 2;
    const fullRotations = (Math.floor(Math.random() * 4) + 5) * 360;
    const newRotation = rotation + fullRotations + (360 - targetAngle);

    setRotation(newRotation);

    // Call completion after spin animation finishes
    setTimeout(() => {
      onSpinCompleteRef.current();
    }, 4100);
  }, [members, targetMemberId, rotation]);

  useEffect(() => {
    if (isSpinning && !spinStarted.current) {
      spinStarted.current = true;
      startSpin();
    }

    if (!isSpinning) {
      spinStarted.current = false;
    }
  }, [isSpinning, startSpin]);

  const segmentAngle = 360 / members.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-xl font-semibold text-gray-700">{label}</span>

      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
        </div>

        {/* Wheel container */}
        <div
          className="relative w-80 h-80 rounded-full border-8 border-gray-800 overflow-hidden shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {/* SVG Wheel for better segments */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {members.map((member, index) => {
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
              const largeArc = segmentAngle > 180 ? 1 : 0;

              const x1 = 50 + 50 * Math.cos(startAngle);
              const y1 = 50 + 50 * Math.sin(startAngle);
              const x2 = 50 + 50 * Math.cos(endAngle);
              const y2 = 50 + 50 * Math.sin(endAngle);

              const midAngle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
              const textX = 50 + 32 * Math.cos(midAngle);
              const textY = 50 + 32 * Math.sin(midAngle);
              const textRotation = (index + 0.5) * segmentAngle;

              const color = COLORS[index % COLORS.length];

              return (
                <g key={member.id}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="#1a1a1a"
                    fontSize="4"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {member.name.substring(0, 3).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full border-4 border-gray-800 shadow-lg flex items-center justify-center">
            <span className="text-2xl">{roleType === 'moderator' ? '🎤' : '📝'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
