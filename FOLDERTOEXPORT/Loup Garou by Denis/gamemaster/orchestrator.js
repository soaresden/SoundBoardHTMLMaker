/**
 * GameMaster Orchestrator
 *
 * Classe minimaliste qui orchestre les phases du jeu.
 * TOUT ce qui est logique métier est dans les fichiers JSON.
 * Cet orchestrateur ne fait que lire les données et les exécuter.
 */

class GameMasterOrchestrator {
  constructor() {
    // Initialiser les données des rôles depuis window.ROLES_DATA si disponible
    const rolesDataFromWindow = (window.ROLES_DATA && window.ROLES_DATA.roles) ? window.ROLES_DATA.roles : {};

    this.state = {
      mode: 'selectRoles',     // Commence par la sélection des cartes
      players: [],             // [{id, name, roleId, isDead, isRevealed}]
      rolesData: rolesDataFromWindow,  // {roleId: roleJSON} - chargé depuis window.ROLES_DATA
      gamePhase: 'setup',      // 'setup', 'assignment', 'firstNightActions', 'night', 'day', 'ended'
      gameSubPhase: null,      // null, 'voting', 'roleReveal', etc.
      currentNightNumber: 1,
      gameLog: [],
      linkedPlayers: {},       // {playerId: linkedPlayerId} pour Cupidon
      infectedPlayers: {},     // {playerId: originalRole} pour Loup Noir
      assignmentMode: null,    // 'tabletPass' ou 'mdj' - sélectionné après choix du mode
    };

    this.gameRules = null;     // Chargé depuis game-rules.json
  }

  /**
   * Getter pour accéder aux rôles (compatibilité avec le code existant)
   * Lit dynamiquement depuis window.ROLES_DATA pour toujours avoir les données à jour
   */
  get roles() {
    // Toujours lire depuis window.ROLES_DATA pour avoir les rôles chargés depuis les JSON
    if (window.ROLES_DATA && window.ROLES_DATA.roles) {
      return window.ROLES_DATA.roles;
    }
    return this.state.rolesData;
  }

  /**
   * Initialise une partie
   * @param {Array} playerNames - Noms des joueurs
   * @param {String} mode - 'assignmentMode' ou 'tabletPassMode'
   */
  async initGame(playerNames, mode = 'assignmentMode') {
    this.state.mode = mode;
    this.state.players = playerNames.map((name, idx) => ({
      id: `player_${idx}`,
      name,
      roleId: null,
      isDead: false,
      isRevealed: false,
      actionTaken: false,
    }));

    // Charger les données des rôles
    await this.loadRolesData();

    this.state.gamePhase = 'assignment';
    this.logAction(`🎮 Partie initialisée en mode ${mode} avec ${playerNames.length} joueurs`);
  }

  /**
   * Charge les données de tous les rôles depuis les JSON
   */
  async loadRolesData() {
    // En mode navigateur, supposer que les rôles sont déjà chargés dans window.ROLES_DATA
    if (window.ROLES_DATA && window.ROLES_DATA.roles) {
      this.state.rolesData = window.ROLES_DATA.roles;
    } else {
      console.error('⚠️ Aucune donnée de rôles chargée. Assurez-vous que les JSON sont loadés.');
    }
  }

