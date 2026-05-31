/**
 * 03-FirstNight-MDJ.js
 *
 * Mode Maître du Jeu Animé (MDJ) - First Night
 *
 * VERSION: 47
 *
 * Layout:
 * - Left: Full-height listbox with role list
 * - Right: Interactive player table with action buttons
 *
 * The MDJ:
 * 1. Sees all players on the right side
 * 2. Selects a role from the left listbox
 * 3. Action buttons appear for that role
 * 4. Clicks on players to apply actions (color lovers, designate idol, etc.)
 * 5. Logs all actions
 */

/**
 * PlayerRegistry - Centralized player data management
 * Handles all player filtering and state queries
 */
class PlayerRegistry {
  constructor(players, deadPlayerIds = new Set()) {
    this.players = players || [];
    this.deadPlayerIds = deadPlayerIds;
  }

  // Get all alive players
  getAlive() {
    return this.players.filter(p => !this.deadPlayerIds.has(p.id));
  }

  // Get all dead players
  getDead() {
    return this.players.filter(p => this.deadPlayerIds.has(p.id));
  }

  // Get all wolf players (alive)
  getWolves(aliveOnly = true) {
    const wolves = this.players.filter(p =>
      p.role && (p.role.includes('Loup') || p.role.includes('Wolf'))
    );
    return aliveOnly ? wolves.filter(p => !this.deadPlayerIds.has(p.id)) : wolves;
  }

  // Get all villagers (alive)
  getVillagers(aliveOnly = true) {
    const villagers = this.players.filter(p =>
      !p.role || (!p.role.includes('Loup') && !p.role.includes('Wolf'))
    );
    return aliveOnly ? villagers.filter(p => !this.deadPlayerIds.has(p.id)) : villagers;
  }

  // Get non-wolves (for wolf kill targets)
  getNonWolves(aliveOnly = true) {
    const nonWolves = this.players.filter(p =>
      !p.role || (!p.role.includes('Loup') && !p.role.includes('Wolf'))
    );
    return aliveOnly ? nonWolves.filter(p => !this.deadPlayerIds.has(p.id)) : nonWolves;
  }

  // Get other wolves (for Loup_Garou_Blanc killing targets)
  getOtherWolves(aliveOnly = true) {
    const wolves = this.players.filter(p =>
      p.role && (p.role.includes('Loup') || p.role.includes('Wolf'))
    );
    return aliveOnly ? wolves.filter(p => !this.deadPlayerIds.has(p.id)) : wolves;
  }

  // Check if player is dead
  isDead(playerId) {
    return this.deadPlayerIds.has(playerId);
  }

  // Check if player is wolf
  isWolf(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return player && (player.role.includes('Loup') || player.role.includes('Wolf'));
  }

  // Get player by ID
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }
}

class FirstNightMDJ {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    this.logger = window.gameLogger;

    // Use rolesLoader if available, otherwise create a wrapper using window functions
    if (window.rolesLoader) {
      this.rolesLoader = window.rolesLoader;
    } else {
      // Create a wrapper using available window functions
      this.rolesLoader = {
        getOrderedRoleIds: () => window.getOrderedRoleIds?.() || [],
        getRole: (roleId) => window.ROLES_DATA?.roles?.[roleId] || null
      };
      console.log('[FirstNightMDJ] ✓ Created rolesLoader wrapper from window functions');
    }

    // Version message
    console.log('VERSION 34');
    console.log('v34: Auto-skip grayed roles + show (immunisé) for protected wolf victims | Greyed roles jump to next action');

    // Debug logging
    console.log('[FirstNightMDJ] Constructor:', {
      gm: !!gm,
      container: !!container,
      logger: !!this.logger,
      rolesLoader: !!this.rolesLoader
    });

    // State
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    this.actionState = {};
    this.roleStates = {}; // Track which roles are completed
    this.deadPlayerIds = new Set(); // Track players who have been killed
    this.deathCauses = {}; // Track cause of death for each dead player (playerId -> cause)
    this.transformations = {}; // Track role transformations (playerId -> {from, to, reason})

    // Initialize PlayerRegistry for centralized player data management
    this.playerRegistry = new PlayerRegistry(this.gm?.state?.players || [], this.deadPlayerIds);

    // Timer state
    this.timerDuration = 5 * 60; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.timerInterval = null;

    // Mayor election tracking
    this.selectedMayorId = null; // Player selected during election UI
    this.mayorId = null; // Elected mayor (null if none)
    this.mayorElectionCompleted = false; // Flag: has mayor election been completed?

    // Voting phase tracking
    this.selectedLynchVictimId = null; // Player selected for lynch vote

    // Night phase tracking
    this.currentNight = 1; // Track which night we're on (1, 2, 3, ...)

