import * as THREE from 'three';
import { EnterableBuilding, EnterableBuildingId, FictionalValuable } from '../../types/game';
import { CollisionBox } from './CityGenerator';

export type InteriorInteractableType =
  | 'bank_teller'
  | 'manager_safe'
  | 'vault_door'
  | 'vault_gold'
  | 'cctv_console'
  | 'atm_terminal'
  | 'evidence_locker'
  | 'police_armory'
  | 'duty_desk'
  | 'store_counter'
  | 'backroom_safe'
  | 'exit_door';

export interface InteriorInteractable {
  id: string;
  type: InteriorInteractableType;
  name: string;
  prompt: string;
  position: { x: number; y: number; z: number };
  radius: number;
  icon?: string;
  isCompleted?: boolean;
}

export interface ActiveInteriorState {
  building: EnterableBuilding;
  exteriorPosition: { x: number; y: number; z: number };
  exteriorYaw: number;
  interiorGroup: THREE.Group;
  interiorSpawnPos: { x: number; y: number; z: number };
  interiorSpawnYaw: number;
  collisionBoxes: CollisionBox[];
  interactiveObjects: InteriorInteractable[];
  animatedVaultDoor?: {
    doorMesh: THREE.Object3D;
    wheelMesh: THREE.Object3D;
    isOpen: boolean;
    currentAngle: number;
    targetAngle: number;
  };
}

export const ENTERABLE_BUILDINGS: Record<EnterableBuildingId, EnterableBuilding> = {
  metro_bank: {
    id: 'metro_bank',
    name: '1st National Metro Bank',
    category: 'bank',
    exteriorPos: { x: 45, y: 0.22, z: -30.5 },
    entranceRadius: 4.2,
    description: 'Financial district flagship branch. Armed tellers, safety deposit boxes, manager office & master vault.',
    tagline: '1ST NATIONAL METRO COMMERCIAL TRUST',
  },
  precinct_9: {
    id: 'precinct_9',
    name: 'Precinct 9 Police Station',
    category: 'police',
    exteriorPos: { x: -45, y: 0.22, z: 28 },
    entranceRadius: 4.2,
    description: 'Metro Police Headquarters. Duty Sergeant desk, tactical armory, and official Evidence Locker.',
    tagline: 'METRO POLICE PRECINCT 9',
  },
  cedar_market: {
    id: 'cedar_market',
    name: 'Eastside Bodega & 24/7 Market',
    category: 'shop',
    exteriorPos: { x: 14.8, y: 0.22, z: 2 },
    entranceRadius: 4.0,
    description: 'Neighborhood convenience market, cold drinks, emergency first-aid & backroom delivery safe.',
    tagline: 'EASTSIDE 24/7 CONVENIENCE & DELI',
  },
};

/**
 * Builds a high-fidelity 3D interior for enterable buildings in an isolated world coordinate space (e.g. X: 200, Z: 200).
 * Preserves physics, collisions, lighting, and performance without interfering with outdoor city scenes.
 */
