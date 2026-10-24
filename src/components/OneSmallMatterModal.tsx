import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Building2,
  DollarSign,
  Scale,
  Award,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  User,
  Heart,
  HardHat,
  FileText,
  Flame,
  Search,
  Sparkles,
  Lock,
  Eye,
  Handshake,
} from 'lucide-react';
import { Mission, PlayerStats } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';

export type OneSmallMatterPhase =
  | 'stage1_whistleblower'
  | 'stage1_choice'
  | 'stage3_collapse'
  | 'stage6_confrontation'
  | 'stage6_choice'
  | 'ending_card';

export type OneSmallMatterEarlyChoice = 'investigate' | 'dismiss' | 'bribe';
export type OneSmallMatterFinalChoice = 'integrity' | 'settlement' | 'manipulate';

interface OneSmallMatterModalProps {
  isOpen: boolean;
  phase: OneSmallMatterPhase;
  mission: Mission;
  stats: PlayerStats;
  earlyChoice?: OneSmallMatterEarlyChoice;
  onSelectEarlyChoice?: (choice: OneSmallMatterEarlyChoice) => void;
  onDeployToDisaster?: () => void;
  onSelectFinalChoice: (choice: OneSmallMatterFinalChoice) => void;
  onRestartMission?: () => void;
  onContinueFreeRoam: (choice: OneSmallMatterFinalChoice) => void;
  onClose: () => void;
}

