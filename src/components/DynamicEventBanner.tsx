import React from 'react';
import { Radio, AlertTriangle, Compass, X } from 'lucide-react';
import { DynamicEvent } from '../types/game';

interface DynamicEventBannerProps {
  event: DynamicEvent | null;
  onRespond: (event: DynamicEvent) => void;
  onDismiss: () => void;
}

export const DynamicEventBanner: React.FC<DynamicEventBannerProps> = ({
  event,
  onRespond,
  onDismiss,
}) => {
  if (!event || !event.active) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto bg-slate-950/95 border-2 border-red-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto select-none animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-xl shrink-0 animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider text-red-400">
                DISPATCH 911 INCOMING CALL
              </span>
              <span className="text-[10px] bg-red-950 text-red-300 font-mono font-bold px-1.5 py-0.5 rounded border border-red-700/60">
                10-CODE ALERT
              </span>
            </div>
            <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 mt-0.5">
              {event.title}
            </div>
            <p className="text-xs text-slate-300 mt-1">{event.description}</p>
            <div className="flex items-center gap-3 text-xs font-mono mt-2 text-slate-400">
              <span className="text-amber-400 font-semibold">Location: {event.locationName}</span>
              <span className="text-emerald-400 font-bold">+${event.rewardMoney}</span>
              <span className="text-blue-400 font-bold">+{event.rewardXP} XP</span>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 p-1"
          title="Dismiss Call"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onRespond(event)}
          className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Compass className="w-4 h-4" />
          <span>RESPOND & ROUTE GPS WAYPOINT</span>
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-['Chakra_Petch'] text-xs font-semibold uppercase rounded-xl transition-colors"
        >
          DISMISS
        </button>
      </div>
    </div>
  );
};
