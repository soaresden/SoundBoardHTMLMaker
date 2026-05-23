# ✓ Config-Based Architecture Complete - 57 Roles

## Summary
All 57 Loup-Garou game roles have been successfully configured with a config-based architecture using individual JSON files in `gamemaster/roles/`.

## Naming Convention
Each config file follows the pattern: **NN-ActionType-RoleName.json**

Example: `01-Nuit01-Cupidon.json`
- NN = Numerical order (01-57)
- ActionType = Action timing category
- RoleName = Role identifier

## Role Categories by Action Type

### 1. Nuit01 (1 role) - First Night Only
- Position 1: Cupidon (Creates couple on first night only)

### 2. DebutPartie (3 roles) - Game Start
- Position 2: Enfant_Sauvage (Choose idol)
- Position 3: Chien_Loup (Choose alignment)
- Position 4: Abominable_Sectaire (Divide group)

### 3. ToutesNuits (33 roles) - Every Night
- Positions 5-35
- Includes: Voyante, Sorcière, Ancien, Ange, Salvateur, Voleur, Petite_Fille, Renard, Corbeau, Servante_Dévouée, Joueur_Flûte, Ankou, Marionnettiste, Chaman, Garde du Corps, Prêtre, Gitane, Noctambule, Mystique, Mamie Grincheuse, Fille de Joie, Comédien, Nécromancien, Arnacoeur, Lapin Blanc, Tueur en Série, Pyromane, Père des Loups, Grand Méchant Loup, Simple Loup-Garou, Loup Voyant

### 4. ToutesNuits1sur2 (1 role) - Every Other Night
- Position 36: Loup_Garou_Blanc (Can choose which nights to hunt)

### 5. TousLesJours (1 role) - Every Day
- Position 37: Tireur (Can shoot daily)

### 6. UneFoisPartie (1 role) - Once Per Game
- Position 38: Juge_Begue (Can trigger second vote once)

### 7. PostMortem (6 roles) - Triggered by Death
- Positions 39-44
- Includes: Chasseur, Chevalier_Épée_Rouille, Fils_Lune, Louveteau, Lépreux, Savant Fou

### 8. SpecialDeath (4 roles) - Special Death Mechanics
- Positions 45-48
- Includes: Ange_Déchu, Gros_Dur, Humain_Maudit, Porteur_Amulette

### 9. NoAction (8 roles) - No Special Action
- Positions 49-57
- Includes: Villageois, Bouc_Émissaire, Idiot_Village, Cultiste, Capitaine, Président, Deux_Soeurs, Trois_Frères, Montreur_Ours

## Visual Styling Applied

Special role colors in 03-FirstNight.js:
- **Amoureux (Lovers)**: Pink border (#ff69b4), transparent background
- **Enfant Sauvage**: Bleu Marine (#001a4d)
- **Idole**: Bleu (#0066ff)
- **Salvateur**: Gold border (#ffd700)
- **Corbeau**: Gray border (#808080)

## ROLE_ORDER Updated
`03-FirstNight.js` has been updated with all 57 roles in the correct order:
```javascript
const ROLE_ORDER = [
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup', 'Abominable_Sectaire',
  // ... 33 ToutesNuits roles ...
  'Loup_Garou_Blanc', 'Tireur', 'Juge_Begue',
  // ... 6 PostMortem roles ...
  // ... 4 SpecialDeath roles ...
  // ... 8 NoAction roles including Montreur_Ours
];
```

## Each Config File Contains

```json
{
  "id": "RoleId",
  "order": 1,
  "name": "Role Name",
  "emoji": "🎯",
  "camp": "Village|Loups|Seul",
  "hasNightAction": true/false,
  "hasDayAction": true/false,
  "actions": {
    "ActionType": {
      "enabled": true,
      "type": "actionType",
      "phase": "everyNight|firstNight|etc",
      "instruction": "Action description",
      "targets": { ... },
      "stateKey": "state_identifier",
      "logging": { ... }
    }
  },
  "specialBehaviors": [ ... ],
  "tips": "Gameplay tip",
  "winCondition": "Village|Loups|Seul"
}
```

## Files Modified

1. **gamemaster/roles/** - 57 new JSON config files created
2. **03-FirstNight.js** - Updated with:
   - Complete ROLE_ORDER with all 57 roles
   - Visual styling for special roles
   - Support for new role colors and states

## Status: ✓ COMPLETE
All 57 roles have exhaustive, config-based definitions ready for game integration.
