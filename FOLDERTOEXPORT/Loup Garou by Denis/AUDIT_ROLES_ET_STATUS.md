# 🔍 AUDIT COMPLET - RÔLES ET SYSTÈME DE STATUS

## 📊 RÉSUMÉ EXÉCUTIF

| Élément | GitHub | Implémenté | Manquants | % Complétude |
|---------|--------|-----------|-----------|--------------|
| **Rôles** | 52 | 38 | **14** | **73%** |
| **Descriptions** | 48 | ~20 | **28** | **42%** |
| **Statuts** | 6 | 0 | **6** | **0%** ⚠️ |

---

## ✅ RÔLES IMPLÉMENTÉS (38)

### BASE (8/8) ✓
- [x] Villageois_Villageois → "Simple villageois"
- [x] Voyante
- [x] Chasseur
- [x] Sorcière
- [x] Cupidon
- [x] Petite_Fille
- [x] Voleur
- [x] **❌ Aucun rôle LOUP implémenté !** (Simple_Loup_Garou et Grand_Mechant_Loup existent mais manquent en base)

### EXTENSION (22/24) 
- [x] Salvatore
- [x] Ancien
- [x] Ange (existe mais pas "Ancien" complètement décrit)
- [x] Servante_Devouee
- [x] Joueur_Flute
- [x] Renard
- [x] Corbeau
- [x] Enfant_Sauvage
- [x] Chien_Loup
- [x] Idiot_Village
- [x] Bouc_Emissaire
- [x] Deux_Soeurs
- [x] Trois_Freres
- [x] Comedien
- [x] Chevalier_Epee_Rouille
- [x] Juge_Begue
- [x] Abominable_Sectaire
- [x] Infect_Pere_Loups
- [x] Grand_Mechant_Loup
- [x] Loup_Garou_Blanc
- [x] Montreur_Ours
- [x] Pyromane
- ❌ **Loup_Garou_Voyant** (inventé, pas sur GitHub)
- ❌ **Ange** (devrait être "Ange déchu" - version différente ?)

### SITE OFF (4/4) ✓
- [x] Marionnettiste
- [x] Lapin_Blanc
- [x] Ankou
- ❌ **Chaman** (manquant)

### CRÉATION (4/19) 
- [x] Commodien → "Comédien"
- [x] Voleur (en extension en base, pas création)
- [x] Pyromane
- [x] Comedien
- ❌ **14 rôles création manquants !**

---

## ❌ RÔLES MANQUANTS (14)

