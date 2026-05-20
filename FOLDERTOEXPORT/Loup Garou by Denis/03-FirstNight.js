// ========================================
// ÉCRAN 3: PREMIÈRE NUIT - ASSIGNER LES RÔLES (2 ÉTAPES)
// ========================================

const ROLE_ORDER = [
  'Cupidon', 'Voyante', 'Chasseur', 'Sorcière',
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant',
  'Infect_Pere_Loups', 'Enfant_Sauvage', 'Renard', 'Gitane', 'Joueur_Flute', 'Marionnettiste',
  'Voleur', 'Pyromane', 'Deux_Soeurs', 'Trois_Freres', 'Ankou', 'Abominable_Sectaire',
  'Lapin_Blanc', 'Chevalier_Epee_Rouille', 'Chien_Loup', 'Comedien', 'Juge_Begue', 'Necromancien',
  'Villageois_Villageois', 'Petite_Fille', 'Ancien', 'Bouc_Emissaire', 'Corbeau', 'Montreur_Ours',
  'Salvateur', 'Servante_Devouee', 'Idiot_Village', 'Ange', 'Capitaine', 'Noctambule'
];

const ROLE_ACTIONS = {
  'Cupidon': { instruction: '💘 Sélectionnez 2 joueurs pour les rendre amoureux', type: 'selectPair' },
  'Voyante': { instruction: '👁️ Voyante, tu veux voir l\'identité de qui ?', type: 'voyanteLook' }
};

function getAvailableRolesInOrder(selectedRoles) {
  const rolesInDeck = Object.keys(selectedRoles || {}).filter(r => selectedRoles[r] > 0);
  return ROLE_ORDER.filter(r => rolesInDeck.includes(r));
}

