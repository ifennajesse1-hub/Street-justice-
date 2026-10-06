import * as THREE from 'three';
import { AppearanceProfile } from './NPCAppearanceSystem';

// --------------------------------------------------------------------
// 1. HEAD, HAIR & FACIAL FEATURES BUILDER
// --------------------------------------------------------------------
export function buildHeadAndFacialFeatures(
  profile: AppearanceProfile,
  matSkin: THREE.MeshStandardMaterial,
  matHair: THREE.MeshStandardMaterial
): THREE.Mesh {
  // Head base with jawline and chin contour
  const isFemale = profile.bodyType === 'female_slender';
  const headGeom = new THREE.SphereGeometry(isFemale ? 0.138 : 0.145, 16, 16);
  headGeom.scale(isFemale ? 0.92 : 0.95, 1.15, 1.05);
  headGeom.computeVertexNormals();
  const head = new THREE.Mesh(headGeom, matSkin);
  head.castShadow = true;

  // Sculpted 3D Nose with bridge and tip
  const noseGeom = new THREE.ConeGeometry(isFemale ? 0.018 : 0.022, 0.052, 6);
  noseGeom.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, matSkin);
  nose.position.set(0, -0.01, 0.155);
  head.add(nose);

  // Eyes with White Sclera, Iris Color, and Pupil
  const matEyeWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const matIris = new THREE.MeshBasicMaterial({ color: profile.eyeColor });
  const matPupil = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const matBrow = new THREE.MeshStandardMaterial({ color: profile.hairColor, roughness: 0.8 });

  [-0.046, 0.046].forEach((ex) => {
    // Sclera (almond eye base)
    const eyeGeom = new THREE.SphereGeometry(0.020, 8, 8);
    eyeGeom.scale(1.2, 0.8, 0.6);
    const eye = new THREE.Mesh(eyeGeom, matEyeWhite);
    eye.position.set(ex, 0.035, 0.138);
    head.add(eye);

    // Iris
    const irisGeom = new THREE.CircleGeometry(0.014, 8);
    const iris = new THREE.Mesh(irisGeom, matIris);
    iris.position.set(ex, 0.035, 0.150);
    head.add(iris);

    // Pupil
    const pupilGeom = new THREE.CircleGeometry(0.007, 6);
    const pupil = new THREE.Mesh(pupilGeom, matPupil);
    pupil.position.set(ex, 0.035, 0.151);
    head.add(pupil);

    // Stylized Eyebrow Arch
    const browGeom = new THREE.BoxGeometry(0.044, isFemale ? 0.007 : 0.010, 0.015);
    const brow = new THREE.Mesh(browGeom, matBrow);
    brow.position.set(ex, isFemale ? 0.060 : 0.062, 0.142);
    brow.rotation.z = (ex > 0 ? -1 : 1) * 0.08;
    head.add(brow);
  });

  // Natural Lips with skin-harmonized tone
  const lipColor = new THREE.Color(profile.skinTone).offsetHSL(0, 0.12, -0.08).getHex();
  const matLips = new THREE.MeshStandardMaterial({ color: lipColor, roughness: 0.6 });
  const mouthGeom = new THREE.BoxGeometry(0.048, 0.014, 0.016);
  const mouth = new THREE.Mesh(mouthGeom, matLips);
  mouth.position.set(0, -0.065, 0.146);
  head.add(mouth);

  // Ears
  [-0.145, 0.145].forEach((ex) => {
    const earGeom = new THREE.SphereGeometry(0.032, 8, 8);
    earGeom.scale(0.35, 1.0, 0.7);
    const ear = new THREE.Mesh(earGeom, matSkin);
    ear.position.set(ex, 0, 0);
    head.add(ear);
  });

  // Facial Hair (Stubble, Goatee, Mustache, Beard)
  if (profile.facialHair !== 'none') {
    const matBeard = new THREE.MeshStandardMaterial({
      color: profile.hairColor,
      roughness: 0.9,
    });

    if (profile.facialHair === 'stubble') {
      const stubbleGeom = new THREE.SphereGeometry(0.146, 12, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.35);
      stubbleGeom.scale(0.96, 1.14, 1.06);
      const stubbleMat = new THREE.MeshBasicMaterial({ color: profile.hairColor, transparent: true, opacity: 0.25 });
      const stubble = new THREE.Mesh(stubbleGeom, stubbleMat);
      stubble.position.y = -0.02;
      head.add(stubble);
    } else if (profile.facialHair === 'goatee') {
      const goateeGeom = new THREE.BoxGeometry(0.042, 0.06, 0.02);
      const goatee = new THREE.Mesh(goateeGeom, matBeard);
      goatee.position.set(0, -0.08, 0.142);
      head.add(goatee);
    } else if (profile.facialHair === 'mustache') {
      const stacheGeom = new THREE.BoxGeometry(0.056, 0.014, 0.018);
      const stache = new THREE.Mesh(stacheGeom, matBeard);
      stache.position.set(0, -0.042, 0.150);
      head.add(stache);
    } else if (profile.facialHair === 'beard') {
      const beardGeom = new THREE.BoxGeometry(0.12, 0.09, 0.08);
      const beard = new THREE.Mesh(beardGeom, matBeard);
      beard.position.set(0, -0.07, 0.11);
      head.add(beard);
    }
  }

  // 14 Distinct Hairstyles & Headwear
  buildHairstyle(profile, head, matHair);

  // Eyewear / Sunglasses
  if (profile.eyewear !== 'none') {
    buildEyewear(profile, head);
  }

  return head;
}

