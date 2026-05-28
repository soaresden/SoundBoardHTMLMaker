/**
 * Get Ordered Roles Utility
 *
 * Dynamically retrieves role ordering from loaded JSON role data
 * instead of using hardcoded arrays
 */

/**
 * Get all role IDs sorted by their "order" field from JSON configs
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
    .sort((a, b) => (a._fileNumber || Infinity) - (b._fileNumber || Infinity))
    .map(role => role.id);
}

/**
 * Get available roles in order (only roles that are actually selected in the game)
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

  // Get all ordered roles
  const allOrdered = Object.values(data)
    .sort((a, b) => (a._fileNumber || Infinity) - (b._fileNumber || Infinity))
    .map(role => role.id);

  // Filter to only those that are selected (count > 0)
  return allOrdered.filter(roleId => selectedRoles && selectedRoles[roleId] > 0);
}

// Export for global use
if (typeof window !== 'undefined') {
  window.getOrderedRoleIds = getOrderedRoleIds;
  window.getAvailableRolesInOrder = getAvailableRolesInOrder;
}
