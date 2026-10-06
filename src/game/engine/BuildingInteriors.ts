import * as THREE from 'three';
import { EnterableBuilding, EnterableBuildingId } from '../../types/game';

export interface ActiveInteriorState {
  building: EnterableBuilding;
  exteriorPosition: { x: number; y: number; z: number };
  exteriorYaw: number;
  interiorGroup: THREE.Group;
  interactiveObjects: {
    type: 'evidence_locker' | 'bank_teller' | 'store_counter' | 'exit_door' | 'safehouse_stash';
    position: THREE.Vector3;
    prompt: string;
    radius: number;
  }[];
}

export const ENTERABLE_BUILDINGS: Record<EnterableBuildingId, EnterableBuilding> = {
  precinct_9: {
    id: 'precinct_9',
    name: 'Precinct 9 Police Station',
    category: 'police',
    exteriorPos: { x: -45, y: 0.2, z: 28 },
    entranceRadius: 3.2,
    description: 'Metro Police Headquarters. Duty Sergeant desk, booking cells, and Evidence Locker.',
    tagline: 'METRO POLICE PRECINCT 9',
  },
  metro_bank: {
    id: 'metro_bank',
    name: 'Metro Corporate Bank',
    category: 'bank',
    exteriorPos: { x: 45, y: 0.2, z: -32 },
    entranceRadius: 3.4,
    description: 'Downtown commercial bank. Teller desks, cash deposits, and high-security Valuables Vault.',
    tagline: 'METRO COMMERCIAL TRUST',
  },
  cedar_market: {
    id: 'cedar_market',
    name: 'Cedar Heights Corner Store',
    category: 'shop',
    exteriorPos: { x: -28, y: 0.2, z: 24 },
    entranceRadius: 3.0,
    description: 'Neighborhood grocery and convenience store. Supplies, cold drinks, and snacks.',
    tagline: 'HEIGHTS CONVENIENCE & DELI',
  },
  soul_kitchen: {
    id: 'soul_kitchen',
    name: "Mama Leah's Soul Kitchen",
    category: 'diner',
    exteriorPos: { x: -66, y: 0.2, z: 14 },
    entranceRadius: 3.2,
    description: "Famous community soul kitchen. Hot skillet food, warm peach cobbler, and friendly locals.",
    tagline: "MAMA LEAH'S SOUL FOOD",
  },
  marcus_auto: {
    id: 'marcus_auto',
    name: "Marcus's Precision Auto",
    category: 'garage',
    exteriorPos: { x: -66, y: 0.2, z: -14 },
    entranceRadius: 3.4,
    description: 'Independent garage and speed tuning shop. Classic project cars and mechanical tools.',
    tagline: "MARCUS AUTO REPAIR & PERFORMANCE",
  },
};

/**
 * Procedural 3D Interior Generator for Enterable City Buildings
 * High performance PBR low-poly interior scenes placed in an isolated world zone (Y: -80)
 */
