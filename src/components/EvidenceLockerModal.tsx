import React, { useState } from 'react';
import {
  Shield,
  FileCheck2,
  Lock,
  X,
  AlertTriangle,
  Award,
  Gem,
  Coins,
  CheckCircle,
  Eye,
  Scale,
} from 'lucide-react';
import { PlayerStats, FictionalValuable, MoralStanding } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface EvidenceLockerModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onLogEvidenceHonor: (valuable: FictionalValuable) => void;
  onPocketContrabandCorrupt: (valuable: FictionalValuable) => void;
}

export function getMoralStandingDetails(integrity: number): {
  standing: MoralStanding;
  title: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  consequences: string;
} {
  if (integrity >= 85) {
    return {
      standing: 'incorruptible',
      title: 'Paragon Detective',
      badgeBg: 'bg-emerald-950/80',
      badgeBorder: 'border-emerald-400',
      badgeText: 'text-emerald-300',
      description: 'You uphold the law with unwavering ethics. Respected throughout Precinct 9 and City Hall.',
      consequences: 'Police backup arrives instantly with tactical SWAT support. +15% bonus on legitimate police salary.',
    };
  } else if (integrity >= 65) {
    return {
      standing: 'by_the_book',
      title: 'By-The-Book Officer',
      badgeBg: 'bg-blue-950/80',
      badgeBorder: 'border-blue-400',
      badgeText: 'text-blue-300',
      description: 'You follow department regulations and follow proper chain of custody.',
      consequences: 'Standard police backup response. Internal Affairs finds zero irregularities on your record.',
    };
  } else if (integrity >= 45) {
    return {
      standing: 'street_pragmatist',
      title: 'Street Pragmatist',
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-400',
      badgeText: 'text-amber-300',
      description: 'You bend the rules to clean up the streets, occasionally pocketing unclaimed syndicate contraband.',
      consequences: 'Internal Affairs monitoring your duty logs. Criminals treat you with cautious wariness.',
    };
  } else if (integrity >= 25) {
    return {
      standing: 'compromised',
      title: 'Compromised Detective',
      badgeBg: 'bg-orange-950/80',
      badgeBorder: 'border-orange-500',
      badgeText: 'text-orange-300',
      description: 'You have crossed serious legal lines. Evidence goes missing, and underworld contacts know your price.',
      consequences: 'Active Internal Affairs investigation! Police backup units are delayed. Underworld fixers offer lucrative dirty contracts.',
    };
  } else {
    return {
      standing: 'rogue_kingpin',
      title: 'Rogue Underworld Cop',
      badgeBg: 'bg-red-950/90',
      badgeBorder: 'border-red-600',
      badgeText: 'text-red-300',
      description: 'Full double-life. You command both police authority and underworld criminal kickbacks.',
      consequences: 'Precinct Captain suspects treason. Syndicate enforcers greet you as an ally. Highest payouts from black market operations.',
    };
  }
}

export const EvidenceLockerModal: React.FC<EvidenceLockerModalProps> = ({
  stats,
  onClose,
  onLogEvidenceHonor,
  onPocketContrabandCorrupt,
}) => {
  const [feedback, setFeedback] = useState<{ text: string; type: 'honor' | 'corrupt' } | null>(null);
  const moral = getMoralStandingDetails(stats.integrity ?? 80);

  const handleHonorLog = (val: FictionalValuable) => {
    onLogEvidenceHonor(val);
    soundEngine.playRadioChime();
    setFeedback({
      text: `[HONORABLE] "${val.name}" officially booked into Evidence Locker! +10 Integrity, +10 Reputation, +$300 Dept Bonus!`,
      type: 'honor',
    });
    setTimeout(() => setFeedback(null), 3800);
  };

  const handleCorruptPocket = (val: FictionalValuable) => {
    onPocketContrabandCorrupt(val);
    soundEngine.playDryFire();
    setFeedback({
      text: `[CORRUPTION] Pocketed "${val.name}" off-the-books! -15 Integrity, kept for black market liquidation.`,
      type: 'corrupt',
    });
    setTimeout(() => setFeedback(null), 3800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-blue-500/50 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-['Chakra_Petch'] text-blue-300 tracking-wide">
                  PRECINCT 9 · EVIDENCE LOCKER & CUSTODY
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/40 uppercase font-bold">
                  INTERNAL AFFAIRS DEPT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Chain of Custody & Officer Moral Integrity Evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Moral Standing & Integrity Gauge Strip */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-['Chakra_Petch'] font-bold text-slate-300 uppercase tracking-wide">
                Officer Alex Carter · Career Standing:
              </span>
              <span
                className={`text-xs font-['Chakra_Petch'] font-bold px-2 py-0.5 rounded-full border ${moral.badgeBg} ${moral.badgeBorder} ${moral.badgeText} uppercase shadow-sm`}
              >
                {moral.title}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-300">
              Integrity: <span className={moral.badgeText}>{stats.integrity ?? 80}/100</span>
            </div>
          </div>

          {/* Integrity Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 flex">
            <div
              className={`h-full transition-all duration-500 ${
                (stats.integrity ?? 80) >= 65
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                  : (stats.integrity ?? 80) >= 40
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-orange-500'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, stats.integrity ?? 80))}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">{moral.description} </span>
            <span className="text-amber-300/80">{moral.consequences}</span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl text-xs font-medium border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
              feedback.type === 'honor'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                : 'bg-red-950/80 border-red-600 text-red-200'
            }`}
          >
            {feedback.type === 'honor' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Valuables List & Moral Choice Options */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-['Chakra_Petch'] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              Unprocessed Contraband & Seized Valuables ({stats.valuables.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Every decision permanently shifts your career integrity
            </span>
          </div>

          {stats.valuables.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-2">
              <Lock className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-xs font-['Chakra_Petch'] font-bold text-slate-400 uppercase">
                No Unbooked Contraband on Person
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Arrest syndicate suspects, raid gang stash houses, or solve forensic crime cases to collect evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.valuables.map((val) => (
                <div
                  key={val.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Gem className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                          {val.name}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">{val.description}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Black Market Value: <span className="text-emerald-400 font-bold">${val.estimatedValue}</span> · Found: {val.sourceLocation || 'Syndicate Raid'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Moral Decision Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    {/* HONOR CHOICE */}
                    <button
                      onClick={() => handleHonorLog(val)}
                      className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/50 hover:border-emerald-400 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-['Chakra_Petch'] text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          [HONOR] Log to Vault
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          +$300 & +10 INT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 group-hover:text-slate-300">
                        Tag officially into Precinct 9 custody. Increases PD trust, rank progression, and lawful standing.
                      </div>
                    </button>

                    {/* CORRUPTION CHOICE */}
                    <button
                      onClick={() => handleCorruptPocket(val)}
                      className="p-2.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-700/40 hover:border-red-500 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-['Chakra_Petch'] text-xs font-bold text-red-300 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          [CORRUPTION] Pocket Loot
                        </span>
                        <span className="text-[10px] font-mono text-red-400 font-bold">
                          -${val.estimatedValue} & -15 INT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 group-hover:text-slate-300">
                        Keep item off-the-books. Liquidate at Metro Bank or underworld fence for full personal cash.
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div>EVIDENCE LOG DESK · PRECINCT 9 DUTY SERGEANT</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-['Chakra_Petch'] text-xs font-bold transition-colors"
          >
            Close Locker
          </button>
        </div>

      </div>
    </div>
  );
};
