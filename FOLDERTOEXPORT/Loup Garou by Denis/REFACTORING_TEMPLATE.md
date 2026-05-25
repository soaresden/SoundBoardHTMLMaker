# Template de Refactorisation des Rôles JSON

## Structure complète à appliquer à TOUS les rôles

```json
{
  "id": "RoleId",
  "order": 1,
  "name": "Rôle Name",
  "emoji": "🎭",
  "camp": "Village",           // Village | Loups-Garous | Solo
  "origin": "base",

  // === TEXTES POUR L'UI ===
  "pouvoir": "Description du pouvoir (ce qu'il peut faire)",
  "instruction": "Ce qu'il faut faire pendant la partie",
  "tips": "Conseils de jeu tactiques",
  "notes": "Infos supplémentaires",

  // === PHASES DE JEU AVEC ACTIONS ===
  "gamePhases": [
    {
      "phase": "FirstNightActions",    // FirstNightActions | Night | Day | PostMortem
      "order": 5,                      // Ordre d'exécution dans la phase
      "enabled": true,
      "action": {
        "type": "selectOne",           // selectOne | selectPair | selectThree | collective
        "targets": {
          "count": 1,                  // Nombre total de cibles
          "minCount": 1,
          "maxCount": 1,
          "canTargetDead": false,
          "canTargetSelf": false,
          "mustAgree": false           // Pour les actions collectives (loups)
        },
        "message": "💬 Message affiché au joueur",
        "effect": {
          "type": "kill",              // kill | protect | createLink | infect | etc.
          "description": "Description de l'effet"
        }
      }
    }
  ],

  // === CONDITIONS DE VICTOIRE ===
  "winConditions": [
    {
      "type": "camp",
      "value": "Village",              // Camp auquel appartient ce rôle
      "condition": "default",          // default | modelAlive | modelDead | allCharmed | lastWolf | etc.
      "description": "Description lisible"
    }
  ],

  // === COMPORTEMENTS SPÉCIAUX ===
  "specialBehaviors": [
    {
      "type": "linkedDeath",           // linkedDeath | infection | roleChange | discoverOtherWolves | etc.
      "trigger": "onPlayerDeath",      // onGameStart | onPlayerDeath | onAction | onNightStart | etc.
      "action": "killLinkedPlayer",
      "description": "Quand quelque chose arrive, faire ceci"
    }
  ],

  // === APPARENCE ===
  "visual": {
    "fondColor": "#6b4c9a",
    "emoji": "🎭",
    "emojiColor": "#ffffff",
    "targetsBorder": {
      "color": "#9966ff",
      "width": "2px",
      "style": "solid"
    }
  },

  "cardImage": "gamemaster/roles/XX-RoleName.png"
}
```

---

## Types d'actions (action.type)

- **selectOne**: Sélectionner 1 joueur (ex: Voyante)
- **selectPair**: Sélectionner 2 joueurs (ex: Cupidon)
- **selectThree**: Sélectionner 3 joueurs (ex: Renard)
- **collective**: Action collective où tous doivent être d'accord (ex: Loups-Garous)

---

## Types d'effets (action.effect.type)

- **kill**: Tuer quelqu'un (ex: Loup-Garou, Sorcière)
- **protect**: Protéger quelqu'un (ex: Salvateur, Ange)
- **createLink**: Créer un lien entre 2 joueurs (ex: Cupidon, Enfant Sauvage)
- **infect**: Infecter quelqu'un (ex: Loup Noir)
- **reveal**: Révéler quelque chose (ex: Voyante)
- **mark**: Marquer quelqu'un (ex: Corbeau, Renard)
- **convert**: Convertir quelqu'un (ex: Abominable Sectaire)
- **charm**: Charmer quelqu'un (ex: Joueur de Flûte)

---

## Types de comportements (specialBehaviors.type)

- **linkedDeath**: Si quelqu'un lié meurt, celui-ci meurt aussi (ex: Cupidon)
- **infection**: Quand infecté, changer de rôle (ex: Loup Noir, Enfant Sauvage)
- **roleChange**: Changer de rôle sous certaines conditions (ex: Enfant Sauvage → Loup)
- **discoverOtherWolves**: Connaître les autres loups (ex: Loup-Garou)
- **postMortem**: Action après mort (ex: Chasseur)
- **conditional**: Condition spéciale pour l'action

---

## Types de phases (gamePhases.phase)

- **FirstNightActions**: Actions spéciales la première nuit (Cupidon, Enfant Sauvage, Voleur)
- **Night**: Actions nocturnes récurrentes (Voyante, Sorcière, Loups, etc)
- **Day**: Actions diurnes (Vote, Juge, etc)
- **PostMortem**: Actions après une mort (Chasseur)

---

## Exemples complets

### 1. Rôle simple (pas d'action)

```json
{
  "id": "Villageois",
  "order": 49,
  "name": "Villageois",
  "emoji": "👨‍🌾",
  "camp": "Village",
  "origin": "base",
  "pouvoir": "Aucun pouvoir spécial",
  "instruction": "Participez au vote de jour pour éliminer un suspect",
  "tips": "Écoutez les discussions, formez des alliances",
  "notes": "Vous gagnez quand tous les loups-garous sont morts",
  "gamePhases": [],
  "winConditions": [{"type": "camp", "value": "Village", "description": "Gagne avec le camp Village"}],
  "specialBehaviors": [],
  "visual": {...},
  "cardImage": "..."
}
```

