export type GameMode = 'story' | 'freeroam' | 'chase' | 'survival';

export type TimeOfDay = 'day' | 'sunset' | 'night';
export type WeatherType = 'clear' | 'rain' | 'fog';

export interface WeaponConfig {
  id: string;
  name: string;
  category: 'handgun' | 'smg' | 'shotgun' | 'rifle' | 'taser' | 'grenade' | 'camera';
  damage: number;
  fireRate: number; // shots per sec
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  range: number;
  spread: number;
  isAutomatic: boolean;
  unlocked: boolean;
  price: number;
  upgradeLevel: number;
  isNonLethal?: boolean;
}

export type GangFactionId = 'cobalt_skulls' | 'neon_pythons' | 'iron_vipers' | 'eclipse_syndicate';
export type SpecialFactionId = 'police' | 'aegis_taskforce' | GangFactionId;

export type EnemyType = 'thug' | 'enforcer' | 'boss' | 'military_soldier' | 'syndicate_operative';

export type PoliceRole = 'patrol' | 'pursuit' | 'swat' | 'traffic' | 'fire_responder' | 'fire';

export type CriminalState =
  | 'normal'
  | 'suspicious'
  | 'fleeing'
  | 'attacking'
  | 'surrendered'
  | 'arrested'
  | 'dead'
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'cover'
  | 'shoot'
  | 'flee';

export interface SuspectLoot {
  stolenCash: number;
  weaponName?: string;
  valuable?: FictionalValuable;
  evidenceLead?: string;
  charges?: string[];
}

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  name: string;
  faction?: GangFactionId | 'aegis_taskforce';
  factionName?: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  state: CriminalState;
  weapon: WeaponConfig;
  target?: { x: number; y: number; z: number };
  targetEnemyId?: string;
  coverPosition?: { x: number; y: number; z: number };
  shootCooldown: number;
  alertLevel: number; // 0 to 100
  meshIndex: number;
  isSearched?: boolean;
  isCuffed?: boolean;
  transportCalled?: boolean;
  suspicionTimer?: number;
  fleeTimer?: number;
  loot?: SuspectLoot;
  confiscatedItems?: string[];
  interrogationData?: {
    suspectAlias: string;
    allegiance: string;
    intel: string;
    cooperated?: boolean;
  };
}

export type CivilianArchetype =
  | 'commuter'
  | 'shopper'
  | 'jogger'
  | 'tourist'
  | 'business'
  | 'skittish'
  | 'mechanic'
  | 'shopkeeper'
  | 'elder'
  | 'student';

export interface CivilianEntity {
  id: string;
  name?: string;
  archetype?: CivilianArchetype;
  communityDistrict?: 'cedar_heights' | 'downtown' | 'civic_center' | 'industrial';
  businessName?: string;
  role?: string;
  position: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
  rotation?: number;
  state: 'walking' | 'panicking' | 'cowering' | 'witnessing' | 'idling' | 'dodging' | 'dead';
  speed: number;
  meshIndex: number;
  dialogue?: string;
  accessory?: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'wrench' | 'groceries' | 'none';
  courage?: number; // 0 to 1: determines whether they flee immediately or continue walking normally
  idleTimer?: number;
  panicTimer?: number;
  dodgeTimer?: number;
  currentWaypointIndex?: number;
  routeId?: string;
  shoutCooldown?: number;
}

export interface MilitaryNPCEntity {
  id: string;
  name: string;
  callsign: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  state: 'patrolling' | 'suppressing' | 'advancing' | 'breaching';
  weapon: WeaponConfig;
  shootCooldown: number;
  meshIndex: number;
  squadLeader?: boolean;
  targetPos?: { x: number; y: number; z: number };
}

export interface PoliceNPCEntity {
  id: string;
  name: string;
  badgeNumber: string;
  role?: PoliceRole;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  state: 'patrolling' | 'responding' | 'engaging' | 'arresting' | 'perimeter' | 'evacuating';
  weapon: WeaponConfig;
  shootCooldown: number;
  meshIndex: number;
  targetPos?: { x: number; y: number; z: number };
  targetEnemyId?: string;
  assignedIncidentId?: string;
  isBackupUnit?: boolean;
  squadOffset?: { x: number; z: number };
}

