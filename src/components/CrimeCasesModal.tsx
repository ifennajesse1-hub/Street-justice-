import React from 'react';
import { FileText, CheckCircle2, Search, X, Award, Shield, DollarSign, Camera } from 'lucide-react';
import { CrimeCase, CRIME_CASES, INITIAL_EVIDENCE_ITEMS } from '../game/systems/InvestigationSystem';
import { EvidenceItem } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface CrimeCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CrimeCase[];
  evidenceList: EvidenceItem[];
  onSolveCase: (caseId: string) => void;
}

export const CrimeCasesModal: React.FC<CrimeCasesModalProps> = ({
  isOpen,
  onClose,
  cases,
  evidenceList,
  onSolveCase,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-['Inter',sans-serif] text-slate-100">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] font-bold text-lg uppercase tracking-wide">
                PRECINCT 9 FORENSIC CASE FILES
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Collect evidence, question witnesses, and build forensic cases against criminal organizations.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {cases.map((c) => {
            const caseEvidence = evidenceList.filter((e) => e.caseFile === c.id);
            const collectedCount = caseEvidence.filter((e) => e.collected || e.photoTaken).length;
            const canSolve = collectedCount >= c.evidenceRequired && !c.isSolved;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all ${
                  c.isSolved
                    ? 'bg-emerald-950/20 border-emerald-600/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Chakra_Petch'] font-bold text-base text-slate-100">
                        {c.title}
                      </span>
                      {c.isSolved && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-600/50 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                          CASE CLOSED · CONVICTED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-400 font-semibold mt-0.5">
                      Target: {c.suspectOrganization} (Lead Suspect: {c.leadSuspect})
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">+${c.rewardMoney}</span>
                    <span className="text-blue-400 font-bold">+{c.rewardXP} XP</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                {/* Evidence Progress Bar */}
                <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-['Chakra_Petch'] font-bold uppercase">
                      Forensic Evidence Required:
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {collectedCount} / {c.evidenceRequired} Clues
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        c.isSolved
                          ? 'bg-emerald-500'
                          : collectedCount >= c.evidenceRequired
                          ? 'bg-amber-400'
                          : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (collectedCount / c.evidenceRequired) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Evidence Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {caseEvidence.map((ev) => {
                    const isFound = ev.collected || ev.photoTaken;
                    return (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 text-xs ${
                          isFound
                            ? 'bg-slate-900 border-slate-700 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isFound ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          {ev.type === 'photo' ? <Camera className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{ev.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {isFound ? ev.locationName : 'Location: Investigate city districts'}
                          </div>
                        </div>
                        {isFound && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Solve Case Button */}
                {canSolve && (
                  <button
                    onClick={() => {
                      soundEngine.playRadioChime();
                      onSolveCase(c.id);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>SUBMIT CASE TO DISTRICT ATTORNEY & CLAIM BOUNTY (+${c.rewardMoney})</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
