// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  /**
   * Start Night 2 with role filtering
   * Only show roles with actual night actions (exclude Cupidon, Enfant_Sauvage, etc.)
   */
  startNight2() {
    // Si une mort (ex: tir du Chasseur) a déjà décidé la partie, ne pas démarrer de nuit
    this.checkVictoryNow();
    if (this.victoryShown) return;
    // Avance vers la nuit suivante : incrémente (avant: bloqué en dur à 2)
    this.currentNight = (this.currentNight || 1) + 1;
    console.log('[MDJ] ===== NIGHT ' + this.currentNight + ' START =====');
    this.journalLog('━━━━━━━━━ NUIT ' + this.currentNight + ' ━━━━━━━━━', { kind: 'nightsep' });

    // La malédiction du Chevalier est désormais appliquée au DÉBRIEF de la nuit suivante
    // (voir getNightSummaryHtml) afin que le loup maudit joue une dernière fois avant de mourir.

    // Reset selections for night 2
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedMayorId = null;
    this.selectedLynchVictimId = null;

    // Reinitialize role states for Night 2 (only roles with night actions)
    // Instantané des morts AU DÉBUT de la nuit : un joueur tué PENDANT cette nuit
    // doit quand même jouer son tour (on ne saute que ceux déjà morts avant).
    this.gm.state.deadAtNightStart = Array.from(this.deadPlayerIds);
    // Nouvelle nuit : les morts à venir sont MASQUÉES sur la map jusqu'au débrief
    this.gm.state.revealDeaths = false;

    this.initializeNight2RoleStates();

    // Update the center panel header
    const centerPanel = document.querySelector('.mdj-role-list-wrapper');
    if (centerPanel) {
      const header = centerPanel.querySelector('.role-list-header');
      if (header) {
        header.textContent = '🌙 Nuit ' + this.currentNight;
      }
    }

    // Re-render the role listbox
    this.renderRoleListbox();
  }
,


  /**
   * Initialize role states for Night 2
   * Only include roles that have actual night actions (NightActive)
   * IMPORTANT: Dead players' roles should NOT be initialized for next night
   * CRITICAL: Renard loses power if no wolves detected
   */
  initializeNight2RoleStates() {
    // CRITICAL: Keep copy of ALL previous night's states (needed for Chien_Loup stay_villager check, etc.)
    const previousRenardState = this.roleStates['Renard'];
    const previousRoleStates = { ...this.roleStates }; // Keep all previous states

    this.roleStates = { ...previousRoleStates }; // Keep previous states, only add/update new ones
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const players = this.gm.state.players || [];
    const assignedRoleIds = new Set(players.map(p => p.role));

    orderedRoles.forEach(roleId => {
      // Only initialize roles that are ASSIGNED to players
      if (!assignedRoleIds.has(roleId)) return;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return;

      // Check if the player with this role is alive
      const playerWithRole = players.find(p => p.role === roleId);
      if (!playerWithRole) return; // Role not assigned to anyone
      if (this.deadPlayerIds.has(playerWithRole.id)) {
        console.log(`[MDJ] Night 2 role SKIPPED: ${roleId} (${roleData.name}) - player ${playerWithRole.name} is dead`);
        return;
      }

      // CRITICAL: Check if Renard lost power (detected 0 wolves on previous night)
      if (roleId === 'Renard' && previousRenardState?.completed && this.renardDetectedWolves !== null) {
        if (!this.renardDetectedWolves) {
          console.log(`[MDJ] Night ${this.currentNight} Renard SKIPPED: no wolves detected on Night ${this.currentNight - 1}, lost power`);
          return;
        }
      }

      // CRITICAL: Check if Sorciere used all potions (2 total: 1 life + 1 death)
      if (roleId === 'Sorciere' && this.sorcierePotionsUsed >= 2) {
        console.log(`[MDJ] Night ${this.currentNight} Sorciere SKIPPED: used all 2 potions already`);
        return;
      }

      // For Night 2+: Check if this role plays THIS NIGHT
      // Must have actionType === 'NightActive' AND either:
      // - nightActive array includes this night, OR
      // - phase matches current night (everyNight, everyOtherNight, afterFirstNight, etc.)
      const isNightActiveRole = roleData.actionType === 'NightActive' || this.isWolfRoleId(roleId);
      // [STANDARDISATION] Source unique de verite pour "agit cette nuit"
      //  (gere nightActive + phase everyOtherNight/everyNight... + fallback loup).
      const playsThisNight = this.roleActsThisNight(roleId);

      if (isNightActiveRole && playsThisNight) {
        this.roleStates[roleId] = {
          completed: false,
          selected: false,
          result: null
        };
        console.log(`[MDJ] Night 2 role initialized: ${roleId} (${roleData.name})`);
      } else {
        const skipReason = !isNightActiveRole ? 'not NightActive' : `not active for night ${this.currentNight}`;
        console.log(`[MDJ] Night 2 role SKIPPED: ${roleId} (${roleData.name}) - ${skipReason}`);
      }
    });

    console.log(`[MDJ] Night 2: ${Object.keys(this.roleStates).length} roles available`);
  }
