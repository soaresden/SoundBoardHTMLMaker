# Next Steps - Loup-Garou Refactorisation

## 🎯 Objectif principal
Migrer vers une architecture 100% basée sur les données JSON. Zéro logique métier hardcodée.

---

## Phase 1: Mode Assignation ✅ (EN COURS)

### 1.1 Base créée ✅
- [x] `orchestrator.js` - Moteur du jeu
- [x] `assignment-mode.js` - UI assignation rôles
- [x] `gamemaster-assignment.html` - Demo page
- [x] `first-night-actions.js` - UI actions première nuit (scaffold)

### 1.2 Refactoriser JSON des rôles (53/57)
**Priorité HIGH** - DOIT être fait d'abord

Rôles clés à refactoriser en priorité:
1. **Sorcière** (05) - Kill/Protect
2. **Voyante** (06) - Reveal
3. **Salvateur** (10) - Protect
4. **Loups** (33, 34, 35, 36) - Collective kill
5. **Enfant Sauvage** ✅ - Done
6. **Cupidon** ✅ - Done
7. **Voleur** (11) - Swap role
8. **Corbeau** (07) - Mark

**Outil d'aide**: `REFACTORING_TEMPLATE.md`

### 1.3 Tester Mode Assignation
```
gamemaster-assignment.html
→ Assigner 10 joueurs
→ Vérifier que tous les rôles s'affichent
→ Cliquer "Commencer"
→ FirstNightActions doit s'afficher
```

---

## Phase 2: FirstNightActions UI ❌ (TO DO)

### 2.1 Implémenter les formulaires
- [ ] `selectOne` - Menu radio (Voyante, Sorcière, etc.)
- [ ] `selectPair` - Coches pour 2 joueurs (Cupidon)
- [ ] `selectThree` - Coches pour 3 joueurs (Renard)
- [ ] `collective` - Vote commun loups (à part)

### 2.2 Tester avec rôles réels
- [ ] Cupidon sélectionne 2 amoureux
- [ ] Enfant Sauvage sélectionne idole
- [ ] Sorcière voit la victime et choisit action
- [ ] Voyante regarde quelqu'un
- [ ] Voleur échange avec quelqu'un

### 2.3 Ajouter confirmation visuelle
- [ ] Afficher les sélections avant de confirmer
- [ ] Afficher un résumé des actions prises
- [ ] Log des actions dans gameLog

---

## Phase 3: Phases normales ❌ (TO DO)

### 3.1 Night Phase
- [ ] `night-ui.js` - Actions nocturnes (Loups, Voyante, etc.)
- [ ] Loups votent ensemble (mustAgree=true)
- [ ] Autres rôles prennent actions en ordre
- [ ] Déterminer victimes et effets

### 3.2 Day Phase
- [ ] `day-ui.js` - Annonces et vote
- [ ] Annoncer les morts de la nuit
- [ ] Village vote pour éliminer quelqu'un
- [ ] Actions post-mortem (Chasseur, etc.)

### 3.3 Reveal Phase
- [ ] `reveal-ui.js` - Fin de partie
- [ ] Afficher tous les rôles
- [ ] Annoncer le gagnant
- [ ] Historique des actions

---

## Phase 4: Mode Tablette Passante ❌ (MAJOR TODO)

### 4.1 Scaffold créé ❌
- [x] `tablet-pass-mode.js` - Structure vide

### 4.2 À implémenter
- [ ] Écran "Passe la tablette à Alice"
- [ ] Button "Clique pour voir ta carte"
- [ ] Révélation du rôle à l'écran
- [ ] Fisher-Yates shuffle pour distribution aléatoire
- [ ] Button "Suivant" pour passer
- [ ] Mobile-optimized (full screen, large buttons)

### 4.3 Intégration
- [ ] Passer au Mode Assignation OU Tablet Pass au démarrage
- [ ] Même FirstNightActions après distribution

---

## Phase 5: Bugs & Polish ❌ (TO DO)

### 5.1 Conditions de victoire
- [ ] Tester toutes les conditions (camp, linked, solo, etc.)
- [ ] Vérifier après chaque mort
- [ ] Afficher message de fin correct

