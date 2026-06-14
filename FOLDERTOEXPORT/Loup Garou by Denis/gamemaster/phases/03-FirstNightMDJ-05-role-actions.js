// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  /**
   * Render Cupidon lover selection interface
   * Shows clickable player names, apply border color on selection
   */
  renderCupidonLoverSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;

    const players = this.gm.state.players || [];
    const selectedLovers = this.selectedPlayers || [];
    const _loverRid = this.selectedRoleId || 'Cupidon';
    const _loverCount = (this.rolesLoader.getRole(_loverRid) || {}).loverCount || 2;

    // Filter out dead players AND last protected player (can't protect 2 nights in a row)
    const alivePlayers = this.playerRegistry.getAlive().filter(p => p.id !== this.lastSalvateurProtected);

    // Create clickable player list
    const playerListHtml = alivePlayers
      .map((player, idx) => {
        const playerId = player.id; // Use actual player ID from orchestrator
        const isSelected = selectedLovers.includes(playerId);
        const roleData = this.rolesLoader.getRole(player.role);
        const affectedBorderColor = roleData?.visual?.affectedColor?.borderColor || 'inherit';

        return `
          <div class="cupidon-player-option ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               data-player-name="${player.name}"
               style="background: ${isSelected ? affectedBorderColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? affectedBorderColor : 'transparent'};">
            <span class="player-emoji">${roleData?.emoji || '❓'}</span>
            <span class="player-name">${player.name}</span>
            ${isSelected ? '<span class="selection-checkmark">✓</span>' : ''}
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = `
      <div style="font-size:11px; color:#ffd6e6; background:rgba(214,137,158,0.15); border:1px solid rgba(214,137,158,0.45); border-radius:6px; padding:7px 9px; margin-bottom:8px; line-height:1.35;">💡 <b>Astuce MJ</b> : une fois les ${_loverCount} amoureux désignés, tu peux les réveiller ensemble pour qu'ils se reconnaissent (comme les Sœurs).</div>
    ` + playerListHtml;

    // Attach click handlers for player selection
    actionControls.querySelectorAll('.cupidon-player-option').forEach(playerBtn => {
      playerBtn.addEventListener('click', (e) => {
        const playerId = playerBtn.dataset.playerId;
        const playerName = playerBtn.dataset.playerName;
        this.toggleCupidonLover(playerId, playerName);
      });
    });

    // Show validation button only if 2 lovers selected
    if (actionInfo) {
      if (selectedLovers.length === _loverCount) {
        actionInfo.innerHTML = `
          <button class="btn-validate-action">✓ Valider les amoureux</button>
        `;
        const validateBtn = actionInfo.querySelector('.btn-validate-action');
        if (validateBtn) {
          validateBtn.addEventListener('click', () => this.completeCupidonAction());
        }
      } else if (state.completed) {
        actionInfo.innerHTML = '✅ Amoureux liés';
      } else {
        actionInfo.innerHTML = `Sélectionnez ${_loverCount} joueurs (${selectedLovers.length}/${_loverCount})`;
      }
    }
  }
,


  /**
   * Toggle Cupidon lover selection
   * @param {string} playerId - Format: player_0, player_1, etc (from orchestrator)
   * @param {string} playerName
   */
  toggleCupidonLover(playerKey, playerName) {
    const _rid = this.selectedRoleId || 'Cupidon';
    const _cnt = (this.rolesLoader.getRole(_rid) || {}).loverCount || 2;
    const index = this.selectedPlayers.indexOf(playerKey);
    if (index >= 0) {
      // Deselect
      this.selectedPlayers.splice(index, 1);
    } else {
      // Select (max = nombre d'amoureux du rôle)
      if (this.selectedPlayers.length < _cnt) {
        this.selectedPlayers.push(playerKey);
      }
    }

    // Setup actionState for validation (if not already set)
    if (!this.actionState.roleId) {
      const roleData = this.rolesLoader.getRole(_rid);
      this.actionState = {
        roleId: _rid,
        action: 'lover',
        roleName: roleData?.name || 'Cupidon',
        roleEmoji: roleData?.emoji || '💘'
      };
    }

    // Update the UI immediately
    this.renderActionButtons();

    // Update map to show affected players
    this.updateMapForCupidon();

    console.log('[MDJ] Cupidon lovers:', this.selectedPlayers);

    // Save after every Cupidon selection
    this.quickSave();
  }
,


  /**
   * Render Enfant Sauvage idol selection
   * Select 1 player as idol, apply border color from JSON
   */
  renderEnfantSauvageSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const selectedIdol = this.selectedPlayers[0] || null;

    // Filter out dead players AND the Enfant Sauvage themselves
    const enfantSauvagePlayer = this.gm.state.players?.find(p => p.role === 'Enfant_Sauvage');
    const alivePlayers = this.playerRegistry.getAlive().filter(p =>
      p.id !== enfantSauvagePlayer?.id // Exclude self
    );

    const playerListHtml = alivePlayers
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedIdol === playerId;
        const roleData = this.rolesLoader.getRole(player.role);
        const borderColor = roleData?.visual?.affectedColor?.borderColor || 'inherit';

        return `
          <div class="role-action-btn ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? borderColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? borderColor : 'transparent'};">
            <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = playerListHtml;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        this.selectedPlayers = this.selectedPlayers[0] === playerId ? [] : [playerId];

        // Setup actionState for validation
        if (this.selectedPlayers.length > 0) {
          const roleData = this.rolesLoader.getRole('Enfant_Sauvage');
          this.actionState = {
            roleId: 'Enfant_Sauvage',
            action: 'idol',
            roleName: roleData?.name || 'Enfant Sauvage',
            roleEmoji: roleData?.emoji || '👶'
          };
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      if (selectedIdol) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Valider l'idole</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Sélectionnez 1 joueur';
      }
    }
  }