,


  renderRoleListbox() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;
    if (typeof this.logGameStartOnce === 'function') this.logGameStartOnce();

    // PRIORITY 1: If mayor election not done yet, show it FIRST (before any roles)
    if (!this.mayorElectionCompleted) {
      console.log('[MDJ] Mayor election not completed - showing mayor election first');
      return this.startMayorElection();
    }

    // PRIORITY 2: Check if all roles are completed - if so, DISABLE clicks but keep list visible
    const completedRoleIds = Object.keys(this.roleStates);
    const allCompleted = completedRoleIds.length > 0 && completedRoleIds.every(roleId => this.roleStates[roleId].completed);

    // (Avant: on désactivait la liste et on affichait le résumé en bloquant les clics.)
    // Désormais la liste reste CLIQUABLE même quand tout est joué -> permet de RE-SAISIR un rôle.
    const _showSummaryAfter = allCompleted;

    // ALWAYS SHOW: Re-enable clicks at night phases
    if (listbox.style.pointerEvents === 'none') {
      listbox.style.opacity = '1';
      listbox.style.pointerEvents = 'auto';
      listbox.style.backgroundColor = 'rgba(0,0,0,0.15)';
    }

    // Get all players (alive and dead)
    const players = this.gm.state.players || [];

    // If Night 2+ and no roles with actions, automatically skip to day phase
    if (this.currentNight >= 2) {
      const hasActionsThisNight = players.some(p => {
        return this.roleActsThisNight(p.role);
      });

      if (!hasActionsThisNight) {
        console.log(`[MDJ] 🌙 Night ${this.currentNight}: No roles with night actions - skipping to day phase`);
        if (this.gm && typeof this.gm.changePhase === 'function') {
          this.gm.changePhase('day');
        }
        return;
      }
    }

    // Auto-select first role with action if none selected (respecting JSON file order)
    // This must be BEFORE rendering so the HTML gets the correct classes
    if (!this.selectedRoleId) {
      const assignedRoleIds = new Set(players.map(p => p.role));
      const allOrderedRoles = this.rolesLoader.getOrderedRoleIds();

      const firstRoleWithAction = allOrderedRoles.find(roleId => {
        if (!assignedRoleIds.has(roleId)) return false;
        if (this.roleStates[roleId]?.completed) return false;

        const actsThisNight = this.roleActsThisNight(roleId);
        if (!actsThisNight) return false;

        const playerWithRole = players.find(p => p.role === roleId && !(new Set(this.gm.state.deadAtNightStart || [])).has(p.id));
        return !!playerWithRole;
      });

      if (firstRoleWithAction) {
        this.selectedRoleId = firstRoleWithAction;
        console.log('[FirstNightMDJ] Auto-selected first role (by JSON order) with action:', firstRoleWithAction);
        // Apply breathing effect ONCE when auto-selecting
        this.renderLiveMap();
        this.updateMapForRole();
        this.restoreCompletedRoleEffects();
      }
    }

    // Render player list (all players, blue zone)
    // Players are shown with their role emoji and name
    // Dead players are grayed out with skull emoji
    // Players whose roles don't act this night are also grayed out
    // IMPORTANT: Sort players by JSON order of their roles (Cupidon first, then Enfant_Sauvage, etc.)

    // Get roles in JSON order, then map to players
    const orderedRoleIds = this.rolesLoader.getOrderedRoleIds();
    const playersByRole = {};
    players.forEach(p => {
      if (!playersByRole[p.role]) {
        playersByRole[p.role] = [];
      }
      playersByRole[p.role].push(p);
    });

    // Build sorted player list using JSON role order
    const sortedPlayers = [];
    orderedRoleIds.forEach(roleId => {
      if (playersByRole[roleId]) {
        sortedPlayers.push(...playersByRole[roleId]);
      }
    });

    const isolatedSet = (typeof this.getIsolatedPlayers === 'function') ? this.getIsolatedPlayers() : new Set();
    const playerListHtml = sortedPlayers
      .map(player => {
        const roleData = this.rolesLoader.getRole(player.role);
        const isDead = this.deadPlayerIds.has(player.id);
        const isIsolated = isolatedSet.has(player.id);
        const actsThisNight = this.roleActsThisNight(player.role);
        const isSelected = this.selectedRoleId === player.role;
        const isCompleted = this.roleStates[player.role]?.completed;

        // Grayed out if dead OR if role doesn't act this night
        // CRITICAL: Chien_Loup villageois must be grayed at Night 2+ (nightActive: [1])
        const isGreyedOut = isDead || !actsThisNight;

        const roleColor = roleData?.visual?.roleColor?.fondColor || 'inherit';
        const textColor = roleData?.visual?.roleColor?.textColor || '#ffffff';
        const emojiColor = roleData?.visual?.roleColor?.emojiColor || 'inherit';

        // Background color: red for dead, role color if selected, light green for all alive players
        const bgColor = isDead
          ? 'rgba(255, 100, 100, 0.2)'
          : isSelected
            ? roleColor
            : 'rgba(100, 255, 100, 0.2)';

        return `
          <div class="listbox-item ${isSelected && !isDead ? 'selected breathing' : isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${isGreyedOut ? 'disabled' : ''}"
               data-player-id="${player.id}"
               data-role-id="${player.role}"
               style="background: ${bgColor};
                      color: ${isSelected ? textColor : isGreyedOut ? '#888' : 'white'};
                      opacity: ${isGreyedOut ? 0.6 : 1};
                      cursor: ${isGreyedOut ? 'not-allowed' : 'pointer'};
                      border: ${isSelected ? '3px solid ' + roleColor : '1px solid transparent'};
                      box-shadow: ${isSelected ? '0 0 12px ' + roleColor + '40' : 'none'};
                      border-radius: 6px;
                      transition: all 0.2s ease;"
               title="${isDead ? 'Décédé' : !actsThisNight && !isCompleted ? 'Pas d\'action cette nuit' : ''}">
            <span class="item-icon" style="color: ${isDead ? '#999' : emojiColor}; font-size: 1.2em;">
              ${isDead ? '💀' : roleData?.emoji || '❓'}
            </span>
            <span class="item-name">
              ${isDead ? '💀 ' : ''}${!isDead && isIsolated ? '⛏️ ' : ''}${this.mayorId === player.id ? '🎖️ ' : ''}${player.name}
              ${!isDead && roleData?.name ? `<span style="font-size: 0.85em; opacity: 0.8;"> (${roleData.name})</span>` : ''}
            </span>
            ${isCompleted ? '<span class="item-status">✓</span>' : ''}
            ${isGreyedOut && !isDead ? '<span class="item-status" style="color: #888;">-</span>' : ''}
          </div>
        `;
      })
      .join('');

    listbox.innerHTML = (playerListHtml || '<div style="color: white; padding: 10px; text-align: center; font-size: 0.75rem;">Aucun joueur</div>')
      + '<button id="mdj-goto-summary" style="width:100%; margin-top:8px; padding:10px; border:none; border-radius:8px; background:linear-gradient(135deg,#5174db,#c77dff); color:#fff; font-weight:800; font-size:12px; cursor:pointer;">📋 Résumé de la nuit →</button>';

    // Bouton "Résumé de la nuit" : termine le tour des rôles (équivaut à ne rien faire de plus)
    document.getElementById('mdj-goto-summary')?.addEventListener('click', () => {
      // Marque les rôles encore "à jouer" comme complétés (aucune action), puis affiche le résumé
      Object.keys(this.roleStates || {}).forEach(rid => {
        if (this.roleStates[rid] && !this.roleStates[rid].completed) {
          this.roleStates[rid].completed = true;
          if (!this.roleStates[rid].result) this.roleStates[rid].result = { action: 'none', targets: [] };
        }
      });
      if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
      this.renderNightSummary();
    });

    // Attach click handlers to select player's role
    listbox.querySelectorAll('.listbox-item').forEach(item => {
      const playerId = item.dataset.playerId;
      const roleId = item.dataset.roleId;
      const isGreyedOut = item.classList.contains('disabled');

      item.addEventListener('click', () => {
        // Toujours cliquable (secours / ré-édition) : même mort, même déjà joué, même sans action.
        this.selectRole(roleId, true);
      });
    });

    // Auto-select first role with action if none selected (respecting JSON file order)
    if (!this.selectedRoleId) {
      // Get all assigned roles in JSON file order
      const assignedRoleIds = new Set(players.map(p => p.role));
      const allOrderedRoles = this.rolesLoader.getOrderedRoleIds();

      // Find first role (by JSON order) with actions this night
      const firstRoleWithAction = allOrderedRoles.find(roleId => {
        if (!assignedRoleIds.has(roleId)) return false;
        if (this.roleStates[roleId]?.completed) return false;

        const actsThisNight = this.roleActsThisNight(roleId);
        if (!actsThisNight) return false;

        // Also check that at least one player with this role is alive
        const playerWithRole = players.find(p => p.role === roleId && !(new Set(this.gm.state.deadAtNightStart || [])).has(p.id));
        return !!playerWithRole;
      });

      if (firstRoleWithAction) {
        this.selectedRoleId = firstRoleWithAction;
        console.log('[FirstNightMDJ] Auto-selected first role (by JSON order) with action:', firstRoleWithAction);
        // Apply breathing effect ONCE when auto-selecting
        this.renderLiveMap();
        this.updateMapForRole();
        this.restoreCompletedRoleEffects();
      }
    }

    // Show action section for selected role — ou le résumé de nuit si tout a été joué
    if (_showSummaryAfter) {
      this.renderNightSummary();
    } else {
      this.renderActionButtons();
    }
  }
