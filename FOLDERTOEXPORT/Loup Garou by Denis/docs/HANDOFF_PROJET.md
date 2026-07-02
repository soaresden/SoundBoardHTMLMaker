# Passation projet — « Loup Garou by Denis » (MDJ + Soundboard)

> À coller au début d'une nouvelle conversation pour donner tout le contexte.
> Écrit pour un assistant qui reprend le projet à froid.

## 1. Vue d'ensemble

**« Loup Garou by Denis »** est une surcouche **Maître du Jeu (MDJ)** pour le jeu *Les Loups-Garous de Thiercelieux*, couplée à un **soundboard**. C'est une app **web statique** (HTML/CSS/JS vanilla, pas de framework) servie en local par un petit serveur Node.

- **Lancement** : `node gamemaster/server.js` → sert sur `http://localhost:8000/`.
- Le serveur **régénère `gamemaster/roles/index.json` au démarrage** (voir §4).
- **IMPORTANT** : le mode hors-ligne / service worker ne marche qu'en `http://localhost`, pas en `file://`.

Le MDJ pilote toute une partie : élection du maire, tour de nuit rôle par rôle (carte + map ronde « live »), résolution des morts, résumé de nuit, bûcher (lynch), passage nuit suivante, journal horodaté, barre de victoire par camp.

## 2. Emplacement des fichiers

