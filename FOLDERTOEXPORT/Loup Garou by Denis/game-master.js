// ========================================
// GAME MASTER - Loup-Garou Manager
// ========================================

class LoupsGarousGameMaster {
  constructor() {
    this.state = {
      mode: 'selectRoles',
      players: [],
      selectedRoles: {},
      gameHistory: [],
      currentTurn: 0,
      nightPhase: true,
      isDead: {},
      playerActions: {},
      tableType: 'circle',              // Type de table: circle, oval-v, oval-h, rect-v, rect-h, square

      // === GAMEPLAY STATE ===
      gameState: {
        mayor: null,                    // ID du maire
        lastVictim: null,               // ID de la dernière victim des loups
        lastVictimRole: null,           // Rôle de la dernière victim
        phase: 'assignment',            // 'assignment', 'day1-election', 'night1-wolves', 'day2+', etc.
        subPhase: null,                 // 'mayor-election', 'wolves-choose', 'revelation', 'voting'
        hasVoted: {},                   // {playerId: true/false} - qui a voté au jour
      }
    };

    this.roles = this.loadRoles();
    this.loadState();
  }

  // ===== ROLES DEFINITION - 39 rôles avec cartes réelles =====
  loadRoles() {
    return {
      // VILLAGEOIS
      'Villageois_Villageois': { category: 'Villageois', power: 'none', nightInstruction: 'Dors.', dayInstruction: 'Vote.', icon: '👨', description: 'Villageois ordinaire. Pas de pouvoir spécial, doit voter pour éliminer les Loups.' },
      'Voyante': { category: 'Villageois', power: 'diviner', nightInstruction: 'Choisis quelqu\'un à vérifier.', dayInstruction: 'Vote.', icon: '🔮', description: 'Chaque nuit, découvre le vrai rôle d\'une personne. Essentielle pour identifier les Loups!' },
      'Chasseur': { category: 'Villageois', power: 'shoot', nightInstruction: 'Dors.', dayInstruction: 'Si tu meurs, tu tires avant.', icon: '🏹', description: 'Si le Chasseur meurt, il peut tuer quelqu\'un avant de partir. Très puissant!' },
      'Sorcière': { category: 'Villageois', power: 'potion', nightInstruction: 'Tu as 2 potions (vie et mort).', dayInstruction: 'Vote.', icon: '🧙‍♀️', description: 'Possède une potion de vie (sauve) et une potion de mort (tue). Chacune utilisable une fois.' },
      'Cupidon': { category: 'Villageois', power: 'couple', nightInstruction: 'Désigne 2 amoureux (1ère nuit seulement).', dayInstruction: 'Vote.', icon: '💘', description: 'La première nuit, crée un couple. Si l\'un meurt, l\'autre aussi (peu importe le camp)!' },
      'Petite_Fille': { category: 'Villageois', power: 'spy', nightInstruction: 'Écoute les Loups 10 secondes.', dayInstruction: 'Vote.', icon: '👧', description: 'Peut écouter les Loups discuter la nuit pour apprendre leurs stratégies.' },
      'Ancien': { category: 'Villageois', power: 'protection', nightInstruction: 'Protège quelqu\'un.', dayInstruction: 'Vote.', icon: '👴', description: 'Chaque nuit, choisit quelqu\'un à protéger des attaques des Loups.' },
      'Bouc_Emissaire': { category: 'Villageois', power: 'none', nightInstruction: 'Dors.', dayInstruction: 'Tu es éliminé en cas d\'égalité.', icon: '🐐', description: 'Si le vote du jour est une égalité parfaite, le Bouc Émissaire est automatiquement éliminé.' },
      'Corbeau': { category: 'Villageois', power: 'vote_boost', nightInstruction: 'Ajoute 2 votes.', dayInstruction: 'Vote.', icon: '🐦‍⬛', description: 'Chaque nuit, son vote du jour suivant compte comme 2 votes au lieu de 1.' },
      'Montreur_Ours': { category: 'Villageois', power: 'scare', nightInstruction: 'L\'ours fait peur.', dayInstruction: 'Vote.', icon: '🐻', description: 'La personne voisine se réveille terrifiée et révèle automatiquement son rôle.' },
      'Salvateur': { category: 'Villageois', power: 'protect', nightInstruction: 'Anticipe une infection.', dayInstruction: 'Vote.', icon: '👼', description: 'Peut protéger quelqu\'un de devenir un Loup si le Père des Loups l\'infecte.' },
      'Servante_Devouee': { category: 'Villageois', power: 'protect', nightInstruction: 'Protège quelqu\'un.', dayInstruction: 'Vote.', icon: '👸', description: 'Protège quelqu\'un la nuit. Si elle meurt, la personne qu\'elle protégeait meurt aussi!' },
      'Idiot_Village': { category: 'Villageois', power: 'die_once', nightInstruction: 'Dors.', dayInstruction: 'Ne meurs pas au vote (sauf révélé).', icon: '🤪', description: 'Immune au vote le jour... SAUF si son rôle est découvert et révélé!' },
      'Ange': { category: 'Villageois', power: 'protect', nightInstruction: 'Protège quelqu\'un.', dayInstruction: 'Vote.', icon: '😇', description: 'Chaque nuit, choisit quelqu\'un à protéger de la mort des Loups.' },
      'Capitaine': { category: 'Villageois', power: 'lead', nightInstruction: 'Dors.', dayInstruction: 'Ton vote compte double.', icon: '⚓', description: 'Leader naturel: son vote vaut le double lors des votes du jour.' },
      'Noctambule': { category: 'Villageois', power: 'night_action', nightInstruction: 'Tu agis la nuit.', dayInstruction: 'Vote.', icon: '🦉', description: 'Reste éveillé la nuit et peut observer ou utiliser un pouvoir spécial.' },

      // LOUPS
      'Simple_Loup_Garou': { category: 'Loups', power: 'kill', nightInstruction: 'Qui tuer?', dayInstruction: 'Cache-toi.', icon: '🐺', description: 'Loup ordinaire. La nuit, élimine un villageois avec les autres Loups.' },
      'Grand_Mechant_Loup': { category: 'Loups', power: 'kill_undetectable', nightInstruction: 'Tu tues. La Voyante ne te détecte pas.', dayInstruction: 'Cache-toi.', icon: '🐺👑', description: 'Loup spécial qui ne peut pas être détecté par la Voyante. Très dangereux!' },
      'Loup_Garou_Blanc': { category: 'Loups', power: 'eliminate', nightInstruction: 'Élimine un autre Loup (ou toi-même).', dayInstruction: 'Cache-toi.', icon: '⚪🐺', description: 'Peut éliminer un autre Loup la nuit pour affaiblir la meute ou se suicider.' },
      'Loup_Garou_Voyant': { category: 'Loups', power: 'see_all', nightInstruction: 'Tu vois TOUS les rôles.', dayInstruction: 'Cache-toi.', icon: '🐺👁️', description: 'Voit le rôle exact de tous les joueurs. Très puissant pour la meute!' },
      'Infect_Pere_Loups': { category: 'Loups', power: 'infect', nightInstruction: 'Infecte quelqu\'un (devient Loup).', dayInstruction: 'Cache-toi.', icon: '🐺👑', description: 'Chaque nuit, peut transformer un villageois en Loup. Augmente la meute!' },

      // SPÉCIAUX
      'Enfant_Sauvage': { category: 'Spécial', power: 'idol', nightInstruction: 'Choisis ton idole (1ère nuit). Si elle meurt, tu deviens Loup.', dayInstruction: 'Vote.', icon: '👦', description: 'Choisit un idole la première nuit. Si l\'idole meurt, devient automatiquement un Loup!' },
      'Renard': { category: 'Spécial', power: 'sniff', nightInstruction: 'Choisis 3 personnes consécutives à sentir.', dayInstruction: 'Vote.', icon: '🦊', description: 'Renifle 3 personnes consécutives chaque nuit pour détecter les Loups.' },
      'Gitane': { category: 'Spécial', power: 'sense', nightInstruction: 'Sens les connexions mystiques.', dayInstruction: 'Vote.', icon: '🔮', description: 'Sent les connexions mystiques entre les gens, révélant des informations cachées.' },
      'Joueur_Flute': { category: 'Spécial', power: 'charm', nightInstruction: 'Choisis 2 personnes qui te suivront.', dayInstruction: 'Vote.', icon: '🎵', description: 'Choisit 2 personnes chaque nuit qui le suivront et seront immunisées.' },
      'Marionnettiste': { category: 'Spécial', power: 'control', nightInstruction: 'Contrôle quelqu\'un.', dayInstruction: 'Vote.', icon: '🎭', description: 'Contrôle quelqu\'un la nuit pour faire ses actions à sa place.' },
      'Voleur': { category: 'Spécial', power: 'steal', nightInstruction: 'Vole le rôle de quelqu\'un.', dayInstruction: 'Vote.', icon: '🎩💨', description: 'Vole le rôle d\'une personne et gagne ses pouvoirs. La victime devient villageois!' },
      'Pyromane': { category: 'Spécial', power: 'mark', nightInstruction: 'Marque quelqu\'un à l\'essence.', dayInstruction: 'Vote.', icon: '🔥', description: 'Marque quelqu\'un chaque nuit. Si 3 marques, la personne brûle et meurt!' },
      'Deux_Soeurs': { category: 'Spécial', power: 'bond', nightInstruction: 'Vous vous connaissez et vous entraider.', dayInstruction: 'Votez ensemble.', icon: '👭', description: 'Deux sœurs qui se connaissent et s\'entraident. Si l\'une meurt, l\'autre aussi!' },
      'Trois_Freres': { category: 'Spécial', power: 'bond', nightInstruction: 'Vous vous connaissez et vous entraider.', dayInstruction: 'Votez ensemble.', icon: '👬', description: 'Trois frères qui se connaissent et s\'entraident. Si l\'un meurt, les autres aussi!' },
      'Ankou': { category: 'Spécial', power: 'death_mark', nightInstruction: 'Marque quelqu\'un pour la mort.', dayInstruction: 'Vote.', icon: '☠️', description: 'La mort elle-même. Marque quelqu\'un pour mourir la nuit suivante.' },
      'Abominable_Sectaire': { category: 'Spécial', power: 'convert', nightInstruction: 'Convertis quelqu\'un.', dayInstruction: 'Vote.', icon: '👹', description: 'Converti quelqu\'un à son culte chaque nuit. Gagne avec lui à la fin!' },
      'Lapin_Blanc': { category: 'Spécial', power: 'event', nightInstruction: 'Tu crées des événements.', dayInstruction: 'Vote.', icon: '🐰', description: 'Crée des événements aléatoires la nuit qui change le cours du jeu!' },
      'Chevalier_Epee_Rouille': { category: 'Spécial', power: 'duel', nightInstruction: 'Tu peux défier quelqu\'un.', dayInstruction: 'Vote.', icon: '⚔️', description: 'Peut défier quelqu\'un en duel. Les conditions du duel décident du résultat.' },
      'Chien_Loup': { category: 'Spécial', power: 'choice', nightInstruction: 'Tu choisis ton camp (Villageois ou Loup).', dayInstruction: 'Vote.', icon: '🐕🐺', description: 'Dès le départ, choisit son camp: reste villageois ou rejoint les Loups!' },
      'Comedien': { category: 'Spécial', power: 'fake', nightInstruction: 'Tu fais semblant.', dayInstruction: 'Vote.', icon: '🎪', description: 'Fait semblant d\'être un rôle. Gagne si ses mensonges ne sont jamais découverts!' },
      'Juge_Begue': { category: 'Spécial', power: 'judge', nightInstruction: 'Tu juges.', dayInstruction: 'Vote.', icon: '⚖️', description: 'Peut juger quelqu\'un la nuit pour déterminer son innocence ou culpabilité.' },
      'Necromancien': { category: 'Spécial', power: 'resurrect', nightInstruction: 'Tu réveilles les morts.', dayInstruction: 'Vote.', icon: '💀', description: 'Ressuscite les morts chaque nuit. Gagne avec les morts réssuscités!' },
    };
  }

