import { DynamicEvent } from '../../types/game';
import { authoritativeEncounterManager } from './EncounterManager';

export interface PoliceResourceStatus {
  patrolAvailable: number;
  patrolTotal: number;
  pursuitAvailable: number;
  pursuitTotal: number;
  swatAvailable: number;
  swatTotal: number;
  fireAvailable: number;
  fireTotal: number;
  trafficAvailable: number;
  trafficTotal: number;
}

export const INITIAL_POLICE_RESOURCES: PoliceResourceStatus = {
  patrolAvailable: 4,
  patrolTotal: 5,
  pursuitAvailable: 2,
  pursuitTotal: 3,
  swatAvailable: 2,
  swatTotal: 2,
  fireAvailable: 2,
  fireTotal: 2,
  trafficAvailable: 2,
  trafficTotal: 2,
};

export const DYNAMIC_EVENT_CATALOG: Omit<DynamicEvent, 'id' | 'active' | 'timeRemaining'>[] = [
  // 1. Armed Robbery at a Shop
  {
    title: '10-31: Armed Robbery at Metro Mart',
    type: 'robbery',
    description: 'Armed suspect holding cashier at gunpoint inside Metro Mart on Commercial Promenade!',
    locationName: 'Metro Mart & Pharmacy Storefront',
    position: { x: -28, y: 0, z: -10 },
    rewardMoney: 450,
    rewardXP: 320,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['patrol'],
    visualEffect: 'barricade',
  },
  // 2. Purse / Bag Snatching on the Street
  {
    title: '10-11: Street Robbery & Bag Snatch',
    type: 'disturbance',
    description: 'Pedestrian purse snatched on the promenade sidewalk; suspect fleeing on foot toward alleys.',
    locationName: 'Commercial Storefront Sidewalk',
    position: { x: -28, y: 0, z: 12 },
    rewardMoney: 280,
    rewardXP: 220,
    severity: 'minor',
    requiresUnits: 1,
    assignedUnits: ['patrol'],
    visualEffect: 'none',
  },
  // 3. Gang Members Shooting at Each Other (Turf War)
  {
    title: '10-71: Violent Gang Turf Firefight',
    type: 'gang_war',
    description: 'Cobalt Skulls and Neon Pythons exchanging automatic gunfire near eastern freight logistics.',
    locationName: 'East Industrial Freight Depot',
    position: { x: 38, y: 0, z: 32 },
    rewardMoney: 650,
    rewardXP: 500,
    severity: 'high',
    requiresUnits: 3,
    assignedUnits: ['patrol', 'swat'],
    visualEffect: 'barricade',
  },
  // 4. Vehicle Theft & High-Speed Pursuit
  {
    title: '10-25: Stolen Tuner High-Speed Pursuit',
    type: 'pursuit',
    description: 'Suspect in modified neon tuner blowing through intersections eastbound. Pursuit unit requested for PIT maneuver.',
    locationName: 'Central Avenue Expressway',
    position: { x: 8, y: 0, z: -15 },
    rewardMoney: 550,
    rewardXP: 450,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['pursuit'],
    visualEffect: 'none',
  },
  // 5. Bank / Store Robbery
  {
    title: '10-90: Armed Vault Robbery at Metro Corporate Bank',
    type: 'robbery',
    description: 'Silent panic alarm triggered at Metro Bank plaza. Heavy syndicate drill detected on vault floor.',
    locationName: 'Metro Financial Bank Plaza',
    position: { x: 26, y: 0, z: -24 },
    rewardMoney: 950,
    rewardXP: 750,
    severity: 'critical',
    requiresUnits: 4,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
  },
  // 6. Prison Break with Escaped Criminals Spreading Through City
  {
    title: '10-98: Prison Break & Escaped Convicts',
    type: 'prison_break',
    description: 'Transport van overturned on highway ramp! Three escaped convicts scattered into residential alleys.',
    locationName: 'North Highway Underpass Alleys',
    position: { x: -32, y: 0, z: -35 },
    rewardMoney: 780,
    rewardXP: 620,
    severity: 'high',
    requiresUnits: 3,
    assignedUnits: ['patrol', 'swat'],
    visualEffect: 'none',
  },
  // 7. Random Building / Shop Fire #1
  {
    title: 'Code 4: Structural Shop Fire at Commercial Row',
    type: 'fire',
    description: 'Electrical fire ignited inside storefront warehouse with heavy smoke billowing into the street.',
    locationName: 'West Commercial Storefront',
    position: { x: -30, y: 0, z: -6 },
    rewardMoney: 400,
    rewardXP: 350,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['fire', 'traffic'],
    visualEffect: 'fire',
  },
  // 8. Multiple Fires: Fire #2 (Industrial Scrap Yard)
  {
    title: 'Code 4: Roof Blaze at Rail Scrap Yard',
    type: 'fire',
    description: 'Sparks ignited tire stacks and oil drums. Emergency tender responding with foam cannon.',
    locationName: 'North Rail Scrap Yards',
    position: { x: 12, y: 0, z: -46 },
    rewardMoney: 420,
    rewardXP: 360,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['fire'],
    visualEffect: 'fire',
  },
  // 9. Multiple Fires: Fire #3 (Laundromat Fire)
  {
    title: 'Code 4: Commercial Laundromat Dryer Fire',
    type: 'fire',
    description: 'Gas dryer explosion in Cedar Heights service alley! Flames threatening adjacent apartments.',
    locationName: 'West Cedar Heights Laundromat',
    position: { x: -54, y: 0, z: -8 },
    rewardMoney: 460,
    rewardXP: 380,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['fire', 'traffic'],
    visualEffect: 'fire',
  },
  // 10. Multi-Vehicle Traffic Accident & Road Blockage
  {
    title: '10-50: Multi-Car Collision & Road Blockage',
    type: 'accident',
    description: 'Sedan and taxi collided at the main intersection, blocking both transit lanes. Traffic officers needed to divert flow.',
    locationName: 'Central Crosswalk Intersection',
    position: { x: 0, y: 0, z: 0 },
    rewardMoney: 350,
    rewardXP: 280,
    severity: 'minor',
    requiresUnits: 2,
    assignedUnits: ['traffic', 'patrol'],
    visualEffect: 'smoke',
  },
  // 11. Hostage Situation at Business
  {
    title: '10-33: Hostage Standoff at Cedar Diner',
    type: 'hostage',
    description: 'Armed syndicate thugs barricaded inside local business with civilians. Tactical SWAT perimeter forming.',
    locationName: 'Mama Leah Diner Promenade',
    position: { x: -62, y: 0, z: 12 },
    rewardMoney: 900,
    rewardXP: 700,
    severity: 'critical',
    requiresUnits: 4,
    assignedUnits: ['swat', 'patrol'],
    visualEffect: 'barricade',
  },
  // 12. Gang Territory Conflicts & Shakedowns
  {
    title: '10-60: Gang Territory Extortion Shakedown',
    type: 'gang_war',
    description: 'Iron Vipers enforcing protection rackets on street vendors near market plaza. Shots fired in air.',
    locationName: 'South Market Plaza Walkway',
    position: { x: -18, y: 0, z: 28 },
    rewardMoney: 580,
    rewardXP: 440,
    severity: 'high',
    requiresUnits: 2,
    assignedUnits: ['patrol'],
    visualEffect: 'barricade',
  },
  // 13. Random Civilian Emergency
  {
    title: '10-45: Scaffolding Collapse & Civilian Medical Emergency',
    type: 'civilian_emergency',
    description: 'Construction scaffolding collapsed onto sidewalk near transit station. Pedestrians trapped underneath; responders en route.',
    locationName: 'Civic Transit Promenade',
    position: { x: 18, y: 0, z: -8 },
    rewardMoney: 400,
    rewardXP: 340,
    severity: 'moderate',
    requiresUnits: 2,
    assignedUnits: ['traffic', 'fire'],
    visualEffect: 'smoke',
  },
  // 14. Rare Large-Scale Disaster: Fictional Airplane Crash
  {
    title: 'MAYDAY CODE RED: Cargo Aircraft Crash Site',
    type: 'disaster_crash',
    description: 'Fictional twin-engine freight transport down in East Logistics Sector! Debris and fuel fire across warehouse lot! ALL UNITS ASSIST!',
    locationName: 'Eastern Logistics Container Field',
    position: { x: 55, y: 0, z: 45 },
    rewardMoney: 1600,
    rewardXP: 1300,
    severity: 'disaster',
    requiresUnits: 6,
    assignedUnits: ['fire', 'swat', 'patrol', 'traffic'],
    visualEffect: 'debris',
  },
];

