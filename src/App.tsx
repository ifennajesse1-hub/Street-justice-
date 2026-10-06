/**
 * Street Justice - 3D Mobile Action-Adventure Shooting Game
 * Officer Alex Carter · Precinct 9
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCw } from 'lucide-react';
import { GameEngine } from './game/engine/GameEngine';
import { INITIAL_PLAYER_STATS, getRankForXP } from './game/systems/ProgressionSystem';
import { INITIAL_WEAPONS } from './game/systems/WeaponsData';
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
  MilitaryNPCEntity,
  EvidenceItem,
  DynamicEvent,
} from './types/game';
import { CRIME_CASES, INITIAL_EVIDENCE_ITEMS, CrimeCase } from './game/systems/InvestigationSystem';
import { generateRandomCityEvent, cityIncidentManager } from './game/systems/DynamicEventsSystem';
import { STORY_MISSIONS, generateRandomPoliceMission } from './game/systems/MissionSystem';
import { authoritativeEncounterManager } from './game/systems/EncounterManager';
import { soundEngine } from './game/audio/SoundEffects';
import { auth, loginWithGoogle, logoutUser, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  fetchPlayerProfile,
  createPlayerProfile,
  updatePlayerProfile,
} from './game/systems/PlayerFirestoreService';
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
  const [activeIncidentObjective, setActiveIncidentObjective] = useState<DynamicEvent | null>(null);

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
  const [militarySoldiers, setMilitarySoldiers] = useState<MilitaryNPCEntity[]>([]);
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
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [weather, setWeather] = useState<WeatherType>('clear');

  // Firebase Auth & Cloud Firestore State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isLoadedRef = useRef<boolean>(false);

  // Landscape Orientation State for Mobile Full-Screen Layout
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth && window.innerWidth < 900;
    }
    return false;
  });

  const [notifications, setNotifications] = useState<
    { text: string; type: 'info' | 'alert' | 'success'; id: string }[]
  >([]);

  const currentMission = missions.find((m) => m.id === currentMissionId);

  // Add temporary dialogue/comms notification (auto-dismisses after 3.5s so it never clutters screen)
  const addNotification = useCallback((text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    setNotifications([{ id, text, type }]);
    soundEngine.playRadioChime();
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  // Request Landscape Fullscreen
  const handleToggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        if (window.screen?.orientation && 'lock' in window.screen.orientation) {
          (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {}
  }, []);

  // Window resize & orientation tracking
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;
      setIsPortrait(portrait);
      if (engineRef.current && containerRef.current) {
        engineRef.current.handleResize();
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Persist player progress to Cloud Firestore & LocalStorage
  const persistProgressToCloud = useCallback(
    async (
      customStats?: PlayerStats,
      customWeapons?: WeaponConfig[],
      customMissions?: Mission[],
      customCases?: CrimeCase[],
      customSettings?: CustomizationSettings
    ) => {
      const curStats = customStats || stats;
      const curWeapons = customWeapons || weapons;
      const curMissions = customMissions || missions;
      const curCases = customCases || cases;
      const curCustomization = customSettings || customization;

      // Always save locally so guest officers keep their career progress
      try {
        localStorage.setItem(
          'street_justice_local_profile',
          JSON.stringify({
            stats: curStats,
            weapons: curWeapons,
            missions: curMissions,
            cases: curCases,
            customization: curCustomization,
            savedAt: new Date().toISOString(),
          })
        );
        setLastSavedAt(new Date());
      } catch (err) {
        // Storage unavailable or quota limit
      }

      const user = auth.currentUser;
      if (!user) {
        setCloudSyncStatus('offline');
        return;
      }

      setCloudSyncStatus('saving');
      try {
        await updatePlayerProfile(
          user.uid,
          curStats,
          curWeapons,
          curMissions,
          curCases,
          curCustomization
        );
        setCloudSyncStatus('synced');
        setLastSavedAt(new Date());
      } catch (err) {
        console.error('Failed to sync progress to Cloud Firestore:', err);
        setCloudSyncStatus('offline');
      }
    },
    [stats, weapons, missions, cases, customization]
  );

  // Initialize Firebase Auth listener and Cloud Firestore load
  useEffect(() => {
    testConnection();

    // Restore locally saved profile if available
    try {
      const savedLocal = localStorage.getItem('street_justice_local_profile');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed.stats) {
          setStats((prev) => ({ ...prev, ...parsed.stats }));
          if (engineRef.current) {
            engineRef.current.stats = { ...engineRef.current.stats, ...parsed.stats };
          }
        }
        if (parsed.weapons) {
          setWeapons(parsed.weapons);
          if (engineRef.current) engineRef.current.weapons = parsed.weapons;
        }
        if (parsed.missions) setMissions(parsed.missions);
        if (parsed.cases) setCases(parsed.cases);
        if (parsed.customization) setCustomization(parsed.customization);
        if (parsed.savedAt) setLastSavedAt(new Date(parsed.savedAt));
      }
    } catch (e) {
      // Local storage read error
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        setCloudSyncStatus('offline');
        isLoadedRef.current = true;
        return;
      }

      setAuthUser(user);
      setCloudSyncStatus('saving');

      try {
        const cloudProfile = await fetchPlayerProfile(user.uid);
        if (cloudProfile) {
          // Restore stats
          setStats((prev) => {
            const newStats: PlayerStats = {
              ...prev,
              money: cloudProfile.money ?? prev.money,
              xp: cloudProfile.xp ?? prev.xp,
              rank: cloudProfile.rank ?? prev.rank,
              rankName: cloudProfile.rankName ?? prev.rankName,
              reputation: cloudProfile.reputation ?? prev.reputation,
              kills: cloudProfile.kills ?? prev.kills,
              arrests: cloudProfile.arrests ?? prev.arrests,
              missionsCompleted: cloudProfile.missionsCompleted ?? prev.missionsCompleted,
              civiliansRescued: cloudProfile.civiliansRescued ?? prev.civiliansRescued,
              evidenceFound: cloudProfile.evidenceFound ?? prev.evidenceFound,
              iaViolations: cloudProfile.iaViolations ?? prev.iaViolations,
            };
            if (engineRef.current) {
              engineRef.current.stats = { ...newStats };
            }
            return newStats;
          });

          // Restore unlocked weapons & upgrade marks
          if (cloudProfile.unlockedWeapons?.length) {
            setWeapons((prev) => {
              const updated = prev.map((w) => {
                const isUnlocked = cloudProfile.unlockedWeapons.includes(w.id);
                const upgradeLvl = cloudProfile.weaponUpgradeLevels?.[w.id] ?? w.upgradeLevel;
                let dmg = w.damage;
                let fr = w.fireRate;
                if (upgradeLvl > 1) {
                  for (let i = 1; i < upgradeLvl; i++) {
                    dmg = Math.round(dmg * 1.25);
                    fr = parseFloat((fr * 1.1).toFixed(1));
                  }
                }
                return {
                  ...w,
                  unlocked: isUnlocked,
                  upgradeLevel: upgradeLvl,
                  damage: dmg,
                  fireRate: fr,
                };
              });
              if (engineRef.current) {
                engineRef.current.weapons = updated;
              }
              return updated;
            });
          }

          // Restore completed missions
          if (cloudProfile.completedMissions?.length) {
            setMissions((prev) => {
              return prev.map((m, idx) => {
                const isCompleted = cloudProfile.completedMissions.includes(m.id);
                const prevCompleted = idx > 0 ? cloudProfile.completedMissions.includes(prev[idx - 1].id) : true;
                return {
                  ...m,
                  completed: isCompleted,
                  unlocked: isCompleted || prevCompleted,
                };
              });
            });
          }

          // Restore solved cases
          if (cloudProfile.solvedCases?.length) {
            setCases((prev) =>
              prev.map((c) => ({
                ...c,
                isSolved: cloudProfile.solvedCases.includes(c.id),
              }))
            );
          }

          // Restore customization
          if (cloudProfile.outfit || cloudProfile.vehicleColor || cloudProfile.sirenType) {
            setCustomization((prev) => ({
              ...prev,
              outfit: (cloudProfile.outfit as any) || prev.outfit,
              vehicleColor: cloudProfile.vehicleColor || prev.vehicleColor,
              sirenType: (cloudProfile.sirenType as any) || prev.sirenType,
            }));
          }

          setCloudSyncStatus('synced');
          setLastSavedAt(new Date());
          addNotification(
            `Cloud Profile Loaded: Officer Alex Carter (Rank ${cloudProfile.rank})`,
            'success'
          );
        } else {
          // Create new player profile on Cloud Firestore
          await createPlayerProfile(
            user.uid,
            INITIAL_PLAYER_STATS,
            INITIAL_WEAPONS,
            STORY_MISSIONS,
            CRIME_CASES,
            { outfit: 'rookie_patrol', vehicleColor: '#ffffff', sirenType: 'classic' }
          );
          setCloudSyncStatus('synced');
          setLastSavedAt(new Date());
          addNotification('New Officer Profile Created on Cloud Firestore!', 'success');
        }
      } catch (err) {
        console.error('Failed to load player progress from Cloud Firestore:', err);
        setCloudSyncStatus('offline');
      } finally {
        isLoadedRef.current = true;
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodic background Cloud sync (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isLoadedRef.current && auth.currentUser) {
        persistProgressToCloud();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [persistProgressToCloud]);

  // Google Login / Logout / Manual Save handlers
  const handleLoginWithGoogle = async () => {
    try {
      setCloudSyncStatus('saving');
      const user = await loginWithGoogle();
      addNotification(`Signed in with Google as ${user.displayName || user.email}!`, 'success');
    } catch (err) {
      console.error('Google Sign-In error:', err);
      addNotification('Google Sign-In canceled or interrupted.', 'alert');
      setCloudSyncStatus('synced');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      setCloudSyncStatus('offline');
      addNotification('Signed out of Google account. Local profile active.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleManualSave = async () => {
    addNotification('Syncing Street Justice progress to Cloud Firestore...', 'info');
    await persistProgressToCloud();
    addNotification('Cloud Firestore: Officer Progress Saved Successfully!', 'success');
  };

  // Check objective distance to reach
  const checkReachObjectives = (pos: { x: number; y: number; z: number }) => {
    if (!currentMission || currentMission.completed) return;
    const reachObj = currentMission.objectives.find(
      (o) => !o.isCompleted && o.targetType === 'reach' && o.targetPos
    );
    if (reachObj && reachObj.targetPos) {
      const dist = Math.hypot(reachObj.targetPos.x - pos.x, reachObj.targetPos.z - pos.z);
      if (dist < 14.0) {
        if (engineRef.current && authoritativeEncounterManager.canStartMissionEncounter(currentMission.id)) {
          engineRef.current.triggerMissionEncounter(currentMission);
        } else if (!reachObj.isCompleted) {
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
          // Authoritatively mark encounter completed so it never restarts automatically
          authoritativeEncounterManager.completeEncounter(`mission_enc_${m.id}`);

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
      const newXP = stats.xp + currentMission.rewardXP;
      const rankInfo = getRankForXP(newXP);
      const nextStats: PlayerStats = {
        ...stats,
        xp: newXP,
        money: stats.money + currentMission.rewardMoney,
        rank: rankInfo.rank,
        rankName: rankInfo.name,
        missionsCompleted: stats.missionsCompleted + 1,
        reputation: Math.min(100, stats.reputation + 5),
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
    }
  };

  // Moral choice made in cutscene
  const handleCutsceneChoiceMade = (choice: 'A' | 'B') => {
    if (!currentMission?.choice) return;
    if (choice === 'A') {
      // Option A effect
      const nextStats = {
        ...stats,
        money: stats.money + 1000,
        reputation: Math.max(0, stats.reputation + currentMission.choice!.optionA.reputationBonus),
        iaViolations: stats.iaViolations + 1,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      addNotification('Internal Affairs noted questionable conduct (-25 Rep, +$1,000)', 'alert');
    } else {
      // Option B effect
      const nextStats = {
        ...stats,
        xp: stats.xp + 300,
        reputation: Math.min(100, stats.reputation + currentMission.choice!.optionB.reputationBonus),
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      addNotification('Commendation for Lawful Integrity (+300 XP, +10 Rep)', 'success');
    }
  };

  // Order Surrender Command
  const handleOrderSurrender = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.orderSuspectsSurrender();
    }
  }, []);

  // Police Backup Command
  const handleCallBackup = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.callPoliceBackup();
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
    const nextStats = { ...stats, money: stats.money + amount };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Confiscated ${itemTitle} +$${amount} street funds!`, 'success');
  };

  // Call Police Prisoner Transport
  const handleCallTransport = () => {
    const nextStats = {
      ...stats,
      money: stats.money + 300,
      xp: stats.xp + 150,
      arrests: stats.arrests + 1,
      reputation: Math.min(100, stats.reputation + 5),
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification('Squad Prisoner Transport arrived! Suspect booked at Precinct 9 (+ $300 Bounty, +5 Rep)', 'success');
    setTimeout(() => {
      setInterrogationSuspect(null);
    }, 1200);
  };

  // Intel discovered
  const handleIntelDiscovered = (intelText: string) => {
    addNotification(`Intel Uncovered: ${intelText}`, 'info');
    const nextStats = { ...stats, xp: stats.xp + 100 };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
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
    const nextStats = { ...stats, xp: stats.xp + 75, civiliansRescued: stats.civiliansRescued + 1 };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification('Witness statement recorded in police case dossier (+75 XP)', 'success');
  };

  // Community pillar hospitality support handler
  const handleCommunitySupport = (type: 'health' | 'armor' | 'reputation' | 'money', amount: number, message: string) => {
    let nextStats = { ...stats };
    if (type === 'health') {
      nextStats.health = Math.min(nextStats.maxHealth, nextStats.health + amount);
    } else if (type === 'armor') {
      nextStats.armor = Math.min(nextStats.maxArmor, nextStats.armor + amount);
    } else if (type === 'reputation') {
      nextStats.reputation = Math.min(100, nextStats.reputation + amount);
    } else if (type === 'money') {
      nextStats.money += amount;
    }
    nextStats.xp += 100;
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(message, 'success');
  };

  // Take Forensic Camera Photo
  const handleTakePhoto = () => {
    if (!engineRef.current) return;
    const nearbyEv = engineRef.current.checkEvidenceNearby(evidenceList);
    if (nearbyEv) {
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === nearbyEv.id ? { ...e, photoTaken: true } : e))
      );
      const nextStats = {
        ...stats,
        xp: stats.xp + 150,
        money: stats.money + 100,
        evidenceFound: stats.evidenceFound + 1,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      addNotification(`Forensic Photograph Logged: ${nearbyEv.title}! (+150 XP, +$100)`, 'success');
    } else {
      const nextStats = { ...stats, xp: stats.xp + 50 };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      addNotification('Crime Scene Surveillance Photo Logged (+50 XP)', 'info');
    }
  };

  // Solve Crime Case
  const handleSolveCase = (caseId: string) => {
    const c = cases.find((item) => item.id === caseId);
    if (!c || c.isSolved) return;

    const nextCases = cases.map((item) => (item.id === caseId ? { ...item, isSolved: true } : item));
    setCases(nextCases);
    const newXP = stats.xp + c.rewardXP;
    const rankInfo = getRankForXP(newXP);
    const nextStats = {
      ...stats,
      xp: newXP,
      money: stats.money + c.rewardMoney,
      rank: rankInfo.rank,
      rankName: rankInfo.name,
      reputation: Math.min(100, stats.reputation + 20),
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats, undefined, undefined, nextCases);
    addNotification(`CASE SOLVED: ${c.title}! Grand Jury Indictments Issued (+ $${c.rewardMoney}, +20 Rep)!`, 'success');
  };

  // Listen for new natural 911 incidents from the City Incident Manager
  useEffect(() => {
    cityIncidentManager.onNewIncident = (ev: DynamicEvent) => {
      // Only display alert banner if player is in normal gameplay and not already on an active scene
      if (!activeDynamicEvent && !activeIncidentObjective && !briefingOpen && !isMenuOpen && !isMainMenuOpen) {
        setActiveDynamicEvent(ev);
        soundEngine.playRadioChime();
      }
    };

    return () => {
      cityIncidentManager.onNewIncident = undefined;
    };
  }, [activeDynamicEvent, activeIncidentObjective, briefingOpen, isMenuOpen, isMainMenuOpen]);

  // Dismiss Dynamic Event
  const handleDismissDynamicEvent = useCallback(() => {
    setActiveDynamicEvent(null);
  }, []);

  // Respond to Dynamic Event
  const handleRespondDynamicEvent = (event: DynamicEvent) => {
    setActiveIncidentObjective(event);
    if (engineRef.current) {
      engineRef.current.waypointPos.set(event.position.x, 0, event.position.z);
      engineRef.current.waypointBeaconGroup.position.copy(engineRef.current.waypointPos);
      engineRef.current.isWaypointActive = true;
      soundEngine.playRadioChime();
      addNotification(`GPS Route Plotted to ${event.title}!`, 'alert');
    }
    setActiveDynamicEvent(null);
  };

  // Stabilize callbacks and UI flags in refs to prevent GameEngine re-instantiation on modal toggles
  const isCameraOpenRef = useRef(isCameraOpen);
  isCameraOpenRef.current = isCameraOpen;
  const isCasesOpenRef = useRef(isCasesOpen);
  isCasesOpenRef.current = isCasesOpen;
  const interrogationSuspectRef = useRef(interrogationSuspect);
  interrogationSuspectRef.current = interrogationSuspect;
  const activeCivilianRef = useRef(activeCivilian);
  activeCivilianRef.current = activeCivilian;
  const handleToggleFlashlightRef = useRef(handleToggleFlashlight);
  handleToggleFlashlightRef.current = handleToggleFlashlight;
  const handleOrderSurrenderRef = useRef(handleOrderSurrender);
  handleOrderSurrenderRef.current = handleOrderSurrender;
  const handleCallBackupRef = useRef(handleCallBackup);
  handleCallBackupRef.current = handleCallBackup;

  // Initialize Game Engine (Once on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, stats, weapons);
    engineRef.current = engine;
    const initialMission = missions.find((m) => m.id === currentMissionId) || missions[0];
    if (initialMission) {
      engine.setMission(initialMission);
    }

    // Ensure safe dimensions on initial layout pass
    requestAnimationFrame(() => {
      engine.handleResize();
    });
    const resizeTimeout = setTimeout(() => {
      engine.handleResize();
    }, 120);

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

    engine.onIncidentResolved = (_inc) => {
      setActiveIncidentObjective(null);
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

          // Sync enemies, police NPCs, military soldiers & civilians for radar
          setEnemies([...engineRef.current.ai.enemies]);
          setCivilians([...engineRef.current.ai.civilians]);
          setPoliceNPCs([...engineRef.current.ai.policeNPCs]);
          setMilitarySoldiers([...engineRef.current.ai.militarySoldiers]);
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
      if (k === 'f') handleToggleFlashlightRef.current();
      if (k === 'v') setIsCameraOpen((prev) => !prev);
      if (k === 'g') handleOrderSurrenderRef.current();
      if (k === 'b') handleCallBackupRef.current();

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
        if (isCameraOpenRef.current) {
          setIsCameraOpen(false);
        } else if (isCasesOpenRef.current) {
          setIsCasesOpen(false);
        } else if (interrogationSuspectRef.current) {
          setInterrogationSuspect(null);
        } else if (activeCivilianRef.current) {
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
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      engine.destroy();
    };
  }, []);

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
        e.state !== 'arrested' &&
        e.state !== 'dead' &&
        (e.state === 'surrendered' || e.health < e.maxHealth * 0.45) &&
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
        const nextStats = { ...stats, money: stats.money - w.price };
        setStats(nextStats);
        w.unlocked = true;
        const nextWeapons = [...engineRef.current.weapons];
        setWeapons(nextWeapons);
        addNotification(`Requisitioned ${w.name}!`, 'success');
        engineRef.current.switchWeaponById(w.id);
        persistProgressToCloud(nextStats, nextWeapons);
      }
    } else {
      const upgradeCost = w.upgradeLevel * 400;
      if (stats.money >= upgradeCost) {
        const nextStats = { ...stats, money: stats.money - upgradeCost };
        setStats(nextStats);
        w.upgradeLevel++;
        w.damage = Math.round(w.damage * 1.25);
        w.fireRate = parseFloat((w.fireRate * 1.1).toFixed(1));
        const nextWeapons = [...engineRef.current.weapons];
        setWeapons(nextWeapons);
        addNotification(`Upgraded ${w.name} to Mark ${w.upgradeLevel}!`, 'success');
        persistProgressToCloud(nextStats, nextWeapons);
      }
    }
  };

  // Armor or Health Upgrade
  const handleUpgradeArmorOrHealth = (type: 'armor' | 'health') => {
    if (!engineRef.current) return;

    if (type === 'armor' && stats.money >= 250) {
      const nextStats = {
        ...stats,
        money: stats.money - 250,
        armor: Math.min(stats.maxArmor, stats.armor + 50),
      };
      setStats(nextStats);
      engineRef.current.stats.armor = Math.min(stats.maxArmor, stats.armor + 50);
      addNotification('Kevlar Armor Reinforced +50', 'success');
      persistProgressToCloud(nextStats);
    } else if (type === 'health' && stats.money >= 150) {
      const nextStats = {
        ...stats,
        money: stats.money - 150,
        health: stats.maxHealth,
      };
      setStats(nextStats);
      engineRef.current.stats.health = stats.maxHealth;
      addNotification('Field Trauma Medkit Applied · Health Restored', 'success');
      persistProgressToCloud(nextStats);
    }
  };

  // Mission Selection
  const handleSelectMission = (missionId: string) => {
    setCurrentMissionId(missionId);
    const m = missions.find((item) => item.id === missionId);
    if (m && engineRef.current) {
      engineRef.current.setMission(m);
      setBriefingOpen(true);
      addNotification(`Dispatch Assignment: ${m.title}`, 'info');
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
      engineRef.current.playerYaw = Math.PI;
      engineRef.current.cameraPitch = 0.15;
      engineRef.current.playerRig.root.rotation.y = Math.PI;
      engineRef.current.initCameraPosition();
      authoritativeEncounterManager.reset();
      engineRef.current.setMission(STORY_MISSIONS[0]);
    }
    setIsMainMenuOpen(false);
    setBriefingOpen(true);
    persistProgressToCloud(INITIAL_PLAYER_STATS, INITIAL_WEAPONS, STORY_MISSIONS);
    addNotification('New Career Started: Officer Carter assigned to Precinct 9.', 'success');
  };

  // Respawn after defeat
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.stats.health = 100;
      engineRef.current.stats.armor = 50;
      engineRef.current.playerPos.copy(engineRef.current.cityData.spawnPoints.player);
      engineRef.current.playerRig.root.position.copy(engineRef.current.playerPos);
      engineRef.current.playerYaw = Math.PI;
      engineRef.current.cameraPitch = 0.15;
      engineRef.current.playerRig.root.rotation.y = Math.PI;
      engineRef.current.initCameraPosition();
      if (currentMission) {
        engineRef.current.setMission(currentMission);
      }
      setStats({ ...engineRef.current.stats });
      setGameStatus(null);
      addNotification('Officer Carter dispatched from Precinct 9.', 'info');
    }
  };

  // Next Mission after victory - Endless Next Gameplay Loop
  const handleContinueAfterVictory = () => {
    setGameStatus(null);
    const currentIdx = missions.findIndex((m) => m.id === currentMissionId);
    if (currentIdx < missions.length - 1) {
      const nextMission = missions[currentIdx + 1];
      const updatedMissions = missions.map((m) =>
        m.id === nextMission.id ? { ...m, unlocked: true } : m
      );
      setMissions(updatedMissions);
      handleSelectMission(nextMission.id);
      persistProgressToCloud(undefined, undefined, updatedMissions);
    } else {
      // Endless Loop: generate new random police mission
      const randMission = generateRandomPoliceMission(stats.rank);
      const updatedMissions = [...missions, randMission];
      setMissions(updatedMissions);
      handleSelectMission(randMission.id);
      persistProgressToCloud(undefined, undefined, updatedMissions);
      addNotification(`911 Priority Dispatch: ${randMission.title}!`, 'alert');
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

  const handleCycleTimeOfDay = () => {
    const cycle: Record<TimeOfDay, TimeOfDay> = {
      day: 'sunset',
      sunset: 'night',
      night: 'day',
    };
    const next = cycle[timeOfDay] || 'day';
    handleChangeTimeOfDay(next);
    addNotification(`Environment: ${next.toUpperCase()} patrol active`, 'info');
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
        className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
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
        activeIncidentObjective={activeIncidentObjective}
        currentVehicle={currentVehicle}
        playerPos={playerPos}
        playerYaw={playerYaw}
        enemies={enemies}
        civilians={civilians}
        policeNPCs={policeNPCs}
        militarySoldiers={militarySoldiers}
        vehicles={engineRef.current ? engineRef.current.vehicles.map((v) => v.entity) : []}
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
        cloudSyncStatus={cloudSyncStatus}
        onToggleFullscreen={handleToggleFullscreen}
        timeOfDay={timeOfDay}
        onToggleTimeOfDay={handleCycleTimeOfDay}
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
        onCallBackup={handleCallBackup}
      />

      {/* DYNAMIC 911 CALL BANNER */}
      <DynamicEventBanner
        event={activeDynamicEvent}
        onRespond={handleRespondDynamicEvent}
        onDismiss={handleDismissDynamicEvent}
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
        onCommunitySupport={handleCommunitySupport}
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
        authUser={authUser}
        cloudSyncStatus={cloudSyncStatus}
        lastSavedAt={lastSavedAt}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
        onManualSave={handleManualSave}
        onRespondIncident={handleRespondDynamicEvent}
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
        authUser={authUser}
        cloudSyncStatus={cloudSyncStatus}
        lastSavedAt={lastSavedAt}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
        onManualSave={handleManualSave}
      />

      {/* VICTORY & DEFEAT MODAL */}
      <GameStatusModal
        status={gameStatus}
        mission={currentMission}
        stats={stats}
        onRestart={handleRestart}
        onContinue={handleContinueAfterVictory}
      />

      {/* MOBILE LANDSCAPE ORIENTATION ADVISORY PROMPT */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none font-['Inter',sans-serif]">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-4 animate-bounce">
            <RotateCw className="w-8 h-8" />
          </div>
          <h2 className="font-['Chakra_Petch'] font-bold text-xl text-slate-100 uppercase tracking-wide">
            Rotate Device to Landscape
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
            Street Justice is designed for full-screen landscape mobile gaming. Please turn your phone sideways to play.
          </p>
          <button
            onClick={handleToggleFullscreen}
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95 transition-all"
          >
            Enter Fullscreen Landscape
          </button>
        </div>
      )}
    </div>
  );
}
