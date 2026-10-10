// ========================================
// SYSTÈME DE LOGGING AVANCÉ - Loup-Garou
// ========================================
// Logs détaillés de chaque action, clique, assignation, etc.

class GameLogger {
  constructor(gmInstance) {
    this.gm = gmInstance;
    this.logs = [];
    this.startTime = Date.now();
    this.eventCount = 0;
    this.colors = {
      action: '#4CAF50',
      click: '#2196F3',
      assignment: '#FF9800',
      death: '#F44336',
      status: '#9C27B0',
      vote: '#FFC107',
      phase: '#00BCD4',
      error: '#E91E63',
      info: '#607D8B'
    };
  }

  // ========== LOGGING HELPERS ==========
  log(type, message, data = {}) {
    this.eventCount++;
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);

    const logEntry = {
      id: this.eventCount,
      type,
      message,
      data,
      timestamp,
      elapsed: `${elapsed}s`,
      state: this.getGameState()
    };

    this.logs.push(logEntry);

    // Afficher dans la console avec couleur
    const color = this.colors[type] || this.colors.info;
    console.group(
      `%c[${this.eventCount}] ${type.toUpperCase()} @ ${timestamp} (${elapsed}s)`,
      `color: white; background-color: ${color}; padding: 4px 8px; border-radius: 3px; font-weight: bold;`
    );
    console.log(`📝 ${message}`);
    if (Object.keys(data).length > 0) {
      console.table(data);
    }
    console.log('🎮 État du jeu:', this.getGameState());
    console.groupEnd();

