# 🎮 FLUX COMPLET D'UNE PARTIE - Loup-Garou

## Architecture du Jeu - Toutes les Phases

```
PHASE ASSIGNATION (Première Nuit)
├─ Rôles 1-38 assignés
├─ Bouton "Jour 1" activé
└─ → JOUR 1 - ÉLECTION MAIRE

JOUR 1 - ÉLECTION MAIRE
├─ Tous les joueurs désignent un Maire
├─ Bouton "Maire Élu - Nuit 1" activé
└─ → NUIT 1 - LOUPS CHOISISSENT

NUIT 1 - LOUPS CHOISISSENT
├─ Les Loups désignent leur 1ère victim
├─ Les autres joueurs ont les yeux fermés
├─ Bouton "Jour 2 - Révélation" activé
└─ → JOUR 2 - RÉVÉLATION + VOTE

JOUR 2 - RÉVÉLATION + VOTE
├─ Afficher: "Player X était... [RÔLE]! 🎴"
├─ Les villageois votent pour éliminer quelqu'un
│  ├─ Si Maire meurt → "Nouveau Maire" (sub-phase)
│  └─ Bouton "Nuit 2" activé
└─ → NUIT 2 - LOUPS CHOISISSENT

[Cycle JOUR/NUIT répète jusqu'à victoire]
```

---

## 🎯 Structure d'État

### `gameState` - Nouvel État Complète
```javascript
{
  mayor: "player_id",              // 👑 ID du maire actuel
  lastVictim: "player_id",         // ☠️ Dernière victime des loups
  lastVictimRole: "Simple_Loup",   // 🎴 Rôle de la victime
  phase: "day1-election",          // Phase actuelle du jeu
  subPhase: "mayor-election",      // Sous-phase (optionnel)
  hasVoted: {},                    // {playerId: true/false}
}
```

### Valeurs de `phase`
| Phase | Sens | Action Suivante |
|-------|------|-----------------|
| `assignment` | Assignation des rôles | "Jour 1" |
| `day1-election` | Élection du maire | "Nuit 1" |
| `night1-wolves` | Loups choisissent | "Jour 2" |
| `day2+` | Jours suivants | Vote élimination |
| `night2+` | Nuits suivantes | Loups choisissent |

---

## 🔄 Transitions et Événements

### Jour 1 - Élection Maire
```
EVENT: Cliquez sur un joueur
→ gameState.mayor = playerId
→ Afficher badge "👑 MAIRE"

EVENT: Clique "Maire Élu - Nuit 1"
→ gameState.phase = "night1-wolves"
→ render() → renderWolvesChoose()
```

### Nuit 1 - Loups Choisissent
```
ACTION MANUELLE: Game Master dit "Loups, qui?"

EVENT: Clique "Jour 2 - Révélation"
→ gameState.lastVictim = playerId (à définir)
→ gameState.lastVictimRole = rôle de la victime
→ gameState.phase = "day2+"
→ render() → renderDayNightSequence()
```

### Jour 2+ - Révélation et Vote
```
ÉTAPE 1: Afficher révélation
→ "☀️ Jour 2"
→ "Player X était... VILLAGEOIS! 🎴"
→ "Rendormez-vous, une nuit nouvelle commence..."

ÉTAPE 2: Vote d'élimination
→ Tous votent pour éliminer quelqu'un
→ Compter les votes
→ "Player Y est éliminé!"

ÉTAPE 3: Vérifier Fin de Partie
→ Loups ≥ Villageois? → Loups gagnent
→ Loups = 0? → Villageois gagnent
→ Sinon, continue Nuit 2
```

---

## ⚠️ CAS SPÉCIAUX - Maire Meurt

### Condition
```javascript
if (lastVictim === mayor || votedOutPlayer === mayor) {
  // Maire est mort!
  subPhase = "new-mayor-election"
}
```

### Workflow
```
1️⃣ Afficher: "Le Maire X est décédé! 🪦"
2️⃣ Sous-phase: "Nouveau Maire"
3️⃣ Afficher tous les joueurs vivants
4️⃣ Demander qui est le nouveau maire
5️⃣ Clique pour désigner
6️⃣ Clique "Nouveau Maire Confirmé"
→ Continuer le jour normalement
```

