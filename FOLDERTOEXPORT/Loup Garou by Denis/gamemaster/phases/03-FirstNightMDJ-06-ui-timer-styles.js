// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


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
,


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
,


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
,


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
,


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
,


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

      .mdj-victory-bar {
        flex: 0 0 auto;
        flex-shrink: 0;
        width: 100%;
        margin-top: 2px;
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

});
