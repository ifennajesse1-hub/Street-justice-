import * as THREE from 'three';
import { AppearanceProfile } from './NPCAppearanceSystem';

export interface TorsoLimbResult {
  body: THREE.Mesh;
  neck: THREE.Mesh;
  belt: THREE.Mesh;
}

// --------------------------------------------------------------------
// 2. TORSO & CLOTHING BUILDER
// --------------------------------------------------------------------
export function buildTorsoWithClothing(
  profile: AppearanceProfile,
  matSkin: THREE.MeshStandardMaterial,
  matShirt: THREE.MeshStandardMaterial,
  matPants: THREE.MeshStandardMaterial,
  matLeather: THREE.MeshStandardMaterial,
  type: string
): TorsoLimbResult {
  const isFemale = profile.bodyType === 'female_slender';
  const isStocky = profile.bodyType === 'male_stocky';
  const isElder = profile.bodyType === 'elder';

  // 1. Anatomical Torso Dimensions
  const topRadius = isFemale ? 0.20 : isStocky ? 0.26 : 0.23;
  const bottomRadius = isFemale ? 0.17 : isStocky ? 0.22 : 0.18;
  const torsoHeight = isElder ? 0.62 : 0.66;

  const torsoGeom = new THREE.CylinderGeometry(topRadius, bottomRadius, torsoHeight, 16);
  torsoGeom.scale(
    (isFemale ? 1.05 : isStocky ? 1.22 : 1.15) * profile.buildScale.x,
    profile.buildScale.y,
    (isFemale ? 0.72 : isStocky ? 0.82 : 0.76) * profile.buildScale.z
  );
  torsoGeom.computeVertexNormals();

  const body = new THREE.Mesh(torsoGeom, matShirt);
  body.position.y = 1.04;
  body.castShadow = true;
  body.receiveShadow = true;

  // 2. Anatomical Neck
  const neckRadius = isFemale ? 0.065 : 0.075;
  const neckGeom = new THREE.CylinderGeometry(neckRadius, neckRadius + 0.015, 0.13, 12);
  const neck = new THREE.Mesh(neckGeom, matSkin);
  neck.position.y = 0.38;
  body.add(neck);

  // 3. Street Clothing Details
  const style = profile.clothingStyle;
  const matAccent = new THREE.MeshStandardMaterial({ color: profile.accentColor, roughness: 0.7 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });
  const matSilver = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

  if (style === 'hoodie') {
    // Streetwear Hoodie: Kangaroo front pocket + hood on back
    const pocketGeom = new THREE.BoxGeometry(0.24, 0.14, 0.06);
    const pocket = new THREE.Mesh(pocketGeom, matAccent);
    pocket.position.set(0, -0.10, 0.145);
    body.add(pocket);

    // Hood draped on back of neck
    const hoodGeom = new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hoodGeom.rotateX(Math.PI * 0.85);
    const hood = new THREE.Mesh(hoodGeom, matAccent);
    hood.position.set(0, 0.24, -0.12);
    body.add(hood);
  } else if (style === 'button_shirt' || style === 'blazer') {
    // Collared button placket
    const placketGeom = new THREE.BoxGeometry(0.045, 0.44, 0.02);
    const placket = new THREE.Mesh(placketGeom, matAccent);
    placket.position.set(0, 0.05, 0.155);
    body.add(placket);

    // Collar flaps
    [-0.08, 0.08].forEach((cx) => {
      const collarGeom = new THREE.BoxGeometry(0.07, 0.05, 0.03);
      const collar = new THREE.Mesh(collarGeom, matAccent);
      collar.position.set(cx, 0.28, 0.12);
      collar.rotation.z = (cx > 0 ? 1 : -1) * 0.25;
      body.add(collar);
    });

    if (style === 'blazer') {
      // Suit Jacket Lapels
      [-0.12, 0.12].forEach((lx) => {
        const lapelGeom = new THREE.BoxGeometry(0.07, 0.32, 0.025);
        const lapel = new THREE.Mesh(lapelGeom, matShirt);
        lapel.position.set(lx, 0.12, 0.16);
        lapel.rotation.z = (lx > 0 ? -1 : 1) * 0.12;
        body.add(lapel);
      });
      // Pocket handkerchief slit
      const pocketGeom = new THREE.BoxGeometry(0.06, 0.015, 0.01);
      const pocket = new THREE.Mesh(pocketGeom, matAccent);
      pocket.position.set(-0.12, 0.16, 0.17);
      body.add(pocket);
    }
  } else if (style === 'jacket' || style === 'gang_streetwear') {
    // Outer Jacket Layer with Collar
    const jacketGeom = new THREE.CylinderGeometry(topRadius + 0.025, bottomRadius + 0.02, torsoHeight * 0.85, 16);
    jacketGeom.scale(1.16, 1.0, 0.82);
    const jacket = new THREE.Mesh(jacketGeom, matAccent);
    jacket.position.y = 0.04;
    body.add(jacket);

    // Collar
    const collarGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.06, 14);
    const collar = new THREE.Mesh(collarGeom, matAccent);
    collar.position.y = 0.30;
    body.add(collar);
  } else if (style === 'apron') {
    // Kitchen / Shop Apron (Mama Leah, Deli clerks)
    const apronBibGeom = new THREE.BoxGeometry(0.24, 0.28, 0.02);
    const apronBib = new THREE.Mesh(apronBibGeom, matAccent);
    apronBib.position.set(0, 0.12, 0.155);
    body.add(apronBib);

    const apronSkirtGeom = new THREE.BoxGeometry(0.34, 0.32, 0.03);
    const apronSkirt = new THREE.Mesh(apronSkirtGeom, matAccent);
    apronSkirt.position.set(0, -0.16, 0.158);
    body.add(apronSkirt);
  } else if (style === 'safety_vest') {
    // High-Vis Construction Safety Vest
    const vestGeom = new THREE.CylinderGeometry(topRadius + 0.02, bottomRadius + 0.02, torsoHeight * 0.82, 16);
    vestGeom.scale(1.16, 1.0, 0.82);
    const vest = new THREE.Mesh(vestGeom, matAccent);
    vest.position.y = 0.03;
    body.add(vest);

    // Silver reflective safety stripes
    [-0.04, 0.08].forEach((sy) => {
      const stripeGeom = new THREE.BoxGeometry(0.34, 0.025, 0.24);
      const stripe = new THREE.Mesh(stripeGeom, matSilver);
      stripe.position.set(0, sy, 0);
      body.add(stripe);
    });
  } else if (style === 'police_uniform') {
    // ----------------------------------------------------------------
    // Official Police Uniform: Epaulets, Gold Badge, Axon Bodycam, Nameplate
    // ----------------------------------------------------------------
    // Vest / Uniform plate
    const vestGeom = new THREE.CylinderGeometry(0.25, 0.21, 0.52, 16);
    vestGeom.scale(1.16, 1.0, 0.80);
    const vest = new THREE.Mesh(vestGeom, matShirt);
    vest.position.y = 0.04;
    body.add(vest);

    // Shoulder strap epaulets with gold rank bars
    [-0.22, 0.22].forEach((sx) => {
      const epGeom = new THREE.BoxGeometry(0.08, 0.035, 0.18);
      const ep = new THREE.Mesh(epGeom, matShirt);
      ep.position.set(sx, 0.28, 0);
      body.add(ep);

      const barGeom = new THREE.BoxGeometry(0.04, 0.012, 0.08);
      const bar = new THREE.Mesh(barGeom, matGold);
      bar.position.set(sx, 0.302, 0);
      body.add(bar);
    });

    // 1. Polished Gold Police Star Badge on Left Chest
    const badgeGeom = new THREE.CylinderGeometry(0.048, 0.022, 0.08, 7);
    badgeGeom.rotateX(Math.PI / 2);
    const badge = new THREE.Mesh(badgeGeom, matGold);
    badge.position.set(-0.135, 0.12, 0.175);
    body.add(badge);

    const starGeom = new THREE.SphereGeometry(0.014, 5, 5);
    const star = new THREE.Mesh(starGeom, matSilver);
    star.position.set(-0.135, 0.12, 0.22);
    body.add(star);

    // 2. Axon Body Camera on Chest with Active Green Recording LED
    const bodyCamGeom = new THREE.BoxGeometry(0.065, 0.085, 0.038);
    const bodyCam = new THREE.Mesh(bodyCamGeom, matLeather);
    bodyCam.position.set(-0.02, 0.10, 0.185);
    body.add(bodyCam);

    const ledGeom = new THREE.SphereGeometry(0.010, 6, 6);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Active recording green
    const led = new THREE.Mesh(ledGeom, ledMat);
    led.position.set(-0.02, 0.125, 0.208);
    body.add(led);

    // 3. High-Visibility Yellow Reflective "POLICE" Back Banner
    const stripGeom = new THREE.PlaneGeometry(0.32, 0.09);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const strip = new THREE.Mesh(stripGeom, stripMat);
    strip.position.set(0, 0.12, -0.178);
    body.add(strip);

    // 4. Shoulder Mic on Left Collar with Coiled Cord
    const micGeom = new THREE.BoxGeometry(0.055, 0.065, 0.035);
    const mic = new THREE.Mesh(micGeom, matLeather);
    mic.position.set(-0.16, 0.28, 0.12);
    body.add(mic);

    const cordGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.45, 6);
    const cord = new THREE.Mesh(cordGeom, matLeather);
    cord.position.set(-0.19, 0.02, 0.10);
    cord.rotation.z = 0.12;
    body.add(cord);

    // 5. Engraved Silver Nameplate on Right Chest
    const namePlateGeom = new THREE.BoxGeometry(0.08, 0.022, 0.012);
    const namePlate = new THREE.Mesh(namePlateGeom, matSilver);
    namePlate.position.set(0.12, 0.12, 0.178);
    body.add(namePlate);
  } else if (style === 'swat') {
    // SWAT Heavy Ballistic Armor Plate Carrier
    const armorGeom = new THREE.CylinderGeometry(0.26, 0.22, 0.54, 16);
    armorGeom.scale(1.18, 1.0, 0.82);
    const armor = new THREE.Mesh(armorGeom, matShirt);
    armor.position.y = 0.04;
    body.add(armor);

    // Triple Mag Pouches on Chest
    [-0.08, 0, 0.08].forEach((mx) => {
      const magGeom = new THREE.BoxGeometry(0.06, 0.12, 0.04);
      const mag = new THREE.Mesh(magGeom, matLeather);
      mag.position.set(mx, 0.02, 0.185);
      body.add(mag);
    });
  }

  // 4. Duty Belt or Civilian Belt
  const isLawEnforcement = type === 'player' || type === 'police_npc';
  const beltGeom = new THREE.CylinderGeometry(0.21, 0.21, isLawEnforcement ? 0.09 : 0.05, 16);
  beltGeom.scale(1.15 * profile.buildScale.x, 1.0, 0.78 * profile.buildScale.z);
  const belt = new THREE.Mesh(beltGeom, isLawEnforcement ? matLeather : matPants);
  belt.position.y = -0.32;
  body.add(belt);

  // Buckle
  const buckleGeom = new THREE.BoxGeometry(0.07, isLawEnforcement ? 0.06 : 0.04, 0.025);
  const buckle = new THREE.Mesh(buckleGeom, matSilver);
  buckle.position.set(0, -0.32, 0.172);
  body.add(buckle);

  if (isLawEnforcement) {
    // Belt Keepers, Taser, Radio, Cuffs
    const magPouchGeom = new THREE.BoxGeometry(0.08, 0.10, 0.05);
    const magPouch = new THREE.Mesh(magPouchGeom, matLeather);
    magPouch.position.set(-0.11, -0.31, 0.17);
    body.add(magPouch);

    // Yellow Axon Taser
    const taserGeom = new THREE.BoxGeometry(0.05, 0.10, 0.08);
    const matTaser = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
    const taser = new THREE.Mesh(taserGeom, matTaser);
    taser.position.set(0.12, -0.31, 0.16);
    body.add(taser);

    // Motorola Radio with Antenna
    const radioGeom = new THREE.BoxGeometry(0.07, 0.13, 0.06);
    const radio = new THREE.Mesh(radioGeom, matLeather);
    radio.position.set(-0.23, -0.28, 0.06);
    body.add(radio);

    const antGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6);
    const ant = new THREE.Mesh(antGeom, matLeather);
    ant.position.set(-0.23, -0.14, 0.06);
    body.add(ant);

    // Handcuff Pouch on back
    const cuffPouchGeom = new THREE.BoxGeometry(0.09, 0.09, 0.05);
    const cuffPouch = new THREE.Mesh(cuffPouchGeom, matLeather);
    cuffPouch.position.set(0, -0.31, -0.16);
    body.add(cuffPouch);
  }

  // 5. Flowing A-Line Skirt or Dress Lower Hem (for female civilians, shoppers, Mama Leah)
  if (profile.pantsStyle === 'skirt' || profile.clothingStyle === 'dress') {
    const matSkirt = new THREE.MeshStandardMaterial({
      color: profile.clothingStyle === 'dress' ? profile.shirtColor : profile.pantsColor,
      roughness: 0.75,
      side: THREE.DoubleSide,
    });
    const skirtGeom = new THREE.CylinderGeometry(0.20, 0.32, 0.36, 16);
    skirtGeom.scale(1.15 * profile.buildScale.x, 1.0, 0.85 * profile.buildScale.z);
    const skirt = new THREE.Mesh(skirtGeom, matSkirt);
    skirt.position.y = -0.42;
    skirt.castShadow = true;
    body.add(skirt);
  }

  return { body, neck, belt };
}

