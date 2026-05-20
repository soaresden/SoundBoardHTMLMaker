// ========================================
// ÉCRAN 3: PREMIÈRE NUIT - ASSIGNER LES RÔLES (2 ÉTAPES)
// ========================================

// Ordre exact de la première nuit (du document ORDRE_PREMIERE_NUIT.md)
const ROLE_ORDER = [
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup', 'Montreur_Ours', 'Chevalier_Epee_Rouille',
  'Voyante', 'Ancien', 'Ange', 'Servante_Devouee', 'Salvateur',
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups',
  'Sorcière',  // Sorcière APRÈS les loups pour savoir qui a été tué
  'Renard', 'Gitane',  // Renard APRÈS les loups pour savoir s'il y en a
  'Joueur_Flute', 'Marionnettiste', 'Voleur', 'Pyromane', 'Ankou', 'Abominable_Sectaire',
  'Lapin_Blanc', 'Juge_Begue', 'Necromancien', 'Noctambule', 'Corbeau', 'Petite_Fille',
  'Idiot_Village', 'Bouc_Emissaire', 'Capitaine', 'Chasseur',
  'Deux_Soeurs', 'Trois_Freres', 'Comedien', 'Villageois_Villageois'
];

// Rôles qui ont une action la première nuit (nécessitent l'étape 2)
const ROLES_WITH_NIGHT_ACTION = new Set([
  // Critiques
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup',
  // Nuit
  'Voyante', 'Sorcière', 'Ancien', 'Ange', 'Servante_Devouee', 'Salvateur',
  'Renard', 'Gitane', 'Joueur_Flute', 'Marionnettiste', 'Voleur',
  'Pyromane', 'Ankou', 'Abominable_Sectaire', 'Lapin_Blanc', 'Juge_Begue',
  'Necromancien', 'Noctambule', 'Corbeau', 'Petite_Fille',
  // Loups
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'
]);

