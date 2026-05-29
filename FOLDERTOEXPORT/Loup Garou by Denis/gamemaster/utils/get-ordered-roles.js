/**
 * Get Ordered Roles Utility
 *
 * Dynamically retrieves role ordering from loaded JSON role data
 * instead of using hardcoded arrays
 */

/**
 * Parse file number supporting both numeric (98) and alphanumeric (98a, 98b) formats
 * @param {string|number} fileNumber - The file number to parse
 * @returns {Object} Object with num and letter properties for comparison
 */
function parseFileNumber(fileNumber) {
  if (!fileNumber) return { num: Infinity, letter: '' };

  const str = String(fileNumber);
  const match = str.match(/^(\d+)([a-z])?/i);

  if (!match) return { num: Infinity, letter: '' };

  return {
    num: parseInt(match[1]),
    letter: match[2] ? match[2].toLowerCase() : ''
  };
}

/**
 * Compare two file numbers supporting both numeric and alphanumeric formats
 * @param {string|number} a - First file number
 * @param {string|number} b - Second file number
 * @returns {number} Negative if a < b, 0 if equal, positive if a > b
 */
function compareFileNumbers(a, b) {
  const aFile = parseFileNumber(a);
  const bFile = parseFileNumber(b);

  // Compare numbers first
  if (aFile.num !== bFile.num) {
    return aFile.num - bFile.num;
  }

  // If numbers are equal, compare letters (no letter comes before any letter)
  if (aFile.letter === '' && bFile.letter !== '') return -1;
  if (aFile.letter !== '' && bFile.letter === '') return 1;
  return aFile.letter.localeCompare(bFile.letter);
}

/**
 * Get all role IDs sorted by their "order" field from JSON configs
 * Supports both numeric (98) and alphanumeric (98a, 98b) file number formats
 * @param {Object} rolesData - Optional: the roles data object. If not provided, uses window.ROLES_DATA
 * @returns {Array} Array of role IDs sorted by their order field
 */
function getOrderedRoleIds(rolesData = null) {
  // Use provided data or fall back to global ROLES_DATA
  const data = rolesData || (window.ROLES_DATA && window.ROLES_DATA.roles) || {};

  if (Object.keys(data).length === 0) {
    console.warn('⚠️ No role data available. Make sure ROLES_DATA is loaded.');
    return [];
  }

  return Object.values(data)
    .sort((a, b) => compareFileNumbers(a._fileNumber || Infinity, b._fileNumber || Infinity))
    .map(role => role.id);
}

/**
 * Get available roles in order (only roles that are actually selected in the game)
 * Supports both numeric (98) and alphanumeric (98a, 98b) file number formats
 * @param {Object} selectedRoles - Map of roleId -> count (how many of each role are selected)
 * @param {Object} rolesData - Optional: the roles data object
 * @returns {Array} Array of role IDs that are selected, sorted by their order
 */
function getAvailableRolesInOrder(selectedRoles, rolesData = null) {
  const data = rolesData || (window.ROLES_DATA && window.ROLES_DATA.roles) || {};

  if (Object.keys(data).length === 0) {
    console.warn('⚠️ No role data available for getAvailableRolesInOrder');
    return [];
  }

  // Get all ordered roles using the new comparison function
  const allOrdered = Object.values(data)
    .sort((a, b) => compareFileNumbers(a._fileNumber || Infinity, b._fileNumber || Infinity))
    .map(role => role.id);

  // Filter to only those that are selected (count > 0)
  return allOrdered.filter(roleId => selectedRoles && selectedRoles[roleId] > 0);
}

// Export for global use
if (typeof window !== 'undefined') {
  window.getOrderedRoleIds = getOrderedRoleIds;
  window.getAvailableRolesInOrder = getAvailableRolesInOrder;
  window.parseFileNumber = parseFileNumber;
  window.compareFileNumbers = compareFileNumbers;
}
