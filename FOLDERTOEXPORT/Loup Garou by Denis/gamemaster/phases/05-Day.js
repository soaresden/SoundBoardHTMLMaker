// ========================================
// JOUR - VOTE ET DÉBAT
// ========================================

let dayTimerInterval = null;
let dayTimerSeconds = 0;

// ===== FIN DE PARTIE =====
function renderGameEnd(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const winners = gm.state.gameState?.winners || 'Unknown';
  const details = gm.state.gameState?.endDetails || 'Partie terminée';

  // Déterminer la couleur et l'émoji basés sur les gagnants
  let bgColor, textColor, emoji;
  if (winners === 'Village') {
    bgColor = 'linear-gradient(135deg, rgba(74, 157, 111, 0.3), rgba(102, 217, 153, 0.3))';
    textColor = '#66d999';
    emoji = '👥 ☀️';
  } else if (winners === 'Loups') {
    bgColor = 'linear-gradient(135deg, rgba(139, 58, 58, 0.3), rgba(212, 102, 102, 0.3))';
    textColor = '#ff9999';
    emoji = '🐺 🌙';
  } else {
    bgColor = 'linear-gradient(135deg, rgba(100, 100, 150, 0.3), rgba(150, 150, 200, 0.3))';
    textColor = '#81dff7';
    emoji = '⚔️';
  }

  // Compter les morts par rôle
  const deadRoleCounts = {};
  const livingRoleCounts = {};
  players.forEach(p => {
    if (p.isDead) {
      deadRoleCounts[p.roleId || '?'] = (deadRoleCounts[p.roleId || '?'] || 0) + 1;
    } else {
      livingRoleCounts[p.roleId || '?'] = (livingRoleCounts[p.roleId || '?'] || 0) + 1;
    }
  });

  const deadPlayers = players.filter(p => p.isDead);
  const livingPlayers = players.filter(p => !p.isDead);

  return `
    <div style="display:flex; flex-direction:column; max-height:100vh; overflow:hidden; background:${bgColor}; color:#e8e8f0; font-family:Arial,sans-serif;">
      <!-- HEADER -->
      <div style="padding:16px; text-align:center; border-bottom:2px solid ${textColor}; flex:0 0 auto;">
        <div style="font-size:32px; margin-bottom:8px;">${emoji}</div>
        <h1 style="margin:0; font-size:20px; color:${textColor}; font-weight:bold;">
          ${winners === 'Village' ? '🏆 LE VILLAGE A GAGNÉ!' : winners === 'Loups' ? '🏆 LES LOUPS ONT GAGNÉ!' : '⚔️ MATCH NUL!'}
        </h1>
        <div style="font-size:12px; color:#aaa; margin-top:8px;">${details}</div>
      </div>

      <!-- CONTENU -->
      <div style="flex:1; overflow-y:auto; padding:16px; display:flex; gap:16px;">
        <!-- SURVIVANTS -->
        <div style="flex:1; background:rgba(100,200,100,0.2); border:1px solid rgba(100,200,100,0.4); border-radius:6px; padding:12px;">
          <h2 style="margin:0 0 12px 0; color:#66d999; font-size:13px; font-weight:600;">✓ SURVIVANTS (${livingPlayers.length})</h2>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${livingPlayers.length > 0 ? livingPlayers.map(p => `
              <div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:4px; font-size:11px;">
                <strong>${p.name}</strong><br>
                <span style="color:#aaa; font-size:10px;">🎭 ${p.roleId || '?'}</span>
              </div>
            `).join('') : '<div style="font-size:11px; color:#aaa; text-align:center; padding:12px;">Aucun survivant...</div>'}
          </div>
        </div>

        <!-- MORTS -->
        <div style="flex:1; background:rgba(212,102,102,0.2); border:1px solid rgba(212,102,102,0.4); border-radius:6px; padding:12px;">
          <h2 style="margin:0 0 12px 0; color:#ff9999; font-size:13px; font-weight:600;">☠️ MORTS (${deadPlayers.length})</h2>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${deadPlayers.length > 0 ? deadPlayers.map(p => `
              <div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:4px; font-size:11px;">
                <strong>${p.name}</strong><br>
                <span style="color:#aaa; font-size:10px;">🎭 ${p.roleId || '?'}</span>
              </div>
            `).join('') : '<div style="font-size:11px; color:#aaa; text-align:center; padding:12px;">Personne...</div>'}
          </div>
        </div>
      </div>

      <!-- BOUTONS -->
      <div style="padding:12px; border-top:1px solid rgba(199,125,255,0.3); background:rgba(0,0,0,0.3); flex:0 0 auto; display:flex; gap:8px;">
        <button id="gmBtnNewGame" style="flex:1; background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:10px;">
          🔄 Nouvelle Partie
        </button>
        <button id="gmBtnGameLog" style="flex:1; background:rgba(100,100,200,0.3); border:1px solid rgba(100,150,200,0.5); padding:8px; border-radius:4px; color:#81dff7; font-weight:600; cursor:pointer; font-size:10px;">
          📖 Journal Complet
        </button>
      </div>
    </div>
  `;
}

