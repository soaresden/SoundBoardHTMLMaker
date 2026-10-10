/**
 * Script to add nightActive flags to all role JSON files
 * Automatically determines which nights each role acts
 */

const fs = require('fs');
const path = require('path');

const rolesDir = './gamemaster/roles/';

// Define which nights each role acts
const nightActiveMap = {
  // First night only
  'Cupidon': [1],
  'Enfant_Sauvage': [1],
  'Chien_Loup': [1],

  // All nights
  'Voyante': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Salvateur': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Renard': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Sorciere': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Corbeau': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

  // All wolves - all nights
  'Simple_Loup_Garou': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Grand_Mechant_Loup': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Loup_Garou_Blanc': [2, 4, 6, 8, 10],  // Even nights only
  'Loup_Garou_Voyant': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

  // Special night-active roles
  'Louveteau': [2, 4, 6, 8, 10],  // Even nights (bonus kill)
  'Fils_Lune': [2, 4, 6, 8, 10],  // Even nights (bonus kill)

  // Other roles: no night action (will be grayed out)
  // Villageois, Chasseur, Chevalier, etc. don't have night actions
};

// Process all JSON files in roles directory
const files = fs.readdirSync(rolesDir).filter(f => f.endsWith('.json'));

let modified = 0;
let skipped = 0;

files.forEach(file => {
  if (file === 'index.json') {
    skipped++;
    return;
  }

  const filePath = path.join(rolesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let data = JSON.parse(content);

  // Check if role has a nightActive entry in the map
  const nightActive = nightActiveMap[data.id];

  if (nightActive) {
    // Add or update the nightActive field
    data.nightActive = nightActive;

    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ ${data.id}: nights ${nightActive.join(', ')}`);
    modified++;
  } else {
    // Role has no night actions (will be grayed out on all nights)
    // Don't add nightActive field - empty array means no nights
    if (!data.nightActive) {
      console.log(`○ ${data.id}: no night actions`);
    } else {
      console.log(`✓ ${data.id}: nights ${data.nightActive.join(', ')}`);
      modified++;
    }
  }
});

console.log(`\n✓ Modified: ${modified} files`);
console.log(`○ Skipped: ${skipped + (files.length - modified - skipped)} files without night actions`);
