/* MGS Board Game — données du guide : FAQ/Errata v1.2, personnages, aide-mémoire.
   Source : Rulebook + FAQ & Errata 1.2 + livre de campagne Shadow Moses. */

window.MGS_FAQ = [
  { cat: "Errata officiels", items: [
    { q: "Psycho Mantis — Codec book", a: "Pendant la mission Psycho Mantis, toute référence au Codec <b>3.14</b> doit être lue comme <b>3.11</b>.", tag: "errata", stage: 8 },
    { q: "Ocelot — carte RELOAD", a: "La capacité <b>RELOAD</b> de la carte Boss d'Ocelot est une <b>Réaction</b> (elle devrait porter l'icône réaction). Une carte corrigée imprimable est fournie dans l'errata.", tag: "errata", stage: 4 },
    { q: "Stage 13 — icônes de la carte", a: "Un seul <b>Barracks</b> dans le Warehouse, quel que soit le nombre de joueurs. Le Barracks avec le Terminal avait perdu son icône <b>2/3/4</b> (Otacon à plus de joueurs). Un icône <b>1</b> en trop a été retiré du Barracks de l'Underground Base. Le guide utilise la page de setup corrigée.", tag: "errata", stage: 13 },
    { q: "Otacon — coût d'Interact", a: "Sur le dashboard d'Otacon, Interact affiche <b>X</b> : c'est une coquille, ça coûte <b>1 action</b> comme pour les autres.", tag: "errata" },
  ]},
  { cat: "Général", items: [
    { q: "Le Codec Book, quand l'utiliser ?", a: "Quand tu veux, gratuitement : dès qu'un composant (carte Équipement, dashboard de boss, tuile, page du livre…) porte un <b>numéro Codec</b>, cherche-le dans le Codec Book pour avoir des détails, des astuces… et parfois un secret. C'est facultatif." },
    { q: "Deux figurines sur la même case ?", a: "Non, jamais. On saute par-dessus (saute-mouton)." },
    { q: "Peut-on modifier un dé au-delà de 1–6 ?", a: "Oui. −2 sur un 2 donne 0, +2 sur un 6 donne 8. Seul le <b>!</b> du dé blanc ne se modifie pas (ce n'est pas un nombre) — mais il peut être relancé." },
    { q: "Rafraîchir un Focus et l'utiliser le même tour ?", a: "Oui, rien ne l'empêche." },
    { q: "Je passe sur un jeton Event pendant un Dash : je m'arrête ?", a: "Non. Tu résous l'Event immédiatement, puis tu continues ton Dash." },
  ]},
  { cat: "Ligne de vue (LOS)", items: [
    { q: "Les figurines bloquent-elles la LOS ?", a: "Non. Ni les joueurs ni les gardes ne bloquent la LOS (on peut aussi tirer à travers les figurines)." },
    { q: "Un garde de profil dans ma colonne me voit-il ?", a: "Non. Il doit <b>regarder vers</b> la rangée/colonne où tu es. Et même s'il te regarde, la « boîte » entre vous deux ne doit traverser aucun mur (ligne rouge ou noire épaisse)." },
    { q: "Les caméras suivent les mêmes règles ?", a: "Oui, comme un garde posé sur sa case, orienté selon la couleur visible du jeton Camera Facing (orange ou vert). Une caméra ne voit <b>pas sa propre case</b> : profites-en." },
  ]},
  { cat: "Attention & bruit", items: [
    { q: "Je fais du bruit, je change de zone, puis je fais un ! au noise check ?", a: "Le jeton Attention arrive <b>là où tu es maintenant</b>, pas là où tu as fait le bruit." },
    { q: "Ascenseur avec mon jeton Attention dedans ?", a: "Il te suit dans la zone suivante." },
    { q: "Pas de garde dans ma zone : noise check ?", a: "Pas de garde = pas de noise check. Ton jeton Attention reste où il est tant qu'on ne te dit pas de l'enlever." },
    { q: "Knock alors que mon jeton est déjà sur ! ?", a: "Il reste sur <b>!</b>. Knock le déplace juste sur ta case." },
  ]},
  { cat: "IA des gardes", items: [
    { q: "Un garde réveillé active-t-il ce tour-ci ?", a: "Réveillé pendant la section I (Guard Action) : <b>oui</b>, il s'active normalement. Réveillé par une carte Guard Reaction : <b>non</b>." },
    { q: "L'activation d'un garde change-t-elle le mode d'un autre ?", a: "Oui. Chaque garde détermine son mode <b>au début de sa propre activation</b>. Si un garde plus loin bouge d'abord et devient le plus proche de ton ?, l'autre reste en patrouille." },
    { q: "Un garde peut-il changer de mode en cours d'activation ?", a: "Non. Le mode est fixé au début. Un garde en Patrouille qui aperçoit un garde KO continue sa patrouille." },
    { q: "Garde en Alerte qui arrive sur mon !", a: "Il s'arrête immédiatement et résout une Guard Reaction. En mode Alerte il ignore les flèches de rotation de la carte. Il garde son orientation (sauf s'il fait face à un mur)." },
    { q: "Plus court chemin et saute-mouton ?", a: "On compte uniquement les cases. À égalité, le chemin avec le <b>moins de virages</b>. Un saute-mouton (même par-dessus plusieurs gardes) = 1 seul mouvement, et ça marche dans les coins." },
    { q: "Quand utiliser la flèche bleue de la carte Guard Order ?", a: "Seulement s'il y a un chemin possible à gauche ET à droite (ex. face à un mur). Un seul côté possible → il l'ignore. La flèche est du point de vue <b>du garde</b> : droite = sens horaire." },
    { q: "Je saute par-dessus un garde : il se tourne vers moi ?", a: "Non. Il t'attaque mais ne tourne pas. Tu poses ton jeton ! à la fin du saut." },
    { q: "Quand les gardes attaquent-ils ?", a: "Pendant leur activation en Phase Ennemie, ou quand tu leur sautes par-dessus pendant ton tour." },
    { q: "Où apparaissent les gardes dans le Barracks ?", a: "Sur la case avec l'icône <b>Radio</b>. Si elle est occupée : règle « Spawning a Guard » (case adjacente libre)." },
    { q: "Plus de cartes Guard Reaction ?", a: "Retourne la défausse face cachée pour refaire une pioche." },
    { q: "« Révèle une carte Guard Order et mets-la dessous » ?", a: "On ne l'active pas : on la révèle juste au cas où ce serait la carte Game Over. Ça rapproche de l'échec." },
  ]},
  { cat: "Personnages", items: [
    { q: "Meryl déguisée", a: "Tant qu'ils ne se méfient pas, les gardes la traitent comme l'un des leurs, et peuvent même lui sauter par-dessus." },
    { q: "Otacon peut-il aider avec ses Focus ?", a: "Oui : <b>Codec Call</b> — dès qu'un coéquipier lance des <b>dés noirs</b>, Otacon peut utiliser ses 4 Focus dessus, y compris +1 dé noir." },
    { q: "Otacon doit-il hacker un Terminal pour les cartes System de Boss ?", a: "Non, en Boss il est déjà connecté au Terminal de sa case : il pioche et active les cartes avec System Search / Access Systems." },
  ]},
  { cat: "Boss & VR", items: [
    { q: "Réaction de boss : à chaque fois ou une fois ?", a: "<b>À chaque fois</b> que la condition est remplie, immédiatement." },
    { q: "Porte verrouillée niveau 4 seul ?", a: "Un coéquipier à 2 cases ou moins peut t'aider avec ses Focus (y compris un dé blanc de plus) ; Otacon via Codec Call." },
    { q: "Missions VR : combien de joueurs ? quels persos ?", a: "1 à 4 joueurs, <b>n'importe quelle combinaison</b> de personnages (même Otacon seul)." },
    { q: "Un boss VR utilise son deck Boss ?", a: "Non : il suit les règles de la face <b>verte (VR)</b> de son dashboard. Le nombre de dés varie selon le boss. S'il te voit, il déclenche l'alarme." },
  ]},
  { cat: "Armes & équipement", items: [
    { q: "Le SOCOM n'a pas de compteur de munitions ?", a: "Pas de compteur sur la carte = munitions illimitées." },
    { q: "Une attaque peut toucher plusieurs ennemis ?", a: "Non, sauf si la carte d'équipement le dit explicitement." },
    { q: "Tirer à travers les figurines ?", a: "Oui, les figurines ne bloquent pas la LOS des armes à feu." },
    { q: "Faire exploser un C4 en tirant dessus ?", a: "Non." },
    { q: "Un équipement débloqué consommé est perdu ?", a: "Seulement pour le Stage en cours. Tu le récupères pour les missions suivantes." },
  ]},
  { cat: "Questions par Stage", items: [
    { q: "Stage 2 — Event B sans être vu ?", a: "Impossible : la caméra voit toujours Event B (tu peux entrer sur sa case mais elle t'aura vu avant). C'est un objectif <b>optionnel</b>.", stage: 2 },
    { q: "Stage 3 — 12 gardes vaincus : fin immédiate ?", a: "Oui, Stage terminé tout de suite, pas besoin d'Event C ni de sortie.", stage: 3 },
    { q: "Stage 3 — qui doit sortir avec le marqueur C ?", a: "N'importe lequel des joueurs (Snake ou Meryl), pas forcément celui qui l'a pris.", stage: 3 },
    { q: "Stage 4 — Ocelot « s'éloigne du joueur actif »", a: "Il prend le chemin qui met le plus de distance entre vous… ce qui peut parfois le rapprocher dans l'autre sens.", stage: 4 },
    { q: "Stage 6 — les gardes peuvent tirer en L1 et Truck ?", a: "Oui ! La No Fire Zone ne s'applique qu'aux joueurs (les gardes ont des combinaisons anti-radiations).", stage: 6 },
    { q: "Stage 6 — tout le monde peut utiliser le Nikita ?", a: "Non, seul celui qui l'a ramassé en Nuke Building B1.", stage: 6 },
    { q: "Stage 6 — le missile Nikita reste en place ?", a: "Oui : il ne bouge que si tu dépenses une action pour le guider. Tu peux faire autre chose entre-temps.", stage: 6 },
    { q: "Stage 6 — Nuke Building B1 : murs saillants et LOS", a: "Ignore les murs dessinés qui débordent : si une figurine peut traverser la case, la LOS passe.", stage: 6 },
  ]},
];

