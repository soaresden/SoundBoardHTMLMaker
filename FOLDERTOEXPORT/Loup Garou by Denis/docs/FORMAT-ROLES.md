# Format des rôles — « Loup Garou by Denis »

Chaque rôle = **1 fichier JSON** dans `gamemaster/roles/`, nommé `NN[lettre]-Nom_Du_Role.json`.

## Règles d'or

1. **Le numéro du fichier = l'ordre d'appel de nuit.** `43` passe AVANT `43a`, `43a` avant `43b`.
   Pour insérer un rôle juste après X : numéro de X + une lettre (`01` → `01a`).
2. **`id` = la partie du nom de fichier après le tiret.** `30a-Custom_Creuseur_Tunnel.json` → `"id": "Custom_Creuseur_Tunnel"`.
3. Après **tout** changement de JSON ou renommage de fichier :
   - régénérer l'index : `node gamemaster/generate-roles-index.js` (ou redémarrer le serveur) ;
   - **bumper `CACHE_VERSION`** dans `gamemaster/utils/load-roles-json.js` (sinon l'ancien rôle reste en cache navigateur).
4. Le serveur valide automatiquement tous les rôles au démarrage (`gamemaster/validate-roles.js`) et affiche des ⚠️ en console. Lancement manuel : `node gamemaster/validate-roles.js`.

## Champs obligatoires

| Champ | Valeurs | Rôle |
|---|---|---|
| `id` | = nom de fichier | identifiant unique |
| `name` | texte | nom affiché |
| `emoji` | 1 emoji | icône partout dans l'UI |
| `camp` | `Village` \| `Loups` \| `Seul` | camp pour la barre de victoire |
| `isWolf` | `true` / `false` | **obligatoire** — compte comme loup (meute, parité, Renard, Ours…) |

> `isWolf` et `camp` sont indépendants : le Loup Blanc est `camp: "Seul"` + `isWolf: true`.

## Quand le rôle agit-il la nuit ? (`phase`)

Poser une `phase` sur l'action activée (le moteur lit la **première** action `enabled` qui a une phase) :

- `everyNight` — chaque nuit
- `everyOtherNight` — nuits **paires** (2, 4, 6…) — ex. Loup Blanc
- `everyOddNight` — nuits **impaires** (1, 3, 5…) — ex. Creuseur de Tunnel
- `everyNightFrom2`, `everyNightFirst3`, `firstNight`

**Ne pas utiliser `nightActive: [1,2,…,10]`** : la liste casse à la nuit 11. Seul `nightActive: [1]`
est toléré (rôle « première nuit uniquement », ex. Cupidon). Un rôle `isWolf: true` **sans** phase
chasse chaque nuit (filet de sécurité meute).

## Types d'action reconnus par le moteur (`actions.*.type`)

- **Tuent** : `kill`, `extraKill`, `bonusKill`, `hunt`, `huntSelectively`, `potions`
- **Isole** : `isolate` (Creuseur : cible + lui-même intouchables ; isole un loup → il meurt au matin)
- **Immunisent** : `protect`, `tankProtection`, `amuletProtection`, `bless`
- **Effets au bûcher / à la mort** : `surviveDayKill` (Idiot), `surviveFireOnce` (Braises),
  `redirectDeathOnce` (Bus), `killNeighbors` (Savant Fou), `killOneNeighbor` (Kamikaze),
  `voteWeightSacrifice` (Braises), `pauseWolfKill` (Fils de la Lune), `killVoters` (Lépreux),
  `bonusKill` (Louveteau), `dieOnTie` (Bouc), `winOnFirstDeath` (Ange Déchu)

## Interface de sélection (`ui.selectionRenderer`)

**Omettre le champ** = sélection générique de cibles (utilise `targets.count`).
Renderers dédiés : `cupidonLover` (+ `loverCount`), `wolfKill`, `sorciere`, `apprentiSorcier`,
`salvateur`, `voyante`, `renard`, `corbeau`, `recognition` (Sœurs/Frères), `voleur`, `chienLoup`, `enfantSauvage`.

## Visuel

```json
"visual": {
  "roleColor":     { "fondColor": "#5174db", "textColor": "#fff", "emojiColor": "#fff" },
  "affectedColor": { "borderColor": "#c77dff" }
}
```

`affectedColor.borderColor` = couleur du contour posé sur les joueurs ciblés par ce rôle.
Image de carte : `gamemaster/roles/NN-Nom.png` (même nom que le JSON) — optionnelle
(fallback = emoji, notamment pour la carte plein écran de la Voyante).

## Causes de mort connues du moteur

`wolf`, `poison` (Sorcière), `poisonApprenti`, `lynch`, `chasseur`, `chevalier`, `love`,
`tunnel`, `braises`, `bus`, `savant`, `mdj`.
**Ajouter une cause = éditer 4 endroits** : libellé du débrief (module 03), badge tueur
`killerInfoMap` (module 02), panneau « Morts de la nuit » (module 01), fiche joueur (module 02).

## Dette connue (volontairement non touchée)

- `41-Fils_Lune` et `42-Louveteau` gardent `nightActive: [2,4,6,8,10]` : leur mécanique est
  « à la mort » (`onDeath`) et la liste semble décorative — à trancher côté gameplay avant de nettoyer.
- Le template `00-template.json` est un JSON valide documenté via des clés `_doc*` (ignorées par le moteur).
