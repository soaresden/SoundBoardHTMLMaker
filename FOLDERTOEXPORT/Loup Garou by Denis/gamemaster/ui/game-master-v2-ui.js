// ========================================
// GAME MASTER V2 - Interface avec Vue Top-Down
// ========================================

class GameMasterV2UI {
  constructor(gameMaster) {
    this.gm = gameMaster;
    this.collapsed = false;
    this.draggingCard = null;
    this.dragOffset = { x: 0, y: 0 };
    this.cardPositions = {}; // Stocker les positions des cartes
    this.init();
  }

  init() {
    this.createOverlay();
    this.attachEventListeners();
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'gameMasterOverlay';
    overlay.className = 'game-master-overlay';
    overlay.innerHTML = `
      <div class="gm-header">
        <div class="gm-title">🐺 Maître du Jeu</div>
        <button class="gm-btn-collapse" id="gmBtnCollapse" title="Réduire">−</button>
        <button class="gm-btn-close" id="gmBtnClose" title="Fermer">×</button>
      </div>
      <div class="gm-content" id="gmContent">
        <!-- Le contenu sera rendu ici dynamiquement -->
      </div>
    `;
    document.body.appendChild(overlay);
  }

  attachEventListeners() {
    document.getElementById('gmBtnCollapse')?.addEventListener('click', () => this.toggleCollapse());
    document.getElementById('gmBtnClose')?.addEventListener('click', () => this.close());
  }

  render() {
    const content = document.getElementById('gmContent');
    if (!content) return;

    const mode = this.gm.state.mode;
    let html = '';

    switch (mode) {
      case 'setup':
        html = this.renderSetup();
        break;
      case 'players':
        html = this.renderPlayers();
        break;
      case 'roles':
        html = this.renderRoles();
        break;
      case 'playing':
        html = this.renderGameTopDown();
        break;
      case 'history':
        html = this.renderHistory();
        break;
      default:
        html = this.renderSetup();
    }

    content.innerHTML = html;
    setTimeout(() => this.attachDynamicListeners(), 0);
  }

  // ===== SETUP =====
  renderSetup() {
    return `
      <div class="gm-screen">
        <h2>🐺 Maître du Jeu - Loup-Garou</h2>
        <p style="opacity:0.7">Gérez votre partie de Loup-Garou!</p>
        <div class="gm-buttons">
          <button class="gm-btn-action" id="gmBtnNewGame">🎲 Nouvelle Partie</button>
        </div>
      </div>
    `;
  }

  // ===== JOUEURS =====
  renderPlayers() {
    const players = this.gm.state.players;
    const playerInputs = players.map((p, idx) => `
      <div class="gm-player-input">
        <input type="text" class="gm-input" value="${p.name}" data-player-id="${p.id}" placeholder="Nom du joueur...">
        <button class="gm-btn-remove" data-player-id="${p.id}">−</button>
      </div>
    `).join('');

    return `
      <div class="gm-screen">
        <h2>Joueurs (${players.length})</h2>
        <p style="opacity:0.7; font-size:12px;">Entrez le nom de chaque joueur</p>

        <div class="gm-players-list">
          ${playerInputs}
        </div>

        <button class="gm-btn-secondary" id="gmBtnAddPlayer">+ Ajouter Joueur</button>

        <div class="gm-buttons" style="margin-top:16px;">
          <button class="gm-btn-secondary" id="gmBtnBackPlayers">← Retour</button>
          <button class="gm-btn-action" id="gmBtnContinueRoles">Suivant →</button>
        </div>
      </div>
    `;
  }