### BASE:
1. **Loup garou** (❌ Simple_Loup_Garou existe mais c'est pas la même chose ?)
2. ❌ aucun autre

### EXTENSION:
1. **Loup garou blanc** (UNE NUIT SUR DEUX tue) - on a Loup_Garou_Blanc mais avec description différente
2. ✓ (autres complètes)

### SITE OFF:
1. **Chaman** - Village - "dès la deuxième nuit, il peut dialoguer avec les morts"

### CRÉATION (14 manquants):
1. **Prêtre** - [description manquante sur GitHub]
2. **Garde du corps** - "peut choisir quelqu'un chaque nuit, meurt si cette personne est ciblée"
3. **Porteur d'amulette** - "survit aux attaques de loups"
4. **Tireur** - [description manquante]
5. **Fille de joie** - "peut passer la nuit chez un autre joueur, meurt si c'est un loup ou si celui-ci est attaqué"
6. **Mamie grincheuse** - "choisit un joueur qui ne possèdera pas de voix au vote du village"
7. **Lépreux** - [description manquante]
8. **Savant fou** - "lorsqu'il meurt, les deux personnes à côté de lui meurent"
9. **Gros dur** - [description manquante]
10. **Louveteau** - Loups - "s'il meurt, les loups font deux victimes la nuit suivante"
11. **Humain maudit** - "S'il est tué par les loups, devient l'un d'entre eux"
12. **Tueur en série** - Seul - "chaque nuit, tue une personne"
13. **Cultiste** - Loups - "veut gagner avec les loups, est vu comme un villageois par la voyante"
14. **Mystique** - "chaque nuit, connait le nombre d'ennemis en vie des villageois"
15. **Président** - "tout le monde sait qu'il est le président, s'il meurt, le village a perdu"
16. **Arnacoeur** - "choisit une personne par nuit, si c'est un amoureux, il devient son amant"
17. **Fils de la Lune** - "s'il meurt, les loups garou ne font pas de victime la nuit suivante"

---

## ⚠️ RÔLES AVEC DESCRIPTIONS INCOMPLÈTES

| Rôle | Description Actuelle | Problème |
|------|---------------------|---------|
| Idiot_Village | "Rôle spécial" | ❌ Pas de description réelle |
| Bouc_Emissaire | "Rôle spécial" | ❌ Pas de description réelle |
| Capitaine | "Rôle spécial" | ❌ Pas de description réelle + ABSENT du GitHub |
| Deux_Soeurs | "Rôle spécial" | ❌ Pas de description réelle |
| Trois_Freres | "Rôle spécial" | ❌ Pas de description réelle |
| Comedien | "Rôle spécial" | ❌ Pas de description réelle |
| Gitane | "Qui as-tu senti connecté à qui ?" | ❌ Pas sur GitHub (role inventé ?) |
| Necromancien | "Qui veux-tu ressusciter ?" | ❌ Pas sur GitHub (rôle inventé ?) |
| Noctambule | "Qui veux-tu observer cette nuit ?" | ❌ Pas sur GitHub (rôle inventé ?) |
| Loup_Garou_Voyant | "Voit tous les rôles" | ❌ Pas sur GitHub (rôle inventé ?) |
| Ange | "Chaque nuit, choisit quelqu'un à protéger" | ❌ Devrait être "Ange déchu" ? |
| Salvatore | Description vague | ⚠️ À clarifier |
| Servante_Devouee | Description vague | ⚠️ À clarifier |

---

## 🎯 SYSTÈME DE STATUTS (À IMPLÉMENTER)

### Statuts du GitHub:

| Statut | Camp | Source | Description | Action Requise |
|--------|------|--------|-------------|-----------------|
| **Maire** | neutre | Vote du village | Possède 2 voix lors du vote | À implémenter |
| **Garde champêtre** | neutre | Maire | [description manquante] | À implémenter |
| **Amoureux** | ensemble | Cupidon | Si l'un meurt, l'autre meurt IMMÉDIATEMENT | À implémenter |
| **Charmé** | neutre | Joueur de flûte | Peut discuter avec autres charmés | À implémenter |
| **Modèle** | neutre | Enfant sauvage | Si mort par loups, Enfant devient loup | À implémenter |
| **Infecté** | loups | Père des loups | Perd ancien pouvoir, devient loup | À implémenter |

### Logique de Status:
```
Un status est une MODIFICATION de rôle appliquée à un joueur:
- Peut changer le camp du joueur
- Peut changer les pouvoirs du joueur
- Peut définir des conditions de mort spéciales
- PERSISTE jusqu'à la mort du joueur
- Peut être appliqué par plusieurs rôles

EXEMPLE Cupidon → Amoureux:
  Nuit 1: Cupidon choisit 2 joueurs
  → Les 2 joueurs reçoivent le statut "Amoureux"
  → Si joueur A meurt, joueur B meurt aussi IMMÉDIATEMENT
  → Le statut persiste tant que les deux vivent
```

---

## 📋 DONNÉES MANQUANTES

### Sur GitHub mais pas complètement:
1. Descriptions manquantes: Marionnetiste, Lapin blanc, Ankou, Chaman, Prêtre, Tireur, Lépreux, Gros dur
2. "Garde champêtre" - pas de description du statut

### Rôles inventés (pas sur GitHub):
1. Gitane
2. Necromancien
3. Noctambule
4. Loup_Garou_Voyant
5. Capitaine

### Rôles mal nommés/mal compris:
1. Ange ≠ "Ange déchu" (GitHub dit que "Ange déchu" gagne si mort PREMIÈRE nuit/PREMIER jour)
2. Loup garou blanc - description différente (GitHub: "une nuit sur deux", notre appli: "peut tuer QUE autres loups")

---

## 🔧 RECOMMANDATIONS D'ACTION

### PRIORITÉ 1 - CORRECTION IMMÉDIATE:
1. ✅ Corriger descriptions "Rôle spécial" → descriptions réelles du GitHub
2. ✅ Implémenter le système de STATUS (Amoureux, Charmé, Modèle, Infecté, Maire)
3. ✅ Ajouter les 14 rôles création manquants

### PRIORITÉ 2 - CLARIFICATION:
1. Décider si on garde les rôles inventés (Gitane, Necromancien, Noctambule, Loup_Garou_Voyant, Capitaine)
2. Clarifier les incohérences (Ange vs Ange déchu, Loup Blanc)
3. Complèter les descriptions manquantes du GitHub

### PRIORITÉ 3 - ORGANISATION:
1. Ajouter des propriétés de rôle:
   - `origin`: "base" | "extension" | "site off" | "création"
   - `camp`: "Village" | "Loups" | "Seul"
   - `hasNightAction`: boolean
   - `statuses`: string[] (statuts que ce rôle peut donner)

---

## 💾 STRUCTURE DE STATUS PROPOSÉE

```javascript
// Dans game-master.js
window.STATUSES = {
  "Amoureux": {
    id: "Amoureux",
    name: "Amoureux",
    camp: "ensemble",
    source: "Cupidon",
    description: "Si l'un meurt, l'autre meurt IMMÉDIATEMENT",
    specialBehavior: {
      type: "linkedDeath",
      linksWith: "partner"
    }
  },
  "Charmé": {
    id: "Charmé",
    name: "Charmé",
    camp: "neutre",
    source: "Joueur de flûte",
    description: "Peut discuter avec autres charmés",
    specialBehavior: {
      type: "communication",
      groupName: "Charmés"
    }
  },
  "Infecté": {
    id: "Infecté",
    name: "Infecté",
    camp: "loups",
    source: "Père des loups",
    description: "Perd ancien pouvoir, devient loup",
    specialBehavior: {
      type: "roleChange",
      newRole: "Simple_Loup_Garou"
    }
  },
  // ... autres statuts
};

// Structure joueur enrichie:
{
  name: "Loris",
  roleId: "Renard",
  statuses: ["Amoureux"], // Peut avoir plusieurs statuts
  statusData: {
    "Amoureux": {
      partner: "Benoît"
    }
  },
  isAlive: true
}
```

---

## 📊 TABLEAU RÉCAPITULATIF

```
IMPLÉMENTATION:
✓ Base complète
✓ Extension 90% (manque Chaman)
✓ Site off 100% (mais descriptions)
✗ Création 21% (4 seulement sur 19)

QUALITÉ:
✗ Descriptions: 42% seulement
✗ Statuts: 0% (à faire)
✓ Rôles: 73%

PROCHAINES ÉTAPES:
1. Remplir descriptions manquantes
2. Implémenter 6 statuts
3. Ajouter 14 rôles création
4. Nettoyer rôles inventés ou les documenter
```

---

## 🎮 IMPACT SUR LE JEU

### Sans les statuts, ces rôles NE FONCTIONNENT PAS CORRECTEMENT:
- **Cupidon**: Comment savoir qui sont les amoureux ?
- **Enfant sauvage**: Comment tracker l'idole et la transformation ?
- **Père des loups**: Comment tracker l'infection ?
- **Joueur de flûte**: Comment le groupe des charmés se communique ?

### Ces rôles création manquent complètement:
- Garde du corps
- Porteur d'amulette
- Fille de joie
- Louveteau
- Cultiste
- Et 9 autres...

C'est 26% de gameplay qui manque !

---

## ✏️ TODO

### 1. Compléter descriptions manquantes [URGENT]
### 2. Implémenter système de statuts [URGENT]
### 3. Ajouter 14 rôles création [IMPORTANT]
### 4. Clarifier/nettoyer rôles inventés [À DÉCIDER]
### 5. Enrichir métadonnées rôles (origin, camp, hasNightAction) [STRUCTURATION]
