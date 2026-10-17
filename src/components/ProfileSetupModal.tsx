import React, { useState } from 'react';
import {
  Shield,
  User,
  Zap,
  Scale,
  Crosshair,
  Award,
  ChevronRight,
  Sparkles,
  Check,
  X,
  Lock,
  ArrowRight,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  PlayerProfileSettings,
  GameDifficulty,
  PreferredPlayStyle,
  CustomizationSettings,
} from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface ProfileSetupModalProps {
  isOpen: boolean;
  initialProfile?: PlayerProfileSettings;
  isEditing?: boolean;
  onConfirm: (profile: PlayerProfileSettings) => void;
  onCancel?: () => void;
}

const CALLSIGN_PRESETS = [
  'Carter',
  'Specter',
  'Viper',
  'Nomad',
  'Shadow',
  'Striker',
  'Ghost',
  'Havoc',
];

const OUTFIT_OPTIONS: {
  id: CustomizationSettings['outfit'];
  name: string;
  tag: string;
  description: string;
  badge: string;
}[] = [
  {
    id: 'rookie_patrol',
    name: 'Precinct 9 Patrol',
    tag: 'Official Duty Uniform',
    description: 'Standard navy police service uniform with duty belt, radio harness, and gold shield.',
    badge: 'Standard Issue',
  },
  {
    id: 'tactical_swat',
    name: 'Tactical SWAT Gear',
    tag: 'Heavy Assault Kit',
    description: 'Ballistic black ceramic plate carrier, reinforced tactical trousers, and assault rig.',
    badge: 'Special Response',
  },
  {
    id: 'detective',
    name: 'Undercover Detective',
    tag: 'Plainclothes Operative',
    description: 'Dark civilian trenchcoat with concealed badge, leather shoulder holster, and street boots.',
    badge: 'Plainclothes / Wire',
  },
];

const DIFFICULTY_OPTIONS: {
  id: GameDifficulty;
  name: string;
  subtitle: string;
  description: string;
  perks: string;
}[] = [
  {
    id: 'easy',
    name: 'Street Patrol',
    subtitle: 'Relaxed / Casual',
    description: 'Reduced hostile damage, faster shield recharge, and higher mission cash payouts.',
    perks: '+25% Armor · Higher Rewards',
  },
  {
    id: 'normal',
    name: 'Code 3 Standard',
    subtitle: 'Recommended Experience',
    description: 'Authentic police simulation balance. Hostiles use coordinated bounding and tactical pressure.',
    perks: 'Standard Tactical Balance',
  },
  {
    id: 'hard',
    name: 'Night Shift Crisis',
    subtitle: 'Hardcore Challenge',
    description: 'Deadly syndicates with lethal ballistic damage, aggressive flanking, and strict scrutiny.',
    perks: 'High Lethality · Relentless Enemies',
  },
];

