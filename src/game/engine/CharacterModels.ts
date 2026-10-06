import * as THREE from 'three';
import { EnemyType, GangFactionId } from '../../types/game';
import { generateAppearanceProfile } from './NPCAppearanceSystem';
import { buildHeadAndFacialFeatures } from './NPCOutfitBuilders';
import { buildTorsoWithClothing, buildArticulatedArms, buildArticulatedLegs } from './NPCTorsoLimbBuilders';

export interface CharacterAnimOptions {
  isGrounded?: boolean;
  verticalVelocity?: number;
  isReloading?: boolean;
  reloadProgress?: number; // 0 to 1
  turnRate?: number;
  isShooting?: boolean;
  aimPitch?: number;
  weaponCategory?: string;
}

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm?: THREE.Group;
  rightForearm?: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftCalf?: THREE.Group;
  rightCalf?: THREE.Group;
  weaponMesh?: THREE.Mesh;
  muzzleFlash?: THREE.Mesh;
  muzzleLight?: THREE.PointLight;
  magazineMesh?: THREE.Mesh;
  gunGroup?: THREE.Group;
  currentWeaponCategory?: string;
  surrenderMarker?: THREE.Group;
  overheadHealthBar?: THREE.Group;
  healthFillMesh?: THREE.Mesh;
  accessoryGroup?: THREE.Group;
  accessoryType?: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'wrench' | 'groceries' | 'none';
  archetype?: string;
  type: 'player' | EnemyType | 'civilian' | 'police_npc';
  faction?: GangFactionId | 'aegis_taskforce';
  recoilTimer: number;
  flinchTimer: number;
  buildScale?: { x: number; y: number; z: number };
}

// --------------------------------------------------------------------
// Handheld Civilian Accessory Models
// --------------------------------------------------------------------
function createWrenchMesh(): THREE.Group {
  const group = new THREE.Group();
  const matChrome = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const shaftGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8);
  const shaft = new THREE.Mesh(shaftGeom, matChrome);
  shaft.rotation.z = Math.PI / 4;
  group.add(shaft);

  const headGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 10);
  const head = new THREE.Mesh(headGeom, matChrome);
  head.position.set(0.12, 0.12, 0);
  group.add(head);

  group.position.set(0.04, -0.28, 0.06);
  return group;
}

function createGroceriesMesh(): THREE.Group {
  const group = new THREE.Group();
  const matKraft = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
  const matBaguette = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

  const bagGeom = new THREE.BoxGeometry(0.16, 0.28, 0.18);
  const bag = new THREE.Mesh(bagGeom, matKraft);
  bag.position.y = -0.06;
  bag.castShadow = true;
  group.add(bag);

  const breadGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8);
  const bread = new THREE.Mesh(breadGeom, matBaguette);
  bread.rotation.z = 0.25;
  bread.position.set(0.04, 0.12, 0);
  group.add(bread);

  const celeryGeom = new THREE.BoxGeometry(0.06, 0.18, 0.05);
  const celery = new THREE.Mesh(celeryGeom, matGreen);
  celery.position.set(-0.03, 0.10, 0.02);
  group.add(celery);

  group.position.set(0.04, -0.26, 0.05);
  return group;
}

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

  group.position.set(0, -0.32, 0.04);
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

  group.position.set(0.03, -0.26, 0.04);
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

  group.position.set(0, -0.27, 0.05);
  return group;
}

function createShoppingBagMesh(): THREE.Group {
  const group = new THREE.Group();
  const matBag = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const matHandle = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const bagGeom = new THREE.BoxGeometry(0.11, 0.22, 0.18);
  const bag = new THREE.Mesh(bagGeom, matBag);
  bag.position.y = -0.06;
  bag.castShadow = true;
  group.add(bag);

  const handleGeom = new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeom, matHandle);
  handle.position.set(0, 0.06, 0);
  handle.rotateY(Math.PI / 2);
  group.add(handle);

  group.position.set(0, -0.28, 0.04);
  return group;
}

// --------------------------------------------------------------------
// Tactical Firearm Models (Handgun, Shotgun, SMG, Assault Rifle, Sniper, Taser)
// --------------------------------------------------------------------
export interface WeaponMeshResult {
  gunGroup: THREE.Group;
  weaponMesh: THREE.Mesh;
  muzzleFlash: THREE.Mesh;
  muzzleLight?: THREE.PointLight;
  magazineMesh?: THREE.Mesh;
}

