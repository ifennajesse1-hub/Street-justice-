import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Lock,
  Compass,
} from 'lucide-react';
import { PlayerStats, PlayerProfileSettings } from '../types/game';
import { cinematicMusicEngine } from '../game/audio/CinematicMusicEngine';
import { soundEngine } from '../game/audio/SoundEffects';

interface WelcomeScreenProps {
  isOpen: boolean;
  hasSavedGame: boolean;
  savedStats?: PlayerStats;
  savedProfile?: PlayerProfileSettings;
  lastSavedAt?: Date | null;
  onContinue: () => void;
  onStartNewGame: () => void;
  onPlayPrologue?: () => void;
  isMusicMuted: boolean;
  onToggleMusicMute: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isOpen,
  hasSavedGame,
  savedStats,
  savedProfile,
  lastSavedAt,
  onContinue,
  onStartNewGame,
  onPlayPrologue,
  isMusicMuted,
  onToggleMusicMute,
}) => {
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  if (!isOpen) return null;

  const handleStartAudio = () => {
    // Unlocks browser audio context safely upon user click
    cinematicMusicEngine.startSequence('menu');
  };

  const handleContinueClick = () => {
    soundEngine.playRadioChime();
    handleStartAudio();
    onContinue();
  };

  const handleNewGameClick = () => {
    soundEngine.playRadioChime();
    handleStartAudio();
    if (hasSavedGame) {
      setShowNewGameConfirm(true);
    } else {
      onStartNewGame();
    }
  };

  const handleConfirmNewGame = () => {
    setShowNewGameConfirm(false);
    onStartNewGame();
  };

  const callsign = savedProfile?.callsign || 'Officer Carter';
  const rankTitle = savedStats?.rankName || 'Rookie Officer';
  const cash = savedStats?.money ?? 500;
  const rep = savedStats?.reputation ?? 85;

  return (
    <div
      onClick={handleStartAudio}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden"
    >
      {/* Cinematic Urban Night Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/60 via-slate-950 to-black pointer-events-none" />

      {/* Atmospheric Noir City Fog & Neon Beacons */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Wet Asphalt Rain Streaks & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(2,6,23,0.8)_80%,#020617_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-red-600 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />

      {/* Main Container */}
      <div className="relative w-full max-w-xl mx-auto px-6 py-8 flex flex-col items-center justify-between min-h-[92vh] z-10">
        {/* TOP BAR: Audio & Department Badge */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="font-['Chakra_Petch'] text-[11px] sm:text-xs uppercase tracking-[0.25em] text-blue-400 font-bold">
              METRO P.D. · PRECINCT 9
            </span>
          </div>

          {/* Melodic Soundtrack Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMusicMute();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-['Chakra_Petch'] transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            title={isMusicMuted ? 'Unmute Background Music' : 'Mute Background Music'}
          >
            {isMusicMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-slate-400">MUSIC OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-300">MUSIC ON</span>
              </>
            )}
          </button>
        </div>

        {/* HERO TITLE & MORAL DUALITY TAGLINE */}
        <div className="flex flex-col items-center text-center my-auto py-6">
          {/* Precinct Gold Star Crest */}
          <div className="relative mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600/25 to-slate-900 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.35)] backdrop-blur-md">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-['Chakra_Petch'] font-black text-5xl sm:text-6xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-200 to-slate-300 drop-shadow-[0_4px_24px_rgba(59,130,246,0.6)]">
            STREET JUSTICE
          </h1>

          {/* Mandatory Tagline */}
          <div className="relative mt-2 px-4 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="font-['Chakra_Petch'] font-bold text-xs sm:text-sm uppercase tracking-[0.2em] text-cyan-400 drop-shadow">
              "Every Badge Has a Secret."
            </p>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm mt-4 max-w-md leading-relaxed">
            Patrol the neon-drenched streets of Metro City as Officer Carter. Enforce the law by day, or navigate the lucrative shadows of the criminal underworld.
          </p>
        </div>

        {/* SAVED GAME SUMMARY (If saved game exists) */}
        {hasSavedGame && (
          <div className="w-full mb-4 p-3.5 bg-slate-900/85 border border-blue-500/40 rounded-2xl backdrop-blur-md flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-['Chakra_Petch'] font-bold text-xs sm:text-sm text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{callsign}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                    {rankTitle}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  <span className="text-emerald-400 font-bold">${cash.toLocaleString()}</span> ·{' '}
                  <span className="text-purple-400 font-bold">{rep}% REP</span>
                  {lastSavedAt && (
                    <span className="text-slate-500 ml-1.5 hidden sm:inline">
                      · Saved {new Date(lastSavedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-emerald-950 border border-emerald-600/50 text-emerald-400 px-2 py-0.5 rounded">
              SAVED CAREER
            </span>
          </div>
        )}

        {/* PRIMARY ACTIONS: START NEW GAME & CONTINUE */}
        <div className="w-full flex flex-col gap-3">
          {/* CONTINUE BUTTON (Only shown when a saved game exists) */}
          {hasSavedGame && (
            <button
              onClick={handleContinueClick}
              className="group w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-['Chakra_Petch'] font-black text-base sm:text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-200 active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 fill-white text-white" />
                <span>CONTINUE CAREER</span>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* START NEW GAME BUTTON */}
          <button
            onClick={handleNewGameClick}
            className={`w-full py-3 px-6 rounded-2xl font-['Chakra_Petch'] font-bold text-sm sm:text-base tracking-wider uppercase transition-all duration-200 active:scale-[0.98] flex items-center justify-between cursor-pointer ${
              hasSavedGame
                ? 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white shadow-md'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] py-4 text-base sm:text-lg font-black'
            }`}
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>{hasSavedGame ? 'START NEW GAME' : 'START NEW GAME'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* EXPERIENCE STORY PROLOGUE BUTTON (Young Carter Origins) */}
          {onPlayPrologue && (
            <button
              onClick={() => {
                soundEngine.playRadioChime();
                handleStartAudio();
                onPlayPrologue();
              }}
              className="group w-full py-3 px-6 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400/80 text-cyan-300 hover:text-white font-['Chakra_Petch'] font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.98] flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <div className="text-left">
                  <span>PLAY STORY PROLOGUE</span>
                  <span className="text-[10px] text-slate-400 block font-normal font-sans lowercase">
                    young carter origins & blocky style preview
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* FOOTER METADATA */}
        <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-slate-500 border-t border-slate-900 pt-3 mt-4">
          <span>STREET JUSTICE · VER 2.5</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> SECURE LOCAL STORAGE
          </span>
        </div>
      </div>

      {/* CONFIRM NEW GAME MODAL (If player clicks New Game while saved game exists) */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 uppercase tracking-wide">
              Start New Career?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              A saved career for <strong className="text-blue-400">{callsign}</strong> ({rankTitle}) exists. Starting a new career will begin fresh character setup and restart Chapter 1.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
              >
                Keep Saved Game
              </button>
              <button
                onClick={handleConfirmNewGame}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
