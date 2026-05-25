// ========================================
// 02-CARD SELECTION
// Écran de sélection des rôles pour le deck
// ========================================

// Liste des noms de joueurs pour génération aléatoire
const PLAYER_NAMES_SELECTION = [
  'Denis', 'Cedric', 'Pauline', 'Benoit', 'Risleine',
  'Marine', 'Marion', 'Emmanuel', 'Katy', 'Loris',
  'Thibaut', 'Pierre', 'Anne', 'Sophie', 'Anthony',
  'Leo', 'Nicolas', 'Raphael', 'Thomas', 'Li'
];

// Fonction pour mélanger un array
function shuffleArrayCardSelection(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fonction pour obtenir N noms aléatoires et uniques
function getRandomPlayerNamesCardSelection(count) {
  const shuffled = shuffleArrayCardSelection(PLAYER_NAMES_SELECTION);
  return shuffled.slice(0, Math.min(count, PLAYER_NAMES_SELECTION.length));
}

// Overlay de chargement des rôles
function createLoadingOverlayCardSelection(roleCount) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: Arial, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      text-align: center;
      background: linear-gradient(135deg, rgba(25, 25, 45, 0.95), rgba(50, 50, 80, 0.95));
      border: 2px solid rgba(199, 125, 255, 0.4);
      border-radius: 12px;
      padding: 40px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="font-size: 32px; margin-bottom: 16px; animation: spin 1s linear infinite;">🎴</div>
      <h2 style="color: #c77dff; margin: 0 0 12px 0; font-size: 18px;">Lecture du deck...</h2>
      <p style="color: #e8e8f0; margin: 0 0 20px 0; font-size: 14px;">
        Chargement de <strong>${roleCount}</strong> rôles depuis le deck 📚
      </p>
      <div style="
        width: 100%;
        height: 6px;
        background: rgba(100, 100, 150, 0.3);
        border-radius: 3px;
        overflow: hidden;
      ">
        <div style="
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #5174db, #c77dff, #5174db);
          background-size: 200% 100%;
          animation: loadingBar 2s ease-in-out infinite;
        "></div>
      </div>
      <div style="color: #999; font-size: 12px; margin-top: 12px;">
        Veuillez patienter...
      </div>
    </div>

    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes loadingBar {
        0% { background-position: 0% center; }
        50% { background-position: 100% center; }
        100% { background-position: 0% center; }
      }
    </style>
  `;

  return overlay;
}

function renderCardSelection(gameUI) {
  const gm = gameUI.gm;
  const allRoles = Object.keys(gm.roles);


  // Nettoyer selectedRoles
  let selectedRoles = gm.state.selectedRoles || {};
  const cleanedRoles = {};
  for (const key in selectedRoles) {
    if (!isNaN(key)) continue;
    cleanedRoles[key] = selectedRoles[key];
  }
  selectedRoles = cleanedRoles;
  gm.state.selectedRoles = selectedRoles;

  // Fonction pour obtenir l'emoji d'un rôle depuis les JSONs (pas de hardcodage!)
  const getRoleEmoji = (roleId) => window.getVisualEmoji?.(roleId) || '❓';

  // Rôles favoris
  const favoriteRoles = new Set([
    'Simple_Loup_Garou', 'Sorcière', 'Salvateur', 'Petite_Fille',
    'Chasseur', 'Cupidon', 'Enfant_Sauvage', 'Chevalier_Epee_Rouille',
    'Montreur_Ours', 'Renard', 'Chien_Loup', 'Corbeau',
    'Loup_Garou_Blanc', 'Voyante', 'Grand_Mechant_Loup'
  ]);

  // Extensions avec ordre
  const extensionOrder = {
    'base': { name: '🎮 Jeu de Base', order: 1 },
    'extension': { name: '✨ Extension Classique', order: 2 }
  };

  // Créer liste de rôles avec métadonnées
  const rolesList = allRoles.map(roleId => {
    const role = gm.roles[roleId];
    const origin = role?.origin || 'base';
    const isFavorite = favoriteRoles.has(roleId);
    const count = selectedRoles[roleId] || 0;

    // Accéder directement à window.ROLES_DATA pour les descriptions/pouvoir à jour
    let description = '';
    if (window.ROLES_DATA && window.ROLES_DATA.roles && window.ROLES_DATA.roles[roleId]) {
      const roleData = window.ROLES_DATA.roles[roleId];
      // Utiliser "pouvoir" en priorité, puis "description"
      description = roleData.pouvoir || roleData.description || '';
    } else if (role?.pouvoir) {
      description = role.pouvoir;
    } else if (role?.description) {
      description = role.description;
    }

    return {
      id: roleId,
      name: roleId.replace(/_/g, ' '),
      description: description,
      emoji: getRoleEmoji(roleId),
      origin: origin,
      isFavorite: isFavorite,
      count: count,
      sortOrder: isFavorite ? 0 : extensionOrder[origin]?.order || 999
    };
  });

  // Trier: Favoris d'abord, puis par extension, puis par nom
  rolesList.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  // Compter
  const totalCards = Object.values(selectedRoles).reduce((a, b) => a + b, 0);
  const totalRoles = allRoles.length;
  const favoriteCount = favoriteRoles.size;

  // Générer le deck visuel (cartes actuellement sélectionnées)
  const deckVisual = Object.entries(selectedRoles)
    .flatMap(([roleId, count]) => {
      const role = rolesList.find(r => r.id === roleId);
      return Array(count).fill(0).map((_, idx) => {
        const cardFile = gameUI.getCardFile(roleId);
        const emojiStr = role?.emoji || '❓';
        return `
          <div class="gm-deck-visual" data-role-id="${roleId}" data-emoji="${emojiStr}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; width:32px; height:42px;">
            <img src="${cardFile}" alt="${roleId}" class="gm-deck-img" data-role-id="${roleId}" style="width:100%; height:100%; object-fit:cover; border-radius:2px; position:absolute;" onload="this.nextElementSibling.style.display='none'" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <span class="gm-deck-emoji" style="font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; width:100%; height:100%; position:absolute;">${emojiStr}</span>
          </div>
        `;
      });
    })
    .join('');

  // Générer tableau
  let tableRows = '';
  let currentSection = null;

  rolesList.forEach(role => {
    let sectionLabel = null;

    if (role.isFavorite && currentSection !== 'favorites') {
      currentSection = 'favorites';
      sectionLabel = `⭐ FAVORIS (${favoriteCount} rôles)`;
      tableRows += `<tr style="background:rgba(255,215,0,0.15);"><td colspan="5" style="padding:4px 8px; font-size:9px; font-weight:bold; color:#FFD700; border-bottom:2px solid rgba(255,215,0,0.3);">${sectionLabel}</td></tr>`;
    } else if (!role.isFavorite && currentSection !== role.origin) {
      currentSection = role.origin;
      const extName = extensionOrder[role.origin]?.name || role.origin;
      sectionLabel = extName;
      tableRows += `<tr style="background:rgba(129,223,247,0.15);"><td colspan="5" style="padding:4px 8px; font-size:9px; font-weight:bold; color:#81dff7; border-bottom:2px solid rgba(129,223,247,0.3);">${sectionLabel}</td></tr>`;
    }

    // Ligne du rôle - clickable
    const cardFile = gameUI.getCardFile(role.id);
    const visualCell = `
      <div style="width:40px; height:50px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(81,116,219,0.15), rgba(199,125,255,0.1)); border:1px solid rgba(199,125,255,0.3); border-radius:3px; overflow:hidden; position:relative;">
        <img class="gm-role-img" src="${cardFile}" alt="${role.id}" data-emoji="${role.emoji}" style="width:100%; height:100%; object-fit:cover; border-radius:2px; position:absolute;" onload="this.parentElement.querySelector('.gm-role-emoji').style.display='none'" onerror="this.style.display='none'; this.parentElement.querySelector('.gm-role-emoji').style.display='flex'">
        <span class="gm-role-emoji" style="position:absolute; inset:0; font-size:20px; text-align:center; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${role.emoji}</span>
      </div>
    `;

    tableRows += `
      <tr class="gm-table-role" data-role-id="${role.id}" style="cursor:pointer; border-bottom:1px solid rgba(199,125,255,0.1); transition:all 0.2s; ${role.count > 0 ? 'background:rgba(81,116,219,0.1);' : ''} hover {background:rgba(81,116,219,0.15);}">
        <td style="padding:4px 8px; font-size:9px; color:#c1a8ff; width:15%;">${role.isFavorite ? '⭐' : (role.origin === 'base' ? '🎮' : '✨')}</td>
        <td style="padding:4px 6px; text-align:center; width:50px;">
          ${visualCell}
        </td>
        <td style="padding:4px 8px; color:#e8e8f0; font-weight:500; width:25%; font-size:9px;">${role.name}</td>
        <td style="padding:4px 8px; color:#999; font-size:8px; flex:1; line-height:1.3; white-space: normal; word-wrap: break-word;">${role.description}</td>
        <td style="padding:4px 8px; text-align:center; min-width:35px;">
          ${role.count > 0 ? `<div style="background:linear-gradient(135deg, #5174db, #c77dff); color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px;">${role.count}</div>` : ''}
        </td>
      </tr>
    `;
  });

  const rolesGrid = `
    <div style="width:100%; height:100%; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column;">
      <table style="width:100%; border-collapse:collapse; font-size:9px; flex-shrink:0;">
        <thead style="background:linear-gradient(135deg, rgba(81,116,219,0.4), rgba(199,125,255,0.3)); border-bottom:2px solid rgba(199,125,255,0.4); position:sticky; top:0; z-index:10;">
          <tr style="pointer-events:none;">
            <th style="padding:6px 8px; text-align:left; color:#81dff7; font-weight:700; width:20px;">Ext</th>
            <th style="padding:6px 6px; text-align:center; color:#81dff7; font-weight:700; width:50px;">Visuel</th>
            <th style="padding:6px 8px; text-align:left; color:#81dff7; font-weight:700; width:25%;">Titre</th>
            <th style="padding:6px 8px; text-align:left; color:#81dff7; font-weight:700; flex:1;">Description du Pouvoir</th>
            <th style="padding:6px 8px; text-align:center; color:#81dff7; font-weight:700; width:35px;">Qty</th>
          </tr>
        </thead>
        <tbody style="">
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  return `
    <div class="gm-screen gm-choose-card" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:12px 16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:16px; color:#e8e8f0;">
         Sélectionner les Rôles
      </h2>
      <div style="flex:1; display:flex; flex-direction:column; padding:4px; overflow:hidden; box-sizing:border-box;">
        <!-- Tableau des rôles -->
        <div style="flex:1; display:flex; flex-direction:column; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:4px; padding:2px; box-sizing:border-box; overflow:hidden;">
          ${rolesGrid}
        </div>
        <!-- DECK EN BAS -->
        <div style="background:linear-gradient(135deg, rgba(199,125,255,0.08), rgba(81,116,219,0.08)); border:1px solid rgba(199,125,255,0.3); border-radius:8px; margin-top:6px; padding:0; display:flex; flex-direction:column; height:70px; box-shadow:inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(199,125,255,0.1);">
          <div style="font-size:9px; color:#81dff7; padding:6px 8px; margin:0; font-weight:600; text-shadow:0 1px 2px rgba(0,0,0,0.4);">Deck <span style="color:#999;">(${totalCards})</span></div>
          <div id="gmDeckCardsVisual" style="display:flex; flex-wrap:nowrap; gap:4px; overflow-x:auto; overflow-y:hidden; flex:1; padding:4px 8px; align-items:center;">
            ${deckVisual || '<div style="color:#666; font-size:8px; padding:0 10px; white-space:nowrap; margin:auto;">Sélectionnez les cartes →</div>'}
          </div>
        </div>
      </div>
      <div style="padding:8px 12px; display:flex; gap:12px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(199,125,255,0.2);">
        <div style="flex:1; font-size:8px; color:#c1a8ff; padding:4px 0;">
          📊 <strong>${totalCards}</strong> cartes / <strong>${totalRoles}</strong> rôles | ⭐ <strong>${favoriteCount}</strong> favoris
        </div>
        <button id="gmBtnQuickSetup" style="background:rgba(255,165,0,0.2); border:1px solid rgba(255,165,0,0.4); padding:8px 12px; border-radius:4px; color:#ffb366; font-weight:600; cursor:pointer; font-size:10px;">
           ⚡ Setup Rapide
        </button>
        <button id="gmBtnNextRoles" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px 14px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:10px;">
           Suivant →
        </button>
      </div>
    </div>
  `;
}

