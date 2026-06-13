// ========================================
// 01-WINDOWS BUTTONS
// Barre de titre avec boutons de contrôle
// ========================================

function renderWindowsButtons() {
  return `
    <div class="gm-header" id="gmHeader" style="cursor:move; display:flex; gap:8px; align-items:center;">
      <div style="padding:4px 8px; color:#81dff7; font-size:14px; flex-shrink:0; touch-action:none;">⋮⋮</div>
      <div class="gm-title" style="flex:1;">🐺 Maître du Jeu</div>
      <div style="display: flex; gap: 6px; align-items: center; flex-shrink:0;">
        <div id="gmChrono" style="background:rgba(74, 157, 111, 0.2); border:2px solid #66d999; padding:4px 10px; border-radius:4px; color:#66d999; font-weight:700; font-size:12px; min-width:55px; text-align:center;">00:00</div>
        <button id="gmBtnReset" title="Réinitialiser la partie" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(220,100,100,0.3); border-radius:3px; color:#ff6b6b; font-size:12px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">↻</button>
        <button id="gmBtnRefresh" title="Recharger (bypass cache)" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(100,200,100,0.3); border-radius:3px; color:#66ff66; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">🆕</button>
        <button id="gmBtnSkipRole" title="Passer le rôle courant (secours)" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(255,180,80,0.25); border-radius:3px; color:#ffb84d; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">⏭</button>
        <button id="gmBtnForceSummary" title="Forcer le résumé de la nuit (secours)" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(120,160,255,0.25); border-radius:3px; color:#9ec0ff; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">🌙</button>
        <button id="gmBtnLog" title="Télécharger le journal (debug)" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(100,200,150,0.25); border-radius:3px; color:#66e0a0; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">📥</button>
        <button id="gmBtnJournal" title="Journal de la partie (horodaté)" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(150,90,200,0.3); border-radius:3px; color:#c79cff; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">📜</button>
        <button id="gmBtnCollapse" title="Réduire/Maximiser" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(100,150,255,0.3); border-radius:3px; color:#6699ff; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">−</button>
        <button id="gmBtnClose" title="Fermer" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(200,100,200,0.3); border-radius:3px; color:#dd77ff; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
      </div>
    </div>
  `;
}

function attachWindowsButtonsEvents(gameUI) {
  // Anti double-attache: le render se rejoue souvent et empilait les listeners
  // (cliquer "Réduire" appelait toggleMinimized plusieurs fois -> aucun effet net).
  const _hdr = document.getElementById('gmHeader');
  if (_hdr) {
    if (_hdr.dataset.winBtnsBound === '1') return;
    _hdr.dataset.winBtnsBound = '1';
  }
  // Bouton Reset
  document.getElementById('gmBtnReset')?.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr? Cela réinitialisera le jeu.')) {
      gameUI.gm.resetState();
      gameUI.gm.state.mode = 'selectRoles';
      gameUI.gm.saveState();
      gameUI.render();
    }
  });

  // Bouton Refresh (bypass cache)
  document.getElementById('gmBtnRefresh')?.addEventListener('click', () => {
    const url = new URL(window.location);
    url.searchParams.set('nocache', Date.now());
    window.location.href = url.toString();
  });

  // Bouton Close
  document.getElementById('gmBtnClose')?.addEventListener('click', () => {
    gameUI.close();
  });

  // Bouton Collapse/Minimize
  document.getElementById('gmBtnCollapse')?.addEventListener('click', () => {
    gameUI.toggleMinimized();
  });

  // ===== FILET DE SECURITE MDJ =====
  const mdj = () => (window.gameUI && window.gameUI.gm && window.gameUI.gm.mdj) || (gameUI.gm && gameUI.gm.mdj) || null;

  document.getElementById('gmBtnLog')?.addEventListener('click', () => {
    const m = mdj();
    if (m && typeof m.downloadGameLog === 'function') m.downloadGameLog();
    else alert('Journal indisponible (la partie MDJ n\'est pas active).');
  });

  document.getElementById('gmBtnJournal')?.addEventListener('click', () => {
    const m = mdj();
    if (m && typeof m.openJournalOverlay === 'function') m.openJournalOverlay();
    else alert('Journal indisponible (la partie MDJ n\'est pas active).');
  });

  document.getElementById('gmBtnForceSummary')?.addEventListener('click', () => {
    const m = mdj();
    if (m && typeof m.forceNightSummary === 'function') {
      if (confirm('Forcer le résumé de la nuit ? (marque les rôles restants comme faits)')) m.forceNightSummary();
    } else {
      alert('Résumé indisponible (la partie MDJ n\'est pas active).');
    }
  });

  document.getElementById('gmBtnSkipRole')?.addEventListener('click', () => {
    const m = mdj();
    if (m && typeof m.forceSkipCurrentRole === 'function') m.forceSkipCurrentRole();
    else alert('Action indisponible (la partie MDJ n\'est pas active).');
  });
}
