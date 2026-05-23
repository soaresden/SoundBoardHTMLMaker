// ========================================
// LOADER DYNAMIQUE - Charge UNIQUEMENT les rôles sélectionnés depuis JSON
// ========================================
// Cette fonction fusionne les données JSON avec window.ROLES_DATA
// pour une source unique de vérité
// Optimisé: charge seulement les rôles utilisés dans la partie

// Mapping de roleId -> nom du fichier JSON
const ROLE_FILE_MAPPING = {
  'Cupidon': '01-Nuit01-Cupidon',
  'Enfant_Sauvage': '02-DebutPartie-Enfant_Sauvage',
  'Chien_Loup': '03-DebutPartie-Chien_Loup',
  'Abominable_Sectaire': '04-DebutPartie-Abominable_Sectaire',
  'Voyante': '05-ToutesNuits-Voyante',
  'Sorciere': '06-ToutesNuits-Sorciere',
  'Ancien': '07-ToutesNuits-Ancien',
  'Ange': '08-ToutesNuits-Ange',
  'Salvateur': '09-ToutesNuits-Salvateur',
  'Voleur': '10-ToutesNuits-Voleur',
  'Petite_Fille': '11-ToutesNuits-Petite_Fille',
  'Renard': '12-ToutesNuits-Renard',
  'Corbeau': '13-ToutesNuits-Corbeau',
  'Servante_Devouee': '14-ToutesNuits-Servante_Devouee',
  'Joueur_Flute': '15-ToutesNuits-Joueur_Flute',
  'Ankou': '16-ToutesNuits-Ankou',
  'Marionnettiste': '17-ToutesNuits-Marionnettiste',
  'Chaman': '18-ToutesNuits-Chaman',
  'Garde_Du_Corps': '19-ToutesNuits-Garde_Du_Corps',
  'Pretre': '20-ToutesNuits-Pretre',
  'Gitane': '21-ToutesNuits-Gitane',
  'Noctambule': '22-ToutesNuits-Noctambule',
  'Mystique': '23-ToutesNuits-Mystique',
  'Mamie_Grincheuse': '24-ToutesNuits-Mamie_Grincheuse',
  'Fille_Joie': '25-ToutesNuits-Fille_Joie',
  'Comedien': '26-ToutesNuits-Comédien',
  'Necromancien': '27-ToutesNuits-Necromancien',
  'Arnacoeur': '28-ToutesNuits-Arnacoeur',
  'Lapin_Blanc': '29-ToutesNuits-Lapin_Blanc',
  'Tueur_Serie': '30-ToutesNuits-Tueur_Serie',
  'Pyromane': '31-ToutesNuits-Pyromane',
  'Infect_Pere_Loups': '32-ToutesNuits-Infect_Pere_Loups',
  'Grand_Mechant_Loup': '33-ToutesNuits-Grand_Mechant_Loup',
  'Simple_Loup_Garou': '34-ToutesNuits-Simple_Loup_Garou',
  'Loup_Garou_Voyant': '35-ToutesNuits-Loup_Garou_Voyant',
  'Loup_Garou_Blanc': '36-ToutesNuits1sur2-Loup_Garou_Blanc',
  'Tireur': '37-TousLesJours-Tireur',
  'Juge_Begue': '38-UneFoisPartie-Juge_Begue',
  'Chasseur': '39-PostMortem-Chasseur',
  'Chevalier_Epee_Rouille': '40-PostMortem-Chevalier_Epee_Rouille',
  'Fils_Lune': '41-PostMortem-Fils_Lune',
  'Louveteau': '42-PostMortem-Louveteau',
  'Lepreux': '43-PostMortem-Lepreux',
  'Savant_Fou': '44-PostMortem-Savant_Fou',
  'Ange_Dechu': '45-SpecialDeath-Ange_Dechu',
  'Gros_Dur': '46-SpecialDeath-Gros_Dur',
  'Humain_Maudit': '47-SpecialDeath-Humain_Maudit',
  'Porteur_Amulette': '48-SpecialDeath-Porteur_Amulette',
  'Villageois_Villageois': '49-NoAction-Villageois_Villageois',
  'Bouc_Emissaire': '50-NoAction-Bouc_Emissaire',
  'Idiot_Village': '51-NoAction-Idiot_Village',
  'Cultiste': '52-NoAction-Cultiste',
  'Capitaine': '53-NoAction-Capitaine',
  'President': '54-NoAction-President',
  'Deux_Soeurs': '55-NoAction-Deux_Soeurs',
  'Trois_Freres': '56-NoAction-Trois_Freres',
  'Montreur_Ours': '57-NoAction-Montreur_Ours'
};

const CACHE_KEY = 'LoupsGarous_RolesJSON_Cache';
const CACHE_VERSION = 1;

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
        const response = await fetch(`gamemaster/roles/${fileName}.json`);
        if (!response.ok) {
          console.warn(`❌ Impossible de charger ${fileName}.json`);
          continue;
        }
        const roleData = await response.json();

        if (roleData.id) {
          // Fusionner avec window.ROLES_DATA
          if (window.ROLES_DATA && window.ROLES_DATA.roles) {
            window.ROLES_DATA.roles[roleData.id] = {
              ...window.ROLES_DATA.roles[roleData.id],
              ...roleData
            };
          }
          rolesData[roleData.id] = roleData;
          loadedCount++;
          console.log(`✓ ${roleData.id} chargé depuis JSON`);
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