,


  /**
   * Render Chien Loup player selection
   * Select player, takes their emoji as choice
   * Avatar changes IMMEDIATELY on click (no validation needed)
   */
  renderChienLoupSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;

    // Two buttons for Chien_Loup: stay villager or join wolves
    // Colors from JSON for Villageois and Loup_Garou roles
    const villageoisRole = this.rolesLoader.getRole('Villageois');
    const loupRole = this.rolesLoader.getRole('Simple_Loup_Garou');
    const stayColor = villageoisRole?.visual?.roleColor?.fondColor || bgColor;
    const wolfColor = loupRole?.visual?.roleColor?.fondColor || bgColor;

    actionControls.innerHTML = `
      <button class="chien-loup-btn chien-loup-stay" style="background: ${stayColor}; border-color: ${stayColor};">
        🏘️ Rester Villageois
      </button>
      <button class="chien-loup-btn chien-loup-wolf" style="background: ${wolfColor}; border-color: ${wolfColor};">
        🐺 Devenir Loup-Garou
      </button>
    `;

    // Handle button clicks
    const stayBtn = actionControls.querySelector('.chien-loup-stay');
    const wolfBtn = actionControls.querySelector('.chien-loup-wolf');

    stayBtn?.addEventListener('click', () => {
      this.selectedPlayers = ['stay_villager'];

      // Setup actionState for validation
      const roleData = this.rolesLoader.getRole('Chien_Loup');
      this.actionState = {
        roleId: 'Chien_Loup',
        action: 'stay_villager',
        roleName: roleData?.name || 'Chien Loup',
        roleEmoji: roleData?.emoji || '🐕',
        targetCount: 0
      };

      // IMMEDIATELY change emoji on map to Villageois
      const villageoisRole = this.rolesLoader.getRole('Villageois');
      const mdjMap = document.getElementById('mdj-live-map');
      if (mdjMap) {
        const chienPoint = mdjMap.querySelector('[data-player-id*=""]');
        // Find the player with Chien_Loup role
        const players = this.gm.state.players || [];
        const chienPlayer = players.find(p => p.role === 'Chien_Loup');
        if (chienPlayer) {
          const point = mdjMap.querySelector(`[data-player-id="${chienPlayer.id}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji) {
              emoji.textContent = villageoisRole?.emoji || '👥';
              emoji.style.color = villageoisRole?.visual?.roleColor?.emojiColor || 'inherit';
            }
          }
        }
      }

      this.renderActionButtons();

      // Show validate button
      if (actionInfo) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Confirmer Villageois</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      }

      // Save after Chien_Loup choice
      this.quickSave();
    });

    wolfBtn?.addEventListener('click', () => {
      this.selectedPlayers = ['join_wolves'];

      // Setup actionState for validation
      const roleData = this.rolesLoader.getRole('Chien_Loup');
      this.actionState = {
        roleId: 'Chien_Loup',
        action: 'join_wolves',
        roleName: roleData?.name || 'Chien Loup',
        roleEmoji: roleData?.emoji || '🐕',
        targetCount: 0
      };

      // IMMEDIATELY change emoji on map to Loup-Garou
      const loupRole = this.rolesLoader.getRole('Simple_Loup_Garou');
      const mdjMap = document.getElementById('mdj-live-map');
      if (mdjMap) {
        // Find the player with Chien_Loup role
        const players = this.gm.state.players || [];
        const chienPlayer = players.find(p => p.role === 'Chien_Loup');
        if (chienPlayer) {
          const point = mdjMap.querySelector(`[data-player-id="${chienPlayer.id}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji) {
              emoji.textContent = loupRole?.emoji || '🐺';
              emoji.style.color = loupRole?.visual?.roleColor?.emojiColor || 'inherit';
            }
          }
        }
      }

      this.renderActionButtons();

      // Show validate button
      if (actionInfo) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Confirmer Loup-Garou</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      }

      // Save after Chien_Loup choice
      this.quickSave();
    });

    if (actionInfo) {
      if (this.selectedPlayers.length > 0) {
        const choiceText = this.selectedPlayers[0] === 'stay_villager' ? '🏘️ Villageois' : '🐺 Loup-Garou';
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Confirmer: ${choiceText}</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Choisissez votre camp';
      }
    }
  }
,


  /**
   * Render Voyante player selection
   * Show all players with their role names
   */
  renderVoyanteSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const selectedPlayer = this.selectedPlayers[0] || null;

    // Filter out dead players AND the Voyante herself (can't see herself)
    const alivePlayers = this.playerRegistry.getAlive().filter(p => p.role !== 'Voyante');

    const playerListHtml = alivePlayers
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedPlayer === playerId;
        const roleData = this.rolesLoader.getRole(player.role);

        return `
          <div class="role-action-btn voyante-info ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? bgColor : 'transparent'};">
            <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
            <span class="voyante-role">${roleData?.name || '?'}</span>
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = playerListHtml;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        this.selectedPlayers = this.selectedPlayers[0] === playerId ? [] : [playerId];

        // Setup actionState for validation
        if (this.selectedPlayers.length > 0) {
          const roleData = this.rolesLoader.getRole('Voyante');
          this.actionState = {
            roleId: 'Voyante',
            action: 'see_role',
            roleName: roleData?.name || 'Voyante',
            roleEmoji: roleData?.emoji || '🔮'
          };
          console.log('[MDJ] Voyante selected player:', this.selectedPlayers[0], 'actionState:', this.actionState);
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      if (selectedPlayer) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Confirmer</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Consultez les rôles';
      }
    }
  }
,


  /**
   * Render Salvateur protection selection
   * Select player to protect with border color
   */
  renderSalvateurSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const selectedPlayer = this.selectedPlayers[0] || null;

    // Filter out dead players
    const alivePlayers = this.playerRegistry.getAlive();

    const playerListHtml = alivePlayers
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedPlayer === playerId;
        const roleData = this.rolesLoader.getRole(player.role);
        const protectColor = roleData?.visual?.affectedColor?.borderColor || 'rgba(255,255,255,0.5)';

        return `
          <div class="role-action-btn ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? protectColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? protectColor : 'transparent'};">
            <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = playerListHtml;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        this.selectedPlayers = this.selectedPlayers[0] === playerId ? [] : [playerId];

        // Setup actionState for validation
        if (this.selectedPlayers.length > 0) {
          const roleData = this.rolesLoader.getRole('Salvateur');
          this.actionState = {
            roleId: 'Salvateur',
            action: 'protect',
            roleName: roleData?.name || 'Salvateur',
            roleEmoji: roleData?.emoji || '🛡️'
          };
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      if (selectedPlayer) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Protéger</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Sélectionnez un joueur';
      }
    }
  }
