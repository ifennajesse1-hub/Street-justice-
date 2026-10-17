import React from 'react';
import {
  Shield,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Scale,
  X,
  FileText,
  Lock,
  Unlock,
  Radio,
  Eye,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { PlayerStats } from '../types/game';

interface DualIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  witnessCountNearby?: number;
  onUnderworldOpportunityLaunch?: (type: 'arms_lead' | 'chop_shop' | 'contraband_drop') => void;
}

export const DualIdentityModal: React.FC<DualIdentityModalProps> = ({
  isOpen,
  onClose,
  stats,
  witnessCountNearby = 0,
  onUnderworldOpportunityLaunch,
}) => {
  if (!isOpen) return null;

  const policeRep = stats.policeReputation ?? stats.reputation;
  const underworldRep = stats.underworldReputation ?? 15;
  const suspicion = stats.suspicionLevel ?? 10;
  const dirtyCash = stats.dirtyCash ?? 0;
  const legitEarnings = stats.legitimateEarnings ?? stats.money;
  const secretEarnings = stats.secretEarnings ?? 0;

  // Moral Identity Classification
  const getIdentityStanding = () => {
    if (policeRep >= 80 && suspicion <= 25) {
      return {
        title: 'MODEL PRECINCT DETECTIVE',
        subtitle: 'By-the-book officer with spotless official record',
        color: 'text-blue-400',
        badge: 'bg-blue-950/80 border-blue-500/50 text-blue-300',
      };
    }
    if (underworldRep >= 55) {
      return {
        title: 'UNDERWORLD FIXER IN BLUE',
        subtitle: 'Respected across street syndicates for discrete backroom deals',
        color: 'text-purple-400',
        badge: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
      };
    }
    if (suspicion >= 55) {
      return {
        title: 'INTERNAL AFFAIRS TARGET',
        subtitle: 'Under intense precinct scrutiny; witnesses & dispatch auditing reports',
        color: 'text-red-400',
        badge: 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse',
      };
    }
    return {
      title: 'STREET PRAGMATIST',
      subtitle: 'Balancing precinct duty with street reality and survival',
      color: 'text-amber-400',
      badge: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
    };
  };

  const identity = getIdentityStanding();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none font-['Inter',sans-serif] animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300 shadow">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase tracking-wide">
                  OFFICER CARTER'S DUAL IDENTITY
                </span>
                <span className={`text-[9px] font-['Chakra_Petch'] font-bold px-2 py-0.5 rounded border uppercase ${identity.badge}`}>
                  {identity.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Law Enforcement Officer by Day · Covert Street Fixer by Night
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top 3 Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. POLICE TRUST */}
            <div className="bg-slate-900/70 border border-blue-500/30 rounded-xl p-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-blue-400 uppercase flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Police Trust
                  </span>
                  <span className="font-mono text-sm font-black text-blue-300">
                    {policeRep}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                    style={{ width: `${policeRep}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {policeRep >= 65
                  ? 'Precinct 9 units respect Carter. Tactical backup responds rapidly in full strength.'
                  : policeRep >= 40
                  ? 'Standard patrol standing. Backup response is standard.'
                  : 'Low precinct trust. Dispatch questions calls and backup delayed.'}
              </p>
            </div>

            {/* 2. UNDERWORLD REPUTATION */}
            <div className="bg-slate-900/70 border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-purple-400 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Underworld Rep
                  </span>
                  <span className="font-mono text-sm font-black text-purple-300">
                    {underworldRep}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300"
                    style={{ width: `${underworldRep}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {underworldRep >= 50
                  ? 'Syndicates know Carter is open to deals. Suspects surrender earlier & offer bribes.'
                  : underworldRep >= 30
                  ? 'Word is spreading on the street that Carter cuts secret arrangements.'
                  : 'Criminals treat Carter as strict badge. High hostility, low surrender willingness.'}
              </p>
            </div>

            {/* 3. SUSPICION */}
            <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-amber-400 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    IA Suspicion
                  </span>
                  <span
                    className={`font-mono text-sm font-black ${
                      suspicion >= 50 ? 'text-red-400 animate-pulse' : 'text-amber-300'
                    }`}
                  >
                    {suspicion}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      suspicion >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-red-500'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    }`}
                    style={{ width: `${suspicion}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {suspicion >= 70
                  ? 'Active Internal Affairs investigation! Civilian witnesses report misconduct quickly.'
                  : suspicion >= 40
                  ? 'Heightened scrutiny on field seizures and off-the-record suspect releases.'
                  : 'Normal departmental heat. Decays slowly during lawful patrols without incident.'}
              </p>
            </div>
          </div>

          {/* Ledger of Clean vs Dirty Earnings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-200">
                  Financial Records & Cash Holdings
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                  <span>
                    Clean Police Salary: <strong className="text-emerald-400">${legitEarnings.toLocaleString()}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Secret Street Earnings: <strong className="text-purple-400">${secretEarnings.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {dirtyCash > 0 && (
              <div className="bg-amber-950/70 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>On-Person Dirty Cash: <strong>${dirtyCash.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          {/* Underworld Connections & Secret Opportunities Section */}
          <div className="bg-slate-900/70 border border-purple-900/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-purple-300 tracking-wider">
                  Underground Contacts & Secret Opportunities
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Threshold: 35%+ Underworld Rep
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              As Officer Carter's street reputation expands, syndicate fixers and fences reach out with lucrative off-the-record assignments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Opportunity 1: Chop-Shop Protection */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  underworldRep >= 25
                    ? 'bg-slate-950/90 border-purple-500/40 text-slate-200 hover:border-purple-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100">
                      Chop-Shop Lookout
                    </span>
                    {underworldRep >= 25 ? (
                      <Unlock className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Look the other way while Neon Python tuners strip hot vehicles.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+$650 Dirty</span>
                  {underworldRep >= 25 && onUnderworldOpportunityLaunch && (
                    <button
                      onClick={() => onUnderworldOpportunityLaunch('chop_shop')}
                      className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-['Chakra_Petch'] font-bold uppercase transition-colors"
                    >
                      EXECUTE
                    </button>
                  )}
                </div>
              </div>

              {/* Opportunity 2: Intercepted Military Arms Lead */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  underworldRep >= 45
                    ? 'bg-slate-950/90 border-purple-500/40 text-slate-200 hover:border-purple-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100">
                      Harbor Arms Tipoff
                    </span>
                    {underworldRep >= 45 ? (
                      <Unlock className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Intercept Iron Viper weapons cache before precinct SWAT secures it.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+$1,400 Dirty</span>
                  {underworldRep >= 45 && onUnderworldOpportunityLaunch && (
                    <button
                      onClick={() => onUnderworldOpportunityLaunch('arms_lead')}
                      className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-['Chakra_Petch'] font-bold uppercase transition-colors"
                    >
                      EXECUTE
                    </button>
                  )}
                </div>
              </div>

              {/* Opportunity 3: Syndicate Contraband Drop */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  underworldRep >= 65
                    ? 'bg-slate-950/90 border-purple-500/40 text-slate-200 hover:border-purple-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100">
                      Syndicate Dead-Drop
                    </span>
                    {underworldRep >= 65 ? (
                      <Unlock className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Collect confidential encrypted syndicate bearer bonds from dockside locker.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+$2,800 Dirty</span>
                  {underworldRep >= 65 && onUnderworldOpportunityLaunch && (
                    <button
                      onClick={() => onUnderworldOpportunityLaunch('contraband_drop')}
                      className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-['Chakra_Petch'] font-bold uppercase transition-colors"
                    >
                      EXECUTE
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Current Local Detection Status */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>
                Nearby Civilian Witnesses in Sight: <strong className="font-mono text-cyan-300">{witnessCountNearby}</strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Shady actions witnessed increase Suspicion & report misconduct
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-400" />
            <span>Values update automatically based on field decisions and citizen encounters.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
          >
            RETURN TO PATROL
          </button>
        </div>
      </div>
    </div>
  );
};
