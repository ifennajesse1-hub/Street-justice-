import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Skull,
  Heart,
  ChevronRight,
  User,
  Radio,
  PhoneCall,
  Volume2,
  VolumeX,
  RotateCcw,
  Compass,
  Award,
  CheckCircle2,
  Lock,
  Eye,
  Handshake,
} from 'lucide-react';
import { Mission, PlayerStats } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';

export type FinalMissionCinematicPhase =
  | 'phase1_threat' // The standoff, captive civilians, Vance reveals Carter's double life
  | 'phase1_choice' // Ultimatum: Choice A vs Choice B
  | 'choiceA_betrayal' // Carter walks away, syndicate betrays & kills him
  | 'choiceA_ending_card' // "THE COWARD'S LAST BREATH"
  | 'choiceB_start_combat' // Carter draws weapon, combat begins
  | 'phase2_climax_handshake' // Post-rescue confrontation: Vance's congratulations & fake handshake
  | 'phase2_secret_scene' // Secret reveal: Vance's phone call to player (manipulation wiretap)
  | 'phase2_ending_card'; // "HE SAVED THEIR LIVES. NOW HE MUST TRUST THE DEVIL."

interface DeathBeforeBetrayalCinematicProps {
  isOpen: boolean;
  initialPhase?: 'phase1_threat' | 'phase2_climax_handshake';
  mission: Mission;
  stats: PlayerStats;
  onChoiceASelected: () => void; // Triggered if player chooses to abandon civilians
  onChoiceBSelected: () => void; // Triggered if player chooses to save people & start combat
  onRestartMission: () => void; // Restart Chapter 8 from beginning
  onContinueFreeRoam: (ending: 'coward_last_breath' | 'trust_the_devil') => void;
  onClose: () => void;
}

