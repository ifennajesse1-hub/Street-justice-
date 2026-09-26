/**
 * Street Justice - 3D Mobile Action-Adventure Shooting Game
 * Officer Alex Carter · Precinct 9
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import { INITIAL_PLAYER_STATS, getRankForXP } from './game/systems/ProgressionSystem';
import { INITIAL_WEAPONS } from './game/systems/WeaponsData';
import { STORY_MISSIONS } from './game/systems/MissionSystem';
import {
  PlayerStats,
  WeaponConfig,
  Mission,
  InputState,
  TimeOfDay,
  WeatherType,
  CustomizationSettings,
  VehicleEntity,
  EnemyEntity,
  CivilianEntity,
  PoliceNPCEntity,
  EvidenceItem,
  DynamicEvent,
} from './types/game';
import { CRIME_CASES, INITIAL_EVIDENCE_ITEMS, CrimeCase } from './game/systems/InvestigationSystem';
import { generateRandomCityEvent } from './game/systems/DynamicEventsSystem';
import { soundEngine } from './game/audio/SoundEffects';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { PauseMenu } from './components/PauseMenu';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { GameStatusModal } from './components/GameStatusModal';
import { MainMenu } from './components/MainMenu';
import { InterrogationModal } from './components/InterrogationModal';
import { ForensicCameraOverlay } from './components/ForensicCameraOverlay';
import { StoryCutsceneModal } from './components/StoryCutsceneModal';
import { CrimeCasesModal } from './components/CrimeCasesModal';
import { CivilianDialogueModal } from './components/CivilianDialogueModal';
import { DynamicEventBanner } from './components/DynamicEventBanner';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Input state updated by touch and keyboard
  const inputState = useRef<InputState>({
    moveForward: 0,
    moveRight: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    fire: false,
    aim: false,
    sprint: false,
    crouch: false,
    jump: false,
    reload: false,
    interact: false,
    switchWeapon: false,
    toggleSiren: false,
    enterVehicle: false,
    handbrake: false,
  });

  // Game UI States
  const [stats, setStats] = useState<PlayerStats>(INITIAL_PLAYER_STATS);
  const [weapons, setWeapons] = useState<WeaponConfig[]>(INITIAL_WEAPONS);
  const [activeWeapon, setActiveWeapon] = useState<WeaponConfig>(INITIAL_WEAPONS[0]);
  const [missions, setMissions] = useState<Mission[]>(STORY_MISSIONS);
  const [currentMissionId, setCurrentMissionId] = useState<string>('ch1_first_patrol');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleEntity | undefined>(undefined);
  const [enemies, setEnemies] = useState<EnemyEntity[]>([]);

  // Investigation & Forensics
  const [cases, setCases] = useState<CrimeCase[]>(CRIME_CASES);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(INITIAL_EVIDENCE_ITEMS);

  // Dynamic 911 Calls
  const [activeDynamicEvent, setActiveDynamicEvent] = useState<DynamicEvent | null>(null);

  // Modals & Overlays
  const [isMainMenuOpen, setIsMainMenuOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [briefingOpen, setBriefingOpen] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'victory' | 'defeat' | null>(null);

  const [activeCutscene, setActiveCutscene] = useState<{ mission: Mission; type: 'intro' | 'outro' } | null>(null);
  const [interrogationSuspect, setInterrogationSuspect] = useState<EnemyEntity | null>(null);
  const [activeCivilian, setActiveCivilian] = useState<CivilianEntity | null>(null);
  const [civilians, setCivilians] = useState<CivilianEntity[]>([]);
  const [policeNPCs, setPoliceNPCs] = useState<PoliceNPCEntity[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCasesOpen, setIsCasesOpen] = useState<boolean>(false);

  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [playerYaw, setPlayerYaw] = useState<number>(0);

  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);

  const [customization, setCustomization] = useState<CustomizationSettings>({
    outfit: 'rookie_patrol',
    vehicleColor: '#ffffff',
    sirenType: 'classic',
  });
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [weather, setWeather] = useState<WeatherType>('clear');

  const [notifications, setNotifications] = useState<
    { text: string; type: 'info' | 'alert' | 'success'; id: string }[]
  >([
    {
      id: 'init_1',
      text: 'Dispatch: "Officer Carter, Sector 4 commercial district is active. Check your tactical radar."',
      type: 'info',
    },
  ]);

  const currentMission = missions.find((m) => m.id === currentMissionId);

  // Add notification helper
  const addNotification = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-3), { id, text, type }]);
    soundEngine.playRadioChime();
  };

  // Check objective distance to reach
  const checkReachObjectives = (pos: { x: number; y: number; z: number }) => {
    if (!currentMission) return;
    const reachObj = currentMission.objectives.find(
      (o) => !o.isCompleted && o.targetType === 'reach' && o.targetPos
    );
    if (reachObj && reachObj.targetPos) {
      const dist = Math.hypot(reachObj.targetPos.x - pos.x, reachObj.targetPos.z - pos.z);
      if (dist < 7.0) {
        if (currentMissionId === 'ch1_first_patrol' && engineRef.current && !engineRef.current.encounterTriggered) {
          engineRef.current.triggerAlleywayEncounter();
        } else {
          handleObjectiveProgress('reach', 1);
        }
      }
    }
  };

  // Handle Objective Progress
  const handleObjectiveProgress = (type: string, amount: number) => {
    setMissions((prevMissions) => {
      return prevMissions.map((m) => {
        if (m.id !== currentMissionId) return m;

        let anyUpdated = false;
        const newObjectives = m.objectives.map((obj) => {
          if (!obj.isCompleted && (obj.targetType === type || (type === 'arrest' && obj.targetType === 'kill'))) {
            const nextCount = obj.currentCount + amount;
            const completed = nextCount >= obj.requiredCount;
            anyUpdated = true;
            return {
              ...obj,
              currentCount: Math.min(obj.requiredCount, nextCount),
              isCompleted: completed,
            };
          }
          return obj;
        });

        const allCompleted = newObjectives.every((o) => o.isCompleted);
        if (allCompleted && !m.completed) {
          // Trigger Outro Story Cutscene with Moral Choice!
          setTimeout(() => {
            soundEngine.playRadioChime();
            setActiveCutscene({ mission: m, type: 'outro' });
          }, 400);

          return {
            ...m,
            objectives: newObjectives,
            completed: true,
          };
        }

        return anyUpdated ? { ...m, objectives: newObjectives } : m;
      });
    });
  };

  // Complete outro cutscene and open victory modal
  const handleOutroCutsceneCompleted = () => {
    setActiveCutscene(null);
    if (currentMission) {
      setGameStatus('victory');
      setStats((s) => {
        const newXP = s.xp + currentMission.rewardXP;
        const rankInfo = getRankForXP(newXP);
        return {
          ...s,
          xp: newXP,
          money: s.money + currentMission.rewardMoney,
          rank: rankInfo.rank,
          rankName: rankInfo.name,
          missionsCompleted: s.missionsCompleted + 1,
          reputation: Math.min(100, s.reputation + 5),
        };
      });
    }
  };

  // Moral choice made in cutscene
  const handleCutsceneChoiceMade = (choice: 'A' | 'B') => {
    if (!currentMission?.choice) return;
    if (choice === 'A') {
      // Option A effect
      setStats((s) => ({
        ...s,
        money: s.money + 1000,
        reputation: Math.max(0, s.reputation + currentMission.choice!.optionA.reputationBonus),
        iaViolations: s.iaViolations + 1,
      }));
      addNotification('Internal Affairs noted questionable conduct (-25 Rep, +$1,000)', 'alert');
    } else {
      // Option B effect
      setStats((s) => ({
        ...s,
        xp: s.xp + 300,
        reputation: Math.min(100, s.reputation + currentMission.choice!.optionB.reputationBonus),
      }));
      addNotification('Commendation for Lawful Integrity (+300 XP, +10 Rep)', 'success');
    }
  };

  // Order Surrender Command
  const handleOrderSurrender = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.orderSuspectsSurrender();
    }
  }, []);

  // Toggle Tactical Flashlight
  const handleToggleFlashlight = useCallback(() => {
    if (engineRef.current) {
      const active = engineRef.current.toggleFlashlight();
      setIsFlashlightOn(active);
    }
  }, []);

  // Interrogate & Frisk Suspect
  const handleOpenInterrogation = useCallback(() => {
    if (engineRef.current) {
      const suspect = engineRef.current.checkArrestedSuspectNearby();
      if (suspect) {
        setInterrogationSuspect(suspect);
      } else {
        addNotification('No arrested or surrendered suspect nearby to interrogate.', 'info');
      }
    }
  }, []);

  // Confiscate contraband
  const handleConfiscateContraband = (amount: number, itemTitle: string) => {
    setStats((prev) => ({ ...prev, money: prev.money + amount }));
    addNotification(`Confiscated ${itemTitle} +$${amount} street funds!`, 'success');
  };

  // Call Police Prisoner Transport
  const handleCallTransport = () => {
    setStats((prev) => ({
      ...prev,
      money: prev.money + 300,
      xp: prev.xp + 150,
      reputation: Math.min(100, prev.reputation + 5),
    }));
    addNotification('Squad Prisoner Transport arrived! Suspect booked at Precinct 9 (+ $300 Bounty, +5 Rep)', 'success');
    setTimeout(() => {
      setInterrogationSuspect(null);
    }, 1200);
  };

  // Intel discovered
  const handleIntelDiscovered = (intelText: string) => {
    addNotification(`Intel Uncovered: ${intelText}`, 'info');
    setStats((prev) => ({ ...prev, xp: prev.xp + 100 }));
  };

  // Question Witness
  const handleQuestionCivilian = useCallback(() => {
    if (engineRef.current) {
      const civ = engineRef.current.checkCivilianNearby();
      if (civ) {
        setActiveCivilian(civ);
      } else {
        addNotification('Walk closer to a civilian pedestrian to question them.', 'info');
      }
    }
  }, []);

  // Witness statement recorded
  const handleWitnessQuestionCompleted = (statement: string) => {
    setStats((prev) => ({ ...prev, xp: prev.xp + 75, civiliansRescued: prev.civiliansRescued + 1 }));
    addNotification('Witness statement recorded in police case dossier (+75 XP)', 'success');
  };

  // Take Forensic Camera Photo
  const handleTakePhoto = () => {
    if (!engineRef.current) return;
    const nearbyEv = engineRef.current.checkEvidenceNearby(evidenceList);
    if (nearbyEv) {
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === nearbyEv.id ? { ...e, photoTaken: true } : e))
      );
      setStats((prev) => ({ ...prev, xp: prev.xp + 150, money: prev.money + 100, evidenceFound: prev.evidenceFound + 1 }));
      addNotification(`Forensic Photograph Logged: ${nearbyEv.title}! (+150 XP, +$100)`, 'success');
    } else {
      setStats((prev) => ({ ...prev, xp: prev.xp + 50 }));
      addNotification('Crime Scene Surveillance Photo Logged (+50 XP)', 'info');
    }
  };

  // Solve Crime Case
  const handleSolveCase = (caseId: string) => {
    const c = cases.find((item) => item.id === caseId);
    if (!c || c.isSolved) return;

    setCases((prev) => prev.map((item) => (item.id === caseId ? { ...item, isSolved: true } : item)));
    setStats((prev) => {
      const newXP = prev.xp + c.rewardXP;
      const rankInfo = getRankForXP(newXP);
      return {
        ...prev,
        xp: newXP,
        money: prev.money + c.rewardMoney,
        rank: rankInfo.rank,
        rankName: rankInfo.name,
        reputation: Math.min(100, prev.reputation + 20),
      };
    });
    addNotification(`CASE SOLVED: ${c.title}! Grand Jury Indictments Issued (+ $${c.rewardMoney}, +20 Rep)!`, 'success');
  };

  // Dynamic 911 Events Periodic Dispatch
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeDynamicEvent && !briefingOpen && !isMenuOpen && !isMainMenuOpen) {
        const ev = generateRandomCityEvent();
        setActiveDynamicEvent(ev);
        soundEngine.playRadioChime();
      }
    }, 75000); // Trigger dynamic 911 calls periodically

    return () => clearInterval(interval);
  }, [activeDynamicEvent, briefingOpen, isMenuOpen, isMainMenuOpen]);

  // Respond to Dynamic Event
  const handleRespondDynamicEvent = (event: DynamicEvent) => {
    if (engineRef.current) {
      engineRef.current.waypointPos.set(event.position.x, 0, event.position.z);
      engineRef.current.waypointBeaconGroup.position.copy(engineRef.current.waypointPos);
      engineRef.current.isWaypointActive = true;
      soundEngine.playRadioChime();
      addNotification(`GPS Route Plotted to ${event.title}!`, 'alert');
    }
    setActiveDynamicEvent(null);
  };

  // Initialize Game Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, stats, weapons);
    engineRef.current = engine;

    // Connect callbacks
    engine.onStatsChanged = (newStats) => {
      setStats({ ...newStats });
      if (newStats.health <= 0) {
        setGameStatus('defeat');
      }
    };

    engine.onWeaponChanged = (newW) => {
      setActiveWeapon({ ...newW });
      setWeapons([...engine.weapons]);
    };

    engine.onNotification = (text, type) => {
      addNotification(text, type);
    };

    engine.onMissionObjectiveProgress = (type, amount) => {
      handleObjectiveProgress(type, amount);
    };

    // Main animation & input sync loop
    let animId: number;
    let frameCounter = 0;

    const loop = () => {
      if (engineRef.current) {
        engineRef.current.update(inputState.current);

        // Sync radar positions & states
        frameCounter++;
        if (frameCounter % 3 === 0) {
          setPlayerPos({
            x: engineRef.current.playerPos.x,
            y: engineRef.current.playerPos.y,
            z: engineRef.current.playerPos.z,
          });
          setPlayerYaw(engineRef.current.playerYaw);
          setIsAiming(engineRef.current.isAiming);
          setIsReloading(engineRef.current.isReloading);

          // Check if objective reached
          checkReachObjectives(engineRef.current.playerPos);

          // Sync current vehicle
          if (engineRef.current.currentVehicleIndex >= 0) {
            setCurrentVehicle(engineRef.current.vehicles[engineRef.current.currentVehicleIndex].entity);
          } else {
            setCurrentVehicle(undefined);
          }

          // Sync enemies, police NPCs & civilians for radar
          setEnemies([...engineRef.current.ai.enemies]);
          setCivilians([...engineRef.current.ai.civilians]);
          setPoliceNPCs([...engineRef.current.ai.policeNPCs]);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Desktop Keyboard and Mouse Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k === 'w') inputState.current.moveForward = 1;
      if (k === 's') inputState.current.moveForward = -1;
      if (k === 'a') inputState.current.moveRight = -1;
      if (k === 'd') inputState.current.moveRight = 1;

      if (k === 'shift') inputState.current.sprint = true;
      if (k === 'c') inputState.current.crouch = !inputState.current.crouch;
      if (k === ' ') inputState.current.handbrake = true;
      if (k === 'r') inputState.current.reload = true;
      if (k === 'h') inputState.current.toggleSiren = true;
      if (k === 'q') inputState.current.switchWeapon = true;

      // Special Police Controls
      if (k === 'f') handleToggleFlashlight();
      if (k === 'v') setIsCameraOpen((prev) => !prev);
      if (k === 'g') handleOrderSurrender();

      if (k === 'e') {
        // Smart Contextual Interaction:
        // 1. If near arrested/surrendered suspect -> Open Interrogation
        // 2. If near civilian -> Question witness
        // 3. If near vehicle -> Enter/Exit
        // 4. If near surrendered suspect -> Handcuff/Arrest
        if (engineRef.current) {
          const arrestedNearby = engineRef.current.checkArrestedSuspectNearby();
          if (arrestedNearby && arrestedNearby.state === 'arrested') {
            setInterrogationSuspect(arrestedNearby);
            return;
          }

          const civNearby = engineRef.current.checkCivilianNearby();
          if (civNearby) {
            setActiveCivilian(civNearby);
            return;
          }
        }
        inputState.current.enterVehicle = true;
        inputState.current.interact = true;
      }

      if (['1', '2', '3', '4', '5'].includes(k)) {
        const idx = parseInt(k) - 1;
        if (engineRef.current && engineRef.current.weapons[idx]?.unlocked) {
          engineRef.current.switchWeaponById(engineRef.current.weapons[idx].id);
        }
      }

      if (k === 'escape') {
        if (isCameraOpen) {
          setIsCameraOpen(false);
        } else if (isCasesOpen) {
          setIsCasesOpen(false);
        } else if (interrogationSuspect) {
          setInterrogationSuspect(null);
        } else if (activeCivilian) {
          setActiveCivilian(null);
        } else {
          setIsMenuOpen((prev) => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 's') inputState.current.moveForward = 0;
      if (k === 'a' || k === 'd') inputState.current.moveRight = 0;
      if (k === 'shift') inputState.current.sprint = false;
      if (k === ' ') inputState.current.handbrake = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) inputState.current.fire = true;
      if (e.button === 2) inputState.current.aim = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) inputState.current.fire = false;
      if (e.button === 2) inputState.current.aim = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current || e.buttons > 0) {
        inputState.current.lookDeltaX += e.movementX;
        inputState.current.lookDeltaY += e.movementY;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      engine.destroy();
    };
  }, [handleToggleFlashlight, handleOrderSurrender, isCameraOpen, isCasesOpen, interrogationSuspect, activeCivilian]);

  // Contextual check flags for touch controls
  const canEnterVehicle =
    engineRef.current && engineRef.current.currentVehicleIndex < 0
      ? engineRef.current.vehicles.some(
          (v) =>
            engineRef.current!.playerPos.distanceTo({
              x: v.entity.position.x,
              y: 0,
              z: v.entity.position.z,
            } as any) < 4.0
        )
      : false;

  const canArrest =
    engineRef.current &&
    engineRef.current.ai.enemies.some(
      (e) =>
        e.state === 'surrendered' &&
        engineRef.current!.playerPos.distanceTo({
          x: e.position.x,
          y: 0,
          z: e.position.z,
        } as any) < 3.5
    );

  const canInterrogate =
    engineRef.current &&
    engineRef.current.ai.enemies.some(
      (e) =>
        (e.state === 'arrested' || e.state === 'surrendered') &&
        engineRef.current!.playerPos.distanceTo({
          x: e.position.x,
          y: 0,
          z: e.position.z,
        } as any) < 3.5
    );

  const canQuestionCivilian =
    engineRef.current &&
    engineRef.current.ai.civilians.some(
      (civ) =>
        engineRef.current!.playerPos.distanceTo({
          x: civ.position.x,
          y: 0,
          z: civ.position.z,
        } as any) < 3.2
    );

  // Weapon Buy / Upgrade Handler
  const handleBuyOrUpgradeWeapon = (weaponId: string) => {
    if (!engineRef.current) return;

    const w = engineRef.current.weapons.find((item) => item.id === weaponId);
    if (!w) return;

    if (!w.unlocked) {
      if (stats.money >= w.price) {
        setStats((prev) => ({ ...prev, money: prev.money - w.price }));
        w.unlocked = true;
        setWeapons([...engineRef.current.weapons]);
        addNotification(`Requisitioned ${w.name}!`, 'success');
        engineRef.current.switchWeaponById(w.id);
      }
    } else {
      const upgradeCost = w.upgradeLevel * 400;
      if (stats.money >= upgradeCost) {
        setStats((prev) => ({ ...prev, money: prev.money - upgradeCost }));
        w.upgradeLevel++;
        w.damage = Math.round(w.damage * 1.25);
        w.fireRate = parseFloat((w.fireRate * 1.1).toFixed(1));
        setWeapons([...engineRef.current.weapons]);
        addNotification(`Upgraded ${w.name} to Mark ${w.upgradeLevel}!`, 'success');
      }
    }
  };

  // Armor or Health Upgrade
  const handleUpgradeArmorOrHealth = (type: 'armor' | 'health') => {
    if (!engineRef.current) return;

    if (type === 'armor' && stats.money >= 250) {
      setStats((prev) => ({
        ...prev,
        money: prev.money - 250,
        armor: Math.min(prev.maxArmor, prev.armor + 50),
      }));
      engineRef.current.stats.armor = Math.min(stats.maxArmor, stats.armor + 50);
      addNotification('Kevlar Armor Reinforced +50', 'success');
    } else if (type === 'health' && stats.money >= 150) {
      setStats((prev) => ({
        ...prev,
        money: prev.money - 150,
        health: prev.maxHealth,
      }));
      engineRef.current.stats.health = stats.maxHealth;
      addNotification('Field Trauma Medkit Applied · Health Restored', 'success');
    }
  };

  // Mission Selection
  const handleSelectMission = (missionId: string) => {
    setCurrentMissionId(missionId);
    const m = missions.find((item) => item.id === missionId);
    if (m && engineRef.current) {
      engineRef.current.spawnMissionEnemies();
      const reachObj = m.objectives.find((o) => o.targetPos);
      if (reachObj && reachObj.targetPos) {
        engineRef.current.waypointPos.set(reachObj.targetPos.x, 0, reachObj.targetPos.z);
        engineRef.current.waypointBeaconGroup.position.copy(engineRef.current.waypointPos);
        engineRef.current.isWaypointActive = true;
      }
      setBriefingOpen(true);
      addNotification(`Briefing: ${m.title}`, 'info');
    }
  };

  // Start Free Roam
  const handleStartFreeRoam = () => {
    setIsMainMenuOpen(false);
    setIsMenuOpen(false);
    addNotification('Free Roam Engaged: Patrol Metro City, investigate cases, or respond to 911 calls.', 'info');
  };

  // Start New Game Career
  const handleNewGame = () => {
    setStats(INITIAL_PLAYER_STATS);
    setMissions(STORY_MISSIONS);
    setCurrentMissionId('ch1_first_patrol');
    if (engineRef.current) {
      engineRef.current.stats = { ...INITIAL_PLAYER_STATS };
      engineRef.current.playerPos.copy(engineRef.current.cityData.spawnPoints.player);
      engineRef.current.playerRig.root.position.copy(engineRef.current.playerPos);
      engineRef.current.spawnMissionEnemies();
    }
    setIsMainMenuOpen(false);
    setBriefingOpen(true);
    addNotification('New Career Started: Officer Carter assigned to Precinct 9.', 'success');
  };

  // Respawn after defeat
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.stats.health = 100;
      engineRef.current.stats.armor = 50;
      engineRef.current.playerPos.copy(engineRef.current.cityData.spawnPoints.player);
      engineRef.current.playerRig.root.position.copy(engineRef.current.playerPos);
      engineRef.current.spawnMissionEnemies();
      setStats({ ...engineRef.current.stats });
      setGameStatus(null);
      addNotification('Officer Carter dispatched from Precinct 9.', 'info');
    }
  };

  // Next Mission after victory
  const handleContinueAfterVictory = () => {
    setGameStatus(null);
    const currentIdx = missions.findIndex((m) => m.id === currentMissionId);
    if (currentIdx < missions.length - 1) {
      const nextMission = missions[currentIdx + 1];
      setMissions((prev) =>
        prev.map((m) => (m.id === nextMission.id ? { ...m, unlocked: true } : m))
      );
      handleSelectMission(nextMission.id);
    } else {
      addNotification('All City Syndicates Dismantled! Free Roam unlocked.', 'success');
    }
  };

  // Mute audio
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Outfit change
  const handleChangeOutfit = (outfit: CustomizationSettings['outfit']) => {
    setCustomization((prev) => ({ ...prev, outfit }));
    if (engineRef.current) {
      addNotification(`Uniform changed to ${outfit}`, 'info');
    }
  };

  // Time of Day
  const handleChangeTimeOfDay = (time: TimeOfDay) => {
    setTimeOfDay(time);
    engineRef.current?.setTimeOfDay(time);
  };

  // Weather
  const handleChangeWeather = (w: WeatherType) => {
    setWeather(w);
    engineRef.current?.setWeather(w);
  };

  const nearbyEvidence = engineRef.current?.checkEvidenceNearby(evidenceList);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080b12] text-slate-100 select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={() => {
          soundEngine.startAmbientCity();
          soundEngine.toggleSiren(false);
        }}
        onTouchStart={() => {
          soundEngine.startAmbientCity();
        }}
      />

      {/* TACTICAL HUD */}
      <HUD
        stats={stats}
        currentWeapon={activeWeapon}
        currentMission={currentMission}
        currentVehicle={currentVehicle}
        playerPos={playerPos}
        playerYaw={playerYaw}
        enemies={enemies}
        civilians={civilians}
        policeNPCs={policeNPCs}
        notifications={notifications}
        isAiming={isAiming}
        isReloading={isReloading}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenMainMenu={() => setIsMainMenuOpen(true)}
        onOpenCases={() => setIsCasesOpen(true)}
        isFlashlightOn={isFlashlightOn}
        onToggleFlashlight={handleToggleFlashlight}
        onToggleCamera={() => setIsCameraOpen((prev) => !prev)}
      />

      {/* MOBILE TOUCH CONTROLS */}
      <TouchControls
        inputState={inputState}
        isInVehicle={!!currentVehicle}
        canEnterVehicle={canEnterVehicle}
        canArrest={!!canArrest}
        canInterrogate={!!canInterrogate}
        canQuestionCivilian={!!canQuestionCivilian}
        isAiming={isAiming}
        isFlashlightOn={isFlashlightOn}
        onOrderSurrender={handleOrderSurrender}
        onOpenInterrogation={handleOpenInterrogation}
        onQuestionCivilian={handleQuestionCivilian}
        onToggleCamera={() => setIsCameraOpen((prev) => !prev)}
        onToggleFlashlight={handleToggleFlashlight}
      />

      {/* DYNAMIC 911 CALL BANNER */}
      <DynamicEventBanner
        event={activeDynamicEvent}
        onRespond={handleRespondDynamicEvent}
        onDismiss={() => setActiveDynamicEvent(null)}
      />

      {/* FORENSIC CAMERA OVERLAY */}
      <ForensicCameraOverlay
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onTakePhoto={handleTakePhoto}
        targetEvidenceTitle={nearbyEvidence?.title}
        isNearEvidence={!!nearbyEvidence}
      />

      {/* SUSPECT INTERROGATION & FRISK MODAL */}
      <InterrogationModal
        suspect={interrogationSuspect}
        isOpen={!!interrogationSuspect}
        onClose={() => setInterrogationSuspect(null)}
        onConfiscateContraband={handleConfiscateContraband}
        onCallTransport={handleCallTransport}
        onIntelDiscovered={handleIntelDiscovered}
      />

      {/* CIVILIAN WITNESS DIALOGUE MODAL */}
      <CivilianDialogueModal
        civilian={activeCivilian}
        isOpen={!!activeCivilian}
        onClose={() => setActiveCivilian(null)}
        onQuestionCompleted={handleWitnessQuestionCompleted}
      />

      {/* CASE FILES & INVESTIGATION DOSSIER */}
      <CrimeCasesModal
        isOpen={isCasesOpen}
        onClose={() => setIsCasesOpen(false)}
        cases={cases}
        evidenceList={evidenceList}
        onSolveCase={handleSolveCase}
      />

      {/* STORY CUTSCENE & MORAL CHOICE MODAL */}
      {activeCutscene && (
        <StoryCutsceneModal
          isOpen={!!activeCutscene}
          mission={activeCutscene.mission}
          type={activeCutscene.type}
          onComplete={handleOutroCutsceneCompleted}
          onChoiceMade={handleCutsceneChoiceMade}
        />
      )}

      {/* MISSION BRIEFING MODAL */}
      {currentMission && (
        <MissionBriefingModal
          mission={currentMission}
          isOpen={briefingOpen && !isMainMenuOpen && !activeCutscene}
          onStart={() => setBriefingOpen(false)}
        />
      )}

      {/* PAUSE & DOSSIER MENU */}
      <PauseMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        missions={missions}
        currentMissionId={currentMissionId}
        onSelectMission={handleSelectMission}
        weapons={weapons}
        stats={stats}
        onBuyOrUpgradeWeapon={handleBuyOrUpgradeWeapon}
        onUpgradeArmorOrHealth={handleUpgradeArmorOrHealth}
        customization={customization}
        onChangeOutfit={handleChangeOutfit}
        timeOfDay={timeOfDay}
        weather={weather}
        onChangeTimeOfDay={handleChangeTimeOfDay}
        onChangeWeather={handleChangeWeather}
        cases={cases}
        evidenceList={evidenceList}
        onSolveCase={handleSolveCase}
      />

      {/* MAIN MENU */}
      <MainMenu
        isOpen={isMainMenuOpen}
        onContinue={() => setIsMainMenuOpen(false)}
        onNewGame={handleNewGame}
        onSelectMission={(mId) => {
          handleSelectMission(mId);
          setIsMainMenuOpen(false);
        }}
        onStartFreeRoam={handleStartFreeRoam}
        onOpenArmory={() => {
          setIsMainMenuOpen(false);
          setIsMenuOpen(true);
        }}
        onOpenProfile={() => {
          setIsMainMenuOpen(false);
          setIsMenuOpen(true);
        }}
        onOpenCases={() => {
          setIsMainMenuOpen(false);
          setIsCasesOpen(true);
        }}
        missions={missions}
        stats={stats}
        weapons={weapons}
        timeOfDay={timeOfDay}
        weather={weather}
        onChangeTimeOfDay={handleChangeTimeOfDay}
        onChangeWeather={handleChangeWeather}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* VICTORY & DEFEAT MODAL */}
      <GameStatusModal
        status={gameStatus}
        mission={currentMission}
        stats={stats}
        onRestart={handleRestart}
        onContinue={handleContinueAfterVictory}
      />
    </div>
  );
}