,


  /**
   * Render the player table
   */
  renderPlayerTable() {
    const table = document.getElementById('player-table');
    const players = this.gm.state.players || [];

    const html = `
      <div class="players-grid">
        ${players
          .map(
            (player, idx) => `
          <div class="player-card" data-player-index="${idx}" data-player-name="${player}">
            <div class="player-visual"></div>
            <div class="player-name">${player}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    table.innerHTML = html;
  }
,


  /**
   * Render action controls for selected role (in right pink zone)
   * Dispatches to role-specific renderers
   */
  renderActionButtons() {
    const actionZone = document.getElementById('action-zone');
    const titleBig = document.getElementById('action-title-big');
    const actionControls = document.getElementById('action-controls');
    const actionInfo = document.getElementById('action-info');

    if (!actionZone) return;

    // ☠️ Panneau LIVE des morts de la nuit (mis à jour à chaque interaction)
    if (typeof this.renderLiveDeaths === 'function') this.renderLiveDeaths();

    if (!this.selectedRoleId) {
      if (titleBig) titleBig.innerHTML = '';
      if (actionControls) actionControls.innerHTML = '';
      if (actionInfo) actionInfo.innerHTML = '';
      return;
    }

    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    const state = this.roleStates[this.selectedRoleId];

    // Check if role acts this night
    const actsThisNight = this.roleActsThisNight(this.selectedRoleId);

    // If role doesn't act this night, skip to next role with action
    if (!actsThisNight && !state?.completed) {
      console.log(`[MDJ] ⏭️ Skipping ${this.selectedRoleId} - no action this night, jumping to next role`);
      this.completeRoleAction(); // Mark as completed (no-op) and move to next
      return;
    }

    const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
    const textColor = roleData.visual?.roleColor?.textColor || '#ffffff';

    // Find the player with this role to show their name
    const players = this.gm.state.players || [];
    const playerWithRole = players.find(p => p.role === this.selectedRoleId);
    const playerName = playerWithRole?.name || '';

    // Title with role color background (emoji shown in list, not repeated here)
    if (titleBig) {
      window.__mdjAudio = this; // pour les boutons sons inline (ours dans le résumé, etc.)
      const _audioBar = (typeof this.mdjAudioToolbarHtml === 'function') ? this.mdjAudioToolbarHtml(this.selectedRoleId) : '';
      titleBig.innerHTML = `<span>${roleData.name}${playerName ? ` (${playerName})` : ''}</span>` + _audioBar;
      titleBig.style.background = bgColor;
      titleBig.style.color = textColor;
      if (typeof this.mdjWireAudioToolbar === 'function') this.mdjWireAudioToolbar(this.selectedRoleId);
    }

    // [STANDARDISATION] Dispatch pilote par JSON ui.selectionRenderer
    //  (remplace le switch(roleId) ; fallback sur le switch si balise absente)
    const _rendererMap = {
      cupidonLover: 'renderCupidonLoverSelection',
      enfantSauvage: 'renderEnfantSauvageSelection',
      chienLoup: 'renderChienLoupSelection',
      voyante: 'renderVoyanteSelection',
      salvateur: 'renderSalvateurSelection',
      renard: 'renderRenardSelection',
      wolfKill: 'renderWolfKillSelection',
      sorciere: 'renderSorciereSelection',
      apprentiSorcier: 'renderApprentiSorcierSelection',
      corbeau: 'renderCorbeauSelection',
      voleur: 'renderVoleurSelection',
      recognition: 'renderRecognitionSelection'
    };
    const _rendererKey = roleData.ui && roleData.ui.selectionRenderer;
    const _rendererFn = _rendererKey && _rendererMap[_rendererKey];
    if (_rendererFn && typeof this[_rendererFn] === 'function') {
      this[_rendererFn](actionControls, actionInfo, bgColor, textColor, state);
      return;
    }

    // Dispatch to role-specific rendering (fallback hardcode, en cours de migration)
    switch(this.selectedRoleId) {
      case 'Cupidon':
        this.renderCupidonLoverSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Enfant_Sauvage':
        this.renderEnfantSauvageSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Chien_Loup':
        this.renderChienLoupSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Voyante':
        this.renderVoyanteSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Salvateur':
        this.renderSalvateurSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Renard':
        this.renderRenardSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Simple_Loup_Garou':
      case 'Grand_Mechant_Loup':
      case 'Loup_Garou_Blanc':
        this.renderWolfKillSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Sorciere':
        this.renderSorciereSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      case 'Corbeau':
        this.renderCorbeauSelection(actionControls, actionInfo, bgColor, textColor, state);
        break;
      default:
        // [STANDARDISATION] Renderer generique data-driven (selection de cibles + indicateur de couleur)
        this.renderGenericTargetSelection(actionControls, actionInfo, bgColor, textColor, state);
    }
  }
