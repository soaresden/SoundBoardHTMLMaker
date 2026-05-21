// ========================================
// ÉCRAN 3B: PREMIÈRE NUIT - ACTIONS DES RÔLES
// ========================================
// Ce fichier gère la logique des actions pendant la première nuit
// Basé sur roles.json et ROLE_ACTIONS du fichier 03-FirstNight.js

// ===== HANDLERS POUR CHAQUE TYPE D'ACTION =====

function attachSelectOneHandlers(gameUI, currentRole, players) {
  const gm = gameUI.gm;
  const stateKey = `${currentRole}Target`;
  if (!gm.state[stateKey]) gm.state[stateKey] = null;

  const targetSelect = document.getElementById('gmSelectOneTarget');
  const resultDisplay = document.getElementById('gmSelectOneResult');

  const updateResult = () => {
    const targetId = gm.state[stateKey];
    if (targetId) {
      const target = players.find(p => p.id === targetId);

      // Vérification spéciale pour Salvateur
      if (currentRole === 'Salvateur') {
        const salvateurHistory = gm.state.salvateurHistory || [];
        const lastSavedId = salvateurHistory.length > 0 ? salvateurHistory[salvateurHistory.length - 1] : null;
        if (targetId === lastSavedId) {
          resultDisplay.innerHTML = `⚠️ <strong>${target?.name || ''}</strong> - Tu l'as déjà sauvé la dernière fois!`;
          resultDisplay.style.color = '#ff9800';
          return;
        }
      }

      resultDisplay.innerHTML = `✓ <strong>${target?.name || ''}</strong>`;
      resultDisplay.style.color = '#66d999';
    } else {
      resultDisplay.textContent = 'Aucune sélection';
      resultDisplay.style.color = '#aaa';
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    gm.state[stateKey] = e.target.value;
    gm.saveState();
    updateResult();
    gameUI.render();
  });
  updateResult();
}

function attachSelectPairHandlers(gameUI, currentRole, players) {
  const gm = gameUI.gm;
  const stateKey = `${currentRole}Selection`;
  if (!gm.state[stateKey]) gm.state[stateKey] = [];

  const selectedDisplay = document.getElementById(`gm${currentRole}Selected`);

  const updateSelection = () => {
    const selected = gm.state[stateKey] || [];
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

  document.querySelectorAll(`.gm${currentRole}Select`).forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      const selected = gm.state[stateKey] || [];

      if (selected.includes(playerId)) {
        gm.state[stateKey] = selected.filter(id => id !== playerId);
      } else if (selected.length < 2) {
        gm.state[stateKey] = [...selected, playerId];
      }

      gm.saveState();
      updateSelection();
      gameUI.render();
    });
  });
  updateSelection();
}

function attachRenardHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.renardSniff) {
    gm.state.renardSniff = { targetId: null, leftWolf: false, centerWolf: false, rightWolf: false };
  }

  const targetSelect = document.getElementById('gmRenardTarget');
  const groupDisplay = document.getElementById('gmRenardGroupDisplay');
  const checksDiv = document.getElementById('gmRenardWolfChecks');
  const resultDisplay = document.getElementById('gmRenardResult');

  const updateRenardDisplay = () => {
    const targetId = gm.state.renardSniff.targetId;
    if (!targetId) {
      groupDisplay.textContent = 'Sélectionne d\'abord un joueur';
      checksDiv.innerHTML = '';
      resultDisplay.textContent = 'Aucune sélection';
      return;
    }

    const targetIdx = players.findIndex(p => p.id === targetId);
    if (targetIdx === -1) return;

    const n = players.length;
    const leftIdx = (targetIdx - 1 + n) % n;
    const rightIdx = (targetIdx + 1) % n;

    const center = players[targetIdx];
    const left = players[leftIdx];
    const right = players[rightIdx];

    // Afficher les 3 joueurs
    groupDisplay.innerHTML = `<strong>${left.name}</strong> (gauche) — <strong>${center.name}</strong> (toi) — <strong>${right.name}</strong> (droite)`;

    // Créer les checkboxes
    const checkboxes = `
      <label style="display:flex; align-items:center; gap:6px; font-size:9px; color:#e8e8f0;">
        <input type="checkbox" id="gmRenardLeftWolf" ${gm.state.renardSniff.leftWolf ? 'checked' : ''} style="cursor:pointer;">
        <strong>${left.name}</strong> → Loup Garou?
      </label>
      <label style="display:flex; align-items:center; gap:6px; font-size:9px; color:#e8e8f0;">
        <input type="checkbox" id="gmRenardCenterWolf" ${gm.state.renardSniff.centerWolf ? 'checked' : ''} style="cursor:pointer;">
        <strong>${center.name}</strong> → Loup Garou?
      </label>
      <label style="display:flex; align-items:center; gap:6px; font-size:9px; color:#e8e8f0;">
        <input type="checkbox" id="gmRenardRightWolf" ${gm.state.renardSniff.rightWolf ? 'checked' : ''} style="cursor:pointer;">
        <strong>${right.name}</strong> → Loup Garou?
      </label>
    `;
    checksDiv.innerHTML = checkboxes;

    // Attacher les événements des checkboxes
    document.getElementById('gmRenardLeftWolf')?.addEventListener('change', (e) => {
      gm.state.renardSniff.leftWolf = e.target.checked;
      gm.saveState();
      updateResult();
      gameUI.render();
    });
    document.getElementById('gmRenardCenterWolf')?.addEventListener('change', (e) => {
      gm.state.renardSniff.centerWolf = e.target.checked;
      gm.saveState();
      updateResult();
      gameUI.render();
    });
    document.getElementById('gmRenardRightWolf')?.addEventListener('change', (e) => {
      gm.state.renardSniff.rightWolf = e.target.checked;
      gm.saveState();
      updateResult();
      gameUI.render();
    });

    updateResult();
  };

  const updateResult = () => {
    const wolfCount = [gm.state.renardSniff.leftWolf, gm.state.renardSniff.centerWolf, gm.state.renardSniff.rightWolf].filter(Boolean).length;
    if (wolfCount === 0) {
      resultDisplay.innerHTML = `
        <div style="padding:8px; border:2px solid #ff6b6b; border-radius:4px; background:rgba(255,107,107,0.2);">
          Pas de Loup autour de ${players[players.findIndex(p => p.id === gm.state.renardSniff.targetId)]?.name || '?'}
        </div>
      `;
    } else {
      resultDisplay.innerHTML = `
        <div style="padding:8px; border:2px solid #ff9800; border-radius:4px; background:rgba(255,152,0,0.2);">
          Il y a <strong>${wolfCount}</strong> Loup(s) autour!
        </div>
      `;
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    gm.state.renardSniff.targetId = e.target.value;
    gm.saveState();
    updateRenardDisplay();
    gameUI.render();
  });

  updateRenardDisplay();
}

function attachCupidoHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.cupidoSelection) gm.state.cupidoSelection = [];

  const selectedDisplay = document.getElementById('gmCupidoSelected');

  const updateCupidoSelection = () => {
    const selected = gm.state.cupidoSelection || [];
    const selectedNames = selected.map(id => {
      const p = players.find(pl => pl.id === id);
      return p ? p.name : '';
    }).filter(n => n);

    if (selectedDisplay) {
      selectedDisplay.textContent = selectedNames.length > 0
        ? `💘 ${selectedNames.join(' ❤️ ')}`
        : 'Aucun sélectionné';
    }
  };

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
      updateCupidoSelection();
      gameUI.render();
    });
  });
  updateCupidoSelection();
}

function attachEnfantSauvageHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.enfantSauvageIdol) gm.state.enfantSauvageIdol = { playerId: null };

  const idolSelect = document.getElementById('gmEnfantSauvageIdol');
  const resultDisplay = document.getElementById('gmEnfantSauvageResult');

  const updateEnfantResult = () => {
    const playerId = gm.state.enfantSauvageIdol.playerId;
    if (playerId) {
      const target = players.find(p => p.id === playerId);
      resultDisplay.innerHTML = `✓ Ton idole: <strong>${target?.name || ''}</strong>`;
      resultDisplay.style.color = '#66d999';
    } else {
      resultDisplay.textContent = 'Aucune sélection';
      resultDisplay.style.color = '#aaa';
    }
  };

  idolSelect?.addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    gm.state.enfantSauvageIdol.playerId = selectedValue;
    gm.saveState();
    updateEnfantResult();
    gameUI.render();

    // Restaurer la sélection après le render
    setTimeout(() => {
      const newSelect = document.getElementById('gmEnfantSauvageIdol');
      if (newSelect && selectedValue) {
        newSelect.value = selectedValue;
      }
    }, 0);
  });

  // Restaurer la sélection si elle existe
  if (gm.state.enfantSauvageIdol?.playerId && idolSelect) {
    idolSelect.value = gm.state.enfantSauvageIdol.playerId;
  }

  updateEnfantResult();
}

function attachChienLoupHandlers(gameUI, players, playerAssignedToRole) {
  const gm = gameUI.gm;
  if (gm.state.chienLoupChoice === undefined) gm.state.chienLoupChoice = null;

  const villageoisBtn = document.getElementById('gmChienLoupVillageois');
  const loupBtn = document.getElementById('gmChienLoupLoup');
  const resultDisplay = document.getElementById('gmChienLoupResult');

  const updateChienResult = () => {
    const choice = gm.state.chienLoupChoice;
    if (choice === 'villageois') {
      resultDisplay.innerHTML = `✓ Tu restes <strong>Villageois</strong>`;
      resultDisplay.style.color = '#5174db';
    } else if (choice === 'loup') {
      resultDisplay.innerHTML = `✓ Tu deviens <strong>Loup Garou</strong>`;
      resultDisplay.style.color = '#d46666';
    } else {
      resultDisplay.textContent = 'Aucun choix';
      resultDisplay.style.color = '#aaa';
    }
  };

  villageoisBtn?.addEventListener('click', () => {
    gm.state.chienLoupChoice = 'villageois';
    gm.saveState();
    updateChienResult();
    gameUI.render();
  });

  loupBtn?.addEventListener('click', () => {
    gm.state.chienLoupChoice = 'loup';
    // La transformation en Loup Garou se fera quand on valide le passage au rôle suivant
    gm.saveState();
    updateChienResult();
    gameUI.render();
  });

  updateChienResult();
}

