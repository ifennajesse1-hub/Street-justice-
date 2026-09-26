import * as THREE from 'three';
import {
  WeaponConfig,
  PlayerStats,
  VehicleEntity,
  EnemyEntity,
  CivilianEntity,
  PoliceNPCEntity,
  InputState,
  TimeOfDay,
  WeatherType,
} from '../../types/game';
import { generateCityDistrict, CityBuildResult, CollisionBox } from './CityGenerator';
import { createCharacterMesh, updateCharacterAnimation, CharacterRig } from './CharacterModels';
import { createVehicleMesh, updateVehicleAnimation, VehicleRig } from './VehicleModels';
import { AIController } from '../ai/AIController';
import { PEDESTRIAN_CONFIGS } from '../ai/PedestrianSystem';
import { soundEngine } from '../audio/SoundEffects';

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

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // City and collisions
  public cityData: CityBuildResult;
  public collisionBoxes: CollisionBox[] = [];

  // Characters
  public playerRig: CharacterRig;
  public playerPos: THREE.Vector3 = new THREE.Vector3();
  public playerVel: THREE.Vector3 = new THREE.Vector3();
  public playerYaw: number = 0;
  public cameraPitch: number = 0.22; // Radians
  public cameraDistance: number = 4.2;
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

  // Vehicles
  public vehicles: { entity: VehicleEntity; rig: VehicleRig }[] = [];
  public currentVehicleIndex: number = -1; // -1 = on foot

  // AI
  public ai: AIController;
  public encounterTriggered: boolean = false;

  // Lighting & Environment
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public isFlashlightActive: boolean = false;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  public evidenceGroup: THREE.Group;
  public timeOfDay: TimeOfDay = 'night';
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

  // State
  public stats: PlayerStats;
  public weapons: WeaponConfig[];
  public activeWeaponIndex: number = 0;
  private shootCooldownTimer: number = 0;
  private animationFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  constructor(
    container: HTMLElement,
    initialStats: PlayerStats,
    initialWeapons: WeaponConfig[]
  ) {
    this.container = container;
    this.stats = { ...initialStats };
    this.weapons = [...initialWeapons];

    // Scene & Atmosphere: Clear night sky with subtle atmospheric fog (0.005)
    // Ensures storefronts, signs, buildings and roads are crisply visible
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090e1a);
    this.scene.fog = new THREE.FogExp2(0x090e1a, 0.005);

    // Initial third-person orientation: Officer Carter looks straight down the road towards the commercial alleyway
    this.playerYaw = Math.PI;
    this.cameraPitch = 0.12;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 500);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Atmosphere Lighting: rich ambient sky hemisphere + directional moonlight
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(40, 80, 50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 180;
    this.dirLight.shadow.camera.left = -60;
    this.dirLight.shadow.camera.right = 60;
    this.dirLight.shadow.camera.top = 60;
    this.dirLight.shadow.camera.bottom = -60;
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

    // Build City
    this.cityData = generateCityDistrict();
    this.scene.add(this.cityData.sceneGroup);
    this.collisionBoxes = this.cityData.collisionBoxes;

    // AI Controller
    this.ai = new AIController();

    // Player Rig (Officer Alex Carter)
    this.playerRig = createCharacterMesh('player');
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

    // Spawn Criminal Muscle Car
    const crimRig = createVehicleMesh('criminal');
    crimRig.root.position.copy(this.cityData.spawnPoints.criminalVehicle);
    this.scene.add(crimRig.root);
    this.vehicles.push({
      entity: {
        id: 'criminal_muscle_1',
        type: 'criminal',
        position: { x: crimRig.root.position.x, y: 0, z: crimRig.root.position.z },
        rotation: crimRig.root.rotation.y,
        speed: 0,
        steering: 0,
        maxSpeed: 26,
        acceleration: 16,
        health: 200,
        maxHealth: 200,
        isSirenOn: false,
        isOccupiedByPlayer: false,
        color: '#18181b',
      },
      rig: crimRig,
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

    // Spawn Initial Street Criminals (patrolling commercial district corner and industrial perimeter)
    const initialCriminals = [
      { name: 'Slick', type: 'thug' as const, pos: new THREE.Vector3(-26, 0, -12) },
      { name: 'Knuckles', type: 'thug' as const, pos: new THREE.Vector3(-33, 0, -16) },
      { name: 'Razor', type: 'enforcer' as const, pos: new THREE.Vector3(38, 0, 28) },
      { name: 'Bones', type: 'thug' as const, pos: new THREE.Vector3(45, 0, 34) },
    ];
    initialCriminals.forEach((c) => {
      const crimRig = createCharacterMesh(c.type, 'default', c.name);
      this.scene.add(crimRig.root);
      this.ai.spawnEnemy(c.type, c.pos, crimRig, c.name);
    });

    // Wire up Police NPC shooting & callout callbacks
    this.ai.onPoliceShoot = (police, targetPos) => {
      this.policeFireBullet(police, targetPos);
    };
    this.ai.onRadioCallout = (callout, type) => {
      this.onNotification?.(callout, type);
    };
    this.ai.onPedestrianShout = (civ, text) => {
      this.addFloatingText(text, '#fef08a', civ.position);
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

    // Resize handler
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.startLoop();
  }

  /**
   * Spawns the 3 fictional armed criminals inside the commercial alleyway
   */
  public triggerAlleywayEncounter() {
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
        pos: new THREE.Vector3(-29.2, 0, -25.5), // Taking cover behind Dumpster 1
      },
      {
        name: 'Stitch',
        type: 'thug' as const,
        pos: new THREE.Vector3(-26.2, 0, -29.0), // Taking cover behind Crate stack
      },
      {
        name: 'Trigger',
        type: 'enforcer' as const,
        pos: new THREE.Vector3(-28.0, 0, -35.5), // Deep alleyway enforcer with tactical SMG
      },
    ];

    encounterConfigs.forEach((c) => {
      const rig = createCharacterMesh(c.type, 'default', c.name);
      this.scene.add(rig.root);
      const enemy = this.ai.spawnEnemy(c.type, c.pos, rig, c.name);
      enemy.alertLevel = 100; // Instantly engaged
    });

    // Sound dispatch & visual alert
    soundEngine.playRadioChime();
    this.onNotification?.(
      'DISPATCH: 10-33 IN PROGRESS! Unit 24, 3 armed suspects engaged in Commercial Alley! Take cover!',
      'alert'
    );

    // Mark reach objective completed
    this.onMissionObjectiveProgress?.('reach', 1);

    // Waypoint shifts to deep alleyway
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
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.8;
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 1.6;
      this.dirLight.position.set(60, 100, 50);
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316);
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.intensity = 0.6;
      this.dirLight.color.setHex(0xf43f5e);
      this.dirLight.intensity = 1.3;
      this.dirLight.position.set(90, 30, 40);
    } else {
      // Night
      this.scene.background = new THREE.Color(0x080b12);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.4;
      this.dirLight.color.setHex(0x60a5fa);
      this.dirLight.intensity = 0.7;
      this.dirLight.position.set(40, 70, 30);
    }
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public update(inputs: InputState) {
    const delta = Math.min(this.clock.getDelta(), 0.06);
    const time = this.clock.getElapsedTime();

    // 1. Camera Look Rotation
    const sens = 0.0035;
    this.playerYaw -= inputs.lookDeltaX * sens;
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

    // 5. Update Waypoint Animation & Distance Check
    if (this.isWaypointActive) {
      this.beaconDiamond.rotation.y = time * 2.0;
      this.beaconDiamond.position.y = 2.4 + Math.sin(time * 3) * 0.25;

      this.beaconRings.forEach((ring, idx) => {
        const scale = 1.0 + ((time * 1.5 + idx * 0.6) % 1.5);
        ring.scale.set(scale, scale, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - scale * 0.4);
      });

      // Check distance to alleyway waypoint
      const dstToAlley = Math.hypot(this.playerPos.x - this.waypointPos.x, this.playerPos.z - this.waypointPos.z);
      if (dstToAlley < 7.0 && !this.encounterTriggered) {
        this.triggerAlleywayEncounter();
      }
    }

    // 6. Update Criminal vehicle AI in Chase Mode
    this.updateCriminalChaseAI(delta, time);

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

  private updateOnFootMode(delta: number, time: number, inputs: InputState) {
    this.isAiming = inputs.aim;
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
    if (inputs.reload && !this.isReloading) {
      this.startReload();
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

      moveX = (normR * cosYaw + normF * sinYaw) * speed;
      moveZ = (-normR * sinYaw + normF * cosYaw) * speed;

      // Character faces direction of motion unless aiming
      if (!this.isAiming) {
        const targetRot = Math.atan2(moveX, moveZ);
        // Smooth rotation slerp
        this.playerRig.root.rotation.y = THREE.MathUtils.lerp(this.playerRig.root.rotation.y, targetRot, delta * 14);
      }
    }

    if (this.isAiming) {
      this.playerRig.root.rotation.y = this.playerYaw;
    }

    // Jump & Vertical Gravity Physics
    if (inputs.jump && this.isGrounded) {
      this.verticalVelocity = 6.2;
      this.isGrounded = false;
      inputs.jump = false;
      soundEngine.playJump();
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 18.0 * delta;
      this.playerPos.y += this.verticalVelocity * delta;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        soundEngine.playFootstep();
      }
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

    updateCharacterAnimation(
      this.playerRig,
      currentSpeed,
      time,
      this.isAiming,
      this.isCrouching,
      undefined,
      this.camera,
      this.stats.health / this.stats.maxHealth
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
    const targetCamDist = this.isAiming ? 2.2 : 4.2;
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, targetCamDist, delta * 12);

    const camOffsetY = this.isCrouching ? 1.2 : 1.7;
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

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(
      this.playerPos.x + cosY * shoulderOffset,
      this.playerPos.y + camOffsetY,
      this.playerPos.z - sinY * shoulderOffset
    );
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
      v.entity.rotation += v.entity.steering * steerFactor * 2.2 * delta;
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

    const camFollowDist = 7.5;
    const camHeight = 3.2;
    const camX = v.entity.position.x - Math.sin(v.entity.rotation) * camFollowDist;
    const camY = camHeight;
    const camZ = v.entity.position.z - Math.cos(v.entity.rotation) * camFollowDist;

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 8);
    this.camera.lookAt(v.entity.position.x, 1.4, v.entity.position.z);
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

      if (dist < 3.2 && Math.abs(playerVeh.entity.speed) > 8) {
        const damage = Math.round(Math.abs(playerVeh.entity.speed) * 3);
        other.entity.health = Math.max(0, other.entity.health - damage);
        soundEngine.playExplosion();

        this.addFloatingText(`-${damage} RAM!`, '#ef4444', other.entity.position);

        if (other.entity.health <= 0 && other.entity.type === 'criminal') {
          this.onNotification?.('CRIMINAL VEHICLE IMMOBILIZED!', 'success');
          this.onMissionObjectiveProgress?.('chase_stop', 1);
          this.stats.xp += 400;
          this.stats.money += 600;
          this.onStatsChanged?.(this.stats);
        }

        playerVeh.entity.speed *= 0.5;
        other.entity.speed *= 0.3;
      }
    }
  }

  public playerFireWeapon() {
    const w = this.weapons[this.activeWeaponIndex];
    if (!w) return;

    if (w.currentAmmo <= 0) {
      this.startReload();
      return;
    }

    w.currentAmmo--;
    this.shootCooldownTimer = 1.0 / w.fireRate;
    this.recentGunshotTimer = 1.8;
    soundEngine.playGunshot(w.category);
    this.onWeaponChanged?.(w);

    // Visual recoil on arm and camera pitch kick
    this.playerRig.recoilTimer = 0.12;
    this.cameraPitch = Math.max(-0.6, this.cameraPitch - 0.035);
    this.targetRecoilPitch = 0.035;
    this.cameraShakeAmount = Math.min(0.24, this.cameraShakeAmount + (w.damage > 40 ? 0.14 : 0.07));

    // Bullet Raycast
    const spread = (Math.random() - 0.5) * (this.isAiming ? w.spread * 0.4 : w.spread);
    const fireYaw = this.playerYaw + spread;
    const firePitch = this.cameraPitch;

    const origin = new THREE.Vector3(this.playerPos.x, 1.45, this.playerPos.z);
    const dir = new THREE.Vector3(
      Math.sin(fireYaw) * Math.cos(firePitch),
      -Math.sin(firePitch),
      Math.cos(fireYaw) * Math.cos(firePitch)
    ).normalize();

    // Hit test against enemies
    let hitSomething = false;
    let closestDist = w.range;
    let hitEnemy: EnemyEntity | null = null;
    let isHeadshot = false;

    for (const e of this.ai.enemies) {
      if (e.state === 'dead' || e.state === 'arrested') continue;

      const ePos = new THREE.Vector3(e.position.x, 1.1, e.position.z);
      const toEnemy = ePos.clone().sub(origin);
      const proj = toEnemy.dot(dir);

      if (proj > 0 && proj < closestDist) {
        const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
        const distFromCenter = closestPoint.distanceTo(ePos);

        if (distFromCenter < 0.8) {
          closestDist = proj;
          hitEnemy = e;
          isHeadshot = distFromCenter < 0.32;
          hitSomething = true;
        }
      }
    }

    // Tracer line endpoint
    const endPoint = origin.clone().add(dir.clone().multiplyScalar(closestDist));
    this.addBulletTracer(origin, endPoint, w.isNonLethal ? 0x38bdf8 : 0xfacc15);

    if (hitEnemy) {
      soundEngine.playHit(isHeadshot);

      const rig = this.ai.enemyRigs[hitEnemy.meshIndex];
      if (rig) rig.flinchTimer = 0.18;

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
        }
      }
    } else {
      // Check if civilian in line of fire
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

  public attemptArrest() {
    let arrestedAny = false;
    for (const e of this.ai.enemies) {
      if (e.state === 'surrendered') {
        const dist = this.playerPos.distanceTo(new THREE.Vector3(e.position.x, 0, e.position.z));
        if (dist < 3.5) {
          e.state = 'arrested';
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
          arrestedAny = true;
          break;
        }
      }
    }

    if (!arrestedAny) {
      this.onNotification?.('No surrendered suspects within arrest range.', 'info');
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

  private startReload() {
    const w = this.weapons[this.activeWeaponIndex];
    if (!w || w.currentAmmo >= w.magazineSize || w.reserveAmmo <= 0) return;

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
  }

  public switchNextWeapon() {
    let nextIdx = (this.activeWeaponIndex + 1) % this.weapons.length;
    while (!this.weapons[nextIdx].unlocked && nextIdx !== this.activeWeaponIndex) {
      nextIdx = (nextIdx + 1) % this.weapons.length;
    }
    this.activeWeaponIndex = nextIdx;
    this.isReloading = false;
    this.onWeaponChanged?.(this.weapons[this.activeWeaponIndex]);
    this.onNotification?.(`Equipped: ${this.weapons[this.activeWeaponIndex].name}`, 'info');
  }

  public switchWeaponById(id: string) {
    const idx = this.weapons.findIndex((w) => w.id === id);
    if (idx >= 0 && this.weapons[idx].unlocked) {
      this.activeWeaponIndex = idx;
      this.isReloading = false;
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

  private startLoop() {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    soundEngine.stopSiren();
    soundEngine.stopEngine();
    this.renderer.dispose();
  }
}