function createMuzzleFlashModel(flashColor: number = 0xfef08a, flashScale: number = 0.16): { muzzleFlash: THREE.Mesh; muzzleLight: THREE.PointLight } {
  const flashGeom = new THREE.SphereGeometry(flashScale, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: flashColor,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
  muzzleFlash.visible = false;

  const finMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const finGeom1 = new THREE.PlaneGeometry(flashScale * 2.6, flashScale * 0.85);
  const fin1 = new THREE.Mesh(finGeom1, finMat);
  muzzleFlash.add(fin1);

  const finGeom2 = new THREE.PlaneGeometry(flashScale * 0.85, flashScale * 2.6);
  const fin2 = new THREE.Mesh(finGeom2, finMat);
  muzzleFlash.add(fin2);

  const muzzleLight = new THREE.PointLight(flashColor, 0, 9);
  muzzleFlash.add(muzzleLight);

  return { muzzleFlash, muzzleLight };
}

export function createWeaponMeshForCategory(category: 'handgun' | 'shotgun' | 'smg' | 'rifle' | 'sniper' | 'taser' | string): WeaponMeshResult {
  const gunGroup = new THREE.Group();
  const matGun = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.88, roughness: 0.22 });
  const matGunMetal = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.92, roughness: 0.18 });
  const matGrip = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.85 });
  const matStockWood = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
  const matOpticLens = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.95 });
  const matTaserYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35 });

  let weaponMesh: THREE.Mesh;
  let muzzleFlash: THREE.Mesh;
  let muzzleLight: THREE.PointLight | undefined;
  let magazineMesh: THREE.Mesh | undefined;

  if (category === 'shotgun') {
    // 1. Combat Shotgun (Breacher-12)
    const recGeom = new THREE.BoxGeometry(0.075, 0.10, 0.42);
    const rec = new THREE.Mesh(recGeom, matGun);
    rec.position.set(0, 0, 0.06);
    gunGroup.add(rec);
    weaponMesh = rec;

    // Heavy long barrel
    const barrelGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.48, 10);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, matGunMetal);
    barrel.position.set(0, 0.025, 0.38);
    gunGroup.add(barrel);

    // Magazine tube under barrel
    const magTubeGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8);
    magTubeGeom.rotateX(Math.PI / 2);
    const magTube = new THREE.Mesh(magTubeGeom, matGunMetal);
    magTube.position.set(0, -0.015, 0.35);
    gunGroup.add(magTube);

    // Ribbed pump fore-end
    const pumpGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.18, 8);
    pumpGeom.rotateX(Math.PI / 2);
    const pump = new THREE.Mesh(pumpGeom, matGrip);
    pump.position.set(0, -0.015, 0.32);
    gunGroup.add(pump);

    // Solid tactical stock extending backward
    const stockGeom = new THREE.BoxGeometry(0.06, 0.11, 0.34);
    const stock = new THREE.Mesh(stockGeom, matGrip);
    stock.position.set(0, -0.02, -0.22);
    gunGroup.add(stock);

    // Pistol grip
    const gripGeom = new THREE.BoxGeometry(0.055, 0.13, 0.075);
    gripGeom.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeom, matGrip);
    grip.position.set(0, -0.07, -0.03);
    gunGroup.add(grip);

    // Muzzle flash
    const mfData = createMuzzleFlashModel(0xfef08a, 0.22);
    muzzleFlash = mfData.muzzleFlash;
    muzzleLight = mfData.muzzleLight;
    muzzleFlash.position.set(0, 0.025, 0.64);
    gunGroup.add(muzzleFlash);

  } else if (category === 'rifle' || category === 'sniper') {
    // 2. Assault Rifle (Titan-AR) / Precision Sniper
    const recGeom = new THREE.BoxGeometry(0.065, 0.095, 0.38);
    const rec = new THREE.Mesh(recGeom, matGun);
    rec.position.set(0, 0, 0.08);
    gunGroup.add(rec);
    weaponMesh = rec;

    // Extended barrel + birdcage compensator
    const barrelLength = category === 'sniper' ? 0.62 : 0.42;
    const barrelGeom = new THREE.CylinderGeometry(0.018, 0.018, barrelLength, 10);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, matGunMetal);
    barrel.position.set(0, 0.02, 0.19 + barrelLength / 2);
    gunGroup.add(barrel);

    // Handguard shroud with cooling slots
    const guardGeom = new THREE.BoxGeometry(0.068, 0.075, 0.28);
    const guard = new THREE.Mesh(guardGeom, matGrip);
    guard.position.set(0, 0.015, 0.32);
    gunGroup.add(guard);

    // Curved 30-round magazine
    const magGeom = new THREE.BoxGeometry(0.045, 0.20, 0.08);
    magGeom.rotateX(-0.15);
    magazineMesh = new THREE.Mesh(magGeom, matGunMetal);
    magazineMesh.position.set(0, -0.12, 0.08);
    gunGroup.add(magazineMesh);

    // Stock
    const stockGeom = new THREE.BoxGeometry(0.055, 0.11, 0.30);
    const stock = new THREE.Mesh(stockGeom, matGrip);
    stock.position.set(0, -0.01, -0.22);
    gunGroup.add(stock);

    // Optic sight
    if (category === 'sniper') {
      const scopeGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.28, 10);
      scopeGeom.rotateX(Math.PI / 2);
      const scope = new THREE.Mesh(scopeGeom, matGun);
      scope.position.set(0, 0.085, 0.08);
      gunGroup.add(scope);
    } else {
      const sightGeom = new THREE.BoxGeometry(0.038, 0.045, 0.07);
      const sight = new THREE.Mesh(sightGeom, matGun);
      sight.position.set(0, 0.07, 0.06);
      gunGroup.add(sight);

      const dotGeom = new THREE.PlaneGeometry(0.02, 0.02);
      const dot = new THREE.Mesh(dotGeom, matOpticLens);
      dot.position.set(0, 0.07, 0.025);
      gunGroup.add(dot);
    }

    // Pistol grip
    const gripGeom = new THREE.BoxGeometry(0.052, 0.13, 0.072);
    gripGeom.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeom, matGrip);
    grip.position.set(0, -0.07, -0.03);
    gunGroup.add(grip);

    // Muzzle flash
    const mfData = createMuzzleFlashModel(0xfef08a, category === 'sniper' ? 0.22 : 0.18);
    muzzleFlash = mfData.muzzleFlash;
    muzzleLight = mfData.muzzleLight;
    muzzleFlash.position.set(0, 0.02, 0.19 + barrelLength + 0.05);
    gunGroup.add(muzzleFlash);

  } else if (category === 'smg') {
    // 3. Compact Submachine Gun (Specter SMG)
    const recGeom = new THREE.BoxGeometry(0.06, 0.085, 0.28);
    const rec = new THREE.Mesh(recGeom, matGun);
    rec.position.set(0, 0, 0.06);
    gunGroup.add(rec);
    weaponMesh = rec;

    // Short barrel with threaded compensator
    const barrelGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.14, 8);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, matGunMetal);
    barrel.position.set(0, 0.015, 0.26);
    gunGroup.add(barrel);

    // Extended straight stick magazine
    const magGeom = new THREE.BoxGeometry(0.038, 0.22, 0.048);
    magazineMesh = new THREE.Mesh(magGeom, matGunMetal);
    magazineMesh.position.set(0, -0.13, 0.06);
    gunGroup.add(magazineMesh);

    // Wire stock folded
    const wireGeom = new THREE.BoxGeometry(0.045, 0.06, 0.20);
    const wireStock = new THREE.Mesh(wireGeom, matGunMetal);
    wireStock.position.set(0, -0.01, -0.14);
    gunGroup.add(wireStock);

    // Grip
    const gripGeom = new THREE.BoxGeometry(0.052, 0.12, 0.07);
    gripGeom.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeom, matGrip);
    grip.position.set(0, -0.07, -0.02);
    gunGroup.add(grip);

    // Muzzle flash
    const mfData = createMuzzleFlashModel(0xfef08a, 0.16);
    muzzleFlash = mfData.muzzleFlash;
    muzzleLight = mfData.muzzleLight;
    muzzleFlash.position.set(0, 0.015, 0.35);
    gunGroup.add(muzzleFlash);

  } else if (category === 'taser') {
    // 4. Law Enforcement Stun Taser
    const frameGeom = new THREE.BoxGeometry(0.055, 0.095, 0.20);
    const frame = new THREE.Mesh(frameGeom, matTaserYellow);
    frame.position.set(0, 0, 0.04);
    gunGroup.add(frame);
    weaponMesh = frame;

    const cartridgeGeom = new THREE.BoxGeometry(0.05, 0.06, 0.045);
    const cartridge = new THREE.Mesh(cartridgeGeom, matGrip);
    cartridge.position.set(0, 0.01, 0.15);
    gunGroup.add(cartridge);

    const gripGeom = new THREE.BoxGeometry(0.05, 0.12, 0.07);
    gripGeom.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeom, matGrip);
    grip.position.set(0, -0.07, -0.02);
    gunGroup.add(grip);

    // Electric arc muzzle flash
    const mfData = createMuzzleFlashModel(0x38bdf8, 0.12);
    muzzleFlash = mfData.muzzleFlash;
    muzzleLight = mfData.muzzleLight;
    muzzleFlash.position.set(0, 0.01, 0.19);
    gunGroup.add(muzzleFlash);

  } else {
    // 5. Standard Semi-Automatic Handgun (Vortex-9 Police Issue)
    const slideGeom = new THREE.BoxGeometry(0.065, 0.085, 0.32);
    const slide = new THREE.Mesh(slideGeom, matGun);
    slide.position.set(0, 0, 0.08);
    gunGroup.add(slide);
    weaponMesh = slide;

    const barrelGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.06, 10);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, matGun);
    barrel.position.set(0, 0.02, 0.26);
    gunGroup.add(barrel);

    const gripGeom = new THREE.BoxGeometry(0.055, 0.13, 0.075);
    gripGeom.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeom, matGrip);
    grip.position.set(0, -0.07, -0.02);
    gunGroup.add(grip);

    const magGeom = new THREE.BoxGeometry(0.045, 0.12, 0.06);
    magazineMesh = new THREE.Mesh(magGeom, matGunMetal);
    magazineMesh.position.set(0, -0.08, -0.02);
    magazineMesh.rotation.x = 0.25;
    gunGroup.add(magazineMesh);

    const lightGeom = new THREE.BoxGeometry(0.038, 0.03, 0.10);
    const lightMesh = new THREE.Mesh(lightGeom, matGun);
    lightMesh.position.set(0, -0.04, 0.14);
    gunGroup.add(lightMesh);

    const mfData = createMuzzleFlashModel(0xfef08a, 0.15);
    muzzleFlash = mfData.muzzleFlash;
    muzzleLight = mfData.muzzleLight;
    muzzleFlash.position.set(0, 0.02, 0.33);
    gunGroup.add(muzzleFlash);
  }

  // Position gun group so grip aligns perfectly with right hand palm
  gunGroup.position.set(0, -0.19, 0.04);
  gunGroup.castShadow = true;

  return { gunGroup, weaponMesh, muzzleFlash, muzzleLight, magazineMesh };
}

