# Fixes Applied - First Night Logging Issues

## Summary of Changes

### 1. **Sorcière Victim Display & Logging** ✓
**Problem**: `wolvesVictim` was being reset to `null` immediately after wolves logging, before the Sorcière screen could display the victim card and name.

**Fix**: 
- Moved the `gm.state.wolvesVictim = null` reset out of the main reset block (line 1493)
- Added reset of `gm.state.wolvesVictim = ''` AFTER Sorcière processing (after line 1374)
- Now the victim data is available for the Sorcière to see and use before being cleared

**Location**: Lines 1493 (commented out), 1375 (reset moved here)

### 2. **Enfant Sauvage Idol Logging** ✓
**Problem**: Enfant Sauvage's idol choice was stored in `gm.state.enfantSauvageIdol`, but the validation was checking for `Enfant_SauvageTarget` (type 'selectOne'), causing a mismatch.

**Fix**:
- Changed `ROLE_ACTIONS['Enfant_Sauvage'].type` from `'selectOne'` to `'enfantSauvageIdol'`
- Now the validation function `isActionComplete()` checks the correct state key
- The logging function `gm.enfantSauvageIdol()` is properly called

**Location**: Line 33 in ROLE_ACTIONS definition

### 3. **Wolves Logging - First Wolf Detection Fixed** ✓
**Problem**: The logic to detect "first wolf" was checking against a fixed order (wolvesInOrder), but the actual wolves could appear in any order in availableRoles (depending on what roles were selected). This could cause wolves logging to not trigger if the first selected wolf wasn't Simple_Loup_Garou.

**Fix**:
- Changed logic to find the ACTUAL first wolf in availableRoles
- `firstWolfRoleIdx = availableRoles.findIndex(r => wolvesRoles.includes(r))`
- `isFirstWolf = firstWolfRoleIdx === currentRoleIdx`
- Now wolves logging triggers exactly once, when processing whichever wolf type appears first

**Location**: Lines 1447-1450

### 4. **Debug Console Logs Removed** ✓
**Removed**: Console.log statements that were in the Sorcière IIFE (lines 758-762)
- These were used to debug but are no longer needed
- Cleaned up code for production

**Location**: Lines 756-762

---

## Expected Results After These Fixes

### ✓ Sorcière Should Now:
1. **Display victim card and name** with image from cards/ directory
2. **Show three action buttons** (Save, Kill, Nothing) with working halo effects
3. **Properly log chosen action** in game log (save the victim, poison someone, or do nothing)

### ✓ Enfant Sauvage Should Now:
1. **Log the idol choice** in game log: "👦 J2 (Enfant Sauvage) a choisi J5 comme idole"
2. **Enable the "Suivant" button** only when an idol has been selected
3. **Properly validate** that the choice was made before advancing

### ✓ Loup Blanc Should:
1. **Log separately** when killing another wolf: "⚪ J11 (Loup Blanc) tue le loup J10"
2. **Be included in main wolves log** with all other wolves

### ✓ All Wolves Should:
1. **Appear in the main wolves kill log** including transformed Chien Loup
2. **Show all identities**: "🐺 Loups-Garous (J3, J8, J9, J10, J11) mangent J4 cette nuit!"
3. **Include Chien Loup after transformation** (J3 becomes Simple_Loup_Garou)

---

## Code Flow Verification

**Order of First Night Roles** (from ROLE_ORDER):
1. Cupidon → Enfant_Sauvage → **Chien_Loup** (transforms if chooses 'loup')
2. ... other roles ...
3. **Simple_Loup_Garou** (triggers ALL wolves logging, including transformed Chien Loup)
4. ... other wolf types ...
5. **Sorcière** (can now see who was eaten by wolves)

**State persistence**: When Chien Loup chooses 'loup':
- `gm.chienLoupChoice()` transforms his roleId to 'Simple_Loup_Garou'
- `gm.saveState()` persists the change
- Later, wolves filter includes him: `roleId === 'Simple_Loup_Garou'` ✓

---

## Testing Checklist

- [ ] Chien Loup chooses to become wolf → "J3 devient Loup Garou"
- [ ] Loups all show with victim: "Loups-Garous (J3, J8, J9, J10, J11) mangent J4"
- [ ] Loup Blanc shows separate kill: "Loup Blanc kills J10" OR similar
- [ ] Sorcière sees victim card and name displayed
- [ ] Sorcière can save/kill/do-nothing and logs properly
- [ ] Enfant Sauvage idol choice is logged: "J2 choisit J5 comme idole"

---

## Files Modified
- `03-FirstNight.js`: Lines 33, 756-762, 1375, 1447-1450, 1493

