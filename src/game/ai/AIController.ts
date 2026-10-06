import * as THREE from 'three';
import { EnemyEntity, CivilianEntity, EnemyType, PoliceNPCEntity, MilitaryNPCEntity, GangFactionId, WeaponConfig } from '../../types/game';
import { CharacterRig, updateCharacterAnimation } from '../engine/CharacterModels';
import { CollisionBox, getGroundElevation } from '../engine/CityGenerator';
import { PEDESTRIAN_ROUTES, PedestrianInitialConfig } from './PedestrianSystem';

export interface CoverSpot {
  pos: THREE.Vector3;
  peekOffset: THREE.Vector3;
  occupiedBy?: string;
}

export class AIController {
  public enemies: EnemyEntity[] = [];
  public enemyRigs: CharacterRig[] = [];
  public civilians: CivilianEntity[] = [];
  public civilianRigs: CharacterRig[] = [];
  public policeNPCs: PoliceNPCEntity[] = [];
  public policeRigs: CharacterRig[] = [];
  public militarySoldiers: MilitaryNPCEntity[] = [];
  public militaryRigs: CharacterRig[] = [];

  // Tactical cover locations in the city
  public coverSpots: CoverSpot[] = [
    { pos: new THREE.Vector3(-28.2, 0, -22.5), peekOffset: new THREE.Vector3(1.2, 0, 0) }, // Dumpster 1
    { pos: new THREE.Vector3(-27.8, 0, -30.5), peekOffset: new THREE.Vector3(-1.2, 0, 0) }, // Dumpster 2
    { pos: new THREE.Vector3(-26.0, 0, -22.0), peekOffset: new THREE.Vector3(0, 0, 1.2) },  // Crate stack
    { pos: new THREE.Vector3(-30.0, 0, -34.0), peekOffset: new THREE.Vector3(0.8, 0, 0) },  // Deep crates
    { pos: new THREE.Vector3(-7.5, 0, 31.0), peekOffset: new THREE.Vector3(0, 0, -1.2) },   // Police car curb
    { pos: new THREE.Vector3(-9.5, 0, -18), peekOffset: new THREE.Vector3(1.0, 0, 0) }, // Streetlight base
    { pos: new THREE.Vector3(-59.5, 0, -14.5), peekOffset: new THREE.Vector3(1.0, 0, 0) }, // Marcus's tool chest
    { pos: new THREE.Vector3(21, 0, 16), peekOffset: new THREE.Vector3(0, 0, -1.0) }, // Military sandbags
  ];

  // Callbacks for police radio, gunfire, military, and civilian speech bubbles
  public onPoliceShoot?: (police: PoliceNPCEntity, targetPos: THREE.Vector3) => void;
  public onMilitaryShoot?: (soldier: MilitaryNPCEntity, targetPos: THREE.Vector3) => void;
  public onRadioCallout?: (callout: string, type: 'info' | 'alert' | 'success') => void;
  public onPedestrianShout?: (civ: CivilianEntity, text: string) => void;
  public onEnemyArrested?: (enemy: EnemyEntity) => void;

  constructor() {}

  public removeEnemy(enemyId: string, scene?: THREE.Scene): void {
    const idx = this.enemies.findIndex((e) => e.id === enemyId);
    if (idx >= 0) {
      const e = this.enemies[idx];
      const rig = this.enemyRigs[e.meshIndex];
      if (rig && scene) {
        scene.remove(rig.root);
      }
      this.enemies.splice(idx, 1);
      this.enemyRigs.splice(idx, 1);
      // Re-index remaining enemy rigs
      for (let i = 0; i < this.enemies.length; i++) {
        this.enemies[i].meshIndex = i;
      }
    }
  }

  public spawnEnemy(
    type: EnemyType,
    pos: THREE.Vector3,
    meshRig: CharacterRig,
    customName?: string,
    faction?: GangFactionId | 'aegis_taskforce'
  ): EnemyEntity {
    const isBoss = type === 'boss';
    const isEnforcer = type === 'enforcer';
    const isSyndicate = faction === 'eclipse_syndicate' || type === 'syndicate_operative';

    let health = isBoss ? 350 : isSyndicate ? 220 : isEnforcer ? 130 : 80;
    if (faction === 'iron_vipers') health += 30; // Heavy armored faction
    if (faction === 'cobalt_skulls') health += 10;

    let factionName = 'Street Syndicate';
    if (faction === 'cobalt_skulls') factionName = 'The Cobalt Skulls';
    else if (faction === 'neon_pythons') factionName = 'The Neon Pythons';
    else if (faction === 'iron_vipers') factionName = 'The Iron Vipers';
    else if (faction === 'eclipse_syndicate') factionName = 'The Eclipse Syndicate';

    let defaultName = customName;
    if (!defaultName) {
      if (faction === 'cobalt_skulls') {
        defaultName = isEnforcer ? 'Skulls Enforcer' : 'Skulls Biker';
      } else if (faction === 'neon_pythons') {
        defaultName = isEnforcer ? 'Python Striker' : 'Python Runner';
      } else if (faction === 'iron_vipers') {
        defaultName = isEnforcer ? 'Viper Armored Guard' : 'Viper Heavy';
      } else if (isSyndicate) {
        defaultName = 'Eclipse Syndicate Operative';
      } else {
        defaultName = isBoss ? 'Viper Vance' : isEnforcer ? 'Syndicate Enforcer' : 'Street Thug';
      }
    }

    // Determine weapon based on faction and type
    let weaponId = isBoss ? 'titan_ar' : isEnforcer ? 'specter45' : 'vortex9';
    let weaponDamage = isBoss ? 20 : isEnforcer ? 14 : 10;
    let weaponFireRate = isBoss ? 4.5 : isEnforcer ? 6.5 : 2.2;
    let weaponRange = 42;
    let weaponSpread = 0.08;

    if (faction === 'neon_pythons') {
      weaponId = 'specter45';
      weaponDamage = 13;
      weaponFireRate = 7.0; // Rapid spray
      weaponSpread = 0.10;
    } else if (faction === 'iron_vipers') {
      weaponId = 'titan_ar';
      weaponDamage = 18; // Heavy impact
      weaponFireRate = 4.2;
      weaponRange = 44;
    } else if (isSyndicate) {
      weaponId = 'titan_ar';
      weaponDamage = 22; // High-tech lethal carbine
      weaponFireRate = 5.2;
      weaponRange = 48;
      weaponSpread = 0.04;
    }

    const enemy: EnemyEntity = {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      name: defaultName,
      faction,
      factionName,
      position: { x: pos.x, y: 0, z: pos.z },
      rotation: Math.random() * Math.PI * 2,
      health,
      maxHealth: health,
      state: 'patrol',
      weapon: {
        id: weaponId,
        name: isSyndicate ? 'Eclipse Carbine' : isBoss ? 'Titan-AR' : isEnforcer ? 'Specter-45' : 'Vortex-9',
        category: weaponId === 'titan_ar' ? 'rifle' : weaponId === 'specter45' ? 'smg' : 'handgun',
        damage: weaponDamage,
        fireRate: weaponFireRate,
        magazineSize: 30,
        currentAmmo: 30,
        reserveAmmo: 999,
        reloadTime: 1.8,
        range: weaponRange,
        spread: weaponSpread,
        isAutomatic: isBoss || isEnforcer || faction === 'neon_pythons' || isSyndicate,
        unlocked: true,
        price: 0,
        upgradeLevel: 1,
      },
      shootCooldown: 1.2 + Math.random() * 1.5,
      alertLevel: 0,
      meshIndex: this.enemyRigs.length,
      target: {
        x: pos.x + (Math.random() - 0.5) * 16,
        y: 0,
        z: pos.z + (Math.random() - 0.5) * 16,
      },
    };

    meshRig.root.position.set(pos.x, 0, pos.z);
    this.enemies.push(enemy);
    this.enemyRigs.push(meshRig);
    return enemy;
  }

