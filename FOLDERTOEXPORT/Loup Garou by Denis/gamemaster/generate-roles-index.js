#!/usr/bin/env node

/**
 * Script de génération automatique de index.json
 *
 * Scanne le dossier gamemaster/roles/
 * Extrait les roleIds depuis les noms de fichiers
 * Génère automatiquement le fichier index.json
 *
 * Usage: node generate-roles-index.js
 */

const fs = require('fs');
const path = require('path');

const ROLES_DIR = path.join(__dirname, 'roles');
const INDEX_FILE = path.join(ROLES_DIR, 'index.json');

// Fonction pour extraire le roleId depuis le nom du fichier
// Exemples:
//   "01-Cupidon.json" → "Cupidon"
//   "31a-Simple_Loup_Garou.json" → "Simple_Loup_Garou"
//   "98-Petite_Fille.json" → "Petite_Fille"
function extractRoleIdFromFilename(filename) {
  // Remove .json extension
  const nameWithoutExt = filename.replace(/\.json$/, '');

  // Match pattern: digits, optional letter, dash, then role id
  // Examples: "01-Cupidon" → "Cupidon", "31a-Simple_Loup_Garou" → "Simple_Loup_Garou"
  const match = nameWithoutExt.match(/^\d+[a-z]?-(.+)$/i);

  if (match) {
    return match[1];
  }

  return null;
}

// Fonction pour extraire le numéro de fichier
// Exemples: "01-Cupidon" → "01", "31a-Simple_Loup_Garou" → "31a"
function extractFileNumber(filename) {
  const nameWithoutExt = filename.replace(/\.json$/, '');
  const match = nameWithoutExt.match(/^(\d+[a-z]?)-/i);

  if (match) {
    return match[1];
  }

  return null;
}

async function generateIndex() {
  try {
    console.log('📂 Lecture du dossier:', ROLES_DIR);

    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(ROLES_DIR);
    console.log(`✓ ${files.length} fichiers trouvés`);

    // Filtrer et traiter les fichiers JSON (sauf index.json)
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
    console.log(`✓ ${jsonFiles.length} fichiers JSON à traiter (excluant index.json)`);

    if (jsonFiles.length === 0) {
      console.warn('⚠️ Aucun fichier JSON trouvé dans le dossier roles/');
      return;
    }

    // Construire la liste des rôles triée par numéro de fichier
    const rolesList = [];
    const roleIds = new Set();

    for (const filename of jsonFiles) {
      const roleId = extractRoleIdFromFilename(filename);
      const fileNumber = extractFileNumber(filename);

      if (roleId && fileNumber) {
        if (roleIds.has(roleId)) {
          console.warn(`⚠️ Doublon détecté: ${roleId} (fichier: ${filename})`);
          continue;
        }

        roleIds.add(roleId);
        const fileNameWithoutExt = filename.replace(/\.json$/, '');

        rolesList.push({
          id: roleId,
          file: fileNameWithoutExt,
          fileNumber: fileNumber
        });

        console.log(`  ✓ ${roleId.padEnd(30)} ← ${filename}`);
      } else {
        console.warn(`⚠️ Format invalide: ${filename} (doit être: NUMBERletter-RoleId.json)`);
      }
    }

    // Trier par numéro de fichier
    rolesList.sort((a, b) => {
      const aNum = parseInt(a.fileNumber, 10);
      const bNum = parseInt(b.fileNumber, 10);

      if (aNum !== bNum) {
        return aNum - bNum;
      }

      // Si les numéros sont égaux, comparer les lettres
      const aLetter = a.fileNumber.replace(/^\d+/, '');
      const bLetter = b.fileNumber.replace(/^\d+/, '');
      return aLetter.localeCompare(bLetter);
    });

    // Créer l'index
    const index = {
      description: "Index dynamique des fichiers de rôles - Généré automatiquement par generate-roles-index.js",
      totalRoles: rolesList.length,
      roles: rolesList.map(({ id, file }) => ({ id, file }))
    };

    // Écrire le fichier index.json
    fs.writeFileSync(
      INDEX_FILE,
      JSON.stringify(index, null, 2),
      'utf-8'
    );

    console.log('\n✅ Index généré avec succès!');
    console.log(`📄 Fichier: ${INDEX_FILE}`);
    console.log(`📊 Rôles: ${index.totalRoles}`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    process.exit(1);
  }
}

// Exécuter
generateIndex();
