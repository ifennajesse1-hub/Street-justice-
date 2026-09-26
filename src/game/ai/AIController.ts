import * as THREE from 'three';
import { EnemyEntity, CivilianEntity, EnemyType, PoliceNPCEntity } from '../../types/game';
import { CharacterRig, updateCharacterAnimation } from '../engine/CharacterModels';
import { CollisionBox } from '../engine/CityGenerator';
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

  // Tactical cover locations in the city
  public coverSpots: CoverSpot[] = [
    { pos: new THREE.Vector3(-28.2, 0, -22.5), peekOffset: new THREE.Vector3(1.2, 0, 0) }, // Dumpster 1
    { pos: new THREE.Vector3(-27.8, 0, -30.5), peekOffset: new THREE.Vector3(-1.2, 0, 0) }, // Dumpster 2
    { pos: new THREE.Vector3(-26.0, 0, -22.0), peekOffset: new THREE.Vector3(0, 0, 1.2) },  // Crate stack
    { pos: new THREE.Vector3(-30.0, 0, -34.0), peekOffset: new THREE.Vector3(0.8, 0, 0) },  // Deep crates
    { pos: new THREE.Vector3(-7.5, 0, 31.0), peekOffset: new THREE.Vector3(0, 0, -1.2) },   // Police car curb
    { pos: new THREE.Vector3(-9.5, 0, -18), peekOffset: new THREE.Vector3(1.0, 0, 0) }, // Streetlight base
  ];

  // Callbacks for police radio, gunfire, and civilian speech bubbles
  public onPoliceShoot?: (police: PoliceNPCEntity, targetPos: THREE.Vector3) => void;
  public onRadioCallout?: (callout: string, type: 'info' | 'alert' | 'success') => void;
  public onPedestrianShout?: (civ: CivilianEntity, text: string) => void;

  constructor() {}

  public spawnEnemy(
    type: EnemyType,
    pos: THREE.Vector3,
    meshRig: CharacterRig,
    customName?: string
  ): EnemyEntity {
    const isBoss = type === 'boss';
    const isEnforcer = type === 'enforcer';

    const health = isBoss ? 350 : isEnforcer ? 130 : 80;
    const defaultName = customName || (isBoss ? 'Viper Vance' : isEnforcer ? 'Syndicate Enforcer' : 'Street Thug');

    const enemy: EnemyEntity = {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      name: defaultName,
      position: { x: pos.x, y: 0, z: pos.z },
      rotation: Math.random() * Math.PI * 2,
      health,
      maxHealth: health,
      state: 'patrol',
      weapon: {
        id: isBoss ? 'titan_ar' : isEnforcer ? 'specter45' : 'vortex9',
        name: isBoss ? 'Titan-AR' : isEnforcer ? 'Specter-45' : 'Vortex-9',
        category: isBoss ? 'rifle' : isEnforcer ? 'smg' : 'handgun',
        damage: isBoss ? 20 : isEnforcer ? 14 : 10,
        fireRate: isBoss ? 4.5 : isEnforcer ? 6.5 : 2.2,
        magazineSize: 30,
        currentAmmo: 30,
        reserveAmmo: 999,
        reloadTime: 1.8,
        range: 42,
        spread: 0.08,
        isAutomatic: isBoss || isEnforcer,
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
    badgeNumber?: string
  ): PoliceNPCEntity {
    const defaultName = name || ['Officer Miller', 'Officer Hayes', 'Officer Kowalski', 'Officer Davis'][this.policeNPCs.length % 4];
    const defaultBadge = badgeNumber || `${200 + this.policeNPCs.length * 14}`;

    const police: PoliceNPCEntity = {
      id: `police_npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      badgeNumber: defaultBadge,
      position: { x: pos.x, y: 0, z: pos.z },
      rotation: Math.PI,
      health: 150,
      maxHealth: 150,
      state: 'patrolling',
      weapon: {
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
      },
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

      // Check surrender condition: If health <= 32% and player is nearby
      if (e.health <= e.maxHealth * 0.32 && e.type !== 'boss' && e.state !== 'surrendered') {
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

      // Detection: alerted by gunshots, close proximity, or line-of-sight
      const detectionRadius = 32;
      const heardGunshot = gunshotFired && distToPlayer < 50;

      if (distToPlayer < detectionRadius || e.alertLevel > 0 || heardGunshot) {
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

        // Shoot at player
        if (distToPlayer < e.weapon.range) {
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 1.0 / e.weapon.fireRate + Math.random() * 0.35;
            onEnemyShoot(e, playerPos);
            rig.recoilTimer = 0.12;
          }
        }

        // Tactical movement
        let moveSpeed = 0;
        if (!isCovering) {
          const desiredDist = e.type === 'thug' ? 6.5 : 12;

          if (distToPlayer > desiredDist + 1.5) {
            moveSpeed = e.type === 'thug' ? 3.4 : 2.5;
            const nextX = e.position.x + Math.sin(targetAngle) * moveSpeed * delta;
            const nextZ = e.position.z + Math.cos(targetAngle) * moveSpeed * delta;
            if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
              e.position.x = nextX;
              e.position.z = nextZ;
            }
          } else if (distToPlayer < desiredDist - 2 && e.type !== 'thug') {
            moveSpeed = 1.8;
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
    const anyActiveCriminal = this.enemies.some(
      (e) => (e.alertLevel > 50 || e.state === 'chase' || e.state === 'shoot') && e.state !== 'dead' && e.state !== 'arrested'
    );

    for (let pIdx = 0; pIdx < this.policeNPCs.length; pIdx++) {
      const p = this.policeNPCs[pIdx];
      const rig = this.policeRigs[p.meshIndex];
      if (!rig) continue;

      if (p.health <= 0) {
        updateCharacterAnimation(rig, 0, time, false, false, 'dead', camera, 0);
        continue;
      }

      // Find closest active hostile enemy
      let closestEnemy: EnemyEntity | null = null;
      let closestEnemyDist = 45;

      for (const e of this.enemies) {
        if (e.state === 'dead' || e.state === 'arrested') continue;
        const dist = Math.hypot(e.position.x - p.position.x, e.position.z - p.position.z);
        if (dist < closestEnemyDist) {
          closestEnemyDist = dist;
          closestEnemy = e;
        }
      }

      if (closestEnemy && (anyActiveCriminal || closestEnemyDist < 30 || gunshotFired)) {
        // Switch to responding / engaging
        p.state = 'engaging';
        const edx = closestEnemy.position.x - p.position.x;
        const edz = closestEnemy.position.z - p.position.z;
        const targetAngle = Math.atan2(edx, edz);
        p.rotation = targetAngle;
        rig.root.rotation.y = targetAngle;

        // Move to engage distance (approx 12-14m)
        let moveSpeed = 0;
        if (closestEnemyDist > 14) {
          moveSpeed = 4.2;
          const nextX = p.position.x + Math.sin(targetAngle) * moveSpeed * delta;
          const nextZ = p.position.z + Math.cos(targetAngle) * moveSpeed * delta;
          if (!this.checkCollision(nextX, nextZ, collisionBoxes)) {
            p.position.x = nextX;
            p.position.z = nextZ;
          }
        }

        // Fire service weapon at hostile criminal
        p.shootCooldown -= delta;
        if (closestEnemyDist < p.weapon.range && p.shootCooldown <= 0) {
          p.shootCooldown = 1.0 / p.weapon.fireRate + Math.random() * 0.4;
          rig.recoilTimer = 0.12;

          // Dispatch police shoot callback
          const targetPoint = new THREE.Vector3(closestEnemy.position.x, 1.2, closestEnemy.position.z);
          this.onPoliceShoot?.(p, targetPoint);

          // Apply damage to criminal
          if (closestEnemy.state !== 'surrendered') {
            closestEnemy.health = Math.max(0, closestEnemy.health - p.weapon.damage);
            if (closestEnemy.health <= 0) {
              closestEnemy.state = 'dead';
              this.onRadioCallout?.(`${p.name}: "Suspect neutralized! Sector secure."`, 'info');
            }
          }
        }

        rig.root.position.set(p.position.x, 0, p.position.z);
        updateCharacterAnimation(rig, moveSpeed, time, true, false, undefined, camera, p.health / p.maxHealth);
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
