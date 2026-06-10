// ========================================
// ÉCRAN 2: TABLE SETUP + PLACE PLAYERS
// ========================================

// ---- Persistance des profils de joueurs + dernière table (localStorage) ----
function lgGetProfiles() {
  try { return JSON.parse(localStorage.getItem('lg_profiles') || '[]').filter(Boolean); }
  catch (_) { return []; }
}
function lgSaveProfiles(arr) {
  try {
    const uniq = [...new Set((arr || []).map(s => String(s).trim()).filter(Boolean))];
    localStorage.setItem('lg_profiles', JSON.stringify(uniq));
  } catch (_) {}
}
function lgAddProfiles(names) {
  lgSaveProfiles([...lgGetProfiles(), ...(names || [])]);
}
function lgGetLastTable() {
  try { return JSON.parse(localStorage.getItem('lg_lastTable') || '[]'); }
  catch (_) { return []; }
}
function lgSaveLastTable(names) {
  try { localStorage.setItem('lg_lastTable', JSON.stringify(names || [])); } catch (_) {}
}

function renderTableAndRename(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players;
  // Vue unique: table ronde (les vues rectangulaires/ovales ont été retirées).
  gm.state.tableType = 'circle';
  const tableType = 'circle';
  const tablePresets = {
    'circle': { width: 140, height: 140 }
  };

  const preset = tablePresets[tableType];
  const tableWidth = preset.width;
  const tableHeight = preset.height;

  const result = gameUI.generatePositionsByTableType(players.length, tableType);
  const defaultPositions = result.positions;
  const tableCenter = result.center;

  const scale = 240 / 300;
  const containerCenter = 120;

  // ===== TRACKER DES POSITIONS POUR SAVANT_FOU =====
  if (!gm.state.playerPositions) {
    gm.state.playerPositions = {};
  }

  players.forEach((p, idx) => {
    if (!p.tableX || !p.tableY) {
      if (defaultPositions[idx]) {
        const posX = defaultPositions[idx].x - tableCenter.x;
        const posY = defaultPositions[idx].y - tableCenter.y;
        p.tableX = containerCenter + (posX * scale);
        p.tableY = containerCenter + (posY * scale);

        // Sauvegarder la position de table et l'index circulaire
        gm.state.playerPositions[p.id] = {
          x: p.tableX,
          y: p.tableY,
          circleIndex: idx,
          totalPlayers: players.length
        };

        gm.saveState();
      }
    }
  });

  const playerPoints = players.map((p) => {
    // Vérifier si le joueur est mort
    const isDead = p.statusData && p.statusData.Mort;
    const deadStyle = isDead ? 'opacity: 0.4; filter: grayscale(100%);' : '';
    const deadIcon = isDead ? '☠️ ' : '';

    // 6 petits points uniquement pour le circle
    const dragIndicators = tableType === 'circle' ? `
        <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
        <div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
        <div style="position:absolute; left:-6px; top:50%; transform:translateY(-50%); width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
        <div style="position:absolute; right:-6px; top:50%; transform:translateY(-50%); width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
        <div style="position:absolute; top:-4px; left:-4px; width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
        <div style="position:absolute; bottom:-4px; right:-4px; width:3px; height:3px; background:#81dff7; border-radius:50%; opacity:0.8;"></div>
    ` : '';

    return `
      <div class="gm-player-point" data-player-id="${p.id}" style="left: ${p.tableX}px; top: ${p.tableY}px; position:absolute; cursor:grab; touch-action:none; ${deadStyle}; width:16px; height:16px; display:flex; align-items:center; justify-content:center;" title="${p.name}${isDead ? ' (MORT)' : ''}">
        ${dragIndicators}
        <!-- Point central -->
        <div class="gm-point-dot" style="${isDead ? 'background:#000000; border-color:#555555;' : ''}"></div>
        <div class="gm-point-name">${deadIcon}${p.name}</div>
      </div>
    `;
  }).join('');

  const playerNamesHtml = players.map((p, idx) => `
    <div class="gm-player-vignette" data-player-id="${p.id}" style="display:flex; flex-direction:column; align-items:center; gap:1px; padding:1px; background:rgba(0,0,0,0.2); border-radius:1px; cursor:grab; touch-action:none; user-select:none;">
      <div style="font-size:7px; opacity:0.7; text-align:center; font-weight:600;">J${idx + 1}</div>
      <input type="text" class="gm-player-name-input-place" data-player-id="${p.id}" value="${p.name}" placeholder="Nom..." style="width:58%; padding:1px; border:none; background:rgba(0,0,0,0.4); border-radius:2px; color:#e8e8f0; text-align:center; font-size:8px; pointer-events:auto;">
    </div>
  `).join('');

  let tableStyle = `position:relative; width:${tableWidth}px; height:${tableHeight}px; margin:0 auto; background:rgba(120, 85, 60, 0.6); border:3px solid var(--gm-border); box-shadow:inset 0 2px 8px rgba(0,0,0,0.5);`;
  if (tableType === 'circle' || tableType === 'oval-v' || tableType === 'oval-h') {
    tableStyle += ` border-radius:50%;`;
  } else if (tableType.includes('rect')) {
    tableStyle += ` border-radius:8px;`;
  }

  // ---- Barre de profils cliquables ----
  const profiles = lgGetProfiles();
  const placedNames = new Set(players.map(p => (p.name || '').trim()).filter(Boolean));
  const chipStyleBase = 'border:1px solid rgba(199,125,255,0.4); border-radius:10px; padding:2px 8px; font-size:9px; cursor:pointer; color:#e8e8f0; background:rgba(80,60,140,0.45);';
  const chips = profiles.map((n, i) => {
    const placed = placedNames.has(n.trim());
    return `<button class="gm-profile-chip" data-idx="${i}" title="${placed ? 'Déjà placé' : 'Cliquer pour placer'}" style="${chipStyleBase} ${placed ? 'opacity:0.45; text-decoration:line-through;' : ''}">${placed ? '✔ ' : ''}${n}</button>`;
  }).join('');
  const lastTable = lgGetLastTable();
  const btnSmall = 'border:1px solid rgba(199,125,255,0.4); border-radius:6px; padding:2px 8px; font-size:9px; cursor:pointer; color:#fff; font-weight:600;';

  return `
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:18px; color:#e8e8f0;">
         🪑 Placer les Joueurs & Nommer
      </h2>
      <div style="padding:5px 6px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9)); display:flex; flex-wrap:wrap; gap:4px; align-items:center; border-bottom:1px solid rgba(199,125,255,0.2);">
        <span style="font-size:9px; color:#81dff7; font-weight:700;">👤 Profils — clic = placer dans l'ordre :</span>
        <div id="gmProfileChips" style="display:flex; flex-wrap:wrap; gap:3px; flex:1; min-width:120px;">
          ${chips || '<span style="font-size:8px; opacity:0.6;">aucun profil — utilisez ＋ Nouveau</span>'}
        </div>
        <button id="gmBtnNewProfile" style="${btnSmall} background:rgba(90,160,110,0.6);">＋ Nouveau</button>
        ${lastTable.length ? `<button id="gmBtnLoadLast" style="${btnSmall} background:rgba(90,120,200,0.6);">↩ Dernière table</button>` : ''}
        <button id="gmBtnClearNames" style="${btnSmall} background:rgba(180,90,90,0.55);">✖ Vider</button>
      </div>
      <div style="flex:1; padding:0px; display:flex; flex-direction:row; gap:0px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9)); overflow:hidden; box-sizing:border-box;">
        <!-- GAUCHE: TABLE (1/3) -->
        <div style="flex:0 0 33%; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; background:rgba(0,0,0,0.2); border:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:1px; margin:1px;">
          <div style="position:relative; display:inline-block;">
            <div style="position:relative; display:inline-block; width:240px; height:240px;">
              <div class="gm-table-setup-container" id="gmTableResize" style="${tableStyle} position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.3; font-size:24px;">🪵</div>
              </div>
              <div id="gmPlayersContainer" style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%);">
                ${playerPoints}
              </div>
              <!-- SVG pour les traits de connexion -->
              <svg id="gmDragLines" style="position:absolute; width:240px; height:240px; top:50%; left:50%; transform:translate(-50%, -50%); pointer-events:none;">
              </svg>
            </div>
          </div>
        </div>
        <!-- DROITE: NOMS DES JOUEURS (2/3) -->
        <div style="flex:0 0 58%; display:flex; flex-direction:column; gap:0px; background:rgba(0,0,0,0.15); border:1px solid rgba(199,125,255,0.2); border-radius:6px; padding:0px; box-sizing:border-box; margin:1px;">
          <div style="font-size:8px; opacity:0.8; font-weight:600; color:#81dff7; text-align:center; padding:1px; border-bottom:1px solid rgba(199,125,255,0.2);">📝 Nommer</div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0px; flex:1; overflow-y:auto; min-height:0; padding:1px;">
            ${playerNamesHtml}
          </div>
        </div>
      </div>
      <div style="padding:12px; border-top:1px solid rgba(199,125,255,0.2); display:flex; gap:12px; background:rgba(0,0,0,0.3); flex-shrink:0;">
        <button id="gmBtnBackPlacePlayers" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:10px 16px; border-radius:6px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:1;">
           ← Retour
        </button>
        <button id="gmBtnStartGame" style="background:linear-gradient(135deg, #5174db, #c77dff); border:none; padding:10px 16px; border-radius:6px; color:white; font-weight:600; cursor:pointer; flex:1;">
           Suivant: Première Nuit →
        </button>
      </div>
    </div>
  `;
}

