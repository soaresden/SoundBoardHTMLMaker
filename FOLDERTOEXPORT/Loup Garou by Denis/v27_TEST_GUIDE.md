# v27 Testing Guide - Complete Bug Fixes

**Duration:** 15-20 minutes  
**Difficulty:** Medium (requires following all steps)

---

## Pre-Test Setup (1 minute)

1. **Clear browser cache:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Open DevTools:** F12 → Console tab
3. **Verify v27 loaded:**
   ```
   VERSION 27
   v27: Fixed border persistence (Voyante/Corbeau/Renard) | Protected player enforcement | Cascading Cupidon death | Complete mayor election & voting
   ```
4. **Start game in MDJ mode**

---

## Test 1: Voyante Border Persistence (2 min)

**Objective:** Verify Voyante selection doesn't clear Cupidon borders

**Steps:**
1. Complete Cupidon → 2 lovers get colored borders
2. Look at map → both lovers have visible borders ✓
3. Select Voyante
4. Click on 1 player to see their role
5. Look at map → Cupidon borders STILL THERE? ✓
6. Switch back to next role
7. Verify both effects visible simultaneously

**PASS if:** Cupidon borders remain visible while selecting/confirming Voyante

---

## Test 2: Corbeau Border Persistence (2 min)

**Objective:** Verify Corbeau selection doesn't clear other role borders

**Steps:**
1. Complete Cupidon (lovers get borders)
2. Complete Enfant_Sauvage (idol gets border)
3. Select Corbeau → click someone for vote-stealing
4. Look at map → Cupidon lovers' borders STILL THERE? ✓
5. Look at map → Enfant_Sauvage idol border STILL THERE? ✓
6. Confirm Corbeau action
7. Verify all 3 borders visible

**PASS if:** All completed role borders persist when selecting Corbeau

---

## Test 3: Renard Border Isolation (2 min)

**Objective:** Verify Renard borders only show during selection, not persist

**Steps:**
1. Complete Cupidon (lovers get borders)
2. Select Renard
3. Click someone in the middle → left/right neighbors get Renard borders ✓
4. Confirm Renard action
5. Look at map → Are Renard borders GONE? ✓
6. Are Cupidon borders STILL THERE? ✓

**PASS if:** Renard borders disappear after confirmation, but Cupidon borders persist

---

## Test 4: Protected Player Enforcement (3 min)

**Objective:** Verify Salvateur protection prevents wolf kills

**Setup Required:**
1. Have at least 3 players: 1 Salvateur, 1 to protect, 1+ other players
2. When Salvateur acts, protect someone (e.g., Marine)

**Steps:**
1. Complete Salvateur → protect Marine
2. Select a wolf role (Grand_Mechant_Loup)
3. Open kill targets list
4. Is Marine in the list? ❌ NO - GOOD!
5. Are other players selectable? ✓ YES
6. Try to click Marine → nothing happens? ✓

**PASS if:** Protected player is completely unavailable for wolf kills

---

## Test 5: Cascading Cupidon Death (2 min)

**Objective:** Verify when one lover dies, the other dies too

**Setup Required:**
- Cupidon with 2 lovers established
- At least one wolf to make a kill

**Steps:**
1. Complete Cupidon → Anna & Nicolas are lovers (get borders)
2. Complete Voyante or other roles
3. Select wolf (Grand_Mechant_Loup)
4. Kill Anna (one of the lovers)
5. Complete the action
6. Look at night summary:
   - Is Anna listed as dead? ✓
   - Is Nicolas ALSO listed as dead? ✓ (cascading death!)

**PASS if:** When one Cupidon lover dies, both appear in the death list

---

## Test 6: Mayor Election UI (3 min)

**Objective:** Verify mayor election phase displays correctly

**Steps:**
1. Complete all first night roles
2. Night summary appears → click "Débat et Vote"
3. Zone orange header shows: "👑 Élection du Maire"? ✓
4. Zone bleue shows: all players (dead ones grayed out)? ✓
5. Zone rose shows: "Sélectionnez un joueur vivant"? ✓
6. Click on an alive player
7. Zone rose shows: that player's emoji, name, "Sera le nouveau Maire"? ✓
8. Click "✓ Élire" button

**PASS if:** Mayor election UI renders correctly with all zones

---