  public spawnMilitarySoldier(
    pos: THREE.Vector3,
    meshRig: CharacterRig,
    name?: string,
    callsign?: string,
    squadLeader?: boolean
  ): MilitaryNPCEntity {
    const defaultName = name || ['Sergeant Briggs', 'Corporal Vance', 'Specialist Reyes', 'Private Hayes'][this.militarySoldiers.length % 4];
    const defaultCallsign = callsign || `Aegis-${this.militarySoldiers.length + 1}`;

    const soldier: MilitaryNPCEntity = {
      id: `aegis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      callsign: defaultCallsign,
      position: { x: pos.x, y: 0, z: pos.z },
      rotation: Math.PI,
      health: 240,
      maxHealth: 240,
      state: 'patrolling',
      squadLeader,
      weapon: {
        id: 'titan_ar',
        name: 'Aegis Heavy Battle Rifle',
        category: 'rifle',
        damage: 22,
        fireRate: 5.6,
        magazineSize: 35,
        currentAmmo: 35,
        reserveAmmo: 210,
        reloadTime: 1.5,
        range: 50,
        spread: 0.04,
        isAutomatic: true,
        unlocked: true,
        price: 0,
        upgradeLevel: 3,
      },
      shootCooldown: 1.0,
      meshIndex: this.militaryRigs.length,
      targetPos: {
        x: pos.x + (Math.random() - 0.5) * 12,
        y: 0,
        z: pos.z + (Math.random() - 0.5) * 12,
      },
    };

    meshRig.root.position.set(pos.x, 0, pos.z);
    this.militarySoldiers.push(soldier);
    this.militaryRigs.push(meshRig);
    return soldier;
  }

  public spawnCivilian(
    pos: THREE.Vector3,
    meshRig: CharacterRig,
    config?: Partial<PedestrianInitialConfig>
  ): CivilianEntity {
    const defaultName = config?.name || `Citizen ${this.civilians.length + 1}`;
    const archetype = config?.archetype || 'commuter';
    const routeId = config?.routeId || 'avenue_west';
    const route = PEDESTRIAN_ROUTES[routeId] || PEDESTRIAN_ROUTES.avenue_west;

    // Pick closest waypoint in the assigned route or first
    let startWaypointIdx = 0;
    let closestWpDist = 999;
    route.waypoints.forEach((wp, idx) => {
      const d = Math.hypot(wp.x - pos.x, wp.z - pos.z);
      if (d < closestWpDist) {
        closestWpDist = d;
        startWaypointIdx = idx;
      }
    });

    const targetWp = route.waypoints[startWaypointIdx];

    const civilian: CivilianEntity = {
      id: `civ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      archetype,
      position: { x: pos.x, y: 0, z: pos.z },
      targetPos: { x: targetWp.x, y: 0, z: targetWp.z },
      state: 'walking',
      speed: config?.speed || 1.3,
      meshIndex: this.civilianRigs.length,
      dialogue: config?.dialogue,
      accessory: config?.accessory || (meshRig.accessoryType || 'none'),
      courage: config?.courage !== undefined ? config.courage : 0.4,
      currentWaypointIndex: startWaypointIdx,
      routeId,
      shoutCooldown: 0,
      idleTimer: 0,
      panicTimer: 0,
      dodgeTimer: 0,
    };

    meshRig.root.position.set(pos.x, 0, pos.z);
    this.civilians.push(civilian);
    this.civilianRigs.push(meshRig);
    return civilian;
  }

