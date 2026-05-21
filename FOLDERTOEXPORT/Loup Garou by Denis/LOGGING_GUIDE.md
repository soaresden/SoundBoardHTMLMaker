# 📊 GUIDE DU SYSTÈME DE LOGGING AVANCÉ

## 🎯 Objectif

Tracker **chaque action**, **clique**, **assignation**, **statut**, **mort**, **vote**, etc. dans la console avec des logs détaillés et structurés.

---

## 🚀 Utilisation

### 1. Logs Automatiques

Le système de logging s'initialise automatiquement quand le jeu démarre. Chaque action importante génère un log coloré.

### 2. Accès au Logger

```javascript
// Dans la console du navigateur:
window.gameLogger
```

### 3. Commandes Utiles

```javascript
// Voir tous les logs
window.gameLogger.printFullLog();

// Résumé de la partie
window.gameLogger.printGameSummary();

// Exporter les logs
const data = window.gameLogger.exportLogs();
console.log(data);

// État du jeu en temps réel
window.gameLogger.getGameState();

// Liste des joueurs
window.gameLogger.getPlayerList();

// Tous les statuts actifs
window.gameLogger.getAllStatuses();
```

---

## 📝 Types de Logs

### 🎨 Codes Couleur

| Type | Couleur | Utilisation |
|------|---------|-------------|
| **action** | 🟢 Vert | Actions de rôles |
| **click** | 🔵 Bleu | Clics de souris |
| **assignment** | 🟠 Orange | Assignation de rôles |
| **death** | 🔴 Rouge | Morts de joueurs |
| **status** | 🟣 Violet | Statuts appliqués |
| **vote** | 🟡 Jaune | Votes |
| **phase** | 🔷 Cyan | Changements de phase |
| **error** | 🩷 Rose | Erreurs |
| **info** | ⚫ Gris | Informations générales |

---

## 🔧 API du Logger

### Assignation de Rôle

```javascript
window.gameLogger.onPlayerAssigned(
  playerId,      // "player_123"
  playerName,    // "Loris"
  roleId,        // "Renard"
  roleName       // "Renard"
);
```

**Affiche:** ✅ Loris assigné au rôle Renard

### Auto-Assignation (Voyante)

```javascript
window.gameLogger.onAutoAssignment(
  playerId,      // "player_456"
  playerName,    // "Benoît"
  roleId,        // "Renard"
  roleName,      // "Renard"
  discoveredBy   // "Voyante (Marion)"
);
```

**Affiche:** 🔮 Auto-assignation: Benoît = Renard (découvert par Voyante)

### Mort d'un Joueur

```javascript
window.gameLogger.onPlayerDeath(
  playerId,      // "player_789"
  playerName,    // "Marion"
  cause          // "wolf" | "vote" | "linked" | "infection"
);
```

**Affiche:** ☠️ Marion est mort(e) (wolf)

### Statuts

```javascript
// Appliquer
window.gameLogger.onStatusApplied(
  playerId,      // "player_123"
  playerName,    // "Loris"
  statusId,      // "Amoureux"
  statusName,    // "Amoureux"
  details        // { partner: "Benoît" }
);

// Supprimer
window.gameLogger.onStatusRemoved(
  playerId,      // "player_123"
  playerName,    // "Loris"
  statusId,      // "Amoureux"
  statusName     // "Amoureux"
);
```

### Amoureux (Cupidon)

```javascript
window.gameLogger.onLoversCreated(
  player1Name,   // "Loris"
  player2Name,   // "Benoît"
  player1Id,     // "player_123"
  player2Id      // "player_456"
);
```

**Affiche:** 💕 Loris ❤️ Benoît deviennent Amoureux

### Mort Liée

```javascript
window.gameLogger.onLinkedDeath(
  deceasedName,  // "Loris"
  partnerName,   // "Benoît"
  deceasedId,    // "player_123"
  partnerId      // "player_456"
);
```

**Affiche:** 💔 Benoît meurt car amoureux de Loris

### Cliques

```javascript
window.gameLogger.onButtonClick(
  buttonId,      // "btnCupidoConfirm"
  buttonName,    // "Confirmer Cupidon"
  targetElement  // <button> element
);
```

