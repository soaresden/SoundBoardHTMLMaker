/**
 * Assignment Mode UI
 *
 * Écran pour assigner les rôles aux joueurs
 * - Affiche la liste des joueurs
 * - Permet au MDJ de sélectionner les rôles
 * - Affiche les cartes visuellement
 */

class AssignmentMode {
  constructor(orchestrator, container) {
    this.orchestrator = orchestrator;
    this.container = container;
    this.rolesData = orchestrator.state.rolesData;
    this.players = orchestrator.state.players;
    this.currentPlayerIndex = 0;
    this.allRoleIds = this.getAllRoleIds();
  }

  /**
   * Récupère tous les IDs de rôles disponibles dans l'ordre
   */
  getAllRoleIds() {
    const roleIds = Object.keys(this.rolesData)
      .map(id => ({ id, order: this.rolesData[id].order }))
      .sort((a, b) => a.order - b.order)
      .map(r => r.id);
    return roleIds;
  }

  /**
   * Rend l'interface d'assignation
   */
  render() {
    this.container.innerHTML = `
      <div class="assignment-mode">
        <header class="assignment-header">
          <h1>🎴 Assignation des Rôles</h1>
          <p>Mode Maître de Jeu - Assignez les rôles aux joueurs</p>
        </header>

        <div class="assignment-layout">
          <!-- Panneau gauche: Liste des joueurs -->
          <div class="players-list">
            <h2>📋 Joueurs</h2>
            <div id="playersList"></div>
          </div>

          <!-- Panneau droit: Rôles disponibles -->
          <div class="roles-grid">
            <h2>🎭 Rôles du Deck</h2>
            <div id="rolesGrid"></div>
          </div>
        </div>

        <!-- Footer: Boutons d'action -->
        <footer class="assignment-footer">
          <button id="btnPrevious" class="btn-nav">← Précédent</button>
          <button id="btnNext" class="btn-nav" disabled>Suivant →</button>
          <button id="btnStart" class="btn-start" disabled>🚀 Commencer la Partie</button>
        </footer>
      </div>

      <style>
        .assignment-mode {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          font-family: 'Arial', sans-serif;
        }

        .assignment-header {
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 3px solid #6b4c9a;
          text-align: center;
        }

        .assignment-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .assignment-header p {
          margin: 0;
          font-size: 14px;
          opacity: 0.8;
        }

        .assignment-layout {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 20px;
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .players-list {
          background: rgba(0, 0, 0, 0.2);
          border: 2px solid #6b4c9a;
          border-radius: 8px;
          padding: 15px;
          max-height: 600px;
          overflow-y: auto;
        }

        .players-list h2 {
          margin-top: 0;
          font-size: 16px;
          border-bottom: 2px solid #6b4c9a;
          padding-bottom: 10px;
        }

        .player-item {
          padding: 10px;
          margin: 8px 0;
          background: rgba(107, 76, 154, 0.3);
          border-left: 4px solid #9966ff;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .player-item:hover {
          background: rgba(107, 76, 154, 0.5);
        }

        .player-item.active {
          background: rgba(107, 76, 154, 0.7);
          border-left-color: #ffff00;
        }

        .player-item.assigned {
          opacity: 0.6;
          background: rgba(74, 157, 111, 0.3);
          border-left-color: #66d999;
        }

        .player-name {
          font-weight: bold;
          font-size: 14px;
        }

        .player-role {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .roles-grid {
          background: rgba(0, 0, 0, 0.2);
          border: 2px solid #6b4c9a;
          border-radius: 8px;
          padding: 15px;
          overflow-y: auto;
        }

        .roles-grid h2 {
          margin-top: 0;
          font-size: 16px;
          border-bottom: 2px solid #6b4c9a;
          padding-bottom: 10px;
        }

        #rolesGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .role-card {
          background: rgba(107, 76, 154, 0.3);
          border: 2px solid #9966ff;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .role-card:hover {
          background: rgba(107, 76, 154, 0.5);
          border-color: #ffff00;
          transform: scale(1.05);
        }

        .role-card.selected {
          background: rgba(74, 157, 111, 0.7);
          border-color: #66d999;
          box-shadow: 0 0 15px rgba(102, 217, 153, 0.5);
        }

        .role-emoji {
          font-size: 24px;
          margin: 5px 0;
        }

        .role-name {
          font-size: 12px;
          font-weight: bold;
        }

        .assignment-footer {
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 3px solid #6b4c9a;
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-nav, .btn-start {
          padding: 10px 20px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: bold;
        }

        .btn-nav {
          background: #6b4c9a;
          color: #fff;
        }

        .btn-nav:hover:not(:disabled) {
          background: #8b6cb9;
        }

        .btn-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-start {
          background: #66d999;
          color: #000;
        }

        .btn-start:hover:not(:disabled) {
          background: #7fff99;
          box-shadow: 0 0 10px rgba(102, 217, 153, 0.5);
        }

        .btn-start:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .current-player-highlight {
          background: rgba(255, 255, 0, 0.1);
          border-left: 4px solid #ffff00 !important;
        }

        @media (max-width: 768px) {
          .assignment-layout {
            grid-template-columns: 1fr;
          }

          #rolesGrid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }
      </style>
    `;

    this.renderPlayersList();
    this.renderRolesGrid();
    this.attachEventListeners();
  }

