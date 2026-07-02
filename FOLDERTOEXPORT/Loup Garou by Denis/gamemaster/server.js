#!/usr/bin/env node

/**
 * Serveur local simple pour Loup Garou
 *
 * Lance automatiquement la génération de l'index.json au démarrage
 * Sert les fichiers statiques sur http://localhost:8000
 *
 * Usage: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const ROOT_DIR = path.dirname(__dirname); // Dossier parent de gamemaster/
const ROLES_DIR = path.join(__dirname, 'roles');
const INDEX_FILE = path.join(ROLES_DIR, 'index.json');

// ========== GÉNÉRATION DE L'INDEX ==========
function extractRoleIdFromFilename(filename) {
  const nameWithoutExt = filename.replace(/\.json$/, '');
  const match = nameWithoutExt.match(/^\d+[a-z]?-(.+)$/i);
  return match ? match[1] : null;
}

function extractFileNumber(filename) {
  const nameWithoutExt = filename.replace(/\.json$/, '');
  const match = nameWithoutExt.match(/^(\d+[a-z]?)-/i);
  return match ? match[1] : null;
}

function generateIndex() {
  try {
    console.log('\n🔄 Génération de l\'index des rôles...');

    const files = fs.readdirSync(ROLES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');

    if (jsonFiles.length === 0) {
      console.warn('⚠️ Aucun fichier JSON trouvé dans gamemaster/roles/');
      return;
    }

    const rolesList = [];
    const roleIds = new Set();

    for (const filename of jsonFiles) {
      const roleId = extractRoleIdFromFilename(filename);
      const fileNumber = extractFileNumber(filename);

      if (roleId && fileNumber) {
        if (!roleIds.has(roleId)) {
          roleIds.add(roleId);
          const fileNameWithoutExt = filename.replace(/\.json$/, '');
          rolesList.push({
            id: roleId,
            file: fileNameWithoutExt,
            fileNumber: fileNumber
          });
        }
      }
    }

    // Trier par numéro
    rolesList.sort((a, b) => {
      const aNum = parseInt(a.fileNumber, 10);
      const bNum = parseInt(b.fileNumber, 10);
      if (aNum !== bNum) return aNum - bNum;

      const aLetter = a.fileNumber.replace(/^\d+/, '');
      const bLetter = b.fileNumber.replace(/^\d+/, '');
      return aLetter.localeCompare(bLetter);
    });

    // Créer l'index
    const index = {
      description: "Index dynamique - Généré automatiquement au démarrage du serveur",
      totalRoles: rolesList.length,
      roles: rolesList.map(({ id, file }) => ({ id, file }))
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    console.log(`✅ Index généré: ${rolesList.length} rôles`);
    console.log(`📄 ${INDEX_FILE}\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
  }
}

// ========== SERVEUR HTTP ==========
const server = http.createServer((req, res) => {
  // Gérer les requêtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Décoder le %20 (espaces) et autres caractères encodés, sinon les fichiers
  // contenant des espaces (ex: "Cupidon Firing Arrow.mp3") renvoient un 404.
  try { pathname = decodeURIComponent(pathname); } catch (_) {}

  // Enlever le leading slash
  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }

  // Chercher le fichier
  let filePath = path.join(ROOT_DIR, pathname);

  // Gérer les répertoires (servir index.html)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Sécurité: vérifier que le chemin ne sort pas du répertoire racine
  const realPath = path.resolve(filePath);
  const realRoot = path.resolve(ROOT_DIR);
  if (!realPath.startsWith(realRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Accès refusé');
    return;
  }

  // Servir le fichier
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Fichier non trouvé: ' + pathname);
      return;
    }

    // Déterminer le content-type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    });
    res.end(data);
  });
});

// ========== DÉMARRAGE ==========
generateIndex();

// Validation du format des rôles (avertissements en console, non bloquant)
try { require('./validate-roles.js').validate(ROLES_DIR); }
catch (e) { console.warn('⚠️  validate-roles.js indisponible :', e.message); }

server.listen(PORT, () => {
  console.log(`🚀 Serveur Loup Garou démarré`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📁 Répertoire: ${ROOT_DIR}`);
  console.log(`\nAppuie sur Ctrl+C pour arrêter\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé`);
    process.exit(1);
  } else {
    throw err;
  }
});
