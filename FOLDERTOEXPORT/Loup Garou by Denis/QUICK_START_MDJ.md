# ⚡ Quick Start - Mode MDJ

## 🚀 Commencer une Partie en 3 Étapes

### Étape 1: Ouvrir le Jeu
1. Ouvrir `index.html` dans un navigateur
2. Cliquer sur **🐺 Maître du Jeu** dans le header

### Étape 2: Sélectionner les Rôles
1. Voir l'écran de sélection des rôles
2. Choisir le nombre de joueurs (ex: 16)
3. Générer un set de rôles aléatoires OU sélectionner manuellement
4. Cliquer **Suivant →**

### Étape 3: Choisir le Mode de Tirage
1. Écran: **🎴 Tirage Manuel** vs **💻 Tirage Web**
2. **Manuel**: Cartes physiques, pas d'assignation web → va directement à la Nuit 1
3. **Web**: Assigner les rôles via l'interface → table de joueurs → Nuit 1

---

## 🎮 Jouer la Première Nuit (MDJ Mode)

### L'Interface
```
LEFT                CENTER                RIGHT
───────────────────────────────────────────────────
Listbox rôles       Action buttons        Player table
─ Cupidon ✓         💕 Colorer (2)       [Sophie]
─ Enfant_S.         🎯 Idole (1)        [Katy]
─ Chien_Loup        🛡️ Protéger (1)      [Denis]
─ Voyante           👁️ Voir (1)         [Leo]
─ Salvateur         👃 Renifler (3)     ...
─ Renard            🩸 Tuer (collectif)
─ Loups
─ Sorcière
─ Corbeau
───────────────────────────────────────────────────
LOGS (bottom): 26/05/2026 à 08:05:21 : 💘 Cupidon - ...
```

### Comment Faire une Action (Exemple: Cupidon)

**Étape 1**: Cliquer sur [Cupidon] dans la listbox
- Les action buttons s'affichent: **💕 Colorer les amoureux (2)**

**Étape 2**: Cliquer **💕 Colorer les amoureux**
- Center panel change: "Sélectionnés: 0/2"

**Étape 3**: Cliquer sur 2 joueurs dans la table (ex: Sophie & Denis)
- Ils se surlignent en jaune
- Center montre: "Sélectionnés: 2/2" + **✓ Confirmer**

**Étape 4**: Cliquer **✓ Confirmer**
- ✅ Action loggée: "💘 Cupidon - a colorer les amoureux - Sophie & Denis"
- [Cupidon] marqué complété ✓
- Progress bar: "1/12"

**Étape 5**: Répéter pour les autres rôles

---

## 📋 Rôles et Actions Première Nuit

| Rôle | Emoji | Action | Joueurs |
|------|-------|--------|---------|
| Cupidon | 💘 | Colorer les amoureux | 2 |
| Enfant_Sauvage | 🎯 | Désigner l'idole | 1 |
| Chien_Loup | 🐕‍🦺 | Devenir Loup / rester Villageois | - |
| Voyante | 👁️ | Voir le rôle d'un joueur | 1 |
| Salvateur | 🛡️ | Protéger un joueur | 1 |
| Renard | 🦊 | Renifler (3 joueurs) | 1 |
| Simple_Loup_Garou | 🐺 | Tuer (collectif) | 1 |
| Grand_Mechant_Loup | 👑 | Tuer (bonus) | 1 |
| Loup_Garou_Blanc | ⚪ | Tuer un loup | 1 |
| Sorcière | 🧙‍♀️ | Ressusciter / Empoisonner | 1 |
| Corbeau | 🐦‍⬛ | Voler 2 votes | 1 |

---

## 🌙 Première Nuit → Jour → Nuit 2+

### Transition Automatique
Quand tous les rôles de la première nuit sont complétés:
1. ✅ Chaque action est loggée
2. 🔄 Transition auto vers [05-Day.js]
3. 🗳️ MDJ gère le jour (vote, reveal)
4. 🌙 Transition automatique à Night-MDJ pour nuit 2+

### Actions Nuit 2+ (Différences)
- **Pas de**: Cupidon, Enfant_Sauvage, Chien_Loup (roles firstNightOnly)
- **Conditions**: 
  - Grand_Mechant_Loup: seulement si 0 loups tués
  - Loup_Garou_Blanc: seulement nuits impaires
  - Sorcière: si elle a encore des potions
- **Bouton**: "⏭ Passer à la nuit suivante" (au lieu de transition auto)

---

## 📊 Vérifier les Logs

### En Temps Réel
- Les logs s'affichent en bas de l'écran en temps réel
- Scroll automatique vers le dernier log
- Format: `DD/MM/YYYY à HH:MM:SS : Role - Action - Details`

