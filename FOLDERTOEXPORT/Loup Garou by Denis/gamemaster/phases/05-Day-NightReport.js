/**
 * 05-Day-NightReport.js
 * Generate a night report summary showing actions and deaths
 */

/**
 * Generate Night Report - 2 column layout
 * LEFT: All actions taken (Cupidon touched X and Y, Voyante saw Z, etc)
 * RIGHT: Deaths list with causes
 */
function renderNightReport(gameUI) {
  const gm = gameUI.gm;
  const players = gm.state.players || [];
  const roleStates = gm.state.gameState?.roleStates || {};

  // Get all actions taken during the night
  const actions = [];
  const rolesLoader = window.rolesLoader || window.getRoleLoaderInstance?.() || {
    getRole: (roleId) => window.ROLES_DATA?.[roleId]
  };

  Object.entries(roleStates).forEach(([roleId, state]) => {
    if (state.completed && state.result?.targets?.length > 0) {
      const roleData = rolesLoader.getRole(roleId);
      const roleName = roleData?.name || roleId;
      const emoji = roleData?.emoji || '❓';
      const action = state.result.action;

      // Format action label
      let actionText = '';
      const targets = state.result.targets
        .filter(t => !t.startsWith('potion-'))
        .map(id => {
          const p = players.find(pl => pl.id === id);
          return p?.name || id;
        })
        .join(' et ');

      if (action === 'lover' && targets) {
        actionText = `${emoji} ${roleName} a touché ${targets}`;
      } else if (action === 'idol' && targets) {
        actionText = `${emoji} ${roleName} a désigné ${targets} comme idole`;
      } else if (action === 'join_wolves') {
        actionText = `${emoji} ${roleName} a choisi de devenir Loup`;
      } else if (action === 'see_role' && targets) {
        actionText = `${emoji} ${roleName} a vu ${targets}`;
      } else if (action === 'protect' && targets) {
        actionText = `${emoji} ${roleName} a protégé ${targets}`;
      } else if (action === 'sniff' && targets) {
        actionText = `${emoji} ${roleName} a reniflé ${targets}`;
      } else if (action === 'steal_votes' && targets) {
        actionText = `${emoji} ${roleName} a volé les votes de ${targets}`;
      } else if (action === 'kill' && targets) {
        // Don't show wolf kills here - they go to the deaths section
        return;
      } else if (action === 'poison' && targets) {
        // Don't show poison here - it goes to deaths section
        return;
      }

      if (actionText) {
        actions.push(actionText);
      }
    }
  });

  // Get all deaths with causes
  const deaths = [];
  const deadPlayers = players.filter(p => p.isDead);

  deadPlayers.forEach(p => {
    let cause = 'Cause inconnue';

    // Check for wolf kills
    const wolfKillers = [];
    ['Simple_Loup_Garou', 'Grand_Mechant_Loup', 'Loup_Garou_Blanc'].forEach(wolfRole => {
      const state = roleStates[wolfRole];
      if (state?.result?.targets?.includes(p.id)) {
        wolfKillers.push(wolfRole);
      }
    });

    if (wolfKillers.length > 0) {
      if (wolfKillers.includes('Grand_Mechant_Loup')) {
        cause = 'Dévoré par le Grand Méchant Loup';
      } else {
        cause = 'Dévoré par les Loups';
      }
    }

    // Check for Sorciere poison
    const sorciereState = roleStates['Sorciere'];
    if (sorciereState?.result?.targets?.includes(p.id)) {
      cause = 'Tué par la potion de la Sorcière';
    }

    const roleData = rolesLoader.getRole(p.role);
    const emoji = roleData?.emoji || '❓';
    deaths.push({
      name: p.name,
      emoji: emoji,
      cause: cause
    });
  });

  // Build HTML
  const actionsHtml = actions.length > 0
    ? actions.map(action => `<div style="padding:8px; background:rgba(100,150,200,0.2); border-left:3px solid #81dff7; margin-bottom:6px; font-size:11px; border-radius:2px;">${action}</div>`).join('')
    : '<div style="padding:12px; text-align:center; color:#aaa; font-size:11px;">Aucune action cette nuit</div>';

  const deathsHtml = deaths.length > 0
    ? deaths.map(d => `
        <div style="padding:8px; background:rgba(212,102,102,0.2); border-left:3px solid #ff9999; margin-bottom:6px; font-size:11px; border-radius:2px;">
          <strong>${d.emoji} ${d.name}</strong><br>
          <span style="color:#ff9999; font-size:10px;">${d.cause}</span>
        </div>
      `).join('')
    : '<div style="padding:12px; text-align:center; color:#aaa; font-size:11px;">Aucune mort cette nuit</div>';

  return `
    <div style="display:flex; gap:16px; padding:16px; height:100%; background:rgba(0,0,0,0.2); border-radius:6px;">
      <!-- LEFT COLUMN: ACTIONS -->
      <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
        <h3 style="margin:0 0 12px 0; color:#81dff7; font-size:13px; font-weight:600; border-bottom:2px solid #81dff7; padding-bottom:8px;">
          📋 Actions de la Nuit
        </h3>
        <div style="flex:1; overflow-y:auto; padding-right:8px;">
          ${actionsHtml}
        </div>
      </div>

      <!-- RIGHT COLUMN: DEATHS -->
      <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
        <h3 style="margin:0 0 12px 0; color:#ff9999; font-size:13px; font-weight:600; border-bottom:2px solid #ff9999; padding-bottom:8px;">
          ☠️ Décès
        </h3>
        <div style="flex:1; overflow-y:auto; padding-right:8px;">
          ${deathsHtml}
        </div>
      </div>
    </div>
  `;
}

// Export for use in Day.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderNightReport };
}
