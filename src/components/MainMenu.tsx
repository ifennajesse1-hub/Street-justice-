import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Compass,
  FileText,
  Shield,
  User,
  Settings as SettingsIcon,
  Users,
  Award,
  ChevronRight,
  Crosshair,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  CloudRain,
  Radio,
  Lock,
} from 'lucide-react';
import { Mission, PlayerStats, WeaponConfig, TimeOfDay, WeatherType } from '../types/game';

interface MainMenuProps {
  isOpen: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onSelectMission: (missionId: string) => void;
  onStartFreeRoam: () => void;
  onOpenArmory: () => void;
  onOpenProfile: () => void;
  onOpenCases: () => void;
  missions: Mission[];
  stats: PlayerStats;
  weapons: WeaponConfig[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
  onChangeWeather: (weather: WeatherType) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onContinue,
  onNewGame,
  onSelectMission,
  onStartFreeRoam,
  onOpenArmory,
  onOpenProfile,
  onOpenCases,
  missions,
  stats,
  weapons,
  timeOfDay,
  weather,
  onChangeTimeOfDay,
  onChangeWeather,
  isMuted,
  onToggleMute,
}) => {
  const [activeSubView, setActiveSubView] = useState<'main' | 'missions' | 'settings'>('main');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Dynamic Animated City Backdrop Lighting */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-blue-950/40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Police siren scanlines effect */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-transparent to-red-600 animate-pulse" />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[780px] p-6 sm:p-10 flex flex-col justify-between z-10">
        {/* HEADER / TITLE */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <span className="font-['Chakra_Petch'] text-xs uppercase tracking-[0.25em] text-blue-400 font-bold">
                METRO POLICE DEPARTMENT · PRECINCT 9
              </span>
            </div>
            <h1 className="font-['Chakra_Petch'] font-black text-4xl sm:text-6xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-200 to-slate-400 drop-shadow-[0_2px_12px_rgba(59,130,246,0.5)]">
              STREET JUSTICE
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-lg">
              Take back the streets of Metro City from organized crime syndicates. Investigate, pursue, and enforce justice.
            </p>
          </div>

          {/* Officer Quick Badge */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 sm:p-4 rounded-xl backdrop-blur-md hidden sm:flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100">
                OFFICER ALEX CARTER
              </div>
              <div className="text-xs text-blue-400 font-semibold">{stats.rankName}</div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                ${stats.money.toLocaleString()} · {stats.xp} XP
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE CONTENT: NAVIGATION MENU */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center">
          {activeSubView === 'main' && (
            <>
              {/* Main Menu Action Buttons */}
              <div className="lg:col-span-6 flex flex-col gap-2.5">
                {/* 1. CONTINUE */}
                <button
                  onClick={onContinue}
                  className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-['Chakra_Petch'] font-bold text-base tracking-wider uppercase shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 fill-white" />
                    <span>CONTINUE PATROL</span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 2. FREE ROAM */}
                <button
                  onClick={onStartFreeRoam}
                  className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-semibold text-sm tracking-wider uppercase transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>FREE ROAM & 911 CALLS</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950/70 border border-emerald-600/50 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    CITY PATROL
                  </span>
                </button>

                {/* 3. MISSIONS */}
                <button
                  onClick={() => setActiveSubView('missions')}
                  className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-semibold text-sm tracking-wider uppercase transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Crosshair className="w-4 h-4 text-blue-400" />
                    <span>STORY MISSIONS</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {missions.filter((m) => m.completed).length} / {missions.length}
                  </span>
                </button>

                {/* 4. CASE FILES & FORENSICS */}
                <button
                  onClick={onOpenCases}
                  className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-semibold text-sm tracking-wider uppercase transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>INVESTIGATION & CASE FILES</span>
                  </div>
                  <span className="text-[10px] bg-amber-950/70 border border-amber-600/50 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                    FORENSICS
                  </span>
                </button>

                {/* 5. EQUIPMENT & ARMORY */}
                <button
                  onClick={onOpenArmory}
                  className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-semibold text-sm tracking-wider uppercase transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>EQUIPMENT & ARMORY</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {weapons.filter((w) => w.unlocked).length} Unlocked
                  </span>
                </button>

                {/* 6. OFFICER PROFILE */}
                <button
                  onClick={onOpenProfile}
                  className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl font-['Chakra_Petch'] font-semibold text-sm tracking-wider uppercase transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>OFFICER PROFILE & IA RECORDS</span>
                  </div>
                  <span className="text-xs text-purple-400 font-bold font-mono">
                    {stats.reputation}% REP
                  </span>
                </button>

                {/* 7. SETTINGS & NEW GAME ROW */}
                <div className="flex items-center gap-2.5 mt-1">
                  <button
                    onClick={() => setActiveSubView('settings')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl font-['Chakra_Petch'] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>SETTINGS</span>
                  </button>
                  <button
                    onClick={onNewGame}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/60 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/50 rounded-xl font-['Chakra_Petch'] text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
                    title="Start New Career from Chapter 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>NEW CAREER</span>
                  </button>
                </div>

                {/* MULTIPLAYER (COMING SOON) */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-500 font-['Chakra_Petch'] text-xs font-semibold uppercase">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span>TACTICAL CO-OP MULTIPLAYER</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                    <Lock className="w-2.5 h-2.5" /> COMING SOON
                  </span>
                </div>
              </div>

              {/* Right Side Info Showcase */}
              <div className="hidden lg:flex lg:col-span-6 flex-col gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="font-['Chakra_Petch'] font-bold text-sm tracking-wider uppercase text-slate-200">
                    PRECINCT 9 OPERATIONS LOG
                  </div>
                  <div className="text-xs text-blue-400 font-mono font-semibold">ONLINE</div>
                </div>

                {/* Stats Summary Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-['Chakra_Petch'] text-slate-500 uppercase">
                      Arrests Cleanly Executed
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {stats.arrests}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-['Chakra_Petch'] text-slate-500 uppercase">
                      Hostiles Neutralized
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                      {stats.kills}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-['Chakra_Petch'] text-slate-500 uppercase">
                      Internal Affairs Standing
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                      {stats.reputation} / 100
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-['Chakra_Petch'] text-slate-500 uppercase">
                      Civilians Protected
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                      {stats.civiliansRescued}
                    </div>
                  </div>
                </div>

                {/* Current Active Mission Brief Card */}
                <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl mt-2">
                  <div className="flex items-center gap-2 text-xs font-['Chakra_Petch'] text-blue-400 font-bold uppercase">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>ACTIVE ASSIGNMENT</span>
                  </div>
                  <div className="font-['Chakra_Petch'] font-bold text-base text-slate-100 mt-1">
                    {missions.find((m) => !m.completed)?.title || 'All City Syndicates Dismantled!'}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {missions.find((m) => !m.completed)?.description ||
                      'Metro City is under high police control. Engage in Free Roam to respond to 911 dynamic events.'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* MISSIONS SUBVIEW */}
          {activeSubView === 'missions' && (
            <div className="lg:col-span-12 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSubView('main')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-['Chakra_Petch'] font-semibold uppercase flex items-center gap-1"
                >
                  ← Back to Menu
                </button>
                <div className="font-['Chakra_Petch'] text-sm font-bold text-slate-200 uppercase">
                  Story Missions Dossier
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {missions.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (m.unlocked) {
                        onSelectMission(m.id);
                        onContinue();
                      }
                    }}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      m.unlocked
                        ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/60 cursor-pointer active:scale-[0.98]'
                        : 'bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-['Chakra_Petch'] text-blue-400 font-bold uppercase">
                          Chapter {m.chapter}
                        </span>
                        {m.completed ? (
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50">
                            COMPLETED
                          </span>
                        ) : m.unlocked ? (
                          <span className="text-blue-400 font-bold text-[10px] bg-blue-950/80 px-2 py-0.5 rounded border border-blue-600/50">
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold text-[10px]">LOCKED</span>
                        )}
                      </div>
                      <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100">
                        {m.title}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/80 font-mono">
                      <span className="text-emerald-400 font-bold">+${m.rewardMoney}</span>
                      <span className="text-blue-400 font-bold">+{m.rewardXP} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS SUBVIEW */}
          {activeSubView === 'settings' && (
            <div className="lg:col-span-12 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSubView('main')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-['Chakra_Petch'] font-semibold uppercase flex items-center gap-1"
                >
                  ← Back to Menu
                </button>
                <div className="font-['Chakra_Petch'] text-sm font-bold text-slate-200 uppercase">
                  Tactical & City Environment Settings
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Time of Day */}
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <div className="font-['Chakra_Petch'] text-xs font-bold text-slate-300 uppercase mb-3">
                    Time of Day
                  </div>
                  <div className="flex flex-col gap-2">
                    {(['day', 'sunset', 'night'] as TimeOfDay[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => onChangeTimeOfDay(t)}
                        className={`px-3 py-2 rounded-lg font-['Chakra_Petch'] text-xs font-bold uppercase text-left flex items-center gap-2 border transition-all ${
                          timeOfDay === t
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t === 'day' ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : t === 'sunset' ? <Sun className="w-3.5 h-3.5 text-orange-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather */}
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <div className="font-['Chakra_Petch'] text-xs font-bold text-slate-300 uppercase mb-3">
                    City Weather
                  </div>
                  <div className="flex flex-col gap-2">
                    {(['clear', 'rain', 'fog'] as WeatherType[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => onChangeWeather(w)}
                        className={`px-3 py-2 rounded-lg font-['Chakra_Petch'] text-xs font-bold uppercase text-left flex items-center gap-2 border transition-all ${
                          weather === w
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {w === 'rain' ? <CloudRain className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
                        <span>{w}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio & Controls */}
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <div className="font-['Chakra_Petch'] text-xs font-bold text-slate-300 uppercase mb-3">
                    Audio & Sound
                  </div>
                  <button
                    onClick={onToggleMute}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 font-['Chakra_Petch'] text-xs font-bold uppercase text-left flex items-center justify-between text-slate-300 transition-colors"
                  >
                    <span>Sound Synthesizer</span>
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <span>STREET JUSTICE · VER 2.5 POLICE SIMULATOR</span>
          <span>TOUCH & DESKTOP COMPLIANT</span>
        </div>
      </div>
    </div>
  );
};
