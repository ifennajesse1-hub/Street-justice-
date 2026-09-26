import * as THREE from 'three';
import { CivilianEntity, CivilianArchetype } from '../../types/game';

export interface SidewalkWaypoint {
  x: number;
  z: number;
  action?: 'none' | 'shop_window' | 'wait_bus' | 'check_phone' | 'zebra_cross';
  waitDuration?: number; // seconds
}

export interface PedestrianRoute {
  id: string;
  name: string;
  waypoints: SidewalkWaypoint[];
  isLoop: boolean;
}

/**
 * City Sidewalk and Crossing Routes tailored to the 3D district geometry:
 * - Avenue West Sidewalk (X: -11.5, Z: -52 to +52)
 * - Avenue East Sidewalk (X: +11.5, Z: -52 to +52)
 * - Commercial Promenade (X: -26 to -30, Z: +28 to -30)
 * - Metro Bank Corporate Plaza (X: +16 to +32, Z: -12 to -36)
 * - Police Precinct 9 Plaza (X: -14 to -26, Z: +18 to +36)
 * - Zebra Crosswalks at (0, -12), (0, 12), (-12, 0), (12, 0)
 */
export const PEDESTRIAN_ROUTES: Record<string, PedestrianRoute> = {
  avenue_west: {
    id: 'avenue_west',
    name: 'Main Avenue West Sidewalk',
    isLoop: true,
    waypoints: [
      { x: -11.5, z: 46, action: 'none' },
      { x: -11.5, z: 24, action: 'none' },
      { x: -11.5, z: 10, action: 'wait_bus', waitDuration: 4 }, // West Bus Shelter
      { x: -11.5, z: -10, action: 'zebra_cross', waitDuration: 1.5 },
      { x: -11.5, z: -24, action: 'none' },
      { x: -11.5, z: -46, action: 'check_phone', waitDuration: 3 },
      { x: -12.0, z: -32, action: 'none' },
      { x: -11.5, z: 0, action: 'none' },
    ],
  },
  avenue_east: {
    id: 'avenue_east',
    name: 'Main Avenue East Sidewalk',
    isLoop: true,
    waypoints: [
      { x: 11.5, z: -46, action: 'none' },
      { x: 11.5, z: -26, action: 'check_phone', waitDuration: 3 },
      { x: 11.5, z: -10, action: 'wait_bus', waitDuration: 4 }, // East Bus Shelter
      { x: 11.5, z: 10, action: 'zebra_cross', waitDuration: 1.5 },
      { x: 11.5, z: 28, action: 'none' },
      { x: 11.5, z: 46, action: 'none' },
      { x: 11.8, z: 34, action: 'none' },
      { x: 11.5, z: 0, action: 'none' },
    ],
  },
  commercial_promenade: {
    id: 'commercial_promenade',
    name: 'Commercial Stores Promenade',
    isLoop: true,
    waypoints: [
      { x: -28, z: 26, action: 'shop_window', waitDuration: 3.5 }, // Outside Deli
      { x: -28, z: 14, action: 'none' },
      { x: -27.5, z: 4, action: 'shop_window', waitDuration: 4 }, // Coffee Shop counter
      { x: -28, z: -6, action: 'shop_window', waitDuration: 3 }, // Pharmacy entrance
      { x: -28, z: -16, action: 'none' }, // Alley arch
      { x: -29, z: -4, action: 'none' },
      { x: -29, z: 12, action: 'none' },
    ],
  },
  bank_corporate_plaza: {
    id: 'bank_corporate_plaza',
    name: 'Metro Bank Corporate Plaza',
    isLoop: true,
    waypoints: [
      { x: 16, z: -14, action: 'none' },
      { x: 26, z: -16, action: 'check_phone', waitDuration: 3.5 }, // Bank revolving doors
      { x: 28, z: -28, action: 'check_phone', waitDuration: 4 }, // ATM Kiosk
      { x: 20, z: -34, action: 'none' },
      { x: 16, z: -24, action: 'none' },
    ],
  },
  precinct_plaza: {
    id: 'precinct_plaza',
    name: 'Police Precinct 9 Sidewalk & Steps',
    isLoop: true,
    waypoints: [
      { x: -16, z: 20, action: 'none' },
      { x: -24, z: 22, action: 'check_phone', waitDuration: 3 },
      { x: -26, z: 32, action: 'none' },
      { x: -18, z: 34, action: 'none' },
    ],
  },
  crosswalk_loop: {
    id: 'crosswalk_loop',
    name: 'Central Intersection Crosswalk Loop',
    isLoop: true,
    waypoints: [
      { x: -11.5, z: -12, action: 'zebra_cross', waitDuration: 1.5 }, // NW corner
      { x: 0, z: -12, action: 'none' }, // Zebra crossing North
      { x: 11.5, z: -12, action: 'none' }, // NE corner
      { x: 12, z: 0, action: 'none' }, // Zebra crossing East
      { x: 11.5, z: 12, action: 'none' }, // SE corner
      { x: 0, z: 12, action: 'none' }, // Zebra crossing South
      { x: -11.5, z: 12, action: 'none' }, // SW corner
      { x: -12, z: 0, action: 'none' }, // Zebra crossing West
    ],
  },
  commercial_alley_cut: {
    id: 'commercial_alley_cut',
    name: 'Commercial Alley Cut-through',
    isLoop: true,
    waypoints: [
      { x: -28, z: -14, action: 'none' },
      { x: -28.5, z: -24, action: 'check_phone', waitDuration: 3 },
      { x: -28, z: -34, action: 'none' },
      { x: -29, z: -22, action: 'none' },
    ],
  },
};