function attachTableAndRenameEvents(gameUI) {
  const gm = gameUI.gm;

  // ===== PROFILS DE JOUEURS =====
  // Place un nom dans le prochain emplacement libre (ou avance dans l'ordre).
  const placeName = (name) => {
    name = String(name || '').trim();
    if (!name) return;
    const players = gm.state.players;
    // Cherche un slot vide; sinon avance via _fillIdx
    let idx = players.findIndex(p => !(p.name || '').trim());
    if (idx === -1) {
      if (typeof gm.state._fillIdx !== 'number') gm.state._fillIdx = 0;
      idx = gm.state._fillIdx % players.length;
      gm.state._fillIdx = (gm.state._fillIdx + 1) % players.length;
    }
    players[idx].name = name;
    gm.saveState();
    gameUI.render();
  };

  document.querySelectorAll('.gm-profile-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const profiles = lgGetProfiles();
      const i = parseInt(chip.dataset.idx, 10);
      if (profiles[i]) placeName(profiles[i]);
    });
  });

  document.getElementById('gmBtnNewProfile')?.addEventListener('click', () => {
    const name = (prompt('Nom du nouveau profil :') || '').trim();
    if (!name) return;
    lgAddProfiles([name]);
    placeName(name); // ajoute ET place directement
  });

  document.getElementById('gmBtnLoadLast')?.addEventListener('click', () => {
    const last = lgGetLastTable();
    if (!last.length) return;
    const players = gm.state.players;
    players.forEach((p, i) => { p.name = last[i] || ''; });
    gm.state._fillIdx = Math.min(last.length, players.length) % players.length;
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnClearNames')?.addEventListener('click', () => {
    gm.state.players.forEach(p => { p.name = ''; });
    gm.state._fillIdx = 0;
    gm.saveState();
    gameUI.render();
  });

  document.querySelectorAll('.gm-player-name-input-place').forEach(input => {
    input.addEventListener('input', (e) => {
      const playerId = e.target.dataset.playerId;
      const player = gm.state.players.find(p => p.id === playerId);
      if (player) {
        player.name = e.target.value;
        gm.saveState();
        // Mise à jour live du nom sur la map
        const playerPoint = document.querySelector(`[data-player-id="${playerId}"] .gm-point-name`);
        if (playerPoint) {
          playerPoint.textContent = e.target.value;
        }
      }
    });
  });

  // ===== DRAG des vignettes (droite) avec synchronisation de la table (gauche) =====
  setupVignetteDragSync(gameUI);

  document.getElementById('gmBtnBackPlacePlayers')?.addEventListener('click', () => {
    gm.state.mode = 'selectRoles';
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('gmBtnStartGame')?.addEventListener('click', () => {
    // Mémorise la table (noms dans l'ordre) + enrichit les profils pour la prochaine partie
    const names = gm.state.players.map(p => (p.name || '').trim()).filter(Boolean);
    lgSaveLastTable(gm.state.players.map(p => (p.name || '').trim()));
    lgAddProfiles(names);
    // Si les rôles ont déjà été assignés (écran "Noms du deck"), on file direct à la nuit MDJ
    if (gm.state.rolesPreassigned) {
      gm.state.mdjMode = true;
      gm.state.gameInterface = 'mdj';
      gm.state.currentRoleIdx = 0;
      gm.state.nightStep = 1;
      gm.saveState();
      if (typeof gm.changePhase === 'function') gm.changePhase('firstNight');
      else { gm.state.mode = 'firstNight'; gameUI.render(); }
      return;
    }
    gm.state.mode = 'assignRoles';
    gm.state.currentRoleIdx = 0;
    gm.saveState();
    gameUI.render();
  });

  // Setup drag simple pour souris + tactile
  setupSimpleDrag(gameUI);
}

function setupVignetteDragSync(gameUI) {
  const gm = gameUI.gm;
  let draggedVignette = null;
  let draggedPlayerId = null;
  let placeholder = null;

  const getVignettesContainer = () => {
    return document.querySelector('[id*="gmRightColumn"]')?.querySelector('[style*="grid"]');
  };

  const getNearestVignetteIndex = (mouseY) => {
    const vignetttes = document.querySelectorAll('.gm-player-vignette');
    let nearest = 0;
    let minDist = Infinity;

    vignetttes.forEach((v, idx) => {
      const rect = v.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - mouseY);
      if (dist < minDist) {
        minDist = dist;
        nearest = idx;
      }
    });

    return nearest;
  };

  const showPlaceholder = (index) => {
    // Créer un placeholder visuel
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.style.cssText = 'height:40px; border:2px dashed #81dff7; background:rgba(129,223,247,0.1); border-radius:4px; margin:2px; transition:all 0.2s;';
    }
  };

  document.querySelectorAll('.gm-player-vignette').forEach(vignette => {
    vignette.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      draggedVignette = vignette;
      draggedPlayerId = vignette.dataset.playerId;
      vignette.style.opacity = '0.5';
      vignette.style.border = '2px solid #81dff7';
    });

    vignette.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'INPUT') return;
      draggedVignette = vignette;
      draggedPlayerId = vignette.dataset.playerId;
      vignette.style.opacity = '0.5';
      vignette.style.border = '2px solid #81dff7';
      e.preventDefault();
    }, { passive: false });
  });

  // Suivi tactile: memoriser la position du doigt pour le reordonnancement
  let lastTouchY = 0;
  document.addEventListener('touchmove', (e) => {
    if (!draggedVignette || e.touches.length === 0) return;
    lastTouchY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!draggedVignette || !draggedPlayerId) return;
    const draggedIdx = Array.from(document.querySelectorAll('.gm-player-vignette')).indexOf(draggedVignette);
    const targetIdx = getNearestVignetteIndex(lastTouchY);
    if (draggedIdx !== targetIdx && targetIdx >= 0) {
      const players = gm.state.players;
      const draggedPlayer = players.find(p => p.id === draggedPlayerId);
      const draggedPlayerIdx = players.indexOf(draggedPlayer);
      players.splice(draggedPlayerIdx, 1);
      players.splice(targetIdx, 0, draggedPlayer);
      gm.saveState();
      gameUI.render();
      return;
    }
    draggedVignette.style.opacity = '1';
    draggedVignette.style.border = 'none';
    draggedVignette = null;
    draggedPlayerId = null;
  }, { passive: false });

  document.addEventListener('mousemove', (e) => {
    if (!draggedVignette) return;

    // Calculer l'index cible
    const targetIdx = getNearestVignetteIndex(e.clientY);
    const draggedIdx = Array.from(document.querySelectorAll('.gm-player-vignette')).indexOf(draggedVignette);

    // Trait visuel: repousser les autres points
    const point = document.querySelector(`.gm-player-point[data-player-id="${draggedPlayerId}"]`);
    if (point) {
      // Animation de l'indicateur
      const svg = document.getElementById('gmDragLines');
      if (svg) {
        svg.innerHTML = `
          <circle cx="120" cy="120" r="10" fill="#81dff7" opacity="0.3" />
          <line x1="0" y1="120" x2="240" y2="120" stroke="#81dff7" stroke-width="1" stroke-dasharray="5,5" opacity="0.5" />
          <line x1="120" y1="0" x2="120" y2="240" stroke="#81dff7" stroke-width="1" stroke-dasharray="5,5" opacity="0.5" />
        `;
      }
    }
  });

  document.addEventListener('mouseup', () => {
    if (!draggedVignette || !draggedPlayerId) return;

    // Calculer la nouvelle position
    const draggedIdx = Array.from(document.querySelectorAll('.gm-player-vignette')).indexOf(draggedVignette);
    const targetIdx = getNearestVignetteIndex(event?.clientY || 0);

    // Réorganiser les joueurs
    if (draggedIdx !== targetIdx) {
      const players = gm.state.players;
      const draggedPlayer = players.find(p => p.id === draggedPlayerId);
      const draggedPlayerIdx = players.indexOf(draggedPlayer);

      // Supprimer et réinsérer
      players.splice(draggedPlayerIdx, 1);
      players.splice(targetIdx, 0, draggedPlayer);

      gm.saveState();
      gameUI.render();
    }

    draggedVignette.style.opacity = '1';
    draggedVignette.style.border = 'none';
    draggedVignette = null;
    draggedPlayerId = null;

    // Effacer SVG
    const svg = document.getElementById('gmDragLines');
    if (svg) svg.innerHTML = '';
  });

}

