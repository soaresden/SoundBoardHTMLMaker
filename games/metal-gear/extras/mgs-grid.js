/* MGS Board Game — moteur de quadrillage : déplacements, ligne de vue (LOS), plus court chemin,
   IA des gardes (Alerte / Investigation / Patrouille) d'après le Rulebook + FAQ v1.2.
   Pur calcul, sans interface : MGSGrid.build(def) puis fonctions (W = monde statique, S = état dynamique).

   Définition d'un plan (guide/grids.js) :
     parts : [{ x0,y0,cw,ch (pixels dans l'image), cols, rows, gx,gy (décalage dans la grille globale), zone,
               map:["....##..", ...], walls:[[x,y,"r"|"d"]], turns:{"x,y":"up"}, spirals:["x,y"] }]
     codes : "." sol · "#" obstacle (bloque déplacement + LOS) · " " hors plateau · "~" eau (sol)
             "L" cage d'ascenseur (praticable seulement si l'ascenseur est là)
   État S : { elev:bool, doors:{ "x,y":true (fermée) }, figs:[{id,kind:"player"|"guard"|"boss",x,y,f,name}],
              cams:[{id,x,y,faces:{vert:"down",orange:"right"}}], camColor:"vert",
              tokens:[{id,kind:"?"|"!"|"ko2"|"ko1"|"dead",owner,x,y}] } */
