/* MGS Board Game — Assistant de partie (plein écran, tablette).
   Onglets : 🧰 Mise en place · 🎮 Le jeu · 🎲 Partie (déroulé guidé + sons auto) · 🔊 Sons
   Données : guide/missions.js (MGS_MISSIONS), guide/data.js (MGS_FAQ, MGS_CHARS), guide/sounds.js (MGS_SOUNDS).
   Sons : pilote le soundboard via window.SB s'il est là (index.html), sinon son propre lecteur (guide.html).
   API : MGSAssistant.open({ mid, tab }) */
(function () {
  if (window.MGSAssistant) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s);
  const MIS = () => window.MGS_MISSIONS || [];
  const SND = () => window.MGS_SOUNDS || { stages: {}, groups: [], auto: {} };
  const CHARS = () => window.MGS_CHARS || [];
  const CE = { 'Snake': '🐍', 'Meryl': '🔫', 'Otacon': '🤓', 'Gray Fox': '🥷' };
  const ROSTER = ['Snake', 'Meryl', 'Gray Fox', 'Otacon'];

  /* ---------- stockage (partagé avec le guide : même dossier) ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };
  const st = Object.assign({ mid: null, n: 1, tab: 'setup', auto: true, games: {} }, LS.get('mgsa', {}));
  const save = () => LS.set('mgsa', st);
  const undo = [];
  const snap = () => { undo.push(JSON.stringify(st.games[st.mid])); if (undo.length > 40) undo.shift(); };

  const mission = () => MIS().find(m => String(m.id) === String(st.mid)) || MIS()[0];
  const pcounts = m => Object.keys(m.players || { 1: 1 }).filter(k => /^\d+$/.test(k));
  const pchars = (m, n) => { const c = (m.players && m.players[n]) || ['Snake']; return c.some(x => !CE[x]) ? ROSTER.slice(0, n) : c; };
  const charInfo = n => CHARS().find(c => c.name === n) || {};
  const stageSnd = m => (SND().stages || {})[m.id] || {};
  const isSneak = m => m.type === 'sneak' || m.type === 'boss+sneak';
  const isBoss = m => m.type === 'boss' || m.type === 'boss+sneak';

  function parseDeck(m, n) {
    if (!m || !m.guardDeck) return null;
    let s = typeof m.guardDeck === 'string' ? m.guardDeck : (m.guardDeck[n] || Object.values(m.guardDeck)[0]);
    s = String(s);
    const r = (s.match(/(\d+)\s*(?:rouge|red)/i) || [])[1], b = (s.match(/(\d+)\s*(?:bleue|blue)/i) || [])[1];
    let blue = b ? +b : 0;
    if (m.id === 'VR60') blue = 17 + Math.max(0, n - 1);
    return { red: r ? +r : 7, blue, drawn: 0 };
  }
  function newGame(m, n) {
    return {
      round: 1, phase: 0, step: 0,
      players: pchars(m, n).map(name => ({ name, left: 4, noisy: 0, dmg: 0, att: 0, done: false, ask: null })),
      deck: isSneak(m) ? parseDeck(m, n) : null,
      ko2: 0, ko1: 0, dead: 0, cam: 'vert', boss: { dmg: 0, threat: 0, cards: 0 }, over: null, log: [],
    };
  }
  const game = () => {
    const m = mission();
    if (!st.games[m.id] || st.games[m.id].n !== st.n) { st.games[m.id] = Object.assign(newGame(m, st.n), { n: st.n }); }
    return st.games[m.id];
  };

  /* ---------- audio ---------- */
  const A = {
    own: null, cur: null, mode: null, vol: LS.get('mgsa.vol', 0.8),
    music(file, mode) {
      this.cur = file; this.mode = mode || 'mission';
      if (window.SB) { window.SB.playMusic(file); }
      else {
        if (!this.own) { this.own = new Audio(); this.own.loop = true; }
        this.own.src = 'music/' + file; this.own.volume = this.vol * 0.7; this.own.play().catch(() => {});
      }
      bar();
    },
    sfx(file) {
      if (!file) return;
      if (window.SB) window.SB.playSfx(file);
      else { const a = new Audio('sfx/' + file); a.volume = this.vol; a.play().catch(() => {}); }
    },
    stop() { this.cur = null; this.mode = null; if (window.SB) window.SB.stopMusic(); else if (this.own) this.own.pause(); bar(); },
  };
  const AU = () => SND().auto || {};
  let stepAlt = 0;
  const step = kind => { const a = AU()[kind]; if (Array.isArray(a) && a.length) A.sfx(a[stepAlt++ % a.length]); };
  function syncAlertMusic() {
    if (!st.auto) return;
    const g = game(), m = mission();
    const alert = g.players.some(p => p.att === 2);
    const al = (SND().alert || [])[0];
    const ms = (stageSnd(m).music || [])[0];
    if (alert && al && A.mode !== 'alert') A.music(al[0], 'alert');
    else if (!alert && A.mode === 'alert' && ms) { A.sfx(AU().clearAlarm); setTimeout(() => A.music(ms[0], 'mission'), 900); }
  }

  /* ---------- CSS ---------- */
  const css = `
  #mgsA{position:fixed;inset:0;z-index:99995;display:none;flex-direction:column;color:#e6eaff;font:15px/1.45 "Segoe UI",system-ui,sans-serif;
    background:radial-gradient(1100px 600px at 50% -12%,rgba(92,140,255,.30),transparent 62%),radial-gradient(700px 500px at 92% 18%,rgba(138,92,255,.18),transparent 60%),#080b22}
  #mgsA.show{display:flex}
  #mgsA *{box-sizing:border-box}
  #mgsA b{color:#fff}
  .ma-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top));border-bottom:1px solid #26306a;background:rgba(8,10,32,.7)}
  .ma-h .lg{font:800 1.05rem system-ui;letter-spacing:1px;color:#9ec0ff;margin-right:4px;white-space:nowrap}
  .ma-h select{font:700 15px system-ui;color:#fff;background:#141a44;border:1px solid #39407a;border-radius:11px;padding:9px 10px;min-height:44px;max-width:100%}
  .ma-h .sp{flex:1}
  .ma-b{min-height:44px;min-width:44px;padding:8px 13px;border-radius:11px;border:1px solid #39407a;background:#151a40;color:#fff;font:700 15px system-ui;cursor:pointer;touch-action:manipulation}
  .ma-b:active{transform:scale(.97)} .ma-b:disabled{opacity:.35}
  .ma-b.pri{background:linear-gradient(135deg,#5b8cff,#8a5cff);border:none}
  .ma-b.red{background:#4a1220;border-color:#a3304a} .ma-b.on{background:#2c3a8a;border-color:#7aa7ff}
  .ma-b.sm{min-height:36px;min-width:36px;padding:5px 10px;font-size:14px}
  .ma-tabs{display:flex;gap:6px;padding:8px 12px;overflow-x:auto;border-bottom:1px solid #1d2556}
  .ma-tabs .ma-b{flex:1 0 auto;font-size:16px}
  .ma-c{flex:1;overflow:auto;padding:12px 12px 20px;-webkit-overflow-scrolling:touch}
  .ma-bar{display:flex;gap:8px;align-items:center;padding:8px 12px;padding-bottom:calc(8px + env(safe-area-inset-bottom));border-top:1px solid #26306a;background:rgba(8,10,32,.85)}
  .ma-bar .np{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#9aa6d6}
  .ma-card{background:rgba(20,26,66,.75);border:1px solid #2a3474;border-radius:14px;padding:12px 14px;margin:10px 0}
  .ma-card h4{margin:0 0 6px;font:800 1rem system-ui;color:#9ec0ff}
  .ma-card ul{margin:4px 0;padding-left:20px} .ma-card li{margin:3px 0}
  .ma-card.warn{border-color:#a3304a;background:rgba(60,14,30,.6)} .ma-card.warn h4{color:#ff9aaa}
  .ma-card.err{border-color:#b08a1c;background:rgba(60,48,8,.55)} .ma-card.err h4{color:#ffd166}
  .ma-card.boss{border-color:#8a4ac0} .ma-card.boss h4{color:#e0aaff}
  .ma-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 12px}
  .ma-map{background:#e9e7e2;border-radius:12px;overflow:hidden;cursor:zoom-in}
  .ma-map img{width:100%;display:block}
  .ma-setup{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,1fr);gap:12px;align-items:start}
  .ma-chk{list-style:none;margin:0;padding:0}
  .ma-chk li{display:flex;gap:10px;padding:9px 4px;border-bottom:1px dashed #26306a;cursor:pointer}
  .ma-chk .bx{flex:0 0 26px;height:26px;border:2px solid #5b8cff;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900}
  .ma-chk li.ok .bx{background:#5b8cff} .ma-chk li.ok .tx{opacity:.5;text-decoration:line-through}
  .chip{display:inline-block;background:#1a2150;border:1px solid #2f3a80;border-radius:16px;padding:3px 10px;margin:2px;font-size:.88rem}
  .ma-ev{display:inline-flex;width:28px;height:28px;border-radius:7px;background:#c4202f;color:#fff;font:900 15px system-ui;align-items:center;justify-content:center;margin-right:6px}
  .ma-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .ma-round{font:900 1.3rem system-ui;display:flex;align-items:center;gap:6px}.ma-round span{font-size:2rem;color:#7aa7ff;min-width:1.4ch;text-align:center}
  .ma-ph{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}
  .ma-ph .ma-b{font-size:15px}
  .ma-deck{display:flex;gap:2px;flex-wrap:wrap;margin:6px 0}
  .ma-deck i{width:14px;height:22px;border-radius:3px}.ma-deck i.b{background:#2f7dd6}.ma-deck i.r{background:#d63045}.ma-deck i.x{background:#20264d}
  .ma-cnt{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .ma-cnt .v{font:900 1.2rem system-ui;min-width:1.6ch;text-align:center}
  .ma-pl{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}
  .ma-p{background:rgba(20,26,66,.8);border:2px solid var(--c,#2a3474);border-radius:14px;padding:10px 12px}
  .ma-p.done{opacity:.6}
  .ma-p h5{margin:0;font:800 1.1rem system-ui;display:flex;align-items:center;gap:8px}
  .ma-tok{display:flex;gap:6px;margin:8px 0}
  .ma-tok i{width:30px;height:30px;border-radius:50%;background:#5b8cff;border:3px solid #cfdcff;transition:.25s}
  .ma-tok i.u{background:#1a2148;border-color:#39407a}
  .ma-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:6px}
  .ma-act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:62px;border-radius:12px;border:1px solid #2f3a80;background:#141a46;color:#fff;font:700 13px system-ui;cursor:pointer;padding:6px}
  .ma-act .i{font-size:22px} .ma-act small{color:#9aa6d6;font-weight:600}
  .ma-act.loud{border-color:#a3304a}.ma-act.noisy{border-color:#9a6a2a}
  .ma-act:disabled{opacity:.3}
  .ma-att{display:flex;gap:6px;align-items:center;margin:6px 0}
  .ma-att .ma-b.q.on{background:#1f8bff;border-color:#cfe6ff}.ma-att .ma-b.a.on{background:#e01f35;border-color:#ffd0d6}
  .ma-hp{display:flex;gap:4px;align-items:center}.ma-hp i{width:18px;height:18px;border-radius:5px;background:#e01f35}.ma-hp i.d{background:#2a2f55}
  .ma-ask{margin-top:8px;padding:10px;border-radius:12px;background:rgba(255,179,92,.12);border:1px solid #9a6a2a}
  .ma-ask p{margin:0 0 6px}
  .ma-step{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:12px;border:1px solid #2a3474;margin:8px 0;background:rgba(20,26,66,.6)}
  .ma-step.cur{border-color:#7aa7ff;box-shadow:0 0 14px rgba(122,167,255,.3)}
  .ma-step.ok{opacity:.55}
  .ma-step .k{flex:0 0 36px;height:36px;border-radius:10px;background:#5b8cff;display:flex;align-items:center;justify-content:center;font:900 16px system-ui}
  .ma-step .bd{flex:1}
  .ma-mode{padding:10px 12px;border-radius:12px;margin:6px 0;font-weight:700}
  .ma-mode.al{background:rgba(224,31,53,.18);border:1px solid #e01f35}.ma-mode.iv{background:rgba(31,139,255,.15);border:1px solid #1f8bff}
  .ma-ban{padding:14px;border-radius:14px;text-align:center;font:900 1.3rem system-ui;margin:8px 0}
  .ma-ban.go{background:#3a0c16;border:2px solid #e01f35;color:#ffb0bc}.ma-ban.win{background:#0f3a2a;border:2px solid #3dffa0;color:#b8ffd8}
  .ma-toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:99999;background:#10163f;border:1px solid #7aa7ff;border-radius:14px;padding:10px 16px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:92vw;text-align:center;animation:matoast .25s}
  @keyframes matoast{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  .ma-snd{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .ma-snd button{min-height:58px;border-radius:12px;border:1px solid #2f3a80;background:#141a46;color:#fff;font:700 14px system-ui;cursor:pointer;padding:6px 8px;text-align:center}
  .ma-snd button.mu{background:linear-gradient(135deg,#1d2a6b,#3a2470);border-color:#5b6bd0}
  .ma-snd button.cur{outline:3px solid #7aa7ff}
  .ma-snd button.vo{border-color:#8a4ac0}
  .ma-h3{font:800 1.05rem system-ui;margin:16px 0 8px;color:#c9d4ff}
  #mgsA-v{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.94);display:none;flex-direction:column}
  #mgsA-v.show{display:flex} #mgsA-v .tb{display:flex;gap:8px;justify-content:flex-end;padding:10px;padding-top:calc(10px + env(safe-area-inset-top))}
  #mgsA-v .sc{flex:1;overflow:auto;touch-action:pan-x pan-y} #mgsA-v img{display:block;margin:0 auto;max-width:none}
  .ma-turn{background:linear-gradient(135deg,rgba(91,140,255,.22),rgba(138,92,255,.18));border:1px solid #5b6bd0;border-radius:16px;padding:12px 14px;margin:8px 0}
  .ma-turn .t{font:900 1.35rem system-ui}
  .ma-turn .how{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:6px;color:#c9d4ff;font-size:.95rem}
  .ma-turn .who{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .mcw{width:170px;height:104px;display:block;margin:6px 0}
  .mcw-c{fill:#151c40;stroke:#26306a}.mcw-c.lit{fill:rgba(255,209,102,.28);stroke:#ffd166;transition:fill .6s}
  .mcw-cam{transition:transform .9s cubic-bezier(.4,.1,.3,1);transform-origin:0 0}
  .mcw.anim .mcw-c.lit{animation:mcwlit 1.2s ease-out}
  @keyframes mcwlit{from{fill:rgba(255,209,102,0)}to{fill:rgba(255,209,102,.28)}}
  @media (max-width:760px){.ma-setup{grid-template-columns:1fr}.ma-h .lg{display:none}}
  `;

  /* ---------- UI ---------- */
  let root, body, built = false;
  function build() {
    if (built) return; built = true;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    root = document.createElement('div'); root.id = 'mgsA';
    root.innerHTML = `<div class="ma-h"><span class="lg">◤ ASSISTANT MGS</span><select id="maMis"></select><select id="maN"></select><span class="sp"></span>
        <button class="ma-b" id="maHelp" title="Aide animée">❓</button><button class="ma-b red" id="maX" title="Fermer">✕</button></div>
      <div class="ma-tabs" id="maTabs">${[['setup', '🧰 Mise en place'], ['rules', '🎮 Le jeu'], ['play', '🎲 Partie'], ['snd', '🔊 Sons']].map(([k, t]) => `<button class="ma-b" data-t="${k}">${t}</button>`).join('')}</div>
      <div class="ma-c" id="maBody"></div>
      <div class="ma-bar"><span class="np" id="maNp">♪ —</span><button class="ma-b sm" id="maAlert" title="Musique d'alerte">🚨</button><button class="ma-b sm" id="maAuto" title="Musique et sons automatiques">🎬 Auto</button><button class="ma-b sm" id="maStop" title="Stop musique">⏹</button></div>`;
    document.body.appendChild(root);
    const v = document.createElement('div'); v.id = 'mgsA-v';
    v.innerHTML = `<div class="tb"><button class="ma-b" data-z="-">－</button><button class="ma-b" data-z="0">⤢</button><button class="ma-b" data-z="+">＋</button><button class="ma-b red" data-z="x">✕</button></div><div class="sc"><img alt=""></div>`;
    document.body.appendChild(v);
    body = $('#maBody', root);
    $('#maX', root).onclick = close;
    $('#maHelp', root).onclick = () => window.MGSHelp && window.MGSHelp.open();
    $('#maTabs', root).addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { st.tab = b.dataset.t; save(); render(); } });
    $('#maMis', root).onchange = e => { st.mid = e.target.value; const m = mission(); if (!pcounts(m).includes(String(st.n))) st.n = +pcounts(m)[0]; save(); render(); };
    $('#maN', root).onchange = e => { st.n = +e.target.value; save(); render(); };
    $('#maStop', root).onclick = () => A.stop();
    $('#maAlert', root).onclick = () => { const al = (SND().alert || [])[0]; if (al) A.music(al[0], 'alert'); };
    $('#maAuto', root).onclick = () => { st.auto = !st.auto; save(); bar(); toast(st.auto ? '🎬 Sons automatiques activés' : 'Sons automatiques coupés'); };
    // viewer zoom
    const img = $('img', v), sc = $('.sc', v); let z = 1, fit = 1;
    const setZ = nz => { z = Math.max(fit * 0.9, Math.min(4, nz)); img.style.width = img.naturalWidth * z + 'px'; };
    v.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; const k = b.dataset.z; if (k === 'x') v.classList.remove('show'); if (k === '+') setZ(z * 1.4); if (k === '-') setZ(z / 1.4); if (k === '0') setZ(fit); });
    img.onload = () => { fit = Math.min(sc.clientWidth / img.naturalWidth, sc.clientHeight / img.naturalHeight); setZ(fit); };
    let pin = null;
    sc.addEventListener('touchstart', e => { if (e.touches.length === 2) { const [a, b] = e.touches; pin = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z }; } }, { passive: true });
    sc.addEventListener('touchmove', e => { if (pin && e.touches.length === 2) { e.preventDefault(); const [a, b] = e.touches; setZ(pin.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pin.d); } }, { passive: false });
    sc.addEventListener('touchend', () => { pin = null; });
    root.addEventListener('click', e => { const im = e.target.closest('[data-zoom]'); if (im) { img.src = im.dataset.zoom; v.classList.add('show'); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (v.classList.contains('show')) v.classList.remove('show'); else if (root.classList.contains('show')) close(); } });
  }
  function toast(msg, ms = 2600) {
    const t = document.createElement('div'); t.className = 'ma-toast'; t.innerHTML = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function bar() {
    if (!root) return;
    const np = $('#maNp', root);
    let name = A.cur;
    if (window.SB && window.SB.current()) name = window.SB.current().name || window.SB.current().file;
    np.textContent = name ? '♪ ' + String(name).replace(/\.mp3$/i, '') + (A.mode === 'alert' ? '  🚨' : '') : '♪ —';
    $('#maAuto', root).classList.toggle('on', !!st.auto);
  }
  const list = a => (a && a.length) ? `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p style="opacity:.6">—</p>';
  const faqFor = m => (window.MGS_FAQ || []).flatMap(c => c.items).filter(q => q.stage === m.id);
  const SETUP_RE = /setup|mise en place|carte|barracks|tuile|plan|icône|jeton|placer/i;

  function render() {
    if (!st.mid) st.mid = MIS()[0] && MIS()[0].id;
    const m = mission(); if (!m) return;
    if (!pcounts(m).includes(String(st.n))) st.n = +pcounts(m)[0];
    $('#maMis', root).innerHTML = MIS().map(x => `<option value="${x.id}" ${String(x.id) === String(m.id) ? 'selected' : ''}>${typeof x.id === 'number' ? 'Stage ' + x.id : x.id} · ${esc(x.name)}${x.type === 'sneak' ? ' 🕵️' : ' 👾'}</option>`).join('');
    $('#maN', root).innerHTML = pcounts(m).map(k => `<option value="${k}" ${+k === st.n ? 'selected' : ''}>${k} joueur${k > 1 ? 's' : ''}</option>`).join('');
    root.querySelectorAll('#maTabs [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === st.tab));
    ({ setup: vSetup, rules: vRules, play: vPlay, snd: vSnd }[st.tab] || vSetup)(m);
    bar();
  }

  /* ---------- 🧰 Mise en place ---------- */
  function vSetup(m) {
    const chk = LS.get('mgsg.chk.' + m.id, {});
    const chars = pchars(m, st.n);
    const deck = m.guardDeck ? (typeof m.guardDeck === 'string' ? m.guardDeck : Object.entries(m.guardDeck).map(([k, v]) => `${k} : ${v}`).join(' · ')) : null;
    const steps = [...(m.setup || []),
      ...(isSneak(m) ? ['Guard dashboard : deck Guard Order (bleues mélangées SUR les rouges mélangées) + deck Guard Reaction (6) mélangé.'] : []),
      `Chaque joueur (${chars.map(c => CE[c] + ' ' + c).join(', ')}) : dashboard, 4 jetons Action, 4 Focus, jeton Attention, équipement (≤ limite) + munitions/charges.`,
      'Dés et jetons (dégâts, KO, Mort…) en réserve.'];
    const errs = (m.errata || []).filter(e => SETUP_RE.test(e));
    body.innerHTML = `${errs.length ? `<div class="ma-card err"><h4>⚠️ Errata pour la mise en place</h4>${list(errs)}</div>` : ''}
      <div class="ma-setup"><div>${(m.images || []).map(src => `<div class="ma-map" data-zoom="${src}"><img src="${src}" alt="Plan de mise en place"></div>`).join('') || '<p>Pas de plan.</p>'}
        <p style="opacity:.6;font-size:.9rem">👆 Touche le plan pour zoomer.</p></div>
      <div><div class="ma-card" style="margin-top:0"><h4>👥 Personnages (${st.n} joueur${st.n > 1 ? 's' : ''})</h4><p>${chars.map(c => `<span class="chip">${CE[c] || ''} ${c}</span>`).join('')}</p>
        ${m.tiles && m.tiles.length ? `<p><b>Tuiles :</b> ${m.tiles.join(', ')}</p>` : ''}${deck ? `<p><b>Guard Order :</b> ${deck}</p>` : ''}${m.time ? `<p><b>Durée :</b> ${m.time}</p>` : ''}</div>
        <div class="ma-card"><h4>✅ Checklist</h4><ul class="ma-chk" id="maChk">${steps.map((s, i) => `<li class="${chk[i] ? 'ok' : ''}" data-i="${i}"><span class="bx">${chk[i] ? '✓' : ''}</span><span class="tx">${s}</span></li>`).join('')}</ul>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="ma-b sm" id="maChkR">↺ Décocher</button><button class="ma-b pri" id="maGo">🎲 Lancer la partie</button></div></div></div></div>`;
    $('#maChk', body).addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return; const x = LS.get('mgsg.chk.' + m.id, {}); x[li.dataset.i] = !x[li.dataset.i]; LS.set('mgsg.chk.' + m.id, x); li.classList.toggle('ok', !!x[li.dataset.i]); li.querySelector('.bx').textContent = x[li.dataset.i] ? '✓' : ''; });
    $('#maChkR', body).onclick = () => { LS.set('mgsg.chk.' + m.id, {}); render(); };
    $('#maGo', body).onclick = () => {
      st.games[m.id] = Object.assign(newGame(m, st.n), { n: st.n }); undo.length = 0; st.tab = 'play'; save();
      const ms = (stageSnd(m).music || [])[0]; if (ms && st.auto) A.music(ms[0], 'mission');
      A.sfx(AU().codec); render();
    };
  }

  /* ---------- 🎮 Le jeu ---------- */
  function vRules(m) {
    const special = (m.special || []).map(s => typeof s === 'string' ? `<li>${s}</li>` : `<li><b>${s.t}</b> — ${s.d}</li>`).join('');
    const events = (m.events || []).map(e => `<li><span class="ma-ev">${e.k}</span>${e.d}</li>`).join('');
    const errs = (m.errata || []);
    const faq = faqFor(m);
    body.innerHTML = `${m.briefing ? `<div class="ma-card" style="font-style:italic"><button class="ma-b sm" id="maBrief" style="float:right;font-style:normal">📡 Lire</button>📡 ${m.briefing}</div>` : ''}
      <div class="ma-two"><div class="ma-card"><h4>🎯 Objectif</h4>${list(m.objective)}${m.optional && m.optional.length ? `<h4>⭐ Optionnel</h4>${list(m.optional)}` : ''}</div>
      <div class="ma-card warn"><h4>💀 Échec si…</h4>${list(m.failure)}</div></div>
      ${errs.length || faq.length ? `<div class="ma-card err"><h4>⚠️ Errata & précisions officielles</h4>${list(errs)}${faq.map(q => `<p><b>${q.q}</b><br>${q.a}</p>`).join('')}</div>` : ''}
      ${special ? `<div class="ma-card"><h4>📜 Règles spéciales</h4><ul>${special}</ul></div>` : ''}
      ${events ? `<div class="ma-card"><h4>🅰️ Events (dès qu'une figurine entre dessus)</h4><ul style="list-style:none;padding:0">${events}</ul></div>` : ''}
      ${m.boss ? `<div class="ma-card boss"><h4>👾 ${esc(m.boss.name)}</h4>${m.boss.health ? `<p><b>Santé :</b> ${m.boss.health}</p>` : ''}${m.boss.defense ? `<p><b>Défense :</b> ${m.boss.defense}</p>` : ''}${list(m.boss.notes)}</div>` : ''}
      <div class="ma-card"><h4>🏆 Si réussi</h4>${list(m.cleared)}</div>
      ${m.tips && m.tips.length ? `<div class="ma-card"><h4>💡 Conseils</h4>${list(m.tips)}</div>` : ''}
      <div class="ma-card"><h4>📞 Le Codec, c'est quand ?</h4><p>Quand tu veux ! Dès qu'un composant (carte Équipement, dashboard de boss, tuile, page du livre…) porte un <b>numéro Codec</b>, tu peux le chercher dans le <b>Codec Book</b> pour en savoir plus : détail d'une capacité, astuce, et parfois un petit secret. C'est facultatif et ça ne coûte aucune action.${m.id === 8 ? ' <b>Errata Mantis :</b> toute référence au Codec 3.14 se lit 3.11.' : ''}</p></div>`;
  }

  document.addEventListener('click', e => { if (e.target && e.target.id === 'maBrief') { A.sfx(AU().briefing); A.sfx(AU().codec); } });

  /* ---------- 🎲 Partie ---------- */
  const ACTS = [
    { id: 'sneak', i: '🚶', n: 'Sneak', c: 1, steps: 'sneak', tip: 'Avance ton pion d\'1 case (jamais en diagonale).' },
    { id: 'dash', i: '🏃', n: 'Dash', c: 1, noisy: 1, steps: 'dash', tip: 'Avance ton pion de 2 cases. 🔊 Bruyant : noise check en fin de tour.' },
    { id: 'h2h', i: '👊', n: 'Corps-à-corps', c: 1, sfx: 'punch-guard-kox1.mp3', ko: 1, tip: 'Cible adjacente : 1 dé blanc, dégâts KO. Dé ≥ Défense (garde : 3).' },
    { id: 'combo', i: '🥊', n: 'Combo', c: 2, sfx: 'knock-out-guard-kox2.mp3', ko: 1, tip: 'Adjacent : 2 blancs + 1 noir, dégâts KO. Garde : Défense 3, Santé 2.' },
    { id: 'silent', i: '🤫', n: 'Élim. silencieuse', c: 2, only: 'Snake', sfx: 'mgs-silent-takedown.mp3', kill: 1, tip: 'Seulement DANS LE DOS d\'un garde adjacent → jeton Mort.' },
    { id: 'disguise', i: '🥸', n: 'Déguisement', c: 2, only: 'Meryl', tip: 'Adjacente à un KO/Mort, et ton jeton Attention n\'est pas sur la carte.' },
    { id: 'drag', i: '🫳', n: 'Traîner corps', c: 1, noisy: 1, tip: 'Jeton KO/Mort sur/à côté de toi, bouge d\'1, pose-le à côté. 🔊' },
    { id: 'knock', i: '✊', n: 'Toquer', c: 1, sfx: 'mgs-knock-a.mp3', att: 1, tip: 'Ton jeton ? se pose sur ta case (ou y est déplacé).' },
    { id: 'interact', i: '🚪', n: 'Porte / objet', c: 1, auto: 'door', tip: 'Porte verrouillée : Snake lance 1 blanc + 2 noirs, relance en recommençant, TOUT dans le même tour.' },
    { id: 'elev', i: '🛗', n: 'Ascenseur', c: 1, auto: 'elevCall', then: 'elevator', tip: 'Interact : l\'ascenseur part avec toutes les figurines dedans (ton jeton Attention suit).' },
    { id: 'leap', i: '🤸', n: 'Saute un garde', c: 0, sfx: 'guard-whos-that_x8gyPDo.mp3', leap: 1, tip: 'Pendant un déplacement : chaque garde sauté t\'attaque (2 dés noirs, sans LOS) et ton jeton passe sur ! à la fin du mouvement.' },
    { id: 'focus', i: '🎯', n: 'Focus', c: 1, tip: 'Paie le coût écrit sur la face grise du jeton (ici 1 ; ajoute un jeton si coût 2).' },
    { id: 'pickup', i: '🎒', n: 'Objet trouvé', c: 0, auto: 'pop', then: 'pickup', tip: 'Un objet apparaît / est ramassé.' },
    { id: 'wall', i: '🧱', n: 'Dos au mur', c: 0, auto: 'wall', tip: 'Pour l\'ambiance : collé au mur après la course.' },
    { id: 'shoot', i: '🔫', n: 'Tir (SOCOM)', c: 1, sfx: 'mgs-socom.mp3', loud: 1, gun: 1, kill: 1, tip: 'LOUD : ton jeton passe sur ! sous toi. Dé ≥ Défense = 1 dégât.' },
    { id: 'shootS', i: '🔇', n: 'Tir silencieux', c: 1, sfx: 'mgs-socom-silenced.mp3', gun: 1, kill: 1, tip: 'Vérifie sur la carte s\'il est LOUD ou non.' },
    { id: 'famas', i: '🪖', n: 'FA-MAS', c: 1, sfx: 'mgs-fa-mas.mp3', loud: 1, gun: 1, kill: 1, tip: 'LOUD → ! sous toi.' },
    { id: 'gren', i: '💣', n: 'Grenade', c: 1, sfx: 'mgs-grenade.mp3', loud: 1, gun: 1, tip: 'LOUD → ! sous toi.' },
    { id: 'chaff', i: '✨', n: 'Chaff', c: 1, auto: 'chaff', then: 'chaffJam', gun: 1, tip: 'Voir la carte Équipement.' },
    { id: 'ration', i: '🍴', n: 'Ration', c: 1, auto: 'ration', tip: 'Voir la carte Équipement.' },
    { id: 'hack', i: '💻', n: 'Hack Terminal', c: 1, only: 'Otacon', tip: '4 dés noirs (+bonus), relance en recommençant ; combinaison du Terminal, tout dans le même tour.' },
    { id: 'search', i: '🔎', n: 'System Search', c: 1, only: 'Otacon', tip: 'Sur/à côté d\'un Terminal piraté : pioche 1 carte System (max 3).' },
    { id: 'access', i: '⚙️', n: 'Access Systems', c: 1, only: 'Otacon', tip: 'Jusqu\'à 4 dés noirs sur les cases des cartes System ; carte pleine → effet.' },
    { id: 'codec', i: '📞', n: 'Codec', c: 0, sfx: 'codec.mp3', tip: 'Cherche le numéro Codec dans le Codec Book (gratuit).' },
  ];
  const actsFor = p => ACTS.filter(a => (!a.only || a.only === p.name) && !(a.gun && p.name === 'Otacon'));
  const setAtt = (g, p, v, why, manual) => {
    const before = p.att;
    if (v === 1 && before === 2 && !manual) { toast('Ton jeton est déjà sur <b>!</b> : il se déplace sur ta case, il reste sur !'); return; }
    p.att = v;
    if (v === 2 && before !== 2) { A.sfx(AU().alert); toast(`🚨 ${p.name} : jeton <b>!</b> sous sa figurine${why ? ' (' + why + ')' : ''}. Tous les gardes de sa zone passent en ALERTE.`); }
    if (v === 1 && before === 0) { A.sfx(AU().investigate); toast(`❓ ${p.name} : jeton <b>?</b> posé. Le garde le plus proche viendra voir.`); }
    syncAlertMusic();
  };

  function nextPlayer(g) {
    const i = g.players.findIndex(x => !x.done);
    if (i >= 0) { g.cur = i; A.sfx(AU().codec); toast(`🎯 C'est à <b>${g.players[i].name}</b> de jouer.`); }
    else toast('✅ Tout le monde a joué → <b>Phase Ennemie</b>.');
  }

  function vPlay(m) {
    const g = game();
    const total = g.deck ? g.deck.red + g.deck.blue : 0, left = g.deck ? Math.max(0, total - g.deck.drawn) : 0;
    const anyAlert = g.players.some(p => p.att === 2), anyQ = g.players.some(p => p.att === 1);
    let h = `<div class="ma-top"><div class="ma-round">ROUND <span>${g.round}</span></div><span style="flex:1"></span>
      <button class="ma-b sm" data-a="undo" ${undo.length ? '' : 'disabled'}>↶ Annuler</button><button class="ma-b sm red" data-a="reset">↺ Recommencer</button></div>
      <div class="ma-ph">${['1 · Début', '2 · Joueurs', '3 · Ennemis'].map((t, i) => `<button class="ma-b ${g.phase === i ? 'on' : ''}" data-a="phase" data-v="${i}">${t}</button>`).join('')}</div>`;
    if (g.over === 'go') h += `<div class="ma-ban go">💀 MISSION ÉCHOUÉE</div>`;
    if (g.over === 'win') h += `<div class="ma-ban win">🏆 MISSION RÉUSSIE</div>`;
    if (g.deck) h += `<div class="ma-card"><h4>🃏 Chrono — paquet Guard Order : ${left} carte(s)</h4><div class="ma-deck">${Array.from({ length: total }, (_, i) => `<i class="${i < g.deck.drawn ? 'x' : (i < g.deck.blue ? 'b' : 'r')}"></i>`).join('')}</div>
      ${g.deck.drawn >= g.deck.blue ? '<b style="color:#ff8a96">Vous êtes dans les ROUGES : le temps presse !</b>' : `<span style="opacity:.75">Encore ${g.deck.blue - g.deck.drawn} bleue(s).</span>`}</div>`;
    if (isSneak(m)) h += `<div class="ma-card"><h4>💂 Gardes neutralisés</h4><div class="ma-cnt">
        <span class="chip">KO ★★</span><button class="ma-b sm" data-a="c" data-k="ko2" data-d="-1">−</button><span class="v">${g.ko2}</span><button class="ma-b sm" data-a="c" data-k="ko2" data-d="1">＋</button>
        <span class="chip">KO ★</span><button class="ma-b sm" data-a="c" data-k="ko1" data-d="-1">−</button><span class="v">${g.ko1}</span><button class="ma-b sm" data-a="c" data-k="ko1" data-d="1">＋</button>
        <span class="chip">☠ Morts</span><button class="ma-b sm" data-a="c" data-k="dead" data-d="-1">−</button><span class="v">${g.dead}</span><button class="ma-b sm" data-a="c" data-k="dead" data-d="1">＋</button>
        ${(m.legend && m.legend.cameras) ? `<span class="chip">📹 Caméras : ${g.cam === 'vert' ? '🟩 vert' : '🟧 orange'}</span>` : ''}</div>
        ${g.dead >= 3 ? `<p style="margin:6px 0 0;color:#ffd166">☠×${g.dead} : un « Lost Contact » brûlerait ${Math.floor(g.dead / 3)} carte(s).</p>` : ''}</div>`;

    if (g.phase === 0) {
      h += `<div class="ma-card"><h4>🔄 Début du round ${g.round}</h4><p>Chacun reprend ses <b>4 jetons Action</b>.</p><button class="ma-b pri" data-a="toPlayers">▶ Phase Joueurs</button></div>`;
    } else if (g.phase === 1) {
      const cur = g.players[g.cur || 0] && !g.players[g.cur || 0].done ? (g.cur || 0) : g.players.findIndex(x => !x.done);
      if (cur >= 0) {
        const cp = g.players[cur];
        h += `<div class="ma-turn"><div class="t">🎯 C'est à <b>${CE[cp.name] || ''} ${cp.name}</b> de jouer</div>
          <div class="how"><span>① Déplace ton <b>vrai pion</b> sur le plateau</span><span>② Touche l'<b>action</b> ici : elle coûte 1 ou 2 points</span><span>③ Tu as <b>4 points</b> (ronds bleus), même action plusieurs fois OK</span></div>
          ${g.players.length > 1 ? `<div class="who">${g.players.map((x, i) => `<button class="ma-b sm ${i === cur ? 'on' : ''}" data-a="who" data-v="${i}">${x.done ? '✔ ' : ''}${CE[x.name] || ''} ${x.name}</button>`).join('')}</div>` : ''}</div>
          <div class="ma-pl">${playerCard(m, g, cp, cur)}</div>`;
      } else {
        h += `<div class="ma-turn"><div class="t">✅ Tout le monde a joué</div><div class="how"><span>Place à l'ennemi.</span></div></div>`;
      }
      h += `<div style="margin-top:12px"><button class="ma-b pri" data-a="toEnemy">▶ Phase Ennemie</button></div>`;
    } else {
      h += enemyPhase(m, g, anyAlert, anyQ);
    }
    h += `<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="ma-b" data-a="win">🏆 Mission réussie</button><button class="ma-b red" data-a="lose">💀 Mission échouée</button></div>`;
    body.innerHTML = h;
  }

  function playerCard(m, g, p, i) {
    const ci = charInfo(p.name), hp = ci.stats ? ci.stats.hp : null;
    const acts = actsFor(p);
    return `<div class="ma-p ${p.done ? 'done' : ''}" style="--c:${ci.color || '#2a3474'}" data-p="${i}">
      <h5>${CE[p.name] || ''} ${p.name}${ci.stats ? `<span style="font-size:.8rem;opacity:.7">DÉF ${ci.stats.def}</span>` : ''}<span style="flex:1"></span>
        <span class="ma-hp">${hp ? Array.from({ length: hp }, (_, k) => `<i class="${k < p.dmg ? 'd' : ''}"></i>`).join('') : `💔 ${p.dmg}`}</span></h5>
      <div class="ma-att"><span style="opacity:.75">Attention</span><button class="ma-b sm ${p.att === 0 ? 'on' : ''}" data-a="att" data-v="0">—</button><button class="ma-b sm q ${p.att === 1 ? 'on' : ''}" data-a="att" data-v="1">?</button><button class="ma-b sm a ${p.att === 2 ? 'on' : ''}" data-a="att" data-v="2">!</button>
        <span style="flex:1"></span><button class="ma-b sm" data-a="dmg" data-v="-1">−</button><button class="ma-b sm red" data-a="dmg" data-v="1">💥 Dégât</button></div>
      <div class="ma-tok">${[0, 1, 2, 3].map(k => `<i class="${k < p.left ? '' : 'u'}"></i>`).join('')}<span style="opacity:.75;align-self:center;margin-left:6px;flex:1">${p.left} point${p.left > 1 ? 's' : ''}${p.noisy ? ` · 🔊×${p.noisy}` : ''}</span><button class="ma-b sm ${p.water ? 'on' : ''}" data-a="water" title="Le pion est dans l'eau : bruits de pas aquatiques">💧 Eau</button></div>
      ${p.ask ? askBox(p) : `<div class="ma-acts">${acts.map(a => `<button class="ma-act ${a.loud ? 'loud' : a.noisy ? 'noisy' : ''}" data-a="act" data-v="${a.id}" ${a.c > p.left || p.done ? 'disabled' : ''}><span class="i">${a.i}</span>${a.n}<small>${a.c ? a.c + ' action' + (a.c > 1 ? 's' : '') : 'gratuit'}${a.loud ? ' · LOUD' : a.noisy ? ' · 🔊' : ''}</small></button>`).join('')}</div>
      <div style="margin-top:8px"><button class="ma-b ${p.done ? '' : 'pri'}" data-a="end">${p.done ? '✔ Tour terminé' : '🏁 Fin du tour'}</button></div>`}</div>`;
  }
  function askBox(p) {
    if (p.ask === 'noise') return `<div class="ma-ask"><p>🔊 <b>Noise check</b> : y a-t-il un garde dans ta zone ? Si oui, lance <b>${p.noisy} dé(s) blanc(s)</b>.</p>
      <button class="ma-b red" data-a="noise" data-v="bang">« ! » obtenu</button> <button class="ma-b" data-a="noise" data-v="ok">Rien / pas de garde</button></div>`;
    if (p.ask === 'hurt') return `<div class="ma-ask"><p>⚠️ Le garde que tu as blessé est-il <b>toujours debout</b> (ni KO ni mort) ?</p>
      <button class="ma-b red" data-a="hurt" data-v="up">Oui → mon jeton passe sur !</button> <button class="ma-b" data-a="hurt" data-v="down">Non, je l'ai fini</button></div>`;
    if (p.ask === 'ko') return `<div class="ma-ask"><p>Résultat sur le garde (Défense 3, Santé 2) ?</p>
      <button class="ma-b pri" data-a="res" data-v="ko">⭐ KO (assommé)</button> <button class="ma-b" data-a="res" data-v="hurt">Blessé seulement</button> <button class="ma-b" data-a="res" data-v="miss">Raté</button></div>`;
    if (p.ask === 'kill') return `<div class="ma-ask"><p>Résultat sur la cible ?</p>
      <button class="ma-b pri" data-a="res" data-v="dead">☠ Garde éliminé</button> <button class="ma-b" data-a="res" data-v="hurt">Blessé seulement</button> <button class="ma-b" data-a="res" data-v="miss">Raté / boss</button></div>`;
    return '';
  }

  function camWidget(g) {
    // Mini-scène : la caméra regarde du côté de la couleur visible du jeton Camera Facing
    const right = g.cam === 'orange', anim = g.camAnim && Date.now() - g.camAnim < 1500;
    const cells = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) {
      const lit = y > 0 && (right ? x > 2 : x < 2);
      cells.push(`<rect x="${x * 30 + 1}" y="${y * 30 + 1}" width="28" height="28" rx="4" class="mcw-c ${lit ? 'lit' : ''}"/>`);
    }
    return `<svg class="mcw ${anim ? 'anim' : ''}" viewBox="0 0 150 92" aria-hidden="true">${cells.join('')}
      <g transform="translate(75,15)"><g class="mcw-cam" style="transform:rotate(${right ? -45 : 45}deg)"><rect x="-13" y="-10" width="26" height="20" rx="4" fill="${right ? '#ff9a3c' : '#2fd47a'}"/><path d="M 0 10 L -6 18 L 6 18 Z" fill="#fff"/></g></g></svg>`;
  }

  function enemyPhase(m, g, anyAlert, anyQ) {
    let h = '';
    if (isBoss(m)) {
      const vo = stageSnd(m).voices || [];
      h += `<div class="ma-card boss"><h4>👾 Tour du boss${m.boss ? ' : ' + esc(m.boss.name) : ''}</h4>
        <div class="ma-step cur"><span class="k">1</span><div class="bd">Retourne la carte du <b>dessus</b> du deck Boss et résous-la (+ règles du dashboard). Attaque sans nombre de dés → stat <b>Attaque</b> du dashboard ; le joueur lance contre <b>sa</b> Défense.<br><button class="ma-b pri" data-a="bossCard" style="margin-top:6px">🃏 Carte jouée${vo.length ? ' (+ voix)' : ''}</button> <span style="opacity:.7">${g.boss.cards} carte(s)</span></div></div>
        <div class="ma-step"><span class="k">2</span><div class="bd">Remets-la <b>sous</b> le deck. Jamais mélangé : le cycle se répète !</div></div>
        <div class="ma-cnt"><span class="chip">💥 Dégâts au boss</span><button class="ma-b sm" data-a="bd" data-v="-1">−</button><span class="v">${g.boss.dmg}</span><button class="ma-b sm" data-a="bd" data-v="1">＋1</button><button class="ma-b sm" data-a="bd" data-v="5">＋5</button>
          <span class="chip">📈 Menace</span><button class="ma-b sm" data-a="bt" data-v="-1">−</button><span class="v">${g.boss.threat}</span><button class="ma-b sm" data-a="bt" data-v="1">＋</button></div>
        ${m.boss && m.boss.health ? `<p style="opacity:.75">Santé du boss : ${m.boss.health}. Rappel : les dégâts KO comptent comme des dégâts normaux ; ses réactions se déclenchent à CHAQUE fois.</p>` : ''}
        <button class="ma-b" data-a="bossDown" style="margin-top:6px">💀 Boss vaincu</button></div>`;
      if (m.type === 'boss+sneak') h += `<p style="opacity:.8">Stage mixte : le boss joue <b>avant</b> les gardes (partie d'Otacon).</p>`;
    }
    if (isSneak(m)) {
      const s = g.step;
      const cls = k => s === k ? 'cur' : s > k ? 'ok' : '';
      const hasCam = m.legend && m.legend.cameras;
      h += `<div class="ma-card"><h4>🃏 Carte Guard Order — dans l'ordre</h4>
        <div class="ma-step ${cls(0)}"><span class="k">0</span><div class="bd">Pioche la carte du dessus. <b>GAME OVER</b> ? → mission ratée.<br>
          <button class="ma-b pri" data-a="draw" ${s > 0 ? 'disabled' : ''}>🃏 Carte piochée</button> <button class="ma-b red" data-a="gameover" ${s > 0 ? 'disabled' : ''}>💀 C'est GAME OVER</button></div></div>
        <div class="ma-step ${cls(1)}"><span class="k">I</span><div class="bd"><b>Action des gardes</b> : quelle icône sur la carte ?<br>
          <button class="ma-b" data-a="s1" data-v="waken" ${s !== 1 ? 'disabled' : ''}>✨ Réveil</button> <button class="ma-b" data-a="s1" data-v="radio" ${s !== 1 ? 'disabled' : ''}>📻 Radio-In</button>
          <button class="ma-b" data-a="s1" data-v="lost" ${s !== 1 ? 'disabled' : ''}>☠ Lost Contact</button> <button class="ma-b" data-a="s1" data-v="stay" ${s !== 1 ? 'disabled' : ''}>❓ Stay Alert</button></div></div>
        <div class="ma-step ${cls(2)}"><span class="k">II</span><div class="bd"><b>Caméras</b>${hasCam ? ` (actuellement ${g.cam === 'vert' ? '🟩 vert' : '🟧 orange'})` : ' : pas de caméra sur ce Stage → rien'}.<br>
          ${hasCam ? `${camWidget(g)}<button class="ma-b" data-a="cam" data-v="flip" ${s !== 2 ? 'disabled' : ''}>🔄 La carte dit de pivoter</button> <button class="ma-b" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>Pas de pivot</button><br><span style="opacity:.75">Puis vérifie la LOS de chaque caméra (pas sa propre case).</span><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${g.players.map((p, i) => `<button class="ma-b" data-a="camSeen" data-v="${i}">📹 Voit ${CE[p.name] || ''} ${p.name}</button>`).join('')}</div>` : `<button class="ma-b" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>OK</button>`}</div></div>
        <div class="ma-step ${cls(3)}"><span class="k">III</span><div class="bd"><b>Activer les gardes</b> des zones actives : zone la plus proche du jeton Guard Priority, puis de haut en bas, gauche à droite. Chaque garde choisit son mode <b>au début</b> de son activation :
          ${anyAlert ? `<div class="ma-mode al">🚨 Un <b>!</b> est posé : les gardes de SA zone sont en ALERTE → chiffre <b style="color:#ff6b7a">ROUGE</b>, vers le ! le plus proche.</div>` : ''}
          ${anyQ ? `<div class="ma-mode iv">❓ Un <b>?</b> est posé : le garde le plus proche (sans ! dans sa zone) enquête → chiffre <b style="color:#6fb0ff">BLEU</b>.</div>` : ''}
          <div class="ma-mode" style="border:1px solid #39407a">Sinon : il voit un KO/Mort (lui ou une caméra de sa zone) → enquête, bleu. Sinon PATROUILLE, bleu, tout droit.</div>
          <p style="margin:6px 0">Il s'arrête dès qu'il <b>voit</b> un joueur (→ ! + attaque : 2 dés noirs contre la Défense), qu'il <b>entre sur un jeton</b> (→ Guard Reaction), ou qu'il est bloqué.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${g.players.map((p, i) => `<button class="ma-b" data-a="seen" data-v="${i}">👁️ Voit ${CE[p.name] || ''} ${p.name}</button>`).join('')}
            <button class="ma-b" data-a="react">🃏 Guard Reaction</button><button class="ma-b" data-a="voice">🗣️ Voix de garde</button></div></div></div>
      </div>`;
    }
    h += `<button class="ma-b pri" data-a="nextRound">▶ Round ${g.round + 1}</button>`;
    return h;
  }

  /* ---------- actions de la partie ---------- */
  function onPlay(e) {
    const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || b.disabled) return;
    const m = mission(), g = game(), a = b.dataset.a, v = b.dataset.v;
    const pi = b.closest('[data-p]') ? +b.closest('[data-p]').dataset.p : -1, p = pi >= 0 ? g.players[pi] : null;
    if (a === 'undo') { const s = undo.pop(); if (s) { st.games[m.id] = JSON.parse(s); save(); syncAlertMusic(); render(); } return; }
    if (a === 'reset') { if (confirm('Recommencer la partie ?')) { snap(); st.games[m.id] = Object.assign(newGame(m, st.n), { n: st.n }); save(); render(); } return; }
    snap();
    switch (a) {
      case 'phase': g.phase = +v; if (g.phase === 2) g.step = 0; break;
      case 'toPlayers': g.players.forEach(x => { x.left = 4; x.noisy = 0; x.done = false; x.ask = null; x.hurt = false; }); g.phase = 1; g.cur = 0; A.sfx(AU().codec); break;
      case 'who': g.cur = +v; break;
      case 'water': p.water = !p.water; if (p.water) A.sfx(AU().water); break;
      case 'toEnemy': {
        const todo = g.players.filter(x => !x.done);
        if (todo.length && !confirm(`${todo.map(x => x.name).join(', ')} n'a pas fini son tour. Passer quand même ?`)) { undo.pop(); return; }
        g.phase = 2; g.step = 0; break;
      }
      case 'att': setAtt(g, p, +v, null, true); break;
      case 'dmg': {
        const d = +v; p.dmg = Math.max(0, p.dmg + d);
        if (d > 0) { A.sfx((AU().damage || {})[p.name]); const hp = (charInfo(p.name).stats || {}).hp; if (hp && p.dmg >= hp) { g.over = 'go'; A.sfx(AU().gameover); toast(`💀 ${p.name} est KIA : mission échouée.`, 4000); } }
        break;
      }
      case 'act': {
        const act = ACTS.find(x => x.id === v); if (!act || act.c > p.left) break;
        p.left -= act.c; if (act.noisy) p.noisy += act.c;
        if (act.sfx) A.sfx(act.sfx);
        if (act.auto) A.sfx(AU()[act.auto]);
        if (act.then) setTimeout(() => A.sfx(AU()[act.then]), 900);
        if (act.steps) { const k = p.water ? null : act.steps; if (p.water) A.sfx(AU().water); else { step(k); if (act.steps === 'dash') setTimeout(() => step(k), 380); } }
        toast(`${act.i} <b>${act.n}</b> — ${act.tip}`, 3200);
        if (act.loud) setAtt(g, p, 2, 'action LOUD');
        if (act.leap) setAtt(g, p, 2, 'saut par-dessus un garde');
        if (act.att) setAtt(g, p, 1);
        if (act.id === 'silent') g.dead++;
        if (act.ko) p.ask = 'ko';
        else if (act.kill && act.id !== 'silent') p.ask = 'kill';
        break;
      }
      case 'res': {
        if (v === 'ko') { g.ko2++; toast('⭐ Remplace le garde par un jeton <b>KO ★★</b>.'); }
        if (v === 'dead') { g.dead++; toast('☠ Remplace le garde par un jeton <b>Mort</b>.'); }
        if (v === 'hurt') { p.hurt = true; toast('⚠️ Garde blessé mais debout : s\'il n\'est pas KO/mort à la <b>fin de ton tour</b>, ton jeton passe sur <b>!</b>.', 4200); }
        p.ask = null; break;
      }
      case 'end': {
        if (p.done) { p.done = false; break; }
        if (p.hurt) p.ask = 'hurt';
        else if (p.noisy) p.ask = 'noise'; else { p.done = true; toast('🤫 Aucune action bruyante : pas de noise check.'); nextPlayer(g); }
        break;
      }
      case 'hurt': {
        if (v === 'up') setAtt(g, p, 2, 'garde blessé resté debout');
        p.hurt = false; p.ask = p.noisy ? 'noise' : null; if (!p.noisy) { p.done = true; nextPlayer(g); } break;
      }
      case 'noise': {
        if (v === 'bang') { if (p.att === 0) setAtt(g, p, 1); else toast('Ton jeton Attention se déplace sur ta case (sans changer de face).'); }
        p.ask = null; p.done = true; nextPlayer(g); break;
      }
      case 'c': g[b.dataset.k] = Math.max(0, g[b.dataset.k] + +b.dataset.d); break;
      case 'draw': if (g.deck) g.deck.drawn++; g.step = 1; break;
      case 'gameover': g.over = 'go'; A.sfx(AU().gameover); toast('💀 GAME OVER : le temps est écoulé.', 4000); break;
      case 's1': {
        if (v === 'waken') { const up = g.ko1; g.ko1 = g.ko2; g.ko2 = 0; toast(`✨ Réveil (zones actives) : ${up} garde(s) ★ se relèvent (place la figurine, sans faire face à un mur), les ★★ passent à ★.`, 4500); A.sfx('guard-whered-he-go_zHLpH97.mp3'); }
        if (v === 'radio') { toast('📻 Radio-In : dans chaque zone active, complète jusqu\'au Guard Count du Barracks (sur l\'icône radio, un par un). Les KO/Morts ne comptent pas.', 5000); A.sfx('guard-return-to-your-positions_9aocsFp.mp3'); }
        if (v === 'lost') { const n = Math.floor(g.dead / 3); if (g.deck) g.deck.drawn += n; toast(n ? `☠ Lost Contact : ${n} carte(s) brûlée(s) (révélées et mises dessous). Si c'est Game Over → perdu !` : '☠ Lost Contact : moins de 3 morts, rien ne se passe.', 4500); }
        if (v === 'stay') { toast('❓ Stay Alert : chaque joueur à ≤ 2 cases d\'un garde (sans obstacle) pose son jeton ? (s\'il n\'est pas déjà sur la carte). Mets-le à jour sur sa fiche.', 5000); }
        g.step = 2; break;
      }
      case 'cam': if (v === 'flip') { g.cam = g.cam === 'vert' ? 'orange' : 'vert'; A.sfx(AU().camRotate); g.camAnim = Date.now(); } g.step = 3; break;
      case 'camSeen': { const q = g.players[+v]; A.sfx(AU().camSpot); setTimeout(() => setAtt(g, q, 2, 'vu par une caméra'), 700); setTimeout(() => { save(); render(); }, 750); toast(`📹 La caméra repère ${q.name} → ALERTE dans la zone.`, 3500); break; }
      case 'seen': { const q = g.players[+v]; A.sfx('guard-there-he-is_JHZ7rPO.mp3'); setAtt(g, q, 2, 'vu par un garde'); toast(`👁️ Le garde s'arrête et attaque ${q.name} : il lance 2 dés noirs contre sa Défense. Ajoute les dégâts sur sa fiche (Phase Joueurs ou ici via 💥).`, 4500); break; }
      case 'react': A.sfx('guard-what-was-that-noise_IVtXtq7.mp3'); toast('🃏 Guard Reaction : pioche une carte, résous chaque jeton de la case (haut → bas). Puis le garde termine son mouvement.', 4500); break;
      case 'voice': { const g2 = (SND().groups || []).find(x => x.t === 'Gardes'); if (g2) A.sfx(g2.sfx[Math.floor(Math.random() * g2.sfx.length)][0]); break; }
      case 'bossCard': { g.boss.cards++; const vo = stageSnd(m).voices || []; const pick = vo.filter(x => !/death|vaincu|abattu/i.test(x[0] + x[1])); if (pick.length) A.sfx(pick[Math.floor(Math.random() * pick.length)][0]); break; }
      case 'bd': g.boss.dmg = Math.max(0, g.boss.dmg + +v); if (+v > 0) { const vo = (stageSnd(m).voices || []).filter(x => /^(hind-hurt|tank hurt)/i.test(x[0])); if (vo.length) A.sfx(vo[Math.floor(Math.random() * vo.length)][0]); } break;
      case 'bt': g.boss.threat = Math.max(0, g.boss.threat + +v); break;
      case 'bossDown': { const d = (stageSnd(m).voices || []).find(x => /death/i.test(x[0])); A.sfx(d ? d[0] : AU().win); setTimeout(() => A.sfx(AU().win), 1600); toast('💀 Boss vaincu !'); break; }
      case 'nextRound': g.round++; g.phase = 0; g.step = 0; break;
      case 'win': { g.over = 'win'; A.sfx(AU().win); const cl = LS.get('mgsg.cleared', {}); cl[m.id] = true; LS.set('mgsg.cleared', cl); toast('🏆 Mission réussie ! (marquée dans le guide)', 3500); break; }
      case 'lose': g.over = 'go'; A.sfx(AU().gameover); break;
      default: undo.pop(); return;
    }
    save(); render();
  }

  /* ---------- 🔊 Sons ---------- */
  function vSnd(m) {
    const ss = stageSnd(m), S = SND();
    const cur = A.cur;
    const mus = (arr, cls = 'mu') => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="${cls} ${cur === f ? 'cur' : ''}" data-mu="${esc(f)}">🎵 ${esc(t)}</button>`).join('')}</div>`;
    const sfx = (arr, cls = '') => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="${cls}" data-sx="${esc(f)}">${esc(t)}</button>`).join('')}</div>`;
    body.innerHTML = `<div class="ma-h3">🎵 Musiques de la mission</div>${ss.music && ss.music.length ? mus(ss.music) : '<p style="opacity:.6">—</p>'}
      <div class="ma-h3">🚨 Alerte / ⏳ Brief</div>${mus([...(S.alert || []), ...(S.setup || [])])}
      ${ss.voices && ss.voices.length ? `<div class="ma-h3">🗣️ Voix du boss</div>${sfx(ss.voices, 'vo')}` : ''}
      ${ss.sfx && ss.sfx.length ? `<div class="ma-h3">⭐ Spécial mission</div>${sfx(ss.sfx)}` : ''}
      ${(S.groups || []).map(g => `<div class="ma-h3">${g.ic} ${g.t}</div>${sfx(g.sfx)}`).join('')}`;
  }
  function onSnd(e) {
    const mu = e.target.closest('[data-mu]'), sx = e.target.closest('[data-sx]');
    if (mu) { const al = (SND().alert || []).some(x => x[0] === mu.dataset.mu); A.music(mu.dataset.mu, al ? 'alert' : 'mission'); render(); }
    if (sx) A.sfx(sx.dataset.sx);
  }

  /* ---------- ouverture ---------- */
  function open(opts = {}) {
    build();
    if (opts.mid != null) { st.mid = opts.mid; }
    if (opts.tab) st.tab = opts.tab;
    save(); render();
    root.classList.add('show'); document.documentElement.style.overflow = 'hidden';
  }
  function close() { root.classList.remove('show'); document.documentElement.style.overflow = ''; }
  document.addEventListener('click', e => { if (!root || !root.classList.contains('show')) return; if (st.tab === 'play') onPlay(e); if (st.tab === 'snd') onSnd(e); });
  window.MGSAssistant = { open, close };

  // Boutons d'ouverture déclarés dans la page : <button data-mgs-assistant>
  const bind = () => document.querySelectorAll('[data-mgs-assistant]').forEach(b => b.addEventListener('click', () => open()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
