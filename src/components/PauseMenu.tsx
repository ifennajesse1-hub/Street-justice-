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
  Users,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { Mission, WeaponConfig, PlayerStats, TimeOfDay, WeatherType, CustomizationSettings, EvidenceItem, DynamicEvent } from '../types/game';
import { RANKS, getRankForXP } from '../game/systems/ProgressionSystem';
import { CrimeCase, CRIME_CASES } from '../game/systems/InvestigationSystem';
import { FACTIONS_DATA, FactionInfo } from '../game/systems/FactionData';
import { cityIncidentManager } from '../game/systems/DynamicEventsSystem';
import { Cloud, RotateCw, LogIn, LogOut, CheckCircle, Database } from 'lucide-react';

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
  authUser?: { uid: string; email?: string | null; displayName?: string | null; isAnonymous: boolean } | null;
  cloudSyncStatus?: 'synced' | 'saving' | 'offline';
  lastSavedAt?: Date | null;
  onLoginWithGoogle?: () => void;
  onLogout?: () => void;
  onManualSave?: () => void;
  onRespondIncident?: (incident: DynamicEvent) => void;
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
  authUser,
  cloudSyncStatus = 'synced',
  lastSavedAt,
  onLoginWithGoogle,
  onLogout,
  onManualSave,
  onRespondIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'dispatch' | 'cases' | 'armory' | 'factions' | 'profile' | 'locker' | 'settings'>('missions');
  const [selectedFactionId, setSelectedFactionId] = useState<string>('cedar_heights');

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
                <span className="text-emerald-400 font-mono font-bold">${stats.money.toLocaleString()} Cash</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300 font-mono font-bold">${(stats.bankSavings || 0).toLocaleString()} Bank</span>
                <span aria-hidden="true">·</span>
                <span className={`${(stats.integrity ?? 80) >= 65 ? 'text-emerald-400' : (stats.integrity ?? 80) >= 40 ? 'text-amber-400' : 'text-purple-400'} font-mono font-semibold`}>
                  {stats.integrity ?? 80}% Integrity
                </span>
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
            onClick={() => setActiveTab('dispatch')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'dispatch'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>City Dispatch</span>
            {cityIncidentManager.activeIncidents.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-mono">
                {cityIncidentManager.activeIncidents.length}
              </span>
            )}
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
            onClick={() => setActiveTab('factions')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] font-bold text-xs tracking-wider uppercase border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'factions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Factions & Intel</span>
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

          {/* TAB: CITY DISPATCH & POLICE STRATEGY COMMAND */}
          {activeTab === 'dispatch' && (
            <div className="flex flex-col gap-5">
              {/* No Main Hero Theme Banner */}
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-red-950/30 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-amber-400">
                    CITY STRATEGY ADVISORY · NO CHOSEN ONE
                  </span>
                </div>
                <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 mb-1">
                  “Street Justice — a city where ordinary people, criminals and police collide, and every decision has consequences.”
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You are a human officer participant, not an invincible superhero. Precinct 9 operates with finite resources across the metropolis. Incidents happen simultaneously across all sectors. If police units are overcommitted, situations will escalate or resolve autonomously without you.
                </p>
              </div>

              {/* Limited Police Resources Command Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Precinct 9 Active Resource Pool</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Priority-based dispatch & reallocation active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* Patrol */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Patrol</span>
                      <span className="text-blue-400 font-bold font-mono">
                        {cityIncidentManager.policeResources.patrolAvailable}/{cityIncidentManager.policeResources.patrolTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{
                          width: `${(cityIncidentManager.policeResources.patrolAvailable / cityIncidentManager.policeResources.patrolTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Sector beats</span>
                  </div>

                  {/* Pursuit */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Pursuit</span>
                      <span className="text-cyan-400 font-bold font-mono">
                        {cityIncidentManager.policeResources.pursuitAvailable}/{cityIncidentManager.policeResources.pursuitTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full transition-all"
                        style={{
                          width: `${(cityIncidentManager.policeResources.pursuitAvailable / cityIncidentManager.policeResources.pursuitTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">High-speed chase</span>
                  </div>

                  {/* SWAT */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">SWAT</span>
                      <span className="text-purple-400 font-bold font-mono">
                        {cityIncidentManager.policeResources.swatAvailable}/{cityIncidentManager.policeResources.swatTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all"
                        style={{
                          width: `${(cityIncidentManager.policeResources.swatAvailable / cityIncidentManager.policeResources.swatTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Tactical assault</span>
                  </div>

                  {/* Traffic */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Traffic</span>
                      <span className="text-amber-400 font-bold font-mono">
                        {cityIncidentManager.policeResources.trafficAvailable}/{cityIncidentManager.policeResources.trafficTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all"
                        style={{
                          width: `${(cityIncidentManager.policeResources.trafficAvailable / cityIncidentManager.policeResources.trafficTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Road blockages</span>
                  </div>

                  {/* Fire / Rescue */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Fire & Rescue</span>
                      <span className="text-red-400 font-bold font-mono">
                        {cityIncidentManager.policeResources.fireAvailable}/{cityIncidentManager.policeResources.fireTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all"
                        style={{
                          width: `${(cityIncidentManager.policeResources.fireAvailable / cityIncidentManager.policeResources.fireTotal) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Hazards & blazes</span>
                  </div>
                </div>
              </div>

              {/* Active Simultaneous City Incidents List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    <span>Active Simultaneous Incidents ({cityIncidentManager.activeIncidents.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Living city: Events escalate or resolve continuously
                  </span>
                </div>

                <div className="space-y-3">
                  {cityIncidentManager.activeIncidents.length === 0 ? (
                    <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/30 text-center text-xs text-slate-500">
                      No active emergency dispatches at this moment. Routine beats active.
                    </div>
                  ) : (
                    cityIncidentManager.activeIncidents.map((inc) => {
                      const isDisaster = inc.severity === 'disaster';
                      const isCritical = inc.severity === 'critical';
                      const isEscalating = inc.stage === 'escalating';

                      return (
                        <div
                          key={inc.id}
                          className={`border rounded-xl p-3.5 flex flex-col gap-2.5 transition-all ${
                            isDisaster
                              ? 'border-red-600 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                              : isCritical
                              ? 'border-amber-600 bg-amber-950/20'
                              : isEscalating
                              ? 'border-red-500/80 bg-red-950/10'
                              : 'border-slate-800 bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-['Chakra_Petch'] font-bold uppercase ${
                                    isDisaster
                                      ? 'bg-red-600 text-white animate-pulse'
                                      : isCritical
                                      ? 'bg-amber-600 text-white'
                                      : inc.severity === 'high'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {inc.severity || 'Moderate'}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {inc.locationName}
                                </span>
                                {isEscalating && (
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950 px-1.5 py-0.2 rounded border border-red-700 animate-pulse">
                                    ESCALATING
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-slate-100 text-sm">{inc.title}</h5>
                              <p className="text-xs text-slate-400 mt-0.5">{inc.description}</p>
                            </div>

                            <button
                              onClick={() => {
                                if (onRespondIncident) {
                                  onRespondIncident(inc);
                                }
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-['Chakra_Petch'] font-bold text-xs uppercase rounded-lg shrink-0 flex items-center gap-1 shadow transition-all active:scale-95"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>RESPOND (GPS)</span>
                            </button>
                          </div>

                          {/* Units Assigned & Autonomous Progress */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500 text-[11px]">Dispatched:</span>
                              {inc.assignedUnits && inc.assignedUnits.length > 0 ? (
                                inc.assignedUnits.map((u, uIdx) => (
                                  <span
                                    key={uIdx}
                                    className="px-1.5 py-0.5 bg-slate-800 text-blue-300 font-mono text-[10px] rounded uppercase"
                                  >
                                    {u}
                                  </span>
                                ))
                              ) : (
                                <span className="text-amber-400 text-[11px] font-bold">
                                  No units available (Queued)
                                </span>
                              )}
                            </div>

                            {inc.assignedUnits && inc.assignedUnits.length > 0 && (
                              <div className="flex items-center gap-2 min-w-[160px]">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Autonomous Police Progress:
                                </span>
                                <div className="flex-1 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, inc.policeProgress || 0)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-300">
                                  {Math.round(inc.policeProgress || 0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Radio Transmissions Chatter Feed */}
              {cityIncidentManager.radioChatterFeed.length > 0 && (
                <div>
                  <h4 className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recent Dispatch Communications Log</span>
                  </h4>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 font-mono text-xs">
                    {cityIncidentManager.radioChatterFeed.slice(-6).map((r) => (
                      <div
                        key={r.id}
                        className={`text-[11px] flex items-start gap-2 ${
                          r.type === 'alert'
                            ? 'text-red-300'
                            : r.type === 'success'
                            ? 'text-emerald-300'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 text-[10px] shrink-0">
                          {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* TAB: FACTIONS & INTEL */}
          {activeTab === 'factions' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Faction Selector */}
              <div className="md:col-span-4 space-y-2">
                <div className="text-[10px] font-['Chakra_Petch'] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Metropolis Communities & Factions
                </div>
                <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
                  {FACTIONS_DATA.map((fac) => {
                    const isSelected = selectedFactionId === fac.id;
                    return (
                      <button
                        key={fac.id}
                        onClick={() => setSelectedFactionId(fac.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/40 text-slate-100 shadow-md'
                            : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1 shrink-0 ring-2 ring-slate-900 shadow"
                          style={{ backgroundColor: fac.primaryColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-['Chakra_Petch'] font-bold text-xs truncate">
                            {fac.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                                fac.category === 'community'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : fac.category === 'military'
                                  ? 'bg-amber-950 text-amber-300'
                                  : fac.category === 'terrorist'
                                  ? 'bg-purple-950 text-purple-300'
                                  : fac.category === 'law_enforcement'
                                  ? 'bg-sky-950 text-sky-300'
                                  : 'bg-red-950 text-red-300'
                              }`}
                            >
                              {fac.category.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate">
                              {fac.dangerLevel}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Detail Dossier */}
              <div className="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-4">
                {(() => {
                  const fac = FACTIONS_DATA.find((f) => f.id === selectedFactionId) || FACTIONS_DATA[0];
                  return (
                    <>
                      {/* Faction Header */}
                      <div className="border-b border-slate-800 pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shadow"
                              style={{ backgroundColor: fac.primaryColor }}
                            />
                            <h3 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 uppercase">
                              {fac.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                fac.category === 'community'
                                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                                  : fac.category === 'military'
                                  ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30'
                                  : fac.category === 'terrorist'
                                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                                  : fac.category === 'law_enforcement'
                                  ? 'bg-sky-900/50 text-sky-300 border border-sky-500/30'
                                  : 'bg-red-900/50 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {fac.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-['Chakra_Petch'] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Threat: {fac.dangerLevel}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-300/90 mt-1 italic font-sans">
                          "{fac.tagline}"
                        </p>
                      </div>

                      {/* Overview Description */}
                      <div>
                        <div className="text-[10px] font-['Chakra_Petch'] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Intelligence Summary
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {fac.description}
                        </p>
                      </div>

                      {/* Tactical Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                          <span className="font-['Chakra_Petch'] font-bold text-[10px] text-slate-400 uppercase block">
                            Territory & Bounds
                          </span>
                          <span className="text-slate-200 mt-0.5 block">{fac.territory}</span>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                          <span className="font-['Chakra_Petch'] font-bold text-[10px] text-slate-400 uppercase block">
                            Preferred Vehicles
                          </span>
                          <span className="text-slate-200 mt-0.5 block">{fac.vehicleDescription}</span>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                          <span className="font-['Chakra_Petch'] font-bold text-[10px] text-slate-400 uppercase block">
                            Visual Style & Uniform
                          </span>
                          <span className="text-slate-200 mt-0.5 block">{fac.clothingStyle}</span>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                          <span className="font-['Chakra_Petch'] font-bold text-[10px] text-slate-400 uppercase block">
                            Preferred Arms
                          </span>
                          <span className="text-slate-200 mt-0.5 block">{fac.preferredWeapons}</span>
                        </div>
                      </div>

                      {/* Behavior & Combat Rules */}
                      <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-2.5">
                        <div className="text-[10px] font-['Chakra_Petch'] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Tactical Engagement Profile</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {fac.behaviorNote}
                        </p>
                      </div>

                      {/* Key Figures */}
                      <div>
                        <div className="text-[10px] font-['Chakra_Petch'] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Key Personalities & Figures
                        </div>
                        <div className="space-y-2">
                          {fac.keyFigures.map((kf, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2.5"
                            >
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-[10px] font-bold shrink-0">
                                {kf.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-['Chakra_Petch'] font-bold text-xs text-slate-200">
                                    {kf.name}
                                  </span>
                                  <span className="text-[10px] text-blue-400 font-mono">
                                    {kf.role}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {kf.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICER PROFILE & PROMOTION HIERARCHY */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Firebase Cloud Save & Identity Banner */}
              <div className="bg-slate-900/80 border border-blue-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 text-cyan-400 border border-cyan-500/40 rounded-xl shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-slate-200">
                        CLOUD FIRESTORE SAVE RECORD
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          cloudSyncStatus === 'saving'
                            ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                            : cloudSyncStatus === 'offline'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                        }`}
                      >
                        {cloudSyncStatus === 'saving'
                          ? 'SAVING...'
                          : cloudSyncStatus === 'offline'
                          ? 'OFFLINE'
                          : 'SYNCHRONIZED'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>
                        Officer ID:{' '}
                        <span className="font-mono text-slate-200">
                          {authUser?.uid ? `${authUser.uid.substring(0, 10)}...` : 'Initializing...'}
                        </span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Account:{' '}
                        <span className="text-cyan-400 font-semibold">
                          {authUser?.isAnonymous
                            ? 'Guest Patrol'
                            : authUser?.email || 'Google Officer'}
                        </span>
                      </span>
                      {lastSavedAt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[11px] text-slate-400">
                            Saved {lastSavedAt.toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cloud Auth Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onManualSave && (
                    <button
                      onClick={onManualSave}
                      disabled={cloudSyncStatus === 'saving'}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-['Chakra_Petch'] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                      title="Force save current game state to Firestore"
                    >
                      {cloudSyncStatus === 'saving' ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>SYNC NOW</span>
                    </button>
                  )}

                  {authUser?.isAnonymous && onLoginWithGoogle && (
                    <button
                      onClick={onLoginWithGoogle}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-['Chakra_Petch'] font-bold flex items-center justify-center gap-1.5 shadow transition-transform active:scale-98"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>SIGN IN WITH GOOGLE</span>
                    </button>
                  )}

                  {!authUser?.isAnonymous && onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/60 rounded-lg text-xs font-['Chakra_Petch'] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>SIGN OUT</span>
                    </button>
                  )}
                </div>
              </div>

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

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Metro Trust Bank Savings
                  </div>
                  <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                    ${(stats.bankSavings || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">Secure Vault Account</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-['Chakra_Petch'] text-slate-400 uppercase">
                    Moral Integrity (Honor vs Corrupt)
                  </div>
                  <div className={`text-lg font-bold font-mono mt-1 ${
                    (stats.integrity ?? 80) >= 65 ? 'text-emerald-400' : (stats.integrity ?? 80) >= 40 ? 'text-amber-400' : 'text-purple-400'
                  }`}>
                    {stats.integrity ?? 80} / 100
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {(stats.integrity ?? 80) >= 85 ? 'Paragon Detective' : (stats.integrity ?? 80) >= 65 ? 'By-The-Book' : (stats.integrity ?? 80) >= 40 ? 'Street Pragmatist' : 'Shady Operative'}
                  </div>
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
