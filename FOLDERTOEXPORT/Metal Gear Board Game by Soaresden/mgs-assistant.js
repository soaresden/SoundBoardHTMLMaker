/* MGS Board Game — Assistant en fenêtre déplaçable/redimensionnable/réductible. Autonome. */
(function () {
  if (window.__mgsAssistantReady) return;
  window.__mgsAssistantReady = true;

  const ACT = {
    common: [
      { id:'sneak', name:'Sneak', cost:1, noisy:false, icon:'🚶', flow:["1 case adjacente (jamais diagonale)","Déplace ta figurine"] },
      { id:'dash', name:'Dash', cost:1, noisy:true, icon:'🏃', flow:["Bouge de 2 cases","🔊 Bruyant → Noise check en fin de tour"] },
      { id:'hand', name:'Corps-à-corps', cost:1, noisy:false, icon:'👊', dice:true, flow:["Cible ADJACENTE","Lance les dés de ton dashboard","Chaque dé ≥ Défense = 1 dégât"] },
      { id:'combo', name:'Combo', cost:2, noisy:false, icon:'🥊', dice:true, flow:["Cible adjacente","2 dés","≥ Défense = 1 dégât KO (assomme)"] },
      { id:'silent', name:'Silent Takedown', cost:2, noisy:false, icon:'🤫', flow:["Derrière un garde adjacent","Remplace-le par un garde assommé (sans bruit)"] },
      { id:'focus', name:'Focus', cost:1, noisy:false, icon:'🎯', flow:["Jeton Focus inactif","Paie son coût de recharge → réutilisable"] },
      { id:'drag', name:'Traîner', cost:1, noisy:false, icon:'🫳', flow:["Garde KO/mort adjacent","Bouge d'1 case, pose-le à côté (cache le corps)"] },
      { id:'interact', name:'Interagir', cost:1, noisy:false, icon:'🛠️', dice:true, flow:["Ascenseur / porte / objet","Verrou : lance les dés indiqués","Relance possible, tout réussir ce tour"] },
      { id:'knock', name:'Toquer', cost:1, noisy:false, icon:'✊', flow:["Jeton Investigate 🔍 sur ta case","Attire un garde"] },
    ],
    Meryl:[ { id:'disguise', name:'Déguisement', cost:2, icon:'🥸', flow:["Adjacente à un garde KO/mort","Pas Alertée → Meryl déguisée"] } ],
    Otacon:[
      { id:'hack', name:'Hacker', cost:1, icon:'💻', dice:true, flow:["Sur/adjacent à un Terminal","4 dés noirs (+bonus), relance","Combinaison = hacké"] },
      { id:'syss', name:'Recherche', cost:1, icon:'🔎', flow:["Terminal hacké","Pioche 1 carte Système (max 3)"] },
      { id:'access', name:'Accès', cost:1, icon:'⚙️', dice:true, flow:["Terminal hacké +1 carte","≤4 dés noirs sur les emplacements","Carte pleine = effet"] },
    ],
  };
  const CHARS=['Snake','Meryl','Otacon','Gray Fox'];
  const CE={ 'Snake':'🐍','Meryl':'🔫','Otacon':'🤓','Gray Fox':'🥷' };
  const STAGE_CHARS={1:['Snake'],2:['Snake'],3:['Snake','Meryl'],4:['Snake'],5:['Snake'],6:['Snake'],7:['Snake'],8:['Snake','Meryl'],9:['Snake','Meryl'],10:['Snake','Otacon'],11:['Snake','Meryl','Gray Fox','Otacon'],12:['Snake','Meryl','Gray Fox','Otacon'],13:['Snake','Meryl','Gray Fox','Otacon'],14:['Snake','Meryl','Gray Fox','Otacon']};

  const state = { char:'Snake', stageId:null, actSel:'sneak', view:'mission', min:false, max:false, prev:null };
  const stage = () => (window.MGS_STAGES||[]).find(x=>x.id===state.stageId) || null;
  const availChars = () => state.stageId ? (STAGE_CHARS[state.stageId]||CHARS) : CHARS;
  const actsFor = c => [...(ACT[c]||[]), ...ACT.common];

  const css = `
  #mgsa-btn{position:fixed;right:16px;bottom:16px;z-index:99998;background:linear-gradient(135deg,#1c8,#063);color:#fff;border:none;border-radius:30px;padding:11px 16px;font:700 13px Poppins,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)}
  #mgsa-win{position:fixed;top:70px;right:18px;width:380px;height:520px;z-index:99999;display:none;flex-direction:column;background:linear-gradient(160deg,#0e1a14,#0a0f0c);color:#dfeee6;font:12.5px Poppins,system-ui,sans-serif;border:2px solid #1c8;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.55);overflow:hidden;resize:both;min-width:280px;min-height:120px}
  #mgsa-win.show{display:flex}
  #mgsa-win.min{height:auto!important;resize:none}
  #mgsa-win.min .wbody,#mgsa-win.min .wtabs{display:none}
  .whead{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(90deg,rgba(28,200,136,.25),transparent);cursor:move;user-select:none;touch-action:none;border-bottom:1px solid rgba(40,200,120,.2)}
  .whead .ti{font-weight:800;font-size:13px;letter-spacing:.4px}
  .wbtns{margin-left:auto;display:flex;gap:5px}
  .wbtns button{width:24px;height:24px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:800;background:rgba(255,255,255,.12);color:#fff}
  .wbtns .c{background:rgba(220,90,90,.4)}
  .wtabs{display:flex;gap:5px;align-items:center;padding:7px 9px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.07)}
  #mgsa-stage{background:#0e1a14;color:#eafff2;border:1px solid rgba(60,210,140,.5);border-radius:7px;padding:5px 7px;font-weight:700;font-size:12px;flex:1;min-width:120px}
  #mgsa-stage option{background:#0e1a14;color:#eafff2}
  .tab{background:rgba(255,255,255,.07);color:#dfeee6;border:1px solid rgba(255,255,255,.12);border-radius:7px;padding:5px 9px;font-weight:800;font-size:11.5px;cursor:pointer}
  .tab.on{background:#1c8;color:#04110b;border-color:#3fa}
  .wbody{flex:1;overflow:auto;padding:10px 12px}
  .hint{font-size:11.3px;color:#9fc4ad}
  .chips{display:flex;gap:5px;flex-wrap:wrap;margin:2px 0 6px}
  .chip{padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#dfeee6;cursor:pointer;font-weight:700;font-size:12px}
  .chip.on{background:#1c8;border-color:#3fa;color:#04110b}
  .vgrid{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
  .vig{display:flex;gap:6px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:5px 8px;background:rgba(255,255,255,.03);cursor:pointer}
  .vig.on{background:rgba(28,200,136,.18);border-color:#3fa}
  .vig .ic{font-size:15px}.vig .nm{font-weight:800;font-size:11.5px}.vig .co{font-size:10px;color:#9fc4ad}.vig .co.noisy{color:#e9a13c}
  .det{border:1px solid rgba(60,210,140,.3);border-radius:10px;padding:9px 11px;background:rgba(255,255,255,.03)}
  .det-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .det-h .bic{font-size:22px}.det-h .bn{font-weight:800;font-size:14px}
  .det-h .bc{font-size:10px;background:#1c8;color:#04110b;border-radius:9px;padding:0 7px;margin-left:5px;font-weight:800}.det-h .bc.noisy{background:#e9a13c;color:#1a1206}
  .steps{counter-reset:s;list-style:none;margin:0;padding:0}
  .steps li{position:relative;padding:5px 4px 5px 28px;font-size:12px;line-height:1.35}
  .steps li:not(:last-child){border-left:2px solid #1c8;margin-left:10px;padding-left:18px}
  .steps li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:4px;width:18px;height:18px;border-radius:50%;background:#1c8;color:#04110b;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:10.5px}
  .det-dice{margin-top:6px;background:rgba(40,160,220,.1);border:1px solid rgba(40,160,220,.3);border-radius:8px;padding:6px 8px;font-size:11.3px;line-height:1.4}.det-dice b{color:#fff}.det-dice .k{color:#7fe3a8;font-weight:800}
  .frows{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:6px 0}
  .frow{display:flex;gap:6px;font-size:11.3px;background:rgba(255,255,255,.04);border-radius:7px;padding:5px 7px}.frow span{color:#c9a}.frow b{color:#fff}
  .fblock{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:7px 10px;margin-top:6px}
  .fblock.obj{border-color:#3fa}.fblock.boss{border-color:#f77}
  .fbt{font-weight:800;font-size:12px;color:#ffd9a0;margin-bottom:3px}.fblock.obj .fbt{color:#7fe3a8}.fblock.boss .fbt{color:#f9a}
  .fblock ul{margin:0;padding-left:16px}.fblock li{font-size:11.5px;line-height:1.35;margin:1px 0}
  .fnote{font-size:11px;color:#cfe;background:rgba(40,160,220,.1);border:1px solid rgba(40,160,220,.3);border-radius:7px;padding:6px 8px;margin-top:6px;line-height:1.35}
  .badge{display:inline-block;font-size:10px;font-weight:800;border-radius:9px;padding:1px 8px}
  .b-sneak{background:rgba(40,160,220,.18);color:#9fe0ff}.b-boss{background:rgba(220,80,80,.18);color:#ffb0b0}
  .flow{display:flex;flex-direction:column;align-items:center;gap:0}
  .fnode{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(60,210,140,.3);border-radius:10px;padding:8px 10px;font-size:11.8px;line-height:1.4}.fnode b{color:#fff}.fnode .t{font-weight:800;color:#aef;font-size:12.5px}
  .conn{width:3px;height:16px;background:#1c8;position:relative}.conn:after{content:'▼';position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);color:#1c8;font-size:10px}
  .spot{background:rgba(220,80,80,.12);border:1px solid rgba(220,80,80,.4);border-radius:9px;padding:7px 9px;font-size:11.3px;line-height:1.4;color:#ffc9c9;margin-top:6px}.spot b{color:#fff}
  `;

  function fiche(){
    const s=stage(); if(!s) return `<div class="hint">👆 Choisis ta mission, puis utilise les onglets <b>🎮 Actions</b> et <b>🔄 Tour</b>.</div>`;
    const row=(l,v)=> v?`<div class="frow"><span>${l}</span><b>${v}</b></div>`:'';
    const list=(l,arr,cls='')=> (arr&&arr.length)?`<div class="fblock ${cls}"><div class="fbt">${l}</div><ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'';
    const boss=s.boss?`<div class="fblock boss"><div class="fbt">👾 Boss : ${s.boss.name}</div><ul>${(s.boss.setup||[]).map(x=>`<li>${x}</li>`).join('')}</ul>${s.boss.note?`<div class="fnote">${s.boss.note}</div>`:''}</div>`:'';
    const cc=(STAGE_CHARS[s.id]||CHARS).map(c=>CE[c]+c[0]).join(' ');
    return `<div style="font-weight:800;font-size:13px;margin-bottom:2px">Stage ${s.id} — ${s.name} <span class="badge ${s.type==='boss'?'b-boss':'b-sneak'}">${s.type==='boss'?'👾':'🕵️'}</span></div>
      <div class="hint">⏱️ ${s.time||''} · 👥 ${s.players||''} · 🎭 ${cc}</div>
      <div class="frows">${row('🧩 Tuiles',(s.tiles||[]).join(', '))}${row('🃏 Guard Order',s.guardDeck)}${row('🎥 Caméras',s.cameras)}${row('👮 Gardes',s.guards)}${row('🔔 Events',(s.events||[]).join(' · '))}${row('🔁 Réac.',s.reaction)}</div>
      ${list('🎯 Objectif',s.objective,'obj')}${boss}${list('⚠️ Spécial',s.special)}
      ${s.cleared?`<div class="fnote">✅ ${s.cleared}</div>`:''}`;
  }

  function actionsView(){
    const avail=availChars(); if(!avail.includes(state.char)) state.char=avail[0];
    const acts=actsFor(state.char); if(!acts.find(a=>a.id===state.actSel)) state.actSel=acts[0].id;
    const sel=acts.find(a=>a.id===state.actSel)||acts[0];
    const vigs=acts.map(a=>`<div class="vig ${a.id===state.actSel?'on':''}" data-act="${a.id}"><div class="ic">${a.icon}</div><div><div class="nm">${a.name}</div><div class="co ${a.noisy?'noisy':''}">${a.cost}pt${a.noisy?'🔊':''}</div></div></div>`).join('');
    const dice=sel.dice?`<div class="det-dice">🎲 Compare <b>chaque dé</b> à la <span class="k">Défense de la cible</span> : <b>dé ≥ Défense = 1 dégât</b>${sel.id==='combo'?' <b>KO</b> (assomme)':''}.<br>
      <span style="color:#9fc4ad">Ex. cible Défense <b style="color:#fff">3</b> : tu fais <b style="color:#7fe3a8">4</b> → 1 dégât ✅ · tu fais <b style="color:#f88">2</b> → rien ❌. Tu lances 2 dés (4 et 2) = <b>1 dégât</b> au total.</span>
      ${sel.noisy||sel.id==='dash'?'':''}<br><span style="color:#9fc4ad">⚪ Dé <b>blanc</b> : une face « <b>!</b> » = tu <b>attires l'attention</b> (en plus du chiffre).</span></div>`:'';
    return `<div class="hint">Perso : </div><div class="chips">${avail.map(c=>`<span class="chip ${c===state.char?'on':''}" data-char="${c}">${CE[c]} ${c}</span>`).join('')}</div>
      <div class="vgrid">${vigs}</div>
      <div class="det"><div class="det-h"><span class="bic">${sel.icon}</span><span class="bn">${sel.name}<span class="bc ${sel.noisy?'noisy':''}">${sel.cost} pt${sel.cost>1?'s':''}${sel.noisy?' 🔊':''}</span></span></div>
        <ol class="steps">${sel.flow.map(x=>`<li>${x}</li>`).join('')}</ol>${dice}</div>
      <div class="fnote">🎒 Équipement = actions à part (LOUD 🔊 = pose Alerté). Tu es attaqué → tu lances les dés (≥ ta Défense = 1 dégât), Focus baisse un dé.</div>`;
  }

  function turnView(){
    const s=stage(); const isBoss=s?s.type==='boss':null;
    const enemy = isBoss===true
      ? `<div class="fnode"><span class="t">4 · Phase Ennemie (Boss)</span><br>Pioche la carte du <b>deck Boss</b> → déplacement + attaque (tu lances pour ta défense). Carte sous le paquet.</div>`
      : isBoss===false
      ? `<div class="fnode"><span class="t">4 · Phase Ennemie (Infiltration)</span><br>Carte <b>Guard Order</b> → ① <b>Action gardes</b> · ② <b>Caméras</b> (Facing+LOS) · ③ <b>Activer gardes</b> (<b style="color:#f88">Alerte=rouge</b>, sinon bleu).<div class="spot">👁️ <b>Repéré (LOS)</b> → jeton <b>Alerté</b>, le garde s'arrête et t'attaque ; les gardes foncent. Garde blessé non assommé en fin de tour → Alerté.</div></div>`
      : `<div class="fnode"><span class="t">4 · Phase Ennemie</span><br>Choisis une mission pour la bonne phase.</div>`;
    return `<div class="flow">
      <div class="fnode"><span class="t">1 · Début du round</span><br>Reprends tes <b>4 jetons Action</b>.</div><div class="conn"></div>
      <div class="fnode"><span class="t">2 · Phase Joueurs</span><br>Chacun son tour. <b>4 actions max</b>, ordre libre (action répétable).</div><div class="conn"></div>
      <div class="fnode"><span class="t">3 · Noise check (fin de ton tour)</span><br>Actions 🔊 + garde dans ta zone → 1 dé noir/action ; « ! » = attention.</div><div class="conn"></div>
      ${enemy}<div class="conn"></div>
      <div class="fnode" style="text-align:center;color:#9fe3bd">↻ Nouveau round</div>
    </div>`;
  }

  function render(){
    const win=document.getElementById('mgsa-win');
    win.querySelectorAll('.tab[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===state.view));
    const body=document.getElementById('mgsa-body');
    body.innerHTML = state.view==='actions'?actionsView() : state.view==='turn'?turnView() : fiche();
  }

  function build(){
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    const btn=document.createElement('button');btn.id='mgsa-btn';btn.textContent='🎮 Assistant MGS';
    document.body.appendChild(btn);
    const win=document.createElement('div');win.id='mgsa-win';
    win.innerHTML=`
      <div class="whead" id="mgsa-head"><span>🎮</span><span class="ti">Assistant MGS</span>
        <div class="wbtns"><button id="mgsa-min" title="Réduire">—</button><button id="mgsa-max" title="Agrandir">▢</button><button class="c" id="mgsa-close" title="Fermer">✕</button></div></div>
      <div class="wtabs">
        <select id="mgsa-stage"><option value="">— Mission —</option></select>
        <button class="tab on" data-view="mission">📋 Mission</button>
        <button class="tab" data-view="actions">🎮 Actions</button>
        <button class="tab" data-view="turn">🔄 Tour</button>
      </div>
      <div class="wbody" id="mgsa-body"></div>`;
    document.body.appendChild(win);

    const sel=win.querySelector('#mgsa-stage');
    (window.MGS_STAGES||[]).forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=(s.type==='boss'?'👾 ':'🕵️ ')+'S'+s.id+' — '+s.name;sel.appendChild(o);});
    sel.addEventListener('change',()=>{state.stageId=sel.value?+sel.value:null;render();});

    const open=()=>{win.classList.add('show');render();};
    btn.onclick=open;
    win.querySelector('#mgsa-close').onclick=()=>win.classList.remove('show');
    win.querySelector('#mgsa-min').onclick=()=>{win.classList.toggle('min');};
    win.querySelector('#mgsa-max').onclick=()=>{
      if(state.max){state.max=false;win.classList.remove('min');Object.assign(win.style,state.prev||{});win.style.resize='both';}
      else{state.max=true;state.prev={top:win.style.top,right:win.style.right,left:win.style.left,width:win.style.width,height:win.style.height};
        win.classList.remove('min');win.style.left='8px';win.style.top='8px';win.style.right='auto';win.style.width='calc(100vw - 16px)';win.style.height='calc(100vh - 16px)';win.style.resize='none';}
    };

    // tabs + interactions
    win.addEventListener('click',(e)=>{
      const tb=e.target.closest('.tab[data-view]'); if(tb){state.view=tb.dataset.view;return render();}
      const ch=e.target.closest('.chip'); if(ch&&ch.dataset.char){state.char=ch.dataset.char;return render();}
      const vg=e.target.closest('.vig'); if(vg&&vg.dataset.act){state.actSel=vg.dataset.act;return render();}
    });

    // drag via header (Pointer Events)
    const head=win.querySelector('#mgsa-head');
    let dx=0,dy=0,drag=false;
    head.addEventListener('pointerdown',(e)=>{
      if(e.target.closest('.wbtns'))return;
      if(state.max)return;
      drag=true; const r=win.getBoundingClientRect();
      win.style.left=r.left+'px';win.style.top=r.top+'px';win.style.right='auto';
      dx=e.clientX-r.left; dy=e.clientY-r.top;
      head.setPointerCapture(e.pointerId); e.preventDefault();
    });
    head.addEventListener('pointermove',(e)=>{
      if(!drag)return;
      const x=Math.max(0,Math.min(window.innerWidth-60,e.clientX-dx));
      const y=Math.max(0,Math.min(window.innerHeight-30,e.clientY-dy));
      win.style.left=x+'px';win.style.top=y+'px';
    });
    const end=(e)=>{drag=false;try{head.releasePointerCapture(e.pointerId);}catch(_){}};
    head.addEventListener('pointerup',end); head.addEventListener('pointercancel',end);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
