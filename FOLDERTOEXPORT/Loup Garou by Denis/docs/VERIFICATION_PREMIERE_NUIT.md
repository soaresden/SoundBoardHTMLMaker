# ✅ VÉRIFICATION COMPLÈTE: ACTIONS PREMIÈRE NUIT - 39 RÔLES

Analyse systématique de chaque rôle pour déterminer s'il a besoin d'une action à la première nuit.

---

## 📋 RÔLES AVEC ACTIONS PREMIÈRE NUIT (ÉTAPE 2)

| # | Rôle | Action | Implémenté? | Notes |
|---|------|--------|---|---|
| 1 | **Cupidon** | Sélectionner 2 amoureux | ✅ YES | 2 joueurs, grid 3 colonnes |
| 2 | **Enfant_Sauvage** | Choisir son idole | ✅ YES | Combobox joueurs (sauf lui-même) |
| 3 | **Chien_Loup** | Choisir camp (Villageois/Loup) | ✅ YES | 2 boutons: Villageois / Loup Garou |
| 4 | **Chevalier_Epee_Rouille** | Défier quelqu'un en duel | ❌ NO | À implémenter: sélectionner 1 joueur |
| 6 | **Voyante** | Vérifier rôle d'un joueur | ✅ YES | 2 combobox: joueur + rôle |
| 7 | **Sorcière** | Initialiser potions | ❌ NO | À implémenter: confirmation d'avoir 2 potions |
| 8 | **Ancien** | Protéger quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 9 | **Ange** | Protéger quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 10 | **Servante_Devouee** | Protéger quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 11 | **Salvateur** | Anticiper infection | ❌ NO | À implémenter: sélectionner 1 joueur |
| 12 | **Renard** | Renifler 3 personnes | ❌ NO | À implémenter: sélectionner 3 joueurs |
| 13 | **Gitane** | Sentir connexions | ❌ NO | À implémenter: sélectionner 2 joueurs |
| 14 | **Joueur_Flute** | Charmer 2 personnes | ❌ NO | À implémenter: sélectionner 2 joueurs |
| 15 | **Marionnettiste** | Contrôler quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 16 | **Voleur** | Voler rôle d'un joueur | ❌ NO | À implémenter: sélectionner 1 joueur |
| 17 | **Pyromane** | Marquer quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 18 | **Ankou** | Marquer pour la mort | ❌ NO | À implémenter: sélectionner 1 joueur |
| 19 | **Abominable_Sectaire** | Convertir quelqu'un | ❌ NO | À implémenter: sélectionner 1 joueur |
| 20 | **Lapin_Blanc** | Créer événement aléatoire | ❌ NO | À implémenter: bouton "Créer un événement" |
| 21 | **Juge_Begue** | Juger innocence/culpabilité | ❌ NO | À implémenter: sélectionner 1 joueur + 2 choix |
| 22 | **Necromancien** | Ressusciter les morts | ❌ NO | À implémenter: sélectionner joueurs morts |
| 23 | **Noctambule** | Rester éveillé & agir | ❌ NO | À implémenter: action variable |
| 24 | **Corbeau** | Ajouter votes futurs | ❌ NO | À implémenter: confirmation |
| 25 | **Petite_Fille** | Écouter les Loups | ❌ NO | À implémenter: bouton "Écouter" |

---

## 🚫 RÔLES SANS ACTIONS PREMIÈRE NUIT (ÉTAPE 1 SEULEMENT)

| # | Rôle | Pourquoi pas d'action? |
|---|------|------------------------|
| 4 | **Montreur_Ours** | Grogner au matin = action jour, pas nuit |
| 5 | **Chevalier_Epee_Rouille** | Peut défier au jour, pas nuit |
| 26 | **Idiot_Village** | Passif, immune au vote (jour) |
| 27 | **Bouc_Emissaire** | Passif, meurt si égalité (jour) |
| 28 | **Capitaine** | Passif, vote double (jour) |
| 29 | **Chasseur** | Passif, tire si mort (action mort) |
| 30 | **Simple_Loup_Garou** | Passif, tue avec meute (nuit générales) |
| 31 | **Grand_Mechant_Loup** | Passif, tue avec meute (nuit générales) |
| 32 | **Loup_Garou_Blanc** | Passif, élimine loups (nuit générales) |
| 33 | **Loup_Garou_Voyant** | Passif, voit tous (nuit générales) |
| 34 | **Infect_Pere_Loups** | Passif, infecte (nuit générales) |
| 35 | **Deux_Soeurs** | Liaison passive, se connaissent |
| 36 | **Trois_Freres** | Liaison passive, se connaissent |
| 37 | **Comedien** | Passif, fait semblant |
| 38 | **Villageois_Villageois** | Passif, aucun pouvoir |

---

## 📊 RÉSUMÉ IMPLÉMENTATION

### ✅ Déjà Implémentés (3/24)
1. Cupidon
2. Enfant_Sauvage (nouvellement ajouté)
3. Chien_Loup (nouvellement ajouté)
4. Voyante

