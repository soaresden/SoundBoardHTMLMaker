// ========================================
// 04-ROLE DETAIL AND TIPS
// Assignation des rôles et affichage des détails
// ========================================

// Roles avec action seulement (pas d'étape d'assignation)
const ROLES_ACTION_ONLY_TIPS = new Set([
  'Ange', 'Idiot_Village', 'Ancien', 'Noctambule', 'Joueur_Flute',
  'Voleur', 'Marionnettiste', 'Pyromane', 'Ankou', 'Juge_Begue'
]);

// Rôles sans action du tout
const ROLES_WITHOUT_ACTION_TIPS = new Set([
  'Villageois_Villageois', 'Corbeau', 'Salvateur'
]);

// CSS pour l'animation breathe du joueur en cours
const BREATHE_ANIMATION = `
  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.9; }
  }
  @keyframes breathe-once {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.9; }
  }
  .gm-player-assign.current {
    animation: breathe-once 1s ease-in-out 3;
  }
`;

// Fonction standard pour assigner/désassigner un joueur à un rôle
function assignPlayerToRole(gameUI, playerId, roleId) {
  const gm = gameUI.gm;
  const player = gm.state.players.find(p => p.id === playerId);
  if (!player) return;

  // Toggle: si déjà assigné, désassigner; sinon assigner
  if (player.roleId === roleId) {
    player.roleId = null;
  } else {
    player.roleId = roleId;
  }

  gm.saveState();
  gameUI.render();

  // Re-attach events
  setTimeout(() => attachRoleDetailandTipsEvents(gameUI), 0);
}

