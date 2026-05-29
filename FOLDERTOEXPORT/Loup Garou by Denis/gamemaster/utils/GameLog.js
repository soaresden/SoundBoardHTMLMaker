// ========================================
// GAME LOG - Enregistrement des événements
// ========================================

class GameLog {
  constructor(gameState) {
    this.state = gameState;
    if (!this.state.gameLog) {
      this.state.gameLog = [];
    }
  }

  addEvent(text, turn = null) {
    this.state.gameLog.push({
      turn: turn || `Nuit ${this.getTurn()}`,
      text: text,
      timestamp: new Date().toLocaleTimeString('fr-FR')
    });
  }

  assignRole(playerName, roleName) {
    this.addEvent(`${playerName} a été assigné au rôle <strong>${roleName}</strong>`);
  }

  cupidoAction(player1Name, player2Name) {
    this.addEvent(`💘 Cupidon a rendu amoureux <strong>${player1Name}</strong> et <strong>${player2Name}</strong>`);
  }

  voyanteLook(voyanteName, targetName) {
    this.addEvent(`👁️ ${voyanteName} (Voyante) a regardé <strong>${targetName}</strong>`);
  }

  wolfKill(wolfName, targetName) {
    this.addEvent(`🐺 ${wolfName} (Loup-Garou) a tué <strong>${targetName}</strong> la nuit`);
  }

  villageVote(voterName, targetName) {
    this.addEvent(`🗳️ Le village a voté pour éliminer <strong>${targetName}</strong>`);
  }

  witchRevive(witchName, targetName) {
    this.addEvent(`🧪 ${witchName} (Sorciere) a ressuscité <strong>${targetName}</strong>`);
  }

  witchPoison(witchName, targetName) {
    this.addEvent(`☠️ ${witchName} (Sorciere) a empoisonné <strong>${targetName}</strong>`);
  }

  getTurn() {
    const turns = this.state.gameLog
      .filter(e => e.turn && e.turn.includes('Nuit'))
      .map(e => parseInt(e.turn.split('Nuit ')[1]))
      .sort((a, b) => b - a);
    return turns.length > 0 ? turns[0] : 1;
  }

  clear() {
    this.state.gameLog = [];
  }

  getLog() {
    return this.state.gameLog;
  }
}
