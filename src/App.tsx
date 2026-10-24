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
  EnterableBuilding,
  EnterableBuildingId,
  FictionalValuable,
} from './types/game';
import { CRIME_CASES, INITIAL_EVIDENCE_ITEMS, CrimeCase } from './game/systems/InvestigationSystem';
import { generateRandomCityEvent, cityIncidentManager } from './game/systems/DynamicEventsSystem';
import { STORY_MISSIONS, generateRandomPoliceMission } from './game/systems/MissionSystem';
import { authoritativeEncounterManager } from './game/systems/EncounterManager';
import { soundEngine } from './game/audio/SoundEffects';
import { cinematicMusicEngine, MusicTheme, TrackInfo } from './game/audio/CinematicMusicEngine';
import { auth, loginWithGoogle, logoutUser, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  fetchPlayerProfile,
  createPlayerProfile,
  updatePlayerProfile,
} from './game/systems/PlayerFirestoreService';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { PauseMenu, PauseMenuTab } from './components/PauseMenu';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { GameStatusModal } from './components/GameStatusModal';
import { MainMenu } from './components/MainMenu';
import { InterrogationModal } from './components/InterrogationModal';
import { ForensicCameraOverlay } from './components/ForensicCameraOverlay';
import { StoryCutsceneModal } from './components/StoryCutsceneModal';
import { CrimeCasesModal } from './components/CrimeCasesModal';
import { CivilianDialogueModal } from './components/CivilianDialogueModal';
import { DynamicEventBanner } from './components/DynamicEventBanner';
import { EventChoiceModal } from './components/EventChoiceModal';
import { ArrestEvidenceModal, ArrestChoiceResult } from './components/ArrestEvidenceModal';
import { BankValuablesModal, ValuablesChoiceResult } from './components/BankValuablesModal';
import { BankModal } from './components/BankModal';
import { EvidenceLockerModal } from './components/EvidenceLockerModal';
import { InteriorMerchantModal } from './components/InteriorMerchantModal';
import { DualIdentityModal } from './components/DualIdentityModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { PrologueStoryExperience } from './components/PrologueStoryExperience';
import { DeathBeforeBetrayalCinematic } from './components/DeathBeforeBetrayalCinematic';
import {
  OneSmallMatterModal,
  OneSmallMatterPhase,
  OneSmallMatterEarlyChoice,
  OneSmallMatterFinalChoice,
} from './components/OneSmallMatterModal';
import {
  PlayerProfileSettings,
  DEFAULT_PLAYER_PROFILE,
  PreferredPlayStyle,
} from './types/game';
import {
  CharacterVisualAesthetic,
  setGlobalCharacterAesthetic,
} from './game/engine/CharacterModels';
import {
  ActiveInteriorState,
  InteriorInteractable,
} from './game/engine/BuildingInteriors';

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
  const [activeEventChoice, setActiveEventChoice] = useState<DynamicEvent | null>(null);

  // First-Time Experience, Profile, & Story Prologue State
  const [playerProfile, setPlayerProfile] = useState<PlayerProfileSettings>(() => {
    try {
      const savedLocal = localStorage.getItem('street_justice_local_profile');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed.profile) return { ...DEFAULT_PLAYER_PROFILE, ...parsed.profile };
      }
      const savedDedicated = localStorage.getItem('street_justice_player_profile');
      if (savedDedicated) return { ...DEFAULT_PLAYER_PROFILE, ...JSON.parse(savedDedicated) };
    } catch {}
    return DEFAULT_PLAYER_PROFILE;
  });

  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    try {
      const savedLocal = localStorage.getItem('street_justice_local_profile');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed.stats || parsed.savedAt || (parsed.profile && parsed.profile.hasCompletedIntro)) {
          return true;
        }
      }
      const savedDedicated = localStorage.getItem('street_justice_player_profile');
      if (savedDedicated) {
        const parsed = JSON.parse(savedDedicated);
        if (parsed.hasCompletedIntro) return true;
      }
    } catch {}
    return false;
  });

  const [isWelcomeScreenOpen, setIsWelcomeScreenOpen] = useState<boolean>(true);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isPrologueOpen, setIsPrologueOpen] = useState<boolean>(false);
  const [isReplayingPrologue, setIsReplayingPrologue] = useState<boolean>(false);
  const [characterAesthetic, setCharacterAesthetic] = useState<CharacterVisualAesthetic>(() => {
    try {
      const saved = localStorage.getItem('street_justice_character_aesthetic');
      if (saved === 'blocky' || saved === 'realistic' || saved === 'prototype') return saved;
    } catch {}
    return 'prototype';
  });

  // Modals & Overlays
  const [isMainMenuOpen, setIsMainMenuOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [pauseMenuInitialTab, setPauseMenuInitialTab] = useState<PauseMenuTab>('missions');
  const [offDutyTracking, setOffDutyTracking] = useState<'precinct' | 'house'>('house');
  const [briefingOpen, setBriefingOpen] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'victory' | 'defeat' | null>(null);

  const [activeCutscene, setActiveCutscene] = useState<{ mission: Mission; type: 'intro' | 'outro' } | null>(null);
  const [finalMissionCinematic, setFinalMissionCinematic] = useState<{
    isOpen: boolean;
    initialPhase: 'phase1_threat' | 'phase2_climax_handshake';
  } | null>(null);
  const [oneSmallMatterModalState, setOneSmallMatterModalState] = useState<{
    isOpen: boolean;
    phase: OneSmallMatterPhase;
    earlyChoice: OneSmallMatterEarlyChoice;
  } | null>(null);
  const [interrogationSuspect, setInterrogationSuspect] = useState<EnemyEntity | null>(null);
  const [arrestEvidenceSuspect, setArrestEvidenceSuspect] = useState<EnemyEntity | null>(null);
  const [activeCivilian, setActiveCivilian] = useState<CivilianEntity | null>(null);
  const [civilians, setCivilians] = useState<CivilianEntity[]>([]);
  const [policeNPCs, setPoliceNPCs] = useState<PoliceNPCEntity[]>([]);
  const [militarySoldiers, setMilitarySoldiers] = useState<MilitaryNPCEntity[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCasesOpen, setIsCasesOpen] = useState<boolean>(false);
  const [isDualIdentityOpen, setIsDualIdentityOpen] = useState<boolean>(false);

  // Enterable Buildings & 3D Interior States
  const [nearbyBuildingEntrance, setNearbyBuildingEntrance] = useState<EnterableBuilding | null>(null);
  const [nearbyInteriorInteractable, setNearbyInteriorInteractable] = useState<InteriorInteractable | null>(null);
  const [activeInterior, setActiveInterior] = useState<ActiveInteriorState | null>(null);
  const [bankValuablesTarget, setBankValuablesTarget] = useState<InteriorInteractable | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isEvidenceLockerOpen, setIsEvidenceLockerOpen] = useState<boolean>(false);
  const [activeMerchantBuildingId, setActiveMerchantBuildingId] = useState<EnterableBuildingId | null>(null);

  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [playerYaw, setPlayerYaw] = useState<number>(0);

  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(() => cinematicMusicEngine.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState<number>(() => soundEngine.getSfxVolume());
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => cinematicMusicEngine.isMusicMuted());
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => soundEngine.isSfxMuted());
  const [isMusicPaused, setIsMusicPaused] = useState<boolean>(() => cinematicMusicEngine.isMusicPaused());
  const [currentTrackInfo, setCurrentTrackInfo] = useState<TrackInfo>(() => cinematicMusicEngine.getCurrentTrackInfo());
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);

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
      customSettings?: CustomizationSettings,
      customProfile?: PlayerProfileSettings
    ) => {
      const curStats = customStats || stats;
      const curWeapons = customWeapons || weapons;
      const curMissions = customMissions || missions;
      const curCases = customCases || cases;
      const curCustomization = customSettings || customization;
      const curProfile = customProfile || playerProfile;

      // Always save locally so guest officers keep their career progress
      try {
        localStorage.setItem(
          'street_justice_local_profile',
          JSON.stringify({
            profile: curProfile,
            stats: curStats,
            weapons: curWeapons,
            missions: curMissions,
            cases: curCases,
            customization: curCustomization,
            savedAt: new Date().toISOString(),
          })
        );
        localStorage.setItem('street_justice_player_profile', JSON.stringify(curProfile));
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
        if (parsed.profile) {
          setPlayerProfile(parsed.profile);
          setHasSavedGame(true);
        } else if (parsed.stats || parsed.savedAt) {
          setHasSavedGame(true);
        }
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
              policeReputation: cloudProfile.policeReputation ?? cloudProfile.reputation ?? prev.policeReputation ?? prev.reputation,
              underworldReputation: cloudProfile.underworldReputation ?? prev.underworldReputation ?? 15,
              suspicionLevel: cloudProfile.suspicionLevel ?? prev.suspicionLevel ?? 10,
              dirtyCash: cloudProfile.dirtyCash ?? prev.dirtyCash ?? 0,
              legitimateEarnings: cloudProfile.legitimateEarnings ?? prev.legitimateEarnings ?? prev.money,
              secretEarnings: cloudProfile.secretEarnings ?? prev.secretEarnings ?? 0,
              integrity: cloudProfile.integrity ?? prev.integrity ?? 75,
              bankSavings: cloudProfile.bankSavings ?? prev.bankSavings ?? 0,
            };
            if (engineRef.current) {
              engineRef.current.stats = { ...newStats };
              engineRef.current.syncDoubleLifeStats(newStats);
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

          if (m.id === 'ch8_death_before_betrayal') {
            // Trigger Chapter 8: Death Before Betrayal Climax Confrontation & Fake Handshake!
            setTimeout(() => {
              soundEngine.playRadioChime();
              setFinalMissionCinematic({ isOpen: true, initialPhase: 'phase2_climax_handshake' });
            }, 450);

            return {
              ...m,
              objectives: newObjectives,
              completed: true,
            };
          }

          if (m.id === 'ch9_one_small_matter') {
            // Trigger Climax Confrontation with Developer Arthur Sterling & Building Inspector Howard Pike!
            setTimeout(() => {
              soundEngine.playRadioChime();
              setOneSmallMatterModalState({
                isOpen: true,
                phase: 'stage6_confrontation',
                earlyChoice: oneSmallMatterModalState?.earlyChoice || 'investigate',
              });
            }, 450);

            return {
              ...m,
              objectives: newObjectives,
              completed: true,
            };
          }

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

        if (anyUpdated && !allCompleted) {
          if (m.id === 'ch9_one_small_matter') {
            const protectWitnessObj = newObjectives.find((o) => o.id === 'obj_osm_protect_witness');
            const collapseObj = newObjectives.find((o) => o.id === 'obj_osm_respond_collapse');
            if (protectWitnessObj?.isCompleted && collapseObj && !collapseObj.isCompleted) {
              setTimeout(() => {
                soundEngine.playBuildingCrack();
                if (engineRef.current) {
                  engineRef.current.triggerBuildingCollapseEvent();
                }
                setOneSmallMatterModalState((prev) => ({
                  isOpen: true,
                  phase: 'stage3_collapse',
                  earlyChoice: prev?.earlyChoice || 'investigate',
                }));
              }, 600);
            }
          }

          const nextObj = newObjectives.find((o) => !o.isCompleted && o.targetPos);
          if (nextObj && nextObj.targetPos && engineRef.current) {
            engineRef.current.setWaypointPosition(nextObj.targetPos.x, nextObj.targetPos.z, true);
          }
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
        legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + currentMission.rewardMoney,
        rank: rankInfo.rank,
        rankName: rankInfo.name,
        missionsCompleted: stats.missionsCompleted + 1,
        reputation: Math.min(100, stats.reputation + 5),
        policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 5),
        suspicionLevel: Math.max(0, (stats.suspicionLevel ?? 10) - 4),
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) {
        engineRef.current.syncDoubleLifeStats(nextStats);
      }
      addNotification(`MISSION COMPLETED: +$${currentMission.rewardMoney.toLocaleString()} Legitimate Salary (+5 Police Rep, -4 Suspicion)`, 'success');
    }
  };

  // Moral choice made in cutscene
  const handleCutsceneChoiceMade = (choice: 'A' | 'B') => {
    if (!currentMission?.choice) return;
    if (choice === 'A') {
      // Option A effect: Shady Deal
      const nextStats = {
        ...stats,
        money: stats.money + 1000,
        secretEarnings: (stats.secretEarnings ?? 0) + 1000,
        dirtyCash: (stats.dirtyCash ?? 0) + 1000,
        reputation: Math.max(0, stats.reputation + currentMission.choice!.optionA.reputationBonus),
        policeReputation: Math.max(0, (stats.policeReputation ?? stats.reputation) + currentMission.choice!.optionA.reputationBonus),
        underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 20),
        suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 25),
        iaViolations: stats.iaViolations + 1,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      addNotification('Internal Affairs noted questionable conduct: +$1,000 Dirty Cash (-25 Police Rep, +25 Heat)', 'alert');
    } else {
      // Option B effect: Lawful Integrity
      const nextStats = {
        ...stats,
        xp: stats.xp + 300,
        money: stats.money + 500,
        legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + 500,
        reputation: Math.min(100, stats.reputation + currentMission.choice!.optionB.reputationBonus),
        policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + currentMission.choice!.optionB.reputationBonus),
        suspicionLevel: Math.max(0, (stats.suspicionLevel ?? 10) - 10),
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      addNotification('Commendation for Lawful Integrity: +$500 Official Bonus (+10 Police Rep, -10 Heat)', 'success');
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

  // Interrogate, Search & Double-Life Arrest Choice Modal
  const handleOpenInterrogation = useCallback(() => {
    if (engineRef.current) {
      const suspect = engineRef.current.checkArrestedSuspectNearby();
      if (suspect) {
        setArrestEvidenceSuspect(suspect);
        setInterrogationSuspect(suspect);
      } else {
        addNotification('No arrested or surrendered suspect nearby to interact with.', 'info');
      }
    }
  }, []);

  // Handle Officer Carter Double-Life Decision from Arrest & Evidence System
  const handleApplyArrestResult = (result: ArrestChoiceResult) => {
    const curPoliceRep = stats.policeReputation ?? stats.reputation;
    const curUnderworldRep = stats.underworldReputation ?? 15;
    const curSuspicion = stats.suspicionLevel ?? 10;
    const curIntegrity = stats.integrity ?? 80;

    const nextPoliceRep = Math.max(0, Math.min(100, curPoliceRep + result.policeRepDelta));
    const nextUnderworldRep = Math.max(0, Math.min(100, curUnderworldRep + result.underworldRepDelta));
    const nextSuspicion = Math.max(0, Math.min(100, curSuspicion + result.suspicionDelta));
    const nextIntegrity = Math.max(0, Math.min(100, curIntegrity + result.integrityDelta));
    const nextIaViolations = stats.iaViolations + (result.iaViolationDelta || 0);

    const legIncome = result.legitimateMoneyDelta ?? (result.action === 'lawful' || result.action === 'transport' ? result.moneyDelta : 0);
    const secIncome = result.dirtyMoneyDelta ?? (result.action !== 'lawful' && result.action !== 'transport' && result.moneyDelta > 0 ? result.moneyDelta : 0);

    let nextValuables = [...(stats.valuables || [])];
    if (result.contrabandValuable) {
      nextValuables.push(result.contrabandValuable);
    }

    let nextEvidence = [...(stats.evidenceRecovered || [])];
    if (result.evidenceItem) {
      nextEvidence.push(result.evidenceItem);
    }

    const nextStats: PlayerStats = {
      ...stats,
      money: stats.money + result.moneyDelta,
      legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + legIncome,
      secretEarnings: (stats.secretEarnings ?? 0) + secIncome,
      dirtyCash: Math.max(0, (stats.dirtyCash ?? 0) + secIncome),
      reputation: nextPoliceRep,
      policeReputation: nextPoliceRep,
      underworldReputation: nextUnderworldRep,
      suspicionLevel: nextSuspicion,
      integrity: nextIntegrity,
      iaViolations: nextIaViolations,
      xp: stats.xp + result.xpDelta,
      valuables: nextValuables,
      evidenceRecovered: nextEvidence,
      evidenceFound: result.evidenceItem ? stats.evidenceFound + 1 : stats.evidenceFound,
    };

    setStats(nextStats);
    cityIncidentManager.playerReputation = nextPoliceRep;
    persistProgressToCloud(nextStats);

    if (engineRef.current) {
      engineRef.current.syncDoubleLifeStats(nextStats);
    }

    // Trigger civilian misconduct alert if citizen witnessed shady action
    if (result.witnessReported && engineRef.current) {
      engineRef.current.triggerWitnessMisconductAlert(result.notificationText);
    }

    // Primary player feedback notification
    addNotification(result.notificationText, result.isGood ? 'success' : 'alert');

    // Dynamic Consequence Feedback
    if (nextSuspicion >= 75 && curSuspicion < 75) {
      setTimeout(() => {
        addNotification('⚠️ INTERNAL AFFAIRS INVESTIGATION ACTIVE: Detectives investigating Carter\'s unexplained payouts and releases!', 'alert');
        soundEngine.playRadioChime();
      }, 2000);
    } else if (nextUnderworldRep >= 50 && curUnderworldRep < 50) {
      setTimeout(() => {
        addNotification('🤝 UNDERWORLD TRUST ELEVATED: Criminals recognize Carter as an officer who cuts deals! Street bribes and surrender offers increased.', 'info');
        soundEngine.playRadioChime();
      }, 2000);
    } else if (nextPoliceRep >= 85 && curPoliceRep < 85) {
      setTimeout(() => {
        addNotification('⭐ PRECINCT 9 COMMENDATION: Department leadership praised Officer Carter\'s clean evidence chain of custody!', 'success');
        soundEngine.playRadioChime();
      }, 2000);
    }
  };

  // Transport Suspect
  const handleTransportSuspectFromModal = (suspectId: string) => {
    if (engineRef.current) {
      engineRef.current.transportSuspect(suspectId);
    }
    setArrestEvidenceSuspect(null);
    setInterrogationSuspect(null);
  };

  // Release Suspect (cut loose off record)
  const handleReleaseSuspectFromModal = (suspectId: string) => {
    if (engineRef.current) {
      engineRef.current.releaseSuspect(suspectId);
    }
    setArrestEvidenceSuspect(null);
    setInterrogationSuspect(null);
  };

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

  // Collect Forensic Evidence Item
  const handleCollectEvidence = useCallback((ev: EvidenceItem) => {
    if (ev.collected) return;
    soundEngine.playRadioChime();
    setEvidenceList((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, collected: true } : item))
    );
    const nextStats = {
      ...stats,
      xp: stats.xp + 250,
      money: stats.money + 150,
      evidenceFound: stats.evidenceFound + 1,
      policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 4),
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    if (engineRef.current) {
      engineRef.current.syncDoubleLifeStats(nextStats);
      engineRef.current.addFloatingText('EVIDENCE SECURED! +250 XP', '#38bdf8', {
        x: ev.position.x,
        y: ev.position.y + 0.8,
        z: ev.position.z,
      });
    }
    handleObjectiveProgress('collect', 1);
    addNotification(`FORENSIC EVIDENCE SECURED: ${ev.title} (+250 XP, +$150, +4 Rep)`, 'success');
  }, [stats, persistProgressToCloud, addNotification]);

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

  // Officer Carter Moral Choice Made on Dynamic City Event
  const handleMakeEventChoice = (choice: 'good' | 'shady') => {
    if (!activeEventChoice || !activeEventChoice.moralChoice) return;
    const mc = activeEventChoice.moralChoice;
    const opt = choice === 'good' ? mc.goodOption : mc.shadyOption;

    let nextStats = { ...stats };
    if (choice === 'good') {
      const repBonus = mc.goodOption.reputationBonus;
      const cash = mc.goodOption.moneyBonus;
      nextStats.reputation = Math.min(100, (nextStats.policeReputation ?? nextStats.reputation) + repBonus);
      nextStats.policeReputation = nextStats.reputation;
      nextStats.suspicionLevel = Math.max(0, (nextStats.suspicionLevel ?? 10) - 5);
      nextStats.money += cash;
      nextStats.legitimateEarnings = (nextStats.legitimateEarnings ?? nextStats.money) + cash;
      nextStats.xp += mc.goodOption.xpBonus;
      nextStats.civiliansRescued += 1;
      addNotification(`Lawful Action: ${mc.goodOption.label}! (+${repBonus} Police Rep, +$${cash} Salary, -5 Heat)`, 'success');
    } else {
      const repBonus = mc.shadyOption.reputationBonus;
      const cash = mc.shadyOption.moneyBonus;
      nextStats.reputation = Math.max(0, (nextStats.policeReputation ?? nextStats.reputation) + repBonus);
      nextStats.policeReputation = nextStats.reputation;
      nextStats.underworldReputation = Math.min(100, (nextStats.underworldReputation ?? 15) + 16);
      nextStats.suspicionLevel = Math.min(100, (nextStats.suspicionLevel ?? 10) + 18);
      nextStats.money += cash;
      nextStats.secretEarnings = (nextStats.secretEarnings ?? 0) + cash;
      nextStats.dirtyCash = (nextStats.dirtyCash ?? 0) + cash;
      nextStats.iaViolations += 1;
      if (mc.shadyOption.valuableReward) {
        nextStats.valuables = [...(nextStats.valuables || []), mc.shadyOption.valuableReward];
      }
      addNotification(`Shady Deal: ${mc.shadyOption.label}! (+16 Underworld Trust, +$${cash} Dirty Cash, +18 Heat)`, 'alert');
    }

    setStats(nextStats);
    cityIncidentManager.playerReputation = nextStats.reputation;
    persistProgressToCloud(nextStats);

    if (engineRef.current) {
      engineRef.current.syncDoubleLifeStats(nextStats);
      engineRef.current.resolveIncidentChoice(activeEventChoice.id, choice);
    } else {
      cityIncidentManager.resolveIncidentWithMoralChoice(activeEventChoice.id, choice);
    }

    setActiveIncidentObjective(null);
    setActiveEventChoice(null);
  };

  // Reliable Direct Vehicle Exit Handler
  const handleExitVehicle = useCallback(() => {
    if (engineRef.current && engineRef.current.currentVehicleIndex >= 0) {
      engineRef.current.exitVehicle();
    }
  }, []);

  // Off-Duty Waypoint Tracking Handler
  const handleToggleOffDutyTracking = useCallback(
    (target: 'precinct' | 'house') => {
      setOffDutyTracking(target);
      if (target === 'house') {
        engineRef.current?.setWaypointPosition(-52, -52, true);
        addNotification("GPS Waypoint locked to Officer Carter's Residence (-52, -52).", 'info');
      } else {
        engineRef.current?.setWaypointPosition(-45, 28, true);
        addNotification('GPS Waypoint locked to Precinct 9 Headquarters (-45, 28).', 'info');
      }
    },
    [addNotification]
  );

  // Quick Open Controls & Strategy Field Guide
  const handleOpenGuide = useCallback(() => {
    setPauseMenuInitialTab('controls');
    setIsMenuOpen(true);
  }, []);

  // Interior Interaction Triggered from Game Engine
  const handleTriggerInteriorInteraction = useCallback(
    (interactable: InteriorInteractable) => {
      if (
        interactable.type === 'bank_teller' ||
        interactable.type === 'manager_safe' ||
        interactable.type === 'vault_gold' ||
        interactable.type === 'cctv_console' ||
        interactable.type === 'backroom_safe'
      ) {
        setBankValuablesTarget(interactable);
      } else if (interactable.type === 'atm_terminal') {
        setIsBankModalOpen(true);
      } else if (interactable.type === 'evidence_locker') {
        setIsEvidenceLockerOpen(true);
      } else if (interactable.type === 'store_counter') {
        setActiveMerchantBuildingId(activeInterior?.building.id || 'cedar_market');
      } else if (interactable.type === 'police_armory') {
        setWeapons((prev) =>
          prev.map((w) => ({
            ...w,
            currentAmmo: w.magazineSize,
            reserveAmmo: Math.max(w.reserveAmmo, w.magazineSize * 4),
          }))
        );
        setStats((prev) => ({
          ...prev,
          armor: prev.maxArmor,
        }));
        addNotification('Armory Depot: Ammunition Requisitioned & Tactical Armor Plating Restocked!', 'success');
        soundEngine.playReload();
      } else if (interactable.type === 'duty_desk') {
        addNotification('Precinct 9 Duty Desk: Shift log active. All city patrol sectors monitored.', 'info');
      } else if (interactable.type === 'bed_sleep') {
        const cycle: Record<TimeOfDay, TimeOfDay> = {
          day: 'sunset',
          sunset: 'night',
          night: 'day',
        };
        setTimeOfDay((prevTime) => {
          const next = cycle[prevTime] || 'day';
          engineRef.current?.setTimeOfDay(next);
          return next;
        });
        setStats((prev) => ({
          ...prev,
          health: prev.maxHealth,
          armor: prev.maxArmor,
        }));
        if (engineRef.current) {
          engineRef.current.stats.health = engineRef.current.stats.maxHealth;
          engineRef.current.stats.armor = engineRef.current.stats.maxArmor;
        }
        soundEngine.playRadioChime();
        addNotification('Rested in bed: Shift hours advanced & health fully restored!', 'success');
      } else if (interactable.type === 'wardrobe_closet') {
        const outfits: CustomizationSettings['outfit'][] = ['rookie_patrol', 'tactical_swat', 'detective'];
        setCustomization((prev) => {
          const currentIdx = outfits.indexOf(prev.outfit);
          const nextOutfit = outfits[(currentIdx + 1) % outfits.length];
          if (engineRef.current) {
            engineRef.current.setPlayerOutfit(nextOutfit);
          }
          addNotification(
            `Wardrobe: Changed uniform to ${
              nextOutfit === 'tactical_swat'
                ? 'Tactical SWAT'
                : nextOutfit === 'detective'
                ? 'Undercover Detective'
                : 'Precinct 9 Patrol'
            }!`,
            'info'
          );
          return { ...prev, outfit: nextOutfit };
        });
        soundEngine.playReload();
      } else if (interactable.type === 'desk_save') {
        handleManualSave();
        soundEngine.playRadioChime();
        addNotification("Officer Desk: Career saved to Cloud Firestore & Local Storage!", 'success');
      } else if (interactable.type === 'mission_phone') {
        soundEngine.playRadioChime();
        setIsMenuOpen(true);
        addNotification('Secure Hotline: Accessing Precinct Dossier & Active Warrants.', 'info');
      } else if (interactable.type === 'kitchen_fridge') {
        setStats((prev) => ({
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 25),
        }));
        if (engineRef.current) {
          engineRef.current.stats.health = Math.min(
            engineRef.current.stats.maxHealth,
            engineRef.current.stats.health + 25
          );
        }
        soundEngine.playRadioChime();
        addNotification('Kitchen Fridge: Grabbed cold rations & water (+25 HP)!', 'success');
      }
    },
    [activeInterior]
  );

  // Apply Valuables & Interior Dilemma Choice
  const handleApplyValuablesResult = (result: ValuablesChoiceResult) => {
    let nextStats = { ...stats };
    const polDelta = result.policeRepDelta ?? result.reputationDelta;
    const underDelta = result.underworldRepDelta ?? (result.isGood ? -5 : 15);
    const suspDelta = result.suspicionDelta ?? (result.isGood ? -8 : 16);
    const legMoney = result.legitimateMoneyDelta ?? (result.isGood ? result.moneyDelta : 0);
    const secMoney = result.dirtyMoneyDelta ?? (!result.isGood ? result.moneyDelta : 0);

    nextStats.reputation = Math.max(0, Math.min(100, (nextStats.policeReputation ?? nextStats.reputation) + polDelta));
    nextStats.policeReputation = nextStats.reputation;
    nextStats.underworldReputation = Math.max(0, Math.min(100, (nextStats.underworldReputation ?? 15) + underDelta));
    nextStats.suspicionLevel = Math.max(0, Math.min(100, (nextStats.suspicionLevel ?? 10) + suspDelta));

    nextStats.money += result.moneyDelta;
    nextStats.legitimateEarnings = (nextStats.legitimateEarnings ?? nextStats.money) + legMoney;
    nextStats.secretEarnings = (nextStats.secretEarnings ?? 0) + secMoney;
    if (secMoney > 0) {
      nextStats.dirtyCash = (nextStats.dirtyCash ?? 0) + secMoney;
    }
    nextStats.xp += result.xpDelta;
    if (result.iaViolationDelta) {
      nextStats.iaViolations += result.iaViolationDelta;
    }
    if (result.clearIaViolations) {
      nextStats.iaViolations = 0;
      nextStats.wantedLevel = 0;
      nextStats.suspicionLevel = 5;
    }
    if (result.evidenceDelta) {
      nextStats.evidenceFound += result.evidenceDelta;
    }
    if (result.civiliansDelta) {
      nextStats.civiliansRescued += result.civiliansDelta;
    }
    if (result.valuableReward) {
      nextStats.valuables = [...(nextStats.valuables || []), result.valuableReward];
    }
    setStats(nextStats);
    cityIncidentManager.playerReputation = nextStats.reputation;
    persistProgressToCloud(nextStats);
    if (engineRef.current) {
      engineRef.current.syncDoubleLifeStats(nextStats);
    }
    addNotification(result.notificationText, result.isGood ? 'success' : 'alert');
  };

  // Bank Deposit
  const handleBankDeposit = (amount: number) => {
    const nextStats = {
      ...stats,
      money: stats.money - amount,
      bankSavings: (stats.bankSavings || 0) + amount,
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Deposited $${amount.toLocaleString()} into Metro Trust Savings.`, 'success');
  };

  // Bank Withdraw
  const handleBankWithdraw = (amount: number) => {
    const nextStats = {
      ...stats,
      money: stats.money + amount,
      bankSavings: Math.max(0, (stats.bankSavings || 0) - amount),
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Withdrew $${amount.toLocaleString()} from Metro Trust Savings.`, 'info');
  };

  // Appraise & exchange valuable for insured cash
  const handleBankConvertValuable = (valuableId: string) => {
    const val = (stats.valuables || []).find((v) => v.id === valuableId);
    if (!val) return;
    const nextValuables = (stats.valuables || []).filter((v) => v.id !== valuableId);
    const nextStats = {
      ...stats,
      money: stats.money + val.estimatedValue,
      valuables: nextValuables,
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Exchanged ${val.name} for $${val.estimatedValue.toLocaleString()} in clean cash!`, 'success');
  };

  // Store valuable in bank vault safety deposit box
  const handleBankStoreValuable = (valuableId: string) => {
    const val = (stats.valuables || []).find((v) => v.id === valuableId);
    if (!val) return;
    const nextValuables = (stats.valuables || []).filter((v) => v.id !== valuableId);
    const nextVaultValuables = [...(stats.vaultValuables || []), val];
    const nextStats = {
      ...stats,
      valuables: nextValuables,
      vaultValuables: nextVaultValuables,
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Locked ${val.name} in personal Safety Deposit Box.`, 'info');
  };

  // Retrieve valuable from bank vault safety deposit box
  const handleBankRetrieveValuable = (valuableId: string) => {
    const val = (stats.vaultValuables || []).find((v) => v.id === valuableId);
    if (!val) return;
    const nextVaultValuables = (stats.vaultValuables || []).filter((v) => v.id !== valuableId);
    const nextValuables = [...(stats.valuables || []), val];
    const nextStats = {
      ...stats,
      valuables: nextValuables,
      vaultValuables: nextVaultValuables,
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    addNotification(`Retrieved ${val.name} from Safety Deposit Box.`, 'info');
  };

  // Evidence Locker: Log evidence legitimately
  const handleLogEvidenceHonor = (valuable: FictionalValuable) => {
    const nextValuables = (stats.valuables || []).filter((v) => v.id !== valuable.id);
    const bounty = 250;
    const nextStats = {
      ...stats,
      valuables: nextValuables,
      money: stats.money + bounty,
      legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + bounty,
      reputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 15),
      policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 15),
      suspicionLevel: Math.max(0, (stats.suspicionLevel ?? 10) - 10),
      integrity: Math.min(100, (stats.integrity || 50) + 12),
      evidenceFound: stats.evidenceFound + 1,
      xp: stats.xp + 100,
    };
    setStats(nextStats);
    cityIncidentManager.playerReputation = nextStats.reputation;
    persistProgressToCloud(nextStats);
    if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
    addNotification(`Officially booked ${valuable.name} into Precinct 9 Evidence Room (+15 Police Rep, -10 Heat, +$250 Salary)`, 'success');
  };

  // Evidence Locker: Pocket contraband corruptly
  const handlePocketContrabandCorrupt = (valuable: FictionalValuable) => {
    const nextStats = {
      ...stats,
      money: stats.money + valuable.estimatedValue,
      secretEarnings: (stats.secretEarnings ?? 0) + valuable.estimatedValue,
      dirtyCash: (stats.dirtyCash ?? 0) + valuable.estimatedValue,
      reputation: Math.max(0, (stats.policeReputation ?? stats.reputation) - 20),
      policeReputation: Math.max(0, (stats.policeReputation ?? stats.reputation) - 20),
      underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 18),
      suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 22),
      integrity: Math.max(0, (stats.integrity || 50) - 15),
      iaViolations: stats.iaViolations + 1,
    };
    setStats(nextStats);
    cityIncidentManager.playerReputation = nextStats.reputation;
    persistProgressToCloud(nextStats);
    if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
    addNotification(`Fenced contraband ${valuable.name} for $${valuable.estimatedValue.toLocaleString()} dirty cash! (+18 Underworld Trust, +22 Heat)`, 'alert');
  };

  // Launch underground opportunities unlocked through Underworld Reputation
  const handleLaunchUnderworldOpportunity = (type: 'arms_lead' | 'chop_shop' | 'contraband_drop') => {
    setIsDualIdentityOpen(false);
    if (type === 'chop_shop') {
      const reward = 650;
      const nextStats = {
        ...stats,
        money: stats.money + reward,
        secretEarnings: (stats.secretEarnings ?? 0) + reward,
        dirtyCash: (stats.dirtyCash ?? 0) + reward,
        underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 8),
        suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 12),
        xp: stats.xp + 250,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      soundEngine.playRadioChime();
      addNotification(`🕶️ Chop-Shop Deal Executed! Looked the other way for Neon Pythons. +$${reward} Dirty Cash (+8 Crime Rep, +12 Heat)`, 'alert');
    } else if (type === 'arms_lead') {
      const reward = 1400;
      const nextStats = {
        ...stats,
        money: stats.money + reward,
        secretEarnings: (stats.secretEarnings ?? 0) + reward,
        dirtyCash: (stats.dirtyCash ?? 0) + reward,
        underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 14),
        suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 16),
        xp: stats.xp + 450,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      soundEngine.playRadioChime();
      addNotification(`🕶️ Harbor Arms Tipoff Fenced! Intercepted cartel cache off the books. +$${reward} Dirty Cash (+14 Crime Rep, +16 Heat)`, 'alert');
    } else if (type === 'contraband_drop') {
      const reward = 2800;
      const nextStats = {
        ...stats,
        money: stats.money + reward,
        secretEarnings: (stats.secretEarnings ?? 0) + reward,
        dirtyCash: (stats.dirtyCash ?? 0) + reward,
        underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 20),
        suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 22),
        xp: stats.xp + 800,
      };
      setStats(nextStats);
      persistProgressToCloud(nextStats);
      if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      soundEngine.playRadioChime();
      addNotification(`🕶️ Syndicate Dead-Drop Collected! Fenced bearer bonds securely. +$${reward} Dirty Cash (+20 Crime Rep, +22 Heat)`, 'alert');
    }
  };

  // Interior merchant purchase
  const handlePurchaseMerchantItem = (cost: number, perk: string) => {
    let nextStats = { ...stats, money: stats.money - cost };
    if (perk === 'first_aid') {
      nextStats.health = Math.min(nextStats.maxHealth, nextStats.health + 40);
    } else if (perk === 'vest') {
      nextStats.armor = nextStats.maxArmor;
    } else if (perk === 'intel') {
      nextStats.xp += 150;
      nextStats.reputation = Math.min(100, nextStats.reputation + 5);
    }
    setStats(nextStats);
    persistProgressToCloud(nextStats);
  };

  // Stabilize callbacks and UI flags in refs to prevent GameEngine re-instantiation on modal toggles
  const isCameraOpenRef = useRef(isCameraOpen);
  isCameraOpenRef.current = isCameraOpen;
  const isCasesOpenRef = useRef(isCasesOpen);
  isCasesOpenRef.current = isCasesOpen;
  const arrestEvidenceSuspectRef = useRef(arrestEvidenceSuspect);
  arrestEvidenceSuspectRef.current = arrestEvidenceSuspect;
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
  const handleTriggerInteriorInteractionRef = useRef(handleTriggerInteriorInteraction);
  handleTriggerInteriorInteractionRef.current = handleTriggerInteriorInteraction;
  const evidenceListRef = useRef(evidenceList);
  evidenceListRef.current = evidenceList;
  const handleCollectEvidenceRef = useRef(handleCollectEvidence);
  handleCollectEvidenceRef.current = handleCollectEvidence;

  const isMainMenuOpenRef = useRef(isMainMenuOpen);
  isMainMenuOpenRef.current = isMainMenuOpen;
  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;
  const activeIncidentObjectiveRef = useRef(activeIncidentObjective);
  activeIncidentObjectiveRef.current = activeIncidentObjective;
  const currentMissionRef = useRef(currentMission);
  currentMissionRef.current = currentMission;
  const damageFlashRef = useRef(damageFlash);
  damageFlashRef.current = damageFlash;

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

    engine.onPlayerDamaged = (_damage) => {
      setDamageFlash(true);
      setTimeout(() => {
        setDamageFlash(false);
      }, 260);
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

    engine.onTriggerFinalMissionCinematic = (phase = 'phase1_threat') => {
      setFinalMissionCinematic({ isOpen: true, initialPhase: phase });
    };

    engine.onTriggerOneSmallMatterScene = (phase) => {
      setOneSmallMatterModalState((prev) => ({
        isOpen: true,
        phase,
        earlyChoice: prev?.earlyChoice || 'investigate',
      }));
    };

    engine.onIncidentResolved = (_inc) => {
      setActiveIncidentObjective(null);
    };

    engine.onEventMoralChoiceAvailable = (ev) => {
      setActiveEventChoice(ev);
      soundEngine.playRadioChime();
    };

    // Double-Life Arrest, Cuffs & Evidence Booking Modal Trigger
    engine.onOpenArrestEvidenceModal = (suspect) => {
      setArrestEvidenceSuspect(suspect);
      setInterrogationSuspect(suspect);
    };

    // Enterable Building & Interior Callbacks
    engine.onBuildingEntranceChanged = (building) => {
      setNearbyBuildingEntrance(building);
    };

    engine.onInteriorInteractableChanged = (interactable) => {
      setNearbyInteriorInteractable(interactable);
    };

    engine.onInteriorStateChanged = (interior) => {
      setActiveInterior(interior);
    };

    engine.onTriggerInteriorInteraction = (interactable) => {
      handleTriggerInteriorInteractionRef.current(interactable);
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

        // Dynamic Cinematic Music Theme Transition (evaluated every ~0.65s)
        if (frameCounter % 40 === 0) {
          let targetTheme: MusicTheme = 'exploration';
          if (isMainMenuOpenRef.current) {
            targetTheme = 'menu';
          } else if (gameStatusRef.current === 'victory') {
            targetTheme = 'victory';
          } else {
            const playerPos = engineRef.current.playerPos;
            const isCombat =
              engineRef.current.ai.enemies.some((e) => {
                if (e.state === 'dead' || e.state === 'arrested' || e.state === 'surrendered') return false;
                const dist = Math.hypot(e.position.x - playerPos.x, e.position.z - playerPos.z);
                return dist < 36 && (e.state === 'shoot' || e.state === 'chase' || e.alertLevel > 60);
              }) ||
              engineRef.current.recentGunshotTimer > 0 ||
              damageFlashRef.current;

            if (isCombat) {
              targetTheme = 'combat';
            } else if (
              activeIncidentObjectiveRef.current ||
              (currentMissionRef.current && !currentMissionRef.current.completed && currentMissionRef.current.unlocked)
            ) {
              targetTheme = 'mission';
            } else {
              targetTheme = 'exploration';
            }
          }

          if (cinematicMusicEngine.getCurrentTheme() !== targetTheme) {
            cinematicMusicEngine.playTheme(targetTheme);
            setCurrentTrackInfo(cinematicMusicEngine.getCurrentTrackInfo());
          }
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
        // 1. If currently inside building interior -> Trigger interactable or Exit Door
        // 2. If outside near enterable building entrance -> Enter Building
        // 3. If currently inside vehicle -> Exit Vehicle immediately
        // 4. If near suitable vehicle -> Enter Vehicle
        // 5. If near arrested/surrendered suspect -> Open Interrogation
        // 6. If near civilian -> Question witness
        // 7. Default interact (arrest / action)
        if (engineRef.current) {
          // Inside building interior
          if (engineRef.current.activeInterior) {
            const interactable = engineRef.current.nearbyInteriorInteractable;
            if (interactable) {
              if (interactable.type === 'exit_door') {
                engineRef.current.exitBuilding();
              } else {
                engineRef.current.triggerInteriorInteractable(interactable);
              }
              return;
            }
          }

          // Outside near enterable building entrance
          if (engineRef.current.nearbyBuildingEntrance && engineRef.current.currentVehicleIndex < 0) {
            engineRef.current.enterBuilding(engineRef.current.nearbyBuildingEntrance.id);
            return;
          }

          if (engineRef.current.currentVehicleIndex >= 0) {
            engineRef.current.exitVehicle();
            return;
          }

          // Check captive hostage rescue first
          const hostageNearby = engineRef.current.checkHostageNearbyToRescue();
          if (hostageNearby) {
            engineRef.current.rescueHostage();
            return;
          }

          // Check forensic evidence nearby to collect
          const evidenceNearby = engineRef.current.checkEvidenceNearby(evidenceListRef.current);
          if (evidenceNearby && !evidenceNearby.collected) {
            handleCollectEvidenceRef.current(evidenceNearby as any);
            return;
          }

          const nearVeh = engineRef.current.vehicles.some(
            (v) =>
              engineRef.current!.playerPos.distanceTo({
                x: v.entity.position.x,
                y: 0,
                z: v.entity.position.z,
              } as any) < 4.8
          );
          if (nearVeh) {
            engineRef.current.enterVehicle();
            return;
          }

          const arrestedNearby = engineRef.current.checkArrestedSuspectNearby();
          if (arrestedNearby) {
            setArrestEvidenceSuspect(arrestedNearby);
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
        } else if (arrestEvidenceSuspectRef.current) {
          setArrestEvidenceSuspect(null);
          setInterrogationSuspect(null);
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
            } as any) < 4.8
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

  const nearbyEventWithChoice =
    engineRef.current
      ? cityIncidentManager.activeIncidents.find(
          (inc) =>
            inc.active &&
            inc.moralChoice &&
            !inc.choiceMade &&
            Math.hypot(engineRef.current!.playerPos.x - inc.position.x, engineRef.current!.playerPos.z - inc.position.z) < 10.0
        )
      : null;

  // Building & interior interaction helpers
  const canEnterBuilding = !!nearbyBuildingEntrance && !currentVehicle && !activeInterior;
  const canExitBuilding = !!activeInterior && nearbyInteriorInteractable?.type === 'exit_door';
  const interiorInteractLabel =
    nearbyInteriorInteractable && nearbyInteriorInteractable.type !== 'exit_door'
      ? nearbyInteriorInteractable.prompt
      : undefined;

  const canRescueHostage =
    engineRef.current &&
    engineRef.current.missionHostages.some(
      (h) =>
        !(h as any).isRescued &&
        ((h as any).health === undefined || (h as any).health > 0) &&
        engineRef.current!.playerPos.distanceTo({
          x: h.position.x,
          y: 0,
          z: h.position.z,
        } as any) < 4.2
    );

  const handleRescueHostage = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.rescueHostage();
    }
  }, []);

  // Chapter 8: Death Before Betrayal Handlers
  const handleFinalMissionChoiceASelected = useCallback(() => {
    const nextStats: PlayerStats = {
      ...stats,
      iaViolations: stats.iaViolations + 1,
      suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 40),
      policeReputation: Math.max(0, (stats.policeReputation ?? stats.reputation) - 35),
      reputation: Math.max(0, stats.reputation - 35),
    };
    setStats(nextStats);
    persistProgressToCloud(nextStats);
    if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
  }, [stats, persistProgressToCloud]);

  const handleFinalMissionChoiceBSelected = useCallback(() => {
    setFinalMissionCinematic(null);
    addNotification('BATTLE FOR METRO CITY: Neutralize 5 Heavy Operatives & Untie 3 Hostages!', 'alert');
  }, [addNotification]);

  const handleFinalMissionRestart = useCallback(() => {
    setFinalMissionCinematic(null);
    handleRestart();
    const ch8 = missions.find((m) => m.id === 'ch8_death_before_betrayal');
    if (ch8 && engineRef.current) {
      engineRef.current.setMission(ch8);
      setCurrentMissionId('ch8_death_before_betrayal');
    }
  }, [missions]);

  const handleFinalMissionContinueFreeRoam = useCallback(
    (ending: 'coward_last_breath' | 'trust_the_devil') => {
      setFinalMissionCinematic(null);
      if (ending === 'trust_the_devil') {
        const newXP = stats.xp + 8000;
        const rankInfo = getRankForXP(newXP);
        const nextStats: PlayerStats = {
          ...stats,
          xp: newXP,
          money: stats.money + 15000,
          legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + 15000,
          rank: rankInfo.rank,
          rankName: 'Master Detective',
          civiliansRescued: stats.civiliansRescued + 3,
          missionsCompleted: stats.missionsCompleted + 1,
          reputation: 100,
          policeReputation: 100,
        };
        setStats(nextStats);
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);

        setMissions((prev) =>
          prev.map((m) =>
            m.id === 'ch8_death_before_betrayal' ? { ...m, completed: true } : m
          )
        );
        addNotification('CAMPAIGN COMPLETED: Chapter 8 Concluded! Free Roam & City Patrol Unlocked.', 'success');
      } else {
        addNotification('Free Roam Resumed: Chapter 8 remains available in the Precinct 9 dossier.', 'info');
      }
    },
    [stats, persistProgressToCloud, addNotification]
  );

  // One Small Matter (Chapter 9) Handlers
  const handleOneSmallMatterEarlyChoice = useCallback(
    (choice: OneSmallMatterEarlyChoice) => {
      setOneSmallMatterModalState((prev) => (prev ? { ...prev, earlyChoice: choice } : null));
      if (choice === 'bribe') {
        const nextStats: PlayerStats = {
          ...stats,
          money: stats.money + 2500,
          secretEarnings: (stats.secretEarnings ?? 0) + 2500,
          dirtyCash: (stats.dirtyCash ?? 0) + 2500,
          underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 15),
          suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 25),
          iaViolations: stats.iaViolations + 1,
        };
        setStats(nextStats);
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
        addNotification('Accepted $2,500 Sterling payoff envelope. IA suspicion escalated.', 'alert');
      } else if (choice === 'investigate') {
        const nextStats: PlayerStats = {
          ...stats,
          xp: stats.xp + 150,
          policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 8),
          reputation: Math.min(100, stats.reputation + 8),
        };
        setStats(nextStats);
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
        addNotification('Whistleblower statement documented. Formal structural probe initiated.', 'success');
      } else {
        const nextStats: PlayerStats = {
          ...stats,
          suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 10),
          policeReputation: Math.max(0, (stats.policeReputation ?? stats.reputation) - 5),
        };
        setStats(nextStats);
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
        addNotification('Report dismissed without action. Mateo left unprotected.', 'alert');
      }
    },
    [stats, persistProgressToCloud, addNotification]
  );

  const handleOneSmallMatterDeployToDisaster = useCallback(() => {
    setOneSmallMatterModalState(null);
    if (engineRef.current) {
      engineRef.current.triggerBuildingCollapseEvent();
      engineRef.current.setWaypointPosition(-24, 38, true);
    }
    soundEngine.playRadioChime();
    addNotification('DISPATCH 10-99: Sterling Heights collapsed! Search & rescue survivors now!', 'alert');
  }, [addNotification]);

  const handleOneSmallMatterFinalChoice = useCallback(
    (choice: OneSmallMatterFinalChoice) => {
      if (choice === 'integrity') {
        const newXP = stats.xp + 6000;
        const rankInfo = getRankForXP(newXP);
        const nextStats: PlayerStats = {
          ...stats,
          xp: newXP,
          money: stats.money + 10000,
          legitimateEarnings: (stats.legitimateEarnings ?? stats.money) + 10000,
          rank: rankInfo.rank,
          rankName: rankInfo.name,
          policeReputation: 100,
          reputation: 100,
          suspicionLevel: Math.max(0, (stats.suspicionLevel ?? 10) - 20),
          civiliansRescued: stats.civiliansRescued + 3,
          missionsCompleted: stats.missionsCompleted + 1,
        };
        setStats(nextStats);
        handleSolveCase('case_building_collapse_corruption');
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      } else if (choice === 'settlement') {
        const nextStats: PlayerStats = {
          ...stats,
          money: stats.money + 12000,
          secretEarnings: (stats.secretEarnings ?? 0) + 12000,
          dirtyCash: (stats.dirtyCash ?? 0) + 12000,
          underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 30),
          suspicionLevel: Math.min(100, (stats.suspicionLevel ?? 10) + 35),
          iaViolations: stats.iaViolations + 1,
          policeReputation: Math.max(0, (stats.policeReputation ?? stats.reputation) - 20),
          civiliansRescued: stats.civiliansRescued + 3,
          missionsCompleted: stats.missionsCompleted + 1,
        };
        setStats(nextStats);
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      } else if (choice === 'manipulate') {
        const newXP = stats.xp + 4500;
        const rankInfo = getRankForXP(newXP);
        const nextStats: PlayerStats = {
          ...stats,
          xp: newXP,
          money: stats.money + 4000,
          secretEarnings: (stats.secretEarnings ?? 0) + 4000,
          dirtyCash: (stats.dirtyCash ?? 0) + 4000,
          rank: rankInfo.rank,
          rankName: rankInfo.name,
          policeReputation: Math.min(100, (stats.policeReputation ?? stats.reputation) + 15),
          underworldReputation: Math.min(100, (stats.underworldReputation ?? 15) + 10),
          suspicionLevel: Math.max(0, (stats.suspicionLevel ?? 10) - 10),
          civiliansRescued: stats.civiliansRescued + 3,
          missionsCompleted: stats.missionsCompleted + 1,
        };
        setStats(nextStats);
        handleSolveCase('case_building_collapse_corruption');
        persistProgressToCloud(nextStats);
        if (engineRef.current) engineRef.current.syncDoubleLifeStats(nextStats);
      }
    },
    [stats, persistProgressToCloud]
  );

  const handleOneSmallMatterRestart = useCallback(() => {
    setOneSmallMatterModalState(null);
    handleRestart();
    const ch9 = missions.find((m) => m.id === 'ch9_one_small_matter');
    if (ch9 && engineRef.current) {
      engineRef.current.setMission(ch9);
      setCurrentMissionId('ch9_one_small_matter');
    }
  }, [missions]);

  const handleOneSmallMatterContinueFreeRoam = useCallback(
    (choice: OneSmallMatterFinalChoice) => {
      setOneSmallMatterModalState(null);
      setMissions((prev) =>
        prev.map((m) => (m.id === 'ch9_one_small_matter' ? { ...m, completed: true } : m))
      );
      addNotification(
        `ONE SMALL MATTER CONCLUDED (${choice.toUpperCase()}). Metro City patrol resumes.`,
        'success'
      );
    },
    [addNotification]
  );

  const handleEnterBuilding = useCallback(() => {
    if (nearbyBuildingEntrance && engineRef.current) {
      engineRef.current.enterBuilding(nearbyBuildingEntrance.id);
    }
  }, [nearbyBuildingEntrance]);

  const handleExitBuilding = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.exitBuilding();
    }
  }, []);

  const handleInteriorInteract = useCallback(() => {
    if (nearbyInteriorInteractable && engineRef.current) {
      engineRef.current.triggerInteriorInteractable(nearbyInteriorInteractable);
    }
  }, [nearbyInteriorInteractable]);

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

  // Audio Mixer Handlers
  const handleMusicVolumeChange = useCallback((v: number) => {
    cinematicMusicEngine.setMusicVolume(v);
    setMusicVolume(v);
  }, []);

  const handleSfxVolumeChange = useCallback((v: number) => {
    soundEngine.setSfxVolume(v);
    setSfxVolume(v);
  }, []);

  const handleToggleMusicMute = useCallback(() => {
    const next = cinematicMusicEngine.toggleMute();
    setIsMusicMuted(next);
  }, []);

  const handleToggleSfxMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setIsSfxMuted(next);
  }, []);

  const handleToggleMusicPause = useCallback(() => {
    if (cinematicMusicEngine.isMusicPaused()) {
      cinematicMusicEngine.resume();
      setIsMusicPaused(false);
    } else {
      cinematicMusicEngine.pause();
      setIsMusicPaused(true);
    }
  }, []);

  const handleSelectTheme = useCallback((theme: MusicTheme) => {
    cinematicMusicEngine.playTheme(theme, true);
    setCurrentTrackInfo(cinematicMusicEngine.getCurrentTrackInfo());
  }, []);

  // Master Mute audio
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    cinematicMusicEngine.setMuted(next);
    soundEngine.setMuted(next);
    setIsMusicMuted(next);
    setIsSfxMuted(next);
  }, [isMuted]);

  // Outfit change
  const handleChangeOutfit = (outfit: CustomizationSettings['outfit']) => {
    setCustomization((prev) => ({ ...prev, outfit }));
    if (engineRef.current) {
      engineRef.current.setPlayerOutfit(outfit);
      addNotification(
        `Uniform changed to ${
          outfit === 'tactical_swat'
            ? 'Tactical SWAT'
            : outfit === 'detective'
            ? 'Undercover Detective'
            : 'Precinct 9 Patrol'
        }`,
        'info'
      );
    }
  };

  // Character 3D Visual Style change (Roblox-Inspired Prototype)
  const handleChangeAesthetic = useCallback((newAesthetic: CharacterVisualAesthetic) => {
    setCharacterAesthetic(newAesthetic);
    setGlobalCharacterAesthetic(newAesthetic);
    try {
      localStorage.setItem('street_justice_character_aesthetic', newAesthetic);
    } catch {}
    if (engineRef.current) {
      engineRef.current.setPlayerOutfit(customization.outfit);
    }
    addNotification(
      `Character Visual Style: ${
        newAesthetic === 'blocky'
          ? 'Blocky Stylized (Roblox-Inspired)'
          : newAesthetic === 'prototype'
          ? 'Prototype Cohort (Neighborhood & Officers)'
          : 'Realistic Urban'
      }`,
      'info'
    );
  }, [customization.outfit, addNotification]);

  // Welcome Screen Handlers
  const handleContinueCareer = useCallback(() => {
    setIsWelcomeScreenOpen(false);
    setIsMainMenuOpen(false);
    if (engineRef.current) {
      engineRef.current.isCinematicMode = false;
      engineRef.current.initCameraPosition();
    }
    cinematicMusicEngine.startSequence('exploration');
    addNotification(`Welcome back, ${playerProfile.callsign}. Resuming active patrol.`, 'info');
  }, [playerProfile.callsign, addNotification]);

  const handleStartNewGameFromWelcome = useCallback(() => {
    setIsWelcomeScreenOpen(false);
    setIsEditingProfile(false);
    setIsProfileSetupOpen(true);
  }, []);

  // Character Profile Setup Confirm
  const handleConfirmProfileSetup = useCallback(
    (newProfile: PlayerProfileSettings) => {
      setPlayerProfile(newProfile);
      setCustomization((prev) => ({
        ...prev,
        outfit: newProfile.outfit,
      }));
      try {
        localStorage.setItem('street_justice_player_profile', JSON.stringify(newProfile));
      } catch {}

      if (isEditingProfile) {
        setIsProfileSetupOpen(false);
        setIsEditingProfile(false);
        if (engineRef.current) {
          engineRef.current.setPlayerOutfit(newProfile.outfit);
        }
        persistProgressToCloud(
          undefined,
          undefined,
          undefined,
          undefined,
          {
            ...customization,
            outfit: newProfile.outfit,
          },
          newProfile
        );
        addNotification(`Officer dossier updated: ${newProfile.callsign}`, 'success');
      } else {
        // New Game -> Launch Story-Driven Prologue & Tutorial!
        setIsProfileSetupOpen(false);
        setIsPrologueOpen(true);
      }
    },
    [isEditingProfile, customization, persistProgressToCloud, addNotification]
  );

  // Replay Story Prologue (Young Carter Origins) without losing active career
  const handlePlayPrologue = useCallback(() => {
    setIsReplayingPrologue(true);
    setIsWelcomeScreenOpen(false);
    setIsMainMenuOpen(false);
    setIsMenuOpen(false);
    setIsPrologueOpen(true);
    addNotification('Entering Oakridge District: Experience Young Carter\'s humble origins.', 'info');
  }, [addNotification]);

  // Complete Story Prologue & Transition to Adult Officer Carter
  const handleCompletePrologue = useCallback(
    (chosenPlaystyle?: PreferredPlayStyle) => {
      if (isReplayingPrologue) {
        setIsPrologueOpen(false);
        setIsReplayingPrologue(false);
        if (engineRef.current) {
          engineRef.current.endPrologueMode(playerProfile.outfit);
        }
        addNotification(`Story Prologue concluded. Resuming Officer Carter's active career.`, 'success');
        return;
      }

      const finalPlayStyle = chosenPlaystyle || playerProfile.playStyle || 'balanced';
      const updatedProfile: PlayerProfileSettings = {
        ...playerProfile,
        playStyle: finalPlayStyle,
        hasCompletedIntro: true,
        lastPlayedAt: new Date().toISOString(),
      };
      setPlayerProfile(updatedProfile);
      setHasSavedGame(true);

      // Playstyle starting bonuses
      let startingStats = { ...INITIAL_PLAYER_STATS };
      if (finalPlayStyle === 'underworld') {
        startingStats.money += 1000;
        startingStats.secretEarnings = 1000;
        startingStats.underworldReputation = 55;
        startingStats.reputation = 60;
      } else if (finalPlayStyle === 'law_enforcement') {
        startingStats.policeReputation = 80;
        startingStats.integrity = 90;
        startingStats.iaViolations = 0;
      }
      if (playerProfile.difficulty === 'easy') {
        startingStats.armor = 125;
        startingStats.maxArmor = 125;
        startingStats.money += 500;
      }

      setStats(startingStats);
      setWeapons(INITIAL_WEAPONS);
      setMissions(STORY_MISSIONS);
      setCases(CRIME_CASES);
      setCurrentMissionId(STORY_MISSIONS[0].id);

      if (engineRef.current) {
        engineRef.current.endPrologueMode(playerProfile.outfit);
        engineRef.current.stats = { ...startingStats };
        engineRef.current.weapons = INITIAL_WEAPONS;
        authoritativeEncounterManager.reset();
        engineRef.current.setMission(STORY_MISSIONS[0]);
      }

      persistProgressToCloud(
        startingStats,
        INITIAL_WEAPONS,
        STORY_MISSIONS,
        CRIME_CASES,
        {
          ...customization,
          outfit: playerProfile.outfit,
        },
        updatedProfile
      );

      setIsPrologueOpen(false);
      setIsWelcomeScreenOpen(false);
      setIsMainMenuOpen(false);
      setBriefingOpen(true);
      cinematicMusicEngine.startSequence('mission');
      addNotification(
        `Welcome to Precinct 9, ${playerProfile.callsign}. Chapter 1 commenced.`,
        'success'
      );
    },
    [isReplayingPrologue, playerProfile, customization, persistProgressToCloud, addNotification]
  );

  const handleSkipToAdultCareer = useCallback(() => {
    if (isReplayingPrologue) {
      setIsPrologueOpen(false);
      setIsReplayingPrologue(false);
      if (engineRef.current) {
        engineRef.current.endPrologueMode(playerProfile.outfit);
      }
      addNotification(`Resumed active career as Officer Carter.`, 'info');
      return;
    }
    handleCompletePrologue();
  }, [isReplayingPrologue, handleCompletePrologue, playerProfile.outfit, addNotification]);

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
          cinematicMusicEngine.unlockAudio();
          soundEngine.startAmbientCity();
          soundEngine.toggleSiren(false);
        }}
        onTouchStart={() => {
          cinematicMusicEngine.unlockAudio();
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
        onOpenMenu={() => {
          setPauseMenuInitialTab('missions');
          setIsMenuOpen(true);
        }}
        onOpenMainMenu={() => setIsMainMenuOpen(true)}
        onOpenCases={() => setIsCasesOpen(true)}
        isFlashlightOn={isFlashlightOn}
        onToggleFlashlight={handleToggleFlashlight}
        onToggleCamera={() => setIsCameraOpen((prev) => !prev)}
        cloudSyncStatus={cloudSyncStatus}
        onToggleFullscreen={handleToggleFullscreen}
        timeOfDay={timeOfDay}
        onToggleTimeOfDay={handleCycleTimeOfDay}
        nearbyBuildingEntrance={nearbyBuildingEntrance}
        nearbyInteriorInteractable={nearbyInteriorInteractable}
        activeInterior={activeInterior}
        onExitBuilding={handleExitBuilding}
        damageFlash={damageFlash}
        onOpenDualIdentity={() => setIsDualIdentityOpen(true)}
        onExitVehicle={handleExitVehicle}
        offDutyTracking={offDutyTracking}
        onToggleOffDutyTracking={handleToggleOffDutyTracking}
        onOpenGuide={handleOpenGuide}
        nearbyEvidence={nearbyEvidence}
        onCollectEvidence={() => nearbyEvidence && handleCollectEvidence(nearbyEvidence)}
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
        canEnterBuilding={canEnterBuilding}
        onEnterBuilding={handleEnterBuilding}
        canExitBuilding={canExitBuilding}
        onExitBuilding={handleExitBuilding}
        interiorInteractLabel={interiorInteractLabel}
        onInteriorInteract={handleInteriorInteract}
        onExitVehicle={handleExitVehicle}
        canRescueHostage={!!canRescueHostage}
        onRescueHostage={handleRescueHostage}
        canCollectEvidence={!!nearbyEvidence && !nearbyEvidence.collected}
        onCollectEvidence={() => nearbyEvidence && handleCollectEvidence(nearbyEvidence)}
      />

      {/* DYNAMIC 911 CALL BANNER */}
      <DynamicEventBanner
        event={activeDynamicEvent}
        onRespond={handleRespondDynamicEvent}
        onDismiss={handleDismissDynamicEvent}
      />

      {/* OFFICER CARTER MORAL DILEMMA MODAL */}
      <EventChoiceModal
        isOpen={!!activeEventChoice}
        event={activeEventChoice}
        onClose={() => setActiveEventChoice(null)}
        onMakeChoice={handleMakeEventChoice}
        carterReputation={stats.reputation}
      />

      {/* FORENSIC CAMERA OVERLAY */}
      <ForensicCameraOverlay
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onTakePhoto={handleTakePhoto}
        targetEvidenceTitle={nearbyEvidence?.title}
        isNearEvidence={!!nearbyEvidence}
      />

      {/* OFFICER CARTER DOUBLE-LIFE ARREST, EVIDENCE & BOOKING MODAL */}
      <ArrestEvidenceModal
        suspect={arrestEvidenceSuspect}
        isOpen={!!arrestEvidenceSuspect}
        onClose={() => setArrestEvidenceSuspect(null)}
        onApplyArrestResult={handleApplyArrestResult}
        onTransportSuspect={handleTransportSuspectFromModal}
        onReleaseSuspect={handleReleaseSuspectFromModal}
        stats={stats}
        witnessesNearby={engineRef.current ? engineRef.current.countNearbyWitnesses() : 0}
      />

      {/* SUSPECT INTERROGATION & FRISK MODAL */}
      <InterrogationModal
        suspect={interrogationSuspect}
        isOpen={!arrestEvidenceSuspect && !!interrogationSuspect}
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

      {/* BANK VALUABLES & MORAL DILEMMA MODAL */}
      <BankValuablesModal
        isOpen={!!bankValuablesTarget}
        interactable={bankValuablesTarget}
        onClose={() => setBankValuablesTarget(null)}
        onApplyResult={handleApplyValuablesResult}
        carterReputation={stats.reputation}
      />

      {/* OFFICER CARTER'S DUAL IDENTITY & UNDERGROUND OPPORTUNITIES MODAL */}
      <DualIdentityModal
        isOpen={isDualIdentityOpen}
        onClose={() => setIsDualIdentityOpen(false)}
        stats={stats}
        witnessCountNearby={engineRef.current ? engineRef.current.countNearbyWitnesses() : 0}
        onUnderworldOpportunityLaunch={handleLaunchUnderworldOpportunity}
      />

      {/* METRO COMMERCIAL BANK SAVINGS & VAULT MODAL */}
      {isBankModalOpen && (
        <BankModal
          stats={stats}
          onClose={() => setIsBankModalOpen(false)}
          onDeposit={handleBankDeposit}
          onWithdraw={handleBankWithdraw}
          onConvertValuable={handleBankConvertValuable}
          onStoreValuable={handleBankStoreValuable}
          onRetrieveValuable={handleBankRetrieveValuable}
        />
      )}

      {/* PRECINCT 9 EVIDENCE LOCKER MODAL */}
      {isEvidenceLockerOpen && (
        <EvidenceLockerModal
          stats={stats}
          onClose={() => setIsEvidenceLockerOpen(false)}
          onLogEvidenceHonor={handleLogEvidenceHonor}
          onPocketContrabandCorrupt={handlePocketContrabandCorrupt}
        />
      )}

      {/* INTERIOR MERCHANT SHOP MODAL */}
      {activeMerchantBuildingId && (
        <InteriorMerchantModal
          buildingId={activeMerchantBuildingId}
          stats={stats}
          onClose={() => setActiveMerchantBuildingId(null)}
          onPurchaseItem={handlePurchaseMerchantItem}
        />
      )}

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

      {/* FINAL CAMPAIGN CHAPTER 8: DEATH BEFORE BETRAYAL CINEMATIC */}
      {finalMissionCinematic && (
        <DeathBeforeBetrayalCinematic
          isOpen={finalMissionCinematic.isOpen}
          initialPhase={finalMissionCinematic.initialPhase}
          mission={missions.find((m) => m.id === 'ch8_death_before_betrayal') || missions[0]}
          stats={stats}
          onChoiceASelected={handleFinalMissionChoiceASelected}
          onChoiceBSelected={handleFinalMissionChoiceBSelected}
          onRestartMission={handleFinalMissionRestart}
          onContinueFreeRoam={handleFinalMissionContinueFreeRoam}
          onClose={() => setFinalMissionCinematic(null)}
        />
      )}

      {/* CHAPTER 9: ONE SMALL MATTER CINEMATIC & MORAL CLIMAX MODAL */}
      {oneSmallMatterModalState && (
        <OneSmallMatterModal
          isOpen={oneSmallMatterModalState.isOpen}
          phase={oneSmallMatterModalState.phase}
          mission={missions.find((m) => m.id === 'ch9_one_small_matter') || missions[0]}
          stats={stats}
          earlyChoice={oneSmallMatterModalState.earlyChoice}
          onSelectEarlyChoice={handleOneSmallMatterEarlyChoice}
          onDeployToDisaster={handleOneSmallMatterDeployToDisaster}
          onSelectFinalChoice={handleOneSmallMatterFinalChoice}
          onRestartMission={handleOneSmallMatterRestart}
          onContinueFreeRoam={handleOneSmallMatterContinueFreeRoam}
          onClose={() => setOneSmallMatterModalState(null)}
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
        initialTab={pauseMenuInitialTab}
        missions={missions}
        currentMissionId={currentMissionId}
        playerProfile={playerProfile}
        onOpenEditProfile={() => {
          setIsMenuOpen(false);
          setIsEditingProfile(true);
          setIsProfileSetupOpen(true);
        }}
        onSelectMission={handleSelectMission}
        onPlayPrologue={handlePlayPrologue}
        weapons={weapons}
        stats={stats}
        onBuyOrUpgradeWeapon={handleBuyOrUpgradeWeapon}
        onUpgradeArmorOrHealth={handleUpgradeArmorOrHealth}
        customization={customization}
        onChangeOutfit={handleChangeOutfit}
        characterAesthetic={characterAesthetic}
        onChangeCharacterAesthetic={handleChangeAesthetic}
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
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onChangeMusicVolume={handleMusicVolumeChange}
        onChangeSfxVolume={handleSfxVolumeChange}
        isMusicMuted={isMusicMuted}
        isSfxMuted={isSfxMuted}
        onToggleMusicMute={handleToggleMusicMute}
        onToggleSfxMute={handleToggleSfxMute}
        isMusicPaused={isMusicPaused}
        onToggleMusicPause={handleToggleMusicPause}
        currentTrackInfo={currentTrackInfo}
        onSelectTheme={handleSelectTheme}
      />

      {/* MAIN MENU */}
      <MainMenu
        isOpen={isMainMenuOpen}
        onContinue={() => setIsMainMenuOpen(false)}
        onNewGame={handleNewGame}
        onPlayPrologue={handlePlayPrologue}
        characterAesthetic={characterAesthetic}
        onChangeAesthetic={handleChangeAesthetic}
        playerProfile={playerProfile}
        onOpenProfileSetup={() => {
          setIsMainMenuOpen(false);
          setIsEditingProfile(true);
          setIsProfileSetupOpen(true);
        }}
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
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onChangeMusicVolume={handleMusicVolumeChange}
        onChangeSfxVolume={handleSfxVolumeChange}
        isMusicMuted={isMusicMuted}
        isSfxMuted={isSfxMuted}
        onToggleMusicMute={handleToggleMusicMute}
        onToggleSfxMute={handleToggleSfxMute}
        isMusicPaused={isMusicPaused}
        onToggleMusicPause={handleToggleMusicPause}
        currentTrackInfo={currentTrackInfo}
        onSelectTheme={handleSelectTheme}
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

      {/* WELCOME SCREEN */}
      <WelcomeScreen
        isOpen={isWelcomeScreenOpen}
        hasSavedGame={hasSavedGame}
        savedStats={stats}
        savedProfile={playerProfile}
        lastSavedAt={lastSavedAt}
        onContinue={handleContinueCareer}
        onStartNewGame={handleStartNewGameFromWelcome}
        onPlayPrologue={handlePlayPrologue}
        isMusicMuted={isMusicMuted}
        onToggleMusicMute={handleToggleMusicMute}
      />

      {/* CHARACTER & PROFILE SETUP MODAL */}
      <ProfileSetupModal
        isOpen={isProfileSetupOpen}
        initialProfile={playerProfile}
        isEditing={isEditingProfile}
        onConfirm={handleConfirmProfileSetup}
        onCancel={() => {
          setIsProfileSetupOpen(false);
          setIsEditingProfile(false);
        }}
      />

      {/* STORY-DRIVEN PROLOGUE & PLAYABLE TUTORIAL */}
      <PrologueStoryExperience
        isOpen={isPrologueOpen}
        profile={playerProfile}
        onCompletePrologue={handleCompletePrologue}
        onSkipToAdultCareer={handleSkipToAdultCareer}
        onSetWaypoint={(x, z) => engineRef.current?.setWaypointPosition(x, z, true)}
        playerPos={playerPos}
        onStartEnginePrologue={() => engineRef.current?.startPrologueMode()}
        onEndEnginePrologue={() => engineRef.current?.endPrologueMode(playerProfile.outfit)}
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