function renderRoleDetailandTips(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;

  const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
  const currentRole = availableRoles[currentRoleIdx];
  const role = gm.getRoleInfo(currentRole);
  const tableType = gm.state.tableType || 'circle';

  // Log d'accueil
  if (currentRoleIdx === 0 && !gm.state.welcomeLogged) {
    gm.addLog('🎮 BIENVENUE AU VILLAGE !', 'welcome', 0);
    const playerNames = players.map(p => p.name).join(', ');
    gm.addLog(`Le village accueille ${players.length} habitants: ${playerNames}`, 'info', 0);
    gm.addLog('Préparez-vous à dormir votre première nuit...', 'info', 0);
    gm.state.welcomeLogged = true;
  }

  const requiredCount = selectedRoles[currentRole] || 1;
  const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
  const playerAssignedToRole = playersAssignedToRole.length > 0 ? playersAssignedToRole[0] : null;

  const roleAction = ROLE_ACTIONS[currentRole];
  const cardFile = gameUI.getCardFile(currentRole);

  // Déterminer l'étape effective
  const isActionOnly = ROLES_ACTION_ONLY_TIPS.has(currentRole);
  const hasNoAction = ROLES_WITHOUT_ACTION_TIPS.has(currentRole);
  let effectiveStep = step;

  if (isActionOnly && step === 1) {
    effectiveStep = 2;
  } else if (hasNoAction && step === 2) {
    effectiveStep = 1;
  }

  // Déterminer les joueurs disponibles
  const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
  const isWolfRole = (roleId) => wolfRoles.includes(roleId);

  const currentRoleIsWolf = isWolfRole(currentRole);
  let availablePlayers;
  if (currentRoleIsWolf) {
    const existingWolves = players.filter(p => p.roleId && isWolfRole(p.roleId));
    if (currentRole === 'Simple_Loup_Garou') {
      const unassignedPlayers = players.filter(p => !p.roleId);
      availablePlayers = [...existingWolves, ...unassignedPlayers];
    } else if (currentRole === 'Loup_Garou_Blanc') {
      availablePlayers = players.filter(p => p.roleId === 'Simple_Loup_Garou');
    } else {
      availablePlayers = existingWolves;
    }
  } else {
    availablePlayers = players.filter(p => !p.roleId);
  }

  // Récupérer les couleurs du rôle
  const roleVisual = role?.visual || {};
  const roleBgColor = roleVisual.fondColor || '#4a9d6f';
  const roleBorderColor = roleVisual.borderColor || '#ffffff';

  const playerGridHtml = availablePlayers.map(p => {
    const isAssigned = p.roleId === currentRole;

    // Couleurs du rôle: pleines si assigné, réduites sinon
    let bgColor = isAssigned ? roleBgColor : `${roleBgColor}40`;  // 25% opacity for unassigned
    let borderColor = isAssigned ? roleBorderColor : 'rgba(199,125,255,0.3)';

    const buttonStyle = `padding:6px 8px; background:${bgColor}; border:2px solid ${borderColor}; border-radius:3px; box-shadow:0 2px 6px ${borderColor}60, inset 0 1px 2px rgba(255,255,255,0.1); width:100%; box-sizing:border-box;`;

    return `
      <button class="gm-player-assign ${isAssigned ? 'current' : ''}" data-player-id="${p.id}"
        style="cursor:pointer; user-select:none; transition:all 0.3s; ${buttonStyle} font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; min-height:40px; color:#ffffff;"
        title="${p.name}">
        ${p.name}
      </button>
    `;
  }).join('');

  const isAssignmentComplete = playersAssignedToRole.length >= requiredCount;
  const nextButtonStyle = !isAssignmentComplete
    ? 'opacity:0.5; cursor:not-allowed;'
    : 'opacity:1; cursor:pointer;';

  // Vérifier si l'action est complète en step 2
  let actionComplete = true;
  if (roleAction && window.isActionComplete) {
    actionComplete = window.isActionComplete(gm, currentRole);
  }
  const actionButtonStyle = !actionComplete
    ? 'opacity:0.5; cursor:not-allowed;'
    : 'opacity:1; cursor:pointer;';

  return `
    <style>${BREATHE_ANIMATION}</style>
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <!-- BOUTON RETOUR -->
      <div style="height:auto; padding:0; display:flex; gap:0;">
        <div style="width:33%; padding:6px 6px 0 6px;">
          <button id="gmBtnPrevStep" style="background:#ffffff; border:none; padding:6px 12px; border-radius:4px; color:#1a1a2e; font-weight:700; cursor:pointer; font-size:11px; width:100%; box-sizing:border-box;">Retour</button>
        </div>
        <div style="flex:1;"></div>
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div style="flex:1; display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
        <!-- HAUT: INFO RÔLE -->
        <div style="padding:10px; border-bottom:1px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); flex:0 0 auto;">
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <img src="${cardFile}" alt="${currentRole}" style="width:40px; height:52px; object-fit:cover; border-radius:3px; border:1px solid rgba(199,125,255,0.4);" onerror="return false">
            <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:3px;">
              <div style="font-size:12px; color:#e8e8f0; font-weight:600;">${currentRole}</div>
              <div style="font-size:10px; color:#ccc; flex:0 1 auto; max-height:60px; overflow-y:auto; line-height:1.3; padding:3px; background:rgba(0,0,0,0.2); border-radius:2px; border-left:2px solid rgba(199,125,255,0.3);">${role?.pouvoir || role?.description || 'Pas de description'}</div>
              ${role?.tips ? `<div style="font-size:9px; color:#81dff7; line-height:1.2; padding:3px; background:rgba(102,217,153,0.1); border-radius:2px; border-left:2px solid rgba(102,217,153,0.3);">💡 ${role.tips}</div>` : ''}
            </div>
          </div>
          ${effectiveStep === 1 ? `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 1/2: Assigner ${requiredCount === 1 ? '1 joueur' : requiredCount + ' joueurs'} (${playersAssignedToRole.length}/${requiredCount})</div>
          ` : `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 2/2: Action du rôle</div>
          `}
        </div>

        <!-- MILIEU: CONTENU -->
        <div style="flex:1; padding:8px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
          ${effectiveStep === 1 ? `
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; justify-items:stretch; align-content:start;">
              ${playerGridHtml}
            </div>
          ` : `
            ${playerAssignedToRole && roleAction ? `
              <div id="gmRoleActionContainer" style="flex:1; display:flex; flex-direction:column; gap:8px;"></div>
            ` : ''}
          `}
        </div>

        <!-- BAS: BOUTONS -->
        <div style="padding:8px; border-top:1px solid rgba(199,125,255,0.2); background:rgba(0,0,0,0.3); display:flex; gap:8px; flex-shrink:0;">
          ${effectiveStep === 1 ? `
            <button id="gmRoleDetailSkip" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:6px 12px; border-radius:4px; color:#e8e8f0; font-weight:600; cursor:pointer; font-size:9px; flex:1;">
              Passer
            </button>
            <button id="gmRoleDetailNext" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 12px; border-radius:4px; color:white; font-weight:600; font-size:9px; flex:1; ${nextButtonStyle} ${!isAssignmentComplete ? 'disabled' : ''}" ${!isAssignmentComplete ? 'disabled' : ''}>
              Suivant
            </button>
          ` : `
            <button id="gmRoleActionConfirm" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 12px; border-radius:4px; color:white; font-weight:600; font-size:9px; flex:1; ${actionButtonStyle}" ${!actionComplete ? 'disabled' : ''}>
              Terminer
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

function attachRoleDetailandTipsEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;
  const selectedRoles = gm.state.selectedRoles || {};
  const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
  const currentRole = availableRoles[currentRoleIdx];
  const requiredCount = selectedRoles[currentRole] || 1;

  const isActionOnly = ROLES_ACTION_ONLY_TIPS.has(currentRole);
  const hasNoAction = ROLES_WITHOUT_ACTION_TIPS.has(currentRole);
  let effectiveStep = step;

  if (isActionOnly && step === 1) {
    effectiveStep = 2;
  } else if (hasNoAction && step === 2) {
    effectiveStep = 1;
  }

  // Bouton retour
  document.getElementById('gmBtnPrevStep')?.addEventListener('click', () => {
    if (step === 1) {
      gm.state.currentRoleIdx = Math.max(0, currentRoleIdx - 1);
      gm.state.nightStep = 1;
      const prevRole = availableRoles[gm.state.currentRoleIdx];
      const prevRoleCount = selectedRoles[prevRole] || 1;
      const prevPlayersAssigned = players.filter(p => p.roleId === prevRole).length;
      gm.state.nightStep = prevPlayersAssigned < prevRoleCount ? 1 : 2;
    } else {
      // Step 2: Annuler l'action avant de retourner à step 1
      gm.state.nightStep = 1;

      // Annuler les sélections de l'action en cours
      if (currentRole === 'Enfant_Sauvage') {
        gm.state.enfantSauvageIdol = { playerId: null };
      } else if (currentRole === 'Cupidon') {
        gm.state.cupidoSelection = [];
      } else if (currentRole === 'Chien_Loup') {
        gm.state.chienLoupChoice = null;
      }
      // Ajouter d'autres annulations selon les rôles...
      console.log(`[RoleDetailandTips] Action ${currentRole} annulée`);
    }
    gm.saveState();
    gameUI.render();
  });

  // Gestion de l'assignation des joueurs - Étape 1 UNIQUEMENT
  if (effectiveStep === 1) {
    document.querySelectorAll('.gm-player-assign').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        console.log(`[RoleDetailandTips] Clicked player button: ${player.name} (${playerId})`);

        const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
        const isAlreadyAssigned = player.roleId === currentRole;

        console.log(`[RoleDetailandTips] Current role: ${currentRole}, Already assigned: ${isAlreadyAssigned}, Players assigned: ${playersAssignedToRole.length}/${requiredCount}`);

        // Si déjà assigné, on peut désassigner
        if (isAlreadyAssigned) {
          console.log(`[RoleDetailandTips] Unassigning ${player.name} from ${currentRole}`);
          player.roleId = null;
          gm.addLog(`${player.name} - a été désassigné du rôle ${currentRole}`, 'action', 1);
        } else {
          // Vérifier qu'on n'a pas déjà atteint le max
          if (playersAssignedToRole.length >= requiredCount) {
            console.log(`[RoleDetailandTips] Max players reached for ${currentRole} (${requiredCount}), ignoring click`);
            return; // Max atteint, ignorer
          }
          console.log(`[RoleDetailandTips] Assigning ${player.name} to ${currentRole}`);
          player.roleId = currentRole;
          const roleInfo = gm.getRoleInfo(currentRole);
          gm.addLog(`${roleInfo?.emoji || '?'} ${currentRole} - a été assigné à ${player.name}`, 'action', 0);
        }

        gm.saveState();
        console.log(`[RoleDetailandTips] State saved, rendering...`);
        gameUI.render();

        setTimeout(() => {
          attachRoleDetailandTipsEvents(gameUI);

          // RETRIGGER animation breathe sur le joueur assigné
          // Force une reflow pour redémarrer l'animation CSS
          setTimeout(() => {
            const assignedBtn = document.querySelector(`[data-player-id="${playerId}"].gm-player-assign.current`);
            if (assignedBtn) {
              console.log(`[RoleDetailandTips] Retriggering breathe animation for ${player.name}`);
              // Forcer la reflow en supprimant/readjoutant la classe
              assignedBtn.classList.remove('current');
              void assignedBtn.offsetWidth; // Force reflow
              assignedBtn.classList.add('current');
            }
          }, 50);
        }, 0);
      });
    });

    // Boutons navigation Étape 1
    document.getElementById('gmRoleDetailSkip')?.addEventListener('click', () => {
      gm.state.nightStep = 2;
      gm.saveState();
      gameUI.render();
    });

    document.getElementById('gmRoleDetailNext')?.addEventListener('click', () => {
      const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
      if (playersAssignedToRole.length >= requiredCount) {
        gm.state.nightStep = 2;
        gm.saveState();
        gameUI.render();
      }
    });
  } else {
    // Étape 2 - Actions du rôle
    document.getElementById('gmRoleActionConfirm')?.addEventListener('click', () => {
      gm.state.currentRoleIdx = currentRoleIdx + 1;
      gm.state.nightStep = 1;

      const nextAvailableRoles = getAvailableRolesInOrder(selectedRoles, gm);
      if (gm.state.currentRoleIdx >= nextAvailableRoles.length) {
        gm.state.mode = 'night';
        gm.state.nightStep = 1;
      }

      gm.saveState();
      gameUI.render();
    });
  }

  // Attach role action handlers if in step 2
  if (effectiveStep === 2 && window.attachRoleActionHandlers) {
    const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
    const playerAssignedToRole = playersAssignedToRole.length > 0 ? playersAssignedToRole[0] : null;
    const roleAction = ROLE_ACTIONS[currentRole];

    console.log(`[04-RoleDetailandTips Step 2] Rôle: ${currentRole}, Joueur assigné: ${playerAssignedToRole?.name || 'NONE'}, Action: ${roleAction?.type || 'NONE'}`);

    if (playerAssignedToRole && roleAction) {
      // D'ABORD: Générer et insérer le HTML de l'action
      const actionContainer = document.getElementById('gmRoleActionContainer');
      if (actionContainer && window.renderRoleActionsUI) {
        const actionHtml = renderRoleActionsUI(gameUI, currentRole, roleAction, players, selectedRoles);
        actionContainer.innerHTML = actionHtml;
        console.log(`[04-RoleDetailandTips Step 2] HTML inséré dans gmRoleActionContainer`);
      }

      // ENSUITE: Attacher les event handlers
      console.log(`[04-RoleDetailandTips Step 2] Appel de attachRoleActionHandlers()`);
      attachRoleActionHandlers(gameUI, currentRole, players, selectedRoles, playerAssignedToRole);
    } else {
      console.log(`[04-RoleDetailandTips Step 2] ❌ Condition non remplie: playerAssignedToRole=${!!playerAssignedToRole}, roleAction=${!!roleAction}`);
    }
  }
}
