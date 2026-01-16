'use client';

import { useState } from 'react';
import { TeamMember } from '@/types';
import { generateId } from '@/lib/storage';

interface TeamRosterProps {
  members: TeamMember[];
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onAddMember: (member: TeamMember) => void;
  onRemoveMember: (id: string) => void;
  disabled: boolean;
}

export default function TeamRoster({
  members,
  onUpdateMember,
  onAddMember,
  onRemoveMember,
  disabled,
}: TeamRosterProps) {
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = () => {
    if (!newName.trim()) return;

    const member: TeamMember = {
      id: generateId(),
      name: newName.trim(),
      isActiveThisWeek: true,
      lastModeratorAt: null,
      lastNoteTakerAt: null,
    };

    onAddMember(member);
    setNewName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddMember();
    } else if (e.key === 'Escape') {
      setNewName('');
      setIsAdding(false);
    }
  };

  const activeCount = members.filter(m => m.isActiveThisWeek).length;

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Team Members
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({activeCount} active)
          </span>
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              member.isActiveThisWeek
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={member.isActiveThisWeek}
                  onChange={(e) =>
                    onUpdateMember(member.id, { isActiveThisWeek: e.target.checked })
                  }
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50" />
              </label>
              <span
                className={`font-medium ${
                  member.isActiveThisWeek ? 'text-gray-800' : 'text-gray-400 line-through'
                }`}
              >
                {member.name}
              </span>
            </div>
            <button
              onClick={() => onRemoveMember(member.id)}
              disabled={disabled}
              className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove member"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 p-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter name..."
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
            />
            <button
              onClick={handleAddMember}
              disabled={!newName.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewName('');
                setIsAdding(false);
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}

        {members.length === 0 && !isAdding && (
          <p className="text-center text-gray-500 py-4">
            No team members yet. Click &quot;+ Add&quot; to get started.
          </p>
        )}
      </div>
    </div>
  );
}