export const EVENT_TYPE_COOLDOWNS: Record<string, number> = {
  robbery: 80,
  gang_war: 90,
  hostage: 100,
  pursuit: 75,
  prison_break: 85,
  disturbance: 60,
  fire: 65,
  accident: 55,
  civilian_emergency: 55,
  disaster_crash: 240,
};

export class CityIncidentManager {
  public activeIncidents: DynamicEvent[] = [];
  public policeResources: PoliceResourceStatus = { ...INITIAL_POLICE_RESOURCES };
  public radioChatterFeed: { id: string; text: string; time: number; type: 'info' | 'alert' | 'success' }[] = [];
  public cooldownTimer: number = 0; // global cooldown in seconds before next incident
  private nextEventCountdown: number = 35;
  private initialPeacefulDelay: number = 35; // 35 seconds calm patrol before first 911 dispatch
  private resolvedIncidentIds: Set<string> = new Set();
  private typeCooldowns: Map<string, number> = new Map();
  private lastEventType: string | null = null;

  // Callbacks
  public onRadioBroadcast?: (callout: string, type: 'info' | 'alert' | 'success') => void;
  public onIncidentStateChange?: (incidents: DynamicEvent[]) => void;
  public onNewIncident?: (incident: DynamicEvent) => void;

  constructor() {
    // Start with a peaceful living city without instant firefight or gunshots on game startup
    this.activeIncidents = [];
    this.initialPeacefulDelay = 35; // 35 seconds initial peaceful patrol before first 911 dispatch
    this.nextEventCountdown = 35;
    this.cooldownTimer = 0;
    this.resolvedIncidentIds.clear();
    this.typeCooldowns.clear();
    this.lastEventType = null;
  }

