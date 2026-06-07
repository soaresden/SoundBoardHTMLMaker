// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  /**
   * Render the role listbox with breathing animation on current role
   * IMPORTANT: Shows all night-active roles in order (01, 02, 03, ...)
   */
  /**
   * Get night summary HTML with comboboxes for special deaths
   * Includes Montreur_Ours growl detection
   */
  getNightSummaryHtml() {
    const players = this.gm.state.players || [];
    const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id));
    const deadPlayers = players.filter(p => this.deadPlayerIds.has(p.id));

    // Check for dead Chasseur and Chevalier
    const deadChaseur = deadPlayers.find(p => p.role === 'Chasseur');
    const deadChevalier = deadPlayers.find(p => p.role === 'Chevalier_Epee_Rouille');

    // Check for Montreur_Ours and detect wolves nearby
    const montreurOursPlayer = alivePlayers.find(p => p.role === 'Montreur_Ours');
    let montreurOursHtml = '';

    if (montreurOursPlayer) {
      // Find the bear's position in the players array to check left and right neighbors
      const idx = players.findIndex(p => p.id === montreurOursPlayer.id);
      const leftIdx = idx === 0 ? players.length - 1 : idx - 1;
      const rightIdx = idx === players.length - 1 ? 0 : idx + 1;

      // Check for wolves (skip dead players between)
      let leftNeighbor = players[leftIdx];
      let rightNeighbor = players[rightIdx];

      // Skip dead players to find alive neighbors
      let leftWolfIdx = leftIdx;
      while (this.deadPlayerIds.has(players[leftWolfIdx].id) && leftWolfIdx !== idx) {
        leftWolfIdx = leftWolfIdx === 0 ? players.length - 1 : leftWolfIdx - 1;
      }

      let rightWolfIdx = rightIdx;
      while (this.deadPlayerIds.has(players[rightWolfIdx].id) && rightWolfIdx !== idx) {
        rightWolfIdx = rightWolfIdx === players.length - 1 ? 0 : rightWolfIdx + 1;
      }

      leftNeighbor = players[leftWolfIdx];
      rightNeighbor = players[rightWolfIdx];

      const leftIsWolf = leftNeighbor && !this.deadPlayerIds.has(leftNeighbor.id) &&
                         (leftNeighbor.role?.includes('Loup') || leftNeighbor.role?.includes('Wolf'));
      const rightIsWolf = rightNeighbor && !this.deadPlayerIds.has(rightNeighbor.id) &&
                          (rightNeighbor.role?.includes('Loup') || rightNeighbor.role?.includes('Wolf'));

      const hasWolfNearby = leftIsWolf || rightIsWolf;
      const growlText = hasWolfNearby
        ? '🐻 L\'ours du Montreur d\'Ours grogne ! Ça sent le loup !'
        : '🐻 Ça ne grogne pas, pas de loup à proximité de l\'ours';

      montreurOursHtml = `
        <div style="padding:12px; background:rgba(139,69,19,0.2); border:2px solid #8B4513; border-radius:6px; margin-bottom:12px;">
          <h4 style="margin:0 0 8px 0; color:#D2B48C; font-size:12px;">${growlText}</h4>
        </div>
      `;
    }

    let html = '';

    // Chasseur revenge kill
    if (deadChaseur) {
      const validTargets = alivePlayers.filter(p => p.role && (p.role.includes('Loup') || p.role.includes('Wolf')));
      html += `
        <div style="padding:12px; background:rgba(210,180,140,0.2); border:2px solid #D4A574; border-radius:6px; margin-bottom:12px;">
          <h4 style="margin:0 0 8px 0; color:#D4A574; font-size:12px;">🏹 ${deadChaseur.name} (Chasseur) - Vengeance</h4>
          <p style="margin:0 0 8px 0; color:#ddd; font-size:11px;">Le Chasseur peut tirer avant sa mort</p>
          <select id="chasseur-target" style="width:100%; padding:6px; background:#333; color:#fff; border:1px solid #666; border-radius:3px; font-size:11px;">
            <option value="">-- Sélectionner une cible --</option>
            ${validTargets.map(p => {
              const roleData = this.rolesLoader.getRole(p.role);
              return `<option value="${p.id}">${p.name} (${roleData?.name || p.role})</option>`;
            }).join('')}
          </select>
        </div>
      `;
    }

    // Chevalier death curse
    if (deadChevalier) {
      const wolvesAlive = alivePlayers.filter(p => p.role && (p.role.includes('Loup') || p.role.includes('Wolf')));
      const leftWolf = wolvesAlive.length > 0 ? wolvesAlive[0].name : '?';
      html += `
        <div style="padding:12px; background:rgba(255,215,0,0.15); border:2px solid #FFD700; border-radius:6px; margin-bottom:12px;">
          <h4 style="margin:0 0 8px 0; color:#FFD700; font-size:12px;">⚔️ ${deadChevalier.name} (Chevalier) - Malédiction</h4>
          <p style="margin:0 0 8px 0; color:#ddd; font-size:11px;">Le loup à sa gauche (${leftWolf}) mourra demain matin</p>
        </div>
      `;
    }

    // Montreur_Ours growl detection
    html += montreurOursHtml;

    // Lynch combobox
    const nonWolves = alivePlayers.filter(p => !p.role || (!p.role.includes('Loup') && !p.role.includes('Wolf')));
    html += `
      <div style="padding:12px; background:rgba(150,100,200,0.2); border:2px solid #9966CC; border-radius:6px;">
        <h4 style="margin:0 0 8px 0; color:#9966CC; font-size:12px;">🪓 Vote du Village - Au Bûcher!</h4>
        <p style="margin:0 0 8px 0; color:#ddd; font-size:11px;">Qui sera exécuté aujourd'hui?</p>
        <select id="lynch-target" style="width:100%; padding:6px; background:#333; color:#fff; border:1px solid #666; border-radius:3px; font-size:11px;">
          <option value="">-- Sélectionner une victime --</option>
          ${nonWolves.map(p => {
            const roleData = this.rolesLoader.getRole(p.role);
            return `<option value="${p.id}">${p.name} (${roleData?.name || 'Villageois'})</option>`;
          }).join('')}
        </select>
      </div>
    `;

    return html;
  }
,


  /**
   * Disable the role listbox (gray it out, no interactions)
   */
  disableRoleListbox() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;

    // Gray out and disable interactions
    listbox.style.opacity = '0.5';
    listbox.style.pointerEvents = 'none';
    listbox.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
  }
