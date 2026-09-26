import React, { useState } from 'react';
import { Camera, ZoomIn, ZoomOut, X, Check, Aperture, Flashlight } from 'lucide-react';
import { soundEngine } from '../game/audio/SoundEffects';

interface ForensicCameraOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  targetEvidenceTitle?: string;
  isNearEvidence: boolean;
}

export const ForensicCameraOverlay: React.FC<ForensicCameraOverlayProps> = ({
  isOpen,
  onClose,
  onTakePhoto,
  targetEvidenceTitle,
  isNearEvidence,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [photoSaved, setPhotoSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSnap = () => {
    soundEngine.playCameraShutter();
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      setPhotoSaved(true);
      onTakePhoto();
      setTimeout(() => setPhotoSaved(false), 2000);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden font-['Inter',sans-serif]">
      {/* White camera flash animation */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none" />
      )}

      {/* Viewfinder Vignette & HUD overlay */}
      <div className="absolute inset-0 border-[24px] sm:border-[40px] border-slate-950/80 pointer-events-none" />

      {/* Grid Lines */}
      <div className="absolute inset-8 sm:inset-14 border border-cyan-500/20 pointer-events-none">
        <div className="absolute inset-0 border-b border-cyan-500/20 top-1/3" />
        <div className="absolute inset-0 border-b border-cyan-500/20 top-2/3" />
        <div className="absolute inset-0 border-r border-cyan-500/20 left-1/3" />
        <div className="absolute inset-0 border-r border-cyan-500/20 left-2/3" />
      </div>

      {/* Top Banner: Camera Status */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-cyan-500/40 px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-3 pointer-events-auto">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-cyan-300">
          FORENSIC EVIDENCE CAMERA · 50MM F/1.8
        </span>
        <span className="text-slate-500 text-xs">|</span>
        <span className="text-xs text-slate-300 font-mono font-bold">{zoomLevel}X ZOOM</span>
      </div>

      {/* Center Camera Reticle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-36 h-36 border-2 border-cyan-400/50 rounded-lg flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-cyan-400 rounded-full" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400" />
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-cyan-400" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-cyan-400" />
        </div>

        {/* Target detection badge */}
        {isNearEvidence ? (
          <div className="mt-3 bg-cyan-950/90 border border-cyan-400 px-3 py-1 rounded text-center animate-bounce">
            <span className="text-[11px] font-['Chakra_Petch'] text-cyan-300 font-bold uppercase">
              [TARGET LOCKED: {targetEvidenceTitle || 'CRIME SCENE EVIDENCE'}]
            </span>
          </div>
        ) : (
          <div className="mt-3 text-center text-[10px] text-slate-400 font-mono">
            Aim at forensic evidence or syndicate markers
          </div>
        )}
      </div>

      {/* Photo Saved Confirmation Banner */}
      {photoSaved && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-['Chakra_Petch'] text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>EVIDENCE PHOTO LOGGED INTO CASE FILE (+150 XP)</span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
        {/* Zoom Out */}
        <button
          onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
          className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center backdrop-blur-md"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        {/* Big Shutter Button */}
        <button
          onClick={handleSnap}
          className="w-20 h-20 rounded-full bg-cyan-600 hover:bg-cyan-500 border-4 border-cyan-300 text-white flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 transition-transform"
          title="Capture Evidence Photo"
        >
          <Aperture className="w-8 h-8 animate-spin-slow" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => setZoomLevel((z) => Math.min(4, z + 1))}
          className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center backdrop-blur-md"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Exit Camera Mode */}
        <button
          onClick={onClose}
          className="ml-4 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-['Chakra_Petch'] text-xs font-bold uppercase backdrop-blur-md"
        >
          EXIT (ESC)
        </button>
      </div>
    </div>
  );
};
