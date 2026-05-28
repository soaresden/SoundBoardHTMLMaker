# 🎭 Mode Maître du Jeu Animé (MDJ) - Documentation Complète

## 📋 Vue d'ensemble

Le **Mode Maître du Jeu Animé (MDJ)** est un système complet permettant au maître du jeu de gérer la partie Loup-Garou de manière entièrement manuelle avec :

- **Interface interactive** avec listbox + table de joueurs
- **Logging complet** de toutes les actions en temps réel
- **Gestion des deux nuits** (première nuit + nuits 2+)
- **Deux modes de tirage** (manuel avec cartes physiques, ou web avec assignation)
- **Routing automatique** entre les phases du jeu

---

## 🎮 Architecture Générale

### Flux du Jeu (Mode MDJ)

```
01-ChooseCard.js (Sélection des rôles)
        ↓
02-TirageMode.js (Sélection du mode de tirage)
        ├─ 🎴 Manuel → FirstNight-MDJ (directement)
        └─ 💻 Web   → 02-TableAndRename.js → FirstNight-MDJ
        ↓
03-FirstNight-MDJ.js (Gestion première nuit)
        ↓
05-Day.js (Jour 1)
        ↓
06-Night-MDJ.js (Nuit 2+)
        ↓
05-Day.js (Jour 2+)
        ↓
... (boucle jour/nuit jusqu'à victoire)
```

---

## 📦 Fichiers Créés / Modifiés

### Nouveaux Fichiers

#### 1. **gamemaster/phases/02-TirageMode.js**
**Responsabilité**: Sélection du mode de tirage des rôles

**Interface**:
- Deux options: 🎴 Manuel | 💻 Web
- Design clair avec descriptions
- Routing automatique vers phase suivante

**Logique**:
```javascript
selectTirageMode(tirageMode) {
  this.gm.state.tirageMode = tirageMode;
  if (tirageMode === 'manuel') {
    this.orchestrator.changePhase('firstNight');
  } else if (tirageMode === 'web') {
    this.orchestrator.changePhase('tableAndRename');
  }
}
```

---

#### 2. **gamemaster/phases/03-FirstNight-MDJ.js**
**Responsabilité**: Gestion de la première nuit en mode MDJ

**Architecture UI**:
```
┌─────────────────────────────────────────────────────┐
│  🌙 Nuit 1 - Rôles à Gérer (0/12)                  │
├────────────────────────────────────────────────────┤
│ LEFT PANEL      │ CENTER PANEL  │ RIGHT PANEL      │
│ (250px)         │ (flex)        │ (350px)         │
├─────────────────┼───────────────┼─────────────────┤
│ Listbox rôles   │ Action buttons│ Player table    │
│ - Cupidon ✓     │ (dynamique)   │ [Sophie] [Katy] │
│ - Chien Loup    │               │ [Denis] [Leo]   │
│ - Voyante       │ Selected:     │                 │
│ - etc.          │ 0/2 joueurs   │ (cliquez)       │
└─────────────────┴───────────────┴─────────────────┘
│ LOGS PANEL                                         │
│ 26/05/2026 à 08:05:21 : 💘 Cupidon - a coloré    │
│ 26/05/2026 à 08:06:15 : 🎯 Enfant_Sauvage - ...  │
└────────────────────────────────────────────────────┘
```

**Rôles Gérés**:
- Cupidon, Enfant_Sauvage, Chien_Loup, Voyante, Salvateur
- Renard, Simple_Loup_Garou, Grand_Mechant_Loup
- Loup_Garou_Blanc, Sorcière, Corbeau

**Actions par Rôle**:
```javascript
{
  'Cupidon': [{ id: 'lover', icon: '💕', label: 'Colorer les amoureux (2)' }],
  'Enfant_Sauvage': [{ id: 'idol', icon: '🎯', label: 'Désigner l\'idole (1)' }],
  'Voyante': [{ id: 'see_role', icon: '👁️', label: 'Voir le rôle d\'un joueur' }],
  'Salvateur': [{ id: 'protect', icon: '🛡️', label: 'Protéger un joueur' }],
  // ... etc
}
```

