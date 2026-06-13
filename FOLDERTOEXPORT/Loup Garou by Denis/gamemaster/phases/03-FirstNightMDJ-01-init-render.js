// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  /**
   * Helper: Get player name from ID
   * Used to display player names instead of IDs in all logs and UI
   */
  getPlayerName(playerId) {
    if (!playerId) return '???';
    const players = this.gm?.state?.players || [];
    const player = players.find(p => p.id === playerId);
    return player?.name || playerId; // Fallback to ID if not found
  }
,


  /**
   * Helper: Get player display name with mayor medal if applicable
   * Shows "🎖️ Name" if player is the elected mayor
   */
  getPlayerDisplayName(playerId) {
    const name = this.getPlayerName(playerId);
    if (this.mayorId && this.mayorId === playerId) {
      return `🎖️ ${name}`;
    }
    return name;
  }
,


  /**
   * Quick save: Save game state after ANY action
   * Called after every player selection, role action, etc.
   */
  quickSave() {
    if (this.gm && typeof this.gm.saveState === 'function') {
      this.gm.saveState();
    }
    if (window.gameUI && typeof window.gameUI.saveGameStateToCache === 'function') {
      window.gameUI.saveGameStateToCache();
    }
  }
,


  /**
   * Helper: Get all protected players (Salvateur protection)
   * Returns Set of player IDs that are protected
   */
  getProtectedPlayers() {
    const protectedSet = new Set();
    // [STANDARDISATION] Tout role "protecteur" immunise sa/ses cible(s), pas seulement le Salvateur.
    const protectTypes = new Set(['protect', 'tankProtection', 'amuletProtection', 'bless']);
    Object.entries(this.roleStates).forEach(([roleId, st]) => {
      if (!st || !st.completed || !st.result || !st.result.targets) return;
      const rd = this.rolesLoader.getRole(roleId) || {};
      const blocks = rd.actions ? Object.values(rd.actions) : [];
      const isProtector = roleId === 'Salvateur' ||
        blocks.some(b => b && typeof b === 'object' && protectTypes.has(b.type));
      if (!isProtector) return;
      st.result.targets.forEach(targetId => {
        if (targetId && !String(targetId).startsWith('potion-')) protectedSet.add(targetId);
      });
    });
    return protectedSet;
  }
,


  /**
   * Un role de loup chasse TOUTES les nuits.
   */
  isWolfRoleId(roleId) {
    if (!roleId) return false;
    // [STANDARDISATION] priorite a la balise JSON isWolf, fallback sur le nom
    const rd = this.rolesLoader?.getRole?.(roleId);
    if (rd && typeof rd.isWolf === 'boolean') return rd.isWolf;
    return roleId.includes('Loup') || roleId.includes('Wolf');
  }
,


  /**
   * Determine si le role agit cette nuit (currentNight), avec garantie loups.
   */
  /** Un loup (assigné) est-il mort ? (pour le Grand Méchant Loup) */
  anyWolfDead() {
    return (this.gm?.state?.players || []).some(p => this.isWolfRoleId(p.role) && this.deadPlayerIds.has(p.id));
  }
,

  /** L'Ancien a-t-il été tué PAR LE VILLAGE (vote / Sorcière / Chasseur) ?
   *  Si oui, les villageois à pouvoir perdent leurs pouvoirs. */
  ancienKilledByVillage() {
    const ps = this.gm?.state?.players || [];
    const ancien = ps.find(p => p.role === 'Ancien');
    if (!ancien || !this.deadPlayerIds.has(ancien.id)) return false;
    const c = this.deathCauses && this.deathCauses[ancien.id];
    return c === 'lynch' || c === 'poison' || c === 'chasseur';
  }
