/* Généré par build_missions.py — données des missions (Shadow Moses + VR). */
window.MGS_MISSIONS = [
 {
  "id": 1,
  "name": "Cargo Dock",
  "subtitle": "Tutoriel partie 1",
  "type": "sneak",
  "time": "30 min",
  "players": {
   "1": [
    "Snake"
   ]
  },
  "tiles": [
   "1A – Cargo Dock (tuile plateau)",
   "S – Elevator Shaft (cage d'ascenseur)",
   "E – Elevator (ascenseur, mis de côté au départ)"
  ],
  "guardDeck": "7 rouges + 10 bleues (tirées au hasard parmi les 20) ; bleues empilées au-dessus des rouges",
  "legend": {
   "startingArea": 1,
   "guards": 4,
   "cameras": 0,
   "events": [
    "A"
   ],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "obstacles": "oui (bloquent la LOS)",
   "guardPriorityToken": 1
  },
  "setup": [
   "Placer la tuile plateau 1A (Cargo Dock), la cage d'ascenseur (Elevator Shaft) à droite, et la tuile Ascenseur (Elevator) à côté, hors de la carte, avec un Garde dessus (il n'entre en jeu qu'avec l'Événement A).",
   "Placer le jeton Priorité des Gardes (Guard Priority) en haut à gauche de la carte.",
   "Placer le jeton Événement A (à droite de la caisse du bas, près de la cage d'ascenseur).",
   "Placer les Gardes en respectant leur orientation : 1 au centre regardant vers le bas, 1 à droite regardant vers le haut, 1 en bas regardant vers la gauche, + 1 sur la tuile Ascenseur regardant vers la gauche (4 au total).",
   "Placer Snake sur la zone de départ en haut à gauche.",
   "Tableau des Gardes : poser le Guard dashboard près de la carte.",
   "Paquet Ordres des Gardes : mélanger les 7 cartes rouges ; mélanger 10 des 20 cartes bleues (remettre les autres dans la boîte) ; empiler les bleues au-dessus des rouges.",
   "Paquet Réactions des Gardes : mélanger les 6 cartes Guard Reaction et les placer près du tableau des Gardes.",
   "Joueur : poser le dashboard de Snake, ses 4 jetons Action et son jeton Attention double face ; mettre tous les dés noirs et blancs et les jetons dégâts/KO/crâne dans une réserve."
  ],
  "objective": [
   "Faire une action Interagir (Interact) avec l'Ascenseur alors que votre jeton Alerte (!) n'est pas sur la carte."
  ],
  "optional": [],
  "special": [
   {
    "t": "Une seule zone",
    "d": "La bordure orange délimite la zone ; cette carte n'en a qu'une, donc tous les Gardes s'activent à chaque tour."
   },
   {
    "t": "Ascenseur absent",
    "d": "L'ascenseur n'est pas là au début : il faut déclencher l'Événement A pour le faire descendre."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Retirer le jeton A et placer la tuile Ascenseur sur la cage d'ascenseur, avec un Garde dessus comme sur le schéma (le Garde arrive avec l'ascenseur)."
   }
  ],
  "failure": [
   "Snake est tué (KIA).",
   "La carte Game Over est révélée (paquet d'Ordres des Gardes épuisé jusqu'à elle)."
  ],
  "cleared": [
   "Pas de carte Équipement : passer à la page suivante (Chapitre 2)."
  ],
  "boss": null,
  "briefing": "Snake s'infiltre seul dans la base de Shadow Moses par le quai de chargement. Le colonel Campbell lui explique que le seul moyen de remonter à la surface est l'ascenseur du fond, à condition de ne pas se faire repérer.",
  "tips": [
   "Marche sur le A le plus tôt possible : l'ascenseur ne descend qu'à ce moment, et un Garde en sort — prévois de ne pas être dans sa ligne de vue.",
   "L'objectif exige que ton jeton Alerte (!) ne soit pas sur la carte : si tu es repéré, éloigne-toi et attends que la situation se calme avant d'interagir avec l'ascenseur.",
   "Les caisses bloquent la ligne de vue : déplace-toi de couvert en couvert et observe l'orientation des Gardes.",
   "Un Garde de dos et adjacent peut être éliminé sans bruit (Silent Takedown, 2 actions) ; une attaque au corps à corps ratée déclenche l'alerte.",
   "Ne gaspille pas les tours : chaque tour ennemi consomme une carte d'Ordre, et la carte Game Over est dans le paquet rouge."
  ],
  "rulesNotes": [
   "Ordre d'un round : tous les joueurs jouent (dans l'ordre de leur choix, un joueur termine son tour avant le suivant), puis phase ennemie (on pioche et résout 1 carte Ordre des Gardes).",
   "4 jetons Action par tour. La plupart des actions coûtent 1 ; Combo Attack et Silent Takedown coûtent 2. On peut répéter une action en empilant les jetons sur la même case.",
   "Dashboard de Snake : 3 (bleu) / 3 (vert) / 4 (rouge) — d'après le tableau des Gardes (vert = défense 3, rouge = santé 2), probablement limite d'équipement 3, défense 3, santé 4.",
   "Gardes : attaquent avec 2 dés noirs, défense 3, santé 2.",
   "Actions : Sneak (1) = 1 case ; Dash (1) = 2 cases, bruyante ; Hand-to-Hand (1) = 1 dé blanc, dégâts KO ; Combo Attack (2) = 2 dés blancs + 1 noir, dégâts KO ; Silent Takedown (2) = derrière un Garde adjacent, le remplace par un jeton crâne ; Drag Body (1) = ramasser un jeton KO/crâne adjacent, bouger d'1 case et le reposer, bruyante ; Interact (1) = ascenseurs, portes verrouillées ; Knock (1) = attire l'attention sur sa case (jeton ? posé ou déplacé).",
   "Déplacement orthogonal uniquement ; deux figurines jamais sur la même case ; on saute par-dessus (leapfrog) les figurines adjacentes pour 1 seul déplacement.",
   "Événements : entrer sur un jeton Événement le résout immédiatement ; si c'est au milieu d'un Dash, on termine l'action ensuite.",
   "LOS ennemie : la figurine doit faire face à la ligne/colonne de la cible ET le rectangle entre les deux ne doit contenir aucun obstacle (mur, porte verrouillée).",
   "Jeton Attention : face ? (Investigate, le Garde le plus proche vient voir) / face ! (Alerted, tous les Gardes de la zone vous traquent). Être dans la LOS d'un Garde, même nouvellement apparu, pose le ! sous votre figurine.",
   "Dés blancs : tout résultat ! rolled attire l'attention sur votre case. Contrôle de bruit en fin de tour : si un Garde est dans votre zone, lancez 1 dé blanc par jeton Action placé sur une action bruyante.",
   "Attaquer : chaque dé ≥ défense de la cible = 1 dégât. Corps à corps sans arme = dégâts KO ; Garde KO remplacé par un jeton étoile côté 2 étoiles. Blesser sans KO/tuer avant la fin du tour = alerte.",
   "Carte Ordre des Gardes, section I : Waken Guard (chaque jeton KO côté 1★ est remplacé par un Garde, puis les jetons 2★ passent côté 1★), Radio-In (si moins de Gardes que la Guard Count de la caserne, en faire apparaître), Lost Contact (pour chaque 3 crânes sur la carte, défausser la carte du dessus sous le paquet), Stay Alert (joueurs à 2 cases d'un Garde sans obstacle reçoivent un ?).",
   "Section II : Caméras (ignorée sans caméra). Section III : activation des Gardes, zone la plus proche du jeton Priorité d'abord, de haut en bas puis de gauche à droite.",
   "Modes de Garde : Alerte (un ! dans la zone → fonce vers le ! avec le chiffre ROUGE), Investigation (le plus proche d'un ?, ou KO/crâne en vue → chiffre BLEU), Patrouille (avance tout droit du chiffre BLEU, tourne sur les flèches >, cherche un nouveau chemin aux icônes ↺).",
   "Un Garde termine son mouvement après une attaque, une Réaction de Garde, ou s'il ne peut plus avancer. Il attaque le joueur le plus proche dans sa LOS (2 dés noirs). Sur un jeton Attention/KO/crâne : piocher une carte Guard Reaction.",
   "Plus court chemin = moins de cases, puis moins de virages ; à égalité les joueurs choisissent.",
   "Si la carte Game Over est révélée, la partie s'arrête immédiatement (échec). On peut recommencer un stage à tout moment."
  ],
  "pages": {
   "text": [
    4,
    5,
    6,
    7,
    8,
    9
   ],
   "map": 4
  },
  "images": [
   "guide/maps/s01.jpg"
  ]
 },
 {
  "id": 2,
  "name": "Heliport",
  "subtitle": "Tutoriel partie 2",
  "type": "sneak",
  "time": "45 min",
  "players": {
   "1": [
    "Snake"
   ]
  },
  "tiles": [
   "Heliport A (1B)",
   "Heliport B (2B)",
   "Heliport C (3B)",
   "Heliport D (4B)"
  ],
  "guardDeck": "7 rouges + 13 bleues",
  "legend": {
   "startingArea": 1,
   "guards": 4,
   "cameras": 3,
   "events": [
    "A",
    "B"
   ],
   "exits": 2,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "obstacles": "oui (bloquent la LOS)",
   "guardPriorityToken": 1,
   "cameraFacingToken": "1 (face verte visible)"
  },
  "setup": [
   "Assembler les 4 tuiles Heliport (disposition 2x2 : 2B en haut à gauche, 1B en haut à droite, 3B en bas à gauche, 4B en bas à droite d'après le schéma).",
   "Placer le jeton Priorité des Gardes en haut à gauche et le jeton d'Orientation des Caméras (Camera Facing) face verte visible.",
   "Placer les 3 Caméras (bord vert/orange orienté comme sur le schéma), les 4 Gardes (avec leur orientation), les jetons Événement A (près du bâtiment central, en haut) et B (à gauche), et les 2 Exits (en haut, près de l'entrée de l'installation).",
   "Placer Snake sur la zone de départ en bas, au centre.",
   "Tableau des Gardes : 7 cartes rouges + 13 bleues (bleues au-dessus), paquet de 6 Réactions mélangé.",
   "Préparer Snake (dashboard, 4 Actions, Attention) et ses 4 jetons Focus."
  ],
  "objective": [
   "Dans l'ordre : 1) atteindre l'Événement A ; 2) atteindre une Exit (terminer son tour sur la case Exit)."
  ],
  "optional": [
   "Atteindre l'Événement B."
  ],
  "special": [
   {
    "t": "Caméras",
    "d": "Une caméra qui voit un joueur, un jeton KO ou un crâne dans sa LOS alerte ou attire les Gardes. Elle ne regarde que dans une direction : la couleur de son cône (vert/orange) correspond à la face visible du jeton Camera Facing."
   },
   {
    "t": "Rotation des caméras",
    "d": "La section II de chaque carte Ordre indique s'il faut retourner le jeton Camera Facing ce tour-ci, ce qui change la direction de toutes les caméras. Revérifier la LOS de toutes les caméras après chaque retournement."
   },
   {
    "t": "Exits",
    "d": "Il suffit de finir son tour sur une case Exit pour remplir la condition."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "En entrant sur la case, placer le jeton A à côté de votre dashboard (objectif 1 accompli)."
   },
   {
    "k": "B",
    "d": "En entrant sur la case, placer le jeton B à côté de votre dashboard (objectif optionnel). FAQ : la caméra voit toujours la case B, vous serez forcément repéré en y allant."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "Snake est tué (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #001 (chercher le n° au dos, sans regarder les autres cartes).",
   "Débloque la carte Équipement #002.",
   "Si l'objectif optionnel B est rempli : débloque la carte Équipement #003.",
   "Ranger les cartes débloquées dans la Memory Box en fin de session."
  ],
  "boss": null,
  "briefing": "Snake arrive devant l'installation d'élimination, à l'héliport, pendant qu'une diversion aérienne attire l'attention des terroristes. Un hélicoptère de combat russe est posé là. Mei Ling lui présente le système de Focus ; il doit entrer dans le bâtiment pour retrouver le chef du DARPA.",
  "tips": [
   "Observe l'icône de caméra sur la carte d'Ordre révélée : anticipe le retournement des caméras avant de traverser leur champ.",
   "B est un bonus (carte #003) mais la caméra le surveille en permanence : n'y va que si tu peux encaisser une alerte, ou reviens plus tard mieux équipé.",
   "Après A, les deux Exits sont tout près ; reste hors de la LOS du Garde du couloir du haut.",
   "Garde tes jetons Focus (relance, +2, -2) pour les jets critiques : ils se réactivent avec l'action Focus (coût indiqué au verso).",
   "Rappel : tu n'as aucune arme au départ (seulement les jumelles) — évite le combat."
  ],
  "rulesNotes": [
   "Jetons Focus : utilisables gratuitement en les retournant (face grise). Ceux qui modifient les dés servent à vos jets ou aux jets ennemis qui vous visent ; ceux qui déplacent ne s'utilisent que pendant votre tour. Action Focus (X actions) : payer le coût imprimé au verso pour en réactiver un.",
   "Focus de Snake : Relancer un dé ; +2 à un dé ; -2 à un dé ; -1 dé blanc au jet OU se déplacer d'1 case.",
   "Le symbole ! n'est pas un chiffre : les +/- ne le modifient pas, mais une relance le peut.",
   "Codec : un numéro Codec sur un composant renvoie au livre Codec pour des infos/secrets.",
   "Memory Box : toutes les cartes Équipement débloquées y sont stockées et réutilisables dans toutes les missions suivantes (on ne les perd jamais, même si défaussées pendant un stage).",
   "Limite d'équipement : au début de chaque stage, choisir jusqu'à 3 cartes Équipement ; impossible de changer avant le stage suivant.",
   "Tir : action Shoot de l'arme (1 action), cible dans votre LOS ; chaque dé ≥ défense = 1 dégât ; tuer un Garde le remplace par un crâne. Le tir est bruyant et alerte les Gardes de la zone.",
   "LOS des joueurs : comme celle des Gardes, mais les joueurs regardent dans toutes les directions.",
   "À partir d'ici, les stages acceptent plus de personnages (roster sous le nombre de joueurs) : 1 = Snake, 2 = +Meryl, 3 = +Gray Fox (Ninja), 4 = +Otacon. Le livre VR Missions propose des missions autonomes (60-120 min) qui débloquent aussi de l'équipement."
  ],
  "pages": {
   "text": [
    12,
    14,
    15,
    17
   ],
   "map": 12
  },
  "images": [
   "guide/maps/s02.jpg"
  ]
 },
 {
  "id": 3,
  "name": "Holding Cells",
  "subtitle": "Évasion des cellules",
  "type": "sneak",
  "time": "45 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Holding Cells (5A)",
   "Armory (6A)",
   "2 Elevator Shafts (S)",
   "Elevator (E)",
   "Barracks (B)"
  ],
  "guardDeck": "7 rouges + 13 bleues",
  "legend": {
   "startingArea": "Snake + Meryl (dans les cellules)",
   "guards": 6,
   "cameras": 0,
   "events": [
    "A",
    "B",
    "C"
   ],
   "exits": 1,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "alertTokens": 2,
   "obstacles": "oui (bloquent la LOS)",
   "guardPriorityToken": 1
  },
  "setup": [
   "Zone du haut (Holding Cells 5A) : cage d'ascenseur (S) à gauche, caserne (Barracks, Guard Count 3) en dessous ; Snake et Meryl dans les cellules centrales ; 3 Gardes en bas du couloir central regardant vers le haut ; Événements B et A dans le couloir du bas.",
   "Zone du bas (Armory 6A) : cage d'ascenseur (S) au-dessus ; 3 Gardes (au centre-gauche regardant à droite, à droite regardant vers le haut, en bas regardant à gauche) ; Événement C dans la cellule de gauche ; Exit en bas à droite.",
   "Placer le jeton Priorité des Gardes en haut à gauche.",
   "Placer le jeton Alerte (!) de chaque joueur sous sa figurine (on commence repéré !).",
   "Placer l'Ascenseur sur la cage d'ascenseur de la zone de départ (Holding Cells).",
   "Tableau des Gardes : 7 rouges + 13 bleues, paquet Réactions mélangé.",
   "Si Meryl joue : dashboard, jetons Action/Focus/Attention, cartes d'équipement de départ (Handgun .50 Cal + Light Assault Rifle avec ses jetons munitions), carte Disguise Reference et figurine Meryl déguisée à côté."
  ],
  "objective": [
   "Vaincre 12 Gardes dans les Holding Cells",
   "OU atteindre C, puis atteindre l'Exit."
  ],
  "optional": [],
  "special": [
   {
    "t": "Zones multiples",
    "d": "Chaque zone a une bordure orange ; cages d'ascenseur, ascenseur et caserne font partie de la zone à laquelle ils sont reliés. Une zone est active s'il y a une figurine joueur ou un jeton ! de joueur."
   },
   {
    "t": "Renforts",
    "d": "Tant que la zone Holding Cells est active, résoudre un Radio-In supplémentaire dans cette zone avant de résoudre la carte Ordre."
   },
   {
    "t": "Vaincre les Gardes",
    "d": "Quand vous devriez poser un jeton KO ou crâne dans les Holding Cells, posez à la place 1 jeton compteur (vert ?) sur le tableau des Gardes : ils comptent pour l'objectif des 12."
   },
   {
    "t": "Ascenseur",
    "d": "Interact sur la case de l'Ascenseur : il se déplace, avec toutes les figurines dedans, vers n'importe quelle autre cage. Interact sur une cage d'ascenseur pour l'appeler."
   },
   {
    "t": "Seul (1 joueur)",
    "d": "Tous les Gardes des Holding Cells n'ont qu'1 santé."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Retirer le jeton. Lire la Cutscene 3A (page 27 du livre)."
   },
   {
    "k": "B",
    "d": "Retirer le jeton. Lire la Cutscene 3B (page 28 du livre)."
   },
   {
    "k": "C",
    "d": "Placer le jeton C sur votre dashboard (n'importe quel joueur peut ensuite atteindre l'Exit)."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "Un joueur est tué (KIA)."
  ],
  "cleared": [
   "Si 12+ Gardes vaincus : débloque la carte Équipement #004.",
   "Si l'Événement C a été atteint : débloque la carte Équipement #005.",
   "Aller à la page 29 du livre."
  ],
  "boss": null,
  "briefing": "Après la mort mystérieuse du chef du DARPA dans sa cellule, Snake est piégé dans le bloc de détention, et l'alarme sonne. Il rencontre Meryl, une recrue qui a résisté aux terroristes. Campbell est formel : il faut sortir de là par tous les moyens.",
  "tips": [
   "Vous commencez en alerte : soit vous combattez les vagues de Gardes (renforts à chaque tour), soit vous fuyez par l'ascenseur vers l'Armurerie pour chercher C puis l'Exit.",
   "En solo, les Gardes des cellules n'ont qu'1 santé : l'option 12 Gardes est plus jouable, même au corps à corps.",
   "Tenter les deux objectifs rapporte deux cartes (#004 et #005) mais le stage se termine dès que 12 Gardes sont vaincus (FAQ).",
   "Quitter la zone des Holding Cells (et y laisser aucun !) coupe les renforts supplémentaires.",
   "Meryl peut se déguiser (2 actions, adjacente à un jeton KO/crâne et sans ! sur la carte) pour passer devant les Gardes, mais une action autre que Sneak/Dash/Focus dans leur LOS la démasque."
  ],
  "rulesNotes": [
   "Meryl est jouable à partir de ce stage. Équipement de départ : Handgun (.50 Cal) et Light Assault Rifle (jetons munitions selon l'icône en haut à droite de la carte). Les cartes de départ peuvent être remplacées par celles de la Memory Box, dans la limite d'équipement.",
   "Meryl a 2 capacités spéciales en bas de son dashboard ; elle remplace Silent Takedown par Gain Disguise (2 actions).",
   "Focus de Meryl : +2 au résultat d'1 dé ; +/-1 au résultat d'1 dé ; gagner 1 action supplémentaire ce tour ; lancer +1 dé blanc (avant ou après le jet).",
   "Déguisée (carte Disguise Reference, lecture difficile) : Gardes et caméras la traitent comme un Garde (ils peuvent la sauter). Elle reprend sa vraie figurine si son ! est posé, si elle attire l'attention dans la LOS d'un Garde/caméra, ou si elle fait une action autre que Sneak, Dash ou Focus dans leur LOS. « Une femme garde ? » : dans la LOS d'un Garde adjacent, lancer 2 dés blancs ; sur un ! elle attire l'attention.",
   "Défense de Meryl : 3 (exemple des règles)."
  ],
  "pages": {
   "text": [
    25,
    27,
    28
   ],
   "map": 26
  },
  "images": [
   "guide/maps/s03.jpg"
  ]
 },
 {
  "id": 4,
  "name": "Revolver Ocelot",
  "subtitle": "Combat de boss",
  "type": "boss",
  "time": "30 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Ocelot Stage (13A)"
  ],
  "guardDeck": null,
  "legend": {
   "startingArea": "Snake + Meryl (en bas, au centre)",
   "boss": "Ocelot (en haut à gauche)",
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": "fils piégés (lignes jaunes pointillées : infranchissables, ne bloquent pas la LOS)",
   "terminals": 0,
   "lockedDoors": 0,
   "obstacles": 4,
   "kennethBaker": "centre de la carte"
  },
  "setup": [
   "Placer la tuile Ocelot Stage (13A).",
   "Placer le dashboard de Boss d'Ocelot sur la table et sa figurine sur la carte (en haut, côté gauche, orientée vers le haut).",
   "Placer la carte Boss Stage Reference sur la partie surlignée du dashboard de chaque joueur (elle masque les actions inutilisées en stage de boss).",
   "Mettre de côté la carte RELOAD d'Ocelot face cachée. Tirer 4 cartes Boss Ocelot au hasard (remettre les 2 inutilisées dans la boîte), puis placer RELOAD face cachée sous ces 4 cartes : c'est le paquet de Boss.",
   "Placer Snake (et Meryl) sur la zone de départ en bas au centre.",
   "Pas de tableau des Gardes, ni de paquets de Gardes, ni de figurines de Gardes."
  ],
  "objective": [
   "Vaincre Revolver Ocelot (1 joueur : 12 santé ; 2 joueurs : 20 santé)."
  ],
  "optional": [],
  "special": [
   {
    "t": "Fils piégés (Trip Wires)",
    "d": "Les joueurs ne peuvent pas traverser les lignes jaunes pointillées. Elles ne bloquent pas la LOS : on peut tirer à travers."
   },
   {
    "t": "Tirer à travers la zone des fils",
    "d": "Chaque fois qu'un joueur tire à travers les fils, chaque ! obtenu inflige 1 dégât à Kenneth Baker (poser un jeton dégât au centre de la carte). À 3 dégâts ou plus, la mission échoue."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué (KIA).",
   "Kenneth Baker subit 3 dégâts ou plus."
  ],
  "cleared": [
   "Débloque la carte Équipement #006.",
   "Aller à la page 35 du livre."
  ],
  "boss": {
   "name": "Revolver Ocelot",
   "health": "1j : 12 / 2j : 20",
   "defense": "4",
   "notes": [
    "Chaque round : les joueurs jouent, puis le Boss révèle et résout la carte du dessus de son paquet, qui retourne ensuite sous le paquet. Le paquet n'est jamais mélangé.",
    "Paquet : 4 cartes Boss aléatoires + RELOAD en dessous (Ocelot recharge après ses 4 actions).",
    "Errata : la capacité RELOAD est une Réaction (icône de réaction).",
    "Les Réactions d'un Boss se déclenchent à chaque fois que leur condition est remplie, immédiatement (FAQ).",
    "Si une carte dit qu'il attaque sans préciser le nombre de dés, utiliser la stat d'attaque de son dashboard.",
    "Les dégâts KO lui sont infligés comme des dégâts normaux.",
    "Quand il s'éloigne du joueur actif, il choisit le chemin qui maximise la distance, ce qui peut parfois le rapprocher (FAQ).",
    "Capacités spéciales détaillées sur son dashboard (non lisibles sur cette page)."
   ]
  },
  "briefing": "Snake retrouve Kenneth Baker, président d'ArmsTech, ligoté et piégé au centre d'une salle. Revolver Ocelot, membre de FOXHOUND et virtuose du revolver, le provoque en duel.",
  "tips": [
   "Évite de tirer à travers la zone des fils autour de Baker : chaque ! peut le blesser, et 3 dégâts = échec. Contourne pour avoir une LOS propre.",
   "Utilise les 4 obstacles comme couverture : Ocelot a besoin d'une LOS pour te toucher.",
   "Ocelot doit recharger quand RELOAD sort (5e carte) : c'est le moment de s'exposer pour tirer.",
   "La défense d'Ocelot est de 4 : utilise les jetons Focus +2 (Snake/Meryl) pour transformer des 2-3 en touches.",
   "À 2 joueurs, prenez-le en tenaille pour qu'il ne puisse pas s'éloigner des deux à la fois."
  ],
  "rulesNotes": [
   "Stages de Boss : pas de Gardes ; dashboard, paquet et figurine propres au boss. Lire attentivement la mise en place et le dashboard du boss.",
   "Infliger des dégâts à un boss avec une arme à distance fonctionne comme sur un Garde : tant qu'il est en LOS, chaque dé ≥ sa défense = 1 dégât (jetons posés sur le dashboard du boss).",
   "La santé du boss dépend du nombre de joueurs.",
   "Pas de carte Game Over listée pour ce stage."
  ],
  "pages": {
   "text": [
    33,
    34
   ],
   "map": 34
  },
  "images": [
   "guide/maps/s04.jpg"
  ]
 },
 {
  "id": 5,
  "name": "Tank Ambush",
  "subtitle": "Combat de boss (Tank)",
  "type": "boss",
  "time": "30 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Snow Field A (7A)",
   "Snow Field B (8A)"
  ],
  "guardDeck": null,
  "legend": {
   "startingArea": "Snake + Meryl (moitié basse, au centre)",
   "boss": "Tank (grand socle au centre de la carte)",
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0
  },
  "setup": [
   "Assembler Snow Field A (7A) en haut et Snow Field B (8A) en bas.",
   "Placer le Tank au centre de la carte et les joueurs sur la zone de départ en dessous.",
   "Mélanger le paquet de Boss du Tank.",
   "Placer la carte Special Action « Grenades » sur la partie surlignée du dashboard de chaque joueur, avec 2 jetons Grenade sur chaque carte.",
   "Placer le dashboard du Tank à côté de la carte (santé/défense indiquées dessus)."
  ],
  "objective": [
   "Détruire le Tank."
  ],
  "optional": [],
  "special": [
   {
    "t": "Grenades",
    "d": "Chaque joueur dispose de la carte Special Action Grenades avec 2 jetons Grenade (texte de la carte illisible sur le scan : consulter la carte)."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #007.",
   "Aller à la page 48 du livre."
  ],
  "boss": {
   "name": "Tank (M1, piloté par Vulcan Raven)",
   "health": "voir dashboard du Tank (non indiqué sur la page)",
   "defense": "voir dashboard du Tank",
   "notes": [
    "Le paquet de Boss du Tank est mélangé au départ puis jamais remélangé ; une carte résolue retourne sous le paquet.",
    "Capacités et stats sur le dashboard du Tank (non reproduites dans le livre).",
    "La carte Grenades remplace la Boss Stage Reference standard sur les dashboards."
   ]
  },
  "briefing": "En traversant le champ de neige, Snake tombe dans une embuscade : un char d'assaut lui barre la route et ouvre le feu. Son pilote, un colosse de FOXHOUND, le défie de combattre.",
  "tips": [
   "Le terrain est presque vide : la mobilité est ta seule protection, ne reste pas aligné avec le canon.",
   "Tu n'as que 2 grenades par joueur : garde-les pour les moments où le Tank est à portée et vulnérable.",
   "Lis le dashboard du Tank avant de commencer pour connaître sa défense et ses réactions.",
   "À 2 joueurs, séparez-vous pour diviser son attention."
  ],
  "rulesNotes": [
   "Pas de carte Game Over listée pour ce stage.",
   "Les petits éléments verts visibles sur la carte semblent faire partie du décor (absents de la légende)."
  ],
  "pages": {
   "text": [
    47
   ],
   "map": 47
  },
  "images": [
   "guide/maps/s05.jpg"
  ]
 },
 {
  "id": 6,
  "name": "Nuclear Warhead Storage",
  "subtitle": "Bâtiment de stockage des ogives nucléaires (Nuclear Warhead Storage Building) – Chapitre 6",
  "type": "sneak",
  "time": "60 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Nuke Building L1 (11A)",
   "Nuke Building Truck (15A)",
   "Nuke Building B1 (9A)",
   "Nuke Building B2 (10A)",
   "3 Elevator Shafts (S)",
   "Elevator (E)",
   "Barracks (B)"
  ],
  "guardDeck": "7 rouges + 18 bleues",
  "legend": {
   "guards": 6,
   "cameras": 0,
   "events": [
    "A",
    "B",
    "C"
   ],
   "exits": 1,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "obstacles": "Obstacles (bloquent la LOS) : caisses/ogives",
   "startingArea": "Bas de Nuke Building L1 (Snake + Meryl)"
  },
  "setup": [
   "Assembler les tuiles selon le schéma : B2 (10A) en haut à gauche et B1 (9A) en haut à droite, chacune avec un Elevator Shaft (S) au nord ; en dessous, Nuke Building Truck (15A) avec la Barracks (B) et l'Elevator (E), puis Nuke Building L1 (11A) tout en bas.",
   "Paquet d'ordres des gardes : 7 cartes rouges + 18 cartes bleues.",
   "Placer 6 gardes selon la carte : 3 sur B1, 3 sur Truck/L1 (orientations indiquées par les flèches).",
   "Placer les jetons Event A (B2, couloir central), B (B1, coin sud-ouest) et C (B2, côté ouest) ainsi que la sortie (EXIT) dans le coin sud-est de B2.",
   "Les joueurs démarrent dans la zone de départ en bas de Nuke Building L1."
  ],
  "objective": [
   "Dans l'ordre : 1) Détruire le tableau électrique (Switchboard) de Nuke Building B2 en faisant entrer un missile (Nikita) dans sa case.",
   "2) Un joueur atteint la sortie (Exit) de Nuke Building B2."
  ],
  "optional": [
   "Ramasser l'Event C (B2) et le garder sur son dashboard : débloque la carte Équipement #010."
  ],
  "special": [
   {
    "t": "Zone interdite au tir (No Fire Zone)",
    "d": "Aucune arme à distance ni explosif ne peut être utilisé par les joueurs sur Nuke Building L1 et Nuke Building Truck."
   },
   {
    "t": "Ascenseur (Elevator)",
    "d": "Action Interact sur la case Elevator : déplacer la tuile Elevator et toutes les figurines dedans vers n'importe quelle autre tuile Elevator Shaft. Une action Interact sur un Elevator Shaft appelle l'ascenseur."
   },
   {
    "t": "Sol électrifié (Event A)",
    "d": "Dès l'Event A (y compris immédiatement) : un joueur qui entre sur une case de sol électrifié subit 2 dégâts et recule sur la case non électrifiée la plus proche. Actif tant que le Switchboard de B2 n'est pas détruit."
   },
   {
    "t": "Gaz toxique (Event A)",
    "d": "Nuke Building B2 est rempli de gaz. Les zones à bordure jaune sont sûres. Si Snake ou Meryl finit son tour sur B2 hors d'une zone à bordure jaune, il/elle meurt et la mission échoue."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Retirer A de la carte. Active les règles Sol électrifié et Gaz toxique (Campbell conseille de détruire le tableau électrique sur le mur nord-ouest avec un missile téléguidé)."
   },
   {
    "k": "B",
    "d": "Retirer B de la carte et prendre la carte Action Spéciale Nikita (missile téléguidé)."
   },
   {
    "k": "C",
    "d": "Retirer C et le placer sur son dashboard (bonus de fin : Équipement #010)."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "Un joueur est tué (KIA).",
   "Snake ou Meryl termine son tour sur B2 hors d'une zone jaune après l'Event A (gaz)."
  ],
  "cleared": [
   "Débloque la carte Équipement #009",
   "Si un joueur a C sur son dashboard : débloque la carte Équipement #010",
   "Aller à la page 53"
  ],
  "boss": null,
  "rulesNotes": [
   "Nikita (carte Action Spéciale, obtenue via l'Event B en B1) : seul le joueur qui l'a ramassée peut l'utiliser.",
   "Le missile Nikita ne se déplace que lorsqu'on dépense une action pour le guider ; sinon il reste en place, et le joueur peut faire d'autres actions pendant qu'il est sur la carte.",
   "Missiles, armes à feu et grenades sont des actions BRUYANTES (LOUD) : placer son jeton Attention sous sa figurine après usage.",
   "Ascenseur : le jeton Attention d'un joueur suit l'ascenseur s'il est dans la cabine (FAQ)."
  ],
  "errata": [
   "Les GARDES peuvent utiliser des armes à distance sur L1 et Truck ; seuls les joueurs ne le peuvent pas.",
   "Seule la personne qui a ramassé le Nikita (en B1) peut l'utiliser.",
   "Un missile Nikita reste en place si on ne dépense pas d'action pour le guider.",
   "Nuke Building B1 : les murs saillants dessinés ne bloquent pas la LOS si la case est traversable."
  ],
  "briefing": "Snake doit traverser le bâtiment de stockage des ogives nucléaires, où toute arme est proscrite : un tir pourrait percer une ogive. Au sous-sol B2, gaz toxique et sol électrifié bloquent le passage ; il faut récupérer un lance-missiles Nikita en B1 et guider un missile jusqu'au tableau électrique.",
  "tips": [
   "Sur L1 et Truck vous ne pouvez pas tirer mais les gardes oui : progressez en furtivité, utilisez les ogives (obstacles) pour couper la LOS.",
   "Itinéraire type : L1 → ascenseur → B1 pour l'Event B (Nikita) → ascenseur → B2. Ne marchez sur l'Event A que lorsque le porteur du Nikita est prêt.",
   "Après l'Event A, restez dans les zones à bordure jaune de B2 en fin de tour et guidez le missile case par case jusqu'au Switchboard (mur nord-ouest).",
   "Le missile ne bouge que si vous dépensez des actions : vous pouvez le laisser en attente pour gérer un garde puis reprendre le guidage.",
   "Ramassez C sur B2 avant de sortir pour l'équipement bonus #010."
  ],
  "pages": {
   "text": [
    51
   ],
   "map": 52
  },
  "images": [
   "guide/maps/s06.jpg"
  ]
 },
 {
  "id": 7,
  "name": "Cyborg Ninja",
  "subtitle": "Combat contre le Ninja dans le laboratoire (Laboratory) – Chapitre 7",
  "type": "boss",
  "time": "60 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Laboratory (3A)"
  ],
  "guardDeck": null,
  "legend": {
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "boss": "Ninja (1 figurine)",
   "shadowTokens": 4,
   "numberedSpaces": "Repères numérotés 1 à 8 imprimés sur la carte",
   "obstacles": "Obstacles (bloquent la LOS) : paillasses/mobilier"
  },
  "setup": [
   "Placer la tuile Laboratory (3A).",
   "Placer la carte Boss Stage Reference (standard) sur la zone surlignée du dashboard de chaque joueur.",
   "Mélanger les 5 cartes Boss Cyborg Ninja pour former le paquet Boss.",
   "Réunir les 4 jetons Shadow pour cette mission.",
   "Placer le Ninja et les joueurs (Snake puis Meryl) selon la carte : Ninja près des repères 1-2 à l'ouest, joueurs juste en dessous."
  ],
  "objective": [
   "Vaincre le Cyborg Ninja."
  ],
  "optional": [],
  "special": [
   {
    "t": "Toujours sur ses gardes (Always on Guard)",
    "d": "Snake ne peut pas effectuer d'attaque surprise (Sneak Attack) contre le Cyborg Ninja."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #011",
   "Aller à la page 59"
  ],
  "boss": {
   "name": "Cyborg Ninja",
   "health": "Non indiqué dans le livre – voir le dashboard du Ninja",
   "defense": "Non indiqué dans le livre – voir le dashboard du Ninja",
   "notes": [
    "Paquet Boss de 5 cartes, jamais remélangé : la carte résolue retourne sous le paquet (le cycle est prévisible).",
    "Utilise 4 jetons Shadow (effets décrits sur le dashboard/cartes Boss).",
    "Les repères 1 à 8 sur la carte servent vraisemblablement de positions de référence pour les cartes Boss (déplacements du Ninja / jetons Shadow).",
    "Immunisé aux Sneak Attacks de Snake."
   ]
  },
  "rulesNotes": [
   "Mission Boss : pas de dashboard Gardes, ni paquets Gardes, ni gardes. À la phase Ennemie, piocher et résoudre la carte du dessus du paquet Boss, puis la placer sous le paquet.",
   "La carte Boss Stage Reference recouvre les actions des joueurs inutilisées en mission Boss.",
   "Un Boss résout ses réactions à chaque fois que la condition est remplie (FAQ)."
  ],
  "errata": [],
  "briefing": "Dans le laboratoire d'Otacon, Snake découvre des gardes découpés à la lame : un ninja cybernétique invisible rôde. Le combat révèle qu'il s'agit de Gray Fox, ancien camarade de Snake supposé mort à Zanzibar et ramené à la vie par des expériences.",
  "tips": [
   "Pas de Sneak Attack possible : misez sur les attaques directes et le positionnement.",
   "Comptez les cartes Boss jouées : avec 5 cartes jamais remélangées, vous connaissez l'ordre après un cycle complet.",
   "Les obstacles en L bloquent la LOS : utilisez-les pour vous couvrir et forcer le Ninja à venir à vous.",
   "À 2 joueurs, restez à portée de soutien l'un de l'autre sans vous empiler dans la même zone."
  ],
  "pages": {
   "text": [
    58
   ],
   "map": 58
  },
  "images": [
   "guide/maps/s07.jpg"
  ]
 },
 {
  "id": 8,
  "name": "Psycho Mantis",
  "subtitle": "Combat contre Psycho Mantis dans le bureau du commandant (Commander's Room) – Chapitre 8",
  "type": "boss",
  "time": "45 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ]
  },
  "tiles": [
   "Commander's Room (12A)"
  ],
  "guardDeck": null,
  "legend": {
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "boss": "Mantis (1 figurine)",
   "impassable": "Lignes pointillées jaunes : infranchissables mais ne bloquent pas la LOS",
   "grid": "Coordonnées imprimées : colonnes 0-8, rangées 0-6"
  },
  "setup": [
   "Placer la tuile Commander's Room (12A).",
   "Placer la carte Boss Stage Reference (standard) sur la zone surlignée du dashboard de chaque joueur.",
   "Mélanger les 7 cartes Boss Psycho Mantis pour former le paquet Boss.",
   "Placer le marqueur de Menace (Threat) sur la case la plus haute de la piste Threat du dashboard de Psycho Mantis.",
   "Placer Mantis en colonne 4 / rangée 2 (devant le bureau), Meryl en (3,5) et Snake en (4,5)."
  ],
  "objective": [
   "Vaincre Psycho Mantis."
  ],
  "optional": [],
  "special": [
   {
    "t": "Mobilier de bureau (Office Furniture)",
    "d": "Les joueurs ne peuvent pas traverser les lignes pointillées jaunes. Elles ne bloquent pas la LOS : on peut tirer à travers."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #013",
   "Aller à la page 74"
  ],
  "boss": {
   "name": "Psycho Mantis",
   "health": "Illisible sur le scan (valeurs 1j/2j dans les cases rouges du dashboard) – voir le dashboard",
   "defense": "Une case verte « 12 » est visible sur l'illustration du dashboard (probablement une caractéristique défensive) – à vérifier sur le dashboard",
   "notes": [
    "Paquet Boss de 7 cartes, jamais remélangé.",
    "Piste de Menace (Threat) à 4 niveaux de couleur (bleu, jaune, orange, rouge) ; le marqueur commence tout en haut. Les effets de chaque niveau sont sur le dashboard (illisibles sur le scan).",
    "La grille de coordonnées 0-8 / 0-6 sert aux cartes Boss pour positionner Mantis."
   ]
  },
  "rulesNotes": [
   "Mission Boss : pas de gardes ; à la phase Ennemie, résoudre la carte du dessus du paquet Boss puis la placer dessous."
  ],
  "errata": [
   "Codec book : pendant le combat contre Psycho Mantis, toute référence à la fréquence 3.14 doit être lue 3.11 (FAQ 1.2)."
  ],
  "briefing": "Dans le bureau du commandant, Psycho Mantis, télépathe de FOXHOUND, lit dans les pensées et prétend prédire chaque mouvement de Snake. Il faut le vaincre pour apprendre le chemin vers la base souterraine de Metal Gear, cachée derrière une bibliothèque.",
  "tips": [
   "Les meubles à pointillés jaunes vous bloquent mais pas vos tirs : tirez par-dessus le bureau et les canapés.",
   "Surveillez la piste Threat : son niveau change le comportement de Mantis.",
   "Notez les coordonnées : les cartes Boss téléportent/placent Mantis via la grille, anticipez ses positions.",
   "Pensez à l'errata Codec (3.14 → 3.11) si le livre Codec est utilisé pendant le combat."
  ],
  "pages": {
   "text": [
    73
   ],
   "map": 73
  },
  "images": [
   "guide/maps/s08.jpg"
  ]
 },
 {
  "id": 9,
  "name": "Prison Break",
  "subtitle": "Évasion – Otacon et Gray Fox libèrent Snake et Meryl (Chapitre 9 – Breakout)",
  "type": "sneak",
  "time": "60 min",
  "players": {
   "1": [
    "Otacon"
   ],
   "2": [
    "Otacon",
    "Gray Fox"
   ]
  },
  "tiles": [
   "Interrogation Room (4A)",
   "Prison Cell (5B)",
   "Security Room (12B)",
   "3 Elevator Shafts (S)",
   "Elevator (E)",
   "Barracks (B) – figurée sur le schéma mais absente de la liste « Tiles used »"
  ],
  "guardDeck": {
   "1": "7 rouges + 16 bleues",
   "2": "7 rouges + 12 bleues"
  },
  "legend": {
   "guards": 9,
   "cameras": 0,
   "events": [
    "A"
   ],
   "exits": 0,
   "traps": 0,
   "terminals": 3,
   "terminalLevels": "1× niv. 2, 1× niv. 3, 1× niv. 4",
   "lockedDoors": 7,
   "lockedDoorLevels": "3× niv. 2, 3× niv. 3, 1× niv. 4",
   "objectives": 6,
   "snakeFigure": 1,
   "startingArea": "Security Room (12B), salle nord-ouest (Otacon + Gray Fox)",
   "obstacles": "Obstacles (bloquent la LOS)"
  },
  "setup": [
   "Assembler : Interrogation Room (4A) en haut à gauche avec Barracks (B) à l'ouest et un Elevator Shaft au nord ; Prison Cell (5B) en haut à droite avec un Elevator Shaft au nord ; Security Room (12B) en bas avec l'Elevator (E) au nord.",
   "Paquet d'ordres des gardes : 1 joueur = 7 rouges + 16 bleues ; 2 joueurs = 7 rouges + 12 bleues.",
   "Placer 9 gardes (3 par grande tuile), 7 portes verrouillées, 3 Terminaux et l'Event A comme indiqué.",
   "Mélanger 6 jetons Objectif « ? » (5 croix ✗ et 1 coche ✓) et les placer au hasard, face cachée, sur les 6 emplacements de la Prison Cell.",
   "Mélanger le paquet System standard et le placer face cachée près du dashboard d'Otacon.",
   "Placer la figurine de Snake comme indiqué (cellule sud de l'Interrogation Room, derrière la porte niveau 4).",
   "Placer la figurine de Meryl à côté de la carte.",
   "Otacon (et Gray Fox) démarrent dans la zone de départ de la Security Room."
  ],
  "objective": [
   "Dans n'importe quel ordre :",
   "Libérer Snake : déverrouiller la porte de la cellule de Snake (porte niveau 4).",
   "Libérer Meryl : déverrouiller la porte de la cellule de Meryl."
  ],
  "optional": [
   "Garder l'Event A (Ketchup) sur son dashboard jusqu'à la fin : débloque la carte Équipement #015."
  ],
  "special": [
   {
    "t": "Objectifs « ? »",
    "d": "Quand un joueur obtient la LOS sur un jeton « ? », il le retourne. Si c'est la coche ✓, remplacer le jeton par la figurine de Meryl ; sinon défausser le jeton."
   },
   {
    "t": "Ascenseur (Elevator)",
    "d": "Action Interact sur la case Elevator : déplacer la tuile Elevator et toutes les figurines dedans vers une autre tuile Elevator Shaft. Interact sur un Elevator Shaft appelle l'ascenseur."
   },
   {
    "t": "Portes verrouillées (Locked Doors)",
    "d": "Action Interact + lancer la combinaison de dés indiquée ; on peut répéter l'action pour relancer n'importe quels dés. Quand les dés correspondent, défausser le jeton. Niveaux 2 à 5 ; tout doit être réussi dans le même tour, sinon la progression est perdue (idem si le joueur s'éloigne)."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Ketchup : retirer A et le placer sur le dashboard du joueur. Il peut défausser A depuis la case adjacente à la porte niveau 4 pour valider l'objectif « Libérer Snake » sans crocheter la porte."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "Un joueur est tué (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #016",
   "Si un joueur a encore A sur son dashboard (non défaussé) : débloque la carte Équipement #015",
   "Aller à la page 98"
  ],
  "boss": null,
  "rulesNotes": [
   "GRAY FOX – Équipement de départ : Stealth Camouflage, High-Frequency Blade, Arm Cannon.",
   "GRAY FOX – Possède la plupart des actions de Snake et Meryl, plus des capacités uniques.",
   "GRAY FOX – « Hurry, Get Away! » : une fois par round, quand une figurine adjacente est attaquée, il peut devenir la cible à sa place.",
   "GRAY FOX – Cornered Fox : chaque fois qu'il subit des dégâts, il peut placer un jeton (icône engrenage orange, vraisemblablement un jeton Charge) sur une de ses pièces d'équipement.",
   "GRAY FOX – « I'm Losing Myself » : il ne peut pas effectuer d'actions Focus tant que son jeton Attention (côté Alerte « ! ») est dans sa zone.",
   "GRAY FOX – Focus : +2 au résultat d'un dé ; +/-2 au résultat d'un dé ; lancer 1 dé noir de moins ; +2 cases de déplacement lors d'un Dash.",
   "OTACON – Équipement de départ : ADV. Stealth Camouflage et Rations.",
   "OTACON – I'm No Soldier : ne peut pas utiliser d'armes. Seul personnage capable de pirater les Terminaux et d'utiliser les cartes System.",
   "OTACON – Codec Call : peut utiliser ses jetons Focus pour modifier ou relancer les dés noirs lancés par un autre joueur (y compris son Focus +1 dé noir).",
   "OTACON – Hacker : en piratant un Terminal ou en accédant à une carte System, peut lancer jusqu'à +2 dés blancs.",
   "OTACON – Hack Terminal (1 action) : pirater un Terminal sur sa case ou adjacent en lançant 4 dés noirs (+ bonus). Peut répéter l'action pour relancer n'importe quels dés. Quand la combinaison du Terminal est obtenue, retourner le Terminal sur sa face piratée. Niveaux 2 à 5 ; doit être réussi dans le même tour (progression perdue s'il s'éloigne ou si son tour finit).",
   "OTACON – System Search (1 action) : sur/adjacent à un Terminal piraté, piocher 1 carte System. Maximum 3 cartes System ; en piochant une 4e, en remettre 1 au-dessus ou en dessous du paquet.",
   "OTACON – Access Systems (1 action) : sur/adjacent à un Terminal piraté avec au moins 1 carte System face visible, lancer jusqu'à 4 dés noirs et placer chaque dé sur un emplacement vide de même valeur d'une carte System. Les dés restent d'un round à l'autre (on peut les reprendre pour les relancer). Total de dés noirs (posés + lancés) limité à 4, sauf bonus temporaires.",
   "OTACON – Quand tous les emplacements d'une carte System sont couverts, il peut résoudre un effet pendant son tour ou quand la condition de la carte est remplie ; l'effet doit être de niveau inférieur ou égal à celui du Terminal piraté où il se trouve/adjacent. Ensuite, retirer les dés et remettre la carte sous le paquet System.",
   "OTACON – Déconnexion : s'il s'éloigne du Terminal piraté (ou si un effet le déconnecte), tous les dés de toutes les cartes System sont défaussés et toutes les cartes System retournent au-dessus ou en dessous du paquet (au choix, dans n'importe quel ordre).",
   "OTACON – Focus : +/-1 au résultat d'un dé ; relancer 1 dé noir ; +/-2 au résultat d'un dé ; lancer +1 dé noir (avant ou après le jet).",
   "Règle générale – Objets verrouillés : Interact + lancer la combinaison de dés ; relances possibles en répétant l'action ; niveaux 2 à 5 ; réussite obligatoire dans le même tour."
  ],
  "errata": [
   "Otacon : son action Interact coûte 1 action (le « X » imprimé est une erreur).",
   "Otacon peut utiliser ses Focus sur les dés noirs des coéquipiers via Codec Call, y compris le Focus +1 dé noir.",
   "Otacon n'a pas besoin de pirater de Terminal pour accéder aux cartes System de Boss (uniquement pertinent en mission Boss)."
  ],
  "briefing": "Snake a été capturé et torturé par Ocelot, Meryl est enfermée elle aussi. Otacon, invisible grâce à son camouflage, et Gray Fox s'infiltrent dans la zone de détention pour les libérer.",
  "tips": [
   "Otacon ne peut pas se battre : restez en camouflage, évitez les LOS et laissez Gray Fox gérer les gardes (« Hurry, Get Away! » pour encaisser à sa place).",
   "La porte de Snake est de niveau 4 (difficile) : l'Event A (Ketchup) permet de valider « Libérer Snake » sans la crocheter, mais le défausser fait perdre l'Équipement #015. À choisir selon votre aisance aux dés.",
   "Le Terminal niveau 4 de l'Interrogation Room permet de résoudre des effets System jusqu'au niveau 4 ; les Terminaux niv. 2/3 de la Security Room sont plus faciles à pirater pour commencer.",
   "Retournez les jetons « ? » à distance (il suffit d'avoir la LOS) pour trouver Meryl sans ouvrir chaque cellule.",
   "Les portes et Terminaux doivent être réussis dans le même tour : gardez assez d'actions pour relancer, et utilisez Codec Call d'Otacon sur les dés noirs de Gray Fox.",
   "Ne vous éloignez pas d'un Terminal piraté tant que des dés sont posés sur des cartes System : vous les perdriez tous."
  ],
  "pages": {
   "text": [
    95,
    96
   ],
   "map": 97
  },
  "images": [
   "guide/maps/s09.jpg"
  ]
 },
 {
  "id": 10,
  "name": "Helicopter Gunship",
  "subtitle": "Hind D",
  "type": "boss",
  "time": "35 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ],
   "3": [
    "Snake",
    "Meryl",
    "Gray Fox"
   ],
   "4": [
    "Snake",
    "Meryl",
    "Gray Fox",
    "Otacon"
   ]
  },
  "tiles": [
   "Comms Tower Roof (15B)",
   "Helicopter Gunship (14A)"
  ],
  "guardDeck": null,
  "legend": {
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "startingArea": "Snake, Meryl, Gray Fox (Otacon sur sa tuile Terminal)",
   "obstacles": "Obstacles bloquant la ligne de vue (caisses sur le Comms Tower Roof)",
   "tileCodes": [
    "14A",
    "15B"
   ]
  },
  "setup": [
   "Placer la carte Special Action « Surface-to-Air Missile Launcher » (S.A.M. Launcher) sur la zone surlignée du dashboard de chaque joueur.",
   "Placer le jeton Missile (bleu) près de la carte.",
   "Mélanger les 6 cartes Boss Helicopter Gunship pour former le deck Boss.",
   "Placer le marqueur de Menace (Threat) sur la case la plus à gauche de la piste de Menace de l'Helicopter Gunship.",
   "Placer Snake, Meryl et Gray Fox dans la zone de départ du Comms Tower Roof (en bas).",
   "4 joueurs (Otacon) : placer la carte Terminal Reference (Boss Stage Terminal) sur la zone surlignée du dashboard d'Otacon.",
   "Prendre la tuile Terminal d'Otacon, y placer sa figurine comme indiqué et mettre son jeton (?) sur la case la plus à gauche de la tuile Terminal.",
   "Utiliser le deck System « Helicopter Gunship » à la place du deck System standard d'Otacon.",
   "Prendre les 2 jetons Mur (Wall) et les placer à côté d'Otacon."
  ],
  "objective": [
   "Détruire l'Helicopter Gunship en réduisant ses points de vie à 0."
  ],
  "optional": [],
  "special": [
   {
    "t": "S.A.M. Launcher",
    "d": "Les joueurs attaquent l'hélicoptère avec l'action spéciale de la carte S.A.M. Launcher (lance-missiles sol-air) posée sur leur dashboard ; les actions masquées ne sont pas utilisées."
   },
   {
    "t": "Piste de Menace",
    "d": "La menace du Hind progresse sur sa piste (3 → 4 → 5 → 6 → …) : plus elle avance, plus ses attaques sont dangereuses. Lire le dashboard du boss."
   },
   {
    "t": "Murs d'Otacon",
    "d": "À 4 joueurs, Otacon peut déployer 2 jetons Mur via le deck System Helicopter Gunship pour créer des couverts."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué au combat (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #017",
   "Aller page 102 (cutscene)."
  ],
  "boss": {
   "name": "Helicopter Gunship (Hind D, piloté par Liquid Snake)",
   "health": "Selon le nombre de joueurs : voir le dashboard du boss (illisible sur le scan)",
   "defense": "Voir le dashboard du boss",
   "notes": [
    "Piste de Menace visible : 3 / 4 / 5 / 6 / dernière case violette.",
    "Le boss agit en piochant 1 carte de son deck de 6 cartes à chaque phase Ennemi ; la carte va ensuite sous le deck (jamais remélangé).",
    "La tuile Helicopter Gunship comporte des cases cibles numérotées et des flèches (bleue à gauche, verte à droite) indiquant ses déplacements."
   ]
  },
  "briefing": "Snake atteint le toit de la tour de communication pendant qu'Otacon tente de relancer l'ascenseur. Liquid Snake surgit aux commandes d'un hélicoptère d'assaut Hind D : il faut l'abattre au lance-missiles Stinger.",
  "tips": [
   "Le deck Boss n'est jamais remélangé : notez l'ordre des cartes déjà vues pour anticiper les 6 attaques en cycle.",
   "Utilisez les obstacles du toit pour couper la ligne de vue de l'hélicoptère entre deux tirs.",
   "Concentrez le feu : plus le combat dure, plus la piste de Menace avance.",
   "À 4 joueurs, Otacon doit garder un Terminal piraté pour poser ses Murs au bon moment."
  ],
  "errata": [],
  "pages": {
   "text": [
    101,
    102
   ],
   "map": 101
  },
  "images": [
   "guide/maps/s10.jpg"
  ]
 },
 {
  "id": 11,
  "name": "Sniper Wolf",
  "subtitle": "Snowfield",
  "type": "boss+sneak",
  "time": "40-60 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ],
   "3": [
    "Snake",
    "Meryl",
    "Gray Fox"
   ],
   "4": [
    "Snake",
    "Meryl",
    "Gray Fox",
    "Otacon"
   ],
   "note": [
    "Boss Stage pour 1-3 joueurs (Snake, Meryl, Gray Fox).",
    "Otacon (Sneaking Stage) peut s'ajouter à n'importe quel nombre de joueurs, ex. 2 joueurs Snake + Otacon, mais jamais en solo."
   ]
  },
  "tiles": [
   "Sniper Wolf (8A)",
   "Snowfield B (6B)",
   "Elevator Shaft (S)",
   "Otacon uniquement : Security (12B), Elevator (E), 2 Elevator Shafts"
  ],
  "guardDeck": {
   "Otacon": "7 cartes Rouges, 10 cartes Bleues (uniquement pour la partie Sneaking d'Otacon)"
  },
  "legend": {
   "guards": 3,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 2,
   "lockedDoors": 2,
   "wolfTokens": "3 blancs + 1 par personnage sur le Snowfield + 1 Sniper Wolf",
   "crosshairs": 1,
   "startingArea": "Snake, Meryl, Gray Fox (Snowfield) ; Otacon dans le Security",
   "obstacles": "Arbres = obstacles bloquant la LOS",
   "tileCodes": [
    "6B",
    "8A",
    "S",
    "E",
    "12B (Otacon)"
   ]
  },
  "setup": [
   "Placer la carte Special Action « Sniper Rifle » sur la zone surlignée des dashboards de Snake, Meryl et Gray Fox.",
   "Prendre des jetons Sniper Wolf vierges : 3 + 1 par personnage sur la tuile Snowfield (Otacon exclu).",
   "Mélanger ces jetons vierges avec le jeton Sniper Wolf et les placer face cachée sur les cases numérotées (arbres) dans l'ordre croissant, en commençant par la case 1.",
   "Placer le marqueur de Menace sur la case la plus à gauche de la piste de Menace de Sniper Wolf.",
   "Placer le jeton Crosshairs (viseur) de Sniper Wolf comme indiqué sur la carte.",
   "Otacon (optionnel, Sneaking) : tuiles Security, Elevator, 2 Elevator Shafts ; deck Guard Order 7 Rouges + 10 Bleues ; 3 Gardes, 2 portes verrouillées, 2 Terminaux.",
   "Deck System d'Otacon : mélanger uniquement 2× Remote Unlock, 1× Misdirection, 1× Distraction."
  ],
  "objective": [
   "Snake / Meryl / Gray Fox : vaincre Sniper Wolf.",
   "Otacon (objectifs séparés, dans l'ordre) : 1) déverrouiller la porte de sécurité de niveau 5 ; 2) finir son tour sur n'importe quelle case de la tuile Sniper Wolf."
  ],
  "optional": [],
  "special": [
   {
    "t": "Arbres",
    "d": "Les arbres sont des obstacles, mais les jetons Crosshairs peuvent quand même les traverser."
   },
   {
    "t": "Boss et Sneaking",
    "d": "Snake, Meryl et Gray Fox jouent un Boss Stage ; Otacon joue un Sneaking Stage. En phase Ennemi, résoudre le tour de Sniper Wolf avant d'activer les Gardes."
   },
   {
    "t": "Otacon",
    "d": "Otacon n'influence ni les PV de départ de Sniper Wolf ni le nombre de jetons Wolf. Il ne peut pas utiliser sa capacité Codec Call pendant ce Stage."
   },
   {
    "t": "Ascenseur (Otacon)",
    "d": "Otacon peut voyager en faisant une action Interact sur la case Elevator : déplacer l'ascenseur et toutes les figurines dedans vers une autre Elevator Shaft. Il peut aussi appeler l'ascenseur par une action Interact sur une Elevator Shaft."
   },
   {
    "t": "Jetons Wolf",
    "d": "Sniper Wolf se cache parmi des jetons vierges posés face cachée : il faut la débusquer avant de pouvoir l'achever."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué au combat (KIA).",
   "OU Otacon : la carte Game Over est révélée."
  ],
  "cleared": [
   "Si Sniper Wolf est vaincue en premier : débloque la carte Équipement #018, lire la Cutscene 11A (pages 106-110).",
   "Si Otacon atteint d'abord une case de la tuile Sniper Wolf : débloque la carte Équipement #020, lire la Cutscene 11B (pages 111-114)."
  ],
  "boss": {
   "name": "Sniper Wolf",
   "health": "Selon le nombre de personnages : voir le dashboard (cases rouges illisibles sur le scan)",
   "defense": "4 (case verte du dashboard, lecture probable)",
   "notes": [
    "Attaque : 3 dés noirs (icônes du dashboard, lecture probable).",
    "Piste de Menace : 3 / 3 / 4 / 4 / 5 / 5 / 6.",
    "Son viseur (Crosshairs) se déplace sur le Snowfield et traverse les arbres.",
    "Le jeton Sniper Wolf est caché parmi des jetons vierges sur les arbres numérotés."
   ]
  },
  "briefing": "En plein blizzard, Snake se retrouve dans la ligne de mire de Sniper Wolf, qui a déjà blessé Meryl. Pendant que l'équipe affronte la tireuse d'élite dans la plaine enneigée, Otacon peut tenter de s'infiltrer pour rejoindre les lieux.",
  "tips": [
   "Ne restez pas dans la ligne de tir du viseur : les arbres ne protègent pas de ses Crosshairs.",
   "Révélez les jetons Wolf méthodiquement par ordre de numéro pour trouver la vraie Sniper Wolf.",
   "Avec Otacon, la course est réelle : la cutscene et la carte Équipement débloquées changent selon qui termine en premier.",
   "Otacon a un mini-deck System (Remote Unlock ×2) : gardez-le pour la porte de niveau 5."
  ],
  "errata": [],
  "pages": {
   "text": [
    104,
    105
   ],
   "map": 105
  },
  "images": [
   "guide/maps/s11.jpg"
  ]
 },
 {
  "id": 12,
  "name": "Vulcan Raven",
  "subtitle": "Warehouse",
  "type": "boss",
  "time": "45 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ],
   "3": [
    "Snake",
    "Meryl",
    "Gray Fox"
   ],
   "4": [
    "Snake",
    "Meryl",
    "Gray Fox",
    "Otacon"
   ]
  },
  "tiles": [
   "Warehouse A (7B)",
   "Warehouse B (8B)"
  ],
  "guardDeck": null,
  "legend": {
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "startingArea": "Snake, Meryl, Gray Fox (bas du Warehouse)",
   "raven": "Figurine de Vulcan Raven placée comme indiqué (rangée du milieu, tournée vers le bas)",
   "obstacles": "Conteneurs (bloquent la LOS)",
   "tileCodes": [
    "7B",
    "8B"
   ]
  },
  "setup": [
   "Placer la carte standard « Boss Stage Reference » sur la zone surlignée du dashboard de chaque joueur.",
   "Mélanger les 6 cartes Boss Vulcan Raven pour former le deck Boss.",
   "Placer le marqueur de Menace sur la case la plus à gauche de la piste de Menace de Vulcan Raven.",
   "Placer Snake, Meryl et Gray Fox dans la zone de départ (bas du Warehouse) et Vulcan Raven comme indiqué.",
   "4 joueurs (Otacon) : placer la carte Terminal Reference (Boss Stage Terminal) sur la zone surlignée du dashboard d'Otacon.",
   "Prendre la tuile Terminal d'Otacon, y placer sa figurine comme indiqué et mettre son jeton (?) sur la case la plus à gauche de la tuile Terminal.",
   "Utiliser le deck System « Vulcan Raven » à la place du deck System standard d'Otacon.",
   "Prendre les 2 jetons Tourelle (Turret) et les placer à côté d'Otacon."
  ],
  "objective": [
   "Vaincre Vulcan Raven."
  ],
  "optional": [],
  "special": [
   {
    "t": "Boss Stage Reference",
    "d": "Pas de carte d'action spéciale : on combat Raven avec les actions standard et l'équipement."
   },
   {
    "t": "Tourelles d'Otacon",
    "d": "À 4 joueurs, Otacon dispose de 2 jetons Tourelle utilisables via le deck System Vulcan Raven."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué au combat (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #021",
   "Aller page 119 (cutscene)."
  ],
  "boss": {
   "name": "Vulcan Raven",
   "health": "Selon le nombre de joueurs : voir le dashboard (illisible sur le scan)",
   "defense": "4 (case verte du dashboard, lecture probable)",
   "notes": [
    "Attaque : 2 dés noirs de base (lecture probable).",
    "Piste de Menace : 6 / 7 / 8 / 9 / 9+ / 10 / 11 / 12.",
    "Armé d'un canon Vulcan : les allées entre conteneurs sont des couloirs de tir."
   ]
  },
  "briefing": "Dans l'entrepôt glacial des ogives, le géant chaman Vulcan Raven attend Snake avec son canon Vulcan. Un duel brutal entre les conteneurs, où chaque angle mort compte.",
  "tips": [
   "Les conteneurs bloquent la ligne de vue : déplacez-vous de couvert en couvert et attaquez par les flancs.",
   "Évitez de rester alignés dans la même allée que Raven.",
   "La piste de Menace monte très haut (jusqu'à 12) : finissez le combat vite."
  ],
  "errata": [],
  "pages": {
   "text": [
    118
   ],
   "map": 118
  },
  "images": [
   "guide/maps/s12.jpg"
  ]
 },
 {
  "id": 13,
  "name": "PAL Override",
  "subtitle": "Clé PAL",
  "type": "sneak",
  "time": "60-90 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ],
   "3": [
    "Snake",
    "Meryl",
    "Gray Fox"
   ],
   "4": [
    "Snake",
    "Meryl",
    "Gray Fox",
    "Otacon"
   ]
  },
  "tiles": [
   "Underground Base (11B)",
   "Blast Furnace (2A)",
   "Warehouse A (7B)",
   "Warehouse B (8B)",
   "3 Elevator Shafts (S)",
   "Elevator (E)",
   "2 Barracks (B)"
  ],
  "guardDeck": {
   "1": "7 Rouges, 20 Bleues",
   "2": "7 Rouges, 16 Bleues",
   "3": "7 Rouges, 12 Bleues",
   "4": "7 Rouges, 10 Bleues"
  },
  "legend": {
   "guards": 8,
   "cameras": 3,
   "events": [
    "A",
    "B",
    "C"
   ],
   "exits": 0,
   "traps": 0,
   "terminals": 3,
   "terminalLevels": [
    2,
    3,
    4
   ],
   "lockedDoors": 2,
   "lockedDoorLevels": [
    2,
    3
   ],
   "interactTokens": 4,
   "barracks": 2,
   "startingArea": "4 figurines dans l'Elevator Shaft au-dessus du Blast Furnace",
   "tileCodes": [
    "2A + E",
    "7B + 8B + S + B",
    "11B + B + S"
   ]
  },
  "setup": [
   "Assembler Blast Furnace, Warehouse A/B, Underground Base, 3 Elevator Shafts, l'Elevator et 2 Barracks comme sur le plan (utiliser la page corrigée de l'errata).",
   "Préparer le deck Guard Order selon le nombre de joueurs (toujours 7 Rouges + 20/16/12/10 Bleues pour 1/2/3/4 joueurs).",
   "Placer les Events A (Blast Furnace), B (Warehouse A, côté gauche) et C (Underground Base).",
   "Errata : un seul Barracks dans le Warehouse quelle que soit la configuration — à 1 joueur, le Barracks marqué « 1 » (milieu droit du Warehouse B) ; à 2-4 joueurs, le Barracks avec le Terminal 3 (gauche du Warehouse A, icône 2/3/4).",
   "Le 2e Barracks va dans l'Underground Base (bas gauche, Guard Count 3) à toutes les configurations.",
   "1 joueur : aucune porte verrouillée, aucun jeton Caméra. Utiliser le Maintenance Scaffold. Placer le Barracks comme indiqué dans le Warehouse. Tous les Barracks comptent comme Guard Count 2.",
   "2 joueurs : caméra en haut à droite du Warehouse B. Porte jaune verrouillée (niveau 2) de l'Underground Base. Utiliser le Maintenance Scaffold.",
   "3 joueurs : caméras en haut à droite du Warehouse B et sur le Blast Furnace. Toutes les portes verrouillées (jaune niv. 2 dans l'Underground Base, orange niv. 3 près de l'Event B). Pas de Maintenance Scaffold.",
   "4 joueurs : tout sauf le Maintenance Scaffold — donc aussi la 3e caméra (bas gauche du Warehouse A) et le Terminal 2 du Blast Furnace (icône 4, pour Otacon).",
   "Icônes de la carte : les marqueurs colorés 1/2/3/4 près d'un élément indiquent pour quels nombres de joueurs il est utilisé."
  ],
  "objective": [
   "Dans l'ordre : 1) atteindre les Events A et B (dans n'importe quel ordre) ;",
   "2) puis le joueur qui a la PAL Card Key équipée doit atteindre l'Event C."
  ],
  "optional": [],
  "special": [
   {
    "t": "Temperature Sensitive Keys",
    "d": "Un joueur doit avoir la PAL Card Key équipée."
   },
   {
    "t": "Elevator",
    "d": "Action Interact sur la case Elevator : déplacer la tuile Elevator et toutes les figurines dedans vers n'importe quelle autre Elevator Shaft. On peut aussi appeler l'ascenseur par une action Interact sur une Elevator Shaft."
   },
   {
    "t": "Steam Tunnel",
    "d": "Quand un joueur interagit avec le jeton Steam Tunnel, il déplace sa figurine sur la case portant ce symbole dans le Blast Furnace (Codec 04.07)."
   },
   {
    "t": "Maintenance Scaffold (1-2 joueurs)",
    "d": "En interagissant avec l'un des deux jetons Scaffold de l'Underground Base, le joueur se déplace jusqu'à l'autre jeton Scaffold (Codec 04.07)."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Retirer le jeton A et le placer sur le dashboard du joueur."
   },
   {
    "k": "B",
    "d": "Retirer le jeton B et le placer sur le dashboard du joueur."
   },
   {
    "k": "C",
    "d": "Si A et B ne sont plus sur la carte et que vous avez la PAL Card Key équipée, passer à la section Stage Cleared."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "OU un joueur est tué au combat (KIA)."
  ],
  "cleared": [
   "Débloque la carte Équipement #022",
   "Aller page 128 (cutscene)."
  ],
  "boss": null,
  "briefing": "Master Miller met Snake en garde contre Naomi et le virus FOXDIE. Snake doit maintenant activer les codes PAL : la clé à mémoire de forme doit passer par le froid de l'entrepôt et la chaleur du haut-fourneau avant d'être insérée dans le terminal de Metal Gear.",
  "tips": [
   "Désignez dès le départ le porteur de la PAL Card Key : c'est lui qui doit finir sur l'Event C.",
   "Les autres joueurs peuvent ramasser A et B pendant que le porteur se rapproche de C.",
   "Utilisez l'ascenseur pour vous replier rapidement entre les zones, mais votre jeton Attention vous suit (FAQ).",
   "Les Barracks font apparaître des Gardes sur la case Radio : évitez de traîner à proximité.",
   "Partie longue (60-90 min) avec un gros deck Bleu en solo : prenez votre temps, la furtivité paie."
  ],
  "errata": [
   "FAQ/Errata v1.2 p.2 : un seul Barracks dans le Warehouse quelle que soit la configuration.",
   "Le Barracks avec le Terminal (Warehouse A) n'avait pas l'icône « 2/3/4 » : il est utilisé à 2-4 joueurs (Terminal pour Otacon aux configurations supérieures).",
   "Un icône « 1 » superflu a été retiré du Barracks de l'Underground Base (ce Barracks est utilisé à toutes les configurations).",
   "Setup 1 joueur corrigé : « Placez le Barracks comme indiqué dans le Warehouse » (celui marqué 1).",
   "Utiliser la page de setup corrigée (pages/errata_p2.jpg) plutôt que la carte du livre (p127)."
  ],
  "pages": {
   "text": [
    126,
    127
   ],
   "map": "errata_p2",
   "mapOriginal": 127
  },
  "images": [
   "guide/maps/s13.jpg"
  ]
 },
 {
  "id": 14,
  "name": "Metal Gear REX",
  "subtitle": "Combat final",
  "type": "boss",
  "time": "60 min",
  "players": {
   "1": [
    "Snake"
   ],
   "2": [
    "Snake",
    "Meryl"
   ],
   "3": [
    "Snake",
    "Meryl",
    "Gray Fox"
   ],
   "4": [
    "Snake",
    "Meryl",
    "Gray Fox",
    "Otacon"
   ]
  },
  "tiles": [
   "Metal Gear Platform A (10B)",
   "Metal Gear Platform B (9B)",
   "Tuile Boss Metal Gear REX"
  ],
  "guardDeck": null,
  "legend": {
   "guards": 0,
   "cameras": 0,
   "events": [],
   "exits": 0,
   "traps": 0,
   "terminals": 0,
   "lockedDoors": 0,
   "startingArea": "Snake, Meryl, Gray Fox (centre de la plateforme)",
   "metalGearRex": "Tuile REX en haut de la plateforme",
   "tileCodes": [
    "10B",
    "9B"
   ]
  },
  "setup": [
   "Prendre les jetons Crosshairs de Snake, Meryl et Gray Fox et les placer près de la carte.",
   "Placer la carte Special Action « Radar Homing Missile Launcher » sur la zone surlignée du dashboard de chaque joueur.",
   "Mélanger les cartes Boss Metal Gear REX pour former le deck Boss.",
   "Mélanger les cartes Metal Gear REX Special Attack face cachée, puis placer ce deck face visible.",
   "Placer la tuile Metal Gear REX en haut de la plateforme et les joueurs dans la zone de départ.",
   "4 joueurs (Otacon) : placer la carte Terminal Reference (Boss Stage Terminal) sur la zone surlignée du dashboard d'Otacon.",
   "Prendre la tuile Terminal d'Otacon, y placer sa figurine comme indiqué et mettre son jeton (?) sur la case la plus à gauche de la tuile Terminal.",
   "Utiliser le deck System « Metal Gear REX » à la place du deck System standard d'Otacon."
  ],
  "objective": [
   "Détruire le Radome de REX en réduisant ses points de vie à 0."
  ],
  "optional": [],
  "special": [
   {
    "t": "Radar Homing Missile Launcher",
    "d": "Les joueurs visent le Radome de REX grâce à l'action spéciale de missile à tête chercheuse et à leurs jetons Crosshairs."
   },
   {
    "t": "Special Attacks de REX",
    "d": "Le deck Special Attack est face visible : la prochaine attaque spéciale de REX est connue à l'avance."
   }
  ],
  "events": [],
  "failure": [
   "Un joueur est tué au combat (KIA)."
  ],
  "cleared": [
   "Après la victoire, lire la cutscene finale (pages 134-145).",
   "Débloque la carte Équipement #023 (p145)",
   "Aller page 146."
  ],
  "boss": {
   "name": "Metal Gear REX (piloté par Liquid Snake)",
   "health": "Radome : selon le nombre de joueurs, voir le dashboard REX (non visible dans le livre)",
   "defense": "Voir le dashboard REX",
   "notes": [
    "Deux decks : cartes Boss REX (mélangées) + cartes Special Attack (face visible).",
    "Objectif : le Radome (antenne radar circulaire du bras gauche) ; le blindage de REX est indestructible."
   ]
  },
  "briefing": "Liquid Snake a pris les commandes de Metal Gear REX. Otacon révèle le point faible du char bipède : le Radome, son radar. Détruire ce capteur au missile à tête chercheuse est la seule chance d'aveugler REX et d'empêcher le lancement nucléaire.",
  "tips": [
   "Regardez toujours la carte Special Attack visible : écartez-vous de la zone visée avant la phase Ennemi.",
   "Dispersez l'équipe sur la plateforme pour qu'une seule attaque de zone ne touche pas tout le monde.",
   "Coordonnez les jetons Crosshairs pour concentrer les tirs sur le Radome.",
   "C'est le dernier Stage : utilisez sans retenue Rations et équipements débloqués."
  ],
  "errata": [],
  "pages": {
   "text": [
    132,
    133,
    145
   ],
   "map": 133
  },
  "images": [
   "guide/maps/s14.jpg"
  ]
 },
 {
  "id": "VR60",
  "name": "Sneaking",
  "subtitle": "VR Mission 60",
  "type": "sneak",
  "time": "60-90 min",
  "players": {
   "1": [
    "Au choix"
   ],
   "2": [
    "Au choix"
   ],
   "3": [
    "Au choix"
   ],
   "4": [
    "Au choix"
   ],
   "note": [
    "1 à 4 joueurs, n'importe quelle combinaison de personnages (même Otacon seul)."
   ]
  },
  "tiles": [
   "Heliport A (2B)",
   "Heliport B (1B)",
   "Heliport C (3B)",
   "Heliport D (4B)"
  ],
  "guardDeck": "7 Rouges, 17 Bleues + 1 Bleue supplémentaire par joueur au-delà du premier",
  "legend": {
   "guards": 4,
   "cameras": 3,
   "events": [
    "A",
    "B",
    "C",
    "D"
   ],
   "exits": 1,
   "traps": 2,
   "terminals": 4,
   "terminalLevels": [
    2,
    3,
    4,
    5
   ],
   "lockedDoors": 3,
   "lockedDoorLevels": [
    3,
    4,
    5
   ],
   "objectives": 5,
   "startingSpaces": 4,
   "bossSpawn": "Jeton X (Objective X) au centre de l'héliport",
   "tileCodes": [
    "2B",
    "1B",
    "3B",
    "4B"
   ]
  },
  "setup": [
   "Deck Guard Order : 7 Rouges + 17 Bleues, plus 1 Bleue supplémentaire par joueur au-delà du premier.",
   "Chaque joueur place sa figurine sur l'une des cases de départ (étoiles rouges autour de la case EXIT, en bas).",
   "Mélanger les 5 jetons Piège (? rouge sur fond gris) et en placer 2 face cachée sur la carte comme indiqué.",
   "Placer 1 jeton X face visible sur la carte comme indiqué (centre de l'héliport) : c'est la case d'apparition des boss VR.",
   "Placer les 5 jetons Objectif (? sur dossier kaki), les Events A-D, Terminaux, portes verrouillées, caméras et gardes comme sur le plan.",
   "Préparer les dashboards VR (face verte) des boss disponibles pour les apparitions."
  ],
  "objective": [
   "1) Chaque joueur doit collecter 1 objectif.",
   "2) Ensuite, n'importe quel joueur doit atteindre la case Exit."
  ],
  "optional": [],
  "special": [
   {
    "t": "Collecter un objectif",
    "d": "Se déplacer sur un jeton Objectif (?). Le placer à côté du dashboard pour savoir quels personnages ont collecté un objectif."
   },
   {
    "t": "Apparition des boss VR",
    "d": "Chaque fois qu'une icône d'apparition (radio) est résolue sur une carte Guard Order et qu'au moins 1 Garde devrait apparaître, faire apparaître à la place du premier Garde 1 boss VR disponible au hasard sur la case X, tourné vers le haut du plateau. Puis faire apparaître les Gardes supplémentaires normalement."
   },
   {
    "t": "Vaincre un boss VR",
    "d": "Chaque boss VR vaincu déverrouille automatiquement la porte verrouillée de plus bas niveau sur la carte. Les boss vaincus sont retirés du jeu et ne réapparaissent pas."
   },
   {
    "t": "Events A/B/C/D",
    "d": "En passant sur un jeton Event, un joueur peut le défausser pour remplir au maximum les munitions, charges ou utilisations d'1 de ses équipements."
   }
  ],
  "events": [
   {
    "k": "A",
    "d": "Défausser pour recharger au maximum 1 équipement (munitions, charges ou utilisations)."
   },
   {
    "k": "B",
    "d": "Idem A."
   },
   {
    "k": "C",
    "d": "Idem A."
   },
   {
    "k": "D",
    "d": "Idem A."
   }
  ],
  "failure": [
   "La carte Game Over est révélée.",
   "OU un joueur est tué au combat (KIA)."
  ],
  "cleared": [
   "VR Stage 60 Cleared : QR code sur la fiche (pas de carte Équipement indiquée)."
  ],
  "boss": {
   "name": "Boss VR aléatoires",
   "health": "Selon la face VR (verte) de chaque dashboard de boss",
   "defense": "Selon la face VR du dashboard",
   "notes": [
    "Ils apparaissent sur la case X à la place du premier Garde d'une apparition.",
    "Ils n'utilisent pas leur deck Boss : appliquer les règles de la face verte (VR) de leur dashboard.",
    "Le nombre de dés d'attaque varie selon le boss : lire le dashboard.",
    "Un boss VR qui vous voit déclenche l'alarme."
   ]
  },
  "briefing": "Après une infiltration réussie, l'équipe a été capturée et chaque membre porte un explosif qui détonera en cas de fuite. Il faut prendre l'ascenseur, désamorcer les charges à une station de désarmement, puis qu'un agent s'échappe avec les renseignements.",
  "tips": [
   "Chaque joueur doit ramasser un objectif : répartissez-vous les jetons ? dès le départ.",
   "Les apparitions de boss VR sont dangereuses mais les vaincre ouvre les portes verrouillées (niveau 3 puis 4 puis 5).",
   "Gardez les Events A-D pour recharger un équipement clé au bon moment plutôt que de les prendre tout de suite.",
   "La sortie est au point de départ : planifiez une boucle et revenez vers l'EXIT une fois tous les objectifs collectés."
  ],
  "errata": [
   "Les missions VR se jouent de 1 à 4 joueurs avec n'importe quels personnages (pas de restriction comme dans la campagne).",
   "Les boss VR n'utilisent PAS leur deck Boss : suivre les règles de la face verte (VR) de leur dashboard.",
   "Un boss VR qui vous voit déclenche l'alarme."
  ],
  "pages": {
   "map": "vr60"
  },
  "images": [
   "guide/maps/vr60.jpg"
  ]
 }
];
