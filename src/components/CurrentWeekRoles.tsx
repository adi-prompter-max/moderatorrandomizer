'use client';

interface CurrentWeekRolesProps {
  moderator: string;
  noteTaker: string;
  teamMembers: string[];
  onModeratorChange: (name: string) => void;
  onNoteTakerChange: (name: string) => void;
}

export default function CurrentWeekRoles({
  moderator,
  noteTaker,
  teamMembers,
  onModeratorChange,
  onNoteTakerChange,
}: CurrentWeekRolesProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-start gap-2 bg-white/80 rounded-xl shadow-md px-6 py-3">
        <span className="text-lg font-semibold text-gray-800">This Week</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor="moderator-select" className="text-sm text-amber-700 font-medium">
              Moderator:
            </label>
            <select
              id="moderator-select"
              value={moderator}
              onChange={(e) => onModeratorChange(e.target.value)}
              className="font-semibold text-gray-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {teamMembers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <label htmlFor="notetaker-select" className="text-sm text-blue-700 font-medium">
              Note Taker:
            </label>
            <select
              id="notetaker-select"
              value={noteTaker}
              onChange={(e) => onNoteTakerChange(e.target.value)}
              className="font-semibold text-gray-800 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {teamMembers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {moderator} and {noteTaker} will be excluded from the wheel spin this week
      </p>
    </div>
  );
}
