// ========================================
// LOADER DYNAMIQUE - Charge UNIQUEMENT les rôles sélectionnés depuis JSON
// ========================================
// Cette fonction fusionne les données JSON avec window.ROLES_DATA
// pour une source unique de vérité
// Optimisé: charge seulement les rôles utilisés dans la partie

// Mapping de roleId -> nom du fichier JSON
// IMPORTANT: Ce mapping est construit dynamiquement depuis gamemaster/roles/index.json
// Pour ajouter/modifier des rôles, édite simplement le fichier d'index
let ROLE_FILE_MAPPING = {
  'Cupidon': '01-Cupidon',
  'Enfant_Sauvage': '02-Enfant_Sauvage',
  'Chien_Loup': '03-Chien_Loup',
  'Abominable_Sectaire': '04-Abominable_Sectaire',
  'Voyante': '05-Voyante',
  'Ancien': '07-Ancien',
  'Ange': '08-Ange',
  'Salvateur': '09-Salvateur',
  'Voleur': '10-Voleur',
  'Renard': '12-Renard',
  'Corbeau': '97-Corbeau',
  'Servante_Devouee': '14-Servante_Devouee',
  'Joueur_Flute': '15-Joueur_Flute',
  'Ankou': '16-Ankou',
  'Marionnettiste': '17-Marionnettiste',
  'Chaman': '18-Chaman',
  'Garde_Du_Corps': '19-Garde_Du_Corps',
  'Pretre': '20-Pretre',
  'Gitane': '21-Gitane',
  'Noctambule': '22-Noctambule',
  'Mystique': '23-Mystique',
  'Mamie_Grincheuse': '24-Mamie_Grincheuse',
  'Fille_Joie': '25-Fille_Joie',
  'Comedien': '26-Comedien',
  'Necromancien': '27-Necromancien',
  'Arnacoeur': '28-Arnacoeur',
  'Lapin_Blanc': '29-Lapin_Blanc',
  'Tueur_Serie': '30-Tueur_Serie',
  'Pyromane': '31-Pyromane',
  'Infect_Pere_Loups': '32-Infect_Pere_Loups',
  'Grand_Mechant_Loup': '33-Grand_Mechant_Loup',
  'Simple_Loup_Garou': '31a-Simple_Loup_Garou',
  'Loup_Garou_Voyant': '35-Loup_Garou_Voyant',
  'Loup_Garou_Blanc': '36-Loup_Garou_Blanc',
  'Tireur': '37-Tireur',
  'Juge_Begue': '38-Juge_Begue',
  'Chasseur': '39-Chasseur',
  'Chevalier_Epee_Rouille': '40-Chevalier_Epee_Rouille',
  'Fils_Lune': '41-Fils_Lune',
  'Louveteau': '42-Louveteau',
  'Sorciere': '43-Sorciere',
  'Lepreux': '44-Lepreux',
  'Savant_Fou': '45-Savant_Fou',
  'Ange_Dechu': '46-Ange_Dechu',
  'Gros_Dur': '47-Gros_Dur',
  'Humain_Maudit': '48-Humain_Maudit',
  'Porteur_Amulette': '49-Porteur_Amulette',
  'Bouc_Emissaire': '51-Bouc_Emissaire',
  'Idiot_Village': '52-Idiot_Village',
  'Cultiste': '53-Cultiste',
  'Capitaine': '54-Capitaine',
  'President': '55-President',
  'Deux_Soeurs': '56-Deux_Soeurs',
  'Trois_Freres': '57-Trois_Freres',
  'Montreur_Ours': '58-Montreur_Ours',
  'Petite_Fille': '98-Petite_Fille',
  'Villageois': '99-Villageois'
};

const CACHE_KEY = 'LoupsGarous_RolesJSON_Cache';
const CACHE_VERSION = 6;