,


  /**
   * Render Renard neighbor inspection
   * Select player, show left/right neighbors with wolf detection
   */
  renderRenardSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const players = this.gm.state.players || [];
    const selectedPlayer = this.selectedPlayers[0] || null;

    // HORIZONTAL LAYOUT: Show left neighbor | selected player | right neighbor
    let controlsHtml = '';

    if (selectedPlayer) {
      const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
      if (selectedPlayerObj) {
        const selectedIdx = players.indexOf(selectedPlayerObj);
        // Voisins VIVANTS: si le voisin immediat est mort, on prend le suivant vivant
        const aliveNeighborIdx = (dir) => {
          let i = selectedIdx;
          for (let k = 0; k < players.length; k++) {
            i = (i + dir + players.length) % players.length;
            if (i === selectedIdx) break;
            if (!this.deadPlayerIds.has(players[i].id)) return i;
          }
          return (selectedIdx + dir + players.length) % players.length;
        };
        const leftIdx = aliveNeighborIdx(-1);
        const rightIdx = aliveNeighborIdx(+1);

        const leftPlayer = players[leftIdx];
        const rightPlayer = players[rightIdx];
        const leftRole = this.rolesLoader.getRole(leftPlayer.role);
        const rightRole = this.rolesLoader.getRole(rightPlayer.role);
        const selectedRole = this.rolesLoader.getRole(selectedPlayerObj.role);

        // Check for wolves in the 3 neighbors
        // EXCEPTION: Chien_Loup who chose villageois is NOT a wolf
        const isChienStayVillager = (p) => p.role === 'Chien_Loup' &&
          this.roleStates['Chien_Loup']?.result?.targets?.includes('stay_villager');

        const isLeftWolf = (leftPlayer.role.includes('Loup') || leftPlayer.role.includes('Wolf')) && !isChienStayVillager(leftPlayer);
        const isSelectedWolf = (selectedPlayerObj.role.includes('Loup') || selectedPlayerObj.role.includes('Wolf')) && !isChienStayVillager(selectedPlayerObj);
        const isRightWolf = (rightPlayer.role.includes('Loup') || rightPlayer.role.includes('Wolf')) && !isChienStayVillager(rightPlayer);
        const wolfCount = (isLeftWolf ? 1 : 0) + (isSelectedWolf ? 1 : 0) + (isRightWolf ? 1 : 0);

        console.log(`[MDJ] Renard inspection - 3 neighbors: left=${leftPlayer.name} (${isLeftWolf ? 'wolf' : 'not wolf'}), center=${selectedPlayerObj.name} (${isSelectedWolf ? 'wolf' : 'not wolf'}), right=${rightPlayer.name} (${isRightWolf ? 'wolf' : 'not wolf'}) - Total wolves: ${wolfCount}`);

        const wolfDetectionMessage = wolfCount === 0
          ? '<div style="color: #ff9e6b; font-size: 0.72rem; font-weight: 700; margin-top: 8px; padding: 6px; background: rgba(255,140,80,0.2); border-radius: 3px;">🦊 Ça ne sent rien… aucun loup à proximité (le Renard perd son flair dès la nuit prochaine)</div>'
          : `<div style="color: #4ecdc4; font-size: 0.72rem; font-weight: 700; margin-top: 8px; padding: 6px; background: rgba(78,205,196,0.2); border-radius: 3px;">🐺 Ça sent le loup ! ${wolfCount} loup${wolfCount > 1 ? 's' : ''} à proximité</div>`;

        controlsHtml = `
          <div style="display: flex; justify-content: space-around; align-items: center; gap: 10px; width: 100%;">
            <!-- LEFT NEIGHBOR -->
            <div style="flex: 1; text-align: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: ${isLeftWolf ? '2px solid #ff4444' : '1px solid transparent'};">
              <div style="font-size: 1.2rem; margin-bottom: 4px;">${leftRole?.emoji || '?'}</div>
              <div style="font-size: 0.65rem; font-weight: 700; color: #e0e0f0;">${leftPlayer.name}</div>
              ${isLeftWolf ? '<div style="font-size: 0.6rem; color: #ff4444; margin-top: 3px;">🐺 Loup</div>' : ''}
            </div>

            <!-- CENTER: SELECTED PLAYER (with click handlers for left/right selection) -->
            <div style="flex: 1; text-align: center;">
              <div style="padding: 8px; background: ${bgColor}; border-radius: 4px; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: ${textColor}; border: ${isSelectedWolf ? '2px solid #ff4444' : '1px solid transparent'};">
                <div style="font-size: 1.4rem; margin-bottom: 4px; font-weight: 700;">${selectedRole?.emoji || '?'}</div>
                <div style="font-size: 0.75rem; font-weight: 700;">${selectedPlayerObj.name}</div>
                ${isSelectedWolf ? '<div style="font-size: 0.6rem; color: #ff4444; margin-top: 3px;">🐺 Loup</div>' : ''}
              </div>

              <!-- WOLF DETECTION INFO -->
              ${wolfDetectionMessage}

              <!-- NAVIGATION BUTTONS -->
              <div style="display: flex; gap: 4px; margin-top: 8px; justify-content: center;">
                <button class="renard-nav-btn renard-nav-left" style="padding: 4px 8px; font-size: 0.65rem; background: rgba(100,150,255,0.3); border: 1px solid rgba(100,150,255,0.5); color: white; border-radius: 3px; cursor: pointer;">◀ Gauche</button>
                <button class="renard-nav-btn renard-nav-right" style="padding: 4px 8px; font-size: 0.65rem; background: rgba(100,150,255,0.3); border: 1px solid rgba(100,150,255,0.5); color: white; border-radius: 3px; cursor: pointer;">Droite ▶</button>
              </div>
            </div>

            <!-- RIGHT NEIGHBOR -->
            <div style="flex: 1; text-align: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: ${isRightWolf ? '2px solid #ff4444' : '1px solid transparent'};">
              <div style="font-size: 1.2rem; margin-bottom: 4px;">${rightRole?.emoji || '?'}</div>
              <div style="font-size: 0.65rem; font-weight: 700; color: #e0e0f0;">${rightPlayer.name}</div>
              ${isRightWolf ? '<div style="font-size: 0.6rem; color: #ff4444; margin-top: 3px;">🐺 Loup</div>' : ''}
            </div>
          </div>
        `;
      }
    } else {
      // No player selected yet - show full list of players to choose from
      // Filter out Renard themselves (cannot sniff own role) AND dead players
      const renardPlayer = players.find(p => p.role === 'Renard');
      const alivePlayers = this.playerRegistry.getAlive();

      const playerListHtml = alivePlayers
        .filter(p => p.id !== renardPlayer?.id) // Exclude Renard from selection
        .map((player) => {
          const playerId = player.id;
          const roleData = this.rolesLoader.getRole(player.role);
          const isWolf = player.role.includes('Loup') || player.role.includes('Wolf');

          return `
            <div class="role-action-btn ${selectedPlayer === playerId ? 'selected' : ''}"
                 data-player-id="${playerId}"
                 style="background: ${selectedPlayer === playerId ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                        border: 2px solid ${selectedPlayer === playerId ? bgColor : 'transparent'};">
              <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
              <span class="btn-name">${player.name}</span>
              ${isWolf ? '<span class="wolf-indicator">🐺</span>' : ''}
            </div>
          `;
        })
        .join('');

      controlsHtml = playerListHtml;
    }

    actionControls.innerHTML = controlsHtml;

    // Attach event listeners
    if (selectedPlayer) {
      // Navigation buttons
      const leftBtn = actionControls.querySelector('.renard-nav-left');
      const rightBtn = actionControls.querySelector('.renard-nav-right');

      if (leftBtn && rightBtn) {
        const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
        const selectedIdx = players.indexOf(selectedPlayerObj);

        leftBtn.addEventListener('click', () => {
          const newIdx = (selectedIdx - 1 + players.length) % players.length;
          const newPlayerId = players[newIdx].id;
          this.selectedPlayers = [newPlayerId];
          this.renderActionButtons();
          this.updateMapForRole();
        });

        rightBtn.addEventListener('click', () => {
          const newIdx = (selectedIdx + 1) % players.length;
          const newPlayerId = players[newIdx].id;
          this.selectedPlayers = [newPlayerId];
          this.renderActionButtons();
          this.updateMapForRole();
        });
      }
    } else {
      // Player selection buttons
      actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const playerId = btn.dataset.playerId;
          this.selectedPlayers = [playerId];

          // Setup actionState for validation
          const roleData = this.rolesLoader.getRole('Renard');
          this.actionState = {
            roleId: 'Renard',
            action: 'sniff',
            roleName: roleData?.name || 'Renard',
            roleEmoji: roleData?.emoji || '🦊'
          };

          this.renderActionButtons();
          this.updateMapForRole();
        });
      });
    }

    // Validation button in actionInfo
    if (actionInfo) {
      if (selectedPlayer) {
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Confirmer</button>`;
        const validateBtn = actionInfo.querySelector('.btn-validate-action');
        if (validateBtn) {
          validateBtn.addEventListener('click', () => {
            // Set up actionState before completing
            const roleData = this.rolesLoader.getRole('Renard');
            this.actionState = {
              roleId: 'Renard',
              action: 'sniff',
              roleName: roleData?.name || 'Renard',
              roleEmoji: roleData?.emoji || '🦊'
            };
            this.completeRoleAction();
          });
        }
      } else {
        actionInfo.innerHTML = 'Sélectionnez un joueur';
      }
    }
  }
,


  /**
   * Render Wolf kill selection
   * Select non-wolf player to kill (shows gray + skull on map)
   */
  renderWolfKillSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const players = this.gm.state.players || [];
    // Re-edition : si aucun choix courant, pre-selectionne la victime precedemment validee
    if ((!this.selectedPlayers || !this.selectedPlayers.length) && state && state.completed && state.result && Array.isArray(state.result.targets) && state.result.targets[0] && !String(state.result.targets[0]).startsWith('potion-')) {
      this.selectedPlayers = [state.result.targets[0]];
    }
    const selectedVictim = this.selectedPlayers[0] || null;
    const currentPlayerRole = this.rolesLoader.getRole(this.selectedRoleId);
    const protectedPlayers = this.getProtectedPlayers();

    console.log(`[MDJ] renderWolfKillSelection for ${this.selectedRoleId}:`);
    console.log(`[MDJ]   - Total players:`, players.map(p => ({ id: p.id, name: p.name, role: p.role })));
    console.log(`[MDJ]   - Dead players:`, Array.from(this.deadPlayerIds));
    console.log(`[MDJ]   - Protected players:`, Array.from(protectedPlayers).map(id => this.getPlayerName(id)));
    console.log(`[MDJ]   - Selected victim:`, selectedVictim);

    // For Loup_Garou_Blanc: show ONLY wolves
    // For other wolves: show only non-wolves (normal kill)
    // NOTE: Protected players ARE shown (with immunity indicator) - they just won't be recorded as dead
    let validTargets;
    if (this.selectedRoleId === 'Loup_Garou_Blanc') {
      // Blanc can only kill other wolves (that aren't dead, but protected can be shown with indicator)
      validTargets = players.filter(p =>
        (p.role.includes('Loup') || p.role.includes('Wolf'))
        && p.role !== 'Loup_Garou_Blanc'
        && !this.deadPlayerIds.has(p.id)
      );
      console.log(`[MDJ]   - Loup_Garou_Blanc mode: filtering for OTHER WOLVES only (excluding dead)`);
    } else {
      // Les loups (dont le Grand Méchant Loup) ne tuent QUE des non-loups vivants :
      // on exclut tout rôle loup ET tout joueur passé dans le camp Loup (ex: Enfant Sauvage transformé).
      validTargets = players.filter(p =>
        !this.deadPlayerIds.has(p.id)
        && !this.isWolfRoleId(p.role)
        && !p.role.includes('Loup')
        && !p.role.includes('Wolf')
        && p.camp !== 'Loup' && p.camp !== 'Loups'
      );
      console.log(`[MDJ]   - Normal wolf mode (${this.selectedRoleId}): filtering for NON-WOLVES only (excluding dead)`);
    }

    // Re-edition : reintegre la victime deja validee meme si elle apparait "morte" (mort due a CE choix)
    if (selectedVictim && !validTargets.some(p => p.id === selectedVictim)) {
      const _sv = players.find(p => p.id === selectedVictim);
      if (_sv) validTargets.push(_sv);
    }
    console.log(`[MDJ]   - Valid targets (after filtering dead and protected):`, validTargets.map(p => ({ id: p.id, name: p.name, role: p.role })));

    const playerListHtml = validTargets
      .map((player) => {
        const playerId = player.id;
        const isSelected = selectedVictim === playerId;
        const isProtected = protectedPlayers.has(playerId);
        const roleData = this.rolesLoader.getRole(player.role);

        return `
          <div class="role-action-btn kill-btn ${isSelected ? 'selected' : ''} ${isProtected ? 'protected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? bgColor : 'transparent'};
                      opacity: ${isProtected ? 0.8 : 1};">
            <span class="btn-emoji" style="opacity: ${isSelected ? 0.5 : 1};">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
            ${isProtected ? '<span class="immunity-indicator" style="margin-left: auto; font-size: 0.8rem; color: #FFD700; font-weight: bold;">🛡️ immunisé</span>' : ''}
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = playerListHtml;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        const wasSelected = this.selectedPlayers[0] === playerId;
        const prevSelection = this.selectedPlayers[0];

        // Toggle selection
        this.selectedPlayers = wasSelected ? [] : [playerId];

        console.log(`[MDJ] Wolf kill click:`);
        console.log(`[MDJ]   - Clicked playerId:`, playerId);
        console.log(`[MDJ]   - Was selected:`, wasSelected);
        console.log(`[MDJ]   - Previous selection:`, prevSelection);
        console.log(`[MDJ]   - New selection:`, this.selectedPlayers);

        // Setup actionState for validation
        if (this.selectedPlayers.length > 0) {
          const roleData = this.rolesLoader.getRole(this.selectedRoleId);
          this.actionState = {
            roleId: this.selectedRoleId,
            action: 'kill',
            roleName: roleData?.name || 'Loup',
            roleEmoji: roleData?.emoji || '🐺'
          };
          console.log(`[MDJ] Wolf kill - actionState set, ready to validate`);
        } else {
          this.actionState = {};
          console.log(`[MDJ] Wolf kill - selection cleared, actionState reset`);
        }

        this.renderActionButtons();
        console.log(`[MDJ] Wolf kill - calling renderLiveMap to restore colors immediately`);
        this.renderLiveMap(); // Full re-render to immediately restore old target colors
        console.log(`[MDJ] Wolf kill - calling updateMapForRole to apply visuals`);
        this.updateMapForRole();

        // Save after every wolf kill selection
        this.quickSave();
      });
    });

    if (actionInfo) {
      // Loup Blanc & Grand Méchant Loup peuvent choisir de NE PAS tuer
      const canSkip = this.selectedRoleId === 'Loup_Garou_Blanc' || this.selectedRoleId === 'Grand_Mechant_Loup';
      const skipBtn = canSkip ? `<button class="btn-skip-kill" style="width:100%; margin-top:6px; padding:10px; background:rgba(120,120,120,0.4); color:#fff; border:2px solid #999; border-radius:4px; cursor:pointer; font-weight:600; font-size:12px;">🚫 Ne tuer personne</button>` : '';
      if (selectedVictim) {
        actionInfo.innerHTML = `<button class="btn-validate-action">☠️ Tuer</button>${skipBtn}`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => {
          console.log(`[MDJ] Wolf kill validation - completing action for victim:`, selectedVictim);
          this.completeRoleAction();
        });
      } else {
        actionInfo.innerHTML = canSkip ? `<div style="margin-bottom:6px; color:#ccc; font-size:12px;">Choisis une cible, ou :</div>${skipBtn}` : 'Sélectionnez la victime';
      }
      // Handler "ne tuer personne"
      actionInfo.querySelector('.btn-skip-kill')?.addEventListener('click', () => {
        const rd = this.rolesLoader.getRole(this.selectedRoleId);
        this.selectedPlayers = [];
        this.actionState = { roleId: this.selectedRoleId, action: 'kill', roleName: rd?.name || 'Loup', roleEmoji: rd?.emoji || '🐺' };
        console.log(`[MDJ] ${this.selectedRoleId} choisit de ne tuer personne`);
        this.completeRoleAction();
      });
    }
  }