  /**
   * Affiche la liste des joueurs
   */
  renderPlayersList() {
    const list = document.getElementById('playersList');
    list.innerHTML = this.players.map((player, idx) => {
      const roleInfo = player.roleId ? this.rolesData[player.roleId] : null;
      const isActive = idx === this.currentPlayerIndex;
      const isAssigned = !!player.roleId;

      return `
        <div class="player-item ${isActive ? 'active' : ''} ${isAssigned ? 'assigned' : ''}"
             onclick="window.assignmentMode.selectPlayer(${idx})">
          <div class="player-name">${player.name}</div>
          <div class="player-role">
            ${isAssigned ? `✅ ${roleInfo.emoji} ${roleInfo.name}` : '⭕ Non assigné'}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Affiche la grille des rôles
   */
  renderRolesGrid() {
    const grid = document.getElementById('rolesGrid');
    const currentPlayer = this.players[this.currentPlayerIndex];

    grid.innerHTML = this.allRoleIds.map(roleId => {
      const role = this.rolesData[roleId];
      const isSelected = currentPlayer.roleId === roleId;
      const isAlreadyTaken = this.players.some(p => p.id !== currentPlayer.id && p.roleId === roleId);

      return `
        <div class="role-card ${isSelected ? 'selected' : ''}"
             style="${isAlreadyTaken ? 'opacity: 0.4; cursor: not-allowed;' : ''}"
             onclick="${isAlreadyTaken ? '' : `window.assignmentMode.selectRole('${roleId}')`}">
          <div class="role-emoji">${role.emoji}</div>
          <div class="role-name">${role.name}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Sélectionne un joueur
   */
  selectPlayer(playerIndex) {
    this.currentPlayerIndex = playerIndex;
    this.render();
  }

  /**
   * Sélectionne un rôle pour le joueur courant
   */
  selectRole(roleId) {
    const currentPlayer = this.players[this.currentPlayerIndex];
    this.orchestrator.assignRoleToPlayer(currentPlayer.id, roleId);
    this.render();
  }

  /**
   * Navigue au joueur précédent
   */
  previousPlayer() {
    if (this.currentPlayerIndex > 0) {
      this.currentPlayerIndex--;
      this.render();
    }
  }

  /**
   * Navigue au joueur suivant
   */
  nextPlayer() {
    if (this.currentPlayerIndex < this.players.length - 1) {
      this.currentPlayerIndex++;
      this.render();
    }
  }

  /**
   * Commence la partie (première nuit)
   */
  startGame() {
    if (!this.orchestrator.areAllPlayersAssigned()) {
      alert('⚠️ Tous les joueurs doivent être assignés!');
      return;
    }

    // Passer à la première nuit
    const actingRoles = this.orchestrator.startFirstNightActions();
    this.onGameStarted(actingRoles);
  }

  /**
   * Attache les événements
   */
  attachEventListeners() {
    document.getElementById('btnPrevious').addEventListener('click', () => this.previousPlayer());
    document.getElementById('btnNext').addEventListener('click', () => this.nextPlayer());
    document.getElementById('btnStart').addEventListener('click', () => this.startGame());

    this.updateButtons();
  }

  /**
   * Met à jour l'état des boutons
   */
  updateButtons() {
    const btnPrevious = document.getElementById('btnPrevious');
    const btnNext = document.getElementById('btnNext');
    const btnStart = document.getElementById('btnStart');

    btnPrevious.disabled = this.currentPlayerIndex === 0;
    btnNext.disabled = this.currentPlayerIndex === this.players.length - 1;
    btnStart.disabled = !this.orchestrator.areAllPlayersAssigned();
  }

  /**
   * Callback quand la partie commence
   */
  onGameStarted(actingRoles) {
    // À implémenter: basculer vers l'écran FirstNightActions
    console.log('🎮 Partie commencée! Rôles avec actions:', actingRoles);
    // Émettre un événement ou appeler une callback
    if (this.onStartCallback) {
      this.onStartCallback(actingRoles);
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AssignmentMode = AssignmentMode;
}