export interface VehicleEntity {
  id: string;
  type: 'police' | 'criminal' | 'civilian' | 'armored' | 'ambulance';
  position: { x: number; y: number; z: number };
  rotation: number; // yaw in radians
  speed: number;
  steering: number;
  maxSpeed: number;
  acceleration: number;
  health: number;
  maxHealth: number;
  isSirenOn: boolean;
  isOccupiedByPlayer: boolean;
  occupiedByEnemyId?: string;
  color: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: 'casing' | 'narcotics' | 'datapad' | 'footprint' | 'weapon' | 'photo';
  description: string;
  locationName: string;
  position: { x: number; y: number; z: number };
  collected: boolean;
  photoTaken?: boolean;
  caseFile: string;
}

export interface EventMoralChoice {
  id: string;
  prompt: string;
  context: string;
  goodOption: {
    label: string;
    description: string;
    effect: string;
    reputationBonus: number;
    moneyBonus: number;
    xpBonus: number;
    dialogue: string;
  };
  shadyOption: {
    label: string;
    description: string;
    effect: string;
    reputationBonus: number;
    moneyBonus: number;
    xpBonus: number;
    valuableReward?: FictionalValuable;
    dialogue: string;
  };
}

export interface DynamicEvent {
  id: string;
  title: string;
  type:
    | 'robbery'
    | 'car_theft'
    | 'carjacking'
    | 'brawl'
    | 'street_fight'
    | 'fleeing_criminal'
    | 'armed_robbery'
    | 'store_robbery'
    | 'pursuit'
    | 'officer_backup'
    | 'civilian_report'
    | 'suspicious_valuable'
    | 'accident'
    | 'ambush_police'
    | 'bank_incident'
    | 'hostage'
    | 'disturbance'
    | 'fire'
    | 'prison_break'
    | 'disaster_crash'
    | 'gang_war'
    | 'civilian_emergency';
  description: string;
  locationName: string;
  position: { x: number; y: number; z: number };
  rewardMoney: number;
  rewardXP: number;
  active: boolean;
  timeRemaining: number;
  severity?: 'minor' | 'moderate' | 'high' | 'critical' | 'disaster';
  stage?: 'reported' | 'dispatching' | 'active' | 'escalating' | 'resolving' | 'resolved' | 'suspect_escaped';
  assignedUnits?: ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[];
  requiresUnits?: number;
  policeProgress?: number;
  visualEffect?: 'fire' | 'smoke' | 'debris' | 'barricade' | 'none';
  status?: 'pending' | 'active' | 'resolved' | 'failed' | 'cooldown' | 'completed' | 'inactive';
  spawnedEnemyIds?: string[];
  spawnedPoliceIds?: string[];
  spawnedCivilianIds?: string[];
  cooldownTimer?: number;
  moralChoice?: EventMoralChoice;
  choiceMade?: 'good' | 'shady';
}

export interface MissionObjective {
  id: string;
  description: string;
  targetType: 'kill' | 'arrest' | 'reach' | 'chase_stop' | 'collect' | 'photograph' | 'interrogate' | 'rescue';
  targetPos?: { x: number; y: number; z: number };
  currentCount: number;
  requiredCount: number;
  isCompleted: boolean;
}

export interface MissionChoice {
  id: string;
  prompt: string;
  optionA: { label: string; description: string; effect: string; reputationBonus: number };
  optionB: { label: string; description: string; effect: string; reputationBonus: number };
  chosen?: 'A' | 'B';
}

export interface Mission {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  description: string;
  mode: GameMode;
  rewardMoney: number;
  rewardXP: number;
  requiredRank: number;
  requiredPoliceTrust?: number;
  requiredUnderworldRep?: number;
  isUndergroundAssignment?: boolean;
  objectives: MissionObjective[];
  dialogueIntro: string[];
  dialogueOutro: string[];
  unlocked: boolean;
  completed: boolean;
  choice?: MissionChoice;
}

export interface FictionalValuable {
  id: string;
  name: string;
  estimatedValue: number;
  category?: 'contraband' | 'bearer_bonds' | 'jewels' | 'gold_bar' | 'crypto_drive' | 'rare_watch' | 'watch' | string;
  description?: string;
  source?: string;
  sourceLocation?: string;
  isContraband?: boolean;
  isStolenOrEvidence?: boolean;
  isBookedAsEvidence?: boolean;
  caseFileTag?: string;
}

