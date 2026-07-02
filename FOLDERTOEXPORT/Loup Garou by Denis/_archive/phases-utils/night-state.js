/**
 * NightState - Gestion centralisée de l'état de la nuit
 * Encapsule: morts, protégés, amoureux, idole, etc.
 */

class NightState {
  constructor(gmState) {
    this.gmState = gmState;
    this.deadPlayerIds = new Set();
    this.roleStates = {}; // { roleId: { completed, result, ... } }
    this.selectedPlayers = [];
    this.selectedRoleId = null;
  }

  /**
   * Joueurs vivants
   */
  getAlivePlayers() {
    return (this.gmState.players || []).filter(p => !this.isDead(p.id));
  }

  /**
   * Vérifier si joueur est mort
   */
  isDead(playerId) {
    return this.deadPlayerIds.has(playerId);
  }

  /**
   * Marquer un joueur comme mort
   */
  killPlayer(playerId) {
    this.deadPlayerIds.add(playerId);
  }

  /**
   * Obtenir joueurs protégés (Salvateur)
   */
  getProtectedPlayers(roleStates) {
    const protected = new Set();
    if (roleStates['Salvateur']?.completed && roleStates['Salvateur']?.result?.targets) {
      roleStates['Salvateur'].result.targets.forEach(id => {
        if (id && !id.startsWith('potion-')) {
          protected.add(id);
        }
      });
    }
    return protected;
  }

  /**
   * Vérifier si c'est un amoureux du Cupidon
   */
  getLovers(roleStates) {
    return roleStates['Cupidon']?.result?.targets || [];
  }

  /**
   * Idole de l'Enfant Sauvage
   */
  getIdol(roleStates) {
    const targets = roleStates['Enfant_Sauvage']?.result?.targets || [];
    return targets[0] || null;
  }

  /**
   * Réinitialiser l'état
   */
  reset() {
    this.deadPlayerIds.clear();
    this.roleStates = {};
    this.selectedPlayers = [];
    this.selectedRoleId = null;
  }

  /**
   * Obtenir l'état complet (pour sérialisation)
   */
  serialize() {
    return {
      deadPlayerIds: Array.from(this.deadPlayerIds),
      roleStates: this.roleStates,
      selectedPlayers: this.selectedPlayers,
      selectedRoleId: this.selectedRoleId
    };
  }

  /**
   * Restaurer depuis état sérialisé
   */
  deserialize(data) {
    this.deadPlayerIds = new Set(data.deadPlayerIds || []);
    this.roleStates = data.roleStates || {};
    this.selectedPlayers = data.selectedPlayers || [];
    this.selectedRoleId = data.selectedRoleId || null;
  }
}

window.NightState = NightState;
