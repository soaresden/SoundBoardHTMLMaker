# 🎮 SYSTÈME DE STATUTS - IMPLÉMENTATION COMPLÈTE

## 📚 Vue d'ensemble

Les **statuts** sont des modificateurs appliqués à un joueur par les rôles. Ils permettent de:
- ✅ Lier des joueurs ensemble (Amoureux, Charmés)
- ✅ Modifier les pouvoirs du joueur (Maire = 2 voix)
- ✅ Changer le camp du joueur (Infecté = devient Loup)
- ✅ Créer des conditions de mort spéciales (Mort liée)
- ✅ Persister jusqu'à la mort du joueur

---

## 🏗️ Architecture Technique

### Fichiers créés:
1. **`statuses-data.js`** → Définition des statuts (métadonnées, comportements)
2. **`statuses-handlers.js`** → Logique événementielle (mort, vote, fin de nuit)
3. **`game-master.js`** (enrichi) → Méthodes de gestion des statuts
4. **`roles-data.js`** (enrichi) → Tous les 52+ rôles avec métadonnées

### Chargement dans index.html:
```html
<script src="roles-data.js"></script>
<script src="statuses-data.js"></script>
<script src="game-master.js"></script>
<script src="statuses-handlers.js"></script>
<script src="game-master-ui.js"></script>
```

---

## 📝 Structure des Données

### Structure joueur enrichie:
```javascript
player = {
  id: "player_123",
  name: "Loris",
  roleId: "Renard",
  isDead: false,
  // NOUVEAU:
  statuses: {
    "Amoureux": { partner: "player_456" },
    "Charmé": { source: "player_789" }
  }
}
```

### Structure état du jeu:
```javascript
state = {
  players: [...],
  playerStatuses: {  // NOUVEAU
    "player_123": {
      "Amoureux": { partner: "player_456" },
      "Charmé": { source: "player_789" }
    },
    ...
  },
  gameState: {
    mayor: "player_123",  // Ou null
    ...
  }
}
```

---

## 🎯 Les 6 Statuts Implémentés

### 1. **Amoureux** (Cupidon)
```javascript
gm.createLovers(lorisId, benoitId);
// Résultat:
// - Loris a le statut Amoureux { partner: benoitId }
// - Benoît a le statut Amoureux { partner: lorisId }
// - Si Loris meurt → Benoît meurt aussi IMMÉDIATEMENT
// - Si Benoît meurt → Loris meurt aussi IMMÉDIATEMENT
```

**Comportement spécial:**
- Mort liée récursive (si B meurt après A, C qui était amoureux de B meurt aussi)
- Notification chat en temps réel
- Persiste tant que les deux vivent

---

### 2. **Charmé** (Joueur de Flûte)
```javascript
gm.charmPlayers(flutePlayerId, [playerIds]);
// Résultat:
// - Chaque joueur reçoit le statut Charmé { source: flutePlayerId }
// - Peuvent communiquer entre eux la nuit
// - Si tous les joueurs vivants sont charmés → Joueur de Flûte gagne!
```

**Comportement spécial:**
- Vérification automatique de la condition de victoire chaque nuit
- Groupe de communication spéciale
- Immunité à certaines actions

---

### 3. **Modèle** (Enfant Sauvage)
```javascript
gm.setChildModel(enfantId, modelId);
// Résultat:
// - Le Modèle a le statut Modèle { child: enfantId }
// - Si le Modèle meurt PAR LES LOUPS → Enfant devient Loup
// - Si le Modèle meurt AU VOTE → Rien ne se passe
```

**Comportement spécial:**
- Transformation conditionnelle (seulement par Loups)
- Le statut disparaît après la transformation
- Enregistrement dans l'historique

---

### 4. **Infecté** (Père des Loups)
```javascript
gm.infectPlayer(pereDesLoupsId, targetId);
// Résultat:
// - La cible reçoit le statut Infecté { source: pereDesLoupsId }
// - Son rôle change immédiatement en Simple_Loup_Garou
// - Il rejoint le camp des Loups
// - Son ancien pouvoir est perdu
```

**Comportement spécial:**
- Changement immédiat de rôle
- Changement immédiat de camp
- Perte des pouvoirs précédents

---

### 5. **Maire** (Vote du Village)
```javascript
gm.electMayor(playerId);
// Résultat:
// - Le joueur reçoit le statut Maire { }
// - Ses votes comptent pour 2 au lieu de 1
// - Si le Maire meurt, un Garde Champêtre peut lui succéder
```

**Comportement spécial:**
- Modificateur de vote x2
- Succession automatique (Garde Champêtre)
- Statut perdu à la mort

---

### 6. **Garde Champêtre** (Maire)
```javascript
gm.addStatusToPlayer(playerId, 'Garde_Champetre', {});
// Résultat:
// - Le joueur est l'assistant du Maire
// - S'il y a égalité au vote ET Maire mort → il devient Maire
// - Sinon il agit comme un Villageois normal
```

