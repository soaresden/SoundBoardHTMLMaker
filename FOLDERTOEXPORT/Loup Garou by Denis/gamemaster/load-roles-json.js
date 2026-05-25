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
        '01-Cupidon', '02-Enfant_Sauvage', '03-Chien_Loup', '04-Petite_Fille', '05-Sorciere',
        '06-Voyante', '07-Corbeau', '08-Voleur', '09-Salvateur', '10-Ancien',
        '11-Juge_Begue', '12-Montreur_Ours', '13-Renard', '14-Servante_Devouee', '15-Loup_Noir',
        '16-Grand_Mechant_Loup', '17-Louveteau', '18-Enfant_Lune', '19-Voyant_Loup', '20-Loup_Blanc',
        '21-Abominable_Sectaire', '22-Joueur_Flute', '23-Chevalier', '24-Enfant_Lune_Chaman', '25-Prophete',
        '26-Dames_Blanches', '27-Fille_Loup', '28-Garcon_Loup', '29-Infecteur', '30-Noctambule',
        '31-Savant_Fou', '32-Infect_Pere_Loups', '33-Grand_Mechant_Loup', '34-Simple_Loup_Garou', '35-Loup_Garou_Voyant',
        '36-Loup_Garou_Blanc', '37-Ermite', '38-Lepreux', '39-Heroe', '40-Sorciere_Blanche',
        '41-Pyromane', '42-Ankou', '43-Berger', '44-Maitre_Jeu', '45-Donneur_Conseil',
        '46-Gitane', '47-Joueur_Flute', '48-Chaman', '49-Villageois_Villageois', '50-Croque_Mort',
        '51-Acrobate', '52-Tete_Brule', '53-Apprenti_Loup', '54-Enfant_Sorciere', '55-Fou_du_Village',
        '56-Marionnettiste', '57-Montreur_Ours'
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
}

// Créer une instance globale
const rolesLoader = new RolesLoader();

// Charger automatiquement au chargement du document
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    rolesLoader.loadAllRoles();
  });
} else {
  // Document déjà chargé
  rolesLoader.loadAllRoles();
}

// Export
if (typeof window !== 'undefined') {
  window.RolesLoader = RolesLoader;
  window.rolesLoader = rolesLoader;
}