,

  roleActsThisNight(roleId) {
    const roleData = this.rolesLoader.getRole(roleId) || {};
    const n = this.currentNight;

    // Grand Méchant Loup : 2e victime UNIQUEMENT tant qu'aucun loup n'est mort.
    // Une fois un loup mort, il n'a plus de tour dédié (il chasse avec la meute).
    if (roleId === 'Grand_Mechant_Loup' && this.anyWolfDead()) return false;

    // Ancien tué par le village → les VILLAGEOIS à pouvoir n'agissent plus (plus que les loups).
    if (this.ancienKilledByVillage() && roleData.camp === 'Village' && !this.isWolfRoleId(roleId)) return false;

    // Sorcière : si elle n'a plus aucune potion (inventaire vide), on passe son tour.
    if (roleId === 'Sorciere') {
      const inv = this.gm.state.sorciereInv;
      if (inv && (inv.life || 0) <= 0 && (inv.death || 0) <= 0) return false;
    }

    // 1) Planning explicite par nightActive (prioritaire). Ex: Loup Blanc n'a PAS
    //    de nightActive -> on passe a la phase ci-dessous.
    const nightActive = roleData.nightActive || [];
    if (nightActive.length > 0) return nightActive.includes(n);

    // 2) Planning via la "phase" d'une action (ex: Loup Garou Blanc = everyOtherNight)
    let phase = null;
    if (roleData.actions && typeof roleData.actions === 'object') {
      for (const v of Object.values(roleData.actions)) {
        if (v && typeof v === 'object' && v.phase && v.enabled !== false) { phase = v.phase; break; }
      }
    }
    if (phase) {
      const even = (n % 2 === 0);
      switch (phase) {
        case 'everyNight': return true;
        case 'everyOtherNight': return even;        // nuits paires (2,4,6...) -> Loup Blanc
        case 'everyNightFrom2': return n >= 2;
        case 'everyNightFirst3': return n <= 3;
        case 'firstNight': return n === 1;
        default: break;
      }
    }

    // 3) Filet de securite: un loup "de meute" SANS planning chasse chaque nuit.
    if (this.isWolfRoleId(roleId)) return true;

    return false;
  }
,

  /**
   * [STANDARDISATION] IDs de roles LOUPS assignes a des joueurs, dans l'ordre JSON.
   * Remplace les listes de loups codees en dur. Base sur la balise isWolf.
   */
  getWolfKillRoleIds() {
    const assigned = new Set((this.gm?.state?.players || []).map(p => p.role));
    const ordered = (this.rolesLoader.getOrderedRoleIds ? this.rolesLoader.getOrderedRoleIds() : [...assigned]);
    return ordered.filter(rid => assigned.has(rid) && this.isWolfRoleId(rid));
  }
,

  /**
   * [STANDARDISATION] IDs de roles dont l'action nocturne provoque des morts
   * (loups + roles a potion/poison/kill). Remplace ['...loups...','Sorciere'].
   */
  getDeathDealingRoleIds() {
    const deadlyTypes = new Set(['potions','poison','kill','extraKill','bonusKill','hunt','huntSelectively']);
    const assigned = new Set((this.gm?.state?.players || []).map(p => p.role));
    const ordered = (this.rolesLoader.getOrderedRoleIds ? this.rolesLoader.getOrderedRoleIds() : [...assigned]);
    return ordered.filter(rid => {
      if (!assigned.has(rid)) return false;
      if (this.isWolfRoleId(rid)) return true;
      const rd = this.rolesLoader.getRole(rid);
      const blocks = rd && rd.actions ? Object.values(rd.actions) : [];
      return blocks.some(b => b && typeof b === 'object' && deadlyTypes.has(b.type));
    });
  }