  public update(delta: number): void {
    // 0. Update manager cooldown timer and initial peaceful delay
    if (this.initialPeacefulDelay > 0) {
      this.initialPeacefulDelay -= delta;
    }
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }
    // Update per-type cooldowns
    for (const [type, cd] of this.typeCooldowns.entries()) {
      if (cd > 0) {
        this.typeCooldowns.set(type, cd - delta);
      } else {
        this.typeCooldowns.delete(type);
      }
    }

    // 1. Countdown to spawn new random events naturally around the city
    // Only spawn if calm initial delay and global cooldown have expired, and no active incident is in progress (max 1)
    const hasActiveIncidents = this.activeIncidents.some(
      (i) => i.status === 'active' || i.status === 'pending' || i.active
    );
    if (this.initialPeacefulDelay <= 0 && this.cooldownTimer <= 0 && !hasActiveIncidents && this.activeIncidents.length === 0) {
      this.nextEventCountdown -= delta;
      if (this.nextEventCountdown <= 0) {
        this.nextEventCountdown = 45 + Math.random() * 30; // 45-75 seconds between incidents
        this.generateNaturallyOccurringEvent();
      }
    }

    // 2. Progress all active incidents and autonomous police responses
    for (let i = this.activeIncidents.length - 1; i >= 0; i--) {
      const inc = this.activeIncidents[i];
      if (inc.status === 'resolved' || inc.status === 'failed' || inc.status === 'completed') {
        this.activeIncidents.splice(i, 1);
        continue;
      }

      inc.timeRemaining -= delta;

      // Autonomous police resolution progress
      if (inc.assignedUnits && inc.assignedUnits.length > 0) {
        // Rate depends on unit count and incident severity
        const rate = inc.severity === 'disaster' ? 1.5 : inc.severity === 'critical' ? 2.0 : 3.2;
        const prevProg = inc.policeProgress || 0;
        inc.policeProgress = prevProg + delta * rate;

        // Realistic field radio milestones
        if (prevProg < 25 && inc.policeProgress >= 25) {
          inc.stage = 'active';
          if (inc.type === 'hostage') {
            this.broadcastRadio(`[SWAT 1] Perimeter locked down at ${inc.locationName}. Negotiator on megaphone.`, 'info');
          } else if (inc.type === 'fire') {
            this.broadcastRadio(`[ENGINE 4] Attack lines charged at ${inc.locationName}. Primary search underway.`, 'info');
          } else if (inc.type === 'accident') {
            this.broadcastRadio(`[TRAFFIC 2] Intersection cordoned at ${inc.locationName}. Diversion signs in place.`, 'info');
          } else if (inc.type === 'pursuit') {
            this.broadcastRadio(`[PURSUIT 1] Suspect vehicle cornered, preparing spike strips on avenue!`, 'info');
          } else {
            this.broadcastRadio(`[UNIT 12] On scene at ${inc.locationName}. Formed tactical perimeter.`, 'info');
          }
        } else if (prevProg < 65 && inc.policeProgress >= 65) {
          inc.stage = 'resolving';
          if (inc.type === 'hostage') {
            this.broadcastRadio(`[SWAT 1] Breaching rear entrance at ${inc.locationName}! Civilians moving to safety!`, 'alert');
          } else if (inc.type === 'gang_war') {
            this.broadcastRadio(`[PATROL 3] Gang combatants breaking off, suspects being subdued!`, 'alert');
          } else if (inc.type === 'fire') {
            this.broadcastRadio(`[ENGINE 4] Knockdown achieved on main body of fire. Venting roof.`, 'info');
          } else {
            this.broadcastRadio(`[UNIT 12] Suspects challenged under gunpoint. Complying with arrest orders.`, 'info');
          }
        }

        // Incident resolved by autonomous police units
        if (inc.policeProgress >= 100) {
          inc.stage = 'resolved';
          inc.status = 'resolved';
          inc.active = false;
          authoritativeEncounterManager.completeEncounter(inc.id);
          this.resolvedIncidentIds.add(inc.id);
          this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 75);
          this.lastEventType = inc.type;
          this.cooldownTimer = 45; // 45s global cooldown
          this.nextEventCountdown = 45 + Math.random() * 25;
          this.releaseUnits(inc.assignedUnits);
          this.broadcastRadio(
            `[DISPATCH] 10-24: Incident secured at ${inc.locationName}. Responding units returning to patrol status.`,
            'success'
          );
          this.activeIncidents.splice(i, 1);
          this.onIncidentStateChange?.(this.activeIncidents);
          continue;
        }
      } else {
        // No police assigned — incident escalates or suspects flee!
        if (inc.timeRemaining <= 45 && inc.stage !== 'escalating') {
          inc.stage = 'escalating';
          if (inc.type === 'fire') {
            this.broadcastRadio(
              `[DISPATCH 10-33] Fire spreading to adjacent structures at ${inc.locationName}! Immediate units needed!`,
              'alert'
            );
          } else if (inc.type === 'robbery' || inc.type === 'prison_break') {
            this.broadcastRadio(
              `[DISPATCH 10-33] Situation escalating at ${inc.locationName}! Suspects attempting getaway!`,
              'alert'
            );
          } else {
            this.broadcastRadio(
              `[DISPATCH 10-33] Incident uncontained at ${inc.locationName}! All free units please respond!`,
              'alert'
            );
          }
        }
      }