export function buildBuildingInterior(id: EnterableBuildingId): ActiveInteriorState {
  const building = ENTERABLE_BUILDINGS[id];
  const interiorGroup = new THREE.Group();
  // Elevate interior to isolated coordinate space
  const origin = new THREE.Vector3(0, -80, 0);
  interiorGroup.position.copy(origin);

  const interactiveObjects: ActiveInteriorState['interactiveObjects'] = [];

  // Common materials
  const matFloorTile = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 });
  const matWallWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });
  const matBluePolice = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
  const matMarble = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.1 });
  const matNeonBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const matExitDoor = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

  // Standard Room Shell (18m wide, 5.5m high, 16m deep)
  const roomWidth = 18;
  const roomDepth = 16;
  const roomHeight = 5.2;

  // Floor
  const floorGeom = new THREE.PlaneGeometry(roomWidth, roomDepth);
  const floor = new THREE.Mesh(floorGeom, id === 'metro_bank' ? matMarble : matFloorTile);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  interiorGroup.add(floor);

  // Ceiling with recessed LED panels
  const ceilingGeom = new THREE.PlaneGeometry(roomWidth, roomDepth);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomHeight;
  interiorGroup.add(ceiling);

  // Interior Overhead Ambient Point Lights
  const light1 = new THREE.PointLight(id === 'soul_kitchen' ? 0xfde047 : 0xffffff, 1.2, 22);
  light1.position.set(-4, roomHeight - 0.4, 0);
  interiorGroup.add(light1);

  const light2 = new THREE.PointLight(id === 'precinct_9' ? 0x93c5fd : 0xffffff, 1.2, 22);
  light2.position.set(4, roomHeight - 0.4, 0);
  interiorGroup.add(light2);

  // Walls: Back, Left, Right, Front
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.4), matWallWhite);
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  interiorGroup.add(backWall);

  const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(7.5, roomHeight, 0.4), matWallWhite);
  frontWallL.position.set(-5.25, roomHeight / 2, roomDepth / 2);
  interiorGroup.add(frontWallL);

  const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(7.5, roomHeight, 0.4), matWallWhite);
  frontWallR.position.set(5.25, roomHeight / 2, roomDepth / 2);
  interiorGroup.add(frontWallR);

  // Glass entrance doors at center front (Z: roomDepth / 2)
  const exitDoorGeom = new THREE.BoxGeometry(3.0, 3.2, 0.15);
  const exitDoor = new THREE.Mesh(exitDoorGeom, matExitDoor);
  exitDoor.position.set(0, 1.6, roomDepth / 2 - 0.1);
  interiorGroup.add(exitDoor);

  // Exit Door Sign
  const exitSign = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.4, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  exitSign.position.set(0, 3.5, roomDepth / 2 - 0.15);
  interiorGroup.add(exitSign);

  // Register Exit Door interaction
  interactiveObjects.push({
    type: 'exit_door',
    position: new THREE.Vector3(0, 0, roomDepth / 2 - 1.2).add(origin),
    prompt: 'EXIT TO STREET',
    radius: 2.2,
  });

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, roomHeight, roomDepth), matWallWhite);
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  interiorGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, roomHeight, roomDepth), matWallWhite);
  rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  interiorGroup.add(rightWall);

  // ==================================================================
  // 1. PRECINCT 9 INTERIOR (POLICE HQ)
  // ==================================================================
  if (id === 'precinct_9') {
    // Duty Sergeant Reception Counter
    const deskGeom = new THREE.BoxGeometry(10, 1.2, 1.8);
    const desk = new THREE.Mesh(deskGeom, matWood);
    desk.position.set(0, 0.6, -2);
    interiorGroup.add(desk);

    // Front Police Shield Emblem on Desk
    const shieldEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.06, 7), matGold);
    shieldEmblem.rotateX(Math.PI / 2);
    shieldEmblem.position.set(0, 0.7, -1.05);
    interiorGroup.add(shieldEmblem);

    // Computer Monitor and Dispatch Terminal
    const monGeom = new THREE.BoxGeometry(1.2, 0.8, 0.1);
    const mon = new THREE.Mesh(monGeom, matSteel);
    mon.position.set(-2, 1.6, -2.1);
    interiorGroup.add(mon);

    const screenGeom = new THREE.PlaneGeometry(1.1, 0.7);
    const screen = new THREE.Mesh(screenGeom, matNeonBlue);
    screen.position.set(-2, 1.6, -2.04);
    interiorGroup.add(screen);

    // Wanted Fugitives Corkboard on Back Wall
    const boardGeom = new THREE.BoxGeometry(5.5, 2.8, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 3.2, -roomDepth / 2 + 0.15);
    interiorGroup.add(board);

    // EVIDENCE LOCKER (Right Corner)
    const lockerGeom = new THREE.BoxGeometry(3.6, 3.8, 1.4);
    const lockerMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7, roughness: 0.3 });
    const locker = new THREE.Mesh(lockerGeom, lockerMat);
    locker.position.set(6.5, 1.9, -5.5);
    interiorGroup.add(locker);

    // Glowing Evidence Lock Bar
    const lockBar = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.3, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lockBar.position.set(6.5, 2.1, -4.75);
    interiorGroup.add(lockBar);

    // Register Evidence Locker Interaction
    interactiveObjects.push({
      type: 'evidence_locker',
      position: new THREE.Vector3(6.5, 0, -4.2).add(origin),
      prompt: 'ACCESS EVIDENCE LOCKER',
      radius: 2.5,
    });

    // Seating bench on left
    const bench = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.6, 0.8), matWood);
    bench.position.set(-6.5, 0.3, 0);
    interiorGroup.add(bench);
  }

  // ==================================================================
  // 2. METRO BANK INTERIOR (COMMERCIAL TRUST & VAULT)
  // ==================================================================
  else if (id === 'metro_bank') {
    // Marble Teller Counter with Brass Grilles
    const tellerGeom = new THREE.BoxGeometry(12, 1.3, 1.6);
    const tellerDesk = new THREE.Mesh(tellerGeom, matMarble);
    tellerDesk.position.set(0, 0.65, -3);
    interiorGroup.add(tellerDesk);

    // Brass security teller partition
    for (let tx = -4.5; tx <= 4.5; tx += 3) {
      const glassDivider = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.08), matSteel);
      glassDivider.position.set(tx, 1.9, -3);
      interiorGroup.add(glassDivider);

      const tellerSign = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.25, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      tellerSign.position.set(tx, 2.7, -2.95);
      interiorGroup.add(tellerSign);
    }

    // Register Bank Teller Interaction
    interactiveObjects.push({
      type: 'bank_teller',
      position: new THREE.Vector3(0, 0, -1.8).add(origin),
      prompt: 'APPROACH BANK TELLER',
      radius: 2.6,
    });

    // Circular Heavy Steel Vault Door on Back Wall
    const vaultGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.6, 24);
    vaultGeom.rotateX(Math.PI / 2);
    const vaultDoor = new THREE.Mesh(vaultGeom, matSteel);
    vaultDoor.position.set(0, 2.4, -roomDepth / 2 + 0.35);
    interiorGroup.add(vaultDoor);

    const wheelGeom = new THREE.TorusGeometry(0.7, 0.08, 8, 20);
    const vaultWheel = new THREE.Mesh(wheelGeom, matGold);
    vaultWheel.position.set(0, 2.4, -roomDepth / 2 + 0.7);
    interiorGroup.add(vaultWheel);

    // Velvet Stanchion ropes
    [-3.5, 3.5].forEach((sx) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), matGold);
      post.position.set(sx, 0.55, 1);
      interiorGroup.add(post);
    });

    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 7.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 })
    );
    rope.rotateZ(Math.PI / 2);
    rope.position.set(0, 0.95, 1);
    interiorGroup.add(rope);
  }

  // ==================================================================
  // 3. MAMA LEAH'S SOUL KITCHEN (DINER & COMMUNITY HUB)
  // ==================================================================
  else if (id === 'soul_kitchen') {
    // Red lunch counter with stools
    const counter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.1, 1.4), matWood);
    counter.position.set(-1, 0.55, -3);
    interiorGroup.add(counter);

    for (let sx = -4.5; sx <= 2.5; sx += 1.8) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.65, 10), matSteel);
      stool.position.set(sx, 0.32, -1.8);
      interiorGroup.add(stool);
    }

    // Register Kitchen Counter Interaction
    interactiveObjects.push({
      type: 'store_counter',
      position: new THREE.Vector3(-1, 0, -1.6).add(origin),
      prompt: "SPEAK WITH MAMA LEAH",
      radius: 2.5,
    });

    // Jukebox in corner
    const jukeGeom = new THREE.BoxGeometry(1.6, 2.6, 1.2);
    const juke = new THREE.Mesh(
      jukeGeom,
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, emissive: 0xb45309, emissiveIntensity: 0.4 })
    );
    juke.position.set(6.5, 1.3, -5.5);
    interiorGroup.add(juke);

    // Dining tables on right
    [1.5, -2.5].forEach((tz) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 12), matWood);
      table.position.set(5.5, 0.4, tz);
      interiorGroup.add(table);
    });
  }

  // ==================================================================
  // 4. CEDAR HEIGHTS CONVENIENCE / DELI (SHOP)
  // ==================================================================
  else if (id === 'cedar_market') {
    // Checkout Counter with Cash Register
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 1.1, 1.4), matWood);
    counter.position.set(-3.5, 0.55, -2);
    interiorGroup.add(counter);

    const reg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), matSteel);
    reg.position.set(-3.5, 1.35, -2);
    interiorGroup.add(reg);

    // Register Shopkeeper Interaction
    interactiveObjects.push({
      type: 'store_counter',
      position: new THREE.Vector3(-3.5, 0, -0.8).add(origin),
      prompt: 'BROWSE STORE SUPPLIES',
      radius: 2.5,
    });

    // Merchandise Aisle Shelves
    [2.5, 6.0].forEach((ax) => {
      const aisle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 8.0), matSteel);
      aisle.position.set(ax, 1.3, -2);
      interiorGroup.add(aisle);
    });

    // Beverage Cooler against back wall
    const cooler = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.3 })
    );
    cooler.position.set(4, 1.6, -roomDepth / 2 + 0.5);
    interiorGroup.add(cooler);
  }

  // ==================================================================
  // 5. MARCUS'S PRECISION AUTO (WORKSHOP)
  // ==================================================================
  else {
    // Workshop Hydraulic Lift
    const liftGeom = new THREE.BoxGeometry(3.6, 0.15, 6.0);
    const lift = new THREE.Mesh(liftGeom, matSteel);
    lift.position.set(-2, 0.08, -2);
    interiorGroup.add(lift);

    // Project Car on Lift
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.6, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    carBody.position.set(-2, 1.2, -2);
    interiorGroup.add(carBody);

    // Tool Bench along back wall
    const bench = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.4), matSteel);
    bench.position.set(2, 0.6, -roomDepth / 2 + 0.8);
    interiorGroup.add(bench);

    // Red Tool Chest
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    chest.position.set(5.5, 0.9, -roomDepth / 2 + 0.8);
    interiorGroup.add(chest);

    // Register Workshop Interaction
    interactiveObjects.push({
      type: 'store_counter',
      position: new THREE.Vector3(2, 0, -roomDepth / 2 + 2.2).add(origin),
      prompt: 'TALK WITH MARCUS',
      radius: 2.5,
    });
  }

  return {
    building,
    exteriorPosition: building.exteriorPos,
    exteriorYaw: 0,
    interiorGroup,
    interactiveObjects,
  };
}
