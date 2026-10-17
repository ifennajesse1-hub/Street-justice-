import { DynamicEvent } from '../../types/game';
import { authoritativeEncounterManager } from './EncounterManager';

export interface PoliceResourceStatus {
  patrolAvailable: number;
  patrolTotal: number;
  pursuitAvailable: number;
  pursuitTotal: number;
  swatAvailable: number;
  swatTotal: number;
  fireAvailable: number;
  fireTotal: number;
  trafficAvailable: number;
  trafficTotal: number;
}

export const INITIAL_POLICE_RESOURCES: PoliceResourceStatus = {
  patrolAvailable: 4,
  patrolTotal: 5,
  pursuitAvailable: 2,
  pursuitTotal: 3,
  swatAvailable: 2,
  swatTotal: 2,
  fireAvailable: 2,
  fireTotal: 2,
  trafficAvailable: 2,
  trafficTotal: 2,
};

export const DYNAMIC_EVENT_CATALOG: Omit<DynamicEvent, 'id' | 'active' | 'timeRemaining'>[] = [
  // 1. 🚗 Vehicle Theft / Carjacking
  {
    title: '10-25: Violent Carjacking on Avenue',
    type: 'carjacking',
    description: 'Armed suspect pulling a civilian driver out of a vehicle at gunpoint along the avenue curb!',
    locationName: 'Central Commercial Avenue Curb',
    position: { x: -7.5, y: 0, z: -25 },
    rewardMoney: 520,
    rewardXP: 380,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['pursuit', 'patrol'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_carjack',
      prompt: 'Carjacker cornered behind stolen sedan. Suspect offers a quick envelope to look the other way.',
      context: 'The terrified driver is safe on the sidewalk. Suspect slides a thick roll of bills toward Carter.',
      goodOption: {
        label: 'ARREST CARJACKER & RECOVER SEDAN',
        description: 'Tackle the suspect, handcuff him, and return the car keys to the civilian owner.',
        effect: '+15 Reputation, +$300 Department Bounty, +250 XP',
        reputationBonus: 15,
        moneyBonus: 300,
        xpBonus: 250,
        dialogue: 'Carter: "Put your hands behind your back. You picked the wrong car on my shift."',
      },
      shadyOption: {
        label: 'TAKE $1,200 BRIBE & LET HIM RUN',
        description: 'Pocket the cash roll, claim the car was empty on arrival, and report the suspect fled north.',
        effect: '-15 Reputation, +$1,200 Dirty Cash, +1 IA Suspicion',
        reputationBonus: -15,
        moneyBonus: 1200,
        xpBonus: 150,
        dialogue: 'Carter: "Keys on the dash. Run down the alley before my backup gets here. We never met."',
      },
    },
  },

  // 2. 🏃 Criminals Running from Police (Foot Chase)
  {
    title: '10-15: Foot Pursuit of Fleeing Suspect',
    type: 'fleeing_criminal',
    description: 'Robbery suspect sprinting down Eastside delivery alley; patrol unit requesting foot intercept!',
    locationName: 'Eastside Delivery Alley',
    position: { x: 23, y: 0, z: 16 },
    rewardMoney: 420,
    rewardXP: 340,
    severity: 'minor',
    requiresUnits: 1,
    assignedUnits: ['patrol'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_fleeing_runner',
      prompt: 'Fleeing suspect cornered at the dead-end fence, clutching a velvet bag of stolen jewelry.',
      context: 'The pursuing officer got tripped up two blocks back. Only Carter is here in the shadow.',
      goodOption: {
        label: 'CUFF SUSPECT & SECURE STOLEN GOODS',
        description: 'Take down the runner, tag the jewelry bag into official evidence, and log the arrest.',
        effect: '+12 Reputation, +$280 Bounty, +280 XP',
        reputationBonus: 12,
        moneyBonus: 280,
        xpBonus: 280,
        dialogue: 'Carter: "End of the line, kid. On your knees with your hands interlocked."',
      },
      shadyOption: {
        label: 'CONFISCATE JEWELRY & LOOK THE OTHER WAY',
        description: 'Pocket the velvet bag of diamonds, let the kid climb the fence, and report lost visual.',
        effect: '-15 Reputation, +$1,500 Black Market Jewels, -15 Rep',
        reputationBonus: -15,
        moneyBonus: 1500,
        xpBonus: 120,
        valuableReward: {
          id: `val_jewel_${Date.now()}`,
          name: 'Stolen Diamond Pendant & Rings',
          estimatedValue: 1500,
          category: 'jewels',
          description: 'High-end stolen diamond jewelry confiscated off a fleeing runner without evidence logging.',
          isContraband: true,
        },
        dialogue: 'Carter: "Drop the bag, climb that fence, and if you breathe a word, I will find you."',
      },
    },
  },

  // 3. 🔫 Armed Robbery
  {
    title: '10-31: Armed Robbery at Downtown Jeweler',
    type: 'armed_robbery',
    description: 'Syndicate gunmen in balaclavas holding staff hostage inside the downtown jewelry showroom!',
    locationName: 'Downtown Promenade Showcase',
    position: { x: -26, y: 0, z: -18 },
    rewardMoney: 680,
    rewardXP: 520,
    severity: 'high',
    requiresUnits: 3,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
    moralChoice: {
      id: 'choice_armed_robbery',
      prompt: 'Gunman neutralized inside the vault room. Several loose loose gemstone trays are on the floor.',
      context: 'Before SWAT enters the breach, Carter stands alone beside open display cases.',
      goodOption: {
        label: 'SECURE FULL CRIME SCENE EVIDENCE',
        description: 'Call in forensics, catalog all diamond trays, and escort the jeweler to safety.',
        effect: '+18 Reputation, +$500 Official Commendation, +400 XP',
        reputationBonus: 18,
        moneyBonus: 500,
        xpBonus: 400,
        dialogue: 'Carter: "Precinct 9 SWAT, scene is contained. All display cases intact. Escort victims out."',
      },
      shadyOption: {
        label: 'POCKET UNTRACEABLE DIAMOND TRAYS',
        description: 'Slip a tray of uncut stones into your tactical vest and blame the heist crew for the loss.',
        effect: '-20 Reputation, +$2,200 Uncut Diamonds, +2 IA Suspicion',
        reputationBonus: -20,
        moneyBonus: 2200,
        xpBonus: 200,
        valuableReward: {
          id: `val_uncut_gem_${Date.now()}`,
          name: 'Syndicate Uncut Diamonds',
          estimatedValue: 2200,
          category: 'jewels',
          description: 'A velvet packet of certified uncut diamonds quietly pocketed before forensics arrived.',
          isContraband: true,
        },
        dialogue: 'Carter: "Tell Internal Affairs the suspects smashed the display and flushed the missing trays."',
      },
    },
  },

  // 4. 🏪 Store Robbery
  {
    title: '10-31: Cash Register Hold-Up at Metro Mart',
    type: 'store_robbery',
    description: 'Armed thief pointing handgun at store clerk demanding register cash and pharmacy safes!',
    locationName: 'Metro Mart & Pharmacy Storefront',
    position: { x: -28, y: 0, z: -10 },
    rewardMoney: 450,
    rewardXP: 320,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['patrol'],
    visualEffect: 'barricade',
    moralChoice: {
      id: 'choice_store_robbery',
      prompt: 'Thief surrendered with his hands on the counter. The cash register drawer is spilled open.',
      context: 'Clerk is crying in the back storage room. A stack of emergency cash sits unguarded.',
      goodOption: {
        label: 'RETURN CASH & ARREST SUSPECT',
        description: 'Handcuff the robber, reassure the clerk, and log every bill back into the store register.',
        effect: '+12 Reputation, +$320 Store Reward, +250 XP',
        reputationBonus: 12,
        moneyBonus: 320,
        xpBonus: 250,
        dialogue: 'Carter: "You are under arrest. Clerk, you can come out now — the scene is secure."',
      },
      shadyOption: {
        label: 'SKIM $850 CASH FOR "OFFICIAL EVIDENCE"',
        description: 'Take half the cash drawer under the guise of an evidence seizure and pocket it.',
        effect: '-15 Reputation, +$850 Skimmed Cash, +1 IA Suspicion',
        reputationBonus: -15,
        moneyBonus: 850,
        xpBonus: 140,
        dialogue: 'Carter: "I will take this cash drawer for forensic dusting... do not expect it back soon."',
      },
    },
  },

  // 5. 👊 Street Fights
  {
    title: '10-10: Violent Street Brawl outside Diner',
    type: 'street_fight',
    description: 'Two belligerent brawlers throwing wild punches and breaking patio chairs on the sidewalk!',
    locationName: 'Cedar Heights Diner Walkway',
    position: { x: -58, y: 0, z: 10 },
    rewardMoney: 340,
    rewardXP: 260,
    severity: 'minor',
    requiresUnits: 1,
    assignedUnits: ['patrol'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_street_fight',
      prompt: 'Both brawlers knocked to the sidewalk with bruised jaws. A dropped wallet holds hundreds.',
      context: 'One brawler is an arrogant syndicate debt collector; the other is a local mechanic.',
      goodOption: {
        label: 'BREAK UP FIGHT & ISSUE CITATIONS',
        description: 'Separate both fighters, return dropped belongings, and enforce peace on the promenade.',
        effect: '+10 Reputation, +$250 Municipal Peacekeeping, +200 XP',
        reputationBonus: 10,
        moneyBonus: 250,
        xpBonus: 200,
        dialogue: 'Carter: "Break it up right now! Back against the wall or you both spend the weekend in holding."',
      },
      shadyOption: {
        label: 'SHAKE DOWN DEBT COLLECTOR & TAKE $750',
        description: 'Threaten the collector with felony assault unless he pays an immediate "street settlement".',
        effect: '-12 Reputation, +$750 Shakedown Payout, -12 Rep',
        reputationBonus: -12,
        moneyBonus: 750,
        xpBonus: 120,
        dialogue: 'Carter: "Either you hand over your wallet to cover the diner chairs, or you ride in my cage."',
      },
    },
  },

  // 6. 🚨 Police Pursuits
  {
    title: '10-25: High-Speed Tuner Pursuit on Expressway',
    type: 'pursuit',
    description: 'Modified purple racer flying past traffic lights eastbound! Pursuit units requested for PIT maneuver.',
    locationName: 'Central Avenue Expressway',
    position: { x: 0, y: 0, z: -15 },
    rewardMoney: 580,
    rewardXP: 450,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['pursuit'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_pursuit',
      prompt: 'Tuner car spun out and cornered against the barrier. The driver offers a lucrative deal.',
      context: 'The illegal street racer is a mechanic connected to an underground racing syndicate.',
      goodOption: {
        label: 'IMPOUND VEHICLE & ARREST SPEEDER',
        description: 'Disable the engine, cuff the driver, and have the vehicle towed to police impound.',
        effect: '+16 Reputation, +$450 Pursuit Commendation, +380 XP',
        reputationBonus: 16,
        moneyBonus: 450,
        xpBonus: 380,
        dialogue: 'Carter: "Step out of the vehicle with your hands on your head. Pursuit is terminated."',
      },
      shadyOption: {
        label: 'ACCEPT $1,800 SYNDICATE RACER KICKBACK',
        description: 'Report the pursuit broke off due to civilian safety, and let the tuner slip down a side alley.',
        effect: '-20 Reputation, +$1,800 Underground Kickback, +2 IA Suspicion',
        reputationBonus: -20,
        moneyBonus: 1800,
        xpBonus: 180,
        dialogue: 'Carter: "Dispatch, lost visual in heavy traffic. Clearing avenue." (To racer: "Get out of here.")',
      },
    },
  },

  // 7. 👮 Officers Requesting Backup
  {
    title: '10-78: Officer Pinned Down by Gunfire',
    type: 'officer_backup',
    description: 'Patrol officer pinned behind cruiser door by two syndicate gunmen near North Underpass!',
    locationName: 'North Rail Underpass Junction',
    position: { x: 10, y: 0, z: -38 },
    rewardMoney: 720,
    rewardXP: 550,
    severity: 'high',
    requiresUnits: 3,
    assignedUnits: ['patrol', 'swat'],
    visualEffect: 'barricade',
    moralChoice: {
      id: 'choice_officer_backup',
      prompt: 'Gunmen neutralized and pinned officer rescued. The criminals had an open trunk full of illegal guns.',
      context: 'The young rookie officer is trembling behind his vehicle, looking to Carter for leadership.',
      goodOption: {
        label: 'DEFEND FELLOW OFFICER & LOG WEAPONS',
        description: 'Secure the rookie, administer field first aid, and log the military weapons into Precinct 9 armory.',
        effect: '+22 Reputation, +$600 Valor Citation, +500 XP',
        reputationBonus: 22,
        moneyBonus: 600,
        xpBonus: 500,
        dialogue: 'Carter: "You are safe now, rookie. Breathe. We have got the perimeter locked down."',
      },
      shadyOption: {
        label: 'STASH HIGH-GRADE WEAPONS FOR PRIVATE SALE',
        description: 'Quietly transfer a custom syndicate rifle and ammo cache into your trunk before supervisor arrives.',
        effect: '-18 Reputation, +$2,000 Armory Contraband, +2 IA Suspicion',
        reputationBonus: -18,
        moneyBonus: 2000,
        xpBonus: 250,
        valuableReward: {
          id: `val_weapons_${Date.now()}`,
          name: 'Modified Syndicate Assault Carbine',
          estimatedValue: 2000,
          category: 'weapon',
          description: 'A customized, unregistered military carbine discreetly appropriated from the criminals trunk.',
          isContraband: true,
        },
        dialogue: 'Carter: "Keep your mouth shut about what was in that trunk, rookie, if you want to make detective."',
      },
    },
  },

  // 8. 🧍 Civilians Reporting Crimes
  {
    title: '10-44: Distressed Civilian Reporting Robbery',
    type: 'civilian_report',
    description: 'Citizen frantically waving down police on the transit sidewalk after being mugged in the plaza!',
    locationName: 'Civic Transit Plaza Promenade',
    position: { x: 16, y: 0, z: -6 },
    rewardMoney: 380,
    rewardXP: 290,
    severity: 'minor',
    requiresUnits: 1,
    assignedUnits: ['patrol'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_civilian_report',
      prompt: 'Suspect intercepted in the adjacent alleyway with the victims leather briefcase.',
      context: 'Inside the briefcase is the victims confidential business contracts and $2,400 in bearer bonds.',
      goodOption: {
        label: 'RETURN BRIEFCASE INTACT TO CIVILIAN',
        description: 'Deliver the briefcase untouched to the grateful citizen and file an exemplary report.',
        effect: '+14 Reputation, +$350 Citizen Reward, +260 XP',
        reputationBonus: 14,
        moneyBonus: 350,
        xpBonus: 260,
        dialogue: 'Carter: "Here is your briefcase, maam. Everything is accounted for. Have a safe afternoon."',
      },
      shadyOption: {
        label: 'SLIP THE $2,400 BEARER BONDS INTO YOUR POCKET',
        description: 'Return only the empty documents, claiming the mugger had already ditched the valuables.',
        effect: '-20 Reputation, +$2,400 Bearer Bonds, +2 IA Suspicion',
        reputationBonus: -20,
        moneyBonus: 2400,
        xpBonus: 150,
        valuableReward: {
          id: `val_bonds_${Date.now()}`,
          name: 'Untraceable Bearer Bonds',
          estimatedValue: 2400,
          category: 'bearer_bonds',
          description: 'Bearer bonds swiped from a recovered civilian briefcase and stashed in private lockbox.',
          isContraband: true,
        },
        dialogue: 'Carter: "I recovered your papers, but the cash was gone when I found the suspect. Tough break."',
      },
    },
  },

  // 9. 💰 Suspicious People Carrying Valuables
  {
    title: '10-53: Suspicious Courier Carrying Duffle Bag',
    type: 'suspicious_valuable',
    description: 'Unidentified operative in dark trenchcoat nervously surveying corners with heavy reinforced duffle!',
    locationName: 'Commercial Rear Service Alley',
    position: { x: -32, y: 0, z: 8 },
    rewardMoney: 500,
    rewardXP: 400,
    severity: 'moderate',
    requiresUnits: 1,
    assignedUnits: ['patrol'],
    visualEffect: 'none',
    moralChoice: {
      id: 'choice_suspicious_valuable',
      prompt: 'The nervous courier is trapped. Inside the duffle is $3,000 in banded syndicate payoff cash.',
      context: 'Courier sweats nervously: "Officer, take your cut. We can both walk away very happy today."',
      goodOption: {
        label: 'CONFISCATE CONTRABAND & LOG INTO EVIDENCE',
        description: 'Seize the duffle, cite suspect for money laundering, and deposit the cash in Precinct 9 locker.',
        effect: '+16 Reputation, +$450 Lawful Bounty, +350 XP',
        reputationBonus: 16,
        moneyBonus: 450,
        xpBonus: 350,
        dialogue: 'Carter: "You are barking up the wrong tree. Hands on the brick wall. Everything goes into evidence."',
      },
      shadyOption: {
        label: 'DEMAND A $2,500 "POLICE TOLL" & LET HIM WALK',
        description: 'Take the lion share of the cash, tell the courier he has 60 seconds to disappear, and leave no paper trail.',
        effect: '-22 Reputation, +$2,500 Street Shakedown, +2 IA Suspicion',
        reputationBonus: -22,
        moneyBonus: 2500,
        xpBonus: 180,
        dialogue: 'Carter: "Thirty seconds. Start walking before I change my mind and decide you resisted arrest."',
      },
    },
  },

  // 10. 🚗 Traffic Accidents
  {
    title: '10-50: Multi-Vehicle Collision & Road Blockage',
    type: 'accident',
    description: 'Luxury sedan and taxi collided at the main avenue intersection, blocking both transit lanes!',
    locationName: 'Central Crosswalk Intersection',
    position: { x: 0, y: 0, z: 0 },
    rewardMoney: 360,
    rewardXP: 280,
    severity: 'minor',
    requiresUnits: 2,
    assignedUnits: ['traffic', 'patrol'],
    visualEffect: 'smoke',
    moralChoice: {
      id: 'choice_traffic_accident',
      prompt: 'At-fault luxury driver is an influential property tycoon who caused the crash by running a red light.',
      context: 'The tycoon pulls Carter aside: "I cannot have this on my insurance or the news. Make this go away."',
      goodOption: {
        label: 'WRITE OBJECTIVE CRASH REPORT & AID INJURED',
        description: 'Render first aid to the taxi driver, file an honest police report, and cite the tycoon for reckless driving.',
        effect: '+12 Reputation, +$350 Integrity Commendation, +250 XP',
        reputationBonus: 12,
        moneyBonus: 350,
        xpBonus: 250,
        dialogue: 'Carter: "The badge is not for sale, sir. You ran the red light, and that is exactly what the report will say."',
      },
      shadyOption: {
        label: 'TAKE $1,400 PAYOFF & BLAME THE CAB DRIVER',
        description: 'Falsify the accident diagram, pin the blame on the taxi cab, and pocket the tycoons cash envelope.',
        effect: '-16 Reputation, +$1,400 Cover-Up Payment, +1 IA Suspicion',
        reputationBonus: -16,
        moneyBonus: 1400,
        xpBonus: 140,
        dialogue: 'Carter: "Looks like the taxi failed to yield right of way. Case closed. Have a safe drive home, sir."',
      },
    },
  },

  // 11. 🔥 Criminals Attacking Police (Ambush)
  {
    title: '10-99: Armed Syndicate Ambush on Police Patrol',
    type: 'ambush_police',
    description: 'Syndicate enforcers spraying assault rifle fire at a trapped squad cruiser near the market!',
    locationName: 'South Market Freight Depot',
    position: { x: -18, y: 0, z: 32 },
    rewardMoney: 850,
    rewardXP: 650,
    severity: 'critical',
    requiresUnits: 4,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
    moralChoice: {
      id: 'choice_ambush_police',
      prompt: 'Ambushers neutralized after a brutal firefight. Wounded gang lieutenant pleads for an off-the-record deal.',
      context: 'The lieutenant whispers: "Carter, you know who I work for. The Don has $3,000 waiting if I vanish."',
      goodOption: {
        label: 'CUFF GANG LIEUTENANT & DISMANTLE CREW',
        description: 'Call for prisoner transport, charge the syndicate lieutenant with attempted murder of officers.',
        effect: '+25 Reputation, +$800 Heroic Valor Bounty, +600 XP',
        reputationBonus: 25,
        moneyBonus: 800,
        xpBonus: 600,
        dialogue: 'Carter: "Tell the Don he is next. You are going away for twenty-five years to life."',
      },
      shadyOption: {
        label: 'CUT A SECRET DEAL & CLAIM SUSPECT ESCAPED',
        description: 'Let the lieutenant slip into the container yard, claim he fled into the dark, and pocket the payoff.',
        effect: '-25 Reputation, +$3,000 Syndicate Retainer, +3 IA Suspicion',
        reputationBonus: -25,
        moneyBonus: 3000,
        xpBonus: 220,
        valuableReward: {
          id: `val_retainer_${Date.now()}`,
          name: 'Syndicate Underworld Retainer Envelope',
          estimatedValue: 3000,
          category: 'contraband',
          description: 'A heavy bribe envelope paid by an organized crime lieutenant for Carter looking the other way.',
          isContraband: true,
        },
        dialogue: 'Carter: "Dispatch, suspect fled east into the freight yard. I lost him. (Take the back fence, go!)"',
      },
    },
  },

  // 12. 🏦 Bank-Related Incidents
  {
    title: '10-90: Vault Alarm & Armed Heist at Metro Bank',
    type: 'bank_incident',
    description: 'Silent panic alarm tripped! Heavy syndicate demolition team drilling into vault room deposit boxes!',
    locationName: 'Metro Financial Bank Plaza',
    position: { x: 26, y: 0, z: -24 },
    rewardMoney: 1100,
    rewardXP: 850,
    severity: 'critical',
    requiresUnits: 4,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
    moralChoice: {
      id: 'choice_bank_incident',
      prompt: 'Bank heisters neutralized outside the vault door. A heavy duffle of federal currency bundles sits open.',
      context: 'The bank manager is still locked in the panic shelter. Hundreds of thousands in cash are exposed.',
      goodOption: {
        label: 'DEFEND FEDERAL VAULT & ACCOUNT FOR EVERY CENT',
        description: 'Hold the vault perimeter until federal marshals arrive, logging every single dollar bill into the manifest.',
        effect: '+30 Reputation, +$1,000 Federal Commendation, +750 XP',
        reputationBonus: 30,
        moneyBonus: 1000,
        xpBonus: 750,
        dialogue: 'Carter: "Federal Reserve security, Officer Carter on scene. Vault is secure. All cash accounted for."',
      },
      shadyOption: {
        label: 'STASH A $4,000 CASH STRAP INTO YOUR JACKET',
        description: 'Discreetly slide a sealed bundle of hundred-dollar bills into your uniform and blame the drill crew.',
        effect: '-30 Reputation, +$4,000 Stolen Federal Reserve Cash, +3 IA Suspicion',
        reputationBonus: -30,
        moneyBonus: 4000,
        xpBonus: 300,
        valuableReward: {
          id: `val_bank_cash_${Date.now()}`,
          name: 'Federal Reserve Bank Cash Strap',
          estimatedValue: 4000,
          category: 'gold_bar',
          description: 'A sealed federal bank cash bundle quietly diverted into Officer Carters private stash.',
          isContraband: true,
        },
        dialogue: 'Carter: "The vault had already been drilled when I breached. They must have smuggled that strap out earlier."',
      },
    },
  },

  // 13. Structural Fire Emergency
  {
    title: 'Code 4: Structural Shop Fire at Commercial Row',
    type: 'fire',
    description: 'Electrical fire ignited inside storefront warehouse with heavy smoke billowing into the street.',
    locationName: 'West Commercial Storefront',
    position: { x: -30, y: 0, z: -6 },
    rewardMoney: 400,
    rewardXP: 350,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['fire', 'traffic'],
    visualEffect: 'fire',
  },

  // 14. Gang War Turf Firefight
  {
    title: '10-71: Violent Gang Turf Firefight',
    type: 'gang_war',
    description: 'Cobalt Skulls and Neon Pythons exchanging automatic gunfire near eastern freight logistics.',
    locationName: 'East Industrial Freight Depot',
    position: { x: 38, y: 0, z: 32 },
    rewardMoney: 650,
    rewardXP: 500,
    severity: 'high',
    requiresUnits: 3,
    assignedUnits: ['patrol', 'swat'],
    visualEffect: 'barricade',
  },

  // 15. Hostage Standoff
  {
    title: '10-33: Hostage Standoff at Cedar Diner',
    type: 'hostage',
    description: 'Armed syndicate thugs barricaded inside local business with civilians. Tactical SWAT perimeter forming.',
    locationName: 'Mama Leah Diner Promenade',
    position: { x: -62, y: 0, z: 12 },
    rewardMoney: 900,
    rewardXP: 700,
    severity: 'critical',
    requiresUnits: 4,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
  },

  // 16. Rare Disaster: Cargo Aircraft Crash
  {
    title: 'MAYDAY CODE RED: Cargo Aircraft Crash Site',
    type: 'disaster_crash',
    description: 'Twin-engine freight transport down in East Logistics Sector! Debris and fuel fire across warehouse lot! ALL UNITS ASSIST!',
    locationName: 'Eastern Logistics Container Field',
    position: { x: 55, y: 0, z: 45 },
    rewardMoney: 1600,
    rewardXP: 1300,
    severity: 'disaster',
    requiresUnits: 6,
    assignedUnits: ['fire', 'swat', 'patrol', 'traffic'],
    visualEffect: 'debris',
  },
];

