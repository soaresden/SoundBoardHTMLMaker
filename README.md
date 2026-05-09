# 🎲 SoundBoardHTMLMaker
<img width="663" height="462" alt="image" src="https://github.com/user-attachments/assets/4f4c43c4-777d-4db0-ab89-86984013ee00" />

Editor : 
<img width="1892" height="941" alt="image" src="https://github.com/user-attachments/assets/998db916-731f-4130-8f3d-aed2f6ce9ded" />
<img width="1107" height="666" alt="image" src="https://github.com/user-attachments/assets/91b18f52-1fba-409a-818b-f7991e467dc6" />

Player : 
<img width="1881" height="947" alt="image" src="https://github.com/user-attachments/assets/ef1c5615-bb63-4e80-afa3-e071cb132cbd" />




Un **template générique** pour transformer un dossier de mp3 en une **soundboard HTML autonome**, prête à être ouverte sur ordinateur ou tablette en `file://`. Pensé pour les MJ de jeux de société (Loup-Garou, JdR, Dixit, jeux narratifs…) qui veulent un panneau d'ambiances + effets sonores adaptable à n'importe quel jeu.

> Tu déposes tes mp3 dans `music/` et `sfx/`, tu lances `runme.bat`, tu mets en forme dans l'éditeur web, tu builds → un dossier `FOLDERTOEXPORT/` autonome est créé. Tu le copies sur ta tablette, tu ouvres `output.html` → ça marche.

---

## ✨ Features

