import React from 'react';
import {
  Shield,
  DollarSign,
  AlertTriangle,
  Scale,
  X,
  Lock,
  Camera,
  Coins,
  FileCheck2,
} from 'lucide-react';
import { InteriorInteractable } from '../game/engine/BuildingInteriors';
import { FictionalValuable } from '../types/game';
import { soundEngine } from '../game/audio/SoundEffects';

export interface ValuablesChoiceResult {
  reputationDelta: number;
  policeRepDelta?: number;
  underworldRepDelta?: number;
  suspicionDelta?: number;
  moneyDelta: number;
  legitimateMoneyDelta?: number;
  dirtyMoneyDelta?: number;
  xpDelta: number;
  iaViolationDelta?: number;
  evidenceDelta?: number;
  civiliansDelta?: number;
  clearIaViolations?: boolean;
  valuableReward?: FictionalValuable;
  notificationText: string;
  isGood: boolean;
}

interface BankValuablesModalProps {
  isOpen: boolean;
  interactable: InteriorInteractable | null;
  onClose: () => void;
  onApplyResult: (result: ValuablesChoiceResult) => void;
  carterReputation: number;
}

export const BankValuablesModal: React.FC<BankValuablesModalProps> = ({
  isOpen,
  interactable,
  onClose,
  onApplyResult,
  carterReputation,
}) => {
  if (!isOpen || !interactable) return null;

  const type = interactable.type;

  const handleChoose = (isGood: boolean) => {
    if (isGood) {
      soundEngine.playRadioChime();
    } else {
      soundEngine.playMegaphoneChime();
    }

    let result: ValuablesChoiceResult;

    if (type === 'bank_teller') {
      if (isGood) {
        result = {
          reputationDelta: 15,
          policeRepDelta: 15,
          underworldRepDelta: -5,
          suspicionDelta: -10,
          moneyDelta: 200,
          legitimateMoneyDelta: 200,
          dirtyMoneyDelta: 0,
          xpDelta: 75,
          notificationText: 'Conducted official bank security audit! +$200 Commendation Pay (+15 Police Rep, -10 Suspicion)',
          isGood: true,
        };
      } else {
        const val: FictionalValuable = {
          id: `val_teller_${Date.now()}`,
          name: 'Unmarked Bank Stacks',
          estimatedValue: 650,
          category: 'contraband',
          description: 'Unregistered banded cash taken from commercial bank teller drawers.',
          source: '1st National Metro Bank',
          sourceLocation: 'Bank Teller Drawer',
          isContraband: true,
        };
        result = {
          reputationDelta: -15,
          policeRepDelta: -15,
          underworldRepDelta: 20,
          suspicionDelta: 18,
          moneyDelta: 650,
          legitimateMoneyDelta: 0,
          dirtyMoneyDelta: 650,
          xpDelta: 50,
          iaViolationDelta: 1,
          valuableReward: val,
          notificationText: 'Pocketed $650 unmarked cash stacks under Carter badge! (+20 Underworld Trust, +18 IA Suspicion)',
          isGood: false,
        };
      }
    } else if (type === 'manager_safe') {
      if (isGood) {
        result = {
          reputationDelta: 25,
          policeRepDelta: 25,
          underworldRepDelta: -10,
          suspicionDelta: -15,
          moneyDelta: 0,
          xpDelta: 125,
          evidenceDelta: 1,
          notificationText: 'Verified corporate bearer bonds & filed chain of custody! (+25 Police Rep, -15 Suspicion, +1 Evidence)',
          isGood: true,
        };
      } else {
        const val: FictionalValuable = {
          id: `val_bonds_${Date.now()}`,
          name: 'Corporate Bearer Bonds',
          estimatedValue: 2500,
          category: 'bearer_bonds',
          description: 'High-value anonymous financial certificates recovered from executive wall safe.',
          source: 'Metro Bank Executive Safe',
          sourceLocation: 'Manager Office Safe',
          isContraband: true,
        };
        result = {
          reputationDelta: -30,
          policeRepDelta: -30,
          underworldRepDelta: 35,
          suspicionDelta: 25,
          moneyDelta: 1200,
          legitimateMoneyDelta: 0,
          dirtyMoneyDelta: 1200,
          xpDelta: 75,
          iaViolationDelta: 1,
          valuableReward: val,
          notificationText: 'Seized Corporate Bearer Bonds ($2,500) + $1,200 dirty cash! (+35 Underworld Trust, +25 Suspicion)',
          isGood: false,
        };
      }
    } else if (type === 'vault_gold') {
      if (isGood) {
        result = {
          reputationDelta: 40,
          policeRepDelta: 40,
          underworldRepDelta: -15,
          suspicionDelta: -20,
          moneyDelta: 600,
          legitimateMoneyDelta: 600,
          dirtyMoneyDelta: 0,
          xpDelta: 300,
          civiliansDelta: 3,
          notificationText: 'Secured Federal Reserve Gold Bullion & logged manifest! +$600 Federal Commendation (+40 Police Rep, -20 Suspicion)',
          isGood: true,
        };
      } else {
        const val: FictionalValuable = {
          id: `val_gold_${Date.now()}`,
          name: '24K Metro Gold Bullion',
          estimatedValue: 5000,
          category: 'gold_bar',
          description: 'Solid 24-karat stamped gold bullion bar from the reinforced master vault.',
          source: '1st National Master Vault',
          sourceLocation: 'Bank Master Vault',
          isContraband: true,
        };
        result = {
          reputationDelta: -45,
          policeRepDelta: -45,
          underworldRepDelta: 50,
          suspicionDelta: 35,
          moneyDelta: 3000,
          legitimateMoneyDelta: 0,
          dirtyMoneyDelta: 3000,
          xpDelta: 100,
          iaViolationDelta: 1,
          valuableReward: val,
          notificationText: 'Concealed 24K Metro Gold Bullion ($5,000) in duty bag! +$3,000 Dirty Cash (+50 Underworld Trust, +35 Suspicion)',
          isGood: false,
        };
      }
    } else if (type === 'cctv_console') {
      if (isGood) {
        result = {
          reputationDelta: 10,
          policeRepDelta: 10,
          underworldRepDelta: -5,
          suspicionDelta: -12,
          moneyDelta: 0,
          xpDelta: 100,
          evidenceDelta: 1,
          notificationText: 'Downloaded bank robbery surveillance logs to police database! (+100 XP, +10 Police Rep, -12 Suspicion)',
          isGood: true,
        };
      } else {
        result = {
          reputationDelta: -5,
          policeRepDelta: -5,
          underworldRepDelta: 25,
          suspicionDelta: -30,
          moneyDelta: 0,
          xpDelta: 75,
          clearIaViolations: true,
          notificationText: 'Overwrote CCTV hard drives! Internal Affairs surveillance deleted & suspicion wiped clean (-30 Suspicion).',
          isGood: false,
        };
      }
    } else if (type === 'backroom_safe') {
      if (isGood) {
        result = {
          reputationDelta: 15,
          policeRepDelta: 15,
          underworldRepDelta: -5,
          suspicionDelta: -10,
          moneyDelta: 150,
          legitimateMoneyDelta: 150,
          dirtyMoneyDelta: 0,
          xpDelta: 50,
          notificationText: 'Impounded contraband delivery & sealed evidence! +$150 Clean Pay (+15 Police Rep, -10 Suspicion)',
          isGood: true,
        };
      } else {
        const val: FictionalValuable = {
          id: `val_smuggler_${Date.now()}`,
          name: 'Smuggler Cash Envelope',
          estimatedValue: 500,
          category: 'contraband',
          description: 'Unmarked cash envelope found hidden in bodega backroom.',
          sourceLocation: 'Bodega Backroom',
          isContraband: true,
        };
        result = {
          reputationDelta: -15,
          policeRepDelta: -15,
          underworldRepDelta: 20,
          suspicionDelta: 18,
          moneyDelta: 500,
          legitimateMoneyDelta: 0,
          dirtyMoneyDelta: 500,
          xpDelta: 40,
          iaViolationDelta: 1,
          valuableReward: val,
          notificationText: 'Pocketed smuggler cash envelope +$500 dirty cash! (+20 Underworld Trust, +18 Suspicion)',
          isGood: false,
        };
      }
    } else {
      result = {
        reputationDelta: 5,
        moneyDelta: 50,
        xpDelta: 30,
        notificationText: 'Scene secured.',
        isGood: true,
      };
    }

    onApplyResult(result);
    onClose();
  };

  // Determine narrative card details based on interactable type
  const getContent = () => {
    switch (type) {
      case 'bank_teller':
        return {
          title: 'TELLER SERVICE COUNTER & CASH DRAWER',
          context:
            'Officer Carter inspects the bank teller counter. Stacks of fresh, uncirculated bank notes sit alongside the daily branch transaction log.',
          prompt: 'How does Officer Carter handle the teller cash?',
          good: {
            title: 'OFFICIAL SECURITY AUDIT',
            tag: 'LAWFUL DUTY',
            desc: 'Inspect cash drawer seals, countersign the branch ledger, and log official police surveillance.',
            perks: '+$200 Commendation Pay · +15 Rep · +75 XP',
            dialogue: '"Everything checks out on the counter. Keep this drawer locked, ma\'am."',
          },
          shady: {
            title: 'POCKET UNMARKED STACKS',
            tag: 'BAD COP PROFIT',
            desc: "Slip banded stacks of $100 bills into Carter's tactical pocket while the teller turns away.",
            perks: '+$650 Dirty Cash · Adds Unmarked Cash to Valuables · -15 Rep',
            dialogue: '"Consider this an on-site hazardous duty assessment fee."',
          },
        };
      case 'manager_safe':
        return {
          title: "MANAGER'S EXECUTIVE WALL SAFE",
          context:
            'Behind the mahogany desk, the heavy executive wall safe is unlocked for quarterly inspection. Sealed portfolios and corporate bearer bonds are stacked inside.',
          prompt: 'How does Carter handle the high-value bearer bonds?',
          good: {
            title: 'CHAIN OF CUSTODY AUDIT',
            tag: 'LAWFUL DUTY',
            desc: 'Verify the certificate serial numbers, stamp the custody logs, and file with the Precinct 9 dossier.',
            perks: '+25 Rep · +125 XP · +1 Evidence Logged',
            dialogue: '"Precinct 9 has officially verified the chain of custody. Clean and accounted for."',
          },
          shady: {
            title: 'SEIZE CORPORATE BONDS',
            tag: 'BAD COP PROFIT',
            desc: 'Pocket the confidential bearer bonds. Completely untraceable and redeemable for thousands on the street.',
            perks: '+$1,200 Cash · Adds Corporate Bonds ($2,500) · -30 Rep · +1 IA Violation',
            dialogue: '"What the corporate auditors don\'t see in the ledger won\'t hurt them."',
          },
        };
      case 'vault_gold':
        return {
          title: 'MASTER VAULT GOLD BULLION CHAMBER',
          context:
            'Inside the fortified blast chamber, steel pallets hold stacks of gleaming 24-karat stamped gold bullion bars and insured reserve assets.',
          prompt: 'How does Officer Carter handle the gold bullion reserve?',
          good: {
            title: 'SECURE FEDERAL GOLD RESERVES',
            tag: 'LAWFUL DUTY',
            desc: 'Radio the Federal Reserve escort, secure the blast perimeter, and safeguard the city treasury.',
            perks: '+$600 Federal Bonus · +40 Rep · +300 XP · +3 Civilians Protected',
            dialogue: '"Precinct 9 on-site. The vault reserves are locked down tight and fully secured."',
          },
          shady: {
            title: 'CONCEAL 24K GOLD BULLION BAR',
            tag: 'BAD COP PROFIT',
            desc: "Conceal a stamped 24-karat solid gold bar inside Carter's tactical duty bag. Pure gold always buys loyalty.",
            perks: '+$3,000 Dirty Cash · Adds 24K Gold Bar ($5,000) · -45 Rep · +1 IA Violation',
            dialogue: '"One less gold bar in the vault... nobody audits the fractional weight."',
          },
        };
      case 'cctv_console':
        return {
          title: 'BANK CCTV SURVEILLANCE CONSOLE',
          context:
            'The digital security rack monitors every corridor, teller window, and vault portal in the bank on crisp high-definition monitors.',
          prompt: 'How does Carter utilize the security recordings?',
          good: {
            title: 'DOWNLOAD ROBBERY SUSPECT INTEL',
            tag: 'LAWFUL DUTY',
            desc: 'Extract footage of known syndicate operatives and import facial matches into the police database.',
            perks: '+100 XP · +10 Rep · +1 Case Evidence Added',
            dialogue: '"Exporting timestamps to the precinct server. This will make for solid prosecution evidence."',
          },
          shady: {
            title: 'WIPE SECURITY DVR & FORMAT TAPES',
            tag: 'BAD COP COVERUP',
            desc: "Format the storage partitions and purge today's logs. Any questionable actions Carter took inside will vanish completely.",
            perks: 'Resets Internal Affairs Violations & Police Heat to 0 · Clean Record',
            dialogue: '"Server error. Glitched tape drive. As far as the department knows, I was never here."',
          },
        };
      default:
        return {
          title: 'BODEGA BACKROOM STASH',
          context: 'A locked safe sits behind crates of imported merchandise, holding envelopes of unrecorded cash.',
          prompt: 'How does Officer Carter handle the contraband?',
          good: {
            title: 'SEAL & IMPOUND EVIDENCE',
            tag: 'LAWFUL DUTY',
            desc: 'Impound the goods and log into official evidence bags.',
            perks: '+$150 Bonus · +15 Rep · +50 XP',
            dialogue: '"Bagged and tagged. Going straight to the precinct evidence room."',
          },
          shady: {
            title: 'POCKET CASH ENVELOPE',
            tag: 'BAD COP PROFIT',
            desc: 'Pocket the cash envelope and let the shopkeeper continue operating without a citation.',
            perks: '+$500 Cash · Adds Contraband · -15 Rep',
            dialogue: '"I\'ll look the other way this time. Keep your shelves clean."',
          },
        };
    }
  };

  const content = getContent();

  const getRepStanding = (rep: number) => {
    if (rep >= 80) return { label: 'INCORRUPTIBLE PROTECTOR', color: 'text-blue-400' };
    if (rep >= 60) return { label: 'BY-THE-BOOK OFFICER', color: 'text-emerald-400' };
    if (rep >= 40) return { label: 'STREET PRAGMATIST', color: 'text-amber-400' };
    if (rep >= 20) return { label: 'COMPROMISED BAD COP', color: 'text-orange-400' };
    return { label: 'ROGUE STREET KINGPIN', color: 'text-red-400' };
  };

  const standing = getRepStanding(carterReputation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none font-['Inter',sans-serif] animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-amber-400 tracking-wider">
                  INTERIOR VALUABLES CALL
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  OFFICER CARTER
                </span>
              </div>
              <h3 className="font-['Chakra_Petch'] font-bold text-base text-slate-100 uppercase tracking-wide truncate max-w-xs sm:max-w-md">
                {content.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Context */}
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-3 text-xs flex flex-col gap-1.5">
          <p className="text-slate-300 italic font-serif leading-relaxed">
            "{content.context}"
          </p>
          <div className="text-[11px] font-['Chakra_Petch'] font-semibold text-amber-400 flex items-center gap-1.5 uppercase pt-1 border-t border-slate-800/50">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{content.prompt}</span>
          </div>
        </div>

        {/* Choice Cards (Good vs Shady) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* GOOD OPTION */}
          <button
            onClick={() => handleChoose(true)}
            className="group text-left bg-gradient-to-b from-blue-950/40 to-slate-900/80 hover:from-blue-900/50 hover:to-slate-800/90 border border-blue-500/40 hover:border-blue-400 rounded-xl p-3.5 transition-all shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-['Chakra_Petch'] font-bold text-[10px] uppercase flex items-center gap-1 border border-blue-500/30">
                  <Shield className="w-3 h-3 text-blue-400" />
                  {content.good.tag}
                </span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">
                  +COMMENDED
                </span>
              </div>
              <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100 group-hover:text-blue-300 transition-colors">
                {content.good.title}
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                {content.good.desc}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              <div className="text-[10px] font-mono font-semibold text-emerald-400">
                {content.good.perks}
              </div>
              <div className="text-[10px] text-slate-400 italic">
                {content.good.dialogue}
              </div>
            </div>
          </button>

          {/* SHADY OPTION */}
          <button
            onClick={() => handleChoose(false)}
            className="group text-left bg-gradient-to-b from-amber-950/30 to-slate-900/80 hover:from-amber-900/40 hover:to-slate-800/90 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 transition-all shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-['Chakra_Petch'] font-bold text-[10px] uppercase flex items-center gap-1 border border-amber-500/30">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  {content.shady.tag}
                </span>
                <span className="text-amber-400 font-mono font-bold text-[11px]">
                  +HIGH VALUE
                </span>
              </div>
              <div className="font-['Chakra_Petch'] font-bold text-xs uppercase text-slate-100 group-hover:text-amber-300 transition-colors">
                {content.shady.title}
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                {content.shady.desc}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              <div className="text-[10px] font-mono font-semibold text-amber-300">
                {content.shady.perks}
              </div>
              <div className="text-[10px] text-slate-400 italic">
                {content.shady.dialogue}
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Standing Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Carter Moral Standing:</span>
            <span className={`font-bold ${standing.color}`}>{standing.label}</span>
            <span className="text-slate-500">({carterReputation}/100)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 uppercase font-['Chakra_Petch'] text-[10px] tracking-wider transition-colors"
          >
            Leave As-Is (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