export const EVENT_TYPE_COOLDOWNS: Record<string, number> = {
  carjacking: 85,
  fleeing_criminal: 80,
  armed_robbery: 90,
  store_robbery: 85,
  street_fight: 70,
  pursuit: 80,
  officer_backup: 95,
  civilian_report: 75,
  suspicious_valuable: 85,
  accident: 65,
  ambush_police: 110,
  bank_incident: 120,
  robbery: 80,
  gang_war: 90,
  hostage: 100,
  prison_break: 85,
  disturbance: 60,
  fire: 65,
  civilian_emergency: 55,
  disaster_crash: 240,
};

export class CityIncidentManager {
  public activeIncidents: DynamicEvent[] = [];
  public policeResources: PoliceResourceStatus = { ...INITIAL_POLICE_RESOURCES };
  public radioChatterFeed: { id: string; text: string; time: number; type: 'info' | 'alert' | 'success' }[] = [];
  public cooldownTimer: number = 0; // global cooldown in seconds before next incident
  public playerReputation: number = 50; // Officer Carter's moral standing (0-100)
  private nextEventCountdown: number = 35;
  private initialPeacefulDelay: number = 35; // 35 seconds calm patrol before first 911 dispatch
  private resolvedIncidentIds: Set<string> = new Set();
  private typeCooldowns: Map<string, number> = new Map();
  private lastEventType: string | null = null;
  private recentEventTypes: string[] = []; // Track last 4 event types to prevent repeating
  private recentLocations: string[] = [];  // Track last 3 locations to prevent repeating spot