**Workflow Utilisateur**:
1. MDJ voit la liste des rôles actifs à gauche
2. Clique sur un rôle → actions spécifiques s'affichent au centre
3. Sélectionne les joueurs concernés dans la table à droite
4. Clique "Confirmer" → action loggée et rôle marqué comme complété ✓
5. Progressbar met à jour (X/N rôles complétés)
6. Quand tous les rôles sont done → transition automatique vers le jour

---

#### 3. **gamemaster/phases/06-Night-MDJ.js**
**Responsabilité**: Gestion des nuits 2+ en mode MDJ

**Différences avec FirstNight-MDJ**:
- Rôles différents (pas de Cupidon, Enfant_Sauvage, Chien_Loup)
- Vérifications conditionnelles:
  - Grand_Mechant_Loup: seulement si 0 loups tués
  - Loup_Garou_Blanc: seulement nuits impaires
  - Sorcière: avec limitations de potions
- Bouton "Passer à la nuit suivante" au lieu de transition auto

**Rôles Actifs**:
```javascript
shouldRoleWakeUpTonight(roleId, nightNumber) {
  // Vérifie activePeriod === 'firstNightOnly'
  // Gère Grand_Mechant_Loup et Loup_Garou_Blanc
  // Retourne true/false pour inclusion dans la listbox
}
```

---

#### 4. **gamemaster/utils/logging.js**
**Responsabilité**: Système de logging professionnel

**Format de Log**:
```
DD/MM/YYYY à HH:MM:SS : Role - Action - Details
26/05/2026 à 08:05:21 : 💘 Cupidon - a colorer les amoureux - Sophie & Denis
26/05/2026 à 08:06:15 : 🎯 Enfant_Sauvage - a désigner l'idole - Li
26/05/2026 à 08:07:00 : 🌙 Nuit 1 commence
```

**API Complète**:
```javascript
// Log une action
logger.logAction('💘 Cupidon', 'a colorer les amoureux', ['Sophie', 'Denis']);

// Log l'assignation d'un rôle
logger.logRoleAssignment('💘 Cupidon', 'Sophie');

// Log le début/fin d'une nuit
logger.logNightStart(1);
logger.logMorning(1);

// Log une mort
logger.logDeath('Sophie', 'tuée par les loups');

// Export des logs
logger.exportAsText(); // Retourne string
logger.getLogs();      // Retourne array
```

---

### Fichiers Modifiés

#### **gamemaster/orchestrator.js**
```javascript
// Ajout des propriétés MDJ
this.state = {
  // ... propriétés existantes ...
  tirageMode: null,   // 'manuel' ou 'web'
  gameMode: null,     // 'assiste' ou 'mdj'
};

// Nouvelle méthode
changePhase(phaseName) {
  console.log(`[Orchestrator] Changing phase to: ${phaseName}`);
  this.state.mode = phaseName;
  this.saveState();
  if (window.gameMasterUI) {
    window.gameMasterUI.render();
  }
}
```

#### **gamemaster/ui/game-master-ui.js**
```javascript
// Routing pour les phases MDJ
else if (mode === 'tirageMode') {
  // Affiche TirageMode fullscreen
  this.handlePhaseRendering('tirageMode', gmContent);
}
else if (mode === 'firstNight' && this.gm.state.gameMode === 'mdj') {
  // Affiche FirstNight-MDJ fullscreen
  this.handlePhaseRendering('firstNightMdj', gmContent);
}
else if (mode === 'night' && this.gm.state.gameMode === 'mdj') {
  // Affiche Night-MDJ fullscreen
  this.handlePhaseRendering('nightMdj', gmContent);
}

// Handler pour instancier les phases
handlePhaseRendering(phaseName, container) {
  switch(phaseName) {
    case 'tirageMode':
      new TirageMode(this.gm).init();
      break;
    case 'firstNightMdj':
      new FirstNightMDJ(this.gm).init();
      break;
    case 'nightMdj':
      new NightMDJ(this.gm).init();
      break;
  }
}
```