  public spawnPoliceNPC(
    pos: THREE.Vector3,
    meshRig: CharacterRig,
    name?: string,
    badgeNumber?: string,
    role: import('../../types/game').PoliceRole = 'patrol'
  ): PoliceNPCEntity {
    let defaultName = name;
    if (!defaultName) {
      if (role === 'swat') defaultName = `SWAT Specialist ${this.policeNPCs.length + 1}`;
      else if (role === 'traffic') defaultName = `Traffic Officer ${this.policeNPCs.length + 1}`;
      else if (role === 'fire_responder') defaultName = `Rescue Officer ${this.policeNPCs.length + 1}`;
      else if (role === 'pursuit') defaultName = `Pursuit Officer ${this.policeNPCs.length + 1}`;
      else defaultName = ['Officer Miller', 'Officer Hayes', 'Officer Kowalski', 'Officer Davis'][this.policeNPCs.length % 4];
    }
    const defaultBadge = badgeNumber || `${200 + this.policeNPCs.length * 14}`;

    const health = role === 'swat' ? 240 : (role === 'fire_responder' || role === 'fire') ? 180 : 150;
    let weaponConfig: WeaponConfig = {
      id: 'vortex9',
      name: 'Vortex-9 Police Issue',
      category: 'handgun',
      damage: 16,
      fireRate: 2.8,
      magazineSize: 15,
      currentAmmo: 15,
      reserveAmmo: 90,
      reloadTime: 1.5,
      range: 38,
      spread: 0.05,
      isAutomatic: false,
      unlocked: true,
      price: 0,
      upgradeLevel: 2,
    };

    if (role === 'swat') {
      weaponConfig = {
        id: 'titan_ar',
        name: 'SWAT Tactical Carbine',
        category: 'rifle' as const,
        damage: 20,
        fireRate: 5.2,
        magazineSize: 30,
        currentAmmo: 30,
        reserveAmmo: 180,
        reloadTime: 1.6,
        range: 46,
        spread: 0.04,
        isAutomatic: true,
        unlocked: true,
        price: 0,
        upgradeLevel: 3,
      };
    }

    const police: PoliceNPCEntity = {
      id: `police_npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      badgeNumber: defaultBadge,
      role,
      position: { x: pos.x, y: 0, z: pos.z },
      rotation: Math.PI,
      health,
      maxHealth: health,
      state: 'patrolling',
      weapon: weaponConfig,
      shootCooldown: 1.0,
      meshIndex: this.policeRigs.length,
      targetPos: {
        x: pos.x + (Math.random() - 0.5) * 20,
        y: 0,
        z: pos.z + (Math.random() - 0.5) * 20,
      },
    };

    meshRig.root.position.set(pos.x, 0, pos.z);
    this.policeNPCs.push(police);
    this.policeRigs.push(meshRig);
    return police;
  }

  public update(
    delta: number,
    time: number,
    playerPos: THREE.Vector3,
    onEnemyShoot: (enemy: EnemyEntity, targetPos: THREE.Vector3) => void,
    collisionBoxes: CollisionBox[],
    camera?: THREE.Camera,
    gunshotFired: boolean = false,
    vehicles?: { entity: any; rig: any }[],
    isPlayerAiming: boolean = false
  ) {
    // ----------------------------------------------------
    // 1. UPDATE CRIMINALS / ENEMIES
    // ----------------------------------------------------
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const rig = this.enemyRigs[e.meshIndex];
      if (!rig) continue;

      if (e.state === 'dead' || e.state === 'arrested') {
        updateCharacterAnimation(rig, 0, time, false, false, e.state, camera, e.health / e.maxHealth);
        continue;
      }

      const dx = playerPos.x - e.position.x;
      const dz = playerPos.z - e.position.z;
      const distToPlayer = Math.hypot(dx, dz);

      // Faction-specific surrender & flee rules
      const isSyndicate = e.faction === 'eclipse_syndicate' || e.type === 'syndicate_operative';
      const isPython = e.faction === 'neon_pythons';
      const isViper = e.faction === 'iron_vipers';

      // 1. FLEE BEHAVIOR (e.g. agile Neon Pythons fleeing from police or low health)
      if (e.state === 'flee') {
        const fleeAngle = Math.atan2(e.position.x - playerPos.x, e.position.z - playerPos.z);
        e.rotation = fleeAngle;
        rig.root.rotation.y = fleeAngle;
        const fleeSpeed = isPython ? 4.4 : 3.8;
        const nextX = e.position.x + Math.sin(fleeAngle) * fleeSpeed * delta;
        const nextZ = e.position.z + Math.cos(fleeAngle) * fleeSpeed * delta;

        if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
          e.position.x = nextX;
          e.position.z = nextZ;
        } else {
          // Slide along wall/alley
          const slideX = e.position.x + Math.cos(fleeAngle) * fleeSpeed * delta;
          if (!this.checkCollision(slideX, e.position.z, collisionBoxes)) {
            e.position.x = slideX;
          }
        }

        rig.root.position.set(e.position.x, 0, e.position.z);
        updateCharacterAnimation(rig, fleeSpeed, time, false, false, undefined, camera, e.health / e.maxHealth);

        // If managed to escape far (> 42m), return to cautious patrol
        if (distToPlayer > 42) {
          e.state = 'patrol';
          e.alertLevel = 0;
        }
        continue;
      }

      // Check flee trigger for Neon Pythons (agile hit-and-run street gang)
      if (isPython && e.health <= e.maxHealth * 0.45 && distToPlayer < 24 && Math.random() < 0.8) {
        e.state = 'flee';
        this.onRadioCallout?.(`${e.name}: "Fall back to the alley! Don't let 'em box us in!"`, 'alert');
        continue;
      }

      // Check surrender condition:
      // - Eclipse Syndicate NEVER surrenders (extremist cell)
      // - Iron Vipers surrender only at <= 15% health (heavy discipline)
      // - Neon Pythons usually flee, surrender only if cornered (< 20%)
      // - Cobalt Skulls & street thugs surrender at <= 32% health
      const surrenderThreshold = isSyndicate ? 0 : isViper ? 0.15 : isPython ? 0.20 : 0.32;
      if (e.health <= e.maxHealth * surrenderThreshold && e.type !== 'boss' && e.state !== 'surrendered') {
        if (Math.random() < 0.85) {
          e.state = 'surrendered';
          updateCharacterAnimation(rig, 0, time, false, false, 'surrendered', camera, e.health / e.maxHealth);
          continue;
        }
      }

      if (e.state === 'surrendered') {
        updateCharacterAnimation(rig, 0, time, false, false, 'surrendered', camera, e.health / e.maxHealth);
        continue;
      }

      // Check for rival gang / hostile faction member nearby (Only during active combat or gang war)
      let rivalTarget: EnemyEntity | null = null;
      let rivalDist = 24;
      if (e.faction && (e.state === 'shoot' || e.alertLevel > 80)) {
        for (let j = 0; j < this.enemies.length; j++) {
          if (i === j) continue;
          const other = this.enemies[j];
          if (other.state === 'dead' || other.state === 'arrested' || other.state === 'surrendered') continue;
          if (other.faction && other.faction !== e.faction) {
            const rd = Math.hypot(other.position.x - e.position.x, other.position.z - e.position.z);
            if (rd < rivalDist) {
              rivalDist = rd;
              rivalTarget = other;
            }
          }
        }
      }

      // If rival gang member is targeted during active gang war:
      if (rivalTarget && (e.state === 'shoot' || e.alertLevel > 80)) {
        e.alertLevel = 100;
        e.state = 'shoot';
        const rdx = rivalTarget.position.x - e.position.x;
        const rdz = rivalTarget.position.z - e.position.z;
        const rAngle = Math.atan2(rdx, rdz);
        e.rotation = rAngle;
        rig.root.rotation.y = rAngle;

        e.shootCooldown -= delta;
        if (rivalDist < e.weapon.range && e.shootCooldown <= 0) {
          e.shootCooldown = 1.0 / e.weapon.fireRate + Math.random() * 0.45;
          rig.recoilTimer = 0.12;
          const targetPoint = new THREE.Vector3(rivalTarget.position.x, 1.2, rivalTarget.position.z);
          onEnemyShoot(e, targetPoint);
          rivalTarget.health = Math.max(0, rivalTarget.health - e.weapon.damage * 0.7);
          if (rivalTarget.health <= 0) {
            rivalTarget.state = 'dead';
          }
        }

        rig.root.position.set(e.position.x, 0, e.position.z);
        updateCharacterAnimation(rig, 1.1, time, true, false, undefined, camera, e.health / e.maxHealth);
        continue;
      }

      // Detection: alerted by gunshots nearby, close proximity, aiming, or combat alert
      const detectionRadius = 14;
      const heardGunshot = gunshotFired && distToPlayer < 28;
      const provokedByAim = isPlayerAiming && distToPlayer < 20;

      if (distToPlayer < detectionRadius || e.alertLevel > 50 || heardGunshot || provokedByAim) {
        e.alertLevel = 100;
        e.state = 'chase';

        // Face player or closest threat
        const targetAngle = Math.atan2(dx, dz);
        e.rotation = targetAngle;
        rig.root.rotation.y = targetAngle;

        e.shootCooldown -= delta;

        // Tactical cover logic
        let isCovering = false;
        if (e.health < e.maxHealth * 0.75 && e.type !== 'boss') {
          const nearestCover = this.findNearestCover(e.position);
          if (nearestCover) {
            const distToCover = Math.hypot(nearestCover.pos.x - e.position.x, nearestCover.pos.z - e.position.z);
            if (distToCover > 1.2) {
              const cAngle = Math.atan2(nearestCover.pos.x - e.position.x, nearestCover.pos.z - e.position.z);
              const moveSpeed = 3.6;
              const nextX = e.position.x + Math.sin(cAngle) * moveSpeed * delta;
              const nextZ = e.position.z + Math.cos(cAngle) * moveSpeed * delta;
              if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
                e.position.x = nextX;
                e.position.z = nextZ;
              }
            } else {
              isCovering = true;
            }
          }
        }

        // Shoot at player only if active and in range
        if (distToPlayer < e.weapon.range && e.health > 0) {
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 1.0 / e.weapon.fireRate + Math.random() * 0.35;
            onEnemyShoot(e, playerPos);
            rig.recoilTimer = 0.12;
          }
        }

        // Tactical movement tailored to faction identity
        let moveSpeed = 0;
        if (!isCovering) {
          // Desired engagement distance by faction
          let desiredDist = 12;
          if (e.faction === 'cobalt_skulls') desiredDist = 5.5; // Shotguns/brawlers close in
          else if (e.faction === 'neon_pythons') desiredDist = 8.5; // Agile mid-range SMG
          else if (e.faction === 'iron_vipers') desiredDist = 14.0; // Long-range rifle
          else if (isSyndicate) desiredDist = 16.0; // Stealth standoff
          else desiredDist = e.type === 'thug' ? 6.5 : 12;

          let forwardSpeed = 2.5;
          if (e.faction === 'neon_pythons') forwardSpeed = 4.2; // Blistering speed
          else if (e.faction === 'cobalt_skulls') forwardSpeed = 3.4;
          else if (e.faction === 'iron_vipers') forwardSpeed = 2.3;
          else if (isSyndicate) forwardSpeed = 2.8;

          if (distToPlayer > desiredDist + 1.5) {
            moveSpeed = forwardSpeed;
            const nextX = e.position.x + Math.sin(targetAngle) * moveSpeed * delta;
            const nextZ = e.position.z + Math.cos(targetAngle) * moveSpeed * delta;
            if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
              e.position.x = nextX;
              e.position.z = nextZ;
            }
          } else if (distToPlayer < desiredDist - 2 && e.type !== 'thug') {
            moveSpeed = 1.9;
            const nextX = e.position.x - Math.sin(targetAngle) * moveSpeed * delta;
            const nextZ = e.position.z - Math.cos(targetAngle) * moveSpeed * delta;
            if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
              e.position.x = nextX;
              e.position.z = nextZ;
            }
          }
        }

        rig.root.position.set(e.position.x, 0, e.position.z);
        updateCharacterAnimation(
          rig,
          moveSpeed,
          time,
          true,
          isCovering,
          undefined,
          camera,
          e.health / e.maxHealth
        );
      } else {
        // Peaceful patrol behavior: walks between patrol waypoints
        e.state = 'patrol';
        if (!e.target) {
          e.target = {
            x: e.position.x + (Math.random() - 0.5) * 20,
            y: 0,
            z: e.position.z + (Math.random() - 0.5) * 20,
          };
        }

        const tdx = e.target.x - e.position.x;
        const tdz = e.target.z - e.position.z;
        const tdist = Math.hypot(tdx, tdz);

        if (tdist < 1.5) {
          e.target = {
            x: e.position.x + (Math.random() - 0.5) * 24,
            y: 0,
            z: e.position.z + (Math.random() - 0.5) * 24,
          };
        } else {
          const pAngle = Math.atan2(tdx, tdz);
          e.rotation = pAngle;
          rig.root.rotation.y = pAngle;
          const patrolSpeed = 1.35;
          const nextX = e.position.x + Math.sin(pAngle) * patrolSpeed * delta;
          const nextZ = e.position.z + Math.cos(pAngle) * patrolSpeed * delta;

          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            e.position.x = nextX;
            e.position.z = nextZ;
          } else {
            e.target = { x: -e.position.x * 0.8, y: 0, z: -e.position.z * 0.8 };
          }

          rig.root.position.set(e.position.x, 0, e.position.z);
          updateCharacterAnimation(
            rig,
            patrolSpeed,
            time,
            false,
            false,
            undefined,
            camera,
            e.health / e.maxHealth
          );
        }
      }
    }

    // ----------------------------------------------------
    // 2. UPDATE POLICE NPC OFFICERS
    // ----------------------------------------------------
    for (let pIdx = 0; pIdx < this.policeNPCs.length; pIdx++) {
      const p = this.policeNPCs[pIdx];
      const rig = this.policeRigs[p.meshIndex];
      if (!rig) continue;

      if (p.health <= 0) {
        updateCharacterAnimation(rig, 0, time, false, false, 'dead', camera, 0);
        continue;
      }

      // Find closest active hostile enemy (excluding dead, arrested, and surrendered)
      let closestEnemy: EnemyEntity | null = null;
      let closestEnemyDist = 35;

      for (const e of this.enemies) {
        if (e.state === 'dead' || e.state === 'arrested' || e.state === 'surrendered') continue;
        const dist = Math.hypot(e.position.x - p.position.x, e.position.z - p.position.z);
        if (dist < closestEnemyDist) {
          closestEnemyDist = dist;
          closestEnemy = e;
        }
      }

      // Check if any surrendered suspect is nearby to cuff
      let surrenderedSuspect: EnemyEntity | null = null;
      for (const e of this.enemies) {
        if (e.state === 'surrendered') {
          const dist = Math.hypot(e.position.x - p.position.x, e.position.z - p.position.z);
          if (dist < 4.5) {
            surrenderedSuspect = e;
            break;
          }
        }
      }

      // Police officers engage if:
      // 1. Surrendered suspect is nearby to handcuff, OR
      // 2. Officer is a backup unit responding to Officer Carter and hostile is within 35m, OR
      // 3. Officer is assigned to an active incident and target hostile is within 35m, OR
      // 4. Enemy is actively shooting or in high-threat chase within 20m.
      const isAssigned = p.assignedIncidentId !== undefined;
      const isBackup = p.isBackupUnit === true;
      const isHostile = closestEnemy && (closestEnemy.state === 'shoot' || closestEnemy.state === 'chase' || closestEnemy.alertLevel > 70);
      const shouldEngage = surrenderedSuspect || (closestEnemy && (isBackup || isAssigned || (isHostile && closestEnemyDist < 20)));

      if (surrenderedSuspect) {
        // Approach and cuff surrendered suspect
        const sDist = Math.hypot(surrenderedSuspect.position.x - p.position.x, surrenderedSuspect.position.z - p.position.z);
        const sAngle = Math.atan2(surrenderedSuspect.position.x - p.position.x, surrenderedSuspect.position.z - p.position.z);
        p.rotation = sAngle;
        rig.root.rotation.y = sAngle;

        if (sDist > 1.8) {
          const cuffSpeed = 3.2;
          const nextX = p.position.x + Math.sin(sAngle) * cuffSpeed * delta;
          const nextZ = p.position.z + Math.cos(sAngle) * cuffSpeed * delta;
          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            p.position.x = nextX;
            p.position.z = nextZ;
          }
          rig.root.position.set(p.position.x, 0, p.position.z);
          updateCharacterAnimation(rig, cuffSpeed, time, true, false, undefined, camera, p.health / p.maxHealth, { weaponCategory: p.weapon.category });
        } else {
          // Apply handcuffs
          surrenderedSuspect.state = 'arrested';
          surrenderedSuspect.shootCooldown = 999999;
          surrenderedSuspect.alertLevel = 0;
          surrenderedSuspect.target = undefined;
          if (!p.isBackupUnit) {
            p.state = 'patrolling';
            p.assignedIncidentId = undefined;
            p.targetPos = {
              x: p.position.x + (Math.random() - 0.5) * 35,
              y: 0,
              z: p.position.z + (Math.random() - 0.5) * 35,
            };
          }
          this.onRadioCallout?.(`${p.name}: "10-95: Suspect ${surrenderedSuspect.name} secured in handcuffs!"`, 'success');
          this.onEnemyArrested?.(surrenderedSuspect);
          rig.root.position.set(p.position.x, 0, p.position.z);
          updateCharacterAnimation(rig, 0, time, false, false, undefined, camera, p.health / p.maxHealth, { weaponCategory: p.weapon.category });
        }
      } else if (shouldEngage && closestEnemy) {
        // Switch to responding / engaging
        p.state = 'engaging';
        const edx = closestEnemy.position.x - p.position.x;
        const edz = closestEnemy.position.z - p.position.z;
        const targetAngle = Math.atan2(edx, edz);
        p.rotation = targetAngle;
        rig.root.rotation.y = targetAngle;

        // Move to engage distance (approx 10-14m)
        let moveSpeed = 0;
        if (closestEnemyDist > 12) {
          moveSpeed = 4.2;
          const nextX = p.position.x + Math.sin(targetAngle) * moveSpeed * delta;
          const nextZ = p.position.z + Math.cos(targetAngle) * moveSpeed * delta;
          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            p.position.x = nextX;
            p.position.z = nextZ;
          }
        }

        // Fire service weapon at hostile criminal only if active and neither surrendered nor arrested
        p.shootCooldown -= delta;
        const canShoot = closestEnemy.state !== 'surrendered' && closestEnemy.state !== 'arrested' && closestEnemy.state !== 'dead';
        if (canShoot && closestEnemyDist < p.weapon.range && p.shootCooldown <= 0) {
          p.shootCooldown = 1.0 / p.weapon.fireRate + Math.random() * 0.3;
          rig.recoilTimer = 0.14;

          // Dispatch police shoot callback
          const targetPoint = new THREE.Vector3(closestEnemy.position.x, 1.2, closestEnemy.position.z);
          this.onPoliceShoot?.(p, targetPoint);

          // Apply damage to criminal
          closestEnemy.health = Math.max(0, closestEnemy.health - p.weapon.damage);
          if (closestEnemy.health <= 0) {
            closestEnemy.state = 'dead';
            this.onRadioCallout?.(`${p.name}: "Suspect neutralized! Sector secure."`, 'info');
          }
        }

        // Evacuate civilians caught in crossfire zone
        for (const civ of this.civilians) {
          const cDist = Math.hypot(civ.position.x - p.position.x, civ.position.z - p.position.z);
          if (cDist < 14 && civ.state !== 'panicking') {
            civ.state = 'panicking';
            civ.panicTimer = 8;
            civ.targetPos = {
              x: civ.position.x + (civ.position.x - closestEnemy.position.x) * 2,
              y: 0,
              z: civ.position.z + (civ.position.z - closestEnemy.position.z) * 2,
            };
          }
        }

        rig.root.position.set(p.position.x, 0, p.position.z);
        updateCharacterAnimation(rig, moveSpeed, time, true, false, undefined, camera, p.health / p.maxHealth, { weaponCategory: p.weapon.category });
      } else if (p.isBackupUnit) {
        // Backup officer follows Carter in tactical escort formation
        p.state = 'responding';
        const targetX = playerPos.x + (p.squadOffset?.x ?? -2.5);
        const targetZ = playerPos.z + (p.squadOffset?.z ?? -2.5);
        const fdx = targetX - p.position.x;
        const fdz = targetZ - p.position.z;
        const distToFormation = Math.hypot(fdx, fdz);

        if (distToFormation > 1.8) {
          const moveAngle = Math.atan2(fdx, fdz);
          p.rotation = moveAngle;
          rig.root.rotation.y = moveAngle;

          const followSpeed = distToFormation > 8 ? 6.5 : distToFormation > 3.5 ? 4.0 : 2.5;
          const nextX = p.position.x + Math.sin(moveAngle) * followSpeed * delta;
          const nextZ = p.position.z + Math.cos(moveAngle) * followSpeed * delta;

          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            p.position.x = nextX;
            p.position.z = nextZ;
          }

          rig.root.position.set(p.position.x, 0, p.position.z);
          updateCharacterAnimation(
            rig,
            followSpeed,
            time,
            false,
            false,
            undefined,
            camera,
            p.health / p.maxHealth,
            { weaponCategory: p.weapon.category }
          );
        } else {
          // Reached formation: hold position, face outward in alert guard stance
          const distToCarter = Math.hypot(playerPos.x - p.position.x, playerPos.z - p.position.z);
          if (distToCarter > 0.5) {
            p.rotation = Math.atan2(p.position.x - playerPos.x, p.position.z - playerPos.z);
            rig.root.rotation.y = p.rotation;
          }
          rig.root.position.set(p.position.x, 0, p.position.z);
          updateCharacterAnimation(
            rig,
            0,
            time,
            false,
            false,
            undefined,
            camera,
            p.health / p.maxHealth,
            { weaponCategory: p.weapon.category }
          );
        }
      } else {
        // Peaceful patrol on sidewalks
        p.state = 'patrolling';
        if (!p.targetPos) {
          p.targetPos = {
            x: p.position.x + (Math.random() - 0.5) * 25,
            y: 0,
            z: p.position.z + (Math.random() - 0.5) * 25,
          };
        }

        const tdx = p.targetPos.x - p.position.x;
        const tdz = p.targetPos.z - p.position.z;
        const tdist = Math.hypot(tdx, tdz);

        if (tdist < 2.0) {
          p.targetPos = {
            x: p.position.x + (Math.random() - 0.5) * 30,
            y: 0,
            z: p.position.z + (Math.random() - 0.5) * 30,
          };
        } else {
          const moveAngle = Math.atan2(tdx, tdz);
          p.rotation = moveAngle;
          rig.root.rotation.y = moveAngle;
          const patrolSpeed = 1.35;
          const nextX = p.position.x + Math.sin(moveAngle) * patrolSpeed * delta;
          const nextZ = p.position.z + Math.cos(moveAngle) * patrolSpeed * delta;

          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            p.position.x = nextX;
            p.position.z = nextZ;
          } else {
            p.targetPos = { x: -p.position.x, y: 0, z: -p.position.z };
          }

          rig.root.position.set(p.position.x, 0, p.position.z);
          updateCharacterAnimation(rig, patrolSpeed, time, false, false, undefined, camera, p.health / p.maxHealth);
        }
      }
    }

    // ----------------------------------------------------
    // 2B. UPDATE AEGIS MILITARY TASKFORCE SOLDIERS
    // ----------------------------------------------------
    for (let mIdx = 0; mIdx < this.militarySoldiers.length; mIdx++) {
      const m = this.militarySoldiers[mIdx];
      const rig = this.militaryRigs[m.meshIndex];
      if (!rig) continue;

      if (m.health <= 0) {
        updateCharacterAnimation(rig, 0, time, false, false, 'dead', camera, 0);
        continue;
      }

      // Find closest active hostile syndicate operative or violent criminal
      let targetEnemy: EnemyEntity | null = null;
      let targetDist = 48;

      for (const e of this.enemies) {
        if (e.state === 'dead' || e.state === 'arrested') continue;
        const dist = Math.hypot(e.position.x - m.position.x, e.position.z - m.position.z);
        if (dist < targetDist) {
          targetDist = dist;
          targetEnemy = e;
        }
      }

      if (targetEnemy) {
        m.state = 'suppressing';
        const mdx = targetEnemy.position.x - m.position.x;
        const mdz = targetEnemy.position.z - m.position.z;
        const tAngle = Math.atan2(mdx, mdz);
        m.rotation = tAngle;
        rig.root.rotation.y = tAngle;

        // Squad bounding advance
        let moveSpeed = 0;
        if (targetDist > 16) {
          moveSpeed = 3.8;
          const nextX = m.position.x + Math.sin(tAngle) * moveSpeed * delta;
          const nextZ = m.position.z + Math.cos(tAngle) * moveSpeed * delta;
          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            m.position.x = nextX;
            m.position.z = nextZ;
          }
        }

        // Heavy suppressive fire
        m.shootCooldown -= delta;
        if (targetDist < m.weapon.range && m.shootCooldown <= 0) {
          m.shootCooldown = 1.0 / m.weapon.fireRate + Math.random() * 0.3;
          rig.recoilTimer = 0.12;

          const targetPoint = new THREE.Vector3(targetEnemy.position.x, 1.2, targetEnemy.position.z);
          this.onMilitaryShoot?.(m, targetPoint);

          targetEnemy.health = Math.max(0, targetEnemy.health - m.weapon.damage);
          if (targetEnemy.health <= 0) {
            targetEnemy.state = 'dead';
            this.onRadioCallout?.(`[AEGIS-COMMS] ${m.callsign}: "Hostile neutralized. Area perimeter secure."`, 'info');
          }
        }

        rig.root.position.set(m.position.x, 0, m.position.z);
        updateCharacterAnimation(rig, moveSpeed, time, true, false, undefined, camera, m.health / m.maxHealth);
      } else {
        // Disciplined guard post pacing
        m.state = 'patrolling';
        rig.root.position.set(m.position.x, 0, m.position.z);
        updateCharacterAnimation(rig, 0, time, false, false, undefined, camera, m.health / m.maxHealth);
      }
    }

    // ----------------------------------------------------
    // 3. UPDATE CIVILIANS / PEDESTRIAN TRAFFIC
    // ----------------------------------------------------
    const anyShootingCriminal = this.enemies.some(
      (e) => (e.state === 'shoot' || (e.alertLevel > 70 && e.shootCooldown < 0.8)) && e.state !== 'dead' && e.state !== 'arrested'
    );

    for (let i = 0; i < this.civilians.length; i++) {
      const c = this.civilians[i];
      const rig = this.civilianRigs[c.meshIndex];
      if (!rig) continue;

      if (c.shoutCooldown && c.shoutCooldown > 0) {
        c.shoutCooldown -= delta;
      }

      // Check nearby peaceful police reassurance
      const nearPolice = this.policeNPCs.some((p) => {
        if (p.health <= 0 || p.state === 'engaging') return false;
        return Math.hypot(p.position.x - c.position.x, p.position.z - c.position.z) < 14;
      });

      // 1. VEHICLE REACTION: Dodge oncoming fast vehicles
      if (vehicles && vehicles.length > 0) {
        for (const v of vehicles) {
          const vSpeed = Math.abs(v.entity.speed || 0);
          if (vSpeed > 4.0) {
            const vdx = c.position.x - v.entity.position.x;
            const vdz = c.position.z - v.entity.position.z;
            const vdist = Math.hypot(vdx, vdz);

            const vDirX = Math.sin(v.entity.rotation);
            const vDirZ = Math.cos(v.entity.rotation);
            const dot = vdx * vDirX + vdz * vDirZ;

            if (vdist < 7.5 && dot > 0.8) {
              c.state = 'dodging';
              c.dodgeTimer = 1.0;
              const perpX = -vDirZ;
              const perpZ = vDirX;
              const sign = (vdx * perpX + vdz * perpZ) >= 0 ? 1 : -1;
              const dodgeX = c.position.x + perpX * sign * 3.4 * delta;
              const dodgeZ = c.position.z + perpZ * sign * 3.4 * delta;
              if (!this.checkCollision(dodgeX, dodgeZ, collisionBoxes)) {
                c.position.x = dodgeX;
                c.position.z = dodgeZ;
              }
              if (!c.shoutCooldown || c.shoutCooldown <= 0) {
                const shouts = ['Watch out!', 'Whoa, look out!', 'Hey! Sidewalk!'];
                const shout = shouts[Math.floor(Math.random() * shouts.length)];
                this.onPedestrianShout?.(c, shout);
                c.shoutCooldown = 4.5;
              }
              break;
            }
          }
        }
      }

      if (c.dodgeTimer && c.dodgeTimer > 0) {
        c.dodgeTimer -= delta;
        if (c.dodgeTimer <= 0) {
          c.state = 'walking';
        } else {
          rig.root.position.set(c.position.x, 0, c.position.z);
          updateCharacterAnimation(rig, 1.0, time, false, false, 'dodging', camera);
          continue;
        }
      }

      // 2. DANGER & GUNSHOT REACTION
      const distToPlayer = Math.hypot(playerPos.x - c.position.x, playerPos.z - c.position.z);

      let nearestHostileDist = 999;
      let nearestHostilePos: { x: number; z: number } | null = null;
      for (const e of this.enemies) {
        if (e.state === 'dead' || e.state === 'arrested') continue;
        if (e.alertLevel > 50 || e.state === 'chase' || e.state === 'shoot') {
          const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
          if (d < nearestHostileDist) {
            nearestHostileDist = d;
            nearestHostilePos = e.position;
          }
        }
      }

      const threatSource = (nearestHostileDist < distToPlayer && nearestHostilePos)
        ? nearestHostilePos
        : { x: playerPos.x, z: playerPos.z };
      const threatDist = Math.min(distToPlayer, nearestHostileDist);

      const dangerTriggered = (gunshotFired && threatDist < 46) || (anyShootingCriminal && threatDist < 35);

      if (dangerTriggered && c.state !== 'panicking' && c.state !== 'cowering') {
        const courage = c.courage !== undefined ? c.courage : 0.4;
        // Distant noise (> 20m) and courageous pedestrian: they stay calm and keep walking normally!
        if (threatDist > 20 && Math.random() < courage) {
          // Courageous pedestrian continues walking normally
          c.state = 'walking';
        } else {
          // Low courage or close danger: panic!
          c.state = Math.random() < 0.68 ? 'panicking' : 'cowering';
          c.panicTimer = 6.0 + Math.random() * 5.0;

          if (!c.shoutCooldown || c.shoutCooldown <= 0) {
            const panicShouts = ['Gunshots! Run!', 'Take cover!', 'Officer help!', 'Get down!'];
            const shout = panicShouts[Math.floor(Math.random() * panicShouts.length)];
            this.onPedestrianShout?.(c, shout);
            c.shoutCooldown = 5.0;
          }
        }
      }

      // Handle panic countdown & recovery
      if (c.panicTimer && c.panicTimer > 0) {
        // Police presence calms civilians 2.5x faster
        const decayRate = nearPolice ? 2.5 : 1.0;
        c.panicTimer -= delta * decayRate;
        if (c.panicTimer <= 0) {
          c.state = 'walking';
        }
      }

      // 3. REACTION TO PLAYER AIMING AT CIVILIAN
      if (isPlayerAiming && distToPlayer < 7.5 && c.state !== 'panicking' && c.state !== 'cowering') {
        const toPlayerAngle = Math.atan2(playerPos.x - c.position.x, playerPos.z - c.position.z);
        rig.root.rotation.y = toPlayerAngle;
        rig.root.position.set(c.position.x, 0, c.position.z);

        if (!c.shoutCooldown || c.shoutCooldown <= 0) {
          const aimShouts = ["Don't shoot, Officer!", "I'm just a civilian!", 'Hands up!'];
          const shout = aimShouts[Math.floor(Math.random() * aimShouts.length)];
          this.onPedestrianShout?.(c, shout);
          c.shoutCooldown = 4.0;
        }

        updateCharacterAnimation(rig, 0, time, false, false, 'surrendered', camera);
        continue;
      }

      // 4. BEHAVIOR STATE EXECUTION
      if (c.state === 'panicking') {
        // Sprint away from threat source
        const fleeAngle = Math.atan2(c.position.x - threatSource.x, c.position.z - threatSource.z);
        const fleeSpeed = c.archetype === 'jogger' ? 4.5 : 3.8;
        const nextX = c.position.x + Math.sin(fleeAngle) * fleeSpeed * delta;
        const nextZ = c.position.z + Math.cos(fleeAngle) * fleeSpeed * delta;

        if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
          c.position.x = nextX;
          c.position.z = nextZ;
        } else {
          // Slide along wall
          const slideX = c.position.x + Math.cos(fleeAngle) * fleeSpeed * delta;
          if (!this.checkCollision(slideX, c.position.z, collisionBoxes)) {
            c.position.x = slideX;
          }
        }

        rig.root.rotation.y = fleeAngle;
        rig.root.position.set(c.position.x, 0, c.position.z);
        updateCharacterAnimation(rig, fleeSpeed, time, false, false, 'panicking', camera);

      } else if (c.state === 'cowering') {
        rig.root.position.set(c.position.x, 0, c.position.z);
        updateCharacterAnimation(rig, 0, time, false, false, 'cowering', camera);

      } else if (c.state === 'idling') {
        // Idle pausing (browsing phone, waiting at bus shelter, window shopping)
        if (c.idleTimer && c.idleTimer > 0) {
          c.idleTimer -= delta;
          if (c.idleTimer <= 0) {
            c.state = 'walking';
          }
        } else {
          c.state = 'walking';
        }
        rig.root.position.set(c.position.x, 0, c.position.z);
        updateCharacterAnimation(rig, 0, time, false, false, 'idling', camera);

      } else {
        // 'walking' along assigned sidewalk route
        const route = (c.routeId && PEDESTRIAN_ROUTES[c.routeId]) ? PEDESTRIAN_ROUTES[c.routeId] : PEDESTRIAN_ROUTES.avenue_west;
        const wpIdx = c.currentWaypointIndex ?? 0;
        const wp = route.waypoints[wpIdx];

        if (wp) {
          c.targetPos = { x: wp.x, y: 0, z: wp.z };
        }

        const tdx = c.targetPos.x - c.position.x;
        const tdz = c.targetPos.z - c.position.z;
        const tdist = Math.hypot(tdx, tdz);

        if (tdist < 1.4) {
          // Arrived at current waypoint!
          if (wp && wp.waitDuration && wp.action !== 'none' && Math.random() < 0.6) {
            c.state = 'idling';
            c.idleTimer = wp.waitDuration + (Math.random() - 0.5) * 1.5;
          }

          // Advance to next waypoint
          const nextIdx = (wpIdx + 1) % route.waypoints.length;
          c.currentWaypointIndex = nextIdx;
          const nextWp = route.waypoints[nextIdx];
          c.targetPos = { x: nextWp.x, y: 0, z: nextWp.z };
        } else {
          const moveAngle = Math.atan2(tdx, tdz);
          c.rotation = moveAngle;
          rig.root.rotation.y = moveAngle;

          const walkSpeed = c.speed || 1.3;
          const nextX = c.position.x + Math.sin(moveAngle) * walkSpeed * delta;
          const nextZ = c.position.z + Math.cos(moveAngle) * walkSpeed * delta;

          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            c.position.x = nextX;
            c.position.z = nextZ;
          } else {
            // Collision avoidance: step around obstruction
            const perpAngle = moveAngle + Math.PI / 2;
            const altX = c.position.x + Math.sin(perpAngle) * walkSpeed * delta;
            const altZ = c.position.z + Math.cos(perpAngle) * walkSpeed * delta;
            if (!this.checkCollision(altX, altZ, collisionBoxes)) {
              c.position.x = altX;
              c.position.z = altZ;
            } else {
              // Advance to next waypoint if blocked
              c.currentWaypointIndex = (wpIdx + 1) % route.waypoints.length;
            }
          }

          rig.root.position.set(c.position.x, 0, c.position.z);
          updateCharacterAnimation(rig, walkSpeed, time, false, false, 'walking', camera);
        }
      }
    }
  }

  private findNearestCover(pos: { x: number; y: number; z: number }): CoverSpot | null {
    let nearest: CoverSpot | null = null;
    let minDst = 15.0;
    for (const spot of this.coverSpots) {
      const dst = Math.hypot(spot.pos.x - pos.x, spot.pos.z - pos.z);
      if (dst < minDst) {
        minDst = dst;
        nearest = spot;
      }
    }
    return nearest;
  }

  private checkCollision(x: number, z: number, boxes: CollisionBox[]): boolean {
    const radius = 0.6;
    for (const b of boxes) {
      if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
        return true;
      }
    }
    return false;
  }
}
