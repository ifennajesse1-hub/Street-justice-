import React, { useState } from 'react';
import { Shield, User, DollarSign, Radio, Search, CheckCircle2, AlertTriangle, X, ChevronRight, FileText } from 'lucide-react';
import { EnemyEntity } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface InterrogationModalProps {
  suspect: EnemyEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfiscateContraband: (amount: number, itemTitle: string) => void;
  onCallTransport: () => void;
  onIntelDiscovered: (intelText: string) => void;
}

export const InterrogationModal: React.FC<InterrogationModalProps> = ({
  suspect,
  isOpen,
  onClose,
  onConfiscateContraband,
  onCallTransport,
  onIntelDiscovered,
}) => {
  const [activeTab, setActiveTab] = useState<'interrogate' | 'frisk'>('interrogate');
  const [interrogationHistory, setInterrogationHistory] = useState<
    { speaker: 'carter' | 'suspect'; text: string }[]
  >([]);
  const [searched, setSearched] = useState(false);
  const [transportCalled, setTransportCalled] = useState(false);

  if (!isOpen || !suspect) return null;

  // Question options based on suspect type and name
  const questions = [
    {
      id: 'q1',
      label: 'Where is Viper Vance operating his headquarters?',
      response:
        suspect.name === 'Trigger'
          ? '"Vance is at Pier 14 Harbor compound! He\'s got guards and military shipments arriving tonight!"'
          : '"I don\'t know where the boss is! He only talks to Trigger and the enforcers at the docks!"',
      intel: 'Lead: Syndicate leadership concentrated at East Harbor Pier 14.',
    },
    {
      id: 'q2',
      label: 'Who supplied the unregistered firearms?',
      response:
        '"A pipeline from the industrial warehouse across town. They bring them in shipping containers disguised as machinery!"',
      intel: 'Lead: Contraband weapons stored inside Harbor Shipping Containers.',
    },
    {
      id: 'q3',
      label: 'Who ordered the extortion on the local commercial stores?',
      response:
        '"Vance\'s cartel! They demand 40% weekly kickbacks from the pharmacy and the lounge or they smash the place up!"',
      intel: 'Evidence: Commercial protection racket tied to Vance Cartel.',
    },
  ];

  const handleAskQuestion = (q: (typeof questions)[0]) => {
    soundEngine.playRadioChime();
    setInterrogationHistory((prev) => [
      ...prev,
      { speaker: 'carter', text: q.label },
      { speaker: 'suspect', text: q.response },
    ]);
    onIntelDiscovered(q.intel);
  };

  const handleFriskSuspect = () => {
    if (searched) return;
    setSearched(true);
    soundEngine.playEvidencePickup();

    const cashLoot = Math.floor(Math.random() * 150) + 120;
    const items = ['Encrypted Burner Phone', 'Marked Syndicate Narcotics', 'Unregistered Combat Sidearm'];
    const chosenItem = items[Math.floor(Math.random() * items.length)];

    onConfiscateContraband(cashLoot, chosenItem);
  };

  const handleRequestTransport = () => {
    if (transportCalled) return;
    setTransportCalled(true);
    soundEngine.playMegaphoneChime();
    onCallTransport();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-['Inter',sans-serif]">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase">
                  SUSPECT IN CUSTODY: {suspect.name}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  {suspect.type}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Precinct 9 Field Booking · Mirandized & Handcuffed
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

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 px-4 pt-2">
          <button
            onClick={() => setActiveTab('interrogate')}
            className={`px-4 py-2 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'interrogate'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Interrogation & Intel
          </button>
          <button
            onClick={() => setActiveTab('frisk')}
            className={`px-4 py-2 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'frisk'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Frisk & Search Contraband
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
          {activeTab === 'interrogate' && (
            <>
              {/* Dialogue Transcript */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2.5 min-h-[160px] max-h-[220px] overflow-y-auto">
                <div className="text-[11px] text-slate-500 font-mono uppercase">
                  RECORDING AUDIO TRANSCRIPT...
                </div>
                {interrogationHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic my-auto text-center">
                    Select an interrogation question below to question {suspect.name}.
                  </p>
                ) : (
                  interrogationHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2.5 rounded-lg flex flex-col gap-1 ${
                        item.speaker === 'carter'
                          ? 'bg-blue-950/40 border border-blue-800/40 text-blue-200 self-end max-w-[85%]'
                          : 'bg-slate-800/60 border border-slate-700/60 text-slate-200 self-start max-w-[85%]'
                      }`}
                    >
                      <span className="font-['Chakra_Petch'] text-[10px] uppercase font-bold text-slate-400">
                        {item.speaker === 'carter' ? 'Officer Alex Carter' : suspect.name}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Questions Buttons */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-['Chakra_Petch'] text-slate-400 font-bold uppercase">
                  Select Question to Ask:
                </div>
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleAskQuestion(q)}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span>"{q.label}"</span>
                    <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'frisk' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase">
                    Thorough Search of Suspect
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Search suspect's jacket, waistband, and pockets for confiscated evidence and illicit contraband.
                  </p>
                </div>
                <button
                  onClick={handleFriskSuspect}
                  disabled={searched}
                  className={`px-4 py-2.5 rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    searched
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border border-amber-400 active:scale-95'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>{searched ? 'SEARCH COMPLETED' : 'FRISK SUSPECT'}</span>
                </button>
              </div>

              {searched && (
                <div className="bg-emerald-950/30 border border-emerald-600/40 p-4 rounded-xl flex items-center gap-3 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Contraband Confiscated & Logged!</span>
                    <p className="text-emerald-300/80 mt-0.5">
                      Recovered illegal street cash and suspect evidence. Logged into evidence locker.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Prisoner Transport */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {transportCalled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Transport Unit Dispatched! +$300 Precinct Bounty
              </span>
            ) : (
              <span>Call squad transport to secure suspect at precinct.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!transportCalled && (
              <button
                onClick={handleRequestTransport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors"
              >
                <Radio className="w-4 h-4" />
                <span>CALL PRISONER TRANSPORT</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
