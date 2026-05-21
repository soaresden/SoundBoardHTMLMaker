// ========================================
// DONNÉES DES STATUTS - Loup-Garou
// ========================================
// Chargé avant le GameMaster pour être disponible globalement
// Les statuts sont des modificateurs appliqués à un joueur par d'autres rôles

window.STATUSES_DATA = {
  "statuses": {
    // ========== STATUT AMOUREUX ==========
    "Amoureux": {
      "id": "Amoureux",
      "name": "Amoureux",
      "camp": "ensemble",
      "source": "Cupidon",
      "description": "Lié à une autre personne. Si l'un meurt, l'autre meurt IMMÉDIATEMENT aussi.",
      "icon": "💕",
      "color": "#ff1493",

      // Comportement spécial
      "specialBehavior": "linkedDeath",
      "linkedWith": "partnerName", // ← Sera stocké dans statusData

      // Hook: quand le joueur meurt
      "onPlayerDeath": {
        "type": "linkedDeath",
        "description": "L'amoureux meurt aussi immédiatement"
      },

      // Affichage
      "displayOnTable": true,
      "displayColor": "#ff1493"
    },

    // ========== STATUT CHARME ==========
    "Charmé": {
      "id": "Charmé",
      "name": "Charmé",
      "camp": "neutre",
      "source": "Joueur de flûte",
      "description": "Enchanté par le Joueur de flûte. Peut communiquer avec les autres charmés.",
      "icon": "🎶",
      "color": "#9370db",

      "specialBehavior": "charmCommunication",
      "groupName": "Charmés", // ← Groupe d'action commune

      "onRoleAction": {
        "type": "canCommunicate",
        "allowedWith": "otherCharmed"
      },

      "displayOnTable": true,
      "displayColor": "#9370db"
    },

    // ========== STATUT MODÈLE ==========
    "Modèle": {
      "id": "Modèle",
      "name": "Modèle",
      "camp": "neutre",
      "source": "Enfant sauvage",
      "description": "Idole de l'Enfant sauvage. Si vous mourrez par les Loups, l'Enfant devient Loup.",
      "icon": "⭐",
      "color": "#ffd700",

      "specialBehavior": "transformChild",
      "linkedWith": "childName", // ← Qui est l'Enfant sauvage

      "onPlayerDeathByWolves": {
        "type": "transformLinkedChild",
        "description": "L'Enfant sauvage se transforme en Loup"
      },

      "displayOnTable": true,
      "displayColor": "#ffd700"
    },

    // ========== STATUT INFECTÉ ==========
    "Infecté": {
      "id": "Infecté",
      "name": "Infecté",
      "camp": "loups",
      "source": "Père des loups",
      "description": "Converti en Loup par le Père des loups. Perd votre ancien pouvoir, devient Loup-Garou.",
      "icon": "🐺",
      "color": "#8b0000",

      "specialBehavior": "roleChange",
      "newRole": "Simple_Loup_Garou",
      "losesPreviousPower": true,

      "onStatusApplied": {
        "type": "becomeWolf",
        "description": "Change de camp et devient Loup"
      },

      "displayOnTable": true,
      "displayColor": "#8b0000"
    },

    // ========== STATUT MAIRE ==========
    "Maire": {
      "id": "Maire",
      "name": "Maire",
      "camp": "neutre",
      "source": "Vote du village",
      "description": "Élu Maire par le Village. Possède 2 voix au vote.",
      "icon": "👑",
      "color": "#ff8c00",

      "specialBehavior": "doubleVote",
      "voteModifier": 2, // ← +2 voix

      "onVoting": {
        "type": "multiplyVote",
        "votePower": 2
      },

      "displayOnTable": true,
      "displayColor": "#ff8c00"
    },

    // ========== STATUT GARDE CHAMPÊTRE ==========
    "Garde_Champetre": {
      "id": "Garde_Champetre",
      "name": "Garde Champêtre",
      "camp": "neutre",
      "source": "Maire",
      "description": "Nommé par le Maire comme son bras droit. Prend le rôle de Maire s'il meurt.",
      "icon": "🛡️",
      "color": "#daa520",

      "specialBehavior": "deputyMayor",
      "inheritsFrom": "Maire",

      "onMayorDeath": {
        "type": "becomeNextMayor",
        "description": "Devient automatiquement Maire"
      },

      "displayOnTable": true,
      "displayColor": "#daa520"
    }
  }
};

console.log('[StatusesData] ✓ Statuses data initialized with', Object.keys(window.STATUSES_DATA.statuses).length, 'statuses');
