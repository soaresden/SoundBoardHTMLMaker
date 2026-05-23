# 📚 GUIDE COMPLET: COMPRENDRE CHAQUE IMPLÉMENTATION

## 🎯 LES 5 PATTERNS D'UI

Tous les 24 rôles utilisent l'un de ces 5 patterns. Comprendre ces patterns = comprendre le système complet.

---

## PATTERN 1️⃣: SÉLECTION SIMPLE (1 JOUEUR)

**Rôles**: Ancien, Ange, Servante, Salvateur, Marionnettiste, Voleur, Pyromane, Ankou, Sectaire, Chevalier, Noctambule, Necromancien

### Mécanique
1. **Affichage**: Combobox avec liste de tous les joueurs
2. **Interaction**: Sélectionner 1 joueur dans la dropdown
3. **Confirmation**: Automatique (affichage du résultat)
4. **Log**: Enregistre l'action quand on passe au rôle suivant

### Code Pattern

```javascript
// 1. ÉTAT STOCKÉ
gm.state.AncienTarget = null  // ou n'importe quel ID joueur

// 2. UI RENDU
<select id="gmSelectOneTarget">
  <option value="">-- Sélectionner --</option>
  ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
</select>
<div id="gmSelectOneResult">Aucune sélection</div>

// 3. EVENT HANDLER
function attachSelectOneHandlers(gameUI, currentRole, players) {
  const stateKey = `${currentRole}Target`;
  const targetSelect = document.getElementById('gmSelectOneTarget');
  
  targetSelect?.addEventListener('change', (e) => {
    gm.state[stateKey] = e.target.value;  // Sauvegarder l'ID joueur
    updateResult();  // Mettre à jour l'affichage
  });
}

// 4. LOGGING
if (currentRole === 'Ancien' && actor && target) {
  gm.ancienProtect(actor.name, target.name);
}

// 5. MÉTHODE DE LOG
ancienProtect(ancienName, targetName) {
  this.addGameLog(`👴 ${ancienName} protège <strong>${targetName}</strong>`);
}

// 6. RÉINITIALISATION
gm.state.AncienTarget = null;  // Avant prochain rôle
```

### Exemple: Ancien

```
AVANT: Ancien n'a rien sélectionné
PENDANT: Combobox affiche tous les joueurs (J1, J2, J3, J4...)
ACTION: Cliquer sur "J3"
AFFICHAGE: "✓ J3"
SAUVEGARDE: gm.state.AncienTarget = "p3" (ID de J3)
SUIVANT: Appel à gm.ancienProtect("J4", "J3")
LOG: "👴 J4 (Ancien) protège J3"
```

### Combobox vs Grid: Pourquoi ici?

- ✅ Combobox car: **1 seul joueur à sélectionner**
- ✅ Combobox car: Simple et rapide pour beaucoup de joueurs
- ❌ Pas grid car: Sinon 3 colonnes × 10 joueurs = 30 boutons!

---

## PATTERN 2️⃣: SÉLECTION PAIRE (2 JOUEURS)

**Rôles**: Joueur Flûte, Gitane, (Cupidon déjà existant)

### Mécanique
1. **Affichage**: Grid 3 colonnes avec tous les joueurs en boutons
2. **Interaction**: Cliquer sur 2 joueurs différents
3. **Confirmation**: Automatique quand 2 sélectionnés
4. **Log**: Enregistre les 2 joueurs quand on passe au rôle suivant

### Code Pattern

```javascript
// 1. ÉTAT STOCKÉ
gm.state.JoueurFluteSelection = []  // Array de 2 IDs joueurs

// 2. UI RENDU
<div id="gmJoueurFluteSelected">Aucun sélectionné</div>
<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
  ${players.map(p => {
    const isSelected = (gm.state.JoueurFluteSelection || []).includes(p.id);
    const bgColor = isSelected ? '#4a9d6f' : '#6b4c9a';
    return `<div class="gmJoueurFluteSelect" data-player-id="${p.id}" style="background:${bgColor};">${p.name}</div>`;
  }).join('')}
</div>

// 3. EVENT HANDLER
function attachSelectPairHandlers(gameUI, currentRole, players) {
  const stateKey = `${currentRole}Selection`;
  
  document.querySelectorAll(`.gm${currentRole}Select`).forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      const selected = gm.state[stateKey] || [];
      
      // Toggle: si déjà sélectionné, enlever; sinon ajouter (max 2)
      if (selected.includes(playerId)) {
        gm.state[stateKey] = selected.filter(id => id !== playerId);
      } else if (selected.length < 2) {
        gm.state[stateKey] = [...selected, playerId];
      }
    });
  });
}

// 4. LOGGING
if (currentRole === 'Joueur_Flute' && selection && selection.length === 2) {
  const p1 = players.find(p => p.id === selection[0]);
  const p2 = players.find(p => p.id === selection[1]);
  gm.fluteCharm(flute.name, p1.name, p2.name);
}

// 5. MÉTHODE DE LOG
fluteCharm(fluteName, person1, person2) {
  this.addGameLog(`🎵 ${fluteName} charme <strong>${person1}</strong> et <strong>${person2}</strong>`);
}

// 6. RÉINITIALISATION
gm.state.JoueurFluteSelection = [];
```

