/**
 * 03-FirstNight-MDJ.js (Refactored - v50)
 *
 * Maître du Jeu Animé (MDJ) - First Night
 * Now using modular architecture with external CSS
 *
 * Structure:
 * - Left: Role list
 * - Center: Live player map
 * - Right: Action controls
 */

class FirstNightMDJ {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    this.logger = window.gameLogger;

    // Use rolesLoader wrapper
    this.rolesLoader = window.rolesLoader || {
      getOrderedRoleIds: () => window.getOrderedRoleIds?.() || [],
      getRole: (roleId) => window.ROLES_DATA?.roles?.[roleId] || null
    };

    console.log('VERSION 50 - Refactored with modular architecture');

    // State management
    this.nightState = new NightState(gm.state);
    this.selectedRoleId = null;
    this.roleStates = {};
    this.actionState = {};

    // Special states
    this._chasseurMustChoose = false;
    this._chasseurToChoose = null;
    this._dayVoteSelectedId = null;
    this._dayVoteKilled = false;

    // Election & voting
    this.selectedMayorId = null;
    this.mayorId = null;
    this.mayorElectionCompleted = false;
    this.selectedLynchVictimId = null;
    this.currentNight = 1;

    // Renderer cache
    this.nightSummaryRenderer = new NightSummaryRenderer(this.rolesLoader, (id) => this.getPlayerName(id));

