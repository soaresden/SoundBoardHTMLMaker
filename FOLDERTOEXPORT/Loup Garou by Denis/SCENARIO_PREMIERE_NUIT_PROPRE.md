# 🌙 SCENARIO - PREMIÈRE NUIT (Loup-Garou)

## 👥 16 Habitants

1. Katy
2. Emmanuel
3. Li
4. Anthony
5. Denis
6. Cedric
7. Thomas
8. Pierre
9. Anne
10. Thibaut
11. Leo
12. Benoit
13. Pauline
14. Nicolas
15. Marion
16. Sophie

---

## 🎴 Deck de 16 Cartes

| # | Rôle | Type |
|---|------|------|
| 1 | Cupidon | Actif |
| 2 | Enfant_Sauvage | Actif |
| 3 | Chien_Loup | Actif |
| 4 | Voyante | Actif |
| 5 | Salvateur | Actif |
| 6 | Renard | Actif |
| 7 | Simple_Loup_Garou | Actif |
| 8 | Simple_Loup_Garou | Actif |
| 9 | Grand_Mechant_Loup | Actif (conditionnel) |
| 10 | Loup_Garou_Blanc | Actif (conditionnel) |
| 11 | Sorcière | Actif |
| 12 | Corbeau | Actif |
| 13 | Chasseur | Passif |
| 14 | Chevalier_Epee_Rouille | Passif |
| 15 | Montreur_Ours | Passif |
| 16 | Villageois_Villageois | Passif |

---

## 🔔 APPELS DE LA PREMIÈRE NUIT

### ✨ ÉTAPE 1 - Cupidon
**Rôle assigné à:** Katy

- Katy se réveille
- **Action:** On lui demande qui elle veut rendre amoureux
- **Choix de Katy:** Denis et Pauline
- **Résultat:** Denis ❤️ Pauline sont maintenant liés - si l'un meurt, l'autre meurt aussi
- Katy se rendort

---

### 👦 ÉTAPE 2 - Enfant Sauvage
**Rôle assigné à:** Emmanuel

- Emmanuel se réveille
- **Action:** On lui demande qui il veut en idole
- **Choix d'Emmanuel:** Li
- **Résultat:** Li est l'idole d'Emmanuel
- Emmanuel se rendort

---

### 🐕🐺 ÉTAPE 3 - Chien Loup
**Rôle assigné à:** Anthony

- Anthony se réveille
- **Action:** Pouce en l'air = devenir Loup-Garou | Pouce vers le bas = rester Villageois
- **Choix d'Anthony:** Pouce en l'air 👍
- **Résultat:** Anthony devient Loup-Garou
- Anthony se rendort (mais se réveillera avec les autres loups)

---

### 👁️ ÉTAPE 4 - Voyante
**Rôle assigné à:** Cedric

- Cedric se réveille
- **Action:** Qui veut-il voir ?
- **Choix de Cedric:** Benoit
- **Résultat:** 
  - Benoit est **Chasseur**
  - On assigne Chasseur à Benoit
- Cedric se rendort

---

### 👼 ÉTAPE 5 - Salvateur
**Rôle assigné à:** Thomas

- Thomas se réveille
- **Action:** Qui veut-il protéger de la morsure de Loup-Garou ?
  - ⚠️ Restriction: Ne peut pas protéger la même personne 2 nuits consécutives
- **Choix de Thomas:** Pierre
- **Résultat:** Pierre est protégé cette nuit
- Thomas se rendort

---

### 🦊 ÉTAPE 6 - Renard
**Rôle assigné à:** Pierre

- Pierre se réveille
- **Action:** Qui veut-il renifler ? (+ ses 2 voisins à table)
- **Choix de Pierre:** Thibaut
- **Découverte:** 
  - **Thibaut** = Simple_Loup_Garou
  - **Anne** (voisin droit) = Grand_Mechant_Loup ✅ LOUP DETECTÉ
  - **Leo** (voisin gauche) = Loup_Garou_Blanc ✅ LOUP DETECTÉ
