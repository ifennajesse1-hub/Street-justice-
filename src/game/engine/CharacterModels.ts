import * as THREE from 'three';
import { EnemyType } from '../../types/game';

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponMesh?: THREE.Mesh;
  muzzleFlash?: THREE.Mesh;
  surrenderMarker?: THREE.Group;
  overheadHealthBar?: THREE.Group;
  healthFillMesh?: THREE.Mesh;
  accessoryGroup?: THREE.Group;
  accessoryType?: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'none';
  archetype?: string;
  type: 'player' | EnemyType | 'civilian' | 'police_npc';
  recoilTimer: number;
  flinchTimer: number;
}

// Helper models for civilian pedestrian accessories
function createBriefcaseMesh(): THREE.Group {
  const group = new THREE.Group();
  const matLeather = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.75 });
  const matBrass = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });

  const caseGeom = new THREE.BoxGeometry(0.08, 0.24, 0.32);
  const caseMesh = new THREE.Mesh(caseGeom, matLeather);
  caseMesh.castShadow = true;
  group.add(caseMesh);

  [-0.09, 0.09].forEach((lz) => {
    const latchGeom = new THREE.BoxGeometry(0.084, 0.025, 0.025);
    const latch = new THREE.Mesh(latchGeom, matBrass);
    latch.position.set(0, 0.07, lz);
    group.add(latch);
  });

  const handleGeom = new THREE.BoxGeometry(0.025, 0.05, 0.1);
  const handle = new THREE.Mesh(handleGeom, matLeather);
  handle.position.set(0, 0.14, 0);
  group.add(handle);

  group.position.set(0, -0.66, 0.04);
  return group;
}

function createPhoneMesh(): THREE.Group {
  const group = new THREE.Group();
  const matCase = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.2 });
  const matScreen = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const bodyGeom = new THREE.BoxGeometry(0.012, 0.11, 0.06);
  const phoneBody = new THREE.Mesh(bodyGeom, matCase);
  group.add(phoneBody);

  const screenGeom = new THREE.PlaneGeometry(0.054, 0.1);
  const screen = new THREE.Mesh(screenGeom, matScreen);
  screen.position.set(0.007, 0, 0);
  screen.rotateY(Math.PI / 2);
  group.add(screen);

  group.position.set(0.03, -0.52, 0.04);
  group.rotation.set(-0.35, 0.15, 0);
  return group;
}

function createCoffeeCupMesh(): THREE.Group {
  const group = new THREE.Group();
  const matCup = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const matSleeve = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const matLid = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });

  const cupGeom = new THREE.CylinderGeometry(0.038, 0.028, 0.11, 10);
  const cup = new THREE.Mesh(cupGeom, matCup);
  cup.castShadow = true;
  group.add(cup);

  const sleeveGeom = new THREE.CylinderGeometry(0.036, 0.032, 0.045, 10);
  const sleeve = new THREE.Mesh(sleeveGeom, matSleeve);
  sleeve.position.y = 0.01;
  group.add(sleeve);

  const lidGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.015, 10);
  const lid = new THREE.Mesh(lidGeom, matLid);
  lid.position.y = 0.06;
  group.add(lid);

  group.position.set(0, -0.55, 0.05);
  return group;
}

function createShoppingBagMesh(): THREE.Group {
  const group = new THREE.Group();
  const matBag = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const matHandle = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const bagGeom = new THREE.BoxGeometry(0.11, 0.22, 0.18);
  const bag = new THREE.Mesh(bagGeom, matBag);
  bag.position.y = -0.11;
  bag.castShadow = true;
  group.add(bag);

  const handleGeom = new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeom, matHandle);
  handle.position.set(0, 0.02, 0);
  handle.rotateY(Math.PI / 2);
  group.add(handle);

  group.position.set(0, -0.55, 0.04);
  return group;
}

/**
 * Creates smooth, modern low-poly character rigs with realistic human proportions,
 * natural silhouettes, recognizable faces, uniforms, gear, and procedural animation support.
 */
