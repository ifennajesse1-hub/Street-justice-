# Security Specification: Street Justice Cloud Firestore

## 1. Data Invariants
1. **User Identity Boundary**: Every player document under `/players/{playerId}` must have `userId == request.auth.uid` and path variable `playerId == request.auth.uid`. A player can never read, modify, or overwrite another player's progress.
2. **Immutable Identity**: `userId` and `createdAt` cannot be changed after initial document creation.
3. **Temporal Integrity**: `createdAt` on creation and `updatedAt` on creation and update must match `request.time` exactly.
4. **State Boundaries & Types**:
   - `money`, `xp`, `rank`, `reputation`, `kills`, `arrests`, `missionsCompleted`, `civiliansRescued`, `evidenceFound`, `iaViolations` must be non-negative numbers.
   - `reputation` must be between 0 and 100.
   - `rank` must be an integer between 1 and 20.
   - `unlockedWeapons`, `completedMissions`, `solvedCases` must be lists with bounded length (`size() <= 50`).
   - `rankName`, `outfit`, `vehicleColor`, `sirenType` must be bounded strings.
5. **No Blind Global Reads**: Global list queries across players are forbidden. Only direct document gets by the authorized owner are permitted.

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/players/user_123` when `request.auth == null`.
2. **Cross-User Snooping**: Authenticated user `user_attacker` attempting `get` on `/players/user_victim`.
3. **Identity Spoofing Creation**: Authenticated user `user_1` attempting to create `/players/user_1` with payload `{ "userId": "user_2" }`.
4. **Path ID Mismatch Creation**: Authenticated user `user_1` attempting to create `/players/user_admin` with payload `{ "userId": "user_1" }`.
5. **Client-Spoofed CreatedAt**: Payload containing client-generated timestamp `{ "createdAt": "2020-01-01T00:00:00Z" }` instead of `request.time`.
6. **Immutable Field Tampering on Update**: Updating an existing document with a mutated `userId` or altered `createdAt`.
7. **Negative Money/XP Exploit**: Sending `{ "money": -50000 }` or `{ "xp": -9999 }`.
8. **Unbounded Array Injection (Denial of Wallet)**: Injecting an `unlockedWeapons` array with >1,000 items.
9. **Junk Path ID Injection**: Requesting document with a 2KB garbage string as `playerId` (`isValidId` failure).
10. **Type Poisoning**: Sending boolean or array for numeric field `{ "money": true }` or `{ "rank": "SupremeCommander" }`.
11. **Reputation Overflow Attack**: Attempting to set `{ "reputation": 999999 }` beyond the 0..100 boundary.
12. **Collection-Wide Scraping (List Query)**: Unconstrained `list` query on `/players` without owner condition.
