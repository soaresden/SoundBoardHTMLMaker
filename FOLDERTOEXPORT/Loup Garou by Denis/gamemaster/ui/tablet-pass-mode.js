/**
 * Tablet Pass Mode UI - TODO
 *
 * Mode où la tablette passe de main en main pour l'assignation des rôles.
 *
 * FLOW:
 * 1. Setup: Configuration du jeu
 * 2. Distribution: Chaque joueur voir son rôle en passant la tablette
 * 3. Confirmation: Tous les joueurs ont vu leur rôle
 * 4. FirstNightActions: Passer à la première nuit
 */

class TabletPassMode {
  constructor(orchestrator, container) {
    this.orchestrator = orchestrator;
    this.container = container;
    this.currentPlayerIndex = 0;
    this.revealedRoles = new Set(); // IDs des joueurs qui ont vu leur rôle
  }

  /**
   * Initialise le mode tablette passante
   */
  init() {
    // Distribuer les rôles aléatoirement
    this.assignRandomRoles();
    this.renderDistribution();
  }

  /**
   * TODO: Écran de setup
   * - Nombre de joueurs
   * - Sélection des rôles à distribuer
   * - Start button
   */
  renderSetup() {
    console.warn('⚠️ TODO: TabletPassMode.renderSetup()');
  }

  /**
   * Écran principal de distribution
   */
  renderDistribution() {
    if (this.currentPlayerIndex >= this.orchestrator.state.players.length) {
      this.onAllRevealed();
      return;
    }

    const currentPlayer = this.orchestrator.state.players[this.currentPlayerIndex];
    const isRevealed = this.revealedRoles.has(currentPlayer.id);

    if (!isRevealed) {
      return this.renderWaitingScreen();
    } else {
      return this.renderRevealedScreen();
    }
  }

  /**
   * Écran "Passe la tablette à..."
   */
  renderWaitingScreen() {
    const currentPlayer = this.orchestrator.state.players[this.currentPlayerIndex];

    this.container.innerHTML = `
      <div class="tablet-waiting">
        <div class="waiting-content">
          <h1>📱 Passe la tablette</h1>
          <h2>${currentPlayer.name}</h2>
          <p>Passe la tablette à ${currentPlayer.name}</p>

          <button class="btn-reveal" onclick="window.tabletPassMode.revealCard()">
            👁️ Clique ici pour voir ta carte
          </button>

          <p class="warning">⚠️ Masque l'écran après avoir vu ta carte!</p>
        </div>

        <style>
          .tablet-waiting {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
          }

          .waiting-content {
            text-align: center;
            max-width: 500px;
            padding: 40px;
          }

          .waiting-content h1 {
            font-size: 36px;
            margin-bottom: 20px;
          }

          .waiting-content h2 {
            font-size: 48px;
            color: #ffff00;
            margin: 30px 0;
          }

          .waiting-content p {
            font-size: 18px;
            margin: 20px 0;
            opacity: 0.9;
          }

          .btn-reveal {
            padding: 20px 40px;
            font-size: 20px;
            background: #66d999;
            color: #000;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin: 40px 0;
            transition: all 0.3s;
            display: inline-block;
          }

          .btn-reveal:hover {
            background: #7fff99;
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(102, 217, 153, 0.7);
          }

          .warning {
            font-size: 14px;
            opacity: 0.7;
            margin-top: 30px;
          }
        </style>
      </div>
    `;
  }