,


  /**
   * Skip all remaining roles and move to next phase
   */
  skipAllRoles() {
    console.log('[MDJ] Skipping all remaining roles');

    // Mark all incomplete roles as completed
    Object.keys(this.roleStates).forEach(roleId => {
      if (!this.roleStates[roleId].completed) {
        this.roleStates[roleId].completed = true;
      }
    });

    // Move to next phase
    console.log('[MDJ] All roles skipped, moving to Day phase');
    this.gm.changePhase('day');
  }
,

  /**
   * FILET DE SECURITE: force l'affichage du resume de la nuit (marque les roles restants comme faits).
   */
  forceNightSummary() {
    console.log('[MDJ] ⏯ Forçage du resume de la nuit (fallback MDJ)');
    Object.keys(this.roleStates).forEach(rid => { if (this.roleStates[rid]) this.roleStates[rid].completed = true; });
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    try { this.renderRoleListbox(); } catch (e) { console.error('renderRoleListbox failed', e); }
    try { this.renderNightSummary(); } catch (e) { console.error('renderNightSummary failed', e); }
    this.quickSave && this.quickSave();
  }
,

  /**
   * FILET DE SECURITE: passe le role courant sans rien appliquer.
   */
  forceSkipCurrentRole() {
    if (this.selectedRoleId && this.roleStates[this.selectedRoleId]) {
      this.roleStates[this.selectedRoleId].completed = true;
    }
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedRoleId = null;
    console.log('[MDJ] ⏭ Role courant passe (fallback MDJ)');
    try { this.renderRoleListbox(); } catch (e) { console.error(e); }
    this.quickSave && this.quickSave();
  }
