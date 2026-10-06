import * as THREE from 'three';

// --------------------------------------------------------------------
// 1. Natural Skin Tone, Hair, and Eye Palettes
// --------------------------------------------------------------------
export const SKIN_TONES = [
  0x2a170e, // Deep Dark Ebony
  0x3d2314, // Rich Espresso
  0x54331d, // Warm Mahogany
  0x734729, // Chestnut Bronze
  0x945e39, // Golden Caramel
  0xb87d4f, // Warm Amber / Tan
  0xcca076, // Golden Beige
  0xecd0b9, // Fair Peach / Rose
];

export const HAIR_COLORS = [
  0x09090b, // Jet Black
  0x1c1917, // Deep Charcoal Black
  0x291d15, // Dark Espresso Brown
  0x451a03, // Warm Chestnut Brown
  0x78350f, // Honey Auburn Brown
  0xb45309, // Warm Caramel Ginger
  0xd4a373, // Warm Golden Blonde
  0x9ca3af, // Distinguished Silver Grey
  0xe2e8f0, // Platinum White Grey
];

export const EYE_COLORS = [
  0x1c1917, // Deep Espresso
  0x382216, // Warm Dark Brown
  0x451a03, // Amber Hazel
  0x166534, // Forest Emerald Green
  0x0284c7, // Crisp Ocean Blue
  0x0f172a, // Midnight Slate
];

// Deterministic seed generator to ensure distinct, non-cloning appearance
export function getSeededRandom(seedStr: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 100000) / 100000;
  };
}

export type BodyType = 'male_athletic' | 'male_stocky' | 'male_slim' | 'female_slender' | 'elder';

export interface AppearanceProfile {
  skinTone: number;
  hairColor: number;
  eyeColor: number;
  hairStyle: string;
  facialHair: 'none' | 'stubble' | 'goatee' | 'mustache' | 'beard';
  bodyType: BodyType;
  heightScale: number;
  buildScale: { x: number; y: number; z: number };
  clothingStyle: 'tshirt' | 'button_shirt' | 'hoodie' | 'jacket' | 'blazer' | 'dress' | 'skirt' | 'apron' | 'scrubs' | 'safety_vest' | 'police_uniform' | 'swat' | 'gang_streetwear' | 'jumpsuit';
  shirtColor: number;
  accentColor: number;
  pantsColor: number;
  pantsStyle: 'jeans' | 'chinos' | 'cargo' | 'joggers' | 'skirt' | 'dress' | 'shorts';
  shoeColor: number;
  shoeStyle: 'sneakers' | 'running' | 'dress' | 'combat_boots' | 'work_boots';
  eyewear: 'none' | 'aviators' | 'wireframe' | 'glasses_rect' | 'neon_shades' | 'visor' | 'goggles';
}

/**
 * Derives a consistent, richly personalized NPC appearance from archetype, type, faction, and name.
 */
