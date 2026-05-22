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

  console.log(`[AttachSelectOne] ${currentRole} - StateKey: ${stateKey} - Select trouvé: ${!!targetSelect} - Result trouvé: ${!!resultDisplay}`);

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
    const selectedPlayerId = e.target.value;
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    gm.state[stateKey] = selectedPlayerId;
    gm.addLog(`  ➜ ${currentRole} choisit: ${selectedPlayer?.name || '?'}`, 'action');

    // Pour Salvateur: afficher JAUNE dès la sélection
    if (currentRole === 'Salvateur' && selectedPlayerId) {
      gm.state.salvateurSavedThisNight = selectedPlayerId;
    }

    gm.saveState();
    updateResult();
    gameUI.render();

    // Restaurer la valeur sélectionnée après le render
    setTimeout(() => {
      const newSelect = document.getElementById('gmSelectOneTarget');
      if (newSelect && selectedPlayerId) {
        newSelect.value = selectedPlayerId;
      }
    }, 0);
  });

  // Restaurer la valeur sélectionnée au chargement
  if (targetSelect && gm.state[stateKey]) {
    targetSelect.value = gm.state[stateKey];
  }

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

  const targetInput = document.getElementById('gmRenardTarget');
  const groupDisplay = document.getElementById('gmRenardGroupDisplay');
  const leftDisplay = document.getElementById('gmRenardLeftDisplay');
  const centerDisplay = document.getElementById('gmRenardCenterDisplay');
  const rightDisplay = document.getElementById('gmRenardRightDisplay');
  const resultDisplay = document.getElementById('gmRenardResult');
  const nextBtn = document.getElementById('gmRenardNext');

  // Guard: si les éléments du Renard n'existent pas, sortir (on n'est pas au Renard)
  if (!groupDisplay || !leftDisplay || !centerDisplay || !rightDisplay || !resultDisplay) {
    return;
  }

  const updateRenardDisplay = () => {
    const targetId = gm.state.renardSniff.targetId;
    if (!targetId) {
      groupDisplay.style.display = 'none';
      resultDisplay.style.display = 'none';
      nextBtn.style.display = 'none';
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

    // Afficher les 3 joueurs dans les boîtes avec leurs rôles
    groupDisplay.style.display = 'flex';
    leftDisplay.innerHTML = `
      <div style="font-size:11px; color:#e8e8f0; font-weight:700;">${left.name}</div>
      <div style="font-size:9px; color:#81dff7; margin-top:4px; font-weight:600;">${left.roleId || '?'}</div>
    `;
    centerDisplay.innerHTML = `
      <div style="font-size:12px; color:#ffb84d; font-weight:800;">${center.name}</div>
      <div style="font-size:10px; color:#ffcc99; margin-top:4px; font-weight:700;">${center.roleId || '?'}</div>
    `;
    rightDisplay.innerHTML = `
      <div style="font-size:11px; color:#e8e8f0; font-weight:700;">${right.name}</div>
      <div style="font-size:9px; color:#81dff7; margin-top:4px; font-weight:600;">${right.roleId || '?'}</div>
    `;

    // Afficher le bouton Suivant
    resultDisplay.style.display = 'block';
    nextBtn.style.display = 'block';

    // Détection automatique des loups
    updateResult();
  };

  const updateResult = () => {
    const targetId = gm.state.renardSniff.targetId;
    if (!targetId) return;

    const targetIdx = players.findIndex(p => p.id === targetId);
    if (targetIdx === -1) return;

    const n = players.length;
    const leftIdx = (targetIdx - 1 + n) % n;
    const rightIdx = (targetIdx + 1) % n;

    const center = players[targetIdx];
    const left = players[leftIdx];
    const right = players[rightIdx];

    // Vérifier qui est loup (Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc, Loup_Garou_Voyant, Infect_Pere_Loups, ou enfant transformé)
    const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
    const isWolf = (player) => {
      // Vérifier si c'est un loup direct
      if (player.roleId && wolfRoles.includes(player.roleId)) return true;
      // Vérifier si c'est un enfant sauvage transformé (status Infecté)
      if (player.statusData && player.statusData.Infecté) return true;
      // Vérifier si c'est un Chien Loup devenu loup
      if (player.roleId === 'Chien_Loup' && player.statusData && player.statusData['Chien_Loup_Loup']) return true;
      return false;
    };

    const wolves = [left, center, right].filter(isWolf);
    const wolfCount = wolves.length;

    if (wolfCount === 0) {
      resultDisplay.innerHTML = `
        <div style="padding:12px; border:2px solid #ff6b6b; border-radius:4px; background:rgba(255,107,107,0.2); text-align:center;">
          <div style="color:#ff9999; font-weight:700; font-size:12px; margin-bottom:4px;">❌ Pas de Loup autour!</div>
          <div style="color:#ffb3b3; font-size:10px;">Tu vas perdre ton pouvoir la nuit prochaine...</div>
        </div>
      `;
      resultDisplay.style.borderColor = '#ff6b6b';
    } else {
      resultDisplay.innerHTML = `
        <div style="padding:12px; border:2px solid #ff9800; border-radius:4px; background:rgba(255,152,0,0.2); text-align:center;">
          <div style="color:#ffb84d; font-weight:700; font-size:12px; margin-bottom:4px;">🐺 Il y a <strong>${wolfCount}</strong> Loup(s) autour!</div>
          <div style="color:#ffd699; font-size:10px;">Tu conserves ton pouvoir.</div>
        </div>
      `;
      resultDisplay.style.borderColor = '#ff9800';
    }

  };

  // Attacher les événements des boutons de sélection
  const attachSelectButtons = () => {
    const buttons = document.querySelectorAll('.gmRenardSelectBtn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;

        gm.state.renardSniff.targetId = playerId;
        if (targetInput) targetInput.value = playerId;
        gm.saveState();
        updateRenardDisplay();

        // Mettre en évidence le bouton sélectionné
        document.querySelectorAll('.gmRenardSelectBtn').forEach(b => {
          if (b.dataset.playerId === playerId) {
            b.style.background = 'rgba(100,200,100,0.3)';
            b.style.borderColor = 'rgba(100,200,100,0.6)';
            b.style.color = '#66d999';
          } else {
            b.style.background = 'rgba(100,80,150,0.2)';
            b.style.borderColor = 'rgba(100,150,255,0.3)';
            b.style.color = '#e8e8f0';
          }
        });
      });
    });
  };

  attachSelectButtons();

  nextBtn?.addEventListener('click', () => {
    const targetId = gm.state.renardSniff.targetId;
    if (!targetId) return;

    const targetIdx = players.findIndex(p => p.id === targetId);
    if (targetIdx === -1) return;

    const n = players.length;
    const leftIdx = (targetIdx - 1 + n) % n;
    const rightIdx = (targetIdx + 1) % n;

    const center = players[targetIdx];
    const left = players[leftIdx];
    const right = players[rightIdx];

    // Vérifier qui est loup
    const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
    const isWolf = (player) => {
      if (player.roleId && wolfRoles.includes(player.roleId)) return true;
      if (player.statusData && player.statusData.Infecté) return true;
      if (player.roleId === 'Chien_Loup' && player.statusData && player.statusData['Chien_Loup_Loup']) return true;
      return false;
    };

    const wolves = [left, center, right].filter(isWolf);
    const wolfCount = wolves.length;

    // Si aucun loup trouvé → le Renard perd son pouvoir
    if (wolfCount === 0) {
      gm.state.renardLostPower = true;
    }

    gm.saveState();
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
  const mortTargetSelect = document.getElementById('gmSorciereMortTarget');

  // Fonction pour mettre à jour l'état des boutons visuellement
  const updateButtonStyles = (choice) => {
    // Reset all buttons
    if (saveBtn) {
      saveBtn.style.background = choice === 'save'
        ? 'rgba(100,200,100,0.6)'
        : 'rgba(100,200,100,0.2)';
    }
    if (nothingBtn) {
      nothingBtn.style.background = choice === 'nothing'
        ? 'rgba(150,150,150,0.6)'
        : 'rgba(100,100,100,0.2)';
    }
    if (killBtn) {
      killBtn.style.background = choice === 'kill'
        ? 'rgba(212,102,102,0.6)'
        : 'rgba(200,100,100,0.2)';
    }
  };

  saveBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'save';
    gm.state.sorcierePotions.mortTarget = null;
    updateButtonStyles('save');
    gm.saveState();
    gameUI.render();
  });

  killBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'kill';
    updateButtonStyles('kill');
    gm.saveState();
    gameUI.render();
    // Focus sur la combobox du poison après le render
    setTimeout(() => {
      const mortSelect = document.getElementById('gmSorciereMortTarget');
      if (mortSelect) {
        mortSelect.focus();
      }
    }, 50);
  });

  nothingBtn?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'nothing';
    gm.state.sorcierePotions.mortTarget = null;
    updateButtonStyles('nothing');
    gm.saveState();
    gameUI.render();
  });

  mortTargetSelect?.addEventListener('change', (e) => {
    gm.state.sorcierePotions.mortTarget = e.target.value;
    gm.saveState();
    gameUI.render();

    // Restaurer la valeur sélectionnée après le render
    setTimeout(() => {
      const newMortSelect = document.getElementById('gmSorciereMortTarget');
      if (newMortSelect) {
        newMortSelect.value = gm.state.sorcierePotions.mortTarget;
      }
    }, 0);
  });

  // Restaurer la valeur sélectionnée si elle existe
  if (mortTargetSelect && gm.state.sorcierePotions.mortTarget) {
    mortTargetSelect.value = gm.state.sorcierePotions.mortTarget;
  }

  // Initialiser les styles des boutons au chargement
  updateButtonStyles(gm.state.sorcierePotions.choice);
}

