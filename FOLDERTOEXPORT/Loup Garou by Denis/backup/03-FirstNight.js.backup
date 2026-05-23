// ========================================
// ÉCRAN 3A: PREMIÈRE NUIT - ASSIGNATION DES RÔLES
// ========================================
// Ce fichier gère l'interface et l'assignation des rôles
// Les actions des rôles sont dans 04-FirstNight-Actions.js

// Ordre exact de la première nuit
const ROLE_ORDER = [
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup', 'Montreur_Ours', 'Chevalier_Epee_Rouille',
  'Voyante', 'Ancien', 'Ange', 'Servante_Devouee', 'Salvateur',
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups',
  'Sorcière',
  'Gitane',
  'Joueur_Flute', 'Marionnettiste', 'Voleur', 'Pyromane', 'Ankou', 'Abominable_Sectaire',
  'Lapin_Blanc', 'Juge_Begue', 'Necromancien', 'Noctambule', 'Corbeau', 'Petite_Fille',
  'Idiot_Village', 'Bouc_Emissaire', 'Capitaine', 'Chasseur',
  'Deux_Soeurs', 'Trois_Freres', 'Comedien', 'Villageois_Villageois',
  'Renard'
];

// Rôles qui ont une action la première nuit
const ROLES_WITH_NIGHT_ACTION = new Set([
  'Cupidon', 'Enfant_Sauvage', 'Chien_Loup',
  'Voyante', 'Sorcière', 'Ancien', 'Ange', 'Servante_Devouee', 'Salvateur',
  'Renard', 'Gitane', 'Joueur_Flute', 'Marionnettiste', 'Voleur',
  'Pyromane', 'Ankou', 'Abominable_Sectaire', 'Lapin_Blanc', 'Juge_Begue',
  'Necromancien', 'Noctambule', 'Corbeau', 'Petite_Fille',
  'Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'
]);

// Rôles qui n'ont QUE une action (pas d'étape 1), l'action se fait après assignation complète
const ROLES_ACTION_ONLY = new Set([]);

