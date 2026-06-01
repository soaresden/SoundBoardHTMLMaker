/**
 * 04-RevealSequential.js
 *
 * Mode Aléatoire: Sequential Role Revelation via Tablet
 *
 * The tablet passes between players sequentially.
 * Each player sees:
 * 1. Their name (large, clear)
 * 2. A "Reveal Your Role" button
 * 3. After revealing: their role card with large emoji
 * 4. A "Next Player" button to pass to the next player
 * 5. After all players: message to give tablet to game master
 *
 * State management:
 * - gm.state.players: array of player objects with assigned roles
 * - currentPlayerIndex: tracks which player is currently viewing
 * - roleRevealed: whether current player has revealed their role
 */

class RevealSequential {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    this.currentPlayerIndex = 0;
    this.roleRevealed = false;

    console.log('[RevealSequential] Constructor called');
    console.log('[RevealSequential] Total players:', this.gm.state.players?.length || 0);
    console.log('[RevealSequential] Selected roles:', JSON.stringify(this.gm.state.selectedRoles));
    console.log('[RevealSequential] ROLES_DATA available:', !!window.ROLES_DATA);
  }

  /**
   * Initialize the sequential reveal screen
   */
  init() {
    console.log('[RevealSequential] Initializing...');

    // Verify we have players
    if (!this.gm.state.players || this.gm.state.players.length === 0) {
      console.error('[RevealSequential] No players found in game state');
      this.render();
      return;
    }

    // Verify ROLES_DATA is available
    if (!window.ROLES_DATA) {
      console.error('[RevealSequential] ROLES_DATA not available');
      this.render();
      return;
    }

    console.log('[RevealSequential] About to assign roles...');
    // If roles haven't been assigned yet, assign them randomly
    this.ensureRolesAssigned();

    console.log('[RevealSequential] After role assignment, players:',
      this.gm.state.players.map(p => `${p.name}:${p.role}`).join(', '));

    this.render();
    this.attachEvents();
  }

  /**
   * Ensure all players have roles assigned
   * If not, randomly assign selected roles to players
   */
  ensureRolesAssigned() {
    const players = this.gm.state.players;

    console.log('[RevealSequential] Checking if roles need assignment...');
    console.log('[RevealSequential] Players with roles:', players.filter(p => p.role).length, '/', players.length);

    const allPlayersAssigned = players.every(p => p.role);

    if (allPlayersAssigned) {
      console.log('[RevealSequential] ✓ All players already have roles assigned');
      return;
    }

    console.log('[RevealSequential] ⚠️ Assigning roles to players...');

    // Get selected roles from state (stored as object keys with counts)
    const selectedRoles = this.gm.state.selectedRoles || {};
    console.log('[RevealSequential] Selected roles object:', selectedRoles);

    const rolesToAssign = [];

    // Flatten the selectedRoles object into an array
    for (const [roleId, count] of Object.entries(selectedRoles)) {
      const numCount = parseInt(count) || 1;
      console.log(`[RevealSequential]   ${roleId}: ${numCount}`);
      for (let i = 0; i < numCount; i++) {
        rolesToAssign.push(roleId);
      }
    }

    console.log(`[RevealSequential] Total roles to assign: ${rolesToAssign.length} for ${players.length} players`);

    if (rolesToAssign.length === 0) {
      console.error('[RevealSequential] ❌ No roles selected! Using default villagers');
      players.forEach((player, index) => {
        player.role = 'Villageois';
      });
      return;
    }

    // Shuffle the roles array using Fisher-Yates
    for (let i = rolesToAssign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesToAssign[i], rolesToAssign[j]] = [rolesToAssign[j], rolesToAssign[i]];
    }

    console.log('[RevealSequential] Shuffled roles:', rolesToAssign);

    // Assign roles to players
    players.forEach((player, index) => {
      if (index < rolesToAssign.length) {
        player.role = rolesToAssign[index];
        console.log(`[RevealSequential]   ✓ ${player.name} ← ${rolesToAssign[index]}`);
      } else {
        console.warn(`[RevealSequential]   ⚠️ Not enough roles, using fallback for ${player.name}`);
        player.role = 'Villageois';
      }
    });

    console.log('[RevealSequential] ✓ Role assignment complete');
  }

  /**
   * Render the current state of the reveal screen
   */
  render() {
    const players = this.gm.state.players || [];
    const currentPlayer = players[this.currentPlayerIndex];

    if (!currentPlayer) {
      // All players have revealed
      this.renderEndScreen();
      return;
    }

    const rolesData = window.ROLES_DATA?.roles || {};
    const roleInfo = rolesData[currentPlayer.role];

    console.log('[RevealSequential] Rendering player', this.currentPlayerIndex + 1, 'of', players.length);
    console.log('[RevealSequential] Current player:', currentPlayer.name, 'Role:', currentPlayer.role);
    console.log('[RevealSequential] Role info:', roleInfo);
    console.log('[RevealSequential] Role revealed:', this.roleRevealed);

    let mainContent = '';

    if (!this.roleRevealed) {
      // Player hasn't revealed yet - show name and reveal button
      mainContent = `
        <div class="reveal-container">
          <div class="player-number">Joueur ${this.currentPlayerIndex + 1} sur ${players.length}</div>
          <div class="player-name-large">${currentPlayer.name}</div>
          <p class="reveal-prompt">Appuyez pour révéler votre rôle</p>
          <button class="btn btn-primary btn-reveal">Révéler mon Rôle</button>
        </div>
      `;
    } else {
      // Role is revealed - show compact card with image + info side-by-side
      const emoji = roleInfo?.emoji || '❓';
      const roleName = roleInfo?.name || currentPlayer.role;
      const camp = roleInfo?.camp || 'Inconnu';
      // Check both 'power' and 'pouvoir' (French naming)
      const power = roleInfo?.power || roleInfo?.pouvoir || 'Pouvoir non défini';
      const tips = roleInfo?.tips || roleInfo?.instruction || 'Conseil non disponible';
      // Get image path dynamically based on role file mapping
      const cardImage = window.getRoleImagePath ? window.getRoleImagePath(currentPlayer.role) : `gamemaster/roles/${currentPlayer.role}.png`;

      // Parse win conditions - check both root level and assistedMode
      let winConditions = roleInfo?.winConditions || roleInfo?.assistedMode?.winConditions || [];
      let winText = 'Conditions de victoire non définies';

      console.log('[RevealSequential] Win conditions for', currentPlayer.role, ':', winConditions);

      if (Array.isArray(winConditions) && winConditions.length > 0) {
        winText = winConditions
          .map(w => w.description || w.value || '')
          .filter(desc => desc)
          .join(' • ');
      }

      mainContent = `
        <div class="reveal-container">
          <div class="player-number">Joueur ${this.currentPlayerIndex + 1} sur ${players.length}</div>

          <div class="role-card">
            <!-- Colonne gauche: Image + Nom + Bouton -->
            <div class="card-left">
              <div class="role-image-box">
                <img src="${cardImage}" alt="${roleName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2260%22>${emoji}</text></svg>'">
              </div>
              <div class="role-name">${roleName}</div>
              <div class="role-camp">${camp}</div>
              <button class="btn btn-success btn-next">Suivant →</button>
            </div>

            <!-- Colonne droite: Infos -->
            <div class="card-right">
              <div class="player-name-section">${currentPlayer.name}</div>

              <div class="info-section">
                <div class="section-label">💪 Pouvoir</div>
                <div class="section-text">${power}</div>
              </div>

              <div class="info-section">
                <div class="section-label">💡 Tips</div>
                <div class="section-text">${tips}</div>
              </div>

              <div class="info-section">
                <div class="section-label">🏆 Victoire</div>
                <div class="section-text">${winText}</div>
              </div>

              <div class="section-encouragement">✨ BON COURAGE ! ✨</div>
            </div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="phase-container reveal-sequential-container">
        <div class="reveal-skip-btn-container">
          <button class="btn btn-warning btn-skip-reveal">⏭️ Passer la Révélation</button>
        </div>
        ${mainContent}
      </div>
    `;

    this.ensureStyles();
  }

  /**
   * Render the end screen after all players have revealed
   */
  renderEndScreen() {
    console.log('[RevealSequential] Rendering end screen');

    this.container.innerHTML = `
      <div class="phase-container reveal-sequential-container">
        <div class="end-screen">
          <div class="end-icon">🎮</div>
          <h1>Tous les joueurs ont reçu leur rôle !</h1>
          <p class="end-message">Donnez la tablette au Maître du Jeu pour commencer la partie.</p>
          <button class="btn btn-primary btn-start-game">Démarrer le Jeu (MDJ)</button>
        </div>
      </div>
    `;

    this.ensureStyles();
    this.attachEndScreenEvents();
  }

  /**
   * Attach event listeners
   */
  attachEvents() {
    // Skip all roles button
    const skipBtn = this.container.querySelector('.btn-skip-reveal');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        console.log('[RevealSequential] Skipping all role revelations');
        this.gm.changePhase('firstNight');
      });
    }

    const revealBtn = this.container.querySelector('.btn-reveal');
    const nextBtn = this.container.querySelector('.btn-next');

    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        console.log('[RevealSequential] Revealing role for player', this.currentPlayerIndex + 1);
        this.roleRevealed = true;
        this.render();
        this.attachEvents();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('[RevealSequential] Moving to next player');
        this.currentPlayerIndex++;
        this.roleRevealed = false;
        this.render();
        this.attachEvents();
      });
    }
  }

  /**
   * Attach event listeners for end screen
   */
  attachEndScreenEvents() {
    const startBtn = this.container.querySelector('.btn-start-game');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        console.log('[RevealSequential] Starting game - moving to FirstNight-MDJ');
        this.gm.changePhase('firstNight');
      });
    }
  }

  /**
   * Ensure CSS styles are loaded
   */
  ensureStyles() {
    const styleId = 'reveal-sequential-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .reveal-sequential-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow: hidden;
        position: relative;
      }

      .reveal-skip-btn-container {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 1000;
      }

      .btn-skip-reveal {
        padding: 0.8rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 700;
        background: #ff9800;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      }

      .btn-skip-reveal:hover {
        background: #f57c00;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 152, 0, 0.5);
      }

      .btn-skip-reveal:active {
        transform: translateY(0);
      }

      .reveal-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        padding: 2rem;
        max-width: 500px;
      }

      .player-number {
        font-size: 1rem;
        opacity: 0.8;
        margin-bottom: 1.5rem;
        font-weight: 600;
        letter-spacing: 1px;
      }

      .player-name-large {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 2rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        word-break: break-word;
      }

      .reveal-prompt {
        font-size: 1.2rem;
        margin-bottom: 1.5rem;
        opacity: 0.9;
      }

      .btn-reveal {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: 700;
        min-width: 250px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        transition: all 0.3s ease;
      }

      .btn-reveal:hover {
        background: white;
        color: #667eea;
        transform: scale(1.05);
      }

      .reveal-container {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        align-items: center;
        width: 100%;
      }

      .role-card {
        display: flex;
        gap: 0.9rem;
        background: rgba(20, 20, 50, 0.6);
        border: 1px solid rgba(129, 223, 247, 0.2);
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(15px);
        max-width: 850px;
        width: 100%;
      }

      .card-left {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        flex: 0 0 auto;
      }

      .card-left .btn-next {
        width: 100%;
        padding: 0.7rem 1rem !important;
        font-size: 0.85rem !important;
        font-weight: 700 !important;
        margin-top: 0.3rem;
        background: linear-gradient(135deg, #28a745, #20c997) !important;
        border: none !important;
        color: white !important;
        border-radius: 6px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      }

      .card-left .btn-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
      }

      .role-image-box {
        width: 95px;
        height: 125px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .role-image-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .role-name {
        font-size: 1.1rem;
        font-weight: 800;
        color: white;
        text-align: center;
        line-height: 1.2;
      }

      .role-camp {
        font-size: 0.7rem;
        opacity: 0.65;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }

      .card-right {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }

      .player-name-section {
        font-size: 1rem;
        font-weight: 800;
        color: #81dff7;
        margin-bottom: 0.2rem;
        text-align: center;
        padding: 0.4rem 0;
        border-bottom: 2px solid rgba(129, 223, 247, 0.3);
        animation: playerNamePulse 0.8s ease-in-out infinite;
      }

      @keyframes playerNamePulse {
        0%, 100% {
          opacity: 1;
          text-shadow: 0 0 10px rgba(129, 223, 247, 0.3);
        }
        50% {
          opacity: 0.7;
          text-shadow: 0 0 20px rgba(129, 223, 247, 0.6);
        }
      }

      .info-section {
        background: rgba(20, 20, 40, 0.6);
        border-left: 3px solid #81dff7;
        padding: 0.5rem 0.6rem;
        border-radius: 5px;
        flex-shrink: 0;
      }

      .section-label {
        font-size: 0.7rem;
        font-weight: 800;
        color: #81dff7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.2rem;
      }

      .section-text {
        font-size: 0.7rem;
        line-height: 1.3;
        color: #ffffff;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .section-encouragement {
        background: linear-gradient(135deg, rgba(129, 223, 247, 0.2) 0%, rgba(81, 116, 219, 0.1) 100%);
        border: 1px solid rgba(129, 223, 247, 0.3);
        border-radius: 5px;
        padding: 0.5rem;
        font-size: 0.75rem;
        font-weight: 800;
        text-align: center;
        color: #81dff7;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-top: 0.2rem;
      }

      .reveal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .btn-next {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: 700;
        min-width: 250px;
      }

      .end-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        padding: 2rem;
      }

      .end-icon {
        font-size: 5rem;
        margin-bottom: 1.5rem;
      }

      .end-screen h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 1rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      .end-message {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.9;
      }

      .btn-start-game {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: 700;
        min-width: 300px;
      }

      @media (max-width: 768px) {
        .player-name-large {
          font-size: 2rem;
        }

        .role-emoji {
          font-size: 3rem;
        }

        .role-name {
          font-size: 1.5rem;
        }

        .btn-reveal,
        .btn-next {
          min-width: 200px;
          padding: 0.8rem 1.5rem;
          font-size: 1rem;
        }

        .end-screen h1 {
          font-size: 1.8rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose to window for use in game-master-ui.js
window.RevealSequential = RevealSequential;
console.log('[RevealSequential] ✓ Exposed to window');