function renderDay(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const currentTurn = gm.state.currentTurn || 1;
  const livingPlayers = players.filter(p => !p.isDead);
  const deadPlayers = players.filter(p => p.isDead);
  const dayVote = gm.state.gameState?.dayVoteTarget || null;

  // ===== PHASE 0: FIN DE PARTIE =====
  if (gm.state.gameState?.phase === 'game-end') {
    return renderGameEnd(gameUI);
  }

  // ===== PHASE 0.5: ACTIONS POSTHUMES =====
  if (gm.state.gameState?.phase === 'postmortem-actions') {
    const postMortemPlayers = gm.getPostMortemRolesNeedingAction();
    if (postMortemPlayers.length > 0) {
      return renderPostMortemAction(gameUI, postMortemPlayers[0]);
    } else {
      // Plus d'actions posthumes, passer au vote
      gm.state.gameState.phase = 'day-voting';
      gm.saveState();
      return renderDebatePhase(gameUI, livingPlayers, currentTurn, dayVote);
    }
  }

  // ===== PHASE 1: ANNONCE DES MORTS =====
  if (!gm.state.gameState?.deathsAnnounced) {
    return renderDeathsAnnouncement(gameUI, deadPlayers, currentTurn);
  }

  // ===== PHASE 2: DÉBAT & VOTE =====
  if (gm.state.gameState?.phase === 'day1-voting' || gm.state.gameState?.phase === 'day-voting') {
    return renderDebatePhase(gameUI, livingPlayers, currentTurn, dayVote);
  }

  // ===== PHASE 3: RÉSULTAT DU VOTE =====
  if (gm.state.gameState?.phase === 'day-result') {
    return renderVoteResult(gameUI, currentTurn);
  }

  // ===== PHASE 4: NUIT =====
  if (gm.state.gameState?.phase === 'night-coming') {
    return renderNightComing(gameUI, currentTurn);
  }

  return `<div style="padding:20px; color:#e8e8f0;">Chargement...</div>`;
}

