/**
 * 06-Night-MDJ.js
 *
 * Mode Maître du Jeu Animé (MDJ) - Subsequent Nights (2+)
 *
 * Same layout as FirstNightMDJ:
 * - Left: Full-height listbox with role list
 * - Center: Action buttons
 * - Right: Interactive player table
 * - Bottom: Action logs
 *
 * Differences from FirstNight:
 * - Fewer roles (no Chien Loup, Enfant Sauvage, Cupidon, etc.)
 * - Only everyNight and conditional roles
 * - Simplified action set
 */

class NightMDJ {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    this.logger = window.gameLogger;
    this.rolesLoader = window.rolesLoader;

    // Debug logging
    console.log('[NightMDJ] Constructor:', {
      gm: !!gm,
      container: !!container,
      logger: !!this.logger,
      rolesLoader: !!this.rolesLoader,
      rolesLoaderMethods: this.rolesLoader ? Object.keys(this.rolesLoader).filter(k => typeof this.rolesLoader[k] === 'function') : 'MISSING'
    });

    if (!this.rolesLoader) {
      console.error('[NightMDJ] ❌ rolesLoader not found in window!');
      console.log('Available on window:', Object.keys(window).filter(k => k.toLowerCase().includes('role')));
      throw new Error('RolesLoader not initialized');
    }

    // State
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    this.actionState = {};
    this.roleStates = {}; // Track which roles are completed

