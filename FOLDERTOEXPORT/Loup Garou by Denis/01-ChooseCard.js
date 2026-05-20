// ========================================
// ÉCRAN 1: SÉLECTIONNER LES RÔLES
// ========================================

function renderChooseCard(gameUI) {
  const gm = gameUI.gm;
  const allRoles = Object.keys(gm.roles);

  // Nettoyer selectedRoles des clés numériques erronées
  let selectedRoles = gm.state.selectedRoles || {};
  const cleanedRoles = {};
  for (const key in selectedRoles) {
    if (!isNaN(key)) continue; // Skip numeric keys
    cleanedRoles[key] = selectedRoles[key];
  }
  selectedRoles = cleanedRoles;
  gm.state.selectedRoles = selectedRoles;

  const rolesGrid = allRoles.map(roleId => {
    const count = selectedRoles[roleId] || 0;
    const cardFile = gameUI.getCardFile(roleId);
    const role = gameUI.gm.roles[roleId];
    const description = role ? role.description : '';
    return `
      <div class="gm-role-card" data-role-id="${roleId}" title="${description}" style="position:relative; cursor:pointer; border:${count > 0 ? '2px solid #5174db' : '1px solid rgba(199,125,255,0.3)'}; padding:2px; border-radius:2px; text-align:center; background:rgba(0,0,0,0.3);">
        <img src="cards/${cardFile}.webp" alt="${roleId}" style="width:100%; height:60px; object-fit:cover; border-radius:2px; margin-bottom:1px; cursor:pointer;">
        <div style="font-size:6px; color:#e8e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1;">${roleId}</div>
        ${count > 0 ? `<div style="position:absolute; top:-2px; right:-2px; background:#5174db; color:white; width:14px; height:14px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:7px;">${count}</div>` : ''}
      </div>
    `;
  }).join('');

  const deckCards = Object.entries(selectedRoles).map(([roleId, count]) => {
    const cardFile = gameUI.getCardFile(roleId);
    return Array(count).fill(0).map(() => `
      <img class="gm-deck-card" data-role-id="${roleId}" src="cards/${cardFile}.webp" alt="${roleId}" style="width:100%; height:85px; object-fit:cover; border-radius:2px; border:1px solid rgba(199,125,255,0.4); cursor:pointer; padding:1px; box-sizing:border-box;">
    `).join('');
  }).join('');

  return `
    <div class="gm-screen gm-choose-card" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:18px; color:#e8e8f0;">
         🃏 Sélectionner les Rôles
      </h2>
      <div style="flex:1; display:flex; gap:6px; padding:6px; overflow:hidden; box-sizing:border-box;">
        <!-- GAUCHE: Cartes disponibles (50%) -->
        <div style="flex:0 0 50%; display:flex; flex-direction:column; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:6px; box-sizing:border-box; overflow:hidden;">
          <div style="font-size:9px; color:#81dff7; margin-bottom:4px; font-weight:600;">📚 Cartes</div>
          <div id="gmCardListScroll" style="flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; padding:1px; scroll-behavior:auto; overscroll-behavior:contain;">
            ${rolesGrid}
          </div>
        </div>
        <!-- DROITE: Deck actuel (50%) -->
        <div style="flex:0 0 50%; display:flex; flex-direction:column; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:6px; box-sizing:border-box; overflow:hidden;">
          <div style="font-size:9px; color:#81dff7; margin-bottom:4px; font-weight:600;">🎴 Deck (${Object.values(selectedRoles).reduce((a,b) => a+b, 0)})</div>
          <div id="gmDeckListScroll" style="flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; padding:1px; background:rgba(0,0,0,0.3); border-radius:4px; border:1px dashed rgba(199,125,255,0.3); scroll-behavior:auto;">
            ${deckCards || '<div style="color:#999; font-size:10px; width:100%; text-align:center; padding:12px 0; grid-column:1/-1;">Cliquez</div>'}
          </div>
        </div>
      </div>
      <div style="padding:12px; display:flex; gap:12px; background:rgba(0,0,0,0.3); border-top:1px solid rgba(199,125,255,0.2);">
        <button id="gmBtnNextRoles" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:12px 16px; border-radius:6px; color:white; font-weight:600; cursor:pointer; flex:1;">
           Suivant: Joueurs →
        </button>
      </div>
    </div>
  `;
}

function attachChooseCardEvents(gameUI) {
  // Fonction helper pour sauvegarder/restaurer le scroll des deux panneaux
  const renderWithScrollPreserve = () => {
    const cardList = document.getElementById('gmCardListScroll');
    const deckList = document.getElementById('gmDeckListScroll');
    const cardListScroll = cardList ? cardList.scrollTop : 0;
    const deckListScroll = deckList ? deckList.scrollTop : 0;

    gameUI.render();

    requestAnimationFrame(() => {
      const cardList = document.getElementById('gmCardListScroll');
      const deckList = document.getElementById('gmDeckListScroll');
      if (cardList) {
        cardList.scrollTop = cardListScroll;
      }
      if (deckList) {
        deckList.scrollTop = deckListScroll;
      }
    });
  };

  // Cartes disponibles - ajouter au deck
  document.querySelectorAll('.gm-role-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const roleId = card.dataset.roleId;
      if (!gameUI.gm.state.selectedRoles) gameUI.gm.state.selectedRoles = {};
      gameUI.gm.state.selectedRoles[roleId] = (gameUI.gm.state.selectedRoles[roleId] || 0) + 1;
      gameUI.gm.saveState();
      renderWithScrollPreserve();
    });
  });

  // Cartes du deck - enlever du deck
  document.querySelectorAll('.gm-deck-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const roleId = card.dataset.roleId;
      if (gameUI.gm.state.selectedRoles && gameUI.gm.state.selectedRoles[roleId]) {
        gameUI.gm.state.selectedRoles[roleId]--;
        if (gameUI.gm.state.selectedRoles[roleId] <= 0) {
          delete gameUI.gm.state.selectedRoles[roleId];
        }
        gameUI.gm.saveState();
        renderWithScrollPreserve();
      }
    });
  });

  document.getElementById('gmBtnNextRoles')?.addEventListener('click', () => {
    const playerCount = Object.values(gameUI.gm.state.selectedRoles || {}).reduce((a,b) => a+b, 0);
    if (playerCount === 0) { alert('Sélectionnez au moins une carte!'); return; }
    gameUI.gm.state.players = [];
    for (let i = 0; i < playerCount; i++) {
      gameUI.gm.state.players.push({ id: `p${i}`, name: `J${i+1}`, tableX: null, tableY: null, roleId: null });
    }
    gameUI.gm.state.mode = 'tableSetup';
    gameUI.gm.state.tableType = 'circle';
    gameUI.gm.saveState();
    gameUI.render();
  });
}