#### **gamemaster/ui/02-CardSelection.js**
```javascript
// Routing vers TirageMode au lieu de tableSetup
gameUI.gm.state.mode = 'tirageMode'; // au lieu de 'tableSetup'
```

#### **index.html**
```html
<!-- Scripts ajoutés -->
<script src="gamemaster/utils/logging.js"></script>
<script src="gamemaster/phases/02-TirageMode.js"></script>
<script src="gamemaster/phases/03-FirstNight-MDJ.js"></script>
<script src="gamemaster/phases/06-Night-MDJ.js"></script>
```

---

## 🎨 Design de l'Interface

### Layout Général

**Toutes les phases MDJ utilisent le même layout 3-colonnes**:

| Zone | Largeur | Contenu |
|------|---------|---------|
| **LEFT** | 250px | Listbox des rôles actifs |
| **CENTER** | Flex | Action buttons + player selection |
| **RIGHT** | 350px | Interactive player table |
| **BOTTOM** | Full | Real-time action logs |

### Styles CSS Clés

```css
.night-mdj {
  display: grid;
  grid-template-columns: 250px 1fr 350px;
  grid-template-rows: 1fr auto auto;
  height: 100%;
  gap: 1rem;
}

/* Listbox items */
.listbox-item {
  padding: 0.75rem;
  border: 2px solid transparent;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.2s ease;
}
.listbox-item.selected { background: #e3f2fd; border-color: #2196f3; }
.listbox-item.completed { opacity: 0.6; background: #e8f5e9; }

/* Player cards */
.player-card { 
  padding: 0.75rem;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}
.player-card.selected { 
  background: #fff9c4;
  border-color: #fbc02d;
  box-shadow: 0 0 0 3px rgba(251, 192, 45, 0.2);
}
```

---

## 🔄 État et Flux de Données

### State (gm.state)

```javascript
{
  // Propriétés MDJ
  tirageMode: 'manuel' | 'web',
  gameMode: 'mdj' | 'assiste',
  
  // Mode spécifique
  mdj_roleIndex: 0,
  mdj_completedRoles: [],
  mdj_currentAction: 'amoureux' | null,
  mdj_selectedPlayers: [],
  
  // Données de jeu (partagées)
  players: [{name, roleId, isDead, ...}],
  currentNightNumber: 1,
  wolvesKilledThisNight: 0,
  linkedPlayers: {playerId: linkedPlayerId},
  ...
}
```

### Instances Locales (dans les phases)

```javascript
class FirstNightMDJ {
  this.selectedRoleId = null;        // Rôle sélectionné
  this.selectedPlayers = [];         // Joueurs en sélection
  this.actionState = {               // Action en cours
    roleId, action, roleName, roleEmoji, targetCount
  };
  this.roleStates = {                // État de chaque rôle
    [roleId]: { completed, selected, result }
  };
}
```

---

## 🎯 User Journey (MDJ)

### Scénario: Gestion de la première nuit

```
1. MDJ voit écran "🌙 Nuit 1 - Rôles à Gérer"
   └─ Listbox: [Cupidon] [Chien Loup] [Voyante] [Salvateur] ...

2. Clique sur [Cupidon]
   └─ Action buttons: [💕 Colorer les amoureux (2)]
   └─ Right panel: shows players [Sophie] [Katy] [Denis] ...

3. Action sélectionnée: "Colorer les amoureux"
   └─ Center shows: "Sélectionnés: 0/2"

4. Clique sur [Sophie] et [Denis]
   └─ Cards highlight yellow, tags appear
   └─ Center shows: "Sélectionnés: 2/2" + [✓ Confirmer]

5. Clique [✓ Confirmer]
   └─ Log: "26/05 08:05 : 💘 Cupidon - a colorer les amoureux - Sophie & Denis"
   └─ [Cupidon] marked as completed ✓
   └─ Progress: "1/12"

6. Repeat steps 2-5 for other roles

7. When all roles done
   └─ Auto-transition to [05-Day.js]
   └─ MDJ plays day phase
   └─ Auto-transition back to [06-Night-MDJ.js]
```

