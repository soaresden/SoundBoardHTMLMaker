// ========================================
// 03-LIVE MAP
// Table setup avec placement et renommage des joueurs
// ========================================

// Fonction générique pour obtenir les effets visuels d'un joueur
function getPlayerVisualEffects(player, gm, gameUI, baseBorderColor = 'var(--gm-border)') {
  let borderColor = baseBorderColor;
  let borderWidth = '3px';

  // Vérifier Cupidon (amoureux) - override le borderColor
  const cupidoSelection = gm.state.cupidoSelection || [];
  if (cupidoSelection.includes(player.id)) {
    const cupidoRoleData = window.ROLES_DATA?.roles?.Cupidon;
    if (cupidoRoleData?.visual?.targetsBorder) {
      borderColor = cupidoRoleData.visual.targetsBorder.color || '#D8859B';
      borderWidth = cupidoRoleData.visual.targetsBorder.width || '2px';
      return { borderColor, borderWidth };
    }
  }

  // Vérifier Enfant Sauvage (idole) - override le borderColor
  const enfantIdol = gm.state.enfantSauvageIdol?.playerId;
  if (enfantIdol === player.id) {
    const enfantRoleData = window.ROLES_DATA?.roles?.Enfant_Sauvage;
    if (enfantRoleData?.visual?.targetsBorder) {
      borderColor = enfantRoleData.visual.targetsBorder.color || '#A71D08';
      borderWidth = enfantRoleData.visual.targetsBorder.width || '2px';
      return { borderColor, borderWidth };
    }
  }

  return { borderColor, borderWidth };
}

