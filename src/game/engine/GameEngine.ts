import * as THREE from 'three';
import {
  WeaponConfig,
  PlayerStats,
  VehicleEntity,
  EnemyEntity,
  CivilianEntity,
  PoliceNPCEntity,
  MilitaryNPCEntity,
  InputState,
  TimeOfDay,
  WeatherType,
  Mission,
  CustomizationSettings,
} from '../../types/game';
import { generateCityDistrict, CityBuildResult, CollisionBox, getGroundElevation } from './CityGenerator';
import { createCharacterMesh, updateCharacterAnimation, CharacterRig, attachWeaponToRig } from './CharacterModels';
import { createBlockyCharacterMesh } from './BlockyCharacterModels';
import { createVehicleMesh, updateVehicleAnimation, VehicleRig } from './VehicleModels';
import { AIController } from '../ai/AIController';
import { PEDESTRIAN_CONFIGS } from '../ai/PedestrianSystem';
import { soundEngine } from '../audio/SoundEffects';
import { cityIncidentManager } from '../systems/DynamicEventsSystem';
import { authoritativeEncounterManager } from '../systems/EncounterManager';
import { DynamicEvent, EnterableBuilding, EnterableBuildingId } from '../../types/game';
import {
  ENTERABLE_BUILDINGS,
  buildBuildingInterior,
  ActiveInteriorState,
  InteriorInteractable,
} from './BuildingInteriors';

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  pos: { x: number; y: number; z: number };
  life: number;
}

export interface BulletTracer {
  start: THREE.Vector3;
  end: THREE.Vector3;
  life: number;
  maxLife: number;
  color: number;
}

export interface CivilianTrafficCar {
  entity: VehicleEntity;
  rig: VehicleRig;
  lane: 'north' | 'south' | 'east' | 'west' | 'outer_south';
  targetSpeed: number;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private currentViewportWidth: number = 0;
  private currentViewportHeight: number = 0;

  // City and collisions
  public cityData: CityBuildResult;
  public collisionBoxes: CollisionBox[] = [];

  // Characters
  public playerRig: CharacterRig;
  public playerPos: THREE.Vector3 = new THREE.Vector3();
  public playerVel: THREE.Vector3 = new THREE.Vector3();
  public playerYaw: number = 0;
  private previousPlayerRot: number = 0;
  public cameraPitch: number = 0.14; // Radians: comfortable natural elevation
  public cameraDistance: number = 4.8;
  public cameraLookAt: THREE.Vector3 = new THREE.Vector3();
  private isCameraInitialized: boolean = false;
  public isAiming: boolean = false;
  public isCrouching: boolean = false;
  public isSprinting: boolean = false;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public targetRecoilPitch: number = 0;

  // Waypoint Beacon
  public waypointBeaconGroup: THREE.Group;
  public waypointPos: THREE.Vector3 = new THREE.Vector3(-28, 0, -20);
  public isWaypointActive: boolean = true;
  private beaconDiamond: THREE.Mesh;
  private beaconRings: THREE.Mesh[] = [];

  // Vehicles & Civilian Road Traffic
  public vehicles: { entity: VehicleEntity; rig: VehicleRig }[] = [];
  public currentVehicleIndex: number = -1; // -1 = on foot
  public vehicleActionCooldown: number = 0; // Cooldown timer to prevent rapid/duplicate enter-exit triggering
  public timeInsideCurrentVehicle: number = 0; // Elapsed duration inside active vehicle to ensure reliable exiting
  public civilianTraffic: CivilianTrafficCar[] = [];
  public activePursuitVehicle: { entity: VehicleEntity; rig: VehicleRig } | null = null;

  // AI & Mission Encounters
  public ai: AIController;
  public encounterTriggered: boolean = false;
  public currentMission: Mission | null = null;
  public missionEnemies: EnemyEntity[] = [];
  public missionHostages: CivilianEntity[] = [];

  // Lighting & Environment
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public isFlashlightActive: boolean = false;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  public evidenceGroup: THREE.Group;
  public timeOfDay: TimeOfDay = 'day';
  public weather: WeatherType = 'clear';
  private rainParticles?: THREE.Points;

  // Jump, Camera Shake & Audio Physics
  public isGrounded: boolean = true;
  public verticalVelocity: number = 0;
  public cameraShakeAmount: number = 0;
  private footstepTimer: number = 0;
  public recentGunshotTimer: number = 0;
  public isCinematicMode: boolean = false;
  private cinematicTimer: number = 0;

  // Bullets & FX
  private bulletTracers: BulletTracer[] = [];
  private tracerLineMesh: THREE.LineSegments;
  private tracerPositions: Float32Array;
  private tracerColors: Float32Array;
  public floatingTexts: FloatingText[] = [];

  // Callbacks for UI sync
  public onStatsChanged?: (stats: PlayerStats) => void;
  public onPlayerDamaged?: (damage: number) => void;
  public playerDamageCooldownTimer: number = 0;
  public onWeaponChanged?: (weapon: WeaponConfig) => void;
  public onNotification?: (text: string, type: 'info' | 'alert' | 'success') => void;
  public onMissionObjectiveProgress?: (type: string, amount: number) => void;
  public onIncidentResolved?: (inc: DynamicEvent) => void;
  public onEventMoralChoiceAvailable?: (event: DynamicEvent) => void;
  public onOpenArrestEvidenceModal?: (enemy: EnemyEntity) => void;
  public onWitnessMisconductAlert?: (civilian: CivilianEntity, actionDescription: string) => void;
  public onTriggerFinalMissionCinematic?: (phase?: 'phase1_threat' | 'phase2_climax_handshake') => void;
  public onTriggerOneSmallMatterScene?: (phase: 'stage1_whistleblower' | 'stage3_collapse' | 'stage6_confrontation') => void;
  public isBuildingCollapsed: boolean = false;
  public collapsedRubbleGroup: THREE.Group | null = null;
  public oneSmallMatterMateoRig?: CharacterRig;

  // Enterable Buildings & 3D Interior Simulation
  public activeInterior: ActiveInteriorState | null = null;
  public nearbyBuildingEntrance: EnterableBuilding | null = null;
  public nearbyInteriorInteractable: InteriorInteractable | null = null;
  public onBuildingEntranceChanged?: (building: EnterableBuilding | null) => void;
  public onInteriorInteractableChanged?: (interactable: InteriorInteractable | null) => void;
  public onInteriorStateChanged?: (interior: ActiveInteriorState | null) => void;
  public onTriggerInteriorInteraction?: (interactable: InteriorInteractable) => void;
  public exteriorEntranceMarkersGroup: THREE.Group = new THREE.Group();

  // Dynamic City Incidents & Tactical Visuals
  public incidentVisualsGroup: THREE.Group;
  private incidentPropsMap: Map<string, THREE.Group> = new Map();
  private incidentSpawnedActors: Set<string> = new Set();
  public incidentPromptedChoices: Set<string> = new Set();
  private incidentFlames: { mesh: THREE.Mesh; baseScale: number; speed: number; offset: number }[] = [];
  private incidentSmokeRings: { mesh: THREE.Mesh; startY: number; speed: number; offset: number }[] = [];
  private incidentEmergencyBeacons: { light: THREE.PointLight; speed: number; color1: number; color2: number }[] = [];

  // State
  public stats: PlayerStats;
  public weapons: WeaponConfig[];
  public activeWeaponIndex: number = 0;
  private shootCooldownTimer: number = 0;
  private timer: THREE.Timer = new THREE.Timer();
  private suspicionDecayTimer: number = 20; // Periodic decay for suspicion during lawful patrols
  private iaAuditAuditTimer: number = 45; // Periodic check for IA heat consequences