**Affiche:** Clic sur bouton "Confirmer Cupidon"

### Voyante

```javascript
window.gameLogger.onVoyanteLook(
  voyanteName,   // "Marion"
  targetName,    // "Loris"
  targetRole,    // "Renard"
  voyanteId,     // "player_voyante"
  targetId       // "player_123"
);
```

**Affiche:** 👁️ Marion (Voyante) regarde Loris

### Actions de Nuit

```javascript
window.gameLogger.onNightAction(
  actorName,     // "Marion"
  actionType,    // "Voyante regarde"
  target,        // "Loris"
  details        // { role: "Renard" }
);
```

**Affiche:** 🌙 Marion (Voyante regarde) agit sur Loris

### Vote

```javascript
// Début du vote
window.gameLogger.onVoteStart(turn, dayNumber);

// Chaque vote
window.gameLogger.onVoteCast(
  voterName,     // "Loris"
  votedForName,  // "Marion"
  voterId,       // "player_123"
  votedForId,    // "player_456"
  voteWeight     // 1 ou 2 (Maire)
);

// Fin du vote
window.gameLogger.onVoteEnd(
  winnerName,    // "Marion"
  winnerId,      // "player_456"
  voteCount      // 5
);
```

### Phase

```javascript
window.gameLogger.onPhaseChange(
  newPhase,      // "Nuit 1" ou "Jour 1"
  newTurn,       // 1, 2, 3, ...
  newNightStatus // true ou false
);
```

**Affiche:** 🌙/☀️ Changement de phase: Nuit 1 (Nuit 1)

---

## 📊 État du Jeu

### Getter: État Résumé

```javascript
window.gameLogger.getGameState();
// Retourne: {
//   mode: "selectRoles",
//   players: 10,
//   alive: 8,
//   dead: 2,
//   turn: 3,
//   phase: "Jour",
//   gamePhase: "night1-wolves"
// }
```

### Getter: Liste des Joueurs

```javascript
window.gameLogger.getPlayerList();
// Retourne: [
//   { id: "p1", name: "Loris", role: "Renard", alive: true, statuses: ["Amoureux"] },
//   { id: "p2", name: "Benoît", role: "Villageois", alive: false, statuses: [] },
//   ...
// ]
```

### Getter: Joueurs Vivants

```javascript
window.gameLogger.getAlivePlayers();
// Retourne: [
//   { name: "Loris", role: "Renard" },
//   { name: "Marion", role: "Voyante" },
//   ...
// ]
```

### Getter: Tous les Statuts

```javascript
window.gameLogger.getAllStatuses();
// Retourne: {
//   "Loris": ["Amoureux"],
//   "Marion": ["Charmé"],
//   "Benoît": ["Amoureux", "Infecté"]
// }
```

### Getter: Status d'Assignation

```javascript
window.gameLogger.getAssignmentStatus();
// Retourne: [
//   { name: "Loris", assigned: "✅", role: "Renard" },
//   { name: "Marion", assigned: "✅", role: "Voyante" },
//   { name: "Benoît", assigned: "❌", role: "en attente" }
// ]
```

---

## 💾 Export des Logs

```javascript
const exportedData = window.gameLogger.exportLogs();

// Contient:
// - eventCount: nombre d'événements
// - startTime: heure de démarrage ISO
// - duration: durée totale
// - logs: tous les logs structurés
// - finalState: état final du jeu
// - playerStatus: état final des joueurs
```

---

## 🎮 Intégration dans le Code

### Dans 03-FirstNight.js:

```javascript
function attachCupidoHandlers() {
  const cupidoBtn = document.getElementById('gmCupidoConfirm');
  if (cupidoBtn) {
    cupidoBtn.addEventListener('click', () => {
      // Log du clic
      window.gameLogger?.onButtonClick('gmCupidoConfirm', 'Confirmer Cupidon', cupidoBtn);

      const selected = getSelectedPlayers();
      if (selected.length === 2) {
        // Log de création des amoureux
        window.gameLogger?.onLoversCreated(
          selected[0].name, selected[1].name,
          selected[0].id, selected[1].id
        );

        gm.createLovers(selected[0].id, selected[1].id);
        gameUI.render();
      }
    });
  }
}
```

