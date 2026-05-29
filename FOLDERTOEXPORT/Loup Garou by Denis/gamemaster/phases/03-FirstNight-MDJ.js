/**
 * 03-FirstNight-MDJ.js
 *
 * Mode Maître du Jeu Animé (MDJ) - First Night
 *
 * VERSION: 26
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
    console.log('VERSION 26');
    console.log('v26: PlayerRegistry | Independent wolf breathing | Dead player filtering | Green resurrection border | Night summary persistence');

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

    // Initialize PlayerRegistry for centralized player data management
    this.playerRegistry = new PlayerRegistry(this.gm?.state?.players || [], this.deadPlayerIds);

    // Timer state
    this.timerDuration = 5 * 60; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.timerInterval = null;

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
      // EACH ROLE BREATHES INDEPENDENTLY - no pack breathing!
      const isCurrentRole = p.role === this.selectedRoleId;

      if (isCurrentRole) {
        console.log(`[MDJ] 🫁 Breathing for: ${p.name} (${p.role}) - selectedRoleId: ${this.selectedRoleId}`);
      }

      const isDead = this.deadPlayerIds.has(p.id);
      const deadStyle = isDead ? 'filter: grayscale(100%) brightness(0.5); opacity: 0.6;' : '';

      return `
        <div class="mdj-player-point ${isCurrentRole ? 'breathing' : ''}" data-player-id="${p.id}" data-player-name="${p.name}" data-original-emoji="${emoji}"
             style="left: ${x}px; top: ${y}px; position: absolute; ${deadStyle}">
          <div class="mdj-point-dot" style="background: ${bgColor}; --affected-border: ${affectedBorderColor};">
            <span class="mdj-point-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
            <span class="mdj-point-name" style="top: ${nameTop}; left: ${nameLeft}; text-align: ${p.textAlign};">${isDead ? '💀' : ''} ${p.name}</span>
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
  /**
   * Render Night Summary - Shows completed actions and deaths
   * Replaces the role listbox once all roles are done
   */
  renderNightSummary() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;

    const players = this.gm.state.players || [];
    const actions = [];
    const deaths = [];

    // Collect all completed actions
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
          actions.push(`${emoji} ${roleName} a touché ${targets}`);
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

    // Collect all deaths
    const deadPlayers = players.filter(p => this.deadPlayerIds.has(p.id));
    deadPlayers.forEach(p => {
      const roleData = this.rolesLoader.getRole(p.role);
      const emoji = roleData?.emoji || '❓';

      let cause = 'Cause inconnue';
      if (this.roleStates['Grand_Mechant_Loup']?.result?.targets?.includes(p.id)) {
        cause = 'Dévoré par le Grand Méchant Loup';
      } else if (this.roleStates['Sorciere']?.result?.targets?.includes(p.id)) {
        cause = 'Tué par la potion de la Sorcière';
      } else {
        cause = 'Dévoré par les Loups';
      }

      deaths.push({
        name: p.name,
        emoji: emoji,
        cause: cause
      });
    });

    const actionsHtml = actions.length > 0
      ? actions.map(action => `<div style="padding:8px; background:rgba(100,150,200,0.2); border-left:3px solid #81dff7; margin-bottom:6px; font-size:11px; border-radius:2px;">${action}</div>`).join('')
      : '<div style="padding:12px; text-align:center; color:#aaa; font-size:11px;">Aucune action spéciale</div>';

    const deathsHtml = deaths.length > 0
      ? deaths.map(d => `
          <div style="padding:8px; background:rgba(212,102,102,0.2); border-left:3px solid #ff9999; margin-bottom:6px; font-size:11px; border-radius:2px;">
            <strong>${d.emoji} ${d.name}</strong><br>
            <span style="color:#ff9999; font-size:10px;">${d.cause}</span>
          </div>
        `).join('')
      : '<div style="padding:12px; text-align:center; color:#aaa; font-size:11px;">Aucune mort cette nuit</div>';

    const html = `
      <div style="display:flex; flex-direction:column; height:100%; background:rgba(0,0,0,0.3); border-radius:6px; overflow:hidden;">
        <div style="flex:1; overflow-y:auto; padding:12px;">
          <div style="margin-bottom:12px;">
            <h3 style="margin:0 0 8px 0; color:#81dff7; font-size:12px; font-weight:600; border-bottom:2px solid #81dff7; padding-bottom:6px;">
              📋 Actions de la Nuit
            </h3>
            ${actionsHtml}
          </div>

          <div>
            <h3 style="margin:0 0 8px 0; color:#ff9999; font-size:12px; font-weight:600; border-bottom:2px solid #ff9999; padding-bottom:6px;">
              ☠️ Décès
            </h3>
            ${deathsHtml}
          </div>
        </div>

        <div style="padding:12px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.5);">
          <button id="night-summary-btn-next" class="btn-night-complete"
                  style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600; font-size:12px;">
            ✓ Débat et Vote
          </button>
        </div>
      </div>
    `;

    listbox.innerHTML = html;

    // Attach click handler to proceed to next phase
    const nextBtn = listbox.querySelector('#night-summary-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('[MDJ] Moving to Day phase from night summary');
        this.gm.changePhase('day');
      });
    }
  }

  renderRoleListbox() {
    const listbox = document.getElementById('role-listbox');
    if (!listbox) return;

    // Check if all roles are completed - if so, show summary instead
    const completedRoleIds = Object.keys(this.roleStates);
    const allCompleted = completedRoleIds.length > 0 && completedRoleIds.every(roleId => this.roleStates[roleId].completed);

    if (allCompleted) {
      return this.renderNightSummary();
    }

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

    // CRITICAL: Re-sort by file number extracted from filename
    // Supports format: "98-Name.json", "98a-Name.json", "98b-Name.json", etc.
    const parseFileNumber = (roleId) => {
      const allRoles = window.ROLES_DATA?.roles || {};
      const roleData = allRoles[roleId];

      // Try to get filename from roleData (fallback to roleId)
      let filename = roleData?._filename || roleId;

      // Extract number and optional letter: "98" or "98a" or "98b"
      const match = filename.match(/^(\d+)([a-z])?/i);
      if (!match) {
        return { num: 999, letter: '' };
      }

      return {
        num: parseInt(match[1]),
        letter: match[2] ? match[2].toLowerCase() : ''
      };
    };

    nightRoles.sort((a, b) => {
      const aFile = parseFileNumber(a);
      const bFile = parseFileNumber(b);

      // Compare numbers first
      if (aFile.num !== bFile.num) {
        return aFile.num - bFile.num;
      }

      // If numbers are equal, compare letters (empty letter comes first)
      if (aFile.letter === '' && bFile.letter !== '') return -1;
      if (aFile.letter !== '' && bFile.letter === '') return 1;
      return aFile.letter.localeCompare(bFile.letter);
    });


    // Auto-select first incomplete role if none selected
    if (!this.selectedRoleId && nightRoles.length > 0) {
      const firstRole = nightRoles.find(roleId => {
        return !this.roleStates[roleId]?.completed;
      });
      if (firstRole) {
        this.selectedRoleId = firstRole;
        console.log('[FirstNightMDJ] Auto-selected first role:', firstRole);
        // Apply breathing effect ONCE when auto-selecting
        this.renderLiveMap();
        this.updateMapForRole();
        // CRITICAL: Restore effects from previously completed roles to make borders persistent
        this.restoreCompletedRoleEffects();
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

      // Handle Renard's inspection (3 neighbors)
      if (roleId === 'Renard' && state.result.targets && state.result.targets.length > 0) {
        // The center player is stored in targets[0] as player ID
        const centerPlayerId = state.result.targets[0];
        const centerPlayer = players.find(p => p.id === centerPlayerId);
        console.log('[MDJ] Renard restore - centerPlayerId:', centerPlayerId, 'centerPlayer:', centerPlayer?.name || 'NOT FOUND');

        if (centerPlayer) {
          const renardRole = this.rolesLoader.getRole('Renard');
          const borderColor = renardRole?.visual?.affectedColor?.borderColor;
          console.log(`[MDJ] Renard - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}`);

          const centerIdx = players.indexOf(centerPlayer);
          const leftIdx = (centerIdx - 1 + players.length) % players.length;
          const rightIdx = (centerIdx + 1) % players.length;

          const neighborIds = [
            centerPlayer.id,
            players[leftIdx].id,
            players[rightIdx].id
          ];

          console.log('[MDJ] Renard restore - applying to 3 neighbors:', neighborIds, 'borderColor:', borderColor);

          neighborIds.forEach(neighborId => {
            const point = mdjMap.querySelector(`[data-player-id="${neighborId}"]`);
            console.log('[MDJ] Renard restore - querySelector for', neighborId, ':', point ? '✓ FOUND' : '✗ NOT FOUND');

            if (point && borderColor) {
              point.classList.add('affected');
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', borderColor);
                console.log('[MDJ] Renard restore - applied border to', neighborId);
              }
            }
          });
        }
      }

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

      if (roleId === 'Renard' && state.result.targets && state.result.targets.length > 0) {
        // Add Renard's 3 neighbors to protected list
        // targets are stored as IDs, not names!
        const centerPlayerId = state.result.targets[0];
        const centerPlayer = players.find(p => p.id === centerPlayerId);
        if (centerPlayer) {
          const centerIdx = players.indexOf(centerPlayer);
          const leftIdx = (centerIdx - 1 + players.length) % players.length;
          const rightIdx = (centerIdx + 1) % players.length;

          playersWithCompletedEffects.add(centerPlayer.id);
          playersWithCompletedEffects.add(players[leftIdx].id);
          playersWithCompletedEffects.add(players[rightIdx].id);
        }
      }
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

        // Restore borders for non-selected players
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          if (!this.selectedPlayers.includes(playerId)) {
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', 'transparent');
            }
          }
        });

        // Apply border to selected players
        this.selectedPlayers.forEach(playerId => {
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

            // Clear all first
            mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
              const dot = point.querySelector('.mdj-point-dot');
              if (dot && !point.classList.contains('killed')) {
                dot.style.setProperty('--affected-border', 'transparent');
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

        // Restore borders for non-selected players
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          if (!this.selectedPlayers.includes(playerId)) {
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

    // Filter out dead players
    const alivePlayers = this.playerRegistry.getAlive();

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

    // Filter out dead players
    const alivePlayers = this.playerRegistry.getAlive();

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
        const isLeftWolf = leftPlayer.role.includes('Loup') || leftPlayer.role.includes('Wolf');
        const isSelectedWolf = selectedPlayerObj.role.includes('Loup') || selectedPlayerObj.role.includes('Wolf');
        const isRightWolf = rightPlayer.role.includes('Loup') || rightPlayer.role.includes('Wolf');
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

    console.log(`[MDJ] renderWolfKillSelection for ${this.selectedRoleId}:`);
    console.log(`[MDJ]   - Total players:`, players.map(p => ({ id: p.id, name: p.name, role: p.role })));
    console.log(`[MDJ]   - Dead players:`, Array.from(this.deadPlayerIds));
    console.log(`[MDJ]   - Selected victim:`, selectedVictim);

    // For Loup_Garou_Blanc: show ONLY wolves
    // For other wolves: show only non-wolves (normal kill)
    let validTargets;
    if (this.selectedRoleId === 'Loup_Garou_Blanc') {
      // Blanc can only kill other wolves (that aren't dead)
      validTargets = players.filter(p =>
        (p.role.includes('Loup') || p.role.includes('Wolf'))
        && p.role !== 'Loup_Garou_Blanc'
        && !this.deadPlayerIds.has(p.id)
      );
      console.log(`[MDJ]   - Loup_Garou_Blanc mode: filtering for OTHER WOLVES only (excluding dead)`);
    } else {
      // Normal wolves kill non-wolves (no other wolves, no dead players)
      validTargets = players.filter(p =>
        !p.role.includes('Loup')
        && !p.role.includes('Wolf')
        && !this.deadPlayerIds.has(p.id)
      );
      console.log(`[MDJ]   - Normal wolf mode (${this.selectedRoleId}): filtering for NON-WOLVES only (excluding dead)`);
    }

    console.log(`[MDJ]   - Valid targets (after filtering dead):`, validTargets.map(p => ({ id: p.id, name: p.name, role: p.role })));

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

    // Get victim from wolf kill (if already selected)
    let victimName = '???';
    let victimId = null;
    for (const roleId of ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc']) {
      if (this.roleStates[roleId]?.result?.targets?.length > 0) {
        // targets are stored as player IDs (p0, p1, etc)
        victimId = this.roleStates[roleId].result.targets[0];
        // Get player name from ID
        const player = players.find(p => p.id === victimId);
        if (player) victimName = player.name;
        break;
      }
    }

    const selectedAction = this.selectedPlayers[0];
    const selectedKillTarget = this.selectedPlayers[1] || null;

    // Ensure victimName is a real name, not an ID
    const displayVictimName = victimId ? this.getPlayerName(victimId) : victimName;

    actionControls.innerHTML = `
      <div class="sorciere-controls">
        <div style="color: white; font-size: 0.8rem; margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; border-left: 3px solid ${bgColor};">
          <strong>💀 Victime des Loups:</strong><br>
          <span style="font-size: 0.9rem; font-weight: bold; color: #ffaaaa;">${displayVictimName}</span>
        </div>

        <button class="potion-btn life-potion ${selectedAction === 'potion-life' ? 'selected' : ''}" style="background: ${selectedAction === 'potion-life' ? bgColor + '50' : bgColor + '30'}; border: 2px solid ${bgColor};">
          ${resurrectIcon} Potion Vie - La sauver
        </button>

        <div style="color: #aaa; font-size: 0.7rem; margin: 8px 0; text-align: center;">─── ou ───</div>

        <div style="color: white; font-size: 0.75rem; margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          Tuer un autre joueur:
        </div>
        <div class="sorciere-kill-list" style="display: flex; flex-direction: column; gap: 3px; max-height: 150px; overflow-y: auto;">
          ${this.playerRegistry.getAlive().map(p => `
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

    // Kill buttons - select who to kill
    actionControls.querySelectorAll('.sorciere-kill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.playerId;
        const playerName = this.getPlayerName(playerId);
        console.log(`[MDJ] 🧙‍♀️ Sorciere: ${playerName} selected for poison`);

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
    const selectedPlayer = this.selectedPlayers[0] || null;
    const corbeauRole = this.rolesLoader.getRole('Corbeau');
    const corbeauBorderColor = corbeauRole?.visual?.affectedColor?.borderColor || bgColor;

    // Filter out dead players
    const alivePlayers = this.playerRegistry.getAlive();

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

    this.renderActionButtons();
    this.updateSelectedDisplay();

    // Restore effects from completed roles
    console.log(`[MDJ] Calling restoreCompletedRoleEffects() to restore previous roles' visuals`);
    this.restoreCompletedRoleEffects();

    const roleData = this.rolesLoader.getRole(roleId);
    console.log(`[MDJ] === ROLE SELECTION COMPLETE: ${roleData.emoji} ${roleData.name} ===`);
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
    if ((action === 'kill' || action === 'poison') && this.selectedPlayers.length > 0) {
      const players = this.gm?.state?.players || [];
      this.selectedPlayers.forEach(playerId => {
        // Skip special keys like 'potion-death', 'potion-life'
        if (!playerId.startsWith('potion-')) {
          this.deadPlayerIds.add(playerId);
          const playerName = this.getPlayerName(playerId);
          console.log(`[MDJ] ☠️ ${roleName} killed ${playerName} (${playerId})`);
        }
      });
      console.log(`[MDJ] ☠️ Total dead players: ${Array.from(this.deadPlayerIds).map(id => this.getPlayerName(id)).join(', ')}`);
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
   * NOTE: No automatic phase change - user must click "Débat et Vote" button
   */
  checkIfNightComplete() {
    const allCompleted = Object.values(this.roleStates).every(
      state => state.completed
    );

    if (allCompleted) {
      console.log('[MDJ] ✓ First night complete! Night summary is ready.');

      // Log morning phase if function exists
      if (this.logger && typeof this.logger.logMorning === 'function') {
        this.logger.logMorning(1);
      }

      // Night summary will be shown by renderRoleListbox()
      // User clicks "Débat et Vote" button to proceed to day phase
      // No automatic transition - let user review summary first
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