,


  /**
   * Render Sorciere potion selection
   * Show victim from Loups, select rescue or kill another player
   */
  renderSorciereSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const players = this.gm.state.players || [];
    const sorciereRole = this.rolesLoader.getRole('Sorciere') || {};
    const night = this.currentNight || 1;

    // ----- Inventaire persistant (sauvegardé à travers les tours) -----
    if (!this.gm.state.sorciereInv) this.gm.state.sorciereInv = { life: 1, death: 1 };
    if (!Array.isArray(this.gm.state.sorciereUsage)) this.gm.state.sorciereUsage = [];
    const inv = this.gm.state.sorciereInv;
    const usage = this.gm.state.sorciereUsage;

    // Victime des loups (première attaque)
    let victimId = null;
    for (const roleId of this.getWolfKillRoleIds()) {
      const st = this.roleStates[roleId];
      if (!st || !st.result || st.result.action !== 'kill') continue;
      const t = st.result.targets && st.result.targets[0];
      if (!t || !players.some(p => p.id === t)) continue;
      if (!victimId) victimId = t;
    }
    const victimName = victimId ? this.getPlayerName(victimId) : null;
    const protectedPlayers = this.getProtectedPlayers();
    const victimProtected = victimId && protectedPlayers.has(victimId);

    const lifeUsedThisNight = usage.find(u => u.type === 'life' && u.night === night);
    const deathUsedThisNight = usage.find(u => u.type === 'death' && u.night === night);

    const poisonOptions = players.filter(p => p.role !== 'Sorciere').map(p => {
      const dead = this.deadPlayerIds.has(p.id);
      const prot = protectedPlayers.has(p.id) ? ' (immunisé)' : '';
      return `<option value="${p.id}">${p.name}${dead ? ' (mort)' : ''}${prot}</option>`;
    }).join('');

    const usageHtml = usage.length
      ? usage.map(u => `<div style="font-size:11px; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.07);"><b>${u.type === 'life' ? '🧪 Vie' : '💀 Mort'}</b> → ${u.targetName} <span style="opacity:.6;">(Nuit ${u.night})</span></div>`).join('')
      : '<div style="opacity:.55; font-size:11px;">Aucune potion utilisée</div>';

    const stepBtn = 'border:none; border-radius:5px; width:30px; height:28px; font-weight:800; font-size:14px; cursor:pointer; color:#fff;';

    // ----- Bloc Potion de Vie -----
    let lifeBlock;
    if (lifeUsedThisNight) {
      lifeBlock = `<div style="display:flex; align-items:center; gap:8px;">
          <span style="flex:1; color:#9affb0; font-size:12px;">✔ Utilisée sur <b>${lifeUsedThisNight.targetName}</b></span>
          <button class="sorc-life-plus" title="Annuler (ce tour)" style="${stepBtn} background:rgba(90,120,200,0.8);">+1</button>
        </div>`;
    } else if (deathUsedThisNight) {
      lifeBlock = `<div style="font-size:11px; opacity:.55;">🚫 Une seule potion par nuit (Mort déjà utilisée)</div>`;
    } else if (inv.life > 0 && victimId) {
      lifeBlock = `<div style="display:flex; align-items:center; gap:8px;">
          <button class="sorc-life-minus" style="${stepBtn} background:rgba(90,170,110,0.9); width:auto; padding:0 10px;">−1 · Sauver ${victimName}${victimProtected ? ' (immunisé)' : ''}</button>
        </div>`;
    } else if (inv.life > 0) {
      lifeBlock = `<div style="font-size:11px; opacity:.6;">Aucune victime à sauver cette nuit</div>`;
    } else {
      lifeBlock = `<div style="font-size:11px; opacity:.6;">Plus de potion de vie</div>`;
    }

    // ----- Bloc Potion de Mort -----
    let deathBlock;
    if (deathUsedThisNight) {
      deathBlock = `<div style="display:flex; align-items:center; gap:8px;">
          <span style="flex:1; color:#ff9a9a; font-size:12px;">✔ Utilisée sur <b>${deathUsedThisNight.targetName}</b></span>
          <button class="sorc-death-plus" title="Annuler (ce tour)" style="${stepBtn} background:rgba(90,120,200,0.8);">+1</button>
        </div>`;
    } else if (lifeUsedThisNight) {
      deathBlock = `<div style="font-size:11px; opacity:.55;">🚫 Une seule potion par nuit (Vie déjà utilisée)</div>`;
    } else if (inv.death > 0) {
      deathBlock = `<div style="display:flex; gap:6px; align-items:center;">
          <select class="sorc-death-target" style="flex:1; padding:7px; background:rgba(30,30,60,0.9); color:#fff; border:1px solid #ff6666; border-radius:4px; font-size:12px;">
            <option value="">-- Empoisonner… --</option>
            ${poisonOptions}
          </select>
          <button class="sorc-death-minus" style="${stepBtn} background:rgba(190,80,80,0.9); width:auto; padding:0 10px;">−1</button>
        </div>`;
    } else {
      deathBlock = `<div style="font-size:11px; opacity:.6;">Plus de potion de mort</div>`;
    }

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color:#fff; font-size:0.78rem; margin-bottom:8px; padding:7px; background:rgba(0,0,0,0.3); border-radius:4px; border-left:3px solid ${bgColor};">
          <strong>💀 Victime des Loups :</strong>
          <span style="font-weight:bold; color:#ffaaaa;">${victimName || "personne"}${victimProtected ? " (immunisé)" : ""}</span>
        </div>

        <div style="background:rgba(80,160,110,0.12); border:1px solid rgba(120,220,150,0.35); border-radius:6px; padding:8px; margin-bottom:8px;">
          <div style="font-size:12px; font-weight:700; color:#9affb0; margin-bottom:6px;">🧪 Potion de Vie — reste : ${inv.life}</div>
          ${lifeBlock}
        </div>

        <div style="background:rgba(190,80,80,0.12); border:1px solid rgba(255,120,120,0.35); border-radius:6px; padding:8px; margin-bottom:8px;">
          <div style="font-size:12px; font-weight:700; color:#ff9a9a; margin-bottom:6px;">💀 Potion de Mort — reste : ${inv.death}</div>
          ${deathBlock}
        </div>

        <div style="background:rgba(0,0,0,0.22); border-radius:6px; padding:7px 9px;">
          <div style="font-size:11px; color:#81dff7; font-weight:700; margin-bottom:3px;">📜 Inventaire / usages</div>
          ${usageHtml}
        </div>
      </div>
    `;

    const rerender = () => {
      if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
      this.renderActionButtons();
      this.renderLiveMap();
      if (typeof this.renderLegend === 'function') this.renderLegend();
    };

    // Potion de Vie : −1 (sauver la victime)
    actionControls.querySelector('.sorc-life-minus')?.addEventListener('click', () => {
      if (inv.life <= 0 || !victimId || lifeUsedThisNight || deathUsedThisNight) return;
      this.deadPlayerIds.delete(victimId);
      if (this.deathCauses) delete this.deathCauses[victimId];
      inv.life -= 1;
      usage.push({ type: 'life', targetId: victimId, targetName: victimName, night });
      if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(victimId, 'Sauvé par la Sorcière (potion de vie)');
      rerender();
    });
    // Potion de Vie : +1 (annuler, ce tour uniquement)
    actionControls.querySelector('.sorc-life-plus')?.addEventListener('click', () => {
      if (!lifeUsedThisNight) return;
      this.deadPlayerIds.add(lifeUsedThisNight.targetId);
      if (this.deathCauses) this.deathCauses[lifeUsedThisNight.targetId] = 'wolf';
      inv.life += 1;
      const i = usage.indexOf(lifeUsedThisNight);
      if (i >= 0) usage.splice(i, 1);
      rerender();
    });

    // Potion de Mort : −1 (empoisonner la cible choisie)
    actionControls.querySelector('.sorc-death-minus')?.addEventListener('click', () => {
      if (inv.death <= 0 || deathUsedThisNight || lifeUsedThisNight) return;
      const sel = actionControls.querySelector('.sorc-death-target');
      const tgt = sel && sel.value;
      if (!tgt) { alert('Choisissez un joueur à empoisonner.'); return; }
      const tgtName = this.getPlayerName(tgt);
      this.deadPlayerIds.add(tgt);
      if (this.deathCauses) this.deathCauses[tgt] = 'poison';
      if (typeof this.checkCupidonCascadingDeath === 'function') this.checkCupidonCascadingDeath(tgt);
      inv.death -= 1;
      usage.push({ type: 'death', targetId: tgt, targetName: tgtName, night });
      if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(tgt, 'Empoisonné par la Sorcière');
      rerender();
      if (typeof this.checkVictoryNow === 'function') this.checkVictoryNow();
    });
    // Potion de Mort : +1 (annuler, ce tour uniquement)
    actionControls.querySelector('.sorc-death-plus')?.addEventListener('click', () => {
      if (!deathUsedThisNight) return;
      this.deadPlayerIds.delete(deathUsedThisNight.targetId);
      if (this.deathCauses) delete this.deathCauses[deathUsedThisNight.targetId];
      inv.death += 1;
      const i = usage.indexOf(deathUsedThisNight);
      if (i >= 0) usage.splice(i, 1);
      rerender();
    });

    // Bouton Terminer (valide le tour de la Sorcière sans re-appliquer d'effet)
    if (actionInfo) {
      actionInfo.innerHTML = `<button class="btn-validate-action">✓ Terminer le tour de la Sorcière</button>`;
      actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => {
        this.selectedPlayers = [];
        this.actionState = {
          roleId: 'Sorciere',
          action: 'sorciere-turn',
          roleName: sorciereRole.name || 'Sorcière',
          roleEmoji: sorciereRole.emoji || '🧙‍♀️'
        };
        this.completeRoleAction();
      });
    }
  }
,


  renderApprentiSorcierSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const players = this.gm.state.players || [];
    const rid = this.selectedRoleId || 'Custom_Apprenti_Sorcier';
    const role = this.rolesLoader.getRole(rid) || {};
    const night = this.currentNight || 1;

    // Inventaire persistant : 1 seule potion de MORT pour toute la partie
    if (!this.gm.state.apprentiInv) this.gm.state.apprentiInv = { death: 1 };
    if (!Array.isArray(this.gm.state.apprentiUsage)) this.gm.state.apprentiUsage = [];
    const inv = this.gm.state.apprentiInv;
    const usage = this.gm.state.apprentiUsage;

    const protectedPlayers = this.getProtectedPlayers();
    const self = players.find(p => p.role === rid);
    const poisonOptions = players.filter(p => p.id !== (self && self.id)).map(p => {
      const dead = this.deadPlayerIds.has(p.id);
      const prot = protectedPlayers.has(p.id) ? ' (immunise)' : '';
      return `<option value="${p.id}">${p.name}${dead ? ' (mort)' : ''}${prot}</option>`;
    }).join('');

    const deathUsedThisNight = usage.find(u => u.type === 'death' && u.night === night);
    const stepBtn = 'border:none;border-radius:5px;width:auto;padding:0 10px;height:28px;font-weight:800;font-size:14px;cursor:pointer;color:#fff;';

    let deathBlock;
    if (deathUsedThisNight) {
      deathBlock = `<div style="display:flex; align-items:center; gap:8px;">
          <span style="flex:1; color:#ff9a9a; font-size:12px;">✔ Utilisee sur <b>${deathUsedThisNight.targetName}</b></span>
          <button class="appr-death-plus" title="Annuler (ce tour)" style="${stepBtn} background:rgba(90,120,200,0.8);">+1</button>
        </div>`;
    } else if (inv.death > 0) {
      deathBlock = `<div style="display:flex; gap:6px; align-items:center;">
          <select class="appr-death-target" style="flex:1; padding:7px; background:rgba(30,30,60,0.9); color:#fff; border:1px solid #ff6666; border-radius:4px; font-size:12px;">
            <option value="">-- Empoisonner... --</option>
            ${poisonOptions}
          </select>
          <button class="appr-death-minus" style="${stepBtn} background:rgba(190,80,80,0.9);">−1</button>
        </div>`;
    } else {
      deathBlock = `<div style="font-size:11px; opacity:.6;">Plus de potion de mort (deja utilisee)</div>`;
    }

    const usageHtml = usage.length
      ? usage.map(u => `<div style="font-size:11px; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.07);"><b>\U0001F480 Mort</b> → ${u.targetName} <span style="opacity:.6;">(Nuit ${u.night})</span></div>`).join('')
      : '<div style="opacity:.55; font-size:11px;">Aucune potion utilisee</div>';

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color:#fff; font-size:0.78rem; margin-bottom:8px; padding:7px; background:rgba(0,0,0,0.3); border-radius:4px; border-left:3px solid ${bgColor};">
          \U0001F9EA <strong>Apprenti Sorcier</strong> — une seule potion de <b>MORT</b> pour toute la partie.
        </div>
        <div style="background:rgba(190,80,80,0.12); border:1px solid rgba(255,120,120,0.35); border-radius:6px; padding:8px; margin-bottom:8px;">
          <div style="font-size:12px; font-weight:700; color:#ff9a9a; margin-bottom:6px;">\U0001F480 Potion de Mort — reste : ${inv.death}</div>
          ${deathBlock}
        </div>
        <div style="background:rgba(0,0,0,0.22); border-radius:6px; padding:7px 9px;">
          <div style="font-size:11px; color:#81dff7; font-weight:700; margin-bottom:3px;">\U0001F4DC Usage</div>
          ${usageHtml}
        </div>
      </div>
    `;

    const rerender = () => {
      if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
      this.renderActionButtons();
      this.renderLiveMap();
      if (typeof this.renderLegend === 'function') this.renderLegend();
    };

    actionControls.querySelector('.appr-death-minus')?.addEventListener('click', () => {
      if (inv.death <= 0 || deathUsedThisNight) return;
      const sel = actionControls.querySelector('.appr-death-target');
      const tgt = sel && sel.value;
      if (!tgt) { alert('Choisissez un joueur a empoisonner.'); return; }
      const tgtName = this.getPlayerName(tgt);
      this.deadPlayerIds.add(tgt);
      if (this.deathCauses) this.deathCauses[tgt] = 'poison';
      if (typeof this.checkCupidonCascadingDeath === 'function') this.checkCupidonCascadingDeath(tgt);
      inv.death -= 1;
      usage.push({ type: 'death', targetId: tgt, targetName: tgtName, night });
      if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(tgt, "Empoisonne par l'Apprenti Sorcier");
      rerender();
      if (typeof this.checkVictoryNow === 'function') this.checkVictoryNow();
    });

    actionControls.querySelector('.appr-death-plus')?.addEventListener('click', () => {
      if (!deathUsedThisNight) return;
      this.deadPlayerIds.delete(deathUsedThisNight.targetId);
      if (this.deathCauses) delete this.deathCauses[deathUsedThisNight.targetId];
      inv.death += 1;
      const i = usage.indexOf(deathUsedThisNight);
      if (i >= 0) usage.splice(i, 1);
      rerender();
    });

    if (actionInfo) {
      actionInfo.innerHTML = `<button class="btn-validate-action">✓ Terminer le tour de l'Apprenti</button>`;
      actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => {
        this.selectedPlayers = [];
        this.actionState = { roleId: rid, action: 'apprenti-turn', roleName: role.name || 'Apprenti Sorcier', roleEmoji: role.emoji || '\U0001F9EA' };
        this.completeRoleAction();
      });
    }
  }
