import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  ChevronRight,
  Eye,
  Lock,
  Compass,
  AlertTriangle,
  Play,
  SkipForward,
  Scale,
} from 'lucide-react';
import { PlayerProfileSettings } from '../types/game';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';
import { soundEngine } from '../game/audio/SoundEffects';

interface StoryIntroCinematicProps {
  isOpen: boolean;
  profile: PlayerProfileSettings;
  onComplete: () => void;
}

interface StoryBeat {
  chapter: string;
  speaker: string;
  title: string;
  tagline: string;
  text: string;
  ambientTone: string;
  badgeType: 'police' | 'underworld' | 'ia' | 'justice';
}

export const StoryIntroCinematic: React.FC<StoryIntroCinematicProps> = ({
  isOpen,
  profile,
  onComplete,
}) => {
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const callsign = profile.callsign || 'Officer Carter';

  const STORY_BEATS: StoryBeat[] = [
    {
      chapter: 'ACT I · THE BADGE',
      speaker: 'Precinct 9 Dispatch Archive',
      title: 'Metro City Police Department',
      tagline: 'Badge #4912 · Service Record Active',
      text: `02:40 Hours. Rain washes over the concrete canyons of Metro City. To the brass at Precinct 9 and the evening news, ${callsign} is an exemplary street cop. Commendations for valor, swift arrests in hostile alleys, and a steady hand on the trigger. A trusted officer of the law.`,
      ambientTone: 'Standard Police Protocol',
      badgeType: 'police',
    },
    {
      chapter: 'ACT II · THE SHADOWS',
      speaker: 'Metro City Intelligence Dossier',
      title: 'A City Divided By Greed',
      tagline: 'Docks, Pawn Shops, and Shadow Syndicates',
      text: `Beneath the neon signs and flashing cruiser lights, the law is paper-thin. Crime syndicates rule the shipping docks, loan sharks control the alleys, and corrupt financiers move millions through sealed vault blast doors. On these streets, pure idealism gets good cops killed.`,
      ambientTone: 'Syndicate Influence',
      badgeType: 'underworld',
    },
    {
      chapter: 'ACT III · THE DOUBLE LIFE',
      speaker: `${callsign} · Confidential Audio Log`,
      title: 'Playing Both Sides of the Wire',
      tagline: 'An Officer With Deep Criminal Ties',
      text: `Carter learned early that survival demands knowing both sides of the street. A quiet tip to an informant in the shadows. A sealed envelope tucked away from the evidence room. Underworld bosses believe Carter is their personal asset in blue. The brass believes Carter is their most ruthless enforcer. Both are only half-right.`,
      ambientTone: 'Moral Ambiguity',
      badgeType: 'ia',
    },
    {
      chapter: 'ACT IV · STREET JUSTICE',
      speaker: 'Internal Affairs Wiretap Excerpt',
      title: 'Every Badge Has a Secret',
      tagline: 'Your Code. Your City. Your Rules.',
      text: `Internal Affairs is watching every move. Criminal kingpins are testing your loyalty with bags of unlaundered cash. Will you enforce by-the-book law and earn police trust, or build an underground empire in the shadows? Metro City is yours to command.`,
      ambientTone: 'Career Commences',
      badgeType: 'justice',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      cinematicMusicEngine.startSequence('mission');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const beat = STORY_BEATS[currentBeat] || STORY_BEATS[0];
  const isLastBeat = currentBeat >= STORY_BEATS.length - 1;

  const handleNext = () => {
    soundEngine.playRadioChime();
    if (!isLastBeat) {
      setCurrentBeat((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    soundEngine.playRadioChime();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Top Cinematic Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-slate-950/95 border-b border-slate-900 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="font-['Chakra_Petch'] text-xs uppercase tracking-[0.2em] text-blue-400 font-bold">
            PROLOGUE: THE DUAL LIFE OF {callsign.toUpperCase()}
          </span>
        </div>

        {/* Skip Intro Button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
          title="Skip Introduction"
        >
          <span>SKIP INTRO</span>
          <SkipForward className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Cinematic Center Visual Area */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10 z-10 overflow-hidden">
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/30 via-slate-950 to-black pointer-events-none" />

        {/* Ambient Red & Blue Police Cruiser Beacon Sweeps */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Noir Rain Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

        {/* Story Card */}
        <div className="relative max-w-2xl w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 flex flex-col justify-between">
          <div>
            {/* Header / Speaker Badge */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                    beat.badgeType === 'police'
                      ? 'bg-blue-950/60 border-blue-500/60 text-blue-400'
                      : beat.badgeType === 'underworld'
                      ? 'bg-purple-950/60 border-purple-500/60 text-purple-400'
                      : beat.badgeType === 'ia'
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-400'
                      : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                  }`}
                >
                  {beat.badgeType === 'police' ? (
                    <Shield className="w-5 h-5" />
                  ) : beat.badgeType === 'underworld' ? (
                    <Compass className="w-5 h-5" />
                  ) : beat.badgeType === 'ia' ? (
                    <Radio className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Scale className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-['Chakra_Petch'] text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    {beat.chapter}
                  </div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm sm:text-base text-slate-100 uppercase">
                    {beat.speaker}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                ACT {currentBeat + 1} / {STORY_BEATS.length}
              </span>
            </div>

            {/* Title & Tagline */}
            <h2 className="font-['Chakra_Petch'] font-black text-2xl sm:text-3xl text-slate-100 uppercase tracking-wide">
              {beat.title}
            </h2>
            <div className="text-xs text-blue-400 font-mono mt-1 font-semibold uppercase tracking-wider">
              {beat.tagline}
            </div>

            {/* Narrative Story Text */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-serif italic mt-5 min-h-[96px] drop-shadow-sm">
              "{beat.text}"
            </p>
          </div>

          {/* Card Footer with Progress Dots & Proceed Button */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
            {/* Progress Step Dots */}
            <div className="flex items-center gap-2">
              {STORY_BEATS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentBeat
                      ? 'w-7 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : idx < currentBeat
                      ? 'w-2 bg-blue-800'
                      : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Next / Start Patrol Button */}
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Chakra_Petch'] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{isLastBeat ? 'START PATROL IN METRO CITY' : 'CONTINUE'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="w-full h-16 sm:h-20 bg-slate-950/95 border-t border-slate-900 flex items-center justify-between px-6 z-20 text-[10px] sm:text-xs text-slate-500">
        <span>METRO POLICE DEPARTMENT · DISPATCH RECORD</span>
        <span>TAP CONTINUE OR USE KEYBOARD TO PROCEED</span>
      </div>
    </div>
  );
};
