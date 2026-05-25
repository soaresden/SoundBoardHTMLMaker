# Architecture Loup-Garou - Refactorisation complète

## Objectif
**Tout ce qui est logique métier doit être dans les JSON. Le code doit être un orchestrateur pur.**

---

## 1. Structure JSON des Rôles

Chaque rôle (`gamemaster/roles/XX-RoleName.json`) contient:

### Métadonnées
```json
{
  "id": "Cupidon",
  "order": 1,
  "name": "Cupidon",
  "emoji": "💘",
  "camp": "Village",           // Village | Loups-Garous | Solo
  "origin": "base"
}
```

### Textes (pour la UI)
```json
{
  "pouvoir": "Description du pouvoir",
  "instruction": "Ce qu'il faut faire",
  "tips": "Conseils de jeu",
  "notes": "Infos supplémentaires"
}
```

### Phases de jeu avec actions
```json
{
  "gamePhases": [
    {
      "phase": "FirstNightActions",    // FirstNightActions | Night | Day | PostMortem
      "order": 1,                      // Ordre d'exécution
      "enabled": true,
      "action": {
        "type": "selectPair",          // selectPair | selectOne | selectThree | etc.
        "targets": {
          "count": 2,
          "minCount": 2,
          "maxCount": 2,
          "canTargetDead": false,
          "canTargetSelf": false
        },
        "message": "Message au joueur",
        "effect": {
          "type": "createLink",        // createLink | infect | kill | protect | etc.
          "linkType": "lover",
          "description": "Si l'un meurt, l'autre meurt aussi"
        }
      }
    }
  ]
}
```

### Conditions de victoire
```json
{
  "winConditions": [
    {
      "type": "camp",              // camp | linkedDeath | allCharmed | lastWolf | etc.
      "value": "Village",
      "description": "Gagne avec le camp Village"
    }
  ]
}
```

### Comportements spéciaux
```json
{
  "specialBehaviors": [
    {
      "type": "linkedDeath",       // linkedDeath | infection | modifiedRole | etc.
      "trigger": "onPlayerDeath",  // onPlayerDeath | onAction | onNightStart | etc.
      "action": "killLinkedPlayer",
      "description": "Quand un amoureux meurt, l'autre meurt aussi"
    }
  ]
}
```

### Apparence
```json
{
  "visual": {
    "fondColor": "#6b4c9a",
    "emoji": "💘",
    "emojiColor": "#ffffff",
    "targetsBorder": {
      "color": "#9966ff",
      "width": "2px",
      "style": "solid"
    }
  },
  "cardImage": "gamemaster/roles/01-Cupidon.png"
}
```

---

## 2. Architecture du Code

### Core: `orchestrator.js`
- Classe minimaliste: `GameMasterOrchestrator`
- Charge les données JSON
- Gère l'état du jeu
- **ZÉRO logique métier**

```javascript
class GameMasterOrchestrator {
  // Gestion du jeu
  initGame(playerNames, mode)
  assignRoleToPlayer(playerId, roleId)
  startFirstNightActions()
  
  // Actions
  recordAction(playerId, actionType, targets)
  applyActionEffect(playerId, effect, targets)
  
  // Mort et effets
  killPlayer(playerId, reason)
  applyDeathEffects(playerId)
  
  // Conditions de victoire
  checkWinConditions()
  checkCondition(condition, playerId)
}
```

### UI: `assignment-mode.js`
- Interface pour assigner les rôles
- Affiche les joueurs et les rôles
- Gère la sélection et la navigation

### UI: `first-night-actions.js` (À implémenter)
- Interface pour les actions de la première nuit
- Affiche les rôles avec actions
- Recueille les sélections

---

## 3. Modes de Jeu

### Mode Assignation ✅ (EN COURS)
1. **Setup**: Écran assignation des rôles (en cours)
2. **FirstNightActions**: Afficher les rôles et recueillir les actions
3. **Day1**: Vote du jour 1
4. **Night2+**: Phases normales nuit/jour
5. **Reveal**: Affichage des résultats

**Implémentation:**
- ✅ `orchestrator.js` - Core complet
- ✅ `assignment-mode.js` - UI assignation
- ❌ `first-night-actions.js` - À créer
- ❌ `day-ui.js` - À créer
- ❌ `night-ui.js` - À créer
- ❌ `reveal-ui.js` - À créer

