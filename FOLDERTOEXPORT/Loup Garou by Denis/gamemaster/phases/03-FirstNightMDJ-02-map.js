// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  renderLiveMap() {
    const mapContainer = document.getElementById('mdj-live-map');
    if (!mapContainer) return;

    this.renderVictoryBar();

    console.log(`[MDJ] renderLiveMap called - mayorId: ${this.mayorId}`);

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};


    // Récupérer les positions
    if (!this.gm.state.playerPositions) {
      this.gm.state.playerPositions = {};
    }

    // Afficher les joueurs avec leur rôle (couleur + emoji du JSON)
    // Disposition "piste de course" - joueurs sur les bords, noms à l'opposé, équidistant
    const playerPoints = players.map((p, idx) => {
      let x, y, nameTop, nameLeft;

      if (p.tableX !== undefined && p.tableY !== undefined) {
        x = p.tableX;
        y = p.tableY;
        nameTop = p.nameTop || '30px';
        nameLeft = p.nameLeft || '-40px';
      } else {
        const tableSize = 340; // Logical size; CSS will scale it - increased for better spacing
        const perimeter = 2 * (tableSize + tableSize);
        const playerSpacing = perimeter / players.length;
        const pos = idx * playerSpacing;

        // Place players around the perimeter
        let textAlign = 'center';

        if (pos < tableSize) {
          // TOP edge: left to right
          x = pos;
          y = 0;
          // All TOP positions: label goes BELOW and CENTERED
          if (pos < 50) {
            // TOP-LEFT corner: label goes bottom-right diagonal
            x = Math.max(30, pos);
            y = 15;
            nameTop = '22px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (pos > tableSize - 50) {
            // TOP-RIGHT corner: label goes bottom-left diagonal
            x = Math.min(tableSize - 30, pos);
            y = 15;
            nameTop = '22px';
            nameLeft = '-44px';
            textAlign = 'right';
          } else {
            // TOP middle: label centered below
            nameTop = '22px';
            nameLeft = '-28px';
            textAlign = 'center';
          }
        } else if (pos < tableSize * 2) {
          // RIGHT edge: top to bottom
          x = tableSize - 20;
          y = pos - tableSize;
          const yPos = y;
          // All RIGHT positions: label goes LEFT
          if (yPos < 50) {
            // TOP-RIGHT corner: label goes bottom-left diagonal
            x = tableSize - 30;
            y = Math.max(15, yPos);
            nameTop = '16px';
            nameLeft = '-42px';
            textAlign = 'right';
          } else if (yPos > tableSize - 50) {
            // BOTTOM-RIGHT corner: label goes top-left diagonal
            x = tableSize - 30;
            y = Math.min(tableSize - 15, yPos);
            nameTop = '-34px';
            nameLeft = '-42px';
            textAlign = 'right';
          } else {
            // RIGHT middle: label goes left, centered vertically
            nameTop = '-8px';
            nameLeft = '-42px';
            textAlign = 'right';
          }
        } else if (pos < tableSize * 3) {
          // BOTTOM edge: right to left
          x = tableSize - (pos - tableSize * 2);
          y = tableSize;
          // All BOTTOM positions: label goes ABOVE and CENTERED
          if (x < 50) {
            // BOTTOM-LEFT corner: label goes top-right diagonal
            x = Math.max(30, x);
            y = tableSize - 15;
            nameTop = '-34px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (x > tableSize - 50) {
            // BOTTOM-RIGHT corner: label goes top-left diagonal
            x = Math.min(tableSize - 30, x);
            y = tableSize - 15;
            nameTop = '-34px';
            nameLeft = '-44px';
            textAlign = 'right';
          } else {
            // BOTTOM middle: label centered above
            nameTop = '-34px';
            nameLeft = '-28px';
            textAlign = 'center';
          }
        } else {
          // LEFT edge: bottom to top
          x = 0;
          y = tableSize - (pos - tableSize * 3);
          const yPos = y;
          // All LEFT positions: label goes RIGHT
          if (yPos < 50) {
            // TOP-LEFT corner: label goes bottom-right diagonal
            x = 30;
            y = Math.max(15, yPos);
            nameTop = '16px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (yPos > tableSize - 50) {
            // BOTTOM-LEFT corner: label goes top-right diagonal
            x = 30;
            y = Math.min(tableSize - 15, yPos);
            nameTop = '-34px';
            nameLeft = '6px';
            textAlign = 'left';
          } else {
            // LEFT middle: label goes right, centered vertically
            nameTop = '-8px';
            nameLeft = '6px';
            textAlign = 'left';
          }
        }

        p.tableX = x;
        p.tableY = y;
        p.nameTop = nameTop;
        p.nameLeft = nameLeft;
        p.textAlign = textAlign;
      }

      // Récupérer les infos du rôle assigné
      const roleData = rolesData[p.role] || {};
      const emoji = roleData.emoji || '❓';
      const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
      const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';
      const affectedBorderColor = roleData.visual?.affectedColor?.borderColor || 'transparent';


      // Check if this player has the currently selected role (for breathing effect)
      // When Simple_Loup_Garou is called, ALL wolves breathe together
      // For other roles, each role breathes independently
      let isCurrentRole = p.role === this.selectedRoleId;

      if (this.selectedRoleId === 'Simple_Loup_Garou') {
        // ALL wolves breathe when wolves are deciding on victim
        // EXCEPT Chien_Loup if they chose to stay villager
        // EXCEPT dead wolves - don't breathe if dead
        const isChienLoupStayVillager = p.role === 'Chien_Loup' &&
          this.roleStates['Chien_Loup']?.result?.targets?.includes('stay_villager');
        const isDead = this.deadPlayerIds.has(p.id);

        isCurrentRole = !isDead && !isChienLoupStayVillager && p.role && (p.role.includes('Loup') || p.role.includes('Wolf'));
        if (isCurrentRole) {
          console.log(`[MDJ] 🐺 Wolf pack breathing for: ${p.name} (${p.role})`);
        }
      } else if (p.role === this.selectedRoleId) {
        console.log(`[MDJ] 🫁 Breathing for: ${p.name} (${p.role}) - selectedRoleId: ${this.selectedRoleId}`);
        isCurrentRole = true;
      } else {
        // Debug: show why breathing not applied
        if (p.role === 'Cupidon' || this.selectedRoleId === 'Cupidon') {
          console.log(`[MDJ] DEBUG Cupidon: p.role=${p.role}, selectedRoleId=${this.selectedRoleId}, match=${p.role === this.selectedRoleId}`);
        }
      }

      const isDead = this.deadPlayerIds.has(p.id);
      const deadStyle = isDead ? 'filter: grayscale(100%) brightness(0.5); opacity: 0.6;' : '';

      const isMayor = this.mayorId && this.mayorId === p.id;
      if (isMayor) {
        console.log(`[MDJ] 🎖️ MAYOR BADGE: ${p.name} (${p.id}) - mayorId: ${this.mayorId}`);
      }
      const displayName = isMayor ? `🎖️ ${p.name}` : p.name;

      // Badge "tueur" : emoji de la cause de mort, affiche a cote du mort
      const killerEmojiMap = { wolf: '🐺', poison: '🧙‍♀️', lynch: '🪓', chasseur: '🏹', chevalier: '⚔️', love: '💔' };
      const killerEmoji = isDead ? (killerEmojiMap[this.deathCauses && this.deathCauses[p.id]] || '') : '';
      const killerBadge = killerEmoji
        ? `<span class="mdj-killer-badge" title="Tué par : ${this.deathCauses[p.id]}" style="position:absolute; top:-9px; right:-9px; font-size:12px; line-height:1; background:rgba(0,0,0,0.75); border:1px solid rgba(255,255,255,0.25); border-radius:50%; padding:2px; z-index:5; filter:none; opacity:1;">${killerEmoji}</span>`
        : '';

      return `
        <div class="mdj-player-point ${isCurrentRole ? 'breathing' : ''}" data-player-id="${p.id}" data-player-name="${p.name}" data-original-emoji="${emoji}"
             style="left: ${x}px; top: ${y}px; position: absolute; ${deadStyle}">
          <div class="mdj-point-dot" style="background: ${bgColor}; --affected-border: ${affectedBorderColor}; position: relative;">
            <span class="mdj-point-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
            ${killerBadge}
            <span class="mdj-point-name" style="top: ${nameTop}; left: ${nameLeft}; text-align: ${p.textAlign};">${isDead ? '💀' : ''} ${displayName}</span>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="mdj-map-container">
        <div class="mdj-table-visual">
          <div class="mdj-table-center">🪵</div>
          <div class="mdj-table-rim"></div>
          ${playerPoints}
        </div>
      </div>
    `;

    mapContainer.innerHTML = html;
  }
,


  /**
   * Render legend showing all players with their emoji and color
   * Shows 🎖️ medal next to mayor's name
   * Shows (Role) for dead players
   */
  renderLegend() {
    const legendContainer = document.getElementById('mdj-legend');
    if (!legendContainer) return;

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};

    const legendItems = players.map(p => {
      const roleData = rolesData[p.role] || {};
      const emoji = roleData.emoji || '❓';
      const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
      const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';
      const textColor = roleData.visual?.roleColor?.textColor || '#ffffff';
      const isMayor = this.mayorId && this.mayorId === p.id;
      const isDead = this.deadPlayerIds.has(p.id);
      const roleName = roleData.name || p.role;

      const displayName = isDead
        ? `${isMayor ? '🎖️ ' : ''}${p.name} (${roleName})`
        : `${isMayor ? '🎖️ ' : ''}${p.name}`;

      return `
        <div class="legend-item">
          <div class="legend-dot" style="background: ${bgColor}; ${isDead ? 'opacity: 0.5;' : ''}">
            <span class="legend-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
          </div>
          <span class="legend-name">${displayName}</span>
        </div>
      `;
    }).join('');

    legendContainer.innerHTML = `
      <div class="legend-title">📋 Légende</div>
      <div class="legend-grid">
        ${legendItems}
      </div>
    `;
  }
