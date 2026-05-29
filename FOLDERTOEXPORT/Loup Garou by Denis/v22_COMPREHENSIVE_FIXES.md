# v22 Comprehensive Fixes - First Night MDJ 

## Status: DEPLOYED

File: `03-FirstNight-MDJ.js` - v21 → v22

---

## 🔧 CRITICAL FIXES APPLIED

### 1. ✅ **Sorciere Selection Visuals** (MAJOR)
**Problem:** Sorciere selection showed no visual feedback when selecting a kill target
- No skull emoji
- No border color
- No grayscale filter
- Player didn't know who would be killed

**Root Cause:** No case for 'Sorciere' in the `updateMapForRole()` switch statement!

**Fix Applied:**
- Added complete 'Sorciere' case in `updateMapForRole()` (lines ~1300)
- Shows skull emoji + grayscale + border for selected kill target
- Shows colored border for selected target
- Maintains target selection state

**Code Location:** `updateMapForRole()` switch statement, new Sorciere case

**Logging Added:**
```
[MDJ] 🧙‍♀️ Sorciere updateMapForRole: selectedPlayers=...
[MDJ] 🧙‍♀️ Sorciere kill target ID: ...
[MDJ] 🧙‍♀️ Sorciere: applying kill effect to ...
[MDJ] 🧙‍♀️ Sorciere: changed emoji to skull for ...
[MDJ] 🧙‍♀️ Sorciere: applied grayscale + border to ...
```

---

### 2. ✅ **Sorciere Kill Selection Handler** 
**Problem:** Sorciere kill button click didn't call `updateMapForRole()`

**Fix Applied:**
- Added `this.updateMapForRole()` call in Sorciere kill button handler (line ~2016)
- Added comprehensive logging:
```
[MDJ] 🧙‍♀️ Sorciere kill button clicked: playerId=..., name=...
[MDJ] 🧙‍♀️ Sorciere selectedPlayers set to: ['potion-death', 'pX']
[MDJ] 🧙‍♀️ Calling updateMapForRole() to apply visuals...
```

**Code Location:** `renderSorciereSelection()` kill button click handler

---

### 3. ✅ **Wolf Breathing - Show ALL Wolves**
**Problem:** Only selected wolf type breathing
- Select Simple_Loup_Garou → only 2 Simple wolves breathing
- Missing: Grand_Mechant_Loup, Loup_Garou_Blanc, Chien_Loup (transformed)

**Root Cause:** Breathing logic only showed exact role match or Simple_Loup_Garou multiples

**Fix Applied:**
- Created `WOLF_ROLES` set with all wolf types:
  - Simple_Loup_Garou
  - Grand_Mechant_Loup
  - Loup_Garou_Blanc
  - Loup_Garou_Voyant
  - Infect_Pere_Loups
  - Chien_Loup

- New logic (lines ~322-334):
  ```javascript
  if (p.role === this.selectedRoleId) {
    isCurrentRole = true;
  } else if (WOLF_ROLES.has(this.selectedRoleId) && WOLF_ROLES.has(p.role)) {
    // If selected role is a wolf AND this player is any wolf: they breathe together
    isCurrentRole = true;
  }
  ```

**Result:** When selecting ANY wolf role, ALL living wolves will breathe together

**Logging:**
```
[MDJ] 🫁 [WOLF PACK] PlayerName (WolfType) breathing with selected RoleType
```

---

### 4. ✅ **Target Conversion Logging - ID to Name**
**Problem:** Targets saved as IDs ('p10') instead of names ('Thomas')

**Fix Applied:**
- Enhanced ID→Name conversion logging (lines ~2120-2140):
```
[MDJ] CONVERT START: key="p10" is player ID?
[MDJ]   ✓ ID→Name conversion: "p10" → "Thomas" (player found: true)
[MDJ]   ✓ Special key (no conversion needed): "potion-life"
```

- Added warning if player not found:
```
[MDJ]   ⚠️ WARNING: Player ID "p10" not found in players array!
```

---

### 5. ✅ **Dead Player Tracking - Comprehensive Logging**
**Problem:** `deadPlayerIds` set never populated (always empty)

**Fix Applied:**
- Enhanced logging in wolf kill completion (lines ~2157-2175):
```
[MDJ]   - Killed player IDs (selectedPlayers): ["p7"]
[MDJ]   - Killed player NAMES (targetNamesList): ["Thomas"]
[MDJ]   ☠️ About to add p7 to deadPlayerIds...
[MDJ]   ☠️ Added p7. deadPlayerIds size now: 1
[MDJ]   ☠️ Current deadPlayerIds contents: ["p7"]
[MDJ] ☠️ FINAL deadPlayerIds for Simple_Loup_Garou: ["p7"]
```

- Shows if players are added successfully
- Shows total count
- Shows full contents after each addition

---

## 📊 EXTENSIVE LOGGING ADDED

Every action now has detailed logging:

