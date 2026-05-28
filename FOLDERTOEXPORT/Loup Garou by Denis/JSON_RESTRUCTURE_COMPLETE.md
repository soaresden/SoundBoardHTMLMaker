# ✅ Restructuration JSON - Complétée

## Résumé

Tous les 15 fichiers JSON du scénario de première nuit ont été **restaurés depuis GitHub** et **restructurés** avec une nouvelle architecture simplifiée et intelligente.

## 📋 Fichiers Restaurés et Restructurés

### NightActive (12 rôles)
| Fichier | Rôle | activePeriod |
|---------|------|--------------|
| 01-Cupidon.json | Cupidon | firstNightOnly |
| 02-Enfant_Sauvage.json | Enfant_Sauvage | firstNightOnly |
| 03-Chien_Loup.json | Chien_Loup | firstNightOnly |
| 05-Voyante.json | Voyante | everyNight |
| 09-Salvateur.json | Salvateur | everyNight |
| 12-Renard.json | Renard | conditional |
| 34-Simple_Loup_Garou.json | Simple_Loup_Garou | everyNight |
| 33-Grand_Mechant_Loup.json | Grand_Mechant_Loup | conditional |
| 36-Loup_Garou_Blanc.json | Loup_Garou_Blanc | conditional |
| 06-Sorcière.json | Sorcière | conditional |
| 13-Corbeau.json | Corbeau | everyNight |

### DayActive (3 rôles)
| Fichier | Rôle | activePeriod |
|---------|------|--------------|
| 39-Chasseur.json | Chasseur | everyNight |
| 40-Chevalier_Epee_Rouille.json | Chevalier_Epee_Rouille | everyNight |
| 57-Montreur_Ours.json | Montreur_Ours | everyNight |

### NoActions (1 rôle)
| Fichier | Rôle | activePeriod |
|---------|------|--------------|
| 49-Villageois_Villageois.json | Villageois_Villageois | None |

## 🏗️ Nouvelle Structure JSON

```json
{
  "id": "Cupidon",
  "name": "Cupidon",
  "emoji": "💘",
  "camp": "Village",
  
  // ✨ NOUVEAUX CHAMPS
  "actionType": "NightActive",      // NightActive | DayActive | NoActions
  "activePeriod": "firstNightOnly", // firstNightOnly | everyNight | conditional
  
  // Gameplay
  "pouvoir": "Description du pouvoir",
  "instruction": "Ce que le rôle fait la nuit",
  "tips": "Conseils de jeu",
  "notes": "Notes additionnelles",
  
  // Visuel
  "visual": {
    "fondColor": "#DA90A7",
    "borderColor": "#DA90A7"
  },
  
  // POUR MODE ASSISTÉ COMPLET SEULEMENT
  "gamePhases": [...],
  "specialBehaviors": [...],
  "winConditions": [...]
}
```

## ✨ Simplifications Effectuées

### ❌ Supprimé
- Champ `order` au top level (sera lu depuis le filename)
- Champ `roleType` remplacé par `actionType` + `activePeriod` (plus clair)

### ✅ Ajouté
- `actionType`: **NightActive** | **DayActive** | **NoActions**
  - Indique si le rôle a une action la nuit ou le jour
  
- `activePeriod`: **firstNightOnly** | **everyNight** | **conditional**
  - Indique quand le rôle est actif
  - "conditional" = dépend d'une condition spécifique

### ℹ️ Conservé (Optionnel)
- Tous les champs pour Mode Assisté (`gamePhases`, `specialBehaviors`, `winConditions`)
- Metadonnées (`tips`, `notes`, `origin`, `cardImage`)

## 🎮 Utilisation par Mode

### Mode Assisté Complet
Utilise TOUS les champs JSON pour :
- Exécuter automatiquement les actions
- Calculer les effets
- Gérer les conditions de victoire
- Afficher les résultats

### Mode Maître du Jeu Animé
Utilise les champs ESSENTIELS :
- `actionType`, `activePeriod` → savoir si le rôle agit
- `visual` → afficher les couleurs
- `instruction` → afficher ce qu'il faut faire
- Ignore `gamePhases`, `specialBehaviors`, `winConditions`
- MDJ renseigne manuellement les résultats

## 📊 Impact

✅ **Avantages**
- Structure plus claire et lisible
- Champs explicites pour les deux modes de jeu
- Pas de duplication d'information
- Facile à étendre pour les 42 autres rôles
- Moins de complexité inutile pour le mode MDJ

## 🚀 Prochaine Étape

Implémenter les **deux modes de jeu** :
1. Sélection du mode après choix des rôles
2. Mode Assisté Complet (flux automatisé)
3. Mode Maître du Jeu Animé (formulaires manuels)

**Document généré:** 2026-05-28 ✅