// ========== CHARGER LE MAPPING DYNAMIQUEMENT DEPUIS L'INDEX ==========
async function loadRolesIndexDynamically() {
  try {
    console.log('[LoadRolesJSON] 📂 Tentative de chargement de gamemaster/roles/index.json...');
    console.log('[LoadRolesJSON] URL complète:', new URL('gamemaster/roles/index.json', window.location.href).href);
    const response = await fetch('./gamemaster/roles/index.json?t=' + Date.now());
    console.log('[LoadRolesJSON] Réponse:', response.status, response.statusText);

    if (!response.ok) {
      console.warn(`[LoadRolesJSON] ⚠️ Impossible de charger index.json: ${response.status} ${response.statusText}`);
      console.warn('[LoadRolesJSON] Utilisation du mapping hardcodé');
      return false;
    }

    const indexData = await response.json();
    console.log('[LoadRolesJSON] Index JSON chargé:', indexData);

    if (indexData.roles && Array.isArray(indexData.roles)) {
      // Construire le mapping à partir de l'index
      ROLE_FILE_MAPPING = {};
      indexData.roles.forEach(role => {
        if (role.id && role.file) {
          ROLE_FILE_MAPPING[role.id] = role.file;
        }
      });
      console.log(`[LoadRolesJSON] ✓ Mapping des rôles chargé dynamiquement depuis index.json (${Object.keys(ROLE_FILE_MAPPING).length} rôles)`);
      console.log('[LoadRolesJSON] Exemples:', {
        'Simple_Loup_Garou': ROLE_FILE_MAPPING['Simple_Loup_Garou'],
        'Villageois': ROLE_FILE_MAPPING['Villageois'],
        'Petite_Fille': ROLE_FILE_MAPPING['Petite_Fille']
      });
      return true;
    } else {
      console.warn('[LoadRolesJSON] ⚠️ Format d\'index.json invalide');
      return false;
    }
  } catch (error) {
    console.error('[LoadRolesJSON] ❌ Erreur lors du chargement de index.json:', error);
  }
  return false;
}

// Restaurer depuis le cache IMMÉDIATEMENT (synchrone)
function restoreCacheSync() {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const cached = JSON.parse(cachedData);
      if (cached.version === CACHE_VERSION && cached.rolesData && window.ROLES_DATA && window.ROLES_DATA.roles) {
        Object.assign(window.ROLES_DATA.roles, cached.rolesData);
        console.log('✓ Cache restauré synchronement');
        return true;
      }
    }
  } catch (e) {
    console.warn('Erreur lors de la restauration du cache:', e);
  }
  return false;
}

// Restaurer le cache dès que possible
restoreCacheSync();

// ========== CHARGER L'INDEX ET TOUS LES RÔLES AU DÉMARRAGE ==========
// IMPORTANT: loadRolesIndexDynamically DOIT se terminer AVANT loadAllRolesAtStartup
async function initializeRolesSystem() {
  // Étape 1: Charger le mapping dynamique depuis index.json
  await loadRolesIndexDynamically();

  // Étape 2: Une fois le mapping prêt, charger tous les rôles
  await loadAllRolesAtStartup();
}

// Lancer l'initialisation au démarrage du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRolesSystem);
} else {
  // DOM déjà chargé
  initializeRolesSystem().catch(err => console.error('Erreur lors de l\'initialisation:', err));
}

// ========== FONCTION DE RECHARGEMENT DU CACHE ==========
function reloadJsonCache() {
  console.log('🔄 Vidage du cache localStorage...');
  localStorage.removeItem('LoupsGarous_RolesJSON_Cache');
  console.log('✓ Cache vidé. Rechargement de la page...');
  location.reload();
}

// Fonction helper: obtenir le chemin de l'image d'un rôle
function getRoleImagePath(roleId) {
  const fileName = ROLE_FILE_MAPPING[roleId] || roleId;
  return `gamemaster/roles/${fileName}.png`;
}

// Exposer globalement pour accès console
if (typeof window !== 'undefined') {
  window.reloadJsonCache = reloadJsonCache;
  window.getRoleImagePath = getRoleImagePath;
  window.ROLE_FILE_MAPPING = ROLE_FILE_MAPPING;
}