,

  /**
   * FILET DE SECURITE: telecharge un log complet (etat + historique console) en JSON.
   */
  downloadGameLog() {
    const gm = this.gm;
    const snap = {
      timestamp: new Date().toISOString(),
      currentNight: this.currentNight,
      mayorId: this.mayorId,
      mayorName: this.mayorId ? this.getPlayerName(this.mayorId) : null,
      players: (gm?.state?.players || []).map(p => ({ id: p.id, name: p.name, role: p.role, camp: p.camp })),
      deadPlayerIds: Array.from(this.deadPlayerIds || []),
      deadNames: Array.from(this.deadPlayerIds || []).map(id => this.getPlayerName(id)),
      deathCauses: this.deathCauses,
      roleStates: this.roleStates,
      transformations: this.transformations,
      sorcierePotionsUsed: this.sorcierePotionsUsed,
      sorciereLifeUsed: this.sorciereLifeUsed,
      sorcierePoisonUsed: this.sorcierePoisonUsed,
      renardDetectedWolves: this.renardDetectedWolves,
      chasseurHasShot: this.chasseurHasShot,
      chevalierCursedWolfId: this.chevalierCursedWolfId,
      infectUsed: this.infectUsed,
      consoleLog: (window.__mdjLog || []).slice(-3000)
    };
    let txt;
    try { txt = JSON.stringify(snap, null, 2); }
    catch (e) { txt = 'Erreur serialisation: ' + e + '\n\n' + (window.__mdjLog || []).join('\n'); }
    const blob = new Blob([txt], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `loupgarou-log-nuit${this.currentNight}-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    console.log('[MDJ] 📥 Log telecharge');
  }
,


  /**
   * Move to next incomplete role
   */
  moveToNextRole() {
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const currentIdx = orderedRoles.indexOf(this.selectedRoleId);

    // Find next incomplete role
    for (let i = currentIdx + 1; i < orderedRoles.length; i++) {
      const roleId = orderedRoles[i];
      const roleData = this.rolesLoader.getRole(roleId);
      if (roleData && roleData.actionType === 'NightActive' && !this.roleStates[roleId].completed) {
        this.selectRole(roleId);
        return;
      }
    }

    // All roles completed, move to next phase
    console.log('[MDJ] All roles completed, moving to Day phase');
    this.gm.changePhase('day');
  }
,


  /**
   * Select a role from the listbox
   * @param {string} roleId
   */
  reverseRoleEffect(roleId) {
    // Annule (best-effort) les morts causées par CE rôle lors de sa saisie précédente.
    // Appelé au moment de RE-VALIDER une saisie (pas au simple clic) -> si on ne re-valide rien,
    // rien n'est touché.
    const st = this.roleStates[roleId];
    if (!st) return;
    const prev = st.result;
    const causeForRole = {
      'Simple_Loup_Garou': 'wolf', 'Grand_Mechant_Loup': 'wolf', 'Loup_Garou_Blanc': 'wolf',
      'Loup_Garou_Voyant': 'wolf', 'Infect_Pere_Loups': 'wolf'
      // NB: Sorcière gérée en inventaire verrouillé.
    };
    // Creuseur de Tunnel : re-saisie -> on annule sa mort "tunnel" (elle sera
    // ré-appliquée par completeRoleAction si la nouvelle cible est encore un loup).
    {
      const _rdT = this.rolesLoader.getRole(roleId) || {};
      const _blT = _rdT.actions ? Object.values(_rdT.actions) : [];
      if (_blT.some(b => b && typeof b === 'object' && b.type === 'isolate')) {
        const _psT = this.gm?.state?.players || [];
        const _crT = _psT.find(pp => pp.role === roleId);
        if (_crT && this.deadPlayerIds.has(_crT.id) && this.deathCauses[_crT.id] === 'tunnel') {
          this.deadPlayerIds.delete(_crT.id);
          delete this.deathCauses[_crT.id];
          console.log(`[MDJ] 🕳️↩️ Mort tunnel de ${_crT.name} annulée (re-saisie du Creuseur)`);
        }
      }
    }
    if (prev && Array.isArray(prev.targets)) {
      prev.targets.forEach(t => {
        if (String(t).startsWith('potion-')) return;
        const cause = causeForRole[roleId];
        if (cause && this.deadPlayerIds.has(t) && this.deathCauses[t] === cause) {
          this.deadPlayerIds.delete(t);
          delete this.deathCauses[t];
        }
      });
    }
  }
,

  selectRole(roleId, force = false) {
    // CRITICAL: Check if the player with this role is dead
    const players = this.gm.state.players || [];
    const playerWithRole = players.find(p => p.role === roleId);

    // (Re-cliquer un rôle déjà joué ne change RIEN tant qu'on ne re-valide pas.)
    const _deadAtStart = new Set(this.gm.state.deadAtNightStart || []);
    if (!force && playerWithRole && _deadAtStart.has(playerWithRole.id)) {
      console.log(`[MDJ] ⚠️ SKIP: ${roleId} (${playerWithRole.name}) is DEAD - finding next role`);
      // Mark this role as completed so we don't try to select it again
      if (this.roleStates[roleId]) {
        this.roleStates[roleId].completed = true;
      }
      // Find next available role
      const orderedRoles = this.rolesLoader.getOrderedRoleIds();
      for (let i = 0; i < orderedRoles.length; i++) {
        const nextRoleId = orderedRoles[i];
        if (this.roleStates[nextRoleId] && !this.roleStates[nextRoleId].completed) {
          return this.selectRole(nextRoleId);
        }
      }
      // No more roles, show summary
      return this.renderNightSummary();
    }

    console.log(`[MDJ] === SELECTING ROLE: ${roleId} ===`);
    const state = this.roleStates[roleId];
    if (state?.completed) {
      // Allow reviewing but not re-editing
      console.log(`[MDJ] ${roleId} already completed - result:`, state.result);
    }

    this.selectedRoleId = roleId;
    this.selectedPlayers = [];
    console.log(`[MDJ] Cleared selectedPlayers before rendering role`);

    // Re-render listbox, map (for breathing effect), and action buttons
    console.log(`[MDJ] Calling renderRoleListbox()`);
    this.renderRoleListbox();

    console.log(`[MDJ] Calling renderLiveMap()`);
    this.renderLiveMap();

    console.log(`[MDJ] Calling updateMapForRole() to apply current role effects`);
    this.updateMapForRole();  // Apply role-specific effects (borders, colors, etc)

    // CRITICAL: Restore effects from previously completed roles to make borders persistent
    console.log(`[MDJ] Calling restoreCompletedRoleEffects() to restore borders from other roles`);
    this.restoreCompletedRoleEffects();

    const roleData = this.rolesLoader.getRole(roleId);

    // Tous les roles (Corbeau inclus) affichent leur interface de selection.
    // Le Corbeau est appele chaque nuit pour designer la cible des 2 votes (indicateur de couleur).
    this.renderActionButtons();
    this.updateSelectedDisplay();

    // Restore effects from completed roles
    console.log(`[MDJ] Calling restoreCompletedRoleEffects() to restore previous roles' visuals`);
    this.restoreCompletedRoleEffects();

    if (roleData) {
      console.log(`[MDJ] === ROLE SELECTION COMPLETE: ${roleData.emoji} ${roleData.name} ===`);
    } else {
      console.warn(`[MDJ] Warning: Could not load role data for ${roleId}`);
    }
  }
,


  /**
   * Complete the current role action
   */
  completeRoleAction() {
    const roleId = this.actionState.roleId || this.selectedRoleId;
    const roleName = this.actionState.roleName;
    const roleEmoji = this.actionState.roleEmoji;
    const action = this.actionState.action;

    console.log(`[MDJ] Completing role action: ${roleId} -> ${action}`);

    // Ré-édition : si ce rôle avait déjà été joué, on annule d'abord son effet précédent,
    // puis on ré-applique la nouvelle saisie ci-dessous (évite le double-comptage).
    if (roleId && this.roleStates[roleId] && this.roleStates[roleId].completed) {
      this.reverseRoleEffect(roleId);
    }

    // Log the action
    if (this.selectedPlayers.length > 0) {
      if (this.logger && typeof this.logger.logAction === 'function') {
        this.logger.logAction(
          `${roleEmoji} ${roleName}`,
          this.getActionLabel(action),
          this.selectedPlayers
        );
      }
    } else {
      if (this.logger && typeof this.logger.logPhaseComplete === 'function') {
        this.logger.logPhaseComplete(`${roleEmoji} ${roleName}`);
      }
    }

    // Mark role as completed (with safety check)
    if (this.roleStates[roleId]) {
      this.roleStates[roleId].completed = true;
      this.roleStates[roleId].result = {
        action: action,
        targets: [...this.selectedPlayers]
      };
      this.roleStates[roleId]._seq = (this._seqCounter = (this._seqCounter || 0) + 1);
      // Nuit de la saisie : permet au résumé de n'afficher QUE les actions de la nuit courante
      this.roleStates[roleId]._night = this.currentNight || 1;

      // CRITICAL: Track Salvateur protection (can't protect same person 2 nights in a row)
      if (roleId === 'Salvateur' && action === 'protect' && this.selectedPlayers.length > 0) {
        this.lastSalvateurProtected = this.selectedPlayers[0];
        this.logPlayerEvent(this.selectedPlayers[0], 'Protégé par le Salvateur');
        console.log(`[MDJ] Salvateur protected ${this.getPlayerName(this.lastSalvateurProtected)} - can't protect same person next night`);
      }

      // CRITICAL: Renard — s'il ne renifle AUCUN loup, il perd son pouvoir (ne se reveille plus).
      // On detecte les loups parmi le joueur cible + ses 2 voisins vivants.
      if (roleId === 'Renard' && this.selectedPlayers.length > 0) {
        const ps = this.gm?.state?.players || [];
        const centerId = this.selectedPlayers[0];
        const idx = ps.findIndex(p => p.id === centerId);
        let wolves = 0;
        if (idx !== -1) {
          const aliveNeighbor = (start, dir) => {
            let i = start, n = ps.length;
            for (let k = 0; k < n; k++) {
              i = (i + dir + n) % n;
              if (i === idx) break;
              if (!this.deadPlayerIds.has(ps[i].id)) return ps[i];
            }
            return null;
          };
          const trio = [ps[idx], aliveNeighbor(idx, -1), aliveNeighbor(idx, +1)].filter(Boolean);
          wolves = trio.filter(p => this.isWolfRoleId(p.role)).length;
        }
        this.renardDetectedWolves = wolves > 0;
        console.log(`[MDJ] 🦊 Renard a reniflé ${wolves} loup(s) → ${this.renardDetectedWolves ? 'garde' : 'PERD'} son pouvoir`);
      }
    }

    // 🕳️ CREUSEUR DE TUNNEL — appliqué EN DIRECT à la validation (visible dans « Morts en cours »).
    // S'il isole un LOUP, il mourra au matin — SAUF s'il est immunisé (protection type Salvateur).
    if (roleId && this.roleStates[roleId] && this.roleStates[roleId].result) {
      const _rdTun = this.rolesLoader.getRole(roleId) || {};
      const _blTun = _rdTun.actions ? Object.values(_rdTun.actions) : [];
      const _isTun = _blTun.some(b => b && typeof b === 'object' && b.type === 'isolate');
      if (_isTun && this.roleActsThisNight(roleId)) {
        const _ps = this.gm?.state?.players || [];
        const _creuseur = _ps.find(pp => pp.role === roleId);
        const _tgtId = (this.roleStates[roleId].result.targets || []).find(t => t && !String(t).startsWith('potion-'));
        const _tgt = _tgtId && _ps.find(pp => pp.id === _tgtId);
        const _isWolfTgt = _tgt && this.isWolfRoleId(_tgt.role);
        if (_creuseur && _isWolfTgt && !this.deadPlayerIds.has(_creuseur.id)) {
          // Immunisé ? (protection type Salvateur — PAS sa propre isolation)
          const _protTypes = new Set(['protect', 'tankProtection', 'amuletProtection', 'bless']);
          let _shielded = false;
          Object.entries(this.roleStates).forEach(([rid2, st2]) => {
            if (!st2 || !st2.completed || !st2.result || !Array.isArray(st2.result.targets)) return;
            if ((st2._night || 1) !== (this.currentNight || 1)) return;
            const rd2 = this.rolesLoader.getRole(rid2) || {};
            const bl2 = rd2.actions ? Object.values(rd2.actions) : [];
            const isProt = rid2 === 'Salvateur' || bl2.some(b => b && typeof b === 'object' && _protTypes.has(b.type));
            if (isProt && st2.result.targets.includes(_creuseur.id)) _shielded = true;
          });
          if (_shielded) {
            console.log(`[MDJ] 🕳️🛡️ ${_creuseur.name} a isolé un LOUP mais est IMMUNISÉ — il survit`);
            if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(_creuseur.id, '🕳️🛡️ A isolé un Loup mais était protégé : il survit');
          } else {
            this.deadPlayerIds.add(_creuseur.id);
            this.deathCauses[_creuseur.id] = 'tunnel';
            if (typeof this.checkCupidonCascadingDeath === 'function') this.checkCupidonCascadingDeath(_creuseur.id);
            if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(_creuseur.id, 'Mort au matin — a creusé un tunnel vers un Loup-Garou');
            console.log(`[MDJ] 🕳️☠️ ${_creuseur.name} a isolé un LOUP → mort enregistrée en direct (appliquée au matin)`);
          }
        }
      }
    }

    // Track dead players from kill actions
    // NOTE: Protected players (e.g., Salvateur-protected) can be selected but don't count as dead
    if ((action === 'kill' || action === 'poison') && this.selectedPlayers.length > 0) {
      const players = this.gm?.state?.players || [];
      const protectedPlayers = this.getProtectedPlayers();
      this.selectedPlayers.forEach(playerId => {
        // Skip special keys like 'potion-death', 'potion-life'
        if (!playerId.startsWith('potion-')) {
          // Sorcière poison bypasses protection (poison ≠ bite), but wolf kills don't
          const isWolfKill = (action === 'kill');
          const isProtected = protectedPlayers.has(playerId);

          if (isWolfKill && typeof this.areAllWolvesIsolated === 'function' && this.areAllWolvesIsolated()) {
            // 🕳️ Tous les loups vivants sont isolés (Creuseur de Tunnel) : l'attaque est ANNULÉE
            const playerName = this.getPlayerName(playerId);
            console.log(`[MDJ] 🕳️ Attaque annulée : tous les loups vivants sont isolés — ${playerName} épargné`);
            if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(playerId, 'Épargné : tous les loups étaient isolés (Creuseur de Tunnel)');
          } else if (isWolfKill && isProtected) {
            const playerName = this.getPlayerName(playerId);
            console.log(`[MDJ] 🛡️ ${playerName} (${playerId}) is PROTECTED (immunisé) - wolf attack blocked, no death recorded`);
          } else if (isWolfKill && this.skipNextWolfKill) {
            // Fils de la Lune / Lepreux: la prochaine attaque des loups est annulee
            this.skipNextWolfKill = false;
            const playerName = this.getPlayerName(playerId);
            console.log(`[MDJ] 🌙 ${playerName} épargné: attaque des loups annulée (Fils de la Lune / Lépreux)`);
          } else if (isWolfKill && (players.find(p => p.id === playerId)?.role === 'Ancien') && !this.ancienResisted) {
            // L'Ancien survit a la PREMIERE attaque des loups
            this.ancienResisted = true;
            const playerName = this.getPlayerName(playerId);
            console.log(`[MDJ] 🛡️ ${playerName} (Ancien) résiste à la 1ère attaque des loups !`);
          } else {
            this.deadPlayerIds.add(playerId);
            const playerName = this.getPlayerName(playerId);
            const attackType = action === 'poison' && isProtected ? '☠️💜 (poison ignores protection!)' : '☠️';
            console.log(`${attackType} ${roleName} killed ${playerName} (${playerId})`);

            // Check for cascading lover death (Cupidon / Clubbeur) — généralisé
            if (typeof this.checkCupidonCascadingDeath === 'function') this.checkCupidonCascadingDeath(playerId);

            // Record the actual cause of death
            if (!this.deathCauses[playerId]) {
              // Only set if not already set (e.g., love death doesn't override)
              if (action === 'poison') {
                this.deathCauses[playerId] = 'poison';
              } else if (action === 'kill') {
                this.deathCauses[playerId] = 'wolf';
              }
            }
            // Historique du joueur
            {
              const _c = this.deathCauses[playerId];
              const _txt = _c === 'poison' ? 'Empoisonné par la Sorcière'
                         : _c === 'wolf' ? 'Tué par les Loups-Garous'
                         : 'Tué';
              this.logPlayerEvent(playerId, _txt);
            }

            // Check for Enfant Sauvage idol death - transform to wolf
            if (this.roleStates['Enfant_Sauvage']?.completed && this.roleStates['Enfant_Sauvage']?.result?.targets?.includes(playerId)) {
              const enfantPlayer = players.find(p => p.role === 'Enfant_Sauvage');
              if (enfantPlayer && !this.deadPlayerIds.has(enfantPlayer.id)) {
                console.log(`[MDJ] 🐒➡️🐺 Enfant Sauvage ${enfantPlayer.name}'s idol ${playerName} died! Transform to wolf`);

                // ANIMATION: Flash screen + breathing cycles (🐒→🐺)
                this.playEnfantSauvageTransformationAnimation(enfantPlayer);

                // Record the transformation
                this.transformations[enfantPlayer.id] = {
                  from: 'Enfant_Sauvage',
                  to: 'Simple_Loup_Garou',
                  reason: `idole ${playerName} est morte`
                };
                // Change player role to wolf
                enfantPlayer.role = 'Simple_Loup_Garou';
                enfantPlayer.camp = 'Loup'; // Change team to Wolf
                console.log(`[MDJ] ✓ ${enfantPlayer.name} is now a Simple Loup Garou (changed from Enfant Sauvage)`);
                // Force complete visual update: re-render map + legend
                this.renderLiveMap();
                this.renderLegend();
              }
            }
          }
        }
      });
      console.log(`[MDJ] ☠️ Total dead players: ${Array.from(this.deadPlayerIds).map(id => this.getPlayerName(id)).join(', ')}`);
    }

    // Handle Sorciere resurrection - remove player from dead list if using Potion Vie
    if (roleId === 'Sorciere' && action === 'resurrect' && this.selectedPlayers.length > 0) {
      this.selectedPlayers.forEach(playerId => {
        if (!playerId.startsWith('potion-')) {
          if (this.deadPlayerIds.has(playerId)) {
            this.deadPlayerIds.delete(playerId);
            const playerName = this.getPlayerName(playerId);
            this.logPlayerEvent(playerId, 'Sauvé par la Sorcière (potion de vie)');
            console.log(`[MDJ] 💚 Sorciere resurrected ${playerName} (${playerId}) - removed from dead list`);
          }
        }
      });
      // CRITICAL: Increment potion counter + flag potion de VIE utilisee
      this.sorcierePotionsUsed++;
      this.sorciereLifeUsed = true;
      console.log(`[MDJ] 🧙‍♀️ Sorciere potion VIE utilisee (${this.sorcierePotionsUsed}/2)`);
    }

    // CRITICAL: Track Sorciere poison potion usage
    if (roleId === 'Sorciere' && action === 'poison') {
      this.sorcierePotionsUsed++;
      this.sorcierePoisonUsed = true;
      console.log(`[MDJ] 🧙‍♀️ Sorciere potion MORT utilisee (${this.sorcierePotionsUsed}/2)`);
    }

    // INFECT PERE DES LOUPS: convertit la cible en loup (1x/partie) au lieu de la tuer
    if (action === 'convert' && this.selectedPlayers.length > 0 && !this.infectUsed) {
      const ps = this.gm?.state?.players || [];
      this.selectedPlayers.forEach(pid => {
        if (String(pid).startsWith('potion-')) return;
        const tp = ps.find(p => p.id === pid);
        if (tp && !this.deadPlayerIds.has(tp.id)) {
          this.transformations[tp.id] = { from: tp.role, to: 'Simple_Loup_Garou', reason: 'infecté par le Père des Loups' };
          tp.role = 'Simple_Loup_Garou';
          tp.camp = 'Loup';
          // S'il avait ete marque mort cette nuit par les loups, il survit converti
          this.deadPlayerIds.delete(tp.id);
          console.log(`[MDJ] 🩸 ${tp.name} infecté → devient Loup-Garou`);
        }
      });
      this.infectUsed = true;
    }

    // VOLEUR: echange son role avec un autre joueur (cible = selectedPlayers[0], MDJ ou aleatoire)
    if (action === 'roleSwap' && roleId === 'Voleur' && this.selectedPlayers.length > 0) {
      const ps = this.gm?.state?.players || [];
      const voleur = ps.find(p => p.role === 'Voleur');
      const targetId = this.selectedPlayers.find(t => !String(t).startsWith('potion-'));
      const target = ps.find(p => p.id === targetId);
      if (voleur && target && voleur.id !== target.id) {
        const tmp = voleur.role; voleur.role = target.role; target.role = tmp;
        this.transformations[voleur.id] = { from: 'Voleur', to: voleur.role, reason: 'role vole' };
        this.transformations[target.id] = { from: voleur.role, to: target.role, reason: 'role echange avec le Voleur' };
        console.log(`[MDJ] 🦝 Voleur ${voleur.name} echange son role avec ${target.name} -> ${voleur.role}`);
      }
    }

    // COMEDIEN: copie le role d'un joueur choisi (devient ce role)
    if (action === 'changeRole' && roleId === 'Comedien' && this.selectedPlayers.length > 0) {
      const ps = this.gm?.state?.players || [];
      const comedien = ps.find(p => p.role === 'Comedien');
      const targetId = this.selectedPlayers.find(t => !String(t).startsWith('potion-'));
      const target = ps.find(p => p.id === targetId);
      if (comedien && target) {
        this.transformations[comedien.id] = { from: 'Comedien', to: target.role, reason: `copie le role de ${target.name}` };
        comedien.role = target.role;
        console.log(`[MDJ] 🎭 Comedien ${comedien.name} copie le role de ${target.name} -> ${target.role}`);
      }
    }

    // Clear selections
    this.selectedPlayers = [];
    this.actionState = {};
    // Don't clear selectedRoleId yet - we'll find and select the next one

    // Clear UI selections
    document.querySelectorAll('.player-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    // Update progress
    this.updateProgressCount();

    console.log(`[MDJ] Role ${roleId} completed. Looking for next role...`);

    // CRITICAL: Save game state to cache after every action
    if (this.gm && typeof this.gm.saveState === 'function') {
      this.gm.saveState();
    }
    if (window.gameUI && typeof window.gameUI.saveGameStateToCache === 'function') {
      window.gameUI.saveGameStateToCache();
      console.log('[MDJ] ✓ Game state saved to cache');
    }

    // Find next role with action and auto-select it
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const currentRoleIdx = orderedRoles.indexOf(roleId);
    let nextRoleWithAction = null;

    for (let i = currentRoleIdx + 1; i < orderedRoles.length; i++) {
      const nextRoleId = orderedRoles[i];
      const nextRoleData = this.rolesLoader.getRole(nextRoleId);

      // Check if role is assigned and not completed
      const players = this.gm.state.players || [];
      const isAssigned = players.some(p => p.role === nextRoleId);
      const isCompleted = this.roleStates[nextRoleId]?.completed;

      // Check if role has actions this night
      const actsThisNight = this.roleActsThisNight(nextRoleId);

      // Check if at least one player with this role exists (dead or alive - they play their role at night, discover death in morning)
      const playerWithRole = players.find(p => p.role === nextRoleId);

      if (isAssigned && !isCompleted && actsThisNight && playerWithRole) {
        nextRoleWithAction = nextRoleId;
        break;
      }
    }

    // Re-render to update UI
    this.renderRoleListbox();

    // Auto-select next role if found (this will show the breathing animation)
    if (nextRoleWithAction) {
      console.log(`[MDJ] Auto-selecting next role with action: ${nextRoleWithAction}`);
      this.selectRole(nextRoleWithAction);
    } else {
      this.renderActionButtons();
      console.log(`[MDJ] No more roles with actions - night summary will display`);
    }

    // Check if all roles are done
    this.checkIfNightComplete();
  }
,


  /**
   * Check and apply cascading Cupidon death (if victim is a lover, other lover dies too)
   * CRITICAL: Called when ANY death occurs (wolf kill, Chasseur shot, lynch, etc.)
   */
  checkCupidonCascadingDeath(victimId) {
    // Couvre Cupidon (2 amoureux) ET Clubbeur (3 amoureux). Si un amoureux meurt,
    // TOUS les autres amoureux vivants du même groupe meurent aussi (de chagrin).
    // TRANSITIF : si un joueur appartient aux DEUX groupes (Cupidon + Clubbeur),
    // sa mort de chagrin propage aussi à l'AUTRE groupe (chaîne d'amour complète).
    const LOVE_ROLES = ['Cupidon', 'Custom_Clubbeur'];
    const queue = [victimId];
    const processed = new Set();
    while (queue.length) {
      const vid = queue.shift();
      if (processed.has(vid)) continue;
      processed.add(vid);
      LOVE_ROLES.forEach(rid => {
        const st = this.roleStates[rid];
        if (!st || !st.completed || !st.result || !Array.isArray(st.result.targets)) return;
        const lovers = st.result.targets;
        if (!lovers.includes(vid)) return;
        const victimName = this.getPlayerName(vid);
        lovers.forEach(id => {
          if (id === vid || this.deadPlayerIds.has(id)) return;
          this.deadPlayerIds.add(id);
          this.deathCauses[id] = 'love';
          if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(id, 'Mort de chagrin (amoureux)');
          console.log(`[MDJ] 💔 Cascading death: ${this.getPlayerName(id)} (${id}) meurt avec l'amoureux ${victimName} (${vid})`);
          queue.push(id); // s'il est aussi amoureux dans l'AUTRE groupe → cascade
        });
      });
    }
  }
,


  /**
   * Play animation for Enfant Sauvage transformation (🐒 → 🐺)
   * Flash screen + 2 breathing cycles
   */
  playEnfantSauvageTransformationAnimation(enfantPlayer) {
    const mapContainer = document.getElementById('mdj-live-map');
    if (!mapContainer) return;

    // Find the player's avatar point on map
    const playerPoint = mapContainer.querySelector(`[data-player-id="${enfantPlayer.id}"]`);
    if (!playerPoint) return;

    const emoji = playerPoint.querySelector('.mdj-point-emoji');
    if (!emoji) return;

    // 1. FLASH SCREEN
    const flashEl = document.createElement('div');
    flashEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      pointer-events: none;
      animation: flashFade 0.4s ease-out;
      z-index: 9999;
    `;

    // Add animation keyframes if not already present
    if (!document.getElementById('enfant-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'enfant-animation-styles';
      style.textContent = `
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes breatheTransform {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(flashEl);
    setTimeout(() => flashEl.remove(), 400);

    // 2. BREATHING CYCLES: 🐒→🐺 (2x)
    const originalEmoji = '🐒';
    const wolfEmoji = '🐺';
    let cycleCount = 0;
    const maxCycles = 2;

    const breathingInterval = setInterval(() => {
      if (cycleCount >= maxCycles) {
        clearInterval(breathingInterval);
        emoji.textContent = wolfEmoji; // End on wolf emoji
        emoji.style.animation = 'none';
        return;
      }

      // Alternate emoji every 300ms
      const isWolfPhase = (cycleCount % 2 === 1);
      emoji.textContent = isWolfPhase ? wolfEmoji : originalEmoji;
      emoji.style.animation = 'breatheTransform 0.6s ease-in-out';
      cycleCount++;
    }, 600);

    console.log(`[MDJ] 🎬 Animation: ${enfantPlayer.name} transforms from 🐒 to 🐺 (2 cycles)`);
  }
,


  /**
   * Update progress count
   */
  updateProgressCount() {
    const completed = Object.values(this.roleStates).filter(
      state => state.completed
    ).length;
    const total = Object.keys(this.roleStates).length;

    const completedEl = document.querySelector('.completed-count');
    const totalEl = document.querySelector('.total-count');

    if (completedEl) completedEl.textContent = completed;
    if (totalEl) totalEl.textContent = total;
  }
,


  /**
   * Check if all roles are completed
   * NOTE: Only count roles whose players are ALIVE
   * Dead players don't need to complete their night actions
   * NOTE: No automatic phase change - user must click "Débat et Vote" button
   */
  checkIfNightComplete() {
    const players = this.gm.state.players || [];

    // IMPORTANT: un joueur tué PENDANT la nuit joue quand même son tour (il découvre
    // sa mort au matin). On ne dispense que les joueurs morts AVANT la nuit.
    const _deadStartNC = new Set(this.gm.state.deadAtNightStart || []);
    const allCompleted = Object.entries(this.roleStates).every(([roleId, state]) => {
      const playerWithRole = players.find(p => p.role === roleId);
      const isAlive = playerWithRole && !_deadStartNC.has(playerWithRole.id);
      // Role qui n'agit pas cette nuit (ex: Loup Blanc nuit impaire) => ne pas attendre
      const acts = this.roleActsThisNight(roleId);
      return !isAlive || !acts || state.completed;
    });

    console.log(`[MDJ] checkIfNightComplete: checking completion status`);
    console.log(`[MDJ]   - Completed roles:`, Object.entries(this.roleStates).filter(([_, s]) => s.completed).map(([id]) => id));
    const pendingRoles = Object.entries(this.roleStates)
      .filter(([roleId, s]) => {
        const playerWithRole = players.find(p => p.role === roleId);
        const isAlive = playerWithRole && !_deadStartNC.has(playerWithRole.id);
        return isAlive && this.roleActsThisNight(roleId) && !s.completed;
      })
      .map(([id]) => id);
    console.log(`[MDJ]   - Pending roles (alive players only):`, pendingRoles);
    console.log(`[MDJ]   - allCompleted: ${allCompleted}`);

    if (allCompleted) {
      console.log('[MDJ] ✓ First night complete! Night summary is ready.');
      // Log morning phase if function exists
      if (this.logger && typeof this.logger.logMorning === 'function') {
        this.logger.logMorning(1);
      }

      // Display night summary
      this.renderNightSummary();

      // User clicks "Débat et Vote" button to proceed to day phase
      // No automatic transition - let user review summary first
    } else {
      console.log(`[MDJ] ⚠️ Night not complete yet - waiting for remaining roles`);
    }
  }

});
