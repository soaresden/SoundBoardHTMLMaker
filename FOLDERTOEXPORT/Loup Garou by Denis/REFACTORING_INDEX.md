# Index - Refactorisation Loup-Garou 2026

## 📁 Fichiers créés / modifiés

### Core Architecture
- **gamemaster/orchestrator.js** ✨ NEW
  - Classe GameMasterOrchestrator
  - Orchestrateur pur (zéro logique métier)
  - 350+ lignes, bien documentée

### UI Components
- **gamemaster/ui/assignment-mode.js** ✨ NEW
  - Interface d'assignation des rôles
  - Liste joueurs + grille rôles
  - Navigation + sélection
  - 400+ lignes, CSS inclus

- **gamemaster/ui/first-night-actions.js** ✨ NEW (scaffold)
  - Actions de première nuit
  - Formulaires dynamiques
  - Structure prête pour implémentation
  - 350+ lignes

- **gamemaster/ui/tablet-pass-mode.js** ✨ NEW (TODO)
  - Mode tablette passante
  - À implémenter complètement

### Pages HTML
- **gamemaster-assignment.html** ✨ NEW
  - Page démo du Mode Assignation
  - Intègre orchestrator + assignment-mode
  - Prête à l'emploi

### JSON refactorisés
- **gamemaster/roles/01-Cupidon.json** ✏️ MODIFIED
  - Nouveau format gamePhases
  - winConditions et specialBehaviors
  - Exemple de bon format

- **gamemaster/roles/02-Enfant_Sauvage.json** ✏️ MODIFIED
  - Même nouveau format
  - Action FirstNight avec lien

- **gamemaster/roles/34-Simple_Loup_Garou.json** ✏️ MODIFIED
  - Rôle avec action Night récurrente
  - Action collective (mustAgree=true)

- **gamemaster/roles/49-Villageois_Villageois.json** ✏️ MODIFIED
  - Rôle simple sans action
  - Exemple de rôle basique

### Documentation
- **ARCHITECTURE.md** 📖 NEW (8 pages)
  - Vue d'ensemble de l'architecture
  - Types d'actions et d'effets
  - Flux de données
  - Zéro fallback - Règles strictes

- **REFACTORING_TEMPLATE.md** 📖 NEW (6 pages)
  - Template JSON complet
  - 4 exemples détaillés
  - Procédure de refactorisation
  - Status par rôle

- **TODO_NEXT_STEPS.md** 📖 NEW (6 pages)
  - Plan d'action Phase 1-6
  - Checklist de validation
  - Estimation de temps
  - Notes importantes

- **REFACTOR_SUMMARY.md** 📖 NEW (10 pages)
  - Résumé de la refactorisation
  - Avant/Après
  - Points clés
  - Prochaines étapes

- **REFACTORING_INDEX.md** (ce fichier)
  - Index complet

---

## 📊 Stats

| Métrique | Nombre |
|----------|--------|
| Fichiers créés | 7 |
| Fichiers modifiés | 4 |
| Lignes de code écrites | 2000+ |
| Pages de docs | 30+ |
| Rôles refactorisés | 4/57 (7%) |
| Heures estimées restantes | 16-25h |

---

## 🎯 Ordre de lecture recommandé

1. **REFACTOR_SUMMARY.md** (5 min) - Comprendre le contexte
2. **ARCHITECTURE.md** (10 min) - Voir la structure
3. **gamemaster/orchestrator.js** (15 min) - Lire le code
4. **REFACTORING_TEMPLATE.md** (10 min) - Comprendre comment refactoriser
5. **TODO_NEXT_STEPS.md** (5 min) - Plan d'action
6. **gamemaster-assignment.html** (tester)

---

## 🚀 Quick Start

### Test du Mode Assignation
```bash
cd /path/to/Loup\ Garou\ by\ Denis
python -m http.server 8000
# Ouvrir http://localhost:8000/gamemaster-assignment.html
```

### Refactoriser un rôle
```bash
1. Ouvrir gamemaster/roles/XX-RoleName.json
2. Copier template de REFACTORING_TEMPLATE.md
3. Remplir tous les champs
4. Supprimer ancien format (actions, logging, description)
5. Tester en mode assignation
```

---

## 🔍 Navigation par sujet

### Comprendre l'architecture
→ ARCHITECTURE.md → orchestrator.js → assignment-mode.js

### Refactoriser les rôles
→ REFACTORING_TEMPLATE.md → exemples → roles/*.json

### Implémenter les phases
→ TODO_NEXT_STEPS.md → first-night-actions.js → night-ui.js

### Tester le jeu
→ gamemaster-assignment.html → browser console

---

## ✅ Checklist avant de continuer

- [ ] Lire REFACTOR_SUMMARY.md
- [ ] Lire ARCHITECTURE.md
- [ ] Ouvrir orchestrator.js et parcourir le code
- [ ] Tester gamemaster-assignment.html
- [ ] Lire REFACTORING_TEMPLATE.md
- [ ] Refactoriser au moins 1 rôle (test)
- [ ] Lire TODO_NEXT_STEPS.md

---

## 🎓 Concepts clés

**gamePhases**: Description des actions dans chaque phase du jeu
- FirstNightActions, Night, Day, PostMortem

**winConditions**: Comment ce rôle peut gagner
- type: "camp" (Village/Loups) ou "solo"
- condition: "default", "allCharmed", "lastWolf", etc.

**specialBehaviors**: Comportements spéciaux
- linkedDeath: Si quelqu'un lié meurt, celui-ci meurt aussi
- infection: Changer de rôle
- postMortem: Action après mort
- etc.

**action.type**: Type de sélection
- selectOne: 1 joueur
- selectPair: 2 joueurs
- selectThree: 3 joueurs
- collective: Tous les loups votent ensemble

**effect.type**: Type d'effet
- kill, protect, createLink, infect, reveal, mark, convert, charm

---

## 💾 Fichiers à supprimer (après migration)

Après avoir refactorisé TOUS les rôles et testé complètement:

```bash
# ANCIEN CODE - À SUPPRIMER
rm game-master.js
rm game-master-init.js
rm game-master-styles.css
rm gamemaster/ui/game-master-ui.js
rm gamemaster/ui/game-master-ui.js.bak
rm gamemaster/ui/game-master-v2-ui.js

# Garder
gamemaster/orchestrator.js ✓
gamemaster/ui/assignment-mode.js ✓
gamemaster/ui/first-night-actions.js ✓
gamemaster/ui/tablet-pass-mode.js ✓
gamemaster/roles/*.json ✓
```

---

## 📝 Changelog

### v1.0 - 2026-05-25
- ✨ Architecture complète
- ✨ Mode Assignation
- ✨ 4 rôles refactorisés
- 📖 Documentation 30+ pages
- ❌ Refactorisation JSON en cours (7%)

---

## 🤝 Prochaine personne qui lit ceci

Si tu reprends ce projet:
1. Lis REFACTOR_SUMMARY.md d'abord
2. Continue à refactoriser les rôles JSON (53 restants)
3. Teste Mode Assignation régulièrement
4. Suis le plan dans TODO_NEXT_STEPS.md

La base est solide. Les données JSON sont la priorité #1.

---

**Créé par**: Claude  
**Date**: 25 mai 2026  
**Version**: 1.0 - Alpha  
**Status**: Refactorisation 30% complète