function attachCardSelectionEvents(gameUI) {
  // Gérer les fallbacks emoji pour les images dans le TABLEAU
  document.querySelectorAll('.gm-role-img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const emoji = img.parentElement.querySelector('.gm-role-emoji');
      if (emoji) emoji.style.display = 'flex';
    });
  });

  // Gérer les fallbacks emoji pour les images du DECK
  document.querySelectorAll('.gm-deck-img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const emojiSpan = img.parentElement.querySelector('.gm-deck-emoji');
      if (emojiSpan) emojiSpan.style.display = 'flex';
    });
  });

  // Cliquer sur une ligne du tableau pour AJOUTER
  document.querySelectorAll('.gm-table-role').forEach(row => {
    row.addEventListener('click', () => {
      const roleId = row.dataset.roleId;

      // Sauvegarder la position du scroll
      const rolesGrid = document.querySelector('.gm-roles-container') || document.querySelector('[style*="overflow-y:auto"]');
      const scrollPos = rolesGrid ? rolesGrid.scrollTop : 0;

      if (!gameUI.gm.state.selectedRoles) gameUI.gm.state.selectedRoles = {};
      gameUI.gm.state.selectedRoles[roleId] = (gameUI.gm.state.selectedRoles[roleId] || 0) + 1;
      gameUI.gm.saveState();

      gameUI.render();

      // Restaurer la position du scroll après le re-render
      setTimeout(() => {
        const rolesGridAfter = document.querySelector('.gm-roles-container') || document.querySelector('[style*="overflow-y:auto"]');
        if (rolesGridAfter) {
          rolesGridAfter.scrollTop = scrollPos;
        }
      }, 0);
    });
  });

  // Cliquer sur une carte du deck pour RETIRER
  document.querySelectorAll('.gm-deck-visual').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const roleId = card.dataset.roleId;

      // Sauvegarder la position du scroll
      const rolesGrid = document.querySelector('.gm-roles-container') || document.querySelector('[style*="overflow-y:auto"]');
      const scrollPos = rolesGrid ? rolesGrid.scrollTop : 0;

      if (gameUI.gm.state.selectedRoles && gameUI.gm.state.selectedRoles[roleId]) {
        gameUI.gm.state.selectedRoles[roleId]--;
        if (gameUI.gm.state.selectedRoles[roleId] <= 0) {
          delete gameUI.gm.state.selectedRoles[roleId];
        }
        gameUI.gm.saveState();

        gameUI.render();

        // Restaurer la position du scroll après le re-render
        setTimeout(() => {
          const rolesGridAfter = document.querySelector('.gm-roles-container') || document.querySelector('[style*="overflow-y:auto"]');
          if (rolesGridAfter) {
            rolesGridAfter.scrollTop = scrollPos;
          }
        }, 0);
      }
    });
  });

  // Bouton Setup Rapide
  document.getElementById('gmBtnQuickSetup')?.addEventListener('click', () => {
    const quickSetup = {
      'Chasseur': 1,
      'Chevalier_Epee_Rouille': 1,
      'Chien_Loup': 1,
      'Corbeau': 1,
      'Enfant_Sauvage': 1,
      'Cupidon': 1,
      'Grand_Mechant_Loup': 1,
      'Loup_Garou_Blanc': 1,
      'Montreur_Ours': 1,
      'Renard': 1,
      'Salvateur': 1,
      'Simple_Loup_Garou': 2,
      'Sorcière': 1,
      'Voyante': 1,
      'Villageois': 1
    };

    gameUI.gm.state.selectedRoles = quickSetup;
    gameUI.gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnNextRoles')?.addEventListener('click', async () => {
    const selectedRoles = gameUI.gm.state.selectedRoles || {};
    const playerCount = Object.values(selectedRoles).reduce((a,b) => a+b, 0);

    if (playerCount === 0) {
      alert('Sélectionnez au moins une carte!');
      return;
    }

    if (playerCount < 4) {
      alert('Minimum 4 joueurs pour jouer!');
      return;
    }

    const wolvesRoles = [
      'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant',
      'Infect_Pere_Loups', 'Louveteau', 'Abominable_Sectaire', 'Cultiste'
    ];
    const hasWolves = wolvesRoles.some(role => selectedRoles[role] && selectedRoles[role] > 0);
    if (!hasWolves) {
      alert('Il faut au moins 1 Loup Garou pour jouer!');
      return;
    }

    // Charger UNIQUEMENT les rôles sélectionnés depuis les fichiers JSON
    const selectedRoleIds = Object.keys(selectedRoles);

    // Créer et afficher l'overlay de chargement
    const loadingOverlay = createLoadingOverlayCardSelection(selectedRoleIds.length);
    document.body.appendChild(loadingOverlay);

    try {
      if (window.loadSelectedRolesFromJSON) {
        await window.loadSelectedRolesFromJSON(selectedRoleIds);
        // Reconstruire les données de rôles après chargement du JSON
        if (window.rebuildRoleDataFromJSON) {
          window.rebuildRoleDataFromJSON();
        }
      }
    } finally {
      // Enlever l'overlay de chargement
      loadingOverlay.remove();
    }

    const playerNames = getRandomPlayerNamesCardSelection(playerCount);
    gameUI.gm.state.players = [];
    for (let i = 0; i < playerCount; i++) {
      gameUI.gm.state.players.push({ id: `p${i}`, name: playerNames[i] || `J${i+1}`, tableX: null, tableY: null, roleId: null });
    }
    gameUI.gm.state.mode = 'tableSetup';
    gameUI.gm.state.tableType = 'circle';
    gameUI.gm.saveState();
    gameUI.render();
  });
}