export function attachWeaponToRig(
  rig: CharacterRig,
  category: 'handgun' | 'shotgun' | 'smg' | 'rifle' | 'sniper' | 'taser' | string
) {
  if (!rig.rightForearm) return;
  if (rig.gunGroup) {
    rig.rightForearm.remove(rig.gunGroup);
  }
  const result = createWeaponMeshForCategory(category);
  rig.gunGroup = result.gunGroup;
  rig.weaponMesh = result.weaponMesh;
  rig.muzzleFlash = result.muzzleFlash;
  rig.muzzleLight = result.muzzleLight;
  rig.magazineMesh = result.magazineMesh;
  rig.currentWeaponCategory = category;
  rig.rightForearm.add(result.gunGroup);
}

/**
 * Creates rich, modern, stylized low-poly human character rigs with realistic human proportions,
 * natural silhouettes, recognizable facial features, detailed uniforms, tactical gear,
 * multi-joint limb articulation (knees, elbows), and smooth procedural animation support.
 */
export function createCharacterMesh(
  type: 'player' | EnemyType | 'civilian' | 'police_npc',
  outfitVariant: string = 'default',
  displayName?: string,
  faction?: GangFactionId | 'aegis_taskforce'
): CharacterRig {
  const root = new THREE.Group();

  // 1. Generate distinctive, non-cloning appearance profile
  const profile = generateAppearanceProfile(type, outfitVariant, displayName, faction);

  // 2. High-fidelity PBR Materials tailored to profile
  const matSkin = new THREE.MeshStandardMaterial({
    color: profile.skinTone,
    roughness: 0.52,
    metalness: 0.05,
  });
  const matHair = new THREE.MeshStandardMaterial({
    color: profile.hairColor,
    roughness: 0.82,
    metalness: 0.1,
  });
  const matShirt = new THREE.MeshStandardMaterial({
    color: profile.shirtColor,
    roughness: 0.68,
    metalness: 0.05,
  });
  const matPants = new THREE.MeshStandardMaterial({
    color: profile.pantsColor,
    roughness: 0.78,
    metalness: 0.05,
  });
  const matShoe = new THREE.MeshStandardMaterial({
    color: profile.shoeColor,
    roughness: 0.55,
  });
  const matLeather = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.72,
    metalness: 0.15,
  });
  const matSilver = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.18,
  });

  // 3. Anatomical Torso, Contoured Neck & Detailed Clothing
  const torsoResult = buildTorsoWithClothing(profile, matSkin, matShirt, matPants, matLeather, type);
  const body = torsoResult.body;
  root.add(body);

  // 4. Detailed Sculpted Head with Eyes, Nose, Mouth, Ears, Hair & Accessories
  const head = buildHeadAndFacialFeatures(profile, matSkin, matHair);
  head.position.y = 0.54;
  body.add(head);

  // 5. Articulated Arms, Deltoids, Elbow Pivots & Sculpted Hands
  const armsResult = buildArticulatedArms(profile, matSkin, matShirt, matLeather, matSilver, type);
  const leftArm = armsResult.leftArm;
  const rightArm = armsResult.rightArm;
  const leftForearm = armsResult.leftForearm;
  const rightForearm = armsResult.rightForearm;
  body.add(leftArm);
  body.add(rightArm);

  // 6. Articulated Legs, Knee Pivots & Diverse Styled Footwear
  const legsResult = buildArticulatedLegs(profile, matSkin, matPants, matLeather, matShoe, matSilver, type);
  const leftLeg = legsResult.leftLeg;
  const rightLeg = legsResult.rightLeg;
  const leftCalf = legsResult.leftCalf;
  const rightCalf = legsResult.rightCalf;
  root.add(leftLeg);
  root.add(rightLeg);

  // 7. Weapon Attachment for Combatants
  let gunGroup: THREE.Group | undefined;
  let weaponMesh: THREE.Mesh | undefined;
  let muzzleFlash: THREE.Mesh | undefined;
  let muzzleLight: THREE.PointLight | undefined;
  let magazineMesh: THREE.Mesh | undefined;
  let currentWeaponCategory: string | undefined;

  if (type !== 'civilian') {
    let initialCategory = 'handgun';
    if (outfitVariant === 'swat' || type === 'military_soldier' || faction === 'aegis_taskforce') initialCategory = 'rifle';
    else if (faction === 'cobalt_skulls') initialCategory = 'shotgun';
    else if (faction === 'neon_pythons') initialCategory = 'smg';
    else if (faction === 'iron_vipers') initialCategory = 'rifle';
    else if (faction === 'eclipse_syndicate' || type === 'syndicate_operative') initialCategory = 'smg';
    else if (type === 'enforcer') initialCategory = 'shotgun';

    currentWeaponCategory = initialCategory;
    const weaponData = createWeaponMeshForCategory(initialCategory);
    gunGroup = weaponData.gunGroup;
    weaponMesh = weaponData.weaponMesh;
    muzzleFlash = weaponData.muzzleFlash;
    muzzleLight = weaponData.muzzleLight;
    magazineMesh = weaponData.magazineMesh;
    if (rightForearm) {
      rightForearm.add(gunGroup);
    }
  }

  // 8. Handheld Civilian Accessories
  let accessoryType: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'wrench' | 'groceries' | 'none' = 'none';
  let accessoryGroup: THREE.Group | undefined;

  if (type === 'civilian' && rightForearm) {
    const arch = outfitVariant;
    const nameLower = (displayName || '').toLowerCase();
    if (nameLower.includes('marcus') || nameLower.includes('tariq') || arch === 'mechanic' || arch === 'construction') {
      accessoryType = 'wrench';
      accessoryGroup = createWrenchMesh();
    } else if (nameLower.includes('leah') || nameLower.includes('elijah') || nameLower.includes('malik') || arch === 'shopkeeper') {
      accessoryType = 'groceries';
      accessoryGroup = createGroceriesMesh();
    } else if (nameLower.includes('sophia') || nameLower.includes('grace') || arch === 'business' || arch === 'executive') {
      accessoryType = Math.random() > 0.4 ? 'briefcase' : 'phone';
      accessoryGroup = accessoryType === 'briefcase' ? createBriefcaseMesh() : createPhoneMesh();
    } else if (nameLower.includes('andre') || nameLower.includes('jamal') || arch === 'artist_hipster') {
      accessoryType = 'coffee';
      accessoryGroup = createCoffeeCupMesh();
    } else if (nameLower.includes('leo') || arch === 'shopper') {
      accessoryType = 'shopping_bag';
      accessoryGroup = createShoppingBagMesh();
    } else if (nameLower.includes('nia') || nameLower.includes('chen') || arch === 'student' || arch === 'tourist') {
      accessoryType = 'phone';
      accessoryGroup = createPhoneMesh();
    } else if (Math.random() > 0.45) {
      accessoryType = Math.random() > 0.5 ? 'phone' : 'coffee';
      accessoryGroup = accessoryType === 'phone' ? createPhoneMesh() : createCoffeeCupMesh();
    }

    if (accessoryGroup) {
      rightForearm.add(accessoryGroup);
    }
  }

  // 9. Floating Surrender Marker (Handcuffs Icon)
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

  // 10. Overhead 3D Health Bar (for enemies)
  let overheadHealthBar: THREE.Group | undefined;
  let healthFillMesh: THREE.Mesh | undefined;

  if (type !== 'player' && type !== 'civilian') {
    overheadHealthBar = new THREE.Group();
    overheadHealthBar.position.set(0, 2.05, 0);

    const bgGeom = new THREE.PlaneGeometry(1.0, 0.14);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide });
    const bgMesh = new THREE.Mesh(bgGeom, bgMat);
    overheadHealthBar.add(bgMesh);

    const redGeom = new THREE.PlaneGeometry(0.96, 0.1);
    const redMat = new THREE.MeshBasicMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
    const redMesh = new THREE.Mesh(redGeom, redMat);
    redMesh.position.z = 0.005;
    overheadHealthBar.add(redMesh);

    const fillGeom = new THREE.PlaneGeometry(0.96, 0.1);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    healthFillMesh = new THREE.Mesh(fillGeom, fillMat);
    healthFillMesh.position.z = 0.01;
    overheadHealthBar.add(healthFillMesh);

    root.add(overheadHealthBar);
  }

  // 11. Realistic Proportional Scaling & Height Diversity
  root.scale.set(
    profile.buildScale.x,
    profile.heightScale,
    profile.buildScale.z
  );

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftCalf,
    rightCalf,
    weaponMesh,
    muzzleFlash,
    muzzleLight,
    magazineMesh,
    gunGroup,
    currentWeaponCategory,
    surrenderMarker,
    overheadHealthBar,
    healthFillMesh,
    accessoryGroup,
    accessoryType,
    archetype: outfitVariant,
    type,
    faction,
    recoilTimer: 0,
    flinchTimer: 0,
    buildScale: profile.buildScale,
  };
}

