# v25 - Complete Bug Fix Summary

**Version:** 25  
**Date:** 2026-05-29  
**Status:** ✅ READY FOR TESTING  

---

## Overview

v25 fixes CRITICAL bugs that were preventing border persistence across role transitions in the First Night MDJ mode. These bugs made borders from completed roles (Cupidon, Voyante, Enfant_Sauvage, etc) disappear when switching to the next role.

**Root Cause:** Multiple ID vs Name confusion issues throughout the codebase.

---

## Bugs Fixed (4 Critical Issues)

### Bug #1: ID Lookup in updateMapForRole() - CRITICAL ❌→✅

**Location:** Lines 1134-1187  
**Severity:** CRITICAL - Broke border persistence entirely

**What was wrong:**
```javascript
// WRONG - Tries to match names but targets are stored as IDs!
state.result.targets.forEach(targetName => {
  const player = players.find(p => p.name === targetName);  // ❌ FAILS!
  if (player) playersWithCompletedEffects.add(player.id);
});
```

**Why it failed:**
- `state.result.targets` contains IDs like: `["p0", "p2", "p5"]`
- Code tries to find players by name: `find(p => p.name === "p0")`  
- No player has name "p0" → lookup fails → player not added to protected set
- Result: `playersWithCompletedEffects` stays EMPTY
- When clearing unprotected players (line 1200-1206), ALL borders cleared!

**Fix applied:**
```javascript
// CORRECT - Match IDs directly
state.result.targets.forEach(targetId => {
  if (targetId && !targetId.startsWith('potion-')) {
    playersWithCompletedEffects.add(targetId);  // ✓ Direct ID match
  }
});
```

**Affected roles:** Cupidon, Enfant_Sauvage, Salvateur, Corbeau, Voyante, Renard

---

### Bug #2: Missing restoreCompletedRoleEffects() in selectRole() - CRITICAL ❌→✅

**Location:** Lines 2595-2600  
**Severity:** CRITICAL - Borders disappeared on role transition

**What was wrong:**
When user clicked a different role in the listbox, the flow was:
```javascript
selectRole(roleId) {
  this.renderLiveMap();        // ✓ Fresh HTML created
  this.updateMapForRole();      // ✓ Current role effects shown
  this.renderActionButtons();   // ✓ Action UI updated
  // ❌ MISSING: restore completed role effects!
}
```

**Why it failed:**
1. `renderLiveMap()` creates fresh player points in HTML
2. `updateMapForRole()` applies borders for CURRENT role only
3. But borders from OTHER completed roles are never restored
4. Result: Only current role's borders visible, all others gone

**Fix applied:**
```javascript
selectRole(roleId) {
  this.renderLiveMap();
  this.updateMapForRole();
  this.restoreCompletedRoleEffects();  // ✓ Restore others' borders!
  this.renderActionButtons();
}
```

---

### Bug #3: updateMapForCupidon() Clearing All Borders - HIGH ❌→✅

**Location:** Lines 1467-1474  
**Severity:** HIGH - Destroyed other role borders while selecting lovers

**What was wrong:**
```javascript
// WRONG - Clears ALL border effects!
mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
  point.classList.remove('affected');          // ❌ Removes ALL!
  const dot = point.querySelector('.mdj-point-dot');
  if (dot) {
    dot.style.setProperty('--affected-border', 'transparent');  // ❌ Clears ALL!
  }
});
```

**Why it failed:**
- When user was selecting Cupidon lovers, this function ran
- It cleared ALL `.affected` borders on the map
- Even Voyante's border or Enfant_Sauvage's border got cleared
- Cupidon's borders appeared, but others were gone

**Fix applied:**
- Removed the clearing logic entirely
- Now only applies Cupidon's border color to selected lovers
- Other role borders remain untouched

---

### Bug #4: completeRoleAction() Storing Names Instead of IDs - CRITICAL ❌→✅

**Location:** Line 2357  
**Severity:** CRITICAL - Made ID lookups impossible

**What was wrong:**
```javascript
// WRONG - Converting IDs to names and storing names!
const targetNamesList = this.selectedPlayers.map(id => {
  const player = players.find(p => p.id === id);
  return player?.name || '?';  // ❌ Return NAME not ID!
});

// Store names in targets
this.roleStates[this.selectedRoleId].result = {
  targets: targetNamesList  // ❌ Stored: ["Emmanuel", "Sophie"]
};
```

**Why it failed:**
- `this.selectedPlayers` contains: `["p0", "p2"]` (IDs)
- Code converts to names: `["Emmanuel", "Sophie"]`
- Stores names in targets
- Later, ID-based lookups fail: `players.find(p => p.id === "Emmanuel")` → null
- Borders not restored because target lookup failed

**Fix applied:**
```javascript
// CORRECT - Store IDs directly
this.roleStates[this.selectedRoleId].result = {
  targets: this.selectedPlayers  // ✓ Store: ["p0", "p2"]
};
```

**Why this is better:**
- IDs are the source of truth (never change)
- Names can change, be localized, etc
- Consistent with how the system treats player references elsewhere
- All lookups work reliably

---

### Also Fixed: Cupidon Action Storing Names

**Location:** Line 2414  
**Fix:** Changed to store IDs