- **Racine projet (Windows)** : `D:\DOCS\Documents\GitHub\SoundBoardHTMLMaker\FOLDERTOEXPORT\Loup Garou by Denis\`
- Il existe un 2e soundboard voisin : `...\FOLDERTOEXPORT\Metal Gear Board Game by Soaresden\` (partage la logique du `sw.js`).
- Le dépôt Git est à la racine `SoundBoardHTMLMaker\` (donc les chemins Git sont préfixés `FOLDERTOEXPORT/Loup Garou by Denis/...`).

## 3. Arborescence clé

```
Loup Garou by Denis/
├── index.html                      # Point d'entrée : charge TOUS les scripts avec ?v=N (cache-busting)
├── sw.js                           # Service worker offline (network-first code, cache-first médias)
├── gamemaster/
│   ├── server.js                   # Serveur Node (régénère index.json, décode %20 dans les URLs)
│   ├── generate-roles-index.js     # Génère roles/index.json depuis les fichiers *.json
│   ├── players.txt                 # Roster de prénoms (1 par ligne), source unifiée
│   ├── orchestrator.js             # gm.roles = getter sur window.ROLES_DATA.roles
│   ├── game-master.js / game-master-ui.js / game-master-init.js
│   ├── roles/
│   │   ├── index.json              # Généré : { roles: [{id, file}, ...] }
│   │   ├── 00-template.json        # Modèle commenté
│   │   ├── NN[-lettre]-Nom.json    # 1 fichier par rôle (le NUMÉRO définit l'ordre d'appel de nuit)
│   │   └── NN-Nom.png              # Image du rôle (les rôles custom n'en ont PAS → 404 cosmétiques)
│   ├── utils/
│   │   ├── load-roles-json.js      # Charge index.json + tous les rôles → window.ROLES_DATA. CACHE_VERSION !
│   │   ├── get-ordered-roles.js    # getOrderedRoleIds() : tri par _fileNumber (règle §4)
│   │   └── player-names.js         # window.LG_PLAYER_NAMES depuis players.txt (+ reloadPlayerNamesFromTxt)
│   └── phases/
│       ├── 02-TableAndRename.js    # Setup table, profils joueurs (lgGetProfiles trié alpha)
│       ├── 02b-DeckNames.js        # Écran « Ordre des joueurs » (façon Undercover)
│       ├── 03-FirstNightMDJ-00-core.js       # Constructeur FirstNightMDJ (VERSION 34)
│       ├── 03-FirstNightMDJ-01-init-render.js# roleActsThisNight, getProtectedPlayers, getIsolatedPlayers, journal
│       ├── 03-FirstNightMDJ-02-map.js        # renderLiveMap, updateMapForRole, restoreCompletedRoleEffects, killerInfoMap, SFX
│       ├── 03-FirstNightMDJ-03-summary-lynch-mayor.js # getNightSummaryHtml, executeLynch, getLynchDeathEffect, élection maire
│       ├── 03-FirstNightMDJ-04-night-flow.js # selectRole, completeRoleAction, renderRoleListbox, renderActionButtons, startNight2, checkCupidonCascadingDeath
│       └── 03-FirstNightMDJ-05-role-actions.js # tous les render*Selection (Cupidon/Clubbeur, Sorcière, Apprenti, GML, générique, etc.)
```

`FirstNightMDJ` est **découpé en modules** qui font tous `Object.assign(FirstNightMDJ.prototype, { ... })`. Le core (00) doit être chargé en premier.

## 4. Système de rôles (JSON-driven)

- Chaque rôle = 1 fichier `NN[lettre]-Nom.json`. **L'`id` du rôle est dérivé du NOM DE FICHIER** (regex `^\d+[a-z]?-(.+)$`), et le champ JSON `"id"` doit correspondre.
- `index.json` est régénéré au boot du serveur (et par `node gamemaster/generate-roles-index.js`). Il déduplique par id.
- `load-roles-json.js` fusionne tout dans `window.ROLES_DATA.roles` (clé = `id` JSON) et pose `_fileNumber` (ex. `"30a"`).
- **Ordre d'appel de nuit** = tri par `_fileNumber` via `compareFileNumbers` (get-ordered-roles.js) :
  - on compare d'abord le nombre, puis la lettre ;
  - **RÈGLE CLÉ : « pas de lettre » passe AVANT « une lettre »** → `43` vient AVANT `43a` (et `43a` avant `43b`). C'est aussi l'ordre de chaîne standard (`"43" < "43a"`).
  - Donc pour insérer un rôle **juste après** X, on lui met le numéro de X + une lettre (`01` → `01a`). Pour le mettre **avant** X, il faut un numéro strictement inférieur.
- **Cache localStorage des rôles** : gated par `CACHE_VERSION` dans `load-roles-json.js`. **Si on change un JSON de rôle OU un numéro de fichier, il FAUT bumper `CACHE_VERSION`**, sinon `_fileNumber`/données restent périmés (bug classique : un rôle apparaît dans le mauvais ordre car son ancien `_fileNumber` est en cache).

### `roleActsThisNight(roleId)` (01-init-render.js) — décide si un rôle agit la nuit courante
Priorité : (1) `nightActive` (tableau de nuits) s'il est non vide ; (2) sinon la **`phase`** de la première action activée :
`everyNight`, `everyOtherNight` (nuits paires), `everyOddNight` (nuits impaires 1,3,5), `everyNightFrom2`, `everyNightFirst3`, `firstNight` ; (3) sinon filet loup (`isWolf` → chaque nuit).
- **Convention propre** : privilégier `phase: "everyNight"` etc. plutôt qu'un tableau `nightActive: [1,2,3,...]`. Pour un rôle 1re nuit uniquement, `nightActive: [1]` reste ok (comme Cupidon).
- ⚠️ Il existe une **2e évaluation de phase dans le constructeur** (01-init-render.js, `currentNightNumber=1`) qui décide si le rôle entre dans `roleStates`. Elle doit connaître les mêmes phases (on y a ajouté everyOddNight/everyNightFrom2/everyNightFirst3). Si un rôle n'est jamais appelé, vérifier ces DEUX endroits.

### Rendu d'action d'un rôle
`renderActionButtons` (04) dispatch via `roleData.ui.selectionRenderer` → `_rendererMap` (ex. `cupidonLover`, `sorciere`, `apprentiSorcier`, `wolfKill`, `recognition`, …). Sans renderer dédié → `renderGenericTargetSelection` (sélection de N cibles générique ; utilisé par le Creuseur). Valider appelle `completeRoleAction()` qui stocke `roleStates[roleId].result = { action, targets:[ids] }` et `_seq`.

## 5. Rôles CUSTOM déjà créés (tag `"Custom"`, catégorie « 🛠️ CUSTOM » sous les Favoris)

| Fichier | id | Effet |
|---|---|---|
| `01a-Custom_Clubbeur.json` | `Custom_Clubbeur` | **Cupidon-bis** : rend **3** amoureux (`loverCount:3`). Si un meurt, les 2 autres meurent d'amour. |
| `30a-Custom_Creuseur_Tunnel.json` | `Custom_Creuseur_Tunnel` | Appelé nuits **impaires** (`everyOddNight`). Isole 1 joueur : lui + la cible sont **protégés** cette nuit (maisons vides). **S'il isole un Loup → il meurt au matin** (cause `tunnel`). Type d'action = `isolate`. Bordure couleur du Creuseur + ⛏️ sur l'isolé. |
| `43a-Custom_Apprenti_Sorcier.json` | `Custom_Apprenti_Sorcier` | **Sorcière-bis** : **une seule potion de MORT** (pas de vie), `everyNight`. Appelé AVANT la Sorcière (qui a été renommée `43b-Sorciere.json`). Inventaire `apprentiInv`. |
| `60-Custom_Chauffeur_Braises.json` | `Custom_Chauffeur_Braises` | Voix **double** au vote. Rappel au bûcher : bouton « a-t-il pointé un innocent ? → le sacrifier » (cause `braises`). |
| `61-Custom_Chauffeur_Bus.json` | `Custom_Chauffeur_Bus` | Comme le Chasseur : à sa mort (toute cause), combobox pour balancer **n'importe quel vivant** à sa place, il **survit 1 fois** (`busHasRedirected`) puis redevient villageois. |
| `62-Custom_Kamikaze.json` | `Custom_Kamikaze` | À sa mort, tue **UN** voisin (gauche OU droite, au choix MDJ) — type `killOneNeighbor` (rappel MDJ). |

Mécaniques d'amoureux **généralisées** Cupidon + Clubbeur : `checkCupidonCascadingDeath` (04) parcourt `['Cupidon','Custom_Clubbeur']` et tue TOUS les autres amoureux vivants du groupe. `renderCupidonLoverSelection`/`toggleCupidonLover`/`completeCupidonAction` (05) lisent `loverCount` et `selectedRoleId`.

Isolement : `getIsolatedPlayers()` (01) = cible(s) + le Creuseur lui-même, uniquement les nuits où il agit. Utilisé pour : protection (getProtectedPlayers, type `isolate`), grisage potions (Sorcière/Apprenti refusent d'empoisonner un isolé — « choix accepté, stock conservé »), badge ⛏️.

## 6. Résolution des morts / causes

- `deadPlayerIds` (Set) + `deathCauses[id]` (ex : `wolf`, `poison`, `lynch`, `chasseur`, `chevalier`, `love`, `tunnel`, `braises`, `bus`, `mdj`).
- Labels texte dans `getNightSummaryHtml` (03) et badge tueur sur la map dans `killerInfoMap` (02). **Ajouter une nouvelle cause = éditer CES DEUX endroits.**
- `getLynchDeathEffect(roleId)` (03) : effets au bûcher pilotés par le `type` d'action (`surviveDayKill`, `surviveFireOnce`, `redirectDeathOnce`, `killNeighbors`, `killOneNeighbor`, `voteWeightSacrifice`, …).
- Résumé de nuit (`getNightSummaryHtml`) : Actions + Morts, chronologique (tri par `_seq`), + « sections spéciales » (réassignation maire, Servante, Chasseur, Bus, Braises, Chevalier).

## 7. ⚠️ CONTRAINTES TECHNIQUES CRITIQUES DE L'ENVIRONNEMENT (à respecter absolument)

1. **On NE PEUT PAS supprimer de fichiers** sur le disque monté (`rm` → « Operation not permitted »). Pour « remplacer » un rôle, on garde souvent l'ancien fichier avec le MÊME `id` JSON pour éviter les doublons (l'index déduplique par id). Sinon, demander à l'utilisateur de supprimer/renommer côté Windows.
2. **Les outils Edit/Write TRONQUENT les gros fichiers** (les modules `03-FirstNightMDJ-*` font 1000-1500 lignes). Ils écrivent OK puis coupent la fin du fichier → `SyntaxError: Unexpected end of input`. **Pattern fiable** :
   - écrire le contenu dans `/tmp/x.js` (heredoc python), `node --check /tmp/x.js`,
   - copier vers le disque monté dans une boucle qui vérifie `wc -c` égal + 0 octet NUL (`tr -cd '\000' | wc -c`),
   - re-`node --check` le fichier monté.
   - En cas de troncature : récupérer la fin via `git show HEAD:"FOLDERTOEXPORT/Loup Garou by Denis/<path>"` puis re-splicer.
   - Les petites éditions ponctuelles passent, mais **toujours re-`node --check` après**.
3. **Chemins bash (sandbox Linux) ≠ chemins Windows.** Le disque monté est sous `/sessions/<id>/mnt/SoundBoardHTMLMaker/...`. Utiliser des chemins absolus. `cd "…/Loup Garou by Denis"` (espaces → guillemets).
4. **Après CHAQUE édition de module JS** : bumper son `?v=N` dans `index.html` (cache-busting navigateur). Actuellement le groupe FirstNightMDJ est autour de **`?v=87`**, `02-TableAndRename` à `?v=69`, `CACHE_VERSION = 9` dans load-roles-json.js.
5. **Après changement de JSON de rôle ou de numéro** : régénérer l'index (`node gamemaster/generate-roles-index.js` ou redémarrer le serveur) **ET** bumper `CACHE_VERSION`.
6. Le serveur `server.js` décode `%20` (`decodeURIComponent`) — nécessaire pour les fichiers son avec espaces. Redémarrage requis après édition de server.js.
7. Émojis dans le JS : **écrire le vrai caractère** (🔥 💀 🧪), PAS `\U0001F...` (JS ne connaît pas `\U` 8-hex → s'affiche « U0001F… » à l'écran). `\uXXXX` (4-hex) est ok.

## 8. Workflow de validation attendu

Pour toute modif : (1) éditer via /tmp + cp vérifié, (2) `node --check` sur les fichiers touchés, (3) bumper `?v` (et `CACHE_VERSION` si rôle), (4) régénérer l'index si besoin, (5) dire à l'utilisateur : **redémarrer le serveur Node + Ctrl+Shift+R**. Utiliser la todo-list (TaskCreate/TaskUpdate) pour les tâches multi-étapes.

## 9. État d'avancement / points ouverts

**Fait récemment** : rôles custom (les 6 ci-dessus), généralisation Cupidon→Clubbeur (3 amoureux), Apprenti Sorcier, automatisation du Creuseur (protection + mort si isole un loup + visuel bordure/⛏️), Chauffeur de Bus (combobox toute cause), bouton sacrifice Braises, potions bloquées sur isolés, tri alpha des profils, précache auto des sons + popup « Version locale », fix « mort qui breathe dans la liste bleue », nettoyage `nightActive` → `everyNight`.

**À vérifier / en attente (dernier retour utilisateur)** :
- Confirmer sur une **partie neuve** que le Creuseur meurt bien s'il isole un loup, et que les morts s'affichent (un run précédent semblait parti d'un état corrompu par l'ancien cache).
- Apprenti : vérifier que l'icône de mort s'affiche immédiatement sur la live-map après empoisonnement.
- **Proposé, non fait** : si **tous** les loups vivants sont isolés une nuit, annuler l'attaque des loups (loup unique isolé ne peut pas « voter »).
- Bugs anciens encore ouverts : Sorcière « mort fantôme » ; Loup Blanc tue un loup absent du log ; Grand Méchant Loup passe à travers les potions.
- Rappel : il reste un **verrou Git** `.git/index.lock` à supprimer côté Windows pour pouvoir committer (je ne peux pas le supprimer depuis l'environnement).

## 10. Ton / langue
L'utilisateur (Denis) échange en **français**, style direct et concis. Il gère lui-même certains fichiers (renommages, players.txt) en parallèle — toujours relire l'état réel des fichiers avant d'éditer.
