import React from 'react';
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
} from '../types/game';
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
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  currentMission,
  activeIncidentObjective,
  currentVehicle,
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
}) => {
  // Current district / faction territory
  const currentTerritory = getTerritoryAtCoordinates(playerPos.x, playerPos.z);
  // Distance to current mission objective or active 911 incident
  const activeObjective = currentMission?.objectives.find((o) => !o.isCompleted);
  const targetPos = activeIncidentObjective?.position || activeObjective?.targetPos;
  const distToTarget = targetPos
    ? Math.round(Math.hypot(targetPos.x - playerPos.x, targetPos.z - playerPos.z))
    : 50;

  const objectiveText = activeIncidentObjective
    ? `${activeIncidentObjective.title.replace(/^10-\d+:\s*/, '')} (${activeIncidentObjective.locationName})`
    : activeObjective?.description || 'Patrol the city streets';

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
        {/* TOP-CENTER: CURRENT MISSION / OBJECTIVE & DISTANCE          */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[200px] sm:max-w-xs md:max-w-md pointer-events-auto min-w-0 mx-1 sm:mx-2">
          {/* Mission Objective Pill Banner */}
          <div className="bg-slate-950/85 border border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.25)] rounded-full px-2.5 sm:px-3 py-1 backdrop-blur-md flex items-center gap-1.5 text-center max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-['Chakra_Petch'] font-bold text-[9px] sm:text-xs uppercase tracking-wider text-amber-300 truncate">
              {distToTarget}M · {objectiveText}
            </span>
          </div>

          {/* Small Temporary Comms / Radio Dialogue Toast (Auto-disappears) */}
          {latestNotification && (
            <div
              key={latestNotification.id}
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium backdrop-blur-md border shadow animate-in fade-in slide-in-from-top-1 duration-200 truncate max-w-full flex items-center gap-1.5 ${
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
            <div className="bg-slate-950/85 border border-emerald-500/40 px-2 py-0.5 rounded-lg backdrop-blur-md font-mono text-emerald-400 font-bold text-[11px] sm:text-xs shadow-sm shrink-0">
              ${stats.money.toLocaleString()}
            </div>

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
              {targetPos && (
                <div
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 border border-slate-950 rounded-sm rotate-45 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  style={{
                    left: `${50 + Math.max(-30, Math.min(30, ((targetPos.x - playerPos.x) / 80) * 35))}%`,
                    top: `${50 + Math.max(-30, Math.min(30, ((targetPos.z - playerPos.z) / 80) * 35))}%`,
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

          {/* Territory indicator tag */}
          <div
            className={`px-1.5 py-0.2 rounded text-[8px] font-['Chakra_Petch'] font-bold tracking-wider uppercase backdrop-blur-md shadow flex items-center gap-1 truncate max-w-[120px] ${currentTerritory.badgeBg}`}
          >
            <Compass className="w-2 h-2 shrink-0" />
            <span className="truncate">{currentTerritory.name}</span>
          </div>
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
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-blue-500/40 rounded-full px-3 py-1 backdrop-blur-md shadow-lg flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-['Chakra_Petch'] font-bold text-slate-300">
            {Math.round(currentVehicle.speed * 3.6)} KM/H
          </span>
          {currentVehicle.isSirenOn && (
            <span className="bg-red-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow">
              SIREN
            </span>
          )}
        </div>
      )}
    </div>
  );
};