function renderLiveMap(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players;
  // Vue unique: table ronde (rectangle/ovale retirés).
  gm.state.tableType = 'circle';
  const tableType = 'circle';
  const tablePresets = {
    'circle': { width: 140, height: 140 }
  };

  const preset = tablePresets[tableType];
  const tableWidth = preset.width;
  const tableHeight = preset.height;

  const result = gameUI.generatePositionsByTableType(players.length, tableType);
  const defaultPositions = result.positions;
  const tableCenter = result.center;

  const scale = 240 / 300;
  const containerCenter = 120;

  // ===== TRACKER DES POSITIONS POUR SAVANT_FOU =====
  if (!gm.state.playerPositions) {
    gm.state.playerPositions = {};
  }

  // Mode RECTANGLE: on ne pas initialiser les positions par défaut, elles seront calculées par zone
  // Mode CERCLE: initialiser les positions par défaut seulement si pas encore définies
  if (tableType === 'circle') {
    players.forEach((p, idx) => {
      if (!p.tableX || !p.tableY) {
        if (defaultPositions[idx]) {
          const posX = defaultPositions[idx].x - tableCenter.x;
          const posY = defaultPositions[idx].y - tableCenter.y;
          p.tableX = containerCenter + (posX * scale);
          p.tableY = containerCenter + (posY * scale);

          // Sauvegarder la position de table et l'index circulaire
          gm.state.playerPositions[p.id] = {
            x: p.tableX,
            y: p.tableY,
            circleIndex: idx,
            totalPlayers: players.length
          };

          gm.saveState();
        }
      }
    });
  }

  // Initialiser la config de zones si absente OU si le NOMBRE de joueurs a change
  // (zoneConfig perime d'une partie precedente). On NE recalcule PAS sur une simple
  // edition manuelle (l'utilisateur peut mettre 0 dans une zone si il veut).
  if (tableType !== 'circle' && (!gm.state.zoneConfig || gm.state.zoneConfigForCount !== players.length)) {
    // Distribution intelligente basée sur le nombre de joueurs
    const playerCount = players.length;
    let distribution;

    if (playerCount <= 4) {
      distribution = { top: 1, left: 1, right: 1, bottom: playerCount - 3 };
    } else if (playerCount <= 8) {
      distribution = { top: Math.floor(playerCount / 4), left: Math.floor(playerCount / 4), right: Math.floor(playerCount / 4), bottom: playerCount - Math.floor(playerCount / 4) * 3 };
    } else if (playerCount <= 16) {
      distribution = { top: Math.floor(playerCount / 4), left: Math.floor(playerCount / 4), right: Math.floor(playerCount / 4), bottom: playerCount - Math.floor(playerCount / 4) * 3 };
    } else {
      distribution = { top: Math.floor(playerCount / 4), left: Math.floor(playerCount / 4), right: Math.floor(playerCount / 4), bottom: playerCount - Math.floor(playerCount / 4) * 3 };
    }

    gm.state.zoneConfig = distribution;
    gm.state.zoneConfigForCount = players.length;
  }

  // Pour mode rectangle: calculer et mettre à jour les positions basées sur les zones
  // Utiliser le container 240x240, pas les dimensions visuelles de la table
  if (tableType !== 'circle' && gm.state.zoneConfig) {
    const zoneConfig = gm.state.zoneConfig;
    const containerSize = 240;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    const tableWidth = 140; // Augmentée pour plus d'espace
    const tableHeight = 110; // Augmentée pour plus d'espace
    const dotRadius = 22; // Rayon des points joueurs

    const zones = {
      'top': { players: [], side: 'top' },
      'left': { players: [], side: 'left' },
      'right': { players: [], side: 'right' },
      'bottom': { players: [], side: 'bottom' }
    };

    // Assigner les joueurs aux zones basées sur leur ordre
    let playerIndex = 0;
    ['top', 'left', 'right', 'bottom'].forEach(side => {
      const count = zoneConfig[side] || 0;
      for (let i = 0; i < count && playerIndex < players.length; i++) {
        zones[side].players.push(players[playerIndex]);
        playerIndex++;
      }
    });

    // Positionner les joueurs dans chaque zone avec espacement très large
    Object.entries(zones).forEach(([side, zoneInfo]) => {
      const count = zoneInfo.players.length;
      if (count === 0) return;

      zoneInfo.players.forEach((player, idx) => {
        if (side === 'top') {
          // Haut: horizontal spread très large
          const startX = 30;
          const endX = containerSize - 30;
          const spacing = (endX - startX) / (count + 1);
          player.tableX = startX + spacing * (idx + 1);
          player.tableY = 25; // Très haut
        } else if (side === 'bottom') {
          // Bas: horizontal spread très large
          const startX = 30;
          const endX = containerSize - 30;
          const spacing = (endX - startX) / (count + 1);
          player.tableX = startX + spacing * (idx + 1);
          player.tableY = containerSize - 25; // Très bas
        } else if (side === 'left') {
          // Gauche: vertical spread très large
          const startY = 30;
          const endY = containerSize - 30;
          const spacing = (endY - startY) / (count + 1);
          player.tableX = 25; // Très à gauche
          player.tableY = startY + spacing * (idx + 1);
        } else if (side === 'right') {
          // Droite: vertical spread très large
          const startY = 30;
          const endY = containerSize - 30;
          const spacing = (endY - startY) / (count + 1);
          player.tableX = containerSize - 25; // Très à droite
          player.tableY = startY + spacing * (idx + 1);
        }
      });
    });
  }

  const playerPoints = players.map((p) => {
    // Vérifier si le joueur est mort
    const isDead = p.statusData && p.statusData.Mort;
    const deadStyle = isDead ? 'opacity: 0.4; filter: grayscale(100%);' : '';
    const playerInitial = p.name.charAt(0).toUpperCase();

    // Déterminer l'emoji et la couleur à afficher
    let displayContent = playerInitial; // Par défaut: première lettre du nom
    let displayColor = '#e8e8f0'; // Couleur par défaut du texte (sera override si rôle)
    let bgColor = 'rgba(81, 116, 219, 0.3)';
    let borderColor = 'var(--gm-border)';

    if (p.roleId) {
      console.log(`[LiveMap] Player ${p.name} (${p.id}) assigned to role ${p.roleId}`);

      // Si le joueur a un visualEmoji custom (ex: Chien Loup transformé), l'utiliser en priorité
      let roleEmoji = p.visualEmoji;

      if (!roleEmoji) {
        // Sinon, récupérer l'emoji depuis getRoleInfo
        const roleInfo = gameUI?.gm?.getRoleInfo?.(p.roleId);
        roleEmoji = roleInfo?.visual?.emoji;
        console.log(`[LiveMap] Got emoji for ${p.roleId}: ${roleEmoji}`);
      }

      if (roleEmoji) {
        displayContent = roleEmoji;
      }

      // Appliquer les couleurs du rôle (ou des couleurs adaptées si transformé)
      let visualRole = p.roleId;
      if (p.roleId === 'Chien_Loup' && p.transformedFromChienLoup === true) {
        visualRole = 'Simple_Loup_Garou';
      }

      const roleInfo = gameUI?.gm?.getRoleInfo?.(visualRole);
      if (roleInfo?.visual) {
        console.log(`[LiveMap] Role visual for ${visualRole}:`, roleInfo.visual);
        if (roleInfo.visual.fondColor) bgColor = roleInfo.visual.fondColor;
        if (roleInfo.visual.borderColor) borderColor = roleInfo.visual.borderColor;
        if (roleInfo.visual.emojiColor) displayColor = roleInfo.visual.emojiColor;
        console.log(`[LiveMap] Applied colors - bg:${bgColor}, border:${borderColor}, emoji color:${displayColor}`);
      }
    }

    // Obtenir les effets visuels (bordures pour amoureux, idole, etc)
    // Passer le borderColor actuel pour qu'il soit utilisé comme base
    const effects = getPlayerVisualEffects(p, gm, gameUI, borderColor);

    console.log(`[LiveMap] Effects for ${p.name}: borderColor=${effects.borderColor}, borderWidth=${effects.borderWidth}`);

    // Créer un effet de couleur pour l'emoji si emojiColor est défini
    let emojiFilter = '';
    let emojiColor = displayColor;
    if (displayColor && displayColor !== '#e8e8f0') {
      // Appliquer la couleur directement ET ajouter un effet de couleur
      emojiFilter = `color: ${displayColor}; filter: drop-shadow(0 0 2px ${displayColor}); text-shadow: 0 0 8px ${displayColor};`;
      console.log(`[LiveMap] Emoji color for ${p.name}: ${displayColor}`);
    }

    const dotStyle = isDead
      ? 'width:26px; height:26px; background:#000000; border:2px solid #555555; border-radius:50%; box-shadow:0 1px 4px rgba(0,0,0,0.6);'
      : `width:26px; height:26px; background:${bgColor}; border:${effects.borderWidth} solid ${effects.borderColor}; border-radius:50%; box-shadow:0 2px 6px ${effects.borderColor}80, inset 0 1px 2px rgba(255,255,255,0.2);`;

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${p.tableX}px; top: ${p.tableY}px; position:absolute; cursor:default; transform:translate(-50%, -50%); width:26px; display:flex; flex-direction:column; align-items:center; ${deadStyle}" title="${p.name}${isDead ? ' (MORT)' : ''}">
        <div class="gm-point-dot" style="display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; ${dotStyle} ${emojiFilter}">
          ${displayContent}
        </div>
        <div class="gm-point-name gm-editable-name" style="cursor:pointer; padding:1px 2px; border-radius:2px; transition:all 0.2s; margin-top:2px; white-space:nowrap; font-size:8px; font-weight:600; color:#e8e8f0; text-shadow:0 1px 2px rgba(0,0,0,0.8);">${p.name}</div>
      </div>
    `;
  }).join('');

  const playerNamesHtml = players.map((p, idx) => `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1px; padding:1px; background:rgba(0,0,0,0.2); border-radius:1px;">
      <div style="font-size:7px; opacity:0.7; text-align:center; font-weight:600;">J${idx + 1}</div>
      <input type="text" class="gm-player-name-input-place" data-player-id="${p.id}" value="${p.name}" placeholder="Nom..." style="width:58%; padding:1px; border:none; background:rgba(0,0,0,0.4); border-radius:2px; color:#e8e8f0; text-align:center; font-size:8px;">
    </div>
  `).join('');

  let tableStyle = `position:relative; width:${tableWidth}px; height:${tableHeight}px; margin:0 auto; background:rgba(120, 85, 60, 0.6); border:3px solid var(--gm-border); box-shadow:inset 0 2px 8px rgba(0,0,0,0.5);`;
  if (tableType === 'circle' || tableType === 'oval-v' || tableType === 'oval-h') {
    tableStyle += ` border-radius:50%;`;
  } else if (tableType.includes('rect')) {
    tableStyle += ` border-radius:8px;`;
  }

  return `
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:18px; color:#e8e8f0;">
         Placer les Joueurs & Nommer
      </h2>
      <div style="padding:1px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9)); display:flex; flex-direction:column; gap:1px;">
        ${false ? `
          <div style="padding:6px 4px; display:flex; flex-direction:column; gap:3px;">
            <div style="display:flex; gap:6px; justify-content:space-around;">
              <label style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:rgba(81,116,219,0.1); border:1px solid #9966ff; border-radius:3px; font-size:9px; color:#81dff7; font-weight:600;">Haut:<input type="number" id="gmZoneTop" value="${gm.state.zoneConfig?.top ?? 2}" min="0" max="8" style="width:50px; padding:4px 6px; background:rgba(0,0,0,0.6); border:1px solid #9966ff; color:#e8e8f0; border-radius:2px; font-size:9px; font-weight:600;"></label>
              <label style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:rgba(81,116,219,0.1); border:1px solid #9966ff; border-radius:3px; font-size:9px; color:#81dff7; font-weight:600;">Bas:<input type="number" id="gmZoneBottom" value="${gm.state.zoneConfig?.bottom ?? 2}" min="0" max="8" style="width:50px; padding:4px 6px; background:rgba(0,0,0,0.6); border:1px solid #9966ff; color:#e8e8f0; border-radius:2px; font-size:9px; font-weight:600;"></label>
            </div>
            <div style="display:flex; gap:6px; justify-content:space-around;">
              <label style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:rgba(81,116,219,0.1); border:1px solid #9966ff; border-radius:3px; font-size:9px; color:#81dff7; font-weight:600;">Gauche:<input type="number" id="gmZoneLeft" value="${gm.state.zoneConfig?.left ?? 2}" min="0" max="8" style="width:50px; padding:4px 6px; background:rgba(0,0,0,0.6); border:1px solid #9966ff; color:#e8e8f0; border-radius:2px; font-size:9px; font-weight:600;"></label>
              <label style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:rgba(81,116,219,0.1); border:1px solid #9966ff; border-radius:3px; font-size:9px; color:#81dff7; font-weight:600;">Droite:<input type="number" id="gmZoneRight" value="${gm.state.zoneConfig?.right ?? 2}" min="0" max="8" style="width:50px; padding:4px 6px; background:rgba(0,0,0,0.6); border:1px solid #9966ff; color:#e8e8f0; border-radius:2px; font-size:9px; font-weight:600;"></label>
            </div>
            <div id="gmZoneStatus" style="font-size:8px; color:#81dff7; padding:3px 6px; background:rgba(102,217,153,0.1); border-radius:2px; border:1px solid rgba(102,217,153,0.3); font-weight:600; text-align:center;"></div>
          </div>
        ` : ''}
      </div>
      <div style="flex:1; padding:0px; display:flex; flex-direction:row; gap:0px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9)); overflow:hidden; box-sizing:border-box;">
        <!-- TABLE (full left) -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:1px; margin:1px;">
          <div style="position:relative; display:inline-block;">
            <div style="position:relative; display:inline-block; width:240px; height:240px;">
              <div class="gm-table-setup-container" id="gmTableResize" style="${tableStyle} position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.3; font-size:24px;"></div>
              </div>
              <div id="gmPlayersContainer" style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%);">
                ${playerPoints}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachLiveMapEvents(gameUI, skipDragDrop = false) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];

  document.getElementById('gmTableTypeSelect')?.addEventListener('change', (e) => {
    gm.state.tableType = e.target.value;
    gm.state.players.forEach(p => { p.tableX = null; p.tableY = null; });
    gm.saveState();
    gameUI.render();
  });

  // Gestionnaire pour éditer les noms directement sur la map
  document.querySelectorAll('.gm-editable-name').forEach(nameEl => {
    nameEl.addEventListener('click', () => {
      const playerPoint = nameEl.closest('.gm-player-point');
      const playerId = playerPoint.dataset.playerId;
      const player = players.find(p => p.id === playerId);

      if (!player) return;

      // Créer un input pour éditer le nom
      const inputValue = player.name;
      nameEl.innerHTML = `<input type="text" class="gm-name-edit-input" value="${inputValue}" style="padding:2px 4px; background:rgba(0,0,0,0.6); border:1px solid #c77dff; color:#e8e8f0; border-radius:2px; font-size:9px; font-weight:600; width:60px; text-align:center;">`;

      const input = nameEl.querySelector('.gm-name-edit-input');
      input.focus();
      input.select();

      const saveEdit = () => {
        const newName = input.value.trim() || player.name;
        player.name = newName;
        gm.saveState();
        nameEl.textContent = newName;
        gameUI.render();
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
      });
    });

    // Hover effect
    nameEl.addEventListener('mouseenter', () => {
      nameEl.style.background = 'rgba(199,125,255,0.3)';
    });

    nameEl.addEventListener('mouseleave', () => {
      nameEl.style.background = 'transparent';
    });
  });

  // Gestionnaires pour les inputs de zones (mode rectangle)
  if (gm.state.tableType !== 'circle') {
    const updateZoneConfig = (shouldRender = true) => {
      if (!gm.state.zoneConfig) gm.state.zoneConfig = {};

      ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
        const input = document.getElementById(`gmZone${side}`);
        if (input) {
          gm.state.zoneConfig[side.toLowerCase()] = parseInt(input.value) || 0;
        }
      });

      // Calculer le total des joueurs assignés
      const total = Object.values(gm.state.zoneConfig).reduce((a, b) => a + b, 0);
      const totalPlayers = players.length;
      const statusEl = document.getElementById('gmZoneStatus');

      if (statusEl) {
        if (total === totalPlayers) {
          statusEl.textContent = `✓ ${total}/${totalPlayers} joueurs assignés`;
          statusEl.style.color = '#66d999';
          statusEl.style.background = 'rgba(102,217,153,0.1)';
        } else if (total < totalPlayers) {
          statusEl.textContent = `⚠ ${total}/${totalPlayers} joueurs - MANQUE ${totalPlayers - total}`;
          statusEl.style.color = '#ff9999';
          statusEl.style.background = 'rgba(255,153,153,0.1)';
        } else {
          statusEl.textContent = `✗ ${total}/${totalPlayers} joueurs - SURPLUS ${total - totalPlayers}`;
          statusEl.style.color = '#ff6666';
          statusEl.style.background = 'rgba(255,100,100,0.1)';
        }
      }

      if (shouldRender) {
        gm.saveState();
        gameUI.render();
      }
    };

    // Attacher les listeners 'input' pour mise à jour temps réel
    ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
      const input = document.getElementById(`gmZone${side}`);
      if (input) {
        input.addEventListener('input', () => updateZoneConfig(true));
        input.addEventListener('change', () => updateZoneConfig(true));
      }
    });

    // Mettre à jour le statut initial SANS re-rendre (false = pas de render)
    updateZoneConfig(false);
  }

  document.querySelectorAll('.gm-player-name-input-place').forEach(input => {
    input.addEventListener('input', (e) => {
      const playerId = e.target.dataset.playerId;
      const player = gm.state.players.find(p => p.id === playerId);
      if (player) {
        player.name = e.target.value;
        gm.saveState();
        // Mise à jour live du nom sur la map
        const playerPoint = document.querySelector(`[data-player-id="${playerId}"] .gm-point-name`);
        if (playerPoint) {
          playerPoint.textContent = e.target.value;
        }
      }
    });
  });

  // AUCUN drag-drop sur la map - utiliser uniquement les vignettes du côté droit pour réorganiser
  // Pas de setupLiveMapDragDrop() appelé ici

  // Boutons navigation
  document.getElementById('gmBtnStartAssignment')?.addEventListener('click', () => {
    gm.state.mode = 'assignRoles';
    gm.state.currentRoleIdx = 0;
    gm.state.nightStep = 1;
    gm.saveState();
    gameUI.render();
  });
}

