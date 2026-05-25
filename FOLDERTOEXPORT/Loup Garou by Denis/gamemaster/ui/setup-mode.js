/**
 * Setup Mode UI
 *
 * Écran de configuration:
 * 1. Nombre de joueurs
 * 2. Noms des joueurs
 * 3. Choix du mode (Assignation Aléatoire ou MDJ)
 */

class SetupMode {
  constructor(container) {
    this.container = container;
    this.players = [];
    this.selectedMode = null;
  }

  /**
   * Écran 1: Nombre de joueurs
   */
  renderPlayerCount() {
    this.container.innerHTML = `
      <div class="setup-screen">
        <header class="setup-header">
          <h1>🎮 Loup-Garou</h1>
          <p>Configuration de la partie</p>
        </header>

        <div class="setup-content">
          <h2>Combien de joueurs?</h2>
          <div class="player-count-selector">
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(5)">5</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(6)">6</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(7)">7</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(8)">8</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(9)">9</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(10)">10</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(12)">12</button>
            <button class="count-btn" onclick="window.setupMode.setPlayerCount(15)">15</button>
          </div>

          <div class="custom-count">
            <input type="number" id="customCount" min="3" max="50" placeholder="Ou nombre custom">
            <button onclick="window.setupMode.setPlayerCountCustom()">OK</button>
          </div>
        </div>

        <style>
          .setup-screen {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
          }

          .setup-header {
            padding: 40px 20px;
            text-align: center;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 3px solid #6b4c9a;
          }

          .setup-header h1 {
            margin: 0 0 10px 0;
            font-size: 36px;
          }

          .setup-header p {
            margin: 0;
            opacity: 0.8;
          }

          .setup-content {
            flex: 1;
            padding: 40px 20px;
            max-width: 600px;
            margin: 0 auto;
            width: 100%;
          }

          .setup-content h2 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
          }

          .player-count-selector {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 10px;
            margin-bottom: 30px;
          }

          .count-btn {
            padding: 15px 20px;
            font-size: 16px;
            font-weight: bold;
            background: #6b4c9a;
            color: #fff;
            border: 2px solid #9966ff;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
          }

          .count-btn:hover {
            background: #8b6cb9;
            border-color: #ffff00;
            transform: scale(1.05);
          }

          .custom-count {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }

          #customCount {
            flex: 1;
            padding: 10px;
            font-size: 16px;
            background: rgba(107, 76, 154, 0.2);
            color: #fff;
            border: 2px solid #9966ff;
            border-radius: 4px;
          }

          #customCount::placeholder {
            color: #888;
          }

          .custom-count button {
            padding: 10px 20px;
            font-size: 14px;
            background: #66d999;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }

          .custom-count button:hover {
            background: #7fff99;
          }
        </style>
      </div>
    `;
  }

  /**
   * Définir le nombre de joueurs et passer à l'écran des noms
   */
  setPlayerCount(count) {
    this.players = Array.from({ length: count }, (_, i) => ({
      id: `player_${i}`,
      name: '',
      index: i
    }));
    this.renderPlayerNames();
  }

  /**
   * Nombre custom de joueurs
   */
  setPlayerCountCustom() {
    const input = document.getElementById('customCount');
    const count = parseInt(input.value);
    if (count >= 3 && count <= 50) {
      this.setPlayerCount(count);
    } else {
      alert('Entre 3 et 50 joueurs!');
    }
  }

