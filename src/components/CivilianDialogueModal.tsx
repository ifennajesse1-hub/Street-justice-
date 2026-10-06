import React, { useEffect, useState, useRef } from 'react';
import { User, X, Check, Heart, Shield, Award, Sparkles, Coffee } from 'lucide-react';
import { CivilianEntity } from '../types/game';

interface CivilianDialogueModalProps {
  civilian: CivilianEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionCompleted: (intel: string) => void;
  onCommunitySupport?: (type: 'health' | 'armor' | 'reputation' | 'money', amount: number, message: string) => void;
}

export const CivilianDialogueModal: React.FC<CivilianDialogueModalProps> = ({
  civilian,
  isOpen,
  onClose,
  onQuestionCompleted,
  onCommunitySupport,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(8);
  const [supportAccepted, setSupportAccepted] = useState<boolean>(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onQuestionCompletedRef = useRef(onQuestionCompleted);
  onQuestionCompletedRef.current = onQuestionCompleted;

  const witnessStatements = [
    'Officer! I saw two men in leather jackets carrying heavy duffle bags into the back of the commercial alleyway!',
    'Thank goodness you are here, Officer! A suspicious black sports car has been circling the Metro Bank plaza.',
    'I heard gunshots coming from the harbor docks last night. People say Vance\'s cartel is hoarding military weapons there!',
    'Someone in a syndicate mask spray-painted gang tags on the alley wall by the Pharmacy. It looked like a viper cobra symbol.',
  ];

  const statement =
    civilian?.dialogue ||
    (civilian ? witnessStatements[civilian.meshIndex % witnessStatements.length] : '');

  const isCedarHeights = civilian?.communityDistrict === 'cedar_heights' || (civilian?.name && (
    civilian.name.includes('Marcus') ||
    civilian.name.includes('Mama Leah') ||
    civilian.name.includes('Andre') ||
    civilian.name.includes('Grandma') ||
    civilian.name.includes('Nia') ||
    civilian.name.includes('Jamal') ||
    civilian.name.includes('Maya') ||
    civilian.name.includes('Elijah') ||
    civilian.name.includes('Tariq')
  ));

  // Determine community support offering
  let communityGift: {
    type: 'health' | 'armor' | 'reputation' | 'money';
    amount: number;
    title: string;
    description: string;
    icon: any;
  } | null = null;

  if (isCedarHeights && civilian) {
    if (civilian.name?.includes('Mama Leah')) {
      communityGift = {
        type: 'health',
        amount: 35,
        title: "Mama Leah's Fresh Peach Cobbler & Coffee",
        description: 'Restores +35 Health & raises community trust (+10 Rep)',
        icon: Coffee,
      };
    } else if (civilian.name?.includes('Marcus') || civilian.name?.includes('Tariq')) {
      communityGift = {
        type: 'armor',
        amount: 50,
        title: "Marcus's Garage Body Armor & Cruiser Check",
        description: 'Repairs +50 Body Armor & supplies patrol tips',
        icon: Shield,
      };
    } else if (civilian.name?.includes('Grandma Bernice')) {
      communityGift = {
        type: 'reputation',
        amount: 25,
        title: 'Community Elder Blessing & Encouragement',
        description: 'Boosts Officer Reputation +25 & inspires neighborhood peace',
        icon: Award,
      };
    } else {
      communityGift = {
        type: 'reputation',
        amount: 15,
        title: 'Neighborhood Watch Cooperation & Tip',
        description: 'Shares street whispers (+15 Rep, +100 XP)',
        icon: Sparkles,
      };
    }
  }

  useEffect(() => {
    if (!isOpen || !civilian) {
      setSecondsRemaining(8);
      setSupportAccepted(false);
      return;
    }
    setSecondsRemaining(8);
    setSupportAccepted(false);

    const autoCloseTimeout = setTimeout(() => {
      onQuestionCompletedRef.current(statement);
      onCloseRef.current();
    }, 8000);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(autoCloseTimeout);
      clearInterval(timer);
    };
  }, [isOpen, civilian?.id, statement]);

  if (!isOpen || !civilian) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[94%] sm:w-full select-none font-['Inter',sans-serif] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`border rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 backdrop-blur-xl pointer-events-auto ${
        isCedarHeights
          ? 'bg-slate-950/95 border-emerald-500/70 shadow-[0_0_30px_rgba(5,150,105,0.3)] text-slate-100'
          : 'bg-slate-950/90 border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.3)] text-slate-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isCedarHeights
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50'
                : 'bg-blue-600/20 text-blue-400 border-blue-500/40'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider ${
                  isCedarHeights ? 'text-emerald-400' : 'text-blue-300'
                }`}>
                  {isCedarHeights ? '★ CEDAR HEIGHTS NEIGHBORHOOD' : 'WITNESS INTEL'}
                </span>
                {civilian.businessName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    {civilian.businessName}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                {civilian.name || 'Metro Resident'}
                <span className="text-slate-500 font-normal"> · Ordinary Law-Abiding Citizen</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Civilian Dialogue Statement */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 text-xs sm:text-sm text-slate-200 italic font-serif leading-relaxed">
          "{statement}"
        </div>

        {/* Community Pillar Hospitality Offering */}
        {communityGift && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <communityGift.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-['Chakra_Petch'] font-bold text-xs text-emerald-300 truncate">
                  {communityGift.title}
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  {communityGift.description}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!supportAccepted && onCommunitySupport && communityGift) {
                  onCommunitySupport(communityGift.type, communityGift.amount, `${civilian.name}: ${communityGift.title} received!`);
                  setSupportAccepted(true);
                }
              }}
              disabled={supportAccepted}
              className={`px-3 py-1.5 rounded-lg font-['Chakra_Petch'] font-bold text-[10px] uppercase tracking-wider transition-all shrink-0 ${
                supportAccepted
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]'
              }`}
            >
              {supportAccepted ? 'ACCEPTED ✓' : 'ACCEPT SUPPORT'}
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] text-slate-400 font-mono">
            Auto-recording statement in {secondsRemaining}s
          </div>
          <button
            onClick={() => {
              onQuestionCompleted(statement);
              onClose();
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
          >
            <Check className="w-3.5 h-3.5" />
            <span>RECORD INTEL & CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
