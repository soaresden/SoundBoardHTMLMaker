// Auto-split module of FirstNightMDJ — augments prototype. Load AFTER 03-FirstNightMDJ-00-core.js
Object.assign(FirstNightMDJ.prototype, {


  /**
   * Disposition de la table :
   * - ICÔNES équiréparties sur l'anneau EXTÉRIEUR (ellipse)
   * - ÉTIQUETTES à l'INTÉRIEUR de la table
   * - SOLVEUR de collisions : aucune étiquette ne chevauche une autre étiquette ni une icône
   */
  _computeTableLayout(players, mw, mh) {
    // RECTANGLE À BORDS ARRONDIS qui épouse le panneau (taille réelle mesurée),
    // icônes équiréparties sur le pourtour, étiquettes COLLÉES aux icônes (côté intérieur),
    // avec anti-chevauchement à « laisse courte » (une étiquette reste près de son icône).
    const W = Math.max(mw || 0, 300) || 340;
    const H = Math.max(mh || 0, 300) || 430;
    const n = Math.max(players.length, 1);
    const DOT = 36;          // encombrement visuel d'une icône
    const inset = 20;        // marge entre le bord et l'anneau
    const insetBottom = 46;  // marge PLUS GRANDE en bas : les étiquettes vont SOUS les icônes
    const R = 40;            // rayon des coins (aligné sur le border-radius CSS)

    // Périmètre du rectangle arrondi (anneau des icônes)
    const W2 = W - inset * 2, H2 = H - inset - insetBottom;
    const sw = Math.max(W2 - 2 * R, 0), sh = Math.max(H2 - 2 * R, 0);
    const quart = Math.PI * R / 2;
    const P = 2 * sw + 2 * sh + 4 * quart;

    // Point + normale EXTÉRIEURE à la distance d le long du pourtour (départ coin haut-gauche, sens horaire)
    const pt = (dRaw) => {
      let d = ((dRaw % P) + P) % P;
      if (d < sw) return { x: inset + R + d, y: inset, ox: 0, oy: -1 };
      d -= sw;
      if (d < quart) { const a = -Math.PI / 2 + d / R, cx = inset + R + sw, cy = inset + R;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) }; }
      d -= quart;
      if (d < sh) return { x: inset + W2, y: inset + R + d, ox: 1, oy: 0 };
      d -= sh;
      if (d < quart) { const a = d / R, cx = inset + R + sw, cy = inset + R + sh;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) }; }
      d -= quart;
      if (d < sw) return { x: inset + R + sw - d, y: inset + H2, ox: 0, oy: 1 };
      d -= sw;
      if (d < quart) { const a = Math.PI / 2 + d / R, cx = inset + R, cy = inset + R + sh;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) }; }
      d -= quart;
      if (d < sh) return { x: inset, y: inset + R + sh - d, ox: -1, oy: 0 };
      d -= sh;
      const a = Math.PI + d / R, cx = inset + R, cy = inset + R;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) };
    };

    // Icônes : premier joueur en haut au centre, sens horaire
    const icons = players.map((pp, idx) => {
      const q = pt(sw / 2 + (idx * P) / n);
      return { x: Math.round(q.x), y: Math.round(q.y), nx: -q.ox, ny: -q.oy };
    });

    // RÈGLE SIMPLE : l'étiquette est TOUJOURS SOUS l'icône.
    // Calage horizontal : icône à gauche → calée à gauche (s'étend vers la droite),
    // au centre → centrée, à droite → calée à droite (s'étend vers la gauche).
    // Quinconce 1 sur 2 (un peu plus bas) sur les bords haut/bas pour éviter tout contact.
    const labels = players.map((pp, idx) => {
      const ic = icons[idx];
      const name = String(pp.name || '?');
      const est = 14 + name.length * 6.2;
      const small = est > 74;
      pp.nameSmall = small;
      const w = small ? Math.min(78, 12 + name.length * 5.2) : est;
      const h = 17;
      const horizontalEdge = Math.abs(ic.ny) >= 0.6;
      const alt = (horizontalEdge && idx % 2 === 1) ? 17 : 0;
      const by = ic.y + 20 + alt; // sous l'icône (bord bas de l'icône ≈ +18)
      let bx;
      if (ic.x < W * 0.35) bx = ic.x - 18;           // gauche : calée à gauche de l'icône
      else if (ic.x > W * 0.65) bx = ic.x + 18 - w;  // droite : calée à droite de l'icône
      else bx = ic.x - w / 2;                        // centre : centrée sous l'icône
      return { x: bx, y: by, w, h };
    });
    // Position de base (référence de la « laisse » du solveur)
    const baseLbl = labels.map(A => ({ x: A.x, y: A.y }));

    // Anti-chevauchement à LAISSE COURTE : petites poussées, mais l'étiquette
    // reste toujours proche de SON icône (distance centre-à-centre <= 64px).
    const inter = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
    const iconBoxes = icons.map(ic => ({ x: ic.x - DOT / 2, y: ic.y - DOT / 2, w: DOT, h: DOT }));
    for (let iter = 0; iter < 80; iter++) {
      let moved = false;
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const A = labels[i], B = labels[j];
          if (!inter(A, B)) continue;
          const overlapY = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          const push = overlapY / 2 + 1;
          if (A.y <= B.y) { A.y -= push; B.y += push; } else { A.y += push; B.y -= push; }
          moved = true;
        }
      }
      for (let i = 0; i < labels.length; i++) {
        for (let j = 0; j < iconBoxes.length; j++) {
          const A = labels[i], B = iconBoxes[j];
          if (!inter(A, B)) continue;
          // pousse l'étiquette à l'opposé de l'icône gênante
          const dx = (A.x + A.w / 2) - (B.x + B.w / 2), dy = (A.y + A.h / 2) - (B.y + B.h / 2);
          const len = Math.max(Math.hypot(dx, dy), 0.01);
          A.x += (dx / len) * 5; A.y += (dy / len) * 5;
          moved = true;
        }
      }
      // LAISSE COURTE : une étiquette ne s'écarte JAMAIS de plus de 22px de sa
      // position de base (collée à l'icône) + bornes du rectangle
      labels.forEach((A, i) => {
        const dx = A.x - baseLbl[i].x, dy = A.y - baseLbl[i].y;
        const d = Math.hypot(dx, dy);
        if (d > 22) {
          const k = 22 / d;
          A.x = baseLbl[i].x + dx * k;
          A.y = baseLbl[i].y + dy * k;
        }
        A.x = Math.max(2, Math.min(W - A.w - 2, A.x));
        A.y = Math.max(2, Math.min(H - A.h - 2, A.y));
      });
      if (!moved) break;
    }

    players.forEach((pp, idx) => {
      pp.tableX = icons[idx].x;
      pp.tableY = icons[idx].y;
      pp.nameLeft = Math.round(labels[idx].x - icons[idx].x) + 'px';
      pp.nameTop = Math.round(labels[idx].y - icons[idx].y) + 'px';
      pp.textAlign = 'center';
    });
  }