## Test 7: Voting Phase UI (3 min)

**Objective:** Verify voting/lynch phase displays correctly

**Steps:**
1. Mayor election complete → now in voting phase
2. Zone orange shows: "🗳️ Résultats Nuit 1 & Vote"? ✓
3. Zone bleue shows: only ALIVE players? ✓
4. Zone rose shows: 
   - "📋 Actions de la Nuit" section? ✓
   - "☠️ Décès" section? ✓
   - "Sélectionnez quelqu'un à envoyer au bûcher"? ✓
5. Click on someone to vote
6. Zone rose preview shows: their name and role? ✓
7. Click "🔥 Envoyer au Bûcher"

**PASS if:** Voting phase UI renders with all sections and proper role preview

---

## Test 8: Lynch Execution (2 min)

**Objective:** Verify lynch reveals role and transitions

**Steps:**
1. In voting phase with someone selected
2. Click "🔥 Envoyer au Bûcher"
3. Display shows: victim's skull, name, role, message "Rendormez-vous, 2ème Nuit!"? ✓
4. Is victim marked dead on map? ✓
5. Button shows "✓ Continuer vers Nuit 2"? ✓

**PASS if:** Lynch shows role revelation and transitions properly

---

## Test 9: Complete First Night Flow (3 min)

**Objective:** Play entire first night with all fixes

**Steps:**
1. Start new game, select MDJ mode
2. **Cupidon:** Select 2 lovers
3. **Enfant_Sauvage:** Select 1 idol
4. **Voyante:** Select 1 target to see role
5. **Salvateur:** Protect someone (e.g., person A)
6. **Wolves:** Try to kill person A → BLOCKED ✓
7. **Wolves:** Kill someone else (person B)
   - If person B is Cupidon lover → other lover dies too ✓
8. **Sorciere:** Complete potion action
9. **Night summary:** Shows all actions & deaths
10. **Mayor election:** Elect a mayor (or skip)
11. **Voting:** Lynch someone → role revealed
12. No crashes, no console errors?

**PASS if:** Complete flow works without errors, all fixes working

---

## Scoring

| Test | Result |
|------|--------|
| Test 1: Voyante borders | ☐ PASS ☐ FAIL |
| Test 2: Corbeau borders | ☐ PASS ☐ FAIL |
| Test 3: Renard isolation | ☐ PASS ☐ FAIL |
| Test 4: Protected players | ☐ PASS ☐ FAIL |
| Test 5: Cascading death | ☐ PASS ☐ FAIL |
| Test 6: Mayor election | ☐ PASS ☐ FAIL |
| Test 7: Voting phase | ☐ PASS ☐ FAIL |
| Test 8: Lynch execution | ☐ PASS ☐ FAIL |
| Test 9: Full flow | ☐ PASS ☐ FAIL |

**v27 PASS if:** 8 or more tests pass (all but full flow can be bypassed if it combines other tests)

---

## If Any Test Fails

**For border issues:**
1. Check console for restoration messages
2. Verify playersWithCompletedEffects is being built correctly
3. Check CSS for conflicting styles

**For protection issues:**
1. Console should log: "Protected players: [names]"
2. Verify Salvateur was properly completed first
3. Check deadPlayerIds tracking

**For cascading death:**
1. Console should log: "💔 Cascading death: [name] dies with lover"
2. Verify Cupidon was completed with 2 targets
3. Check night summary lists both deaths

**For mayor/voting:**
1. Verify all roles completed before showing election
2. Check console for mayor selection logs
3. Take screenshot of UI layout

---

## Console Debugging

Key messages to watch for:
```
[MDJ] Calling updateMapForRole() - ${role} selected
[MDJ] Protected players: [names]
[MDJ] 💔 Cascading death: ${name} dies with lover
[MDJ] === ROLE SELECTION COMPLETE: ${emoji} ${name} ===
[MDJ] Night summary complete - starting mayor election
[MDJ] Mayor election complete - starting voting phase
[MDJ] 🔥 ${name} lynched - role revealed: ${role}
```

---

## Next Steps

✅ If all 9 tests pass:
- v27 is production-ready
- Ready for full game flow testing
- Document complete for deployment

❌ If any test fails:
- Fix identified issue
- Re-run that specific test
- Document the fix
- Re-test full flow