### Exemple: Joueur Flûte

```
AVANT: Rien sélectionné
AFFICHAGE: Grid 3×n boutons (tous en violet)
ACTION 1: Cliquer sur "J2"
AFFICHAGE: "✓ J2" (bouton vert)
ACTION 2: Cliquer sur "J5"
AFFICHAGE: "✓ J2 & J5" (2 boutons verts)
SAUVEGARDE: gm.state.JoueurFluteSelection = ["p2", "p5"]
SUIVANT: Appel à gm.fluteCharm("J1", "J2", "J5")
LOG: "🎵 J1 (Joueur Flûte) charme J2 et J5"
```

### Combobox vs Grid: Pourquoi ici?

- ❌ Combobox car: **2 joueurs à sélectionner = interaction répétée**
- ✅ Grid car: Visuellement plus rapide pour 2 clics
- ✅ Grid car: Feedback visuel immédiat (couleurs)
- ✅ Grid car: Identique à Cupidon (cohérence UI)

---

## PATTERN 3️⃣: SPÉCIAL RENARD (3 RÔLES, pas joueurs)

**Rôles**: Renard (unique!)

### Mécanique SPÉCIALE
1. **Spécificité**: Le Renard ne sélectionne **PAS des joueurs** mais des **RÔLES**
2. **Pourquoi**: Le Renard détecte les RÔLES des 3 personnes autour de lui
3. **Qui**: Toi (Renard) + celui à ta gauche + celui à ta droite (déterminé par table)
4. **Quoi**: Le maître du jeu doit spécifier quels RÔLES il détecte

### Code Pattern

```javascript
// 1. ÉTAT STOCKÉ
gm.state.renardDetect = {
  self: 'Renard',     // Toujours lui-même
  left: 'Voyante',    // Rôle à gauche
  right: 'Loup'       // Rôle à droite
}

// 2. UI RENDU
<select id="gmRenardSelf">
  <option value="Renard">Renard</option>  <!-- Read-only -->
</select>
<select id="gmRenardLeft">
  <option value="">-- Sélectionner --</option>
  ${Object.keys(selectedRoles).map(roleId => `<option value="${roleId}">${roleId}</option>`).join('')}
</select>
<select id="gmRenardRight">
  <option value="">-- Sélectionner --</option>
  ${Object.keys(selectedRoles).map(roleId => `<option value="${roleId}">${roleId}</option>`).join('')}
</select>

// 3. EVENT HANDLER
function attachRenardHandlers(gameUI, players, selectedRoles) {
  const leftSelect = document.getElementById('gmRenardLeft');
  const rightSelect = document.getElementById('gmRenardRight');
  
  leftSelect?.addEventListener('change', (e) => {
    gm.state.renardDetect.left = e.target.value;
  });
  rightSelect?.addEventListener('change', (e) => {
    gm.state.renardDetect.right = e.target.value;
  });
}

// 4. LOGGING
if (currentRole === 'Renard' && gm.state.renardDetect?.left && gm.state.renardDetect?.right) {
  gm.renardDetect(
    renard.name,
    gm.state.renardDetect.self,    // 'Renard'
    gm.state.renardDetect.left,    // 'Voyante'
    gm.state.renardDetect.right    // 'Loup'
  );
}

// 5. MÉTHODE DE LOG
renardDetect(renardName, selfRole, leftRole, rightRole) {
  this.addGameLog(`🦊 ${renardName} détecte: Toi=<strong>${selfRole}</strong> | Gauche=<strong>${leftRole}</strong> | Droite=<strong>${rightRole}</strong>`);
}

// 6. RÉINITIALISATION
gm.state.renardDetect = { self: 'Renard', left: null, right: null };
```

### Exemple: Renard