,


  /**
   * Check if a role has an action that's active for this night phase
   * Handles: firstNight, everyNight, everyOtherNight, etc.
   * @param {string} roleId
   * @returns {boolean}
   */
  hasActionForPhase(roleId) {
    const roleData = this.rolesLoader.getRole(roleId);
    if (!roleData) return false;

    // Check standard mdj_night_actions field
    if (roleData.actions?.mdj_night_actions && roleData.actions.mdj_night_actions.length > 0) {
      console.log(`[MDJ] ${roleId} has mdj_night_actions`);
      return true;
    }

    // Determine current night number: this is FirstNight = night 1
    const currentNightNumber = 1;
    const isEvenNight = currentNightNumber % 2 === 0;
    const isOddNight = currentNightNumber % 2 === 1;

    // Check if role has actions object with phase-dependent actions
    if (roleData.actions && typeof roleData.actions === 'object') {
      for (const [actionKey, actionData] of Object.entries(roleData.actions)) {
        // Skip mdj_night_actions field
        if (actionKey === 'mdj_night_actions') continue;

        // Check if this is an action object (not a string)
        if (typeof actionData === 'object' && actionData.enabled !== false) {
          const phase = actionData.phase;
          let isActiveThisNight = false;

          // Check if action is active for this night based on phase
          if (!phase) {
            // No phase = always active
            isActiveThisNight = true;
          } else if (phase === 'everyNight') {
            // Active every night
            isActiveThisNight = true;
          } else if (phase === 'firstNight') {
            // Active only on first night
            isActiveThisNight = (currentNightNumber === 1);
          } else if (phase === 'everyOtherNight') {
            // Active on even nights (2, 4, 6, etc.)
            isActiveThisNight = isEvenNight;
          } else if (phase === 'afterFirstNight') {
            // Active after first night (nights 2+)
            isActiveThisNight = (currentNightNumber > 1);
          }

          if (isActiveThisNight) {
            console.log(`[MDJ] ${roleId} action "${actionKey}" ACTIVE for night ${currentNightNumber} (phase: ${phase || 'none'})`);
            return true;
          } else {
            console.log(`[MDJ] ${roleId} action "${actionKey}" INACTIVE for night ${currentNightNumber} (phase: ${phase})`);
          }
        }
      }
    }

    return false;
  }
,


  /**
   * Initialize tracking for all active roles
   * Uses same filter logic as renderRoleListbox() for consistency
   */
  initializeRoleStates() {
    const orderedRoles = this.rolesLoader.getOrderedRoleIds();
    const players = this.gm.state.players || [];
    const assignedRoleIds = new Set(players.map(p => p.role));

    orderedRoles.forEach(roleId => {
      // Only initialize roles that are ASSIGNED to players
      if (!assignedRoleIds.has(roleId)) return;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return;

      // Check if role has night actions ACTIVE FOR THIS PHASE
      // If actionType is NightActive, still need to verify action is active for THIS phase
      let hasNightAction = false;

      if (roleData.actionType === 'NightActive') {
        // Even NightActive roles must have an action for this phase
        hasNightAction = this.hasActionForPhase(roleId);
      } else {
        // Non-NightActive roles might still have mdj_night_actions
        hasNightAction = this.hasActionForPhase(roleId);
      }

      if (hasNightAction) {
        this.roleStates[roleId] = {
          completed: false,
          selected: false,
          result: null
        };
      }
    });

    // CRITICAL: Initialize ALL WOLF ROLES regardless of orderedRoles
    // Simple_Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc need to be in roleStates
    // so their kills are saved and can be retrieved by Sorciere
    assignedRoleIds.forEach(roleId => {
      // Only if not already initialized above
      if (this.roleStates[roleId]) return;

      // Check if this is a wolf role qui agit CETTE nuit (ex: Loup Blanc seulement nuits paires)
      if (this.isWolfRoleId(roleId) && this.roleActsThisNight(roleId)) {
        console.log(`[MDJ] Initializing wolf role: ${roleId}`);
        this.roleStates[roleId] = {
          completed: false,
          selected: false,
          result: null
        };
      }
    });

  }
,


  /**
   * Initialize the first night MDJ phase
   */
  init() {
    // Log night start if logger has this method
    if (this.logger && typeof this.logger.logNightStart === 'function') {
      this.logger.logNightStart(1);
    }
    this.render();
    this.attachEvents();
  }
