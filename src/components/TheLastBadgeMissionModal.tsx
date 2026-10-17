import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Skull,
  Flame,
  Radio,
  FileText,
  ChevronRight,
  RotateCcw,
  Compass,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX,
  Scale,
  Crown,
  Eye,
  Megaphone,
  User,
  Heart,
} from 'lucide-react';
import { Mission, PlayerStats } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';

export type LastBadgeMissionPhase =
  | 'phase1_message' // Carter receives the mysterious encrypted pager message
  | 'phase3_choice' // The 3-way final moral choice (Confess / Destroy / Expose)
  | 'phase4_ending_slides' // The cinematic sequence for the resulting ending
  | 'phase4_ending_card'; // Grand ending card & campaign completed summary

export type LastBadgeEndingType =
  | 'redemption'
  | 'king_of_underworld'
  | 'fallen_badge'
  | 'no_one_is_innocent';

export type LastBadgeChoiceType = 'confess' | 'destroy' | 'expose';

interface TheLastBadgeMissionModalProps {
  isOpen: boolean;
  phase: LastBadgeMissionPhase;
  mission: Mission;
  stats: PlayerStats;
  onDeployToPier4: () => void;
  onChoiceMade: (choice: LastBadgeChoiceType, ending: LastBadgeEndingType) => void;
  onRestartMission: () => void;
  onContinueFreeRoam: (ending: LastBadgeEndingType) => void;
  onClose: () => void;
}

