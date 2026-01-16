'use client';

import { useState } from 'react';
import { SpinResult } from '@/types';

interface ResultsProps {
  result: SpinResult | null;
  onReset: () => void;
}

export default function Results({ result, onReset }: ResultsProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const slackMessage = `🎤 Moderator: ${result.moderator.name}\n📝 Note Taker: ${result.noteTaker.name}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(slackMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        This Week&apos;s Assignments
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-2xl">🎤</span>
          <div>
            <p className="text-sm text-gray-500">Moderator</p>
            <p className="text-lg font-semibold text-gray-800">{result.moderator.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-2xl">📝</span>
          <div>
            <p className="text-sm text-gray-500">Note Taker</p>
            <p className="text-lg font-semibold text-gray-800">{result.noteTaker.name}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleCopy}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {copied ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied to Clipboard!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy for Slack
            </span>
          )}
        </button>

        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Spin Again
        </button>
      </div>
    </div>
  );
}
