// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  renderLiveMap() {
    const mapContainer = document.getElementById('mdj-live-map');
    if (!mapContainer) return;

    this.renderVictoryBar();

    console.log(`[MDJ] renderLiveMap called - mayorId: ${this.mayorId}`);

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};


    // Récupérer les positions
    if (!this.gm.state.playerPositions) {
      this.gm.state.playerPositions = {};
    }

    // Afficher les joueurs avec leur rôle (couleur + emoji du JSON)
    // Disposition "piste de course" - joueurs sur les bords, noms à l'opposé, équidistant
    const playerPoints = players.map((p, idx) => {
      let x, y, nameTop, nameLeft;

      if (p.tableX !== undefined && p.tableY !== undefined) {
        x = p.tableX;
        y = p.tableY;
        nameTop = p.nameTop || '30px';
        nameLeft = p.nameLeft || '-40px';
      } else {
        const tableSize = 340; // Logical size; CSS will scale it - increased for better spacing
        const perimeter = 2 * (tableSize + tableSize);
        const playerSpacing = perimeter / players.length;
        const pos = idx * playerSpacing;

        // Place players around the perimeter
        let textAlign = 'center';

        if (pos < tableSize) {
          // TOP edge: left to right
          x = pos;
          y = 0;
          // All TOP positions: label goes BELOW and CENTERED
          if (pos < 50) {
            // TOP-LEFT corner: label goes bottom-right diagonal
            x = Math.max(30, pos);
            y = 15;
            nameTop = '22px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (pos > tableSize - 50) {
            // TOP-RIGHT corner: label goes bottom-left diagonal
            x = Math.min(tableSize - 30, pos);
            y = 15;
            nameTop = '22px';
            nameLeft = '-44px';
            textAlign = 'right';
          } else {
            // TOP middle: label centered below
            nameTop = '22px';
            nameLeft = '-28px';
            textAlign = 'center';
          }
        } else if (pos < tableSize * 2) {
          // RIGHT edge: top to bottom
          x = tableSize - 20;
          y = pos - tableSize;
          const yPos = y;
          // All RIGHT positions: label goes LEFT
          if (yPos < 50) {
            // TOP-RIGHT corner: label goes bottom-left diagonal
            x = tableSize - 30;
            y = Math.max(15, yPos);
            nameTop = '16px';
            nameLeft = '-42px';
            textAlign = 'right';
          } else if (yPos > tableSize - 50) {
            // BOTTOM-RIGHT corner: label goes top-left diagonal
            x = tableSize - 30;
            y = Math.min(tableSize - 15, yPos);
            nameTop = '-34px';
            nameLeft = '-42px';
            textAlign = 'right';
          } else {
            // RIGHT middle: label goes left, centered vertically
            nameTop = '-8px';
            nameLeft = '-42px';
            textAlign = 'right';
          }
        } else if (pos < tableSize * 3) {
          // BOTTOM edge: right to left
          x = tableSize - (pos - tableSize * 2);
          y = tableSize;
          // All BOTTOM positions: label goes ABOVE and CENTERED
          if (x < 50) {
            // BOTTOM-LEFT corner: label goes top-right diagonal
            x = Math.max(30, x);
            y = tableSize - 15;
            nameTop = '-34px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (x > tableSize - 50) {
            // BOTTOM-RIGHT corner: label goes top-left diagonal
            x = Math.min(tableSize - 30, x);
            y = tableSize - 15;
            nameTop = '-34px';
            nameLeft = '-44px';
            textAlign = 'right';
          } else {
            // BOTTOM middle: label centered above
            nameTop = '-34px';
            nameLeft = '-28px';
            textAlign = 'center';
          }
        } else {
          // LEFT edge: bottom to top
          x = 0;
          y = tableSize - (pos - tableSize * 3);
          const yPos = y;
          // All LEFT positions: label goes RIGHT
          if (yPos < 50) {
            // TOP-LEFT corner: label goes bottom-right diagonal
            x = 30;
            y = Math.max(15, yPos);
            nameTop = '16px';
            nameLeft = '6px';
            textAlign = 'left';
          } else if (yPos > tableSize - 50) {
            // BOTTOM-LEFT corner: label goes top-right diagonal
            x = 30;
            y = Math.min(tableSize - 15, yPos);
            nameTop = '-34px';
            nameLeft = '6px';
            textAlign = 'left';
          } else {
            // LEFT middle: label goes right, centered vertically
            nameTop = '-8px';
            nameLeft = '6px';
            textAlign = 'left';
          }
        }

        p.tableX = x;
        p.tableY = y;
        p.nameTop = nameTop;
        p.nameLeft = nameLeft;
        p.textAlign = textAlign;
      }

      // Récupérer les infos du rôle assigné
      const roleData = rolesData[p.role] || {};
      const emoji = roleData.emoji || '❓';
      const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
      const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';
      const affectedBorderColor = roleData.visual?.affectedColor?.borderColor || 'transparent';


      // Check if this player has the currently selected role (for breathing effect)
      // When Simple_Loup_Garou is called, ALL wolves breathe together
      // For other roles, each role breathes independently
      let isCurrentRole = p.role === this.selectedRoleId;

      if (this.selectedRoleId === 'Simple_Loup_Garou') {
        // ALL wolves breathe when wolves are deciding on victim
        // EXCEPT Chien_Loup if they chose to stay villager
        // EXCEPT dead wolves - don't breathe if dead
        const isChienLoupStayVillager = p.role === 'Chien_Loup' &&
          this.roleStates['Chien_Loup']?.result?.targets?.includes('stay_villager');
        const isDead = this.deadPlayerIds.has(p.id);

        isCurrentRole = !isDead && !isChienLoupStayVillager && p.role && (p.role.includes('Loup') || p.role.includes('Wolf'));
        if (isCurrentRole) {
          console.log(`[MDJ] 🐺 Wolf pack breathing for: ${p.name} (${p.role})`);
        }
      } else if (p.role === this.selectedRoleId) {
        console.log(`[MDJ] 🫁 Breathing for: ${p.name} (${p.role}) - selectedRoleId: ${this.selectedRoleId}`);
        isCurrentRole = true;
      } else {
        // Debug: show why breathing not applied
        if (p.role === 'Cupidon' || this.selectedRoleId === 'Cupidon') {
          console.log(`[MDJ] DEBUG Cupidon: p.role=${p.role}, selectedRoleId=${this.selectedRoleId}, match=${p.role === this.selectedRoleId}`);
        }
      }

      const isDead = this.deadPlayerIds.has(p.id);
      const deadStyle = isDead ? 'filter: grayscale(100%) brightness(0.5); opacity: 0.6;' : '';

      const isMayor = this.mayorId && this.mayorId === p.id;
      if (isMayor) {
        console.log(`[MDJ] 🎖️ MAYOR BADGE: ${p.name} (${p.id}) - mayorId: ${this.mayorId}`);
      }
      const displayName = isMayor ? `🎖️ ${p.name}` : p.name;

      // Badge "tueur" : emoji + couleur de fond du tueur + tooltip "Tué par ..."
      const _cause = isDead ? (this.deathCauses && this.deathCauses[p.id]) : null;
      const _killerColor = (rid, fallback) => (rolesData[rid]?.visual?.roleColor?.fondColor) || fallback;
      const killerInfoMap = {
        wolf:      { emoji: '🐺', bg: _killerColor('Simple_Loup_Garou', '#b03030'), label: 'les Loups-Garous' },
        poison:    { emoji: '🧙‍♀️', bg: _killerColor('Sorciere', '#7a3aa0'), label: 'la Sorcière (potion)' },
        lynch:     { emoji: '🪓', bg: '#9966CC', label: 'le village (bûcher)' },
        chasseur:  { emoji: '🏹', bg: _killerColor('Chasseur', '#D4A574'), label: 'le Chasseur' },
        chevalier: { emoji: '⚔️', bg: _killerColor('Chevalier_Epee_Rouille', '#FFD700'), label: 'le Chevalier' },
        love:      { emoji: '💔', bg: _killerColor('Cupidon', '#D6899E'), label: 'amour (Cupidon)' },
        mdj:       { emoji: '🛟', bg: '#888', label: 'le Maître du Jeu (secours)' }
      };
      const killerInfo = _cause ? killerInfoMap[_cause] : null;
      const killerBadge = killerInfo
        ? `<span class="mdj-killer-badge" title="Tué par ${killerInfo.label}" style="position:absolute; top:-9px; right:-9px; font-size:12px; line-height:1; background:${killerInfo.bg}; border:1px solid rgba(255,255,255,0.65); border-radius:50%; padding:2px 3px; z-index:5; box-shadow:0 1px 3px rgba(0,0,0,0.6);">${killerInfo.emoji}</span>`
        : '';

      return `
        <div class="mdj-player-point ${isCurrentRole ? 'breathing' : ''}" data-player-id="${p.id}" data-player-name="${p.name}" data-original-emoji="${emoji}"
             style="left: ${x}px; top: ${y}px; position: absolute; ${deadStyle}">
          <div class="mdj-point-dot" style="background: ${bgColor}; --affected-border: ${affectedBorderColor}; position: relative;">
            <span class="mdj-point-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
            ${killerBadge}
            <span class="mdj-point-name" style="top: ${nameTop}; left: ${nameLeft}; text-align: ${p.textAlign};">${isDead ? '💀' : ''} ${displayName}</span>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="mdj-map-container">
        <div class="mdj-table-visual">
          <div class="mdj-table-center">🪵</div>
          <div class="mdj-table-rim"></div>
          ${playerPoints}
        </div>
      </div>
    `;

    mapContainer.innerHTML = html;

    // Tap / clic sur un joueur => ouvre sa fiche (statut + historique + secours tuer/revivre).
    // Fonctionne au tactile. Le clic gauche n'est pas utilisé pour la sélection de cible.
    mapContainer.querySelectorAll('.mdj-player-point').forEach(pt => {
      const open = (e) => { e.preventDefault(); e.stopPropagation(); this.openPlayerPopup(pt.dataset.playerId); };
      pt.addEventListener('click', open);
    });
  }
,


  // Fiche joueur (tactile) : statut + historique des "mouvements" + secours tuer/revivre.
  // ---- Audio MDJ (joue directement les fichiers du soundboard, sans ouvrir la fenêtre) ----
  mdjMusicList() {
    return [
      { name: '🌙 1ère Nuit',     file: '1ere Nuit - Harpfire Reliquary.mp3' },
      { name: '🐺 Nuit (Lycans)', file: 'Nuit - Wounded Ringers.mp3' },
      { name: '☀️ Jour (Village)', file: 'Jour - Salted Confession.mp3' },
      { name: '⚖️ Vote Final',     file: 'Vote Final - Gavel Thunder.mp3' },
      { name: '💀 Qui est mort ?', file: '05 Mission Objective.mp3' }
    ];
  }
,
  // Sons disponibles par rôle (depuis les catégories du soundboard). Plusieurs sons possibles.
  mdjRoleSounds(roleId) {
    const m = {
      Cupidon: [['Cupidon Firing Arrow.mp3', '🏹'], ['sims-2-falling-in-love.mp3', '🥰']],
      Enfant_Sauvage: [['virtualzero-boy-giggling-playful-laugh-hd-379353.mp3', '🚸']],
      Chien_Loup: [['stu9-dog-howl-2-352681.mp3', '🐶']],
      Montreur_Ours: [['universfield-bear-191995.mp3', '🐻']],
      Chevalier_Epee_Rouille: [['creatorshome-draw-a-sword-327726.mp3', '⚔️']],
      Voyante: [['universfield-mysterious-places-30s-159313.mp3', '🔮']],
      Renard: [['BANK_01_INSTR_0000_SND_006D.mp3', '🦊']],
      Salvateur: [['dragon-studio-holy-spell-cast-450460.mp3', '😇'], ['freesound_community-short-choir-6116.mp3', '👼']],
      Simple_Loup_Garou: [['Voicy_Howling werewolf sound effect.mp3', '🐺'], ['Voicy_Werewolves Sound Effects.mp3', '💀']],
      Grand_Mechant_Loup: [['universfield-wolf-howling-140235.mp3', '🐺']],
      Infect_Pere_Loups: [['Voicy_Werewolves Sound Effects - Copie.mp3', '🐺']],
      Loup_Garou_Blanc: [['alesiadavina-werewolf-sound-pain-wail-457328.mp3', '🐺']],
      Loup_Garou_Voyant: [['freesound_community-wolf-howl-6310.mp3', '🐺']],
      Sorciere: [['freesound_community-bubbles-003-6397.mp3', '🧋'], ['Witch Laughing.mp3', '😏']],
      Corbeau: [['dragon-studio-crow-caw-with-echoing-reverb-472375.mp3', '🐦‍⬛']]
    };
    return (m[roleId] || []).map(function (x) { return { file: x[0], label: x[1] }; });
  }
,
  mdjPlaySfx(file) {
    if (!file) return;
    try {
      const url = 'sfx/' + encodeURIComponent(file);
      const a = new Audio(url);
      a.volume = 1;
      this._mdjSfxAudio = a; // garde une référence (évite le ramasse-miettes)
      a.play().catch((err) => console.warn('[MDJ] son KO:', url, err));
    } catch (e) { console.warn('[MDJ] son exception:', e); }
  }
,
  mdjPlayMusic(file) {
    if (!file) return;
    try {
      this.mdjStopMusic();
      const a = new Audio(encodeURI('music/' + file));
      a.loop = true; a.volume = 0.6;
      a.play().catch(() => {});
      this._mdjMusicAudio = a;
    } catch (_) {}
  }
,
  mdjStopMusic() {
    try { if (this._mdjMusicAudio) { this._mdjMusicAudio.pause(); this._mdjMusicAudio = null; } } catch (_) {}
  }
,
  // Barre audio (en-tête d'action) : 1 bouton par son disponible pour le rôle (SFX uniquement).
  mdjAudioToolbarHtml(roleId) {
    const sounds = this.mdjRoleSounds(roleId);
    if (!sounds.length) return '';
    const b = 'border:none; border-radius:5px; padding:3px 7px; font-size:13px; cursor:pointer; color:#fff;';
    const sfxBtns = sounds.map(s => '<button class="mdj-sfx-btn" data-file="' + encodeURIComponent(s.file) + '" title="Jouer le son" style="' + b + ' background:rgba(120,90,200,0.8);">🔊' + s.label + '</button>').join('');
    return '<span style="float:right; display:inline-flex; gap:4px; align-items:center; flex-wrap:wrap; justify-content:flex-end; max-width:60%;">' + sfxBtns + '</span>';
  }
,
  mdjWireAudioToolbar(roleId) {
    document.querySelectorAll('.mdj-sfx-btn').forEach((bt) => {
      bt.addEventListener('click', (e) => { e.stopPropagation(); try { this.mdjPlaySfx(decodeURIComponent(bt.dataset.file || '')); } catch (_) {} });
    });
  }
,

  // Journal complet de la partie (horodaté, chronologique) en plein écran.
  openJournalOverlay() {
    const j = (typeof this.getJournal === 'function') ? this.getJournal() : [];
    const old = document.getElementById('mdj-journal-overlay');
    if (old) old.remove();

    const rows = j.length ? j.map(e => {
      if (e.kind === 'nightsep') return '<div style="margin:12px 0 6px; text-align:center; color:#81dff7; font-weight:800; letter-spacing:1px;">' + e.text + '</div>';
      if (e.kind === 'phase') return '<div style="margin-top:8px; font-weight:800; color:#e0a0ff;"><span style="opacity:.6; font-weight:400; font-size:11px;">' + e.date + ' ' + e.time + '</span> — ' + e.text + '</div>';
      if (e.kind === 'assign') return '<div style="padding-left:16px; color:#bfe9ff; font-size:12px;">' + e.text + '</div>';
      return '<div style="font-size:12px; color:#e8e8f0; padding:1px 0;"><span style="opacity:.55;">' + e.date + ' ' + e.time + '</span> : ' + e.text + '</div>';
    }).join('') : '<div style="opacity:.6;">Journal vide pour l\'instant.</div>';

    const plain = j.map(e => (e.kind === 'nightsep' ? '\n' + e.text + '\n' : (e.date + ' ' + e.time + ' : ' + e.text))).join('\n');

    const ov = document.createElement('div');
    ov.id = 'mdj-journal-overlay';
    ov.style.cssText = 'position:fixed; inset:0; z-index:100001; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(2px);';
    ov.innerHTML =
      '<div style="width:min(620px,94vw); height:min(80vh,720px); display:flex; flex-direction:column; background:linear-gradient(135deg,#161a28,#241f38); border:2px solid rgba(199,125,255,0.5); border-radius:12px; box-shadow:0 12px 48px rgba(0,0,0,0.6); color:#e8e8f0; overflow:hidden;">'
      + '<div style="display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid rgba(199,125,255,0.3); background:rgba(0,0,0,0.25);">'
      +   '<span style="font-size:18px; font-weight:800;">📜 Journal de la partie</span>'
      +   '<span style="flex:1;"></span>'
      +   '<button id="mdj-journal-copy" style="padding:7px 12px; border:1px solid rgba(255,255,255,0.25); border-radius:7px; background:rgba(90,120,200,0.6); color:#fff; font-weight:700; cursor:pointer;">📋 Copier</button>'
      +   '<button id="mdj-journal-close" style="padding:7px 12px; border:1px solid rgba(255,255,255,0.25); border-radius:7px; background:rgba(255,255,255,0.1); color:#fff; font-weight:700; cursor:pointer;">Fermer</button>'
      + '</div>'
      + '<div style="flex:1; overflow:auto; padding:12px 16px; font-family:ui-monospace,Menlo,Consolas,monospace; line-height:1.45;">' + rows + '</div>'
      + '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    const c = document.getElementById('mdj-journal-close');
    if (c) c.addEventListener('click', () => ov.remove());
    const cp = document.getElementById('mdj-journal-copy');
    if (cp) cp.addEventListener('click', () => {
      try { navigator.clipboard.writeText(plain); cp.textContent = '✅ Copié'; setTimeout(() => { cp.textContent = '📋 Copier'; }, 1500); }
      catch (_) { alert('Copie indisponible'); }
    });
  }
,

  openPlayerPopup(playerId) {
    const players = this.gm.state.players || [];
    const p = players.find(pp => pp.id === playerId);
    if (!p) return;
    const old = document.getElementById('mdj-player-popup');
    if (old) old.remove();

    const rolesData = (window.ROLES_DATA && window.ROLES_DATA.roles) || {};
    const roleData = rolesData[p.role] || {};
    const emoji = roleData.emoji || '\u2753';
    const isDead = this.deadPlayerIds.has(playerId);
    const cause = this.deathCauses && this.deathCauses[playerId];
    const causeLabel = {
      wolf: 'Loups-Garous', poison: 'Sorcière (poison)', lynch: 'village (vote)',
      chasseur: 'Chasseur', chevalier: 'Chevalier', love: 'chagrin (amoureux)',
      savant: 'Savant Fou', mdj: 'Maître du Jeu'
    }[cause] || '';
    const statusHtml = isDead
      ? '<span style="color:#ff8a8a; font-weight:800;">\u2620\uFE0F MORT' + (causeLabel ? ' — ' + causeLabel : '') + '</span>'
      : '<span style="color:#7CFC9A; font-weight:800;">\u2764\uFE0F Vivant</span>';

    const history = (typeof this.getPlayerHistory === 'function') ? this.getPlayerHistory(playerId) : [];
    const histHtml = history.length
      ? history.map(h => '<div style="padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:12px;"><b style="color:#81dff7;">Nuit ' + h.night + '</b> : ' + h.text + '</div>').join('')
      : '<div style="opacity:0.55; font-size:12px;">Aucun événement enregistré</div>';

    const toggleLabel = isDead ? '\u2764\uFE0F Faire revivre' : '\u2620\uFE0F Forcer la mort';
    const toggleBg = isDead ? 'rgba(90,170,110,0.85)' : 'rgba(190,80,80,0.85)';

    const ov = document.createElement('div');
    ov.id = 'mdj-player-popup';
    ov.style.cssText = 'position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.55); backdrop-filter:blur(2px);';
    ov.innerHTML =
      '<div style="width:min(340px,90vw); max-height:80vh; overflow:auto; background:linear-gradient(135deg,#1c2030,#2a2440); border:2px solid rgba(199,125,255,0.5); border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.6); padding:16px; color:#e8e8f0;">'
      + '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">'
      +   '<span style="font-size:26px;">' + (isDead ? '\uD83D\uDC80' : emoji) + '</span>'
      +   '<div style="flex:1;"><div style="font-size:17px; font-weight:800;">' + p.name + '</div>'
      +   '<div style="font-size:11px; opacity:0.75;">' + (roleData.name || p.role || '') + (this.mayorId === p.id ? ' \uD83C\uDF96\uFE0F Maire' : '') + '</div></div>'
      + '</div>'
      + '<div style="margin:6px 0 10px;">' + statusHtml + '</div>'
      + '<div style="font-size:11px; color:#81dff7; font-weight:700; margin-bottom:3px;">\uD83D\uDCDC Historique</div>'
      + '<div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:6px 9px; margin-bottom:12px;">' + histHtml + '</div>'
      + '<div style="display:flex; gap:8px;">'
      +   '<button id="mdj-popup-toggle" style="flex:1; padding:11px; border:none; border-radius:8px; font-weight:700; color:#fff; cursor:pointer; background:' + toggleBg + ';">' + toggleLabel + '</button>'
      +   '<button id="mdj-popup-close" style="padding:11px 14px; border:1px solid rgba(255,255,255,0.25); border-radius:8px; font-weight:700; color:#e8e8f0; cursor:pointer; background:rgba(255,255,255,0.08);">Fermer</button>'
      + '</div>'
      + '<div style="margin-top:8px; font-size:10px; opacity:0.55; text-align:center;">Secours MDJ — modifie l\'état vivant/mort manuellement</div>'
      + '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    const closeBtn = document.getElementById('mdj-popup-close');
    if (closeBtn) closeBtn.addEventListener('click', () => ov.remove());
    const toggleBtn = document.getElementById('mdj-popup-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => {
      if (this.deadPlayerIds.has(playerId)) {
        this.deadPlayerIds.delete(playerId);
        if (this.deathCauses) delete this.deathCauses[playerId];
        if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(playerId, '[MJ] l\'a fait revivre');
      } else {
        this.deadPlayerIds.add(playerId);
        if (this.deathCauses) this.deathCauses[playerId] = 'mdj';
        if (typeof this.logPlayerEvent === 'function') this.logPlayerEvent(playerId, '[MJ] a forcé la mort');
      }
      if (this.gm && typeof this.gm.saveState === 'function') this.gm.saveState();
      ov.remove();
      this.renderLiveMap();
      if (typeof this.renderLegend === 'function') this.renderLegend();
      if (typeof this.renderRoleListbox === 'function') this.renderRoleListbox();
      if (typeof this.checkVictoryNow === 'function') this.checkVictoryNow();
    });
  }