export type MoralStanding =
  | 'incorruptible'
  | 'by_the_book'
  | 'street_pragmatist'
  | 'compromised'
  | 'rogue_kingpin';

export type EnterableBuildingId =
  | 'precinct_9'
  | 'metro_bank'
  | 'cedar_market'
  | 'industrial_pawn'
  | 'dock_hideout'
  | 'chinatown_diner'
  | string;

export interface EnterableBuilding {
  id: EnterableBuildingId;
  name: string;
  category: 'police' | 'bank' | 'shop' | 'safehouse' | 'hideout' | string;
  exteriorPos: { x: number; y: number; z: number };
  entranceRadius: number;
  description: string;
  tagline: string;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  money: number;
  bankSavings: number;
  integrity: number;
  backupCooldown?: number;
  valuables: FictionalValuable[];
  vaultValuables: FictionalValuable[];
  evidenceRecovered?: FictionalValuable[];
  xp: number;
  rank: number;
  rankName: string;
  wantedLevel: number; // 0 to 5
  wantedCooldown: number;
  kills: number;
  arrests: number;
  missionsCompleted: number;
  reputation: number; // 0 to 100 (Official Police Reputation)
  policeReputation?: number; // 0 to 100 (Official Police Standing)
  underworldReputation?: number; // 0 to 100 (Criminal Underworld Trust & Respect)
  suspicionLevel?: number; // 0 to 100 (Internal Affairs Heat & Officer Scrutiny)
  legitimateEarnings?: number; // Running total of clean police salary, mission rewards & lawful bounties
  secretEarnings?: number; // Running total of dirty money, bribes, extortion & fenced loot
  dirtyCash?: number; // Unlaundered cash carried on Carter's person
  iaViolations: number; // Internal Affairs infractions
  civiliansRescued: number;
  evidenceFound: number;
  flashlightOn: boolean;
  cameraMode: boolean;
  equippedGear: {
    firstAidKits: number;
    handcuffsCount: number;
    evidenceBags: number;
    policeRadioLevel: number;
  };
  lastBadgeEnding?: 'redemption' | 'king_of_underworld' | 'fallen_badge' | 'no_one_is_innocent';
  lastBadgeChoice?: 'confess' | 'destroy' | 'expose';
  campaignCompleted?: boolean;
}

export interface CustomizationSettings {
  outfit: 'rookie_patrol' | 'tactical_swat' | 'detective';
  vehicleColor: string;
  sirenType: 'classic' | 'wail' | 'phaser';
}

export type GameDifficulty = 'easy' | 'normal' | 'hard';
export type PreferredPlayStyle = 'balanced' | 'law_enforcement' | 'underworld';

export interface PlayerProfileSettings {
  callsign: string;
  age?: number | null;
  outfit: 'rookie_patrol' | 'tactical_swat' | 'detective';
  difficulty: GameDifficulty;
  playStyle: PreferredPlayStyle;
  hasCompletedIntro: boolean;
  campaignEnding?: 'coward' | 'devil' | null;
  campaignCompletedAt?: string;
  createdAt: string;
  lastPlayedAt?: string;
}

export const DEFAULT_PLAYER_PROFILE: PlayerProfileSettings = {
  callsign: 'Officer Carter',
  age: null,
  outfit: 'rookie_patrol',
  difficulty: 'normal',
  playStyle: 'balanced',
  hasCompletedIntro: false,
  createdAt: new Date().toISOString(),
};

export interface InputState {
  moveForward: number; // -1 to 1
  moveRight: number; // -1 to 1
  lookDeltaX: number;
  lookDeltaY: number;
  fire: boolean;
  aim: boolean;
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
  reload: boolean;
  interact: boolean;
  switchWeapon: boolean;
  toggleSiren: boolean;
  enterVehicle: boolean;
  handbrake: boolean;
  toggleFlashlight?: boolean;
  toggleCamera?: boolean;
  orderSurrender?: boolean;
  searchSuspect?: boolean;
  callBackup?: boolean;
  enterBuilding?: boolean;
  exitBuilding?: boolean;
}