function detectSideLiveMap(x, y, width, height, tableType = 'circle') {
  const centerX = width / 2;
  const centerY = height / 2;

  // En mode cercle: retourner "CIRCLE" pour un positionnement circulaire
  if (tableType === 'circle') {
    return 'CIRCLE';
  }

  // Mode ovale vertical/horizontal ou rectangulaire: utiliser les 4 zones
  if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
    return x < centerX ? 'LEFT' : 'RIGHT';
  } else {
    return y < centerY ? 'TOP' : 'BOTTOM';
  }
}

function getPositionOnSide(x, y, width, height, side, players, draggedPlayerId, tableType = 'circle') {
  // Calculer l'index de position exact sur le côté (pour insertion entre joueurs)
  const padding = 30;
  const playersOnSide = players.filter(p => {
    const pSide = detectSideLiveMap(p.tableX, p.tableY, width, height, tableType);
    return pSide === side && p.id !== draggedPlayerId;
  });

  if (playersOnSide.length === 0) {
    return { side, index: 0, insertIndex: 0, isExact: false };
  }

  let insertIndex = 0;

  if (side === 'TOP' || side === 'BOTTOM') {
    // Horizontal: trier par X
    playersOnSide.sort((a, b) => a.tableX - b.tableX);
    for (let i = 0; i < playersOnSide.length; i++) {
      const player = playersOnSide[i];
      if (Math.abs(x - player.tableX) < 20) {
        // On est près d'une personne (20px = zone de détection)
        insertIndex = i;
        return { side, index: i, insertIndex: i, isExact: true, exactPlayer: player };
      }
      if (x < player.tableX) {
        insertIndex = i;
        return { side, index: i, insertIndex: i, isExact: false };
      }
    }
    insertIndex = playersOnSide.length;
  } else {
    // Vertical: trier par Y
    playersOnSide.sort((a, b) => a.tableY - b.tableY);
    for (let i = 0; i < playersOnSide.length; i++) {
      const player = playersOnSide[i];
      if (Math.abs(y - player.tableY) < 20) {
        // On est près d'une personne
        insertIndex = i;
        return { side, index: i, insertIndex: i, isExact: true, exactPlayer: player };
      }
      if (y < player.tableY) {
        insertIndex = i;
        return { side, index: i, insertIndex: i, isExact: false };
      }
    }
    insertIndex = playersOnSide.length;
  }

  return { side, index: insertIndex, insertIndex, isExact: false };
}