function setupSimpleDrag(gameUI) {
  const container = document.getElementById('gmPlayersContainer');
  if (!container) return;

  let dragging = null;
  let offset = { x: 0, y: 0 };

  const onMove = (clientX, clientY) => {
    if (!dragging) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left - offset.x;
    const y = clientY - rect.top - offset.y;

    // Limiter aux frontières du conteneur
    const boundX = Math.max(0, Math.min(x, rect.width - 16));
    const boundY = Math.max(0, Math.min(y, rect.height - 16));

    dragging.el.style.left = boundX + 'px';
    dragging.el.style.top = boundY + 'px';
  };

  const onEnd = () => {
    if (!dragging) return;

    // Sauvegarder la position
    const player = gameUI.gm.state.players.find(p => p.id === dragging.id);
    if (player) {
      player.tableX = parseFloat(dragging.el.style.left);
      player.tableY = parseFloat(dragging.el.style.top);
      gameUI.gm.saveState();
    }

    dragging.el.style.opacity = '1';
    dragging = null;
  };

  // Ajouter des listeners sur chaque point
  document.querySelectorAll('.gm-player-point').forEach(point => {
    // SOURIS
    point.addEventListener('mousedown', (e) => {
      const rect = point.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;
      dragging = { el: point, id: point.dataset.playerId };
      point.style.opacity = '0.7';
    });

    // TACTILE
    point.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = point.getBoundingClientRect();
      offset.x = touch.clientX - rect.left;
      offset.y = touch.clientY - rect.top;
      dragging = { el: point, id: point.dataset.playerId };
      point.style.opacity = '0.7';
      e.preventDefault();
    }, { passive: false });
  });

  // Événements globaux
  document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', onEnd);

  // passive:false pour bloquer le scroll de la page pendant le drag tactile
  document.addEventListener('touchmove', (e) => {
    if (dragging && e.touches.length > 0) {
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', onEnd, { passive: false });
}