// ===== ANNONCE DES MORTS =====
function renderDeathsAnnouncement(gameUI, deadPlayers, turn) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];

  // Log deaths announcement if not already logged
  if (!gm.state.gameState?.deathsLogged) {
    const prevNightNum = turn - 1;
    const nightTag = `[Nuit${prevNightNum}]`;

    if (deadPlayers.length > 0) {
      deadPlayers.forEach(player => {
        const cause = getDeathCauseFromHistory(gm, player);
        gm.addGameLog(`☠️ ${player.name} (${player.roleId || '?'}) - ${cause}`, nightTag);
      });
    } else {
      gm.addGameLog(`✨ La nuit s'est déroulée sans victimes...`, nightTag);
    }

    gm.state.gameState.deathsLogged = true;
  }

  // === GÉNÉRER LA TABLE (même structure que 03-FirstNight.js) ===
  const result = gameUI.generatePositionsByTableType(players.length, gm.state.tableType || 'circle');
  const defaultPositions = result.positions;
  const tableCenter = result.center;
  const scale = 240 / 300;
  const containerCenter = 120;

  const playerPoints = players.map((p, idx) => {
    const posX = defaultPositions[idx].x - tableCenter.x;
    const posY = defaultPositions[idx].y - tableCenter.y;
    const x = containerCenter + (posX * scale);
    const y = containerCenter + (posY * scale);

    let dotColor, dotBorder, boxShadow;

    if (p.isDead) {
      // Joueurs morts: gris foncé
      dotColor = '#333333';
      dotBorder = '#666666';
      boxShadow = 'none';
    } else {
      // Joueurs vivants: couleur du rôle
      const roleColor = gm.getRoleColor(p.roleId);
      dotColor = roleColor.bg;
      dotBorder = roleColor.border;
      boxShadow = 'none';
    }

    // Amoureux (Cupidon): charger depuis JSON
    const lovers = gm.state.cupidoSelection || [];
    const isLover = lovers.includes(p.id);

    let finalBgColor = dotColor;
    let finalBorderColor = dotBorder;
    let finalBorderWidth = '2px';
    let finalBoxShadow = boxShadow;

    if (isLover) {
      const loverVisual = gm.getRoleVisual('Cupidon', 'lovers');
      finalBorderColor = loverVisual?.border || '#ff69b4';
      finalBorderWidth = loverVisual?.borderWidth || '3px';
    }

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${x}px; top: ${y}px; position:absolute; cursor:pointer;">
        <div class="gm-point-dot" style="background:${dotColor}; border:${finalBorderWidth} solid ${finalBorderColor}; box-shadow:${finalBoxShadow};"></div>
        <div class="gm-point-name">${p.isDead ? '💀 ' : ''}${p.name}</div>
      </div>
    `;
  }).join('');

  const nightSummary = generateNightEventsSummary(gm);

  let deathsHtml = '';
  deadPlayers.forEach((player, idx) => {
    const cause = getDeathCauseFromHistory(gm, player);
    deathsHtml += `<div style="padding:6px; margin:4px 0; background:rgba(255,50,50,0.15); border-left:3px solid #ff3333; border-radius:3px; font-size:8px;">
      <div style="color:#ff9999; font-weight:600;">☠️ ${player.name}</div>
      <div style="color:#ddd; margin-top:2px;">${cause}</div>
      <div style="color:#888; margin-top:2px;">Role: ${player.roleId || '?'}</div>
    </div>`;
  });

  return `
    <div style="display:flex; flex-direction:column; max-height:65vh; overflow:hidden; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif; position:relative;">
      <!-- HEADER -->
      <div style="padding:8px; background:linear-gradient(135deg, rgba(255,200,50,0.2), rgba(100,100,200,0.2)); border-bottom:2px solid rgba(255,200,50,0.3); flex:0 0 auto;">
        <h2 style="margin:0; color:#ffcc66; font-size:11px;">☀️ JOUR ${turn} - CONSTAT DE LA NUIT</h2>
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div style="flex:1; display:flex; position:relative; overflow:hidden;">

        <!-- GAUCHE: TABLE (POSITION ABSOLUTE, 33% width) -->
        <div style="position:absolute; left:0; top:0; width:33%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); border-right:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:1px; margin:1px;">
          <div style="position:relative; display:inline-block;">
            <div style="position:relative; display:inline-block; width:240px; height:240px;">
              <div style="position:relative; width:140px; height:140px; background:rgba(120, 85, 60, 0.6); border:3px solid var(--gm-border, rgba(199,125,255,0.4)); box-shadow:inset 0 2px 8px rgba(0,0,0,0.5); position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.3; font-size:24px;">🪵</div>
              </div>
              <div style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%);">
                ${playerPoints}
              </div>
            </div>
          </div>
        </div>

        <!-- DROITE: ÉVÉNEMENTS ET VICTIMES (MARGIN-LEFT: 33%) -->
        <div style="margin-left:33%; display:flex; flex-direction:column; width:67%; overflow:hidden;">
          <div style="flex:1; overflow-y:auto; padding:10px; font-size:8px;">
            <div style="padding:6px; background:rgba(100,100,150,0.1); border-radius:3px; margin-bottom:6px; border-left:3px solid #81dff7; line-height:1.4;">
              ${nightSummary}
            </div>
            <div style="font-weight:600; color:#ffaa44; margin-bottom:4px; font-size:9px;">☠️ Victimes:</div>
            ${deadPlayers.length > 0 ? deathsHtml : '<div style="padding:6px; color:#888; text-align:center;">Personne n\'a péri cette nuit...</div>'}
          </div>
        </div>
      </div>

      <!-- BOUTON SUITE -->
      <div style="padding:8px; border-top:2px solid rgba(199,125,255,0.2); flex:0 0 auto;">
        <button id="gmBtnDeathsOk" style="width:100%; background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
          ✓ Débat et Vote (Jour ${turn})
        </button>
      </div>
    </div>
  `;
}

// ===== PHASE DE DÉBAT & VOTE =====
function renderDebatePhase(gameUI, livingPlayers, currentTurn, dayVote) {
  const timerDisplay = dayTimerSeconds > 0 ? formatTime(dayTimerSeconds) : '--:--';
  const timerActive = dayTimerInterval !== null;

  const playersHtml = livingPlayers.map(p => {
    const isVoted = dayVote === p.id;
    const bgColor = isVoted ? 'rgba(100,200,100,0.2)' : 'rgba(107,76,154,0.1)';
    const borderColor = isVoted ? '#4caf50' : '#9966ff';

    return `<div class="gm-day-player" data-player-id="${p.id}" style="padding:8px; background:${bgColor}; border:2px solid ${borderColor}; border-radius:3px; cursor:pointer; transition:all 0.2s; text-align:center; min-width:0;">
      <div style="font-size:10px; font-weight:600; color:#e8e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${isVoted ? '✓ ' : ''}${p.name}</div>
    </div>`;
  }).join('');

  return `<div style="display:flex; flex-direction:column; max-height:65vh; overflow:hidden; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif;">
    <div style="padding:8px; background:rgba(81,116,219,0.1); border-bottom:2px solid rgba(81,116,219,0.3);">
      <div style="font-weight:600; font-size:11px; color:#81dff7;">💬 JOUR ${currentTurn} - DÉBAT ET VOTE</div>
      <div style="font-size:8px; color:#aaa; margin-top:2px;">${livingPlayers.length} joueurs vivants</div>
    </div>

    <!-- TIMER -->
    <div style="padding:6px; background:rgba(255,150,0,0.1); border-bottom:1px solid rgba(255,150,0,0.2); display:flex; gap:4px; align-items:center;">
      <div style="flex:1; text-align:center;">
        <div style="font-size:18px; font-weight:700; color:#ffaa44; font-family:monospace;" id="gmDayTimer">${timerDisplay}</div>
        <div style="font-size:7px; color:#aaa;">Minuteur</div>
      </div>
      <div style="display:flex; gap:2px; flex-direction:column; flex:0 0 auto;">
        <input id="gmTimerInput" type="number" placeholder="Sec" style="width:45px; padding:2px; font-size:8px; border:1px solid rgba(255,150,0,0.3); border-radius:2px; background:rgba(0,0,0,0.3); color:#ffaa44; text-align:center;" value="60">
        <button id="gmBtnTimerSet" style="padding:2px 4px; font-size:7px; background:rgba(255,150,0,0.3); border:1px solid rgba(255,150,0,0.5); border-radius:2px; color:#ffaa44; cursor:pointer; font-weight:600;">SET</button>
        <button id="gmBtnTimerStart" style="padding:2px 4px; font-size:7px; background:rgba(100,200,100,0.3); border:1px solid rgba(100,200,100,0.5); border-radius:2px; color:#4caf50; cursor:pointer; font-weight:600;">▶</button>
        <button id="gmBtnTimerStop" style="padding:2px 4px; font-size:7px; background:rgba(200,100,100,0.3); border:1px solid rgba(200,100,100,0.5); border-radius:2px; color:#ff6b6b; cursor:pointer; font-weight:600;">⏹</button>
      </div>
    </div>

    <!-- JOUEURS À VOTER -->
    <div style="flex:1; overflow-y:auto; padding:6px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(55px, 1fr)); gap:4px;">
        ${playersHtml}
      </div>
    </div>

    <!-- BOUTONS -->
    <div style="padding:6px; border-top:1px solid rgba(199,125,255,0.2); flex-shrink:0; display:flex; gap:4px;">
      <button id="gmBtnVoteCancel" style="flex:0 0 60px; background:rgba(100,100,150,0.3); border:1px solid rgba(100,150,200,0.5); padding:4px; border-radius:3px; color:#81dff7; font-weight:600; cursor:pointer; font-size:8px;">← Retour</button>
      <button id="gmBtnVoteConfirm" style="flex:1; background:linear-gradient(135deg, #ff6b6b, #ff8888); border:none; padding:4px; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:8px; opacity:${dayVote ? '1' : '0.4'};transition:opacity 0.2s;">🔨 ${dayVote ? 'Voter' : 'Choisir'}</button>
    </div>
  </div>`;
}

// ===== RÉSULTAT DU VOTE =====
function renderVoteResult(gameUI, turn) {
  const gm = gameUI.gm;
  const votedPlayer = gm.state.gameState?.dayVoteTarget ? gm.state.players.find(p => p.id === gm.state.gameState.dayVoteTarget) : null;

  if (!votedPlayer) {
    return `<div style="padding:20px; color:#e8e8f0;">Erreur: joueur non trouvé</div>`;
  }

  const deathMessage = `Vous avez décidé de tuer <strong>${votedPlayer.name}</strong>! Il/Elle brûle au bûcher et était... <strong>${votedPlayer.roleId || '?'}</strong>!`;

  return `<div style="display:flex; flex-direction:column; max-height:65vh; overflow:hidden; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif;">
    <div style="padding:8px; background:linear-gradient(135deg, rgba(255,100,0,0.2), rgba(50,50,100,0.2)); border-bottom:2px solid rgba(255,100,0,0.3);">
      <h2 style="margin:0; color:#ffaa44; font-size:11px;">🔥 RÉSULTAT DU VOTE - JOUR ${turn}</h2>
    </div>
    <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:12px; text-align:center;">
      <div style="font-size:10px; color:#ffaa44; line-height:1.5;">${deathMessage}</div>
    </div>
    <div style="padding:6px; border-top:1px solid rgba(199,125,255,0.2); flex-shrink:0;">
      <button id="gmBtnNightStart" style="width:100%; background:linear-gradient(135deg, #2d3561, #4a5085); border:none; padding:6px; border-radius:3px; color:#81dff7; font-weight:600; cursor:pointer; font-size:9px;">
        🌙 Endormez-vous... La nuit ${turn + 1} arrive
      </button>
    </div>
  </div>`;
}

// ===== ACTIONS POSTHUMES (Chasseur, Chevalier, etc.) =====
function renderPostMortemAction(gameUI, postMortemPlayer) {
  const gm = gameUI.gm;
  const roleId = postMortemPlayer.roleId;
  const players = gm.state.players || [];
  const livingPlayers = players.filter(p => !p.isDead && p.id !== postMortemPlayer.id);

  let instruction = '';
  let formHtml = '';
  let confirmBtnText = '✓ Confirmer';
  let confirmBtnId = 'gmBtnPostMortemConfirm';
  let confirmBtnDisabled = false;

  if (roleId === 'Chasseur') {
    instruction = `🏹 <strong>${postMortemPlayer.name}</strong> (Chasseur) tire sur quelqu'un avant de mourir!`;
    const playerOptions = livingPlayers.map(p => `
      <option value="${p.id}">${p.name}</option>
    `).join('');
    formHtml = `
      <div style="padding:8px; background:rgba(100,100,100,0.2); border-radius:4px;">
        <label style="color:#aaa; font-size:9px;">Cible:</label>
        <select id="gmPostMortemTarget" style="width:100%; padding:4px; margin-top:4px; background:rgba(0,0,0,0.3); color:#e8e8f0; border:1px solid rgba(100,150,200,0.5); border-radius:3px; font-size:9px;">
          <option value="">-- Sélectionner --</option>
          ${playerOptions}
        </select>
      </div>
    `;
    confirmBtnText = '🔫 Tirer';
  } else if (roleId === 'Chevalier_Epee_Rouille') {
    instruction = `⚔️ <strong>${postMortemPlayer.name}</strong> (Chevalier à l'Épée Rouillée) tue un Loup en mourant!`;
    const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
    const wolves = livingPlayers.filter(p => wolfRoles.includes(p.roleId));

    if (wolves.length > 0) {
      formHtml = `
        <div style="padding:8px; background:rgba(212,102,102,0.2); border-radius:4px;">
          <div style="color:#ff9999; font-size:9px; margin-bottom:6px;">🔴 Loups vivants - Choisissez:</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${wolves.map(w => `
              <div class="gm-wolf-select" data-wolf-id="${w.id}" style="padding:6px; background:rgba(0,0,0,0.3); border:2px solid rgba(212,102,102,0.3); border-radius:3px; cursor:pointer; text-align:center; font-size:9px; transition:all 0.2s;">
                <strong>${w.name}</strong><br>
                <span style="color:#aaa; font-size:8px;">${w.roleId}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      confirmBtnText = '⚔️ Trancher';
    } else {
      formHtml = `<div style="padding:8px; color:#aaa; text-align:center; font-size:9px; background:rgba(200,100,100,0.2); border-radius:3px;">❌ Aucun Loup vivant - Le Chevalier ne peut pas agir</div>`;
      confirmBtnDisabled = true;
      confirmBtnId = 'gmBtnPostMortemSkip';
    }
  }

  return `
    <div style="display:flex; flex-direction:column; max-height:65vh; overflow:hidden; background:linear-gradient(135deg, rgba(139,58,58,0.3), rgba(50,50,100,0.2)); color:#e8e8f0; font-family:Arial,sans-serif;">
      <!-- HEADER -->
      <div style="padding:8px; background:rgba(212,102,102,0.2); border-bottom:2px solid rgba(212,102,102,0.4);">
        <h2 style="margin:0; color:#ff9999; font-size:11px;">💀 ACTION POSTHUME</h2>
      </div>

      <!-- CONTENU -->
      <div style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">
        <div style="padding:8px; background:rgba(100,100,150,0.1); border-left:3px solid #81dff7; border-radius:3px; font-size:9px; line-height:1.4;">
          ${instruction}
        </div>

        ${formHtml}
      </div>

      <!-- BOUTONS -->
      <div style="padding:8px; border-top:1px solid rgba(199,125,255,0.2); flex:0 0 auto; display:flex; gap:4px;">
        <button id="${confirmBtnId}" style="flex:1; background:linear-gradient(135deg, #ff6b6b, #ff8888); border:none; padding:6px; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:9px; opacity:${confirmBtnDisabled ? '0.5' : '1'};" ${confirmBtnDisabled ? 'disabled' : ''}>
          ${confirmBtnText}
        </button>
        <button id="gmBtnPostMortemNext" style="flex:0 0 80px; background:rgba(100,100,150,0.3); border:1px solid rgba(100,150,200,0.5); padding:6px; border-radius:3px; color:#81dff7; font-weight:600; cursor:pointer; font-size:9px;">
          ▶ Suivant
        </button>
      </div>
    </div>
  `;
}