function buildHairstyle(profile: AppearanceProfile, head: THREE.Mesh, matHair: THREE.MeshStandardMaterial) {
  const style = profile.hairStyle;

  if (style === 'afro') {
    // Full rounded Afro puff with natural texture
    const afroGeom = new THREE.SphereGeometry(0.175, 16, 14);
    afroGeom.scale(1.05, 1.12, 1.08);
    const afro = new THREE.Mesh(afroGeom, matHair);
    afro.position.set(0, 0.06, -0.01);
    head.add(afro);
  } else if (style === 'dreads') {
    // Stylized dreadlocks
    const dreadCap = new THREE.SphereGeometry(0.155, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const cap = new THREE.Mesh(dreadCap, matHair);
    cap.position.set(0, 0.04, -0.01);
    head.add(cap);

    // Falling loc strands
    [-0.11, -0.07, 0.07, 0.11].forEach((lx) => {
      const locGeom = new THREE.CylinderGeometry(0.015, 0.012, 0.22, 6);
      const loc = new THREE.Mesh(locGeom, matHair);
      loc.position.set(lx, -0.02, 0.02);
      loc.rotation.z = (lx > 0 ? 1 : -1) * 0.15;
      head.add(loc);
    });
    [-0.08, 0, 0.08].forEach((lx) => {
      const backLocGeom = new THREE.CylinderGeometry(0.016, 0.012, 0.24, 6);
      const backLoc = new THREE.Mesh(backLocGeom, matHair);
      backLoc.position.set(lx, -0.04, -0.10);
      head.add(backLoc);
    });
  } else if (style === 'ponytail') {
    // Ponytail with hair tie
    const capGeom = new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const cap = new THREE.Mesh(capGeom, matHair);
    cap.position.set(0, 0.04, -0.01);
    head.add(cap);

    // Hair tie band
    const bandGeom = new THREE.TorusGeometry(0.025, 0.008, 6, 12);
    const matBand = new THREE.MeshStandardMaterial({ color: 0xec4899 });
    const band = new THREE.Mesh(bandGeom, matBand);
    band.position.set(0, 0.08, -0.15);
    head.add(band);

    // Ponytail strand
    const ponyGeom = new THREE.CylinderGeometry(0.03, 0.018, 0.26, 8);
    ponyGeom.rotateX(-0.4);
    const pony = new THREE.Mesh(ponyGeom, matHair);
    pony.position.set(0, 0.02, -0.22);
    head.add(pony);
  } else if (style === 'bun') {
    // Sleek high bun / topknot
    const baseGeom = new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const base = new THREE.Mesh(baseGeom, matHair);
    base.position.set(0, 0.04, -0.01);
    head.add(base);

    const bunGeom = new THREE.SphereGeometry(0.065, 12, 10);
    const bun = new THREE.Mesh(bunGeom, matHair);
    bun.position.set(0, 0.17, -0.05);
    head.add(bun);
  } else if (style === 'side_part') {
    // Gentleman's side part / pompadour
    const partGeom = new THREE.SphereGeometry(0.156, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
    partGeom.scale(1.02, 1.12, 1.08);
    const partHair = new THREE.Mesh(partGeom, matHair);
    partHair.position.set(-0.015, 0.05, -0.01);
    head.add(partHair);
  } else if (style === 'bob') {
    // Chic chin-length bob
    const bobGeom = new THREE.SphereGeometry(0.158, 16, 14);
    bobGeom.scale(1.06, 1.15, 1.10);
    const bob = new THREE.Mesh(bobGeom, matHair);
    bob.position.set(0, 0.03, -0.01);
    head.add(bob);
  } else if (style === 'beanie') {
    // Slouchy knit beanie
    const matBeanie = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const beanieGeom = new THREE.SphereGeometry(0.160, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.68);
    beanieGeom.scale(1.02, 1.15, 1.05);
    const beanie = new THREE.Mesh(beanieGeom, matBeanie);
    beanie.position.set(0, 0.05, -0.02);
    head.add(beanie);

    // Beanie cuff rim
    const cuffGeom = new THREE.TorusGeometry(0.152, 0.016, 8, 16);
    const cuff = new THREE.Mesh(cuffGeom, matBeanie);
    cuff.position.set(0, 0.03, 0);
    cuff.rotation.x = Math.PI / 2;
    head.add(cuff);
  } else if (style === 'cap_forward' || style === 'cap_backward') {
    // Baseball Cap
    const isBack = style === 'cap_backward';
    const matCap = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const capDomeGeom = new THREE.SphereGeometry(0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const capDome = new THREE.Mesh(capDomeGeom, matCap);
    capDome.position.y = 0.04;
    head.add(capDome);

    const visorGeom = new THREE.CylinderGeometry(0.16, 0.17, 0.018, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const visor = new THREE.Mesh(visorGeom, matCap);
    if (isBack) {
      visor.position.set(0, 0.03, -0.07);
      visor.rotation.x = -0.15;
      visor.rotation.y = Math.PI;
    } else {
      visor.position.set(0, 0.03, 0.07);
      visor.rotation.x = 0.15;
    }
    head.add(visor);
  } else if (style === 'flat_cap') {
    // Newsboy / Flat Cap (Elders)
    const matFlat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const flatGeom = new THREE.CylinderGeometry(0.17, 0.15, 0.06, 14);
    flatGeom.scale(1.0, 1.0, 1.15);
    const flat = new THREE.Mesh(flatGeom, matFlat);
    flat.position.set(0, 0.10, 0.02);
    flat.rotation.x = 0.1;
    head.add(flat);
  } else if (style === 'police_cap') {
    // Official Police Peaked Service Cap
    const matNavy = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });
    const matLeather = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });

    const capDomeGeom = new THREE.SphereGeometry(0.155, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    capDomeGeom.scale(0.98, 1.0, 1.08);
    const capDome = new THREE.Mesh(capDomeGeom, matNavy);
    capDome.position.y = 0.04;
    head.add(capDome);

    // Beveled visor
    const visorGeom = new THREE.CylinderGeometry(0.16, 0.18, 0.02, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const visor = new THREE.Mesh(visorGeom, matLeather);
    visor.position.set(0, 0.04, 0.07);
    visor.rotation.x = 0.15;
    head.add(visor);

    // Gold Police Star Shield Emblem on Cap
    const emblemGeom = new THREE.CylinderGeometry(0.032, 0.016, 0.012, 7);
    emblemGeom.rotateX(Math.PI / 2);
    const emblem = new THREE.Mesh(emblemGeom, matGold);
    emblem.position.set(0, 0.095, 0.156);
    head.add(emblem);

    // Braided Gold Chin Strap
    const strapGeom = new THREE.TorusGeometry(0.14, 0.008, 6, 16, Math.PI * 0.7);
    strapGeom.rotateY(-Math.PI * 0.35);
    const strap = new THREE.Mesh(strapGeom, matGold);
    strap.position.set(0, 0.045, 0.04);
    head.add(strap);
  } else if (style === 'swat_helmet') {
    // Tactical Ballistic Helmet
    const matKevlar = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const helmetGeom = new THREE.SphereGeometry(0.165, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
    helmetGeom.scale(1.02, 1.05, 1.08);
    const helmet = new THREE.Mesh(helmetGeom, matKevlar);
    helmet.position.set(0, 0.04, 0);
    head.add(helmet);

    // NVG Mount Plate
    const nvgGeom = new THREE.BoxGeometry(0.04, 0.05, 0.02);
    const matNVG = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 });
    const nvg = new THREE.Mesh(nvgGeom, matNVG);
    nvg.position.set(0, 0.08, 0.165);
    head.add(nvg);
  } else if (style === 'hard_hat') {
    // Construction Safety Hard Hat
    const matHat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const hatGeom = new THREE.SphereGeometry(0.165, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hatGeom.scale(1.05, 1.0, 1.12);
    const hat = new THREE.Mesh(hatGeom, matHat);
    hat.position.y = 0.06;
    head.add(hat);

    const brimGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16);
    const brim = new THREE.Mesh(brimGeom, matHat);
    brim.position.set(0, 0.05, 0.02);
    head.add(brim);
  } else {
    // Default Short Textured Crop / Fade
    const hairGeom = new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    hairGeom.scale(1.0, 1.08, 1.08);
    const hair = new THREE.Mesh(hairGeom, matHair);
    hair.position.set(0, 0.04, -0.01);
    head.add(hair);
  }
}

function buildEyewear(profile: AppearanceProfile, head: THREE.Mesh) {
  const eye = profile.eyewear;
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });

  if (eye === 'aviators') {
    const frameGeom = new THREE.BoxGeometry(0.19, 0.015, 0.04);
    const frame = new THREE.Mesh(frameGeom, matBlack);
    frame.position.set(0, 0.045, 0.145);
    head.add(frame);

    [-0.052, 0.052].forEach((lx) => {
      const lensGeom = new THREE.CylinderGeometry(0.026, 0.022, 0.01, 8);
      lensGeom.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeom, matBlack);
      lens.position.set(lx, 0.035, 0.152);
      head.add(lens);
    });
  } else if (eye === 'neon_shades') {
    const visorGeom = new THREE.BoxGeometry(0.19, 0.035, 0.03);
    const matNeon = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.1, metalness: 0.9 });
    const visor = new THREE.Mesh(visorGeom, matNeon);
    visor.position.set(0, 0.038, 0.150);
    head.add(visor);
  } else if (eye === 'visor') {
    // Syndicate Glowing Red HUD Visor
    const hudGeom = new THREE.BoxGeometry(0.19, 0.04, 0.035);
    const matHUD = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const hud = new THREE.Mesh(hudGeom, matHUD);
    hud.position.set(0, 0.038, 0.150);
    head.add(hud);
  } else {
    // Rectangular / Wireframe Glasses
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.6 });
    const frameGeom = new THREE.BoxGeometry(0.19, 0.025, 0.03);
    const frame = new THREE.Mesh(frameGeom, matBlack);
    frame.position.set(0, 0.038, 0.145);
    head.add(frame);

    [-0.05, 0.05].forEach((lx) => {
      const lensGeom = new THREE.PlaneGeometry(0.042, 0.026);
      const lens = new THREE.Mesh(lensGeom, matGlass);
      lens.position.set(lx, 0.038, 0.152);
      head.add(lens);
    });
  }
}
