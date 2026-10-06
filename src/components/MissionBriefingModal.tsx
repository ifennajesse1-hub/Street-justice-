import React, { useEffect, useState } from 'react';
import { Radio, ChevronRight, Shield, Minimize2, Maximize2, Compass } from 'lucide-react';
import { Mission } from '../types/game';

interface MissionBriefingModalProps {
  mission: Mission;
  isOpen: boolean;
  onStart: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  mission,
  isOpen,
  onStart,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3.5);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      setSecondsRemaining(3.5);
      return;
    }

    // Auto-minimize smoothly after 3.5 seconds so player can drive and see the city completely unobstructed
    const minimizeTimeout = setTimeout(() => {
      setIsMinimized(true);
      setSecondsRemaining(0);
    }, 3500);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, parseFloat((prev - 0.5).toFixed(1))));
    }, 500);

    return () => {
      clearTimeout(minimizeTimeout);
      clearInterval(timer);
    };
  }, [isOpen, mission.id]);

  if (!isOpen) return null;

  // Minimized floating dispatch ticker (unobtrusive slim glass pill)
  if (isMinimized) {
    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 max-w-[92%] sm:max-w-md w-full select-none font-['Inter',sans-serif] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-slate-950/85 border border-blue-500/50 rounded-full px-3 py-1.5 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
            <div className="truncate">
              <span className="font-['Chakra_Petch'] text-[9px] font-bold text-blue-400 uppercase tracking-wider block">
                ACTIVE 911 DISPATCH
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate block">
                {mission.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-slate-400 hover:text-slate-100 bg-slate-900/90 rounded-full"
              title="Expand Details"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStart}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-bold text-[10px] uppercase rounded-full tracking-wider flex items-center gap-1 shadow transition-colors"
            >
              <span>PATROL</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-40 max-w-[92%] sm:max-w-md w-full select-none font-['Inter',sans-serif] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="bg-slate-950/90 border border-blue-500/60 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.35)] backdrop-blur-xl overflow-hidden text-slate-100 pointer-events-auto">
        {/* Police Emergency Banner */}
        <div className="bg-blue-600/90 px-3.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white font-['Chakra_Petch'] font-black text-[11px] tracking-wider uppercase">
            <Shield className="w-3 h-3" />
            <span>PRECINCT 9 · PRIORITY DISPATCH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-blue-950/80 text-blue-200 px-1.5 py-0.5 rounded font-bold">
              Minimizing in {secondsRemaining}s
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white p-0.5"
              title="Minimize Briefing"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress bar countdown */}
        <div className="w-full bg-slate-900 h-0.5 overflow-hidden">
          <div
            className="bg-blue-400 h-full transition-all duration-500 ease-linear"
            style={{ width: `${(secondsRemaining / 3.5) * 100}%` }}
          />
        </div>

        <div className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-['Chakra_Petch'] font-bold text-blue-400 uppercase tracking-wider">
                {mission.subtitle}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight mt-0.5">
                {mission.title}
              </h2>
            </div>
            <div className="text-right shrink-0 font-mono">
              <span className="text-emerald-400 font-bold text-xs block">+${mission.rewardMoney}</span>
              <span className="text-blue-400 text-[10px] font-semibold block">+{mission.rewardXP} XP</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-1.5 line-clamp-2">
            {mission.description}
          </p>

          {/* Radio Dialogue Snippet */}
          {mission.dialogueIntro.length > 0 && (
            <div className="border border-slate-800 bg-slate-900/70 rounded-lg p-2 mt-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Radio Comms</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 leading-snug line-clamp-2">
                {mission.dialogueIntro[0]}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
            <button
              onClick={onStart}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-black text-xs tracking-wider uppercase rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-transform active:scale-98"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>ROUTE GPS NOW</span>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-['Chakra_Petch'] text-xs font-bold uppercase rounded-xl transition-colors"
            >
              MINIMIZE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