function attachVoyanteHandlers(gameUI, players, selectedRoles) {
  const gm = gameUI.gm;
  if (!gm.state.voyanteLook) gm.state.voyanteLook = { playerId: null, roleId: null };

  const touchesSelect = document.getElementById('gmVoyanteTouches');
  const containerDiv = document.getElementById('gmVoyanteRoleContainer');

  // Récupérer tous les rôles déjà découverts/assignés
  const discoveredRoles = new Set();
  players.forEach(p => {
    if (p.roleId) discoveredRoles.add(p.roleId);
  });

  const updateVoyanteUI = () => {
    const playerId = gm.state.voyanteLook.playerId;
    const targetPlayer = players.find(p => p.id === playerId);

    if (!targetPlayer) return;

    const targetRoleId = targetPlayer.roleId;
    const isKnown = discoveredRoles.has(targetRoleId) && targetRoleId !== 'Voyante';

    if (isKnown) {
      // Le rôle est connu: afficher en label
      containerDiv.innerHTML = `<div style="padding:6px; background:rgba(100,150,200,0.2); border:1px solid rgba(100,150,200,0.5); border-radius:3px; color:#81dff7; font-weight:600; font-size:9px;">
        ✓ C'est un <strong>${targetRoleId}</strong> (rôle déjà connu)
      </div>`;
      gm.state.voyanteLook.roleId = targetRoleId;
    } else {
      // Le rôle est inconnu: afficher combobox avec les rôles restants
      const unknownRoles = Object.keys(selectedRoles)
        .filter(roleId => selectedRoles[roleId] > 0 && !discoveredRoles.has(roleId))
        .map(roleId => `<option value="${roleId}" style="background:#000000; color:#e8e8f0;">${roleId}</option>`)
        .join('');

      containerDiv.innerHTML = `<select id="gmVoyanteSees" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600; width:100%;">
        <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner le rôle --</option>
        ${unknownRoles}
      </select>`;

      const newSeesSelect = document.getElementById('gmVoyanteSees');
      if (newSeesSelect) {
        newSeesSelect.onchange = (e) => {
          gm.state.voyanteLook.roleId = e.target.value;
          // Assigner immédiatement le rôle au joueur si pas encore assigné
          const targetPlayer = players.find(p => p.id === gm.state.voyanteLook.playerId);
          if (targetPlayer && !targetPlayer.roleId && e.target.value) {
            targetPlayer.roleId = e.target.value;
          }
          gm.saveState();
          updateVoyanteResult();
          gameUI.render();
        };
      }
      gm.state.voyanteLook.roleId = null;
    }
    updateVoyanteResult();
  };

  const updateVoyanteResult = () => {
    const playerId = gm.state.voyanteLook.playerId;
    const roleId = gm.state.voyanteLook.roleId;

    // Récupérer une référence fraîche au cas où le DOM a été rendu
    const resultDisplayFresh = document.getElementById('gmVoyanteResult');
    if (!resultDisplayFresh) return; // Élément n'existe pas encore

    if (playerId && roleId) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        // 🔮 ASSIGNATION AUTOMATIQUE: Quand on découvre le rôle, on l'assigne au joueur
        if (!player.roleId) {
          player.roleId = roleId;
          gm.saveState();
        }

        resultDisplayFresh.innerHTML = `✓ ${player.name} → <strong>${roleId}</strong>`;
        resultDisplayFresh.style.color = '#66d999';
      }
    } else {
      resultDisplayFresh.textContent = 'Aucune sélection';
      resultDisplayFresh.style.color = '#aaa';
    }
  };

  if (touchesSelect) {
    touchesSelect.onchange = (e) => {
      const selectedValue = e.target.value;
      gm.state.voyanteLook.playerId = selectedValue;
      gm.saveState();
      updateVoyanteUI();
      gameUI.render();
      // Restaurer AUSSI la sélection du rôle après le render!
      const newTouchesSelect = document.getElementById('gmVoyanteTouches');
      if (newTouchesSelect) newTouchesSelect.value = selectedValue;
      const newSeesSelect = document.getElementById('gmVoyanteSees');
      if (newSeesSelect) {
        // Toujours ré-attacher le listener après le render, qu'on ait un roleId ou pas
        if (gm.state.voyanteLook.roleId) {
          newSeesSelect.value = gm.state.voyanteLook.roleId;
        }
        newSeesSelect.onchange = (e2) => {
          gm.state.voyanteLook.roleId = e2.target.value;
          // Assigner immédiatement le rôle au joueur si pas encore assigné
          const targetPlayer = players.find(p => p.id === gm.state.voyanteLook.playerId);
          if (targetPlayer && !targetPlayer.roleId && e2.target.value) {
            targetPlayer.roleId = e2.target.value;
          }
          gm.saveState();
          updateVoyanteResult();
          gameUI.render();
        };
      }
    };
  }

  updateVoyanteResult();
}

function attachSorcierePotionsHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.sorcierePotions) {
    gm.state.sorcierePotions = { choice: null, mortTarget: null };
  }

  const saveBtn = document.getElementById('gmSorciereSave');
  const killBtn = document.getElementById('gmSorcierKill');
  const nothingBtn = document.getElementById('gmSorcierNothing');
  const killSelect = document.getElementById('gmSorcierKillSelect');
  const mortTargetSelect = document.getElementById('gmSorciereMortTarget');

  saveBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'save';
    gm.state.sorcierePotions.mortTarget = null;
    gm.saveState();
    gameUI.render();
  });

  killBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'kill';
    gm.saveState();
    gameUI.render();
    // Montrer la combobox du poison après le render
    setTimeout(() => {
      const killSelect = document.getElementById('gmSorcierKillSelect');
      if (killSelect) killSelect.style.display = 'flex';
    }, 0);
  });

  nothingBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'nothing';
    gm.state.sorcierePotions.mortTarget = null;
    gm.saveState();
    gameUI.render();
  });

  mortTargetSelect?.addEventListener('change', (e) => {
    gm.state.sorcierePotions.mortTarget = e.target.value;
    gm.saveState();
    gameUI.render();
  });
}

function attachWolvesKillHandlers(gameUI, players, currentRole) {
  const gm = gameUI.gm;
  if (!gm.state.wolvesVictim) gm.state.wolvesVictim = null;

  const victimSelect = document.getElementById('gmWolvesVictim');
  const resultDisplay = document.getElementById('gmWolvesResult');

  const updateWolvesResult = () => {
    const victimId = gm.state.wolvesVictim;
    if (victimId) {
      const victim = players.find(p => p.id === victimId);
      // Afficher la carte de la victime
      const cardFile = victim?.roleId ? gameUI.getCardFile(victim.roleId) : null;
      if (cardFile) {
        resultDisplay.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="cards/${cardFile}.webp" alt="${victim.name}" style="width:30px; height:42px; border-radius:2px; object-fit:cover; border:1px solid #d46666;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:9px; color:#d46666; font-weight:700;">☠️ Victime</div>
              <div style="font-size:10px; color:#e8e8f0; font-weight:600;">${victim?.name || ''}</div>
            </div>
          </div>
        `;
      } else {
        resultDisplay.innerHTML = `☠️ <strong>${victim?.name || ''}</strong>`;
      }
      resultDisplay.style.color = '#d46666';
    } else {
      resultDisplay.textContent = 'Aucune victime sélectionnée';
      resultDisplay.style.color = '#aaa';
    }
  };

  victimSelect?.addEventListener('change', (e) => {
    gm.state.wolvesVictim = e.target.value;
    gm.saveState();
    updateWolvesResult();
    gameUI.render();
    // Restaurer la valeur du select après le render
    const newVictimSelect = document.getElementById('gmWolvesVictim');
    if (newVictimSelect && gm.state.wolvesVictim) {
      newVictimSelect.value = gm.state.wolvesVictim;
    }
  });

  // Restaurer la valeur du select au cas où elle existerait déjà
  if (victimSelect && gm.state.wolvesVictim) {
    victimSelect.value = gm.state.wolvesVictim;
  }

  updateWolvesResult();
}

function attachJugeBegueHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.jugeBeJudgement) {
    gm.state.jugeBeJudgement = { targetId: null, verdict: null };
  }

  const targetSelect = document.getElementById('gmJugeBeTarget');
  const innocentBtn = document.getElementById('gmJugeBeInnocent');
  const coupableBtn = document.getElementById('gmJugeBeCoupable');
  const resultDisplay = document.getElementById('gmJugeBeResult');

  const updateJugeResult = () => {
    const targetId = gm.state.jugeBeJudgement.targetId;
    const verdict = gm.state.jugeBeJudgement.verdict;

    if (targetId && verdict) {
      const target = players.find(p => p.id === targetId);
      const verdictText = verdict === 'innocent' ? '✓ Innocent' : '⚠️ Coupable';
      resultDisplay.innerHTML = `${verdictText} - <strong>${target?.name || ''}</strong>`;
      resultDisplay.style.color = verdict === 'innocent' ? '#5174db' : '#d46666';
    } else {
      resultDisplay.textContent = 'Aucune sélection';
      resultDisplay.style.color = '#aaa';
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    gm.state.jugeBeJudgement.targetId = e.target.value;
    gm.saveState();
    updateJugeResult();
  });

  innocentBtn?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'innocent';
    gm.saveState();
    updateJugeResult();
    gameUI.render();
  });

  coupableBtn?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'coupable';
    gm.saveState();
    updateJugeResult();
    gameUI.render();
  });

  updateJugeResult();
}

function attachConfirmHandlers(gameUI, currentRole) {
  const gm = gameUI.gm;

  if (currentRole === 'Lapin_Blanc') {
    const confirmBtn = document.getElementById('gmLapinConfirm');
    confirmBtn?.addEventListener('click', () => {
      gm.state.LapinConfirmed = true;
      gm.saveState();
      gameUI.render();
    });
  }

  if (currentRole === 'Petite_Fille') {
    const confirmBtn = document.getElementById('gmPetiteFilleConfirm');
    confirmBtn?.addEventListener('click', () => {
      gm.state.PetiteFilleConfirmed = true;
      gm.saveState();
      gameUI.render();
    });
  }
}

// ===== FONCTION PRINCIPALE POUR ATTACHER LES ÉVÉNEMENTS DES RÔLES =====

function attachRoleActionHandlers(gameUI, currentRole, players, selectedRoles, playerAssignedToRole) {
  const roleAction = ROLE_ACTIONS[currentRole];
  if (!roleAction) return;

  switch (roleAction.type) {
    case 'selectOne':
      attachSelectOneHandlers(gameUI, currentRole, players);
      break;
    case 'selectPair':
      if (currentRole === 'Cupidon') {
        attachCupidoHandlers(gameUI, players);
      } else {
        attachSelectPairHandlers(gameUI, currentRole, players);
      }
      break;
    case 'enfantSauvageIdol':
      attachEnfantSauvageHandlers(gameUI, players);
      break;
    case 'chienLoupChoice':
      attachChienLoupHandlers(gameUI, players, playerAssignedToRole);
      break;
    case 'voyanteLook':
      attachVoyanteHandlers(gameUI, players, selectedRoles);
      break;
    case 'sorcierePotions':
      attachSorcierePotionsHandlers(gameUI, players);
      break;
    case 'renardSniff':
      attachRenardHandlers(gameUI, players);
      break;
    case 'wolvesKill':
      attachWolvesKillHandlers(gameUI, players, currentRole);
      break;
    case 'jugeBegueJudge':
      attachJugeBegueHandlers(gameUI, players);
      break;
    case 'lapinConfirm':
    case 'petiteFilleEcoute':
      attachConfirmHandlers(gameUI, currentRole);
      break;
  }
}

// ===== FONCTION PRINCIPALE POUR ATTACHER TOUS LES ÉVÉNEMENTS DE LA PREMIÈRE NUIT =====

function attachFirstNightEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;
  const availableRoles = getAvailableRolesInOrder(selectedRoles);
  const currentRole = availableRoles[currentRoleIdx];
  const requiredCount = selectedRoles[currentRole] || 1;
  const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
  const playerAssignedToRole = playersAssignedToRole.length > 0 ? playersAssignedToRole[0] : null;
  const roleAction = ROLE_ACTIONS[currentRole];

  // Initialiser le chrono si première assignation
  if (!gm.state.nightStartTime && currentRoleIdx === 0) {
    gm.state.nightStartTime = Date.now();
    gm.saveState();
  }

  // Mettre à jour le chrono
  const updateChrono = () => {
    const chronoDisplay = document.getElementById('gmChrono');
    if (chronoDisplay && gm.state.nightStartTime) {
      const elapsed = Math.floor((Date.now() - gm.state.nightStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      chronoDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  };

  // Mettre à jour le chrono toutes les secondes
  updateChrono();
  const chronoInterval = setInterval(updateChrono, 1000);

  // Nettoyer l'interval quand on quitte
  window.addEventListener('beforeunload', () => clearInterval(chronoInterval));

  // Afficher les joueurs sur la table
  const playersContainer = document.getElementById('gmFirstNightPlayers');
  if (playersContainer) {
    // Générer les positions basées sur le type de table
    const tableType = gm.state.tableType || 'circle';
    const positionResult = gameUI.generatePositionsByTableType(players.length, tableType);
    const defaultPositions = positionResult.positions;
    const scale = 240 / 300; // Adapte les positions au conteneur 240x240
    const containerCenter = 120;

    playersContainer.innerHTML = players.map((p, idx) => {
      const pos = defaultPositions[idx];
      const scaledX = containerCenter + (pos.x - 150) * scale;
      const scaledY = containerCenter + (pos.y - 150) * scale;
      const isAssigned = p.roleId === currentRole;
      const isLover = (gm.state.cupidoSelection || []).includes(p.id);
      const isIdol = gm.state.enfantSauvageIdol?.playerId === p.id;

      // Déterminer si c'est un Loup (y compris Chien_Loup devenu Loup)
      const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
      const isWolf = p.roleId && wolfRoles.includes(p.roleId);

      let bgColor, borderColor;
      if (isWolf) {
        // Les Loups sont ROUGES
        bgColor = 'rgba(212, 102, 102, 0.9)'; // Rouge
        borderColor = '#d46666'; // Rouge vif
      } else if (isLover) {
        bgColor = 'rgba(255, 105, 180, 0.8)'; // Rose
        borderColor = '#ff1493'; // Rose vif
      } else if (isIdol) {
        bgColor = 'rgba(255, 165, 0, 0.8)'; // Orange
        borderColor = '#ff8c00'; // Orange vif
      } else if (isAssigned) {
        bgColor = 'rgba(74, 157, 111, 0.8)'; // Vert
        borderColor = '#66d999';
      } else {
        bgColor = 'rgba(107, 76, 154, 0.6)'; // Violet
        borderColor = '#9966ff';
      }

      // Afficher l'emoji du rôle ou la première lettre du nom
      let displayContent = p.name.charAt(0).toUpperCase();
      if (p.roleId && window.ROLE_EMOJIS) {
        const emoji = window.ROLE_EMOJIS[p.roleId];
        if (emoji) {
          displayContent = emoji;
        }
      }

      return `
        <div style="position:absolute; left:${scaledX}px; top:${scaledY}px; transform:translate(-50%, -50%); text-align:center; pointer-events:none;">
          <div style="width:36px; height:36px; background:${bgColor}; border:2px solid ${borderColor}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:600; color:white; line-height:1;">${displayContent}</div>
          <div style="font-size:7px; color:#d0d0d0; margin-top:2px; font-weight:500; white-space:nowrap; max-width:45px;">${p.name}</div>
        </div>
      `;
    }).join('');
  }

  // Attacher les événements d'assignation (étape 1)
  if (step === 1) {
    document.querySelectorAll('.gm-player-assign').forEach(elem => {
      elem.addEventListener('click', () => {
        const playerId = elem.dataset.playerId;
        const player = players.find(p => p.id === playerId);

        if (!player) return;

        // Si le joueur a déjà ce rôle, le désassigner (toggle)
        if (player.roleId === currentRole) {
          player.roleId = null;
        } else {
          // Compter combien de joueurs sont déjà assignés à ce rôle
          const currentlyAssigned = players.filter(p => p.roleId === currentRole).length;

          // Si on a atteint le nombre requis, empêcher une nouvelle assignation
          if (currentlyAssigned >= requiredCount) {
            return; // Bloque l'assignation
          }

          // Si requiredCount === 1, désassigner tous les autres d'abord
          if (requiredCount === 1) {
            players.forEach(p => {
              if (p.roleId === currentRole) {
                p.roleId = null;
              }
            });
          }
          // Assigner le joueur au rôle
          player.roleId = currentRole;
        }

        gm.saveState();
        gameUI.render();
      });
    });
  }

  // Attacher les événements du rôle (étape 2)
  if (step === 2 && playerAssignedToRole && roleAction) {
    attachRoleActionHandlers(gameUI, currentRole, players, selectedRoles, playerAssignedToRole);
  }

  // Bouton "Suivant →" (Étape 1 → Étape 2)
  const btnNextStep = document.getElementById('gmBtnNextStep');
  if (btnNextStep && step === 1) {
    btnNextStep.addEventListener('click', () => {
      if (playersAssignedToRole.length === requiredCount) {
        // Vérifier s'il y a une action pour ce rôle
        if (ROLES_WITH_NIGHT_ACTION.has(currentRole)) {
          // Aller à l'étape 2 (action du rôle)
          gm.state.nightStep = 2;
        } else {
          // Pas d'action, aller directement au rôle suivant
          gm.state.nightStep = 1;
          gm.state.currentRoleIdx = (currentRoleIdx + 1) % availableRoles.length;
          if (currentRoleIdx >= availableRoles.length - 1) {
            gm.state.currentRoleIdx = 0; // Boucle de retour
          } else {
            gm.state.currentRoleIdx = currentRoleIdx + 1;
          }
        }
        gm.saveState();
        gameUI.render();
      }
    });
  }

  // Bouton "Rôle Suivant →" (Étape 2 → Rôle Suivant)
  const btnNextRole = document.getElementById('gmBtnNextRole');
  if (btnNextRole && (step === 2 || (step === 1 && !ROLES_WITH_NIGHT_ACTION.has(currentRole)))) {
    btnNextRole.addEventListener('click', () => {
      if (isActionComplete(gm, currentRole)) {
        // Transformer le Chien Loup en Loup Garou si besoin
        if (currentRole === 'Chien_Loup' && gm.state.chienLoupChoice === 'loup' && playerAssignedToRole) {
          playerAssignedToRole.roleId = 'Simple_Loup_Garou';
        }

        // Aller au rôle suivant
        gm.state.nightStep = 1;
        gm.state.currentRoleIdx = currentRoleIdx + 1;
        if (currentRoleIdx >= availableRoles.length - 1) {
          // Dernier rôle, commencer la partie
          gm.state.mode = 'mayorElection';
          gm.state.currentTurn = 1;
          gm.state.nightPhase = false;
        }
        gm.saveState();
        gameUI.render();
      }
    });
  }

  // Bouton "Retour" (Étape 2 → Étape 1) - Désassigner le joueur
  const btnPrevStep = document.getElementById('gmBtnPrevStep');
  if (btnPrevStep) {
    btnPrevStep.addEventListener('click', () => {
      // Désassigner le joueur du rôle courant
      if (playerAssignedToRole) {
        playerAssignedToRole.roleId = null;
      }

      // Réinitialiser le choix du Chien Loup si on revient
      if (currentRole === 'Chien_Loup') {
        gm.state.chienLoupChoice = null;
      }

      gm.state.nightStep = 1;
      gm.saveState();
      gameUI.render();
    });
  }

  // Bouton "✓ Commencer" (Dernière action)
  const btnFinishGame = document.getElementById('gmBtnFinishGame');
  if (btnFinishGame) {
    btnFinishGame.addEventListener('click', () => {
      gm.state.mode = 'mayorElection';
      gm.state.currentTurn = 1;
      gm.state.nightPhase = false;
      gm.saveState();
      gameUI.render();
    });
  }
}
