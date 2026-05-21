// ========================================
// ÉCRAN 1: SÉLECTIONNER LES RÔLES
// ========================================

// Liste des noms de joueurs pour génération aléatoire
const PLAYER_NAMES = [
  'Denis', 'Cedric', 'Pauline', 'Benoit', 'Risleine',
  'Marine', 'Marion', 'Emmanuel', 'Katy', 'Loris',
  'Thibaut', 'Pierre', 'Anne', 'Sophie', 'Anthony',
  'Leo', 'Nicolas', 'Raphael', 'Thomas', 'Li'
];

// Fonction pour mélanger un array
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fonction pour obtenir N noms aléatoires et uniques
function getRandomPlayerNames(count) {
  const shuffled = shuffleArray(PLAYER_NAMES);
  return shuffled.slice(0, Math.min(count, PLAYER_NAMES.length));
}

function renderChooseCard(gameUI) {
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

  // Emojis pour tous les rôles
  const roleEmojis = {
    'Villageois_Villageois': '👨', 'Simple_Loup_Garou': '🐺', 'Sorcière': '🧙‍♀️', 'Voyante': '🔮',
    'Cupidon': '💘', 'Ancien': '👴', 'Petite_Fille': '👧', 'Chasseur': '🏹', 'Voleur': '🏴‍☠️',
    'Idiot_Village': '🤡', 'Bouc_Emissaire': '🐐', 'Salvateur': '💪', 'Joueur_Flute': '🪕', 'Corbeau': '🐦',
    'Renard': '🦊', 'Enfant_Sauvage': '🧒', 'Deux_Soeurs': '👭', 'Trois_Freres': '👬', 'Pyromane': '🔥',
    'Capitaine': '⚓', 'Loup_Garou_Blanc': '🐺⚪', 'Chien_Loup': '🐕‍🦺', 'Montreur_Ours': '🐻', 'Noctambule': '🌙',
    'Servante_Devouee': '👩‍🍳', 'Grand_Mechant_Loup': '🐺👑', 'Ankou': '💀',
    'Gitane': '🔮', 'Comédien': '🎭', 'Infect_Pere_Loups': '🐺💉', 'Juge_Begue': '⚖️',
    'Chevalier_Epee_Rouille': '⚔️', 'Abominable_Sectaire': '👿', 'Ange': '👼', 'Ange_Dechu': '😈',
    'Necromancien': '💀✨', 'Marionnettiste': '🎪', 'Lapin_Blanc': '🐰', 'Loup_Garou_Voyant': '🐺🔮',
    'Chaman': '🪶', 'Pretre': '⛪', 'Garde_Du_Corps': '🛡️', 'Porteur_Amulette': '📿', 'Tireur': '🎯',
    'Fille_Joie': '💃', 'Mamie_Grincheuse': '👵', 'Lepreux': '🦴', 'Savant_Fou': '🤓', 'Gros_Dur': '💪',
    'Louveteau': '🐺🐶', 'Humain_Maudit': '👻', 'Tueur_Serie': '🔪', 'Cultiste': '🙏', 'Mystique': '✨',
    'President': '🎩', 'Arnacoeur': '🎭', 'Fils_Lune': '🌙'
  };

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

    return {
      id: roleId,
      name: roleId.replace(/_/g, ' '),
      description: role?.description || '',
      emoji: roleEmojis[roleId] || '❓',
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
          <div class="gm-deck-visual" data-role-id="${roleId}" data-emoji="${emojiStr}">
            <img src="cards/${cardFile}.webp" alt="${roleId}" class="gm-deck-img" data-role-id="${roleId}">
            <span class="gm-deck-emoji" style="display:none; font-size:14px; line-height:1;">${emojiStr}</span>
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
        <img class="gm-role-img" src="cards/${cardFile}.webp" alt="${role.id}" data-emoji="${role.emoji}" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">
        <span class="gm-role-emoji" style="position:absolute; font-size:20px; display:none; text-align:center; width:100%;">${role.emoji}</span>
      </div>
    `;

    tableRows += `
      <tr class="gm-table-role" data-role-id="${role.id}" style="cursor:pointer; border-bottom:1px solid rgba(199,125,255,0.1); transition:all 0.2s; ${role.count > 0 ? 'background:rgba(81,116,219,0.1);' : ''} hover {background:rgba(81,116,219,0.15);}">
        <td style="padding:4px 8px; font-size:9px; color:#c1a8ff; width:15%;">${role.isFavorite ? '⭐' : (role.origin === 'base' ? '🎮' : '✨')}</td>
        <td style="padding:4px 6px; text-align:center; width:50px;">
          ${visualCell}
        </td>
        <td style="padding:4px 8px; color:#e8e8f0; font-weight:500; width:25%; font-size:9px;">${role.name}</td>
        <td style="padding:4px 8px; color:#999; font-size:8px; flex:1; line-height:1.2; max-height:40px; overflow:hidden;">${role.description.substring(0, 70)}${role.description.length > 70 ? '...' : ''}</td>
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
         🃏 Sélectionner les Rôles
      </h2>
      <div style="flex:1; display:flex; flex-direction:column; padding:4px; overflow:hidden; box-sizing:border-box;">
        <!-- Tableau des rôles -->
        <div style="flex:1; display:flex; flex-direction:column; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:4px; padding:2px; box-sizing:border-box; overflow:hidden;">
          ${rolesGrid}
        </div>
        <!-- DECK EN BAS -->
        <div style="background:linear-gradient(135deg, rgba(199,125,255,0.08), rgba(81,116,219,0.08)); border:1px solid rgba(199,125,255,0.3); border-radius:8px; margin-top:6px; padding:0; display:flex; flex-direction:column; height:70px; box-shadow:inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(199,125,255,0.1);">
          <div style="font-size:9px; color:#81dff7; padding:6px 8px; margin:0; font-weight:600; text-shadow:0 1px 2px rgba(0,0,0,0.4);">🎴 Deck <span style="color:#999;">(${totalCards})</span></div>
          <div id="gmDeckCardsVisual" style="display:flex; flex-wrap:nowrap; gap:4px; overflow-x:auto; overflow-y:hidden; flex:1; padding:4px 8px; align-items:center;">
            ${deckVisual || '<div style="color:#666; font-size:8px; padding:0 10px; white-space:nowrap; margin:auto;">Sélectionnez les cartes →</div>'}
          </div>
        </div>
      </div>
      <div style="padding:8px 12px; display:flex; gap:12px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(199,125,255,0.2);">
        <div style="flex:1; font-size:8px; color:#c1a8ff; padding:4px 0;">
          📊 <strong>${totalCards}</strong> cartes / <strong>${totalRoles}</strong> rôles | ⭐ <strong>${favoriteCount}</strong> favoris
        </div>
        <button id="gmBtnNextRoles" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:8px 14px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:10px;">
           Suivant →
        </button>
      </div>
    </div>
  `;
}

function attachChooseCardEvents(gameUI) {
  // Gérer les fallbacks emoji pour les images dans le TABLEAU
  document.querySelectorAll('.gm-role-img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const emoji = img.parentElement.querySelector('.gm-role-emoji');
      if (emoji) emoji.style.display = 'block';
    });
  });

  // Gérer les fallbacks emoji pour les images du DECK
  document.querySelectorAll('.gm-deck-img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const emojiSpan = img.parentElement.querySelector('.gm-deck-emoji');
      if (emojiSpan) emojiSpan.style.display = 'block';
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

  document.getElementById('gmBtnNextRoles')?.addEventListener('click', () => {
    const selectedRoles = gameUI.gm.state.selectedRoles || {};
    const playerCount = Object.values(selectedRoles).reduce((a,b) => a+b, 0);

    if (playerCount === 0) {
      alert('Sélectionnez au moins une carte!');
      return;
    }

    if (playerCount < 4) {
      alert('🎮 Minimum 4 joueurs pour jouer!');
      return;
    }

    const wolvesRoles = [
      'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant',
      'Infect_Pere_Loups', 'Louveteau', 'Abominable_Sectaire', 'Cultiste'
    ];
    const hasWolves = wolvesRoles.some(role => selectedRoles[role] && selectedRoles[role] > 0);
    if (!hasWolves) {
      alert('🐺 Il faut au moins 1 Loup Garou pour jouer!');
      return;
    }

    const playerNames = getRandomPlayerNames(playerCount);
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