window.MGS_CHARS = [
  { id: "snake", name: "Snake", emoji: "🐍", color: "#4aa3ff", from: "Stage 1",
    stats: { equip: 3, def: 3, hp: 4 }, statsSure: true,
    start: "Aucun — « On-site procurement » (il trouve tout sur place).",
    actions: [
      ["Silent Takedown", "2", "Derrière un garde adjacent (dans son dos) : remplace-le par un jeton <b>Mort</b>. Silencieux."],
    ],
    abilities: [
      ["Sneak Attack", "1×/round, après avoir infligé des dégâts à une cible dont tu es <b>derrière</b> (même rangée/colonne), +1 dégât du même type."],
      ["« I work alone »", "1×/round, si aucun joueur à 2 cases ou moins : +/−1 sur un dé quand tu utilises une arme."],
    ],
    focus: ["Relance 1 dé", "+2 à 1 dé", "−2 à 1 dé", "Lance 1 dé de moins <i>ou</i> bouge d'1 case"],
  },
  { id: "meryl", name: "Meryl", emoji: "🔫", color: "#ff6b8a", from: "Stage 3",
    stats: null,
    start: "Défense 3 (exemple du livret). Handgun (.50 Cal) + Light Assault Rifle (munitions sur la carte). Carte Disguise Reference + figurine Meryl déguisée (Sneaking stages).",
    actions: [
      ["Gain Disguise", "2", "Adjacente à un garde <b>KO</b> ou <b>Mort</b> et ton jeton Attention n'est pas sur la carte : remplace ta figurine par Meryl déguisée."],
    ],
    abilities: [
      ["Déguisée", "Gardes et caméras la traitent comme un garde (ils peuvent même lui sauter par-dessus). Elle reprend sa vraie figurine si son ! est posé, si elle attire l'attention dans la LOS d'un garde/caméra, ou si elle fait autre chose que Sneak, Dash ou Focus dans leur LOS. « Une femme garde ? » : dans la LOS d'un garde adjacent, lance 2 dés blancs — un ! et elle attire l'attention. (Carte Disguise Reference.)"],
      ["2 capacités spéciales", "En bas de son dashboard (lis-les au setup)."],
    ],
    focus: ["+2 à 1 dé", "+/−1 à 1 dé", "Gagne 1 action ce tour", "Lance +1 dé blanc (avant ou après le jet)"],
  },
  { id: "otacon", name: "Otacon", emoji: "🤓", color: "#ffd166", from: "Stage 9",
    stats: null,
    start: "ADV Stealth Camouflage + Rations. Deck System (standard en infiltration, spécifique en boss).",
    actions: [
      ["Hack Terminal", "1", "Terminal sur ta case ou adjacent : lance <b>4 dés noirs</b> (+ bonus). Refais l'action pour relancer autant de dés que tu veux. Quand tu obtiens la combinaison du Terminal → piraté (retourne-le). Tout dans <b>le même tour</b>, sans t'éloigner."],
      ["System Search", "1", "Sur/adjacent à un Terminal piraté : pioche 1 carte System (max 3 en main, la 4e repart dessus/dessous du deck)."],
      ["Access Systems", "1", "Sur/adjacent à un Terminal piraté avec au moins 1 carte System : lance jusqu'à 4 dés noirs et place chaque dé sur un emplacement de même valeur. Les dés restent d'un round à l'autre. Carte pleine → résous l'effet (niveau ≤ celui du Terminal), puis carte sous le deck."],
    ],
    abilities: [
      ["« I'm no soldier »", "Ne peut pas utiliser d'armes."],
      ["Codec Call", "Peut utiliser ses Focus sur les dés noirs lancés par un coéquipier."],
      ["Hacker", "En piratant ou en accédant aux systèmes, lance jusqu'à +2 dés blancs."],
      ["Déconnexion", "S'il s'éloigne du Terminal piraté : tous les dés sur les cartes System sont perdus, les cartes retournent dans le deck."],
    ],
    focus: ["+/−1 à 1 dé", "+/−2 à 1 dé", "Relance 1 dé noir", "+1 dé noir (avant ou après)"],
  },
  { id: "fox", name: "Gray Fox", emoji: "🥷", color: "#b8f7c8", from: "Stage 9",
    stats: null,
    start: "Stealth Camouflage + High-Frequency Blade + Arm Cannon.",
    actions: [],
    abilities: [
      ["« Hurry, get away! »", "1×/round, quand une figurine adjacente est attaquée, tu peux devenir la cible à sa place."],
      ["Cornered Fox", "Chaque fois que tu subis des dégâts, tu peux mettre 1 jeton charge/munition sur un de tes équipements."],
      ["« I'm losing myself »", "Pas d'action Focus tant que ton jeton ! est dans ta zone."],
    ],
    focus: ["+2 à 1 dé", "+/−2 à 1 dé", "Lance 1 dé noir de moins", "Dash : +2 cases"],
  },
];