### Dans 04-FirstNight-Actions.js:

```javascript
function updateVoyanteResult(gm, voyanteId, targetId) {
  const voyante = gm.state.players.find(p => p.id === voyanteId);
  const target = gm.state.players.find(p => p.id === targetId);
  const roleInfo = gm.getRoleInfo(target.roleId);

  // Log de la Voyante
  window.gameLogger?.onVoyanteLook(
    voyante.name, target.name, target.roleId,
    voyanteId, targetId
  );

  // ... reste du code
}
```

### Quand un joueur meurt:

```javascript
function handlePlayerDeath(playerId) {
  const player = gm.state.players.find(p => p.id === playerId);
  
  // Log de la mort
  window.gameLogger?.onPlayerDeath(playerId, player.name, 'wolf');
  
  // Gérer la mort
  statusHandler.onPlayerDeath(playerId, 'wolf');
}
```

---

## 🔍 Exemples d'Utilisation

### Déboguer l'assignation:

```javascript
window.gameLogger.getAssignmentStatus();
// Voir qui est assigné et qui ne l'est pas
```

### Voir l'historique d'un joueur:

```javascript
const logs = window.gameLogger.logs.filter(log => 
  log.data?.playerName === "Loris" || 
  log.message.includes("Loris")
);
logs.forEach(log => console.log(log));
```

### Voir tous les cliques:

```javascript
const clicks = window.gameLogger.logs.filter(log => log.type === 'click');
console.table(clicks);
```

### Voir toutes les morts:

```javascript
const deaths = window.gameLogger.logs.filter(log => log.type === 'death');
console.table(deaths.map(d => ({ name: d.data.playerName, role: d.data.role, cause: d.data.cause })));
```

### Voir le temps écoulé:

```javascript
console.log(window.gameLogger.logs[window.gameLogger.logs.length - 1].elapsed);
```

---

## 🎯 Checklist d'Intégration

- [ ] Ajouter `onButtonClick()` à tous les boutons cliquables
- [ ] Ajouter `onPlayerAssigned()` quand un rôle est assigné
- [ ] Ajouter `onAutoAssignment()` quand Voyante découvre
- [ ] Ajouter `onLoversCreated()` quand Cupidon crée des amoureux
- [ ] Ajouter `onStatusApplied()` pour chaque statut
- [ ] Ajouter `onPlayerDeath()` quand un joueur meurt
- [ ] Ajouter `onVoyanteLook()` quand Voyante regarde
- [ ] Ajouter `onVoteStart()` et `onVoteEnd()`
- [ ] Ajouter `onPhaseChange()` pour chaque changement de phase

---

## 📈 Exemple de Log Complet

```
[1] ASSIGNMENT @ 10:45:23 (2.15s)
📝 ✅ Loris assigné au rôle Renard
{
  playerId: "player_123",
  playerName: "Loris",
  roleId: "Renard",
  roleName: "Renard",
  previousRole: "aucun",
  allPlayers: [
    { id: "player_123", name: "Loris", role: "Renard", alive: true },
    { id: "player_456", name: "Benoît", role: "non assigné", alive: true },
    ...
  ]
}
🎮 État du jeu: {
  mode: "playing",
  players: 10,
  alive: 10,
  dead: 0,
  turn: 0,
  phase: "Jour",
  gamePhase: "assignment"
}
```

---

## 🚀 Commandes Rapides

```javascript
// Dans la console du navigateur:

// Afficher tous les logs
window.gameLogger.printFullLog();

// Afficher le résumé
window.gameLogger.printGameSummary();

// État actuel
window.gameLogger.getGameState();

// Liste des joueurs
window.gameLogger.getPlayerList();

// Statuts actifs
window.gameLogger.getAllStatuses();

// Exporter
window.gameLogger.exportLogs();

// Nombre d'événements
window.gameLogger.eventCount;
```

---

**Créé:** 2026-05-21  
**Statut:** ✅ Prêt à l'emploi
