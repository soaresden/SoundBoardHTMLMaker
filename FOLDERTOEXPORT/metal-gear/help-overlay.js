/* MGS Board Game — Overlay d'aide animé (« ? AIDE »).
   Des scènes qui tournent en boucle : on REGARDE les pions bouger, très peu de texte.
   Autonome : window.MGSHelp.open([indexScene]). Touche « ? » ou « h » pour ouvrir. */
(function () {
  if (window.MGSHelp) return;
  const NS = 'http://www.w3.org/2000/svg';
  const S = 60;                                   // taille d'une case
  const DIR = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ROT = { up: 0, right: 90, down: 180, left: 270 };
  const STOP = Symbol('stop');
  let RUN = 0, paused = false;
  const W = ms => { const r = RUN; return new Promise((ok, ko) => setTimeout(() => (RUN === r ? ok() : ko(STOP)), ms)); };
  const waitWhilePaused = async () => { while (paused) await W(150); };
  const mk = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };

  /* ===================== Mini plateau ===================== */
  class Board {
    constructor(svg, cols, rows, hud = 80) {
      this.svg = svg; this.cols = cols; this.rows = rows; this.hud = hud;
      svg.innerHTML = '';
      svg.setAttribute('viewBox', `-8 ${-hud - 8} ${cols * S + 16} ${rows * S + hud + 16}`);
      const g = c => { const x = mk('g', { class: c }); svg.appendChild(x); return x; };
      this.L = { floor: g('floor'), fx: g('fx'), obs: g('obs'), walls: g('walls'), tok: g('tok'), pcs: g('pcs'), top: g('top'), hud: g('hudl') };
      this.p = {}; this.blocked = new Set(); this.walls = new Set();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        this.L.floor.appendChild(mk('rect', { x: x * S + 2, y: y * S + 2, width: S - 4, height: S - 4, rx: 6, class: 'mh-cell' }));
    }
    obstacle(x, y) { this.blocked.add(x + ',' + y); this.L.obs.appendChild(mk('rect', { x: x * S + 5, y: y * S + 5, width: S - 10, height: S - 10, rx: 4, class: 'obst' })); }
    wall(x, y, d) {
      const a = { right: [x + 1, y, x + 1, y + 1], left: [x, y, x, y + 1], down: [x, y + 1, x + 1, y + 1], up: [x, y, x + 1, y] }[d];
      this.L.walls.appendChild(mk('line', { x1: a[0] * S, y1: a[1] * S, x2: a[2] * S, y2: a[3] * S, class: 'wall' }));
    }
    piece(id, kind, x, y, face = 'up', label = '') {
      const g = mk('g', { class: 'pc ' + kind }), r = mk('g', { class: 'rot' });
      if (kind === 'guard' || kind === 'camera' || kind === 'boss') {
        r.appendChild(mk('rect', { x: -S / 2 + 7, y: -S / 2 + 7, width: S - 14, height: S - 14, rx: 9, class: 'gb' }));
        r.appendChild(mk('path', { d: `M -10 ${-S / 2 + 6} L 0 ${-S / 2 - 7} L 10 ${-S / 2 + 6} Z`, class: 'ga' }));
      } else r.appendChild(mk('circle', { r: S / 2 - 7, class: 'pb' }));
      g.appendChild(r);
      g.appendChild(mk('text', { class: 'pl', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, label || (kind === 'snake' ? 'S' : kind === 'camera' ? '📹' : kind === 'boss' ? '👾' : '')));
      this.L.pcs.appendChild(g);
      const p = { id, kind, x, y, face, g, r, s: 1 };
      this.p[id] = p; this.place(p); return p;
    }
    place(p, dy = 0) {
      p.g.setAttribute('transform', `translate(${p.x * S + S / 2},${p.y * S + S / 2 + dy}) scale(${p.s})`);
      p.r.setAttribute('transform', `rotate(${ROT[p.face] || 0})`);
    }
    async move(id, x, y, ms = 430) {
      const p = this.p[id]; const dx = x - p.x, dy = y - p.y;
      if (p.kind !== 'snake' && (dx || dy)) p.face = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      p.x = x; p.y = y; this.place(p); await W(ms); await waitWhilePaused();
    }
    async path(id, pts, ms = 380) { for (const [x, y] of pts) await this.move(id, x, y, ms); }
    async jump(id, x, y) { const p = this.p[id]; p.s = 1.35; p.x = (p.x + x) / 2; p.y = (p.y + y) / 2; this.place(p, -14); await W(260); p.s = 1; p.x = x; p.y = y; this.place(p); await W(380); }
    async turn(id, f, ms = 320) { const p = this.p[id]; p.face = f; this.place(p); await W(ms); }
    remove(id) { const p = this.p[id]; if (p) { p.g.remove(); delete this.p[id]; } }
    token(id, kind, x, y) {
      this.untoken(id);
      const m = { '?': ['tq', '?'], '!': ['ta', '!'], ko2: ['tk', '★★'], ko1: ['tk', '★'], dead: ['td', '☠'], turn: ['tt', '↻'] }[kind] || ['tq', kind];
      const g = mk('g', { class: 'tok ' + m[0], 'data-id': id, transform: `translate(${x * S + S / 2},${y * S + S / 2})` });
      g.appendChild(mk('rect', { x: -16, y: -16, width: 32, height: 32, rx: 6 }));
      g.appendChild(mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, m[1]));
      this.L.tok.appendChild(g); return g;
    }
    untoken(id) { const o = this.L.tok.querySelector(`[data-id="${id}"]`); if (o) o.remove(); }
    hl(x, y, cls = 'mh-ok') { const r = mk('rect', { x: x * S + 3, y: y * S + 3, width: S - 6, height: S - 6, rx: 7, class: 'hl ' + cls }); this.L.fx.appendChild(r); return r; }
    box(x0, y0, x1, y1, seen) { const r = mk('rect', { x: x0 * S + 1, y: y0 * S + 1, width: (x1 - x0 + 1) * S - 2, height: (y1 - y0 + 1) * S - 2, rx: 8, class: 'los ' + (seen ? 'seen' : 'safe') }); this.L.top.appendChild(r); return r; }
    view(x, y, face, len) {           // bande de regard devant un garde/caméra
      const [dx, dy] = DIR[face]; let x0 = x, y0 = y, x1 = x, y1 = y;
      for (let i = 1; i <= len; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) break; x0 = Math.min(x0, nx); x1 = Math.max(x1, nx); y0 = Math.min(y0, ny); y1 = Math.max(y1, ny); }
      if (dx > 0) x0 = x + 1; if (dx < 0) x1 = x - 1; if (dy > 0) y0 = y + 1; if (dy < 0) y1 = y - 1;
      const r = mk('rect', { x: x0 * S + 2, y: y0 * S + 2, width: (x1 - x0 + 1) * S - 4, height: (y1 - y0 + 1) * S - 4, rx: 6, class: 'cone' }); this.L.fx.appendChild(r); return r;
    }
    half(x, y, face) {              // tout le demi-plateau devant (règle de LOS)
      const [dx, dy] = DIR[face];
      for (let yy = 0; yy < this.rows; yy++) for (let xx = 0; xx < this.cols; xx++)
        if ((dx > 0 && xx > x) || (dx < 0 && xx < x) || (dy > 0 && yy > y) || (dy < 0 && yy < y))
          this.L.fx.appendChild(mk('rect', { x: xx * S + 2, y: yy * S + 2, width: S - 4, height: S - 4, rx: 6, class: 'cone' }));
    }
    bubble(x, y, txt, cls = '') {
      const g = mk('g', { class: 'bub ' + cls, transform: `translate(${x * S + S / 2},${y * S - 4})` });
      const w = Math.max(44, [...txt].length * 11 + 18);
      g.appendChild(mk('rect', { x: -w / 2, y: -34, width: w, height: 30, rx: 15 }));
      g.appendChild(mk('text', { y: -19, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, txt));
      this.L.top.appendChild(g); return g;
    }
    async waves(x, y) {
      for (let i = 0; i < 2; i++) {
        const c = mk('circle', { cx: x * S + S / 2, cy: y * S + S / 2, r: 20, class: 'wave' }); this.L.fx.appendChild(c);
        setTimeout(() => c.remove(), 1000); await W(220);
      }
    }
    clearFx() { this.L.fx.innerHTML = ''; this.L.top.innerHTML = ''; }
    // ---- HUD (bandeau au-dessus du plateau) ----
    hudClear() { this.L.hud.innerHTML = ''; }
    hudTokens(n, used) {
      this.L.hud.querySelectorAll('.atk').forEach(e => e.remove());
      for (let i = 0; i < n; i++) {
        const g = mk('g', { class: 'atk' + (i < used ? ' used' : ''), transform: `translate(${28 + i * 46},${-this.hud / 2})` });
        g.appendChild(mk('circle', { r: 17 })); this.L.hud.appendChild(g);
      }
    }
    hudText(txt, x, cls = '') { const t = mk('text', { class: 'ht ' + cls, x, y: -this.hud / 2, 'dominant-baseline': 'central' }, txt); this.L.hud.appendChild(t); return t; }
    async dice(vals, x0, def) {
      const els = vals.map((v, i) => {
        const g = mk('g', { class: 'die mh-' + (v.c || 'w'), transform: `translate(${x0 + i * 54},${-this.hud / 2})` });
        g.appendChild(mk('rect', { x: -21, y: -21, width: 42, height: 42, rx: 9 }));
        g.appendChild(mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, '?')); this.L.hud.appendChild(g); return g;
      });
      for (let k = 0; k < 9; k++) { els.forEach(g => g.lastChild.textContent = 1 + Math.floor(Math.random() * 6)); await W(70); }
      els.forEach((g, i) => { g.lastChild.textContent = vals[i].v; if (def != null) g.classList.add(vals[i].v !== '!' && vals[i].v >= def ? 'hit' : 'miss'); if (vals[i].v === '!') g.classList.add('bang'); });
      await W(500); return els;
    }
  }

  /* ===================== Scènes ===================== */
  const SC = [];
  const scene = (o) => SC.push(o);

  scene({ ic: '🔄', t: 'Un round', cols: 7, rows: 3, hud: 20,
    setup(b) {
      this.n = [['🔄', 1], ['🧑‍🤝‍🧑', 3], ['💂', 5]].map(([e, x]) => {
        const g = mk('g', { class: 'node', transform: `translate(${x * S + S / 2},${S * 1.5})` });
        g.appendChild(mk('circle', { r: 46 })); g.appendChild(mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'big' }, e));
        b.L.top.appendChild(g); return g;
      });
      b.L.fx.appendChild(mk('path', { d: `M ${S * 2.4} ${S * 1.5} L ${S * 2.6} ${S * 1.5} M ${S * 4.4} ${S * 1.5} L ${S * 4.6} ${S * 1.5}`, class: 'link' }));
    },
    steps: [
      ['Chacun reprend ses 4 jetons', async function () { this.n.forEach((g, i) => g.classList.toggle('mh-on', i === 0)); await W(1500); }],
      ['Tous les joueurs jouent', async function () { this.n.forEach((g, i) => g.classList.toggle('mh-on', i === 1)); await W(1500); }],
      ['Puis les ennemis', async function () { this.n.forEach((g, i) => g.classList.toggle('mh-on', i === 2)); await W(1500); }],
    ] });

  scene({ ic: '🎮', t: '4 actions par tour', cols: 7, rows: 3,
    setup(b) { b.piece('s', 'snake', 0, 1); b.hudTokens(4, 0); this.u = 0; },
    steps: [
      ['Sneak : 1 case', async (b) => { b.hudTokens(4, 1); b.hl(1, 1); await b.move('s', 1, 1); }],
      ['Dash : 2 cases… 🔊 bruyant', async (b) => { b.clearFx(); b.hudTokens(4, 2); b.hl(2, 1); b.hl(3, 1); b.waves(1, 1); await b.move('s', 2, 1, 260); await b.move('s', 3, 1); }],
      ['Encore Sneak', async (b) => { b.clearFx(); b.hudTokens(4, 3); await b.move('s', 4, 1); }],
      ['Dernier jeton', async (b) => { b.hudTokens(4, 4); await b.move('s', 5, 1); }],
      ['Fin du tour', async (b) => { b.bubble(5, 1, '✅'); await W(900); }],
    ] });

  scene({ ic: '✚', t: 'Jamais en diagonale', cols: 5, rows: 5,
    setup(b) { b.piece('s', 'snake', 2, 2); b.wall(2, 1, 'right'); b.wall(2, 2, 'right'); b.wall(2, 3, 'right'); },
    steps: [
      ['Haut, bas, gauche : oui', async (b) => { [[2, 1], [2, 3], [1, 2]].forEach(([x, y]) => b.hl(x, y, 'mh-ok')); await W(1300); }],
      ['Diagonale : non', async (b) => { b.clearFx(); [[1, 1], [3, 1], [1, 3], [3, 3]].forEach(([x, y]) => { b.hl(x, y, 'mh-ko'); b.bubble(x, y + 0.75, '✖', 'mh-red'); }); await W(1400); }],
      ['Mur rouge : bloqué', async (b) => { b.clearFx(); b.hl(3, 2, 'mh-ko'); const p = b.p.s; p.x = 2.25; b.place(p); await W(220); p.x = 2; b.place(p); await W(400); b.bubble(3, 2, '🧱', 'mh-red'); await W(900); }],
    ] });

  scene({ ic: '🤸', t: 'Saute-mouton', cols: 6, rows: 3,
    setup(b) { b.piece('s', 'snake', 1, 1); b.piece('g', 'guard', 2, 1, 'down'); b.obstacle(2, 0); b.obstacle(2, 2); },
    steps: [
      ['Un garde bloque le couloir', async (b) => { b.hl(2, 1, 'mh-ko'); await W(1100); }],
      ['Saute par-dessus = 1 case', async (b) => { b.clearFx(); await b.jump('s', 3, 1); }],
      ['… mais il t\'attaque !', async (b) => { b.bubble(2, 1, '⚔️', 'mh-red'); await W(1100); }],
      ['Et tu es repéré', async (b) => { b.clearFx(); b.token('a', '!', 3, 1); b.remove('s'); b.piece('s', 'snake', 3, 1); await W(1200); }],
    ] });

  scene({ ic: '👁️', t: 'Vu ou pas vu ?', cols: 7, rows: 4,
    setup(b) { b.obstacle(4, 1); b.piece('g', 'guard', 1, 1, 'right'); b.piece('s', 'snake', 6, 1); },
    steps: [
      ['Il regarde tout ce qui est à droite', async (b) => { b.half(1, 1, 'right'); await W(1400); }],
      ['Obstacle dans la « boîte » : caché', async (b) => { b.clearFx(); b.box(1, 1, 6, 1, false); b.bubble(6, 1, '😌'); await W(1500); }],
      ['Boîte vide : VU !', async (b) => { b.clearFx(); await b.path('s', [[6, 2], [6, 3], [5, 3], [4, 3], [3, 3]], 300); b.box(1, 1, 3, 3, true); b.bubble(3, 3, '🚨', 'mh-red'); await W(500); b.token('a', '!', 3, 3); await W(900); }],
      ['Dans son dos : invisible', async (b) => { b.clearFx(); b.untoken('a'); b.remove('s'); b.piece('s', 'snake', 0, 2); b.half(1, 1, 'right'); b.bubble(0, 2, '😌'); await W(1500); }],
    ] });

  scene({ ic: '🔊', t: 'Le bruit', cols: 7, rows: 4,
    setup(b) { b.obstacle(3, 1); b.obstacle(3, 2); b.piece('s', 'snake', 0, 3); b.piece('g1', 'guard', 5, 0, 'down'); b.piece('g2', 'guard', 6, 3, 'up'); },
    steps: [
      ['Dash = bruit', async (b) => { b.waves(0, 3); await b.move('s', 1, 3, 260); await b.move('s', 2, 3); }],
      ['Fin du tour : 1 dé blanc', async (b) => { await b.dice([{ v: '!' }], 40); await W(500); }],
      ['« ! » → jeton ? sur toi', async (b) => { b.token('q', '?', 2, 3); await W(1000); }],
      ['Le garde le + proche vient voir…', async (b) => { b.hudClear(); b.hudText('🔵 4', 20, 'mh-blue'); await b.move('g2', 5, 3, 500); }],
      ['… et te trouve !', async (b) => { b.box(2, 3, 5, 3, true); b.bubble(2, 3, '⚔️', 'mh-red'); await W(1500); }],
    ] });

  scene({ ic: '🚨', t: 'Alerte !', cols: 7, rows: 4,
    setup(b) { b.obstacle(3, 1); b.piece('s', 'snake', 5, 1); b.token('a', '!', 5, 1); b.piece('g1', 'guard', 0, 0, 'down'); b.piece('g2', 'guard', 0, 3, 'up'); },
    steps: [
      ['Un ! dans la zone…', async (b) => { b.hl(5, 1, 'mh-ko'); await W(1200); }],
      ['TOUS foncent dessus 🔴', async (b) => { b.hudText('🔴 6', 20, 'mh-red'); await Promise.all([b.path('g1', [[1, 0], [2, 0], [3, 0], [4, 0]], 320), b.path('g2', [[1, 3], [2, 3], [3, 3], [4, 3]], 320)]); }],
      ['Dès qu\'ils te voient : attaque', async (b) => { b.box(4, 0, 5, 1, true); b.box(4, 1, 5, 3, true); b.bubble(4, 0, '⚔️', 'mh-red'); b.bubble(4, 3, '⚔️', 'mh-red'); await W(1700); }],
    ] });

  scene({ ic: '🚶', t: 'La patrouille', cols: 7, rows: 4,
    setup(b) { b.token('t', 'turn', 4, 1); b.piece('g', 'guard', 0, 1, 'right'); b.obstacle(2, 3); b.obstacle(5, 0); },
    steps: [
      ['Personne en vue : tout droit 🔵', async (b) => { b.hudText('🔵 5', 20, 'mh-blue'); await b.path('g', [[1, 1], [2, 1], [3, 1], [4, 1]], 420); }],
      ['Flèche au sol : il tourne', async (b) => { await b.turn('g', 'down', 500); await b.path('g', [[4, 2]], 420); }],
      ['5 cases, fini', async (b) => { b.bubble(4, 2, '5/5'); await W(1200); }],
    ] });

  scene({ ic: '🤫', t: 'Élimination silencieuse', cols: 7, rows: 3,
    setup(b) { b.piece('g', 'guard', 3, 1, 'right'); b.piece('s', 'snake', 0, 1); b.obstacle(6, 0); b.obstacle(6, 2); },
    steps: [
      ['Il regarde ailleurs', async (b) => { b.half(3, 1, 'right'); await W(1100); }],
      ['Snake se glisse dans son dos', async (b) => { await b.path('s', [[1, 1], [2, 1]], 420); }],
      ['2 actions : éliminé, sans bruit', async (b) => { b.clearFx(); b.bubble(3, 1, '🤫'); await W(700); b.remove('g'); b.token('d', 'dead', 3, 1); await W(900); }],
      ['Traîne le corps (1 action 🔊)', async (b) => { b.clearFx(); b.untoken('d'); await b.move('s', 3, 1); b.token('d', 'dead', 3, 2); b.waves(3, 1); await W(900); }],
    ] });

  scene({ ic: '🎲', t: 'Combat', cols: 6, rows: 3,
    setup(b) { b.piece('s', 'snake', 2, 1); b.piece('g', 'guard', 3, 1, 'up'); },
    steps: [
      ['Combo : 3 dés', async (b) => { await b.dice([{ v: 4 }, { v: 1 }, { v: 3, c: 'b' }], 34, 3); }],
      ['Dé ≥ Défense 3 = 1 dégât', async (b) => { b.hudText('= 2 💥', 200, 'mh-big'); await W(1500); }],
      ['2 dégâts KO : assommé', async (b) => { b.remove('g'); b.token('k', 'ko2', 3, 1); await W(1300); }],
    ] });

  scene({ ic: '💤', t: 'Le KO se réveille', cols: 6, rows: 3,
    setup(b) { b.token('k', 'ko2', 2, 1); },
    steps: [
      ['Assommé : ★★', async (b) => { await W(1200); }],
      ['Carte « Réveil » : ★', async (b) => { b.hudText('🃏 ✨', 20); b.token('k', 'ko1', 2, 1); await W(1300); }],
      ['Encore une : debout !', async (b) => { b.untoken('k'); b.piece('g', 'guard', 2, 1, 'right'); await W(1300); }],
    ] });

  scene({ ic: '📹', t: 'Les caméras', cols: 7, rows: 4,
    setup(b) { b.obstacle(1, 1); b.piece('c', 'camera', 3, 0, 'down'); b.piece('s', 'snake', 0, 3); },
    steps: [
      ['Elle regarde dans 1 direction', async (b) => { b.half(3, 0, 'down'); await W(1400); }],
      ['La carte ennemie la fait pivoter', async (b) => { b.clearFx(); await b.turn('c', 'right', 600); b.half(3, 0, 'right'); await W(900); }],
      ['Elle regarde ailleurs : passe !', async (b) => { await b.path('s', [[1, 3], [2, 3], [2, 2], [2, 1], [2, 0]], 300); }],
      ['Sur SA case : elle ne te voit pas', async (b) => { b.clearFx(); await b.move('s', 3, 0); b.p.s.s = 0.8; b.place(b.p.s); b.bubble(3, 0.9, '😌'); await W(1500); }],
    ] });

  scene({ ic: '🃏', t: 'Le chrono', cols: 7, rows: 2, hud: 30,
    setup(b) {
      this.cards = [];
      for (let i = 0; i < 9; i++) { const red = i >= 6; const r = mk('rect', { x: 40 + i * 4, y: 20 - i * 3, width: 70, height: 96, rx: 8, class: 'card ' + (red ? 'mh-r' : 'mh-b') }); b.L.top.appendChild(r); this.cards.push(r); }
    },
    steps: [
      ['Bleues dessus, rouges dessous', async function () { await W(1400); }],
      ['1 carte par tour ennemi', async function (b) { for (let k = 0; k < 6; k++) { const c = this.cards.pop(); c.setAttribute('class', c.getAttribute('class') + ' gone'); await W(330); } }],
      ['Les rouges : ça presse !', async function () { this.cards.forEach(c => c.classList.add('pulse')); await W(1300); }],
      ['GAME OVER = mission ratée', async function (b) { const c = this.cards.pop(); c.setAttribute('class', 'card mh-go'); const t = mk('text', { x: 300, y: 70, class: 'gotxt', 'text-anchor': 'middle' }, 'GAME OVER'); b.L.top.appendChild(t); await W(1600); }],
    ] });

  scene({ ic: '👾', t: 'Les boss', cols: 7, rows: 4, hud: 90,
    setup(b) { b.piece('bo', 'boss', 5, 1, 'left'); b.piece('s', 'snake', 1, 2); b.obstacle(3, 1);
      this.deck = mk('g', { transform: 'translate(20,-80)' });
      for (let i = 0; i < 4; i++) this.deck.appendChild(mk('rect', { x: i * 3, y: -i * 2, width: 46, height: 64, rx: 6, class: 'card bo' }));
      b.L.hud.appendChild(this.deck); },
    steps: [
      ['Tour du boss : 1 carte', async function (b) { const c = this.deck.lastChild; c.setAttribute('class', 'card bo flip'); await W(900); }],
      ['Il bouge et attaque', async (b) => { await b.path('bo', [[5, 2], [4, 2]], 360); b.bubble(1, 2, '⚔️', 'mh-red'); await W(1100); }],
      ['Puis la carte va dessous', async function (b) { const c = this.deck.lastChild; c.setAttribute('class', 'card bo'); this.deck.insertBefore(c, this.deck.firstChild); await W(1200); }],
    ] });

  /* ===================== Overlay ===================== */
  const css = `
  #mgsHelp{position:fixed;inset:0;z-index:100000;display:none;flex-direction:column;background:radial-gradient(1000px 600px at 50% -10%,rgba(92,140,255,.35),transparent 60%),rgba(6,8,26,.97);color:#e8ecff;font:16px/1.4 "Segoe UI",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
  #mgsHelp.show{display:flex}
  #mgsHelp .mh-top{display:flex;align-items:center;gap:10px;padding:12px 14px calc(6px) 14px;padding-top:calc(12px + env(safe-area-inset-top))}
  #mgsHelp .mh-t{font:800 clamp(1.2rem,3.4vw,1.9rem) system-ui;display:flex;align-items:center;gap:10px;flex:1;min-width:0}
  #mgsHelp .mh-t .ic{font-size:1.4em}
  #mgsHelp .mh-x{width:52px;height:52px;border-radius:14px;border:1px solid #39407a;background:#151a3f;color:#fff;font-size:24px;cursor:pointer}
  #mgsHelp .mh-chap{display:flex;gap:6px;overflow-x:auto;padding:4px 14px 10px;scrollbar-width:none}
  #mgsHelp .mh-chap::-webkit-scrollbar{display:none}
  #mgsHelp .mh-chap button{flex:0 0 auto;width:48px;height:48px;border-radius:12px;border:1px solid #2c3470;background:#11163a;font-size:22px;cursor:pointer;opacity:.6}
  #mgsHelp .mh-chap button.mh-on{opacity:1;border-color:#7aa7ff;background:#24307a;box-shadow:0 0 14px rgba(122,167,255,.5)}
  #mgsHelp .mh-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 10px;touch-action:pan-y}
  #mgsHelp svg{width:100%;height:100%;max-width:1100px}
  #mgsHelp .mh-cap{text-align:center;font:800 clamp(1.25rem,4vw,2.1rem) system-ui;min-height:2.6em;display:flex;align-items:center;justify-content:center;padding:4px 16px;text-shadow:0 2px 12px rgba(0,0,0,.6);transition:opacity .25s}
  #mgsHelp .mh-nav{display:flex;justify-content:center;gap:14px;padding:6px 0 calc(16px + env(safe-area-inset-bottom))}
  #mgsHelp .mh-nav button{width:76px;height:60px;border-radius:16px;border:1px solid #39407a;background:#151a3f;color:#fff;font-size:26px;cursor:pointer}
  #mgsHelp .mh-nav button.pp{background:linear-gradient(135deg,#5b8cff,#8a5cff);border:none}
  #mgsHelp .mh-cell{fill:#151c40;stroke:#26306a;stroke-width:1.5}
  #mgsHelp .obst{fill:#c98a86;stroke:#e0404c;stroke-width:3;opacity:.9}
  #mgsHelp .wall{stroke:#ff3d4f;stroke-width:7;stroke-linecap:round}
  #mgsHelp .pc{transition:transform .38s cubic-bezier(.4,.1,.3,1)}
  #mgsHelp .rot{transition:transform .3s}
  #mgsHelp .gb{fill:#28395a;stroke:#9fd2ff;stroke-width:3.5}
  #mgsHelp .ga{fill:#9fd2ff}
  #mgsHelp .boss .gb{fill:#4a1f5a;stroke:#e08aff}
  #mgsHelp .boss .ga{fill:#e08aff}
  #mgsHelp .camera .gb{fill:#123a2a;stroke:#3dffa0}#mgsHelp .camera .ga{fill:#3dffa0}
  #mgsHelp .pb{fill:#6a1722;stroke:#ff4d5e;stroke-width:4.5}
  #mgsHelp .pl{fill:#fff;font:800 24px system-ui;pointer-events:none}
  #mgsHelp .camera .pl,#mgsHelp .boss .pl{font-size:22px}
  #mgsHelp .tok rect{stroke-width:2.5}#mgsHelp .tok text{font:900 19px system-ui;fill:#fff}
  #mgsHelp .tok{animation:mhpop .35s ease-out}
  #mgsHelp .tq rect{fill:#1f8bff;stroke:#cfe6ff}#mgsHelp .ta rect{fill:#e01f35;stroke:#ffd0d6}
  #mgsHelp .tk rect{fill:#2a2a12;stroke:#ffd166}#mgsHelp .tk text{fill:#ffd166;font-size:14px}
  #mgsHelp .td rect{fill:#2b2b33;stroke:#bbb}
  #mgsHelp .tt rect{fill:transparent;stroke:#9fd2ff;stroke-dasharray:4 3}#mgsHelp .tt text{fill:#9fd2ff;font-size:24px}
  #mgsHelp .hl{stroke-width:3;stroke-dasharray:7 5;animation:mhpop .3s}
  #mgsHelp .hl.mh-ok{fill:rgba(90,255,170,.2);stroke:#5affaa}#mgsHelp .hl.mh-ko{fill:rgba(255,77,94,.22);stroke:#ff4d5e}
  #mgsHelp .los{fill:none;stroke-width:5;stroke-dasharray:12 7;animation:mhpop .3s}
  #mgsHelp .los.seen{stroke:#ff4d5e;fill:rgba(255,77,94,.10)}#mgsHelp .los.safe{stroke:#8d97c7}
  #mgsHelp .cone{fill:rgba(255,209,102,.13);stroke:rgba(255,209,102,.35);stroke-width:1.5;animation:mhfade .5s}
  #mgsHelp .bub rect{fill:#0d1233;stroke:#7aa7ff;stroke-width:2.5}#mgsHelp .bub text{fill:#fff;font:800 17px system-ui}
  #mgsHelp .bub.mh-red rect{stroke:#ff4d5e;fill:#2a0b14}
  #mgsHelp .bub{animation:mhpop .3s ease-out}
  #mgsHelp .wave{fill:none;stroke:#ffb35c;stroke-width:4;animation:mhwave 1s ease-out forwards}
  #mgsHelp .atk circle{fill:#5b8cff;stroke:#cfdcff;stroke-width:3;transition:.3s}
  #mgsHelp .atk.used circle{fill:#1a2148;stroke:#39407a}
  #mgsHelp .ht{font:900 30px system-ui;fill:#fff}#mgsHelp .ht.mh-blue{fill:#6fb0ff}#mgsHelp .ht.mh-red{fill:#ff5a6a}#mgsHelp .ht.mh-big{fill:#ffd166}
  #mgsHelp .die rect{stroke-width:3}#mgsHelp .die text{font:900 22px system-ui}
  #mgsHelp .die.mh-w rect{fill:#f2f2ee;stroke:#f2f2ee}#mgsHelp .die.mh-w text{fill:#111}
  #mgsHelp .die.mh-b rect{fill:#1b1b1b;stroke:#666}#mgsHelp .die.mh-b text{fill:#fff}
  #mgsHelp .die.hit rect{stroke:#5affaa}#mgsHelp .die.miss{opacity:.45}#mgsHelp .die.bang rect{stroke:#ff4d5e;fill:#ffe1e4}#mgsHelp .die.bang text{fill:#e01f35}
  #mgsHelp .node circle{fill:#151c40;stroke:#39407a;stroke-width:4;transition:.35s}#mgsHelp .node .big{font-size:44px}
  #mgsHelp .node.mh-on circle{fill:#24307a;stroke:#7aa7ff;stroke-width:6}
  #mgsHelp .link{stroke:#39407a;stroke-width:6}
  #mgsHelp .card{stroke:#fff;stroke-width:2;transition:transform .35s,opacity .35s}
  #mgsHelp .card.mh-b{fill:#2f7dd6}#mgsHelp .card.mh-r{fill:#d63045}#mgsHelp .card.bo{fill:#6a2a8a}
  #mgsHelp .card.gone{transform:translate(260px,0);opacity:0}
  #mgsHelp .card.pulse{animation:mhpulse .6s infinite alternate}
  #mgsHelp .card.mh-go{fill:#111;stroke:#ff4d5e;stroke-width:4;transform:translate(230px,-10px)}
  #mgsHelp .card.flip{transform:translate(70px,0)}
  #mgsHelp .gotxt{font:900 34px system-ui;fill:#ff4d5e;animation:mhpop .4s}
  @keyframes mhpop{from{opacity:0}to{opacity:1}}
  @keyframes mhfade{from{opacity:0}to{opacity:1}}
  @keyframes mhwave{from{r:18;opacity:1}to{r:56;opacity:0}}
  @keyframes mhpulse{to{opacity:.55}}
  #mgsHelpBtn{position:fixed;left:16px;bottom:16px;z-index:99990;width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;font:900 28px system-ui;color:#fff;background:linear-gradient(135deg,#5b8cff,#8a5cff);box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 0 4px rgba(122,167,255,.25)}
  @media (prefers-reduced-motion:reduce){#mgsHelp *{animation:none!important;transition:none!important}}
  `;

  let root, svg, cap, chap, idx = 0, built = false;
  function build() {
    if (built) return; built = true;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'mgsHelp';
    root.innerHTML = `<div class="mh-top"><div class="mh-t"><span class="ic"></span><span class="tt"></span></div><button class="mh-x" aria-label="Fermer">✕</button></div>
      <div class="mh-chap"></div><div class="mh-stage"><svg></svg></div><div class="mh-cap"></div>
      <div class="mh-nav"><button class="pv" aria-label="Précédent">◀</button><button class="pp" aria-label="Pause">⏸</button><button class="nx" aria-label="Suivant">▶</button></div>`;
    document.body.appendChild(root);
    svg = root.querySelector('svg'); cap = root.querySelector('.mh-cap'); chap = root.querySelector('.mh-chap');
    chap.innerHTML = SC.map((s, i) => `<button data-i="${i}" title="${s.t}">${s.ic}</button>`).join('');
    chap.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.i); });
    root.querySelector('.mh-x').onclick = close;
    root.querySelector('.pv').onclick = () => go(idx - 1);
    root.querySelector('.nx').onclick = () => go(idx + 1);
    const pp = root.querySelector('.pp'); pp.onclick = () => { paused = !paused; pp.textContent = paused ? '▶' : '⏸'; };
    let sx = null; const stage = root.querySelector('.mh-stage');
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); sx = null; });
    document.addEventListener('keydown', e => {
      if (!root.classList.contains('show')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1);
      if (e.key === ' ') { e.preventDefault(); pp.click(); }
    });
  }
  async function play(i) {
    const my = ++RUN; const s = SC[i];
    root.querySelector('.ic').textContent = s.ic; root.querySelector('.tt').textContent = s.t;
    chap.querySelectorAll('button').forEach((b, k) => b.classList.toggle('mh-on', k === i));
    const on = chap.children[i]; if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    try {
      for (;;) {
        const b = new Board(svg, s.cols, s.rows, s.hud == null ? 80 : s.hud);
        const ctx = Object.create(s); s.setup.call(ctx, b);
        for (const [txt, fn] of s.steps) {
          cap.style.opacity = 0; await W(160); cap.textContent = txt; cap.style.opacity = 1;
          await fn.call(ctx, b); await W(650); await waitWhilePaused();
        }
        await W(1400);
        if (my !== RUN) return;
      }
    } catch (e) { if (e !== STOP) console.error(e); }
  }
  function go(i) { idx = (i + SC.length) % SC.length; paused = false; const pp = root.querySelector('.pp'); if (pp) pp.textContent = '⏸'; play(idx); }
  function open(i = 0) { build(); root.classList.add('show'); document.documentElement.style.overflow = 'hidden'; go(i); }
  function close() { RUN++; root.classList.remove('show'); document.documentElement.style.overflow = ''; }

  window.MGSHelp = { open, close, scenes: SC };
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey) return;
    if ((e.key === '?' || e.key === 'h') && !(root && root.classList.contains('show'))) open();
  });
  // Bouton flottant « ? » (sauf si la page a déjà son propre bouton [data-mgs-help])
  const addBtn = () => {
    if (document.querySelector('[data-mgs-help]')) { document.querySelectorAll('[data-mgs-help]').forEach(b => b.addEventListener('click', () => open())); return; }
    const st = document.createElement('style'); st.textContent = css.split('\n').filter(l => l.includes('#mgsHelpBtn')).join('\n'); document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'mgsHelpBtn'; b.textContent = '?'; b.title = 'Aide animée (touche ?)'; b.onclick = () => open(); document.body.appendChild(b);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBtn); else addBtn();
})();