### ❌ Manquent (20/24)
- 1 joueur: Chevalier_Epee_Rouille
- 2 protecteurs: Ancien, Ange, Servante_Devouee, Salvateur
- 2 détecteurs: Renard, Gitane
- 1 charme: Joueur_Flute
- 1 contrôle: Marionnettiste
- 1 vol: Voleur
- 2 marqueurs: Pyromane, Ankou
- 1 conversion: Abominable_Sectaire
- 1 événement: Lapin_Blanc
- 1 jugement: Juge_Begue
- 1 résurrection: Necromancien
- 1 noctambule: Noctambule
- 1 vote boost: Corbeau
- 1 écoute: Petite_Fille
- 1 potion: Sorcière

---

## 🔍 STATUT DÉTAILLÉ PAR TYPE D'ACTION

### Protection (4 rôles)
- **Ancien**: Sélectionner 1 joueur à protéger
- **Ange**: Sélectionner 1 joueur à protéger
- **Servante_Devouee**: Sélectionner 1 joueur à protéger
- **Salvateur**: Sélectionner 1 joueur à protéger (contre infection)

### Détection (3 rôles)
- **Renard**: Sélectionner 3 joueurs consécutifs
- **Gitane**: Sélectionner 2 joueurs pour tester connexion
- **Petite_Fille**: Bouton "Écouter les Loups"

### Contrôle/Manipulation (4 rôles)
- **Marionnettiste**: Sélectionner 1 joueur à contrôler
- **Joueur_Flute**: Sélectionner 2 joueurs à charmer
- **Voleur**: Sélectionner 1 joueur à voler
- **Abominable_Sectaire**: Sélectionner 1 joueur à convertir

### Marqueurs (3 rôles)
- **Pyromane**: Sélectionner 1 joueur à marquer
- **Ankou**: Sélectionner 1 joueur pour mort future
- **Corbeau**: Confirmation (ajouter 2 votes au jour suivant)

### Potion/Ressource (2 rôles)
- **Sorcière**: Confirmation d'avoir 2 potions (vie + mort)
- **Lapin_Blanc**: Bouton "Créer événement aléatoire"

### Jugement/Résurrection (2 rôles)
- **Juge_Begue**: Sélectionner 1 joueur + 2 boutons (Innocent/Coupable)
- **Necromancien**: Sélectionner joueurs morts à ressusciter

### Duel/Nuit (2 rôles)
- **Chevalier_Epee_Rouille**: Sélectionner 1 joueur pour défier en duel
- **Noctambule**: Action variable (à définir)

---

## 💡 RECOMMANDATIONS IMPLÉMENTATION

### Urgent (utilisés régulièrement)
1. **Chevalier_Epee_Rouille** - Duel classique
2. **Sorcière** - Confirmation potions
3. **Ancien** - Protection basique
4. **Ange** - Protection basique
5. **Renard** - Détection 3 joueurs

### Secondaire (moins critiques)
6. **Joueur_Flute** - Sélection 2 joueurs
7. **Voleur** - Sélection 1 joueur
8. **Marionnettiste** - Sélection 1 joueur
9. **Servante_Devouee** - Protection avec dette
10. **Salvateur** - Protection spéciale

### Optionnel (complexes)
- Abominable_Sectaire (conversion)
- Juge_Begue (jugement)
- Necromancien (résurrection)
- Lapin_Blanc (événement aléatoire)
- Noctambule (action à définir)
- Gitane (connexions mystiques)
- Pyromane (accumulation de marques)
- Ankou (marque mort future)
- Petite_Fille (écoute audio)

---

## 📝 PATTERN IMPLÉMENTATION STANDARD

Chaque rôle avec action suit ce pattern:

```javascript
// 1. ROLE_ACTIONS
const ROLE_ACTIONS = {
  'RoleName': { 
    instruction: '🎯 Instructions pour le joueur',
    type: 'actionType'  // selectOne, selectTwo, selectThree, etc.
  }
};

// 2. UI dans renderFirstNight() - Étape 2
${roleAction.type === 'selectOne' ? `
  <select id="gmRoleNameTarget">
    <option>-- Sélectionner un joueur --</option>
    ${players.map(p => `<option value="${p.id}">${p.name}</option>`)}
  </select>
  <div id="gmRoleNameResult">Aucune sélection</div>
` : ''}

// 3. Event handlers dans attachFirstNightEvents()
if (step === 2 && currentRole === 'RoleName') {
  const targetSelect = document.getElementById('gmRoleNameTarget');
  targetSelect?.addEventListener('change', (e) => {
    gm.state.roleNameTarget = e.target.value;
    gm.saveState();
  });
}

// 4. Logging au changement de rôle
} else if (currentRole === 'RoleName' && gm.state.roleNameTarget) {
  const actor = players.find(p => p.roleId === 'RoleName');
  const target = players.find(p => p.id === gm.state.roleNameTarget);
  if (actor && target) {
    gm.roleNameAction(actor.name, target.name);
  }
}

// 5. Logging method dans game-master.js
roleNameAction(actorName, targetName) {
  this.addGameLog(`🎯 ${actorName} a choisi <strong>${targetName}</strong>`);
}
```

---

**Généré**: 2026-05-20  
**Version**: Audit Complet