// ========== CHARGER TOUS LES RÔLES AU DÉMARRAGE ==========
// Pour que CardSelection affiche les bons textes dès le départ
async function loadAllRolesAtStartup() {
  const allRoleIds = Object.keys(ROLE_FILE_MAPPING);
  console.log(`[LoadRolesJSON] Chargement de tous les ${allRoleIds.length} rôles...`);
  await loadSelectedRolesFromJSON(allRoleIds);
  console.log(`[LoadRolesJSON] ✓ Tous les rôles chargés. Re-render UI.`);

  // Après le chargement, re-render l'UI si elle existe déjà
  // Cela résout la race condition où CardSelection était vide si elle rendait avant que les rôles soient chargés
  if (window.gameUI && window.gameUI.render) {
    console.log('[LoadRolesJSON] Calling gameUI.render() to display loaded roles');
    window.gameUI.render();
  }
}

// NOTE: loadAllRolesAtStartup est maintenant appelé depuis initializeRolesSystem() ci-dessus
// qui s'assure que loadRolesIndexDynamically() a d'abord terminé

// Fonction principale: charger UNIQUEMENT les rôles sélectionnés
async function loadSelectedRolesFromJSON(selectedRoleIds) {
  if (!selectedRoleIds || selectedRoleIds.length === 0) {
    console.log('ℹ️ Aucun rôle sélectionné à charger');
    return;
  }

  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    let cachedRoles = {};

    // Charger les rôles en cache s'ils existent
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        if (cached.version === CACHE_VERSION && cached.rolesData) {
          cachedRoles = cached.rolesData;
        }
      } catch (e) {
        // Cache invalide, ignore
      }
    }

    const rolesData = { ...cachedRoles };
    let loadedCount = 0;
    const neededRoles = [];

    // Identifier les rôles à charger
    for (const roleId of selectedRoleIds) {
      // Ignorer le modèle de référence (00-template.json est du JSONC commenté, non chargeable)
      if (roleId === 'template' || /^00-template/i.test(ROLE_FILE_MAPPING[roleId] || '')) continue;
      if (!rolesData[roleId]) {
        // Rôle pas en cache - à fetcher
        neededRoles.push(roleId);
      }
    }

    // Charger les rôles manquants depuis les fichiers JSON
    for (const roleId of neededRoles) {
      const fileName = ROLE_FILE_MAPPING[roleId];
      if (!fileName) {
        console.warn(`⚠️ Pas de fichier JSON trouvé pour ${roleId}`);
        continue;
      }

      try {
        const response = await fetch(`./gamemaster/roles/${fileName}.json?t=${Date.now()}`);
        if (!response.ok) {
          console.warn(`❌ Impossible de charger ${fileName}.json`);
          continue;
        }
        const roleData = await response.json();

        if (roleData.id) {
          // Extraire le numéro du nom du fichier supportant format alphanumérique
          // Exemples: "01-Cupidon" → "01", "31a-Simple_Loup_Garou" → "31a"
          const fileMatch = fileName.match(/^(\d+[a-z]?)/i);
          const fileNumber = fileMatch ? fileMatch[1] : '999';
          roleData._fileNumber = fileNumber;

          // Fusionner avec window.ROLES_DATA
          if (window.ROLES_DATA && window.ROLES_DATA.roles) {
            window.ROLES_DATA.roles[roleData.id] = {
              ...window.ROLES_DATA.roles[roleData.id],
              ...roleData
            };
          }
          rolesData[roleData.id] = roleData;
          loadedCount++;
          console.log(`✓ ${roleData.id} chargé depuis JSON (file #${fileNumber})`);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de ${fileName}:`, error);
      }
    }

    // Sauvegarder le cache mis à jour
    if (loadedCount > 0) {
      try {
        const cacheData = {
          version: CACHE_VERSION,
          timestamp: new Date().toISOString(),
          rolesData: rolesData
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log(`✓ Cache mis à jour (${loadedCount} nouveaux rôles)`);
      } catch (e) {
        console.warn('Impossible de sauvegarder le cache:', e);
      }
    }

    console.log(`✓ Rôles sélectionnés chargés: ${selectedRoleIds.join(', ')}`);
  } catch (error) {
    console.error('Erreur lors du chargement des rôles JSON:', error);
  }
}

// Exposer la fonction globalement pour l'appeler quand les rôles sont sélectionnés
window.loadSelectedRolesFromJSON = loadSelectedRolesFromJSON;
