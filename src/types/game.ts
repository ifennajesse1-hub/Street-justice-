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
  state: 'idle' | 'patrol' | 'chase' | 'cover' | 'shoot' | 'flee' | 'surrendered' | 'arrested' | 'dead';
  weapon: WeaponConfig;
  target?: { x: number; y: number; z: number };
  targetEnemyId?: string;
  coverPosition?: { x: number; y: number; z: number };
  shootCooldown: number;
  alertLevel: number; // 0 to 100
  meshIndex: number;
  isSearched?: boolean;
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
  state: 'walking' | 'panicking' | 'cowering' | 'witnessing' | 'idling' | 'dodging';
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

export interface DynamicEvent {
  id: string;
  title: string;
  type:
    | 'robbery'
    | 'car_theft'
    | 'brawl'
    | 'pursuit'
    | 'hostage'
    | 'disturbance'
    | 'fire'
    | 'prison_break'
    | 'accident'
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
}

export interface MissionObjective {
  id: string;
  description: string;
  targetType: 'kill' | 'arrest' | 'reach' | 'chase_stop' | 'collect' | 'photograph' | 'interrogate';
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
  objectives: MissionObjective[];
  dialogueIntro: string[];
  dialogueOutro: string[];
  unlocked: boolean;
  completed: boolean;
  choice?: MissionChoice;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  money: number;
  xp: number;
  rank: number;
  rankName: string;
  wantedLevel: number; // 0 to 5
  wantedCooldown: number;
  kills: number;
  arrests: number;
  missionsCompleted: number;
  reputation: number; // 0 to 100
  iaViolations: number; // Internal Affairs excessive force
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
}

export interface CustomizationSettings {
  outfit: 'rookie_patrol' | 'tactical_swat' | 'detective';
  vehicleColor: string;
  sirenType: 'classic' | 'wail' | 'phaser';
}

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
}
