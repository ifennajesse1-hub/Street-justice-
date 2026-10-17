import React from 'react';
import { Shield, AlertTriangle, DollarSign, Award, X, Sparkles, Scale } from 'lucide-react';
import { DynamicEvent, PlayerStats } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface EventChoiceModalProps {
  event: DynamicEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onMakeChoice: (choice: 'good' | 'shady') => void;
  carterReputation: number;
  stats?: PlayerStats;
}

export const EventChoiceModal: React.FC<EventChoiceModalProps> = ({
  event,
  isOpen,
  onClose,
  onMakeChoice,
  carterReputation,
  stats,
}) => {
  if (!isOpen || !event || !event.moralChoice) return null;

  const choice = event.moralChoice;
  const policeRep = stats?.policeReputation ?? carterReputation;
  const underworldRep = stats?.underworldReputation ?? 15;
  const suspicion = stats?.suspicionLevel ?? 10;

  const handleSelect = (type: 'good' | 'shady') => {
    if (type === 'good') {
      soundEngine.playRadioChime();
    } else {
      soundEngine.playMegaphoneChime();
    }
    onMakeChoice(type);
  };

  // Determine moral standing description
  const getReputationStanding = (rep: number) => {
    if (rep >= 80) return { label: 'INCORRUPTIBLE PROTECTOR', color: 'text-blue-400' };
    if (rep >= 60) return { label: 'BY-THE-BOOK OFFICER', color: 'text-emerald-400' };
    if (rep >= 40) return { label: 'STREET PRAGMATIST', color: 'text-amber-400' };
    if (rep >= 20) return { label: 'COMPROMISED BAD COP', color: 'text-orange-400' };
    return { label: 'ROGUE STREET KINGPIN', color: 'text-red-400' };
  };

  const standing = getReputationStanding(carterReputation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm select-none font-['Inter',sans-serif] animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-blue-400 tracking-wider">
                  OFFICER CARTER'S CALL
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  BAD COP IN SHEEP'S CLOTHING
                </span>
              </div>
              <h3 className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase tracking-wide truncate max-w-xs sm:max-w-md">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Context & Prompt */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs flex flex-col gap-1.5">
          <p className="text-slate-300 italic font-serif leading-relaxed">
            "{choice.context}"
          </p>
          <div className="text-[11px] font-['Chakra_Petch'] font-semibold text-amber-400 flex items-center gap-1.5 uppercase pt-1 border-t border-slate-800/50">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{choice.prompt}</span>
          </div>
        </div>

        {/* Choice Cards (Good vs Shady) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* GOOD OPTION */}
          <button
            onClick={() => handleSelect('good')}
            className="group text-left bg-gradient-to-b from-blue-950/40 to-slate-900/80 hover:from-blue-900/50 hover:to-slate-800/90 border border-blue-500/40 hover:border-blue-400 rounded-xl p-3.5 transition-all shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-['Chakra_Petch'] font-bold text-[10px] uppercase flex items-center gap-1 border border-blue-500/30">
                  <Shield className="w-3 h-3 text-blue-400" />
                  LAWFUL DUTY
                </span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">
                  +{choice.goodOption.reputationBonus} REP
                </span>
              </div>
              <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100 group-hover:text-blue-300 transition-colors">
                {choice.goodOption.label}
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                {choice.goodOption.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              <div className="text-[10px] font-mono font-semibold text-emerald-400">
                {choice.goodOption.effect}
              </div>
              <div className="text-[10px] text-slate-400 italic">
                "{choice.goodOption.dialogue}"
              </div>
            </div>
          </button>

          {/* SHADY OPTION */}
          <button
            onClick={() => handleSelect('shady')}
            className="group text-left bg-gradient-to-b from-amber-950/30 to-slate-900/80 hover:from-amber-900/40 hover:to-slate-800/90 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 transition-all shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-['Chakra_Petch'] font-bold text-[10px] uppercase flex items-center gap-1 border border-amber-500/30">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  SHADY PROFIT
                </span>
                <span className="text-red-400 font-mono font-bold text-[11px]">
                  {choice.shadyOption.reputationBonus} REP
                </span>
              </div>
              <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100 group-hover:text-amber-300 transition-colors">
                {choice.shadyOption.label}
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                {choice.shadyOption.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              <div className="text-[10px] font-mono font-semibold text-amber-300">
                {choice.shadyOption.effect}
              </div>
              <div className="text-[10px] text-slate-400 italic">
                "{choice.shadyOption.dialogue}"
              </div>
            </div>
          </button>
        </div>

        {/* Double-Life Reputations Bar */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-4">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Police: {policeRep}%
            </span>
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Underworld: {underworldRep}%
            </span>
            <span className={`font-bold flex items-center gap-1 ${suspicion >= 50 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
              <AlertTriangle className="w-3 h-3" /> IA Heat: {suspicion}%
            </span>
          </div>
          <span className={`font-bold uppercase text-[10px] ${standing.color}`}>{standing.label}</span>
        </div>

        {/* Bottom Standing & Footnote */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>Carter's Double-Life: Legitimate badge by day, street fixer by night.</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 uppercase font-['Chakra_Petch'] text-[10px] tracking-wider transition-colors"
          >
            Decline Choice (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