// ===== NUIT QUI ARRIVE =====
function renderNightComing(gameUI, turn) {
  return `<div style="display:flex; flex-direction:column; max-height:65vh; overflow:hidden; background:linear-gradient(135deg, #1a1a2e, #0a0a1e); color:#e8e8f0; font-family:Arial,sans-serif; align-items:center; justify-content:center; padding:12px;">
    <div style="font-size:28px; margin-bottom:10px;">🌙</div>
    <h1 style="margin:0; font-size:14px; text-align:center; color:#81dff7; margin-bottom:12px;">LA NUIT ${turn + 1} ARRIVE...</h1>
    <div style="font-size:9px; color:#aaa; text-align:center; max-width:250px; margin-bottom:16px; line-height:1.5;">
      Les habitants se sont endormis...<br>
      Les créatures nocturnes se réveillent...
    </div>
    <button id="gmBtnNightNext" style="padding:6px 20px; background:linear-gradient(135deg, #5174db, #c77dff); border:none; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
      ▶ Suivant (Nuit ${turn + 1})
    </button>
  </div>`;
}

// ===== HELPERS =====
function generateNightEventsSummary(gm) {
  const gameLog = gm.state.gameLog || [];
  const currentTurn = gm.state.currentTurn || 1;
  const nightTag = `[🌛${currentTurn}]`;

  // Extraire SEULEMENT les victimes (logs avec dévorent, élimine, tue, empoisonne, ou statuts spéciaux)
  const victimEvents = gameLog.filter(e =>
    e.text && e.text.includes(nightTag) && (
      e.text.includes('dévorent') ||
      e.text.includes('élimine') ||
      e.text.includes('tue') ||
      e.text.includes('empoisonne') ||
      e.text.includes('meurt aussi') ||
      e.text.includes('devient Loup')
    )
  );

  if (victimEvents.length === 0) {
    return 'Les créatures de la nuit ont agi en silence...';
  }

  let summary = `<strong>🌙 Nuit ${currentTurn}</strong><br>`;
  victimEvents.forEach(event => {
    let msg = event.text;
    msg = msg.replace(nightTag, '').trim();
    summary += `${msg}<br>`;
  });

  return summary;
}