,


  /**
   * Main render method - Table+Legend (LEFT) | Roles (CENTER/BLUE) | Actions (RIGHT/PINK)
   */
  render() {
    // CRITICAL: Clear cached player positions so they're recalculated with new table size
    if (this.gm.state.players) {
      this.gm.state.players.forEach(p => {
        delete p.tableX;
        delete p.tableY;
      });
    }

    this.container.innerHTML = `
      <div class="mdj-main-container">
        <!-- LEFT: Live Map Table + Legend -->
        <div class="mdj-left-panel">
          <div class="panel-header-compact">👥 LA TABLE</div>
          <div class="mdj-live-map" id="mdj-live-map"></div>
          <div class="mdj-victory-bar" id="mdj-victory-bar"></div>
        </div>

        <!-- RESIZE HANDLE -->
        <div class="mdj-resize-handle" id="resize-left-center"></div>

        <!-- CENTER: Blue Role List Zone -->
        <div class="mdj-center-panel">
          <div class="mdj-role-list-wrapper">
            <div class="role-list-header">🌙 Nuit 1</div>
            <div class="role-list-blue" id="role-listbox"></div>
          </div>
        </div>

        <!-- RESIZE HANDLE -->
        <div class="mdj-resize-handle" id="resize-center-right"></div>

        <!-- RIGHT: Pink Action Zone -->
        <div class="mdj-right-panel">
          <div class="mdj-action-zone" id="action-zone">
            <div class="action-title-big" id="action-title-big"></div>
            <div class="action-controls" id="action-controls"></div>
            <div class="action-info" id="action-info"></div>
          </div>
        </div>
      </div>
    `;

    this.ensureStyles();
    this.renderLiveMap();
    this.renderRoleListbox();
    this.attachResizeHandlers();
    this.logDimensions();
  }
,


  /**
   * Render the live map avec emoji et couleurs du JSON
   * IMPORTANT: Table scaled to fit entirely in left panel
   */
  getPlayerCamp(player) {
    if (player.camp === 'Loup' || player.camp === 'Loups') return 'Loups';
    const roleData = this.rolesLoader.getRole(player.role) || {};
    const camp = roleData.camp || 'Village';
    if (camp === 'Loups' || camp === 'Loups-Garous') return 'Loups';
    if (camp === 'Seul') return roleData.name || player.role;
    return 'Village';
  }
,


  // Recalcule les camps et declenche la victoire immediatement (independant du DOM).
  // Utilise apres CHAQUE mort (tir du Chasseur, lynch, cascade) pour ne pas attendre.
  // ---- Journal de partie horodaté (chronologique, persistant) ----
  journalLog(text, opts) {
    if (!text) return;
    try {
      if (!Array.isArray(this.gm.state.gameJournal)) this.gm.state.gameJournal = [];
      const now = new Date();
      const pad = (x) => String(x).padStart(2, '0');
      const date = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();
      const time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      this.gm.state.gameJournal.push({
        ts: now.getTime(), date, time,
        night: (opts && opts.night != null) ? opts.night : (this.currentNight || 1),
        kind: (opts && opts.kind) || 'event',
        text
      });
      if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
    } catch (_) {}
  }
,
  getJournal() { return this.gm.state.gameJournal || []; }
,
  // Journalise une seule fois le début de partie (joueurs + assignation + NUIT 1)
  logGameStartOnce() {
    try {
      if (this.gm.state._journalStarted) return;
      const players = this.gm.state.players || [];
      if (!players.length || !players.every(p => p.role)) return;
      this.gm.state._journalStarted = true;
      const names = players.map(p => p.name).join(', ');
      this.journalLog('🎬 Début de partie — joueurs : ' + names, { kind: 'phase' });
      this.journalLog('🃏 ASSIGNATION des rôles :', { kind: 'phase' });
      players.forEach(p => {
        const rd = this.rolesLoader.getRole(p.role) || {};
        this.journalLog('• ' + p.name + ' = ' + (rd.name || p.role || '?'), { kind: 'assign' });
      });
      this.journalLog('━━━━━━━━━ NUIT 1 ━━━━━━━━━', { kind: 'nightsep', night: 1 });
    } catch (_) {}
  }
