import * as THREE from 'three';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  tag: 'building' | 'barrier' | 'prop' | 'fence';
}

export interface CityBuildResult {
  sceneGroup: THREE.Group;
  collisionBoxes: CollisionBox[];
  spawnPoints: {
    player: THREE.Vector3;
    policeVehicle: THREE.Vector3;
    criminalVehicle: THREE.Vector3;
    warehouse: THREE.Vector3;
    bank: THREE.Vector3;
    policeStation: THREE.Vector3;
    harbor: THREE.Vector3;
    enemies: THREE.Vector3[];
    civilians: THREE.Vector3[];
  };
}

/**
 * Procedurally generates an urban metropolis district with smooth, modern stylized low-poly
 * 3D graphics, realistic proportions, detailed roads, architectural buildings, street furniture,
 * organic foliage, and atmospheric lighting.
 */
export function generateCityDistrict(): CityBuildResult {
  const sceneGroup = new THREE.Group();
  const collisionBoxes: CollisionBox[] = [];

  // Helper to register AABB collision box
  const addCollision = (
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    tag: CollisionBox['tag'] = 'building'
  ) => {
    collisionBoxes.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      height,
      tag,
    });
  };

  // ----------------------------------------------------
  // SHARED MATERIALS (Stylized Realistic Mobile 3D Action Palette)
  // ----------------------------------------------------
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x242d3d, // Rich visible dark slate asphalt with clear road contrast
    roughness: 0.72,
    metalness: 0.18,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Clean architectural concrete paver sidewalk
    roughness: 0.75,
    metalness: 0.12,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Crisp beveled concrete curb border
    roughness: 0.65,
    metalness: 0.2,
  });

  const roadLineYellow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // Vibrant highway gold
  const roadLineWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });  // Bright crisp marking white

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const illuminatedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.7,
  });

  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  const metalDarkMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.35,
  });

  const metalGalvanized = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.75,
    roughness: 0.4,
  });

  const concreteFacadeMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // High-contrast stylized building concrete
    roughness: 0.75,
    metalness: 0.15,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Rich architectural terracotta brick
    roughness: 0.85,
    metalness: 0.05,
  });

  const neonBlueMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const neonRedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  // ----------------------------------------------------
  // 0. SKY DOME & DISTANT METROPOLIS SKYLINE
  // ----------------------------------------------------
  // Atmospheric Sky Dome with horizon gradient
  const skyRadius = 290;
  const skyGeom = new THREE.SphereGeometry(skyRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  skyGeom.scale(-1, 1, 1); // Invert normals so it renders from inside
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x1e3a8a, // Twilight atmospheric sky
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeom, skyMat);
  sceneGroup.add(skyDome);

  // Distant Skyscraper Skyline Silhouette Perimeter (creates expansive city horizon)
  const skylineGroup = new THREE.Group();
  const skylineMat = new THREE.MeshBasicMaterial({ color: 0x0f1d38 });
  const skylineWinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const skylineWarmMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const skylineTowerCount = 42;

  for (let s = 0; s < skylineTowerCount; s++) {
    const angle = (s / skylineTowerCount) * Math.PI * 2;
    const dist = 145 + ((s * 17) % 30);
    const tw = 16 + ((s * 7) % 18);
    const td = 16 + ((s * 11) % 18);
    const th = 40 + ((s * 23) % 65);

    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    const towerGeom = new THREE.BoxGeometry(tw, th, td);
    const tower = new THREE.Mesh(towerGeom, skylineMat);
    tower.position.set(tx, th / 2, tz);
    skylineGroup.add(tower);

    // Glowing window strips on distant silhouettes
    for (let f = 1; f < 4; f++) {
      const winGeom = new THREE.PlaneGeometry(tw * 0.75, 1.4);
      const winMesh = new THREE.Mesh(winGeom, (s + f) % 2 === 0 ? skylineWinMat : skylineWarmMat);
      winMesh.position.set(tx, f * (th / 4), tz);
      winMesh.lookAt(0, winMesh.position.y, 0);
      skylineGroup.add(winMesh);
    }

    // Spire beacon on tallest skyscrapers
    if (th > 70) {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 14, 6), metalGalvanized);
      spire.position.set(tx, th + 7, tz);
      skylineGroup.add(spire);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), neonRedMat);
      beacon.position.set(tx, th + 14, tz);
      skylineGroup.add(beacon);
    }
  }
  sceneGroup.add(skylineGroup);

  // ----------------------------------------------------
  // 1. GROUND PLANE & ROAD NETWORK
  // ----------------------------------------------------
  const citySize = 340;
  const groundGeom = new THREE.PlaneGeometry(citySize, citySize);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeom, asphaltMat);
  groundMesh.receiveShadow = true;
  sceneGroup.add(groundMesh);

  // Main Avenue (Z-axis, X=0) and Cross Boulevard (X-axis, Z=0)
  // Double Yellow Center Lines (Avenue Z)
  [-0.22, 0.22].forEach((offset) => {
    const doubleLineZGeom = new THREE.PlaneGeometry(0.18, 320);
    doubleLineZGeom.rotateX(-Math.PI / 2);
    const lineZ = new THREE.Mesh(doubleLineZGeom, roadLineYellow);
    lineZ.position.set(offset, 0.02, 0);
    sceneGroup.add(lineZ);

    const doubleLineXGeom = new THREE.PlaneGeometry(320, 0.18);
    doubleLineXGeom.rotateX(-Math.PI / 2);
    const lineX = new THREE.Mesh(doubleLineXGeom, roadLineYellow);
    lineX.position.set(0, 0.02, offset);
    sceneGroup.add(lineX);
  });

  // White Dashed Lane Dividers (Avenue Z: X = -4.5, +4.5)
  [-4.5, 4.5].forEach((laneX) => {
    for (let z = -150; z <= 150; z += 6) {
      if (Math.abs(z) < 16) continue; // Skip intersection
      const dashGeom = new THREE.PlaneGeometry(0.2, 3.2);
      dashGeom.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeom, roadLineWhite);
      dash.position.set(laneX, 0.022, z);
      sceneGroup.add(dash);
    }
  });

  // White Dashed Lane Dividers (Boulevard X: Z = -4.5, +4.5)
  [-4.5, 4.5].forEach((laneZ) => {
    for (let x = -150; x <= 150; x += 6) {
      if (Math.abs(x) < 16) continue;
      const dashGeom = new THREE.PlaneGeometry(3.2, 0.2);
      dashGeom.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeom, roadLineWhite);
      dash.position.set(x, 0.022, laneZ);
      sceneGroup.add(dash);
    }
  });

  // Pedestrian Zebra Crossings at Main Intersection
  const makeZebraCrossing = (x: number, z: number, isVertical: boolean) => {
    const stripes = 8;
    const stripeWidth = 0.8;
    const stripeLength = 4.2;
    const gap = 1.3;

    for (let i = 0; i < stripes; i++) {
      const offset = (i - (stripes - 1) / 2) * gap;
      const stripeGeom = isVertical
        ? new THREE.PlaneGeometry(stripeWidth, stripeLength)
        : new THREE.PlaneGeometry(stripeLength, stripeWidth);
      stripeGeom.rotateX(-Math.PI / 2);
      const stripe = new THREE.Mesh(stripeGeom, roadLineWhite);
      if (isVertical) {
        stripe.position.set(x + offset, 0.024, z);
      } else {
        stripe.position.set(x, 0.024, z + offset);
      }
      sceneGroup.add(stripe);
    }
  };

  makeZebraCrossing(0, -12, true);
  makeZebraCrossing(0, 12, true);
  makeZebraCrossing(-12, 0, false);
  makeZebraCrossing(12, 0, false);

  // Cast Iron Storm Drains & Manhole Covers
  const drainMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.4 });
  const drainPositions = [
    { x: -8.8, z: -18 },
    { x: 8.8, z: -18 },
    { x: -8.8, z: 18 },
    { x: 8.8, z: 18 },
    { x: -18, z: -8.8 },
    { x: 18, z: -8.8 },
    { x: -18, z: 8.8 },
    { x: 18, z: 8.8 },
  ];
  drainPositions.forEach((dp) => {
    const drainMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), drainMat);
    drainMesh.rotateX(-Math.PI / 2);
    drainMesh.position.set(dp.x, 0.025, dp.z);
    sceneGroup.add(drainMesh);
  });

  // Manhole Covers (circular ribbed discs)
  const manholePositions = [
    { x: -2.5, z: -35 },
    { x: 2.5, z: 35 },
    { x: -35, z: 2.5 },
    { x: 35, z: -2.5 },
  ];
  manholePositions.forEach((mp) => {
    const mhGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.02, 16);
    const mhMesh = new THREE.Mesh(mhGeom, drainMat);
    mhMesh.position.set(mp.x, 0.02, mp.z);
    sceneGroup.add(mhMesh);
  });

  // ----------------------------------------------------
  // 2. RAISED SIDEWALKS & CONCRETE CURBS
  // ----------------------------------------------------
  const createSidewalkBlock = (
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    curbBevel: boolean = true
  ) => {
    const group = new THREE.Group();

    // Sidewalk slab
    const slabHeight = 0.22;
    const slabGeom = new THREE.BoxGeometry(width, slabHeight, depth);
    const slab = new THREE.Mesh(slabGeom, sidewalkMat);
    slab.position.set(centerX, slabHeight / 2, centerZ);
    slab.receiveShadow = true;
    group.add(slab);

    // Beveled curb border trim
    if (curbBevel) {
      const curbTrimGeom = new THREE.BoxGeometry(width + 0.1, 0.24, depth + 0.1);
      const curbTrim = new THREE.Mesh(curbTrimGeom, curbMat);
      curbTrim.position.set(centerX, 0.12, centerZ);
      curbTrim.receiveShadow = true;
      group.add(curbTrim);
    }

    sceneGroup.add(group);
  };

  // 4 City Quadrants Sidewalk Blocks (offset from road width of 18m)
  createSidewalkBlock(-52, -52, 82, 82);
  createSidewalkBlock(52, -52, 82, 82);
  createSidewalkBlock(-52, 52, 82, 82);
  createSidewalkBlock(52, 52, 82, 82);

  // ----------------------------------------------------
  // 3. MODERN ORGANIC CITY TREES & FOLIAGE
  // ----------------------------------------------------
  const createCityTree = (x: number, z: number, scale: number = 1.0) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0.22, z);

    // Bronze sidewalk planter grate
    const grateGeom = new THREE.CylinderGeometry(1.1, 1.1, 0.04, 16);
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
    const grate = new THREE.Mesh(grateGeom, grateMat);
    grate.position.y = 0.02;
    treeGroup.add(grate);

    // Wooden trunk (tapered cylinder with bark roughness)
    const trunkGeom = new THREE.CylinderGeometry(0.14 * scale, 0.22 * scale, 3.2 * scale, 10);
    trunkGeom.computeVertexNormals();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 1.6 * scale;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Smooth stylized organic foliage canopy (3 overlapping soft volumes)
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });

    const canopy1Geom = new THREE.IcosahedronGeometry(1.4 * scale, 1);
    canopy1Geom.scale(1.1, 1.2, 1.0);
    canopy1Geom.computeVertexNormals();
    const c1 = new THREE.Mesh(canopy1Geom, leafMat1);
    c1.position.y = 3.6 * scale;
    c1.castShadow = true;
    treeGroup.add(c1);

    const canopy2Geom = new THREE.IcosahedronGeometry(1.1 * scale, 1);
    canopy2Geom.scale(1.2, 0.9, 1.1);
    canopy2Geom.computeVertexNormals();
    const c2 = new THREE.Mesh(canopy2Geom, leafMat2);
    c2.position.set(0.3 * scale, 4.2 * scale, -0.2 * scale);
    c2.castShadow = true;
    treeGroup.add(c2);

    sceneGroup.add(treeGroup);
    addCollision(x, z, 0.6, 0.6, 4.0, 'prop');
  };

  // Avenue Street Trees planted in sidewalk tree wells
  const treeSpots = [
    { x: -11.5, z: -25 },
    { x: -11.5, z: -45 },
    { x: -11.5, z: 25 },
    { x: -11.5, z: 45 },
    { x: 11.5, z: -25 },
    { x: 11.5, z: -45 },
    { x: 11.5, z: 25 },
    { x: 11.5, z: 45 },
  ];
  treeSpots.forEach((ts) => createCityTree(ts.x, ts.z, 1.05));

  // ----------------------------------------------------
  // 4. POLICE STATION PRECINCT 9 (Quadrant: -X, +Z)
  // Modern civic architectural pavilion with glass atrium, illuminated canopy & helipad
  // ----------------------------------------------------
  const policeX = -45;
  const policeZ = 45;
  const policeStationGroup = new THREE.Group();

  // Main concrete architectural tower (multi-tiered)
  const psTowerGeom = new THREE.BoxGeometry(28, 16, 26);
  const psTower = new THREE.Mesh(psTowerGeom, concreteFacadeMat);
  psTower.position.set(policeX, 8, policeZ);
  psTower.castShadow = true;
  psTower.receiveShadow = true;
  policeStationGroup.add(psTower);
  addCollision(policeX, policeZ, 28, 26, 16);

  // Recessed tinted ribbon windows on facade
  for (let floor = 1; floor <= 3; floor++) {
    const winStripGeom = new THREE.BoxGeometry(22, 1.6, 0.2);
    const winStrip = new THREE.Mesh(winStripGeom, illuminatedGlassMat);
    winStrip.position.set(policeX, floor * 3.8 + 2.0, policeZ - 13.1);
    policeStationGroup.add(winStrip);
  }

  // Front Glass Atrium Lobby (cantilevered entrance)
  const atriumGeom = new THREE.BoxGeometry(16, 5.2, 6);
  const atrium = new THREE.Mesh(atriumGeom, glassMat);
  atrium.position.set(policeX, 2.6, policeZ - 16);
  atrium.castShadow = true;
  policeStationGroup.add(atrium);
  addCollision(policeX, policeZ - 16, 16, 6, 5.2);

  // Entrance Illuminated Police Canopy
  const psCanopyGeom = new THREE.BoxGeometry(18, 0.4, 4.5);
  const psCanopy = new THREE.Mesh(psCanopyGeom, metalDarkMat);
  psCanopy.position.set(policeX, 5.2, policeZ - 17.5);
  policeStationGroup.add(psCanopy);

  // Blue LED Accent strip under canopy
  const blueStripGeom = new THREE.PlaneGeometry(17.6, 0.15);
  const blueStrip = new THREE.Mesh(blueStripGeom, neonBlueMat);
  blueStrip.position.set(policeX, 5.0, policeZ - 15.2);
  policeStationGroup.add(blueStrip);

  // Front Marquee Sign: "PRECINCT 9 METRO POLICE"
  const psSignGeom = new THREE.BoxGeometry(14, 1.8, 0.3);
  const psSign = new THREE.Mesh(psSignGeom, neonBlueMat);
  psSign.position.set(policeX, 6.2, policeZ - 17.3);
  policeStationGroup.add(psSign);

  // Communication Tower with blinking aviation warning light
  const towerGeom = new THREE.CylinderGeometry(0.2, 0.9, 16, 8);
  const tower = new THREE.Mesh(towerGeom, metalGalvanized);
  tower.position.set(policeX - 9, 24, policeZ + 7);
  policeStationGroup.add(tower);

  const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), neonRedMat);
  redBeacon.position.set(policeX - 9, 32.2, policeZ + 7);
  policeStationGroup.add(redBeacon);

  // Marked Rooftop Helipad
  const helipadGeom = new THREE.CylinderGeometry(6.5, 6.5, 0.15, 24);
  const helipadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const helipad = new THREE.Mesh(helipadGeom, helipadMat);
  helipad.position.set(policeX + 5, 16.1, policeZ);
  policeStationGroup.add(helipad);

  // Yellow Helipad "H" Marking
  const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 5.0), roadLineYellow);
  hBar1.rotateX(-Math.PI / 2);
  hBar1.position.set(policeX + 3.8, 16.2, policeZ);
  policeStationGroup.add(hBar1);

  const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 5.0), roadLineYellow);
  hBar2.rotateX(-Math.PI / 2);
  hBar2.position.set(policeX + 6.2, 16.2, policeZ);
  policeStationGroup.add(hBar2);

  const hCross = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), roadLineYellow);
  hCross.rotateX(-Math.PI / 2);
  hCross.position.set(policeX + 5.0, 16.2, policeZ);
  policeStationGroup.add(hCross);

  sceneGroup.add(policeStationGroup);

  // ----------------------------------------------------
  // 5. METRO BANK & FINANCIAL PLAZA (Quadrant: +X, -Z)
  // Modern corporate skyscraper podium with polished piers, glass curtain & ATMs
  // ----------------------------------------------------
  const bankX = 45;
  const bankZ = -45;
  const bankGroup = new THREE.Group();

  // Soaring Bank Tower
  const bankTowerGeom = new THREE.BoxGeometry(32, 28, 28);
  const bankTowerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  const bankTower = new THREE.Mesh(bankTowerGeom, bankTowerMat);
  bankTower.position.set(bankX, 14, bankZ);
  bankTower.castShadow = true;
  bankGroup.add(bankTower);
  addCollision(bankX, bankZ, 32, 28, 28);

  // Architectural Glass Curtain Wall Grid
  for (let fl = 1; fl <= 5; fl++) {
    const curStripGeom = new THREE.BoxGeometry(26, 2.8, 0.2);
    const curStrip = new THREE.Mesh(curStripGeom, illuminatedGlassMat);
    curStrip.position.set(bankX, fl * 4.6 + 2.0, bankZ + 14.1);
    bankGroup.add(curStrip);
  }

  // Classical Modern Granite Piers along entrance
  [-11, -5.5, 0, 5.5, 11].forEach((colX) => {
    const pierGeom = new THREE.BoxGeometry(1.4, 12, 1.4);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.2 });
    const pier = new THREE.Mesh(pierGeom, pierMat);
    pier.position.set(bankX + colX, 6, bankZ + 15.5);
    pier.castShadow = true;
    bankGroup.add(pier);
    addCollision(bankX + colX, bankZ + 15.5, 1.4, 1.4, 12, 'prop');
  });

  // Bank Gold Neon Marquee
  const bankSignGeom = new THREE.BoxGeometry(20, 2.4, 0.4);
  const bankSign = new THREE.Mesh(bankSignGeom, neonGoldMat);
  bankSign.position.set(bankX, 13.5, bankZ + 16.0);
  bankGroup.add(bankSign);

  // Outdoor ATM Kiosks with glowing user interfaces
  [-13, 13].forEach((atmX) => {
    const atmKioskGeom = new THREE.BoxGeometry(1.6, 2.4, 1.2);
    const atmKiosk = new THREE.Mesh(atmKioskGeom, metalDarkMat);
    atmKiosk.position.set(bankX + atmX, 1.2, bankZ + 16.5);
    atmKiosk.castShadow = true;
    bankGroup.add(atmKiosk);

    const atmScreenGeom = new THREE.PlaneGeometry(0.8, 0.6);
    const atmScreen = new THREE.Mesh(atmScreenGeom, neonBlueMat);
    atmScreen.position.set(bankX + atmX, 1.5, bankZ + 17.11);
    bankGroup.add(atmScreen);
    addCollision(bankX + atmX, bankZ + 16.5, 1.6, 1.2, 2.4, 'prop');
  });

  sceneGroup.add(bankGroup);

  // ----------------------------------------------------
  // 6. INDUSTRIAL DOCKS & LOGISTICS WAREHOUSE (Quadrant: +X, +Z)
  // Corrugated steel terminal with bay doors, gantry frame & ISO shipping containers
  // ----------------------------------------------------
  const whX = 45;
  const whZ = 45;
  const whGroup = new THREE.Group();

  // Distribution Terminal Hall
  const whHallGeom = new THREE.BoxGeometry(36, 14, 32);
  const whHallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.55 });
  const whHall = new THREE.Mesh(whHallGeom, whHallMat);
  whHall.position.set(whX, 7, whZ);
  whHall.castShadow = true;
  whGroup.add(whHall);
  addCollision(whX, whZ, 36, 32, 14);

  // Roll-Up Overhead Bay Doors with Hazard Chevron Stripes
  [-9, 0, 9].forEach((bayX) => {
    const bayDoorGeom = new THREE.BoxGeometry(6.5, 5.2, 0.3);
    const bayDoor = new THREE.Mesh(bayDoorGeom, metalGalvanized);
    bayDoor.position.set(whX + bayX, 2.6, whZ - 16.1);
    whGroup.add(bayDoor);

    // Hazard caution header bar
    const hazardGeom = new THREE.BoxGeometry(7.0, 0.6, 0.4);
    const hazard = new THREE.Mesh(hazardGeom, roadLineYellow);
    hazard.position.set(whX + bayX, 5.4, whZ - 16.1);
    whGroup.add(hazard);
  });

  // Crimson Warehouse Marquee Sign
  const whSignGeom = new THREE.BoxGeometry(22, 2.2, 0.4);
  const whSign = new THREE.Mesh(whSignGeom, neonRedMat);
  whSign.position.set(whX, 11, whZ - 16.2);
  whGroup.add(whSign);

  // Realistic ISO Intermodal Shipping Containers
  const containerColors = [0x0284c7, 0xd97706, 0xdc2626, 0x16a34a, 0x475569];
  const containers = [
    { x: whX - 22, z: whZ + 4, y: 1.5, rot: 0, color: containerColors[0] },
    { x: whX - 22, z: whZ + 4, y: 4.5, rot: 0, color: containerColors[1] },
    { x: whX - 22, z: whZ - 10, y: 1.5, rot: 0.08, color: containerColors[2] },
    { x: whX + 10, z: whZ - 20, y: 1.5, rot: 1.57, color: containerColors[3] },
    { x: whX - 8, z: whZ - 20, y: 1.5, rot: 1.57, color: containerColors[4] },
    { x: whX + 22, z: whZ + 2, y: 1.5, rot: 0.2, color: containerColors[1] },
  ];

  containers.forEach((cp) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cp.x, cp.y, cp.z);
    cGroup.rotation.y = cp.rot;

    const cGeom = new THREE.BoxGeometry(10, 3, 3.8);
    const cMat = new THREE.MeshStandardMaterial({ color: cp.color, roughness: 0.7, metalness: 0.4 });
    const cMesh = new THREE.Mesh(cGeom, cMat);
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    cGroup.add(cMesh);

    // Corner Castings
    [-4.9, 4.9].forEach((cx) => {
      [-1.4, 1.4].forEach((cy) => {
        [-1.8, 1.8].forEach((cz) => {
          const cornerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), metalDarkMat);
          cornerMesh.position.set(cx, cy, cz);
          cGroup.add(cornerMesh);
        });
      });
    });

    whGroup.add(cGroup);
    if (cp.y < 2) {
      addCollision(cp.x, cp.z, 10, 4, 3, 'barrier');
    }
  });

  sceneGroup.add(whGroup);

  // ----------------------------------------------------
  // 7. COMMERCIAL DISTRICT & INVESTIGATION ALLEYWAY (Quadrant: -X, -Z)
  // Multi-tier retail storefronts, boutique awnings, neon channel signs,
  // and deep detailed alleyway with fire escapes, wall conduits, HVAC fans & dumpsters.
  // Alleyway corridor runs from Z = -12 to Z = -42 between X = -32 and X = -24.
  // ----------------------------------------------------
  const commercialGroup = new THREE.Group();

  // Building 4A: Metro Pharmacy & Mart (West of alley, X: -42 to -32)
  const b4aGeom = new THREE.BoxGeometry(18, 18, 32);
  const b4aMesh = new THREE.Mesh(b4aGeom, concreteFacadeMat);
  b4aMesh.position.set(-41, 9, -27);
  b4aMesh.castShadow = true;
  b4aMesh.receiveShadow = true;
  commercialGroup.add(b4aMesh);
  addCollision(-41, -27, 18, 32, 18);

  // Pharmacy Storefront Glass & Display Window
  const b4aWindow = new THREE.Mesh(new THREE.BoxGeometry(13, 3.8, 0.3), warmWindowMat);
  b4aWindow.position.set(-41, 2.1, -10.8);
  commercialGroup.add(b4aWindow);

  // Pharmacy Fabric Canopy / Awning
  const awningGeom = new THREE.BoxGeometry(14, 0.25, 3.2);
  const awningMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  const awning = new THREE.Mesh(awningGeom, awningMat);
  awning.position.set(-41, 4.3, -9.4);
  awning.rotation.x = 0.18;
  commercialGroup.add(awning);

  // Neon Green Medical Cross Sign
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 0.3), neonGreenMat);
  crossV.position.set(-41, 13.5, -10.8);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 0.3), neonGreenMat);
  crossH.position.set(-41, 13.5, -10.8);
  commercialGroup.add(crossV);
  commercialGroup.add(crossH);

  // Building 4B: Syndicate Lounge & Apex Coffee (East of alley, X: -24 to -14)
  const b4bGeom = new THREE.BoxGeometry(18, 20, 32);
  const b4bMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const b4bMesh = new THREE.Mesh(b4bGeom, b4bMat);
  b4bMesh.position.set(-15, 10, -27);
  b4bMesh.castShadow = true;
  b4bMesh.receiveShadow = true;
  commercialGroup.add(b4bMesh);
  addCollision(-15, -27, 18, 32, 20);

  // Syndicate Lounge Velvet Neon Sign
  const loungeSign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 0.3), neonGoldMat);
  loungeSign.position.set(-15, 14, -10.8);
  commercialGroup.add(loungeSign);

  // Warm Coffee Shop Display Windows
  const coffeeWin = new THREE.Mesh(new THREE.BoxGeometry(12, 3.6, 0.3), warmWindowMat);
  coffeeWin.position.set(-15, 2.1, -10.8);
  commercialGroup.add(coffeeWin);

  // Detailed Commercial Alleyway Corridor (X: -32 to -24, Z: -12 to -42)
  // Multi-tier Industrial Steel Fire Escapes (West Alley Wall at X = -31.8)
  [-18, -26, -34].forEach((zPos, idx) => {
    // Walkway platform
    const platformGeom = new THREE.BoxGeometry(1.6, 0.12, 3.8);
    const platform = new THREE.Mesh(platformGeom, metalGalvanized);
    platform.position.set(-31.0, 4.2 + idx * 3.6, zPos);
    platform.castShadow = true;
    commercialGroup.add(platform);

    // Perimeter Railing
    const railGeom = new THREE.BoxGeometry(1.6, 0.85, 0.08);
    const rail = new THREE.Mesh(railGeom, metalDarkMat);
    rail.position.set(-31.0, 4.65 + idx * 3.6, zPos + 1.85);
    commercialGroup.add(rail);

    // Angled Steel Ladder
    const ladderGeom = new THREE.BoxGeometry(0.08, 4.2, 0.7);
    ladderGeom.rotateZ(0.12);
    const ladder = new THREE.Mesh(ladderGeom, metalDarkMat);
    ladder.position.set(-31.7, 3.2 + idx * 3.6, zPos - 1.2);
    commercialGroup.add(ladder);
  });

  // HVAC Compressor Units with spinning fans
  [-16, -24, -32].forEach((zPos, idx) => {
    const hvacGeom = new THREE.BoxGeometry(0.8, 1.0, 1.4);
    const hvacMesh = new THREE.Mesh(hvacGeom, metalGalvanized);
    hvacMesh.position.set(-31.5, 3.2 + (idx % 2) * 1.6, zPos);
    commercialGroup.add(hvacMesh);

    // Fan grille
    const fanGrille = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12), metalDarkMat);
    fanGrille.rotateZ(Math.PI / 2);
    fanGrille.position.set(-31.05, 3.2 + (idx % 2) * 1.6, zPos);
    commercialGroup.add(fanGrille);
  });

  // Security Alley Doors with LED lights
  const secDoorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const door1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 1.3), secDoorMat);
  door1.position.set(-31.9, 1.2, -20);
  commercialGroup.add(door1);

  const doorLed1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), neonRedMat);
  doorLed1.position.set(-31.8, 2.5, -20);
  commercialGroup.add(doorLed1);

  const door2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 1.3), secDoorMat);
  door2.position.set(-23.9, 1.2, -28);
  commercialGroup.add(door2);

  const doorLed2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), neonGoldMat);
  doorLed2.position.set(-24.0, 2.5, -28);
  commercialGroup.add(doorLed2);

  // Alley Atmospheric Wall Sconces (casting warm downlight pools)
  [-17, -25, -33].forEach((zPos) => {
    const sconceGeom = new THREE.BoxGeometry(0.3, 0.15, 0.25);
    const sconce = new THREE.Mesh(sconceGeom, metalDarkMat);
    sconce.position.set(-31.7, 3.6, zPos);
    commercialGroup.add(sconce);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), neonGoldMat);
    bulb.position.set(-31.6, 3.45, zPos);
    commercialGroup.add(bulb);

    const sconceLight = new THREE.PointLight(0xfef08a, 1.2, 10);
    sconceLight.position.set(-30.5, 3.2, zPos);
    commercialGroup.add(sconceLight);
  });

  // Heavy-duty commercial dumpsters with molded hinged lids
  const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75, metalness: 0.25 });
  const dumpsters = [
    { x: -30.0, z: -17, rot: 0.05 },
    { x: -25.5, z: -27, rot: -0.04 },
    { x: -29.8, z: -35, rot: 0.12 },
  ];
  dumpsters.forEach((dp) => {
    const dGroup = new THREE.Group();
    dGroup.position.set(dp.x, 0.8, dp.z);
    dGroup.rotation.y = dp.rot;

    // Body
    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.5), dumpsterMat);
    dMesh.castShadow = true;
    dGroup.add(dMesh);

    // Curved molded lid
    const lidGeom = new THREE.BoxGeometry(2.44, 0.14, 1.54);
    const lidMesh = new THREE.Mesh(lidGeom, metalDarkMat);
    lidMesh.position.y = 0.82;
    dGroup.add(lidMesh);

    commercialGroup.add(dGroup);
    addCollision(dp.x, dp.z, 2.4, 1.5, 1.6, 'barrier');
  });

  // Wooden Pallets and Tactical Supply Crates in alleyway
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const crateSpots = [
    { x: -26.2, z: -19, s: 1.1 },
    { x: -26.0, z: -21, s: 0.9 },
    { x: -30.2, z: -29, s: 1.0 },
    { x: -30.2, z: -31, s: 1.2 },
  ];
  crateSpots.forEach((cs) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(cs.s, cs.s, cs.s), woodMat);
    crate.position.set(cs.x, cs.s / 2, cs.z);
    crate.castShadow = true;
    commercialGroup.add(crate);
    addCollision(cs.x, cs.z, cs.s, cs.s, cs.s, 'barrier');
  });

  sceneGroup.add(commercialGroup);

  // ----------------------------------------------------
  // 8. MODERN STREET FURNITURE & LIGHTING
  // Sleek curved LED streetlights, traffic signals, transit shelters & hydrants
  // ----------------------------------------------------
  // Sleek Modern LED Streetlights with downward spotlight cones
  const streetLightSpots = [
    { x: -9.5, z: -20, rot: Math.PI / 2 },
    { x: -9.5, z: -50, rot: Math.PI / 2 },
    { x: -9.5, z: 20, rot: Math.PI / 2 },
    { x: -9.5, z: 50, rot: Math.PI / 2 },
    { x: 9.5, z: -20, rot: -Math.PI / 2 },
    { x: 9.5, z: -50, rot: -Math.PI / 2 },
    { x: 9.5, z: 20, rot: -Math.PI / 2 },
    { x: 9.5, z: 50, rot: -Math.PI / 2 },
  ];

  streetLightSpots.forEach((sl) => {
    const slGroup = new THREE.Group();
    slGroup.position.set(sl.x, 0.22, sl.z);
    slGroup.rotation.y = sl.rot;

    // Base collar
    const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.4, 12), metalDarkMat);
    baseCollar.position.y = 0.2;
    slGroup.add(baseCollar);

    // Tapered vertical mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.8, 12), metalDarkMat);
    mast.position.y = 3.6;
    slGroup.add(mast);

    // Curved horizontal arm over roadway
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), metalDarkMat);
    arm.position.set(0, 6.9, 1.1);
    slGroup.add(arm);

    // Aerodynamic LED Luminaire head
    const luminaire = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.9), metalDarkMat);
    luminaire.position.set(0, 6.85, 2.1);
    slGroup.add(luminaire);

    // Emissive LED array panel
    const ledLens = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    ledLens.rotateX(Math.PI / 2);
    ledLens.position.set(0, 6.79, 2.1);
    slGroup.add(ledLens);

    // Soft downward spotlight pool
    const spot = new THREE.SpotLight(0xfffbeb, 2.2, 24, Math.PI / 4, 0.45, 1.2);
    spot.position.set(0, 6.7, 2.1);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0, 2.1);
    slGroup.add(targetObj);
    spot.target = targetObj;
    slGroup.add(spot);

    sceneGroup.add(slGroup);
    addCollision(sl.x, sl.z, 0.6, 0.6, 7.0, 'prop');
  });

  // Intersection Traffic Light Gantries
  const trafficSignalSpots = [
    { x: -9.5, z: -10, rot: 0 },
    { x: 9.5, z: 10, rot: Math.PI },
  ];
  trafficSignalSpots.forEach((ts) => {
    const tsGroup = new THREE.Group();
    tsGroup.position.set(ts.x, 0.22, ts.z);
    tsGroup.rotation.y = ts.rot;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.8, 10), metalDarkMat);
    post.position.y = 2.9;
    tsGroup.add(post);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.35), metalDarkMat);
    headBox.position.set(0, 4.8, 0);
    tsGroup.add(headBox);

    // Red, Yellow, Green signal lenses
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), neonRedMat);
    redLight.position.set(0, 5.2, 0.16);
    tsGroup.add(redLight);

    const greenLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x15803d })
    );
    greenLight.position.set(0, 4.4, 0.16);
    tsGroup.add(greenLight);

    sceneGroup.add(tsGroup);
    addCollision(ts.x, ts.z, 0.5, 0.5, 6.0, 'prop');
  });

  // Modern Glass Transit Bus Shelters
  const shelterSpots = [
    { x: -11.0, z: 10, rot: Math.PI / 2 },
    { x: 11.0, z: -10, rot: -Math.PI / 2 },
  ];
  shelterSpots.forEach((ss) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(ss.x, 0.22, ss.z);
    sGroup.rotation.y = ss.rot;

    // Roof canopy
    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 2.0), metalDarkMat);
    sRoof.position.set(0, 2.7, 0);
    sGroup.add(sRoof);

    // Tempered glass back wall
    const sGlass = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.5, 0.08), glassMat);
    sGlass.position.set(0, 1.35, -0.9);
    sGroup.add(sGlass);

    // Illuminated advertising poster box
    const adBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.4), warmWindowMat);
    adBox.position.set(1.9, 1.35, 0);
    sGroup.add(adBox);

    sceneGroup.add(sGroup);
    addCollision(ss.x, ss.z, 4.2, 2.0, 2.8, 'barrier');
  });

  // Modern Fire Hydrants & Smart Parking Meters
  const hydrantSpots = [
    { x: -9.5, z: -32 },
    { x: 9.5, z: 32 },
  ];
  hydrantSpots.forEach((hs) => {
    const hyd = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 12), neonRedMat);
    hyd.position.set(hs.x, 0.62, hs.z);
    hyd.castShadow = true;
    sceneGroup.add(hyd);
    addCollision(hs.x, hs.z, 0.4, 0.4, 0.8, 'prop');
  });

  // ----------------------------------------------------
  // 9. PARKED CIVILIAN VEHICLES (adds believable urban life and scale)
  // ----------------------------------------------------
  const parkedVehicles = [
    { x: -7.5, z: 34, rot: Math.PI, color: 0x2563eb }, // Royal blue sedan outside precinct
    { x: -7.5, z: -35, rot: 0, color: 0xd97706 },      // Amber gold compact outside deli
    { x: -7.5, z: -18, rot: 0, color: 0xdc2626 },      // Crimson hatchback outside coffee shop
    { x: 7.5, z: -35, rot: 0, color: 0x475569 },       // Slate SUV outside bank
    { x: 7.5, z: -18, rot: 0, color: 0x0284c7 },       // Sky blue coupe on avenue east
    { x: 7.5, z: 30, rot: Math.PI, color: 0x16a34a },  // Forest green wagon near docks
    { x: 7.5, z: 46, rot: Math.PI, color: 0xfbbf24 },  // Taxi yellow cab on avenue east
  ];

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  parkedVehicles.forEach((pv) => {
    const carGroup = new THREE.Group();
    carGroup.position.set(pv.x, 0, pv.z);
    carGroup.rotation.y = pv.rot;

    const carMat = new THREE.MeshStandardMaterial({ color: pv.color, roughness: 0.35, metalness: 0.6 });
    // Smooth chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.2), carMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Aerodynamic cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.52, 2.2), glassMat);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Headlights (front +Z)
    [-0.65, 0.65].forEach((hx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.08), headlightMat);
      hl.position.set(hx, 0.55, 2.1);
      carGroup.add(hl);
    });

    // Taillights (rear -Z)
    [-0.65, 0.65].forEach((tx) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.08), taillightMat);
      tl.position.set(tx, 0.55, -2.1);
      carGroup.add(tl);
    });

    // Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    [-0.95, 0.95].forEach((wx) => {
      [-1.2, 1.2].forEach((wz) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), tireMat);
        wheel.rotateZ(Math.PI / 2);
        wheel.position.set(wx, 0.32, wz);
        carGroup.add(wheel);
      });
    });

    sceneGroup.add(carGroup);
    addCollision(pv.x, pv.z, 2.0, 4.4, 1.5, 'barrier');
  });

  return {
    sceneGroup,
    collisionBoxes,
    spawnPoints: {
      player: new THREE.Vector3(-28, 0.20, 30), // Standing elevated on Precinct 9 sidewalk
      policeVehicle: new THREE.Vector3(-24, 0, 26), // Parked at precinct curb
      criminalVehicle: new THREE.Vector3(25, 0, 35), // Parked outside warehouse
      warehouse: new THREE.Vector3(whX, 0, whZ),
      bank: new THREE.Vector3(bankX, 0, bankZ),
      policeStation: new THREE.Vector3(policeX, 0, policeZ),
      harbor: new THREE.Vector3(whX + 20, 0, whZ + 20),
      enemies: [
        new THREE.Vector3(38, 0, 30),
        new THREE.Vector3(45, 0, 35),
        new THREE.Vector3(52, 0, 28),
        new THREE.Vector3(35, 0, -32),
        new THREE.Vector3(48, 0, -35),
      ],
      civilians: [
        new THREE.Vector3(-26, 0.20, 22), // Pedestrian on sidewalk near starting point
        new THREE.Vector3(-31, 0.20, 15), // Walking past deli
        new THREE.Vector3(-26, 0.20, 5),  // Near coffee shop
        new THREE.Vector3(-29, 0.20, -2), // Near pharmacy entrance
        new THREE.Vector3(-25, 0.20, -8), // Near commercial alley arch
        new THREE.Vector3(-14, 0.20, 15),
        new THREE.Vector3(14, 0.20, -25),
        new THREE.Vector3(14, 0.20, 18),
      ],
    },
  };
}