---

## 🔐 Safety & Validation

### Validations Implémentées

```javascript
// Vérification du nombre de joueurs
if (targetCount > 0 && selectedPlayers.length >= targetCount) {
  console.warn(`Cannot select more than ${targetCount} player(s)`);
  return;
}

// Vérification du rôle wake-up
if (!shouldRoleWakeUpTonight(roleId, nightNumber)) {
  // N'inclure pas dans la listbox
  continue;
}

// Vérification de completion avant transition
const allCompleted = Object.values(roleStates).every(
  state => state.completed
);
if (allCompleted) {
  skipToNextPhase();
}
```

---

## 📊 Test Scenarios

### Scenario 1: Manuel Tirage - Première Nuit Complète
```
✓ Select roles (16 joueurs, 16 rôles)
✓ Choose "🎴 Manuel tirage"
✓ See FirstNight-MDJ
✓ Complete Cupidon (2 joueurs)
✓ Complete Chien Loup (1 joueur)
✓ ... (complete all roles)
✓ Auto-transition to Day
✓ Verify logs in console
```

### Scenario 2: Web Tirage - Full Game Loop
```
✓ Select roles
✓ Choose "💻 Web tirage"
✓ Table setup (assign roles via interface)
✓ See FirstNight-MDJ
✓ Complete all role actions
✓ Day phase
✓ Night 2+ in MDJ mode
✓ Verify Grand_Mechant_Loup conditional logic
✓ Verify Loup_Garou_Blanc odd-night logic
✓ Game ends with winner
```

### Scenario 3: Logging Verification
```
✓ Each action logged with DD/MM/YYYY HH:MM:SS format
✓ Logs appear real-time in bottom panel
✓ Auto-scroll to latest
✓ Can export all logs
✓ Night start/end marked
```

---

## 🚀 Deployment Checklist

- [x] TirageMode.js created and routing works
- [x] FirstNight-MDJ.js created with full interactivity
- [x] NightMDJ.js created for nights 2+
- [x] logging.js utility complete
- [x] Orchestrator updated with state + changePhase()
- [x] game-master-ui.js router updated
- [x] Scripts included in index.html
- [x] Card selection routes to TirageMode
- [ ] End-to-end test from role selection → win/lose
- [ ] Verify all logs capture correctly
- [ ] Performance test with 16+ players

---

## 📝 Notes pour le Développement Futur

### Assisté Complet Mode (commented out)
When ready to implement Mode Assisté Complet:
1. Uncomment routes in game-master-ui.js
2. Create 03-GameModeSelection.js
3. Implement automated action resolution
4. Wire up game phase handlers

### Enhancements Possibles
- Export logs to CSV/JSON
- Screenshot/download game transcript
- Undo last action
- Pause/resume game
- Custom action templates
- Multi-language support
- Sound notifications

---

## 🎓 Architecture Principles Used

1. **Separation of Concerns**: Each phase handles its own UI + logic
2. **State Centralization**: All game state in gm.state via orchestrator
3. **Event-Driven**: Phase transitions via orchestrator.changePhase()
4. **Logging First**: Every action logged before state change
5. **JSON-Driven Roles**: All role data from JSON, not hardcoded
6. **Immutable Phase Instances**: New instance per phase, no persistence

---

## 📞 Support

For issues or enhancements:
1. Check logging output in browser console
2. Verify role JSON has actionType + activePeriod
3. Check gameMode state: `window.gm.state.gameMode`
4. Review logs: `window.gameLogger.getLogs()`

---

**Document Generated**: 2026-05-28  
**MDJ Mode Version**: 1.0  
**Status**: ✅ Ready for Testing