  /**
   * Assigne un rôle à un joueur (Mode Assignation uniquement)
   */
  assignRoleToPlayer(playerId, roleId) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`❌ Joueur ${playerId} non trouvé`);
      return false;
    }

    const role = this.state.rolesData[roleId];
    if (!role) {
      console.error(`❌ Rôle ${roleId} non trouvé`);
      return false;
    }

    player.roleId = roleId;
    this.logAction(`📋 ${player.name} a été assigné au rôle ${role.name} (${role.emoji})`);
    return true;
  }

  /**
   * Vérifie si tous les joueurs ont un rôle
   */
  areAllPlayersAssigned() {
    return this.state.players.every(p => p.roleId !== null);
  }

  /**
   * Passe à la première nuit avec les actions spéciales
   */
  startFirstNightActions() {
    if (!this.areAllPlayersAssigned()) {
      console.error('❌ Tous les joueurs doivent être assignés avant de commencer');
      return false;
    }

    this.state.gamePhase = 'firstNightActions';
    this.state.currentNightNumber = 1;
    this.logAction(`🌙 Première nuit - Actions spéciales`);

    // Retourner la liste des rôles qui ont des actions cette nuit
    return this.getRolesWithActionsForPhase('FirstNightActions');
  }

  /**
   * Récupère les rôles qui ont une action pour une phase donnée
   */
  getRolesWithActionsForPhase(phase) {
    const actingRoles = [];

    for (const player of this.state.players) {
      if (player.isDead || !player.roleId) continue;

      const role = this.state.rolesData[player.roleId];
      if (!role || !role.gamePhases) continue;

      const phaseConfig = role.gamePhases.find(p => p.phase === phase && p.enabled);
      if (phaseConfig) {
        actingRoles.push({
          player,
          role,
          phase: phaseConfig,
        });
      }
    }

    return actingRoles;
  }

  /**
   * Enregistre une action jouée
   */
  recordAction(playerId, actionType, targets) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    const role = this.state.rolesData[player.roleId];

    // Récupérer l'action depuis la config du rôle
    const action = this.findActionInRole(role, actionType);

    if (action && action.action.effect) {
      this.applyActionEffect(playerId, action.action.effect, targets);
    }

    player.actionTaken = true;
    this.logAction(`✅ ${player.name} (${role.name}) a complété son action`);
  }

  /**
   * Trouve une action dans la config d'un rôle
   */
  findActionInRole(role, actionType) {
    if (!role.gamePhases) return null;
    return role.gamePhases.find(p => p.action && p.action.type === actionType);
  }

  /**
   * Applique l'effet d'une action
   */
  applyActionEffect(playerId, effect, targets) {
    switch (effect.type) {
      case 'createLink':
        // Cupidon: créer un lien entre deux joueurs
        if (targets && targets.length === 2) {
          this.state.linkedPlayers[targets[0]] = targets[1];
          this.state.linkedPlayers[targets[1]] = targets[0];
        }
        break;

      case 'infect':
        // Loup Noir: infecter quelqu'un
        const targetRole = this.state.players.find(p => p.id === targets[0])?.roleId;
        this.state.infectedPlayers[targets[0]] = targetRole;
        break;

      // Ajouter d'autres types d'effets selon les besoins
    }
  }

  /**
   * Tue un joueur et applique les effets post-mortem
   */
  killPlayer(playerId, reason) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.isDead) return false;

    player.isDead = true;
    this.logAction(`💀 ${player.name} est mort(e) (${reason})`);

    // Appliquer les effets spéciaux (par exemple: si Cupidon meurt, l'autre aussi)
    this.applyDeathEffects(playerId);

    return true;
  }

  /**
   * Applique les effets de mort (amoureux liés, etc)
   */
  applyDeathEffects(deadPlayerId) {
    const linkedPlayerId = this.state.linkedPlayers[deadPlayerId];
    if (linkedPlayerId) {
      const linkedPlayer = this.state.players.find(p => p.id === linkedPlayerId);
      if (linkedPlayer && !linkedPlayer.isDead) {
        this.killPlayer(linkedPlayerId, 'Décès du partenaire lié par Cupidon');
      }
    }
  }

  /**
   * Vérifie les conditions de victoire
   */
  checkWinConditions() {
    const aliveWolves = this.getAlivePlayersWithCamp('Loups-Garous');
    const aliveVillagers = this.getAlivePlayersWithCamp('Village');
    const soloPlayers = this.getAlivePlayersWithCamp('Solo');

    // Condition 1: Tous les loups morts → village gagne
    if (aliveWolves.length === 0 && aliveVillagers.length > 0) {
      return { winner: 'Village', reason: 'Tous les loups-garous sont morts' };
    }

    // Condition 2: Loups >= villageois → loups gagnent
    if (aliveWolves.length >= aliveVillagers.length) {
      return { winner: 'Loups-Garous', reason: 'Les loups-garous dominent le village' };
    }

    // Condition 3: Vérifier les conditions solo
    for (const player of soloPlayers) {
      const role = this.state.rolesData[player.roleId];
      if (role && role.winConditions) {
        for (const condition of role.winConditions) {
          if (this.checkCondition(condition, player.id)) {
            return { winner: player.name, role: role.name, reason: condition.description };
          }
        }
      }
    }

    return null; // Partie continue
  }

  /**
   * Vérifie une condition de victoire
   */
  checkCondition(condition, playerId) {
    switch (condition.type) {
      case 'allCharmed':
        // Joueur de Flûte: tous les joueurs charmés
        return this.state.players.filter(p => !p.isDead && p.id !== playerId).length === 0;

      case 'lastWolf':
        // Loup Blanc: dernier loup survivant
        const aliveWolves = this.getAlivePlayersWithCamp('Loups-Garous');
        return aliveWolves.length === 1 && aliveWolves[0].id === playerId;

      // Ajouter d'autres conditions selon les besoins
    }
    return false;
  }

  /**
   * Récupère les joueurs vivants d'un camp
   */
  getAlivePlayersWithCamp(camp) {
    return this.state.players.filter(p => {
      if (p.isDead) return false;
      const role = this.state.rolesData[p.roleId];
      return role && role.camp === camp;
    });
  }

  /**
   * Enregistre une action dans l'historique
   */
  logAction(message) {
    this.state.gameLog.push({
      timestamp: new Date().toISOString(),
      message,
    });
  }

  /**
   * Récupère l'historique du jeu
   */
  getGameLog() {
    return this.state.gameLog;
  }

  /**
   * Récupère l'état actuel du jeu
   */
  getGameState() {
    return { ...this.state };
  }

  /**
   * Récupère les informations d'un rôle
   */
  getRoleInfo(roleId) {
    if (window.ROLES_DATA && window.ROLES_DATA.roles && window.ROLES_DATA.roles[roleId]) {
      return window.ROLES_DATA.roles[roleId];
    }
    return null;
  }

  /**
   * Récupère les propriétés visuelles d'un rôle
   */
  getRoleVisual(roleId, visualType) {
    const role = this.getRoleInfo(roleId);
    if (!role) return null;

    // Pour les interactions spéciales (lovers, idol, etc.)
    const specialVisuals = {
      'Cupidon': {
        'lovers': { border: '#ff69b4', bg: '#ff1493' }
      },
      'Enfant_Sauvage': {
        'idol': { border: '#ffd700', bg: '#ffed4e' }
      }
    };

    // Vérifier d'abord les interactions spéciales
    if (specialVisuals[roleId]?.[visualType]) {
      return specialVisuals[roleId][visualType];
    }

    // Sinon, retourner les propriétés visuelles du rôle depuis le JSON
    if (role.visual) {
      return {
        background: role.visual.fondColor || role.visual.background || '#4a9d6f',
        border: role.visual.borderColor || '#ffffff',
        emoji: role.visual.emoji,
        emojiColor: role.visual.emojiColor || '#fff'
      };
    }

    return null;
  }

  /**
   * Ajoute un message au journal du jeu
   */
  addLog(message, type = 'info') {
    if (!this.state.gameLog) {
      this.state.gameLog = [];
    }
    this.state.gameLog.push({
      timestamp: new Date().toISOString(),
      message,
      type
    });
  }

  /**
   * Sauvegarde l'état du jeu dans localStorage
   */
  saveState() {
    try {
      const stateToSave = {
        mode: this.state.mode,
        players: this.state.players,
        selectedRoles: this.state.selectedRoles,
        gamePhase: this.state.gamePhase,
        gameSubPhase: this.state.gameSubPhase,
        currentNightNumber: this.state.currentNightNumber,
        assignmentMode: this.state.assignmentMode,
        tableType: this.state.tableType,
        zoneConfig: this.state.zoneConfig,
        // Ne pas sauvegarder rolesData - on la recharge depuis les JSON
      };
      localStorage.setItem('LoupsGarous_GameState', JSON.stringify(stateToSave));
      console.log('[GameMaster] ✓ État sauvegardé');
    } catch (e) {
      console.warn('[GameMaster] Erreur lors de la sauvegarde:', e);
    }
  }

  /**
   * Restaure l'état du jeu depuis localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('LoupsGarous_GameState');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this.state, data);
        console.log('[GameMaster] ✓ État restauré depuis localStorage');
        return true;
      }
    } catch (e) {
      console.warn('[GameMaster] Erreur lors du chargement de l\'état:', e);
    }
    return false;
  }

  /**
   * Réinitialise complètement l'état du jeu
   */
  resetState() {
    this.state.mode = 'selectRoles';
    this.state.players = [];
    this.state.selectedRoles = {};
    this.state.gamePhase = 'setup';
    this.state.gameSubPhase = null;
    this.state.currentNightNumber = 1;
    this.state.assignmentMode = null;
    this.state.gameLog = [];
    this.state.tableType = 'circle';
    this.state.zoneConfig = { top: 0, left: 0, right: 0, bottom: 0 };
    localStorage.removeItem('LoupsGarous_GameState');
    console.log('[GameMaster] ✓ État réinitialisé');
  }
}

// Export pour utilisation
if (typeof window !== 'undefined') {
  window.GameMasterOrchestrator = GameMasterOrchestrator;
  // Alias pour compatibilité avec game-master-init.js
  window.LoupsGarousGameMaster = GameMasterOrchestrator;
}
