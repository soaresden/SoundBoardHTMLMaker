// ========================================
// 10-MOBILE GM — Interface téléphone "appli" plein écran à onglets
// Actif automatiquement sur écrans <= 920px (rien ne change sur PC).
// Onglets en bas : 🗺️ Table | 🌙 Rôles | ⚡ Action | 📜 Log
// - L'overlay GM passe en plein écran (fini la fenêtre flottante et la soundboard derrière)
// - Un seul panneau à la fois, zéro scroll horizontal
// - Tap sur un joueur dans "Rôles" -> bascule auto sur "Action"
// ========================================
(function () {
  'use strict';

  const MQ = window.matchMedia('(max-width: 920px)');
  const TAB_KEY = 'gmMobileActiveTab';
  const TABS = [
    { id: 'map',    icon: '🗺️', label: 'Table' },
    { id: 'roles',  icon: '🌙', label: 'Rôles' },
    { id: 'action', icon: '⚡', label: 'Action' },
    { id: 'log',    icon: '📜', label: 'Log' }
  ];

  let currentTab = localStorage.getItem(TAB_KEY) || 'map';
  if (!TABS.some(t => t.id === currentTab)) currentTab = 'map';

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

  /* ----- Layout MDJ : un panneau = un écran ----- */
  body.gm-mobile .mdj-main-container {
    flex-direction: column !important;
    padding: 8px !important;
    height: 100% !important;
    min-height: 0 !important;
  }
  body.gm-mobile .mdj-resize-handle { display: none !important; }

  body.gm-mobile .mdj-left-panel,
  body.gm-mobile .mdj-center-panel,
  body.gm-mobile .mdj-right-panel {
    display: none !important;
    flex: 1 1 auto !important;
    width: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
  }
  body.gm-mobile.gm-tab-map    .mdj-left-panel   { display: flex !important; }
  body.gm-mobile.gm-tab-roles  .mdj-center-panel { display: flex !important; }
  body.gm-mobile.gm-tab-action .mdj-right-panel  { display: flex !important; overflow-y: auto !important; }

  /* Cibles tactiles plus grandes dans la liste des joueurs/rôles */
  body.gm-mobile .listbox-item { padding: 11px 10px !important; font-size: 14px !important; }

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

  function refreshMap() {
    requestAnimationFrame(() => {
      try { window.gm && window.gm.mdj && typeof window.gm.mdj.renderLiveMap === 'function' && window.gm.mdj.renderLiveMap(); } catch (_) {}
    });
  }

  function setTab(tab) {
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
    if (tab === 'map') refreshMap(); // recalcul de la table à la nouvelle taille
  }

  // Tap sur un joueur (onglet Rôles) ou sur "Résumé de la nuit" -> bascule sur Action
  function attachTapRedirects() {
    document.addEventListener('click', (e) => {
      if (!isMobile() || currentTab !== 'roles') return;
      const item = e.target.closest('#role-listbox .listbox-item');
      if (item && !item.classList.contains('disabled')) {
        setTimeout(() => setTab('action'), 120);
        return;
      }
      if (e.target.closest('#mdj-goto-summary')) {
        setTimeout(() => setTab('action'), 120);
      }
    });
  }

  // ---------- OBSERVATION ----------
  function wireOverlay() {
    const overlay = document.getElementById('gameMasterOverlay');
    if (!overlay || overlay.__gmMobileWired) return;
    overlay.__gmMobileWired = true;
    ensureTabBar();
    // Ouverture/fermeture (display) de l'overlay
    new MutationObserver(syncBodyClasses).observe(overlay, { attributes: true, attributeFilter: ['style'] });
    // Changement d'écran (le container MDJ apparaît/disparaît dans gmContent)
    const content = document.getElementById('gmContent');
    if (content) new MutationObserver(syncBodyClasses).observe(content, { childList: true });
    syncBodyClasses();
  }

  function start() {
    injectStyles();
    attachTapRedirects();
    // Détecte la création de l'overlay GM
    new MutationObserver(wireOverlay).observe(document.body, { childList: true });
    wireOverlay();
    const onMq = () => { syncBodyClasses(); if (isMobile() && currentTab === 'map') refreshMap(); };
    if (MQ.addEventListener) MQ.addEventListener('change', onMq);
    else if (MQ.addListener) MQ.addListener(onMq);
    window.addEventListener('resize', () => { if (isMobile() && currentTab === 'map') refreshMap(); });
    syncBodyClasses();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