,


  /**
   * Restore map to original state (no effects)
   */
  /**
   * Restore effects from completed roles
   */
  restoreCompletedRoleEffects() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    const players = this.gm.state.players || [];

    // Check each completed role and restore its effects
    Object.entries(this.roleStates).forEach(([roleId, state]) => {
      if (!state.completed || !state.result) return;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return;

      // Re-apply effects based on role type and result
      if (roleId === 'Cupidon' && state.result.targets && state.result.targets.length >= 2) {
        // Restore lover bordures (pink/red)
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Cupidon - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}`);

        const lovers = players.filter(p =>
          state.result.targets.includes(p.id)
        );
        lovers.forEach(lover => {
          const point = mdjMap.querySelector(`[data-player-id="${lover.id}"]`);
          if (point && borderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        });
      }

      if (roleId === 'Enfant_Sauvage' && state.result.targets && state.result.targets.length > 0) {
        // Restore idol bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Enfant_Sauvage - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const idol = players.find(p =>
          state.result.targets.includes(p.id)
        );
        if (idol && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${idol.id}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        }
      }

      if (roleId === 'Salvateur' && state.result.targets && state.result.targets.length > 0) {
        // Restore protected player bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Salvateur - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const protected_player = players.find(p =>
          state.result.targets.includes(p.id)
        );
        if (protected_player && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${protected_player.id}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        }
      }

      // CRITICAL: Corbeau border disappears each day (borderLifetime: "next_night")
      // Only restore if it's the same night it was placed (don't persist overnight)
      if (roleId === 'Corbeau' && state.result.targets && state.result.targets.length > 0) {
        // Check if borderLifetime says it should disappear next night
        const borderLifetime = roleData?.borderLifetime;

        // Only restore Corbeau border if it's being placed THIS night (borderLifetime: next_night means it disappears at day)
        // Don't restore old Corbeau borders from previous nights
        if (borderLifetime !== 'next_night' || this.currentNight === 1) {
          // Safe to restore (either no lifetime set, or it's Night 1 first placement)
          const borderColor = roleData?.visual?.affectedColor?.borderColor;
          const emojiColor = roleData?.visual?.roleColor?.emojiColor;
          const bgColor = roleData?.visual?.roleColor?.fondColor;
          console.log(`[MDJ] Corbeau - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

          const victim = players.find(p =>
            state.result.targets.includes(p.id)
          );
          if (victim && borderColor) {
            const point = mdjMap.querySelector(`[data-player-id="${victim.id}"]`);
            if (point) {
              point.classList.add('affected');
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', borderColor);
              }
            }
          }
        } else {
          console.log(`[MDJ] Corbeau border NOT restored - borderLifetime: "${borderLifetime}" (disappears at day)`);
        }
      }

      // Handle Voyante target bordure
      if (roleId === 'Voyante' && state.result.targets && state.result.targets.length > 0) {
        // Restore Voyante's target bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Voyante - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const target = players.find(p =>
          state.result.targets.includes(p.id)
        );
        console.log('[MDJ] Voyante restore - target:', target?.name || 'NOT FOUND', 'targets array:', state.result.targets);

        if (target && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${target.id}"]`);
          console.log('[MDJ] Voyante restore - querySelector for', target.id, ':', point ? '✓ FOUND' : '✗ NOT FOUND');

          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
              console.log('[MDJ] Voyante restore - applied border color:', borderColor);
            }
          }
        } else {
          console.log('[MDJ] Voyante restore - SKIPPED: target=' + (target?.name || 'null'), 'borderColor=' + borderColor);
        }
      }

      // Handle Chien_Loup emoji change (join_wolves)
      if (roleId === 'Chien_Loup' && state.result.targets && state.result.targets.includes('join_wolves')) {
        const chienLoup = players.find(p => p.role === 'Chien_Loup');
        if (chienLoup) {
          const point = mdjMap.querySelector(`[data-player-id="${chienLoup.id}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji) {
              emoji.textContent = '🐺';
              console.log('[MDJ] Restored Chien_Loup emoji to 🐺');
            }
          }
        }
      }

      // NOTE: Renard borders should ONLY show during selection, not persist as completed effect
      // So we don't restore them here - they are cleared when role changes
      // This ensures Renard borders only appear during Renard's turn

      // Handle Wolf kills (Simple_Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc)
      if ((roleId === 'Simple_Loup_Garou' || roleId === 'Grand_Mechant_Loup' || roleId === 'Loup_Garou_Blanc')
          && state.result.targets && state.result.targets.length > 0) {
        console.log(`[MDJ] ${roleId} restore - killed players:`, state.result.targets);

        state.result.targets.forEach(victimName => {
          const victim = players.find(p => p.name === victimName);
          if (victim) {
            const point = mdjMap.querySelector(`[data-player-id="${victim.id}"]`);
            console.log(`[MDJ] ${roleId} restore - querySelector for killed ${victim.id}:`, point ? '✓ FOUND' : '✗ NOT FOUND');

            if (point) {
              point.classList.add('killed');
              const emoji = point.querySelector('.mdj-point-emoji');
              if (emoji && !point.dataset.originalEmoji) {
                point.dataset.originalEmoji = emoji.textContent;
              }
              if (emoji) {
                emoji.textContent = '💀';
                emoji.style.opacity = '0.6';
                console.log(`[MDJ] ${roleId} restore - applied skull to ${victim.id}`);
              }
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.filter = 'grayscale(100%)';
                dot.style.opacity = '0.6';
              }
            }
          }
        });
      }
    });
  }
,


  restoreMapState() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};

    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      // Remove all effect classes
      point.classList.remove('affected', 'killed', 'darkened');

      // Restore original emoji and styles
      const playerId = point.dataset.playerId;
      const player = players.find(p => p.id === playerId);
      if (player) {
        const roleData = rolesData[player.role] || {};
        const originalEmoji = roleData.emoji || '❓';
        const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
        const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';

        const emoji = point.querySelector('.mdj-point-emoji');
        if (emoji) {
          emoji.textContent = originalEmoji;
          emoji.style.color = emojiColor;
          emoji.style.opacity = '1';
        }

        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.background = bgColor;
          dot.style.filter = 'none';
          dot.style.opacity = '1';
          dot.style.setProperty('--affected-border', 'transparent');
        }
      }
    });
  }
,


  /**
   * Update map visualization for selected role's effects
   * Handles visual feedback for various roles
   */
  updateMapForRole() {
    // Need to restore visuals even if selectedPlayers is empty (for preview deselection)
    // But skip entirely if no role selected
    if (!this.selectedRoleId) {
      return;
    }

    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    // Get list of players affected by completed roles - DON'T CLEAR THEM
    const playersWithCompletedEffects = new Set();
    const players = this.gm.state.players || [];

    Object.entries(this.roleStates).forEach(([roleId, state]) => {
      if (!state.completed || !state.result) return;

      if (roleId === 'Cupidon' && state.result.targets) {
        // Add Cupidon's lovers to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Enfant_Sauvage' && state.result.targets) {
        // Add Enfant_Sauvage's idol to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Salvateur' && state.result.targets) {
        // Add Salvateur's protected player to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Corbeau' && state.result.targets) {
        // Add Corbeau's victim to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Voyante' && state.result.targets) {
        // Add Voyante's target to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      // NOTE: Renard borders should ONLY show during selection, not as completed effect
      // So we don't add Renard's neighbors to playersWithCompletedEffects
    });

    // Only clear states from players who don't have completed role effects
    // AND are not part of current selection
    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      const pointPlayerId = point.dataset.playerId;

      // Don't touch if has completed role effect OR is selected for current role
      const hasCompletedEffect = playersWithCompletedEffects.has(pointPlayerId);
      const isSelectedForCurrentRole = this.selectedPlayers.includes(pointPlayerId);

      if (!hasCompletedEffect && !isSelectedForCurrentRole) {
        point.classList.remove('affected', 'killed', 'darkened');
        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.setProperty('--affected-border', 'transparent');
        }
        
        // Restore dead player visual state (grayscale) if needed
        const isDead = this.deadPlayerIds.has(pointPlayerId);
        if (isDead) {
          point.style.filter = 'grayscale(100%) brightness(0.5)';
          point.style.opacity = '0.6';
        } else {
          point.style.filter = 'none';
          point.style.opacity = '1';
        }
      }
    });

    // Apply role-specific visual effects
    switch(this.selectedRoleId) {
      default: {
        // [STANDARDISATION] Comportement par defaut (ex-cases Cupidon/Enfant_Sauvage/Salvateur):
        //  bordure affectedColor du role courant sur les joueurs selectionnes.
        // Border color effect - use the CURRENT ROLE's affectedColor, not the player's role
        const currentRoleData = this.rolesLoader.getRole(this.selectedRoleId);
        const borderColor = currentRoleData?.visual?.affectedColor?.borderColor || 'inherit';

        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        });
        break;
      }

      case 'Voyante':
        // Apply border color from Voyante's affectedColor to selected target
        const voyanteRole = this.rolesLoader.getRole('Voyante');
        const voyanteBorderColor = voyanteRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Voyante preview - detection de visual affected colors: border color ${voyanteBorderColor ? '✓ ' + voyanteBorderColor : '✗ NOT FOUND'}`);

        // Clear borders ONLY for players that don't have completed role effects
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
          if (!playersWithCompletedEffects.has(playerId) && !this.selectedPlayers.includes(playerId)) {
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', 'transparent');
            }
          }
        });

        // Apply border to selected players (but NOT if they have completed role effects)
        this.selectedPlayers.forEach(playerId => {
          // Don't apply Voyante border if player already has completed role effect (Salvateur, idol, etc)
          if (playersWithCompletedEffects.has(playerId)) {
            console.log(`[MDJ] Voyante - skipping border for ${playerId} (already has completed role effect)`);
            return;
          }
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point && voyanteBorderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', voyanteBorderColor);
            }
          }
        });
        break;

      case 'Renard':
        // Apply borders to selected player + left and right neighbors (3 total)
        const renardRole = this.rolesLoader.getRole('Renard');
        const renardBorderColor = renardRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Renard preview - detection de visual affected colors: border color ${renardBorderColor ? '✓ ' + renardBorderColor : '✗ NOT FOUND'}`);

        if (this.selectedPlayers.length > 0 && renardBorderColor) {
          const selectedPlayerId = this.selectedPlayers[0];
          const selectedPlayerObj = players.find(p => p.id === selectedPlayerId);

          if (selectedPlayerObj) {
            const selectedIdx = players.indexOf(selectedPlayerObj);
            const leftIdx = (selectedIdx - 1 + players.length) % players.length;
            const rightIdx = (selectedIdx + 1) % players.length;

            const neighborIds = [
              selectedPlayerId, // center
              players[leftIdx].id, // left
              players[rightIdx].id  // right
            ];

            console.log(`[MDJ] Renard preview - applying border to 3 neighbors: center=${selectedPlayerId}, left=${players[leftIdx].id}, right=${players[rightIdx].id}`);

            // Clear borders ONLY for players that don't have completed role effects
            mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
              const playerId = point.dataset.playerId;
              // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
              if (!playersWithCompletedEffects.has(playerId) && !neighborIds.includes(playerId)) {
                const dot = point.querySelector('.mdj-point-dot');
                if (dot && !point.classList.contains('killed')) {
                  dot.style.setProperty('--affected-border', 'transparent');
                }
              }
            });

            // Apply to neighbors
            neighborIds.forEach(neighborId => {
              const point = mdjMap.querySelector(`[data-player-id="${neighborId}"]`);
              if (point) {
                point.classList.add('affected');
                const dot = point.querySelector('.mdj-point-dot');
                if (dot) {
                  dot.style.setProperty('--affected-border', renardBorderColor);
                }
              }
            });
          }
        }
        break;

      case 'Simple_Loup_Garou':
      case 'Grand_Mechant_Loup':
      case 'Loup_Garou_Blanc':
        const selectedNames = this.selectedPlayers.map(id => this.getPlayerName(id)).join(', ');
        console.log(`[MDJ] 🐺 Selected to kill: ${selectedNames || '(none)'}`);

        // Restore emojis for non-selected players
        mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
          const playerId = point.dataset.playerId;
          const isSelected = this.selectedPlayers.includes(playerId);

          if (!isSelected) {
            point.classList.remove('killed');
            const emoji = point.querySelector('.mdj-point-emoji');
            const originalEmoji = point.dataset.originalEmoji;
            if (emoji && originalEmoji) {
              emoji.textContent = originalEmoji;
              emoji.style.opacity = '1';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'none';
              dot.style.opacity = '1';
            }
          }
        });

        // Kill effect: gray + skull
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            // SAVE ORIGINAL EMOJI BEFORE CHANGING IT
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji && !point.dataset.originalEmoji) {
              point.dataset.originalEmoji = emoji.textContent;
            }

            point.classList.add('killed');
            if (emoji) {
              emoji.textContent = '💀';
              emoji.style.opacity = '0.6';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'grayscale(100%)';
              dot.style.opacity = '0.6';
            }
          }
        });
        break;

      case 'Corbeau':
        // Apply border color from JSON affectedColor (only border, no background change)
        const corbeauRole = this.rolesLoader.getRole('Corbeau');
        const corbeauBorderColor = corbeauRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Corbeau preview - detection de visual affected colors: border color ${corbeauBorderColor ? '✓ ' + corbeauBorderColor : '✗ NOT FOUND'}`);

        // Clear borders ONLY for players that don't have completed role effects
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
          if (!playersWithCompletedEffects.has(playerId) && !this.selectedPlayers.includes(playerId)) {
            point.classList.remove('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', 'transparent');
            }
          }
        });

        // Apply border to selected players
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point && corbeauBorderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', corbeauBorderColor);
            }
          }
        });
        break;

      case 'Sorciere':
        const sorciereRole = this.rolesLoader.getRole('Sorciere');
        const sorciereBorderColor = sorciereRole?.visual?.affectedColor?.borderColor || 'rgba(255,255,255,0.5)';

        // Find kill target (second element if action is 'potion-death')
        const killTargetId = this.selectedPlayers.length > 1 && this.selectedPlayers[0] === 'potion-death' ? this.selectedPlayers[1] : null;
        const killTargetName = killTargetId ? this.getPlayerName(killTargetId) : null;

        if (killTargetId) {
          console.log(`[MDJ] 🧙‍♀️ Sorciere: poison → ${killTargetName}`);

          // Clear all killed states first
          mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
            const playerId = point.dataset.playerId;
            if (playerId !== killTargetId) {
              point.classList.remove('killed');
              const emoji = point.querySelector('.mdj-point-emoji');
              const originalEmoji = point.dataset.originalEmoji;
              if (emoji && originalEmoji) {
                emoji.textContent = originalEmoji;
                emoji.style.opacity = '1';
              }
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.filter = 'none';
                dot.style.opacity = '1';
              }
            }
          });

          // Apply kill effect to selected target
          const point = mdjMap.querySelector(`[data-player-id="${killTargetId}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji && !point.dataset.originalEmoji) {
              point.dataset.originalEmoji = emoji.textContent;
            }
            point.classList.add('killed', 'affected');
            if (emoji) {
              emoji.textContent = '💀';
              emoji.style.opacity = '0.6';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'grayscale(100%)';
              dot.style.opacity = '0.6';
              dot.style.setProperty('--affected-border', sorciereBorderColor);
            }
          }
        } else {
          // Clear all killed states if not poisoning
          mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
            const emoji = point.querySelector('.mdj-point-emoji');
            const originalEmoji = point.dataset.originalEmoji;
            if (emoji && originalEmoji) {
              emoji.textContent = originalEmoji;
              emoji.style.opacity = '1';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'none';
              dot.style.opacity = '1';
              dot.style.setProperty('--affected-border', 'transparent');
            }
            point.classList.remove('killed', 'affected');
          });
        }
        break;
    }
  }
,


  /**
   * Update map visualization for Cupidon's selected lovers
   * Uses Cupidon's affectedColor for border
   */
  updateMapForCupidon() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    // Get Cupidon's affectedColor for border
    const cupidonRole = this.rolesLoader.getRole('Cupidon');
    const cupidonBorderColor = cupidonRole?.visual?.affectedColor?.borderColor || 'rgba(255,255,255,0.5)';

    // Apply affected state to selected lovers with Cupidon's color
    this.selectedPlayers.forEach(playerKey => {
      const point = mdjMap.querySelector(`[data-player-id="${playerKey}"]`);
      if (point) {
        point.classList.add('affected');
        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.setProperty('--affected-border', cupidonBorderColor);
        }
      }
    });

    // IMPORTANT: Do NOT clear other role effects!
    // Other completed roles' borders should remain visible alongside Cupidon's selection
    console.log('[MDJ] Cupidon map updated - preserving other role borders');
  }

});
