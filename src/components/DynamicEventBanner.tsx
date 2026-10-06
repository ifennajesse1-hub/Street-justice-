import React, { useEffect, useState, useRef } from 'react';
import { Radio, Compass, X } from 'lucide-react';
import { DynamicEvent } from '../types/game';

interface DynamicEventBannerProps {
  event: DynamicEvent | null;
  onRespond: (event: DynamicEvent) => void;
  onDismiss: () => void;
}

export const DynamicEventBanner: React.FC<DynamicEventBannerProps> = ({
  event,
  onRespond,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(12);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!event || !event.active) return;
    setTimeLeft(12);

    const timeout = setTimeout(() => {
      onDismissRef.current();
    }, 12000);

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [event?.id]);

  if (!event || !event.active) return null;

  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 z-40 max-w-sm sm:max-w-md w-auto pointer-events-none select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-slate-950/85 border border-red-500/70 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(239,68,68,0.4)] backdrop-blur-md pointer-events-auto flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
        <span className="font-['Chakra_Petch'] font-bold text-[10px] text-red-400 uppercase tracking-wider shrink-0">
          911 · {timeLeft}s
        </span>
        <span className="text-[11px] font-semibold text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
          {event.title.replace(/^10-\d+:\s*/, '')}
        </span>
        <button
          onClick={() => onRespond(event)}
          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-['Chakra_Petch'] font-bold text-[10px] uppercase rounded-full flex items-center gap-1 transition-transform active:scale-95 shrink-0 shadow"
        >
          <Compass className="w-2.5 h-2.5" />
          <span>GPS</span>
        </button>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 p-0.5 shrink-0"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

