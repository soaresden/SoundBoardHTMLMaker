/**
 * 03-FirstNight-MDJ.js
 *
 * Mode Maître du Jeu Animé (MDJ) - First Night
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

    // Timer state
    this.timerDuration = 5 * 60; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.timerInterval = null;

    // Initialize role states
    this.initializeRoleStates();
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

      // Check if role has night actions
      const hasNightAction =
        roleData.actionType === 'NightActive' ||
        (this.getActionsForRole(roleId) && this.getActionsForRole(roleId).length > 0) ||
        roleId.includes('Loup') ||
        roleId.includes('Wolf');

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
            <div class="action-title-big" id="action-title-big">
              <div id="mdj-night-timer" class="mdj-night-timer">5:00</div>
            </div>
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
    this.startTimer();
  }

  /**
   * Render the live map avec emoji et couleurs du JSON
   * IMPORTANT: Table scaled to fit entirely in left panel
   */
  renderLiveMap() {
    const mapContainer = document.getElementById('mdj-live-map');
    if (!mapContainer) return;

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
      const isCurrentRole = this.selectedRoleId && p.role === this.selectedRoleId;

      return `
        <div class="mdj-player-point ${isCurrentRole ? 'breathing' : ''}" data-player-id="${p.id}" data-player-name="${p.name}"
             style="left: ${x}px; top: ${y}px; position: absolute;">
          <div class="mdj-point-dot" style="background: ${bgColor}; --affected-border: ${affectedBorderColor};">
            <span class="mdj-point-emoji" style="color: ${emojiColor};">${emoji}</span>
            <span class="mdj-point-name" style="top: ${nameTop}; left: ${nameLeft}; text-align: ${p.textAlign};">${p.name}</span>
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

      return `
        <div class="legend-item">
          <div class="legend-dot" style="background: ${bgColor};">
            <span class="legend-emoji" style="color: ${emojiColor};">${emoji}</span>
          </div>
          <span class="legend-name">${p.name}</span>
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
  renderRoleListbox() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;

    // Get ASSIGNED roles from players in THIS game
    const players = this.gm.state.players || [];
    const assignedRoleIds = new Set(players.map(p => p.role));

    // Get all ordered roles and filter to assigned night-active roles
    const allOrderedRoles = this.rolesLoader.getOrderedRoleIds();

    // Filter to only roles ASSIGNED TO PLAYERS + that have night actions
    const nightRoles = allOrderedRoles.filter(roleId => {
      // Only show roles actually assigned to players in this game
      if (!assignedRoleIds.has(roleId)) return false;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return false;

      // Include if explicitly marked as NightActive
      if (roleData.actionType === 'NightActive') return true;

      // Or if there are actions for this role
      const actions = this.getActionsForRole(roleId);
      if (actions && actions.length > 0) return true;

      // Or if it's a wolf-related role (they act at night)
      if (roleId.includes('Loup') || roleId.includes('Wolf')) return true;

      return false;
    });

    // CRITICAL: Re-sort by file number extracted from filename (01-Cupidon.json → 01)
    // Dynamically extract order from all roles data
    const getFileNumber = (roleId) => {
      // Get all roles and find the one matching this roleId
      const allRoles = window.ROLES_DATA?.roles || {};
      const roleData = allRoles[roleId];
      if (!roleData?._fileNumber) {
        // If not cached, try to find it from ordered list
        const orderedRoles = this.rolesLoader.getOrderedRoleIds();
        return orderedRoles.indexOf(roleId) + 1 || 999;
      }
      return roleData._fileNumber;
    };

    nightRoles.sort((a, b) => {
      const aNum = getFileNumber(a);
      const bNum = getFileNumber(b);
      return aNum - bNum;
    });


    // Auto-select first incomplete role if none selected
    if (!this.selectedRoleId && nightRoles.length > 0) {
      const firstRole = nightRoles.find(roleId => {
        return !this.roleStates[roleId]?.completed;
      });
      if (firstRole) {
        this.selectedRoleId = firstRole;
        console.log('[FirstNightMDJ] Auto-selected first role:', firstRole);
      }
    }

    const html = nightRoles
      .map((roleId, index) => {
        const roleData = this.rolesLoader.getRole(roleId);
        if (!roleData) return '';

        const state = this.roleStates[roleId] || { completed: false };
        const isSelected = this.selectedRoleId === roleId;
        const isCompleted = state.completed;

        // Get colors from JSON
        const roleColor = roleData.visual?.roleColor?.fondColor || 'inherit';
        const textColor = roleData.visual?.roleColor?.textColor || '#ffffff';

        const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';

        return `
          <div class="listbox-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}"
               data-role-id="${roleId}"
               data-role-index="${index}"
               style="background: ${isSelected ? roleColor : 'rgba(255,255,255,0.1)'};
                      color: ${isSelected ? textColor : 'white'};">
            <span class="item-icon" style="color: ${emojiColor};">${roleData.emoji}</span>
            <span class="item-name">${roleData.name}</span>
            ${isCompleted ? '<span class="item-status">✓</span>' : ''}
          </div>
        `;
      })
      .join('');

    listbox.innerHTML = html || '<div style="color: white; padding: 10px; text-align: center; font-size: 0.75rem;">Aucun rôle</div>';

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
      case 'Sorcière':
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

    // Create clickable player list
    const playerListHtml = players
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
    // Don't restore state on role change - keep previous effects visible
    if (!this.selectedRoleId || this.selectedPlayers.length === 0) {
      return;
    }

    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    // Clear all affected states first
    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      point.classList.remove('affected', 'killed', 'darkened');
      const dot = point.querySelector('.mdj-point-dot');
      if (dot) {
        dot.style.setProperty('--affected-border', 'transparent');
      }
    });

    // Apply role-specific visual effects
    const players = this.gm.state.players || [];

    switch(this.selectedRoleId) {
      case 'Cupidon':
      case 'Enfant_Sauvage':
      case 'Salvateur':
        // Border color effect
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            point.classList.add('affected');
            const player = players.find(p => p.id === playerId);
            if (player) {
              const roleData = this.rolesLoader.getRole(player.role);
              const borderColor = roleData?.visual?.affectedColor?.borderColor || 'inherit';
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', borderColor);
              }
            }
          }
        });
        break;

      case 'Simple_Loup_Garou':
      case 'Grand_Mechant_Loup':
      case 'Loup_Garou_Blanc':
        // Kill effect: gray + skull
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            point.classList.add('killed');
            const emoji = point.querySelector('.mdj-point-emoji');
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
        // Dark navy background from JSON affectedColor
        const corbeauRole = this.rolesLoader.getRole('Corbeau');
        const corbeauColor = corbeauRole?.visual?.affectedColor?.fondColor || 'inherit';
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            point.classList.add('darkened');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.background = corbeauColor;
            }
          }
        });
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

    // Clear all affected states first
    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      point.classList.remove('affected');
      const dot = point.querySelector('.mdj-point-dot');
      if (dot) {
        dot.style.setProperty('--affected-border', 'transparent');
      }
    });

    // Get Cupidon's affectedColor for border
    const cupidonRole = this.rolesLoader.getRole('Cupidon');
    const cupidonBorderColor = cupidonRole?.visual?.affectedColor?.borderColor || '#ffff00';

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
  }

  /**
   * Render Enfant Sauvage idol selection
   * Select 1 player as idol, apply border color from JSON
   */
  renderEnfantSauvageSelection(actionControls, actionInfo, bgColor, textColor, state) {
    if (!actionControls) return;
    const players = this.gm.state.players || [];
    const selectedIdol = this.selectedPlayers[0] || null;

    const playerListHtml = players
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
    const players = this.gm.state.players || [];
    const selectedPlayer = this.selectedPlayers[0] || null;

    const playerListHtml = players
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
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
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
    const players = this.gm.state.players || [];
    const selectedPlayer = this.selectedPlayers[0] || null;

    const playerListHtml = players
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedPlayer === playerId;
        const roleData = this.rolesLoader.getRole(player.role);
        const protectColor = roleData?.visual?.affectedColor?.borderColor || '#00FF00';

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

    const playerListHtml = players
      .map((player, idx) => {
        const playerId = player.id;
        const isSelected = selectedPlayer === playerId;
        const roleData = this.rolesLoader.getRole(player.role);
        const isWolf = player.role.includes('Loup') || player.role.includes('Wolf');

        return `
          <div class="role-action-btn ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? bgColor : 'transparent'};">
            <span class="btn-emoji">${roleData?.emoji || '❓'}</span>
            <span class="btn-name">${player.name}</span>
            ${isWolf ? '<span class="wolf-indicator">🐺</span>' : ''}
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
          const roleData = this.rolesLoader.getRole('Renard');
          this.actionState = {
            roleId: 'Renard',
            action: 'sniff',
            roleName: roleData?.name || 'Renard',
            roleEmoji: roleData?.emoji || '🦊'
          };
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
      });
    });

    if (actionInfo) {
      if (selectedPlayer) {
        const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
        if (selectedPlayerObj) {
          const selectedIdx = players.indexOf(selectedPlayerObj);
          const left = (selectedIdx - 1 + players.length) % players.length;
          const right = (selectedIdx + 1) % players.length;
          const leftRole = this.rolesLoader.getRole(players[left].role);
          const rightRole = this.rolesLoader.getRole(players[right].role);

          actionInfo.innerHTML = `
            <div style="font-size: 0.7rem;">
              👈 ${players[left].name}: ${leftRole?.emoji || '?'}<br>
              ➡️ ${players[right].name}: ${rightRole?.emoji || '?'}<br>
              <button class="btn-validate-action">✓ Confirmer</button>
            </div>
          `;
          actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
            () => this.completeRoleAction());
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

    // For Loup_Garou_Blanc: show ONLY wolves
    // For other wolves: show only non-wolves (normal kill)
    let validTargets;
    if (this.selectedRoleId === 'Loup_Garou_Blanc') {
      // Blanc can only kill other wolves
      validTargets = players.filter(p => (p.role.includes('Loup') || p.role.includes('Wolf')) && p.role !== 'Loup_Garou_Blanc');
    } else {
      // Normal wolves kill non-wolves
      validTargets = players.filter(p => !p.role.includes('Loup') && !p.role.includes('Wolf'));
    }

    const playerListHtml = validTargets
      .map((player) => {
        const playerId = player.id;
        const isSelected = selectedVictim === playerId;
        const roleData = this.rolesLoader.getRole(player.role);

        return `
          <div class="role-action-btn kill-btn ${isSelected ? 'selected' : ''}"
               data-player-id="${playerId}"
               style="background: ${isSelected ? bgColor + '30' : 'rgba(255,255,255,0.08)'};
                      border: 2px solid ${isSelected ? bgColor : 'transparent'};">
            <span class="btn-emoji" style="opacity: ${isSelected ? 0.5 : 1};">${roleData?.emoji || '❓'}</span>
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
          const roleData = this.rolesLoader.getRole(this.selectedRoleId);
          this.actionState = {
            roleId: this.selectedRoleId,
            action: 'kill',
            roleName: roleData?.name || 'Loup',
            roleEmoji: roleData?.emoji || '🐺'
          };
        } else {
          this.actionState = {};
        }

        this.renderActionButtons();
        this.updateMapForRole();
      });
    });

    if (actionInfo) {
      if (selectedVictim) {
        actionInfo.innerHTML = `<button class="btn-validate-action">☠️ Tuer</button>`;
        actionInfo.querySelector('.btn-validate-action')?.addEventListener('click',
          () => this.completeRoleAction());
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
    const sorciereRole = this.rolesLoader.getRole('Sorcière');
    const actions = sorciereRole?.actions?.mdj_night_actions || [];
    const resurrectIcon = actions.find(a => a.id === 'resurrect')?.icon || '💚';
    const poisonIcon = actions.find(a => a.id === 'poison')?.icon || '💜';

    // Get victim from wolf kill (if already selected)
    let victimName = '???';
    let victimId = null;
    for (const roleId of ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc']) {
      if (this.roleStates[roleId]?.result?.targets?.length > 0) {
        victimName = this.roleStates[roleId].result.targets[0];
        // Find player ID from name
        const player = players.find(p => p.name === victimName);
        if (player) victimId = player.id;
        break;
      }
    }

    const selectedAction = this.selectedPlayers[0];
    const selectedKillTarget = this.selectedPlayers[1] || null;

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color: white; font-size: 0.8rem; margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; border-left: 3px solid ${bgColor};">
          <strong>💀 Victime des Loups:</strong><br>
          <span style="font-size: 0.9rem; font-weight: bold; color: #ffaaaa;">${victimName}</span>
        </div>

        <button class="potion-btn life-potion ${selectedAction === 'potion-life' ? 'selected' : ''}" style="background: ${selectedAction === 'potion-life' ? bgColor + '50' : bgColor + '30'}; border: 2px solid ${bgColor};">
          ${resurrectIcon} Potion Vie - La sauver
        </button>

        <div style="color: #aaa; font-size: 0.7rem; margin: 8px 0; text-align: center;">─── ou ───</div>

        <div style="color: white; font-size: 0.75rem; margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          Tuer un autre joueur:
        </div>
        <div class="sorciere-kill-list" style="display: flex; flex-direction: column; gap: 3px; max-height: 150px; overflow-y: auto;">
          ${players.map(p => `
            <button class="sorciere-kill-btn ${selectedAction === 'potion-death' && selectedKillTarget === p.id ? 'selected' : ''}"
                    data-player-id="${p.id}"
                    style="padding: 4px 8px; font-size: 0.7rem; background: ${selectedAction === 'potion-death' && selectedKillTarget === p.id ? bgColor + '50' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${selectedAction === 'potion-death' && selectedKillTarget === p.id ? bgColor : 'rgba(255,255,255,0.2)'}; border-radius: 3px; color: white; cursor: pointer; text-align: left;">
              ${p.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Life potion button - save the victim
    actionControls.querySelector('.life-potion')?.addEventListener('click', () => {
      this.selectedPlayers = ['potion-life'];

      // Setup actionState for validation
      this.actionState = {
        roleId: 'Sorcière',
        action: 'resurrect',
        roleName: sorciereRole?.name || 'Sorcière',
        roleEmoji: sorciereRole?.emoji || '🧙‍♀️'
      };

      this.renderActionButtons();

      // Restore victim's original emoji on map
      if (victimId) {
        const mdjMap = document.getElementById('mdj-live-map');
        if (mdjMap) {
          const victimPoint = mdjMap.querySelector(`[data-player-id="${victimId}"]`);
          if (victimPoint) {
            const victimPlayer = players.find(p => p.id === victimId);
            if (victimPlayer) {
              const victimRole = this.rolesLoader.getRole(victimPlayer.role);
              const emoji = victimPoint.querySelector('.mdj-point-emoji');
              if (emoji) {
                emoji.textContent = victimRole?.emoji || '❓';
                emoji.style.color = victimRole?.visual?.roleColor?.emojiColor || 'inherit';
                emoji.style.opacity = '1';
              }
            }
          }
        }
      }
    });

    // Kill buttons - select who to kill
    actionControls.querySelectorAll('.sorciere-kill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        this.selectedPlayers = ['potion-death', playerId];

        // Setup actionState for validation
        this.actionState = {
          roleId: 'Sorcière',
          action: 'poison',
          roleName: sorciereRole?.name || 'Sorcière',
          roleEmoji: sorciereRole?.emoji || '🧙‍♀️'
        };

        this.renderActionButtons();
      });
    });

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
    const players = this.gm.state.players || [];
    const selectedPlayer = this.selectedPlayers[0] || null;
    const corbeauRole = this.rolesLoader.getRole('Corbeau');
    const corbeauBorderColor = corbeauRole?.visual?.affectedColor?.borderColor || bgColor;

    const playerListHtml = players
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
        actionInfo.innerHTML = `<button class="btn-validate-action">✓ Assombrir</button>`;
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
  completeRoleAction() {
    // Check both actionState and selectedRoleId for validation
    if (!this.actionState.roleId && !this.selectedRoleId) {
      console.warn('[MDJ] completeRoleAction() called without valid role context');
      return;
    }

    if (this.selectedPlayers.length === 0) {
      console.warn('[MDJ] completeRoleAction() called without player selections');
      return;
    }

    const players = this.gm.state.players || [];
    const roleData = this.rolesLoader.getRole(this.selectedRoleId);

    // Convert selectedPlayers (player IDs) to names
    const targetNames = this.selectedPlayers
      .map(key => {
        // Handle player IDs like "player_0", "player_1"
        if (key.startsWith('player_')) {
          const player = players.find(p => p.id === key);
          return player?.name || '?';
        }
        // Handle special selections like "potion-life", "potion-death"
        return key;
      })
      .join(', ');

    // Log action
    if (this.logger && typeof this.logger.logAction === 'function') {
      const roleEmoji = roleData?.emoji || '❓';
      this.logger.logAction(
        `${roleEmoji} ${roleData?.name}`,
        `a agi sur: ${targetNames}`,
        this.selectedPlayers
      );
    }

    // Mark role as completed
    if (this.roleStates[this.selectedRoleId]) {
      this.roleStates[this.selectedRoleId].completed = true;
      this.roleStates[this.selectedRoleId].result = {
        targets: [...this.selectedPlayers]
      };
    }

    // Clear selections & role state, but KEEP map effects visible
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedRoleId = null;

    // Re-render (effects on map persist for visual feedback)
    this.renderRoleListbox();
    this.renderActionButtons();

    console.log('[MDJ] Role action completed for:', roleData?.name, 'targets:', targetNames);
  }

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
        targets: [lover1Name, lover2Name]
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
   * Start the night timer countdown
   */
  startTimer() {
    // Clear existing timer if any
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerRemaining = this.timerDuration;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerRemaining--;

      if (this.timerRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        console.log('[MDJ] ⏱️ Timer finished!');
      }

      this.updateTimerDisplay();
    }, 1000);

    console.log('[MDJ] ⏱️ Timer started - 5 minutes');
  }

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    const timerElement = document.getElementById('mdj-night-timer');
    if (timerElement) {
      const minutes = Math.floor(this.timerRemaining / 60);
      const seconds = this.timerRemaining % 60;
      const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerElement.textContent = displayTime;

      // Change color as time runs out
      if (this.timerRemaining <= 30) {
        timerElement.style.color = '#ff4444'; // Red for last 30 seconds
      } else if (this.timerRemaining <= 60) {
        timerElement.style.color = '#ffaa44'; // Orange for last minute
      } else {
        timerElement.style.color = '#44ff44'; // Green
      }
    }
  }

  /**
   * Attach all event listeners
   */
  attachEvents() {
    const container = document.querySelector('.mdj-main-container');
    if (!container) return;

    // Role listbox selection
    const roleListbox = document.getElementById('role-listbox');
    if (roleListbox) {
      roleListbox.addEventListener('click', (e) => {
        const roleItem = e.target.closest('.listbox-item');
        if (roleItem) {
          const roleId = roleItem.dataset.roleId;
          this.selectRole(roleId);
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
    const state = this.roleStates[roleId];
    if (state.completed) {
      // Allow reviewing but not re-editing
      console.log(`[MDJ] ${roleId} already completed`);
    }

    this.selectedRoleId = roleId;
    this.selectedPlayers = [];

    // Re-render listbox and action buttons
    this.renderRoleListbox();
    this.renderActionButtons();
    this.updateSelectedDisplay();

    const roleData = this.rolesLoader.getRole(roleId);
    console.log(`[MDJ] Selected role: ${roleData.emoji} ${roleData.name}`);
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
      'Sorcière-resurrect': 1,
      'Sorcière-poison': 1,
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
  handlePlayerClick(playerName, playerIndex, playerCard) {
    if (!this.actionState.action) {
      console.warn('[MDJ] No action selected');
      return;
    }

    const targetCount = this.actionState.targetCount;

    // Toggle player selection
    const isSelected = this.selectedPlayers.includes(playerName);

    if (isSelected) {
      this.selectedPlayers = this.selectedPlayers.filter(p => p !== playerName);
      playerCard.classList.remove('selected');
    } else {
      if (targetCount > 0 && this.selectedPlayers.length >= targetCount) {
        console.warn(`[MDJ] Cannot select more than ${targetCount} player(s)`);
        return;
      }
      this.selectedPlayers.push(playerName);
      playerCard.classList.add('selected');
    }

    this.updateSelectedDisplay();

    // Check if we have enough selections
    if (targetCount === 0) {
      this.completeRoleAction();
    } else if (this.selectedPlayers.length === targetCount) {
      // Auto-complete when enough selected
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

    // Clear selections
    this.selectedPlayers = [];
    this.actionState = {};
    this.selectedRoleId = null;

    // Clear UI selections
    document.querySelectorAll('.player-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    // Update progress
    this.updateProgressCount();

    // Re-render to move to next role
    this.renderRoleListbox();
    this.renderActionButtons();

    console.log(`[MDJ] Role ${roleId} completed. Moving to next role...`);

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
   */
  checkIfNightComplete() {
    const allCompleted = Object.values(this.roleStates).every(
      state => state.completed
    );

    if (allCompleted) {
      console.log('[MDJ] ✓ First night complete!');

      // Log morning phase if function exists
      if (this.logger && typeof this.logger.logMorning === 'function') {
        this.logger.logMorning(1);
      }

      // Transition to next phase (day or morning summary)
      setTimeout(() => {
        this.gm.changePhase('day');
      }, 2000);
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
        border: 2px solid white;
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
        border-color: var(--affected-border, #ffff00);
        border-width: 5px;
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

      .mdj-player-point.breathing .mdj-point-dot {
        animation: playerBreathing 1.5s ease-in-out infinite;
        box-shadow: 0 0 15px rgba(255, 200, 100, 0.8) !important;
      }

      @keyframes playerBreathing {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 8px rgba(255, 200, 100, 0.6) !important;
        }
        50% {
          transform: scale(1.2);
          box-shadow: 0 0 24px rgba(255, 200, 100, 1) !important;
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

      .mdj-night-timer {
        font-size: 1.4rem;
        font-weight: 800;
        letter-spacing: 2px;
        color: #44ff44;
        text-shadow: 0 0 8px rgba(68, 255, 68, 0.4);
        padding: 8px 12px;
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(68,255,68,0.3);
        text-align: center;
        transition: all 0.3s ease;
        font-family: 'Courier New', monospace;
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