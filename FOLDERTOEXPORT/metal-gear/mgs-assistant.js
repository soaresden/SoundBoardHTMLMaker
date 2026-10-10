/* MGS Board Game — Assistant de partie (v2) : un vrai compagnon de jeu sur tablette.
   Parcours : Missions → 📡 Briefing → 📜 Règles → 🗺️ Plateau & setup → 🎲 Partie → 🏁 Débrief
   - Le plateau à l'écran est le plan de la mission : on y pose/déplace les pions (le vrai plateau fait foi).
   - On choisit une action, on touche la case où l'on va → bruits de pas, ambiance, sons automatiques.
   - On entre les résultats des dés → l'assistant calcule et dit quoi répliquer sur le vrai jeu.
   - Journal horodaté de toute la partie + stats de fin de mission.
   Données : guide/missions.js, guide/data.js, guide/sounds.js. Sons : window.SB (soundboard) sinon lecteur interne.
   API : MGSAssistant.open({ mid, tab }) */
(function () {
  if (window.MGSAssistant) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MIS = () => window.MGS_MISSIONS || [];
  const SND = () => window.MGS_SOUNDS || { stages: {}, groups: [], auto: {} };
  const CHARS = () => window.MGS_CHARS || [];
  const CE = { 'Snake': '🐍', 'Meryl': '🔫', 'Otacon': '🤓', 'Gray Fox': '🥷' };
  const BOSSE = { 4: '🤠', 5: '🪖', 7: '⚔️', 8: '🔮', 10: '🚁', 11: '🐺', 12: '🦅', 14: '🤖' };
  const CC = { 'Snake': '#4aa3ff', 'Meryl': '#ff6b8a', 'Otacon': '#ffd166', 'Gray Fox': '#b8f7c8' };
  const ROSTER = ['Snake', 'Meryl', 'Gray Fox', 'Otacon'];
  const now = () => Date.now();
  const fmtT = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + 'h' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(x).padStart(2, '0'); };

  /* ======================= État ======================= */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };
  const st = Object.assign({ mid: null, n: 1, auto: true, screen: 'home', games: {}, zoom: 1 }, LS.get('mgsa2', {}));
  const save = () => LS.set('mgsa2', st);
  let undo = [];
  const snap = () => { undo.push(JSON.stringify(st.games[st.mid] || null)); if (undo.length > 60) undo.shift(); };
  let ui = { sel: null, pend: null, place: null, pad: null };     // état d'interface (non sauvegardé)

  const mission = () => MIS().find(m => String(m.id) === String(st.mid)) || null;
  const pcounts = m => Object.keys(m.players || { 1: 1 }).filter(k => /^\d+$/.test(k));
  const pchars = (m, n) => { const c = (m.players && m.players[n]) || ['Snake']; return c.some(x => !CE[x]) ? ROSTER.slice(0, n) : c; };
  const charInfo = n => CHARS().find(c => c.name === n) || {};
  const defOf = n => (charInfo(n).stats || {}).def || 3;
  const hpOf = n => (charInfo(n).stats || {}).hp || null;
  const stageSnd = m => (SND().stages || {})[m.id] || {};
  const AU = () => SND().auto || {};
  const isSneak = m => m.type === 'sneak' || m.type === 'boss+sneak';
  const isBoss = m => m.type === 'boss' || m.type === 'boss+sneak';
  const bossDef = m => { const x = String((m.boss || {}).defense || '').match(/\d+/); return x ? +x[0] : 4; };

  function parseDeck(m, n) {
    if (!m || !m.guardDeck) return null;
    let s = typeof m.guardDeck === 'string' ? m.guardDeck : (m.guardDeck[n] || Object.values(m.guardDeck)[0]);
    s = String(s);
    const r = (s.match(/(\d+)\s*(?:rouge|red)/i) || [])[1], b = (s.match(/(\d+)\s*(?:bleue|blue)/i) || [])[1];
    let blue = b ? +b : 0;
    if (m.id === 'VR60') blue = 17 + Math.max(0, n - 1);
    return { red: r ? +r : 7, blue, drawn: 0, burned: 0 };
  }
  /* 🎒 Équipement : cartes de départ du personnage + cartes numérotées de la Memory Box (#001…) */
  const ITYPES = { ration: ['🍴', 'Ration', 1], chaff: ['✨', 'Chaff', 1], grenade: ['💣', 'Grenade', 1], gun: ['🔫', 'Arme', null], sgun: ['🔇', 'Arme silencieuse', null], other: ['🎒', 'Autre', null] };
  const START_GEAR = {
    'Meryl': [['Handgun .50 Cal', 'gun'], ['Light Assault Rifle', 'gun']],
    'Gray Fox': [['Stealth Camouflage', 'other'], ['High-Frequency Blade', 'other'], ['Arm Cannon', 'gun']],
    'Otacon': [['ADV. Stealth Camouflage', 'other'], ['Rations', 'ration']],
  };
  const EQUIP_LIMIT = 3, BOX_MAX = 23;
  const mkItem = (name, type, num) => ({ id: 'i' + Math.random().toString(36).slice(2, 8), name, type, num: num || null, uses: ITYPES[type][2] });
  function startInv(m, name) {
    const inv = (START_GEAR[name] || []).map(([n, t]) => mkItem(n, t));
    if (m && m.id === 5) inv.push(Object.assign(mkItem('Grenades (Special Action)', 'grenade'), { uses: 2 }));
    return inv;
  }
  const hasItem = (p, type) => !p.inv || p.inv.some(i => i.type === type && (i.uses == null || i.uses > 0));
  function useItem(p, type) {
    if (!p.inv) return;
    const it = p.inv.find(i => i.type === type && (i.uses == null || i.uses > 0)); if (!it || it.uses == null) return;
    it.uses--;
    if (it.uses <= 0) { p.inv = p.inv.filter(x => x !== it); toast(`${ITYPES[type][0]} <b>${esc(it.name)}</b> épuisé : défausse la carte (elle reste dans la Memory Box).`, 3500); }
  }
  function invChips(p) {
    if (!p.inv) return '<span style="opacity:.6">équipement non renseigné</span>';
    return p.inv.length ? p.inv.map(i => `<span class="chip ${i.uses === 0 ? 'off' : ''}">${ITYPES[i.type][0]} ${esc(i.name)}${i.uses != null ? ' ×' + i.uses : ''}</span>`).join('') : '<span style="opacity:.6">aucun objet</span>';
  }
  function invEditor(m, g, only) {
    const box = LS.get('mgsg.cards', {});
    const pend = ui.cardAsk;
    return g.players.map((p, pi) => { if (only != null && pi !== only) return '';
      p.inv = p.inv || [];
      const cards = p.inv.filter(i => i.num).length;
      return `<div class="ma-inv"><div class="ma-inv-h">${CE[p.name] || ''} <b>${p.name}</b><span style="flex:1"></span><span class="${cards > EQUIP_LIMIT ? 'warn' : ''}" style="opacity:.8;font-size:.85rem">cartes Memory Box : ${cards}/${EQUIP_LIMIT}</span></div>
        <div>${p.inv.map(i => `<span class="chip">${ITYPES[i.type][0]} ${esc(i.name)}${i.num ? ` <small>#${String(i.num).padStart(3, '0')}</small>` : ''}${i.uses != null ? ` <button class="ma-mini" data-a="invUse" data-p="${pi}" data-i="${i.id}" data-v="-1">−</button><b>${i.uses}</b><button class="ma-mini" data-a="invUse" data-p="${pi}" data-i="${i.id}" data-v="1">＋</button>` : ''} <button class="ma-mini red" data-a="invRm" data-p="${pi}" data-i="${i.id}">✕</button></span>`).join('') || '<span style="opacity:.6">rien pour l\'instant</span>'}</div>
        <div class="ma-inv-add"><span style="opacity:.75">＋ objet :</span>${Object.entries(ITYPES).map(([k, t]) => `<button class="ma-b sm" data-a="invAdd" data-p="${pi}" data-v="${k}">${t[0]} ${t[1]}</button>`).join('')}</div>
        <div class="ma-inv-add"><span style="opacity:.75">📦 Memory Box :</span>${Array.from({ length: BOX_MAX }, (_, k) => { const n = k + 1, got = p.inv.some(i => i.num === n), kn = box[n];
          return `<button class="ma-b sm num ${got ? 'on' : ''}" data-a="invCard" data-p="${pi}" data-v="${n}" title="${kn ? esc(kn.name) : 'type inconnu'}">${kn ? ITYPES[kn.type][0] : ''}#${String(n).padStart(3, '0')}</button>`; }).join('')}</div>
        ${pend && pend.p === pi ? `<div class="ma-ask"><p>Carte <b>#${String(pend.n).padStart(3, '0')}</b> : qu'est-ce que c'est ? (je m'en souviendrai pour les prochaines missions)</p>${Object.entries(ITYPES).map(([k, t]) => `<button class="ma-b sm" data-a="invCardType" data-v="${k}">${t[0]} ${t[1]}</button>`).join(' ')} <button class="ma-b sm red" data-a="invCardNo">Annuler</button></div>` : ''}
      </div>`;
    }).join('');
  }
  function newGame(m, n) {
    const L = m.legend || {};
    const pieces = [];
    pchars(m, n).forEach(name => pieces.push({ id: 'p-' + name, k: 'player', owner: name, x: null, y: null }));
    for (let i = 0; i < (+L.guards || 0); i++) pieces.push({ id: 'g' + i, k: 'guard', x: null, y: null, f: 'down' });
    for (let i = 0; i < (+L.cameras || 0); i++) pieces.push({ id: 'c' + i, k: 'cam', x: null, y: null, f: 'down' });
    if (isBoss(m)) pieces.push({ id: 'boss', k: 'boss', x: null, y: null, f: 'down' });
    const obj = {
      n, started: false, t0: null, t1: null, round: 1, phase: 0, step: 0, cur: 0,
      players: pchars(m, n).map(name => ({ name, inv: startInv(m, name), left: 4, noisy: 0, dmg: 0, att: 0, done: false, hurt: false, water: false, sneakUsed: false,
        s: { act: 0, move: 0, atk: 0, hit: 0, dmgIn: 0, alerts: 0, noise: 0, ko: 0, kill: 0 } })),
      deck: isSneak(m) ? parseDeck(m, n) : null, cam: 'vert', boss: { dmg: 0, threat: 0, cards: 0 },
      ko2: 0, ko1: 0, dead: 0, pieces, ev: {}, over: null, why: '', log: [], alerts: 0,
    };
    if (isGrid(m)) { obj.pieces = gridPieces(m, n); obj.grid = true; obj.elev = GRID(m).elevStart || false; obj.doors = {}; obj.card = { red: 6, blue: 4, arrow: 'right' }; }
    return obj;
  }
  const game = () => {
    const m = mission(); if (!m) return null;
    if (!st.games[m.id] || st.games[m.id].n !== st.n) st.games[m.id] = newGame(m, st.n);
    const gg = st.games[m.id]; if (!gg.started) gg.players.forEach(p => { if (!p.inv) p.inv = startInv(m, p.name); });
    return gg;
  };
  function log(txt, kind = '', who = '') {
    const g = game(); if (!g) return;
    g.log.push({ t: g.t0 ? now() - g.t0 : 0, at: now(), r: g.round, ph: g.phase, who, kind, txt });
  }

  /* ======================= Audio ======================= */
  const A = {
    own: null, cur: null, mode: null, vol: LS.get('mgsa.vol', 0.8),
    music(file, mode) {
      if (!file) return;
      this.cur = file; this.mode = mode || 'mission';
      if (window.SB) window.SB.playMusic(file);
      else { if (!this.own) { this.own = new Audio(); this.own.loop = true; } this.own.src = 'music/' + file; this.own.volume = this.vol * 0.7; this.own.play().catch(() => {}); }
      bar();
    },
    sfx(file) {
      if (!file) return;
      try { if (window.SB) return window.SB.playSfx(file); } catch (e) { console.warn('SB.playSfx', e); }
      const a = new Audio('sfx/' + file); a.volume = this.vol; a.play().catch(() => {});
    },
    stop() { this.cur = null; this.mode = null; if (window.SB) window.SB.stopMusic(); else if (this.own) this.own.pause(); bar(); },
  };
  let stepAlt = 0;
  const steps = (kind, n = 1, water = false) => {
    for (let i = 0; i < n; i++) setTimeout(() => { if (water) A.sfx(AU().water); else { const a = AU()[kind] || []; if (a.length) A.sfx(a[stepAlt++ % a.length]); } }, i * 340);
  };
  const missionTrack = m => { const ss = stageSnd(m); return ss.start || ((ss.music || []).find(x => !/brief/i.test(x[0])) || [])[0]; };
  const briefTrack = m => stageSnd(m).brief || null;   // seulement un brief propre à la mission (00-BriefJeu = intro du jeu, jamais automatique)
  function syncAlert() {
    const g = game(), m = mission(); if (!g || !st.auto) return;
    const alert = g.players.some(p => p.att === 2), al = ((SND().alert || [])[0] || [])[0];
    if (alert && al && A.mode !== 'alert') A.music(al, 'alert');
    else if (!alert && A.mode === 'alert') { A.sfx(AU().clearAlarm); log('✅ Fin de l\'alerte', 'alert'); setTimeout(() => A.music(missionTrack(m), 'mission'), 900); }
  }


  /* ======================= Mode QUADRILLAGE (missions numérisées) ======================= */
  const GRID = m => (window.MGS_GRIDS || {})[m.id] || null;
  const isGrid = m => !!(m && GRID(m) && window.MGSGrid);
  const worlds = {};
  const fixOf = m => LS.get('mgsg.fix.' + m.id, { walls: [], cells: {} });
  const world = m => {
    if (worlds[m.id]) return worlds[m.id];
    const W = window.MGSGrid.build(GRID(m)), fx = fixOf(m);
    Object.entries(fx.cells || {}).forEach(([k, v]) => { if (v === ' ') delete W.cells[k]; else W.cells[k] = v; });
    (fx.walls || []).forEach(k => { if (W.walls.has(k)) W.walls.delete(k); else W.walls.add(k); });
    return (worlds[m.id] = W);
  };
  function toggleFix(m, kind, key, val) {
    const fx = fixOf(m);
    if (kind === 'wall') { const i = fx.walls.indexOf(key); if (i >= 0) fx.walls.splice(i, 1); else fx.walls.push(key); }
    else { const base = window.MGSGrid.build(GRID(m)).cells[key] || ' '; if (val === base) delete fx.cells[key]; else fx.cells[key] = val; }
    LS.set('mgsg.fix.' + m.id, fx); delete worlds[m.id];
  }
  const GG = () => window.MGSGrid;
  function gridPieces(m, n) {
    const d = GRID(m), pieces = [];
    const st0 = d.start || [[0, 0]];
    pchars(m, n).forEach((name, i) => { const s = st0[Math.min(i, st0.length - 1)]; pieces.push({ id: 'p-' + name, k: 'player', owner: name, x: s[0], y: s[1] }); });
    (d.guards || []).forEach((gd, i) => pieces.push({ id: 'g' + i, k: 'guard', x: gd[0], y: gd[1], f: gd[2] || 'down' }));
    (d.cams || []).forEach((c, i) => pieces.push({ id: 'c' + i, k: 'cam', x: c[0], y: c[1], f: c[2], f2: c[3] || c[2] }));
    if (isBoss(m)) { const b = d.boss || [Math.floor(world(m).cols / 2), 1, 'down']; pieces.push({ id: 'boss', k: 'boss', x: b[0], y: b[1], f: b[2] || 'down' }); }
    return pieces;
  }
  // état pour le moteur
  function toS(g) {
    const figs = [], cams = [], tokens = [];
    g.pieces.forEach(p => {
      if (p.x == null) return;
      if (p.k === 'player') figs.push({ id: p.id, kind: 'player', name: p.owner, x: p.x, y: p.y });
      else if (p.k === 'guard' || p.k === 'boss') figs.push({ id: p.id, kind: p.k, x: p.x, y: p.y, f: p.f || 'down' });
      else if (p.k === 'cam') cams.push({ id: p.id, x: p.x, y: p.y, faces: { vert: p.f, orange: p.f2 || p.f } });
      else if (p.k === 'q' || p.k === 'a') tokens.push({ id: p.id, kind: p.k === 'q' ? '?' : '!', owner: p.owner, x: p.x, y: p.y });
      else tokens.push({ id: p.id, kind: p.k, x: p.x, y: p.y });
    });
    return { elev: g.elev || false, doors: g.doors || {}, figs, cams, tokens, camColor: g.cam || 'vert' };
  }
  const cellKey = (x, y) => x + ',' + y;
  const ROTD = { up: 0, right: 90, down: 180, left: 270 };

  function gridBoardHtml(m, g, mode) {
    const d = GRID(m), W = world(m), S = toS(g);
    const pend = ui.pend || {};
    const cells = [], hl = [];
    const seen = st.showLOS ? new Set() : null;
    Object.keys(W.cells).forEach(k => {
      const [x, y] = k.split(',').map(Number); const px = GG().pix(W, x, y); if (!px) return;
      const c = W.cells[k];
      if (c === '#') return;
      if (c === 'L' && !(g.elev === true || g.elev === W.shaftOf[k])) return;
      cells.push(`<rect class="gc" x="${px.x + 1}" y="${px.y + 1}" width="${px.cw - 2}" height="${px.ch - 2}" rx="4"/>`);
      if (seen && GG().walkable(W, S, x, y)) { const vis = GG().watchers(W, S, { x, y }).length; if (vis) hl.push(`<rect class="gseen" x="${px.x + 2}" y="${px.y + 2}" width="${px.cw - 4}" height="${px.ch - 4}" rx="4"/>`); }
    });
    if (pend.type === 'move' && pend.cells) Object.keys(pend.cells).forEach(k => { const [x, y] = k.split(',').map(Number); const px = GG().pix(W, x, y); hl.push(`<rect class="greach" data-cell="${k}" x="${px.x + 3}" y="${px.y + 3}" width="${px.cw - 6}" height="${px.ch - 6}" rx="6"/>`); });
    if (pend.type === 'target' && pend.ids) pend.ids.forEach(id => { const p = piece(id); if (!p) return; const px = GG().pix(W, p.x, p.y); hl.push(`<rect class="gtarget" x="${px.x + 2}" y="${px.y + 2}" width="${px.cw - 4}" height="${px.ch - 4}" rx="6"/>`); });
    if (ui.place) { Object.keys(W.cells).forEach(k => { const [x, y] = k.split(',').map(Number); if (!GG().walkable(W, S, x, y)) return; const px = GG().pix(W, x, y); hl.push(`<rect class="gplace" data-cell="${k}" x="${px.x + 3}" y="${px.y + 3}" width="${px.cw - 6}" height="${px.ch - 6}" rx="6"/>`); }); }
    if (ui.losRect) { const [x0, y0, x1, y1] = ui.losRect.r; const a = GG().pix(W, x0, y0), b = GG().pix(W, x1, y1); if (a && b) hl.push(`<rect class="glos ${ui.losRect.ok ? 'ok' : ''}" x="${a.x}" y="${a.y}" width="${b.x + b.cw - a.x}" height="${b.y + b.ch - a.y}" rx="8"/>`); }
    // icônes de mise en place : events non atteints
    Object.entries(d.events || {}).forEach(([k, e]) => { if (g.ev[k]) return; const px = GG().pix(W, e.x, e.y); hl.push(`<g class="gev" transform="translate(${px.cx},${px.cy})"><rect x="-14" y="-14" width="28" height="28" rx="5"/><text text-anchor="middle" dominant-baseline="central">${k}</text></g>`); });
    const r0 = Math.min(d.parts[0].cw, d.parts[0].ch);
    const pcs = g.pieces.filter(p => p.x != null).map(p => {
      const px = GG().pix(W, p.x, p.y); if (!px) return '';
      const cur = mode === 'play' && p.k === 'player' && g.phase === 1 && g.players[g.cur] && g.players[g.cur].name === p.owner;
      const tk = ['q', 'a', 'ko2', 'ko1', 'dead'].includes(p.k);
      // les jetons se décalent en coin pour ne pas cacher la figurine
      const ox = tk ? px.cw * 0.28 : 0, oy = tk ? px.ch * 0.28 : 0;
      const sel = ui.sel === p.id ? 'sel' : '';
      const R = r0 * (tk ? 0.2 : 0.36);
      let inner = '';
      if (p.k === 'player') inner = `<circle r="${R}" fill="${CC[p.owner] || '#fff'}" stroke="#fff" stroke-width="${R * 0.18}"/><text class="gtx" font-size="${R * 1.15}">${CE[p.owner] || p.owner[0]}</text>`;
      else if (p.k === 'guard' || p.k === 'boss' || p.k === 'cam') {
        const col = p.k === 'boss' ? '#e08aff' : p.k === 'cam' ? '#3dffa0' : '#9fd2ff', fill = p.k === 'boss' ? '#4a1f5a' : p.k === 'cam' ? '#123a2a' : '#28395a';
        const f = p.k === 'cam' ? (g.cam === 'orange' ? (p.f2 || p.f) : p.f) : p.f;
        inner = `<g class="grot" style="transform:rotate(${ROTD[f] || 0}deg)"><rect x="${-R}" y="${-R}" width="${2 * R}" height="${2 * R}" rx="${R * 0.3}" fill="${fill}" stroke="${col}" stroke-width="${R * 0.16}"/><path d="M ${-R * 0.45} ${-R * 1.02} L 0 ${-R * 1.6} L ${R * 0.45} ${-R * 1.02} Z" fill="${col}"/></g><text class="gtx" font-size="${R * 1.05}">${p.k === 'guard' ? '💂' : p.k === 'boss' ? (BOSSE[m.id] || '👾') : '📹'}</text>${p.hurt ? `<circle r="${R * 1.25}" fill="none" stroke="#ff4d5e" stroke-width="3"/>` : ''}`;
      } else {
        const cfg = { q: ['#1f8bff', '?'], a: ['#e01f35', '!'], ko2: ['#2a2a12', '★★'], ko1: ['#2a2a12', '★'], dead: ['#2b2b33', '☠'] }[p.k];
        inner = `<rect x="${-R}" y="${-R}" width="${2 * R}" height="${2 * R}" rx="${R * 0.25}" fill="${cfg[0]}" stroke="#fff" stroke-width="2"/><text class="gtx" font-size="${R * (p.k === 'ko2' ? 0.8 : 1.1)}" fill="${p.k.startsWith('ko') ? '#ffd166' : '#fff'}">${cfg[1]}</text>`;
      }
      return `<g class="gp ${p.k} ${sel} ${cur ? 'cur' : ''}" data-pc="${p.id}" style="transform:translate(${px.cx + ox}px,${px.cy + oy}px)">${inner}</g>`;
    }).join('');
    if (ui.edit) {
      W.walls.forEach(k => { const [a, b] = k.split('|').map(s => s.split(',').map(Number)); const pa = GG().pix(W, a[0], a[1]); if (!pa) return;
        const ln = a[1] === b[1] ? [pa.x + pa.cw, pa.y, pa.x + pa.cw, pa.y + pa.ch] : [pa.x, pa.y + pa.ch, pa.x + pa.cw, pa.y + pa.ch];
        hl.push(`<line class="gwall" x1="${ln[0]}" y1="${ln[1]}" x2="${ln[2]}" y2="${ln[3]}"/>`); });
      Object.keys(W.cells).forEach(k => { if (W.cells[k] !== '#') return; const [x, y] = k.split(',').map(Number); const px = GG().pix(W, x, y); hl.push(`<rect class="gobst" x="${px.x + 3}" y="${px.y + 3}" width="${px.cw - 6}" height="${px.ch - 6}"/>`); });
    }
    const info = ui.edit ? (ui.edit === 'wall' ? '✏️ Touche près du BORD d\'une case pour ajouter / retirer un mur' : '✏️ Touche une case pour la passer obstacle ↔ sol') : ui.place ? '👆 Touche une case pour poser le pion' : pend.type === 'move' ? '👆 Touche une case verte' : pend.type === 'target' ? '👆 Touche la cible encadrée en rouge' : ui.sel ? '👆 Touche une case pour déplacer ce pion, ou ✕' : 'Touche un pion pour ses options';
    return `<div class="ma-bd"><div class="ma-bdt"><button class="ma-b sm" data-a="zoom" data-v="-1">🔍−</button><button class="ma-b sm" data-a="zoom" data-v="1">🔍+</button>
        <button class="ma-b sm ${st.showLOS ? 'on' : ''}" data-a="los" title="Montrer les cases vues par les gardes et caméras">👁️ Zones vues</button>
        <button class="ma-b sm ${ui.edit ? 'on' : ''}" data-a="edit" title="Corriger les murs et obstacles du plan">✏️ Corriger</button>
        ${ui.edit ? `<button class="ma-b sm ${ui.edit === 'wall' ? 'on' : ''}" data-a="editMode" data-v="wall">🧱 Mur</button><button class="ma-b sm ${ui.edit === 'cell' ? 'on' : ''}" data-a="editMode" data-v="cell">🟥 Obstacle</button><button class="ma-b sm" data-a="editExport">📤 Exporter</button><button class="ma-b sm red" data-a="editReset">↺</button>` : ''}
        <span style="flex:1;opacity:.85;font-size:.9rem">${info}</span></div>
      <div class="ma-bds"><svg class="ma-svg" id="maSvg" viewBox="0 0 ${d.w} ${d.h}" preserveAspectRatio="xMidYMid meet" style="${(st.zoom || 1) > 1 ? `width:${Math.round(100 * st.zoom)}%;height:auto` : 'width:100%;height:100%'}"><image href="${d.img}" width="${d.w}" height="${d.h}"/>
        <g>${cells.join('')}</g><g>${hl.join('')}</g><g>${pcs}</g></svg></div></div>`;
  }
  function svgPoint(svg, e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function cellAt(m, ux, uy) {
    for (const p of GRID(m).parts) {
      const cx = Math.floor((ux - p.x0) / p.cw), cy = Math.floor((uy - p.y0) / p.ch);
      if (cx >= 0 && cy >= 0 && cx < p.cols && cy < p.rows) return { x: cx + (p.gx || 0), y: cy + (p.gy || 0) };
    }
    return null;
  }
  function bindGrid() {
    const svg = $('#maSvg', root); if (!svg) return;
    svg.addEventListener('click', e => {
      const m = mission(), g = game();
      const pc = e.target.closest('[data-pc]');
      const u = svgPoint(svg, e); const c = cellAt(m, u.x, u.y);
      if (ui.edit && c) return editAt(m, c, u);
      const pcp = pc && piece(pc.dataset.pc), mine = pcp && pcp.k === 'player' && g.players[g.cur] && g.players[g.cur].name === pcp.owner;
      if (pc && (!(ui.pend && ui.pend.type === 'move') || mine) && !ui.place) return gridTapPiece(pcp, c);
      if (c) gridTapCell(c);
    });
  }
  function editAt(m, c, u) {
    const W = world(m), px = GG().pix(W, c.x, c.y);
    if (ui.edit === 'cell') { const cur = W.cells[cellKey(c.x, c.y)] || ' '; toggleFix(m, 'cell', cellKey(c.x, c.y), cur === '#' ? '.' : '#'); render(); return; }
    const fx = (u.x - px.x) / px.cw, fy = (u.y - px.y) / px.ch;
    const d = [['left', fx], ['right', 1 - fx], ['up', fy], ['down', 1 - fy]].sort((a, b) => a[1] - b[1])[0][0];
    const [dx, dy] = GG().DIRS[d], n = { x: c.x + dx, y: c.y + dy };
    const a = (n.x < c.x || n.y < c.y) ? n : c, b = a === n ? c : n;
    toggleFix(m, 'wall', `${a.x},${a.y}|${b.x},${b.y}`); render();
  }
  function gridTapPiece(p, c) {
    const g = game();
    if (ui.pend && ui.pend.type === 'target') { if (ui.pend.ids.includes(p.id)) return chooseTarget(p); toast('Ce n\'est pas une cible valable (encadrées en rouge).'); return; }
    if (ui.sel && ui.sel !== p.id && c) return gridTapCell(c);
    if (p.k === 'player' && st.screen === 'play' && g.phase === 1 && g.players[g.cur] && g.players[g.cur].name === p.owner && !ui.pad) {
      if (ui.pend) ui.pend = null; else if (!armMove(mission(), g, g.players[g.cur], 'sneak')) toast('Plus de déplacement possible.');
      ui.sel = null; render(); return;
    }
    ui.sel = ui.sel === p.id ? null : p.id;
    if (p.k === 'player' && st.screen === 'play' && g.phase === 1) { const i = g.players.findIndex(x => x.name === p.owner); if (i >= 0 && !g.players[i].done && i !== g.cur) { g.cur = i; ui.sel = null; } }
    render();
  }
  function gridTapCell(c) {
    const m = mission(), g = game(), W = world(m), S = toS(g), k = cellKey(c.x, c.y);
    if (ui.pend && ui.pend.type === 'move') {
      if (ui.busy) return;
      if (ui.pend.cells && ui.pend.cells[k]) return gridMove(c, ui.pend.cells[k]);
      const me = playerPiece(g, g.players[g.cur].name);
      if (me && me.x === c.x && me.y === c.y) { ui.pend = null; render(); return; }
      toast('Case hors de portée (cases vertes).'); return;
    }
    if (!ui.place && !ui.sel && !ui.pend && st.screen === 'play' && g.phase === 1 && g.players[g.cur]) { const me = playerPiece(g, g.players[g.cur].name); if (me && me.x === c.x && me.y === c.y) return gridTapPiece(me, c); }
    if (ui.place) { if (!GG().walkable(W, S, c.x, c.y)) return; snap(); const p = piece(ui.place); p.x = c.x; p.y = c.y; ui.place = null; save(); render(); return; }
    if (ui.sel) { const p = piece(ui.sel); if (p && GG().walkable(W, S, c.x, c.y)) { snap(); p.x = c.x; p.y = c.y; if (p.k === 'player') followTokens(g, p.owner); log(`✋ Pion corrigé : ${p.k === 'player' ? p.owner : p.k} → ${k}`, 'sys'); save(); } ui.sel = null; render(); }
  }
  function followTokens(g, name) { /* le jeton Attention reste là où il a été posé (règles) */ }

  /* animation d'un pion le long d'un chemin (sans re-rendu) */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function animTo(m, id, x, y, f, ms = 330) {
    const el = root.querySelector(`[data-pc="${id}"]`); const W = world(m); const px = GG().pix(W, x, y);
    if (el && px) { el.style.transition = `transform ${ms}ms cubic-bezier(.4,.1,.3,1)`; el.style.transform = `translate(${px.cx}px,${px.cy}px)`; if (f) { const r = el.querySelector('.grot'); if (r) r.style.transform = `rotate(${ROTD[f]}deg)`; } }
    await sleep(ms);
  }
  function armMove(m, g, p, id) {
    const a = ACTS.find(q => q.id === id), pp = playerPiece(g, p.name);
    if (!a || a.c > p.left || !pp || pp.x == null) return false;
    const S = toS(g), cells = GG().reach(world(m), S, S.figs.find(f => f.id === pp.id), a.move);
    if (!Object.keys(cells).length) return false;
    ui.pend = { type: 'move', act: id, cells }; return true;
  }
  // une action est-elle jouable maintenant ? → null, sinon la raison (plateau quadrillé)
  function whyNot(m, g, p, a) {
    if (a.c > p.left) return 'plus assez de points';
    if (a.need && !hasItem(p, a.need)) return { ration: 'pas de ration', chaff: 'pas de chaff', grenade: 'pas de grenade', gun: 'pas d\'arme', sgun: 'pas d\'arme silencieuse' }[a.need];
    if (!isGrid(m)) return null;
    const pp = playerPiece(g, p.name); if (!pp || pp.x == null) return a.move || a.atk ? 'pion pas posé' : null;
    const W = world(m), S = toS(g), me = S.figs.find(f => f.id === pp.id), here = cellKey(pp.x, pp.y);
    const near = ks => g.pieces.some(x => ks.includes(x.k) && x.x != null && Math.abs(x.x - pp.x) + Math.abs(x.y - pp.y) <= 1 && !GG().wallBetween(W, x, pp));
    if (a.gun && W.noFire.has(here)) return 'No Fire Zone';
    if (a.id === 'sneak' || a.id === 'dash') return Object.keys(GG().reach(W, S, me, a.move)).length ? null : 'bloqué';
    if (a.id === 'drag' || a.id === 'disguise') return near(['ko1', 'ko2', 'dead']) ? null : 'aucun corps à côté';
    if (a.id === 'h2h' || a.id === 'combo') return GG().adjacentTargets(W, S, me).length ? null : 'aucun garde à côté';
    if (a.id === 'silent') return GG().behindTargets(W, S, me).length ? null : 'pas dans le dos d\'un garde';
    if (a.id === 'shoot' || a.id === 'shootS') return GG().losTargets(W, S, me).length ? null : 'aucune cible en vue';
    if (a.id === 'elev') return W.shaftOf[here] || GG().shaftAdjacent(W, pp.x, pp.y).length ? null : 'pas d\'ascenseur ici';
    return null;
  }
  async function gridMove(dest, info) {
    const m = mission(), g = game(), W = world(m), p = g.players[g.cur], a = ACTS.find(q => q.id === ui.pend.act);
    const pp = playerPiece(g, p.name); if (!pp) return;
    snap(); ui.pend = null; ui.busy = true;
    const pp0 = { x: pp.x, y: pp.y };
    spend(g, p, a); p.s.move++;
    const kind = a.id === 'dash' ? 'dash' : 'sneak';
    const seenBy = new Map(); const leaps = [];
    const S0 = toS(g);
    const d = GRID(m);
    for (const node of info.path) {
      if (p.water || GG().code(W, node.x, node.y) === '~') A.sfx(AU().water); else { const arr = AU()[kind] || []; if (arr.length) A.sfx(arr[stepAlt++ % arr.length]); }
      await animTo(m, pp.id, node.x, node.y);
      pp.x = node.x; pp.y = node.y;
      (node.leap || []).forEach(id => { const f = S0.figs.find(q => q.id === id); if (f && f.kind === 'guard') leaps.push(id); });
      const S = toS(g);
      GG().watchers(W, S, { x: node.x, y: node.y }).forEach(w => { if (!seenBy.has(w.id)) seenBy.set(w.id, w); });
      Object.entries(d.events || {}).forEach(([k, e]) => { if (!g.ev[k] && e.x === node.x && e.y === node.y) triggerEvent(m, g, k); });
    }
    ui.busy = false;
    log(`${a.i} ${p.name} : ${a.n} → case ${dest.x},${dest.y}`, '', p.name);
    if (seenBy.size) {
      const list = [...seenBy.values()]; const cam = list.some(w => w.cam);
      if (cam) A.sfx(AU().camSpot);
      setTimeout(() => { setAtt(g, p, 2, cam && list.length === 1 ? 'vu par une caméra' : 'vu par un garde'); save(); render(); }, cam ? 650 : 0);
      toast(`👁️ <b>${p.name} est repéré</b> par ${list.map(w => w.cam ? 'une caméra' : 'un garde').join(', ')} !`, 3500);
    }
    if (leaps.length) {
      setAtt(g, p, 2, 'saut par-dessus un garde');
      ui.queue = leaps.map(() => ({ kind: 'guardAtk', victim: p.name, def: defOf(p.name), fixed: ['b', 'b'], title: `🤸 Le garde sauté attaque ${p.name} : 2 dés noirs`, defLabel: `de ${p.name}` }));
      openPad(ui.queue.shift());
    }
    if ((d.exits || []).some(e => e[0] === dest.x && e[1] === dest.y)) setTimeout(() => toast('🚪 <b>Sur la sortie !</b> Termine ton tour ici pour valider l\'objectif (si les conditions sont remplies).', 5000), 600);
    // fin de course contre un mur / obstacle → « on the wall »
    const last = info.path[info.path.length - 1], prev = info.path.length > 1 ? info.path[info.path.length - 2] : { x: pp0.x, y: pp0.y };
    const [ddx, ddy] = GG().DIRS[GG().dirOf(prev, last)], nx = { x: last.x + ddx, y: last.y + ddy };
    if (!GG().walkable(W, toS(g), nx.x, nx.y) || GG().wallBetween(W, last, nx)) setTimeout(() => A.sfx(AU().wall), 120);
    if (a.noisy && !leaps.length && p.noisy === a.c) toast(`${a.i} <b>${a.n}</b> : 🔊 bruyant → noise check à la fin de ton tour.`);
    ui.lastMove = a.id;
    if (!ui.pad && !g.over && (a.id === 'sneak' || a.id === 'dash')) armMove(m, g, p, a.id);
    save(); render();
  }
  function triggerEvent(m, g, k) {
    const e = (GRID(m).events || {})[k], ev = (m.events || []).find(x => x.k === k);
    g.ev[k] = true; A.sfx(AU()[(stageSnd(m).events || {})[k] || 'pop'] || AU().pop);
    log(`🅰️ Event ${k} atteint`, 'sys');
    if (e && e.fx) {
      if (e.fx.elev) g.elev = true;
      (e.fx.spawn || []).forEach((s, i) => g.pieces.push({ id: 'gs' + k + i + (Date.now() % 1000), k: 'guard', x: s[0], y: s[1], f: s[2] || 'down' }));
      if (e.fx.elev) setTimeout(() => A.sfx(AU().elevator), 700);
    }
    setTimeout(() => toast(`<span class="ma-ev">${k}</span> ${ev ? ev.d : ''}`, 7000), 300);
  }

  /* cibles possibles d'une attaque */
  function gridTargets(m, g, p, a) {
    const W = world(m), S = toS(g), me = S.figs.find(f => f.kind === 'player' && f.name === p.name);
    if (!me) return [];
    if (a.atk === 'silent') return GG().behindTargets(W, S, me).map(f => f.id);
    if (a.dice && (a.id === 'h2h' || a.id === 'combo')) return GG().adjacentTargets(W, S, me).map(f => f.id);
    return GG().losTargets(W, S, me).map(f => f.id);
  }

  /* ---------- phase ennemie : activation guidée des gardes ---------- */
  const MODE = { alert: '🚨 ALERTE (chiffre rouge)', investigate: '❓ ENQUÊTE (chiffre bleu)', patrol: '🚶 PATROUILLE (chiffre bleu)' };
  function gridEnemyHtml(m, g) {
    if (ui.pad) return padHtml(m, g);
    const s = g.step, cls = k => s === k ? 'cur' : s > k ? 'ok' : '';
    const hasCam = g.pieces.some(p => p.k === 'cam');
    const card = g.card || (g.card = { red: 6, blue: 4, arrow: 'right' });
    const num = (key, col) => `<div class="ma-att"><span style="min-width:96px">${col === 'r' ? '🔴 Chiffre rouge' : '🔵 Chiffre bleu'}</span>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="ma-b sm ${card[key] === n ? 'on' : ''}" data-a="card" data-k="${key}" data-v="${n}">${n}</button>`).join('')}</div>`;
    let h = `<div class="ma-card"><h4>🃏 Carte Guard Order</h4>
      <div class="ma-step ${cls(0)}"><span class="k">0</span><div class="bd">Pioche la carte du dessus. <b>GAME OVER</b> ? → perdu.<br><button class="ma-b pri" data-a="draw" ${s > 0 ? 'disabled' : ''}>🃏 Carte piochée</button> <button class="ma-b red" data-a="gameover" ${s > 0 ? 'disabled' : ''}>💀 GAME OVER</button></div></div>
      <div class="ma-step ${cls(1)}"><span class="k">I</span><div class="bd"><b>Section I</b> : quelle icône ?<br>
        <button class="ma-b sm" data-a="s1" data-v="waken" ${s !== 1 ? 'disabled' : ''}>✨ Réveil</button> <button class="ma-b sm" data-a="s1" data-v="radio" ${s !== 1 ? 'disabled' : ''}>📻 Radio-In</button> <button class="ma-b sm" data-a="s1" data-v="lost" ${s !== 1 ? 'disabled' : ''}>☠ Lost Contact</button> <button class="ma-b sm" data-a="s1" data-v="stay" ${s !== 1 ? 'disabled' : ''}>❓ Stay Alert</button></div></div>
      <div class="ma-step ${cls(2)}"><span class="k">II</span><div class="bd"><b>Section II — caméras</b>${hasCam ? ` (face ${g.cam === 'vert' ? '🟩 verte' : '🟧 orange'})<br><button class="ma-b sm" data-a="cam" data-v="flip" ${s !== 2 ? 'disabled' : ''}>🔄 La carte fait pivoter</button> <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>Pas de pivot</button>` : ` : aucune caméra. <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>OK</button>`}</div></div>
      <div class="ma-step ${cls(3)}"><span class="k">III</span><div class="bd"><b>Section III</b> : recopie la carte puis active les gardes.${num('red', 'r')}${num('blue', 'b')}
        <div class="ma-att"><span style="min-width:96px">↪ Flèche</span><button class="ma-b sm ${card.arrow === 'left' ? 'on' : ''}" data-a="card" data-k="arrow" data-v="left">⟲ gauche</button><button class="ma-b sm ${card.arrow === 'right' ? 'on' : ''}" data-a="card" data-k="arrow" data-v="right">⟳ droite</button></div>
        ${s === 3 ? seqHtml(m, g) : ''}</div></div></div>`;
    return h;
  }
  function seqHtml(m, g) {
    const sq = ui.seq;
    if (!sq) return `<button class="ma-b pri big" data-a="seqStart">▶ Activer les gardes</button>`;
    if (ui.react) return `<div class="ma-ask warn"><p>🃏 <b>Guard Reaction</b> : le garde est sur ${ui.react.tokens.map(t => t.kind === '?' || t.kind === '!' ? `le jeton ${t.kind} de ${t.owner}` : t.kind === 'dead' ? 'un corps' : 'un garde KO').join(', ')}. Pioche une carte Guard Reaction et lis-la : que dit-elle ?</p>
      ${ui.react.tokens.map(t => `<div style="margin:4px 0"><b>${t.kind}</b> ${t.owner || ''} : <button class="ma-b sm" data-a="react" data-v="rm" data-t="${t.id}">Retirer</button> ${t.kind === '?' ? `<button class="ma-b sm" data-a="react" data-v="up" data-t="${t.id}">? → !</button>` : ''}${t.kind === 'ko2' || t.kind === 'ko1' ? `<button class="ma-b sm" data-a="react" data-v="wake" data-t="${t.id}">Il le réveille</button>` : ''} <button class="ma-b sm" data-a="react" data-v="keep" data-t="${t.id}">Rien</button></div>`).join('')}
      <button class="ma-b" data-a="reactDone">✔ Fait</button></div>`;
    if (sq.i >= sq.ids.length) return `<div class="ma-res">✅ Tous les gardes ont joué.</div><button class="ma-b pri big" data-a="nextRound">▶ Round ${g.round + 1}</button>`;
    const id = sq.ids[sq.i], gp = piece(id);
    return `<div class="ma-ask"><p><b>Garde ${sq.i + 1}/${sq.ids.length}</b>${sq.last ? `<br>${sq.last}` : ''}</p>
      <button class="ma-b pri big" data-a="seqGo" ${ui.busy ? 'disabled' : ''}>▶ Activer ${sq.i ? 'le suivant' : 'le premier'}</button> <button class="ma-b sm" data-a="seqSkip">Passer</button></div>`;
  }
  async function runGuard(m, g) {
    const sq = ui.seq, id = sq.ids[sq.i], W = world(m);
    const gp = piece(id); if (!gp || gp.k !== 'guard') { sq.i++; save(); render(); return; }
    ui.sel = id; ui.busy = true; render();
    const r = GG().activate(W, toS(g), id, g.card);
    const tgt = r.target ? ` → vers le ${r.target.kind} ${r.target.owner ? 'de ' + r.target.owner : ''}` : '';
    sq.last = `${MODE[r.mode]}${tgt}`;
    toast(`💂 Garde ${sq.i + 1} : <b>${MODE[r.mode]}</b>${tgt}`, 2500);
    let seen = null, react = null;
    for (const s of r.steps) {
      if (s.t === 'move') { await animTo(m, id, s.x, s.y, s.f, 380); gp.x = s.x; gp.y = s.y; gp.f = s.f; }
      else if (s.t === 'turn') { await animTo(m, id, gp.x, gp.y, s.f, 260); gp.f = s.f; }
      else if (s.t === 'see') seen = s; else if (s.t === 'reaction') react = s;
    }
    gp.x = r.g.x; gp.y = r.g.y; gp.f = r.g.f;
    const moves = r.steps.filter(s => s.t === 'move').length;
    log(`💂 Garde ${sq.i + 1} : ${MODE[r.mode]}, ${moves} case(s)${seen ? ', voit ' + seen.player : ''}${react ? ', Guard Reaction' : ''}`, seen ? 'alert' : 'sys');
    ui.busy = false; ui.sel = null; sq.i++;
    sq.last += ` — ${moves} case(s)${seen ? ` — 👁️ voit ${seen.player} !` : react ? ' — arrive sur un jeton' : ''}. Réplique sur le plateau.`;
    if (seen) {
      const q = g.players.find(p => p.name === seen.player);
      A.sfx('guard-there-he-is_JHZ7rPO.mp3'); setAtt(g, q, 2, 'vu par un garde');
      const pp = playerPiece(g, q.name), ps = pp && GG().pix(W, pp.x, pp.y);
      openPad({ kind: 'guardAtk', victim: q.name, def: defOf(q.name), fixed: ['b', 'b'], title: `👁️ Le garde attaque ${q.name} : lance 2 dés noirs`, hint: 'Focus possible : modifie la valeur avant de la taper.', defLabel: `de ${q.name}` });
    } else if (react) { A.sfx('guard-what-was-that-noise_IVtXtq7.mp3'); ui.react = react; }
    save(); render();
  }
  // Réveil / Radio-In / Lost Contact / Stay Alert en mode quadrillage
  function gridSection1(m, g, v) {
    const W = world(m);
    if (v === 'waken') {
      const az = GG().activeZones(W, toS(g)); let up = 0, down = 0;
      g.pieces.forEach(p => { if (!az.has(GG().zoneOf(W, p.x, p.y))) return; if (p.k === 'ko1') { p.k = 'guard'; p.f = p.f || 'down'; up++; } else if (p.k === 'ko2') { p.k = 'ko1'; down++; } });
      A.sfx('guard-whered-he-go_zHLpH97.mp3'); log(`✨ Réveil : ${up} garde(s) debout, ${down} KO ★★ → ★`, 'sys');
      toast(`✨ Réveil : ${up} garde(s) se relèvent (oriente-les : touche-les puis ⟲⟳), ${down} KO passent à ★.`, 5000);
    }
    if (v === 'radio') {
      const S = toS(g), az = GG().activeZones(W, S); let n = 0;
      (GRID(m).barracks || []).forEach(b => {
        const z = GG().zoneOf(W, b.x, b.y); if (!az.has(z)) return;
        const have = g.pieces.filter(p => p.k === 'guard' && GG().zoneOf(W, p.x, p.y) === z).length;
        for (let i = have; i < b.count; i++) { g.pieces.push({ id: 'gr' + Date.now() % 100000 + i, k: 'guard', x: b.x, y: b.y, f: b.f || 'down' }); n++; }
      });
      A.sfx('guard-return-to-your-positions_9aocsFp.mp3'); log(`📻 Radio-In : ${n} renfort(s)`, 'sys');
      toast(n ? `📻 ${n} garde(s) en renfort sur l'icône radio du Barracks.` : '📻 Radio-In : pas de renfort (Guard Count atteint ou pas de Barracks).', 4500);
    }
    if (v === 'lost') { const dead = g.pieces.filter(p => p.k === 'dead').length, n = Math.floor(dead / 3); if (g.deck) { g.deck.drawn += n; g.deck.burned += n; } log(`☠ Lost Contact : ${n} carte(s) brûlée(s)`, 'sys'); toast(n ? `☠ ${n} carte(s) brûlée(s) (révélées, mises dessous). GAME OVER parmi elles ? → perdu.` : '☠ Lost Contact : moins de 3 morts, rien.', 4500); }
    if (v === 'stay') { const names = GG().stayAlert(W, toS(g)); names.forEach(nm => { const p = g.players.find(x => x.name === nm); if (p && p.att === 0) setAtt(g, p, 1, 'Stay Alert'); }); log(`❓ Stay Alert : ${names.join(', ') || 'personne'}`, 'sys'); if (!names.length) toast('❓ Stay Alert : personne à 2 cases d\'un garde.'); }
  }
  function camCheck(m, g) {
    const W = world(m), S = toS(g);
    g.players.forEach(p => { const pp = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (!pp) return; const cams = (S.cams || []).filter(c => !(c.x === pp.x && c.y === pp.y) && GG().los(W, S, c, pp, GG().camFacing(S, c)).ok); if (cams.length && p.att !== 2) { A.sfx(AU().camSpot); setTimeout(() => { setAtt(g, p, 2, 'vu par une caméra'); save(); render(); }, 700); } });
  }

  /* ======================= CSS ======================= */
  const css = `
  #mgsA{position:fixed;inset:0;z-index:99995;display:none;flex-direction:column;color:#e6eaff;font:15px/1.45 "Segoe UI",system-ui,sans-serif;
    background:radial-gradient(1100px 600px at 50% -12%,rgba(92,140,255,.30),transparent 62%),radial-gradient(700px 500px at 92% 18%,rgba(138,92,255,.18),transparent 60%),#080b22}
  #mgsA.show{display:flex} #mgsA *{box-sizing:border-box} #mgsA b{color:#fff}
  #mgsA{height:100dvh}
  .ma-h{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top));border-bottom:1px solid #26306a;background:rgba(8,10,32,.75)}
  .ma-h .lg{font:900 1rem system-ui;letter-spacing:1px;color:#9ec0ff;white-space:nowrap;margin-right:4px}
  .ma-h .ttl{font:800 1.05rem system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
  .ma-b{min-height:44px;min-width:44px;padding:8px 13px;border-radius:11px;border:1px solid #39407a;background:#151a40;color:#fff;font:700 15px system-ui;cursor:pointer;touch-action:manipulation}
  .ma-b:active{transform:scale(.97)} .ma-b:disabled{opacity:.35}
  .ma-b.pri{background:linear-gradient(135deg,#5b8cff,#8a5cff);border:none} .ma-b.red{background:#4a1220;border-color:#a3304a} .ma-b.on{background:#2c3a8a;border-color:#7aa7ff}
  .ma-b.sm{min-height:36px;min-width:36px;padding:5px 10px;font-size:14px} .ma-b.big{min-height:56px;font-size:18px;padding:10px 22px}
  .ma-steps{display:flex;gap:4px;padding:6px 10px;overflow-x:auto;border-bottom:1px solid #1d2556}
  .ma-steps .ma-b{flex:1 0 auto;font-size:14px;min-height:40px}
  .ma-c{flex:1;overflow:auto;padding:12px;-webkit-overflow-scrolling:touch;min-height:0}
  .ma-bar{display:flex;gap:6px;align-items:center;padding:6px 10px;padding-bottom:calc(6px + env(safe-area-inset-bottom));border-top:1px solid #26306a;background:rgba(8,10,32,.88)}
  .ma-bar .np{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#9aa6d6}
  .ma-card{background:rgba(20,26,66,.75);border:1px solid #2a3474;border-radius:14px;padding:12px 14px;margin:10px 0}
  .ma-card h4{margin:0 0 6px;font:800 1rem system-ui;color:#9ec0ff} .ma-card ul{margin:4px 0;padding-left:20px} .ma-card li{margin:3px 0}
  .ma-card.warn{border-color:#a3304a;background:rgba(60,14,30,.6)} .ma-card.warn h4{color:#ff9aaa}
  .ma-card.err{border-color:#b08a1c;background:rgba(60,48,8,.55)} .ma-card.err h4{color:#ffd166}
  .ma-card.boss{border-color:#8a4ac0} .ma-card.boss h4{color:#e0aaff}
  .ma-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 12px}
  .ma-ev{display:inline-flex;width:26px;height:26px;border-radius:7px;background:#c4202f;color:#fff;font:900 14px system-ui;align-items:center;justify-content:center;margin-right:6px;vertical-align:middle}
  .chip{display:inline-block;background:#1a2150;border:1px solid #2f3a80;border-radius:16px;padding:3px 10px;margin:2px;font-size:.88rem}
  .ma-next{display:flex;justify-content:flex-end;gap:8px;margin:14px 0 4px;flex-wrap:wrap}
  .ma-mis{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
  .ma-mt{position:relative;text-align:left;background:rgba(20,26,66,.8);border:1px solid #2a3474;border-radius:14px;padding:12px;color:#fff;cursor:pointer;font:inherit;min-height:96px}
  .ma-mt .nb{font:900 1.8rem system-ui;color:#2f3a80;position:absolute;right:10px;top:4px} .ma-mt .nm{font-weight:800;padding-right:44px} .ma-mt small{color:#9aa6d6}
  .ma-mt.ok{border-color:#3dffa0} .ma-mt.ok:after{content:"✔";position:absolute;right:12px;bottom:8px;color:#3dffa0;font-weight:900}
  .ma-mt.live{box-shadow:0 0 0 2px #7aa7ff}
  .ma-codec{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;background:linear-gradient(160deg,rgba(18,40,30,.85),rgba(8,20,16,.9));border:2px solid #2fd47a;border-radius:16px;padding:16px;box-shadow:0 0 30px rgba(47,212,122,.15)}
  .ma-codec .fq{font:900 1.6rem ui-monospace,Consolas,monospace;color:#5cffb0;text-shadow:0 0 12px rgba(92,255,176,.6)}
  .ma-codec .face{width:86px;height:86px;border-radius:12px;background:#0c2a1c;border:2px solid #2fd47a;display:flex;align-items:center;justify-content:center;font-size:44px}
  .ma-codec .txt{font:500 1.15rem/1.55 ui-monospace,Consolas,monospace;color:#c8ffe3;min-height:4em;white-space:pre-wrap}
  .ma-codec .cur{display:inline-block;width:.6em;background:#5cffb0;animation:mablink 1s steps(1) infinite}
  @keyframes mablink{50%{opacity:0}}
  .ma-play{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(330px,1fr);gap:12px;align-items:start}
  .ma-bd{background:#0c1130;border:1px solid #2a3474;border-radius:14px;padding:8px;position:sticky;top:0}
  .ma-bdt{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
  .ma-bds{max-height:min(72vh,820px);overflow:auto;border-radius:10px;background:#e9e7e2;touch-action:pan-x pan-y}
  .ma-map{position:relative;margin:0 auto;user-select:none;-webkit-user-select:none}
  .ma-map img{width:100%;display:block;pointer-events:none}
  .ma-map.pick{cursor:crosshair;outline:3px dashed #5b8cff;outline-offset:-3px}
  .ma-pc{position:absolute;width:var(--ps,30px);height:var(--ps,30px);margin:calc(var(--ps,30px)/-2) 0 0 calc(var(--ps,30px)/-2);border-radius:50%;
    display:flex;align-items:center;justify-content:center;font:900 calc(var(--ps,30px)*.5) system-ui;color:#fff;cursor:grab;touch-action:none;
    transition:left .45s cubic-bezier(.4,.1,.3,1),top .45s cubic-bezier(.4,.1,.3,1),transform .2s;box-shadow:0 3px 8px rgba(0,0,0,.55)}
  .ma-pc.drag{transition:none;cursor:grabbing;z-index:5}
  .ma-pc.player{background:var(--c);border:3px solid #fff;color:#0a0d22;z-index:3}
  .ma-pc.guard,.ma-pc.boss,.ma-pc.cam{border-radius:22%;background:#28395a;border:3px solid #9fd2ff}
  .ma-pc.boss{background:#4a1f5a;border-color:#e08aff} .ma-pc.cam{background:#123a2a;border-color:#3dffa0}
  .ma-pc .ar{position:absolute;left:50%;top:-24%;width:0;height:0;border-left:calc(var(--ps,30px)*.2) solid transparent;border-right:calc(var(--ps,30px)*.2) solid transparent;border-bottom:calc(var(--ps,30px)*.28) solid #9fd2ff;transform:translateX(-50%)}
  .ma-pc .rot{position:absolute;inset:0;transition:transform .3s}
  .ma-pc.boss .ar{border-bottom-color:#e08aff} .ma-pc.cam .ar{border-bottom-color:#3dffa0}
  .ma-pc.hurt{box-shadow:0 0 0 3px #ff4d5e,0 3px 8px rgba(0,0,0,.55)}
  .ma-pc.tk{border-radius:20%;width:calc(var(--ps,30px)*.82);height:calc(var(--ps,30px)*.82);margin:calc(var(--ps,30px)*-.41) 0 0 calc(var(--ps,30px)*-.41);font-size:calc(var(--ps,30px)*.42);z-index:2}
  .ma-pc.q{background:#1f8bff;border:2px solid #cfe6ff} .ma-pc.a{background:#e01f35;border:2px solid #ffd0d6}
  .ma-pc.ko2,.ma-pc.ko1{background:#2a2a12;border:2px solid #ffd166;color:#ffd166} .ma-pc.dead{background:#2b2b33;border:2px solid #bbb}
  .ma-pc.sel{transform:scale(1.25);outline:3px solid #fff;outline-offset:2px}
  .ma-pc.cur{animation:mapulse 1.4s infinite}
  @keyframes mapulse{50%{box-shadow:0 0 0 8px rgba(122,167,255,.35),0 3px 8px rgba(0,0,0,.55)}}
  .ma-tray{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .ma-tray .ma-b.wait{outline:2px dashed #7aa7ff}
  .ma-hud{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
  .ma-hud .pill{background:#141a46;border:1px solid #2f3a80;border-radius:10px;padding:6px 10px;font-weight:800}
  .ma-hud .pill.al{background:#5a0f1c;border-color:#e01f35;animation:maal 1s infinite}
  @keyframes maal{50%{background:#8a1426}}
  .ma-ph{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0}
  .ma-deck{display:flex;gap:2px;flex-wrap:wrap;margin:4px 0}.ma-deck i{width:11px;height:18px;border-radius:2px}.ma-deck i.b{background:#2f7dd6}.ma-deck i.r{background:#d63045}.ma-deck i.x{background:#20264d}
  .ma-p{background:rgba(20,26,66,.85);border:2px solid var(--c,#2a3474);border-radius:14px;padding:10px 12px}
  .ma-p h5{margin:0;font:900 1.15rem system-ui;display:flex;align-items:center;gap:8px}
  .ma-tok{display:flex;gap:6px;margin:8px 0;align-items:center}
  .ma-tok i{width:28px;height:28px;border-radius:50%;background:#5b8cff;border:3px solid #cfdcff;transition:.25s}.ma-tok i.u{background:#1a2148;border-color:#39407a}
  .ma-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}
  .ma-act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:60px;border-radius:12px;border:1px solid #2f3a80;background:#141a46;color:#fff;font:700 12.5px system-ui;cursor:pointer;padding:5px}
  .ma-act .i{font-size:21px} .ma-act small{color:#9aa6d6;font-weight:600}
  .ma-act.loud{border-color:#a3304a}.ma-act.noisy{border-color:#9a6a2a}.ma-act:disabled{opacity:.32;filter:grayscale(1)}
  .ma-act:disabled small{color:#ff9aa5}
  .ma-inv{padding:6px 0;border-bottom:1px dashed #26306a}.ma-inv:last-child{border-bottom:0}
  .ma-inv-h{display:flex;align-items:center;gap:6px;margin-bottom:3px}.ma-inv-h .warn{color:#ff8a96!important;opacity:1!important}
  .ma-inv-add{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px}.ma-inv-add .num{min-width:0;padding:3px 6px;font-size:.8rem}
  .ma-invl{display:flex;flex-wrap:wrap;gap:2px;align-items:center;margin:4px 0;font-size:.9rem}.ma-invl .chip{padding:1px 8px;font-size:.8rem}
  .ma-mini{border:1px solid #39407a;background:#1a2150;color:#fff;border-radius:7px;min-width:24px;height:24px;padding:0 5px;margin:0 2px;font:700 13px system-ui;cursor:pointer}
  .ma-mini.red{border-color:#a3304a;color:#ff9aa5}.ma-mini.on{background:#2f4bd0}
  .ma-act.on{background:#1f7a4a;border-color:#3dffa0;box-shadow:0 0 0 2px #3dffa0 inset}
  .ma-mv{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0;padding:6px 8px;border-radius:10px;background:rgba(61,255,160,.12);border:1px solid #3dffa0}
  .ma-att{display:flex;gap:6px;align-items:center;margin:6px 0;flex-wrap:wrap}
  .ma-att .q.on{background:#1f8bff;border-color:#cfe6ff}.ma-att .a.on{background:#e01f35;border-color:#ffd0d6}
  .ma-hp{display:flex;gap:3px}.ma-hp i{width:16px;height:16px;border-radius:4px;background:#e01f35}.ma-hp i.d{background:#2a2f55}
  .ma-ask{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(91,140,255,.12);border:1px solid #5b6bd0}
  .ma-ask.warn{background:rgba(255,179,92,.12);border-color:#9a6a2a}
  .ma-ask p{margin:0 0 8px}
  .ma-step{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:12px;border:1px solid #2a3474;margin:8px 0;background:rgba(20,26,66,.6)}
  .ma-step.cur{border-color:#7aa7ff;box-shadow:0 0 14px rgba(122,167,255,.3)} .ma-step.ok{opacity:.55}
  .ma-step .k{flex:0 0 34px;height:34px;border-radius:10px;background:#5b8cff;display:flex;align-items:center;justify-content:center;font:900 15px system-ui}
  .ma-step .bd{flex:1}
  .ma-mode{padding:9px 11px;border-radius:12px;margin:6px 0;font-weight:700}
  .ma-mode.al{background:rgba(224,31,53,.18);border:1px solid #e01f35}.ma-mode.iv{background:rgba(31,139,255,.15);border:1px solid #1f8bff}
  .ma-dice{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
  .ma-die{width:52px;height:52px;border-radius:11px;display:flex;align-items:center;justify-content:center;font:900 24px system-ui;border:3px solid transparent}
  .ma-die.w{background:#f2f2ee;color:#111}.ma-die.b{background:#1b1b1b;color:#fff;border-color:#555}
  .ma-die.e{opacity:.45}.ma-die.hit{border-color:#3dffa0;box-shadow:0 0 12px rgba(61,255,160,.6)}.ma-die.bang{border-color:#ff4d5e}
  .ma-kp{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:6px 0}
  .ma-kp .ma-b{font-size:20px;min-height:52px}
  .ma-res{padding:10px 12px;border-radius:12px;background:rgba(61,255,160,.10);border:1px solid #2fbf7a;margin:8px 0}
  .ma-res.bad{background:rgba(224,31,53,.14);border-color:#e01f35}
  .ma-res .do{margin-top:6px;color:#ffe9a8}
  .ma-turnban{position:fixed;left:0;right:0;top:38%;z-index:99999;text-align:center;pointer-events:none;animation:matban 1.9s ease-out forwards}
  .ma-turnban div{display:inline-block;padding:18px 40px;border-radius:18px;background:linear-gradient(135deg,rgba(91,140,255,.95),rgba(138,92,255,.95));font:900 clamp(1.6rem,5vw,3rem) system-ui;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.6)}
  @keyframes matban{0%{opacity:0;transform:translateX(-30%)}15%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateX(20%)}}
  .ma-toast{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:99999;background:#10163f;border:1px solid #7aa7ff;border-radius:14px;padding:10px 16px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:92vw;text-align:center;animation:mat .25s}
  @keyframes mat{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  .ma-ban{padding:14px;border-radius:14px;text-align:center;font:900 1.3rem system-ui;margin:8px 0}
  .ma-ban.go{background:#3a0c16;border:2px solid #e01f35;color:#ffb0bc}.ma-ban.win{background:#0f3a2a;border:2px solid #3dffa0;color:#b8ffd8}
  .ma-log{list-style:none;margin:0;padding:0;font-size:.93rem}
  .ma-log li{display:grid;grid-template-columns:62px 40px 1fr;gap:6px;padding:5px 2px;border-bottom:1px dashed #222b60}
  .ma-log .t{font:700 .85rem ui-monospace,Consolas,monospace;color:#7aa7ff}.ma-log .r{color:#9aa6d6;font-size:.85rem}
  .ma-log li.alert .x{color:#ff9aaa}.ma-log li.win .x{color:#3dffa0}.ma-log li.go .x{color:#ff6b7a}.ma-log li.sys .x{color:#9ec0ff}
  .ma-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .ma-stat{background:#141a46;border:1px solid #2f3a80;border-radius:12px;padding:10px;text-align:center}
  .ma-stat b{display:block;font:900 1.6rem system-ui;color:#7aa7ff}
  table.ma-tab{width:100%;border-collapse:collapse;font-size:.93rem}table.ma-tab th,table.ma-tab td{padding:6px;border-bottom:1px solid #26306a;text-align:center}table.ma-tab th:first-child,table.ma-tab td:first-child{text-align:left}
  .ma-snd{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .ma-snd button{min-height:56px;border-radius:12px;border:1px solid #2f3a80;background:#141a46;color:#fff;font:700 14px system-ui;cursor:pointer;padding:6px 8px}
  .ma-snd button.mu{background:linear-gradient(135deg,#1d2a6b,#3a2470);border-color:#5b6bd0}.ma-snd button.vo{border-color:#8a4ac0}
  .ma-h3{font:800 1.05rem system-ui;margin:16px 0 8px;color:#c9d4ff}
  .ma-chk{list-style:none;margin:0;padding:0}.ma-chk li{display:flex;gap:10px;padding:8px 4px;border-bottom:1px dashed #26306a;cursor:pointer}
  .ma-chk .bx{flex:0 0 24px;height:24px;border:2px solid #5b8cff;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900}
  .ma-chk li.ok .bx{background:#5b8cff}.ma-chk li.ok .tx{opacity:.5;text-decoration:line-through}
  .mcw{width:170px;height:104px;display:block;margin:6px 0}
  .mcw-c{fill:#151c40;stroke:#26306a}.mcw-c.lit{fill:rgba(255,209,102,.28);stroke:#ffd166}
  .mcw-cam{transition:transform .9s cubic-bezier(.4,.1,.3,1);transform-origin:0 0}
  .ma-svg{display:block;margin:0 auto;max-width:none;touch-action:manipulation;user-select:none;-webkit-user-select:none}
  .ma-svg .gc{fill:transparent;stroke:rgba(10,20,60,.28);stroke-width:1.2}
  .ma-svg .greach{fill:rgba(61,255,160,.28);stroke:#2fbf7a;stroke-width:3;cursor:pointer;animation:gpul 1.2s infinite alternate}
  .ma-svg .gplace{fill:rgba(91,140,255,.18);stroke:#5b8cff;stroke-width:2;stroke-dasharray:6 5;cursor:pointer}
  .ma-svg .gtarget{fill:rgba(224,31,53,.22);stroke:#ff4d5e;stroke-width:4;animation:gpul 1s infinite alternate}
  .ma-svg .gseen{fill:rgba(255,209,102,.30)}
  .ma-svg .gwall{stroke:#ff2bd6;stroke-width:7;stroke-linecap:round}
  .ma-svg .gobst{fill:rgba(255,40,60,.35);stroke:#ff2b3c;stroke-width:2}
  .ma-svg .glos{fill:none;stroke:#ff4d5e;stroke-width:4;stroke-dasharray:12 7}
  .ma-svg .gev rect{fill:#c4202f;stroke:#fff;stroke-width:2}.ma-svg .gev text{fill:#fff;font:900 18px system-ui}
  .ma-svg .gp{cursor:pointer;transition:transform .33s cubic-bezier(.4,.1,.3,1)}
  .ma-svg .gp .grot{transition:transform .26s}
  .ma-svg .gtx{font-weight:900;text-anchor:middle;dominant-baseline:central;fill:#fff;pointer-events:none}
  .ma-svg .gp.sel circle,.ma-svg .gp.sel rect{stroke:#fff!important;stroke-width:5}
  .ma-svg .gp.cur circle{animation:gcur 1.2s infinite}
  @keyframes gpul{to{opacity:.55}} @keyframes gcur{50%{stroke:#ffd166;stroke-width:7}}
  .ma-c.fit{overflow:hidden;padding:6px 8px}
  .ma-c.fit .ma-play{height:100%;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:8px}
  .ma-c.fit .ma-play>div{min-height:0;height:100%;overflow:auto;-webkit-overflow-scrolling:touch}
  .ma-c.fit .ma-play>div:first-child{overflow:hidden}
  .ma-c.fit .ma-bd{height:100%;display:flex;flex-direction:column;position:static;padding:6px}
  .ma-c.fit .ma-bdt{margin-bottom:4px}
  .ma-c.fit .ma-bds{flex:1;min-height:0;max-height:none}
  .ma-c.fit .ma-play>div:first-child>p{display:none}
  .ma-c.fit .ma-card{margin:6px 0;padding:8px 10px}
  .ma-c.fit .ma-hud{margin-bottom:4px}.ma-c.fit .ma-hud .pill{padding:4px 8px}
  .ma-c.fit .ma-ph{margin:4px 0}.ma-c.fit .ma-ph .ma-b{min-height:34px}
  .ma-c.fit .ma-deck i{height:12px;width:8px}
  .ma-c.fit .ma-p{padding:8px 10px}.ma-c.fit .ma-p h5{font-size:1.02rem}
  .ma-c.fit .ma-tok{margin:4px 0}.ma-c.fit .ma-tok i{width:22px;height:22px}
  .ma-c.fit .ma-att{margin:4px 0}
  .ma-c.fit .ma-acts{grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:4px}
  .ma-c.fit .ma-act{min-height:40px;font-size:11px;padding:2px 3px;border-radius:9px;line-height:1.1}.ma-c.fit .ma-act .i{font-size:16px}.ma-c.fit .ma-act small{font-size:9.5px}
  .ma-c.fit .ma-p>p{display:none}.ma-c.fit .ma-mv{margin:4px 0;padding:3px 6px}
  .ma-c.fit .ma-step{padding:6px 8px;margin:5px 0}.ma-c.fit .ma-step .k{flex-basis:28px;height:28px}
  .ma-c.fit .ma-kp .ma-b{min-height:44px}.ma-c.fit .ma-die{width:44px;height:44px;font-size:20px}
  .ma-rot{display:none;position:absolute;inset:0;z-index:20;background:rgba(6,8,26,.97);align-items:center;justify-content:center;text-align:center;font:600 1.1rem system-ui}
  .ma-rot div{font-size:3rem;line-height:1.3}.ma-rot b{font-size:1.4rem}.ma-rot span{font-size:1rem;opacity:.75}
  @media (orientation:portrait) and (pointer:coarse){#mgsA[data-screen="play"] .ma-rot,#mgsA[data-screen="setup"] .ma-rot{display:flex}}
  @media (max-width:900px){.ma-play{grid-template-columns:1fr}.ma-bd{position:static}.ma-bds{max-height:52vh}.ma-c.fit .ma-play{grid-template-columns:minmax(0,1.4fr) minmax(260px,1fr)}.ma-c.fit .ma-bds{max-height:none}}
  @media (max-width:640px){.ma-h .lg{display:none}}
  `;

  /* ======================= Squelette ======================= */
  let root, body, built = false, timer = null, typeTimer = null;
  function build() {
    if (built) return; built = true;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    root = document.createElement('div'); root.id = 'mgsA';
    root.innerHTML = `<div class="ma-h"><span class="lg">◤ MGS</span><button class="ma-b sm" id="maHome" title="Missions">🗂️</button><span class="ttl" id="maTtl"></span>
        <button class="ma-b sm" id="maLog" title="Journal de la partie">📜</button><button class="ma-b sm" id="maSnd" title="Sons (manuel)">🔊</button><button class="ma-b sm" id="maHelp" title="Aide animée">❓</button><button class="ma-b sm red" id="maX" title="Fermer">✕</button></div>
      <div class="ma-steps" id="maSteps"></div><div class="ma-c" id="maBody"></div>
      <div class="ma-rot"><div>📱↻<br><b>Tourne la tablette en paysage</b><br><span>le plateau tient alors en entier à l'écran</span></div></div>
      <div class="ma-bar"><span class="np" id="maNp">♪ —</span><button class="ma-b sm" id="maAuto">🎬 Auto</button><button class="ma-b sm" id="maStop" title="Stop musique">⏹</button></div>`;
    document.body.appendChild(root);
    body = $('#maBody', root);
    $('#maX', root).onclick = close;
    $('#maHome', root).onclick = () => go('home');
    $('#maLog', root).onclick = () => { if (mission()) go('log'); };
    $('#maSnd', root).onclick = () => { if (mission()) go('snd'); };
    $('#maHelp', root).onclick = () => window.MGSHelp && window.MGSHelp.open();
    $('#maStop', root).onclick = () => A.stop();
    $('#maAuto', root).onclick = () => { st.auto = !st.auto; save(); bar(); toast(st.auto ? '🎬 Sons et musique automatiques' : 'Sons automatiques coupés'); };
    $('#maSteps', root).addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('show')) close(); });
  }
  function go(screen) {
    ui = { sel: null, pend: null, place: null, pad: null };
    st.screen = screen; save(); render(); body.scrollTop = 0;
    const m = mission(), g = m && game();
    if (m && st.auto && (screen === 'brief' || screen === 'rules' || screen === 'setup') && !(g && g.started) && A.mode !== 'brief') A.music(briefTrack(m), 'brief');
  }
  function toast(msg, ms = 2800) { const t = document.createElement('div'); t.className = 'ma-toast'; t.innerHTML = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
  function turnBanner(txt) { const b = document.createElement('div'); b.className = 'ma-turnban'; b.innerHTML = `<div>${txt}</div>`; document.body.appendChild(b); setTimeout(() => b.remove(), 2000); }
  function bar() {
    if (!root) return;
    let name = A.cur; try { if (window.SB && window.SB.current()) name = window.SB.current().name || window.SB.current().file; } catch (_) {}
    $('#maNp', root).textContent = name ? '♪ ' + String(name).replace(/\.mp3$/i, '') + (A.mode === 'alert' ? '  🚨' : '') : '♪ —';
    $('#maAuto', root).classList.toggle('on', !!st.auto);
  }
  const list = a => (a && a.length) ? `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p style="opacity:.6">—</p>';
  const faqFor = m => (window.MGS_FAQ || []).flatMap(c => c.items).filter(q => q.stage === m.id);

  function render() {
    const m = mission();
    if (!m && st.screen !== 'home') st.screen = 'home';
    const SCR = [['brief', '📡 Briefing'], ['rules', '📜 Règles'], ['setup', '🗺️ Plateau & setup'], ['play', '🎲 Partie'], ['debrief', '🏁 Débrief']];
    $('#maSteps', root).style.display = m && st.screen !== 'home' ? '' : 'none';
    $('#maSteps', root).innerHTML = SCR.map(([k, t]) => `<button class="ma-b ${st.screen === k ? 'on' : ''}" data-go="${k}">${t}</button>`).join('');
    $('#maTtl', root).textContent = m && st.screen !== 'home' ? `${typeof m.id === 'number' ? 'Stage ' + m.id : m.id} · ${m.name}` : 'Assistant de partie';
    const fit = (st.screen === 'play' || st.screen === 'setup') && m && isGrid(m);
    body.classList.toggle('fit', !!fit); root.dataset.screen = st.screen;
    // garde la position de défilement (page, plateau, panneau) : un tap ne doit jamais faire « remonter » l'écran
    const keep = [body, ...body.querySelectorAll('.ma-bds, .ma-play>div')].map(el => [el.scrollTop, el.scrollLeft]);
    const same = keepScr === st.screen; keepScr = st.screen;
    ({ home: vHome, brief: vBrief, rules: vRules, setup: vSetup, play: vPlay, debrief: vDebrief, log: vLog, snd: vSnd }[st.screen] || vHome)(m);
    if (same) [body, ...body.querySelectorAll('.ma-bds, .ma-play>div')].forEach((el, i) => { if (keep[i]) { el.scrollTop = keep[i][0]; el.scrollLeft = keep[i][1]; } });
    bar();
  }
  let keepScr = null;

  /* ======================= 🗂️ Missions ======================= */
  function vHome() {
    const cl = LS.get('mgsg.cleared', {});
    body.innerHTML = `<h2 style="margin:4px 0 10px">Choisis ta mission</h2><div class="ma-mis">${MIS().map(m => {
      const g = st.games[m.id], live = g && g.started && !g.over;
      return `<button class="ma-mt ${cl[m.id] ? 'ok' : ''} ${live ? 'live' : ''}" data-a="pick" data-v="${m.id}"><span class="nb">${typeof m.id === 'number' ? String(m.id).padStart(2, '0') : 'VR'}</span>
        <div class="nm">${esc(m.name)}</div><small>${m.type === 'sneak' ? '🕵️ Infiltration' : '👾 Boss'} · ⏱ ${esc(m.time || '?')}</small>${live ? `<br><small style="color:#9ec0ff">▶ Partie en cours (round ${g.round})</small>` : ''}</button>`;
    }).join('')}</div>`;
  }

  /* ======================= 📡 Briefing ======================= */
  function vBrief(m) {
    const n = pcounts(m);
    body.innerHTML = `<div class="ma-codec"><div><div class="face">📡</div><div class="fq" style="font-size:1rem;margin-top:6px">140.85</div></div>
        <div><div class="fq">${esc(m.name)}${m.subtitle ? ` <span style="font-size:1rem;opacity:.7">— ${esc(m.subtitle)}</span>` : ''}</div><div class="txt" id="maTxt"></div></div></div>
      <div class="ma-card"><h4>👥 Combien de joueurs ?</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${n.map(k => `<button class="ma-b ${+k === st.n ? 'on' : ''}" data-a="n" data-v="${k}">${k} joueur${k > 1 ? 's' : ''} : ${pchars(m, +k).map(c => CE[c] + ' ' + c).join(', ')}</button>`).join('')}</div>
        ${(m.players || {}).note ? `<p style="opacity:.75">${(m.players.note || []).join(' ')}</p>` : ''}</div>
      <div class="ma-two"><div class="ma-card"><h4>🎯 Objectif</h4>${list(m.objective)}</div><div class="ma-card warn"><h4>💀 Échec si…</h4>${list(m.failure)}</div></div>
      <div class="ma-next"><button class="ma-b" data-a="read">📡 Relire</button><button class="ma-b pri big" data-go="rules">Continuer ▶</button></div>`;
    typeBriefing(m);
  }
  function typeBriefing(m) {
    clearInterval(typeTimer);
    const el = $('#maTxt', root); if (!el) return;
    const txt = m.briefing || '…'; let i = 0;
    A.sfx(AU().codec); setTimeout(() => A.sfx(AU().briefing), 350);
    typeTimer = setInterval(() => { if (!document.body.contains(el)) return clearInterval(typeTimer); i += 2; el.innerHTML = esc(txt.slice(0, i)) + (i < txt.length ? '<span class="cur">&nbsp;</span>' : ''); if (i >= txt.length) clearInterval(typeTimer); }, 28);
  }

  /* ======================= 📜 Règles ======================= */
  function vRules(m) {
    const special = (m.special || []).map(s => typeof s === 'string' ? `<li>${s}</li>` : `<li><b>${s.t}</b> — ${s.d}</li>`).join('');
    const events = (m.events || []).map(e => `<li><span class="ma-ev">${e.k}</span>${e.d}</li>`).join('');
    const errs = m.errata || [], faq = faqFor(m);
    body.innerHTML = `${errs.length || faq.length ? `<div class="ma-card err"><h4>⚠️ Errata & précisions officielles</h4>${list(errs)}${faq.map(q => `<p><b>${q.q}</b><br>${q.a}</p>`).join('')}</div>` : ''}
      ${special ? `<div class="ma-card"><h4>📜 Règles spéciales</h4><ul>${special}</ul></div>` : ''}
      ${events ? `<div class="ma-card"><h4>🅰️ Events (dès qu'une figurine entre dessus)</h4><ul style="list-style:none;padding:0">${events}</ul></div>` : ''}
      ${m.boss ? `<div class="ma-card boss"><h4>👾 ${esc(m.boss.name)}</h4>${m.boss.health ? `<p><b>Santé :</b> ${m.boss.health}</p>` : ''}${m.boss.defense ? `<p><b>Défense :</b> ${m.boss.defense}</p>` : ''}${list(m.boss.notes)}</div>` : ''}
      <div class="ma-card"><h4>🏆 Si réussi</h4>${list(m.cleared)}</div>
      ${m.tips && m.tips.length ? `<div class="ma-card"><h4>💡 Conseils</h4>${list(m.tips)}</div>` : ''}
      <div class="ma-card"><h4>📞 Le Codec, c'est quand ?</h4><p>Quand tu veux, gratuitement : dès qu'un composant porte un <b>numéro Codec</b>, cherche-le dans le Codec Book (détails, astuces, secrets).${m.id === 8 ? ' <b>Errata Mantis :</b> Codec 3.14 → lire 3.11.' : ''}</p></div>
      <div class="ma-next"><button class="ma-b pri big" data-go="setup">Continuer ▶</button></div>`;
  }

  /* ======================= Plateau (commun setup / partie) ======================= */
  const PIC = { player: p => CE[p.owner] || (p.owner || '?')[0], guard: () => '💂', boss: () => (BOSSE[st.mid] || '👾'), cam: () => '📹', q: () => '?', a: () => '!', ko2: () => '★★', ko1: () => '★', dead: () => '☠' };
  const ROT = { up: 0, right: 90, down: 180, left: 270 };
  function boardHtml(m, g, mode) {
    if (isGrid(m)) return gridBoardHtml(m, g, mode);
    const src = (m.images || [])[0];
    const placed = g.pieces.filter(p => p.x != null);
    const pcs = placed.map(p => {
      const cur = mode === 'play' && p.k === 'player' && g.phase === 1 && g.players[g.cur] && g.players[g.cur].name === p.owner;
      const col = p.k === 'player' ? `--c:${CC[p.owner] || '#fff'};` : '';
      const tk = ['q', 'a', 'ko2', 'ko1', 'dead'].includes(p.k) ? 'tk' : '';
      const arrow = ['guard', 'boss', 'cam'].includes(p.k) ? `<span class="rot" style="transform:rotate(${ROT[p.f] || 0}deg)"><span class="ar"></span></span>` : '';
      return `<div class="ma-pc ${p.k} ${tk} ${ui.sel === p.id ? 'sel' : ''} ${cur ? 'cur' : ''} ${p.hurt ? 'hurt' : ''}" data-pc="${p.id}" style="${col}left:${p.x}%;top:${p.y}%">${arrow}<span style="position:relative">${PIC[p.k] ? PIC[p.k](p) : ''}</span></div>`;
    }).join('');
    const pick = ui.pend && (ui.pend.type === 'move' || ui.pend.type === 'target') || ui.place;
    const unplaced = g.pieces.filter(p => p.x == null && ['player', 'guard', 'cam', 'boss'].includes(p.k));
    const label = p => p.k === 'player' ? `${CE[p.owner] || ''} ${p.owner}` : p.k === 'guard' ? '💂 Garde' : p.k === 'cam' ? '📹 Caméra' : '👾 Boss';
    return `<div class="ma-bd"><div class="ma-bdt"><button class="ma-b sm" data-a="zoom" data-v="-1">🔍−</button><button class="ma-b sm" data-a="zoom" data-v="1">🔍+</button>
        <span style="flex:1;opacity:.85;font-size:.9rem">${ui.place ? '👆 Touche le plan pour poser le pion' : ui.pend && ui.pend.type === 'move' ? '👆 Touche la case où tu vas' : ui.pend && ui.pend.type === 'target' ? '👆 Touche la cible' : 'Glisse un pion pour le corriger · touche-le pour ses options'}</span>
        <button class="ma-b sm" data-a="add" data-v="guard" title="Ajouter un garde">＋💂</button><button class="ma-b sm" data-a="add" data-v="cam" title="Ajouter une caméra">＋📹</button></div>
      <div class="ma-bds"><div class="ma-map ${pick ? 'pick' : ''}" id="maMap" style="width:${Math.round(100 * (st.zoom || 1))}%">${src ? `<img src="${src}" alt="Plan">` : '<p style="padding:40px;color:#333">Pas de plan</p>'}${pcs}</div></div>
      ${unplaced.length ? `<div class="ma-tray"><span style="opacity:.75;align-self:center">À poser :</span>${unplaced.map(p => `<button class="ma-b sm ${ui.place === p.id ? 'wait' : ''}" data-a="place" data-v="${p.id}">${label(p)}</button>`).join('')}</div>` : ''}</div>`;
  }
  function bindBoard() {
    if (isGrid(mission())) return bindGrid();
    const map = $('#maMap', root); if (!map) return;
    const setPs = () => map.style.setProperty('--ps', Math.max(20, Math.min(46, map.clientWidth * 0.042)) + 'px');
    setPs(); const img = $('img', map); if (img && !img.complete) img.onload = setPs;
    let drag = null;
    map.addEventListener('pointerdown', e => {
      const pc = e.target.closest('.ma-pc');
      if (pc) { drag = { id: pc.dataset.pc, el: pc, x: e.clientX, y: e.clientY, moved: false }; try { pc.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    });
    map.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
      drag.moved = true; drag.el.classList.add('drag');
      const r = map.getBoundingClientRect();
      drag.el.style.left = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) + '%';
      drag.el.style.top = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) + '%';
    });
    map.addEventListener('pointerup', e => {
      const r = map.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
      if (drag) {
        const d = drag; drag = null;
        const p = piece(d.id); if (!p) return;
        if (d.moved) { snap(); p.x = x; p.y = y; save(); render(); return; }
        return tapPiece(p);
      }
      tapMap(x, y);
    });
  }
  function piece(id) { return game().pieces.find(p => p.id === id); }
  function attPiece(g, name) { return g.pieces.find(p => (p.k === 'q' || p.k === 'a') && p.owner === name); }
  function playerPiece(g, name) { return g.pieces.find(p => p.k === 'player' && p.owner === name); }

  function tapMap(x, y) {
    const g = game();
    if (ui.place) { snap(); const p = piece(ui.place); if (p) { p.x = x; p.y = y; log(`Pion posé : ${p.k === 'player' ? p.owner : p.k}`, 'sys'); } ui.place = null; nextUnplaced(g); save(); render(); return; }
    if (ui.pend && ui.pend.type === 'move') return doMove(x, y);
    if (ui.sel) { ui.sel = null; render(); }
  }
  function nextUnplaced(g) {
    if (st.screen !== 'setup') return;
    const nx = g.pieces.find(p => p.x == null && ['player', 'guard', 'cam', 'boss'].includes(p.k)); if (nx) ui.place = nx.id;
  }
  function tapPiece(p) {
    if (ui.pend && ui.pend.type === 'target' && ['guard', 'boss'].includes(p.k)) return chooseTarget(p);
    if (ui.pend && ui.pend.type === 'move' && p.k !== 'player') return doMove(p.x, p.y);
    ui.sel = ui.sel === p.id ? null : p.id;
    const g = game();
    if (p.k === 'player' && st.screen === 'play' && g.phase === 1) { const i = g.players.findIndex(x => x.name === p.owner); if (i >= 0 && !g.players[i].done && i !== g.cur) { g.cur = i; ui.sel = null; } }
    render();
  }

  /* ======================= 🗺️ Plateau & setup ======================= */
  function vSetup(m) {
    const g = game(), chk = LS.get('mgsg.chk.' + m.id, {});
    const chars = pchars(m, st.n);
    const deck = m.guardDeck ? (typeof m.guardDeck === 'string' ? m.guardDeck : Object.entries(m.guardDeck).map(([k, v]) => `${k} : ${v}`).join(' · ')) : null;
    const stepsL = [...(m.setup || []),
      ...(isSneak(m) ? ['Guard dashboard : deck Guard Order (bleues mélangées SUR les rouges) + deck Guard Reaction (6) mélangé.'] : []),
      `Chaque joueur (${chars.map(c => CE[c] + ' ' + c).join(', ')}) : dashboard, 4 jetons Action, 4 Focus, jeton Attention, équipement (≤ limite) + munitions.`,
      'Dés et jetons (dégâts, KO, Mort…) en réserve.'];
    const errs = (m.errata || []).filter(e => /setup|mise en place|carte|barracks|tuile|plan|icône|placer/i.test(e));
    if (!ui.place && !g.started && !ui.sel) nextUnplaced(g);
    body.innerHTML = `${errs.length ? `<div class="ma-card err"><h4>⚠️ Errata pour la mise en place</h4>${list(errs)}</div>` : ''}
      <div class="ma-play"><div>${boardHtml(m, g, 'setup')}<p style="opacity:.7;font-size:.9rem;margin:6px 2px">${g.grid ? 'Les pions sont placés comme sur le livret. Vérifie avec ton vrai plateau ; pour corriger, touche un pion puis une case (⟲⟳ pour le regard).' : 'Pose les pions comme sur le vrai plateau (zone de départ, gardes et leur regard avec ⟲⟳). Facultatif : tu peux jouer sans poser les gardes.'}</p></div>
      <div><div class="ma-card" style="margin-top:0"><h4>🧰 Matériel</h4><p>${chars.map(c => `<span class="chip">${CE[c] || ''} ${c}</span>`).join('')}</p>${m.tiles && m.tiles.length ? `<p><b>Tuiles :</b> ${m.tiles.join(', ')}</p>` : ''}${deck ? `<p><b>Guard Order :</b> ${deck}</p>` : ''}</div>
        ${selPanel(m, g)}
        <div class="ma-card"><h4>🎒 Équipement de départ</h4><p style="opacity:.8;margin:2px 0 6px">Ajoute les cartes que chacun prend (limite ${EQUIP_LIMIT} cartes de la Memory Box, les cartes de départ du personnage en plus). Sans ration, pas d'action Ration ; sans arme, pas de tir, etc.</p>${invEditor(m, g)}</div>
        <div class="ma-card"><h4>✅ Checklist</h4><ul class="ma-chk">${stepsL.map((s, i) => `<li class="${chk[i] ? 'ok' : ''}" data-chk="${i}"><span class="bx">${chk[i] ? '✓' : ''}</span><span class="tx">${s}</span></li>`).join('')}</ul></div>
        <div class="ma-next">${g.started ? `<button class="ma-b pri big" data-go="play">▶ Retour à la partie</button>` : `<button class="ma-b pri big" data-a="start">🎬 Continuer : commencer la partie</button>`}</div></div></div>`;
    bindBoard();
  }

  function selPanel(m, g) {
    const p = ui.sel && piece(ui.sel); if (!p) return '';
    const rot = `<button class="ma-b sm" data-a="rot" data-v="-1">⟲</button><button class="ma-b sm" data-a="rot" data-v="1">⟳</button>`;
    const play = st.screen === 'play';
    let h = '';
    if (p.k === 'guard') h = `💂 <b>Garde</b> ${p.hurt ? '<b style="color:#ff8a96">(blessé)</b>' : ''}<br>${rot} <button class="ma-b sm" data-a="pko">⭐ KO</button> <button class="ma-b sm" data-a="pdead">☠ Mort</button> <button class="ma-b sm" data-a="phurt">🩸 Blessé</button>${play ? g.players.map((q, i) => ` <button class="ma-b sm" data-a="seen" data-v="${i}">👁️ Voit ${q.name}</button>`).join('') : ''} <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'cam') h = `📹 <b>Caméra</b><br>${rot}${play ? g.players.map((q, i) => ` <button class="ma-b sm" data-a="camSeen" data-v="${i}">📹 Voit ${q.name}</button>`).join('') : ''} <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'boss') h = `👾 <b>${esc((m.boss || {}).name || 'Boss')}</b><br>${rot}`;
    else if (p.k === 'ko2' || p.k === 'ko1') h = `⭐ <b>Garde KO</b> (${p.k === 'ko2' ? '★★' : '★'})<br><button class="ma-b sm" data-a="pwake">💂 Se relève</button> <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'dead') h = `☠ <b>Garde mort</b> (glisse-le pour le cacher)<br><button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'q' || p.k === 'a') h = `Jeton Attention de <b>${p.owner}</b> (${p.k === 'q' ? '?' : '!'})<br><button class="ma-b sm" data-a="pflip">🔄 Retourner</button> <button class="ma-b sm red" data-a="prmatt">🗑 Retirer (Guard Reaction)</button>`;
    else if (p.k === 'player') h = `${CE[p.owner] || ''} <b>${p.owner}</b>`;
    return `<div class="ma-ask" style="margin-top:0">${h} <button class="ma-b sm" data-a="unsel">✕</button></div>`;
  }

  /* ======================= 🎲 Partie ======================= */
  const ACTS = [
    { id: 'sneak', i: '🚶', n: 'Sneak', c: 1, move: 1, tip: '1 case, jamais en diagonale.' },
    { id: 'dash', i: '🏃', n: 'Dash', c: 1, move: 2, noisy: 1, tip: '2 cases. 🔊 Bruyant : noise check en fin de tour.' },
    { id: 'h2h', i: '👊', n: 'Corps-à-corps', c: 1, atk: 'ko', dice: ['w'], sfx: 'punch-guard-kox1.mp3', tip: 'Cible adjacente, 1 dé blanc, dégâts KO.' },
    { id: 'combo', i: '🥊', n: 'Combo', c: 2, atk: 'ko', dice: ['w', 'w', 'b'], sfx: 'knock-out-guard-kox2.mp3', tip: 'Cible adjacente, 2 blancs + 1 noir, dégâts KO.' },
    { id: 'silent', i: '🤫', n: 'Élim. silencieuse', c: 2, only: 'Snake', atk: 'silent', sfx: 'mgs-silent-takedown.mp3', tip: 'DANS LE DOS d\'un garde adjacent → jeton Mort, sans bruit.' },
    { id: 'shoot', i: '🔫', n: 'Tir', c: 1, need: 'gun', atk: 'kill', dice: null, loud: 1, gun: 1, sfx: 'mgs-socom.mp3', tip: 'LOUD (sauf si la carte dit silencieux). Lance les dés de la carte.' },
    { id: 'shootS', i: '🔇', n: 'Tir silencieux', c: 1, need: 'sgun', atk: 'kill', dice: null, gun: 1, sfx: 'mgs-socom-silenced.mp3', tip: 'Silencieux : vérifie sur la carte.' },
    { id: 'gren', i: '💣', n: 'Grenade', c: 1, need: 'grenade', loud: 1, gun: 1, sfx: 'mgs-grenade.mp3', then: 'mgs-explosion.mp3', tip: 'LOUD → ! sous toi. Effet : voir la carte.' },
    { id: 'chaff', i: '✨', n: 'Chaff', c: 1, need: 'chaff', gun: 1, auto: 'chaff', thenAuto: 'chaffJam', tip: 'Voir la carte Équipement.' },
    { id: 'knock', i: '✊', n: 'Toquer', c: 1, sfx: 'mgs-knock-a.mp3', att: 1, tip: 'Ton jeton ? sur ta case : le garde le plus proche viendra.' },
    { id: 'drag', i: '🫳', n: 'Traîner corps', c: 1, noisy: 1, move: 1, tip: 'Prends un KO/Mort à côté, bouge d\'1, pose-le à côté. 🔊' },
    { id: 'interact', i: '🚪', n: 'Porte / objet', c: 1, auto: 'door', tip: 'Porte verrouillée : dés du dashboard, relance en recommençant, tout dans le même tour.' },
    { id: 'elev', i: '🛗', n: 'Ascenseur', c: 1, auto: 'elevCall', thenAuto: 'elevator', tip: 'L\'ascenseur part avec toutes les figurines dedans (le jeton Attention suit).' },
    { id: 'disguise', i: '🥸', n: 'Déguisement', c: 2, only: 'Meryl', tip: 'À côté d\'un KO/Mort, jeton Attention pas sur la carte.' },
    { id: 'hack', i: '💻', n: 'Hack', c: 1, only: 'Otacon', tip: '4 dés noirs (+bonus), relance ; combinaison du Terminal dans le même tour.' },
    { id: 'search', i: '🔎', n: 'System Search', c: 1, only: 'Otacon', tip: 'Terminal piraté : pioche 1 carte System (max 3).' },
    { id: 'access', i: '⚙️', n: 'Access', c: 1, only: 'Otacon', tip: 'Jusqu\'à 4 dés noirs sur les cartes System.' },
    { id: 'focus', i: '🎯', n: 'Focus', c: 1, tip: 'Coût sur la face grise (ajoute un point si 2).' },
    { id: 'ration', i: '🍴', n: 'Ration', c: 1, need: 'ration', auto: 'ration', tip: 'Voir la carte.' },
    { id: 'leap', i: '🤸', n: 'Saute un garde', c: 0, leap: 1, tip: 'Chaque garde sauté t\'attaque (2 dés noirs) et ton jeton passe sur !.' },
    { id: 'item', i: '🎒', n: 'Objet trouvé', c: 0, auto: 'pop', thenAuto: 'pickup', tip: 'Un objet apparaît / ramassé.' },
    { id: 'wall', i: '🧱', n: 'Dos au mur', c: 0, auto: 'wall', tip: 'Ambiance.' },
    { id: 'codec', i: '📞', n: 'Codec', c: 0, auto: 'codec', tip: 'Numéro Codec → Codec Book (gratuit).' },
  ];
  const actsFor = p => ACTS.filter(a => (!a.only || a.only === p.name) && !(a.gun && p.name === 'Otacon'));

  function setAtt(g, p, v, why, manual) {
    const before = p.att;
    if (v === 1 && before === 2 && !manual) { toast('Ton jeton est déjà sur <b>!</b> : il se déplace sur ta case et reste sur !'); placeAtt(g, p); return; }
    p.att = v;
    if (v === 0) { const t = attPiece(g, p.name); if (t) g.pieces = g.pieces.filter(x => x !== t); }
    else placeAtt(g, p);
    if (v === 2 && before !== 2) { A.sfx(AU().alert); g.alerts++; p.s.alerts++; log(`🚨 ${p.name} repéré${why ? ' (' + why + ')' : ''} : jeton ! → ALERTE`, 'alert', p.name); toast(`🚨 <b>${p.name}</b> : jeton <b>!</b> sous sa figurine${why ? ' (' + why + ')' : ''}. Les gardes de sa zone passent en ALERTE.`, 3500); }
    if (v === 1 && before === 0) { A.sfx(AU().investigate); log(`❓ ${p.name} : jeton ? posé${why ? ' (' + why + ')' : ''}`, 'alert', p.name); toast(`❓ Jeton <b>?</b> de ${p.name} posé : le garde le plus proche viendra voir.`); }
    syncAlert();
  }
  function placeAtt(g, p) {
    const pp = playerPiece(g, p.name); let t = attPiece(g, p.name);
    if (!t) { t = { id: 'att-' + p.name, k: 'q', owner: p.name, x: null, y: null }; g.pieces.push(t); }
    t.k = p.att === 2 ? 'a' : 'q';
    if (pp && pp.x != null) { if (g.grid) { t.x = pp.x; t.y = pp.y; } else { t.x = Math.min(100, pp.x + 2.4); t.y = Math.min(100, pp.y + 2.4); } }
  }

  function vPlay(m) {
    const g = game();
    if (!g.started) { body.innerHTML = `<div class="ma-card"><h4>La partie n'a pas commencé</h4><p>Termine la mise en place puis appuie sur Continuer.</p><button class="ma-b pri big" data-go="setup">🗺️ Plateau & setup</button></div>`; return; }
    body.innerHTML = `<div class="ma-play"><div>${boardHtml(m, g, 'play')}</div><div>${panelHtml(m, g)}</div></div>`;
    bindBoard(); tick();
  }
  function hudHtml(m, g) {
    const total = g.deck ? g.deck.red + g.deck.blue : 0, left = g.deck ? Math.max(0, total - g.deck.drawn) : 0;
    const alert = g.players.some(p => p.att === 2);
    return `<div class="ma-hud"><span class="pill">ROUND ${g.round}</span><span class="pill" id="maClock">⏱ ${fmtT((g.t1 || now()) - g.t0)}</span>
      ${g.deck ? `<span class="pill" title="Paquet Guard Order">🃏 ${left}${g.deck.drawn >= g.deck.blue ? ' 🔴' : ''}</span>` : ''}${isBoss(m) ? `<span class="pill">👾 💥${g.boss.dmg}</span>` : ''}
      ${alert ? '<span class="pill al">🚨 ALERTE</span>' : ''}<span style="flex:1"></span><button class="ma-b sm" data-a="undo" ${undo.length ? '' : 'disabled'} title="Annuler">↶</button></div>
      ${g.deck ? `<div class="ma-deck">${Array.from({ length: total }, (_, i) => `<i class="${i < g.deck.drawn ? 'x' : (i < g.deck.blue ? 'b' : 'r')}"></i>`).join('')}</div>` : ''}
      <div class="ma-ph">${['1 · Début', '2 · Joueurs', '3 · Ennemis'].map((t, i) => `<button class="ma-b sm ${g.phase === i ? 'on' : ''}" data-a="phase" data-v="${i}">${t}</button>`).join('')}</div>`;
  }
  function panelHtml(m, g) {
    let h = hudHtml(m, g) + selPanel(m, g);
    if (g.over) h += `<div class="ma-ban ${g.over === 'win' ? 'win' : 'go'}">${g.over === 'win' ? '🏆 MISSION RÉUSSIE' : '💀 MISSION ÉCHOUÉE'}${g.why ? `<div style="font-size:1rem;font-weight:600">${esc(g.why)}</div>` : ''}</div><button class="ma-b pri big" data-go="debrief">🏁 Voir le débrief</button>`;
    if (g.phase === 0) h += `<div class="ma-card"><h4>🔄 Début du round ${g.round}</h4><p>Chacun reprend ses <b>4 jetons Action</b>.</p><button class="ma-b pri big" data-a="toPlayers">▶ Phase Joueurs</button></div>`;
    else if (g.phase === 1) h += playersHtml(m, g);
    else h += enemyHtml(m, g);
    h += `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap"><button class="ma-b sm" data-a="win">🏆 Mission réussie</button><button class="ma-b sm red" data-a="lose">💀 Échec</button></div>`;
    return h;
  }

  function playersHtml(m, g) {
    const cur = g.players[g.cur] && !g.players[g.cur].done ? g.cur : g.players.findIndex(x => !x.done);
    if (cur < 0) return `<div class="ma-card"><h4>✅ Tout le monde a joué</h4><button class="ma-b pri big" data-a="toEnemy">▶ Phase Ennemie</button></div>`;
    g.cur = cur;
    const p = g.players[cur], hp = hpOf(p.name);
    const evs = m.events || [], cq = stageSnd(m).cues || [];
    let h = `${g.players.length > 1 ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${g.players.map((x, i) => `<button class="ma-b sm ${i === cur ? 'on' : ''}" data-a="who" data-v="${i}">${x.done ? '✔ ' : ''}${CE[x.name] || ''} ${x.name}</button>`).join('')}</div>` : ''}
      <div class="ma-p" style="--c:${CC[p.name] || '#2a3474'}"><h5>${CE[p.name] || ''} Au tour de ${p.name}<span style="flex:1"></span><span class="ma-hp">${hp ? Array.from({ length: hp }, (_, k) => `<i class="${k < p.dmg ? 'd' : ''}"></i>`).join('') : '💔' + p.dmg}</span></h5>
      <div class="ma-tok">${[0, 1, 2, 3].map(k => `<i class="${k < p.left ? '' : 'u'}"></i>`).join('')}<span style="flex:1;opacity:.8">${p.left} point${p.left > 1 ? 's' : ''} d'action${p.noisy ? ` · 🔊×${p.noisy}` : ''}</span><button class="ma-b sm ${p.water ? 'on' : ''}" data-a="water" title="Dans l'eau">💧</button>${!ui.pad && !p.ask && !(ui.pend && !(ui.pend.type === 'move' && isGrid(m))) ? `<button class="ma-b sm pri" data-a="end">🏁 Fin du tour</button>` : ''}</div>
      <div class="ma-invl">🎒 ${invChips(p)}<button class="ma-mini ${ui.inv ? 'on' : ''}" data-a="invToggle">✏️</button></div>
      ${ui.inv ? `<div class="ma-card" style="margin:4px 0">${invEditor(m, g, cur)}</div>` : ''}
      <div class="ma-att"><span style="opacity:.75">Attention</span><button class="ma-b sm ${p.att === 0 ? 'on' : ''}" data-a="att" data-v="0">—</button><button class="ma-b sm q ${p.att === 1 ? 'on' : ''}" data-a="att" data-v="1">?</button><button class="ma-b sm a ${p.att === 2 ? 'on' : ''}" data-a="att" data-v="2">!</button><span style="flex:1"></span><button class="ma-b sm" data-a="dmg" data-v="-1">−</button><button class="ma-b sm red" data-a="dmg" data-v="1">💥 Dégât</button></div>`;
    const moving = ui.pend && ui.pend.type === 'move' && isGrid(m);
    if (ui.pad) h += padHtml(m, g);
    else if (ui.pend && !moving) h += pendHtml(m, g, p);
    else if (p.ask) h += askHtml(p);
    else {
      const ma = moving && ACTS.find(x => x.id === ui.pend.act);
      h += moving ? `<div class="ma-mv">${ma.i} <b>${ma.n}</b> : 👆 touche une case verte <span style="flex:1"></span><button class="ma-b sm" data-a="undo" ${undo.length ? '' : 'disabled'}>↶ Annuler</button><button class="ma-b sm red" data-a="cancel">✕</button></div>`
        : `<p style="opacity:.8;margin:6px 0">Choisis une action (ou touche ton pion pour marcher).</p>`;
      const grid = isGrid(m);
      h += `<div class="ma-acts">${actsFor(p).filter(a => !(grid && (a.id === 'leap' || a.id === 'wall'))).map(a => { const why = whyNot(m, g, p, a), on = moving && ui.pend.act === a.id;
        return `<button class="ma-act ${a.loud ? 'loud' : a.noisy ? 'noisy' : ''} ${on ? 'on' : ''}" data-a="act" data-v="${a.id}" ${why ? 'disabled' : ''} title="${esc(why || a.tip)}"><span class="i">${a.i}</span>${a.n}<small>${why ? '⛔ ' + why : (a.c ? a.c + ' pt' + (a.c > 1 ? 's' : '') : 'gratuit') + (a.loud ? ' · LOUD' : a.noisy ? ' · 🔊' : '')}</small></button>`; }).join('')}</div>