- **Résultat:**
  - On assigne Simple_Loup_Garou à Thibaut
  - On assigne Grand_Mechant_Loup à Anne
  - On assigne Loup_Garou_Blanc à Leo
  - **Pierre reçoit un pouce en l'air** 👍 = indicateur loup détecté
  - Pierre **garde son pouvoir** car il a bien reniflé des loups
- Pierre se rendort

---

### 🐺 ÉTAPE 7 - Loups-Garous (Appel Collectif)
**Rôles:** Simple_Loup_Garou x2, Chien_Loup (devenu loup), Grand_Mechant_Loup, Loup_Garou_Blanc

- Se réveillent:
  - **Thibaut** (Simple_Loup_Garou #1)
  - **Li** (Simple_Loup_Garou #2)
  - **Anthony** (Chien_Loup → devenu Loup-Garou)
  - **Anne** (Grand_Mechant_Loup)
  - **Leo** (Loup_Garou_Blanc)

- **Action:** Tous se concertent - qui tuent-ils cette nuit ?
- **Choix collectif:** Benoit
- **Résultat:** Benoit sera mort au matin
  - 🔴 Counter: `wolvesKilledThisNight = 1`
- Les loups se rendorment

---

### 🐺👑 ÉTAPE 8 - Grand Mechant Loup
**Rôle:** Grand_Mechant_Loup (Anne)

- Anne se réveille seule
- **Condition d'activation:** Peut agir seulement si `wolvesKilledThisNight === 0`
  - ✅ **CONDITION REMPLIE** (1 loup tué = condition NOT met, mais elle peut encore agir car personne n'a été tué par elle personnellement... attendez)
  
  ⚠️ **CLARIFICATION ATTENDUE:** 
  - Est-ce que le counter `wolvesKilledThisNight` compte les victimes des loups ou les **loups tués** ?
  - Si c'est "aucun loup n'a été tué", alors oui Anne peut agir
  
- **Supposant condition remplie:**
  - **Action:** Elle peut tuer une personne supplémentaire
  - **Choix d'Anne:** Pauline
  - **Résultat:** Pauline sera morte au matin (en plus de Benoit)
    - 🔴 Counter: `wolvesKilledThisNight = 1` (inchangé, c'est pas un loup)
- Anne se rendort

---

### 🐺⚪ ÉTAPE 9 - Loup Garou Blanc
**Rôle:** Loup_Garou_Blanc (Leo)

- Leo se réveille seul
- **Condition d'activation:** Peut agir seulement les nuits impaires (1, 3, 5, etc.)
  - ✅ **C'est la Nuit 1 = impaire → CAN AGIR**

- **Restriction spéciale:** Ne peut tuer que des **Loups-Garous**
  - Loups disponibles: Thibaut, Li, Anthony, Anne
  
- **Action:** Qui veut-il tuer ?
- **Choix de Leo:** Anne
- **Résultat:** Anne sera morte au matin (ajoutée à la liste des morts)
  - 🔴 Counter: `wolvesKilledThisNight = 2` (Anne = loup tué!)
- Leo se rendort

---

### 🧙‍♀️ ÉTAPE 10 - Sorcière
**Rôle assigné à:** Pauline

- Pauline se réveille
- **Ressources:** 2 potions au début du jeu
  - 1 potion de VIE (résurrection)
  - 1 potion de MORT (poison)

- **Annonce du Maître du Jeu:**
  - "Les Loups-Garous ont tué [montrer Benoit] ☠️"
  - "Veux-tu le sauver ? [pouce en l'air = oui]"
  - "Ou veux-tu tuer quelqu'un d'autre ? [montrer une autre personne]"
  - "Ou ne rien faire ?"

- **Choix de Pauline:** Ne rien faire
  - ⚠️ Note: Pauline ne sait pas qu'Anne et elle-même seront aussi mortes au matin

- **Résultat:** Pas de potion utilisée
- Pauline se rendort

---

### 🐦‍⬛ ÉTAPE 11 - Corbeau
**Rôle assigné à:** Nicolas

- Nicolas se réveille
- **Action:** Pointe quelqu'un pour lui voler 2 votes demain
- **Choix de Nicolas:** Cedric
- **Résultat:** Cedric aura -2 votes au vote du jour (ou +2 votes contre lui)
- Nicolas se rendort

---

### 😴 ÉTAPE 12 - Rôles Sans Action (Identification)
**Rôles:** Chasseur, Chevalier_Epee_Rouille, Montreur_Ours, Villageois_Villageois

Les rôles sans pouvoir de nuit sont appelés pour s'identifier:

**Chasseur** → Benoit (déjà assigné par Voyante)
**Chevalier_Epee_Rouille** → Marion
**Montreur_Ours** → Sophie
**Villageois_Villageois** → Denis

Ils se rendorment.

---

## 📊 ÉTAT AU MATIN

### ☠️ Morts de la Nuit 1
1. **Benoit** (tué par les Loups)
2. **Pauline** (tuée par Grand_Mechant_Loup)
3. **Anne** (tuée par Loup_Garou_Blanc)

### 🎭 Rôles Révélés
- ❌ Benoit = Chasseur (PostMortem - va avoir une action)
- ❌ Pauline = Sorcière (n'a pas pu se sauver)
- ❌ Anne = Grand_Mechant_Loup (les loups sont dévoilés)

### ✨ Pouvoirs Actifs
- **Cupidon:** Denis ❤️ Pauline (Pauline morte, mais Denis meurt aussi!)
  - **DOUBLE MORT:** Pauline ET Denis
- **Enfant_Sauvage:** Li est l'idole
- **Renard:** A senti du loup (Pierre garde son pouvoir)
- **Corbeau:** Cedric a -2 votes

### 📍 À Vérifier (Montreur_Ours)
- Sophie (Montreur_Ours) est vivante
- Regarder ses voisins à table
- Si un loup à droite ou gauche → **"L'ours grogne !"** 🐻
- Sinon → **"L'ours ne grogne pas"** 😴

---

## 🔄 Résumé des Actions

| Étape | Rôle | Habitant | Action | Résultat |
|-------|------|----------|--------|----------|
| 1 | Cupidon | Katy | Choisit 2 amoureux | Denis ❤️ Pauline |
| 2 | Enfant_Sauvage | Emmanuel | Choisit idole | Li = idole |
| 3 | Chien_Loup | Anthony | Choix loup/villageois | Devient Loup-Garou |
| 4 | Voyante | Cedric | Voir identité | Benoit = Chasseur |
| 5 | Salvateur | Thomas | Protéger | Pierre protégé |
| 6 | Renard | Pierre | Renifler | Découvre 3 loups |
| 7 | Loups | 5 loups | Tuer ensemble | Benoit tué |
| 8 | Grand_Mechant_Loup | Anne | Tuer bonus | Pauline tuée |
| 9 | Loup_Garou_Blanc | Leo | Tuer un loup | Anne tuée |
| 10 | Sorcière | Pauline | Potions | Rien fait |
| 11 | Corbeau | Nicolas | Voler votes | Cedric -2 votes |

---

## ⚠️ Points à Clarifier

1. **Simple_Loup_Garou #2 = Li** ✅ Confirmé
2. **Condition Grand_Mechant_Loup:** "Aucun loup n'a été tué" = 0 loups-garous morts pendant la nuit?
3. **Montreur_Ours:** Vérifier ses voisins immédiats à table pour le cri de l'ours
4. **Cupidon:** Denis meurt car Pauline est morte (effet en cascade)

---

**Document généré:** Scenario propre et prêt pour la mise en jeu! 🎮
