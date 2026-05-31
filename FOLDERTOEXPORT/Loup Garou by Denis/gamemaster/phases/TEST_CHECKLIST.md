# Test Checklist - FirstNightMDJ Refactored

## ✅ Fichiers Créés

- [x] `/styles/first-night-mdj.css` (14 KB)
- [x] `/utils/html-helpers.js` (1.4 KB)
- [x] `/utils/night-state.js` (2.2 KB)
- [x] `/utils/night-summary-renderer.js` (5.5 KB)
- [x] `/utils/role-renderers.js` (13 KB)
- [x] `03-FirstNight-MDJ.js` (3813 lignes, CSS externalisé)
- [x] `03-FirstNight-MDJ-loader.js` (mise à jour)

**Total:** -549 lignes du fichier principal | +1500+ lignes CSS séparé

## 🧪 Test Plan

### Step 1: Vérifier le chargement
```javascript
// Dans la console du navigateur
console.log('HTMLHelpers:', typeof HTMLHelpers);
console.log('NightState:', typeof NightState);
console.log('NightSummaryRenderer:', typeof NightSummaryRenderer);
console.log('RoleRenderersFactory:', typeof RoleRenderersFactory);
console.log('FirstNightMDJ:', typeof FirstNightMDJ);
```
**Résultat attendu:** Tous les types = "function"

### Step 2: Tester le rendu initial
1. Ouvrir GameMasterUI
2. Vérifier que les panneaux Left/Center/Right apparaissent
3. Vérifier que les styles CSS sont appliqués (couleurs, tailles)
4. Pas d'erreurs console

### Step 3: Tester la sélection de rôle
1. Cliquer sur un rôle dans la liste Left
2. Vérifier que le rôle est mis en surbrillance
3. Vérifier que l'UI d'action apparaît dans le Right panel
4. Pas d'erreurs console

### Step 4: Tester les actions par rôle

#### Cupidon
- [ ] Sélectionner 2 joueurs → "✓ Confirmer 2/2"
- [ ] Bouton validation cliquable

#### Voyante  
- [ ] Sélectionner 1 joueur → voir le rôle
- [ ] Bouton validation cliquable

#### Sorcière
- [ ] Voir victime des loups
- [ ] Sélectionner action: potion vie, potion mort, ou skip
- [ ] Potions épuisées = grisées

#### Loups (Simple_Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc)
- [ ] Grand_Mechant_Loup: peut tuer ANYONE (même les autres loups, même les immunisés)
- [ ] Loup_Garou_Blanc: peut tuer SEULEMENT les autres loups
- [ ] Other wolves: peuvent tuer seulement les non-loups
- [ ] Joueurs protégés: affichage "🛡️ immunisé"

### Step 5: Tester les cascades
- [ ] Cupidon: les 2 amoureux meurent ensemble (test mock data)
- [ ] Enfant_Sauvage: l'idole se transforme en loup
- [ ] Chasseur: doit choisir sa victime après mort (test mock data)

### Step 6: Tester Night Summary
- [ ] Tableau Événements/Morts apparaît
- [ ] Lignes affichent texte court
- [ ] Cliquer sur ligne → expansion (affiche texte complet)
- [ ] Re-cliquer → retour au texte court
- [ ] Caractères spéciaux affichés correctement (quotes, accents, etc.)

## 🔴 Erreurs Critiques à Éviter

| Erreur | Cause | Solution |
|--------|-------|----------|
| `RoleRenderersFactory is not defined` | role-renderers.js pas chargé | Vérifier loader order |
| CSS pas appliqué | Chemin CSS mauvais | Vérifier `/gamemaster/phases/styles/first-night-mdj.css` |
| Action UI vide | Renderer pas trouvé | Vérifier RoleRenderersFactory.create() |
| Caractères spéciaux cassés | HTML pas échappé | Vérifier HTMLHelpers.escapeHTML() |
| Cascades qui fonctionnent pas | NightState pas utilisé | Vérifier this.nightState dans FirstNightMDJ |

## 📝 Notes de Debug

Si ça ne marche pas:

1. **Console errors?** → Ouvrir console du navigateur (F12)
2. **CSS manquant?** → Vérifier dans DevTools > Network > first-night-mdj.css
3. **Module pas chargé?** → Vérifier dans console: `window.FirstNightMDJ`
4. **Action UI vide?** → Ajouter log dans `selectRole()` du FirstNightMDJ

## ✨ Succès Attendu

Si tout fonctionne:
- ✓ FirstNightMDJ chargé correctement
- ✓ CSS appliqué (pas de layout cassé)
- ✓ Tous les rôles affichent leurs actions
- ✓ Kill logic correcte (Loup blanc ≠ Grand méchant)
- ✓ Cascades fonctionnent
- ✓ Night Summary bien affichée

**Rapport après test:** Denis, dis-moi ce qui marche/casse et on ajuste! 🚀