  // ===== RÔLES =====
  renderRoles() {
    const playerCount = this.gm.state.players.length;
    const allRoles = Object.entries(this.gm.roles);

    const grouped = {};
    allRoles.forEach(([id, role]) => {
      if (!grouped[role.category]) grouped[role.category] = [];
      grouped[role.category].push([id, role]);
    });

    let rolesList = '';
    Object.entries(grouped).forEach(([category, roles]) => {
      rolesList += `
        <div class="gm-role-category">
          <h4>${category}</h4>
          <div class="gm-role-grid">
            ${roles.map(([id, role]) => `
              <div class="gm-role-card ${this.gm.state.selectedRoles.includes(id) ? 'selected' : ''}" data-role-id="${id}">
                <div class="gm-role-icon">${role.icon}</div>
                <div class="gm-role-name">${id}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    return `
      <div class="gm-screen">
        <h2>Sélection des Rôles</h2>
        <p style="opacity:0.7; font-size:12px;">Sélectionnez ${playerCount} rôles (actuellement: ${this.gm.state.selectedRoles.length})</p>

        <div class="gm-roles-container">
          ${rolesList}
        </div>

        <div class="gm-buttons" style="margin-top:16px;">
          <button class="gm-btn-secondary" id="gmBtnBackRoles">← Retour</button>
          <button class="gm-btn-action" id="gmBtnStartGame">Démarrer →</button>
        </div>
      </div>
    `;
  }

  // ===== VUE TOP-DOWN =====
  renderGameTopDown() {
    const phaseInfo = this.gm.getCurrentPhaseInfo();
    const players = this.gm.state.players;
    const tableSize = this.calculateTableSize(players.length);

    // Générer les positions initiales des joueurs en cercle
    const playerPositions = this.generateCirclePositions(players.length, tableSize);

    const cardsHtml = players.map((p, idx) => {
      const role = this.gm.getPlayerRole(p.id);
      const pos = playerPositions[idx];
      const isDead = p.isDead;
      const cardClass = isDead ? 'dead' : '';

      return `
        <div class="gm-table-card ${cardClass}"
             data-player-id="${p.id}"
             style="left: ${pos.x}px; top: ${pos.y}px;"
             draggable="true">
          <div class="gm-card-inner">
            <div class="gm-card-role">${role ? role.icon : '?'}</div>
            <div class="gm-card-name">${p.name}</div>
            ${isDead ? '<div class="gm-card-dead">†</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="gm-screen">
        <div class="gm-phase-info">
          <span style="font-size:20px;">${phaseInfo.emoji}</span>
          <span>${phaseInfo.description}</span>
        </div>

        <div class="gm-table" id="gmTable">
          ${cardsHtml}
        </div>

        <div class="gm-buttons">
          <button class="gm-btn-secondary" id="gmBtnNextPhase">Passer à la phase suivante</button>
          <button class="gm-btn-secondary" id="gmBtnHistory">📜 Historique</button>
        </div>
      </div>
    `;
  }

  // ===== HISTORIQUE =====
  renderHistory() {
    const history = this.gm.getGameHistory();
    const historyHtml = history.map(action => `
      <div class="gm-history-entry">
        <span style="opacity:0.6; font-size:11px;">T${action.turn} ${action.phase}</span>
        <span>${action.actionType}</span>
      </div>
    `).join('');

    return `
      <div class="gm-screen">
        <h2>Historique</h2>
        <div class="gm-history-list">
          ${historyHtml || '<p style="opacity:0.5;">Aucune action</p>'}
        </div>
        <div class="gm-buttons">
          <button class="gm-btn-secondary" id="gmBtnBackHistory">← Retour</button>
        </div>
      </div>
    `;
  }

  // ===== UTILITAIRES =====
  calculateTableSize(playerCount) {
    // Calibrer la taille en fonction du nombre de joueurs
    return Math.max(400, Math.min(600, playerCount * 60));
  }

  generateCirclePositions(count, tableSize) {
    const positions = [];
    const centerX = tableSize / 2;
    const centerY = tableSize / 2;
    const radius = tableSize / 3;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 50; // -50 pour centrer la carte
      const y = centerY + radius * Math.sin(angle) - 50;
      positions.push({ x: Math.round(x), y: Math.round(y) });
    }

    return positions;
  }

  // ===== LISTENERS =====
  attachDynamicListeners() {
    // Setup
    document.getElementById('gmBtnNewGame')?.addEventListener('click', (e) => {
      console.log('Clicked New Game');
      e.preventDefault();
      e.stopPropagation();
      this.gm.state.mode = 'players';
      this.gm.state.players = [];
      this.gm.saveState();
      this.render();
    });

    // Players
    document.getElementById('gmBtnAddPlayer')?.addEventListener('click', () => {
      const name = `Joueur ${this.gm.state.players.length + 1}`;
      this.gm.addPlayer(name);
      this.render();
    });

    document.querySelectorAll('.gm-btn-remove')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = e.target.dataset.playerId;
        this.gm.removePlayer(playerId);
        this.render();
      });
    });

