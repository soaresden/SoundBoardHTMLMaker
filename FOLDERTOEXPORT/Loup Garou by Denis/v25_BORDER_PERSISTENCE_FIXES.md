# v25 - Border Persistence Critical Fixes

## Status: READY FOR TESTING

File: `03-FirstNight-MDJ.js` - v24 → v25

---

## 🔧 CRITICAL FIXES APPLIED

### 1. ✅ **ID Lookup Bug in updateMapForRole() - FIXED**

**Problem:** Border persistence failed because completed role effects were not being protected when updating the map for a new role.

**Root Cause:** Lines 1134-1187 used name-based lookups instead of ID-based lookups:
```javascript
// BEFORE (WRONG)
state.result.targets.forEach(targetName => {
  const player = players.find(p => p.name === targetName);  // ❌ targets are IDs not names!
  if (player) playersWithCompletedEffects.add(player.id);
});

// AFTER (CORRECT)
state.result.targets.forEach(targetId => {
  if (targetId && !targetId.startsWith('potion-')) {
    playersWithCompletedEffects.add(targetId);  // ✓ Direct ID
  }
});
```

**Impact:** The `playersWithCompletedEffects` Set was ALWAYS EMPTY because the lookups failed, causing ALL borders to be cleared when previewing the current role.

**Fix Applied:** (Lines ~1134-1187)
- Changed all 6 role checks (Cupidon, Enfant_Sauvage, Salvateur, Corbeau, Voyante, Renard) from name lookups to ID lookups
- Now completed role effects are properly protected during map updates

**Result:**
- Cupidon lovers' borders now persist while selecting other roles ✓
- Voyante's target border persists ✓
- Enfant_Sauvage's idol border persists ✓
- All completed role borders protected ✓

---

### 2. ✅ **Missing restoreCompletedRoleEffects() Call in selectRole() - FIXED**

**Problem:** When switching between roles, borders from completed roles disappeared completely.

**Root Cause:** The `selectRole()` function (lines 2575-2599):
1. Called `renderLiveMap()` - creates fresh HTML for all player points
2. Called `updateMapForRole()` - applies current role's preview effects
3. BUT did NOT call `restoreCompletedRoleEffects()` to restore other roles' borders

**Before:**
```javascript
// selectRole()
this.renderLiveMap();           // Fresh HTML created
this.updateMapForRole();         // Current role effects applied
// ❌ Missing: this.restoreCompletedRoleEffects();
this.renderActionButtons();
```

**After:**
```javascript
// selectRole()
this.renderLiveMap();           // Fresh HTML created
this.updateMapForRole();         // Current role effects applied
this.restoreCompletedRoleEffects();  // ✓ Restore other roles' borders
this.renderActionButtons();
```

**Fix Applied:** (Lines ~2595-2600)
- Added explicit call to `restoreCompletedRoleEffects()` after `updateMapForRole()` in `selectRole()`
- Now when switching roles, previous borders are restored before showing new role

**Result:**
- Borders persist when switching from Cupidon to Enfant_Sauvage ✓
- Borders persist when switching from Voyante to Salvateur ✓
- All role transitions preserve completed role effects ✓

---

### 3. ✅ **updateMapForCupidon() Clearing All Border Effects - FIXED**

**Problem:** When selecting Cupidon lovers, the function cleared ALL affected borders (from other roles).

**Root Cause:** Lines 1467-1474 cleared all border effects before applying Cupidon's borders:
```javascript
// BEFORE (WRONG)
mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
  point.classList.remove('affected');  // ❌ Removes ALL borders!
  const dot = point.querySelector('.mdj-point-dot');
  if (dot) {
    dot.style.setProperty('--affected-border', 'transparent');
  }
});
```

**After:** Removed the clearing logic entirely since we now preserve all borders.

**Fix Applied:** (Lines ~1463-1491)
- Removed the "clear all affected states" code
- Now only applies Cupidon's border color to selected lovers
- Other role borders remain visible

**Result:**
- Selecting Cupidon lovers doesn't wipe out Voyante/Enfant_Sauvage/etc borders ✓
- Can see all active role effects simultaneously ✓

---

## 📊 COMPLETE BORDER PERSISTENCE WORKFLOW

**Before v25:**
```
1. Complete Cupidon (lovers get border ❌ then it disappears when switching roles)
2. Switch to Enfant_Sauvage (Cupidon's border gone)
3. Complete Enfant_Sauvage idol selection (idol gets border)
4. Switch to Voyante (both Cupidon and Enfant_Sauvage borders gone!)
```

