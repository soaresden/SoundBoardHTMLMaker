# 📋 Plan d'Implémentation - Flux Complet

## ✅ Tâches à faire

### 1️⃣ PHASE 3: FirstNight (À FINALISER)
**Fichier**: `gamemaster/phases/03-FirstNight.js`

- [x] Affichage table + joueurs
- [x] Étape 1/2: Assignation + Appel du nom
- [x] Étape 2/2: Action du rôle (Voyante, Cupidon, Renard, etc.)
- [ ] **IMPORTANT**: Gérer les rôles SANS ACTION
  - Chasseur → 1/1 seulement (pas de 2/2)
  - Chevalier Tétanos → 1/1 seulement (pas de 2/2)
  - Montreur Ours → 1/1 seulement
  - Villageois → 1/1 seulement
  - Tous les rôles "NoAction" → 1/1
- [ ] Bouton "Commencer" quand tout le monde est assigné

### 2️⃣ PHASE 4: MayorElection (À CRÉER/FINALISER)
**Fichier**: `gamemaster/phases/04-MayorElection.js`

- [ ] Affichage: "Élire un Maire?"
- [ ] Combobox pour sélectionner un joueur
- [ ] Ou option "Pas de Maire"
- [ ] Bouton "Confirmer"
- [ ] Badge Mayor assigné au joueur (si choisi)
- [ ] Transition vers Jour 01

### 3️⃣ PHASE 5: Day (À CRÉER)
**Fichier**: `gamemaster/phases/05-Day.js` (ou `06-Day.js`)

#### 5a. Réveil & Annonces des Morts
- [ ] Afficher les morts de la veille avec format:
  ```
  Alice (Joueur1) est morte, tuée par les Loups
  Bob (Joueur2) est mort, tué au vote du village
  Charlie (Joueur3) est mort, tué par la Sorcière
  ```
- [ ] Bouton "Continuer"

#### 5b. Vote du Village
- [ ] Afficher: "Tous les villageois votent pour éliminer quelqu'un"
- [ ] Combobox avec tous les joueurs vivants
- [ ] Bouton "Procéder au vote"
- [ ] Affichage du résultat du vote (qui a le plus de voix)
- [ ] Gestion des égalités (Bouc Émissaire?)

#### 5c. Reveal du Mort
- [ ] Afficher: "Cette personne était... ⭐ [RÔLE]!"
- [ ] Afficher la cause de mort (vote village, Loups, Sorcière, etc.)
- [ ] Bouton "Continuer vers Nuit 02"

### 4️⃣ PHASE 6: Nuit Suivante (Nuit 02+)
**Fichier**: `gamemaster/phases/05-Day.js`

- [ ] Boucle jour/nuit qui se répète
- [ ] Gestion des morts progressifs
- [ ] Vérification des conditions de fin:
  - Tous les Loups sont morts → Village gagne
  - Loups ≥ Villageois → Loups gagnent
  - Conditions de victoire spéciales (Cupidon, Joueur Flûte, etc.)

### 5️⃣ Système Global
- [ ] Tracker l'état du jeu (gamePhase: "day1", "night2", etc.)
- [ ] Gérer les transitions entre phases
- [ ] Affichage du jour/nuit courant
- [ ] Gestion des joueurs morts (les exclure des actions)

---

## 🔧 Modifications à 03-FirstNight.js

### Actuellement
- ROLES_WITH_NIGHT_ACTION gère qui a une action de nuit
- Mais on doit aussi gérer ROLES_WITHOUT_ACTION

### À faire
```javascript
// Rôles qui NE FONT QUE l'étape 1/2 (pas de 2/2)
const ROLES_WITHOUT_ACTION = new Set([
  'Chasseur', 'Chevalier_Epee_Rouille', 'Montreur_Ours',
  'Villageois_Villageois', 'Bouc_Emissaire', 'Capitaine',
  'Cultiste', 'Idiot_Village', 'President',
  'Deux_Soeurs', 'Trois_Freres', // Ou ont-ils une action?
  'Lepreux', 'Savant_Fou', 'Ange_Dechu', 'Gros_Dur',
  'Humain_Maudit', 'Porteur_Amulette'
  // ... autres rôles NoAction
]);
```

### Logic Update
```javascript
if (currentRole in ROLES_WITHOUT_ACTION) {
  // Skip step 2, go directly to next role
  effectiveStep = 1;
  // After assigning, go directly to next role
} else if (ROLES_WITH_NIGHT_ACTION.has(currentRole)) {
  // Normal: 1/2 then 2/2
  effectiveStep = step; // 1 or 2
} else {
  // No action at all, but still 1/2 (rare case?)
  effectiveStep = 1;
}
```

---

## 📊 État du Jeu - Tracking

```javascript
gm.state = {
  gamePhase: 'chooseCards' | 'tableSetup' | 'night1' | 'day1' | 'night2' | ...
  currentDay: 1,
  currentNight: 1,
  deadPlayers: [],  // {id, name, role, causeOfDeath, day/night}
  gameEnded: false,
  winner: 'Village' | 'Loups' | 'Seul' | null
}
```

---

## 🎯 Ordre d'Implémentation

1. ✅ **FirstNight.js** → Finaliser gestion 1/1 vs 1/2
2. 📍 **MayorElection.js** → Créer/finaliser
3. 📍 **Day.js** → Créer (Annonces → Vote → Reveal)
4. 📍 **Boucle jour/nuit** → Intégrer dans Day.js ou nouveau fichier
5. 📍 **Conditions de fin** → Vérifier Victoria à chaque phase
6. 📍 **Polish** → UI, messages, timing

---

## 🔄 Transitions entre Phases

```
ChooseCards
    ↓ (Suivant)
TableSetup
    ↓ (Commencer)
FirstNight (Nuit 1)
    ↓ (Fini assignation+actions)
MayorElection
    ↓ (Maire choisi ou skip)
Day (Jour 1)
    ├─ Annonces morts
    ├─ Vote
    ├─ Reveal mort
    └─ → FirstNight (Nuit 2)
         ↓
    Day (Jour 2)
         ↓
    ...

[Jusqu'à condition de victoire]
    ↓
GameEnd (Écran fin)
```

---

## ✨ Détails Importants

### Rôles sans action = Skip 2/2
- Chasseur, Chevalier_Épée_Rouillée, Montreur_Ours
- Tous les "NoAction"
- Vérifier les rôles spéciaux

### Appel du nom = Étape 1/2
- Même sans action, il faut appeler le nom
- Sert à vérifier que le joueur est présent
- Important pour les rôles cachés

### Reveal des morts = Moment important
- Afficher le rôle réel
- Montrer comment il est mort
- Cela donne des infos stratégiques

---

**Status**: 🚀 Prêt à commencer
**Priorité**: FirstNight.js → MayorElection.js → Day.js
