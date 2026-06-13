// ========================================
// ÉCRAN: ORDRE DES JOUEURS (façon Undercover)
// On connaît le nombre de cartes du deck = nombre de joueurs (slots).
// On définit l'ORDRE en cliquant des prénoms depuis un cache (profils).
// Textbox pour ajouter un prénom manquant -> sauvegardé comme profil.
// Ensuite -> phase de révélation (revealSequential) dans cet ordre.
// (Les helpers lg* viennent de 02-TableAndRename.js, chargé avant.)
// ========================================

function _randomNamePool() {
  // Réutilise un générateur global si dispo, sinon petit pool de secours
  try {
    if (typeof getRandomPlayerNamesCardSelection === 'function') return getRandomPlayerNamesCardSelection(50);
    if (typeof getRandomPlayerNames === 'function') return getRandomPlayerNames(50);
  } catch (_) {}
  return ['Alex','Sam','Max','Lou','Noa','Eli','Tom','Léa','Zoé','Manu','Inès','Jules','Nina','Théo','Lina','Hugo'];
}

function renderDeckNames(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const N = players.length;

  // Pré-remplir le cache de profils avec le groupe connu (une seule fois),
  // pour que TOUS les prénoms habituels soient cliquables d'emblée.
  try {
    if (!localStorage.getItem('lg_profiles_seeded_v2')) {
      const DEFAULTS = (typeof window !== 'undefined' && Array.isArray(window.LG_PLAYER_NAMES) && window.LG_PLAYER_NAMES.length) ? window.LG_PLAYER_NAMES
                     : (typeof PLAYER_NAMES_SELECTION !== 'undefined' && Array.isArray(PLAYER_NAMES_SELECTION)) ? PLAYER_NAMES_SELECTION
                     : (typeof PLAYER_NAMES !== 'undefined' && Array.isArray(PLAYER_NAMES)) ? PLAYER_NAMES : [];
      if (DEFAULTS.length && typeof lgAddProfiles === 'function') lgAddProfiles(DEFAULTS);
      localStorage.setItem('lg_profiles_seeded_v2', '1');
    }
  } catch (_) {}

  const profiles = (typeof lgGetProfiles === 'function') ? lgGetProfiles() : [];
  const usedNames = new Set(players.map(p => (p.name || '').trim()).filter(Boolean));
  const placedCount = usedNames.size;

  const chipBase = 'border:1px solid rgba(199,125,255,0.45); border-radius:12px; padding:4px 12px; font-size:12px; cursor:pointer; color:#e8e8f0; background:rgba(80,60,140,0.5);';
  const chips = profiles.map((n, i) => {
    const used = usedNames.has(n.trim());
    return `<button class="dn-chip" data-idx="${i}" ${used ? 'disabled' : ''} title="${used ? 'Déjà placé' : 'Cliquer pour placer'}"
      style="${chipBase} ${used ? 'opacity:0.4; cursor:default; text-decoration:line-through;' : ''}">${used ? '✔ ' : ''}${n}</button>`;
  }).join('');

  const slots = players.map((p, idx) => {
    const filled = !!(p.name || '').trim();
    return `
      <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:${filled ? 'rgba(80,120,200,0.18)' : 'rgba(0,0,0,0.25)'}; border:1px solid rgba(199,125,255,0.2); border-radius:6px;">
        <div style="width:26px; height:26px; flex-shrink:0; border-radius:50%; background:rgba(199,125,255,0.25); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; color:#e8e8f0;">${idx + 1}</div>
        <div style="flex:1; font-size:14px; font-weight:${filled ? '700' : '400'}; color:${filled ? '#e8e8f0' : '#888'};">${filled ? p.name : '—'}</div>
        ${filled ? `<button class="dn-slot-clear" data-player-id="${p.id}" title="Retirer" style="border:none; background:rgba(180,90,90,0.5); color:#fff; border-radius:5px; width:24px; height:24px; cursor:pointer; font-weight:700;">✕</button>` : ''}
      </div>`;
  }).join('');

  const btn = 'border:1px solid rgba(199,125,255,0.4); border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; color:#fff; font-weight:600;';
  const allFilled = placedCount >= N && players.every(p => (p.name || '').trim());

  return `
    <div class="gm-screen" style="display:flex; flex-direction:column; height:100%; gap:0; padding:0;">
      <h2 style="padding:14px 16px; margin:0; border-bottom:2px solid rgba(199,125,255,0.3); background:linear-gradient(135deg, rgba(25,25,45,0.95), rgba(35,30,55,0.95)); font-size:17px; color:#e8e8f0;">
        👥 Ordre des joueurs — <span style="color:${allFilled ? '#66d999' : '#ffb84d'}">${placedCount}/${N}</span> placés
      </h2>
      <div style="padding:7px 12px; background:rgba(129,223,247,0.1); border-bottom:1px solid rgba(199,125,255,0.2); font-size:11px; color:#bfe9ff; line-height:1.35;">
        ℹ️ Mets les prénoms <b>dans l'ordre où les joueurs sont assis</b> (sens de passage de la tablette). Ça rendra la révélation plus simple : la tablette passe de main en main dans cet ordre.
      </div>

      <div style="padding:8px 10px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9)); border-bottom:1px solid rgba(199,125,255,0.2);">
        <div style="font-size:11px; color:#81dff7; font-weight:700; margin-bottom:5px;">Clique un prénom pour l'ajouter dans l'ordre <span style="opacity:0.6; font-weight:400;">(clic droit = retirer du cache)</span> :</div>
        <div id="dnChips" style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px;">
          ${chips || '<span style="font-size:11px; opacity:0.6;">aucun profil enregistré — ajoute un prénom ci-dessous</span>'}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" id="dnNewName" placeholder="Nouveau prénom…" maxlength="24"
            style="flex:1; padding:7px 10px; border:1px solid rgba(199,125,255,0.4); background:rgba(0,0,0,0.4); border-radius:6px; color:#e8e8f0; font-size:13px;">
          <button id="dnAdd" style="${btn} background:rgba(90,160,110,0.7);">＋ Ajouter</button>
          <button id="dnRandom" style="${btn} background:rgba(150,90,200,0.6);">🎲 Au hasard</button>
          <button id="dnClear" style="${btn} background:rgba(180,90,90,0.55);">✖ Vider</button>
          <button id="dnFromTxt" title="Recharger la liste depuis players.txt" style="${btn} background:rgba(90,120,200,0.65);">📄 players.txt</button>
        </div>
      </div>

      <div style="flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:5px; background:linear-gradient(135deg, rgba(20,25,45,0.9), rgba(30,35,55,0.9));">
        ${slots}
      </div>

      <div style="padding:10px 12px; border-top:1px solid rgba(199,125,255,0.2); display:flex; gap:12px; background:rgba(0,0,0,0.3); flex-shrink:0;">
        <button id="dnBack" style="background:rgba(255,255,255,0.1); border:1px solid rgba(199,125,255,0.3); padding:10px 16px; border-radius:6px; color:#e8e8f0; font-weight:600; cursor:pointer; flex:1;">← Retour</button>
        <button id="dnNext" ${allFilled ? '' : 'disabled'} style="background:${allFilled ? 'linear-gradient(135deg, #5174db, #c77dff)' : 'rgba(120,120,120,0.4)'}; border:none; padding:10px 16px; border-radius:6px; color:white; font-weight:600; cursor:${allFilled ? 'pointer' : 'not-allowed'}; flex:1;">Suivant : Révélation →</button>
      </div>
    </div>
  `;
}

