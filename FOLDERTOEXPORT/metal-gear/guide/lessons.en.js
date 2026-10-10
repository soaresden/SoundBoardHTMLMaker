/* English (original version) texts — overlays the French fields when MGS_LANG === 'en'.
   Each lesson (matched by id) gets its English title / sub / html; lessons whose animation shows text
   also get an English mount() (same logic as lessons.js). Other mount() functions are kept from lessons.js. */
(function () {
  if (window.MGS_LANG !== 'en' || !window.MGS_LESSONS) return;
  const board = window.MGS_board, los = window.MGS_los;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Small components (English copies of the lessons.js helpers) */
  function ctrl(root, html) { const d = document.createElement('div'); d.className = 'ctrls'; d.innerHTML = html; root.appendChild(d); return d; }
  function cap(root) { const d = document.createElement('div'); d.className = 'caption'; root.appendChild(d); return d; }
  function runner(steps, capEl, onReset) {
    let i = 0, busy = false, auto = false;
    const api = {
      async next() { if (busy || i >= steps.length) return false; busy = true; const s = steps[i++]; capEl.innerHTML = `<span class="stepn">${i}/${steps.length}</span> ${s.t}`; await s.f(); busy = false; return true; },
      async play() { if (auto) return; auto = true; while (auto && await api.next()) await sleep(1100); auto = false; },
      reset() { auto = false; i = 0; onReset(); capEl.innerHTML = '<span class="muted">Press ▶ Play or ⏭ Step.</span>'; },
    };
    return api;
  }
  const CTRL_HTML = `<button class="btn pri" data-a="play">▶ Play</button><button class="btn" data-a="next">⏭ Step</button><button class="btn" data-a="reset">↺ Restart</button>`;
  function playerCtrls(root, r) {
    const c = ctrl(root, CTRL_HTML);
    c.addEventListener('click', e => { const a = e.target.dataset.a; if (a) r[a](); });
  }

  const EN = {};

  /* 1. Goal of the game */
  EN.but = { title: 'The goal of the game', sub: 'Stages, campaign, failure',
    html: `
    <p class="lead">You are the elite FOXHOUND team. Each <b>Stage</b> (mission) is played in one session, <b>cooperatively</b> against the game.</p>
    <div class="two">
      <div class="card sneakc"><h4>🕵️ Sneaking Stage</h4><p>Complete the objectives <b>without being seen</b>. Guards are driven by the <b>Guard Order</b> cards. The deck is also your <b>timer</b>: if the <b>Game Over</b> card comes up → failure.</p></div>
      <div class="card bossc"><h4>👾 Boss Stage</h4><p>A fight against an iconic boss (Ocelot, Ninja, Mantis, Wolf, Raven, REX…). The boss plays using <b>its Boss deck</b>. No guards.</p></div>
    </div>
    <h4>A round is always the same loop</h4>
    <div class="loop" id="loopDemo">
      <div class="lnode" data-i="0"><b>1</b> Start of the round<small>everyone takes back their 4 Action tokens</small></div>
      <div class="lnode" data-i="1"><b>2</b> Player Phase<small>one at a time, 4 actions max</small></div>
      <div class="lnode" data-i="2"><b>3</b> Enemy Phase<small>guards (Guard Order card) or Boss (Boss card)</small></div>
      <div class="ldot"></div>
    </div>
    <div class="card warnc"><h4>💀 You lose if…</h4><ul><li>a player is <b>KIA</b> (their damage reaches their health);</li><li>the <b>Game Over</b> card is revealed (Sneaking);</li><li>a Stage-specific failure condition occurs.</li></ul><p class="muted">… even if it happens during the action that completed the last objective!</p></div>
    <div class="card"><h4>📦 The campaign</h4><p>14 Shadow Moses Stages in order (recommended). Clearing a Stage unlocks <b>Equipment</b> cards stored in the <b>Memory Box</b>: usable in every following Stage (and in VR missions). <b>VR</b> missions are played separately, at any time, 1 to 4 players, any characters.</p><p>The <b>Codec</b>: whenever you see a Codec number on a component, look it up in the Codec Book (info, secrets…).</p></div>
    <p class="muted">Booklet tip: play Stages 1 and 2 (tutorials, Snake alone — several players can control him together) before reading the rest.</p>` };

  /* 2. Your turn */
  EN.tour = { title: 'Your turn: 4 actions', sub: 'Action tokens, noise, Noise check',
    html: `
    <p class="lead">On your turn you have <b>4 Action tokens</b>. You place them on the actions of your dashboard (or of your Equipment cards). Same action several times = OK, paying each time. You don't have to spend them all.</p>
    <p>👉 Try it: tap actions to spend your tokens. <b class="noisy">🔊 Noisy</b> actions will make you roll white dice at the end of the turn.</p>
    <div class="sim">
      <div class="tokens" id="tokTray"></div>
      <div class="actgrid" id="actGrid"></div>
      <div class="simlog" id="simLog"></div>
      <div class="ctrls"><button class="btn pri" id="endTurn">🏁 End turn</button><button class="btn" id="resetTurn">↺ New turn</button></div>
    </div>
    <div class="card"><h4>🔊 Noise check (end of your turn)</h4><p>If there's <b>at least one guard in your zone</b>: roll <b>1 white die per token</b> placed on a Noisy action. A single <b class="alert">!</b> → you <b>draw attention</b> to your space (<span class="tqi">?</span> token). No guard in the zone = no Noise check.</p></div>
    <div class="card"><h4>🔫 LOUD actions</h4><p>Firearms, grenades, missiles… are <b>LOUD</b>: after the action, your token goes straight to <span class="tai">!</span> (Alert) under your figure.</p></div>
    <div class="imgfig"><img src="guide/img/snake-dashboard.jpg" alt="Snake's dashboard"><p>Snake's dashboard: actions with their cost (red circle), stats at the bottom left <b>Equipment 3 · Defense 3 · Health 4</b>, and his 4 Focus tokens.</p></div>`,
    mount(root) {
      const tray = root.querySelector('#tokTray'), grid = root.querySelector('#actGrid'), log = root.querySelector('#simLog');
      let left = 4, noisy = 0, used = [];
      const acts = window.MGS_ACTIONS.filter(a => a.cost !== 'X');
      function draw() {
        tray.innerHTML = Array.from({ length: 4 }, (_, i) => `<span class="atok ${i < left ? '' : 'spent'}">${i < left ? '◉' : '○'}</span>`).join('') + `<span class="muted"> ${left} token(s) left</span>`;
        grid.innerHTML = acts.map(a => `<button class="actb ${a.noisy ? 'n' : ''}" data-id="${a.id}" ${a.cost > left ? 'disabled' : ''}><span class="ai">${a.icon}</span><span class="an">${a.name}<small>${a.fr}</small></span><span class="ac">${a.cost}${a.noisy ? ' 🔊' : ''}</span></button>`).join('');
        log.innerHTML = used.length ? used.map(u => `<span class="chip">${u}</span>`).join(' ') : '<span class="muted">No actions yet.</span>';
      }
      grid.addEventListener('click', e => { const b = e.target.closest('.actb'); if (!b) return; const a = acts.find(x => x.id === b.dataset.id); if (a.cost > left) return; left -= a.cost; if (a.noisy) noisy += a.cost; used.push(`${a.icon} ${a.name}`); draw(); log.insertAdjacentHTML('beforeend', `<div class="tip">${a.desc}</div>`); });
      root.querySelector('#endTurn').onclick = () => { draw(); log.insertAdjacentHTML('beforeend', noisy ? `<div class="tip warn">🔊 End of turn: is a guard in your zone? Roll <b>${noisy} white die/dice</b>. A <b>!</b> = ? token on your space.</div>` : `<div class="tip ok">🤫 No Noisy action: no Noise check.</div>`); };
      root.querySelector('#resetTurn').onclick = () => { left = 4; noisy = 0; used = []; draw(); };
      draw();
    } };

  /* 3. Movement */
  EN.move = { title: 'Moving & Leapfrog', sub: 'Orthogonal, Dash, Leapfrog',
    html: `
    <p class="lead">You move <b>orthogonally</b> (never diagonally), never through a wall or a locked door. Two figures never share a space: you <b>jump over</b> them (Leapfrog). Jumping over several figures in a line = <b>just 1 space</b> of movement.</p>
    <div class="stage" id="mvStage"></div>
    <div class="card warnc"><h4>⚠️ Leapfrogging over a guard</h4><p>Allowed, but <b>each guard you jump over attacks you</b> (even without LOS) and you place your <span class="tai">!</span> token under you at the end of the move. The guard doesn't turn around.</p></div>
    <p class="muted">Guards can leapfrog over other guards but <b>never</b> over a player.</p>`,
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
        { t: '<b>Sneak</b> (1 action): Snake moves 1 space.', f: async () => { bd.hl(1, 1); await bd.move('s', 1, 1); } },
        { t: '<b>Dash</b> (1 action, 🔊 Noisy): 2 spaces at once.', f: async () => { bd.clearFx(); bd.hl(2, 1); bd.hl(3, 1); await bd.move('s', 2, 1, 300); await bd.move('s', 3, 1); } },
        { t: 'A guard blocks the corridor. <b>Sneak</b> toward him = Leapfrog: Snake lands behind him (it counts as 1 space)…', f: async () => { bd.clearFx(); bd.hl(5, 1, 'hl warn'); await bd.move('s', 5, 1, 700); } },
        { t: '… but the guard he jumped over <b>attacks him</b>: Snake rolls 2 black dice against his Defense 3.', f: async () => { bd.bubble(4, 1, '⚔️ attack!', 'red'); await sleep(900); } },
        { t: 'And Snake places his <b class="alert">! Alert</b> token under him. Every guard in the zone will come running…', f: async () => { bd.clearFx(); bd.token('a', '!', 5, 1); bd.remove('s'); bd.piece('s', 'snake', 5, 1, 'right', 'S'); await sleep(400); } },
      ], c, build);
      playerCtrls(st, r); r.reset();
    } };

  /* 4. Line of sight */
  EN.los = { title: 'Being seen: Line of Sight', sub: 'Interactive sandbox',
    html: `
    <p class="lead">A guard (or a camera) sees you if <b>two conditions</b> are met:</p>
    <ol class="big"><li><b>He is facing toward you</b>: your row/column is on the side his arrow points to (the whole half-board in front of him).</li><li><b>The box is empty</b>: draw a rectangle enclosing both your spaces. No wall, locked door or obstacle (red-bordered space) inside it.</li></ol>
    <p>Figures <b>don't block</b> sight. You look in every direction. A camera doesn't see its own space.</p>
    <div class="ctrls seg" id="losMode"><button class="btn on" data-m="snake">🐍 Place Snake</button><button class="btn" data-m="guard">💂 Place the guard</button><button class="btn" data-m="rot">↻ Turn the guard</button></div>
    <div class="stage" id="losStage"></div>
    <div class="verdict" id="losVerdict"></div>
    <div class="card"><h4>👀 Spotted!</h4><p>As soon as a player enters the LOS of a guard or a camera (at any moment, even a guard that just appeared), they place their <span class="tai">!</span> token under them. If you start in or cross a LOS during a move, you place the token <b>at the end</b> of the move.</p></div>
    <div class="imgrow"><figure><img src="guide/img/los-facing.jpg"><figcaption>Condition 1: the facing direction.</figcaption></figure><figure><img src="guide/img/los-box.jpg"><figcaption>Condition 2: the box (here a red wall cuts it → ✗).</figcaption></figure><figure><img src="guide/img/obstacles.jpg"><figcaption>Obstacles: locked door (A), tree (B), red-bordered space (C), wall (D).</figcaption></figure></div>`,
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
        for (let y = 0; y < bd.rows; y++) for (let x = 0; x < bd.cols; x++) {
          const f = g.face; const inF = (f === 'right' && x > g.x) || (f === 'left' && x < g.x) || (f === 'down' && y > g.y) || (f === 'up' && y < g.y);
          if (inF) bd.hl(x, y, 'facing');
        }
        const r = los(bd, g, s, { facing: g.face });
        bd.boxFx(...r.rect, r.ok);
        verdict.className = 'verdict ' + (r.ok ? 'seen' : 'safe');
        verdict.innerHTML = `<div class="vline ${r.facing ? 'y' : 'n'}">${r.facing ? '✅' : '❌'} ① The guard is facing Snake's row/column</div>
          <div class="vline ${r.box ? 'y' : 'n'}">${r.box ? '✅' : '❌'} ② Box with no wall or obstacle</div>
          <div class="vres">${r.ok ? '🚨 SPOTTED! Snake places his ! (Alert) token and the guard will attack him when activated.' : '🤫 Snake is invisible to this guard.'}</div>`;
      }
      upd();
    } };

  /* 5. Attention */
  EN.attention = { title: 'Noise & the Attention token', sub: '? Investigate vs ! Alert',
    html: `
    <p class="lead">Each character has a double-sided <b>Attention</b> token. When it's on the map, it tells the guards where to go.</p>
    <div class="flipdemo"><div class="flipper" id="flipper"><div class="fa tqbig">?</div><div class="fb tabig">!</div></div>
      <div><p><span class="tqi">?</span> <b>Investigate</b>: "I heard something." The closest guard comes to check (blue number).</p><p><span class="tai">!</span> <b>Alert</b>: "Intruder spotted!" <b>Every</b> guard in the zone rushes to it (red number).</p><button class="btn" id="flipBtn">🔄 Flip</button></div></div>
    <div class="two">
      <div class="card"><h4><span class="tqi">?</span> "Draw attention"</h4><p>If your token isn't on the map → place it under you, <b>?</b> side up. If it's already there → move it to your space <b>without changing its side</b>.</p><ul><li>A <b>!</b> on a white die (any roll)</li><li>Failed Noise check</li><li><b>Knock</b> action (on purpose, to lure a guard)</li><li><b>Stay Alert</b> section (within 2 spaces of a guard)</li></ul></div>
      <div class="card warnc"><h4><span class="tai">!</span> Going to Alert</h4><ul><li>Entering the <b>LOS</b> of a guard or a camera</li><li>Using a <b>LOUD</b> action (weapons…)</li><li>Leapfrogging over a guard</li><li>Wounding a guard without making him KO/dead before the end of your turn (even without LOS!)</li><li>Passing through a laser sensor's LOS</li></ul></div>
    </div>
    <div class="card"><h4>🧹 How do you get rid of it?</h4><p>A guard reaching your token's space stops and resolves a <b>Guard Reaction</b> card that says what to do with the token (often: he removes it, or goes to Alert…). That's the only normal way to "calm down" an alert: better not get seen!</p></div>
    <p class="muted"><b>Active</b> zone = a zone containing a player <i>or</i> a player's Attention token. Only guards in active zones activate.</p>` };

  /* 6. Combat */
  EN.combat = { title: 'Fighting: dice & Defense', sub: 'Damage, KO, Focus',
    html: `
    <p class="lead">Everything is resolved with dice. One single rule: <b>each die ≥ the target's Defense = 1 damage.</b></p>
    <div class="two">
      <div class="card"><h4>⚔️ You attack</h4><p>You roll the dice shown by the action or the equipment (LOS required; in melee the target must be adjacent). You compare them to the target's Defense (guard: <b>3</b>, see the Guard dashboard).</p></div>
      <div class="card"><h4>🛡️ You're attacked</h4><p><b>You</b> roll: 2 black dice for a guard (Guard dashboard), the number shown for a boss. Each die ≥ <b>your</b> Defense = 1 damage to you.</p></div>
    </div>
    <h4>🎬 Booklet example: Snake's Combo on a guard (Defense 3, Health 2)</h4>
    <div class="dicestage" id="diceStage"></div>
    <div class="caption" id="diceCap"></div>
    <div class="ctrls"><button class="btn pri" id="diceGo">▶ Replay the example</button></div>
    <div class="two">
      <div class="card"><h4>💥 Normal damage vs ⭐ KO</h4><p>Normal damage: guard defeated → <b>Dead ☠</b> token. <b>KO</b> damage (hand-to-hand, combo…): guard knocked out → <b>KO ★★</b> token (he'll wake up!). Against a boss, KO counts as normal damage. A KO guard can no longer be attacked.</p></div>
      <div class="card warnc"><h4>⚠️ Finish the job</h4><p>If you wound a guard without making him KO/dead before the end of your turn → he's alerted: your token goes to <b>!</b> under you.</p></div>
    </div>
    <div class="card"><h4>✨ Focus tokens</h4><p>Each character has 4 unique Focus tokens (+2, −2, reroll…). They're free: flip them to the gray side to use them, when <b>you</b> roll dice or when an enemy targets you. To get them back: <b>Focus</b> action (cost printed on the gray side). Focus tokens that move you can only be used during your turn. The <b>!</b> can't be modified (+/−) but can be rerolled. Modifiers can go beyond 1–6.</p></div>
    <h4>🧮 Damage calculator (for the table)</h4>
    <div class="calc" id="calc"></div>`,
    mount(root) {
      const stg = root.querySelector('#diceStage'), cp = root.querySelector('#diceCap');
      async function demo() {
        stg.innerHTML = `<div class="dz"><div class="die w" id="d1">?</div><div class="die w" id="d2">?</div><div class="die b" id="d3">?</div></div><div class="vs">vs <span class="defb">Defense 3</span></div><div class="gstat"><div class="pc-guard">💂</div><div class="hp" id="ghp"><i></i><i></i></div></div>`;
        cp.innerHTML = '<b>Combo Attack</b> (2 actions): Snake rolls 2 white dice + 1 black die…';
        const vals = [4, 1, 3];
        const els = ['d1', 'd2', 'd3'].map(id => stg.querySelector('#' + id));
        els.forEach(e => e.classList.add('rolling'));
        for (let k = 0; k < 10; k++) { els.forEach(e => e.textContent = 1 + Math.floor(Math.random() * 6)); await sleep(80); }
        els.forEach((e, i) => { e.classList.remove('rolling'); e.textContent = vals[i]; });
        await sleep(700);
        cp.innerHTML = 'Compare each die to Defense 3: <b class="ok">4 ✔</b> · <b class="ko">1 ✘</b> · <b class="ok">3 ✔</b> (equal counts!) → <b>2 KO damage</b>.';
        els.forEach((e, i) => e.classList.add(vals[i] >= 3 ? 'hit' : 'miss'));
        await sleep(1300);
        stg.querySelectorAll('#ghp i').forEach(i => i.classList.add('lost'));
        await sleep(600);
        stg.querySelector('.pc-guard').outerHTML = '<div class="pc-guard ko">★★</div>';
        cp.innerHTML = '2 KO ≥ Health 2 → the guard is <b>knocked out</b>: replace the figure with a <b>KO ★★</b> token. Combo = silent, no ! token! 😎';
      }
      root.querySelector('#diceGo').onclick = demo; demo();
      // calculator
      const calc = root.querySelector('#calc');
      let def = 3, dice = [{ c: 'b', v: 6 }, { c: 'b', v: 2 }];
      function draw() {
        const hits = dice.filter(d => d.v !== '!' && d.v >= def).length, bang = dice.some(d => d.v === '!');
        calc.innerHTML = `<div class="crow"><span>Target's Defense</span>${[1, 2, 3, 4, 5, 6].map(n => `<button class="btn sm ${n === def ? 'on' : ''}" data-def="${n}">${n}</button>`).join('')}</div>
          <div class="crow dicewrap">${dice.map((d, i) => `<button class="die ${d.c} ${d.v !== '!' && d.v >= def ? 'hit' : 'miss'}" data-i="${i}">${d.v}</button>`).join('')}
          <button class="btn sm" data-add="w">+ ⚪ white</button><button class="btn sm" data-add="b">+ ⚫ black</button><button class="btn sm" data-clr="1">clear</button></div>
          <div class="cres">➡ <b>${hits}</b> damage${bang ? ' · <b class="alert">! → draws attention</b>' : ''}</div>
          <p class="muted">Tap a die to change its value (the white one can show !). Focus +2/−2: just change the value.</p>`;
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
    } };

  /* 7. KO / dead */
  EN.ko = { title: 'KO guards, dead guards & waking up', sub: 'Hiding bodies, Lost Contact',
    html: `
    <p class="lead">A knocked-out guard doesn't sleep forever. A killed guard, on the other hand, ends up missing at roll call…</p>
    <div class="timeline" id="koTl"></div>
    <div class="ctrls"><button class="btn pri" id="koGo">▶ Watch him wake up</button></div>
    <div class="two">
      <div class="card"><h4>⭐ KO</h4><ul><li>Section I <b>Waken Guard</b> (active zones): <b>★</b> KO tokens become standing guards again, then <b>★★</b> become <b>★</b>.</li><li>That's about <b>2 Enemy Phases</b> of respite.</li><li>KO guards don't count toward the Guard Count (Radio-In brings in others!).</li></ul></div>
      <div class="card"><h4>☠ Dead</h4><ul><li>Never get back up.</li><li>Section I <b>Lost Contact</b>: for <b>every 3 Dead tokens</b> on the map, a Guard Order card is burned (revealed and put on the bottom) → the timer speeds up.</li><li>Don't count toward the Guard Count.</li></ul></div>
    </div>
    <div class="card warnc"><h4>👀 Bodies are suspicious</h4><p>A guard who sees a KO or Dead token (himself or via a camera in his zone) goes into <b>Investigate</b> mode and moves onto it → Guard Reaction. Use <b>Drag Body</b> (1 action, 🔊) to hide bodies out of sight.</p></div>`,
    mount(root) {
      const tl = root.querySelector('#koTl');
      const steps = [['Snake\'s turn', '💂', 'Combo → guard KO'], ['', '★★', 'KO token placed'], ['Enemy Phase 1', '★', 'Waken: ★★ → ★'], ['Enemy Phase 2', '💂', 'Waken: ★ → standing!']];
      tl.innerHTML = steps.map((s, i) => `<div class="tlstep" data-i="${i}"><div class="tlh">${s[0]}</div><div class="tlt">${s[1]}</div><div class="tlc">${s[2]}</div></div>`).join('<div class="tlarr">➜</div>');
      async function go() { const st = tl.querySelectorAll('.tlstep'); st.forEach(s => s.classList.remove('on')); for (const s of st) { s.classList.add('on'); await sleep(900); } }
      root.querySelector('#koGo').onclick = go; go();
    } };

  /* 8. Enemy phase */
  EN.enemy = { title: 'Enemy Phase: the Guard Order card', sub: 'Sections I · II · III',
    html: `
    <p class="lead">In Sneaking stages, after the players: draw <b>1 Guard Order card</b> and read it top to bottom. If it's the <b>Game Over</b> card → mission failed (time's up).</p>
    <div class="gocard">
      <div class="goimg"><img src="guide/img/guard-order-card.jpg" alt="Guard Order card"><div class="gohl" id="goHl"></div></div>
      <div class="gotxt" id="goTxt"></div>
    </div>
    <div class="ctrls seg" id="goSeg"><button class="btn on" data-s="0">I · Guard Action</button><button class="btn" data-s="1">II · Cameras</button><button class="btn" data-s="2">III · Activate guards</button></div>
    <div class="card"><h4>📚 The deck = the timer</h4><p>Setup: shuffle the <b>7 red</b> cards and the number of <b>blue</b> cards given by the Stage separately, and place the blue ones <b>on top of</b> the red ones. Once you reach the red cards, time is running out. Every "reveal a card and put it on the bottom" (Lost Contact, impossible spawn, Guard Reaction…) brings the end closer.</p></div>`,
    mount(root) {
      const hl = root.querySelector('#goHl'), txt = root.querySelector('#goTxt');
      const SEC = [
        { box: [9, 18, 91, 42], h: 'I · Guard Action', d: `<p>One of 4 actions (icon in the section):</p><ul>
          <li><b>✨ Waken Guard</b> (active zones): KO ★ → standing guard; KO ★★ → ★.</li>
          <li><b>📻 Radio-In</b> (active zones): if there are fewer guards than the Barracks <b>Guard Count</b>, reinforcements appear on the radio icon.</li>
          <li><b>☠×3 Lost Contact</b> (all zones): 1 card burned per 3 Dead tokens.</li>
          <li><b>❓ Stay Alert</b> (active zones): player within ≤ 2 spaces of a guard (unobstructed) → ? token under them (if it isn't already on the map).</li></ul><p class="muted">In the example: Lost Contact.</p>` },
        { box: [9, 44, 91, 67], h: 'II · Cameras', d: `<p>If the icon says so: <b>flip the Camera Facing token</b> (green ↔ orange). All cameras change direction at the same time (the cone of their visible color). Then check LOS for every camera.</p><p>Camera that sees a player → <b>Alert</b>. That sees a KO/Dead/? → the guards in the zone come to investigate.</p><p class="muted">No cameras on the map? Ignore this section.</p>` },
        { box: [5, 68, 95, 94], h: 'III · Activate guards', d: `<p>Order: active zone closest to the <b>Guard Priority</b> token (top-left corner), then <b>top to bottom, left to right</b>.</p><p>Each guard determines his <b>mode</b> at the start of his activation:</p><ul><li><b class="alert">! ALERT</b> → <b style="color:#ff5a5a">red</b> number (6 here)</li><li><b style="color:#4aa3ff">? INVESTIGATE</b> / ☠★ seen → <b style="color:#4aa3ff">blue</b> number (5 here)</li><li><b>PATROL</b> → blue number; the ↰ arrow tells which way to turn when he hesitates.</li></ul><p>👉 Details in the next lesson.</p>` },
      ];
      function show(i) { const s = SEC[i]; hl.style.cssText = `left:${s.box[0]}%;top:${s.box[1]}%;width:${s.box[2] - s.box[0]}%;height:${s.box[3] - s.box[1]}%`; txt.innerHTML = `<h4>${s.h}</h4>${s.d}`; root.querySelectorAll('#goSeg .btn').forEach(b => b.classList.toggle('on', +b.dataset.s === i)); }
      root.querySelector('#goSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.s); });
      show(0);
    } };

  /* 9. Guard AI */
  EN.ai = { title: 'The guards\' brain', sub: 'Alert · Investigate · Patrol',
    html: `
    <p class="lead">For each activated guard, ask yourself these questions <b>in order</b>:</p>
    <div class="flow">
      <div class="fq">Is there a <span class="tai">!</span> in <b>his zone</b>?</div>
      <div class="fr"><span class="yes">YES →</span> <b class="alert">ALERT</b>: moves toward the nearest !, up to the <b style="color:#ff5a5a">red number</b>.</div>
      <div class="fq">Otherwise: is he the closest guard (or tied) to a <span class="tqi">?</span>, or does he see a ★/☠ (himself or via a camera in his zone)?</div>
      <div class="fr"><span class="yes">YES →</span> <b style="color:#4aa3ff">INVESTIGATE</b>: moves toward that token, up to the <b style="color:#4aa3ff">blue number</b>.</div>
      <div class="fq">Otherwise</div>
      <div class="fr"><span class="yes">→</span> <b>PATROL</b>: straight ahead, <b style="color:#4aa3ff">blue number</b> of spaces.</div>
    </div>
    <div class="ctrls seg" id="aiSeg"><button class="btn on" data-s="patrol">🚶 Patrol</button><button class="btn" data-s="inv">❓ Investigate</button><button class="btn" data-s="alert">🚨 Alert</button></div>
    <div class="stage" id="aiStage"></div>
    <div class="two">
      <div class="card"><h4>🛑 He stops as soon as…</h4><ul><li>he <b>gains LOS</b> on a player → ! token + he attacks (the closest player);</li><li>he <b>enters a space with a token</b> Attention/KO/Dead → <b>Guard Reaction</b> card (attacks first if both);</li><li>he can't move any further.</li></ul></div>
      <div class="card"><h4>🧭 Shortest path</h4><ul><li>Fewest spaces (without crossing walls/locked doors).</li><li>On a tie: fewest turns. Still tied: you choose.</li><li>Leapfrog over guards = 1 space. Never over a player.</li><li>He never ends facing a wall.</li></ul></div>
    </div>
    <div class="card"><h4>🚶 Patrol details</h4><ul><li>Rotation arrow on the floor ↻: he turns, <b>even if he has movement left</b>, and keeps going.</li><li>↻ arrow "visible" at the end of movement: he looks for a new path.</li><li>Blocked (wall): he turns left or right toward a free path; if both are possible, he follows the card's <b>blue arrow</b> (guard's point of view).</li><li>The mode is set at the start of his activation (a patrolling guard who sees a body keeps on his rounds).</li></ul></div>`,
    mount(root) {
      const st = root.querySelector('#aiStage'); let cur = 'patrol', r;
      const wrap = document.createElement('div'); st.appendChild(wrap); const c = cap(st);
      const ctr = ctrl(st, CTRL_HTML);
      ctr.addEventListener('click', e => { const a = e.target.dataset.a; if (a && r) r[a](); });
      let bd;
      const SC = {
        patrol: { build() { bd = board(wrap, 8, 5); [[3, 0], [3, 1], [6, 3], [6, 4]].forEach(p => bd.obstacle(...p)); bd.token('t1', 'turn', 4, 2); bd.piece('g', 'guard', 0, 2, 'right'); bd.piece('s', 'snake', 7, 4, 'up', 'S'); bd.obstacle(6, 2); },
          steps: [
            { t: 'Guard Order card: <b style="color:#4aa3ff">blue 4</b>. No ! or ? → <b>Patrol</b>: he moves straight ahead.', f: async () => { await bd.move('g', 1, 2); } },
            { t: 'Space 2…', f: async () => { await bd.move('g', 2, 2); } },
            { t: 'Space 3…', f: async () => { await bd.move('g', 3, 2); } },
            { t: 'Space 4: he lands on a <b>rotation arrow</b> ↻ → he turns downward (direction shown on the floor).', f: async () => { await bd.move('g', 4, 2); await bd.turn('g', 'down'); } },
            { t: 'Movement used up (4/4). Snake, behind the obstacle and out of his gaze, isn\'t seen. 😮‍💨', f: async () => { bd.hl(7, 4, 'hl ok'); await sleep(200); } },
          ] },
        inv: { build() { bd = board(wrap, 8, 5); [[2, 1], [2, 2], [5, 0], [0, 2], [1, 2]].forEach(p => bd.obstacle(...p)); bd.piece('g1', 'guard', 0, 4, 'up'); bd.piece('g2', 'guard', 7, 2, 'left'); bd.token('q', '?', 4, 3); bd.piece('s', 'snake', 0, 0, 'up', 'S'); },
          steps: [
            { t: 'Earlier, Snake failed a Noise check at (4,3) and then hid in the top left. His <b>?</b> token stays where the noise happened.', f: async () => { bd.hl(4, 3, 'hl'); await sleep(300); } },
            { t: 'No ! in the zone. Right guard: 4 spaces from the ?. Bottom guard: 5 spaces. The closest → <b>Investigate</b> (blue 4). The other one <b>patrols</b>.', f: async () => { bd.bubble(7, 2, '4 spaces', ''); bd.bubble(0, 4, '5 spaces', ''); await sleep(800); } },
            { t: 'Activation order: top to bottom → the right guard goes first. Shortest path, fewest turns: 3 to the left…', f: async () => { bd.clearFx(); await bd.move('g2', 6, 2); await bd.move('g2', 5, 2); await bd.move('g2', 4, 2); } },
            { t: '… he turns toward the next space and enters the ?: he <b>stops</b> and draws a <b>Guard Reaction</b> card.', f: async () => { await bd.turn('g2', 'down'); await bd.move('g2', 4, 3); bd.bubble(4, 3, '🃏 Guard Reaction', 'red'); } },
            { t: 'Snake was never seen: the obstacles cut every LOS "box". The bottom guard will do his normal patrol.', f: async () => { bd.clearFx(); bd.hl(0, 0, 'hl ok'); await sleep(200); } },
          ] },
        alert: { build() { bd = board(wrap, 8, 5); [[3, 1], [3, 2], [5, 3]].forEach(p => bd.obstacle(...p)); bd.piece('g1', 'guard', 0, 0, 'down'); bd.piece('g2', 'guard', 7, 4, 'up'); bd.token('a', '!', 5, 1); bd.piece('s', 'snake', 6, 1, 'up', 'S'); },
          steps: [
            { t: 'There\'s a <b class="alert">!</b> in the zone → <b>every</b> guard is on <b>Alert</b>: <b style="color:#ff5a5a">red 6</b> number, heading for the nearest !.', f: async () => { bd.hl(5, 1, 'hl warn'); await sleep(300); } },
            { t: 'Top guard (activated first): he rushes along the shortest path (across the top, the obstacle blocks the rest). As long as the obstacle is in the "box", he doesn\'t see Snake…', f: async () => { await bd.turn('g1', 'right'); await bd.move('g1', 1, 0, 300); await bd.move('g1', 2, 0, 300); await bd.move('g1', 3, 0, 300); bd.boxFx(3, 0, 6, 1, false); await sleep(500); } },
            { t: '… next space: facing right + empty box → <b>LOS</b>! He stops and <b>attacks</b> (Snake rolls 2 black dice against his Defense).', f: async () => { bd.clearFx(); await bd.move('g1', 4, 0); bd.boxFx(4, 0, 6, 1, true); bd.bubble(6, 1, '⚔️ 2 black dice', 'red'); await sleep(600); } },
            { t: 'Bottom guard: from the start of his activation he faces up and the box up to Snake is empty → he already has LOS.', f: async () => { bd.clearFx(); bd.boxFx(6, 1, 7, 4, true); await sleep(500); } },
            { t: 'So he attacks <b>without moving</b>. Two attacks in the same phase: alerts hurt!', f: async () => { bd.bubble(7, 4, '⚔️', 'red'); await sleep(400); } },
          ] },
      };
      function load(k) { cur = k; wrap.innerHTML = ''; SC[k].build(); r = runner(SC[k].steps, c, () => { wrap.innerHTML = ''; SC[k].build(); }); r.reset(); root.querySelectorAll('#aiSeg .btn').forEach(b => b.classList.toggle('on', b.dataset.s === k)); }
      root.querySelector('#aiSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(b.dataset.s); });
      load('patrol');
    } };

  /* 10. Map elements */
  EN.map = { title: 'The map: zones, cameras, doors…', sub: 'Everything on the board',
    html: `
    <div class="two">
      <div class="card"><h4>🟧 Zones</h4><p>Each zone is outlined in orange in the setup. Elevator Shafts, Elevators and Barracks belong to the zone they connect to. <b>Active</b> zone = a player or a player's Attention token inside it.</p></div>
      <div class="card"><h4>📻 Barracks & Guard Count</h4><p>The Barracks <b>Guard Count</b> number = how many guards must patrol the zone. Radio-In tops it up to that number (on the radio icon).</p></div>
      <div class="card"><h4>📹 Cameras</h4><p>One direction at a time: that of the cone matching the visible color of the <b>Camera Facing</b> token (orange/green). Flipped by section II. Doesn't see its own space.</p></div>
      <div class="card"><h4>❓ Traps</h4><p>Face down, they look in every direction. You enter their LOS → flip them (it may be a camera: orient it so that no cone faces a wall).</p></div>
      <div class="card"><h4>🔴 Laser sensors</h4><p>Entering their LOS → <b>!</b> token under you.</p></div>
      <div class="card"><h4>🔒 Locked doors & items</h4><p>Levels 2 to 5. <b>Interact</b> action: roll the dice on your dashboard (Snake: 1 white + 2 black). Use Interact again to reroll as many dice as you like. You must get the combination <b>in the same turn</b> without moving away, or everything is lost. A teammate within ≤ 2 spaces can help with their Focus tokens.</p></div>
      <div class="card"><h4>🛗 Elevators</h4><p>Interact inside the elevator: it leaves (with every figure inside) for another Elevator Shaft. Interact on a Shaft: you call it.</p></div>
      <div class="card"><h4>🅰️ Events & 🚪 Exits</h4><p>Event: as soon as a figure enters it, read the matching section of the Stage (even in the middle of a Dash, then you continue). Exit: <b>end your turn</b> on it.</p></div>
      <div class="card"><h4>💻 Terminals</h4><p>Only Otacon can hack them (dice combination, see his sheet). They give access to System cards.</p></div>
      <div class="card"><h4>🟨 Yellow dotted lines</h4><p>Furniture / tripwires (Stages 4, 8…): impassable but they don't block LOS — you can shoot through them.</p></div>
    </div>
    <div class="imgrow"><figure><img src="guide/img/camera-trap-laser.jpg"><figcaption>Cameras, traps and lasers (booklet p.10).</figcaption></figure><figure><img src="guide/img/los-move.jpg"><figcaption>Crossing a guard's LOS during a move → ! on arrival.</figcaption></figure></div>` };

  /* 11. Bosses */
  EN.boss = { title: 'Boss fights', sub: 'Boss deck, Threat, reactions',
    html: `
    <p class="lead">No guards, no Guard Order: a boss, its <b>dashboard</b>, its <b>Boss deck</b> and sometimes a <b>Threat</b> track.</p>
    <ol class="big">
      <li><b>Setup</b>: place the <b>Boss Stage Reference</b> card (or the Stage's Special Action card: grenades, SAM, Sniper Rifle, Stinger…) on the highlighted area of each player dashboard. It covers the actions that are useless in Boss stages.</li>
      <li><b>Boss health</b> = depends on the number of players (on the Stage / dashboard). Defense is on the dashboard.</li>
      <li><b>Player turns</b> as normal: move, shoot (LOS), focus…</li>
      <li><b>Boss turn</b>: flip the top card of the Boss deck, resolve it (movement, attack…), put it on the <b>bottom of the deck</b>. The deck is <b>never</b> shuffled during the game → you can anticipate the cycle!</li>
      <li>Boss attack with no number of dice given → use the <b>Attack</b> stat on its dashboard. You roll, against your Defense.</li>
    </ol>
    <div class="card warnc"><h4>⚡ Reactions</h4><p>A boss's "reaction" abilities trigger <b>every time</b> their condition is met, immediately, even during your turn (FAQ).</p></div>
    <div class="card"><h4>💡 Reflexes</h4><ul><li>Read the whole boss dashboard during setup: its special abilities make the mission.</li><li>KO damage counts as normal damage against a boss.</li><li>Otacon in Boss stages: he's on his Terminal tile, with the boss's System deck (no hacking needed).</li></ul></div>` };

  /* 12. Equipment */
  EN.equip = { title: 'Equipment & Memory Box', sub: 'Limit, ammo, unlocks',
    html: `
    <ul class="big">
      <li><b>Equipment limit</b>: on the dashboard (Snake: 3). During setup, decide together who takes what from the Memory Box; starting equipment can be swapped out.</li>
      <li>A card showing a character's picture = reserved for that character.</li>
      <li><b>Ammo / charges</b>: icon at the top right → place that many tokens on it. Never more than the printed value. No icon = unlimited (SOCOM).</li>
      <li>Single-use equipment: discarded after use. Action tokens placed on it go back to your dashboard (not reusable this turn).</li>
      <li>Used-up equipment: lost <b>for this Stage only</b>.</li>
      <li><b>Stage cleared</b> → "Stage Cleared" section: unlocks cards (look for the number on the back without looking at the faces). Store them in the <b>Memory Box</b> at the end of the session.</li>
      <li>VR missions also unlock equipment.</li>
    </ul>
    <p>👉 The <b>Missions</b> tab lets you check off unlocked cards.</p>` };

  window.MGS_LESSONS.forEach(l => { if (EN[l.id]) Object.assign(l, EN[l.id]); });
})();
