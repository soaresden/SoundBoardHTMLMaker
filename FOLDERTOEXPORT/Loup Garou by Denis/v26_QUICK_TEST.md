# v26 Quick Test Guide (5-10 minutes)

**Version:** 26  
**Status:** Ready to test  

---

## Pre-Test (30 seconds)

```
1. Clear cache: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Open DevTools: F12 → Console tab
3. Look for: "VERSION 26" message
4. Start game in MDJ mode
```

---

## Test 1: Dead Player Filtering (1 min)

```
1. Kill anyone in first night (wolf kills)
2. Switch to Cupidon → dead player NOT in list ✓
3. Switch to Voyante → dead player NOT in list ✓
4. Dead player shows skull emoji + gray ✓
```

**PASS if:** Dead player not selectable in any role

---

## Test 2: Wolf Breathing (1 min)

```
1. Select Simple_Loup_Garou → only this wolf breathes
2. Switch to Grand_Mechant_Loup → only this wolf breathes
3. Switch to Loup_Garou_Blanc → only this wolf breathes
```

**PASS if:** Only selected wolf breathes, not all together

---

## Test 3: Sorciere Resurrection (1 min)

```
1. Complete Voyante (select victim)
2. Select Sorciere
3. Click victim
4. WITHOUT validating yet, check victim:
   - Shows NORMAL colors (not gray)? ✓
   - Has GREEN border? ✓
5. Click Valider
```

**PASS if:** Green border appears immediately before validation

---

## Test 4: Border Persistence (2 min)

```
1. Complete Cupidon → lovers get colored border
2. Switch to Voyante → Cupidon borders STILL THERE ✓
3. Complete Voyante
4. Look at map: Can see both borders at same time? ✓
5. Switch between roles → borders persist? ✓
```

**PASS if:** Multiple role borders visible simultaneously

---

## Test 5: Night Summary Persistence (2 min)

```
1. Complete all first night roles
2. Last role finishes → summary appears
3. Summary shows: "📋 Actions" + "☠️ Décès"
4. "✓ Débat et Vote" button visible? ✓
5. Summary stays visible? (doesn't disappear) ✓
6. Click "Débat et Vote" → moves to Day ✓
```

**PASS if:** Summary displays and waits for button click

---

## Test 6: Full Night Flow (5 min)

```
1. Play through entire first night
2. Cupidon → complete
3. Enfant_Sauvage → complete
4. Voyante → complete  
5. Salvateur → complete
6. Wolves → complete
7. Sorciere → complete
8. Summary appears with all actions
9. Click "Débat et Vote" → Day phase
```

**PASS if:** No crashes, all roles complete, summary shows correct data

---

## Scoring

| Test | Result |
|------|--------|
| Test 1: Dead filtering | ☐ PASS ☐ FAIL |
| Test 2: Wolf breathing | ☐ PASS ☐ FAIL |
| Test 3: Sorciere visual | ☐ PASS ☐ FAIL |
| Test 4: Borders persist | ☐ PASS ☐ FAIL |
| Test 5: Summary persists | ☐ PASS ☐ FAIL |
| Test 6: Full flow | ☐ PASS ☐ FAIL |

**v26 PASS if:** All 6 tests pass

---

## If Any Test Fails

1. **Write what happened** (be specific)
2. **Check console for errors**
3. **Take screenshot of current state**
4. **Note which role was selected**

---

**Total Time:** 5-10 minutes  
**Difficulty:** Easy (just clicking and checking)