    // Initialize role states
    this.initializeRoleStates();
  }

  /**
   * Helper: Get player name from ID
   * Used to display player names instead of IDs in all logs and UI
   */
  getPlayerName(playerId) {
    if (!playerId) return '???';
    const players = this.gm?.state?.players || [];
    const player = players.find(p => p.id === playerId);
    return player?.name || playerId; // Fallback to ID if not found
  }

  /**
   * Helper: Get player display name with mayor medal if applicable
   * Shows "🎖️ Name" if player is the elected mayor
   */
  getPlayerDisplayName(playerId) {
    const name = this.getPlayerName(playerId);
    if (this.mayorId && this.mayorId === playerId) {
      return `🎖️ ${name}`;
    }
    return name;
  }

  /**
   * Helper: Get all protected players (Salvateur protection)
   * Returns Set of player IDs that are protected
   */
  getProtectedPlayers() {
    const protectedSet = new Set();

    // Check if Salvateur has completed and has targets
    if (this.roleStates['Salvateur']?.completed && this.roleStates['Salvateur']?.result?.targets) {
      this.roleStates['Salvateur'].result.targets.forEach(targetId => {
        if (targetId && !targetId.startsWith('potion-')) {
          protectedSet.add(targetId);
        }
      });
    }

    return protectedSet;
  }

  /**
   * Check if a role has an action that's active for this night phase
   * Handles: firstNight, everyNight, everyOtherNight, etc.
   * @param {string} roleId
   * @returns {boolean}
   */
  hasActionForPhase(roleId) {
    const roleData = this.rolesLoader.getRole(roleId);
    if (!roleData) return false;

    // Check standard mdj_night_actions field
    if (roleData.actions?.mdj_night_actions && roleData.actions.mdj_night_actions.length > 0) {
      console.log(`[MDJ] ${roleId} has mdj_night_actions`);
      return true;
    }

    // Determine current night number: this is FirstNight = night 1
    const currentNightNumber = 1;
    const isEvenNight = currentNightNumber % 2 === 0;
    const isOddNight = currentNightNumber % 2 === 1;

    // Check if role has actions object with phase-dependent actions
    if (roleData.actions && typeof roleData.actions === 'object') {
      for (const [actionKey, actionData] of Object.entries(roleData.actions)) {
        // Skip mdj_night_actions field
        if (actionKey === 'mdj_night_actions') continue;

        // Check if this is an action object (not a string)
        if (typeof actionData === 'object' && actionData.enabled !== false) {
          const phase = actionData.phase;
          let isActiveThisNight = false;

          // Check if action is active for this night based on phase
          if (!phase) {
            // No phase = always active
            isActiveThisNight = true;
          } else if (phase === 'everyNight') {
            // Active every night
            isActiveThisNight = true;
          } else if (phase === 'firstNight') {
            // Active only on first night
            isActiveThisNight = (currentNightNumber === 1);
          } else if (phase === 'everyOtherNight') {
            // Active on even nights (2, 4, 6, etc.)
            isActiveThisNight = isEvenNight;
          } else if (phase === 'afterFirstNight') {
            // Active after first night (nights 2+)
            isActiveThisNight = (currentNightNumber > 1);
          }

          if (isActiveThisNight) {
            console.log(`[MDJ] ${roleId} action "${actionKey}" ACTIVE for night ${currentNightNumber} (phase: ${phase || 'none'})`);
            return true;
          } else {
            console.log(`[MDJ] ${roleId} action "${actionKey}" INACTIVE for night ${currentNightNumber} (phase: ${phase})`);
          }
        }
      }
    }

    return false;
  }

  /**
   * Initialize tracking for all active roles
   * Uses same filter logic as renderRoleListbox() for consistency
   */
  initializeRoleStates() {
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const players = this.gm.state.players || [];
    const assignedRoleIds = new Set(players.map(p => p.role));

    orderedRoles.forEach(roleId => {
      // Only initialize roles that are ASSIGNED to players
      if (!assignedRoleIds.has(roleId)) return;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return;

      // Check if role has night actions ACTIVE FOR THIS PHASE
      // If actionType is NightActive, still need to verify action is active for THIS phase
      let hasNightAction = false;

      if (roleData.actionType === 'NightActive') {
        // Even NightActive roles must have an action for this phase
        hasNightAction = this.hasActionForPhase(roleId);
      } else {
        // Non-NightActive roles might still have mdj_night_actions
        hasNightAction = this.hasActionForPhase(roleId);
      }

      if (hasNightAction) {
        this.roleStates[roleId] = {
          completed: false,
          selected: false,
          result: null
        };
      }
    });

  }

  /**
   * Initialize the first night MDJ phase
   */
  init() {
    // Log night start if logger has this method
    if (this.logger && typeof this.logger.logNightStart === 'function') {
      this.logger.logNightStart(1);
    }
    this.render();
    this.attachEvents();
  }

  /**
   * Main render method - Table+Legend (LEFT) | Roles (CENTER/BLUE) | Actions (RIGHT/PINK)
   */
  render() {
    // CRITICAL: Clear cached player positions so they're recalculated with new table size
    if (this.gm.state.players) {
      this.gm.state.players.forEach(p => {
        delete p.tableX;
        delete p.tableY;
      });
    }

    this.container.innerHTML = `
      <div class="mdj-main-container">
        <!-- LEFT: Live Map Table + Legend -->
        <div class="mdj-left-panel">
          <div class="panel-header-compact">👥 LA TABLE</div>
          <div class="mdj-live-map" id="mdj-live-map"></div>
          <div class="mdj-legend" id="mdj-legend"></div>
        </div>

        <!-- RESIZE HANDLE -->
        <div class="mdj-resize-handle" id="resize-left-center"></div>

        <!-- CENTER: Blue Role List Zone -->
        <div class="mdj-center-panel">
          <div class="mdj-role-list-wrapper">
            <div class="role-list-header">🌙 Nuit 1</div>
            <div class="role-list-blue" id="role-listbox"></div>
          </div>
        </div>

        <!-- RESIZE HANDLE -->
        <div class="mdj-resize-handle" id="resize-center-right"></div>

        <!-- RIGHT: Pink Action Zone -->
        <div class="mdj-right-panel">
          <div class="mdj-action-zone" id="action-zone">
            <div class="action-title-big" id="action-title-big"></div>
            <div class="action-controls" id="action-controls"></div>
            <div class="action-info" id="action-info"></div>
          </div>
        </div>
      </div>
    `;

    this.ensureStyles();
    this.renderLiveMap();
    this.renderLegend();
    this.renderRoleListbox();
    this.attachResizeHandlers();
    this.logDimensions();
  }

  /**
   * Render the live map avec emoji et couleurs du JSON
   * IMPORTANT: Table scaled to fit entirely in left panel
   */
  renderLiveMap() {
    const mapContainer = document.getElementById('mdj-live-map');
    if (!mapContainer) return;

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

      return `
        <div class="mdj-player-point ${isCurrentRole ? 'breathing' : ''}" data-player-id="${p.id}" data-player-name="${p.name}" data-original-emoji="${emoji}"
             style="left: ${x}px; top: ${y}px; position: absolute; ${deadStyle}">
          <div class="mdj-point-dot" style="background: ${bgColor}; --affected-border: ${affectedBorderColor};">
            <span class="mdj-point-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
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
      titleBig.innerHTML = '🌙 Résumé Nuit 1';
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

          // Check if Chasseur needs to shoot first
          const players = this.gm.state.players || [];
          const deadChaseur = players.find(p => this.deadPlayerIds.has(p.id) && p.role === 'Chasseur');
          const chasseurTargetSelect = document.getElementById('chasseur-target');

          if (deadChaseur && chasseurTargetSelect) {
            const chasseurTargetId = chasseurTargetSelect.value;
            if (chasseurTargetId) {
              // Chasseur shoots first
              console.log('[MDJ] 🏹 Chasseur shoots:', chasseurTargetId);
              this.deadPlayerIds.add(chasseurTargetId);
            }
          }

          // Execute lynch
          this.executeLynch(victimId);
        });
      }
    }
  }

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
      ${playerListHtml}
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
      <select class="day-vote-combobox" style="width: 100%; padding: 8px; margin: 8px 12px; font-size: 0.9rem; background: rgba(0,0,0,0.3); color: white; border: 1px solid #e74c3c; border-radius: 3px;">
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

  /**
   * Get HTML for night summary (actions + deaths) - 2-column table layout
   */
  getNightSummaryHtml() {
    const players = this.gm.state.players || [];
    const actions = [];
    const deaths = [];
    // Lynch can include ANYONE alive, even wolves - removed wolf filter
    const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id));

    // Collect actions
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
        }
      }
    });

    // Check for Enfant Sauvage transformation
    Object.entries(this.transformations).forEach(([playerId, trans]) => {
      if (trans.from === 'Enfant_Sauvage') {
        const playerName = this.getPlayerName(playerId);
        actions.push(`🐒➡️🐺 ${playerName} (Enfant Sauvage) transformé en loup - ${trans.reason}`);
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
        <div style="padding:8px; margin-bottom:8px; background:rgba(139,69,19,0.1); border-left:3px solid #8B4513; font-size:10px;">
          ${growlText}
        </div>
      `;
    }

    const actionsHtml = actions.length > 0
      ? montreurOursHtml + actions.map(a => `<div style="padding:6px; margin-bottom:4px; font-size:10px;">${a}</div>`).join('')
      : montreurOursHtml + '<div style="padding:8px; text-align:center; color:#999; font-size:10px;">Aucune action</div>';

    const deathsHtml = deaths.length > 0
      ? deaths.map(d => `<div style="padding:6px; margin-bottom:4px; font-size:10px;"><strong>${d.emoji} ${d.name}</strong><br><span style="color:#ff9999; font-size:9px;">${d.cause}</span></div>`).join('')
      : '<div style="padding:8px; text-align:center; color:#999; font-size:10px;">Aucune mort</div>';

    // Check for special role deaths that need handling
    const deadChaseur = deaths.find(d => d.role === 'Chasseur');
    const deadChevalier = deaths.find(d => d.role === 'Chevalier_Epee_Rouille');
    const deadMaire = deaths.find(d => d.role === 'Maire'); // TODO: implement Maire

    // Build special sections HTML
    let specialSectionsHtml = '';

    if (deadChaseur) {
      const alivePlayers = players.filter(p => !this.deadPlayerIds.has(p.id));
      const playerOptions = alivePlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      specialSectionsHtml += `
        <div style="border: 1px solid rgba(200,150,100,0.3); border-radius: 4px; padding: 10px; background: rgba(200,150,100,0.05); margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #d4a574; font-size: 11px; font-weight: 600;">🏹 Chasseur Mort - Vengeance</h4>
          <p style="margin: 0 0 8px 0; font-size: 10px; color: #ccc;">Le Chasseur a pu tirer avant de mourir. Qui visait-il?</p>
          <select id="chasseur-target" style="width: 100%; padding: 6px; font-size: 10px; border-radius: 3px; border: 1px solid #555; background: #333; color: #fff;">
            <option value="">-- Sélectionner une cible --</option>
            ${playerOptions}
          </select>
        </div>
      `;
    }

    if (deadChevalier) {
      specialSectionsHtml += `
        <div style="border: 1px solid rgba(255,200,0,0.3); border-radius: 4px; padding: 10px; background: rgba(255,200,0,0.05); margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #ffc800; font-size: 11px; font-weight: 600;">⚔️ Chevalier à l'Épée Rouillée - Malédiction</h4>
          <p style="margin: 0; font-size: 10px; color: #ccc;">Le premier loup à la gauche du Chevalier mourra demain matin...</p>
        </div>
      `;
    }

    // 2-column main layout
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <!-- LEFT COLUMN: Actions -->
        <div style="border: 1px solid rgba(129,223,247,0.3); border-radius: 4px; padding: 8px; background: rgba(129,223,247,0.05);">
          <h4 style="margin: 0 0 8px 0; color: #81dff7; font-size: 11px; font-weight: 600;">📋 Actions</h4>
          <div style="max-height: 150px; overflow-y: auto;">
            ${actionsHtml}
          </div>
        </div>

        <!-- RIGHT COLUMN: Deaths -->
        <div style="border: 1px solid rgba(255,153,153,0.3); border-radius: 4px; padding: 8px; background: rgba(255,153,153,0.05);">
          <h4 style="margin: 0 0 8px 0; color: #ff9999; font-size: 11px; font-weight: 600;">☠️ Morts</h4>
          <div style="max-height: 150px; overflow-y: auto;">
            ${deathsHtml}
          </div>
        </div>
      </div>

      <!-- SPECIAL SECTIONS (Chasseur, Chevalier, etc.) -->
      ${specialSectionsHtml}

      <!-- LYNCH SELECTION -->
      <div style="border: 1px solid rgba(200,100,200,0.3); border-radius: 4px; padding: 10px; background: rgba(200,100,200,0.05);">
        <h4 style="margin: 0 0 8px 0; color: #d966ff; font-size: 11px; font-weight: 600;">🪓 Vote du Village - Au Bûcher!</h4>
        <p style="margin: 0 0 8px 0; font-size: 10px; color: #ccc;">Qui sera exécuté aujourd'hui?</p>
        <select id="lynch-target" style="width: 100%; padding: 8px; font-size: 10px; border-radius: 3px; border: 1px solid #555; background: #333; color: #fff; margin-bottom: 8px;">
          <option value="">-- Sélectionner une victime --</option>
          ${alivePlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Execute lynch - kill player and reveal role
   */
  executeLynch(victimId) {
    const players = this.gm.state.players || [];
    const victim = players.find(p => p.id === victimId);
    const victimRole = this.rolesLoader.getRole(victim.role);

    console.log(`[MDJ] 🔥 ${victim.name} lynched - role revealed: ${victim.role}`);

    // Add to dead players
    this.deadPlayerIds.add(victimId);
    this.deathCauses[victimId] = 'lynch'; // Record lynch as cause

    // Update map to show dead player
    const mdjMap = document.getElementById('mdj-live-map');
    if (mdjMap) {
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

    if (actionControls) {
      actionControls.innerHTML = `
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
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); color: #95a5a6; font-size: 11px;">
            Rendormez-vous, 2ème Nuit!
          </div>
        </div>
      `;
    }

    if (actionInfo) {
      actionInfo.innerHTML = `
        <button id="btn-continue-night2" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px;">
          ✓ Continuer vers Nuit 2
        </button>
      `;

      const continueBtn = actionInfo.querySelector('#btn-continue-night2');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          console.log('[MDJ] Moving to Night 2');
          this.startNight2();
        });
      }
    }

    // Zone bleue stays as player list - already disabled by disableRoleListbox()
  }

  /**
   * Start Night 2 with role filtering
   * Only show roles with actual night actions (exclude Cupidon, Enfant_Sauvage, etc.)
   */
  startNight2() {
    console.log('[MDJ] ===== NIGHT 2 START =====');
    this.currentNight = 2;

    // Reset selections for night 2
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedMayorId = null;
    this.selectedLynchVictimId = null;

    // Reinitialize role states for Night 2 (only roles with night actions)
    this.initializeNight2RoleStates();

    // Update the center panel header
    const centerPanel = document.querySelector('.mdj-role-list-wrapper');
    if (centerPanel) {
      const header = centerPanel.querySelector('.role-list-header');
      if (header) {
        header.textContent = '🌙 Nuit 2';
      }
    }

    // Re-render the role listbox
    this.renderRoleListbox();
  }

  /**
   * Initialize role states for Night 2
   * Only include roles that have actual night actions (NightActive)
   * IMPORTANT: Dead players' roles should NOT be initialized for next night
   */
  initializeNight2RoleStates() {
    this.roleStates = {}; // Clear previous states
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

      // For Night 2+: Check if this role plays THIS NIGHT
      // Must have actionType === 'NightActive' AND nightActive must include this night
      const isNightActiveRole = roleData.actionType === 'NightActive';
      const nightActive = roleData.nightActive || [];

      // If nightActive is specified, check if this night is included
      // If not specified, assume it plays all nights
      const playsThisNight = nightActive.length === 0 || nightActive.includes(this.currentNight);

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

  renderRoleListbox() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;

    // PRIORITY 1: If mayor election not done yet, show it FIRST (before any roles)
    if (!this.mayorElectionCompleted) {
      console.log('[MDJ] Mayor election not completed - showing mayor election first');
      return this.startMayorElection();
    }

    // PRIORITY 2: Check if all roles are completed - if so, DISABLE clicks but keep list visible
    const completedRoleIds = Object.keys(this.roleStates);
    const allCompleted = completedRoleIds.length > 0 && completedRoleIds.every(roleId => this.roleStates[roleId].completed);

    if (allCompleted) {
      // Just disable clicks - zone bleue MUST stay as player list!
      this.disableRoleListbox();
      return this.renderNightSummary();
    }

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
        const roleData = this.rolesLoader.getRole(p.role);
        const nightActive = roleData?.nightActive || [];
        return nightActive.length > 0 && nightActive.includes(this.currentNight);
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

        const roleData = this.rolesLoader.getRole(roleId);
        const nightActive = roleData?.nightActive || [];
        const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);
        if (!actsThisNight) return false;

        const playerWithRole = players.find(p => p.role === roleId && !this.deadPlayerIds.has(p.id));
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

    const playerListHtml = sortedPlayers
      .map(player => {
        const roleData = this.rolesLoader.getRole(player.role);
        const isDead = this.deadPlayerIds.has(player.id);
        const nightActive = roleData?.nightActive || [];
        const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);
        const isSelected = this.selectedRoleId === player.role;
        const isCompleted = this.roleStates[player.role]?.completed;

        // Grayed out if dead OR if role doesn't act this night
        const isGreyedOut = isDead || (!actsThisNight && !isCompleted);

        const roleColor = roleData?.visual?.roleColor?.fondColor || 'inherit';
        const textColor = roleData?.visual?.roleColor?.textColor || '#ffffff';
        const emojiColor = roleData?.visual?.roleColor?.emojiColor || 'inherit';

        return `
          <div class="listbox-item ${isSelected ? 'selected breathing' : ''} ${isCompleted ? 'completed' : ''} ${isGreyedOut ? 'disabled' : ''}"
               data-player-id="${player.id}"
               data-role-id="${player.role}"
               style="background: ${isGreyedOut ? 'rgba(100,100,100,0.2)' : isSelected ? roleColor : isDead ? 'rgba(100,100,100,0.1)' : 'rgba(255,255,255,0.1)'};
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
              ${isDead ? '💀 ' : ''}${this.mayorId === player.id ? '🎖️ ' : ''}${player.name}
              ${!isDead && roleData?.name ? `<span style="font-size: 0.85em; opacity: 0.8;"> (${roleData.name})</span>` : ''}
            </span>
            ${isCompleted ? '<span class="item-status">✓</span>' : ''}
            ${isGreyedOut && !isDead ? '<span class="item-status" style="color: #888;">-</span>' : ''}
          </div>
        `;
      })
      .join('');

    listbox.innerHTML = playerListHtml || '<div style="color: white; padding: 10px; text-align: center; font-size: 0.75rem;">Aucun joueur</div>';

    // Attach click handlers to select player's role
    listbox.querySelectorAll('.listbox-item').forEach(item => {
      const playerId = item.dataset.playerId;
      const roleId = item.dataset.roleId;
      const isGreyedOut = item.classList.contains('disabled');

      item.addEventListener('click', () => {
        if (!isGreyedOut) {
          const roleData = this.rolesLoader.getRole(roleId);
          const nightActive = roleData?.nightActive || [];
          const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);

          // Only allow selection if role acts this night
          if (actsThisNight) {
            this.selectedRoleId = roleId;
            console.log(`[MDJ] Selected role ${roleId} for player ${playerId}`);

            // Apply breathing effect
            this.renderLiveMap();
            this.updateMapForRole();
            this.restoreCompletedRoleEffects();

            // Re-render to update selection visual
            this.renderRoleListbox();
          }
        }
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

        const roleData = this.rolesLoader.getRole(roleId);
        const nightActive = roleData?.nightActive || [];
        const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);
        if (!actsThisNight) return false;

        // Also check that at least one player with this role is alive
        const playerWithRole = players.find(p => p.role === roleId && !this.deadPlayerIds.has(p.id));
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

    // Show action section for selected role
    this.renderActionButtons();
  }

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

    if (!this.selectedRoleId) {
      if (titleBig) titleBig.innerHTML = '';
      if (actionControls) actionControls.innerHTML = '';
      if (actionInfo) actionInfo.innerHTML = '';
      return;
    }

    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    const state = this.roleStates[this.selectedRoleId];

    // Check if role acts this night
    const nightActive = roleData.nightActive || [];
    const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);

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
      titleBig.innerHTML = `${roleData.name}${playerName ? ` (${playerName})` : ''}`;
      titleBig.style.background = bgColor;
      titleBig.style.color = textColor;
    }

    // Dispatch to role-specific rendering
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
        // Fallback to generic action buttons
        const actions = this.getActionsForRole(this.selectedRoleId);
        const controlsHtml = actions
          .map(action => `
            <button class="action-btn-mdj" data-action="${action.id}"
                    style="background: ${bgColor}; color: ${textColor}; border: 2px solid ${bgColor};">
              ${action.icon} ${action.label}
            </button>
          `)
          .join('');
        if (actionControls) {
          actionControls.innerHTML = controlsHtml || '<p class="no-actions">Aucune action</p>';
        }
    }
  }

  /**
   * Render Cupidon lover selection interface
   * Shows clickable player names, apply border color on selection
   */
  renderCupidonLoverSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;

    const players = this.gm.state.players || [];
    const selectedLovers = this.selectedPlayers || [];

    // Filter out dead players
    const alivePlayers = this.playerRegistry.getAlive();

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
  }

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

      if (roleId === 'Corbeau' && state.result.targets && state.result.targets.length > 0) {
        // Restore Corbeau's victim bordure
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
      case 'Cupidon':
      case 'Enfant_Sauvage':
      case 'Salvateur':
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
        const leftIdx = (selectedIdx - 1 + players.length) % players.length;
        const rightIdx = (selectedIdx + 1) % players.length;

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
          ? '<div style="color: #ff6b6b; font-size: 0.7rem; font-weight: 700; margin-top: 8px; padding: 6px; background: rgba(255,107,107,0.2); border-radius: 3px;">⚠️ Il perd son pouvoir prochaine nuit</div>'
          : `<div style="color: #4ecdc4; font-size: 0.7rem; font-weight: 700; margin-top: 8px; padding: 6px; background: rgba(78,205,196,0.2); border-radius: 3px;">🐺 ${wolfCount} loup${wolfCount > 1 ? 's' : ''} détecté${wolfCount > 1 ? 's' : ''}</div>`;

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

    // Get victim from wolf pack kill (LAST victim among all wolves this night)
    let victimName = '???';
    let victimId = null;
    let lastWolfKill = null;
    // Check all wolves in order (the order determines who kills last in meute logic)
    for (const roleId of ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc']) {
      if (this.roleStates[roleId]?.result?.targets?.length > 0) {
        // LAST victim is the one to show (in case multiple wolves killed this turn)
        lastWolfKill = {
          roleId,
          victimId: this.roleStates[roleId].result.targets[0]
        };
      }
    }
    if (lastWolfKill) {
      victimId = lastWolfKill.victimId;
      const player = players.find(p => p.id === victimId);
      if (player) victimName = player.name;
    }

    const selectedAction = this.selectedPlayers[0];
    const selectedKillTarget = this.selectedPlayers[1] || null;

    // Ensure victimName is a real name, not an ID
    const displayVictimName = victimId ? this.getPlayerName(victimId) : victimName;

    // Check if victim is protected (immunisé)
    const isVictimProtected = victimId && protectedPlayers.has(victimId);
    const protectionLabel = isVictimProtected ? ' <span style="color: #ff9999; font-weight: bold;">(immunisé)</span>' : '';

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color: white; font-size: 0.8rem; margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; border-left: 3px solid ${bgColor};">
          <strong>💀 Victime des Loups:</strong><br>
          <span style="font-size: 0.9rem; font-weight: bold; color: #ffaaaa;">${displayVictimName}${protectionLabel}</span>
        </div>

        <button class="potion-btn life-potion ${selectedAction === 'potion-life' ? 'selected' : ''}" style="background: ${selectedAction === 'potion-life' ? bgColor + '50' : bgColor + '30'}; border: 2px solid ${bgColor};">
          ${resurrectIcon} Potion Vie - La sauver
        </button>

        <button class="potion-btn do-nothing-btn ${selectedAction === 'do-nothing' ? 'selected' : ''}" style="background: ${selectedAction === 'do-nothing' ? 'rgba(100,100,100,0.5)' : 'rgba(100,100,100,0.3)'}; border: 2px solid #999;">
          ⏭️ Ne rien faire
        </button>

        <div style="color: #aaa; font-size: 0.7rem; margin: 8px 0; text-align: center;">─── ou ───</div>

        <div style="color: white; font-size: 0.75rem; margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          Empoisonner un joueur:
        </div>
        <select class="sorciere-kill-combobox" style="width: 100%; padding: 8px; font-size: 0.85rem; background: rgba(30,30,60,0.9); color: #fff; border: 2px solid #ff6666; border-radius: 4px; font-weight: bold;">
          <option value="">-- Choisir un joueur --</option>
          ${this.playerRegistry.getAlive().filter(p => p.role !== 'Sorciere').map(p => {
            const isProtected = protectedPlayers.has(p.id);
            const protectedLabel = isProtected ? ' (immunisé)' : '';
            const isSelected = selectedAction === 'potion-death' && selectedKillTarget === p.id;
            return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${p.name}${protectedLabel}</option>`;
          }).join('')}
        </select>
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
      });
    }

    if (actionInfo) {
      if (this.selectedPlayers.length > 0) {
        const potionType = this.selectedPlayers[0] === 'potion-life' ? 'Vie' : 'Mort';
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Utiliser ${potionType}</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
      } else {
        actionInfo.innerHTML = 'Sélectionnez une potion';
      }
    }
  }

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

  /**
   * Start the game chronometer (counts up from 00:00)
   */
  startTimer() {
    // Clear existing timer if any
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerRemaining = 0; // Start at 0:00
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerRemaining++; // Count UP instead of down

      this.updateTimerDisplay();
    }, 1000);

    console.log('[MDJ] ⏱️ Chronometer started - 00:00');
  }

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    const timerElement = document.getElementById('gmChrono');
    if (timerElement) {
      const minutes = Math.floor(this.timerRemaining / 60);
      const seconds = this.timerRemaining % 60;
      const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerElement.textContent = displayTime;

      // Chrono color stays consistent
      timerElement.style.color = '#66d999';
    }
  }

  /**
   * Attach all event listeners
   */
  attachEvents() {
    const container = document.querySelector('.mdj-main-container');
    if (!container) return;

    // Role listbox selection (handles BOTH mayor and role selections)
    const roleListbox = document.getElementById('role-listbox');
    if (roleListbox) {
      roleListbox.addEventListener('click', (e) => {
        const item = e.target.closest('.listbox-item');
        if (item) {
          // Mayor selection (ONLY if mayor election is not completed yet)
          if (item.dataset.playerId && !this.mayorElectionCompleted) {
            const playerId = item.dataset.playerId;
            this.selectedMayorId = playerId;
            this.startMayorElection(); // Re-render with updated selection
            return;
          }

          // Role selection (if mayor election is completed)
          if (this.mayorElectionCompleted) {
            const roleId = item.dataset.roleId;
            if (!roleId) return;

            // Prevent selection of grayed-out roles (no action this night)
            if (item.classList.contains('disabled')) {
              console.log(`[MDJ] ❌ Cannot select ${roleId} - no action this night`);
              return;
            }

            this.selectRole(roleId);
          }
        }
      });
    }

    // Action button clicks
    const actionControls = document.getElementById('action-controls');
    if (actionControls) {
      actionControls.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.action-btn-mdj');
        if (actionBtn) {
          const actionId = actionBtn.dataset.action;
          this.handleActionSelect(actionId);
        }
      });
    }

    // Player point clicks
    const mdjLiveMap = document.getElementById('mdj-live-map');
    if (mdjLiveMap) {
      mdjLiveMap.addEventListener('click', (e) => {
        const playerPoint = e.target.closest('.mdj-player-point');
        if (playerPoint) {
          const playerId = playerPoint.dataset.playerId;
          this.handlePlayerClick(playerId);
        }
      });
    }
  }

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

  /**
   * Select a role from the listbox
   * @param {string} roleId
   */
  selectRole(roleId) {
    // CRITICAL: Check if the player with this role is dead
    const players = this.gm.state.players || [];
    const playerWithRole = players.find(p => p.role === roleId);

    if (playerWithRole && this.deadPlayerIds.has(playerWithRole.id)) {
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

    // Corbeau vole automatiquement - pas d'interface de sélection
    if (roleId === 'Corbeau') {
      console.log(`[MDJ] 🐦‍⬛ Corbeau auto-completing (votes stolen automatically)`);
      this.actionState = {
        roleId: 'Corbeau',
        action: 'steal_votes',
        roleName: roleData?.name || 'Corbeau',
        roleEmoji: roleData?.emoji || '🐦‍⬛'
      };
      // Delay slightly to allow UI to render, then auto-complete and show night summary
      setTimeout(() => this.completeRoleAction(), 100);
    } else {
      // Normal roles: render action interface
      this.renderActionButtons();
      this.updateSelectedDisplay();
    }

    // Restore effects from completed roles
    console.log(`[MDJ] Calling restoreCompletedRoleEffects() to restore previous roles' visuals`);
    this.restoreCompletedRoleEffects();

    if (roleData) {
      console.log(`[MDJ] === ROLE SELECTION COMPLETE: ${roleData.emoji} ${roleData.name} ===`);
    } else {
      console.warn(`[MDJ] Warning: Could not load role data for ${roleId}`);
    }
  }

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

    // Check if we have enough selections
    if (targetCount === 0) {
      this.completeRoleAction();
    } else if (this.selectedPlayers.length === targetCount) {
      // Show complete button
      this.showCompleteButton();
    }
  }

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

  /**
   * Complete the current role action
   */
  completeRoleAction() {
    const roleId = this.actionState.roleId || this.selectedRoleId;
    const roleName = this.actionState.roleName;
    const roleEmoji = this.actionState.roleEmoji;
    const action = this.actionState.action;

    console.log(`[MDJ] Completing role action: ${roleId} -> ${action}`);

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

          if (isWolfKill && isProtected) {
            const playerName = this.getPlayerName(playerId);
            console.log(`[MDJ] 🛡️ ${playerName} (${playerId}) is PROTECTED (immunisé) - wolf attack blocked, no death recorded`);
          } else {
            this.deadPlayerIds.add(playerId);
            const playerName = this.getPlayerName(playerId);
            const attackType = action === 'poison' && isProtected ? '☠️💜 (poison ignores protection!)' : '☠️';
            console.log(`${attackType} ${roleName} killed ${playerName} (${playerId})`);

            // Check for cascading Cupidon death
            // If one lover dies, the other should also die (but from love, not from the attack)
            if (this.roleStates['Cupidon']?.completed && this.roleStates['Cupidon']?.result?.targets) {
              const lovers = this.roleStates['Cupidon'].result.targets;
              if (lovers.includes(playerId) && lovers.length === 2) {
                const otherLoverId = lovers.find(id => id !== playerId);
                if (otherLoverId && !this.deadPlayerIds.has(otherLoverId)) {
                  this.deadPlayerIds.add(otherLoverId);
                  const otherLoverName = this.getPlayerName(otherLoverId);
                  this.deathCauses[otherLoverId] = 'love'; // Died from love, not attack
                  console.log(`[MDJ] 💔 Cascading death: ${otherLoverName} (${otherLoverId}) dies with lover ${playerName}`);
                }
              }
            }

            // Record the actual cause of death
            if (!this.deathCauses[playerId]) {
              // Only set if not already set (e.g., love death doesn't override)
              if (action === 'poison') {
                this.deathCauses[playerId] = 'poison';
              } else if (action === 'kill') {
                this.deathCauses[playerId] = 'wolf';
              }
            }

            // Check for Enfant Sauvage idol death - transform to wolf
            if (this.roleStates['Enfant_Sauvage']?.completed && this.roleStates['Enfant_Sauvage']?.result?.targets?.includes(playerId)) {
              const enfantPlayer = players.find(p => p.role === 'Enfant_Sauvage');
              if (enfantPlayer && !this.deadPlayerIds.has(enfantPlayer.id)) {
                console.log(`[MDJ] 🐒➡️🐺 Enfant Sauvage ${enfantPlayer.name}'s idol ${playerName} died! Transform to wolf`);
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
            console.log(`[MDJ] 💚 Sorciere resurrected ${playerName} (${playerId}) - removed from dead list`);
          }
        }
      });
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
      const nightActive = nextRoleData?.nightActive || [];
      const actsThisNight = nightActive.length > 0 && nightActive.includes(this.currentNight);

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

  /**
   * Check if all roles are completed
   * NOTE: Only count roles whose players are ALIVE
   * Dead players don't need to complete their night actions
   * NOTE: No automatic phase change - user must click "Débat et Vote" button
   */
  checkIfNightComplete() {
    const players = this.gm.state.players || [];

    // Only check roles for ALIVE players
    const allCompleted = Object.entries(this.roleStates).every(([roleId, state]) => {
      const playerWithRole = players.find(p => p.role === roleId);
      const isAlive = playerWithRole && !this.deadPlayerIds.has(playerWithRole.id);

      // If player is dead, consider role "completed" (don't wait for them)
      // Otherwise check if actually completed
      return !isAlive || state.completed;
    });

    console.log(`[MDJ] checkIfNightComplete: checking completion status`);
    console.log(`[MDJ]   - Completed roles:`, Object.entries(this.roleStates).filter(([_, s]) => s.completed).map(([id]) => id));
    const pendingRoles = Object.entries(this.roleStates)
      .filter(([roleId, s]) => {
        const playerWithRole = players.find(p => p.role === roleId);
        const isAlive = playerWithRole && !this.deadPlayerIds.has(playerWithRole.id);
        return isAlive && !s.completed;
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

  /**
   * Attach resize handlers for column resizing with proper flex layout support
   */
  attachResizeHandlers() {
    const container = document.querySelector('.mdj-main-container');
    if (!container) return;

    const leftPanel = container.querySelector('.mdj-left-panel');
    const centerPanel = container.querySelector('.mdj-center-panel');
    const rightPanel = container.querySelector('.mdj-right-panel');
    const resizeLeftCenter = document.getElementById('resize-left-center');
    const resizeCenterRight = document.getElementById('resize-center-right');

    if (!resizeLeftCenter || !leftPanel || !centerPanel) return;

    let isResizing = false;
    let startX = 0;
    let startLeftWidth = 0;
    let startCenterWidth = 0;
    let startRightWidth = 0;
    let resizeMode = null;

    // Left-Center resize
    resizeLeftCenter.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizeMode = 'left-center';
      startX = e.clientX;
      startLeftWidth = leftPanel.getBoundingClientRect().width;
      startCenterWidth = centerPanel.getBoundingClientRect().width;
      startRightWidth = rightPanel.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    // Center-Right resize
    resizeCenterRight.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizeMode = 'center-right';
      startX = e.clientX;
      startLeftWidth = leftPanel.getBoundingClientRect().width;
      startCenterWidth = centerPanel.getBoundingClientRect().width;
      startRightWidth = rightPanel.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const delta = e.clientX - startX;

      if (resizeMode === 'left-center') {
        const newLeftWidth = Math.max(200, startLeftWidth + delta);
        const newCenterWidth = Math.max(200, startCenterWidth - delta);

        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
        centerPanel.style.flex = `0 0 ${newCenterWidth}px`;
        rightPanel.style.flex = '1';

      } else if (resizeMode === 'center-right') {
        const newCenterWidth = Math.max(200, startCenterWidth + delta);
        const newRightWidth = Math.max(200, startRightWidth - delta);

        centerPanel.style.flex = `0 0 ${newCenterWidth}px`;
        rightPanel.style.flex = `0 0 ${newRightWidth}px`;
        leftPanel.style.flex = '1';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizeMode = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    });
  }

  /**
   * Log dimensions for layout optimization
   */
  logDimensions() {
    const overlay = document.querySelector('.game-master-overlay');
    const container = document.querySelector('.mdj-main-container');
    const leftPanel = document.querySelector('.mdj-left-panel');
    const centerPanel = document.querySelector('.mdj-center-panel');
    const rightPanel = document.querySelector('.mdj-right-panel');

    if (!overlay || !container) return;

    let lastLog = {};

    const logDimensions = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const leftRect = leftPanel?.getBoundingClientRect();
      const centerRect = centerPanel?.getBoundingClientRect();
      const rightRect = rightPanel?.getBoundingClientRect();

      const current = {
        left: Math.round(leftRect?.width || 0),
        center: Math.round(centerRect?.width || 0),
        right: Math.round(rightRect?.width || 0)
      };

      // Only log if dimensions changed
      if (current.left !== lastLog.left || current.center !== lastLog.center || current.right !== lastLog.right) {
        console.log(`%c[ZONES] L:${current.left}px | C:${current.center}px | R:${current.right}px`,
          'color: #4ECDC4; font-weight: bold;');
        lastLog = current;
      }
    };

    // Log when you press 'L' key (for "Log" - press L during drag to see updates)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') {
        logDimensions();
      }
    });

    // Log on resize
    window.addEventListener('resize', logDimensions);
  }

  /**
   * Ensure CSS styles are loaded
   */
  ensureStyles() {
    const styleId = 'first-night-mdj-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .game-master-overlay {
        width: 1008px;
        height: 619px;
        left: 7px;
        top: 66px;
        cursor: default;
      }

      /* Mobile responsive - unlock fixed width */
      @media (max-width: 1024px) {
        .game-master-overlay {
          width: 95vw;
          height: auto;
          left: 2.5vw;
          top: auto;
          max-height: 90vh;
        }
      }

      @media (max-width: 768px) {
        .game-master-overlay {
          width: 100vw;
          height: auto;
          left: 0;
          top: auto;
          max-height: 95vh;
          border-radius: 0;
        }
      }

      @media (max-width: 480px) {
        .game-master-overlay {
          width: 100vw;
          height: auto;
          max-height: 100vh;
        }
      }

      .mdj-main-container {
        display: flex;
        flex-direction: row;
        height: 100%;
        gap: 0;
        padding: 12px;
        background: linear-gradient(135deg, #1a1f3a 0%, #2d1b4e 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        align-items: stretch;
      }

      .mdj-resize-handle {
        width: 8px;
        background: linear-gradient(90deg, transparent, rgba(100,200,255,0.3), transparent);
        cursor: col-resize;
        user-select: none;
        flex-shrink: 0;
        transition: background 0.2s;
      }

      .mdj-resize-handle:hover {
        background: linear-gradient(90deg, transparent, rgba(100,200,255,0.6), transparent);
      }

      .mdj-left-panel {
        background: linear-gradient(135deg, rgba(40,50,80,0.9), rgba(35,45,70,0.9));
        border: 2px solid rgba(100,200,255,0.2);
        border-radius: 12px;
        padding: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        gap: 4px;
        flex: 0 0 390px;
        min-height: 0;
      }

      .mdj-center-panel {
        background: linear-gradient(135deg, rgba(50,100,200,0.8), rgba(70,120,220,0.8));
        border: 2px solid rgba(100,150,255,0.3);
        border-radius: 12px;
        padding: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        flex: 0 0 250px;
        min-height: 0;
      }

      .mdj-role-list-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        gap: 4px;
      }

      .mdj-right-panel {
        background: linear-gradient(135deg, rgba(180,80,180,0.7), rgba(150,60,150,0.7));
        border: 2px solid rgba(220,100,220,0.3);
        border-radius: 12px;
        padding: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        flex: 0 0 325px;
        min-height: 0;
      }

      .panel-header-compact {
        font-size: 0.8rem;
        font-weight: 700;
        color: #e0e0f0;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        flex-shrink: 0;
      }

      .mdj-live-map {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 100%;
        min-height: 0;
      }

      .mdj-map-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      .mdj-table-visual {
        position: relative;
        width: 90%;
        height: 90%;
        max-width: 420px;
        max-height: 420px;
        aspect-ratio: 1;
        overflow: visible;
        border-radius: 40px;
      }

      .mdj-table-center {
        position: absolute;
        width: 36px;
        height: 36px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(120,85,60,0.3);
        border: 2px solid rgba(140,100,70,0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        opacity: 0.4;
        z-index: 1;
      }

      .mdj-table-rim {
        position: absolute;
        width: 90px;
        height: 90px;
        border: 2px solid rgba(100,150,255,0.15);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .mdj-legend {
        flex: 0 0 65px;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(100,200,255,0.15);
        border-radius: 8px;
        padding: 4px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .legend-title {
        font-size: 0.55rem;
        font-weight: 600;
        color: #e0e0f0;
        margin-bottom: 2px;
        text-align: center;
        flex-shrink: 0;
      }

      .legend-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
        min-height: 0;
      }

      .legend-grid::-webkit-scrollbar {
        width: 3px;
      }

      .legend-grid::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 1px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 2px;
        padding: 1px 2px;
        background: rgba(255,255,255,0.02);
        border-radius: 2px;
        min-height: 0;
      }

      .legend-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 0.5px solid rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 0.45rem;
      }

      .legend-emoji {
        display: none;
      }

      .legend-name {
        font-size: 0.5rem;
        color: #c0c0d0;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }

      .mdj-player-point {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
      }

      .mdj-point-dot {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 50%;
        position: absolute;
        top: -15px;
        left: -15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        color: white;
        font-size: 0.85rem;
        transition: all 0.2s ease;
      }

      .mdj-player-point:hover .mdj-point-dot {
        transform: scale(1.2);
        box-shadow: 0 6px 18px rgba(255,255,255,0.6);
      }

      .mdj-player-point.affected .mdj-point-dot {
        border: 5px solid var(--affected-border, #ffff00);
        box-shadow: 0 0 20px var(--affected-border, #ffff00);
      }

      .mdj-player-point.killed .mdj-point-dot {
        border-width: 4px;
        border-color: #ff4444;
        box-shadow: 0 0 16px rgba(255, 68, 68, 0.8);
      }

      .mdj-player-point.darkened .mdj-point-dot {
        border-width: 4px;
        border-color: #001a4d;
        box-shadow: 0 0 16px rgba(0, 26, 77, 0.8);
      }

      .mdj-player-point.breathing {
        animation: playerBreathingContainer 1.2s ease-in-out infinite !important;
        filter: drop-shadow(0 0 8px rgba(255, 180, 0, 0.8));
        z-index: 10;
      }

      .mdj-player-point.breathing .mdj-point-dot {
        animation: playerBreathing 1.2s ease-in-out infinite !important;
        box-shadow: 0 0 25px rgba(255, 200, 100, 1) !important;
        border: 3px solid rgba(255, 180, 0, 0.9) !important;
      }

      @keyframes playerBreathingContainer {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
      }

      @keyframes playerBreathing {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 15px rgba(255, 180, 0, 0.9) !important;
          filter: brightness(1.1);
        }
        50% {
          transform: scale(1.15);
          box-shadow: 0 0 40px rgba(255, 200, 100, 1) !important;
          filter: brightness(1.4);
        }
      }

      .mdj-point-emoji {
        display: block;
      }

      .mdj-point-name {
        position: absolute;
        font-size: 0.6rem;
        font-weight: 700;
        color: #f0f0f8;
        white-space: nowrap;
        pointer-events: none;
        background: rgba(20,25,45,0.9);
        padding: 2px 3px;
        border-radius: 2px;
        border: 0.5px solid rgba(100,150,255,0.3);
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        display: inline-block;
      }

      .mdj-action-zone {
        background: rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
      }

      .action-title-big {
        font-size: 1rem;
        font-weight: 800;
        color: white;
        padding: 10px;
        border-radius: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.4);
        text-align: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        min-height: 0;
      }

      .action-controls {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: stretch;
        justify-content: flex-start;
        overflow-y: auto;
        padding-right: 4px;
      }

      .action-controls::-webkit-scrollbar {
        width: 6px;
      }

      .action-controls::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
      }

      .action-controls::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.3);
        border-radius: 3px;
      }

      .action-btn-mdj {
        padding: 6px 10px;
        color: white;
        border: 2px solid white;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        white-space: nowrap;
        text-align: center;
        line-height: 1.2;
      }

      .action-btn-mdj:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }

      .action-btn-mdj:active {
        transform: scale(0.98);
      }

      .chien-loup-btn {
        padding: 6px 10px;
        color: white;
        border: 2px solid white;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        white-space: nowrap;
        text-align: center;
        line-height: 1.2;
      }

      .chien-loup-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }

      .chien-loup-btn:active {
        transform: scale(0.98);
      }

      .action-info {
        background: rgba(255,255,255,0.12);
        border-radius: 6px;
        padding: 8px;
        color: #e0e0f0;
        font-size: 0.8rem;
        text-align: center;
        border-left: 2px solid rgba(255,255,255,0.3);
        flex-shrink: 0;
      }

      .btn-validate-action {
        width: 100%;
        padding: 6px 8px;
        background: rgba(76, 175, 80, 0.8);
        color: white;
        border: 2px solid rgba(100, 200, 100, 0.6);
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        line-height: 1.2;
      }

      .btn-validate-action:hover {
        background: rgba(100, 200, 100, 0.9);
        transform: scale(1.05);
      }

      .btn-validate-action:active {
        transform: scale(0.98);
      }

      .no-actions {
        color: rgba(255,255,255,0.6);
        font-style: italic;
        font-size: 0.95rem;
      }


      .role-list-header {
        font-size: 0.75rem;
        font-weight: 700;
        color: #ffffff;
        padding: 5px 6px;
        background: rgba(0,0,0,0.2);
        border-radius: 4px;
        text-align: center;
        flex-shrink: 0;
        border-left: 2px solid rgba(255,255,255,0.5);
      }

      .role-list-blue {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 2px;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
        background: rgba(0,0,0,0.15);
        border-radius: 4px;
      }

      .role-list-blue::-webkit-scrollbar {
        width: 3px;
      }

      .role-list-blue::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.08);
        border-radius: 1px;
      }

      .role-list-blue::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.25);
        border-radius: 1px;
      }

      .role-list-blue::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.4);
      }

      .progress-bar {
        text-align: center;
        color: #e0e0f0;
        font-weight: 700;
        font-size: 0.8rem;
        padding: 8px;
        background: rgba(255,255,255,0.08);
        border-radius: 6px;
        flex-shrink: 0;
      }

      .progress {
        font-size: 0.8rem;
        color: #e0e0f0;
        font-weight: 600;
      }

      .listbox-item {
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        background: rgba(255,255,255,0.12);
        color: white;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        font-weight: 700;
        font-size: 0.7rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        min-height: 24px;
        overflow: visible;
        line-height: 1;
      }

      .listbox-item:hover {
        background: rgba(255,255,255,0.2);
        transform: translateX(3px);
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      }

      .listbox-item.selected {
        border-color: white;
        box-shadow: 0 0 15px rgba(255,255,255,0.6);
        animation: roleListBreathing 2s ease-in-out infinite;
      }

      .listbox-item.breathing {
        animation: playerBreathingContainer 1.2s ease-in-out infinite !important;
        filter: drop-shadow(0 0 8px rgba(255, 180, 0, 0.8));
      }

      .listbox-item.completed {
        opacity: 0.4;
        text-decoration: line-through;
      }

      @keyframes roleListBreathing {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.03);
        }
      }

      .item-icon {
        font-size: 0.85rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
      }

      .item-name {
        flex: 1;
        font-size: 0.65rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-status {
        font-size: 0.7rem;
        margin-left: auto;
        flex-shrink: 0;
      }

      /* Bubble/affected state styles for drag-drop mechanic */
      .bubble-action {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
        border-radius: 50%;
        font-size: 2rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }

      .mdj-player-point.drag-over .mdj-point-dot {
        animation: playerPulse 0.5s ease-in-out;
      }

      @keyframes playerPulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.3);
        }
      }

      /* Selection display for action confirmation */
      .selected-display {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        padding: 12px;
        color: white;
        font-size: 0.9rem;
        margin-top: 8px;
      }

      .selection-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .selection-info p {
        margin: 0;
        font-size: 0.9rem;
      }

      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
      }

      .tag {
        display: inline-block;
        padding: 4px 10px;
        background: rgba(255,255,255,0.2);
        color: white;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 600;
        border: 1px solid rgba(255,255,255,0.3);
      }

      .complete-action-btn {
        width: 100%;
        padding: 10px;
        background: rgba(76,175,80,0.8);
        color: white;
        border: 2px solid rgba(100,200,100,0.6);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        margin-top: 8px;
      }

      .complete-action-btn:hover {
        background: rgba(100,200,100,0.9);
        transform: scale(1.05);
      }

      /* Cupidon Lover Selection */
      .cupidon-player-option {
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s ease;
        background: rgba(255,255,255,0.08);
        flex-shrink: 0;
        min-height: 36px;
      }

      .cupidon-player-option:hover {
        background: rgba(255,255,255,0.15);
        transform: translateX(3px);
      }

      .cupidon-player-option.selected {
        border: 2px solid;
        box-shadow: 0 0 12px rgba(255,215,0,0.4);
      }

      .player-emoji {
        font-size: 1rem;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .player-name {
        flex: 1;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .selection-checkmark {
        font-size: 1.2rem;
        color: #4CAF50;
        flex-shrink: 0;
      }

      /* Generic role action button */
      .role-action-btn {
        padding: 5px 8px;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
        min-height: 24px;
        font-size: 0.7rem;
      }

      .role-action-btn:hover {
        background: rgba(255,255,255,0.15) !important;
        transform: translateX(2px);
      }

      .btn-emoji {
        font-size: 0.85rem;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-name {
        flex: 1;
        font-size: 0.7rem;
        font-weight: 500;
        color: white;
      }

      .voyante-info {
        flex-wrap: wrap;
        gap: 4px;
      }

      .voyante-role {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.7);
        flex-basis: 100%;
        padding-left: 0;
        margin-left: 20px;
      }

      .wolf-indicator {
        font-size: 0.8rem;
        margin-left: auto;
      }

      .kill-btn .btn-emoji {
        filter: grayscale(100%);
      }

      .sorciere-controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .potion-btn {
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.75rem;
        color: white;
        transition: all 0.2s ease;
        line-height: 1.2;
      }

      .potion-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 12px rgba(255,255,255,0.3);
      }

      @media (max-width: 1024px) {
        .mdj-main-container {
          grid-template-columns: 40% 45% 15%;
          padding: 12px;
        }

        .mdj-point-name {
          font-size: 0.7rem;
          left: -35px;
          width: 70px;
        }
      }

      @media (max-width: 768px) {
        .mdj-main-container {
          grid-template-columns: 1fr;
          height: auto;
        }

        .mdj-left-panel,
        .mdj-center-panel,
        .mdj-right-panel {
          min-height: 250px;
        }

        .action-title-big {
          font-size: 1.1rem;
        }

        .panel-header-compact {
          font-size: 0.85rem;
        }

        .player-visual {
          width: 50px;
          height: 50px;
        }
      }

      /* Tablet: 768px - 1024px */
      @media (max-width: 1024px) {
        .game-master-overlay {
          width: 90vw;
          height: auto;
          left: auto;
          top: auto;
        }

        .mdj-main-container {
          padding: 8px;
        }

        .mdj-center-panel {
          width: 200px;
        }

        .mdj-table-visual {
          max-width: 300px;
          max-height: 300px;
        }
      }

      /* Mobile: < 768px */
      @media (max-width: 768px) {
        .game-master-overlay {
          width: 95vw;
          height: auto;
          max-width: 100%;
          left: 2.5vw;
          top: 10px;
          border-radius: 8px;
        }

        .mdj-main-container {
          flex-direction: column;
          padding: 6px;
          gap: 4px;
        }

        .mdj-resize-handle {
          width: 100%;
          height: 6px;
          cursor: row-resize;
        }

        .mdj-left-panel,
        .mdj-center-panel,
        .mdj-right-panel {
          flex: 0 0 auto;
          min-width: auto;
          min-height: 180px;
        }

        .mdj-center-panel {
          width: 100%;
        }

        .mdj-table-visual {
          max-width: 200px;
          max-height: 200px;
        }

        .mdj-live-map {
          flex: 0 0 auto;
          min-height: 180px;
        }

        .mdj-legend {
          flex: 0 0 50px;
        }

        .legend-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .listbox-item {
          padding: 4px 6px;
          font-size: 0.65rem;
          min-height: 20px;
        }

        .role-action-btn {
          padding: 4px 6px;
          font-size: 0.65rem;
          min-height: 20px;
        }

        .panel-header-compact {
          font-size: 0.7rem;
          margin-bottom: 2px;
        }

        .action-title-big {
          font-size: 0.9rem;
        }

        /* Hide resize handles on mobile */
        .mdj-resize-handle {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose to window for use in game-master-ui.js
window.FirstNightMDJ = FirstNightMDJ;