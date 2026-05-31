# Refactorisation FirstNightMDJ

## Objectif
Réduire le fichier 03-FirstNight-MDJ.js de 5000+ lignes à une structure modulaire et maintenable.

## Structure Avant
```
03-FirstNight-MDJ.js (5000+ lignes)
├── Classe FirstNightMDJ (~3000 lignes)
├── CSS inline (~1500 lignes)
└── Logique mélangée
```

## Structure Après
```
gamemaster/phases/
├── 03-FirstNight-MDJ.js (~500 lignes) - Classe principale
├── styles/
│   └── first-night-mdj.css (~1500 lignes) - Tous les CSS
└── utils/
    ├── html-helpers.js - Fonctions HTML réutilisables
    ├── night-state.js - Gestion d'état (morts, protégés, etc.)
    ├── night-summary-renderer.js - Rendu tableau Événements/Morts
    └── role-renderers.js - (À créer) Rendu par rôle
```

## Modules Créés

### 1. HTMLHelpers
- `escapeHTML(str)` - Échappe caractères spéciaux
- `decodeHTML(html)` - Décode entités HTML
- `createElement(tag, attrs, content)` - Crée éléments DOM

### 2. NightState
- Gère: morts, protégés, amoureux, idole
- Méthodes: `isDead()`, `killPlayer()`, `getAlivePlayers()`, etc.
- Sérialisation pour sauvegarde d'état

### 3. NightSummaryRenderer
- Rendu compact du tableau Événements/Morts
- Gestion de l'expansion au clic
- Tooltip sur survol

## Étapes Restantes
1. Extraire CSS dans `styles/first-night-mdj.css`
2. Créer `role-renderers.js` pour loups, sorcière, etc.
3. Refactoriser FirstNightMDJ pour utiliser ces modules
4. Tester et vérifier que tout fonctionne

## Bénéfices
✅ Code lisible et maintenable
✅ Modules réutilisables
✅ Facile à tester
✅ Séparation des responsabilités