const ROLE_ACTIONS = {
  'Cupidon': { instruction: '💘 Sélectionnez 2 joueurs pour les rendre amoureux', type: 'selectPair' },
  'Enfant_Sauvage': { instruction: '👦 Enfant Sauvage, qui est ton idole ?', type: 'selectOne' },
  'Chien_Loup': { instruction: '🐕🐺 Chien Loup, tu restes Villageois ou tu deviens Loup Garou ?', type: 'chienLoupChoice' },
  'Voyante': { instruction: '👁️ Voyante, tu veux voir l\'identité de qui ?', type: 'voyanteLook' },
  'Sorcière': { instruction: '🧙‍♀️ Sorcière, choisis qui ressusciter (VIE) ou empoisonner (MORT)', type: 'sorcierePotions' },
  'Ancien': { instruction: '👴 Ancien, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Ange': { instruction: '😇 Ange, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Servante_Devouee': { instruction: '👸 Servante, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Salvateur': { instruction: '👼 Salvateur, qui anticipes-tu pour l\'infection ?', type: 'selectOne' },
  'Renard': { instruction: '🦊 Renard, tu pointes quelqu\'un. Est-ce qu\'il y a des Loups autour?', type: 'renardSniff' },
  'Gitane': { instruction: '🔮 Gitane, qui as-tu senti connecté à qui (2 personnes) ?', type: 'selectPair' },
  'Joueur_Flute': { instruction: '🎵 Joueur de Flûte, charme 2 personnes pour les immuniser', type: 'selectPair' },
  'Marionnettiste': { instruction: '🎭 Marionnettiste, qui contrôles-tu cette nuit ?', type: 'selectOne' },
  'Voleur': { instruction: '🎩 Voleur, à qui voles-tu le rôle ?', type: 'selectOne' },
  'Pyromane': { instruction: '🔥 Pyromane, qui marques-tu à l\'essence ?', type: 'selectOne' },
  'Ankou': { instruction: '☠️ Ankou, qui marques-tu pour la mort ?', type: 'selectOne' },
  'Abominable_Sectaire': { instruction: '👹 Sectaire, qui convertis-tu à ton culte ?', type: 'selectOne' },
  'Lapin_Blanc': { instruction: '🐰 Lapin Blanc, crée un événement aléatoire', type: 'lapinConfirm' },
  'Juge_Begue': { instruction: '⚖️ Juge, juges-tu qui ? Et innocent ou coupable ?', type: 'jugeBegueJudge' },
  'Necromancien': { instruction: '💀 Nécromancien, qui veux-tu ressusciter ?', type: 'selectOne' },
  'Noctambule': { instruction: '🦉 Noctambule, qui veux-tu observer cette nuit ?', type: 'selectOne' },
  'Corbeau': { instruction: '🐦‍⬛ Corbeau, à qui voles-tu 2 votes ?', type: 'selectOne' },
  'Petite_Fille': { instruction: '👧 Petite Fille, tu écoutes les Loups', type: 'petiteFilleEcoute' },
  'Simple_Loup_Garou': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Grand_Mechant_Loup': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Loup_Garou_Blanc': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Loup_Garou_Voyant': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Infect_Pere_Loups': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' }
};

function getAvailableRolesInOrder(selectedRoles) {
  const result = [];
  ROLE_ORDER.forEach(role => {
    const count = selectedRoles[role] || 0;
    for (let i = 0; i < count; i++) {
      result.push(role);
    }
  });
  return result;
}

// Vérifier si l'action du rôle est complète (réponse fournie)
function isActionComplete(gm, currentRole) {
  const roleAction = ROLE_ACTIONS[currentRole];
  if (!roleAction) return true; // Pas d'action = complet

  switch (roleAction.type) {
    case 'selectOne':
      const targetId = gm.state[`${currentRole}Target`];
      const isSelected = targetId !== null && targetId !== '';

      // Salvateur spécial: ne peut pas sauver la même personne 2 fois de suite
      if (currentRole === 'Salvateur' && isSelected) {
        const salvateurHistory = gm.state.salvateurHistory || [];
        const lastSavedId = salvateurHistory.length > 0 ? salvateurHistory[salvateurHistory.length - 1] : null;
        if (targetId === lastSavedId) {
          return false; // Même personne que la dernière fois = INVALIDE
        }
      }

      return isSelected;
    case 'selectPair':
      // Cupidon utilise cupidoSelection (minuscule), autres utilisent RoleSelection
      if (currentRole === 'Cupidon') {
        return (gm.state.cupidoSelection || []).length === 2;
      } else {
        return (gm.state[`${currentRole}Selection`] || []).length === 2;
      }
    case 'chienLoupChoice':
      return gm.state.chienLoupChoice !== null;
    case 'enfantSauvageIdol':
      return gm.state.enfantSauvageIdol?.playerId !== null && gm.state.enfantSauvageIdol?.playerId !== '';
    case 'voyanteLook':
      return gm.state.voyanteLook?.playerId !== null && gm.state.voyanteLook?.playerId !== '' &&
             gm.state.voyanteLook?.roleId !== null && gm.state.voyanteLook?.roleId !== '';
    case 'renardSniff':
      return gm.state.renardSniff?.targetId !== null && gm.state.renardSniff?.targetId !== '';
    case 'jugeBeJudgement':
      return gm.state.jugeBeJudgement?.targetId !== null && gm.state.jugeBeJudgement?.targetId !== '' &&
             gm.state.jugeBeJudgement?.verdict !== null;
    case 'wolvesKill':
      return gm.state.wolvesVictim !== null && gm.state.wolvesVictim !== '';
    case 'sorcierePotions':
      // La Sorcière doit faire un choix (save, kill, ou nothing)
      const sorcierePotions = gm.state.sorcierePotions || {};
      const choice = sorcierePotions.choice;

      // Si elle choisit de sauver, c'est bon
      if (choice === 'save') return true;
      // Si elle choisit de tuer, elle doit sélectionner une victime
      if (choice === 'kill') return sorcierePotions.mortTarget !== null && sorcierePotions.mortTarget !== '';
      // Si elle choisit de ne rien faire, c'est bon
      if (choice === 'nothing') return true;

      return false;
    case 'sorciereConfirm':
    case 'lapinConfirm':
    case 'petiteFilleEcoute':
      const confirmKey = currentRole === 'Lapin_Blanc' ? 'LapinConfirmed' :
                        currentRole === 'Petite_Fille' ? 'PetiteFilleConfirmed' :
                        `${currentRole}Confirmed`;
      return gm.state[confirmKey] === true;
    default:
      return true;
  }
}

// ===== HELPER FUNCTIONS POUR ATTACHEMENT D'ÉVÉNEMENTS =====

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
          <div style="color:#ff6b6b; font-weight:600; margin-bottom:4px;">💔 Il y a 0 Loup Garou dans les 3</div>
          <div style="color:#ff6b6b; font-weight:600;">TU PERDS TON POUVOIR!</div>
        </div>
      `;
      resultDisplay.style.color = '#ff6b6b';
      resultDisplay.style.background = 'transparent';
    } else {
      const powerText = wolfCount > 0 ? '✓ Tu gardes ton pouvoir!' : '';
      const wolfText = wolfCount === 1 ? '1 Loup Garou' : `${wolfCount} Loups Garous`;
      resultDisplay.innerHTML = `
        <div style="padding:8px; border:2px solid #66d999; border-radius:4px; background:rgba(102,217,153,0.2);">
          <div style="color:#66d999; font-weight:600; margin-bottom:4px;">✓ Il y a ${wolfText} dans les 3</div>
          <div style="color:#66d999; font-weight:600;">${powerText}</div>
        </div>
      `;
      resultDisplay.style.color = '#66d999';
      resultDisplay.style.background = 'transparent';
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    gm.state.renardSniff.targetId = selectedValue;
    gm.saveState();
    updateRenardDisplay();
    gameUI.render();
    // Restaurer la sélection après le render
    const newTargetSelect = document.getElementById('gmRenardTarget');
    if (newTargetSelect) newTargetSelect.value = selectedValue;
  });
}

function attachJugeBeHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.jugeBeJudgement) gm.state.jugeBeJudgement = { targetId: null, verdict: null };

  const targetSelect = document.getElementById('gmJugeBeTarget');
  const btnInnocent = document.getElementById('gmJugeBeInnocent');
  const btnCoupable = document.getElementById('gmJugeBeCoupable');
  const resultDisplay = document.getElementById('gmJugeBeResult');

  const updateResult = () => {
    const { targetId, verdict } = gm.state.jugeBeJudgement;
    if (targetId && verdict) {
      const target = players.find(p => p.id === targetId);
      const verdictText = verdict === 'innocent' ? 'INNOCENT' : 'COUPABLE';
      resultDisplay.innerHTML = `✓ <strong>${target?.name || ''}</strong> → ${verdictText}`;
      resultDisplay.style.color = verdict === 'innocent' ? '#66d999' : '#d46666';
    } else {
      resultDisplay.textContent = 'Sélectionne joueur et verdict';
      resultDisplay.style.color = '#aaa';
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    gm.state.jugeBeJudgement.targetId = e.target.value;
    gm.saveState();
    updateResult();
    gameUI.render();
  });

  btnInnocent?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'innocent';
    btnInnocent.style.borderColor = '#66d999';
    btnCoupable.style.borderColor = '#d46666';
    gm.saveState();
    updateResult();
    gameUI.render();
  });

  btnCoupable?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'coupable';
    btnInnocent.style.borderColor = '#7ba3f5';
    btnCoupable.style.borderColor = '#66d999';
    gm.saveState();
    updateResult();
    gameUI.render();
  });

  updateResult();
}

function attachConfirmHandlers(gameUI, confirmType) {
  const gm = gameUI.gm;
  const stateKey = `${confirmType}Confirmed`;
  if (!gm.state[stateKey]) gm.state[stateKey] = false;

  const btnConfirm = document.getElementById(`gm${confirmType}Confirm`);

  btnConfirm?.addEventListener('click', () => {
    gm.state[stateKey] = true;
    gm.saveState();
    if (btnConfirm) {
      btnConfirm.style.background = 'linear-gradient(135deg, #4a9d6f, #66d999)';
      btnConfirm.textContent = '✓ Confirmé';
    }
    gameUI.render();
  });
}

function attachWolvesKillHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (gm.state.wolvesVictim === undefined) gm.state.wolvesVictim = '';

  const victimSelect = document.getElementById('gmWolvesVictim');
  const resultDisplay = document.getElementById('gmWolvesResult');

  const updateResult = () => {
    if (!resultDisplay) return;
    const victimId = gm.state.wolvesVictim;
    if (victimId) {
      const victim = players.find(p => p.id === victimId);
      resultDisplay.innerHTML = `☠️ <strong>${victim?.name || ''}</strong> sera mangé cette nuit`;
      resultDisplay.style.color = '#ff6b6b';
    } else {
      resultDisplay.textContent = 'Aucune victime sélectionnée';
      resultDisplay.style.color = '#aaa';
    }
  };

  if (victimSelect && !victimSelect.hasAttribute('data-listener-attached')) {
    victimSelect.addEventListener('change', (e) => {
      gm.state.wolvesVictim = e.target.value;
      gm.saveState();
      updateResult();
      gameUI.render();
    });
    victimSelect.setAttribute('data-listener-attached', 'true');
  }

  // Restaurer la valeur du select si elle existait
  if (victimSelect && gm.state.wolvesVictim) {
    victimSelect.value = gm.state.wolvesVictim;
  }

  updateResult();
}

function attachSorcierePotionsHandlers(gameUI, players) {
  const gm = gameUI.gm;
  if (!gm.state.sorcierePotions) {
    gm.state.sorcierePotions = { choice: null, mortTarget: '' };
  }

  const victimDisplay = document.getElementById('gmSorcierVictim');
  const btnSave = document.getElementById('gmSorciereSave');
  const btnKill = document.getElementById('gmSorcierKill');
  const btnNothing = document.getElementById('gmSorcierNothing');
  const killSelect = document.getElementById('gmSorcierKillSelect');
  const mortSelect = document.getElementById('gmSorciereMortTarget');
  const historyDisplay = document.getElementById('gmSorcierPotionsHistory');

  // Afficher la victime des loups
  const wolvesVictim = gm.state.wolvesVictim;
  if (wolvesVictim && victimDisplay) {
    const victim = players.find(p => p.id === wolvesVictim);
    if (victim) {
      victimDisplay.innerHTML = `☠️ <strong>${victim.name}</strong> a été tué(e) par les Loups`;
      victimDisplay.style.color = '#ff6b6b';
    }
  }

  const updateStatus = () => {
    const choice = gm.state.sorcierePotions.choice;

    // Afficher/cacher le select de meurtre
    if (killSelect) {
      killSelect.style.display = choice === 'kill' ? 'block' : 'none';
    }

    // Mise à jour des boutons
    [btnSave, btnKill, btnNothing].forEach(btn => {
      if (btn) {
        btn.style.borderWidth = '2px';
        btn.style.opacity = '1';
      }
    });

    if (choice === 'save' && btnSave) {
      btnSave.style.borderWidth = '3px';
      btnSave.style.boxShadow = '0 0 8px #66d999';
    }
    if (choice === 'kill' && btnKill) {
      btnKill.style.borderWidth = '3px';
      btnKill.style.boxShadow = '0 0 8px #ff9999';
    }
    if (choice === 'nothing' && btnNothing) {
      btnNothing.style.borderWidth = '3px';
      btnNothing.style.boxShadow = '0 0 8px #999';
    }

    // Mise à jour de l'historique
    if (historyDisplay) {
      const history = gm.state.sorcierePotionsHistory || { vie: false, mort: false };
      let historyText = '📜 VIE: ';
      historyText += history.vie ? '✓ utilisée' : 'disponible';
      historyText += ' | MORT: ';
      historyText += history.mort ? '✓ utilisée' : 'disponible';
      historyDisplay.textContent = historyText;
    }
  };

  btnSave?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'save';
    gm.state.sorcierePotions.mortTarget = '';
    if (mortSelect) mortSelect.value = '';
    gm.saveState();
    updateStatus();
    gameUI.render();
  });

  btnKill?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'kill';
    gm.saveState();
    updateStatus();
  });

  btnNothing?.addEventListener('click', () => {
    gm.state.sorcierePotions.choice = 'nothing';
    gm.state.sorcierePotions.mortTarget = '';
    if (mortSelect) mortSelect.value = '';
    gm.saveState();
    updateStatus();
    gameUI.render();
  });

  mortSelect?.addEventListener('change', (e) => {
    gm.state.sorcierePotions.mortTarget = e.target.value;
    gm.saveState();
  });

  updateStatus();
}

function renderFirstNight(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1; // 1 = assigner, 2 = action

  // Log du démarrage de la partie (une seule fois)
  if (!gm.state.gameLog || gm.state.gameLog.length === 0) {
    gm.startGameSession();
  }

  const availableRoles = getAvailableRolesInOrder(selectedRoles);

  // Vérifier si on a dépassé la fin des rôles
  if (currentRoleIdx >= availableRoles.length) {
    // Tous les rôles ont été assignés, prêt à commencer
    if (!gm.state.gameState) gm.state.gameState = {};
    gm.state.mode = 'mayorElection';
    gm.state.gameState.phase = 'day1-election';
    gm.saveState();
    gameUI.render();
    return '';
  }

  const currentRole = availableRoles[currentRoleIdx];
  const role = gm.roles[currentRole];
  const cardFile = gameUI.getCardFile(currentRole);
  const requiredCount = selectedRoles[currentRole] || 1;
  const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
  const playerAssignedToRole = playersAssignedToRole[0]; // Pour compatibilité avec le code existant
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
            <div style="font-size:9px; color:#81dff7; font-weight:600;">🎯 Cliquez sur ${requiredCount === 1 ? 'un joueur' : `${requiredCount} joueurs`} (${playersAssignedToRole.length}/${requiredCount}):</div>
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
              ` : roleAction.type === 'enfantSauvageIdol' ? `
                <!-- ACTION ENFANT SAUVAGE -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Sélectionne ton idole:</div>
                  <select id="gmEnfantSauvageIdol" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
                    ${players.filter(p => p.id !== playerAssignedToRole?.id).map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                  </select>

                  <div id="gmEnfantSauvageResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune sélection
                  </div>
                </div>
              ` : roleAction.type === 'chienLoupChoice' ? `
                <!-- ACTION CHIEN LOUP -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600; margin-bottom:4px;">Choisis ton camp:</div>
                  <button id="gmChienLoupVillageois" style="padding:8px; background:linear-gradient(135deg, #5174db, #7ba3f5); border:2px solid #7ba3f5; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                    👨 Rester Villageois
                  </button>
                  <button id="gmChienLoupLoup" style="padding:8px; background:linear-gradient(135deg, #8b3a3a, #d46666); border:2px solid #d46666; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                    🐺 Devenir Loup Garou
                  </button>
                  <div id="gmChienLoupResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucun choix
                  </div>
                </div>
              ` : roleAction.type === 'selectOne' ? `
                <!-- ACTION SELECT ONE (Ancien, Ange, Salvateur, Marionnettiste, Voleur, Pyromane, Ankou, Chevalier, etc.) -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Sélectionne un joueur:</div>
                  <select id="gmSelectOneTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
                    ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                  </select>
                  <div id="gmSelectOneResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune sélection
                  </div>
                </div>
              ` : roleAction.type === 'selectPair' ? `
                <!-- ACTION SELECT PAIR (Joueur_Flute, Gitane, Cupidon) -->
                <div id="gm${currentRole}Selected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
                  Aucun sélectionné
                </div>
                <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">Sélectionne 2 joueurs:</div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
                  ${players.map(p => {
                    const isSelected = (gm.state[`${currentRole}Selection`] || []).includes(p.id);
                    const bgColor = isSelected ? '#4a9d6f' : '#6b4c9a';
                    const borderColor = isSelected ? '#66d999' : '#9966ff';
                    return `
                      <div class="gm${currentRole}Select" data-player-id="${p.id}" style="
                        padding:6px 4px; margin:2px; border:2px solid ${borderColor}; border-radius:3px;
                        background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
                        font-size:10px; font-weight:600; user-select:none; transition:all 0.2s;
                      ">
                        ${p.name}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : roleAction.type === 'renardSniff' ? `
                <!-- ACTION RENARD (pointe 1 joueur, vérifie 3) -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Tu pointes qui ?</div>
                  <select id="gmRenardTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
                    ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                  </select>

                  <div id="gmRenardGroupDisplay" style="font-size:9px; color:#81dff7; font-weight:600; padding:6px; background:rgba(100,80,150,0.2); border-radius:3px; min-height:20px;">
                    Sélectionne d'abord un joueur
                  </div>

                  <div id="gmRenardWolfChecks" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
                    <!-- Rempli dynamiquement -->
                  </div>

                  <div id="gmRenardResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune sélection
                  </div>
                </div>
              ` : roleAction.type === 'sorcierePotions' ? `
                <!-- ACTION SORCIÈRE -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div id="gmSorcierVictim" style="font-size:10px; color:#ff6b6b; font-weight:700; padding:8px; background:rgba(255,107,107,0.3); border-radius:3px; border:2px solid #ff6b6b;">
                    ☠️ [VICTIME LOUPS CHARGÉE]
                  </div>
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Désires-tu la sauver ?</div>
                  <div style="display:flex; gap:6px; justify-content:center;">
                    <button id="gmSorciereSave" style="flex:1; padding:10px; background:rgba(100,200,100,0.3); border:2px solid #66d999; color:#66d999; font-weight:700; cursor:pointer; font-size:12px; border-radius:4px;">👍 OUI</button>
                    <button id="gmSorcierKill" style="flex:1; padding:10px; background:rgba(200,100,100,0.3); border:2px solid #ff9999; color:#ff9999; font-weight:700; cursor:pointer; font-size:12px; border-radius:4px;">👎 NON</button>
                    <button id="gmSorcierNothing" style="flex:1; padding:10px; background:rgba(100,100,100,0.3); border:2px solid #999; color:#ccc; font-weight:700; cursor:pointer; font-size:12px; border-radius:4px;">✝️ RIEN</button>
                  </div>
                  <div id="gmSorcierKillSelect" style="display:none;">
                    <div style="font-size:9px; color:#d46666; font-weight:600; margin-bottom:4px;">Qui désires-tu empoisonner ?</div>
                    <select id="gmSorciereMortTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600; width:100%;">
                      <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner une victime --</option>
                      ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                    </select>
                  </div>
                  <div id="gmSorcierPotionsHistory" style="font-size:8px; color:#aaa; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px;">
                    📜 VIE: disponible | MORT: disponible
                  </div>
                </div>
              ` : roleAction.type === 'lapinConfirm' ? `
                <!-- ACTION LAPIN BLANC -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600; padding:6px; background:rgba(100,80,150,0.3); border-radius:3px;">
                    Tu crées un événement aléatoire cette nuit...
                  </div>
                  <button id="gmLapinConfirm" style="padding:8px; background:linear-gradient(135deg, #5174db, #7ba3f5); border:none; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                    🎲 Créer l'événement
                  </button>
                </div>
              ` : roleAction.type === 'petiteFilleEcoute' ? `
                <!-- ACTION PETITE FILLE -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600; padding:6px; background:rgba(100,80,150,0.3); border-radius:3px;">
                    Tu écoutes les Loups discuter pendant 10 secondes...
                  </div>
                  <button id="gmPetiteFilleConfirm" style="padding:8px; background:linear-gradient(135deg, #5174db, #7ba3f5); border:none; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                    👂 Écouter
                  </button>
                </div>
              ` : roleAction.type === 'jugeBegueJudge' ? `
                <!-- ACTION JUGE BÈGUE -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Juge qui ?</div>
                  <select id="gmJugeBeTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
                    ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                  </select>
                  <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">Verdict:</div>
                  <div style="display:flex; gap:6px;">
                    <button id="gmJugeBeInnocent" style="flex:1; padding:6px; background:linear-gradient(135deg, #5174db, #7ba3f5); border:none; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                      ✓ Innocent
                    </button>
                    <button id="gmJugeBeCoupable" style="flex:1; padding:6px; background:linear-gradient(135deg, #8b3a3a, #d46666); border:none; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
                      ⚠️ Coupable
                    </button>
                  </div>
                  <div id="gmJugeBeResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune sélection
                  </div>
                </div>
              ` : roleAction.type === 'voyanteLook' ? `
                <!-- ACTION VOYANTE -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600;">Joueur à voir:</div>
                  <select id="gmVoyanteTouches" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
                    ${players.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
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
              ` : roleAction.type === 'wolvesKill' ? `
                <!-- ACTION LOUPS-GAROUS -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="font-size:9px; color:#81dff7; font-weight:600; margin-bottom:4px;">🐺 Qui mangez-vous ce soir?</div>
                  <select id="gmWolvesVictim" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                    <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner une victime --</option>
                    ${players.filter(p => {
                      const wolvesRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
                      return !p.isDead && !wolvesRoles.includes(p.role);
                    }).map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
                  </select>
                  <div id="gmWolvesResult" style="font-size:9px; color:#ff6b6b; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
                    Aucune victime sélectionnée
                  </div>
                </div>
              ` : ''}
            ` : ''}
          `}
        </div>

        <!-- BAS: NAVIGATION -->
        <div style="padding:8px; border-top:1px solid rgba(199,125,255,0.2); display:flex; gap:6px; background:rgba(0,0,0,0.3); flex-shrink:0; flex-wrap:wrap;">
          ${currentRoleIdx > 0 ? `<button id="gmBtnPrevRole" style="background:rgba(100,150,200,0.2); border:1px solid rgba(100,150,200,0.5); padding:6px 10px; border-radius:4px; color:#81dff7; font-weight:600; cursor:pointer; flex:0; font-size:9px;">← Rôle Précédent</button>` : ''}
          <button id="gmBtnBackToTable" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); padding:6px 10px; border-radius:4px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:0; font-size:9px;">← Table</button>
          ${currentRoleIdx < availableRoles.length - 1 && step === 1 && playersAssignedToRole.length === requiredCount ? `<button id="gmBtnNextRole" style="background:rgba(100,150,200,0.2); border:1px solid rgba(100,150,200,0.5); padding:6px 10px; border-radius:4px; color:#81dff7; font-weight:600; cursor:pointer; flex:0; font-size:9px;">Rôle Suivant →</button>` : ''}
          ${step === 1 && playersAssignedToRole.length === requiredCount ? `
            ${ROLES_WITH_NIGHT_ACTION.has(currentRole) ? `
              <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Suivant →</button>
            ` : `
              <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Rôle Suivant →</button>
            `}
          ` : step === 2 ? `
            <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px; opacity:1;" data-complete="false">Rôle Suivant →</button>
          ` : ''}
          ${step === 2 ? `
            <button id="gmBtnPrevStep" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:6px 10px; border-radius:4px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:0; font-size:9px;">← Retour</button>
          ` : ''}
          ${currentRoleIdx >= availableRoles.length - 1 && playersAssignedToRole.length === requiredCount && (step === 2 || !ROLES_WITH_NIGHT_ACTION.has(currentRole)) ? `
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

  // ===== INITIALISATION DE TOUS LES ÉTATS (AVANT validation) =====
  if (step === 2) {
    // Initialiser les états pour que la validation ne retourne pas true par erreur
    if (!gm.state.cupidoSelection) gm.state.cupidoSelection = [];
    if (!gm.state.enfantSauvageIdol) gm.state.enfantSauvageIdol = { playerId: null };
    if (!gm.state.chienLoupChoice) gm.state.chienLoupChoice = null;
    if (!gm.state.voyanteLook) gm.state.voyanteLook = { playerId: null, roleId: null };
    if (!gm.state.renardSniff) gm.state.renardSniff = { targetId: null, leftWolf: false, centerWolf: false, rightWolf: false };
    if (!gm.state.jugeBeJudgement) gm.state.jugeBeJudgement = { targetId: null, verdict: null };
    if (!gm.state.SorcièreConfirmed) gm.state.SorcièreConfirmed = false;
    if (!gm.state.LapinConfirmed) gm.state.LapinConfirmed = false;
    if (!gm.state.PetiteFilleConfirmed) gm.state.PetiteFilleConfirmed = false;
    if (!gm.state.salvateurHistory) gm.state.salvateurHistory = [];
    if (!gm.state.wolvesVictim) gm.state.wolvesVictim = null;

    // Initialiser tous les selectOne (Ancien, Ange, Servante, Salvateur, etc.)
    ['Ancien', 'Ange', 'Servante_Devouee', 'Salvateur', 'Marionnettiste', 'Voleur',
     'Pyromane', 'Ankou', 'Abominable_Sectaire', 'Noctambule', 'Necromancien', 'Corbeau'].forEach(role => {
      if (gm.state[`${role}Target`] === undefined) gm.state[`${role}Target`] = null;
    });

    // Initialiser tous les selectPair (Joueur_Flute, Gitane)
    ['Joueur_Flute', 'Gitane'].forEach(role => {
      if (gm.state[`${role}Selection`] === undefined) gm.state[`${role}Selection`] = [];
    });
  }

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
  const requiredCount = selectedRoles[currentRole] || 1;
  const assignedCount = players.filter(p => p.roleId === currentRole).length;

  document.querySelectorAll('.gm-player-assign').forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      const player = players.find(p => p.id === playerId);

      if (player && !player.roleId) {
        // Vérifier si on peut assigner (nombre max non atteint)
        const currentAssignedCount = players.filter(p => p.roleId === currentRole).length;
        if (currentAssignedCount < requiredCount) {
          player.roleId = currentRole;
          // Enregistrer dans le log
          gm.assignRole(player.name, currentRole);
          gm.saveState();
          gameUI.render();
        }
      } else if (player && player.roleId === currentRole) {
        player.roleId = null;
        gm.saveState();
        gameUI.render();
      }
    });
  });

  // Gestion Voyante (étape 2)
  if (step === 2 && currentRole === 'Voyante') {
    if (!gm.state.voyanteLook) gm.state.voyanteLook = { playerId: null, roleId: null };

    const touchesSelect = document.getElementById('gmVoyanteTouches');
    const containerDiv = document.getElementById('gmVoyanteRoleContainer');
    const resultDisplay = document.getElementById('gmVoyanteResult');

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

      if (playerId && roleId) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          resultDisplay.innerHTML = `✓ ${player.name} → <strong>${roleId}</strong>`;
          resultDisplay.style.color = '#66d999';
        }
      } else {
        resultDisplay.textContent = 'Aucune sélection';
        resultDisplay.style.color = '#aaa';
      }
    };

    if (touchesSelect) {
      touchesSelect.onchange = (e) => {
        const selectedValue = e.target.value;
        gm.state.voyanteLook.playerId = selectedValue;
        gm.saveState();
        updateVoyanteUI();
        gameUI.render();
        // Restaurer la sélection après le render
        const newTouchesSelect = document.getElementById('gmVoyanteTouches');
        if (newTouchesSelect) newTouchesSelect.value = selectedValue;
      };
    }

    updateVoyanteResult();
  }

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

  // Gestion Enfant Sauvage (étape 2)
  if (step === 2 && currentRole === 'Enfant_Sauvage') {
    if (!gm.state.enfantSauvageIdol) gm.state.enfantSauvageIdol = { playerId: null };

    const idolSelect = document.getElementById('gmEnfantSauvageIdol');
    const resultDisplay = document.getElementById('gmEnfantSauvageResult');

    const updateEnfantSauvageResult = () => {
      const playerId = gm.state.enfantSauvageIdol?.playerId;

      if (playerId) {
        const player = players.find(p => p.id === playerId);
        if (player && resultDisplay) {
          resultDisplay.innerHTML = `✓ <strong>${player.name}</strong> est ton idole`;
          resultDisplay.style.color = '#66d999';
        }
      } else {
        if (resultDisplay) {
          resultDisplay.textContent = 'Aucune sélection';
          resultDisplay.style.color = '#aaa';
        }
      }
    };

    if (idolSelect) {
      idolSelect.onchange = (e) => {
        gm.state.enfantSauvageIdol.playerId = e.target.value;
        gm.saveState();
        updateEnfantSauvageResult();
        gameUI.render();
      };
    }

    updateEnfantSauvageResult();
  }

  // Gestion Chien Loup (étape 2)
  if (step === 2 && currentRole === 'Chien_Loup') {
    if (!gm.state.chienLoupChoice) gm.state.chienLoupChoice = null;

    const resultDisplay = document.getElementById('gmChienLoupResult');
    const btnVillageois = document.getElementById('gmChienLoupVillageois');
    const btnLoup = document.getElementById('gmChienLoupLoup');

    const updateChienLoupResult = () => {
      const choice = gm.state.chienLoupChoice;

      if (choice === 'villageois') {
        resultDisplay.innerHTML = `✓ Tu restes <strong>Villageois</strong>`;
        resultDisplay.style.color = '#66d999';
        if (btnVillageois) btnVillageois.style.borderColor = '#66d999';
        if (btnLoup) btnLoup.style.borderColor = '#d46666';
      } else if (choice === 'loup') {
        resultDisplay.innerHTML = `✓ Tu deviens <strong>Loup Garou</strong>`;
        resultDisplay.style.color = '#d46666';
        if (btnVillageois) btnVillageois.style.borderColor = '#7ba3f5';
        if (btnLoup) btnLoup.style.borderColor = '#66d999';
      } else {
        resultDisplay.textContent = 'Aucun choix';
        resultDisplay.style.color = '#aaa';
        if (btnVillageois) btnVillageois.style.borderColor = '#7ba3f5';
        if (btnLoup) btnLoup.style.borderColor = '#d46666';
      }
    };

    if (btnVillageois && !btnVillageois.hasAttribute('data-listener-attached')) {
      btnVillageois.onclick = () => {
        gm.state.chienLoupChoice = 'villageois';
        gm.saveState();
        gameUI.render();
      };
      btnVillageois.setAttribute('data-listener-attached', 'true');
    }

    if (btnLoup && !btnLoup.hasAttribute('data-listener-attached')) {
      btnLoup.onclick = () => {
        gm.state.chienLoupChoice = 'loup';
        gm.saveState();
        gameUI.render();
      };
      btnLoup.setAttribute('data-listener-attached', 'true');
    }

    updateChienLoupResult();
  }

  // Gestion Sorcière (étape 2)
  if (step === 2 && currentRole === 'Sorcière') {
    attachSorcierePotionsHandlers(gameUI, players);
  }

  // ===== GESTION TOUS LES AUTRES RÔLES (étape 2) =====

  if (step === 2) {
    // Type 1: Sélection Simple (1 joueur)
    if (['Ancien', 'Ange', 'Servante_Devouee', 'Salvateur', 'Marionnettiste',
         'Voleur', 'Pyromane', 'Ankou', 'Abominable_Sectaire',
         'Noctambule', 'Necromancien', 'Corbeau'].includes(currentRole)) {
      attachSelectOneHandlers(gameUI, currentRole, players);
    }
    // Loups - action collective (tous les loups choisissent ensemble)
    else if (['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(currentRole)) {
      // Vérifier si c'est le PREMIER loup dans la boucle
      const wolvesInOrder = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
      const firstLoupInSelected = wolvesInOrder.find(w => availableRoles.includes(w));

      // On n'affiche l'action que pour le PREMIER loup
      if (currentRole === firstLoupInSelected) {
        attachWolvesKillHandlers(gameUI, players);
      }
    }
    // Type 2: Sélection Paire (2 joueurs)
    else if (['Joueur_Flute', 'Gitane'].includes(currentRole)) {
      attachSelectPairHandlers(gameUI, currentRole, players);
    }
    // Type 3: Renard (pointe 1 joueur, vérifie 3)
    else if (currentRole === 'Renard') {
      attachRenardHandlers(gameUI, players);
    }
    // Type 6: Juge Bègue
    else if (currentRole === 'Juge_Begue') {
      attachJugeBeHandlers(gameUI, players);
    }
    // Type 5: Confirmations
    else if (currentRole === 'Sorcière') {
      attachConfirmHandlers(gameUI, 'Sorcière');
    }
    else if (currentRole === 'Lapin_Blanc') {
      attachConfirmHandlers(gameUI, 'Lapin');
    }
    else if (currentRole === 'Petite_Fille') {
      attachConfirmHandlers(gameUI, 'PetiteFille');
    }
  }

  // ===== VALIDATION DU BOUTON "SUIVANT" (Étape 2) =====
  const btnNextStep = document.getElementById('gmBtnNextStep');
  if (btnNextStep) {
    if (step === 2) {
      const isComplete = isActionComplete(gm, currentRole);
      btnNextStep.disabled = !isComplete;
      btnNextStep.style.opacity = isComplete ? '1' : '0.5';
      btnNextStep.style.cursor = isComplete ? 'pointer' : 'not-allowed';
      btnNextStep.title = isComplete ? 'Valider cette action' : 'Complétez l\'action avant de continuer';
    }

    // Attacher le listener UNE SEULE FOIS en utilisant onclick
    if (!btnNextStep.hasAttribute('data-listener-attached')) {
      btnNextStep.onclick = (e) => {
        e.preventDefault();
        // Vérifier que le bouton est vraiment actif
        if (btnNextStep.disabled) {
          return; // Ne rien faire si le bouton est désactivé
        }

        const gm = gameUI.gm;
        const players = gm.state.players || [];
        const selectedRoles = gm.state.selectedRoles || {};
        const step = gm.state.nightStep;
        const currentRoleIdx = gm.state.currentRoleIdx;
        const availableRoles = getAvailableRolesInOrder(selectedRoles);
        const currentRole = availableRoles[currentRoleIdx];

        if (step === 1) {
          // Vérifier si le rôle a une action la première nuit
          if (ROLES_WITH_NIGHT_ACTION.has(currentRole)) {
            gm.state.nightStep = 2;
          } else {
            // Pas d'action, passer au rôle suivant
            gm.state.currentRoleIdx = currentRoleIdx + 1;
            gm.state.nightStep = 1;
          }
        } else {
          // Étape 2: Enregistrer l'action du rôle avant de passer au suivant
          const actor = players.find(p => p.roleId === currentRole);
          const targetId = gm.state[`${currentRole}Target`];
          const target = targetId ? players.find(p => p.id === targetId) : null;
          const selection = gm.state[`${currentRole}Selection`];

          if (currentRole === 'Cupidon' && gm.state.cupidoSelection && gm.state.cupidoSelection.length === 2) {
            const selected = gm.state.cupidoSelection;
            const p1 = players.find(p => p.id === selected[0]);
            const p2 = players.find(p => p.id === selected[1]);
            if (p1 && p2) gm.cupidoAction(p1.name, p2.name);
          }
          else if (currentRole === 'Enfant_Sauvage' && gm.state.enfantSauvageIdol?.playerId) {
            const enfant = players.find(p => p.roleId === 'Enfant_Sauvage');
            const idol = players.find(p => p.id === gm.state.enfantSauvageIdol.playerId);
            if (enfant && idol) gm.enfantSauvageIdol(enfant.name, idol.name);
          }
          else if (currentRole === 'Chien_Loup' && gm.state.chienLoupChoice) {
            const chien = players.find(p => p.roleId === 'Chien_Loup');
            if (chien) gm.chienLoupChoice(chien.name, gm.state.chienLoupChoice);
          }
          else if (currentRole === 'Voyante' && gm.state.voyanteLook?.playerId && gm.state.voyanteLook?.roleId) {
            const voyante = players.find(p => p.roleId === 'Voyante');
            const target = players.find(p => p.id === gm.state.voyanteLook.playerId);
            if (voyante && target) gm.voyanteLook(voyante.name, target.name);
          }
          else if (currentRole === 'Sorcière' && gm.state.sorcierePotions) {
            const sorciere = players.find(p => p.roleId === 'Sorcière');
            const choice = gm.state.sorcierePotions.choice;
            const mortTarget = gm.state.sorcierePotions.mortTarget || '';

            if (sorciere) {
              if (choice === 'save') {
                // Sauver la victime des loups
                const victim = players.find(p => p.id === gm.state.wolvesVictim);
                if (victim) {
                  gm.addGameLog(`🧪 ${sorciere.name} (Sorcière) a ressuscité <strong>${victim.name}</strong>`);
                  if (!gm.state.sorcierePotionsHistory) gm.state.sorcierePotionsHistory = { vie: false, mort: false };
                  gm.state.sorcierePotionsHistory.vie = true;
                }
              } else if (choice === 'kill' && mortTarget) {
                // Empoisonner quelqu'un
                const target = players.find(p => p.id === mortTarget);
                if (target) {
                  gm.addGameLog(`☠️ ${sorciere.name} (Sorcière) a empoisonné <strong>${target.name}</strong>`);
                  if (!gm.state.sorcierePotionsHistory) gm.state.sorcierePotionsHistory = { vie: false, mort: false };
                  gm.state.sorcierePotionsHistory.mort = true;
                }
              } else if (choice === 'nothing') {
                gm.addGameLog(`🧙‍♀️ ${sorciere.name} (Sorcière) n'a rien fait cette nuit`);
              }
            }
          }
          else if (currentRole === 'Ancien' && actor && target) {
            gm.ancienProtect(actor.name, target.name);
          }
          else if (currentRole === 'Ange' && actor && target) {
            gm.angeProtect(actor.name, target.name);
          }
          else if (currentRole === 'Servante_Devouee' && actor && target) {
            gm.servantProtect(actor.name, target.name);
          }
          else if (currentRole === 'Salvateur' && actor && target) {
            gm.salvateurAnticipate(actor.name, target.name);
            // Ajouter à l'historique pour empêcher de sauver la même personne 2 fois de suite
            if (!gm.state.salvateurHistory) gm.state.salvateurHistory = [];
            gm.state.salvateurHistory.push(target.id);
          }
          else if (currentRole === 'Renard' && gm.state.renardSniff?.targetId) {
            const renard = players.find(p => p.roleId === 'Renard');
            const target = players.find(p => p.id === gm.state.renardSniff.targetId);
            const wolfCount = [gm.state.renardSniff.leftWolf, gm.state.renardSniff.centerWolf, gm.state.renardSniff.rightWolf].filter(Boolean).length;
            if (renard && target) gm.renardSniff(renard.name, target.name, wolfCount);
          }
          else if (currentRole === 'Gitane' && selection && selection.length === 2) {
            const gitane = players.find(p => p.roleId === 'Gitane');
            const p1 = players.find(p => p.id === selection[0]);
            const p2 = players.find(p => p.id === selection[1]);
            if (gitane && p1 && p2) gm.gitaneConnection(gitane.name, p1.name, p2.name);
          }
          else if (currentRole === 'Joueur_Flute' && selection && selection.length === 2) {
            const flute = players.find(p => p.roleId === 'Joueur_Flute');
            const p1 = players.find(p => p.id === selection[0]);
            const p2 = players.find(p => p.id === selection[1]);
            if (flute && p1 && p2) gm.fluteCharm(flute.name, p1.name, p2.name);
          }
          else if (currentRole === 'Marionnettiste' && actor && target) {
            gm.marionnetteControl(actor.name, target.name);
          }
          else if (currentRole === 'Voleur' && actor && target) {
            gm.voleurSteal(actor.name, target.name);
          }
          else if (currentRole === 'Pyromane' && actor && target) {
            gm.pyromaneMarque(actor.name, target.name);
          }
          else if (currentRole === 'Ankou' && actor && target) {
            gm.ankouMarque(actor.name, target.name);
          }
          else if (currentRole === 'Abominable_Sectaire' && actor && target) {
            gm.sectaireConvert(actor.name, target.name);
          }
          else if (currentRole === 'Lapin_Blanc' && gm.state.LapinConfirmed) {
            const lapin = players.find(p => p.roleId === 'Lapin_Blanc');
            if (lapin) gm.lapinEvent(lapin.name);
          }
          else if (currentRole === 'Juge_Begue' && gm.state.jugeBeJudgement?.targetId && gm.state.jugeBeJudgement?.verdict) {
            const juge = players.find(p => p.roleId === 'Juge_Begue');
            const target = players.find(p => p.id === gm.state.jugeBeJudgement.targetId);
            if (juge && target) gm.jugeJudge(juge.name, target.name, gm.state.jugeBeJudgement.verdict);
          }
          else if (currentRole === 'Necromancien' && actor && target) {
            gm.necromancienResurrect(actor.name, target.name);
          }
          else if (currentRole === 'Noctambule' && actor && target) {
            gm.noctambuloAction(actor.name, target.name);
          }
          else if (currentRole === 'Corbeau' && actor && target) {
            gm.corbeauBoost(actor.name, target.name);
          }
          else if (currentRole === 'Petite_Fille' && gm.state.PetiteFilleConfirmed) {
            const fille = players.find(p => p.roleId === 'Petite_Fille');
            if (fille) gm.petiteFilleEcoute(fille.name);
          }
          // Enregistrer action loups (une seule fois au premier loup)
          const wolvesInOrder = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
          const firstLoupIdx = wolvesInOrder.findIndex(w => availableRoles.includes(w));
          const isFirstWolf = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(currentRole) &&
                              currentRole === wolvesInOrder[firstLoupIdx];

          if (isFirstWolf && gm.state.wolvesVictim) {
            const victim = players.find(p => p.id === gm.state.wolvesVictim);
            if (victim) {
              // Trouver tous les loups et les nommer
              const wolves = players.filter(p => {
                const role = p.roleId;
                return role === 'Simple_Loup_Garou' || role === 'Grand_Mechant_Loup' ||
                       role === 'Loup_Garou_Blanc' || role === 'Loup_Garou_Voyant' ||
                       role === 'Infect_Pere_Loups';
              });
              const wolfNames = wolves.map(w => w.name).join(', ');
              gm.addGameLog(`🐺 <strong>Loups-Garous</strong> (${wolfNames}) mangent <strong>${victim.name}</strong> cette nuit!`);
            }
          }

          // Avancer au PROCHAIN RÔLE DIFFÉRENT (sauter les doublons du même rôle)
          let nextRoleIdx = currentRoleIdx + 1;
          while (nextRoleIdx < availableRoles.length && availableRoles[nextRoleIdx] === currentRole) {
            nextRoleIdx++;
          }
          gm.state.currentRoleIdx = nextRoleIdx;
          gm.state.nightStep = 1;
          // Réinitialiser TOUS les états
          gm.state.cupidoSelection = [];
          gm.state.enfantSauvageIdol = { playerId: null };
          gm.state.chienLoupChoice = null;
          gm.state.voyanteLook = { playerId: null, roleId: null };
          gm.state.renardSniff = { targetId: null, leftWolf: false, centerWolf: false, rightWolf: false };
          gm.state.jugeBeJudgement = { targetId: null, verdict: null };
          gm.state.SorcièreConfirmed = false;
          gm.state.LapinConfirmed = false;
          gm.state.PetiteFilleConfirmed = false;
          gm.state.wolvesVictim = null;
          // Réinitialiser tous les selectOne
          ['Ancien', 'Ange', 'Servante_Devouee', 'Salvateur', 'Marionnettiste', 'Voleur',
           'Pyromane', 'Ankou', 'Abominable_Sectaire',
           'Noctambule', 'Necromancien', 'Corbeau'].forEach(role => {
            gm.state[`${role}Target`] = null;
          });
          // Réinitialiser tous les selectPair
          ['Joueur_Flute', 'Gitane'].forEach(role => {
            gm.state[`${role}Selection`] = [];
          });
        }
        gm.saveState();
        gameUI.render();
      };
      btnNextStep.setAttribute('data-listener-attached', 'true');
    }
  }

  // Navigation (Retour)
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

  // Navigation rapide entre rôles
  document.getElementById('gmBtnPrevRole')?.addEventListener('click', () => {
    if (currentRoleIdx > 0) {
      gm.state.currentRoleIdx = currentRoleIdx - 1;
      gm.state.nightStep = 1;
      gm.saveState();
      gameUI.render();
    }
  });

  document.getElementById('gmBtnNextRole')?.addEventListener('click', () => {
    if (currentRoleIdx < availableRoles.length - 1) {
      gm.state.currentRoleIdx = currentRoleIdx + 1;
      gm.state.nightStep = 1;
      gm.saveState();
      gameUI.render();
    }
  });

  document.getElementById('gmBtnFinishGame')?.addEventListener('click', () => {
    gm.state.mode = 'mayorElection';
    gm.state.gameState.phase = 'day1-election';
    gm.saveState();
    gameUI.render();
  });
}