  // ===== STATE MANAGEMENT =====
  saveState() {
    localStorage.setItem('loupsGarousGameState', JSON.stringify(this.state));
  }

  loadState() {
    const saved = localStorage.getItem('loupsGarousGameState');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        console.error('Erreur chargement état:', e);
      }
    }
  }

  resetState() {
    this.state = {
      mode: 'selectRoles',
      players: [],
      selectedRoles: {},
      gameHistory: [],
      gameLog: [],
      currentTurn: 0,
      nightPhase: true,
      isDead: {},
      playerActions: {},
      tableType: 'circle',
    };
    this.saveState();
  }

  // ===== GAME LOGGING =====
  addGameLog(text, turn = null) {
    if (!this.state.gameLog) {
      this.state.gameLog = [];
    }
    this.state.gameLog.push({
      turn: turn || `Nuit ${this.getCurrentTurn()}`,
      text: text,
      timestamp: new Date().toLocaleTimeString('fr-FR')
    });
    this.saveState();
  }

  startGameSession() {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR');
    const time = now.toLocaleTimeString('fr-FR');
    this.addGameLog(`🎮 <strong>Début de la partie</strong> - ${date} à ${time}`, 'Démarrage');
  }

  assignRole(playerName, roleName) {
    this.addGameLog(`${playerName} a été assigné au rôle <strong>${roleName}</strong>`);
  }

  cupidoAction(player1Name, player2Name) {
    this.addGameLog(`💘 Cupidon a rendu amoureux <strong>${player1Name}</strong> et <strong>${player2Name}</strong>`);
  }

  voyanteLook(voyanteName, targetName) {
    this.addGameLog(`👁️ ${voyanteName} (Voyante) a regardé <strong>${targetName}</strong>`);
  }

  enfantSauvageIdol(enfantName, idolName) {
    this.addGameLog(`👦 ${enfantName} (Enfant Sauvage) a choisi <strong>${idolName}</strong> comme idole`);
  }

  chienLoupChoice(chienName, choice) {
    const choiceText = choice === 'villageois' ? 'reste <strong>Villageois</strong>' : 'devient <strong>Loup Garou</strong>';
    this.addGameLog(`🐕🐺 ${chienName} (Chien Loup) ${choiceText}`);
  }

  // ===== TYPE 1: SÉLECTION SIMPLE (1 JOUEUR) =====

  sorciereInitialize(sorciereName) {
    this.addGameLog(`🧙‍♀️ ${sorciereName} (Sorcière) prépare ses 2 potions: VIE et MORT`);
  }

  ancienProtect(ancienName, targetName) {
    this.addGameLog(`👴 ${ancienName} (Ancien) protège <strong>${targetName}</strong>`);
  }

  angeProtect(angeName, targetName) {
    this.addGameLog(`😇 ${angeName} (Ange) protège <strong>${targetName}</strong>`);
  }

  servantProtect(servantName, targetName) {
    this.addGameLog(`👸 ${servantName} (Servante) protège <strong>${targetName}</strong>`);
  }

  salvateurAnticipate(salvateurName, targetName) {
    this.addGameLog(`👼 ${salvateurName} (Salvateur) anticipe l'infection de <strong>${targetName}</strong>`);
  }

  marionnetteControl(marionName, targetName) {
    this.addGameLog(`🎭 ${marionName} (Marionnettiste) contrôle <strong>${targetName}</strong>`);
  }

  voleurSteal(voleurName, targetName) {
    this.addGameLog(`🎩 ${voleurName} (Voleur) vole le rôle de <strong>${targetName}</strong>`);
  }

  pyromaneMarque(pyroName, targetName) {
    this.addGameLog(`🔥 ${pyroName} (Pyromane) marque <strong>${targetName}</strong> à l'essence`);
  }

  ankouMarque(ankouName, targetName) {
    this.addGameLog(`☠️ ${ankouName} (Ankou) marque <strong>${targetName}</strong> pour la mort`);
  }

  sectaireConvert(sectaireName, targetName) {
    this.addGameLog(`👹 ${sectaireName} (Sectaire) convertit <strong>${targetName}</strong> à son culte`);
  }

  necromancienResurrect(necroName, targetName) {
    this.addGameLog(`💀 ${necroName} (Nécromancien) ressuscite <strong>${targetName}</strong>`);
  }

  noctambuloAction(noctoName, targetName) {
    this.addGameLog(`🦉 ${noctoName} (Noctambule) agit sur <strong>${targetName}</strong>`);
  }

  // ===== TYPE 2: SÉLECTION PAIRE (2 JOUEURS) =====

  renardSniff(renardName, targetName, wolfCount) {
    let result;
    if (wolfCount === 0) {
      result = `💔 PERTE DE POUVOIR - Aucun Loup Garou détecté!`;
      this.addGameLog(`🦊 ${renardName} (Renard) pointe <strong>${targetName}</strong> → ${result}`);
    } else if (wolfCount === 1) {
      result = `<strong>1 Loup Garou</strong> autour`;
      this.addGameLog(`🦊 ${renardName} (Renard) pointe <strong>${targetName}</strong> → Il y a ${result}`);
    } else if (wolfCount === 2) {
      result = `<strong>2 Loups Garous</strong> autour`;
      this.addGameLog(`🦊 ${renardName} (Renard) pointe <strong>${targetName}</strong> → Il y a ${result}`);
    } else {
      result = `<strong>3 Loups Garous!</strong> autour`;
      this.addGameLog(`🦊 ${renardName} (Renard) pointe <strong>${targetName}</strong> → Il y a ${result}`);
    }
  }

  gitaneConnection(gitaneName, person1, person2) {
    this.addGameLog(`🔮 ${gitaneName} (Gitane) sent une connexion entre <strong>${person1}</strong> et <strong>${person2}</strong>`);
  }

  fluteCharm(fluteName, person1, person2) {
    this.addGameLog(`🎵 ${fluteName} (Joueur Flûte) charme <strong>${person1}</strong> et <strong>${person2}</strong>`);
  }

  // ===== TYPE 5: CONFIRMATIONS =====

  lapinEvent(lapinName) {
    this.addGameLog(`🐰 ${lapinName} (Lapin Blanc) crée un événement aléatoire`);
  }

  corbeauBoost(corbeauName, targetName) {
    this.addGameLog(`🐦‍⬛ ${corbeauName} (Corbeau) vole 2 votes à <strong>${targetName}</strong>`);
  }

  petiteFilleEcoute(filleName) {
    this.addGameLog(`👧 ${filleName} (Petite Fille) écoute les Loups discuter`);
  }

  mayorElected(mayorName) {
    this.addGameLog(`👑 <strong>${mayorName}</strong> a été élu(e) Maire!`);
  }

  // ===== TYPE 6: JUGEMENT =====

  jugeJudge(jugeName, targetName, verdict) {
    const verdictText = verdict === 'innocent' ? 'INNOCENT' : 'COUPABLE';
    this.addGameLog(`⚖️ ${jugeName} (Juge Bègue) juge <strong>${targetName}</strong> → ${verdictText}`);
  }

  wolfKill(wolfName, targetName) {
    this.addGameLog(`🐺 ${wolfName} (Loup-Garou) a tué <strong>${targetName}</strong> la nuit`);
  }

  villageVote(targetName) {
    this.addGameLog(`🗳️ Le village a voté pour éliminer <strong>${targetName}</strong>`);
  }

  witchRevive(witchName, targetName) {
    this.addGameLog(`🧪 ${witchName} (Sorcière) a ressuscité <strong>${targetName}</strong>`);
  }

  witchPoison(witchName, targetName) {
    this.addGameLog(`☠️ ${witchName} (Sorcière) a empoisonné <strong>${targetName}</strong>`);
  }

  sorcierePotions(witchName, vieTarget, mortTarget) {
    // Initialiser l'historique si nécessaire
    if (!this.state.sorcierePotionsHistory) {
      this.state.sorcierePotionsHistory = { vie: false, mort: false };
    }

    if (vieTarget) {
      const playerName = this.state.players.find(p => p.id === vieTarget)?.name || 'quelqu\'un';
      this.addGameLog(`🧪 ${witchName} (Sorcière) a ressuscité <strong>${playerName}</strong>`);
      this.state.sorcierePotionsHistory.vie = true;
    } else if (mortTarget) {
      const playerName = this.state.players.find(p => p.id === mortTarget)?.name || 'quelqu\'un';
      this.addGameLog(`☠️ ${witchName} (Sorcière) a empoisonné <strong>${playerName}</strong>`);
      this.state.sorcierePotionsHistory.mort = true;
    }

    this.saveState();
  }

  checkGrandMechantWolfPower() {
    // Le Grand Mechant Loup ne peut manger que si TOUS les loups sont vivants
    const wolvesRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
    const wolves = this.state.players.filter(p => wolvesRoles.includes(p.role));
    const aliveWolves = wolves.filter(p => !p.isDead);

    // Dès qu'il y a une différence, le Grand Mechant perd son pouvoir
    if (aliveWolves.length < wolves.length) {
      // Un loup est mort: transformer le Grand Mechant en Simple_Loup_Garou
      const grandMechant = this.state.players.find(p => p.role === 'Grand_Mechant_Loup');
      if (grandMechant) {
        grandMechant.role = 'Simple_Loup_Garou';
        this.addGameLog(`🐺 <strong>${grandMechant.name}</strong> (Grand Mechant Loup) a perdu son pouvoir - il est maintenant un Simple Loup-Garou`);
        this.saveState();
      }
    }
  }

  getCurrentTurn() {
    if (!this.state.gameLog || this.state.gameLog.length === 0) return 1;
    const turns = this.state.gameLog
      .filter(e => e.turn && e.turn.includes('Nuit'))
      .map(e => parseInt(e.turn.split('Nuit ')[1]))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);
    return turns.length > 0 ? turns[0] : 1;
  }

  // ===== PLAYER MANAGEMENT =====
  addPlayer(name) {
    const id = `player_${Date.now()}_${Math.random()}`;
    this.state.players.push({ id, name, roleId: null, isDead: false });
    this.saveState();
    return id;
  }

  removePlayer(playerId) {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.saveState();
  }

  setPlayerRole(playerId, roleId) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.roleId = roleId;
      this.saveState();
    }
  }

  getPlayerRole(playerId) {
    const player = this.state.players.find(p => p.id === playerId);
    return player && player.roleId ? this.roles[player.roleId] : null;
  }

  // ===== GAME FLOW =====
  startGame(roleIds) {
    this.state.selectedRoles = roleIds;
    this.state.mode = 'playing';
    this.state.currentTurn = 1;
    this.state.nightPhase = true;
    this.state.gameHistory = [];
    this.saveState();
  }

  nextPhase() {
    if (this.state.nightPhase) {
      this.state.nightPhase = false;
    } else {
      this.state.nightPhase = true;
      this.state.currentTurn++;
    }
    this.saveState();
  }

  getCurrentPhaseInfo() {
    const turn = this.state.currentTurn;
    const isNight = this.state.nightPhase;
    return {
      turn,
      phase: isNight ? 'Nuit' : 'Jour',
      emoji: isNight ? '🌙' : '☀️',
      description: isNight ? `Nuit ${turn}` : `Jour ${turn}`,
    };
  }

  recordAction(playerId, actionType, targetId = null) {
    const action = {
      playerId,
      actionType,
      targetId,
      turn: this.state.currentTurn,
      phase: this.state.nightPhase ? 'night' : 'day',
      timestamp: new Date().toISOString(),
    };
    this.state.gameHistory.push(action);
    this.saveState();
  }

  killPlayer(playerId, reason) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player && !player.isDead) {
      player.isDead = true;
      this.recordAction(null, 'playerDeath', { playerId, reason });
      this.saveState();
    }
  }

  getGameHistory() {
    return this.state.gameHistory;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoupsGarousGameMaster;
}