,


  /**
   * Render Night Summary - Shows completed actions and deaths
   * IMPORTANT: Blue zone (listbox) remains unchanged - just disable clicks
   */
  renderNightSummary() {
    console.log(`[MDJ] 🌙 renderNightSummary() called`);
    const listbox = document.getElementById('role-listbox');

    if (!listbox) return;

    // Simply disable clicks on blue zone - do NOT modify its content
    this.disableRoleListbox();

    // UPDATE RIGHT PANEL WITH NIGHT SUMMARY
    const titleBig = document.getElementById('action-title-big');
    const actionControls = document.getElementById('action-controls');
    const actionInfo = document.getElementById('action-info');

    if (titleBig) {
      // CRITICAL: Show correct night number (currentNight, not hardcoded Nuit 1)
      titleBig.innerHTML = `🌙 Résumé Nuit ${this.currentNight}`;
      titleBig.style.background = '#1a3a52';
    }

    if (actionControls) {
      actionControls.innerHTML = `
        <div style="padding:12px; color:#ccc; font-size:12px;">
          ${this.getNightSummaryHtml()}
        </div>
      `;
    }

    if (actionInfo) {
      actionInfo.innerHTML = `
        <button id="night-summary-btn-lynch" class="btn-validate-action"
                style="width:100%; padding:12px; background:#ff6b00; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600; font-size:12px;">
          🪓 Au Bûcher!
        </button>
      `;
      // Add event listeners for combobox changes (update avatar on selection)
      const chasseurSelect = document.getElementById('chasseur-target');
      const lynchSelect = document.getElementById('lynch-target');

      const updateAvatarForCombobox = (selectElement) => {
        const victimId = selectElement.value;
        if (!victimId) return;

        const mdjMap = document.getElementById('mdj-live-map');
        if (!mdjMap) return;

        const victimPoint = mdjMap.querySelector(`[data-player-id="${victimId}"]`);
        if (victimPoint) {
          // Add killed visual state
          victimPoint.classList.add('killed');
          const emoji = victimPoint.querySelector('.mdj-point-emoji');
          if (emoji && !victimPoint.dataset.originalEmoji) {
            victimPoint.dataset.originalEmoji = emoji.textContent;
          }
          if (emoji) {
            emoji.textContent = '💀';
            emoji.style.opacity = '0.6';
          }
          const dot = victimPoint.querySelector('.mdj-point-dot');
          if (dot) {
            dot.style.filter = 'grayscale(100%)';
            dot.style.opacity = '0.6';
          }
          console.log(`[MDJ] Avatar updated - ${this.getPlayerName(victimId)} marked for death`);
        }
      };

      if (chasseurSelect) {
        chasseurSelect.addEventListener('change', () => updateAvatarForCombobox(chasseurSelect));
      }
      if (lynchSelect) {
        lynchSelect.addEventListener('change', () => updateAvatarForCombobox(lynchSelect));
      }

      // Servante Devouee prend le role d'un mort
      const servanteSelect = document.getElementById('servante-take-target');
      if (servanteSelect) {
        servanteSelect.addEventListener('change', () => {
          const deadId = servanteSelect.value;
          if (!deadId) return;
          const ps = this.gm.state.players || [];
          const servantePlayer = ps.find(p => p.role === 'Servante_Devouee' && !this.deadPlayerIds.has(p.id));
          const deadP = ps.find(p => p.id === deadId);
          if (servantePlayer && deadP) {
            this.transformations[servantePlayer.id] = { from: 'Servante_Devouee', to: deadP.role, reason: `reprend le role de ${deadP.name}` };
            servantePlayer.role = deadP.role;
            console.log(`[MDJ] Servante ${servantePlayer.name} reprend le role de ${deadP.name}`);
            this.renderLiveMap();
            this.quickSave?.();
          }
        });
      }

      // Reassignation du maire si le maire meurt cette nuit
      const mayorReassignSelect = document.getElementById('mayor-reassign-target');
      if (mayorReassignSelect) {
        mayorReassignSelect.addEventListener('change', () => {
          const newMayorId = mayorReassignSelect.value;
          if (!newMayorId) return;
          this.mayorId = newMayorId;
          console.log(`[MDJ] Maire reassigne a ${this.getPlayerName(newMayorId)}`);
          this.renderLiveMap();
          this.quickSave?.();
        });
      }

      const lynchBtn = actionInfo.querySelector('#night-summary-btn-lynch');
      if (lynchBtn) {
        lynchBtn.addEventListener('click', () => {
          const lynchSelect = document.getElementById('lynch-target');
          const victimId = lynchSelect?.value;

          if (!victimId) {
            alert('Veuillez sélectionner une victime!');
            return;
          }

          console.log('[MDJ] Lynch execution for:', victimId);

          // Check if LYNCHED VICTIM is Chasseur - he can shoot before dying!
          const players = this.gm.state.players || [];
          const lynchVictim = players.find(p => p.id === victimId);
          const chasseurTargetSelect = document.getElementById('chasseur-target');

          // CRITICAL: If victim is Chasseur and has not shot yet, let him shoot first!
          if (lynchVictim && lynchVictim.role === 'Chasseur' && !this.chasseurHasShot && chasseurTargetSelect) {
            const chasseurTargetId = chasseurTargetSelect.value;
            if (chasseurTargetId && chasseurTargetId !== '') {
              // Chasseur shoots first (only ONE shot per game!)
              console.log(`[MDJ] 🏹 ${lynchVictim.name} (Chasseur) shoots before dying: ${this.getPlayerName(chasseurTargetId)}`);
              this.deadPlayerIds.add(chasseurTargetId);
              // CRITICAL: Mark the cause of death for Chasseur's victim
              this.deathCauses[chasseurTargetId] = 'chasseur';
              this.chasseurHasShot = true; // CRITICAL: Mark that Chasseur used his only shot
              // CRITICAL: Check for cascading Cupidon death (if target is a lover)
              this.checkCupidonCascadingDeath(chasseurTargetId);
            }
          }

          // Execute lynch
          this.executeLynch(victimId);
        });
      }
    }
  }