/**
 * Natural procedural animation for characters:
 * - Multi-joint stride cycles with organic knee and elbow articulation
 * - Running, sprinting athletic forward lean
 * - Realistic jump takeoff compression, mid-air tuck, and falling leg extension
 * - Grounding and height awareness
 * - Turning bank / lean
 * - Weaver tactical aiming stance
 * - Recoil flinch with muzzle flash
 * - Complete magazine-swap reload sequence
 * - Surrender, cower, panic, and arrested states
 */
export function updateCharacterAnimation(
  rig: CharacterRig,
  speed: number,
  time: number,
  isAiming: boolean = false,
  isCrouching: boolean = false,
  state?: string,
  camera?: THREE.Camera,
  healthPercent: number = 1.0,
  animOptions?: CharacterAnimOptions
) {
  // Billboard overhead health bar towards camera
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
      mat.color.setHex(0x22c55e);
    } else if (clampedRatio > 0.25) {
      mat.color.setHex(0xeab308);
    } else {
      mat.color.setHex(0xef4444);
    }
  }

  // 1. If dead (fallen on ground)
  if (state === 'dead') {
    rig.root.rotation.x = -Math.PI / 2;
    rig.body.position.y = 0.25;
    return;
  }

  // 2. If cowering (pedestrians ducking under fire or danger)
  if (state === 'cowering') {
    rig.body.position.y = 0.60 + Math.sin(time * 24) * 0.012;
    rig.head.rotation.x = 0.38;
    rig.head.rotation.y = 0;
    rig.leftLeg.rotation.x = 1.15;
    rig.rightLeg.rotation.x = 1.15;
    if (rig.leftCalf) rig.leftCalf.rotation.x = -1.1;
    if (rig.rightCalf) rig.rightCalf.rotation.x = -1.1;
    rig.leftArm.rotation.x = -Math.PI * 0.78;
    rig.rightArm.rotation.x = -Math.PI * 0.78;
    rig.leftArm.rotation.z = -0.38;
    rig.rightArm.rotation.z = 0.38;
    if (rig.leftForearm) rig.leftForearm.rotation.x = -0.8;
    if (rig.rightForearm) rig.rightForearm.rotation.x = -0.8;
    return;
  }

  // 3. If dodging (evading oncoming vehicle)
  if (state === 'dodging') {
    rig.body.rotation.z = 0.28;
    rig.leftArm.rotation.z = -0.4;
    rig.rightArm.rotation.z = 0.4;
    rig.leftLeg.rotation.x = 0.25;
    rig.rightLeg.rotation.x = -0.25;
    return;
  }

  // 4. If surrendered (hands up, knees on ground)
  if (state === 'surrendered') {
    if (rig.weaponMesh) rig.weaponMesh.visible = false;
    rig.leftArm.rotation.x = -Math.PI * 0.88;
    rig.rightArm.rotation.x = -Math.PI * 0.88;
    rig.leftArm.rotation.z = -0.32;
    rig.rightArm.rotation.z = 0.32;
    rig.leftLeg.rotation.x = 0.95;
    rig.rightLeg.rotation.x = 0.95;
    if (rig.leftCalf) rig.leftCalf.rotation.x = -1.0;
    if (rig.rightCalf) rig.rightCalf.rotation.x = -1.0;
    rig.body.position.y = 0.75;
    if (rig.surrenderMarker) {
      rig.surrenderMarker.visible = true;
      rig.surrenderMarker.rotation.y = time * 3.5;
    }
    return;
  } else if (rig.surrenderMarker) {
    rig.surrenderMarker.visible = false;
  }

  // 5. If arrested (cuffed hands behind back, kneeling)
  if (state === 'arrested') {
    if (rig.weaponMesh) rig.weaponMesh.visible = false;
    if (rig.surrenderMarker) rig.surrenderMarker.visible = false;
    rig.root.rotation.x = 0;
    rig.body.position.y = 0.65;
    rig.leftArm.rotation.x = 0.45;
    rig.rightArm.rotation.x = 0.45;
    rig.leftArm.rotation.y = 0.7;
    rig.rightArm.rotation.y = -0.7;
    rig.leftLeg.rotation.x = 1.1;
    rig.rightLeg.rotation.x = 1.1;
    if (rig.leftCalf) rig.leftCalf.rotation.x = -1.1;
    if (rig.rightCalf) rig.rightCalf.rotation.x = -1.1;
    return;
  }

  // 6. If getting into vehicle
  if (state === 'entering_vehicle') {
    rig.body.position.y = 0.88;
    rig.body.rotation.y = -0.25;
    rig.body.rotation.z = -0.12;
    rig.leftArm.rotation.x = -Math.PI * 0.45;
    rig.leftArm.rotation.y = 0.35;
    rig.rightArm.rotation.x = 0.2;
    rig.leftLeg.rotation.x = 0.35;
    rig.rightLeg.rotation.x = -0.15;
    return;
  }

  // Crouch stance
  const baseBodyY = isCrouching ? 0.76 : 1.04;

  const isGrounded = animOptions?.isGrounded !== false;
  const vertVel = animOptions?.verticalVelocity ?? 0;
  const isJumping = !isGrounded && vertVel > 0.5;
  const isFalling = !isGrounded && vertVel <= 0.5;

  const isPanicking = state === 'panicking';
  const effectiveSpeed = isPanicking ? Math.max(speed, 3.8) : speed;
  const isRunning = effectiveSpeed > 4.5;
  const isSprinting = effectiveSpeed > 6.8;

  // ------------------------------------------------------------------
  // JUMPING & AIRBORNE FALLING ANIMATIONS
  // ------------------------------------------------------------------
  if (isJumping) {
    // Jump takeoff: tuck knees, arms raise for momentum
    rig.body.position.y = baseBodyY + 0.08;
    rig.body.rotation.x = -0.12;
    rig.leftLeg.rotation.x = 0.45;
    rig.rightLeg.rotation.x = 0.25;
    if (rig.leftCalf) rig.leftCalf.rotation.x = -0.65;
    if (rig.rightCalf) rig.rightCalf.rotation.x = -0.45;
    rig.leftArm.rotation.x = -0.55;
    rig.rightArm.rotation.x = -0.40;
    rig.leftArm.rotation.z = -0.35;
    rig.rightArm.rotation.z = 0.35;
    return;
  }

  if (isFalling) {
    // Airborne falling: legs extend to anticipate landing, arms flare out for balance
    rig.body.position.y = baseBodyY;
    rig.body.rotation.x = 0.08;
    rig.leftLeg.rotation.x = -0.12;
    rig.rightLeg.rotation.x = -0.08;
    if (rig.leftCalf) rig.leftCalf.rotation.x = -0.18;
    if (rig.rightCalf) rig.rightCalf.rotation.x = -0.18;
    rig.leftArm.rotation.x = -0.30;
    rig.rightArm.rotation.x = -0.25;
    rig.leftArm.rotation.z = -0.48;
    rig.rightArm.rotation.z = 0.48;
    return;
  }

  // ------------------------------------------------------------------
  // LOCOMOTION (WALKING / RUNNING / SPRINTING)
  // ------------------------------------------------------------------
  const walkFreq = isPanicking ? 16 : isSprinting ? 14.8 : isRunning ? 12.8 : 8.8;
  const legAmp = isPanicking ? 0.85 : isSprinting ? 0.82 : isRunning ? 0.72 : Math.min(effectiveSpeed * 0.16, 0.58);
  const armAmp = isPanicking ? 0.80 : isSprinting ? 0.78 : isRunning ? 0.68 : Math.min(effectiveSpeed * 0.14, 0.48);

  // Turn banking
  if (animOptions?.turnRate) {
    const bankAngle = THREE.MathUtils.clamp(-animOptions.turnRate * 0.08, -0.12, 0.12);
    rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, bankAngle, 0.25);
  } else {
    rig.body.rotation.z = THREE.MathUtils.lerp(rig.body.rotation.z, 0, 0.2);
  }

  if (effectiveSpeed > 0.2) {
    // Natural stride swing
    const stride = Math.sin(time * walkFreq);
    rig.leftLeg.rotation.x = stride * legAmp;
    rig.rightLeg.rotation.x = -stride * legAmp;

    // Organic Knee Flexion (calves bend backward during back-swing)
    if (rig.leftCalf && rig.rightCalf) {
      rig.leftCalf.rotation.x = -Math.max(0, -stride) * (legAmp * 1.3);
      rig.rightCalf.rotation.x = -Math.max(0, stride) * (legAmp * 1.3);
    }

    if (isCrouching) {
      // Tactical crouch-walk stealth stalk with bent knees and forward posture
      rig.body.position.y = 0.74 + Math.abs(Math.sin(time * walkFreq * 2)) * 0.025;
      rig.body.rotation.x = 0.22;
      rig.leftLeg.rotation.x = 0.35 + stride * 0.38;
      rig.rightLeg.rotation.x = 0.35 - stride * 0.38;
      if (rig.leftCalf && rig.rightCalf) {
        rig.leftCalf.rotation.x = -0.55 - Math.max(0, -stride) * 0.35;
        rig.rightCalf.rotation.x = -0.55 - Math.max(0, stride) * 0.35;
      }
    } else {
      // Subtle torso vertical bounce & spine sway
      rig.body.position.y = baseBodyY + Math.abs(Math.sin(time * walkFreq * 2)) * (isRunning ? 0.055 : 0.038);
      // Dynamic forward athletic lean when running/sprinting
      rig.body.rotation.x = isSprinting ? 0.22 : isRunning ? 0.14 : 0.04;
    }

    if (isPanicking) {
      // Panic fleeing: glance back and high arm pump
      rig.head.rotation.y = Math.sin(time * 5) * 0.32;
      rig.head.rotation.x = -0.15;
      rig.leftArm.rotation.x = -stride * armAmp;
      rig.rightArm.rotation.x = stride * armAmp;
      rig.leftArm.rotation.z = 0.22;
      rig.rightArm.rotation.z = -0.22;
    } else if (!isAiming && !animOptions?.isReloading) {
      rig.head.rotation.y = 0;
      rig.head.rotation.x = 0;

      const isArmedOfficer = (rig.type === 'player' || rig.type === 'police_npc') && !rig.accessoryGroup;
      const cat = animOptions?.weaponCategory || rig.currentWeaponCategory || 'handgun';
      const isRifleOrShotgun = cat === 'rifle' || cat === 'shotgun' || cat === 'sniper';

      if (isArmedOfficer) {
        // Natural two-handed tactical ready / patrol carry while moving
        const strideBob = Math.sin(time * walkFreq) * 0.035;
        if (isRifleOrShotgun) {
          rig.rightArm.rotation.x = -Math.PI * 0.28 + strideBob;
          rig.rightArm.rotation.y = -0.22;
          rig.rightArm.rotation.z = 0.08;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.42;

          rig.leftArm.rotation.x = -Math.PI * 0.30 + strideBob;
          rig.leftArm.rotation.y = 0.26;
          rig.leftArm.rotation.z = 0.14;
          if (rig.leftForearm) rig.leftForearm.rotation.x = -0.62;
        } else {
          // Handgun (Vortex-9) / Taser two-handed low ready
          rig.rightArm.rotation.x = -Math.PI * 0.26 + strideBob;
          rig.rightArm.rotation.y = -0.16;
          rig.rightArm.rotation.z = 0.06;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.38;

          rig.leftArm.rotation.x = -Math.PI * 0.24 + strideBob;
          rig.leftArm.rotation.y = 0.32;
          rig.leftArm.rotation.z = 0.12;
          if (rig.leftForearm) rig.leftForearm.rotation.x = -0.42;
        }
      } else {
        // Arm swing with organic elbow bend for civilians
        const armSwing = -stride * armAmp;
        rig.leftArm.rotation.x = armSwing;
        rig.rightArm.rotation.x = -armSwing;
        rig.leftArm.rotation.z = 0.08;
        rig.rightArm.rotation.z = -0.08;

        if (rig.leftForearm) {
          rig.leftForearm.rotation.x = -Math.max(0, -armSwing) * 0.5 - 0.15;
        }
        if (rig.rightForearm) {
          rig.rightForearm.rotation.x = -Math.max(0, armSwing) * 0.5 - 0.15;
        }

        // Handle handheld civilian accessories while walking
        if (rig.accessoryType === 'phone') {
          rig.rightArm.rotation.x = -Math.PI * 0.36 + Math.sin(time * walkFreq) * 0.05;
          rig.rightArm.rotation.y = -0.18;
          rig.rightArm.rotation.z = 0.06;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.55;
        } else if (rig.accessoryType === 'coffee') {
          rig.rightArm.rotation.x = -Math.PI * 0.24 + Math.sin(time * walkFreq) * 0.04;
          rig.rightArm.rotation.y = -0.12;
          rig.rightArm.rotation.z = 0.04;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.45;
        } else if (rig.accessoryType === 'briefcase' || rig.accessoryType === 'shopping_bag') {
          rig.rightArm.rotation.x = stride * (armAmp * 0.32);
          rig.rightArm.rotation.y = 0;
          rig.rightArm.rotation.z = -0.06;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.1;
        } else if (rig.accessoryType === 'wrench') {
          rig.rightArm.rotation.x = stride * (armAmp * 0.3) - 0.25;
          rig.rightArm.rotation.y = 0.1;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.3;
        } else if (rig.accessoryType === 'groceries') {
          rig.rightArm.rotation.x = -Math.PI * 0.38 + Math.sin(time * walkFreq) * 0.03;
          rig.rightArm.rotation.y = -0.15;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.6;
        }
      }
    }
  } else {
    // ------------------------------------------------------------------
    // IDLE (GENTLE BREATHING & POSTURE SWAY)
    // ------------------------------------------------------------------
    const breath = Math.sin(time * 2.2) * 0.016;
    rig.body.position.y = baseBodyY + breath;
    rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, isCrouching ? 0.12 : 0, 0.2);
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, isCrouching ? 0.45 : 0, 0.2);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, isCrouching ? 0.45 : 0, 0.2);
    if (rig.leftCalf) rig.leftCalf.rotation.x = THREE.MathUtils.lerp(rig.leftCalf.rotation.x, isCrouching ? -0.55 : 0, 0.2);
    if (rig.rightCalf) rig.rightCalf.rotation.x = THREE.MathUtils.lerp(rig.rightCalf.rotation.x, isCrouching ? -0.55 : 0, 0.2);

    if (!isAiming && !animOptions?.isReloading) {
      const isArmedOfficer = (rig.type === 'player' || rig.type === 'police_npc') && !rig.accessoryGroup;
      const cat = animOptions?.weaponCategory || rig.currentWeaponCategory || 'handgun';
      const isRifleOrShotgun = cat === 'rifle' || cat === 'shotgun' || cat === 'sniper';

      if (isArmedOfficer) {
        // Natural two-handed ready grip in idle posture
        const breathSway = Math.sin(time * 2.2) * 0.015;
        if (isRifleOrShotgun) {
          rig.rightArm.rotation.x = -Math.PI * 0.28 + breathSway;
          rig.rightArm.rotation.y = -0.22;
          rig.rightArm.rotation.z = 0.08;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.42;

          rig.leftArm.rotation.x = -Math.PI * 0.30 + breathSway;
          rig.leftArm.rotation.y = 0.26;
          rig.leftArm.rotation.z = 0.14;
          if (rig.leftForearm) rig.leftForearm.rotation.x = -0.62;
        } else {
          // Handgun (Vortex-9) / Taser two-handed low ready in idle
          rig.rightArm.rotation.x = -Math.PI * 0.25 + breathSway;
          rig.rightArm.rotation.y = -0.16;
          rig.rightArm.rotation.z = 0.06;
          if (rig.rightForearm) rig.rightForearm.rotation.x = -0.38;

          rig.leftArm.rotation.x = -Math.PI * 0.23 + breathSway;
          rig.leftArm.rotation.y = 0.32;
          rig.leftArm.rotation.z = 0.12;
          if (rig.leftForearm) rig.leftForearm.rotation.x = -0.42;
        }
      } else if (rig.accessoryType === 'phone') {
        rig.head.rotation.x = 0.28;
        rig.head.rotation.y = 0;
        rig.rightArm.rotation.x = -Math.PI * 0.46;
        rig.rightArm.rotation.y = -0.22;
        rig.rightArm.rotation.z = 0.08;
        if (rig.rightForearm) rig.rightForearm.rotation.x = -0.65;
        rig.leftArm.rotation.x = Math.sin(time * 2.2) * 0.03;
        rig.leftArm.rotation.z = 0.08;
      } else if (rig.accessoryType === 'coffee') {
        rig.head.rotation.x = 0;
        rig.head.rotation.y = 0;
        rig.rightArm.rotation.x = -Math.PI * 0.28;
        rig.rightArm.rotation.y = -0.14;
        rig.rightArm.rotation.z = 0.04;
        if (rig.rightForearm) rig.rightForearm.rotation.x = -0.5;
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
        if (rig.leftForearm) rig.leftForearm.rotation.x = -0.15;
        if (rig.rightForearm) rig.rightForearm.rotation.x = -0.15;
      }
    }
  }

  // ------------------------------------------------------------------
  // TACTICAL AIMING (TWO-HANDED NATURAL GRIP & RETICLE PITCH)
  // ------------------------------------------------------------------
  if (isAiming && !animOptions?.isReloading) {
    const pitch = THREE.MathUtils.clamp(animOptions?.aimPitch ?? 0, -0.65, 0.85);
    const cat = animOptions?.weaponCategory || rig.currentWeaponCategory || 'handgun';
    const isRifleOrShotgun = cat === 'rifle' || cat === 'shotgun' || cat === 'sniper';

    // Spine and head pitch tilt to align with camera elevation/center reticle
    rig.body.rotation.x = (isCrouching ? 0.22 : 0.04) + pitch * 0.45;
    rig.head.rotation.x = pitch * 0.45;

    if (isRifleOrShotgun) {
      // Natural Two-Handed Rifle / Shotgun Grip:
      // Right hand holds trigger grip anchored against shoulder
      rig.rightArm.rotation.x = -Math.PI * 0.46 + pitch * 0.55;
      rig.rightArm.rotation.y = -0.22;
      rig.rightArm.rotation.z = 0.08;
      if (rig.rightForearm) {
        rig.rightForearm.rotation.x = -0.32;
        rig.rightForearm.rotation.y = -0.05;
      }

      // Left hand reaches forward under the rifle handguard/barrel
      rig.leftArm.rotation.x = -Math.PI * 0.48 + pitch * 0.55;
      rig.leftArm.rotation.y = 0.30;
      rig.leftArm.rotation.z = 0.16;
      if (rig.leftForearm) {
        rig.leftForearm.rotation.x = -0.66;
        rig.leftForearm.rotation.y = 0.18;
      }
    } else {
      // Natural Two-Handed Vortex-9 Pistol / Taser Weaver Police Grip:
      // Right arm extends forward
      rig.rightArm.rotation.x = -Math.PI * 0.49 + pitch * 0.55;
      rig.rightArm.rotation.y = -0.14;
      rig.rightArm.rotation.z = 0.04;
      if (rig.rightForearm) {
        rig.rightForearm.rotation.x = -0.16;
        rig.rightForearm.rotation.y = -0.04;
      }

      // Left arm wraps firmly around right hand and pistol grip with both hands
      rig.leftArm.rotation.x = -Math.PI * 0.47 + pitch * 0.55;
      rig.leftArm.rotation.y = 0.36;
      rig.leftArm.rotation.z = 0.18;
      if (rig.leftForearm) {
        rig.leftForearm.rotation.x = -0.34;
        rig.leftForearm.rotation.y = -0.14;
      }
    }
  }

  // ------------------------------------------------------------------
  // WEAPON RELOAD ANIMATION (DETACHABLE MAGAZINE SEQUENCE)
  // ------------------------------------------------------------------
  if (animOptions?.isReloading) {
    const progress = THREE.MathUtils.clamp(animOptions.reloadProgress ?? 0.5, 0, 1);

    // Right arm holds weapon closer to chest
    rig.rightArm.rotation.x = -Math.PI / 2.6;
    rig.rightArm.rotation.y = -0.18;
    rig.rightArm.rotation.z = 0.12;
    if (rig.rightForearm) rig.rightForearm.rotation.x = -0.45;

    if (progress < 0.35) {
      // Phase 1: Left hand drops to belt pouch to pull fresh magazine
      const p1 = progress / 0.35;
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(-0.4, 0.25, p1);
      rig.leftArm.rotation.y = THREE.MathUtils.lerp(0.2, 0.45, p1);
      rig.leftArm.rotation.z = 0.15;
      if (rig.leftForearm) rig.leftForearm.rotation.x = THREE.MathUtils.lerp(-0.3, -0.1, p1);
      if (rig.magazineMesh) rig.magazineMesh.position.y = -0.08 - p1 * 0.18;
    } else if (progress < 0.75) {
      // Phase 2: Left hand brings fresh magazine up and inserts into firearm grip
      const p2 = (progress - 0.35) / 0.40;
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(0.25, -Math.PI / 2.4, p2);
      rig.leftArm.rotation.y = THREE.MathUtils.lerp(0.45, 0.25, p2);
      rig.leftArm.rotation.z = 0.15;
      if (rig.leftForearm) rig.leftForearm.rotation.x = THREE.MathUtils.lerp(-0.1, -0.65, p2);
      if (rig.magazineMesh) rig.magazineMesh.position.y = -0.26 + p2 * 0.18;
    } else {
      // Phase 3: Left hand cycles slide and returns to weapon grip
      const p3 = (progress - 0.75) / 0.25;
      rig.leftArm.rotation.x = -Math.PI / 2.3;
      rig.leftArm.rotation.y = 0.32;
      rig.leftArm.rotation.z = 0.15;
      if (rig.leftForearm) rig.leftForearm.rotation.x = -0.45;
      if (rig.magazineMesh) rig.magazineMesh.position.set(0, -0.08, -0.02);
    }
  } else if (rig.magazineMesh) {
    rig.magazineMesh.position.set(0, -0.08, -0.02);
  }

  // ------------------------------------------------------------------
  // WEAPON RECOIL & FLINCH REACTIONS
  // ------------------------------------------------------------------
  if (rig.recoilTimer > 0) {
    rig.recoilTimer -= 0.035;
    const recoilProgress = Math.max(0, rig.recoilTimer / 0.14);
    if (rig.rightArm) {
      rig.rightArm.rotation.x -= 0.20 * recoilProgress;
      rig.rightArm.rotation.z += 0.04 * recoilProgress;
    }
    if (rig.leftArm && isAiming) {
      rig.leftArm.rotation.x -= 0.16 * recoilProgress;
    }
    if (rig.muzzleFlash) {
      rig.muzzleFlash.visible = true;
      (rig.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0.95;
      rig.muzzleFlash.children.forEach((c) => {
        if (c instanceof THREE.Mesh && c.material) {
          (c.material as THREE.MeshBasicMaterial).opacity = 0.9;
        }
      });
      rig.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      const s = 0.9 + Math.random() * 0.4;
      rig.muzzleFlash.scale.set(s, s, s);
    }
    if (rig.muzzleLight) {
      rig.muzzleLight.intensity = 2.6;
    }
  } else {
    if (rig.muzzleFlash) {
      rig.muzzleFlash.visible = false;
      (rig.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0;
    }
    if (rig.muzzleLight) {
      rig.muzzleLight.intensity = 0;
    }
  }

  // Damage flinch reaction (impact jerk from bullet or hit)
  if (rig.flinchTimer > 0) {
    rig.flinchTimer -= 0.035;
    rig.body.rotation.x = -0.18;
    rig.head.rotation.x = -0.22;
    rig.leftArm.rotation.x += 0.25;
    rig.rightArm.rotation.x += 0.25;
    rig.body.position.y += 0.03;
  }
}
