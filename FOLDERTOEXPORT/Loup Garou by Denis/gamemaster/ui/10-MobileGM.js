// ========================================
// 10-MOBILE GM — Interface téléphone "appli" plein écran à onglets
// Actif automatiquement sur écrans <= 920px (rien ne change sur PC).
// Onglets en bas : 🗺️ Table | ⚡ Actions (rôles + action) | 📜 Log
// - L'overlay GM passe en plein écran (fini la fenêtre flottante et la soundboard derrière)
// - Onglet Table : la map s'ouvre comme un parchemin, et s'enroule quand on la quitte
// - Onglet Actions : liste des rôles en haut + zone d'action en bas, zéro scroll horizontal
// ========================================
(function () {
  'use strict';

  const MQ = window.matchMedia('(max-width: 920px)');
  const TAB_KEY = 'gmMobileActiveTab';
  const TABS = [
    { id: 'map', icon: '🗺️', label: 'Table' },
    { id: 'jeu', icon: '⚡', label: 'Actions' },
    { id: 'log', icon: '📜', label: 'Log' }
  ];

  let currentTab = localStorage.getItem(TAB_KEY) || 'map';
  if (currentTab === 'roles' || currentTab === 'action') currentTab = 'jeu'; // migration ancien réglage
  if (!TABS.some(t => t.id === currentTab)) currentTab = 'map';
  let animating = false;

  const isMobile = () => MQ.matches;

  // ---------- STYLES ----------
  function injectStyles() {
    if (document.getElementById('gm-mobile-styles')) return;
    const style = document.createElement('style');
    style.id = 'gm-mobile-styles';
    style.textContent = `
@media (max-width: 920px) {

  /* La soundboard derrière ne scrolle plus / disparaît visuellement */
  body.gm-mobile.gm-open { overflow: hidden !important; }

  /* Le popup "Préparation hors-ligne" (z-index 99999) recouvrait la barre d'onglets */
  body.gm-mobile.gm-open #offline-progress-pop { display: none !important; }

  /* Overlay GM = appli plein écran */
  body.gm-mobile.gm-open .game-master-overlay {
    display: flex !important;
    flex-direction: column !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: none !important;
    border: none !important;
    border-radius: 0 !important;
    resize: none !important;
    overflow: hidden !important;
    animation: none !important;
    transform: none !important;
  }

  /* Header compact, pas de drag/resize/minimize en plein écran */
  body.gm-mobile.gm-open .gm-header { padding: 6px 10px !important; cursor: default !important; border-radius: 0 !important; }
  body.gm-mobile.gm-open #gmHeader > div:first-child { display: none !important; } /* poignée ⋮⋮ */
  body.gm-mobile.gm-open #gmBtnCollapse,
  body.gm-mobile.gm-open .gm-resize-overlay,
  body.gm-mobile.gm-open #gmResizeOverlay { display: none !important; }

  body.gm-mobile.gm-open #gmContent { flex: 1 1 auto !important; min-height: 0 !important; }
  body.gm-mobile.gm-bar #gmContent { overflow: hidden !important; }

  /* Les onglets du haut (Jeu/Log) sont remplacés par la barre du bas */
  body.gm-mobile.gm-bar #gmTabs { display: none !important; }

  /* ----- Layout MDJ ----- */
  body.gm-mobile .mdj-main-container {
    flex-direction: column !important;
    padding: 8px !important;
    height: 100% !important;
    min-height: 0 !important;
    perspective: 900px;
  }
  body.gm-mobile .mdj-resize-handle { display: none !important; }

  body.gm-mobile .mdj-left-panel,
  body.gm-mobile .mdj-center-panel,
  body.gm-mobile .mdj-right-panel {
    display: none !important;
    width: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
  }

  /* Onglet Table : map seule, plein écran.
     Neutralise les media queries du jeu (max-width:768px) qui écrasent la map
     à 180px de haut et la table à 200x200. */
  body.gm-mobile.gm-tab-map .mdj-left-panel { display: flex !important; flex: 1 1 auto !important; }
  body.gm-mobile .mdj-live-map { flex: 1 1 auto !important; min-height: 0 !important; }
  body.gm-mobile .mdj-table-visual {
    width: 94% !important;
    height: 94% !important;
    max-width: none !important;
    max-height: none !important;
  }

  /* Onglet Actions : liste des rôles à GAUCHE (30%) + zone d'action à DROITE (70%) */
  body.gm-mobile.gm-tab-jeu .mdj-main-container { flex-direction: row !important; }
  body.gm-mobile.gm-tab-jeu .mdj-center-panel {
    display: flex !important;
    flex: 0 0 30% !important;
    width: 30% !important;
    margin-right: 8px !important;
    padding: 8px 6px !important;
  }
  body.gm-mobile.gm-tab-jeu .mdj-right-panel {
    display: flex !important;
    flex: 1 1 auto !important;
    width: auto !important;
    overflow-y: auto !important;
  }

  /* Cibles tactiles dans la liste des joueurs/rôles (colonne étroite : compact) */
  body.gm-mobile .listbox-item { padding: 10px 6px !important; font-size: 12px !important; }

  /* ----- Animation parchemin de la map ----- */
  body.gm-mobile .mdj-left-panel.gm-anim-in {
    animation: gmUnroll .5s cubic-bezier(.22, 1, .36, 1);
    transform-origin: 50% 0;
    will-change: transform, opacity;
  }
  body.gm-mobile .mdj-left-panel.gm-anim-out {
    animation: gmRollup .3s ease-in forwards;
    transform-origin: 50% 0;
    will-change: transform, opacity;
  }

  /* ----- Barre d'onglets du bas ----- */
  #gmMobileTabs { display: none; }
  body.gm-mobile.gm-open.gm-bar #gmMobileTabs {
    display: flex !important;
    flex: 0 0 auto;
    background: #12122a;
    border-top: 1px solid rgba(199,125,255,0.35);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  #gmMobileTabs .gm-mtab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px 6px;
    background: transparent;
    border: none;
    color: #9a9ab8;
    font-family: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  #gmMobileTabs .gm-mtab-ico { font-size: 20px; line-height: 1; }
  #gmMobileTabs .gm-mtab-lbl { font-size: 10px; font-weight: 700; letter-spacing: .3px; }
  #gmMobileTabs .gm-mtab.active {
    color: #81dff7;
    background: linear-gradient(180deg, rgba(81,116,219,0.25), transparent);
    box-shadow: inset 0 2px 0 #5174db;
  }
}

/* Le parchemin se déroule du haut vers le bas... */
@keyframes gmUnroll {
  0%   { transform: perspective(900px) rotateX(-75deg) scaleY(.15); opacity: 0; }
  55%  { transform: perspective(900px) rotateX(10deg) scaleY(1.03); opacity: 1; }
  75%  { transform: perspective(900px) rotateX(-4deg) scaleY(1); }
  100% { transform: none; opacity: 1; }
}
/* ...et s'enroule quand on le quitte */
@keyframes gmRollup {
  0%   { transform: none; opacity: 1; }
  100% { transform: perspective(900px) rotateX(-75deg) scaleY(.12); opacity: 0; }
}
`;
    document.head.appendChild(style);
  }

  // ---------- ÉTAT / CLASSES BODY ----------
  function syncBodyClasses() {
    const overlay = document.getElementById('gameMasterOverlay');
    const open = !!overlay && overlay.style.display !== 'none';
    const mdjActive = !!document.querySelector('.mdj-main-container');
    const ui = window.gameUI;
    const logActive = !!(ui && ui.activeTab === 'log');

    // Cohérence : si le jeu MDJ est affiché mais que l'onglet mémorisé est "log", revenir à la table
    if (mdjActive && !logActive && currentTab === 'log') currentTab = 'map';

    const b = document.body.classList;
    b.toggle('gm-mobile', isMobile());
    b.toggle('gm-open', open);
    b.toggle('gm-bar', isMobile() && open && (mdjActive || logActive));
    TABS.forEach(t => b.toggle('gm-tab-' + t.id, isMobile() && currentTab === t.id));
    updateBar();
  }

  // ---------- BARRE D'ONGLETS ----------
  function ensureTabBar() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (!overlay || document.getElementById('gmMobileTabs')) return;
    const bar = document.createElement('div');
    bar.id = 'gmMobileTabs';
    bar.innerHTML = TABS.map(t =>
      `<button type="button" class="gm-mtab" data-mtab="${t.id}">
         <span class="gm-mtab-ico">${t.icon}</span><span class="gm-mtab-lbl">${t.label}</span>
       </button>`
    ).join('');
    overlay.appendChild(bar);
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.gm-mtab');
      if (btn) setTab(btn.dataset.mtab);
    });
    updateBar();
  }

  function updateBar() {
    document.querySelectorAll('#gmMobileTabs .gm-mtab').forEach(b =>
      b.classList.toggle('active', b.dataset.mtab === currentTab)
    );
  }

  // ---------- MAP : recalcul à la bonne taille ----------
  function refreshMap() {
    requestAnimationFrame(() => {
      try { window.gm && window.gm.mdj && typeof window.gm.mdj.renderLiveMap === 'function' && window.gm.mdj.renderLiveMap(); } catch (_) {}
    });
  }

  // La map calcule sa disposition d'après la taille du rendu PRÉCÉDENT ;
  // au premier rendu (ou après un changement de taille) elle utilise donc de
  // mauvaises dimensions sur téléphone. On re-déclenche le rendu tant que la
  // taille réellement mesurée ne correspond pas à celle utilisée pour le layout.
  let mapFixPending = false;
  function checkMapLayout() {
    if (!isMobile() || currentTab !== 'map') return;
    const mdj = window.gm && window.gm.mdj;
    if (!mdj || typeof mdj.renderLiveMap !== 'function') return;
    const visual = document.querySelector('.mdj-live-map .mdj-table-visual');
    if (!visual || !visual.clientWidth || !visual.clientHeight) return;
    const n = ((window.gm.state && window.gm.state.players) || []).length;
    const key = Math.round(visual.clientWidth) + 'x' + Math.round(visual.clientHeight) + 'x' + n;
    if (mdj._lastLayoutKey !== key) {
      try { mdj.renderLiveMap(); } catch (_) {} // recalcule avec la vraie taille
    }
  }
  function scheduleMapFix() {
    if (mapFixPending) return;
    mapFixPending = true;
    requestAnimationFrame(() => { mapFixPending = false; checkMapLayout(); });
  }

  // ---------- CHANGEMENT D'ONGLET ----------
  function applyTab(tab) {
    currentTab = tab;
    try { localStorage.setItem(TAB_KEY, tab); } catch (_) {}
    const ui = window.gameUI;
    if (ui) {
      if (tab === 'log') {
        if (ui.activeTab !== 'log') { ui.activeTab = 'log'; ui.updateTabStyles && ui.updateTabStyles(); ui.render(); }
      } else if (ui.activeTab === 'log') {
        ui.activeTab = 'game'; ui.updateTabStyles && ui.updateTabStyles(); ui.render();
      }
    }
    syncBodyClasses();
    if (tab === 'map') {
      refreshMap(); // recalcul de la table à la nouvelle taille
      const lp = document.querySelector('.mdj-left-panel');
      if (lp && isMobile()) {
        lp.classList.remove('gm-anim-out');
        lp.classList.add('gm-anim-in'); // le parchemin se déroule
        setTimeout(() => lp.classList.remove('gm-anim-in'), 600);
      }
    }
  }

  function setTab(tab) {
    if (tab === currentTab || animating) return;
    const lp = document.querySelector('.mdj-left-panel');
    const leavingMap = currentTab === 'map' && isMobile() && lp &&
      document.body.classList.contains('gm-tab-map');

    if (leavingMap) {
      // Le parchemin s'enroule avant de laisser la place au nouvel onglet
      animating = true;
      lp.classList.remove('gm-anim-in');
      lp.classList.add('gm-anim-out');
      setTimeout(() => {
        lp.classList.remove('gm-anim-out');
        animating = false;
        applyTab(tab);
      }, 300);
    } else {
      applyTab(tab);
    }
  }

  // ---------- OBSERVATION ----------
  function wireOverlay() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (!overlay || overlay.__gmMobileWired) return;
    overlay.__gmMobileWired = true;
    ensureTabBar();
    // Ouverture/fermeture (display) de l'overlay
    new MutationObserver(syncBodyClasses).observe(overlay, { attributes: true, attributeFilter: ['style'] });
    // Changement d'écran + tout re-rendu de la map -> vérifie taille réelle vs layout
    const content = document.getElementById('gmContent');
    if (content) new MutationObserver(() => { syncBodyClasses(); scheduleMapFix(); }).observe(content, { childList: true, subtree: true });
    syncBodyClasses();
  }

  function start() {
    injectStyles();
    // Détecte la création de l'overlay GM
    new MutationObserver(wireOverlay).observe(document.body, { childList: true });
    wireOverlay();
    const onMq = () => { syncBodyClasses(); scheduleMapFix(); };
    if (MQ.addEventListener) MQ.addEventListener('change', onMq);
    else if (MQ.addListener) MQ.addListener(onMq);
    window.addEventListener('resize', scheduleMapFix);
    syncBodyClasses();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
