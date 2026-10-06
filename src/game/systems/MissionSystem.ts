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

