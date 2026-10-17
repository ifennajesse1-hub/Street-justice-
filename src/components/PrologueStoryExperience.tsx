import React, { useState, useEffect } from 'react';
import {
  Shield,
  Heart,
  ChevronRight,
  SkipForward,
  Compass,
  Sparkles,
  User,
  Radio,
  CheckCircle,
  AlertTriangle,
  Scale,
  ShoppingBag,
  Footprints,
  Eye,
} from 'lucide-react';
import { PlayerProfileSettings, PreferredPlayStyle } from '../types/game';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';
import { soundEngine } from '../game/audio/SoundEffects';

export interface PrologueStoryExperienceProps {
  isOpen: boolean;
  profile: PlayerProfileSettings;
  onCompletePrologue: (chosenPlaystyle?: PreferredPlayStyle) => void;
  onSkipToAdultCareer: () => void;
  // Engine bindings for interactive tutorial
  onSetWaypoint?: (x: number, z: number) => void;
  playerPos?: { x: number; y: number; z: number };
  onStartEnginePrologue?: () => void;
  onEndEnginePrologue?: () => void;
}

type PrologueStage =
  | 'cinematic_intro' // Act 1: The Tenements & Mom's Stoop
  | 'title_card' // "STREET JUSTICE - Every Badge Has a Secret"
  | 'tutorial_active' // Act 2: Interactive gameplay with Young Carter
  | 'cinematic_transition' // Act 3: 10 Years Later time jump
  | 'moral_orientation'; // Final moral path before Precinct 9 patrol

type TutorialStep =
  | 'reach_gable'
  | 'talk_gable'
  | 'chase_marcus'
  | 'confront_marcus'
  | 'return_to_gable'
  | 'talk_mom';

