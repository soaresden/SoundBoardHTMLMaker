/* MGS Board Game — Leçons interactives / animées.
   Chaque leçon : { id, icon, title, sub, html, mount(root) } */
(function () {
  const S = 56; // taille d'une case en px (unité SVG)
  const NS = 'http://www.w3.org/2000/svg';
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ROT = { up: 0, right: 90, down: 180, left: 270 };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Mini moteur de plateau SVG ---------- */
  function board(el, cols, rows, opts = {}) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `-4 -4 ${cols * S + 8} ${rows * S + 8}`);
    svg.classList.add('bd');
    el.appendChild(svg);
    const g = (cls) => { const x = document.createElementNS(NS, 'g'); if (cls) x.setAttribute('class', cls); svg.appendChild(x); return x; };
    const L = { floor: g('floor'), fx: g('fx'), obs: g('obs'), walls: g('walls'), tok: g('tok'), pcs: g('pcs'), top: g('top') };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const r = mk('rect', { x: x * S + 1, y: y * S + 1, width: S - 2, height: S - 2, rx: 4, class: 'cell', 'data-x': x, 'data-y': y });
      L.floor.appendChild(r);
    }
    const api = {
      svg, L, cols, rows,
      obstacles: new Set(), walls: new Set(), pieces: {},
      obstacle(x, y) { api.obstacles.add(x + ',' + y); L.obs.appendChild(mk('rect', { x: x * S + 4, y: y * S + 4, width: S - 8, height: S - 8, rx: 3, class: 'obstacle' })); },
      // mur entre (x,y) et la case dans la direction d
      wall(x, y, d) {
        const [dx, dy] = DIRS[d]; const k = wkey(x, y, x + dx, y + dy); api.walls.add(k);
        let a;
        if (d === 'right') a = { x1: (x + 1) * S, y1: y * S, x2: (x + 1) * S, y2: (y + 1) * S };
        if (d === 'left') a = { x1: x * S, y1: y * S, x2: x * S, y2: (y + 1) * S };
        if (d === 'down') a = { x1: x * S, y1: (y + 1) * S, x2: (x + 1) * S, y2: (y + 1) * S };
        if (d === 'up') a = { x1: x * S, y1: y * S, x2: (x + 1) * S, y2: y * S };
        L.walls.appendChild(mk('line', Object.assign(a, { class: 'wall' })));
      },
      piece(id, kind, x, y, face, label) {
        const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'pc ' + kind);
        const inner = document.createElementNS(NS, 'g'); inner.setAttribute('class', 'rot');
        if (kind === 'guard' || kind === 'camera') {
          inner.appendChild(mk('rect', { x: -S / 2 + 6, y: -S / 2 + 6, width: S - 12, height: S - 12, rx: 7, class: 'gbody' }));
          inner.appendChild(mk('path', { d: `M -9 ${-S / 2 + 4} L 0 ${-S / 2 - 6} L 9 ${-S / 2 + 4} Z`, class: 'garrow' }));
        } else if (kind === 'snake' || kind === 'meryl' || kind === 'player') {
          inner.appendChild(mk('circle', { r: S / 2 - 6, class: 'pbody' }));
        }
        gg.appendChild(inner);
        const t = mk('text', { class: 'plabel', 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = label || ''; gg.appendChild(t);
        L.pcs.appendChild(gg);
        const p = { id, kind, x, y, face: face || 'up', el: gg, inner };
        api.pieces[id] = p; api.place(p); return p;
      },
      place(p) { p.el.setAttribute('transform', `translate(${p.x * S + S / 2},${p.y * S + S / 2})`); p.inner.setAttribute('transform', `rotate(${ROT[p.face] || 0})`); },
      async move(id, x, y, ms = 420) { const p = api.pieces[id]; const dx = x - p.x, dy = y - p.y; if (dx || dy) p.face = p.kind === 'guard' ? (dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up') : p.face; p.x = x; p.y = y; api.place(p); await sleep(ms); },
      async turn(id, face, ms = 300) { const p = api.pieces[id]; p.face = face; api.place(p); await sleep(ms); },
      token(id, kind, x, y) {
        api.untoken(id);
        const map = { '?': ['tq', '?'], '!': ['ta', '!'], 'ko2': ['tko', '★★'], 'ko1': ['tko', '★'], 'dead': ['tdead', '☠'], 'A': ['tev', 'A'], 'B': ['tev', 'B'], 'turn': ['tturn', '↻'], 'exit': ['texit', 'EXIT'], 'radio': ['tradio', '📻'] };
        const [cls, txt] = map[kind] || ['tq', kind];
        const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'tk ' + cls); gg.setAttribute('data-id', id);
        gg.setAttribute('transform', `translate(${x * S + S / 2},${y * S + S / 2})`);
        gg.appendChild(mk('rect', { x: -15, y: -15, width: 30, height: 30, rx: 5 }));
        const t = mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = txt; gg.appendChild(t);
        L.tok.appendChild(gg); return gg;
      },
      untoken(id) { const o = L.tok.querySelector(`[data-id="${id}"]`); if (o) o.remove(); },
      remove(id) { const p = api.pieces[id]; if (p) { p.el.remove(); delete api.pieces[id]; } },
      clearFx() { L.fx.innerHTML = ''; L.top.innerHTML = ''; },
      hl(x, y, cls = 'hl') { L.fx.appendChild(mk('rect', { x: x * S + 2, y: y * S + 2, width: S - 4, height: S - 4, rx: 5, class: cls })); },
      boxFx(x0, y0, x1, y1, ok) { L.top.appendChild(mk('rect', { x: x0 * S + 1, y: y0 * S + 1, width: (x1 - x0 + 1) * S - 2, height: (y1 - y0 + 1) * S - 2, rx: 6, class: 'losbox ' + (ok ? 'ok' : 'ko') })); },
      bubble(x, y, txt, cls = '') {
        const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'bubble ' + cls);
        gg.setAttribute('transform', `translate(${x * S + S / 2},${y * S - 6})`);
        const w = Math.max(40, txt.length * 8.4 + 16);
        gg.appendChild(mk('rect', { x: -w / 2, y: -26, width: w, height: 24, rx: 12 }));
        const t = mk('text', { y: -14, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = txt; gg.appendChild(t);
        L.top.appendChild(gg); return gg;
      },
      onCell(fn) { svg.addEventListener('click', e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); const x = Math.floor(p.x / S), y = Math.floor(p.y / S); if (x >= 0 && y >= 0 && x < cols && y < rows) fn(x, y); }); },
      blocked(x, y) { return api.obstacles.has(x + ',' + y); },
    };
    return api;
  }
  function mk(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function wkey(a, b, c, d) { return (a < c || (a === c && b < d)) ? `${a},${b}|${c},${d}` : `${c},${d}|${a},${b}`; }

  /* LOS selon le livret : (1) la cible est dans la direction regardée, (2) aucune obstruction dans la boîte englobante. */
  function los(bd, from, to, opts = {}) {
    const res = { facing: true, box: true };
    if (from.x === to.x && from.y === to.y) return { facing: false, box: false, same: true };
    if (opts.facing) {
      const f = opts.facing;
      res.facing = (f === 'right' && to.x > from.x) || (f === 'left' && to.x < from.x) || (f === 'down' && to.y > from.y) || (f === 'up' && to.y < from.y);
    }
    const x0 = Math.min(from.x, to.x), x1 = Math.max(from.x, to.x), y0 = Math.min(from.y, to.y), y1 = Math.max(from.y, to.y);
    res.rect = [x0, y0, x1, y1];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) continue;
      if (bd.blocked(x, y)) res.box = false;
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < x1 && bd.walls.has(wkey(x, y, x + 1, y))) res.box = false;
      if (y < y1 && bd.walls.has(wkey(x, y, x, y + 1))) res.box = false;
    }
    res.ok = res.facing && res.box;
    return res;
  }

  /* Petits composants */
  function ctrl(root, html) { const d = document.createElement('div'); d.className = 'ctrls'; d.innerHTML = html; root.appendChild(d); return d; }
  function cap(root) { const d = document.createElement('div'); d.className = 'caption'; root.appendChild(d); return d; }
  function runner(steps, capEl, onReset) {
    // steps: [{t:'texte', f: async()=>{}}]
    let i = 0, busy = false, auto = false;
    const api = {
      async next() { if (busy || i >= steps.length) return false; busy = true; const s = steps[i++]; capEl.innerHTML = `<span class="stepn">${i}/${steps.length}</span> ${s.t}`; await s.f(); busy = false; return true; },
      async play() { if (auto) return; auto = true; while (auto && await api.next()) await sleep(1100); auto = false; },
      reset() { auto = false; i = 0; onReset(); capEl.innerHTML = '<span class="muted">Appuie sur ▶ Lecture ou ⏭ Étape.</span>'; },
    };
    return api;
  }
  function playerCtrls(root, r) {
    const c = ctrl(root, `<button class="btn pri" data-a="play">▶ Lecture</button><button class="btn" data-a="next">⏭ Étape</button><button class="btn" data-a="reset">↺ Recommencer</button>`);
    c.addEventListener('click', e => { const a = e.target.dataset.a; if (a) r[a](); });
  }

  /* ---------- LEÇONS ---------- */
  const L = [];

  /* 1. Le but du jeu */
  L.push({ id: 'but', icon: '🎯', title: 'Le but du jeu', sub: 'Stages, campagne, échec',
    html: `
    <p class="lead">Vous êtes l'équipe FOXHOUND d'élite. Chaque <b>Stage</b> (mission) se joue en une session, en <b>coopération</b> contre le jeu.</p>
    <div class="two">
      <div class="card sneakc"><h4>🕵️ Stage d'infiltration</h4><p>Remplir les objectifs <b>sans se faire voir</b>. Les gardes sont pilotés par les cartes <b>Guard Order</b>. Le paquet sert aussi de <b>chrono</b> : si la carte <b>Game Over</b> sort → échec.</p></div>
      <div class="card bossc"><h4>👾 Stage de Boss</h4><p>Combat contre un boss culte (Ocelot, Ninja, Mantis, Wolf, Raven, REX…). Le boss joue grâce à <b>son deck Boss</b>. Pas de gardes.</p></div>
    </div>
    <h4>Un round = toujours la même boucle</h4>
    <div class="loop" id="loopDemo">
      <div class="lnode" data-i="0"><b>1</b> Début du round<small>chacun reprend ses 4 jetons Action</small></div>
      <div class="lnode" data-i="1"><b>2</b> Phase Joueurs<small>chacun son tour, 4 actions max</small></div>
      <div class="lnode" data-i="2"><b>3</b> Phase Ennemie<small>gardes (carte Guard Order) ou Boss (carte Boss)</small></div>
      <div class="ldot"></div>
    </div>
    <div class="card warnc"><h4>💀 On perd si…</h4><ul><li>un joueur est <b>KIA</b> (ses dégâts atteignent sa santé) ;</li><li>la carte <b>Game Over</b> est révélée (infiltration) ;</li><li>une condition d'échec propre au Stage se produit.</li></ul><p class="muted">… même si c'est pendant l'action qui remplissait le dernier objectif !</p></div>
    <div class="card"><h4>📦 La campagne</h4><p>14 Stages Shadow Moses dans l'ordre (conseillé). Réussir un Stage débloque des cartes <b>Équipement</b> rangées dans la <b>Memory Box</b> : utilisables dans tous les Stages suivants (et les missions VR). Les missions <b>VR</b> se jouent à part, n'importe quand, 1 à 4 joueurs, n'importe quels personnages.</p><p>Le <b>Codec</b> : dès que tu vois un numéro Codec sur un composant, cherche-le dans le Codec Book (infos, secrets…).</p></div>
    <p class="muted">Conseil du livret : faites les Stages 1 et 2 (tutoriels, Snake seul — plusieurs joueurs peuvent le piloter ensemble) avant de lire le reste.</p>`,
    mount(root) {
      const nodes = root.querySelectorAll('.lnode'); let i = 0;
      const tick = () => { nodes.forEach(n => n.classList.toggle('on', +n.dataset.i === i)); i = (i + 1) % 3; };
      tick(); const t = setInterval(() => { if (!document.body.contains(root)) return clearInterval(t); tick(); }, 1400);
    } });

  /* 2. Ton tour */
  L.push({ id: 'tour', icon: '🎮', title: 'Ton tour : 4 actions', sub: 'Jetons Action, bruit, noise check',
    html: `
    <p class="lead">À ton tour tu as <b>4 jetons Action</b>. Tu les poses sur les actions de ton dashboard (ou de tes cartes Équipement). Même action plusieurs fois = OK, en payant à chaque fois. Tu n'es pas obligé de tout dépenser.</p>
    <p>👉 Essaie : touche des actions pour dépenser tes jetons. Les actions <b class="noisy">🔊 bruyantes</b> te feront lancer des dés blancs à la fin du tour.</p>
    <div class="sim">
      <div class="tokens" id="tokTray"></div>
      <div class="actgrid" id="actGrid"></div>
      <div class="simlog" id="simLog"></div>
      <div class="ctrls"><button class="btn pri" id="endTurn">🏁 Fin du tour</button><button class="btn" id="resetTurn">↺ Nouveau tour</button></div>
    </div>
    <div class="card"><h4>🔊 Noise check (fin de ton tour)</h4><p>S'il y a <b>au moins un garde dans ta zone</b> : lance <b>1 dé blanc par jeton</b> posé sur une action bruyante. Un seul <b class="alert">!</b> → tu <b>attires l'attention</b> sur ta case (jeton <span class="tqi">?</span>). Pas de garde dans la zone = pas de noise check.</p></div>
    <div class="card"><h4>🔫 Actions LOUD</h4><p>Les armes à feu, grenades, missiles… sont <b>LOUD</b> : après l'action, ton jeton passe directement sur <span class="tai">!</span> (Alerte) sous ta figurine.</p></div>
    <div class="imgfig"><img src="guide/img/snake-dashboard.jpg" alt="Dashboard de Snake"><p>Dashboard de Snake : les actions avec leur coût (cercle rouge), les stats en bas à gauche <b>Équipement 3 · Défense 3 · Santé 4</b>, et ses 4 Focus.</p></div>`,
    mount(root) {
      const tray = root.querySelector('#tokTray'), grid = root.querySelector('#actGrid'), log = root.querySelector('#simLog');
      let left = 4, noisy = 0, used = [];
      const acts = window.MGS_ACTIONS.filter(a => a.cost !== 'X');
      function draw() {
        tray.innerHTML = Array.from({ length: 4 }, (_, i) => `<span class="atok ${i < left ? '' : 'spent'}">${i < left ? '◉' : '○'}</span>`).join('') + `<span class="muted"> ${left} jeton(s) restant(s)</span>`;
        grid.innerHTML = acts.map(a => `<button class="actb ${a.noisy ? 'n' : ''}" data-id="${a.id}" ${a.cost > left ? 'disabled' : ''}><span class="ai">${a.icon}</span><span class="an">${a.fr}<small>${a.name}</small></span><span class="ac">${a.cost}${a.noisy ? ' 🔊' : ''}</span></button>`).join('');
        log.innerHTML = used.length ? used.map(u => `<span class="chip">${u}</span>`).join(' ') : '<span class="muted">Aucune action pour l\'instant.</span>';
      }
      grid.addEventListener('click', e => { const b = e.target.closest('.actb'); if (!b) return; const a = acts.find(x => x.id === b.dataset.id); if (a.cost > left) return; left -= a.cost; if (a.noisy) noisy += a.cost; used.push(`${a.icon} ${a.fr}`); draw(); log.insertAdjacentHTML('beforeend', `<div class="tip">${a.desc}</div>`); });
      root.querySelector('#endTurn').onclick = () => { draw(); log.insertAdjacentHTML('beforeend', noisy ? `<div class="tip warn">🔊 Fin du tour : un garde est dans ta zone ? Lance <b>${noisy} dé(s) blanc(s)</b>. Un <b>!</b> = jeton ? sur ta case.</div>` : `<div class="tip ok">🤫 Aucune action bruyante : pas de noise check.</div>`); };
      root.querySelector('#resetTurn').onclick = () => { left = 4; noisy = 0; used = []; draw(); };
      draw();
    } });

  /* 3. Déplacement */
  L.push({ id: 'move', icon: '🏃', title: 'Se déplacer & saute-mouton', sub: 'Orthogonal, Dash, leapfrog',
    html: `
    <p class="lead">On se déplace <b>orthogonalement</b> (jamais en diagonale), jamais à travers un mur ou une porte verrouillée. Deux figurines ne partagent jamais une case : on <b>saute par-dessus</b> (saute-mouton). Sauter par-dessus plusieurs figurines alignées = <b>1 seule case</b> de mouvement.</p>
    <div class="stage" id="mvStage"></div>
    <div class="card warnc"><h4>⚠️ Sauter par-dessus un garde</h4><p>Possible, mais <b>chaque garde sauté t'attaque</b> (même sans LOS) et tu poses ton jeton <span class="tai">!</span> sous toi à la fin du déplacement. Le garde ne se retourne pas.</p></div>
    <p class="muted">Les gardes, eux, peuvent sauter par-dessus d'autres gardes mais <b>jamais</b> par-dessus un joueur.</p>`,
    mount(root) {
      const st = root.querySelector('#mvStage');
      const wrap = document.createElement('div'); st.appendChild(wrap);
      let bd;
      const build = () => {
        wrap.innerHTML = ''; bd = board(wrap, 8, 3);
        bd.obstacle(3, 0); bd.obstacle(3, 2);
        bd.piece('s', 'snake', 0, 1, 'right', 'S');
        bd.piece('g', 'guard', 4, 1, 'down', '');
      };
      build();
      const c = cap(st);
      const r = runner([
        { t: '<b>Sneak</b> (1 action) : Snake avance d\'1 case.', f: async () => { bd.hl(1, 1); await bd.move('s', 1, 1); } },
        { t: '<b>Dash</b> (1 action, 🔊 bruyant) : 2 cases d\'un coup.', f: async () => { bd.clearFx(); bd.hl(2, 1); bd.hl(3, 1); await bd.move('s', 2, 1, 300); await bd.move('s', 3, 1); } },
        { t: 'Un garde bloque le couloir. <b>Sneak</b> vers lui = saute-mouton : Snake atterrit derrière (ça compte pour 1 case)…', f: async () => { bd.clearFx(); bd.hl(5, 1, 'hl warn'); await bd.move('s', 5, 1, 700); } },
        { t: '… mais le garde sauté <b>l\'attaque</b> : Snake lance 2 dés noirs contre sa Défense 3.', f: async () => { bd.bubble(4, 1, '⚔️ attaque !', 'red'); await sleep(900); } },
        { t: 'Et Snake pose son jeton <b class="alert">! Alerte</b> sous lui. Tous les gardes de la zone vont rappliquer…', f: async () => { bd.clearFx(); bd.token('a', '!', 5, 1); bd.remove('s'); bd.piece('s', 'snake', 5, 1, 'right', 'S'); await sleep(400); } },
      ], c, build);
      playerCtrls(st, r); r.reset();
    } });

  /* 4. Ligne de vue */
  L.push({ id: 'los', icon: '👁️', title: 'Être vu : la ligne de vue', sub: 'Bac à sable interactif',
    html: `
    <p class="lead">Un garde (ou une caméra) te voit si <b>deux conditions</b> sont réunies :</p>
    <ol class="big"><li><b>Il regarde vers toi</b> : ta rangée/colonne est du côté où pointe sa flèche (tout le demi-plateau devant lui).</li><li><b>La boîte est vide</b> : trace un rectangle qui englobe vos deux cases. Aucun mur, porte verrouillée ou obstacle (case bordée de rouge) dedans.</li></ol>
    <p>Les figurines <b>ne bloquent pas</b> la vue. Toi, tu regardes dans toutes les directions. Une caméra ne voit pas sa propre case.</p>
    <div class="ctrls seg" id="losMode"><button class="btn on" data-m="snake">🐍 Placer Snake</button><button class="btn" data-m="guard">💂 Placer le garde</button><button class="btn" data-m="rot">↻ Tourner le garde</button></div>
    <div class="stage" id="losStage"></div>
    <div class="verdict" id="losVerdict"></div>
    <div class="card"><h4>👀 Repéré !</h4><p>Dès qu'un joueur entre dans la LOS d'un garde ou d'une caméra (à n'importe quel moment, même un garde qui vient d'apparaître), il pose son jeton <span class="tai">!</span> sous lui. Si tu commences ou traverses une LOS pendant un déplacement, tu poses le jeton <b>à la fin</b> du déplacement.</p></div>
    <div class="imgrow"><figure><img src="guide/img/los-facing.jpg"><figcaption>Condition 1 : la direction du regard.</figcaption></figure><figure><img src="guide/img/los-box.jpg"><figcaption>Condition 2 : la boîte (ici un mur rouge coupe → ✗).</figcaption></figure><figure><img src="guide/img/obstacles.jpg"><figcaption>Obstacles : porte verrouillée (A), arbre (B), case bordée de rouge (C), mur (D).</figcaption></figure></div>`,
    mount(root) {
      const st = root.querySelector('#losStage'); const verdict = root.querySelector('#losVerdict');
      const bd = board(st, 8, 6);
      [[2, 1], [5, 3], [5, 4], [1, 4]].forEach(([x, y]) => bd.obstacle(x, y));
      bd.wall(3, 2, 'right'); bd.wall(3, 3, 'right'); bd.wall(6, 0, 'down'); bd.wall(7, 0, 'down');
      const g = bd.piece('g', 'guard', 1, 2, 'right', '');
      const s = bd.piece('s', 'snake', 6, 1, 'up', 'S');
      let mode = 'snake';
      root.querySelector('#losMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.m === 'rot') { const order = ['up', 'right', 'down', 'left']; g.face = order[(order.indexOf(g.face) + 1) % 4]; bd.place(g); upd(); return; } mode = b.dataset.m; root.querySelectorAll('#losMode .btn').forEach(x => x.classList.toggle('on', x === b)); });
      bd.onCell((x, y) => { if (bd.blocked(x, y)) return; const p = mode === 'snake' ? s : g; const o = mode === 'snake' ? g : s; if (o.x === x && o.y === y) return; p.x = x; p.y = y; bd.place(p); upd(); });
      function upd() {
        bd.clearFx();
        // demi-plan regardé
        for (let y = 0; y < bd.rows; y++) for (let x = 0; x < bd.cols; x++) {
          const f = g.face; const inF = (f === 'right' && x > g.x) || (f === 'left' && x < g.x) || (f === 'down' && y > g.y) || (f === 'up' && y < g.y);
          if (inF) bd.hl(x, y, 'facing');
        }
        const r = los(bd, g, s, { facing: g.face });
        bd.boxFx(...r.rect, r.ok);
        verdict.className = 'verdict ' + (r.ok ? 'seen' : 'safe');
        verdict.innerHTML = `<div class="vline ${r.facing ? 'y' : 'n'}">${r.facing ? '✅' : '❌'} ① Le garde regarde vers la rangée/colonne de Snake</div>
          <div class="vline ${r.box ? 'y' : 'n'}">${r.box ? '✅' : '❌'} ② Boîte sans mur ni obstacle</div>
          <div class="vres">${r.ok ? '🚨 REPÉRÉ ! Snake pose son jeton ! (Alerte) et le garde l\'attaquera à son activation.' : '🤫 Snake est invisible pour ce garde.'}</div>`;
      }
      upd();
    } });

  /* 5. Attention */
  L.push({ id: 'attention', icon: '❗', title: 'Bruit & jeton Attention', sub: '? Investigation vs ! Alerte',
    html: `
    <p class="lead">Chaque personnage a un jeton <b>Attention</b> recto-verso. Quand il est sur la carte, il dit aux gardes où aller.</p>
    <div class="flipdemo"><div class="flipper" id="flipper"><div class="fa tqbig">?</div><div class="fb tabig">!</div></div>
      <div><p><span class="tqi">?</span> <b>Investigation</b> : « j'ai entendu un truc ». Le garde le plus proche vient voir (chiffre bleu).</p><p><span class="tai">!</span> <b>Alerte</b> : « intrus repéré ! ». <b>Tous</b> les gardes de la zone foncent dessus (chiffre rouge).</p><button class="btn" id="flipBtn">🔄 Retourner</button></div></div>
    <div class="two">
      <div class="card"><h4><span class="tqi">?</span> « Attirer l'attention »</h4><p>Si ton jeton n'est pas sur la carte → pose-le sous toi face <b>?</b>. S'il y est déjà → déplace-le sur ta case <b>sans changer sa face</b>.</p><ul><li>Un <b>!</b> sur un dé blanc (n'importe quel jet)</li><li>Noise check raté</li><li>Action <b>Knock</b> (exprès, pour attirer un garde)</li><li>Section <b>Stay Alert</b> (à 2 cases d'un garde)</li></ul></div>
      <div class="card warnc"><h4><span class="tai">!</span> Passer en Alerte</h4><ul><li>Entrer dans la <b>LOS</b> d'un garde ou d'une caméra</li><li>Utiliser une action <b>LOUD</b> (armes…)</li><li>Sauter par-dessus un garde</li><li>Blesser un garde sans le mettre KO/mort avant la fin de ton tour (même sans LOS !)</li><li>Passer dans la LOS d'un détecteur laser</li></ul></div>
    </div>
    <div class="card"><h4>🧹 Comment s'en débarrasser ?</h4><p>Un garde qui arrive sur la case de ton jeton s'arrête et résout une carte <b>Guard Reaction</b> qui dit quoi faire du jeton (souvent : il le retire, ou il passe en Alerte…). C'est la seule façon normale de « calmer » une alerte : mieux vaut ne pas se faire voir !</p></div>
    <p class="muted">Zone <b>active</b> = une zone contenant un joueur <i>ou</i> le jeton Attention d'un joueur. Seuls les gardes des zones actives s'activent.</p>`,
    mount(root) { const f = root.querySelector('#flipper'); root.querySelector('#flipBtn').onclick = () => f.classList.toggle('flipped'); setTimeout(() => f.classList.add('flipped'), 900); } });

  /* 6. Combat */
  L.push({ id: 'combat', icon: '🎲', title: 'Combattre : dés & Défense', sub: 'Dégâts, KO, Focus',
    html: `
    <p class="lead">Tout se résout aux dés. Règle unique : <b>chaque dé ≥ Défense de la cible = 1 dégât.</b></p>
    <div class="two">
      <div class="card"><h4>⚔️ Tu attaques</h4><p>Tu lances les dés indiqués par l'action ou l'équipement (il faut la LOS ; au corps-à-corps la cible doit être adjacente). Tu compares à la Défense de la cible (garde : <b>3</b>, voir le Guard dashboard).</p></div>
      <div class="card"><h4>🛡️ On t'attaque</h4><p>C'est <b>toi</b> qui lances : 2 dés noirs pour un garde (Guard dashboard), le nombre indiqué pour un boss. Chaque dé ≥ <b>ta</b> Défense = 1 dégât pour toi.</p></div>
    </div>
    <h4>🎬 Exemple du livret : Combo de Snake sur un garde (Défense 3, Santé 2)</h4>
    <div class="dicestage" id="diceStage"></div>
    <div class="caption" id="diceCap"></div>
    <div class="ctrls"><button class="btn pri" id="diceGo">▶ Rejouer l'exemple</button></div>
    <div class="two">
      <div class="card"><h4>💥 Dégâts normaux vs ⭐ KO</h4><p>Dégâts normaux : garde vaincu → jeton <b>Mort ☠</b>. Dégâts <b>KO</b> (corps-à-corps, combo…) : garde assommé → jeton <b>KO ★★</b> (il se réveillera !). Sur un boss, le KO compte comme des dégâts normaux. Un garde KO ne peut plus être attaqué.</p></div>
      <div class="card warnc"><h4>⚠️ Finis le travail</h4><p>Si tu blesses un garde sans le mettre KO/mort avant la fin de ton tour → il est alerté : ton jeton passe sur <b>!</b> sous toi.</p></div>
    </div>
    <div class="card"><h4>✨ Les jetons Focus</h4><p>Chaque perso a 4 Focus uniques (+2, −2, relance…). Gratuits : tu les retournes côté gris pour les utiliser, quand <b>tu</b> lances des dés ou quand un ennemi te vise. Pour les récupérer : action <b>Focus</b> (coût écrit sur la face grise). Les Focus qui déplacent ne s'utilisent que pendant ton tour. Le <b>!</b> ne se modifie pas (+/−) mais peut être relancé. Les modifs peuvent dépasser 1–6.</p></div>
    <h4>🧮 Calculateur de dégâts (pour la table)</h4>
    <div class="calc" id="calc"></div>`,
    mount(root) {
      const stg = root.querySelector('#diceStage'), cp = root.querySelector('#diceCap');
      async function demo() {
        stg.innerHTML = `<div class="dz"><div class="die w" id="d1">?</div><div class="die w" id="d2">?</div><div class="die b" id="d3">?</div></div><div class="vs">vs <span class="defb">Défense 3</span></div><div class="gstat"><div class="pc-guard">💂</div><div class="hp" id="ghp"><i></i><i></i></div></div>`;
        cp.innerHTML = '<b>Combo Attack</b> (2 actions) : Snake lance 2 dés blancs + 1 dé noir…';
        const vals = [4, 1, 3];
        const els = ['d1', 'd2', 'd3'].map(id => stg.querySelector('#' + id));
        els.forEach(e => e.classList.add('rolling'));
        for (let k = 0; k < 10; k++) { els.forEach(e => e.textContent = 1 + Math.floor(Math.random() * 6)); await sleep(80); }
        els.forEach((e, i) => { e.classList.remove('rolling'); e.textContent = vals[i]; });
        await sleep(700);
        cp.innerHTML = 'On compare chaque dé à la Défense 3 : <b class="ok">4 ✔</b> · <b class="ko">1 ✘</b> · <b class="ok">3 ✔</b> (égal compte !) → <b>2 dégâts KO</b>.';
        els.forEach((e, i) => e.classList.add(vals[i] >= 3 ? 'hit' : 'miss'));
        await sleep(1300);
        stg.querySelectorAll('#ghp i').forEach(i => i.classList.add('lost'));
        await sleep(600);
        stg.querySelector('.pc-guard').outerHTML = '<div class="pc-guard ko">★★</div>';
        cp.innerHTML = '2 KO ≥ Santé 2 → le garde est <b>assommé</b> : on remplace la figurine par un jeton <b>KO ★★</b>. Combo = silencieux, pas de jeton ! 😎';
      }
      root.querySelector('#diceGo').onclick = demo; demo();
      // calculateur
      const calc = root.querySelector('#calc');
      let def = 3, dice = [{ c: 'b', v: 6 }, { c: 'b', v: 2 }];
      function draw() {
        const hits = dice.filter(d => d.v !== '!' && d.v >= def).length, bang = dice.some(d => d.v === '!');
        calc.innerHTML = `<div class="crow"><span>Défense de la cible</span>${[1, 2, 3, 4, 5, 6].map(n => `<button class="btn sm ${n === def ? 'on' : ''}" data-def="${n}">${n}</button>`).join('')}</div>
          <div class="crow dicewrap">${dice.map((d, i) => `<button class="die ${d.c} ${d.v !== '!' && d.v >= def ? 'hit' : 'miss'}" data-i="${i}">${d.v}</button>`).join('')}
          <button class="btn sm" data-add="w">+ ⚪ blanc</button><button class="btn sm" data-add="b">+ ⚫ noir</button><button class="btn sm" data-clr="1">vider</button></div>
          <div class="cres">➡ <b>${hits}</b> dégât(s)${bang ? ' · <b class="alert">! → attire l\'attention</b>' : ''}</div>
          <p class="muted">Touche un dé pour changer sa valeur (le blanc peut afficher !). Focus +2/−2 : change simplement la valeur.</p>`;
      }
      calc.addEventListener('click', e => {
        const t = e.target.closest('[data-def],[data-i],[data-add],[data-clr]'); if (!t) return;
        if (t.dataset.def) def = +t.dataset.def;
        if (t.dataset.i) { const d = dice[+t.dataset.i]; const seq = d.c === 'w' ? [1, 2, 3, 4, 5, 6, '!', 0, 7, 8] : [1, 2, 3, 4, 5, 6, 0, 7, 8]; d.v = seq[(seq.indexOf(d.v) + 1) % seq.length]; }
        if (t.dataset.add) dice.push({ c: t.dataset.add, v: 1 });
        if (t.dataset.clr) dice = [];
        draw();
      });
      draw();
    } });

  /* 7. KO / morts */
  L.push({ id: 'ko', icon: '💤', title: 'Gardes KO, morts & réveil', sub: 'Cacher les corps, Lost Contact',
    html: `
    <p class="lead">Un garde assommé ne dort pas éternellement. Un garde tué, lui, finit par manquer à l'appel…</p>
    <div class="timeline" id="koTl"></div>
    <div class="ctrls"><button class="btn pri" id="koGo">▶ Voir le réveil</button></div>
    <div class="two">
      <div class="card"><h4>⭐ KO</h4><ul><li>Section I <b>Waken Guard</b> (zones actives) : les KO <b>★</b> redeviennent des gardes debout, puis les <b>★★</b> passent à <b>★</b>.</li><li>Soit environ <b>2 phases ennemies</b> de répit.</li><li>Les KO ne comptent pas dans le Guard Count (Radio-In en fait venir d'autres !).</li></ul></div>
      <div class="card"><h4>☠ Morts</h4><ul><li>Ne se relèvent jamais.</li><li>Section I <b>Lost Contact</b> : pour <b>chaque 3 jetons Mort</b> sur la carte, une carte Guard Order est brûlée (révélée et mise dessous) → le chrono accélère.</li><li>Ne comptent pas dans le Guard Count.</li></ul></div>
    </div>
    <div class="card warnc"><h4>👀 Les corps sont suspects</h4><p>Un garde qui voit un jeton KO ou Mort (lui-même ou via une caméra de sa zone) passe en <b>Investigation</b> et va dessus → Guard Reaction. Utilise <b>Drag Body</b> (1 action, 🔊) pour planquer les corps hors de vue.</p></div>`,
    mount(root) {
      const tl = root.querySelector('#koTl');
      const steps = [['Tour de Snake', '💂', 'Combo → garde KO'], ['', '★★', 'jeton KO posé'], ['Phase ennemie 1', '★', 'Waken : ★★ → ★'], ['Phase ennemie 2', '💂', 'Waken : ★ → debout !']];
      tl.innerHTML = steps.map((s, i) => `<div class="tlstep" data-i="${i}"><div class="tlh">${s[0]}</div><div class="tlt">${s[1]}</div><div class="tlc">${s[2]}</div></div>`).join('<div class="tlarr">➜</div>');
      async function go() { const st = tl.querySelectorAll('.tlstep'); st.forEach(s => s.classList.remove('on')); for (const s of st) { s.classList.add('on'); await sleep(900); } }
      root.querySelector('#koGo').onclick = go; go();
    } });

  /* 8. Phase ennemie */
  L.push({ id: 'enemy', icon: '🃏', title: 'Phase ennemie : la carte Guard Order', sub: 'Sections I · II · III',
    html: `
    <p class="lead">En infiltration, après les joueurs : on pioche <b>1 carte Guard Order</b> et on la lit de haut en bas. Si c'est la carte <b>Game Over</b> → mission ratée (temps écoulé).</p>
    <div class="gocard">
      <div class="goimg"><img src="guide/img/guard-order-card.jpg" alt="Carte Guard Order"><div class="gohl" id="goHl"></div></div>
      <div class="gotxt" id="goTxt"></div>
    </div>
    <div class="ctrls seg" id="goSeg"><button class="btn on" data-s="0">I · Action des gardes</button><button class="btn" data-s="1">II · Caméras</button><button class="btn" data-s="2">III · Activer les gardes</button></div>
    <div class="card"><h4>📚 Le paquet = le chrono</h4><p>Mise en place : mélange séparément les <b>7 rouges</b> et le nombre de <b>bleues</b> indiqué par le Stage, pose les bleues <b>sur</b> les rouges. Quand vous entamez les rouges, le temps presse. Chaque « révèle une carte et mets-la dessous » (Lost Contact, spawn impossible, Guard Reaction…) rapproche la fin.</p></div>`,
    mount(root) {
      const hl = root.querySelector('#goHl'), txt = root.querySelector('#goTxt');
      const SEC = [
        { box: [9, 18, 91, 42], h: 'I · Guard Action', d: `<p>Une des 4 actions (icône dans la section) :</p><ul>
          <li><b>✨ Waken Guard</b> (zones actives) : KO ★ → garde debout ; KO ★★ → ★.</li>
          <li><b>📻 Radio-In</b> (zones actives) : s'il y a moins de gardes que le <b>Guard Count</b> du Barracks, des renforts apparaissent sur l'icône radio.</li>
          <li><b>☠×3 Lost Contact</b> (toutes zones) : 1 carte brûlée par tranche de 3 jetons Mort.</li>
          <li><b>❓ Stay Alert</b> (zones actives) : joueur à ≤ 2 cases d'un garde (sans obstacle) → jeton ? sous lui (s'il n'est pas déjà sur la carte).</li></ul><p class="muted">Sur l'exemple : Lost Contact.</p>` },
        { box: [9, 44, 91, 67], h: 'II · Caméras', d: `<p>Si l'icône l'indique : <b>retourne le jeton Camera Facing</b> (vert ↔ orange). Toutes les caméras changent de direction en même temps (le cône de leur couleur visible). Puis vérifie la LOS de toutes les caméras.</p><p>Caméra qui voit un joueur → <b>Alerte</b>. Qui voit un KO/Mort/? → les gardes de la zone viennent enquêter.</p><p class="muted">Pas de caméra sur la carte ? Ignore cette section.</p>` },
        { box: [5, 68, 95, 94], h: 'III · Activer les gardes', d: `<p>Ordre : zone active la plus proche du jeton <b>Guard Priority</b> (coin haut-gauche), puis de <b>haut en bas, gauche à droite</b>.</p><p>Chaque garde détermine son <b>mode</b> au début de son activation :</p><ul><li><b class="alert">! ALERTE</b> → chiffre <b style="color:#ff5a5a">rouge</b> (ici 6)</li><li><b style="color:#4aa3ff">? INVESTIGATION</b> / ☠★ vus → chiffre <b style="color:#4aa3ff">bleu</b> (ici 5)</li><li><b>PATROUILLE</b> → chiffre bleu ; la flèche ↰ dit de quel côté tourner quand il hésite.</li></ul><p>👉 Détails dans la leçon suivante.</p>` },
      ];
      function show(i) { const s = SEC[i]; hl.style.cssText = `left:${s.box[0]}%;top:${s.box[1]}%;width:${s.box[2] - s.box[0]}%;height:${s.box[3] - s.box[1]}%`; txt.innerHTML = `<h4>${s.h}</h4>${s.d}`; root.querySelectorAll('#goSeg .btn').forEach(b => b.classList.toggle('on', +b.dataset.s === i)); }
      root.querySelector('#goSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.s); });
      show(0);
    } });

  /* 9. IA des gardes */
  L.push({ id: 'ai', icon: '🧠', title: 'Le cerveau des gardes', sub: 'Alerte · Investigation · Patrouille',
    html: `
    <p class="lead">Pour chaque garde activé, pose-toi ces questions <b>dans l'ordre</b> :</p>
    <div class="flow">
      <div class="fq">Y a-t-il un <span class="tai">!</span> dans <b>sa zone</b> ?</div>
      <div class="fr"><span class="yes">OUI →</span> <b class="alert">ALERTE</b> : va vers le ! le plus proche, jusqu'au <b style="color:#ff5a5a">chiffre rouge</b>.</div>
      <div class="fq">Sinon : est-il le garde le plus proche (ou à égalité) d'un <span class="tqi">?</span>, ou voit-il un ★/☠ (lui ou une caméra de sa zone) ?</div>
      <div class="fr"><span class="yes">OUI →</span> <b style="color:#4aa3ff">INVESTIGATION</b> : va vers ce jeton, jusqu'au <b style="color:#4aa3ff">chiffre bleu</b>.</div>
      <div class="fq">Sinon</div>
      <div class="fr"><span class="yes">→</span> <b>PATROUILLE</b> : tout droit devant lui, <b style="color:#4aa3ff">chiffre bleu</b> cases.</div>
    </div>
    <div class="ctrls seg" id="aiSeg"><button class="btn on" data-s="patrol">🚶 Patrouille</button><button class="btn" data-s="inv">❓ Investigation</button><button class="btn" data-s="alert">🚨 Alerte</button></div>
    <div class="stage" id="aiStage"></div>
    <div class="two">
      <div class="card"><h4>🛑 Il s'arrête dès que…</h4><ul><li>il <b>gagne la LOS</b> sur un joueur → jeton ! + il l'attaque (le joueur le plus proche) ;</li><li>il <b>entre sur une case avec un jeton</b> Attention/KO/Mort → carte <b>Guard Reaction</b> (attaque d'abord si les deux) ;</li><li>il ne peut plus avancer.</li></ul></div>
      <div class="card"><h4>🧭 Plus court chemin</h4><ul><li>Le moins de cases (sans traverser murs/portes verrouillées).</li><li>À égalité : le moins de virages. Encore égalité : vous choisissez.</li><li>Saute-mouton par-dessus des gardes = 1 case. Jamais par-dessus un joueur.</li><li>Il ne termine jamais face à un mur.</li></ul></div>
    </div>
    <div class="card"><h4>🚶 Détails de patrouille</h4><ul><li>Flèche de rotation au sol ↻ : il tourne, <b>même s'il lui reste du mouvement</b>, et continue.</li><li>Flèche ↻ « visible » en fin de mouvement : il cherche un nouveau chemin.</li><li>Bloqué (mur) : il tourne à gauche ou à droite vers un chemin libre ; si les deux sont possibles, il suit la <b>flèche bleue</b> de la carte (point de vue du garde).</li><li>Le mode est fixé au début de son activation (un garde en patrouille qui voit un corps continue sa ronde).</li></ul></div>`,
    mount(root) {
      const st = root.querySelector('#aiStage'); let cur = 'patrol', r;
      const wrap = document.createElement('div'); st.appendChild(wrap); const c = cap(st);
      const ctr = ctrl(st, `<button class="btn pri" data-a="play">▶ Lecture</button><button class="btn" data-a="next">⏭ Étape</button><button class="btn" data-a="reset">↺ Recommencer</button>`);
      ctr.addEventListener('click', e => { const a = e.target.dataset.a; if (a && r) r[a](); });
      let bd;
      const SC = {
        patrol: { build() { bd = board(wrap, 8, 5); [[3, 0], [3, 1], [6, 3], [6, 4]].forEach(p => bd.obstacle(...p)); bd.token('t1', 'turn', 4, 2); bd.piece('g', 'guard', 0, 2, 'right'); bd.piece('s', 'snake', 7, 4, 'up', 'S'); bd.obstacle(6, 2); },
          steps: [
            { t: 'Carte Guard Order : <b style="color:#4aa3ff">bleu 4</b>. Aucun ! ni ? → <b>Patrouille</b> : il avance tout droit.', f: async () => { await bd.move('g', 1, 2); } },
            { t: 'Case 2…', f: async () => { await bd.move('g', 2, 2); } },
            { t: 'Case 3…', f: async () => { await bd.move('g', 3, 2); } },
            { t: 'Case 4 : il arrive sur une <b>flèche de rotation</b> ↻ → il se tourne vers le bas (sens indiqué au sol).', f: async () => { await bd.move('g', 4, 2); await bd.turn('g', 'down'); } },
            { t: 'Mouvement épuisé (4/4). Snake, derrière l\'obstacle et hors de son regard, n\'est pas vu. 😮‍💨', f: async () => { bd.hl(7, 4, 'hl ok'); await sleep(200); } },
          ] },
        inv: { build() { bd = board(wrap, 8, 5); [[2, 1], [2, 2], [5, 0], [0, 2], [1, 2]].forEach(p => bd.obstacle(...p)); bd.piece('g1', 'guard', 0, 4, 'up'); bd.piece('g2', 'guard', 7, 2, 'left'); bd.token('q', '?', 4, 3); bd.piece('s', 'snake', 0, 0, 'up', 'S'); },
          steps: [
            { t: 'Plus tôt, Snake a raté un noise check en (4,3) puis s\'est caché en haut à gauche. Son jeton <b>?</b> reste là où le bruit a eu lieu.', f: async () => { bd.hl(4, 3, 'hl'); await sleep(300); } },
            { t: 'Pas de ! dans la zone. Garde de droite : 4 cases du ?. Garde du bas : 5 cases. Le plus proche → <b>Investigation</b> (bleu 4). L\'autre <b>patrouille</b>.', f: async () => { bd.bubble(7, 2, '4 cases', ''); bd.bubble(0, 4, '5 cases', ''); await sleep(800); } },
            { t: 'Ordre d\'activation : de haut en bas → le garde de droite joue d\'abord. Plus court chemin, le moins de virages : 3 à gauche…', f: async () => { bd.clearFx(); await bd.move('g2', 6, 2); await bd.move('g2', 5, 2); await bd.move('g2', 4, 2); } },
            { t: '… il se tourne vers la case suivante et entre sur le ? : il <b>s\'arrête</b> et pioche une carte <b>Guard Reaction</b>.', f: async () => { await bd.turn('g2', 'down'); await bd.move('g2', 4, 3); bd.bubble(4, 3, '🃏 Guard Reaction', 'red'); } },
            { t: 'Snake n\'a jamais été vu : les obstacles coupent toutes les « boîtes » de LOS. Le garde du bas, lui, fera sa patrouille normale.', f: async () => { bd.clearFx(); bd.hl(0, 0, 'hl ok'); await sleep(200); } },
          ] },
        alert: { build() { bd = board(wrap, 8, 5); [[3, 1], [3, 2], [5, 3]].forEach(p => bd.obstacle(...p)); bd.piece('g1', 'guard', 0, 0, 'down'); bd.piece('g2', 'guard', 7, 4, 'up'); bd.token('a', '!', 5, 1); bd.piece('s', 'snake', 6, 1, 'up', 'S'); },
          steps: [
            { t: 'Il y a un <b class="alert">!</b> dans la zone → <b>tous</b> les gardes sont en <b>Alerte</b> : chiffre <b style="color:#ff5a5a">rouge 6</b>, direction le ! le plus proche.', f: async () => { bd.hl(5, 1, 'hl warn'); await sleep(300); } },
            { t: 'Garde du haut (activé en premier) : il fonce par le plus court chemin (par le haut, l\'obstacle bloque le reste). Tant que l\'obstacle est dans la « boîte », il ne voit pas Snake…', f: async () => { await bd.turn('g1', 'right'); await bd.move('g1', 1, 0, 300); await bd.move('g1', 2, 0, 300); await bd.move('g1', 3, 0, 300); bd.boxFx(3, 0, 6, 1, false); await sleep(500); } },
            { t: '… case suivante : regard vers la droite + boîte vide → <b>LOS</b> ! Il s\'arrête et <b>attaque</b> (Snake lance 2 dés noirs contre sa Défense).', f: async () => { bd.clearFx(); await bd.move('g1', 4, 0); bd.boxFx(4, 0, 6, 1, true); bd.bubble(6, 1, '⚔️ 2 dés noirs', 'red'); await sleep(600); } },
            { t: 'Garde du bas : dès le début de son activation il regarde vers le haut et la boîte jusqu\'à Snake est vide → il a déjà la LOS.', f: async () => { bd.clearFx(); bd.boxFx(6, 1, 7, 4, true); await sleep(500); } },
            { t: 'Il attaque donc <b>sans bouger</b>. Deux attaques dans la même phase : l\'alerte, ça pique !', f: async () => { bd.bubble(7, 4, '⚔️', 'red'); await sleep(400); } },
          ] },
      };
      function load(k) { cur = k; wrap.innerHTML = ''; SC[k].build(); r = runner(SC[k].steps, c, () => { wrap.innerHTML = ''; SC[k].build(); }); r.reset(); root.querySelectorAll('#aiSeg .btn').forEach(b => b.classList.toggle('on', b.dataset.s === k)); }
      root.querySelector('#aiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(b.dataset.s); });
      load('patrol');
    } });

  /* 10. Éléments de carte */
  L.push({ id: 'map', icon: '🗺️', title: 'La carte : zones, caméras, portes…', sub: 'Tout ce qu\'il y a sur le plateau',
    html: `
    <div class="two">
      <div class="card"><h4>🟧 Zones</h4><p>Chaque zone est entourée d'orange dans le setup. Elevator Shaft, Elevator et Barracks font partie de la zone à laquelle ils sont reliés. Zone <b>active</b> = un joueur ou un jeton Attention de joueur dedans.</p></div>
      <div class="card"><h4>📻 Barracks & Guard Count</h4><p>Le chiffre <b>Guard Count</b> du Barracks = nombre de gardes qui doivent patrouiller la zone. Radio-In complète jusqu'à ce nombre (sur l'icône radio).</p></div>
      <div class="card"><h4>📹 Caméras</h4><p>Une seule direction à la fois : celle du cône de la couleur visible du jeton <b>Camera Facing</b> (orange/vert). Retourné par la section II. Ne voit pas sa propre case.</p></div>
      <div class="card"><h4>❓ Pièges (Trap)</h4><p>Face cachée, regardent dans toutes les directions. Tu entres dans leur LOS → on les retourne (ça peut être une caméra : oriente-la pour qu'aucun cône ne fasse face à un mur).</p></div>
      <div class="card"><h4>🔴 Détecteurs laser</h4><p>Entrer dans leur LOS → jeton <b>!</b> sous toi.</p></div>
      <div class="card"><h4>🔒 Portes & objets verrouillés</h4><p>Niveaux 2 à 5. Action <b>Interact</b> : lance les dés de ton dashboard (Snake : 1 blanc + 2 noirs). Réutilise Interact pour relancer autant de dés que tu veux. Il faut obtenir la combinaison <b>dans le même tour</b> sans t'éloigner, sinon tout est perdu. Un coéquipier à ≤ 2 cases peut aider avec ses Focus.</p></div>
      <div class="card"><h4>🛗 Ascenseurs</h4><p>Interact dans l'ascenseur : il part (avec toutes les figurines dedans) vers un autre Elevator Shaft. Interact sur un Shaft : tu l'appelles.</p></div>
      <div class="card"><h4>🅰️ Events & 🚪 Exits</h4><p>Event : dès qu'une figurine entre dessus, lis la section correspondante du Stage (même au milieu d'un Dash, puis tu continues). Exit : <b>finir ton tour</b> dessus.</p></div>
      <div class="card"><h4>💻 Terminaux</h4><p>Seul Otacon peut les pirater (combinaison de dés, voir sa fiche). Ils donnent accès aux cartes System.</p></div>
      <div class="card"><h4>🟨 Lignes jaunes pointillées</h4><p>Mobilier / tripwires (Stages 4, 8…) : infranchissables mais ne bloquent pas la LOS — on peut tirer à travers.</p></div>
    </div>
    <div class="imgrow"><figure><img src="guide/img/camera-trap-laser.jpg"><figcaption>Caméras, pièges et lasers (livret p.10).</figcaption></figure><figure><img src="guide/img/los-move.jpg"><figcaption>Traverser la LOS d'un garde pendant un déplacement → ! à l'arrivée.</figcaption></figure></div>`,
    mount() {} });

  /* 11. Boss */
  L.push({ id: 'boss', icon: '👾', title: 'Les combats de Boss', sub: 'Deck Boss, menace, réactions',
    html: `
    <p class="lead">Pas de gardes, pas de Guard Order : un boss, son <b>dashboard</b>, son <b>deck Boss</b> et parfois une piste de <b>Menace</b>.</p>
    <ol class="big">
      <li><b>Setup</b> : pose la carte <b>Boss Stage Reference</b> (ou la carte Special Action du Stage : grenades, SAM, Sniper Rifle, Stinger…) sur la zone surlignée de chaque dashboard joueur. Elle cache les actions inutiles en boss.</li>
      <li><b>Santé du boss</b> = selon le nombre de joueurs (sur le Stage / dashboard). Défense sur le dashboard.</li>
      <li><b>Tour des joueurs</b> normal : bouger, tirer (LOS), focus…</li>
      <li><b>Tour du boss</b> : retourne la carte du dessus du deck Boss, résous-la (déplacement, attaque…), remets-la <b>sous le deck</b>. Le deck n'est <b>jamais</b> mélangé en cours de partie → tu peux anticiper le cycle !</li>
      <li>Attaque du boss sans nombre de dés précisé → utilise le stat <b>Attaque</b> de son dashboard. C'est toi qui lances, contre ta Défense.</li>
    </ol>
    <div class="card warnc"><h4>⚡ Réactions</h4><p>Les capacités « réaction » d'un boss se déclenchent <b>à chaque fois</b> que leur condition est remplie, immédiatement, même pendant ton tour (FAQ).</p></div>
    <div class="card"><h4>💡 Réflexes</h4><ul><li>Lis tout le dashboard du boss au setup : ses capacités spéciales font la mission.</li><li>Les dégâts KO comptent comme des dégâts normaux sur un boss.</li><li>Otacon en boss : il est sur sa tuile Terminal, avec le deck System du boss (pas besoin de hacker).</li></ul></div>`,
    mount() {} });

  /* 12. Équipement */
  L.push({ id: 'equip', icon: '🎒', title: 'Équipement & Memory Box', sub: 'Limite, munitions, déblocages',
    html: `
    <ul class="big">
      <li><b>Limite d'équipement</b> : sur le dashboard (Snake : 3). Au setup, choisissez ensemble qui prend quoi dans la Memory Box ; les équipements de départ peuvent être remplacés.</li>
      <li>Carte avec la photo d'un personnage = réservée à lui.</li>
      <li><b>Munitions / charges</b> : icône en haut à droite → pose autant de jetons dessus. Jamais plus que la valeur imprimée. Pas d'icône = illimité (SOCOM).</li>
      <li>Équipement à usage unique : défaussé après usage. Les jetons Action posés dessus retournent sur ton dashboard (pas réutilisables ce tour).</li>
      <li>Équipement consommé : perdu <b>pour ce Stage seulement</b>.</li>
      <li><b>Stage réussi</b> → section « Stage Cleared » : débloque des cartes (cherche le numéro au dos sans regarder les faces). Range-les dans la <b>Memory Box</b> en fin de session.</li>
      <li>Les missions VR débloquent aussi de l'équipement.</li>
    </ul>
    <p>👉 L'onglet <b>Missions</b> te permet de cocher les cartes débloquées.</p>`,
    mount() {} });

  window.MGS_LESSONS = L;
  window.MGS_board = board; window.MGS_los = los;
})();
