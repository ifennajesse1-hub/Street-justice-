import React from 'react';
import {
  Shield,
  Heart,
  Crosshair,
  Radio,
  Star,
  Car,
  RotateCw,
  Volume2,
  VolumeX,
  Menu,
  Flashlight,
  Camera,
  FileText,
  Home,
  Compass,
} from 'lucide-react';
import { PlayerStats, WeaponConfig, Mission, VehicleEntity, EnemyEntity, CivilianEntity, PoliceNPCEntity } from '../types/game';

interface HUDProps {
  stats: PlayerStats;
  currentWeapon: WeaponConfig;
  currentMission?: Mission;
  currentVehicle?: VehicleEntity;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  enemies: EnemyEntity[];
  civilians?: CivilianEntity[];
  policeNPCs?: PoliceNPCEntity[];
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
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  currentMission,
  currentVehicle,
  playerPos,
  playerYaw,
  enemies,
  civilians = [],
  policeNPCs = [],
  notifications,
  isAiming,
  isReloading,
  isMuted,
  onToggleMute,
  onOpenMenu,
  onOpenMainMenu,
  onOpenCases,
  isFlashlightOn = false,
  onToggleFlashlight,
  onToggleCamera,
}) => {
  // Distance to current mission objective
  const activeObjective = currentMission?.objectives.find((o) => !o.isCompleted);
  const targetPos = activeObjective?.targetPos;
  const distToTarget = targetPos
    ? Math.round(Math.hypot(targetPos.x - playerPos.x, targetPos.z - playerPos.z))
    : 50;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Inter',sans-serif]">
      {/* Low Health Vignette Overlay */}
      {stats.health < 35 && (
        <div className="absolute inset-0 bg-radial from-transparent via-red-950/20 to-red-600/35 animate-pulse pointer-events-none" />
      )}

      {/* TOP-CENTER: EXACT OBJECTIVE BANNER REQUESTED BY USER */}
      <div className="absolute top-2.5 sm:top-3.5 left-1/2 -translate-x-1/2 z-30 max-w-[94%] sm:max-w-lg w-auto bg-slate-950/80 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] rounded-full px-4 py-1.5 backdrop-blur-md flex items-center gap-2 pointer-events-auto">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
        <span className="font-['Chakra_Petch'] font-bold text-[11px] sm:text-xs uppercase tracking-wider text-amber-300 truncate">
          OBJECTIVE • {distToTarget}M — {activeObjective?.description || 'Patrol to the commercial alleyway.'}
        </span>
      </div>

      {/* TOP BAR CONTAINER */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-start justify-between z-20">
        {/* TOP-LEFT: OFFICER STATUS (Health, Armor, Cash, Rank) */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Officer identity & bank badge */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)] px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="font-['Chakra_Petch'] font-bold text-[11px] uppercase tracking-wider text-slate-100">
                OFFICER CARTER
              </span>
              <span className="text-slate-600 text-xs">|</span>
              <span className="text-blue-400 font-semibold text-[10px] font-mono">
                {stats.rankName} (LVL {stats.rank})
              </span>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/40 px-2 py-1 rounded-xl backdrop-blur-md font-mono text-emerald-400 font-bold text-xs shadow-sm">
              ${stats.money.toLocaleString()}
            </div>
          </div>

          {/* Health & Armor Tactical Segmented Bars */}
          <div className="flex flex-col gap-1 w-44 sm:w-52 bg-slate-950/80 p-2 rounded-xl border border-slate-800/90 backdrop-blur-md shadow-lg">
            {/* Health Bar */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <div className="flex-1 bg-slate-900 rounded-sm h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  style={{ width: `${Math.max(0, (stats.health / stats.maxHealth) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300 w-6 text-right">
                {Math.round(stats.health)}
              </span>
            </div>

            {/* Armor Bar */}
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="flex-1 bg-slate-900 rounded-sm h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                  style={{ width: `${Math.max(0, (stats.armor / stats.maxArmor) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300 w-6 text-right">
                {Math.round(stats.armor)}
              </span>
            </div>
          </div>

          {/* Wanted Stars (if any) */}
          {stats.wantedLevel > 0 && (
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-red-500/50 w-fit backdrop-blur-md">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    stats.wantedLevel >= star
                      ? 'text-yellow-400 fill-yellow-400 animate-pulse'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: TACTICAL RADAR / MINIMAP & QUICK MENU */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Quick Menu Icons Strip */}
          <div className="flex items-center gap-1">
            {onOpenMainMenu && (
              <button
                onClick={onOpenMainMenu}
                className="bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 p-1.5 rounded-lg backdrop-blur-md shadow transition-colors"
                title="Main Menu"
              >
                <Home className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}

            {onOpenCases && (
              <button
                onClick={onOpenCases}
                className="bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 p-1.5 rounded-lg backdrop-blur-md shadow transition-colors"
                title="Forensic Cases"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            <button
              onClick={onToggleMute}
              className="bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 p-1.5 rounded-lg backdrop-blur-md shadow transition-colors"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={onOpenMenu}
              className="bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400 font-['Chakra_Petch'] font-bold text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-md shadow-[0_0_12px_rgba(59,130,246,0.4)] flex items-center gap-1 transition-colors"
            >
              <Menu className="w-3 h-3" />
              <span>DOSSIER</span>
            </button>
          </div>

          {/* SMALL TACTICAL CIRCULAR MINIMAP/RADAR */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-blue-500/50 bg-slate-950/80 overflow-hidden shadow-[0_0_16px_rgba(30,58,138,0.5)] backdrop-blur-md">
            {/* Grid Crosshairs */}
            <div className="absolute inset-0 border-b border-blue-900/40 top-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-r border-blue-900/40 left-1/2 -translate-x-1/2" />
            <div className="absolute inset-2.5 rounded-full border border-blue-900/30" />

            {/* Compass markings */}
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-blue-400">N</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500">S</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-slate-500">E</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-slate-500">W</span>

            {/* Radar Sweeper beam */}
            <div className="absolute inset-0 bg-conic-sweep from-transparent via-blue-500/10 to-blue-400/30 animate-spin duration-3000 pointer-events-none" />

            {/* Nearby NPCs / Enemies */}
            {enemies.map((e) => {
              if (e.state === 'dead' || e.state === 'arrested') return null;
              const relX = ((e.position.x - playerPos.x) / 80) * 45;
              const relZ = ((e.position.z - playerPos.z) / 80) * 45;
              const clampedX = Math.max(-38, Math.min(38, relX));
              const clampedZ = Math.max(-38, Math.min(38, relZ));

              return (
                <div
                  key={e.id}
                  className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    e.state === 'surrendered'
                      ? 'bg-yellow-400 ring-1 ring-yellow-300'
                      : e.type === 'boss'
                      ? 'bg-purple-500 ring-2 ring-purple-400'
                      : 'bg-red-500 ring-1 ring-red-400'
                  }`}
                  style={{
                    left: `${50 + clampedX}%`,
                    top: `${50 + clampedZ}%`,
                  }}
                />
              );
            })}

            {/* Nearby Police Officer NPCs (Tactical Cyan/Blue Markers) */}
            {policeNPCs.map((p) => {
              if (p.health <= 0) return null;
              const relX = ((p.position.x - playerPos.x) / 80) * 45;
              const relZ = ((p.position.z - playerPos.z) / 80) * 45;
              const clampedX = Math.max(-38, Math.min(38, relX));
              const clampedZ = Math.max(-38, Math.min(38, relZ));

              return (
                <div
                  key={p.id}
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 ring-1 ring-cyan-200 shadow-[0_0_6px_#38bdf8] flex items-center justify-center"
                  style={{
                    left: `${50 + clampedX}%`,
                    top: `${50 + clampedZ}%`,
                  }}
                  title={`${p.name} (#${p.badgeNumber})`}
                >
                  <div className="w-0.5 h-0.5 bg-white rounded-full" />
                </div>
              );
            })}

            {/* Nearby Civilians / Pedestrians */}
            {civilians.map((c) => {
              const relX = ((c.position.x - playerPos.x) / 80) * 45;
              const relZ = ((c.position.z - playerPos.z) / 80) * 45;
              const clampedX = Math.max(-38, Math.min(38, relX));
              const clampedZ = Math.max(-38, Math.min(38, relZ));

              const isPanicked = c.state === 'panicking' || c.state === 'cowering';

              return (
                <div
                  key={c.id}
                  className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isPanicked
                      ? 'bg-amber-400 ring-1 ring-amber-300 shadow-[0_0_5px_#f59e0b]'
                      : 'bg-emerald-400 ring-1 ring-emerald-300 shadow-[0_0_4px_#34d399]'
                  }`}
                  style={{
                    left: `${50 + clampedX}%`,
                    top: `${50 + clampedZ}%`,
                  }}
                  title={`${c.name || 'Pedestrian'} (${c.state})`}
                />
              );
            })}

            {/* Mission Objective Diamond Waypoint */}
            {targetPos && (
              <div
                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-amber-400 border border-slate-950 rounded-sm rotate-45 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"
                style={{
                  left: `${50 + Math.max(-38, Math.min(38, ((targetPos.x - playerPos.x) / 80) * 45))}%`,
                  top: `${50 + Math.max(-38, Math.min(38, ((targetPos.z - playerPos.z) / 80) * 45))}%`,
                }}
              />
            )}

            {/* Player Center Blip */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.9)]"
              style={{
                transform: `translate(-50%, -50%) rotate(${(-playerYaw * 180) / Math.PI}deg)`,
              }}
            />
          </div>

          {/* Compact Weapon & Ammunition Counter (Docked neatly below radar) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 backdrop-blur-md shadow-lg flex items-center gap-2.5 min-w-[125px]">
            <div className="p-1 bg-blue-600/20 text-blue-400 rounded-lg">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="font-['Chakra_Petch'] text-[10px] font-bold text-slate-300 uppercase leading-none truncate">
                {currentWeapon.name}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-black text-cyan-300 leading-none">
                  {currentWeapon.currentAmmo}
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold leading-none">
                  / {currentWeapon.reserveAmmo}
                </span>
              </div>
              {isReloading && (
                <div className="flex items-center gap-1 text-[9px] text-yellow-400 font-semibold mt-0.5">
                  <RotateCw className="w-2 h-2 animate-spin" />
                  <span>RELOAD</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER CROSSHAIR / AIM RETICLE */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {isAiming ? (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#38bdf8]" />
            <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/90" />
            <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/90" />
            <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/90" />
            <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/90" />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
        )}
      </div>

      {/* DISPATCH NOTIFICATIONS FEED */}
      <div className="absolute left-4 bottom-44 sm:bottom-48 max-w-xs sm:max-w-sm flex flex-col gap-1 pointer-events-none z-10">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-3 py-1.5 rounded-xl text-[11px] backdrop-blur-md border shadow-lg animate-in fade-in slide-in-from-left duration-200 ${
              n.type === 'alert'
                ? 'bg-red-950/85 text-red-200 border-red-700/80 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : n.type === 'success'
                ? 'bg-emerald-950/85 text-emerald-200 border-emerald-700/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-950/85 text-slate-200 border-slate-700/80'
            }`}
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* DRIVING VEHICLE INFO (If inside cruiser) */}
      {currentVehicle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-blue-500/50 rounded-xl px-4 py-2 backdrop-blur-md shadow-xl flex items-center gap-3 pointer-events-none">
          <Car className="w-5 h-5 text-blue-400 animate-pulse" />
          <div>
            <div className="font-['Chakra_Petch'] text-[10px] text-slate-400 uppercase font-semibold">
              PATROL INTERCEPTOR
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {Math.round(currentVehicle.speed * 3.6)} <span className="text-xs text-slate-400">KM/H</span>
            </div>
          </div>
          {currentVehicle.isSirenOn && (
            <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              SIREN ON
            </span>
          )}
        </div>
      )}
    </div>
  );
};
