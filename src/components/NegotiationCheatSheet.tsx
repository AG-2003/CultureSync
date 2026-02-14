'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface NegotiationCheatSheetProps {
  item: string;
  localPrice: string;
  touristPrice: string;
  openingOffer: string;
  walkAwayPrice: string;
  phrases: string[];
  onDismiss: () => void;
}

export function NegotiationCheatSheet({
  item,
  localPrice,
  touristPrice,
  openingOffer,
  walkAwayPrice,
  phrases,
  onDismiss,
}: NegotiationCheatSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 border border-emerald-700/40 rounded-xl overflow-hidden">
      {/* Collapsed View */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-sm">
            <div className="text-white font-semibold">{item}</div>
            <div className="text-emerald-400 text-xs">
              {localPrice} &bull; Opening: {openingOffer}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-emerald-700/30 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-emerald-400" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-700/30 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-emerald-700/30 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-slate-400">Local Price</div>
              <div className="text-emerald-400 font-semibold">{localPrice}</div>
            </div>
            <div>
              <div className="text-slate-400">Tourist Price</div>
              <div className="text-red-400 font-semibold">{touristPrice}</div>
            </div>
            <div>
              <div className="text-slate-400">Your Opening</div>
              <div className="text-cyan-400 font-semibold">{openingOffer}</div>
            </div>
            <div>
              <div className="text-slate-400">Walk Away At</div>
              <div className="text-amber-400 font-semibold">{walkAwayPrice}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-2">Key Phrases:</div>
            <div className="space-y-1">
              {phrases.map((phrase, index) => (
                <div
                  key={index}
                  className="text-xs text-emerald-300 bg-emerald-900/20 rounded px-2 py-1"
                >
                  &bull; {phrase}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
