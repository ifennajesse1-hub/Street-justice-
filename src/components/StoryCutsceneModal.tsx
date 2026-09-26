import React, { useState } from 'react';
import { Shield, Radio, ChevronRight, Award, AlertTriangle, UserCheck, X } from 'lucide-react';
import { Mission, MissionChoice } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface StoryCutsceneModalProps {
  isOpen: boolean;
  mission: Mission;
  type: 'intro' | 'outro';
  onComplete: () => void;
  onChoiceMade?: (choice: 'A' | 'B') => void;
}

export const StoryCutsceneModal: React.FC<StoryCutsceneModalProps> = ({
  isOpen,
  mission,
  type,
  onComplete,
  onChoiceMade,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [choiceSelected, setChoiceSelected] = useState<'A' | 'B' | null>(null);

  if (!isOpen) return null;

  const lines = type === 'intro' ? mission.dialogueIntro : mission.dialogueOutro;
  const currentLine = lines[currentLineIndex] || '';

  // Parse speaker and dialogue
  const parts = currentLine.split(': ');
  const speaker = parts.length > 1 ? parts[0].trim() : 'Radio Dispatch';
  const dialogueText = parts.length > 1 ? parts.slice(1).join(': ').trim() : currentLine;

  const isLastLine = currentLineIndex >= lines.length - 1;
  const showChoice = isLastLine && type === 'outro' && mission.choice && !choiceSelected;

  const handleNext = () => {
    soundEngine.playRadioChime();
    if (!isLastLine) {
      setCurrentLineIndex((i) => i + 1);
    } else {
      if (!showChoice) {
        onComplete();
      }
    }
  };

  const handleMakeChoice = (opt: 'A' | 'B') => {
    soundEngine.playMegaphoneChime();
    setChoiceSelected(opt);
    onChoiceMade?.(opt);
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 select-none font-['Inter',sans-serif] text-slate-100">
      {/* Top Cinematic Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-black border-b border-slate-900 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-xs font-['Chakra_Petch'] text-blue-400 font-bold uppercase tracking-widest">
          <Shield className="w-4 h-4" />
          <span>PRECINCT 9 ARCHIVES · {mission.title}</span>
        </div>
        <button
          onClick={onComplete}
          className="text-xs text-slate-500 hover:text-slate-300 font-['Chakra_Petch'] uppercase tracking-wider transition-colors"
        >
          SKIP (ESC)
        </button>
      </div>

      {/* Center Cinematic Dialogue Card */}
      <div className="max-w-3xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Speaker Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                speaker.includes('Vance')
                  ? 'bg-red-950/60 border-red-700 text-red-400'
                  : speaker.includes('Carter')
                  ? 'bg-blue-950/60 border-blue-700 text-blue-400'
                  : 'bg-amber-950/60 border-amber-700 text-amber-400'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="font-['Chakra_Petch'] font-bold text-base uppercase text-slate-100">
                {speaker}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {type === 'intro' ? 'TACTICAL BRIEFING COMM' : 'FIELD DEBRIEF & ASSESSMENT'}
              </div>
            </div>
          </div>

          {/* Dialogue Text */}
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-serif italic min-h-[64px]">
            {dialogueText}
          </p>

          {/* Moral Choice (if applicable to mission outro) */}
          {showChoice && mission.choice && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col gap-3">
              <div className="text-xs font-['Chakra_Petch'] font-bold text-amber-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>DECISION REQUIRED: {mission.choice.prompt}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {/* Option A */}
                <button
                  onClick={() => handleMakeChoice('A')}
                  className="p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-400 rounded-xl text-left transition-all group"
                >
                  <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-blue-400 group-hover:text-blue-300">
                    {mission.choice.optionA.label}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{mission.choice.optionA.description}</p>
                  <div className="text-[10px] text-emerald-400 font-mono font-bold mt-2">
                    {mission.choice.optionA.effect}
                  </div>
                </button>

                {/* Option B */}
                <button
                  onClick={() => handleMakeChoice('B')}
                  className="p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-left transition-all group"
                >
                  <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-amber-400 group-hover:text-amber-300">
                    {mission.choice.optionB.label}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{mission.choice.optionB.description}</p>
                  <div className="text-[10px] text-amber-400 font-mono font-bold mt-2">
                    {mission.choice.optionB.effect}
                  </div>
                </button>
              </div>
            </div>
          )}

          {choiceSelected && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center">
              DECISION RECORDED INTO PRECINCT 9 INTERNAL AFFAIRS DOSSIER
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>
            LINE {currentLineIndex + 1} OF {lines.length}
          </span>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider shadow-lg transition-colors"
          >
            <span>{isLastLine ? (showChoice ? 'SELECT DECISION' : 'PROCEED') : 'CONTINUE'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-black border-t border-slate-900 flex items-center justify-center text-[11px] text-slate-600 font-mono">
        OFFICIAL DISPATCH TRANSMISSION · METRO CITY POLICE DEPT
      </div>
    </div>
  );
};