function renderFirstNight(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1; // 1 = assigner, 2 = action

  const availableRoles = getAvailableRolesInOrder(selectedRoles);
  const currentRole = availableRoles[currentRoleIdx];
  const role = gm.roles[currentRole];
  const cardFile = gameUI.getCardFile(currentRole);
  const playerAssignedToRole = players.find(p => p.roleId === currentRole);
  const roleAction = ROLE_ACTIONS[currentRole];

  // Grille compacte 3 par ligne
  const playerGridHtml = players.map(p => {
    const isAssignedToCurrent = p.roleId === currentRole;
    const isAssigned = p.roleId !== null;
    const bgColor = isAssignedToCurrent ? '#4a9d6f' : (isAssigned ? '#666' : '#6b4c9a');
    const borderColor = isAssignedToCurrent ? '#66d999' : (isAssigned ? '#999' : '#9966ff');

    return `
      <div class="gm-player-assign" data-player-id="${p.id}" style="
        padding:6px 4px; margin:2px; border:2px solid ${borderColor}; border-radius:3px;
        background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
        font-size:10px; font-weight:600; user-select:none; transition:all 0.2s;
      ">
        ${p.name}
      </div>
    `;
  }).join('');

  return `
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <!-- GAUCHE: TABLE (1/3) -->
      <div style="position:absolute; left:0; top:0; width:33%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); border-right:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:1px; margin:1px;">
        <div style="position:relative; display:inline-block;">
          <div style="position:relative; display:inline-block; width:240px; height:240px;">
            <div id="gmFirstNightTable" style="position:relative; width:140px; height:140px; background:rgba(120, 85, 60, 0.6); border:3px solid var(--gm-border); box-shadow:inset 0 2px 8px rgba(0,0,0,0.5); border-radius:50%; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.3; font-size:24px;">🪵</div>
            </div>
            <div id="gmFirstNightPlayers" style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%);"></div>
          </div>
        </div>
      </div>

      <!-- DROITE: ASSIGNATION (2/3) -->
      <div style="margin-left:33%; display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
        <!-- HAUT: INFO RÔLE -->
        <div style="padding:10px; border-bottom:1px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); flex:0 0 auto;">
          <div style="display:flex; gap:8px; align-items:center;">
            <img src="cards/${cardFile}.webp" alt="${currentRole}" style="width:40px; height:52px; object-fit:cover; border-radius:3px; border:1px solid rgba(199,125,255,0.4);">
            <div style="flex:1; min-width:0;">
              <div style="font-size:12px; color:#e8e8f0; font-weight:600;">${currentRole}</div>
              <div style="font-size:8px; color:#aaa; margin-top:2px; max-height:30px; overflow-y:auto; line-height:1.2;">${role ? role.description : ''}</div>
            </div>
          </div>
          ${step === 1 ? `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 1/2: Assigner le joueur</div>
          ` : `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 2/2: Action du rôle</div>
          `}
        </div>

        <!-- MILIEU: CONTENU (changeable par étape) -->
        <div style="flex:1; padding:10px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          ${step === 1 ? `
            <!-- ÉTAPE 1: ASSIGNATION -->
            <div style="font-size:9px; color:#81dff7; font-weight:600;">🎯 Cliquez sur un joueur:</div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
              ${playerGridHtml}
            </div>
          ` : `
            <!-- ÉTAPE 2: ACTION -->
            ${playerAssignedToRole && roleAction ? `
              <div style="padding:8px; background:rgba(100,150,255,0.15); border:1px solid rgba(100,150,255,0.3); border-radius:4px; margin-bottom:8px;">
                <div style="font-size:10px; color:#81dff7; font-weight:600; margin-bottom:4px;">
                  ${roleAction.instruction}
                </div>
              </div>

              ${roleAction.type === 'selectPair' ? `
                <!-- ACTION CUPIDON -->
                <div id="gmCupidoSelected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
                  Aucun sélectionné
                </div>
                <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">💘 Sélectionnez 2 joueurs:</div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
                  ${players.map(p => {
                    const isSelected = (gm.state.cupidoSelection || []).includes(p.id);
                    const bgColor = isSelected ? '#4a9d6f' : '#6b4c9a';
                    const borderColor = isSelected ? '#66d999' : '#9966ff';
                    return `
                      <div class="gm-cupido-select" data-player-id="${p.id}" style="
                        padding:6px 4px; margin:2px; border:2px solid ${borderColor}; border-radius:3px;
                        background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
                        font-size:10px; font-weight:600; user-select:none; transition:all 0.2s;
                      ">
                        ${p.name}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : roleAction.type === 'voyanteLook' ? `
                <!-- ACTION VOYANTE -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Joueur à voir:</div>
                  <select id="gmVoyanteTouches" style="padding:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(199,125,255,0.3); color:#e8e8f0; border-radius:3px; font-size:9px;">
                    <option value="">-- Sélectionner un joueur --</option>
                    ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                  </select>

                  <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">Rôle du joueur:</div>
                  <select id="gmVoyanteSees" style="padding:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(199,125,255,0.3); color:#e8e8f0; border-radius:3px; font-size:9px;">
                    <option value="">-- Sélectionner le rôle --</option>
                    ${Object.keys(gm.roles).map(roleId => `<option value="${roleId}">${roleId}</option>`).join('')}
                  </select>

                  <div id="gmVoyanteResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune sélection
                  </div>
                </div>
              ` : ''}
            ` : ''}
          `}
        </div>

        <!-- BAS: NAVIGATION -->
        <div style="padding:8px; border-top:1px solid rgba(199,125,255,0.2); display:flex; gap:6px; background:rgba(0,0,0,0.3); flex-shrink:0; flex-wrap:wrap;">
          <button id="gmBtnBackToTable" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:6px 10px; border-radius:4px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:0; font-size:9px;">← Table</button>
          ${step === 1 && playerAssignedToRole ? `
            <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Suivant →</button>
          ` : step === 2 ? `
            <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Rôle Suivant →</button>
          ` : ''}
          ${step === 2 && currentRoleIdx > 0 ? `
            <button id="gmBtnPrevStep" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:6px 10px; border-radius:4px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:0; font-size:9px;">← Retour</button>
          ` : ''}
          ${step === 2 && currentRoleIdx >= availableRoles.length - 1 ? `
            <button id="gmBtnFinishGame" style="background:linear-gradient(135deg, #4a9d6f, #66d999); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:0; font-size:9px;">✓ Commencer</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function attachFirstNightEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;
  const availableRoles = getAvailableRolesInOrder(selectedRoles);
  const currentRole = availableRoles[currentRoleIdx];

  // Mise à jour de la table
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
    const isAssignedToCurrent = p.roleId === currentRole;
    const isAssigned = p.roleId !== null;
    const dotColor = isAssignedToCurrent ? '#4a9d6f' : (isAssigned ? '#666' : '#9966ff');

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${x}px; top: ${y}px; position:absolute; cursor:pointer;">
        <div class="gm-point-dot" style="background:${dotColor};"></div>
        <div class="gm-point-name">${p.name}</div>
      </div>
    `;
  }).join('');

  document.getElementById('gmFirstNightPlayers').innerHTML = playerPoints;

  // Assignation (étape 1)
  document.querySelectorAll('.gm-player-assign').forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      const player = players.find(p => p.id === playerId);

      if (player && !player.roleId) {
        player.roleId = currentRole;
        // Enregistrer dans le log
        gm.assignRole(player.name, currentRole);
        gm.saveState();
        gameUI.render();
      } else if (player && player.roleId === currentRole) {
        player.roleId = null;
        gm.saveState();
        gameUI.render();
      }
    });
  });

  // Gestion Cupidon (étape 2)
  if (step === 2 && currentRole === 'Cupidon') {
    if (!gm.state.cupidoSelection) gm.state.cupidoSelection = [];

    const selectedDisplay = document.getElementById('gmCupidoSelected');
    const updateSelection = () => {
      const selected = gm.state.cupidoSelection || [];
      const selectedNames = selected.map(id => {
        const p = players.find(pl => pl.id === id);
        return p ? p.name : '';
      }).filter(n => n);

      if (selectedDisplay) {
        selectedDisplay.textContent = selectedNames.length > 0
          ? `✓ ${selectedNames.join(' & ')}`
          : 'Aucun sélectionné';
      }
    };

    // Event listeners sur les vignettes Cupidon
    document.querySelectorAll('.gm-cupido-select').forEach(elem => {
      elem.addEventListener('click', () => {
        const playerId = elem.dataset.playerId;
        const selected = gm.state.cupidoSelection || [];

        if (selected.includes(playerId)) {
          gm.state.cupidoSelection = selected.filter(id => id !== playerId);
        } else if (selected.length < 2) {
          gm.state.cupidoSelection = [...selected, playerId];
        }

        gm.saveState();
        updateSelection();
        gameUI.render();
      });
    });

    // Highlight sur la map également
    document.querySelectorAll('.gm-player-point').forEach(point => {
      const pid = point.dataset.playerId;
      if ((gm.state.cupidoSelection || []).includes(pid)) {
        point.style.opacity = '1';
        point.style.transform = 'scale(1.2)';
      } else {
        point.style.opacity = '0.7';
        point.style.transform = 'scale(1)';
      }
    });

    updateSelection();
  }

  // Navigation
  document.getElementById('gmBtnNextStep')?.addEventListener('click', () => {
    if (step === 1) {
      gm.state.nightStep = 2;
    } else {
      // Enregistrer l'action du rôle avant de passer au suivant
      if (currentRole === 'Cupidon' && gm.state.cupidoSelection && gm.state.cupidoSelection.length === 2) {
        const selected = gm.state.cupidoSelection;
        const p1 = players.find(p => p.id === selected[0]);
        const p2 = players.find(p => p.id === selected[1]);
        if (p1 && p2) {
          gm.cupidoAction(p1.name, p2.name);
        }
      }

      gm.state.currentRoleIdx = currentRoleIdx + 1;
      gm.state.nightStep = 1;
      gm.state.cupidoSelection = [];
      gm.saveState();
    }
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnPrevStep')?.addEventListener('click', () => {
    gm.state.nightStep = 1;
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnBackToTable')?.addEventListener('click', () => {
    gm.state.mode = 'tableSetup';
    gm.state.currentRoleIdx = 0;
    gm.state.nightStep = 1;
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnFinishGame')?.addEventListener('click', () => {
    gm.state.mode = 'gameRunning';
    gm.saveState();
    gameUI.render();
  });
}
