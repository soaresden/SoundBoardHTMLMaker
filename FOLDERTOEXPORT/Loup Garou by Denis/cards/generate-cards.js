// Script pour générer les cartes SVG des rôles
// À exécuter une fois pour créer tous les fichiers

const roles = {
  // VILLAGEOIS
  'Villageois': { icon: '👨', color: '#6bcb77', bg: '#e8f7f0' },
  'Voyante': { icon: '🔮', color: '#7b4397', bg: '#f0e8f7' },
  'Chasseur': { icon: '🏹', color: '#c77dff', bg: '#f5e8ff' },
  'Sorcière': { icon: '🧙‍♀️', color: '#9d4edd', bg: '#ede7f6' },
  'Cupidon': { icon: '💘', color: '#ff006e', bg: '#ffe8f0' },
  'Petite-Fille': { icon: '👧', color: '#ff9500', bg: '#fff5e8' },
  'Ancien': { icon: '👴', color: '#8ecae6', bg: '#e8f5ff' },
  'Paysan': { icon: '👨‍🌾', color: '#76b041', bg: '#f0f8e8' },
  'Renard': { icon: '🦊', color: '#d4894a', bg: '#fef0e8' },
  'Bouc-Émissaire': { icon: '🐐', color: '#6c757d', bg: '#f0f0f0' },
  'Vivandière': { icon: '⚕️', color: '#198754', bg: '#e8f5f0' },
  'Idiot': { icon: '🤪', color: '#ffc300', bg: '#fff8e8' },
  'Comte': { icon: '🎩', color: '#523a3a', bg: '#f5f5f5' },

  // LOUPS
  'Loup-Garou': { icon: '🐺', color: '#d32f2f', bg: '#ffe8e8' },
  'Grand-Méchant-Loup': { icon: '🐺👑', color: '#b71c1c', bg: '#ffcccc' },
  'Loup-Blanc': { icon: '⚪🐺', color: '#757575', bg: '#f0f0f0' },

  // SPÉCIAUX
  'Enfant-Sauvage': { icon: '👦', color: '#ff5722', bg: '#ffeee8' },
  'Mariés': { icon: '💑', color: '#e91e63', bg: '#fce4ec' },
};

function generateCardSVG(roleId, role) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="280" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="280" fill="${role.bg}" stroke="${role.color}" stroke-width="2" rx="8"/>

  <!-- Border -->
  <rect width="200" height="280" fill="none" stroke="${role.color}" stroke-width="3" rx="8" opacity="0.5"/>

  <!-- Decorative top -->
  <rect width="200" height="40" fill="${role.color}" opacity="0.1" rx="8 8 0 0"/>

  <!-- Icon -->
  <text x="100" y="90" font-size="56" text-anchor="middle" dominant-baseline="middle">
    ${role.icon}
  </text>

  <!-- Role Name -->
  <text x="100" y="150" font-size="18" font-weight="bold" text-anchor="middle"
        fill="${role.color}" font-family="Poppins, sans-serif">
    ${roleId}
  </text>

  <!-- Decorative bottom -->
  <circle cx="50" cy="260" r="3" fill="${role.color}" opacity="0.5"/>
  <circle cx="100" cy="260" r="3" fill="${role.color}" opacity="0.5"/>
  <circle cx="150" cy="260" r="3" fill="${role.color}" opacity="0.5"/>
</svg>`;
}

// Exporter pour Node.js ou usage manuel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { roles, generateCardSVG };
}
