/**
 * Role Renderers - Rendu par rôle spécifique
 * Encapsule la logique de rendu pour chaque rôle
 */

class BaseRoleRenderer {
  constructor(gmState, rolesLoader, nightState) {
    this.gmState = gmState;
    this.rolesLoader = rolesLoader;
    this.nightState = nightState;
  }

  getPlayerName(playerId) {
    const p = this.gmState.players?.find(x => x.id === playerId);
    return p?.name || 'Unknown';
  }

  createActionButton(emoji, text, onClick, bgColor = 'rgba(255,255,255,0.12)') {
    const btn = document.createElement('button');
    btn.className = 'role-action-btn';
    btn.style.background = bgColor;
    btn.innerHTML = `<span class="btn-emoji">${emoji}</span><span class="btn-name">${text}</span>`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  renderSelectPlayer(players, onSelect, maxSelections = 1) {
    const list = document.createElement('div');
    list.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1;';

    players.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;
      opt.style.background = 'rgba(255,255,255,0.08)';

      opt.addEventListener('click', () => {
        onSelect(p);
        list.querySelectorAll('.cupidon-player-option').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#ffd700';
      });

      list.appendChild(opt);
    });

    return list;
  }
}

class CupidonRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#ffd700; font-size:0.9rem; text-align:center;';
    title.textContent = '💘 Choisir les 2 amoureux';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    const selected = [];

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        if (opt.classList.contains('selected')) {
          opt.classList.remove('selected');
          opt.style.borderColor = 'transparent';
          const idx = selected.indexOf(p.id);
          if (idx > -1) selected.splice(idx, 1);
        } else {
          if (selected.length < 2) {
            opt.classList.add('selected');
            opt.style.borderColor = '#ffd700';
            selected.push(p.id);
          }
        }
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = `✓ Confirmer ${selected.length}/2`;
    btn.disabled = selected.length !== 2;

    btn.addEventListener('click', () => {
      if (selected.length === 2) {
        onActionComplete('lover', selected);
      }
    });

    cont.appendChild(btn);
    return cont;
  }
}

class VoyanteRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#81b4f7; font-size:0.9rem; text-align:center;';
    title.textContent = '🔮 Voir le rôle de';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    let selected = null;

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        listCont.querySelectorAll('.selected').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#81b4f7';
        selected = p.id;
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = '✓ Voir le rôle';
    btn.disabled = !selected;

    btn.addEventListener('click', () => {
      if (selected) {
        onActionComplete('see_role', [selected]);
      }
    });

    cont.appendChild(btn);
    return cont;
  }
}

class SorcierRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#ff9999; font-size:0.9rem; text-align:center;';
    title.textContent = '🧪 Empoisonner';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    let selected = null;

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    const noneOpt = document.createElement('div');
    noneOpt.className = 'cupidon-player-option';
    noneOpt.innerHTML = '<span class="player-name">Aucun</span>';
    noneOpt.addEventListener('click', () => {
      listCont.querySelectorAll('.selected').forEach(o => {
        o.classList.remove('selected');
        o.style.borderColor = 'transparent';
      });
      noneOpt.classList.add('selected');
      noneOpt.style.borderColor = '#ff9999';
      selected = null;
    });
    listCont.appendChild(noneOpt);

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        listCont.querySelectorAll('.selected').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#ff9999';
        selected = p.id;
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = '✓ Empoisonner';

    btn.addEventListener('click', () => {
      onActionComplete('poison', selected ? [selected] : []);
    });

    cont.appendChild(btn);
    return cont;
  }
}

class SalvateurRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#81f78f; font-size:0.9rem; text-align:center;';
    title.textContent = '🛡️ Protéger';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    let selected = null;

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        listCont.querySelectorAll('.selected').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#81f78f';
        selected = p.id;
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = '✓ Protéger';
    btn.disabled = !selected;

    btn.addEventListener('click', () => {
      if (selected) {
        onActionComplete('protect', [selected]);
      }
    });

    cont.appendChild(btn);
    return cont;
  }
}

class PistoleroRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#ffaa44; font-size:0.9rem; text-align:center;';
    title.textContent = '🔫 Tirer sur';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    let selected = null;

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        listCont.querySelectorAll('.selected').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#ffaa44';
        selected = p.id;
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = '✓ Tirer';
    btn.disabled = !selected;

    btn.addEventListener('click', () => {
      if (selected) {
        onActionComplete('shoot', [selected]);
      }
    });

    cont.appendChild(btn);
    return cont;
  }
}

class VoleusesRenderer extends BaseRoleRenderer {
  render(state, onActionComplete) {
    const cont = document.createElement('div');
    cont.style.cssText = 'display:flex; flex-direction:column; gap:8px; flex:1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; color:#d4a5ff; font-size:0.9rem; text-align:center;';
    title.textContent = '💎 Voler le pouvoir';
    cont.appendChild(title);

    const alivePlayers = this.nightState.getAlivePlayers();
    let selected = null;

    const listCont = document.createElement('div');
    listCont.style.cssText = 'display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; min-height:0;';

    alivePlayers.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'cupidon-player-option';
      opt.innerHTML = `<span class="player-name">${HTMLHelpers.escapeHTML(p.name)}</span>`;

      opt.addEventListener('click', () => {
        listCont.querySelectorAll('.selected').forEach(o => {
          o.classList.remove('selected');
          o.style.borderColor = 'transparent';
        });
        opt.classList.add('selected');
        opt.style.borderColor = '#d4a5ff';
        selected = p.id;
      });

      listCont.appendChild(opt);
    });

    cont.appendChild(listCont);

    const btn = document.createElement('button');
    btn.className = 'btn-validate-action';
    btn.textContent = '✓ Voler';
    btn.disabled = !selected;

    btn.addEventListener('click', () => {
      if (selected) {
        onActionComplete('steal_votes', [selected]);
      }
    });

    cont.appendChild(btn);
    return cont;
  }
}

class RoleRenderersFactory {
  static create(roleId, gmState, rolesLoader, nightState) {
    switch (roleId) {
      case 'Cupidon':
        return new CupidonRenderer(gmState, rolesLoader, nightState);
      case 'Voyante':
        return new VoyanteRenderer(gmState, rolesLoader, nightState);
      case 'Sorciere':
        return new SorcierRenderer(gmState, rolesLoader, nightState);
      case 'Salvateur':
        return new SalvateurRenderer(gmState, rolesLoader, nightState);
      case 'Pistolero':
        return new PistoleroRenderer(gmState, rolesLoader, nightState);
      case 'Voleuses':
        return new VoleusesRenderer(gmState, rolesLoader, nightState);
      default:
        return new BaseRoleRenderer(gmState, rolesLoader, nightState);
    }
  }
}

window.RoleRenderersFactory = RoleRenderersFactory;
window.BaseRoleRenderer = BaseRoleRenderer;