,


  /**
   * Render Corbeau player selection
   * Select player, changes background to dark navy on map
   */
  renderCorbeauSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const selectedPlayer = this.selectedPlayers[0] || null;
    const corbeauRole = this.rolesLoader.getRole('Corbeau');
    const corbeauBorderColor = corbeauRole?.visual?.affectedColor?.borderColor || bgColor;

    // Filter out dead players AND Corbeau himself (can't steal votes against himself)
    const alivePlayers = this.playerRegistry.getAlive().filter(p => p.role !== 'Corbeau');

    const playerListHtml = alivePlayers
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedPlayer === playerId;
        const roleData = this.rolesLoader.getRole(player.role);

        return `
          <div class="role-action-btn ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? corbeauBorderColor : 'transparent'};">
            <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
          </div>
        `;
      })
      .join('');

    actionControls.innerHTML = playerListHtml;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        this.selectedPlayers = this.selectedPlayers[0] === playerId ? [] : [playerId];

        // Setup actionState for validation
        if (this.selectedPlayers.length > 0) {
          const roleData = this.rolesLoader.getRole('Corbeau');
          this.actionState = {
            roleId: 'Corbeau',
            action: 'steal_votes',
            roleName: roleData?.name || 'Corbeau',
            roleEmoji: roleData?.emoji || '🐦‍⬛'
          };
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      if (selectedPlayer) {
        actionInfo.innerHTML = `<button class="btn-validate-action">🗳️ Donner 2 votes contre</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Sélectionnez un joueur';
      }
    }
  }
,
  renderGenericTargetSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const roleData = this.rolesLoader.getRole(this.selectedRoleId) || {};
    const blocks = roleData.actions ? Object.values(roleData.actions) : [];
    let count = 1, effectType = null;
    for (const b of blocks) {
      if (b && typeof b === 'object') {
        if (effectType === null && b.type) effectType = b.type;
        if (b.targets && typeof b.targets.count === 'number') { count = b.targets.count; break; }
      }
    }
    const mdjBtn = roleData.actions && roleData.actions.mdj_night_actions && roleData.actions.mdj_night_actions[0];
    const actionLabel = (mdjBtn && mdjBtn.label) || roleData.pouvoir || 'Designer une cible';
    const _deadly = new Set(['kill','hunt','huntSelectively','extraKill','bonusKill']);
    const actionId = _deadly.has(effectType) ? 'kill' : ((mdjBtn && mdjBtn.id) || effectType || 'generic');
    const affColor = (roleData.visual && roleData.visual.affectedColor && roleData.visual.affectedColor.borderColor) || bgColor;

    const alive = this.playerRegistry.getAlive().filter(p => p.role !== this.selectedRoleId);
    let selected = this.selectedPlayers.filter(id => !String(id).startsWith('potion-'));

    const list = alive.map(p => {
      const isSel = selected.includes(p.id);
      const rd = this.rolesLoader.getRole(p.role);
      return `
        <div class="role-action-btn ${isSel ? 'selected' : ''}" data-player-id="${p.id}"
             style="background: ${isSel ? bgColor + '30' : 'rgba(255,255,255,0.08)'}; border: 2px solid ${isSel ? affColor : 'transparent'};">
          <span class="btn-emoji">${rd?.emoji || '?'}</span>
          <span class="btn-name">${p.name}</span>
        </div>`;
    }).join('');

    actionControls.innerHTML = `
      <div style="color:#cfcfe0; font-size:0.72rem; margin-bottom:8px; padding:6px; background:rgba(0,0,0,0.25); border-radius:4px; border-left:3px solid ${bgColor};">
        ${actionLabel}${count > 1 ? ` <b>(${count} cibles)</b>` : ''}
      </div>
      ${list || '<div style="color:#888; font-size:0.7rem;">Aucune cible disponible</div>'}
    `;

    actionControls.querySelectorAll('.role-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.playerId;
        let sel = this.selectedPlayers.filter(x => !String(x).startsWith('potion-'));
        if (sel.includes(id)) sel = sel.filter(x => x !== id);
        else { if (sel.length >= count) sel.shift(); sel.push(id); }
        this.selectedPlayers = sel;
        this.actionState = sel.length > 0
          ? { roleId: this.selectedRoleId, action: actionId, roleName: roleData.name, roleEmoji: roleData.emoji }
          : {};
        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      actionInfo.innerHTML = selected.length > 0
        ? `<button class="btn-validate-action">✓ Valider</button>`
        : 'Selectionnez une cible';
      actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => this.completeRoleAction());
    }
  }
,
  renderVoleurSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const roleData = this.rolesLoader.getRole('Voleur') || {};
    const sel = this.selectedPlayers.find(t => !String(t).startsWith('potion-'));
    const targetName = sel ? this.getPlayerName(sel) : null;
    actionControls.innerHTML = `
      <div style="color:#cfcfe0; font-size:0.75rem; margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.25); border-radius:4px; border-left:3px solid ${bgColor};">
        Le Voleur echange son role avec un joueur au hasard.
      </div>
      <button class="role-action-btn voleur-random" style="background:${bgColor}30; border:2px solid ${bgColor};">
        <span class="btn-emoji">🎲</span><span class="btn-name">Voler un role au hasard</span>
      </button>
      ${targetName ? `<div style="margin-top:8px; color:#9ee6b0; font-size:0.8rem; text-align:center;">Echange avec <b>${targetName}</b></div>` : ''}
    `;
    actionControls.querySelector('.voleur-random')?.addEventListener('click', () => {
      const ps = this.gm.state.players || [];
      const candidates = ps.filter(p => p.role !== 'Voleur' && !this.deadPlayerIds.has(p.id));
      if (candidates.length === 0) return;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      this.selectedPlayers = [pick.id];
      this.actionState = { roleId: 'Voleur', action: 'roleSwap', roleName: roleData.name || 'Voleur', roleEmoji: roleData.emoji || '🦝' };
      this.renderActionButtons();
      this.updateMapForRole();
    });
    if (actionInfo) {
      actionInfo.innerHTML = sel ? `<button class="btn-validate-action">✓ Valider l'echange</button>` : 'Cliquez pour tirer au hasard';
      actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => this.completeRoleAction());
    }
  }
