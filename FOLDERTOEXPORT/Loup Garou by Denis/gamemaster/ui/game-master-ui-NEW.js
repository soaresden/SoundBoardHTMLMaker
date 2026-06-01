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
      'Villageois': 'Villageois',
      'Voyante': 'Voyante',
      'Chasseur': 'Chasseur',
      'Sorciere': 'Sorciere',
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
      'Villageois': 'Simple_Villageois',
    };

    this.init();
  }

  getCardFile(roleId) {
    // Load FULL image path from JSON (including gamemaster/cards/)
    if (window.ROLES_DATA && window.ROLES_DATA.roles && window.ROLES_DATA.roles[roleId]) {
      const roleData = window.ROLES_DATA.roles[roleId];
      if (roleData.image) {
        return roleData.image; // Return full path like "gamemaster/cards/Cupidon.webp"
      }
    }

    // Fallback: construct path if not in JSON
    const filename = this.roleToCardFile[roleId] || roleId;
    return `gamemaster/cards/${filename}.webp`;
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
        <button id="gmTabGame" class="gm-tab" data-tab="game" style="flex:1; padding:8px 12px; border:none; background:rgba(81,116,219,0.3); color:#81dff7; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid #5174db;">Jeu</button>
        <button id="gmTabJournal" class="gm-tab" data-tab="journal" style="flex:1; padding:8px 12px; border:none; background:transparent; color:#aaa; font-weight:600; cursor:pointer; font-size:11px; border-bottom:2px solid transparent;">Journal</button>
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
    const gmContent = document.getElementById('gmContent');

    if (!gmContent) return;

    // Afficher le journal si l'onglet journal est actif
    if (this.activeTab === 'journal') {
      // En mode journal, on utilise l'ancienne structure (full-width)
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '16px';
      gmContent.innerHTML = this.renderJournal();
    } else if (mode === 'selectRoles') {
      // En mode sélection des rôles, afficher en full-width
      gmContent.style.display = 'block !important';
      gmContent.style.flexDirection = 'column';
      gmContent.style.overflow = 'auto';
      gmContent.style.padding = '0';
      gmContent.innerHTML = renderCardSelection(this);
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
          // Mode CERCLE: liste simple draggable
          const playersList = players.map((p, idx) => `
            <div class="gm-player-vignette" data-player-id="${p.id}" style="display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 4px; background:rgba(81,116,219,0.1); border:1px solid rgba(199,125,255,0.2); border-radius:3px; margin:2px; cursor:default; transition:all 0.2s; flex-shrink:0;">
              <div style="font-size:9px; opacity:0.9; text-align:center; font-weight:700; color:#81dff7;">J${idx + 1}</div>
              <input type="text" class="gm-player-name-input-place" data-player-id="${p.id}" value="${p.name}" placeholder="Nom..." style="width:85%; padding:2px 3px; border:1px solid rgba(199,125,255,0.2); background:rgba(0,0,0,0.3); border-radius:2px; color:#e8e8f0; text-align:center; font-size:8px;" onclick="event.stopPropagation();">
            </div>
          `).join('');
          rightHtml = `
            <div style="display:flex; flex-direction:column; height:100%; padding:0;">
              <h3 style="padding:10px 8px; margin:0; border-bottom:1px solid rgba(199,125,255,0.2); color:#81dff7; font-size:11px; flex-shrink:0;">👥 Glissez pour réorganiser</h3>
              <div id="gmPlayersList" style="flex:1; overflow-y:auto; padding:4px; display:flex; flex-direction:column; gap:0;">
                ${playersList}
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
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:1px; cursor:grab; transition:all 0.2s; flex-shrink:0; user-select:none; line-height:1.1; min-width:50px; text-align:center;" draggable="true" title="${p.name}">
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
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:0; cursor:grab; user-select:none; line-height:1.1; flex-shrink:0; text-align:center;" draggable="true" title="${p.name}">
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
                <div class="gm-player-vignette" data-player-id="${p.id}" data-zone="${zoneName}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px 3px; background:transparent; border:none; margin:1px; cursor:grab; transition:all 0.2s; flex-shrink:0; user-select:none; line-height:1.1; text-align:center;" draggable="true" title="${p.name}">
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
            </div>
          `;
        }

      } else if (mode === 'assignRoles') {
        rightHtml = renderRoleDetailandTips(this);
      } else if (mode === 'night') {
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

    // Auto-scroll du log vers le dernier message
    if (this.activeTab === 'journal') {
      setTimeout(() => {
        const logScroll = document.getElementById('gmLogScroll');
        if (logScroll) {
          logScroll.scrollTop = logScroll.scrollHeight;
        }
      }, 50);
    }

    // Attacher les événements des contrôles flèches pour mode tableSetup
    if (mode === 'tableSetup') {
      this.attachPlayerControlEvents();
    }

    this.attachEventListenersAfterRender();
  }

  attachPlayerControlEvents() {
    const gm = this.gm;
    const playersList = document.getElementById('gmPlayersList');
    if (!playersList) return;

    const vignettes = playersList.querySelectorAll('.gm-player-vignette');
    let draggedElement = null;
    let draggedIndex = null;

    vignettes.forEach((vignette, idx) => {
      const playerId = vignette.dataset.playerId;

      // MOUSEDOWN: Colorer le rond sur la map en vert
      vignette.addEventListener('mousedown', (e) => {
        console.log(`🖱️ MOUSEDOWN on vignette ${idx} (${playerId}) - ${gm.state.players[idx].name}`);
        const mapPoint = document.querySelector(`.gm-player-point[data-player-id="${playerId}"]`);
        if (mapPoint) {
          mapPoint.classList.add('gm-player-selected');
          mapPoint.dataset.originalDotStyle = mapPoint.querySelector('.gm-point-dot').getAttribute('style');
          const dotElement = mapPoint.querySelector('.gm-point-dot');
          if (dotElement) {
            dotElement.style.background = 'rgba(102,217,153,0.8)';
            dotElement.style.borderColor = '#66d999';
            dotElement.style.boxShadow = '0 0 12px rgba(102,217,153,0.6)';
            console.log(`✅ Map point turned green for ${gm.state.players[idx].name}`);
          }
        }
      });

      // DRAGSTART: Marquer l'élément en cours de déplacement
      vignette.addEventListener('dragstart', (e) => {
        draggedElement = vignette;
        draggedIndex = idx;
        console.log(`🎯 DRAGSTART vignette ${idx} (zone: ${vignette.dataset.zone}) - Player: ${gm.state.players[idx].name}`);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', vignette.innerHTML);
      });

      // DRAGEND: Animation fade-out du vert et retour au violet
      vignette.addEventListener('dragend', (e) => {
        console.log(`🏁 DRAGEND - draggedIndex was ${draggedIndex}`);
        vignette.style.opacity = '1';
        vignette.style.backgroundColor = 'rgba(81,116,219,0.1)';

        // Nettoyer tous les indicateurs de drop
        document.querySelectorAll('.gm-drop-indicator').forEach(ind => ind.remove());
        console.log(`  - Cleared drop indicators`);

        // Animation sur la map
        const mapPoint = document.querySelector(`.gm-player-point[data-player-id="${playerId}"]`);
        if (mapPoint) {
          const dotElement = mapPoint.querySelector('.gm-point-dot');
          if (dotElement) {
            dotElement.classList.add('gm-dot-release-animation');
            console.log(`  - Started release animation for ${playerId}`);
            // Retirer la classe après l'animation
            setTimeout(() => {
              dotElement.classList.remove('gm-dot-release-animation');
              // Restaurer le style original
              if (mapPoint.dataset.originalDotStyle) {
                dotElement.setAttribute('style', mapPoint.dataset.originalDotStyle);
              }
              console.log(`  - Release animation complete for ${playerId}`);
            }, 600);
          }
        }

        draggedElement = null;
        draggedIndex = null;
      });

      // DRAGOVER sur vignette - permet le drop
      vignette.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== null) {
          console.log(`➡️ DRAGOVER vignette ${idx} (target: ${vignette.dataset.zone})`);
        }
      });

      // DROP: Réorganiser les joueurs
      vignette.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedIndex === null || draggedElement === null) {
          console.log(`❌ DROP ignored - draggedIndex or draggedElement is null`);
          return;
        }

        const players = gm.state.players;
        const draggedPlayer = players[draggedIndex];
        const targetZone = vignette.dataset.zone;
        const draggedZone = draggedElement?.dataset.zone;
        const isHorizontal = targetZone === 'top' || targetZone === 'bottom';

        console.log(`💧 DROP event:
  - Dragged: ${draggedPlayer.name} (index ${draggedIndex}, zone ${draggedZone})
  - Target vignette: ${gm.state.players[Array.from(vignettes).indexOf(vignette)]?.name} (zone ${targetZone})
  - IsHorizontal: ${isHorizontal}
  - Mouse X: ${e.clientX}, Y: ${e.clientY}`);

        // Obtenir les vignettes de la zone cible
        const targetZoneContainer = vignette.closest('.gm-zone-vignettes');
        const zoneVignettes = Array.from(targetZoneContainer?.querySelectorAll('.gm-player-vignette') || []);

        // Calculer l'index de destination DANS LA ZONE
        let targetIndexInZone = zoneVignettes.indexOf(vignette);
        let shouldInsertAfter;

        // Calculer shouldInsertAfter basé sur la position du souris
        const rect = vignette.getBoundingClientRect();
        if (isHorizontal) {
          // Pour zones horizontales: compare X
          const midpoint = rect.left + rect.width / 2;
          shouldInsertAfter = e.clientX > midpoint;
          console.log(`  - Horizontal zone: midpoint=${midpoint}, mouse=${e.clientX}, insertAfter=${shouldInsertAfter}`);
        } else {
          // Pour zones verticales: compare Y
          const midpoint = rect.top + rect.height / 2;
          shouldInsertAfter = e.clientY > midpoint;
          console.log(`  - Vertical zone: midpoint=${midpoint}, mouse=${e.clientY}, insertAfter=${shouldInsertAfter}`);
        }

        if (shouldInsertAfter) {
          targetIndexInZone += 1;
        }

        // Déterminer où commence cette zone dans players[]
        const zoneConfig = gm.state.zoneConfig || { top: 0, left: 0, right: 0, bottom: 0 };
        let zoneStart = 0;
        if (targetZone === 'left') {
          zoneStart = zoneConfig.top;
        } else if (targetZone === 'right') {
          zoneStart = zoneConfig.top + zoneConfig.left;
        } else if (targetZone === 'bottom') {
          zoneStart = zoneConfig.top + zoneConfig.left + zoneConfig.right;
        }

        let targetIndex = zoneStart + targetIndexInZone;

        // Ajuster si on drag de la même zone
        if (draggedZone === targetZone && draggedIndex < targetIndex) {
          targetIndex -= 1;
        }

        console.log(`  - Zone calculation:
    - zoneStart: ${zoneStart}
    - targetIndexInZone: ${targetIndexInZone}
    - targetIndex (global): ${targetIndex}
    - draggedIndex: ${draggedIndex}
    - Will move: ${draggedIndex !== targetIndex}`);

        // Éviter les mouvements inutiles
        if (draggedIndex === targetIndex) {
          console.log(`  ⏭️ Same position, skipping`);
          draggedElement = null;
          draggedIndex = null;
          return;
        }

        // Supprimer et réinsérer le joueur à la nouvelle position
        console.log(`  🔄 Moving player from index ${draggedIndex} to ${targetIndex}`);
        players.splice(draggedIndex, 1);
        players.splice(targetIndex, 0, draggedPlayer);

        // SI on a dragué entre zones différentes, mettre à jour zoneConfig automatiquement
        if (draggedZone !== targetZone && draggedZone && targetZone) {
          console.log(`  🔀 Cross-zone move: ${draggedZone} → ${targetZone}`);
          // Réduire la zone source de 1
          if (gm.state.zoneConfig[draggedZone] > 0) {
            gm.state.zoneConfig[draggedZone]--;
            console.log(`    - ${draggedZone}: ${gm.state.zoneConfig[draggedZone] + 1} → ${gm.state.zoneConfig[draggedZone]}`);
          }
          // Augmenter la zone cible de 1
          gm.state.zoneConfig[targetZone]++;
          console.log(`    - ${targetZone}: ${gm.state.zoneConfig[targetZone] - 1} → ${gm.state.zoneConfig[targetZone]}`);
        }

        // Recalculer les positions
        const tableType = gm.state.tableType || 'circle';
        this.recalculateCirclePositions(players);

        console.log(`✅ DROP complete - saving and re-rendering`);
        gm.saveState();
        this.render();
      });

      // INPUT: Mettre à jour le nom en live sur la map
      const nameInput = vignette.querySelector('.gm-player-name-input-place');
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          const newName = e.target.value;
          const player = gm.state.players.find(p => p.id === playerId);

          if (player) {
            player.name = newName;

            // Mettre à jour le nom sur la map
            const mapPoint = document.querySelector(`.gm-player-point[data-player-id="${playerId}"]`);
            if (mapPoint) {
              const nameElement = mapPoint.querySelector('.gm-point-name');
              if (nameElement) {
                nameElement.textContent = newName;
              }
            }

            // Mettre à jour le label J1, J2, etc. aussi (optionnel, mais bonne UX)
            const jLabel = vignette.querySelector('div:first-child');
            if (jLabel) {
              const jIdx = Array.from(playersList.querySelectorAll('.gm-player-vignette')).indexOf(vignette);
              jLabel.textContent = `J${jIdx + 1}`;
            }
          }
        });

        // BLUR: Sauvegarder l'état quand on quitte le champ
        nameInput.addEventListener('blur', (e) => {
          gm.saveState();
        });
      }
    });

    // Dragover sur chaque conteneur de zone pour montrer l'indicateur
    document.querySelectorAll('.gm-zone-vignettes').forEach(zoneContainer => {
      zoneContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedIndex === null) {
          console.log(`⚠️ DRAGOVER on zone but draggedIndex is null`);
          return;
        }

        const zone = zoneContainer.dataset.zone;
        const isHorizontal = zone === 'top' || zone === 'bottom';
        const vignettes = Array.from(zoneContainer.querySelectorAll('.gm-player-vignette'));

        // Nettoyer les anciens indicateurs
        document.querySelectorAll('.gm-drop-indicator').forEach(ind => ind.remove());

        console.log(`📍 DRAGOVER on zone ${zone} (${isHorizontal ? 'horizontal' : 'vertical'}), vignettes: ${vignettes.length}, mouse: (${e.clientX}, ${e.clientY})`);

        // Trouver quelle vignette est la plus proche de la souris
        let insertIndex = vignettes.length;
        let closestVignette = null;

        if (isHorizontal) {
          // Pour zones horizontales: comparer X
          let closestDistance = Infinity;
          vignettes.forEach((v, idx) => {
            const rect = v.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            const distance = Math.abs(e.clientX - midpoint);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestVignette = v;
              insertIndex = e.clientX < midpoint ? idx : idx + 1;
            }
          });
          console.log(`  - Horizontal: closest vignette at index ${insertIndex}, distance ${closestDistance.toFixed(2)}px`);
        } else {
          // Pour zones verticales: comparer Y
          let closestDistance = Infinity;
          vignettes.forEach((v, idx) => {
            const rect = v.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const distance = Math.abs(e.clientY - midpoint);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestVignette = v;
              insertIndex = e.clientY < midpoint ? idx : idx + 1;
            }
          });
          console.log(`  - Vertical: closest vignette at index ${insertIndex}, distance ${closestDistance.toFixed(2)}px`);
        }

        // Créer et insérer l'indicateur
        const indicator = document.createElement('div');
        indicator.className = 'gm-drop-indicator';

        if (isHorizontal) {
          // Ligne VERTICALE (2px wide, full height) pour zones horizontales
          indicator.style.cssText = `
            width: 2px !important;
            min-width: 2px;
            max-width: 2px;
            height: 45px;
            background: #66d999;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            margin: 0 -1px;
            display: flex;
          `;
          console.log(`  - Created VERTICAL indicator (2px wide, 45px tall)`);
        } else {
          // Ligne HORIZONTALE (full width, 2px tall) pour zones verticales
          indicator.style.cssText = `
            height: 2px !important;
            min-height: 2px;
            max-height: 2px;
            width: 100%;
            background: #66d999;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            margin: -1px 0;
            display: flex;
          `;
          console.log(`  - Created HORIZONTAL indicator (full width, 2px tall)`);
        }

        if (closestVignette && insertIndex > vignettes.indexOf(closestVignette)) {
          closestVignette.parentNode.insertBefore(indicator, closestVignette.nextSibling);
          console.log(`  - Inserted indicator AFTER vignette at index ${vignettes.indexOf(closestVignette)}`);
        } else if (closestVignette) {
          closestVignette.parentNode.insertBefore(indicator, closestVignette);
          console.log(`  - Inserted indicator BEFORE vignette at index ${vignettes.indexOf(closestVignette)}`);
        } else {
          zoneContainer.appendChild(indicator);
          console.log(`  - Appended indicator at end of zone`);
        }
      });

      zoneContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedIndex === null || draggedElement === null) {
          console.log(`❌ DROP on zone container - draggedIndex or draggedElement is null`);
          return;
        }

        const zone = zoneContainer.dataset.zone;
        console.log(`💧 DROP on zone container ${zone}`);

        const vignettes = Array.from(zoneContainer.querySelectorAll('.gm-player-vignette'));
        const draggedZone = draggedElement?.dataset.zone;
        const isHorizontal = zone === 'top' || zone === 'bottom';

        const players = gm.state.players;
        const draggedPlayer = players[draggedIndex];

        console.log(`  - Dragged: ${draggedPlayer.name} (index ${draggedIndex}, zone ${draggedZone}) → ${zone}`);

        // Trouver l'index d'insertion dans la zone
        let insertIndex = vignettes.length;

        // Calculer où insérer basé sur la position de la souris
        if (vignettes.length > 0) {
          let closestDistance = Infinity;
          vignettes.forEach((v, idx) => {
            const rect = v.getBoundingClientRect();
            let distance;

            if (isHorizontal) {
              const midpoint = rect.left + rect.width / 2;
              distance = Math.abs(e.clientX - midpoint);
            } else {
              const midpoint = rect.top + rect.height / 2;
              distance = Math.abs(e.clientY - midpoint);
            }

            if (distance < closestDistance) {
              closestDistance = distance;
              if (isHorizontal) {
                insertIndex = e.clientX < rect.left + rect.width / 2 ? idx : idx + 1;
              } else {
                insertIndex = e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
              }
            }
          });
        }

        // Convertir l'index de zone en index global dans players[]
        const zoneConfig = gm.state.zoneConfig || { top: 0, left: 0, right: 0, bottom: 0 };
        let zoneStart = 0;
        if (zone === 'left') {
          zoneStart = zoneConfig.top;
        } else if (zone === 'right') {
          zoneStart = zoneConfig.top + zoneConfig.left;
        } else if (zone === 'bottom') {
          zoneStart = zoneConfig.top + zoneConfig.left + zoneConfig.right;
        }

        let targetIndex = zoneStart + insertIndex;

        // SI c'est un cross-zone move, ajuster le calcul
        if (draggedZone !== zone && draggedZone && zone) {
          console.log(`  - Cross-zone: adjusting targetIndex from ${targetIndex}`);
          // Retirer le joueur de la zone source du calcul
          const draggedZoneStart = draggedZone === 'left' ? zoneConfig.top :
                                   draggedZone === 'right' ? zoneConfig.top + zoneConfig.left :
                                   draggedZone === 'bottom' ? zoneConfig.top + zoneConfig.left + zoneConfig.right : 0;

          // Si le joueur était avant la zone cible, l'index change
          if (draggedIndex < zoneStart) {
            targetIndex -= 1; // Le joueur qu'on retire est avant la zone cible
          }
          console.log(`  - Adjusted targetIndex to ${targetIndex}`);
        } else if (draggedZone === zone && draggedIndex < targetIndex) {
          // Same zone move
          targetIndex -= 1;
        }

        console.log(`  - Insert at zone index ${insertIndex}, global index ${targetIndex}, draggedIndex ${draggedIndex}`);

        // Éviter les mouvements inutiles
        if (draggedIndex === targetIndex) {
          console.log(`  ⏭️ Same position, skipping`);
          draggedElement = null;
          draggedIndex = null;
          return;
        }

        // Supprimer et réinsérer le joueur à la nouvelle position
        console.log(`  🔄 Moving player from index ${draggedIndex} to ${targetIndex}`);
        players.splice(draggedIndex, 1);
        players.splice(targetIndex, 0, draggedPlayer);

        // SI on a dragué entre zones différentes, mettre à jour zoneConfig
        if (draggedZone !== zone && draggedZone && zone) {
          console.log(`  🔀 Cross-zone move: ${draggedZone} → ${zone}`);
          if (gm.state.zoneConfig[draggedZone] > 0) {
            gm.state.zoneConfig[draggedZone]--;
          }
          gm.state.zoneConfig[zone]++;
        }

        console.log(`✅ DROP complete - saving and re-rendering`);
        gm.saveState();
        this.render();

        draggedElement = null;
        draggedIndex = null;
      });

      zoneContainer.addEventListener('dragleave', (e) => {
        document.querySelectorAll('.gm-drop-indicator').forEach(ind => ind.remove());
      });
    });

    // Permettre le drop sur le conteneur principal - IMPORTANT pour que le DROP se déclenche
    playersList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== null) {
        console.log(`📍 DRAGOVER on playersList`);
      }
    });

    // DROP sur le conteneur principal - fallback si on lâche en dehors des zones
    playersList.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (draggedIndex === null || draggedElement === null) {
        console.log(`❌ DROP on playersList - draggedIndex or draggedElement is null`);
        return;
      }

      console.log(`💧 DROP on playersList (fallback)`);
      // Le DROP réel a probablement déjà été traité par une zone
      // Ceci est juste un fallback
    });

    playersList.addEventListener('dragleave', (e) => {
      if (e.target === playersList) {
        document.querySelectorAll('.gm-drop-indicator').forEach(ind => ind.remove());
      }
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
              ${gameLog.length > 0 ? gameLog.map((event, idx) => `
                <div style="font-size:9px; color:#ddd; padding:8px; background:rgba(0,0,0,0.3); border-left:2px solid #c77dff; border-radius:2px; flex:0 0 auto; user-select:text;">
                  <div style="color:#aaa; font-size:8px; margin-bottom:2px; user-select:text;">${event.timestamp}</div>
                  <strong style="color:#e8e8f0; user-select:text;">${event.turn || 'Nuit 1'}</strong> - <span style="user-select:text;">${event.text}</span>
                </div>
              `).join('') : `
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
    // À implémenter si nécessaire
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
      if (isDragging && !this.minimized) {
        overlay.style.left = (clientX - offsetX) + 'px';
        overlay.style.top = (clientY - offsetY) + 'px';
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
