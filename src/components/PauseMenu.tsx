import React, { useState } from 'react';
import {
  X,
  Crosshair,
  Shield,
  Zap,
  Sun,
  Moon,
  CloudRain,
  Eye,
  Sliders,
  Award,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Car,
  User,
  FileText,
  AlertTriangle,
  Radio,
  Camera,
  Search,
} from 'lucide-react';
import { Mission, WeaponConfig, PlayerStats, TimeOfDay, WeatherType, CustomizationSettings, EvidenceItem } from '../types/game';
import { RANKS, getRankForXP } from '../game/systems/ProgressionSystem';
import { CrimeCase, CRIME_CASES } from '../game/systems/InvestigationSystem';

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  currentMissionId?: string;
  onSelectMission: (missionId: string) => void;
  weapons: WeaponConfig[];
  stats: PlayerStats;
  onBuyOrUpgradeWeapon: (weaponId: string) => void;
  onUpgradeArmorOrHealth: (type: 'armor' | 'health') => void;
  customization: CustomizationSettings;
  onChangeOutfit: (outfit: CustomizationSettings['outfit']) => void;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
  onChangeWeather: (weather: WeatherType) => void;
  cases?: CrimeCase[];
  evidenceList?: EvidenceItem[];
  onSolveCase?: (caseId: string) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onClose,
  missions,
  currentMissionId,
  onSelectMission,
  weapons,
  stats,
  onBuyOrUpgradeWeapon,
  onUpgradeArmorOrHealth,
  customization,
  onChangeOutfit,
  timeOfDay,
  weather,
  onChangeTimeOfDay,
  onChangeWeather,
  cases = CRIME_CASES,
  evidenceList = [],
  onSolveCase,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'armory' | 'cases' | 'profile' | 'locker' | 'settings'>('missions');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 select-none font-['Inter',sans-serif]">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 tracking-wide uppercase">
                POLICE PRECINCT 9 · TACTICAL DOSSIER
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Officer Alex Carter</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-400 font-bold">{stats.rankName} (Rank {stats.rank})</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-mono font-bold">${stats.money.toLocaleString()}</span>
                <span aria-hidden="true">·</span>
                <span className="text-purple-400 font-mono font-semibold">{stats.reputation}% REP</span>
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

        {/* Tab Navigation (Segmented buttons) */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-slate-800/60 bg-slate-950 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'missions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Missions
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'cases'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Case Files
          </button>
          <button
            onClick={() => setActiveTab('armory')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'armory'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Armory & Gear
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Officer Profile & Ranks
          </button>
          <button
            onClick={() => setActiveTab('locker')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'locker'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Customization
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: MISSIONS */}
          {activeTab === 'missions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.map((m) => {
                const isSelected = m.id === currentMissionId;
                const canPlay = stats.rank >= m.requiredRank || m.unlocked;

                return (
                  <div
                    key={m.id}
                    className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-['Chakra_Petch'] text-blue-400 font-bold uppercase tracking-wider">
                          Chapter {m.chapter}
                        </span>
                        {m.completed && (
                          <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-100 text-base mb-1">{m.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="text-emerald-400 font-mono font-bold">+${m.rewardMoney}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-400 font-mono font-bold">+{m.rewardXP} XP</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectMission(m.id);
                          onClose();
                        }}
                        disabled={!canPlay}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : canPlay
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <span>{isSelected ? 'IN PROGRESS' : canPlay ? 'DEPLOY' : `LOCKED (RANK ${m.requiredRank})`}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CASE FILES */}
          {activeTab === 'cases' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-slate-400 font-['Chakra_Petch'] uppercase">
                Active Forensic Investigations & Syndicate Dossiers
              </div>
              <div className="grid grid-cols-1 gap-4">
                {cases.map((c) => {
                  const caseEvidence = evidenceList.filter((e) => e.caseFile === c.id);
                  const collectedCount = caseEvidence.filter((e) => e.collected || e.photoTaken).length;
                  const canSolve = collectedCount >= c.evidenceRequired && !c.isSolved;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border flex flex-col gap-3 ${
                        c.isSolved
                          ? 'bg-emerald-950/20 border-emerald-600/40'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-100">
                            {c.title}
                          </div>
                          <div className="text-xs text-amber-400 font-medium">
                            Target: {c.suspectOrganization} · Lead: {c.leadSuspect}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          +${c.rewardMoney} Bounty
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">{c.description}</p>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Clues Documented: {collectedCount} / {c.evidenceRequired}</span>
                        {c.isSolved ? (
                          <span className="text-emerald-400 font-bold">CASE SOLVED</span>
                        ) : canSolve ? (
                          <button
                            onClick={() => onSolveCase?.(c.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded font-['Chakra_Petch'] uppercase text-[11px]"
                          >
                            Submit to DA
                          </button>
                        ) : (
                          <span className="text-slate-500">INVESTIGATION ONGOING</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ARMORY & UPGRADES */}
          {activeTab === 'armory' && (
            <div className="space-y-6">
              {/* Officer Personal Equipment */}
              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Officer Personal Equipment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">Kevlar Vest Reinforcement</div>
                        <div className="text-xs text-slate-400">Restores & buffs armor (+50)</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgradeArmorOrHealth('armor')}
                      disabled={stats.money < 250}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold font-mono transition-colors"
                    >
                      $250
                    </button>
                  </div>

                  <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600/20 text-red-400 rounded-lg">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">Field Trauma Medkit</div>
                        <div className="text-xs text-slate-400">Heals officer health to maximum (100 HP)</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpgradeArmorOrHealth('health')}
                      disabled={stats.money < 150}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-xs font-bold font-mono transition-colors"
                    >
                      $150
                    </button>
                  </div>
                </div>
              </div>

              {/* Weapons Catalog */}
              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Fictional Weapons Catalog & Mark Upgrades
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weapons.map((w) => {
                    const upgradeCost = w.upgradeLevel * 400;
                    return (
                      <div
                        key={w.id}
                        className="border border-slate-800 bg-slate-900/40 rounded-xl p-3.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-['Chakra_Petch'] font-bold text-slate-200 uppercase">
                              {w.name}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              Mark {w.upgradeLevel}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono my-2 bg-slate-950/60 p-2 rounded-lg">
                            <div>DMG: <span className="text-slate-200 font-bold">{w.damage}</span></div>
                            <div>RPM: <span className="text-slate-200 font-bold">{w.fireRate}</span></div>
                            <div>MAG: <span className="text-slate-200 font-bold">{w.magazineSize}</span></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          {w.unlocked ? (
                            <button
                              onClick={() => onBuyOrUpgradeWeapon(w.id)}
                              disabled={stats.money < upgradeCost}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
                            >
                              Upgrade to Mk {w.upgradeLevel + 1} (${upgradeCost})
                            </button>
                          ) : (
                            <button
                              onClick={() => onBuyOrUpgradeWeapon(w.id)}
                              disabled={stats.money < w.price}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
                            >
                              Requisition Weapon (${w.price})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFICER PROFILE & PROMOTION HIERARCHY */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Career Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Rank Promotion
                  </div>
                  <div className="text-base font-bold text-blue-400 font-['Chakra_Petch'] mt-1">
                    {stats.rankName} (Lvl {stats.rank})
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{stats.xp} Total XP</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Lawful Arrests
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {stats.arrests}
                  </div>
                  <div className="text-[11px] text-slate-500">+150 XP Clean Arrest Bonus</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Hostiles Neutralized
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                    {stats.kills}
                  </div>
                  <div className="text-[11px] text-slate-500">Street engagements</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Internal Affairs Standing
                  </div>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                    {stats.reputation} / 100
                  </div>
                  <div className="text-[11px] text-slate-500">{stats.iaViolations} Infractions</div>
                </div>
              </div>

              {/* MCPD Promotion Hierarchy Table */}
              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Precinct 9 Police Rank & Promotion Ladder
                </h4>
                <div className="space-y-2">
                  {RANKS.map((r) => {
                    const isCurrent = stats.rank === r.rank;
                    const isUnlocked = stats.rank >= r.rank;

                    return (
                      <div
                        key={r.rank}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                          isCurrent
                            ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-md'
                            : isUnlocked
                            ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                            : 'bg-slate-950/40 border-slate-900 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : isUnlocked
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-900 text-slate-700'
                            }`}
                          >
                            {r.rank}
                          </span>
                          <div>
                            <div className="font-['Chakra_Petch'] font-bold text-sm">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{r.perkDescription}</div>
                          </div>
                        </div>

                        <div className="text-right text-xs font-mono font-bold">
                          {isCurrent ? (
                            <span className="text-blue-400">ACTIVE COMMISSION</span>
                          ) : isUnlocked ? (
                            <span className="text-emerald-400">ACHIEVED</span>
                          ) : (
                            <span className="text-slate-500">{r.minXP} XP REQUIRED</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMIZATION */}
          {activeTab === 'locker' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Officer Duty Uniform
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'rookie_patrol', label: 'Precinct 9 Patrol', desc: 'Standard navy police uniform' },
                    { id: 'tactical_swat', label: 'Tactical SWAT', desc: 'Ballistic black combat gear' },
                    { id: 'detective', label: 'Undercover Detective', desc: 'Civilian trenchcoat & badge' },
                  ].map((u) => {
                    const active = customization.outfit === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => onChangeOutfit(u.id as any)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-950/30 text-blue-400'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-sm">{u.label}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{u.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  City Time of Day
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'day', label: 'Daylight Patrol', icon: Sun },
                    { id: 'sunset', label: 'Sunset Dusk', icon: Sliders },
                    { id: 'night', label: 'Night Shift', icon: Moon },
                  ].map((t) => {
                    const active = timeOfDay === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onChangeTimeOfDay(t.id as TimeOfDay)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-950/30 text-blue-400'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Weather Dynamics
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'clear', label: 'Clear Sky' },
                    { id: 'rain', label: 'Urban Rain' },
                    { id: 'fog', label: 'Heavy Fog' },
                  ].map((w) => {
                    const active = weather === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => onChangeWeather(w.id as WeatherType)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-950/30 text-blue-400'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-medium">{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Street Justice · MCPD Precinct 9 Records
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-bold text-xs rounded-xl transition-colors"
          >
            RESUME PATROL
          </button>
        </div>
      </div>
    </div>
  );
};
