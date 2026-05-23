// ========================================
// ÉCRAN 6: NUITS 2+ - ACTIONS SEULEMENT
// ========================================
// Ce fichier gère les actions de rôles pour les nuits 2+
// Pas d'assignation - juste exécution des actions
// Les rôles sont déjà assignés depuis la Nuit 1

const NIGHT_ROLE_ORDER = [
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup', 'Abominable_Sectaire',
  'Voyante', 'Sorcière', 'Ancien', 'Ange', 'Salvateur', 'Voleur', 'Petite_Fille', 'Renard', 'Corbeau',
  'Servante_Devouee', 'Joueur_Flute', 'Ankou', 'Marionnettiste', 'Chaman', 'Garde_Du_Corps', 'Pretre',
  'Gitane', 'Noctambule', 'Mystique', 'Mamie_Grincheuse', 'Fille_Joie', 'Comedien', 'Necromancien',
  'Arnacoeur', 'Lapin_Blanc', 'Tueur_Serie', 'Pyromane', 'Infect_Pere_Loups', 'Grand_Mechant_Loup',
  'Simple_Loup_Garou', 'Loup_Garou_Voyant',
  'Loup_Garou_Blanc', 'Tireur', 'Juge_Begue',
  'Chasseur', 'Chevalier_Epee_Rouille', 'Fils_Lune', 'Louveteau', 'Lepreux', 'Savant_Fou',
  'Ange_Dechu', 'Gros_Dur', 'Humain_Maudit', 'Porteur_Amulette',
  'Villageois_Villageois', 'Bouc_Emissaire', 'Idiot_Village', 'Cultiste', 'Capitaine', 'President',
  'Deux_Soeurs', 'Trois_Freres', 'Montreur_Ours'
];

const NIGHT_ROLES_WITH_ACTION = new Set([
  'Voyante', 'Sorcière', 'Ancien', 'Ange', 'Servante_Devouee', 'Salvateur',
  'Renard', 'Gitane', 'Joueur_Flute', 'Marionnettiste', 'Voleur',
  'Pyromane', 'Ankou', 'Lapin_Blanc', 'Juge_Begue',
  'Necromancien', 'Noctambule', 'Corbeau', 'Petite_Fille',
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'
]);