```javascript
// BEFORE
targets: [lover1Name, lover2Name]

// AFTER  
targets: [lover1.id, lover2.id]
```

---

## Complete Data Flow (After v25 Fixes)

### Step 1: User Selects Cupidon and Chooses 2 Lovers
```
selectedPlayers = ["p1", "p3"]
Click validate
→ completeCupidonAction()
```

### Step 2: Action Completed (CORRECT in v25)
```
roleStates['Cupidon'] = {
  completed: true,
  result: {
    action: 'lover',
    targets: ["p1", "p3"]  // ✓ IDs stored
  }
}
```

### Step 3: User Switches to Voyante Role
```
selectRole('Voyante')
  → renderLiveMap()           // Fresh HTML
  → updateMapForRole()         // Show Voyante borders
  → restoreCompletedRoleEffects()
    → updateMapForRole() runs, tries to protect Cupidon's lovers
    → Gets Cupidon roleState: targets = ["p1", "p3"]
    → Adds "p1" and "p3" to playersWithCompletedEffects  // ✓ IDs match!
    → When clearing borders, "p1" and "p3" are PROTECTED
    → Cupidon lovers' borders PERSIST ✓
```

### Step 4: Render Map With Both Sets of Borders
```
🎯 Cupidon lovers (p1, p3) → Pink border (preserved)
🎯 Voyante target (p7) → Purple border (current role)
Both visible simultaneously! ✓
```

---

## Testing Summary

### Quick Test (2 minutes)
1. Select Cupidon → click 2 lovers → validate
2. Switch to another role
3. **Expected:** Lovers still have colored border ✓

### Full Test (5 minutes)
1. Complete Cupidon (lovers get border)
2. Complete Enfant_Sauvage (idol gets different border)
3. Complete Voyante (target gets border)
4. Switch between these roles
5. **Expected:** All 3 borders visible together ✓

### Complete Night Test (10 minutes)
1. Play through entire first night
2. Do Cupidon → Enfant_Sauvage → Voyante → Salvateur → Wolves → Sorciere
3. At end, verify night summary shows all deaths
4. Move to Day phase
5. **Expected:** No errors, all roles complete ✓

---

## Files Changed

**Main file:** `03-FirstNight-MDJ.js`
- Version: 24 → 25
- Lines modified: 4 major sections
  1. Lines 1134-1187: ID lookups fixed
  2. Lines 1463-1491: Cupidon clearing removed
  3. Lines 2357: Store IDs not names
  4. Lines 2414: Cupidon store IDs
  5. Lines 2595-2600: Restoration call added

**New documentation:**
- `v25_BORDER_PERSISTENCE_FIXES.md` - Detailed testing guide
- `v25_COMPLETE_SUMMARY.md` - This file

---

## Browser Cache

⚠️ **IMPORTANT:** Clear your browser cache before testing!

**Windows:**
```
Ctrl + Shift + R
```

**Mac:**
```
Cmd + Shift + R
```

If still showing v24, hard refresh or clear cache completely.

---

## Console Messages

**Good signs to see:**
```
VERSION 25
v25: Border persistence FIXED | ID lookups corrected | Restoration on role transition

[MDJ] Calling restoreCompletedRoleEffects() to restore borders from other roles
[MDJ] Cupidon restore - applied border color: #ff69b4
[MDJ] Voyante restore - applied border color: #7b357a
```

**Bad signs (problems):**
```
[MDJ] ... restore - target: NOT FOUND
[MDJ] ... restore - SKIPPED: target=null

(Missing VERSION 25 message)
```

---

## Expected Results After v25

| Feature | Before v25 | After v25 |
|---------|-----------|----------|
| Cupidon border persists | ❌ Disappears | ✅ Stays |
| Multiple role borders visible | ❌ Only 1 at a time | ✅ All 3-4 visible |
| Switching roles | ❌ Borders gone | ✅ Borders persist |
| ID lookups | ❌ Fail (name mismatch) | ✅ Work (ID match) |
| First night completion | ❌ Sporadic | ✅ Reliable |

---

## Technical Notes

### Why ID vs Name Matters

**IDs** (p0, p1, p2):
- Assigned once at game start
- Never change during the game
- Unique per player
- Perfect for lookups

**Names** (Emmanuel, Sophie):
- Can be the same across games
- Could theoretically be localized
- User-facing display only
- Should NOT be used for lookups

### The Data Model

Player data structure:
```javascript
{
  id: "p0",           // ✓ For lookups and storage
  name: "Emmanuel",   // ✓ For display only
  role: "Cupidon",
  isDead: false,
  // ... other properties
}
```

Target storage:
```javascript
targets: ["p0", "p2"]  // ✓ Always use IDs
```

---

## Next Steps If Issues Found

If testing finds remaining issues:

1. **Borders still disappear** → Check console for "NOT FOUND" messages
2. **Specific role's border not persisting** → Look for that role in updateMapForRole
3. **Dead player visualization issues** → Separate from border persistence
4. **Night summary problems** → Check renderNightSummary function

---

Generated: 2026-05-29  
Status: ✅ Ready for comprehensive testing

**Previous versions:**
- v24: Dead player tracking, Sorciere names, Night summary
- v23: Wolf pack breathing, border fixes attempt 1
- v22: Initial MDJ interface

**Next version candidate:**
- v26: Additional UI polish, performance optimization