- **Scan automatique** des mp3 dans `music/` et `sfx/` avec extraction des covers depuis les tags ID3.
- **Éditeur web** local pour organiser les morceaux : titres, catégories personnalisées, volumes, drag & drop pour réordonner.
- **Drag & drop des morceaux et catégories** pour positionner sans saisir la pos manuellement (la pos est relative à la catégorie et recalculée auto).
- **Thème de couleur configurable** : 2 color pickers (couleur principale + secondaire) qui propagent dans tout le player. Background, panels, glow, séparateurs : tout est dérivé.
- **Auto-thème depuis une cover** : un clic, le projet analyse l'image d'une de tes covers et en extrait les 2 couleurs dominantes pour générer un thème immersif.
- **Player autonome** :
  - Lecture en boucle infinie de toutes les musiques par défaut.
  - **Vue vignettes** ou liste compacte.
  - Catégories **collapsables** avec compteur, état mémorisé en localStorage.
  - Barre de progression **cliquable et draggable** (seek précis à la souris ou au doigt).
  - **Splitters draggables** entre les 3 panneaux (Now Playing / Music / SFX).
  - **Animations légères** : glow pulsé sur la cover en lecture, halo sur la track active, shimmer sur la barre de progression, ping de feedback sur clic SFX.
  - Cover du premier morceau affichée par défaut au chargement.
  - Emojis monochromes dans les titres (pour ne pas casser l'esthétique du thème).
  - Volumes par track, sliders globaux Music/SFX, stop-all.
- **Export propre** dans `FOLDERTOEXPORT/` : seulement les fichiers mp3 réellement référencés sont copiés, plus le `output.html` autonome et le `config.json` pour debug.

---

## 🚀 Quick start

### Pré-requis
- Windows + Python 3.x
- `mutagen` pour la lecture des tags ID3 :
  ```
  pip install mutagen
  ```

### Setup
1. Clone ce repo (ou télécharge en zip) :
   ```
   git clone https://github.com/soaresden/SoundBoardHTMLMaker
   cd SoundBoardHTMLMaker
   ```
2. Dépose tes mp3 :
   - Musiques d'ambiance dans `music/`
   - Effets ponctuels dans `sfx/`
3. Lance `runme.bat`.

### Workflow
Le menu propose :

```
1. Scan fichiers (config.json)        -> détecte tes mp3, extrait covers
2. Ouvrir Editor                      -> http://127.0.0.1:8765/editor
3. Build Player                       -> génère FOLDERTOEXPORT/
4. Scan + Build
5. Build + Open Player                -> build + ouvre dans le navigateur
0. Quit
```

**Workflow type :**
1. Choix `1` (Scan) → `config.json` est créé.
2. Choix `2` (Editor) → tu crées tes catégories ("Nuit", "Jour", "Combat", "Taverne"…), tu drag & drop les morceaux pour les ranger, tu pickes ta couleur de thème (ou tu cliques 🎨 Auto pour la dériver d'une cover). Click **💾 Save**.
3. Choix `5` (Build + Open) → `FOLDERTOEXPORT/output.html` s'ouvre dans le navigateur, prêt à l'emploi.

### Tablette / portabilité
- Le dossier `FOLDERTOEXPORT/` est entièrement autonome.
- Copie-le tel quel sur ta tablette (USB, Drive, AirDrop, peu importe).
- Ouvre `output.html` en `file://` → tout fonctionne hors ligne.

---

## 🗂️ Structure du projet

```
SoundBoardHTMLMaker/
├── runme.bat              # Menu Windows (lancement serveur + actions)
├── server_static.py       # Serveur HTTP local (sert l'editor + endpoint /save)
├── build.py               # CLI scan / build (génère FOLDERTOEXPORT/)
├── src/
│   ├── scan.py            # Scan des mp3, extraction ID3, merge avec config existant
│   ├── id3.py             # Lecture des tags ID3 + extraction covers
│   └── build_html.py      # Inline CSS + JS dans output.html
├── templates/
│   ├── base.html          # Template du player
│   ├── play.js            # Logique du player (lecture, seek, splitters, …)
│   ├── editor.html        # Page de l'editor
│   ├── editor.js          # Logique de l'editor (drag&drop, palette, …)
│   └── styles.css         # Thème complet (variables --accent / --accent-2)
├── music/                 # Tes mp3 d'ambiance     [.gitignored]
├── sfx/                   # Tes mp3 d'effets       [.gitignored]
├── covers/                # Covers extraites des ID3 [.gitignored, regénéré]
└── FOLDERTOEXPORT/        # Build de sortie autonome [.gitignored, regénéré]
```

---

## 🎨 Personnalisation

### Catégories
Crées-en autant que tu veux dans l'éditeur (panneau "Catégories") : **Music** et **SFX** ont chacun leur set indépendant. Drag & drop avec la poignée `⋮⋮` pour réordonner. La pos d'un morceau est **relative à sa catégorie** (1, 2, 3 par cat) et recalculée automatiquement à chaque drag.

Exemples selon le jeu :
- **Loup-Garou** : Nuit / Jour / Vote / Cupidon / Voyante / Sorcière / Lycans
- **D&D** : Combat / Taverne / Donjon / Boss / Voyage
- **Dixit** : Onirique / Joyeux / Sombre / Mystérieux
- **Pandemic** : Tension basse / Tension haute / Crise / Victoire

### Thème
Deux color pickers dans le header de l'editor :
- **C1** = couleur principale (boutons, sliders, hover, glow…)
- **C2** = couleur secondaire (background, gradients)

Bouton **🎨 Auto** : choisis une cover dans la liste, l'analyseur extrait automatiquement les 2 couleurs dominantes et saturées de l'image, et applique. Pratique pour avoir un thème qui matche l'ambiance visuelle de ton jeu.

Les couleurs sont sauvées dans `config.json` sous `project.themeColor` et `project.themeColor2`.

---

## 🧠 Comportement du scan

Le scan est **idempotent** :
- Préserve les choix de l'utilisateur : catégories, ordre des morceaux par drag & drop, volumes per-track, assignations de catégorie, couleurs du thème, nom du projet.
- Ajoute en queue les nouveaux mp3 ajoutés au dossier (catégorie vide).
- Retire les morceaux dont le mp3 a disparu.
- Vide `covers/` à chaque scan et re-extrait les covers depuis les tags ID3.
- Recalcule les `pos` par catégorie (1, 2, 3 dans chaque cat).

Tu peux donc rescanner autant de fois que tu veux, ça ne fait jamais reculer ton travail.

---

## 📝 License

MIT — fais-en ce que tu veux. Si tu utilises ce projet pour quelque chose de cool, un crédit ou un retour est apprécié mais pas obligatoire.

---

## 🙋 Crédits

- Auteur : [@soaresden](https://github.com/soaresden)
- Génération assistée du code et de l'architecture avec Claude.