window.MGS_ACTIONS = [
  { id: "sneak", name: "Sneak", fr: "Se faufiler", cost: 1, icon: "🚶", desc: "Bouge d'1 case (jamais en diagonale)." },
  { id: "dash", name: "Dash", fr: "Courir", cost: 1, noisy: true, icon: "🏃", desc: "Bouge de 2 cases. <b>Bruyant</b> 🔊." },
  { id: "h2h", name: "Hand-to-Hand", fr: "Corps-à-corps", cost: 1, icon: "👊", desc: "Attaque une figurine adjacente : 1 dé blanc, dégâts <b>KO</b>." },
  { id: "combo", name: "Combo Attack", fr: "Combo", cost: 2, icon: "🥊", desc: "Attaque adjacente : 2 dés blancs + 1 noir, dégâts <b>KO</b>." },
  { id: "focus", name: "Focus", fr: "Focus", cost: "X", icon: "🎯", desc: "Rafraîchit un jeton Focus grisé (X = coût écrit dessus)." },
  { id: "drag", name: "Drag Body", fr: "Traîner un corps", cost: 1, noisy: true, icon: "🫳", desc: "Prends un jeton KO/Mort sur ta case ou adjacent, bouge d'1 case, pose-le à côté. 🔊" },
  { id: "interact", name: "Interact", fr: "Interagir", cost: 1, icon: "🖐️", desc: "Ascenseur, porte verrouillée, objet avec la main. Verrou : lance 1 blanc + 2 noirs (Snake), relance en refaisant l'action." },
  { id: "knock", name: "Knock", fr: "Toquer", cost: 1, icon: "✊", desc: "Attire l'attention sur ta case (jeton ? posé, ou déplacé s'il est déjà là)." },
  { id: "silent", name: "Silent Takedown", fr: "Élimination silencieuse", cost: 2, icon: "🤫", desc: "Snake uniquement : derrière un garde adjacent → jeton Mort." },
];

