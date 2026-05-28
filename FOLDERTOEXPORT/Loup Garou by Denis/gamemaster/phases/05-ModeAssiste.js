/**
 * 05-ModeAssiste.js
 *
 * Mode Assisté Placeholder Screen
 *
 * Mode Réel (Real Game Mode) leads to Mode Assisté, which:
 * - Explains the game mechanics (linked players, deaths, etc.)
 * - Shows predictions of what will happen
 * - Assists the game master with decision-making
 *
 * Currently shows: "En développement" (Under Development)
 * Full implementation will be added later
 */

class ModeAssiste {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    console.log('[ModeAssiste] Constructor called');
  }

  /**
   * Initialize the Mode Assisté screen
   */
  init() {
    console.log('[ModeAssiste] Initializing...');
    this.render();
    this.attachEvents();
  }

  /**
   * Render the "En développement" placeholder screen
   */
  render() {
    this.container.innerHTML = `
      <div class="phase-container mode-assiste-container">
        <div class="dev-screen">
          <div class="dev-icon">🚀</div>
          <h1>Mode Assisté</h1>
          <p class="dev-status">En développement</p>
          <p class="dev-description">
            Ce mode permettra au Maître du Jeu de comprendre exactement ce qui va se passer :
            les morts, les joueurs liés, les actions spéciales, et bien plus.
          </p>
          <div class="dev-features">
            <div class="feature">
              <div class="feature-icon">⚔️</div>
              <h3>Prédictions</h3>
              <p>Visualisez les conséquences de chaque décision</p>
            </div>
            <div class="feature">
              <div class="feature-icon">🔗</div>
              <h3>Liaisons</h3>
              <p>Identifiez les joueurs liés et leurs interactions</p>
            </div>
            <div class="feature">
              <div class="feature-icon">💀</div>
              <h3>Morts & Éliminations</h3>
              <p>Suivez les joueurs éliminés et les causes</p>
            </div>
          </div>
          <button class="btn btn-secondary back-btn">← Retour à la sélection</button>
        </div>
      </div>
    `;

    this.ensureStyles();
  }

  /**
   * Attach event listeners
   */
  attachEvents() {
    const backBtn = this.container.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log('[ModeAssiste] Back button clicked');
        this.gm.changePhase('tirageMode');
      });
    }
  }

  /**
   * Ensure CSS styles are loaded
   */
  ensureStyles() {
    const styleId = 'mode-assiste-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .mode-assiste-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100%;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        overflow: auto;
      }

      .dev-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        padding: 2rem;
        max-width: 600px;
      }

      .dev-icon {
        font-size: 5rem;
        margin-bottom: 1.5rem;
      }

      .dev-screen h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      .dev-status {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 1.5rem;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .dev-description {
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        opacity: 0.95;
      }

      .dev-features {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
        width: 100%;
      }

      .feature {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
      }

      .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .feature h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .feature p {
        font-size: 0.9rem;
        opacity: 0.9;
        line-height: 1.4;
      }

      .back-btn {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        transition: all 0.3s ease;
      }

      .back-btn:hover {
        background: white;
        color: #f5576c;
        transform: translateY(-2px);
      }

      @media (max-width: 768px) {
        .dev-screen {
          padding: 1rem;
        }

        .dev-screen h1 {
          font-size: 2rem;
        }

        .dev-features {
          grid-template-columns: 1fr;
        }

        .feature {
          padding: 1rem;
        }

        .feature-icon {
          font-size: 2rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose to window for use in game-master-ui.js
window.ModeAssiste = ModeAssiste;
console.log('[ModeAssiste] ✓ Exposed to window');
