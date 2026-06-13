// ========================================
// GAME MASTER UI - Interface & Rendering
// ========================================

class GameMasterUI {
  constructor(gameMaster) {
    this.gm = gameMaster;
    this.collapsed = false;
    this.minimized = false;
    this.activeTab = 'game';
    console.log('[GameMaster UI] Constructor called');

    // Restaurer l'état depuis le cache localStorage
    this.restoreGameStateFromCache();

    this.roleToCardFile = {
      'Villageois': '99-Villageois',
      'Voyante': 'Voyante',
      'Chasseur': 'Chasseur',
      'Sorciere': 'Sorciere',
      'Cupidon': 'Cupidon',
      'Petite_Fille': 'Petite_Fille',
      'Ancien': 'Ancien',
      'Bouc_Emissaire': 'Bouc_Emissaire',
      'Corbeau': '97-Corbeau',
      'Montreur_Ours': 'Montreur_Ours',
      'Salvateur': 'Salvateur',
      'Servante_Devouee': 'Servante_Devouee',
      'Idiot_Village': 'Idiot_Village',
      'Ange': 'Ange',
      'Capitaine': 'Capitaine',
      'Noctambule': 'Noctambule',
      'Simple_Loup_Garou': 'Simple_Loup_Garou',
      'Grand_Mechant_Loup': 'Grand_Mechant_Loup',
      'Loup_Garou_Blanc': 'Loup_Garou_Blanc',
      'Loup_Garou_Voyant': 'Loup_Garou_Voyant',
      'Infect_Pere_Loups': 'Infect_Pere_Loups',
      'Enfant_Sauvage': 'Enfant_Sauvage',
      'Renard': 'Renard',
      'Gitane': 'Gitane',
      'Joueur_Flute': 'Joueur_Flute',
      'Marionnettiste': 'Marionnettiste',
      'Voleur': 'Voleur',
      'Pyromane': 'Pyromane',
      'Deux_Soeurs': 'Deux_Soeurs',
      'Trois_Freres': 'Trois_Freres',
      'Ankou': 'Ankou',
      'Abominable_Sectaire': 'Abominable_Sectaire',
      'Lapin_Blanc': 'Lapin_Blanc',
      'Chevalier_Epee_Rouille': 'Chevalier_Epee_Rouille',
      'Chien_Loup': 'Chien_Loup',
      'Comedien': 'Comedien',
      'Juge_Begue': 'Juge_Begue',
      'Necromancien': 'Necromancien'
    };

    this.init();
  }

  getCardFile(roleId) {
    // Use helper function to get image path based on ROLE_FILE_MAPPING
    if (window.getRoleImagePath) {
      return window.getRoleImagePath(roleId);
    }

    // Fallback: construct path if helper not available
    return `gamemaster/roles/${roleId}.png`;
  }

  init() {
    console.log('[GameMaster UI] Init called');
    this.createOverlay();
    this.attachEventListeners();
    this.updateTabStyles();
    console.log('[GameMaster UI] Init complete');
  }