### Mode Tablette Passante ❌ (TODO)
1. **Setup**: Configuration (nombre de joueurs, rôles à distribuer)
2. **Distribution**: Tablette passe, joueur voit son rôle
3. **Rotation**: Affichage du joueur suivant
4. **FirstNightActions**: Idem mode assignation
5. **Gameplay**: Idem mode assignation

**Spécification TODO:**
```
- Mode.TabletPass.Start()
  → Affiche écran "Passe la tablette à [PlayerName]"
  
- Joueur.ClickToSeeCard()
  → Affiche son rôle (carte de rôle + pouvoir + tips)
  
- Joueur.ClickNext()
  → Masque la carte, affiche "Donne à [NextPlayerName]"
  
- Quand tous les joueurs ont vu:
  → Passer à FirstNightActions
```

---

## 4. Flux de Données

```
Joueur 1 clique "Assigner"
  ↓
UI: AssignmentMode.selectRole('Cupidon')
  ↓
Orchestrator: assignRoleToPlayer(player1, 'Cupidon')
  ↓
State: player1.roleId = 'Cupidon'
  ↓
Orchestrator.startFirstNightActions()
  ↓
Orchestrator: getRolesWithActionsForPhase('FirstNightActions')
  ↓
Retourne array de rôles avec actions cette nuit
  ↓
UI: FirstNightActions.render(actingRoles)
  ↓
Joueur prend son action, appelle Orchestrator.recordAction()
  ↓
Orchestrator: applyActionEffect() → modifie state
  ↓
État de jeu mis à jour
```

---

## 5. Zéro Fallback - Règles

❌ **Ne JAMAIS faire ceci:**
```javascript
// Mauvais: fallback hardcodé
const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', ...];

// Mauvais: logique métier hardcodée
if (roleId === 'Cupidon') {
  // faire quelque chose
}

// Mauvais: dictionnaire de textes
const ROLE_TIPS = { 'Cupidon': '...', ... };
```

✅ **Faire ceci à la place:**
```javascript
// Bon: lire depuis JSON
const role = rolesData[roleId];
if (role.camp === 'Loups-Garous') { ... }

// Bon: lire depuis JSON
const tips = role.tips;

// Bon: utiliser les phases du JSON
const phases = role.gamePhases.filter(p => p.phase === 'FirstNightActions');
```

---

## 6. Prochaines Étapes

### Phase 1: FirstNightActions UI ✅
- [ ] Créer `first-night-actions.js`
- [ ] Afficher les rôles avec actions
- [ ] Formulaires d'action dynamiques selon le type
- [ ] Tester avec Cupidon, Enfant Sauvage, Voleur

### Phase 2: Phases normales (Day/Night)
- [ ] Créer `day-ui.js`
- [ ] Créer `night-ui.js`
- [ ] Vote du jour
- [ ] Actions nocturnes
- [ ] Révélation des morts

### Phase 3: Conditions de victoire
- [ ] Implémenter tous les types de conditions
- [ ] Vérifier après chaque mort
- [ ] Annoncer le gagnant

### Phase 4: Mode Tablette Passante
- [ ] Implémenter distribution aléatoire
- [ ] Créer interface de rotation
- [ ] Tester sur mobile

### Phase 5: Polish & Test
- [ ] Refactoriser tous les JSON (57 rôles)
- [ ] Tests end-to-end
- [ ] UI/UX final
- [ ] Documentation complète

---

## 7. Fichiers de Référence

- **PDF**: `Le jeu des Loups Garou.pdf` - Règles complètes
- **Rôles JSON**: `gamemaster/roles/XX-RoleName.json` (57 fichiers)
- **Core**: `gamemaster/orchestrator.js`
- **UI**: `gamemaster/ui/*.js`
- **Demo**: `gamemaster-assignment.html`

---

## 8. Notes Importantes

- ⚠️ **ZÉRO localStorage** - Utiliser l'état du GameMaster
- 📱 **Mobile-first** - Interface tactile (mode tablette passante)
- 📊 **Données centralisées** - Tout dans JSON
- 🎨 **UI dynamique** - Générée à partir des données
- 🔄 **Événements** - Système de callbacks pour les transitions

---

**Validé par**: Denis (2026-05-25)
**Version**: 1.0 - Architecture refactorisée
