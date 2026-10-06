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
} from '../../types/game';
import { generateCityDistrict, CityBuildResult, CollisionBox, getGroundElevation } from './CityGenerator';
import { createCharacterMesh, updateCharacterAnimation, CharacterRig, attachWeaponToRig } from './CharacterModels';
import { createVehicleMesh, updateVehicleAnimation, VehicleRig } from './VehicleModels';
import { AIController } from '../ai/AIController';
import { PEDESTRIAN_CONFIGS } from '../ai/PedestrianSystem';
import { soundEngine } from '../audio/SoundEffects';
import { cityIncidentManager } from '../systems/DynamicEventsSystem';
import { authoritativeEncounterManager } from '../systems/EncounterManager';
import { DynamicEvent } from '../../types/game';

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
  private recentGunshotTimer: number = 0;

  // Bullets & FX
  private bulletTracers: BulletTracer[] = [];
  private tracerLineMesh: THREE.LineSegments;
  private tracerPositions: Float32Array;
  private tracerColors: Float32Array;
  public floatingTexts: FloatingText[] = [];

  // Callbacks for UI sync
  public onStatsChanged?: (stats: PlayerStats) => void;
  public onWeaponChanged?: (weapon: WeaponConfig) => void;
  public onNotification?: (text: string, type: 'info' | 'alert' | 'success') => void;
  public onMissionObjectiveProgress?: (type: string, amount: number) => void;
  public onIncidentResolved?: (inc: DynamicEvent) => void;

  // Dynamic City Incidents & Tactical Visuals
  public incidentVisualsGroup: THREE.Group;
  private incidentPropsMap: Map<string, THREE.Group> = new Map();
  private incidentSpawnedActors: Set<string> = new Set();
  private incidentFlames: { mesh: THREE.Mesh; baseScale: number; speed: number; offset: number }[] = [];
  private incidentSmokeRings: { mesh: THREE.Mesh; startY: number; speed: number; offset: number }[] = [];
  private incidentEmergencyBeacons: { light: THREE.PointLight; speed: number; color1: number; color2: number }[] = [];

  // State
  public stats: PlayerStats;
  public weapons: WeaponConfig[];
  public activeWeaponIndex: number = 0;
  private shootCooldownTimer: number = 0;
  private timer: THREE.Timer = new THREE.Timer();

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

      const isBoss = mission.id === 'ch5_viper_showdown';
      const isSyndicate = mission.id === 'ch4_bank_hostage';
      const isCedar = mission.id === 'ch2_cedar_defense';

      let configs: { name: string; type: 'thug' | 'enforcer' | 'syndicate_operative' | 'boss'; pos: THREE.Vector3; faction?: any }[] = [];

      if (isBoss) {
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
        const rig = createCharacterMesh(c.type, 'default', c.name, c.faction);
        this.scene.add(rig.root);
        const enemy = this.ai.spawnEnemy(c.type, c.pos, rig, c.name, c.faction);
        enemy.alertLevel = 100;
        this.missionEnemies.push(enemy);
        enc.spawnedEnemyIds.push(enemy.id);
      });

      // Spawn civilian hostages for hostage rescue missions
      if (isHostage) {
        const hostageRig = createCharacterMesh('civilian', 'default', 'Hostage Citizen');
        this.scene.add(hostageRig.root);
        const hCiv = this.ai.spawnCivilian(new THREE.Vector3(this.waypointPos.x - 1.5, 0, this.waypointPos.z + 0.5), hostageRig, { name: 'Hostage Citizen' });
        hCiv.state = 'panicking';
        hCiv.panicTimer = 120;
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

    // 3. Vehicle Entry / Exit trigger
    if (inputs.enterVehicle) {
      inputs.enterVehicle = false;
      this.toggleVehicleEnterExit();
    }

    // 4. Update AI (Criminals, Police NPCs and Civilians)
    if (this.recentGunshotTimer > 0) {
      this.recentGunshotTimer -= delta;
    }
    const gunshotFired = this.recentGunshotTimer > 0;

    this.ai.update(
      delta,
      time,
      this.playerPos,
      (enemy, targetPos) => {
        this.enemyFireBullet(enemy, targetPos);
      },
      this.collisionBoxes,
      this.camera,
      gunshotFired,
      this.vehicles,
      this.isAiming
    );

    // 4B. Update City Incident Simulation & 3D Incident Visuals
    cityIncidentManager.update(delta);
    this.updateDynamicIncidentVisuals(delta, time);
    this.checkPlayerNearDynamicIncidents();

    // 5. Update Waypoint Animation & Distance Check
    if (this.isWaypointActive) {
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

    // 6. Update Dynamic Civilian Road Traffic
    this.updateCivilianTraffic(delta, time);

    // 7. Update Criminal vehicle AI in Chase Mode / Active Pursuit
    if (this.activePursuitVehicle && this.activePursuitVehicle.entity.health > 0) {
      this.updateActivePursuitVehicle(delta, time);
    } else {
      this.updateCriminalChaseAI(delta, time);
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
   * Checks player interaction with active dynamic incidents (extinguishing fires, resolving scenes, spawning actors)
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

      // Player resolving peaceful scene or emergency disaster
      if (dist < 14) {
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
        } else if (inc.type === 'accident' || inc.type === 'civilian_emergency') {
          soundEngine.playRadioChime();
          cityIncidentManager.resolveIncidentByPlayer(inc.id);
          this.stats.xp += inc.rewardXP;
          this.stats.money += inc.rewardMoney;
          this.stats.reputation = Math.min(100, this.stats.reputation + 8);
          this.stats.civiliansRescued += 1;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.(`Accident Cleared & Civilians Aided! +$${inc.rewardMoney} (+8 Rep)`, 'success');
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
      if (this.incidentSpawnedActors.has(inc.id) && (inc.type === 'robbery' || inc.type === 'hostage' || inc.type === 'gang_war' || inc.type === 'prison_break' || inc.type === 'disturbance' || inc.type === 'pursuit')) {
        const encounterEnemies = this.ai.enemies.filter((e) => inc.spawnedEnemyIds?.includes(e.id));
        if (encounterEnemies.length > 0 && encounterEnemies.every((e) => e.state === 'dead' || e.state === 'arrested')) {
          this.resolveCombatIncident(inc, encounterEnemies);
          break;
        }
      }
    }
  }

  public resolveCombatIncident(inc: DynamicEvent, encounterEnemies: EnemyEntity[]) {
    if (inc.status === 'resolved' || inc.status === 'completed') return;
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

    if (inc.type === 'gang_war') {
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
    } else if (inc.type === 'accident' || inc.type === 'civilian_emergency') {
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

    // Jump & Vertical Gravity Physics with accurate ground elevation (sidewalk vs road)
    const groundY = getGroundElevation(this.playerPos.x, this.playerPos.z);
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

    // Update Camera (Spring-arm 3rd person)
    const targetCamDist = this.isAiming ? 2.4 : 4.8;
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, targetCamDist, delta * 12);

    const camOffsetY = this.isCrouching ? 1.3 : 1.85;
    const shoulderOffset = this.isAiming ? 0.65 : 0.0;

    const sinY = Math.sin(this.playerYaw);
    const cosY = Math.cos(this.playerYaw);

    let camX = this.playerPos.x - sinY * this.cameraDistance * Math.cos(this.cameraPitch) + cosY * shoulderOffset;
    let camY = this.playerPos.y + camOffsetY + Math.sin(this.cameraPitch) * this.cameraDistance;
    let camZ = this.playerPos.z - cosY * this.cameraDistance * Math.cos(this.cameraPitch) - sinY * shoulderOffset;

    // Apply realistic weapon recoil camera shake
    if (this.cameraShakeAmount > 0.001) {
      camX += (Math.random() - 0.5) * this.cameraShakeAmount;
      camY += (Math.random() - 0.5) * this.cameraShakeAmount;
      camZ += (Math.random() - 0.5) * this.cameraShakeAmount;
      this.cameraShakeAmount = THREE.MathUtils.lerp(this.cameraShakeAmount, 0, delta * 12);
    }

    const targetCamPos = new THREE.Vector3(camX, camY, camZ);
    // Focus camera at torso/chest level with natural look-ahead down street, keeping character well above bottom controls
    const targetLookAt = new THREE.Vector3(
      this.playerPos.x + sinY * 1.8 + cosY * shoulderOffset,
      this.playerPos.y + (this.isCrouching ? 0.95 : 1.25),
      this.playerPos.z + cosY * 1.8 - sinY * shoulderOffset
    );

    if (!this.isCameraInitialized) {
      this.camera.position.copy(targetCamPos);
      this.cameraLookAt.copy(targetLookAt);
      this.camera.lookAt(this.cameraLookAt);
      this.isCameraInitialized = true;
    } else {
      // Polished spring-arm follow: high responsiveness when aiming, smooth cinematic weight on motion
      const camLerp = Math.min(1.0, delta * (this.isAiming ? 18 : 10.5));
      const lookLerp = Math.min(1.0, delta * (this.isAiming ? 20 : 13));
      this.camera.position.lerp(targetCamPos, camLerp);
      this.cameraLookAt.lerp(targetLookAt, lookLerp);
      this.camera.lookAt(this.cameraLookAt);
    }
  }

  private updateVehicleMode(delta: number, time: number, inputs: InputState) {
    const v = this.vehicles[this.currentVehicleIndex];
    if (!v) return;

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
    const accelInput = inputs.moveForward; // 1 = forward, -1 = reverse
    const steerInput = inputs.moveRight; // 1 = right, -1 = left

    // Acceleration & Braking
    if (accelInput > 0) {
      v.entity.speed = Math.min(v.entity.maxSpeed, v.entity.speed + v.entity.acceleration * delta);
    } else if (accelInput < 0) {
      v.entity.speed = Math.max(-10, v.entity.speed - v.entity.acceleration * 1.2 * delta);
    } else {
      v.entity.speed = THREE.MathUtils.lerp(v.entity.speed, 0, delta * 1.5);
    }

    // Handbrake
    if (inputs.handbrake) {
      v.entity.speed = THREE.MathUtils.lerp(v.entity.speed, 0, delta * 4.5);
      soundEngine.playTireScreech();
    }

    // Steering
    const maxSteer = 0.48;
    v.entity.steering = THREE.MathUtils.lerp(v.entity.steering, steerInput * maxSteer, delta * 8);

    // Apply yaw rotation when moving
    if (Math.abs(v.entity.speed) > 0.1) {
      const steerFactor = (v.entity.speed / v.entity.maxSpeed) * (v.entity.speed >= 0 ? 1 : -1);
      v.entity.rotation -= v.entity.steering * steerFactor * 2.2 * delta;
    }

    // Calculate motion vector
    const nextVx = v.entity.position.x + Math.sin(v.entity.rotation) * v.entity.speed * delta;
    const nextVz = v.entity.position.z + Math.cos(v.entity.rotation) * v.entity.speed * delta;

    // Collision check
    if (!this.checkVehicleCollision(nextVx, v.entity.position.z, 2.0)) {
      v.entity.position.x = nextVx;
    } else {
      v.entity.speed *= -0.3;
      soundEngine.playExplosion();
    }

    if (!this.checkVehicleCollision(v.entity.position.x, nextVz, 2.0)) {
      v.entity.position.z = nextVz;
    } else {
      v.entity.speed *= -0.3;
      soundEngine.playExplosion();
    }

    v.rig.root.position.set(v.entity.position.x, 0, v.entity.position.z);
    v.rig.root.rotation.y = v.entity.rotation;

    updateVehicleAnimation(v.rig, v.entity.speed, v.entity.steering, time, v.entity.isSirenOn);
    soundEngine.updateEnginePitch(Math.abs(v.entity.speed) / v.entity.maxSpeed);

    this.playerPos.set(v.entity.position.x, 0, v.entity.position.z);
    this.playerRig.root.position.copy(this.playerPos);

    this.checkVehicleRamming(v);

    const camFollowDist = 8.2;
    const camHeight = 3.6;
    const camX = v.entity.position.x - Math.sin(v.entity.rotation) * camFollowDist;
    const camY = camHeight;
    const camZ = v.entity.position.z - Math.cos(v.entity.rotation) * camFollowDist;

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 8);
    this.camera.lookAt(
      v.entity.position.x + Math.sin(v.entity.rotation) * 3.2,
      1.4,
      v.entity.position.z + Math.cos(v.entity.rotation) * 3.2
    );
  }

  private toggleVehicleEnterExit() {
    if (this.currentVehicleIndex >= 0) {
      const v = this.vehicles[this.currentVehicleIndex];
      v.entity.isOccupiedByPlayer = false;
      this.currentVehicleIndex = -1;
      this.playerRig.root.visible = true;
      this.playerPos.x += Math.cos(v.entity.rotation) * 2.2;
      this.playerPos.z -= Math.sin(v.entity.rotation) * 2.2;
      this.playerRig.root.position.copy(this.playerPos);
      soundEngine.stopEngine();
      soundEngine.stopSiren();
      this.onNotification?.('Exited Vehicle', 'info');
    } else {
      let closestIdx = -1;
      let closestDist = 4.0;

      for (let i = 0; i < this.vehicles.length; i++) {
        const dist = this.playerPos.distanceTo(
          new THREE.Vector3(this.vehicles[i].entity.position.x, 0, this.vehicles[i].entity.position.z)
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        this.currentVehicleIndex = closestIdx;
        const v = this.vehicles[closestIdx];
        v.entity.isOccupiedByPlayer = true;
        this.playerRig.root.visible = false;
        soundEngine.startEngine();
        this.onNotification?.(
          `Entered ${v.entity.type === 'police' ? 'Police Interceptor' : 'Vehicle'}`,
          'info'
        );
      }
    }
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

      // Move along designated street lane
      if (tc.lane === 'south') {
        tc.entity.position.z += tc.entity.speed * delta;
        tc.entity.rotation = 0;
        if (tc.entity.position.z > 140) tc.entity.position.z = -140;
      } else if (tc.lane === 'north') {
        tc.entity.position.z -= tc.entity.speed * delta;
        tc.entity.rotation = Math.PI;
        if (tc.entity.position.z < -140) tc.entity.position.z = 140;
      } else if (tc.lane === 'east') {
        tc.entity.position.x += tc.entity.speed * delta;
        tc.entity.rotation = Math.PI / 2;
        if (tc.entity.position.x > 140) tc.entity.position.x = -140;
      } else if (tc.lane === 'west') {
        tc.entity.position.x -= tc.entity.speed * delta;
        tc.entity.rotation = -Math.PI / 2;
        if (tc.entity.position.x < -140) tc.entity.position.x = 140;
      } else if (tc.lane === 'outer_south') {
        tc.entity.position.z += tc.entity.speed * delta;
        tc.entity.rotation = 0;
        if (tc.entity.position.z > 135) tc.entity.position.z = -135;
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

    pPos.x += Math.sin(pv.entity.rotation) * pv.entity.speed * delta;
    pPos.z += Math.cos(pv.entity.rotation) * pv.entity.speed * delta;

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

    crim.entity.position.x += Math.sin(crim.entity.rotation) * crim.entity.speed * delta;
    crim.entity.position.z += Math.cos(crim.entity.rotation) * crim.entity.speed * delta;

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

    // 1. Raycast against collision boxes (buildings, walls, crates) so bullets hit cover
    for (const b of this.collisionBoxes) {
      const box = new THREE.Box3(
        new THREE.Vector3(b.minX, 0, b.minZ),
        new THREE.Vector3(b.maxX, 5.0, b.maxZ)
      );
      const hitPoint = new THREE.Vector3();
      if (cameraRay.intersectBox(box, hitPoint)) {
        const d = cameraRay.origin.distanceTo(hitPoint);
        if (d > 1.2 && d < closestDist) {
          closestDist = d;
        }
      }
    }

    // 2. Raycast against vehicles (getaway cars, criminal cars)
    for (const v of this.vehicles) {
      if (v.entity.isOccupiedByPlayer || v.entity.health <= 0) continue;
      const vBox = new THREE.Box3(
        new THREE.Vector3(v.entity.position.x - 1.2, 0, v.entity.position.z - 2.2),
        new THREE.Vector3(v.entity.position.x + 1.2, 1.6, v.entity.position.z + 2.2)
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

      const basePos = new THREE.Vector3(e.position.x, 0, e.position.z);
      const eCenter = new THREE.Vector3(e.position.x, 1.15, e.position.z);
      const toCenter = eCenter.clone().sub(cameraRay.origin);
      const proj = toCenter.dot(cameraRay.direction);

      if (proj > 1.0 && proj < closestDist) {
        const rayPoint = cameraRay.origin.clone().add(cameraRay.direction.clone().multiplyScalar(proj));
        const height = rayPoint.y;
        if (height >= 0 && height <= 1.95) {
          const horizDist = Math.hypot(rayPoint.x - basePos.x, rayPoint.z - basePos.z);
          if (horizDist < 0.72) {
            closestDist = proj;
            hitEnemy = e;
            isHeadshot = height > 1.48;
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
    this.playerRig.recoilTimer = 0.14;
    if (this.playerRig.muzzleLight) {
      this.playerRig.muzzleLight.intensity = 2.8;
    }
    const recoilKick = w.damage > 40 ? 0.038 : 0.022;
    this.cameraPitch = Math.max(-0.6, this.cameraPitch - recoilKick);
    this.targetRecoilPitch = recoilKick;
    this.cameraShakeAmount = Math.min(0.24, this.cameraShakeAmount + (w.damage > 40 ? 0.14 : 0.06));

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
          this.stats.wantedLevel = Math.min(5, this.stats.wantedLevel + 1);
          this.stats.wantedCooldown = 20;
          this.onStatsChanged?.(this.stats);
          this.onNotification?.('WARNING: Civilian in crossfire! Wanted level increased!', 'alert');
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

    dir.x += (Math.random() - 0.5) * 0.12;
    dir.z += (Math.random() - 0.5) * 0.12;

    const endPoint = origin.clone().add(dir.clone().multiplyScalar(35));
    this.addBulletTracer(origin, endPoint, 0xef4444);

    const toPlayer = this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
    const proj = toPlayer.dot(dir);

    if (proj > 0 && proj < 35) {
      const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
      const dist = closestPoint.distanceTo(this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)));

      if (dist < 0.8) {
        const rawDamage = enemy.weapon.damage;
        soundEngine.playHit(false);

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
        e.shootCooldown = 999999;
        e.alertLevel = 0;
        e.target = undefined;
        const rig = this.ai.enemyRigs[e.meshIndex];
        if (rig?.weaponMesh) {
          rig.weaponMesh.visible = false;
        }
        soundEngine.playArrest();
        this.stats.arrests++;
        this.stats.money += 200; // Bonus for non-lethal arrest!
        this.stats.xp += 180;
        this.stats.reputation = Math.min(100, this.stats.reputation + 5);
        this.onStatsChanged?.(this.stats);
        this.onMissionObjectiveProgress?.('arrest', 1);
        this.onMissionObjectiveProgress?.('kill', 1); // Also counts for neutralize objectives
        this.addFloatingText('+ $200 ARREST BONUS', '#22c55e', e.position);
        this.onNotification?.(`Suspect ${e.name} Handcuffed! +$200 Non-Lethal Reward (+5 Rep)`, 'success');
        this.checkEnemyIncidentResolution(e.id);
        arrestedAny = true;
        break;
      }
    }

    if (!arrestedAny) {
      this.onNotification?.('Order suspect to surrender [G] or confront weakened suspect to arrest.', 'info');
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
    for (const e of this.ai.enemies) {
      if (e.state === 'dead' || e.state === 'arrested' || e.state === 'surrendered') continue;
      const dist = this.playerPos.distanceTo(new THREE.Vector3(e.position.x, 0, e.position.z));

      // Thugs have high surrender rate when confronted, enforcers lower, boss never
      if (dist < 14.0 && e.type !== 'boss') {
        const surrenderChance = e.health < e.maxHealth * 0.7 ? 0.9 : 0.6;
        if (Math.random() < surrenderChance) {
          e.state = 'surrendered';
          e.shootCooldown = 999;
          e.alertLevel = 0;
          surrenderedCount++;
          this.addFloatingText('SURRENDERED!', '#facc15', e.position);
          this.onNotification?.(`Suspect ${e.name} has raised hands and surrendered!`, 'info');
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

    // Check currently active backup units
    const activeBackup = this.ai.policeNPCs.filter((p) => p.isBackupUnit && p.health > 0);

    if (activeBackup.length > 0) {
      this.onNotification?.('Officer Carter: "Squad, regroup on my mark! Stay sharp!"', 'info');
      activeBackup.forEach((p, idx) => {
        p.state = 'responding';
        const offsetAngle = this.playerYaw + (idx === 0 ? -Math.PI * 0.75 : Math.PI * 0.75);
        p.squadOffset = {
          x: Math.sin(offsetAngle) * 3.5,
          z: Math.cos(offsetAngle) * 3.5,
        };
      });
      return;
    }

    this.onNotification?.('Officer Carter: "10-78: Requesting immediate squad backup at my 20!"', 'alert');

    // 1. Convert nearby patrol officers if available within 80m
    const candidates = this.ai.policeNPCs.filter(
      (p) => !p.isBackupUnit && p.health > 0 && Math.hypot(p.position.x - this.playerPos.x, p.position.z - this.playerPos.z) < 80
    );

    let recruited = 0;
    for (const p of candidates) {
      p.isBackupUnit = true;
      p.state = 'responding';
      p.assignedIncidentId = undefined;
      const offsetAngle = this.playerYaw + (recruited === 0 ? -Math.PI * 0.75 : Math.PI * 0.75);
      p.squadOffset = {
        x: Math.sin(offsetAngle) * 3.5,
        z: Math.cos(offsetAngle) * 3.5,
      };
      recruited++;
      if (recruited >= 2) break;
    }

    // 2. If fewer than 2 nearby officers, dispatch tactical squad backup to arrive
    const needed = 2 - recruited;
    for (let i = 0; i < needed; i++) {
      const officerNames = ['Officer Miller', 'Officer Hayes', 'Officer Diaz', 'Officer Kowalski'];
      const name = officerNames[(this.ai.policeNPCs.length + i) % officerNames.length];
      const badge = `${210 + this.ai.policeNPCs.length * 7}`;

      const spawnAngle = this.playerYaw + Math.PI + (i === 0 ? -0.4 : 0.4);
      const spawnX = this.playerPos.x + Math.sin(spawnAngle) * 14;
      const spawnZ = this.playerPos.z + Math.cos(spawnAngle) * 14;

      const role = i === 0 ? 'patrol' : 'swat';
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
      const offsetAngle = this.playerYaw + (squadSlot === 0 ? -Math.PI * 0.75 : Math.PI * 0.75);
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
   * Returns closest evidence item if within forensic inspection distance
   */
  public checkEvidenceNearby(
    evidenceList: { position: { x: number; y: number; z: number }; id: string; title: string; collected: boolean; photoTaken?: boolean }[]
  ) {
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

  private checkPlayerCollision(x: number, z: number): boolean {
    const radius = 0.55;
    for (const b of this.collisionBoxes) {
      if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
        return true;
      }
    }
    return false;
  }

  private checkVehicleCollision(x: number, z: number, radius: number): boolean {
    for (const b of this.collisionBoxes) {
      if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
        return true;
      }
    }
    return false;
  }

  public initCameraPosition() {
    const camOffsetY = this.isCrouching ? 1.3 : 1.85;
    const shoulderOffset = this.isAiming ? 0.65 : 0.0;
    const sinY = Math.sin(this.playerYaw);
    const cosY = Math.cos(this.playerYaw);

    const camX = this.playerPos.x - sinY * this.cameraDistance * Math.cos(this.cameraPitch) + cosY * shoulderOffset;
    const camY = this.playerPos.y + camOffsetY + Math.sin(this.cameraPitch) * this.cameraDistance;
    const camZ = this.playerPos.z - cosY * this.cameraDistance * Math.cos(this.cameraPitch) - sinY * shoulderOffset;

    this.camera.position.set(camX, camY, camZ);
    this.cameraLookAt.set(
      this.playerPos.x + sinY * 1.8 + cosY * shoulderOffset,
      this.playerPos.y + (this.isCrouching ? 0.95 : 1.25),
      this.playerPos.z + cosY * 1.8 - sinY * shoulderOffset
    );
    this.camera.lookAt(this.cameraLookAt);
    this.isCameraInitialized = true;
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onResize);
    cityIncidentManager.onRadioBroadcast = undefined;
    cityIncidentManager.onIncidentStateChange = undefined;
    cityIncidentManager.reset();
    soundEngine.stopSiren();
    soundEngine.stopEngine();
    this.timer.dispose();
    this.renderer.dispose();
  }
}
