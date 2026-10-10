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
  const tx = window.tx || ((fr) => fr);   // i18n.js : tx('FR', 'EN')
  const EN = window.MGS_LANG === 'en';
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
  const defOf = n => { const g = st.games && st.games[st.mid], p = g && g.players && g.players.find(x => x.name === n); return ((charInfo(n).stats || {}).def || 3) + (p && p.inv ? p.inv.reduce((s, i) => s + ((i.num && CARDS[i.num] && CARDS[i.num].def) || 0), 0) : 0); };
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
  const ITYPES = { ration: ['🍴', 'Ration', 1], chaff: ['✨', 'Chaff', 1], grenade: ['💣', 'Grenade', 1], gun: ['🔫', tx('Arme', 'Weapon'), null], sgun: ['🔇', tx('Arme silencieuse', 'Silenced weapon'), null], other: ['🎒', tx('Autre', 'Other'), null] };
  const START_GEAR = {
    'Meryl': [[tx('Pistolet (.50)', 'Handgun (.50 cal)'), 'gun'], [tx('Fusil d\'assaut léger', 'Light Assault Rifle'), 'gun']],
    'Gray Fox': [['Stealth Camouflage', 'other'], ['High-Frequency Blade', 'other'], ['Arm Cannon', 'gun']],
    'Otacon': [['ADV. Stealth Camouflage', 'other'], ['Rations', 'ration']],
  };
  const EQUIP_LIMIT = 3, BOX_MAX = 32;
  /* Cartes Équipement (relevées sur les cartes du jeu, n° « ITEM 0NN »).
     kind = ce que l'assistant sait en faire ; cost = actions ; dice = dés lancés ; uses = munitions / jetons / doses ;
     cls = pistol | rifle (pour les silencieux) ; only = personnages autorisés ; codec = fiche du Codec Book. */
  const RATION_C = { name: 'Rations', type: 'ration', kind: 'heal', cost: 1, uses: 1, ic: '🍴', codec: '05.13', tip: tx('Retire jusqu\'à 2 dégâts, puis défausse la carte.', 'Discard up to 2 damage, then discard this card.') };
  const BOX_C = { type: 'other', kind: 'box', cost: 1, ic: '📦', codec: '06.02', tip: tx('Hors LOS d\'un garde / d\'une caméra : remplace ta figurine par le carton. Les gardes te prennent pour un garde. Tu ressors si tu sautes un garde, entres dans une LOS ou fais autre chose que Sneak / Dash / Focus ; un garde qui finit adjacent et face à toi te démasque.', 'If not in LOS of a Guard or Camera, swap your figure for the Cardboard Box. Guards and Cameras treat you as a Guard. You pop out if you leapfrog a Guard, move into or through a LOS, or do anything other than Sneak / Dash / Focus; a Guard ending its move adjacent and facing you uncovers you.') };
  const CARDS = {
    1: { name: tx('Pistolet (.45)', 'Pistol (.45 cal)'), type: 'gun', kind: 'shoot', cls: 'pistol', cost: 1, dice: ['w'], ic: '🔫', codec: '02.01', tip: tx('Attaque une cible en LOS (1 dé). LOUD. Munitions illimitées.', 'Attack a target in LOS (1 die). LOUD. Unlimited ammo.') },
    2: RATION_C, 6: RATION_C, 12: RATION_C, 15: RATION_C,
    3: { name: tx('Grenade chaff', 'Chaff Grenade'), type: 'chaff', kind: 'chaff', cost: 1, uses: 1, ic: '✨', codec: '05.12', tip: tx('Jusqu\'à la fin du round : caméras et capteurs ignorés dans la zone. Garde dans ta zone → tu attires l\'attention (?). Puis défausse.', 'Until the end of the round, players ignore Cameras and Sensors in this zone. Guard in your zone → you Draw Attention (?). Then discard.') },
    4: { name: tx('Grenade incapacitante', 'Stun Grenade'), type: 'grenade', kind: 'stun', cost: 1, uses: 1, ic: '💥', codec: '07.08', tip: tx('Case en LOS à 5 cases max : chaque garde à 2 cases (en LOS de la case) devient KO ★. LOUD. Puis défausse. Sans effet sur les VR Boss.', 'Target a space in LOS within 5: each Guard within 2 spaces (in LOS of it) becomes KO ★. LOUD. Then discard. No effect on VR Bosses.') },
    5: { name: 'C-4', type: 'other', kind: 'c4', cost: 1, uses: 2, ic: '🧨', codec: '02.06', tip: tx('Poser (1) : un C-4 sur une case adjacente. Faire sauter (1) : chaque C-4 inflige 2 dégâts à toute figurine à 1 case en LOS ; gardes dans la zone et pas de ! → ton ! sur le C-4 le plus proche.', 'Plant (1): one C-4 in an adjacent space. Detonate (1): each C-4 deals 2 damage to each figure within 1 space in LOS; Guards in that zone and your ! not on the map → place it on the nearest C-4.') },
    7: { name: 'Grenade', type: 'grenade', kind: 'frag', cost: 1, uses: 1, ic: '💣', codec: '02.06', tip: tx('Case en LOS à 5 cases max : 2 dégâts à toutes les figurines à 2 cases (en LOS de la case). LOUD. Puis défausse.', 'Target a space in LOS within 5: 2 damage to all figures within 2 spaces (in LOS of it). LOUD. Then discard.') },
    8: { name: tx('Mines Claymore', 'Claymore Mines'), type: 'other', kind: 'plant', cost: 1, uses: 2, ic: '🪤', codec: '02.06', tip: tx('Pose sur une case adjacente. Une figurine qui y entre : 2 dégâts à chaque figurine à 2 cases en LOS ; gardes dans la zone et pas de ! → ton ! sur la mine.', 'Plant in an adjacent space. When a figure moves into it: 2 damage to each figure within 2 spaces in LOS; Guards in that zone and your ! not on the map → place it on the mine.') },
    9: { name: 'Nikita', type: 'other', kind: 'missile', cost: 1, uses: 3, dice: ['w', 'w', 'w'], ic: '🚀', codec: '06.01', tip: tx('Missile posé à côté, puis 2 dés noirs : avance du résultat d\'un dé dans une direction, puis (option) de l\'autre. Obstacle / figurine → attaque (3 dés) toutes les figurines à 1 case. LOUD.', 'Place the missile adjacent, roll 2 black dice: move it one result in any direction, then (optionally) the other. Obstacle / figure → attack (3 dice) all figures within 1 space. LOUD.') },
    10: Object.assign({ name: tx('Carton A', 'Cardboard Box A') }, BOX_C), 27: Object.assign({ name: tx('Carton B', 'Cardboard Box B') }, BOX_C),
    11: { name: tx('Médicament', 'Medicine'), type: 'other', kind: 'free', cost: 0, uses: 1, ic: '💊', codec: '06.03', tip: tx('À tout moment de ton tour : rafraîchit tous tes jetons Focus. Puis défausse.', 'Anytime during your turn: refresh all your Focus tokens. Then discard.') },
    13: { name: tx('Carte magnétique niv. 3', 'Card Key Level 3'), type: 'other', kind: 'key', cost: 1, uses: 1, ic: '💳', codec: '06.06', tip: tx('Ouvre une porte jusqu\'au niveau 3 sur ta case. Puis défausse.', 'Unlock a door up to Level 3 in your space. Then discard.') },
    14: { name: tx('Masque à gaz', 'Gas Mask'), type: 'other', kind: 'scan', cost: 1, ic: '😷', codec: '06.05', tip: tx('Ignore le gaz. Télépathie résiduelle (1) : regarde la carte du dessus Guard Order ou Guard Reaction puis remets-la.', 'Ignore Poison Gas. Residual Telepathy (1): reveal the top Guard Order or Guard Reaction card, then put it back.') },
    16: { name: tx('Corde', 'Rope'), type: 'other', kind: 'rope', cost: 1, uses: 5, ic: '🪢', codec: '06.07', tip: tx('Ligote un garde KO adjacent : il ignore les Réveils. Un garde qui marche sur la corde la retire.', 'Tie up an adjacent KO\'d Guard: it ignores Waken. A Guard moving onto the rope removes it.') },
    17: { name: tx('Lance-missile', 'Missile Launcher'), type: 'other', kind: 'missile', cost: 1, uses: 3, dice: ['w', 'w', 'w'], ic: '🚀', codec: '06.08', tip: tx('Le missile part tout droit jusqu\'à un obstacle ou une figurine, puis attaque (3 dés) toutes les figurines à 1 case en LOS. LOUD.', 'The missile flies straight until it hits an obstacle or a figure, then attacks (3 dice) all figures within 1 space in LOS. LOUD.') },
    18: { name: tx('Fusil de sniper', 'Sniper Rifle'), type: 'gun', kind: 'shoot', cls: 'rifle', cost: 2, dice: ['w', 'w', 'w'], uses: 6, ic: '🎯', codec: '05.10', tip: tx('1 munition : attaque une cible en LOS (3 dés). 2 actions. LOUD.', '1 ammo: attack a target in LOS (3 dice). 2 actions. LOUD.') },
    19: { name: tx('Pentazémine', 'Pentazemin'), type: 'other', kind: 'free', cost: 0, uses: 2, ic: '💊', codec: '06.09', tip: tx('1 dose à tout moment : jusqu\'à la fin du tour, chaque jet peut relancer les dés voulus une fois.', '1 pill anytime: until the end of your turn, you may reroll any number of dice once on each roll.') },
    20: { name: tx('Mouchoir', 'Handkerchief'), type: 'other', kind: 'passive', only: ['Otacon'], ic: '🧣', codec: '06.11', tip: tx('1×/round : modifie un dé noir de ±1 quand tu pirates.', 'Once per round: modify a single black die by ±1 when hacking.') },
    21: { name: tx('Gilet pare-balles', 'Body Armor'), type: 'other', kind: 'passive', def: 1, only: ['Snake', 'Meryl'], ic: '🦺', codec: '06.12', tip: tx('Défense +1 (appliquée aux attaques des gardes).', 'Defense +1 (applied to Guard attacks).') },
    22: { name: tx('Carte magnétique niv. 4', 'Card Key Level 4'), type: 'other', kind: 'key', cost: 1, uses: 1, ic: '💳', codec: '06.06', tip: tx('Ouvre une porte jusqu\'au niveau 4 sur ta case. Puis défausse.', 'Unlock a door up to Level 4 in your space. Then discard.') },
    23: { name: 'Bandana', type: 'other', kind: 'passive', only: ['Snake'], ic: '🎽', codec: '07.05', tip: tx('Tes armes ne consomment plus de munitions.', 'You do not discard ammo when using weapons.') },
    24: { name: tx('Silencieux de pistolet', 'Pistol Suppressor'), type: 'other', kind: 'passive', sil: 'pistol', ic: '🔇', codec: '07.01', tip: tx('Le pistolet n\'est plus LOUD.', 'Ignore LOUD on the Pistol.') },
    25: { name: tx('Fusil d\'assaut', 'Assault Rifle'), type: 'gun', kind: 'shoot', cls: 'rifle', cost: 1, dice: ['w', 'w'], uses: 6, ic: '🔫', codec: '05.10', tip: tx('1 munition : attaque une cible en LOS (2 dés). LOUD.', '1 ammo: attack a target in LOS (2 dice). LOUD.') },
    26: { name: tx('Bombe à retardement', 'Time Bomb'), type: 'other', kind: 'plant', cost: 1, uses: 1, ic: '⏲️', codec: '02.06', tip: tx('Pose-la à côté. Au début de ton tour suivant : 3 dégâts à toutes les figurines à 2 cases en LOS ; gardes dans la zone et pas de ! → ton ! dessous.', 'Drop it in an adjacent space. At the start of your next turn: 3 damage to all figures within 2 spaces in LOS; Guards in your zone and your ! not on the map → place it under the bomb.') },
    28: { name: tx('Lunettes de vision nocturne', 'Night Vision Goggles'), type: 'other', kind: 'scan', cost: 1, ic: '🥽', codec: '07.04', tip: tx('Ignore les capteurs laser. Repérage (1) : retourne tous les jetons ? face cachée à 5 cases.', 'Ignore Laser Sensor Traps. Scout (1): flip all facedown ? tokens within 5 spaces.') },
    29: { name: tx('Lunettes thermiques', 'Thermal Goggles'), type: 'other', kind: 'scan', cost: 2, ic: '🥽', codec: '07.04', tip: tx('Ignore les capteurs laser. Scan (2) : retourne 1 jeton ? face cachée de ta zone, même derrière une porte.', 'Ignore Laser Sensor Traps. Scan (2): flip any 1 facedown ? token in your zone, even behind a door.') },
    30: { name: tx('Camouflage optique', 'Stealth Camouflage'), type: 'other', kind: 'stealth', cost: 1, uses: 2, ic: '👻', codec: '07.02', tip: tx('1 charge : jusqu\'à la fin du tour, pas de ! quand tu es dans la LOS d\'un garde ou d\'une caméra, et les gardes sautés n\'attaquent pas. Le bruit compte toujours.', '1 charge: until the end of your turn, you don\'t place your ! when in LOS of a Guard or Camera, and leapfrogged Guards don\'t attack. Noise still counts.') },
    31: { name: tx('Carte PAL', 'PAL Card Key'), type: 'other', kind: 'passive', ic: '🗝️', codec: '07.06', tip: tx('Relance 1 dé à chaque jet pour déverrouiller une porte.', 'Reroll 1 die each time you roll to unlock a door.') },
    32: { name: tx('Silencieux de fusil', 'Rifle Suppressor'), type: 'other', kind: 'passive', sil: 'rifle', ic: '🔇', codec: '07.01', tip: tx('Le fusil n\'est plus LOUD.', 'Ignore LOUD on the Rifle.') },
  };
  const cardInfo = n => CARDS[n] || LS.get('mgsg.cards', {})[n] || null;
  const mkCard = (n, kn) => Object.assign(mkItem(kn.name, kn.type, n), { uses: kn.uses != null ? kn.uses : null }, kn.ic ? { ic: kn.ic } : {});
  const hasCard = (p, n) => !!(p && p.inv && p.inv.some(i => i.num === n));
  const icOf = i => i.ic || ITYPES[i.type][0];
  const nameOf = i => (i.num && CARDS[i.num] ? CARDS[i.num].name : i.name);
  const mkItem = (name, type, num) => ({ id: 'i' + Math.random().toString(36).slice(2, 8), name, type, num: num || null, uses: ITYPES[type][2] });
  function startInv(m, name) {
    const inv = (START_GEAR[name] || []).map(([n, t]) => mkItem(n, t));
    if (m && m.id === 5) inv.push(Object.assign(mkItem(tx('Grenades (Special Action)', 'Grenades (Special Action)'), 'grenade'), { uses: 2 }));
    return inv;
  }
  const hasItem = (p, type) => !p.inv || p.inv.some(i => i.type === type && (i.uses == null || i.uses > 0));
  function useItem(p, type) {
    if (!p.inv) return;
    const it = p.inv.find(i => i.type === type && (i.uses == null || i.uses > 0)); if (!it || it.uses == null) return;
    it.uses--;
    if (it.uses <= 0) { p.inv = p.inv.filter(x => x !== it); toast(`${ITYPES[type][0]} <b>${esc(nameOf(it))}</b> ${tx('épuisé : défausse la carte (elle reste dans la Memory Box).', 'used up: discard the card (it stays in the Memory Box).')}`, 3500); }
  }
  function invChips(p) {
    if (!p.inv) return `<span style="opacity:.6">${tx('équipement non renseigné', 'equipment not set')}</span>`;
    return p.inv.length ? p.inv.map(i => `<span class="chip ${i.uses === 0 ? 'off' : ''}">${icOf(i)} ${esc(nameOf(i))}${i.uses != null ? ' ×' + i.uses : ''}</span>`).join('') : `<span style="opacity:.6">${tx('aucun objet', 'no items')}</span>`;
  }
  // 📦 Memory Box (numéros possédés, mémorisés) + 🎒 répartition des cartes entre personnages (glisser-déposer)
  const ownedSet = () => new Set(LS.get('mgsg.box', []));
  const limitOf = name => (charInfo(name).stats || {}).equip || EQUIP_LIMIT;
  function invEditor(m, g) {
    const own = ownedSet();
    g.players.forEach(p => (p.inv || []).forEach(i => { if (i.num) own.add(i.num); }));   // une carte attribuée est forcément possédée
    const num3 = n => '#' + String(n).padStart(3, '0');
    const assigned = new Set(g.players.flatMap(p => (p.inv || []).filter(i => i.num).map(i => i.num)));
    const sel = ui.cardSel || '';
    const grid = Array.from({ length: BOX_MAX }, (_, k) => { const n = k + 1; return `<button class="ma-b sm num ${own.has(n) ? 'on' : ''}" data-a="boxOwn" data-v="${n}">${String(n).padStart(3, '0')}</button>`; }).join('');
    const chip = (key, from, ic, label, nm, extra, tip) => `<div class="ma-cc ${sel === key + '|' + from ? 'sel' : ''}" data-card="${key}" data-from="${from}" title="${esc(tip || '')}"><span class="ic">${ic}</span><b>${label}</b><span class="nm">${esc(nm)}</span>${extra || ''}</div>`;
    const boxItems = [...own].filter(n => CARDS[n] && !assigned.has(n)).sort((a, b) => a - b)
      .map(n => chip('n' + n, 'box', CARDS[n].ic, num3(n), CARDS[n].name, '', CARDS[n].tip)).join('');
    const cols = g.players.map((p, pi) => {
      const items = p.inv || [], lim = limitOf(p.name), sure = !!(charInfo(p.name).stats || {}).equip;
      const startMissing = (START_GEAR[p.name] || []).some(([nm]) => !items.some(i => !i.num && i.name === nm));
      return `<div class="ma-col" data-col="${pi}"><div class="ma-colh">${CE[p.name] || ''} <b>${p.name}</b><span style="flex:1"></span><span class="${items.length > lim ? 'warn' : ''}">${items.length}/${lim}${sure ? '' : '?'}</span></div>
        ${items.map(it => chip(it.id, pi, icOf(it), it.num ? num3(it.num) : '★', nameOf(it), it.uses != null ? `<small>×${it.uses}</small>` : '', it.num && CARDS[it.num] ? CARDS[it.num].tip + (CARDS[it.num].codec ? ' — Codec ' + CARDS[it.num].codec : '') : tx('Équipement de départ du personnage', 'Character starting equipment'))).join('') || `<p class="ma-mut">${p.name === 'Snake' ? tx('rien au départ (On-Site Procurement)', 'nothing at start (On-Site Procurement)') : tx('vide', 'empty')}</p>`}
        ${startMissing ? `<button class="ma-b sm" data-a="invStart" data-p="${pi}">↺ ${tx('équipement de départ', 'starting equipment')}</button>` : ''}</div>`;
    }).join('');
    return `<div class="ma-boxown"><div class="ma-colh">📦 <b>Memory Box</b><span class="ma-mut" style="margin-left:6px">${tx('touche les numéros des cartes que tu as débloquées (mémorisé pour les prochaines missions)', 'tap the numbers of the cards you have unlocked (remembered for future missions)')}</span></div><div class="ma-inv-add">${grid}</div></div>
      <p class="ma-mut" style="margin:8px 0 4px">🎒 ${tx('Répartis les cartes : fais-les glisser vers un personnage (ou touche une carte, puis une colonne). Tout se décide en début de stage : pas d\'échange pendant la mission.', 'Split the cards: drag them to a character (or tap a card, then a column). Everything is decided at the start of the Stage: no trading during the mission.')}</p>
      <div class="ma-dnd"><div class="ma-col box" data-col="box"><div class="ma-colh">📦 <b>Memory Box</b><span style="flex:1"></span><span>${[...own].filter(n => !assigned.has(n)).length}</span></div>${boxItems || `<p class="ma-mut">${own.size ? tx('tout est attribué', 'everything is assigned') : tx('coche d\'abord tes numéros ci-dessus', 'tick your card numbers above first')}</p>`}</div>${cols}</div>`;
  }
  // déplace une carte : de la Memory Box vers un personnage, d'un personnage à l'autre, ou retour à la Memory Box
  function moveCard(key, from, to) {
    const g = game(); if (!g || String(from) === String(to)) { ui.cardSel = null; return render(); }
    let it = null, num = null;
    if (key[0] === 'n' && from === 'box') num = +key.slice(1);
    else { const src = g.players[+from]; it = src && (src.inv || []).find(i => i.id === key); if (!it) { ui.cardSel = null; return render(); } num = it.num; }
    if (to !== 'box') {
      const q = g.players[+to];
      if (it && !it.num) { toast(tx('★ Équipement de départ : il reste à son personnage (retire-le pour le remplacer).', '★ Starting equipment stays with its character (remove it to swap it out).')); ui.cardSel = null; return render(); }
      const cd = CARDS[num]; if (cd && cd.only && !cd.only.includes(q.name)) { toast(`⛔ ${esc(cd.name)} : ${tx('réservé à', 'only for')} ${cd.only.join(' / ')}.`); ui.cardSel = null; return render(); }
      if (it) g.players[+from].inv = g.players[+from].inv.filter(i => i !== it);
      q.inv = q.inv || []; q.inv.push(it || mkCard(num, CARDS[num]));
      if (q.inv.length > limitOf(q.name)) toast(tx(`⚠️ ${q.name} dépasse sa limite d'équipement (${limitOf(q.name)}).`, `⚠️ ${q.name} is over their equipment limit (${limitOf(q.name)}).`));
    } else if (it) g.players[+from].inv = g.players[+from].inv.filter(i => i !== it);
    ui.cardSel = null; save(); render();
  }
  let dndBound = false;
  function bindDnD() {
    if (dndBound) return; dndBound = true;
    let d = null;
    root.addEventListener('pointerdown', e => { const ch = e.target.closest('.ma-cc'); if (!ch) return; d = { el: ch, x: e.clientX, y: e.clientY, ghost: null, key: ch.dataset.card, from: ch.dataset.from }; });
    root.addEventListener('pointermove', e => {
      if (!d) return;
      if (!d.ghost && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) { d.ghost = d.el.cloneNode(true); d.ghost.classList.add('ghost'); document.body.appendChild(d.ghost); d.el.style.opacity = '.35'; }
      if (d.ghost) { d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; const t = document.elementFromPoint(e.clientX, e.clientY), col = t && t.closest('[data-col]'); root.querySelectorAll('.ma-col.over').forEach(x => x.classList.remove('over')); if (col) col.classList.add('over'); e.preventDefault(); }
    });
    root.addEventListener('pointerup', e => {
      if (!d) return; const dd = d; d = null;
      if (!dd.ghost) { const k = dd.key + '|' + dd.from; ui.cardSel = ui.cardSel === k ? null : k; return render(); }
      dd.ghost.remove(); const t = document.elementFromPoint(e.clientX, e.clientY), col = t && t.closest('[data-col]');
      if (col) moveCard(dd.key, dd.from, col.dataset.col); else render();
    });
    root.addEventListener('pointercancel', () => { if (d && d.ghost) d.ghost.remove(); d = null; render(); });
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
    if (isGrid(m)) { obj.pieces = gridPieces(m, n); obj.gridV = gridVer(m); obj.grid = true; obj.elev = GRID(m).elevStart || false; obj.doors = {}; obj.card = { red: 6, blue: 4, arrow: 'right' }; }
    return obj;
  }
  const gridVer = m => { const s = JSON.stringify(GRID(m)); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  const game = () => {
    const m = mission(); if (!m) return null;
    if (!st.games[m.id] || st.games[m.id].n !== st.n) st.games[m.id] = newGame(m, st.n);
    const gg = st.games[m.id]; if (!gg.started) gg.players.forEach(p => { if (!p.inv) p.inv = startInv(m, p.name); });
    // plan recalé depuis la création de la partie (pas encore commencée) : on replace les pions selon le livret
    if (isGrid(m) && !gg.started && gg.gridV !== gridVer(m)) { gg.pieces = gridPieces(m, gg.n); gg.gridV = gridVer(m); }
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
    else if (!alert && A.mode === 'alert') { A.sfx(AU().clearAlarm); log(tx('✅ Fin de l\'alerte', '✅ Alert over'), 'alert'); setTimeout(() => A.music(missionTrack(m), 'mission'), 900); }
  }


  /* ======================= Mode QUADRILLAGE (missions numérisées) ======================= */
  const GRID = m => (window.MGS_GRIDS || {})[m.id] || null;
  const isGrid = m => !!(m && GRID(m) && window.MGSGrid);
  const worlds = {};
  const fixOf = m => Object.assign({ walls: [], cells: {}, turns: {}, spirals: [] }, LS.get('mgsg.fix.' + m.id, {}));
  const world = m => {
    if (worlds[m.id]) return worlds[m.id];
    const W = window.MGSGrid.build(GRID(m)), fx = fixOf(m);
    Object.entries(fx.cells || {}).forEach(([k, v]) => { if (v === ' ') delete W.cells[k]; else W.cells[k] = v; });
    (fx.walls || []).forEach(k => { if (W.walls.has(k)) W.walls.delete(k); else W.walls.add(k); });
    Object.entries(fx.turns || {}).forEach(([k, v]) => { if (v) W.turns[k] = v; else delete W.turns[k]; });
    (fx.spirals || []).forEach(k => { if (W.spirals.has(k)) W.spirals.delete(k); else W.spirals.add(k); });
    return (worlds[m.id] = W);
  };
  function toggleFix(m, kind, key, val) {
    const fx = fixOf(m);
    if (kind === 'wall') { const i = fx.walls.indexOf(key); if (i >= 0) fx.walls.splice(i, 1); else fx.walls.push(key); }
    else if (kind === 'spiral') { const i = fx.spirals.indexOf(key); if (i >= 0) fx.spirals.splice(i, 1); else fx.spirals.push(key); }
    else if (kind === 'turn') { const base = window.MGSGrid.build(GRID(m)).turns[key] || ''; if (val === base) delete fx.turns[key]; else fx.turns[key] = val; }
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
    // ce que l'assistant a compris du plateau : sortie, objectif, Barracks, ascenseurs, No Fire Zone
    (d.exits || []).forEach(([x, y]) => { const px = GG().pix(W, x, y); if (px) hl.push(`<g class="gexit" transform="translate(${px.cx},${px.cy})"><rect x="${-px.cw * 0.44}" y="${-px.ch * 0.2}" width="${px.cw * 0.88}" height="${px.ch * 0.4}" rx="3"/><text font-size="${px.ch * 0.26}">EXIT</text></g>`); });
    (d.barracks || []).forEach(b => { const px = GG().pix(W, b.x, b.y); if (px) hl.push(`<g class="gbadge" transform="translate(${px.x + px.cw * 0.2},${px.y + px.ch * 0.22})"><circle r="${px.ch * 0.2}"/><text font-size="${px.ch * 0.24}">📻</text></g>`); });
    Object.entries(W.shafts).forEach(([sid, ks]) => { const [x, y] = ks[0].split(',').map(Number), px = GG().pix(W, x, y); if (!px) return; const here = g.elev === true || g.elev === sid; hl.push(`<g class="gbadge ${here ? '' : 'dim'}" transform="translate(${px.x + px.cw * 0.22},${px.y + px.ch * 0.22})"><circle r="${px.ch * 0.2}"/><text font-size="${px.ch * 0.24}">🛗</text></g>`); });
    if (d.goal && d.goal.interact === 'L') Object.values(W.shafts).flat().forEach(k => { const [x, y] = k.split(',').map(Number), px = GG().pix(W, x, y); if (px) hl.push(`<text class="ggoal" x="${px.cx}" y="${px.cy}" font-size="${px.ch * 0.42}">🎯</text>`); });
    if (ui.edit || st.showLOS) W.noFire.forEach(k => { const [x, y] = k.split(',').map(Number), px = GG().pix(W, x, y); if (px) hl.push(`<rect class="gnofire" x="${px.x + 4}" y="${px.y + 4}" width="${px.cw - 8}" height="${px.ch - 8}" rx="3"/>`); });
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
      const act = mode === 'play' && ui.seq && ui.seq.ids[ui.seq.i] === p.id && g.phase === 2;
      if (act) inner = `<circle class="gring" r="${R * 1.75}"/>` + inner;
      return `<g class="gp ${p.k} ${sel} ${cur ? 'cur' : ''} ${act ? 'act' : ''}" data-pc="${p.id}" style="transform:translate(${px.cx + ox}px,${px.cy + oy}px)">${inner}</g>`;
    }).join('');
    if (ui.edit) {
      const code = (x, y) => W.cells[cellKey(x, y)] || ' ';
      Object.keys(W.cells).forEach(k => {
        const [x, y] = k.split(',').map(Number), px = GG().pix(W, x, y); if (!px) return; const cc = W.cells[k];
        // sol praticable en blanc, eau en bleu, ascenseur en cyan (les obstacles sont dessinés plus bas)
        if (cc !== '#') hl.push(`<rect class="${cc === '~' ? 'gwater' : cc === 'L' ? 'gelev' : 'gfloor'}" x="${px.x + 1}" y="${px.y + 1}" width="${px.cw - 2}" height="${px.ch - 2}"/>`);
        if (cc === 'L') hl.push(`<text class="gmark" x="${px.cx}" y="${px.cy}" font-size="${px.ch * 0.5}">🛗</text>`);
        // murs extérieurs (bord du plateau) en noir
        [[0, -1, px.x, px.y, px.x + px.cw, px.y], [0, 1, px.x, px.y + px.ch, px.x + px.cw, px.y + px.ch], [-1, 0, px.x, px.y, px.x, px.y + px.ch], [1, 0, px.x + px.cw, px.y, px.x + px.cw, px.y + px.ch]]
          .forEach(([dx, dy, x1, y1, x2, y2]) => { if (code(x + dx, y + dy) === ' ') hl.push(`<line class="gext" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`); });
      });
      // flèches au sol (virages de patrouille) et spirales (nouveau chemin)
      Object.entries(W.turns).forEach(([k, f]) => { const [x, y] = k.split(',').map(Number), px = GG().pix(W, x, y); if (px) hl.push(`<g transform="translate(${px.cx},${px.cy}) rotate(${ROTD[f] || 0})"><path class="gturn" d="M 0 ${-px.ch * 0.36} L ${px.cw * 0.26} ${-px.ch * 0.02} L ${px.cw * 0.09} ${-px.ch * 0.02} L ${px.cw * 0.09} ${px.ch * 0.32} L ${-px.cw * 0.09} ${px.ch * 0.32} L ${-px.cw * 0.09} ${-px.ch * 0.02} L ${-px.cw * 0.26} ${-px.ch * 0.02} Z"/></g>`); });
      W.spirals.forEach(k => { const [x, y] = k.split(',').map(Number), px = GG().pix(W, x, y); if (px) hl.push(`<text class="gspiral" x="${px.cx}" y="${px.cy}" font-size="${px.ch * 0.6}">⟲</text>`); });
      W.walls.forEach(k => { const [a, b] = k.split('|').map(s => s.split(',').map(Number)); const pa = GG().pix(W, a[0], a[1]); if (!pa) return;
        const ln = a[1] === b[1] ? [pa.x + pa.cw, pa.y, pa.x + pa.cw, pa.y + pa.ch] : [pa.x, pa.y + pa.ch, pa.x + pa.cw, pa.y + pa.ch];
        hl.push(`<line class="gwall" x1="${ln[0]}" y1="${ln[1]}" x2="${ln[2]}" y2="${ln[3]}"/>`); });
      Object.keys(W.cells).forEach(k => { if (W.cells[k] !== '#') return; const [x, y] = k.split(',').map(Number); const px = GG().pix(W, x, y); hl.push(`<rect class="gobst" x="${px.x + 3}" y="${px.y + 3}" width="${px.cw - 6}" height="${px.ch - 6}"/>`); });
    }
    const info = ui.edit ? ({ wall: tx('✏️ Touche près du BORD d\'une case pour ajouter / retirer un mur', '✏️ Tap near the EDGE of a space to add / remove a wall'), cell: tx('✏️ Touche une case : sol → obstacle → eau → hors plateau → sol', '✏️ Tap a space: floor → obstacle → water → off-board → floor'), turn: tx('✏️ Touche une case : flèche ↑ → ↓ ← → aucune', '✏️ Tap a space: arrow ↑ → ↓ ← → none'), spiral: tx('✏️ Touche une case pour ajouter / retirer une spirale ⟲', '✏️ Tap a space to add / remove a ⟲ spiral') }[ui.edit]) : ui.place ? tx('👆 Touche une case pour poser le pion', '👆 Tap a space to place the piece') : pend.type === 'move' ? tx('👆 Touche une case verte', '👆 Tap a green space') : pend.type === 'target' ? tx('👆 Touche la cible encadrée en rouge', '👆 Tap the target framed in red') : ui.sel ? tx('👆 Touche une case pour déplacer ce pion, ou ✕', '👆 Tap a space to move this piece, or ✕') : tx('Touche un pion pour ses options', 'Tap a piece for its options');
    return `<div class="ma-bd"><div class="ma-bdt"><button class="ma-b sm" data-a="zoom" data-v="-1">🔍−</button><button class="ma-b sm" data-a="zoom" data-v="1">🔍+</button><button class="ma-b sm" data-a="zoomFit" title="${tx('Vue d\'ensemble : tout le plan à l\'écran', 'Overview: the whole map on screen')}">⤢</button>
        <button class="ma-b sm ${st.showLOS ? 'on' : ''}" data-a="los" title="${tx('Montrer les cases vues par les gardes et caméras', 'Show spaces seen by Guards and Cameras')}">👁️ ${tx('Zones vues', 'Line of sight')}</button>
        <button class="ma-b sm ${ui.edit ? 'on' : ''}" data-a="edit" title="${tx('Corriger les murs et obstacles du plan', 'Fix the map\'s walls and obstacles')}">✏️ ${tx('Corriger', 'Fix map')}</button>
        ${ui.edit ? `<button class="ma-b sm ${ui.edit === 'wall' ? 'on' : ''}" data-a="editMode" data-v="wall">🧱 ${tx('Mur', 'Wall')}</button><button class="ma-b sm ${ui.edit === 'cell' ? 'on' : ''}" data-a="editMode" data-v="cell">⬜ ${tx('Case', 'Space')}</button><button class="ma-b sm ${ui.edit === 'turn' ? 'on' : ''}" data-a="editMode" data-v="turn">➜ ${tx('Flèche', 'Arrow')}</button><button class="ma-b sm ${ui.edit === 'spiral' ? 'on' : ''}" data-a="editMode" data-v="spiral">⟲ ${tx('Spirale', 'Spiral')}</button><label class="ma-eo" title="${tx('Transparence des repères', 'Overlay opacity')}">◐<input type="range" min="5" max="100" value="${Math.round((st.editOp != null ? st.editOp : 0.3) * 100)}" data-a="eop"></label><button class="ma-b sm" data-a="editExport">📤 ${tx('Exporter', 'Export')}</button><button class="ma-b sm red" data-a="editReset">↺</button>` : ''}
        <span style="flex:1;opacity:.85;font-size:.9rem">${info}</span></div>
      ${ui.edit ? `<div class="ma-legend">${tx('⬜ sol · 🟥 obstacle · 🟦 eau · 🛗 ascenseur · ▬ mur extérieur · <span style="color:#ff2bd6">▬</span> mur intérieur · <span style="color:#ffb020">➜</span> flèche au sol · <span style="color:#8a2be2">⟲</span> spirale · <span style="color:#ff4d5e">⬚</span> No Fire Zone', '⬜ floor · 🟥 obstacle · 🟦 water · 🛗 elevator · ▬ outer wall · <span style="color:#ff2bd6">▬</span> inner wall · <span style="color:#ffb020">➜</span> floor arrow · <span style="color:#8a2be2">⟲</span> spiral · <span style="color:#ff4d5e">⬚</span> No Fire Zone')}</div>` : ''}
      <div class="ma-bds grid"><svg class="ma-svg" id="maSvg" viewBox="0 0 ${d.w} ${d.h}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;--eo:${st.editOp != null ? st.editOp : 0.3}"><image href="${d.img}" width="${d.w}" height="${d.h}"/>
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
  // le plan entier tient dans le cadre à zoom 1 ; au-delà on défile (doigt) ou on pince
  function fitSvg() {
    const m = mission(), svg = root && $('#maSvg', root); if (!svg || !m || !isGrid(m)) return;
    const d = GRID(m), bds = svg.parentElement, z = st.zoom || 1;
    const fw = Math.min(bds.clientWidth, bds.clientHeight * d.w / d.h) || bds.clientWidth;
    svg.style.width = Math.round(fw * z) + 'px'; svg.style.height = Math.round(fw * z * d.h / d.w) + 'px';
  }
  let fitBound = false;
  function focusOn(x, y, smooth = true) {
    const m = mission(), svg = root && $('#maSvg', root); if (!svg || !m || !isGrid(m)) return;
    const W = world(m), px = GG().pix(W, x, y); if (!px) return;
    if ((st.zoom || 1) < 2.2) { if (ui.zoomBack == null) ui.zoomBack = st.zoom || 1; st.zoom = 2.2; fitSvg(); }
    const bds = svg.parentElement, sr = svg.getBoundingClientRect(), br = bds.getBoundingClientRect(), k = sr.width / GRID(m).w;
    const ox = sr.left - br.left + bds.scrollLeft, oy = sr.top - br.top + bds.scrollTop;   // (pas d'offsetLeft sur un <svg>)
    bds.scrollTo({ left: ox + px.cx * k - bds.clientWidth / 2, top: oy + px.cy * k - bds.clientHeight / 2, behavior: smooth && !document.hidden ? 'smooth' : 'auto' });
  }
  function zoomBack() { if (ui.zoomBack != null) { st.zoom = ui.zoomBack; ui.zoomBack = null; } ui.focusId = null; }
  function onGridTap(svg, e) {
    const m = mission(), g = game();
    const pc = e.target.closest && e.target.closest('[data-pc]');
    const u = svgPoint(svg, e); const c = cellAt(m, u.x, u.y);
    if (ui.edit && c) return editAt(m, c, u);
    const pcp = pc && piece(pc.dataset.pc), mine = pcp && pcp.k === 'player' && g.players[g.cur] && g.players[g.cur].name === pcp.owner;
    if (pc && (!(ui.pend && ui.pend.type === 'move') || mine) && !ui.place) return gridTapPiece(pcp, c);
    if (c) gridTapCell(c);
  }
  // pion lâché après un glisser
  function dropPiece(p, u) {
    const m = mission(), g = game(), W = world(m), c = cellAt(m, u.x, u.y);
    if (!c || !p) return render();
    const k = cellKey(c.x, c.y), cur = g.players[g.cur];
    const mine = p.k === 'player' && st.screen === 'play' && g.started && g.phase === 1 && cur && cur.name === p.owner;
    if (mine) {
      if (!ui.pend || ui.pend.type !== 'move') armMove(m, g, cur, 'sneak');
      if (ui.pend && ui.pend.cells && ui.pend.cells[k]) return gridMove(c, ui.pend.cells[k]);
      if (ui.pend && ui.pend.type === 'move') { const dash = p.x != null && cur.left >= 1 && GG().reach(W, toS(g), toS(g).figs.find(f => f.id === p.id), 2)[k]; if (dash && ui.pend.act !== 'dash') { armMove(m, g, cur, 'dash'); if (ui.pend.cells[k]) return gridMove(c, ui.pend.cells[k]); } }
      toast(tx('Case hors de portée (cases vertes).', 'Out of reach (green spaces only).')); return render();
    }
    const tok = ['q', 'a', 'ko1', 'ko2', 'dead'].includes(p.k);
    if (!tok && !GG().walkable(W, toS(g), c.x, c.y)) { toast(tx('Pas de case ici.', 'No space here.')); return render(); }
    if (p.x === c.x && p.y === c.y) return render();
    snap(); p.x = c.x; p.y = c.y;
    if (g.started) log(`✋ ${tx('Pion corrigé', 'Piece corrected')} : ${p.k === 'player' ? p.owner : p.k} → ${k}`, 'sys');
    ui.sel = null; ui.place = null; save(); render();
  }
  function bindGrid() {
    const svg = $('#maSvg', root); if (!svg) return;
    const bds = svg.parentElement; fitSvg();
    if (!fitBound) { fitBound = true; window.addEventListener('resize', () => fitSvg()); }
    const pts = new Map(); let gest = null, swallowUntil = 0;
    svg.addEventListener('click', e => { if (Date.now() < swallowUntil) return; onGridTap(svg, e); });
    bds.addEventListener('pointerdown', e => {
      if (ui.busy) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], r = bds.getBoundingClientRect();
        gest = { t: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: st.zoom || 1, z: st.zoom || 1, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
        if (gest.el) gest.el.style.transform = '';
        return;
      }
      if (pts.size > 2) return;
      const el = e.target.closest && e.target.closest('[data-pc]');
      gest = { t: 'tap', x: e.clientX, y: e.clientY, sl: bds.scrollLeft, st: bds.scrollTop, el, p: el && piece(el.dataset.pc) };
    });
    bds.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || !gest) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gest.t === 'pinch') {
        if (pts.size < 2) return;
        const [a, b] = [...pts.values()];
        const z = Math.max(1, Math.min(4, gest.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gest.d0)), ratio = z / gest.z;
        const cx = bds.scrollLeft + gest.mx, cy = bds.scrollTop + gest.my;
        st.zoom = z; gest.z = z; fitSvg();
        bds.scrollLeft = cx * ratio - gest.mx; bds.scrollTop = cy * ratio - gest.my;
        e.preventDefault(); return;
      }
      const dx = e.clientX - gest.x, dy = e.clientY - gest.y;
      if (gest.t === 'tap' && Math.hypot(dx, dy) > 10) gest.t = gest.p && !ui.edit && gest.p.x != null ? 'piece' : 'pan';
      if (gest.t === 'pan') { bds.scrollLeft = gest.sl - dx; bds.scrollTop = gest.st - dy; }
      if (gest.t === 'piece') { const u = svgPoint(svg, e); gest.el.style.transition = 'none'; gest.el.style.transform = `translate(${u.x}px,${u.y}px) scale(1.3)`; gest.el.style.opacity = '.85'; }
    });
    const end = e => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (!gest) return;
      if (gest.t === 'pinch' || gest.t === 'none') { swallowUntil = Date.now() + 450; if (!pts.size) { gest = null; save(); } else gest = { t: 'none' }; return; }
      const g0 = gest; gest = null;
      if (g0.t === 'pan') swallowUntil = Date.now() + 450;
      if (g0.t === 'piece') { swallowUntil = Date.now() + 450; dropPiece(g0.p, svgPoint(svg, e)); }
    };
    // molette de souris : zoom centré sur le curseur
    let wheelSave = null;
    bds.addEventListener('wheel', e => {
      e.preventDefault();
      const r = bds.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, z0 = st.zoom || 1;
      const z = Math.max(1, Math.min(4, z0 * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); if (z === z0) return;
      const cx = bds.scrollLeft + mx, cy = bds.scrollTop + my, ratio = z / z0;
      st.zoom = z; fitSvg(); bds.scrollLeft = cx * ratio - mx; bds.scrollTop = cy * ratio - my;
      clearTimeout(wheelSave); wheelSave = setTimeout(save, 300);
    }, { passive: false });
    bds.addEventListener('pointerup', end);
    bds.addEventListener('pointercancel', e => { pts.delete(e.pointerId); if (gest && gest.t === 'piece') render(); gest = null; });
  }

  function editAt(m, c, u) {
    const W = world(m), px = GG().pix(W, c.x, c.y);
    const ck = cellKey(c.x, c.y);
    if (ui.edit === 'cell') { const cur = W.cells[ck] || ' '; if (cur === 'L') { toast(tx('🛗 Les cages d\'ascenseur ne se modifient pas ici.', '🛗 Elevator shafts can\'t be edited here.')); return; } const nx = { '.': '#', '#': '~', '~': ' ', ' ': '.' }[cur] || '.'; toggleFix(m, 'cell', ck, nx); render(); return; }
    if (ui.edit === 'turn') { const o = ['', 'up', 'right', 'down', 'left']; const cur = W.turns[ck] || ''; toggleFix(m, 'turn', ck, o[(o.indexOf(cur) + 1) % o.length]); render(); return; }
    if (ui.edit === 'spiral') { toggleFix(m, 'spiral', ck); render(); return; }
    const fx = (u.x - px.x) / px.cw, fy = (u.y - px.y) / px.ch;
    const d = [['left', fx], ['right', 1 - fx], ['up', fy], ['down', 1 - fy]].sort((a, b) => a[1] - b[1])[0][0];
    const [dx, dy] = GG().DIRS[d], n = { x: c.x + dx, y: c.y + dy };
    const a = (n.x < c.x || n.y < c.y) ? n : c, b = a === n ? c : n;
    toggleFix(m, 'wall', `${a.x},${a.y}|${b.x},${b.y}`); render();
  }
  function gridTapPiece(p, c) {
    const g = game();
    if (ui.pend && ui.pend.type === 'target') { if (ui.pend.ids.includes(p.id)) return chooseTarget(p); toast(tx('Ce n\'est pas une cible valable (encadrées en rouge).', 'Not a valid target (framed in red).')); return; }
    if (ui.sel && ui.sel !== p.id && c) return gridTapCell(c);
    if (p.k === 'player' && st.screen === 'play' && g.phase === 1 && g.players[g.cur] && g.players[g.cur].name === p.owner && !ui.pad) {
      if (ui.pend) ui.pend = null; else if (!armMove(mission(), g, g.players[g.cur], 'sneak')) toast(tx('Plus de déplacement possible.', 'No move possible.'));
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
      toast(tx('Case hors de portée (cases vertes).', 'Out of reach (green spaces only).')); return;
    }
    if (!ui.place && !ui.sel && !ui.pend && st.screen === 'play' && g.phase === 1 && g.players[g.cur]) { const me = playerPiece(g, g.players[g.cur].name); if (me && me.x === c.x && me.y === c.y) return gridTapPiece(me, c); }
    if (ui.place) { if (!GG().walkable(W, S, c.x, c.y)) return; snap(); const p = piece(ui.place); p.x = c.x; p.y = c.y; ui.place = null; save(); render(); return; }
    if (ui.sel) { const p = piece(ui.sel); if (p && GG().walkable(W, S, c.x, c.y)) { snap(); p.x = c.x; p.y = c.y; if (p.k === 'player') followTokens(g, p.owner); log(`✋ ${tx('Pion corrigé', 'Piece corrected')} : ${p.k === 'player' ? p.owner : p.k} → ${k}`, 'sys'); save(); } ui.sel = null; render(); }
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
    const a = actById(id, p), pp = playerPiece(g, p.name);
    if (!a || a.c > p.left || !pp || pp.x == null) return false;
    const S = toS(g), cells = GG().reach(world(m), S, S.figs.find(f => f.id === pp.id), a.move);
    if (!Object.keys(cells).length) return false;
    ui.pend = { type: 'move', act: id, cells }; return true;
  }
  // une action est-elle jouable maintenant ? → null, sinon la raison (plateau quadrillé)
  function whyNot(m, g, p, a) {
    if (a.c > p.left) return tx('plus assez de points', 'not enough actions');
    if (a.item) { const it = itemOf(p, a); if (!it) return tx('carte défaussée', 'card discarded'); if (a.eff === 'detonate') { if (!it.planted) return tx('aucun C-4 posé', 'no C-4 planted'); } else if (it.uses != null && it.uses <= 0 && !(a.eff === 'shoot' && hasCard(p, 23))) return a.eff === 'shoot' || a.eff === 'missile' ? tx('plus de munitions', 'out of ammo') : tx('plus de jetons', 'no tokens left'); }
    if (a.need && !hasItem(p, a.need)) return { ration: tx('pas de ration', 'no Rations'), chaff: tx('pas de chaff', 'no chaff'), grenade: tx('pas de grenade', 'no grenade'), gun: tx('pas d\'arme', 'no weapon'), sgun: tx('pas d\'arme silencieuse', 'no silenced weapon') }[a.need];
    if (!isGrid(m)) return null;
    const pp = playerPiece(g, p.name); if (!pp || pp.x == null) return a.move || a.atk ? tx('pion pas posé', 'piece not placed') : null;
    const W = world(m), S = toS(g), me = S.figs.find(f => f.id === pp.id), here = cellKey(pp.x, pp.y);
    const near = ks => g.pieces.some(x => ks.includes(x.k) && x.x != null && Math.abs(x.x - pp.x) + Math.abs(x.y - pp.y) <= 1 && !GG().wallBetween(W, x, pp));
    if (a.gun && W.noFire.has(here)) return 'No Fire Zone';
    if (a.id === 'sneak' || a.id === 'dash') return Object.keys(GG().reach(W, S, me, a.move)).length ? null : tx('bloqué', 'blocked');
    if (a.id === 'drag' || a.id === 'disguise') return near(['ko1', 'ko2', 'dead']) ? null : tx('aucun corps à côté', 'no body adjacent');
    if (a.id === 'h2h' || a.id === 'combo') return GG().adjacentTargets(W, S, me).length ? null : tx('aucun garde à côté', 'no adjacent Guard');
    if (a.id === 'silent') return GG().behindTargets(W, S, me).length ? null : tx('pas dans le dos d\'un garde', 'not behind a Guard');
    if (a.id === 'shoot' || a.id === 'shootS' || a.eff === 'shoot') return GG().losTargets(W, S, me).length ? null : tx('aucune cible en vue', 'no target in LOS');
    if (a.eff === 'rope') return near(['ko1', 'ko2']) ? null : tx('aucun garde KO à côté', 'no KO\'d Guard adjacent');
    if (a.eff === 'box') return GG().watchers(W, S, { x: pp.x, y: pp.y }).length ? tx('tu es dans une LOS', 'you are in a LOS') : null;
    if (a.id === 'elev') return W.shaftOf[here] || GG().shaftAdjacent(W, pp.x, pp.y).length ? null : tx('pas d\'ascenseur ici', 'no elevator here');
    return null;
  }
  async function gridMove(dest, info) {
    const m = mission(), g = game(), W = world(m), p = g.players[g.cur], a = actById(ui.pend.act, p);
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
    log(`${a.i} ${p.name} : ${a.n} → ${tx('case', 'space')} ${dest.x},${dest.y}`, '', p.name);
    if (seenBy.size && p.stealth) { toast(tx('👻 Camouflage optique : le garde ne te voit pas.', '👻 Stealth Camouflage: the Guard doesn\'t see you.'), 2500); seenBy.clear(); }
    if (seenBy.size) {
      const list = [...seenBy.values()]; const cam = list.some(w => w.cam);
      if (cam) A.sfx(AU().camSpot);
      setTimeout(() => { setAtt(g, p, 2, cam && list.length === 1 ? tx('vu par une caméra', 'spotted by a Camera') : tx('vu par un garde', 'spotted by a Guard')); save(); render(); }, cam ? 650 : 0);
      toast(`👁️ <b>${p.name} ${tx('est repéré', 'is spotted')}</b> ${tx('par', 'by')} ${list.map(w => w.cam ? tx('une caméra', 'a Camera') : tx('un garde', 'a Guard')).join(', ')} !`, 3500);
    }
    if (leaps.length && p.stealth) leaps.length = 0;
    if (leaps.length) {
      setAtt(g, p, 2, tx('saut par-dessus un garde', 'leapfrogged a Guard'));
      ui.queue = leaps.map(() => ({ kind: 'guardAtk', victim: p.name, def: defOf(p.name), fixed: ['b', 'b'], title: tx(`🤸 Le garde sauté attaque ${p.name} : 2 dés noirs`, `🤸 The leapfrogged Guard attacks ${p.name}: 2 black dice`), defLabel: tx(`de ${p.name}`, `of ${p.name}`) }));
      openPad(ui.queue.shift());
    }
    if ((d.exits || []).some(e => e[0] === dest.x && e[1] === dest.y)) setTimeout(() => toast(tx('🚪 <b>Sur la sortie !</b> Termine ton tour ici pour valider l\'objectif (si les conditions sont remplies).', '🚪 <b>On the exit!</b> End your turn here to complete the objective (if its conditions are met).'), 5000), 600);
    // fin de course contre un mur / obstacle → « on the wall »
    const last = info.path[info.path.length - 1], prev = info.path.length > 1 ? info.path[info.path.length - 2] : { x: pp0.x, y: pp0.y };
    const [ddx, ddy] = GG().DIRS[GG().dirOf(prev, last)], nx = { x: last.x + ddx, y: last.y + ddy };
    if (!GG().walkable(W, toS(g), nx.x, nx.y) || GG().wallBetween(W, last, nx)) setTimeout(() => A.sfx(AU().wall), 120);
    if (a.noisy && !leaps.length && p.noisy === a.c) toast(`${a.i} <b>${a.n}</b> : ${tx('🔊 bruyant → noise check à la fin de ton tour.', '🔊 Noisy → noise check at the end of your turn.')}`);
    ui.lastMove = a.id;
    if (!ui.pad && !g.over && (a.id === 'sneak' || a.id === 'dash')) armMove(m, g, p, a.id);
    save(); render();
  }
  function triggerEvent(m, g, k) {
    const e = (GRID(m).events || {})[k], ev = (m.events || []).find(x => x.k === k);
    g.ev[k] = true; A.sfx(AU()[(stageSnd(m).events || {})[k] || 'pop'] || AU().pop);
    log(`🅰️ Event ${k} ${tx('atteint', 'reached')}`, 'sys');
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
  const MODE = { alert: tx('🚨 ALERTE (chiffre rouge)', '🚨 ALERT (red number)'), investigate: tx('❓ ENQUÊTE (chiffre bleu)', '❓ INVESTIGATE (blue number)'), patrol: tx('🚶 PATROUILLE (chiffre bleu)', '🚶 PATROL (blue number)') };
  function gridEnemyHtml(m, g) {
    if (ui.pad) return padHtml(m, g);
    const s = g.step, cls = k => s === k ? 'cur' : s > k ? 'ok' : '';
    const hasCam = g.pieces.some(p => p.k === 'cam');
    const card = g.card || (g.card = { red: 6, blue: 4, arrow: 'right' });
    const num = (key, col) => `<div class="ma-att"><span style="min-width:96px">${col === 'r' ? tx('🔴 Chiffre rouge', '🔴 Red number') : tx('🔵 Chiffre bleu', '🔵 Blue number')}</span>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="ma-b sm ${card[key] === n ? 'on' : ''}" data-a="card" data-k="${key}" data-v="${n}">${n}</button>`).join('')}</div>`;
    let h = `<div class="ma-card"><h4>🃏 ${tx('Carte Guard Order', 'Guard Order card')}</h4>
      <div class="ma-step ${cls(0)}"><span class="k">0</span><div class="bd">${tx('Pioche la carte du dessus. <b>GAME OVER</b> ? → perdu.', 'Draw the top card. <b>GAME OVER</b>? → you lose.')}<br><button class="ma-b pri" data-a="draw" ${s > 0 ? 'disabled' : ''}>🃏 ${tx('Carte piochée', 'Card drawn')}</button> <button class="ma-b red" data-a="gameover" ${s > 0 ? 'disabled' : ''}>💀 GAME OVER</button></div></div>
      <div class="ma-step ${cls(1)}"><span class="k">I</span><div class="bd"><b>Section I</b> : ${tx('quelle icône ?', 'which icon?')}<br>
        <button class="ma-b sm" data-a="s1" data-v="waken" ${s !== 1 ? 'disabled' : ''}>✨ ${tx('Réveil', 'Waken')}</button> <button class="ma-b sm" data-a="s1" data-v="radio" ${s !== 1 ? 'disabled' : ''}>📻 Radio-In</button> <button class="ma-b sm" data-a="s1" data-v="lost" ${s !== 1 ? 'disabled' : ''}>☠ Lost Contact</button> <button class="ma-b sm" data-a="s1" data-v="stay" ${s !== 1 ? 'disabled' : ''}>❓ Stay Alert</button></div></div>
      <div class="ma-step ${cls(2)}"><span class="k">II</span><div class="bd"><b>${tx('Section II — caméras', 'Section II — Cameras')}</b>${hasCam ? ` (${tx('face', 'side')} ${g.cam === 'vert' ? tx('🟩 verte', '🟩 green') : '🟧 orange'})<br><button class="ma-b sm" data-a="cam" data-v="flip" ${s !== 2 ? 'disabled' : ''}>🔄 ${tx('La carte fait pivoter', 'The card flips them')}</button> <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>${tx('Pas de pivot', 'No flip')}</button>` : ` : ${tx('aucune caméra.', 'no Cameras.')} <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>OK</button>`}</div></div>
      <div class="ma-step ${cls(3)}"><span class="k">III</span><div class="bd"><b>Section III</b> : ${tx('recopie la carte puis active les gardes.', 'copy the card, then activate the Guards.')}${num('red', 'r')}${num('blue', 'b')}
        <div class="ma-att"><span style="min-width:96px">↪ ${tx('Flèche', 'Arrow')}</span><button class="ma-b sm ${card.arrow === 'left' ? 'on' : ''}" data-a="card" data-k="arrow" data-v="left">⟲ ${tx('gauche', 'left')}</button><button class="ma-b sm ${card.arrow === 'right' ? 'on' : ''}" data-a="card" data-k="arrow" data-v="right">⟳ ${tx('droite', 'right')}</button></div>
        ${s === 3 ? seqHtml(m, g) : ''}</div></div></div>`;
    return h;
  }
  function seqHtml(m, g) {
    const sq = ui.seq;
    if (!sq) return `<button class="ma-b pri big" data-a="seqStart">▶ ${tx('Activer les gardes', 'Activate the Guards')}</button>`;
    if (ui.react) return `<div class="ma-ask warn"><p>🃏 <b>Guard Reaction</b> : ${tx('le garde est sur', 'the Guard is on')} ${ui.react.tokens.map(t => t.kind === '?' || t.kind === '!' ? tx(`le jeton ${t.kind} de ${t.owner}`, `${t.owner}'s ${t.kind} token`) : t.kind === 'dead' ? tx('un corps', 'a body') : tx('un garde KO', 'a KO\'d Guard')).join(', ')}. ${tx('Pioche une carte Guard Reaction et lis-la : que dit-elle ?', 'Draw a Guard Reaction card and read it: what does it say?')}</p>
      ${ui.react.tokens.map(t => `<div style="margin:4px 0"><b>${t.kind}</b> ${t.owner || ''} : <button class="ma-b sm" data-a="react" data-v="rm" data-t="${t.id}">${tx('Retirer', 'Remove')}</button> ${t.kind === '?' ? `<button class="ma-b sm" data-a="react" data-v="up" data-t="${t.id}">? → !</button>` : ''}${t.kind === 'ko2' || t.kind === 'ko1' ? `<button class="ma-b sm" data-a="react" data-v="wake" data-t="${t.id}">${tx('Il le réveille', 'Wakes it up')}</button>` : ''} <button class="ma-b sm" data-a="react" data-v="keep" data-t="${t.id}">${tx('Rien', 'Nothing')}</button></div>`).join('')}
      <button class="ma-b" data-a="reactDone">✔ ${tx('Fait', 'Done')}</button></div>`;
    if (sq.i >= sq.ids.length) return `<div class="ma-res">${tx('✅ Tous les gardes ont joué.', '✅ All Guards have activated.')}</div><button class="ma-b pri big" data-a="nextRound">▶ Round ${g.round + 1}</button>`;
    const id = sq.ids[sq.i], gp = piece(id);
    return `<div class="ma-ask"><p><b>${tx('Garde', 'Guard')} ${sq.i + 1}/${sq.ids.length}</b>${sq.last ? `<br>${sq.last}` : ''}</p>
      <button class="ma-b pri big" data-a="seqGo" ${ui.busy ? 'disabled' : ''}>▶ ${sq.i ? tx('Activer le suivant', 'Activate the next one') : tx('Activer le premier', 'Activate the first one')}</button> <button class="ma-b sm" data-a="seqSkip">${tx('Passer', 'Skip')}</button></div>`;
  }
  async function runGuard(m, g) {
    const sq = ui.seq, id = sq.ids[sq.i], W = world(m);
    const gp = piece(id); if (!gp || gp.k !== 'guard') { sq.i++; save(); render(); return; }
    ui.sel = id; ui.busy = true; render();
    const r = GG().activate(W, toS(g), id, g.card);
    const tgt = r.target ? tx(` → vers le ${r.target.kind} ${r.target.owner ? 'de ' + r.target.owner : ''}`, ` → toward ${r.target.owner ? r.target.owner + '\'s ' : 'the '}${r.target.kind}`) : '';
    sq.last = `${MODE[r.mode]}${tgt}`;
    toast(`💂 ${tx('Garde', 'Guard')} ${sq.i + 1} : <b>${MODE[r.mode]}</b>${tgt}`, 2500);
    let seen = null, react = null;
    for (const s of r.steps) {
      if (s.t === 'move') { focusOn(s.x, s.y); await animTo(m, id, s.x, s.y, s.f, 380); gp.x = s.x; gp.y = s.y; gp.f = s.f; }
      else if (s.t === 'turn') { await animTo(m, id, gp.x, gp.y, s.f, 260); gp.f = s.f; }
      else if (s.t === 'see') seen = s; else if (s.t === 'reaction') react = s;
    }
    gp.x = r.g.x; gp.y = r.g.y; gp.f = r.g.f;
    const moves = r.steps.filter(s => s.t === 'move').length;
    log(`💂 ${tx('Garde', 'Guard')} ${sq.i + 1} : ${MODE[r.mode]}, ${moves} ${tx('case(s)', 'space(s)')}${seen ? tx(', voit ', ', sees ') + seen.player : ''}${react ? ', Guard Reaction' : ''}`, seen ? 'alert' : 'sys');
    ui.busy = false; ui.sel = null; sq.i++;
    sq.last += ` — ${moves} ${tx('case(s)', 'space(s)')}${seen ? ` — 👁️ ${tx('voit', 'sees')} ${seen.player} !` : react ? tx(' — arrive sur un jeton', ' — lands on a token') : ''}. ${tx('Réplique sur le plateau.', 'Mirror it on the board.')}`;
    if (seen) {
      const q = g.players.find(p => p.name === seen.player);
      A.sfx('guard-there-he-is_JHZ7rPO.mp3'); setAtt(g, q, 2, tx('vu par un garde', 'spotted by a Guard'));
      const pp = playerPiece(g, q.name), ps = pp && GG().pix(W, pp.x, pp.y);
      openPad({ kind: 'guardAtk', victim: q.name, def: defOf(q.name), fixed: ['b', 'b'], title: tx(`👁️ Le garde attaque ${q.name} : lance 2 dés noirs`, `👁️ The Guard attacks ${q.name}: roll 2 black dice`), hint: tx('Focus possible : modifie la valeur avant de la taper.', 'Focus allowed: adjust the value before entering it.'), defLabel: tx(`de ${q.name}`, `of ${q.name}`) });
    } else if (react) { A.sfx('guard-what-was-that-noise_IVtXtq7.mp3'); ui.react = react; }
    save(); render();
  }
  // Réveil / Radio-In / Lost Contact / Stay Alert en mode quadrillage
  function gridSection1(m, g, v) {
    const W = world(m);
    if (v === 'waken') {
      const az = GG().activeZones(W, toS(g)); let up = 0, down = 0;
      g.pieces.forEach(p => { if (!az.has(GG().zoneOf(W, p.x, p.y))) return; if (p.k === 'ko1') { p.k = 'guard'; p.f = p.f || 'down'; up++; } else if (p.k === 'ko2') { p.k = 'ko1'; down++; } });
      A.sfx('guard-whered-he-go_zHLpH97.mp3'); log(tx(`✨ Réveil : ${up} garde(s) debout, ${down} KO ★★ → ★`, `✨ Waken: ${up} Guard(s) back up, ${down} KO ★★ → ★`), 'sys');
      toast(tx(`✨ Réveil : ${up} garde(s) se relèvent (oriente-les : touche-les puis ⟲⟳), ${down} KO passent à ★.`, `✨ Waken: ${up} Guard(s) get up (face them: tap, then ⟲⟳), ${down} KO flip to ★.`), 5000);
    }
    if (v === 'radio') {
      const S = toS(g), az = GG().activeZones(W, S); let n = 0;
      (GRID(m).barracks || []).forEach(b => {
        const z = GG().zoneOf(W, b.x, b.y); if (!az.has(z)) return;
        const have = g.pieces.filter(p => p.k === 'guard' && GG().zoneOf(W, p.x, p.y) === z).length;
        for (let i = have; i < b.count; i++) { g.pieces.push({ id: 'gr' + Date.now() % 100000 + i, k: 'guard', x: b.x, y: b.y, f: b.f || 'down' }); n++; }
      });
      A.sfx('guard-return-to-your-positions_9aocsFp.mp3'); log(tx(`📻 Radio-In : ${n} renfort(s)`, `📻 Radio-In: ${n} reinforcement(s)`), 'sys');
      toast(n ? tx(`📻 ${n} garde(s) en renfort sur l'icône radio du Barracks.`, `📻 ${n} Guard(s) spawn on the Barracks radio icon.`) : tx('📻 Radio-In : pas de renfort (Guard Count atteint ou pas de Barracks).', '📻 Radio-In: no reinforcements (Guard Count reached or no Barracks).'), 4500);
    }
    if (v === 'lost') { const dead = g.pieces.filter(p => p.k === 'dead').length, n = Math.floor(dead / 3); if (g.deck) { g.deck.drawn += n; g.deck.burned += n; } log(tx(`☠ Lost Contact : ${n} carte(s) brûlée(s)`, `☠ Lost Contact: ${n} card(s) burned`), 'sys'); toast(n ? tx(`☠ ${n} carte(s) brûlée(s) (révélées, mises dessous). GAME OVER parmi elles ? → perdu.`, `☠ ${n} card(s) burned (revealed, put on the bottom). GAME OVER among them? → you lose.`) : tx('☠ Lost Contact : moins de 3 morts, rien.', '☠ Lost Contact: fewer than 3 bodies, nothing happens.'), 4500); }
    if (v === 'stay') { const names = GG().stayAlert(W, toS(g)); names.forEach(nm => { const p = g.players.find(x => x.name === nm); if (p && p.att === 0) setAtt(g, p, 1, 'Stay Alert'); else if (p && p.att === 1) placeAtt(g, p); /* ? posé ou déplacé sous la figurine ; si ! déjà posé, rien */ }); log(`❓ Stay Alert : ${names.join(', ') || tx('personne', 'nobody')}`, 'sys'); if (!names.length) toast(tx('❓ Stay Alert : personne à 2 cases d\'un garde.', '❓ Stay Alert: nobody within 2 spaces of a Guard.')); }
  }
  function camCheck(m, g) {
    const W = world(m), S = toS(g);
    g.players.forEach(p => { const pp = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (!pp) return; const cams = (S.cams || []).filter(c => !(c.x === pp.x && c.y === pp.y) && GG().los(W, S, c, pp, GG().camFacing(S, c)).ok); if (cams.length && p.att !== 2) { A.sfx(AU().camSpot); setTimeout(() => { setAtt(g, p, 2, tx('vu par une caméra', 'spotted by a Camera')); save(); render(); }, 700); } });
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
  .ma-dnd{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
  .ma-col{background:#0e1236;border:1px solid #2a3474;border-radius:12px;padding:6px;min-height:90px;display:flex;flex-direction:column;gap:4px}
  .ma-col.box{border-style:dashed}.ma-col.over{border-color:#3dffa0;box-shadow:0 0 0 2px #3dffa0 inset}
  .ma-colh{display:flex;align-items:center;gap:4px;font-size:.88rem;margin-bottom:2px}.ma-colh .warn{color:#ff8a96;font-weight:800}
  .ma-cc{display:flex;align-items:center;gap:5px;background:#1a2150;border:1px solid #39407a;border-radius:9px;padding:4px 6px;font-size:.82rem;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
  .ma-cc b{font:700 .75rem ui-monospace,monospace;color:#9ec0ff}.ma-cc .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ma-cc small{opacity:.75}
  .ma-cc.sel{border-color:#3dffa0;background:#163a2c}.ma-cc.ghost{position:fixed;z-index:999999;pointer-events:none;transform:translate(-50%,-50%) scale(1.08);box-shadow:0 8px 24px rgba(0,0,0,.6);max-width:220px}
  .ma-mut{opacity:.65;font-size:.82rem;margin:2px 0}
  .ma-boxown .num{min-width:44px;font:700 .8rem ui-monospace,monospace}
  .ma-inv{padding:6px 0;border-bottom:1px dashed #26306a}.ma-inv:last-child{border-bottom:0}
  .ma-inv-h{display:flex;align-items:center;gap:6px;margin-bottom:3px}.ma-inv-h .warn{color:#ff8a96!important;opacity:1!important}
  .ma-inv-add .num.known{display:inline-flex;flex-direction:column;align-items:center;line-height:1.05;padding:3px 6px}.ma-inv-add .num small{font-size:.66rem;font-weight:600;opacity:.85;max-width:92px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ma-inv.box{margin-top:4px;padding-top:8px;border-top:1px solid #39407a}.ma-inv-add .num.other{opacity:.55}
  .ma-inv-add{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px}.ma-inv-add .num{min-width:0;padding:3px 6px;font-size:.8rem}
  .ma-invl{display:flex;flex-wrap:wrap;gap:2px;align-items:center;margin:4px 0;font-size:.9rem}.ma-invl .chip{padding:1px 8px;font-size:.8rem}
  .ma-mini{border:1px solid #39407a;background:#1a2150;color:#fff;border-radius:7px;min-width:24px;height:24px;padding:0 5px;margin:0 2px;font:700 13px system-ui;cursor:pointer}
  .ma-mini.red{border-color:#a3304a;color:#ff9aa5}.ma-mini.on{background:#2f4bd0}
  .ma-cd{font:800 2.2rem ui-monospace,monospace;letter-spacing:.12em;text-align:center;color:#3dffa0;background:#06140e;border:1px solid #1f7a4a;border-radius:10px;padding:4px 0;margin:4px 0}
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
  .ma-bds.grid{touch-action:none;overscroll-behavior:contain;cursor:grab}.ma-bds.grid .ma-svg{touch-action:none}
  .ma-svg{display:block;margin:0 auto;max-width:none;touch-action:manipulation;user-select:none;-webkit-user-select:none}
  .ma-svg .gc{fill:transparent;stroke:rgba(10,20,60,.28);stroke-width:1.2}
  .ma-svg .greach{fill:rgba(61,255,160,.28);stroke:#2fbf7a;stroke-width:3;cursor:pointer;animation:gpul 1.2s infinite alternate}
  .ma-svg .gplace{fill:rgba(91,140,255,.18);stroke:#5b8cff;stroke-width:2;stroke-dasharray:6 5;cursor:pointer}
  .ma-svg .gtarget{fill:rgba(224,31,53,.22);stroke:#ff4d5e;stroke-width:4;animation:gpul 1s infinite alternate}
  .ma-svg .gseen{fill:rgba(255,209,102,.30)}
  .ma-svg .gexit rect{fill:#ffd400;stroke:#111;stroke-width:3}.ma-svg .gexit text,.ma-svg .gbadge text,.ma-svg .ggoal{text-anchor:middle;dominant-baseline:central;font-weight:900;pointer-events:none}.ma-svg .gexit text{fill:#111}
  .ma-svg .gbadge circle{fill:#0a0d22;stroke:#3dffa0;stroke-width:2}.ma-svg .gbadge.dim{opacity:.45}.ma-svg .gnofire{fill:none;stroke:#ff4d5e;stroke-width:3;stroke-dasharray:6 4}
  .ma-legend{font-size:.78rem;opacity:.9;padding:2px 4px 4px;line-height:1.5}
  .ma-svg{--eo:.3}
  .ma-svg .gfloor{fill:#fff;fill-opacity:calc(var(--eo) * .7)}.ma-svg .gwater{fill:#3c8cff;fill-opacity:calc(var(--eo) * .8)}.ma-svg .gelev{fill:#3ddcff;fill-opacity:calc(var(--eo) * .8)}
  .ma-svg .gext{stroke:#000;stroke-width:4;stroke-linecap:square;stroke-opacity:min(1, calc(var(--eo) * 2.2))}
  .ma-svg .gturn{fill:#ffb020;stroke:#5a3400;stroke-width:1.5;fill-opacity:min(1, calc(var(--eo) * 2));stroke-opacity:min(1, calc(var(--eo) * 2))}.ma-svg .gspiral,.ma-svg .gmark{text-anchor:middle;dominant-baseline:central;fill:#8a2be2;font-weight:900;pointer-events:none;opacity:min(1, calc(var(--eo) * 2.2))}
  .ma-svg .gwall{stroke:#ff2bd6;stroke-width:5;stroke-linecap:round;stroke-opacity:min(1, calc(var(--eo) * 2.6))}
  .ma-svg .gobst{fill:#ff283c;fill-opacity:calc(var(--eo) * .8);stroke:#ff2b3c;stroke-width:2;stroke-opacity:min(1, calc(var(--eo) * 2))}
  .ma-eo{display:inline-flex;align-items:center;gap:4px;font-size:.85rem}.ma-eo input{width:110px;accent-color:#3dffa0}
  .ma-svg .glos{fill:none;stroke:#ff4d5e;stroke-width:4;stroke-dasharray:12 7}
  .ma-svg .gev rect{fill:#c4202f;stroke:#fff;stroke-width:2}.ma-svg .gev text{fill:#fff;font:900 18px system-ui}
  .ma-svg .gp{cursor:pointer;transition:transform .33s cubic-bezier(.4,.1,.3,1)}
  .ma-svg .gp .grot{transition:transform .26s}
  .ma-svg .gtx{font-weight:900;text-anchor:middle;dominant-baseline:central;fill:#fff;pointer-events:none}
  .ma-svg .gp.sel circle,.ma-svg .gp.sel rect{stroke:#fff!important;stroke-width:5}
  .ma-svg .gp.cur circle{animation:gcur 1.2s infinite}
  .ma-svg .gring{fill:rgba(255,209,102,.18);stroke:#ffd166;stroke-width:6;animation:gring 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes gring{0%,100%{transform:scale(.85);opacity:1}50%{transform:scale(1.15);opacity:.55}}
  @keyframes gpul{to{opacity:.55}} @keyframes gcur{50%{stroke:#ffd166;stroke-width:7}}
  .ma-c.fit{overflow:hidden;padding:6px 8px}
  .ma-c.fit .ma-play{height:100%;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:8px}
  .ma-c.fit .ma-play>div{min-height:0;height:100%;overflow:auto;-webkit-overflow-scrolling:touch}
  .ma-c.fit .ma-play>div:first-child{overflow:hidden}
  .ma-c.fit .ma-bd{height:100%;display:flex;flex-direction:column;position:static;padding:6px}
  .ma-c.fit .ma-bdt{margin-bottom:4px}
  .ma-c.fit .ma-bds{flex:1;min-height:0;max-height:none}
  .ma-c.fit .ma-play>div:first-child>p{margin:4px 2px;font-size:.82rem}
  .ma-c.fit .ma-play>div:first-child{display:flex;flex-direction:column}.ma-c.fit .ma-play>div:first-child>.ma-bd{flex:1;min-height:0;height:auto}
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
        <button class="ma-b sm" id="maLang" title="Français / English">${EN ? '🇫🇷 FR' : '🇬🇧 EN'}</button><button class="ma-b sm" id="maLog" title="${tx('Journal de la partie', 'Game log')}">📜</button><button class="ma-b sm" id="maSnd" title="${tx('Sons (manuel)', 'Sounds (manual)')}">🔊</button><button class="ma-b sm" id="maHelp" title="${tx('Aide animée', 'Animated help')}">❓</button><button class="ma-b sm red" id="maX" title="${tx('Fermer', 'Close')}">✕</button></div>
      <div class="ma-steps" id="maSteps"></div><div class="ma-c" id="maBody"></div>
      <div class="ma-rot"><div>📱↻<br><b>${tx('Tourne la tablette en paysage', 'Turn your tablet to landscape')}</b><br><span>${tx('le plateau tient alors en entier à l\'écran', 'the whole board then fits on screen')}</span></div></div>
      <div class="ma-bar"><span class="np" id="maNp">♪ —</span><button class="ma-b sm" id="maAuto">🎬 Auto</button><button class="ma-b sm" id="maStop" title="${tx('Stop musique', 'Stop music')}">⏹</button></div>`;
    document.body.appendChild(root);
    body = $('#maBody', root);
    $('#maX', root).onclick = close;
    $('#maHome', root).onclick = () => go('home');
    $('#maLog', root).onclick = () => { if (mission()) go('log'); };
    $('#maSnd', root).onclick = () => { if (mission()) go('snd'); };
    $('#maHelp', root).onclick = () => window.MGSHelp && window.MGSHelp.open();
    $('#maStop', root).onclick = () => A.stop();
    $('#maLang', root).onclick = () => { save(); (window.MGS_setLang || (() => {}))(EN ? 'fr' : 'en'); };
    $('#maAuto', root).onclick = () => { st.auto = !st.auto; save(); bar(); toast(st.auto ? tx('🎬 Sons et musique automatiques', '🎬 Automatic sounds and music') : tx('Sons automatiques coupés', 'Automatic sounds off')); };
    $('#maSteps', root).addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    root.addEventListener('click', onClick);
    bindDnD();
    root.addEventListener('change', onChange);
    root.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.a === 'eop') { st.editOp = +e.target.value / 100; const sv = $('#maSvg', root); if (sv) sv.style.setProperty('--eo', st.editOp); save(); } });
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
    const SCR = [['brief', '📡 Briefing'], ['rules', tx('📜 Règles', '📜 Rules')], ['setup', tx('🗺️ Plateau & setup', '🗺️ Board & setup')], ['play', tx('🎲 Partie', '🎲 Play')], ['debrief', tx('🏁 Débrief', '🏁 Debrief')]];
    $('#maSteps', root).style.display = m && st.screen !== 'home' ? '' : 'none';
    $('#maSteps', root).innerHTML = SCR.map(([k, t]) => `<button class="ma-b ${st.screen === k ? 'on' : ''}" data-go="${k}">${t}</button>`).join('');
    $('#maTtl', root).textContent = m && st.screen !== 'home' ? `${typeof m.id === 'number' ? 'Stage ' + m.id : m.id} · ${m.name}` : tx('Assistant de partie', 'Game assistant');
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
    body.innerHTML = `<h2 style="margin:4px 0 10px">${tx('Choisis ta mission', 'Choose your mission')}</h2><div class="ma-mis">${MIS().map(m => {
      const g = st.games[m.id], live = g && g.started && !g.over;
      return `<button class="ma-mt ${cl[m.id] ? 'ok' : ''} ${live ? 'live' : ''}" data-a="pick" data-v="${m.id}"><span class="nb">${typeof m.id === 'number' ? String(m.id).padStart(2, '0') : 'VR'}</span>
        <div class="nm">${esc(m.name)}</div><small>${m.type === 'sneak' ? tx('🕵️ Infiltration', '🕵️ Sneaking') : '👾 Boss'} · ⏱ ${esc(m.time || '?')}</small>${live ? `<br><small style="color:#9ec0ff">▶ ${tx('Partie en cours', 'Game in progress')} (round ${g.round})</small>` : ''}</button>`;
    }).join('')}</div>`;
  }

  /* ======================= 📡 Briefing ======================= */
  function vBrief(m) {
    const n = pcounts(m);
    body.innerHTML = `<div class="ma-codec"><div><div class="face">📡</div><div class="fq" style="font-size:1rem;margin-top:6px">140.85</div></div>
        <div><div class="fq">${esc(m.name)}${m.subtitle ? ` <span style="font-size:1rem;opacity:.7">— ${esc(m.subtitle)}</span>` : ''}</div><div class="txt" id="maTxt"></div></div></div>
      <div class="ma-card"><h4>👥 ${tx('Combien de joueurs ?', 'How many players?')}</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${n.map(k => `<button class="ma-b ${+k === st.n ? 'on' : ''}" data-a="n" data-v="${k}">${k} ${tx('joueur', 'player')}${k > 1 ? 's' : ''} : ${pchars(m, +k).map(c => CE[c] + ' ' + c).join(', ')}</button>`).join('')}</div>
        ${(m.players || {}).note ? `<p style="opacity:.75">${(m.players.note || []).join(' ')}</p>` : ''}</div>
      <div class="ma-two"><div class="ma-card"><h4>🎯 ${tx('Objectif', 'Objective')}</h4>${list(m.objective)}</div><div class="ma-card warn"><h4>💀 ${tx('Échec si…', 'You fail if…')}</h4>${list(m.failure)}</div></div>
      <div class="ma-next"><button class="ma-b" data-a="read">📡 ${tx('Relire', 'Replay')}</button><button class="ma-b pri big" data-go="rules">${tx('Continuer ▶', 'Continue ▶')}</button></div>`;
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
    body.innerHTML = `${errs.length || faq.length ? `<div class="ma-card err"><h4>⚠️ ${tx('Errata & précisions officielles', 'Official errata & clarifications')}</h4>${list(errs)}${faq.map(q => `<p><b>${q.q}</b><br>${q.a}</p>`).join('')}</div>` : ''}
      ${special ? `<div class="ma-card"><h4>📜 ${tx('Règles spéciales', 'Special rules')}</h4><ul>${special}</ul></div>` : ''}
      ${events ? `<div class="ma-card"><h4>🅰️ ${tx('Events (dès qu\'une figurine entre dessus)', 'Events (as soon as a figure enters them)')}</h4><ul style="list-style:none;padding:0">${events}</ul></div>` : ''}
      ${m.boss ? `<div class="ma-card boss"><h4>👾 ${esc(m.boss.name)}</h4>${m.boss.health ? `<p><b>${tx('Santé', 'Health')} :</b> ${m.boss.health}</p>` : ''}${m.boss.defense ? `<p><b>${tx('Défense', 'Defense')} :</b> ${m.boss.defense}</p>` : ''}${list(m.boss.notes)}</div>` : ''}
      <div class="ma-card"><h4>🏆 ${tx('Si réussi', 'Stage cleared')}</h4>${list(m.cleared)}</div>
      ${m.tips && m.tips.length ? `<div class="ma-card"><h4>💡 ${tx('Conseils', 'Tips')}</h4>${list(m.tips)}</div>` : ''}
      <div class="ma-card"><h4>📞 ${tx('Le Codec, c\'est quand ?', 'When do I use the Codec?')}</h4><p>${tx('Numéro <b>imprimé sur le plateau</b> : quand ta figurine passe dessus, 1 seul appel par stage (par le joueur sur la case, jamais en VR Missions). Numéro <b>sur un composant</b> (carte, dashboard…) : quand tu veux, autant de fois que tu veux. Action 📞 Codec de la partie pour lire le résumé.', 'Number <b>printed on the board</b>: when your figure moves over it, one call per Stage (by the player on that space, never in VR Missions). Number <b>on a component</b> (card, dashboard…): any time, as often as you like. Use the 📞 Codec action in play to read the summary.')}${m.id === 8 ? tx(' <b>Errata Mantis :</b> Codec 3.14 → lire 3.11.', ' <b>Mantis errata:</b> Codec 3.14 → read 3.11.') : ''}</p></div>
      <div class="ma-next"><button class="ma-b pri big" data-go="setup">${tx('Continuer ▶', 'Continue ▶')}</button></div>`;
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
    const label = p => p.k === 'player' ? `${CE[p.owner] || ''} ${p.owner}` : p.k === 'guard' ? tx('💂 Garde', '💂 Guard') : p.k === 'cam' ? tx('📹 Caméra', '📹 Camera') : '👾 Boss';
    return `<div class="ma-bd"><div class="ma-bdt"><button class="ma-b sm" data-a="zoom" data-v="-1">🔍−</button><button class="ma-b sm" data-a="zoom" data-v="1">🔍+</button>
        <span style="flex:1;opacity:.85;font-size:.9rem">${ui.place ? tx('👆 Touche le plan pour poser le pion', '👆 Tap the map to place the piece') : ui.pend && ui.pend.type === 'move' ? tx('👆 Touche la case où tu vas', '👆 Tap where you move') : ui.pend && ui.pend.type === 'target' ? tx('👆 Touche la cible', '👆 Tap the target') : tx('Glisse un pion pour le corriger · touche-le pour ses options', 'Drag a piece to correct it · tap it for options')}</span>
        <button class="ma-b sm" data-a="add" data-v="guard" title="${tx('Ajouter un garde', 'Add a Guard')}">＋💂</button><button class="ma-b sm" data-a="add" data-v="cam" title="${tx('Ajouter une caméra', 'Add a Camera')}">＋📹</button></div>
      <div class="ma-bds"><div class="ma-map ${pick ? 'pick' : ''}" id="maMap" style="width:${Math.round(100 * (st.zoom || 1))}%">${src ? `<img src="${src}" alt="Plan">` : `<p style="padding:40px;color:#333">${tx('Pas de plan', 'No map')}</p>`}${pcs}</div></div>
      ${unplaced.length ? `<div class="ma-tray"><span style="opacity:.75;align-self:center">${tx('À poser :', 'To place:')}</span>${unplaced.map(p => `<button class="ma-b sm ${ui.place === p.id ? 'wait' : ''}" data-a="place" data-v="${p.id}">${label(p)}</button>`).join('')}</div>` : ''}</div>`;
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
    if (ui.place) { snap(); const p = piece(ui.place); if (p) { p.x = x; p.y = y; log(`${tx('Pion posé', 'Piece placed')} : ${p.k === 'player' ? p.owner : p.k}`, 'sys'); } ui.place = null; nextUnplaced(g); save(); render(); return; }
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
      ...(isSneak(m) ? [tx('Guard dashboard : deck Guard Order (bleues mélangées SUR les rouges) + deck Guard Reaction (6) mélangé.', 'Guard dashboard: Guard Order deck (shuffled blue cards ON TOP of the red ones) + shuffled Guard Reaction deck (6).')] : []),
      tx(`Chaque joueur (${chars.map(c => CE[c] + ' ' + c).join(', ')}) : dashboard, 4 jetons Action, 4 Focus, jeton Attention, équipement (≤ limite) + munitions.`, `Each player (${chars.map(c => CE[c] + ' ' + c).join(', ')}): dashboard, 4 Action tokens, 4 Focus tokens, Attention token, equipment (≤ limit) + ammo.`),
      tx('Dés et jetons (dégâts, KO, Mort…) en réserve.', 'Dice and tokens (damage, KO, Dead…) in a supply.')];
    const errs = (m.errata || []).filter(e => /setup|mise en place|carte|barracks|tuile|plan|icône|placer|card|tile|map|icon|place/i.test(e));
    if (!ui.place && !g.started && !ui.sel) nextUnplaced(g);
    body.innerHTML = `${errs.length ? `<div class="ma-card err"><h4>⚠️ ${tx('Errata pour la mise en place', 'Setup errata')}</h4>${list(errs)}</div>` : ''}
      <div class="ma-play"><div>${boardHtml(m, g, 'setup')}<p style="opacity:.7;font-size:.9rem;margin:6px 2px">${g.grid ? tx('Les pions sont placés comme sur le livret. Pour corriger : fais glisser un pion du doigt (ou touche-le puis une case ; ⟲⟳ pour le regard).', 'Pieces are placed as in the book. To correct: drag a piece with your finger (or tap it, then a space; ⟲⟳ to turn it).') + ` <button class="ma-b sm" data-a="resetPos">${tx('↺ Replacer selon le livret', '↺ Reset to the book layout')}</button>` : tx('Pose les pions comme sur le vrai plateau (zone de départ, gardes et leur regard avec ⟲⟳). Facultatif : tu peux jouer sans poser les gardes.', 'Place the pieces as on the real board (starting area, Guards and their facing with ⟲⟳). Optional: you can play without placing the Guards.')}</p></div>
      <div><div class="ma-card" style="margin-top:0"><h4>🧰 ${tx('Matériel', 'Components')}</h4><p>${chars.map(c => `<span class="chip">${CE[c] || ''} ${c}</span>`).join('')}</p>${m.tiles && m.tiles.length ? `<p><b>${tx('Tuiles', 'Tiles')} :</b> ${m.tiles.join(', ')}</p>` : ''}${deck ? `<p><b>Guard Order :</b> ${deck}</p>` : ''}</div>
        ${selPanel(m, g)}
        <div class="ma-card"><h4>🎒 ${tx('Équipement', 'Equipment')}</h4>${invEditor(m, g)}</div>
        <div class="ma-card"><h4>✅ Checklist</h4><ul class="ma-chk">${stepsL.map((s, i) => `<li class="${chk[i] ? 'ok' : ''}" data-chk="${i}"><span class="bx">${chk[i] ? '✓' : ''}</span><span class="tx">${s}</span></li>`).join('')}</ul></div>
        <div class="ma-next">${g.started ? `<button class="ma-b pri big" data-go="play">▶ ${tx('Retour à la partie', 'Back to the game')}</button>` : `<button class="ma-b pri big" data-a="start">🎬 ${tx('Continuer : commencer la partie', 'Continue: start the game')}</button>`}</div></div></div>`;
    bindBoard();
  }

  function selPanel(m, g) {
    const p = ui.sel && piece(ui.sel); if (!p) return '';
    const rot = `<button class="ma-b sm" data-a="rot" data-v="-1">⟲</button><button class="ma-b sm" data-a="rot" data-v="1">⟳</button>`;
    const play = st.screen === 'play';
    let h = '';
    if (p.k === 'guard') h = `💂 <b>${tx('Garde', 'Guard')}</b> ${p.hurt ? `<b style="color:#ff8a96">(${tx('blessé', 'wounded')})</b>` : ''}<br>${rot} <button class="ma-b sm" data-a="pko">⭐ KO</button> <button class="ma-b sm" data-a="pdead">☠ ${tx('Mort', 'Dead')}</button> <button class="ma-b sm" data-a="phurt">🩸 ${tx('Blessé', 'Wounded')}</button>${play ? g.players.map((q, i) => ` <button class="ma-b sm" data-a="seen" data-v="${i}">👁️ ${tx('Voit', 'Sees')} ${q.name}</button>`).join('') : ''} <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'cam') h = `📹 <b>${tx('Caméra', 'Camera')}</b><br>${rot}${play ? g.players.map((q, i) => ` <button class="ma-b sm" data-a="camSeen" data-v="${i}">📹 ${tx('Voit', 'Sees')} ${q.name}</button>`).join('') : ''} <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'boss') h = `👾 <b>${esc((m.boss || {}).name || 'Boss')}</b><br>${rot}`;
    else if (p.k === 'ko2' || p.k === 'ko1') h = `⭐ <b>${tx('Garde KO', 'KO\'d Guard')}</b> (${p.k === 'ko2' ? '★★' : '★'})<br><button class="ma-b sm" data-a="pwake">💂 ${tx('Se relève', 'Wakes up')}</button> <button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'dead') h = `☠ <b>${tx('Garde mort', 'Dead Guard')}</b> (${tx('glisse-le pour le cacher', 'drag it to hide the body')})<br><button class="ma-b sm red" data-a="prm">🗑</button>`;
    else if (p.k === 'q' || p.k === 'a') h = `${tx('Jeton Attention de', 'Attention token of')} <b>${p.owner}</b> (${p.k === 'q' ? '?' : '!'})<br><button class="ma-b sm" data-a="pflip">🔄 ${tx('Retourner', 'Flip')}</button> <button class="ma-b sm red" data-a="prmatt">🗑 ${tx('Retirer (Guard Reaction)', 'Remove (Guard Reaction)')}</button>`;
    else if (p.k === 'player') h = `${CE[p.owner] || ''} <b>${p.owner}</b>`;
    return `<div class="ma-ask" style="margin-top:0">${h} <button class="ma-b sm" data-a="unsel">✕</button></div>`;
  }

  /* ======================= 🎲 Partie ======================= */
  const ACTS = [
    { id: 'sneak', i: '🚶', n: 'Sneak', c: 1, move: 1, tip: tx('1 case, jamais en diagonale.', '1 space, never diagonally.') },
    { id: 'dash', i: '🏃', n: 'Dash', c: 1, move: 2, noisy: 1, tip: tx('2 cases. 🔊 Bruyant : noise check en fin de tour.', '2 spaces. 🔊 Noisy: noise check at the end of your turn.') },
    { id: 'h2h', i: '👊', n: tx('Corps-à-corps', 'Hand-to-hand'), c: 1, atk: 'ko', dice: ['w'], sfx: 'punch-guard-kox1.mp3', tip: tx('Cible adjacente, 1 dé blanc, dégâts KO.', 'Adjacent target, 1 white die, KO damage.') },
    { id: 'combo', i: '🥊', n: 'Combo', c: 2, atk: 'ko', dice: ['w', 'w', 'b'], sfx: 'knock-out-guard-kox2.mp3', tip: tx('Cible adjacente, 2 blancs + 1 noir, dégâts KO.', 'Adjacent target, 2 white + 1 black, KO damage.') },
    { id: 'silent', i: '🤫', n: tx('Élim. silencieuse', 'Silent Takedown'), c: 2, only: 'Snake', atk: 'silent', sfx: 'mgs-silent-takedown.mp3', tip: tx('DANS LE DOS d\'un garde adjacent → jeton Mort, sans bruit.', 'BEHIND an adjacent Guard → replace it with a Dead token, silently.') },
    { id: 'shoot', i: '🔫', n: tx('Tir', 'Shoot'), c: 1, need: 'gun', atk: 'kill', dice: null, loud: 1, gun: 1, sfx: 'mgs-socom.mp3', tip: tx('LOUD (sauf si la carte dit silencieux). Lance les dés de la carte.', 'LOUD (unless the card says suppressed). Roll the card\'s dice.') },
    { id: 'shootS', i: '🔇', n: tx('Tir silencieux', 'Suppressed shot'), c: 1, need: 'sgun', atk: 'kill', dice: null, gun: 1, sfx: 'mgs-socom-silenced.mp3', tip: tx('Silencieux : vérifie sur la carte.', 'Suppressed: check the card.') },
    { id: 'gren', i: '💣', n: 'Grenade', c: 1, need: 'grenade', loud: 1, gun: 1, sfx: 'mgs-grenade.mp3', then: 'mgs-explosion.mp3', tip: tx('LOUD → ! sous toi. Effet : voir la carte.', 'LOUD → ! under you. Effect: see the card.') },
    { id: 'chaff', i: '✨', n: 'Chaff', c: 1, need: 'chaff', gun: 1, auto: 'chaff', thenAuto: 'chaffJam', tip: tx('Voir la carte Équipement.', 'See the Equipment card.') },
    { id: 'knock', i: '✊', n: tx('Toquer', 'Knock'), c: 1, sfx: 'mgs-knock-a.mp3', att: 1, tip: tx('Ton jeton ? sur ta case : le garde le plus proche viendra.', 'Your ? token on your space: the nearest Guard will come.') },
    { id: 'drag', i: '🫳', n: tx('Traîner corps', 'Drag body'), c: 1, noisy: 1, move: 1, tip: tx('Prends un KO/Mort à côté, bouge d\'1, pose-le à côté. 🔊', 'Take an adjacent KO/Dead, move 1, drop it adjacent. 🔊') },
    { id: 'interact', i: '🚪', n: tx('Porte / objet', 'Interact'), c: 1, auto: 'door', tip: tx('Porte verrouillée : dés du dashboard, relance en recommençant, tout dans le même tour.', 'Locked door: roll the dice shown, reroll by interacting again, all in the same turn.') },
    { id: 'elev', i: '🛗', n: tx('Ascenseur', 'Elevator'), c: 1, auto: 'elevCall', thenAuto: 'elevator', tip: tx('L\'ascenseur part avec toutes les figurines dedans (le jeton Attention suit).', 'The elevator moves with every figure inside (the Attention token follows).') },
    { id: 'disguise', i: '🥸', n: tx('Déguisement', 'Disguise'), c: 2, only: 'Meryl', tip: tx('À côté d\'un KO/Mort, jeton Attention pas sur la carte.', 'Next to a KO/Dead, with your Attention token off the map.') },
    { id: 'hack', i: '💻', n: 'Hack', c: 1, only: 'Otacon', tip: tx('4 dés noirs (+bonus), relance ; combinaison du Terminal dans le même tour.', '4 black dice (+bonus), reroll; complete the Terminal combo in the same turn.') },
    { id: 'search', i: '🔎', n: 'System Search', c: 1, only: 'Otacon', tip: tx('Terminal piraté : pioche 1 carte System (max 3).', 'Hacked Terminal: draw 1 System card (max 3).') },
    { id: 'access', i: '⚙️', n: 'Access', c: 1, only: 'Otacon', tip: tx('Jusqu\'à 4 dés noirs sur les cartes System.', 'Up to 4 black dice on System cards.') },
    { id: 'focus', i: '🎯', n: 'Focus', c: 1, tip: tx('Coût sur la face grise (ajoute un point si 2).', 'Cost shown on the gray side (add one if it says 2).') },
    { id: 'ration', i: '🍴', n: 'Ration', c: 1, need: 'ration', auto: 'ration', tip: tx('Voir la carte.', 'See the card.') },
    { id: 'leap', i: '🤸', n: tx('Saute un garde', 'Leapfrog'), c: 0, leap: 1, tip: tx('Chaque garde sauté t\'attaque (2 dés noirs) et ton jeton passe sur !.', 'Each leapfrogged Guard attacks you (2 black dice) and your token flips to !.') },
    { id: 'item', i: '🎒', n: tx('Objet trouvé', 'Item found'), c: 0, auto: 'pop', thenAuto: 'pickup', tip: tx('Un objet apparaît / ramassé.', 'An item appears / is picked up.') },
    { id: 'wall', i: '🧱', n: tx('Dos au mur', 'Back to the wall'), c: 0, auto: 'wall', tip: tx('Ambiance.', 'Atmosphere.') },
    { id: 'codec', i: '📞', n: 'Codec', c: 0, auto: 'codec', tip: tx('Numéro Codec → Codec Book (gratuit).', 'Codec number → Codec Book (free).') },
  ];
  const GENERIC = ['shoot', 'shootS', 'gren', 'chaff', 'ration'];   // remplacées par les cartes quand l'inventaire est renseigné
  const actsFor = p => ACTS.filter(a => (!a.only || a.only === p.name) && !(a.gun && p.name === 'Otacon') && !(p.inv && GENERIC.includes(a.id))).concat(itemActs(p));
  const actById = (id, p) => ACTS.find(a => a.id === id) || (p ? itemActs(p).find(a => a.id === id) : null) || null;
  function itemActs(p) {
    if (!p || !p.inv) return [];
    const out = [];
    p.inv.forEach(it => {
      const cd = it.num ? CARDS[it.num] : null, kind = cd ? cd.kind : it.type === 'gun' || it.type === 'sgun' ? 'shoot' : it.type === 'ration' ? 'heal' : it.type === 'grenade' ? 'frag' : it.type === 'chaff' ? 'chaff' : null;
      if (!kind || kind === 'passive') return;
      const b = { id: 'it-' + it.id, item: it.id, i: icOf(it), n: nameOf(it), c: cd ? cd.cost : 1, tip: (cd && cd.tip) || '', eff: kind };
      if (kind === 'shoot') {
        const cls = cd ? cd.cls : /fusil|rifle/i.test(it.name) ? 'rifle' : 'pistol';
        const sil = it.type === 'sgun' || p.inv.some(x => x.num && CARDS[x.num] && CARDS[x.num].sil === cls);
        out.push(Object.assign(b, { atk: 'kill', dice: cd ? cd.dice : null, loud: sil ? 0 : 1, gun: 1, ammo: it.uses != null, sfx: sil ? 'mgs-socom-silenced.mp3' : cls === 'rifle' ? 'mgs-fa-mas.mp3' : 'mgs-socom.mp3', n: nameOf(it) + (sil ? ' 🔇' : '') }));
      } else if (kind === 'heal') out.push(Object.assign(b, { n: 'Ration', auto: 'ration' }));
      else if (kind === 'chaff') out.push(Object.assign(b, { gun: 1, auto: 'chaff', thenAuto: 'chaffJam' }));
      else if (kind === 'stun' || kind === 'frag') out.push(Object.assign(b, { gun: 1, loud: 1, sfx: 'mgs-grenade.mp3', then: 'mgs-explosion.mp3' }));
      else if (kind === 'c4') { out.push(Object.assign(b, { n: tx('Poser C-4', 'Plant C-4'), gun: 1, sfx: 'mgs-pick-up-item.mp3' })); out.push(Object.assign({}, b, { id: 'it-' + it.id + '-x', n: tx('Faire sauter C-4', 'Detonate C-4'), i: '💥', eff: 'detonate', gun: 1, sfx: 'mgs-explosion.mp3' })); }
      else if (kind === 'plant') out.push(Object.assign(b, { n: tx('Poser : ', 'Plant: ') + nameOf(it), gun: 1, sfx: 'mgs-pick-up-item.mp3' }));
      else if (kind === 'missile') out.push(Object.assign(b, { gun: 1, loud: 1, sfx: 'mgs-grenade.mp3', then: 'mgs-explosion.mp3' }));
      else if (kind === 'box') out.push(Object.assign(b, { n: tx('Se cacher (carton)', 'Hide (box)') }));
      else if (kind === 'stealth') out.push(Object.assign(b, { n: tx('Camouflage optique', 'Stealth Camouflage') }));
      else out.push(Object.assign(b, kind === 'key' ? { sfx: 'mgs-door-open.mp3' } : {}));
    });
    return out;
  }
  const itemOf = (p, a) => a && a.item && p.inv ? p.inv.find(i => i.id === a.item) : null;
  // consomme la carte (munition, jeton, dose) ; défausse quand il n'en reste plus
  function consume(p, a) {
    if (a.need) return useItem(p, a.need);
    const it = itemOf(p, a); if (!it) return;
    if (a.eff === 'shoot' && hasCard(p, 23)) return;            // bandana : munitions infinies
    if (a.eff === 'detonate') { it.planted = 0; return; }
    if (a.eff === 'c4' || a.eff === 'plant') it.planted = (it.planted || 0) + 1;
    if (it.uses == null) return;
    it.uses = Math.max(0, it.uses - 1);
    if (it.uses === 0 && !(a.eff === 'c4' && it.planted)) { p.inv = p.inv.filter(x => x !== it); toast(`${icOf(it)} <b>${esc(nameOf(it))}</b> ${tx('épuisé : défausse la carte (elle revient dans la Memory Box au prochain stage).', 'used up: discard the card (it returns to the Memory Box next Stage).')}`, 3800); }
  }

  function setAtt(g, p, v, why, manual) {
    const before = p.att;
    if (v === 1 && before === 2 && !manual) { toast(tx('Ton jeton est déjà sur <b>!</b> : il se déplace sur ta case et reste sur !', 'Your token is already on <b>!</b>: it moves to your space and stays on !')); placeAtt(g, p); return; }
    p.att = v;
    if (v === 0) { const t = attPiece(g, p.name); if (t) g.pieces = g.pieces.filter(x => x !== t); }
    else placeAtt(g, p);
    if (v === 2 && before !== 2) { A.sfx(AU().alert); g.alerts++; p.s.alerts++; log(tx(`🚨 ${p.name} repéré${why ? ' (' + why + ')' : ''} : jeton ! → ALERTE`, `🚨 ${p.name} spotted${why ? ' (' + why + ')' : ''}: ! token → ALERT`), 'alert', p.name); toast(tx(`🚨 <b>${p.name}</b> : jeton <b>!</b> sous sa figurine${why ? ' (' + why + ')' : ''}. Les gardes de sa zone passent en ALERTE.`, `🚨 <b>${p.name}</b>: <b>!</b> token under the figure${why ? ' (' + why + ')' : ''}. Guards in that zone go into ALERT mode.`), 3500); }
    if (v === 1 && before === 0) { A.sfx(AU().investigate); log(tx(`❓ ${p.name} : jeton ? posé${why ? ' (' + why + ')' : ''}`, `❓ ${p.name}: ? token placed${why ? ' (' + why + ')' : ''}`), 'alert', p.name); toast(tx(`❓ Jeton <b>?</b> de ${p.name} posé : le garde le plus proche viendra voir.`, `❓ ${p.name}'s <b>?</b> token placed: the nearest Guard will investigate.`)); }
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
    if (!g.started) { body.innerHTML = `<div class="ma-card"><h4>${tx('La partie n\'a pas commencé', 'The game hasn\'t started')}</h4><p>${tx('Termine la mise en place puis appuie sur Continuer.', 'Finish the setup, then press Continue.')}</p><button class="ma-b pri big" data-go="setup">${tx('🗺️ Plateau & setup', '🗺️ Board & setup')}</button></div>`; return; }
    body.innerHTML = `<div class="ma-play"><div>${boardHtml(m, g, 'play')}</div><div>${panelHtml(m, g)}</div></div>`;
    bindBoard(); tick();
    // phase ennemie : on montre le garde qui va jouer (une seule fois par garde, pour laisser l'utilisateur déplacer la vue)
    // phase ennemie : le panneau suit l'étape en cours de la carte Guard Order
    if (g.phase === 2 && ui.stepFocus !== g.step) { ui.stepFocus = g.step; const cs = body.querySelector('.ma-step.cur'), col = cs && cs.closest('.ma-play>div'); if (cs && col) setTimeout(() => col.scrollTo({ top: Math.max(0, col.scrollTop + cs.getBoundingClientRect().top - col.getBoundingClientRect().top - 60), behavior: document.hidden ? 'auto' : 'smooth' }), 40); }
    if (g.phase === 2 && ui.seq && ui.seq.i < ui.seq.ids.length) { const gp = piece(ui.seq.ids[ui.seq.i]); if (gp && gp.x != null && ui.focusId !== gp.id) { ui.focusId = gp.id; setTimeout(() => focusOn(gp.x, gp.y), 30); } }
  }
  function hudHtml(m, g) {
    const total = g.deck ? g.deck.red + g.deck.blue : 0, left = g.deck ? Math.max(0, total - g.deck.drawn) : 0;
    const alert = g.players.some(p => p.att === 2);
    return `<div class="ma-hud"><span class="pill">ROUND ${g.round}</span><span class="pill" id="maClock">⏱ ${fmtT((g.t1 || now()) - g.t0)}</span>
      ${g.deck ? `<span class="pill" title="${tx('Paquet Guard Order', 'Guard Order deck')}">🃏 ${left}${g.deck.drawn >= g.deck.blue ? ' 🔴' : ''}</span>` : ''}${isBoss(m) ? `<span class="pill">👾 💥${g.boss.dmg}</span>` : ''}
      ${alert ? `<span class="pill al">🚨 ${tx('ALERTE', 'ALERT')}</span>` : ''}<span style="flex:1"></span><button class="ma-b sm" data-a="undo" ${undo.length ? '' : 'disabled'} title="${tx('Annuler', 'Undo')}">↶</button></div>
      ${g.deck ? `<div class="ma-deck">${Array.from({ length: total }, (_, i) => `<i class="${i < g.deck.drawn ? 'x' : (i < g.deck.blue ? 'b' : 'r')}"></i>`).join('')}</div>` : ''}
      <div class="ma-ph">${[tx('1 · Début', '1 · Start'), tx('2 · Joueurs', '2 · Players'), tx('3 · Ennemis', '3 · Enemies')].map((t, i) => `<button class="ma-b sm ${g.phase === i ? 'on' : ''}" data-a="phase" data-v="${i}">${t}</button>`).join('')}</div>`;
  }
  function panelHtml(m, g) {
    let h = hudHtml(m, g) + selPanel(m, g);
    if (g.over) h += `<div class="ma-ban ${g.over === 'win' ? 'win' : 'go'}">${g.over === 'win' ? tx('🏆 MISSION RÉUSSIE', '🏆 MISSION COMPLETE') : tx('💀 MISSION ÉCHOUÉE', '💀 MISSION FAILED')}${g.why ? `<div style="font-size:1rem;font-weight:600">${esc(g.why)}</div>` : ''}</div><button class="ma-b pri big" data-go="debrief">🏁 ${tx('Voir le débrief', 'See the debrief')}</button>`;
    if (g.phase === 0) h += `<div class="ma-card"><h4>🔄 ${tx('Début du round', 'Start of round')} ${g.round}</h4><p>${tx('Chacun reprend ses <b>4 jetons Action</b>.', 'Everyone takes back their <b>4 Action tokens</b>.')}</p><button class="ma-b pri big" data-a="toPlayers">▶ ${tx('Phase Joueurs', 'Player phase')}</button></div>`;
    else if (g.phase === 1) h += playersHtml(m, g);
    else h += enemyHtml(m, g);
    h += `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap"><button class="ma-b sm" data-a="win">🏆 ${tx('Mission réussie', 'Mission complete')}</button><button class="ma-b sm red" data-a="lose">💀 ${tx('Échec', 'Failed')}</button><span style="flex:1"></span><button class="ma-b sm" data-a="restart">↺ ${tx('Recommencer', 'Restart')}</button></div>`;
    return h;
  }

  function playersHtml(m, g) {
    const cur = g.players[g.cur] && !g.players[g.cur].done ? g.cur : g.players.findIndex(x => !x.done);
    if (cur < 0) return `<div class="ma-card"><h4>✅ ${tx('Tout le monde a joué', 'Everyone has played')}</h4><button class="ma-b pri big" data-a="toEnemy">▶ ${tx('Phase Ennemie', 'Enemy phase')}</button></div>`;
    g.cur = cur;
    const p = g.players[cur], hp = hpOf(p.name);
    const evs = m.events || [], cq = stageSnd(m).cues || [];
    let h = `${g.players.length > 1 ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${g.players.map((x, i) => `<button class="ma-b sm ${i === cur ? 'on' : ''}" data-a="who" data-v="${i}">${x.done ? '✔ ' : ''}${CE[x.name] || ''} ${x.name}</button>`).join('')}</div>` : ''}
      <div class="ma-p" style="--c:${CC[p.name] || '#2a3474'}"><h5>${CE[p.name] || ''} ${tx('Au tour de', 'Your turn,')} ${p.name}<span style="flex:1"></span><span class="ma-hp">${hp ? Array.from({ length: hp }, (_, k) => `<i class="${k < p.dmg ? 'd' : ''}"></i>`).join('') : '💔' + p.dmg}</span></h5>
      <div class="ma-tok">${[0, 1, 2, 3].map(k => `<i class="${k < p.left ? '' : 'u'}"></i>`).join('')}<span style="opacity:.8">${p.left} ${tx(`point${p.left > 1 ? 's' : ''} d'action`, `action${p.left > 1 ? 's' : ''} left`)}${p.noisy ? ` · 🔊×${p.noisy}` : ''}</span><button class="ma-b sm" data-a="undo" ${undo.length ? '' : 'disabled'} title="${tx('Annuler la dernière action', 'Undo the last action')}">↶ ${tx('Annuler', 'Undo')}</button><span style="flex:1"></span><button class="ma-b sm ${p.water ? 'on' : ''}" data-a="water" title="${tx('Dans l\'eau', 'In water')}">💧</button>${!ui.pad && !p.ask && !(ui.pend && !(ui.pend.type === 'move' && isGrid(m))) ? `<button class="ma-b sm pri" data-a="end">🏁 ${tx('Fin du tour', 'End turn')}</button>` : ''}</div>
      <div class="ma-invl">🎒 ${invChips(p)}<button class="ma-mini ${ui.inv ? 'on' : ''}" data-a="invToggle">✏️</button></div>
      ${ui.inv ? `<div class="ma-card" style="margin:4px 0">${invEditor(m, g)}</div>` : ''}
      <div class="ma-att"><span style="opacity:.75">Attention</span><button class="ma-b sm ${p.att === 0 ? 'on' : ''}" data-a="att" data-v="0">—</button><button class="ma-b sm q ${p.att === 1 ? 'on' : ''}" data-a="att" data-v="1">?</button><button class="ma-b sm a ${p.att === 2 ? 'on' : ''}" data-a="att" data-v="2">!</button><span style="flex:1"></span><button class="ma-b sm" data-a="dmg" data-v="-1">−</button><button class="ma-b sm red" data-a="dmg" data-v="1">💥 ${tx('Dégât', 'Damage')}</button></div>`;
    const moving = ui.pend && ui.pend.type === 'move' && isGrid(m);
    if (ui.pad) h += padHtml(m, g);
    else if (ui.pend && !moving) h += pendHtml(m, g, p);
    else if (p.ask) h += askHtml(p);
    else {
      const ma = moving && actById(ui.pend.act, p);
      h += moving ? `<div class="ma-mv">${ma.i} <b>${ma.n}</b> : ${tx('👆 touche une case verte (ou fais glisser ton pion)', '👆 tap a green space (or drag your piece)')} <span style="flex:1"></span><button class="ma-b sm red" data-a="cancel">✕</button></div>`
        : `<p style="opacity:.8;margin:6px 0">${tx('Choisis une action (ou touche ton pion pour marcher).', 'Choose an action (or tap your piece to move).')}</p>`;
      const grid = isGrid(m);
      h += `<div class="ma-acts">${actsFor(p).filter(a => !(grid && (a.id === 'leap' || a.id === 'wall'))).map(a => { const why = whyNot(m, g, p, a), on = moving && ui.pend.act === a.id;
        return `<button class="ma-act ${a.loud ? 'loud' : a.noisy ? 'noisy' : ''} ${on ? 'on' : ''}" data-a="act" data-v="${a.id}" ${why ? 'disabled' : ''} title="${esc(why || a.tip)}"><span class="i">${a.i}</span>${a.n}<small>${why ? '⛔ ' + why : (a.c ? a.c + ' ' + tx('pt', 'act') + (a.c > 1 ? 's' : '') : tx('gratuit', 'free')) + (a.loud ? ' · LOUD' : a.noisy ? ' · 🔊' : '')}</small></button>`; }).join('')}</div>
`;
    }
    h += `</div>`;
    if (evs.length || cq.length) h += `<div class="ma-card"><h4>🅰️ ${tx('Sur le plateau', 'On the board')}</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${evs.map(e => `<button class="ma-b sm ${g.ev[e.k] ? 'on' : ''}" data-a="event" data-v="${e.k}"><span class="ma-ev">${e.k}</span>${g.ev[e.k] ? tx('atteint ✔', 'reached ✔') : tx('atteint ?', 'reached?')}</button>`).join('')}${cq.map(([f, t]) => `<button class="ma-b sm" data-a="cue" data-v="${esc(f)}">${esc(t)}</button>`).join('')}</div></div>`;
    return h;
  }
  function pendHtml(m, g, p) {
    const pd = ui.pend, a = actById(pd.act, p);
    const pp = playerPiece(g, p.name);
    if (pd.type === 'move') return `<div class="ma-ask"><p>${a.i} <b>${a.n}</b> : ${a.tip}<br>👆 <b>${tx(`Touche sur le plan la case où ${p.name} va.`, `Tap the space ${p.name} moves to.`)}</b></p>
      ${pp && pp.x != null ? '' : `<p style="opacity:.8">${tx('Ton pion n\'est pas sur le plan : pose-le (« À poser »), ou valide sans le plan.', 'Your piece isn\'t on the map: place it (“To place”), or confirm without the map.')}</p>`}
      <button class="ma-b" data-a="moveNo">✔ ${tx('Fait (sans le plan)', 'Done (without the map)')}</button> <button class="ma-b red" data-a="cancel">${tx('Annuler', 'Cancel')}</button></div>`;
    if (pd.type === 'elev') {
      const W6 = world(m), names = { B2: tx('Sous-sol B2', 'Basement B2'), B1: tx('Sous-sol B1', 'Basement B1'), L1: tx('Rez-de-chaussée L1', 'Ground floor L1'), main: tx('Ascenseur', 'Elevator') };
      if (pd.mode === 'call') return `<div class="ma-ask"><p>🛗 ${tx('Appeler l\'ascenseur à la cage', 'Call the elevator to shaft')} <b>${names[pd.to] || pd.to}</b> ? (${tx('il est actuellement en', 'it is currently at')} ${names[g.elev] || g.elev})</p><button class="ma-b pri" data-a="elevGo" data-v="${pd.to}">🛗 ${tx('Appeler (1 action)', 'Call (1 action)')}</button> <button class="ma-b red" data-a="cancel">${tx('Annuler', 'Cancel')}</button></div>`;
      return `<div class="ma-ask"><p>🛗 ${tx('Où va l\'ascenseur ? (tout ce qui est dedans voyage avec)', 'Where does the elevator go? (everything inside rides along)')}</p>${Object.keys(W6.shafts).filter(k => k !== g.elev).map(k => `<button class="ma-b pri" data-a="elevGo" data-v="${k}">${names[k] || k}</button>`).join(' ')} <button class="ma-b red" data-a="cancel">${tx('Annuler', 'Cancel')}</button></div>`;
    }
    if (pd.type === 'codec') {
      const q = pd.q || '', key = q.length === 4 ? q.slice(0, 2) + '.' + q.slice(2) : null, txt = key && (window.MGS_CODEC || {})[key];
      const shown = (q + '____').slice(0, 4).replace(/^(..)(..)$/, '$1.$2');
      return `<div class="ma-ask ma-codec2"><p>📞 <b>Codec</b> : ${tx('tape le numéro (sur le plateau, une carte, un dashboard…)', 'enter the number (from the board, a card, a dashboard…)')}</p>
        <div class="ma-cd">${shown}</div>
        <div class="ma-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button class="ma-b" data-a="cdk" data-v="${n}">${n}</button>`).join('')}<button class="ma-b" data-a="cdd">⌫</button></div>
        ${key ? `<div class="ma-res">${txt ? `<b>${key}</b> — ${esc(txt)}` : `<b>${key}</b> : ${tx('pas dans mes résumés. Lis la fiche dans le Codec Book.', 'not in my summaries. Read the entry in the Codec Book.')}`}<div style="opacity:.7;font-size:.85rem;margin-top:4px">${tx('Numéro imprimé sur le plateau : 1 seul appel par stage, par le joueur sur la case. Numéro sur un composant : quand tu veux.', 'Number printed on the board: one call per Stage, by the player on that space. Number on a component: any time.')}</div></div>` : ''}
        <button class="ma-b red" data-a="cancel">${tx('Fermer', 'Close')}</button></div>`;
    }
    if (pd.type === 'target') return `<div class="ma-ask"><p>${a.i} <b>${a.n}</b> : ${a.tip}<br>👆 <b>${tx('Touche le garde visé sur le plan.', 'Tap the targeted Guard on the map.')}</b></p>
      <button class="ma-b" data-a="targetNo">${tx('Cible hors plan', 'Target not on the map')}</button> <button class="ma-b red" data-a="cancel">${tx('Annuler', 'Cancel')}</button></div>`;
    return '';
  }
  function askHtml(p) {
    if (p.ask === 'hurt') return `<div class="ma-ask warn"><p>⚠️ ${tx('Le garde blessé est-il <b>toujours debout</b> (ni KO ni mort) ?', 'Is the wounded Guard <b>still standing</b> (neither KO nor dead)?')}</p><button class="ma-b red" data-a="hurt" data-v="up">${tx('Oui → mon jeton passe sur !', 'Yes → my token flips to !')}</button> <button class="ma-b" data-a="hurt" data-v="down">${tx('Non', 'No')}</button></div>`;
    if (p.ask === 'noise') return `<div class="ma-ask warn"><p>🔊 <b>Noise check</b> : ${tx('un garde dans ta zone ?', 'any Guard in your zone?')}</p><button class="ma-b pri" data-a="noisePad">${tx(`Oui → je lance ${p.noisy} dé(s) blanc(s)`, `Yes → I roll ${p.noisy} white ${p.noisy > 1 ? 'dice' : 'die'}`)}</button> <button class="ma-b" data-a="noise">${tx('Pas de garde dans la zone', 'No Guard in the zone')}</button></div>`;
    return '';
  }

  /* ---------- pavé de dés ---------- */
  function openPad(o) { ui.pad = Object.assign({ vals: [], def: 3, fixed: null }, o); }
  function padHtml(m, g) {
    const pd = ui.pad, slots = pd.fixed ? pd.fixed.length : Math.max(pd.vals.length + 1, pd.min || 1);
    const colorAt = i => pd.fixed ? pd.fixed[i] : (pd.color || 'b');
    const nextCol = pd.fixed ? pd.fixed[pd.vals.length] : pd.color;
    const res = padResult();
    return `<div class="ma-ask"><p><b>${pd.title}</b><br><span style="opacity:.85">${pd.hint || tx('Lance les dés réels, puis tape les résultats.', 'Roll the real dice, then enter the results.')}</span></p>
      ${pd.showDef !== false ? `<div class="ma-att"><span>${tx('Défense', 'Defense')} ${pd.defLabel || tx('de la cible', 'of the target')} :</span><button class="ma-b sm" data-a="pdef" data-v="-1">−</button><b style="font-size:1.3rem;min-width:1.5ch;text-align:center">${pd.def}</b><button class="ma-b sm" data-a="pdef" data-v="1">＋</button></div>` : ''}
      ${pd.back ? `<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="checkbox" data-a="pback" ${pd.backOn ? 'checked' : ''} style="width:22px;height:22px"> ${tx('Dans le dos de la cible (Snake : +1 dégât, 1×/round)', 'Behind the target (Snake: +1 damage, once per round)')}</label>` : ''}
      <div class="ma-dice">${Array.from({ length: slots }, (_, i) => { const v = pd.vals[i]; const c = colorAt(i); const hit = v != null && v !== '!' && pd.showDef !== false && v >= pd.def; return `<div class="ma-die ${c} ${v == null ? 'e' : ''} ${hit ? 'hit' : ''} ${v === '!' ? 'bang' : ''}">${v == null ? '·' : v}</div>`; }).join('')}</div>
      <div class="ma-kp">${[1, 2, 3, 4, 5, 6].map(n => `<button class="ma-b" data-a="pk" data-v="${n}">${n}</button>`).join('')}<button class="ma-b" data-a="pk" data-v="!" ${nextCol === 'w' ? '' : 'disabled'} style="color:#ff6b7a">!</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ma-b sm" data-a="pdel">⌫</button>${pd.fixed ? '' : `<button class="ma-b sm" data-a="pcol">${pd.color === 'w' ? tx('⚪ dé blanc', '⚪ white die') : tx('⚫ dé noir', '⚫ black die')}</button>`}<span style="flex:1"></span><button class="ma-b red sm" data-a="pcancel">${tx('Annuler', 'Cancel')}</button></div>
      ${res ? `<div class="ma-res ${res.bad ? 'bad' : ''}">${res.txt}${res.do ? `<div class="do">🎲 ${tx('Sur le vrai plateau', 'On the real board')} : ${res.do}</div>` : ''}</div><button class="ma-b pri big" data-a="pok" ${res.ready ? '' : 'disabled'}>✔ ${tx('Valider', 'Confirm')}</button>` : ''}</div>`;
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
    if (pd.kind === 'noise') return { ready, bad: bang, txt: bang ? tx('❗ Un « ! » → tu attires l\'attention : jeton ? sur ta case.', '❗ A “!” → you draw attention: ? token on your space.') : tx('🤫 Aucun « ! » : personne n\'a rien entendu.', '🤫 No “!”: nobody heard a thing.'), do: bang ? tx('pose ton jeton Attention face ? sous ta figurine (ou déplace-le, sans changer sa face).', 'place your Attention token ?-side up under your figure (or move it, without flipping it).') : '' };
    if (pd.kind === 'ko' || pd.kind === 'kill') {
      const r = hits >= 2 ? (pd.kind === 'ko' ? 'ko' : 'dead') : hits === 1 ? 'hurt' : 'miss';
      pd.out = r;
      const t = { ko: tx('⭐ 2 dégâts KO : le garde est <b>assommé</b>.', '⭐ 2 KO damage: the Guard is <b>knocked out</b>.'), dead: tx('☠ Garde <b>éliminé</b>.', '☠ Guard <b>eliminated</b>.'), hurt: tx('🩸 1 dégât : le garde est blessé mais <b>debout</b>. Achève-le avant la fin du tour, sinon ton jeton passe sur !', '🩸 1 damage: the Guard is wounded but <b>still standing</b>. Finish it before the end of your turn, or your token flips to !'), miss: tx('💨 Raté.', '💨 Miss.') }[r];
      const d = { ko: tx('remplace la figurine par un jeton KO face ★★.', 'replace the figure with a KO token, ★★ side up.'), dead: tx('remplace la figurine par un jeton Mort.', 'replace the figure with a Dead token.'), hurt: tx('pose 1 jeton dégât à côté du garde.', 'place 1 damage token next to the Guard.'), miss: '' }[r];
      return { ready, bad: r === 'miss', txt: `${hits} ${tx('réussite(s)', 'hit(s)')} (${tx('dé', 'die')} ≥ ${pd.def})${pd.backOn && hits ? tx(' dont +1 dans le dos', ' incl. +1 from behind') : ''}. ${t}${bang ? tx('<br>❗ Un « ! » sur un dé blanc : tu attires l\'attention (jeton ?).', '<br>❗ A “!” on a white die: you draw attention (? token).') : ''}`, do: d + (bang ? tx(' Et ton jeton Attention sur ta case.', ' And your Attention token on your space.') : '') };
    }
    if (pd.kind === 'boss') return { ready, txt: tx(`💥 ${hits} dégât(s) au boss (dé ≥ ${pd.def}).${bang ? ' ❗ « ! » : attention attirée.' : ''}`, `💥 ${hits} damage to the boss (die ≥ ${pd.def}).${bang ? ' ❗ “!”: attention drawn.' : ''}`), do: hits ? tx(`place ${hits} dégât(s) sur le dashboard du boss.`, `place ${hits} damage on the boss dashboard.`) : '' };
    if (pd.kind === 'guardAtk' || pd.kind === 'bossAtk') return { ready, bad: hits > 0, txt: hits ? tx(`💥 ${pd.victim} subit <b>${hits}</b> dégât(s) (dé ≥ sa Défense ${pd.def}). Un Focus peut encore modifier un dé avant de valider.`, `💥 ${pd.victim} takes <b>${hits}</b> damage (die ≥ their Defense ${pd.def}). A Focus token can still modify a die before you confirm.`) : tx(`🛡️ ${pd.victim} ne subit aucun dégât.`, `🛡️ ${pd.victim} takes no damage.`), do: hits ? tx(`pose ${hits} jeton(s) dégât sur le dashboard de ${pd.victim}.`, `place ${hits} damage token(s) on ${pd.victim}'s dashboard.`) : '' };
    return null;
  }
  function applyPad(m, g) {
    const pd = ui.pad; const vals = pd.vals.filter(v => v != null); const bang = vals.includes('!');
    const hits = padHits(pd);
    const p = g.players.find(x => x.name === pd.actor);
    ui.pad = null;
    if (pd.kind === 'noise') {
      if (bang) { p.s.noise++; if (p.att === 0) setAtt(g, p, 1, 'noise check'); else { placeAtt(g, p); toast(tx('Ton jeton Attention se déplace sur ta case (sans changer de face).', 'Your Attention token moves to your space (same side up).')); } }
      log(`🔊 Noise check ${tx('de', '—')} ${p.name} (${vals.join(' ')}) : ${bang ? tx('« ! » → attention', '“!” → attention') : tx('rien', 'nothing')}`, bang ? 'alert' : '', p.name);
      p.ask = null; p.done = true; return endTurnFollow(g);
    }
    if (pd.kind === 'ko' || pd.kind === 'kill') {
      const r = hits >= 2 ? (pd.kind === 'ko' ? 'ko' : 'dead') : hits ? 'hurt' : 'miss';
      p.s.atk++; p.s.hit += hits; if (pd.backOn) p.sneakUsed = true;
      const tg = pd.target && piece(pd.target);
      if (r === 'ko') { g.ko2++; p.s.ko++; if (tg) { tg.k = 'ko2'; tg.hurt = false; } }
      if (r === 'dead') { g.dead++; p.s.kill++; if (tg) { tg.k = 'dead'; tg.hurt = false; } }
      if (r === 'hurt') { p.hurt = true; if (tg) tg.hurt = true; }
      log(`${pd.icon || '⚔️'} ${p.name} ${tx('attaque', 'attacks')} (${vals.join(' ')}, ${tx('Déf', 'Def')} ${pd.def}) → ${{ ko: tx('garde KO', 'Guard KO'), dead: tx('garde éliminé', 'Guard eliminated'), hurt: tx('garde blessé', 'Guard wounded'), miss: tx('raté', 'miss') }[r]}`, '', p.name);
      if (bang) setAtt(g, p, 1, tx('« ! » au dé', '“!” on a die'));
    }
    if (pd.kind === 'boss') { p.s.atk++; p.s.hit += hits; if (pd.backOn) p.sneakUsed = true; g.boss.dmg += hits; const vo = (stageSnd(m).voices || []).filter(x => /^(hind-hurt|tank hurt)/i.test(x[0])); if (hits && vo.length) A.sfx(vo[Math.floor(Math.random() * vo.length)][0]); log(tx(`💥 ${p.name} touche le boss : ${hits} dégât(s) (total ${g.boss.dmg})`, `💥 ${p.name} hits the boss: ${hits} damage (total ${g.boss.dmg})`), '', p.name); if (bang) setAtt(g, p, 1, tx('« ! » au dé', '“!” on a die')); }
    if (pd.kind === 'guardAtk' || pd.kind === 'bossAtk') {
      const v = g.players.find(x => x.name === pd.victim);
      if (hits) damage(m, g, v, hits, pd.kind === 'bossAtk' ? tx('le boss', 'the boss') : tx('un garde', 'a Guard'));
      else log(tx(`🛡️ ${v.name} encaisse sans dégât (${vals.join(' ')})`, `🛡️ ${v.name} takes no damage (${vals.join(' ')})`), '', v.name);
    }
  }
  function damage(m, g, v, n, by) {
    v.dmg += n; v.s.dmgIn += n; A.sfx((AU().damage || {})[v.name]);
    log(`💥 ${v.name} ${tx('subit', 'takes')} ${n} ${tx('dégât(s)', 'damage')}${by ? ' (' + by + ')' : ''} → ${v.dmg}${hpOf(v.name) ? '/' + hpOf(v.name) : ''}`, 'go', v.name);
    const hp = hpOf(v.name);
    if (hp && v.dmg >= hp) gameOver(m, g, tx(`${v.name} est KIA (tué au combat).`, `${v.name} is KIA (killed in action).`));
  }
  function gameOver(m, g, why) {
    if (g.over) return; g.over = 'go'; g.why = why; g.t1 = now(); A.sfx(AU().gameover);
    if (st.auto) { const f = stageSnd(m).fail; if (f) A.music(f, 'end'); else setTimeout(() => A.stop(), 1200); }
    log(tx('💀 MISSION ÉCHOUÉE : ', '💀 MISSION FAILED: ') + why, 'go'); toast('💀 ' + esc(why), 4500);
  }
  function win(m, g, why) {
    if (g.over) return; g.over = 'win'; g.why = why; g.t1 = now();
    setTimeout(() => A.sfx(AU().win), 900);
    if (st.auto) { const e = stageSnd(m).end; if (e) A.music(e, 'end'); else setTimeout(() => A.stop(), 1500); }
    const cl = LS.get('mgsg.cleared', {}); cl[m.id] = true; LS.set('mgsg.cleared', cl);
    log(tx('🏆 MISSION RÉUSSIE : ', '🏆 MISSION COMPLETE: ') + why, 'win');
  }
  function endTurnFollow(g) {
    ui.pend = null; ui.lastMove = null; g.players.forEach(x => { if (x.done) x.stealth = false; });
    const i = g.players.findIndex(x => !x.done);
    if (i >= 0) { g.cur = i; setTimeout(() => { A.sfx(AU().codec); turnBanner(`${CE[g.players[i].name] || ''} ${tx('Au tour de', 'Your turn,')} ${g.players[i].name}`); }, 250); }
    else toast(tx('✅ Tout le monde a joué → <b>Phase Ennemie</b>', '✅ Everyone has played → <b>Enemy phase</b>'));
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
      h += `<div class="ma-card boss"><h4>👾 ${tx('Tour du boss', 'Boss turn')}${m.boss ? ' : ' + esc(m.boss.name) : ''}</h4>
        <div class="ma-step cur"><span class="k">1</span><div class="bd">${tx('Retourne la carte du <b>dessus</b> du deck Boss et résous-la. Puis remets-la <b>dessous</b> (jamais mélangé).', 'Flip the <b>top</b> card of the Boss deck and resolve it. Then put it on the <b>bottom</b> (never shuffled).')}<br><button class="ma-b pri" data-a="bossCard" style="margin-top:6px">🃏 ${tx('Carte jouée', 'Card played')}</button> <span style="opacity:.7">${g.boss.cards} ${tx('carte(s)', 'card(s)')}</span></div></div>
        <div class="ma-step"><span class="k">2</span><div class="bd">${tx('Le boss attaque ? Le joueur visé lance les dés (stat Attaque si non précisé) contre <b>sa</b> Défense :', 'Boss attacks? The targeted player rolls the dice (Attack stat unless stated) against <b>their</b> Defense:')}<br>${g.players.map((p, i) => `<button class="ma-b sm" data-a="bossAtk" data-v="${i}">⚔️ ${CE[p.name] || ''} ${p.name}</button>`).join(' ')}</div></div>
        <div class="ma-att"><span>💥 ${tx('Dégâts au boss', 'Boss damage')}</span><button class="ma-b sm" data-a="bd" data-v="-1">−</button><b style="font-size:1.2rem">${g.boss.dmg}</b><button class="ma-b sm" data-a="bd" data-v="1">＋1</button><span style="margin-left:8px">📈 ${tx('Menace', 'Threat')}</span><button class="ma-b sm" data-a="bt" data-v="-1">−</button><b>${g.boss.threat}</b><button class="ma-b sm" data-a="bt" data-v="1">＋</button></div>
        ${m.boss && m.boss.health ? `<p style="opacity:.75">${tx('Santé', 'Health')} : ${m.boss.health}. ${tx('Ses réactions se déclenchent à CHAQUE fois.', 'Its reactions trigger EVERY time.')}</p>` : ''}<button class="ma-b" data-a="bossDown">💀 ${tx('Boss vaincu', 'Boss defeated')}</button></div>`;
    }
    if (isSneak(m) && isGrid(m)) return h + gridEnemyHtml(m, g);
    if (isSneak(m)) {
      const s = g.step, cls = k => s === k ? 'cur' : s > k ? 'ok' : '', hasCam = (m.legend && m.legend.cameras) || g.pieces.some(p => p.k === 'cam');
      h += `<div class="ma-card"><h4>🃏 ${tx('Carte Guard Order — étape par étape', 'Guard Order card — step by step')}</h4>
        <div class="ma-step ${cls(0)}"><span class="k">0</span><div class="bd">${tx('Pioche la carte du dessus. <b>GAME OVER</b> ? → perdu.', 'Draw the top card. <b>GAME OVER</b>? → you lose.')}<br><button class="ma-b pri" data-a="draw" ${s > 0 ? 'disabled' : ''}>🃏 ${tx('Carte piochée', 'Card drawn')}</button> <button class="ma-b red" data-a="gameover" ${s > 0 ? 'disabled' : ''}>💀 GAME OVER</button></div></div>
        <div class="ma-step ${cls(1)}"><span class="k">I</span><div class="bd"><b>${tx('Action des gardes', 'Guard action')}</b> (${tx('icône de la section I', 'Section I icon')}) :<br>
          <button class="ma-b sm" data-a="s1" data-v="waken" ${s !== 1 ? 'disabled' : ''}>✨ ${tx('Réveil', 'Waken')}</button> <button class="ma-b sm" data-a="s1" data-v="radio" ${s !== 1 ? 'disabled' : ''}>📻 Radio-In</button> <button class="ma-b sm" data-a="s1" data-v="lost" ${s !== 1 ? 'disabled' : ''}>☠ Lost Contact</button> <button class="ma-b sm" data-a="s1" data-v="stay" ${s !== 1 ? 'disabled' : ''}>❓ Stay Alert</button></div></div>
        <div class="ma-step ${cls(2)}"><span class="k">II</span><div class="bd"><b>${tx('Caméras', 'Cameras')}</b>${hasCam ? ` (${tx('jeton', 'token')} ${g.cam === 'vert' ? tx('🟩 vert', '🟩 green') : '🟧 orange'})${camWidget(g)}<button class="ma-b sm" data-a="cam" data-v="flip" ${s !== 2 ? 'disabled' : ''}>🔄 ${tx('Pivoter', 'Flip')}</button> <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>${tx('Pas de pivot', 'No flip')}</button><br><span style="opacity:.75">${tx('Puis vérifie la LOS de chaque caméra (pas sa propre case) :', 'Then check each Camera\'s LOS (not its own space):')}</span> ${g.players.map((p, i) => `<button class="ma-b sm" data-a="camSeen" data-v="${i}">📹 ${tx('Voit', 'Sees')} ${p.name}</button>`).join(' ')}` : ` : ${tx('aucune', 'none')} → <button class="ma-b sm" data-a="cam" data-v="keep" ${s !== 2 ? 'disabled' : ''}>OK</button>`}</div></div>
        <div class="ma-step ${cls(3)}"><span class="k">III</span><div class="bd"><b>${tx('Activer les gardes', 'Activate the Guards')}</b> (${tx('zone la plus proche du Guard Priority, haut→bas, gauche→droite). Mode au <b>début</b> de chaque activation :', 'zone closest to the Guard Priority token, top→bottom, left→right). Mode is set at the <b>start</b> of each activation:')}
          ${anyAlert ? `<div class="ma-mode al">${tx('🚨 ! posé : gardes de SA zone en ALERTE → chiffre <b style="color:#ff6b7a">ROUGE</b>, vers le ! le plus proche.', '🚨 ! on the map: Guards in THAT zone are in ALERT → <b style="color:#ff6b7a">RED</b> number, toward the nearest !.')}</div>` : ''}
          ${anyQ ? `<div class="ma-mode iv">${tx('❓ ? posé : le garde le plus proche enquête → chiffre <b style="color:#6fb0ff">BLEU</b>.', '❓ ? on the map: the nearest Guard investigates → <b style="color:#6fb0ff">BLUE</b> number.')}</div>` : ''}
          <div class="ma-mode" style="border:1px solid #39407a">${tx('Sinon : voit un KO/Mort → enquête (bleu) ; sinon PATROUILLE (bleu), tout droit.', 'Otherwise: sees a KO/Dead → investigate (blue); else PATROL (blue), straight ahead.')}</div>
          <p style="margin:6px 0">${tx('Il s\'arrête s\'il <b>te voit</b> (→ ! + attaque), s\'il <b>entre sur un jeton</b> (→ Guard Reaction) ou s\'il est bloqué. Déplace aussi les gardes sur le plan à l\'écran.', 'It stops if it <b>sees you</b> (→ ! + attack), <b>moves onto a token</b> (→ Guard Reaction) or is blocked. Move the Guards on the on-screen map too.')}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${g.players.map((p, i) => `<button class="ma-b sm" data-a="seen" data-v="${i}">👁️ ${tx('Un garde voit', 'A Guard sees')} ${p.name}</button>`).join('')}<button class="ma-b sm" data-a="react">🃏 Guard Reaction</button></div></div></div></div>`;
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
    if (a.id === 'codec') { A.sfx(AU().codec); ui.pend = { type: 'codec', act: 'codec', q: '' }; return false; }
    if (isGrid(m)) {
      const pp = playerPiece(g, p.name);
      const goal = GRID(m).goal || {};
      if ((a.id === 'elev' || a.id === 'interact') && goal.interact && pp && GG().code(world(m), pp.x, pp.y) === goal.interact) {
        spend(g, p, a); afterSimple(g, p, a);
        if (goal.noAlert && g.pieces.some(x => x.k === 'a')) toast(tx('⚠️ Un jeton <b>!</b> est sur le plateau : l\'objectif n\'est pas rempli (il faut l\'activer sans alerte).', '⚠️ A <b>!</b> token is on the map: the objective isn\'t met (it must be activated with no alert).'), 4500);
        else setTimeout(() => { win(m, g, tx('Objectif atteint (ascenseur activé)', 'Objective complete (elevator activated)')); save(); render(); }, 1200);
        return true;
      }
      const W6 = world(m);
      if (a.gun && pp && W6.noFire.has(cellKey(pp.x, pp.y))) { toast(tx('🚫 <b>No Fire Zone</b> : pas d\'arme à distance ni d\'explosif ici (les gardes, eux, peuvent tirer).', '🚫 <b>No Fire Zone</b>: no ranged weapons or explosives here (Guards can still shoot).'), 4500); return false; }
      if (a.id === 'elev' && Object.keys(W6.shafts).length > 1 && pp) {
        const here = W6.shaftOf[cellKey(pp.x, pp.y)];
        if (here && here === g.elev) { ui.pend = { type: 'elev', act: a.id, mode: 'ride' }; return false; }
        const adj = GG().shaftAdjacent(W6, pp.x, pp.y);
        if (adj.length) { ui.pend = { type: 'elev', act: a.id, mode: 'call', to: adj[0] }; return false; }
        toast(tx('🛗 Tu dois être <b>dans l\'ascenseur</b> ou <b>à côté d\'une cage</b>.', '🛗 You must be <b>in the elevator</b> or <b>next to a shaft</b>.')); return false;
      }
      if (a.move) {
        if (!pp || pp.x == null) { toast(tx('Pose d\'abord ton pion sur le plan.', 'Place your piece on the map first.')); return false; }
        if (!armMove(m, g, p, a.id)) toast(tx('Aucune case accessible.', 'No reachable space.'));
        return false;
      }
      if (a.atk && !(isBoss(m) && !isSneak(m))) {
        const ids = gridTargets(m, g, p, a);
        if (!ids.length) { toast(a.atk === 'silent' ? tx('🤫 Il faut être <b>dans le dos</b> d\'un garde adjacent.', '🤫 You must be <b>behind</b> an adjacent Guard.') : a.dice ? tx('👊 Aucun garde adjacent.', '👊 No adjacent Guard.') : tx('🔫 Aucune cible en ligne de vue.', '🔫 No target in line of sight.'), 3500); return false; }
        ui.pend = { type: 'target', act: a.id, ids }; return false;
      }
    }
    if (a.move) { ui.pend = { type: 'move', act: a.id }; return false; }
    if (a.atk) {
      if (isBoss(m) && !isSneak(m) && a.atk !== 'silent') {
        spend(g, p, a); consume(p, a); if (a.sfx) A.sfx(a.sfx); if (a.loud) setAtt(g, p, 2, 'action LOUD');
        openPad({ kind: 'boss', actor: p.name, def: bossDef(m), title: `${a.i} ${a.n} ${tx('sur', 'on')} ${esc((m.boss || {}).name || tx('le boss', 'the boss'))}`, fixed: a.dice || null, color: 'b', defLabel: tx('du boss', 'of the boss'), back: p.name === 'Snake' && !p.sneakUsed, icon: a.i });
        return true;
      }
      ui.pend = { type: 'target', act: a.id }; return false;
    }
    spend(g, p, a); afterSimple(g, p, a); return true;
  }
  function afterSimple(g, p, a) {
    consume(p, a);
    if (a.eff === 'heal') { const d = Math.min(2, p.dmg); p.dmg -= d; log(`🍴 ${p.name} : Ration, −${d} ${tx('dégât(s)', 'damage')}`, '', p.name); }
    if (a.eff === 'chaff') { const m = mission(); g.chaff = g.round; if (g.grid) { const S = toS(g), me = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (me && GG().guardInZone(world(m), S, me)) setTimeout(() => { setAtt(g, p, 1, tx('chaff (garde dans la zone)', 'chaff (Guard in the zone)')); save(); render(); }, 900); } }
    if (a.eff === 'stealth') p.stealth = true;
    if (a.eff === 'box') p.boxed = true;
    if (a.eff === 'detonate' && g.grid && !g.players.some(x => x.att === 2)) { const S = toS(g), me = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (me && GG().guardInZone(world(mission()), S, me)) setAtt(g, p, 2, tx('explosion du C-4', 'C-4 explosion')); }
    if (a.id === 'item') ui.inv = true;
    if (a.sfx) A.sfx(a.sfx); if (a.auto) A.sfx(AU()[a.auto]);
    if (a.then) setTimeout(() => A.sfx(a.then), 900); if (a.thenAuto) setTimeout(() => A.sfx(AU()[a.thenAuto]), 900);
    log(`${a.i} ${p.name} : ${a.n}`, '', p.name);
    toast(`${a.i} <b>${a.n}</b> — ${a.tip}`, 3000);
    if (a.loud) setAtt(g, p, 2, tx('action LOUD', 'LOUD action'));
    if (a.att) setAtt(g, p, 1, a.n);
    if (a.leap) setAtt(g, p, 2, tx('saut par-dessus un garde', 'leapfrogged a Guard'));
  }
  function doMove(x, y) {
    const g = game(), p = g.players[g.cur], a = actById(ui.pend.act, p); snap();
    const pp = playerPiece(g, p.name);
    if (pp) { pp.x = x; pp.y = y; }
    spend(g, p, a); p.s.move++;
    steps(a.id === 'dash' ? 'dash' : 'sneak', a.move, p.water);
    log(`${a.i} ${p.name} : ${a.n}`, '', p.name);
    if (a.noisy) toast(`${a.i} <b>${a.n}</b> : ${tx('🔊 bruyant → noise check à la fin de ton tour.', '🔊 Noisy → noise check at the end of your turn.')}`);
    ui.pend = null; save(); render();
  }
  function chooseTarget(tg) {
    const g = game(), m = mission(), p = g.players[g.cur], a = actById(ui.pend.act, p); snap();
    ui.pend = null; spend(g, p, a); consume(p, a);
    if (a.sfx) A.sfx(a.sfx);
    if (a.loud) setAtt(g, p, 2, tx('action LOUD', 'LOUD action'));
    if (a.atk === 'silent') { g.dead++; p.s.kill++; p.s.atk++; if (tg) { tg.k = 'dead'; tg.hurt = false; } log(`🤫 ${p.name} : ${tx('élimination silencieuse', 'silent takedown')}`, '', p.name); toast(tx('🤫 Garde éliminé sans bruit : remplace-le par un jeton Mort.', '🤫 Guard taken down silently: replace it with a Dead token.')); save(); render(); return; }
    if (tg && tg.k === 'boss') openPad({ kind: 'boss', actor: p.name, def: bossDef(m), title: `${a.i} ${a.n} ${tx('sur le boss', 'on the boss')}`, fixed: a.dice || null, color: 'b', defLabel: tx('du boss', 'of the boss'), icon: a.i });
    else openPad({ kind: a.atk, actor: p.name, target: tg ? tg.id : null, def: 3, title: `${a.i} ${a.n} : ${a.dice ? tx('lance ', 'roll ') + a.dice.map(c => c === 'w' ? '⚪' : '⚫').join('') : tx('lance les dés indiqués sur la carte', 'roll the dice shown on the card')}`, fixed: a.dice || null, color: 'b', min: 1, defLabel: tx('du garde', 'of the Guard'), back: p.name === 'Snake' && !p.sneakUsed, icon: a.i });
    save(); render();
  }

  function onChange(e) { const t = e.target; if (t.dataset && t.dataset.a === 'pback' && ui.pad) { ui.pad.backOn = t.checked; render(); } }
  function onClick(e) {
    const chk = e.target.closest('[data-chk]');
    if (chk) { const m = mission(); const x = LS.get('mgsg.chk.' + m.id, {}); x[chk.dataset.chk] = !x[chk.dataset.chk]; LS.set('mgsg.chk.' + m.id, x); chk.classList.toggle('ok', !!x[chk.dataset.chk]); chk.querySelector('.bx').textContent = x[chk.dataset.chk] ? '✓' : ''; return; }
    const sd = e.target.closest('[data-mu],[data-sx]');
    if (sd) { if (sd.dataset.mu) A.music(sd.dataset.mu, (SND().alert || []).some(x => x[0] === sd.dataset.mu) ? 'alert' : 'mission'); else A.sfx(sd.dataset.sx); return; }
    const gb = e.target.closest('[data-go]'); if (gb && root.contains(gb) && !gb.closest('#maSteps')) { go(gb.dataset.go); return; }
    const colEl = e.target.closest('[data-col]');
    if (colEl && ui.cardSel && !e.target.closest('.ma-cc') && !e.target.closest('[data-a]')) { const [k, f] = ui.cardSel.split('|'); return moveCard(k, f, colEl.dataset.col); }
    const b = e.target.closest('[data-a]'); if (!b || b.disabled || !root.contains(b) || b.dataset.a === 'pback') return;
    const a = b.dataset.a, v = b.dataset.v, m = mission(), g = m && game();
    const p = g && g.players[g.cur];
    switch (a) {
      case 'pick': { st.mid = isNaN(+v) ? v : +v; const mm = mission(); if (!pcounts(mm).includes(String(st.n))) st.n = +pcounts(mm)[0]; undo = []; const gg = game(); go(gg.started && !gg.over ? 'play' : 'brief'); return; }
      case 'n': st.n = +v; undo = []; save(); render(); return;
      case 'read': typeBriefing(m); return;
      case 'zoomFit': st.zoom = 1; ui.zoomBack = null; save(); render(); { const bd = root.querySelector('.ma-bds'); if (bd) { bd.scrollLeft = 0; bd.scrollTop = 0; } } return;
      case 'zoom': st.zoom = Math.max(1, Math.min(4, (st.zoom || 1) + (+v) * 0.5)); save(); render(); return;
      case 'place': ui.place = ui.place === v ? null : v; render(); return;
      case 'unsel': ui.sel = null; render(); return;
      case 'cancel': ui.pend = null; render(); return;
      case 'pcancel': ui.pad = null; render(); return;
      case 'undo': { const s = undo.pop(); if (s) { const lm = ui.lastMove; st.games[m.id] = JSON.parse(s); ui = { sel: null, pend: null, place: null, pad: null };
        const g2 = game(); if (lm && isGrid(m) && g2.started && g2.phase === 1 && g2.players[g2.cur]) armMove(m, g2, g2.players[g2.cur], lm);
        save(); syncAlert(); render(); } return; }
      case 'pk': { const pd = ui.pad; const lim = pd.fixed ? pd.fixed.length : 12; const i = pd.vals.length; if (i >= lim) return; const col = pd.fixed ? pd.fixed[i] : pd.color; if (v === '!' && col !== 'w') return; pd.vals.push(v === '!' ? '!' : +v); render(); return; }
      case 'pdel': ui.pad.vals.pop(); render(); return;
      case 'restart': if (confirm(tx('Recommencer la mission depuis la mise en place ? (la partie en cours sera effacée)', 'Restart the mission from setup? (the current game will be erased)'))) { const old = st.games[m.id], inv = old && (old.inv0 || old.players.map(x => [x.name, x.inv])); st.games[m.id] = newGame(m, st.n); if (inv) inv.forEach(([nm, iv]) => { const q = st.games[m.id].players.find(x => x.name === nm); if (q && iv) q.inv = JSON.parse(JSON.stringify(iv)); }); undo = []; A.stop(); go('setup'); } return;
      case 'cdk': if (ui.pend && ui.pend.type === 'codec') { ui.pend.q = ((ui.pend.q || '').length >= 4 ? '' : ui.pend.q || '') + v; if (ui.pend.q.length === 4) A.sfx(AU().codec); } render(); return;
      case 'cdd': if (ui.pend && ui.pend.type === 'codec') ui.pend.q = (ui.pend.q || '').slice(0, -1); render(); return;
      case 'pdef': ui.pad.def = Math.max(1, Math.min(8, ui.pad.def + +v)); render(); return;
      case 'pcol': ui.pad.color = ui.pad.color === 'w' ? 'b' : 'w'; render(); return;
      case 'invToggle': ui.inv = !ui.inv; ui.cardSel = null; render(); return;
      case 'boxOwn': { const n = +v, own = ownedSet(); if (own.has(n)) { own.delete(n); g.players.forEach(q => { q.inv = (q.inv || []).filter(i => i.num !== n); }); save(); } else own.add(n); LS.set('mgsg.box', [...own].sort((a, b) => a - b)); render(); return; }
      case 'invStart': { const q = g.players[+b.dataset.p]; startInv(m, q.name).forEach(it => { if (!q.inv.some(i => !i.num && i.name === it.name)) q.inv.push(it); }); save(); render(); return; }
      case 'invAdd': { const q = g.players[+b.dataset.p]; q.inv = q.inv || []; q.inv.push(mkItem(ITYPES[v][1], v)); save(); render(); return; }
      case 'invRm': { const q = g.players[+b.dataset.p]; q.inv = q.inv.filter(i => i.id !== b.dataset.i); save(); render(); return; }
      case 'invUse': { const q = g.players[+b.dataset.p], it = q.inv.find(i => i.id === b.dataset.i); if (it) it.uses = Math.max(0, it.uses + +v); save(); render(); return; }
      case 'boxTo': ui.boxTo = +v; ui.cardAsk = null; render(); return;
      case 'invCard': { const q = g.players[+b.dataset.p], n = +v; q.inv = q.inv || [];
        if (q.inv.some(i => i.num === n)) { q.inv = q.inv.filter(i => i.num !== n); save(); render(); return; }
        // la carte est chez un autre personnage : elle passe à celui-ci (une carte = un seul personnage)
        const from = g.players.find(o => o !== q && (o.inv || []).some(i => i.num === n));
        if (from) { const it = from.inv.find(i => i.num === n); from.inv = from.inv.filter(i => i !== it); q.inv.push(it); save(); render(); return; }
        const kn = cardInfo(n);
        if (kn && kn.only && !kn.only.includes(q.name)) { toast(`⛔ ${esc(kn.name)} : ${tx('réservé à', 'only for')} ${kn.only.join(' / ')}.`); return; }
        if (kn) { q.inv.push(mkCard(n, kn)); save(); } else ui.cardAsk = { p: +b.dataset.p, n };
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
        g.inv0 = g.players.map(x => [x.name, JSON.parse(JSON.stringify(x.inv || []))]);   // équipement de départ (pour « Recommencer »)
        g.players.forEach(x => { x.left = 4; x.noisy = 0; x.done = false; });
        log(tx(`🎬 Début de la mission « ${m.name} » (${g.players.map(x => x.name).join(', ')})`, `🎬 Mission start: “${m.name}” (${g.players.map(x => x.name).join(', ')})`), 'sys');
        if (st.auto) A.music(missionTrack(m), 'mission'); A.sfx(AU().codec);
        st.screen = 'play'; ui = { sel: null, pend: null, place: null, pad: null };
        setTimeout(() => turnBanner(`${CE[g.players[0].name] || ''} ${tx('Au tour de', 'Your turn,')} ${g.players[0].name}`), 300);
        break;
      }
      case 'resetPos': { if (g.started && !confirm(tx('Replacer tous les pions selon le livret ?', 'Reset all pieces to the book layout?'))) { undo.pop(); return; } const keep = g.pieces.filter(x => x.k === 'q' || x.k === 'a'); g.pieces = gridPieces(m, g.n).concat(g.started ? keep : []); g.gridV = gridVer(m); ui.sel = null; toast(tx('↺ Pions replacés selon le livret.', '↺ Pieces reset to the book layout.')); break; }
      case 'add': { const id = (v === 'guard' ? 'g' : 'c') + (Date.now() % 1000000); g.pieces.push({ id, k: v, x: null, y: null, f: 'down' }); ui.place = id; break; }
      case 'rot': { const pc = piece(ui.sel); const o = ['up', 'right', 'down', 'left']; pc.f = o[(o.indexOf(pc.f || 'down') + (+v) + 4) % 4]; if (pc.k === 'cam') A.sfx(AU().camRotate); break; }
      case 'pko': { const pc = piece(ui.sel); pc.k = 'ko2'; pc.hurt = false; g.ko2++; A.sfx('punch-guard-kox1.mp3'); log(tx('⭐ Garde KO (★★)', '⭐ Guard KO (★★)'), ''); ui.sel = null; break; }
      case 'pdead': { const pc = piece(ui.sel); pc.k = 'dead'; pc.hurt = false; g.dead++; log(tx('☠ Garde éliminé', '☠ Guard eliminated'), ''); ui.sel = null; break; }
      case 'phurt': { const pc = piece(ui.sel); pc.hurt = !pc.hurt; break; }
      case 'pwake': { const pc = piece(ui.sel); if (pc.k === 'ko1') g.ko1 = Math.max(0, g.ko1 - 1); else g.ko2 = Math.max(0, g.ko2 - 1); pc.k = 'guard'; A.sfx('guard-whered-he-go_zHLpH97.mp3'); log(tx('💂 Un garde se relève', '💂 A Guard gets back up'), ''); ui.sel = null; break; }
      case 'prm': { g.pieces = g.pieces.filter(x => x.id !== ui.sel); ui.sel = null; break; }
      case 'pflip': { const pc = piece(ui.sel); const pl = g.players.find(x => x.name === pc.owner); setAtt(g, pl, pl.att === 2 ? 1 : 2, tx('retourné', 'flipped'), true); break; }
      case 'prmatt': { const pc = piece(ui.sel); const pl = g.players.find(x => x.name === pc.owner); setAtt(g, pl, 0, null, true); log(tx(`🃏 Jeton Attention de ${pl.name} retiré`, `🃏 ${pl.name}'s Attention token removed`), ''); ui.sel = null; break; }
      case 'phase': g.phase = +v; if (g.phase === 2) g.step = 0; ui.pend = null; ui.pad = null; break;
      case 'toPlayers': zoomBack(); g.players.forEach(x => { x.left = 4; x.noisy = 0; x.done = false; x.ask = null; x.hurt = false; x.sneakUsed = false; }); g.phase = 1; g.cur = 0; log(tx(`🔄 Round ${g.round} : phase des joueurs`, `🔄 Round ${g.round}: player phase`), 'sys'); setTimeout(() => { A.sfx(AU().codec); turnBanner(`${CE[g.players[0].name] || ''} ${tx('Au tour de', 'Your turn,')} ${g.players[0].name}`); }, 200); if (st.auto && !A.cur) A.music(missionTrack(m), 'mission'); break;
      case 'who': g.cur = +v; ui.pend = null; ui.pad = null; break;
      case 'water': p.water = !p.water; if (p.water) A.sfx(AU().water); break;
      case 'att': setAtt(g, p, +v, null, true); break;
      case 'dmg': if (+v > 0) damage(m, g, p, 1, ''); else p.dmg = Math.max(0, p.dmg - 1); break;
      case 'act': { if (ui.pend && ui.pend.type === 'move' && ui.pend.act === v) { undo.pop(); ui.pend = null; break; } const ac = actById(v, p); if (!ac || ac.c > p.left) { undo.pop(); return; } if (!startAct(m, g, p, ac)) undo.pop(); break; }
      case 'moveNo': { const ac = actById(ui.pend.act, p); spend(g, p, ac); p.s.move++; steps(ac.id === 'dash' ? 'dash' : 'sneak', ac.move, p.water); log(`${ac.i} ${p.name} : ${ac.n}`, '', p.name); ui.pend = null; break; }
      case 'targetNo': undo.pop(); chooseTarget(null); return;
      case 'pok': applyPad(m, g); if (ui.queue && ui.queue.length) openPad(ui.queue.shift()); break;
      case 'end': {
        if (p.noisy && g.grid) { const S = toS(g), me = S.figs.find(f => f.kind === 'player' && f.name === p.name); if (me && !GG().guardInZone(world(m), S, me)) { p.noisy = 0; toast(tx('🔊 Aucun garde dans ta zone : pas de noise check.', '🔊 No Guard in your zone: no noise check.')); } }
        if (p.hurt) p.ask = 'hurt'; else if (p.noisy) p.ask = 'noise';
        else { p.done = true; log(tx(`🏁 Fin du tour de ${p.name} (pas de bruit)`, `🏁 ${p.name}'s turn ends (no noise)`), '', p.name); endTurnFollow(g); }
        break;
      }
      case 'hurt': { if (v === 'up') setAtt(g, p, 2, tx('garde blessé resté debout', 'wounded Guard still standing')); else g.pieces.forEach(x => { x.hurt = false; }); p.hurt = false; if (p.noisy) p.ask = 'noise'; else { p.ask = null; p.done = true; endTurnFollow(g); } break; }
      case 'noisePad': openPad({ kind: 'noise', actor: p.name, fixed: Array(p.noisy).fill('w'), title: tx(`🔊 Noise check : lance ${p.noisy} dé(s) blanc(s)`, `🔊 Noise check: roll ${p.noisy} white ${p.noisy > 1 ? 'dice' : 'die'}`), hint: tx('Tape chaque résultat (« ! » si tu le vois).', 'Enter each result (“!” if you see it).'), showDef: false }); break;
      case 'noise': p.ask = null; p.done = true; log(tx(`🏁 Fin du tour de ${p.name} (pas de garde dans la zone)`, `🏁 ${p.name}'s turn ends (no Guard in the zone)`), '', p.name); endTurnFollow(g); break;
      case 'toEnemy': ui.seq = null; g.phase = 2; g.step = 0; log(tx(`👹 Round ${g.round} : phase ennemie`, `👹 Round ${g.round}: enemy phase`), 'sys'); break;
      case 'draw': if (g.deck) g.deck.drawn++; g.step = 1; log(tx('🃏 Carte Guard Order piochée', '🃏 Guard Order card drawn'), 'sys'); break;
      case 'gameover': gameOver(m, g, tx('La carte GAME OVER est sortie : temps écoulé.', 'The GAME OVER card was revealed: time\'s up.')); break;
      case 's1': {
        if (g.grid) { gridSection1(m, g, v); g.step = 2; break; }
        if (v === 'waken') { const up = g.ko1; g.ko1 = g.ko2; g.ko2 = 0; g.pieces.forEach(x => { if (x.k === 'ko1') x.k = 'guard'; else if (x.k === 'ko2') x.k = 'ko1'; }); A.sfx('guard-whered-he-go_zHLpH97.mp3'); log(tx(`✨ Réveil : ${up} garde(s) se relèvent, ★★ → ★`, `✨ Waken: ${up} Guard(s) get up, ★★ → ★`), 'sys'); toast(tx(`✨ Réveil (zones actives) : ${up} garde(s) ★ se relèvent, les ★★ passent à ★. Fais pareil sur le plateau.`, `✨ Waken (active zones): ${up} ★ Guard(s) get up, ★★ flip to ★. Do the same on the board.`), 4500); }
        if (v === 'radio') { A.sfx('guard-return-to-your-positions_9aocsFp.mp3'); log('📻 Radio-In', 'sys'); toast(tx('📻 Radio-In : complète chaque zone active jusqu\'au Guard Count du Barracks (icône radio). ＋💂 pour les poser à l\'écran.', '📻 Radio-In: fill each active zone up to the Barracks Guard Count (radio icon). ＋💂 to place them on screen.'), 5000); }
        if (v === 'lost') { const n = Math.floor(g.dead / 3); if (g.deck) { g.deck.drawn += n; g.deck.burned += n; } log(tx(`☠ Lost Contact : ${n} carte(s) brûlée(s)`, `☠ Lost Contact: ${n} card(s) burned`), 'sys'); toast(n ? tx(`☠ Lost Contact : ${n} carte(s) brûlée(s). Si l'une est GAME OVER → perdu !`, `☠ Lost Contact: ${n} card(s) burned. If one is GAME OVER → you lose!`) : tx('☠ Lost Contact : moins de 3 morts, rien.', '☠ Lost Contact: fewer than 3 bodies, nothing happens.'), 4500); }
        if (v === 'stay') { log('❓ Stay Alert', 'sys'); toast(tx('❓ Stay Alert : tout joueur à ≤ 2 cases d\'un garde (sans obstacle) pose son jeton ? (bouton « ? » sur sa fiche).', '❓ Stay Alert: every player within 2 spaces of a Guard places their ? token (the “?” button on their panel).'), 5000); }
        g.step = 2; break;
      }
      case 'cam': if (g.grid) { if (v === 'flip') { g.cam = g.cam === 'vert' ? 'orange' : 'vert'; A.sfx(AU().camRotate); log(tx('📹 Les caméras pivotent', '📹 Cameras flip'), 'sys'); camCheck(m, g); } g.step = 3; break; }
        if (v === 'flip') { g.cam = g.cam === 'vert' ? 'orange' : 'vert'; A.sfx(AU().camRotate); g.pieces.forEach(x => { if (x.k === 'cam') { const o = ['up', 'right', 'down', 'left']; x.f = o[(o.indexOf(x.f || 'down') + 1) % 4]; } }); log(tx('📹 Les caméras pivotent', '📹 Cameras flip'), 'sys'); } g.step = 3; break;
      case 'camSeen': { const q = g.players[+v]; A.sfx(AU().camSpot); setTimeout(() => { setAtt(g, q, 2, tx('vu par une caméra', 'spotted by a Camera')); save(); render(); }, 700); break; }
      case 'seen': { const q = g.players[+v]; A.sfx('guard-there-he-is_JHZ7rPO.mp3'); setAtt(g, q, 2, tx('vu par un garde', 'spotted by a Guard')); ui.sel = null; openPad({ kind: 'guardAtk', victim: q.name, def: defOf(q.name), fixed: ['b', 'b'], title: tx(`👁️ Le garde attaque ${q.name} : lance 2 dés noirs`, `👁️ The Guard attacks ${q.name}: roll 2 black dice`), hint: tx('Focus possible : modifie la valeur avant de la taper.', 'Focus allowed: adjust the value before entering it.'), defLabel: tx(`de ${q.name}`, `of ${q.name}`) }); break; }
      case 'react': A.sfx('guard-what-was-that-noise_IVtXtq7.mp3'); log('🃏 Guard Reaction', 'sys'); toast(tx('🃏 Guard Reaction : pioche une carte, résous chaque jeton de la case (haut → bas). Mets à jour les jetons ? / ! (touche-les sur le plan).', '🃏 Guard Reaction: draw a card, resolve each token in the space (top → bottom). Update the ? / ! tokens (tap them on the map).'), 5000); break;
      case 'bossCard': { g.boss.cards++; const ss = stageSnd(m); if (g.boss.cards === 1 && st.auto && ss.boss && A.cur !== ss.boss) A.music(ss.boss, 'boss'); const vo = (ss.voices || []).filter(x => !/death|vaincu|abattu/i.test(x[0] + x[1])); if (vo.length) A.sfx(vo[Math.floor(Math.random() * vo.length)][0]); log(`🃏 Carte boss n°${g.boss.cards}`, 'sys'); break; }
      case 'bossAtk': { const q = g.players[+v]; openPad({ kind: 'bossAtk', victim: q.name, def: defOf(q.name), color: 'b', min: 1, title: `⚔️ ${esc((m.boss || {}).name || tx('Le boss', 'The boss'))} ${tx('attaque', 'attacks')} ${q.name}`, hint: tx('Tape chaque dé lancé (nombre : carte ou stat Attaque).', 'Enter each die rolled (count: card or Attack stat).'), defLabel: tx(`de ${q.name}`, `of ${q.name}`) }); break; }
      case 'bd': g.boss.dmg = Math.max(0, g.boss.dmg + +v); break;
      case 'bt': g.boss.threat = Math.max(0, g.boss.threat + +v); break;
      case 'bossDown': { const d = (stageSnd(m).voices || []).find(x => /death/i.test(x[0])); A.sfx(d ? d[0] : AU().win); log(tx('👾 Boss vaincu !', '👾 Boss defeated!'), 'win'); win(m, g, tx('Boss vaincu', 'Boss defeated')); break; }
      case 'elevGo': {
        const W6 = world(m), from = g.elev, to = v, map = GG().elevatorMap(W6, from, to), ac = ACTS.find(x => x.id === 'elev');
        spend(g, p, ac); A.sfx(AU().elevCall); setTimeout(() => A.sfx(AU().elevator), 700);
        g.pieces.forEach(x => { if (x.x == null) return; const k = cellKey(x.x, x.y); if (map[k]) { const [nx, ny] = map[k].split(',').map(Number); x.x = nx; x.y = ny; } });
        g.elev = to; ui.pend = null;
        log(`🛗 ${p.name} : ${tx('ascenseur', 'elevator')} ${from} → ${to}`, '', p.name); toast(tx(`🛗 L'ascenseur part vers <b>${to}</b>. Déplace l'ascenseur et les figurines dedans sur le vrai plateau.`, `🛗 The elevator heads to <b>${to}</b>. Move the elevator and the figures inside on the real board.`), 4000);
        break;
      }
      case 'edit': undo.pop(); ui.edit = ui.edit ? null : 'wall'; render(); return;
      case 'editMode': undo.pop(); ui.edit = v; render(); return;
      case 'editReset': undo.pop(); if (confirm(tx('Effacer toutes tes corrections de ce plan ?', 'Erase all your corrections to this map?'))) { LS.set('mgsg.fix.' + m.id, { walls: [], cells: {}, turns: {}, spirals: [] }); delete worlds[m.id]; render(); } return;
      case 'editExport': { undo.pop(); const t = JSON.stringify({ mission: m.id, fix: fixOf(m) }); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(tx('📤 Corrections copiées : colle-les-moi pour que je les intègre au plan.', '📤 Corrections copied: share them so they can be added to the map.'), 4000), () => prompt(tx('Copie ces corrections :', 'Copy these corrections:'), t)); return; }
      case 'los': undo.pop(); st.showLOS = !st.showLOS; save(); render(); return;
      case 'card': g.card[b.dataset.k] = b.dataset.k === 'arrow' ? v : +v; break;
      case 'seqStart': { const ids = GG().activationOrder(world(m), toS(g)); if (!ids.length) { toast(tx('Aucun garde dans une zone active : rien ne bouge.', 'No Guard in an active zone: nothing moves.')); g.step = 4; ui.seq = { ids: [], i: 0 }; } else { ui.seq = { ids, i: 0 }; log(tx(`💂 Activation des gardes (rouge ${g.card.red}, bleu ${g.card.blue}, flèche ${g.card.arrow === 'left' ? '⟲' : '⟳'})`, `💂 Guard activation (red ${g.card.red}, blue ${g.card.blue}, arrow ${g.card.arrow === 'left' ? '⟲' : '⟳'})`), 'sys'); } break; }
      case 'seqGo': runGuard(m, g); return;
      case 'seqSkip': ui.seq.i++; break;
      case 'react': { const tid = b.dataset.t, tk = piece(tid); if (tk) { const pl = tk.owner && g.players.find(x => x.name === tk.owner);
          if (v === 'rm') { if (pl) setAtt(g, pl, 0, null, true); else g.pieces = g.pieces.filter(x => x.id !== tid); log(tx('🃏 Guard Reaction : jeton retiré', '🃏 Guard Reaction: token removed'), 'sys'); }
          if (v === 'up' && pl) setAtt(g, pl, 2, 'Guard Reaction', true);
          if (v === 'wake') { tk.k = 'guard'; tk.f = tk.f || 'down'; log(tx('🃏 Guard Reaction : garde réveillé', '🃏 Guard Reaction: Guard woken up'), 'sys'); } }
        ui.react.tokens = ui.react.tokens.filter(x => x.id !== tid); if (!ui.react.tokens.length) ui.react = null; break; }
      case 'reactDone': ui.react = null; break;
      case 'nextRound': zoomBack(); ui.seq = null; ui.react = null; g.round++; g.phase = 0; g.step = 0; log(`— Round ${g.round} —`, 'sys'); break;
      case 'event': { const ev = (m.events || []).find(x => x.k === v); g.ev[v] = !g.ev[v]; if (g.ev[v]) { A.sfx(AU()[(stageSnd(m).events || {})[v] || 'pop'] || AU().pop); log(`🅰️ Event ${v} atteint`, 'sys'); toast(`<span class="ma-ev">${v}</span> ${ev ? ev.d : ''}`, 6500); } break; }
      case 'cue': A.music(v, 'mission'); break;
      case 'win': win(m, g, tx('Objectif rempli', 'Objective complete')); break;
      case 'lose': gameOver(m, g, tx('Mission abandonnée / échouée.', 'Mission abandoned / failed.')); break;
      default: undo.pop(); return;
    }
    save(); render();
  }

  /* ======================= 🏁 Débrief, 📜 Journal, 🔊 Sons ======================= */
  function statsHtml(m, g) {
    const dur = g.t0 ? (g.t1 || now()) - g.t0 : 0, cards = g.deck ? g.deck.drawn : 0;
    const tot = k => g.players.reduce((s, p) => s + (p.s[k] || 0), 0);
    const rank = g.over === 'win' ? (!g.alerts ? tx('🦊 FOXHOUND — aucune alerte !', '🦊 FOXHOUND — no alerts!') : g.alerts <= 1 ? '🐕 Doberman' : g.alerts <= 3 ? tx('🐺 Loup', '🐺 Wolf') : tx('🐘 Éléphant', '🐘 Elephant')) : '';
    return `<div class="ma-stats">
      <div class="ma-stat"><b>${g.over === 'win' ? '🏆' : g.over === 'go' ? '💀' : '⏳'}</b>${g.over === 'win' ? tx('Réussie', 'Complete') : g.over === 'go' ? tx('Échouée', 'Failed') : tx('En cours', 'In progress')}</div>
      <div class="ma-stat"><b>${fmtT(dur)}</b>${tx('Temps de jeu', 'Play time')}</div><div class="ma-stat"><b>${g.round}</b>Rounds</div>
      <div class="ma-stat"><b>${g.alerts}</b>${tx('Alertes', 'Alerts')}</div><div class="ma-stat"><b>${tot('ko')}</b>${tx('Gardes KO', 'Guards KO\'d')}</div><div class="ma-stat"><b>${tot('kill')}</b>${tx('Gardes éliminés', 'Guards eliminated')}</div>
      <div class="ma-stat"><b>${tot('dmgIn')}</b>${tx('Dégâts subis', 'Damage taken')}</div>${g.deck ? `<div class="ma-stat"><b>${cards}/${g.deck.red + g.deck.blue}</b>${tx('Cartes ennemies', 'Enemy cards')}</div>` : ''}${isBoss(m) ? `<div class="ma-stat"><b>${g.boss.dmg}</b>${tx('Dégâts au boss', 'Boss damage')}</div>` : ''}</div>
      ${rank ? `<p style="font-size:1.2rem;margin:10px 0 0">${tx('Rang', 'Rank')} : <b>${rank}</b></p>` : ''}
      <div style="overflow-x:auto"><table class="ma-tab" style="margin-top:10px"><tr>${(EN ? ['Player', 'Actions', 'Moves', 'Attacks', 'Hits', 'KO', 'Kills', 'Damage taken', 'Spotted', 'Noise failed'] : ['Joueur', 'Actions', 'Déplac.', 'Attaques', 'Réussites', 'KO', 'Élim.', 'Dégâts subis', 'Repéré', 'Bruit raté']).map(x => `<th>${x}</th>`).join('')}</tr>
      ${g.players.map(p => `<tr><td>${CE[p.name] || ''} ${p.name}</td><td>${p.s.act}</td><td>${p.s.move}</td><td>${p.s.atk}</td><td>${p.s.hit}</td><td>${p.s.ko}</td><td>${p.s.kill}</td><td>${p.s.dmgIn}</td><td>${p.s.alerts}</td><td>${p.s.noise}</td></tr>`).join('')}</table></div>`;
  }
  function logHtml(g) { return `<ul class="ma-log">${g.log.map(l => `<li class="${l.kind}"><span class="t">${fmtT(l.t)}</span><span class="r">R${l.r}</span><span class="x">${esc(l.txt)}</span></li>`).join('') || `<li><span></span><span></span><span class="x">${tx('Rien pour l\'instant.', 'Nothing yet.')}</span></li>`}</ul>`; }
  function report(m, g) {
    const dur = g.t0 ? (g.t1 || now()) - g.t0 : 0;
    return [`MGS — ${typeof m.id === 'number' ? 'Stage ' + m.id : m.id} « ${m.name} » — ${g.over === 'win' ? tx('RÉUSSIE', 'COMPLETE') : g.over === 'go' ? tx('ÉCHOUÉE', 'FAILED') : tx('en cours', 'in progress')}${g.why ? ' (' + g.why + ')' : ''}`,
      tx(`Joueurs : ${g.players.map(p => p.name).join(', ')} · Temps : ${fmtT(dur)} · Rounds : ${g.round} · Alertes : ${g.alerts}`, `Players: ${g.players.map(p => p.name).join(', ')} · Time: ${fmtT(dur)} · Rounds: ${g.round} · Alerts: ${g.alerts}`), '',
      ...g.log.map(l => `[${fmtT(l.t)}] R${l.r}  ${l.txt}`)].join('\n');
  }
  function vDebrief(m) {
    const g = game();
    const i = MIS().findIndex(x => x.id === m.id), nx = MIS()[i + 1];
    body.innerHTML = `<h2 style="margin:4px 0 8px">🏁 ${tx('Débrief', 'Debrief')} — ${esc(m.name)}</h2>${g.over ? `<div class="ma-ban ${g.over === 'win' ? 'win' : 'go'}">${g.over === 'win' ? tx('🏆 MISSION RÉUSSIE', '🏆 MISSION COMPLETE') : tx('💀 MISSION ÉCHOUÉE', '💀 MISSION FAILED')}${g.why ? `<div style="font-size:1rem;font-weight:600">${esc(g.why)}</div>` : ''}</div>` : ''}
      ${statsHtml(m, g)}<div class="ma-card"><h4>📜 ${tx('Journal de la partie', 'Game log')}</h4>${logHtml(g)}</div>
      <div class="ma-next"><button class="ma-b" data-a2="copy">📋 ${tx('Copier le rapport', 'Copy the report')}</button><button class="ma-b" data-a2="replay">↺ ${tx('Rejouer', 'Replay')}</button>${nx ? `<button class="ma-b pri big" data-a2="next" data-v="${nx.id}">${tx('Mission suivante ▶', 'Next mission ▶')}</button>` : ''}</div>`;
    body.querySelectorAll('[data-a2]').forEach(b => b.onclick = () => {
      if (b.dataset.a2 === 'copy') { const t = report(m, g); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(tx('📋 Rapport copié', '📋 Report copied')), () => { prompt(tx('Copie le rapport :', 'Copy the report:'), t); }); }
      if (b.dataset.a2 === 'replay') { st.games[m.id] = newGame(m, st.n); undo = []; go('setup'); }
      if (b.dataset.a2 === 'next') { st.mid = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; const mm = mission(); if (!pcounts(mm).includes(String(st.n))) st.n = +pcounts(mm)[0]; undo = []; A.stop(); go('brief'); }
    });
  }
  function vLog(m) {
    const g = game();
    body.innerHTML = `<h2 style="margin:4px 0 8px">📜 ${tx('Journal', 'Log')} — ${esc(m.name)}</h2>${g.t0 ? statsHtml(m, g) : ''}<div class="ma-card">${logHtml(g)}</div>
      <div class="ma-next"><button class="ma-b pri" data-go="${g.started && !g.over ? 'play' : 'brief'}">◀ ${tx('Retour', 'Back')}</button></div>`;
  }
  function vSnd(m) {
    const ss = stageSnd(m), S = SND();
    const mus = arr => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="mu" data-mu="${esc(f)}">🎵 ${esc(t)}</button>`).join('')}</div>`;
    const sfx = (arr, c = '') => `<div class="ma-snd">${arr.map(([f, t]) => `<button class="${c}" data-sx="${esc(f)}">${esc(t)}</button>`).join('')}</div>`;
    body.innerHTML = `<p style="opacity:.75">${tx('Les sons sont automatiques pendant la partie ; cet écran sert de secours.', 'Sounds play automatically during the game; this screen is a backup.')}</p>
      <div class="ma-h3">🎵 ${tx('Musiques de la mission', 'Mission music')}</div>${ss.music && ss.music.length ? mus(ss.music) : '<p>—</p>'}<div class="ma-h3">${tx('🚨 Alerte / ⏳ Brief', '🚨 Alert / ⏳ Briefing')}</div>${mus([...(S.alert || []), ...(S.setup || [])])}
      ${ss.voices && ss.voices.length ? `<div class="ma-h3">🗣️ ${tx('Voix du boss', 'Boss voice')}</div>${sfx(ss.voices, 'vo')}` : ''}${ss.sfx && ss.sfx.length ? `<div class="ma-h3">⭐ ${tx('Spécial mission', 'Mission specials')}</div>${sfx(ss.sfx)}` : ''}
      ${(S.groups || []).map(gr => `<div class="ma-h3">${gr.ic} ${gr.t}</div>${sfx(gr.sfx)}`).join('')}
      <div class="ma-next"><button class="ma-b pri" data-go="${(game() || {}).started ? 'play' : 'brief'}">◀ ${tx('Retour', 'Back')}</button></div>`;
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
