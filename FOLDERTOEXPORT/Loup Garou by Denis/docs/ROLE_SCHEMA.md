# Schéma de rôle & standardisation (Loup Garou by Denis)

Ce document décrit le format JSON d'un rôle, fait l'audit du *hardcoding*
résiduel dans le moteur JS, et propose le plan de migration vers un pilotage
100 % par les balises JSON. Le fichier `gamemaster/roles/00-template.json`
est le modèle commenté de référence (non chargé par le jeu).

## 1. Balises d'un rôle (résumé)

| Balise | Pilote moteur | Rôle |
|---|---|---|
| `id`, `name`, `emoji` | oui | identité |
| `camp` | oui | `Village` / `Loups` / `Seul` → barre de victoire & factions |
| `isWolf` | **nouveau** | détection loup fiable (remplace « le nom contient Loup ») |
| `actionType` | oui | `NightActive` / `DayActive` / `NoActions` |
| `nightActive` | oui | liste explicite des nuits de réveil (`[1]`, `[2,4,6…]`, toutes) |
| `borderLifetime` | oui | durée de la bordure d'effet (`current_night`, `next_night`, `until_death`, `game`) |
| `actions.<bloc>.type` | oui | **comportement** (doit remplacer `switch(roleId)`) |
| `actions.<bloc>.phase` | oui | quand le bloc agit |
| `actions.<bloc>.targets.count` | oui | nb de cibles |
| `actions.<bloc>.stateKey` | oui | clé de stockage du résultat |
| `mdj_night_actions[]` | oui | boutons MDJ (id/icon/label) |
| `ui.selectionRenderer` | **nouveau** | composant de sélection (remplace `switch(roleId)`) |
| `visual.roleColor` / `affectedColor` | oui | couleurs |
| `description`, `pouvoir`, `tips` | info | textes d'aide |

## 2. Vocabulaire des `phase`

`everyNight`, `everyNightFrom2`, `everyNightFirst3`, `everyOtherNight`,
`firstNight`, `gameStart`, `everyDay`, `dayVote`, `onDeath`, `gameProgress`,
`anyTime`, `none`.

## 3. Catalogue des `type` d'action (comportements)

Présents dans les rôles actuels : discover, protect, potions, hunt,
huntSelectively, kill, extraKill, bonusKill, lover, charm, mark, spy,
countEnemies, silence, visit, changeRole, roleSwap, roleSwapDead, resurrect,
seduce, convert, arson, shoot, secondVote, doubleVote, killOnDeath,
postDeathEffect, pauseWolfKill, turnOnWolfKill, chooseSide, dividePlayers,
bless, senseConnection, controlAction, talkToDead, twinCommunication,
tankProtection, amuletProtection, surviveDayKill, dieOnTie, winOnFirstDeath,
vultureCondition, curse, randomEvent, noAction.

## 4. Audit du hardcoding (état actuel)

Le moteur référence encore des `roleId` en dur (occurrences dans les modules
`03-FirstNightMDJ-*.js`) :

- `switch(this.selectedRoleId)` dans **renderActionButtons** (night-flow) et
  **updateMapForRole** (map) → 10+ branches `case 'Cupidon' / 'Sorciere' / …`.
  *Devrait être piloté par* `ui.selectionRenderer` (rendu) et
  `actions.*.type` (effet).
- Détection loup : `role.includes('Loup') || role.includes('Wolf')` à ~15
  endroits. *Devrait lire* `isWolf`.
- Cas spéciaux morts : `Chasseur` (PostMortem `killOnDeath`),
  `Chevalier_Epee_Rouille` (curse `next_night`), `Montreur_Ours` (détection
  voisins). *Devraient lire* `actions.*.type` + `borderLifetime`.
- `Renard` perd son pouvoir si 0 loup détecté ; `Sorciere` 2 potions max ;
  `Loup_Garou_Blanc` nuits paires. Déjà partiellement dans le JSON
  (`nightActive`, `phase: everyOtherNight`) — à finir de brancher.

## 5. Plan de migration (incrémental, sans régression)

1. **`isWolf`** (fait, pilote) : `isWolfRoleId()` lit `roleData.isWolf` puis
   retombe sur la détection par nom. → ajouter `isWolf:true` aux JSON loups.
2. **`ui.selectionRenderer`** (fait, pilote) : `renderActionButtons` lit la
   balise puis retombe sur le `switch` existant. → renseigner les JSON.
3. **`actions.*.type`** pour les effets (morts spéciales, protections) :
   remplacer progressivement les `case` de `updateMapForRole` /
   `completeRoleAction` par une lecture de `type`.
4. **`nightActive` / `phase`** : déjà la source de vérité pour le réveil ;
   supprimer les exceptions hardcodées au fil de l'eau.

À chaque étape : le moteur lit d'abord le JSON, et **retombe sur l'ancien
comportement** si la balise est absente — aucune régression possible tant que
les JSON ne sont pas tous renseignés.