window.MGS_REF = [
  { t: "Début du round", d: "Chaque joueur reprend ses 4 jetons Action." },
  { t: "Phase Joueurs", d: "Dans l'ordre que vous voulez, un joueur à la fois, tour complet. Jusqu'à 4 actions (même action plusieurs fois OK, coût payé à chaque fois). Fin de tour : <b>noise check</b> si un garde est dans ta zone → 1 dé blanc par jeton posé sur une action 🔊. Un ! = attention sur ta case." },
  { t: "Phase Ennemie — Boss", d: "Pioche la carte du dessus du deck Boss, résous-la (+ règles du dashboard), remets-la <b>sous</b> le deck. Jamais mélangé." },
  { t: "Phase Ennemie — Infiltration", d: "Pioche une carte Guard Order (Game Over = échec). Résous : <b>I</b> Guard Action → <b>II</b> Caméras → <b>III</b> Activer les gardes." },
  { t: "I · Waken Guard (zones actives)", d: "Jeton KO 1★ → garde debout. Puis les KO 2★ passent à 1★." },
  { t: "I · Radio-In (zones actives)", d: "Moins de gardes que le Guard Count du Barracks ? Fais apparaître la différence sur l'icône radio, un par un." },
  { t: "I · Lost Contact (toutes zones)", d: "Pour chaque 3 jetons Mort sur la carte : révèle la carte Guard Order du dessus et mets-la dessous." },
  { t: "I · Stay Alert (zones actives)", d: "Tout joueur à 2 cases ou moins d'un garde (sans obstacle) pose son jeton ? sous lui (s'il n'est pas déjà sur la carte)." },
  { t: "II · Caméras", d: "Retourne le jeton Camera Facing si indiqué, puis vérifie la LOS de toutes les caméras." },
  { t: "III · Activer les gardes", d: "Zones actives, en commençant par la plus proche du jeton Guard Priority (= coin haut-gauche) ; de haut en bas, de gauche à droite." },
  { t: "Mode ALERTE", d: "Il y a un ! dans la zone du garde → il fonce vers le ! le plus proche, jusqu'au chiffre <b style='color:#ff5a5a'>ROUGE</b>, par le plus court chemin." },
  { t: "Mode INVESTIGATION", d: "Pas d'alerte, et il est le garde le plus proche d'un ? (ou voit un KO/Mort, lui ou une caméra de sa zone) → il y va, chiffre <b style='color:#4aa3ff'>BLEU</b>." },
  { t: "Mode PATROUILLE", d: "Sinon : tout droit, chiffre <b style='color:#4aa3ff'>BLEU</b>. Flèche de rotation au sol : il tourne. Bloqué : il cherche un nouveau chemin (flèche bleue de la carte si gauche ET droite possibles)." },
  { t: "Fin de mouvement", d: "Le garde s'arrête dès qu'il attaque, qu'il entre sur un jeton (Attention, KO, Mort → Guard Reaction) ou qu'il ne peut plus avancer. Attaque : le joueur lance 2 dés noirs contre sa propre Défense." },
  { t: "Échec du Stage", d: "Un joueur est KIA (santé à 0), la carte Game Over est révélée, ou condition d'échec du Stage." },
];
