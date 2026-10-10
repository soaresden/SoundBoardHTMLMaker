// ========================================
// 05-ROLE ACTIONS
// Gestion des actions spécifiques aux rôles
// ========================================

function renderRoleActionsUI(gameUI, currentRole, roleAction, players, selectedRoles) {
  const gm = gameUI.gm;

  console.log(`[renderRoleActionsUI] Rôle: ${currentRole}, Type: ${roleAction.type}`);

  // Filtrer les joueurs selon le rôle
  let availablePlayers;
  if (currentRole === 'Corbeau' || currentRole === 'Salvateur' || currentRole === 'Enfant_Sauvage') {
    availablePlayers = gameUI.gm.state.players || [];
  } else {
    availablePlayers = players.filter(p => !p.roleId);
  }

  // Pour Enfant_Sauvage: exclure SEULEMENT le joueur Enfant_Sauvage lui-même (pour éviter auto-sélection)
  // Tous les autres joueurs restent visibles pour permettre le re-clic et changement de sélection
  if (currentRole === 'Enfant_Sauvage') {
    const playerAssignedToRole = players.find(p => p.roleId === 'Enfant_Sauvage');
    if (playerAssignedToRole) {
      availablePlayers = availablePlayers.filter(p => p.id !== playerAssignedToRole.id);
    }
    console.log(`[renderRoleActionsUI Enfant_Sauvage] ${availablePlayers.length} joueurs disponibles pour sélection`);
  }

  if (roleAction.type === 'selectPair') {
    const stateKey = currentRole === 'Cupidon' ? 'cupidoSelection' : `${currentRole}Selection`;
    return `
      <div id="gm${currentRole}Selected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
        Aucun sélectionné
      </div>
      <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">Sélectionnez 2 joueurs:</div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
        ${availablePlayers.map(p => {
          const isSelected = (gm.state[stateKey] || []).includes(p.id);

          // Récupérer les couleurs du rôle depuis le JSON
          const roleInfo = gameUI.gm.getRoleInfo(currentRole);
          const roleVisual = roleInfo?.visual || {};
          const roleBgColor = roleVisual.fondColor || '#4a9d6f';
          const roleBorderColor = roleVisual.borderColor || '#ffffff';

          const bgColor = isSelected ? roleBgColor : 'rgba(81, 116, 219, 0.15)';
          const borderColor = isSelected ? roleBorderColor : 'rgba(199,125,255,0.3)';
          const borderWidth = isSelected ? '2px' : '1px';

          const className = currentRole === 'Cupidon' ? 'gm-cupido-select' : `gm${currentRole}Select`;
          return `
            <button class="${className}" data-player-id="${p.id}" style="
              padding:6px 4px; margin:2px; border:${borderWidth} solid ${borderColor}; border-radius:3px;
              background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
              font-size:10px; font-weight:600; user-select:none; transition:all 0.2s; box-shadow:0 2px 6px ${borderColor}40;
            ">
              ${p.name}
            </button>
          `;
        }).join('')}
      </div>
    `;
  } else if (roleAction.type === 'enfantSauvageIdol') {
    return `
      <div id="gmEnfantSauvageIdolSelected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
        Aucune sélection
      </div>
      <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">Sélectionne ton idole:</div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
        ${availablePlayers.map(p => {
          const isSelected = gm.state.enfantSauvageIdol?.playerId === p.id;
          const enfantRole = gameUI.gm.getRoleInfo('Enfant_Sauvage');
          const enfantVisual = enfantRole?.visual || {};
          const roleBgColor = enfantVisual.fondColor || '#66d999';
          const roleBorderColor = enfantVisual.borderColor || '#66d999';

          const bgColor = isSelected ? roleBgColor : 'rgba(81, 116, 219, 0.15)';
          const borderColor = isSelected ? roleBorderColor : 'rgba(199,125,255,0.3)';
          const borderWidth = isSelected ? '2px' : '1px';

          return `
            <div class="gm-enfant-sauvage-idol-select" data-player-id="${p.id}" style="
              padding:6px 4px; margin:2px; border:${borderWidth} solid ${borderColor}; border-radius:3px;
              background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
              font-size:10px; font-weight:600; user-select:none; transition:all 0.2s; box-shadow:0 2px 6px ${borderColor}40;
            ">
              ${p.name}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (roleAction.type === 'selectOne') {
    let label = 'Sélectionne un joueur:';
    if (currentRole === 'Corbeau') {
      label = `À qui voles-tu 2 votes? (${availablePlayers.length} joueurs)`;
    } else if (currentRole === 'Salvateur') {
      label = `Qui anticipes-tu pour l'infection? (${availablePlayers.length} joueurs vivants)`;
    }
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">${label}</div>
        <select id="gmSelectOneTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmSelectOneResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'voyanteLookRoles') {
    const voyanteLookRoles = gm.state.voyanteLookRoles || {};
    const assignmentsSummary = Object.entries(voyanteLookRoles).map(([playerId, roleId]) => {
      const player = availablePlayers.find(p => p.id === playerId);
      const roleEmoji = window.getVisualEmoji?.(roleId) || '❓';
      return `<div style="font-size:9px; color:#66d999; font-weight:600; padding:4px 6px; background:rgba(102,217,153,0.15); border-left:3px solid #66d999; margin:4px 0;">
        ✓ ${player?.name || '?'} → ${roleId} ${roleEmoji}
      </div>`;
    }).join('');

    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600; margin-bottom:4px;">Clique sur les joueurs pour voir/assigner leurs rôles:</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
          ${availablePlayers.map(p => {
            const assignedRole = gm.state.voyanteLookRoles?.[p.id];
            const bgColor = assignedRole ? 'rgba(100,150,200,0.3)' : 'rgba(100,80,150,0.2)';
            const borderColor = assignedRole ? 'rgba(100,150,200,0.6)' : 'rgba(100,150,255,0.3)';

            return `
              <div class="gm-voyante-player-btn" data-player-id="${p.id}" style="
                padding:8px 4px; border:2px solid ${borderColor}; border-radius:4px;
                background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
                font-size:10px; font-weight:600; user-select:none; transition:all 0.2s;
              ">
                ${p.name}
              </div>
            `;
          }).join('')}
        </div>
        <div id="gmVoyanteLookRolesContainer" style="margin-top:8px;"></div>
        ${assignmentsSummary ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(102,217,153,0.3);">
          <div style="font-size:8px; color:#aaa; font-weight:600; margin-bottom:3px;">Rôles assignés:</div>
          ${assignmentsSummary}
        </div>` : ''}
      </div>
    `;
  } else if (roleAction.type === 'voyanteLook') {
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Joueur à voir:</div>
        <select id="gmVoyanteTouches" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">Rôle du joueur:</div>
        <div id="gmVoyanteRoleContainer">
          <select id="gmVoyanteSees" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600; width:100%;">
            <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner le rôle --</option>
            ${Object.keys(selectedRoles).filter(roleId => selectedRoles[roleId] > 0).map(roleId => `<option value="${roleId}" style="background:#000000; color:#e8e8f0;">${roleId}</option>`).join('')}
          </select>
        </div>
        <div id="gmVoyanteResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'chienLoupChoice') {
    const chienLoupChoice = gm.state.chienLoupChoice || null;
    const wolfEmoji = roleAction.chooseWolfEmoji || '🐺';
    const villageoisEmoji = roleAction.chooseVillageoisEmoji || '🪏';
    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Quelle est ta nature cette nuit?</div>
        <div style="display:flex; gap:6px;">
          <div id="gmChienLoupVillageois" class="gm-chien-loup-choice" data-choice="villageois" style="
            flex:1; padding:12px 8px; border:2px solid ${chienLoupChoice === 'villageois' ? '#66d999' : 'rgba(199,125,255,0.3)'};
            border-radius:4px; background:${chienLoupChoice === 'villageois' ? 'rgba(102,217,153,0.2)' : '#6b4c9a'};
            color:#e8e8f0; cursor:pointer; text-align:center; font-size:11px; font-weight:600; user-select:none;
            transition:all 0.2s;
          ">
            ${villageoisEmoji}<br>Villageois
          </div>
          <div id="gmChienLoupLoup" class="gm-chien-loup-choice" data-choice="loup" style="
            flex:1; padding:12px 8px; border:2px solid ${chienLoupChoice === 'loup' ? '#d46666' : 'rgba(199,125,255,0.3)'};
            border-radius:4px; background:${chienLoupChoice === 'loup' ? 'rgba(212,102,102,0.2)' : '#6b4c9a'};
            color:#e8e8f0; cursor:pointer; text-align:center; font-size:11px; font-weight:600; user-select:none;
            transition:all 0.2s;
          ">
            ${wolfEmoji}<br>Loup-Garou
          </div>
        </div>
        <div id="gmChienLoupResult" style="font-size:9px; color:#aaa; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; text-align:center;">
          ${chienLoupChoice === 'villageois' ? `✓ Tu restes Villageois ${villageoisEmoji}` : chienLoupChoice === 'loup' ? `✓ Tu deviens Loup-Garou ${wolfEmoji}` : 'Aucune sélection'}
        </div>
      </div>
    `;
  } else {
    // Fallback pour types d'action non gérés
    return `<div style="color:#999; font-size:9px; padding:10px;">Action de type "${roleAction.type}" non encore implémentée</div>`;
  }
}

function attachRoleActionsEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const selectedRoles = gm.state.selectedRoles || {};
  const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
  const currentRole = availableRoles[currentRoleIdx];
  const roleAction = ROLE_ACTIONS[currentRole];

  if (!roleAction) return;

  // REMPLIR le container avec le HTML des actions
  const actionContainer = document.getElementById('gmRoleActionContainer');
  if (actionContainer) {
    const actionHtml = renderRoleActionsUI(gameUI, currentRole, roleAction, players, selectedRoles);
    actionContainer.innerHTML = actionHtml;
  }

  // Dispatch vers les handlers d'action appropriés
  if (window.attachSelectOneHandlers && roleAction.type === 'selectOne') {
    attachSelectOneHandlers(gameUI, currentRole, players);
  }

  if (roleAction.type === 'selectPair') {
    if (currentRole === 'Cupidon' && window.attachCupidoHandlers) {
      attachCupidoHandlers(gameUI, players);
    } else if (window.attachSelectPairHandlers) {
      attachSelectPairHandlers(gameUI, currentRole, players);
    }
  }

  // Enfant Sauvage est géré par attachRoleActionHandlers() -> attachEnfantSauvageHandlers() dans 04-FirstNight-Actions.js
  // N'ajouter aucun code ici pour éviter les doublons de handlers

  if (window.attachVoyanteHandlers && roleAction.type === 'voyanteLookRoles') {
    attachVoyanteHandlers(gameUI, players, selectedRoles);
  }

  if (window.attachSorcierePotionsHandlers && roleAction.type === 'sorcierePotions') {
    attachSorcierePotionsHandlers(gameUI, players);
  }

  if (window.attachWolvesKillHandlers && (currentRole === 'Simple_Loup_Garou' || currentRole === 'Grand_Mechant_Loup')) {
    attachWolvesKillHandlers(gameUI, players, currentRole);
  }

  if (window.attachRenardHandlers && currentRole === 'Renard') {
    attachRenardHandlers(gameUI, players);
  }

  // Chien Loup est géré par attachRoleActionHandlers() -> attachChienLoupHandlers() dans 04-FirstNight-Actions.js
  // N'ajouter aucun code ici pour éviter les doublons de handlers

  if (window.attachJugeBegueHandlers && currentRole === 'Juge_Begue') {
    attachJugeBegueHandlers(gameUI, players);
  }
}