    // Initialize role states for this night
    this.initializeRoleStates();
  }

  /**
   * Initialize tracking for all active roles for this night
   */
  initializeRoleStates() {
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const nightNumber = this.gm.state.currentNightNumber || 2;

    orderedRoles.forEach(roleId => {
      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData || roleData.actionType !== 'NightActive') return;

      // Check if this role should wake up tonight
      if (!this.shouldRoleWakeUpTonight(roleId, nightNumber)) return;

      this.roleStates[roleId] = {
        completed: false,
        selected: false,
        result: null
      };
    });

    console.log(`[NightMDJ] Initialized ${Object.keys(this.roleStates).length} night-active roles`);
  }

  /**
   * Determine if a role should wake up tonight
   */
  shouldRoleWakeUpTonight(roleId, nightNumber) {
    const roleData = this.rolesLoader.getRole(roleId);
    if (roleData?.activePeriod === 'firstNightOnly') {
      return false;
    }
    return true;
  }

  /**
   * Initialize the night MDJ phase
   */
  init() {
    const nightNumber = this.gm.state.currentNightNumber || 1;
    this.logger.logNightStart(nightNumber);
    this.render();
    this.attachEvents();
  }

  /**
   * Main render method
   */
  render() {
    const nightNumber = this.gm.state.currentNightNumber || 1;

    this.container.innerHTML = `
      <div class="night-mdj">
        <!-- Left: Role Listbox -->
        <div class="mdj-listbox-panel">
          <div class="panel-header">
            <h2>🌙 Nuit ${nightNumber} - Rôles à Gérer</h2>
            <div class="progress">
              <span class="completed-count">0</span>/<span class="total-count">0</span>
            </div>
          </div>
          <div class="role-listbox" id="role-listbox"></div>
        </div>

        <!-- Middle: Action Buttons -->
        <div class="mdj-actions-panel">
          <div class="panel-header">
            <h3 id="action-title">Sélectionnez un rôle</h3>
          </div>
          <div class="action-buttons" id="action-buttons"></div>
          <div class="selected-players-display" id="selected-display"></div>
        </div>

        <!-- Right: Player Table -->
        <div class="mdj-table-panel">
          <div class="panel-header">
            <h2>👥 Joueurs (cliquez pour appliquer l'action)</h2>
          </div>
          <div class="player-table" id="player-table"></div>
        </div>

        <!-- Bottom: Logs -->
        <div class="mdj-logs-panel">
          <div class="panel-header">
            <h3>📋 Journal des Actions</h3>
          </div>
          <div class="game-logs" id="game-logs"></div>
        </div>

        <!-- Footer: Controls -->
        <div class="mdj-footer">
          <button class="btn btn-secondary skip-night-btn">⏭ Passer à la nuit suivante</button>
        </div>
      </div>
    `;

    this.ensureStyles();
    this.renderRoleListbox();
    this.renderPlayerTable();
    this.updateProgressCount();

    // Set the logger element
    this.logger.setLogElement(document.getElementById('game-logs'));
  }

  /**
   * Render the role listbox
   */
  renderRoleListbox() {
    const listbox = document.getElementById('role-listbox');

    const html = Object.keys(this.roleStates)
      .map(roleId => {
        const roleData = this.rolesLoader.getRole(roleId);
        if (!roleData) return '';

        const state = this.roleStates[roleId];
        const isSelected = this.selectedRoleId === roleId;
        const isCompleted = state.completed;

        return `
          <div class="listbox-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}"
               data-role-id="${roleId}">
            <div class="item-content">
              <span class="item-icon">${roleData.emoji}</span>
              <span class="item-name">${roleData.name}</span>
              ${isCompleted ? '<span class="item-status">✓</span>' : ''}
            </div>
          </div>
        `;
      })
      .join('');

    listbox.innerHTML = html || '<p style="color: #999; padding: 1rem;">Aucun rôle actif cette nuit</p>';
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
          .filter(p => !p.isDead)
          .map(
            (player, idx) => `
          <div class="player-card" data-player-index="${idx}" data-player-name="${player.name}">
            <div class="player-name">${player.name}</div>
            <div class="player-visual"></div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    table.innerHTML = html;
  }

  /**
   * Render action buttons for selected role
   */
  renderActionButtons() {
    const actionsPanel = document.getElementById('action-buttons');
    const titleEl = document.getElementById('action-title');

    if (!this.selectedRoleId) {
      actionsPanel.innerHTML = '';
      titleEl.textContent = 'Sélectionnez un rôle';
      return;
    }

    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    titleEl.textContent = `${roleData.emoji} ${roleData.name}`;
    actionsPanel.innerHTML = '<p>Cliquez sur les joueurs pour appliquer l\'action</p>';
  }

  /**
   * Update the selected players display
   */
  updateSelectedDisplay() {
    const display = document.getElementById('selected-display');
    if (this.selectedPlayers.length === 0) {
      display.innerHTML = '';
      return;
    }

    display.innerHTML = `
      <div class="selected-list">
        ${this.selectedPlayers.map(p => `<span class="tag">${p}</span>`).join('')}
      </div>
      <button class="btn btn-success complete-action-btn">Confirmer l'action</button>
    `;
  }

  /**
   * Update progress count
   */
  updateProgressCount() {
    const completed = Object.values(this.roleStates).filter(s => s.completed).length;
    const total = Object.keys(this.roleStates).length;
    const completedEl = this.container.querySelector('.completed-count');
    const totalEl = this.container.querySelector('.total-count');
    if (completedEl) completedEl.textContent = completed;
    if (totalEl) totalEl.textContent = total;
  }

  /**
   * Attach event listeners
   */
  attachEvents() {
    const listbox = this.container.querySelector('.role-listbox');
    const playerTable = this.container.querySelector('.player-table');
    const skipBtn = this.container.querySelector('.skip-night-btn');

    // Role selection
    listbox.addEventListener('click', (e) => {
      const item = e.target.closest('.listbox-item');
      if (item) {
        const roleId = item.dataset.roleId;
        this.selectRole(roleId);
      }
    });

    // Player clicks
    playerTable.addEventListener('click', (e) => {
      const card = e.target.closest('.player-card');
      if (card) {
        const playerName = card.dataset.playerName;
        const playerIndex = card.dataset.playerIndex;
        this.handlePlayerClick(playerName, playerIndex, card);
      }
    });

    // Skip night button
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.gm.changePhase('day');
      });
    }

    // Complete action button
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('complete-action-btn')) {
        this.completeRoleAction();
      }
    });
  }

  /**
   * Handle role selection
   */
  selectRole(roleId) {
    this.selectedRoleId = roleId;
    this.selectedPlayers = [];
    this.renderRoleListbox();
    this.renderActionButtons();
    this.updateSelectedDisplay();

    const roleData = this.rolesLoader.getRole(roleId);
    console.log(`[MDJ] Selected role: ${roleData.emoji} ${roleData.name}`);
  }

  /**
   * Handle player click
   */
  handlePlayerClick(playerName, playerIndex, playerCard) {
    if (!this.selectedRoleId) return;

    const isSelected = this.selectedPlayers.includes(playerName);
    if (isSelected) {
      this.selectedPlayers = this.selectedPlayers.filter(p => p !== playerName);
    } else {
      this.selectedPlayers.push(playerName);
    }

    this.updateSelectedDisplay();
  }

  /**
   * Complete the role action
   */
  completeRoleAction() {
    if (!this.selectedRoleId) return;

    // Mark role as completed
    this.roleStates[this.selectedRoleId].completed = true;
    this.roleStates[this.selectedRoleId].result = [...this.selectedPlayers];

    // Log the action
    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    this.logger.logAction(`${roleData.name} acted on: ${this.selectedPlayers.join(', ')}`);

    // Reset selection
    this.selectedRoleId = null;
    this.selectedPlayers = [];

    // Re-render
    this.render();
    this.attachEvents();
    this.updateProgressCount();
  }

  /**
   * Ensure CSS styles are loaded
   */
  ensureStyles() {
    const styleId = 'night-mdj-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .night-mdj {
        display: grid;
        grid-template-columns: 200px 1fr 1fr;
        grid-template-rows: 1fr auto;
        height: 100vh;
        width: 100%;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f5f5f5;
        font-family: Arial, sans-serif;
        overflow: hidden;
      }

      .mdj-listbox-panel {
        grid-column: 1;
        grid-row: 1 / 3;
        display: flex;
        flex-direction: column;
        border: 1px solid #ddd;
        border-radius: 5px;
        background: white;
        overflow: hidden;
      }

      .mdj-actions-panel {
        grid-column: 2;
        grid-row: 1 / 3;
        display: flex;
        flex-direction: column;
        border: 1px solid #ddd;
        border-radius: 5px;
        background: white;
        overflow: auto;
      }

      .mdj-table-panel {
        grid-column: 3;
        grid-row: 1;
        display: flex;
        flex-direction: column;
        border: 1px solid #ddd;
        border-radius: 5px;
        background: white;
        overflow: auto;
      }

      .mdj-logs-panel {
        grid-column: 3;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        border: 1px solid #ddd;
        border-radius: 5px;
        background: white;
        overflow: auto;
      }

      .mdj-footer {
        grid-column: 1 / 4;
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
      }

      .panel-header {
        padding: 0.5rem;
        border-bottom: 1px solid #eee;
        background: #f9f9f9;
        flex-shrink: 0;
      }

      .panel-header h2,
      .panel-header h3 {
        margin: 0.25rem 0;
        font-size: 1rem;
      }

      .progress {
        font-size: 0.8rem;
        color: #666;
      }

      .role-listbox {
        flex: 1;
        overflow-y: auto;
      }

      .listbox-item {
        padding: 0.5rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .listbox-item:hover {
        background: #f0f0f0;
      }

      .listbox-item.selected {
        background: #007bff;
        color: white;
      }

      .listbox-item.completed {
        opacity: 0.6;
      }

      .item-content {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .item-icon {
        font-size: 1.2rem;
      }

      .item-name {
        flex: 1;
      }

      .item-status {
        color: #4caf50;
        font-weight: bold;
      }

      .action-buttons {
        flex: 1;
        padding: 0.5rem;
        overflow-y: auto;
      }

      .selected-players-display {
        padding: 0.5rem;
        border-top: 1px solid #eee;
      }

      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0.75rem 0;
      }

      .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #fbc02d;
        color: #333;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .complete-action-btn {
        width: 100%;
        margin-top: 0.75rem;
      }

      .game-logs {
        flex: 1;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
      }

      .log-entry {
        padding: 0.4rem 0.5rem;
        border-bottom: 1px solid #eee;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .log-time {
        color: #666;
        font-size: 0.8rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .btn-secondary {
        background: #757575;
        color: white;
      }

      .btn-secondary:hover {
        background: #616161;
      }

      .btn-success {
        background: #4caf50;
        color: white;
      }

      .btn-success:hover {
        background: #45a049;
      }

      .players-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 0.5rem;
        padding: 0.5rem;
      }

      .player-card {
        padding: 0.5rem;
        border: 2px solid #ddd;
        border-radius: 5px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
      }

      .player-card:hover {
        border-color: #007bff;
        transform: scale(1.05);
      }

      .player-name {
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .player-visual {
        width: 40px;
        height: 40px;
        margin: 0 auto;
        background: #f0f0f0;
        border-radius: 50%;
      }

      @media (max-width: 1200px) {
        .night-mdj {
          grid-template-columns: 200px 1fr;
          grid-template-rows: 1fr 1fr auto;
        }

        .mdj-table-panel {
          grid-column: 2;
          grid-row: 1;
        }

        .mdj-logs-panel {
          grid-column: 2;
          grid-row: 2;
        }

        .mdj-actions-panel {
          grid-column: 1;
          grid-row: 2;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose to window for use in game-master-ui.js
window.NightMDJ = NightMDJ;