### 5.2 État du jeu
- [ ] Sauvegarde/chargement (localStorage)
- [ ] Historique complet du jeu
- [ ] Débugging: afficher state complet

### 5.3 UI Polish
- [ ] Mobile responsive (tous les écrans)
- [ ] Dark mode (déjà appliqué)
- [ ] Animations smooth
- [ ] Feedback audio/visual

---

## Fichiers clés

```
gamemaster/
├── orchestrator.js                    ✅ Core - Fait
├── load-roles-json.js                 ? À vérifier
│
├── ui/
│   ├── assignment-mode.js             ✅ Fait
│   ├── first-night-actions.js         ⚠️ Scaffold
│   ├── night-ui.js                    ❌ À créer
│   ├── day-ui.js                      ❌ À créer
│   ├── reveal-ui.js                   ❌ À créer
│   └── tablet-pass-mode.js            ⚠️ Scaffold
│
├── roles/
│   ├── 01-Cupidon.json                ✅ Refactorisé
│   ├── 02-Enfant_Sauvage.json         ✅ Refactorisé
│   ├── 34-Simple_Loup_Garou.json      ✅ Refactorisé
│   ├── 49-Villageois_Villageois.json  ✅ Refactorisé
│   └── XX-*.json (53 autres)          ❌ À faire
│
├── game-rules.json                    ❌ À créer (optionnel)
├── game-state.js                      ❌ À créer (optionnel)
│
└── OLD (à supprimer)
    ├── game-master.js                 ❌ À supprimer
    ├── game-master-ui.js              ❌ À remplacer
    └── ...
```

---

## Commandes utiles

```bash
# Lancer le serveur
python -m http.server 8000

# Ouvrir la page
open http://localhost:8000/gamemaster-assignment.html

# Test du Mode Assignation
- Ouvrir gamemaster-assignment.html
- Console doit afficher: "ROLES_DATA loaded"
- Assigner 10 joueurs
- Cliquer "Commencer la Partie"
```

---

## Validation Checklist

### Mode Assignation
- [ ] Tous les rôles JSON se chargent
- [ ] UI affiche liste joueurs + grille rôles
- [ ] Sélectionner un rôle assigne au joueur
- [ ] Bouton "Commencer" activé quand tous assignés
- [ ] FirstNightActions s'affiche après clic

### FirstNightActions
- [ ] Affiche Cupidon avec formulaire pair
- [ ] Affiche Enfant Sauvage avec formulaire single
- [ ] Soumettres les actions
- [ ] Passer à l'action suivante
- [ ] Affichage "Rôles en attente" correct

### Mode Tablette Passante (après)
- [ ] Écran "Passe à Alice"
- [ ] Alice clique, voit "Voyante"
- [ ] Clique "Suivant", passe à Bob
- [ ] Distribution aléatoire correcte
- [ ] Mobile-friendly (full screen buttons)

---

## Estimation

| Phase | Tâches | Estimation |
|-------|--------|-----------|
| 1: Base | Mode Assignation | ✅ Done |
| 2: Refactor JSON | 53 rôles | 4-6 heures (script? |
| 3: FirstNight UI | Formulaires + test | 2-3 heures |
| 4: Phases normal | Night/Day/Reveal | 4-6 heures |
| 5: Tablet Pass | Mode complet | 2-3 heures |
| 6: Polish & Test | UI, bugs, perf | 2-4 heures |
| **Total** | | **16-25 heures** |

---

## Notes

- ⚠️ **Refactoriser JSON** est BLOQUANT pour tout le reste
- 🎯 Prio = Cupidon, Loups, Voyante, Sorcière
- 📱 Tablet Pass nécessite mobile-first UI
- 🧪 Tests end-to-end avec 10+ joueurs
- 🗑️ Nettoyer ancien code après migration

---

**Dernier update**: 2026-05-25 16:30
**Status**: Refactorisation en cours (Phase 1/6)
**Blockers**: 53 rôles JSON à refactoriser
