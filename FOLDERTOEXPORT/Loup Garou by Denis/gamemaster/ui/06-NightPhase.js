// ========================================
// 06-NIGHT PHASE
// Gestion des actions nocturnes (Nuits 2+)
// ========================================

// NOTE: Cette module est un wrapper qui réutilise les fonctions existantes
// de gamemaster/phases/06-Night.js pour maintenir la cohérence architecturale

function renderNightPhase(gameUI) {
  // Utiliser la fonction renderNight existante depuis 06-Night.js
  return renderNight(gameUI);
}

function attachNightPhaseEvents(gameUI) {
  // Utiliser la fonction attachNightEvents existante depuis 06-Night.js
  attachNightEvents(gameUI);
}
