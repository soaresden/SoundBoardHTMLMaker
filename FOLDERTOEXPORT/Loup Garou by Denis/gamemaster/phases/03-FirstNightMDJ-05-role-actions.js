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

    actionControls.innerHTML = playerListHtml;

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
      if (selectedLovers.length === 2) {
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
        actionInfo.innerHTML = `Sélectionnez 2 joueurs (${selectedLovers.length}/2)`;
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
    const index = this.selectedPlayers.indexOf(playerKey);
    if (index >= 0) {
      // Deselect
      this.selectedPlayers.splice(index, 1);
    } else {
      // Select (max 2)
      if (this.selectedPlayers.length < 2) {
        this.selectedPlayers.push(playerKey);
      }
    }

    // Setup actionState for validation (if not already set)
    if (!this.actionState.roleId) {
      const roleData = this.rolesLoader.getRole('Cupidon');
      this.actionState = {
        roleId: 'Cupidon',
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
      // Normal wolves kill non-wolves (no other wolves, no dead players, but protected can be shown with indicator)
      validTargets = players.filter(p =>
        !p.role.includes('Loup')
        && !p.role.includes('Wolf')
        && !this.deadPlayerIds.has(p.id)
      );
      console.log(`[MDJ]   - Normal wolf mode (${this.selectedRoleId}): filtering for NON-WOLVES only (excluding dead)`);
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
      if (selectedVictim) {
        actionInfo.innerHTML = `<button class="btn-validate-action">☠️ Tuer</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click', () => {
          console.log(`[MDJ] Wolf kill validation - completing action for victim:`, selectedVictim);
          this.completeRoleAction();
        });
      } else {
        actionInfo.innerHTML = 'Sélectionnez la victime';
      }
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
    const sorciereRole = this.rolesLoader.getRole('Sorciere');
    console.log('[MDJ] Sorciere role data:', sorciereRole);
    const actions = sorciereRole?.actions?.mdj_night_actions || [];
    const resurrectIcon = actions.find(a => a.id === 'resurrect')?.icon || '💚';
    const poisonIcon = actions.find(a => a.id === 'poison')?.icon || '💜';

    // Get protected players for indicator
    const protectedPlayers = this.getProtectedPlayers();

    // Get victim from wolf pack kill (FIRST victim = the one killed by Simple_Loup_Garou)
    let victimName = '???';
    let victimId = null;
    let firstWolfKill = null;

    console.log('[MDJ] Sorciere - roleStates keys:', Object.keys(this.roleStates));
    console.log('[MDJ] Sorciere - Simple_Loup_Garou state:', this.roleStates['Simple_Loup_Garou']?.result);
    console.log('[MDJ] Sorciere - Grand_Mechant_Loup state:', this.roleStates['Grand_Mechant_Loup']?.result);

    // Check all wolves in order - take FIRST kill (Simple_Loup_Garou kills first in sequence)
    for (const roleId of this.getWolfKillRoleIds()) {
      const st = this.roleStates[roleId];
      if (!st?.result || st.result.action !== 'kill') continue; // ignorer Chien-Loup (join_wolves) etc.
      const t = st.result.targets && st.result.targets[0];
      if (!t || !players.some(p => p.id === t)) continue;       // doit etre un vrai joueur
      if (!firstWolfKill) {
        firstWolfKill = { roleId, victimId: t };
        console.log(`[MDJ] Sorciere - Found firstWolfKill from ${roleId}:`, t);
      }
    }
    if (firstWolfKill) {
      victimId = firstWolfKill.victimId;
      const player = players.find(p => p.id === victimId);
      if (player) victimName = player.name;
      console.log(`[MDJ] Sorciere - Victim:`, victimName, victimId);
    } else {
      console.log('[MDJ] Sorciere - NO WOLF KILL FOUND!');
    }

    const selectedAction = this.selectedPlayers[0];
    const selectedKillTarget = this.selectedPlayers[1] || null;

    // Ensure victimName is a real name, not an ID
    const hasVictim = !!victimId;
    const displayVictimName = hasVictim ? this.getPlayerName(victimId) : "Personne n'est mort cette nuit";

    // Check if victim is protected (immunisé)
    const isVictimProtected = victimId && protectedPlayers.has(victimId);
    const protectionLabel = isVictimProtected ? ' <span style="color: #ff9999; font-weight: bold;">(immunisé)</span>' : '';

    // Potion de VIE: seulement s'il y a une victime ET si elle n'a pas deja ete utilisee
    const lifePotionHtml = (hasVictim && !this.sorciereLifeUsed) ? `
        <button class="potion-btn life-potion ${selectedAction === 'potion-life' ? 'selected' : ''}" style="background: ${selectedAction === 'potion-life' ? bgColor + '50' : bgColor + '30'}; border: 2px solid ${bgColor};">
          ${resurrectIcon} Potion Vie - La sauver
        </button>` : '';

    // Potion de MORT: combobox seulement si pas deja utilisee
    const poisonHtml = (!this.sorcierePoisonUsed) ? `
        <div style="color: #aaa; font-size: 0.7rem; margin: 8px 0; text-align: center;">─── ou ───</div>
        <div style="color: white; font-size: 0.75rem; margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          Empoisonner un joueur:
        </div>
        <select class="sorciere-kill-combobox" style="width: 100%; padding: 8px; font-size: 0.85rem; background: rgba(30,30,60,0.9); color: #fff; border: 2px solid #ff6666; border-radius: 4px; font-weight: bold;">
          <option value="">-- Choisir un joueur --</option>
          ${(() => {
            const poisonTargets = this.gm.state.players.filter(p => {
              if (p.role === 'Sorciere') return false;
              const isAlive = !this.deadPlayerIds.has(p.id);
              const isTonightWolfVictim = victimId && p.id === victimId;
              return isAlive || isTonightWolfVictim;
            });
            return poisonTargets.map(p => {
              const isProtected = protectedPlayers.has(p.id);
              const protectedLabel = isProtected ? ' (immunisé)' : '';
              const isSelected = selectedAction === 'potion-death' && selectedKillTarget === p.id;
              return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${p.name}${protectedLabel}</option>`;
            }).join('');
          })()}
        </select>` : '';

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color: white; font-size: 0.8rem; margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; border-left: 3px solid ${bgColor};">
          <strong>💀 Victime des Loups:</strong><br>
          <span style="font-size: 0.9rem; font-weight: bold; color: #ffaaaa;">${displayVictimName}${protectionLabel}</span>
        </div>

        ${lifePotionHtml}

        <button class="potion-btn do-nothing-btn ${selectedAction === 'do-nothing' ? 'selected' : ''}" style="background: ${selectedAction === 'do-nothing' ? 'rgba(100,100,100,0.5)' : 'rgba(100,100,100,0.3)'}; border: 2px solid #999;">
          ⏭️ Ne rien faire
        </button>
        ${poisonHtml}
      </div>
    `;

    // Life potion button - save the victim
    actionControls.querySelector('.life-potion')?.addEventListener('click', () => {
      this.selectedPlayers = ['potion-life'];

      // Setup actionState for validation
      this.actionState = {
        roleId: 'Sorciere',
        action: 'resurrect',
        roleName: sorciereRole?.name || 'Sorciere',
        roleEmoji: sorciereRole?.emoji || '🧙‍♀️'
      };

      this.renderActionButtons();

      // Restore victim's original colors and add resurrection border
      if (victimId) {
        const mdjMap = document.getElementById('mdj-live-map');
        if (mdjMap) {
          const victimPoint = mdjMap.querySelector(`[data-player-id="${victimId}"]`);
          if (victimPoint) {
            const victimPlayer = players.find(p => p.id === victimId);
            if (victimPlayer) {
              const victimRole = this.rolesLoader.getRole(victimPlayer.role);

              // Restore normal colors (remove grayscale/dead effect)
              victimPoint.style.filter = 'none';
              victimPoint.style.opacity = '1';

              // Restore emoji
              const emoji = victimPoint.querySelector('.mdj-point-emoji');
              if (emoji) {
                emoji.textContent = victimRole?.emoji || '❓';
                emoji.style.color = victimRole?.visual?.roleColor?.emojiColor || 'inherit';
                emoji.style.opacity = '1';
              }

              // Add green border for resurrection
              const dot = victimPoint.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', '#00ff00'); // Green border
                victimPoint.classList.add('affected');
              }

              console.log(`[MDJ] 🧙‍♀️ Sorciere resurrection - restored ${victimPlayer.name} with green border`);
            }
          }
        }
      }

      // Save after Sorciere life potion action
      this.quickSave();
    });

    // Do-nothing button
    actionControls.querySelector('.do-nothing-btn')?.addEventListener('click', () => {
      this.selectedPlayers = ['do-nothing'];

      // Setup actionState for validation
      this.actionState = {
        roleId: 'Sorciere',
        action: 'skip',
        roleName: sorciereRole?.name || 'Sorciere',
        roleEmoji: sorciereRole?.emoji || '🧙‍♀️'
      };

      this.renderActionButtons();
      console.log(`[MDJ] 🧙‍♀️ Sorciere: Ne rien faire`);

      // Save after Sorciere action
      this.quickSave();
    });

    // Combobox for kill selection
    const combobox = actionControls.querySelector('.sorciere-kill-combobox');
    if (combobox) {
      combobox.addEventListener('change', () => {
        const playerId = combobox.value;
        if (!playerId) {
          this.selectedPlayers = [];
          this.renderActionButtons();
          return;
        }

        const playerName = this.getPlayerName(playerId);
        console.log(`[MDJ] 🧙‍♀️ Sorciere: ${playerName} selected for poison`);

        // RESTORE PREVIOUS VICTIM FROM RESURRECTION (if they had Potion Vie)
        if (victimId && this.selectedPlayers[0] === 'potion-life') {
          const mdjMap = document.getElementById('mdj-live-map');
          if (mdjMap) {
            const victimPoint = mdjMap.querySelector(`[data-player-id="${victimId}"]`);
            if (victimPoint && this.deadPlayerIds.has(victimId)) {
              // Victim is actually dead, restore grayscale + skull
              victimPoint.style.filter = 'grayscale(100%) brightness(0.5)';
              victimPoint.style.opacity = '0.6';

              const emoji = victimPoint.querySelector('.mdj-point-emoji');
              if (emoji) {
                emoji.textContent = '💀';
                emoji.style.opacity = '0.6';
              }

              const dot = victimPoint.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', 'transparent');
              }
              victimPoint.classList.remove('affected');

              console.log(`[MDJ] 🧙‍♀️ Sorciere - restored ${this.getPlayerName(victimId)} to dead state`);
            }
          }
        }

        this.selectedPlayers = ['potion-death', playerId];
        console.log(`[MDJ] 🧙‍♀️ Sorciere selectedPlayers: poison → ${playerName}`);

        // Setup actionState for validation
        this.actionState = {
          roleId: 'Sorciere',
          action: 'poison',
          roleName: sorciereRole?.name || 'Sorciere',
          roleEmoji: sorciereRole?.emoji || '🧙‍♀️'
        };

        this.renderActionButtons();
        this.updateMapForRole();
        console.log(`[MDJ] 🧙‍♀️ Sorciere visuals applied for ${playerName}`);

        // Save after Sorciere death potion selection
        this.quickSave();
      });
    }

    if (actionInfo) {
      if (this.selectedPlayers.length > 0) {
        // CRITICAL: Check for do-nothing action (must use different label)
        let buttonLabel = '✓ Utiliser Mort';
        if (this.selectedPlayers[0] === 'potion-life') {
          buttonLabel = '✓ Utiliser Vie';
        } else if (this.selectedPlayers[0] === 'do-nothing') {
          buttonLabel = '✓ Valider ne rien faire';
        }
        actionInfo.innerHTML = `<button class="btn-validate-action">${buttonLabel}</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Sélectionnez une potion';
      }
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
    if (this.selectedPlayers.length !== 2) return;

    const players = this.gm.state.players || [];
    // selectedPlayers now contains player IDs like "player_0", "player_1"
    const lover1 = players.find(p => p.id === this.selectedPlayers[0]);
    const lover2 = players.find(p => p.id === this.selectedPlayers[1]);
    const lover1Name = lover1?.name || '?';
    const lover2Name = lover2?.name || '?';

    // Log action
    if (this.logger && typeof this.logger.logAction === 'function') {
      this.logger.logAction('💘 Cupidon', 'a lié les amoureux', [lover1Name, lover2Name]);
    }

    // Mark role as completed
    if (this.roleStates['Cupidon']) {
      this.roleStates['Cupidon'].completed = true;
      this.roleStates['Cupidon'].result = {
        action: 'lover',
        targets: [lover1.id, lover2.id]  // Store IDs not names!
      };
    }

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