function attachWolvesKillHandlers(gameUI, players, currentRole) {
  const gm = gameUI.gm;

  // Chaque type de loup a sa propre variable de victime
  if (!gm.state.wolvesVictim) gm.state.wolvesVictim = null;
  if (!gm.state.LoupBlancVictim) gm.state.LoupBlancVictim = null;
  if (!gm.state.MechanLoupVictim) gm.state.MechanLoupVictim = null;

  const victimSelect = document.getElementById('gmWolvesVictim');
  const resultDisplay = document.getElementById('gmWolvesResult');

  // Déterminer quelle variable utiliser selon le rôle courant
  const getStateKey = () => {
    if (currentRole === 'Loup_Garou_Blanc') return 'LoupBlancVictim';
    if (currentRole === 'Grand_Mechant_Loup') return 'MechanLoupVictim';
    return 'wolvesVictim'; // Simple_Loup_Garou
  };

  const stateKey = getStateKey();

  const updateWolvesResult = () => {
    const victimId = gm.state[stateKey];
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
    gm.state[stateKey] = e.target.value;
    gm.saveState();
    updateWolvesResult();
    gameUI.render();
    // Restaurer la valeur du select après le render
    const newVictimSelect = document.getElementById('gmWolvesVictim');
    if (newVictimSelect && gm.state[stateKey]) {
      newVictimSelect.value = gm.state[stateKey];
    }
  });

  // Restaurer la valeur du select au cas où elle existerait déjà
  if (victimSelect && gm.state[stateKey]) {
    victimSelect.value = gm.state[stateKey];
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
  console.log(`[AttachRoleActions] ${currentRole} - PlayerAssigned: ${playerAssignedToRole?.name || 'NONE'} - ActionType: ${roleAction?.type || 'NONE'}`);
  if (!roleAction) {
    console.log(`[AttachRoleActions] ❌ Pas d'action définie pour ${currentRole}`);
    return;
  }

  switch (roleAction.type) {
    case 'selectOne':
      console.log(`[ActionSwitch] ${currentRole} - Cas selectOne`);
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
      // Seule la personne sauvée CETTE NUIT affiche en jaune
      const isSaved = gm.state.salvateurSavedThisNight === p.id;

      // Déterminer si c'est un Loup (y compris Chien_Loup devenu Loup)
      const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
      const isWolf = p.roleId && wolfRoles.includes(p.roleId);
      const isTransformedChienLoup = p.transformedFromChienLoup === true;

      let bgColor, borderColor;
      if (isSaved) {
        // Joueur sauvé par le Salvateur = JAUNE
        bgColor = 'rgba(255, 193, 7, 0.8)'; // Jaune
        borderColor = '#ffc107'; // Jaune vif
      } else if (isTransformedChienLoup) {
        // Chien Loup transformé en Loup Garou = VERT FLUO
        bgColor = 'rgba(0, 255, 100, 0.8)'; // Vert fluo
        borderColor = '#00ff64'; // Vert fluo vif
      } else if (p.roleId === 'Grand_Mechant_Loup') {
        // Grand_Mechant_Loup = ROUGE TRÈS FONCÉ
        bgColor = 'rgba(75, 26, 26, 0.95)'; // Rouge très foncé
        borderColor = '#8b0000'; // Marron très foncé
      } else if (p.roleId === 'Loup_Garou_Blanc') {
        // Loup_Garou_Blanc = BLANC avec emoji ROUGE
        bgColor = 'rgba(245, 245, 245, 0.9)'; // Blanc
        borderColor = '#e0e0e0'; // Gris très clair
      } else if (isWolf) {
        // Les autres Loups sont ROUGES
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
      let emojiStyle = '';
      let emojiColor = 'white';
      if (p.roleId && window.ROLE_EMOJIS) {
        const emoji = window.ROLE_EMOJIS[p.roleId];
        if (emoji) {
          displayContent = emoji;
          // Style spécial pour Loup_Garou_Blanc: emoji rouge sang
          if (p.roleId === 'Loup_Garou_Blanc') {
            emojiColor = '#ff3333';
            emojiStyle = 'text-shadow: 0 0 4px rgba(255,0,0,0.8);';
          }
        }
      }

      return `
        <div style="position:absolute; left:${scaledX}px; top:${scaledY}px; transform:translate(-50%, -50%); text-align:center; pointer-events:none;">
          <div style="width:36px; height:36px; background:${bgColor}; border:2px solid ${borderColor}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:600; color:${emojiColor}; line-height:1; ${emojiStyle}">${displayContent}</div>
          <div style="font-size:7px; color:#d0d0d0; margin-top:2px; font-weight:500; white-space:nowrap; max-width:45px;">${p.name}</div>
        </div>
      `;
    }).join('');
  }

  // Attacher les événements d'assignation (étape 1)
  if (step === 1) {
    console.log(`[AttachFirstNightEvents] Step 1 - Assignation de ${currentRole} - Boutons trouvés: ${document.querySelectorAll('.gm-player-assign').length}`);
    document.querySelectorAll('.gm-player-assign').forEach(elem => {
      elem.addEventListener('click', () => {
        const playerId = elem.dataset.playerId;
        const player = players.find(p => p.id === playerId);
        const isDisabled = elem.dataset.disabled === 'true';
        console.log(`[AssignClick] ${currentRole} - Clic sur ${player?.name} (${playerId}) - Disabled: ${isDisabled}`);

        if (!player || isDisabled) return; // Bloque si le bouton est désactivé (Chien_Loup transformé)

        // Déterminer si c'est un rôle de Loup
        const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
        const isWolfRole = wolfRoles.includes(currentRole);
        const playerIsAlreadyWolf = player.roleId && wolfRoles.includes(player.roleId);

        // Si le joueur a déjà ce rôle, le désassigner (toggle)
        if (player.roleId === currentRole) {
          player.roleId = null;
          console.log(`[AssignRole] ✓ ${player.name} désassigné de ${currentRole}`);
        } else {
          // Compter combien de joueurs sont déjà assignés à ce rôle
          const currentlyAssigned = players.filter(p => p.roleId === currentRole).length;

          // Pour les loups: PAS DE LIMITE (le maître du jeu assigne tous les loups)
          // Pour les autres: respecter la limite
          if (!isWolfRole && currentlyAssigned >= requiredCount) {
            return; // Bloque l'assignation
          }

          // Si requiredCount === 1 (et pas un loup), désassigner les autres d'abord
          if (requiredCount === 1 && !isWolfRole) {
            players.forEach(p => {
              if (p.roleId === currentRole) {
                p.roleId = null;
              }
            });
          }

          // Pour les loups spécialisés: transformer un loup existant au lieu d'assigner un nouveau
          if (isWolfRole && playerIsAlreadyWolf) {
            const oldRole = player.roleId;
            player.roleId = currentRole;
            console.log(`[AssignRole] 🐺 ${player.name} transformé: ${oldRole} → ${currentRole}`);
            gm.addLog(`🐺 ${player.name} devient ${currentRole} (était ${oldRole})`, 'roleTransform');
          } else {
            // Assigner le joueur au rôle (nouveau loup ou autre rôle)
            player.roleId = currentRole;
            console.log(`[AssignRole] ✓ ${player.name} assigné à ${currentRole}`);
            gm.addLog(`🎭 ${player.name} → ${currentRole}`, 'roleAssign');
          }
        }

        console.log(`[SaveAndRender] Sauvegarde et rendu après assignation de ${currentRole}`);
        gm.saveState();
        gameUI.render();
      });
    });

    // AUTO-ASSIGNATION POUR RENARD (dernier rôle)
    // Si on est au Renard, assigner automatiquement tous les joueurs non assignés au Renard
    if (currentRole === 'Renard' && currentRoleIdx === availableRoles.length - 1) {
      const unassignedPlayers = players.filter(p => !p.roleId);
      const renardNeeded = selectedRoles['Renard'] || 1;

      if (unassignedPlayers.length > 0) {
        // ===== VALIDATION AVANT AUTO-ASSIGNATION =====
        const rolesAssigned = {};
        const transformedRoles = {}; // Tracker les rôles transformés

        players.forEach(p => {
          if (p.roleId) {
            rolesAssigned[p.roleId] = (rolesAssigned[p.roleId] || 0) + 1;
          }
          // Tracker les transformations (Chien_Loup transformé en Simple_Loup_Garou, etc.)
          if (p.transformedFromChienLoup === true) {
            transformedRoles['Chien_Loup'] = (transformedRoles['Chien_Loup'] || 0) + 1;
          }
        });

        // Vérifier la cohérence
        let isValid = true;
        const issues = [];

        // 1. Vérifier que les autres rôles (sauf Renard) sont complets
        // IMPORTANT: Ne pas compter Chien_Loup s'il a été transformé
        Object.entries(selectedRoles).forEach(([roleId, needed]) => {
          if (roleId === 'Renard') return; // Sauter le Renard (assigné après)

          const assigned = rolesAssigned[roleId] || 0;
          const transformed = transformedRoles[roleId] || 0;
          const total = assigned + transformed; // Compter les assignations + transformations

          if (total !== needed) {
            isValid = false;
            const details = assigned === 0 && transformed > 0
              ? `(0 assigné + ${transformed} transformé = ${total})`
              : assigned === needed ? ' ✓'
              : `(${assigned} assigné + ${transformed} transformé = ${total})`;
            issues.push(`${roleId}: ${total}/${needed} ${details}`);
          }
        });

        // 2. Vérifier Renard: déjà assignés + non-assignés = total attendu
        const renardAlreadyAssigned = rolesAssigned['Renard'] || 0;
        const renardTotal = renardAlreadyAssigned + unassignedPlayers.length;

        if (renardTotal !== renardNeeded) {
          isValid = false;
          issues.push(`Renard: ${renardAlreadyAssigned} déjà assigné(s) + ${unassignedPlayers.length} non-assigné(s) = ${renardTotal}/${renardNeeded}`);
        }

        // 3. Auto-assignation DÉSACTIVÉE - L'utilisateur assign manuellement
        // (La validation reste active pour vérifier la cohérence)
        if (!isValid) {
          // Afficher les problèmes détectés
          console.log('%c❌ [AutoAssign Renard] ERREUR DE COHÉRENCE - Auto-assignation BLOQUÉE!', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
          console.log('%c⚠️ Problèmes détectés:', 'color: #ff9999; font-weight: bold;');
          issues.forEach(issue => {
            console.log(`%c   • ${issue}`, 'color: #ff9999; font-size: 12px;');
          });
          console.log('%c💡 Solution: Vérifiez les assignations précédentes avec gm.findMissingRoles()', 'color: #ffb84d; font-weight: bold; font-size: 11px;');

          // Afficher aussi une alerte visuelle à l'utilisateur
          const alertMsg = `❌ ERREUR: Impossible d'assigner Renard!\n\nProblèmes:\n${issues.join('\n')}\n\nVérifiez avec: gm.findMissingRoles()`;
          alert(alertMsg);
        }
      }
    }
  }

  // Attacher les événements du rôle (étape 2)
  if (step === 2 && playerAssignedToRole && roleAction) {
    attachRoleActionHandlers(gameUI, currentRole, players, selectedRoles, playerAssignedToRole);
  }

  // Bouton "Suivant →" (Étape 1 → Étape 2)
  const btnNextStep = document.getElementById('gmBtnNextStep');
  if (btnNextStep && step === 1) {
    btnNextStep.addEventListener('click', () => {
      // IMPORTANT: Recalculer le nombre assigné à chaque clic (ne pas utiliser la variable capturée)
      const currentAssigned = players.filter(p => p.roleId === currentRole).length;
      const currentRequired = selectedRoles[currentRole] || 1;

      // Pour les loups: au moins 1 assigné. Pour les autres: exactement requiredCount
      const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
      const isWolfRole = wolfRoles.includes(currentRole);
      const canContinue = isWolfRole ? currentAssigned > 0 : currentAssigned === currentRequired;

      console.log(`[NextStepBtn] ${currentRole} - Assignés actuels: ${currentAssigned}/${currentRequired}`);

      if (canContinue) {
        // Vérifier s'il y a une action pour ce rôle
        if (ROLES_WITH_NIGHT_ACTION.has(currentRole)) {
          // Aller à l'étape 2 (action du rôle)
          gm.state.nightStep = 2;
          console.log(`[NextStepBtn] ✓ Passage à Step 2 pour ${currentRole}`);
        } else {
          // Pas d'action, aller directement au rôle suivant
          gm.state.nightStep = 1;
          gm.state.currentRoleIdx = currentRoleIdx + 1;
          console.log(`[NextStepBtn] Pas d'action pour ${currentRole}, passage au rôle suivant`);
        }
        gm.saveState();
        gameUI.render();
      } else {
        console.log(`[NextStepBtn] ❌ Assignation incomplète: ${currentAssigned}/${currentRequired}`);
      }
    });
  }

  // Bouton "Rôle Suivant →" (Étape 2 → Rôle Suivant)
  const btnNextRole = document.getElementById('gmBtnNextRole');
  if (btnNextRole && (step === 2 || (step === 1 && !ROLES_WITH_NIGHT_ACTION.has(currentRole)))) {
    btnNextRole.addEventListener('click', () => {
      if (isActionComplete(gm, currentRole)) {
        // Recalculer le joueur assigné au rôle courant (ne pas utiliser la variable capturée)
        const assignedPlayer = players.find(p => p.roleId === currentRole);

        // Gérer les actions spécifiques du rôle
        if (currentRole === 'Salvateur' && gm.state.SalvateurTarget) {
          const savedPlayer = players.find(p => p.id === gm.state.SalvateurTarget);
          if (savedPlayer) {
            // Tracker qui a été sauvé CETTE nuit (pour l'affichage jaune)
            gm.state.salvateurSavedThisNight = gm.state.SalvateurTarget;

            // Garder l'historique pour empêcher les sauvetages répétés consécutifs
            if (!gm.state.salvateurHistory) gm.state.salvateurHistory = [];
            gm.state.salvateurHistory.push(gm.state.SalvateurTarget);

            gm.addLog(`👼 ${assignedPlayer.name} a sauvé ${savedPlayer.name} de l'infection!`, 'action');
            console.log(`[Salvateur] ${savedPlayer.name} sauvé de l'infection cette nuit`);
          }
        }

        // Transformer le Chien Loup en Loup Garou si besoin
        if (currentRole === 'Chien_Loup' && gm.state.chienLoupChoice === 'loup' && assignedPlayer) {
          assignedPlayer.roleId = 'Simple_Loup_Garou';
          assignedPlayer.transformedFromChienLoup = true; // Flag pour l'affichage en vert fluo
          gm.addLog(`🐺 ${assignedPlayer.name} (Chien_Loup) se transforme en Simple_Loup_Garou!`, 'transform');
          console.log(`[Transformation] ${assignedPlayer.name}: Chien_Loup → Simple_Loup_Garou`);
        }

        // Aller au rôle suivant
        gm.state.nightStep = 1;
        gm.state.currentRoleIdx = currentRoleIdx + 1;

        if (currentRoleIdx >= availableRoles.length - 1) {
          // Dernier rôle, commencer la partie
          gm.state.mode = 'mayorElection';
          gm.state.currentTurn = 1;
          gm.state.nightPhase = false;
          console.log(`[NextRoleBtn] Dernière action! Passage à mayorElection`);
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
      // Recalculer le joueur assigné au rôle courant (ne pas utiliser la variable capturée)
      const assignedPlayer = players.find(p => p.roleId === currentRole);

      // Désassigner le joueur du rôle courant
      if (assignedPlayer) {
        assignedPlayer.roleId = null;
        console.log(`[RetourBtn] Désassignation de ${assignedPlayer.name} du rôle ${currentRole}`);
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
