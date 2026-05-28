# 🎮 Plan d'Implémentation - Deux Modes de Jeu

## Architecture Globale

```
Démarrage du jeu
    ↓
[01-ChooseCard.js] → Sélectionner les rôles
    ↓
[02-TirageMode.js] ⭐ NOUVEAU
    ├─ 🎴 Tirage Manuel (cartes physiques)
    └─ 💻 Tirage Web (assignation par page)
    ↓
[03-GameModeSelection.js] ⭐ NOUVEAU
    ├─ 🤖 Mode Assisté Complet
    └─ 🎭 Mode Maître du Jeu Animé
    ↓
Si TIRAGE WEB:
    [02-TableAndRename.js] → Assignation des rôles
    ↓
[03-FirstNight.js ou 03-FirstNight-MDJ.js] ⭐ NOUVEAU
    ├─ Mode Assisté: Flow automatisé (existant)
    └─ Mode MDJ: Listbox + Table interactive (NOUVEAU)
```

---

## 📋 Modules à Créer/Modifier

### 1. **02-TirageMode.js** ⭐ NOUVEAU
Écran de sélection du mode de tirage après les rôles

```javascript
// Affiche deux options:
// - 🎴 Tirage Manuel (cartes physiques, pas d'assignation web)
// - 💻 Tirage Web (assignation par interface)

// Stocke dans gm.state.tirageMode = "manuel" | "web"
```

### 2. **03-GameModeSelection.js** ⭐ NOUVEAU
Écran de sélection du mode de jeu après le tirage

```javascript
// Affiche deux options:
// - 🤖 Mode Assisté Complet
// - 🎭 Mode Maître du Jeu Animé

// Stocke dans gm.state.gameMode = "assiste" | "mdj"
```

### 3. **03-FirstNight-MDJ.js** ⭐ NOUVEAU
Premier soir en mode MDJ Animé (listbox + table interactive)

```javascript
// Layout:
// - Gauche: Listbox avec ordre des rôles
// - Droite: Table en temps réel

// Rôles sélectionnés affichent leurs actions
// MDJ clique sur la table pour appliquer les actions

// Gère:
// - Colorer amoureux
// - Colorer idole
// - Tuer/Revivre
// - Immuniser (Salvateur)
// - Potions (Sorcière)
// - Renifler (Renard)
// - Etc.
```

### 4. **06-Night-MDJ.js** ⭐ NOUVEAU
Nuits 2+ en mode MDJ Animé

```javascript
// Même architecture que FirstNight-MDJ
// Mais avec rôles différents et logique simplifiée
```

### 5. **03-FirstNight.js** 🔧 MODIFIER
Ajouter condition sur le mode

```javascript
// À l'ouverture:
if (gameMode === "mdj") {
  // Charger 03-FirstNight-MDJ.js
} else {
  // Flow existant (mode assisté)
}
```

### 6. **06-Night.js** 🔧 MODIFIER
Ajouter condition sur le mode

```javascript
// Même logique que 03-FirstNight.js
```

---

## 🎯 Fonctionnalités Mode MDJ

### Listbox Gauche
```
┌────────────────────┐
│ 🌙 NUIT 1          │
├────────────────────┤
│                    │
│ ✓ Cupidon          │ ← Sélectionné
│   [Actions du rôle]│
│                    │
│ [ ] Enfant_Sauvage │
│ [ ] Chien_Loup     │
│ [ ] Voyante        │
│ ...                │
│                    │
│ ✓ 12/15 complétés  │
└────────────────────┘
```

### Actions par Rôle
- **Cupidon**: Colorer amoureux
- **Enfant_Sauvage**: Colorer idole
- **Voyante**: Voir le rôle (affiche)
- **Salvateur**: Immuniser
- **Renard**: Renifler (affiche résultat)
- **Loups**: Tuer collectif
- **Sorcière**: Ressusciter / Empoisonner
- **Corbeau**: Voler votes
- **Tous**: Tuer / Revivre (toujours disponible)

### Table Droite
```
Mode: 💕 Colorer amoureux
→ Cliquez sur 2 joueurs

[Sophie] [Katy]💕 [Denis] [Anthony]
         🎯 Click pour ajouter à la paire

Compteurs:
- Potions Sorcière: 2/2
- Immunité Salvateur: ✓
- Loups tués: 0
```

---

## 🔄 État dans gameState

```javascript
state = {
  // Existant
  mode: "selectRoles" | "assignment" | "firstNightActions" | "night" | "day",
  players: [...],
  selectedRoles: {...},
  gamePhase: "setup" | "assignment" | "firstNightActions" | "night" | "day",
  
  // NOUVEAU
  tirageMode: "manuel" | "web",        // Mode de tirage
  gameMode: "assiste" | "mdj",          // Mode de jeu
  
  // MDJ Mode specific
  mdj_roleIndex: 0,                     // Index du rôle actuel
  mdj_completedRoles: [],               // Rôles complétés
  mdj_currentAction: "amoureux" | "idole" | null,  // Action en cours
  mdj_selectedPlayers: [],              // Joueurs sélectionnés
}
```

---

## 🚀 Ordre d'Implémentation

### Phase 1: Sélection des modes
1. ✅ 02-TirageMode.js
2. ✅ 03-GameModeSelection.js
3. ✅ Modifier 03-FirstNight.js pour aiguiller

### Phase 2: Mode MDJ - Première nuit
1. ✅ 03-FirstNight-MDJ.js (Listbox + Table)
2. ✅ Interaction joueurs (colorer, tuer, revivre)
3. ✅ Actions spécifiques par rôle

### Phase 3: Mode MDJ - Nuits 2+
1. ✅ 06-Night-MDJ.js
2. ✅ Adapter les actions pour les nuits suivantes

### Phase 4: Mode Assisté (existant)
- Garder le flow actuel
- Juste ajouter la condition gameMode

---

## 🎨 UI Components Nécessaires

- **RoleListbox** - Liste des rôles avec actions
- **ActionButton** - Boutons d'action (Colorer, Tuer, etc.)
- **PlayerClickHandler** - Gestion des clics sur la table
- **RoleStateIndicator** - Affiche l'état d'un rôle (complété, en cours, etc.)
- **CounterDisplay** - Affiche les compteurs (potions, kills, etc.)

---

## 📊 Fichiers à Créer/Modifier

**À Créer:**
- [ ] gamemaster/phases/02-TirageMode.js
- [ ] gamemaster/phases/03-GameModeSelection.js
- [ ] gamemaster/phases/03-FirstNight-MDJ.js
- [ ] gamemaster/phases/06-Night-MDJ.js

**À Modifier:**
- [ ] gamemaster/phases/03-FirstNight.js (aiguillage)
- [ ] gamemaster/phases/06-Night.js (aiguillage)
- [ ] gamemaster/orchestrator.js (ajouter state)
- [ ] gamemaster/ui/game-master-ui.js (router)

---

**Status:** 🎯 Prêt à commencer Phase 1

Document généré: 2026-05-28 ✅
