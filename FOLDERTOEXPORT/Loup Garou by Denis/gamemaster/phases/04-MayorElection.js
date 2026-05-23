// ========================================
// ÉCRAN 4: JOUR 1 - ÉLECTION DU MAIRE
// ========================================

function renderMayorElection(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const mayorId = gm.state.gameState?.mayor || null;

  const statusText = mayorId ? players.find(p => p.id === mayorId)?.name || 'Sélectionné' : 'Aucun';
  const colCount = players.length > 12 ? 4 : (players.length > 8 ? 3 : 2);

  return `<div style="display:flex; flex-direction:column; height:100vh; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif;"><div style="padding:6px; background:rgba(100,150,200,0.1); border-bottom:1px solid rgba(199,125,255,0.2);"><div style="font-weight:600; font-size:11px; color:#81dff7;">☀️ ÉLECTION DU MAIRE</div><div style="font-size:8px; color:#aaa; margin-top:2px;">Sélectionné: <strong style="color:#ffd700;">${statusText}</strong></div></div><div style="padding:6px; border-bottom:1px solid rgba(199,125,255,0.2); display:flex; gap:4px; flex-direction:column; flex-shrink:0;"><div style="display:flex; gap:4px;"><button id="gmBtnMayorPrev" style="flex:0 0 40px; background:rgba(100,100,150,0.4); border:1px solid rgba(100,150,200,0.5); padding:8px; border-radius:3px; color:#81dff7; font-weight:600; cursor:pointer; font-size:10px;">← Retour</button><button id="gmBtnMayorConfirm" style="flex:1; background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:10px; opacity:${mayorId ? '1' : '0.4'};transition:opacity 0.2s;">✓ Suivant (Maire élu)</button></div><button id="gmBtnNoMayor" style="width:100%; background:linear-gradient(135deg, #ff6b6b, #ff8888); border:none; padding:8px; border-radius:3px; color:white; font-weight:600; cursor:pointer; font-size:10px;">⊘ Pas de Maire - Passer</button></div><div style="flex:1; overflow-y:auto; padding:6px;"><div style="display:grid; grid-template-columns:repeat(${colCount}, 1fr); gap:4px;">${players.map(p => {
      const isMayor = p.id === mayorId;
      const bgColor = isMayor ? 'rgba(255,215,0,0.2)' : 'rgba(107,76,154,0.1)';
      const borderColor = isMayor ? '#ffd700' : '#9966ff';
      const roleId = p.roleId || '?';
      const cardFile = gameUI.getCardFile(roleId);
      const cardImg = `cards/${cardFile}.webp`;

      return `<div class="gm-mayor-candidate" data-player-id="${p.id}" style="padding:6px; background:${bgColor}; border:2px solid ${borderColor}; border-radius:3px; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:4px;"><img src="${cardImg}" style="width:36px; height:50px; border-radius:2px; object-fit:cover; border:1px solid rgba(199,125,255,0.3);"><div style="text-align:center; min-width:0;"><div style="font-size:9px; font-weight:600; color:#e8e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${isMayor ? '👑' : ''}${p.name}</div></div></div>`;
    }).join('')}</div></div></div>`;
}

function attachMayorElectionEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];

  // Initialiser gameState si nécessaire
  if (!gm.state.gameState) {
    gm.state.gameState = {
      mayor: null,
      phase: 'day1-election'
    };
  }

  // Clicker sur un joueur pour le désigner maire
  document.querySelectorAll('.gm-mayor-candidate').forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      gm.state.gameState.mayor = playerId;
      gm.saveState();
      gameUI.render();
    });
  });

  // Bouton "Suivant"
  const btnConfirm = document.getElementById('gmBtnMayorConfirm');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      const mayorId = gm.state.gameState.mayor;
      if (mayorId) {
        const mayor = players.find(p => p.id === mayorId);
        if (mayor) {
          // Log with [MayorElection] tag
          gm.addGameLog(`👑 ${mayor.name} devient le Maire du village`, '[MayorElection]');
          // Mark player as mayor
          mayor.isMayor = true;
        }
      }

      // Passer au jour
      gm.state.mode = 'day1';
      gm.state.gameState.phase = 'day1-voting';
      gm.state.currentTurn = 1;
      gm.state.nightPhase = false;
      gm.saveState();
      gameUI.render();
    });
  }

  // Bouton "Pas de Maire"
  const btnNoMayor = document.getElementById('gmBtnNoMayor');
  if (btnNoMayor) {
    btnNoMayor.addEventListener('click', () => {
      gm.addGameLog('👑 Aucun Maire n\'a été élu', '[MayorElection]');
      gm.state.gameState.mayor = null;

      // Passer au jour (sans maire)
      gm.state.mode = 'day1';
      gm.state.gameState.phase = 'day1-voting';
      gm.state.currentTurn = 1;
      gm.state.nightPhase = false;
      gm.saveState();
      gameUI.render();
    });
  }

  // Bouton "Retour"
  const btnPrev = document.getElementById('gmBtnMayorPrev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      gm.state.mode = 'assignRoles';
      gm.state.nightStep = 2;
      gm.saveState();
      gameUI.render();
    });
  }
}