    this.initializeRoleStates();
    console.log('[FirstNightMDJ] ✓ Initialized');
  }

  getPlayerName(playerId) {
    if (!playerId) return '???';
    const p = this.gm?.state?.players?.find(x => x.id === playerId);
    return p?.name || playerId;
  }

  getPlayerDisplayName(playerId) {
    const name = this.getPlayerName(playerId);
    return this.mayorId === playerId ? `🎖️ ${name}` : name;
  }

  getProtectedPlayers() {
    const protected = new Set();
    if (this.roleStates['Salvateur']?.completed && this.roleStates['Salvateur']?.result?.targets) {
      this.roleStates['Salvateur'].result.targets.forEach(id => {
        if (id && !id.startsWith('potion-')) protected.add(id);
      });
    }
    return protected;
  }

  initializeRoleStates() {
    const roles = this.rolesLoader.getOrderedRoleIds();
    roles.forEach(roleId => {
      const roleData = this.rolesLoader.getRole(roleId);
      if (roleData?.active) {
        this.roleStates[roleId] = {
          completed: false,
          result: null,
          roleName: roleData.name,
          emoji: roleData.emoji
        };
      }
    });
  }

  /**
   * Main render method - Creates full UI
   */
  render() {
    this.ensureStyles();
    this.container.innerHTML = '';

    const main = document.createElement('div');
    main.className = 'mdj-main-container';
    main.id = 'mdj-main-container';

    // Left panel: Role list
    const leftPanel = document.createElement('div');
    leftPanel.className = 'mdj-left-panel';
    this.renderRoleList(leftPanel);

    // Center panel: Live map
    const centerPanel = document.createElement('div');
    centerPanel.className = 'mdj-center-panel';
    this.renderLiveMap(centerPanel);

    // Right panel: Actions
    const rightPanel = document.createElement('div');
    rightPanel.className = 'mdj-right-panel';
    this.renderActionZone(rightPanel);

    main.appendChild(leftPanel);
    main.appendChild(centerPanel);
    main.appendChild(rightPanel);
    this.container.appendChild(main);

    // Attach resize handles
    this.setupResizeHandles();

    console.log('[FirstNightMDJ] Render complete');
  }

  /**
   * Left panel: Role list with status
   */
  renderRoleList(panel) {
    const header = document.createElement('div');
    header.className = 'role-list-header';
    header.textContent = '📋 Rôles';

    const list = document.createElement('div');
    list.className = 'role-list-blue';

    const roles = this.rolesLoader.getOrderedRoleIds();

    roles.forEach(roleId => {
      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData?.active) return;

      const item = document.createElement('div');
      item.className = 'listbox-item';
      item.dataset.roleId = roleId;

      const icon = document.createElement('span');
      icon.className = 'item-icon';
      icon.textContent = roleData.emoji;

      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = roleData.name;

      const status = document.createElement('span');
      status.className = 'item-status';
      status.textContent = this.roleStates[roleId]?.completed ? '✓' : '';

      if (this.roleStates[roleId]?.completed) {
        item.classList.add('completed');
      }

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(status);

      item.addEventListener('click', () => this.selectRole(roleId, item));

      list.appendChild(item);
    });

    panel.appendChild(header);
    panel.appendChild(list);
  }

  /**
   * Center panel: Live player map
   */
  renderLiveMap(panel) {
    const header = document.createElement('div');
    header.className = 'panel-header-compact';
    header.textContent = '👥 Table';

    const mapCont = document.createElement('div');
    mapCont.className = 'mdj-live-map';

    const players = this.gm?.state?.players || [];
    const svg = this.createTableVisualization(players);

    mapCont.appendChild(svg);

    const legend = document.createElement('div');
    legend.className = 'mdj-legend';
    legend.innerHTML = '<div class="legend-title">Légende</div>';
    const grid = document.createElement('div');
    grid.className = 'legend-grid';

    players.forEach(p => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.style.cssText = `background: ${p.color || '#ccc'}; opacity: 0.6;`;

      const label = document.createElement('span');
      label.className = 'legend-name';
      label.textContent = HTMLHelpers.escapeHTML(p.name);

      item.appendChild(label);
      grid.appendChild(item);
    });

    legend.appendChild(grid);

    panel.appendChild(header);
    panel.appendChild(mapCont);
    panel.appendChild(legend);
  }

  /**
   * Create SVG table visualization
   */
  createTableVisualization(players) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 500');
    svg.setAttribute('class', 'mdj-table-visual');

    const center = { x: 250, y: 250 };
    const radius = 180;
    const angleStep = (2 * Math.PI) / Math.max(players.length, 1);

    // Center marker
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', center.x);
    centerCircle.setAttribute('cy', center.y);
    centerCircle.setAttribute('r', '18');
    centerCircle.setAttribute('fill', 'rgba(120,85,60,0.3)');
    centerCircle.setAttribute('stroke', 'rgba(140,100,70,0.5)');
    svg.appendChild(centerCircle);

    // Player dots
    players.forEach((p, i) => {
      const angle = i * angleStep;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // Player point
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '15');
      circle.setAttribute('fill', p.color || '#999');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');

      // Player name
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y - 25);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#f0f0f8');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '700');
      text.textContent = p.name.substring(0, 3);

      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
    });

    return svg;
  }

  /**
   * Right panel: Action controls
   */
  renderActionZone(panel) {
    const title = document.createElement('div');
    title.className = 'action-title-big';
    title.textContent = '⚙️ Actions';
    title.style.background = 'rgba(100,100,200,0.3)';

    const controls = document.createElement('div');
    controls.className = 'action-controls';
    controls.id = 'action-controls-container';

    const info = document.createElement('div');
    info.className = 'action-info';
    info.textContent = 'Sélectionnez un rôle pour voir les actions';

    panel.appendChild(title);
    panel.appendChild(controls);
    panel.appendChild(info);
  }

  /**
   * Select a role and show its actions
   */
  selectRole(roleId, item) {
    this.selectedRoleId = roleId;

    // Update UI
    document.querySelectorAll('.listbox-item').forEach(li => li.classList.remove('selected'));
    item.classList.add('selected');

    const roleData = this.rolesLoader.getRole(roleId);
    const container = document.getElementById('action-controls-container');
    container.innerHTML = '';

    // Use RoleRenderersFactory to create the appropriate renderer
    const renderer = RoleRenderersFactory.create(roleId, this.gm.state, this.rolesLoader, this.nightState);
    const actionUI = renderer.render(this.roleStates[roleId], (action, targets) => {
      this.completeAction(roleId, action, targets);
    });

    container.appendChild(actionUI);
  }

  /**
   * Complete an action and mark role as done
   */
  completeAction(roleId, action, targets) {
    this.roleStates[roleId].completed = true;
    this.roleStates[roleId].result = { action, targets };

    console.log(`✓ ${roleId}: ${action}`, targets);

    // Update UI
    const item = document.querySelector(`[data-roleId="${roleId}"]`);
    if (item) item.classList.add('completed');

    // Auto-move to next role
    const roles = this.rolesLoader.getOrderedRoleIds();
    const idx = roles.indexOf(roleId);
    if (idx < roles.length - 1) {
      const nextRoleId = roles[idx + 1];
      const nextItem = document.querySelector(`[data-roleId="${nextRoleId}"]`);
      if (nextItem) {
        setTimeout(() => nextItem.click(), 300);
      }
    }
  }

  /**
   * Setup resize handles between panels
   */
  setupResizeHandles() {
    const main = document.getElementById('mdj-main-container');
    if (!main) return;

    // Add resize handle between left and center
    const h1 = document.createElement('div');
    h1.className = 'mdj-resize-handle';
    main.insertBefore(h1, main.children[1]);

    // Add resize handle between center and right
    const h2 = document.createElement('div');
    h2.className = 'mdj-resize-handle';
    main.insertBefore(h2, main.children[3]);

    this.attachResizeListeners();
  }

  /**
   * Attach resize event listeners
   */
  attachResizeListeners() {
    const handles = document.querySelectorAll('.mdj-resize-handle');
    let isResizing = false;
    let resizeMode = null;

    handles.forEach((handle, i) => {
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeMode = i === 0 ? 'left-center' : 'center-right';
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      // Resize logic (keeping it simple for now)
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    });
  }

  /**
   * Load CSS from external file
   */
  ensureStyles() {
    if (document.getElementById('first-night-mdj-styles')) return;

    const link = document.createElement('link');
    link.id = 'first-night-mdj-styles';
    link.rel = 'stylesheet';
    link.href = '/gamemaster/phases/styles/first-night-mdj.css';
    document.head.appendChild(link);

    // Fallback: inline CSS if file not loaded
    if (!document.querySelector('link[href*="first-night-mdj.css"]')) {
      console.warn('[FirstNightMDJ] CSS file not loaded, styles may be incomplete');
    }
  }
}

// Export
window.FirstNightMDJ = FirstNightMDJ;