**Comportement spécial:**
- Succession héréditaire du titre
- Activation seulement à la mort du Maire
- Perte du statut si devient Maire

---

## 🔌 API Game Master

### Ajouter/Retirer un statut:
```javascript
// Ajouter
gm.addStatusToPlayer(playerId, 'Amoureux', { partner: otherPlayerId });

// Retirer
gm.removeStatusFromPlayer(playerId, 'Amoureux');

// Vérifier
gm.hasStatus(playerId, 'Amoureux'); // → true/false

// Récupérer tous les statuts
gm.getPlayerStatuses(playerId); // → { Amoureux: {...}, ... }
```

### Logique spécialisée:
```javascript
// Mort liée (Amoureux)
gm.createLovers(p1Id, p2Id);

// Charmer (Joueur de Flûte)
gm.charmPlayers(fluteId, [p1Id, p2Id, p3Id]);

// Idole (Enfant Sauvage)
gm.setChildModel(enfantId, modelId);

// Infection (Père des Loups)
gm.infectPlayer(pereId, targetId);

// Maire (Vote)
gm.electMayor(playerId);

// Poids du vote
gm.getPlayerVoteWeight(playerId); // → 1, 2, etc.
```

---

## 🎯 Événements & Hooks

### StatusesHandler:
```javascript
// Créer une instance
const statusHandler = new StatusesHandler(gm);

// Événements
statusHandler.onPlayerDeath(playerId, 'wolf'); // Morte par Loups
statusHandler.onPlayerDeath(playerId, 'vote'); // Morte au vote
statusHandler.onStatusApplied(playerId, 'Amoureux', {});
statusHandler.onVotingPhase(); // Recalculer les poids
statusHandler.onNightEnd(); // Vérifier les conditions
statusHandler.checkFluteWinCondition(); // Joueur de Flûte gagne?
```

### Intégration dans le code:
```javascript
// Dans 04-FirstNight-Actions.js ou autre:
if (gameInstance && gameInstance.gameMaster) {
  const statusHandler = new StatusesHandler(gameInstance.gameMaster);
  
  // Cupidon crée 2 amoureux
  statusHandler.onStatusApplied(lorisId, 'Amoureux', { partner: benoitId });
  statusHandler.onStatusApplied(benoitId, 'Amoureux', { partner: lorisId });
}
```

---

## 📊 Exemples d'Utilisation

### Exemple 1: Cupidon crée 2 amoureux
```javascript
// Première nuit, Cupidon choisit Loris et Benoît
const lorisId = 'player_123';
const benoitId = 'player_456';

gm.createLovers(lorisId, benoitId);
// ↓ Logs:
// "💘 Loris et Benoît sont maintenant Amoureux!"

// Plus tard, Loris meurt au vote
gm.state.players[0].isDead = true;
statusHandler.onPlayerDeath(lorisId, 'vote');
// ↓ Logs:
// "💔 Benoît meurt aussi car il/elle était amoureux(se) de Loris!"
// Benoît meurt IMMÉDIATEMENT
```

### Exemple 2: Joueur de Flûte gagne
```javascript
// Nuit 3, Joueur de Flûte charme les 5 derniers villageois
const fluteId = 'player_flute';
const targets = ['p1', 'p2', 'p3', 'p4', 'p5'];

gm.charmPlayers(fluteId, targets);
// ↓ Logs:
// "🎶 JoueFlûte charme joueur1 et joueur2 et ..."

// À la fin de la nuit
statusHandler.checkFluteWinCondition();
// ↓ Logs si tous sont charmés:
// "🎵 VICTOIRE JOUEUR DE FLÛTE! JoueurFlûte a enchanté tout le village!"
// La partie s'arrête
```

### Exemple 3: Enfant Sauvage devient Loup
```javascript
// Nuit 1, Enfant choisit son idole
const enfantId = 'player_enfant';
const idoleId = 'player_idole';

gm.setChildModel(enfantId, idoleId);
// ↓ Logs:
// "⭐ Enfant a choisi Idole comme idole"

// Nuit 2, les Loups tuent l'Idole
statusHandler.onPlayerDeath(idoleId, 'wolf');
// ↓ Logs:
// "🐺 Enfant devient un Loup-Garou car son idole Idole a été tuée par les Loups!"
// Le rôle de Enfant change de "Enfant_Sauvage" en "Simple_Loup_Garou"
```

### Exemple 4: Maire et succession
```javascript
// Jour 1, élection du Maire
const gailleId = 'player_gaelle';
gm.electMayor(gailleId);
// ↓ Logs:
// "👑 Gaëlle est élue Maire! (2 voix au vote)"

// Nuit suivante, les Loups tuent Gaëlle
statusHandler.onPlayerDeath(gailleId, 'wolf');
// ↓ Logs si Garde Champêtre existe:
// "👑 Olivier (ancien Garde Champêtre) devient nouveau Maire!"
// Olivier a maintenant 2 voix au vote
```