    document.getElementById('gmBtnContinueRoles')?.addEventListener('click', () => {
      this.gm.state.mode = 'roles';
      this.gm.state.selectedRoles = [];
      this.gm.saveState();
      this.render();
    });

    // Roles
    document.querySelectorAll('.gm-role-card')?.forEach(card => {
      card.addEventListener('click', () => {
        const roleId = card.dataset.roleId;
        const idx = this.gm.state.selectedRoles.indexOf(roleId);
        if (idx === -1) {
          this.gm.state.selectedRoles.push(roleId);
        } else {
          this.gm.state.selectedRoles.splice(idx, 1);
        }
        this.gm.saveState();
        this.render();
      });
    });

    document.getElementById('gmBtnStartGame')?.addEventListener('click', () => {
      if (this.gm.state.selectedRoles.length !== this.gm.state.players.length) {
        alert(`Sélectionnez exactement ${this.gm.state.players.length} rôles!`);
        return;
      }
      // Assigner les rôles
      this.gm.state.players.forEach((p, i) => {
        p.roleId = this.gm.state.selectedRoles[i];
      });
      this.gm.startGame(this.gm.state.selectedRoles);
      this.gm.state.mode = 'playing';
      this.gm.saveState();
      this.render();
      this.setupDraggable();
    });

    // Navigation
    document.getElementById('gmBtnBackPlayers')?.addEventListener('click', () => {
      this.gm.state.mode = 'setup';
      this.gm.saveState();
      this.render();
    });

    document.getElementById('gmBtnBackRoles')?.addEventListener('click', () => {
      this.gm.state.mode = 'players';
      this.gm.saveState();
      this.render();
    });

    document.getElementById('gmBtnNextPhase')?.addEventListener('click', () => {
      this.gm.nextPhase();
      this.gm.saveState();
      this.render();
      this.setupDraggable();
    });

    document.getElementById('gmBtnHistory')?.addEventListener('click', () => {
      this.gm.state.mode = 'history';
      this.gm.saveState();
      this.render();
    });

    document.getElementById('gmBtnBackHistory')?.addEventListener('click', () => {
      this.gm.state.mode = 'playing';
      this.gm.saveState();
      this.render();
      this.setupDraggable();
    });
  }

  // ===== DRAGGABLE =====
  setupDraggable() {
    const cards = document.querySelectorAll('.gm-table-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.playerId);
        card.style.opacity = '0.5';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
    });

    const table = document.getElementById('gmTable');
    if (table) {
      table.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      table.addEventListener('drop', (e) => {
        e.preventDefault();
        const playerId = e.dataTransfer.getData('text/plain');
        const card = document.querySelector(`[data-player-id="${playerId}"]`);
        if (card) {
          const rect = table.getBoundingClientRect();
          const x = e.clientX - rect.left - 50;
          const y = e.clientY - rect.top - 50;
          card.style.left = `${Math.max(0, Math.min(x, 400))}px`;
          card.style.top = `${Math.max(0, Math.min(y, 400))}px`;
        }
      });
    }
  }

  toggleCollapse() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      this.collapsed = !this.collapsed;
      overlay.classList.toggle('collapsed');
    }
  }

  close() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  show() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (overlay) {
      overlay.style.display = 'block';
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameMasterV2UI;
}
