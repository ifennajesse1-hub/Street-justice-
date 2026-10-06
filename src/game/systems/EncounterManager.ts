/**
 * Authoritative Encounter Manager for Street Justice
 * 
 * Manages the full lifecycle of all combat, hostage, dynamic city, and story encounters.
 * Enforces strict finite-state machine with states: READY, ACTIVE, COMPLETED, COOLDOWN.
 * 
 * Rules:
 * 1. Never start an encounter while it is active, completed, or on cooldown.
 * 2. Spawn hostages and enemies only when a valid new encounter starts.
 * 3. Do not recreate the same hostages, enemies, mission, sounds, or rewards every update cycle.
 * 4. Completed encounters must not restart automatically.
 * 5. New encounters require a valid mission trigger or controlled spawn decision.
 * 6. Clean up timers and listeners when encounters end, and prevent scene reloads or re-renders
 *    from registering duplicate schedulers.
 */

export type EncounterState = 'READY' | 'ACTIVE' | 'COMPLETED' | 'COOLDOWN';

export interface EncounterConfig {
  id: string;
  type: 'hostage' | 'robbery' | 'pursuit' | 'gang_war' | 'prison_break' | 'disturbance' | 'fire' | 'accident' | 'disaster_crash' | 'civilian_emergency';
  title: string;
  missionId?: string;
  locationName: string;
  position: { x: number; y: number; z: number };
  rewardXP: number;
  rewardMoney: number;
  cooldownDuration?: number; // In seconds
  repeatable?: boolean;
}

export interface EncounterRecord {
  id: string;
  type: EncounterConfig['type'];
  title: string;
  missionId?: string;
  locationName: string;
  position: { x: number; y: number; z: number };
  state: EncounterState;
  rewardXP: number;
  rewardMoney: number;
  rewardsAwarded: boolean;
  cooldownDuration: number;
  cooldownRemaining: number;
  repeatable: boolean;
  spawnedEnemyIds: string[];
  spawnedHostageIds: string[];
  spawnedPoliceIds: string[];
  spawnedPropIds: string[];
  startTime: number;
  completedTime?: number;
}

export class EncounterManager {
  private encounters: Map<string, EncounterRecord> = new Map();
  private missionEncounterMap: Map<string, string> = new Map();
  private activeEncounterId: string | null = null;
  private listeners: Set<(encounter: EncounterRecord, event: 'started' | 'completed' | 'failed' | 'cooldown') => void> = new Set();
  private timerHandles: Set<ReturnType<typeof setTimeout>> = new Set();

  constructor() {
    this.encounters = new Map();
    this.missionEncounterMap = new Map();
    this.activeEncounterId = null;
  }

  /**
   * Registers a new encounter definition into the authoritative registry.
   */
  public registerEncounter(config: EncounterConfig): EncounterRecord {
    // If already exists, return existing record
    if (this.encounters.has(config.id)) {
      return this.encounters.get(config.id)!;
    }

    const record: EncounterRecord = {
      id: config.id,
      type: config.type,
      title: config.title,
      missionId: config.missionId,
      locationName: config.locationName,
      position: { ...config.position },
      state: 'READY',
      rewardXP: config.rewardXP,
      rewardMoney: config.rewardMoney,
      rewardsAwarded: false,
      cooldownDuration: config.cooldownDuration ?? 90,
      cooldownRemaining: 0,
      repeatable: config.repeatable ?? false,
      spawnedEnemyIds: [],
      spawnedHostageIds: [],
      spawnedPoliceIds: [],
      spawnedPropIds: [],
      startTime: 0,
    };

    this.encounters.set(record.id, record);
    if (config.missionId) {
      this.missionEncounterMap.set(config.missionId, record.id);
    }

    return record;
  }

  /**
   * Checks if an encounter can legally be started.
   * Returns false if encounter is ACTIVE, COMPLETED (and non-repeatable), or on COOLDOWN.
   */
  public canStartEncounter(encounterId: string): boolean {
    const enc = this.encounters.get(encounterId);
    if (!enc) return false;

    // Rule: Never start an encounter while it is active, completed, or on cooldown
    if (enc.state === 'ACTIVE') return false;
    if (enc.state === 'COMPLETED' && !enc.repeatable) return false;
    if (enc.state === 'COOLDOWN') return false;

    // Rule: Don't start another encounter if an active encounter is currently in progress
    if (this.activeEncounterId !== null && this.activeEncounterId !== encounterId) {
      const currentActive = this.encounters.get(this.activeEncounterId);
      if (currentActive && currentActive.state === 'ACTIVE') {
        return false;
      }
    }

    return enc.state === 'READY';
  }

  /**
   * Checks if an encounter for a given mission can be started.
   */
  public canStartMissionEncounter(missionId: string): boolean {
    const encId = this.missionEncounterMap.get(missionId);
    if (!encId) return true; // If not yet registered, can be created and started
    return this.canStartEncounter(encId);
  }