export function generateAppearanceProfile(
  type: string,
  outfitVariant: string = 'default',
  displayName?: string,
  faction?: string
): AppearanceProfile {
  const seedKey = `${displayName || type}_${outfitVariant}_${faction || ''}`;
  const rand = getSeededRandom(seedKey);

  // 1. Skin Tone & Hair Color
  let skinTone = SKIN_TONES[Math.floor(rand() * SKIN_TONES.length)];
  let hairColor = HAIR_COLORS[Math.floor(rand() * (HAIR_COLORS.length - 2))]; // Exclude white/grey for young
  let eyeColor = EYE_COLORS[Math.floor(rand() * EYE_COLORS.length)];

  // 2. Body Type & Height
  let bodyType: BodyType = 'male_athletic';
  let heightScale = 0.94 + rand() * 0.12; // 0.94 to 1.06
  let buildScale = { x: 1.0, y: 1.0, z: 1.0 };
  let hairStyle = 'short_crop';
  let facialHair: AppearanceProfile['facialHair'] = 'none';
  let eyewear: AppearanceProfile['eyewear'] = 'none';
  let clothingStyle: AppearanceProfile['clothingStyle'] = 'tshirt';
  let shirtColor = 0x3b82f6;
  let accentColor = 0x1d4ed8;
  let pantsColor = 0x1e293b;
  let pantsStyle: AppearanceProfile['pantsStyle'] = 'jeans';
  let shoeColor = 0xf8fafc;
  let shoeStyle: AppearanceProfile['shoeStyle'] = 'sneakers';

  // Specific Named & Archetype Character Curation
  if (type === 'player') {
    skinTone = 0xb87d4f; // Warm Amber / Tan
    hairColor = 0x1c1917;
    eyeColor = 0x382216;
    bodyType = 'male_athletic';
    heightScale = 1.02;
    buildScale = { x: 1.02, y: 1.0, z: 1.02 };
    clothingStyle = 'police_uniform';
    shirtColor = 0x1e3a8a;
    accentColor = 0xfbbf24;
    pantsColor = 0x0f172a;
    pantsStyle = 'cargo';
    shoeColor = 0x111827;
    shoeStyle = 'combat_boots';
    hairStyle = 'police_cap';
    facialHair = 'stubble';
  } else if (type === 'police_npc') {
    bodyType = 'male_athletic';
    heightScale = 0.98 + rand() * 0.08;
    buildScale = { x: 1.03, y: 1.0, z: 1.03 };
    clothingStyle = outfitVariant === 'swat' ? 'swat' : 'police_uniform';
    shirtColor = outfitVariant === 'swat' ? 0x0f172a : outfitVariant === 'traffic' ? 0x1e3a8a : 0x1e40af;
    accentColor = outfitVariant === 'traffic' ? 0xfacc15 : 0xfbbf24;
    pantsColor = 0x0f172a;
    pantsStyle = 'cargo';
    shoeColor = 0x111827;
    shoeStyle = 'combat_boots';
    hairStyle = outfitVariant === 'swat' ? 'swat_helmet' : 'police_cap';
    eyewear = outfitVariant === 'swat' ? 'goggles' : rand() > 0.6 ? 'aviators' : 'none';
    facialHair = rand() > 0.5 ? 'mustache' : 'none';
  } else if (faction === 'cobalt_skulls') {
    // Cobalt Skulls gang
    clothingStyle = 'gang_streetwear';
    shirtColor = 0x1e3a8a; // Cobalt blue
    accentColor = 0x0f172a; // Denim biker vest
    pantsColor = 0x1e293b;
    pantsStyle = 'jeans';
    shoeColor = 0xf8fafc;
    shoeStyle = 'sneakers';
    hairStyle = rand() > 0.5 ? 'cap_backward' : 'dreads';
    facialHair = rand() > 0.4 ? 'goatee' : 'stubble';
    eyewear = rand() > 0.6 ? 'aviators' : 'none';
    bodyType = rand() > 0.5 ? 'male_athletic' : 'male_stocky';
  } else if (faction === 'neon_pythons') {
    // Neon Pythons tech street gang
    clothingStyle = 'gang_streetwear';
    shirtColor = 0x84cc16; // Acid lime
    accentColor = 0x14532d;
    pantsColor = 0x18181b;
    pantsStyle = 'joggers';
    shoeColor = 0xa3e635;
    shoeStyle = 'running';
    hairStyle = rand() > 0.5 ? 'fade' : 'dreads';
    eyewear = 'neon_shades';
    bodyType = 'male_athletic';
  } else if (faction === 'iron_vipers') {
    // Iron Vipers militarized syndicate
    clothingStyle = 'gang_streetwear';
    shirtColor = 0x7f1d1d; // Crimson combat shirt
    accentColor = 0x18181b;
    pantsColor = 0x27272a;
    pantsStyle = 'cargo';
    shoeColor = 0x18181b;
    shoeStyle = 'combat_boots';
    hairStyle = rand() > 0.5 ? 'buzz' : 'short_crop';
    facialHair = rand() > 0.3 ? 'beard' : 'stubble';
    bodyType = 'male_stocky';
    buildScale = { x: 1.08, y: 1.02, z: 1.08 };
  } else if (faction === 'eclipse_syndicate' || type === 'syndicate_operative') {
    clothingStyle = 'swat';
    shirtColor = 0x09090b;
    accentColor = 0xdc2626;
    pantsColor = 0x09090b;
    pantsStyle = 'cargo';
    shoeColor = 0x09090b;
    shoeStyle = 'combat_boots';
    hairStyle = 'swat_helmet';
    eyewear = 'visor';
    bodyType = 'male_athletic';
  } else if (type === 'thug') {
    clothingStyle = 'hoodie';
    const hoodiePalette = [0xdc2626, 0x2563eb, 0x475569, 0x18181b, 0xca8a04];
    shirtColor = hoodiePalette[Math.floor(rand() * hoodiePalette.length)];
    accentColor = 0x27272a;
    pantsColor = 0x18181b;
    pantsStyle = rand() > 0.5 ? 'jeans' : 'joggers';
    shoeColor = 0xf8fafc;
    shoeStyle = 'sneakers';
    hairStyle = rand() > 0.5 ? 'beanie' : 'cap_forward';
    facialHair = rand() > 0.5 ? 'stubble' : 'goatee';
    bodyType = rand() > 0.4 ? 'male_athletic' : 'male_slim';
  } else if (type === 'enforcer') {
    clothingStyle = 'jacket';
    shirtColor = 0x334155;
    accentColor = 0x0f172a;
    pantsColor = 0x1e293b;
    pantsStyle = 'cargo';
    shoeColor = 0x18181b;
    shoeStyle = 'combat_boots';
    hairStyle = 'buzz';
    facialHair = 'beard';
    bodyType = 'male_stocky';
    buildScale = { x: 1.10, y: 1.04, z: 1.10 };
  } else if (type === 'boss') {
    clothingStyle = 'blazer';
    shirtColor = 0x701a75; // Midnight plum
    accentColor = 0xd97706; // Gold accents
    pantsColor = 0x18181b;
    pantsStyle = 'chinos';
    shoeColor = 0x1c1917;
    shoeStyle = 'dress';
    hairStyle = 'side_part';
    facialHair = 'goatee';
    eyewear = 'aviators';
    bodyType = 'male_athletic';
  } else {
    // ----------------------------------------------------------------
    // Civilians: Diverse Street Life in Street Justice City
    // ----------------------------------------------------------------
    const nameLower = (displayName || '').toLowerCase();

    // Specific Cedar Heights Characters
    if (nameLower.includes('marcus')) {
      // Marcus Washington - Auto Mechanic
      skinTone = 0x54331d;
      hairColor = 0x09090b;
      bodyType = 'male_stocky';
      buildScale = { x: 1.08, y: 1.02, z: 1.08 };
      clothingStyle = 'tshirt';
      shirtColor = 0x1e3a8a; // Navy repair shirt
      accentColor = 0x78350f;
      pantsColor = 0x1e293b;
      pantsStyle = 'cargo';
      shoeColor = 0x78350f;
      shoeStyle = 'work_boots';
      hairStyle = 'cap_backward';
      facialHair = 'goatee';
    } else if (nameLower.includes('leah')) {
      // Mama Leah Jenkins - Soul Kitchen Owner
      skinTone = 0x3d2314;
      hairColor = 0x1c1917;
      bodyType = 'female_slender';
      buildScale = { x: 1.08, y: 0.98, z: 1.10 }; // Full-figured warm matriarch
      clothingStyle = 'apron';
      shirtColor = 0xb45309; // Warm ochre shirt
      accentColor = 0x047857; // Forest green kitchen apron
      pantsColor = 0x78350f;
      pantsStyle = 'skirt';
      shoeColor = 0x1c1917;
      shoeStyle = 'dress';
      hairStyle = 'bun';
    } else if (nameLower.includes('andre')) {
      // Andre Robinson - Crown Barbershop
      skinTone = 0x734729;
      hairColor = 0x09090b;
      bodyType = 'male_athletic';
      clothingStyle = 'button_shirt';
      shirtColor = 0x0284c7; // Crisp sky blue polo
      accentColor = 0x0f172a;
      pantsColor = 0x1e293b;
      pantsStyle = 'chinos';
      shoeColor = 0xf8fafc;
      shoeStyle = 'sneakers';
      hairStyle = 'fade';
      facialHair = 'goatee';
    } else if (nameLower.includes('bernice')) {
      // Grandma Bernice Jackson
      skinTone = 0x2a170e;
      hairColor = 0x9ca3af; // Distinguished silver grey
      bodyType = 'elder';
      heightScale = 0.92;
      buildScale = { x: 0.94, y: 0.94, z: 0.94 };
      clothingStyle = 'jacket'; // Knit cardigan
      shirtColor = 0x831843; // Warm cranberry
      accentColor = 0x78350f;
      pantsColor = 0x3f3f46;
      pantsStyle = 'chinos';
      shoeColor = 0x18181b;
      shoeStyle = 'dress';
      hairStyle = 'bun';
      eyewear = 'wireframe';
    } else if (nameLower.includes('nia')) {
      // Nia Thorne - Youth Center Student
      skinTone = 0x945e39;
      hairColor = 0x1c1917;
      bodyType = 'female_slender';
      heightScale = 0.96;
      clothingStyle = 'hoodie';
      shirtColor = 0xec4899; // Vibrant pink hoodie
      accentColor = 0xbe185d;
      pantsColor = 0x1e293b;
      pantsStyle = 'jeans';
      shoeColor = 0xf8fafc;
      shoeStyle = 'sneakers';
      hairStyle = 'ponytail';
    } else {
      // General City Pedestrians by Archetype
      const arch = outfitVariant;
      const isFemale = rand() > 0.52;
      bodyType = isFemale ? 'female_slender' : rand() > 0.7 ? 'male_stocky' : rand() > 0.4 ? 'male_athletic' : 'male_slim';

      if (arch === 'student') {
        clothingStyle = 'hoodie';
        const hoodieColors = [0x6366f1, 0xec4899, 0x10b981, 0x0284c7, 0xf59e0b];
        shirtColor = hoodieColors[Math.floor(rand() * hoodieColors.length)];
        pantsColor = 0x1e293b;
        pantsStyle = rand() > 0.4 ? 'jeans' : 'joggers';
        shoeStyle = 'sneakers';
        hairStyle = isFemale ? (rand() > 0.5 ? 'ponytail' : 'dreads') : (rand() > 0.5 ? 'afro' : 'fade');
        eyewear = rand() > 0.6 ? 'glasses_rect' : 'none';
      } else if (arch === 'business' || arch === 'executive') {
        clothingStyle = 'blazer';
        const suitTones = [0x1e293b, 0x0f172a, 0x334155, 0x18181b];
        shirtColor = suitTones[Math.floor(rand() * suitTones.length)];
        accentColor = 0xf8fafc; // White inner shirt
        pantsColor = shirtColor;
        pantsStyle = isFemale && rand() > 0.5 ? 'skirt' : 'chinos';
        shoeStyle = 'dress';
        hairStyle = isFemale ? (rand() > 0.5 ? 'bob' : 'bun') : 'side_part';
        eyewear = rand() > 0.4 ? 'wireframe' : 'none';
        facialHair = !isFemale && rand() > 0.6 ? 'goatee' : 'none';
      } else if (arch === 'shopper') {
        clothingStyle = isFemale && rand() > 0.5 ? 'dress' : rand() > 0.5 ? 'jacket' : 'tshirt';
        const colors = [0xd97706, 0x059669, 0xdb2777, 0x7c3aed, 0x2563eb, 0xe11d48];
        shirtColor = colors[Math.floor(rand() * colors.length)];
        pantsColor = [0x334155, 0x1e293b, 0x475569][Math.floor(rand() * 3)];
        pantsStyle = clothingStyle === 'dress' ? 'dress' : isFemale && rand() > 0.4 ? 'skirt' : 'jeans';
        shoeStyle = 'sneakers';
        hairStyle = isFemale ? (rand() > 0.4 ? 'bob' : 'ponytail') : (rand() > 0.5 ? 'short_crop' : 'fade');
      } else if (arch === 'jogger') {
        clothingStyle = 'tshirt';
        shirtColor = [0x06b6d4, 0x84cc16, 0xf97316, 0xec4899][Math.floor(rand() * 4)];
        pantsColor = 0x0f172a;
        pantsStyle = 'shorts';
        shoeColor = 0xa3e635;
        shoeStyle = 'running';
        hairStyle = isFemale ? 'ponytail' : 'short_crop';
      } else if (arch === 'doctor_nurse') {
        clothingStyle = 'scrubs';
        shirtColor = 0x0d9488;
        accentColor = 0x0f766e;
        pantsColor = 0x0d9488;
        pantsStyle = 'chinos';
        shoeColor = 0xf8fafc;
        shoeStyle = 'sneakers';
        hairStyle = isFemale ? 'bun' : 'short_crop';
        eyewear = rand() > 0.5 ? 'glasses_rect' : 'none';
      } else if (arch === 'construction') {
        clothingStyle = 'safety_vest';
        shirtColor = 0xea580c; // High-vis orange
        accentColor = 0xfacc15; // Reflective yellow vest
        pantsColor = 0x1e3a8a; // Denim
        pantsStyle = 'jeans';
        shoeColor = 0x78350f;
        shoeStyle = 'work_boots';
        hairStyle = 'hard_hat';
        facialHair = rand() > 0.3 ? 'beard' : 'stubble';
        bodyType = 'male_stocky';
      } else if (arch === 'elder') {
        clothingStyle = 'jacket';
        shirtColor = 0x78350f;
        pantsColor = 0x3f3f46;
        pantsStyle = 'chinos';
        shoeStyle = 'dress';
        hairColor = 0x9ca3af;
        hairStyle = isFemale ? 'bun' : 'flat_cap';
        eyewear = 'wireframe';
        bodyType = 'elder';
        heightScale = 0.93;
      } else {
        // Commuter / General Citizen
        clothingStyle = rand() > 0.6 ? 'jacket' : rand() > 0.3 ? 'button_shirt' : 'tshirt';
        const shirtPalette = [0x2563eb, 0x3b82f6, 0x059669, 0xd97706, 0x475569, 0x1e293b, 0x831843];
        shirtColor = shirtPalette[Math.floor(rand() * shirtPalette.length)];
        pantsColor = [0x1e293b, 0x334155, 0x18181b, 0x475569][Math.floor(rand() * 4)];
        pantsStyle = isFemale && rand() > 0.6 ? 'skirt' : rand() > 0.4 ? 'jeans' : 'chinos';
        shoeStyle = isFemale && rand() > 0.5 ? 'dress' : rand() > 0.3 ? 'sneakers' : 'work_boots';
        hairStyle = isFemale
          ? [ 'bob', 'bun', 'ponytail', 'dreads' ][Math.floor(rand() * 4)]
          : [ 'fade', 'afro', 'short_crop', 'side_part', 'beanie' ][Math.floor(rand() * 5)];
        facialHair = !isFemale && rand() > 0.5 ? (rand() > 0.5 ? 'goatee' : 'stubble') : 'none';
        eyewear = rand() > 0.65 ? 'glasses_rect' : 'none';
      }
    }
  }

  return {
    skinTone,
    hairColor,
    eyeColor,
    hairStyle,
    facialHair,
    bodyType,
    heightScale,
    buildScale,
    clothingStyle,
    shirtColor,
    accentColor,
    pantsColor,
    pantsStyle,
    shoeColor,
    shoeStyle,
    eyewear,
  };
}
