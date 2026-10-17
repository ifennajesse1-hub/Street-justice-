import React, { useState } from 'react';
import {
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck2,
  DollarSign,
  Radio,
  Scale,
  HandMetal,
  Gem,
  Lock,
  Unlock,
  Eye,
  FileEdit,
  Flame,
} from 'lucide-react';
import { EnemyEntity, FictionalValuable, PlayerStats } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

export interface ArrestChoiceResult {
  action: 'lawful' | 'shady' | 'extort' | 'escape' | 'tamper' | 'transport';
  moneyDelta: number;
  legitimateMoneyDelta?: number;
  dirtyMoneyDelta?: number;
  policeRepDelta: number;
  underworldRepDelta: number;
  suspicionDelta: number;
  integrityDelta: number;
  xpDelta: number;
  iaViolationDelta?: number;
  evidenceItem?: FictionalValuable;
  contrabandValuable?: FictionalValuable;
  notificationText: string;
  isGood: boolean;
  witnessReported?: boolean;
}

interface ArrestEvidenceModalProps {
  suspect: EnemyEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyArrestResult: (result: ArrestChoiceResult) => void;
  onTransportSuspect: (suspectId: string) => void;
  onReleaseSuspect?: (suspectId: string) => void;
  stats: PlayerStats;
  witnessesNearby?: number;
}

