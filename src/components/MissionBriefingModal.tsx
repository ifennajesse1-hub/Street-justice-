import React from 'react';
import { Radio, AlertOctagon, ChevronRight, Award, Shield } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-['Inter',sans-serif]">
      <div className="bg-slate-950 border-2 border-blue-500/60 rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Police Emergency Banner */}
        <div className="bg-blue-600 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-['Chakra_Petch'] font-black text-xs tracking-widest uppercase">
            <Shield className="w-4 h-4" />
            <span>PRECINCT 9 · PRIORITY DISPATCH TRANSMISSION</span>
          </div>
          <span className="text-[10px] font-mono bg-blue-900/60 px-2 py-0.5 rounded text-blue-100 font-bold">
            10-33 EMERGENCY
          </span>
        </div>

        <div className="p-6">
          <div className="text-xs font-['Chakra_Petch'] font-bold text-blue-400 uppercase tracking-wider mb-1">
            {mission.subtitle}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mb-3">
            {mission.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {mission.description}
          </p>

          {/* Radio Dialogue Log */}
          {mission.dialogueIntro.length > 0 && (
            <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-3.5 mb-5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Tactical Comms Log</span>
              </div>
              {mission.dialogueIntro.map((line, idx) => (
                <div key={idx} className="text-xs font-mono text-slate-300 leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Mission Objectives & Bounties */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mb-6">
            <div>
              <div className="text-[10px] uppercase font-['Chakra_Petch'] text-slate-400">
                Department Reward
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                +${mission.rewardMoney.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-['Chakra_Petch'] text-slate-400">
                Commendation
              </div>
              <div className="text-lg font-mono font-bold text-blue-400">
                +{mission.rewardXP} XP
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-['Chakra_Petch'] text-slate-400">
                Required Rank
              </div>
              <div className="text-lg font-mono font-bold text-slate-200">
                Rank {mission.requiredRank}
              </div>
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-black text-sm tracking-wider uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <span>ACCEPT CALL & DEPLOY</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