function repositionPlayersOnSideLiveMap(gameUI, side, draggedPlayerId, insertIndex, tableType = 'circle') {
  const gm = gameUI.gm;
  const players = gm.state.players;
  const container = document.getElementById('gmPlayersContainer');
  if (!container) return;

  const width = 240;
  const height = 240;
  const centerX = width / 2;
  const centerY = height / 2;
  const padding = 30;

  // Trouver le joueur dragué
  const draggedPlayer = players.find(p => p.id === draggedPlayerId);
  if (!draggedPlayer) return;

  // MODE CERCLE: positionner tous les joueurs autour du cercle
  if (tableType === 'circle') {
    const radius = Math.min(centerX, centerY) - padding;
    const totalPlayers = players.length;

    // Calculer l'angle du joueur dragué basé sur sa position courante
    let draggedAngle = 0;
    if (draggedPlayer.tableX !== null && draggedPlayer.tableY !== null) {
      const dx = draggedPlayer.tableX - centerX;
      const dy = draggedPlayer.tableY - centerY;
      draggedAngle = Math.atan2(dy, dx);
    } else {
      draggedAngle = (draggedPlayerId.charCodeAt(0) % totalPlayers) * (Math.PI * 2 / totalPlayers);
    }

    // Convertir en index de position basé sur l'angle
    const anglePerPlayer = (Math.PI * 2) / totalPlayers;
    let bestIndex = Math.round(draggedAngle / anglePerPlayer);
    if (bestIndex < 0) bestIndex += totalPlayers;
    if (bestIndex >= totalPlayers) bestIndex -= totalPlayers;

    // Trier les joueurs par index circulaire
    const orderedPlayers = [];
    for (let i = 0; i < totalPlayers; i++) {
      if (i === bestIndex) {
        orderedPlayers.push(draggedPlayer);
      } else {
        const p = players.find(pl => pl.id !== draggedPlayerId && !orderedPlayers.some(op => op.id === pl.id));
        if (p) orderedPlayers.push(p);
      }
    }

    // Positionner chaque joueur autour du cercle
    orderedPlayers.forEach((p, i) => {
      const angle = (i / totalPlayers) * Math.PI * 2;
      p.tableX = centerX + Math.cos(angle) * radius;
      p.tableY = centerY + Math.sin(angle) * radius;
    });
  } else {
    // MODE RECTANGULAIRE: logique existante
    const playersOnSide = players.filter(p => {
      const pSide = detectSideLiveMap(p.tableX, p.tableY, width, height, tableType);
      return pSide === side && p.id !== draggedPlayerId;
    });

    // Insérer le joueur dragué à la bonne position
    let orderedPlayers;
    if (side === 'TOP' || side === 'BOTTOM') {
      // Trier par X pour horizontal
      playersOnSide.sort((a, b) => a.tableX - b.tableX);
      orderedPlayers = [
        ...playersOnSide.slice(0, insertIndex),
        draggedPlayer,
        ...playersOnSide.slice(insertIndex)
      ];

      // Recalculer les positions côte à côte
      const y = side === 'TOP' ? padding : height - padding;
      const spacing = (width - 2 * padding) / (orderedPlayers.length + 1);
      orderedPlayers.forEach((p, i) => {
        p.tableX = padding + spacing * (i + 1);
        p.tableY = y;
      });
    } else {
      // Trier par Y pour vertical
      playersOnSide.sort((a, b) => a.tableY - b.tableY);
      orderedPlayers = [
        ...playersOnSide.slice(0, insertIndex),
        draggedPlayer,
        ...playersOnSide.slice(insertIndex)
      ];

      // Recalculer les positions empilées
      const x = side === 'LEFT' ? padding : width - padding;
      const spacing = (height - 2 * padding) / (orderedPlayers.length + 1);
      orderedPlayers.forEach((p, i) => {
        p.tableX = x;
        p.tableY = padding + spacing * (i + 1);
      });
    }
  }

  gm.saveState();
  gameUI.render();
}

