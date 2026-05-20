# 🎯 PLAN COMPLET D'IMPLÉMENTATION - TOUS LES RÔLES

## 📊 CLASSIFICATION PAR TYPE D'ACTION

### TYPE 1: Sélection Simple (1 Joueur)
Nécessite: 1 combobox joueur + 1 affichage résultat

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Ancien** | Protéger quelqu'un | Oui (1 joueur) | Sélection simple |
| **Ange** | Protéger quelqu'un | Oui (1 joueur) | Sélection simple |
| **Servante_Devouee** | Protéger quelqu'un | Oui (1 joueur) | Sélection simple |
| **Salvateur** | Anticiper infection | Oui (1 joueur) | Sélection simple |
| **Marionnettiste** | Contrôler quelqu'un | Oui (1 joueur) | Sélection simple |
| **Voleur** | Voler le rôle | Oui (1 joueur) | Sélection simple |
| **Pyromane** | Marquer quelqu'un | Oui (1 joueur) | Sélection simple |
| **Ankou** | Marquer pour mort | Oui (1 joueur) | Sélection simple |
| **Abominable_Sectaire** | Convertir quelqu'un | Oui (1 joueur) | Sélection simple |
| **Chevalier_Epee_Rouille** | Défier en duel | Oui (1 joueur) | Sélection simple |

---

### TYPE 2: Sélection Double (2 Joueurs)
Nécessite: Grid 3 colonnes avec sélection pair

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Joueur_Flute** | Charmer 2 personnes | Non | Grid 3 colonnes (comme Cupidon) |
| **Gitane** | Sentir connexion 2 | Non | Grid 3 colonnes (comme Cupidon) |

---

### TYPE 3: Sélection Spéciale (Renard)
Nécessite: 3 combobox pour rôles (lui + gauche + droite)

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Renard** | Sentir 3 personnes | Oui (3 rôles) | Sélectionne les 3 rôles autour de lui |

**Mécanique Renard:**
- Le Renard ne sélectionne PAS les joueurs
- Le Renard détecte les RÔLES des personnes: lui-même + celle à sa gauche + celle à sa droite
- Le maître du jeu doit sélectionner 3 rôles dans des combobox
- Les joueurs aux positions gauche/droite sont déterminés par l'ordre de table

---

### TYPE 4: Sélection Multiple (3+)
Nécessite: Sélection multiple ou liste

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Necromancien** | Ressusciter les morts | Oui (morts) | Combobox multiple pour sélectionner les morts |

---