,


  /**
   * Start mayor election at beginning of first night
   * Zone bleue: Liste EXHAUSTIVE de tous les joueurs
   * Zone rose: Formulaire d'élection (change à chaque sélection)
   */
  startMayorElection() {
    const listbox = document.getElementById('role-listbox');
    const titleBig = document.getElementById('action-title-big');
    const actionControls = document.getElementById('action-controls');
    const actionInfo = document.getElementById('action-info');

    if (!listbox) return;

    const players = this.gm.state.players || [];

    // ZONE BLEUE: ALL players (exhaustive list)
    // Dead players grayed out but still selectable
    const playerListHtml = players
      .map(p => {
        const roleData = this.rolesLoader.getRole(p.role);
        const isDead = this.deadPlayerIds.has(p.id);
        const isSelected = this.selectedMayorId === p.id;

        return `
          <div class="listbox-item ${isSelected ? 'selected' : ''}"
               data-player-id="${p.id}"
               style="background: ${isSelected ? '#4a90e2' : isDead ? 'rgba(100,100,100,0.2)' : 'rgba(255,255,255,0.1)'};
                      cursor: pointer;
                      opacity: ${isDead ? 0.7 : 1};">
            <span class="item-icon">${isDead ? '💀' : roleData?.emoji || '❓'}</span>
            <span class="item-name">${isDead ? '💀 ' : ''}${p.name}</span>
            ${isSelected ? '<span class="item-status">✓</span>' : ''}
          </div>
        `;
      })
      .join('');

    listbox.innerHTML = `
      <div style="padding: 12px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin: 0 0 8px 0; color: #FFD700; font-size: 14px;">👑 Élection du Maire</h3>
        <p style="margin: 0; font-size: 11px; color: #aaa;">Tous les joueurs</p>
      </div>
      <div style="max-height: 600px; overflow-y: auto;">
        ${playerListHtml}
      </div>
    `;

    // Attach click handlers - ANY player can be selected
    listbox.querySelectorAll('.listbox-item').forEach(item => {
      const playerId = item.dataset.playerId;

      item.addEventListener('click', () => {
        this.selectedMayorId = playerId;
        this.startTimer(); // Restart timer when selecting mayor
        // Temporarily show badge preview on map
        this.mayorId = playerId;
        this.renderLiveMap();
        this.mayorId = null; // Reset until officially elected
        this.startMayorElection(); // Re-render with updated selection
      });
    });

    // ZONE ROSE: Election form (changes on each selection)
    if (titleBig) {
      titleBig.innerHTML = '👑 Élection du Maire';
      titleBig.style.background = '#FFD700';
      titleBig.style.color = '#000';
    }

    const selectedPlayer = this.selectedMayorId ? players.find(p => p.id === this.selectedMayorId) : null;

    if (actionControls) {
      if (selectedPlayer) {
        const selectedRole = this.rolesLoader.getRole(selectedPlayer.role);
        const isDead = this.deadPlayerIds.has(selectedPlayer.id);

        actionControls.innerHTML = `
          <div style="padding: 12px; text-align: center; background: rgba(255,215,0,0.1); border-radius: 4px; border: 2px solid #FFD700;">
            <div style="font-size: 32px; margin-bottom: 8px;">
              ${isDead ? '💀' : selectedRole?.emoji || '❓'}
            </div>
            <div style="color: white; font-weight: bold; font-size: 14px;">
              ${selectedPlayer.name}
            </div>
            <div style="color: #FFD700; font-size: 11px; margin-top: 6px;">
              ${isDead ? 'Sera le nouveau Maire (décédé)' : 'Sera le nouveau Maire'}
            </div>
          </div>
        `;
      } else {
        actionControls.innerHTML = `
          <div style="padding: 12px; text-align: center; color: #aaa; font-size: 11px;">
            Sélectionnez un joueur
          </div>
        `;
      }
    }

    if (actionInfo) {
      actionInfo.innerHTML = `
        <div style="display: flex; gap: 8px;">
          <button id="btn-elect-mayor" class="btn-validate-action" style="flex: 1; padding: 10px; background: #FFD700; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; opacity: ${this.selectedMayorId ? 1 : 0.5};">
            ✓ Élire
          </button>
          <button id="btn-no-mayor" class="btn-cancel-action" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px;">
            ✗ Pas de maire
          </button>
        </div>
      `;

      const electBtn = actionInfo.querySelector('#btn-elect-mayor');
      const noMayorBtn = actionInfo.querySelector('#btn-no-mayor');

      if (electBtn) {
        electBtn.addEventListener('click', () => {
          if (this.selectedMayorId) {
            const mayor = players.find(p => p.id === this.selectedMayorId);
            console.log(`[MDJ] 👑 ${mayor.name} elected as mayor ${this.deadPlayerIds.has(mayor.id) ? '(deceased)' : ''}`);
            this.mayorId = this.selectedMayorId;
            this.completeMayorElection();
          }
        });
      }

      if (noMayorBtn) {
        noMayorBtn.addEventListener('click', () => {
          console.log(`[MDJ] No mayor elected`);
          this.mayorId = null;
          this.completeMayorElection();
        });
      }
    }
  }
,


  /**
   * Complete mayor election and move to role selection phase
   * Now that mayor is elected, proceed with first night roles
   */
  completeMayorElection() {
    console.log('[MDJ] Mayor election complete - proceeding to first night roles');
    console.log(`[MDJ] ✓ mayorId set to: ${this.mayorId}`);
    this.mayorElectionCompleted = true;
    this.selectedMayorId = null;
    this.selectedLynchVictimId = null; // Clear any previous selection

    // Re-render map with mayor badge
    this.renderLiveMap();

    // Re-render to show role list instead of mayor election
    this.renderRoleListbox();
  }
,


  /**
   * Start voting/lynch phase after mayor election
   */
  startVotingPhase() {
    const listbox = document.getElementById('role-listbox');
    const titleBig = document.getElementById('action-title-big');
    const actionControls = document.getElementById('action-controls');
    const actionInfo = document.getElementById('action-info');

    if (!listbox) return;

    const players = this.gm.state.players || [];
    const alivePlayers = this.playerRegistry.getAlive();

    // ZONE BLEUE: Combobox for vote selection (with mayor medal if applicable)
    const voteComboboxHtml = alivePlayers
      .map(p => {
        const roleData = this.rolesLoader.getRole(p.role);
        const isMayor = this.mayorId && this.mayorId === p.id;
        const displayName = isMayor ? `🎖️ ${p.name}` : p.name;
        const isSelected = this.selectedLynchVictimId === p.id;
        return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
      })
      .join('');

    listbox.innerHTML = `
      <div style="padding: 12px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin: 0 0 8px 0; color: #e74c3c; font-size: 14px;">🗳️ Vote du Jour</h3>
        <p style="margin: 0; font-size: 11px; color: #aaa;">Sélectionnez le joueur à éliminer:</p>
      </div>
      <div style="max-height: 600px; overflow-y: auto; padding: 8px 12px;">
        <select class="day-vote-combobox" style="width: 100%; padding: 8px; margin: 0; font-size: 0.9rem; background: rgba(0,0,0,0.3); color: white; border: 1px solid #e74c3c; border-radius: 3px;">
          <option value="">-- Choisir --</option>
          ${voteComboboxHtml}
      </select>
    `;

    // Attach change handler
    const voteCombobox = listbox.querySelector('.day-vote-combobox');
    if (voteCombobox) {
      voteCombobox.addEventListener('change', () => {
        this.selectedLynchVictimId = voteCombobox.value || null;
        this.startVotingPhase(); // Re-render
      });
    }

    // ZONE ROSE: Night summary + voting controls with 2-column table
    if (titleBig) {
      titleBig.innerHTML = '🗳️ Résultats Nuit 1 & Vote';
      titleBig.style.background = '#e74c3c';
      titleBig.style.color = '#fff';
    }

    // Render night summary (2-column table)
    const nightSummaryHtml = this.getNightSummaryHtml();

    const selectedVictim = this.selectedLynchVictimId ? players.find(p => p.id === this.selectedLynchVictimId) : null;
    const selectedVictimRole = selectedVictim ? this.rolesLoader.getRole(selectedVictim.role) : null;

    if (actionControls) {
      actionControls.innerHTML = `
        <!-- Night Summary 2-Column Table -->
        <div style="margin-bottom: 12px;">
          ${nightSummaryHtml}
        </div>

        <!-- Announcement when victim selected -->
        ${selectedVictim ? `
          <div style="padding: 12px; background: rgba(231,76,60,0.15); border-radius: 4px; border-left: 4px solid #e74c3c; margin-top: 12px;">
            <div style="color: #fff; font-size: 11px; margin-bottom: 6px; font-weight: 600;">📣 Villageois vous avez décidé de tuer:</div>
            <div style="color: #fff; font-weight: bold; font-size: 13px;">
              ${selectedVictim.name}
            </div>
            <div style="color: #ffcccc; font-size: 11px; margin-top: 4px;">
              il était ${selectedVictimRole?.emoji || '❓'} ${selectedVictimRole?.name || '?'}
            </div>
          </div>
        ` : `
          <div style="padding: 12px; text-align: center; color: #999; font-size: 11px; background: rgba(0,0,0,0.2); border-radius: 4px;">
            Sélectionnez quelqu'un à envoyer au bûcher
          </div>
        `}
      `;
    }

    if (actionInfo) {
      const isDisabled = !selectedVictim;
      actionInfo.innerHTML = `
        <button id="btn-lynch" class="btn-validate-action"
                style="width: 100%; padding: 12px; background: ${isDisabled ? '#999' : '#e74c3c'}; color: white; border: none; border-radius: 4px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; font-weight: 600; font-size: 12px; opacity: ${isDisabled ? 0.6 : 1};">
          🔥 Envoyer au Bûcher
        </button>
      `;

      const lynchBtn = actionInfo.querySelector('#btn-lynch');
      if (lynchBtn && !isDisabled) {
        lynchBtn.addEventListener('click', () => {
          if (this.selectedLynchVictimId) {
            this.executeLynch(this.selectedLynchVictimId);
          }
        });
      }
    }
  }
