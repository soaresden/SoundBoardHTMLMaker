# 🐺 Loup Garou by Denis — Soundboard + Maître du Jeu

## Démarrage

```
node gamemaster/server.js        (ou double-clic sur start.bat)
→ http://localhost:8000/
```

Au boot, le serveur **régénère `gamemaster/roles/index.json`** et **valide tous les rôles**
(avertissements ⚠️ en console). Le mode hors-ligne ne marche qu'en `http://localhost`, pas en `file://`.

Après toute modif de code : bumper le `?v=N` du fichier dans `index.html` + Ctrl+Shift+R.
Après toute modif de rôle JSON : redémarrer le serveur + bumper `CACHE_VERSION` dans
`gamemaster/utils/load-roles-json.js`.

## Arborescence

```
Loup Garou by Denis/
├── index.html                  ← soundboard + point d'entrée (charge tous les scripts avec ?v=N)
├── sw.js                       ← service worker offline (précache auto, persistant)
├── start.bat                   ← lance le serveur (installe Node si absent)
├── config.json                 ← config du soundboard (générée par SoundBoardHTMLMaker)
├── index_aio.html              ← export autonome "tout-en-un" (généré, ne pas éditer)
├── music/  sfx/  covers/       ← médias du soundboard
│
├── docs/                       ← 📚 toute la documentation
│   ├── FORMAT-ROLES.md         ←   LE guide du format des rôles (à lire avant d'en créer un)
│   ├── ARCHITECTURE.md, ROLE_SCHEMA.md, HANDOFF_PROJET.md
│
├── _archive/                   ← fichiers morts (SUPPRIMABLE sans risque côté Windows)
│
└── gamemaster/                 ← 🐺 le Maître du Jeu
    ├── server.js               ← serveur http local (régénère l'index + valide les rôles)
    ├── generate-roles-index.js ← génère roles/index.json
    ├── validate-roles.js       ← valide le format de tous les rôles
    ├── players.txt             ← roster de prénoms (1 par ligne)
    │
    ├── roles/                  ← 1 JSON par rôle (le NUMÉRO = ordre d'appel de nuit)
    │   ├── 00-template.json    ←   modèle documenté à copier
    │   ├── NN[-lettre]-Nom.json + NN-Nom.png (image de carte, optionnelle)
    │   └── index.json          ←   généré, ne pas éditer
    │
    ├── core/                   ← moteur (chargés en premier)
    │   ├── orchestrator.js     ←   gm.* : état de partie, phases
    │   ├── game-master.js, game-master-init.js
    │   └── statuses-data.js, statuses-handlers.js
    │
    ├── utils/                  ← chargement des rôles, ordre, logs, noms
    │   ├── load-roles-json.js  ←   ⚠️ CACHE_VERSION à bumper après modif de rôle
    │   ├── get-ordered-roles.js, player-names.js, roles-data.js
    │   └── logging.js, logging-system.js, navigation-system.js
    │
    ├── phases/                 ← écrans de jeu (l'ordre 01→06 suit la partie)
    │   ├── 01-ChooseCard, 02-TableAndRename, 02b-DeckNames, 02-TirageMode
    │   ├── 03-FirstNightMDJ-00..06  ← ★ LE mode MDJ (découpé en 7 modules
    │   │       qui font tous Object.assign(FirstNightMDJ.prototype, {...}) ;
    │   │       00-core doit être chargé en premier)
    │   └── 03-FirstNight, 04-*, 05-*, 06-*  ← anciens modes (assisté, reveal…)
    │
    └── ui/                     ← overlay Maître du Jeu (fenêtre, sélection des cartes…)
        ├── game-master-ui.js, game-master-styles.css
        └── 01-WindowsButtons … 08-DayPhase
```

## Les 7 modules du mode MDJ (`phases/03-FirstNightMDJ-*`)

| Module | Contenu |
|---|---|
| 00-core | classe `FirstNightMDJ`, état (deadPlayerIds, deathCauses, roleStates…) |
| 01-init-render | helpers (protégés, isolés, `roleActsThisNight`, morts au début de nuit), journal, victoire, panneau ☠️ morts |
| 02-map | table live (layout rectangle arrondi + anti-chevauchement), badges tueur, fiche joueur, audio |
| 03-summary-lynch-mayor | résumé de nuit, bûcher, élection du maire, effets à la mort (Bus/Braises/Chasseur…) |
| 04-night-flow | déroulé de la nuit, `completeRoleAction`, cascade amoureux, mort tunnel |
| 05-role-actions | interfaces de sélection par rôle (Sorcière, Apprenti, loups, Voyante plein écran…) |
| 06-ui-timer-styles | CSS + timer |

## ⚠️ Pièges connus de l'environnement (voir docs/HANDOFF_PROJET.md)

- Les gros fichiers écrits sur ce montage peuvent être **tronqués** : toujours
  `node --check` après édition, écrire via /tmp + copie vérifiée.
- Impossible de **supprimer** des fichiers depuis l'environnement (d'où `_archive/`).
