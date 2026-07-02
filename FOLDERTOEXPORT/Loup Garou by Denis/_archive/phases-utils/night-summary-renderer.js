/**
 * NightSummaryRenderer - Rendu du tableau Événements/Morts
 * Gère: affichage compact, expansion au clic, tooltip
 */

class NightSummaryRenderer {
  constructor(rolesLoader, getPlayerName) {
    this.rolesLoader = rolesLoader;
    this.getPlayerName = getPlayerName;
  }

  /**
   * Rendre les événements (actions Cupidon, Voyante, etc.)
   */
  renderEvents(roleStates) {
    const events = [];
    const skipActions = new Set(['kill', 'poison', 'resurrect']);

    Object.entries(roleStates).forEach(([roleId, state]) => {
      if (!state.completed || !state.result) return;
      const action = state.result.action;
      if (skipActions.has(action)) return;

      const roleData = this.rolesLoader.getRole(roleId);
      const emoji = roleData?.emoji || '❓';
      const targets = (state.result.targets || [])
        .filter(t => !t.startsWith('potion-') && t !== 'join_wolves' && t !== 'stay_villager')
        .map(id => this.getPlayerName(id))
        .filter(Boolean);

      let text = '';
      if (action === 'lover' && targets.length) text = `${emoji} ${targets.join(' & ')}`;
      else if (action === 'idol' && targets.length) text = `${emoji} → ${targets[0]}`;
      else if (action === 'see_role' && targets.length) text = `${emoji} → ${targets[0]}`;
      else if (action === 'protect' && targets.length) text = `${emoji} → ${targets[0]}`;
      else if (action === 'sniff' && targets.length) text = `${emoji} → ${targets.join(',')}`;
      else if (action === 'steal_votes' && targets.length) text = `${emoji} → ${targets[0]}`;
      else if (action === 'join_wolves') text = `${emoji} → 🐺`;
      else if (action === 'stay_villager') text = `${emoji} → 🏘️`;

      if (text) events.push(text);
    });

    return events;
  }

  /**
   * Rendre les morts avec cause
   */
  renderDeaths(deadPlayerIds, players, roleStates, cupidonLovers) {
    const deaths = [];

    deadPlayerIds.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      let cause = 'par les Loups';
      if (roleStates['Grand_Mechant_Loup']?.result?.targets?.includes(playerId)) {
        cause = 'par le Grand Méchant Loup';
      }
      if (roleStates['Sorciere']?.result?.action === 'poison' &&
          roleStates['Sorciere']?.result?.targets?.includes(playerId)) {
        cause = 'par la Sorcière';
      }
      if (cupidonLovers.includes(playerId) && cupidonLovers.length === 2) {
        const otherId = cupidonLovers.find(id => id !== playerId);
        const otherName = this.getPlayerName(otherId);
        if (deadPlayerIds.has(otherId) && otherId !== playerId) {
          cause = `par amour avec ${otherName}`;
        }
      }

      deaths.push({ name: player.name, cause });
    });

    return deaths;
  }

  /**
   * Générer HTML avec événements et morts (compact + cliquable)
   */
  generateHTML(events, deaths, styles) {
    const col = styles.col;
    const hdr = styles.hdr;
    const row = styles.row;

    const escapeHTML = (str) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const evHtml = events.length
      ? events.map(e => {
        const escaped = escapeHTML(e);
        return `<div class="event-row" style="${row} color:#c8e0ff; border-color:#5080c0; background:rgba(80,130,200,0.1);" data-full-text="${escaped}" title="Click pour voir en entier">${e}</div>`;
      }).join('')
      : `<div style="font-size:0.75em; color:#555; text-align:center; padding:4px;">—</div>`;

    const dtHtml = deaths.length
      ? deaths.map(d => {
        const fullText = `${d.name} (${d.cause})`;
        const escaped = escapeHTML(fullText);
        return `<div class="death-row" style="${row} color:#ffcdd2; border-color:#c05050; background:rgba(180,40,40,0.12);" data-full-text="${escaped}" title="Click pour voir en entier">${d.name} <span style="color:#ff9999;font-size:0.85em;">(${d.cause})</span></div>`;
      }).join('')
      : `<div style="font-size:0.75em; color:#555; text-align:center; padding:4px;">🌙 Aucune</div>`;

    return {
      events: evHtml,
      deaths: dtHtml,
      html: `
        <div style="display:flex; gap:6px; height:100%; min-height:0;">
          <div style="${col}">
            <div style="${hdr} color:#81b4f7; border-bottom:1px solid rgba(80,130,200,0.3);">📋 Événements</div>
            ${evHtml}
          </div>
          <div style="${col}">
            <div style="${hdr} color:#ff9999; border-bottom:1px solid rgba(180,40,40,0.3);">☠️ Morts</div>
            ${dtHtml}
          </div>
        </div>`
    };
  }

  /**
   * Attacher les écouteurs d'expansion
   */
  attachClickHandlers(container) {
    container?.querySelectorAll('.event-row, .death-row').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const fullText = HTMLHelpers?.decodeHTML(row.dataset.fullText) || row.dataset.fullText;

        if (row.style.whiteSpace === 'normal') {
          row.style.whiteSpace = 'nowrap';
          row.style.overflow = 'hidden';
          row.style.textOverflow = 'ellipsis';
          row.style.background = '';
        } else {
          row.style.whiteSpace = 'normal';
          row.style.overflow = 'visible';
          row.style.textOverflow = 'clip';
          row.style.background = 'rgba(0,0,0,0.4)';
        }
      });
    });
  }
}

window.NightSummaryRenderer = NightSummaryRenderer;