,
  // ---- Historique des "mouvements" par joueur (pour la fiche joueur) ----
  logPlayerEvent(playerId, text) {
    if (!playerId || !text) return;
    try {
      if (!this.gm.state.playerHistory) this.gm.state.playerHistory = {};
      const h = this.gm.state.playerHistory;
      if (!h[playerId]) h[playerId] = [];
      const night = this.currentNight || 1;
      const last = h[playerId][h[playerId].length - 1];
      if (!last || last.night !== night || last.text !== text) {
        h[playerId].push({ night, text });
        const nm = this.getPlayerName ? this.getPlayerName(playerId) : playerId;
        this.journalLog(nm + ' : ' + text);   // journal global chronologique
        if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
      }
    } catch (_) {}
  }
,
  getPlayerHistory(playerId) {
    return (this.gm.state.playerHistory && this.gm.state.playerHistory[playerId]) || [];
  }
,

  checkVictoryNow() {
    const players = this.gm.state.players || [];
    const alive = players.filter(p => !this.deadPlayerIds.has(p.id));
    let village = 0, loups = 0;
    const solos = {};
    alive.forEach(p => {
      const camp = this.getPlayerCamp(p);
      if (camp === 'Village') village++;
      else if (camp === 'Loups') loups++;
      else solos[camp] = (solos[camp] || 0) + 1;
    });
    if (typeof this.renderVictoryBar === 'function') this.renderVictoryBar();
    this.maybeShowVictory(village, loups, solos, alive.length);
  }
,

  renderVictoryBar() {
    const bar = document.getElementById('mdj-victory-bar');
    if (!bar) return;
    const players = this.gm.state.players || [];
    const alive = players.filter(p => !this.deadPlayerIds.has(p.id));
    let village = 0, loups = 0;
    const solos = {};
    alive.forEach(p => {
      const camp = this.getPlayerCamp(p);
      if (camp === 'Village') village++;
      else if (camp === 'Loups') loups++;
      else solos[camp] = (solos[camp] || 0) + 1;
    });
    const total = Math.max(village + loups, 1);
    const villagePct = Math.round((village / total) * 100);
    let status = '';
    if (loups === 0 && village > 0) {
      status = '<span style="color:#4dd0e1; font-weight:700;">\u{1F3C6} Village vainqueur — plus aucun loup</span>';
    } else if (loups >= village) {
      status = '<span style="color:#ff6b6b; font-weight:700;">\u{1F43A} Loups vainqueurs — parite atteinte</span>';
    } else {
      const reste = village - loups; // nb d'eliminations cote Village pour atteindre la parite (= victoire Loups)
      status = `<span style="color:#ffb38a;">\u{1F43A} Parite des Loups dans <b>${reste}</b> elimination${reste>1?'s':''} cote Village</span>`;
    }
    const soloHtml = Object.keys(solos).length > 0
      ? `<div style="font-size:9px; color:#e0a0ff; margin-top:4px;">Camps solo en vie : ${Object.entries(solos).map(([n,c]) => `${n} (${c})`).join(', ')}</div>`
      : '';
    bar.innerHTML = `
      <div style="padding:6px 8px; background:rgba(0,0,0,0.25); border-radius:6px; border:1px solid rgba(199,125,255,0.2);">
        <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; margin-bottom:3px;">
          <span style="color:#4dd0e1;">\u{1F3D8}\uFE0F Village ${village}</span>
          <span style="color:#ff6b6b;">${loups} Loups \u{1F43A}</span>
        </div>
        <div style="position:relative; height:14px; border-radius:7px; overflow:hidden; background:#ff6b6b; box-shadow:inset 0 0 4px rgba(0,0,0,0.5);">
          <div style="position:absolute; left:0; top:0; bottom:0; width:${villagePct}%; background:linear-gradient(90deg,#1a78c2,#4dd0e1); transition:width 0.4s ease;"></div>
          <div style="position:absolute; left:50%; top:0; bottom:0; width:2px; background:rgba(255,255,255,0.7);"></div>
        </div>
        <div style="font-size:9px; margin-top:4px; text-align:center;">${status}</div>
        ${soloHtml}
      </div>
    `;

    // Detection de fin de partie
    this.maybeShowVictory(village, loups, solos, alive.length);
  }