export function createCharacterMesh(
  type: 'player' | EnemyType | 'civilian' | 'police_npc',
  outfitVariant: string = 'default',
  displayName?: string
): CharacterRig {
  const root = new THREE.Group();

  // Color & Style Palette tailored to character archetypes
  let shirtColor = 0x1d4ed8; // Police royal navy
  let vestColor = 0x0f172a;  // Ballistic black/slate
  let pantsColor = 0x1e293b; // Tactical navy trousers
  let skinTone = 0xdeb887;   // Warm tan
  let hairOrCapColor = 0x0f172a;
  let shoeColor = 0x111827;  // Black combat boots
  let hasCap = true;
  let hasVest = true;
  let hasGlasses = false;

  if (type === 'thug') {
    shirtColor = 0xb91c1c; // Crimson streetwear hoodie
    vestColor = 0x3f3f46;  // Puffer vest
    pantsColor = 0x18181b; // Dark denim
    hairOrCapColor = 0x27272a;
    shoeColor = 0xe2e8f0;  // High-top sneakers
    hasCap = false;
    hasVest = false;
    hasGlasses = true;
  } else if (type === 'enforcer') {
    shirtColor = 0x334155; // Slate urban camo
    vestColor = 0x1e293b;  // Heavy tactical plate carrier
    pantsColor = 0x0f172a;
    hairOrCapColor = 0x18181b;
    shoeColor = 0x090d16;
    hasCap = true;
    hasVest = true;
    hasGlasses = true;
  } else if (type === 'boss') {
    shirtColor = 0x701a75; // Midnight plum tailored suit
    vestColor = 0xd97706;  // Gold embroidered armor vest
    pantsColor = 0x18181b; // Black dress trousers
    hairOrCapColor = 0x111827;
    shoeColor = 0x1c1917;  // Polished dress shoes
    hasCap = false;
    hasVest = true;
    hasGlasses = true;
  }

  let accessoryType: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'none' = 'none';

  if (type === 'civilian') {
    const arch = outfitVariant || 'commuter';
    if (arch === 'business') {
      shirtColor = 0xf8fafc;
      vestColor = [0x1e293b, 0x334155, 0x0f172a][Math.floor(Math.random() * 3)];
      pantsColor = 0x0f172a;
      shoeColor = 0x1c1917;
      hasCap = false;
      hasVest = true;
      hasGlasses = Math.random() > 0.4;
      accessoryType = Math.random() > 0.35 ? 'briefcase' : 'phone';
    } else if (arch === 'shopper') {
      const civShirts = [0xd97706, 0x059669, 0xdb2777, 0x7c3aed, 0xe11d48];
      shirtColor = civShirts[Math.floor(Math.random() * civShirts.length)];
      vestColor = 0x18181b;
      pantsColor = [0x334155, 0x1e293b, 0x475569][Math.floor(Math.random() * 3)];
      shoeColor = 0xf1f5f9;
      hasCap = Math.random() > 0.7;
      hasVest = false;
      hasGlasses = Math.random() > 0.5;
      accessoryType = 'shopping_bag';
    } else if (arch === 'jogger') {
      shirtColor = [0x06b6d4, 0x84cc16, 0xf97316, 0xec4899][Math.floor(Math.random() * 4)];
      vestColor = 0x090d16;
      pantsColor = 0x0f172a;
      shoeColor = 0x84cc16;
      hasCap = true;
      hasVest = false;
      hasGlasses = false;
      accessoryType = 'none';
    } else if (arch === 'tourist') {
      shirtColor = [0x0284c7, 0xd97706, 0x10b981][Math.floor(Math.random() * 3)];
      vestColor = 0x78350f;
      pantsColor = 0xd4d4d8;
      shoeColor = 0x78350f;
      hasCap = true;
      hasVest = false;
      hasGlasses = true;
      accessoryType = 'phone';
    } else if (arch === 'skittish') {
      shirtColor = 0x52525b;
      vestColor = 0x27272a;
      pantsColor = 0x18181b;
      shoeColor = 0x71717a;
      hasCap = true;
      hasVest = false;
      hasGlasses = false;
      accessoryType = Math.random() > 0.5 ? 'phone' : 'coffee';
    } else {
      // commuter
      shirtColor = [0x334155, 0x2563eb, 0x475569, 0x1e293b][Math.floor(Math.random() * 4)];
      vestColor = 0x0f172a;
      pantsColor = [0x1e293b, 0x334155, 0x18181b][Math.floor(Math.random() * 3)];
      shoeColor = 0x27272a;
      hasCap = Math.random() > 0.5;
      hasVest = false;
      hasGlasses = Math.random() > 0.5;
      accessoryType = Math.random() > 0.4 ? 'phone' : 'coffee';
    }

    const civSkins = [0xf5d0b5, 0xdeb887, 0xc68642, 0x8d5524];
    skinTone = civSkins[Math.floor(Math.random() * civSkins.length)];
    hairOrCapColor = [0x1c1917, 0x451a03, 0x78350f, 0x0f172a, 0x27272a][Math.floor(Math.random() * 5)];
  }

  // Outfit variants for Officer Carter
  if (type === 'player') {
    if (outfitVariant === 'tactical_swat') {
      shirtColor = 0x0f172a;
      vestColor = 0x020617;
      pantsColor = 0x1e293b;
      hasCap = true;
      hasGlasses = true;
    } else if (outfitVariant === 'detective') {
      shirtColor = 0x64748b;
      vestColor = 0x78350f; // Leather holster / trench vest
      pantsColor = 0x1e293b;
      hasCap = false;
      hasGlasses = true;
    }
  }

  // Smooth standard materials
  const matBody = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const matVest = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.75 });
  const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const matSkin = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.5 });
  const matCap = new THREE.MeshStandardMaterial({ color: hairOrCapColor, roughness: 0.5 });
  const matShoe = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.6 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
  const matSilver = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
  const matLeather = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
  const matGlasses = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.9 });

  // 1. TORSO (Anatomical tapered chest & waist with smooth normals)
  // Height: ~0.65m, Upper chest width: 0.46m, Waist: 0.38m
  const torsoGeom = new THREE.CylinderGeometry(0.24, 0.19, 0.66, 16);
  torsoGeom.scale(1.15, 1.0, 0.75); // Natural human chest-to-depth ratio
  torsoGeom.computeVertexNormals();

  const body = new THREE.Mesh(torsoGeom, matBody);
  body.position.y = 1.04;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Tactical Ballistic Vest or Layered Jacket
  if (hasVest) {
    const vestGeom = new THREE.CylinderGeometry(0.26, 0.21, 0.52, 16);
    vestGeom.scale(1.18, 1.0, 0.8);
    vestGeom.computeVertexNormals();
    const vest = new THREE.Mesh(vestGeom, matVest);
    vest.position.y = 0.04;
    vest.castShadow = true;
    body.add(vest);

    // Collar band
    const collarGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 14);
    collarGeom.scale(1.1, 1.0, 0.9);
    const collar = new THREE.Mesh(collarGeom, matVest);
    collar.position.y = 0.32;
    body.add(collar);

    // Shoulder strap epaulets
    [-0.22, 0.22].forEach((sx) => {
      const epGeom = new THREE.BoxGeometry(0.08, 0.04, 0.2);
      const ep = new THREE.Mesh(epGeom, matVest);
      ep.position.set(sx, 0.28, 0);
      body.add(ep);
    });

    // Law enforcement details
    if (type === 'player' || type === 'police_npc') {
      // Metallic Police Shield Badge on left chest
      const badgeGeom = new THREE.CylinderGeometry(0.045, 0.02, 0.08, 7);
      badgeGeom.rotateX(Math.PI / 2);
      const badge = new THREE.Mesh(badgeGeom, matGold);
      badge.position.set(-0.14, 0.12, 0.17);
      body.add(badge);

      // Body camera unit on center-left chest with indicator LED
      const bodyCamGeom = new THREE.BoxGeometry(0.06, 0.08, 0.04);
      const bodyCam = new THREE.Mesh(bodyCamGeom, matLeather);
      bodyCam.position.set(-0.02, 0.10, 0.18);
      body.add(bodyCam);

      const ledGeom = new THREE.SphereGeometry(0.012, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Active recording green LED
      const led = new THREE.Mesh(ledGeom, ledMat);
      led.position.set(-0.02, 0.12, 0.205);
      body.add(led);

      // Yellow reflective POLICE identification panel on back
      const stripGeom = new THREE.PlaneGeometry(0.32, 0.09);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
      const strip = new THREE.Mesh(stripGeom, stripMat);
      strip.position.set(0, 0.12, -0.175);
      body.add(strip);
    }
  }

  // Tactical Duty Belt with Holster, Pouches & Radio
  const beltGeom = new THREE.CylinderGeometry(0.21, 0.21, 0.09, 16);
  beltGeom.scale(1.15, 1.0, 0.78);
  const belt = new THREE.Mesh(beltGeom, matLeather);
  belt.position.y = -0.32;
  body.add(belt);

  // Metallic Belt Buckle
  const buckleGeom = new THREE.BoxGeometry(0.08, 0.06, 0.03);
  const buckle = new THREE.Mesh(buckleGeom, matSilver);
  buckle.position.set(0, -0.32, 0.175);
  body.add(buckle);

  // Radio unit on left hip with antenna and shoulder mic
  if (type === 'player' || type === 'police_npc') {
    const radioGeom = new THREE.BoxGeometry(0.07, 0.13, 0.06);
    const radio = new THREE.Mesh(radioGeom, matLeather);
    radio.position.set(-0.23, -0.28, 0.08);
    body.add(radio);

    const antGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 8);
    const ant = new THREE.Mesh(antGeom, matLeather);
    ant.position.set(-0.23, -0.14, 0.08);
    body.add(ant);

    // Shoulder mic on left collar
    const micGeom = new THREE.BoxGeometry(0.06, 0.06, 0.04);
    const mic = new THREE.Mesh(micGeom, matLeather);
    mic.position.set(-0.16, 0.26, 0.12);
    body.add(mic);
  }

  // 2. NECK & HEAD (Natural human facial silhouette with smooth cranial sphere)
  const neckGeom = new THREE.CylinderGeometry(0.07, 0.08, 0.12, 12);
  const neck = new THREE.Mesh(neckGeom, matSkin);
  neck.position.y = 0.38;
  body.add(neck);

  // Smooth cranial head
  const headGeom = new THREE.SphereGeometry(0.145, 16, 16);
  headGeom.scale(0.95, 1.16, 1.05);
  headGeom.computeVertexNormals();
  const head = new THREE.Mesh(headGeom, matSkin);
  head.position.y = 0.54;
  head.castShadow = true;
  body.add(head);

  // Stylized Nose Bridge
  const noseGeom = new THREE.ConeGeometry(0.022, 0.05, 5);
  noseGeom.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, matSkin);
  nose.position.set(0, -0.01, 0.155);
  head.add(nose);

  // Ears
  [-0.145, 0.145].forEach((ex) => {
    const earGeom = new THREE.SphereGeometry(0.03, 8, 8);
    earGeom.scale(0.4, 1.0, 0.7);
    const ear = new THREE.Mesh(earGeom, matSkin);
    ear.position.set(ex, 0, 0);
    head.add(ear);
  });

  // Tactical Glasses / Aviators / Sunglasses
  if (hasGlasses) {
    const frameGeom = new THREE.BoxGeometry(0.20, 0.03, 0.05);
    const frame = new THREE.Mesh(frameGeom, matGlasses);
    frame.position.set(0, 0.03, 0.14);
    head.add(frame);

    [-0.055, 0.055].forEach((lx) => {
      const lensGeom = new THREE.BoxGeometry(0.07, 0.045, 0.02);
      const lens = new THREE.Mesh(lensGeom, matGlasses);
      lens.position.set(lx, 0.02, 0.16);
      head.add(lens);
    });
  }

  // Headwear: Modern curved police cap, tactical cap, or stylized hair
  if (hasCap) {
    // Cap dome
    const capDomeGeom = new THREE.SphereGeometry(0.155, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    capDomeGeom.scale(0.98, 1.0, 1.08);
    const capDome = new THREE.Mesh(capDomeGeom, matCap);
    capDome.position.y = 0.04;
    head.add(capDome);

    // Curved front visor/brim
    const visorGeom = new THREE.CylinderGeometry(0.16, 0.18, 0.02, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const visor = new THREE.Mesh(visorGeom, matLeather);
    visor.position.set(0, 0.04, 0.07);
    visor.rotation.x = 0.15;
    head.add(visor);

    // Police gold cap emblem
    if (type === 'player' || type === 'police_npc') {
      const capEmblemGeom = new THREE.CylinderGeometry(0.03, 0.015, 0.01, 6);
      capEmblemGeom.rotateX(Math.PI / 2);
      const emblem = new THREE.Mesh(capEmblemGeom, matGold);
      emblem.position.set(0, 0.09, 0.155);
      head.add(emblem);
    }
  } else {
    // Natural stylized hair silhouette
    const hairGeom = new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    hairGeom.scale(1.0, 1.08, 1.08);
    hairGeom.computeVertexNormals();
    const hair = new THREE.Mesh(hairGeom, matCap);
    hair.position.set(0, 0.04, -0.01);
    head.add(hair);
  }

  // 3. ARMS & HANDS (Anatomical articulated limbs with shoulder, forearm, and gripping hand)
  const createArm = (isRight: boolean) => {
    const armGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    armGroup.position.set(side * 0.32, 0.24, 0);

    // Smooth rounded shoulder
    const shoulderGeom = new THREE.SphereGeometry(0.08, 10, 10);
    const shoulder = new THREE.Mesh(shoulderGeom, matBody);
    armGroup.add(shoulder);

    // Upper arm
    const upperArmGeom = new THREE.CylinderGeometry(0.07, 0.06, 0.28, 12);
    upperArmGeom.computeVertexNormals();
    const upperArm = new THREE.Mesh(upperArmGeom, matBody);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    // Forearm & tactical cuff
    const forearmGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12);
    forearmGeom.computeVertexNormals();
    const forearm = new THREE.Mesh(forearmGeom, hasVest ? matBody : matSkin);
    forearm.position.y = -0.38;
    forearm.castShadow = true;
    armGroup.add(forearm);

    // Tactical Glove / Hand with sculpted palm and curled fingers
    const handGeom = new THREE.BoxGeometry(0.07, 0.09, 0.08);
    const hand = new THREE.Mesh(handGeom, hasVest ? matLeather : matSkin);
    hand.position.set(0, -0.52, 0.02);
    hand.castShadow = true;
    armGroup.add(hand);

    return armGroup;
  };

  const leftArm = createArm(false);
  body.add(leftArm);

  const rightArm = createArm(true);
  body.add(rightArm);

  // Weapon in right hand (for combatants: Player, Police, Gang members)
  let weaponMesh: THREE.Mesh | undefined;
  let muzzleFlash: THREE.Mesh | undefined;

  if (type !== 'civilian') {
    const gunGroup = new THREE.Group();

    // Firearm slide / receiver
    const slideGeom = new THREE.BoxGeometry(0.07, 0.09, 0.32);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.25 });
    const slide = new THREE.Mesh(slideGeom, gunMat);
    slide.position.set(0, 0, 0.08);
    gunGroup.add(slide);

    // Barrel tip
    const barrelGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.06, 10);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, gunMat);
    barrel.position.set(0, 0.02, 0.26);
    gunGroup.add(barrel);

    // Pistol grip
    const gripGeom = new THREE.BoxGeometry(0.06, 0.14, 0.08);
    gripGeom.rotateX(0.25);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeom, gripMat);
    grip.position.set(0, -0.08, -0.02);
    gunGroup.add(grip);

    // Tactical weapon light / under-barrel laser
    const lightGeom = new THREE.BoxGeometry(0.04, 0.03, 0.10);
    const lightMesh = new THREE.Mesh(lightGeom, gunMat);
    lightMesh.position.set(0, -0.045, 0.14);
    gunGroup.add(lightMesh);

    // Muzzle Flash effect (additive sphere)
    const flashGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
    muzzleFlash.position.set(0, 0.02, 0.32);
    gunGroup.add(muzzleFlash);

    // Attach to right hand
    weaponMesh = slide;
    gunGroup.position.set(0, -0.55, 0.16);
    gunGroup.castShadow = true;
    rightArm.add(gunGroup);
  }

  // Civilian Handheld Accessories (Briefcase, Smartphone, Coffee Cup, Shopping Bag)
  let accessoryGroup: THREE.Group | undefined;
  if (type === 'civilian' && accessoryType !== 'none') {
    if (accessoryType === 'phone') {
      accessoryGroup = createPhoneMesh();
      rightArm.add(accessoryGroup);
    } else if (accessoryType === 'briefcase') {
      accessoryGroup = createBriefcaseMesh();
      rightArm.add(accessoryGroup);
    } else if (accessoryType === 'coffee') {
      accessoryGroup = createCoffeeCupMesh();
      rightArm.add(accessoryGroup);
    } else if (accessoryType === 'shopping_bag') {
      accessoryGroup = createShoppingBagMesh();
      rightArm.add(accessoryGroup);
    }
  }

  // 4. LEGS & TACTICAL BOOTS (Anatomical thighs, knee pads, calves, and contoured boots)
  const createLeg = (isRight: boolean) => {
    const legGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    legGroup.position.set(side * 0.14, 0.72, 0);

    // Thigh with smooth tapered cylinder
    const thighGeom = new THREE.CylinderGeometry(0.11, 0.09, 0.36, 12);
    thighGeom.computeVertexNormals();
    const thigh = new THREE.Mesh(thighGeom, matPants);
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Tactical Drop-Leg Holster on right thigh
    if (isRight && (type === 'player' || type === 'police_npc')) {
      const holsterPlateGeom = new THREE.BoxGeometry(0.03, 0.18, 0.12);
      const holsterPlate = new THREE.Mesh(holsterPlateGeom, matLeather);
      holsterPlate.position.set(0.11, -0.18, 0.02);
      legGroup.add(holsterPlate);

      // Sidearm grip in holster
      const holsterPistolGeom = new THREE.BoxGeometry(0.04, 0.10, 0.06);
      const holsterPistol = new THREE.Mesh(holsterPistolGeom, matLeather);
      holsterPistol.position.set(0.13, -0.12, 0.03);
      legGroup.add(holsterPistol);
    }

    // Protective Knee Pad
    const padGeom = new THREE.BoxGeometry(0.11, 0.09, 0.05);
    const pad = new THREE.Mesh(padGeom, matLeather);
    pad.position.set(0, -0.36, 0.08);
    legGroup.add(pad);

    // Calf
    const calfGeom = new THREE.CylinderGeometry(0.09, 0.075, 0.32, 12);
    calfGeom.computeVertexNormals();
    const calf = new THREE.Mesh(calfGeom, matPants);
    calf.position.y = -0.48;
    calf.castShadow = true;
    legGroup.add(calf);

    // Contoured Combat Boot / Sneaker
    const bootShaftGeom = new THREE.CylinderGeometry(0.08, 0.085, 0.14, 10);
    const bootShaft = new THREE.Mesh(bootShaftGeom, matShoe);
    bootShaft.position.set(0, -0.62, 0);
    legGroup.add(bootShaft);

    // Contoured foot & sole
    const footGeom = new THREE.BoxGeometry(0.13, 0.10, 0.25);
    const foot = new THREE.Mesh(footGeom, matShoe);
    foot.position.set(0, -0.67, 0.05);
    foot.castShadow = true;
    legGroup.add(foot);

    return legGroup;
  };

  const leftLeg = createLeg(false);
  root.add(leftLeg);

  const rightLeg = createLeg(true);
  root.add(rightLeg);

  // Surrender indicator marker (floating handcuffs icon)
  let surrenderMarker: THREE.Group | undefined;
  if (type === 'thug' || type === 'enforcer') {
    surrenderMarker = new THREE.Group();
    surrenderMarker.position.set(0, 2.3, 0);

    const ringGeom = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ringL = new THREE.Mesh(ringGeom, ringMat);
    ringL.position.x = -0.14;
    surrenderMarker.add(ringL);

    const ringR = new THREE.Mesh(ringGeom, ringMat);
    ringR.position.x = 0.14;
    surrenderMarker.add(ringR);

    const barGeom = new THREE.BoxGeometry(0.16, 0.03, 0.03);
    const bar = new THREE.Mesh(barGeom, ringMat);
    surrenderMarker.add(bar);

    surrenderMarker.visible = false;
    root.add(surrenderMarker);
  }

  // Overhead 3D Health Bar (for enemies)
  let overheadHealthBar: THREE.Group | undefined;
  let healthFillMesh: THREE.Mesh | undefined;

  if (type !== 'player' && type !== 'civilian') {
    overheadHealthBar = new THREE.Group();
    overheadHealthBar.position.set(0, 2.05, 0);

    // Dark backdrop bar
    const bgGeom = new THREE.PlaneGeometry(1.0, 0.14);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide });
    const bgMesh = new THREE.Mesh(bgGeom, bgMat);
    overheadHealthBar.add(bgMesh);

    // Red damage background
    const redGeom = new THREE.PlaneGeometry(0.96, 0.1);
    const redMat = new THREE.MeshBasicMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
    const redMesh = new THREE.Mesh(redGeom, redMat);
    redMesh.position.z = 0.005;
    overheadHealthBar.add(redMesh);

    // Dynamic health fill bar
    const fillGeom = new THREE.PlaneGeometry(0.96, 0.1);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    healthFillMesh = new THREE.Mesh(fillGeom, fillMat);
    healthFillMesh.position.z = 0.01;
    overheadHealthBar.add(healthFillMesh);

    root.add(overheadHealthBar);
  }

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponMesh,
    muzzleFlash,
    surrenderMarker,
    overheadHealthBar,
    healthFillMesh,
    accessoryGroup,
    accessoryType,
    archetype: outfitVariant,
    type,
    recoilTimer: 0,
    flinchTimer: 0,
  };
}