,


  /**
   * Get HTML for night summary (actions + deaths) - 2-column table layout
   */
  getNightSummaryHtml() {
    const players = this.gm.state.players || [];
    const actions = [];
    const deaths = [];

    // CRITICAL: Track which players died THIS night (not from previous nights)
    // This is used to show Chasseur revenge box only if he died THIS night
    const deadThisNight = [];
    for (const roleId of this.getDeathDealingRoleIds()) {
      const st = this.roleStates[roleId];
      if (st?.completed && st?.result?.targets?.length > 0) {
        // Ne garder que de VRAIS ids joueurs (exclut potion-*, join_wolves, stay_villager, etc.)
        deadThisNight.push(...st.result.targets.filter(t =>
          typeof t === 'string' && !t.startsWith('potion-') && players.some(pp => pp.id === t)
        ));
      }
    }
    // Also add Chasseur revenge kills from THIS night summary
    const chasseurTargetSelect = typeof document !== 'undefined' ? document.getElementById('chasseur-target') : null;
    const chasseurTarget = chasseurTargetSelect?.value;
    if (chasseurTarget) {
      deadThisNight.push(chasseurTarget);
    }
    // Add lynch victim
    const lynchSelect = typeof document !== 'undefined' ? document.getElementById('lynch-target') : null;
    const lynchVictim = lynchSelect?.value;
    if (lynchVictim) {
      deadThisNight.push(lynchVictim);
    }

    // Lynch can include ANYONE alive, even wolves - removed wolf filter
    const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id));

    // Collect actions (ONLY role actions, not transformations or Montreur_Ours)
    const transformations = [];
    Object.entries(this.roleStates).forEach(([roleId, state]) => {
      if (state.completed && state.result?.targets?.length > 0) {
        const roleData = this.rolesLoader.getRole(roleId);
        const roleName = roleData?.name || roleId;
        const emoji = roleData?.emoji || '❓';
        const action = state.result.action;

        const targets = state.result.targets
          .filter(t => !t.startsWith('potion-'))
          .map(id => this.getPlayerName(id))
          .join(' et ');

        if (action === 'lover' && targets) {
          actions.push(`${emoji} ${roleName} a lié ${targets}`);
        } else if (action === 'idol' && targets) {
          actions.push(`${emoji} ${roleName} a désigné ${targets}`);
        } else if (action === 'see_role' && targets) {
          actions.push(`${emoji} ${roleName} a vu ${targets}`);
        } else if (action === 'protect' && targets) {
          actions.push(`${emoji} ${roleName} a protégé ${targets}`);
        } else if (action === 'sniff' && targets) {
          actions.push(`${emoji} ${roleName} a reniflé ${targets}`);
        } else if (action === 'resurrect' && targets) {
          actions.push(`${emoji} ${roleName} a sauvé ${targets} (potion de vie)`);
        } else if (action === 'poison' && targets) {
          actions.push(`${emoji} ${roleName} a empoisonné ${targets}`);
        } else if (targets) {
          actions.push(`${emoji} ${roleName} → ${targets}`);
        }
      }
    });

    // CRITICAL: Collect transformations separately (display BELOW action table, not inside)
    Object.entries(this.transformations).forEach(([playerId, trans]) => {
      if (trans.from === 'Enfant_Sauvage') {
        const playerName = this.getPlayerName(playerId);
        transformations.push(`🐒➡️🐺 ${playerName} (Enfant Sauvage) transformé en loup - ${trans.reason}`);
      }
    });

    // Collect deaths
    const deadPlayers = players.filter(p => this.deadPlayerIds.has(p.id));
    deadPlayers.forEach(p => {
      const roleData = this.rolesLoader.getRole(p.role);
      const emoji = roleData?.emoji || '❓';

      let cause = 'Cause inconnue';
      const deathCause = this.deathCauses[p.id];

      if (deathCause === 'love') {
        cause = 'Mort d\'amour';
      } else if (deathCause === 'poison') {
        cause = 'Tué par la potion de la Sorcière';
      } else if (deathCause === 'lynch') {
        cause = 'Lynché par le village';
      } else if (deathCause === 'chasseur') {
        cause = 'Tué par la vengeance du Chasseur';
      } else if (deathCause === 'chevalier') {
        cause = 'Maudit par le Chevalier';
      } else if (deathCause === 'wolf') {
        // Determine which wolf killed them
        if (this.roleStates['Grand_Mechant_Loup']?.result?.targets?.includes(p.id)) {
          cause = 'Dévoré par le Grand Méchant Loup';
        } else if (this.roleStates['Simple_Loup_Garou']?.result?.targets?.includes(p.id)) {
          cause = 'Dévoré par un Simple Loup Garou';
        } else {
          cause = 'Dévoré par les Loups';
        }
      }

      deaths.push({ name: p.name, role: p.role, emoji: emoji, cause: cause });
    });

    // Check for Montreur d'Ours growl
    let montreurOursHtml = '';
    const montreurOursPlayer = players.find(p => p.role === 'Montreur_Ours' && !this.deadPlayerIds.has(p.id));
    if (montreurOursPlayer) {
      const idx = players.indexOf(montreurOursPlayer);
      let leftIdx = idx === 0 ? players.length - 1 : idx - 1;
      let rightIdx = idx === players.length - 1 ? 0 : idx + 1;

      // Skip dead players to find living neighbors
      let leftWolfIdx = leftIdx;
      while (this.deadPlayerIds.has(players[leftWolfIdx].id) && leftWolfIdx !== idx) {
        leftWolfIdx = leftWolfIdx === 0 ? players.length - 1 : leftWolfIdx - 1;
      }
      let rightWolfIdx = rightIdx;
      while (this.deadPlayerIds.has(players[rightWolfIdx].id) && rightWolfIdx !== idx) {
        rightWolfIdx = rightWolfIdx === players.length - 1 ? 0 : rightWolfIdx + 1;
      }

      const leftNeighbor = players[leftWolfIdx];
      const rightNeighbor = players[rightWolfIdx];

      const leftIsWolf = leftNeighbor && !this.deadPlayerIds.has(leftNeighbor.id) &&
                         (leftNeighbor.role?.includes('Loup') || leftNeighbor.role?.includes('Wolf'));
      const rightIsWolf = rightNeighbor && !this.deadPlayerIds.has(rightNeighbor.id) &&
                          (rightNeighbor.role?.includes('Loup') || rightNeighbor.role?.includes('Wolf'));

      const hasWolfNearby = leftIsWolf || rightIsWolf;
      const growlText = hasWolfNearby
        ? '🐻 L\'ours du Montreur d\'Ours grogne ! Ça sent le loup !'
        : '🐻 Ça ne grogne pas, pas de loup à proximité de l\'ours';

      montreurOursHtml = `
        <div style="padding:4px 6px; margin-bottom:4px; background:rgba(139,69,19,0.08); border-left:2px solid #8B4513; font-size:9px; line-height:1.3;">
          ${growlText}
        </div>
      `;
    }

    // CRITICAL: Montreur_Ours and transformations are NOT in actions table - they go BELOW
    // IMPROVED: Much better readability with larger fonts, better contrast, and proper styling
    const actionsHtml = actions.length > 0
      ? actions.map(a => `<div style="padding:4px 6px; margin-bottom:4px; font-size:10px; line-height:1.3; background:rgba(129,223,247,0.1); border-radius:2px; border-left:2px solid #00BFFF; color:#b0e8ff;">${a}</div>`).join('')
      : '<div style="padding:6px; text-align:center; color:#666; font-size:9px; font-style:italic;">Aucune action</div>';

    const deathsHtml = deaths.length > 0
      ? deaths.map(d => `<div style="padding:4px 6px; margin-bottom:4px; font-size:10px; line-height:1.3; background:rgba(255,102,102,0.1); border-radius:2px; border-left:2px solid #ff4444;"><strong style="color:#ffaaaa; font-size:10px;">${d.emoji} ${d.name}</strong><br><span style="color:#ff8888; font-size:9px;">${d.cause}</span></div>`).join('')
      : '<div style="padding:6px; text-align:center; color:#666; font-size:9px; font-style:italic;">Aucune mort</div>';

    // Check for special role deaths that need handling
    // Show Chasseur revenge box ONLY if he actually died this night and hasn't shot yet.
    const deadChaseur = players.find(p => p.role === 'Chasseur' && deadThisNight.includes(p.id) && !this.chasseurHasShot) || null;
    const deadChevalier = deaths.find(d => d.role === 'Chevalier_Epee_Rouille');

    // Le Maire est un STATUT (this.mayorId), pas un role.
    const mayorDiesThisNight = this.mayorId && deadThisNight.includes(this.mayorId);

    // Build special sections HTML
    let specialSectionsHtml = '';

    if (mayorDiesThisNight) {
      const mayorPlayer = players.find(p => p.id === this.mayorId);
      const successors = players.filter(p =>
        !this.deadPlayerIds.has(p.id) &&
        !deadThisNight.includes(p.id) &&
        p.id !== this.mayorId
      );
      const successorOptions = successors.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      specialSectionsHtml += `
        <div style="border: 1px solid rgba(255,215,0,0.4); border-radius: 3px; padding: 6px; background: rgba(255,215,0,0.06); margin-bottom: 6px;">
          <div style="color: #FFD700; font-size: 9px; font-weight: 700; margin-bottom: 3px;">\u{1F396}\uFE0F ${mayorPlayer?.name || 'Le Maire'} meurt — designer le nouveau Maire</div>
          <select id="mayor-reassign-target" style="width: 100%; padding: 4px; font-size: 9px; border-radius: 2px; border: 1px solid #FFD700; background: #333; color: #fff;">
            <option value="">-- Nouveau Maire --</option>
            ${successorOptions}
          </select>
        </div>
      `;
    }

    // SERVANTE DEVOUEE: si vivante et qu'un joueur est mort cette nuit, elle peut prendre son role
    const servante = players.find(p => p.role === 'Servante_Devouee' && !this.deadPlayerIds.has(p.id));
    const deadThisNightPlayers = players.filter(p => deadThisNight.includes(p.id));
    if (servante && deadThisNightPlayers.length > 0) {
      const opts = deadThisNightPlayers.map(p => {
        const rd = this.rolesLoader.getRole(p.role);
        return `<option value="${p.id}">${p.name} (${rd?.name || p.role})</option>`;
      }).join('');
      specialSectionsHtml += `
        <div style="border: 1px solid rgba(120,200,160,0.4); border-radius: 3px; padding: 6px; background: rgba(120,200,160,0.07); margin-bottom: 6px;">
          <div style="color: #8fe0b0; font-size: 9px; font-weight: 700; margin-bottom: 3px;">🧹 Servante Dévouée (${servante.name}) — prendre le rôle d'un mort ?</div>
          <select id="servante-take-target" style="width: 100%; padding: 4px; font-size: 9px; border-radius: 2px; border: 1px solid #8fe0b0; background: #333; color: #fff;">
            <option value="">-- Ne rien faire --</option>
            ${opts}
          </select>
        </div>
      `;
    }

    if (deadChaseur) {
      const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id));
      const playerOptions = alivePlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      specialSectionsHtml += `
        <div style="border: 1px solid rgba(200,150,100,0.3); border-radius: 3px; padding: 6px; background: rgba(200,150,100,0.05); margin-bottom: 6px;">
          <div style="color: #d4a574; font-size: 9px; font-weight: 600; margin-bottom: 3px;">🏹 Chasseur - Vengeance</div>
          <select id="chasseur-target" style="width: 100%; padding: 4px; font-size: 9px; border-radius: 2px; border: 1px solid #555; background: #333; color: #fff;">
            <option value="">-- Cible --</option>
            ${playerOptions}
          </select>
        </div>
      `;
    }

    if (deadChevalier) {
      // CRITICAL: Find the wolf to the left of the Chevalier
      const chevalierPlayer = players.find(p => p.role === 'Chevalier_Epee_Rouille');
      if (chevalierPlayer) {
        const idx = players.indexOf(chevalierPlayer);
        let leftIdx = idx === 0 ? players.length - 1 : idx - 1;

        // Skip dead players to find alive neighbors
        let leftWolfIdx = leftIdx;
        while (this.deadPlayerIds.has(players[leftWolfIdx].id) && leftWolfIdx !== idx) {
          leftWolfIdx = leftWolfIdx === 0 ? players.length - 1 : leftWolfIdx - 1;
        }

        const leftNeighbor = players[leftWolfIdx];
        const isWolf = leftNeighbor && (leftNeighbor.role?.includes('Loup') || leftNeighbor.role?.includes('Wolf'));

        if (isWolf && !this.deadPlayerIds.has(leftNeighbor.id)) {
          // Mark this wolf to die next night
          this.chevalierCursedWolfId = leftNeighbor.id;
          const wolfName = leftNeighbor.name;
          console.log(`[MDJ] ⚔️ Chevalier cursed wolf: ${wolfName} will die NEXT night`);

          specialSectionsHtml += `
            <div style="border: 1px solid #FFD700; border-radius: 3px; padding: 6px; background: rgba(255,215,0,0.08); margin-bottom: 6px;">
              <div style="color: #FFD700; font-size: 9px; font-weight: 700;">⚔️ ${wolfName} maudit</div>
            </div>
          `;
        }
      }
    }

    // Banniere "aucun mort cette nuit" (ex: victime des loups immunisee + sorciere inactive)
    const realDeathsThisNight = deadThisNight.filter(id => players.some(p => p.id === id) && this.deadPlayerIds.has(id));
    const noDeathBanner = realDeathsThisNight.length === 0
      ? `<div style="margin-bottom:8px; padding:8px; text-align:center; font-size:11px; font-weight:700; color:#9ee6b0; background:rgba(80,200,120,0.12); border:1px solid rgba(80,200,120,0.4); border-radius:6px;">🌙 Personne n'est mort cette nuit</div>`
      : '';

    // STYLIZED COMPACT LAYOUT: Dark mode with purple/pink accents
    return `
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 6px; padding: 10px; border: 1px solid rgba(201,124,255,0.2);">
        ${noDeathBanner}
        <!-- 2 Columns: Actions & Morts -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <!-- ACTIONS -->
          <div style="border: 1px solid rgba(0,191,255,0.3); border-radius: 4px; padding: 8px; background: linear-gradient(135deg, rgba(0,191,255,0.08) 0%, rgba(0,100,150,0.06) 100%);">
            <div style="color: #4dd0e1; font-size: 10px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; text-shadow: 0 0 10px rgba(77,208,225,0.3);">📋 Actions</div>
            <div style="max-height: 110px; overflow-y: auto;">
              ${actionsHtml}
            </div>
          </div>

          <!-- MORTS -->
          <div style="border: 1px solid rgba(255,68,68,0.3); border-radius: 4px; padding: 8px; background: linear-gradient(135deg, rgba(255,68,68,0.08) 0%, rgba(150,30,30,0.06) 100%);">
            <div style="color: #ff6b6b; font-size: 10px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; text-shadow: 0 0 10px rgba(255,107,107,0.3);">☠️ Morts</div>
            <div style="max-height: 110px; overflow-y: auto;">
              ${deathsHtml}
            </div>
          </div>
        </div>

        <!-- SPECIAL EVENTS -->
        <div style="margin-bottom: 8px; font-size: 10px;">
          ${specialSectionsHtml}
          ${montreurOursHtml}
          ${transformations.length > 0 ? transformations.map(t => `
            <div style="padding:5px 6px; margin-bottom:4px; background: linear-gradient(90deg, rgba(170,34,14,0.15) 0%, rgba(100,20,10,0.08) 100%); border-radius:3px; border-left:3px solid #d9534f; font-size:10px; line-height:1.3; color:#e0a0a0;">
              ${t}
            </div>
          `).join('') : ''}
        </div>

        <!-- LYNCH SELECTION -->
        <div style="border: 1px solid rgba(201,124,255,0.4); border-radius: 4px; padding: 8px; background: linear-gradient(135deg, rgba(201,124,255,0.12) 0%, rgba(150,50,200,0.08) 100%);">
          <div style="color: #e0a0ff; font-size: 10px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; text-shadow: 0 0 10px rgba(224,160,255,0.3);">🪓 Au Bûcher</div>
          <select id="lynch-target" style="width: 100%; padding: 6px; font-size: 11px; border-radius: 4px; border: 1px solid #e0a0ff; background: #1a1a2e; color: #fff; font-weight: 600;">
            <option value="" style="background: #1a1a2e; color: #fff;">-- Sélectionner --</option>
            ${alivePlayers.map(p => `<option value="${p.id}" style="background: #1a1a2e; color: #fff;">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }
