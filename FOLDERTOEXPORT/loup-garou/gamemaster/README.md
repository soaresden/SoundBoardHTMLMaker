# 🎮 GameMaster - Structure Organisée

## 📁 Organisation des fichiers

```
gamemaster/
├── phases/           # Phases du jeu
│   ├── 01-ChooseCard.js              # Choix des cartes rôles
│   ├── 02-TableAndRename.js          # Configuration table & joueurs
│   ├── 03-FirstNight.js              # Première nuit - ASSIGNATION RÔLES
│   ├── 04-FirstNight-Actions.js      # Première nuit - ACTIONS
│   ├── 04-MayorElection.js           # Élection du maire (jour 1)
│   └── 05-Day.js                     # Phases jour/nuit (jeu complet)
│
├── ui/               # Interface utilisateur
│   ├── game-master-ui.js             # UI principale GameMaster
│   └── game-master-v2-ui.js          # UI v2 (améliorations)
│
├── utils/            # Utilitaires et données
│   ├── roles-data.js                 # Définitions des 57 rôles
│   ├── GameLog.js                    # Gestion des logs de partie
│   ├── logging-system.js             # Système de logging
│   └── navigation-system.js          # Gestion de la navigation
│
├── roles/            # Configurations de rôles (JSON)
│   ├── 01-Nuit01-Cupidon.json
│   ├── 02-DebutPartie-Enfant_Sauvage.json
│   ├── ... (57 rôles total)
│   └── 57-NoAction-Montreur_Ours.json
│
├── game-master.js        # ⭐ Core - Logique principale GameMaster
├── game-master-init.js   # ⭐ Initialisation du GameMaster
└── README.md             # Ce fichier

```

## 📊 Phases du Jeu

### Phase 1️⃣: `01-ChooseCard.js`
- Sélection des cartes rôles par joueur
- Interface de choix
- Validation des sélections

### Phase 2️⃣: `02-TableAndRename.js`
- Configuration de la table (circulaire/carrée)
- Renommage des joueurs
- Setup de position initiale

### Phase 3️⃣: `03-FirstNight.js` ⭐ CENTRAL
- **Étape 1/2**: Assignation des rôles aux joueurs
- **Étape 2/2**: Actions spéciales des rôles (Cupidon, Enfant Sauvage, Voyante, etc.)
- Gestion complète de la première nuit

### Phase 4️⃣: `04-FirstNight-Actions.js`
- Actions détaillées de chaque rôle
- Handlers spécifiques
- Validation et logging

### Phase 5️⃣: `04-MayorElection.js`
- Election du maire (jour 1)
- Vote du village
- Attribution du badge Mayor

### Phase 6️⃣: `05-Day.js`
- Boucle jour/nuit complète
- Gestion des phases jour et nuit
- Actions de chaque rôle en fonction du jour/nuit

## 🎯 Architecture

```
game-master.js (Core)
    ├── Manage player state
    ├── Track role assignments
    ├── Log game events
    └── Coordinate phases
         ↓
    [phases/*.js] (Phases du jeu)
         ↓
    [ui/*.js] (Interface)
         ↓
    [utils/*.js] (Données et outils)
```

## 📝 Fichiers Clés

### Core
- **game-master.js**: Classe principale GameMaster
- **game-master-init.js**: Initialisation et setup

### Données
- **roles-data.js**: Définition de tous les 57 rôles avec métadonnées
- **roles/[XX-ActionType-RoleName].json**: Configurations exhaustives (57 fichiers)

### Logging
- **GameLog.js**: Gestionnaire des logs
- **logging-system.js**: Système de logging détaillé

## 🔄 Flux de Jeu Complet

```
1. ChooseCard       → Sélection rôles
2. TableAndRename   → Setup joueurs
3. FirstNight       → Assignation + Actions
4. MayorElection    → Election maire
5. Day              → Boucle jour/nuit complète
```

## 📖 Conventions de Nommage

### Phases
- `NN-DescriptionPhase.js` où NN est l'ordre

### Rôles (JSON configs)
- `NN-ActionType-RoleName.json`
- ActionType: Nuit01, DebutPartie, ToutesNuits, ToutesNuits1sur2, TousLesJours, UneFoisPartie, PostMortem, SpecialDeath, NoAction
- NN: Ordre dans ROLE_ORDER

## 🎨 61 Rôles Configurés

- **1 Nuit01**: Cupidon
- **3 DebutPartie**: Enfant_Sauvage, Chien_Loup, Sectaire
- **33 ToutesNuits**: Voyante, Sorcière, Ancien, Ange, Salvateur, ...
- **1 ToutesNuits1sur2**: Loup_Garou_Blanc
- **1 TousLesJours**: Tireur
- **1 UneFoisPartie**: Juge_Begue
- **6 PostMortem**: Chasseur, Chevalier, Fils_Lune, ...
- **4 SpecialDeath**: Ange_Dechu, Gros_Dur, ...
- **8 NoAction**: Villageois, Bouc_Émissaire, ...

## 🚀 Quick Start

```javascript
// Importer le core
const GameMaster = require('./game-master.js');
const gm = new GameMaster();

// Charger les données
const ROLES_DATA = require('./utils/roles-data.js');
const rolesConfig = require('./roles/*.json');

// Initialiser une partie
gm.init(players, selectedRoles);
```

---

**Version**: 2.0 (Config-based architecture)  
**Last Updated**: Mai 2026  
**57 Rôles**: ✓ Configurés et documentés
