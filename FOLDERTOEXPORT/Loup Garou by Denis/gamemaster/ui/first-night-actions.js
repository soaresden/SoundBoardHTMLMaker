/**
 * First Night Actions UI
 *
 * Affiche les rôles qui ont une action la première nuit.
 * Permet aux joueurs de prendre leurs actions.
 *
 * Rôles avec actions la première nuit:
 * - Cupidon (selectPair)
 * - Enfant Sauvage (selectOne)
 * - Voleur (selectOne)
 * - Sorciere (selectOne)
 * - Salvateur (selectOne)
 * - Chien Loup (selectOne)
 */

class FirstNightActionsUI {
  constructor(orchestrator, container) {
    this.orchestrator = orchestrator;
    this.container = container;
    this.actingRoles = []; // Rôles avec actions cette nuit
    this.currentActionIndex = 0;
    this.actions = {}; // {playerId: targets}
  }

  /**
   * Initialise avec la liste des rôles qui ont des actions
   */
  init(actingRoles) {
    this.actingRoles = actingRoles;
    this.currentActionIndex = 0;
    this.actions = {};
    this.render();
  }

  /**
   * Affiche la UI
   */
  render() {
    if (this.currentActionIndex >= this.actingRoles.length) {
      // Toutes les actions sont faites
      this.onActionsComplete();
      return;
    }

    const currentAction = this.actingRoles[this.currentActionIndex];
    this.renderAction(currentAction);
  }

  /**
   * Affiche un rôle et sa formulaire d'action
   */
  renderAction(roleAction) {
    const { player, role, phase } = roleAction;
    const action = phase.action;

    this.container.innerHTML = `
      <div class="first-night-actions">
        <div class="action-card">
          <div class="action-header">
            <h1>${role.emoji} ${role.name}</h1>
            <p class="action-message">${action.message}</p>
          </div>

          <div class="action-body">
            <p class="role-pouvoir">${role.pouvoir}</p>
            <p class="role-tips">💡 ${role.tips}</p>

            <div id="actionForm" class="action-form">
              <!-- Formulaire d'action (dynamique selon le type) -->
            </div>
          </div>

          <div class="action-footer">
            <button id="btnSkip" class="btn-skip">Passer</button>
            <button id="btnSubmit" class="btn-submit" disabled>Confirmer</button>
          </div>
        </div>

        <div class="waiting-roles">
          <h3>🌙 Rôles en attente</h3>
          <div id="waitingList"></div>
        </div>
      </div>

      <style>
        .first-night-actions {
          display: grid;
          grid-template-columns: 1fr 250px;
          gap: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          min-height: 100vh;
        }

        .action-card {
          background: rgba(107, 76, 154, 0.2);
          border: 3px solid #6b4c9a;
          border-radius: 8px;
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .action-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #6b4c9a;
          padding-bottom: 15px;
        }

        .action-header h1 {
          font-size: 32px;
          margin: 0 0 10px 0;
        }

        .action-message {
          font-size: 16px;
          color: #b0b0ff;
          margin: 0;
        }

        .action-body {
          flex: 1;
          margin: 20px 0;
        }

        .role-pouvoir {
          font-size: 14px;
          margin: 0 0 15px 0;
          line-height: 1.5;
        }

        .role-tips {
          font-size: 12px;
          opacity: 0.8;
          margin: 0 0 20px 0;
          padding: 10px;
          background: rgba(102, 217, 153, 0.2);
          border-left: 3px solid #66d999;
          border-radius: 4px;
        }

        .action-form {
          margin: 20px 0;
        }

        .action-footer {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-skip, .btn-submit {
          padding: 12px 24px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .btn-skip {
          background: #555;
          color: #fff;
        }

        .btn-skip:hover {
          background: #777;
        }

        .btn-submit {
          background: #66d999;
          color: #000;
        }

        .btn-submit:hover:not(:disabled) {
          background: #7fff99;
          box-shadow: 0 0 10px rgba(102, 217, 153, 0.5);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .waiting-roles {
          background: rgba(0, 0, 0, 0.2);
          border: 2px solid #6b4c9a;
          border-radius: 8px;
          padding: 15px;
          height: fit-content;
        }

        .waiting-roles h3 {
          margin-top: 0;
          font-size: 14px;
        }

        .waiting-role-item {
          padding: 8px;
          margin: 5px 0;
          background: rgba(107, 76, 154, 0.3);
          border-left: 3px solid #9966ff;
          border-radius: 3px;
          font-size: 12px;
        }

        .waiting-role-item.current {
          background: rgba(255, 255, 0, 0.2);
          border-left-color: #ffff00;
        }

        .waiting-role-item.completed {
          opacity: 0.5;
          background: rgba(102, 217, 153, 0.2);
          border-left-color: #66d999;
        }

        @media (max-width: 768px) {
          .first-night-actions {
            grid-template-columns: 1fr;
          }

          .waiting-roles {
            display: none;
          }
        }
      </style>
    `;

    // Afficher le formulaire d'action selon le type
    this.renderActionForm(action);

    // Afficher la liste des rôles en attente
    this.renderWaitingList();

    // Attacher les événements
    this.attachEventListeners();
  }