### Code Condition
```javascript
// Dans renderDayNightSequence() ou après vote
const deadPlayer = this.gm.state.players.find(p => p.id === lastVictim && !p.isDead);
if (deadPlayer && deadPlayer.id === this.gm.state.gameState.mayor) {
  this.gm.state.gameState.subPhase = "new-mayor-election";
  return this.renderNewMayorElection();
}
```

---

## 📋 Checklist Conditions à Vérifier

- [ ] Clic joueur → Désigner maire (Jour 1)
- [ ] Bouton "Maire Élu" → Passer à Nuit 1
- [ ] Nuit 1 → Afficher interface Loups
- [ ] Bouton "Jour 2" → Réveler victim
- [ ] Afficher rôle victim (VILLAGEOIS, LOUP, etc.)
- [ ] Vote d'élimination (Jour 2+)
- [ ] Vérifier victoire Loups
- [ ] Vérifier victoire Villageois
- [ ] Maire meurt → Nouveau maire
- [ ] Cycle continue (Nuit 2, Jour 3, etc.)

---

## 🎪 Rendering Order

```
render() → Quel mode?
├─ mode = "setup" → renderSetup()
├─ mode = "players" → renderPlayers()
├─ mode = "tableSetup" → renderTableSetup()
├─ mode = "placePlayers" → renderPlacePlayers()
├─ mode = "assignRoles" →
│  ├─ firstNightState.completed = false? → renderAssignRoles()
│  └─ firstNightState.completed = true? → renderGamePhase()
│     └─ gameState.phase = "day1-election"? → renderMayorElection()
│     └─ gameState.phase = "night1-wolves"? → renderWolvesChoose()
│     └─ gameState.phase = "day2+"? → renderDayNightSequence()
└─ mode = "playing" → renderGame()
```

---

## 💾 État Sauvegardé

Chaque transition SAUVEGARDE l'état:
```javascript
this.gm.saveState(); // localStorage
```

Cela persist:
- gameState.mayor
- gameState.phase
- gameState.lastVictim
- gameState.lastVictimRole
- Tous les joueurs (isDead, roleId, etc.)

---

## 🔒 Validation et Erreurs

| Condition | Erreur | Solution |
|-----------|--------|----------|
| "Jour 1" sans rôles assignés | Impossible | Vérifier que 12/12 assignés |
| "Maire Élu" sans maire | Désactiver bouton | `mayor === null` → opacity:0.5 |
| Voter avec joueur mort | Pas affiché | Filter `!isDead` |
| Maire mort non détecté | Crash | Vérifier immédiatement après reveal |

---

## 📝 Code Clé à Implémenter

### 1. Listener Jour 1 - Élire Maire
```javascript
document.querySelectorAll('.gm-mayor-candidate').forEach(el => {
  el.addEventListener('click', () => {
    const playerId = el.dataset.playerId;
    this.gm.state.gameState.mayor = playerId;
    this.gm.saveState();
    this.render();
  });
});
```

### 2. Listener Jour 1 - Confirmer Maire
```javascript
document.getElementById('gmBtnMayorConfirm')?.addEventListener('click', () => {
  if (!this.gm.state.gameState.mayor) return; // Pas de maire? Annuler
  this.gm.state.gameState.phase = "night1-wolves";
  this.gm.saveState();
  this.render();
});
```

### 3. Listener Nuit 1 - Révéler
```javascript
document.getElementById('gmBtnRevealVictim')?.addEventListener('click', () => {
  // Demander aux Loups: "Qui?"
  // (À implémenter avec UI)
  this.gm.state.gameState.phase = "day2+";
  this.gm.saveState();
  this.render();
});
```

---

## 🎬 Exemple Partie Complète

```
0. Assignation: Cupidon → Sorcière → ... → Villageois ✓

1. JOUR 1 - ÉLECTION
   GM: "Tous les yeux ouverts. Qui sera le Maire?"
   Joueurs: [Vote] → Player 3 est Maire 👑
   → Clique "Maire Élu - Nuit 1"

2. NUIT 1 - LOUPS
   GM: "Villageois, fermez les yeux... Loups, réveillez-vous."
   Loups: [Choisissent] → Player 5
   → Clique "Jour 2 - Révélation"

3. JOUR 2 - RÉVÉLATION
   GM: "Player 5 était... VOYANTE! 🔮"
   "Rendormez-vous... Nuit 2 commence..."
   [Cycle continue...]
```

---

**Version**: 1.0  
**Statut**: Architecture Complète  
**À Implémenter**: Listeners + Vérifications