(function () {
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ORDER = ['up', 'right', 'down', 'left'];
  const K = (x, y) => x + ',' + y;
  const turnL = f => ORDER[(ORDER.indexOf(f) + 3) % 4];
  const turnR = f => ORDER[(ORDER.indexOf(f) + 1) % 4];
  const dirOf = (a, b) => b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up';

  /* ---------- construction du monde ---------- */
  function build(def) {
    const W = { def, cells: {}, walls: new Set(), turns: {}, spirals: new Set(), zones: {}, shaftOf: {}, shafts: {}, noFire: new Set(), cols: 0, rows: 0, parts: def.parts };
    def.parts.forEach((p, pi) => {
      const gx = p.gx || 0, gy = p.gy || 0, zone = p.zone != null ? p.zone : pi;
      W.cols = Math.max(W.cols, gx + p.cols); W.rows = Math.max(W.rows, gy + p.rows);
      for (let y = 0; y < p.rows; y++) for (let x = 0; x < p.cols; x++) {
        const c = (p.map[y] || '')[x] || ' ';
        if (c !== ' ') {
          const k = K(gx + x, gy + y);
          W.cells[k] = c; W.zones[k] = (p.zoneMap && p.zoneMap[y] && p.zoneMap[y][x] !== ' ') ? p.zoneMap[y][x] : zone;
          if (c === 'L') { const sid = p.shaft || 'main'; W.shaftOf[k] = sid; (W.shafts[sid] = W.shafts[sid] || []).push(k); }
          if (p.noFire) W.noFire.add(k);
        }
      }
      (p.walls || []).forEach(([x, y, s]) => W.walls.add(s === 'r' ? `${gx + x},${gy + y}|${gx + x + 1},${gy + y}` : `${gx + x},${gy + y}|${gx + x},${gy + y + 1}`));
      Object.entries(p.turns || {}).forEach(([k, f]) => { const [x, y] = k.split(',').map(Number); W.turns[K(gx + x, gy + y)] = f; });
      (p.spirals || []).forEach(k => { const [x, y] = k.split(',').map(Number); W.spirals.add(K(gx + x, gy + y)); });
    });
    Object.values(W.shafts).forEach(a => a.sort((p, q) => { const [px, py] = p.split(',').map(Number), [qx, qy] = q.split(',').map(Number); return py - qy || px - qx; }));
    return W;
  }
  // centre d'une case globale en pixels (pour l'affichage)
  function pix(W, x, y) {
    for (const p of W.parts) {
      const gx = p.gx || 0, gy = p.gy || 0;
      if (x >= gx && y >= gy && x < gx + p.cols && y < gy + p.rows) return { cx: p.x0 + (x - gx + 0.5) * p.cw, cy: p.y0 + (y - gy + 0.5) * p.ch, cw: p.cw, ch: p.ch, x: p.x0 + (x - gx) * p.cw, y: p.y0 + (y - gy) * p.ch };
    }
    return null;
  }
  const code = (W, x, y) => W.cells[K(x, y)] || ' ';
  const zoneOf = (W, x, y) => W.zones[K(x, y)];
  function wallBetween(W, a, b) {
    const k1 = `${a.x},${a.y}|${b.x},${b.y}`, k2 = `${b.x},${b.y}|${a.x},${a.y}`;
    return W.walls.has(k1) || W.walls.has(k2);
  }
  function walkable(W, S, x, y) {
    const c = code(W, x, y);
    if (c === ' ' || c === '#') return false;
    if (c === 'L' && !(S.elev === true || S.elev === W.shaftOf[K(x, y)])) return false;
    if (S.doors && S.doors[K(x, y)]) return false;
    return true;
  }
  function blocksLOS(W, S, x, y) {
    const c = code(W, x, y);
    return c === ' ' || c === '#' || !!(S.doors && S.doors[K(x, y)]);
  }
  const figAt = (S, x, y) => S.figs.find(f => f.x === x && f.y === y && f.kind !== 'gone');
  const tokensAt = (S, x, y) => S.tokens.filter(t => t.x === x && t.y === y);

  /* ---------- ligne de vue (Rulebook p.9) ---------- */
  function los(W, S, from, to, facing) {
    if (from.x === to.x && from.y === to.y) return { ok: false, same: true };
    const res = { facing: true, box: true };
    if (facing) res.facing = (facing === 'right' && to.x > from.x) || (facing === 'left' && to.x < from.x) || (facing === 'down' && to.y > from.y) || (facing === 'up' && to.y < from.y);
    const x0 = Math.min(from.x, to.x), x1 = Math.max(from.x, to.x), y0 = Math.min(from.y, to.y), y1 = Math.max(from.y, to.y);
    res.rect = [x0, y0, x1, y1];
    for (let y = y0; y <= y1 && res.box; y++) for (let x = x0; x <= x1; x++) {
      if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) continue;
      if (blocksLOS(W, S, x, y)) { res.box = false; break; }
    }
    for (let y = y0; y <= y1 && res.box; y++) for (let x = x0; x <= x1; x++) {
      if (x < x1 && wallBetween(W, { x, y }, { x: x + 1, y })) { res.box = false; break; }
      if (y < y1 && wallBetween(W, { x, y }, { x, y: y + 1 })) { res.box = false; break; }
    }
    res.ok = res.facing && res.box;
    return res;
  }
  const camFacing = (S, c) => (c.faces || {})[S.camColor || 'vert'] || c.f;
  // qui voit ce joueur ? (gardes debout + boss + caméras)
  function watchers(W, S, target) {
    const out = [];
    S.figs.forEach(g => { if ((g.kind === 'guard' || g.kind === 'boss') && los(W, S, g, target, g.f).ok) out.push(g); });
    (S.cams || []).forEach(c => { if (!(c.x === target.x && c.y === target.y) && los(W, S, c, target, camFacing(S, c)).ok) out.push(Object.assign({ cam: true }, c)); });
    return out;
  }

  /* ---------- déplacement (avec saut par-dessus les figurines) ---------- */
  // pas depuis c dans la direction d : renvoie {x,y,leap:[ids]} ou null
  function stepFrom(W, S, c, d, mover) {
    const [dx, dy] = DIRS[d];
    let x = c.x + dx, y = c.y + dy, prev = { x: c.x, y: c.y }; const leap = [];
    for (;;) {
      if (!walkable(W, S, x, y) || wallBetween(W, prev, { x, y })) return null;
      const f = figAt(S, x, y);
      if (!f || f.id === mover.id) return { x, y, leap };
      const canJump = mover.kind === 'player' ? true : f.kind === 'guard' || (f.kind === 'player' && f.disguised);
      if (!canJump) return null;
      leap.push(f.id); prev = { x, y }; x += dx; y += dy;
    }
  }
  // toutes les cases atteignables en <= n pas (pour Sneak / Dash)
  function reach(W, S, mover, n) {
    const out = {}; const q = [{ x: mover.x, y: mover.y, steps: 0, path: [] }]; out[K(mover.x, mover.y)] = { steps: 0, path: [] };
    while (q.length) {
      const c = q.shift(); if (c.steps >= n) continue;
      for (const d of ORDER) {
        const s = stepFrom(W, S, c, d, mover); if (!s) continue;
        const k = K(s.x, s.y);
        if (out[k]) continue;
        const path = c.path.concat([{ x: s.x, y: s.y, leap: s.leap }]);
        out[k] = { steps: c.steps + 1, path }; q.push({ x: s.x, y: s.y, steps: c.steps + 1, path });
      }
    }
    delete out[K(mover.x, mover.y)];
    return out;
  }
  // plus court chemin (moins de cases, puis moins de virages) vers une des cases cibles
  function shortest(W, S, mover, targets, opts = {}) {
    const tset = new Set(targets.map(t => K(t.x, t.y)));
    const start = { x: mover.x, y: mover.y, d: mover.f || 'up' };
    const best = {}; const pq = [{ x: start.x, y: start.y, d: start.d, steps: 0, turns: 0, path: [] }];
    const key = s => s.x + ',' + s.y + ',' + s.d;
    best[key(pq[0])] = [0, 0];
    while (pq.length) {
      pq.sort((a, b) => a.steps - b.steps || a.turns - b.turns);
      const c = pq.shift();
      if (tset.has(K(c.x, c.y)) && c.path.length) return { path: c.path, steps: c.steps, turns: c.turns, target: { x: c.x, y: c.y } };
      if (c.steps > 60) break;
      for (const d of ORDER) {
        let s;
        const [dx, dy] = DIRS[d]; const nx = c.x + dx, ny = c.y + dy;
        if (opts.ignoreFigs) { if (!walkable(W, S, nx, ny) || wallBetween(W, c, { x: nx, y: ny })) continue; s = { x: nx, y: ny, leap: [] }; }
        else {
          // la case cible peut être occupée par un joueur (jeton sous sa figurine) : on la compte pour la distance
          if (tset.has(K(nx, ny)) && walkable(W, S, nx, ny) && !wallBetween(W, c, { x: nx, y: ny })) s = { x: nx, y: ny, leap: [], blockedEnd: !!figAt(S, nx, ny) && figAt(S, nx, ny).id !== mover.id };
          else s = stepFrom(W, S, c, d, mover);
          if (!s) continue;
        }
        const n = { x: s.x, y: s.y, d, steps: c.steps + 1, turns: c.turns + (d !== c.d ? 1 : 0), path: c.path.concat([{ x: s.x, y: s.y, leap: s.leap, d, blockedEnd: s.blockedEnd }]) };
        const b = best[key(n)];
        if (b && (b[0] < n.steps || (b[0] === n.steps && b[1] <= n.turns))) continue;
        best[key(n)] = [n.steps, n.turns]; pq.push(n);
      }
    }
    return null;
  }
  const pathLen = (W, S, from, to, mover) => { const r = shortest(W, S, Object.assign({}, mover, { x: from.x, y: from.y }), [to]); return r ? r.steps : Infinity; };

  /* ---------- zones ---------- */
  function activeZones(W, S) {
    const z = new Set();
    S.figs.forEach(f => { if (f.kind === 'player') z.add(zoneOf(W, f.x, f.y)); });
    S.tokens.forEach(t => { if ((t.kind === '?' || t.kind === '!') && t.owner) z.add(zoneOf(W, t.x, t.y)); });
    return z;
  }
  function activationOrder(W, S) {
    const az = activeZones(W, S);
    const guards = S.figs.filter(f => f.kind === 'guard' && az.has(zoneOf(W, f.x, f.y)));
    // zone la plus proche du jeton Guard Priority (coin haut-gauche), puis haut→bas, gauche→droite
    const zoneKey = z => { let best = 1e9; Object.keys(W.zones).forEach(k => { if (W.zones[k] === z) { const [x, y] = k.split(',').map(Number); best = Math.min(best, y * 1000 + x); } }); return best; };
    return guards.sort((a, b) => zoneKey(zoneOf(W, a.x, a.y)) - zoneKey(zoneOf(W, b.x, b.y)) || a.y - b.y || a.x - b.x).map(g => g.id);
  }

  /* ---------- IA d'un garde (une activation) ---------- */
  // card : { red, blue, arrow:"left"|"right" }  → renvoie { mode, steps:[...], end } sans modifier S
  function activate(W, S0, gid, card) {
    const S = JSON.parse(JSON.stringify(S0));
    const g = S.figs.find(f => f.id === gid);
    const zone = zoneOf(W, g.x, g.y);
    const log = []; const players = S.figs.filter(f => f.kind === 'player');
    const inZone = t => zoneOf(W, t.x, t.y) === zone;
    const alerts = S.tokens.filter(t => t.kind === '!' && inZone(t));
    const quests = S.tokens.filter(t => t.kind === '?' && inZone(t));
    const bodies = S.tokens.filter(t => (t.kind === 'ko2' || t.kind === 'ko1' || t.kind === 'dead') && inZone(t));
    const guardsZ = S.figs.filter(f => f.kind === 'guard' && inZone(f));
    let mode = 'patrol', target = null, max = card.blue;

    if (alerts.length) {
      mode = 'alert'; max = card.red;
      let bestL = Infinity; alerts.forEach(t => { const l = pathLen(W, S, g, t, g); if (l < bestL) { bestL = l; target = t; } });
    } else {
      // le plus proche (ou à égalité) d'un « ? »
      let bestQ = null, bestL = Infinity;
      quests.forEach(t => {
        const mine = pathLen(W, S, g, t, g);
        const minAll = Math.min(...guardsZ.map(o => pathLen(W, S, o, t, o)));
        if (mine <= minAll && mine < bestL) { bestL = mine; bestQ = t; }
      });
      if (bestQ) { mode = 'investigate'; target = bestQ; }
      else {
        const seen = bodies.filter(t => los(W, S, g, t, g.f).ok || (S.cams || []).some(c => inZone(c) && los(W, S, c, t, camFacing(S, c)).ok));
        if (seen.length) { mode = 'investigate'; let bl = Infinity; seen.forEach(t => { const l = pathLen(W, S, g, t, g); if (l < bl) { bl = l; target = t; } }); }
      }
    }
    const steps = [];
    const seePlayer = () => {
      const vis = players.filter(p => los(W, S, g, p, g.f).ok);
      if (!vis.length) return null;
      vis.sort((a, b) => pathLen(W, S, g, a, g) - pathLen(W, S, g, b, g));
      return vis[0];
    };
    const tokenHere = () => tokensAt(S, g.x, g.y).filter(t => ['?', '!', 'ko2', 'ko1', 'dead'].includes(t.kind));
    const findNewPath = (arrow) => {
      const ok = d => !!stepFrom(W, S, g, d, g);
      const L = turnL(g.f), R = turnR(g.f);
      if (ok(L) && ok(R)) return arrow === 'left' ? L : R;
      if (ok(L)) return L; if (ok(R)) return R;
      let f = g.f; for (let i = 0; i < 4; i++) { f = arrow === 'left' ? turnL(f) : turnR(f); if (ok(f)) return f; }
      return null;
    };
    const endCheck = () => {   // après un mouvement ou une rotation : LOS puis jetons
      const p = seePlayer(); if (p) { steps.push({ t: 'see', player: p.name, pid: p.id }); return 'stop'; }
      const tk = tokenHere(); if (tk.length) { steps.push({ t: 'reaction', tokens: tk.map(t => ({ id: t.id, kind: t.kind, owner: t.owner })) }); return 'stop'; }
      return null;
    };
    const faceObstacleFix = () => { if (!stepFrom(W, S, g, g.f, g)) { const nf = findNewPath(card.arrow); if (nf && nf !== g.f) { g.f = nf; steps.push({ t: 'turn', f: nf }); } } };

    // déjà en vue au début ?
    const p0 = seePlayer();
    if (p0) { steps.push({ t: 'see', player: p0.name, pid: p0.id }); return { mode, max, steps, g: { x: g.x, y: g.y, f: g.f } }; }

    if (mode !== 'patrol' && target) {
      const sp = shortest(W, S, g, [target]);
      if (sp) {
        let moved = 0;
        for (const node of sp.path) {
          if (moved >= max) break;
          if (node.blockedEnd || (figAt(S, node.x, node.y) && figAt(S, node.x, node.y).id !== g.id)) break;
          g.f = node.d; g.x = node.x; g.y = node.y; moved++;
          steps.push({ t: 'move', x: g.x, y: g.y, f: g.f, leap: node.leap });
          if (endCheck()) return { mode, max, target, steps, g: { x: g.x, y: g.y, f: g.f } };
        }
        const rest = sp.path[moved];
        if (rest) { g.f = rest.d; steps.push({ t: 'turn', f: g.f }); if (endCheck()) return { mode, max, target, steps, g: { x: g.x, y: g.y, f: g.f } }; }
        else faceObstacleFix();
      }
      return { mode, max, target, steps, g: { x: g.x, y: g.y, f: g.f } };
    }

    // PATROUILLE
    let moved = 0, idle = 0;
    while (moved < max && idle < 4) {
      const s = stepFrom(W, S, g, g.f, g);
      if (!s) {
        const nf = findNewPath(card.arrow); idle++;
        if (!nf) break;
        g.f = nf; steps.push({ t: 'turn', f: nf });
        if (endCheck()) return { mode, max, steps, g: { x: g.x, y: g.y, f: g.f } };
        continue;
      }
      idle = 0; g.x = s.x; g.y = s.y; moved++;
      steps.push({ t: 'move', x: g.x, y: g.y, f: g.f, leap: s.leap });
      if (endCheck()) return { mode, max, steps, g: { x: g.x, y: g.y, f: g.f } };
      const tf = W.turns[K(g.x, g.y)];
      if (tf && !(S.doors && S.doors[K(g.x, g.y)])) { if (tf !== g.f) { g.f = tf; steps.push({ t: 'turn', f: tf, icon: true }); if (endCheck()) return { mode, max, steps, g: { x: g.x, y: g.y, f: g.f } }; } }
    }
    if (moved >= max && W.spirals.has(K(g.x, g.y))) {
      const nf = findNewPath(card.arrow); if (nf && nf !== g.f) { g.f = nf; steps.push({ t: 'turn', f: nf, spiral: true }); endCheck(); }
    } else faceObstacleFix();
    return { mode, max, steps, g: { x: g.x, y: g.y, f: g.f } };
  }

  // joueurs à <= 2 cases d'un garde, sans obstacle (Stay Alert)
  function stayAlert(W, S) {
    const out = [];
    S.figs.filter(f => f.kind === 'player').forEach(p => {
      if (S.figs.some(g => g.kind === 'guard' && pathLen(W, S, g, p, Object.assign({}, g, { kind: 'player' })) <= 2)) out.push(p.name);
    });
    return out;
  }
  const guardInZone = (W, S, p) => S.figs.some(g => g.kind === 'guard' && zoneOf(W, g.x, g.y) === zoneOf(W, p.x, p.y));
  // garde « de dos » adjacent (Élimination silencieuse)
  function behindTargets(W, S, p) {
    return S.figs.filter(g => g.kind === 'guard' && Math.abs(g.x - p.x) + Math.abs(g.y - p.y) === 1 && !wallBetween(W, g, p) && (() => { const [dx, dy] = DIRS[g.f]; return p.x === g.x - dx && p.y === g.y - dy; })());
  }
  const adjacentTargets = (W, S, p) => S.figs.filter(g => (g.kind === 'guard' || g.kind === 'boss') && Math.abs(g.x - p.x) + Math.abs(g.y - p.y) === 1 && !wallBetween(W, g, p));
  const losTargets = (W, S, p) => S.figs.filter(g => (g.kind === 'guard' || g.kind === 'boss') && los(W, S, p, g).ok);

  // ascenseur : déplace l'ascenseur (et ce qui est dedans) vers la cage `to` ; renvoie la correspondance des cases
  function elevatorMap(W, from, to) {
    const a = W.shafts[from] || [], b = W.shafts[to] || [], m = {};
    a.forEach((k, i) => { if (b[i]) m[k] = b[i]; });
    return m;
  }
  const shaftAdjacent = (W, x, y) => { const out = new Set(); ORDER.forEach(d => { const [dx, dy] = DIRS[d]; const k = K(x + dx, y + dy); if (W.shaftOf[k] && !wallBetween(W, { x, y }, { x: x + dx, y: y + dy })) out.add(W.shaftOf[k]); }); return [...out]; };
  window.MGSGrid = { elevatorMap, shaftAdjacent, build, pix, code, zoneOf, walkable, los, watchers, stepFrom, reach, shortest, activate, activationOrder, activeZones, stayAlert, guardInZone, behindTargets, adjacentTargets, losTargets, camFacing, dirOf, DIRS, ORDER, K };
})();
