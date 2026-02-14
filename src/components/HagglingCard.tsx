'use client';

import { TrendingDown, TrendingUp, Target, AlertCircle } from 'lucide-react';

interface HagglingCardProps {
  item: string;
  localPrice: string;
  touristPrice: string;
  openingOffer: string;
  walkAwayPrice: string;
}

export function HagglingCard({
  item,
  localPrice,
  touristPrice,
  openingOffer,
  walkAwayPrice,
}: HagglingCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-4 space-y-3">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-green-400" />
        {item}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-neutral-400 mb-1">
            <TrendingDown className="w-3 h-3" />
            Local Price
          </div>
          <div className="text-green-400 font-semibold">{localPrice}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-neutral-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            Tourist Price
          </div>
          <div className="text-red-400 font-semibold">{touristPrice}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Your Opening</div>
          <div className="text-blue-400 font-semibold">{openingOffer}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Walk Away At</div>
          <div className="text-orange-400 font-semibold">{walkAwayPrice}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-green-900/20 border border-green-700/30 rounded-lg p-2">
        <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-green-300">
          Start low, be friendly, and don't be afraid to walk away. Vendors respect confident negotiation.
        </p>
      </div>
    </div>
  );
}
