// ========================================
// HANDLERS POUR TOUS LES RÔLES AVEC ACTIONS
// À INTÉGRER DANS attachFirstNightEvents()
// ========================================

// ============================================
// RÔLES TYPE 1: SÉLECTION SIMPLE (1 JOUEUR)
// ============================================

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
      if (target) {
        resultDisplay.innerHTML = `✓ <strong>${target.name}</strong>`;
        resultDisplay.style.color = '#66d999';
      }
    } else {
      resultDisplay.textContent = 'Aucune sélection';
      resultDisplay.style.color = '#aaa';
    }
  };

  targetSelect?.addEventListener('change', (e) => {
    gm.state[stateKey] = e.target.value;
    gm.saveState();
    updateResult();
  });
  updateResult();
}

// ============================================
// RÔLES TYPE 2: SÉLECTION PAIRE (2 JOUEURS)
// ============================================

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

// ============================================
// RENARD: SÉLECTION 3 RÔLES
// ============================================

function attachRenardHandlers(gameUI, players, selectedRoles) {
  const gm = gameUI.gm;

  if (!gm.state.renardDetect) gm.state.renardDetect = { self: 'Renard', left: null, right: null };

  const selfSelect = document.getElementById('gmRenardSelf');
  const leftSelect = document.getElementById('gmRenardLeft');
  const rightSelect = document.getElementById('gmRenardRight');
  const resultDisplay = document.getElementById('gmRenardResult');

  const updateResult = () => {
    const { self, left, right } = gm.state.renardDetect;
    if (left && right) {
      resultDisplay.innerHTML = `✓ <strong>${self}</strong> (toi) | Gauche: <strong>${left}</strong> | Droite: <strong>${right}</strong>`;
      resultDisplay.style.color = '#66d999';
    } else {
      resultDisplay.textContent = 'Complète les 3 rôles';
      resultDisplay.style.color = '#aaa';
    }
  };

  leftSelect?.addEventListener('change', (e) => {
    gm.state.renardDetect.left = e.target.value;
    gm.saveState();
    updateResult();
  });

  rightSelect?.addEventListener('change', (e) => {
    gm.state.renardDetect.right = e.target.value;
    gm.saveState();
    updateResult();
  });

  updateResult();
}

// ============================================
// JUGE BÈGUE: SÉLECTION + JUGEMENT
// ============================================

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
      resultDisplay.innerHTML = `✓ <strong>${target.name}</strong> → ${verdictText}`;
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
  });

  btnInnocent?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'innocent';
    btnInnocent.style.borderColor = '#66d999';
    btnCoupable.style.borderColor = '#d46666';
    gm.saveState();
    updateResult();
  });

  btnCoupable?.addEventListener('click', () => {
    gm.state.jugeBeJudgement.verdict = 'coupable';
    btnInnocent.style.borderColor = '#7ba3f5';
    btnCoupable.style.borderColor = '#66d999';
    gm.saveState();
    updateResult();
  });

  updateResult();
}

// ============================================
// CONFIRMATIONS SIMPLES
// ============================================

function attachConfirmHandlers(gameUI, confirmType) {
  const gm = gameUI.gm;
  const stateKey = `${confirmType}Confirmed`;

  if (!gm.state[stateKey]) gm.state[stateKey] = false;

  const btnConfirm = document.getElementById(`gm${confirmType}Confirm`);

  btnConfirm?.addEventListener('click', () => {
    gm.state[stateKey] = true;
    gm.saveState();
    btnConfirm.style.background = 'linear-gradient(135deg, #4a9d6f, #66d999)';
    btnConfirm.textContent = '✓ Confirmé';
  });
}

// ============================================
// UTILISATION DANS attachFirstNightEvents()
// ============================================

/*
if (step === 2) {
  if (['Ancien', 'Ange', 'Servante_Devouee', 'Salvateur', 'Marionnettiste',
       'Voleur', 'Pyromane', 'Ankou', 'Abominable_Sectaire', 'Chevalier_Epee_Rouille',
       'Noctambule', 'Necromancien'].includes(currentRole)) {
    attachSelectOneHandlers(gameUI, currentRole, players);
  }
  else if (['Joueur_Flute', 'Gitane'].includes(currentRole)) {
    attachSelectPairHandlers(gameUI, currentRole, players);
  }
  else if (currentRole === 'Renard') {
    attachRenardHandlers(gameUI, players, selectedRoles);
  }
  else if (currentRole === 'Juge_Begue') {
    attachJugeBeHandlers(gameUI, players);
  }
  else if (['Sorcière', 'Corbeau'].includes(currentRole)) {
    attachConfirmHandlers(gameUI, currentRole);
  }
  else if (currentRole === 'Lapin_Blanc') {
    attachConfirmHandlers(gameUI, 'Lapin');
  }
  else if (currentRole === 'Petite_Fille') {
    attachConfirmHandlers(gameUI, 'PetiteFille');
  }
}
*/
