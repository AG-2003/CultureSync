'use client';

import { Mic, MicOff } from 'lucide-react';

interface AudioControlsProps {
  isActive: boolean;
  isConnecting?: boolean;
  direction: 'you-them' | 'them-you';
  onDirectionChange: (direction: 'you-them' | 'them-you') => void;
  onMicClick: () => void;
  targetLanguage?: string;
}

export function AudioControls({
  isActive,
  isConnecting = false,
  direction,
  onDirectionChange,
  onMicClick,
  targetLanguage = 'Hindi',
}: AudioControlsProps) {
  const langLabel = targetLanguage.split('/')[0]; // "Hindi/Marathi" → "Hindi"

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-4 border-b border-slate-800">
      {/* Direction Toggle */}
      <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
        <button
          onClick={() => onDirectionChange('you-them')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            direction === 'you-them'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          You &rarr; Them
        </button>
        <button
          onClick={() => onDirectionChange('them-you')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            direction === 'them-you'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Them &rarr; You
        </button>
      </div>

      {/* Instruction Text */}
      <p className="text-xs text-slate-500 text-center">
        {direction === 'you-them'
          ? `Speak English — ${langLabel} plays for them`
          : `Hold phone toward speaker — English plays for you`}
      </p>

      {/* Mic Button */}
      <button
        onClick={onMicClick}
        disabled={isConnecting}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isConnecting
            ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/40'
            : isActive
            ? direction === 'you-them'
              ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40'
              : 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/40'
            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/50'
        } disabled:cursor-not-allowed`}
        aria-label={isConnecting ? 'Connecting...' : isActive ? 'Stop listening' : 'Start listening'}
      >
        {isActive ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className={`w-10 h-10 text-slate-300 ${isConnecting ? 'animate-bounce' : ''}`} />
        )}
      </button>

      <p className="text-xs text-slate-500">
        {isConnecting
          ? 'Connecting...'
          : isActive
          ? direction === 'you-them' ? 'Listening... speak English' : 'Listening...'
          : 'Tap to speak'}
      </p>
    </div>
  );
}