function attachDeckNamesEvents(gameUI) {
  const gm = gameUI.gm;

  const fillNext = (name) => {
    name = String(name || '').trim();
    if (!name) return;
    const players = gm.state.players || [];
    const slot = players.find(p => !(p.name || '').trim());
    if (!slot) return; // tout est plein
    slot.name = name;
    gm.saveState();
    gameUI.render();
  };

  document.querySelectorAll('.dn-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const profiles = (typeof lgGetProfiles === 'function') ? lgGetProfiles() : [];
      const i = parseInt(chip.dataset.idx, 10);
      if (profiles[i]) fillNext(profiles[i]);
    });
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const profiles = (typeof lgGetProfiles === 'function') ? lgGetProfiles() : [];
      const i = parseInt(chip.dataset.idx, 10);
      const name = profiles[i];
      if (name && confirm('Retirer "' + name + '" du cache de profils ?')) {
        const next = profiles.filter((_, idx) => idx !== i);
        if (typeof lgSaveProfiles === 'function') lgSaveProfiles(next);
        gameUI.render();
      }
    });
  });

  document.querySelectorAll('.dn-slot-clear').forEach(b => {
    b.addEventListener('click', () => {
      const p = gm.state.players.find(pp => pp.id === b.dataset.playerId);
      if (p) { p.name = ''; gm.saveState(); gameUI.render(); }
    });
  });

  const addInput = document.getElementById('dnNewName');
  const doAdd = () => {
    const name = (addInput?.value || '').trim();
    if (!name) return;
    if (typeof lgAddProfiles === 'function') lgAddProfiles([name]);
    fillNext(name);
  };
  document.getElementById('dnAdd')?.addEventListener('click', doAdd);
  addInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

  document.getElementById('dnRandom')?.addEventListener('click', () => {
    const players = gm.state.players || [];
    const used = new Set(players.map(p => (p.name || '').trim()).filter(Boolean));
    const pool = _randomNamePool().filter(n => !used.has(n));
    let k = 0;
    players.forEach(p => { if (!(p.name || '').trim() && k < pool.length) { p.name = pool[k++]; } });
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('dnClear')?.addEventListener('click', () => {
    gm.state.players.forEach(p => { p.name = ''; });
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('dnFromTxt')?.addEventListener('click', () => {
    if (!confirm('Recharger la liste de profils depuis players.txt ?\nTes ajouts / suppressions en cache seront remplacés par le fichier.')) return;
    const apply = (names) => {
      const list = (names && names.length) ? names : ((typeof window !== 'undefined' && window.LG_PLAYER_NAMES) || []);
      if (list.length && typeof lgSaveProfiles === 'function') lgSaveProfiles(list);
      gameUI.render();
    };
    if (typeof window.reloadPlayerNamesFromTxt === 'function') window.reloadPlayerNamesFromTxt().then(apply);
    else apply();
  });

  document.getElementById('dnBack')?.addEventListener('click', () => {
    gm.state.mode = 'selectRoles';
    gm.saveState();
    gameUI.render();
  });

  document.getElementById('dnNext')?.addEventListener('click', () => {
    const players = gm.state.players || [];
    if (!players.every(p => (p.name || '').trim())) return;
    // Sauve l'ordre comme dernière table + enrichit le cache de prénoms
    const names = players.map(p => p.name.trim());
    if (typeof lgSaveLastTable === 'function') lgSaveLastTable(names);
    if (typeof lgAddProfiles === 'function') lgAddProfiles(names);
    // -> Révélation dans cet ordre (revealSequential assigne les rôles au hasard puis révèle)
    gm.state.mdjMode = true;
    gm.state.gameInterface = 'mdj';
    gm.state.tableType = 'circle';
    if (typeof gm.changePhase === 'function') gm.changePhase('revealSequential');
    else { gm.state.mode = 'revealSequential'; gm.saveState(); gameUI.render(); }
  });
}
