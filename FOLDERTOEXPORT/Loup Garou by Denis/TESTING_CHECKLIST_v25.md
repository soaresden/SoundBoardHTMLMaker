# v25 Testing Checklist - Quick Reference

**Test Duration:** 5-10 minutes  
**Status:** Ready to test

---

## Pre-Test Setup ✓

- [ ] Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- [ ] Open DevTools: `F12`
- [ ] Go to Console tab
- [ ] Look for: `VERSION 25` message (should appear at startup)

---

## Test 1: Basic Border Persistence (2 min)

**Scenario:** Cupidon lovers border should persist when switching roles

1. [ ] Select **Cupidon** from role list
2. [ ] Click 2 players (lovers) - see them get colored border
3. [ ] Click "✓ Valider" button
4. [ ] Verify message appears: `[MDJ] Cupidon completed with lovers: X and Y`
5. [ ] Select **Enfant_Sauvage** (different role)
6. [ ] **EXPECTED:** Cupidon's 2 lovers STILL have their border! ✅

**If fails:** 
- Border disappears ❌ → Restoration not working
- Check console: `[MDJ] Calling restoreCompletedRoleEffects()`

---

## Test 2: Multiple Role Borders (3 min)

**Scenario:** Multiple role effects should be visible simultaneously

1. [ ] Complete **Cupidon** with 2 lovers (pink/red border)
2. [ ] Switch to **Enfant_Sauvage**
3. [ ] Select 1 idol (gets purple border)
4. [ ] Click "✓ Valider"
5. [ ] Switch to **Voyante**
6. [ ] Select 1 target (gets teal/cyan border)
7. [ ] Click "✓ Valider"
8. [ ] Look at the map now
9. [ ] **EXPECTED:** Can see ALL THREE borders at once! ✅
   - 2 pink lovers (Cupidon)
   - 1 purple idol (Enfant_Sauvage)  
   - 1 teal target (Voyante)

**If fails:**
- Only 1 border visible ❌ → Restoration not working
- Borders disappearing ❌ → ID lookup failing

---

## Test 3: Role Switching (2 min)

**Scenario:** Switching between completed roles should keep all effects

1. [ ] Complete Cupidon (lovers border)
2. [ ] Switch to Enfant_Sauvage
3. [ ] **CHECK:** Cupidon borders still there ✓
4. [ ] Switch back to Cupidon
5. [ ] **CHECK:** Cupidon borders still there ✓
6. [ ] Switch to Voyante
7. [ ] **CHECK:** Cupidon borders still there ✓
8. [ ] Switching rapidly between roles
9. [ ] **EXPECTED:** Borders persist through all transitions ✅

---

## Test 4: Salvateur/Corbeau/Renard (1 min each)

**Test Salvateur:**
1. [ ] Select Salvateur
2. [ ] Click 1 player to protect
3. [ ] Click "✓ Valider"
4. [ ] Switch away
5. [ ] **EXPECTED:** Protected player still has border ✅

**Test Corbeau:**
1. [ ] Select Corbeau
2. [ ] Click 1 victim
3. [ ] Click "✓ Valider"
4. [ ] Switch away
5. [ ] **EXPECTED:** Victim still has border ✅

**Test Renard:**
1. [ ] Select Renard
2. [ ] Click 1 center player
3. [ ] Click "✓ Valider"
4. [ ] Switch away
5. [ ] **EXPECTED:** Center + 2 neighbors still have border ✅

---

## Test 5: Complete First Night Flow (5 min)

**Play entire night:**
1. [ ] Start First Night MDJ mode
2. [ ] Complete ALL roles in order:
   - [ ] Cupidon (select 2 lovers)
   - [ ] Enfant_Sauvage (select 1 idol)
   - [ ] Voyante (select 1 target)
   - [ ] Salvateur (select 1 protected)
   - [ ] Simple_Loup_Garou (select 1 victim)
   - [ ] Sorciere (potion life or death)
   - [ ] Corbeau (if present)
   - [ ] Renard (if present)