function getDeathCauseFromHistory(gm, player) {
  const gameLog = gm.state.gameLog || [];

  // Chercher dans le log ce qui a causé la mort cette nuit
  const deathEntry = gameLog.find(e =>
    e.text && e.text.includes(player.name) &&
    (e.text.includes('dévorent') || e.text.includes('élimine') || e.text.includes('tue') || e.text.includes('empoisonne'))
  );

  if (deathEntry) {
    // Nettoyer le message des tags
    let msg = deathEntry.text;
    msg = msg.replace(/\[\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}\]\s*/, ''); // Enlever la date/heure
    msg = msg.replace(/\[🌛\d+\]\s*/, ''); // Enlever le tag [🌛{turn}]
    return msg;
  }

  // Si pas trouvé, génération basée sur les rôles des loups
  const wolves = gm.state.players.filter(p =>
    !p.isDead &&
    (p.roleId?.includes('Loup') || p.roleId?.includes('Blanc'))
  );

  const causes = [
    `Attaqué par ${wolves.length > 0 ? wolves[0].name : 'un Loup'} et ses alliés...`,
    `Victime de la nuit - les Loups ont frappé.`,
    `Éliminé par les créatures nocturnes...`,
    `Tombé sous les crocs de la meute...`,
  ];

  return causes[Math.floor(Math.random() * causes.length)];
}

