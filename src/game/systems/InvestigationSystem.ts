import { EvidenceItem } from '../../types/game';

export interface CrimeCase {
  id: string;
  title: string;
  suspectOrganization: string;
  description: string;
  rewardMoney: number;
  rewardXP: number;
  evidenceRequired: number;
  isSolved: boolean;
  leadSuspect: string;
}

export const CRIME_CASES: CrimeCase[] = [
  {
    id: 'case_alley_shakedown',
    title: 'Case #101: Commercial Alley Protection Racket',
    suspectOrganization: 'Red Viper Street Syndicate',
    description: 'Local business owners in the commercial plaza report armed shakedowns. Collect forensic evidence and photograph syndicate tags.',
    rewardMoney: 600,
    rewardXP: 450,
    evidenceRequired: 3,
    isSolved: false,
    leadSuspect: 'Rook & Stitch',
  },
  {
    id: 'case_warehouse_arms',
    title: 'Case #102: Harbor Military Arms Pipeline',
    suspectOrganization: 'Vance Contraband Cartel',
    description: 'Military-grade hardware intercepted at harbor docks. Trace the serial numbers, recover decrypted datapads, and identify the distributor.',
    rewardMoney: 1200,
    rewardXP: 800,
    evidenceRequired: 4,
    isSolved: false,
    leadSuspect: 'Enforcer Trigger',
  },
  {
    id: 'case_metro_bank_heist',
    title: 'Case #103: The Metro Bank Vault Conspiracy',
    suspectOrganization: 'The Underground Network',
    description: 'Internal security codes breached before the bank siege. Locate dropped burner phones, blueprints, and question the bank manager.',
    rewardMoney: 2000,
    rewardXP: 1400,
    evidenceRequired: 4,
    isSolved: false,
    leadSuspect: 'Viper Vance',
  },
  {
    id: 'case_building_collapse_corruption',
    title: 'Case #104: The Sterling Heights Structural Collapse & Bribes',
    suspectOrganization: 'Sterling Developments & Municipal Hall',
    description: 'A multi-story residential construction tower partially collapsed onto the avenue, trapping workers and pedestrians. Forensics indicate substandard rebar and concrete, while whistleblower reports were suppressed via bribes to municipal inspectors.',
    rewardMoney: 4500,
    rewardXP: 3000,
    evidenceRequired: 3,
    isSolved: false,
    leadSuspect: 'Arthur Sterling & Inspector Howard Pike',
  },
];

export const INITIAL_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ev_casing_1',
    title: 'Spent 9mm Ballistic Casing',
    type: 'casing',
    description: 'Marked with syndicate cobra emblem stamping. Matches Rook\'s weapon.',
    locationName: 'Commercial Alley Dumpster',
    position: { x: -29.2, y: 0.1, z: -23.5 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_alley_shakedown',
  },
  {
    id: 'ev_datapad_1',
    title: 'Encrypted Syndicate Burner Datapad',
    type: 'datapad',
    description: 'Contains text messages detailing illegal extortion drop-offs at the Pharmacy.',
    locationName: 'Alley Wooden Crate Stack',
    position: { x: -26.2, y: 0.6, z: -21.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_alley_shakedown',
  },
  {
    id: 'ev_graffiti_1',
    title: 'Syndicate Territory Tag Photo',
    type: 'photo',
    description: 'Fresh crimson spray paint marking gang territory boundaries.',
    locationName: 'Commercial Brick Alley Wall',
    position: { x: -30.6, y: 1.5, z: -27.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_alley_shakedown',
  },
  {
    id: 'ev_footprints_1',
    title: 'Combat Boot Tracks',
    type: 'footprint',
    description: 'Muddy tread prints leading from the alley towards the Metro Bank plaza.',
    locationName: 'Commercial Boulevard Crosswalk',
    position: { x: -14.0, y: 0.05, z: -15.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_alley_shakedown',
  },
  {
    id: 'ev_narcotics_1',
    title: 'Contraband Narcotics Parcel',
    type: 'narcotics',
    description: 'Uncut narcotics brick wrapped in military-grade waterproof packaging.',
    locationName: 'Industrial Warehouse Shipping Container',
    position: { x: 38.0, y: 0.3, z: 28.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_warehouse_arms',
  },
  {
    id: 'ev_weapon_cache',
    title: 'Altered Serial Assault Rifle',
    type: 'weapon',
    description: 'Illegal automatic rifle hidden behind the warehouse cargo pallets.',
    locationName: 'East Harbor Loading Bay',
    position: { x: 52.0, y: 0.4, z: 42.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_warehouse_arms',
  },
  {
    id: 'ev_osm_substandard_rebar',
    title: 'Sheared Low-Grade Rebar Core Sample',
    type: 'weapon',
    description: 'Brittle, rusted structural rebar with tensile strength 50% below municipal code, retrieved directly from fractured column C4.',
    locationName: 'Lot 14B Fractured Pillar C4',
    position: { x: -32.2, y: 0.3, z: 43.5 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_building_collapse_corruption',
  },
  {
    id: 'ev_osm_cement_manifest',
    title: 'Altered Concrete Delivery Invoices',
    type: 'datapad',
    description: 'Forged batching delivery manifests revealing commercial grade concrete was replaced with cheap contaminated aggregate to pocket $1.8M.',
    locationName: 'Site Manager Office Trailer Safe',
    position: { x: -33.0, y: 0.8, z: 40.5 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_building_collapse_corruption',
  },
  {
    id: 'ev_osm_inspector_payoff',
    title: "Inspector Pike's Signed $10,000 Payoff Slip",
    type: 'datapad',
    description: 'Handwritten municipal safety pass envelope containing bank withdrawal stubs signed by developer Arthur Sterling and building inspector Howard Pike.',
    locationName: 'Black Town Car Drop Slip',
    position: { x: -24.0, y: 0.1, z: 36.0 },
    collected: false,
    photoTaken: false,
    caseFile: 'case_building_collapse_corruption',
  },
];