### En Console (Pour Debug)
```javascript
// Ouvrir Console du navigateur (F12)

// Voir tous les logs
window.gameLogger.getLogs()

// Exporter les logs en texte
window.gameLogger.exportAsText()

// Voir l'état du jeu
window.gm.state

// Voir le mode actuel
window.gm.state.gameMode  // 'mdj'
```

---

## ⚠️ Dépannage

### "TirageMode not loaded"
→ Vérifier que `02-TirageMode.js` est chargé dans index.html

### "FirstNightMDJ not loaded"
→ Vérifier que `03-FirstNight-MDJ.js` est chargé dans index.html

### "Interface figée après sélection rôles"
→ Ouvrir Console (F12) et chercher les erreurs en rouge
→ Vérifier que le mode est bien 'tirageMode': `window.gm.state.mode`

### Actions ne s'affichent pas
→ Vérifier qu'un rôle est sélectionné (doit être en bleu)
→ Vérifier que le rôle a des actions: `window.getOrderedRoleIds()`

### Joueurs ne se sélectionnent pas
→ Cliquer directement sur le nom du joueur
→ Le card doit se surligner en jaune
→ Vérifier actionState: `console.log(this.actionState)`

---

## 🎓 Exemple Complet de Partie

```
=== PARTIE 16 JOUEURS ===

SÉLECTION RÔLES:
✓ 16 rôles sélectionnés
✓ Set équilibré: 5 Loups vs 11 Villageois

TIRAGE MODE:
✓ Choisi: 🎴 Manuel
→ Direction: FirstNight-MDJ

PREMIÈRE NUIT:
✓ Cupidon: Sophie & Denis (amoureux)
✓ Enfant_Sauvage: Li (idole)
✓ Chien_Loup: Anthony (devient Loup)
✓ Voyante: Benoit (voit Chasseur)
✓ Salvateur: Thomas (protège Pierre)
✓ Renard: Pierre (renifle 3 loups)
✓ Loups: tous ensemble tuent Benoit
✓ Grand_Mechant_Loup: Anne tue Pauline
✓ Loup_Garou_Blanc: Leo tue Anne
✓ Sorcière: Pauline ne ressuscite personne
✓ Corbeau: Nicolas vole 2 votes de Cedric

MATIN NUIT 1:
3 morts: Benoit (tué), Pauline (tuée), Anne (tuée)
Cascade: Denis meurt aussi (amoureux de Pauline)
→ Total 4 morts

JOUR 1:
Vote: éliminer un joueur par vote
Chasseur (Benoit): postmortem action

NUIT 2:
Seuls les rôles "everyNight" se réveillent:
✓ Voyante: Cedric (voit Voyante)
✓ Salvateur: Pierre (protège quelqu'un d'autre)
✓ Renard: Pierre (renifle)
✓ Loups: tuent un villageois
✓ Sorcière: pas de potions
✓ Corbeau: vole des votes
→ Pas de Cupidon, Chien_Loup, Enfant_Sauvage

...continue...

JOUR 6:
Villageois éliminent les derniers loups
🎉 VILLAGE GAGNE!

LOGS EXPORTÉS:
26/05/2026 à 20:00:15 : 🎮 Partie commencée
26/05/2026 à 20:05:30 : 🌙 Nuit 1 commence
26/05/2026 à 20:05:45 : 💘 Cupidon - a colorer les amoureux - Sophie & Denis
...
26/05/2026 à 21:30:00 : ☀️ Jour 6 - Village gagne!
```

---

## ✅ Checklist Avant de Tester

- [ ] Navigateur moderne (Chrome, Firefox, Safari, Edge)
- [ ] Console dev ouverte (F12) pour vérifier les erreurs
- [ ] 16 joueurs avec des noms distincts
- [ ] Set de rôles équilibré (loups vs villageois)
- [ ] Comprendre les rôles et leurs pouvoirs
- [ ] Lire les instructions dans l'interface

---

## 📞 Questions Fréquentes

### Q: Les logs continuent après la partie?
**R**: Oui, les logs s'accumulent. `window.gameLogger.clear()` pour réinitialiser.

### Q: Peut-on annuler une action?
**R**: Non encore. Mais on peut marquer un rôle "non complété" en arrière-plan si besoin.

### Q: Quelle est la différence Manuel vs Web tirage?
**R**: 
- **Manuel**: MDJ n'assigne pas les rôles via interface, joueurs les piochent eux-mêmes
- **Web**: MDJ assigne les rôles via table avant de commencer la nuit

### Q: Mode Assisté quand?
**R**: Commenté pour l'instant. Implémentation prévue après tests du MDJ.

---

**Happy Gaming! 🎭🎲**