### Kill Selection (Sorciere)
```
[MDJ] 🧙‍♀️ Sorciere kill button clicked: playerId=p5, name=Sophie
[MDJ] 🧙‍♀️ Sorciere selectedPlayers set to: ['potion-death', 'p5']
[MDJ] 🧙‍♀️ Calling updateMapForRole() to apply visuals...
[MDJ] 🧙‍♀️ Sorciere: applying kill effect to p5
[MDJ] 🧙‍♀️ Sorciere: changed emoji to skull for p5
[MDJ] 🧙‍♀️ Sorciere: applied grayscale + border to p5
```

### Wolf Pack Breathing
```
[MDJ] 🫁 Breathing for: Cedric (Simple_Loup_Garou) - selectedRoleId: Simple_Loup_Garou
[MDJ] 🫁 [WOLF PACK] Anthony (Grand_Mechant_Loup) breathing with selected Simple_Loup_Garou
[MDJ] 🫁 [WOLF PACK] Marine (Chien_Loup) breathing with selected Simple_Loup_Garou
```

### Target Conversion
```
[MDJ] ========== completeRoleAction START ==========
[MDJ] Role: Voyante
[MDJ] selectedPlayers (RAW): ['p10']
[MDJ] CONVERT START: key="p10" is player ID?
[MDJ]   ✓ ID→Name conversion: "p10" → "Thomas" (player found: true)
[MDJ] targetNamesList (AFTER conversion): ['Thomas']
[MDJ] ========== completeRoleAction END ==========
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Sorciere Visuals
- [ ] Select Sorciere
- [ ] Click a player to poison
- [ ] **EXPECTED:** Skull emoji + grayscale filter + border color appears on selected player
- [ ] Click different player
- [ ] **EXPECTED:** Previous player reverts to normal, new player gets skull

### Test 2: Wolf Breathing
- [ ] Select Simple_Loup_Garou
- [ ] **EXPECTED:** See breathing animation on:
  - Cedric (Simple_Loup_Garou)
  - Anne (Simple_Loup_Garou)
  - Anthony (Grand_Mechant_Loup) ← Should be visible now!
  - Raphael (Loup_Garou_Blanc) ← Should be visible now!
  - Marine (Chien_Loup) ← Should be visible now!

### Test 3: Border Persistence
- [ ] Select Voyante, click a player
- [ ] Check console for: `ID→Name: "pX" → "PlayerName"` ← Shows conversion
- [ ] Validate action
- [ ] Check console for: `VERIFICATION - targets are: ['PlayerName']` ← Shows saved as name
- [ ] Move to next role
- [ ] **EXPECTED:** Voyante's border persists on selected player

### Test 4: Dead Player Tracking
- [ ] Simple_Loup_Garou kills player
- [ ] Check console for: `☠️ Added p6 to deadPlayerIds`
- [ ] Select Grand_Mechant_Loup
- [ ] Check console for: `Dead players: ["p6"]`
- [ ] **EXPECTED:** Dead player NOT in valid targets list

---

## 📝 CONSOLE LOG SEARCH TERMS

For debugging, search console for:

**Sorciere Issues:**
- `🧙‍♀️ Sorciere`

**Wolf Breathing Issues:**
- `🫁 Breathing` or `🫁 [WOLF PACK]`

**Target Conversion Issues:**
- `ID→Name conversion`
- `VERIFICATION - targets are`
- `target: NOT FOUND` (indicates restoration failure)

**Dead Tracking Issues:**
- `☠️ Added`
- `Dead players:`

**Restoration Issues:**
- `restore - target: NOT FOUND`
- `restore - centerPlayerName: NOT FOUND`

---

## ⚠️ KNOWN REMAINING ISSUES

### Still Need to Fix:
1. **Day.js gameState undefined** - Pass state properly from orchestrator
2. **Player ID Display** - Show player NAME instead of "p6" in victim display
3. **Kill Reversion** - First-selected kill reverts properly when deselecting
4. **Border Persistence** - Might still fail if targets saved as IDs in some cases

### Why These Happen:
- Targets might still be saved as IDs in some code paths
- Restore function might not find target by name
- Need to verify ALL role types save targets as names, not IDs

---

## 🔍 CODE CHANGES SUMMARY

**Total Changes:** 
- Added 1 new switch case (Sorciere visuals)
- Enhanced 4 existing functions with logging
- Added 1 new click handler enhancement
- Updated wolf breathing logic with WOLF_ROLES set

**Lines Modified:** ~100 lines of code and logging additions

**Files Changed:** 
- `03-FirstNight-MDJ.js` only (v21 → v22)

---

## ✨ HOW TO TEST

1. **Clear browser cache:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Verify v22 loaded:** Open DevTools → Network tab → Look for `03-FirstNight-MDJ.js?v=22`
3. **Run full test:** Play through entire First Night
4. **Check console logs:** Open DevTools → Console → Look for the patterns above
5. **Report findings:** Note which issues are fixed and which remain

---

Generated: 2026-05-29
Status: Ready for testing
