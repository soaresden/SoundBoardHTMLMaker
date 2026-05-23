// ========================================
// DONNÉES DES RÔLES - Loup-Garou
// ========================================
// Chargé avant le GameMaster pour être disponible globalement
// Contient tous les 52+ rôles du jeu avec métadonnées

window.ROLES_DATA = {
  "roles": {
    // ========== BASE (8 rôles) ==========
    "Villageois_Villageois": {
      "id": "Villageois_Villageois",
      "name": "Villageois",
      "description": "Villageois ordinaire sans pouvoir spécial. Gagne quand tous les Loups sont morts.",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": false,
      "possibleStatuses": []
    },
    "Voyante": {
      "id": "Voyante",
      "name": "Voyante",
      "description": "Chaque nuit, découvre le vrai rôle d'une personne. Essentielle pour identifier les Loups!",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": true,
      "possibleStatuses": []
    },
    "Chasseur": {
      "id": "Chasseur",
      "name": "Chasseur",
      "description": "Si le Chasseur meurt (nuit ou jour), il peut tuer quelqu'un avant de partir. Très puissant!",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": false,
      "specialBehavior": "postDeathKill",
      "possibleStatuses": []
    },
    "Sorcière": {
      "id": "Sorcière",
      "name": "Sorcière",
      "description": "Possède une potion de vie (sauve) et une potion de mort (tue). Chacune utilisable une fois.",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": true,
      "specialBehavior": "potions",
      "potionCount": { "life": 1, "death": 1 },
      "possibleStatuses": []
    },
    "Cupidon": {
      "id": "Cupidon",
      "name": "Cupidon",
      "description": "La première nuit, crée un couple (2 personnes liées). Si l'un meurt, l'autre meurt aussi IMMÉDIATEMENT.",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": true,
      "specialBehavior": "createLovers",
      "affectsStatuses": ["Amoureux"],
      "possibleStatuses": []
    },
    "Petite_Fille": {
      "id": "Petite_Fille",
      "name": "Petite Fille",
      "description": "Peut écouter les Loups discuter la nuit pour apprendre leurs stratégies et leurs noms.",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": true,
      "specialBehavior": "spyOnWolves",
      "possibleStatuses": []
    },
    "Voleur": {
      "id": "Voleur",
      "name": "Voleur",
      "description": "Chaque nuit, le voleur échange sa carte avec un autre joueur. Les rôles changent, pas les camps.",
      "camp": "Village",
      "origin": "base",
      "hasNightAction": true,
      "specialBehavior": "roleSwap",
      "possibleStatuses": []
    },
    "Simple_Loup_Garou": {
      "id": "Simple_Loup_Garou",
      "name": "Loup-Garou",
      "description": "Mange quelqu'un chaque nuit avec les autres Loups. Gagne quand les Loups égalent ou dépassent les Villageois.",
      "camp": "Loups",
      "origin": "base",
      "hasNightAction": true,
      "specialBehavior": "packHunt",
      "possibleStatuses": []
    },

    // ========== EXTENSION (24 rôles) ==========
    "Salvateur": {
      "id": "Salvateur",
      "name": "Salvateur",
      "description": "Anticipe l'infection des Loups et protège quelqu'un chaque nuit contre les attaques.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "protect",
      "possibleStatuses": []
    },
    "Ancien": {
      "id": "Ancien",
      "name": "Ancien",
      "description": "S'il est tué durant le vote du village, tous les joueurs sauf les loups perdent leurs pouvoirs.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "protectOnDeath",
      "possibleStatuses": []
    },
    "Ange": {
      "id": "Ange",
      "name": "Ange",
      "description": "Chaque nuit, choisit quelqu'un à protéger des attaques des Loups.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "protect",
      "possibleStatuses": []
    },
    "Servante_Devouee": {
      "id": "Servante_Devouee",
      "name": "Servante Dévouée",
      "description": "Lorsqu'un joueur est mort, avant que son rôle soit révélé, elle peut échanger son rôle avec lui.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "roleSwapDead",
      "possibleStatuses": []
    },
    "Renard": {
      "id": "Renard",
      "name": "Renard",
      "description": "Chaque nuit, il choisit 3 joueurs. Si l'un d'entre eux est loup, il garde son pouvoir. Sinon, il perd son pouvoir.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "detectWolves",
      "possibleStatuses": []
    },
    "Corbeau": {
      "id": "Corbeau",
      "name": "Corbeau",
      "description": "Chaque nuit, il désigne un joueur qui aura deux voix contre lui lors du vote du village.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "reduceVotes",
      "voteModifier": -2,
      "possibleStatuses": []
    },
    "Enfant_Sauvage": {
      "id": "Enfant_Sauvage",
      "name": "Enfant Sauvage",
      "description": "Choisit son idole en début de partie. Si elle meurt par les Loups, il devient un Loup.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "transformOnIdolDeath",
      "affectsStatuses": ["Modèle"],
      "possibleStatuses": []
    },
    "Joueur_Flute": {
      "id": "Joueur_Flute",
      "name": "Joueur de Flûte",
      "description": "Chaque nuit, enchante une personne pour l'immuniser et la charmer. Gagne quand tout le village est enchanté.",
      "camp": "Seul",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "charm",
      "affectsStatuses": ["Charmé"],
      "possibleStatuses": []
    },
    "Loup_Garou_Blanc": {
      "id": "Loup_Garou_Blanc",
      "name": "Loup Blanc",
      "description": "Une nuit sur deux (de son choix), tue un joueur. Mais il peut AUSSI tuer les autres Loups!",
      "camp": "Seul",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "huntSelectively",
      "possibleStatuses": []
    },
    "Montreur_Ours": {
      "id": "Montreur_Ours",
      "name": "Montreur d'Ours",
      "description": "Si son ours grogne le matin (choix aléatoire), alors l'un des joueurs à côté de lui est un Loup.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "bearDetection",
      "possibleStatuses": []
    },
    "Comédien": {
      "id": "Comedien",
      "name": "Comédien",
      "description": "Pendant les trois premières nuits, il change de rôle (choix parmi les rôles non assignés).",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "changeRole",
      "roleChanges": 3,
      "possibleStatuses": []
    },
    "Chevalier_Epee_Rouille": {
      "id": "Chevalier_Epee_Rouille",
      "name": "Chevalier à l'Épée Rouillée",
      "description": "S'il est tué par les Loups, ils ne font pas de victime la nuit suivante, et le premier Loup à sa droite meurt.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "postDeathEffect",
      "possibleStatuses": []
    },
    "Juge_Begue": {
      "id": "Juge_Begue",
      "name": "Juge Bègue",
      "description": "Peut une fois dans la partie, grâce à un signe discret convenu à l'avance, choisir d'effectuer un second vote du village.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "secondVote",
      "secondVotes": 1,
      "possibleStatuses": []
    },
    "Ange_Dechu": {
      "id": "Ange_Dechu",
      "name": "Ange Déchu",
      "description": "Gagne s'il meurt la première nuit ou le premier jour. La partie s'arrête immédiatement.",
      "camp": "Seul",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "winOnFirstDeath",
      "possibleStatuses": []
    },
    "Abominable_Sectaire": {
      "id": "Abominable_Sectaire",
      "name": "Sectaire",
      "description": "Divise le groupe en deux selon un critère secret. Gagne quand les joueurs de l'autre groupe que le sien sont morts.",
      "camp": "Seul",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "divideGroup",
      "possibleStatuses": []
    },
    "Infect_Pere_Loups": {
      "id": "Infect_Pere_Loups",
      "name": "Père des Loups",
      "description": "Une fois dans la partie, peut convertir la victime des Loups en Loup la nuit même.",
      "camp": "Seul",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "convertVictim",
      "affectsStatuses": ["Infecté"],
      "conversionCount": 1,
      "possibleStatuses": []
    },
    "Chien_Loup": {
      "id": "Chien_Loup",
      "name": "Chien-Loup",
      "description": "En début de partie, peut choisir entre être Villageois ou Loup Garou.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "chooseAlignment",
      "possibleStatuses": []
    },
    "Grand_Mechant_Loup": {
      "id": "Grand_Mechant_Loup",
      "name": "Grand Méchant Loup",
      "description": "Tant que personne du clan des Loups n'est mort, se réveille seul après les Loups pour faire une deuxième victime.",
      "camp": "Loups",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "extraKill",
      "extraKillCondition": "noWolvesDeadYet",
      "possibleStatuses": []
    },
    "Idiot_Village": {
      "id": "Idiot_Village",
      "name": "Idiot du Village",
      "description": "S'il est tué par le vote du village, il est épargné mais perd le droit de vote pour le reste de la partie.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "surviveDayKill",
      "possibleStatuses": []
    },
    "Bouc_Emissaire": {
      "id": "Bouc_Emissaire",
      "name": "Bouc Émissaire",
      "description": "S'il y a égalité lors d'un vote du village, c'est lui qui est tué à la place des autres.",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": false,
      "specialBehavior": "dieOnTie",
      "possibleStatuses": []
    },
    "Deux_Soeurs": {
      "id": "Deux_Soeurs",
      "name": "Deux Sœurs",
      "description": "Peuvent se réveiller la nuit et communiquer sans parler (sauf avec les Loups).",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "twinCommunication",
      "linkedWith": "autre_sœur",
      "possibleStatuses": []
    },
    "Trois_Freres": {
      "id": "Trois_Freres",
      "name": "Trois Frères",
      "description": "Peuvent se réveiller la nuit et communiquer sans parler (sauf avec les Loups).",
      "camp": "Village",
      "origin": "extension",
      "hasNightAction": true,
      "specialBehavior": "twinCommunication",
      "linkedWith": "autres_frères",
      "possibleStatuses": []
    },

    // ========== SITE OFF (4 rôles) ==========
    "Chaman": {
      "id": "Chaman",
      "name": "Chaman",
      "description": "Dès la deuxième nuit, il peut dialoguer avec les morts pour connaître leurs rôles et indices.",
      "camp": "Village",
      "origin": "site off",
      "hasNightAction": true,
      "specialBehavior": "talkToDeadStartingNight2",
      "possibleStatuses": []
    },
    "Marionnettiste": {
      "id": "Marionnettiste",
      "name": "Marionnettiste",
      "description": "Chaque nuit, contrôle l'action d'un autre joueur (imite son pouvoir).",
      "camp": "Village",
      "origin": "site off",
      "hasNightAction": true,
      "specialBehavior": "controlAction",
      "possibleStatuses": []
    },
    "Lapin_Blanc": {
      "id": "Lapin_Blanc",
      "name": "Lapin Blanc",
      "description": "Crée un événement aléatoire cette nuit: changement de vote, mort supplémentaire, protection, etc.",
      "camp": "Seul",
      "origin": "site off",
      "hasNightAction": true,
      "specialBehavior": "randomEvent",
      "possibleStatuses": []
    },
    "Ankou": {
      "id": "Ankou",
      "name": "Ankou",
      "description": "Chaque nuit, marque quelqu'un pour la mort. Si marqué 3 fois, meurt immédiatement.",
      "camp": "Village",
      "origin": "site off",
      "hasNightAction": true,
      "specialBehavior": "markForDeath",
      "marksForDeath": 3,
      "possibleStatuses": []
    },

    // ========== CRÉATION (19 rôles) ==========
    "Pretre": {
      "id": "Pretre",
      "name": "Prêtre",
      "description": "Chaque nuit, peut bénir quelqu'un qui gagnera un extra pouvoir ou protection.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "bless",
      "possibleStatuses": []
    },
    "Garde_Du_Corps": {
      "id": "Garde_Du_Corps",
      "name": "Garde du Corps",
      "description": "Peut choisir quelqu'un chaque nuit pour le protéger. Meurt si cette personne est ciblée par les Loups.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "bodyguard",
      "possibleStatuses": []
    },
    "Porteur_Amulette": {
      "id": "Porteur_Amulette",
      "name": "Porteur d'Amulette",
      "description": "Survit aux attaques des Loups une fois. Après cela, est un Villageois normal.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "amuletProtection",
      "protectionCharges": 1,
      "possibleStatuses": []
    },
    "Tireur": {
      "id": "Tireur",
      "name": "Tireur",
      "description": "Chaque jour, peut tirer sur quelqu'un sans débat. Doit deviner qui c'est, si se trompe, perd son arme.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "shoot",
      "ammoCount": 1,
      "possibleStatuses": []
    },
    "Fille_Joie": {
      "id": "Fille_Joie",
      "name": "Fille de Joie",
      "description": "Peut passer la nuit chez un autre joueur. Meurt si c'est un Loup ou si celui-ci est attaqué.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "visitPlayer",
      "possibleStatuses": []
    },
    "Mamie_Grincheuse": {
      "id": "Mamie_Grincheuse",
      "name": "Mamie Grincheuse",
      "description": "Chaque nuit, choisit un joueur qui ne possèdera pas de voix au vote du village le jour suivant.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "silenceVote",
      "possibleStatuses": []
    },
    "Lepreux": {
      "id": "Lepreux",
      "name": "Lépreux",
      "description": "Quand il meurt, tous les joueurs qui l'ont voté meurent aussi.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "postDeathKillVoters",
      "possibleStatuses": []
    },
    "Savant_Fou": {
      "id": "Savant_Fou",
      "name": "Savant Fou",
      "description": "Lorsqu'il meurt, les deux personnes assises à côté de lui meurent aussi.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "postDeathKillNeighbors",
      "possibleStatuses": []
    },
    "Gros_Dur": {
      "id": "Gros_Dur",
      "name": "Gros Dur",
      "description": "Survit aux attaques des Loups une fois. Agit comme un blindage pour le village.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "tankProtection",
      "protectionCharges": 1,
      "possibleStatuses": []
    },
    "Louveteau": {
      "id": "Louveteau",
      "name": "Louveteau",
      "description": "S'il meurt (jour ou nuit), les Loups font deux victimes la nuit suivante.",
      "camp": "Loups",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "bonusKillOnDeath",
      "possibleStatuses": []
    },
    "Humain_Maudit": {
      "id": "Humain_Maudit",
      "name": "Humain Maudit",
      "description": "S'il est tué par les Loups, il devient l'un d'entre eux et change de camp.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "turnOnWolfKill",
      "affectsStatuses": ["Infecté"],
      "possibleStatuses": []
    },
    "Tueur_Serie": {
      "id": "Tueur_Serie",
      "name": "Tueur en Série",
      "description": "Chaque nuit, tue une personne. Gagne quand il reste seul avec les Loups.",
      "camp": "Seul",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "kill",
      "possibleStatuses": []
    },
    "Pyromane": {
      "id": "Pyromane",
      "name": "Pyromane",
      "description": "Chaque nuit, peut soit imbiber deux personnes d'essence, soit brûler les personnes imbibées.",
      "camp": "Seul",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "arson",
      "possibleStatuses": []
    },
    "Cultiste": {
      "id": "Cultiste",
      "name": "Cultiste",
      "description": "Veut gagner avec les Loups. Est vu comme un Villageois par la Voyante et autres détecteurs.",
      "camp": "Loups",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "disguisedWolf",
      "possibleStatuses": []
    },
    "Mystique": {
      "id": "Mystique",
      "name": "Mystique",
      "description": "Chaque nuit, connaît le nombre d'ennemis du Village qui sont encore en vie.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "countEnemies",
      "possibleStatuses": []
    },
    "President": {
      "id": "President",
      "name": "Président",
      "description": "Tout le monde sait qu'il est le Président. S'il meurt, le Village perd immédiatement.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "vultureCondition",
      "possibleStatuses": []
    },
    "Arnacoeur": {
      "id": "Arnacoeur",
      "name": "Arnacoeur",
      "description": "Choisit une personne par nuit. Si c'est un Amoureux (de Cupidon), il devient son Amant et gagne avec ce couple.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": true,
      "specialBehavior": "seduceLovers",
      "possibleStatuses": []
    },
    "Fils_Lune": {
      "id": "Fils_Lune",
      "name": "Fils de la Lune",
      "description": "S'il meurt (jour ou nuit), les Loups ne font pas de victime la nuit suivante.",
      "camp": "Village",
      "origin": "création",
      "hasNightAction": false,
      "specialBehavior": "pauseWolfKill",
      "possibleStatuses": []
    },

    // ========== RÔLES INVENTÉS (5 rôles) ==========
    "Gitane": {
      "id": "Gitane",
      "name": "Gitane",
      "description": "Chaque nuit, sens à qui deux personnes sont connectées émotionnellement.",
      "camp": "Village",
      "origin": "custom",
      "hasNightAction": true,
      "specialBehavior": "senseConnection",
      "possibleStatuses": []
    },
    "Necromancien": {
      "id": "Necromancien",
      "name": "Nécromancien",
      "description": "Chaque nuit, peut tenter de ressusciter un mort qui reviendra en tant que Fantôme.",
      "camp": "Village",
      "origin": "custom",
      "hasNightAction": true,
      "specialBehavior": "resurrect",
      "resurrections": 1,
      "possibleStatuses": []
    },
    "Noctambule": {
      "id": "Noctambule",
      "name": "Noctambule",
      "description": "Chaque nuit, peut observer un joueur et voir qui a communiqué avec lui (Loups, autres pouvoirs, etc).",
      "camp": "Village",
      "origin": "custom",
      "hasNightAction": true,
      "specialBehavior": "spy",
      "possibleStatuses": []
    },
    "Loup_Garou_Voyant": {
      "id": "Loup_Garou_Voyant",
      "name": "Loup Voyant",
      "description": "Loup qui voit tous les rôles en début de partie. Gagne avec les autres Loups.",
      "camp": "Loups",
      "origin": "custom",
      "hasNightAction": true,
      "specialBehavior": "seeAllRoles",
      "possibleStatuses": []
    },
    "Capitaine": {
      "id": "Capitaine",
      "name": "Capitaine",
      "description": "Possède 2 voix au vote du village dès le départ.",
      "camp": "Village",
      "origin": "custom",
      "hasNightAction": false,
      "specialBehavior": "doubleVote",
      "voteModifier": 2,
      "possibleStatuses": []
    }
  }
};

