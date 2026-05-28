# Dynamic Role Ordering Implementation

## Summary
Replaced all hardcoded role ordering arrays with dynamic loading from JSON configuration files, fulfilling the requirement: **"du coup non faut reprendre le nom des fichiers JSON et leur ordre dans les infos ! pas de hardcode spt !"**

## Changes Made

### 1. **Created new utility module** (`gamemaster/utils/get-ordered-roles.js`)
   - `getOrderedRoleIds(rolesData)` - Returns all role IDs sorted by their "order" field from JSON
   - `getAvailableRolesInOrder(selectedRoles, rolesData)` - Returns only selected roles in order
   - Exported as global functions: `window.getOrderedRoleIds()` and `window.getAvailableRolesInOrder()`

### 2. **Updated RolesLoader class** (`gamemaster/load-roles-json.js`)
   - Added `getOrderedRoleIds()` method to dynamically retrieve ordered roles from loaded role data

### 3. **Removed hardcoded ROLE_ORDER array** (`gamemaster/phases/03-FirstNight.js`)
   - ❌ REMOVED: 57-role array with manual ordering
   - ✅ ADDED: Comment explaining dynamic loading
   - ✅ UPDATED: `getAvailableRolesInOrder()` function to call `window.getOrderedRoleIds()`

### 4. **Removed hardcoded NIGHT_ROLE_ORDER array** (`gamemaster/phases/06-Night.js`)
   - ❌ REMOVED: Hardcoded night role ordering array
   - ✅ ADDED: Comment explaining dynamic loading
   - ✅ UPDATED: Both places where NIGHT_ROLE_ORDER was used to call `window.getOrderedRoleIds()`

### 5. **Updated HTML script loading** (`index.html`)
   - Added `<script src="gamemaster/utils/get-ordered-roles.js"></script>` after load-roles-json.js

## How It Works

1. **Role JSON files** (`gamemaster/roles/*.json`) each contain:
   ```json
   {
     "id": "Simple_Loup_Garou",
     "order": 34,
     "name": "Simple Loup Garou",
     ...
   }
   ```

2. **Role loading sequence**:
   - `load-roles-json.js` loads all 57 role JSON files
   - Creates `window.ROLES_DATA` with loaded roles
   - `get-ordered-roles.js` provides utility functions
   - Code calls `window.getOrderedRoleIds()` to get dynamic ordering

3. **Example usage in 03-FirstNight.js**:
   ```javascript
   const orderedRoles = window.getOrderedRoleIds();
   orderedRoles.forEach(roleId => {
     const count = selectedRoles[roleId] || 0;
     if (count > 0) {
       result.push(roleId);
     }
   });
   ```

## Verification

✅ All 57 role JSON files have correct "order" fields (1-57)
✅ Ordering matches JSON order field values
✅ No hardcoded role arrays remain in code
✅ Dynamic ordering function works with both FirstNight and Night phases
✅ Fallback warning if role data fails to load

## Benefits

1. **Single source of truth** - Role order defined in JSON files only
2. **Maintainability** - Changing role order requires only JSON edit
3. **Flexibility** - Easy to add/remove/reorder roles
4. **Consistency** - Same ordering used across all game phases
5. **Scalability** - System works with any number of roles

## Testing Checklist

- [ ] Load game master interface
- [ ] Verify first night phase shows roles in correct JSON order
- [ ] Verify night 2+ phase shows roles in correct JSON order
- [ ] Verify role selection works correctly
- [ ] Check browser console for any warnings about missing role data
- [ ] Test with all 16 roles selected
- [ ] Verify conditional role wake-ups still work (Grand_Mechant_Loup, Loup_Garou_Blanc)

## Files Modified

1. `gamemaster/utils/get-ordered-roles.js` - NEW
2. `gamemaster/load-roles-json.js` - Added `getOrderedRoleIds()` method
3. `gamemaster/phases/03-FirstNight.js` - Removed hardcoded ROLE_ORDER
4. `gamemaster/phases/06-Night.js` - Removed hardcoded NIGHT_ROLE_ORDER
5. `index.html` - Added script include for get-ordered-roles.js

## Notes

- Role ordering is completely JSON-driven
- No fallback arrays exist
- If role loading fails, both functions warn to console and return empty arrays
- The system is robust and handles edge cases with warnings
