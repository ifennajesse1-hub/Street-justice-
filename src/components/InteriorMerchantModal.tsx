import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  Wrench,
  X,
  Heart,
  Shield,
  Zap,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { PlayerStats, EnterableBuildingId } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface InteriorMerchantModalProps {
  buildingId: EnterableBuildingId;
  stats: PlayerStats;
  onClose: () => void;
  onPurchaseItem: (cost: number, perk: string) => void;
}

export const InteriorMerchantModal: React.FC<InteriorMerchantModalProps> = ({
  buildingId,
  stats,
  onClose,
  onPurchaseItem,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const isSoulKitchen = buildingId === 'soul_kitchen';
  const isMarket = buildingId === 'cedar_market';
  const isMarcusAuto = buildingId === 'marcus_auto';

  const title = isSoulKitchen
    ? "MAMA LEAH'S SOUL KITCHEN"
    : isMarket
    ? "CEDAR HEIGHTS DELI & SUPPLIES"
    : "MARCUS'S PRECISION AUTO & PERFORMANCE";

  const subtitle = isSoulKitchen
    ? "Hot Skillet Cooking, Warm Peach Cobbler & Community Intel"
    : isMarket
    ? "Neighborhood Corner Store · Emergency First-Aid & Field Provisions"
    : "Chassis Reinforcement, High-Torque Engine Tuning & Custom Paint";

  const handleBuy = (cost: number, name: string, effect: string, perkId: string) => {
    if (stats.money < cost) {
      soundEngine.playDryFire();
      notify(`Insufficient cash for ${name}! Need $${cost}.`);
      return;
    }
    onPurchaseItem(cost, perkId);
    soundEngine.playRadioChime();
    notify(`Purchased ${name}! ${effect}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
              {isSoulKitchen ? (
                <Utensils className="w-6 h-6" />
              ) : isMarket ? (
                <ShoppingBag className="w-6 h-6" />
              ) : (
                <Wrench className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Chakra_Petch'] text-amber-300 tracking-wide">
                {title}
              </h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cash Strip */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-['Chakra_Petch'] text-slate-400 uppercase tracking-wide">
            Your Wallet Cash:
          </span>
          <span className="font-mono text-base font-bold text-emerald-400">
            ${stats.money.toLocaleString()}
          </span>
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg text-xs font-medium bg-emerald-950/80 border border-emerald-600 text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Merchant Catalog */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {isSoulKitchen && (
            <>
              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Mama Leah's Skillet Dinner
                  </div>
                  <div className="text-xs text-slate-400">
                    Crispy fried chicken, collard greens, and warm cornbread. Fully restores player health.
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1 font-bold">+100 Health Restored</div>
                </div>
                <button
                  onClick={() => handleBuy(25, "Mama Leah's Skillet Dinner", 'Health fully restored!', 'restore_health')}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Order $25
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Grandma's Warm Peach Cobbler
                  </div>
                  <div className="text-xs text-slate-400">
                    Famous family dessert recipe. Gives Officer Carter a boost of stamina and focus.
                  </div>
                  <div className="text-xs font-mono text-cyan-400 mt-1 font-bold">+50 Armor Stamina Buff</div>
                </div>
                <button
                  onClick={() => handleBuy(15, "Grandma's Warm Peach Cobbler", '+50 Armor restored!', 'restore_armor')}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Order $15
                </button>
              </div>
            </>
          )}

          {isMarket && (
            <>
              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Field Trauma First-Aid Kit
                  </div>
                  <div className="text-xs text-slate-400">
                    Emergency medical gauze and coagulant. Instantly heals critical gunshot wounds.
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1 font-bold">+100 Health</div>
                </div>
                <button
                  onClick={() => handleBuy(80, 'Field Trauma First-Aid Kit', 'Full Health restored!', 'restore_health')}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Buy $80
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Kevlar Ballistic Plate Insert
                  </div>
                  <div className="text-xs text-slate-400">
                    High-density ceramic composite insert for patrol duty armor vest.
                  </div>
                  <div className="text-xs font-mono text-cyan-400 mt-1 font-bold">+100 Max Armor Restored</div>
                </div>
                <button
                  onClick={() => handleBuy(150, 'Kevlar Ballistic Plate Insert', 'Armor fully repaired!', 'restore_armor')}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Buy $150
                </button>
              </div>
            </>
          )}

          {isMarcusAuto && (
            <>
              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Police Cruiser Engine & Body Repair
                  </div>
                  <div className="text-xs text-slate-400">
                    Pound out body dents, replace damaged radiators, and restore patrol cruiser to 100% health.
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1 font-bold">100% Vehicle Repair</div>
                </div>
                <button
                  onClick={() => handleBuy(120, 'Cruiser Engine & Body Repair', 'Vehicle fully repaired!', 'repair_vehicle')}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Tune $120
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                    Stage-2 High-Flow Turbo Intercooler
                  </div>
                  <div className="text-xs text-slate-400">
                    Marcus's custom performance tune. Boosts cruiser top acceleration and handling during high-speed chases.
                  </div>
                  <div className="text-xs font-mono text-cyan-400 mt-1 font-bold">+25% Pursuit Top Speed</div>
                </div>
                <button
                  onClick={() => handleBuy(350, 'Stage-2 High-Flow Turbo Intercooler', 'Turbo boost installed!', 'boost_vehicle')}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shrink-0 transition-colors"
                >
                  Install $350
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-['Chakra_Petch'] text-xs font-bold transition-colors"
          >
            Leave Counter
          </button>
        </div>

      </div>
    </div>
  );
};