,


  /**
   * REUSABLE: Process lynch victim - returns all death data
   * Can be called from ANY phase (Night 1, 2, Day, etc.)
   * Returns: {victim, victimRole, cascadeDeaths, enfantSauvageTransformed}
   */
  processLynchVictim(victimId) {
    const players = this.gm.state.players || [];
    const victim = players.find(p => p.id === victimId);
    const victimRole = this.rolesLoader.getRole(victim.role);

    console.log(`[MDJ] 🔥 ${victim.name} lynched - role revealed: ${victim.role}`);

    // Track cascade deaths
    const deadBeforeCascade = new Set(this.deadPlayerIds);

    // Add to dead players
    this.deadPlayerIds.add(victimId);
    this.deathCauses[victimId] = 'lynch';

    // Check cascading Cupidon death
    this.checkCupidonCascadingDeath(victimId);

    // Find cascade deaths
    const cascadeDeaths = [];
    this.deadPlayerIds.forEach(id => {
      if (!deadBeforeCascade.has(id) && id !== victimId) {
        cascadeDeaths.push(id);
      }
    });

    // Check Enfant Sauvage transformation
    let enfantSauvageTransformed = null;
    if (this.roleStates['Enfant_Sauvage']?.completed && this.roleStates['Enfant_Sauvage']?.result?.targets?.includes(victimId)) {
      const enfantPlayer = players.find(p => p.role === 'Enfant_Sauvage');
      if (enfantPlayer && !this.deadPlayerIds.has(enfantPlayer.id)) {
        enfantSauvageTransformed = enfantPlayer;
      }
    }

    return {victim, victimRole, cascadeDeaths, enfantSauvageTransformed};
  }