### TYPE 5: Confirmation/Ressource
Nécessite: Bouton ou texte informatif

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Sorcière** | Initialiser potions | Non | Texte: "Tu as 2 potions: VIE + MORT" + bouton Confirmer |
| **Corbeau** | Ajouter votes futurs | Non | Texte: "Tu ajouteras +2 votes demain" + bouton Confirmer |
| **Lapin_Blanc** | Créer événement | Non | Bouton "Créer un événement aléatoire" |
| **Petite_Fille** | Écouter les Loups | Non | Bouton "Écouter" (pas d'affichage, just log) |

---

### TYPE 6: Jugement (2 Choix)
Nécessite: 1 combobox joueur + 2 boutons

| Rôle | Action | Combobox? | Détails |
|------|--------|-----------|---------|
| **Juge_Begue** | Juger innocent/coupable | Oui (1 joueur + 2 choix) | Combobox joueur, puis 2 boutons Innocent/Coupable |

---

### TYPE 7: Action Jour (Pas d'action nuit)
À ignorer dans ROLES_WITH_NIGHT_ACTION

| Rôle | Pourquoi? | Détails |
|------|-----------|---------|
| **Montreur_Ours** | Grogner le matin = action jour | Passe à l'étape suivante sans Step 2 |
| **Chevalier_Epee_Rouille** | Peut défier au jour | À AJOUTER à Step 2 Nuit! (défier la nuit) |

---

### TYPE 8: Passif (Aucune action nuit)
À ignorer complètement dans première nuit

| Rôle | Pourquoi? |
|------|-----------|
| **Idiot_Village** | Passif jour |
| **Bouc_Emissaire** | Passif jour |
| **Capitaine** | Passif jour |
| **Chasseur** | Passif action mort |
| **Simple_Loup_Garou** | Passif nuit générale |
| **Grand_Mechant_Loup** | Passif nuit générale |
| **Loup_Garou_Blanc** | Passif nuit générale |
| **Loup_Garou_Voyant** | Passif nuit générale |
| **Infect_Pere_Loups** | Passif nuit générale |
| **Deux_Soeurs** | Passif liaison |
| **Trois_Freres** | Passif liaison |
| **Comedien** | Passif bluff |
| **Villageois_Villageois** | Passif |

---

## 🛠️ PATTERN IMPLÉMENTATION STANDARD

### Pour TYPE 1 (Select 1 joueur):
```javascript
// ROLE_ACTIONS
'Ancien': { 
  instruction: '👴 Ancien, tu protèges qui cette nuit ?', 
  type: 'selectOne' 
}

// renderFirstNight() - Étape 2
${roleAction.type === 'selectOne' ? `
  <div style="display:flex; flex-direction:column; gap:6px;">
    <div style="font-size:9px; color:#81dff7; font-weight:600;">Sélectionne un joueur:</div>
    <select id="gmSelectOneTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
      <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
      ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
    </select>
    <div id="gmSelectOneResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
      Aucune sélection
    </div>
  </div>
` : ''}

// attachFirstNightEvents() - Étape 2
if (step === 2 && currentRole === 'Ancien') {
  if (!gm.state.ancienTarget) gm.state.ancienTarget = null;
  const targetSelect = document.getElementById('gmSelectOneTarget');
  const resultDisplay = document.getElementById('gmSelectOneResult');
  
  const updateResult = () => {
    const targetId = gm.state.ancienTarget;
    if (targetId) {
      const target = players.find(p => p.id === targetId);
      resultDisplay.innerHTML = `✓ Tu protèges <strong>${target.name}</strong>`;
      resultDisplay.style.color = '#66d999';
    } else {
      resultDisplay.textContent = 'Aucune sélection';
      resultDisplay.style.color = '#aaa';
    }
  };
  
  targetSelect?.addEventListener('change', (e) => {
    gm.state.ancienTarget = e.target.value;
    gm.saveState();
    updateResult();
  });
  updateResult();
}

// Navigation - quand on passe au rôle suivant
} else if (currentRole === 'Ancien' && gm.state.ancienTarget) {
  const ancien = players.find(p => p.roleId === 'Ancien');
  const target = players.find(p => p.id === gm.state.ancienTarget);
  if (ancien && target) {
    gm.ancienAction(ancien.name, target.name);
  }
}

// game-master.js - Logging
ancienAction(ancienName, targetName) {
  this.addGameLog(`👴 ${ancienName} (Ancien) a protégé <strong>${targetName}</strong>`);
}

// Reset state après
gm.state.ancienTarget = null;
```

---

### Pour TYPE 2 (Select 2 joueurs - Grid):
```javascript
// Identique à Cupidon, mais avec ID personnalisé
// Ex: gmFlutePair1/gmFlutePair2, gmFlutePairSelected, etc.
```

---

### Pour TYPE 3 (Renard - 3 rôles):
```javascript
// ROLE_ACTIONS
'Renard': { 
  instruction: '🦊 Renard, sens les 3 rôles autour de toi: toi + gauche + droite', 
  type: 'renardDetect' 
}

// renderFirstNight() - Étape 2
${roleAction.type === 'renardDetect' ? `
  <div style="display:flex; flex-direction:column; gap:6px;">
    <div style="font-size:9px; color:#81dff7; font-weight:600;">Toi (Renard):</div>
    <select id="gmRenardSelf" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
      <option value="Renard" style="background:#000000; color:#e8e8f0;">Renard</option>
    </select>
    
    <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">À ta gauche:</div>
    <select id="gmRenardLeft" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
      <option value="">-- Sélectionner --</option>
      ${Object.keys(selectedRoles).filter(roleId => selectedRoles[roleId] > 0).map(roleId => `<option value="${roleId}">${roleId}</option>`).join('')}
    </select>
    
    <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">À ta droite:</div>
    <select id="gmRenardRight" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
      <option value="">-- Sélectionner --</option>
      ${Object.keys(selectedRoles).filter(roleId => selectedRoles[roleId] > 0).map(roleId => `<option value="${roleId}">${roleId}</option>`).join('')}
    </select>
    
    <div id="gmRenardResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:30px; margin-top:4px;">
      Aucune sélection
    </div>
  </div>
` : ''}
```

---

## ✅ IMPLÉMENTATION CHECKLIST

### Already Done (4)
- [x] Cupidon
- [x] Enfant_Sauvage
- [x] Chien_Loup
- [x] Voyante

### To Do (20)
- [ ] Chevalier_Epee_Rouille (TYPE 1)
- [ ] Sorcière (TYPE 5)
- [ ] Ancien (TYPE 1)
- [ ] Ange (TYPE 1)
- [ ] Servante_Devouee (TYPE 1)
- [ ] Salvateur (TYPE 1)
- [ ] Renard (TYPE 3 SPÉCIAL)
- [ ] Gitane (TYPE 2)
- [ ] Joueur_Flute (TYPE 2)
- [ ] Marionnettiste (TYPE 1)
- [ ] Voleur (TYPE 1)
- [ ] Pyromane (TYPE 1)
- [ ] Ankou (TYPE 1)
- [ ] Abominable_Sectaire (TYPE 1)
- [ ] Lapin_Blanc (TYPE 5)
- [ ] Juge_Begue (TYPE 6)
- [ ] Necromancien (TYPE 4)
- [ ] Noctambule (TYPE 1 variable)
- [ ] Corbeau (TYPE 5)
- [ ] Petite_Fille (TYPE 5)

### Not To Do (14 passifs)
- Montreur_Ours, Idiot_Village, Bouc_Emissaire, Capitaine, Chasseur
- Simple_Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc, Loup_Garou_Voyant, Infect_Pere_Loups
- Deux_Soeurs, Trois_Freres, Comedien, Villageois_Villageois

---

## 🚀 ORDRE D'IMPLÉMENTATION

1. **Faciles (TYPE 1 - 10 rôles)**: Ancien, Ange, Servante_Devouee, Salvateur, Marionnettiste, Voleur, Pyromane, Ankou, Abominable_Sectaire, Chevalier_Epee_Rouille

2. **Paires (TYPE 2 - 2 rôles)**: Joueur_Flute, Gitane

3. **Spécial Renard (TYPE 3 - 1 rôle)**: Renard

4. **Ressources (TYPE 5 - 4 rôles)**: Sorcière, Corbeau, Lapin_Blanc, Petite_Fille

5. **Jugement (TYPE 6 - 1 rôle)**: Juge_Begue

6. **Résurrection (TYPE 4 - 1 rôle)**: Necromancien

7. **Variable (TYPE 1 - 1 rôle)**: Noctambule

---

**Total Rôles Première Nuit**: 24  
**Implémentation**: Tout d'un coup avec pattern systématique