// Mappage des rôles aux emojis pour affichage
window.ROLE_EMOJIS = {
  'Cupidon': '💘',
  'Enfant_Sauvage': '🐵',
  'Chien_Loup': '🐕',
  'Voyante': '👁️',
  'Sorcière': '🧙‍♀️',
  'Ancien': '👴',
  'Ange': '😇',
  'Servante_Devouee': '👸',
  'Salvateur': '🖖',
  'Renard': '🦊',
  'Gitane': '🔮',
  'Joueur_Flute': '🎵',
  'Marionnettiste': '🎭',
  'Voleur': '🎩',
  'Pyromane': '🔥',
  'Ankou': '☠️',
  'Abominable_Sectaire': '👹',
  'Lapin_Blanc': '🐰',
  'Juge_Begue': '⚖️',
  'Necromancien': '💀',
  'Noctambule': '🦉',
  'Corbeau': '🐦‍⬛',
  'Petite_Fille': '👧',
  'Simple_Loup_Garou': '🐺',
  'Grand_Mechant_Loup': '🐺',
  'Loup_Garou_Blanc': '🐺',
  'Loup_Garou_Voyant': '🐺',
  'Infect_Pere_Loups': '🐺',
  'Chevalier_Epee_Rouille': '⚔️',
  'Montreur_Ours': '🐻',
  'Comédien': '🎪',
  'Ange_Dechu': '😈',
  'Chasseur': '🏹',
  'Capitaine': '🎖️',
  'Dois_Soeurs': '👯‍♀️',
  'Trois_Freres': '👬',
  'Villageois_Villageois': '👨‍🌾',
  'Bouc_Emissaire': '🐐',
  'Idiot_Village': '🤡',
  'Pretre': '⛪',
  'Garde_Du_Corps': '💪',
  'Porteur_Amulette': '📿',
  'Tireur': '🔫',
  'Fille_Joie': '💃',
  'Mamie_Grincheuse': '👵',
  'Lepreux': '⚠️',
  'Savant_Fou': '🧪',
  'Gros_Dur': '🗿',
  'Louveteau': '🐶',
  'Humain_Maudit': '👻',
  'Tueur_Serie': '🔪',
  'Cultiste': '🕷️',
  'Mystique': '🔮',
  'President': '🎩',
  'Arnacoeur': '💔',
  'Fils_Lune': '🌙',
  'Chaman': '🧙',
  'Loup_Garou_Infect': '🧟'
};

console.log('[RolesData] ✓ Roles data initialized with', Object.keys(window.ROLES_DATA.roles).length, 'roles');