export const TheLastBadgeMissionModal: React.FC<TheLastBadgeMissionModalProps> = ({
  isOpen,
  phase: initialPhase,
  mission,
  stats,
  onDeployToPier4,
  onChoiceMade,
  onRestartMission,
  onContinueFreeRoam,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<LastBadgeMissionPhase>(initialPhase);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<LastBadgeChoiceType | null>(null);
  const [resolvedEnding, setResolvedEnding] = useState<LastBadgeEndingType>('redemption');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Sync phase prop
  useEffect(() => {
    if (isOpen) {
      setCurrentPhase(initialPhase);
      setSlideIndex(0);
      if (initialPhase === 'phase1_message') {
        cinematicMusicEngine.startSequence('mission');
        soundEngine.playRadioChime();
      } else if (initialPhase === 'phase3_choice') {
        cinematicMusicEngine.startSequence('combat');
        soundEngine.playMegaphoneChime();
      }
    }
  }, [isOpen, initialPhase]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Phase 1 Slides: The Mysterious Message & Summons to Pier 4
  // --------------------------------------------------------------------------
  const phase1Slides = [
    {
      speaker: 'Encrypted Dispatch Pager',
      role: 'Frequency: 492.85 MHz · High Priority',
      avatar: '📟',
      tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
      headline: 'CLASSIFIED INTERCEPT · MIDNIGHT TRANSMISSION',
      text: '"Officer Alex Carter. Badge #4409. We have your ledgers. We have the audio recordings from the Sector 4 payoffs, the unmarked cash drops, and your secret bank vault."',
      subtext: 'The encrypted police pager vibrates violently on Carter\'s tactical vest. A digitized voice crackles over the private channel.',
    },
    {
      speaker: 'Unknown Blackmailer',
      role: 'Hostile Intel Operative',
      avatar: '🕵️',
      tagColor: 'text-red-400 border-red-600 bg-red-950/60',
      headline: 'THE ULTIMATUM SUMMONS',
      text: '"If you want to keep your badge and avoid a thirty-year sentence in federal penitentiary, come to Harbor Pier 4 Warehouse alone. No sirens. No backup. We will be waiting."',
      subtext: 'GPS coordinates flash on Carter\'s dashboard: Pier 4 Waterfront Industrial Logistics (X: 50, Z: 50).',
    },
    {
      speaker: 'Alex Carter',
      role: 'Metro City Police Detective',
      avatar: '⭐',
      tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
      headline: 'CARTER\'S RECKONING',
      text: '"My double life is finally catching up with me. Whoever is on the other end has the entire paper trail. I have to reach Pier 4 and secure that physical evidence before everything burns to the ground."',
      subtext: 'Carter clicks the holster on his service weapon, starts the engine, and drives towards the foggy docks.',
    },
  ];

  // --------------------------------------------------------------------------
  // Ending Resolution Logic
  // --------------------------------------------------------------------------
  const calculateEnding = (choice: LastBadgeChoiceType): LastBadgeEndingType => {
    if (choice === 'confess') {
      return 'redemption';
    }
    if (choice === 'destroy') {
      // If player has criminal underworld standing, they embrace kingpin power
      const underRep = stats.underworldReputation ?? 15;
      const dirty = stats.dirtyCash ?? 0;
      const secret = stats.secretEarnings ?? 0;
      if (underRep >= 35 || dirty >= 1500 || secret >= 2000) {
        return 'king_of_underworld';
      }
      // Otherwise, Internal Affairs & federal authorities surround him
      return 'fallen_badge';
    }
    // Expose Everyone
    return 'no_one_is_innocent';
  };

  const handleSelectChoice = (choice: LastBadgeChoiceType) => {
    setSelectedChoice(choice);
    const ending = calculateEnding(choice);
    setResolvedEnding(ending);
    onChoiceMade(choice, ending);
    setSlideIndex(0);
    setCurrentPhase('phase4_ending_slides');

    // Change audio theme based on ending
    if (ending === 'redemption') {
      cinematicMusicEngine.startSequence('victory');
    } else if (ending === 'king_of_underworld') {
      cinematicMusicEngine.startSequence('mission');
    } else if (ending === 'fallen_badge') {
      cinematicMusicEngine.startSequence('exploration');
    } else {
      cinematicMusicEngine.startSequence('victory');
    }
    soundEngine.playRadioChime();
  };

  // --------------------------------------------------------------------------
  // Phase 4 Slides: The 4 Detailed Multi-Branch Cinematic Endings
  // --------------------------------------------------------------------------
  const endingSlides: Record<LastBadgeEndingType, Array<{
    speaker: string;
    role: string;
    avatar: string;
    tagColor: string;
    headline: string;
    text: string;
    subtext: string;
  }>> = {
    redemption: [
      {
        speaker: 'Alex Carter',
        role: 'Accountability & Surrender',
        avatar: '🕊️',
        tagColor: 'text-emerald-400 border-emerald-600 bg-emerald-950/60',
        headline: 'THE SURRENDER OF BADGE #4409',
        text: 'Carter drives back to Precinct 9 in the early morning fog. He walks past his fellow officers directly into the Internal Affairs Division.',
        subtext: 'He unclips his gold shield and service weapon, laying both on the steel interrogation table alongside the complete financial ledger.',
      },
      {
        speaker: 'Internal Affairs Inspector',
        role: 'Department Oversight',
        avatar: '⚖️',
        tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
        headline: 'THE FULL CONFESSION',
        text: '"You are giving up your pension, your freedom, and your name, Carter. Why confess now?" Carter replies: "Because a badge covered in dirty money is no badge at all."',
        subtext: 'Carter gives full sworn testimony, clearing his conscience and refusing to hide behind lies any longer.',
      },
      {
        speaker: 'Mother Elena',
        role: 'Carter\'s Mother',
        avatar: '👵',
        tagColor: 'text-amber-400 border-amber-600 bg-amber-950/60',
        headline: 'A MOTHER\'S PRIDE',
        text: 'Outside the courthouse, his mother Elena embraces him through the partition. Her eyes are filled with tears, but her smile is peaceful.',
        subtext: '"You made grave mistakes, Alex... but in the end, you kept your heart. You protected the people, and you chose the truth."',
      },
      {
        speaker: 'Narrator',
        role: 'The Moral Legacy',
        avatar: '⭐',
        tagColor: 'text-emerald-400 border-emerald-600 bg-emerald-950/60',
        headline: 'REDEMPTION EARNED',
        text: 'The court sentence is severe, but Carter walks with head held high. The neighborhood he protected petitions for his clemency. He is at peace.',
        subtext: 'The dawn light breaks over Metro City as Carter\'s story of true redemption is etched into city history.',
      },
    ],

    king_of_underworld: [
      {
        speaker: 'Alex Carter',
        role: 'The New Kingpin',
        avatar: '👑',
        tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
        headline: 'ASHES ON HARBOR PIER 4',
        text: 'Carter drops the blackmail dossier and digital cryptographic drives into an oil drum, igniting them with his tactical flare.',
        subtext: 'Flames roar against the black harbor water. The evidence of his dirty deeds turns to glowing grey embers in the wind.',
      },
      {
        speaker: 'Syndicate Lieutenant',
        role: 'Eclipse Syndicate Envoy',
        avatar: '🕶️',
        tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
        headline: 'THE ARRIVAL OF THE SYNDICATE',
        text: 'Two luxury black armored limousines pull onto the pier. Syndicate lieutenants step out in bespoke suits, bowing their heads respectfully.',
        subtext: '"You eliminated the blackmailer and burned the files, Detective. Vance is gone. The avenues need a ruler who wears a badge."',
      },
      {
        speaker: 'Alex Carter',
        role: 'The Law & The Lawless',
        avatar: '👑',
        tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
        headline: 'CROWNED IN THE DARK',
        text: 'Carter slips on his tailored trenchcoat and straightens his tie. He realized long ago that in Metro City, clean hands get crushed.',
        subtext: 'He does not just work with criminals anymore—he commands them from behind the authority of Precinct 9.',
      },
      {
        speaker: 'Narrator',
        role: 'Metro City\'s Shadow Ruler',
        avatar: '🌃',
        tagColor: 'text-purple-400 border-purple-600 bg-purple-950/60',
        headline: 'THE UNTOUCHABLE MONARCH',
        text: 'Carter steps into the limousine as distant sirens echo in salute. Metro City belongs to him now: the police protect his borders, and the syndicates pay him tribute.',
        subtext: 'He is no longer just Officer Carter. He is the undisputed King of the Underworld.',
      },
    ],

    fallen_badge: [
      {
        speaker: 'Alex Carter',
        role: 'The Desperate Cover-Up',
        avatar: '🔥',
        tagColor: 'text-red-400 border-red-600 bg-red-950/60',
        headline: 'A DESPERATE ATTEMPT',
        text: 'Carter hurriedly sets fire to the dossier papers, watching the sheets burn. He breathes a sigh of relief, believing his secrets are buried forever.',
        subtext: 'He turns his back on the pier and reaches for the door handle of his police cruiser.',
      },
      {
        speaker: 'Federal Strike Team',
        role: 'Internal Affairs & Federal Task Force',
        avatar: '🚨',
        tagColor: 'text-red-400 border-red-600 bg-red-950/60',
        headline: 'THE TRAP CLOSES',
        text: 'Blinding 50,000-lumen spotlights blast across the pier! A fleet of federal armored vans and IA cruisers barricades every exit.',
        subtext: 'Megaphones boom through the rain: "OFFICER CARTER, DROP YOUR WEAPON AND STEP AWAY FROM THE VEHICLE!"',
      },
      {
        speaker: 'Wounded Blackmailer',
        role: 'The Last Laugh',
        avatar: '💀',
        tagColor: 'text-red-400 border-red-600 bg-red-950/60',
        headline: 'THE OFF-SITE BACKUP',
        text: 'The wounded blackmailer smiles bloodily from the container: "You fool, Carter... did you really think there wasn\'t a cloud mirror? They had your arrest warrant an hour ago."',
        subtext: 'Federal agents force Carter to the asphalt. The cold steel of handcuffs ratchets tightly over his wrists.',
      },
      {
        speaker: 'Narrator',
        role: 'The Final Disgrace',
        avatar: '🌧️',
        tagColor: 'text-red-500 border-red-700 bg-red-950/80',
        headline: 'THE FALLEN BADGE',
        text: 'An agent roughly unpins Badge #4409 from Carter\'s chest. In the struggle, it slips from their fingers, falling between the wooden dock planks into the murky water below.',
        subtext: 'Stripped of honor, dignity, and career, Carter is led away into the siren-lit dark.',
      },
    ],

    no_one_is_innocent: [
      {
        speaker: 'Alex Carter',
        role: 'The Whistleblower',
        avatar: '📡',
        tagColor: 'text-cyan-400 border-cyan-600 bg-cyan-950/60',
        headline: 'TRANSMITTING THE ARCHIVE',
        text: 'Carter connects the encrypted drive to his mobile uplink terminal. He bypasses departmental firewalls and sends the unredacted files to every major news network, federal prosecutor, and public server.',
        subtext: 'A progress bar flashes green: "TRANSMISSION COMPLETE · 4,210 CLASSIFIED FILES LEAKED GLOBALLY."',
      },
      {
        speaker: 'Metro News Headline',
        role: 'Breaking Worldwide Bulletin',
        avatar: '📺',
        tagColor: 'text-cyan-400 border-cyan-600 bg-cyan-950/60',
        headline: 'THE SYSTEMIC EARTHQUAKE',
        text: 'Within minutes, phone sirens blare across the entire city. Breaking news alerts flash on every billboard, TV screen, and smartphone in Metro City.',
        subtext: 'The Police Chief, the District Attorney, three city councilmen, two syndicate families, and Officer Carter himself are named in the greatest scandal in city history.',
      },
      {
        speaker: 'Alex Carter',
        role: 'The Man in the Storm',
        avatar: '⭐',
        tagColor: 'text-blue-400 border-blue-600 bg-blue-950/60',
        headline: 'THE PRICE OF TRUTH',
        text: 'Carter walks to the edge of Pier 4 and sits down on a bollard. He lights a cigarette in the freezing rain and watches the lightning dance across the skyline.',
        subtext: 'He knows he will be arrested. He knows his life is over. But for the first time in ten years, the rotten city has a chance to be reborn.',
      },
      {
        speaker: 'Narrator',
        role: 'The Burned Horizon',
        avatar: '⚡',
        tagColor: 'text-cyan-400 border-cyan-600 bg-cyan-950/60',
        headline: 'NO ONE IS INNOCENT',
        text: 'Sirens converge from all directions as the storm breaks. Carter smiles faintly into the wind. He tore down the entire rotten empire, and accepted his place in the wreckage.',
        subtext: 'A lone officer who gave up everything to burn away the darkness of Metro City.',
      },
    ],
  };

  const endingDetails: Record<LastBadgeEndingType, {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    cardStyle: string;
    badgeStyle: string;
    statsSummary: { label: string; value: string; color: string }[];
  }> = {
    redemption: {
      title: 'REDEMPTION: THE HONORABLE SURRENDER',
      subtitle: 'Carter accepted full responsibility. The badge is gone, but his soul and dignity were saved.',
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />,
      cardStyle: 'border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.35)]',
      badgeStyle: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
      statsSummary: [
        { label: 'Moral Path:', value: 'Honorable Surrender', color: 'text-emerald-400' },
        { label: 'Integrity Level:', value: '100% (Clean Conscience)', color: 'text-emerald-400' },
        { label: 'Community Standing:', value: 'Beloved & Respected', color: 'text-blue-400' },
        { label: 'Dirty Cash:', value: 'Surrendered to City Treasury', color: 'text-slate-300' },
      ],
    },
    king_of_underworld: {
      title: 'KING OF THE UNDERWORLD: SHADOWS OF METRO CITY',
      subtitle: 'Carter destroyed the evidence and embraced his empire. Metro City now bows to the officer in the shadows.',
      icon: <Crown className="w-12 h-12 text-amber-400 animate-pulse" />,
      cardStyle: 'border-purple-500/70 shadow-[0_0_50px_rgba(168,85,247,0.35)]',
      badgeStyle: 'bg-purple-950/80 border-purple-500 text-purple-300',
      statsSummary: [
        { label: 'Moral Path:', value: 'Syndicate Overlord', color: 'text-purple-400' },
        { label: 'Underworld Rep:', value: '100% (Absolute Dominance)', color: 'text-purple-400' },
        { label: 'Department Influence:', value: 'Compromised & Controlled', color: 'text-amber-400' },
        { label: 'Blackmail Files:', value: 'Incinerated into Ash', color: 'text-emerald-400' },
      ],
    },
    fallen_badge: {
      title: 'THE FALLEN BADGE: THE WALLS CLOSE IN',
      subtitle: 'Greed and fear gave him nowhere to run. Carter tried to hide, but the truth destroyed his career in disgrace.',
      icon: <Skull className="w-12 h-12 text-red-500 animate-pulse" />,
      cardStyle: 'border-red-600/70 shadow-[0_0_50px_rgba(239,68,68,0.35)]',
      badgeStyle: 'bg-red-950/80 border-red-500 text-red-300',
      statsSummary: [
        { label: 'Moral Path:', value: 'Disgraced Officer', color: 'text-red-400' },
        { label: 'Internal Affairs:', value: 'Federal Indictment Filed', color: 'text-red-400' },
        { label: 'Badge Status:', value: 'Revoked & Stripped', color: 'text-red-500' },
        { label: 'Public Stance:', value: 'Scandalized & Exposed', color: 'text-amber-400' },
      ],
    },
    no_one_is_innocent: {
      title: 'NO ONE IS INNOCENT: THE BURNED HORIZON',
      subtitle: 'Carter leaked the entire corrupt apparatus to the world. He tore down the city\'s empire and faced the music.',
      icon: <Scale className="w-12 h-12 text-cyan-400 animate-pulse" />,
      cardStyle: 'border-cyan-500/70 shadow-[0_0_50px_rgba(6,182,212,0.35)]',
      badgeStyle: 'bg-cyan-950/80 border-cyan-500 text-cyan-300',
      statsSummary: [
        { label: 'Moral Path:', value: 'Whistleblower Reckoning', color: 'text-cyan-400' },
        { label: 'Systemic Fallout:', value: 'City Hall & Syndicates Exposed', color: 'text-cyan-400' },
        { label: 'Legacy Standing:', value: 'Folk Hero / Radical Truth', color: 'text-blue-400' },
        { label: 'Public Access:', value: '4,210 Leaked Dossiers', color: 'text-emerald-400' },
      ],
    },
  };

  const handleNextPhase1 = () => {
    soundEngine.playRadioChime();
    if (slideIndex < phase1Slides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      onDeployToPier4();
      onClose();
    }
  };

  const handleNextEndingSlide = () => {
    soundEngine.playRadioChime();
    const currentSlides = endingSlides[resolvedEnding];
    if (slideIndex < currentSlides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      soundEngine.playMegaphoneChime();
      setCurrentPhase('phase4_ending_card');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Top Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-black border-b border-slate-900 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
          <div className="leading-tight">
            <span className="font-['Chakra_Petch'] text-xs font-black text-amber-400 uppercase tracking-widest block">
              SEMI-FINAL CLIMAX · CHAPTER 7
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              THE LAST BADGE · HARBOR PIER 4
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

          {currentPhase === 'phase1_message' && (
            <button
              onClick={() => {
                onDeployToPier4();
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 font-['Chakra_Petch'] font-bold rounded-lg uppercase tracking-wider transition-colors"
            >
              DEPLOY TO PIER 4 (SKIP)
            </button>
          )}
        </div>
      </div>

      {/* Atmospheric Background Scene Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900 via-slate-950 to-black" />

      {/* =========================================================================
          PHASE 1: THE BETRAYAL & MYSTERIOUS MESSAGE
         ========================================================================= */}
      {currentPhase === 'phase1_message' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/70 border border-amber-600/60 rounded-full text-amber-400 text-xs font-mono font-bold mb-4 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{phase1Slides[slideIndex].headline}</span>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
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
              {phase1Slides[slideIndex].text}
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {phase1Slides[slideIndex].subtext}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              TRANSMISSION {slideIndex + 1} OF {phase1Slides.length}
            </span>
            <button
              onClick={handleNextPhase1}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl font-['Chakra_Petch'] text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < phase1Slides.length - 1 ? 'NEXT' : 'DRIVE TO PIER 4'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 3: THE FINAL CHOICE (3 PROFOUND PATHS)
         ========================================================================= */}
      {currentPhase === 'phase3_choice' && (
        <div className="relative max-w-5xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
            <span className="font-['Chakra_Petch'] text-amber-400 font-bold text-xs uppercase tracking-widest block mb-1">
              THE CONFRONTATION CONCLUDES · CARTER HOLDS THE MASTER DOSSIER
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-['Chakra_Petch']">
              THE LAST BADGE: CHOOSE OFFICER CARTER'S FINAL RECKONING
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mt-2">
              The ambush mercenaries lie defeated on the dock. The blackmailer is neutralized. You hold the files that can either save your soul, build an empire, or bring down the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CONFESS */}
            <div className="bg-slate-950/90 border-2 border-slate-800 hover:border-emerald-500 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Chakra_Petch'] font-black text-xs uppercase px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/60 text-emerald-400 rounded-lg tracking-wider">
                    CHOICE 1
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2">
                  CONFESS & SURRENDER
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Surrender your badge and the ledger to Department Oversight. Own your crimes, face trial, and honor your mother's promise.
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div className="text-emerald-400 font-bold">🕊️ Leads to Ending: REDEMPTION</div>
                  <div>· Loses the badge, but cleanses the soul</div>
                  <div>· Sets Integrity to 100%</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectChoice('confess')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <span>CHOOSE: CONFESS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. DESTROY THE EVIDENCE */}
            <div className="bg-slate-950/90 border-2 border-slate-800 hover:border-amber-500 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Chakra_Petch'] font-black text-xs uppercase px-2.5 py-1 bg-amber-950/70 border border-amber-500/60 text-amber-400 rounded-lg tracking-wider">
                    CHOICE 2
                  </span>
                  <Flame className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2">
                  DESTROY THE EVIDENCE
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Burn the dossier and erase the hard drives. Protect your career, your dirty cash, and your double life from the law.
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div className="text-amber-400 font-bold">🔥 Leads to KING OF UNDERWORLD or FALLEN BADGE</div>
                  <div>· Evaluates your existing Underworld / IA standing</div>
                  <div>· High underworld respect crowns you king</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectChoice('destroy')}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl font-['Chakra_Petch'] text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
              >
                <span>CHOOSE: BURN EVIDENCE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. EXPOSE EVERYONE */}
            <div className="bg-slate-950/90 border-2 border-slate-800 hover:border-cyan-500 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['Chakra_Petch'] font-black text-xs uppercase px-2.5 py-1 bg-cyan-950/70 border border-cyan-500/60 text-cyan-400 rounded-lg tracking-wider">
                    CHOICE 3
                  </span>
                  <Scale className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2">
                  EXPOSE EVERYONE
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Upload the unredacted files to the global press. Expose every corrupt official and syndicate boss, facing your own trial alongside them.
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div className="text-cyan-400 font-bold">⚡ Leads to Ending: NO ONE IS INNOCENT</div>
                  <div>· Systemic corruption blown wide open</div>
                  <div>· Carter becomes the ultimate whistleblower</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectChoice('expose')}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
              >
                <span>CHOOSE: EXPOSE ALL</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 4: MULTI-BRANCH ENDING CINEMATIC SLIDES
         ========================================================================= */}
      {currentPhase === 'phase4_ending_slides' && (
        <div className="relative max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-center flex-1 z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-mono font-bold mb-4 w-fit">
            <span>{endingSlides[resolvedEnding][slideIndex].headline}</span>
          </div>

          <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {endingSlides[resolvedEnding][slideIndex].avatar}
              </div>
              <div>
                <h3 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase text-slate-100 flex items-center gap-2">
                  <span>{endingSlides[resolvedEnding][slideIndex].speaker}</span>
                </h3>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[11px] font-mono font-bold rounded border ${endingSlides[resolvedEnding][slideIndex].tagColor}`}>
                  {endingSlides[resolvedEnding][slideIndex].role}
                </span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-slate-100 leading-relaxed font-serif italic mb-4 min-h-[90px]">
              "{endingSlides[resolvedEnding][slideIndex].text}"
            </p>

            <div className="text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-3 italic">
              {endingSlides[resolvedEnding][slideIndex].subtext}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-400 font-mono">
            <span>
              EPILOGUE SEQUENCE {slideIndex + 1} OF {endingSlides[resolvedEnding].length}
            </span>
            <button
              onClick={handleNextEndingSlide}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-950/50 transition-all active:scale-[0.98]"
            >
              <span>{slideIndex < endingSlides[resolvedEnding].length - 1 ? 'CONTINUE' : 'VIEW FINAL DESTINY'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 4: CAMPAIGN COMPLETED SUMMARY & ENDING TITLE CARD
         ========================================================================= */}
      {currentPhase === 'phase4_ending_card' && (
        <div className="relative max-w-3xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center text-center flex-1 z-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-6 shadow-2xl">
            {endingDetails[resolvedEnding].icon}
          </div>

          <span className={`font-['Chakra_Petch'] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-3 ${endingDetails[resolvedEnding].badgeStyle}`}>
            CAMPAIGN RESOLUTION · ENDING ACHIEVED
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase mb-3 font-['Chakra_Petch'] leading-tight">
            "{endingDetails[resolvedEnding].title}"
          </h1>

          <p className="text-sm sm:text-base text-slate-300 italic font-serif max-w-xl mb-6 leading-relaxed">
            {endingDetails[resolvedEnding].subtitle}
          </p>

          <div className={`p-4 bg-slate-950/85 border rounded-2xl text-left w-full max-w-lg mb-6 grid grid-cols-2 gap-3 text-xs font-mono ${endingDetails[resolvedEnding].cardStyle}`}>
            {endingDetails[resolvedEnding].statsSummary.map((item, idx) => (
              <div key={idx}>
                <span className="text-slate-500 block text-[11px]">{item.label}</span>
                <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={() => {
                onRestartMission();
                onClose();
              }}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REPLAY "THE LAST BADGE"</span>
            </button>

            <button
              onClick={() => {
                onContinueFreeRoam(resolvedEnding);
                onClose();
              }}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE METRO CITY</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-black border-t border-slate-900 flex items-center justify-center text-[11px] text-slate-600 font-mono z-10 shrink-0">
        METRO CITY POLICE PRECINCT 9 · INTERNAL AFFAIRS CLASSIFIED DOSSIER #4409
      </div>
    </div>
  );
};
