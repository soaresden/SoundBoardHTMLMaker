// ========================================
// GAME MASTER UI - Interface & Rendering
// ========================================

class GameMasterUI {
  constructor(gameMaster) {
    this.gm = gameMaster;
    this.collapsed = false;
    this.minimized = false;
    this.activeTab = 'game'; // 'game' ou 'journal'
    console.log('[GameMaster UI] Constructor called');

    this.roleToCardFile = {
      'Villageois_Villageois': 'Villageois_Villageois',
      'Voyante': 'Voyante',
      'Chasseur': 'Chasseur',
      'Sorcière': 'Sorciere',
      'Cupidon': 'Cupidon',
      'Petite_Fille': 'Petite_Fille',
      'Ancien': 'Ancien',
      'Bouc_Emissaire': 'Bouc_Emissaire',
      'Corbeau': 'Corbeau',
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
      'Necromancien': 'Necromancien',
    };

    this.init();
  }

  getCardFile(roleId) {
    if (this.roleToCardFile[roleId]) {
      return this.roleToCardFile[roleId];
    }
    return roleId.normalize('NFD').replace(/[-]/g, '').replace(/[\s-]/g, '_');
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
    overlay.innerHTML = `
      <div class="gm-header" id="gmHeader" style="cursor:move;">
        <div class="gm-title">🐺 Maître du Jeu</div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button id="gmBtnReset" title="Réinitialiser la partie" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(220,100,100,0.3); border-radius:3px; color:#ff6b6b; font-size:12px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">↻</button>
          <button id="gmBtnCollapse" title="Réduire/Maximiser" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(100,150,255,0.3); border-radius:3px; color:#6699ff; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">−</button>
          <button id="gmBtnClose" title="Fermer" style="width:24px; height:24px; padding:0; border:1px solid rgba(199,125,255,0.4); background:rgba(200,100,200,0.3); border-radius:3px; color:#dd77ff; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>
      </div>
      <div class="gm-tabs" id="gmTabs" style="display:flex; gap:0; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(199,125,255,0.2);">
        <button id="gmTabGame" class="gm-tab" data-tab="game" style="flex:1; padding:8px 12px; border:none; background:rgba(81,116,219,0.3); color:#81dff7; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid #5174db;">🎮 Jeu</button>
        <button id="gmTabJournal" class="gm-tab" data-tab="journal" style="flex:1; padding:8px 12px; border:none; background:transparent; color:#aaa; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid transparent;">📖 Journal</button>
      </div>
      <div class="gm-content" id="gmContent"></div>
      <div class="gm-resize-overlay" id="gmResizeOverlay" title="Glissez pour redimensionner"></div>
    `;
    document.body.appendChild(overlay);
    this.setupOverlayResize(overlay);
    this.setupOverlayDrag(overlay);
    console.log('[GameMaster] Overlay created');
  }

