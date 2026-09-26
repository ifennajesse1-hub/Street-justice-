import React from 'react';
import { Award, AlertTriangle, RotateCcw, ChevronRight, CheckCircle2, Shield, Star, DollarSign, Zap } from 'lucide-react';
import { Mission, PlayerStats } from '../types/game';

interface GameStatusModalProps {
  status: 'victory' | 'defeat' | null;
  mission?: Mission;
  stats: PlayerStats;
  onRestart: () => void;
  onContinue: () => void;
}

export const GameStatusModal: React.FC<GameStatusModalProps> = ({
  status,
  mission,
  stats,
  onRestart,
  onContinue,
}) => {
  if (!status) return null;

  const isVictory = status === 'victory';
  const isLevel2OrHigher = stats.rank >= 2;

  // XP Progress Calculation for Level 1 -> Level 2 (0 to 600)
  const currentXP = stats.xp;
  const targetXP = 600;
  const xpRatio = Math.min(1.0, currentXP / targetXP);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none font-['Inter',sans-serif]">
      <div
        className={`bg-slate-950 border-2 rounded-xl w-full max-w-lg shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200 ${
          isVictory ? 'border-emerald-500/80' : 'border-red-600/80'
        }`}
      >
        {/* Top Header Banner */}
        <div
          className={`py-3 px-5 flex items-center justify-between text-white font-['Chakra_Petch'] font-black text-xs sm:text-sm tracking-widest uppercase ${
            isVictory ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {isVictory ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{isVictory ? 'COMMENDATION · CHAPTER 1 CLEARED' : 'OFFICER DOWN · 10-99 EMERGENCY'}</span>
          </div>
          <span className="font-mono text-[10px] bg-black/30 px-2 py-0.5 rounded font-bold">
            PRECINCT 9
          </span>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-100 tracking-tight mb-2">
              {isVictory ? 'Alleyway Disturbance Resolved' : 'Critical Injury in Action'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {isVictory
                ? 'Officer Alex Carter neutralized the syndicate squad in Commercial Alley. Department commendation and case payout granted.'
                : 'Officer Alex Carter has fallen in the line of duty. Paramedics extracted you to Metro General Hospital.'}
            </p>
          </div>

          {isVictory && (
            <div className="space-y-4 mb-6">
              {/* Rewards Summary Grid */}
              <div className="grid grid-cols-3 gap-2 border border-slate-800 bg-slate-900/60 rounded-lg p-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-['Chakra_Petch'] uppercase font-semibold">
                    Department Bounty
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                    +${mission ? mission.rewardMoney : 450}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-['Chakra_Petch'] uppercase font-semibold">
                    Officer XP
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-blue-400">
                    +{mission ? mission.rewardXP : 300} XP
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-['Chakra_Petch'] uppercase font-semibold">
                    Arrests Made
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-amber-400">
                    {stats.arrests} Cuffed
                  </div>
                </div>
              </div>

              {/* LEVEL PROGRESSION BAR */}
              <div className="border border-blue-500/30 bg-blue-950/20 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-['Chakra_Petch'] font-bold text-slate-200">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>CAREER PROGRESSION</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-blue-400">
                    {currentXP} / {targetXP} XP
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                    style={{ width: `${xpRatio * 100}%` }}
                  />
                </div>

                {/* PROMOTION BADGE */}
                {isLevel2OrHigher ? (
                  <div className="mt-3 flex items-center justify-center gap-2 bg-emerald-950/80 border border-emerald-500/50 py-1.5 px-3 rounded text-emerald-300 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider animate-pulse">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>PROMOTION GRANTED: PATROL OFFICER (LEVEL 2)</span>
                  </div>
                ) : (
                  <div className="mt-2 text-center text-[11px] text-slate-400">
                    Complete next patrol or arrest suspects to reach Rank 2 (Patrol Officer).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isVictory ? (
              <button
                onClick={onContinue}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-['Chakra_Petch'] font-bold text-sm tracking-wider uppercase rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all"
              >
                <span>PROCEED TO CHAPTER 2: WAREHOUSE BUST</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onRestart}
                className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-['Chakra_Petch'] font-bold text-sm tracking-wider uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESPAWN AT POLICE PRECINCT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