const ROLE_ACTIONS = {
  'Cupidon': { instruction: '💘 Sélectionnez 2 joueurs pour les rendre amoureux', type: 'selectPair' },
  'Enfant_Sauvage': { instruction: '👦 Enfant Sauvage, qui est ton idole ?', type: 'enfantSauvageIdol' },
  'Chien_Loup': { instruction: '🐕🐺 Chien Loup, tu restes Villageois ou tu deviens Loup Garou ?', type: 'chienLoupChoice' },
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
  'Abominable_Sectaire': { instruction: '👹 Sectaire, qui convertis-tu à ton culte ?', type: 'selectOne' },
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

// Tips de gameplay pour chaque rôle
const ROLE_TIPS = {
  'Cupidon': "💡 Crée un couple fort pour te protéger. Mais attention: les amoureux sont une cible!",
  'Enfant_Sauvage': "💡 Choisis quelqu'un de confiance comme idole. Sa mort changera tout pour toi.",
  'Chien_Loup': "💡 Quel camp rejoindras-tu? Pense stratégique: qui te protégera?",
  'Voyante': "💡 Regarde les rôles-clés: Sorcière, Salvateur, rôles seuls. Ne regarde pas n'importe qui!",
  'Ancien': "💡 Protège quelqu'un chaque nuit. Varie tes cibles pour survivre.",
  'Ange': "💡 Protège les rôles importants. Reste discret sur tes choix.",
  'Servante_Devouee': "💡 Tu protèges, mais tu dois rester discrète. Ne sauve pas toujours la même personne!",
  'Salvateur': "💡 Sauve quelqu'un d'une infection future. Prédis qui les loups cibleront!",
  'Sorcière': "💡 Garde tes potions pour les moments critiques. Une résurrection au bon moment = victoire.",
  'Renard': "💡 Découvre qui sont les loups sans dévoiler ta position. Bluff quand tu dois!",
  'Gitane': "💡 Sens les connexions émotionnelles. Cherche des couples ou des duos suspects.",
  'Joueur_Flute': "💡 Charme les gens pour les immuniser. Gagne quand tout le village est enchanté!",
  'Marionnettiste': "💡 Contrôle les pouvoirs des autres. Fais agir les gens contre leur camp!",
  'Voleur': "💡 Vole un rôle puissant ou dangereux. Change ton destin cette nuit!",
  'Pyromane': "💡 Marque discrètement, puis brûle. Crée de la panique quand tu agis!",
  'Ankou': "💡 Marque quelqu'un 3 fois pour le tuer. Cible quelqu'un qui ne se doute de rien.",
  'Abominable_Sectaire': "💡 Convertis des gens à ton culte. Gagne avec eux une fois assez nombreux.",
  'Lapin_Blanc': "💡 Crée le chaos avec un événement aléatoire! Prépare-toi à l'imprévu.",
  'Juge_Begue': "💡 Jugement hâtif mais puissant. Utilise ton verdict au moment critique.",
  'Necromancien': "💡 Ressuscite les morts comme fantômes. Reviens plus fort qu'avant!",
  'Noctambule': "💡 Espionne les échanges de la nuit. Découvre qui chuchote avec qui.",
  'Corbeau': "💡 Vole 2 votes à quelqu'un. Enlève du poids aux décisions critiques.",
  'Petite_Fille': "💡 Écoute les loups pour connaître leurs noms et leur stratégie!",
  'Renard': "💡 Détecte les loups autour de toi. Mais révèle ton pouvoir si tu te trompes.",
  'Simple_Loup_Garou': "🐺 Chasse avec vos frères. Plus nombreux = plus forts. Restez unis!",
  'Grand_Mechant_Loup': "🐺 Tu es le boss des loups! Tu peut tuer une deuxième fois tant qu'aucun loup n'est mort.",
  'Loup_Garou_Blanc': "🐺 Tu chasses seul. Tue les loups si tu es seul, ou les villageois si tu es avec eux.",
  'Loup_Garou_Voyant': "🐺 Tu vois tous les rôles dès le départ! Use de cette connaissance avec prudence.",
  'Infect_Pere_Loups': "🐺 Convertis ta victime en loup. Renforce votre clan quand tu peux.",
  'Chevalier_Epee_Rouille': "💡 Si les loups te tuent, ils paient: pas de victime la nuit suivante + le loup à ta droite meurt!",
  'Montreur_Ours': "💡 L'ours grogne aléatoirement. Si oui, quelqu'un à côté de toi est un loup!",
  'Deux_Soeurs': "💡 Communiquez la nuit sans paroles. Coordonnez vos actions en secret!",
  'Trois_Freres': "💡 Coordonnez-vous la nuit en silence. Vous êtes forts ensemble!",
  'Chasseur': "💡 Tire sur quelqu'un si tu es voté. Choisis bien ta vengeance!",
  'Capitaine': "💡 Tu as 2 voix au vote! Tes votes pèsent lourd dans les décisions.",
  'Bouc_Emissaire': "💡 Si égalité au vote, tu meurs à la place. Attention aux votes serrés!",
  'Idiot_Village': "💡 Le vote du village te sauve, mais tu perds ton droit de vote après!",
  'Villageois_Villageois': "💡 Tu n'as aucun pouvoir, tu votes. Mais ta survie protège le village!"
};

function getAvailableRolesInOrder(selectedRoles, gm) {
  const result = [];
  ROLE_ORDER.forEach(role => {
    // Exclure le Renard s'il a perdu son pouvoir
    // (seulement après la première nuit - le Renard doit au moins faire son action une fois)
    if (role === 'Renard' && gm && gm.state.renardLostPower && gm.state.currentTurn > 0) {
      console.log('[Renard] Exclu car il a perdu son pouvoir');
      return; // Skip le Renard
    }

    // Ajouter le rôle UNE SEULE FOIS, peu importe combien de joueurs l'ont
    // (l'assignation Step 1 permet d'assigner plusieurs joueurs au même rôle)
    const count = selectedRoles[role] || 0;
    if (count > 0) {
      result.push(role);
    }
  });
  return result;
}

function isActionComplete(gm, currentRole) {
  const roleAction = ROLE_ACTIONS[currentRole];
  if (!roleAction) return true;

  switch (roleAction.type) {
    case 'selectOne':
      const targetId = gm.state[`${currentRole}Target`];
      const isSelected = targetId !== null && targetId !== '';

      if (currentRole === 'Salvateur' && isSelected) {
        const salvateurHistory = gm.state.salvateurHistory || [];
        const lastSavedId = salvateurHistory.length > 0 ? salvateurHistory[salvateurHistory.length - 1] : null;
        if (targetId === lastSavedId) return false;
      }

      return isSelected;
    case 'selectPair':
      if (currentRole === 'Cupidon') {
        return (gm.state.cupidoSelection || []).length === 2;
      } else {
        return (gm.state[`${currentRole}Selection`] || []).length === 2;
      }
    case 'chienLoupChoice':
      return gm.state.chienLoupChoice !== null;
    case 'enfantSauvageIdol':
      return gm.state.enfantSauvageIdol?.playerId !== null && gm.state.enfantSauvageIdol?.playerId !== '';
    case 'voyanteLook':
      return gm.state.voyanteLook?.playerId !== null && gm.state.voyanteLook?.playerId !== '' &&
             gm.state.voyanteLook?.roleId !== null && gm.state.voyanteLook?.roleId !== '';
    case 'renardSniff':
      return gm.state.renardSniff?.targetId !== null && gm.state.renardSniff?.targetId !== '';
    case 'jugeBeJudgement':
      return gm.state.jugeBeJudgement?.targetId !== null && gm.state.jugeBeJudgement?.targetId !== '' &&
             gm.state.jugeBeJudgement?.verdict !== null;
    case 'wolvesKill':
      return gm.state.wolvesVictim !== null && gm.state.wolvesVictim !== '';
    case 'sorcierePotions':
      const sorcierePotions = gm.state.sorcierePotions || {};
      const choice = sorcierePotions.choice;
      if (choice === 'save') return true;
      if (choice === 'kill') return sorcierePotions.mortTarget !== null && sorcierePotions.mortTarget !== '';
      if (choice === 'nothing') return true;
      return false;
    case 'lapinConfirm':
    case 'petiteFilleEcoute':
      const confirmKey = currentRole === 'Lapin_Blanc' ? 'LapinConfirmed' :
                        currentRole === 'Petite_Fille' ? 'PetiteFilleConfirmed' :
                        `${currentRole}Confirmed`;
      return gm.state[confirmKey] === true;
    default:
      return true;
  }
}

function renderFirstNight(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;
  console.log(`[FirstNight] Joueurs totaux: ${players.length}`, players.map(p => p.name));
  const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
  const currentRole = availableRoles[currentRoleIdx];
  const role = gm.getRoleInfo(currentRole);
  const tableType = gm.state.tableType || 'circle';

  // Log d'accueil au début (première fois seulement)
  if (currentRoleIdx === 0 && !gm.state.welcomeLogged) {
    gm.addLog('🎮 BIENVENUE AU VILLAGE !', 'welcome');
    const playerNames = players.map(p => p.name).join(', ');
    gm.addLog(`Le village accueille ${players.length} habitants: ${playerNames}`, 'info');
    gm.addLog('Préparez-vous à dormir votre première nuit...', 'info');
    gm.state.welcomeLogged = true;
  }

  const requiredCount = selectedRoles[currentRole] || 1;
  const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
  const playerAssignedToRole = playersAssignedToRole.length > 0 ? playersAssignedToRole[0] : null;

  const roleAction = ROLE_ACTIONS[currentRole];
  const cardFile = gameUI.getCardFile(currentRole);

  // Si c'est un rôle "ACTION_ONLY" (comme Renard), forcer l'étape 2
  const isActionOnly = ROLES_ACTION_ONLY.has(currentRole);
  let effectiveStep = step;
  if (isActionOnly && step === 1) {
    effectiveStep = 2;
  }

  // Afficher le décompte détaillé des rôles
  const roleCount = {};
  players.forEach(p => {
    if (p.roleId) {
      roleCount[p.roleId] = (roleCount[p.roleId] || 0) + 1;
    }
  });
  console.log(`[RenderFirstNight] ${currentRole} - Step:${step} EffectiveStep:${effectiveStep} - Assignés:${playersAssignedToRole.length}/${requiredCount}`, roleCount);

  // Style de la table basé sur son type
  const tableStyle = tableType === 'circle'
    ? 'border-radius:50%;'
    : 'border-radius:4px;';

  // HTML POUR STEP 1: ASSIGNATION
  // Fonction pour détecter les Loups
  const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
  const isWolfRole = (roleId) => wolfRoles.includes(roleId);

  // Filtrer les joueurs selon le type de rôle
  const currentRoleIsWolf = isWolfRole(currentRole);
  let availablePlayers;
  if (currentRoleIsWolf) {
    const existingWolves = players.filter(p => p.roleId && isWolfRole(p.roleId));

    // Simple_Loup_Garou: montrer les loups existants + les joueurs sans rôle (pour assigner de nouveaux loups)
    // Loup_Garou_Blanc: montrer SEULEMENT les Simple_Loup_Garou (transformation parmi les loups avérés)
    // Autres loups: montrer SEULEMENT les loups existants (pour transformer l'un d'eux)
    if (currentRole === 'Simple_Loup_Garou') {
      const unassignedPlayers = players.filter(p => !p.roleId);
      availablePlayers = [...existingWolves, ...unassignedPlayers];
    } else if (currentRole === 'Loup_Garou_Blanc') {
      // Loup Blanc: seulement les Simple_Loup_Garou (pas les autres types de loups)
      availablePlayers = players.filter(p => p.roleId === 'Simple_Loup_Garou');
    } else {
      // Grand_Mechant_Loup, etc. : seulement les loups existants
      availablePlayers = existingWolves;
    }
  } else {
    // Pour les autres rôles: montrer seulement ceux sans rôle, + le joueur déjà assigné à ce rôle
    availablePlayers = players.filter(p => !p.roleId || p.roleId === currentRole);
  }

  const playerGridHtml = availablePlayers.map(p => {
    const isAssigned = p.roleId === currentRole;
    // Déterminer si c'est un Chien_Loup qui a choisi de devenir loup (flag transformedFromChienLoup)
    const isChienLoupWolf = p.transformedFromChienLoup === true;

    // Colorer les Loups en ROUGE
    let bgColor, borderColor, isDisabled = false;
    if (isChienLoupWolf && isWolfRole(currentRole)) {
      // Chien_Loup transformé en Loup = VERT (ne peut pas être retiré)
      bgColor = '#2d7a3d';
      borderColor = '#00ff64';
      isDisabled = true;
    } else if (isAssigned && isWolfRole(currentRole)) {
      // Rôle Loup assigné = ROUGE
      bgColor = '#8b3a3a';
      borderColor = '#d46666';
    } else if (isAssigned) {
      // Autres rôles assignés = VERT
      bgColor = '#4a9d6f';
      borderColor = '#66d999';
    } else {
      // Non assigné = VIOLET
      bgColor = '#6b4c9a';
      borderColor = '#9966ff';
    }
    return `
      <div class="gm-player-assign" data-player-id="${p.id}" style="
        padding:6px 4px; margin:2px; border:2px solid ${borderColor}; border-radius:3px;
        background:${bgColor}; color:#e8e8f0; cursor:${isDisabled ? 'not-allowed' : 'pointer'}; text-align:center;
        font-size:10px; font-weight:600; user-select:none; transition:all 0.2s; opacity:${isDisabled ? '0.8' : '1'};
      " data-disabled="${isDisabled ? 'true' : 'false'}">
        ${p.name}
      </div>
    `;
  }).join('');

  return `
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <!-- GAUCHE: TABLE (1/3) -->
      <div style="position:absolute; left:0; top:0; width:33%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); border-right:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:1px; margin:1px;">
        <div style="position:relative; display:inline-block;">
          <div style="position:relative; display:inline-block; width:240px; height:240px;">
            <div id="gmFirstNightTable" style="position:relative; width:140px; height:140px; background:rgba(120, 85, 60, 0.6); border:3px solid var(--gm-border); box-shadow:inset 0 2px 8px rgba(0,0,0,0.5); ${tableStyle} position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.3; font-size:24px;">🪵</div>
            </div>
            <div id="gmFirstNightPlayers" style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%);"></div>
          </div>
        </div>
      </div>

      <!-- DROITE: ASSIGNATION (2/3) -->
      <div style="margin-left:33%; display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
        <!-- HAUT: INFO RÔLE + CONTRÔLES GLOBAUX -->
        <div style="padding:10px; border-bottom:1px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); flex:0 0 auto;">
          <div style="display:flex; gap:8px; align-items:flex-start; justify-content:space-between;">
            <div style="display:flex; gap:8px; align-items:center; flex:1;">
              <img src="cards/${cardFile}.webp" alt="${currentRole}" style="width:40px; height:52px; object-fit:cover; border-radius:3px; border:1px solid rgba(199,125,255,0.4);">
              <div style="flex:1; min-width:0;">
                <div style="font-size:12px; color:#e8e8f0; font-weight:600;">${currentRole}</div>
                <div style="font-size:8px; color:#aaa; margin-top:2px; max-height:24px; overflow-y:auto; line-height:1.2;">${role ? role.description : ''}</div>
                <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px; padding:4px; background:rgba(129, 223, 247, 0.1); border-left:2px solid #81dff7; line-height:1.3;">${ROLE_TIPS[currentRole] || '💡 Pas de conseil spécifique.'}</div>
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-shrink:0;">
              <div id="gmChrono" style="background:rgba(74, 157, 111, 0.2); border:2px solid #66d999; padding:6px 12px; border-radius:4px; color:#66d999; font-weight:700; font-size:13px; min-width:60px; text-align:center;">00:00</div>
              <button id="gmBtnPrevStep" style="background:#ffffff; border:none; padding:6px 12px; border-radius:4px; color:#1a1a2e; font-weight:700; cursor:pointer; font-size:11px; height:fit-content;">↶ Retour</button>
            </div>
          </div>
          ${effectiveStep === 1 ? `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 1/2: Assigner le joueur</div>
          ` : `
            <div style="margin-top:6px; font-size:9px; color:#81dff7; font-weight:600;">Étape 2/2: Action du rôle</div>
          `}
        </div>

        <!-- MILIEU: CONTENU (changeable par étape) -->
        <div style="flex:1; padding:10px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          ${effectiveStep === 1 ? `
            <!-- ÉTAPE 1: ASSIGNATION -->
            <div style="font-size:9px; color:#81dff7; font-weight:600;">🎯 Cliquez sur ${requiredCount === 1 ? 'un joueur' : `${requiredCount} joueurs`} (${playersAssignedToRole.length}/${requiredCount}):</div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
              ${playerGridHtml}
            </div>
          ` : `
            <!-- ÉTAPE 2: ACTION -->
            ${playerAssignedToRole && roleAction ? `
              <div style="padding:8px; background:rgba(100,150,255,0.15); border:1px solid rgba(100,150,255,0.3); border-radius:4px; margin-bottom:8px;">
                <div style="font-size:10px; color:#81dff7; font-weight:600; margin-bottom:4px;">
                  ${roleAction.instruction}
                </div>
              </div>

              ${renderRoleActionUI(gameUI, currentRole, roleAction, players, selectedRoles)}
            ` : 'Erreur: pas de joueur assigné'}
          `}
        </div>

        <!-- BAS: CONTRÔLES -->
        <div style="display:flex; gap:6px; padding:10px; border-top:1px solid rgba(199,125,255,0.3); background:rgba(0,0,0,0.3); flex:0 0 auto; align-items:center; justify-content:flex-start; flex-wrap:wrap;">
          ${effectiveStep === 1 ? `
            ${(() => {
              const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
              const isWolfRole = wolfRoles.includes(currentRole);
              // Pour les loups: afficher si au moins 1 assigné. Pour les autres: afficher si exactement requiredCount
              const canContinue = isWolfRole ? playersAssignedToRole.length > 0 : playersAssignedToRole.length === requiredCount;

              return canContinue ? (ROLES_WITH_NIGHT_ACTION.has(currentRole) ? `
                <button id="gmBtnNextStep" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Suivant →</button>
              ` : `
                <button id="gmBtnNextRole" style="background:rgba(100,150,200,0.2); border:1px solid rgba(100,150,200,0.5); padding:6px 10px; border-radius:4px; color:#81dff7; font-weight:600; cursor:pointer; flex:1; min-width:80px; font-size:9px;">Rôle Suivant →</button>
              `) : '';
            })()}
          ` : effectiveStep === 2 ? `
            <button id="gmBtnNextRole" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:0; min-width:100px; font-size:9px;">Rôle Suivant →</button>
          ` : ''}
          ${currentRoleIdx >= availableRoles.length - 1 && playersAssignedToRole.length === requiredCount && (step === 2 || !ROLES_WITH_NIGHT_ACTION.has(currentRole)) ? `
            <button id="gmBtnFinishGame" style="background:linear-gradient(135deg, #4a9d6f, #66d999); border:none; padding:6px 10px; border-radius:4px; color:white; font-weight:600; cursor:pointer; flex:0; font-size:9px; margin-left:auto;">✓ Commencer</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Helper pour rendu des UI d'actions de rôles
function renderRoleActionUI(gameUI, currentRole, roleAction, players, selectedRoles) {
  const gm = gameUI.gm;
  // Filtrer les joueurs selon le rôle:
  // - Corbeau: peut viser TOUS les joueurs vivants
  // - Salvateur: peut viser TOUS les joueurs vivants (pour les protéger d'une infection future)
  // - Autres rôles selectOne: montrer seulement ceux sans rôle assigné
  const availablePlayers = (currentRole === 'Corbeau' || currentRole === 'Salvateur')
    ? gameUI.gm.state.players || []
    : players.filter(p => !p.roleId);

  if (roleAction.type === 'selectPair') {
    const stateKey = currentRole === 'Cupidon' ? 'cupidoSelection' : `${currentRole}Selection`;
    return `
      <div id="gm${currentRole}Selected" style="font-size:9px; color:#66d999; font-weight:600; padding:4px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:16px; margin-bottom:8px;">
        Aucun sélectionné
      </div>
      <div style="font-size:8px; color:#81dff7; font-weight:600; margin-bottom:4px;">Sélectionnez 2 joueurs:</div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px;">
        ${availablePlayers.map(p => {
          const isSelected = (gm.state[stateKey] || []).includes(p.id);
          const bgColor = isSelected ? '#4a9d6f' : '#6b4c9a';
          const borderColor = isSelected ? '#66d999' : '#9966ff';
          const className = currentRole === 'Cupidon' ? 'gm-cupido-select' : `gm${currentRole}Select`;
          return `
            <div class="${className}" data-player-id="${p.id}" style="
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
  } else if (roleAction.type === 'enfantSauvageIdol') {
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Sélectionne ton idole:</div>
        <select id="gmEnfantSauvageIdol" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmEnfantSauvageResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'chienLoupChoice') {
    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600; margin-bottom:4px;">Choisis ton camp:</div>
        <button id="gmChienLoupVillageois" style="padding:8px; background:linear-gradient(135deg, #5174db, #7ba3f5); border:2px solid #7ba3f5; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">👨 Rester Villageois</button>
        <button id="gmChienLoupLoup" style="padding:8px; background:linear-gradient(135deg, #8b3a3a, #d46666); border:2px solid #d46666; border-radius:4px; color:white; font-weight:600; cursor:pointer; font-size:9px;">🐺 Devenir Loup Garou</button>
        <div id="gmChienLoupResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucun choix
        </div>
      </div>
    `;
  } else if (roleAction.type === 'selectOne') {
    let label = 'Sélectionne un joueur:';
    if (currentRole === 'Corbeau') {
      label = `À qui voles-tu 2 votes? (${availablePlayers.length} joueurs)`;
    } else if (currentRole === 'Salvateur') {
      label = `Qui anticipes-tu pour l'infection? (${availablePlayers.length} joueurs vivants)`;
    }
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">${label}</div>
        <select id="gmSelectOneTarget" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmSelectOneResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'voyanteLook') {
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">Joueur à voir:</div>
        <select id="gmVoyanteTouches" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner un joueur --</option>
          ${availablePlayers.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div style="font-size:9px; color:#81dff7; font-weight:600; margin-top:4px;">Rôle du joueur:</div>
        <div id="gmVoyanteRoleContainer">
          <select id="gmVoyanteSees" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600; width:100%;">
            <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner le rôle --</option>
            ${Object.keys(selectedRoles).filter(roleId => selectedRoles[roleId] > 0).map(roleId => `<option value="${roleId}" style="background:#000000; color:#e8e8f0;">${roleId}</option>`).join('')}
          </select>
        </div>
        <div id="gmVoyanteResult" style="font-size:9px; color:#66d999; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px; margin-top:4px;">
          Aucune sélection
        </div>
      </div>
    `;
  } else if (roleAction.type === 'sorcierePotions') {
    // Afficher les détails de la victime des Loups ordinaires
    const wolvesVictimId = gm.state.wolvesVictim;
    const wolvesVictim = wolvesVictimId ? players.find(p => p.id === wolvesVictimId) : null;
    const isSaved = wolvesVictim && gm.state.salvateurSavedThisNight === wolvesVictim.id;

    // Pour la Sorcière: tous les joueurs vivants sauf elle-même
    // (elle ne peut pas s'empoisonner elle-même)
    const sorciere = players.find(p => p.roleId === 'Sorcière');
    const availablePoisonTargets = players.filter(p => p.id !== sorciere?.id);

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- VICTIME DES LOUPS -->
        ${wolvesVictim ? `
          <div style="padding:12px; background:${isSaved ? 'rgba(255, 193, 7, 0.3)' : 'rgba(212, 102, 102, 0.3)'}; border:2px solid ${isSaved ? '#ffc107' : '#d46666'}; border-radius:6px; text-align:center;">
            <div style="font-size:14px; color:${isSaved ? '#ffb300' : '#ff9999'}; font-weight:700; margin-bottom:4px;">${isSaved ? '💛 DÉJÀ SAUVÉ PAR LE SALVATEUR' : '💀 LES LOUPS ONT MANGÉ'}</div>
            <div style="font-size:20px; color:#ffffff; font-weight:800; margin-bottom:4px;">${wolvesVictim.name}</div>
            <div style="font-size:12px; color:${isSaved ? '#ffcc99' : '#ffcccc'}; font-weight:600;">🎭 ${wolvesVictim.roleId || '?'}</div>
          </div>
        ` : ''}

        <!-- INSTRUCTIONS -->
        <div style="padding:10px; background:rgba(129, 223, 247, 0.15); border:1px solid rgba(129, 223, 247, 0.3); border-radius:4px; font-size:10px; color:#81dff7; line-height:1.4; font-weight:600;">
          <div style="margin-bottom:6px;"><strong>Sorcière,</strong> les loups-garous ont mangé un bout de cette personne.</div>
          <div style="margin-bottom:6px;"><strong>Si tu la sauves:</strong> Fais moi 👍 (pouce en l'air)</div>
          <div style="margin-bottom:6px;"><strong>Si tu l'abandonnes:</strong> Sélectionne quelqu'un à empoisonner et fais moi 👎 (pouce en bas)</div>
          <div><strong>Sinon:</strong> Tu peux te rendormir</div>
        </div>

        <!-- POTIONS RESTANTES -->
        <div style="padding:8px; background:rgba(100,200,100,0.2); border:1px solid rgba(100,200,100,0.4); border-radius:4px; text-align:center; font-size:11px; color:#66d999; font-weight:700;">
          ❤️ 1 Potion de VIE   |   ☠️ 1 POISON
        </div>

        <!-- BOUTONS (3 OPTIONS) -->
        <div style="display:flex; gap:6px; justify-content:center;">
          <button id="gmSorciereSave" style="flex:1; padding:12px; background:${gm.state.sorcierePotions?.choice === 'save' ? 'rgba(100,200,100,0.6)' : 'rgba(100,200,100,0.2)'}; border:2px solid #66d999; color:#66d999; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">👍 SAUVER</button>
          <button id="gmSorcierNothing" style="flex:1; padding:12px; background:${gm.state.sorcierePotions?.choice === 'nothing' ? 'rgba(150,150,150,0.6)' : 'rgba(100,100,100,0.2)'}; border:2px solid #999; color:#ccc; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">🛌 DORMIR</button>
          <button id="gmSorcierKill" style="flex:1; padding:12px; background:${gm.state.sorcierePotions?.choice === 'kill' ? 'rgba(212,102,102,0.6)' : 'rgba(200,100,100,0.2)'}; border:2px solid #d46666; color:#ff9999; font-weight:700; cursor:pointer; font-size:16px; border-radius:4px; transition: all 0.2s;">☠️ POISON</button>
        </div>

        <!-- SÉLECTION DU POISON (s'affiche quand poison choisi) -->
        ${gm.state.sorcierePotions?.choice === 'kill' ? `
        <div id="gmSorcierKillSelect" style="display:flex; flex-direction:column; gap:6px; animation:slideDown 0.3s ease-out;">
          <div style="font-size:10px; color:#d46666; font-weight:600;">💀 Qui empoisonner? (${availablePoisonTargets.length} joueurs disponibles)</div>
          <select id="gmSorciereMortTarget" style="padding:8px; background:#1a1a1a; border:2px solid #d46666; color:#e8e8f0; border-radius:4px; font-size:10px; font-weight:600; width:100%; cursor:pointer;">
            <option value="" style="background:#1a1a1a; color:#e8e8f0;">-- Sélectionner une victime --</option>
            ${availablePoisonTargets.map(p => `<option value="${p.id}" style="background:#1a1a1a; color:#e8e8f0;">${p.name}</option>`).join('')}
          </select>
          ${gm.state.sorcierePotions?.mortTarget ? `
          <div style="padding:8px; background:rgba(212,102,102,0.2); border:1px solid #d46666; border-radius:4px; text-align:center; font-size:10px; color:#ff9999; font-weight:600;">
            ✓ ${players.find(p => p.id === gm.state.sorcierePotions.mortTarget)?.name || ''} sera empoisonné
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `;
  } else if (roleAction.type === 'renardSniff') {
    // Renard: peut sentir TOUS les joueurs vivants (pas juste ceux sans rôle!)
    // On doit utiliser gm.state.players pour avoir TOUS les joueurs
    const allAlivePlayers = gameUI.gm.state.players || [];

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="padding:10px; background:rgba(129, 223, 247, 0.15); border:1px solid rgba(129, 223, 247, 0.3); border-radius:4px; font-size:9px; color:#81dff7; line-height:1.4; font-weight:600;">
          <strong>Renard,</strong> tu pointes quelqu'un assis à table. Tu vas sentir s'il y a des loups parmi ces 3 personnes:
          <div style="margin-top:4px; font-size:8px; color:#81dff7; opacity:0.8;">→ Celui que tu pointes (milieu) + celui à sa gauche + celui à sa droite</div>
        </div>

        <!-- SÉLECTEUR (boutons) -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:9px; color:#81dff7; font-weight:600;">🎯 Qui pointes-tu? (${allAlivePlayers.length} joueurs vivants)</div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap:4px; max-height:200px; overflow-y:auto;">
            ${allAlivePlayers.map(p => `
              <button class="gmRenardSelectBtn" data-player-id="${p.id}" style="
                padding:8px 6px;
                background:rgba(100,80,150,0.2);
                border:2px solid rgba(100,150,255,0.3);
                color:#e8e8f0;
                font-weight:600;
                cursor:pointer;
                font-size:9px;
                border-radius:4px;
                transition: all 0.2s;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              ">${p.name}</button>
            `).join('')}
          </div>
          <input type="hidden" id="gmRenardTarget" value="">
        </div>

        <!-- AFFICHAGE DES 3 PERSONNES -->
        <div id="gmRenardGroupDisplay" style="display:none; flex-direction:column; gap:8px; padding:12px; background:rgba(100,80,150,0.2); border:2px solid rgba(100,80,150,0.4); border-radius:6px;">
          <div style="text-align:center; font-size:10px; color:#81dff7; font-weight:600; margin-bottom:4px;">Les 3 personnes à la table:</div>
          <div style="display:flex; gap:8px; justify-content:space-around; align-items:flex-end;">
            <!-- GAUCHE -->
            <div id="gmRenardLeftDisplay" style="flex:1; text-align:center; padding:8px; background:rgba(100,150,255,0.1); border:2px solid rgba(100,150,255,0.3); border-radius:4px;">
              <div style="font-size:8px; color:#81dff7; margin-bottom:4px; opacity:0.7;">👈 GAUCHE</div>
              <div style="font-size:11px; color:#e8e8f0; font-weight:700; margin-bottom:6px;">-</div>
            </div>
            <!-- MILIEU (TOI) -->
            <div id="gmRenardCenterDisplay" style="flex:1; text-align:center; padding:8px; background:rgba(255,152,0,0.1); border:3px solid rgba(255,152,0,0.5); border-radius:4px;">
              <div style="font-size:8px; color:#ff9800; margin-bottom:4px; opacity:0.9; font-weight:700;">🎯 TOI</div>
              <div style="font-size:12px; color:#ffb84d; font-weight:800; margin-bottom:6px;">-</div>
            </div>
            <!-- DROITE -->
            <div id="gmRenardRightDisplay" style="flex:1; text-align:center; padding:8px; background:rgba(100,150,255,0.1); border:2px solid rgba(100,150,255,0.3); border-radius:4px;">
              <div style="font-size:8px; color:#81dff7; margin-bottom:4px; opacity:0.7;">DROITE 👉</div>
              <div style="font-size:11px; color:#e8e8f0; font-weight:700; margin-bottom:6px;">-</div>
            </div>
          </div>
        </div>

        <!-- RÉSULTAT (détection automatique) -->
        <div id="gmRenardResult" style="display:none; font-size:11px; color:#81dff7; font-weight:600; padding:12px; background:rgba(100,80,150,0.2); border-radius:4px; min-height:40px; text-align:center;">
          En attente...
        </div>

        <!-- BOUTON SUIVANT -->
        <button id="gmRenardNext" style="display:none; padding:12px; background:rgba(100,150,255,0.3); border:2px solid rgba(100,150,255,0.6); color:#81dff7; font-weight:700; cursor:pointer; font-size:11px; border-radius:4px; transition: all 0.2s;">
          ✓ SUIVANT
        </button>
      </div>
    `;
  } else if (roleAction.type === 'wolvesKill') {
    // Déterminer les victimes possibles selon le rôle
    const wolfRoles = ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc', 'Loup_Garou_Voyant', 'Infect_Pere_Loups'];
    let possibleVictims;

    if (currentRole === 'Loup_Garou_Blanc') {
      // Loup Blanc ne peut tuer que des Loups
      possibleVictims = players.filter(p => p.roleId && wolfRoles.includes(p.roleId));
    } else if (currentRole === 'Grand_Mechant_Loup') {
      // Grand Méchant Loup exclut: les Loups ET la victime que les Loups viennent de choisir
      const victimJustChosen = gm.state.wolvesVictim;
      possibleVictims = players.filter(p =>
        !wolfRoles.includes(p.roleId) &&
        p.id !== victimJustChosen
      );
    } else {
      // Les autres Loups peuvent tuer TOUS les non-Loups (avec ou sans rôle)
      possibleVictims = players.filter(p => !wolfRoles.includes(p.roleId));
    }

    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:9px; color:#81dff7; font-weight:600;">🐺 Qui mangez-vous?</div>
        <select id="gmWolvesVictim" style="padding:6px; background:#000000; border:2px solid rgba(199,125,255,0.5); color:#e8e8f0; border-radius:3px; font-size:9px; font-weight:600;">
          <option value="" style="background:#000000; color:#e8e8f0;">-- Sélectionner --</option>
          ${possibleVictims.map(p => `<option value="${p.id}" style="background:#000000; color:#e8e8f0;">${p.name}</option>`).join('')}
        </select>
        <div id="gmWolvesResult" style="font-size:9px; color:#ff6b6b; font-weight:600; padding:6px; background:rgba(0,0,0,0.3); border-radius:3px; min-height:20px;">
          Aucune victime
        </div>
      </div>
    `;
  }
  return '';
}

function attachFirstNightEvents(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const selectedRoles = gm.state.selectedRoles || {};
  const currentRoleIdx = gm.state.currentRoleIdx || 0;
  const step = gm.state.nightStep || 1;
  const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
  const currentRole = availableRoles[currentRoleIdx];

  // ===== INITIALISER TOUS LES ÉTATS =====
  if (!gm.state.cupidoSelection) gm.state.cupidoSelection = [];
  if (!gm.state.enfantSauvageIdol) gm.state.enfantSauvageIdol = { playerId: null };
  if (!gm.state.chienLoupChoice) gm.state.chienLoupChoice = null;
  if (!gm.state.voyanteLook) gm.state.voyanteLook = { playerId: null, roleId: null };
  if (!gm.state.renardSniff) gm.state.renardSniff = { targetId: null };
  if (!gm.state.jugeBeJudgement) gm.state.jugeBeJudgement = { targetId: null, verdict: null };
  if (!gm.state.sorcierePotions) gm.state.sorcierePotions = { choice: null };
  if (gm.state.wolvesVictim === undefined) gm.state.wolvesVictim = '';
  if (!gm.state.salvateurHistory) gm.state.salvateurHistory = [];

  ['Ancien', 'Ange', 'Servante_Devouee', 'Salvateur', 'Marionnettiste', 'Voleur',
   'Pyromane', 'Ankou', 'Abominable_Sectaire', 'Noctambule', 'Necromancien', 'Corbeau'].forEach(role => {
    if (gm.state[`${role}Target`] === undefined) gm.state[`${role}Target`] = null;
  });

  ['Joueur_Flute', 'Gitane'].forEach(role => {
    if (gm.state[`${role}Selection`] === undefined) gm.state[`${role}Selection`] = [];
  });

  // ===== AFFICHAGE DE LA TABLE =====
  const result = gameUI.generatePositionsByTableType(players.length, gm.state.tableType || 'circle');
  const defaultPositions = result.positions;
  const tableCenter = result.center;
  const scale = 240 / 300;
  const containerCenter = 120;

  const playerPoints = players.map((p, idx) => {
    const posX = defaultPositions[idx].x - tableCenter.x;
    const posY = defaultPositions[idx].y - tableCenter.y;
    const x = containerCenter + (posX * scale);
    const y = containerCenter + (posY * scale);
    const isAssignedToCurrent = p.roleId === currentRole;

    let dotColor, dotBorder;
    if (p.roleId) {
      const roleColor = gm.getRoleColor(p.roleId);
      dotColor = roleColor.bg;
      dotBorder = roleColor.border;
    } else {
      dotColor = '#6b4c9a';
      dotBorder = '#9966ff';
    }

    if (isAssignedToCurrent) {
      dotBorder = '#00ff00';
    }

    const lovers = gm.state.cupidoSelection || [];
    const isLover = lovers.includes(p.id);
    const borderColor = isLover ? '#ff69b4' : dotBorder;
    const borderWidth = isLover ? '3px' : '2px';
    const boxShadow = isLover ? '0 0 10px #ff69b4' : 'none';

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${x}px; top: ${y}px; position:absolute; cursor:pointer;">
        <div class="gm-point-dot" style="background:${dotColor}; border:${borderWidth} solid ${borderColor}; box-shadow:${boxShadow};"></div>
        <div class="gm-point-name">${p.name}</div>
      </div>
    `;
  }).join('');

  const playersContainer = document.getElementById('gmFirstNightPlayers');
  if (playersContainer) {
    playersContainer.innerHTML = playerPoints;
  }

  // ===== ÉTAPE 1: ASSIGNATION =====
  const requiredCount = selectedRoles[currentRole] || 1;
  const assignedCount = players.filter(p => p.roleId === currentRole).length;

  document.querySelectorAll('.gm-player-assign').forEach(elem => {
    elem.addEventListener('click', () => {
      const playerId = elem.dataset.playerId;
      const player = players.find(p => p.id === playerId);

      if (player && !player.roleId) {
        const currentAssignedCount = players.filter(p => p.roleId === currentRole).length;
        if (currentAssignedCount < requiredCount) {
          player.roleId = currentRole;
          gm.assignRole(player.name, currentRole);
          gm.saveState();
          gameUI.render();
        }
      } else if (player && player.roleId === currentRole) {
        player.roleId = null;
        gm.saveState();
        gameUI.render();
      }
    });
  });

  // ===== ÉTAPE 2: ACTIONS DES RÔLES =====
  if (step === 2) {
    const playersAssignedToRole = players.filter(p => p.roleId === currentRole);
    const playerAssignedToRole = playersAssignedToRole.length > 0 ? playersAssignedToRole[0] : null;

    // Appeler le handler des actions de rôles
    attachRoleActionHandlers(gameUI, currentRole, players, selectedRoles, playerAssignedToRole);
  }

  // ===== VALIDATION DU BOUTON =====
  const btnNextStep = document.getElementById('gmBtnNextStep');
  if (btnNextStep) {
    if (step === 2) {
      const isComplete = isActionComplete(gm, currentRole);
      btnNextStep.disabled = !isComplete;
      btnNextStep.style.opacity = isComplete ? '1' : '0.5';
      btnNextStep.style.cursor = isComplete ? 'pointer' : 'not-allowed';
    }

    if (!btnNextStep.hasAttribute('data-listener-attached')) {
      btnNextStep.onclick = (e) => {
        e.preventDefault();
        if (btnNextStep.disabled) return;

        const gm = gameUI.gm;
        const players = gm.state.players || [];
        const selectedRoles = gm.state.selectedRoles || {};
        const step = gm.state.nightStep;
        const currentRoleIdx = gm.state.currentRoleIdx;
        const availableRoles = getAvailableRolesInOrder(selectedRoles, gm);
        const currentRole = availableRoles[currentRoleIdx];

        if (step === 1) {
          if (ROLES_WITH_NIGHT_ACTION.has(currentRole)) {
            gm.state.nightStep = 2;
          } else {
            gm.state.currentRoleIdx = currentRoleIdx + 1;
            gm.state.nightStep = 1;
          }
        } else {
          // Étape 2: Sauvegarder l'action avant de passer au rôle suivant
          const actor = players.find(p => p.roleId === currentRole);

          // Appeler les logging functions (à refactoriser dans game-master.js)
          if (currentRole === 'Cupidon' && gm.state.cupidoSelection && gm.state.cupidoSelection.length === 2) {
            const selected = gm.state.cupidoSelection;
            const p1 = players.find(p => p.id === selected[0]);
            const p2 = players.find(p => p.id === selected[1]);
            if (p1 && p2) gm.cupidoAction(p1.name, p2.name);
          }
          else if (currentRole === 'Enfant_Sauvage' && gm.state.enfantSauvageIdol?.playerId) {
            const enfant = players.find(p => p.roleId === 'Enfant_Sauvage');
            const idol = players.find(p => p.id === gm.state.enfantSauvageIdol.playerId);
            if (enfant && idol) gm.enfantSauvageIdol(enfant.name, idol.name);
          }
          else if (currentRole === 'Chien_Loup' && gm.state.chienLoupChoice) {
            const chien = players.find(p => p.roleId === 'Chien_Loup');
            if (chien) gm.chienLoupChoice(chien.name, gm.state.chienLoupChoice);
          }
          else if (currentRole === 'Voyante' && gm.state.voyanteLook?.playerId && gm.state.voyanteLook?.roleId) {
            const voyante = players.find(p => p.roleId === 'Voyante');
            const target = players.find(p => p.id === gm.state.voyanteLook.playerId);
            if (voyante && target) gm.voyanteLook(voyante.name, target.name);
          }
          else if (currentRole === 'Sorcière' && gm.state.sorcierePotions) {
            const sorciere = players.find(p => p.roleId === 'Sorcière');
            if (sorciere) {
              const choice = gm.state.sorcierePotions.choice;
              if (choice === 'save') {
                const victim = players.find(p => p.id === gm.state.wolvesVictim);
                if (victim) gm.addGameLog(`🧪 ${sorciere.name} (Sorcière) a ressuscité <strong>${victim.name}</strong>`);
              } else if (choice === 'kill' && gm.state.sorcierePotions.mortTarget) {
                const target = players.find(p => p.id === gm.state.sorcierePotions.mortTarget);
                if (target) gm.addGameLog(`☠️ ${sorciere.name} (Sorcière) a empoisonné <strong>${target.name}</strong>`);
              } else if (choice === 'nothing') {
                gm.addGameLog(`🧙‍♀️ ${sorciere.name} (Sorcière) n'a rien fait cette nuit`);
              }
            }
            gm.state.wolvesVictim = '';
          }
          // ... autres logs pour les autres rôles

          gm.state.currentRoleIdx = currentRoleIdx + 1;
          gm.state.nightStep = 1;
        }

        gm.saveState();
        gameUI.render();
      };
      btnNextStep.setAttribute('data-listener-attached', 'true');
    }
  }

  // Boutons contrôle autres
  const btnPrevStep = document.getElementById('gmBtnPrevStep');
  if (btnPrevStep && !btnPrevStep.hasAttribute('data-listener-attached')) {
    btnPrevStep.onclick = () => {
      gm.state.nightStep = 1;
      gm.saveState();
      gameUI.render();
    };
    btnPrevStep.setAttribute('data-listener-attached', 'true');
  }

  const btnNextRole = document.getElementById('gmBtnNextRole');
  if (btnNextRole && !btnNextRole.hasAttribute('data-listener-attached')) {
    btnNextRole.onclick = () => {
      gm.state.currentRoleIdx = currentRoleIdx + 1;
      gm.state.nightStep = 1;
      gm.saveState();
      gameUI.render();
    };
    btnNextRole.setAttribute('data-listener-attached', 'true');
  }

  const btnFinishGame = document.getElementById('gmBtnFinishGame');
  if (btnFinishGame && !btnFinishGame.hasAttribute('data-listener-attached')) {
    btnFinishGame.onclick = () => {
      gm.state.gamePhase = 'day1';
      gm.state.dayPhase = 'election';
      gm.saveState();
      gameUI.render();
    };
    btnFinishGame.setAttribute('data-listener-attached', 'true');
  }
}
