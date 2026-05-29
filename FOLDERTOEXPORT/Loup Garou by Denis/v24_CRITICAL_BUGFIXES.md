# v24 - Critical Bug Fixes & Improvements

## Status: READY FOR TESTING

File: `03-FirstNight-MDJ.js` - v21 → v24

---

## 🔧 CRITICAL FIXES APPLIED

### 1. ✅ **Wolf Breathing - Fixed to be Independent**
**Problem:** When selecting Chien_Loup, ALL wolves were breathing together instead of just Chien_Loup
- Select Simple_Loup_Garou → only 2 Simple wolves breathe (correct)
- Select Chien_Loup → ONLY Chien_Loup breathes (now fixed!)
- Select Grand_Mechant_Loup → ONLY that wolf breathes (now fixed!)
- Select Loup_Garou_Blanc → ONLY that wolf breathes (now fixed!)

**Root Cause:** The WOLF_ROLES set logic was backwards - it made all wolves breathe together

**Fix Applied:** (Lines ~326-333)
- Removed the WOLF_ROLES set condition
- Each wolf type now breathes independently
- Exact role match is the ONLY condition for breathing

---

### 2. ✅ **Border Persistence - Fixed Target Lookup Bug**
**Problem:** Borders disappeared after validation for Voyante, Salvateur, Cupidon, Corbeau, etc.
- Selected player got border ✓
- Validated action
- Border disappeared ✗ (should persist)

**Root Cause:** Targets stored as IDs (p7, p2) but restore logic looked for NAMES
```javascript
// BEFORE (Line 851)
const target = players.find(p => state.result.targets.includes(p.name));
// p.name = "Raphael" but targets has ["p8"] → NOT FOUND

// AFTER
const target = players.find(p => state.result.targets.includes(p.id));
// p.id = "p8" and targets has ["p8"] → FOUND! ✓
```

**Fix Applied:** Updated ALL restore functions to use player IDs (Lines ~758, 780, 802, 824, 851)
- Cupidon lovers restore
- Enfant_Sauvage idol restore
- Voyante target restore
- Salvateur protected restore
- Corbeau victim restore
- Renard center player restore

---

### 3. ✅ **Dead Player Tracking - Implemented & Populated**
**Problem:** deadPlayerIds set was NEVER populated during wolf kills
- Killed players didn't appear as dead
- Could be selected again by subsequent roles

**Root Cause:** No code was adding killed players to the deadPlayerIds set

**Fix Applied:** (Lines ~2693-2702)
```javascript
// Track dead players from kill actions
if ((action === 'kill' || action === 'poison') && this.selectedPlayers.length > 0) {
  this.selectedPlayers.forEach(playerId => {
    if (!playerId.startsWith('potion-')) {
      this.deadPlayerIds.add(playerId);
      console.log(`[MDJ] ☠️ ${roleName} killed ${playerName}`);
    }
  });
}
```

**Result:** 
- Dead players now tracked correctly
- Shows comprehensive logging: `[MDJ] ☠️ Total dead players: Sophie, Emmanuel, Loris`
- Dead players excluded from subsequent role selections

---

### 4. ✅ **Sorciere Victim Display - Shows Names Not IDs**
**Problem:** Victim display showed "Victime des Loups: P1" instead of "Victime des Loups: Emmanuel"

**Root Cause:** Targets stored as IDs but code was looking for names
```javascript
// BEFORE
victimName = this.roleStates[roleId].result.targets[0]; // p1
const player = players.find(p => p.name === victimName); // Looking for name "p1"

// AFTER
victimId = this.roleStates[roleId].result.targets[0]; // p1
const player = players.find(p => p.id === victimId); // Found by ID ✓
victimName = player.name; // "Emmanuel"
```

**Fix Applied:** (Lines ~1990-2000)
- Extract victim ID directly from targets array
- Look up player by ID, not by name
- Display player name in UI

---

### 5. ✅ **Renard Self-Targeting - Removed**
**Problem:** Renard could select themselves as the "center" player to sniff
- Doesn't make sense logically (sniffing your own neighbors)

**Root Cause:** No filter was excluding Renard from the player selection list

**Fix Applied:** (Lines ~1767-1770)
```javascript
// Find Renard and exclude from selection list
const renardPlayer = players.find(p => p.role === 'Renard');
const playerListHtml = players
  .filter(p => p.id !== renardPlayer?.id) // Exclude Renard
```

**Also Fixed:** Renard restore function to use player ID instead of name (Line ~887)

---

### 6. ✅ **Night Summary Display - Created & Integrated**
**Problem:** When night is complete, user sees unchanged role listbox instead of summary

**Fix Applied:** (Lines ~407-481)
- New `renderNightSummary()` method
- Shows 2-column layout: Actions | Deaths
- Displays all completed role actions with names
- Shows all deaths with causes (Loup kill vs Sorciere poison)
- Automatically switches from role listbox to summary when all roles done
- Includes comprehensive logging

