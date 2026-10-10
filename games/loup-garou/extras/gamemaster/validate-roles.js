/**
 * validate-roles.js — Vérifie la cohérence de tous les JSONs de rôles.
 * Lancé automatiquement au démarrage du serveur (voir server.js), ou à la main :
 *   node gamemaster/validate-roles.js
 * N'empêche jamais le serveur de démarrer : affiche des ⚠️ à corriger.
 */
const fs = require('fs');
const path = require('path');

const CAMPS = ['Village', 'Loups', 'Seul'];
const NIGHT_PHASES = ['everyNight', 'everyOtherNight', 'everyOddNight', 'everyNightFrom2', 'everyNightFirst3', 'firstNight', 'afterFirstNight'];
const OTHER_PHASES = ['gameStart', 'onDeath', 'everyDay', 'anyTime', 'gameProgress', 'dayVote', 'onVote', 'none'];
const RENDERERS = ['cupidonLover', 'enfantSauvage', 'chienLoup', 'voyante', 'salvateur', 'renard', 'wolfKill', 'sorciere', 'apprentiSorcier', 'corbeau', 'voleur', 'recognition'];

function validate(rolesDir) {
  const dir = rolesDir || path.join(__dirname, 'roles');
  const files = fs.readdirSync(dir).filter(f => /^\d+[a-z]?-.+\.json$/.test(f) && !f.startsWith('00-'));
  const seen = {};
  let warn = 0;
  const W = (f, msg) => { console.warn('⚠️  [roles] ' + f + ' : ' + msg); warn++; };

  for (const f of files.sort()) {
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch (e) { W(f, 'JSON INVALIDE — ' + e.message); continue; }

    const m = f.match(/^(\d+[a-z]?)-(.+)\.json$/);
    const expectedId = m ? m[2] : null;
    if (d.id !== expectedId) W(f, `id "${d.id}" ≠ nom de fichier (attendu "${expectedId}")`);
    if (seen[d.id]) W(f, `id en DOUBLON avec ${seen[d.id]}`);
    seen[d.id] = f;

    if (typeof d.isWolf !== 'boolean') W(f, 'isWolf manquant (booléen OBLIGATOIRE : le moteur ne doit pas deviner)');
    if (!CAMPS.includes(d.camp)) W(f, `camp "${d.camp}" inconnu (attendu : ${CAMPS.join(' | ')})`);
    if (!d.name) W(f, 'name manquant');
    if (!d.emoji) W(f, 'emoji manquant');

    const na = d.nightActive;
    if (Array.isArray(na) && na.length && !(na.length === 1 && na[0] === 1)) {
      W(f, `nightActive ${JSON.stringify(na)} : utiliser une "phase" (everyNight, everyOtherNight…) — les listes cassent après la nuit 10. Seul [1] est toléré (rôle 1re nuit).`);
    }

    for (const [k, v] of Object.entries(d.actions || {})) {
      if (k === 'mdj_night_actions' || !v || typeof v !== 'object') continue;
      if (v.phase && !NIGHT_PHASES.includes(v.phase) && !OTHER_PHASES.includes(v.phase)) {
        W(f, `action "${k}" : phase "${v.phase}" inconnue`);
      }
    }

    const r = d.ui && d.ui.selectionRenderer;
    if (r !== undefined && r !== null && !RENDERERS.includes(r)) {
      W(f, `ui.selectionRenderer "${r}" inconnu (dispo : ${RENDERERS.join(', ')} — omettre pour le générique)`);
    }
  }

  if (warn === 0) console.log(`✅ [roles] ${files.length} rôles valides — format OK`);
  else console.warn(`⚠️  [roles] ${warn} avertissement(s) sur ${files.length} rôles (voir ci-dessus)`);
  return warn;
}

if (require.main === module) validate();
module.exports = { validate };