export const DeathBeforeBetrayalCinematic: React.FC<DeathBeforeBetrayalCinematicProps> = ({
  isOpen,
  initialPhase = 'phase1_threat',
  mission,
  stats,
  onChoiceASelected,
  onChoiceBSelected,
  onRestartMission,
  onContinueFreeRoam,
  onClose,
}) => {
  const [phase, setPhase] = useState<FinalMissionCinematicPhase>(initialPhase);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Sync initialPhase whenever reopened
  useEffect(() => {
    if (isOpen) {
      setPhase(initialPhase);
      setSlideIndex(0);
      cinematicMusicEngine.startSequence('combat');
    }
  }, [isOpen, initialPhase]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Phase 1 Slides: The Threat & The Double-Life Revelation
  // --------------------------------------------------------------------------
  const phase1Slides = [
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE INDUSTRIAL STRONGHOLD · RAIN-SOAKED DEPOT',
      text: 'Good evening, Officer Carter. Welcome to Sector 5 Logistics. I see you drove here alone—professional, cautious, just as your dossier indicated.',
      subtext: 'High-voltage floodlights blind the yard. Three bound civilians kneel in the center of the loading dock.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'SECRETS OF THE DOUBLE LIFE',
      text: 'Do not play the righteous crusader with me, Alex. We have copies of your offshore ledger. The unmarked duffel bags in your trunk. The bribes you pocketed on the waterfront.',
      subtext: 'Vance holds up a classified Internal Affairs intelligence packet stamped with Carter\'s badge number.',
    },
    {
      speaker: 'Alex Carter',
      role: 'Metro City Police Detective',
      avatar: '⭐',
      tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
      headline: 'THE DETECTIVE\'S STAND',
      text: 'Whatever files you think you have, Vance, those three civilians have nothing to do with this. Uncuff them and let them walk out the gate.',
      subtext: 'Carter\'s hand hovers over his service holster. Syndicate heavy operatives cock automatic rifles on the catwalks.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE LETHAL ULTIMATUM',
      text: 'They stumbled into our staging ground, Detective. Unfortunate collateral. But today, I am offering you an executive exit. Two simple paths lie before you...',
      subtext: 'Vance smiles politely, radiating controlled malice and cold certainty.',
    },
  ];

  // --------------------------------------------------------------------------
  // Choice A Betrayal Slides: Carter walks away, syndicate betrays & kills him
  // --------------------------------------------------------------------------
  const choiceASlides = [
    {
      speaker: 'Alex Carter',
      role: 'Self-Preservation Protocol',
      avatar: '🏃',
      tagColor: 'text-slate-400 border-slate-600 bg-slate-900',
      headline: 'CHOOSING TO SAVE YOURSELF',
      text: 'I didn\'t see anything here tonight, Vance. My car is parked by the south fence. I am walking away, and your files stay buried.',
      subtext: 'Carter turns his back on the bound hostages. Desperate cries for help echo through the cold rain.',
    },
    {
      speaker: 'Captive Hostages',
      role: 'Abandoned Civilians',
      avatar: '🆘',
      tagColor: 'text-red-400 border-red-600 bg-red-950/60',
      headline: 'ABANDONED IN THE DARK',
      text: '"Officer, please! Don\'t leave us! You swore to protect the city! Please don\'t leave us here to die!"',
      subtext: 'Carter grits his teeth and keeps walking towards his cruiser. The moral weight crushes his soul.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-red-400 border-red-600 bg-red-950/60',
      headline: 'THE SYNDICATE\'S NATURE',
      text: 'Predictable to the very end, Officer Carter. You think a dirty cop who abandons his post is someone we can trust? A loose end is a loose end.',
      subtext: 'Vance raises his left hand. Laser sights from the warehouse roof lock onto the center of Carter\'s back.',
    },
    {
      speaker: 'Narrator',
      role: 'The Final Breath',
      avatar: '⚡',
      tagColor: 'text-red-500 border-red-700 bg-red-950/80',
      headline: 'AMBUSHED FROM THE SHADOWS',
      text: 'A suppressed rifle volley shatters the night. Carter falls to his knees on the slick asphalt, clutching his chest. Blood pools beneath his badge.',
      subtext: 'As the darkness closes in, his mother\'s warning echoes from childhood: "Never let this world change your heart..."',
    },
  ];

  // --------------------------------------------------------------------------
  // Phase 2 Climax Slides: The Handshake & The Secret Reveal
  // --------------------------------------------------------------------------
  const phase2ClimaxSlides = [
    {
      speaker: 'Narrator',
      role: 'The Aftermath',
      avatar: '🕊️',
      tagColor: 'text-emerald-400 border-emerald-600 bg-emerald-950/60',
      headline: 'ALL HOSTAGES SAFELY EVACUATED · OPERATIVES ELIMINATED',
      text: 'The gunfire falls silent. The three captive civilians have escaped through the breach into the waiting hands of precinct patrol backup.',
      subtext: 'Empty brass shell casings litter the warehouse floor. Rain trickles through bullet holes in the corrugated roof.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE APPARENT SURRENDER',
      text: 'Magnificent, Detective! Absolutely breathtaking. Five of my finest heavy operatives, and you dismantled them without losing a single civilian.',
      subtext: 'Vance steps down the iron staircase, clapping his hands with slow, disarming admiration. No weapon in hand.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Syndicate Supreme Mastermind',
      avatar: '👔',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'THE PROPOSED ALLIANCE & HANDSHAKE',
      text: 'Let us not be barbarians, Carter. You won this round. You have your medals and your headlines. Why destroy each other when we can both prosper? A truce between kings.',
      subtext: 'Vance extends his right hand with a warm, genuine-looking smile. He appears completely calm, respectful, and cooperative.',
    },
    {
      speaker: 'Alex Carter',
      role: 'Metro City Police Detective',
      avatar: '⭐',
      tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
      headline: 'THE PRAGMATIC PACT',
      text: 'Keep your syndicate off my neighborhood streets, Vance. The hostages are alive, and that is all that matters tonight.',
      subtext: 'Carter reaches out and takes Vance\'s hand. Their grip is firm. Carter believes he averted a bloodbath while securing peace.',
    },
  ];

  // --------------------------------------------------------------------------
  // Phase 2 Secret Reveal Slides (Player sees what Carter cannot see)
  // --------------------------------------------------------------------------
  const secretSceneSlides = [
    {
      speaker: 'Narrator',
      role: 'Behind Closed Doors',
      avatar: '👁️',
      tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
      headline: 'WHAT CARTER DID NOT SEE',
      text: 'Officer Carter walks out into the dawn light to join the arriving sirens. Behind him, inside the darkened logistics depot, Julian Vance remains alone.',
      subtext: 'The warm, respectful smile vanishes instantly from Vance\'s face, replaced by a cold, calculating, predatory sneer.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Encrypted Comms Channel',
      avatar: '📱',
      tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
      headline: 'THE SECRET CONVERSATION',
      text: '"He took the bait. The detective thinks he saved the day. He thinks he called the shots by taking my hand."',
      subtext: 'Vance taps a covert audio transmitter concealed in his golden syndicate lapel pin.',
    },
    {
      speaker: 'Julian "The Architect" Vance',
      role: 'Encrypted Comms Channel',
      avatar: '📱',
      tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
      headline: 'THE ULTIMATE TRAP',
      text: '"Every word of his agreement is recorded on our encrypted server. Store the files in the vault. From this day forward... Officer Carter works for us."',
      subtext: 'Vance turns and vanishes into the industrial shadows as distant police sirens herald the sunrise.',
    },
  ];

  // --------------------------------------------------------------------------
  // Navigation & Handlers
  // --------------------------------------------------------------------------
  const handleNextPhase1 = () => {
    soundEngine.playRadioChime();
    if (slideIndex < phase1Slides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      setPhase('phase1_choice');
    }
  };

  const handleSelectChoiceA = () => {
    soundEngine.playMegaphoneChime();
    onChoiceASelected();
    setPhase('choiceA_betrayal');
    setSlideIndex(0);
    cinematicMusicEngine.startSequence('mission');
  };

  const handleNextChoiceA = () => {
    soundEngine.playRadioChime();
    if (slideIndex < choiceASlides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      soundEngine.playGunshot('shotgun');
      setPhase('choiceA_ending_card');
    }
  };

  const handleSelectChoiceB = () => {
    soundEngine.playGunshot('handgun');
    onChoiceBSelected();
    setPhase('choiceB_start_combat');
    setTimeout(() => {
      onClose(); // Close cinematic and let player fight!
    }, 1800);
  };

  const handleNextPhase2Climax = () => {
    soundEngine.playRadioChime();
    if (slideIndex < phase2ClimaxSlides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      // Transition to the secret scene
      setPhase('phase2_secret_scene');
      setSlideIndex(0);
      cinematicMusicEngine.startSequence('mission');
    }
  };

  const handleNextSecretScene = () => {
    soundEngine.playRadioChime();
    if (slideIndex < secretSceneSlides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      setPhase('phase2_ending_card');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Top Cinematic Letterbox */}
      <div className="w-full h-16 sm:h-20 bg-black border-b border-slate-900 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-red-500 animate-pulse" />
          <div className="leading-tight">
            <span className="font-['Chakra_Petch'] text-xs font-black text-red-500 uppercase tracking-widest block">
              FINAL CAMPAIGN EPISODE · CHAPTER 8
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              DEATH BEFORE BETRAYAL · INDUSTRIAL SECTOR 5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 rounded-lg border border-slate-800 transition-colors"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Quick Skip Option */}
          {phase === 'phase1_threat' && (
            <button
              onClick={() => setPhase('phase1_choice')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 font-['Chakra_Petch'] font-bold rounded-lg uppercase tracking-wider transition-colors"
            >
              SKIP TO DECISION
            </button>
          )}
        </div>
      </div>

      {/* Atmospheric Background Scene Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black" />

      {/* =========================================================================
          BRANCH 1: PHASE 1 THREAT CINEMATIC SLIDES
         ========================================================================= */}
      {phase === 'phase1_threat' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          {/* Headline pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-700/60 rounded-full text-red-400 text-xs font-mono font-bold mb-4 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{phase1Slides[slideIndex].headline}</span>
          </div>

          {/* Dialogue Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {phase1Slides[slideIndex].avatar}
              </div>
              <div>
                <h3 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase text-slate-100 flex items-center gap-2">
                  <span>{phase1Slides[slideIndex].speaker}</span>
                </h3>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[11px] font-mono font-bold rounded border ${phase1Slides[slideIndex].tagColor}`}>
                  {phase1Slides[slideIndex].role}
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-slate-100 leading-relaxed font-serif italic mb-4 min-h-[90px]">
              "{phase1Slides[slideIndex].text}"
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {phase1Slides[slideIndex].subtext}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              SEQUENCE {slideIndex + 1} OF {phase1Slides.length}
            </span>
            <button
              onClick={handleNextPhase1}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < phase1Slides.length - 1 ? 'PROCEED' : 'CONFRONT THE CHOICE'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 2: THE ULTIMATUM (CHOICE A vs CHOICE B)
         ========================================================================= */}
      {phase === 'phase1_choice' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
            <span className="font-['Chakra_Petch'] text-red-500 font-bold text-xs uppercase tracking-widest block mb-1">
              CRITICAL CAMPAIGN FORK · OFFICER ALEX CARTER
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              THE ULTIMATUM: CHOOSE CARTER'S FATE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Julian Vance offers you a deal. Your choice will permanently determine how the story of Officer Carter concludes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CHOICE A: SAVE YOURSELF */}
            <div className="bg-slate-950/90 border-2 border-slate-800 hover:border-red-500 rounded-2xl p-6 flex flex-col justify-between transition-all group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Chakra_Petch'] font-black text-xs uppercase px-2.5 py-1 bg-red-950/70 border border-red-700/60 text-red-400 rounded-lg tracking-wider">
                    CHOICE A
                  </span>
                  <Skull className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">
                  SAVE YOURSELF
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Walk away into the rainy night. Abandon the three captive civilians to their fate. Keep your life, your badge, and your dirty cash.
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div className="text-red-400 font-bold">⚠️ Warning: The Syndicate never leaves loose ends</div>
                  <div>· Triggers Ending: "THE COWARD'S LAST BREATH"</div>
                  <div>· Can restart or reload after completing the sequence</div>
                </div>
              </div>

              <button
                onClick={handleSelectChoiceA}
                className="w-full py-3.5 bg-slate-900 hover:bg-red-950/80 border border-slate-700 hover:border-red-500 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]"
              >
                <span>CHOOSE: ABANDON & ESCAPE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* CHOICE B: SAVE THE PEOPLE */}
            <div className="bg-slate-950/90 border-2 border-blue-600/70 hover:border-blue-400 rounded-2xl p-6 flex flex-col justify-between transition-all group shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Chakra_Petch'] font-black text-xs uppercase px-2.5 py-1 bg-blue-950/70 border border-blue-500/60 text-blue-400 rounded-lg tracking-wider">
                    CHOICE B (RECOMMENDED)
                  </span>
                  <Heart className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">
                  SAVE THE PEOPLE
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Refuse the deal. Draw your weapon and risk everything to rescue the captive civilians from the 5 Syndicate Heavy Operatives.
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div className="text-emerald-400 font-bold">🛡️ Protect Civilians: Hostages take damage in crossfire!</div>
                  <div>· Objective: Eliminate 5 Heavies & Untie all 3 Hostages</div>
                  <div>· Unlocks the Confrontation with Julian Vance & True Ending</div>
                </div>
              </div>

              <button
                onClick={handleSelectChoiceB}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,99,235,0.4)]"
              >
                <span>CHOOSE: STAND & FIGHT FOR THE PEOPLE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 3: CHOICE A (BETRAYAL SCENE)
         ========================================================================= */}
      {phase === 'choiceA_betrayal' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-700/60 rounded-full text-red-400 text-xs font-mono font-bold mb-4 w-fit">
            <Skull className="w-3.5 h-3.5" />
            <span>{choiceASlides[slideIndex].headline}</span>
          </div>

          <div className="bg-slate-950/95 border border-red-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {choiceASlides[slideIndex].avatar}
              </div>
              <div>
                <h3 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase text-slate-100 flex items-center gap-2">
                  <span>{choiceASlides[slideIndex].speaker}</span>
                </h3>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[11px] font-mono font-bold rounded border ${choiceASlides[slideIndex].tagColor}`}>
                  {choiceASlides[slideIndex].role}
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-slate-100 leading-relaxed font-serif italic mb-4 min-h-[90px]">
              "{choiceASlides[slideIndex].text}"
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {choiceASlides[slideIndex].subtext}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              BETRAYAL SEQUENCE {slideIndex + 1} OF {choiceASlides.length}
            </span>
            <button
              onClick={handleNextChoiceA}
              className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < choiceASlides.length - 1 ? 'CONTINUE' : 'THE FINAL CUT'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 4: CHOICE A ENDING CARD: "THE COWARD'S LAST BREATH"
         ========================================================================= */}
      {phase === 'choiceA_ending_card' && (
        <div className="relative max-w-2xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center text-center flex-1 z-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <Skull className="w-10 h-10 animate-pulse" />
          </div>

          <span className="font-['Chakra_Petch'] text-red-500 font-bold text-xs uppercase tracking-widest block mb-2">
            CAMPAIGN ENDING · CHOICE A
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase mb-3 font-['Chakra_Petch']">
            "THE COWARD'S LAST BREATH."
          </h1>

          <p className="text-base sm:text-lg text-slate-300 italic font-serif max-w-lg mb-6 leading-relaxed">
            Carter abandoned the innocent to save his own skin. But in the ruthless criminal underworld, a compromised officer is nothing more than a liability to be erased.
          </p>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-left w-full max-w-md mb-6 space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Ending Status:</span>
              <span className="text-red-400 font-bold">Officer Assassinated by Syndicate</span>
            </div>
            <div className="flex justify-between">
              <span>Civilians Rescued:</span>
              <span className="text-red-400 font-bold">0 / 3 (Abandoned)</span>
            </div>
            <div className="flex justify-between">
              <span>Career Progress:</span>
              <span className="text-emerald-400 font-bold">Preserved (Not Reset)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={() => {
                onRestartMission();
                onClose();
              }}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART & SAVE THE PEOPLE</span>
            </button>

            <button
              onClick={() => {
                onContinueFreeRoam('coward_last_breath');
                onClose();
              }}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>PATROL FREE ROAM</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 5: CHOICE B (START COMBAT BANNER)
         ========================================================================= */}
      {phase === 'choiceB_start_combat' && (
        <div className="relative max-w-xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center text-center flex-1 z-10 animate-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-blue-950/80 border-2 border-blue-500 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <Shield className="w-10 h-10" />
          </div>
          <span className="font-['Chakra_Petch'] text-blue-400 font-bold text-xs uppercase tracking-widest block mb-2">
            OBJECTIVE ENGAGED
          </span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight font-['Chakra_Petch'] mb-3">
            PROTECT AND SERVE
          </h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed mb-6">
            Eliminate the 5 Syndicate Heavy Operatives. Untie and evacuate all 3 captive civilians before they sustain lethal injuries!
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400" />
        </div>
      )}

      {/* =========================================================================
          BRANCH 6: PHASE 2 CLIMAX (POST-RESCUE HANDSHAKE)
         ========================================================================= */}
      {phase === 'phase2_climax_handshake' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-700/60 rounded-full text-emerald-400 text-xs font-mono font-bold mb-4 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{phase2ClimaxSlides[slideIndex].headline}</span>
          </div>

          <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {phase2ClimaxSlides[slideIndex].avatar}
              </div>
              <div>
                <h3 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase text-slate-100 flex items-center gap-2">
                  <span>{phase2ClimaxSlides[slideIndex].speaker}</span>
                </h3>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[11px] font-mono font-bold rounded border ${phase2ClimaxSlides[slideIndex].tagColor}`}>
                  {phase2ClimaxSlides[slideIndex].role}
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-slate-100 leading-relaxed font-serif italic mb-4 min-h-[90px]">
              "{phase2ClimaxSlides[slideIndex].text}"
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {phase2ClimaxSlides[slideIndex].subtext}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              CLIMAX CONFRONTATION {slideIndex + 1} OF {phase2ClimaxSlides.length}
            </span>
            <button
              onClick={handleNextPhase2Climax}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < phase2ClimaxSlides.length - 1 ? 'CONTINUE' : 'SEAL THE PACT'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 7: THE SECRET SCENE (THE PLAYER REVEAL)
         ========================================================================= */}
      {phase === 'phase2_secret_scene' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-700/60 rounded-full text-purple-400 text-xs font-mono font-bold mb-4 w-fit">
            <Eye className="w-3.5 h-3.5" />
            <span>{secretSceneSlides[slideIndex].headline}</span>
          </div>

          <div className="bg-slate-950/95 border border-purple-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-700 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {secretSceneSlides[slideIndex].avatar}
              </div>
              <div>
                <h3 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase text-purple-200 flex items-center gap-2">
                  <span>{secretSceneSlides[slideIndex].speaker}</span>
                </h3>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[11px] font-mono font-bold rounded border ${secretSceneSlides[slideIndex].tagColor}`}>
                  {secretSceneSlides[slideIndex].role}
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-purple-100 leading-relaxed font-serif italic mb-4 min-h-[90px]">
              "{secretSceneSlides[slideIndex].text}"
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {secretSceneSlides[slideIndex].subtext}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              SECRET INTEL {slideIndex + 1} OF {secretSceneSlides.length}
            </span>
            <button
              onClick={handleNextSecretScene}
              className="flex items-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider shadow-lg shadow-purple-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < secretSceneSlides.length - 1 ? 'PROCEED' : 'THE FINAL TITLE'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BRANCH 8: TRUE CAMPAIGN ENDING TITLE CARD
         ========================================================================= */}
      {phase === 'phase2_ending_card' && (
        <div className="relative max-w-3xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center text-center flex-1 z-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-600/30 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
            <Handshake className="w-10 h-10 animate-pulse" />
          </div>

          <span className="font-['Chakra_Petch'] text-amber-400 font-bold text-xs uppercase tracking-widest block mb-2">
            STREET JUSTICE · CLIMAX CONCLUSION
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase mb-4 font-['Chakra_Petch'] leading-tight">
            "HE SAVED THEIR LIVES.<br />
            <span className="text-amber-400">NOW HE MUST TRUST THE DEVIL."</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 italic font-serif max-w-xl mb-6 leading-relaxed">
            All three hostages survived to see sunrise. Officer Alex Carter stands as the celebrated hero of Metro City. But in making a devil's pact to preserve his standing, Carter has bound himself to the city's greatest criminal mastermind.
          </p>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-left w-full max-w-lg mb-6 grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-500 block">Mission Bounty:</span>
              <span className="text-emerald-400 font-bold text-sm">+$15,000 Legitimate Salary</span>
            </div>
            <div>
              <span className="text-slate-500 block">Career Experience:</span>
              <span className="text-blue-400 font-bold text-sm">+8,000 XP (Master Detective)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Civilians Rescued:</span>
              <span className="text-emerald-300 font-bold">3 / 3 (Heroic Rescue)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Campaign Dossier:</span>
              <span className="text-purple-400 font-bold">Syndicate Wiretap Active</span>
            </div>
          </div>

          <button
            onClick={() => {
              onContinueFreeRoam('trust_the_devil');
              onClose();
            }}
            className="w-full max-w-md py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98]"
          >
            <Compass className="w-5 h-5" />
            <span>CONTINUE PATROL & FREE ROAM IN METRO CITY</span>
          </button>
        </div>
      )}

      {/* Bottom Cinematic Letterbox */}
      <div className="w-full h-16 sm:h-20 bg-black border-t border-slate-900 flex items-center justify-center text-[11px] text-slate-600 font-mono z-10 shrink-0">
        METRO CITY POLICE PRECINCT 9 · INTERNAL AFFAIRS CLASSIFIED ARCHIVE
      </div>
    </div>
  );
};
