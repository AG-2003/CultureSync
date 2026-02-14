'use client';

import { MessageSquare, DollarSign, Camera, Mic } from 'lucide-react';

export type Mode = 'context' | 'haggling' | 'visual' | 'audio';

interface ModeSelectorProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes = [
  { id: 'context' as Mode, label: 'Chat', icon: MessageSquare, color: 'text-blue-400', activeBar: 'bg-blue-400' },
  { id: 'haggling' as Mode, label: 'Bargain', icon: DollarSign, color: 'text-green-400', activeBar: 'bg-green-400' },
  { id: 'visual' as Mode, label: 'Vision', icon: Camera, color: 'text-purple-400', activeBar: 'bg-purple-400' },
  { id: 'audio' as Mode, label: 'Audio', icon: Mic, color: 'text-orange-400', activeBar: 'bg-orange-400' },
];

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="bg-neutral-800 border-b border-neutral-700 px-2 py-1">
      <div className="flex justify-around">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive ? '' : 'hover:bg-neutral-750'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? mode.color : 'text-neutral-500'}`} />
              <span className={`text-xs font-medium ${
                isActive ? 'text-white' : 'text-neutral-500'
              }`}>
                {mode.label}
              </span>
              {isActive && (
                <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full ${mode.activeBar}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