,

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

    // ☠️ Les morts sont affichées IMMÉDIATEMENT sur la map (grisé + badge tueur).
    // NB: un joueur mort pendant la nuit JOUE quand même son tour jusqu'au débrief.
    const _deadVisibleSet = new Set(this.deadPlayerIds);

    // Afficher les joueurs avec leur rôle (couleur + emoji du JSON)
    // Disposition "piste de course" - joueurs sur les bords, noms à l'opposé, équidistant
    // Layout global : rectangle arrondi qui épouse la taille RÉELLE du panneau.
    // Recalculé si des positions manquent OU si la taille mesurée a changé.
    const _prevVisual = mapContainer.querySelector('.mdj-table-visual');
    const _mw = _prevVisual ? Math.round(_prevVisual.clientWidth) : 0;
    const _mh = _prevVisual ? Math.round(_prevVisual.clientHeight) : 0;
    const _allCached = players.length > 0 && players.every(pp => pp.tableX !== undefined && pp.tableY !== undefined);
    const _layoutKey = _mw + 'x' + _mh + 'x' + players.length;
    if ((!_allCached || this._lastLayoutKey !== _layoutKey) && typeof this._computeTableLayout === 'function') {
      this._computeTableLayout(players, _mw, _mh);
      this._lastLayoutKey = _layoutKey;
    }

    const playerPoints = players.map((p, idx) => {
      const x = p.tableX || 0, y = p.tableY || 0;
      const nameTop = p.nameTop || '30px';
      const nameLeft = p.nameLeft || '-40px';

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
        const isDead = _deadVisibleSet.has(p.id);

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

      const isDead = _deadVisibleSet.has(p.id);
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
        poisonApprenti: { emoji: '🧪', bg: _killerColor('Custom_Apprenti_Sorcier', '#2e7d5b'), label: "l'Apprenti Sorcier (potion)" },
        lynch:     { emoji: '🪓', bg: '#9966CC', label: 'le village (bûcher)' },
        chasseur:  { emoji: '🏹', bg: _killerColor('Chasseur', '#D4A574'), label: 'le Chasseur' },
        chevalier: { emoji: '⚔️', bg: _killerColor('Chevalier_Epee_Rouille', '#FFD700'), label: 'le Chevalier' },
        love:      { emoji: '💔', bg: _killerColor('Cupidon', '#D6899E'), label: 'amour (Cupidon)' },
        tunnel:    { emoji: '🕳️', bg: _killerColor('Custom_Creuseur_Tunnel', '#6b5b3a'), label: 'a isolé un Loup (Creuseur de Tunnel)' },
        braises:   { emoji: '🔥', bg: _killerColor('Custom_Chauffeur_Braises', '#7a2e10'), label: 'sacrifice (a pointé un innocent)' },
        bus:       { emoji: '🚌', bg: _killerColor('Custom_Chauffeur_Bus', '#2a5d9c'), label: 'le Chauffeur de Bus (balancé à sa place)' },
        savant:    { emoji: '🧪', bg: _killerColor('Savant_Fou', '#d9534f'), label: 'le Savant Fou (voisin emporté)' },
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
            <span class="mdj-point-name" style="top: ${nameTop}; left: ${nameLeft}; width:auto; ${p.nameSmall ? 'font-size:0.5rem;' : ''} text-align: ${p.textAlign};">${isDead ? '💀' : ''} ${displayName}</span>
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

    // Premier rendu : le rectangle n'était pas encore mesurable → re-layout immédiat
    if (!_prevVisual && !this._relayoutPending) {
      this._relayoutPending = true;
      requestAnimationFrame(() => {
        this._relayoutPending = false;
        try { this.renderLiveMap(); } catch (_) {}
      });
    }

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
      wolf: 'Loups-Garous', poison: 'Sorcière (poison)', poisonApprenti: 'Apprenti Sorcier (poison)', lynch: 'village (vote)',
      chasseur: 'Chasseur', chevalier: 'Chevalier', love: 'chagrin (amoureux)',
      savant: 'Savant Fou', mdj: 'Maître du Jeu', tunnel: 'tunnel vers un Loup (Creuseur)',
      braises: 'sacrifice (Chauffeur de Braises)', bus: 'Chauffeur de Bus'
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
      if (typeof this.pushUndo === 'function') this.pushUndo('Secours MDJ : ' + this.getPlayerName(playerId));
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
      if ((roleId === 'Cupidon' || roleId === 'Custom_Clubbeur') && state.result.targets && state.result.targets.length >= 2) {
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

      // 🕳️ Creuseur de Tunnel (isolate) : la cible isolée prend la bordure du Creuseur,
      //    uniquement les nuits où il agit (revient à la normale au matin).
      {
        const _blocks = roleData?.actions ? Object.values(roleData.actions) : [];
        const _isIsolate = _blocks.some(b => b && typeof b === 'object' && b.type === 'isolate');
        const _acts = (typeof this.roleActsThisNight !== 'function') || this.roleActsThisNight(roleId);
        if (_isIsolate && _acts && state.result.targets && state.result.targets.length > 0) {
          const borderColor = roleData?.visual?.affectedColor?.borderColor || roleData?.visual?.roleColor?.fondColor;
          state.result.targets.forEach(tid => {
            if (!tid || String(tid).startsWith('potion-')) return;
            const point = mdjMap.querySelector(`[data-player-id="${tid}"]`);
            if (point && borderColor) {
              point.classList.add('affected');
              const dot = point.querySelector('.mdj-point-dot');
              if (dot) dot.style.setProperty('--affected-border', borderColor);
            }
          });
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

    // 💘💘 DOUBLE AMOUREUX (Cupidon ET Clubbeur) : contour SUR le contour (double anneau).
    // Bordure = couleur Cupidon, anneau extérieur = couleur Clubbeur.
    try {
      const _cupSt = this.roleStates['Cupidon'];
      const _clubSt = this.roleStates['Custom_Clubbeur'];
      const _cupT = (_cupSt && _cupSt.completed && _cupSt.result && _cupSt.result.targets) || [];
      const _clubT = (_clubSt && _clubSt.completed && _clubSt.result && _clubSt.result.targets) || [];
      const _both = _cupT.filter(id => _clubT.includes(id));
      if (_both.length) {
        const _cupColor = (this.rolesLoader.getRole('Cupidon')?.visual?.affectedColor?.borderColor) || '#ff7bac';
        const _clubColor = (this.rolesLoader.getRole('Custom_Clubbeur')?.visual?.affectedColor?.borderColor) || '#c77dff';
        _both.forEach(pid => {
          const point = mdjMap.querySelector(`[data-player-id="${pid}"]`);
          const dot = point && point.querySelector('.mdj-point-dot');
          if (!dot) return;
          point.classList.add('affected');
          dot.style.setProperty('--affected-border', _cupColor);
          dot.style.outline = `3px solid ${_clubColor}`;
          dot.style.outlineOffset = '3px';
          console.log(`[MDJ] 💘💘 ${this.getPlayerName(pid)} est DOUBLE amoureux (Cupidon + Clubbeur) → double contour`);
        });
      }
    } catch (_) {}
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

      if ((roleId === 'Cupidon' || roleId === 'Custom_Clubbeur') && state.result.targets) {
        // Add Cupidon/Clubbeur's lovers to protected list
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
          dot.style.outline = '';
          dot.style.outlineOffset = '';
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
        // FIX Salvateur : repeint D'ABORD les contours des rôles déjà joués (amoureux, voyante…)
        // pour que les joueurs cliqués puis dé-cliqués retrouvent LEUR couleur au lieu de
        // garder celle du rôle courant (contours qui « s'empilaient »).
        if (typeof this.restoreCompletedRoleEffects === 'function') this.restoreCompletedRoleEffects();
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
   * Update map to show Cupidon/Clubbeur selected lovers (affected border)
   */
  updateMapForCupidon() {
    // FIX désélection : on délègue au pipeline standard (updateMapForRole) qui
    // NETTOIE d'abord les contours des joueurs dé-sélectionnés, repeint les effets
    // des rôles déjà validés, puis applique la sélection courante.
    // (Avant : on ne faisait qu'AJOUTER des contours, jamais les retirer.)
    this.updateMapForRole();
  }

});
