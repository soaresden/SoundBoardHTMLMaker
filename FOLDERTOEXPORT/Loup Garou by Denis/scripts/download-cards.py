#!/usr/bin/env python3
"""
Télécharge toutes les cartes des rôles depuis le wiki Loup-Garou
"""
import os
import requests
from urllib.parse import urlparse

# Extraire les URLs des images du tableau
images_data = [
    ("Abominable_Sectaire", "https://static.wikia.nocookie.net/loupgaroumal/images/5/5e/Abominable_Sectaire.webp/revision/latest?cb=20250907104952&path-prefix=fr"),
    ("Ancien", "https://static.wikia.nocookie.net/loupgaroumal/images/e/e9/Ancien.webp/revision/latest?cb=20250907101920&path-prefix=fr"),
    ("Ange", "https://static.wikia.nocookie.net/loupgaroumal/images/6/65/Ange.webp/revision/latest?cb=20250907105023&path-prefix=fr"),
    ("Ankou", "https://static.wikia.nocookie.net/loupgaroumal/images/a/ad/Ankou1.webp/revision/latest?cb=20250907103636&path-prefix=fr"),
    ("Bouc_Emissaire", "https://static.wikia.nocookie.net/loupgaroumal/images/b/be/Bouc_%C3%89missaire.webp/revision/latest?cb=20250907103806&path-prefix=fr"),
    ("Capitaine", "https://static.wikia.nocookie.net/loupgaroumal/images/8/82/Capitaine1.webp/revision/latest?cb=20250907103848&path-prefix=fr"),
    ("Chasseur", "https://static.wikia.nocookie.net/loupgaroumal/images/6/65/Chasseur.webp/revision/latest?cb=20250907102405&path-prefix=fr"),
    ("Chevalier_Epee_Rouille", "https://static.wikia.nocookie.net/loupgaroumal/images/3/31/Chevalier_%C3%A0_l%27%C3%89p%C3%A9e_Rouill%C3%A9e.webp/revision/latest?cb=20250907105126&path-prefix=fr"),
    ("Chien_Loup", "https://static.wikia.nocookie.net/loupgaroumal/images/3/3c/Chien-Loup.webp/revision/latest?cb=20250907110349&path-prefix=fr"),
    ("Comedien", "https://static.wikia.nocookie.net/loupgaroumal/images/9/9d/Com%C3%A9dien.webp/revision/latest?cb=20250907110419&path-prefix=fr"),
    ("Corbeau", "https://static.wikia.nocookie.net/loupgaroumal/images/b/b4/Corbeau.webp/revision/latest?cb=20250907103918&path-prefix=fr"),
    ("Cupidon", "https://static.wikia.nocookie.net/loupgaroumal/images/2/2f/Cupidon.webp/revision/latest?cb=20250907102554&path-prefix=fr"),
    ("Deux_Soeurs", "https://static.wikia.nocookie.net/loupgaroumal/images/2/25/Deux_S%C5%93urs.webp/revision/latest?cb=20250907110447&path-prefix=fr"),
    ("Enfant_Sauvage", "https://static.wikia.nocookie.net/loupgaroumal/images/b/bf/Enfant_Sauvage.webp/revision/latest?cb=20250907110607&path-prefix=fr"),
    ("Grand_Mechant_Loup", "https://static.wikia.nocookie.net/loupgaroumal/images/6/6c/Grand-M%C3%A9chant-Loup.webp/revision/latest?cb=20250907110630&path-prefix=fr"),
    ("Gitane", "https://static.wikia.nocookie.net/loupgaroumal/images/9/96/Gitane1.webp/revision/latest?cb=20250907110707&path-prefix=fr"),
    ("Idiot_Village", "https://static.wikia.nocookie.net/loupgaroumal/images/c/c6/Idiot_du_Village.webp/revision/latest?cb=20250907104018&path-prefix=fr"),
    ("Infect_Pere_Loups", "https://static.wikia.nocookie.net/loupgaroumal/images/a/ae/Infect_P%C3%A8re_des_Loups.webp/revision/latest?cb=20250907110746&path-prefix=fr"),
    ("Joueur_Flute", "https://static.wikia.nocookie.net/loupgaroumal/images/b/b5/Joueur_de_Fl%C3%BBte.webp/revision/latest?cb=20250907104055&path-prefix=fr"),
    ("Juge_Begue", "https://static.wikia.nocookie.net/loupgaroumal/images/8/8c/Juge_B%C3%A8gue.webp/revision/latest?cb=20250907110808&path-prefix=fr"),
    ("Lapin_Blanc", "https://static.wikia.nocookie.net/loupgaroumal/images/0/0b/Lapin-Blanc-1.webp/revision/latest?cb=20250907104116&path-prefix=fr"),
    ("Loup_Garou_Blanc", "https://static.wikia.nocookie.net/loupgaroumal/images/4/40/Loup-Garou_Blanc.webp/revision/latest?cb=20250907104142&path-prefix=fr"),
    ("Loup_Garou_Voyant", "https://static.wikia.nocookie.net/loupgaroumal/images/7/7d/Loup-Garou_Voyant.webp/revision/latest?cb=20250907104212&path-prefix=fr"),
    ("Marionnettiste", "https://static.wikia.nocookie.net/loupgaroumal/images/9/9d/Marionnettiste1.webp/revision/latest?cb=20250907104243&path-prefix=fr"),
    ("Montreur_Ours", "https://static.wikia.nocookie.net/loupgaroumal/images/b/ba/Montreur_d%27Ours.webp/revision/latest?cb=20250907110846&path-prefix=fr"),
    ("Necromancien", "https://static.wikia.nocookie.net/loupgaroumal/images/0/05/N%C3%A9cromancien.webp/revision/latest?cb=20250907110920&path-prefix=fr"),
    ("Noctambule", "https://static.wikia.nocookie.net/loupgaroumal/images/3/34/Noctambule1.webp/revision/latest?cb=20250907104315&path-prefix=fr"),
    ("Petite_Fille", "https://static.wikia.nocookie.net/loupgaroumal/images/4/4f/Petite_Fille.webp/revision/latest?cb=20250907102337&path-prefix=fr"),
    ("Pyromane", "https://static.wikia.nocookie.net/loupgaroumal/images/e/e4/Pyromane1.webp/revision/latest?cb=20250907104701&path-prefix=fr"),
    ("Renard", "https://static.wikia.nocookie.net/loupgaroumal/images/7/7c/Renard.webp/revision/latest?cb=20250907110946&path-prefix=fr"),
    ("Servante_Devouee", "https://static.wikia.nocookie.net/loupgaroumal/images/5/55/Servante_Devou%C3%A9e.webp/revision/latest?cb=20250907111007&path-prefix=fr"),
    ("Simple_Loup_Garou", "https://static.wikia.nocookie.net/loupgaroumal/images/0/0f/Simple_Loup-Garou.webp/revision/latest?cb=20250907102434&path-prefix=fr"),
    ("Simple_Villageois", "https://static.wikia.nocookie.net/loupgaroumal/images/6/67/Simple_Villaegois.webp/revision/latest?cb=20250907102312&path-prefix=fr"),
    ("Salvateur", "https://static.wikia.nocookie.net/loupgaroumal/images/4/4a/Salvateur1.webp/revision/latest?cb=20250907104623&path-prefix=fr"),
    ("Sorciere", "https://static.wikia.nocookie.net/loupgaroumal/images/7/71/Sorciere.webp/revision/latest?cb=20250907102239&path-prefix=fr"),
    ("Trois_Freres", "https://static.wikia.nocookie.net/loupgaroumal/images/4/4d/Trois_Fr%C3%A8res.webp/revision/latest?cb=20250907111109&path-prefix=fr"),
    ("Villageois_Villageois", "https://static.wikia.nocookie.net/loupgaroumal/images/6/67/Simple_Villaegois.webp/revision/latest?cb=20250907102312&path-prefix=fr"),
    ("Voleur", "https://static.wikia.nocookie.net/loupgaroumal/images/1/12/Voleur.webp/revision/latest?cb=20250907102116&path-prefix=fr"),
    ("Voyante", "https://static.wikia.nocookie.net/loupgaroumal/images/d/d5/Voyante.webp/revision/latest?cb=20250907102136&path-prefix=fr"),
]

# Créer le dossier cards s'il n'existe pas
cards_dir = os.path.dirname(os.path.abspath(__file__)) + "/cards"
os.makedirs(cards_dir, exist_ok=True)

print(f"📥 Téléchargement des cartes dans: {cards_dir}\n")

downloaded = 0
failed = 0

for name, url in images_data:
    try:
        # Télécharger l'image
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        # Sauvegarder en WebP
        filename = f"{name}.webp"
        filepath = os.path.join(cards_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(response.content)

        print(f"✓ {filename} ({len(response.content) / 1024:.1f} KB)")
        downloaded += 1

    except Exception as e:
        print(f"✗ {name}: {str(e)}")
        failed += 1

print(f"\n{'='*50}")
print(f"✓ Téléchargé: {downloaded}/{len(images_data)}")
if failed > 0:
    print(f"✗ Échoué: {failed}")
print(f"{'='*50}")