      // Expired incident without resolution
      if (inc.timeRemaining <= 0) {
        if (inc.assignedUnits) {
          this.releaseUnits(inc.assignedUnits);
        }
        inc.stage = 'suspect_escaped';
        inc.status = 'failed';
        inc.active = false;
        this.resolvedIncidentIds.add(inc.id);
        this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 60);
        this.lastEventType = inc.type;
        this.cooldownTimer = 40;
        this.nextEventCountdown = 40 + Math.random() * 20;
        this.broadcastRadio(
          `[DISPATCH] 10-99: Incident expired at ${inc.locationName}. Suspects fled scene; units resuming normal patrol.`,
          'info'
        );
        this.activeIncidents.splice(i, 1);
        this.onIncidentStateChange?.(this.activeIncidents);
      }
    }
  }

  /**
   * Spawns a new natural incident in the city based on weighted probabilities and cooldown checks
   */
  public generateNaturallyOccurringEvent(): DynamicEvent | null {
    if (this.initialPeacefulDelay > 0) return null;
    if (this.cooldownTimer > 0) return null;
    if (this.activeIncidents.length >= 1) return null;

    // Filter catalog: must not be in type cooldown
    const eligible = DYNAMIC_EVENT_CATALOG.filter((e) => {
      const cd = this.typeCooldowns.get(e.type) ?? 0;
      return cd <= 0;
    });

    if (eligible.length === 0) return null;

    // Avoid back-to-back repeating of the same event type
    const nonRepeating = eligible.filter((e) => e.type !== this.lastEventType && e.type !== 'disaster_crash');
    const candidates = nonRepeating.length > 0 ? nonRepeating : eligible.filter((e) => e.type !== 'disaster_crash');

    if (candidates.length === 0) return null;

    // Pick random candidate template
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    return this.spawnIncident(template);
  }

  public spawnIncident(template: Omit<DynamicEvent, 'id' | 'active' | 'timeRemaining'>): DynamicEvent {
    // Generate unique ID that will never repeat
    const uniqueId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inc: DynamicEvent = {
      ...template,
      id: uniqueId,
      active: true,
      status: 'pending',
      timeRemaining: template.severity === 'disaster' ? 300 : 180,
      stage: 'reported',
      policeProgress: 0,
      spawnedEnemyIds: [],
      spawnedPoliceIds: [],
      spawnedCivilianIds: [],
    };

    // Register with authoritative encounter manager
    authoritativeEncounterManager.registerEncounter({
      id: uniqueId,
      type: template.type as any,
      title: template.title,
      locationName: template.locationName,
      position: template.position,
      rewardXP: template.rewardXP,
      rewardMoney: template.rewardMoney,
      cooldownDuration: EVENT_TYPE_COOLDOWNS[template.type] || 90,
      repeatable: true,
    });
    authoritativeEncounterManager.startEncounter(uniqueId);

    // Autonomous Police Dispatcher logic: Allocate available units
    const dispatched = this.tryAllocatePoliceUnits(template.type, template.severity || 'moderate');

    // Priority Override: If high-severity or disaster event has insufficient units, redirect from minor incidents
    if ((template.severity === 'disaster' || template.severity === 'critical') && dispatched.length < 2) {
      for (const other of this.activeIncidents) {
        if (other.severity === 'minor' && other.assignedUnits && other.assignedUnits.length > 0) {
          const redirected = other.assignedUnits.splice(0, 1)[0];
          dispatched.push(redirected);
          this.broadcastRadio(
            `[DISPATCH PRIORITY OVERRIDE] Redirecting ${redirected.toUpperCase()} unit from ${other.locationName} to Code Red incident at ${inc.locationName}!`,
            'alert'
          );
          if (dispatched.length >= 3) break;
        }
      }
    }

    inc.assignedUnits = dispatched;

    if (dispatched.length > 0) {
      inc.stage = 'dispatching';
      this.broadcastRadio(
        `[DISPATCH] ${inc.title} at ${inc.locationName}. Units (${dispatched.join(', ')}) dispatched code 3.`,
        template.severity === 'critical' || template.severity === 'disaster' ? 'alert' : 'info'
      );
    } else {
      inc.stage = 'reported';
      this.broadcastRadio(
        `[DISPATCH ALERT] ${inc.title} at ${inc.locationName}. ALL POLICE UNITS COMMITTED! Standby backlog holding!`,
        'alert'
      );
    }

    this.activeIncidents.push(inc);
    this.onIncidentStateChange?.(this.activeIncidents);
    this.onNewIncident?.(inc);
    return inc;
  }

  private tryAllocatePoliceUnits(
    type: DynamicEvent['type'],
    severity: string
  ): ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[] {
    const allocated: ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[] = [];

    if (type === 'fire') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.trafficAvailable > 0) {
        this.policeResources.trafficAvailable--;
        allocated.push('traffic');
      }
    } else if (type === 'pursuit') {
      if (this.policeResources.pursuitAvailable > 0) {
        this.policeResources.pursuitAvailable--;
        allocated.push('pursuit');
      } else if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'hostage' || type === 'gang_war' || severity === 'critical') {
      if (this.policeResources.swatAvailable > 0) {
        this.policeResources.swatAvailable--;
        allocated.push('swat');
      }
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'disaster_crash') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.swatAvailable > 0) {
        this.policeResources.swatAvailable--;
        allocated.push('swat');
      }
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    } else if (type === 'civilian_emergency') {
      if (this.policeResources.fireAvailable > 0) {
        this.policeResources.fireAvailable--;
        allocated.push('fire');
      }
      if (this.policeResources.trafficAvailable > 0) {
        this.policeResources.trafficAvailable--;
        allocated.push('traffic');
      }
    } else {
      // Standard patrol response
      if (this.policeResources.patrolAvailable > 0) {
        this.policeResources.patrolAvailable--;
        allocated.push('patrol');
      }
    }

    return allocated;
  }

  private releaseUnits(units: ('patrol' | 'pursuit' | 'swat' | 'fire' | 'traffic')[]): void {
    units.forEach((u) => {
      if (u === 'patrol' && this.policeResources.patrolAvailable < this.policeResources.patrolTotal) {
        this.policeResources.patrolAvailable++;
      } else if (u === 'pursuit' && this.policeResources.pursuitAvailable < this.policeResources.pursuitTotal) {
        this.policeResources.pursuitAvailable++;
      } else if (u === 'swat' && this.policeResources.swatAvailable < this.policeResources.swatTotal) {
        this.policeResources.swatAvailable++;
      } else if (u === 'fire' && this.policeResources.fireAvailable < this.policeResources.fireTotal) {
        this.policeResources.fireAvailable++;
      } else if (u === 'traffic' && this.policeResources.trafficAvailable < this.policeResources.trafficTotal) {
        this.policeResources.trafficAvailable++;
      }
    });
  }

  private broadcastRadio(text: string, type: 'info' | 'alert' | 'success'): void {
    const item = { id: `radio_${Date.now()}_${Math.random()}`, text, time: Date.now(), type };
    this.radioChatterFeed.push(item);
    if (this.radioChatterFeed.length > 20) this.radioChatterFeed.shift();
    this.onRadioBroadcast?.(text, type);
  }

  /**
   * When player intervenes and resolves an incident personally
   */
  public resolveIncidentByPlayer(incidentId: string): DynamicEvent | null {
    if (this.resolvedIncidentIds.has(incidentId)) {
      return null;
    }
    const idx = this.activeIncidents.findIndex((i) => i.id === incidentId);
    if (idx >= 0) {
      const inc = this.activeIncidents[idx];
      inc.status = 'resolved';
      inc.active = false;
      inc.stage = 'resolved';
      this.resolvedIncidentIds.add(inc.id);
      authoritativeEncounterManager.completeEncounter(inc.id);

      if (inc.assignedUnits) {
        this.releaseUnits(inc.assignedUnits);
      }
      this.activeIncidents.splice(idx, 1);

      // Enforce healthy type-specific and global cooldowns (45-75 seconds)
      this.typeCooldowns.set(inc.type, EVENT_TYPE_COOLDOWNS[inc.type] || 80);
      this.lastEventType = inc.type;
      this.cooldownTimer = 45;
      this.nextEventCountdown = 45 + Math.random() * 25;

      this.broadcastRadio(
        `[PRECINCT 9] Officer Carter successfully secured incident at ${inc.locationName}! Scene clear, units returning to patrol. Outstanding work!`,
        'success'
      );
      this.onIncidentStateChange?.(this.activeIncidents);
      return inc;
    }
    return null;
  }

  public isIncidentResolved(incidentId: string): boolean {
    return this.resolvedIncidentIds.has(incidentId);
  }

  public reset(): void {
    authoritativeEncounterManager.reset();
    this.activeIncidents = [];
    this.resolvedIncidentIds.clear();
    this.typeCooldowns.clear();
    this.policeResources = { ...INITIAL_POLICE_RESOURCES };
    this.cooldownTimer = 0;
    this.initialPeacefulDelay = 35;
    this.nextEventCountdown = 35;
    this.lastEventType = null;
    this.radioChatterFeed = [];
  }
}

// Global incident manager singleton
export const cityIncidentManager = new CityIncidentManager();

export function generateRandomCityEvent(): DynamicEvent | null {
  if (cityIncidentManager.cooldownTimer > 0) return null;
  const inc = cityIncidentManager.generateNaturallyOccurringEvent();
  return inc;
}