export const OneSmallMatterModal: React.FC<OneSmallMatterModalProps> = ({
  isOpen,
  phase: initialPhase,
  mission,
  stats,
  earlyChoice = 'investigate',
  onSelectEarlyChoice,
  onDeployToDisaster,
  onSelectFinalChoice,
  onRestartMission,
  onContinueFreeRoam,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<OneSmallMatterPhase>(initialPhase);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [chosenEarly, setChosenEarly] = useState<OneSmallMatterEarlyChoice>(earlyChoice);
  const [chosenFinal, setChosenFinal] = useState<OneSmallMatterFinalChoice | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPhase(initialPhase);
      setSlideIndex(0);
      if (initialPhase === 'stage1_whistleblower') {
        cinematicMusicEngine.startSequence('mission');
        soundEngine.playRadioChime();
      } else if (initialPhase === 'stage3_collapse') {
        cinematicMusicEngine.startSequence('combat');
        soundEngine.playBuildingCrack();
      } else if (initialPhase === 'stage6_confrontation') {
        cinematicMusicEngine.startSequence('exploration');
        soundEngine.playMegaphoneChime();
      }
    }
  }, [isOpen, initialPhase]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Stage 1 Slides: The Whistleblower Mateo Cruz at Lot 14B
  // --------------------------------------------------------------------------
  const stage1Slides = [
    {
      speaker: 'Mateo Cruz',
      role: 'Lot 14B Ironworker & Whistleblower',
      avatar: '👷',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'STERLING HEIGHTS REDEVELOPMENT · LOT 14B JOB SITE',
      text: 'Officer Carter! Thank god you answered the radio flag. Look at pillar C4 over here on the southwest corner. The hairline fissures are spreading by the hour.',
      subtext: 'Mateo gestures toward the foundation pillar where hairline cracks spiderweb through the concrete.',
    },
    {
      speaker: 'Mateo Cruz',
      role: 'Lot 14B Ironworker & Whistleblower',
      avatar: '👷',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'SUBSTANDARD MATERIALS & MUNICIPAL CORRUPTION',
      text: 'Developer Arthur Sterling ordered us to install rebar with half the tensile rating specified in the blueprints, and diluted the concrete batch with cheap sand to save $1.8 million.',
      subtext: 'Mateo pulls out a grease-stained structural inspection log detailing the compromised support ratings.',
    },
    {
      speaker: 'Mateo Cruz',
      role: 'Lot 14B Ironworker & Whistleblower',
      avatar: '👷',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE INSPECTOR\'S ENVELOPE',
      text: 'I submitted the safety stop to City Building Inspector Howard Pike this morning. Pike walked into Sterling\'s trailer, came out with a fat white envelope, stuffed it into his trench coat, and told me it was "just one small matter." They\'re pouring the upper floor slab this afternoon!',
      subtext: 'A sleek black municipal town car is idling at the curb. Inspector Pike watches through tinted glass.',
    },
  ];

  // --------------------------------------------------------------------------
  // Stage 3 Slides: Catastrophic Collapse Sequence
  // --------------------------------------------------------------------------
  const stage3Slides = [
    {
      speaker: 'DISPATCH EMERGENCY BROADCAST',
      role: 'Precinct 9 Comms Center',
      avatar: '🚨',
      tagColor: 'text-red-400 border-red-600 bg-red-950/60',
      headline: '10-99 CODE RED · STRUCTURAL COLLAPSE IN PROGRESS',
      text: 'ALL UNITS ALL SQUADS! Catastrophic structural failure at Lot 14B Sterling Heights! Multi-ton concrete slabs and scaffolding collapsing onto the avenue sidewalk! Multiple civilian casualties reported!',
      subtext: 'The sound of snapping steel rebar and deep concrete fracturing echoes across the urban district.',
    },
    {
      speaker: 'Officer Alex Carter',
      role: 'Precinct 9 Patrol Detective',
      avatar: '⭐',
      tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
      headline: 'FIRST RESPONDER ON SCENE',
      text: 'Dispatch, Unit 24 arriving at the disaster zone! The entire southwest facade sheared off. Civilians are pinned under concrete girders. Requesting EMS triage and tactical perimeter backup immediately!',
      subtext: 'Dense dust clouds billow across the boulevard as panicked pedestrians scream for help.',
    },
    {
      speaker: 'Foreman Davies (Wounded)',
      role: 'Surviving Site Supervisor',
      avatar: '🩹',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'VOICE FROM THE RUBBLE',
      text: 'Carter... Arthur Sterling sent private fixers in a black sedan to torch his office trailer! The altered batching manifests and payoff slips are in the safe... don\'t let them burn the truth!',
      subtext: 'Smoke rises from the damaged site office trailer as armed syndicate fixers arrive to sanitize the scene.',
    },
  ];

  // --------------------------------------------------------------------------
  // Stage 6 Slides: Climax Confrontation with Developer Sterling & Inspector Pike
  // --------------------------------------------------------------------------
  const stage6Slides = [
    {
      speaker: 'Arthur Sterling',
      role: 'Billionaire Developer & Property Mogul',
      avatar: '💼',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'DISASTER PERIMETER · POLICE CORDON TAPE',
      text: 'Officer Carter, please! Lower the weapon. This was an unforeseen tragedy—a geological sinkhole, clearly! You can\'t hold me accountable for soil instability.',
      subtext: 'Sterling stands beside a cornered Inspector Howard Pike, trembling beside their luxury town car.',
    },
    {
      speaker: 'Officer Alex Carter',
      role: 'Precinct 9 Lead Investigator',
      avatar: '⭐',
      tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
      headline: 'THE EVIDENCE ON THE HOOD',
      text: 'Save it, Sterling. I have the sheared low-grade rebar core samples from pillar C4, the altered concrete invoices from your safe, and Inspector Pike\'s signed $10,000 cash withdrawal receipt.',
      subtext: 'Carter places the physical evidence dossier firmly onto the hood of Sterling\'s luxury sedan.',
    },
    {
      speaker: 'Arthur Sterling',
      role: 'Billionaire Developer & Property Mogul',
      avatar: '💼',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE FINAL BRIBE',
      text: 'Carter, listen to reason. There is $12,000 in bearer bonds and cash in this briefcase. Blame the bankrupt quarry supplier who died last month. We both walk away wealthy men, and the city moves on. What do you say?',
      subtext: 'Pike nods desperately. Reporters and sirens approach in the distance. The choice belongs to Carter.',
    },
  ];

  // Handle slide progression
  const handleNextSlide = () => {
    soundEngine.playRadioChime();
    if (currentPhase === 'stage1_whistleblower') {
      if (slideIndex < stage1Slides.length - 1) {
        setSlideIndex(slideIndex + 1);
      } else {
        setCurrentPhase('stage1_choice');
      }
    } else if (currentPhase === 'stage3_collapse') {
      if (slideIndex < stage3Slides.length - 1) {
        setSlideIndex(slideIndex + 1);
      } else {
        onDeployToDisaster?.();
        onClose();
      }
    } else if (currentPhase === 'stage6_confrontation') {
      if (slideIndex < stage6Slides.length - 1) {
        setSlideIndex(slideIndex + 1);
      } else {
        setCurrentPhase('stage6_choice');
      }
    }
  };

  const handleEarlyChoiceSelect = (choice: OneSmallMatterEarlyChoice) => {
    setChosenEarly(choice);
    soundEngine.playMegaphoneChime();
    onSelectEarlyChoice?.(choice);
    onClose();
  };

  const handleFinalChoiceSelect = (choice: OneSmallMatterFinalChoice) => {
    setChosenFinal(choice);
    soundEngine.playMegaphoneChime();
    onSelectFinalChoice(choice);
    setCurrentPhase('ending_card');
  };

  const currentSlides =
    currentPhase === 'stage1_whistleblower'
      ? stage1Slides
      : currentPhase === 'stage3_collapse'
      ? stage3Slides
      : stage6Slides;

  const activeSlide = currentSlides[slideIndex] || currentSlides[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/92 backdrop-blur-md select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Top Tactical Bar */}
      <div className="w-full h-16 sm:h-20 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-['Chakra_Petch'] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-2">
              <span>SPECIAL INVESTIGATION · ONE SMALL MATTER</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300">
                LOT 14B STERLING HEIGHTS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              OFFICER ALEX CARTER · PRECINCT 9 DOSSIER
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              soundEngine.toggleSiren(false);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Toggle Audio"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-['Chakra_Petch'] font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        {/* ================================================================== */}
        {/* SLIDE BASED DIALOGUE VIEW (Stages 1, 3, 6 intro)                   */}
        {/* ================================================================== */}
        {(currentPhase === 'stage1_whistleblower' ||
          currentPhase === 'stage3_collapse' ||
          currentPhase === 'stage6_confrontation') && (
          <div className="max-w-3xl w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeSlide.avatar}</span>
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-base sm:text-lg text-slate-100 uppercase tracking-wide">
                    {activeSlide.speaker}
                  </div>
                  <div className="text-xs font-mono text-slate-400">{activeSlide.role}</div>
                </div>
              </div>
              <div className="text-xs font-['Chakra_Petch'] font-bold text-amber-400 uppercase tracking-wider">
                TRANSMISSION {slideIndex + 1} / {currentSlides.length}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider text-amber-400/90">
                {activeSlide.headline}
              </div>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-serif italic">
                "{activeSlide.text}"
              </p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                {activeSlide.subtext}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1.5">
                {currentSlides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === slideIndex ? 'w-6 bg-amber-400' : 'w-2 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNextSlide}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <span>{slideIndex >= currentSlides.length - 1 ? 'PROCEED' : 'CONTINUE'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* STAGE 1 MORAL DECISION: THE WHISTLEBLOWER'S REPORT                 */}
        {/* ================================================================== */}
        {currentPhase === 'stage1_choice' && (
          <div className="max-w-4xl w-full bg-slate-950/95 border border-amber-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="text-center space-y-1.5 border-b border-slate-800/80 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                <span>MATEO'S WARNING: CHOOSE CARTER'S EARLY ACTION</span>
              </div>
              <h2 className="font-['Chakra_Petch'] font-black text-xl sm:text-2xl text-slate-100 uppercase tracking-wide">
                How Will Officer Carter Handle the Complaint?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Your initial response will determine available evidence, witness trust, and subsequent events leading up to the collapse.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: By the Book */}
              <button
                onClick={() => handleEarlyChoiceSelect('investigate')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-blue-800/60 hover:border-blue-500 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-blue-950 border border-blue-700 text-blue-400">
                      <Shield className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      POLICE INTEGRITY
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase group-hover:text-blue-300 transition-colors">
                    1. File Official Incident Report & Inspect Pillar
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Take photos of cracked column C4, log Mateo's statement, and warn the workers. Pre-empts municipal cover-up.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="text-emerald-400 font-semibold">+15 Police Reputation</div>
                  <div className="text-slate-400">-10 Suspicion Level</div>
                  <div className="text-blue-300 font-bold">Unlocks early warning photos</div>
                </div>
              </button>

              {/* Option 2: Dismiss */}
              <button
                onClick={() => handleEarlyChoiceSelect('dismiss')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-500 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400">
                      <Eye className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                      NEUTRAL DISMISSAL
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase group-hover:text-slate-200 transition-colors">
                    2. Dismiss as "One Small Matter"
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tell Mateo it's a civil labor union dispute, not police jurisdiction. Walk away without getting involved.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="text-slate-400">0 Reputation Change</div>
                  <div className="text-amber-400">Workers remain in danger</div>
                  <div className="text-slate-400">No early evidence logged</div>
                </div>
              </button>

              {/* Option 3: Early Bribe */}
              <button
                onClick={() => handleEarlyChoiceSelect('bribe')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-amber-800/60 hover:border-amber-500 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-950 border border-amber-700 text-amber-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      DOUBLE-LIFE SHADY
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase group-hover:text-amber-300 transition-colors">
                    3. Accept Inspector Pike's $2,500 Kickback
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pike slides $2,500 cash from his town car: "Consider this a donation to the patrol fund." Agree to clear the radio call.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="text-amber-400 font-semibold">+$2,500 Dirty Cash</div>
                  <div className="text-purple-400">+15 Underworld Reputation</div>
                  <div className="text-red-400 font-bold">+20 Suspicion Level</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* STAGE 6 CLIMAX: THE FINAL MORAL RECKONING                         */}
        {/* ================================================================== */}
        {currentPhase === 'stage6_choice' && (
          <div className="max-w-4xl w-full bg-slate-950/95 border border-amber-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="text-center space-y-1.5 border-b border-slate-800/80 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/60 text-red-300 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>THE DISASTER VERDICT: CHOOSE CARTER'S ULTIMATE PATH</span>
              </div>
              <h2 className="font-['Chakra_Petch'] font-black text-xl sm:text-2xl text-slate-100 uppercase tracking-wide">
                Will You Uphold The Badge, Pocket The Cash, Or Play Both Sides?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Forensics prove criminal negligence. Arthur Sterling is begging with a $12,000 cash briefcase. Inspector Pike awaits handcuffs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ending 1: Full Integrity */}
              <button
                onClick={() => handleFinalChoiceSelect('integrity')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-blue-800/70 hover:border-blue-400 transition-all text-left flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-blue-950 border border-blue-700 text-blue-400">
                      <Shield className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      ENDING 1
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase group-hover:text-blue-300 transition-colors">
                    The Law Is Absolute
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Refuse all bribes. Handcuff Arthur Sterling and Inspector Pike. Turn over the unaltered manifests, rebar samples, and payoff slip directly to the District Attorney.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-xs font-mono">
                  <div className="text-emerald-400 font-bold">+40 Police Reputation</div>
                  <div className="text-blue-400">+$6,000 City Salary Bonus</div>
                  <div className="text-emerald-300">-30 Suspicion Cleared</div>
                  <div className="text-slate-400 text-[10px] italic">"The Pillars of Justice" Commendation</div>
                </div>
              </button>

              {/* Ending 2: Underworld Corruption */}
              <button
                onClick={() => handleFinalChoiceSelect('settlement')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-amber-800/70 hover:border-amber-400 transition-all text-left flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-950 border border-amber-700 text-amber-400">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      ENDING 2
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase group-hover:text-amber-300 transition-colors">
                    The Shadow Settlement
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Take Sterling's $12,000 cash briefcase. Burn the municipal bribery slip in an alley barrel and frame the bankrupt supplier. Sterling walks away free.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-xs font-mono">
                  <div className="text-amber-400 font-bold">+$12,000 Dirty Cash</div>
                  <div className="text-purple-400">+35 Underworld Reputation</div>
                  <div className="text-red-400 font-bold">+25 Suspicion Level</div>
                  <div className="text-slate-400 text-[10px] italic">Offshore Career Wealth Boost</div>
                </div>
              </button>

              {/* Ending 3: Master Manipulator */}
              <button
                onClick={() => handleFinalChoiceSelect('manipulate')}
                className="p-5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-purple-800/70 hover:border-purple-400 transition-all text-left flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-purple-950 border border-purple-700 text-purple-400">
                      <Handshake className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                      ENDING 3
                    </span>
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase group-hover:text-purple-300 transition-colors">
                    The Architect of Secrets
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Demand $7,500 cash from Sterling upfront to "secure his freedom," then publicly arrest Inspector Pike and leak an anonymous copy of Sterling's ledger to the press!
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1 text-xs font-mono">
                  <div className="text-amber-400 font-bold">+$7,500 Secret Cash</div>
                  <div className="text-blue-400">+25 Police Reputation</div>
                  <div className="text-purple-400">+20 Underworld Rep</div>
                  <div className="text-emerald-400">0 Suspicion (Completely Undetected)</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* ENDING CARD: CAMPAIGN RECAP & NEWSPAPER HEADLINE                   */}
        {/* ================================================================== */}
        {currentPhase === 'ending_card' && (
          <div className="max-w-3xl w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            {/* Newspaper style header */}
            <div className="border-b-2 border-slate-700 pb-4 text-center space-y-1">
              <div className="text-[10px] font-['Chakra_Petch'] font-bold tracking-widest text-slate-400 uppercase">
                THE METRO CITY CHRONICLE · EXTRA SPECIAL EDITION
              </div>
              <h1 className="font-['Chakra_Petch'] font-black text-2xl sm:text-3xl text-slate-100 uppercase tracking-tight">
                {chosenFinal === 'integrity'
                  ? 'STERLING ARRESTED IN DISASTER FRAUD: DETECTIVE CARTER EXPOSES TOWER RACKET'
                  : chosenFinal === 'settlement'
                  ? 'STERLING TOWER DISASTER RULED ACCIDENTAL: SHADOW SETTLEMENT CLOUDS INQUIRY'
                  : 'MUNICIPAL INSPECTOR ARRESTED IN COLLAPSE: ANONYMOUS DOSSIER CRUSHES STERLING'}
              </h1>
              <div className="text-xs font-mono text-amber-400">
                BY METRO BEAT DESK · SPECIAL COMMENDATION RECORD
              </div>
            </div>

            {/* Narrative Epilogue */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif space-y-2">
              <p>
                {chosenFinal === 'integrity'
                  ? 'Standing amidst concrete dust and shattered rebar, Officer Alex Carter proved that the badge is not for sale. Developer Arthur Sterling and Inspector Howard Pike were booked into Precinct 9 cells, facing twenty counts of criminal reckless endangerment and municipal bribery.'
                  : chosenFinal === 'settlement'
                  ? 'With $12,000 cash stashed securely in Carter\'s trunk, the official inquiry blamed a defunct subcontractor. Developer Sterling resumed his commercial empire, while whispering underworld figures noted that Officer Carter is a pragmatist who knows how to do business.'
                  : 'In a masterstroke of tactical manipulation, Officer Carter delivered justice to the public while enriching himself in the shadows. Inspector Pike took the fall on live television, while Arthur Sterling was blindsided by the press leak—leaving Carter untouched, uncompromised, and $7,500 wealthier.'}
              </p>
              <p className="text-[11px] text-slate-400 italic">
                Mateo Cruz and the surviving workers were safely evacuated to City Central Hospital. All three trapped survivors made a full recovery thanks to Carter's rapid emergency response.
              </p>
            </div>

            {/* Mission Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Survivors Rescued</div>
                <div className="font-['Chakra_Petch'] font-bold text-lg text-emerald-400">3 / 3</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Forensics Collected</div>
                <div className="font-['Chakra_Petch'] font-bold text-lg text-blue-400">3 / 3</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Police Rep</div>
                <div className="font-['Chakra_Petch'] font-bold text-lg text-cyan-400">
                  {chosenFinal === 'integrity' ? '+40' : chosenFinal === 'settlement' ? '-30' : '+25'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Career Payout</div>
                <div className="font-['Chakra_Petch'] font-bold text-lg text-amber-400">
                  {chosenFinal === 'integrity' ? '+$14,500' : chosenFinal === 'settlement' ? '+$20,500' : '+$16,000'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mission Recorded in Precinct Dossier</span>
              </div>
              <button
                onClick={() => {
                  onContinueFreeRoam(chosenFinal || 'integrity');
                  onClose();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <span>RESUME PATROL & FREE ROAM</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
