/* =====================================================================
 * MGS Board Game — Assistant (rappel visuel, plein écran). Autonome.
 * Pas de tracker : juste des rappels. Type de stage = selon la mission.
 * ===================================================================== */
(function () {
  if (window.__mgsAssistantReady) return;
  window.__mgsAssistantReady = true;

  const ACT = {
    common: [
      { name:'Sneak',        cost:1, noisy:false, icon:'🚶', eff:"Bouge d'1 case." },
      { name:'Dash',         cost:1, noisy:true,  icon:'🏃', eff:"Bouge de 2 cases. (Bruyant 🔊)" },
      { name:'Corps-à-corps',cost:1, noisy:false, icon:'👊', eff:"Attaque une figurine adjacente. Lance le dé de ton dashboard." },
      { name:'Combo',        cost:2, noisy:false, icon:'🥊', eff:"Attaque adjacente. 2 dés. Dégâts KO (assomme)." },
      { name:'Silent Takedown', cost:2, noisy:false, icon:'🤫', eff:"Derrière un garde adjacent : remplace-le par un garde assommé (sans bruit)." },
      { name:'Focus',        cost:1, noisy:false, icon:'🎯', eff:"Recharge 1 jeton Focus inactif (coût = son coût de recharge)." },
      { name:'Traîner',      cost:1, noisy:false, icon:'🫳', eff:"Ramasse un garde KO/mort (adjacent), bouge d'1 case, le repose à côté." },
      { name:'Interagir',    cost:1, noisy:false, icon:'🛠️', eff:"Ascenseur / porte / objet. Verrou = lance les dés indiqués." },
      { name:'Toquer (Knock)', cost:1, noisy:false, icon:'✊', eff:"Attire l'attention sur ta case (appâte un garde)." },
    ],
    Meryl:  [ { name:'Gagner déguisement', cost:2, icon:'🥸', eff:"Adjacente à un garde KO/mort & pas alertée → Meryl déguisée." } ],
    Otacon: [
      { name:'Hacker terminal', cost:1, icon:'💻', eff:"4 dés noirs (+bonus). Relance possible. Combinaison atteinte = hacké." },
      { name:'Recherche système', cost:1, icon:'🔎', eff:"Terminal hacké : pioche 1 carte Système (max 3)." },
      { name:'Accès systèmes',  cost:1, icon:'⚙️', eff:"≤4 dés noirs sur les emplacements des cartes. Carte pleine = effet." },
    ],
  };
  const CHARS=['Snake','Meryl','Otacon','Gray Fox'];
  const CE={ 'Snake':'🐍','Meryl':'🔫','Otacon':'🤓','Gray Fox':'🥷' };
  const state = { char:'Snake', stageId:null };
  const stage = () => (window.MGS_STAGES||[]).find(x=>x.id===state.stageId) || null;
  const actsFor = c => [...(ACT[c]||[]), ...ACT.common];

  const css = `
  #mgsa-btn{position:fixed;right:16px;bottom:16px;z-index:99998;background:linear-gradient(135deg,#1c8,#063);color:#fff;border:none;border-radius:30px;padding:12px 18px;font:700 14px Poppins,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)}
  #mgsa-ov{position:fixed;inset:0;z-index:99999;display:none;background:radial-gradient(1200px 800px at 50% -10%,rgba(20,80,50,.35),#05080a 60%);color:#dfeee6;font:14px Poppins,system-ui,sans-serif;overflow:auto}
  #mgsa-ov.open{display:block}
  .mgsa-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(5,12,10,.94);border-bottom:1px solid rgba(40,200,120,.25);backdrop-filter:blur(4px);flex-wrap:wrap}
  .mgsa-top h2{font-size:16px;margin:0;letter-spacing:.5px}
  .mgsa-x{margin-left:auto;background:rgba(255,255,255,.1);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px}
  #mgsa-stage{background:#0e1a14;color:#eafff2;border:1px solid rgba(60,210,140,.5);border-radius:9px;padding:8px 10px;font-weight:700;font-size:13px;max-width:280px}
  #mgsa-stage option{background:#0e1a14;color:#eafff2}
  .mgsa-wrap{max-width:1100px;margin:0 auto;padding:16px 16px 70px;display:flex;flex-direction:column;gap:14px}
  .card{background:linear-gradient(160deg,#0e1a14,#0b1310);border:1px solid rgba(60,210,140,.28);border-radius:14px;padding:14px 16px;box-shadow:0 6px 22px rgba(0,0,0,.35)}
  .card h3{margin:0 0 4px;font-size:15px;display:flex;align-items:center;gap:8px}
  .hint{font-size:12.5px;color:#9fc4ad}
  .chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px}
  .chip{padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#dfeee6;cursor:pointer;font-weight:700;font-size:13px}
  .chip.on{background:#1c8;border-color:#3fa;color:#04110b}
  .agrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-top:8px}
  .a{display:flex;gap:9px;align-items:flex-start;border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.03)}
  .a .ic{font-size:22px;line-height:1;flex:0 0 auto}
  .a .nm{font-weight:800;font-size:13px}
  .a .cost{display:inline-block;font-size:11px;background:#1c8;color:#04110b;border-radius:10px;padding:0 7px;margin-left:6px;font-weight:800}
  .a .cost.noisy{background:#e9a13c;color:#1a1206}
  .a .ef{font-size:12px;color:#bcd;line-height:1.35;margin-top:2px}
  .dice{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
  .dice li{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 11px;font-size:12.8px;line-height:1.4}
  .dice li .di{font-size:20px;flex:0 0 auto}
  .dice b{color:#fff}.dice .k{color:#7fe3a8;font-weight:800}
  .steps{counter-reset:s;list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
  .steps li{position:relative;padding:9px 11px 9px 40px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:11px;font-size:12.8px;line-height:1.45}
  .steps li:before{counter-increment:s;content:counter(s);position:absolute;left:9px;top:9px;width:22px;height:22px;border-radius:50%;background:#1c8;color:#04110b;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:12px}
  .spot{background:rgba(220,80,80,.12);border:1px solid rgba(220,80,80,.4);border-radius:11px;padding:10px 12px;font-size:12.8px;line-height:1.45;color:#ffc9c9;margin-top:8px}
  .spot b{color:#fff}
  .frows{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
  .frow{display:flex;gap:8px;font-size:12.5px;background:rgba(255,255,255,.04);border-radius:8px;padding:6px 9px}
  .frow span{color:#c9a;flex:0 0 auto}.frow b{color:#fff}
  .fblock{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 12px;margin-top:8px}
  .fblock.obj{border-color:#3fa}.fblock.boss{border-color:#f77}
  .fbt{font-weight:800;font-size:13px;color:#ffd9a0;margin-bottom:4px}
  .fblock.obj .fbt{color:#7fe3a8}.fblock.boss .fbt{color:#f9a}
  .fblock ul{margin:0;padding-left:18px}.fblock li{font-size:12.5px;line-height:1.4;margin:2px 0}
  .fnote{font-size:12px;color:#cfe;background:rgba(40,160,220,.1);border:1px solid rgba(40,160,220,.3);border-radius:8px;padding:7px 9px;margin-top:8px;line-height:1.4}
  .badge{display:inline-block;font-size:11px;font-weight:800;border-radius:10px;padding:2px 10px}
  .b-sneak{background:rgba(40,160,220,.18);color:#9fe0ff;border:1px solid rgba(40,160,220,.4)}
  .b-boss{background:rgba(220,80,80,.18);color:#ffb0b0;border:1px solid rgba(220,80,80,.4)}
  `;

  function fiche(){
    const s=stage(); if(!s) return `<div class="card"><div class="hint">👆 Choisis ta mission en haut pour afficher sa mise en place et son objectif.</div></div>`;
    const row=(l,v)=> v?`<div class="frow"><span>${l}</span><b>${v}</b></div>`:'';
    const list=(l,arr,cls='')=> (arr&&arr.length)?`<div class="fblock ${cls}"><div class="fbt">${l}</div><ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'';
    const boss=s.boss?`<div class="fblock boss"><div class="fbt">👾 Boss : ${s.boss.name}</div><ul>${(s.boss.setup||[]).map(x=>`<li>${x}</li>`).join('')}</ul>${s.boss.note?`<div class="fnote">${s.boss.note}</div>`:''}</div>`:'';
    return `<div class="card">
      <h3>📋 Stage ${s.id} — ${s.name} <span class="badge ${s.type==='boss'?'b-boss':'b-sneak'}">${s.type==='boss'?'👾 Boss':'🕵️ Infiltration'}</span></h3>
      <div class="hint">⏱️ ${s.time||''} · 👥 ${s.players||''}</div>
      <div class="frows">
        ${row('🧩 Tuiles',(s.tiles||[]).join(', '))}
        ${row('🃏 Guard Order',s.guardDeck)}
        ${row('🎥 Caméras',s.cameras)}
        ${row('👮 Gardes',s.guards)}
        ${row('🔔 Events',(s.events||[]).join(' · '))}
        ${row('🔁 Réaction',s.reaction)}
      </div>
      ${list('🎯 Objectif',s.objective,'obj')}
      ${boss}
      ${list('⚠️ Règles spéciales',s.special)}
      ${s.cleared?`<div class="fnote">✅ Stage réussi : ${s.cleared}</div>`:''}
    </div>`;
  }

  function actionsCard(){
    const acts=actsFor(state.char).map(a=>`<div class="a">
      <div class="ic">${a.icon}</div>
      <div><div class="nm">${a.name}<span class="cost ${a.noisy?'noisy':''}">${a.cost} pt${a.cost>1?'s':''}${a.noisy?' 🔊':''}</span></div><div class="ef">${a.eff}</div></div>
    </div>`).join('');
    return `<div class="card">
      <h3>🎮 Ce que fait chaque point d'action <span class="hint">(4 points / tour)</span></h3>
      <div class="hint">Perso :</div>
      <div class="chips">${CHARS.map(c=>`<span class="chip ${c===state.char?'on':''}" data-char="${c}">${CE[c]} ${c}</span>`).join('')}</div>
      <div class="agrid">${acts}</div>
      <div class="fnote">🎒 Tes cartes <b>Équipement</b> (armes, gadgets) ont leurs propres actions/coûts. Les armes à feu, grenades, missiles sont <b>LOUD</b> 🔊 → pose ton jeton Alerté après usage.</div>
    </div>`;
  }

  function diceCard(){
    return `<div class="card">
      <h3>🎲 Lancers de dés — que faire selon le résultat</h3>
      <ul class="dice">
        <li><span class="di">⚔️</span><div><b>Tu attaques</b> → lance les dés de ton action/arme. Compare chaque dé à la <span class="k">Défense de la cible</span> : chaque dé <b>≥ Défense = 1 dégât</b>. (Combo / certaines actions = dégâts <b>KO</b> = assomme au lieu de tuer.)</div></li>
        <li><span class="di">🛡️</span><div><b>Tu es attaqué</b> (garde/boss) → c'est <b>TOI</b> qui lances les dés indiqués (dashboard du garde/boss). Chaque dé <b>≥ TA Défense = 1 dégât sur toi</b>. Dépense un <span class="k">Focus</span> pour baisser la valeur d'un dé.</div></li>
        <li><span class="di">⚪</span><div><b>Dé blanc</b> → si tu obtiens un <b>« ! »</b>, tu <b>attires l'attention</b> sur ta case (pose ton jeton).</div></li>
        <li><span class="di">🔊</span><div><b>Noise check</b> (fin de ton tour) → si un garde est dans ta zone, lance <b>1 dé noir par action bruyante</b> faite ; un <b>« ! »</b> = tu attires l'attention.</div></li>
        <li><span class="di">🔓</span><div><b>Verrou / Hack</b> → lance les dés indiqués, tu peux <b>relancer</b> (en refaisant l'action). Il faut <b>tout réussir dans le MÊME tour</b>, sinon le progrès est perdu.</div></li>
      </ul>
    </div>`;
  }

  function enemyCard(){
    const s=stage();
    const isBoss = s ? s.type==='boss' : null;
    if (isBoss === true) {
      return `<div class="card"><h3>👾 Phase ennemie — Boss</h3>
        <ol class="steps">
          <li><b>Pioche la carte du dessus du deck Boss</b> et lis-la.</li>
          <li>Applique le <b>déplacement + l'attaque</b> du boss (et les règles de son dashboard / du stage).</li>
          <li>Quand le boss t'attaque, <b>tu lances les dés indiqués</b> ; chaque dé ≥ ta Défense = 1 dégât.</li>
          <li>La carte résolue va <b>sous le paquet</b> (le deck Boss n'est jamais remélangé).</li>
        </ol></div>`;
    }
    if (isBoss === false) {
      return `<div class="card"><h3>🌙 Phase ennemie — Infiltration</h3>
        <div class="hint">👉 <b>Lis la carte « Guard Order »</b> du dessus du deck, puis applique ses 3 sections dans l'ordre :</div>
        <ol class="steps">
          <li><b>Action des gardes</b> — fais ce que dit la carte : <b>Réveil</b> (KO → garde), <b>Radio-In</b> (re-spawn jusqu'au compte de la zone), <b>Lost Contact</b>, <b>Stay Alert</b>.</li>
          <li><b>Caméras</b> — si l'icône le dit, retourne le jeton Facing, puis revérifie toutes les LOS des caméras.</li>
          <li><b>Activer les gardes</b> — zone active par zone (depuis le jeton Priorité = coin haut-gauche, de haut en bas / gauche à droite). Pour chaque garde, détermine son <b>mode</b> :
            <br>❗ <b>Alerte</b> (un jeton Alerté dans la zone) → fonce vers toi, <b style="color:#f88">chiffre ROUGE</b> de la carte.
            <br>🔍 <b>Investigate</b> (jeton Investigate / corps/bruit repérés) → va voir, <b style="color:#9df">chiffre BLEU</b>.
            <br>🚶 <b>Patrouille</b> (sinon) → avance tout droit, <b style="color:#9df">chiffre BLEU</b>, tourne selon les flèches de la carte.</li>
        </ol>
        <div class="spot">👁️ <b>Si un garde gagne la ligne de vue (LOS) sur toi</b> → pose ton jeton <b>Alerté</b> ❗, le garde <b>s'arrête</b> et <b>t'attaque</b> (tu lances ses dés contre ta Défense). Tant qu'un Alerté est sur la carte, les gardes de la zone te <b>foncent dessus</b> (chiffre rouge).<br>
        🔪 Tu blesses un garde mais ne l'assommes/tues pas avant la fin du tour → il devient <b>Alerté</b>.</div>
      </div>`;
    }
    // pas de stage choisi
    return `<div class="card"><h3>🌙 Phase ennemie</h3><div class="hint">Choisis ta mission en haut : j'afficherai automatiquement la bonne phase (Guard Order en infiltration, ou carte Boss).</div></div>`;
  }

  function render(){
    document.getElementById('mgsa-body').innerHTML = fiche()+actionsCard()+diceCard()+enemyCard();
  }

  function build(){
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    const btn=document.createElement('button');btn.id='mgsa-btn';btn.textContent='🎮 Assistant MGS';
    btn.onclick=()=>{document.getElementById('mgsa-ov').classList.add('open');render();};
    document.body.appendChild(btn);
    const ov=document.createElement('div');ov.id='mgsa-ov';
    ov.innerHTML=`
      <div class="mgsa-top">
        <span style="font-size:18px">🎮</span><h2>ASSISTANT — MGS</h2>
        <select id="mgsa-stage"><option value="">— Choisis ta mission —</option></select>
        <button class="mgsa-x" title="Fermer">✕</button>
      </div>
      <div class="mgsa-wrap" id="mgsa-body"></div>`;
    document.body.appendChild(ov);
    const sel=document.getElementById('mgsa-stage');
    (window.MGS_STAGES||[]).forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=(s.type==='boss'?'👾 ':'🕵️ ')+'Stage '+s.id+' — '+s.name;sel.appendChild(o);});
    sel.addEventListener('change',()=>{state.stageId=sel.value?+sel.value:null;render();});
    ov.addEventListener('click',(e)=>{
      const t=e.target;
      if(t.classList.contains('mgsa-x'))return ov.classList.remove('open');
      if(t.dataset.char){state.char=t.dataset.char;return render();}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
