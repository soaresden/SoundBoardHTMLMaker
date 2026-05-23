# 👥 Liste des Noms de Joueurs

Cette liste est utilisée pour générer des noms aléatoires pour chaque partie au lieu du generic "J1", "J2", etc.

## Noms disponibles (19)

1. Denis
2. Cedric
3. Pauline
4. Benoit
5. Risleine
6. Marine
7. Marion
8. Emmanuel
9. Katy
10. Loris
11. Thibaut
12. Pierre
13. Anne
14. Sophie
15. Anthony
16. Leo
17. Nicolas
18. Raphael
19. Thomas

## Intégration

**Fichier**: `01-ChooseCard.js`

La fonction `getRandomPlayerNames(count)` sélectionne `count` noms aléatoires et uniques de cette liste.

À chaque nouvelle partie:
- Les joueurs reçoivent des noms aléatoires de cette liste
- Les noms sont mélangés pour varier les combinaisons
- Si le nombre de joueurs > 19, les noms manquants reçoivent le fallback "J1", "J2", etc.

## Code

```javascript
const PLAYER_NAMES = [
  'Denis', 'Cedric', 'Pauline', 'Benoit', 'Risleine',
  'Marine', 'Marion', 'Emmanuel', 'Katy', 'Loris',
  'Thibaut', 'Pierre', 'Anne', 'Sophie', 'Anthony',
  'Leo', 'Nicolas', 'Raphael', 'Thomas'
];

function getRandomPlayerNames(count) {
  const shuffled = shuffleArray(PLAYER_NAMES);
  return shuffled.slice(0, Math.min(count, PLAYER_NAMES.length));
}
```

Les noms s'affichent partout:
- Sur la table (points avec noms)
- Dans les sélections de rôles
- Dans les logs du jeu
- Dans l'élection du maire