export const PrologueStoryExperience: React.FC<PrologueStoryExperienceProps> = ({
  isOpen,
  profile,
  onCompletePrologue,
  onSkipToAdultCareer,
  onSetWaypoint,
  playerPos,
  onStartEnginePrologue,
  onEndEnginePrologue,
}) => {
  const [stage, setStage] = useState<PrologueStage>('cinematic_intro');
  const [cinematicSlide, setCinematicSlide] = useState<number>(0);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('reach_gable');
  const [activeDialogue, setActiveDialogue] = useState<{
    speaker: string;
    role: string;
    avatar: string;
    text: string;
    actionLabel: string;
    onAction: () => void;
  } | null>(null);
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PreferredPlayStyle>(
    profile.playStyle || 'balanced'
  );

  const callsign = profile.callsign || 'Officer Carter';

  // Objective locations in the neighborhood:
  // Mrs. Gable: Sidewalk near avenue curb (-20, 0.2, 14)
  // Marcus: Alley behind commercial shops (-28, 0.2, 4)
  // Mom Elena: Front stoop of the tenement building (-12.5, 0.2, 25.5)

  // Initialize prologue in engine when switching to tutorial_active
  useEffect(() => {
    if (stage === 'tutorial_active') {
      onStartEnginePrologue?.();
      onSetWaypoint?.(-20, 14); // Mrs. Gable position
      cinematicMusicEngine.startSequence('exploration');
    }
  }, [stage, onStartEnginePrologue, onSetWaypoint]);

  // Track player proximity to current tutorial objective
  useEffect(() => {
    if (stage !== 'tutorial_active' || !playerPos) return;

    if (tutorialStep === 'reach_gable') {
      const dist = Math.hypot(playerPos.x - (-20), playerPos.z - 14);
      if (dist < 4.2 && !activeDialogue) {
        // Trigger Mrs. Gable initial dialogue
        setActiveDialogue({
          speaker: 'Mrs. Gable',
          role: 'Elderly Neighborhood Resident',
          avatar: '👵',
          text: `Alex! Thank heavens you're here! Young Marcus from down the block just snatched my grocery basket with my heart medicine and ran down the commercial alleyway! I can't chase him at my age...`,
          actionLabel: 'Help Mrs. Gable',
          onAction: () => {
            soundEngine.playRadioChime();
            setActiveDialogue(null);
            setTutorialStep('chase_marcus');
            onSetWaypoint?.(-28, 4); // Marcus alley location
          },
        });
      }
    } else if (tutorialStep === 'chase_marcus') {
      const dist = Math.hypot(playerPos.x - (-28), playerPos.z - 4);
      if (dist < 3.8 && !activeDialogue) {
        // Trigger Marcus confrontation dialogue
        setActiveDialogue({
          speaker: 'Marcus',
          role: 'Neighborhood Youth',
          avatar: '🧢',
          text: `Back off, Carter! Don't look at me like that! My family owes rent, the loan sharks are at our door, and everyone's gotta eat! What do you care about some groceries?!`,
          actionLabel: 'Confront With Integrity',
          onAction: () => {
            soundEngine.playRadioChime();
            // Show Carter's response
            setActiveDialogue({
              speaker: 'Young Alex Carter',
              role: 'Neighborhood Youth',
              avatar: '👦',
              text: `"We're all struggling, Marcus. But stealing an old woman's medicine isn't survival—it's doing the syndicates' work for them. If we turn on our own neighbors, who will protect us? Give it back."`,
              actionLabel: 'Take Back Groceries',
              onAction: () => {
                soundEngine.playRadioChime();
                setActiveDialogue({
                  speaker: 'Marcus',
                  role: 'Neighborhood Youth',
                  avatar: '🧢',
                  text: `Marcus hesitates, ashamed. He sets the basket down with trembling hands. "Fine... take it. Tell Mrs. Gable I'm sorry. I just... I felt like I had no choice."`,
                  actionLabel: 'Return to Mrs. Gable',
                  onAction: () => {
                    soundEngine.playRadioChime();
                    setActiveDialogue(null);
                    setTutorialStep('return_to_gable');
                    onSetWaypoint?.(-20, 14); // Back to Mrs. Gable
                  },
                });
              },
            });
          },
        });
      }
    } else if (tutorialStep === 'return_to_gable') {
      const dist = Math.hypot(playerPos.x - (-20), playerPos.z - 14);
      if (dist < 3.8 && !activeDialogue) {
        setActiveDialogue({
          speaker: 'Mrs. Gable',
          role: 'Elderly Neighborhood Resident',
          avatar: '👵',
          text: `My medicine! And my groceries! Oh Alex, you saved me weeks of hardship. You've always had a good heart. You're going to make a real difference in this city one day. Your mother is waiting for you on the stoop.`,
          actionLabel: 'Walk Back to Mom',
          onAction: () => {
            soundEngine.playRadioChime();
            setActiveDialogue(null);
            setTutorialStep('talk_mom');
            onSetWaypoint?.(-12.5, 25.5); // Mom on stoop
          },
        });
      }
    } else if (tutorialStep === 'talk_mom') {
      const dist = Math.hypot(playerPos.x - (-12.5), playerPos.z - 25.5);
      if (dist < 3.8 && !activeDialogue) {
        setActiveDialogue({
          speaker: 'Elena Carter',
          role: "Carter's Mother",
          avatar: '👩',
          text: `I saw what you did for Mrs. Gable, Alex. You stood up for someone who couldn't stand up for herself. You've got fire in your veins and a good head on your shoulders.`,
          actionLabel: 'Speak to Mom',
          onAction: () => {
            soundEngine.playRadioChime();
            setActiveDialogue({
              speaker: 'Young Alex Carter',
              role: 'Neighborhood Youth',
              avatar: '👦',
              text: `"One day, Mom, I'll make sure nobody has to live in fear. I'm going to put on the uniform and take these streets back."`,
              actionLabel: "Hear Mother's Advice",
              onAction: () => {
                soundEngine.playRadioChime();
                setActiveDialogue({
                  speaker: 'Elena Carter',
                  role: "Carter's Mother",
                  avatar: '👩',
                  text: `"Then promise me one thing, son. Never let this world change your heart." She touches your cheek, her eyes filled with pride and fear of the city's corruption.`,
                  actionLabel: 'Begin Police Career',
                  onAction: () => {
                    soundEngine.playRadioChime();
                    setActiveDialogue(null);
                    onEndEnginePrologue?.();
                    setStage('cinematic_transition');
                  },
                });
              },
            });
          },
        });
      }
    }
  }, [stage, tutorialStep, playerPos, activeDialogue, onSetWaypoint, onEndEnginePrologue]);

  if (!isOpen) return null;

  // ACT 1: CINEMATIC OPENING SLIDES
  const CINEMATIC_SLIDES = [
    {
      subtitle: 'PROLOGUE · THE TENEMENTS OF OAKRIDGE',
      title: 'A City Left Behind',
      description:
        'Rain falls across the cracked pavement of Oakridge. Smoke rises from rusted barrel fires in back alleys. Here in the neglected industrial shadow of Metro City, ordinary people scrape by against relentless syndicate extortions, street muggers, and broken promises.',
      quote: '"If the police only patrol the wealthy avenues, who protects us?"',
      speaker: 'Oakridge Community Archive',
      badge: 'HUMBLE ORIGINS',
    },
    {
      subtitle: 'YOUNG ALEX CARTER · STREET VIGIL',
      title: 'A Dream of Justice',
      description:
        'Young Alex Carter grew up in these tenement hallways. He saw corner thugs intimidate family-owned bodegas, and syndicates draft desperate teenagers into courier runs. While others surrendered to cynicism, Carter held onto a conviction: the streets could be saved.',
      quote: '"One day, Mom, I\'ll make sure nobody has to live in fear."',
      speaker: 'Young Alex Carter',
      badge: 'THE PROMISE',
    },
    {
      subtitle: 'ELENA CARTER · WORDS OF WISDOM',
      title: "A Mother's Warning",
      description:
        "Carter's mother Elena worked two shifts at the city textile mill to keep their small apartment heated. She recognized her son's unwavering courage—but knew too well the moral hazards of power in a city driven by corruption and kickbacks.",
      quote: '"Then promise me one thing, son. Never let this world change your heart."',
      speaker: 'Elena Carter',
      badge: 'THE WARNING',
    },
  ];

  const handleNextCinematicSlide = () => {
    soundEngine.playRadioChime();
    if (cinematicSlide < CINEMATIC_SLIDES.length - 1) {
      setCinematicSlide((prev) => prev + 1);
    } else {
      setStage('title_card');
    }
  };

  const handleSkipToTutorial = () => {
    soundEngine.playRadioChime();
    setStage('tutorial_active');
  };

  const handleSkipAll = () => {
    soundEngine.playRadioChime();
    onEndEnginePrologue?.();
    onSkipToAdultCareer();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. CINEMATIC INTRO: ACT 1 */}
      {/* ------------------------------------------------------------- */}
      {stage === 'cinematic_intro' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-blue-950/30">
          {/* Top Bar with Skip */}
          <div className="flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-['Chakra_Petch'] text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">
                PROLOGUE · THE HUMBLE BEGINNINGS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipToTutorial}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>SKIP CINEMATIC</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSkipAll}
                className="px-3.5 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-blue-200 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>SKIP TO ADULT CARTER</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Story Card */}
          <div className="my-auto max-w-2xl mx-auto w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 z-10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {CINEMATIC_SLIDES[cinematicSlide].subtitle}
                  </div>
                  <h3 className="font-['Chakra_Petch'] font-black text-xl sm:text-2xl text-slate-100 uppercase">
                    {CINEMATIC_SLIDES[cinematicSlide].title}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-bold">
                {CINEMATIC_SLIDES[cinematicSlide].badge}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed drop-shadow-sm">
              {CINEMATIC_SLIDES[cinematicSlide].description}
            </p>

            {/* Stylized Dialogue Box */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/40 shadow-inner">
              <div className="text-[11px] font-['Chakra_Petch'] text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{CINEMATIC_SLIDES[cinematicSlide].speaker}</span>
              </div>
              <p className="text-sm sm:text-lg text-slate-100 font-serif italic leading-relaxed">
                {CINEMATIC_SLIDES[cinematicSlide].quote}
              </p>
            </div>

            {/* Bottom Progress & Advance */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {CINEMATIC_SLIDES.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === cinematicSlide ? 'w-8 bg-blue-500 shadow-md' : 'w-2 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextCinematicSlide}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Chakra_Petch'] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {cinematicSlide >= CINEMATIC_SLIDES.length - 1 ? 'BEGIN STORY' : 'CONTINUE'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 z-10">
            METRO CITY ARCHIVES · HISTORICAL DOSSIER OF ALEX CARTER
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TITLE CARD DISPLAY: "STREET JUSTICE - Every Badge Has a Secret" */}
      {/* ------------------------------------------------------------- */}
      {stage === 'title_card' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black animate-in fade-in duration-700">
          <div className="max-w-xl flex flex-col items-center">
            {/* Precinct Shield Beacon */}
            <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border-2 border-blue-500/60 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_50px_rgba(59,130,246,0.6)] animate-pulse">
              <Shield className="w-10 h-10" />
            </div>

            <h1 className="font-['Chakra_Petch'] font-black text-5xl sm:text-7xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-200 to-slate-300 drop-shadow-[0_4px_30px_rgba(59,130,246,0.8)]">
              STREET JUSTICE
            </h1>

            <div className="mt-3 px-6 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 shadow-md">
              <p className="font-['Chakra_Petch'] font-bold text-sm sm:text-base uppercase tracking-[0.25em] text-cyan-400 drop-shadow">
                "Every Badge Has a Secret."
              </p>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm mt-6 max-w-md leading-relaxed font-mono">
              Oakridge Neighborhood · Before the Badge
            </p>

            <button
              onClick={() => {
                soundEngine.playRadioChime();
                setStage('tutorial_active');
              }}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 text-white font-['Chakra_Petch'] font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <span>TAKE CONTROL OF YOUNG CARTER</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE GAMEPLAY TUTORIAL WITH YOUNG CARTER */}
      {/* ------------------------------------------------------------- */}
      {stage === 'tutorial_active' && (
        <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-40">
          {/* Top Banner: Current Tutorial Objective */}
          <div className="w-full max-w-xl mx-auto pointer-events-auto bg-slate-950/90 border border-blue-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-emerald-400">
                  PROLOGUE TUTORIAL · YOUNG CARTER
                </span>
              </div>
              <button
                onClick={handleSkipAll}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[10px] font-['Chakra_Petch'] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                title="Skip directly to police officer career"
              >
                <span>SKIP TO CAREER</span>
                <SkipForward className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                {tutorialStep === 'reach_gable' && <Footprints className="w-5 h-5 animate-bounce" />}
                {tutorialStep === 'chase_marcus' && <ShoppingBag className="w-5 h-5 text-amber-400 animate-pulse" />}
                {tutorialStep === 'return_to_gable' && <Heart className="w-5 h-5 text-rose-400" />}
                {tutorialStep === 'talk_mom' && <User className="w-5 h-5 text-emerald-400" />}
              </div>

              <div className="flex-1">
                <div className="font-['Chakra_Petch'] font-bold text-xs sm:text-sm text-slate-100 uppercase tracking-wide">
                  {tutorialStep === 'reach_gable' && 'Step 1: Check on Neighbor Mrs. Gable'}
                  {tutorialStep === 'chase_marcus' && 'Step 2: Pursue Marcus into the Alley'}
                  {tutorialStep === 'return_to_gable' && 'Step 3: Return Medicine to Mrs. Gable'}
                  {tutorialStep === 'talk_mom' && 'Step 4: Return Home to Mom on the Stoop'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {tutorialStep === 'reach_gable' &&
                    'Use the joystick or WASD to walk down the sidewalk toward the glowing waypoint.'}
                  {tutorialStep === 'chase_marcus' &&
                    'Follow the waypoint into the narrow alleyway behind the shops and confront Marcus.'}
                  {tutorialStep === 'return_to_gable' &&
                    'Bring the recovered medicine and groceries back to Mrs. Gable at the street corner.'}
                  {tutorialStep === 'talk_mom' &&
                    'Walk back up to the tenement porch to speak with your mother Elena.'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Interactive Dialogue Modal */}
          {activeDialogue && (
            <div className="pointer-events-auto fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in zoom-in-95">
              <div className="max-w-lg w-full bg-slate-950 border-2 border-blue-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(37,99,235,0.4)]">
                <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
                  <div className="text-3xl p-2 bg-slate-900 rounded-2xl border border-slate-800">
                    {activeDialogue.avatar}
                  </div>
                  <div>
                    <div className="font-['Chakra_Petch'] font-black text-lg text-slate-100 uppercase tracking-wide">
                      {activeDialogue.speaker}
                    </div>
                    <div className="text-xs text-blue-400 font-mono font-semibold">
                      {activeDialogue.role}
                    </div>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif italic my-4 min-h-[72px]">
                  {activeDialogue.text}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={activeDialogue.onAction}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Chakra_Petch'] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{activeDialogue.actionLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom HUD Hint: On-Screen Controls Guide */}
          <div className="w-full text-center text-[10px] sm:text-xs text-slate-400 font-mono bg-slate-950/80 py-1.5 px-4 rounded-full max-w-sm mx-auto backdrop-blur-sm border border-slate-800">
            Use Joystick / WASD to move · Stand near characters to interact
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CINEMATIC TRANSITION: 10 YEARS LATER */}
      {/* ------------------------------------------------------------- */}
      {stage === 'cinematic_transition' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 animate-in fade-in duration-500">
          <div className="max-w-xl flex flex-col items-center">
            {/* Dispatch Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 mb-6 shadow-xl animate-pulse">
              <Scale className="w-8 h-8" />
            </div>

            <div className="text-xs font-mono text-cyan-400 uppercase tracking-[0.25em] font-bold">
              PRECINCT 9 DISPATCH LOG · TIME ADVANCE
            </div>

            <h2 className="font-['Chakra_Petch'] font-black text-4xl sm:text-6xl uppercase tracking-wider text-slate-100 mt-2">
              TEN YEARS LATER
            </h2>

            <div className="text-sm sm:text-base text-slate-300 leading-relaxed mt-4 max-w-lg font-serif italic">
              "The streets of Oakridge never grew gentler. The syndicates only traded switchblades for military automatic rifles, and tenement shakedowns for multimillion-dollar harbor cargo heists."
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/40 text-left max-w-md w-full shadow-lg">
              <div className="flex items-center gap-2 text-xs font-['Chakra_Petch'] text-blue-400 font-bold uppercase mb-1">
                <Shield className="w-4 h-4" />
                <span>Officer Alex Carter · Precinct 9 Commendation</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Alex Carter kept his promise. He graduated top of his police academy class and pinned on Badge #4912. But as a street cop in Metro City, he quickly learned the brutal truth:
              </p>
              <p className="text-xs sm:text-sm text-cyan-300 font-bold mt-2 font-mono">
                "On these streets, pure idealism gets good cops killed. To survive, an officer must know how to navigate the law... and the shadows."
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.playRadioChime();
                setStage('moral_orientation');
              }}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 text-white font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>SET INITIAL POLICE ORIENTATION</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MORAL ORIENTATION: CHOOSE INITIAL APPROACH */}
      {/* ------------------------------------------------------------- */}
      {stage === 'moral_orientation' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-slate-950 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full my-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <span className="font-['Chakra_Petch'] text-xs uppercase tracking-[0.2em] text-blue-400 font-bold">
                  PRECINCT 9 · OFFICER DOSSIER COMMITMENT
                </span>
              </div>
              <h2 className="font-['Chakra_Petch'] font-black text-2xl sm:text-4xl uppercase tracking-wider text-slate-100">
                Choose Your Operational Philosophy
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                Adult Carter has entered the force. How will you navigate the razor edge between the law and the underworld?
              </p>
            </div>

            {/* Playstyle Cards */}
            <div className="space-y-3">
              {/* Option 1: Law Enforcement */}
              <button
                type="button"
                onClick={() => setSelectedPlayStyle('law_enforcement')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPlayStyle === 'law_enforcement'
                    ? 'bg-blue-950/80 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.4)] ring-1 ring-blue-500'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase">
                      Precinct Loyalist · Law Enforcement
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">
                    +POLICE TRUST
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Honor your mother's dream. Prioritize clean arrests, evidence locker integrity, and protect the citizens of Metro City from both gangs and corrupt cops.
                </p>
              </button>

              {/* Option 2: Balanced Enforcer */}
              <button
                type="button"
                onClick={() => setSelectedPlayStyle('balanced')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPlayStyle === 'balanced'
                    ? 'bg-blue-950/80 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.4)] ring-1 ring-blue-500'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase">
                      Pragmatic Enforcer · Balanced Stance
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Walk the fine line. Perform commendable police duty by day, while keeping valuable criminal contacts in the docks to solve cases that the brass can't touch.
                </p>
              </button>

              {/* Option 3: Underworld */}
              <button
                type="button"
                onClick={() => setSelectedPlayStyle('underworld')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPlayStyle === 'underworld'
                    ? 'bg-blue-950/80 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.4)] ring-1 ring-blue-500'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase">
                      Shadow Operative · Deep Undercover
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold">
                    +$1,000 STARTING CASH
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The badge is a tool to climb to the top. Seize contraband, coordinate with syndicate bosses, and pocket off-the-books payoffs in your personal bank vault.
                </p>
              </button>
            </div>

            {/* Launch Button */}
            <div className="mt-8 flex items-center justify-end">
              <button
                onClick={() => {
                  soundEngine.playRadioChime();
                  onCompletePrologue(selectedPlayStyle);
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Chakra_Petch'] font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>COMMENCE DUTY AS OFFICER CARTER</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