,


  /**
   * Execute lynch - kill player and reveal role
   * NIGHT 1 SPECIFIC: Uses processLynchVictim() and displays UI
   */
  /**
   * Effet de mort/vote du role lynche: { survives, type, note }.
   * Pilote par le type d'action JSON (surviveDayKill, killNeighbors, etc.).
   */
  getLynchDeathEffect(roleId) {
    // Cas special Ancien : tué par le village → les villageois perdent leurs pouvoirs
    if (roleId === 'Ancien') {
      return { survives:false, type:'ancien', note:"👴 L'Ancien est tué par le village → TOUS les villageois à pouvoir (Voyante, Salvateur, Sorcière, Chasseur, Renard, Juge…) PERDENT leur pouvoir jusqu'à la fin de la partie !" };
    }
    const rd = this.rolesLoader.getRole(roleId) || {};
    const blocks = rd.actions ? Object.values(rd.actions) : [];
    const special = ['surviveDayKill','dieOnTie','killVoters','killNeighbors','bonusKill','pauseWolfKill','winOnFirstDeath','vultureCondition'];
    let type = null;
    for (const b of blocks) {
      if (b && typeof b === 'object' && special.includes(b.type)) { type = b.type; break; }
    }
    const notes = {
      surviveDayKill: "🤪 Idiot du Village démasqué : il SURVIT au vote (il ne pourra plus voter ensuite).",
      killNeighbors: "🧪 Savant Fou : à sa mort, ses 2 voisins (vivants) meurent aussi — à appliquer.",
      killVoters: "🦠 Lépreux lynché : la prochaine attaque des loups est gâchée — à appliquer.",
      bonusKill: "🐺 Louveteau mort : les loups ont droit à une victime bonus — à appliquer.",
      pauseWolfKill: "🌙 Fils de la Lune mort : les loups ne tueront personne la prochaine nuit — à appliquer.",
      winOnFirstDeath: "👼 Ange Déchu : s'il est éliminé très tôt, il gagne SEUL — vérifier la condition !",
      dieOnTie: "🐐 Bouc Émissaire : meurt automatiquement en cas d'ÉGALITÉ des votes.",
      vultureCondition: "🦅 Président : condition de victoire spéciale — vérifier."
    };
    return { survives: type === 'surviveDayKill', type, note: type ? (notes[type] || '') : '' };
  }
