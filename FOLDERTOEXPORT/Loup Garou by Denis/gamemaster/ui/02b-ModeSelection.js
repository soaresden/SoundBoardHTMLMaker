// ========================================
// 03-MODE SELECTION
// Écran de sélection du mode de jeu
// ========================================

function renderModeSelection(gameUI) {
  const gm = gameUI.gm;
  const selectedRoles = gm.state.selectedRoles || {};
  const totalCards = Object.values(selectedRoles).reduce((a, b) => a + b, 0);

  return `
    <div class="gm-screen gm-mode-selection" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:12px 16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:16px; color:#e8e8f0;">
         Mode de Jeu - ${totalCards} joueurs
      </h2>

      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; overflow:auto;">
        <div style="max-width:600px; width:100%;">
          <h3 style="text-align:center; color:#81dff7; margin:0 0 40px 0; font-size:18px;">
            Comment souhaitez-vous assigner les rôles?
          </h3>

          <!-- MODE 1: ASSIGNATION ALÉATOIRE (Tablet Pass) -->
          <div id="gmBtnTabletPass" style="
            background:linear-gradient(135deg, rgba(81,116,219,0.2), rgba(199,125,255,0.1));
            border:2px solid rgba(81,116,219,0.5);
            border-radius:8px;
            padding:24px;
            margin-bottom:20px;
            cursor:pointer;
            transition:all 0.3s;
            text-align:center;
          " onmouseover="this.style.background='linear-gradient(135deg, rgba(81,116,219,0.3), rgba(199,125,255,0.15))'; this.style.borderColor='rgba(81,116,219,0.8)'; this.style.boxShadow='0 0 20px rgba(81,116,219,0.3)';"
             onmouseout="this.style.background='linear-gradient(135deg, rgba(81,116,219,0.2), rgba(199,125,255,0.1))'; this.style.borderColor='rgba(81,116,219,0.5)'; this.style.boxShadow='none';">
            <div style="font-size:32px; margin-bottom:12px;">📱</div>
            <div style="font-size:14px; font-weight:600; color:#81dff7; margin-bottom:8px;">
              Assignation Aléatoire
            </div>
            <div style="font-size:12px; color:#ccc; line-height:1.5;">
              La tablette passe en cercle.<br>
              Chaque joueur voit son rôle et le garde secret.
            </div>
          </div>

          <!-- MODE 2: ASSIGNATION MANUELLE (MDJ) -->
          <div id="gmBtnMDJAssign" style="
            background:linear-gradient(135deg, rgba(199,125,255,0.2), rgba(199,125,255,0.1));
            border:2px solid rgba(199,125,255,0.5);
            border-radius:8px;
            padding:24px;
            cursor:pointer;
            transition:all 0.3s;
            text-align:center;
          " onmouseover="this.style.background='linear-gradient(135deg, rgba(199,125,255,0.3), rgba(199,125,255,0.15))'; this.style.borderColor='rgba(199,125,255,0.8)'; this.style.boxShadow='0 0 20px rgba(199,125,255,0.3)';"
             onmouseout="this.style.background='linear-gradient(135deg, rgba(199,125,255,0.2), rgba(199,125,255,0.1))'; this.style.borderColor='rgba(199,125,255,0.5)'; this.style.boxShadow='none';">
            <div style="font-size:32px; margin-bottom:12px;">🎭</div>
            <div style="font-size:14px; font-weight:600; color:#c77dff; margin-bottom:8px;">
              Assignation Manuelle (MDJ)
            </div>
            <div style="font-size:12px; color:#ccc; line-height:1.5;">
              Vous (Maître de Jeu) assignez les rôles.<br>
              Contrôle total sur l'équilibre du jeu.
            </div>
          </div>
        </div>
      </div>

      <!-- Footer avec bouton retour -->
      <div style="padding:8px 12px; display:flex; gap:12px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(199,125,255,0.2);">
        <button id="gmBtnBackToRoles" style="background:rgba(100,100,150,0.3); border:1px solid rgba(199,125,255,0.3); padding:8px 14px; border-radius:4px; color:#c1a8ff; font-weight:600; cursor:pointer; font-size:10px;">
           ← Retour
        </button>
        <div style="flex:1;"></div>
      </div>
    </div>
  `;
}

function attachModeSelectionEvents(gameUI) {
  // Bouton Assignation Aléatoire (Tablet Pass)
  document.getElementById('gmBtnTabletPass')?.addEventListener('click', () => {
    gameUI.gm.state.assignmentMode = 'tabletPass';
    gameUI.gm.state.mode = 'assignRoles';
    gameUI.gm.state.currentRoleIdx = 0;
    gameUI.gm.state.nightStep = 1;
    gameUI.gm.saveState();
    gameUI.render();
  });

  // Bouton Assignation MDJ (Manual)
  document.getElementById('gmBtnMDJAssign')?.addEventListener('click', () => {
    gameUI.gm.state.assignmentMode = 'mdj';
    gameUI.gm.state.mode = 'assignRoles';
    gameUI.gm.state.currentRoleIdx = 0;
    gameUI.gm.state.nightStep = 1;
    gameUI.gm.saveState();
    gameUI.render();
  });

  // Bouton Retour
  document.getElementById('gmBtnBackToRoles')?.addEventListener('click', () => {
    console.log('[ModeSelection] Back to role selection');
    gameUI.gm.state.mode = 'selectRoles';
    gameUI.gm.saveState();
    gameUI.render();
  });
}