### 2. Rôle avec une action FirstNight

```json
{
  "id": "Cupidon",
  "order": 1,
  "name": "Cupidon",
  "emoji": "💘",
  "camp": "Village",
  "origin": "base",
  "pouvoir": "Désigne deux amoureux la première nuit",
  "instruction": "Sélectionnez 2 joueurs pour les rendre amoureux",
  "tips": "Ne mettez JAMAIS 2 joueurs excellents ensemble",
  "notes": "Les amoureux peuvent être d'un camp différent",
  "gamePhases": [
    {
      "phase": "FirstNightActions",
      "order": 1,
      "enabled": true,
      "action": {
        "type": "selectPair",
        "targets": {"count": 2, "minCount": 2, "maxCount": 2, "canTargetDead": false, "canTargetSelf": false},
        "message": "💘 Sélectionnez 2 joueurs à rendre amoureux",
        "effect": {"type": "createLink", "linkType": "lover", "description": "Si l'un meurt, l'autre meurt aussi"}
      }
    }
  ],
  "winConditions": [{"type": "camp", "value": "Village", "description": "Gagne avec le camp Village"}],
  "specialBehaviors": [
    {"type": "linkedDeath", "trigger": "onPlayerDeath", "action": "killLinkedPlayer", "description": "Si amoureux meurt, l'autre meurt"}
  ],
  "visual": {...},
  "cardImage": "..."
}
```

### 3. Rôle avec action Night récurrente

```json
{
  "id": "Voyante",
  "order": 5,
  "name": "Voyante",
  "emoji": "👁️",
  "camp": "Village",
  "origin": "base",
  "pouvoir": "Chaque nuit, regardez la carte d'un joueur",
  "instruction": "Chaque nuit, sélectionnez un joueur pour connaître son rôle",
  "tips": "Utilisez vos informations pour guider le village",
  "notes": "Si infecté par le Loup Noir, vous verrez l'ancien rôle",
  "gamePhases": [
    {
      "phase": "Night",
      "order": 5,
      "enabled": true,
      "action": {
        "type": "selectOne",
        "targets": {"count": 1, "minCount": 1, "maxCount": 1, "canTargetDead": false, "canTargetSelf": false},
        "message": "👁️ Sélectionnez un joueur pour voir son rôle",
        "effect": {"type": "reveal", "description": "Vous verrez le rôle du joueur"}
      }
    }
  ],
  "winConditions": [{"type": "camp", "value": "Village", "description": "Gagne avec le camp Village"}],
  "specialBehaviors": [],
  "visual": {...},
  "cardImage": "..."
}
```

### 4. Rôle Solo

```json
{
  "id": "Joueur_Flute",
  "order": 47,
  "name": "Joueur de Flûte",
  "emoji": "🎵",
  "camp": "Solo",
  "origin": "base",
  "pouvoir": "Chaque nuit, charmez un joueur. Gagnez quand tous sont charmés",
  "instruction": "Chaque nuit, sélectionnez un joueur à charmer",
  "tips": "Gardez trace de qui est charmé. Évitez les soupçons",
  "notes": "Vous gagnez seul ou avec votre amoureux si lié par Cupidon",
  "gamePhases": [
    {
      "phase": "FirstNightActions",
      "order": 7,
      "enabled": true,
      "action": {
        "type": "selectOne",
        "targets": {"count": 1, "minCount": 1, "maxCount": 1, "canTargetDead": false, "canTargetSelf": false},
        "message": "🎵 Charmez un joueur",
        "effect": {"type": "charm", "description": "Le joueur est charmé"}
      }
    },
    {
      "phase": "Night",
      "order": 7,
      "enabled": true,
      "action": {
        "type": "selectOne",
        "targets": {"count": 1, "minCount": 1, "maxCount": 1, "canTargetDead": false, "canTargetSelf": false},
        "message": "🎵 Charmez un joueur",
        "effect": {"type": "charm", "description": "Le joueur est charmé"}
      }
    }
  ],
  "winConditions": [
    {"type": "allCharmed", "description": "Gagne quand tous les joueurs sont charmés"}
  ],
  "specialBehaviors": [],
  "visual": {...},
  "cardImage": "..."
}
```

---

## Procédure de refactorisation

1. **Ouvrir** le fichier JSON du rôle
2. **Garder** les champs: `id`, `order`, `name`, `emoji`, `camp`, `origin`
3. **Ajouter** les champs textes: `pouvoir`, `instruction`, `tips`, `notes`
4. **Remplacer** `actions` → `gamePhases` avec nouvelle structure
5. **Mettre à jour** `winConditions` et `specialBehaviors`
6. **Garder** `visual` et `cardImage`
7. **SUPPRIMER** les anciens champs: `description`, `logging`, `actions` (ancien format)

---

## Rôles à refactoriser (57 au total)

### ✅ Déjà refactorisés
- 01-Cupidon.json
- 02-Enfant_Sauvage.json
- 34-Simple_Loup_Garou.json
- 49-Villageois_Villageois.json

### ❌ À faire (53)
- 03-Chien_Loup.json
- 04-Petite_Fille.json
- 05-Sorciere.json
- 06-Voyante.json
- 07-Corbeau.json
- ... (et 46 autres)

---

**Statut**: En cours (7% complet)
**Responsable**: Claude
**Date**: 2026-05-25