,
  renderRecognitionSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const roleData = this.rolesLoader.getRole(this.selectedRoleId) || {};
    const group = (this.gm.state.players || []).filter(p => p.role === this.selectedRoleId);
    const names = group.map(p => `
      <div style="padding:7px 10px; margin:5px 0; background:${bgColor}25; border:1px solid ${bgColor}; border-radius:6px; font-weight:700; color:#fff;">
        ${roleData.emoji || '👥'} ${p.name}${this.deadPlayerIds.has(p.id) ? ' (mort)' : ''}
      </div>`).join('');
    actionControls.innerHTML = `
      <div style="color:#cfcfe0; font-size:0.82rem; margin-bottom:10px; font-weight:600;">👀 Réveillez-vous et reconnaissez-vous :</div>
      <div style="font-size:0.7rem; color:#9aa; margin-bottom:6px;">(${roleData.name || this.selectedRoleId} — info Maître du Jeu)</div>
      ${names || '<div style="color:#888;">Seul membre de ce groupe</div>'}
    `;
    if (actionInfo) {
      actionInfo.innerHTML = `<button class="btn-validate-action">✓ Reconnaissance faite</button>`;
      actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => {
        this.actionState = { roleId: this.selectedRoleId, action: 'recognition', roleName: roleData.name, roleEmoji: roleData.emoji };
        this.completeRoleAction();
      });
    }
  }
