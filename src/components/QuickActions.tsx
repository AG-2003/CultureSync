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
          className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full transition-colors"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