export interface ArmLimbResult {
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
}

export interface LegLimbResult {
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftCalf: THREE.Group;
  rightCalf: THREE.Group;
}

// --------------------------------------------------------------------
// 3. ARTICULATED ARMS, ELBOW JOINTS & DETAILED SCULPTED HANDS
// --------------------------------------------------------------------
export function buildArticulatedArms(
  profile: AppearanceProfile,
  matSkin: THREE.MeshStandardMaterial,
  matShirt: THREE.MeshStandardMaterial,
  matLeather: THREE.MeshStandardMaterial,
  matSilver: THREE.MeshStandardMaterial,
  type: string
): ArmLimbResult {
  const isFemale = profile.bodyType === 'female_slender';
  const isStocky = profile.bodyType === 'male_stocky';
  const isElder = profile.bodyType === 'elder';

  const shoulderOffsetX = (isFemale ? 0.27 : isStocky ? 0.35 : isElder ? 0.28 : 0.31) * profile.buildScale.x;
  const shoulderRadius = isFemale ? 0.068 : isStocky ? 0.088 : 0.078;
  const upperArmRadiusTop = isFemale ? 0.058 : isStocky ? 0.078 : 0.068;
  const upperArmRadiusBottom = isFemale ? 0.048 : isStocky ? 0.068 : 0.058;
  const forearmRadiusTop = isFemale ? 0.048 : isStocky ? 0.066 : 0.056;
  const forearmRadiusBottom = isFemale ? 0.040 : isStocky ? 0.056 : 0.048;

  const isShortSleeve =
    profile.clothingStyle === 'tshirt' ||
    profile.clothingStyle === 'apron' ||
    profile.clothingStyle === 'scrubs';

  const isTacticalGloved =
    profile.clothingStyle === 'swat' ||
    type === 'syndicate_operative' ||
    (type === 'police_npc' && profile.shirtColor === 0x0f172a);

  const matHand = isTacticalGloved ? matLeather : matSkin;

  let leftForearm: THREE.Group = new THREE.Group();
  let rightForearm: THREE.Group = new THREE.Group();

  const createArm = (isRight: boolean): { arm: THREE.Group; forearm: THREE.Group } => {
    const armGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    armGroup.position.set(side * shoulderOffsetX, 0.24, 0);

    // Deltoid / Shoulder Sphere
    const shoulderGeom = new THREE.SphereGeometry(shoulderRadius, 10, 10);
    const shoulder = new THREE.Mesh(shoulderGeom, matShirt);
    shoulder.castShadow = true;
    armGroup.add(shoulder);

    // Upper Arm
    if (isShortSleeve) {
      // Clothed upper sleeve cuff
      const sleeveGeom = new THREE.CylinderGeometry(upperArmRadiusTop, upperArmRadiusTop, 0.10, 12);
      sleeveGeom.computeVertexNormals();
      const sleeve = new THREE.Mesh(sleeveGeom, matShirt);
      sleeve.position.y = -0.05;
      sleeve.castShadow = true;
      armGroup.add(sleeve);

      // Bare skin bicep
      const bicepGeom = new THREE.CylinderGeometry(upperArmRadiusTop - 0.005, upperArmRadiusBottom, 0.18, 12);
      bicepGeom.computeVertexNormals();
      const bicep = new THREE.Mesh(bicepGeom, matSkin);
      bicep.position.y = -0.19;
      bicep.castShadow = true;
      armGroup.add(bicep);
    } else {
      // Full clothed sleeve
      const upperArmGeom = new THREE.CylinderGeometry(upperArmRadiusTop, upperArmRadiusBottom, 0.28, 12);
      upperArmGeom.computeVertexNormals();
      const upperArm = new THREE.Mesh(upperArmGeom, matShirt);
      upperArm.position.y = -0.14;
      upperArm.castShadow = true;
      armGroup.add(upperArm);
    }

    // Police Department Shoulder Patch (Shield with gold trim on outer arm)
    if (type === 'player' || type === 'police_npc') {
      const patchGeom = new THREE.PlaneGeometry(0.05, 0.07);
      const patchMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, side: THREE.DoubleSide });
      const patch = new THREE.Mesh(patchGeom, patchMat);
      patch.position.set(side * (upperArmRadiusTop + 0.006), -0.09, 0);
      patch.rotation.y = (side * Math.PI) / 2;
      armGroup.add(patch);

      // Gold rank bar
      const barGeom = new THREE.PlaneGeometry(0.035, 0.012);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
      const bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(side * (upperArmRadiusTop + 0.007), -0.13, 0);
      bar.rotation.y = (side * Math.PI) / 2;
      armGroup.add(bar);
    }

    // Forearm Group pivoted at elbow (-0.28m)
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, -0.28, 0);

    // Elbow Joint
    const elbowGeom = new THREE.SphereGeometry(forearmRadiusTop, 8, 8);
    const elbow = new THREE.Mesh(elbowGeom, isShortSleeve ? matSkin : matShirt);
    forearmGroup.add(elbow);

    // Forearm Cylinder
    const forearmGeom = new THREE.CylinderGeometry(forearmRadiusTop, forearmRadiusBottom, 0.24, 12);
    forearmGeom.computeVertexNormals();
    const forearm = new THREE.Mesh(forearmGeom, isShortSleeve ? matSkin : matShirt);
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    // Wrist cuff ring if clothed
    if (!isShortSleeve) {
      const cuffGeom = new THREE.CylinderGeometry(forearmRadiusBottom + 0.008, forearmRadiusBottom + 0.008, 0.03, 12);
      const cuff = new THREE.Mesh(cuffGeom, matShirt);
      cuff.position.y = -0.22;
      forearmGroup.add(cuff);
    }

    // Sculpted Human Hand: Palm + Opposable Thumb + Articulated Knuckles & Fingers
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.26, 0.02);

    // Palm block
    const palmWidth = isFemale ? 0.058 : isStocky ? 0.074 : 0.066;
    const palmGeom = new THREE.BoxGeometry(palmWidth, 0.065, 0.045);
    const palm = new THREE.Mesh(palmGeom, matHand);
    palm.castShadow = true;
    handGroup.add(palm);

    // Opposable Thumb
    const thumbGeom = new THREE.BoxGeometry(0.020, 0.038, 0.024);
    const thumb = new THREE.Mesh(thumbGeom, matHand);
    thumb.position.set(-side * (palmWidth * 0.45 + 0.006), 0.01, 0.016);
    thumb.rotation.z = -side * 0.35;
    thumb.rotation.x = -0.15;
    handGroup.add(thumb);

    // Fingers / Knuckles block
    const fingersGeom = new THREE.BoxGeometry(palmWidth * 0.94, 0.040, 0.038);
    const fingers = new THREE.Mesh(fingersGeom, matHand);
    fingers.position.set(0, -0.045, 0.008);
    fingers.rotation.x = 0.2; // Natural relaxed curved grip
    handGroup.add(fingers);

    forearmGroup.add(handGroup);

    // Tactical Digital Watch on Left Wrist
    if (!isRight && (type === 'player' || type === 'police_npc' || profile.clothingStyle === 'blazer')) {
      const watchGeom = new THREE.TorusGeometry(0.048, 0.010, 6, 12);
      const watchMesh = new THREE.Mesh(watchGeom, matLeather);
      watchMesh.position.set(0, -0.21, 0);
      watchMesh.rotation.x = Math.PI / 2;
      forearmGroup.add(watchMesh);

      const faceGeom = new THREE.BoxGeometry(0.032, 0.010, 0.032);
      const faceMesh = new THREE.Mesh(faceGeom, matSilver);
      faceMesh.position.set(0, -0.21, 0.048);
      forearmGroup.add(faceMesh);

      const screenGeom = new THREE.PlaneGeometry(0.022, 0.022);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(0, -0.21, 0.054);
      forearmGroup.add(screen);
    }

    armGroup.add(forearmGroup);
    return { arm: armGroup, forearm: forearmGroup };
  };

  const left = createArm(false);
  const right = createArm(true);
  leftForearm = left.forearm;
  rightForearm = right.forearm;

  return {
    leftArm: left.arm,
    rightArm: right.arm,
    leftForearm,
    rightForearm,
  };
}

