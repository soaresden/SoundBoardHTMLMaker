# 🎨 GUIDE DES COULEURS - LOUP GAROU

## Couleurs des Rôles (Sur la Map)

### 🐺 LOUPS
- **Simple Loup Garou**: Rouge foncé (#8b3a3a)
- **Grand Mechant Loup**: Rouge vif + Rouge foncé (#d46666)
- **Loup Blanc**: Blanc + Bordure rouge (#fff)
- **Loup Voyant**: Rouge foncé + Rose (#8b3a3a)
- **Père des Loups**: Rouge + Rouge foncé (#d46666)

### 💘 RÔLES CRITIQUES
- **Cupidon**: Bleu clair (#5174db) + Bleu bord (#7ba3f5)
  - *Les 2 amoureux s'affichent en ROSE (#ff69b4)* ✨
- **Enfant Sauvage**: Marron (#8b6f47)
- **Chien Loup**: Vert + Bordure rouge (bicolor #4a9d6f)

### 🔮 RÔLES SPÉCIAUX
- **Voyante**: Violet (#7b68ee) + Bordure jaune (#ffd700)
- **Renard**: Orange (#ff8c00)
- **Sorcière**: Vert (#4caf50) + Bordure rouge (#d46666)
- **Salvateur**: Jaune (#ffd700) + Bordure bleu (#5174db)

### 🎪 AUTRES
- **Montreur d'Ours**: Marron (#8b6f47) + Trait noir (#000)
- **Chevalier à l'Épée Rouille**: Gris (#808080) + Trait rouge (#cc0000)
- **Chasseur**: Vert (#4caf50) + Marron bordure (#8b6f47)
- **Corbeau**: Noir (#000)

## Affichage Spécial

### 💗 AMOUREUX (Cupidon)
Quand Cupidon sélectionne 2 joueurs:
- Les 2 joueurs affichent une **bordure ROSE (#ff69b4)**
- **Halo rose** autour du point (box-shadow)
- Bordure **plus épaisse** (3px) pour bien voir
- Visible sur la map pendant toute la partie

### 🟢 RÔLE COURANT (Assignation)
Pendant l'assignation:
- Le joueur courant a une **bordure VERTE (#00ff00)**
- Permet de voir qui est en train d'être assigné

### ⚪ RÔLE NON ASSIGNÉ
- Joueur sans rôle: Violet par défaut (#6b4c9a)

## Utilisation en Jeu

```
Étape 1 - Assignation:
- Cliquer sur les joueurs pour leur assigner des rôles
- Le rôle en cours s'affiche avec bordure VERTE
- Chaque rôle assigné prend sa couleur

Étape 2 - Actions:
- Les amoureux (Cupidon) s'affichent en ROSE
- Facile d'identifier les couples à protéger!
```

## Code d'Integration

```javascript
// Dans game-master.js
const ROLE_COLORS = {
  'Simple_Loup_Garou': { bg: '#8b3a3a', border: '#d46666' },
  // ... etc
};

// Méthodes:
gm.getRoleColor(roleId)        // Récupère couleur pour un rôle
gm.areLovers(playerId1, id2)   // Vérifie si amoureux
```

## Test Checklist

- [ ] Map affiche pendant assignation
- [ ] Rôles ont les bonnes couleurs
- [ ] Amoureux s'affichent en rose
- [ ] Rôle courant a bordure verte
- [ ] Les couleurs restent après chaque action
- [ ] Halo rose visible sur amoureux