const NIGHT_ROLE_ACTIONS = {
  'Voyante': { instruction: '👁️ Voyante, tu veux voir l\'identité de qui ?', type: 'voyanteLook' },
  'Sorcière': { instruction: '🧙‍♀️ Sorcière, choisis qui ressusciter (VIE) ou empoisonner (MORT)', type: 'sorcierePotions' },
  'Ancien': { instruction: '👴 Ancien, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Ange': { instruction: '😇 Ange, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Servante_Devouee': { instruction: '👸 Servante, qui protèges-tu cette nuit ?', type: 'selectOne' },
  'Salvateur': { instruction: '👼 Salvateur, qui anticipes-tu pour l\'infection ?', type: 'selectOne' },
  'Renard': { instruction: '🦊 Renard, tu pointes quelqu\'un. Est-ce qu\'il y a des Loups autour?', type: 'renardSniff' },
  'Gitane': { instruction: '🔮 Gitane, qui as-tu senti connecté à qui (2 personnes) ?', type: 'selectPair' },
  'Joueur_Flute': { instruction: '🎵 Joueur de Flûte, charme 2 personnes pour les immuniser', type: 'selectPair' },
  'Marionnettiste': { instruction: '🎭 Marionnettiste, qui contrôles-tu cette nuit ?', type: 'selectOne' },
  'Voleur': { instruction: '🎩 Voleur, à qui voles-tu le rôle ?', type: 'selectOne' },
  'Pyromane': { instruction: '🔥 Pyromane, qui marques-tu à l\'essence ?', type: 'selectOne' },
  'Ankou': { instruction: '☠️ Ankou, qui marques-tu pour la mort ?', type: 'selectOne' },
  'Lapin_Blanc': { instruction: '🐰 Lapin Blanc, crée un événement aléatoire', type: 'lapinConfirm' },
  'Juge_Begue': { instruction: '⚖️ Juge, juges-tu qui ? Et innocent ou coupable ?', type: 'jugeBegueJudge' },
  'Necromancien': { instruction: '💀 Nécromancien, qui veux-tu ressusciter ?', type: 'selectOne' },
  'Noctambule': { instruction: '🦉 Noctambule, qui veux-tu observer cette nuit ?', type: 'selectOne' },
  'Corbeau': { instruction: '🐦‍⬛ Corbeau, à qui voles-tu 2 votes ?', type: 'selectOne' },
  'Petite_Fille': { instruction: '👧 Petite Fille, tu écoutes les Loups', type: 'petiteFilleEcoute' },
  'Simple_Loup_Garou': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Grand_Mechant_Loup': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Loup_Garou_Blanc': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Loup_Garou_Voyant': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' },
  'Infect_Pere_Loups': { instruction: '🐺 Loups-Garous, on mange qui ce soir ?', type: 'wolvesKill' }
};

function getPlayersWithRole(players, roleId) {
  return players.filter(p => p.roleId === roleId && !p.isDead);
}

function renderNight(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const currentNight = gm.state.currentTurn || 1;
  const nightTag = `[Nuit${currentNight}]`;

  // Vérifier les flags de modification de chasse
  const wolvesCantHunt = gm.state.wolvesCantHuntNextNight || false;
  const wolvesBonus = gm.state.wolvesBonusKillNextNight || false;

  // Filtrer les rôles assignés à des joueurs vivants
  const assignedRoles = [];
  NIGHT_ROLE_ORDER.forEach(roleId => {
    const playersWithRole = getPlayersWithRole(players, roleId);
    if (playersWithRole.length > 0) {
      assignedRoles.push(roleId);
    }
  });

  // Trouver les rôles qui ont une action cette nuit
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  let rolesWithAction = assignedRoles.filter(roleId => NIGHT_ROLES_WITH_ACTION.has(roleId));

  // Si les loups ne peuvent pas chasser, les retirer de la liste
  if (wolvesCantHunt) {
    rolesWithAction = rolesWithAction.filter(roleId =>
      !['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(roleId)
    );
  }

  const currentRole = rolesWithAction[currentRoleIdx];

  if (!currentRole) {
    // Tous les rôles ont fini leurs actions
    return renderNightComplete(gameUI, currentNight);
  }

  const playersWithCurrentRole = getPlayersWithRole(players, currentRole);
  const roleAction = NIGHT_ROLE_ACTIONS[currentRole];

  // Générer la table
  const result = gameUI.generatePositionsByTableType(players.length, gm.state.tableType || 'circle');
  const defaultPositions = result.positions;
  const tableCenter = result.center;
  const scale = 180 / 300;
  const containerCenter = 90;

  const playerPoints = players.map((p, idx) => {
    if (p.isDead) return '';

    const posX = defaultPositions[idx].x - tableCenter.x;
    const posY = defaultPositions[idx].y - tableCenter.y;
    const x = containerCenter + (posX * scale);
    const y = containerCenter + (posY * scale);

    const roleColor = gm.getRoleColor(p.roleId);
    const dotColor = roleColor.bg;
    const dotBorder = roleColor.border;

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${x}px; top: ${y}px; position:absolute; cursor:pointer;">
        <div class="gm-point-dot" style="background:${dotColor}; border:2px solid ${dotBorder};"></div>
        <div class="gm-point-name">${p.name}</div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; flex-direction:column; height:100vh; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif;">
      <!-- HEADER -->
      <div style="padding:8px; background:rgba(100,150,200,0.1); border-bottom:1px solid rgba(199,125,255,0.2);">
        <div style="font-weight:600; font-size:11px; color:#81dff7;">🌙 NUIT ${currentNight} - ${currentRole || 'Fin'}</div>
        <div style="font-size:8px; color:#aaa; margin-top:2px;">Joueurs vivants: ${players.filter(p => !p.isDead).length}/${players.length}</div>
        ${wolvesCantHunt ? `<div style="font-size:9px; color:#ffaa44; margin-top:4px; padding:4px; background:rgba(255,170,0,0.2); border-radius:2px;">⚠️ Les Loups ne chassent pas cette nuit!</div>` : ''}
        ${wolvesBonus ? `<div style="font-size:9px; color:#ff9999; margin-top:4px; padding:4px; background:rgba(200,100,100,0.2); border-radius:2px;">🐺 Les Loups ont 2 victimes ce soir!</div>` : ''}
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div style="flex:1; display:flex; overflow:hidden;">
        <!-- GAUCHE: TABLE -->
        <div style="width:35%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); border-right:1px solid rgba(199,125,255,0.2); padding:8px;">
          <div style="position:relative; display:inline-block;">
            <div style="position:relative; width:180px; height:180px;">
              <div style="position:absolute; width:140px; height:140px; background:rgba(120, 85, 60, 0.6); border:3px solid rgba(199,125,255,0.4); border-radius:50%; top:50%; left:50%; transform:translate(-50%, -50%);"></div>
              <div style="position:absolute; width:180px; height:180px; top:0; left:0;">
                ${playerPoints}
              </div>
            </div>
          </div>
        </div>

        <!-- DROITE: ACTION -->
        <div style="flex:1; display:flex; flex-direction:column; padding:8px; overflow:hidden;">
          ${currentRole ? `
            <div style="padding:8px; background:rgba(100,150,255,0.15); border:1px solid rgba(100,150,255,0.3); border-radius:4px; margin-bottom:8px;">
              <div style="font-size:10px; color:#81dff7; font-weight:600;">
                ${roleAction?.instruction || 'Action du rôle'}
              </div>
            </div>
            <div id="gmNightActionContainer" style="flex:1; overflow-y:auto; padding:4px; background:rgba(0,0,0,0.3); border-radius:4px;">
              <!-- Formulaire d'action sera inséré ici -->
            </div>
          ` : `
            <div style="flex:1; display:flex; align-items:center; justify-content:center;">
              <div style="text-align:center; color:#81dff7;">
                <div style="font-size:14px; margin-bottom:8px;">✅</div>
                <div style="font-size:10px; font-weight:600;">Toutes les actions sont complètes!</div>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- BOUTONS -->
      <div style="display:flex; gap:6px; padding:8px; border-top:1px solid rgba(199,125,255,0.3); background:rgba(0,0,0,0.3); flex:0 0 auto;">
        ${currentRole ? `
          <button id="gmBtnNightAction" style="flex:1; background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
            Rôle Suivant →
          </button>
        ` : `
          <button id="gmBtnNightEnd" style="flex:1; background:linear-gradient(135deg, #4a9d6f, #66d999); border:none; padding:6px; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">
            ✓ Fin de Nuit ${currentNight}
          </button>
        `}
      </div>
    </div>
  `;
}

function renderNightActionUI(gameUI, currentRole, roleAction, players) {
  const gm = gameUI.gm;

  // Filtrer les joueurs selon le rôle
  const availablePlayers = (currentRole === 'Corbeau' || currentRole === 'Salvateur')
    ? players.filter(p => !p.isDead)
    : players.filter(p => !p.isDead && p.roleId !== currentRole);

  if (roleAction.type === 'selectOne') {
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Sélectionnez un joueur:</div>
        <select id="gmNightSelectTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmNightSelectResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'selectPair') {
    return `
      <div id="gmNightPairSelected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
        Aucun sélectionné
      </div>
      <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">Sélectionnez 2 joueurs:</div>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:3px;">
        ${availablePlayers.map(p => {
          const isSelected = (gm.state.nightPairSelection || []).includes(p.id);
          const bgColor = isSelected ? '#4a9d6f' : '#6b4c9a';
          const borderColor = isSelected ? '#66d999' : '#9966ff';
          return `
            <div class="gmNightPairSelect" data-player-id="${p.id}" style="
              padding:6px 4px; margin:2px; border:2px solid ${borderColor}; border-radius:3px;
              background:${bgColor}; color:#e8e8f0; cursor:pointer; text-align:center;
              font-size:10px; font-weight:600; user-select:none; transition:all 0.2s;
            ">
              ${p.name}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (roleAction.type === 'voyanteLook') {
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Joueur à voir:</div>
        <select id="gmNightVoyanteTouches" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmNightVoyanteResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'sorcierePotions') {
    const wolvesVictimId = gm.state.wolvesVictim;
    const wolvesVictim = wolvesVictimId ? players.find(p => p.id === wolvesVictimId && !p.isDead) : null;

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${wolvesVictim ? `
          <div style="padding:12px; background:rgba(212, 102, 102, 0.3); border:2px solid #d46666; border-radius:6px; text-align:center;">
            <div style="font-size:14px; color:#ff9999; font-weight:700; margin-bottom:4px;">💀 LES LOUPS ONT MANGÉ</div>
            <div style="font-size:20px; color:#ffffff; font-weight:800; margin-bottom:4px;">${wolvesVictim.name}</div>
            <div style="font-size:12px; color:#ffcccc; font-weight:600;">🎭 ${wolvesVictim.roleId || '?'}</div>
          </div>
        ` : ''}

        <div style="display:flex; gap:6px; justify-content:center;">
          <button id="gmNightSorciereSave" style="flex:1; padding:12px; background:rgba(100,200,100,0.2); border:2px solid #66d999; color:#66d999; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">👍 SAUVER</button>
          <button id="gmNightSorcierNothing" style="flex:1; padding:12px; background:rgba(100,100,100,0.2); border:2px solid #999; color:#ccc; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">🛌 DORMIR</button>
          <button id="gmNightSorcierKill" style="flex:1; padding:12px; background:rgba(200,100,100,0.2); border:2px solid #d46666; color:#ff9999; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">☠️ POISON</button>
        </div>

        ${gm.state.nightSorcierePotions?.choice === 'kill' ? `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:10px; color:#d46666; font-weight:600;">💀 Qui empoisonner?</div>
          <select id="gmNightSorciereMortTarget" style="padding:8px; background:#1a1a1a; border:2px solid #d46666; color:#e8e8f0; border-radius:4px; font-size:10px; font-weight:600; width:100%; cursor:pointer;">
            <option value="" style="background:#1a1a1a; color:#e8e8f0;">-- Sélectionner une victime --</option>
            ${availablePlayers.map(p => `<option value="${p.id}" style="background:#1a1a1a; color:#e8e8f0;">${p.name}</option>`).join('')}
          </select>
        </div>
        ` : ''}
      </div>
    `;
  } else if (roleAction.type === 'wolvesKill') {
    // Vérifier le bonus kill flag
    const wolvesBonus = gm.state.wolvesBonusKillNextNight || false;
    const selectedVictims = gm.state.wolvesVictims || [];

    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">
          ${wolvesBonus ? '🐺 Les Loups ont 2 victimes ce soir!' : 'Qui tuer ce soir?'}
        </div>
        ${wolvesBonus ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            <div style="flex:1;">
              <select id="gmNightWolvesVictim1" style="width:100%; padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                <option value="" style="background:#000000; color:#e8e8f0;">-- Victim 1 --</option>
                ${availablePlayers.map(p => {
                  const isWolf = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(p.roleId);
                  return isWolf ? '' : `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`;
                }).join('')}
              </select>
            </div>
            <div style="flex:1;">
              <select id="gmNightWolvesVictim2" style="width:100%; padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
                <option value="" style="background:#000000; color:#e8e8f0;">-- Victim 2 --</option>
                ${availablePlayers.map(p => {
                  const isWolf = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(p.roleId);
                  return isWolf ? '' : `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`;
                }).join('')}
              </select>
            </div>
          </div>
        ` : `
          <select id="gmNightWolvesVictim" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
            <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner une victime --</option>
            ${availablePlayers.map(p => {
              const isWolf = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(p.roleId);
              return isWolf ? '' : `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`;
            }).join('')}
          </select>
        `}
        <div id="gmNightWolvesResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          ${selectedVictims.length > 0 ? `${selectedVictims.length} victime(s) sélectionnée(s)` : 'Aucune sélection'}
        </div>
      </div>
    `;
  }

  return `<div style="color:#aaa; font-size:9px;">Action non implémentée</div>`;
}

function renderNightComplete(gameUI, currentNight) {
  return `
    <div style="display:flex; flex-direction:column; height:100vh; background:#1a1a2e; color:#e8e8f0; font-family:Arial,sans-serif; align-items:center; justify-content:center; padding:12px;">
      <div style="text-align:center;">
        <div style="font-size:36px; margin-bottom:16px;">🌙</div>
        <h1 style="margin:0; font-size:16px; color:#81dff7; margin-bottom:12px;">Nuit ${currentNight} Complète</h1>
        <div style="font-size:10px; color:#aaa; margin-bottom:20px; max-width:250px; line-height:1.5;">
          Tous les rôles ont agi...<br>
          L'aube se lève sur le village...
        </div>
        <button id="gmBtnDayStart" style="padding:8px 20px; background:linear-gradient(135deg, #ffcc66, #ffaa00); border:none; border-radius:4px; color:#000; font-weight:600; cursor:pointer; font-size:10px;">
          ☀️ Jour ${currentNight + 1}
        </button>
      </div>
    </div>
  `;
}

function attachNightEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const currentNight = gm.state.currentTurn || 1;
  const nightTag = `[Nuit${currentNight}]`;

  // Déterminer le rôle courant
  const assignedRoles = [];
  NIGHT_ROLE_ORDER.forEach(roleId => {
    const playersWithRole = getPlayersWithRole(players, roleId);
    if (playersWithRole.length > 0) {
      assignedRoles.push(roleId);
    }
  });

  const rolesWithAction = assignedRoles.filter(roleId => NIGHT_ROLES_WITH_ACTION.has(roleId));
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const currentRole = rolesWithAction[currentRoleIdx];
  const roleAction = NIGHT_ROLE_ACTIONS[currentRole];

  // Rendre le formulaire d'action
  if (currentRole && roleAction) {
    const actionContainer = document.getElementById('gmNightActionContainer');
    if (actionContainer) {
      actionContainer.innerHTML = renderNightActionUI(gameUI, currentRole, roleAction, players);

      // Attacher les event listeners du formulaire
      if (roleAction.type === 'selectOne') {
        document.getElementById('gmNightSelectTarget')?.addEventListener('change', (e) => {
          gm.state[`${currentRole}Target`] = e.target.value;
          document.getElementById('gmNightSelectResult').textContent = e.target.value ?
            `✓ ${players.find(p => p.id === e.target.value)?.name}` : 'Aucune sélection';
          gm.saveState();
        });
      } else if (roleAction.type === 'selectPair') {
        document.querySelectorAll('.gmNightPairSelect').forEach(elem => {
          elem.addEventListener('click', () => {
            const playerId = elem.dataset.playerId;
            const selection = gm.state.nightPairSelection || [];
            const idx = selection.indexOf(playerId);

            if (idx >= 0) {
              selection.splice(idx, 1);
            } else if (selection.length < 2) {
              selection.push(playerId);
            }

            gm.state.nightPairSelection = selection;
            const names = selection.map(id => players.find(p => p.id === id)?.name).join(' & ');
            document.getElementById('gmNightPairSelected').textContent = names || 'Aucun sélectionné';
            gm.saveState();
            gameUI.render();
          });
        });
      } else if (roleAction.type === 'voyanteLook') {
        document.getElementById('gmNightVoyanteTouches')?.addEventListener('change', (e) => {
          gm.state.nightVoyanteLook = { playerId: e.target.value, roleId: '' };
          const targetName = e.target.value ? players.find(p => p.id === e.target.value)?.name : '';
          document.getElementById('gmNightVoyanteResult').textContent = targetName ?
            `✓ Vous regarderez ${targetName}` : 'Aucune sélection';
          gm.saveState();
        });
      } else if (roleAction.type === 'sorcierePotions') {
        document.getElementById('gmNightSorciereSave')?.addEventListener('click', () => {
          gm.state.nightSorcierePotions = { choice: 'save', mortTarget: null };
          gameUI.render();
        });
        document.getElementById('gmNightSorcierNothing')?.addEventListener('click', () => {
          gm.state.nightSorcierePotions = { choice: 'nothing', mortTarget: null };
          gameUI.render();
        });
        document.getElementById('gmNightSorcierKill')?.addEventListener('click', () => {
          gm.state.nightSorcierePotions = { choice: 'kill', mortTarget: '' };
          gameUI.render();
        });
        document.getElementById('gmNightSorciereMortTarget')?.addEventListener('change', (e) => {
          if (gm.state.nightSorcierePotions) {
            gm.state.nightSorcierePotions.mortTarget = e.target.value;
            gm.saveState();
          }
        });
      } else if (roleAction.type === 'wolvesKill') {
        // Vérifier si bonus kill (Louveteau)
        const wolvesBonus = gm.state.wolvesBonusKillNextNight || false;

        if (wolvesBonus) {
          // 2 victimes
          document.getElementById('gmNightWolvesVictim1')?.addEventListener('change', (e) => {
            const victims = gm.state.wolvesVictims || [];
            victims[0] = e.target.value || null;
            gm.state.wolvesVictims = victims;
            updateWolvesResult();
            gm.saveState();
          });
          document.getElementById('gmNightWolvesVictim2')?.addEventListener('change', (e) => {
            const victims = gm.state.wolvesVictims || [];
            victims[1] = e.target.value || null;
            gm.state.wolvesVictims = victims;
            updateWolvesResult();
            gm.saveState();
          });

          const updateWolvesResult = () => {
            const victims = (gm.state.wolvesVictims || []).filter(v => v);
            const names = victims.map(id => players.find(p => p.id === id)?.name).join(' & ');
            document.getElementById('gmNightWolvesResult').textContent = names ?
              `✓ ${names} seront mangés cette nuit` : 'Sélectionnez 2 victimes';
          };
        } else {
          // 1 victime
          document.getElementById('gmNightWolvesVictim')?.addEventListener('change', (e) => {
            gm.state.wolvesVictim = e.target.value;
            const victimName = e.target.value ? players.find(p => p.id === e.target.value)?.name : '';
            document.getElementById('gmNightWolvesResult').textContent = victimName ?
              `✓ ${victimName} sera mangé cette nuit` : 'Aucune sélection';
            gm.saveState();
          });
        }
      }
    }
  }

  // Bouton pour confirmer l'action et passer au rôle suivant
  document.getElementById('gmBtnNightAction')?.addEventListener('click', () => {
    if (currentRole && roleAction) {
      // Logger l'action
      if (currentRole.includes('Loup') || ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'].includes(currentRole)) {
        // Vérifier si les loups ne peuvent pas chasser
        if (gm.state.wolvesCantHuntNextNight) {
          gm.addGameLog(`🌙 Les Loups ne peuvent pas chasser cette nuit... (Fils de la Lune ou Chevalier)`, nightTag);
          gm.state.wolvesCantHuntNextNight = false; // Reset le flag
        } else if (gm.state.wolvesBonusKillNextNight) {
          // 2 victimes (Louveteau)
          const victims = (gm.state.wolvesVictims || []).filter(v => v);
          if (victims.length > 0) {
            const victimNames = victims.map(id => {
              const v = players.find(p => p.id === id);
              return v ? v.name : '?';
            }).join(' et ');
            gm.addGameLog(`🐺 BONUS: Les Loups mangent <strong>${victimNames}</strong> cette nuit! (Louveteau)`, nightTag);
            gm.state.wolvesBonusKillNextNight = false; // Reset le flag
          }
        } else if (gm.state.wolvesVictim) {
          // 1 victime normale
          const victim = players.find(p => p.id === gm.state.wolvesVictim);
          if (victim) {
            gm.addGameLog(`🐺 Les Loups mangent <strong>${victim.name}</strong>`, nightTag);
          }
        }
      } else if (currentRole === 'Voyante' && gm.state.nightVoyanteLook?.playerId) {
        const voyante = players.find(p => p.roleId === 'Voyante');
        const target = players.find(p => p.id === gm.state.nightVoyanteLook.playerId);
        if (voyante && target) gm.addGameLog(`👁️ ${voyante.name} (Voyante) regarde ${target.name}`, nightTag);
      } else if (currentRole === 'Sorcière' && gm.state.nightSorcierePotions) {
        const sorciere = players.find(p => p.roleId === 'Sorcière');
        if (sorciere) {
          const choice = gm.state.nightSorcierePotions.choice;
          if (choice === 'save' && gm.state.wolvesVictim) {
            const victim = players.find(p => p.id === gm.state.wolvesVictim);
            if (victim) gm.addGameLog(`🧪 ${sorciere.name} (Sorcière) ressuscite ${victim.name}`, nightTag);
          } else if (choice === 'kill' && gm.state.nightSorcierePotions.mortTarget) {
            const target = players.find(p => p.id === gm.state.nightSorcierePotions.mortTarget);
            if (target) gm.addGameLog(`☠️ ${sorciere.name} (Sorcière) empoisonne ${target.name}`, nightTag);
          } else if (choice === 'nothing') {
            gm.addGameLog(`🧙‍♀️ ${sorciere.name} (Sorcière) ne fait rien cette nuit`, nightTag);
          }
        }
      }
    }

    gm.state.currentRoleIdx = currentRoleIdx + 1;
    gm.state.nightSorcierePotions = null;
    gm.state.nightVoyanteLook = null;
    gm.state.nightPairSelection = null;
    gm.saveState();
    gameUI.render();
  });

  // Bouton pour terminer la nuit
  document.getElementById('gmBtnNightEnd')?.addEventListener('click', () => {
    gm.addGameLog(`☀️ L'aube se lève sur le village... Jour ${currentNight + 1}`, nightTag);

    gm.state.mode = 'day1';
    gm.state.nightPhase = false;
    gm.state.gameState.deathsAnnounced = false;
    gm.state.gameState.deathsLogged = false;
    gm.state.gameState.phase = 'day-deaths';
    gm.state.currentRoleIdx = 0;
    gm.saveState();
    gameUI.render();
  });

  // Bouton pour passer au jour (depuis l'écran de fin de nuit)
  document.getElementById('gmBtnDayStart')?.addEventListener('click', () => {
    gm.state.mode = 'day1';
    gm.state.nightPhase = false;
    gm.state.gameState.deathsAnnounced = false;
    gm.state.gameState.deathsLogged = false;
    gm.state.gameState.phase = 'day-deaths';
    gm.saveState();
    gameUI.render();
  });
}