    return logEntry;
  }

  // ========== ÉVÉNEMENTS SPÉCIFIQUES ==========

  // CLICS
  onButtonClick(buttonId, buttonName, targetElement = null) {
    this.log('click', `Clic sur bouton "${buttonName}"`, {
      buttonId,
      buttonName,
      targetElement: targetElement?.id || targetElement?.name || 'N/A',
      mousePosition: 'détecté',
      eventTime: new Date().toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', millisecond: '3-digit' })
    });
  }

  // ASSIGNATION DE RÔLE
  onPlayerAssigned(playerId, playerName, roleId, roleName) {
    const player = this.gm.state.players?.find(p => p.id === playerId);
    this.log('assignment', `✅ ${playerName} assigné au rôle ${roleName}`, {
      playerId,
      playerName,
      roleId,
      roleName,
      previousRole: player?.roleId || 'aucun',
      allPlayers: this.getPlayerList()
    });
  }

  // AUTO-ASSIGNATION (Voyante)
  onAutoAssignment(playerId, playerName, roleId, roleName, discoveredBy = null) {
    this.log('assignment', `🔮 Auto-assignation: ${playerName} = ${roleName} (découvert par ${discoveredBy || 'système'})`, {
      playerId,
      playerName,
      roleId,
      roleName,
      discoveredBy,
      timestamp: new Date().toISOString(),
      gamePhase: this.gm.state.gameState?.phase || 'unknown',
      allAssignments: this.getAssignmentStatus()
    });
  }

  // MORT D'UN JOUEUR
  onPlayerDeath(playerId, playerName, cause = 'unknown') {
    const player = this.gm.state.players?.find(p => p.id === playerId);
    this.log('death', `☠️  ${playerName} est mort(e) (${cause})`, {
      playerId,
      playerName,
      role: player?.roleId || 'unknown',
      cause,
      turn: this.gm.state.currentTurn || 'unknown',
      phase: this.gm.state.nightPhase ? 'Nuit' : 'Jour',
      aliveCount: this.gm.state.players?.filter(p => !p.isDead).length || 0,
      survivors: this.getAlivePlayers()
    });
  }

  // STATUTS
  onStatusApplied(playerId, playerName, statusId, statusName, details = {}) {
    this.log('status', `✨ ${playerName} reçoit le statut ${statusName}`, {
      playerId,
      playerName,
      statusId,
      statusName,
      details,
      allStatuses: this.getAllStatuses(),
      timestamp: new Date().toISOString()
    });
  }

  onStatusRemoved(playerId, playerName, statusId, statusName) {
    this.log('status', `❌ ${playerName} perd le statut ${statusName}`, {
      playerId,
      playerName,
      statusId,
      statusName,
      remainingStatuses: this.gm.getPlayerStatuses(playerId),
      timestamp: new Date().toISOString()
    });
  }

  // AMOUREUX (Cupidon)
  onLoversCreated(player1Name, player2Name, player1Id, player2Id) {
    this.log('status', `💕 ${player1Name} ❤️  ${player2Name} deviennent Amoureux`, {
      player1: { id: player1Id, name: player1Name },
      player2: { id: player2Id, name: player2Name },
      linkedDeath: 'Si l\'un meurt, l\'autre meurt aussi',
      timestamp: new Date().toISOString()
    });
  }

  // MORT LIÉE (Amoureux)
  onLinkedDeath(deceasedName, partnerName, deceasedId, partnerId) {
    this.log('death', `💔 Mort liée: ${partnerName} meurt car amoureux de ${deceasedName}`, {
      deceased: { id: deceasedId, name: deceasedName },
      partner: { id: partnerId, name: partnerName },
      deathReason: 'Mort liée (Amoureux)',
      timestamp: new Date().toISOString()
    });
  }

  // VOTE
  onVoteStart(turn, dayNumber) {
    this.log('vote', `🗳️  Début du vote - Jour ${dayNumber}`, {
      turn,
      dayNumber,
      aliveCount: this.gm.state.players?.filter(p => !p.isDead).length || 0,
      voters: this.getAlivePlayers()
    });
  }

  onVoteCast(voterName, votedForName, voterId, votedForId, voteWeight = 1) {
    this.log('vote', `${voterName} vote pour ${votedForName} (poids: ${voteWeight})`, {
      voter: { id: voterId, name: voterName },
      votedFor: { id: votedForId, name: votedForName },
      voteWeight,
      hasStatus: this.gm.getPlayerStatuses(voterId),
      timestamp: new Date().toISOString()
    });
  }

  onVoteEnd(winnerName, winnerId, voteCount) {
    this.log('vote', `✅ Vote terminé - ${winnerName} est éliminé(e) (${voteCount} voix)`, {
      winner: { id: winnerId, name: winnerName },
      voteCount,
      role: this.gm.state.players?.find(p => p.id === winnerId)?.roleId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }

  // PHASE
  onPhaseChange(newPhase, newTurn, newNightStatus) {
    this.log('phase', `🌙/☀️  Changement de phase: ${newPhase} (Nuit ${newTurn})`, {
      phase: newPhase,
      turn: newTurn,
      isNight: newNightStatus,
      aliveCount: this.gm.state.players?.filter(p => !p.isDead).length || 0,
      timestamp: new Date().toISOString()
    });
  }

  // VOYANTE
  onVoyanteLook(voyanteName, targetName, targetRole, voyanteId, targetId) {
    this.log('action', `👁️  ${voyanteName} (Voyante) regarde ${targetName}`, {
      voyante: { id: voyanteId, name: voyanteName },
      target: { id: targetId, name: targetName },
      discoveredRole: targetRole,
      autoAssignmentNeeded: !this.gm.state.players?.find(p => p.id === targetId && p.roleId),
      timestamp: new Date().toISOString()
    });
  }

  // ACTIONS DE NUIT
  onNightAction(actorName, actionType, target = null, details = {}) {
    this.log('action', `🌙 ${actorName} (${actionType}) agit sur ${target || 'le groupe'}`, {
      actor: actorName,
      actionType,
      target,
      details,
      turn: this.gm.state.currentTurn || 'unknown',
      timestamp: new Date().toISOString()
    });
  }

  // ========== GETTERS D'ÉTAT ==========

  getGameState() {
    return {
      mode: this.gm.state?.mode || 'unknown',
      players: this.gm.state?.players?.length || 0,
      alive: this.gm.state?.players?.filter(p => !p.isDead).length || 0,
      dead: this.gm.state?.players?.filter(p => p.isDead).length || 0,
      turn: this.gm.state?.currentTurn || 0,
      phase: this.gm.state?.nightPhase ? 'Nuit' : 'Jour',
      gamePhase: this.gm.state?.gameState?.phase || 'unknown'
    };
  }

  getPlayerList() {
    return (this.gm.state?.players || []).map(p => ({
      id: p.id,
      name: p.name,
      role: p.roleId || 'non assigné',
      alive: !p.isDead,
      statuses: Object.keys(this.gm.getPlayerStatuses?.(p.id) || {})
    }));
  }

  getAlivePlayers() {
    return (this.gm.state?.players || [])
      .filter(p => !p.isDead)
      .map(p => ({ name: p.name, role: p.roleId || '?' }));
  }

  getAssignmentStatus() {
    return (this.gm.state?.players || []).map(p => ({
      name: p.name,
      assigned: p.roleId ? '✅' : '❌',
      role: p.roleId || 'en attente'
    }));
  }

  getAllStatuses() {
    const statuses = {};
    (this.gm.state?.players || []).forEach(p => {
      const pStatuses = this.gm.getPlayerStatuses?.(p.id) || {};
      if (Object.keys(pStatuses).length > 0) {
        statuses[p.name] = Object.keys(pStatuses);
      }
    });
    return statuses;
  }

  // ========== EXPORT & AFFICHAGE ==========

  printFullLog() {
    console.group('📋 LOGS COMPLETS');
    console.table(this.logs);
    console.groupEnd();
  }

  printGameSummary() {
    const state = this.getGameState();
    console.group('🎮 RÉSUMÉ DE LA PARTIE');
    console.log(`Événements: ${this.eventCount}`);
    console.log(`Joueurs: ${state.players} (${state.alive} vivants, ${state.dead} morts)`);
    console.log(`Phase: ${state.phase} ${state.turn}`);
    console.table(this.getPlayerList());
    console.groupEnd();
  }

  exportLogs() {
    return {
      eventCount: this.eventCount,
      startTime: new Date(this.startTime).toISOString(),
      duration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`,
      logs: this.logs,
      finalState: this.getGameState(),
      playerStatus: this.getPlayerList()
    };
  }
}

// Instance globale
window.gameLogger = null;

// Initialiser avec le GameMaster
function initializeGameLogger(gmInstance) {
  window.gameLogger = new GameLogger(gmInstance);
  console.log('%c[GameLogger] ✓ Logging system initialized', 'color: green; font-weight: bold;');
  return window.gameLogger;
}

console.log('%c[GameLogger] ✓ Loaded', 'color: green;');