  constructor(
    container: HTMLElement,
    initialStats: PlayerStats,
    initialWeapons: WeaponConfig[]
  ) {
    this.container = container;
    this.stats = { ...initialStats };
    this.weapons = [...initialWeapons];

    // Scene & Atmosphere: Crisp open daytime sky with subtle atmospheric depth
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa);
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0018);

    // Initial third-person orientation: Officer Carter looks straight down the avenue
    this.playerYaw = Math.PI;
    this.cameraPitch = 0.14;
    this.cameraDistance = 4.8;

    // Camera & Safe Viewport
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    this.currentViewportWidth = width;
    this.currentViewportHeight = height;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(65, isNaN(aspect) || aspect <= 0 ? 16 / 9 : aspect, 0.1, 1000);

    // Renderer: Full-bleed edge-to-edge rendering without letterboxing or black borders
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Full-bleed edge-to-edge canvas styling
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    container.appendChild(this.renderer.domElement);

    // Atmosphere Lighting: rich ambient sky hemisphere + brilliant directional sunlight
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x475569, 1.25);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    this.dirLight.position.set(50, 100, 45);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 250;
    this.dirLight.shadow.camera.left = -90;
    this.dirLight.shadow.camera.right = 90;
    this.dirLight.shadow.camera.top = 90;
    this.dirLight.shadow.camera.bottom = -90;
    this.scene.add(this.dirLight);

    // Tactical Flashlight (attached to officer)
    this.flashlight = new THREE.SpotLight(0xfffbeb, 4.5, 45, Math.PI / 5, 0.35, 1.2);
    this.flashlight.visible = false;
    this.flashlight.castShadow = true;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Evidence 3D markers group
    this.evidenceGroup = new THREE.Group();
    const evidenceMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const evidenceRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });

    // 4 Forensics Markers in world
    const evPositions = [
      { x: -29.2, y: 0.1, z: -23.5 }, // Casing near dumpster
      { x: -26.2, y: 0.6, z: -21.0 }, // Datapad on crate
      { x: -30.6, y: 1.5, z: -27.0 }, // Gang spray graffiti
      { x: -14.0, y: 0.05, z: -15.0 }, // Footprints trail
    ];

    evPositions.forEach((ep) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 16), evidenceRingMat);
      ring.rotateX(-Math.PI / 2);
      ring.position.set(ep.x, ep.y + 0.02, ep.z);
      this.evidenceGroup.add(ring);

      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), evidenceMat);
      beacon.position.set(ep.x, ep.y + 0.6, ep.z);
      this.evidenceGroup.add(beacon);
    });

    this.scene.add(this.evidenceGroup);

    // Dynamic Incident 3D World Visuals Group
    this.incidentVisualsGroup = new THREE.Group();
    this.scene.add(this.incidentVisualsGroup);

    // Enterable Building Exterior Entrance Beacons
    this.scene.add(this.exteriorEntranceMarkersGroup);
    this.initExteriorBuildingMarkers();

    // City Incident Manager Radio Broadcast Dispatch Wireup
    cityIncidentManager.onRadioBroadcast = (msg, type) => {
      this.onNotification?.(msg, type);
    };

    // Build City
    this.cityData = generateCityDistrict();
    this.scene.add(this.cityData.sceneGroup);
    this.collisionBoxes = this.cityData.collisionBoxes;

    // AI Controller
    this.ai = new AIController();

    // Player Rig (Officer Alex Carter)
    this.playerRig = createCharacterMesh('player');
    attachWeaponToRig(this.playerRig, this.weapons[this.activeWeaponIndex].category);
    this.playerPos.copy(this.cityData.spawnPoints.player);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.scene.add(this.playerRig.root);

    // 3D In-World Objective Waypoint Beacon
    this.waypointBeaconGroup = new THREE.Group();
    this.waypointBeaconGroup.position.copy(this.waypointPos);

    // Vertical Light Column
    const beamGeom = new THREE.CylinderGeometry(0.8, 0.8, 30, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.y = 15;
    this.waypointBeaconGroup.add(beam);

    // Central Floating Diamond Marker
    const diamondGeom = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    this.beaconDiamond = new THREE.Mesh(diamondGeom, diamondMat);
    this.beaconDiamond.position.y = 2.6;
    this.waypointBeaconGroup.add(this.beaconDiamond);

    // Concentric Pulsing Ground Rings
    for (let r = 0; r < 2; r++) {
      const ringGeom = new THREE.RingGeometry(1.2 + r * 1.5, 1.4 + r * 1.5, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.y = 0.04;
      this.waypointBeaconGroup.add(ring);
      this.beaconRings.push(ring);
    }

    this.scene.add(this.waypointBeaconGroup);

    // Spawn Police Cruiser
    const policeRig = createVehicleMesh('police');
    policeRig.root.position.copy(this.cityData.spawnPoints.policeVehicle);
    policeRig.root.rotation.y = Math.PI;
    this.scene.add(policeRig.root);
    this.vehicles.push({
      entity: {
        id: 'police_cruiser_1',
        type: 'police',
        position: { x: policeRig.root.position.x, y: 0, z: policeRig.root.position.z },
        rotation: policeRig.root.rotation.y,
        speed: 0,
        steering: 0,
        maxSpeed: 28,
        acceleration: 18,
        health: 250,
        maxHealth: 250,
        isSirenOn: false,
        isOccupiedByPlayer: false,
        color: '#ffffff',
      },
      rig: policeRig,
    });

    // Spawn Faction Vehicles across territories
    const factionVehiclesToSpawn = [
      {
        id: 'aegis_apc_1',
        type: 'armored' as const,
        pos: new THREE.Vector3(20, 0, 14),
        rot: Math.PI,
        color: '#b49a79',
        faction: 'aegis_taskforce' as const,
        maxSpeed: 24,
        health: 400,
      },
      {
        id: 'cobalt_rumbler_1',
        type: 'criminal' as const,
        pos: new THREE.Vector3(36, 0, 32),
        rot: 0,
        color: '#1e40af',
        faction: 'cobalt_skulls' as const,
        maxSpeed: 27,
        health: 220,
      },
      {
        id: 'python_tuner_1',
        type: 'criminal' as const,
        pos: new THREE.Vector3(-24, 0, -14),
        rot: 0,
        color: '#84cc16',
        faction: 'neon_pythons' as const,
        maxSpeed: 30,
        health: 190,
      },
      {
        id: 'viper_heavy_suv_1',
        type: 'armored' as const,
        pos: new THREE.Vector3(16, 0, -44),
        rot: Math.PI / 2,
        color: '#991b1b',
        faction: 'iron_vipers' as const,
        maxSpeed: 25,
        health: 320,
      },
    ];

    factionVehiclesToSpawn.forEach((fv) => {
      const vRig = createVehicleMesh(fv.type, fv.color, fv.faction);
      vRig.root.position.copy(fv.pos);
      vRig.root.rotation.y = fv.rot;
      this.scene.add(vRig.root);
      this.vehicles.push({
        entity: {
          id: fv.id,
          type: fv.type,
          position: { x: fv.pos.x, y: 0, z: fv.pos.z },
          rotation: fv.rot,
          speed: 0,
          steering: 0,
          maxSpeed: fv.maxSpeed,
          acceleration: 17,
          health: fv.health,
          maxHealth: fv.health,
          isSirenOn: false,
          isOccupiedByPlayer: false,
          color: fv.color,
        },
        rig: vRig,
      });
    });

    // Spawn Dynamic Civilian Road Traffic & Moving Police Patrols
    const trafficConfigs: { id: string; type?: 'civilian' | 'police'; color: string; lane: 'south' | 'north' | 'east' | 'west' | 'outer_south'; pos: THREE.Vector3; rot: number; speed: number }[] = [
      { id: 'traffic_taxi_1', type: 'civilian', color: '#eab308', lane: 'north', pos: new THREE.Vector3(-3.5, 0, 75), rot: Math.PI, speed: 13 },
      { id: 'traffic_sedan_1', type: 'civilian', color: '#0284c7', lane: 'south', pos: new THREE.Vector3(3.5, 0, -60), rot: 0, speed: 14 },
      { id: 'traffic_hatch_1', type: 'civilian', color: '#dc2626', lane: 'east', pos: new THREE.Vector3(-65, 0, -3.5), rot: Math.PI / 2, speed: 13.5 },
      { id: 'traffic_suv_1', type: 'civilian', color: '#64748b', lane: 'west', pos: new THREE.Vector3(70, 0, 3.5), rot: -Math.PI / 2, speed: 13 },
      { id: 'traffic_van_1', type: 'civilian', color: '#15803d', lane: 'outer_south', pos: new THREE.Vector3(7.5, 0, -95), rot: 0, speed: 12 },
      { id: 'traffic_police_patrol_2', type: 'police', color: '#ffffff', lane: 'south', pos: new THREE.Vector3(3.5, 0, 30), rot: 0, speed: 11 },
    ];

    trafficConfigs.forEach((tc) => {
      const vType = tc.type || 'civilian';
      const tRig = createVehicleMesh(vType, tc.color);
      tRig.root.position.copy(tc.pos);
      tRig.root.rotation.y = tc.rot;
      this.scene.add(tRig.root);
      const vehicleItem = {
        entity: {
          id: tc.id,
          type: vType,
          position: { x: tc.pos.x, y: 0, z: tc.pos.z },
          rotation: tc.rot,
          speed: tc.speed,
          steering: 0,
          maxSpeed: vType === 'police' ? 26 : 22,
          acceleration: 14,
          health: vType === 'police' ? 240 : 180,
          maxHealth: vType === 'police' ? 240 : 180,
          isSirenOn: vType === 'police',
          isOccupiedByPlayer: false,
          color: tc.color,
        },
        rig: tRig,
      };
      this.vehicles.push(vehicleItem);
      this.civilianTraffic.push({
        entity: vehicleItem.entity,
        rig: tRig,
        lane: tc.lane,
        targetSpeed: tc.speed,
      });
    });

    // Spawn Diverse Pedestrian Traffic across City Sidewalks, Plazas and Storefronts
    PEDESTRIAN_CONFIGS.forEach((cfg) => {
      const civRig = createCharacterMesh('civilian', cfg.archetype, cfg.name);
      this.scene.add(civRig.root);
      this.ai.spawnCivilian(new THREE.Vector3(cfg.spawnPos.x, 0, cfg.spawnPos.z), civRig, cfg);
    });

    // Spawn Police Officer NPCs (patrolling Precinct 9, Avenue crossing, and Commercial promenade)
    const policeSpawnConfigs = [
      { name: 'Officer Miller', badge: '204', pos: new THREE.Vector3(-22, 0, 24) },
      { name: 'Officer Hayes', badge: '198', pos: new THREE.Vector3(-12, 0, 6) },
      { name: 'Officer Kowalski', badge: '215', pos: new THREE.Vector3(-16, 0, -20) },
    ];
    policeSpawnConfigs.forEach((pc) => {
      const pRig = createCharacterMesh('police_npc', 'default', pc.name);
      this.scene.add(pRig.root);
      this.ai.spawnPoliceNPC(pc.pos, pRig, pc.name, pc.badge);
    });

    // Spawn Aegis Defense Taskforce (Tactical Military / High-Security PMC at Checkpoint)
    const militarySpawnConfigs = [
      { name: 'Sergeant Briggs', callsign: 'Aegis-Lead', pos: new THREE.Vector3(19, 0, 18), isLeader: true },
      { name: 'Specialist Reyes', callsign: 'Aegis-Two', pos: new THREE.Vector3(23, 0, 18), isLeader: false },
    ];
    militarySpawnConfigs.forEach((mc) => {
      const mRig = createCharacterMesh('military_soldier', 'default', mc.name, 'aegis_taskforce');
      this.scene.add(mRig.root);
      this.ai.spawnMilitarySoldier(mc.pos, mRig, mc.name, mc.callsign, mc.isLeader);
    });

    // Spawn Fictional Gang Factions across territories (situated deep in their respective sectors)
    const initialCriminals = [
      // The Cobalt Skulls (Industrial Logistics Warehouse & Docks)
      { name: 'Skulls Biker Axle', type: 'thug' as const, pos: new THREE.Vector3(42, 0, 32), faction: 'cobalt_skulls' as const },
      { name: 'Skulls Enforcer Diesel', type: 'enforcer' as const, pos: new THREE.Vector3(48, 0, 38), faction: 'cobalt_skulls' as const },

      // The Neon Pythons (Midtown Commercial Alleyway - back lane)
      { name: 'Python Striker Volt', type: 'thug' as const, pos: new THREE.Vector3(-36, 0, -26), faction: 'neon_pythons' as const },
      { name: 'Python Gunner Pulse', type: 'thug' as const, pos: new THREE.Vector3(-42, 0, -30), faction: 'neon_pythons' as const },

      // The Iron Vipers (Northern Freight Depot & Perimeter)
      { name: 'Viper Heavy Sledge', type: 'enforcer' as const, pos: new THREE.Vector3(14, 0, -56), faction: 'iron_vipers' as const },
      { name: 'Viper Guard Fang', type: 'thug' as const, pos: new THREE.Vector3(24, 0, -58), faction: 'iron_vipers' as const },

      // The Eclipse Syndicate (High-Tech Extremist Syndicate near Financial Plaza)
      { name: 'Eclipse Operative Ghost', type: 'syndicate_operative' as const, pos: new THREE.Vector3(48, 0, -32), faction: 'eclipse_syndicate' as const },
      { name: 'Eclipse Infiltrator Vector', type: 'syndicate_operative' as const, pos: new THREE.Vector3(54, 0, -36), faction: 'eclipse_syndicate' as const },
    ];
    initialCriminals.forEach((c) => {
      const crimRig = createCharacterMesh(c.type, 'default', c.name, c.faction);
      this.scene.add(crimRig.root);
      this.ai.spawnEnemy(c.type, c.pos, crimRig, c.name, c.faction);
    });

    // Wire up Police NPC & Military shooting & callout callbacks
    this.ai.onPoliceShoot = (police, targetPos) => {
      this.policeFireBullet(police, targetPos);
    };
    this.ai.onMilitaryShoot = (soldier, targetPos) => {
      this.militaryFireBullet(soldier, targetPos);
    };
    this.ai.onRadioCallout = (callout, type) => {
      this.onNotification?.(callout, type);
    };
    this.ai.onPedestrianShout = (civ, text) => {
      this.addFloatingText(text, '#fef08a', civ.position);
    };
    this.ai.onEnemyArrested = (enemy) => {
      this.checkEnemyIncidentResolution(enemy.id);
    };
    this.ai.onEnemyKilledByPolice = (enemy, officer) => {
      this.stats.kills++;
      this.stats.xp += 75;
      this.stats.money += 50;
      this.onStatsChanged?.(this.stats);
      this.onMissionObjectiveProgress?.('kill', 1);
      this.checkEnemyIncidentResolution(enemy.id);
    };

    // Setup Bullet Tracers
    const maxTracers = 50;
    this.tracerPositions = new Float32Array(maxTracers * 6);
    this.tracerColors = new Float32Array(maxTracers * 6);
    const tracerGeom = new THREE.BufferGeometry();
    tracerGeom.setAttribute('position', new THREE.BufferAttribute(this.tracerPositions, 3));
    tracerGeom.setAttribute('color', new THREE.BufferAttribute(this.tracerColors, 3));
    const tracerMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.tracerLineMesh = new THREE.LineSegments(tracerGeom, tracerMat);
    this.scene.add(this.tracerLineMesh);

    // Weather particles
    this.setupRainParticles();

    // Automatic Resize Observer for dynamic viewport, orientation change, and responsive resizing
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: rw, height: rh } = entry.contentRect;
          if (rw > 0 && rh > 0) {
            this.resize(rw, rh);
          }
        }
      });
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', this.onResize);

    // Initial camera positioning and scene render
    this.initCameraPosition();
  }

  /**
   * Set active mission and calibrate GPS beacon to current objective
   */
  public setMission(mission: Mission) {
    this.currentMission = mission;
    this.isWaypointActive = true;
    this.activePursuitVehicle = null;

    // Check if this mission's encounter was already completed in the authoritative manager
    const existingEnc = authoritativeEncounterManager.getEncounterByMissionId(mission.id);
    if (existingEnc && existingEnc.state === 'COMPLETED') {
      this.encounterTriggered = true;
    } else {
      this.encounterTriggered = false;
    }

    // Clear previous encounter enemies from world
    this.missionEnemies.forEach((e) => {
      const idx = this.ai.enemies.findIndex((item) => item.id === e.id);
      if (idx >= 0) {
        if (this.ai.enemyRigs[idx]) {
          this.scene.remove(this.ai.enemyRigs[idx].root);
        }
        this.ai.enemies.splice(idx, 1);
        this.ai.enemyRigs.splice(idx, 1);
      }
    });
    this.missionEnemies = [];

    // Clear previous mission hostages from world
    this.missionHostages.forEach((h) => {
      const idx = this.ai.civilians.findIndex((item) => item.id === h.id);
      if (idx >= 0) {
        if (this.ai.civilianRigs[idx]) {
          this.scene.remove(this.ai.civilianRigs[idx].root);
        }
        this.ai.civilians.splice(idx, 1);
        this.ai.civilianRigs.splice(idx, 1);
      }
    });
    this.missionHostages = [];

    // Calibrate waypoint to the active reach/target position
    const targetObj = mission.objectives.find((o) => !o.isCompleted && o.targetPos) || mission.objectives[0];
    if (targetObj && targetObj.targetPos) {
      this.waypointPos.set(targetObj.targetPos.x, 0, targetObj.targetPos.z);
      this.waypointBeaconGroup.position.copy(this.waypointPos);
    }
  }

  /**
   * Triggers the encounter at the target waypoint:
   * - Stolen vehicle / pursuit: spawns fleeing suspect getaway vehicle that maneuvers through streets
   * - Robbery / street crime / hostage: spawns armed suspects taking tactical cover
   */
  public triggerMissionEncounter(mission: Mission) {
    const isHostage = mission.title.toLowerCase().includes('hostage');
    const isChaseMission =
      mission.mode === 'chase' ||
      mission.objectives.some((o) => o.targetType === 'chase_stop') ||
      mission.id === 'ch3_highway_pursuit' ||
      mission.id.includes('stolen') ||
      mission.id.includes('pursuit');

    const encounterId = `mission_enc_${mission.id}`;
    authoritativeEncounterManager.registerEncounter({
      id: encounterId,
      type: isHostage ? 'hostage' : isChaseMission ? 'pursuit' : 'robbery',
      title: mission.title,
      missionId: mission.id,
      locationName: mission.subtitle || 'Crime Scene',
      position: { x: this.waypointPos.x, y: 0, z: this.waypointPos.z },
      rewardXP: mission.rewardXP,
      rewardMoney: mission.rewardMoney,
      repeatable: false,
    });

    // Authoritative check: Never start if active, completed, or on cooldown
    if (!authoritativeEncounterManager.canStartEncounter(encounterId)) {
      return;
    }

    if (this.encounterTriggered) return;
    this.encounterTriggered = true;

    // Start encounter authoritatively (spawns actors strictly once)
    authoritativeEncounterManager.startEncounter(encounterId, (enc) => {
      soundEngine.playRadioChime();
      this.onMissionObjectiveProgress?.('reach', 1);

      if (isChaseMission) {
        // Find or create pursuit vehicle
        let pursuitVeh = this.vehicles.find((v) => v.entity.type === 'criminal' && v.entity.health > 0);
        if (!pursuitVeh) {
          const pRig = createVehicleMesh('criminal', '#dc2626', 'cobalt_skulls');
          pRig.root.position.set(this.waypointPos.x, 0, this.waypointPos.z);
          this.scene.add(pRig.root);
          pursuitVeh = {
            entity: {
              id: `pursuit_veh_${Date.now()}`,
              type: 'criminal',
              position: { x: this.waypointPos.x, y: 0, z: this.waypointPos.z },
              rotation: 0,
              speed: 20,
              steering: 0,
              maxSpeed: 28,
              acceleration: 20,
              health: 260,
              maxHealth: 260,
              isSirenOn: false,
              isOccupiedByPlayer: false,
              color: '#dc2626',
            },
            rig: pRig,
          };
          this.vehicles.push(pursuitVeh);
        } else {
          pursuitVeh.entity.position.x = this.waypointPos.x;
          pursuitVeh.entity.position.z = this.waypointPos.z;
          pursuitVeh.entity.health = pursuitVeh.entity.maxHealth;
          pursuitVeh.entity.speed = 18;
        }

        this.activePursuitVehicle = pursuitVeh;
        soundEngine.playTireScreech();
        this.onNotification?.(
          'DISPATCH 10-33: Suspect getaway vehicle fleeing! Engage sirens and disable the vehicle!',
          'alert'
        );
        return;
      }

      // Foot combat / robbery / extortion / hostage encounter
      // Clear previous mission enemies
      this.missionEnemies.forEach((e) => {
        const idx = this.ai.enemies.findIndex((item) => item.id === e.id);
        if (idx >= 0) {
          if (this.ai.enemyRigs[idx]) {
            this.scene.remove(this.ai.enemyRigs[idx].root);
          }
          this.ai.enemies.splice(idx, 1);
          this.ai.enemyRigs.splice(idx, 1);
        }
      });
      this.missionEnemies = [];

      const isOneSmallMatter = mission.id === 'ch9_one_small_matter';
      if (isOneSmallMatter) {
        const meetMateoObj = mission.objectives.find((o) => o.id === 'obj_osm_meet_mateo');
        const collapseObj = mission.objectives.find((o) => o.id === 'obj_osm_respond_collapse');

        if (meetMateoObj && !meetMateoObj.isCompleted) {
          // 1. Spawn Mateo Cruz at site entrance (-24, 0, 38)
          if (!this.oneSmallMatterMateoRig) {
            const mRig = createCharacterMesh('civilian', 'street_youth_marcus', 'Mateo Cruz');
            mRig.root.position.set(-24, 0, 38);
            this.scene.add(mRig.root);
            this.oneSmallMatterMateoRig = mRig;
          }

          // 2. Spawn 3 Sterling Intimidation Enforcers near trailer
          const enforcers = [
            { name: 'Sterling Enforcer Hammer', type: 'enforcer' as const, pos: new THREE.Vector3(-28, 0, 42) },
            { name: 'Sterling Guard Knox', type: 'enforcer' as const, pos: new THREE.Vector3(-31, 0, 44) },
            { name: 'Sterling Thug Brick', type: 'thug' as const, pos: new THREE.Vector3(-26, 0, 40) },
          ];

          enforcers.forEach((c) => {
            const rig = createCharacterMesh(c.type, 'default', c.name, 'eclipse_syndicate');
            this.scene.add(rig.root);
            const enemy = this.ai.spawnEnemy(c.type, c.pos, rig, c.name, 'eclipse_syndicate');
            enemy.alertLevel = 100;
            this.missionEnemies.push(enemy);
            enc.spawnedEnemyIds.push(enemy.id);
          });

          this.onTriggerOneSmallMatterScene?.('stage1_whistleblower');
          this.onMissionObjectiveProgress?.('reach', 1);

          this.onNotification?.(
            "WHISTLEBLOWER THREAT: Neutralize or order surrender of Sterling's enforcers behind trailer!",
            'alert'
          );
          return;
        }

        if (collapseObj && !collapseObj.isCompleted) {
          this.triggerBuildingCollapseEvent();
          this.onTriggerOneSmallMatterScene?.('stage3_collapse');
          this.onMissionObjectiveProgress?.('reach', 1);
          return;
        }
      }

      const isFinalChapter = mission.id === 'ch8_death_before_betrayal';
      const isBoss = mission.id === 'ch5_viper_showdown';
      const isSyndicate = mission.id === 'ch4_bank_hostage';
      const isCedar = mission.id === 'ch2_cedar_defense';

      let configs: { name: string; type: 'thug' | 'enforcer' | 'syndicate_operative' | 'boss'; pos: THREE.Vector3; faction?: any; variant?: string }[] = [];

      if (isFinalChapter) {
        // 5 Syndicate Elite Heavy Operatives guarding the Industrial Logistics Depot Stronghold
        configs = [
          { name: 'Syndicate Vanguard', type: 'enforcer', pos: new THREE.Vector3(53, 0, -56), faction: 'eclipse_syndicate', variant: 'syndicate_heavy' },
          { name: 'Syndicate Breacher', type: 'enforcer', pos: new THREE.Vector3(58, 0, -54), faction: 'eclipse_syndicate', variant: 'syndicate_heavy' },
          { name: 'Syndicate Heavy Gunner', type: 'enforcer', pos: new THREE.Vector3(62, 0, -48), faction: 'eclipse_syndicate', variant: 'syndicate_heavy' },
          { name: 'Syndicate Infiltrator', type: 'thug', pos: new THREE.Vector3(48, 0, -46), faction: 'eclipse_syndicate', variant: 'syndicate_heavy' },
          { name: 'Syndicate Tactician', type: 'enforcer', pos: new THREE.Vector3(55, 0, -44), faction: 'eclipse_syndicate', variant: 'syndicate_heavy' },
        ];
      } else if (isBoss) {
        configs = [
          { name: 'Viper Vance', type: 'boss', pos: new THREE.Vector3(65, 0, 65), faction: 'iron_vipers' },
          { name: 'Viper Sledge', type: 'enforcer', pos: new THREE.Vector3(62, 0, 68), faction: 'iron_vipers' },
          { name: 'Viper Fang', type: 'thug', pos: new THREE.Vector3(68, 0, 62), faction: 'iron_vipers' },
        ];
      } else if (isSyndicate) {
        configs = [
          { name: 'Operative Ghost', type: 'syndicate_operative', pos: new THREE.Vector3(45, 0, -32), faction: 'eclipse_syndicate' },
          { name: 'Operative Vector', type: 'syndicate_operative', pos: new THREE.Vector3(48, 0, -36), faction: 'eclipse_syndicate' },
          { name: 'Operative Cipher', type: 'syndicate_operative', pos: new THREE.Vector3(41, 0, -38), faction: 'eclipse_syndicate' },
        ];
      } else if (isCedar) {
        configs = [
          { name: 'Skulls Axle', type: 'thug', pos: new THREE.Vector3(-60, 0, -18), faction: 'cobalt_skulls' },
          { name: 'Skulls Diesel', type: 'enforcer', pos: new THREE.Vector3(-63, 0, -22), faction: 'cobalt_skulls' },
          { name: 'Skulls Riff', type: 'thug', pos: new THREE.Vector3(-58, 0, -24), faction: 'cobalt_skulls' },
        ];
      } else {
        const cx = this.waypointPos.x;
        const cz = this.waypointPos.z;
        const f = mission.title.includes('Python')
          ? 'neon_pythons'
          : mission.title.includes('Viper')
          ? 'iron_vipers'
          : mission.title.includes('Cobalt') || mission.title.includes('Skulls')
          ? 'cobalt_skulls'
          : 'neon_pythons';

        configs = [
          { name: 'Suspect Lead', type: 'enforcer', pos: new THREE.Vector3(cx + 1.5, 0, cz - 2), faction: f },
          { name: 'Suspect Runner', type: 'thug', pos: new THREE.Vector3(cx - 2.5, 0, cz + 1.5), faction: f },
          { name: 'Suspect Lookout', type: 'thug', pos: new THREE.Vector3(cx + 3.0, 0, cz + 3.0), faction: f },
        ];
      }

      configs.forEach((c) => {
        const rig = createCharacterMesh(c.type, c.variant || 'default', c.name, c.faction);
        this.scene.add(rig.root);
        const enemy = this.ai.spawnEnemy(c.type, c.pos, rig, c.name, c.faction);
        enemy.alertLevel = 100;
        if (isFinalChapter) {
          enemy.maxHealth = 180;
          enemy.health = 180;
        }
        this.missionEnemies.push(enemy);
        enc.spawnedEnemyIds.push(enemy.id);
      });

      // Spawn civilian hostages
      if (isFinalChapter) {
        // Spawn 3 distinct captive civilians with real health and bound blocky meshes
        const hostagesInfo = [
          { name: 'Captive Elena', pos: new THREE.Vector3(53.5, 0, -51), role: 'Hostage Resident' },
          { name: 'Captive Marcus', pos: new THREE.Vector3(56.5, 0, -52), role: 'Hostage Youth' },
          { name: 'Captive Dr. Aris', pos: new THREE.Vector3(55.0, 0, -48), role: 'Hostage Scientist' },
        ];

        hostagesInfo.forEach((hInfo) => {
          const hRig = createCharacterMesh('civilian', 'hostage_bound', hInfo.name);
          this.scene.add(hRig.root);
          const hCiv = this.ai.spawnCivilian(hInfo.pos, hRig, { name: hInfo.name });
          hCiv.state = 'cowering';
          (hCiv as any).health = 120;
          (hCiv as any).maxHealth = 120;
          (hCiv as any).isCaptive = true;
          (hCiv as any).isRescued = false;
          this.missionHostages.push(hCiv);
          enc.spawnedHostageIds.push(hCiv.id);
        });

        // Trigger Phase 1 cinematic sequence for the final mission
        this.onTriggerFinalMissionCinematic?.('phase1_threat');

        this.onNotification?.(
          'CRITICAL ULTIMATUM: Julian Vance holds 3 hostages at the depot! Choose Carter\'s destiny.',
          'alert'
        );
      } else if (isHostage) {
        const hostageRig = createCharacterMesh('civilian', 'default', 'Hostage Citizen');
        this.scene.add(hostageRig.root);
        const hCiv = this.ai.spawnCivilian(new THREE.Vector3(this.waypointPos.x - 1.5, 0, this.waypointPos.z + 0.5), hostageRig, { name: 'Hostage Citizen' });
        hCiv.state = 'panicking';
        hCiv.panicTimer = 120;
        (hCiv as any).health = 100;
        (hCiv as any).maxHealth = 100;
        (hCiv as any).isCaptive = true;
        (hCiv as any).isRescued = false;
        this.missionHostages.push(hCiv);
        enc.spawnedHostageIds.push(hCiv.id);

        this.onNotification?.(
          'DISPATCH 10-33: HOSTAGES IN PERIL! Move in, order surrender or neutralize hostiles without civilian harm!',
          'alert'
        );
      } else {
        this.onNotification?.(
          'DISPATCH 10-23: Armed suspects engaged at scene! Order surrender or neutralize!',
          'alert'
        );
      }
    });
  }

  /**
   * Triggers the scripted 3D building collapse event for "One Small Matter":
   * Camera shake, crumbling rubble, dust clouds, crushed vehicles,
   * 3 trapped survivors (Leo, Sarah, Davies), syndicate fixers, and forensic evidence collectibles!
   */
  public triggerBuildingCollapseEvent() {
    if (this.isBuildingCollapsed) return;
    this.isBuildingCollapsed = true;

    // 1. Audio & Camera Earthquake Shake
    soundEngine.playBuildingCrack();
    soundEngine.playExplosion();
    soundEngine.toggleSiren(true);
    this.cameraShakeAmount = 0.95;

    // 2. 3D Rubble & Collapse Geometry
    const rubbleGroup = new THREE.Group();
    rubbleGroup.position.set(-24, 0, 48);

    const concreteRubbleMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rebarTwistMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
      metalness: 0.6,
    });

    // Tilted shattered concrete roof slab
    const fallenSlab = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.9, 6.2), concreteRubbleMat);
    fallenSlab.position.set(-3.5, 1.2, -4.5);
    fallenSlab.rotation.set(0.18, 0.22, -0.25);
    fallenSlab.castShadow = true;
    fallenSlab.receiveShadow = true;
    rubbleGroup.add(fallenSlab);

    // Secondary crushed masonry pile
    const masonryPile = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 4.8), concreteRubbleMat);
    masonryPile.position.set(2.8, 0.7, -5.2);
    masonryPile.rotation.set(-0.12, 0.35, 0.1);
    rubbleGroup.add(masonryPile);

    // Twisted steel girders poking through concrete
    for (let g = 0; g < 4; g++) {
      const girder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 7.5), rebarTwistMat);
      girder.position.set(-5 + g * 2.8, 1.4 + (g % 2) * 0.6, -4.8);
      girder.rotation.set(0.35, g * 0.4, 0.2);
      rubbleGroup.add(girder);
    }

    // Crushed civilian sedan under rubble
    const crushedCarMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5, metalness: 0.6 });
    const crushedCarBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 2.1), crushedCarMat);
    crushedCarBody.position.set(1.5, 0.45, -8.2);
    crushedCarBody.rotation.set(0.1, 0.25, -0.08);
    rubbleGroup.add(crushedCarBody);

    // Smoke plume from crushed engine
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 });
    for (let sm = 0; sm < 3; sm++) {
      const smokeRing = new THREE.Mesh(new THREE.RingGeometry(0.4 + sm * 0.3, 0.9 + sm * 0.5, 12), smokeMat);
      smokeRing.rotateX(-Math.PI / 2);
      smokeRing.position.set(1.5, 1.2 + sm * 0.8, -8.2);
      rubbleGroup.add(smokeRing);
      this.incidentSmokeRings.push({ mesh: smokeRing, startY: 1.2, speed: 1.2, offset: sm * 0.3 });
    }

    // Red flashing disaster beacon
    const disasterBeacon = new THREE.PointLight(0xef4444, 3.0, 18);
    disasterBeacon.position.set(0, 3.5, -6);
    rubbleGroup.add(disasterBeacon);
    this.incidentEmergencyBeacons.push({
      light: disasterBeacon,
      color1: 0xef4444,
      color2: 0x3b82f6,
      speed: 8.0,
    });

    this.scene.add(rubbleGroup);
    this.collapsedRubbleGroup = rubbleGroup;

    // 3. Clear previous mission hostages & spawn the 3 trapped survivors
    this.missionHostages.forEach((h) => {
      const idx = this.ai.civilians.findIndex((c) => c.id === h.id);
      if (idx >= 0) {
        if (this.ai.civilianRigs[idx]) {
          this.scene.remove(this.ai.civilianRigs[idx].root);
        }
        this.ai.civilians.splice(idx, 1);
        this.ai.civilianRigs.splice(idx, 1);
      }
    });
    this.missionHostages = [];

    const survivorList = [
      { name: 'Leo Ramos (Ironworker)', pos: new THREE.Vector3(-27.5, 0, 44) },
      { name: 'Sarah Jenkins (Pedestrian)', pos: new THREE.Vector3(-21.5, 0, 43) },
      { name: 'Foreman Davies (Supervisor)', pos: new THREE.Vector3(-31.0, 0, 41) },
    ];

    survivorList.forEach((s) => {
      const sRig = createCharacterMesh('civilian', 'hostage_bound', s.name);
      this.scene.add(sRig.root);
      const sCiv = this.ai.spawnCivilian(s.pos, sRig, { name: s.name });
      sCiv.state = 'cowering';
      (sCiv as any).health = 100;
      (sCiv as any).maxHealth = 100;
      (sCiv as any).isCaptive = true;
      (sCiv as any).isRescued = false;
      this.missionHostages.push(sCiv);
    });

    // 4. Spawn 3 Syndicate Fixers sent to burn the trailer safe
    const fixers = [
      { name: 'Sterling Fixer Lead', type: 'enforcer' as const, pos: new THREE.Vector3(-32, 0, 38) },
      { name: 'Sterling Arsonist', type: 'thug' as const, pos: new THREE.Vector3(-35, 0, 39) },
      { name: 'Sterling Guard', type: 'enforcer' as const, pos: new THREE.Vector3(-30, 0, 37) },
    ];

    fixers.forEach((f) => {
      const rig = createCharacterMesh(f.type, 'default', f.name, 'eclipse_syndicate');
      this.scene.add(rig.root);
      const enemy = this.ai.spawnEnemy(f.type, f.pos, rig, f.name, 'eclipse_syndicate');
      enemy.alertLevel = 100;
      this.missionEnemies.push(enemy);
    });

    this.onNotification?.(
      'DISPATCH: CODE 33! Building collapsed! Rescue trapped survivors and defend the trailer safe!',
      'alert'
    );
  }

  /**
   * Spawns the 3 fictional armed criminals inside the commercial alleyway (Ch 1)
   */
  public triggerAlleywayEncounter() {
    if (this.currentMission) {
      this.triggerMissionEncounter(this.currentMission);
      return;
    }
    if (this.encounterTriggered) return;
    this.encounterTriggered = true;

    // Remove old enemies if any
    this.ai.enemies.forEach((_, i) => {
      if (this.ai.enemyRigs[i]) {
        this.scene.remove(this.ai.enemyRigs[i].root);
      }
    });
    this.ai.enemies = [];
    this.ai.enemyRigs = [];

    // The 3 Fictional Armed Criminals
    const encounterConfigs = [
      {
        name: 'Rook',
        type: 'thug' as const,
        pos: new THREE.Vector3(-29.2, 0, -25.5),
      },
      {
        name: 'Stitch',
        type: 'thug' as const,
        pos: new THREE.Vector3(-26.2, 0, -29.0),
      },
      {
        name: 'Trigger',
        type: 'enforcer' as const,
        pos: new THREE.Vector3(-28.0, 0, -35.5),
      },
    ];

    encounterConfigs.forEach((c) => {
      const rig = createCharacterMesh(c.type, 'default', c.name);
      this.scene.add(rig.root);
      const enemy = this.ai.spawnEnemy(c.type, c.pos, rig, c.name);
      enemy.alertLevel = 100;
    });

    soundEngine.playRadioChime();
    this.onNotification?.(
      'DISPATCH: 10-33 IN PROGRESS! Unit 24, 3 armed suspects engaged in Commercial Alley! Take cover!',
      'alert'
    );

    this.onMissionObjectiveProgress?.('reach', 1);

    this.waypointPos.set(-28, 0, -32);
    this.waypointBeaconGroup.position.copy(this.waypointPos);
  }

  public spawnMissionEnemies() {
    this.encounterTriggered = false;
    this.waypointPos.set(-28, 0, -20);
    this.waypointBeaconGroup.position.copy(this.waypointPos);
    this.isWaypointActive = true;

    // Reset enemies
    this.ai.enemies.forEach((_, i) => {
      if (this.ai.enemyRigs[i]) {
        this.scene.remove(this.ai.enemyRigs[i].root);
      }
    });
    this.ai.enemies = [];
    this.ai.enemyRigs = [];
  }

  private setupRainParticles() {
    const rainCount = 1200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.15,
      transparent: true,
      opacity: 0.45,
    });
    this.rainParticles = new THREE.Points(geom, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(weather: WeatherType) {
    this.weather = weather;
    if (this.rainParticles) {
      this.rainParticles.visible = weather === 'rain';
    }
    if (weather === 'fog') {
      this.scene.fog = new THREE.FogExp2(0x1e293b, 0.035);
    } else {
      this.scene.fog = new THREE.FogExp2(0x080b12, 0.015);
    }
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    if (time === 'day') {
      this.scene.background = new THREE.Color(0x60a5fa);
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0018);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 1.25;
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 2.0;
      this.dirLight.position.set(50, 100, 45);
      if (this.cityData?.skyMesh) {
        (this.cityData.skyMesh.material as THREE.MeshBasicMaterial).color.setHex(0x60a5fa);
      }
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xfdba74, 0.0022);
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 1.0;
      this.dirLight.color.setHex(0xf97316);
      this.dirLight.intensity = 1.5;
      this.dirLight.position.set(85, 38, 40);
      if (this.cityData?.skyMesh) {
        (this.cityData.skyMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
      }
    } else {
      // Night - clear, highly visible twilight night with moonlight fill, streetlights and neon
      this.scene.background = new THREE.Color(0x0c1322);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.003);
      this.hemiLight.color.setHex(0x60a5fa);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.85;
      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 1.15;
      this.dirLight.position.set(40, 75, 30);
      if (this.cityData?.skyMesh) {
        (this.cityData.skyMesh.material as THREE.MeshBasicMaterial).color.setHex(0x1e293b);
      }
    }
  }

  public resize = (w?: number, h?: number) => {
    if (!this.container) return;
    const width = w ?? this.container.clientWidth ?? window.innerWidth ?? 800;
    const height = h ?? this.container.clientHeight ?? window.innerHeight ?? 600;
    if (width <= 0 || height <= 0) return;
    this.currentViewportWidth = width;
    this.currentViewportHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
  };

  public handleResize = () => {
    this.resize();
  };

  private onResize = () => {
    this.resize();
  };

  public update(inputs: InputState) {
    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.06);
    const time = this.timer.getElapsed();

    // Continuous dynamic check: update canvas viewport immediately if container dimensions change
    if (this.container) {
      const cw = this.container.clientWidth;
      const ch = this.container.clientHeight;
      if (cw > 0 && ch > 0 && (cw !== this.currentViewportWidth || ch !== this.currentViewportHeight)) {
        this.resize(cw, ch);
      }
    }

    // 1. Camera Look Rotation
    const sens = 0.0035;
    this.playerYaw += inputs.lookDeltaX * sens;
    this.cameraPitch = Math.max(-0.6, Math.min(0.95, this.cameraPitch + inputs.lookDeltaY * sens));

    // Smooth Recoil Recovery
    if (this.targetRecoilPitch > 0) {
      const step = Math.min(this.targetRecoilPitch, delta * 0.4);
      this.cameraPitch += step;
      this.targetRecoilPitch -= step;
    }

    // Reset deltas after applying
    inputs.lookDeltaX = 0;
    inputs.lookDeltaY = 0;

    // 2. Are we inside a vehicle or on foot?
    if (this.currentVehicleIndex >= 0) {
      this.updateVehicleMode(delta, time, inputs);
    } else {
      this.updateOnFootMode(delta, time, inputs);
    }

    // 3. Vehicle Action Cooldown & Entry / Exit trigger
    if (this.vehicleActionCooldown > 0) {
      this.vehicleActionCooldown -= delta;
    }

    if (inputs.enterVehicle) {
      inputs.enterVehicle = false;
      this.toggleVehicleEnterExit();
    }

    // 3B. Enterable Building Entrances & Interior Interactables
    this.updateBuildingInteractions(inputs, delta, time);

    // 4. Update AI (Criminals, Police NPCs and Civilians)
    if (this.recentGunshotTimer > 0) {
      this.recentGunshotTimer -= delta;
    }
    const gunshotFired = this.recentGunshotTimer > 0;

    const currentCollisions = this.activeInterior ? this.activeInterior.collisionBoxes : this.collisionBoxes;

    this.ai.update(
      delta,
      time,
      this.playerPos,
      (enemy, targetPos) => {
        this.enemyFireBullet(enemy, targetPos);
      },
      currentCollisions,
      this.camera,
      gunshotFired,
      this.vehicles,
      this.isAiming,
      this.playerYaw
    );

    // 4B. Update City Incident Simulation & 3D Incident Visuals (Only outside in city)
    if (!this.activeInterior) {
      cityIncidentManager.update(delta);
      this.updateDynamicIncidentVisuals(delta, time);
      this.checkPlayerNearDynamicIncidents();
    }

    // 5. Update Waypoint Animation & Distance Check
    if (this.isWaypointActive && !this.activeInterior) {
      this.beaconDiamond.rotation.y = time * 2.0;
      this.beaconDiamond.position.y = 2.4 + Math.sin(time * 3) * 0.25;

      this.beaconRings.forEach((ring, idx) => {
        const scale = 1.0 + ((time * 1.5 + idx * 0.6) % 1.5);
        ring.scale.set(scale, scale, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - scale * 0.4);
      });

      // Check distance to active mission waypoint
      const dstToWaypoint = Math.hypot(this.playerPos.x - this.waypointPos.x, this.playerPos.z - this.waypointPos.z);
      const reachThreshold = this.currentVehicleIndex >= 0 ? 15.0 : 10.0;
      if (dstToWaypoint < reachThreshold && !this.encounterTriggered && this.currentMission) {
        this.triggerMissionEncounter(this.currentMission);
      } else if (dstToWaypoint < 7.0 && !this.encounterTriggered && !this.currentMission) {
        this.triggerAlleywayEncounter();
      }
    }

    // 6. Update Dynamic Civilian Road Traffic (Only outside in city)
    if (!this.activeInterior) {
      this.updateCivilianTraffic(delta, time);
    }

    // 7. Update Criminal vehicle AI in Chase Mode / Active Pursuit (Only outside in city)
    if (!this.activeInterior) {
      if (this.activePursuitVehicle && this.activePursuitVehicle.entity.health > 0) {
        this.updateActivePursuitVehicle(delta, time);
      } else {
        this.updateCriminalChaseAI(delta, time);
      }
    }

    // 7. Update Rain Particles
    if (this.weather === 'rain' && this.rainParticles) {
      const posAttr = this.rainParticles.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= 24 * delta;
        if (arr[i] < 0) {
          arr[i] = 35;
        }
      }
      posAttr.needsUpdate = true;
      this.rainParticles.position.set(this.playerPos.x, 0, this.playerPos.z);
    }

    // 8. Update Bullet Tracers
    this.updateBulletTracers(delta);

    // 9. Update Floating Damage Texts
    this.updateFloatingTexts(delta);

    // 10. Wanted Level Cooldown
    if (this.stats.wantedLevel > 0) {
      this.stats.wantedCooldown -= delta;
      if (this.stats.wantedCooldown <= 0) {
        this.stats.wantedLevel = Math.max(0, this.stats.wantedLevel - 1);
        this.stats.wantedCooldown = 15;
        this.onStatsChanged?.(this.stats);
      }
    }

    // 10b. Officer Carter Suspicion Decay & IA Scrutiny Systems
    const curSuspicion = this.stats.suspicionLevel ?? 10;
    // Suspicion decays gradually only when Carter is not in active wanted status and not committing violent infractions
    if (curSuspicion > 5 && this.stats.wantedLevel === 0) {
      this.suspicionDecayTimer -= delta;
      if (this.suspicionDecayTimer <= 0) {
        this.suspicionDecayTimer = 25; // Decays 1% every 25 seconds of clean, peaceful patrol
        const newSusp = Math.max(5, curSuspicion - 1);
        this.stats.suspicionLevel = newSusp;
        this.ai.carterDoubleLife.suspicionLevel = newSusp;
        this.onStatsChanged?.(this.stats);
      }
    }

    // High Suspicion IA Investigation Consequences
    if (curSuspicion >= 70) {
      this.iaAuditAuditTimer -= delta;
      if (this.iaAuditAuditTimer <= 0) {
        this.iaAuditAuditTimer = 40 + Math.random() * 20;
        const auditAlerts = [
          '⚠️ INTERNAL AFFAIRS AUDIT: Detective Vance from IA requested Unit 24 shift bodycam recordings!',
          '⚠️ IA INQUIRY NOTICE: Precinct 9 Internal Affairs is scrutinizing Carter\'s recent suspect dispositions!',
          '⚠️ PRECINCT MEMO: IA field investigator spotted monitoring Carter\'s patrol sector.',
        ];
        const chosen = auditAlerts[Math.floor(Math.random() * auditAlerts.length)];
        this.onNotification?.(chosen, 'alert');
        soundEngine.playRadioChime();
      }
    }

    // 11. Tactical Flashlight Sync
    if (this.flashlight && this.flashlightTarget) {
      this.flashlight.visible = this.isFlashlightActive;
      if (this.isFlashlightActive) {
        this.flashlight.position.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
        const lookDir = new THREE.Vector3();
        this.camera.getWorldDirection(lookDir);
        this.flashlightTarget.position.copy(this.flashlight.position).add(lookDir.multiplyScalar(20));
      }
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Updates 3D incident props, animated fires, smoke columns, and emergency beacons
   */
  private updateDynamicIncidentVisuals(delta: number, time: number) {
    const activeIncidents = cityIncidentManager.activeIncidents;
    const activeIds = new Set(activeIncidents.map((i) => i.id));

    // Remove props for resolved or expired incidents
    for (const [id, group] of this.incidentPropsMap.entries()) {
      if (!activeIds.has(id)) {
        this.incidentVisualsGroup.remove(group);
        this.incidentPropsMap.delete(id);
      }
    }

    // Add 3D props for newly spawned incidents
    for (const inc of activeIncidents) {
      if (!this.incidentPropsMap.has(inc.id)) {
        const propGroup = this.createIncidentPropGroup(inc);
        this.incidentPropsMap.set(inc.id, propGroup);
        this.incidentVisualsGroup.add(propGroup);
      }
    }

    // Animate incident flame meshes
    for (const flame of this.incidentFlames) {
      const s = flame.baseScale * (1 + Math.sin(time * flame.speed + flame.offset) * 0.22);
      flame.mesh.scale.set(s, s * (1 + Math.cos(time * flame.speed * 1.2) * 0.18), s);
      flame.mesh.rotation.y += delta * 1.5;
    }

    // Animate incident smoke plumes
    for (const smoke of this.incidentSmokeRings) {
      smoke.mesh.position.y += delta * smoke.speed;
      const progress = (time * 0.4 + smoke.offset) % 1.0;
      smoke.mesh.scale.set(1.0 + progress * 2.2, 1.0, 1.0 + progress * 2.2);
      if (smoke.mesh.position.y > smoke.startY + 6.0) {
        smoke.mesh.position.y = smoke.startY;
      }
    }

    // Animate emergency flashing beacons
    for (const beacon of this.incidentEmergencyBeacons) {
      const flash = Math.sin(time * beacon.speed) > 0;
      beacon.light.color.setHex(flash ? beacon.color1 : beacon.color2);
      beacon.light.intensity = flash ? 3.0 : 0.8;
    }
  }

  /**
   * Creates 3D visual geometry and lights for dynamic city incidents
   */
  private createIncidentPropGroup(inc: DynamicEvent): THREE.Group {
    const group = new THREE.Group();
    group.position.set(inc.position.x, 0, inc.position.z);

    if (inc.visualEffect === 'fire' || inc.type === 'fire') {
      // Structure Fire: Multi-tier animated flame cones, dark smoke, and flickering light
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const innerFlameMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });

      [-0.8, 0, 0.8].forEach((ox, idx) => {
        const flameGeom = new THREE.ConeGeometry(0.7, 2.4, 8);
        const flameMesh = new THREE.Mesh(flameGeom, idx === 1 ? innerFlameMat : flameMat);
        flameMesh.position.set(ox, 1.2, (idx - 1) * 0.4);
        group.add(flameMesh);
        this.incidentFlames.push({
          mesh: flameMesh,
          baseScale: 1.0 + idx * 0.15,
          speed: 8 + idx * 2,
          offset: idx * 1.5,
        });
      });

      // Fire Point Light
      const fireLight = new THREE.PointLight(0xf97316, 3.5, 22);
      fireLight.position.set(0, 2.0, 0);
      group.add(fireLight);

      // Dark Smoke Column Rings
      const smokeMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.4,
      });
      for (let s = 0; s < 3; s++) {
        const sMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 1.4, 8), smokeMat);
        sMesh.position.set(0, 2.5 + s * 1.8, 0);
        group.add(sMesh);
        this.incidentSmokeRings.push({
          mesh: sMesh,
          startY: 2.5,
          speed: 1.2 + s * 0.4,
          offset: s * 0.33,
        });
      }

      // Fire Scene Hazard Cones
      [-2.5, 2.5].forEach((cx) => {
        const coneGeom = new THREE.ConeGeometry(0.2, 0.65, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(cx, 0.32, 2.5);
        group.add(cone);
      });
    } else if (inc.type === 'disaster_crash' || inc.visualEffect === 'debris') {
      // Fictional Cargo Aircraft Crash Site in Eastern Logistics Field (Rare Event)
      // 1. Broken fuselage segment
      const fuseGeom = new THREE.CylinderGeometry(2.4, 2.5, 9.0, 12, 1, true);
      const fuseMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.8,
        metalness: 0.6,
        side: THREE.DoubleSide,
      });
      const fuselage = new THREE.Mesh(fuseGeom, fuseMat);
      fuselage.rotation.z = Math.PI / 2.3;
      fuselage.rotation.y = 0.4;
      fuselage.position.set(0, 1.6, 0);
      group.add(fuselage);

      // Fuselage cheatline stripe
      const stripeGeom = new THREE.CylinderGeometry(2.42, 2.52, 0.4, 12, 1, true);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const stripeMesh = new THREE.Mesh(stripeGeom, stripeMat);
      fuselage.add(stripeMesh);

      // 2. Broken swept wing section lodged in container yard
      const wingGeom = new THREE.BoxGeometry(7.5, 0.22, 2.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
      const wing = new THREE.Mesh(wingGeom, wingMat);
      wing.position.set(4.2, 1.2, -2.5);
      wing.rotation.z = -0.35;
      wing.rotation.y = -0.5;
      group.add(wing);

      // 3. Turbofan Engine Casing with burning core
      const engGeom = new THREE.CylinderGeometry(0.9, 1.0, 2.2, 12);
      const engMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.8 });
      const engine = new THREE.Mesh(engGeom, engMat);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(-3.8, 0.9, 2.0);
      group.add(engine);

      // Core light
      const coreLight = new THREE.PointLight(0xf97316, 3.0, 14);
      coreLight.position.set(-3.8, 1.1, 2.0);
      group.add(coreLight);

      // Crash Fire & Smoke
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
      const crashFlame = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.2, 8), flameMat);
      crashFlame.position.set(0, 1.8, 0);
      group.add(crashFlame);
      this.incidentFlames.push({ mesh: crashFlame, baseScale: 1.3, speed: 10, offset: 0 });

      // Emergency Strobe Beacons on perimeter barriers
      [-5.5, 5.5].forEach((bx, bIdx) => {
        const bLight = new THREE.PointLight(bIdx === 0 ? 0xef4444 : 0x38bdf8, 2.5, 16);
        bLight.position.set(bx, 1.2, 4.5);
        group.add(bLight);
        this.incidentEmergencyBeacons.push({
          light: bLight,
          speed: 6.0,
          color1: bIdx === 0 ? 0xef4444 : 0x38bdf8,
          color2: bIdx === 0 ? 0x38bdf8 : 0xef4444,
        });

        const barrierGeom = new THREE.BoxGeometry(2.4, 0.8, 0.15);
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
        const barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(bx, 0.5, 4.5);
        group.add(barrier);
      });
    } else if (inc.type === 'accident' || inc.visualEffect === 'smoke') {
      // Traffic Collision & Road Blockage
      const carGeom = new THREE.BoxGeometry(2.0, 1.1, 4.2);
      const carMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
      const crashedCar = new THREE.Mesh(carGeom, carMat);
      crashedCar.position.set(0, 0.55, 0);
      crashedCar.rotation.y = 0.35;
      crashedCar.rotation.z = 0.12;
      group.add(crashedCar);

      const radiatorSmoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.8, 2.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.45 })
      );
      radiatorSmoke.position.set(0.4, 1.6, 1.8);
      group.add(radiatorSmoke);
      this.incidentSmokeRings.push({ mesh: radiatorSmoke, startY: 1.6, speed: 0.8, offset: 0.2 });

      [-1.8, 1.8, 0].forEach((cx, cIdx) => {
        const coneGeom = new THREE.ConeGeometry(0.18, 0.6, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(cx, 0.3, -2.2 + cIdx * 1.5);
        group.add(cone);
      });
    } else if (inc.visualEffect === 'barricade' || inc.type === 'hostage' || inc.type === 'gang_war') {
      // Tactical Perimeter Sawhorses & Beacons
      [-2.8, 2.8].forEach((bx, bIdx) => {
        const barGeom = new THREE.BoxGeometry(2.2, 0.85, 0.18);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
        const barrier = new THREE.Mesh(barGeom, barMat);
        barrier.position.set(bx, 0.45, 0);
        group.add(barrier);

        const pLight = new THREE.PointLight(bIdx === 0 ? 0xef4444 : 0x38bdf8, 2.0, 12);
        pLight.position.set(bx, 1.1, 0);
        group.add(pLight);
        this.incidentEmergencyBeacons.push({
          light: pLight,
          speed: 8.0,
          color1: 0xef4444,
          color2: 0x38bdf8,
        });
      });
    }

    return group;
  }

  /**
   * Checks player interaction with active dynamic incidents (extinguishing fires, resolving scenes, spawning actors, moral choices)
   */
  private checkPlayerNearDynamicIncidents() {
    for (const inc of cityIncidentManager.activeIncidents) {
      if (inc.status === 'resolved' || inc.status === 'failed' || inc.status === 'completed' || !inc.active) continue;
      const dist = Math.hypot(this.playerPos.x - inc.position.x, this.playerPos.z - inc.position.z);

      // Spawn actors for scene when player approaches
      if (dist < 50 && !this.incidentSpawnedActors.has(inc.id)) {
        this.incidentSpawnedActors.add(inc.id);
        this.spawnActorsForIncident(inc);
      }

      // Moral choice prompt when Carter approaches the incident scene (within 8.5m)
      if (
        dist < 8.5 &&
        inc.moralChoice &&
        !this.incidentPromptedChoices.has(inc.id) &&
        !inc.choiceMade
      ) {
        this.incidentPromptedChoices.add(inc.id);
        this.onEventMoralChoiceAvailable?.(inc);
      }

      // Player resolving peaceful scene or emergency disaster without moral choice
      if (dist < 14 && !inc.moralChoice) {
        if (inc.type === 'fire') {
          soundEngine.playRadioChime();
          cityIncidentManager.resolveIncidentByPlayer(inc.id);
          this.stats.xp += inc.rewardXP;
          this.stats.money += inc.rewardMoney;
          this.stats.reputation = Math.min(100, this.stats.reputation + 10);
          this.stats.civiliansRescued += 2;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.(`Shop Fire Extinguished & Scene Secured! +$${inc.rewardMoney} (+10 Rep)`, 'success');
          this.isWaypointActive = false;
          this.onIncidentResolved?.(inc);
          break;
        } else if (inc.type === 'civilian_emergency') {
          soundEngine.playRadioChime();
          cityIncidentManager.resolveIncidentByPlayer(inc.id);
          this.stats.xp += inc.rewardXP;
          this.stats.money += inc.rewardMoney;
          this.stats.reputation = Math.min(100, this.stats.reputation + 8);
          this.stats.civiliansRescued += 1;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.(`Emergency Cleared & Civilians Aided! +$${inc.rewardMoney} (+8 Rep)`, 'success');
          this.isWaypointActive = false;
          this.onIncidentResolved?.(inc);
          break;
        } else if (inc.type === 'disaster_crash') {
          soundEngine.playRadioChime();
          cityIncidentManager.resolveIncidentByPlayer(inc.id);
          this.stats.xp += inc.rewardXP;
          this.stats.money += inc.rewardMoney;
          this.stats.reputation = Math.min(100, this.stats.reputation + 25);
          this.stats.civiliansRescued += 4;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.(`MAYDAY CRASH SITE SECURED! Disaster Contained! +$${inc.rewardMoney} (+25 Rep)`, 'success');
          this.isWaypointActive = false;
          this.onIncidentResolved?.(inc);
          break;
        }
      }

      // Check combat incident resolution (all hostile suspects tracked specifically for this encounter neutralized or arrested)
      if (this.incidentSpawnedActors.has(inc.id) && inc.spawnedEnemyIds && inc.spawnedEnemyIds.length > 0) {
        const encounterEnemies = this.ai.enemies.filter((e) => inc.spawnedEnemyIds?.includes(e.id));
        if (encounterEnemies.length > 0 && encounterEnemies.every((e) => e.state === 'dead' || e.state === 'arrested' || e.state === 'surrendered')) {
          this.resolveCombatIncident(inc, encounterEnemies);
          break;
        }
      }
    }
  }

  public resolveIncidentChoice(incidentId: string, choice: 'good' | 'shady') {
    const inc = cityIncidentManager.activeIncidents.find((i) => i.id === incidentId);
    if (!inc) return;

    cityIncidentManager.resolveIncidentWithMoralChoice(incidentId, choice);
    this.isWaypointActive = false;
    this.onIncidentResolved?.(inc);

    if (inc.spawnedEnemyIds) {
      for (const eid of inc.spawnedEnemyIds) {
        const enemy = this.ai.enemies.find((e) => e.id === eid);
        if (enemy) {
          if (choice === 'good') {
            enemy.state = 'arrested';
            enemy.shootCooldown = 999999;
            enemy.alertLevel = 0;
            const rig = this.ai.enemyRigs[enemy.meshIndex];
            if (rig?.weaponMesh) rig.weaponMesh.visible = false;
          } else {
            enemy.state = 'flee';
            enemy.alertLevel = 0;
            enemy.target = { x: enemy.position.x + 30, y: 0, z: enemy.position.z + 30 };
            const rig = this.ai.enemyRigs[enemy.meshIndex];
            if (rig?.weaponMesh) rig.weaponMesh.visible = false;
          }
        }
      }
    }

    // Clean up after 7 seconds
    if (inc.spawnedEnemyIds && inc.spawnedEnemyIds.length > 0) {
      setTimeout(() => {
        for (const eid of inc.spawnedEnemyIds || []) {
          this.ai.removeEnemy(eid, this.scene);
        }
      }, 7000);
    }
  }

  public resolveCombatIncident(inc: DynamicEvent, encounterEnemies: EnemyEntity[]) {
    if (inc.status === 'resolved' || inc.status === 'completed') return;

    // If incident has an active moral choice, allow Carter to make his decision
    if (inc.moralChoice && !inc.choiceMade) {
      for (const enemy of encounterEnemies) {
        if (enemy.state !== 'dead') {
          enemy.state = 'surrendered';
        }
        enemy.shootCooldown = 999999;
        enemy.alertLevel = 0;
        enemy.target = undefined;
        const rig = this.ai.enemyRigs[enemy.meshIndex];
        if (rig?.weaponMesh) {
          rig.weaponMesh.visible = false;
        }
      }
      this.onEventMoralChoiceAvailable?.(inc);
      return;
    }

    inc.status = 'resolved';
    inc.active = false;
    soundEngine.playRadioChime();
    cityIncidentManager.resolveIncidentByPlayer(inc.id);
    this.stats.xp += inc.rewardXP;
    this.stats.money += inc.rewardMoney;
    this.stats.reputation = Math.min(100, this.stats.reputation + 15);
    this.onStatsChanged?.(this.stats);
    this.onNotification?.(`10-24 SCENE SECURED: ${inc.title}! Suspect Neutralized! +$${inc.rewardMoney}, +${inc.rewardXP} XP!`, 'success');
    this.isWaypointActive = false;
    this.onIncidentResolved?.(inc);

    // Stop combat behaviors and weapon audio immediately for all suspects of this encounter
    for (const enemy of encounterEnemies) {
      if (enemy.state !== 'dead') {
        enemy.state = 'arrested';
      }
      enemy.shootCooldown = 999999;
      enemy.alertLevel = 0;
      enemy.target = undefined;
      const rig = this.ai.enemyRigs[enemy.meshIndex];
      if (rig?.weaponMesh) {
        rig.weaponMesh.visible = false;
      }
    }

    // Reset responding police officers back to normal patrol and direct them to leave scene
    for (const p of this.ai.policeNPCs) {
      if (p.assignedIncidentId === inc.id || inc.spawnedPoliceIds?.includes(p.id)) {
        if (p.health > 0) {
          p.state = 'patrolling';
          p.assignedIncidentId = undefined;
          p.shootCooldown = 999;
          // Direct officer away from crime scene along sidewalk toward station or main avenue
          p.targetPos = {
            x: -16 + (Math.random() - 0.5) * 16,
            y: 0,
            z: 20 + (Math.random() - 0.5) * 16,
          };
        }
      }
    }

    // Reset frightened civilians/witnesses to peaceful walking
    if (inc.spawnedCivilianIds) {
      for (const cid of inc.spawnedCivilianIds) {
        const civ = this.ai.civilians.find((c) => c.id === cid);
        if (civ) {
          civ.state = 'walking';
          civ.panicTimer = 0;
        }
      }
    }

    // Gracefully remove arrested/dead suspects after transport unit pickup (8 seconds)
    setTimeout(() => {
      for (const enemy of encounterEnemies) {
        this.ai.removeEnemy(enemy.id, this.scene);
      }
    }, 8000);
  }

  /**
   * Spawns localized scene actors (gang members, escaped convicts, responding officers) for dynamic incidents
   */
  private spawnActorsForIncident(inc: DynamicEvent) {
    inc.status = 'active';
    inc.spawnedEnemyIds = [];
    inc.spawnedPoliceIds = [];
    inc.spawnedCivilianIds = [];

    if (inc.type === 'carjacking') {
      // 1. Armed Carjacker pointing weapon at civilian driver
      const carjackerRig = createCharacterMesh('thug', 'default', 'Armed Carjacker');
      this.scene.add(carjackerRig.root);
      const cj = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x + 1.2, 0, inc.position.z), carjackerRig, 'Armed Carjacker');
      cj.alertLevel = 90;
      cj.target = { x: inc.position.x - 1.5, y: 0, z: inc.position.z };
      inc.spawnedEnemyIds.push(cj.id);

      // 2. Terrified civilian driver
      const driverRig = createCharacterMesh('civilian', 'default', 'Civilian Driver');
      this.scene.add(driverRig.root);
      const driver = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 1.5, 0, inc.position.z), driverRig, { name: 'Civilian Driver', courage: 0.1 });
      driver.state = 'panicking';
      driver.panicTimer = 60;
      inc.spawnedCivilianIds.push(driver.id);

      this.onNotification?.(`DISPATCH 10-25: Active Carjacking on ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'fleeing_criminal') {
      // 1. Fleeing Runner sprinting down alley
      const runnerRig = createCharacterMesh('thug', 'default', 'Fleeing Robber');
      this.scene.add(runnerRig.root);
      const runner = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x, 0, inc.position.z), runnerRig, 'Fleeing Robber');
      runner.alertLevel = 75;
      runner.state = 'flee';
      runner.target = { x: inc.position.x + 8, y: 0, z: inc.position.z + 14 };
      inc.spawnedEnemyIds.push(runner.id);

      // 2. Pursuing Officer
      const chasingRig = createCharacterMesh('police_npc', 'patrol', 'Officer Hayes');
      this.scene.add(chasingRig.root);
      const chaser = this.ai.spawnPoliceNPC(new THREE.Vector3(inc.position.x - 5, 0, inc.position.z - 6), chasingRig, 'Officer Hayes', '219', 'patrol');
      chaser.assignedIncidentId = inc.id;
      chaser.state = 'responding';
      chaser.targetPos = { x: inc.position.x, y: 0, z: inc.position.z };
      inc.spawnedPoliceIds.push(chaser.id);

      this.onNotification?.(`DISPATCH 10-15: Foot pursuit in progress at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'armed_robbery') {
      // Armed Robber
      const robberRig = createCharacterMesh('enforcer', 'default', 'Syndicate Gunman');
      this.scene.add(robberRig.root);
      const r = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z), robberRig, 'Syndicate Gunman');
      r.alertLevel = 100;
      r.target = { x: inc.position.x - 2, y: 0, z: inc.position.z };
      inc.spawnedEnemyIds.push(r.id);

      // Frightened jeweler
      const jewelerRig = createCharacterMesh('civilian', 'default', 'Store Jeweler');
      this.scene.add(jewelerRig.root);
      const j = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 2, 0, inc.position.z), jewelerRig, { name: 'Store Jeweler', courage: 0.1 });
      j.state = 'panicking';
      j.panicTimer = 60;
      inc.spawnedCivilianIds.push(j.id);

      this.onNotification?.(`DISPATCH 10-31: Armed robbery in progress at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'store_robbery') {
      // Store robbery
      const robberRig = createCharacterMesh('enforcer', 'default', 'Store Robber');
      this.scene.add(robberRig.root);
      const r = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x, 0, inc.position.z), robberRig, 'Store Robber');
      r.alertLevel = 100;
      r.target = { x: inc.position.x - 2.8, y: 0, z: inc.position.z + 1.5 };
      inc.spawnedEnemyIds.push(r.id);

      const clerkRig = createCharacterMesh('civilian', 'default', 'Store Clerk');
      this.scene.add(clerkRig.root);
      const clerk = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 2.8, 0, inc.position.z + 1.5), clerkRig, { name: 'Store Clerk', courage: 0.1 });
      clerk.state = 'panicking';
      clerk.panicTimer = 60;
      inc.spawnedCivilianIds.push(clerk.id);

      this.onNotification?.(`DISPATCH 10-31: Cash register hold-up at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'street_fight') {
      // 2 Street brawlers
      const b1Rig = createCharacterMesh('thug', 'default', 'Brawler Vance');
      this.scene.add(b1Rig.root);
      const b1 = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x - 1, 0, inc.position.z), b1Rig, 'Brawler Vance');
      b1.alertLevel = 60;
      b1.health = 50;
      inc.spawnedEnemyIds.push(b1.id);

      const b2Rig = createCharacterMesh('thug', 'default', 'Brawler Bruno');
      this.scene.add(b2Rig.root);
      const b2 = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z), b2Rig, 'Brawler Bruno');
      b2.alertLevel = 60;
      b2.health = 50;
      inc.spawnedEnemyIds.push(b2.id);

      // Witness
      const witnessRig = createCharacterMesh('civilian', 'default', 'Diner Bystander');
      this.scene.add(witnessRig.root);
      const wit = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x, 0, inc.position.z + 3.5), witnessRig, { name: 'Diner Bystander' });
      wit.state = 'witnessing';
      inc.spawnedCivilianIds.push(wit.id);

      this.onNotification?.(`DISPATCH 10-10: Street fight reported at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'pursuit') {
      // Speeding suspect driver
      const speederRig = createCharacterMesh('thug', 'default', 'Tuner Speeder');
      this.scene.add(speederRig.root);
      const speeder = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z), speederRig, 'Tuner Speeder');
      speeder.alertLevel = 80;
      inc.spawnedEnemyIds.push(speeder.id);

      const pursuitOfficerRig = createCharacterMesh('police_npc', 'pursuit', 'Pursuit Unit 1');
      this.scene.add(pursuitOfficerRig.root);
      const pOff = this.ai.spawnPoliceNPC(new THREE.Vector3(inc.position.x - 4, 0, inc.position.z - 3), pursuitOfficerRig, 'Pursuit Unit 1', '302', 'pursuit');
      pOff.assignedIncidentId = inc.id;
      inc.spawnedPoliceIds.push(pOff.id);

      this.onNotification?.(`DISPATCH 10-25: High-speed pursuit active at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'officer_backup') {
      // Pinned officer
      const pinnedRig = createCharacterMesh('police_npc', 'patrol', 'Officer Diaz');
      this.scene.add(pinnedRig.root);
      const pinned = this.ai.spawnPoliceNPC(new THREE.Vector3(inc.position.x - 3, 0, inc.position.z), pinnedRig, 'Officer Diaz', '284', 'patrol');
      pinned.assignedIncidentId = inc.id;
      pinned.health = 55;
      pinned.state = 'engaging';
      inc.spawnedPoliceIds.push(pinned.id);

      // 2 Hostile shooters
      const g1Rig = createCharacterMesh('enforcer', 'default', 'Syndicate Shooter A');
      this.scene.add(g1Rig.root);
      const g1 = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x + 3.5, 0, inc.position.z - 2), g1Rig, 'Syndicate Shooter A');
      g1.alertLevel = 100;
      inc.spawnedEnemyIds.push(g1.id);

      const g2Rig = createCharacterMesh('enforcer', 'default', 'Syndicate Shooter B');
      this.scene.add(g2Rig.root);
      const g2 = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x + 4, 0, inc.position.z + 2), g2Rig, 'Syndicate Shooter B');
      g2.alertLevel = 100;
      inc.spawnedEnemyIds.push(g2.id);

      this.onNotification?.(`DISPATCH 10-78: Officer pinned down at ${inc.locationName}! ALL UNITS ASSIST!`, 'alert');
    } else if (inc.type === 'civilian_report') {
      // Distressed citizen
      const civRig = createCharacterMesh('civilian', 'default', 'Mugged Citizen');
      this.scene.add(civRig.root);
      const c = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 2, 0, inc.position.z), civRig, { name: 'Mugged Citizen' });
      c.state = 'panicking';
      c.panicTimer = 45;
      inc.spawnedCivilianIds.push(c.id);

      // Thief in alley
      const thiefRig = createCharacterMesh('thug', 'default', 'Alley Mugger');
      this.scene.add(thiefRig.root);
      const th = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x + 3.5, 0, inc.position.z + 2), thiefRig, 'Alley Mugger');
      th.alertLevel = 60;
      inc.spawnedEnemyIds.push(th.id);

      this.onNotification?.(`DISPATCH 10-44: Civilian flagged down patrol at ${inc.locationName}!`, 'info');
    } else if (inc.type === 'suspicious_valuable') {
      // Suspicious courier
      const courierRig = createCharacterMesh('enforcer', 'default', 'Suspicious Courier');
      this.scene.add(courierRig.root);
      const cr = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x, 0, inc.position.z), courierRig, 'Suspicious Courier');
      cr.alertLevel = 45;
      inc.spawnedEnemyIds.push(cr.id);

      this.onNotification?.(`DISPATCH 10-53: Suspicious courier spotted with heavy bag at ${inc.locationName}!`, 'info');
    } else if (inc.type === 'accident') {
      // 2 Drivers
      const d1Rig = createCharacterMesh('civilian', 'default', 'Driver A');
      this.scene.add(d1Rig.root);
      const d1 = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 2.5, 0, inc.position.z - 1), d1Rig, { name: 'Driver A' });
      d1.state = 'witnessing';
      inc.spawnedCivilianIds.push(d1.id);

      const d2Rig = createCharacterMesh('civilian', 'default', 'Driver B');
      this.scene.add(d2Rig.root);
      const d2 = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x + 2.5, 0, inc.position.z + 1), d2Rig, { name: 'Driver B' });
      d2.state = 'panicking';
      d2.panicTimer = 35;
      inc.spawnedCivilianIds.push(d2.id);

      this.onNotification?.(`DISPATCH 10-50: Multi-car collision at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'ambush_police') {
      // Ambushed officer
      const ambOfficerRig = createCharacterMesh('police_npc', 'patrol', 'Officer Kowalski');
      this.scene.add(ambOfficerRig.root);
      const ambOff = this.ai.spawnPoliceNPC(new THREE.Vector3(inc.position.x - 3, 0, inc.position.z), ambOfficerRig, 'Officer Kowalski', '205', 'patrol');
      ambOff.assignedIncidentId = inc.id;
      ambOff.state = 'engaging';
      inc.spawnedPoliceIds.push(ambOff.id);

      // 2 Gang shooters
      const amb1Rig = createCharacterMesh('enforcer', 'default', 'Ambush Gunner 1', 'cobalt_skulls');
      this.scene.add(amb1Rig.root);
      const amb1 = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x + 3.5, 0, inc.position.z - 2), amb1Rig, 'Ambush Gunner 1', 'cobalt_skulls');
      amb1.alertLevel = 100;
      inc.spawnedEnemyIds.push(amb1.id);

      const amb2Rig = createCharacterMesh('enforcer', 'default', 'Ambush Gunner 2', 'cobalt_skulls');
      this.scene.add(amb2Rig.root);
      const amb2 = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x + 4.5, 0, inc.position.z + 2), amb2Rig, 'Ambush Gunner 2', 'cobalt_skulls');
      amb2.alertLevel = 100;
      inc.spawnedEnemyIds.push(amb2.id);

      this.onNotification?.(`DISPATCH 10-99: OFFICER UNDER ATTACK! Gang ambush at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'bank_incident') {
      // 2 Vault robbers
      const bLeaderRig = createCharacterMesh('boss', 'default', 'Vault Drill Leader');
      this.scene.add(bLeaderRig.root);
      const bl = this.ai.spawnEnemy('boss', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z - 1), bLeaderRig, 'Vault Drill Leader');
      bl.alertLevel = 100;
      inc.spawnedEnemyIds.push(bl.id);

      const bGunnerRig = createCharacterMesh('enforcer', 'default', 'Heist Sentry');
      this.scene.add(bGunnerRig.root);
      const bg = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x - 2, 0, inc.position.z + 2), bGunnerRig, 'Heist Sentry');
      bg.alertLevel = 100;
      inc.spawnedEnemyIds.push(bg.id);

      this.onNotification?.(`DISPATCH 10-90: Vault breach alarm at ${inc.locationName}! SWAT dispatched!`, 'alert');
    } else if (inc.type === 'gang_war') {
      // 1 Cobalt Skull and 1 Neon Python in active crossfire
      const c1Rig = createCharacterMesh('enforcer', 'default', 'Skulls Gunner', 'cobalt_skulls');
      this.scene.add(c1Rig.root);
      const c1 = this.ai.spawnEnemy(
        'enforcer',
        new THREE.Vector3(inc.position.x - 3.5, 0, inc.position.z + 1),
        c1Rig,
        'Skulls Gunner',
        'cobalt_skulls'
      );
      c1.alertLevel = 100;
      inc.spawnedEnemyIds.push(c1.id);

      const c2Rig = createCharacterMesh('thug', 'default', 'Python Striker', 'neon_pythons');
      this.scene.add(c2Rig.root);
      const c2 = this.ai.spawnEnemy(
        'thug',
        new THREE.Vector3(inc.position.x + 3.5, 0, inc.position.z - 1),
        c2Rig,
        'Python Striker',
        'neon_pythons'
      );
      c2.alertLevel = 100;
      inc.spawnedEnemyIds.push(c2.id);

      this.onNotification?.(`DISPATCH 10-71: Rival gang crossfire active at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'prison_break') {
      // Escaped convicts in street clothes/jumpers
      const inmate1Rig = createCharacterMesh('thug', 'default', 'Fugitive Miller');
      this.scene.add(inmate1Rig.root);
      const e1 = this.ai.spawnEnemy(
        'thug',
        new THREE.Vector3(inc.position.x + 1.5, 0, inc.position.z),
        inmate1Rig,
        'Fugitive Miller'
      );
      e1.alertLevel = 80;
      inc.spawnedEnemyIds.push(e1.id);

      const inmate2Rig = createCharacterMesh('enforcer', 'default', 'Escaped Convict Cole');
      this.scene.add(inmate2Rig.root);
      const e2 = this.ai.spawnEnemy(
        'enforcer',
        new THREE.Vector3(inc.position.x - 2, 0, inc.position.z + 2),
        inmate2Rig,
        'Escaped Convict Cole'
      );
      e2.alertLevel = 80;
      inc.spawnedEnemyIds.push(e2.id);

      this.onNotification?.(`DISPATCH 10-98: Escaped convicts sighted in alleys at ${inc.locationName}!`, 'alert');
    } else if (inc.type === 'robbery') {
      // 1. Armed Robber active suspect aiming weapon at store register
      const robberRig = createCharacterMesh('enforcer', 'default', 'Armed Robber');
      this.scene.add(robberRig.root);
      const r = this.ai.spawnEnemy('enforcer', new THREE.Vector3(inc.position.x, 0, inc.position.z), robberRig, 'Armed Robber');
      r.alertLevel = 100;
      r.state = 'shoot';
      r.shootCooldown = 1.0;
      r.target = { x: inc.position.x - 2.8, y: 0, z: inc.position.z + 1.5 };
      r.rotation = Math.atan2(-2.8, 1.5);
      inc.spawnedEnemyIds.push(r.id);

      // 2. Frightened cashier/store clerk calling for help
      const clerkRig = createCharacterMesh('civilian', 'default', 'Store Clerk');
      this.scene.add(clerkRig.root);
      const clerk = this.ai.spawnCivilian(
        new THREE.Vector3(inc.position.x - 2.8, 0, inc.position.z + 1.5),
        clerkRig,
        { name: 'Store Clerk', courage: 0.1 }
      );
      clerk.state = 'panicking';
      clerk.panicTimer = 60;
      inc.spawnedCivilianIds.push(clerk.id);

      // 3. Responding police backup officer establishing tactical cover
      const backupRig = createCharacterMesh('police_npc', 'default', 'Officer Chen');
      this.scene.add(backupRig.root);
      const backupOfficer = this.ai.spawnPoliceNPC(
        new THREE.Vector3(inc.position.x + 6.0, 0, inc.position.z + 5.0),
        backupRig,
        'Officer Chen',
        '312'
      );
      backupOfficer.assignedIncidentId = inc.id;
      backupOfficer.state = 'engaging';
      inc.spawnedPoliceIds.push(backupOfficer.id);

      // 4. Alert nearby sidewalk pedestrians to react and flee
      for (const civ of this.ai.civilians) {
        if (civ.id === clerk.id) continue;
        const d = Math.hypot(civ.position.x - inc.position.x, civ.position.z - inc.position.z);
        if (d < 35) {
          civ.state = 'panicking';
          civ.panicTimer = 18;
          civ.targetPos = {
            x: civ.position.x + (civ.position.x - inc.position.x) * 1.5,
            y: 0,
            z: civ.position.z + (civ.position.z - inc.position.z) * 1.5,
          };
        }
      }

      this.onNotification?.(`DISPATCH 10-31: Armed Robbery in progress at ${inc.locationName}! Unit 204 responding!`, 'alert');
    } else if (inc.type === 'hostage') {
      // Barricaded hostage taker
      const hostageTakerRig = createCharacterMesh('boss', 'default', 'Syndicate Gunman');
      this.scene.add(hostageTakerRig.root);
      const ht = this.ai.spawnEnemy('boss', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z), hostageTakerRig, 'Syndicate Gunman');
      ht.alertLevel = 90;
      inc.spawnedEnemyIds.push(ht.id);

      // Frightened civilian hostage
      const hostageCivRig = createCharacterMesh('civilian', 'default', 'Hostage Citizen');
      this.scene.add(hostageCivRig.root);
      const hCiv = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 1.2, 0, inc.position.z), hostageCivRig, { name: 'Hostage Citizen' });
      hCiv.state = 'panicking';
      hCiv.panicTimer = 60;
      inc.spawnedCivilianIds.push(hCiv.id);
    } else if (inc.type === 'disturbance') {
      // Purse / bag snatching
      const snatcherRig = createCharacterMesh('thug', 'default', 'Street Snatcher');
      this.scene.add(snatcherRig.root);
      const s = this.ai.spawnEnemy('thug', new THREE.Vector3(inc.position.x + 1, 0, inc.position.z), snatcherRig, 'Street Snatcher');
      s.alertLevel = 80;
      inc.spawnedEnemyIds.push(s.id);

      // Distraught civilian victim
      const victimRig = createCharacterMesh('civilian', 'default', 'Pedestrian Victim');
      this.scene.add(victimRig.root);
      const victim = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 3.5, 0, inc.position.z + 1.5), victimRig, { name: 'Pedestrian Victim' });
      victim.state = 'panicking';
      victim.panicTimer = 30;
      inc.spawnedCivilianIds.push(victim.id);
    } else if (inc.type === 'disaster_crash') {
      // Aircraft crash survivor
      const survivorRig = createCharacterMesh('civilian', 'default', 'Crash Survivor');
      this.scene.add(survivorRig.root);
      const survivor = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 2.5, 0, inc.position.z - 2.5), survivorRig, { name: 'Crash Survivor' });
      survivor.state = 'panicking';
      survivor.panicTimer = 60;
      inc.spawnedCivilianIds.push(survivor.id);
    } else if (inc.type === 'civilian_emergency') {
      // Distressed pedestrian/driver
      const civRig = createCharacterMesh('civilian', 'default', 'Distressed Citizen');
      this.scene.add(civRig.root);
      const c = this.ai.spawnCivilian(new THREE.Vector3(inc.position.x - 1.8, 0, inc.position.z + 1.2), civRig, { name: 'Distressed Citizen' });
      c.state = 'panicking';
      c.panicTimer = 30;
      inc.spawnedCivilianIds.push(c.id);
    }

    // Spawn responding police units with specialized uniforms and tactical roles
    if (inc.assignedUnits && inc.assignedUnits.length > 0) {
      inc.assignedUnits.slice(0, 2).forEach((role, idx) => {
        const policeRole = role === 'fire' ? 'fire_responder' : role;
        const pRig = createCharacterMesh('police_npc', policeRole);
        this.scene.add(pRig.root);
        const offsetX = (idx === 0 ? 6.5 : -6.5) + (Math.random() - 0.5) * 2;
        const offsetZ = (idx === 0 ? 5.5 : 6.0) + (Math.random() - 0.5) * 2;
        const pPos = new THREE.Vector3(inc.position.x + offsetX, 0, inc.position.z + offsetZ);
        const officer = this.ai.spawnPoliceNPC(pPos, pRig, undefined, undefined, policeRole);
        officer.state = 'engaging';
        inc.spawnedPoliceIds?.push(officer.id);
      });
    }
  }

  private updateOnFootMode(delta: number, time: number, inputs: InputState) {
    this.isAiming = inputs.aim || inputs.fire;
    this.isCrouching = inputs.crouch;
    this.isSprinting = inputs.sprint && !this.isAiming && !this.isCrouching;

    // Dynamic FOV Zoom on ADS
    const targetFOV = this.isAiming ? 46 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 12);
    this.camera.updateProjectionMatrix();

    // Switch weapon
    if (inputs.switchWeapon) {
      inputs.switchWeapon = false;
      this.switchNextWeapon();
    }

    // Reload
    if (inputs.reload) {
      inputs.reload = false;
      if (!this.isReloading) {
        this.startReload();
      }
    }

    // Police Backup command
    if (inputs.callBackup) {
      inputs.callBackup = false;
      this.callPoliceBackup();
    }

    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }

    if (this.playerDamageCooldownTimer > 0) {
      this.playerDamageCooldownTimer -= delta;
    }

    // Deadzone filtering for mobile joystick
    let forwardInput = inputs.moveForward;
    let rightInput = inputs.moveRight;
    const inputMag = Math.hypot(forwardInput, rightInput);

    if (inputMag < 0.08) {
      forwardInput = 0;
      rightInput = 0;
    }

    // Movement calculation
    let speed = 4.2;
    if (this.isSprinting) speed = 7.8;
    if (this.isCrouching) speed = 2.2;
    if (this.isAiming) speed = 2.5;

    let moveX = 0;
    let moveZ = 0;

    if (forwardInput !== 0 || rightInput !== 0) {
      const normF = forwardInput / (inputMag || 1);
      const normR = rightInput / (inputMag || 1);

      const sinYaw = Math.sin(this.playerYaw);
      const cosYaw = Math.cos(this.playerYaw);

      // Camera-relative motion:
      // Forward view vector in world X-Z: F = (sinYaw, cosYaw)
      // Screen Right vector in world X-Z: R = (-cosYaw, sinYaw)
      // Total velocity: normF * F + normR * R
      // Pushing RIGHT (+normR) moves in direction R = (-cosYaw, sinYaw).
      // Pushing LEFT (-normR) moves in direction -R = (+cosYaw, -sinYaw).
      moveX = (normF * sinYaw - normR * cosYaw) * speed;
      moveZ = (normF * cosYaw + normR * sinYaw) * speed;

      // Character faces direction of motion unless aiming
      if (!this.isAiming) {
        const targetRot = Math.atan2(moveX, moveZ);
        // Shortest arc rotation lerp to prevent 360-degree flip
        let diff = (targetRot - this.playerRig.root.rotation.y) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.playerRig.root.rotation.y += diff * Math.min(1.0, delta * 14);
      }
    }

    if (this.isAiming) {
      let diff = (this.playerYaw - this.playerRig.root.rotation.y) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.playerRig.root.rotation.y += diff * Math.min(1.0, delta * 20);
    }

    // Calculate turning rate for procedural character bank / lean
    const currentRot = this.playerRig.root.rotation.y;
    let turnDiff = (currentRot - this.previousPlayerRot) % (Math.PI * 2);
    if (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
    if (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    const turnRate = turnDiff / Math.max(delta, 0.001);
    this.previousPlayerRot = currentRot;

    // Jump & Vertical Gravity Physics with accurate ground elevation (sidewalk vs road vs interior floor)
    const groundY = this.activeInterior ? 0.0 : getGroundElevation(this.playerPos.x, this.playerPos.z);
    if (inputs.jump && this.isGrounded) {
      this.verticalVelocity = 6.2;
      this.isGrounded = false;
      inputs.jump = false;
      soundEngine.playJump();
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 18.0 * delta;
      this.playerPos.y += this.verticalVelocity * delta;
      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        soundEngine.playFootstep();
      }
    } else {
      // Smoothly adapt to curb elevation when walking between sidewalk (0.20m) and road (0.00m)
      this.playerPos.y = THREE.MathUtils.lerp(this.playerPos.y, groundY, delta * 14);
    }

    // Anti-stuck safety guard: If player is ever slightly inside a collision box or vehicle, de-penetrate immediately
    this.resolvePlayerPenetration();

    // Collision detection on player movement
    const nextX = this.playerPos.x + moveX * delta;
    const nextZ = this.playerPos.z + moveZ * delta;

    if (!this.checkPlayerCollision(nextX, this.playerPos.z)) {
      this.playerPos.x = nextX;
    }
    if (!this.checkPlayerCollision(this.playerPos.x, nextZ)) {
      this.playerPos.z = nextZ;
    }

    this.playerRig.root.position.copy(this.playerPos);

    // Animate Character Rig
    const currentSpeed = Math.hypot(moveX, moveZ);

    // Footstep audio synchronization
    if (currentSpeed > 0.6 && this.isGrounded) {
      this.footstepTimer += delta * (this.isSprinting ? 2.6 : 1.7);
      if (this.footstepTimer >= 0.5) {
        soundEngine.playFootstep();
        this.footstepTimer = 0;
      }
    } else {
      this.footstepTimer = 0.35;
    }

    const activeW = this.weapons[this.activeWeaponIndex];
    const totalReloadTime = activeW?.reloadTime || 1.8;
    const reloadProg = this.isReloading ? Math.max(0, 1 - (this.reloadTimer / totalReloadTime)) : 0;

    updateCharacterAnimation(
      this.playerRig,
      currentSpeed,
      time,
      this.isAiming,
      this.isCrouching,
      undefined,
      this.camera,
      this.stats.health / this.stats.maxHealth,
      {
        isGrounded: this.isGrounded,
        verticalVelocity: this.verticalVelocity,
        isReloading: this.isReloading,
        reloadProgress: reloadProg,
        turnRate: turnRate,
        aimPitch: this.cameraPitch,
        weaponCategory: activeW?.category || 'handgun',
        delta: delta,
      }
    );

    // Shooting
    this.shootCooldownTimer -= delta;
    if (inputs.fire && this.shootCooldownTimer <= 0 && !this.isReloading) {
      this.playerFireWeapon();
    }

    // Arrest / Non-lethal interaction
    if (inputs.interact) {
      inputs.interact = false;
      this.attemptArrest();
    }

    // Update Camera (Spring-arm 3rd person with obstacle collision avoidance)
    if (this.isCinematicMode) {
      this.cinematicTimer += delta;
      const t = this.cinematicTimer * 0.08;
      const radius = 55;
      const camX = Math.sin(t) * radius;
      const camZ = Math.cos(t) * radius;
      const camY = 18 + Math.sin(t * 0.5) * 5;
      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 2.0);
      this.cameraLookAt.lerp(new THREE.Vector3(0, 5, 0), delta * 2.5);
      this.camera.lookAt(this.cameraLookAt);
      return;
    }

    const targetCamDist = this.isAiming ? 2.2 : 4.6;

    const camOffsetY = this.isCrouching ? 1.25 : 1.65;
    const shoulderOffset = this.isAiming ? 0.52 : 0.0;

    const sinY = Math.sin(this.playerYaw);
    const cosY = Math.cos(this.playerYaw);

    // Forward direction from player yaw and camera pitch
    const forwardX = sinY * Math.cos(this.cameraPitch);
    const forwardY = -Math.sin(this.cameraPitch);
    const forwardZ = cosY * Math.cos(this.cameraPitch);

    // Pivot at Carter's upper chest with shoulder offset
    const pivotX = this.playerPos.x + cosY * shoulderOffset;
    const pivotY = this.playerPos.y + camOffsetY;
    const pivotZ = this.playerPos.z - sinY * shoulderOffset;

    // Obstacle raycasting to prevent camera entering buildings/walls
    const camDir = new THREE.Vector3(-forwardX, -forwardY, -forwardZ).normalize();
    const pivotVec = new THREE.Vector3(pivotX, pivotY, pivotZ);
    let clearanceDist = targetCamDist;

    for (const b of this.collisionBoxes) {
      if ((b.height || 5) < 1.0) continue;
      const box = new THREE.Box3(
        new THREE.Vector3(b.minX - 0.25, 0, b.minZ - 0.25),
        new THREE.Vector3(b.maxX + 0.25, b.height || 6.0, b.maxZ + 0.25)
      );
      const ray = new THREE.Ray(pivotVec, camDir);
      const hitPt = new THREE.Vector3();
      if (ray.intersectBox(box, hitPt)) {
        const hitD = pivotVec.distanceTo(hitPt);
        if (hitD < clearanceDist) {
          clearanceDist = Math.max(0.85, hitD - 0.35);
        }
      }
    }

    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, clearanceDist, delta * 18);

    let camX = pivotX - forwardX * this.cameraDistance;
    let camY = pivotY - forwardY * this.cameraDistance;
    let camZ = pivotZ - forwardZ * this.cameraDistance;

    // Ground clearance prevent clip
    const groundElevation = this.activeInterior ? 0.0 : getGroundElevation(camX, camZ);
    camY = Math.max(groundElevation + 0.35, camY);

    // Apply realistic weapon recoil camera shake
    if (this.cameraShakeAmount > 0.001) {
      camX += (Math.random() - 0.5) * this.cameraShakeAmount;
      camY += (Math.random() - 0.5) * this.cameraShakeAmount;
      camZ += (Math.random() - 0.5) * this.cameraShakeAmount;
      this.cameraShakeAmount = THREE.MathUtils.lerp(this.cameraShakeAmount, 0, delta * 12);
    }

    const targetCamPos = new THREE.Vector3(camX, camY, camZ);
    // Center reticle looks forward along line of sight
    const targetLookAt = new THREE.Vector3(
      pivotX + forwardX * 40,
      pivotY + forwardY * 40,
      pivotZ + forwardZ * 40
    );

    if (!this.isCameraInitialized) {
      this.camera.position.copy(targetCamPos);
      this.cameraLookAt.copy(targetLookAt);
      this.camera.lookAt(this.cameraLookAt);
      this.isCameraInitialized = true;
    } else {
      const camLerp = Math.min(1.0, delta * (this.isAiming ? 20 : 12));
      const lookLerp = Math.min(1.0, delta * (this.isAiming ? 22 : 14));
      this.camera.position.lerp(targetCamPos, camLerp);
      this.cameraLookAt.lerp(targetLookAt, lookLerp);
      this.camera.lookAt(this.cameraLookAt);
    }
  }

  private updateVehicleMode(delta: number, time: number, inputs: InputState) {
    const v = this.vehicles[this.currentVehicleIndex];
    if (!v) return;

    // Track active duration inside vehicle
    this.timeInsideCurrentVehicle += delta;

    if (this.playerDamageCooldownTimer > 0) {
      this.playerDamageCooldownTimer -= delta;
    }

    // Siren toggle
    if (inputs.toggleSiren) {
      inputs.toggleSiren = false;
      v.entity.isSirenOn = !v.entity.isSirenOn;
      soundEngine.toggleSiren(v.entity.isSirenOn);
      this.onNotification?.(
        v.entity.isSirenOn ? 'Police Siren ENGAGED' : 'Police Siren OFF',
        'info'
      );
    }

    // Vehicle driving physics
    const accelInput = inputs.moveForward; // 1 = gas, -1 = brake / reverse
    const steerInput = inputs.moveRight; // 1 = right, -1 = left

    // Acceleration & Braking & Reversing
    if (accelInput > 0) {
      if (v.entity.speed < 0) {
        // Active braking while reversing
        v.entity.speed = Math.min(0, v.entity.speed + v.entity.acceleration * 2.2 * delta);
      } else {
        // Accelerate forward
        v.entity.speed = Math.min(v.entity.maxSpeed, v.entity.speed + v.entity.acceleration * delta);
      }
    } else if (accelInput < 0) {
      if (v.entity.speed > 0.5) {
        // Active braking while moving forward
        v.entity.speed = Math.max(0, v.entity.speed - v.entity.acceleration * 1.8 * delta);
      } else {
        // Reverse
        v.entity.speed = Math.max(-12, v.entity.speed - v.entity.acceleration * 0.9 * delta);
      }
    } else {
      // Natural rolling friction
      v.entity.speed = THREE.MathUtils.lerp(v.entity.speed, 0, delta * 1.8);
    }

    // Handbrake drift
    if (inputs.handbrake) {
      v.entity.speed = THREE.MathUtils.lerp(v.entity.speed, 0, delta * 4.2);
      soundEngine.playTireScreech();
    }

    // Steering
    const maxSteer = 0.50;
    v.entity.steering = THREE.MathUtils.lerp(v.entity.steering, steerInput * maxSteer, delta * 8);

    // Apply yaw rotation when moving (CORRECT DIRECTION: +steering turns RIGHT)
    if (Math.abs(v.entity.speed) > 0.05) {
      const speedRatio = Math.min(1.0, Math.abs(v.entity.speed) / 10);
      const steerFactor = (v.entity.speed >= 0 ? 1 : -1) * (0.65 + 0.35 * speedRatio);
      const handbrakeBonus = inputs.handbrake ? 1.6 : 1.0;
      const steerDelta = v.entity.steering * steerFactor * 2.6 * handbrakeBonus * delta;
      const nextRot = v.entity.rotation - steerDelta;

      // Ensure steering rotation doesn't rotate vehicle corners into solid walls/structures
      if (!this.checkVehicleCollision(v.entity.position.x, v.entity.position.z, nextRot, this.currentVehicleIndex)) {
        v.entity.rotation = nextRot;
      } else {
        // Attempt a half-angle turn if full turn is clipped
        const halfRot = v.entity.rotation - steerDelta * 0.4;
        if (!this.checkVehicleCollision(v.entity.position.x, v.entity.position.z, halfRot, this.currentVehicleIndex)) {
          v.entity.rotation = halfRot;
        } else {
          v.entity.steering *= 0.2; // Damp steering against solid wall
        }
      }
    }

    // Substepped Continuous Collision Detection (CCD) to prevent fast vehicles from tunneling through walls
    const totalMoveDist = Math.abs(v.entity.speed) * delta;
    const maxSubstepDist = 0.20; // Max 20cm per step guarantees zero tunneling through walls or fences
    const numSteps = Math.max(1, Math.min(10, Math.ceil(totalMoveDist / maxSubstepDist)));
    const stepDelta = delta / numSteps;

    for (let step = 0; step < numSteps; step++) {
      const stepDist = v.entity.speed * stepDelta;
      const stepVx = Math.sin(v.entity.rotation) * stepDist;
      const stepVz = Math.cos(v.entity.rotation) * stepDist;

      const tryX = v.entity.position.x + stepVx;
      const tryZ = v.entity.position.z + stepVz;

      // 1. Try full movement vector
      if (!this.checkVehicleCollision(tryX, tryZ, v.entity.rotation, this.currentVehicleIndex)) {
        v.entity.position.x = tryX;
        v.entity.position.z = tryZ;
        continue;
      }

      // 2. Obstacle encountered: attempt wall sliding along X axis
      let moved = false;
      if (Math.abs(stepVx) > 0.001 && !this.checkVehicleCollision(tryX, v.entity.position.z, v.entity.rotation, this.currentVehicleIndex)) {
        v.entity.position.x = tryX;
        v.entity.speed *= 0.88; // Friction sliding along wall
        moved = true;
      }

      // 3. Attempt wall sliding along Z axis
      if (Math.abs(stepVz) > 0.001 && !this.checkVehicleCollision(v.entity.position.x, tryZ, v.entity.rotation, this.currentVehicleIndex)) {
        v.entity.position.z = tryZ;
        v.entity.speed *= 0.88; // Friction sliding along wall
        moved = true;
      }

      // 4. Head-on collision into solid wall or obstacle (cannot slide)
      if (!moved) {
        if (Math.abs(v.entity.speed) > 3.0) {
          soundEngine.playHit(false);
          soundEngine.playTireScreech();
        }
        v.entity.speed *= -0.22; // Elastic bounce back away from solid structure
        this.resolveVehicleBuildingPenetration(v);
        break;
      }
    }

    // Resolve vehicle-to-vehicle overlap & anti-trapping building de-penetration
    this.resolveVehicleToVehicleCollisions(v);
    this.resolveVehicleBuildingPenetration(v);

    v.rig.root.position.set(v.entity.position.x, 0, v.entity.position.z);
    v.rig.root.rotation.y = v.entity.rotation;

    updateVehicleAnimation(v.rig, v.entity.speed, v.entity.steering, time, v.entity.isSirenOn);
    soundEngine.updateEnginePitch(Math.abs(v.entity.speed) / v.entity.maxSpeed);

    this.playerPos.set(v.entity.position.x, 0, v.entity.position.z);
    this.playerRig.root.position.copy(this.playerPos);

    this.checkVehicleRamming(v);

    // Alert pedestrians in vehicle's path to dodge out of roadway
    if (Math.abs(v.entity.speed) > 3.0) {
      for (const civ of this.ai.civilians) {
        const cdx = civ.position.x - v.entity.position.x;
        const cdz = civ.position.z - v.entity.position.z;
        const cdist = Math.hypot(cdx, cdz);
        if (cdist < 12.0) {
          const vDirX = Math.sin(v.entity.rotation);
          const vDirZ = Math.cos(v.entity.rotation);
          const dot = (cdx * vDirX + cdz * vDirZ) / (cdist || 1);
          if (dot > 0.6 && civ.state !== 'dodging') {
            civ.state = 'dodging';
            civ.dodgeTimer = 1.8;
            const perpX = -vDirZ;
            const perpZ = vDirX;
            civ.position.x += perpX * 2.5;
            civ.position.z += perpZ * 2.5;
          }
        }
      }
    }

    // Camera follow behind vehicle with obstacle clearance
    const camFollowDist = 7.5;
    const camHeight = 3.2;
    const sinRot = Math.sin(v.entity.rotation);
    const cosRot = Math.cos(v.entity.rotation);

    const vehCamDir = new THREE.Vector3(-sinRot, 0.35, -cosRot).normalize();
    const vehPivot = new THREE.Vector3(v.entity.position.x, v.entity.position.y + 1.2, v.entity.position.z);
    let vehClearance = camFollowDist;

    for (const b of this.collisionBoxes) {
      if ((b.height || 5) < 1.0) continue;
      const box = new THREE.Box3(
        new THREE.Vector3(b.minX - 0.3, 0, b.minZ - 0.3),
        new THREE.Vector3(b.maxX + 0.3, b.height || 6.0, b.maxZ + 0.3)
      );
      const ray = new THREE.Ray(vehPivot, vehCamDir);
      const hitPt = new THREE.Vector3();
      if (ray.intersectBox(box, hitPt)) {
        const hitD = vehPivot.distanceTo(hitPt);
        if (hitD < vehClearance) {
          vehClearance = Math.max(1.8, hitD - 0.3); // Prevent camera from entering wall
        }
      }
    }

    const targetCamX = v.entity.position.x - sinRot * vehClearance;
    const targetCamY = v.entity.position.y + Math.min(camHeight, vehClearance * 0.42 + 1.1);
    const targetCamZ = v.entity.position.z - cosRot * vehClearance;

    const targetLookAt = new THREE.Vector3(
      v.entity.position.x + sinRot * 2.8,
      v.entity.position.y + 1.2,
      v.entity.position.z + cosRot * 2.8
    );

    this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), delta * 9);
    this.cameraLookAt.lerp(targetLookAt, delta * 11);
    this.camera.lookAt(this.cameraLookAt);
  }

  public toggleVehicleEnterExit() {
    if (this.currentVehicleIndex >= 0) {
      this.exitVehicle();
    } else {
      if (this.vehicleActionCooldown > 0) return;
      this.enterVehicle();
    }
  }

  public enterVehicle(vehicleIndex?: number): boolean {
    if (this.vehicleActionCooldown > 0) return false;
    if (this.currentVehicleIndex >= 0) return false;
    if (this.activeInterior) return false;

    let targetIdx = vehicleIndex ?? -1;
    if (targetIdx < 0) {
      let closestIdx = -1;
      let closestDist = 5.2; // Generous comfortable enter radius

      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];
        const dist = Math.hypot(
          this.playerPos.x - v.entity.position.x,
          this.playerPos.z - v.entity.position.z
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      targetIdx = closestIdx;
    }

    if (targetIdx >= 0 && targetIdx < this.vehicles.length) {
      const v = this.vehicles[targetIdx];
      this.currentVehicleIndex = targetIdx;
      this.timeInsideCurrentVehicle = 0;
      v.entity.isOccupiedByPlayer = true;
      this.playerRig.root.visible = false;
      this.vehicleActionCooldown = 0.35; // Brief cooldown prevents accidental immediate exit
      soundEngine.startEngine();

      // Initialize camera smoothly behind vehicle
      const sinRot = Math.sin(v.entity.rotation);
      const cosRot = Math.cos(v.entity.rotation);
      const initCamX = v.entity.position.x - sinRot * 7.5;
      const initCamY = Math.max(
        getGroundElevation(initCamX, v.entity.position.z - cosRot * 7.5) + 0.8,
        v.entity.position.y + 3.2
      );
      const initCamZ = v.entity.position.z - cosRot * 7.5;
      this.camera.position.set(initCamX, initCamY, initCamZ);
      this.cameraLookAt.set(
        v.entity.position.x + sinRot * 2.8,
        v.entity.position.y + 1.2,
        v.entity.position.z + cosRot * 2.8
      );
      this.camera.lookAt(this.cameraLookAt);

      const carName =
        v.entity.type === 'police'
          ? 'Police Interceptor'
          : v.entity.type === 'armored'
          ? 'Armored Tactical Vehicle'
          : 'Vehicle';
      this.onNotification?.(
        `Entered ${carName}! Use Gas to drive, Brake to reverse, Drift for tight turns.`,
        'success'
      );
      return true;
    }
    return false;
  }

  public exitVehicle(): boolean {
    if (this.currentVehicleIndex < 0) return false;
    // Tiny debounce (0.1s) after entering to prevent a single tap from entering and exiting in the same frame
    if (this.timeInsideCurrentVehicle < 0.1) return false;

    const v = this.vehicles[this.currentVehicleIndex];
    if (!v) {
      this.currentVehicleIndex = -1;
      this.timeInsideCurrentVehicle = 0;
      this.playerRig.root.visible = true;
      return false;
    }

    // Find safe, unoccupied exit spot (never inside walls or other cars)
    const safePos = this.findSafeVehicleExitPosition(v);

    // Detach player from vehicle
    v.entity.isOccupiedByPlayer = false;
    v.entity.speed = 0;
    this.currentVehicleIndex = -1;
    this.timeInsideCurrentVehicle = 0;
    this.vehicleActionCooldown = 0.6; // Cooldown prevents instant re-entry when standing near car

    // Restore player visibility & position
    this.playerRig.root.visible = true;
    this.playerPos.copy(safePos);
    this.playerPos.y = getGroundElevation(this.playerPos.x, this.playerPos.z);
    this.playerRig.root.position.copy(this.playerPos);

    // Face player
    this.playerYaw = v.entity.rotation;
    this.playerRig.root.rotation.y = this.playerYaw;

    // Reset physics state
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isCrouching = false;

    // Ensure player is completely de-penetrated and normal walking controls are 100% active
    this.resolvePlayerPenetration();

    // Reset camera to on-foot 3rd person follow immediately
    this.cameraDistance = 3.6;
    this.cameraPitch = 0.14;
    this.initCameraPosition();

    soundEngine.stopEngine();
    soundEngine.stopSiren();
    this.onNotification?.('Exited Vehicle', 'info');
    return true;
  }

  /**
   * Evaluates all candidate positions surrounding a vehicle (driver side, passenger side,
   * rear, front, diagonal offsets, and multi-ring radial sweep) to find a safe, unobstructed position
   * that is NOT inside any wall, building, prop, or other vehicle.
   */
  public findSafeVehicleExitPosition(veh: { entity: VehicleEntity; rig: VehicleRig }): THREE.Vector3 {
    const rot = veh.entity.rotation;
    const sinR = Math.sin(rot);
    const cosR = Math.cos(rot);

    // Lateral driver side direction (-cosR, sinR)
    // Lateral passenger side direction (cosR, -sinR)
    // Longitudinal forward direction (sinR, cosR)
    // Longitudinal rear direction (-sinR, -cosR)

    const candidates: { x: number; z: number }[] = [];

    // 1. Driver's side curb / door (distances: 2.0, 2.5, 3.0, 3.6, 4.2)
    for (const d of [2.0, 2.5, 3.0, 3.6, 4.2]) {
      candidates.push({ x: veh.entity.position.x - cosR * d, z: veh.entity.position.z + sinR * d });
    }

    // 2. Passenger's side door (distances: 2.0, 2.5, 3.0, 3.6, 4.2)
    for (const d of [2.0, 2.5, 3.0, 3.6, 4.2]) {
      candidates.push({ x: veh.entity.position.x + cosR * d, z: veh.entity.position.z - sinR * d });
    }

    // 3. Rear of vehicle (distances: 3.2, 3.8, 4.5, 5.2)
    for (const d of [3.2, 3.8, 4.5, 5.2]) {
      candidates.push({ x: veh.entity.position.x - sinR * d, z: veh.entity.position.z - cosR * d });
    }

    // 4. Front of vehicle (distances: 3.2, 3.8, 4.5, 5.2)
    for (const d of [3.2, 3.8, 4.5, 5.2]) {
      candidates.push({ x: veh.entity.position.x + sinR * d, z: veh.entity.position.z + cosR * d });
    }

    // 5. Diagonal clearances (rear-left, rear-right, front-left, front-right)
    for (const d of [2.6, 3.4, 4.2, 5.0]) {
      candidates.push({
        x: veh.entity.position.x - (cosR + sinR) * 0.7 * d,
        z: veh.entity.position.z + (sinR - cosR) * 0.7 * d,
      });
      candidates.push({
        x: veh.entity.position.x + (cosR - sinR) * 0.7 * d,
        z: veh.entity.position.z + (-sinR - cosR) * 0.7 * d,
      });
      candidates.push({
        x: veh.entity.position.x - (cosR - sinR) * 0.7 * d,
        z: veh.entity.position.z + (sinR + cosR) * 0.7 * d,
      });
      candidates.push({
        x: veh.entity.position.x + (cosR + sinR) * 0.7 * d,
        z: veh.entity.position.z + (-sinR + cosR) * 0.7 * d,
      });
    }

    // 6. Comprehensive 16-point concentric radial rings (radii 2.6m to 8.0m)
    for (let r = 2.6; r <= 8.0; r += 0.9) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        candidates.push({
          x: veh.entity.position.x + Math.cos(ang) * r,
          z: veh.entity.position.z + Math.sin(ang) * r,
        });
      }
    }

    // 7. Outer roadway search up to 13m for tight multi-vehicle pileups
    for (let r = 9.0; r <= 13.0; r += 1.5) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        candidates.push({
          x: veh.entity.position.x + Math.cos(ang) * r,
          z: veh.entity.position.z + Math.sin(ang) * r,
        });
      }
    }

    for (const cand of candidates) {
      // Must not collide with any building, wall, prop, or fence
      if (this.checkPlayerCollisionWithMargin(cand.x, cand.z, 0.45)) {
        continue;
      }

      // Must not collide with ANY other vehicle
      let hitsOther = false;
      for (const other of this.vehicles) {
        if (other === veh) continue;
        const dist = Math.hypot(cand.x - other.entity.position.x, cand.z - other.entity.position.z);
        if (dist < 2.3) {
          hitsOther = true;
          break;
        }
      }
      if (hitsOther) continue;

      // Must not overlap THIS vehicle body
      const toCarX = cand.x - veh.entity.position.x;
      const toCarZ = cand.z - veh.entity.position.z;
      const localLat = Math.abs(toCarX * cosR - toCarZ * sinR);
      const localLong = Math.abs(toCarX * sinR + toCarZ * cosR);
      if (localLat < 1.25 && localLong < 2.55) {
        continue; // Still inside car footprint
      }

      // Map bounds check
      if (Math.abs(cand.x) > 135 || Math.abs(cand.z) > 135) {
        continue;
      }

      // Found perfectly safe exit position!
      const gy = getGroundElevation(cand.x, cand.z);
      return new THREE.Vector3(cand.x, gy, cand.z);
    }

    // Safe fallback: Find unobstructed candidate with minimum margin
    let bestX = veh.entity.position.x - cosR * 2.5;
    let bestZ = veh.entity.position.z + sinR * 2.5;
    for (const cand of candidates) {
      if (!this.checkPlayerCollisionWithMargin(cand.x, cand.z, 0.25)) {
        bestX = cand.x;
        bestZ = cand.z;
        break;
      }
    }
    return new THREE.Vector3(bestX, getGroundElevation(bestX, bestZ), bestZ);
  }

  // --------------------------------------------------------------------
  // PROLOGUE STORY MODE & DYNAMIC VISUAL CUSTOMIZATION
  // --------------------------------------------------------------------
  public isPrologueActive: boolean = false;
  private prologueMomRig?: CharacterRig;
  private prologueMrsGableRig?: CharacterRig;
  private prologueMarcusRig?: CharacterRig;

  public setWaypointPosition(x: number, z: number, active: boolean = true) {
    this.waypointPos.set(x, 0, z);
    this.waypointBeaconGroup.position.copy(this.waypointPos);
    this.isWaypointActive = active;
  }

  public setPlayerOutfit(outfitVariant: CustomizationSettings['outfit']) {
    const currentPos = this.playerPos.clone();
    const currentRot = this.playerYaw;
    const wasVisible = this.playerRig.root.visible;

    this.scene.remove(this.playerRig.root);
    const variant = outfitVariant === 'tactical_swat' ? 'swat' : outfitVariant === 'detective' ? 'detective' : 'default';
    this.playerRig = createCharacterMesh('player', variant, 'Officer Carter');
    attachWeaponToRig(this.playerRig, this.weapons[this.activeWeaponIndex].category);
    this.playerRig.root.position.copy(currentPos);
    this.playerRig.root.rotation.y = currentRot;
    this.playerRig.root.visible = wasVisible;
    this.scene.add(this.playerRig.root);
  }

  public startPrologueMode() {
    this.isPrologueActive = true;
    this.isCinematicMode = false;

    // 1. Switch player rig to Young Carter (blocky stylized model)
    const spawnPos = new THREE.Vector3(-14, 0.20, 24);
    this.playerPos.copy(spawnPos);
    this.playerYaw = Math.PI;

    this.scene.remove(this.playerRig.root);
    this.playerRig = createBlockyCharacterMesh('player', 'young_carter', 'Young Alex Carter');
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.scene.add(this.playerRig.root);

    // 2. Spawn Mother Elena on stoop near spawn point
    if (!this.prologueMomRig) {
      this.prologueMomRig = createBlockyCharacterMesh('civilian', 'mother_elena', 'Elena Carter');
      this.prologueMomRig.root.position.set(-12.5, 0.20, 25.5);
      this.prologueMomRig.root.rotation.y = -Math.PI * 0.75;
      this.scene.add(this.prologueMomRig.root);
    }

    // 3. Spawn Mrs. Gable by her grocery cart on the sidewalk
    if (!this.prologueMrsGableRig) {
      this.prologueMrsGableRig = createBlockyCharacterMesh('civilian', 'mrs_gable', 'Mrs. Gable');
      this.prologueMrsGableRig.root.position.set(-20, 0.20, 14);
      this.prologueMrsGableRig.root.rotation.y = Math.PI * 0.25;
      this.scene.add(this.prologueMrsGableRig.root);
    }

    // 4. Spawn Marcus in the nearby alleyway
    if (!this.prologueMarcusRig) {
      this.prologueMarcusRig = createBlockyCharacterMesh('thug', 'street_youth_marcus', 'Marcus');
      this.prologueMarcusRig.root.position.set(-28, 0.20, 4);
      this.prologueMarcusRig.root.rotation.y = Math.PI * 0.5;
      this.scene.add(this.prologueMarcusRig.root);
    }

    this.setWaypointPosition(-20, 14, true);
    this.initCameraPosition();
  }

  public endPrologueMode(adultOutfit: CustomizationSettings['outfit'] = 'rookie_patrol') {
    this.isPrologueActive = false;
    this.isCinematicMode = false;

    // Clean up prologue actors
    if (this.prologueMomRig) {
      this.scene.remove(this.prologueMomRig.root);
      this.prologueMomRig = undefined;
    }
    if (this.prologueMrsGableRig) {
      this.scene.remove(this.prologueMrsGableRig.root);
      this.prologueMrsGableRig = undefined;
    }
    if (this.prologueMarcusRig) {
      this.scene.remove(this.prologueMarcusRig.root);
      this.prologueMarcusRig = undefined;
    }

    // Restore Adult Carter
    this.scene.remove(this.playerRig.root);
    const variant = adultOutfit === 'tactical_swat' ? 'swat' : adultOutfit === 'detective' ? 'detective' : 'default';
    this.playerRig = createCharacterMesh('player', variant, 'Officer Carter');
    attachWeaponToRig(this.playerRig, this.weapons[this.activeWeaponIndex].category);
    this.playerPos.copy(this.cityData.spawnPoints.player);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.scene.add(this.playerRig.root);

    this.initCameraPosition();
  }

  /**
   * Builds distinct glowing entrance markers on the city sidewalks outside enterable buildings
   */
  private initExteriorBuildingMarkers() {
    this.exteriorEntranceMarkersGroup.clear();
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const archMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true });

    Object.values(ENTERABLE_BUILDINGS).forEach((b) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(b.exteriorPos.x, b.exteriorPos.y, b.exteriorPos.z);

      // Glowing pulsing entrance ring
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      markerGroup.add(ring);

      // Inner chevron
      const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.7, 24), archMat);
      innerRing.rotation.x = -Math.PI / 2;
      innerRing.position.y = 0.06;
      markerGroup.add(innerRing);

      // Floating diamond beacon
      const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), archMat);
      diamond.position.y = 1.8;
      markerGroup.add(diamond);

      this.exteriorEntranceMarkersGroup.add(markerGroup);
    });
  }

  /**
   * Continuous update for building entrances, proximity prompts, and interior interactables
   */
  public updateBuildingInteractions(inputs: InputState, delta: number, time: number) {
    // Animate exterior markers
    this.exteriorEntranceMarkersGroup.children.forEach((child, idx) => {
      const diamond = child.children[2];
      if (diamond) {
        diamond.rotation.y = time * 2.5 + idx;
        diamond.position.y = 1.6 + Math.sin(time * 3 + idx) * 0.2;
      }
    });

    if (this.currentVehicleIndex >= 0) {
      if (this.nearbyBuildingEntrance) {
        this.nearbyBuildingEntrance = null;
        this.onBuildingEntranceChanged?.(null);
      }
      return;
    }

    // 1. OUTSIDE ON CITY STREET
    if (!this.activeInterior) {
      let closestEntrance: EnterableBuilding | null = null;
      let closestDist = 999;

      for (const b of Object.values(ENTERABLE_BUILDINGS)) {
        const d = Math.hypot(this.playerPos.x - b.exteriorPos.x, this.playerPos.z - b.exteriorPos.z);
        if (d < b.entranceRadius && d < closestDist) {
          closestDist = d;
          closestEntrance = b;
        }
      }

      if (this.nearbyBuildingEntrance?.id !== closestEntrance?.id) {
        this.nearbyBuildingEntrance = closestEntrance;
        this.onBuildingEntranceChanged?.(closestEntrance);
      }

      // Check enter trigger via dedicated input or interact key
      if ((inputs.enterBuilding || (inputs.interact && this.nearbyBuildingEntrance)) && this.nearbyBuildingEntrance) {
        inputs.enterBuilding = false;
        inputs.interact = false;
        this.enterBuilding(this.nearbyBuildingEntrance.id);
      }
    }
    // 2. INSIDE ENTERABLE BUILDING INTERIOR
    else {
      // Find closest interior interactable
      let closestObj: InteriorInteractable | null = null;
      let closestObjDist = 999;

      for (const obj of this.activeInterior.interactiveObjects) {
        const d = Math.hypot(this.playerPos.x - obj.position.x, this.playerPos.z - obj.position.z);
        if (d < obj.radius && d < closestObjDist) {
          closestObjDist = d;
          closestObj = obj;
        }
      }

      if (this.nearbyInteriorInteractable?.id !== closestObj?.id) {
        this.nearbyInteriorInteractable = closestObj;
        this.onInteriorInteractableChanged?.(closestObj);
      }

      // Exit or Interact trigger
      if (inputs.exitBuilding || (inputs.interact && this.nearbyInteriorInteractable?.type === 'exit_door')) {
        inputs.exitBuilding = false;
        inputs.interact = false;
        this.exitBuilding();
      } else if (inputs.interact && this.nearbyInteriorInteractable) {
        inputs.interact = false;
        this.triggerInteriorInteractable(this.nearbyInteriorInteractable);
      }

      // Smoothly animate vault door if active
      if (this.activeInterior.animatedVaultDoor) {
        const vd = this.activeInterior.animatedVaultDoor;
        if (Math.abs(vd.currentAngle - vd.targetAngle) > 0.005) {
          vd.currentAngle = THREE.MathUtils.lerp(vd.currentAngle, vd.targetAngle, delta * 4);
          vd.doorMesh.rotation.y = vd.currentAngle;
          vd.wheelMesh.rotation.z += delta * (vd.isOpen ? 6 : -6);
        }
      }
    }
  }

  /**
   * Enters the selected building interior seamlessly
   */
  public enterBuilding(buildingId: EnterableBuildingId) {
    if (this.activeInterior) return;

    const interiorState = buildBuildingInterior(buildingId);
    // Record current exterior coordinates to return precisely here on exit
    interiorState.exteriorPosition = {
      x: this.playerPos.x,
      y: this.playerPos.y,
      z: this.playerPos.z,
    };
    interiorState.exteriorYaw = this.playerYaw;

    this.activeInterior = interiorState;
    this.scene.add(interiorState.interiorGroup);

    // Teleport Carter cleanly into the interior room facing forward
    this.playerPos.set(
      interiorState.interiorSpawnPos.x,
      interiorState.interiorSpawnPos.y,
      interiorState.interiorSpawnPos.z
    );
    this.playerYaw = interiorState.interiorSpawnYaw;
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;

    // Reset camera behind Carter inside
    this.cameraDistance = 4.2;
    this.cameraPitch = 0.12;
    this.initCameraPosition();

    soundEngine.playRadioChime();
    this.onNotification?.(`Entered ${interiorState.building.name}!`, 'success');

    this.onBuildingEntranceChanged?.(null);
    this.onInteriorStateChanged?.(interiorState);
  }

  /**
   * Exits building interior and returns Carter seamlessly to the city street
   */
  public exitBuilding() {
    if (!this.activeInterior) return;

    const returnPos = this.activeInterior.exteriorPosition;
    const returnYaw = this.activeInterior.exteriorYaw;
    const buildingName = this.activeInterior.building.name;

    // Remove interior from scene
    this.scene.remove(this.activeInterior.interiorGroup);

    // Teleport Carter back to exterior entrance
    this.playerPos.set(returnPos.x, returnPos.y, returnPos.z);
    this.playerYaw = returnYaw;
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;

    this.activeInterior = null;
    this.nearbyInteriorInteractable = null;

    // Reset camera behind Carter
    this.cameraDistance = 4.6;
    this.cameraPitch = 0.14;
    this.initCameraPosition();

    soundEngine.playRadioChime();
    this.onNotification?.(`Exited ${buildingName} to city street.`, 'info');

    this.onInteriorInteractableChanged?.(null);
    this.onInteriorStateChanged?.(null);
  }

  /**
   * Triggers interaction with an object inside the building
   */
  public triggerInteriorInteractable(interactable: InteriorInteractable) {
    if (interactable.type === 'exit_door') {
      this.exitBuilding();
      return;
    }

    if (interactable.type === 'vault_door') {
      this.toggleVaultDoor();
      return;
    }

    // Forward to React for modal/choice handling
    this.onTriggerInteriorInteraction?.(interactable);
  }

  /**
   * Operates and swings open/closed the heavy steel vault blast door
   */
  public toggleVaultDoor() {
    if (!this.activeInterior?.animatedVaultDoor) return;
    const vd = this.activeInterior.animatedVaultDoor;
    vd.isOpen = !vd.isOpen;
    vd.targetAngle = vd.isOpen ? -Math.PI * 0.55 : 0;
    soundEngine.playRadioChime();
    this.onNotification?.(
      vd.isOpen ? 'Master Vault Door Unlocked & Swung Open!' : 'Master Vault Door Sealed & Locked!',
      'alert'
    );
  }

  private updateCivilianTraffic(delta: number, time: number) {
    const playerInCruiser = this.currentVehicleIndex >= 0;
    const playerVehicle = playerInCruiser ? this.vehicles[this.currentVehicleIndex] : null;
    const sirenActive = playerVehicle?.entity.isSirenOn || false;

    for (let i = 0; i < this.civilianTraffic.length; i++) {
      const tc = this.civilianTraffic[i];
      if (tc.entity.isOccupiedByPlayer || tc.entity.health <= 0) continue;

      let speed = tc.targetSpeed;

      // Check distance to player
      const distToPlayer = Math.hypot(
        tc.entity.position.x - this.playerPos.x,
        tc.entity.position.z - this.playerPos.z
      );

      // If police siren is active nearby, pull over and yield to police cruiser
      if (sirenActive && distToPlayer < 30) {
        speed = Math.max(0, speed - delta * 18);
      }

      // Check distance to vehicle in front in the same lane
      for (let j = 0; j < this.vehicles.length; j++) {
        const other = this.vehicles[j];
        if (other.entity.id === tc.entity.id) continue;
        const d = Math.hypot(
          other.entity.position.x - tc.entity.position.x,
          other.entity.position.z - tc.entity.position.z
        );
        if (d < 8.5) {
          const vDirX = Math.sin(tc.entity.rotation);
          const vDirZ = Math.cos(tc.entity.rotation);
          const toOtherX = other.entity.position.x - tc.entity.position.x;
          const toOtherZ = other.entity.position.z - tc.entity.position.z;
          const dot = (toOtherX * vDirX + toOtherZ * vDirZ) / (d || 1);
          if (dot > 0.5) {
            speed = Math.min(speed, Math.max(0, (other.entity.speed || 0) * 0.8));
          }
        }
      }

      tc.entity.speed = THREE.MathUtils.lerp(tc.entity.speed, speed, delta * 4);

      // Move along designated street lane with building collision check
      let nextX = tc.entity.position.x;
      let nextZ = tc.entity.position.z;
      let nextRot = tc.entity.rotation;

      if (tc.lane === 'south') {
        nextZ = tc.entity.position.z + tc.entity.speed * delta;
        nextRot = 0;
        if (nextZ > 140) nextZ = -140;
      } else if (tc.lane === 'north') {
        nextZ = tc.entity.position.z - tc.entity.speed * delta;
        nextRot = Math.PI;
        if (nextZ < -140) nextZ = 140;
      } else if (tc.lane === 'east') {
        nextX = tc.entity.position.x + tc.entity.speed * delta;
        nextRot = Math.PI / 2;
        if (nextX > 140) nextX = -140;
      } else if (tc.lane === 'west') {
        nextX = tc.entity.position.x - tc.entity.speed * delta;
        nextRot = -Math.PI / 2;
        if (nextX < -140) nextX = 140;
      } else if (tc.lane === 'outer_south') {
        nextZ = tc.entity.position.z + tc.entity.speed * delta;
        nextRot = 0;
        if (nextZ > 135) nextZ = -135;
      }

      tc.entity.rotation = nextRot;
      if (!this.testVehicleBuildingCollisions(nextX, nextZ, tc.entity.rotation)) {
        tc.entity.position.x = nextX;
        tc.entity.position.z = nextZ;
      } else {
        tc.entity.speed = 0; // Yield and halt before colliding with building structure
      }

      tc.rig.root.position.set(tc.entity.position.x, 0, tc.entity.position.z);
      tc.rig.root.rotation.y = tc.entity.rotation;
      updateVehicleAnimation(tc.rig, tc.entity.speed, 0, time, tc.entity.type === 'police');
    }
  }

  private updateActivePursuitVehicle(delta: number, time: number) {
    if (!this.activePursuitVehicle || this.activePursuitVehicle.entity.health <= 0) return;

    const pv = this.activePursuitVehicle;
    pv.entity.speed = 22;

    const pPos = pv.entity.position;
    if (Math.abs(pPos.x) > 115) {
      pv.entity.rotation += Math.PI * 0.5;
    }
    if (Math.abs(pPos.z) > 115) {
      pv.entity.rotation += Math.PI * 0.5;
    }

    const nextX = pPos.x + Math.sin(pv.entity.rotation) * pv.entity.speed * delta;
    const nextZ = pPos.z + Math.cos(pv.entity.rotation) * pv.entity.speed * delta;

    if (!this.testVehicleBuildingCollisions(nextX, nextZ, pv.entity.rotation)) {
      pPos.x = nextX;
      pPos.z = nextZ;
    } else {
      // Steer away onto street rather than phasing through building structure
      pv.entity.rotation += Math.PI * 0.45;
    }

    pv.rig.root.position.set(pPos.x, 0, pPos.z);
    pv.rig.root.rotation.y = pv.entity.rotation;
    updateVehicleAnimation(pv.rig, pv.entity.speed, 0, time, false);

    // Dynamic Waypoint lock onto fleeing suspect vehicle
    this.waypointPos.set(pPos.x, 0, pPos.z);
    this.waypointBeaconGroup.position.copy(this.waypointPos);
  }

  private updateCriminalChaseAI(delta: number, time: number) {
    const crim = this.vehicles.find((v) => v.entity.type === 'criminal');
    if (!crim || crim.entity.isOccupiedByPlayer || crim.entity.health <= 0) return;

    crim.entity.speed = 18;
    crim.entity.rotation += delta * 0.15;

    const nextX = crim.entity.position.x + Math.sin(crim.entity.rotation) * crim.entity.speed * delta;
    const nextZ = crim.entity.position.z + Math.cos(crim.entity.rotation) * crim.entity.speed * delta;

    if (!this.testVehicleBuildingCollisions(nextX, nextZ, crim.entity.rotation)) {
      crim.entity.position.x = nextX;
      crim.entity.position.z = nextZ;
    } else {
      crim.entity.rotation += Math.PI * 0.5;
    }

    if (Math.abs(crim.entity.position.x) > 90) crim.entity.rotation += Math.PI * 0.5;
    if (Math.abs(crim.entity.position.z) > 90) crim.entity.rotation += Math.PI * 0.5;

    crim.rig.root.position.set(crim.entity.position.x, 0, crim.entity.position.z);
    crim.rig.root.rotation.y = crim.entity.rotation;
    updateVehicleAnimation(crim.rig, crim.entity.speed, 0, time, false);
  }

  private checkVehicleRamming(playerVeh: { entity: VehicleEntity; rig: VehicleRig }) {
    for (const other of this.vehicles) {
      if (other === playerVeh) continue;
      const dist = Math.hypot(
        playerVeh.entity.position.x - other.entity.position.x,
        playerVeh.entity.position.z - other.entity.position.z
      );

      if (dist < 3.6 && Math.abs(playerVeh.entity.speed) > 7) {
        const damage = Math.round(Math.abs(playerVeh.entity.speed) * 3.8);
        other.entity.health = Math.max(0, other.entity.health - damage);
        soundEngine.playExplosion();
        soundEngine.playTireScreech();

        this.addFloatingText(`-${damage} PIT MANEUVER!`, '#ef4444', other.entity.position);

        if (other.entity.health <= 0) {
          other.entity.speed = 0;
          if (other === this.activePursuitVehicle || other.entity.type === 'criminal') {
            this.onNotification?.('CRIMINAL GETAWAY VEHICLE DISABLED! Suspect driver neutralized!', 'success');
            this.onMissionObjectiveProgress?.('chase_stop', 1);
            this.stats.xp += 450;
            this.stats.money += 750;
            this.onStatsChanged?.(this.stats);
            this.activePursuitVehicle = null;
          }
        }

        playerVeh.entity.speed *= 0.55;
        other.entity.speed *= 0.25;
      }
    }
  }

  /**
   * Raycasts from the exact center of screen (the HUD reticle)
   * so shooting and aiming are 100% aligned with the crosshair.
   */
  public getAimRayTarget(range: number = 65): {
    point: THREE.Vector3;
    dir: THREE.Vector3;
    enemy: EnemyEntity | null;
    isHeadshot: boolean;
    hitVehicle?: { entity: VehicleEntity; rig: VehicleRig };
  } {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const cameraRay = raycaster.ray;

    let closestDist = range;
    let hitEnemy: EnemyEntity | null = null;
    let isHeadshot = false;
    let hitVehicleObj: { entity: VehicleEntity; rig: VehicleRig } | undefined;

    // 1. Raycast against collision boxes (buildings, walls, crates) in front of player
    for (const b of this.collisionBoxes) {
      const box = new THREE.Box3(
        new THREE.Vector3(b.minX, 0, b.minZ),
        new THREE.Vector3(b.maxX, b.height || 5.0, b.maxZ)
      );
      const hitPoint = new THREE.Vector3();
      if (cameraRay.intersectBox(box, hitPoint)) {
        const d = cameraRay.origin.distanceTo(hitPoint);
        const toHit = hitPoint.clone().sub(this.playerPos);
        if (d > 0.8 && toHit.dot(cameraRay.direction) > -0.5 && d < closestDist) {
          closestDist = d;
        }
      }
    }

    // 2. Raycast against vehicles (getaway cars, criminal cars)
    for (const v of this.vehicles) {
      if (v.entity.isOccupiedByPlayer || v.entity.health <= 0) continue;
      const vBox = new THREE.Box3(
        new THREE.Vector3(v.entity.position.x - 1.25, 0, v.entity.position.z - 2.3),
        new THREE.Vector3(v.entity.position.x + 1.25, 1.7, v.entity.position.z + 2.3)
      );
      const hitPt = new THREE.Vector3();
      if (cameraRay.intersectBox(vBox, hitPt)) {
        const d = cameraRay.origin.distanceTo(hitPt);
        if (d > 1.0 && d < closestDist) {
          closestDist = d;
          hitVehicleObj = v;
        }
      }
    }

    // 3. Raycast against hostile enemies (torso + head vertical cylinder)
    for (const e of this.ai.enemies) {
      if (e.state === 'dead' || e.state === 'arrested') continue;

      const eGroundY = e.position.y || getGroundElevation(e.position.x, e.position.z);
      const eCenter = new THREE.Vector3(e.position.x, eGroundY + 1.1, e.position.z);
      const toCenter = eCenter.clone().sub(cameraRay.origin);
      const proj = toCenter.dot(cameraRay.direction);

      if (proj > 1.0 && proj < closestDist) {
        const rayPoint = cameraRay.origin.clone().add(cameraRay.direction.clone().multiplyScalar(proj));
        const relHeight = rayPoint.y - eGroundY;
        if (relHeight >= -0.1 && relHeight <= 2.1) {
          const horizDist = Math.hypot(rayPoint.x - e.position.x, rayPoint.z - e.position.z);
          if (horizDist < 0.80) {
            closestDist = proj;
            hitEnemy = e;
            isHeadshot = relHeight > 1.45;
            hitVehicleObj = undefined;
          }
        }
      }
    }

    // 4. Ground plane intersection if looking downward
    if (cameraRay.direction.y < -0.01) {
      const groundT = -cameraRay.origin.y / cameraRay.direction.y;
      if (groundT > 0 && groundT < closestDist) {
        closestDist = groundT;
      }
    }

    const endPoint = cameraRay.origin.clone().add(cameraRay.direction.clone().multiplyScalar(closestDist));
    return {
      point: endPoint,
      dir: cameraRay.direction.clone(),
      enemy: hitEnemy,
      isHeadshot,
      hitVehicle: hitVehicleObj,
    };
  }

  public playerFireWeapon() {
    const w = this.weapons[this.activeWeaponIndex];
    if (!w) return;

    if (w.currentAmmo <= 0) {
      if (w.reserveAmmo > 0) {
        this.startReload();
      } else {
        soundEngine.playGunshot('handgun'); // Dry-fire empty click
        this.onNotification?.('Out of Ammunition! Requisition more ammo or switch weapon.', 'alert');
      }
      return;
    }

    // Decrease ammunition correctly
    w.currentAmmo--;
    this.shootCooldownTimer = 1.0 / w.fireRate;
    this.recentGunshotTimer = 1.8;
    soundEngine.playGunshot(w.category);
    this.onWeaponChanged?.(w);

    // Muzzle flash, muzzle point light & recoil kick
    this.playerRig.recoilTimer = 0.16;
    if (this.playerRig.muzzleLight) {
      this.playerRig.muzzleLight.intensity = 3.5;
    }
    const recoilKick = w.damage > 40 ? 0.032 : 0.018;
    this.cameraPitch = Math.max(-0.6, this.cameraPitch - recoilKick);
    this.targetRecoilPitch = recoilKick;
    this.cameraShakeAmount = Math.min(0.22, this.cameraShakeAmount + (w.damage > 40 ? 0.12 : 0.05));

    // Get exact aim target point aligned with center reticle
    const aimTarget = this.getAimRayTarget(w.range);

    // Bullet origin from weapon muzzle in world coordinates
    const origin = new THREE.Vector3();
    if (this.playerRig.muzzleFlash) {
      this.playerRig.muzzleFlash.getWorldPosition(origin);
    } else {
      origin.set(this.playerPos.x, 1.4, this.playerPos.z);
    }

    const endPoint = aimTarget.point;
    this.addBulletTracer(origin, endPoint, w.isNonLethal ? 0x38bdf8 : 0xfacc15);

    if (aimTarget.enemy) {
      const hitEnemy = aimTarget.enemy;
      const isHeadshot = aimTarget.isHeadshot;
      soundEngine.playHit(isHeadshot);

      const rig = this.ai.enemyRigs[hitEnemy.meshIndex];
      if (rig) rig.flinchTimer = 0.20;

      // Morality & Consequences: Shooting a surrendering suspect
      if (hitEnemy.state === 'surrendered' && !w.isNonLethal) {
        this.stats.iaViolations++;
        this.stats.reputation = Math.max(0, this.stats.reputation - 15);
        this.stats.money = Math.max(0, this.stats.money - 200);
        this.addFloatingText('IA VIOLATION! -$200', '#dc2626', hitEnemy.position);
        this.onStatsChanged?.(this.stats);
        this.onNotification?.(
          'INTERNAL AFFAIRS ALERT: Excessive force on surrendered suspect! -$200 Fine, -15 Reputation',
          'alert'
        );
        soundEngine.playMegaphoneChime();
      }

      if (w.isNonLethal) {
        // Taser stun & instant surrender!
        hitEnemy.health = Math.max(1, hitEnemy.health - 25);
        hitEnemy.state = 'surrendered';
        this.addFloatingText('STUNNED!', '#38bdf8', hitEnemy.position);
        this.onNotification?.(`Suspect ${hitEnemy.name} Stunned! Tap Handcuffs to Arrest.`, 'alert');
      } else {
        const mult = isHeadshot ? 2.0 : 1.0;
        const damage = Math.round(w.damage * mult);
        hitEnemy.health = Math.max(0, hitEnemy.health - damage);

        this.addFloatingText(
          isHeadshot ? `HEADSHOT! -${damage}` : `-${damage}`,
          isHeadshot ? '#f59e0b' : '#ef4444',
          hitEnemy.position
        );

        if (hitEnemy.health <= 0) {
          hitEnemy.state = 'dead';
          this.stats.kills++;
          this.stats.money += 75;
          this.stats.xp += 100;
          this.onStatsChanged?.(this.stats);
          this.onMissionObjectiveProgress?.('kill', 1);
          this.onNotification?.(`Neutralized ${hitEnemy.name}`, 'info');
          this.checkEnemyIncidentResolution(hitEnemy.id);
        }
      }
    } else if (aimTarget.hitVehicle) {
      const v = aimTarget.hitVehicle;
      v.entity.health = Math.max(0, v.entity.health - w.damage);
      soundEngine.playExplosion();
      this.addFloatingText(`-${w.damage}`, '#ef4444', v.entity.position);
      if (v.entity.health <= 0) {
        v.entity.speed = 0;
        if (v === this.activePursuitVehicle || v.entity.type === 'criminal') {
          this.onNotification?.('SUSPECT VEHICLE DISABLED! Engine immobilized.', 'success');
          this.onMissionObjectiveProgress?.('chase_stop', 1);
          this.stats.xp += 400;
          this.stats.money += 600;
          this.onStatsChanged?.(this.stats);
          this.activePursuitVehicle = null;
        }
      }
    } else {
      // Check if civilian in line of fire near endpoint
      for (const civ of this.ai.civilians) {
        const civPos = new THREE.Vector3(civ.position.x, 1.0, civ.position.z);
        if (civPos.distanceTo(endPoint) < 1.4) {
          civ.state = 'cowering';
          civ.panicTimer = 15;
          if ((civ as any).health !== undefined) {
            (civ as any).health = Math.max(0, (civ as any).health - w.damage);
            if ((civ as any).health <= 0) {
              civ.state = 'dead';
              this.addFloatingText('CIVILIAN CASUALTY!', '#ef4444', civPos);
              this.onNotification?.('CRITICAL WARNING: Civilian sustained lethal injury! Avoid collateral damage!', 'alert');
            }
          }
          this.stats.wantedLevel = Math.min(5, this.stats.wantedLevel + 1);
          this.stats.wantedCooldown = 20;
          // Direct impact on Police Trust & Suspicion for reckless gunfire endangering citizens
          this.stats.policeReputation = Math.max(0, (this.stats.policeReputation ?? this.stats.reputation) - 6);
          this.stats.reputation = this.stats.policeReputation;
          this.stats.suspicionLevel = Math.min(100, (this.stats.suspicionLevel ?? 10) + 8);
          this.ai.carterDoubleLife.policeRep = this.stats.policeReputation;
          this.ai.carterDoubleLife.suspicionLevel = this.stats.suspicionLevel;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.('WARNING: Civilian in crossfire! Police Trust reduced (-6) & IA Heat increased (+8)!', 'alert');
          this.addFloatingText('CIVILIAN ENDANGERED!', '#ef4444', civPos);
          break;
        }
      }
    }
  }

  private enemyFireBullet(enemy: EnemyEntity, targetPos: THREE.Vector3) {
    soundEngine.playGunshot(enemy.weapon.category);
    this.recentGunshotTimer = 1.8;

    const origin = new THREE.Vector3(enemy.position.x, 1.4, enemy.position.z);
    const dir = targetPos.clone().sub(origin).normalize();

    // Spread: realistic precision grouping so hits connect reliably in clear sightlines
    dir.x += (Math.random() - 0.5) * 0.04;
    dir.z += (Math.random() - 0.5) * 0.04;

    const endPoint = origin.clone().add(dir.clone().multiplyScalar(35));
    this.addBulletTracer(origin, endPoint, 0xef4444);

    const toPlayer = this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
    const proj = toPlayer.dot(dir);

    // 1. Check if bullet trajectory hits any building/wall before reaching player
    let wallBlocked = false;
    for (const b of this.collisionBoxes) {
      if ((b.height || 5) < 1.1) continue;
      const box = new THREE.Box3(
        new THREE.Vector3(b.minX, 0, b.minZ),
        new THREE.Vector3(b.maxX, b.height || 5.0, b.maxZ)
      );
      const hitPt = new THREE.Vector3();
      const ray = new THREE.Ray(origin, dir);
      if (ray.intersectBox(box, hitPt)) {
        const d = origin.distanceTo(hitPt);
        if (d < proj) {
          wallBlocked = true;
          break;
        }
      }
    }

    if (wallBlocked) {
      return; // Bullet stopped by solid wall
    }

    // Check if bullet trajectory hits any captive hostage in crossfire (hostages are NOT invulnerable)
    for (const h of this.missionHostages) {
      if ((h as any).isRescued || ((h as any).health !== undefined && (h as any).health <= 0)) continue;
      const toHostage = new THREE.Vector3(h.position.x, 1.0, h.position.z).sub(origin);
      const hProj = toHostage.dot(dir);
      if (hProj > 0 && hProj < 35) {
        const closestPt = origin.clone().add(dir.clone().multiplyScalar(hProj));
        const hDist = closestPt.distanceTo(new THREE.Vector3(h.position.x, 1.0, h.position.z));
        if (hDist < 1.1) {
          (h as any).health = Math.max(0, ((h as any).health || 100) - 20);
          this.addFloatingText(`-20 HOSTAGE HIT!`, '#ef4444', new THREE.Vector3(h.position.x, 1.8, h.position.z));
          this.onNotification?.(`WARNING: ${h.name || 'Hostage'} taking syndicate fire! Untie them immediately!`, 'alert');
          break;
        }
      }
    }

    if (proj > 0 && proj < 35 && this.playerDamageCooldownTimer <= 0) {
      const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
      const dist = closestPoint.distanceTo(this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)));

      if (dist < 1.05) {
        this.playerDamageCooldownTimer = 0.15; // Prevent damage stacking in a single frame
        const rawDamage = enemy.weapon.damage;
        const hadArmor = this.stats.armor > 0;
        soundEngine.playPlayerDamage(hadArmor);

        if (this.stats.armor > 0) {
          const absorbed = Math.min(this.stats.armor, rawDamage);
          this.stats.armor -= absorbed;
          const remaining = rawDamage - absorbed;
          this.stats.health = Math.max(0, this.stats.health - remaining);
        } else {
          this.stats.health = Math.max(0, this.stats.health - rawDamage);
        }

        // Damage flinch animation and recoil camera shake
        this.playerRig.flinchTimer = 0.22;
        this.cameraShakeAmount = 0.35;

        this.addFloatingText(`-${rawDamage}`, '#dc2626', this.playerPos);
        this.onStatsChanged?.(this.stats);
        this.onPlayerDamaged?.(rawDamage);

        if (this.stats.health <= 0) {
          this.onNotification?.('OFFICER DOWN! Mission Failed.', 'alert');
        }
      }
    }
  }

  private policeFireBullet(police: PoliceNPCEntity, targetPos: THREE.Vector3) {
    soundEngine.playGunshot('handgun');
    this.recentGunshotTimer = 1.8;

    const origin = new THREE.Vector3(police.position.x, 1.4, police.position.z);
    const dir = targetPos.clone().sub(origin).normalize();

    dir.x += (Math.random() - 0.5) * 0.08;
    dir.z += (Math.random() - 0.5) * 0.08;

    const endPoint = origin.clone().add(dir.clone().multiplyScalar(35));
    this.addBulletTracer(origin, endPoint, 0x38bdf8);
  }

  private militaryFireBullet(soldier: MilitaryNPCEntity, targetPos: THREE.Vector3) {
    soundEngine.playGunshot('rifle');
    this.recentGunshotTimer = 2.2;

    const origin = new THREE.Vector3(soldier.position.x, 1.4, soldier.position.z);
    const dir = targetPos.clone().sub(origin).normalize();

    dir.x += (Math.random() - 0.5) * 0.04; // Tight precision grouping
    dir.z += (Math.random() - 0.5) * 0.04;

    const endPoint = origin.clone().add(dir.clone().multiplyScalar(45));
    this.addBulletTracer(origin, endPoint, 0xfbbf24); // High-velocity amber/gold military tracer
  }

  public attemptArrest() {
    let arrestedAny = false;
    for (const e of this.ai.enemies) {
      if (e.state === 'dead' || e.state === 'arrested') continue;
      const dist = this.playerPos.distanceTo(new THREE.Vector3(e.position.x, 0, e.position.z));
      const canArrestThis = e.state === 'surrendered' || e.health < e.maxHealth * 0.45 || (e.alertLevel < 50 && dist < 2.5);

      if (dist < 3.5 && canArrestThis) {
        e.state = 'arrested';
        e.isCuffed = true;
        e.shootCooldown = 999999;
        e.alertLevel = 0;
        e.target = undefined;
        const rig = this.ai.enemyRigs[e.meshIndex];
        if (rig?.weaponMesh) {
          rig.weaponMesh.visible = false;
        }
        soundEngine.playArrest();
        this.stats.arrests++;
        this.onStatsChanged?.(this.stats);
        this.onMissionObjectiveProgress?.('arrest', 1);
        this.onMissionObjectiveProgress?.('kill', 1); // Also counts for neutralize objectives
        this.addFloatingText('SUSPECT CUFFED', '#facc15', e.position);
        this.onNotification?.(`Suspect ${e.name} Handcuffed! Double-Life booking options opened.`, 'success');
        this.checkEnemyIncidentResolution(e.id);
        arrestedAny = true;
        this.onOpenArrestEvidenceModal?.(e);
        break;
      }
    }

    if (!arrestedAny) {
      // If already cuffed suspect is nearby, re-open booking & evidence modal
      const cuffed = this.checkArrestedSuspectNearby();
      if (cuffed) {
        this.onOpenArrestEvidenceModal?.(cuffed);
        return;
      }
      this.onNotification?.('Order suspect to surrender [G] or confront weakened suspect to arrest.', 'info');
    }
  }

  /**
   * Synchronizes Officer Carter's Double-Life stats with AI Controller
   */
  public syncDoubleLifeStats(stats: PlayerStats) {
    this.stats = { ...stats };
    this.ai.carterDoubleLife = {
      policeRep: stats.policeReputation ?? stats.reputation,
      underworldRep: stats.underworldReputation ?? 15,
      suspicionLevel: stats.suspicionLevel ?? 10,
    };
  }

  /**
   * Counts civilians within observation range of Officer Carter
   */
  public countNearbyWitnesses(radius: number = 14): number {
    let count = 0;
    for (const civ of this.ai.civilians) {
      const dist = this.playerPos.distanceTo(new THREE.Vector3(civ.position.x, 0, civ.position.z));
      if (dist < radius) {
        count++;
      }
    }
    return count;
  }

  /**
   * Triggers civilian witness reaction to officer misconduct
   */
  public triggerWitnessMisconductAlert(description: string) {
    for (const civ of this.ai.civilians) {
      const dist = this.playerPos.distanceTo(new THREE.Vector3(civ.position.x, 0, civ.position.z));
      if (dist < 14) {
        civ.state = 'witnessing';
        civ.panicTimer = 18;
        this.addFloatingText('WITNESS REPORTED!', '#ef4444', civ.position);
        this.onNotification?.('WITNESS SHOUT: "I saw that! Officer Carter is taking dirty payouts!"', 'alert');
        this.onWitnessMisconductAlert?.(civ, description);
        break;
      }
    }
  }

  /**
   * Release suspect under table (aided escape)
   */
  public releaseSuspect(enemyId: string) {
    const enemy = this.ai.enemies.find((e) => e.id === enemyId);
    if (enemy) {
      enemy.state = 'flee';
      enemy.alertLevel = 0;
      enemy.target = {
        x: enemy.position.x + (Math.random() - 0.5) * 50,
        y: 0,
        z: enemy.position.z + (Math.random() - 0.5) * 50,
      };
      this.addFloatingText('SUSPECT ESCAPING', '#38bdf8', enemy.position);
      setTimeout(() => {
        this.ai.removeEnemy(enemy.id, this.scene);
      }, 3500);
    }
  }

  /**
   * Transport suspect to police station lockup
   */
  public transportSuspect(enemyId: string) {
    const enemy = this.ai.enemies.find((e) => e.id === enemyId);
    if (enemy) {
      enemy.transportCalled = true;
      this.addFloatingText('10-75 IN CUSTODY', '#22c55e', enemy.position);
      setTimeout(() => {
        this.ai.removeEnemy(enemy.id, this.scene);
      }, 2500);
    }
  }

  public checkEnemyIncidentResolution(enemyId: string) {
    for (const inc of cityIncidentManager.activeIncidents) {
      if ((inc.status === 'active' || inc.status === 'pending') && inc.spawnedEnemyIds?.includes(enemyId)) {
        const encounterEnemies = this.ai.enemies.filter((item) => inc.spawnedEnemyIds?.includes(item.id));
        if (encounterEnemies.length > 0 && encounterEnemies.every((item) => item.state === 'dead' || item.state === 'arrested')) {
          this.resolveCombatIncident(inc, encounterEnemies);
          break;
        }
      }
    }
  }

  /**
   * Carter orders suspects to drop weapons and surrender
   */
  public orderSuspectsSurrender() {
    soundEngine.playMegaphoneChime();
    this.onNotification?.('Officer Carter: "POLICE! DROP YOUR WEAPONS AND GET DOWN!"', 'alert');

    let surrenderedCount = 0;
    const underworldRep = this.stats.underworldReputation ?? 15;

    for (const e of this.ai.enemies) {
      if (e.state === 'dead' || e.state === 'arrested' || e.state === 'surrendered') continue;
      const dist = this.playerPos.distanceTo(new THREE.Vector3(e.position.x, 0, e.position.z));

      // Thugs have high surrender rate when confronted, enforcers lower, boss never
      if (dist < 14.0 && e.type !== 'boss') {
        let surrenderChance = e.health < e.maxHealth * 0.7 ? 0.9 : 0.6;
        // Underworld trust makes criminals eager to deal with Officer Carter
        if (underworldRep >= 40) {
          surrenderChance = Math.min(0.98, surrenderChance + 0.22);
        }

        if (Math.random() < surrenderChance) {
          e.state = 'surrendered';
          e.shootCooldown = 999;
          e.alertLevel = 0;
          surrenderedCount++;
          this.addFloatingText('SURRENDERED!', '#facc15', e.position);
          if (underworldRep >= 45 && Math.random() < 0.5) {
            this.onNotification?.(`Suspect ${e.name} raised hands: "Carter, hold up! Let's talk business!"`, 'info');
          } else {
            this.onNotification?.(`Suspect ${e.name} has raised hands and surrendered!`, 'info');
          }
        }
      }
    }

    if (surrenderedCount === 0) {
      this.onNotification?.('Suspects refuse to surrender! Hostiles holding ground!', 'alert');
    }
  }

  /**
   * Calls nearby police officers to Officer Carter's position.
   * Backup officers follow Carter, take tactical formation, respond to threats, and assist during combat.
   */
  public callPoliceBackup() {
    soundEngine.playRadioChime();

    const policeTrust = this.stats.policeReputation ?? this.stats.reputation;
    const suspicion = this.stats.suspicionLevel ?? 10;

    // Consequence: If Police Trust is critically low (< 25) or Suspicion is critical (>= 85), dispatch hesitates or refuses tactical deployment
    if (policeTrust < 25 && suspicion >= 75) {
      this.onNotification?.('DISPATCH 10-99: "Unit 24, all tactical patrol units are currently committed to high-priority calls. Stand by."', 'alert');
      return;
    }

    // Check currently active backup units
    const activeBackup = this.ai.policeNPCs.filter((p) => p.isBackupUnit && p.health > 0);

    // High Police Trust (>= 75) allows up to 3 squad members for elite support; lower trust allows 1-2
    const maxBackupCount = policeTrust >= 75 ? 3 : 2;

    if (activeBackup.length >= maxBackupCount) {
      this.onNotification?.('Officer Carter: "Squad, regroup on my mark! Stay sharp!"', 'info');
      activeBackup.forEach((p) => {
        p.state = 'responding';
      });
      return;
    }

    const neededTotal = maxBackupCount - activeBackup.length;
    if (policeTrust >= 80) {
      this.onNotification?.('DISPATCH 10-4: "High-priority tactical backup responding immediately for Senior Officer Carter!"', 'success');
    } else {
      this.onNotification?.('Officer Carter: "10-78: Requesting squad backup at my 20!"', 'alert');
    }

    // 1. Convert nearby patrol officers if available within 80m
    const candidates = this.ai.policeNPCs.filter(
      (p) => !p.isBackupUnit && p.health > 0 && Math.hypot(p.position.x - this.playerPos.x, p.position.z - this.playerPos.z) < 80
    );

    let recruited = 0;
    for (const p of candidates) {
      if (recruited >= neededTotal) break;
      p.isBackupUnit = true;
      p.state = 'responding';
      p.assignedIncidentId = undefined;
      recruited++;
    }

    // 2. If needed, dispatch tactical squad backup to arrive
    const needed = neededTotal - recruited;
    for (let i = 0; i < needed; i++) {
      const officerNames = ['Officer Miller', 'Officer Hayes', 'Officer Diaz', 'Officer Kowalski', 'Sergeant Vance'];
      const name = officerNames[(this.ai.policeNPCs.length + i) % officerNames.length];
      const badge = `${210 + this.ai.policeNPCs.length * 7}`;

      const spawnAngle = this.playerYaw + Math.PI + (i === 0 ? -0.4 : i === 1 ? 0.4 : 0.0);
      const spawnX = this.playerPos.x + Math.sin(spawnAngle) * 14;
      const spawnZ = this.playerPos.z + Math.cos(spawnAngle) * 14;

      // When Police Trust is high (>= 70), dispatch sends heavy SWAT support; otherwise standard patrol
      const role = policeTrust >= 70 && (i === 0 || i === 2) ? 'swat' : 'patrol';
      const rig = createCharacterMesh('police_npc', role === 'swat' ? 'swat' : 'default', name);
      this.scene.add(rig.root);

      const newOfficer = this.ai.spawnPoliceNPC(
        new THREE.Vector3(spawnX, 0, spawnZ),
        rig,
        name,
        badge,
        role
      );
      newOfficer.isBackupUnit = true;
      newOfficer.state = 'responding';
      const squadSlot = recruited + i;
      const offsetAngle = this.playerYaw + (squadSlot === 0 ? -Math.PI * 0.75 : squadSlot === 1 ? Math.PI * 0.75 : Math.PI);
      newOfficer.squadOffset = {
        x: Math.sin(offsetAngle) * 3.5,
        z: Math.cos(offsetAngle) * 3.5,
      };
    }

    setTimeout(() => {
      this.onNotification?.('DISPATCH 10-4: Patrol backup arrived on scene! Holding tactical formation with Carter.', 'success');
      soundEngine.playRadioChime();
    }, 1000);
  }

  /**
   * Toggle tactical flashlight
   */
  public toggleFlashlight(): boolean {
    this.isFlashlightActive = !this.isFlashlightActive;
    this.stats.flashlightOn = this.isFlashlightActive;
    this.onNotification?.(
      this.isFlashlightActive ? 'Tactical Flashlight ON' : 'Tactical Flashlight OFF',
      'info'
    );
    return this.isFlashlightActive;
  }

  /**
   * Returns civilian if within talk distance
   */
  public checkCivilianNearby(): CivilianEntity | null {
    for (const civ of this.ai.civilians) {
      const dist = this.playerPos.distanceTo(new THREE.Vector3(civ.position.x, 0, civ.position.z));
      if (dist < 3.2) {
        return civ;
      }
    }
    return null;
  }

  /**
   * Returns nearby Aegis Taskforce military soldier if within talk distance
   */
  public checkMilitaryNearby(): MilitaryNPCEntity | null {
    for (const soldier of this.ai.militarySoldiers) {
      const dist = this.playerPos.distanceTo(new THREE.Vector3(soldier.position.x, 0, soldier.position.z));
      if (dist < 3.8) {
        return soldier;
      }
    }
    return null;
  }

  /**
   * Returns arrested or surrendered suspect if within interrogation/frisk distance
   */
  public checkArrestedSuspectNearby(): EnemyEntity | null {
    for (const e of this.ai.enemies) {
      if (e.state === 'arrested' || e.state === 'surrendered') {
        const dist = this.playerPos.distanceTo(new THREE.Vector3(e.position.x, 0, e.position.z));
        if (dist < 3.5) {
          return e;
        }
      }
    }
    return null;
  }

  /**
   * Returns nearby captive hostage if within rescue distance
   */
  public checkHostageNearbyToRescue(): CivilianEntity | null {
    for (const h of this.missionHostages) {
      if ((h as any).isRescued || ((h as any).health !== undefined && (h as any).health <= 0)) continue;
      const dist = Math.hypot(this.playerPos.x - h.position.x, this.playerPos.z - h.position.z);
      if (dist < 4.2) {
        return h;
      }
    }
    return null;
  }

  /**
   * Rescues captive civilian hostage and unties them
   */
  public rescueHostage(): boolean {
    const hostage = this.checkHostageNearbyToRescue();
    if (!hostage) return false;

    (hostage as any).isRescued = true;
    (hostage as any).isCaptive = false;
    hostage.state = 'walking';
    // Run towards safe perimeter
    hostage.targetPos = { x: 55, y: 0, z: -10 };
    hostage.speed = 4.5;

    soundEngine.playRadioChime();
    this.stats.civiliansRescued = (this.stats.civiliansRescued || 0) + 1;
    this.stats.xp += 300;
    this.stats.reputation = Math.min(100, (this.stats.reputation ?? 80) + 5);
    this.onStatsChanged?.(this.stats);
    this.onMissionObjectiveProgress?.('rescue', 1);

    this.addFloatingText('HOSTAGE EVACUATED! +300 XP', '#10b981', new THREE.Vector3(hostage.position.x, 1.8, hostage.position.z));
    this.onNotification?.(`Hostage ${hostage.name || 'Citizen'} untied and evacuated safely!`, 'success');
    return true;
  }

  /**
   * Returns closest evidence item if within forensic inspection distance
   */
  public checkEvidenceNearby<
    T extends { position: { x: number; y: number; z: number }; id: string; title: string; collected: boolean; photoTaken?: boolean }
  >(evidenceList: T[]): T | null {
    for (const ev of evidenceList) {
      const dist = this.playerPos.distanceTo(new THREE.Vector3(ev.position.x, 0, ev.position.z));
      if (dist < 3.8) {
        return ev;
      }
    }
    return null;
  }

  public startReload() {
    const w = this.weapons[this.activeWeaponIndex];
    if (!w) return;
    if (w.currentAmmo >= w.magazineSize) {
      this.onNotification?.(`${w.name} magazine is already full (${w.currentAmmo}/${w.magazineSize}).`, 'info');
      return;
    }
    if (w.reserveAmmo <= 0) {
      soundEngine.playGunshot('handgun'); // Dry click
      this.onNotification?.(`No reserve ammunition for ${w.name}! Requisition ammo in Arsenal.`, 'alert');
      return;
    }

    this.isReloading = true;
    this.reloadTimer = w.reloadTime;
    soundEngine.playReload();
    this.onNotification?.(`Reloading ${w.name}...`, 'info');
  }

  private finishReload() {
    this.isReloading = false;
    const w = this.weapons[this.activeWeaponIndex];
    if (!w) return;

    const needed = w.magazineSize - w.currentAmmo;
    const toLoad = Math.min(needed, w.reserveAmmo);
    w.currentAmmo += toLoad;
    w.reserveAmmo -= toLoad;
    this.onWeaponChanged?.(w);
    this.onNotification?.(`${w.name} Reloaded! (${w.currentAmmo}/${w.reserveAmmo})`, 'info');
  }

  public switchNextWeapon() {
    let nextIdx = (this.activeWeaponIndex + 1) % this.weapons.length;
    while (!this.weapons[nextIdx].unlocked && nextIdx !== this.activeWeaponIndex) {
      nextIdx = (nextIdx + 1) % this.weapons.length;
    }
    this.activeWeaponIndex = nextIdx;
    this.isReloading = false;
    attachWeaponToRig(this.playerRig, this.weapons[this.activeWeaponIndex].category);
    this.onWeaponChanged?.(this.weapons[this.activeWeaponIndex]);
    this.onNotification?.(`Equipped: ${this.weapons[this.activeWeaponIndex].name}`, 'info');
  }

  public switchWeaponById(id: string) {
    const idx = this.weapons.findIndex((w) => w.id === id);
    if (idx >= 0 && this.weapons[idx].unlocked) {
      this.activeWeaponIndex = idx;
      this.isReloading = false;
      attachWeaponToRig(this.playerRig, this.weapons[this.activeWeaponIndex].category);
      this.onWeaponChanged?.(this.weapons[idx]);
    }
  }

  private addBulletTracer(start: THREE.Vector3, end: THREE.Vector3, color: number) {
    this.bulletTracers.push({
      start,
      end,
      life: 0.08,
      maxLife: 0.08,
      color,
    });
  }

  private updateBulletTracers(delta: number) {
    const pos = this.tracerPositions;
    const col = this.tracerColors;

    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tr = this.bulletTracers[i];
      tr.life -= delta;
      if (tr.life <= 0) {
        this.bulletTracers.splice(i, 1);
      }
    }

    let pIdx = 0;
    const cObj = new THREE.Color();
    for (let i = 0; i < Math.min(this.bulletTracers.length, 50); i++) {
      const tr = this.bulletTracers[i];
      cObj.setHex(tr.color);

      pos[pIdx] = tr.start.x;
      pos[pIdx + 1] = tr.start.y;
      pos[pIdx + 2] = tr.start.z;

      col[pIdx] = cObj.r;
      col[pIdx + 1] = cObj.g;
      col[pIdx + 2] = cObj.b;

      pIdx += 3;

      pos[pIdx] = tr.end.x;
      pos[pIdx + 1] = tr.end.y;
      pos[pIdx + 2] = tr.end.z;

      col[pIdx] = cObj.r;
      col[pIdx + 1] = cObj.g;
      col[pIdx + 2] = cObj.b;

      pIdx += 3;
    }

    for (let i = pIdx; i < pos.length; i++) {
      pos[i] = 0;
      col[i] = 0;
    }

    this.tracerLineMesh.geometry.attributes.position.needsUpdate = true;
    this.tracerLineMesh.geometry.attributes.color.needsUpdate = true;
  }

  public addFloatingText(text: string, color: string, pos: { x: number; y: number; z: number }) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      color,
      pos: { x: pos.x, y: (pos.y || 1.0) + 1.2, z: pos.z },
      life: 1.5,
    });
  }

  private updateFloatingTexts(delta: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.pos.y += delta * 0.8;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public checkPlayerCollisionWithMargin(x: number, z: number, radius = 0.55): boolean {
    const boxes = this.activeInterior ? this.activeInterior.collisionBoxes : this.collisionBoxes;
    for (const b of boxes) {
      if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
        return true;
      }
    }
    return false;
  }

  private checkPlayerCollision(x: number, z: number): boolean {
    if (this.checkPlayerCollisionWithMargin(x, z, 0.55)) {
      return true;
    }

    // When on foot in outside city, prevent player from phasing through vehicle bodies
    if (!this.activeInterior) {
      for (const v of this.vehicles) {
        if (v.entity.isOccupiedByPlayer) continue;
        const dist = Math.hypot(x - v.entity.position.x, z - v.entity.position.z);
        if (dist < 1.7) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Exact 2D Separating Axis Theorem (SAT) collision test between an Oriented Bounding Box (OBB)
   * representing a vehicle (length ~4.8m, width ~2.2m) and an Axis-Aligned Bounding Box (AABB)
   * representing a building, wall, fence, or street prop.
   * Tests all 4 separating axes (2 AABB axes + 2 OBB axes) plus 8 perimeter sample points.
   * Guarantees zero penetration at any vehicle rotation angle.
   */
  public testVehicleBoxCollision(
    vx: number,
    vz: number,
    rotation: number,
    b: CollisionBox,
    halfWidth = 1.15,
    halfLength = 2.45
  ): boolean {
    // 1. Broadphase bounding circle rejection
    const maxExtent = halfLength + 0.35;
    if (
      vx + maxExtent < b.minX ||
      vx - maxExtent > b.maxX ||
      vz + maxExtent < b.minZ ||
      vz - maxExtent > b.maxZ
    ) {
      return false;
    }

    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    const boxCenterX = (b.minX + b.maxX) * 0.5;
    const boxCenterZ = (b.minZ + b.maxZ) * 0.5;
    const boxHalfW = (b.maxX - b.minX) * 0.5;
    const boxHalfD = (b.maxZ - b.minZ) * 0.5;

    const dx = vx - boxCenterX;
    const dz = vz - boxCenterZ;

    // Axis 1: World X-axis (AABB normal 1)
    const rX = halfWidth * Math.abs(cosR) + halfLength * Math.abs(sinR);
    if (Math.abs(dx) > boxHalfW + rX) return false;

    // Axis 2: World Z-axis (AABB normal 2)
    const rZ = halfWidth * Math.abs(-sinR) + halfLength * Math.abs(cosR);
    if (Math.abs(dz) > boxHalfD + rZ) return false;

    // Axis 3: Vehicle Local X-axis (lateral width unit vector: cosR, -sinR)
    const dist3 = Math.abs(dx * cosR - dz * sinR);
    const rBox3 = boxHalfW * Math.abs(cosR) + boxHalfD * Math.abs(-sinR);
    if (dist3 > halfWidth + rBox3) return false;

    // Axis 4: Vehicle Local Z-axis (longitudinal length unit vector: sinR, cosR)
    const dist4 = Math.abs(dx * sinR + dz * cosR);
    const rBox4 = boxHalfW * Math.abs(sinR) + boxHalfD * Math.abs(cosR);
    if (dist4 > halfLength + rBox4) return false;

    // All 4 axes overlap -> exact intersection detected!
    return true;
  }

  /**
   * Tests whether a vehicle at (x, z) with given rotation intersects any building,
   * fence, barrier, or world boundary.
   */
  public testVehicleBuildingCollisions(
    x: number,
    z: number,
    rotation: number,
    halfWidth = 1.15,
    halfLength = 2.45
  ): boolean {
    const boxes = this.activeInterior ? this.activeInterior.collisionBoxes : this.collisionBoxes;
    for (const b of boxes) {
      if (this.testVehicleBoxCollision(x, z, rotation, b, halfWidth, halfLength)) {
        return true;
      }
    }
    return Math.abs(x) > 136 || Math.abs(z) > 136;
  }

  /**
   * Comprehensive vehicle collision test against:
   * 1. Static building/wall/prop geometry via SAT
   * 2. World map boundaries
   * 3. Other vehicles (traffic, pursuit, criminal, and parked vehicles)
   */
  public checkVehicleCollision(
    x: number,
    z: number,
    rotation: number,
    ignoreVehicleIdx: number = -1
  ): boolean {
    // 1. Static building, wall & prop collision
    if (this.testVehicleBuildingCollisions(x, z, rotation)) {
      return true;
    }

    // 2. Other vehicles collision
    const sinR = Math.sin(rotation);
    const cosR = Math.cos(rotation);

    for (let i = 0; i < this.vehicles.length; i++) {
      if (i === ignoreVehicleIdx) continue;
      const other = this.vehicles[i];
      const otherPos = other.entity.position;
      const dist = Math.hypot(x - otherPos.x, z - otherPos.z);
      if (dist > 5.8) continue; // Broadphase check

      // Center disc collision
      if (dist < 3.2) {
        return true;
      }

      // Check bumper disc overlaps
      const otherSin = Math.sin(other.entity.rotation);
      const otherCos = Math.cos(other.entity.rotation);
      const myFront = { x: x + sinR * 1.6, z: z + cosR * 1.6 };
      const myRear = { x: x - sinR * 1.6, z: z - cosR * 1.6 };
      const otherFront = { x: otherPos.x + otherSin * 1.6, z: otherPos.z + otherCos * 1.6 };
      const otherRear = { x: otherPos.x - otherSin * 1.6, z: otherPos.z - otherCos * 1.6 };

      const minBumperDist = 2.25;
      if (
        Math.hypot(myFront.x - otherFront.x, myFront.z - otherFront.z) < minBumperDist ||
        Math.hypot(myFront.x - otherRear.x, myFront.z - otherRear.z) < minBumperDist ||
        Math.hypot(myRear.x - otherFront.x, myRear.z - otherFront.z) < minBumperDist ||
        Math.hypot(myRear.x - otherRear.x, myRear.z - otherRear.z) < minBumperDist
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolves vehicle-to-vehicle overlap and prevents interpenetration.
   * Pushes vehicles apart along their separation vector so they never stay stuck or merged.
   */
  public resolveVehicleToVehicleCollisions(playerVeh: { entity: VehicleEntity; rig: VehicleRig }) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const other = this.vehicles[i];
      if (other === playerVeh) continue;

      const dx = playerVeh.entity.position.x - other.entity.position.x;
      const dz = playerVeh.entity.position.z - other.entity.position.z;
      const dist = Math.hypot(dx, dz);
      const minDistance = 3.35;

      if (dist < minDistance && dist > 0.001) {
        const overlap = minDistance - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push vehicles apart along separation vector
        const pushX = nx * overlap * 0.55;
        const pushZ = nz * overlap * 0.55;

        const newPx = playerVeh.entity.position.x + pushX;
        const newPz = playerVeh.entity.position.z + pushZ;
        const canPlayerMove = !this.testVehicleBuildingCollisions(newPx, newPz, playerVeh.entity.rotation);

        const newOx = other.entity.position.x - pushX;
        const newOz = other.entity.position.z - pushZ;
        const canOtherMove = !this.testVehicleBuildingCollisions(newOx, newOz, other.entity.rotation);

        if (canPlayerMove && canOtherMove) {
          playerVeh.entity.position.x = newPx;
          playerVeh.entity.position.z = newPz;
          other.entity.position.x = newOx;
          other.entity.position.z = newOz;
        } else if (canPlayerMove && !canOtherMove) {
          // Other vehicle is pinned against a wall; push player car away
          const altPx = playerVeh.entity.position.x + nx * overlap * 0.95;
          const altPz = playerVeh.entity.position.z + nz * overlap * 0.95;
          if (!this.testVehicleBuildingCollisions(altPx, altPz, playerVeh.entity.rotation)) {
            playerVeh.entity.position.x = altPx;
            playerVeh.entity.position.z = altPz;
          }
        } else if (!canPlayerMove && canOtherMove) {
          // Player car is pinned against a wall; push other vehicle away
          const altOx = other.entity.position.x - nx * overlap * 0.95;
          const altOz = other.entity.position.z - nz * overlap * 0.95;
          if (!this.testVehicleBuildingCollisions(altOx, altOz, other.entity.rotation)) {
            other.entity.position.x = altOx;
            other.entity.position.z = altOz;
          }
        }

        other.rig.root.position.set(other.entity.position.x, 0, other.entity.position.z);
        playerVeh.rig.root.position.set(playerVeh.entity.position.x, 0, playerVeh.entity.position.z);

        // Speed impulse exchange & kinetic dampening
        if (Math.abs(playerVeh.entity.speed) > 1.0) {
          other.entity.speed = playerVeh.entity.speed * 0.45;
          playerVeh.entity.speed *= 0.35;
        }
      }
    }
  }

  /**
   * Anti-trapping de-penetration: if a vehicle overlaps a solid building box,
   * push it out along the minimum penetration axis so it never stays trapped inside.
   */
  public resolveVehicleBuildingPenetration(v: { entity: VehicleEntity; rig: VehicleRig }) {
    const boxes = this.activeInterior ? this.activeInterior.collisionBoxes : this.collisionBoxes;
    const halfWidth = 1.15;
    const halfLength = 2.45;
    const cosR = Math.cos(v.entity.rotation);
    const sinR = Math.sin(v.entity.rotation);
    const extentX = halfWidth * Math.abs(cosR) + halfLength * Math.abs(sinR);
    const extentZ = halfWidth * Math.abs(-sinR) + halfLength * Math.abs(cosR);

    for (const b of boxes) {
      if (this.testVehicleBoxCollision(v.entity.position.x, v.entity.position.z, v.entity.rotation, b, halfWidth, halfLength)) {
        const boxCenterX = (b.minX + b.maxX) * 0.5;
        const boxCenterZ = (b.minZ + b.maxZ) * 0.5;
        const boxHalfW = (b.maxX - b.minX) * 0.5;
        const boxHalfD = (b.maxZ - b.minZ) * 0.5;

        const toCenterX = v.entity.position.x - boxCenterX;
        const toCenterZ = v.entity.position.z - boxCenterZ;

        const penX = boxHalfW + extentX - Math.abs(toCenterX);
        const penZ = boxHalfD + extentZ - Math.abs(toCenterZ);

        if (penX > 0 && penZ > 0) {
          if (penX < penZ) {
            v.entity.position.x += (toCenterX >= 0 ? penX : -penX) + (toCenterX >= 0 ? 0.08 : -0.08);
          } else {
            v.entity.position.z += (toCenterZ >= 0 ? penZ : -penZ) + (toCenterZ >= 0 ? 0.08 : -0.08);
          }
          v.rig.root.position.set(v.entity.position.x, 0, v.entity.position.z);
          v.entity.speed = 0;
        }
      }
    }
  }

  /**
   * Anti-stuck safety de-penetration for on-foot player:
   * If Carter is ever slightly inside a wall, prop, or vehicle after collision/exit,
   * push Carter out along the shallowest axis so normal walking controls are instantly restored.
   */
  public resolvePlayerPenetration() {
    const boxes = this.activeInterior ? this.activeInterior.collisionBoxes : this.collisionBoxes;
    const playerRadius = 0.52;

    for (const b of boxes) {
      if (
        this.playerPos.x + playerRadius > b.minX &&
        this.playerPos.x - playerRadius < b.maxX &&
        this.playerPos.z + playerRadius > b.minZ &&
        this.playerPos.z - playerRadius < b.maxZ
      ) {
        const boxCenterX = (b.minX + b.maxX) * 0.5;
        const boxCenterZ = (b.minZ + b.maxZ) * 0.5;
        const halfW = (b.maxX - b.minX) * 0.5;
        const halfD = (b.maxZ - b.minZ) * 0.5;

        const toCenterX = this.playerPos.x - boxCenterX;
        const toCenterZ = this.playerPos.z - boxCenterZ;

        const penX = halfW + playerRadius - Math.abs(toCenterX);
        const penZ = halfD + playerRadius - Math.abs(toCenterZ);

        if (penX > 0 && penZ > 0) {
          if (penX < penZ) {
            this.playerPos.x += (toCenterX >= 0 ? penX : -penX) + (toCenterX >= 0 ? 0.06 : -0.06);
          } else {
            this.playerPos.z += (toCenterZ >= 0 ? penZ : -penZ) + (toCenterZ >= 0 ? 0.06 : -0.06);
          }
          this.playerRig.root.position.copy(this.playerPos);
        }
      }
    }

    // Also de-penetrate from vehicle bodies when on foot outside
    if (!this.activeInterior) {
      for (const v of this.vehicles) {
        if (v.entity.isOccupiedByPlayer) continue;
        const dx = this.playerPos.x - v.entity.position.x;
        const dz = this.playerPos.z - v.entity.position.z;
        const dist = Math.hypot(dx, dz);
        const minDist = 2.1;
        if (dist < minDist && dist > 0.001) {
          const push = minDist - dist + 0.06;
          this.playerPos.x += (dx / dist) * push;
          this.playerPos.z += (dz / dist) * push;
          this.playerRig.root.position.copy(this.playerPos);
        }
      }
    }
  }

  public initCameraPosition() {
    const camOffsetY = this.isCrouching ? 1.25 : 1.65;
    const shoulderOffset = this.isAiming ? 0.52 : 0.0;
    const sinY = Math.sin(this.playerYaw);
    const cosY = Math.cos(this.playerYaw);

    const forwardX = sinY * Math.cos(this.cameraPitch);
    const forwardY = -Math.sin(this.cameraPitch);
    const forwardZ = cosY * Math.cos(this.cameraPitch);

    const pivotX = this.playerPos.x + cosY * shoulderOffset;
    const pivotY = this.playerPos.y + camOffsetY;
    const pivotZ = this.playerPos.z - sinY * shoulderOffset;

    const camX = pivotX - forwardX * this.cameraDistance;
    const camY = Math.max(getGroundElevation(camX, pivotZ) + 0.35, pivotY - forwardY * this.cameraDistance);
    const camZ = pivotZ - forwardZ * this.cameraDistance;

    this.camera.position.set(camX, camY, camZ);
    this.cameraLookAt.set(
      pivotX + forwardX * 40,
      pivotY + forwardY * 40,
      pivotZ + forwardZ * 40
    );
    this.camera.lookAt(this.cameraLookAt);
    this.isCameraInitialized = true;
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onResize);
    if (this.activeInterior) {
      this.scene.remove(this.activeInterior.interiorGroup);
      this.activeInterior = null;
    }
    cityIncidentManager.onRadioBroadcast = undefined;
    cityIncidentManager.onIncidentStateChange = undefined;
    cityIncidentManager.reset();
    soundEngine.stopSiren();
    soundEngine.stopEngine();
    this.timer.dispose();
    this.renderer.dispose();
  }
}
