'use client';

import type { Mode } from '@/components/ModeSelector';

interface QuickActionsProps {
  mode: Mode;
  onActionClick?: (action: string) => void;
}

const quickActions: Record<Mode, string[]> = {
  context: [
    'Greeting an elder respectfully',
    'Ordering vegetarian food',
    'Temple/mosque etiquette',
    'Asking for directions',
    'Saying no politely',
    'Train platform help',
  ],
  haggling: [
    'Auto rickshaw ride',
    'Buying spices',
    'Pashmina shawl',
    'Souvenir shopping',
    'Street food pricing',
    'Getting a henna tattoo',
  ],
  visual: [
    'Try sample: Menu',
    'Try sample: Sign',
    'Try sample: Temple',
  ],
  audio: [
    'Where is the nearest temple?',
    'How much for a rickshaw?',
    'Is this vegetarian?',
    'Thank you very much',
  ],
};

export function QuickActions({ mode, onActionClick }: QuickActionsProps) {
  const actions = quickActions[mode] || [];

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onActionClick?.(action)}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-full transition-colors hover:border-blue-500/30 hover:text-white"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