,

  /**
   * Render legend showing all players with their emoji and color
   * Shows 🎖️ medal next to mayor's name
   * Shows (Role) for dead players
   */
  renderLegend() {
    const legendContainer = document.getElementById('mdj-legend');
    if (!legendContainer) return;

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};

    const legendItems = players.map(p => {
      const roleData = rolesData[p.role] || {};
      const emoji = roleData.emoji || '❓';
      const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
      const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';
      const textColor = roleData.visual?.roleColor?.textColor || '#ffffff';
      const isMayor = this.mayorId && this.mayorId === p.id;
      const isDead = this.deadPlayerIds.has(p.id);
      const roleName = roleData.name || p.role;

      const displayName = isDead
        ? `${isMayor ? '🎖️ ' : ''}${p.name} (${roleName})`
        : `${isMayor ? '🎖️ ' : ''}${p.name}`;

      return `
        <div class="legend-item">
          <div class="legend-dot" style="background: ${bgColor}; ${isDead ? 'opacity: 0.5;' : ''}">
            <span class="legend-emoji" style="color: ${emojiColor};">${isDead ? '💀' : emoji}</span>
          </div>
          <span class="legend-name">${displayName}</span>
        </div>
      `;
    }).join('');

    legendContainer.innerHTML = `
      <div class="legend-title">📋 Légende</div>
      <div class="legend-grid">
        ${legendItems}
      </div>
    `;
  }