export const ArrestEvidenceModal: React.FC<ArrestEvidenceModalProps> = ({
  suspect,
  isOpen,
  onClose,
  onApplyArrestResult,
  onTransportSuspect,
  onReleaseSuspect,
  stats,
  witnessesNearby = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'booking' | 'search' | 'decision'>('booking');
  const [isSearched, setIsSearched] = useState(suspect?.isSearched || false);
  const [decisionMade, setDecisionMade] = useState<string | null>(null);
  const [transportCalled, setTransportCalled] = useState(suspect?.transportCalled || false);

  if (!isOpen || !suspect) return null;

  // Generate suspect items if not already generated
  const suspectCash = suspect.loot?.stolenCash ?? Math.floor(Math.random() * 260) + 240;
  const suspectWeapon =
    suspect.loot?.weaponName ??
    (suspect.type === 'boss'
      ? 'Titan-AR Carbine'
      : suspect.type === 'enforcer'
      ? 'Modified Specter-45'
      : 'Serial-Scraped Vortex-9');

  const defaultValuable: FictionalValuable = suspect.loot?.valuable ?? {
    id: `val_arrest_${suspect.id}`,
    name:
      suspect.faction === 'iron_vipers'
        ? 'Viper Cartel Weapons Ledger'
        : suspect.faction === 'neon_pythons'
        ? 'Street Narcotics Distribution Pack'
        : suspect.faction === 'eclipse_syndicate'
        ? 'Encrypted Syndicate Datapad'
        : 'Stolen Diamond-Encrusted Gold Watch',
    estimatedValue: suspect.type === 'boss' ? 1800 : suspect.type === 'enforcer' ? 850 : 450,
    category: suspect.faction === 'eclipse_syndicate' ? 'crypto_drive' : 'jewels',
    description: `Seized from ${suspect.name} during field arrest. Recovered illegal contraband evidence.`,
    source: suspect.name,
    sourceLocation: suspect.factionName || 'Metro Street District',
    isContraband: true,
    isStolenOrEvidence: true,
  };

  const suspectCharges = suspect.loot?.charges ?? [
    'Aggravated Felony Armed Robbery',
    'Unlawful Possession of Serial-Defaced Firearm',
    'Syndicate Gang Conspiracy',
  ];

  const handleSearchSuspect = () => {
    if (isSearched) return;
    setIsSearched(true);
    suspect.isSearched = true;
    soundEngine.playEvidencePickup();
    setActiveTab('search');
  };

  // Choice 1: Lawful Police Booking
  const handleLawfulBooking = () => {
    if (decisionMade) return;
    setDecisionMade('lawful');
    soundEngine.playRadioChime();

    const loggedValuable: FictionalValuable = {
      ...defaultValuable,
      isBookedAsEvidence: true,
      caseFileTag: `CASE-ARREST-${suspect.name.replace(/\s+/g, '_').toUpperCase()}`,
    };

    onApplyArrestResult({
      action: 'lawful',
      moneyDelta: 350,
      legitimateMoneyDelta: 350,
      dirtyMoneyDelta: 0,
      policeRepDelta: 16,
      underworldRepDelta: -5,
      suspicionDelta: -10,
      integrityDelta: 12,
      xpDelta: 220,
      evidenceItem: loggedValuable,
      notificationText: `Official Evidence Logged: Confiscated $${suspectCash} & ${defaultValuable.name} booked into Precinct 9 custody (+16 Police Rep, -10 Suspicion, +$350 Salary)`,
      isGood: true,
    });
  };

  // Choice 2: Shady Pocketing (Keep valuables & cash off the record)
  const handleShadyPocketing = () => {
    if (decisionMade) return;
    setDecisionMade('shady');
    soundEngine.playMegaphoneChime();

    const pocketedValuable: FictionalValuable = {
      ...defaultValuable,
      isBookedAsEvidence: false,
      isContraband: true,
    };

    const hasWitness = witnessesNearby > 0;
    const suspicionAdd = hasWitness ? 25 : 12;

    onApplyArrestResult({
      action: 'shady',
      moneyDelta: suspectCash,
      legitimateMoneyDelta: 0,
      dirtyMoneyDelta: suspectCash,
      policeRepDelta: -12,
      underworldRepDelta: 18,
      suspicionDelta: suspicionAdd,
      integrityDelta: -12,
      xpDelta: 140,
      iaViolationDelta: 1,
      contrabandValuable: pocketedValuable,
      witnessReported: hasWitness,
      notificationText: hasWitness
        ? `WITNESS MISCONDUCT REPORT: Citizen saw Carter pocket $${suspectCash} dirty cash & ${defaultValuable.name}! (-12 Police Rep, +${suspicionAdd} Suspicion)`
        : `Carter pocketed $${suspectCash} dirty cash & kept ${defaultValuable.name} off the record (+18 Underworld Trust, +${suspicionAdd} Suspicion)`,
      isGood: false,
    });
  };

  // Choice 3: Extortion / Shakedown Bribe
  const handleExtortSuspect = () => {
    if (decisionMade) return;
    setDecisionMade('extort');
    soundEngine.playMegaphoneChime();

    const bribeAmount = Math.floor(Math.random() * 350) + 800;
    const hasWitness = witnessesNearby > 0;
    const suspicionAdd = hasWitness ? 32 : 18;

    onApplyArrestResult({
      action: 'extort',
      moneyDelta: bribeAmount,
      legitimateMoneyDelta: 0,
      dirtyMoneyDelta: bribeAmount,
      policeRepDelta: -18,
      underworldRepDelta: 26,
      suspicionDelta: suspicionAdd,
      integrityDelta: -16,
      xpDelta: 110,
      iaViolationDelta: 2,
      witnessReported: hasWitness,
      notificationText: hasWitness
        ? `WITNESS REPORT: Civilian reported shakedown payoff of $${bribeAmount}! (+26 Underworld Trust, +${suspicionAdd} IA Suspicion)`
        : `Street Shakedown: Carter took $${bribeAmount} bribe from ${suspect.name} (+26 Underworld Trust, +${suspicionAdd} Suspicion)`,
      isGood: false,
    });
  };

  // Choice 4: Help Criminal Escape in Exchange for Big Underworld Reward
  const handleHelpEscape = () => {
    if (decisionMade) return;
    setDecisionMade('escape');
    soundEngine.playMegaphoneChime();

    const payoff = Math.floor(Math.random() * 400) + 1200;
    const hasWitness = witnessesNearby > 0;
    const suspicionAdd = hasWitness ? 40 : 25;

    onApplyArrestResult({
      action: 'escape',
      moneyDelta: payoff,
      legitimateMoneyDelta: 0,
      dirtyMoneyDelta: payoff,
      policeRepDelta: -25,
      underworldRepDelta: 40,
      suspicionDelta: suspicionAdd,
      integrityDelta: -22,
      xpDelta: 160,
      iaViolationDelta: 2,
      witnessReported: hasWitness,
      notificationText: hasWitness
        ? `WITNESS ALARM: Citizen screamed "The officer let the criminal escape!" (+40 Underworld Trust, +${suspicionAdd} IA Suspicion, -25 Police Rep)`
        : `Underworld Pact: Carter cut ${suspect.name} loose for $${payoff} dirty cash payoff! (+40 Underworld Trust, +${suspicionAdd} Suspicion)`,
      isGood: false,
    });

    if (onReleaseSuspect) {
      onReleaseSuspect(suspect.id);
    }

    setTimeout(() => {
      onClose();
    }, 1600);
  };

  // Choice 5: Manipulate / Tamper Evidence
  const handleTamperEvidence = () => {
    if (decisionMade) return;
    setDecisionMade('tamper');
    soundEngine.playMegaphoneChime();

    const fixerPay = 650;
    const hasWitness = witnessesNearby > 0;
    const suspicionAdd = hasWitness ? 30 : 18;

    onApplyArrestResult({
      action: 'tamper',
      moneyDelta: fixerPay,
      legitimateMoneyDelta: 0,
      dirtyMoneyDelta: fixerPay,
      policeRepDelta: -15,
      underworldRepDelta: 25,
      suspicionDelta: suspicionAdd,
      integrityDelta: -18,
      xpDelta: 120,
      iaViolationDelta: 1,
      witnessReported: hasWitness,
      notificationText: `Evidence Tampered: Carter redacted ${suspect.name}'s case file for $${fixerPay} syndicate payoff (+25 Underworld Trust, +${suspicionAdd} Suspicion)`,
      isGood: false,
    });
  };

  // Dispatch Prisoner Transport (10-75)
  const handleCallTransport = () => {
    if (transportCalled) return;
    setTransportCalled(true);
    suspect.transportCalled = true;
    soundEngine.playRadioChime();

    onApplyArrestResult({
      action: 'transport',
      moneyDelta: 300,
      legitimateMoneyDelta: 300,
      dirtyMoneyDelta: 0,
      policeRepDelta: 6,
      underworldRepDelta: -2,
      suspicionDelta: -5,
      integrityDelta: 4,
      xpDelta: 150,
      notificationText: `10-75 PRISONER TRANSPORT: Suspect ${suspect.name} locked into precinct transport (+ $300 Clean Bounty, +6 Police Rep, -5 Suspicion)`,
      isGood: true,
    });

    onTransportSuspect(suspect.id);

    setTimeout(() => {
      onClose();
    }, 1600);
  };

  const policeRep = stats.policeReputation ?? stats.reputation;
  const underRep = stats.underworldReputation ?? 15;
  const suspLevel = stats.suspicionLevel ?? 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 select-none font-['Inter',sans-serif]">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <HandMetal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-base sm:text-lg text-slate-100 uppercase tracking-wide">
                  ARREST & FIELD BOOKING: {suspect.name}
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  CUFFED
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{suspect.factionName || 'Unclassified Syndicate Gang'}</span>
                <span>•</span>
                <span className="text-emerald-400">Non-Hostile · Handcuffs Locked</span>
                {witnessesNearby > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                      <Eye className="w-3 h-3" />
                      {witnessesNearby} {witnessesNearby === 1 ? 'Witness' : 'Witnesses'} Watching
                    </span>
                  </>
                )}
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

        {/* Double-Life Reputation Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-['Chakra_Petch'] font-bold text-slate-300 uppercase text-[10px] sm:text-xs">
                POLICE REP: <span className="text-blue-400 font-mono">{policeRep}%</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-['Chakra_Petch'] font-bold text-slate-300 uppercase text-[10px] sm:text-xs">
                UNDERWORLD TRUST: <span className="text-purple-400 font-mono">{underRep}%</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${suspLevel >= 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="font-['Chakra_Petch'] font-bold text-slate-300 uppercase text-[10px] sm:text-xs">
                IA SUSPICION: <span className={`font-mono font-bold ${suspLevel >= 60 ? 'text-red-400' : 'text-amber-400'}`}>{suspLevel}%</span>
              </span>
            </div>
          </div>
          {witnessesNearby > 0 && (
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 rounded">
              EYES ON YOU
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 pt-2 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'booking'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Booking & Charges</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Seizure</span>
          </button>

          <button
            onClick={() => setActiveTab('decision')}
            className={`px-3.5 py-2 font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'decision'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Carter's Double-Life Choice</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
          {/* TAB 1: SUSPECT DOSSIER & CHARGES */}
          {activeTab === 'booking' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <div className="text-[11px] font-['Chakra_Petch'] text-slate-400 font-bold uppercase tracking-wider">
                  Formal Police Charges:
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  {suspectCharges.map((ch, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-slate-950/80 border border-slate-800 text-slate-300 p-2 rounded-lg flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{ch}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-300 font-['Chakra_Petch'] uppercase">
                    Field Physical Status
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Suspect subdued with hands cuffed behind back. Weapons removed from reach.
                  </div>
                </div>
                {!isSearched && (
                  <button
                    onClick={handleSearchSuspect}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Suspect</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH & RECOVERED CONTRABAND */}
          {activeTab === 'search' && (
            <div className="flex flex-col gap-4">
              {!isSearched ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-100 uppercase">
                      Suspect Has Not Been Frisked Yet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Conduct a thorough pat-down of {suspect.name}'s waistband, jacket pockets, and boots to uncover stolen items, concealed weapons, and contraband.
                    </p>
                  </div>
                  <button
                    onClick={handleSearchSuspect}
                    className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Conduct Full Field Search</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-[11px] font-['Chakra_Petch'] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Search Completed · Recovered Property:</span>
                  </div>

                  {/* Cash */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 font-['Chakra_Petch'] uppercase">
                          Stolen Street Cash & Loose Bills
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Found in suspect's wallet and jacket lining. Untraceable street bills.
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-base">
                      +${suspectCash.toLocaleString()}
                    </span>
                  </div>

                  {/* Weapon */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 font-['Chakra_Petch'] uppercase">
                          {suspectWeapon}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Serial numbers ground off. Ballistics match pending with crime scene.
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700/60 px-2 py-0.5 rounded uppercase">
                      ILLEGAL FIREARM
                    </span>
                  </div>

                  {/* Valuable Evidence Item */}
                  <div className="bg-slate-900/70 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                        <Gem className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300 font-['Chakra_Petch'] uppercase">
                          {defaultValuable.name}
                        </div>
                        <div className="text-[11px] text-slate-400 max-w-sm">
                          {defaultValuable.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        ${defaultValuable.estimatedValue.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono uppercase">
                        STREET VALUE
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('decision')}
                    className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Officer Carter's Choice</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARTER'S DOUBLE-LIFE CHOICES */}
          {activeTab === 'decision' && (
            <div className="flex flex-col gap-3">
              {decisionMade && (
                <div className="bg-emerald-950/60 border border-emerald-500 p-2.5 rounded-xl text-center text-xs font-bold text-emerald-300 font-['Chakra_Petch'] uppercase">
                  Action Executed · Decision Logged
                </div>
              )}

              {/* OPTION 1: LAWFUL POLICE WORK */}
              <div className={`p-4 rounded-xl border transition-all ${
                decisionMade === 'lawful'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 font-['Chakra_Petch'] uppercase">
                      Option A: Lawful Police Booking
                    </span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      +16 POLICE REP · -10 SUSPICION
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    +$350 CLEAN SALARY
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Formally log the ${suspectCash.toLocaleString()}, defaced weapon, and {defaultValuable.name} into Precinct 9 evidence custody. Maintain honorable police record and lower internal scrutiny.
                </p>
                <button
                  onClick={handleLawfulBooking}
                  disabled={!!decisionMade}
                  className={`w-full py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    decisionMade === 'lawful'
                      ? 'bg-emerald-600 text-white'
                      : decisionMade
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow active:scale-98'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{decisionMade === 'lawful' ? 'BOOKED INTO OFFICIAL CUSTODY' : 'BOOK ALL RECOVERED ITEMS LEGITIMATELY'}</span>
                </button>
              </div>

              {/* OPTION 2: SHADY POCKETING */}
              <div className={`p-4 rounded-xl border transition-all ${
                decisionMade === 'shady'
                  ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 font-['Chakra_Petch'] uppercase">
                      Option B: Secretly Pocket Cash & Keep Valuables
                    </span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      +18 UNDERWORLD · +12 SUSPICION
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    +${suspectCash.toLocaleString()} DIRTY CASH
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Slip the stolen ${suspectCash.toLocaleString()} directly into Carter's personal pocket and stash {defaultValuable.name} off the books. {witnessesNearby > 0 ? 'Warning: Civilians are nearby!' : 'No witnesses watching.'}
                </p>
                <button
                  onClick={handleShadyPocketing}
                  disabled={!!decisionMade}
                  className={`w-full py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    decisionMade === 'shady'
                      ? 'bg-amber-600 text-slate-950'
                      : decisionMade
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow active:scale-98'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{decisionMade === 'shady' ? 'POCKETED OFF-THE-RECORD' : 'POCKET STOLEN CASH & KEEP VALUABLE'}</span>
                </button>
              </div>

              {/* OPTION 3: STREET SHAKEDOWN */}
              <div className={`p-4 rounded-xl border transition-all ${
                decisionMade === 'extort'
                  ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400 font-['Chakra_Petch'] uppercase">
                      Option C: Shakedown for Bribe Payoff
                    </span>
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      +26 UNDERWORLD · +18 SUSPICION
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-400">
                    +$800+ BRIBE PAYOFF
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Shake down {suspect.name} for an untraceable cash bribe payoff in exchange for keeping quiet on syndicate ties.
                </p>
                <button
                  onClick={handleExtortSuspect}
                  disabled={!!decisionMade}
                  className={`w-full py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    decisionMade === 'extort'
                      ? 'bg-purple-600 text-white'
                      : decisionMade
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-700 hover:bg-purple-600 text-white shadow active:scale-98'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{decisionMade === 'extort' ? 'BRIBE COLLECTED' : 'EXTORT CASH BRIBE PAYOFF'}</span>
                </button>
              </div>

              {/* OPTION 4: HELP CRIMINAL ESCAPE */}
              <div className={`p-4 rounded-xl border transition-all ${
                decisionMade === 'escape'
                  ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-red-500/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 font-['Chakra_Petch'] uppercase">
                      Option D: Unlock Handcuffs & Help Criminal Escape
                    </span>
                    <span className="text-[9px] bg-red-950 text-red-300 border border-red-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      +40 UNDERWORLD · +25 SUSPICION
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-red-400">
                    +$1,200+ ESCAPE BOUNTY
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Quietly unlock the cuffs and point {suspect.name} to the back alley. Earn massive syndicate respect and secret cash payoff.
                </p>
                <button
                  onClick={handleHelpEscape}
                  disabled={!!decisionMade}
                  className={`w-full py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    decisionMade === 'escape'
                      ? 'bg-red-600 text-white'
                      : decisionMade
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-red-700 hover:bg-red-600 text-white shadow active:scale-98'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{decisionMade === 'escape' ? 'CRIMINAL CUT LOOSE' : 'UNLOCK CUFFS & AID ESCAPE (+$1,200+)'}</span>
                </button>
              </div>

              {/* OPTION 5: MANIPULATE EVIDENCE */}
              <div className={`p-4 rounded-xl border transition-all ${
                decisionMade === 'tamper'
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 font-['Chakra_Petch'] uppercase">
                      Option E: Secretly Manipulate Evidence Report
                    </span>
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      +25 UNDERWORLD · +18 SUSPICION
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    +$650 FIXER PAY
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Redact the suspect's name and replace ballistics records in exchange for an underworld fixer payment.
                </p>
                <button
                  onClick={handleTamperEvidence}
                  disabled={!!decisionMade}
                  className={`w-full py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    decisionMade === 'tamper'
                      ? 'bg-indigo-600 text-white'
                      : decisionMade
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-700 hover:bg-indigo-600 text-white shadow active:scale-98'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>{decisionMade === 'tamper' ? 'EVIDENCE REPORT ALTERED' : 'DOCTOR CASE FILE FOR UNDERWORLD FIXER'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Prisoner Transport & Close */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {transportCalled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 10-75 Prisoner Van Dispatched! Booked at Precinct 9 Lockup
              </span>
            ) : (
              <span>Request marked police transport to secure prisoner.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!transportCalled && decisionMade !== 'escape' && (
              <button
                onClick={handleCallTransport}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Call Prisoner Transport (+$300)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-['Chakra_Petch'] text-xs font-bold uppercase transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