  // Callbacks
  public onRadioBroadcast?: (callout: string, type: 'info' | 'alert' | 'success') => void;
  public onIncidentStateChange?: (incidents: DynamicEvent[]) => void;
  public onNewIncident?: (incident: DynamicEvent) => void;

  constructor() {
    // Start with a peaceful living city without instant firefight or gunshots on game startup
    this.activeIncidents = [];
    this.initialPeacefulDelay = 35; // 35 seconds initial peaceful patrol before first 911 dispatch
    this.nextEventCountdown = 35;
    this.cooldownTimer = 0;
    this.playerReputation = 50;
    this.resolvedIncidentIds.clear();
    this.typeCooldowns.clear();
    this.lastEventType = null;
    this.recentEventTypes = [];
    this.recentLocations = [];
  }

  public update(delta: number): void {
    // 0. Update manager cooldown timer and initial peaceful delay
    if (this.initialPeacefulDelay > 0) {
      this.initialPeacefulDelay -= delta;
    }
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }
    // Update per-type cooldowns
    for (const [type, cd] of this.typeCooldowns.entries()) {
      if (cd > 0) {
        this.typeCooldowns.set(type, cd - delta);
      } else {
        this.typeCooldowns.delete(type);
      }
    }

    // 1. Countdown to spawn new random events naturally around the city
    // Only spawn if calm initial delay and global cooldown have expired, and no active incident is in progress (max 1)
    const hasActiveIncidents = this.activeIncidents.some(
      (i) => i.status === 'active' || i.status === 'pending' || i.active
    );
    if (this.initialPeacefulDelay <= 0 && this.cooldownTimer <= 0 && !hasActiveIncidents && this.activeIncidents.length === 0) {
      this.nextEventCountdown -= delta;
      if (this.nextEventCountdown <= 0) {
        this.nextEventCountdown = 45 + Math.random() * 30; // 45-75 seconds between incidents
        this.generateNaturallyOccurringEvent();
      }
    }