,


  /**
   * Restore map to original state (no effects)
   */
  /**
   * Restore effects from completed roles
   */
  restoreCompletedRoleEffects() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    const players = this.gm.state.players || [];

    // Check each completed role and restore its effects
    Object.entries(this.roleStates).forEach(([roleId, state]) => {
      if (!state.completed || !state.result) return;

      const roleData = this.rolesLoader.getRole(roleId);
      if (!roleData) return;

      // Re-apply effects based on role type and result
      if (roleId === 'Cupidon' && state.result.targets && state.result.targets.length >= 2) {
        // Restore lover bordures (pink/red)
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Cupidon - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}`);

        const lovers = players.filter(p =>
          state.result.targets.includes(p.id)
        );
        lovers.forEach(lover => {
          const point = mdjMap.querySelector(`[data-player-id="${lover.id}"]`);
          if (point && borderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        });
      }

      if (roleId === 'Enfant_Sauvage' && state.result.targets && state.result.targets.length > 0) {
        // Restore idol bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Enfant_Sauvage - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const idol = players.find(p =>
          state.result.targets.includes(p.id)
        );
        if (idol && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${idol.id}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        }
      }

      if (roleId === 'Salvateur' && state.result.targets && state.result.targets.length > 0) {
        // Restore protected player bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Salvateur - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const protected_player = players.find(p =>
          state.result.targets.includes(p.id)
        );
        if (protected_player && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${protected_player.id}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        }
      }

      // CRITICAL: Corbeau border disappears each day (borderLifetime: "next_night")
      // Only restore if it's the same night it was placed (don't persist overnight)
      if (roleId === 'Corbeau' && state.result.targets && state.result.targets.length > 0) {
        // Check if borderLifetime says it should disappear next night
        const borderLifetime = roleData?.borderLifetime;

        // Only restore Corbeau border if it's being placed THIS night (borderLifetime: next_night means it disappears at day)
        // Don't restore old Corbeau borders from previous nights
        if (borderLifetime !== 'next_night' || this.currentNight === 1) {
          // Safe to restore (either no lifetime set, or it's Night 1 first placement)
          const borderColor = roleData?.visual?.affectedColor?.borderColor;
          const emojiColor = roleData?.visual?.roleColor?.emojiColor;
          const bgColor = roleData?.visual?.roleColor?.fondColor;
          console.log(`[MDJ] Corbeau - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

          const victim = players.find(p =>
            state.result.targets.includes(p.id)
          );
          if (victim && borderColor) {
            const point = mdjMap.querySelector(`[data-player-id="${victim.id}"]`);
            if (point) {
              point.classList.add('affected');
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.setProperty('--affected-border', borderColor);
              }
            }
          }
        } else {
          console.log(`[MDJ] Corbeau border NOT restored - borderLifetime: "${borderLifetime}" (disappears at day)`);
        }
      }

      // Handle Voyante target bordure
      if (roleId === 'Voyante' && state.result.targets && state.result.targets.length > 0) {
        // Restore Voyante's target bordure
        const borderColor = roleData?.visual?.affectedColor?.borderColor;
        const emojiColor = roleData?.visual?.roleColor?.emojiColor;
        const bgColor = roleData?.visual?.roleColor?.fondColor;
        console.log(`[MDJ] Voyante - detection de visual affected colors: border color ${borderColor ? '✓ ' + borderColor : '✗ NOT FOUND'}, emoji: ${roleData?.emoji || 'N/A'}, bg: ${bgColor || 'N/A'}, emoji-color: ${emojiColor || 'N/A'}`);

        const target = players.find(p =>
          state.result.targets.includes(p.id)
        );
        console.log('[MDJ] Voyante restore - target:', target?.name || 'NOT FOUND', 'targets array:', state.result.targets);

        if (target && borderColor) {
          const point = mdjMap.querySelector(`[data-player-id="${target.id}"]`);
          console.log('[MDJ] Voyante restore - querySelector for', target.id, ':', point ? '✓ FOUND' : '✗ NOT FOUND');

          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
              console.log('[MDJ] Voyante restore - applied border color:', borderColor);
            }
          }
        } else {
          console.log('[MDJ] Voyante restore - SKIPPED: target=' + (target?.name || 'null'), 'borderColor=' + borderColor);
        }
      }

      // Handle Chien_Loup emoji change (join_wolves)
      if (roleId === 'Chien_Loup' && state.result.targets && state.result.targets.includes('join_wolves')) {
        const chienLoup = players.find(p => p.role === 'Chien_Loup');
        if (chienLoup) {
          const point = mdjMap.querySelector(`[data-player-id="${chienLoup.id}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji) {
              emoji.textContent = '🐺';
              console.log('[MDJ] Restored Chien_Loup emoji to 🐺');
            }
          }
        }
      }

      // NOTE: Renard borders should ONLY show during selection, not persist as completed effect
      // So we don't restore them here - they are cleared when role changes
      // This ensures Renard borders only appear during Renard's turn

      // Handle Wolf kills (Simple_Loup_Garou, Grand_Mechant_Loup, Loup_Garou_Blanc)
      if ((roleId === 'Simple_Loup_Garou' || roleId === 'Grand_Mechant_Loup' || roleId === 'Loup_Garou_Blanc')
          && state.result.targets && state.result.targets.length > 0) {
        console.log(`[MDJ] ${roleId} restore - killed players:`, state.result.targets);

        state.result.targets.forEach(victimName => {
          const victim = players.find(p => p.name === victimName);
          if (victim) {
            const point = mdjMap.querySelector(`[data-player-id="${victim.id}"]`);
            console.log(`[MDJ] ${roleId} restore - querySelector for killed ${victim.id}:`, point ? '✓ FOUND' : '✗ NOT FOUND');

            if (point) {
              point.classList.add('killed');
              const emoji = point.querySelector('.mdj-point-emoji');
              if (emoji && !point.dataset.originalEmoji) {
                point.dataset.originalEmoji = emoji.textContent;
              }
              if (emoji) {
                emoji.textContent = '💀';
                emoji.style.opacity = '0.6';
                console.log(`[MDJ] ${roleId} restore - applied skull to ${victim.id}`);
              }
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.filter = 'grayscale(100%)';
                dot.style.opacity = '0.6';
              }
            }
          }
        });
      }
    });
  }
,


  restoreMapState() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    const players = this.gm.state.players || [];
    const rolesData = window.ROLES_DATA?.roles || {};

    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      // Remove all effect classes
      point.classList.remove('affected', 'killed', 'darkened');

      // Restore original emoji and styles
      const playerId = point.dataset.playerId;
      const player = players.find(p => p.id === playerId);
      if (player) {
        const roleData = rolesData[player.role] || {};
        const originalEmoji = roleData.emoji || '❓';
        const bgColor = roleData.visual?.roleColor?.fondColor || 'inherit';
        const emojiColor = roleData.visual?.roleColor?.emojiColor || 'inherit';

        const emoji = point.querySelector('.mdj-point-emoji');
        if (emoji) {
          emoji.textContent = originalEmoji;
          emoji.style.color = emojiColor;
          emoji.style.opacity = '1';
        }

        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.background = bgColor;
          dot.style.filter = 'none';
          dot.style.opacity = '1';
          dot.style.setProperty('--affected-border', 'transparent');
        }
      }
    });
  }
,


  /**
   * Update map visualization for selected role's effects
   * Handles visual feedback for various roles
   */
  updateMapForRole() {
    // Need to restore visuals even if selectedPlayers is empty (for preview deselection)
    // But skip entirely if no role selected
    if (!this.selectedRoleId) {
      return;
    }

    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    // Get list of players affected by completed roles - DON'T CLEAR THEM
    const playersWithCompletedEffects = new Set();
    const players = this.gm.state.players || [];

    Object.entries(this.roleStates).forEach(([roleId, state]) => {
      if (!state.completed || !state.result) return;

      if (roleId === 'Cupidon' && state.result.targets) {
        // Add Cupidon's lovers to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Enfant_Sauvage' && state.result.targets) {
        // Add Enfant_Sauvage's idol to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Salvateur' && state.result.targets) {
        // Add Salvateur's protected player to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Corbeau' && state.result.targets) {
        // Add Corbeau's victim to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      if (roleId === 'Voyante' && state.result.targets) {
        // Add Voyante's target to protected list
        // targets are stored as IDs, not names!
        state.result.targets.forEach(targetId => {
          if (targetId && !targetId.startsWith('potion-')) {
            playersWithCompletedEffects.add(targetId);
          }
        });
      }

      // NOTE: Renard borders should ONLY show during selection, not as completed effect
      // So we don't add Renard's neighbors to playersWithCompletedEffects
    });

    // Only clear states from players who don't have completed role effects
    // AND are not part of current selection
    const roleData = this.rolesLoader.getRole(this.selectedRoleId);
    mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
      const pointPlayerId = point.dataset.playerId;

      // Don't touch if has completed role effect OR is selected for current role
      const hasCompletedEffect = playersWithCompletedEffects.has(pointPlayerId);
      const isSelectedForCurrentRole = this.selectedPlayers.includes(pointPlayerId);

      if (!hasCompletedEffect && !isSelectedForCurrentRole) {
        point.classList.remove('affected', 'killed', 'darkened');
        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.setProperty('--affected-border', 'transparent');
        }
        
        // Restore dead player visual state (grayscale) if needed
        const isDead = this.deadPlayerIds.has(pointPlayerId);
        if (isDead) {
          point.style.filter = 'grayscale(100%) brightness(0.5)';
          point.style.opacity = '0.6';
        } else {
          point.style.filter = 'none';
          point.style.opacity = '1';
        }
      }
    });

    // Apply role-specific visual effects
    switch(this.selectedRoleId) {
      default: {
        // [STANDARDISATION] Comportement par defaut (ex-cases Cupidon/Enfant_Sauvage/Salvateur):
        //  bordure affectedColor du role courant sur les joueurs selectionnes.
        // Border color effect - use the CURRENT ROLE's affectedColor, not the player's role
        const currentRoleData = this.rolesLoader.getRole(this.selectedRoleId);
        const borderColor = currentRoleData?.visual?.affectedColor?.borderColor || 'inherit';

        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', borderColor);
            }
          }
        });
        break;
      }

      case 'Voyante':
        // Apply border color from Voyante's affectedColor to selected target
        const voyanteRole = this.rolesLoader.getRole('Voyante');
        const voyanteBorderColor = voyanteRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Voyante preview - detection de visual affected colors: border color ${voyanteBorderColor ? '✓ ' + voyanteBorderColor : '✗ NOT FOUND'}`);

        // Clear borders ONLY for players that don't have completed role effects
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
          if (!playersWithCompletedEffects.has(playerId) && !this.selectedPlayers.includes(playerId)) {
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', 'transparent');
            }
          }
        });

        // Apply border to selected players (but NOT if they have completed role effects)
        this.selectedPlayers.forEach(playerId => {
          // Don't apply Voyante border if player already has completed role effect (Salvateur, idol, etc)
          if (playersWithCompletedEffects.has(playerId)) {
            console.log(`[MDJ] Voyante - skipping border for ${playerId} (already has completed role effect)`);
            return;
          }
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point && voyanteBorderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', voyanteBorderColor);
            }
          }
        });
        break;

      case 'Renard':
        // Apply borders to selected player + left and right neighbors (3 total)
        const renardRole = this.rolesLoader.getRole('Renard');
        const renardBorderColor = renardRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Renard preview - detection de visual affected colors: border color ${renardBorderColor ? '✓ ' + renardBorderColor : '✗ NOT FOUND'}`);

        if (this.selectedPlayers.length > 0 && renardBorderColor) {
          const selectedPlayerId = this.selectedPlayers[0];
          const selectedPlayerObj = players.find(p => p.id === selectedPlayerId);

          if (selectedPlayerObj) {
            const selectedIdx = players.indexOf(selectedPlayerObj);
            const leftIdx = (selectedIdx - 1 + players.length) % players.length;
            const rightIdx = (selectedIdx + 1) % players.length;

            const neighborIds = [
              selectedPlayerId, // center
              players[leftIdx].id, // left
              players[rightIdx].id  // right
            ];

            console.log(`[MDJ] Renard preview - applying border to 3 neighbors: center=${selectedPlayerId}, left=${players[leftIdx].id}, right=${players[rightIdx].id}`);

            // Clear borders ONLY for players that don't have completed role effects
            mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
              const playerId = point.dataset.playerId;
              // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
              if (!playersWithCompletedEffects.has(playerId) && !neighborIds.includes(playerId)) {
                const dot = point.querySelector('.mdj-point-dot');
                if (dot && !point.classList.contains('killed')) {
                  dot.style.setProperty('--affected-border', 'transparent');
                }
              }
            });

            // Apply to neighbors
            neighborIds.forEach(neighborId => {
              const point = mdjMap.querySelector(`[data-player-id="${neighborId}"]`);
              if (point) {
                point.classList.add('affected');
                const dot = point.querySelector('.mdj-point-dot');
                if (dot) {
                  dot.style.setProperty('--affected-border', renardBorderColor);
                }
              }
            });
          }
        }
        break;

      case 'Simple_Loup_Garou':
      case 'Grand_Mechant_Loup':
      case 'Loup_Garou_Blanc':
        const selectedNames = this.selectedPlayers.map(id => this.getPlayerName(id)).join(', ');
        console.log(`[MDJ] 🐺 Selected to kill: ${selectedNames || '(none)'}`);

        // Restore emojis for non-selected players
        mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
          const playerId = point.dataset.playerId;
          const isSelected = this.selectedPlayers.includes(playerId);

          if (!isSelected) {
            point.classList.remove('killed');
            const emoji = point.querySelector('.mdj-point-emoji');
            const originalEmoji = point.dataset.originalEmoji;
            if (emoji && originalEmoji) {
              emoji.textContent = originalEmoji;
              emoji.style.opacity = '1';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'none';
              dot.style.opacity = '1';
            }
          }
        });

        // Kill effect: gray + skull
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point) {
            // SAVE ORIGINAL EMOJI BEFORE CHANGING IT
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji && !point.dataset.originalEmoji) {
              point.dataset.originalEmoji = emoji.textContent;
            }

            point.classList.add('killed');
            if (emoji) {
              emoji.textContent = '💀';
              emoji.style.opacity = '0.6';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'grayscale(100%)';
              dot.style.opacity = '0.6';
            }
          }
        });
        break;

      case 'Corbeau':
        // Apply border color from JSON affectedColor (only border, no background change)
        const corbeauRole = this.rolesLoader.getRole('Corbeau');
        const corbeauBorderColor = corbeauRole?.visual?.affectedColor?.borderColor;
        console.log(`[MDJ] Corbeau preview - detection de visual affected colors: border color ${corbeauBorderColor ? '✓ ' + corbeauBorderColor : '✗ NOT FOUND'}`);

        // Clear borders ONLY for players that don't have completed role effects
        mdjMap.querySelectorAll('.mdj-player-point').forEach(point => {
          const playerId = point.dataset.playerId;
          // Don't clear if has completed effect (Cupidon, Enfant_Sauvage, etc)
          if (!playersWithCompletedEffects.has(playerId) && !this.selectedPlayers.includes(playerId)) {
            point.classList.remove('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', 'transparent');
            }
          }
        });

        // Apply border to selected players
        this.selectedPlayers.forEach(playerId => {
          const point = mdjMap.querySelector(`[data-player-id="${playerId}"]`);
          if (point && corbeauBorderColor) {
            point.classList.add('affected');
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.setProperty('--affected-border', corbeauBorderColor);
            }
          }
        });
        break;

      case 'Sorciere':
        const sorciereRole = this.rolesLoader.getRole('Sorciere');
        const sorciereBorderColor = sorciereRole?.visual?.affectedColor?.borderColor || 'rgba(255,255,255,0.5)';

        // Find kill target (second element if action is 'potion-death')
        const killTargetId = this.selectedPlayers.length > 1 && this.selectedPlayers[0] === 'potion-death' ? this.selectedPlayers[1] : null;
        const killTargetName = killTargetId ? this.getPlayerName(killTargetId) : null;

        if (killTargetId) {
          console.log(`[MDJ] 🧙‍♀️ Sorciere: poison → ${killTargetName}`);

          // Clear all killed states first
          mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
            const playerId = point.dataset.playerId;
            if (playerId !== killTargetId) {
              point.classList.remove('killed');
              const emoji = point.querySelector('.mdj-point-emoji');
              const originalEmoji = point.dataset.originalEmoji;
              if (emoji && originalEmoji) {
                emoji.textContent = originalEmoji;
                emoji.style.opacity = '1';
              }
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) {
                dot.style.filter = 'none';
                dot.style.opacity = '1';
              }
            }
          });

          // Apply kill effect to selected target
          const point = mdjMap.querySelector(`[data-player-id="${killTargetId}"]`);
          if (point) {
            const emoji = point.querySelector('.mdj-point-emoji');
            if (emoji && !point.dataset.originalEmoji) {
              point.dataset.originalEmoji = emoji.textContent;
            }
            point.classList.add('killed', 'affected');
            if (emoji) {
              emoji.textContent = '💀';
              emoji.style.opacity = '0.6';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'grayscale(100%)';
              dot.style.opacity = '0.6';
              dot.style.setProperty('--affected-border', sorciereBorderColor);
            }
          }
        } else {
          // Clear all killed states if not poisoning
          mdjMap.querySelectorAll('.mdj-player-point.killed').forEach(point => {
            const emoji = point.querySelector('.mdj-point-emoji');
            const originalEmoji = point.dataset.originalEmoji;
            if (emoji && originalEmoji) {
              emoji.textContent = originalEmoji;
              emoji.style.opacity = '1';
            }
            const dot = point.querySelector('.mdj-point-dot');
            if (dot) {
              dot.style.filter = 'none';
              dot.style.opacity = '1';
              dot.style.setProperty('--affected-border', 'transparent');
            }
            point.classList.remove('killed', 'affected');
          });
        }
        break;
    }
  }
,


  /**
   * Update map visualization for Cupidon's selected lovers
   * Uses Cupidon's affectedColor for border
   */
  updateMapForCupidon() {
    const mdjMap = document.getElementById('mdj-live-map');
    if (!mdjMap) return;

    // Get Cupidon's affectedColor for border
    const cupidonRole = this.rolesLoader.getRole('Cupidon');
    const cupidonBorderColor = cupidonRole?.visual?.affectedColor?.borderColor || 'rgba(255,255,255,0.5)';

    // Apply affected state to selected lovers with Cupidon's color
    this.selectedPlayers.forEach(playerKey => {
      const point = mdjMap.querySelector(`[data-player-id="${playerKey}"]`);
      if (point) {
        point.classList.add('affected');
        const dot = point.querySelector('.mdj-point-dot');
        if (dot) {
          dot.style.setProperty('--affected-border', cupidonBorderColor);
        }
      }
    });

    // IMPORTANT: Do NOT clear other role effects!
    // Other completed roles' borders should remain visible alongside Cupidon's selection
    console.log('[MDJ] Cupidon map updated - preserving other role borders');
  }

});


