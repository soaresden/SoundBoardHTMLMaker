/**
 * 02-TirageMode.js
 *
 * Unified Mode Selection Screen
 * Presents two distinct game paths:
 *
 * Path 1: Mode Aléatoire (Random/Tablet-based)
 *   - Tablet passes between players sequentially
 *   - Each player sees their name + reveal button for their role
 *   - No individual player calls needed for role assignment
 *   - Leads to: FirstNight-MDJ (Animated Game Master Mode)
 *
 * Path 2: Mode Réel (Real/Direct Assignment)
 *   - Game master calls all players for individual assignment
 *   - Each player is assigned directly, including passive roles
 *   - Leads to: Mode Assisté (Assisted Game with explanations)
 *
 * State stored:
 * - gm.state.gameMode = "aleatoire" | "reel"
 * - This determines the entire game flow and UI mode
 */

class TirageMode {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    console.log('[TirageMode] Constructor called');
  }

  /**
   * Initialize the mode selection screen
   */
  init() {
    console.log('[TirageMode] Initializing...');
    this.render();
    this.attachEvents();
  }

  /**
   * Render the mode selection UI
   */
  render() {
    this.container.innerHTML = `
      <div class="phase-container tirage-mode-container">
        <div class="phase-header">
          <h1>🎮 Choisissez votre Mode de Jeu</h1>
          <p>Deux chemins distincts pour votre partie</p>
        </div>

        <div class="tirage-options">
          <!-- Mode Aléatoire Option -->
          <div class="game-mode-option card aleatoire-option" data-mode="aleatoire">
            <div class="option-icon">📱</div>
            <h2>Mode Aléatoire</h2>
            <p class="description">
              La tablette circule entre les joueurs. Chacun voit son nom et peut révéler sa carte.
              Pas d'appel individuel pour l'assignation.
            </p>
            <ul class="option-details">
              <li>✓ Tablette qui circule</li>
              <li>✓ Révélation séquentielle</li>
              <li>✓ Maître du Jeu Animé (MDJ)</li>
            </ul>
            <button class="btn btn-primary select-btn">Choisir</button>
          </div>

          <!-- Mode Réel Option -->
          <div class="game-mode-option card reel-option" data-mode="reel">
            <div class="option-icon">👥</div>
            <h2>Mode Réel</h2>
            <p class="description">
              Appel direct de chaque joueur pour l'assignation des rôles.
              Tous les joueurs (y compris les rôles passifs) sont appelés.
            </p>
            <ul class="option-details">
              <li>✓ Assignation directe</li>
              <li>✓ Contrôle individuel</li>
              <li>✓ Mode Assisté (explications)</li>
            </ul>
            <button class="btn btn-primary select-btn">Choisir</button>
          </div>
        </div>

        <div class="phase-footer">
          <button class="btn btn-secondary back-btn">← Retour</button>
        </div>
      </div>
    `;

    // Add styles if not already present
    this.ensureStyles();
  }

  /**
   * Attach event listeners to buttons
   */
  attachEvents() {
    const container = document.querySelector('.tirage-mode-container');

    // Mode selection
    container.querySelectorAll('.game-mode-option .select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.closest('.game-mode-option').dataset.mode;
        this.selectGameMode(mode);
      });
    });

    // Back button - Return to table setup
    const backBtn = container.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log('[TirageMode] Back button clicked - returning to TableSetup');
        this.gm.changePhase('tableSetup');
      });
    }
  }

  /**
   * Handle game mode selection
   * @param {string} mode - "aleatoire" or "reel"
   */
  selectGameMode(mode) {
    console.log(`[TirageMode] Selected mode: ${mode}`);

    // Store the assignment mode (aleatoire or reel)
    this.gm.state.gameMode = mode;

    if (mode === 'aleatoire') {
      // Mode Aléatoire: tablette-based sequential revelation → MDJ
      // Set flag for MDJ mode
      this.gm.state.mdjMode = true;
      this.gm.state.gameInterface = 'mdj'; // For FirstNight-MDJ to know to use MDJ interface
      console.log('[TirageMode] Mode Aléatoire: Setting MDJ mode, routing to RevealSequential');
      this.gm.changePhase('revealSequential');
    } else if (mode === 'reel') {
      // Mode Réel: direct assignment → Mode Assisté
      this.gm.state.mdjMode = false;
      this.gm.state.gameInterface = 'assiste'; // For future Assisté mode
      console.log('[TirageMode] Mode Réel: Setting Assisté mode, routing to Mode Assisté');
      this.gm.changePhase('modeAssiste');
    }
  }

  /**
   * Ensure CSS styles are loaded
   */
  ensureStyles() {
    const styleId = 'tirage-mode-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tirage-mode-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        overflow: auto;
      }

      .phase-header {
        text-align: center;
        margin-bottom: 0.8rem;
        flex-shrink: 0;
      }

      .phase-header h1 {
        font-size: 2.2rem;
        margin: 0.3rem 0;
        color: #1a1a1a;
        font-weight: 800;
      }

      .phase-header p {
        font-size: 1rem;
        color: #555;
        margin: 0.2rem 0;
      }

      .tirage-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        flex: 1;
        margin-bottom: 0.5rem;
      }

      .game-mode-option {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        border: 3px solid transparent;
        background: white;
      }

      .game-mode-option:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        border-color: #007bff;
      }

      .aleatoire-option:hover {
        border-color: #28a745;
      }

      .reel-option:hover {
        border-color: #ffc107;
      }

      .game-mode-option .option-icon {
        font-size: 3rem;
        margin-bottom: 0.4rem;
        text-align: center;
      }

      .game-mode-option h2 {
        font-size: 1.3rem;
        margin: 0.2rem 0;
        color: #1a1a1a;
        font-weight: 700;
      }

      .game-mode-option .description {
        font-size: 0.85rem;
        color: #666;
        margin: 0.4rem 0;
        flex: 1;
        line-height: 1.4;
      }

      .option-details {
        list-style: none;
        padding: 0;
        margin: 0.4rem 0;
        font-size: 0.8rem;
      }

      .option-details li {
        padding: 0.15rem 0;
        color: #555;
      }

      .game-mode-option .select-btn {
        margin-top: 0.5rem;
        align-self: stretch;
        padding: 0.5rem 0.8rem;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .phase-footer {
        display: flex;
        justify-content: flex-start;
        gap: 0.8rem;
        flex-shrink: 0;
      }

      @media (max-width: 768px) {
        .tirage-options {
          grid-template-columns: 1fr;
        }

        .phase-header h1 {
          font-size: 1.8rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose to window for use in game-master-ui.js
window.TirageMode = TirageMode;
