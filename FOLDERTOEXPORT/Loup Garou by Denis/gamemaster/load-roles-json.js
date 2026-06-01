/**
 * Load Roles JSON
 *
 * Charge tous les fichiers JSON des rôles et crée window.ROLES_DATA
 */

class RolesLoader {
  constructor() {
    this.roles = {};
    this.loading = false;
    this.loaded = false;
  }

  /**
   * Charge tous les rôles
   */
  async loadAllRoles() {
    if (this.loading) return;
    if (this.loaded) return;

    this.loading = true;

    try {
      // Liste de tous les rôles (57 total)
      const roleFiles = [
        '01-Cupidon', '02-Enfant_Sauvage', '03-Chien_Loup', '04-Abominable_Sectaire', '05-Voyante',
        '06-Sorciere', '07-Ancien', '08-Ange', '09-Salvateur', '10-Voleur',
        '11-Petite_Fille', '12-Renard', '13-Corbeau', '14-Servante_Devouee', '15-Joueur_Flute',
        '16-Ankou', '17-Marionnettiste', '18-Chaman', '19-Garde_Du_Corps', '20-Pretre',
        '21-Gitane', '22-Noctambule', '23-Mystique', '24-Mamie_Grincheuse', '25-Fille_Joie',
        '26-Comedien', '27-Necromancien', '28-Arnacoeur', '29-Lapin_Blanc', '30-Tueur_Serie',
        '31-Pyromane', '32-Infect_Pere_Loups', '33-Grand_Mechant_Loup', '34-Simple_Loup_Garou', '35-Loup_Garou_Voyant',
        '36-Loup_Garou_Blanc', '37-Tireur', '38-Juge_Begue', '39-Chasseur', '40-Chevalier_Epee_Rouille',
        '41-Fils_Lune', '42-Louveteau', '43-Lepreux', '44-Savant_Fou', '45-Ange_Dechu',
        '46-Gros_Dur', '47-Humain_Maudit', '48-Porteur_Amulette', '49-Villageois', '50-Bouc_Emissaire',
        '51-Idiot_Village', '52-Cultiste', '53-Capitaine', '54-President', '55-Deux_Soeurs',
        '56-Trois_Freres', '57-Montreur_Ours'
      ];

      // Charger chaque rôle
      for (const roleFile of roleFiles) {
        try {
          const response = await fetch(`gamemaster/roles/${roleFile}.json`);
          if (response.ok) {
            const roleData = await response.json();
            const roleId = roleData.id;
            this.roles[roleId] = roleData;
          } else {
            console.warn(`⚠️ Impossible de charger ${roleFile}.json`);
          }
        } catch (e) {
          console.warn(`⚠️ Erreur chargement ${roleFile}.json:`, e);
        }
      }

      this.loaded = true;
      this.loading = false;

      // Créer window.ROLES_DATA
      window.ROLES_DATA = {
        roles: this.roles,
        count: Object.keys(this.roles).length,
        loadedAt: new Date().toISOString()
      };

      console.log(`✅ [RolesLoader] ${window.ROLES_DATA.count}/57 rôles chargés`);

      return window.ROLES_DATA;
    } catch (e) {
      console.error('❌ Erreur dans loadAllRoles:', e);
      this.loading = false;
      throw e;
    }
  }

  /**
   * Charge un rôle spécifique
   */
  async loadRole(roleId) {
    if (this.roles[roleId]) {
      return this.roles[roleId];
    }

    try {
      const response = await fetch(`gamemaster/roles/${roleId}.json`);
      if (response.ok) {
        const roleData = await response.json();
        this.roles[roleId] = roleData;
        return roleData;
      }
    } catch (e) {
      console.error(`❌ Erreur chargement rôle ${roleId}:`, e);
    }

    return null;
  }

  /**
   * Retourne tous les rôles
   */
  getRoles() {
    return this.roles;
  }

  /**
   * Retourne un rôle par ID
   */
  getRole(roleId) {
    return this.roles[roleId] || null;
  }

  /**
   * Retourne tous les rôles d'un camp
   */
  getRolesByCamp(camp) {
    return Object.values(this.roles).filter(r => r.camp === camp);
  }

  /**
   * Retourne les rôles ordonnés par leur champ "order" depuis les JSONs
   * @returns {Array} Array of role IDs sorted by their order field
   */
  getOrderedRoleIds() {
    return Object.values(this.roles)
      .sort((a, b) => (a.order || Infinity) - (b.order || Infinity))
      .map(role => role.id);
  }
}

// Créer une instance globale
let rolesLoader = null;

try {
  console.log('[RolesLoader] Creating instance...');
  rolesLoader = new RolesLoader();
  console.log('[RolesLoader] Instance created successfully');

  // Charger automatiquement au chargement du document
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[RolesLoader] Loading roles on DOMContentLoaded...');
      rolesLoader.loadAllRoles();
    });
  } else {
    // Document déjà chargé
    console.log('[RolesLoader] Document already loaded, loading roles immediately...');
    rolesLoader.loadAllRoles();
  }
} catch (e) {
  console.error('[RolesLoader] ❌ Error during initialization:', e);
}

// Export
if (typeof window !== 'undefined') {
  window.RolesLoader = RolesLoader;
  if (rolesLoader) {
    window.rolesLoader = rolesLoader;
    console.log('[RolesLoader] ✓ Exposed to window');
  } else {
    console.error('[RolesLoader] ❌ rolesLoader is null, cannot expose to window');
  }
}
