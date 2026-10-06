export interface FactionInfo {
  id: 'cedar_heights' | 'cobalt_skulls' | 'neon_pythons' | 'iron_vipers' | 'aegis_taskforce' | 'eclipse_syndicate' | 'police_precinct_9';
  name: string;
  category: 'community' | 'gang' | 'military' | 'terrorist' | 'law_enforcement';
  tagline: string;
  territory: string;
  territoryBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  dangerLevel: 'Protected Community' | 'Moderate' | 'High' | 'Severe' | 'Extreme' | 'Law Enforcement';
  primaryColor: string;
  badgeBg: string;
  clothingStyle: string;
  vehicleDescription: string;
  preferredWeapons: string;
  description: string;
  behaviorNote: string;
  keyFigures: { name: string; role: string; description: string }[];
}

export const FACTIONS_DATA: FactionInfo[] = [
  {
    id: 'cedar_heights',
    name: 'Cedar Heights Community',
    category: 'community',
    tagline: 'Vibrant, historic neighborhood built on family, hard work, and unity',
    territory: 'West Promenade & Cedar Avenue (X: -85 to -50, Z: -45 to +30)',
    territoryBounds: { minX: -85, maxX: -50, minZ: -45, maxZ: 30 },
    dangerLevel: 'Protected Community',
    primaryColor: '#059669', // Emerald Green
    badgeBg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400',
    clothingStyle: 'Mechanic coveralls, soul kitchen aprons, fresh denim, sneakers, knit sweaters, college hoodies',
    vehicleDescription: "Classic American Coupes ('68 Classic restored by Marcus), family sedans, delivery vans",
    preferredWeapons: 'None — Non-violent civilians, neighborhood watch, community organizers',
    description:
      'A lively, close-knit predominantly Black neighborhood with deep municipal roots. Cedar Heights is home to essential local businesses including Marcus\'s Precision Auto Repair, Mama Leah\'s Soul Kitchen, Crown Heritage Barbershop, Kingston Vinyl Records, and the Community Youth Center with its public half-court. The vast majority of residents are hardworking, proud civilians who look out for one another and cooperate with Officer Carter to keep street gang violence away from families and storefronts.',
    behaviorNote:
      'Civilians go about daily life, talk to Officer Carter, share intelligence regarding suspicious vehicles, and run/take shelter when gunfire erupts.',
    keyFigures: [
      {
        name: 'Marcus Washington',
        role: "Master Mechanic & Owner, Marcus's Precision Auto Repair",
        description: 'Neighborhood pillar known for restoring classic muscle cars; provides crucial tips on illegal chop-shop operations.',
      },
      {
        name: 'Mama Leah Jenkins',
        role: "Chef & Owner, Mama Leah's Soul Kitchen",
        description: 'Beloved community matriarch known for peach cobbler and warm hospitality; fierce advocate for neighborhood peace.',
      },
      {
        name: 'Andre Robinson',
        role: 'Master Barber, Crown Heritage Barbershop',
        description: 'Barbershop owner whose chairs are the hub of neighborhood conversation, keeping an eye on street gang activity.',
      },
      {
        name: 'Grandma Bernice Jackson',
        role: 'Community Elder (42 Years in the Heights)',
        description: 'Respected neighborhood elder who raised generations of mechanics, teachers, and nurses.',
      },
      {
        name: 'Nia Thorne',
        role: 'Youth Organizer, Cedar Community Center',
        description: 'Coordinates 3-on-3 basketball tournaments and youth mentorship programs to steer kids away from gangs.',
      },
    ],
  },
  {
    id: 'cobalt_skulls',
    name: 'The Cobalt Skulls',
    category: 'gang',
    tagline: 'Dockside biker crew and freight hijackers ruling the eastern harbor',
    territory: 'Industrial Logistics Docks & East Harbor Warehouse (X: +20 to +75, Z: +10 to +70)',
    territoryBounds: { minX: 20, maxX: 75, minZ: 10, maxZ: 70 },
    dangerLevel: 'Moderate',
    primaryColor: '#2563eb', // Cobalt Blue
    badgeBg: 'bg-blue-950/70 border-blue-500/50 text-blue-400',
    clothingStyle: 'Cobalt blue denim vests with skull patch, dark blue bandanas, work boots, heavy leather jackets',
    vehicleDescription: 'Cobalt Blue Rumbler Muscle Cars with custom exhausts and tuned torque',
    preferredWeapons: 'Sweeper-12 Shotguns, Vortex-9 Heavy Revolvers, Tire Irons',
    description:
      'A tough, blue-collar dockside street gang that originated among renegade shipyard mechanics and motorcycle enthusiasts. They control the eastern logistics docks, shipping containers, and freight alleys. They frequently engage in warehouse burglaries, hijacking incoming cargo shipments, and strong-arming industrial businesses.',
    behaviorNote:
      'Aggressive at close range using shotguns and heavy pistols; will open fire on rival gangs like the Neon Pythons on sight; retreats when heavily injured or boxed in by police cruisers.',
    keyFigures: [
      {
        name: 'Axle "Biker" Vance',
        role: 'Dockside Enforcer',
        description: 'Patrols the container docks with a heavy wrench and modified shotgun; guards the illegal freight containers.',
      },
      {
        name: 'Diesel Rivera',
        role: 'Chief Mechanic & Getaway Wheelman',
        description: 'Tunes high-powered muscle cars for freight container getaways along the eastern highway.',
      },
    ],
  },
  {
    id: 'neon_pythons',
    name: 'The Neon Pythons',
    category: 'gang',
    tagline: 'High-speed street racers and tech smugglers operating in midtown alleys',
    territory: 'Commercial Promenade & West Alleys (X: -45 to -15, Z: -35 to +20)',
    territoryBounds: { minX: -45, maxX: -15, minZ: -35, maxZ: 20 },
    dangerLevel: 'High',
    primaryColor: '#84cc16', // Acid Lime Green
    badgeBg: 'bg-lime-950/70 border-lime-500/50 text-lime-400',
    clothingStyle: 'Acid-lime windbreakers, glowing green sunglasses, dark jogger techwear, high-top neon sneakers',
    vehicleDescription: 'Neon Green High-RPM Tuners with carbon hoods and custom underglow',
    preferredWeapons: 'Specter-45 Rapid SMGs, Vector Submachine Guns, EMP spray canisters',
    description:
      'A fast, hyper-mobile street gang centered around illegal midnight street races, electronic car theft, cyber-skimming ATMs, and tagging commercial alleys. Unlike the heavy dock workers of the Cobalt Skulls, the Pythons rely on blistering speed, evasive parkour across fire escapes, and rapid automatic gunfire.',
    behaviorNote:
      'High mobility and hit-and-run evasion; moves 20% faster than standard thugs; sprays automatic SMG bursts; attempts to flee down narrow alley cuts when police arrive.',
    keyFigures: [
      {
        name: 'Volt "Pulse" Torres',
        role: 'Lead Street Racer & Crew Captain',
        description: 'Specializes in hotwiring modern sports cars and outrunning standard patrol units through tight commercial alleys.',
      },
      {
        name: 'Echo Kim',
        role: 'Tech Specialist & Electronic Skimmer',
        description: 'Responsible for skimming Metro Bank ATMs and hacking commercial security feeds.',
      },
    ],
  },
  {
    id: 'iron_vipers',
    name: 'The Iron Vipers',
    category: 'gang',
    tagline: 'Militarized criminal syndicate operating out of the northern freight depot',
    territory: 'Northern Industrial Scrap Yards & Rail Freight (X: -20 to +40, Z: -60 to -25)',
    territoryBounds: { minX: -20, maxX: 40, minZ: -60, maxZ: -25 },
    dangerLevel: 'Severe',
    primaryColor: '#dc2626', // Crimson Red
    badgeBg: 'bg-red-950/70 border-red-500/50 text-red-400',
    clothingStyle: 'Crimson combat shirts, black steel ballistic plate carriers, tactical cargo trousers, steel-toe combat boots',
    vehicleDescription: 'Armored Crimson Heavy SUVs with reinforced bull-bars and run-flat tires',
    preferredWeapons: 'Titan-AR Assault Rifles, Heavy Tactical Shotguns, Ballistic Body Armor',
    description:
      'The most heavily fortified street gang in Metro City, founded by rogue private security guards and black-market arms traffickers. The Iron Vipers operate fortified compounds, armed convoys, and protection rackets. Their members wear ballistic armor and deploy military-style cover tactics, making them a lethal threat to standard patrol officers.',
    behaviorNote:
      'Disciplined squad cover tactics; uses dumpsters and concrete barriers; shoots high-impact assault rifle rounds with piercing damage; rarely surrenders unless down to critical health.',
    keyFigures: [
      {
        name: 'Sledge "Heavy" Rourke',
        role: 'Armored Heavy Enforcer',
        description: 'Former private contractor turned gang enforcer; carries heavy ballistic armor and a high-caliber Titan-AR.',
      },
      {
        name: 'Fang Morricone',
        role: 'Depot Stronghold Commander',
        description: 'Coordinates arms distribution across the northern rail lines; loyal lieutenant to syndicate kingpin Vance.',
      },
    ],
  },
  {
    id: 'aegis_taskforce',
    name: 'Aegis Defense Task Force',
    category: 'military',
    tagline: 'Fictional elite defense contractor deployed for code-red urban emergencies',
    territory: 'Military Checkpoint & Secure Financial Sector (X: +10 to +30, Z: +10 to +25)',
    territoryBounds: { minX: 10, maxX: 30, minZ: 10, maxZ: 25 },
    dangerLevel: 'Extreme',
    primaryColor: '#ca8a04', // Military Tan / Gold
    badgeBg: 'bg-amber-950/70 border-amber-500/50 text-amber-400',
    clothingStyle: 'Desert digital camo combat fatigue, Kevlar ballistic helmets with tactical comms headsets, heavy multi-plate body armor, ballistic goggles',
    vehicleDescription: 'Desert Tan Aegis Armored Tactical APC / Humvee with steel ram-bumpers and roof spotlights',
    preferredWeapons: 'Aegis Precision Carbines, High-Velocity Heavy Tracers, Deployable Tactical Barriers',
    description:
      'A fictional, high-level private military defense contractor authorized under municipal emergency protocols to maintain order during major terrorist incursions, bank sieges, or violent gang wars. Unlike city police who focus on community arrests and patrol investigations, Aegis soldiers operate with military discipline, establishing fortified sandbag checkpoints, bounding in two-man fireteams, and delivering devastating suppressive fire.',
    behaviorNote:
      'Maintains fortified guard positions; engages hostile criminals and terrorist cells on sight with tactical bounding and suppressive fire; communicates via radio callsigns; does not hassle civilians.',
    keyFigures: [
      {
        name: 'Sergeant Briggs (Aegis-Lead)',
        role: 'Task Force Tactical Squad Leader',
        description: 'Disciplined military veteran commanding the urban perimeter checkpoint with tactical precision.',
      },
      {
        name: 'Specialist Reyes (Aegis-Two)',
        role: 'Heavy Rifleman & Spotter',
        description: 'Provides long-range suppressive fire support and perimeter security against extremist threats.',
      },
    ],
  },
  {
    id: 'eclipse_syndicate',
    name: 'The Eclipse Syndicate',
    category: 'terrorist',
    tagline: 'Fictional rogue high-tech extremist syndicate executing high-risk black-market strikes',
    territory: 'Metro Financial Bank Plaza & Subterranean Vaults (X: +25 to +60, Z: -45 to -15)',
    territoryBounds: { minX: 25, maxX: 60, minZ: -45, maxZ: -15 },
    dangerLevel: 'Extreme',
    primaryColor: '#a855f7', // High-tech Violet / Matte Black
    badgeBg: 'bg-purple-950/70 border-purple-500/50 text-purple-400',
    clothingStyle: 'Matte-black stealth combat bodysuits, glowing red tactical HUD visors, carbon-fiber armor plating, tactical balaclavas',
    vehicleDescription: 'Stealth Matte-Black Syndicate Vans with radar-dampening panels and tinted bulletproof glass',
    preferredWeapons: 'Eclipse High-Tech Precision Carbines, Thermal Smoke Disrupters, Armor-Piercing Munitions',
    description:
      'A completely fictional, high-tech extremist criminal syndicate with no connection to any real-world political, religious, national, or ethnic group. The Eclipse Syndicate operates as a rogue mercenary cell of disgraced hackers, demolitionists, and black-market arms traffickers. They specialize in theatrical, high-stakes infrastructure attacks such as the Metro Bank Vault siege, seeking high-value data and financial extortion.',
    behaviorNote:
      'Lethal accuracy, stealth flanking, aggressive target acquisition; armed with high-damage Eclipse Carbines; refuses to surrender; triggers city-wide Code Red emergency protocols.',
    keyFigures: [
      {
        name: 'Ghost "Operative Alpha"',
        role: 'Eclipse Infiltration Specialist',
        description: 'High-tech mercenary operative equipped with red tactical HUD optics and silenced carbine.',
      },
      {
        name: 'Vector "Demolition Lead"',
        role: 'Heavy Ordnance Specialist',
        description: 'Responsible for vault breeches and deploying heavy perimeter charges during syndicate operations.',
      },
    ],
  },
  {
    id: 'police_precinct_9',
    name: 'Police Precinct 9',
    category: 'law_enforcement',
    tagline: 'Metro City Police Department — Walking the beat to protect every neighborhood',
    territory: 'Precinct 9 Headquarters & Central Avenue (X: -35 to -10, Z: +15 to +40)',
    dangerLevel: 'Law Enforcement',
    primaryColor: '#38bdf8', // Police Cyan / Blue
    badgeBg: 'bg-sky-950/70 border-sky-500/50 text-sky-400',
    clothingStyle: 'Classic navy municipal patrol uniforms, gold shield badges, body-worn cameras, utility duty belts',
    vehicleDescription: 'White & Navy High-Speed Police Interceptors with aerodynamic LED dual red/blue pursuit lightbars',
    preferredWeapons: 'Vortex-9 Police Handguns, Tact-500 Less-Lethal Beanbag Shotguns, Restraining Handcuffs',
    description:
      'The central law enforcement precinct tasked with street-level peace, investigating burglaries, calming disturbances, responding to 911 calls, and dismantling violent street gangs while protecting civilian communities.',
    behaviorNote:
      'Patrols sidewalks, protects civilians, responds immediately to gunshots, pursues fleeing criminal vehicles, and detains surrendered suspects.',
    keyFigures: [
      {
        name: 'Officer Alex Carter',
        role: 'Player Character / Dedicated Street Officer',
        description: 'Street-smart patrol officer walking the beat to bring Street Justice and protect community neighborhoods.',
      },
      {
        name: 'Captain Miller',
        role: 'Precinct 9 Commander',
        description: 'Veteran precinct chief who values community trust, proper evidence collection, and disciplined policing.',
      },
    ],
  },
];

/**
 * Returns which faction territory a given (x, z) coordinate belongs to
 */
export function getTerritoryAtCoordinates(x: number, z: number): FactionInfo {
  for (const faction of FACTIONS_DATA) {
    if (faction.territoryBounds) {
      const b = faction.territoryBounds;
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
        return faction;
      }
    }
  }
  // Default central avenue
  return FACTIONS_DATA.find((f) => f.id === 'police_precinct_9') || FACTIONS_DATA[0];
}
