/**
 * 03-FirstNight-MDJ.js
 *
 * Mode Maître du Jeu Animé (MDJ) - First Night
 *
 * VERSION: 47
 *
 * Layout:
 * - Left: Full-height listbox with role list
 * - Right: Interactive player table with action buttons
 *
 * The MDJ:
 * 1. Sees all players on the right side
 * 2. Selects a role from the left listbox
 * 3. Action buttons appear for that role
 * 4. Clicks on players to apply actions (color lovers, designate idol, etc.)
 * 5. Logs all actions
 */

/**
 * PlayerRegistry - Centralized player data management
 * Handles all player filtering and state queries
 */
class PlayerRegistry {
  constructor(players, deadPlayerIds = new Set()) {
    this.players = players || [];
    this.deadPlayerIds = deadPlayerIds;
  }

  // Get all alive players
  getAlive() {
    return this.players.filter(p => !this.deadPlayerIds.has(p.id));
  }

  // Get all dead players
  getDead() {
    return this.players.filter(p => this.deadPlayerIds.has(p.id));
  }

  // Get all wolf players (alive)
  getWolves(aliveOnly = true) {
    const wolves = this.players.filter(p =>
      p.role && (p.role.includes('Loup') || p.role.includes('Wolf'))
    );
    return aliveOnly ? wolves.filter(p => !this.deadPlayerIds.has(p.id)) : wolves;
  }

  // Get all villagers (alive)
  getVillagers(aliveOnly = true) {
    const villagers = this.players.filter(p =>
      !p.role || (!p.role.includes('Loup') && !p.role.includes('Wolf'))
    );
    return aliveOnly ? villagers.filter(p => !this.deadPlayerIds.has(p.id)) : villagers;
  }

  // Get non-wolves (for wolf kill targets)
  getNonWolves(aliveOnly = true) {
    const nonWolves = this.players.filter(p =>
      !p.role || (!p.role.includes('Loup') && !p.role.includes('Wolf'))
    );
    return aliveOnly ? nonWolves.filter(p => !this.deadPlayerIds.has(p.id)) : nonWolves;
  }

  // Get other wolves (for Loup_Garou_Blanc killing targets)
  getOtherWolves(aliveOnly = true) {
    const wolves = this.players.filter(p =>
      p.role && (p.role.includes('Loup') || p.role.includes('Wolf'))
    );
    return aliveOnly ? wolves.filter(p => !this.deadPlayerIds.has(p.id)) : wolves;
  }

  // Check if player is dead
  isDead(playerId) {
    return this.deadPlayerIds.has(playerId);
  }

  // Check if player is wolf
  isWolf(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return player && (player.role.includes('Loup') || player.role.includes('Wolf'));
  }

  // Get player by ID
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }
}

class FirstNightMDJ {
  constructor(gm, container) {
    this.gm = gm;
    this.container = container;
    this.logger = window.gameLogger;

    // Use rolesLoader if available, otherwise create a wrapper using window functions
    if (window.rolesLoader) {
      this.rolesLoader = window.rolesLoader;
    } else {
      // Create a wrapper using available window functions
      this.rolesLoader = {
        getOrderedRoleIds: () => window.getOrderedRoleIds?.() || [],
        getRole: (roleId) => window.ROLES_DATA?.roles?.[roleId] || null
      };
      console.log('[FirstNightMDJ] ✓ Created rolesLoader wrapper from window functions');
    }

    // Version message
    console.log('VERSION 34');
    console.log('v34: Auto-skip grayed roles + show (immunisé) for protected wolf victims | Greyed roles jump to next action');

    // Debug logging
    console.log('[FirstNightMDJ] Constructor:', {
      gm: !!gm,
      container: !!container,
      logger: !!this.logger,
      rolesLoader: !!this.rolesLoader
    });

    // State
    this.selectedRoleId = null;
    this.selectedPlayers = [];
    this.actionState = {};
    this.roleStates = {}; // Track which roles are completed
    this.deadPlayerIds = new Set(); // Track players who have been killed
    this.deathCauses = {}; // Track cause of death for each dead player (playerId -> cause)
    this.transformations = {}; // Track role transformations (playerId -> {from, to, reason})

    // Initialize PlayerRegistry for centralized player data management
    this.playerRegistry = new PlayerRegistry(this.gm?.state?.players || [], this.deadPlayerIds);

    // Timer state
    this.timerDuration = 5 * 60; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.timerInterval = null;

    // Mayor election tracking
    this.selectedMayorId = null; // Player selected during election UI
    this.mayorId = null; // Elected mayor (null if none)
    this.mayorElectionCompleted = false; // Flag: has mayor election been completed?

    // CRITICAL: Chasseur has only ONE shot for the entire game
    this.chasseurHasShot = false; // Track if Chasseur has already used his revenge shot

    // Chevalier curse tracking (wolf dies NEXT night, not immediately)
    this.chevalierCursedWolfId = null; // ID of wolf cursed by Chevalier (dies next night)

    // Salvateur protection tracking (can't protect same person 2 nights in a row)
    this.lastSalvateurProtected = null; // Track last protected player to prevent consecutive protection

    // Renard power loss tracking
    this.renardDetectedWolves = null; // Track if Renard detected wolves on Night 1 (loses power if not)

    // Sorcière potion tracking (she has 2 potions total: 1 life, 1 death)
    this.sorcierePotionsUsed = 0; // Increment when used (poison or resurrect) — max 2

    // Voting phase tracking
    this.selectedLynchVictimId = null; // Player selected for lynch vote

    // Night phase tracking
    this.currentNight = 1; // Track which night we're on (1, 2, 3, ...)

    // Initialize role states
    this.initializeRoleStates();

    // CRITICAL: Store reference to this MDJ instance so other phases can reuse processLynch()
    this.gm.mdj = this;
    console.log('[FirstNightMDJ] ✓ Stored MDJ instance in gm.mdj for all phases');
  }
}

// Expose immediately so prototype-augmenting modules can attach
window.FirstNightMDJ = FirstNightMDJ;