`;
    }
    h += `</div>`;
    if (evs.length || cq.length) h += `<div class="ma-card"><h4>🅰️ Sur le plateau</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${evs.map(e => `<button class="ma-b sm ${g.ev[e.k] ? 'on' : ''}" data-a="event" data-v="${e.k}"><span class="ma-ev">${e.k}</span>${g.ev[e.k] ? 'atteint ✔' : 'atteint ?'}</button>`).join('')}${cq.map(([f, t]) => `<button class="ma-b sm" data-a="cue" data-v="${esc(f)}">${esc(t)}</button>`).join('')}</div></div>`;
    return h;
  }
  function pendHtml(m, g, p) {
    const pd = ui.pend, a = ACTS.find(x => x.id === pd.act);
    const pp = playerPiece(g, p.name);
    if (pd.type === 'move') return `<div class="ma-ask"><p>${a.i} <b>${a.n}</b> : ${a.tip}<br>👆 <b>Touche sur le plan la case où ${p.name} va.</b></p>
      ${pp && pp.x != null ? '' : '<p style="opacity:.8">Ton pion n\'est pas sur le plan : pose-le (« À poser »), ou valide sans le plan.</p>'}
      <button class="ma-b" data-a="moveNo">✔ Fait (sans le plan)</button> <button class="ma-b red" data-a="cancel">Annuler</button></div>`;
    if (pd.type === 'elev') {
      const W6 = world(m), names = { B2: 'Sous-sol B2', B1: 'Sous-sol B1', L1: 'Rez-de-chaussée L1', main: 'Ascenseur' };
      if (pd.mode === 'call') return `<div class="ma-ask"><p>🛗 Appeler l'ascenseur à la cage <b>${names[pd.to] || pd.to}</b> ? (il est actuellement en ${names[g.elev] || g.elev})</p><button class="ma-b pri" data-a="elevGo" data-v="${pd.to}">🛗 Appeler (1 action)</button> <button class="ma-b red" data-a="cancel">Annuler</button></div>`;
      return `<div class="ma-ask"><p>🛗 Où va l'ascenseur ? (tout ce qui est dedans voyage avec)</p>${Object.keys(W6.shafts).filter(k => k !== g.elev).map(k => `<button class="ma-b pri" data-a="elevGo" data-v="${k}">${names[k] || k}</button>`).join(' ')} <button class="ma-b red" data-a="cancel">Annuler</button></div>`;
    }
    if (pd.type === 'target') return `<div class="ma-ask"><p>${a.i} <b>${a.n}</b> : ${a.tip}<br>👆 <b>Touche le garde visé sur le plan.</b></p>
      <button class="ma-b" data-a="targetNo">Cible hors plan</button> <button class="ma-b red" data-a="cancel">Annuler</button></div>`;
    return '';
  }
  function askHtml(p) {
    if (p.ask === 'hurt') return `<div class="ma-ask warn"><p>⚠️ Le garde blessé est-il <b>toujours debout</b> (ni KO ni mort) ?</p><button class="ma-b red" data-a="hurt" data-v="up">Oui → mon jeton passe sur !</button> <button class="ma-b" data-a="hurt" data-v="down">Non</button></div>`;
    if (p.ask === 'noise') return `<div class="ma-ask warn"><p>🔊 <b>Noise check</b> : un garde dans ta zone ?</p><button class="ma-b pri" data-a="noisePad">Oui → je lance ${p.noisy} dé(s) blanc(s)</button> <button class="ma-b" data-a="noise">Pas de garde dans la zone</button></div>`;
    return '';
  }

  /* ---------- pavé de dés ---------- */
  function openPad(o) { ui.pad = Object.assign({ vals: [], def: 3, fixed: null }, o); }
  function padHtml(m, g) {
    const pd = ui.pad, slots = pd.fixed ? pd.fixed.length : Math.max(pd.vals.length + 1, pd.min || 1);
    const colorAt = i => pd.fixed ? pd.fixed[i] : (pd.color || 'b');
    const nextCol = pd.fixed ? pd.fixed[pd.vals.length] : pd.color;
    const res = padResult();
    return `<div class="ma-ask"><p><b>${pd.title}</b><br><span style="opacity:.85">${pd.hint || 'Lance les dés réels, puis tape les résultats.'}</span></p>
      ${pd.showDef !== false ? `<div class="ma-att"><span>Défense ${pd.defLabel || 'de la cible'} :</span><button class="ma-b sm" data-a="pdef" data-v="-1">−</button><b style="font-size:1.3rem;min-width:1.5ch;text-align:center">${pd.def}</b><button class="ma-b sm" data-a="pdef" data-v="1">＋</button></div>` : ''}
      ${pd.back ? `<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="checkbox" data-a="pback" ${pd.backOn ? 'checked' : ''} style="width:22px;height:22px"> Dans le dos de la cible (Snake : +1 dégât, 1×/round)</label>` : ''}
      <div class="ma-dice">${Array.from({ length: slots }, (_, i) => { const v = pd.vals[i]; const c = colorAt(i); const hit = v != null && v !== '!' && pd.showDef !== false && v >= pd.def; return `<div class="ma-die ${c} ${v == null ? 'e' : ''} ${hit ? 'hit' : ''} ${v === '!' ? 'bang' : ''}">${v == null ? '·' : v}</div>`; }).join('')}</div>
      <div class="ma-kp">${[1, 2, 3, 4, 5, 6].map(n => `<button class="ma-b" data-a="pk" data-v="${n}">${n}</button>`).join('')}<button class="ma-b" data-a="pk" data-v="!" ${nextCol === 'w' ? '' : 'disabled'} style="color:#ff6b7a">!</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ma-b sm" data-a="pdel">⌫</button>${pd.fixed ? '' : `<button class="ma-b sm" data-a="pcol">${pd.color === 'w' ? '⚪ dé blanc' : '⚫ dé noir'}</button>`}<span style="flex:1"></span><button class="ma-b red sm" data-a="pcancel">Annuler</button></div>
      ${res ? `<div class="ma-res ${res.bad ? 'bad' : ''}">${res.txt}${res.do ? `<div class="do">🎲 Sur le vrai plateau : ${res.do}</div>` : ''}</div><button class="ma-b pri big" data-a="pok" ${res.ready ? '' : 'disabled'}>✔ Valider</button>` : ''}</div>`;
  }
  function padHits(pd) {
    const vals = pd.vals.filter(v => v != null);
    const base = vals.filter(v => v !== '!' && v >= pd.def).length;
    return base + (pd.backOn && base > 0 ? 1 : 0);
  }
  function padResult() {
    const pd = ui.pad; const vals = pd.vals.filter(v => v != null);
    if (!vals.length) return null;
    const need = pd.fixed ? pd.fixed.length : (pd.min || 1);
    const ready = vals.length >= need;
    const hits = padHits(pd), bang = vals.includes('!');
    if (pd.kind === 'noise') return { ready, bad: bang, txt: bang ? '❗ Un « ! » → tu attires l\'attention : jeton ? sur ta case.' : '🤫 Aucun « ! » : personne n\'a rien entendu.', do: bang ? 'pose ton jeton Attention face ? sous ta figurine (ou déplace-le, sans changer sa face).' : '' };
    if (pd.kind === 'ko' || pd.kind === 'kill') {
      const r = hits >= 2 ? (pd.kind === 'ko' ? 'ko' : 'dead') : hits === 1 ? 'hurt' : 'miss';
      pd.out = r;
      const t = { ko: '⭐ 2 dégâts KO : le garde est <b>assommé</b>.', dead: '☠ Garde <b>éliminé</b>.', hurt: '🩸 1 dégât : le garde est blessé mais <b>debout</b>. Achève-le avant la fin du tour, sinon ton jeton passe sur !', miss: '💨 Raté.' }[r];
      const d = { ko: 'remplace la figurine par un jeton KO face ★★.', dead: 'remplace la figurine par un jeton Mort.', hurt: 'pose 1 jeton dégât à côté du garde.', miss: '' }[r];
      return { ready, bad: r === 'miss', txt: `${hits} réussite(s) (dé ≥ ${pd.def})${pd.backOn && hits ? ' dont +1 dans le dos' : ''}. ${t}${bang ? '<br>❗ Un « ! » sur un dé blanc : tu attires l\'attention (jeton ?).' : ''}`, do: d + (bang ? ' Et ton jeton Attention sur ta case.' : '') };
    }
    if (pd.kind === 'boss') return { ready, txt: `💥 ${hits} dégât(s) au boss (dé ≥ ${pd.def}).${bang ? ' ❗ « ! » : attention attirée.' : ''}`, do: hits ? `place ${hits} dégât(s) sur le dashboard du boss.` : '' };
    if (pd.kind === 'guardAtk' || pd.kind === 'bossAtk') return { ready, bad: hits > 0, txt: hits ? `💥 ${pd.victim} subit <b>${hits}</b> dégât(s) (dé ≥ sa Défense ${pd.def}). Un Focus peut encore modifier un dé avant de valider.` : `🛡️ ${pd.victim} ne subit aucun dégât.`, do: hits ? `pose ${hits} jeton(s) dégât sur le dashboard de ${pd.victim}.` : '' };
    return null;
  }
  function applyPad(m, g) {
    const pd = ui.pad; const vals = pd.vals.filter(v => v != null); const bang = vals.includes('!');
    const hits = padHits(pd);
    const p = g.players.find(x => x.name === pd.actor);
    ui.pad = null;
    if (pd.kind === 'noise') {
      if (bang) { p.s.noise++; if (p.att === 0) setAtt(g, p, 1, 'noise check'); else { placeAtt(g, p); toast('Ton jeton Attention se déplace sur ta case (sans changer de face).'); } }
      log(`🔊 Noise check de ${p.name} (${vals.join(' ')}) : ${bang ? '« ! » → attention' : 'rien'}`, bang ? 'alert' : '', p.name);
      p.ask = null; p.done = true; return endTurnFollow(g);
    }
    if (pd.kind === 'ko' || pd.kind === 'kill') {
      const r = hits >= 2 ? (pd.kind === 'ko' ? 'ko' : 'dead') : hits ? 'hurt' : 'miss';
      p.s.atk++; p.s.hit += hits; if (pd.backOn) p.sneakUsed = true;
      const tg = pd.target && piece(pd.target);
      if (r === 'ko') { g.ko2++; p.s.ko++; if (tg) { tg.k = 'ko2'; tg.hurt = false; } }
      if (r === 'dead') { g.dead++; p.s.kill++; if (tg) { tg.k = 'dead'; tg.hurt = false; } }
      if (r === 'hurt') { p.hurt = true; if (tg) tg.hurt = true; }
      log(`${pd.icon || '⚔️'} ${p.name} attaque (${vals.join(' ')}, Déf ${pd.def}) → ${{ ko: 'garde KO', dead: 'garde éliminé', hurt: 'garde blessé', miss: 'raté' }[r]}`, '', p.name);
      if (bang) setAtt(g, p, 1, '« ! » au dé');
    }
    if (pd.kind === 'boss') { p.s.atk++; p.s.hit += hits; if (pd.backOn) p.sneakUsed = true; g.boss.dmg += hits; const vo = (stageSnd(m).voices || []).filter(x => /^(hind-hurt|tank hurt)/i.test(x[0])); if (hits && vo.length) A.sfx(vo[Math.floor(Math.random() * vo.length)][0]); log(`💥 ${p.name} touche le boss : ${hits} dégât(s) (total ${g.boss.dmg})`, '', p.name); if (bang) setAtt(g, p, 1, '« ! » au dé'); }
    if (pd.kind === 'guardAtk' || pd.kind === 'bossAtk') {
      const v = g.players.find(x => x.name === pd.victim);
      if (hits) damage(m, g, v, hits, pd.kind === 'bossAtk' ? 'le boss' : 'un garde');
      else log(`🛡️ ${v.name} encaisse sans dégât (${vals.join(' ')})`, '', v.name);
    }
  }
  function damage(m, g, v, n, by) {
    v.dmg += n; v.s.dmgIn += n; A.sfx((AU().damage || {})[v.name]);
    log(`💥 ${v.name} subit ${n} dégât(s)${by ? ' (' + by + ')' : ''} → ${v.dmg}${hpOf(v.name) ? '/' + hpOf(v.name) : ''}`, 'go', v.name);
    const hp = hpOf(v.name);
    if (hp && v.dmg >= hp) gameOver(m, g, `${v.name} est KIA (tué au combat).`);
  }
  function gameOver(m, g, why) {
    if (g.over) return; g.over = 'go'; g.why = why; g.t1 = now(); A.sfx(AU().gameover);
    if (st.auto) { const f = stageSnd(m).fail; if (f) A.music(f, 'end'); else setTimeout(() => A.stop(), 1200); }
    log('💀 MISSION ÉCHOUÉE : ' + why, 'go'); toast('💀 ' + esc(why), 4500);
  }
  function win(m, g, why) {
    if (g.over) return; g.over = 'win'; g.why = why; g.t1 = now();
    setTimeout(() => A.sfx(AU().win), 900);
    if (st.auto) { const e = stageSnd(m).end; if (e) A.music(e, 'end'); else setTimeout(() => A.stop(), 1500); }
    const cl = LS.get('mgsg.cleared', {}); cl[m.id] = true; LS.set('mgsg.cleared', cl);
    log('🏆 MISSION RÉUSSIE : ' + why, 'win');
  }
  function endTurnFollow(g) {
    ui.pend = null; ui.lastMove = null;
    const i = g.players.findIndex(x => !x.done);
    if (i >= 0) { g.cur = i; setTimeout(() => { A.sfx(AU().codec); turnBanner(`${CE[g.players[i].name] || ''} Au tour de ${g.players[i].name}`); }, 250); }
    else toast('✅ Tout le monde a joué → <b>Phase Ennemie</b>');
  }
  function camWidget(g) {
    const right = g.cam === 'orange'; const cells = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) cells.push(`<rect x="${x * 30 + 1}" y="${y * 30 + 1}" width="28" height="28" rx="4" class="mcw-c ${y > 0 && (right ? x > 2 : x < 2) ? 'lit' : ''}"/>`);
    return `<svg class="mcw" viewBox="0 0 150 92" aria-hidden="true">${cells.join('')}<g transform="translate(75,15)"><g class="mcw-cam" style="transform:rotate(${right ? -45 : 45}deg)"><rect x="-13" y="-10" width="26" height="20" rx="4" fill="${right ? '#ff9a3c' : '#2fd47a'}"/><path d="M 0 10 L -6 18 L 6 18 Z" fill="#fff"/></g></g></svg>`;
  }
  function enemyHtml(m, g) {
    if (ui.pad) return padHtml(m, g);
    let h = '';
    const anyAlert = g.players.some(p => p.att === 2), anyQ = g.players.some(p => p.att === 1);
    if (isBoss(m)) {
      h += `<div class="ma-card boss"><h4>👾 Tour du boss${m.boss ? ' : ' + esc(m.boss.name) : ''}</h4>
        <div class="ma-step cur"><span class="k">1</span><div class="bd">Retourne la carte du <b>dessus</b> du deck Boss et résous-la. Puis remets-la <b>dessous</b> (jamais mélangé).<br><button class="ma-b pri" data-a="bossCard" style="margin-top:6px">🃏 Carte jouée</button> <span style="opacity:.7">${g.boss.cards} carte(s)</span></div></div>
        <div class="ma-step"><span class="k">2</span><div class="bd">Le boss attaque ? Le joueur visé lance les dés (stat Attaque si non précisé) contre <b>sa</b> Défense :<br>${g.players.map((p, i) => `<button class="ma-b sm" data-a="bossAtk" data-v="${i}">⚔️ ${CE[p.name] || ''} ${p.name}</button>`).join(' ')}</div></div>
        <div class="ma-att"><span>💥 Dégâts au boss</span><button class="ma-b sm" data-a="bd" data-v="-1">−</button><b style="font-size:1.2rem">${g.boss.dmg}</b><button class="ma-b sm" data-a="bd" data-v="1">＋1</button><span style="margin-left:8px">📈 Menace</span><button class="ma-b sm" data-a="bt" data-v="-1">−</button><b>${g.boss.threat}</b><button class="ma-b sm" data-a="bt" data-v="1">＋</button></div>
        ${m.boss && m.boss.health ? `<p style="opacity:.75">Santé : ${m.boss.health}. Ses réactions se déclenchent à CHAQUE fois.</p>` : ''}<button class="ma-b" data-a="bossDown">💀 Boss vaincu</button></div>`;
    }
    if (isSneak(m) && isGrid(m)) return h + gridEnemyHtml(m, g);
    if (isSneak(m)) {
      const s = g.step, cls = k => s === k ? 'cur' : s > k ? 'ok' : '', hasCam = (m.legend && m.legend.cameras) || g.pieces.some(p => p.k === 'cam');
      h += `<div class="ma-card"><h4>🃏 Carte Guard Order — étape par étape</h4>
        <div class="ma-step ${cls(0)}"><span class="k">0</span><div class="bd">Pioche la carte du dessus. <b>GAME OVER</b> ? → perdu.<br><button class="ma-b pri" data-a="draw" ${s > 0 ? 'disabled' : ''}>🃏 Carte piochée</button> <button class="ma-b red" data-a="gameover" ${s > 0 ? 'disabled' : ''}>💀 GAME OVER</button></div></div>
        <div class="ma-step ${cls(1)}"><span class="k">I</span><div class="bd"><b>Action des gardes</b> (icône de la section I) :<br>
          <button class="ma-b sm" data-a="s1" data-v="waken" ${s !== 1 ? 'disabled' : ''}>✨ Réveil</button> <button class="ma-b sm" data-a="s1" data-v="radio" ${s !== 1 ? 'disabled' : ''}>📻 Radio-In</button> <button class="ma-b sm" data-a="s1" data-v="lost" ${s !== 1 ? 'disabled' : ''}>☠ Lost Contact</button> <button class="ma-b sm" data-a="s1" data-v="stay" ${s !== 1 ? 'disabled' : ''}>❓ Stay Alert</button></div></div>
        <div class="ma-step ${cls(2)}"><span class="k">II</span><div class="bd"><b>Caméras</b>${hasCam ? ` (jeton ${g.cam === 'vert' ? '🟩 vert' : '🟧 orange'})${camWidget(g)}<button class="ma-b sm" data-a="cam" data-v="flip" ${s !== 2 ? 'disabled' : ''}>🔄 Pivoter</button> <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>Pas de pivot</button><br><span style="opacity:.75">Puis vérifie la LOS de chaque caméra (pas sa propre case) :</span> ${g.players.map((p, i) => `<button class="ma-b sm" data-a="camSeen" data-v="${i}">📹 Voit ${p.name}</button>`).join(' ')}` : ` : aucune → <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>OK</button>`}</div></div>
        <div class="ma-step ${cls(3)}"><span class="k">III</span><div class="bd"><b>Activer les gardes</b> (zone la plus proche du Guard Priority, haut→bas, gauche→droite). Mode au <b>début</b> de chaque activation :
          ${anyAlert ? `<div class="ma-mode al">🚨 ! posé : gardes de SA zone en ALERTE → chiffre <b style="color:#ff6b7a">ROUGE</b>, vers le ! le plus proche.</div>` : ''}
          ${anyQ ? `<div class="ma-mode iv">❓ ? posé : le garde le plus proche enquête → chiffre <b style="color:#6fb0ff">BLEU</b>.</div>` : ''}
          <div class="ma-mode" style="border:1px solid #39407a">Sinon : voit un KO/Mort → enquête (bleu) ; sinon PATROUILLE (bleu), tout droit.</div>
          <p style="margin:6px 0">Il s'arrête s'il <b>te voit</b> (→ ! + attaque), s'il <b>entre sur un jeton</b> (→ Guard Reaction) ou s'il est bloqué. Déplace aussi les gardes sur le plan à l'écran.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${g.players.map((p, i) => `<button class="ma-b sm" data-a="seen" data-v="${i}">👁️ Un garde voit ${p.name}</button>`).join('')}<button class="ma-b sm" data-a="react">🃏 Guard Reaction</button></div></div></div></div>`;
    }
    return h + `<button class="ma-b pri big" data-a="nextRound">▶ Round ${g.round + 1}</button>`;
  }
  function tick() {
    clearInterval(timer);
    timer = setInterval(() => { const el = root && $('#maClock', root); const g = game(); if (!el || !g || !g.t0) return clearInterval(timer); el.textContent = '⏱ ' + fmtT((g.t1 || now()) - g.t0); }, 1000);
  }

  /* ---------- actions ---------- */
  function spend(g, p, a) { p.left -= a.c; if (a.noisy) p.noisy += a.c; if (a.c) p.s.act++; }
  function startAct(m, g, p, a) {
    if (isGrid(m)) {
      const pp = playerPiece(g, p.name);
      const goal = GRID(m).goal || {};
      if ((a.id === 'elev' || a.id === 'interact') && goal.interact && pp && GG().code(world(m), pp.x, pp.y) === goal.interact) {
        spend(g, p, a); afterSimple(g, p, a);
        if (goal.noAlert && g.pieces.some(x => x.k === 'a')) toast('⚠️ Un jeton <b>!</b> est sur le plateau : l\'objectif n\'est pas rempli (il faut l\'activer sans alerte).', 4500);
        else setTimeout(() => { win(m, g, 'Objectif atteint (ascenseur activé)'); save(); render(); }, 1200);
        return true;
      }
      const W6 = world(m);
      if (a.gun && pp && W6.noFire.has(cellKey(pp.x, pp.y))) { toast('🚫 <b>No Fire Zone</b> : pas d\'arme à distance ni d\'explosif ici (les gardes, eux, peuvent tirer).', 4500); return false; }
      if (a.id === 'elev' && Object.keys(W6.shafts).length > 1 && pp) {
        const here = W6.shaftOf[cellKey(pp.x, pp.y)];
        if (here && here === g.elev) { ui.pend = { type: 'elev', act: a.id, mode: 'ride' }; return false; }
        const adj = GG().shaftAdjacent(W6, pp.x, pp.y);
        if (adj.length) { ui.pend = { type: 'elev', act: a.id, mode: 'call', to: adj[0] }; return false; }
        toast('🛗 Tu dois être <b>dans l\'ascenseur</b> ou <b>à côté d\'une cage</b>.'); return false;
      }
      if (a.move) {
        if (!pp || pp.x == null) { toast('Pose d\'abord ton pion sur le plan.'); return false; }
        if (!armMove(m, g, p, a.id)) toast('Aucune case accessible.');
        return false;
      }
      if (a.atk && !(isBoss(m) && !isSneak(m))) {
        const ids = gridTargets(m, g, p, a);
        if (!ids.length) { toast(a.atk === 'silent' ? '🤫 Il faut être <b>dans le dos</b> d\'un garde adjacent.' : a.dice ? '👊 Aucun garde adjacent.' : '🔫 Aucune cible en ligne de vue.', 3500); return false; }
        ui.pend = { type: 'target', act: a.id, ids }; return false;
      }
    }
    if (a.move) { ui.pend = { type: 'move', act: a.id }; return false; }
    if (a.atk) {
      if (isBoss(m) && !isSneak(m) && a.atk !== 'silent') {
        spend(g, p, a); if (a.need) useItem(p, a.need); if (a.sfx) A.sfx(a.sfx); if (a.loud) setAtt(g, p, 2, 'action LOUD');
        openPad({ kind: 'boss', actor: p.name, def: bossDef(m), title: `${a.i} ${a.n} sur ${esc((m.boss || {}).name || 'le boss')}`, fixed: a.dice || null, color: 'b', defLabel: 'du boss', back: p.name === 'Snake' && !p.sneakUsed, icon: a.i });
        return true;
      }
      ui.pend = { type: 'target', act: a.id }; return false;
    }
    spend(g, p, a); afterSimple(g, p, a); return true;
  }
  function afterSimple(g, p, a) {
    if (a.need) useItem(p, a.need);
    if (a.id === 'item') ui.inv = true;
    if (a.sfx) A.sfx(a.sfx); if (a.auto) A.sfx(AU()[a.auto]);
    if (a.then) setTimeout(() => A.sfx(a.then), 900); if (a.thenAuto) setTimeout(() => A.sfx(AU()[a.thenAuto]), 900);
    log(`${a.i} ${p.name} : ${a.n}`, '', p.name);
    toast(`${a.i} <b>${a.n}</b> — ${a.tip}`, 3000);
    if (a.loud) setAtt(g, p, 2, 'action LOUD');
    if (a.att) setAtt(g, p, 1, a.n);
    if (a.leap) setAtt(g, p, 2, 'saut par-dessus un garde');
  }
  function doMove(x, y) {
    const g = game(), p = g.players[g.cur], a = ACTS.find(q => q.id === ui.pend.act); snap();
    const pp = playerPiece(g, p.name);
    if (pp) { pp.x = x; pp.y = y; }
    spend(g, p, a); p.s.move++;
    steps(a.id === 'dash' ? 'dash' : 'sneak', a.move, p.water);
    log(`${a.i} ${p.name} : ${a.n}`, '', p.name);
    if (a.noisy) toast(`${a.i} <b>${a.n}</b> : 🔊 bruyant → noise check à la fin de ton tour.`);
    ui.pend = null; save(); render();
  }
  function chooseTarget(tg) {
    const g = game(), m = mission(), p = g.players[g.cur], a = ACTS.find(q => q.id === ui.pend.act); snap();
    ui.pend = null; spend(g, p, a); if (a.need) useItem(p, a.need);
    if (a.sfx) A.sfx(a.sfx);
    if (a.loud) setAtt(g, p, 2, 'action LOUD');
    if (a.atk === 'silent') { g.dead++; p.s.kill++; p.s.atk++; if (tg) { tg.k = 'dead'; tg.hurt = false; } log(`🤫 ${p.name} : élimination silencieuse`, '', p.name); toast('🤫 Garde éliminé sans bruit : remplace-le par un jeton Mort.'); save(); render(); return; }
    if (tg && tg.k === 'boss') openPad({ kind: 'boss', actor: p.name, def: bossDef(m), title: `${a.i} ${a.n} sur le boss`, fixed: a.dice || null, color: 'b', defLabel: 'du boss', icon: a.i });
    else openPad({ kind: a.atk, actor: p.name, target: tg ? tg.id : null, def: 3, title: `${a.i} ${a.n} : ${a.dice ? 'lance ' + a.dice.map(c => c === 'w' ? '⚪' : '⚫').join('') : 'lance les dés indiqués sur la carte'}`, fixed: a.dice || null, color: 'b', min: 1, defLabel: 'du garde', back: p.name === 'Snake' && !p.sneakUsed, icon: a.i });
    save(); render();
  }

  function onChange(e) { const t = e.target; if (t.dataset && t.dataset.a === 'pback' && ui.pad) { ui.pad.backOn = t.checked; render(); } }
  function onClick(e) {
    const chk = e.target.closest('[data-chk]');
    if (chk) { const m = mission(); const x = LS.get('mgsg.chk.' + m.id, {}); x[chk.dataset.chk] = !x[chk.dataset.chk]; LS.set('mgsg.chk.' + m.id, x); chk.classList.toggle('ok', !!x[chk.dataset.chk]); chk.querySelector('.bx').textContent = x[chk.dataset.chk] ? '✓' : ''; return; }
    const sd = e.target.closest('[data-mu],[data-sx]');
    if (sd) { if (sd.dataset.mu) A.music(sd.dataset.mu, (SND().alert || []).some(x => x[0] === sd.dataset.mu) ? 'alert' : 'mission'); else A.sfx(sd.dataset.sx); return; }
    const gb = e.target.closest('[data-go]'); if (gb && root.contains(gb) && !gb.closest('#maSteps')) { go(gb.dataset.go); return; }
    const b = e.target.closest('[data-a]'); if (!b || b.disabled || !root.contains(b) || b.dataset.a === 'pback') return;
    const a = b.dataset.a, v = b.dataset.v, m = mission(), g = m && game();
    const p = g && g.players[g.cur];
    switch (a) {
      case 'pick': { st.mid = isNaN(+v) ? v : +v; const mm = mission(); if (!pcounts(mm).includes(String(st.n))) st.n = +pcounts(mm)[0]; undo = []; const gg = game(); go(gg.started && !gg.over ? 'play' : 'brief'); return; }
      case 'n': st.n = +v; undo = []; save(); render(); return;
      case 'read': typeBriefing(m); return;
      case 'zoom': st.zoom = Math.max(1, Math.min(3, (st.zoom || 1) + (+v) * 0.4)); save(); render(); return;
      case 'place': ui.place = ui.place === v ? null : v; render(); return;
      case 'unsel': ui.sel = null; render(); return;
      case 'cancel': ui.pend = null; render(); return;
      case 'pcancel': ui.pad = null; render(); return;
      case 'undo': { const s = undo.pop(); if (s) { const lm = ui.lastMove; st.games[m.id] = JSON.parse(s); ui = { sel: null, pend: null, place: null, pad: null };
        const g2 = game(); if (lm && isGrid(m) && g2.started && g2.phase === 1 && g2.players[g2.cur]) armMove(m, g2, g2.players[g2.cur], lm);
        save(); syncAlert(); render(); } return; }
      case 'pk': { const pd = ui.pad; const lim = pd.fixed ? pd.fixed.length : 12; const i = pd.vals.length; if (i >= lim) return; const col = pd.fixed ? pd.fixed[i] : pd.color; if (v === '!' && col !== 'w') return; pd.vals.push(v === '!' ? '!' : +v); render(); return; }
      case 'pdel': ui.pad.vals.pop(); render(); return;
      case 'pdef': ui.pad.def = Math.max(1, Math.min(8, ui.pad.def + +v)); render(); return;
      case 'pcol': ui.pad.color = ui.pad.color === 'w' ? 'b' : 'w'; render(); return;
      case 'invToggle': ui.inv = !ui.inv; ui.cardAsk = null; render(); return;
      case 'invAdd': { const q = g.players[+b.dataset.p]; q.inv = q.inv || []; q.inv.push(mkItem(ITYPES[v][1], v)); save(); render(); return; }
      case 'invRm': { const q = g.players[+b.dataset.p]; q.inv = q.inv.filter(i => i.id !== b.dataset.i); save(); render(); return; }
      case 'invUse': { const q = g.players[+b.dataset.p], it = q.inv.find(i => i.id === b.dataset.i); if (it) it.uses = Math.max(0, it.uses + +v); save(); render(); return; }
      case 'invCard': { const q = g.players[+b.dataset.p], n = +v; q.inv = q.inv || [];
        if (q.inv.some(i => i.num === n)) { q.inv = q.inv.filter(i => i.num !== n); save(); render(); return; }
        const kn = LS.get('mgsg.cards', {})[n];
        if (kn) { q.inv.push(mkItem(kn.name, kn.type, n)); save(); } else ui.cardAsk = { p: +b.dataset.p, n };
        render(); return; }
      case 'invCardType': { const ca = ui.cardAsk; if (!ca) return; const box = LS.get('mgsg.cards', {}); const nm = `Carte #${String(ca.n).padStart(3, '0')} (${ITYPES[v][1]})`;
        box[ca.n] = { type: v, name: nm }; LS.set('mgsg.cards', box); const q = g.players[ca.p]; q.inv.push(mkItem(nm, v, ca.n)); ui.cardAsk = null; save(); render(); return; }
      case 'invCardNo': ui.cardAsk = null; render(); return;
    }
    if (!g) return;
    snap();
    switch (a) {
      case 'start': {
        g.started = true; g.t0 = now(); g.round = 1; g.phase = 1; g.cur = 0;
        g.players.forEach(x => { x.left = 4; x.noisy = 0; x.done = false; });
        log(`🎬 Début de la mission « ${m.name} » (${g.players.map(x => x.name).join(', ')})`, 'sys');
        if (st.auto) A.music(missionTrack(m), 'mission'); A.sfx(AU().codec);
        st.screen = 'play'; ui = { sel: null, pend: null, place: null, pad: null };
        setTimeout(() => turnBanner(`${CE[g.players[0].name] || ''} Au tour de ${g.players[0].name}`), 300);
        break;
      }
      case 'add': { const id = (v === 'guard' ? 'g' : 'c') + (Date.now() % 1000000); g.pieces.push({ id, k: v, x: null, y: null, f: 'down' }); ui.place = id; break; }
      case 'rot': { const pc = piece(ui.sel); const o = ['up', 'right', 'down', 'left']; pc.f = o[(o.indexOf(pc.f || 'down') + (+v) + 4) % 4]; if (pc.k === 'cam') A.sfx(AU().camRotate); break; }
      case 'pko': { const pc = piece(ui.sel); pc.k = 'ko2'; pc.hurt = false; g.ko2++; A.sfx('punch-guard-kox1.mp3'); log('⭐ Garde KO (★★)', ''); ui.sel = null; break; }
      case 'pdead': { const pc = piece(ui.sel); pc.k = 'dead'; pc.hurt = false; g.dead++; log('☠ Garde éliminé', ''); ui.sel = null; break; }
      case 'phurt': { const pc = piece(ui.sel); pc.hurt = !pc.hurt; break; }
      case 'pwake': { const pc = piece(ui.sel); if (pc.k === 'ko1') g.ko1 = Math.max(0, g.ko1 - 1); else g.ko2 = Math.max(0, g.ko2 - 1); pc.k = 'guard'; A.sfx('guard-whered-he-go_zHLpH97.mp3'); log('💂 Un garde se relève', ''); ui.sel = null; break; }
      case 'prm': { g.pieces = g.pieces.filter(x => x.id !== ui.sel); ui.sel = null; break; }
      case 'pflip': { const pc = piece(ui.sel); const pl = g.players.find(x => x.name === pc.owner); setAtt(g, pl, pl.att === 2 ? 1 : 2, 'retourné', true); break; }
      case 'prmatt': { const pc = piece(ui.sel); const pl = g.players.find(x => x.name === pc.owner); setAtt(g, pl, 0, null, true); log(`🃏 Jeton Attention de ${pl.name} retiré`, ''); ui.sel = null; break; }
      case 'phase': g.phase = +v; if (g.phase === 2) g.step = 0; ui.pend = null; ui.pad = null; break;
      case 'toPlayers': g.players.forEach(x => { x.left = 4; x.noisy = 0; x.done = false; x.ask = null; x.hurt = false; x.sneakUsed = false; }); g.phase = 1; g.cur = 0; log(`🔄 Round ${g.round} : phase des joueurs`, 'sys'); setTimeout(() => { A.sfx(AU().codec); turnBanner(`${CE[g.players[0].name] || ''} Au tour de ${g.players[0].name}`); }, 200); if (st.auto && !A.cur) A.music(missionTrack(m), 'mission'); break;
      case 'who': g.cur = +v; ui.pend = null; ui.pad = null; break;
      case 'water': p.water = !p.water; if (p.water) A.sfx(AU().water); break;
      case 'att': setAtt(g, p, +v, null, true); break;
      case 'dmg': if (+v > 0) damage(m, g, p, 1, ''); else p.dmg = Math.max(0, p.dmg - 1); break;
      case 'act': { if (ui.pend && ui.pend.type === 'move' && ui.pend.act === v) { undo.pop(); ui.pend = null; break; } const ac = ACTS.find(x => x.id === v); if (!ac || ac.c > p.left) { undo.pop(); return; } if (!startAct(m, g, p, ac)) undo.pop(); break; }
      case 'moveNo': { const ac = ACTS.find(q => q.id === ui.pend.act); spend(g, p, ac); p.s.move++; steps(ac.id === 'dash' ? 'dash' : 'sneak', ac.move, p.water); log(`${ac.i} ${p.name} : ${ac.n}`, '', p.name); ui.pend = null; break; }
      case 'targetNo': undo.pop(); chooseTarget(null); return;
      case 'pok': applyPad(m, g); if (ui.queue && ui.queue.length) openPad(ui.queue.shift()); break;
      case 'end': {
        if (p.noisy && g.grid) { const S = toS(g), me = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (me && !GG().guardInZone(world(m), S, me)) { p.noisy = 0; toast('🔊 Aucun garde dans ta zone : pas de noise check.'); } }
        if (p.hurt) p.ask = 'hurt'; else if (p.noisy) p.ask = 'noise';
        else { p.done = true; log(`🏁 Fin du tour de ${p.name} (pas de bruit)`, '', p.name); endTurnFollow(g); }
        break;
      }
      case 'hurt': { if (v === 'up') setAtt(g, p, 2, 'garde blessé resté debout'); else g.pieces.forEach(x => { x.hurt = false; }); p.hurt = false; if (p.noisy) p.ask = 'noise'; else { p.ask = null; p.done = true; endTurnFollow(g); } break; }
      case 'noisePad': openPad({ kind: 'noise', actor: p.name, fixed: Array(p.noisy).fill('w'), title: `🔊 Noise check : lance ${p.noisy} dé(s) blanc(s)`, hint: 'Tape chaque résultat (« ! » si tu le vois).', showDef: false }); break;
      case 'noise': p.ask = null; p.done = true; log(`🏁 Fin du tour de ${p.name} (pas de garde dans la zone)`, '', p.name); endTurnFollow(g); break;
      case 'toEnemy': ui.seq = null; g.phase = 2; g.step = 0; log(`👹 Round ${g.round} : phase ennemie`, 'sys'); break;
      case 'draw': if (g.deck) g.deck.drawn++; g.step = 1; log('🃏 Carte Guard Order piochée', 'sys'); break;
      case 'gameover': gameOver(m, g, 'La carte GAME OVER est sortie : temps écoulé.'); break;
      case 's1': {
        if (g.grid) { gridSection1(m, g, v); g.step = 2; break; }
        if (v === 'waken') { const up = g.ko1; g.ko1 = g.ko2; g.ko2 = 0; g.pieces.forEach(x => { if (x.k === 'ko1') x.k = 'guard'; else if (x.k === 'ko2') x.k = 'ko1'; }); A.sfx('guard-whered-he-go_zHLpH97.mp3'); log(`✨ Réveil : ${up} garde(s) se relèvent, ★★ → ★`, 'sys'); toast(`✨ Réveil (zones actives) : ${up} garde(s) ★ se relèvent, les ★★ passent à ★. Fais pareil sur le plateau.`, 4500); }
        if (v === 'radio') { A.sfx('guard-return-to-your-positions_9aocsFp.mp3'); log('📻 Radio-In', 'sys'); toast('📻 Radio-In : complète chaque zone active jusqu\'au Guard Count du Barracks (icône radio). ＋💂 pour les poser à l\'écran.', 5000); }
        if (v === 'lost') { const n = Math.floor(g.dead / 3); if (g.deck) { g.deck.drawn += n; g.deck.burned += n; } log(`☠ Lost Contact : ${n} carte(s) brûlée(s)`, 'sys'); toast(n ? `☠ Lost Contact : ${n} carte(s) brûlée(s). Si l'une est GAME OVER → perdu !` : '☠ Lost Contact : moins de 3 morts, rien.', 4500); }
        if (v === 'stay') { log('❓ Stay Alert', 'sys'); toast('❓ Stay Alert : tout joueur à ≤ 2 cases d\'un garde (sans obstacle) pose son jeton ? (bouton « ? » sur sa fiche).', 5000); }
        g.step = 2; break;
      }
      case 'cam': if (g.grid) { if (v === 'flip') { g.cam = g.cam === 'vert' ? 'orange' : 'vert'; A.sfx(AU().camRotate); log('📹 Les caméras pivotent', 'sys'); camCheck(m, g); } g.step = 3; break; }
        if (v === 'flip') { g.cam = g.cam === 'vert' ? 'orange' : 'vert'; A.sfx(AU().camRotate); g.pieces.forEach(x => { if (x.k === 'cam') { const o = ['up', 'right', 'down', 'left']; x.f = o[(o.indexOf(x.f || 'down') + 1) % 4]; } }); log('📹 Les caméras pivotent', 'sys'); } g.step = 3; break;
      case 'camSeen': { const q = g.players[+v]; A.sfx(AU().camSpot); setTimeout(() => { setAtt(g, q, 2, 'vu par une caméra'); save(); render(); }, 700); break; }
      case 'seen': { const q = g.players[+v]; A.sfx('guard-there-he-is_JHZ7rPO.mp3'); setAtt(g, q, 2, 'vu par un garde'); ui.sel = null; openPad({ kind: 'guardAtk', victim: q.name, def: defOf(q.name), fixed: ['b', 'b'], title: `👁️ Le garde attaque ${q.name} : lance 2 dés noirs`, hint: 'Focus possible : modifie la valeur avant de la taper.', defLabel: `de ${q.name}` }); break; }
      case 'react': A.sfx('guard-what-was-that-noise_IVtXtq7.mp3'); log('🃏 Guard Reaction', 'sys'); toast('🃏 Guard Reaction : pioche une carte, résous chaque jeton de la case (haut → bas). Mets à jour les jetons ? / ! (touche-les sur le plan).', 5000); break;
      case 'bossCard': { g.boss.cards++; const ss = stageSnd(m); if (g.boss.cards === 1 && st.auto && ss.boss && A.cur !== ss.boss) A.music(ss.boss, 'boss'); const vo = (ss.voices || []).filter(x => !/death|vaincu|abattu/i.test(x[0] + x[1])); if (vo.length) A.sfx(vo[Math.floor(Math.random() * vo.length)][0]); log(`🃏 Carte boss n°${g.boss.cards}`, 'sys'); break; }
      case 'bossAtk': { const q = g.players[+v]; openPad({ kind: 'bossAtk', victim: q.name, def: defOf(q.name), color: 'b', min: 1, title: `⚔️ ${esc((m.boss || {}).name || 'Le boss')} attaque ${q.name}`, hint: 'Tape chaque dé lancé (nombre : carte ou stat Attaque).', defLabel: `de ${q.name}` }); break; }
      case 'bd': g.boss.dmg = Math.max(0, g.boss.dmg + +v); break;
      case 'bt': g.boss.threat = Math.max(0, g.boss.threat + +v); break;
      case 'bossDown': { const d = (stageSnd(m).voices || []).find(x => /death/i.test(x[0])); A.sfx(d ? d[0] : AU().win); log('👾 Boss vaincu !', 'win'); win(m, g, 'Boss vaincu'); break; }
      case 'elevGo': {
        const W6 = world(m), from = g.elev, to = v, map = GG().elevatorMap(W6, from, to), ac = ACTS.find(x => x.id === 'elev');
        spend(g, p, ac); A.sfx(AU().elevCall); setTimeout(() => A.sfx(AU().elevator), 700);
        g.pieces.forEach(x => { if (x.x == null) return; const k = cellKey(x.x, x.y); if (map[k]) { const [nx, ny] = map[k].split(',').map(Number); x.x = nx; x.y = ny; } });
        g.elev = to; ui.pend = null;
        log(`🛗 ${p.name} : ascenseur ${from} → ${to}`, '', p.name); toast(`🛗 L'ascenseur part vers <b>${to}</b>. Déplace l'ascenseur et les figurines dedans sur le vrai plateau.`, 4000);
        break;
      }
      case 'edit': undo.pop(); ui.edit = ui.edit ? null : 'wall'; render(); return;
      case 'editMode': undo.pop(); ui.edit = v; render(); return;
      case 'editReset': undo.pop(); if (confirm('Effacer toutes tes corrections de ce plan ?')) { LS.set('mgsg.fix.' + m.id, { walls: [], cells: {} }); delete worlds[m.id]; render(); } return;
      case 'editExport': { undo.pop(); const t = JSON.stringify({ mission: m.id, fix: fixOf(m) }); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('📤 Corrections copiées : colle-les-moi pour que je les intègre au plan.', 4000), () => prompt('Copie ces corrections :', t)); return; }
      case 'los': undo.pop(); st.showLOS = !st.showLOS; save(); render(); return;
      case 'card': g.card[b.dataset.k] = b.dataset.k === 'arrow' ? v : +v; break;
      case 'seqStart': { const ids = GG().activationOrder(world(m), toS(g)); if (!ids.length) { toast('Aucun garde dans une zone active : rien ne bouge.'); g.step = 4; ui.seq = { ids: [], i: 0 }; } else { ui.seq = { ids, i: 0 }; log(`💂 Activation des gardes (rouge ${g.card.red}, bleu ${g.card.blue}, flèche ${g.card.arrow === 'left' ? '⟲' : '⟳'})`, 'sys'); } break; }
      case 'seqGo': runGuard(m, g); return;
      case 'seqSkip': ui.seq.i++; break;
      case 'react': { const tid = b.dataset.t, tk = piece(tid); if (tk) { const pl = tk.owner && g.players.find(x => x.name === tk.owner);
          if (v === 'rm') { if (pl) setAtt(g, pl, 0, null, true); else g.pieces = g.pieces.filter(x => x.id !== tid); log('🃏 Guard Reaction : jeton retiré', 'sys'); }
          if (v === 'up' && pl) setAtt(g, pl, 2, 'Guard Reaction', true);
          if (v === 'wake') { tk.k = 'guard'; tk.f = tk.f || 'down'; log('🃏 Guard Reaction : garde réveillé', 'sys'); } }
        ui.react.tokens = ui.react.tokens.filter(x => x.id !== tid); if (!ui.react.tokens.length) ui.react = null; break; }
      case 'reactDone': ui.react = null; break;
      case 'nextRound': ui.seq = null; ui.react = null; g.round++; g.phase = 0; g.step = 0; log(`— Round ${g.round} —`, 'sys'); break;
      case 'event': { const ev = (m.events || []).find(x => x.k === v); g.ev[v] = !g.ev[v]; if (g.ev[v]) { A.sfx(AU()[(stageSnd(m).events || {})[v] || 'pop'] || AU().pop); log(`🅰️ Event ${v} atteint`, 'sys'); toast(`<span class="ma-ev">${v}</span> ${ev ? ev.d : ''}`, 6500); } break; }
      case 'cue': A.music(v, 'mission'); break;
      case 'win': win(m, g, 'Objectif rempli'); break;
      case 'lose': gameOver(m, g, 'Mission abandonnée / échouée.'); break;
      default: undo.pop(); return;
    }
    save(); render();
  }

  /* ======================= 🏁 Débrief, 📜 Journal, 🔊 Sons ======================= */
  function statsHtml(m, g) {
    const dur = g.t0 ? (g.t1 || now()) - g.t0 : 0, cards = g.deck ? g.deck.drawn : 0;
    const tot = k => g.players.reduce((s, p) => s + (p.s[k] || 0), 0);
    const rank = g.over === 'win' ? (!g.alerts ? '🦊 FOXHOUND — aucune alerte !' : g.alerts <= 1 ? '🐕 Doberman' : g.alerts <= 3 ? '🐺 Loup' : '🐘 Éléphant') : '';
    return `<div class="ma-stats">
      <div class="ma-stat"><b>${g.over === 'win' ? '🏆' : g.over === 'go' ? '💀' : '⏳'}</b>${g.over === 'win' ? 'Réussie' : g.over === 'go' ? 'Échouée' : 'En cours'}</div>
      <div class="ma-stat"><b>${fmtT(dur)}</b>Temps de jeu</div><div class="ma-stat"><b>${g.round}</b>Rounds</div>
      <div class="ma-stat"><b>${g.alerts}</b>Alertes</div><div class="ma-stat"><b>${tot('ko')}</b>Gardes KO</div><div class="ma-stat"><b>${tot('kill')}</b>Gardes éliminés</div>
      <div class="ma-stat"><b>${tot('dmgIn')}</b>Dégâts subis</div>${g.deck ? `<div class="ma-stat"><b>${cards}/${g.deck.red + g.deck.blue}</b>Cartes ennemies</div>` : ''}${isBoss(m) ? `<div class="ma-stat"><b>${g.boss.dmg}</b>Dégâts au boss</div>` : ''}</div>
      ${rank ? `<p style="font-size:1.2rem;margin:10px 0 0">Rang : <b>${rank}</b></p>` : ''}
      <div style="overflow-x:auto"><table class="ma-tab" style="margin-top:10px"><tr><th>Joueur</th><th>Actions</th><th>Déplac.</th><th>Attaques</th><th>Réussites</th><th>KO</th><th>Élim.</th><th>Dégâts subis</th><th>Repéré</th><th>Bruit raté</th></tr>
      ${g.players.map(p => `<tr><td>${CE[p.name] || ''} ${p.name}</td><td>${p.s.act}</td><td>${p.s.move}</td><td>${p.s.atk}</td><td>${p.s.hit}</td><td>${p.s.ko}</td><td>${p.s.kill}</td><td>${p.s.dmgIn}</td><td>${p.s.alerts}</td><td>${p.s.noise}</td></tr>`).join('')}</table></div>`;
  }
  function logHtml(g) { return `<ul class="ma-log">${g.log.map(l => `<li class="${l.kind}"><span class="t">${fmtT(l.t)}</span><span class="r">R${l.r}</span><span class="x">${esc(l.txt)}</span></li>`).join('') || '<li><span></span><span></span><span class="x">Rien pour l\'instant.</span></li>'}</ul>`; }
  function report(m, g) {
    const dur = g.t0 ? (g.t1 || now()) - g.t0 : 0;
    return [`MGS — ${typeof m.id === 'number' ? 'Stage ' + m.id : m.id} « ${m.name} » — ${g.over === 'win' ? 'RÉUSSIE' : g.over === 'go' ? 'ÉCHOUÉE' : 'en cours'}${g.why ? ' (' + g.why + ')' : ''}`,
      `Joueurs : ${g.players.map(p => p.name).join(', ')} · Temps : ${fmtT(dur)} · Rounds : ${g.round} · Alertes : ${g.alerts}`, '',
      ...g.log.map(l => `[${fmtT(l.t)}] R${l.r}  ${l.txt}`)].join('\n');
  }
  function vDebrief(m) {
    const g = game();
    const i = MIS().findIndex(x => x.id === m.id), nx = MIS()[i + 1];
    body.innerHTML = `<h2 style="margin:4px 0 8px">🏁 Débrief — ${esc(m.name)}</h2>${g.over ? `<div class="ma-ban ${g.over === 'win' ? 'win' : 'go'}">${g.over === 'win' ? '🏆 MISSION RÉUSSIE' : '💀 MISSION ÉCHOUÉE'}${g.why ? `<div style="font-size:1rem;font-weight:600">${esc(g.why)}</div>` : ''}</div>` : ''}
      ${statsHtml(m, g)}<div class="ma-card"><h4>📜 Journal de la partie</h4>${logHtml(g)}</div>
      <div class="ma-next"><button class="ma-b" data-a2="copy">📋 Copier le rapport</button><button class="ma-b" data-a2="replay">↺ Rejouer</button>${nx ? `<button class="ma-b pri big" data-a2="next" data-v="${nx.id}">Mission suivante ▶</button>` : ''}</div>`;
    body.querySelectorAll('[data-a2]').forEach(b => b.onclick = () => {
      if (b.dataset.a2 === 'copy') { const t = report(m, g); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('📋 Rapport copié'), () => { prompt('Copie le rapport :', t); }); }
      if (b.dataset.a2 === 'replay') { st.games[m.id] = newGame(m, st.n); undo = []; go('setup'); }
      if (b.dataset.a2 === 'next') { st.mid = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; const mm = mission(); if (!pcounts(mm).includes(String(st.n))) st.n = +pcounts(mm)[0]; undo = []; A.stop(); go('brief'); }
    });
  }
  function vLog(m) {
    const g = game();
    body.innerHTML = `<h2 style="margin:4px 0 8px">📜 Journal — ${esc(m.name)}</h2>${g.t0 ? statsHtml(m, g) : ''}<div class="ma-card">${logHtml(g)}</div>
      <div class="ma-next"><button class="ma-b pri" data-go="${g.started && !g.over ? 'play' : 'brief'}">◀ Retour</button></div>`;
  }
  function vSnd(m) {
    const ss = stageSnd(m), S = SND();
    const mus = arr => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="mu" data-mu="${esc(f)}">🎵 ${esc(t)}</button>`).join('')}</div>`;
    const sfx = (arr, c = '') => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="${c}" data-sx="${esc(f)}">${esc(t)}</button>`).join('')}</div>`;
    body.innerHTML = `<p style="opacity:.75">Les sons sont automatiques pendant la partie ; cet écran sert de secours.</p>
      <div class="ma-h3">🎵 Musiques de la mission</div>${ss.music && ss.music.length ? mus(ss.music) : '<p>—</p>'}<div class="ma-h3">🚨 Alerte / ⏳ Brief</div>${mus([...(S.alert || []), ...(S.setup || [])])}
      ${ss.voices && ss.voices.length ? `<div class="ma-h3">🗣️ Voix du boss</div>${sfx(ss.voices, 'vo')}` : ''}${ss.sfx && ss.sfx.length ? `<div class="ma-h3">⭐ Spécial mission</div>${sfx(ss.sfx)}` : ''}
      ${(S.groups || []).map(gr => `<div class="ma-h3">${gr.ic} ${gr.t}</div>${sfx(gr.sfx)}`).join('')}
      <div class="ma-next"><button class="ma-b pri" data-go="${(game() || {}).started ? 'play' : 'brief'}">◀ Retour</button></div>`;
  }

  /* ======================= Ouverture ======================= */
  function open(opts = {}) {
    build();
    if (opts.mid != null) { st.mid = opts.mid; const m = mission(); if (m && !pcounts(m).includes(String(st.n))) st.n = +pcounts(m)[0]; }
    const map = { setup: 'setup', play: 'play', rules: 'rules', snd: 'snd', brief: 'brief' };
    let scr = st.screen || 'home';
    if (opts.tab && map[opts.tab]) scr = map[opts.tab]; else if (opts.mid != null) scr = 'brief';
    root.classList.add('show'); document.documentElement.style.overflow = 'hidden';
    try {
      const de = document.documentElement;
      if (!document.fullscreenElement && de.requestFullscreen && matchMedia('(pointer:coarse)').matches) {
        de.requestFullscreen({ navigationUI: 'hide' }).then(() => { wentFS = true; if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
      }
    } catch (_) {}
    go(scr);
  }
  let wentFS = false;
  function close() { if (wentFS && document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen().catch(() => {}); wentFS = false; } root.classList.remove('show'); document.documentElement.style.overflow = ''; clearInterval(timer); clearInterval(typeTimer); }
  window.MGSAssistant = { open, close };
  const bind = () => document.querySelectorAll('[data-mgs-assistant]').forEach(b => b.addEventListener('click', () => open()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
