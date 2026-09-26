import React, { useRef, useState } from 'react';
import {
  Crosshair,
  Car,
  RotateCw,
  Volume2,
  FastForward,
  ArrowDown,
  ArrowUp,
  HandMetal,
  Shuffle,
  Camera,
  Flashlight,
  Megaphone,
  Search,
  MessageSquare,
} from 'lucide-react';
import { InputState } from '../types/game';

interface TouchControlsProps {
  inputState: React.MutableRefObject<InputState>;
  isInVehicle: boolean;
  canEnterVehicle: boolean;
  canArrest: boolean;
  canInterrogate?: boolean;
  canQuestionCivilian?: boolean;
  isAiming: boolean;
  isFlashlightOn?: boolean;
  onOrderSurrender?: () => void;
  onOpenInterrogation?: () => void;
  onQuestionCivilian?: () => void;
  onToggleCamera?: () => void;
  onToggleFlashlight?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputState,
  isInVehicle,
  canEnterVehicle,
  canArrest,
  canInterrogate = false,
  canQuestionCivilian = false,
  isAiming,
  isFlashlightOn = false,
  onOrderSurrender,
  onOpenInterrogation,
  onQuestionCivilian,
  onToggleCamera,
  onToggleFlashlight,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  // Right-side camera look drag tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick handlers (touch + mouse pointer support)
  const isPointerDownRef = useRef(false);

  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isPointerDownRef.current = true;
    setIsJoystickActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    isPointerDownRef.current = false;
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    inputState.current.moveForward = 0;
    inputState.current.moveRight = 0;
  };

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        inputState.current.moveForward = 0;
        inputState.current.moveRight = 0;
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(maxRadius, dist);

    const posX = Math.cos(angle) * clampedDist;
    const posY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: posX, y: posY });

    // Normalised input values (-1 to 1)
    // On screen, clientY decreases upwards, so posY is negative when dragging UP.
    // Invert posY so pushing joystick UP gives positive moveForward (+1 = forward)
    // and pushing DOWN gives negative moveForward (-1 = backward).
    // Keep moveRight normal (posX > 0 is right, posX < 0 is left).
    inputState.current.moveRight = posX / maxRadius;
    inputState.current.moveForward = -posY / maxRadius;
  };

  // Right-side Camera Touchpad handlers
  const handleLookStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    // Right half of screen acts as look touchpad
    if (touch.clientX > window.innerWidth * 0.35) {
      lookTouchIdRef.current = touch.identifier;
      lookLastPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lookLastPosRef.current.x;
        const dy = touch.clientY - lookLastPosRef.current.y;

        inputState.current.lookDeltaX += dx;
        inputState.current.lookDeltaY += dy;

        lookLastPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  // Determine which contextual interact action is active
  const hasContextualInteract = canArrest || canInterrogate || canQuestionCivilian || canEnterVehicle;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Inter',sans-serif]">
      {/* Right Screen Camera Look Swipe Zone (covers top 72% so buttons are never obstructed) */}
      <div
        className="absolute top-0 right-0 w-3/5 h-[72%] pointer-events-auto"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* 1. LARGE VIRTUAL MOVEMENT JOYSTICK (BOTTOM-LEFT) */}
      <div className="absolute bottom-5 left-4 pointer-events-auto touch-none">
        <div
          ref={joystickBaseRef}
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerUp}
          onPointerCancel={handleJoystickPointerUp}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 cursor-grab active:cursor-grabbing transition-colors duration-150 flex items-center justify-center backdrop-blur-md shadow-[0_0_24px_rgba(30,58,138,0.4)] ${
            isJoystickActive
              ? 'border-blue-400 bg-slate-950/60 shadow-[0_0_25px_rgba(59,130,246,0.5)]'
              : 'border-blue-500/40 bg-slate-950/40'
          }`}
        >
          {/* Subtle concentric rings */}
          <div className="absolute inset-3 sm:inset-4 rounded-full border border-blue-500/20 pointer-events-none" />
          <div className="absolute inset-6 sm:inset-8 rounded-full border border-blue-500/15 pointer-events-none" />

          {/* Floating Joystick Thumb */}
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl border flex items-center justify-center pointer-events-none transition-transform duration-75 ${
              isJoystickActive
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/60 shadow-sm" />
          </div>
        </div>
      </div>

      {/* 2. LEFT SIDE POLICE TOOLS STRIP (Flashlight, Camera, Order Surrender) */}
      {!isInVehicle && (
        <div className="absolute bottom-[148px] left-4 flex flex-col gap-2.5 pointer-events-auto">
          {/* Tactical Flashlight Button */}
          {onToggleFlashlight && (
            <button
              onClick={onToggleFlashlight}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center backdrop-blur-md shadow-md active:scale-95 transition-all ${
                isFlashlightOn
                  ? 'bg-amber-400/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                  : 'bg-slate-950/60 border-slate-700/80 text-slate-300 hover:border-blue-400'
              }`}
              title="Tactical Flashlight (F)"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}

          {/* Forensic Evidence Camera Button */}
          {onToggleCamera && (
            <button
              onClick={onToggleCamera}
              className="w-11 h-11 rounded-xl bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-700/80 hover:border-cyan-400 text-cyan-300 flex items-center justify-center backdrop-blur-md shadow-md active:scale-95 transition-all"
              title="Forensic Evidence Camera (V)"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}

          {/* Order Surrender Megaphone Command */}
          {onOrderSurrender && (
            <button
              onClick={onOrderSurrender}
              className="w-11 h-11 rounded-xl bg-slate-950/60 hover:bg-amber-950/40 border border-slate-700/80 hover:border-amber-400 text-amber-300 flex items-center justify-center backdrop-blur-md shadow-md active:scale-95 transition-all"
              title="Order Suspects to Surrender (G)"
            >
              <Megaphone className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* 3. RIGHT ACTION BUTTONS CLUSTER (Carefully positioned to never overlap) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* === ON FOOT CONTROLS === */}
        {!isInVehicle && (
          <>
            {/* BIG PRIMARY FIRE BUTTON (Bottom-Right) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.fire = true;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                inputState.current.fire = false;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.fire = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                inputState.current.fire = false;
              }}
              className="absolute bottom-5 right-4 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-gradient-to-br from-red-600/85 to-slate-950/90 hover:from-red-500 hover:to-red-700 border-2 border-red-500/80 text-white flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.6)] backdrop-blur-md active:scale-95 transition-transform pointer-events-auto"
              title="Fire Weapon (Left-Click)"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/60 flex items-center justify-center pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
              </div>
            </button>

            {/* AIM / ADS BUTTON (Left of Fire Button) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.aim = !inputState.current.aim;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.aim = !inputState.current.aim;
              }}
              className={`absolute bottom-5 right-[84px] w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-95 pointer-events-auto ${
                isAiming
                  ? 'bg-blue-600/85 border-cyan-300 text-white shadow-[0_0_18px_rgba(56,189,248,0.7)]'
                  : 'bg-slate-950/65 border-blue-500/50 text-blue-300 hover:border-blue-400'
              }`}
              title="Aim Down Sights (Right-Click)"
            >
              <Crosshair className="w-5 h-5" />
            </button>

            {/* JUMP BUTTON (Above Fire Button) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.jump = true;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                inputState.current.jump = false;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.jump = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                inputState.current.jump = false;
              }}
              className="absolute bottom-[88px] right-4 w-11 h-11 rounded-full bg-slate-950/65 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-400 text-slate-200 flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 active:bg-blue-600 pointer-events-auto transition-transform"
              title="Jump (Space)"
            >
              <ArrowUp className="w-5 h-5 text-blue-400" />
            </button>

            {/* CROUCH BUTTON (Above Aim Button) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.crouch = !inputState.current.crouch;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.crouch = !inputState.current.crouch;
              }}
              className={`absolute bottom-[88px] right-[68px] w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 pointer-events-auto transition-all ${
                inputState.current.crouch
                  ? 'bg-blue-600/80 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                  : 'bg-slate-950/65 border-slate-700/80 hover:border-slate-500 text-slate-300'
              }`}
              title="Crouch (C)"
            >
              <ArrowDown className="w-5 h-5" />
            </button>

            {/* RELOAD BUTTON (Above Jump Button) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.reload = true;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.reload = true;
              }}
              className="absolute bottom-[144px] right-4 w-10 h-10 rounded-full bg-slate-950/65 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-200 flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 pointer-events-auto transition-transform"
              title="Reload Weapon (R)"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
            </button>

            {/* SPRINT BUTTON (Above Crouch Button) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.sprint = true;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                inputState.current.sprint = false;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.sprint = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                inputState.current.sprint = false;
              }}
              className="absolute bottom-[144px] right-[68px] w-10 h-10 rounded-full bg-slate-950/65 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-400 text-slate-200 flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 active:bg-blue-600 pointer-events-auto transition-transform"
              title="Sprint (Shift)"
            >
              <FastForward className="w-4 h-4 text-blue-400" />
            </button>

            {/* SWITCH WEAPON (Above Reload) */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.switchWeapon = true;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.switchWeapon = true;
              }}
              className="absolute bottom-[196px] right-4 w-10 h-10 rounded-full bg-slate-950/65 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 pointer-events-auto transition-transform"
              title="Switch Weapon (Q)"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* CONTEXTUAL INTERACT BUTTON (Shows prominently when near objects/suspects/vehicles) */}
            {hasContextualInteract && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (canArrest) {
                    inputState.current.interact = true;
                  } else if (canInterrogate && onOpenInterrogation) {
                    onOpenInterrogation();
                  } else if (canQuestionCivilian && onQuestionCivilian) {
                    onQuestionCivilian();
                  } else if (canEnterVehicle) {
                    inputState.current.enterVehicle = true;
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (canArrest) {
                    inputState.current.interact = true;
                  } else if (canInterrogate && onOpenInterrogation) {
                    onOpenInterrogation();
                  } else if (canQuestionCivilian && onQuestionCivilian) {
                    onQuestionCivilian();
                  } else if (canEnterVehicle) {
                    inputState.current.enterVehicle = true;
                  }
                }}
                className="absolute bottom-[88px] right-[124px] w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border-2 border-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse active:scale-95 transition-transform pointer-events-auto"
                title="Interact (E)"
              >
                {canArrest ? (
                  <HandMetal className="w-6 h-6 fill-slate-950" />
                ) : canInterrogate ? (
                  <Search className="w-6 h-6 stroke-[2.5]" />
                ) : canQuestionCivilian ? (
                  <MessageSquare className="w-6 h-6 fill-slate-950" />
                ) : (
                  <Car className="w-6 h-6 fill-slate-950" />
                )}
              </button>
            )}
          </>
        )}

        {/* === IN-VEHICLE DRIVING CONTROLS === */}
        {isInVehicle && (
          <div className="absolute bottom-5 right-4 flex items-center gap-3 pointer-events-auto">
            {/* Siren Toggle */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.toggleSiren = true;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.toggleSiren = true;
              }}
              className="w-12 h-12 rounded-full bg-amber-600/90 border-2 border-amber-400 text-white flex items-center justify-center shadow-lg active:scale-95"
              title="Police Siren (H)"
            >
              <Volume2 className="w-6 h-6" />
            </button>

            {/* Handbrake Drift Button */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.handbrake = true;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                inputState.current.handbrake = false;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.handbrake = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                inputState.current.handbrake = false;
              }}
              className="w-15 h-15 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-300 text-white font-['Chakra_Petch'] font-black text-xs flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95"
              title="Handbrake Drift (Space)"
            >
              DRIFT
            </button>

            {/* Exit Vehicle Button */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                inputState.current.enterVehicle = true;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                inputState.current.enterVehicle = true;
              }}
              className="w-14 h-14 rounded-full bg-slate-950/80 border-2 border-slate-600 hover:border-red-400 text-red-300 flex items-center justify-center shadow-lg active:scale-95 font-['Chakra_Petch'] font-bold text-xs"
              title="Exit Vehicle (F / E)"
            >
              EXIT
            </button>
          </div>
        )}
      </div>

      {/* Desktop Keyboard Controls Legend (Desktop only) */}
      <div className="hidden lg:flex absolute bottom-2 left-6 text-[10px] text-slate-400/80 bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none gap-2 font-mono">
        <span>WASD: Move</span>
        <span>·</span>
        <span>Mouse: Aim/Shoot</span>
        <span>·</span>
        <span>Space: Jump</span>
        <span>·</span>
        <span>E: Interact</span>
        <span>·</span>
        <span>G: Megaphone Surrender</span>
        <span>·</span>
        <span>F: Flashlight</span>
        <span>·</span>
        <span>V: Camera</span>
        <span>·</span>
        <span>ESC: Menu</span>
      </div>
    </div>
  );
};