,

  executeLynch(victimId) {
    const result = this.processLynchVictim(victimId);
    const {victim, victimRole, cascadeDeaths, enfantSauvageTransformed} = result;
    const players = this.gm.state.players || [];

    // Effet de mort/vote du role lynche
    const _lynchEffect = this.getLynchDeathEffect(victim.role);
    if (_lynchEffect.survives) {
      this.deadPlayerIds.delete(victimId);
      if (this.deathCauses) delete this.deathCauses[victimId];
      console.log(`[MDJ] 🤪 ${victim.name} (${victim.role}) survit au vote`);
    }

    // EFFETS AUTOMATIQUES AU LYNCH
    let _extraDeathsHtml = '';
    if (_lynchEffect.type === 'killNeighbors') {
      // Savant Fou: emporte ses 2 voisins VIVANTS dans la mort
      const idx = players.indexOf(victim);
      const aliveNeighbor = (dir) => {
        let i = idx;
        for (let k = 0; k < players.length; k++) {
          i = (i + dir + players.length) % players.length;
          if (i === idx) break;
          if (!this.deadPlayerIds.has(players[i].id)) return players[i];
        }
        return null;
      };
      const victimsN = [];
      [aliveNeighbor(-1), aliveNeighbor(1)].forEach(n => {
        if (n && !this.deadPlayerIds.has(n.id)) {
          this.deadPlayerIds.add(n.id);
          this.deathCauses[n.id] = 'savant';
          this.checkCupidonCascadingDeath(n.id);
          victimsN.push(n.name);
        }
      });
      if (victimsN.length) {
        _extraDeathsHtml = `<div style="margin-top:12px; padding:10px; background:rgba(170,34,14,0.15); border:2px solid #d9534f; border-radius:6px; color:#ffb3ba; font-size:11px; font-weight:600;">🧪 Le Savant Fou emporte ${victimsN.join(' et ')} dans la mort !</div>`;
      }
    } else if (_lynchEffect.type === 'pauseWolfKill' || _lynchEffect.type === 'killVoters') {
      this.skipNextWolfKill = true;
      console.log(`[MDJ] 🌙 Prochaine attaque des loups annulée (${victim.role})`);
    } else if (_lynchEffect.type === 'bonusKill') {
      this.wolvesBonusKill = true;
    }

    // CRITICAL: Check for Enfant Sauvage idol death - transform to wolf if idol is lynched
    if (this.roleStates['Enfant_Sauvage']?.completed && this.roleStates['Enfant_Sauvage']?.result?.targets?.includes(victimId)) {
      const enfantPlayer = players.find(p => p.role === 'Enfant_Sauvage');
      if (enfantPlayer && !this.deadPlayerIds.has(enfantPlayer.id)) {
        console.log(`[MDJ] 🐒➡️🐺 Enfant Sauvage ${enfantPlayer.name}'s idol ${victim.name} was LYNCHED! Transform to wolf`);

        // Record the transformation
        this.transformations[enfantPlayer.id] = {
          from: 'Enfant_Sauvage',
          to: 'Simple_Loup_Garou',
          reason: `idol ${victim.name} lynché au bûcher`
        };
        // Change player role to wolf
        enfantPlayer.role = 'Simple_Loup_Garou';
        enfantPlayer.camp = 'Loup'; // Change team to Wolf
        console.log(`[MDJ] ✓ ${enfantPlayer.name} is now a Simple Loup Garou (transformed from Enfant Sauvage)`);
      }
    }

    // Update map to show dead player (sauf si le role survit au vote)
    const mdjMap = document.getElementById('mdj-live-map');
    if (mdjMap && !_lynchEffect.survives) {
      const victimPoint = mdjMap.querySelector(`[data-player-id="${victimId}"]`);
      if (victimPoint) {
        victimPoint.style.filter = 'grayscale(100%) brightness(0.5)';
        victimPoint.style.opacity = '0.6';

        const emoji = victimPoint.querySelector('.mdj-point-emoji');
        if (emoji) {
          emoji.textContent = '💀';
          emoji.style.opacity = '0.6';
        }
      }
    }

    // Show death announcement
    const listbox = document.getElementById('role-listbox');
    const actionControls = document.getElementById('action-controls');
    const actionInfo = document.getElementById('action-info');

    // Check if victim is Chasseur and can shoot
    const isChaseur = victim.role === 'Chasseur';
    const chasseurCanShoot = isChaseur && !this.chasseurHasShot;

    if (actionControls) {
      let html = `
        <div style="padding: 16px; text-align: center; background: rgba(52,73,94,0.3); border-radius: 4px; border: 2px solid #34495e;">
          <div style="font-size: 40px; margin-bottom: 12px;">
            💀
          </div>
          <div style="color: white; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
            ${victim.name}
          </div>
          <div style="color: #bdc3c7; font-size: 12px; margin-bottom: 4px;">
            était
          </div>
          <div style="color: ${victimRole?.visual?.roleColor?.textColor || '#fff'}; font-weight: bold; font-size: 14px;">
            ${victimRole?.emoji || '❓'} ${victimRole?.name || '?'}
          </div>
      `;

      // Display cascade deaths (lovers who died with victim)
      if (cascadeDeaths.length > 0) {
        cascadeDeaths.forEach(cascadeVictimId => {
          const cascadeVictim = players.find(p => p.id === cascadeVictimId);
          const cascadeVictimRole = this.rolesLoader.getRole(cascadeVictim.role);
          html += `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 32px; margin-bottom: 8px;">💔</div>
              <div style="color: #ffb3ba; font-weight: bold; font-size: 15px; margin-bottom: 6px;">
                ${cascadeVictim.name}
              </div>
              <div style="color: #ffcccc; font-size: 11px; margin-bottom: 3px;">
                aussi mort (amoureux)
              </div>
              <div style="color: ${cascadeVictimRole?.visual?.roleColor?.textColor || '#ffb3ba'}; font-weight: bold; font-size: 12px;">
                ${cascadeVictimRole?.emoji || '❓'} ${cascadeVictimRole?.name || '?'}
              </div>
            </div>
          `;
        });
      }

      // Display Enfant Sauvage transformation
      if (enfantSauvageTransformed) {
        html += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(170,34,14,0.4);">
            <div style="font-size: 32px; margin-bottom: 8px;">🐒➡️🐺</div>
            <div style="color: #e0a0a0; font-weight: bold; font-size: 15px; margin-bottom: 6px;">
              ${enfantSauvageTransformed.name}
            </div>
            <div style="color: #ffcccc; font-size: 11px; margin-bottom: 3px;">
              rendu fou par la mort de son idole, est devenu loup!
            </div>
          </div>
        `;
      }

      // If Chasseur and can shoot, show combobox first
      if (chasseurCanShoot) {
        const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id) && p.id !== victimId);
        const validTargets = alivePlayers.filter(p => p.role && (p.role.includes('Loup') || p.role.includes('Wolf')));

        html += `
          <div style="margin-top: 16px; padding: 12px; background: rgba(210,180,140,0.2); border: 2px solid #D4A574; border-radius: 6px;">
            <h4 style="margin:0 0 8px 0; color:#D4A574; font-size:12px;">🏹 ${victim.name} peut tirer avant de mourir!</h4>
            <p style="margin:0 0 8px 0; color:#ddd; font-size:11px;">Choisir sa cible parmi les loups:</p>
            <select id="chasseur-revenge-target" style="width:100%; padding:6px; background:#333; color:#fff; border:1px solid #666; border-radius:3px; font-size:11px;">
              <option value="">-- Pas de tir --</option>
              ${validTargets.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
        `;
      } else {
        html += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); color: #95a5a6; font-size: 11px;">
            Rendormez-vous, 2ème Nuit!
          </div>
        `;
      }

      // Morts induites par l'effet (ex: voisins du Savant Fou)
      if (_extraDeathsHtml) html += _extraDeathsHtml;

      // Rappel MDJ de l'effet de mort/vote du role
      if (_lynchEffect.note) {
        html += `
          <div style="margin-top: 14px; padding: 10px; background: rgba(255,180,80,0.12); border: 2px solid #ffb84d; border-radius: 6px; color:#ffd9a3; font-size:11px; font-weight:600;">
            ⚠️ ${_lynchEffect.note}
          </div>
        `;
      }

      // Servante Devouee: peut prendre le role du lynche
      const _servante = players.find(p => p.role === 'Servante_Devouee' && !this.deadPlayerIds.has(p.id) && p.id !== victimId);
      if (_servante && !_lynchEffect.survives) {
        html += `
          <div style="margin-top: 14px; padding: 10px; background: rgba(120,200,160,0.1); border: 2px solid #8fe0b0; border-radius: 6px;">
            <div style="color:#8fe0b0; font-size:11px; font-weight:700; margin-bottom:6px;">🧹 Servante Dévouée (${_servante.name}) prend le rôle de ${victim.name} ?</div>
            <select id="lynch-servante-take" style="width:100%; padding:6px; background:#333; color:#fff; border:1px solid #8fe0b0; border-radius:3px; font-size:11px;">
              <option value="">-- Ne rien faire --</option>
              <option value="${victimId}">Oui, devenir ${victimRole?.name || victim.role}</option>
            </select>
          </div>
        `;
      }

      // Si la victime du buchet etait le MAIRE: proposer un successeur
      if (victimId === this.mayorId) {
        const successors = players.filter(p => !this.deadPlayerIds.has(p.id) && p.id !== victimId);
        html += `
          <div style="margin-top: 14px; padding: 10px; background: rgba(255,215,0,0.1); border: 2px solid #FFD700; border-radius: 6px;">
            <div style="color:#FFD700; font-size:12px; font-weight:700; margin-bottom:6px;">🎖️ ${victim.name} était Maire — désigner le nouveau Maire</div>
            <select id="lynch-mayor-reassign" style="width:100%; padding:6px; background:#333; color:#fff; border:1px solid #FFD700; border-radius:3px; font-size:11px;">
              <option value="">-- Nouveau Maire --</option>
              ${successors.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
        `;
      }

      html += `
        </div>
      `;
      actionControls.innerHTML = html;

      // Handler Servante (cas lynch)
      const lynchServanteSel = document.getElementById('lynch-servante-take');
      if (lynchServanteSel) {
        lynchServanteSel.addEventListener('change', () => {
          if (!lynchServanteSel.value) return;
          const ps = this.gm.state.players || [];
          const servantePlayer = ps.find(p => p.role === 'Servante_Devouee' && !this.deadPlayerIds.has(p.id));
          const deadP = ps.find(p => p.id === lynchServanteSel.value);
          if (servantePlayer && deadP) {
            this.transformations[servantePlayer.id] = { from: 'Servante_Devouee', to: deadP.role, reason: `reprend le role de ${deadP.name}` };
            servantePlayer.role = deadP.role;
            console.log(`[MDJ] 🧹 Servante ${servantePlayer.name} reprend le role de ${deadP.name}`);
            this.renderLiveMap();
            this.quickSave && this.quickSave();
          }
        });
      }

      // Handler de reassignation du maire (cas lynch)
      const lynchMayorSel = document.getElementById('lynch-mayor-reassign');
      if (lynchMayorSel) {
        lynchMayorSel.addEventListener('change', () => {
          if (lynchMayorSel.value) {
            this.mayorId = lynchMayorSel.value;
            console.log(`[MDJ] 🎖️ Nouveau Maire (apres lynch): ${this.getPlayerName(this.mayorId)}`);
            this.renderLiveMap();
            this.quickSave && this.quickSave();
          }
        });
      }
    }

    if (actionInfo) {
      if (chasseurCanShoot) {
        actionInfo.innerHTML = `
          <button id="btn-chasseur-shoot" style="width: 100%; padding: 12px; background: #D4A574; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; margin-bottom: 8px;">
            🏹 Tirer!
          </button>
          <button id="btn-skip-shot" style="width: 100%; padding: 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px;">
            ⏭️ Ne pas tirer
          </button>
        `;

        const shootBtn = actionInfo.querySelector('#btn-chasseur-shoot');
        const skipBtn = actionInfo.querySelector('#btn-skip-shot');

        const executeShot = () => {
          const targetSelect = document.getElementById('chasseur-revenge-target');
          const targetId = targetSelect?.value;

          if (targetId) {
            const targetPlayer = players.find(p => p.id === targetId);
            console.log(`[MDJ] 🏹 ${victim.name} (Chasseur) shoots: ${targetPlayer.name}`);
            this.deadPlayerIds.add(targetId);
            this.deathCauses[targetId] = 'chasseur';
            this.chasseurHasShot = true;
            this.checkCupidonCascadingDeath(targetId);
          } else {
            console.log(`[MDJ] 🏹 ${victim.name} (Chasseur) chooses not to shoot`);
            this.chasseurHasShot = true;
          }

          // Now show continue button
          showContinueButton();
        };

        const showContinueButton = () => {
          actionInfo.innerHTML = `
            <button id="btn-continue-night2" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px;">
              ✓ Continuer vers Nuit 2
            </button>
          `;

          const continueBtn = actionInfo.querySelector('#btn-continue-night2');
          if (continueBtn) {
            continueBtn.addEventListener('click', () => {
              console.log('[MDJ] Moving to Night 2');
              if (this.gm && typeof this.gm.saveState === 'function') {
                this.gm.saveState();
              }
              if (window.gameUI && typeof window.gameUI.saveGameStateToCache === 'function') {
                window.gameUI.saveGameStateToCache();
              }
              this.startNight2();
            });
          }
        };

        if (shootBtn) {
          shootBtn.addEventListener('click', executeShot);
        }
        if (skipBtn) {
          skipBtn.addEventListener('click', () => {
            console.log(`[MDJ] 🏹 ${victim.name} (Chasseur) skips shooting`);
            this.chasseurHasShot = true;
            showContinueButton();
          });
        }
      } else {
        actionInfo.innerHTML = `
          <button id="btn-continue-night2" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px;">
            ✓ Continuer vers Nuit 2
          </button>
        `;

        const continueBtn = actionInfo.querySelector('#btn-continue-night2');
        if (continueBtn) {
          continueBtn.addEventListener('click', () => {
            console.log('[MDJ] Moving to Night 2');
            if (this.gm && typeof this.gm.saveState === 'function') {
              this.gm.saveState();
            }
            if (window.gameUI && typeof window.gameUI.saveGameStateToCache === 'function') {
              window.gameUI.saveGameStateToCache();
            }
            this.startNight2();
          });
        }
      }
    }

    // Zone bleue stays as player list - already disabled by disableRoleListbox()
  }

});