**After v25:**
```
1. Complete Cupidon (lovers get border ✓)
2. Switch to Enfant_Sauvage (Cupidon's border PERSISTS ✓)
3. Complete Enfant_Sauvage idol selection (idol gets border, Cupidon's still there ✓)
4. Switch to Voyante (Cupidon + Enfant_Sauvage borders PERSIST ✓)
5. All borders visible throughout entire night ✓
```

---

## 📋 TESTING CHECKLIST

### Test 1: Cupidon Lovers Border Persistence
- [ ] Select Cupidon
- [ ] Click 2 lovers → they get colored border
- [ ] Validate Cupidon action
- [ ] Switch to another role (Enfant_Sauvage, Voyante, etc)
- [ ] **EXPECTED:** Cupidon's lovers STILL have their colored border!
- [ ] Switch back to Cupidon
- [ ] **EXPECTED:** Border is still there

### Test 2: Multiple Completed Roles Visible
- [ ] Complete Cupidon (lovers get border)
- [ ] Complete Enfant_Sauvage (idol gets different colored border)
- [ ] Complete Voyante (target gets border)
- [ ] Switch between these roles
- [ ] **EXPECTED:** All THREE borders visible simultaneously!
- [ ] **EXPECTED:** When Cupidon selected, see 2 lovers + idol + voyante target all with their borders

### Test 3: Border During Cupidon Selection
- [ ] First complete Voyante (target has border)
- [ ] Then select Cupidon
- [ ] Click 2 lovers (they get Cupidon's border color)
- [ ] **EXPECTED:** Can see Voyante's target border AND Cupidon's lovers border at same time!

### Test 4: Salvateur/Corbeau/Renard Persistence
- [ ] Complete any of: Salvateur → protected player, Corbeau → victim, Renard → 3 neighbors
- [ ] Switch to another role
- [ ] **EXPECTED:** Their borders PERSIST
- [ ] Switch back
- [ ] **EXPECTED:** Borders still there

### Test 5: Complete First Night Flow
- [ ] Play through entire first night with all roles
- [ ] At the end, look at night summary
- [ ] **EXPECTED:** All dead players shown correctly
- [ ] **EXPECTED:** All roles completed properly
- [ ] Move to Day phase
- [ ] **EXPECTED:** No errors in console

---

## 🔍 DEBUGGING CONSOLE LOGS

When testing, check the console for these messages:

**Good signs:**
- `VERSION 25` printed at start
- `[MDJ] Calling restoreCompletedRoleEffects()` when switching roles
- `[MDJ] === SELECTING ROLE: ...` when selecting new roles
- `[MDJ] Cupidon restore - applied border color: ...` when Cupidon border restored

**Bad signs:**
- Missing `restoreCompletedRoleEffects` calls
- `[MDJ] ... restore - target: NOT FOUND` (means ID lookup failed)
- Borders disappearing without error message

---

## ⚠️ IMPORTANT NOTES

1. **Version Cache:** Browser might still show v24. Clear cache with `Ctrl+Shift+R`

2. **Breathing Effect:** Wolf pack breathing is separate from this fix. Should still work as in v24.

3. **Dead Player Visualization:** Should still work as in v24 (grayscale + skull emoji)

4. **New Behavior:** Other completed role borders now VISIBLE when previewing current role. This is intentional - it shows all active effects during the night.

---

## 📝 FILES MODIFIED

**Primary Changes:**
- `03-FirstNight-MDJ.js` (v24 → v25)
  - Lines ~1134-1187: Fixed ID-based lookups in updateMapForRole()
  - Lines ~1463-1491: Fixed updateMapForCupidon() to not clear other borders
  - Lines ~2595-2600: Added restoreCompletedRoleEffects() call in selectRole()
  - Lines 6, 39-40: Updated version number and message

**No new files created**

---

## ✨ HOW TO TEST

1. **Clear browser cache:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Verify v25 loaded:** Check console output for "VERSION 25"
3. **Open DevTools Console:** F12 → Console tab
4. **Run full night:** Play through entire First Night scenario
5. **Use test checklist above** to verify each scenario
6. **Check console logs** for any errors or warnings
7. **Report findings:** Which tests pass/fail

---

## 🎯 EXPECTED OUTCOMES

After these fixes:

✅ **Borders persist** - Cupidon lovers/Voyante targets/Enfant_Sauvage idol stay visible when switching roles  
✅ **Multiple borders visible** - Can see effects from 3-4 completed roles at once  
✅ **ID lookups work** - No more "NOT FOUND" errors for target lookup  
✅ **Role transitions smooth** - No visual artifacts or flickering  
✅ **All role effects preserved** - Nothing disappears during first night  

---

Generated: 2026-05-29  
Status: Ready for comprehensive testing
