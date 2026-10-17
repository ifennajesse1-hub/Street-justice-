import * as THREE from 'three';
import { EnemyType, GangFactionId } from '../../types/game';
import { CharacterRig } from './CharacterModels';

// Cache canvas textures so we don't recreate them every frame
const faceTextureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Creates high-resolution expressive face texture on a canvas:
 * Stylized, clean, bold vector look with expressive eyes, eyebrows, and mouth.
 */
function getBlockyFaceTexture(archetype: string, skinColor: string = '#fcd34d'): THREE.CanvasTexture {
  const cacheKey = `${archetype}_${skinColor}`;
  if (faceTextureCache[cacheKey]) {
    return faceTextureCache[cacheKey];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    faceTextureCache[cacheKey] = fallback;
    return fallback;
  }

  // Base Skin
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 256, 256);

  ctx.save();

  if (archetype === 'swat') {
    // Tactical SWAT Balaclava & Goggles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    // Goggles Strap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 75, 256, 45);

    // Ballistic Lens
    const lensGrad = ctx.createLinearGradient(40, 80, 216, 115);
    lensGrad.addColorStop(0, '#0284c7');
    lensGrad.addColorStop(0.5, '#38bdf8');
    lensGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.roundRect(40, 75, 176, 46, 12);
    ctx.fill();

    // Lens glare reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(55, 82);
    ctx.lineTo(85, 82);
    ctx.lineTo(65, 112);
    ctx.lineTo(45, 112);
    ctx.closePath();
    ctx.fill();

    // Eye cutout visible through goggles
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.ellipse(85, 98, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(171, 98, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Comm mic on jaw
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(60, 190, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (archetype === 'mother_elena') {
    // Mother Elena: Gentle, warm, loving eyes, kind smile, soft rosy cheeks
    // Rosy Cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
    ctx.beginPath();
    ctx.ellipse(65, 155, 22, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(191, 155, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kind arched eyebrows
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(80, 100, 28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(176, 100, 28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Warm eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(80, 120, 16, 0, Math.PI * 2);
    ctx.arc(176, 120, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights (specular reflections)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(75, 115, 6, 0, Math.PI * 2);
    ctx.arc(171, 115, 6, 0, Math.PI * 2);
    ctx.arc(85, 125, 3, 0, Math.PI * 2);
    ctx.arc(181, 125, 3, 0, Math.PI * 2);
    ctx.fill();

    // Gentle smile
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 160, 24, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (archetype === 'young_carter') {
    // Young Carter: Earnest, wide eyes, hopeful but determined, youth freckles
    // Freckles
    ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
    [
      [68, 142], [76, 148], [88, 145],
      [168, 145], [180, 148], [188, 142]
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Determined, optimistic eyebrows
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, 95);
    ctx.lineTo(105, 90);
    ctx.moveTo(151, 90);
    ctx.lineTo(196, 95);
    ctx.stroke();

    // Large anime/stylized expressive eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(82, 118, 20, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 118, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep brown/hazel iris
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(82, 118, 14, 0, Math.PI * 2);
    ctx.arc(174, 118, 14, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(82, 118, 8, 0, Math.PI * 2);
    ctx.arc(174, 118, 8, 0, Math.PI * 2);
    ctx.fill();

    // Bright specular reflections
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, 112, 7, 0, Math.PI * 2);
    ctx.arc(168, 112, 7, 0, Math.PI * 2);
    ctx.arc(88, 124, 3, 0, Math.PI * 2);
    ctx.arc(180, 124, 3, 0, Math.PI * 2);
    ctx.fill();

    // Determined confident smirk
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 168, 20, Math.PI * 0.1, Math.PI * 0.8);
    ctx.stroke();
  } else if (archetype === 'mrs_gable') {
    // Mrs. Gable: Kind elderly neighbor with round spectacles
    // Spectacles frame
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(78, 120, 26, 0, Math.PI * 2);
    ctx.arc(178, 120, 26, 0, Math.PI * 2);
    ctx.moveTo(104, 120);
    ctx.lineTo(152, 120);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(78, 120, 12, 0, Math.PI * 2);
    ctx.arc(178, 120, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(74, 116, 5, 0, Math.PI * 2);
    ctx.arc(174, 116, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cheerful smile
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 175, 18, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  } else if (archetype === 'thug' || archetype === 'street_youth_marcus') {
    // Street Thug / Marcus: Tough, defiant, street-hardened look
    // Sharp angled furrowed eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(55, 90);
    ctx.lineTo(105, 102);
    ctx.moveTo(151, 102);
    ctx.lineTo(201, 90);
    ctx.stroke();

    // Intense eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 120, 18, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 120, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 120, 10, 0, Math.PI * 2);
    ctx.arc(176, 120, 10, 0, Math.PI * 2);
    ctx.fill();

    // Small tough scar on left cheek
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(60, 150);
    ctx.lineTo(75, 168);
    ctx.stroke();

    // Grimace / tough smirk
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(110, 175);
    ctx.lineTo(145, 170);
    ctx.stroke();
  } else if (archetype === 'police' || archetype === 'police_npc') {
    // Official Police Officer: Sharp, vigilant, professional
    // Resolute eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(58, 96);
    ctx.lineTo(104, 98);
    ctx.moveTo(152, 98);
    ctx.lineTo(198, 96);
    ctx.stroke();

    // Keen eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 120, 18, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 120, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(80, 120, 12, 0, Math.PI * 2);
    ctx.arc(176, 120, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 120, 7, 0, Math.PI * 2);
    ctx.arc(176, 120, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, 116, 5, 0, Math.PI * 2);
    ctx.arc(172, 116, 5, 0, Math.PI * 2);
    ctx.fill();

    // Composed mouth
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(114, 172);
    ctx.lineTo(142, 172);
    ctx.stroke();
  } else if (archetype === 'julian_vance') {
    // Julian Vance: Suave, charismatic yet chillingly manipulative mastermind
    // Sharp, neatly trimmed dark hairline
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(226, 0);
    ctx.lineTo(220, 60);
    ctx.lineTo(170, 45);
    ctx.lineTo(128, 55);
    ctx.lineTo(86, 45);
    ctx.lineTo(36, 60);
    ctx.closePath();
    ctx.fill();

    // Piercing calculating eyes with high, subtle arching eyebrows
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(56, 92);
    ctx.lineTo(104, 88);
    ctx.moveTo(152, 88);
    ctx.lineTo(200, 92);
    ctx.stroke();

    // Eyes: icy grey-blue, observant
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 116, 17, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 116, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(80, 116, 9, 0, Math.PI * 2);
    ctx.arc(176, 116, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 116, 5, 0, Math.PI * 2);
    ctx.arc(176, 116, 5, 0, Math.PI * 2);
    ctx.fill();

    // Neat designer stubble along the jawline
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(128, 200, 80, 30, 0, 0, Math.PI);
    ctx.fill();

    // Suave, knowing smirk (can look warm or sinister depending on context)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(108, 166);
    ctx.quadraticCurveTo(130, 174, 154, 162);
    ctx.stroke();
  } else if (archetype === 'syndicate_heavy') {
    // Tactical ballistic helmet and crimson HUD visor
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 256, 256);

    // Crimson illuminated ballistic visor
    const visorGrad = ctx.createLinearGradient(40, 80, 216, 120);
    visorGrad.addColorStop(0, '#7f1d1d');
    visorGrad.addColorStop(0.5, '#ef4444');
    visorGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.roundRect(38, 76, 180, 48, 10);
    ctx.fill();

    // HUD target reticle in visor
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(85, 100, 10, 0, Math.PI * 2);
    ctx.arc(171, 100, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Rebreather / tactical audio filter on lower face
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(80, 160, 96, 55);
    ctx.fillStyle = '#475569';
    for (let r = 168; r < 210; r += 10) {
      ctx.fillRect(90, r, 76, 4);
    }
  } else if (archetype === 'hostage_bound') {
    // Captive hostage: distressed, wide fearful eyes, cloth gag or taped mouth
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // Angled distressed eyebrows
    ctx.beginPath();
    ctx.moveTo(60, 90);
    ctx.lineTo(100, 98);
    ctx.moveTo(156, 98);
    ctx.lineTo(196, 90);
    ctx.stroke();

    // Wide frightened eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 120, 18, 0, Math.PI * 2);
    ctx.arc(176, 120, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(80, 120, 9, 0, Math.PI * 2);
    ctx.arc(176, 120, 9, 0, Math.PI * 2);
    ctx.fill();

    // Worried sweat drop on brow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(195, 75, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Grey tape / bound fabric across mouth
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(88, 155, 80, 26, 4);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(88, 155, 80, 26);
  } else {
    // Standard Urban Civilian: Modern, friendly, expressive
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, 98);
    ctx.lineTo(102, 96);
    ctx.moveTo(154, 96);
    ctx.lineTo(196, 98);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 122, 12, 0, Math.PI * 2);
    ctx.arc(176, 122, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, 118, 4.5, 0, Math.PI * 2);
    ctx.arc(172, 118, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Friendly smile
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 168, 16, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  faceTextureCache[cacheKey] = texture;
  return texture;
}

/**
 * Creates a blocky Torso decal texture for shirts, badges, hoodies, or vests.
 */
function getBlockyTorsoTexture(archetype: string, baseColor: string = '#1e40af'): THREE.CanvasTexture {
  const cacheKey = `torso_${archetype}_${baseColor}`;
  if (faceTextureCache[cacheKey]) return faceTextureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    faceTextureCache[cacheKey] = fallback;
    return fallback;
  }

  // Base clothing fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  if (archetype === 'police' || archetype === 'rookie_patrol') {
    // Official Police Duty Uniform
    // Collar & tie
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(112, 0);
    ctx.lineTo(128, 40);
    ctx.lineTo(144, 0);
    ctx.closePath();
    ctx.fill();

    // Neck tie hanging down
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(122, 38, 12, 90);

    // Gold Police Star Shield on Left Chest
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(65, 55);
    ctx.lineTo(85, 55);
    ctx.lineTo(92, 75);
    ctx.lineTo(75, 95);
    ctx.lineTo(58, 75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(72, 65, 6, 12);

    // White "METRO PD" Nameplate on Right Chest
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(160, 65, 45, 12);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('CARTER', 164, 74);

    // Duty Utility Belt across bottom
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 210, 256, 46);
    // Gold Belt Buckle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(116, 216, 24, 24);
  } else if (archetype === 'swat') {
    // Tactical SWAT Plate Carrier
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 25, 216, 185);

    // MOLLE webbing straps
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    for (let y = 60; y < 190; y += 28) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(221, y);
      ctx.stroke();
    }

    // Bold "POLICE" stencil
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 128, 115);

    // Heavy tactical duty belt
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 212, 256, 44);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(116, 218, 24, 24);
  } else if (archetype === 'young_carter') {
    // Young Carter: Red/Navy Streetwear Hoodie with athletic stripe
    ctx.fillStyle = '#1e3a8a'; // Deep royal blue hoodie
    ctx.fillRect(0, 0, 256, 256);

    // Contrast athletic chevron / stripe
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(128, 140);
    ctx.lineTo(256, 90);
    ctx.lineTo(256, 125);
    ctx.lineTo(128, 175);
    ctx.lineTo(0, 125);
    ctx.closePath();
    ctx.fill();

    // White piping
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 88);
    ctx.lineTo(128, 138);
    ctx.lineTo(256, 88);
    ctx.stroke();

    // Front kangaroo pouch pocket
    ctx.fillStyle = '#172554';
    ctx.beginPath();
    ctx.roundRect(50, 175, 156, 65, 8);
    ctx.fill();
  } else if (archetype === 'mother_elena') {
    // Mother Elena: Cozy hand-knit cardigan with floral / warm pattern
    ctx.fillStyle = '#065f46'; // Forest green
    ctx.fillRect(0, 0, 256, 256);

    // Cream inner blouse
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(95, 0);
    ctx.lineTo(128, 70);
    ctx.lineTo(161, 0);
    ctx.closePath();
    ctx.fill();

    // Cardigan buttons
    ctx.fillStyle = '#d97706';
    for (let y = 80; y <= 210; y += 38) {
      ctx.beginPath();
      ctx.arc(128, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (archetype === 'thug' || archetype === 'street_youth_marcus') {
    // Street Thug: Graphic street hoodie with spray tag or dragon emblem
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 256, 256);

    // Gold Chain necklace
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 30, 48, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Gold Pendant
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(120, 75, 16, 20);

    // Graphic Cobra / Skull street tag
    ctx.fillStyle = '#a855f7';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIPER 9', 128, 140);
  } else if (archetype === 'julian_vance') {
    // Julian Vance: Bespoke pinstripe charcoal designer suit, royal purple silk tie, gold pin
    ctx.fillStyle = '#18181b'; // Charcoal designer suit
    ctx.fillRect(0, 0, 256, 256);

    // Subtle pinstripes
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    for (let x = 16; x < 256; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    // Crisp white shirt collar V
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(96, 0);
    ctx.lineTo(128, 65);
    ctx.lineTo(160, 0);
    ctx.closePath();
    ctx.fill();

    // Deep royal purple silk tie
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(122, 10);
    ctx.lineTo(134, 10);
    ctx.lineTo(138, 140);
    ctx.lineTo(128, 155);
    ctx.lineTo(118, 140);
    ctx.closePath();
    ctx.fill();

    // Golden tie bar
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(120, 80, 16, 4);

    // Gold Syndicate lapel pin on left breast
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(68, 65, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(66, 62, 4, 6);

    // Suit jacket lapels
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(96, 0);
    ctx.lineTo(114, 130);
    ctx.lineTo(128, 190);
    ctx.moveTo(160, 0);
    ctx.lineTo(142, 130);
    ctx.lineTo(128, 190);
    ctx.stroke();
  } else if (archetype === 'syndicate_heavy') {
    // Syndicate Heavy: Tactical assault armor with crimson ballistic plates
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 256, 256);

    // Ballistic chest plate
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(28, 30, 200, 180, 12);
    ctx.fill();

    // Crimson accent trim & reinforcement struts
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5;
    ctx.strokeRect(36, 40, 184, 160);

    // Ammo magazine pouches
    ctx.fillStyle = '#0f172a';
    for (let p = 52; p < 210; p += 52) {
      ctx.fillRect(p, 130, 42, 60);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(p + 14, 126, 14, 6);
      ctx.fillStyle = '#0f172a';
    }

    // Syndicate Cobra/Viper stencil
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYNDICATE ELITE', 128, 90);
  } else if (archetype === 'hostage_bound') {
    // Hostage: Casual clothing with thick hemp rope bindings wrapped around torso
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Thick rope bindings wrapped across chest and waist
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 10;
    for (let y = 60; y <= 180; y += 32) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(236, y + 6);
      ctx.stroke();

      // Rope texture hash marks
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      for (let rx = 30; rx < 230; rx += 14) {
        ctx.beginPath();
        ctx.moveTo(rx, y - 4);
        ctx.lineTo(rx + 6, y + 8);
        ctx.stroke();
      }
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 10;
    }
  } else {
    // Standard Urban Civilian Casual Shirt
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);
    // Button line
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  faceTextureCache[cacheKey] = texture;
  return texture;
}

/**
 * Creates a stylized blocky character mesh with classic geometric proportions:
 * - Chamfered beveled block torso
 * - Expressive block head with vector face texture
 * - Articulated block arms and legs
 * - Distinctive accessories (police peaked cap, tactical helmet, beanie, hoodie)
 * - 100% compatible with existing CharacterRig joint hierarchy and animations!
 */
export function createBlockyCharacterMesh(
  type: 'player' | EnemyType | 'civilian' | 'police_npc' | 'military_soldier',
  outfitVariant: string = 'default',
  displayName?: string,
  faction?: GangFactionId | 'aegis_taskforce'
): CharacterRig {
  const root = new THREE.Group();

  // Role & archetype identification
  const isJulianVance = outfitVariant === 'julian_vance' || displayName?.includes('Vance') || displayName?.includes('Architect');
  const isSyndicateHeavy = outfitVariant === 'syndicate_heavy' || displayName?.includes('Syndicate') || displayName?.includes('Heavy') || displayName?.includes('Operative');
  const isHostage = outfitVariant === 'hostage_bound' || displayName?.includes('Captive') || displayName?.includes('Hostage');
  const isPolice = type === 'police_npc' || (type === 'player' && outfitVariant !== 'young_carter');
  const isSWAT = outfitVariant === 'swat' || outfitVariant === 'tactical_swat' || type === 'military_soldier';
  const isYoungCarter = outfitVariant === 'young_carter' || displayName?.includes('Young');
  const isMother = outfitVariant === 'mother_elena' || displayName?.includes('Elena') || displayName?.includes('Mom');
  const isMrsGable = outfitVariant === 'mrs_gable' || displayName?.includes('Gable');
  const isMarcus = outfitVariant === 'street_youth_marcus' || displayName?.includes('Marcus');
  const isCriminal = type === 'thug' || type === 'enforcer' || type === 'boss' || isMarcus || isSyndicateHeavy || isJulianVance;

  // Archetype for texturing
  const faceArchetype = isJulianVance
    ? 'julian_vance'
    : isSyndicateHeavy
    ? 'syndicate_heavy'
    : isHostage
    ? 'hostage_bound'
    : isSWAT
    ? 'swat'
    : isMother
    ? 'mother_elena'
    : isYoungCarter
    ? 'young_carter'
    : isMrsGable
    ? 'mrs_gable'
    : isMarcus
    ? 'street_youth_marcus'
    : isCriminal
    ? 'thug'
    : isPolice
    ? 'police'
    : 'civilian';

  // Palette selection
  const skinColor = isJulianVance
    ? '#fed7aa'
    : isYoungCarter || isMother
    ? '#fcd34d'
    : isMarcus
    ? '#d97706'
    : isMrsGable
    ? '#fed7aa'
    : '#fde047';

  const shirtColorHex = isJulianVance
    ? '#18181b'
    : isSyndicateHeavy
    ? '#090d16'
    : isHostage
    ? '#0284c7'
    : isSWAT
    ? '#0f172a'
    : isPolice
    ? '#1e3a8a'
    : isYoungCarter
    ? '#1d4ed8'
    : isMother
    ? '#065f46'
    : isMrsGable
    ? '#7c3aed'
    : isMarcus
    ? '#18181b'
    : isCriminal
    ? '#374151'
    : '#0284c7';

  const pantsColorHex = isJulianVance
    ? '#18181b'
    : isSyndicateHeavy
    ? '#090d16'
    : isHostage
    ? '#334155'
    : isSWAT
    ? '#090d16'
    : isPolice
    ? '#0f172a'
    : isYoungCarter
    ? '#1e293b'
    : isMother
    ? '#1f2937'
    : isCriminal
    ? '#111827'
    : '#1e293b';

  // Base materials
  const matSkin = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.6,
    metalness: 0.05,
  });

  const matPants = new THREE.MeshStandardMaterial({
    color: pantsColorHex,
    roughness: 0.7,
    metalness: 0.05,
  });

  const matShoe = new THREE.MeshStandardMaterial({
    color: isYoungCarter ? 0xdc2626 : 0x090d16, // Young Carter has red & white sneakers
    roughness: 0.65,
  });

  // 1. Blocky Torso (Chamfered box)
  // Height ~0.62, Width ~0.44, Depth ~0.26
  const torsoWidth = isYoungCarter ? 0.38 : 0.44;
  const torsoHeight = isYoungCarter ? 0.52 : 0.62;
  const torsoDepth = isYoungCarter ? 0.22 : 0.26;

  const torsoGeom = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);
  const torsoTexture = getBlockyTorsoTexture(faceArchetype, shirtColorHex);
  const matTorsoFront = new THREE.MeshStandardMaterial({
    map: torsoTexture,
    roughness: 0.68,
    metalness: 0.05,
  });
  const matTorsoSolid = new THREE.MeshStandardMaterial({
    color: shirtColorHex,
    roughness: 0.68,
    metalness: 0.05,
  });

  // Material array: [right, left, top, bottom, front, back]
  const torsoMaterials = [
    matTorsoSolid,
    matTorsoSolid,
    matTorsoSolid,
    matTorsoSolid,
    matTorsoFront,
    matTorsoSolid,
  ];

  const body = new THREE.Mesh(torsoGeom, torsoMaterials);
  const bodyBaseY = isYoungCarter ? 0.88 : 1.04;
  body.position.y = bodyBaseY;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // 2. Neck
  const neckGeom = new THREE.CylinderGeometry(0.065, 0.07, 0.10, 10);
  const neck = new THREE.Mesh(neckGeom, matSkin);
  neck.position.y = torsoHeight / 2 + 0.04;
  body.add(neck);

  // 3. Blocky Head with Expressive Face Texture
  const headSize = isYoungCarter ? 0.28 : 0.28;
  const headGeom = new THREE.BoxGeometry(headSize, headSize, headSize);
  const faceTexture = getBlockyFaceTexture(faceArchetype, skinColor);

  const matFaceFront = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Head material array: front gets face texture, other sides get skin/hair color
  const headMaterials = [
    matSkin,
    matSkin,
    matSkin,
    matSkin,
    matFaceFront, // Front facing face
    matSkin,
  ];

  const head = new THREE.Mesh(headGeom, headMaterials);
  head.position.y = neck.position.y + 0.18;
  head.castShadow = true;
  body.add(head);

  // 4. Head Accessories & Hair
  if (isPolice && !isSWAT) {
    // Official Police Peaked Cap
    const capGroup = new THREE.Group();
    capGroup.position.set(0, headSize / 2 + 0.02, 0);

    const capCrownGeom = new THREE.CylinderGeometry(0.16, 0.15, 0.08, 14);
    const capCrownMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const capCrown = new THREE.Mesh(capCrownGeom, capCrownMat);
    capGroup.add(capCrown);

    // Shiny black visor
    const visorGeom = new THREE.BoxGeometry(0.24, 0.02, 0.12);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.8 });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, -0.02, 0.12);
    visor.rotation.x = 0.18;
    capGroup.add(visor);

    // Gold Police Badge on Cap
    const capBadgeGeom = new THREE.BoxGeometry(0.04, 0.04, 0.015);
    const capBadgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const capBadge = new THREE.Mesh(capBadgeGeom, capBadgeMat);
    capBadge.position.set(0, 0.02, 0.155);
    capGroup.add(capBadge);

    head.add(capGroup);
  } else if (isSWAT) {
    // Heavy Ballistic SWAT Helmet
    const helmGeom = new THREE.BoxGeometry(0.32, 0.16, 0.32);
    const helmMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 });
    const helmet = new THREE.Mesh(helmGeom, helmMat);
    helmet.position.set(0, headSize / 2 - 0.02, 0);
    head.add(helmet);
  } else if (isYoungCarter) {
    // Stylish Blocky Hair / Hood combo
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, headSize / 2 + 0.02, -0.01);

    const hairGeom = new THREE.BoxGeometry(0.30, 0.08, 0.30);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x27190f, roughness: 0.8 });
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairGroup.add(hairMesh);

    // Front bangs
    const bangsGeom = new THREE.BoxGeometry(0.26, 0.05, 0.08);
    const bangs = new THREE.Mesh(bangsGeom, hairMat);
    bangs.position.set(0, -0.03, 0.14);
    hairGroup.add(bangs);

    head.add(hairGroup);
  } else if (isMother || isMrsGable) {
    // Elegant Hair Bun
    const hairMat = new THREE.MeshStandardMaterial({
      color: isMrsGable ? 0xd4d4d8 : 0x3f2e21, // Mrs Gable has silver/grey hair, Mother has dark brown
      roughness: 0.85,
    });
    const hairTopGeom = new THREE.BoxGeometry(0.30, 0.10, 0.30);
    const hairTop = new THREE.Mesh(hairTopGeom, hairMat);
    hairTop.position.set(0, headSize / 2 + 0.02, 0);
    head.add(hairTop);

    const bunGeom = new THREE.SphereGeometry(0.08, 10, 8);
    const bun = new THREE.Mesh(bunGeom, hairMat);
    bun.position.set(0, 0.08, -0.16);
    head.add(bun);
  } else if (isCriminal) {
    // Street Beanie / Bandana
    const beanieGeom = new THREE.BoxGeometry(0.30, 0.12, 0.30);
    const beanieMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.8 });
    const beanie = new THREE.Mesh(beanieGeom, beanieMat);
    beanie.position.set(0, headSize / 2 + 0.02, 0);
    head.add(beanie);
  }

  // 5. Blocky Articulated Arms
  const armWidth = isYoungCarter ? 0.13 : 0.15;
  const upperArmHeight = isYoungCarter ? 0.22 : 0.26;
  const forearmHeight = isYoungCarter ? 0.20 : 0.24;

  const matSleeve = new THREE.MeshStandardMaterial({ color: shirtColorHex, roughness: 0.68 });

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-(torsoWidth / 2 + armWidth / 2 + 0.02), torsoHeight / 2 - 0.06, 0);
  body.add(leftArm);

  const leftUpperMesh = new THREE.Mesh(
    new THREE.BoxGeometry(armWidth, upperArmHeight, armWidth),
    matSleeve
  );
  leftUpperMesh.position.y = -upperArmHeight / 2;
  leftUpperMesh.castShadow = true;
  leftArm.add(leftUpperMesh);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -upperArmHeight, 0);
  leftArm.add(leftForearm);

  const leftForeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(armWidth * 0.95, forearmHeight, armWidth * 0.95),
    matSkin
  );
  leftForeMesh.position.y = -forearmHeight / 2;
  leftForeMesh.castShadow = true;
  leftForearm.add(leftForeMesh);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(torsoWidth / 2 + armWidth / 2 + 0.02, torsoHeight / 2 - 0.06, 0);
  body.add(rightArm);

  const rightUpperMesh = new THREE.Mesh(
    new THREE.BoxGeometry(armWidth, upperArmHeight, armWidth),
    matSleeve
  );
  rightUpperMesh.position.y = -upperArmHeight / 2;
  rightUpperMesh.castShadow = true;
  rightArm.add(rightUpperMesh);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -upperArmHeight, 0);
  rightArm.add(rightForearm);

  const rightForeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(armWidth * 0.95, forearmHeight, armWidth * 0.95),
    matSkin
  );
  rightForeMesh.position.y = -forearmHeight / 2;
  rightForeMesh.castShadow = true;
  rightForearm.add(rightForeMesh);

  // 6. Blocky Articulated Legs
  const legWidth = isYoungCarter ? 0.15 : 0.18;
  const legSpacing = isYoungCarter ? 0.10 : 0.12;
  const thighHeight = isYoungCarter ? 0.26 : 0.32;
  const calfHeight = isYoungCarter ? 0.24 : 0.30;

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-legSpacing, -torsoHeight / 2, 0);
  body.add(leftLeg);

  const leftThighMesh = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth, thighHeight, legWidth),
    matPants
  );
  leftThighMesh.position.y = -thighHeight / 2;
  leftThighMesh.castShadow = true;
  leftLeg.add(leftThighMesh);

  const leftCalf = new THREE.Group();
  leftCalf.position.set(0, -thighHeight, 0);
  leftLeg.add(leftCalf);

  const leftCalfMesh = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth * 0.96, calfHeight, legWidth * 0.96),
    matPants
  );
  leftCalfMesh.position.y = -calfHeight / 2;
  leftCalfMesh.castShadow = true;
  leftCalf.add(leftCalfMesh);

  // Left Shoe
  const shoeGeom = new THREE.BoxGeometry(legWidth * 1.05, 0.09, legWidth * 1.25);
  const leftShoe = new THREE.Mesh(shoeGeom, matShoe);
  leftShoe.position.set(0, -calfHeight + 0.04, 0.02);
  leftShoe.castShadow = true;
  leftCalf.add(leftShoe);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(legSpacing, -torsoHeight / 2, 0);
  body.add(rightLeg);

  const rightThighMesh = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth, thighHeight, legWidth),
    matPants
  );
  rightThighMesh.position.y = -thighHeight / 2;
  rightThighMesh.castShadow = true;
  rightLeg.add(rightThighMesh);

  const rightCalf = new THREE.Group();
  rightCalf.position.set(0, -thighHeight, 0);
  rightLeg.add(rightCalf);

  const rightCalfMesh = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth * 0.96, calfHeight, legWidth * 0.96),
    matPants
  );
  rightCalfMesh.position.y = -calfHeight / 2;
  rightCalfMesh.castShadow = true;
  rightCalf.add(rightCalfMesh);

  // Right Shoe
  const rightShoe = new THREE.Mesh(shoeGeom, matShoe);
  rightShoe.position.set(0, -calfHeight + 0.04, 0.02);
  rightShoe.castShadow = true;
  rightCalf.add(rightShoe);

  // 7. Young Carter scale difference (slight proportion adjustment for youth)
  if (isYoungCarter) {
    root.scale.set(0.84, 0.84, 0.84);
  }

  // 8. Overhead Health Bar (for enemies)
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
    overheadHealthBar,
    healthFillMesh,
    archetype: outfitVariant,
    type,
    faction,
    recoilTimer: 0,
    flinchTimer: 0,
    buildScale: { x: 1, y: 1, z: 1 },
  };
}
