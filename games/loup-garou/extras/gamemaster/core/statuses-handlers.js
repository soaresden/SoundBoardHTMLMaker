// ========================================
// STATUSES HANDLERS - Interactions complexes
// ========================================
// Gère les événements spécialisés liés aux statuts

class StatusesHandler {
  constructor(gameMaster) {
    this.gm = gameMaster; // Référence au GameMaster
  }

  // ========== ÉVÉNEMENT: UN JOUEUR MEURT ==========
  onPlayerDeath(playerId, deathCause = 'unknown') {
    const player = this.gm.state.players.find(p => p.id === playerId);
    if (!player) return;

    const statuses = this.gm.getPlayerStatuses(playerId);

    console.log(`[StatusesHandler] ${player.name} meurt (${deathCause})`);
    console.log(`  Statuts: ${Object.keys(statuses).join(', ') || 'aucun'}`);

    // AMOUREUX → mort liée immédiate
    if (statuses['Amoureux']) {
      this.handleLoverDeath(playerId, statuses['Amoureux']);
    }

    // MODÈLE → Enfant devient Loup (mais seulement si mort par Loups)
    if (statuses['Modèle'] && deathCause === 'wolf') {
      this.handleIdolDeath(playerId, statuses['Modèle']);
    }

    // MAIRE → Garde Champêtre devient nouveau Maire
    if (this.gm.hasStatus(playerId, 'Maire')) {
      this.handleMayorDeath(playerId);
    }

    // CHARMÉ → Vérifier si Joueur de Flûte a gagné
    if (statuses['Charmé']) {
      this.checkFluteWinCondition();
    }
  }

  // ========== ÉVÉNEMENT: Mort Liée (Amoureux) ==========
  handleLoverDeath(deceasedId, loverData) {
    const partnerId = loverData.partner;
    const deceased = this.gm.state.players.find(p => p.id === deceasedId);
    const partner = this.gm.state.players.find(p => p.id === partnerId);

    if (!partner || partner.isDead) return;

    console.log(`[StatusesHandler] Mort liée: ${partner.name} meurt car amoureux de ${deceased.name}`);

    // Tuer le partenaire
    partner.isDead = true;
    this.gm.recordAction(null, 'linkedDeath', { playerId: partnerId, linkedTo: deceasedId });
    this.gm.addGameLog(
      `💔 <strong>${partner.name}</strong> meurt aussi car il/elle était amoureux(se) de <strong>${deceased.name}</strong>!`
    );

    // Supprimer les deux statuts
    this.gm.removeStatusFromPlayer(deceasedId, 'Amoureux');
    this.gm.removeStatusFromPlayer(partnerId, 'Amoureux');

    // Récursion: si le partenaire a aussi des statuts, les activer
    this.onPlayerDeath(partnerId, 'linked');
  }

  // ========== ÉVÉNEMENT: Mort du Modèle (Idole) ==========
  handleIdolDeath(idolId, modelData) {
    const childId = modelData.child;
    const idol = this.gm.state.players.find(p => p.id === idolId);
    const child = this.gm.state.players.find(p => p.id === childId);

    if (!child || child.isDead) return;

    console.log(`[StatusesHandler] Mort du Modèle: ${child.name} devient Loup car idole ${idol.name} a été tuée`);

    // Changer le rôle de l'Enfant
    const oldRole = child.roleId;
    child.roleId = 'Simple_Loup_Garou';

    this.gm.recordAction(null, 'transformChild', { childId, oldRole, newRole: 'Simple_Loup_Garou' });
    this.gm.addGameLog(
      `🐺 <strong>${child.name}</strong> devient un <strong>Loup-Garou</strong> car son idole <strong>${idol.name}</strong> a été tuée par les Loups!`
    );

    // Retirer le statut Modèle
    this.gm.removeStatusFromPlayer(idolId, 'Modèle');
  }

  // ========== ÉVÉNEMENT: Mort du Maire ==========
  handleMayorDeath(mayorId) {
    const mayor = this.gm.state.players.find(p => p.id === mayorId);

    // Vérifier s'il y a un Garde Champêtre
    const deputyId = Object.keys(this.gm.state.playerStatuses || {}).find(
      pId => this.gm.hasStatus(pId, 'Garde_Champetre')
    );

    if (deputyId) {
      const deputy = this.gm.state.players.find(p => p.id === deputyId);
      this.gm.addStatusToPlayer(deputyId, 'Maire', {});
      this.gm.state.gameState.mayor = deputyId;
      this.gm.removeStatusFromPlayer(deputyId, 'Garde_Champetre');

      this.gm.addGameLog(
        `👑 <strong>${deputy.name}</strong> (ancien Garde Champêtre) devient nouveau Maire!`
      );
    } else {
      this.gm.state.gameState.mayor = null;
      this.gm.addGameLog(`👑 La fonction de Maire est devenue vacante...`);
    }

    this.gm.removeStatusFromPlayer(mayorId, 'Maire');
  }