    // 2. Progress all active incidents and autonomous police responses
    for (let i = this.activeIncidents.length - 1; i >= 0; i--) {
      const inc = this.activeIncidents[i];
      if (inc.status === 'resolved' || inc.status === 'failed' || inc.status === 'completed') {
        this.activeIncidents.splice(i, 1);
        continue;
      }

      inc.timeRemaining -= delta;

      // Autonomous police resolution progress
      if (inc.assignedUnits && inc.assignedUnits.length > 0) {
        // Rate depends on unit count and incident severity
        const rate = inc.severity === 'disaster' ? 1.5 : inc.severity === 'critical' ? 2.0 : 3.2;
        const prevProg = inc.policeProgress || 0;
        inc.policeProgress = prevProg + delta * rate;

        // Realistic field radio milestones
        if (prevProg < 25 && inc.policeProgress >= 25) {
          inc.stage = 'active';
          if (inc.type === 'hostage') {
            this.broadcastRadio(`[SWAT 1] Perimeter locked down at ${inc.locationName}. Negotiator on megaphone.`, 'info');
          } else if (inc.type === 'fire') {
            this.broadcastRadio(`[ENGINE 4] Attack lines charged at ${inc.locationName}. Primary search underway.`, 'info');
          } else if (inc.type === 'accident') {
            this.broadcastRadio(`[TRAFFIC 2] Intersection cordoned at ${inc.locationName}. Diversion signs in place.`, 'info');
          } else if (inc.type === 'pursuit') {
            this.broadcastRadio(`[PURSUIT 1] Suspect vehicle cornered, preparing spike strips on avenue!`, 'info');
          } else {
            this.broadcastRadio(`[UNIT 12] On scene at ${inc.locationName}. Formed tactical perimeter.`, 'info');
          }
        } else if (prevProg < 65 && inc.policeProgress >= 65) {
          inc.stage = 'resolving';
          if (inc.type === 'hostage') {
            this.broadcastRadio(`[SWAT 1] Breaching rear entrance at ${inc.locationName}! Civilians moving to safety!`, 'alert');
          } else if (inc.type === 'gang_war') {
            this.broadcastRadio(`[PATROL 3] Gang combatants breaking off, suspects being subdued!`, 'alert');
          } else if (inc.type === 'fire') {
            this.broadcastRadio(`[ENGINE 4] Knockdown achieved on main body of fire. Venting roof.`, 'info');
          } else {
            this.broadcastRadio(`[UNIT 12] Suspects challenged under gunpoint. Complying with arrest orders.`, 'info');
          }
        }

        // Incident resolved by autonomous police units
        if (inc.policeProgress >= 100) {
          inc.stage = 'resolved';
          inc.status = 'resolved';
          inc.active = false;
          authoritativeEncounterManager.completeEncounter(inc.id);
          this.resolvedIncidentIds.add(inc.id);
          this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 75);
          this.lastEventType = inc.type;
          this.cooldownTimer = 45; // 45s global cooldown
          this.nextEventCountdown = 45 + Math.random() * 25;
          this.releaseUnits(inc.assignedUnits);
          this.broadcastRadio(
            `[DISPATCH] 10-24: Incident secured at ${inc.locationName}. Responding units returning to patrol status.`,
            'success'
          );
          this.activeIncidents.splice(i, 1);
          this.onIncidentStateChange?.(this.activeIncidents);
          continue;
        }
      } else {
        // No police assigned — incident escalates or suspects flee!
        if (inc.timeRemaining <= 45 && inc.stage !== 'escalating') {
          inc.stage = 'escalating';
          if (inc.type === 'fire') {
            this.broadcastRadio(
              `[DISPATCH 10-33] Fire spreading to adjacent structures at ${inc.locationName}! Immediate units needed!`,
              'alert'
            );
          } else if (inc.type === 'robbery' || inc.type === 'prison_break') {
            this.broadcastRadio(
              `[DISPATCH 10-33] Situation escalating at ${inc.locationName}! Suspects attempting getaway!`,
              'alert'
            );
          } else {
            this.broadcastRadio(
              `[DISPATCH 10-33] Incident uncontained at ${inc.locationName}! All free units please respond!`,
              'alert'
            );
          }
        }
      }

