// ========================================
// GAME MASTER INITIALIZATION
// ========================================

(function() {
  'use strict';

  let gameMaster = null;
  let gameMasterUI = null;
  let isInitialized = false;

  // Roles data est chargé par roles-data.js via <script> dans index.html
  // Pas besoin de loadRolesData() - window.ROLES_DATA est déjà défini

  // Fonction d'initialisation principale
  function initGameMaster() {
    if (isInitialized) return;
    if (typeof LoupsGarousGameMaster === 'undefined') {
      console.warn('[GameMaster] LoupsGarousGameMaster not loaded yet');
      return;
    }
    if (typeof GameMasterUI === 'undefined') {
      console.warn('[GameMaster] GameMasterUI not loaded yet');
      return;
    }

    try {
      // Créer les instances
      gameMaster = new LoupsGarousGameMaster();
      gameMasterUI = new GameMasterUI(gameMaster);

      // Exposer globalement pour la console (debug)
      window.gm = gameMaster;
      window.gameUI = gameMasterUI;
      window.gameMasterUI = gameMasterUI; // For orchestrator

      // Initialiser le système de logging
      if (typeof initializeGameLogger !== 'undefined') {
        initializeGameLogger(gameMaster);
      }

      console.log('[GameMaster] ✓ Initialized successfully');
      isInitialized = true;

      // Attacher le bouton du header
      attachHeaderButton();

      // Afficher l'overlay pour la première fois - VISIBLE PAR DÉFAUT
      gameMasterUI.render();
      console.log('[GameMaster] First render complete');
    } catch (error) {
      console.error('[GameMaster] Initialization error:', error);
    }
  }

  // Attacher le bouton toggle dans le header
  function attachHeaderButton() {
    const btnGameMaster = document.getElementById('btnGameMaster');
    if (!btnGameMaster) {
      console.warn('[GameMaster] Button #btnGameMaster not found');
      return;
    }

    btnGameMaster.addEventListener('click', function() {
      console.log('[GameMaster] btnGameMaster clicked');
      const overlay = document.getElementById('gameMasterOverlay');
      if (!overlay) {
        console.warn('[GameMaster] Overlay not found');
        return;
      }

      console.log('[GameMaster] Overlay display:', overlay.style.display);
      console.log('[GameMaster] Overlay minimized:', overlay.classList.contains('minimized'));

      if (overlay.style.display === 'none') {
        // Montrer l'overlay
        console.log('[GameMaster] Showing overlay');
        gameMasterUI.show();
      } else if (overlay.classList.contains('minimized')) {
        // Si minimisé, le restaurer
        console.log('[GameMaster] Restoring from minimized');
        gameMasterUI.toggleMinimized();
      } else {
        // Sinon, le réduire
        console.log('[GameMaster] Minimizing');
        gameMasterUI.toggleMinimized();
      }

      // Toujours afficher le contenu à jour
      console.log('[GameMaster] Calling render');
      gameMasterUI.render();
    });

    console.log('[GameMaster] ✓ Header button attached');
  }

  // Essayer d'initialiser au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initGameMaster();
    });
  } else {
    // DOM déjà chargé
    initGameMaster();
  }

  // Retry mechanism pour les dépendances chargées en retard
  let retryCount = 0;
  const maxRetries = 5;
  const retryInterval = setInterval(function() {
    retryCount++;
    if (isInitialized) {
      clearInterval(retryInterval);
      return;
    }
    if (retryCount >= maxRetries) {
      console.warn('[GameMaster] Initialization failed after maximum retries');
      clearInterval(retryInterval);
      return;
    }
    if (!isInitialized) {
      console.log(`[GameMaster] Retry ${retryCount}...`);
      initGameMaster();
    }
  }, 500);

  // Exposer globalement pour debugging
  window.gameMasterDebug = {
    getInstance: function() {
      return gameMaster;
    },
    getUI: function() {
      return gameMasterUI;
    },
    getState: function() {
      return gameMaster ? gameMaster.state : null;
    },
    getRoles: function() {
      return gameMaster ? gameMaster.roles : null;
    },
    showDebug: function() {
      if (gameMaster) {
        gameMaster.showDebug();
      } else {
        console.log('❌ Game Master not initialized yet');
      }
    },
    reload: function() {
      if (gameMasterUI) {
        gameMasterUI.render();
        console.log('[GameMaster] Reloaded UI');
      }
    },
    reset: function() {
      if (gameMaster) {
        gameMaster.resetState();
        console.log('[GameMaster] State reset');
        if (gameMasterUI) gameMasterUI.render();
      }
    },
  };

  // Fonction globale pour appeler showDebug() facilement depuis la console
  window.showDebug = function() {
    window.gameMasterDebug.showDebug();
  };

  // Fonction debug pour afficher TOUS les paramètres de la partie
  window.debugGame = function() {
    const gm = window.gameMasterDebug?.gameMaster;
    if (!gm) {
      console.log('❌ GameMaster non disponible');
      return;
    }

    const state = gm.state || {};

    console.group('🎮 DEBUG PARTIE COMPLÈTE');

    console.group('📊 Paramètres Généraux');
    console.log('Mode:', state.mode);
    console.log('Nuit Phase:', state.nightPhase);
    console.log('Tour actuel:', state.currentTurn);
    console.log('Table type:', state.tableType);
    console.log('Rôle courant index:', state.currentRoleIdx);
    console.log('Étape nuit:', state.nightStep);
    console.groupEnd();

    console.group('👥 Joueurs');
    if (state.players) {
      state.players.forEach((p, i) => {
        const roleInfo = p.roleId ? ` → ${p.roleId}` : ' (sans rôle)';
        const status = p.statusData ? ` | Statuts: ${Object.keys(p.statusData).join(', ')}` : '';
        console.log(`  ${i + 1}. ${p.name}${roleInfo}${status}`);
      });
    }
    console.groupEnd();

    console.group('🎭 Rôles Sélectionnés');
    if (state.selectedRoles) {
      Object.entries(state.selectedRoles).forEach(([role, count]) => {
        if (count > 0) console.log(`  ${role}: ${count}`);
      });
    }
    console.groupEnd();

    console.group('🔮 Actions Spéciales');
    console.log('Cupidon selection:', state.cupidoSelection);
    console.log('Enfant Sauvage idol:', state.enfantSauvageIdol?.playerId);
    console.log('Chien Loup choice:', state.chienLoupChoice);
    console.log('Salvateur target:', state.SalvateurTarget);
    console.log('Salvateur saved this night:', state.salvateurSavedThisNight);
    console.log('Salvateur history:', state.salvateurHistory);
    console.log('Voyante look:', state.voyanteLook);
    console.log('Renard sniff:', state.renardSniff);
    console.log('Sorcière potions:', state.sorcierePotions);
    console.log('Wolves victim:', state.wolvesVictim);
    console.groupEnd();

    console.group('📜 Logs Récents');
    if (gm.logs && gm.logs.length > 0) {
      const recent = gm.logs.slice(-10);
      recent.forEach((log, i) => {
        console.log(`  ${i + 1}. [${log.type}] ${log.text}`);
      });
    }
    console.groupEnd();

    console.log('Full state:', state);
    console.groupEnd();
  };

  console.log('[GameMaster] ✓ Script loaded. Use showDebug() for quick debug or debugGame() for full game state.');
})();