```
AVANT: Rien sélectionné
AFFICHAGE: 
  - "Toi: Renard" (read-only)
  - "Gauche: -- Sélectionner --"
  - "Droite: -- Sélectionner --"

ACTION 1: Sélectionner "Voyante" pour Gauche
AFFICHAGE: "Gauche: Voyante"
SAUVEGARDE: gm.state.renardDetect.left = "Voyante"

ACTION 2: Sélectionner "Loup" pour Droite
AFFICHAGE: "Droite: Loup"
SAUVEGARDE: gm.state.renardDetect.right = "Loup"

RÉSULTAT: "✓ Renard (toi) | Gauche: Voyante | Droite: Loup"

SUIVANT: Appel à gm.renardDetect("J6", "Renard", "Voyante", "Loup")
LOG: "🦊 J6 détecte: Toi=Renard | Gauche=Voyante | Droite=Loup"
```

### Pourquoi 3 combobox?

- ✅ Combobox car: Sélection de **RÔLES** (pas joueurs)
- ✅ 3 × Combobox car: **3 rôles différents** à spécifier
- ✅ Listé par rôle disponible dans le deck
- ❌ Pas grid car: Ce ne sont pas des joueurs à cliquer
- ❌ Pas grid car: Contrainte: gauche ≠ droite ≠ toi

---

## PATTERN 4️⃣: JUGEMENT (1 JOUEUR + 2 CHOIX)

**Rôles**: Juge Bègue

### Mécanique
1. **Étape 1**: Sélectionner un joueur (combobox)
2. **Étape 2**: Juger: Innocent ou Coupable (2 boutons)
3. **Confirmation**: Affichage du résultat avec couleur
4. **Log**: Enregistre le jugement

### Code Pattern

```javascript
// 1. ÉTAT STOCKÉ
gm.state.jugeBeJudgement = {
  targetId: 'p3',      // ID du joueur jugé
  verdict: 'innocent'  // 'innocent' ou 'coupable'
}

// 2. UI RENDU
<select id="gmJugeBeTarget">
  <option value="">-- Sélectionner --</option>
  ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
</select>
<button id="gmJugeBeInnocent">✓ Innocent</button>
<button id="gmJugeBeCoupable">⚠️ Coupable</button>
<div id="gmJugeBeResult">Sélectionne joueur et verdict</div>

// 3. EVENT HANDLERS
function attachJugeBeHandlers(gameUI, players) {
  const targetSelect = document.getElementById('gmJugeBeTarget');
  const btnInnocent = document.getElementById('gmJugeBeInnocent');
  const btnCoupable = document.getElementById('gmJugeBeCoupable');
  
  targetSelect?.addEventListener('change', (e) => {
    gm.state.jugeBeJudgement.targetId = e.target.value;
  });
  
  btnInnocent?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'innocent';
    btnInnocent.style.borderColor = '#66d999';  // Vert
  });
  
  btnCoupable?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'coupable';
    btnCoupable.style.borderColor = '#66d999';  // Vert
  });
}

// 4. LOGGING
if (currentRole === 'Juge_Begue' && gm.state.jugeBeJudgement?.targetId && gm.state.jugeBeJudgement?.verdict) {
  const target = players.find(p => p.id === gm.state.jugeBeJudgement.targetId);
  gm.jugeJudge(juge.name, target.name, gm.state.jugeBeJudgement.verdict);
}

// 5. MÉTHODE DE LOG
jugeJudge(jugeName, targetName, verdict) {
  const text = verdict === 'innocent' ? 'INNOCENT' : 'COUPABLE';
  this.addGameLog(`⚖️ ${jugeName} juge <strong>${targetName}</strong> → ${text}`);
}

// 6. RÉINITIALISATION
gm.state.jugeBeJudgement = { targetId: null, verdict: null };
```

### Exemple: Juge Bègue

```
AVANT: Rien sélectionné
AFFICHAGE: "Sélectionne joueur et verdict"

ACTION 1: Sélectionner "J4" dans combobox
AFFICHAGE: "Sélectionne verdict"
SAUVEGARDE: gm.state.jugeBeJudgement.targetId = "p4"

ACTION 2: Cliquer sur "✓ Innocent"
AFFICHAGE: "✓ J4 → INNOCENT" (texte vert)
SAUVEGARDE: gm.state.jugeBeJudgement.verdict = "innocent"

SUIVANT: Appel à gm.jugeJudge("J2", "J4", "innocent")
LOG: "⚖️ J2 juge J4 → INNOCENT"
```

### Pourquoi Combobox + Boutons?

- ✅ Combobox car: **1 joueur parmi beaucoup**
- ✅ Boutons car: **2 choix exclusifs** (innocent OU coupable)
- ✅ Distinction visuelle: UI = action à 2 étapes

---

## PATTERN 5️⃣: CONFIRMATIONS (RESSOURCES)