  // ========== ÉVÉNEMENT: Vérifier victoire du Joueur de Flûte ==========
  checkFluteWinCondition() {
    const flutePlayer = this.gm.state.players.find(p => p.roleId === 'Joueur_Flute');
    if (!flutePlayer || flutePlayer.isDead) return;

    // Compter tous les joueurs vivants et charmés
    const alivePlayers = this.gm.state.players.filter(p => !p.isDead);
    const charmedPlayers = alivePlayers.filter(p => this.gm.hasStatus(p.id, 'Charmé'));

    console.log(`[StatusesHandler] Flute check: ${charmedPlayers.length}/${alivePlayers.length} charmés`);

    if (charmedPlayers.length === alivePlayers.length) {
      this.gm.addGameLog(
        `🎵 <strong>VICTOIRE JOUEUR DE FLÛTE!</strong> ${flutePlayer.name} a enchanté tout le village!`
      );
      return { winner: 'Joueur de Flûte', playerId: flutePlayer.id };
    }
  }

  // ========== ÉVÉNEMENT: Un statut est appliqué ==========
  onStatusApplied(playerId, statusId, statusData) {
    const statusInfo = window.STATUSES_DATA?.statuses?.[statusId];
    const player = this.gm.state.players.find(p => p.id === playerId);

    if (!player || !statusInfo) return;

    console.log(`[StatusesHandler] Statut appliqué: ${player.name} reçoit ${statusInfo.name}`);

    // Infecté → changer le rôle
    if (statusId === 'Infecté') {
      const oldRole = player.roleId;
      player.roleId = 'Simple_Loup_Garou';
      this.gm.addGameLog(
        `🐺 <strong>${player.name}</strong> est maintenant un <strong>Loup-Garou</strong>!`
      );
    }

    // Autres comportements spéciaux selon le statut
    if (statusInfo.specialBehavior) {
      this.handleSpecialBehavior(statusId, statusInfo.specialBehavior, playerId, statusData);
    }
  }

  // ========== COMPORTEMENT SPÉCIAL: Modification de rôle, etc. ==========
  handleSpecialBehavior(statusId, behavior, playerId, statusData) {
    const player = this.gm.state.players.find(p => p.id === playerId);

    switch (behavior) {
      case 'linkedDeath':
        console.log(`[StatusesHandler] Comportement: mort liée de ${player.name}`);
        // Géré par onPlayerDeath
        break;

      case 'roleChange':
        console.log(`[StatusesHandler] Comportement: changement de rôle pour ${player.name}`);
        // Géré par onStatusApplied
        break;

      case 'charmCommunication':
        console.log(`[StatusesHandler] Comportement: ${player.name} peut communiquer avec les Charmés`);
        // À implémenter: créer un groupe de communication
        break;

      case 'transformChild':
        console.log(`[StatusesHandler] Comportement: transformer Enfant sauvage en cas de mort de l'idole`);
        // Géré par onPlayerDeath
        break;

      case 'doubleVote':
        console.log(`[StatusesHandler] Comportement: ${player.name} a 2 voix au vote`);
        // Géré dans getPlayerVoteWeight
        break;

      default:
        console.log(`[StatusesHandler] Comportement inconnu: ${behavior}`);
    }
  }

  // ========== ÉVÉNEMENT: Phase de vote ==========
  onVotingPhase() {
    // Recalculer les poids de vote selon les statuts
    const players = this.gm.state.players.filter(p => !p.isDead);

    const voteWeights = {};
    players.forEach(player => {
      voteWeights[player.id] = this.gm.getPlayerVoteWeight(player.id);
    });

    console.log('[StatusesHandler] Poids de vote:', voteWeights);
    return voteWeights;
  }

  // ========== ÉVÉNEMENT: Fin de nuit ==========
  onNightEnd() {
    console.log('[StatusesHandler] Fin de nuit - vérifier les conditions spéciales');

    // Vérifier infecté par Père des Loups
    const infectedPlayers = Object.keys(this.gm.state.playerStatuses || {}).filter(
      pId => this.gm.hasStatus(pId, 'Infecté')
    );

    // Vérifier les Charmés communicent
    const charmedPlayers = Object.keys(this.gm.state.playerStatuses || {}).filter(
      pId => this.gm.hasStatus(pId, 'Charmé')
    );

    if (charmedPlayers.length > 0) {
      const charmedNames = charmedPlayers
        .map(pId => this.gm.state.players.find(p => p.id === pId)?.name)
        .filter(Boolean)
        .join(', ');
      console.log(`[StatusesHandler] Joueur de Flûte: les Charmés peuvent communiquer: ${charmedNames}`);
    }
  }

  // ========== UTILITAIRES ==========

  getStatusesForPlayer(playerId) {
    return this.gm.getPlayerStatuses(playerId);
  }

  getAllPlayersWithStatus(statusId) {
    return Object.keys(this.gm.state.playerStatuses || {}).filter(pId =>
      this.gm.hasStatus(pId, statusId)
    );
  }

  printStatusSummary() {
    console.log('[StatusesHandler] === RÉSUMÉ DES STATUTS ===');
    Object.keys(this.gm.state.playerStatuses || {}).forEach(playerId => {
      const player = this.gm.state.players.find(p => p.id === playerId);
      const statuses = this.gm.state.playerStatuses[playerId];
      const statusList = Object.keys(statuses).join(', ') || 'aucun';
      console.log(`  ${player?.name}: ${statusList}`);
    });
  }
}

console.log('[StatusesHandler] ✓ Loaded');