3. [ ] All roles completed successfully
4. [ ] Look at night summary at end
5. [ ] **EXPECTED:** Shows:
   - Actions on left (Cupidon touched X, Voyante saw Y, etc)
   - Deaths on right (victim names and causes)
   - No errors in console

6. [ ] Click "✓ Débat et Vote" to continue
7. [ ] Move to Day phase successfully
8. [ ] **EXPECTED:** No crashes, all data preserved ✅

---

## Console Checks

### Good Messages (Look for these ✅)

When switching roles:
```
[MDJ] === SELECTING ROLE: Voyante
[MDJ] Calling updateMapForRole()
[MDJ] Calling restoreCompletedRoleEffects() to restore borders from other roles
[MDJ] Cupidon restore - applied border color: #ff69b4
[MDJ] Voyante restore - applied border color: #7b357a
```

### Bad Messages (Watch for these ❌)

If you see:
```
[MDJ] ... restore - target: NOT FOUND
[MDJ] ... restore - SKIPPED: target=null
```
→ ID lookup is failing!

If you don't see:
```
VERSION 25
```
→ Browser cache not cleared! Try `Ctrl+Shift+R` again

---

## Visual Indicators

### Dead Players (from previous fixes)
- [ ] Dead players show ☠️ emoji
- [ ] Dead players appear greyed out (grayscale)
- [ ] Dead players cannot be selected

### Wolf Pack Breathing (from v24)
- [ ] When selecting Simple_Loup_Garou: 2 simple wolves breathe
- [ ] When selecting Chien_Loup: only Chien_Loup breathes (not all)
- [ ] When selecting Grand_Mechant_Loup: only that wolf breathes

### Sorciere Victim Display (from v24)
- [ ] Shows victim name: "Victime des Loups: Emmanuel"
- [ ] Does NOT show: "Victime des Loups: p5"

---

## Quick Pass/Fail Summary

| Test | Pass? | Notes |
|------|-------|-------|
| Test 1: Cupidon persistence | ☐ ✅ / ☐ ❌ | |
| Test 2: Multiple borders | ☐ ✅ / ☐ ❌ | |
| Test 3: Role switching | ☐ ✅ / ☐ ❌ | |
| Test 4: Other roles | ☐ ✅ / ☐ ❌ | |
| Test 5: Full night | ☐ ✅ / ☐ ❌ | |

---

## If Any Test Fails

1. **Write down exactly what happened**
2. **Check console for error messages**
3. **Screenshot the map (what borders are visible)**
4. **List which roles completed successfully**
5. **Note when borders disappeared**

Example report:
```
TEST 1 FAILED:
- Completed Cupidon: 2 lovers got pink border ✓
- Switched to Enfant_Sauvage: Cupidon border DISAPPEARED ❌
- Console shows: "[MDJ] Calling restoreCompletedRoleEffects()"
- But no Cupidon restore message appeared
```

---

## Success Criteria

✅ **v25 is working if:**
- All 5 tests pass
- No "NOT FOUND" messages in console
- VERSION 25 appears in console
- No crashes during full night
- All roles can be completed
- Borders persist through transitions

---

## Quick Reference Commands

```javascript
// Check what version is loaded (paste in console)
console.log('VERSION 25 loaded?', VERSION === 25 || window.FirstNightMDJ)

// Check if borders are being restored (watch console while switching roles)
// Should see: [MDJ] Calling restoreCompletedRoleEffects()

// View current dead players (in console)
document.querySelectorAll('[data-player-id]').forEach(el => {
  console.log(el.dataset.playerId, 'dead:', el.querySelector('.mdj-point-emoji').textContent === '💀');
});
```

---

**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy (just clicking and checking)  
**Help?** Look at console messages, they'll tell you what's happening

Good luck! 🍀