  attachEventListeners() {
    document.getElementById('gmBtnReset')?.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr? Cela réinitialisera le jeu.')) {
        this.gm.resetState();
        this.gm.state.mode = 'selectRoles';
        this.gm.saveState();
        this.render();
      }
    });
    document.getElementById('gmBtnClose')?.addEventListener('click', () => this.close());
    document.getElementById('gmBtnCollapse')?.addEventListener('click', () => this.toggleMinimized());

    // Event listeners pour les onglets
    document.getElementById('gmTabGame')?.addEventListener('click', () => {
      this.activeTab = 'game';
      this.updateTabStyles();
      this.render();
    });
    document.getElementById('gmTabJournal')?.addEventListener('click', () => {
      this.activeTab = 'journal';
      this.updateTabStyles();
      this.render();
    });
  }

  updateTabStyles() {
    const gameTab = document.getElementById('gmTabGame');
    const journalTab = document.getElementById('gmTabJournal');

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

    if (journalTab) {
      if (this.activeTab === 'journal') {
        journalTab.style.background = 'rgba(199,125,255,0.2)';
        journalTab.style.color = '#c77dff';
        journalTab.style.borderBottom = '2px solid #c77dff';
      } else {
        journalTab.style.background = 'transparent';
        journalTab.style.color = '#aaa';
        journalTab.style.borderBottom = '2px solid transparent';
      }
    }
  }

  render() {
    const mode = this.gm.state.mode;
    const content = document.getElementById('gmContent');
    if (!content) return;

    let html = '';

    // Afficher le journal si l'onglet journal est actif
    if (this.activeTab === 'journal') {
      html = this.renderJournal();
    } else {
      // Afficher le jeu normal
      if (mode === 'selectRoles') {
        html = renderChooseCard(this);
      } else if (mode === 'tableSetup') {
        html = renderTableAndRename(this);
      } else if (mode === 'assignRoles') {
        html = renderFirstNight(this);
      } else if (mode === 'gameRunning') {
        html = '<div style="padding:20px; color:#e8e8f0; text-align:center;">Jeu en cours...</div>';
      }
    }

    content.innerHTML = html;
    this.attachEventListenersAfterRender();
  }

  renderJournal() {
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

    // Construire le contenu du journal
    const journalHtml = `
      <div style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
        <div style="padding:16px; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); flex:0 0 auto;">
          <h2 style="margin:0; color:#e8e8f0; font-size:16px;">📖 Journal de Partie</h2>
        </div>
        <div style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
          <!-- SECTION: JOUEURS ET RÔLES -->
          <div style="background:rgba(100,150,255,0.1); border:1px solid rgba(100,150,255,0.3); border-radius:6px; padding:12px;">
            <h3 style="margin:0 0 12px 0; color:#81dff7; font-size:12px; font-weight:600;">👥 JOUEURS</h3>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
              ${players.map((p, idx) => {
                const role = playerRoles[p.id] ? `<span style="color:#66d999;">${playerRoles[p.id]}</span>` : '<span style="color:#aaa;">?</span>';
                return `
                  <div style="font-size:10px; color:#e8e8f0; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px;">
                    <strong>${p.name}</strong> → ${role}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- SECTION: ÉVÉNEMENTS -->
          <div style="background:rgba(150,100,255,0.1); border:1px solid rgba(150,100,255,0.3); border-radius:6px; padding:12px;">
            <h3 style="margin:0 0 12px 0; color:#c77dff; font-size:12px; font-weight:600;">⚔️ ÉVÉNEMENTS</h3>
            ${gameLog.length > 0 ? `
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${gameLog.map((event, idx) => `
                  <div style="font-size:10px; color:#ddd; padding:6px; background:rgba(0,0,0,0.3); border-left:2px solid #c77dff; border-radius:2px;">
                    <strong style="color:#e8e8f0;">${event.turn || 'Nuit 1'}</strong> - ${event.text}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="font-size:11px; color:#aaa; text-align:center; padding:16px;">
                📝 Aucun événement enregistré pour le moment
              </div>
            `}
          </div>

          <!-- SECTION: NOTES -->
          <div style="background:rgba(255,150,100,0.1); border:1px solid rgba(255,150,100,0.3); border-radius:6px; padding:12px;">
            <h3 style="margin:0 0 12px 0; color:#ff9966; font-size:12px; font-weight:600;">📝 NOTES</h3>
            <textarea id="gmJournalNotes" placeholder="Ajoutez vos notes ici..." style="width:100%; height:120px; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,150,100,0.2); border-radius:4px; color:#e8e8f0; font-size:10px; font-family:monospace; resize:none;">
            </textarea>
          </div>
        </div>
      </div>
    `;

    return journalHtml;
  }

  attachEventListenersAfterRender() {
    const mode = this.gm.state.mode;
    if (mode === 'selectRoles') {
      attachChooseCardEvents(this);
    } else if (mode === 'tableSetup') {
      attachTableAndRenameEvents(this);
    } else if (mode === 'assignRoles') {
      attachFirstNightEvents(this);
    }
  }

  generatePositionsByTableType(playerCount, tableType) {
    const center = { x: 150, y: 150 };
    const positions = [];

    switch (tableType) {
      case 'circle':
        // Circle: intelligent radius calculation
        // Table is circular with radius ~70. Players must be outside.
        // Radius grows slightly with player count to maintain spacing
        {
          const minRadius = 85; // minimum to clear table radius of 70
          const maxRadius = 143; // stay within generation bounds (150-7)
          const radiusGrowth = Math.max(0, (playerCount - 3) * 0.8);
          const radius = Math.min(maxRadius, minRadius + radiusGrowth);

          for (let i = 0; i < playerCount; i++) {
            const angle = (i / playerCount) * Math.PI * 2;
            positions.push({
              x: center.x + Math.cos(angle) * radius,
              y: center.y + Math.sin(angle) * radius
            });
          }
        }
        break;

      case 'oval-v':
        // Oval vertical: intelligent ellipse dimensions
        // Table is ~100x180 (rx~50, ry~90). Must be significantly larger.
        {
          const tableRx = 50;
          const tableRy = 90;
          const bufferX = 25; // expand beyond table in x
          const bufferY = 35; // expand beyond table in y
          const rx = Math.min(143, tableRx + bufferX);
          const ry = Math.min(143, tableRy + bufferY);

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
        // Table is ~80x200. Must be significantly larger to avoid overlap.
        {
          const tableW = 40; // half of 80
          const tableH = 100; // half of 200
          const bufferW = 50; // expand beyond table width
          const bufferH = 40; // expand beyond table height
          const w = Math.min(143, tableW + bufferW);
          const h = Math.min(143, tableH + bufferH);

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
        // Table is circular with radius ~70 (occupies ~140x140). Must be significantly larger.
        {
          const tableS = 70;
          const buffer = 40; // expand beyond table
          const s = Math.min(143, tableS + buffer);

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
    // À implémenter si nécessaire
  }

  setupOverlayDrag(overlay) {
    const header = document.getElementById('gmHeader');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - overlay.offsetLeft;
      offsetY = e.clientY - overlay.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && !this.minimized) {
        overlay.style.left = (e.clientX - offsetX) + 'px';
        overlay.style.top = (e.clientY - offsetY) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  toggleMinimized() {
    const overlay = document.getElementById('gameMasterOverlay');
    const content = document.getElementById('gmContent');
    const header = document.getElementById('gmHeader');
    const collapseBtn = document.getElementById('gmBtnCollapse');

    if (!this.minimized) {
      // Minimiser en bas à gauche
      this.minimized = true;
      overlay.style.width = '220px';
      overlay.style.height = '32px';
      overlay.style.bottom = '20px';
      overlay.style.top = 'auto';
      overlay.style.left = '20px';
      content.style.display = 'none';
      overlay.style.borderRadius = '4px';
      header.style.borderRadius = '4px';
      header.style.height = '32px';
      header.style.padding = '4px 8px';
      // Changer l'icône en + pour maximiser
      if (collapseBtn) collapseBtn.textContent = '▢';
      console.log('[GameMaster UI] Minimized');
    } else {
      // Restaurer
      this.minimized = false;
      overlay.style.width = '650px';
      overlay.style.height = '650px';
      overlay.style.bottom = 'auto';
      overlay.style.top = '100px';
      overlay.style.left = '320px';
      content.style.display = 'block';
      overlay.style.borderRadius = '8px';
      header.style.borderRadius = '8px 8px 0 0';
      header.style.height = 'auto';
      header.style.padding = '12px 16px';
      // Changer l'icône en − pour minimiser
      if (collapseBtn) collapseBtn.textContent = '−';
      console.log('[GameMaster UI] Restored');
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameMasterUI;
}
