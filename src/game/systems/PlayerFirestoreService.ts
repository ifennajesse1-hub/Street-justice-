import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { PlayerStats, WeaponConfig, Mission, CustomizationSettings } from '../../types/game';
import { CrimeCase } from './InvestigationSystem';

export interface PlayerCloudDocument {
  userId: string;
  money: number;
  xp: number;
  rank: number;
  rankName: string;
  reputation: number;
  kills: number;
  arrests: number;
  missionsCompleted: number;
  civiliansRescued: number;
  evidenceFound: number;
  iaViolations: number;
  unlockedWeapons: string[];
  weaponUpgradeLevels: Record<string, number>;
  completedMissions: string[];
  solvedCases: string[];
  outfit: string;
  vehicleColor: string;
  sirenType: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export async function fetchPlayerProfile(userId: string): Promise<PlayerCloudDocument | null> {
  const docRef = doc(db, 'players', userId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as PlayerCloudDocument;
  } catch (error: any) {
    if (error?.code === 'unavailable' || String(error?.message || '').includes('offline') || String(error?.message || '').includes('unavailable')) {
      console.warn('Firestore offline or unreachable, running in local offline storage mode.');
      return null;
    }
    handleFirestoreError(error, OperationType.GET, `players/${userId}`);
  }
}

export async function createPlayerProfile(
  userId: string,
  stats: PlayerStats,
  weapons: WeaponConfig[],
  missions: Mission[],
  cases: CrimeCase[],
  customization: CustomizationSettings
): Promise<void> {
  const docRef = doc(db, 'players', userId);

  const weaponUpgradeLevels: Record<string, number> = {};
  weapons.forEach((w) => {
    weaponUpgradeLevels[w.id] = w.upgradeLevel;
  });

  const payload = {
    userId,
    money: stats.money,
    xp: stats.xp,
    rank: stats.rank,
    rankName: stats.rankName,
    reputation: stats.reputation,
    integrity: stats.integrity ?? 75,
    bankSavings: stats.bankSavings ?? 0,
    kills: stats.kills,
    arrests: stats.arrests,
    missionsCompleted: stats.missionsCompleted,
    civiliansRescued: stats.civiliansRescued,
    evidenceFound: stats.evidenceFound,
    iaViolations: stats.iaViolations,
    unlockedWeapons: weapons.filter((w) => w.unlocked).map((w) => w.id),
    weaponUpgradeLevels,
    completedMissions: missions.filter((m) => m.completed).map((m) => m.id),
    solvedCases: cases.filter((c) => c.isSolved).map((c) => c.id),
    outfit: customization.outfit,
    vehicleColor: customization.vehicleColor,
    sirenType: customization.sirenType,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable' || String(error?.message || '').includes('offline') || String(error?.message || '').includes('unavailable')) {
      console.warn('Firestore offline or unreachable during profile create, queued for local sync.');
      return;
    }
    handleFirestoreError(error, OperationType.CREATE, `players/${userId}`);
  }
}

export async function updatePlayerProfile(
  userId: string,
  stats: PlayerStats,
  weapons: WeaponConfig[],
  missions: Mission[],
  cases: CrimeCase[],
  customization: CustomizationSettings
): Promise<void> {
  const docRef = doc(db, 'players', userId);

  const weaponUpgradeLevels: Record<string, number> = {};
  weapons.forEach((w) => {
    weaponUpgradeLevels[w.id] = w.upgradeLevel;
  });

  const payload = {
    money: stats.money,
    xp: stats.xp,
    rank: stats.rank,
    rankName: stats.rankName,
    reputation: stats.reputation,
    integrity: stats.integrity ?? 75,
    bankSavings: stats.bankSavings ?? 0,
    kills: stats.kills,
    arrests: stats.arrests,
    missionsCompleted: stats.missionsCompleted,
    civiliansRescued: stats.civiliansRescued,
    evidenceFound: stats.evidenceFound,
    iaViolations: stats.iaViolations,
    unlockedWeapons: weapons.filter((w) => w.unlocked).map((w) => w.id),
    weaponUpgradeLevels,
    completedMissions: missions.filter((m) => m.completed).map((m) => m.id),
    solvedCases: cases.filter((c) => c.isSolved).map((c) => c.id),
    outfit: customization.outfit,
    vehicleColor: customization.vehicleColor,
    sirenType: customization.sirenType,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable' || String(error?.message || '').includes('offline') || String(error?.message || '').includes('unavailable')) {
      console.warn('Firestore offline or unreachable during profile update, continuing locally.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, `players/${userId}`);
  }
}