      // Expired incident without resolution
      if (inc.timeRemaining <= 0) {
        if (inc.assignedUnits) {
          this.releaseUnits(inc.assignedUnits);
        }
        inc.stage = 'suspect_escaped';
        inc.status = 'failed';
        inc.active = false;
        this.resolvedIncidentIds.add(inc.id);
        this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 60);
        this.lastEventType = inc.type;
        this.cooldownTimer = 40;
        this.nextEventCountdown = 40 + Math.random() * 20;
        this.broadcastRadio(
          `[DISPATCH] 10-99: Incident expired at ${inc.locationName}. Suspects fled scene; units resuming normal patrol.`,
          'info'
        );
        this.activeIncidents.splice(i, 1);
        this.onIncidentStateChange?.(this.activeIncidents);
      }
    }
  }

  /**
   * Spawns a new natural incident in the city based on weighted probabilities, reputation, and cooldown checks
   */
  public generateNaturallyOccurringEvent(): DynamicEvent | null {
    if (this.initialPeacefulDelay > 0) return null;
    if (this.cooldownTimer > 0) return null;
    if (this.activeIncidents.length >= 1) return null;

    // Filter catalog: must not be in type cooldown
    const eligible = DYNAMIC_EVENT_CATALOG.filter((e) => {
      const cd = this.typeCooldowns.get(e.type) ?? 0;
      return cd <= 0;
    });

    if (eligible.length === 0) return null;

    // Anti-repetition: avoid recent 4 event types and recent 3 locations
    let candidates = eligible.filter(
      (e) => !this.recentEventTypes.includes(e.type) && !this.recentLocations.includes(e.locationName)
    );

    // If too restrictive, at least ensure type is not the exact last event type
    if (candidates.length === 0) {
      candidates = eligible.filter((e) => e.type !== this.lastEventType);
    }
    if (candidates.length === 0) {
      candidates = eligible;
    }

    // Weight candidate selection by Officer Carter's moral reputation standing
    const weightedPool: typeof candidates = [];
    for (const item of candidates) {
      let weight = 1;
      const isShadyLeaning =
        item.type === 'suspicious_valuable' ||
        item.type === 'bank_incident' ||
        item.type === 'carjacking' ||
        item.type === 'ambush_police';
      const isLawfulLeaning =
        item.type === 'civilian_report' ||
        item.type === 'officer_backup' ||
        item.type === 'store_robbery' ||
        item.type === 'accident';

      if (this.playerReputation < 45 && isShadyLeaning) {
        weight = 3; // Corrupt underworld contacts reach out more
      } else if (this.playerReputation >= 70 && isLawfulLeaning) {
        weight = 3; // Grateful civilians and precinct trust Carter more
      }

      for (let w = 0; w < weight; w++) {
        weightedPool.push(item);
      }
    }

    // Pick random candidate template from weighted pool
    const template = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    return this.spawnIncident(template);
  }

  public spawnIncident(template: Omit<DynamicEvent, 'id' | 'active' | 'timeRemaining'>): DynamicEvent {
    // Generate unique ID that will never repeat
    const uniqueId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inc: DynamicEvent = {
      ...template,
      id: uniqueId,
      active: true,
      status: 'pending',
      timeRemaining: template.severity === 'disaster' ? 300 : 180,
      stage: 'reported',
      policeProgress: 0,
      spawnedEnemyIds: [],
      spawnedPoliceIds: [],
      spawnedCivilianIds: [],
    };

    // Track recent event types and locations to prevent repeats
    this.lastEventType = template.type;
    this.recentEventTypes.push(template.type);
    if (this.recentEventTypes.length > 4) {
      this.recentEventTypes.shift();
    }
    this.recentLocations.push(template.locationName);
    if (this.recentLocations.length > 3) {
      this.recentLocations.shift();
    }

    // Register with authoritative encounter manager
    authoritativeEncounterManager.registerEncounter({
      id: uniqueId,
      type: template.type as any,
      title: template.title,
      locationName: template.locationName,
      position: template.position,
      rewardXP: template.rewardXP,
      rewardMoney: template.rewardMoney,
      cooldownDuration: EVENT_TYPE_COOLDOWNS[template.type] || 90,
      repeatable: true,
    });
    authoritativeEncounterManager.startEncounter(uniqueId);

    // Autonomous Police Dispatcher logic: Allocate available units
    const dispatched = this.tryAllocatePoliceUnits(template.type, template.severity || 'moderate');

    // Priority Override: If high-severity or disaster event has insufficient units, redirect from minor incidents
    if ((template.severity === 'disaster' || template.severity === 'critical') && dispatched.length < 2) {
      for (const other of this.activeIncidents) {
        if (other.severity === 'minor' && other.assignedUnits && other.assignedUnits.length > 0) {
          const redirected = other.assignedUnits.splice(0, 1)[0];
          dispatched.push(redirected);
          this.broadcastRadio(
            `[DISPATCH PRIORITY OVERRIDE] Redirecting ${redirected.toUpperCase()} unit from ${other.locationName} to Code Red incident at ${inc.locationName}!`,
            'alert'
          );
          if (dispatched.length >= 3) break;
        }
      }
    }

    inc.assignedUnits = dispatched;

    if (dispatched.length > 0) {
      inc.stage = 'dispatching';
      this.broadcastRadio(
        `[DISPATCH] ${inc.title} at ${inc.locationName}. Units (${dispatched.join(', ')}) dispatched code 3.`,
        template.severity === 'critical' || template.severity === 'disaster' ? 'alert' : 'info'
      );
    } else {
      inc.stage = 'reported';
      this.broadcastRadio(
        `[DISPATCH ALERT] ${inc.title} at ${inc.locationName}. ALL POLICE UNITS COMMITTED! Standby backlog holding!`,
        'alert'
      );
    }

    this.activeIncidents.push(inc);
    this.onIncidentStateChange?.(this.activeIncidents);
    this.onNewIncident?.(inc);
    return inc;
  }

  private tryAllocatePoliceUnits(
    type: DynamicEvent['type'],
    severity: string
  ): ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[] {
    const allocated: ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[] = [];

    if (type === 'fire') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.trafficAvailable > 0) {
        this.policeResources.trafficAvailable--;
        allocated.push('traffic');
      }
    } else if (type === 'pursuit') {
      if (this.policeResources.pursuitAvailable > 0) {
        this.policeResources.pursuitAvailable--;
        allocated.push('pursuit');
      } else if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'hostage' || type === 'gang_war' || severity === 'critical') {
      if (this.policeResources.swatAvailable > 0) {
        this.policeResources.swatAvailable--;
        allocated.push('swat');
      }
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'disaster_crash') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.swatAvailable > 0) {
        this.policeResources.swatAvailable--;
        allocated.push('swat');
      }
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'civilian_emergency') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.trafficAvailable > 0) {
        this.policeResources.trafficAvailable--;
        allocated.push('traffic');
      }
    } else {
      // Standard patrol response
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    }

    return allocated;
  }

  private releaseUnits(units: ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[]): void {
    units.forEach((u) => {
      if (u === 'patrol' && this.policeResources.patrolAvailable < this.policeResources.patrolTotal) {
        this.policeResources.patrolAvailable++;
      } else if (u === 'pursuit' && this.policeResources.pursuitAvailable < this.policeResources.pursuitTotal) {
        this.policeResources.pursuitAvailable++;
      } else if (u === 'swat' && this.policeResources.swatAvailable < this.policeResources.swatTotal) {
        this.policeResources.swatAvailable++;
      } else if (u === 'fire' && this.policeResources.fireAvailable < this.policeResources.fireTotal) {
        this.policeResources.fireAvailable++;
      } else if (u === 'traffic' && this.policeResources.trafficAvailable < this.policeResources.trafficTotal) {
        this.policeResources.trafficAvailable++;
      }
    });
  }

  private broadcastRadio(text: string, type: 'info' | 'alert' | 'success'): void {
    const item = { id: `radio_${Date.now()}_${Math.random()}`, text, time: Date.now(), type };
    this.radioChatterFeed.push(item);
    if (this.radioChatterFeed.length > 20) this.radioChatterFeed.shift();
    this.onRadioBroadcast?.(text, type);
  }

  /**
   * When player intervenes and resolves an incident personally
   */
  public resolveIncidentByPlayer(incidentId: string): DynamicEvent | null {
    if (this.resolvedIncidentIds.has(incidentId)) {
      return null;
    }
    const idx = this.activeIncidents.findIndex((i) => i.id === incidentId);
    if (idx >= 0) {
      const inc = this.activeIncidents[idx];
      inc.status = 'resolved';
      inc.active = false;
      inc.stage = 'resolved';
      this.resolvedIncidentIds.add(inc.id);
      authoritativeEncounterManager.completeEncounter(inc.id);

      if (inc.assignedUnits) {
        this.releaseUnits(inc.assignedUnits);
      }
      this.activeIncidents.splice(idx, 1);

      // Enforce healthy type-specific and global cooldowns (45-75 seconds)
      this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 80);
      this.lastEventType = inc.type;
      this.cooldownTimer = 45;
      this.nextEventCountdown = 45 + Math.random() * 25;

      this.broadcastRadio(
        `[PRECINCT 9] Officer Carter successfully secured incident at ${inc.locationName}! Scene clear, units returning to patrol. Outstanding work!`,
        'success'
      );
      this.onIncidentStateChange?.(this.activeIncidents);
      return inc;
    }
    return null;
  }

  /**
   * When Carter makes a moral choice (Good vs Shady) to resolve a dynamic incident
   */
  public resolveIncidentWithMoralChoice(incidentId: string, choice: 'good' | 'shady'): DynamicEvent | null {
    if (this.resolvedIncidentIds.has(incidentId)) {
      return null;
    }
    const idx = this.activeIncidents.findIndex((i) => i.id === incidentId);
    if (idx >= 0) {
      const inc = this.activeIncidents[idx];
      inc.choiceMade = choice;
      inc.status = 'resolved';
      inc.active = false;
      inc.stage = 'resolved';
      this.resolvedIncidentIds.add(inc.id);
      authoritativeEncounterManager.completeEncounter(inc.id);

      if (inc.assignedUnits) {
        this.releaseUnits(inc.assignedUnits);
      }
      this.activeIncidents.splice(idx, 1);

      this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 85);
      this.lastEventType = inc.type;
      this.cooldownTimer = 45;
      this.nextEventCountdown = 45 + Math.random() * 25;

      if (choice === 'good') {
        this.broadcastRadio(
          `[PRECINCT 9] Commendation filed for Officer Carter: 10-24 secured lawfully at ${inc.locationName}!`,
          'success'
        );
      } else {
        this.broadcastRadio(
          `[OFFICER CARTER] "10-4 Dispatch, 10-99 false alarm at ${inc.locationName}. Scene clear, no suspects found."`,
          'info'
        );
      }
      this.onIncidentStateChange?.(this.activeIncidents);
      return inc;
    }
    return null;
  }

  public isIncidentResolved(incidentId: string): boolean {
    return this.resolvedIncidentIds.has(incidentId);
  }

  public reset(): void {
    authoritativeEncounterManager.reset();
    this.activeIncidents = [];
    this.resolvedIncidentIds.clear();
    this.typeCooldowns.clear();
    this.policeResources = { ...INITIAL_POLICE_RESOURCES };
    this.cooldownTimer = 0;
    this.initialPeacefulDelay = 35;
    this.nextEventCountdown = 35;
    this.lastEventType = null;
    this.radioChatterFeed = [];
  }
}

// Global incident manager singleton
export const cityIncidentManager = new CityIncidentManager();

export function generateRandomCityEvent(): DynamicEvent | null {
  if (cityIncidentManager.cooldownTimer > 0) return null;
  const inc = cityIncidentManager.generateNaturallyOccurringEvent();
  return inc;
}