function getDeathCause(gm, player) {
  return getDeathCauseFromHistory(gm, player);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== EVENT LISTENERS =====
function attachDayEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];

  // Bouton "Nouvelle Partie" (fin de partie)
  document.getElementById('gmBtnNewGame')?.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr? Cela réinitialisera complètement le jeu.')) {
      gm.resetState();
      gm.state.mode = 'selectRoles';
      gm.saveState();
      gameUI.render();
    }
  });

  // Bouton "Journal Complet" (fin de partie)
  document.getElementById('gmBtnGameLog')?.addEventListener('click', () => {
    gameUI.activeTab = 'journal';
    gameUI.updateTabStyles();
    gameUI.render();
  });

  // Bouton pour continuer après annonce des morts
  document.getElementById('gmBtnDeathsOk')?.addEventListener('click', () => {
    const currentTurn = gm.state.currentTurn || 1;
    const dayTag = `[Jour${currentTurn}]`;
    gm.addGameLog(`☀️ Début du Jour ${currentTurn} - Débat et Vote`, dayTag);

    gm.state.gameState.deathsAnnounced = true;

    // Vérifier s'il y a des actions posthumes à faire
    if (gm.hasPostMortemActionsPending()) {
      gm.state.gameState.phase = 'postmortem-actions';
    } else {
      gm.state.gameState.phase = 'day-voting';
    }

    gm.saveState();
    gameUI.render();
  });

  // Sélection d'un joueur à voter
  document.querySelectorAll('.gm-day-player').forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      gm.state.gameState.dayVoteTarget = playerId;

      // Tracker le vote (pour Lepreux PostMortem)
      if (!gm.state.dayVoteTracking) {
        gm.state.dayVoteTracking = {};
      }
      // Enregistrer le vote du GameMaster pour cette cible
      gm.state.dayVoteTracking[playerId] = gm.state.dayVoteTracking[playerId] || [];
      // Le "voteur" ici est le GameMaster lui-même (représentant le village)
      gm.state.dayVoteTracking[playerId].push({
        voterId: 'gm-' + gm.state.currentTurn, // ID unique pour le vote
        timestamp: new Date().toISOString()
      });

      gm.saveState();
      gameUI.render();
    });
  });

  // Confirmer le vote
  document.getElementById('gmBtnVoteConfirm')?.addEventListener('click', () => {
    const votedId = gm.state.gameState.dayVoteTarget;
    if (!votedId) {
      alert('Sélectionnez quelqu\'un à éliminer!');
      return;
    }

    const votedPlayer = players.find(p => p.id === votedId);
    if (votedPlayer) {
      const currentTurn = gm.state.currentTurn || 1;
      const dayTag = `[Jour${currentTurn}]`;

      // Log vote result
      gm.addGameLog(`🗳️ ${votedPlayer.name} est éliminé par le village! Il/Elle était ${votedPlayer.roleId || '?'}`, dayTag);

      votedPlayer.isDead = true;
      gm.handlePlayerDeath(votedId);

      // ===== LEPREUX PostMortem: Tous les votants meurent aussi =====
      if (votedPlayer.roleId === 'Lepreux' && gm.state.dayVoteTracking?.[votedId]) {
        // Trouver tous les villageois (tous les joueurs, car le vote est un vote village)
        const villagers = players.filter(p => !p.isDead && p.id !== votedId);

        if (villagers.length > 0) {
          gm.addGameLog(`⚠️ <strong>${votedPlayer.name}</strong> (Lépreux) se venge! Tous les villageois qui ont voté pour lui meurent aussi!`, dayTag);

          // Tuer tous les villageois (représentant tous ceux qui ont voté)
          villagers.forEach(villager => {
            if (!villager.isDead) {
              villager.isDead = true;
              gm.addGameLog(`💀 <strong>${villager.name}</strong> meurt car il a voté le Lépreux!`, dayTag);
              // Cascades de mort (amoureux, etc.)
              gm.handlePlayerDeath(villager.id);
            }
          });
        }
      }

      // Check win conditions après les cascades de mort
      const winCheck = gm.checkWinCondition();
      if (winCheck.isGameOver) {
        gm.state.gameState.phase = 'game-end';
        gm.state.gameState.winners = winCheck.winners;
        gm.state.gameState.endDetails = winCheck.details;
        gm.addGameLog(`🏆 ${winCheck.details}`, dayTag);
      } else {
        gm.state.gameState.phase = 'day-result';
      }

      gm.state.dayVoteTracking = null; // Clear vote tracking for next day
      gm.saveState();
      gameUI.render();
    }
  });

  // Retour
  document.getElementById('gmBtnVoteCancel')?.addEventListener('click', () => {
    gm.state.gameState.deathsAnnounced = false;
    gm.state.gameState.dayVoteTarget = null;
    gm.saveState();
    gameUI.render();
  });

  // Timer - SET
  document.getElementById('gmBtnTimerSet')?.addEventListener('click', () => {
    const input = document.getElementById('gmTimerInput');
    dayTimerSeconds = parseInt(input.value) || 60;
    gameUI.render();
  });

  // Timer - PLAY
  document.getElementById('gmBtnTimerStart')?.addEventListener('click', () => {
    if (dayTimerInterval) return;
    if (dayTimerSeconds <= 0) dayTimerSeconds = 60;

    dayTimerInterval = setInterval(() => {
      dayTimerSeconds--;
      const display = document.getElementById('gmDayTimer');
      if (display) display.textContent = formatTime(dayTimerSeconds);

      if (dayTimerSeconds <= 0) {
        clearInterval(dayTimerInterval);
        dayTimerInterval = null;
      }
    }, 1000);
  });

  // Timer - STOP
  document.getElementById('gmBtnTimerStop')?.addEventListener('click', () => {
    if (dayTimerInterval) {
      clearInterval(dayTimerInterval);
      dayTimerInterval = null;
    }
  });

  // Nuit qui arrive
  document.getElementById('gmBtnNightStart')?.addEventListener('click', () => {
    clearInterval(dayTimerInterval);
    dayTimerInterval = null;
    dayTimerSeconds = 0;

    const currentTurn = gm.state.currentTurn || 1;
    const nextNightNum = currentTurn + 1;
    gm.addGameLog(`🌙 Les habitants se endorment... La Nuit ${nextNightNum} approche...`, `[Jour${currentTurn}]`);

    gm.state.gameState.phase = 'night-coming';
    gm.state.gameState.deathsAnnounced = false;
    gm.state.gameState.dayVoteTarget = null;
    gm.saveState();
    gameUI.render();
  });

  // ===== ACTIONS POSTHUMES =====
  // Chasseur - Tirer sur quelqu'un
  document.getElementById('gmBtnPostMortemConfirm')?.addEventListener('click', () => {
    const postMortemPlayers = gm.getPostMortemRolesNeedingAction();
    if (postMortemPlayers.length === 0) return;

    const player = postMortemPlayers[0];
    if (player.roleId === 'Chasseur') {
      const targetId = document.getElementById('gmPostMortemTarget')?.value;
      if (!targetId) {
        alert('Sélectionnez quelqu\'un!');
        return;
      }
      gm.processPostMortemAction(player.id, { targetId });
    } else if (player.roleId === 'Chevalier_Epee_Rouille') {
      const targetId = gm.state.postMortemWolfTarget;
      if (!targetId) {
        alert('Sélectionnez un Loup!');
        return;
      }
      gm.processPostMortemAction(player.id, { targetId });
    }

    gm.saveState();
    gameUI.render();
  });

  // Chevalier - Sélectionner un loup
  document.querySelectorAll('.gm-wolf-select').forEach(elem => {
    elem.addEventListener('click', () => {
      document.querySelectorAll('.gm-wolf-select').forEach(e => {
        e.style.borderColor = 'rgba(212,102,102,0.3)';
        e.style.background = 'rgba(0,0,0,0.3)';
      });
      elem.style.borderColor = '#ff6b6b';
      elem.style.background = 'rgba(212,102,102,0.3)';
      gm.state.postMortemWolfTarget = elem.dataset.wolfId;
      gm.saveState();
    });
  });

  // PostMortem - Next/Skip
  document.getElementById('gmBtnPostMortemNext')?.addEventListener('click', () => {
    const postMortemPlayers = gm.getPostMortemRolesNeedingAction();
    if (postMortemPlayers.length === 0) {
      // Pas d'autres actions posthumes, continuer au vote
      gm.state.gameState.phase = 'day-voting';
      gm.state.postMortemWolfTarget = null;
      gm.saveState();
      gameUI.render();
      return;
    }

    // Il y a d'autres actions, rendu automatique pour la prochaine
    gm.state.postMortemWolfTarget = null;
    gm.saveState();
    gameUI.render();
  });

  // Suivant - Nuit suivante
  document.getElementById('gmBtnNightNext')?.addEventListener('click', () => {
    const nextNightNum = (gm.state.currentTurn || 1) + 1;
    gm.addGameLog(`🌙 Nuit ${nextNightNum} commence...`, `[Nuit${nextNightNum}]`);

    gm.state.currentTurn++;

    // Pour Nuit 2+, utiliser le mode 'night' (06-Night.js)
    // Pour Nuit 1, utiliser le mode 'assignRoles' (03-FirstNight.js)
    const isNight2Plus = gm.state.currentTurn > 1;
    gm.state.mode = isNight2Plus ? 'night' : 'assignRoles';

    gm.state.nightPhase = true;
    gm.state.currentRoleIdx = 0;
    gm.state.nightStep = 1;
    gm.state.gameState.deathsAnnounced = false;
    gm.state.gameState.deathsLogged = false;  // Reset for next day
    gm.state.gameState.phase = 'night-actions';
    gm.saveState();
    gameUI.render();
  });
}