  /**
   * Écran de révélation du rôle
   */
  renderRevealedScreen() {
    const currentPlayer = this.orchestrator.state.players[this.currentPlayerIndex];
    const role = this.orchestrator.state.rolesData[currentPlayer.roleId];

    if (!role) {
      this.nextPlayer();
      return;
    }

    const nextPlayerName = this.currentPlayerIndex + 1 < this.orchestrator.state.players.length
      ? this.orchestrator.state.players[this.currentPlayerIndex + 1].name
      : '(Dernier)';

    this.container.innerHTML = `
      <div class="tablet-revealed">
        <div class="role-card">
          <div class="role-header">
            <div class="role-emoji">${role.emoji}</div>
            <h1>${role.name}</h1>
            <p class="camp">${role.camp}</p>
          </div>

          <div class="role-body">
            <p class="pouvoir"><strong>Pouvoir:</strong> ${role.pouvoir}</p>
            <p class="instruction"><strong>Instruction:</strong> ${role.instruction}</p>
            <p class="tips"><strong>Tips:</strong> ${role.tips}</p>
          </div>

          <div class="role-footer">
            <button class="btn-next" onclick="window.tabletPassMode.nextPlayer()">
              Suivant: ${nextPlayerName} →
            </button>
          </div>
        </div>

        <style>
          .tablet-revealed {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 20px;
          }

          .role-card {
            background: rgba(107, 76, 154, 0.3);
            border: 4px solid #6b4c9a;
            border-radius: 12px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
          }

          .role-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #6b4c9a;
            padding-bottom: 20px;
          }

          .role-emoji {
            font-size: 72px;
            margin-bottom: 15px;
          }

          .role-header h1 {
            font-size: 36px;
            margin: 0 0 10px 0;
          }

          .camp {
            font-size: 14px;
            opacity: 0.8;
            margin: 0;
          }

          .role-body {
            margin: 30px 0;
            font-size: 14px;
            line-height: 1.6;
          }

          .role-body p {
            margin: 15px 0;
          }

          .role-body strong {
            color: #ffff00;
          }

          .role-footer {
            text-align: center;
            margin-top: 30px;
          }

          .btn-next {
            padding: 15px 30px;
            font-size: 16px;
            background: #66d999;
            color: #000;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }

          .btn-next:hover {
            background: #7fff99;
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(102, 217, 153, 0.7);
          }
        </style>
      </div>
    `;
  }

  /**
   * TODO: Quand le joueur clique "Voir ta carte"
   */
  revealCard() {
    console.warn('⚠️ TODO: TabletPassMode.revealCard()');
    const currentPlayer = this.orchestrator.state.players[this.currentPlayerIndex];
    this.revealedRoles.add(currentPlayer.id);
    // Attribuer un rôle aléatoire au joueur
    // Rafraîchir l'affichage
  }

  /**
   * TODO: Passer au joueur suivant
   */
  nextPlayer() {
    console.warn('⚠️ TODO: TabletPassMode.nextPlayer()');
    if (this.currentPlayerIndex < this.orchestrator.state.players.length - 1) {
      this.currentPlayerIndex++;
      this.render();
    } else {
      // Tous les joueurs ont vu leur rôle
      this.onAllRevealed();
    }
  }

  /**
   * TODO: Retourner au joueur précédent
   */
  previousPlayer() {
    console.warn('⚠️ TODO: TabletPassMode.previousPlayer()');
    if (this.currentPlayerIndex > 0) {
      this.currentPlayerIndex--;
      this.render();
    }
  }

  /**
   * TODO: Quand tous les joueurs ont vu leur rôle
   * Passer à FirstNightActions
   */
  onAllRevealed() {
    console.warn('⚠️ TODO: TabletPassMode.onAllRevealed()');
    console.log('✅ Tous les joueurs ont vu leur rôle!');

    // Distribuer les rôles aléatoirement
    this.assignRandomRoles();

    // Passer à la première nuit
    const actingRoles = this.orchestrator.startFirstNightActions();

    if (this.onStartCallback) {
      this.onStartCallback(actingRoles);
    }
  }

  /**
   * Distribuer les rôles aléatoirement (Fisher-Yates shuffle)
   */
  assignRandomRoles() {
    const rolesArray = Object.keys(this.orchestrator.state.rolesData);

    // Fisher-Yates shuffle
    for (let i = rolesArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesArray[i], rolesArray[j]] = [rolesArray[j], rolesArray[i]];
    }

    // Assigner aux joueurs
    for (let i = 0; i < this.orchestrator.state.players.length; i++) {
      const roleId = rolesArray[i % rolesArray.length];
      this.orchestrator.assignRoleToPlayer(this.orchestrator.state.players[i].id, roleId);
    }

    console.log('✅ Rôles distribués aléatoirement');
  }

  render() {
    this.renderDistribution();
  }
}

// Export
if (typeof window !== 'undefined') {
  window.TabletPassMode = TabletPassMode;
}
