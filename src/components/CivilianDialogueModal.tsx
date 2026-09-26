import React from 'react';
import { User, MessageSquare, Check, X, Shield } from 'lucide-react';
import { CivilianEntity } from '../types/game';

interface CivilianDialogueModalProps {
  civilian: CivilianEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionCompleted: (intel: string) => void;
}

export const CivilianDialogueModal: React.FC<CivilianDialogueModalProps> = ({
  civilian,
  isOpen,
  onClose,
  onQuestionCompleted,
}) => {
  if (!isOpen || !civilian) return null;

  const witnessStatements = [
    'Officer! I saw two men in leather jackets carrying heavy duffle bags into the back of the commercial alleyway!',
    'Thank goodness you are here, Officer! A suspicious black sports car has been circling the Metro Bank plaza.',
    'I heard gunshots coming from the harbor docks last night. People say Vance\'s cartel is hoarding military weapons there!',
    'Someone in a syndicate mask spray-painted gang tags on the alley wall by the Pharmacy. It looked like a viper cobra symbol.',
  ];

  const statement = civilian.dialogue || witnessStatements[civilian.meshIndex % witnessStatements.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-['Inter',sans-serif]">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-['Chakra_Petch'] font-bold text-sm uppercase">
                CIVILIAN WITNESS STATEMENT
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Metro City Resident</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-200 italic font-serif leading-relaxed">
          "{statement}"
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-emerald-400 font-mono font-bold">
            +50 XP Witness Testimony Recorded
          </span>
          <button
            onClick={() => {
              onQuestionCompleted(statement);
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            RECORD & THANK WITNESS
          </button>
        </div>
      </div>
    </div>
  );
};