  /**
   * Authoritatively starts an encounter.
   * Calls spawnCallback only once when transitioning from READY to ACTIVE.
   */
  public startEncounter(encounterId: string, spawnCallback?: (encounter: EncounterRecord) => void): boolean {
    if (!this.canStartEncounter(encounterId)) {
      return false;
    }

    const enc = this.encounters.get(encounterId)!;
    enc.state = 'ACTIVE';
    enc.startTime = Date.now();
    this.activeEncounterId = enc.id;

    // Spawn actors strictly once on valid encounter start
    if (spawnCallback) {
      spawnCallback(enc);
    }

    this.notifyListeners(enc, 'started');
    return true;
  }

  /**
   * Marks an encounter as COMPLETED.
   * Prevents duplicate rewards or re-completion.
   */
  public completeEncounter(
    encounterId: string,
    onReward?: (xp: number, money: number) => void
  ): boolean {
    const enc = this.encounters.get(encounterId);
    if (!enc || enc.state !== 'ACTIVE') return false;

    enc.state = 'COMPLETED';
    enc.completedTime = Date.now();

    if (!enc.rewardsAwarded) {
      enc.rewardsAwarded = true;
      if (onReward) {
        onReward(enc.rewardXP, enc.rewardMoney);
      }
    }

    if (this.activeEncounterId === enc.id) {
      this.activeEncounterId = null;
    }

    // If repeatable (like city event), move to COOLDOWN
    if (enc.repeatable) {
      enc.state = 'COOLDOWN';
      enc.cooldownRemaining = enc.cooldownDuration;
      this.notifyListeners(enc, 'cooldown');
    } else {
      this.notifyListeners(enc, 'completed');
    }

    return true;
  }

  /**
   * Fails or cancels an encounter, putting it on cooldown
   */
  public failEncounter(encounterId: string): void {
    const enc = this.encounters.get(encounterId);
    if (!enc) return;

    if (this.activeEncounterId === enc.id) {
      this.activeEncounterId = null;
    }

    enc.state = 'COOLDOWN';
    enc.cooldownRemaining = enc.cooldownDuration;
    this.notifyListeners(enc, 'failed');
  }

  /**
   * Update loop to progress cooldown timers and manage states
   */
  public update(delta: number): void {
    for (const enc of this.encounters.values()) {
      if (enc.state === 'COOLDOWN') {
        enc.cooldownRemaining -= delta;
        if (enc.cooldownRemaining <= 0) {
          enc.cooldownRemaining = 0;
          if (enc.repeatable) {
            enc.state = 'READY';
            enc.rewardsAwarded = false;
            enc.spawnedEnemyIds = [];
            enc.spawnedHostageIds = [];
            enc.spawnedPoliceIds = [];
            enc.spawnedPropIds = [];
          } else {
            enc.state = 'COMPLETED';
          }
        }
      }
    }
  }

  /**
   * Retrieves an encounter record by ID.
   */
  public getEncounter(encounterId: string): EncounterRecord | undefined {
    return this.encounters.get(encounterId);
  }

  /**
   * Retrieves an encounter record by mission ID.
   */
  public getEncounterByMissionId(missionId: string): EncounterRecord | undefined {
    const encId = this.missionEncounterMap.get(missionId);
    return encId ? this.encounters.get(encId) : undefined;
  }

  /**
   * Returns current active encounter ID if any.
   */
  public getActiveEncounterId(): string | null {
    return this.activeEncounterId;
  }

  /**
   * Checks whether any encounter is currently active in the city.
   */
  public isAnyEncounterActive(): boolean {
    return this.activeEncounterId !== null;
  }

  /**
   * Subscribes a listener to encounter lifecycle events.
   * Returns an unsubscribe function for clean lifecycle teardown.
   */
  public subscribe(
    listener: (encounter: EncounterRecord, event: 'started' | 'completed' | 'failed' | 'cooldown') => void
  ): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(encounter: EncounterRecord, event: 'started' | 'completed' | 'failed' | 'cooldown'): void {
    this.listeners.forEach((listener) => {
      try {
        listener(encounter, event);
      } catch (err) {
        console.error('Encounter listener error:', err);
      }
    });
  }

  /**
   * Cleans up all active timer handles and listeners.
   */
  public destroy(): void {
    this.timerHandles.forEach((handle) => clearTimeout(handle));
    this.timerHandles.clear();
    this.listeners.clear();
    this.activeEncounterId = null;
  }

  /**
   * Resets encounter manager on game restart or reset.
   */
  public reset(): void {
    this.destroy();
    this.encounters.clear();
    this.missionEncounterMap.clear();
    this.activeEncounterId = null;
  }
}

// Global authoritative singleton instance
export const authoritativeEncounterManager = new EncounterManager();