**Rôles**: Sorcière, Corbeau, Lapin Blanc, Petite Fille

### Mécanique
1. **Affichage**: Texte informatif (pas d'interaction)
2. **Action**: Cliquer un bouton "Confirmer"
3. **Effet**: Bouton change de couleur/texte
4. **Log**: Enregistre la confirmation

### Code Pattern

```javascript
// 1. ÉTAT STOCKÉ
gm.state.SorcièreConfirmed = false  // true après clique

// 2. UI RENDU
<div style="padding:6px; background:rgba(139,58,58,0.3); border-radius:3px;">
  ✓ Tu as 2 potions:
  <strong>VIE</strong> (sauve 1 personne)
  <strong>MORT</strong> (tue 1 personne)
</div>
<button id="gmSorcièreConfirm">✓ Confirmer</button>

// 3. EVENT HANDLER
function attachConfirmHandlers(gameUI, confirmType) {
  const btnConfirm = document.getElementById(`gm${confirmType}Confirm`);
  
  btnConfirm?.addEventListener('click', () => {
    gm.state[`${confirmType}Confirmed`] = true;
    btnConfirm.style.background = 'linear-gradient(135deg, #4a9d6f, #66d999)';
    btnConfirm.textContent = '✓ Confirmé';
  });
}

// 4. LOGGING
if (currentRole === 'Sorcière' && gm.state.SorcièreConfirmed) {
  const sorciere = players.find(p => p.roleId === 'Sorcière');
  gm.sorciereInitialize(sorciere.name);
}

// 5. MÉTHODE DE LOG
sorciereInitialize(sorciereName) {
  this.addGameLog(`🧙‍♀️ ${sorciereName} prépare ses 2 potions: VIE et MORT`);
}

// 6. RÉINITIALISATION
gm.state.SorcièreConfirmed = false;
```

### Exemple: Corbeau

```
AVANT: Bouton blanc "✓ Confirmer"
AFFICHAGE: "✓ Demain, ton vote comptera comme +2 votes"

ACTION: Cliquer sur "✓ Confirmer"
RÉSULTAT: Bouton devient vert avec texte "✓ Confirmé"
SAUVEGARDE: gm.state.CorbeauConfirmed = true

SUIVANT: Appel à gm.corbeauBoost("J3")
LOG: "🐦‍⬛ J3 ajoutera +2 votes demain"
```

### Pourquoi pas de sélection?

- ✅ Car: **Action passive** (pas de choix, juste confirmation)
- ✅ Car: **Information**, pas interaction
- ✅ Car: **Déclencheur** du pouvoir (passif ou futur)
- ❌ Pas combobox car: Rien à sélectionner
- ❌ Pas grid car: Rien à choisir entre joueurs

---

## 🎓 RÉSUMÉ DES PATTERNS

| Pattern | Rôles | UI | Interaction | État |
|---------|-------|----|----|--------|
| **1. SelectOne** | Ancien, Ange, etc. | 1 Combobox | Sélect 1 joueur | `RoleTarget = id` |
| **2. SelectPair** | Flûte, Gitane | Grid 3 col | Clic sur 2 joueurs | `RoleSelection = [id, id]` |
| **3. Renard** | Renard | 3 Combobox | Select 3 rôles | `renardDetect = {left, right}` |
| **4. Jugement** | Juge | Combobox + 2 Btn | Select joueur + verdict | `jugeBeJudgement = {targetId, verdict}` |
| **5. Confirm** | Sorcière, etc. | Texte + Btn | Click confirmer | `RoleConfirmed = true/false` |

---

## 💡 RÈGLES GÉNÉRALES

### Combobox: Quand l'utiliser?

✅ **OUI** si:
- Sélectionner 1 élément parmi beaucoup (>5 joueurs)
- Sélectionner des rôles (Renard, Voyante)
- Affichage compact vital
- Action unique par rôle

❌ **NON** si:
- Sélectionner 2+ joueurs → Grid
- Peu de choix (<5) → Boutons
- Retour visuel immédiat important → Boutons/Grid

### État: Quand réinitialiser?

✅ **TOUJOURS** réinitialiser après chaque rôle:
```javascript
gm.state.AncienTarget = null;
gm.state.JoueurFluteSelection = [];
gm.state.jugeBeJudgement = { targetId: null, verdict: null };
```

### Logging: Format standard

```javascript
icon + actorName + "(RoleName)" + action + targetName

Exemple: "👴 J4 (Ancien) protège J2"
```

---

**C'est tout! 24 rôles = 5 patterns = Système complet cohérent.** 🎯
