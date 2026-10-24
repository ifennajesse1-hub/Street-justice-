import React, { useState, useEffect } from 'react';
import {
  Shield,
  Heart,
  Crosshair,
  RotateCw,
  Volume2,
  VolumeX,
  Menu,
  FileText,
  Home,
  Compass,
  Cloud,
  Maximize,
  Radio,
  Star,
  Sun,
  Moon,
  Scale,
  LogOut,
  Navigation,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  BookOpen,
  Info,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  PlayerStats,
  WeaponConfig,
  Mission,
  VehicleEntity,
  EnemyEntity,
  CivilianEntity,
  PoliceNPCEntity,
  MilitaryNPCEntity,
  TimeOfDay,
  DynamicEvent,
  EnterableBuilding,
  EvidenceItem,
} from '../types/game';
import { InteriorInteractable, ActiveInteriorState } from '../game/engine/BuildingInteriors';
import { getTerritoryAtCoordinates } from '../game/systems/FactionData';
import { cityIncidentManager } from '../game/systems/DynamicEventsSystem';

interface HUDProps {
  stats: PlayerStats;
  currentWeapon: WeaponConfig;
  currentMission?: Mission;
  activeIncidentObjective?: DynamicEvent | null;
  currentVehicle?: VehicleEntity;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  enemies: EnemyEntity[];
  civilians?: CivilianEntity[];
  policeNPCs?: PoliceNPCEntity[];
  militarySoldiers?: MilitaryNPCEntity[];
  vehicles?: VehicleEntity[];
  notifications: { text: string; type: 'info' | 'alert' | 'success'; id: string }[];
  isAiming: boolean;
  isReloading: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenMenu: () => void;
  onOpenMainMenu?: () => void;
  onOpenCases?: () => void;
  isFlashlightOn?: boolean;
  onToggleFlashlight?: () => void;
  onToggleCamera?: () => void;
  cloudSyncStatus?: 'synced' | 'saving' | 'offline';
  onToggleFullscreen?: () => void;
  timeOfDay?: TimeOfDay;
  onToggleTimeOfDay?: () => void;
  nearbyBuildingEntrance?: EnterableBuilding | null;
  nearbyInteriorInteractable?: InteriorInteractable | null;
  activeInterior?: ActiveInteriorState | null;
  onExitBuilding?: () => void;
  damageFlash?: boolean;
  onOpenDualIdentity?: () => void;
  onExitVehicle?: () => void;
  offDutyTracking?: 'precinct' | 'house';
  onToggleOffDutyTracking?: (target: 'precinct' | 'house') => void;
  onOpenGuide?: () => void;
  nearbyEvidence?: EvidenceItem | null;
  onCollectEvidence?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  currentMission,
  activeIncidentObjective,
  currentVehicle,
  onExitVehicle,
  playerPos,
  playerYaw,
  enemies,
  civilians = [],
  policeNPCs = [],
  militarySoldiers = [],
  vehicles = [],
  notifications,
  isAiming,
  isReloading,
  isMuted,
  onToggleMute,
  onOpenMenu,
  onOpenMainMenu,
  onOpenCases,
  cloudSyncStatus = 'synced',
  onToggleFullscreen,
  timeOfDay = 'day',
  onToggleTimeOfDay,
  nearbyBuildingEntrance,
  nearbyInteriorInteractable,
  activeInterior,
  onExitBuilding,
  damageFlash = false,
  onOpenDualIdentity,
  offDutyTracking = 'precinct',
  onToggleOffDutyTracking,
  onOpenGuide,
  nearbyEvidence,
  onCollectEvidence,
}) => {
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  // Listen for 'H' key to toggle tactical mission journal / hint drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !e.repeat) {
        setIsJournalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Current district / faction territory
  const currentTerritory = getTerritoryAtCoordinates(playerPos.x, playerPos.z);

  // Determine active objective or fallback activity destination
  const activeObjective = currentMission?.objectives.find((o) => !o.isCompleted);
  
  let effectiveTargetPos: { x: number; y: number; z: number };
  let effectiveLabel: string;
  let effectiveCategory: 'mission' | 'incident' | 'duty' | 'home';
  let effectiveHint: string;

  if (activeIncidentObjective?.position) {
    effectiveTargetPos = activeIncidentObjective.position;
    effectiveLabel = `911 DISPATCH: ${activeIncidentObjective.title.replace(/^10-\d+:\s*/, '')} (${activeIncidentObjective.locationName})`;
    effectiveCategory = 'incident';
    effectiveHint = 'Follow waypoint to the incident scene. Neutralize threat or assist civilians.';
  } else if (activeObjective?.targetPos) {
    effectiveTargetPos = activeObjective.targetPos;
    effectiveLabel = `${currentMission?.title || 'MISSION'}: ${activeObjective.description}${
      activeObjective.requiredCount > 1 ? ` (${activeObjective.currentCount}/${activeObjective.requiredCount})` : ''
    }`;
    effectiveCategory = 'mission';
    effectiveHint = activeObjective.hint || 'Follow the golden beacon beam to reach your destination.';
  } else if (offDutyTracking === 'house') {
    effectiveTargetPos = { x: -52, y: 0.22, z: -52 };
    effectiveLabel = "CARTER'S RESIDENCE: Rest in Bed, Wardrobe & Save";
    effectiveCategory = 'home';
    effectiveHint = "Rest in bed to advance time, change uniforms in wardrobe, or save your career at the desk.";
  } else {
    effectiveTargetPos = { x: -45, y: 0.22, z: 28 };
    effectiveLabel = "PRECINCT 9 HEADQUARTERS: Report for Duty";
    effectiveCategory = 'duty';
    effectiveHint = "Report to the precinct station to sign in for duty dispatch or collect equipment.";
  }

  const distToTarget = Math.round(
    Math.hypot(effectiveTargetPos.x - playerPos.x, effectiveTargetPos.z - playerPos.z)
  );

  // Direction calculation relative to Carter's facing yaw:
  const dx = effectiveTargetPos.x - playerPos.x;
  const dz = effectiveTargetPos.z - playerPos.z;
  const targetAngle = Math.atan2(dx, dz);
  let relAngle = targetAngle - playerYaw;
  while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
  while (relAngle < -Math.PI) relAngle += 2 * Math.PI;

  let turnDirection: 'forward' | 'right' | 'left' | 'behind' = 'forward';
  let turnText = 'AHEAD';
  if (Math.abs(relAngle) < 0.38) {
    turnDirection = 'forward';
    turnText = 'AHEAD';
  } else if (relAngle >= 0.38 && relAngle < 1.95) {
    turnDirection = 'right';
    turnText = 'RIGHT';
  } else if (relAngle <= -0.38 && relAngle > -1.95) {
    turnDirection = 'left';
    turnText = 'LEFT';
  } else {
    turnDirection = 'behind';
    turnText = 'BEHIND';
  }

  // Latest notification for small temporary comms/dialogue toast at top-center
  const latestNotification = notifications.length > 0 ? notifications[notifications.length - 1] : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Inter',sans-serif]">
      {/* Low Health Red Vignette Overlay */}
      {stats.health < 35 && (
        <div className="absolute inset-0 bg-radial from-transparent via-red-950/20 to-red-600/35 animate-pulse pointer-events-none" />
      )}

      {/* TOP HUD CONTAINER: Responsive landscape layout with safe area insets */}
      <div className="absolute top-0 left-0 right-0 pt-[max(6px,env(safe-area-inset-top))] px-[max(10px,env(safe-area-inset-left))] pr-[max(10px,env(safe-area-inset-right))] flex items-start justify-between z-40 pointer-events-none">
        
        {/* ============================================================ */}
        {/* TOP-LEFT: PLAYER NAME, HEALTH/ARMOR, RANK & LEVEL            */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1 pointer-events-auto max-w-[210px] sm:max-w-xs">
          {/* Header Row: Officer Name & Rank / Level */}
          <div className="flex items-center gap-1.5">
            <div className="bg-slate-950/80 border border-blue-500/40 shadow-sm px-2 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="font-['Chakra_Petch'] font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-100">
                OFFICER CARTER
              </span>
              <span className="text-slate-600 text-[10px]">|</span>
              <span className="text-blue-400 font-semibold text-[9px] sm:text-[10px] font-mono">
                {stats.rankName} (LVL {stats.rank})
              </span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <div
              className={`p-1 rounded-lg backdrop-blur-md border text-[9px] font-mono shadow-sm transition-colors ${
                cloudSyncStatus === 'saving'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  : cloudSyncStatus === 'offline'
                  ? 'bg-slate-900/80 border-slate-700/60 text-slate-500'
                  : 'bg-slate-950/80 border-cyan-500/30 text-cyan-400'
              }`}
              title={cloudSyncStatus === 'saving' ? 'Syncing...' : 'Cloud Synced'}
            >
              {cloudSyncStatus === 'saving' ? (
                <RotateCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              ) : (
                <Cloud className="w-2.5 h-2.5" />
              )}
            </div>
          </div>

          {/* Health & Armor Bars */}
          <div className="flex flex-col gap-1 w-36 sm:w-44 bg-slate-950/75 p-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md shadow-md">
            {/* Health Bar */}
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500 shrink-0" />
              <div className="flex-1 bg-slate-900 rounded-sm h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  style={{ width: `${Math.max(0, (stats.health / stats.maxHealth) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-300 w-5 text-right">
                {Math.round(stats.health)}
              </span>
            </div>

            {/* Armor Bar */}
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400 shrink-0" />
              <div className="flex-1 bg-slate-900 rounded-sm h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300 shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                  style={{ width: `${Math.max(0, (stats.armor / stats.maxArmor) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-300 w-5 text-right">
                {Math.round(stats.armor)}
              </span>
            </div>

            {/* Officer Carter Double-Life Reputations Micro-Row */}
            <button
              onClick={onOpenDualIdentity}
              className="w-full flex items-center justify-between pt-1 border-t border-slate-800/80 text-[8px] font-mono hover:bg-slate-900/60 rounded px-0.5 py-0.5 transition-colors cursor-pointer group text-left"
              title="Tap to inspect Officer Carter's Dual Identity Dossier & Underground Opportunities"
            >
              <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:text-blue-300" title="Official Police Standing">
                POLICE {stats.policeReputation ?? stats.reputation}%
              </span>
              <span className="text-purple-400 font-bold flex items-center gap-0.5 group-hover:text-purple-300" title="Criminal Underworld Trust">
                CRIME {stats.underworldReputation ?? 15}%
              </span>
              <span
                className={`font-bold flex items-center gap-0.5 ${(stats.suspicionLevel ?? 10) >= 50 ? 'text-red-400 animate-pulse' : 'text-amber-400 group-hover:text-amber-300'}`}
                title="Internal Affairs Suspicion Level"
              >
                HEAT {stats.suspicionLevel ?? 10}%
              </span>
            </button>
          </div>

          {/* Wanted Level Stars (if active) */}
          {stats.wantedLevel > 0 && (
            <div className="flex items-center gap-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded-md border border-red-500/50 w-fit backdrop-blur-md">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-2.5 h-2.5 ${
                    stats.wantedLevel >= star
                      ? 'text-yellow-400 fill-yellow-400 animate-pulse'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TOP-CENTER: SMART GUIDANCE HEADER, WAYPOINT BEARING & JOURNAL */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[240px] sm:max-w-md md:max-w-lg pointer-events-auto min-w-0 mx-1 sm:mx-2">
          {/* Smart Waypoint & Guidance Header Pill */}
          <div
            onClick={() => setIsJournalOpen((prev) => !prev)}
            className={`w-full group cursor-pointer bg-slate-950/90 rounded-2xl px-2.5 sm:px-3.5 py-1.5 backdrop-blur-md flex items-center justify-between gap-2 shadow-lg transition-all duration-200 border ${
              effectiveCategory === 'incident'
                ? 'border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:border-red-400'
                : effectiveCategory === 'mission'
                ? 'border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400'
                : effectiveCategory === 'home'
                ? 'border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:border-cyan-400'
                : 'border-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:border-blue-400'
            }`}
            title="Tap to toggle tactical mission journal and hints (or press H)"
          >
            {/* Direction Bearing Indicator Icon */}
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                turnDirection === 'forward'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 animate-pulse'
                  : turnDirection === 'behind'
                  ? 'bg-red-500/20 border-red-400/50 text-red-400'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-400'
              }`}
            >
              {turnDirection === 'forward' && <ArrowUp className="w-3.5 h-3.5" />}
              {turnDirection === 'right' && <ArrowRight className="w-3.5 h-3.5" />}
              {turnDirection === 'left' && <ArrowLeft className="w-3.5 h-3.5" />}
              {turnDirection === 'behind' && <ArrowDown className="w-3.5 h-3.5" />}
            </div>

            {/* Objective Text & Distance */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span
                  className={`text-[8px] sm:text-[9px] font-['Chakra_Petch'] font-bold px-1.5 py-0.2 rounded uppercase ${
                    effectiveCategory === 'incident'
                      ? 'bg-red-950 text-red-300 border border-red-700/60'
                      : effectiveCategory === 'mission'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      : effectiveCategory === 'home'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                      : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                  }`}
                >
                  {turnText} · {distToTarget}M
                </span>
                <span className="text-[10px] sm:text-xs font-['Chakra_Petch'] font-bold text-slate-100 uppercase tracking-wide truncate">
                  {activeInterior ? `INSIDE: ${activeInterior.building.name}` : effectiveLabel}
                </span>
              </div>
            </div>

            {/* Journal Expand Chevron */}
            <div className="text-slate-400 group-hover:text-slate-200 transition-colors shrink-0">
              {isJournalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* EXPANDABLE MISSION JOURNAL & TACTICAL HINT DRAWER */}
          {isJournalOpen && (
            <div className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2 duration-150 text-left space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-['Chakra_Petch'] font-bold uppercase text-slate-200 tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tactical Guidance & Mission Journal</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  PRESS [H] TO TOGGLE
                </span>
              </div>

              {/* Active Mission Objectives Checklist */}
              {currentMission ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-['Chakra_Petch'] font-bold text-amber-300 flex items-center justify-between">
                    <span>{currentMission.title}</span>
                    <span className="text-[9px] font-mono text-slate-400">CH {currentMission.chapter}</span>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {currentMission.objectives.map((obj) => (
                      <div
                        key={obj.id}
                        className={`text-[10px] flex items-start gap-1.5 p-1 rounded ${
                          obj.isCompleted ? 'bg-emerald-950/30 text-emerald-300' : 'bg-slate-900/60 text-slate-200'
                        }`}
                      >
                        {obj.isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <span className="flex-1">
                          {obj.description}
                          {obj.requiredCount > 1 && (
                            <strong className="ml-1 text-amber-300">
                              ({obj.currentCount}/{obj.requiredCount})
                            </strong>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 space-y-1">
                  <div className="font-['Chakra_Petch'] font-bold text-blue-300 uppercase">
                    Off-Duty Patrol Activities
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    No active campaign mission. You can report to Precinct 9 for assignment dispatch or head to Carter's Residence to sleep, change uniform, and save progress.
                  </p>
                </div>
              )}

              {/* Contextual Tactical Field Hint */}
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-2 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-200/90 leading-tight">
                  <strong className="text-amber-400 font-['Chakra_Petch'] uppercase block">Tactical Hint:</strong>
                  {effectiveHint}
                </div>
              </div>

              {/* Quick Navigation Destination Trackers */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => onToggleOffDutyTracking?.('precinct')}
                  className={`py-1.5 px-2 rounded-xl text-[9px] font-['Chakra_Petch'] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border transition-all ${
                    effectiveCategory === 'duty'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>Track Precinct 9</span>
                </button>

                <button
                  onClick={() => onToggleOffDutyTracking?.('house')}
                  className={`py-1.5 px-2 rounded-xl text-[9px] font-['Chakra_Petch'] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border transition-all ${
                    effectiveCategory === 'home'
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <Home className="w-3 h-3 text-cyan-400" />
                  <span>Track Carter's Home</span>
                </button>
              </div>

              {/* Controls & Full Dossier Links */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setIsJournalOpen(false);
                    onOpenMenu();
                  }}
                  className="text-[9px] font-['Chakra_Petch'] font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1"
                >
                  <span>Open Missions Dossier</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                {onOpenGuide && (
                  <button
                    onClick={() => {
                      setIsJournalOpen(false);
                      onOpenGuide();
                    }}
                    className="text-[9px] font-['Chakra_Petch'] font-bold text-cyan-400 hover:text-cyan-300 uppercase flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Controls Guide</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Small Temporary Comms / Radio Dialogue Toast (Auto-disappears) */}
          {latestNotification && (
            <div
              key={latestNotification.id}
              className={`px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium backdrop-blur-md border shadow animate-in fade-in slide-in-from-top-1 duration-200 truncate max-w-full flex items-center gap-1.5 ${
                latestNotification.type === 'alert'
                  ? 'bg-red-950/85 text-red-200 border-red-700/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : latestNotification.type === 'success'
                  ? 'bg-emerald-950/85 text-emerald-200 border-emerald-700/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950/80 text-blue-200 border-blue-500/40'
              }`}
            >
              <Radio className="w-2.5 h-2.5 shrink-0 text-blue-400" />
              <span className="truncate">{latestNotification.text}</span>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TOP-RIGHT: MINIMAP / RADAR, AMMO, CASH & QUICK ACTIONS       */}
        {/* ============================================================ */}
        <div className="flex flex-col items-end gap-1 pointer-events-auto shrink-0 max-w-[48%] sm:max-w-xs">
          {/* Cash & Quick Actions Row */}
          <div className="flex items-center gap-1 justify-end max-w-full">
            {/* Cash Counter */}
            <div
              className="bg-slate-950/85 border border-emerald-500/40 px-2 py-0.5 rounded-lg backdrop-blur-md font-mono text-emerald-400 font-bold text-[11px] sm:text-xs shadow-sm shrink-0"
              title="Official Wallet Funds"
            >
              ${stats.money.toLocaleString()}
            </div>

            {/* Dirty Cash Badge (if Carter holds off-the-record street cash) */}
            {(stats.dirtyCash ?? 0) > 0 && (
              <div
                className="bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 rounded-lg backdrop-blur-md font-mono text-amber-300 font-bold text-[9px] sm:text-[10px] shadow-sm shrink-0 flex items-center gap-0.5"
                title="Unlaundered Dirty Cash (Subject to IA Seizure)"
              >
                <span>+${(stats.dirtyCash ?? 0).toLocaleString()}</span>
                <span className="text-[7px] text-amber-400 font-['Chakra_Petch'] uppercase font-bold">DIRTY</span>
              </div>
            )}

            {/* Quick action buttons cluster */}
            <div className="flex items-center gap-0.5 bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg backdrop-blur-md shrink-0">
              {cityIncidentManager.activeIncidents.length > 0 && (
                <button
                  onClick={onOpenMenu}
                  className="hover:bg-slate-800 text-red-400 p-1 rounded transition-colors flex items-center gap-0.5"
                  title="City Dispatch & Incidents"
                >
                  <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                  <span className="font-mono text-[9px] font-bold text-red-300">
                    {cityIncidentManager.activeIncidents.length}
                  </span>
                </button>
              )}

              {onOpenDualIdentity && (
                <button
                  onClick={onOpenDualIdentity}
                  className="hover:bg-slate-800 text-purple-300 hover:text-purple-200 p-1 rounded transition-colors flex items-center"
                  title="Carter's Dual Identity Dossier"
                >
                  <Scale className="w-3 h-3 text-purple-400" />
                </button>
              )}

              {onOpenCases && (
                <button
                  onClick={onOpenCases}
                  className="hover:bg-slate-800 text-slate-300 p-1 rounded transition-colors"
                  title="Forensic Cases"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                </button>
              )}

              <button
                onClick={onToggleMute}
                className="hover:bg-slate-800 text-slate-300 p-1 rounded transition-colors"
                title="Audio Toggle"
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
              </button>

              {onToggleTimeOfDay && (
                <button
                  onClick={onToggleTimeOfDay}
                  className="hover:bg-slate-800 text-slate-300 p-1 rounded transition-colors hidden sm:flex"
                  title={`Time of Day: ${timeOfDay.toUpperCase()} (Tap to cycle)`}
                >
                  {timeOfDay === 'day' ? (
                    <Sun className="w-3 h-3 text-amber-400" />
                  ) : timeOfDay === 'sunset' ? (
                    <Sun className="w-3 h-3 text-orange-400" />
                  ) : (
                    <Moon className="w-3 h-3 text-blue-300" />
                  )}
                </button>
              )}

              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="hover:bg-slate-800 text-slate-300 p-1 rounded transition-colors hidden md:flex"
                  title="Toggle Fullscreen"
                >
                  <Maximize className="w-3 h-3 text-cyan-400" />
                </button>
              )}
            </div>

            <button
              onClick={onOpenMenu}
              className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 font-['Chakra_Petch'] font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg backdrop-blur-md shadow flex items-center gap-1 transition-colors shrink-0"
              title="Tactical Dossier"
            >
              <Menu className="w-3 h-3" />
              <span>DOSSIER</span>
            </button>
          </div>

          {/* Minimap & Ammo Horizontal Dock */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Ammo Counter Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 backdrop-blur-md shadow text-right min-w-[65px] sm:min-w-[75px] shrink-0">
              <div className="font-['Chakra_Petch'] text-[9px] font-bold text-slate-400 uppercase leading-none truncate max-w-[70px] sm:max-w-[80px]">
                {currentWeapon.name}
              </div>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="font-mono text-sm font-black text-cyan-300 leading-none">
                  {currentWeapon.currentAmmo}
                </span>
                <span className="font-mono text-[9px] text-slate-500 font-bold leading-none">
                  /{currentWeapon.reserveAmmo}
                </span>
              </div>
              {isReloading && (
                <div className="text-[8px] text-yellow-400 font-mono font-bold leading-none mt-0.5 animate-pulse">
                  RELOAD
                </div>
              )}
            </div>

            {/* Circular Tactical Radar / Minimap */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-blue-500/50 bg-slate-950/85 overflow-hidden shadow-[0_0_14px_rgba(30,58,138,0.5)] backdrop-blur-md shrink-0">
              {/* Radar Grid Crosshairs */}
              <div className="absolute inset-0 border-b border-blue-900/40 top-1/2 -translate-y-1/2" />
              <div className="absolute inset-0 border-r border-blue-900/40 left-1/2 -translate-x-1/2" />
              <div className="absolute inset-2 rounded-full border border-blue-900/30" />

              {/* Compass Cardinal Point */}
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-blue-400">N</span>

              {/* Sweeper beam */}
              <div className="absolute inset-0 bg-conic-sweep from-transparent via-blue-500/10 to-blue-400/25 animate-spin duration-3000 pointer-events-none" />

              {/* Enemies */}
              {enemies.map((e) => {
                if (e.state === 'dead' || e.state === 'arrested') return null;
                const relX = ((e.position.x - playerPos.x) / 80) * 35;
                const relZ = ((e.position.z - playerPos.z) / 80) * 35;
                const clampedX = Math.max(-30, Math.min(30, relX));
                const clampedZ = Math.max(-30, Math.min(30, relZ));

                let markerClass = 'bg-red-500 ring-1 ring-red-400';
                if (e.state === 'surrendered') markerClass = 'bg-yellow-400 ring-1 ring-yellow-300';
                else if (e.type === 'boss') markerClass = 'bg-purple-500 ring-1 ring-purple-300 shadow-[0_0_6px_#a855f7]';

                return (
                  <div
                    key={e.id}
                    className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${markerClass}`}
                    style={{ left: `${50 + clampedX}%`, top: `${50 + clampedZ}%` }}
                  />
                );
              })}

              {/* Police NPCs */}
              {policeNPCs.map((p) => {
                if (p.health <= 0) return null;
                const relX = ((p.position.x - playerPos.x) / 80) * 35;
                const relZ = ((p.position.z - playerPos.z) / 80) * 35;
                return (
                  <div
                    key={p.id}
                    className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 ring-1 ring-cyan-200"
                    style={{ left: `${50 + Math.max(-30, Math.min(30, relX))}%`, top: `${50 + Math.max(-30, Math.min(30, relZ))}%` }}
                  />
                );
              })}

              {/* Civilians */}
              {civilians.map((c) => {
                const relX = ((c.position.x - playerPos.x) / 80) * 35;
                const relZ = ((c.position.z - playerPos.z) / 80) * 35;
                return (
                  <div
                    key={c.id}
                    className="absolute w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 opacity-80"
                    style={{ left: `${50 + Math.max(-30, Math.min(30, relX))}%`, top: `${50 + Math.max(-30, Math.min(30, relZ))}%` }}
                  />
                );
              })}

              {/* Objective Waypoint Diamond */}
              {effectiveTargetPos && (
                <div
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 border border-slate-950 rounded-sm rotate-45 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  style={{
                    left: `${50 + Math.max(-30, Math.min(30, ((effectiveTargetPos.x - playerPos.x) / 80) * 35))}%`,
                    top: `${50 + Math.max(-30, Math.min(30, ((effectiveTargetPos.z - playerPos.z) / 80) * 35))}%`,
                  }}
                />
              )}

              {/* Center Player Blip */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.9)]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${180 - (playerYaw * 180) / Math.PI}deg)`,
                }}
              />
            </div>
          </div>

          {/* Territory indicator tag / Building interior tag */}
          {activeInterior ? (
            <div className="px-1.5 py-0.2 rounded text-[8px] font-['Chakra_Petch'] font-bold tracking-wider uppercase backdrop-blur-md shadow flex items-center gap-1 truncate max-w-[140px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/50">
              <Home className="w-2 h-2 shrink-0 text-emerald-400" />
              <span className="truncate">{activeInterior.building.name}</span>
            </div>
          ) : (
            <div
              className={`px-1.5 py-0.2 rounded text-[8px] font-['Chakra_Petch'] font-bold tracking-wider uppercase backdrop-blur-md shadow flex items-center gap-1 truncate max-w-[120px] ${currentTerritory.badgeBg}`}
            >
              <Compass className="w-2 h-2 shrink-0" />
              <span className="truncate">{currentTerritory.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* CENTER CROSSHAIR / RETICLE */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {isAiming ? (
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute -top-2.5 w-0.5 h-1.5 bg-cyan-400/90" />
            <div className="absolute -bottom-2.5 w-0.5 h-1.5 bg-cyan-400/90" />
            <div className="absolute -left-2.5 h-0.5 w-1.5 bg-cyan-400/90" />
            <div className="absolute -right-2.5 h-0.5 w-1.5 bg-cyan-400/90" />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_3px_rgba(255,255,255,0.7)]" />
        )}
      </div>

      {/* VEHICLE SPEEDOMETER (If driving cruiser) */}
      {currentVehicle && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-blue-500/50 rounded-full pl-3 pr-1.5 py-1 backdrop-blur-md shadow-xl flex items-center gap-2 pointer-events-auto z-20">
          <span className="text-[10px] font-['Chakra_Petch'] font-bold text-slate-200">
            {Math.round(currentVehicle.speed * 3.6)} KM/H
          </span>
          {currentVehicle.isSirenOn && (
            <span className="bg-red-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow">
              SIREN
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExitVehicle?.();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onExitVehicle?.();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onExitVehicle?.();
            }}
            className="ml-1 bg-red-600/95 hover:bg-red-500 active:scale-95 text-white font-['Chakra_Petch'] text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.6)] cursor-pointer transition-transform"
            title="Exit Vehicle [E]"
          >
            <LogOut className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>EXIT [E]</span>
          </button>
        </div>
      )}

      {/* ENTERABLE BUILDING PROMPT BANNER */}
      {nearbyBuildingEntrance && !currentVehicle && (
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 bg-slate-950/90 border-2 border-emerald-400/90 rounded-2xl px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(16,185,129,0.5)] flex items-center gap-3 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 max-w-[90vw]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-['Chakra_Petch'] font-bold uppercase text-emerald-400 tracking-wider">
              ENTER BUILDING
            </div>
            <div className="text-xs sm:text-sm font-['Chakra_Petch'] font-bold text-slate-100 uppercase tracking-wide truncate max-w-[200px] sm:max-w-[320px]">
              {nearbyBuildingEntrance.name}
            </div>
          </div>
          <span className="ml-1 sm:ml-2 font-mono text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg shadow shrink-0">
            [E]
          </span>
        </div>
      )}

      {/* INTERIOR INTERACTION PROMPT BANNER */}
      {nearbyInteriorInteractable && (
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 bg-slate-950/90 border-2 border-amber-400/90 rounded-2xl px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(251,191,36,0.5)] flex items-center gap-3 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 max-w-[90vw]">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-['Chakra_Petch'] font-bold uppercase text-amber-400 tracking-wider">
              {nearbyInteriorInteractable.type === 'exit_door' ? 'EXIT TO STREET' : 'INTERIOR INTERACTION'}
            </div>
            <div className="text-xs sm:text-sm font-['Chakra_Petch'] font-bold text-slate-100 uppercase tracking-wide truncate max-w-[200px] sm:max-w-[320px]">
              {nearbyInteriorInteractable.prompt}
            </div>
          </div>
          <span className="ml-1 sm:ml-2 font-mono text-[11px] font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg shadow shrink-0">
            [E]
          </span>
        </div>
      )}

      {/* FORENSIC EVIDENCE COLLECTION PROMPT BANNER */}
      {nearbyEvidence && !nearbyEvidence.collected && (
        <div
          onClick={onCollectEvidence}
          className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-cyan-400/90 rounded-2xl px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(6,182,212,0.6)] flex items-center gap-3 pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 max-w-[90vw] hover:bg-slate-900 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-['Chakra_Petch'] font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
              <span>FORENSIC EVIDENCE IN RANGE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-xs sm:text-sm font-['Chakra_Petch'] font-bold text-slate-100 uppercase tracking-wide truncate max-w-[200px] sm:max-w-[320px]">
              {nearbyEvidence.title}
            </div>
          </div>
          <span className="ml-1 sm:ml-2 font-mono text-[11px] font-bold bg-cyan-500 text-slate-950 px-2.5 py-1 rounded-lg shadow shrink-0">
            SECURE [E]
          </span>
        </div>
      )}

      {/* TACTICAL DAMAGE FLASH & LOW HEALTH VIGNETTE */}
      {damageFlash && (
        <div className="absolute inset-0 pointer-events-none bg-red-600/35 border-[6px] border-red-500/80 shadow-[inset_0_0_90px_rgba(239,68,68,0.7)] animate-out fade-out duration-250 z-50 transition-opacity" />
      )}
      {stats.health <= 35 && stats.health > 0 && (
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(239,68,68,0.45)] animate-pulse z-40 transition-opacity" />
      )}
    </div>
  );
};
