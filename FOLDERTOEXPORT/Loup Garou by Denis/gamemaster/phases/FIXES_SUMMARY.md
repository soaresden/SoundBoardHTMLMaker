# UI/UX Fixes FirstNightMDJ - Session 31 Mai 2026

**Date:** 31 mai 2026  
**Status:** ✓ 4/5 Fixes Applied  
**Commit:** c254e4f

## Fixes Appliqués

### 1. ✓ Breathing - Grand_Mechant_Loup Only
**Problème:** Tous les loups breathaient quand Simple_Loup_Garou était sélectionné  
**Fix:** Seul Grand_Mechant_Loup breathe maintenant  
**Ligne:** ~451-463  

```javascript
if (this.selectedRoleId === 'Simple_Loup_Garou') {
  // Only Grand_Mechant_Loup breathes, not other wolves
  isCurrentRole = p.role === 'Grand_Mechant_Loup';
}
```

### 2. ✓ Sorcière UI Improvements
**Changements:**
- Potion list → Combobox (`<select>`)
- Ajout bouton "Ne rien faire" (⏭️)
- Exclut la Sorcière elle-même de la liste de kill
- Event listeners mis à jour

**Ligne:** ~2817-2835 (UI) et ~2886-2950 (listeners)  

**Avant:**
```html
<div class="sorciere-kill-list"> <!-- clickable buttons -->
  ${this.playerRegistry.getAlive().map(p => ...)}
</div>
```

**Après:**
```html
<select class="sorciere-kill-combobox">
  <option value="">-- Choisir un joueur --</option>
  ${this.playerRegistry.getAlive().filter(p => p.role !== 'Sorciere').map(p => ...)}
</select>

<button class="do-nothing-btn">⏭️ Ne rien faire</button>
```

### 3. ✓ Day Vote Combobox
**Problème:** Liste clickable de joueurs pour voter  
**Fix:** Remplacée par combobox  
**Ligne:** ~801-835  

```javascript
// BEFORE: playerListHtml with clickable divs
// AFTER: voteComboboxHtml with <select>

const voteCombobox = listbox.querySelector('.day-vote-combobox');
voteCombobox.addEventListener('change', () => {
  this.selectedLynchVictimId = voteCombobox.value || null;
  this.startVotingPhase();
});
```

### 4. ✓ Voyante Border Priority
**Problème:** Voyante overwrite les borders de Salvateur/idol  
**Fix:** Voyante skip le border si joueur a déjà un effet complété  
**Ligne:** ~1896-1906  

```javascript
// Apply border to selected players (but NOT if they have completed role effects)
this.selectedPlayers.forEach(playerId => {
  if (playersWithCompletedEffects.has(playerId)) {
    console.log(`[MDJ] Voyante - skipping border for ${playerId}`);
    return; // ← NE PAS overwrite existing border
  }
  // Apply Voyante border...
});
```

## À Faire (Déféré)

### ✗ 5. Chasseur Post-Mortem Kill
**Statut:** Non implémenté (complexité: HIGH)  
**Raison:** Nécessite refactor du flow night → voting  

**Fonctionnalité demandée:**
- Si Chasseur meurt pendant la nuit
- AVANT le vote du jour
- Afficher UI pour Chasseur choisir sa victime
- Puis continuer avec le vote

**Approche proposée:**
1. Ajouter étape intermédiaire après completeRoleAction()
2. Vérifier si Chasseur est dans deadPlayerIds
3. Si oui, show UI de sélection + event listener
4. Après sélection, appeler startVotingPhase()

**Implémentation future:** Voir branche `feature/chasseur-postmortem`

## Tests à Faire

- [ ] Test Grand_Mechant_Loup breathing (seulement lui, pas autres loups)
- [ ] Test Sorcière combobox + do-nothing button
- [ ] Test Sorcière exclude self (elle n'apparaît pas en option)
- [ ] Test Day vote combobox
- [ ] Test Voyante sur Salvateur-protected (border ne change pas)
- [ ] Test Voyante sur idol (border ne change pas)

## Fichiers Modifiés

```
gamemaster/phases/
├── 03-FirstNight-MDJ.js  ← Modifié (539 insertions, 464 deletions)
└── FIXES_SUMMARY.md      ← Nouveau
```

## Notes Techniques

- Utilisé Python pour les replacements (plus stable que Edit pour gros fichiers)
- Git checkout pour restaurer après truncation errors
- Node syntax check après chaque fix
- Tous les tests de syntaxe passent ✓

## Prochaines Étapes

1. **Test en jeu:** Vérifier tous les fixes fonctionnent en pratique
2. **Chasseur:** Implémenter post-mortem kill (si priorité haute)
3. **Polish:** Améliorer UX des combobox si nécessaire
4. **Performance:** Vérifier pas de regression

---

**Commit Hash:** c254e4f  
**Time Elapsed:** ~30 minutes  
**Success Rate:** 80% (4/5 fixes)