  /**
   * Écran 2: Noms des joueurs
   */
  renderPlayerNames() {
    const playerInputsHtml = this.players.map((player, idx) => `
      <div class="player-input-group">
        <label>Joueur ${idx + 1}</label>
        <input type="text"
               id="player_${idx}"
               placeholder="Nom du joueur"
               onchange="window.setupMode.updatePlayerName(${idx}, this.value)">
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="setup-screen">
        <header class="setup-header">
          <h1>🎮 Loup-Garou</h1>
          <p>${this.players.length} joueurs</p>
        </header>

        <div class="setup-content">
          <h2>Noms des joueurs</h2>
          <form class="players-form" onsubmit="window.setupMode.nextStep(); return false;">
            ${playerInputsHtml}
          </form>
        </div>

        <footer class="setup-footer">
          <button onclick="window.setupMode.renderPlayerCount()" class="btn-back">← Retour</button>
          <button onclick="window.setupMode.nextStep()" class="btn-next">Suivant →</button>
        </footer>

        <style>
          .players-form {
            display: grid;
            gap: 15px;
            max-height: 500px;
            overflow-y: auto;
            padding: 20px 0;
          }

          .player-input-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .player-input-group label {
            font-size: 12px;
            opacity: 0.8;
            font-weight: bold;
          }

          .player-input-group input {
            padding: 10px;
            font-size: 14px;
            background: rgba(107, 76, 154, 0.2);
            color: #fff;
            border: 2px solid #9966ff;
            border-radius: 4px;
          }

          .player-input-group input::placeholder {
            color: #888;
          }

          .player-input-group input:focus {
            outline: none;
            border-color: #ffff00;
            background: rgba(107, 76, 154, 0.4);
          }

          .setup-footer {
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 3px solid #6b4c9a;
            display: flex;
            gap: 10px;
            justify-content: center;
          }

          .btn-back, .btn-next {
            padding: 10px 20px;
            font-size: 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }

          .btn-back {
            background: #555;
            color: #fff;
          }

          .btn-back:hover {
            background: #777;
          }

          .btn-next {
            background: #66d999;
            color: #000;
          }

          .btn-next:hover {
            background: #7fff99;
            box-shadow: 0 0 10px rgba(102, 217, 153, 0.5);
          }
        </style>
      </div>
    `;

    // Focus sur le premier input
    setTimeout(() => {
      const firstInput = document.getElementById('player_0');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Met à jour le nom d'un joueur
   */
  updatePlayerName(idx, name) {
    this.players[idx].name = name || `Joueur ${idx + 1}`;
  }

  /**
   * Passer à l'écran de choix du mode
   */
  nextStep() {
    // Remplir les noms vides par défaut
    for (let i = 0; i < this.players.length; i++) {
      const input = document.getElementById(`player_${i}`);
      if (input && !input.value) {
        this.players[i].name = `Joueur ${i + 1}`;
      } else if (input) {
        this.players[i].name = input.value;
      }
    }

    this.renderModeChoice();
  }

  /**
   * Écran 3: Choix du mode
   */
  renderModeChoice() {
    this.container.innerHTML = `
      <div class="setup-screen">
        <header class="setup-header">
          <h1>🎮 Loup-Garou</h1>
          <p>${this.players.length} joueurs: ${this.players.map(p => p.name).join(', ')}</p>
        </header>

        <div class="setup-content">
          <h2>Mode de jeu</h2>

          <div class="mode-choices">
            <div class="mode-card" onclick="window.setupMode.selectMode('random')">
              <div class="mode-emoji">🎲</div>
              <h3>Assignation Aléatoire</h3>
              <p>Les rôles sont distribués aléatoirement. La tablette passe de main en main.</p>
              <button class="btn-mode">Choisir</button>
            </div>

            <div class="mode-card" onclick="window.setupMode.selectMode('manual')">
              <div class="mode-emoji">👑</div>
              <h3>Assignation MDJ</h3>
              <p>Le Maître du Jeu assigne manuellement les rôles à chaque joueur.</p>
              <button class="btn-mode">Choisir</button>
            </div>
          </div>
        </div>

        <footer class="setup-footer">
          <button onclick="window.setupMode.renderPlayerNames()" class="btn-back">← Retour</button>
        </footer>

        <style>
          .mode-choices {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }

          .mode-card {
            background: rgba(107, 76, 154, 0.2);
            border: 3px solid #6b4c9a;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
          }

          .mode-card:hover {
            background: rgba(107, 76, 154, 0.4);
            border-color: #ffff00;
            transform: scale(1.05);
          }

          .mode-emoji {
            font-size: 48px;
            margin-bottom: 15px;
          }

          .mode-card h3 {
            font-size: 18px;
            margin: 0 0 10px 0;
          }

          .mode-card p {
            font-size: 14px;
            opacity: 0.8;
            line-height: 1.5;
            margin: 0 0 20px 0;
          }

          .btn-mode {
            padding: 10px 20px;
            font-size: 14px;
            background: #66d999;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }

          .btn-mode:hover {
            background: #7fff99;
            box-shadow: 0 0 10px rgba(102, 217, 153, 0.5);
          }
        </style>
      </div>
    `;
  }

  /**
   * Sélectionner un mode et démarrer
   */
  selectMode(mode) {
    this.selectedMode = mode;

    if (this.onModeSelected) {
      this.onModeSelected(mode, this.players);
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.SetupMode = SetupMode;
}