**Format Example:**
```
📋 Actions de la Nuit
💗 Cupidon a touché Katy et Anthony
👁️ Voyante a vu Raphael
🧙‍♀️ Sorciere a empoisonné Emmanuel

☠️ Décès
👤 Emmanuel - Dévoré par les Loups
👤 Loris - Tué par la potion de la Sorcière
```

---

## 📊 COMPREHENSIVE LOGGING ADDED

Every fix includes extensive console logging:

**Wolf Breathing:**
```
[MDJ] 🫁 Breathing for: Raphael (Chien_Loup) - selectedRoleId: Chien_Loup
```

**Border Restoration:**
```
[MDJ] Voyante restore - target: Emmanuel ✓ FOUND
[MDJ] Voyante restore - applied border color: #7B357A
```

**Dead Player Tracking:**
```
[MDJ] ☠️ Simple_Loup_Garou killed Li (p0)
[MDJ] ☠️ Total dead players: Li, Emmanuel, Loris
```

**Target Lookup:**
```
[MDJ] Sorciere victim display: Emmanuel (p5)
[MDJ] Renard center player: Anne (p2) - NOT FOUND → SKIPPED
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Wolf Breathing Independence
- [ ] Select Simple_Loup_Garou → See 2 Simple wolves breathing
- [ ] Select Chien_Loup → See ONLY Chien_Loup breathing (not all wolves!)
- [ ] Select Grand_Mechant_Loup → See ONLY that wolf breathing
- [ ] Select Loup_Garou_Blanc → See ONLY that wolf breathing

### Test 2: Border Persistence Across Transitions
- [ ] Select Cupidon → Click 2 lovers → Validate
- [ ] Move to Enfant_Sauvage
- [ ] **EXPECTED:** Cupidon's lovers still have colored borders!
- [ ] Select Voyante → Click target → Validate
- [ ] Move to Salvateur
- [ ] **EXPECTED:** Voyante's target still has border!
- [ ] Repeat for all roles (Corbeau, Renard)

### Test 3: Sorciere Victim Display
- [ ] Wolves kill Emmanuel
- [ ] Open Sorciere
- [ ] **EXPECTED:** Shows "Victime des Loups: Emmanuel" (NOT "P5"!)
- [ ] **EXPECTED:** Victim name shows clearly in pink panel

### Test 4: Dead Player Tracking
- [ ] Simple_Loup_Garou kills Li
- [ ] Select Grand_Mechant_Loup
- [ ] **EXPECTED:** Li NOT in the clickable target list
- [ ] Console shows: `[MDJ] ☠️ Simple_Loup_Garou killed Li`

### Test 5: Renard Self-Targeting Removed
- [ ] Select Renard
- [ ] **EXPECTED:** Renard themselves NOT in selection list
- [ ] Can only select other players

### Test 6: Night Summary Display
- [ ] Complete all roles for the night
- [ ] **EXPECTED:** Role listbox replaced with 2-column summary
- [ ] Left side shows all actions (Cupidon, Voyante, etc)
- [ ] Right side shows deaths with causes
- [ ] Click "✓ Débat et Vote" to proceed

---

## ⚠️ KNOWN REMAINING ISSUES

### Still Need to Address:
1. **Dead player visual on map** - No grayscale effect currently applied
2. **Day phase deaths announcement** - Should integrate night summary
3. **Version number in cache** - Browser might still show v21; use Ctrl+Shift+R
4. **Logging refinement** - Some logs still show IDs; need to verify all names display

---

## 📝 FILES MODIFIED

**Primary Changes:**
- `03-FirstNight-MDJ.js` (v21 → v24)
  - Lines ~326-333: Wolf breathing logic
  - Lines ~407-481: Night summary rendering
  - Lines ~758, 780, 802, 824, 851, 887: Target restoration (ID-based)
  - Lines ~1767-1770: Renard self-targeting removal
  - Lines ~1990-2000: Sorciere victim display
  - Lines ~2693-2702: Dead player tracking

**Created:**
- `05-Day-NightReport.js` (New night report component)

---

## ✨ HOW TO TEST

1. **Clear browser cache:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Verify v24 loaded:** Open DevTools → Network tab → Look for `03-FirstNight-MDJ.js?v=24` (or latest)
3. **Open developer console:** F12 → Console tab
4. **Run full night:** Play through entire First Night
5. **Check console logs:** Look for the patterns above
6. **Verify each test:** Use checklist above
7. **Report findings:** Tell us which issues are fixed and which remain

---

## 🎯 EXPECTED OUTCOMES

After these fixes:

✅ **Wolves breathe independently** - each wolf type by itself  
✅ **Borders persist** - Cupidon lovers/Voyante targets/Salvateur protected stay colored  
✅ **Dead players tracked** - Can't be selected again, logged to console  
✅ **Victim names display** - "Emmanuel" not "P5"  
✅ **Renard can't sniff self** - Removed from selection list  
✅ **Night summary shows** - 2-column layout when night complete  

---

Generated: 2026-05-29  
Status: Ready for comprehensive testing