// --------------------------------------------------------------------
// 4. ARTICULATED LEGS, KNEE JOINTS & DIVERSE STYLED FOOTWEAR
// --------------------------------------------------------------------
export function buildArticulatedLegs(
  profile: AppearanceProfile,
  matSkin: THREE.MeshStandardMaterial,
  matPants: THREE.MeshStandardMaterial,
  matLeather: THREE.MeshStandardMaterial,
  matShoe: THREE.MeshStandardMaterial,
  matSilver: THREE.MeshStandardMaterial,
  type: string
): LegLimbResult {
  const isFemale = profile.bodyType === 'female_slender';
  const isStocky = profile.bodyType === 'male_stocky';

  const hipOffsetX = (isFemale ? 0.125 : isStocky ? 0.16 : 0.14) * profile.buildScale.x;
  const thighRadiusTop = isFemale ? 0.095 : isStocky ? 0.125 : 0.11;
  const thighRadiusBottom = isFemale ? 0.078 : isStocky ? 0.105 : 0.09;
  const calfRadiusTop = isFemale ? 0.078 : isStocky ? 0.105 : 0.09;
  const calfRadiusBottom = isFemale ? 0.065 : isStocky ? 0.088 : 0.075;

  const isShorts = profile.pantsStyle === 'shorts';
  const isBareLegs = profile.pantsStyle === 'skirt' || profile.pantsStyle === 'dress';
  const isCargo = profile.pantsStyle === 'cargo';

  const matThigh = isBareLegs ? matSkin : matPants;

  let leftCalf: THREE.Group = new THREE.Group();
  let rightCalf: THREE.Group = new THREE.Group();

  const createLeg = (isRight: boolean): { leg: THREE.Group; calf: THREE.Group } => {
    const legGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    legGroup.position.set(side * hipOffsetX, 0.72, 0);

    // Hip Joint
    const hipGeom = new THREE.SphereGeometry(thighRadiusTop, 8, 8);
    const hip = new THREE.Mesh(hipGeom, isBareLegs ? matSkin : matPants);
    legGroup.add(hip);

    // Thigh
    if (isShorts) {
      // Upper shorts fabric
      const shortsGeom = new THREE.CylinderGeometry(thighRadiusTop, thighRadiusTop * 0.95, 0.20, 12);
      shortsGeom.computeVertexNormals();
      const shortsMesh = new THREE.Mesh(shortsGeom, matPants);
      shortsMesh.position.y = -0.10;
      shortsMesh.castShadow = true;
      legGroup.add(shortsMesh);

      // Bare thigh above knee
      const bareThighGeom = new THREE.CylinderGeometry(thighRadiusTop * 0.93, thighRadiusBottom, 0.16, 12);
      bareThighGeom.computeVertexNormals();
      const bareThigh = new THREE.Mesh(bareThighGeom, matSkin);
      bareThigh.position.y = -0.26;
      bareThigh.castShadow = true;
      legGroup.add(bareThigh);
    } else {
      const thighGeom = new THREE.CylinderGeometry(thighRadiusTop, thighRadiusBottom, 0.36, 12);
      thighGeom.computeVertexNormals();
      const thigh = new THREE.Mesh(thighGeom, matThigh);
      thigh.position.y = -0.18;
      thigh.castShadow = true;
      legGroup.add(thigh);

      // 3D Cargo Utility Pockets with Flap
      if (isCargo) {
        const pocketGeom = new THREE.BoxGeometry(0.035, 0.12, 0.10);
        const pocket = new THREE.Mesh(pocketGeom, matPants);
        pocket.position.set(side * (thighRadiusTop + 0.008), -0.16, 0.01);
        legGroup.add(pocket);

        const flapGeom = new THREE.BoxGeometry(0.038, 0.035, 0.105);
        const flap = new THREE.Mesh(flapGeom, matPants);
        flap.position.set(side * (thighRadiusTop + 0.01), -0.09, 0.01);
        legGroup.add(flap);
      }
    }

    // Right-Thigh Tactical Drop-Leg Holster with Retention Sidearm for Law Enforcement
    if (isRight && (type === 'player' || type === 'police_npc')) {
      const holsterPlateGeom = new THREE.BoxGeometry(0.03, 0.18, 0.12);
      const holsterPlate = new THREE.Mesh(holsterPlateGeom, matLeather);
      holsterPlate.position.set(0.11, -0.18, 0.02);
      legGroup.add(holsterPlate);

      // Holstered Sidearm Grip
      const holsterPistolGeom = new THREE.BoxGeometry(0.04, 0.10, 0.06);
      const matGun = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.25 });
      const holsterPistol = new THREE.Mesh(holsterPistolGeom, matGun);
      holsterPistol.position.set(0.13, -0.12, 0.03);
      legGroup.add(holsterPistol);
    }

    // Calf Group pivoted at Knee (-0.36m)
    const calfGroup = new THREE.Group();
    calfGroup.position.set(0, -0.36, 0);

    // Knee joint / knee pad
    if (type === 'police_npc' || profile.clothingStyle === 'swat' || type === 'enforcer') {
      const padGeom = new THREE.BoxGeometry(0.11, 0.09, 0.05);
      const pad = new THREE.Mesh(padGeom, matLeather);
      pad.position.set(0, 0, 0.075);
      calfGroup.add(pad);
    } else {
      const kneeGeom = new THREE.SphereGeometry(calfRadiusTop * 0.95, 8, 8);
      const knee = new THREE.Mesh(kneeGeom, isShorts || isBareLegs ? matSkin : matPants);
      calfGroup.add(knee);
    }

    // Calf Cylinder
    if (isShorts) {
      // Bare upper calf
      const bareCalfGeom = new THREE.CylinderGeometry(calfRadiusTop, (calfRadiusTop + calfRadiusBottom) * 0.5, 0.18, 12);
      bareCalfGeom.computeVertexNormals();
      const bareCalf = new THREE.Mesh(bareCalfGeom, matSkin);
      bareCalf.position.y = -0.09;
      bareCalf.castShadow = true;
      calfGroup.add(bareCalf);

      // Athletic crew sock rising out of runner
      const matSock = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
      const sockGeom = new THREE.CylinderGeometry((calfRadiusTop + calfRadiusBottom) * 0.52, calfRadiusBottom + 0.005, 0.14, 12);
      sockGeom.computeVertexNormals();
      const sock = new THREE.Mesh(sockGeom, matSock);
      sock.position.y = -0.22;
      sock.castShadow = true;
      calfGroup.add(sock);
    } else if (isBareLegs) {
      const bareCalfGeom = new THREE.CylinderGeometry(calfRadiusTop, calfRadiusBottom, 0.32, 12);
      bareCalfGeom.computeVertexNormals();
      const bareCalf = new THREE.Mesh(bareCalfGeom, matSkin);
      bareCalf.position.y = -0.16;
      bareCalf.castShadow = true;
      calfGroup.add(bareCalf);
    } else {
      const calfGeom = new THREE.CylinderGeometry(calfRadiusTop, calfRadiusBottom, 0.32, 12);
      calfGeom.computeVertexNormals();
      const calf = new THREE.Mesh(calfGeom, matPants);
      calf.position.y = -0.16;
      calf.castShadow = true;
      calfGroup.add(calf);
    }

    // Footwear Tailored to Profile Shoe Style
    buildFootwear(profile, calfGroup, matShoe, matLeather, matSilver, type);

    legGroup.add(calfGroup);
    return { leg: legGroup, calf: calfGroup };
  };

  const left = createLeg(false);
  const right = createLeg(true);
  leftCalf = left.calf;
  rightCalf = right.calf;

  return {
    leftLeg: left.leg,
    rightLeg: right.leg,
    leftCalf,
    rightCalf,
  };
}

