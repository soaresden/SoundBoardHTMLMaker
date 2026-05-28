/**
 * logging.js
 *
 * Comprehensive logging system for MDJ mode
 * Tracks all actions with timestamps and details
 * Format: DD/MM/YYYY à HH:MM:SS : Role - Action - Player/Details
 *
 * Example:
 *   26/05/2026 à 08:05:21 : Cupidon - a été assigné à Sophie
 *   26/05/2026 à 08:05:45 : Cupidon - a colorer les amoureux - Sophie & Denis
 */

class MDJLogger {
  constructor() {
    this.logs = [];
    this.logElement = null;
    this.sessionStart = new Date();
  }

  /**
   * Format a date as DD/MM/YYYY
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format a time as HH:MM:SS
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format a log entry
   * @param {Date} date
   * @param {string} role - Role name with emoji
   * @param {string} action - Action description
   * @param {string} details - Additional details
   * @returns {string}
   */
  formatLogEntry(date, role, action, details = '') {
    const dateStr = this.formatDate(date);
    const timeStr = this.formatTime(date);
    const fullAction = details ? `${action} - ${details}` : action;
    return `${dateStr} à ${timeStr} : ${role} - ${fullAction}`;
  }

  /**
   * Add a log entry
   * @param {string} role - Role with emoji (e.g., "💘 Cupidon")
   * @param {string} action - Action description
   * @param {string} details - Additional details (optional)
   * @param {Date} timestamp - Optional custom timestamp
   */
  log(role, action, details = '', timestamp = null) {
    const date = timestamp || new Date();
    const entry = this.formatLogEntry(date, role, action, details);

    this.logs.push({
      timestamp: date,
      role,
      action,
      details,
      formatted: entry
    });

    console.log(`[GameLog] ${entry}`);

    // Display in UI if element exists
    if (this.logElement) {
      this.renderLog();
    }

    return entry;
  }

  /**
   * Log role assignment
   * @param {string} role - Role name with emoji
   * @param {string} player - Player name
   */
  logRoleAssignment(role, player) {
    return this.log(role, `a été assigné à`, player);
  }

  /**
   * Log action selection
   * @param {string} role - Role name with emoji
   * @param {string} action - Action type (e.g., "a colorer les amoureux")
   * @param {Array|string} targets - Target player(s)
   */
  logAction(role, action, targets) {
    const targetStr = Array.isArray(targets) ? targets.join(' & ') : targets;
    return this.log(role, action, targetStr);
  }

  /**
   * Log selection confirmation
   * @param {string} role - Role name with emoji
   * @param {Array} selectedPlayers - Selected player names
   */
  logSelection(role, selectedPlayers) {
    const players = selectedPlayers.join(' & ');
    return this.log(role, `a sélectionné`, players);
  }

  /**
   * Log phase completion
   * @param {string} role - Role name with emoji
   */
  logPhaseComplete(role) {
    return this.log(role, `a complété son action`, '✓');
  }

  /**
   * Log role skipped/passed
   * @param {string} role - Role name with emoji
   * @param {string} reason - Why it was skipped
   */
  logSkipped(role, reason = '') {
    return this.log(role, `a passé son tour`, reason);
  }

  /**
   * Log day phase actions
   * @param {string} action - Action description
   * @param {string} details - Details
   */
  logDay(action, details = '') {
    return this.log('☀️ Jour', action, details);
  }

  /**
   * Log night phase start
   * @param {number} nightNumber
   */
  logNightStart(nightNumber) {
    return this.log('🌙', `Nuit ${nightNumber} commence`, '');
  }

  /**
   * Log morning phase start
   * @param {number} nightNumber
   */
  logMorning(nightNumber) {
    return this.log('☀️', `Matin après nuit ${nightNumber}`, '');
  }

  /**
   * Log death
   * @param {string} player - Player name
   * @param {string} cause - Cause of death
   */
  logDeath(player, cause = '') {
    return this.log('☠️', `${player} est mort`, cause);
  }

  /**
   * Set the log display element
   * @param {HTMLElement} element
   */
  setLogElement(element) {
    this.logElement = element;
    this.renderLog();
  }

  /**
   * Render logs to the log element
   */
  renderLog() {
    if (!this.logElement) return;

    const html = this.logs
      .map((entry, idx) => `
        <div class="log-entry" data-index="${idx}">
          <span class="log-time">${entry.formatted}</span>
        </div>
      `)
      .join('');

    this.logElement.innerHTML = html;

    // Auto-scroll to bottom
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  /**
   * Get all logs as formatted strings
   * @returns {Array<string>}
   */
  getFormattedLogs() {
    return this.logs.map(entry => entry.formatted);
  }

  /**
   * Get all logs as JSON
   * @returns {Array<Object>}
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
    if (this.logElement) {
      this.logElement.innerHTML = '';
    }
  }

  /**
   * Export logs as text
   * @returns {string}
   */
  exportAsText() {
    return this.logs.map(entry => entry.formatted).join('\n');
  }
}

// Create global logger instance
window.gameLogger = new MDJLogger();
