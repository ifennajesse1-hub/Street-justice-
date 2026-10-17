import { Mission } from '../../types/game';

export const STORY_MISSIONS: Mission[] = [
  {
    id: 'ch1_first_patrol',
    chapter: 1,
    title: 'Chapter 1: Rookie — First Patrol',
    subtitle: 'Street Gang Disturbance',
    description: 'Dispatch reports Neon Python street gang members harassing pedestrians and tagging the commercial plaza alley. Move in, assess the threat, and arrest or neutralize the suspects.',
    mode: 'story',
    rewardMoney: 450,
    rewardXP: 300,
    requiredRank: 1,
    unlocked: true,
    completed: false,
    objectives: [
      {
        id: 'obj_1',
        description: 'Patrol to the commercial alleyway',
        targetType: 'reach',
        targetPos: { x: -28, y: 0, z: -20 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_2',
        description: 'Neutralize or arrest 3 street gang suspects',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 3,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Dispatch: "Unit 24, Officer Carter. Reports of armed Neon Python gang activity near the Sector 4 commercial alley."',
      'Alex Carter: "10-4 Dispatch. Rolling to the scene on foot now. Will assess and intervene."',
    ],
    dialogueOutro: [
      'Alex Carter: "Dispatch, suspects neutralized. Alley secured. Found Neon Python spray tags and recovered stolen contraband."',
      'Dispatch: "Copy that, Officer. Good work. Residents report the avenue is peaceful again."',
    ],
  },
  {
    id: 'ch2_cedar_defense',
    chapter: 2,
    title: 'Chapter 2: Protecting Cedar Heights',
    subtitle: 'Neighborhood Defense',
    description: 'A crew of Cobalt Skulls bikers have invaded Cedar Heights, attempting to extort Marcus Washington at his auto repair garage and Mama Leah at her kitchen. Protect the community businesses!',
    mode: 'story',
    rewardMoney: 950,
    rewardXP: 600,
    requiredRank: 1,
    unlocked: false,
    completed: false,
    objectives: [
      {
        id: 'obj_reach_cedar',
        description: "Respond to Marcus's Auto Repair in Cedar Heights",
        targetType: 'reach',
        targetPos: { x: -60, y: 0, z: -20 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_protect_community',
        description: 'Defeat or arrest the 3 Cobalt Skulls extortionists',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 3,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Marcus Washington: "Officer Carter! Thank goodness you are here. Those Cobalt Skulls tried threatening our shop and the diner down the block."',
      'Alex Carter: "Stay inside Marcus, I have your back. Cedar Heights is under our protection."',
    ],
    dialogueOutro: [
      'Mama Leah: "God bless you, Officer Carter! You stood up for our neighborhood when it counted."',
      'Alex Carter: "Always, Mama Leah. We protect our community."',
    ],
  },
  {
    id: 'ch3_highway_pursuit',
    chapter: 3,
    title: 'Chapter 3: The Highway Chase',
    subtitle: 'Cobalt Skulls Getaway Pursuit',
    description: 'A modified blue Cobalt Skulls getaway muscle car has fled the scene towards the avenue! Get into your police cruiser, engage the sirens, and disable the suspect vehicle!',
    mode: 'chase',
    rewardMoney: 1500,
    rewardXP: 900,
    requiredRank: 2,
    unlocked: false,
    completed: false,
    objectives: [
      {
        id: 'obj_enter_car',
        description: 'Enter your Police Cruiser and engage emergency sirens',
        targetType: 'reach',
        targetPos: { x: -25, y: 0, z: 28 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_stop_car',
        description: 'Chase down and disable the Cobalt Skulls Getaway Vehicle',
        targetType: 'chase_stop',
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Dispatch: "ALL UNITS: Suspect vehicle is a blue Cobalt Skulls muscle car fleeing the industrial avenue at high speed!"',
      'Alex Carter: "In pursuit! Sirens engaged, executing precision vehicle maneuver!"',
    ],
    dialogueOutro: [
      'Alex Carter: "Suspect vehicle disabled and boxed in! Driver in custody. Requesting transport tow."',
      'Dispatch: "Suspect vehicle secured, outstanding pursuit driving Officer Carter!"',
    ],
  },
  {
    id: 'ch4_bank_hostage',
    chapter: 4,
    title: 'Chapter 4: The Eclipse Syndicate Siege',
    subtitle: 'Metro Bank Vault Incident',
    description: 'The shadowy Eclipse Syndicate extremist crime ring has breached Metro Bank with heavy ordnance and taken bank staff hostage. Aegis Defense Taskforce soldiers have established an outer cordon. Breach the plaza and eliminate the raiders!',
    mode: 'story',
    rewardMoney: 2400,
    rewardXP: 1500,
    requiredRank: 3,
    unlocked: false,
    completed: false,
    objectives: [
      {
        id: 'obj_reach_bank',
        description: 'Advance to Metro Bank Financial Plaza',
        targetType: 'reach',
        targetPos: { x: 45, y: 0, z: -35 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_clear_bank',
        description: 'Neutralize the 4 Eclipse Syndicate operatives',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 4,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Alex Carter: "Dispatch, arriving at Metro Bank. High-tech Syndicate operatives spotted in stealth gear."',
      'Aegis Commander: "Officer Carter, this is Aegis Taskforce Unit 1. We are providing perimeter suppression. Move in and secure the civilians!"',
    ],
    dialogueOutro: [
      'Alex Carter: "Syndicate operatives neutralized! Bank vault intact, all civilians safely evacuated."',
      'Captain Miller: "Flawless tactical entry, Carter. You neutralized a catastrophic heist."',
    ],
  },
  {
    id: 'ch5_viper_showdown',
    chapter: 5,
    title: 'Chapter 5: Final Showdown — Viper Vance',
    subtitle: 'Harbor Compound Stronghold',
    description: 'Syndicate kingpin "Viper" Vance has barricaded himself at the deep logistics docks with heavy weapons, fortified crates, and Iron Viper enforcers. End his reign over the city streets!',
    mode: 'story',
    rewardMoney: 5000,
    rewardXP: 2500,
    requiredRank: 4,
    unlocked: false,
    completed: false,
    objectives: [
      {
        id: 'obj_boss',
        description: 'Defeat Kingpin "Viper" Vance at the industrial docks',
        targetType: 'kill',
        targetPos: { x: 65, y: 0, z: 65 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Viper Vance: "You think your badge gives you jurisdiction over my harbor, Carter? You won\'t walk out of these docks alive!"',
      'Alex Carter: "Your empire of street crime ends today, Vance. Step away from the weapon!"',
    ],
    dialogueOutro: [
      'Alex Carter: "Viper Vance is down. Harbor complex secured. All illegal munitions confiscated."',
      'Police Chief: "Detective Carter, for protecting every street and neighborhood in this city, you have earned the Precinct Medal of Honor!"',
    ],
  },
  {
    id: 'ch6_precinct_special_ops',
    chapter: 6,
    title: 'Chapter 6: Precinct 9 Special Operations Taskforce',
    subtitle: 'High-Trust Police Assignment',
    description: 'Police Chief Morrison has personally assigned Officer Carter to lead the joint precinct tactical taskforce to breach an armed syndicate distribution node. Requires 60%+ Police Trust to unlock.',
    mode: 'story',
    rewardMoney: 3800,
    rewardXP: 1900,
    requiredRank: 3,
    requiredPoliceTrust: 60,
    unlocked: false,
    completed: false,
    objectives: [
      {
        id: 'obj_spec_ops_reach',
        description: 'Lead Precinct 9 taskforce to the commercial distribution hub',
        targetType: 'reach',
        targetPos: { x: -35, y: 0, z: 35 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_spec_ops_clear',
        description: 'Neutralize or arrest 4 fortified syndicate operatives',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 4,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Police Chief: "Officer Carter, your outstanding police trust and clean departmental record have earned you tactical command of this raid."',
      'Alex Carter: "Understood Chief. Units 24 and SWAT are moving to secure the scene by the book."',
    ],
    dialogueOutro: [
      'Police Chief: "Flawless leadership, Carter. Department commendation filed in your permanent precinct dossier."',
      'Alex Carter: "All suspects in custody, contraband booked cleanly into evidence."',
    ],
  },
  {
    id: 'ch7_the_last_badge',
    chapter: 7,
    title: 'Chapter 7: THE LAST BADGE',
    subtitle: 'The Reckoning of Carter\'s Secrets',
    description: 'An anonymous blackmailer has discovered Officer Carter\'s classified double life—the off-the-books bribes, illegal syndicate connections, and withheld evidence. Carter receives a cryptic summons to Harbor Pier 4 Warehouse. With rogue mercenaries lying in ambush, Carter must confront his past, fight for his life, and make the definitive moral choice that determines his ultimate fate.',
    mode: 'story',
    rewardMoney: 12000,
    rewardXP: 6000,
    requiredRank: 3,
    unlocked: true,
    completed: false,
    objectives: [
      {
        id: 'obj_reach_pier4',
        description: 'Respond to the Anonymous Blackmailer at Harbor Pier 4 Warehouse',
        targetType: 'reach',
        targetPos: { x: 50, y: 0, z: 50 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_neutralize_mercenaries',
        description: 'Neutralize the 4 Rogue Ambush Mercenaries',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 4,
        isCompleted: false,
      },
      {
        id: 'obj_recover_dossier',
        description: 'Recover the Classified Double-Life Blackmail Dossier & Drive',
        targetType: 'collect',
        targetPos: { x: 50, y: 0, z: 50 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Encrypted Comm: "Officer Alex Carter. Badge #4409. We have your ledgers, audio wiretaps, and crime scene payoffs. Harbor Pier 4 Warehouse. Come alone, or the entire precinct gets the files."',
      'Alex Carter: "My past has finally caught up with me. I have to reach Pier 4 and secure that dossier before everything burns to the ground."',
    ],
    dialogueOutro: [
      'Wounded Blackmailer: "You defeated my men, Carter... but you can\'t outrun who you are. What are you going to do with the files?"',
      'Alex Carter: "That depends on what kind of officer I want to be when the smoke clears."',
    ],
  },
  {
    id: 'ch8_death_before_betrayal',
    chapter: 8,
    title: 'Chapter 8: DEATH BEFORE BETRAYAL',
    subtitle: 'The Final Campaign Reckoning',
    description: 'The supreme leader of the syndicate organization, Julian "The Architect" Vance, has barricaded the industrial logistics depot with wired hostages. He knows Carter\'s double life and forces a lethal ultimatum: walk away and save yourself, or risk everything to save the people.',
    mode: 'story',
    rewardMoney: 15000,
    rewardXP: 8000,
    requiredRank: 4,
    unlocked: true,
    completed: false,
    objectives: [
      {
        id: 'obj_reach_compound',
        description: 'Advance to the Industrial Logistics Depot Stronghold',
        targetType: 'reach',
        targetPos: { x: 55, y: 0, z: -50 },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: 'obj_neutralize_elites',
        description: 'Neutralize the 5 Syndicate Heavy Operatives',
        targetType: 'kill',
        currentCount: 0,
        requiredCount: 5,
        isCompleted: false,
      },
      {
        id: 'obj_rescue_hostages',
        description: 'Untie and safely evacuate all 3 captive civilians',
        targetType: 'rescue',
        currentCount: 0,
        requiredCount: 3,
        isCompleted: false,
      },
    ],
    dialogueIntro: [
      'Julian Vance: "Welcome, Officer Alex Carter. Or should I say... partner? We both know what is in your personal bank vault."',
      'Alex Carter: "Step away from those civilians, Vance. This ends today."',
      'Julian Vance: "You have a choice, Carter. Save yourself and walk away... or bleed for people who will never know your name."',
    ],
    dialogueOutro: [
      'Alex Carter: "All hostages evacuated safely. Drop the detonator, Vance!"',
      'Julian Vance: "Splendid work, Detective. Truly magnificent. Perhaps we don\'t have to be enemies after all..."',
    ],
    choice: {
      id: 'choice_death_before_betrayal',
      prompt: "THE ULTIMATUM: CHOOSE CARTER'S FATE",
      optionA: {
        label: 'CHOICE A: SAVE YOURSELF',
        description: 'Abandon the captive civilians and escape into the night. Keep your life and dirty cash.',
        effect: 'Triggers Ending: "THE COWARD\'S LAST BREATH"',
        reputationBonus: -50,
      },
      optionB: {
        label: 'CHOICE B: SAVE THE PEOPLE',
        description: 'Refuse the syndicate\'s deal. Fight through the compound and rescue the hostages at all costs.',
        effect: 'Triggers Climax: "HE SAVED THEIR LIVES. NOW HE MUST TRUST THE DEVIL."',
        reputationBonus: 50,
      },
    },
  },
];

export interface RandomMissionTemplate {
  type: 'stolen_vehicle' | 'robbery' | 'street_crime' | 'suspect_pursuit' | 'hostage' | 'arms_deal';
  title: string;
  subtitle: string;
  description: string;
  mode: 'story' | 'chase';
  targetType: 'kill' | 'arrest' | 'chase_stop';
  faction: 'cobalt_skulls' | 'neon_pythons' | 'iron_vipers' | 'eclipse_syndicate';
  reachPos: { x: number; y: number; z: number };
  rewardBase: number;
  xpBase: number;
  suspectCount: number;
  hasHostage?: boolean;
  getawayCarColor?: string;
  intro: string[];
  outro: string[];
}

export const RANDOM_MISSION_TEMPLATES: RandomMissionTemplate[] = [
  {
    type: 'stolen_vehicle',
    title: 'Code 10-99: Stolen Luxury Sports Car Pursuit',
    subtitle: 'High-Speed Vehicle Chase',
    description: 'A syndicate operative has carjacked a high-performance red sports car from Downtown. Intercept the suspect vehicle, engage sirens, and execute a tactical pit stop maneuver!',
    mode: 'chase',
    targetType: 'chase_stop',
    faction: 'cobalt_skulls',
    reachPos: { x: 35, y: 0, z: -40 },
    rewardBase: 850,
    xpBase: 550,
    suspectCount: 1,
    getawayCarColor: '#dc2626',
    intro: [
      'Dispatch: "ALL UNITS: Stolen luxury sports car in progress! Red coupe speeding through Sector 3."',
      'Alex Carter: "Unit 24 responding! Intercepting suspect vehicle on Avenue south."',
    ],
    outro: [
      'Alex Carter: "Suspect vehicle immobilized! Suspect handcuffed and secured."',
      'Dispatch: "Stolen sports car recovered without civilian casualties! Outstanding pursuit driving Officer Carter."',
    ],
  },
  {
    type: 'suspect_pursuit',
    title: 'Code 10-50: Fleeing Neon Python Tuner Chase',
    subtitle: 'High-Velocity Suspect Pursuit',
    description: 'An acid-green modified street tuner car driven by a fleeing Neon Python lieutenant has blown through a police checkpoint. Pursue, box in the vehicle, and apprehend the driver!',
    mode: 'chase',
    targetType: 'chase_stop',
    faction: 'neon_pythons',
    reachPos: { x: -20, y: 0, z: 45 },
    rewardBase: 950,
    xpBase: 650,
    suspectCount: 1,
    getawayCarColor: '#84cc16',
    intro: [
      'Dispatch: "Unit 24, green modified tuner vehicle refused to yield at Sector 1 checkpoint!"',
      'Alex Carter: "Visual contact established! Sirens blaring, executing PIT box maneuver!"',
    ],
    outro: [
      'Alex Carter: "Suspect vehicle pinned against the curb! Driver under arrest."',
      'Dispatch: "Check-in confirmed, dangerous speeder off Metro City streets."',
    ],
  },
  {
    type: 'robbery',
    title: 'Code 10-31: Armed Convenience Store Robbery',
    subtitle: 'Active Armed Store Heist',
    description: 'Masked Iron Viper enforcers are holding up the Sector 2 Corner Mart cashier at gunpoint. Move in immediately, secure the entrance, and arrest or neutralize the suspects.',
    mode: 'story',
    targetType: 'kill',
    faction: 'iron_vipers',
    reachPos: { x: -45, y: 0, z: 20 },
    rewardBase: 1000,
    xpBase: 700,
    suspectCount: 3,
    intro: [
      'Dispatch: "SILENT ALARM: Armed robbery in progress at Corner Mart! Two armed hostiles inside."',
      'Alex Carter: "Unit 24 on approach. Arriving quietly on foot to avoid endangering the cashier."',
    ],
    outro: [
      'Alex Carter: "Suspects subdued! Register cash and merchandise recovered for the storekeeper."',
      'Shopkeeper: "Officer Carter, you saved our family store! God bless Precinct 9!"',
    ],
  },
  {
    type: 'robbery',
    title: 'Code 10-32: Pharmacy Narcotics Burglary',
    subtitle: 'Commercial Break-In',
    description: 'A crew of Cobalt Skulls bikers have smashed through the rear security door of Metro Care Pharmacy. Intervene before they escape with medical supplies.',
    mode: 'story',
    targetType: 'kill',
    faction: 'cobalt_skulls',
    reachPos: { x: -28, y: 0, z: -6 },
    rewardBase: 900,
    xpBase: 600,
    suspectCount: 3,
    intro: [
      'Dispatch: "Glass-break alarm at Sector 4 Commercial Pharmacy! Biker crew inside."',
      'Alex Carter: "10-4, moving in to seal the rear alley exit."',
    ],
    outro: [
      'Alex Carter: "Pharmacy secured! Stolen pharmaceuticals recovered intact."',
      'Dispatch: "Pharmacist safely secured, evidence logged in case dossier."',
    ],
  },
  {
    type: 'street_crime',
    title: 'Code 10-15: Syndicate Extortion Racket',
    subtitle: 'Street Vendor Harassment',
    description: 'Neon Python gang members are threatening street food vendors, smashing stalls, and demanding protection shakedowns. Disband the crew and protect local residents.',
    mode: 'story',
    targetType: 'kill',
    faction: 'neon_pythons',
    reachPos: { x: -30, y: 0, z: -55 },
    rewardBase: 800,
    xpBase: 500,
    suspectCount: 3,
    intro: [
      'Vendor: "Officer! They are smashing our market stalls and demanding cash!"',
      'Alex Carter: "Police Department! Step away from the vendors and put your hands up!"',
    ],
    outro: [
      'Alex Carter: "Extortion ring broken up. Vendors safe and under patrol protection."',
      'Dispatch: "Merchant association commends your swift defense of the avenue."',
    ],
  },
  {
    type: 'hostage',
    title: 'Code 10-33: Metro Diner Hostage Crisis',
    subtitle: 'High-Threat Hostage Rescue',
    description: 'Desperate armed suspects have taken shelter inside the Metro Diner holding 2 civilian diners hostage. Execute a tactical breach, protect the hostages, and neutralize the hostiles.',
    mode: 'story',
    targetType: 'kill',
    faction: 'iron_vipers',
    reachPos: { x: 50, y: 0, z: 30 },
    rewardBase: 1500,
    xpBase: 1000,
    suspectCount: 3,
    hasHostage: true,
    intro: [
      'Dispatch: "CODE 10-33 PRIORITY: Hostage situation inside Metro Diner! Innocents pinned down."',
      'Alex Carter: "Arrived at perimeter. Flashlight and sidearm ready. Breaching through side entrance."',
    ],
    outro: [
      'Alex Carter: "Hostages evacuated without a scratch! All armed suspects neutralized."',
      'Dispatch: "Heroic rescue Officer Carter! Command commends your nerves of steel under pressure."',
    ],
  },
  {
    type: 'arms_deal',
    title: 'Code 10-44: Harbor Munitions Smuggling Deal',
    subtitle: 'Illegal Weapons Bust',
    description: 'Eclipse Syndicate operatives are unloading military-grade firearm crates at the industrial harbor logistics zone. Move in, seize the weapons cache, and subdue the operatives.',
    mode: 'story',
    targetType: 'kill',
    faction: 'eclipse_syndicate',
    reachPos: { x: 60, y: 0, z: 50 },
    rewardBase: 1600,
    xpBase: 1100,
    suspectCount: 3,
    intro: [
      'Dispatch: "Coast surveillance reports high-grade weapons crate offloading at East Harbor Docks."',
      'Alex Carter: "Unit 24 on scene. High-tech Syndicate operatives spotted. Taking cover and engaging!"',
    ],
    outro: [
      'Alex Carter: "Munitions cache seized! All syndicate operatives neutralized or arrested."',
      'Dispatch: "Huge blow to the city illegal arms trade, outstanding tactical execution Carter!"',
    ],
  },
];

let randomMissionCounter = 1;

export function generateRandomPoliceMission(playerRank: number = 1): Mission {
  const template = RANDOM_MISSION_TEMPLATES[Math.floor(Math.random() * RANDOM_MISSION_TEMPLATES.length)];
  const missionId = `rand_mission_${Date.now()}_${randomMissionCounter++}`;
  const rankMultiplier = 1 + (playerRank - 1) * 0.25;

  return {
    id: missionId,
    chapter: 5 + randomMissionCounter,
    title: template.title,
    subtitle: template.subtitle,
    description: template.description,
    mode: template.mode,
    rewardMoney: Math.round(template.rewardBase * rankMultiplier),
    rewardXP: Math.round(template.xpBase * rankMultiplier),
    requiredRank: 1,
    unlocked: true,
    completed: false,
    objectives: [
      {
        id: `${missionId}_reach`,
        description: `Patrol to location (${template.subtitle})`,
        targetType: 'reach',
        targetPos: {
          x: template.reachPos.x + (Math.random() * 8 - 4),
          y: 0,
          z: template.reachPos.z + (Math.random() * 8 - 4),
        },
        currentCount: 0,
        requiredCount: 1,
        isCompleted: false,
      },
      {
        id: `${missionId}_action`,
        description:
          template.targetType === 'chase_stop'
            ? 'Pursue and disable suspect getaway vehicle'
            : template.hasHostage
            ? 'Neutralize suspects and rescue hostages'
            : `Subdue or arrest ${template.suspectCount} criminal suspects`,
        targetType: template.targetType,
        currentCount: 0,
        requiredCount: template.targetType === 'chase_stop' ? 1 : template.suspectCount,
        isCompleted: false,
      },
    ],
    dialogueIntro: template.intro,
    dialogueOutro: template.outro,
  };
}