function buildFootwear(
  profile: AppearanceProfile,
  calfGroup: THREE.Group,
  matShoe: THREE.MeshStandardMaterial,
  matLeather: THREE.MeshStandardMaterial,
  matSilver: THREE.MeshStandardMaterial,
  type: string
) {
  const style = profile.shoeStyle;
  const isLaw = type === 'player' || type === 'police_npc';

  if (style === 'combat_boots' || isLaw) {
    // Official High-Cut Tactical Combat Patrol Boot
    const bootShaftGeom = new THREE.CylinderGeometry(0.082, 0.088, 0.15, 10);
    const bootShaft = new THREE.Mesh(bootShaftGeom, matLeather);
    bootShaft.position.set(0, -0.27, 0);
    calfGroup.add(bootShaft);

    // Front lace eyelet placket
    const placketGeom = new THREE.BoxGeometry(0.035, 0.14, 0.015);
    const placket = new THREE.Mesh(placketGeom, matSilver);
    placket.position.set(0, -0.27, 0.085);
    calfGroup.add(placket);

    // Boot Foot Body
    const footGeom = new THREE.BoxGeometry(0.13, 0.09, 0.24);
    const foot = new THREE.Mesh(footGeom, matLeather);
    foot.position.set(0, -0.33, 0.05);
    foot.castShadow = true;
    calfGroup.add(foot);

    // Heavy Deep-Tread Rubber Lug Sole
    const soleGeom = new THREE.BoxGeometry(0.136, 0.030, 0.255);
    const soleMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.95 });
    const sole = new THREE.Mesh(soleGeom, soleMat);
    sole.position.set(0, -0.375, 0.05);
    calfGroup.add(sole);

    // Toe Cap
    const toeCapGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.06, 8, 1, false, 0, Math.PI);
    toeCapGeom.rotateZ(Math.PI / 2);
    const toeCap = new THREE.Mesh(toeCapGeom, matLeather);
    toeCap.position.set(0, -0.33, 0.14);
    calfGroup.add(toeCap);
  } else if (style === 'work_boots') {
    // Classic Heavy Tan/Wheat Nubuck Work Boot (Timberland style)
    const matNubuck = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    const matCollar = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.7 });
    const matGumSole = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    // Ankle Collar
    const collarGeom = new THREE.CylinderGeometry(0.084, 0.086, 0.08, 10);
    const collar = new THREE.Mesh(collarGeom, matCollar);
    collar.position.set(0, -0.28, 0);
    calfGroup.add(collar);

    // Nubuck Boot Foot
    const footGeom = new THREE.BoxGeometry(0.135, 0.095, 0.24);
    const foot = new THREE.Mesh(footGeom, matNubuck);
    foot.position.set(0, -0.33, 0.05);
    foot.castShadow = true;
    calfGroup.add(foot);

    // Heavy Gum Lug Sole
    const soleGeom = new THREE.BoxGeometry(0.14, 0.034, 0.255);
    const sole = new THREE.Mesh(soleGeom, matGumSole);
    sole.position.set(0, -0.38, 0.05);
    calfGroup.add(sole);
  } else if (style === 'running') {
    // Modern Athletic Runner with Aerodynamic Curve & Accent Swoosh
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: profile.shoeColor, roughness: 0.5 });

    // Shoe Body
    const footGeom = new THREE.BoxGeometry(0.12, 0.08, 0.23);
    const foot = new THREE.Mesh(footGeom, matAccent);
    foot.position.set(0, -0.33, 0.05);
    foot.castShadow = true;
    calfGroup.add(foot);

    // Curved Wedge Cushion Sole
    const soleGeom = new THREE.BoxGeometry(0.128, 0.035, 0.25);
    const sole = new THREE.Mesh(soleGeom, matWhite);
    sole.position.set(0, -0.37, 0.05);
    calfGroup.add(sole);

    // Aerodynamic flank stripe
    const stripeGeom = new THREE.PlaneGeometry(0.16, 0.03);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const stripeL = new THREE.Mesh(stripeGeom, stripeMat);
    stripeL.position.set(0.065, -0.33, 0.05);
    stripeL.rotation.y = Math.PI / 2;
    calfGroup.add(stripeL);
  } else if (style === 'dress') {
    // Polished Leather Oxford / Low-Heel Dress Shoe
    const matDress = new THREE.MeshStandardMaterial({ color: profile.shoeColor, roughness: 0.35, metalness: 0.1 });
    const footGeom = new THREE.BoxGeometry(0.12, 0.075, 0.235);
    const foot = new THREE.Mesh(footGeom, matDress);
    foot.position.set(0, -0.335, 0.05);
    foot.castShadow = true;
    calfGroup.add(foot);

    // Beveled Heel Lift at rear
    const heelGeom = new THREE.BoxGeometry(0.118, 0.025, 0.08);
    const heelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
    const heel = new THREE.Mesh(heelGeom, heelMat);
    heel.position.set(0, -0.375, -0.04);
    calfGroup.add(heel);

    // Thin dress sole
    const soleGeom = new THREE.BoxGeometry(0.122, 0.015, 0.24);
    const sole = new THREE.Mesh(soleGeom, heelMat);
    sole.position.set(0, -0.375, 0.05);
    calfGroup.add(sole);
  } else {
    // Low/Mid-Top Urban Street Sneaker with White Rubber Foxing Sidewall
    const matWhiteRubber = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
    const matUpper = new THREE.MeshStandardMaterial({ color: profile.shoeColor, roughness: 0.6 });

    // Colored canvas/leather upper
    const footGeom = new THREE.BoxGeometry(0.125, 0.08, 0.23);
    const foot = new THREE.Mesh(footGeom, matUpper);
    foot.position.set(0, -0.33, 0.05);
    foot.castShadow = true;
    calfGroup.add(foot);

    // White Rubber Foxing Sole Sidewall
    const foxingGeom = new THREE.BoxGeometry(0.134, 0.030, 0.245);
    const foxing = new THREE.Mesh(foxingGeom, matWhiteRubber);
    foxing.position.set(0, -0.37, 0.05);
    calfGroup.add(foxing);

    // White Rubber Toe Bumper Cap
    const toeBumperGeom = new THREE.CylinderGeometry(0.064, 0.064, 0.045, 8, 1, false, 0, Math.PI);
    toeBumperGeom.rotateZ(Math.PI / 2);
    const toeBumper = new THREE.Mesh(toeBumperGeom, matWhiteRubber);
    toeBumper.position.set(0, -0.34, 0.14);
    calfGroup.add(toeBumper);

    // White Lace Eyelet Strip
    const laceGeom = new THREE.BoxGeometry(0.038, 0.015, 0.12);
    const lace = new THREE.Mesh(laceGeom, matWhiteRubber);
    lace.position.set(0, -0.29, 0.05);
    calfGroup.add(lace);
  }
}
