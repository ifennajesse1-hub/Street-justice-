import React, { useState } from 'react';
import {
  Landmark,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Gem,
  Coins,
  Lock,
  X,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { PlayerStats, FictionalValuable } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

interface BankModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onConvertValuable: (valuableId: string) => void;
  onStoreValuable: (valuableId: string) => void;
  onRetrieveValuable: (valuableId: string) => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  stats,
  onClose,
  onDeposit,
  onWithdraw,
  onConvertValuable,
  onStoreValuable,
  onRetrieveValuable,
}) => {
  const [activeTab, setActiveTab] = useState<'banking' | 'valuables' | 'vault'>('banking');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'alert' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDepositAmount = (amt: number) => {
    if (amt <= 0) return;
    if (stats.money < amt) {
      showFeedback('Insufficient on-hand cash for deposit!', 'alert');
      soundEngine.playDryFire();
      return;
    }
    onDeposit(amt);
    soundEngine.playRadioChime();
    showFeedback(`Successfully deposited $${amt.toLocaleString()} to Metro Trust Savings.`);
  };

  const handleWithdrawAmount = (amt: number) => {
    if (amt <= 0) return;
    if (stats.bankSavings < amt) {
      showFeedback('Insufficient savings in bank account!', 'alert');
      soundEngine.playDryFire();
      return;
    }
    onWithdraw(amt);
    soundEngine.playRadioChime();
    showFeedback(`Successfully withdrew $${amt.toLocaleString()} from Metro Trust Savings.`);
  };

  const onCustomSubmit = (isDeposit: boolean) => {
    const val = parseInt(customAmount, 10);
    if (isNaN(val) || val <= 0) {
      showFeedback('Please enter a valid monetary amount.', 'alert');
      return;
    }
    if (isDeposit) {
      handleDepositAmount(val);
    } else {
      handleWithdrawAmount(val);
    }
    setCustomAmount('');
  };

  const onSellValuable = (val: FictionalValuable) => {
    onConvertValuable(val.id);
    soundEngine.playRadioChime();
    showFeedback(`Appraised & exchanged "${val.name}" for $${val.estimatedValue.toLocaleString()} in insured cash!`);
  };

  const onDepositValuable = (val: FictionalValuable) => {
    onStoreValuable(val.id);
    soundEngine.playRadioChime();
    showFeedback(`Securely locked "${val.name}" into Safety Deposit Box.`);
  };

  const onWithdrawFromVault = (val: FictionalValuable) => {
    onRetrieveValuable(val.id);
    soundEngine.playRadioChime();
    showFeedback(`Retrieved "${val.name}" from Safety Deposit Box.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-md">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-['Chakra_Petch'] text-emerald-300 tracking-wide">
                  METRO COMMERCIAL TRUST & BANK
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                  FDIC INSURED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Downtown Branch · Personal Vault Deposit & Bullion Appraisal Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-center">
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-3 shadow-inner">
            <div className="text-[11px] font-['Chakra_Petch'] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Insured Bank Savings
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1">
              ${stats.bankSavings.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-300/70 mt-0.5">
              Guaranteed protected from hospital fees & IA seizures
            </div>
          </div>

          <div className="bg-slate-900/80 border border-blue-500/40 rounded-xl p-3 shadow-inner">
            <div className="text-[11px] font-['Chakra_Petch'] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              On-Hand Street Cash
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 mt-1">
              ${stats.money.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Available immediately for weapons & field gear
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('banking')}
            className={`pb-2.5 px-3 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'banking'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            Teller Transactions
          </button>

          <button
            onClick={() => setActiveTab('valuables')}
            className={`pb-2.5 px-3 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'valuables'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gem className="w-4 h-4" />
            On-Person Valuables ({stats.valuables.length})
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-2.5 px-3 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'vault'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Safety Deposit Vault ({stats.vaultValuables.length})
          </button>
        </div>

        {/* Toast Notification */}
        {feedbackMsg && (
          <div
            className={`mx-4 mt-3 p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
              feedbackMsg.type === 'alert'
                ? 'bg-red-950/80 border-red-700/80 text-red-200'
                : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
            }`}
          >
            {feedbackMsg.type === 'alert' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: BANKING TRANSACTIONS */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 uppercase tracking-wide flex items-center gap-2 mb-3">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  Deposit Street Cash into Savings
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Transfer street money into your personal bank account. High-yield municipal savings safeguard your earnings.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleDepositAmount(amt)}
                      disabled={stats.money < amt}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-800/50 border border-emerald-600/40 text-emerald-300 font-mono text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDepositAmount(stats.money)}
                    disabled={stats.money <= 0}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    DEPOSIT ALL (${stats.money.toLocaleString()})
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 uppercase tracking-wide flex items-center gap-2 mb-3">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  Withdraw Street Cash from Savings
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Withdraw on-hand cash for weapon upgrades, tactical supplies, and automotive enhancements.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleWithdrawAmount(amt)}
                      disabled={stats.bankSavings < amt}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-800/50 border border-cyan-600/40 text-cyan-300 font-mono text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      -${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => handleWithdrawAmount(stats.bankSavings)}
                    disabled={stats.bankSavings <= 0}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    WITHDRAW ALL (${stats.bankSavings.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Custom Amount Field */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-['Chakra_Petch'] text-slate-400 uppercase tracking-wide block mb-1">
                    Custom Transaction Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter custom dollars..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2 pt-5">
                  <button
                    onClick={() => onCustomSubmit(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-['Chakra_Petch'] text-xs font-bold transition-colors"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => onCustomSubmit(false)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white font-['Chakra_Petch'] text-xs font-bold transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ON-PERSON VALUABLES */}
          {activeTab === 'valuables' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                Fictional valuables recovered from solved crime cases, syndicate busts, or personal belongings.
                The Metro Bank bullion desk officially appraises and exchanges eligible items into legal currency.
              </div>

              {stats.valuables.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No valuables currently on your person. Complete investigations and raid syndicate hideouts to uncover loot.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.valuables.map((val) => (
                    <div
                      key={val.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                          <Gem className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                            {val.name}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1">{val.description}</div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            Appraised Value: ${val.estimatedValue.toLocaleString()} · Source: {val.sourceLocation || 'Field Case'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onDepositValuable(val)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-['Chakra_Petch'] text-xs font-bold transition-colors flex items-center gap-1"
                          title="Store safely in deposit box"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Vault
                        </button>
                        <button
                          onClick={() => onSellValuable(val)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shadow transition-colors flex items-center gap-1"
                          title="Exchange for insured bank cash"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Exchange (${val.estimatedValue})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAFETY DEPOSIT VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                Items stored in your private high-security safety deposit vault box. 
                Secured behind reinforced steel and biometric locks, immune to any street incidents.
              </div>

              {stats.vaultValuables.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  Your safety deposit box is empty. Deposit rare valuables here for safekeeping.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.vaultValuables.map((val) => (
                    <div
                      key={val.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-['Chakra_Petch'] font-bold text-sm text-slate-200">
                            {val.name}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1">{val.description}</div>
                          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                            Appraised Value: ${val.estimatedValue.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onWithdrawFromVault(val)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] text-xs font-bold shadow transition-colors flex items-center gap-1"
                      >
                        Retrieve Item
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div>METRO PD BADGE #{stats.rank * 100 + 42} · OFFICER CARTER</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-['Chakra_Petch'] text-xs font-bold transition-colors"
          >
            Leave Teller Desk
          </button>
        </div>

      </div>
    </div>
  );
};