---

## 🚀 Intégration dans le Jeu

### 1. Cupidon (Nuit 1):
```javascript
// Fichier: 04-FirstNight-Actions.js
function attachCupidoHandlers() {
  const cupidoConfirmBtn = document.getElementById('gmCupidoConfirm');
  if (cupidoConfirmBtn) {
    cupidoConfirmBtn.addEventListener('click', () => {
      const selected = getSelectedPlayers(); // [player1, player2]
      if (selected.length === 2) {
        gm.createLovers(selected[0].id, selected[1].id);
        updateUI();
      }
    });
  }
}
```

### 2. Voyante découvre → Auto-assigne:
```javascript
// Voyante regarde Loris et découvre c'est un Renard
voyanteLooksAt(voyanteName, lorisName, 'Renard');

// Si Renard n'est pas encore assigné
if (!getRenardPlayer()) {
  assignPlayerToRole(lorisId, 'Renard');
  gm.addGameLog(`✨ Loris a été découvert comme Renard et pré-assigné`);
}
```

### 3. Père des Loups infecte:
```javascript
// Nuit 5, Père tueur infecte sa victime
const victimId = getWolvesChoice();
gm.infectPlayer(pereId, victimId);
// → Changement immédiat de rôle et de camp
```

### 4. Fin de nuit - Vérifier conditions:
```javascript
// À la fin de chaque nuit
statusHandler.onNightEnd();

// Vérifier si Joueur de Flûte a gagné
const result = statusHandler.checkFluteWinCondition();
if (result) {
  displayWinScreen(result);
  endGame();
}
```

---

## 📋 À Faire Ensuite

### 1. Intégration dans les phases:
- [ ] 04-FirstNight-Actions.js → Appeler gm.createLovers()
- [ ] 03-FirstNight.js → Afficher les amoureux en rose
- [ ] Mayor election → Appeler gm.electMayor()
- [ ] Mort d'un joueur → Appeler statusHandler.onPlayerDeath()

### 2. Interface utilisateur:
- [ ] Afficher les statuts sur les points des joueurs (💕 pour Amoureux, 🎶 pour Charmé, etc.)
- [ ] Pop-up "Les amoureux meurent ensemble!" quand mort liée
- [ ] Écran "Joueur de Flûte gagne!" si condition remplie
- [ ] Chat: afficher les transferts de Maire

### 3. Autres rôles:
- [ ] Arnacoeur → Séduire un Amoureux
- [ ] Comédien → Changer de rôle les 3 premières nuits
- [ ] Louveteau → Bonus kill à la mort
- [ ] Humain Maudit → Devenir Infecté à la mort

### 4. Tests:
- [ ] Tester mort liée (Amoureux)
- [ ] Tester transformation (Enfant → Loup)
- [ ] Tester infection (Père → Infecté)
- [ ] Tester condition victoire (Joueur Flûte)

---

## 🐛 Debugging

### Console logs:
```javascript
// Voir l'état des statuts
window.statusHandler.printStatusSummary();

// Voir les statuts d'un joueur
const statuses = gm.getPlayerStatuses('player_id');
console.log(statuses);

// Tous les Amoureux actuels
const lovers = window.statusHandler.getAllPlayersWithStatus('Amoureux');
console.log('Amoureux:', lovers);
```

### Points d'arrêt:
```javascript
// Dans statuses-handlers.js, ajouter des logs:
console.log(`[StatusesHandler] ${player.name} meurt (${deathCause})`);
// Aide à tracker qui meurt et pourquoi
```

---

## 📚 Ressources

- **roles-data.js** → 52+ rôles avec métadonnées
- **statuses-data.js** → 6 statuts avec icônes et couleurs
- **game-master.js** → Méthodes de gestion des statuts
- **statuses-handlers.js** → Logique événementielle complète
- **AUDIT_ROLES_ET_STATUS.md** → Audit complet des rôles manquants

---

## ✅ Checklist Implémentation

- [x] Créer statuses-data.js avec 6 statuts
- [x] Enrichir game-master.js avec méthodes de statuts
- [x] Créer statuses-handlers.js avec logique événementielle
- [x] Ajouter dans index.html
- [ ] Intégrer dans 03-FirstNight.js
- [ ] Intégrer dans 04-FirstNight-Actions.js
- [ ] Intégrer dans Mayor election
- [ ] Intégrer dans mort d'un joueur
- [ ] Tests end-to-end
- [ ] Interface visuelle pour afficher les statuts

---

**Créé:** 2026-05-21  
**Statut:** ✅ Implémentation de base terminée, tests à faire
