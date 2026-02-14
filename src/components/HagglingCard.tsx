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
    <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/40 rounded-xl p-4 space-y-3">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-emerald-400" />
        {item}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <TrendingDown className="w-3 h-3" />
            Local Price
          </div>
          <div className="text-emerald-400 font-semibold">{localPrice}</div>
        </div>

        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            Tourist Price
          </div>
          <div className="text-red-400 font-semibold">{touristPrice}</div>
        </div>

        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Your Opening</div>
          <div className="text-cyan-400 font-semibold">{openingOffer}</div>
        </div>

        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Walk Away At</div>
          <div className="text-amber-400 font-semibold">{walkAwayPrice}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-2">
        <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-300">
          Start low, be friendly, and don't be afraid to walk away. Vendors respect confident negotiation.
        </p>
      </div>
    </div>
  );
}