  createOverlay() {
    let overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      console.log('[GameMaster] Overlay already exists, skipping creation');
      return;
    }
    overlay = document.createElement('div');
    overlay.id = 'gameMasterOverlay';
    overlay.className = 'game-master-overlay';
    // Utiliser le module WindowsButtons pour le header
    overlay.innerHTML = `
      ${renderWindowsButtons()}
      <div class="gm-tabs" id="gmTabs" style="display:flex; gap:0; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(199,125,255,0.2);">
        <button id="gmTabGame" class="gm-tab" data-tab="game" style="flex:1; padding:8px 12px; border:none; background:rgba(81,116,219,0.3); color:#81dff7; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid #5174db;">🎮 Jeu</button>
        <button id="gmTabLog" class="gm-tab" data-tab="log" style="flex:1; padding:8px 12px; border:none; background:transparent; color:#aaa; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid transparent;">📜 Log Jeu</button>
      </div>
      <div class="gm-content" id="gmContent" style="display:flex; flex:1; gap:0; overflow:hidden;">
        <!-- Colonne de gauche: Table (persistante) -->
        <div id="gmLeftColumn" style="flex:0 0 50%; border-right:1px solid rgba(199,125,255,0.2); overflow:auto; background:rgba(10,10,20,0.8);"></div>
        <!-- Colonne de droite: Contenu de la phase -->
        <div id="gmRightColumn" style="flex:1; overflow:auto; background:rgba(10,10,20,0.8);"></div>
      </div>
      <div class="gm-resize-overlay" id="gmResizeOverlay" title="Glissez pour redimensionner"></div>
    `;
    document.body.appendChild(overlay);
    this.setupOverlayResize(overlay);
    this.setupOverlayDrag(overlay);
    console.log('[GameMaster] Overlay created');
  }

  // ========================================
  // CACHE LOCALSTORAGE - Sauvegarde automatique
  // ========================================
  saveGameStateToCache() {
    try {
      const cacheData = {
        timestamp: new Date().toISOString(),
        state: this.gm.state,
        currentPhase: this.gm.currentPhase,
        gameMode: this.gm.gameMode
      };
      localStorage.setItem('LoupsGarous_GameState', JSON.stringify(cacheData));
      console.log('[Cache] ✓ État sauvegardé en cache');
    } catch (e) {
      console.warn('[Cache] ⚠️ Impossible de sauvegarder en cache:', e);
    }
  }

  restoreGameStateFromCache() {
    try {
      const cached = localStorage.getItem('LoupsGarous_GameState');
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (cacheData.state && this.gm) {
          this.gm.state = cacheData.state;
          this.gm.currentPhase = cacheData.currentPhase || 'CardSelection';
          this.gm.gameMode = cacheData.gameMode || null;
          console.log('[Cache] ✓ État restauré depuis le cache', {
            phase: this.gm.currentPhase,
            joueurs: Object.keys(this.gm.state.players).length,
            timestamp: cacheData.timestamp
          });
        }
      } else {
        console.log('[Cache] Aucune sauvegarde trouvée');
      }
    } catch (e) {
      console.warn('[Cache] ⚠️ Erreur lors de la restauration du cache:', e);
    }
  }

  clearGameStateCache() {
    try {
      localStorage.removeItem('LoupsGarous_GameState');
      console.log('[Cache] ✓ Cache vidé');
    } catch (e) {
      console.warn('[Cache] ⚠️ Impossible de vider le cache:', e);
    }
  }

  attachEventListeners() {
    // Note: Les event listeners pour les boutons du header (Reset, Close, Collapse)
    // sont maintenant attachés via attachWindowsButtonsEvents() appelé depuis attachEventListenersAfterRender()
    // Cela évite les doublons et permet une meilleure séparation des responsabilités

    // Event listeners pour les onglets
    document.getElementById('gmTabGame')?.addEventListener('click', () => {
      this.activeTab = 'game';
      this.updateTabStyles();
      this.render();
    });
    document.getElementById('gmTabLog')?.addEventListener('click', () => {
      this.activeTab = 'log';
      this.updateTabStyles();
      this.render();
    });
  }

  updateTabStyles() {
    const gameTab = document.getElementById('gmTabGame');
    if (gameTab) {
      if (this.activeTab === 'game') {
        gameTab.style.background = 'rgba(81,116,219,0.3)';
        gameTab.style.color = '#81dff7';
        gameTab.style.borderBottom = '2px solid #5174db';
      } else {
        gameTab.style.background = 'transparent';
        gameTab.style.color = '#aaa';
        gameTab.style.borderBottom = '2px solid transparent';
      }
    }
    const logTab = document.getElementById('gmTabLog');
    if (logTab) {
      const on = this.activeTab === 'log';
      logTab.style.background = on ? 'rgba(150,90,200,0.35)' : 'transparent';
      logTab.style.color = on ? '#c79cff' : '#aaa';
      logTab.style.borderBottom = on ? '2px solid #c79cff' : '2px solid transparent';
    }
  }

  // Onglet "Log Jeu" : rend le journal de partie (horodaté) dans le contenu de l'overlay.
  renderJournalTab(gmContent) {
    const j = (this.gm.state && this.gm.state.gameJournal) || [];
    const rows = j.length ? j.map(e => {
      if (e.kind === 'nightsep') return '<div style="margin:12px 0 6px; text-align:center; color:#81dff7; font-weight:800; letter-spacing:1px;">' + e.text + '</div>';
      if (e.kind === 'phase') return '<div style="margin-top:8px; font-weight:800; color:#e0a0ff;"><span style="opacity:.6; font-weight:400; font-size:11px;">' + e.date + ' ' + e.time + '</span> — ' + e.text + '</div>';
      if (e.kind === 'assign') return '<div style="padding-left:16px; color:#bfe9ff; font-size:12px;">' + e.text + '</div>';
      return '<div style="font-size:12px; color:#e8e8f0; padding:1px 0;"><span style="opacity:.55;">' + e.date + ' ' + e.time + '</span> : ' + e.text + '</div>';
    }).join('') : '<div style="opacity:.6;">Journal vide pour l\'instant — il se remplira au fil de la partie.</div>';
    const plain = j.map(e => (e.kind === 'nightsep' ? '\n' + e.text + '\n' : (e.date + ' ' + e.time + ' : ' + e.text))).join('\n');
    gmContent.style.display = 'block';
    gmContent.style.overflow = 'hidden';
    gmContent.innerHTML =
      '<div style="height:100%; display:flex; flex-direction:column;">'
      + '<div style="display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid rgba(199,125,255,0.25);">'
      +   '<span style="font-weight:800; color:#c79cff;">📜 Log Complet de la Partie</span><span style="flex:1;"></span>'
      +   '<button id="gmJournalCopy" style="padding:6px 11px; border:1px solid rgba(255,255,255,0.25); border-radius:6px; background:rgba(90,120,200,0.6); color:#fff; font-weight:700; cursor:pointer;">📋 Copier</button>'
      + '</div>'
      + '<div style="flex:1; overflow:auto; padding:12px 16px; font-family:ui-monospace,Menlo,Consolas,monospace; line-height:1.45;">' + rows + '</div>'
      + '</div>';
    const cp = document.getElementById('gmJournalCopy');
    if (cp) cp.addEventListener('click', () => { try { navigator.clipboard.writeText(plain); cp.textContent = '✅ Copié'; setTimeout(() => { cp.textContent = '📋 Copier'; }, 1500); } catch (_) {} });
  }

  render() {
    const mode = this.gm.state.mode;
    const gmContent = document.getElementById('gmContent');

    console.log(`[GameMasterUI.render] mode=${mode}, gameMode=${this.gm.state.gameMode}, gmContent=${gmContent ? 'exists' : 'MISSING'}`);

    if (!gmContent) {
      console.error('[GameMasterUI.render] gmContent NOT FOUND - cannot render');
      return;
    }

    if (!this.activeTab) this.activeTab = 'game';
    if (this.activeTab === 'log') {
      this.renderJournalTab(gmContent);
      return;
    }

    if (mode === 'selectRoles') {
      // En mode sélection des rôles, afficher en full-width
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      gmContent.innerHTML = renderCardSelection(this);
    } else if (mode === 'deckNames') {
      // Écran: noms du deck (appariement aléatoire cartes <-> prénoms)
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      gmContent.innerHTML = renderDeckNames(this);
    } else if (mode === 'modeSelection') {
      // En mode sélection du mode de jeu, afficher en full-width
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      gmContent.innerHTML = renderModeSelection(this);
    } else if (mode === 'tirageMode') {
      // NEW: Mode sélection du tirage (Aléatoire vs Réel)
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      this.handlePhaseRendering('tirageMode', gmContent);
    } else if (mode === 'revealSequential') {
      // NEW: Mode Aléatoire - Sequential tablet-based role reveal
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      this.handlePhaseRendering('revealSequential', gmContent);
    } else if (mode === 'modeAssiste') {
      // NEW: Mode Réel - Mode Assisté placeholder (En développement)
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      this.handlePhaseRendering('modeAssiste', gmContent);
    } else if (mode === 'firstNightMdj' || mode === 'firstNight') {
      // NEW: Mode MDJ pour la première nuit
      console.log(`[GameMasterUI] FirstNight - mode: ${mode}, gameMode: ${this.gm.state.gameMode}, gameInterface: ${this.gm.state.gameInterface}`);
      // Check if we should use MDJ interface (from Mode Aléatoire)
      if (this.gm.state.gameInterface === 'mdj' || this.gm.state.mdjMode === true) {
        console.log('[GameMasterUI] ✓ Rendering FirstNight-MDJ');
        gmContent.style.display = 'block !important';
        gmContent.style.flexDirection = 'column';
        gmContent.style.overflow = 'auto';
        gmContent.style.padding = '0';
        this.handlePhaseRendering('firstNightMdj', gmContent);
      } else {
        console.log('[GameMasterUI] ✗ GameInterface is not MDJ, showing default');
        // Assisté mode - use old rendering (commented out for now)
        gmContent.innerHTML = '<div style="padding:20px; color:#e8e8f0;">Mode Assisté - À implémenter</div>';
      }
    } else {
      // Mode jeu normal - layout deux colonnes
      // Recréer les colonnes si elles n'existent pas (elles sont supprimées en mode selectRoles)
      let leftColumn = document.getElementById('gmLeftColumn');
      let rightColumn = document.getElementById('gmRightColumn');

      if (!leftColumn || !rightColumn) {
        gmContent.style.display = 'flex';
        gmContent.style.padding = '0';
        gmContent.style.flexDirection = 'row';
        gmContent.style.gap = '0';
        gmContent.style.overflow = 'hidden';
        gmContent.innerHTML = `
          <div id="gmLeftColumn" style="flex:0 0 50%; border-right:1px solid rgba(199,125,255,0.2); overflow:auto; background:rgba(10,10,20,0.8); padding:8px; min-height:200px; display:flex; flex-direction:column; box-sizing:border-box;"></div>
          <div id="gmRightColumn" style="flex:1; overflow:auto; background:rgba(10,10,20,0.8); padding:8px; min-height:200px; display:flex; flex-direction:column; box-sizing:border-box;"></div>
        `;
        leftColumn = document.getElementById('gmLeftColumn');
        rightColumn = document.getElementById('gmRightColumn');
      }

      gmContent.style.display = 'flex';
      gmContent.style.padding = '0';
      gmContent.style.flexDirection = 'row';
      gmContent.style.overflow = 'hidden';

      // Colonne GAUCHE: Table (toujours)
      leftColumn.innerHTML = renderLiveMap(this);

      // Colonne DROITE: Contenu de la phase
      let rightHtml = '';
      if (mode === 'tableSetup') {
        const players = this.gm.state.players || [];
        const tableType = this.gm.state.tableType || 'circle';

        if (tableType === 'circle') {
          // Mode CERCLE: liste simple draggable - ULTRA COMPACT & PRETTY
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C41A'];
          const playersList = players.map((p, idx) => {
            const color = colors[idx % colors.length];
            const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || `J${idx + 1}`;
            return `
              <div class="gm-player-vignette" data-player-id="${p.id}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:3px 2px; background:linear-gradient(135deg, ${color}20, ${color}10); border:1px solid ${color}60; border-radius:5px; margin:1px; cursor:grab; transition:all 0.15s; flex-shrink:0; min-width:58px; text-align:center; box-shadow:0 1px 4px ${color}30; user-select:none;">
                <div style="display:flex; align-items:center; justify-content:center; width:24px; height:24px; background:linear-gradient(135deg, ${color}, ${color}dd); border-radius:50%; font-size:10px; font-weight:700; color:white; line-height:1; box-shadow:inset 0 1px 2px rgba(0,0,0,0.2);">${initials}</div>
                <div style="font-size:7px; font-weight:600; color:#e8e8f0; line-height:1; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name.substring(0, 10)}</div>
                <input type="text" class="gm-player-name-input-place" data-player-id="${p.id}" value="${p.name}" placeholder="Nom..." style="width:100%; padding:0.5px 1px; border:0.5px solid ${color}40; background:rgba(0,0,0,0.6); border-radius:2px; color:#fff; text-align:center; font-size:6.5px; font-weight:500;" onclick="event.stopPropagation();">
              </div>
            `;
          }).join('');
          rightHtml = `
            <div style="display:flex; flex-direction:column; height:100%; padding:0;">
              <h3 style="padding:10px 8px; margin:0; border-bottom:1px solid rgba(199,125,255,0.2); color:#81dff7; font-size:11px; flex-shrink:0;">👥 Glissez pour réorganiser</h3>
              <div id="gmPlayersList" style="flex:1; overflow-y:auto; padding:4px; display:flex; flex-direction:column; gap:0;">
                ${playersList}
              </div>
              <div style="padding:8px 12px; display:flex; gap:12px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(199,125,255,0.2); flex-shrink:0;">
                <button id="gmBtnBackTableSetup" style="background:rgba(100,100,150,0.3); border:1px solid rgba(199,125,255,0.3); padding:8px 14px; border-radius:4px; color:#c1a8ff; font-weight:600; cursor:pointer; font-size:10px;">
                   ← Retour
                </button>
                <div style="flex:1;"></div>
                <button id="gmBtnNextTableSetup" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px 14px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:10px;">
                   Suivant →
                </button>
              </div>
            </div>
          `;
        } else {
          // Mode RECTANGLE: vignettes par zones - toutes dans gmPlayersList pour drag-drop
          const zoneConfig = this.gm.state.zoneConfig || { top: 2, left: 2, right: 2, bottom: 2 };
          let playerIdx = 0;

          const createZoneBlock = (zoneName, zoneLabel, count) => {
            const zonePlayers = players.slice(playerIdx, playerIdx + count);
            playerIdx += count;

            const vignetteHtml = zonePlayers.map((p, idx) => {
              const playerIdx = players.indexOf(p) + 1;
              const shortName = p.name.substring(0, 10);
              return `
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:1px; cursor:grab; transition:all 0.2s; flex-shrink:0; user-select:none; line-height:1.1; min-width:50px; text-align:center;" title="${p.name}">
                  <div style="font-weight:700; color:#81dff7; line-height:1; font-size:8px;">J${playerIdx}</div>
                  <div style="color:#e8e8f0; font-size:7px; word-break:break-word; width:100%;">${shortName}</div>
                </div>
              `;
            }).join('');

            return `
              <div class="gm-zone-block" data-zone="${zoneName}" style="flex:1; border:1px solid rgba(199,125,255,0.2); border-radius:2px; padding:4px 3px; margin:2px; background:rgba(50,50,100,0.2); min-height:50px; display:flex; flex-direction:column;">
                <div style="font-size:7px; color:#81dff7; font-weight:600; margin-bottom:2px; padding-bottom:1px; border-bottom:0.5px solid rgba(199,125,255,0.15); flex-shrink:0;">
                  ${zoneLabel} (${count})
                </div>
                <div class="gm-zone-vignettes" data-zone="${zoneName}" style="display:grid; grid-template-columns:repeat(${Math.min(2, Math.ceil(count / 2))}, 1fr); gap:0px; flex:1; overflow:hidden;">
                  ${vignetteHtml}
                </div>
              </div>
            `;
          };

          // Créer les blocs de zones avec layout correct
          const topPlayers = players.slice(0, zoneConfig.top);
          const leftPlayers = players.slice(zoneConfig.top, zoneConfig.top + zoneConfig.left);
          const rightPlayers = players.slice(zoneConfig.top + zoneConfig.left, zoneConfig.top + zoneConfig.left + zoneConfig.right);
          const bottomPlayers = players.slice(zoneConfig.top + zoneConfig.left + zoneConfig.right);

          const createHorizontalZone = (zoneName, zoneLabel, zonePlayers) => {
            const html = zonePlayers.map((p, idx) => {
              const playerIdx = players.indexOf(p) + 1;
              const shortName = p.name.substring(0, 10);
              return `
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:0; cursor:grab; user-select:none; line-height:1.1; flex-shrink:0; text-align:center;" title="${p.name}">
                  <div style="font-weight:700; color:#81dff7; line-height:1; font-size:8px;">J${playerIdx}</div>
                  <div style="color:#e8e8f0; font-size:7px; word-break:break-word;">${shortName}</div>
                </div>
              `;
            }).join('');
            return `
              <div class="gm-zone-block" style="padding:3px; margin:2px; background:rgba(50,50,100,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:2px;">
                <div style="font-size:7px; color:#81dff7; font-weight:600; margin-bottom:1px;">
                  ${zoneLabel} (${zonePlayers.length})
                </div>
                <div class="gm-zone-vignettes" data-zone="${zoneName}" style="display:flex; gap:0px; height:45px; align-items:center;">
                  ${html}
                </div>
              </div>
            `;
          };

          const createVerticalZone = (zoneName, zoneLabel, zonePlayers) => {
            const html = zonePlayers.map((p, idx) => {
              const playerIdx = players.indexOf(p) + 1;
              const shortName = p.name.substring(0, 10);
              return `
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:1px; cursor:grab; transition:all 0.2s; flex-shrink:0; user-select:none; line-height:1.1; text-align:center;" title="${p.name}">
                  <div style="font-weight:700; color:#81dff7; line-height:1; font-size:8px;">J${playerIdx}</div>
                  <div style="color:#e8e8f0; font-size:7px; word-break:break-word;">${shortName}</div>
                </div>
              `;
            }).join('');
            return `
              <div class="gm-zone-block" style="flex:1; padding:4px 3px; margin:2px; background:rgba(50,50,100,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:2px; display:flex; flex-direction:column;">
                <div style="font-size:7px; color:#81dff7; font-weight:600; margin-bottom:2px; flex-shrink:0;">
                  ${zoneLabel} (${zonePlayers.length})
                </div>
                <div class="gm-zone-vignettes" data-zone="${zoneName}" style="display:flex; flex-direction:column; gap:1px; flex:1;">
                  ${html}
                </div>
              </div>
            `;
          };

          const topBlock = createHorizontalZone('top', '▲ Haut', topPlayers);
          const leftBlock = createVerticalZone('left', '◀ Gauche', leftPlayers);
          const rightBlock = createVerticalZone('right', '▶ Droite', rightPlayers);
          const bottomBlock = createHorizontalZone('bottom', '▼ Bas', bottomPlayers);

          rightHtml = `
            <div style="display:flex; flex-direction:column; height:100%; padding:0;">
              <h3 style="padding:8px; margin:0; border-bottom:1px solid rgba(199,125,255,0.2); color:#81dff7; font-size:10px; flex-shrink:0;">👥 Zones</h3>
              <div id="gmPlayersList" style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
                ${topBlock}
                <div style="display:flex; gap:0; flex:1; min-height:0;">
                  ${leftBlock}
                  ${rightBlock}
                </div>
                ${bottomBlock}
              </div>
              <div style="padding:8px 12px; display:flex; gap:12px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(199,125,255,0.2); flex-shrink:0;">
                <button id="gmBtnBackTableSetup" style="background:rgba(100,100,150,0.3); border:1px solid rgba(199,125,255,0.3); padding:8px 14px; border-radius:4px; color:#c1a8ff; font-weight:600; cursor:pointer; font-size:10px;">
                   ← Retour
                </button>
                <div style="flex:1;"></div>
                <button id="gmBtnNextTableSetup" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px 14px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:10px;">
                   Suivant →
                </button>
              </div>
            </div>
          `;
        }

      } else if (mode === 'assignRoles') {
        rightHtml = renderRoleDetailandTips(this);
      } else if (mode === 'night') {
        // Check if MDJ mode (from Mode Aléatoire)
        if (this.gm.state.gameInterface === 'mdj' || this.gm.state.mdjMode === true) {
          gmContent.style.display = 'block !important';
          gmContent.style.flexDirection = 'column';
          gmContent.style.overflow = 'auto';
          gmContent.style.padding = '0';
          this.handlePhaseRendering('nightMdj', gmContent);
          return; // Don't use rightHtml, MDJ renders full screen
        }
        rightHtml = renderNightPhase(this);
      } else if (mode === 'mayorElection') {
        rightHtml = renderMayorElectionPhase(this);
      } else if (mode === 'day1' || mode === 'day') {
        rightHtml = renderDayPhase(this);
      } else if (mode === 'gameRunning') {
        rightHtml = '<div style="padding:20px; color:#e8e8f0; text-align:center;">Jeu en cours...</div>';
      }
      rightColumn.innerHTML = rightHtml;
    }

    // Attacher les événements des contrôles flèches pour mode tableSetup
    if (mode === 'tableSetup') {
      this.attachPlayerControlEvents();
      this.attachTableSetupFooterEvents();
    }

    this.attachEventListenersAfterRender();
  }

  attachPlayerControlEvents() {
    const gm = this.gm;
    const self = this;
    const playersList = document.getElementById('gmPlayersList');
    if (!playersList) return;

    // --- Edition des noms (live + sauvegarde) ---
    playersList.querySelectorAll('.gm-player-vignette').forEach(vignette => {
      const playerId = vignette.dataset.playerId;
      const nameInput = vignette.querySelector('.gm-player-name-input-place');
      if (!nameInput) return;
      nameInput.addEventListener('input', (e) => {
        const player = gm.state.players.find(p => p.id === playerId);
        if (!player) return;
        player.name = e.target.value;
        const nameEl = document.querySelector(`.gm-player-point[data-player-id="${playerId}"] .gm-point-name`);
        if (nameEl) nameEl.textContent = e.target.value;
      });
      nameInput.addEventListener('blur', () => { gm.saveState(); self.saveGameStateToCache(); });
    });

    // --- Reordonnancement par glisser (Pointer Events robustes + map temps reel) ---
    let dragEl = null, startX = 0, startY = 0, active = false, rafPending = false;
    const THRESH = 6;

    const renumber = () => {
      playersList.querySelectorAll('.gm-player-vignette').forEach((v, i) => {
        const lbl = v.querySelector('div:first-child');
        if (lbl && /^J\s*\d+/.test((lbl.textContent || '').trim())) lbl.textContent = `J${i + 1}`;
      });
    };

    const containerUnder = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      return el.closest('.gm-zone-vignettes') || (el.closest('#gmPlayersList') ? playersList : null);
    };

    // Met a jour la map (colonne gauche) en direct selon l'ordre courant du DOM
    const liveSyncMap = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        const list = document.getElementById('gmPlayersList');
        if (!list) return;
        const ids = [...list.querySelectorAll('.gm-player-vignette')].map(v => v.dataset.playerId);
        const byId = new Map(gm.state.players.map(p => [p.id, p]));
        const order = ids.map(id => byId.get(id)).filter(Boolean);
        gm.state.players.forEach(p => { if (!ids.includes(p.id)) order.push(p); });
        gm.state.players = order;
        if ((gm.state.tableType || 'circle') === 'circle' && typeof self.recalculateCirclePositions === 'function') {
          self.recalculateCirclePositions(gm.state.players);
        }
        const left = document.getElementById('gmLeftColumn');
        if (left) left.innerHTML = renderLiveMap(self);
      });
    };

    const onMove = (e) => {
      if (!dragEl) return;
      const x = e.clientX, y = e.clientY;
      if (!active) {
        if (Math.hypot(x - startX, y - startY) < THRESH) return;
        active = true;
        dragEl.style.pointerEvents = 'none';
        dragEl.style.opacity = '0.6';
        dragEl.style.transform = 'scale(1.06)';
        dragEl.style.boxShadow = '0 6px 16px rgba(129,223,247,0.55)';
        dragEl.style.zIndex = '1000';
      }
      e.preventDefault();
      const container = containerUnder(x, y) || dragEl.parentNode;
      const zone = container && container.dataset ? container.dataset.zone : null;
      const horizontal = zone === 'top' || zone === 'bottom';
      const siblings = [...container.querySelectorAll('.gm-player-vignette')].filter(v => v !== dragEl);
      let before = null;
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect();
        const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
        const pos = horizontal ? x : y;
        if (pos < mid) { before = sib; break; }
      }
      if (before) container.insertBefore(dragEl, before);
      else container.appendChild(dragEl);
      renumber();
      liveSyncMap();
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (!dragEl) return;
      const wasActive = active;
      dragEl.style.pointerEvents = ''; dragEl.style.opacity = ''; dragEl.style.transform = ''; dragEl.style.boxShadow = ''; dragEl.style.zIndex = '';
      dragEl = null; active = false;
      if (wasActive) self.commitTableOrder();
    };

    playersList.querySelectorAll('.gm-player-vignette').forEach(vignette => {
      vignette.style.touchAction = 'none';
      vignette.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.gm-player-name-input-place')) return; // laisser editer le nom
        dragEl = vignette; startX = e.clientX; startY = e.clientY; active = false;
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
      });
    });
  }

  /**
   * Commit du nouvel ordre apres un glisser: lit l'ordre DOM des vignettes,
   * reconstruit gm.state.players (et zoneConfig en mode zones), puis re-render.
   */
  commitTableOrder() {
    const gm = this.gm;
    const playersList = document.getElementById('gmPlayersList');
    if (!playersList) return;
    const ids = [...playersList.querySelectorAll('.gm-player-vignette')].map(v => v.dataset.playerId);
    const byId = new Map(gm.state.players.map(p => [p.id, p]));
    const newOrder = ids.map(id => byId.get(id)).filter(Boolean);
    gm.state.players.forEach(p => { if (!ids.includes(p.id)) newOrder.push(p); });
    gm.state.players = newOrder;

    // Mode zones: recalculer zoneConfig depuis le DOM
    const zoneEls = playersList.querySelectorAll('.gm-zone-vignettes');
    if (zoneEls.length) {
      const cfg = { top: 0, left: 0, right: 0, bottom: 0 };
      zoneEls.forEach(z => { const zn = z.dataset.zone; if (zn in cfg) cfg[zn] = z.querySelectorAll('.gm-player-vignette').length; });
      gm.state.zoneConfig = cfg;
    } else if (typeof this.recalculateCirclePositions === 'function') {
      // Mode cercle: recalculer les positions de la map de setup selon le nouvel ordre
      this.recalculateCirclePositions(gm.state.players);
    }

    gm.saveState();
    this.saveGameStateToCache();
    this.render();
  }

  attachTableSetupFooterEvents() {
    const gm = this.gm;

    // Bouton "Suivant" - Aller à la sélection du mode de jeu (Aléatoire vs Réel)
    document.getElementById('gmBtnNextTableSetup')?.addEventListener('click', () => {
      console.log('[TableSetup] Proceeding to TirageMode (Aléatoire vs Réel selection)');
      gm.state.mode = 'tirageMode';
      gm.saveState();
      this.render();
    });

    // Bouton "Retour" - Aller à la sélection des rôles
    document.getElementById('gmBtnBackTableSetup')?.addEventListener('click', () => {
      console.log('[TableSetup] Back to role selection');
      gm.state.mode = 'selectRoles';
      gm.state.players = [];
      gm.state.selectedRoles = {};
      gm.saveState();
      this.render();
    });
  }

  recalculateCirclePositions(players) {
    const gm = this.gm;
    const tableType = gm.state.tableType || 'circle';

    if (tableType === 'circle') {
      // Générer les positions pour la table ronde
      const result = this.generatePositionsByTableType(players.length, 'circle');
      const defaultPositions = result.positions;
      const tableCenter = result.center;
      const scale = 240 / 300;
      const containerCenter = 120;

      // Appliquer les positions aux joueurs
      players.forEach((p, idx) => {
        if (defaultPositions[idx]) {
          const posX = defaultPositions[idx].x - tableCenter.x;
          const posY = defaultPositions[idx].y - tableCenter.y;
          p.tableX = containerCenter + (posX * scale);
          p.tableY = containerCenter + (posY * scale);
        }
      });

      // Mettre à jour playerPositions pour SAVANT_FOU
      if (!gm.state.playerPositions) {
        gm.state.playerPositions = {};
      }
      players.forEach((p, idx) => {
        gm.state.playerPositions[p.id] = {
          x: p.tableX,
          y: p.tableY,
          circleIndex: idx,
          totalPlayers: players.length
        };
      });
    } else {
      // Pour les tables rectangulaires, les positions seront recalculées dans renderLiveMap
      // basées sur la configuration des zones (gm.state.zoneConfig)
      // Les joueurs seront repositionnés selon leur ordre dans players[]
    }
  }

  _removedRenderJournal() {
    // Journal tab removed — method kept as tombstone to avoid merge conflicts
    const players = this.gm.state.players || [];
    const selectedRoles = this.gm.state.selectedRoles || {};
    const gameLog = this.gm.state.gameLog || [];

    // Créer le mapping des rôles des joueurs
    const playerRoles = {};
    players.forEach(p => {
      if (p.roleId) {
        playerRoles[p.id] = p.roleId;
      }
    });

    // Construire le contenu du journal avec 2 colonnes
    const journalHtml = `
      <div style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
        <div style="padding:16px; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); flex:0 0 auto;">
          <h2 style="margin:0; color:#e8e8f0; font-size:16px;">📖 Journal de Partie</h2>
        </div>
        <div style="flex:1; display:flex; gap:8px; padding:8px; overflow:hidden;">
          <!-- GAUCHE: JOUEURS (compact) -->
          <div style="flex:0 0 220px; background:rgba(100,150,255,0.1); border:1px solid rgba(100,150,255,0.3); border-radius:6px; padding:12px; overflow-y:auto; display:flex; flex-direction:column;">
            <h3 style="margin:0 0 12px 0; color:#81dff7; font-size:11px; font-weight:600; flex:0 0 auto;">👥 JOUEURS</h3>
            <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
              ${players.map((p, idx) => {
                const role = playerRoles[p.id] ? `<span style="color:#66d999; font-size:8px;">${playerRoles[p.id]}</span>` : '<span style="color:#aaa; font-size:8px;">?</span>';
                return `
                  <div style="font-size:9px; color:#e8e8f0; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; display:flex; justify-content:space-between; align-items:center;">
                    <strong style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis;">${p.name}</strong>
                    <span style="flex:0 0 auto; margin-left:4px;">${role}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- DROITE: LOG (scrollable) -->
          <div style="flex:1; background:rgba(150,100,255,0.1); border:1px solid rgba(150,100,255,0.3); border-radius:6px; padding:12px; display:flex; flex-direction:column; min-width:0;">
            <h3 style="margin:0 0 12px 0; color:#c77dff; font-size:11px; font-weight:600; flex:0 0 auto;">⚔️ ÉVÉNEMENTS</h3>
            <div id="gmLogScroll" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; user-select:text;">
              ${gameLog.length > 0 ? gameLog.map((event, idx) => {
                // Support ancien et nouveau format de logs
                const displayText = event.displayText || event.text || `${event.turn || 'Nuit 1'} - ${event.message || ''}`;
                const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('fr-FR') : '';
                const bgColor = event.type === 'welcome' ? 'rgba(102, 217, 153, 0.1)' : 'rgba(0,0,0,0.3)';
                const borderColor = event.type === 'welcome' ? '#66d999' : '#c77dff';

                return `
                  <div style="font-size:9px; color:#ddd; padding:8px; background:${bgColor}; border-left:2px solid ${borderColor}; border-radius:2px; flex:0 0 auto; user-select:text;">
                    <div style="color:#aaa; font-size:8px; margin-bottom:2px; user-select:text;">${timestamp}</div>
                    <span style="color:#e8e8f0; user-select:text;">${displayText}</span>
                  </div>
                `;
              }).join('') : `
                <div style="font-size:11px; color:#aaa; text-align:center; padding:16px;">
                  📝 Aucun événement enregistré pour le moment
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    return journalHtml;
  }

  attachEventListenersAfterRender() {
    const mode = this.gm.state.mode;

    // Attacher les événements du WindowsButtons (header)
    attachWindowsButtonsEvents(this);

    if (mode === 'selectRoles') {
      attachCardSelectionEvents(this);
    } else if (mode === 'deckNames') {
      attachDeckNamesEvents(this);
    } else if (mode === 'modeSelection') {
      attachModeSelectionEvents(this);
    } else if (mode === 'tableSetup') {
      // En mode tableSetup, on attache les événements SAUF le drag-drop de la map
      // Les vignettes à droite prennent le contrôle de la réorganisation
      attachLiveMapEvents(this, true); // true = skip dragdrop
    } else if (mode === 'assignRoles') {
      // En mode assignRoles, pas de drag-drop de la map
      attachLiveMapEvents(this, true); // true = skip dragdrop
      // IMPORTANT: Attacher les événements d'assignation des rôles!
      attachRoleDetailandTipsEvents(this);
      if ((this.gm.state.nightStep || 1) === 2) {
        attachRoleActionsEvents(this);
      }
    } else {
      // Pour tous les autres modes: attacher les événements de la table (gauche) + la phase (droite)
      // La table reste toujours interactive et draggable
      attachLiveMapEvents(this);

      // Puis attacher les événements spécifiques de la phase à droite
      if (mode === 'night') {
        attachNightPhaseEvents(this);
      } else if (mode === 'mayorElection') {
        attachMayorElectionPhaseEvents(this);
      } else if (mode === 'day1' || mode === 'day') {
        attachDayPhaseEvents(this);
      }
    }
  }

  generatePositionsByTableType(playerCount, tableType) {
    const center = { x: 150, y: 150 };
    const positions = [];

    switch (tableType) {
      case 'circle':
        // Circle: intelligent radius calculation
        // Table is circular with radius ~70. Players must be outside with good spacing.
        // Radius grows significantly with player count for 40px bubbles (no overlap)
        // J1 is always at the top (angle = -π/2)
        {
          const minRadius = 115; // much larger to avoid bubble overlap
          const maxRadius = 148; // increased max bounds
          const radiusGrowth = Math.max(0, (playerCount - 3) * 1.8); // strong growth factor
          const radius = Math.min(maxRadius, minRadius + radiusGrowth);

          for (let i = 0; i < playerCount; i++) {
            const angle = (i / playerCount) * Math.PI * 2 - Math.PI / 2; // -π/2 to start at top
            positions.push({
              x: center.x + Math.cos(angle) * radius,
              y: center.y + Math.sin(angle) * radius
            });
          }
        }
        break;

      case 'oval-v':
        // Oval vertical: intelligent ellipse dimensions
        // Table is ~100x180. Much larger spacing for 40px bubbles (no overlap).
        {
          const tableRx = 50;
          const tableRy = 90;
          const bufferX = 55; // much larger for no overlap
          const bufferY = 65; // much larger for no overlap
          const rx = Math.min(148, tableRx + bufferX);
          const ry = Math.min(148, tableRy + bufferY);

          for (let i = 0; i < playerCount; i++) {
            const angle = (i / playerCount) * Math.PI * 2;
            positions.push({
              x: center.x + Math.cos(angle) * rx,
              y: center.y + Math.sin(angle) * ry
            });
          }
        }
        break;

      case 'rect-v':
        // Rect vertical: intelligent rectangle dimensions
        // Table is ~80x200. Much larger spacing for 40px bubbles (no overlap).
        {
          const tableW = 40; // half of 80
          const tableH = 100; // half of 200
          const bufferW = 75; // much larger for no overlap
          const bufferH = 70; // much larger for no overlap
          const w = Math.min(148, tableW + bufferW);
          const h = Math.min(148, tableH + bufferH);

          const sides = [
            { sx: -w, sy: -h, ex: w, ey: -h },  // top
            { sx: w, sy: -h, ex: w, ey: h },    // right
            { sx: w, sy: h, ex: -w, ey: h },    // bottom
            { sx: -w, sy: h, ex: -w, ey: -h }   // left
          ];

          const playersPerSide = Math.ceil(playerCount / 4);
          let playerIdx = 0;

          for (const side of sides) {
            for (let i = 0; i < playersPerSide && playerIdx < playerCount; i++) {
              const t = (i + 1) / (playersPerSide + 1);
              positions.push({
                x: center.x + side.sx + (side.ex - side.sx) * t,
                y: center.y + side.sy + (side.ey - side.sy) * t
              });
              playerIdx++;
            }
          }
        }
        break;

      case 'square':
        // Square: intelligent square dimensions
        // Table is ~140x140. Much larger spacing for 40px bubbles (no overlap).
        {
          const tableS = 70;
          const buffer = 70; // much larger for no overlap
          const s = Math.min(148, tableS + buffer);

          const sides = [
            { sx: -s, sy: -s, ex: s, ey: -s },  // top
            { sx: s, sy: -s, ex: s, ey: s },    // right
            { sx: s, sy: s, ex: -s, ey: s },    // bottom
            { sx: -s, sy: s, ex: -s, ey: -s }   // left
          ];

          const playersPerSide = Math.ceil(playerCount / 4);
          let playerIdx = 0;

          for (const side of sides) {
            for (let i = 0; i < playersPerSide && playerIdx < playerCount; i++) {
              const t = (i + 1) / (playersPerSide + 1);
              positions.push({
                x: center.x + side.sx + (side.ex - side.sx) * t,
                y: center.y + side.sy + (side.ey - side.sy) * t
              });
              playerIdx++;
            }
          }
        }
        break;

      default:
        for (let i = 0; i < playerCount; i++) {
          const angle = (i / playerCount) * Math.PI * 2;
          positions.push({
            x: center.x + Math.cos(angle) * 120,
            y: center.y + Math.sin(angle) * 120
          });
        }
    }

    return { positions, center };
  }

  setupOverlayResize(overlay) {
    const resizeHandle = document.getElementById('gmResizeOverlay');
    if (!resizeHandle) return;

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const startResize = (clientX, clientY) => {
      isResizing = true;
      startX = clientX;
      startY = clientY;
      startWidth = overlay.offsetWidth;
      startHeight = overlay.offsetHeight;
      overlay.style.userSelect = 'none';
      resizeHandle.style.opacity = '0.8';
    };

    const doResize = (clientX, clientY) => {
      if (isResizing) {
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        const maxW = Math.max(300, window.innerWidth - overlay.offsetLeft - 4);
        const maxH = Math.max(200, window.innerHeight - overlay.offsetTop - 4);
        const newWidth = Math.min(Math.max(300, startWidth + deltaX), maxW);
        const newHeight = Math.min(Math.max(200, startHeight + deltaY), maxH);

        overlay.style.width = newWidth + 'px';
        overlay.style.height = newHeight + 'px';
      }
    };

    const endResize = () => {
      isResizing = false;
      overlay.style.userSelect = 'auto';
      resizeHandle.style.opacity = '0.3';
    };

    // SOURIS
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startResize(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      doResize(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
      endResize();
    });

    // TACTILE
    resizeHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startResize(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (isResizing) {
        const touch = e.touches[0];
        doResize(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      endResize();
    }, { passive: true });
  }

  setupOverlayDrag(overlay) {
    const header = document.getElementById('gmHeader');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Fonction helper pour démarrer le drag
    const startDrag = (clientX, clientY) => {
      isDragging = true;
      offsetX = clientX - overlay.offsetLeft;
      offsetY = clientY - overlay.offsetTop;
    };

    // Fonction helper pour faire le drag
    const moveDrag = (clientX, clientY) => {
      if (isDragging) {
        let nl = clientX - offsetX, nt = clientY - offsetY;
        const w = overlay.offsetWidth, h = overlay.offsetHeight;
        const maxL = Math.max(0, window.innerWidth - w);
        const maxT = Math.max(0, window.innerHeight - h);
        nl = Math.max(0, Math.min(nl, maxL));
        nt = Math.max(0, Math.min(nt, maxT));
        overlay.style.left = nl + 'px';
        overlay.style.top = nt + 'px';
        overlay.style.bottom = 'auto';
      }
    };

    // Fonction helper pour terminer le drag
    const endDrag = () => {
      isDragging = false;
    };

    // Support SOURIS
    header.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      moveDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
      endDrag();
    });

    // Support TACTILE (téléphone)
    header.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      endDrag();
    }, { passive: true });
  }

  toggleMinimized() {
    const overlay = document.getElementById('gameMasterOverlay');
    const content = document.getElementById('gmContent');
    const tabs = document.getElementById('gmTabs');
    const header = document.getElementById('gmHeader');
    const collapseBtn = document.getElementById('gmBtnCollapse');
    // Boutons d'en-tête masqués en mode réduit (on ne garde que titre + agrandir + fermer)
    const miniHideIds = ['gmChrono', 'gmBtnReset', 'gmBtnRefresh', 'gmBtnLog'];
    const title = header ? header.querySelector('.gm-title') : null;

    if (!this.minimized) {
      // Mémorise la position + taille AVANT de réduire (pour les restaurer ensuite)
      this._restoreBox = {
        width: overlay.style.width || (overlay.offsetWidth + 'px'),
        height: overlay.style.height || (overlay.offsetHeight + 'px'),
        left: overlay.style.left || (overlay.offsetLeft + 'px'),
        top: overlay.style.top || (overlay.offsetTop + 'px')
      };
      this.minimized = true;
      // Réduit SUR PLACE en une simple barre
      overlay.style.height = 'auto';
      overlay.style.width = '260px';
      overlay.style.bottom = 'auto';
      if (content) content.style.display = 'none';
      if (tabs) tabs.style.display = 'none';
      const rz = document.getElementById('gmResizeOverlay');
      if (rz) rz.style.display = 'none';
      overlay.style.borderRadius = '8px';
      if (header) { header.style.borderRadius = '8px'; header.style.padding = '6px 10px'; }
      miniHideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      if (title) { this._savedTitle = title.textContent; title.textContent = 'Interface de jeu MDJ'; }
      if (collapseBtn) { collapseBtn.textContent = '▢'; collapseBtn.title = 'Agrandir'; }
      // Garde la barre dans la zone visible
      const maxL = Math.max(0, window.innerWidth - overlay.offsetWidth);
      const maxT = Math.max(0, window.innerHeight - overlay.offsetHeight);
      overlay.style.left = Math.max(0, Math.min(overlay.offsetLeft, maxL)) + 'px';
      overlay.style.top = Math.max(0, Math.min(overlay.offsetTop, maxT)) + 'px';
    } else {
      this.minimized = false;
      const b = this._restoreBox || { width: '650px', height: '620px', left: '320px', top: '100px' };
      overlay.style.width = b.width;
      overlay.style.height = b.height;
      overlay.style.left = b.left;
      overlay.style.top = b.top;
      overlay.style.bottom = 'auto';
      if (tabs) tabs.style.display = 'flex';
      const rz = document.getElementById('gmResizeOverlay');
      if (rz) rz.style.display = '';
      overlay.style.borderRadius = '8px';
      if (header) { header.style.borderRadius = '8px 8px 0 0'; header.style.padding = '12px 16px'; }
      miniHideIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; });
      if (title && this._savedTitle) title.textContent = this._savedTitle;
      if (collapseBtn) { collapseBtn.textContent = '−'; collapseBtn.title = 'Réduire'; }
      if (content) content.style.display = '';
      this.render();
    }
  }

  close() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  show() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      overlay.style.display = 'block';
    }
  }

  /**
   * Handle phase rendering for new MDJ mode phases
   * @param {string} phaseName - Name of the phase
   * @param {HTMLElement} container - Container to render into
   */
  handlePhaseRendering(phaseName, container) {
    switch (phaseName) {
      case 'tirageMode':
        if (!window.TirageMode) {
          console.error('[GameMasterUI] TirageMode class not loaded');
          container.innerHTML = '<div style="padding:20px; color:red;">Erreur: TirageMode non chargé</div>';
          return;
        }
        // Create TirageMode instance - pass container
        const tiragePhase = new TirageMode(this.gm, container);
        tiragePhase.init();
        break;

      case 'firstNightMdj':
        if (!window.FirstNightMDJ) {
          console.error('[GameMasterUI] FirstNightMDJ class not loaded');
          container.innerHTML = '<div style="padding:20px; color:red;">Erreur: FirstNightMDJ non chargé</div>';
          return;
        }
        // Create FirstNightMDJ instance - pass container
        const mdjPhase = new FirstNightMDJ(this.gm, container);
        mdjPhase.init();
        break;

      case 'nightMdj':
        if (!window.NightMDJ) {
          console.error('[GameMasterUI] NightMDJ class not loaded');
          container.innerHTML = '<div style="padding:20px; color:red;">Erreur: NightMDJ non chargé</div>';
          return;
        }
        // Create NightMDJ instance - pass container
        const nightMdjPhase = new NightMDJ(this.gm, container);
        nightMdjPhase.init();
        break;

      case 'revealSequential':
        if (!window.RevealSequential) {
          console.error('[GameMasterUI] RevealSequential class not loaded');
          container.innerHTML = '<div style="padding:20px; color:red;">Erreur: RevealSequential non chargé</div>';
          return;
        }
        // Create RevealSequential instance - Mode Aléatoire tablet reveal
        const revealPhase = new RevealSequential(this.gm, container);
        revealPhase.init();
        break;

      case 'modeAssiste':
        if (!window.ModeAssiste) {
          console.error('[GameMasterUI] ModeAssiste class not loaded');
          container.innerHTML = '<div style="padding:20px; color:red;">Erreur: ModeAssiste non chargé</div>';
          return;
        }
        // Create ModeAssiste instance - placeholder for Mode Réel
        const assistePhase = new ModeAssiste(this.gm, container);
        assistePhase.init();
        break;

      default:
        console.warn(`[GameMasterUI] Unknown phase: ${phaseName}`);
        container.innerHTML = `<div style="padding:20px; color:#aaa;">Phase inconnue: ${phaseName}</div>`;
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.GameMasterUI = GameMasterUI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameMasterUI;
}