,


  /**
   * Complete role action
   * Generic handler for all role types
   * Clears selection and transitions to next role
   * Map effects persist until next role is selected
   */
  /**
   * Complete Cupidon action with selected lovers
   */
  completeCupidonAction() {
    const _rid = this.selectedRoleId || 'Cupidon';
    const _cnt = (this.rolesLoader.getRole(_rid) || {}).loverCount || 2;
    if (this.selectedPlayers.length !== _cnt) return;

    const players = this.gm.state.players || [];
    const _roleName = (this.rolesLoader.getRole(_rid) || {}).name || 'Cupidon';
    const loverIds = this.selectedPlayers.slice();
    const loverNames = loverIds.map(id => (players.find(p => p.id === id) || {}).name || '?');

    // Log action
    if (this.logger && typeof this.logger.logAction === 'function') {
      this.logger.logAction('💘 ' + _roleName, 'a lié les amoureux', loverNames);
    }

    // Mark role as completed
    if (this.roleStates[_rid]) {
      this.roleStates[_rid].completed = true;
      this.roleStates[_rid].result = {
        action: 'lover',
        targets: loverIds.slice()  // Store IDs not names!
      };
    }
    if (typeof this.logPlayerEvent === 'function') {
      loverIds.forEach(id => this.logPlayerEvent(id, 'Désigné amoureux par ' + _roleName));
    }
    const lover1Name = loverNames[0] || '?';
    const lover2Name = loverNames.slice(1).join(' & ') || '?';

    // Clear selections & role state, but KEEP map effects visible
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedRoleId = null;

    // Re-render (effects on map persist for visual feedback)
    this.renderRoleListbox();
    this.renderActionButtons();

    console.log('[MDJ] Cupidon completed with lovers:', lover1Name, 'and', lover2Name);

    // Check if all roles are done - night summary will display if complete
    this.checkIfNightComplete();
  }