export interface PedestrianInitialConfig {
  name: string;
  archetype: CivilianArchetype;
  accessory: 'phone' | 'briefcase' | 'coffee' | 'shopping_bag' | 'none';
  spawnPos: { x: number; y: number; z: number };
  routeId: string;
  speed: number;
  courage: number;
  dialogue: string;
}

export const PEDESTRIAN_CONFIGS: PedestrianInitialConfig[] = [
  // 1. Business Executives & Commuters in Corporate District
  {
    name: 'Sophia Bennett',
    archetype: 'business',
    accessory: 'briefcase',
    spawnPos: { x: 18, y: 0, z: -16 },
    routeId: 'bank_corporate_plaza',
    speed: 1.5,
    courage: 0.55,
    dialogue: 'Officer! I saw two men in leather jackets carrying heavy duffle bags into the back of the commercial alleyway!',
  },
  {
    name: 'Marcus Chen',
    archetype: 'business',
    accessory: 'phone',
    spawnPos: { x: 26, y: 0, z: -28 },
    routeId: 'bank_corporate_plaza',
    speed: 1.45,
    courage: 0.50,
    dialogue: 'A suspicious black muscle car has been circling the Metro Bank plaza since noon. Looked like syndicate enforcers.',
  },
  {
    name: 'Grace Liu',
    archetype: 'business',
    accessory: 'briefcase',
    spawnPos: { x: 12, y: 0, z: -34 },
    routeId: 'avenue_east',
    speed: 1.6,
    courage: 0.60,
    dialogue: 'Good day Officer. Keep an eye on the industrial docks, I heard heavy machinery and suspicious shouting there.',
  },

  // 2. Shoppers in the Commercial Promenade
  {
    name: 'Elena Rostova',
    archetype: 'shopper',
    accessory: 'shopping_bag',
    spawnPos: { x: -28, y: 0, z: 22 },
    routeId: 'commercial_promenade',
    speed: 1.15,
    courage: 0.30,
    dialogue: 'Thank goodness you are on patrol! A hooded thug was loitering behind the deli dumpster looking through crates.',
  },
  {
    name: 'Chloe Miller',
    archetype: 'shopper',
    accessory: 'shopping_bag',
    spawnPos: { x: -28, y: 0, z: -4 },
    routeId: 'commercial_promenade',
    speed: 1.2,
    courage: 0.28,
    dialogue: 'Someone spray-painted gang tags on the alley wall by the Pharmacy. It looked like a viper cobra symbol!',
  },
  {
    name: 'Zoe Jenkins',
    archetype: 'shopper',
    accessory: 'coffee',
    spawnPos: { x: -28, y: 0, z: 6 },
    routeId: 'commercial_promenade',
    speed: 1.1,
    courage: 0.32,
    dialogue: 'The barista at the cafe said Vance\'s crew tried extorting protection money yesterday. People are scared.',
  },

  // 3. Commuters along Main Avenue Sidewalks & Transit Bus Stops
  {
    name: 'David Kim',
    archetype: 'commuter',
    accessory: 'phone',
    spawnPos: { x: -11.5, y: 0, z: 12 },
    routeId: 'avenue_west',
    speed: 1.4,
    courage: 0.45,
    dialogue: 'Officer! I heard sirens earlier toward the north avenue. Glad Precinct 9 is keeping the streets secure.',
  },
  {
    name: 'Carlos Mendez',
    archetype: 'commuter',
    accessory: 'coffee',
    spawnPos: { x: -11.5, y: 0, z: -18 },
    routeId: 'avenue_west',
    speed: 1.35,
    courage: 0.42,
    dialogue: 'Just waiting for the metro bus. Watch your six around the corner, suspicious characters hang around after dark.',
  },
  {
    name: 'Derek Larson',
    archetype: 'commuter',
    accessory: 'phone',
    spawnPos: { x: 11.5, y: 0, z: -8 },
    routeId: 'avenue_east',
    speed: 1.45,
    courage: 0.48,
    dialogue: 'I saw an armed enforcer heading down the alley behind the pharmacy with a radio transceiver.',
  },
  {
    name: 'Ethan Foster',
    archetype: 'commuter',
    accessory: 'coffee',
    spawnPos: { x: 11.5, y: 0, z: 24 },
    routeId: 'avenue_east',
    speed: 1.4,
    courage: 0.44,
    dialogue: 'Officer Carter! Keep up the good work. The city needs officers who actually patrol on foot.',
  },

  // 4. Joggers on Continuous City Sidewalk Loops
  {
    name: 'Tyler Brooks',
    archetype: 'jogger',
    accessory: 'none',
    spawnPos: { x: -11.5, y: 0, z: -36 },
    routeId: 'avenue_west',
    speed: 2.85,
    courage: 0.52,
    dialogue: 'On my morning run! Saw two guys in tactical gear near the warehouse docks. Definitely didn\'t look like dock workers.',
  },
  {
    name: 'Rachel Kim',
    archetype: 'jogger',
    accessory: 'none',
    spawnPos: { x: 11.5, y: 0, z: 38 },
    routeId: 'avenue_east',
    speed: 2.8,
    courage: 0.50,
    dialogue: 'Pace is good today! Stay safe out there, Officer.',
  },

  // 5. Tourists Visiting City Landmarks & Intersection
  {
    name: 'Amara Okafor',
    archetype: 'tourist',
    accessory: 'phone',
    spawnPos: { x: -10, y: 0, z: -12 },
    routeId: 'crosswalk_loop',
    speed: 1.05,
    courage: 0.25,
    dialogue: 'Excuse me Officer, the architecture here is breathtaking! Is it safe to take photos around the bank plaza?',
  },
  {
    name: 'Hannah Vance',
    archetype: 'tourist',
    accessory: 'phone',
    spawnPos: { x: 10, y: 0, z: 12 },
    routeId: 'crosswalk_loop',
    speed: 1.1,
    courage: 0.22,
    dialogue: 'We just arrived in Metro City! A nice shopkeeper told us to steer clear of the commercial alleyway.',
  },
  {
    name: 'Samuel Ortiz',
    archetype: 'tourist',
    accessory: 'phone',
    spawnPos: { x: -18, y: 0, z: 24 },
    routeId: 'precinct_plaza',
    speed: 1.15,
    courage: 0.30,
    dialogue: 'Precinct 9 has such a classic municipal design. Beautiful city, Officer!',
  },

  // 6. Skittish & Cautious Residents
  {
    name: 'Javier Morales',
    archetype: 'skittish',
    accessory: 'phone',
    spawnPos: { x: -28, y: 0, z: -18 },
    routeId: 'commercial_alley_cut',
    speed: 1.35,
    courage: 0.12,
    dialogue: 'Don\'t tell anyone I talked to you! Viper Vance has ears everywhere. The big shipment is arriving at midnight.',
  },
  {
    name: 'Maya Patel',
    archetype: 'skittish',
    accessory: 'phone',
    spawnPos: { x: -22, y: 0, z: 30 },
    routeId: 'precinct_plaza',
    speed: 1.3,
    courage: 0.16,
    dialogue: 'I stay close to the police station these days. Too many reckless drivers and suspicious deals around the harbor.',
  },
  {
    name: 'Anthony Russo',
    archetype: 'business',
    accessory: 'briefcase',
    spawnPos: { x: 22, y: 0, z: -20 },
    routeId: 'bank_corporate_plaza',
    speed: 1.55,
    courage: 0.54,
    dialogue: 'Bank security was alerted to a cloned credit card ring operating near the ATM. Watch for card skimmers.',
  },
];