const PLAYSTYLE_OPTIONS: {
  id: PreferredPlayStyle;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  startingTilt: string;
}[] = [
  {
    id: 'balanced',
    name: 'Pragmatic Enforcer',
    badge: 'BALANCED',
    tagline: 'Walking the razor edge between the law and the streets.',
    description: 'Maintains decent standing with the precinct brass while keeping quiet criminal contacts in the docks.',
    startingTilt: '50% Police Trust · 25% Underworld Rep',
  },
  {
    id: 'law_enforcement',
    name: 'By The Book',
    badge: 'PRECINCT LOYALIST',
    tagline: 'Dedicated to the badge, internal affairs integrity, and civilian protection.',
    description: 'Prioritizes clean arrests, forensic evidence booking, and rapid backup response.',
    startingTilt: '75% Police Trust · 10% Underworld Rep · Clean IA',
  },
  {
    id: 'underworld',
    name: 'Deep Undercover',
    badge: 'SHADOW OPERATIVE',
    tagline: 'The badge is a tool. True power and wealth lie in the syndicate shadows.',
    description: 'Capitalizes on contraband fences, backchannel payoffs, pawn shops, and secret bank vaults.',
    startingTilt: '40% Police Trust · 55% Underworld Rep · +$1,000 Cash',
  },
];

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  initialProfile,
  isEditing = false,
  onConfirm,
  onCancel,
}) => {
  const [callsign, setCallsign] = useState<string>(initialProfile?.callsign || 'Officer Carter');
  const [age, setAge] = useState<string>(
    initialProfile?.age !== undefined && initialProfile.age !== null ? String(initialProfile.age) : ''
  );
  const [outfit, setOutfit] = useState<CustomizationSettings['outfit']>(
    initialProfile?.outfit || 'rookie_patrol'
  );
  const [difficulty, setDifficulty] = useState<GameDifficulty>(
    initialProfile?.difficulty || 'normal'
  );
  const [playStyle, setPlayStyle] = useState<PreferredPlayStyle>(
    initialProfile?.playStyle || 'balanced'
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundEngine.playRadioChime();
    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null;
    const finalProfile: PlayerProfileSettings = {
      callsign: callsign.trim() || 'Officer Carter',
      age: isNaN(parsedAge as any) ? null : parsedAge,
      outfit,
      difficulty,
      playStyle,
      hasCompletedIntro: initialProfile?.hasCompletedIntro ?? false,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
    };
    onConfirm(finalProfile);
  };

  const handleSkipOptional = () => {
    soundEngine.playRadioChime();
    const finalProfile: PlayerProfileSettings = {
      callsign: callsign.trim() || 'Officer Carter',
      age: null,
      outfit: 'rookie_patrol',
      difficulty: 'normal',
      playStyle: 'balanced',
      hasCompletedIntro: initialProfile?.hasCompletedIntro ?? false,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
    };
    onConfirm(finalProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl select-none font-['Inter',sans-serif] text-slate-100 overflow-hidden">
      {/* Dynamic Ambient Background Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Setup Card */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-8 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-['Chakra_Petch'] text-[10px] sm:text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">
                {isEditing ? 'OFFICER DOSSIER · PROFILE EDITOR' : 'NEW OFFICER SETUP · PRECINCT 9'}
              </span>
            </div>
            <h2 className="font-['Chakra_Petch'] font-black text-xl sm:text-2xl uppercase tracking-wider text-slate-100 mt-1">
              {isEditing ? 'Update Officer Profile' : 'Character & Career Setup'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Configure Officer Carter's operational profile, duty uniform, difficulty, and street alignment.
            </p>
          </div>

          {isEditing && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="px-5 sm:px-8 py-5 overflow-y-auto space-y-6 flex-1 pr-3">
          {/* 1. CALLSIGN / NAME */}
          <div>
            <label className="block font-['Chakra_Petch'] text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">
              1. Officer Name / Callsign
            </label>
            <input
              type="text"
              maxLength={24}
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="e.g. Officer Carter, Nomad, Viper..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl font-['Chakra_Petch'] text-sm sm:text-base text-slate-100 font-semibold tracking-wide placeholder-slate-600 focus:outline-none transition-all shadow-inner"
            />
            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] font-['Chakra_Petch'] text-slate-500 uppercase">Presets:</span>
              {CALLSIGN_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCallsign(`Officer ${preset}`)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                    callsign.includes(preset)
                      ? 'bg-blue-950 border-blue-500 text-blue-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 2. OPTIONAL AGE SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-['Chakra_Petch'] text-xs uppercase tracking-wider text-slate-300 font-bold">
                2. Officer Age
              </label>
              <span className="text-[10px] text-slate-400 font-mono italic">
                Optional · Never used for tracking or advertising
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={21}
                max={75}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34 (Optional)"
                className="w-40 px-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl font-['Chakra_Petch'] text-sm text-slate-100 font-semibold placeholder-slate-600 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setAge('')}
                className="text-xs text-slate-400 hover:text-slate-200 font-['Chakra_Petch'] underline"
              >
                Clear / Leave Blank
              </button>
            </div>
          </div>

          {/* 3. CHARACTER APPEARANCE (OUTFIT) */}
          <div>
            <label className="block font-['Chakra_Petch'] text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
              3. Starting Duty Uniform / Appearance
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OUTFIT_OPTIONS.map((item) => {
                const isSelected = outfit === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playRadioChime();
                      setOutfit(item.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold uppercase">
                        {item.badge}
                      </span>
                      <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 mt-2">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-blue-400 font-medium">{item.tag}</div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. GAME DIFFICULTY */}
          <div>
            <label className="block font-['Chakra_Petch'] text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">
              4. Operational Difficulty
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playRadioChime();
                      setDifficulty(diff.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? diff.id === 'hard'
                          ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500'
                          : 'bg-blue-950/50 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div>
                      <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100">
                        {diff.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{diff.subtitle}</div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {diff.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                      {diff.perks}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. PREFERRED PLAY STYLE (DUAL IDENTITY ALIGNMENT) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-['Chakra_Petch'] text-xs uppercase tracking-wider text-slate-300 font-bold">
                5. Career Play Style & Dual Identity Alignment
              </label>
              <span className="text-[10px] font-mono text-purple-400">Can adapt dynamically during play</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLAYSTYLE_OPTIONS.map((style) => {
                const isSelected = playStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playRadioChime();
                      setPlayStyle(style.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-purple-300 font-bold">
                        {style.badge}
                      </span>
                      <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 mt-1.5">
                        {style.name}
                      </div>
                      <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                        "{style.tagline}"
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {style.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-cyan-300 font-bold border-t border-slate-800 pt-1.5">
                      {style.startingTilt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-8 py-4 border-t border-slate-800/80 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleSkipOptional}
              className="text-xs text-slate-400 hover:text-slate-200 font-['Chakra_Petch'] font-bold uppercase transition-colors"
            >
              Skip Optional & Quick Start
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">
              Profile changes will save immediately to career file
            </span>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEditing && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Chakra_Petch'] text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isEditing ? 'Save Profile Changes' : 'Confirm & Begin Story'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