,


  /**
   * Get available actions for a specific role from JSON
   * @param {string} roleId
   * @returns {Array}
   */
  getActionsForRole(roleId) {
    const roleData = this.rolesLoader.getRole(roleId);
    if (!roleData || !roleData.actions) {
      return [];
    }
    // Return actions from mdj_night_actions field (defined in JSON)
    return roleData.actions.mdj_night_actions || [];
  }
,


  /**
   * Handle action button selection
   * @param {string} actionId
   */
  handleActionSelect(actionId) {
    if (!this.selectedRoleId) return;

    const roleData = this.rolesLoader.getRole(this.selectedRoleId);

    console.log(
      `[MDJ] Action selected: ${this.selectedRoleId} -> ${actionId}`
    );

    // Clear previous selections and set action state
    this.selectedPlayers = [];
    this.actionState = {
      roleId: this.selectedRoleId,
      action: actionId,
      roleName: roleData.name,
      roleEmoji: roleData.emoji
    };

    // Get target count for this action
    const targetCount = this.getTargetCountForAction(this.selectedRoleId, actionId);
    this.actionState.targetCount = targetCount;

    // Re-render action buttons to show validate button
    this.renderActionButtons();
  }
,


  /**
   * Get required target count for an action
   * @param {string} roleId
   * @param {string} actionId
   * @returns {number}
   */
  getTargetCountForAction(roleId, actionId) {
    const targetConfig = {
      'Cupidon-lover': 2,
      'Enfant_Sauvage-idol': 1,
      'Chien_Loup-join_wolves': 0,
      'Chien_Loup-stay_villager': 0,
      'Voyante-see_role': 1,
      'Salvateur-protect': 1,
      'Renard-sniff': 1,
      'Sorciere-resurrect': 1,
      'Sorciere-poison': 1,
      'Corbeau-steal_votes': 1
    };

    return targetConfig[`${roleId}-${actionId}`] || 0;
  }
,


  /**
   * Handle player card click
   * @param {string} playerName
   * @param {string} playerIndex
   * @param {HTMLElement} playerCard
   */
  /**
   * Handle direct clicks on player circles on the map
   * Supports both old (playerName, playerIndex, playerCard) and new (playerId) signatures
   */
  handlePlayerClick(playerNameOrId, playerIndex, playerCard) {
    if (!this.actionState.action && !this.selectedRoleId) {
      console.warn('[MDJ] No action or role selected');
      return;
    }

    // Find the player - support both playerId and playerName
    const players = this.gm.state.players || [];
    let targetPlayer = null;

    if (playerCard) {
      // Old signature: (playerName, playerIndex, playerCard)
      targetPlayer = players[playerIndex];
    } else {
      // New signature: (playerId)
      targetPlayer = players.find(p => p.id === playerNameOrId);
    }

    if (!targetPlayer) {
      console.warn('[MDJ] Player not found');
      return;
    }

    const targetCount = this.actionState.targetCount || 0;

    // Toggle player selection
    const isSelected = this.selectedPlayers.includes(targetPlayer.id);

    if (isSelected) {
      this.selectedPlayers = this.selectedPlayers.filter(p => p !== targetPlayer.id);
    } else {
      if (targetCount > 0 && this.selectedPlayers.length >= targetCount) {
        console.warn(`[MDJ] Cannot select more than ${targetCount} player(s)`);
        return;
      }
      this.selectedPlayers.push(targetPlayer.id);
    }

    this.updateSelectedDisplay();
    this.renderActionButtons();
    this.updateMapForRole();

    // Save after every player selection
    this.quickSave();

    // Check if we have enough selections
    if (targetCount === 0) {
      this.completeRoleAction();
    } else if (this.selectedPlayers.length === targetCount) {
      // Show complete button
      this.showCompleteButton();
    }
  }
,


  /**
   * Update the selected players display (LEGACY - kept for compatibility)
   * NOTE: Role-specific renderers now handle selection display via renderActionButtons()
   * This method does nothing if #selected-display element doesn't exist
   */
  updateSelectedDisplay() {
    const display = document.getElementById('selected-display');

    // Guard: If element doesn't exist, skip update
    // Role-specific renderers are handling display via renderActionButtons()
    if (!display) {
      return;
    }

    if (!this.actionState.action) {
      display.innerHTML = '';
      return;
    }

    const targetCount = this.actionState.targetCount;
    const selectedCount = this.selectedPlayers.length;

    const html = `
      <div class="selection-info">
        <p><strong>${this.actionState.roleEmoji} ${this.actionState.roleName}</strong></p>
        <p>Sélectionnés: ${selectedCount}/${targetCount}</p>
        ${
          this.selectedPlayers.length > 0
            ? `<div class="selected-list">
          ${this.selectedPlayers.map(p => `<span class="tag">${p}</span>`).join('')}
        </div>`
            : ''
        }
        ${
          targetCount > 0 && selectedCount === targetCount
            ? `<button class="btn btn-success complete-action-btn">✓ Confirmer</button>`
            : targetCount === 0
              ? `<button class="btn btn-success complete-action-btn">✓ Complété</button>`
              : ''
        }
      </div>
    `;

    display.innerHTML = html;

    // Attach complete button handler
    const completeBtn = display.querySelector('.complete-action-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeRoleAction());
    }
  }
,


  /**
   * Get friendly label for an action
   * @param {string} actionId
   * @returns {string}
   */
  getActionLabel(actionId) {
    const labels = {
      lover: 'a colorer les amoureux',
      idol: 'a désigner l\'idole',
      join_wolves: 'a choisi de devenir Loup',
      stay_villager: 'a choisi de rester Villageois',
      see_role: 'a vu le rôle',
      protect: 'a protégé',
      sniff: 'a reniflé',
      resurrect: 'a ressuscité',
      poison: 'a empoisonné',
      steal_votes: 'a volé des votes'
    };
    return labels[actionId] || 'a complété';
  }

});