function setupLiveMapDragDrop(gameUI) {
  const container = document.getElementById('gmPlayersContainer');
  if (!container) return;

  const tableType = gameUI.gm.state.tableType || 'circle';

  let draggedPoint = null;
  let draggedPlayerId = null;
  let offsetX = 0;
  let offsetY = 0;
  let ghostElement = null;
  let previewPlayers = null; // Copie des positions pour le preview

  document.querySelectorAll('.gm-player-point').forEach(point => {
    point.addEventListener('dragstart', (e) => {
      draggedPoint = point;
      draggedPlayerId = point.dataset.playerId;
      const rect = point.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.dataTransfer.effectAllowed = 'move';
      point.style.opacity = '0.5';

      // Créer une copie des positions pour le preview
      previewPlayers = JSON.parse(JSON.stringify(gameUI.gm.state.players));
    });

    point.addEventListener('dragend', () => {
      point.style.opacity = '1';
      draggedPoint = null;
      draggedPlayerId = null;
      previewPlayers = null;

      // Retirer le fantôme
      if (ghostElement) {
        ghostElement.remove();
        ghostElement = null;
      }
    });
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedPlayerId || !draggedPoint || !previewPlayers) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;

    const maxX = rect.width - 20;
    const maxY = rect.height - 20;
    const finalX = Math.max(20, Math.min(x, maxX));
    const finalY = Math.max(20, Math.min(y, maxY));

    const players = gameUI.gm.state.players;
    const draggedPlayer = players.find(p => p.id === draggedPlayerId);
    const padding = 30;
    let ghostX = finalX, ghostY = finalY;

    // MODE CERCLE: calculer position sur le cercle
    if (tableType === 'circle') {
      const centerX = 120;
      const centerY = 120;
      const radius = Math.min(centerX, centerY) - padding;

      // Calculer l'angle du drop
      const dx = finalX - centerX;
      const dy = finalY - centerY;
      const dropAngle = Math.atan2(dy, dx);

      // Angle par joueur
      const anglePerPlayer = (Math.PI * 2) / players.length;

      // Positionner le ghost à cet angle
      ghostX = centerX + Math.cos(dropAngle) * radius;
      ghostY = centerY + Math.sin(dropAngle) * radius;
    } else {
      // MODE RECTANGULAIRE: logique existante
      const side = detectSideLiveMap(finalX, finalY, 240, 240, tableType);
      const posInfo = getPositionOnSide(finalX, finalY, 240, 240, side, players, draggedPlayerId, tableType);
      const playersOnSide = players.filter(p => {
        const pSide = detectSideLiveMap(p.tableX, p.tableY, 240, 240, tableType);
        return pSide === side && p.id !== draggedPlayerId;
      });

      if (side === 'TOP' || side === 'BOTTOM') {
        playersOnSide.sort((a, b) => a.tableX - b.tableX);
        const orderedPlayers = [
          ...playersOnSide.slice(0, posInfo.insertIndex),
          draggedPlayer,
          ...playersOnSide.slice(posInfo.insertIndex)
        ];
        const y = side === 'TOP' ? padding : 240 - padding;
        const spacing = (240 - 2 * padding) / (orderedPlayers.length + 1);
        const index = posInfo.insertIndex;
        ghostX = padding + spacing * (index + 1);
        ghostY = y;
      } else {
        playersOnSide.sort((a, b) => a.tableY - b.tableY);
        const orderedPlayers = [
          ...playersOnSide.slice(0, posInfo.insertIndex),
          draggedPlayer,
          ...playersOnSide.slice(posInfo.insertIndex)
        ];
        const x = side === 'LEFT' ? padding : 240 - padding;
        const spacing = (240 - 2 * padding) / (orderedPlayers.length + 1);
        const index = posInfo.insertIndex;
        ghostX = x;
        ghostY = padding + spacing * (index + 1);
      }
    }

    // Créer ou mettre à jour le fantôme
    if (!ghostElement) {
      ghostElement = draggedPoint.cloneNode(true);
      ghostElement.id = 'ghost-player-' + draggedPlayerId;
      ghostElement.style.opacity = '0.35';
      ghostElement.style.pointerEvents = 'none';
      ghostElement.style.filter = 'grayscale(30%)';
      ghostElement.style.borderWidth = '1px';
      ghostElement.style.borderStyle = 'dashed';
      ghostElement.style.borderColor = '#81dff7';
      ghostElement.style.boxShadow = 'inset 0 0 12px rgba(129, 223, 247, 0.4), 0 0 12px rgba(129, 223, 247, 0.3)';
      container.appendChild(ghostElement);
    }

    // Positionner le fantôme
    if (ghostElement) {
      ghostElement.style.left = ghostX + 'px';
      ghostElement.style.top = ghostY + 'px';
    }

    // === SIMPLE PREVIEW: Juste mettre à jour previewPlayers et afficher les points ===
    // Recalculer les positions de preview
    if (tableType === 'circle') {
      const centerX = 120;
      const centerY = 120;
      const radius = 90 - padding;
      const totalPlayers = previewPlayers.length;

      previewPlayers.forEach((p, i) => {
        const angle = (i / totalPlayers) * Math.PI * 2;
        p.tableX = centerX + Math.cos(angle) * radius;
        p.tableY = centerY + Math.sin(angle) * radius;
      });
    }

    // Mettre à jour l'affichage des points (transition douce)
    document.querySelectorAll('.gm-player-point').forEach(point => {
      const playerId = point.dataset.playerId;
      const player = previewPlayers.find(p => p.id === playerId);
      if (player) {
        point.style.transition = 'all 0.1s ease';
        point.style.left = player.tableX + 'px';
        point.style.top = player.tableY + 'px';
      }
    });
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedPoint || !draggedPlayerId) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;

    const maxX = rect.width - 20;
    const maxY = rect.height - 20;
    const finalX = Math.max(20, Math.min(x, maxX));
    const finalY = Math.max(20, Math.min(y, maxY));

    const players = gameUI.gm.state.players;

    // MODE CERCLE: pas besoin de déterminer un "côté"
    if (tableType === 'circle') {
      repositionPlayersOnSideLiveMap(gameUI, 'CIRCLE', draggedPlayerId, 0, tableType);
    } else {
      // MODE RECTANGULAIRE: logique existante
      const side = detectSideLiveMap(finalX, finalY, 240, 240, tableType);
      const posInfo = getPositionOnSide(finalX, finalY, 240, 240, side, players, draggedPlayerId, tableType);

      // Recalculer les positions avec insertion à la bonne position
      repositionPlayersOnSideLiveMap(gameUI, side, draggedPlayerId, posInfo.insertIndex, tableType);
    }

    // Retirer le fantôme
    if (ghostElement) {
      ghostElement.remove();
      ghostElement = null;
    }
  });
}
