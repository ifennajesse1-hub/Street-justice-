import { PlayerStats } from '../../types/game';

export interface RankInfo {
  rank: number;
  name: string;
  minXP: number;
  unlockedEquipment: string[];
  perkDescription: string;
}

export const RANKS: RankInfo[] = [
  {
    rank: 1,
    name: 'Rookie Officer',
    minXP: 0,
    unlockedEquipment: ['Vortex-9 Service Pistol', 'Pulse-Taser Non-Lethal', 'Police Handcuffs'],
    perkDescription: 'Precinct 9 Standard Duty. Basic arrest and patrol authority.',
  },
  {
    rank: 2,
    name: 'Patrol Officer',
    minXP: 600,
    unlockedEquipment: ['Tactical Police Flashlight', 'Kevlar Vest Level I', 'Field Trauma First-Aid Kit'],
    perkDescription: 'Flashlight inspection unlocked. +25 Armor capacity. First-aid healing active.',
  },
  {
    rank: 3,
    name: 'Senior Officer',
    minXP: 1500,
    unlockedEquipment: ['Specter-45 Tactical SMG', 'Police Dispatch Backup Radio', 'Intimidation Command'],
    perkDescription: 'Can command suspects to drop weapons and call backup patrol units to the scene.',
  },
  {
    rank: 4,
    name: 'Detective',
    minXP: 3000,
    unlockedEquipment: ['Tactical Forensic Camera', 'Crime Scene Evidence Kit', 'Undercover Trench Coat'],
    perkDescription: 'Forensic camera unlocked. Photograph clues to build syndicate cases.',
  },
  {
    rank: 5,
    name: 'Sergeant',
    minXP: 5500,
    unlockedEquipment: ['Apex-12 Breacher Shotgun', 'Heavy Tactical SWAT Armor', 'Tactical SWAT Cruiser'],
    perkDescription: '+50 Max Armor. Command street roadblocks during vehicle chases.',
  },
  {
    rank: 6,
    name: 'Lieutenant',
    minXP: 9000,
    unlockedEquipment: ['Titan-AR Assault Rifle', 'Armored SWAT Transport'],
    perkDescription: 'High-threat syndicate clearance. SWAT assault support enabled.',
  },
  {
    rank: 7,
    name: 'Captain',
    minXP: 14000,
    unlockedEquipment: ['Tactical Air Support Chopper', 'Special Weapons Locker'],
    perkDescription: 'Precinct tactical commander. Unlimited reserve ammunition supply.',
  },
  {
    rank: 8,
    name: 'Police Chief',
    minXP: 20000,
    unlockedEquipment: ['Golden Service Revolver', 'City Medal of Valor'],
    perkDescription: 'Supreme authority over Metro City Police Department.',
  },
];

export function getRankForXP(xp: number): RankInfo {
  let currentRank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) {
      currentRank = r;
    } else {
      break;
    }
  }
  return currentRank;
}

export const INITIAL_PLAYER_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  armor: 50,
  maxArmor: 100,
  money: 500,
  xp: 0,
  rank: 1,
  rankName: 'Rookie Officer',
  wantedLevel: 0,
  wantedCooldown: 0,
  kills: 0,
  arrests: 0,
  missionsCompleted: 0,
  reputation: 85, // 0 to 100 (Internal Affairs standing)
  integrity: 80, // 0 to 100: Moral Integrity (80 = By-the-Book Officer)
  bankSavings: 1200, // Starting insured bank balance in Metro Corporate Bank
  valuables: [
    {
      id: 'val_starting_watch',
      name: 'Engraved Silver Pocket Watch',
      category: 'watch',
      description: 'Heirloom pocket watch passed down from your grandfather, a legendary Precinct 9 Captain.',
      estimatedValue: 350,
      isStolenOrEvidence: false,
      sourceLocation: 'Personal Family Heirloom',
    },
  ],
  vaultValuables: [],
  backupCooldown: 0,
  iaViolations: 0,
  civiliansRescued: 0,
  evidenceFound: 0,
  flashlightOn: false,
  cameraMode: false,
  equippedGear: {
    firstAidKits: 2,
    handcuffsCount: 4,
    evidenceBags: 10,
    policeRadioLevel: 1,
  },
};