,

  /**
   * Determine s'il y a un vainqueur et affiche l'overlay (une seule fois).
   */
  maybeShowVictory(village, loups, solos, aliveCount) {
    if (this.victoryShown) return;
    const soloNames = Object.keys(solos);
    const soloCount = soloNames.length;
    let win = null; // {label, sub, color}

    if (aliveCount === 0) {
      win = { label: 'Tout le monde est mort', sub: 'Aucun camp ne l\'emporte', color: '#888' };
    } else if (loups === 0 && soloCount === 0 && village > 0) {
      win = { label: 'VICTOIRE DES VILLAGEOIS !', sub: 'Plus aucun loup en vie', color: '#4dd0e1', emoji: '\u{1F3D8}\uFE0F' };
    } else if (village === 0 && soloCount === 0 && loups > 0) {
      win = { label: 'VICTOIRE DES LOUPS-GAROUS !', sub: 'Le village est decime', color: '#ff6b6b', emoji: '\u{1F43A}' };
    } else if (loups === 0 && village === 0 && soloCount === 1) {
      win = { label: `VICTOIRE : ${soloNames[0]} !`, sub: 'Dernier survivant de son camp', color: '#e0a0ff', emoji: '\u{1F3AD}' };
    } else if (loups > 0 && village > 0 && loups >= village && soloCount === 0) {
      win = { label: 'VICTOIRE DES LOUPS-GAROUS !', sub: 'Parite atteinte : les loups controlent le village', color: '#ff6b6b', emoji: '\u{1F43A}' };
    }
    if (!win) return;
    this.victoryShown = true;
    this.showVictoryOverlay(win);
  }
,

  showVictoryOverlay(win) {
    if (document.getElementById('mdj-victory-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'mdj-victory-overlay';
    ov.style.cssText = 'position:fixed; inset:0; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.86); backdrop-filter:blur(3px); animation:mdjVictoryFade 0.5s ease;';
    ov.innerHTML = `
      <style>
        @keyframes mdjVictoryFade { from { opacity:0; } to { opacity:1; } }
        @keyframes mdjVictoryPop { 0% { transform:scale(0.6); opacity:0; } 60% { transform:scale(1.08); } 100% { transform:scale(1); opacity:1; } }
      </style>
      <div style="text-align:center; animation:mdjVictoryPop 0.6s cubic-bezier(.2,.9,.3,1.3); padding:32px 40px; border:3px solid ${win.color}; border-radius:18px; background:linear-gradient(135deg, rgba(20,20,40,0.95), rgba(35,25,55,0.95)); box-shadow:0 0 60px ${win.color}66;">
        <div style="font-size:64px; margin-bottom:8px;">${win.emoji || '\u{1F3C6}'}</div>
        <div style="font-size:34px; font-weight:900; color:${win.color}; letter-spacing:1px; text-shadow:0 0 18px ${win.color}88;">${win.label}</div>
        <div style="font-size:15px; color:#ddd; margin-top:10px;">${win.sub}</div>
        <button id="mdj-victory-close" style="margin-top:22px; padding:12px 28px; font-size:15px; font-weight:700; color:#fff; background:${win.color}; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 14px ${win.color}55;">🔄 Retour au choix des cartes</button>
      </div>
    `;
    document.body.appendChild(ov);
    ov.querySelector('#mdj-victory-close')?.addEventListener('click', () => {
      ov.remove();
      try {
        const gm = this.gm;
        if (gm && typeof gm.resetState === 'function') gm.resetState();
        if (gm) { gm.state.mode = 'selectRoles'; gm.saveState && gm.saveState(); }
        const ui = window.gameUI || (gm && gm.ui);
        if (ui && typeof ui.render === 'function') ui.render();
        else if (gm && typeof gm.changePhase === 'function') gm.changePhase('selectRoles');
      } catch (e) { console.error('[MDJ] retour choix cartes échoué', e); }
    });
  }

});