export function buildBuildingInterior(id: EnterableBuildingId): ActiveInteriorState {
  const building = ENTERABLE_BUILDINGS[id] || ENTERABLE_BUILDINGS.metro_bank;
  const interiorGroup = new THREE.Group();

  // Distinct isolated origin per building to allow instant zero-lag loading
  let origin = new THREE.Vector3(200, 0, 200);
  if (id === 'precinct_9') origin = new THREE.Vector3(-200, 0, 200);
  if (id === 'cedar_market') origin = new THREE.Vector3(200, 0, -200);

  interiorGroup.position.copy(origin);

  const collisionBoxes: CollisionBox[] = [];
  const interactiveObjects: InteriorInteractable[] = [];

  const addInteriorCollision = (
    localX: number,
    localZ: number,
    width: number,
    depth: number,
    height: number,
    tag: CollisionBox['tag'] = 'building'
  ) => {
    const worldX = origin.x + localX;
    const worldZ = origin.z + localZ;
    collisionBoxes.push({
      minX: worldX - width / 2,
      maxX: worldX + width / 2,
      minZ: worldZ - depth / 2,
      maxZ: worldZ + depth / 2,
      height,
      tag,
    });
  };

  // Shared Architectural Materials
  const marbleFloorMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.22,
    metalness: 0.12,
  });
  const darkTileFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.15,
  });
  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.85,
  });
  const wallWoodPanels = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.65,
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.28,
  });
  const polishedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.22,
  });
  const glassPartitionMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

  let animatedVaultDoorData: ActiveInteriorState['animatedVaultDoor'] | undefined;

  // ==========================================================================
  // 1. 1ST NATIONAL METRO BANK INTERIOR
  // ==========================================================================
  if (id === 'metro_bank') {
    const roomWidth = 26;
    const roomDepth = 24;
    const roomHeight = 5.6;

    // Floor: Checkered polished grand marble tiles
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), marbleFloorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    interiorGroup.add(floorMesh);

    // Decorative dark marble border inlay
    const borderGeom = new THREE.RingGeometry(8, 9.5, 4);
    const borderMesh = new THREE.Mesh(borderGeom, darkTileFloorMat);
    borderMesh.rotation.x = -Math.PI / 2;
    borderMesh.rotation.z = Math.PI / 4;
    borderMesh.position.y = 0.01;
    interiorGroup.add(borderMesh);

    // Ceiling with recessed architectural warm light troffers
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    interiorGroup.add(ceiling);

    // Interior Ambient & Point Lights
    const centralChandelier = new THREE.PointLight(0xfffbeb, 1.8, 30);
    centralChandelier.position.set(0, roomHeight - 0.5, 0);
    interiorGroup.add(centralChandelier);

    const vaultAtmosphereLight = new THREE.PointLight(0x38bdf8, 1.5, 18);
    vaultAtmosphereLight.position.set(0, 3.2, -7.5);
    interiorGroup.add(vaultAtmosphereLight);

    const managerOfficeLight = new THREE.PointLight(0xfef08a, 1.2, 14);
    managerOfficeLight.position.set(7.5, 3.2, -4);
    interiorGroup.add(managerOfficeLight);

    // Perimeter Walls
    // Back Wall (Z: -roomDepth / 2 = -12)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.5), wallPlasterMat);
    backWall.position.set(0, roomHeight / 2, -12);
    interiorGroup.add(backWall);
    addInteriorCollision(0, -12, roomWidth, 0.6, roomHeight);

    // Left Wall (X: -13)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallPlasterMat);
    leftWall.position.set(-13, roomHeight / 2, 0);
    interiorGroup.add(leftWall);
    addInteriorCollision(-13, 0, 0.6, roomDepth, roomHeight);

    // Right Wall (X: 13)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallWoodPanels);
    rightWall.position.set(13, roomHeight / 2, 0);
    interiorGroup.add(rightWall);
    addInteriorCollision(13, 0, 0.6, roomDepth, roomHeight);

    // Front Wall with Entrance / Exit Opening (Z: 12)
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(11.2, roomHeight, 0.5), wallPlasterMat);
    frontWallL.position.set(-7.4, roomHeight / 2, 12);
    interiorGroup.add(frontWallL);
    addInteriorCollision(-7.4, 12, 11.2, 0.6, roomHeight);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(11.2, roomHeight, 0.5), wallPlasterMat);
    frontWallR.position.set(7.4, roomHeight / 2, 12);
    interiorGroup.add(frontWallR);
    addInteriorCollision(7.4, 12, 11.2, 0.6, roomHeight);

    // Exit Glass Double Doors at (X: 0, Z: 11.8)
    const exitDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 0.2), brushedSteelMat);
    exitDoorFrame.position.set(0, 1.7, 11.9);
    interiorGroup.add(exitDoorFrame);

    const exitDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.1), glassPartitionMat);
    exitDoorGlass.position.set(0, 1.6, 11.9);
    interiorGroup.add(exitDoorGlass);

    // Illuminated Exit Sign
    const exitSignMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.15), neonGreenMat);
    exitSignMesh.position.set(0, 3.65, 11.8);
    interiorGroup.add(exitSignMesh);

    // Glowing green exit mat on floor
    const exitFloorMat = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), neonGreenMat);
    exitFloorMat.rotation.x = -Math.PI / 2;
    exitFloorMat.position.set(0, 0.015, 10.6);
    interiorGroup.add(exitFloorMat);

    // Register Exit Door
    interactiveObjects.push({
      id: 'bank_exit',
      type: 'exit_door',
      name: 'Exit to Financial Plaza',
      prompt: 'EXIT TO CITY STREET',
      position: { x: origin.x, y: 0.2, z: origin.z + 11.0 },
      radius: 2.2,
      icon: 'door',
    });

    // ------------------------------------------------------------------------
    // ZONE A: BANK TELLER SERVICE COUNTERS (Center-Left: X: -4 to 4, Z: 2)
    // ------------------------------------------------------------------------
    const tellerCounter = new THREE.Mesh(new THREE.BoxGeometry(11, 1.3, 1.8), wallWoodPanels);
    tellerCounter.position.set(-2, 0.65, 2.0);
    interiorGroup.add(tellerCounter);
    addInteriorCollision(-2, 2.0, 11, 1.8, 1.3);

    // Bulletproof Glass Partitions and Brass Transaction Windows
    for (let tx = -6; tx <= 2; tx += 2.8) {
      const tellerGlass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.08), glassPartitionMat);
      tellerGlass.position.set(tx, 2.05, 2.0);
      interiorGroup.add(tellerGlass);

      const tellerSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.05), neonCyanMat);
      tellerSign.position.set(tx, 2.9, 1.95);
      interiorGroup.add(tellerSign);
    }

    // Interactive Teller Cash Drawer Register at (X: -2, Z: 2.8)
    const tellerRegisterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.7), brushedSteelMat);
    tellerRegisterMesh.position.set(-2, 1.5, 2.0);
    interiorGroup.add(tellerRegisterMesh);

    // Beacon ring on customer side of teller counter
    const tellerRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 24), neonCyanMat);
    tellerRing.rotation.x = -Math.PI / 2;
    tellerRing.position.set(-2, 0.02, 3.4);
    interiorGroup.add(tellerRing);

    interactiveObjects.push({
      id: 'bank_teller_drawer',
      type: 'bank_teller',
      name: 'Teller Counter & Cash Register',
      prompt: 'CHECK TELLER REGISTER',
      position: { x: origin.x - 2, y: 0.5, z: origin.z + 3.4 },
      radius: 2.4,
      icon: 'dollar',
    });

    // ------------------------------------------------------------------------
    // ZONE B: BRANCH MANAGER'S EXECUTIVE OFFICE (Right: X: 5 to 12, Z: -8 to 0)
    // ------------------------------------------------------------------------
    // Glass Partition dividing office
    const officeGlassWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, roomHeight, 8), glassPartitionMat);
    officeGlassWall.position.set(5.0, roomHeight / 2, -4);
    interiorGroup.add(officeGlassWall);
    addInteriorCollision(5.0, -4, 0.3, 8, roomHeight);

    // Executive Mahogany Desk
    const mgrDesk = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 2.0), wallWoodPanels);
    mgrDesk.position.set(8.5, 0.55, -4);
    interiorGroup.add(mgrDesk);
    addInteriorCollision(8.5, -4, 3.6, 2.0, 1.1);

    // Executive Leather Chair
    const mgrChair = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), darkTileFloorMat);
    mgrChair.position.set(8.5, 0.7, -5.5);
    interiorGroup.add(mgrChair);

    // Banker's Desk Lamp with Emerald Glow
    const bankerLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.8 })
    );
    bankerLamp.position.set(9.5, 1.3, -4);
    interiorGroup.add(bankerLamp);

    // MANAGER'S EXECUTIVE WALL SAFE on East Wall (X: 12.6, Z: -4)
    const wallSafeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 1.8), brushedSteelMat);
    wallSafeMesh.position.set(12.6, 1.8, -4);
    interiorGroup.add(wallSafeMesh);

    const safeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16), polishedBrassMat);
    safeDial.rotation.z = Math.PI / 2;
    safeDial.position.set(12.25, 1.8, -4);
    interiorGroup.add(safeDial);

    const safeRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 24), neonGoldMat);
    safeRing.rotation.x = -Math.PI / 2;
    safeRing.position.set(11.2, 0.02, -4);
    interiorGroup.add(safeRing);

    interactiveObjects.push({
      id: 'manager_safe',
      type: 'manager_safe',
      name: "Manager's Executive Wall Safe",
      prompt: "INSPECT MANAGER'S SAFE",
      position: { x: origin.x + 11.2, y: 0.5, z: origin.z - 4 },
      radius: 2.5,
      icon: 'safe',
    });

    // ------------------------------------------------------------------------
    // ZONE C: HIGH-SECURITY MASTER VAULT CHAMBER (Back Center: X: -4 to 4, Z: -11 to -5)
    // ------------------------------------------------------------------------
    // Concrete Vault Dividing Wall (Z: -5.5) with Vault Portal Opening
    const vaultWallL = new THREE.Mesh(new THREE.BoxGeometry(8, roomHeight, 0.6), brushedSteelMat);
    vaultWallL.position.set(-8, roomHeight / 2, -5.5);
    interiorGroup.add(vaultWallL);
    addInteriorCollision(-8, -5.5, 8, 0.6, roomHeight);

    const vaultWallR = new THREE.Mesh(new THREE.BoxGeometry(3, roomHeight, 0.6), brushedSteelMat);
    vaultWallR.position.set(3.5, roomHeight / 2, -5.5);
    interiorGroup.add(vaultWallR);
    addInteriorCollision(3.5, -5.5, 3, 0.6, roomHeight);

    // Vault Circular Portal Archway Frame at (X: -0.5, Z: -5.5)
    const archwayFrame = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.35, 12, 32), brushedSteelMat);
    archwayFrame.position.set(-0.5, 2.4, -5.5);
    interiorGroup.add(archwayFrame);

    // REINFORCED HEAVY CIRCULAR VAULT DOOR (Animated Pivot Group)
    const vaultDoorGroup = new THREE.Group();
    // Pivot hinge at left edge of archway: X = -2.6, Z = -5.5
    vaultDoorGroup.position.set(-2.6, 2.4, -5.5);

    const vaultDoorCylinder = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.55, 32), brushedSteelMat);
    vaultDoorCylinder.rotation.x = Math.PI / 2;
    // Offset relative to hinge pivot
    vaultDoorCylinder.position.set(2.1, 0, 0);
    vaultDoorGroup.add(vaultDoorCylinder);

    // Chrome Locking Spoke Wheel on front of vault door
    const vaultWheel = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.12, 10, 24), polishedBrassMat);
    vaultWheel.position.set(2.1, 0, 0.35);
    vaultDoorGroup.add(vaultWheel);

    for (let sp = 0; sp < 4; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), polishedBrassMat);
      spoke.rotation.z = (sp * Math.PI) / 4;
      spoke.position.set(2.1, 0, 0.35);
      vaultDoorGroup.add(spoke);
    }

    interiorGroup.add(vaultDoorGroup);

    // Store animated vault door data (starts closed at angle 0; opens to -Math.PI / 2)
    animatedVaultDoorData = {
      doorMesh: vaultDoorGroup,
      wheelMesh: vaultWheel,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
    };

    // Vault Door Operating Console
    const vaultDoorRing = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.9, 24), neonCyanMat);
    vaultDoorRing.rotation.x = -Math.PI / 2;
    vaultDoorRing.position.set(-0.5, 0.02, -4.2);
    interiorGroup.add(vaultDoorRing);

    interactiveObjects.push({
      id: 'vault_door',
      type: 'vault_door',
      name: 'Reinforced Vault Blast Door',
      prompt: 'OPERATE MASTER VAULT DOOR',
      position: { x: origin.x - 0.5, y: 0.5, z: origin.z - 4.2 },
      radius: 2.8,
      icon: 'lock',
    });

    // INSIDE THE VAULT CHAMBER:
    // Left & Back Walls lined with Safety Deposit Boxes
    const sdbGridGeom = new THREE.BoxGeometry(4.5, 3.4, 0.8);
    const sdbGridMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.15 });
    const sdbGrid = new THREE.Mesh(sdbGridGeom, sdbGridMat);
    sdbGrid.position.set(-6, 1.7, -9.5);
    interiorGroup.add(sdbGrid);
    addInteriorCollision(-6, -9.5, 4.5, 0.8, 3.4);

    // Heavy Central Steel Table holding 24K Gold Bullion Bars & Cash Bricks
    const bullionTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.0, 2.2), brushedSteelMat);
    bullionTable.position.set(-1.0, 0.5, -9.5);
    interiorGroup.add(bullionTable);
    addInteriorCollision(-1.0, -9.5, 4.0, 2.2, 1.0);

    // 24K Gold Bullion Stacks on Table
    for (let gx = -1.2; gx <= 1.2; gx += 0.8) {
      for (let gz = -0.4; gz <= 0.4; gz += 0.5) {
        const goldBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.22, 0.32),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15 })
        );
        goldBar.position.set(-1.0 + gx, 1.12, -9.5 + gz);
        interiorGroup.add(goldBar);
      }
    }

    // Glowing Gold beacon ring inside vault
    const goldBeaconRing = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 24), neonGoldMat);
    goldBeaconRing.rotation.x = -Math.PI / 2;
    goldBeaconRing.position.set(-1.0, 0.02, -8.0);
    interiorGroup.add(goldBeaconRing);

    interactiveObjects.push({
      id: 'vault_gold_bullion',
      type: 'vault_gold',
      name: 'Master Vault Gold Bullion & Reserve Cash',
      prompt: 'INSPECT VAULT VALUABLES',
      position: { x: origin.x - 1.0, y: 0.5, z: origin.z - 8.0 },
      radius: 2.6,
      icon: 'gold',
    });

    // ------------------------------------------------------------------------
    // ZONE D: CCTV SURVEILLANCE & SECURITY CONSOLE (West Wall: X: -12.4, Z: -3)
    // ------------------------------------------------------------------------
    const cctvRack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 3.0), brushedSteelMat);
    cctvRack.position.set(-12.4, 1.4, -3);
    interiorGroup.add(cctvRack);
    addInteriorCollision(-12.4, -3, 0.8, 3.0, 2.8);

    // Multi-Monitor Displays
    for (let my = -0.6; my <= 0.6; my += 0.6) {
      const monMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.45), neonCyanMat);
      monMesh.rotation.y = Math.PI / 2;
      monMesh.position.set(-11.95, 1.8 + my, -3);
      interiorGroup.add(monMesh);
    }

    const cctvRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 24), neonCyanMat);
    cctvRing.rotation.x = -Math.PI / 2;
    cctvRing.position.set(-11.0, 0.02, -3);
    interiorGroup.add(cctvRing);

    interactiveObjects.push({
      id: 'bank_cctv',
      type: 'cctv_console',
      name: 'Bank CCTV Surveillance Terminal',
      prompt: 'ACCESS CCTV CONSOLE',
      position: { x: origin.x - 11.0, y: 0.5, z: origin.z - 3 },
      radius: 2.4,
      icon: 'camera',
    });

    // ------------------------------------------------------------------------
    // ZONE E: ATM BANKING TERMINAL (Near Entrance: X: -8.5, Z: 8.5)
    // ------------------------------------------------------------------------
    const atmKiosk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1.2), darkTileFloorMat);
    atmKiosk.position.set(-8.5, 1.2, 8.5);
    interiorGroup.add(atmKiosk);
    addInteriorCollision(-8.5, 8.5, 1.4, 1.2, 2.4);

    const atmScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), neonCyanMat);
    atmScreen.rotation.y = Math.PI;
    atmScreen.position.set(-8.5, 1.5, 7.89);
    interiorGroup.add(atmScreen);

    const atmRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 24), neonCyanMat);
    atmRing.rotation.x = -Math.PI / 2;
    atmRing.position.set(-8.5, 0.02, 7.0);
    interiorGroup.add(atmRing);

    interactiveObjects.push({
      id: 'bank_atm_terminal',
      type: 'atm_terminal',
      name: 'Metro Trust Banking & Vault Terminal',
      prompt: 'OPEN BANKING & SAVINGS TERMINAL',
      position: { x: origin.x - 8.5, y: 0.5, z: origin.z + 7.0 },
      radius: 2.5,
      icon: 'atm',
    });

    // Velvet Stanchion Ropes in queue area
    [-4, 0, 4].forEach((px) => {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 12), polishedBrassMat);
      stanchion.position.set(px, 0.55, 6.5);
      interiorGroup.add(stanchion);
    });
  }

  // ==========================================================================
  // 2. PRECINCT 9 POLICE STATION INTERIOR
  // ==========================================================================
  else if (id === 'precinct_9') {
    const roomWidth = 24;
    const roomDepth = 20;
    const roomHeight = 5.2;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), darkTileFloorMat);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), wallPlasterMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    interiorGroup.add(ceiling);

    const light = new THREE.PointLight(0x93c5fd, 1.5, 25);
    light.position.set(0, roomHeight - 0.4, 0);
    interiorGroup.add(light);

    // Walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.5), wallPlasterMat);
    backWall.position.set(0, roomHeight / 2, -10);
    interiorGroup.add(backWall);
    addInteriorCollision(0, -10, roomWidth, 0.6, roomHeight);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallPlasterMat);
    leftWall.position.set(-12, roomHeight / 2, 0);
    interiorGroup.add(leftWall);
    addInteriorCollision(-12, 0, 0.6, roomDepth, roomHeight);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallPlasterMat);
    rightWall.position.set(12, roomHeight / 2, 0);
    interiorGroup.add(rightWall);
    addInteriorCollision(12, 0, 0.6, roomDepth, roomHeight);

    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(10, roomHeight, 0.5), wallPlasterMat);
    frontWallL.position.set(-6.5, roomHeight / 2, 10);
    interiorGroup.add(frontWallL);
    addInteriorCollision(-6.5, 10, 10, 0.6, roomHeight);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(10, roomHeight, 0.5), wallPlasterMat);
    frontWallR.position.set(6.5, roomHeight / 2, 10);
    interiorGroup.add(frontWallR);
    addInteriorCollision(6.5, 10, 10, 0.6, roomHeight);

    // Exit Door
    interactiveObjects.push({
      id: 'precinct_exit',
      type: 'exit_door',
      name: 'Exit to Police Plaza',
      prompt: 'EXIT TO CITY STREET',
      position: { x: origin.x, y: 0.2, z: origin.z + 8.8 },
      radius: 2.6,
      icon: 'door',
    });

    // Duty Sergeant Reception Desk
    const desk = new THREE.Mesh(new THREE.BoxGeometry(9, 1.2, 1.8), wallWoodPanels);
    desk.position.set(0, 0.6, 1);
    interiorGroup.add(desk);
    addInteriorCollision(0, 1, 9, 1.8, 1.2);

    interactiveObjects.push({
      id: 'duty_desk',
      type: 'duty_desk',
      name: 'Duty Sergeant Reception Desk',
      prompt: 'CHECK PRECINCT BRIEFING LOG',
      position: { x: origin.x, y: 0.5, z: origin.z + 2.5 },
      radius: 2.4,
      icon: 'shield',
    });

    // Evidence Locker (Right Corner: X: 8.5, Z: -6)
    const locker = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7, roughness: 0.3 })
    );
    locker.position.set(8.5, 1.9, -6);
    interiorGroup.add(locker);
    addInteriorCollision(8.5, -6, 3.6, 1.4, 3.8);

    interactiveObjects.push({
      id: 'evidence_locker',
      type: 'evidence_locker',
      name: 'Precinct 9 Evidence Locker',
      prompt: 'ACCESS EVIDENCE LOCKER',
      position: { x: origin.x + 8.5, y: 0.5, z: origin.z - 4.5 },
      radius: 2.5,
      icon: 'lock',
    });

    // Tactical Armory Depot (Left Corner: X: -8.5, Z: -6)
    const armory = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.4, 1.4), brushedSteelMat);
    armory.position.set(-8.5, 1.7, -6);
    interiorGroup.add(armory);
    addInteriorCollision(-8.5, -6, 3.8, 1.4, 3.4);

    interactiveObjects.push({
      id: 'police_armory',
      type: 'police_armory',
      name: 'Tactical Armory Depot',
      prompt: 'RESTOCK SERVICE AMMUNITION',
      position: { x: origin.x - 8.5, y: 0.5, z: origin.z - 4.5 },
      radius: 2.5,
      icon: 'ammo',
    });
  }

  // ==========================================================================
  // 3. EASTSIDE BODEGA & 24/7 MARKET INTERIOR
  // ==========================================================================
  else {
    const roomWidth = 18;
    const roomDepth = 16;
    const roomHeight = 5.0;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), darkTileFloorMat);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), wallPlasterMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    interiorGroup.add(ceiling);

    const light = new THREE.PointLight(0xfef08a, 1.5, 20);
    light.position.set(0, roomHeight - 0.4, 0);
    interiorGroup.add(light);

    // Walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.5), wallPlasterMat);
    backWall.position.set(0, roomHeight / 2, -8);
    interiorGroup.add(backWall);
    addInteriorCollision(0, -8, roomWidth, 0.6, roomHeight);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallPlasterMat);
    leftWall.position.set(-9, roomHeight / 2, 0);
    interiorGroup.add(leftWall);
    addInteriorCollision(-9, 0, 0.6, roomDepth, roomHeight);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomDepth), wallPlasterMat);
    rightWall.position.set(9, roomHeight / 2, 0);
    interiorGroup.add(rightWall);
    addInteriorCollision(9, 0, 0.6, roomDepth, roomHeight);

    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(7, roomHeight, 0.5), wallPlasterMat);
    frontWallL.position.set(-5, roomHeight / 2, 8);
    interiorGroup.add(frontWallL);
    addInteriorCollision(-5, 8, 7, 0.6, roomHeight);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(7, roomHeight, 0.5), wallPlasterMat);
    frontWallR.position.set(5, roomHeight / 2, 8);
    interiorGroup.add(frontWallR);
    addInteriorCollision(5, 8, 7, 0.6, roomHeight);

    // Exit Door
    interactiveObjects.push({
      id: 'market_exit',
      type: 'exit_door',
      name: 'Exit to Bodega Sidewalk',
      prompt: 'EXIT TO CITY STREET',
      position: { x: origin.x, y: 0.2, z: origin.z + 6.8 },
      radius: 2.6,
      icon: 'door',
    });

    // Checkout Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.1, 1.5), wallWoodPanels);
    counter.position.set(-3.5, 0.55, 1);
    interiorGroup.add(counter);
    addInteriorCollision(-3.5, 1, 5.5, 1.5, 1.1);

    interactiveObjects.push({
      id: 'market_counter',
      type: 'store_counter',
      name: 'Market Register & Clerk Counter',
      prompt: 'BROWSE FIELD PROVISIONS',
      position: { x: origin.x - 3.5, y: 0.5, z: origin.z + 2.4 },
      radius: 2.4,
      icon: 'shop',
    });

    // Backroom Safe (Contraband stash)
    const backSafe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.4), brushedSteelMat);
    backSafe.position.set(6.5, 1.0, -6.5);
    interiorGroup.add(backSafe);
    addInteriorCollision(6.5, -6.5, 1.6, 1.4, 2.0);

    interactiveObjects.push({
      id: 'market_backroom_safe',
      type: 'backroom_safe',
      name: 'Bodega Backroom Delivery Safe',
      prompt: 'INSPECT BACKROOM STASH',
      position: { x: origin.x + 6.5, y: 0.5, z: origin.z - 5.2 },
      radius: 2.4,
      icon: 'safe',
    });
  }

  // Spawn position inside building: facing inwards into the room safely in front of exit
  const interiorSpawnPos = {
    x: origin.x,
    y: 0.0,
    z: id === 'metro_bank' ? origin.z + 7.2 : id === 'precinct_9' ? origin.z + 5.5 : origin.z + 4.0,
  };

  return {
    building,
    exteriorPosition: building.exteriorPos,
    exteriorYaw: Math.PI,
    interiorGroup,
    interiorSpawnPos,
    interiorSpawnYaw: 0,
    collisionBoxes,
    interactiveObjects,
    animatedVaultDoor: animatedVaultDoorData,
  };
}