/**
 * Natural procedural animation for characters:
 * smooth multi-joint stride cycles, aiming stance, surrender pose, hit flinches,
 * panic fleeing, cowering from gunfire, idling with phones/coffee, and vehicle evasion.
 */
export function updateCharacterAnimation(
  rig: CharacterRig,
  speed: number,
  time: number,
  isAiming: boolean = false,
  isCrouching: boolean = false,
  state?: string,
  camera?: THREE.Camera,
  healthPercent: number = 1.0
) {
  // Billboard overhead health bar towards active camera
  if (rig.overheadHealthBar && camera) {
    rig.overheadHealthBar.quaternion.copy(camera.quaternion);
  }

  // Update health fill width
  if (rig.healthFillMesh) {
    const clampedRatio = Math.max(0.001, Math.min(1.0, healthPercent));
    rig.healthFillMesh.scale.x = clampedRatio;
    rig.healthFillMesh.position.x = (clampedRatio - 1.0) * 0.48;

    const mat = rig.healthFillMesh.material as THREE.MeshBasicMaterial;
    if (clampedRatio > 0.5) {
      mat.color.setHex(0x22c55e); // Green
    } else if (clampedRatio > 0.25) {
      mat.color.setHex(0xeab308); // Amber
    } else {
      mat.color.setHex(0xef4444); // Red
    }
  }

  // 1. If dead (fallen)
  if (state === 'dead') {
    rig.root.rotation.x = -Math.PI / 2;
    rig.body.position.y = 0.35;
    return;
  }

  // 2. If cowering (pedestrians ducking under fire or danger)
  if (state === 'cowering') {
    rig.body.position.y = 0.62 + Math.sin(time * 24) * 0.012;
    rig.head.rotation.x = 0.35;
    rig.head.rotation.y = 0;
    rig.leftLeg.rotation.x = 1.15;
    rig.rightLeg.rotation.x = 1.15;
    rig.leftArm.rotation.x = -Math.PI * 0.76;
    rig.rightArm.rotation.x = -Math.PI * 0.76;
    rig.leftArm.rotation.z = -0.38;
    rig.rightArm.rotation.z = 0.38;
    return;
  }

  // 3. If dodging (evading oncoming vehicle)
  if (state === 'dodging') {
    rig.body.rotation.z = 0.3;
    rig.leftArm.rotation.z = -0.4;
    rig.rightArm.rotation.z = 0.4;
    rig.leftLeg.rotation.x = 0.25;
    rig.rightLeg.rotation.x = -0.25;
    return;
  }

  // 4. If surrendered (hands up, on knees)
  if (state === 'surrendered') {
    rig.leftArm.rotation.x = -Math.PI * 0.88;
    rig.rightArm.rotation.x = -Math.PI * 0.88;
    rig.leftArm.rotation.z = -0.3;
    rig.rightArm.rotation.z = 0.3;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.body.position.y = 0.82;
    if (rig.surrenderMarker) {
      rig.surrenderMarker.visible = true;
      rig.surrenderMarker.rotation.y = time * 3.5;
    }
    return;
  } else if (rig.surrenderMarker) {
    rig.surrenderMarker.visible = false;
  }

  // 5. If arrested (cuffed)
  if (state === 'arrested') {
    rig.root.rotation.x = 0;
    rig.body.position.y = 0.68;
    rig.leftArm.rotation.x = 0.45;
    rig.rightArm.rotation.x = 0.45;
    rig.leftArm.rotation.y = 0.7;
    rig.rightArm.rotation.y = -0.7;
    rig.leftLeg.rotation.x = 1.1;
    rig.rightLeg.rotation.x = 1.1;
    return;
  }

  // Crouch stance
  const baseBodyY = isCrouching ? 0.78 : 1.04;

  const isPanicking = state === 'panicking';
  const effectiveSpeed = isPanicking ? Math.max(speed, 3.8) : speed;

  // Stride frequency and swing amplitude proportional to speed
  const walkFreq = isPanicking ? 16 : (effectiveSpeed > 5 ? 13 : 9);
  const legAmp = isPanicking ? 0.82 : Math.min(effectiveSpeed * 0.16, 0.72);
  const armAmp = isPanicking ? 0.78 : Math.min(effectiveSpeed * 0.14, 0.60);

  if (effectiveSpeed > 0.2) {
    // Natural stride swing
    const stride = Math.sin(time * walkFreq);
    rig.leftLeg.rotation.x = stride * legAmp;
    rig.rightLeg.rotation.x = -stride * legAmp;

    // Subtle natural body bounce & spine sway
    rig.body.position.y = baseBodyY + Math.abs(Math.sin(time * walkFreq * 2)) * (isPanicking ? 0.06 : 0.04);
    rig.body.rotation.z = -stride * 0.025;

    if (isPanicking) {
      // Panic fleeing: frantic glance behind and high arm pump
      rig.head.rotation.y = Math.sin(time * 5) * 0.32;
      rig.head.rotation.x = -0.15;
      rig.leftArm.rotation.x = -stride * armAmp;
      rig.rightArm.rotation.x = stride * armAmp;
      rig.leftArm.rotation.z = 0.22;
      rig.rightArm.rotation.z = -0.22;
    } else if (!isAiming) {
      rig.head.rotation.y = 0;
      rig.head.rotation.x = 0;

      // Handle handheld civilian accessories while walking
      if (rig.accessoryType === 'phone') {
        rig.rightArm.rotation.x = -Math.PI * 0.36 + Math.sin(time * walkFreq) * 0.05;
        rig.rightArm.rotation.y = -0.18;
        rig.rightArm.rotation.z = 0.06;
        rig.leftArm.rotation.x = -stride * armAmp;
        rig.leftArm.rotation.z = 0.08;
      } else if (rig.accessoryType === 'coffee') {
        rig.rightArm.rotation.x = -Math.PI * 0.24 + Math.sin(time * walkFreq) * 0.04;
        rig.rightArm.rotation.y = -0.12;
        rig.rightArm.rotation.z = 0.04;
        rig.leftArm.rotation.x = -stride * armAmp;
        rig.leftArm.rotation.z = 0.08;
      } else if (rig.accessoryType === 'briefcase' || rig.accessoryType === 'shopping_bag') {
        rig.rightArm.rotation.x = stride * (armAmp * 0.32);
        rig.rightArm.rotation.y = 0;
        rig.rightArm.rotation.z = -0.06;
        rig.leftArm.rotation.x = -stride * armAmp;
        rig.leftArm.rotation.z = 0.08;
      } else {
        rig.leftArm.rotation.x = -stride * armAmp;
        rig.rightArm.rotation.x = stride * armAmp;
        rig.leftArm.rotation.z = 0.08;
        rig.rightArm.rotation.z = -0.08;
      }
    }
  } else {
    // Idle gentle breathing sway
    const breath = Math.sin(time * 2.2) * 0.015;
    rig.body.position.y = baseBodyY + breath;
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.2);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.2);
    rig.body.rotation.z = 0;

    if (!isAiming) {
      if (rig.accessoryType === 'phone') {
        // Idling while browsing smartphone
        rig.head.rotation.x = 0.28;
        rig.head.rotation.y = 0;
        rig.rightArm.rotation.x = -Math.PI * 0.46;
        rig.rightArm.rotation.y = -0.22;
        rig.rightArm.rotation.z = 0.08;
        rig.leftArm.rotation.x = Math.sin(time * 2.2) * 0.03;
        rig.leftArm.rotation.z = 0.08;
      } else if (rig.accessoryType === 'coffee') {
        rig.head.rotation.x = 0;
        rig.head.rotation.y = 0;
        rig.rightArm.rotation.x = -Math.PI * 0.28;
        rig.rightArm.rotation.y = -0.14;
        rig.rightArm.rotation.z = 0.04;
        rig.leftArm.rotation.x = Math.sin(time * 2.2) * 0.04;
        rig.leftArm.rotation.z = 0.08;
      } else if (rig.accessoryType === 'briefcase' || rig.accessoryType === 'shopping_bag') {
        rig.head.rotation.x = 0;
        rig.head.rotation.y = 0;
        rig.rightArm.rotation.x = Math.sin(time * 1.5) * 0.03;
        rig.rightArm.rotation.y = 0;
        rig.rightArm.rotation.z = -0.05;
        rig.leftArm.rotation.x = Math.sin(time * 2.2) * 0.04;
        rig.leftArm.rotation.z = 0.08;
      } else {
        rig.head.rotation.x = 0;
        rig.head.rotation.y = 0;
        rig.leftArm.rotation.x = Math.sin(time * 2.2) * 0.04;
        rig.rightArm.rotation.x = -Math.sin(time * 2.2) * 0.04;
        rig.leftArm.rotation.z = 0.08;
        rig.rightArm.rotation.z = -0.08;
      }
    }
  }

  // Tactical Aiming Stance (both arms raised holding firearm towards target)
  if (isAiming) {
    rig.rightArm.rotation.x = -Math.PI / 2.2;
    rig.rightArm.rotation.y = -0.15;
    rig.rightArm.rotation.z = 0.05;

    rig.leftArm.rotation.x = -Math.PI / 2.3;
    rig.leftArm.rotation.y = 0.35;
    rig.leftArm.rotation.z = 0.15;
  }

  // Weapon recoil flinch
  if (rig.recoilTimer > 0) {
    rig.recoilTimer -= 0.035;
    if (rig.rightArm) {
      rig.rightArm.rotation.x -= 0.22;
    }
    if (rig.muzzleFlash) {
      rig.muzzleFlash.visible = true;
      (rig.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }
  } else if (rig.muzzleFlash) {
    rig.muzzleFlash.visible = false;
  }
}