  /**
   * Affiche le formulaire d'action selon son type
   */
  renderActionForm(action) {
    const formContainer = document.getElementById('actionForm');

    switch (action.type) {
      case 'selectOne':
        this.renderSelectOneForm(formContainer);
        break;
      case 'selectPair':
        this.renderSelectPairForm(formContainer);
        break;
      case 'selectThree':
        this.renderSelectThreeForm(formContainer);
        break;
      default:
        formContainer.innerHTML = '<p>Type d\'action non implémenté</p>';
    }
  }

  /**
   * Formulaire pour sélectionner 1 joueur
   */
  renderSelectOneForm(container) {
    const alivePlayersHtml = this.orchestrator.state.players
      .filter(p => !p.isDead)
      .map(p => `
        <div class="target-option">
          <input type="radio" id="target_${p.id}" name="target" value="${p.id}">
          <label for="target_${p.id}">${p.name}</label>
        </div>
      `).join('');

    container.innerHTML = `
      <div class="form-targets">
        ${alivePlayersHtml}
      </div>

      <style>
        .form-targets {
          margin: 20px 0;
          max-height: 400px;
          overflow-y: auto;
        }

        .target-option {
          padding: 10px;
          margin: 5px 0;
          background: rgba(107, 76, 154, 0.2);
          border-radius: 4px;
          cursor: pointer;
        }

        .target-option input[type="radio"] {
          margin-right: 10px;
        }

        .target-option label {
          cursor: pointer;
          flex: 1;
        }

        .target-option input[type="radio"]:checked + label {
          font-weight: bold;
          color: #66d999;
        }
      </style>
    `;
  }

  /**
   * TODO: Formulaire pour sélectionner 2 joueurs
   */
  renderSelectPairForm(container) {
    console.warn('⚠️ TODO: renderSelectPairForm');
  }

  /**
   * TODO: Formulaire pour sélectionner 3 joueurs
   */
  renderSelectThreeForm(container) {
    console.warn('⚠️ TODO: renderSelectThreeForm');
  }

  /**
   * Affiche la liste des rôles en attente
   */
  renderWaitingList() {
    const list = document.getElementById('waitingList');
    list.innerHTML = this.actingRoles.map((roleAction, idx) => {
      const { role } = roleAction;
      let status = '';
      if (idx < this.currentActionIndex) {
        status = 'completed';
      } else if (idx === this.currentActionIndex) {
        status = 'current';
      }

      return `
        <div class="waiting-role-item ${status}">
          <span>${role.emoji}</span>
          <span>${role.name}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Attache les événements
   */
  attachEventListeners() {
    const btnSkip = document.getElementById('btnSkip');
    const btnSubmit = document.getElementById('btnSubmit');

    // Mettre à jour le bouton Submit quand on sélectionne
    const inputs = document.querySelectorAll('input[name="target"]');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        btnSubmit.disabled = false;
      });
    });

    btnSkip.addEventListener('click', () => this.skipAction());
    btnSubmit.addEventListener('click', () => this.submitAction());
  }

  /**
   * Passer à l'action suivante
   */
  skipAction() {
    this.currentActionIndex++;
    this.render();
  }

  /**
   * Soumettre l'action
   */
  submitAction() {
    const currentAction = this.actingRoles[this.currentActionIndex];
    const { player, role } = currentAction;

    // Récupérer les cibles sélectionnées
    const selectedInputs = document.querySelectorAll('input[name="target"]:checked');
    const targets = Array.from(selectedInputs).map(input => input.value);

    if (targets.length === 0) {
      alert('⚠️ Sélectionnez au moins une cible');
      return;
    }

    // Enregistrer l'action
    this.orchestrator.recordAction(player.id, 'action', targets);

    // Passer à l'action suivante
    this.currentActionIndex++;
    this.render();
  }

  /**
   * Quand toutes les actions sont faites
   */
  onActionsComplete() {
    console.log('✅ Première nuit - Toutes les actions complétées!');

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.FirstNightActionsUI = FirstNightActionsUI;
}
