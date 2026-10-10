// ========================================
// 07-MAYOR ELECTION PHASE
// Élection du maire du village
// ========================================

// NOTE: Cette module est un wrapper qui réutilise les fonctions existantes
// de gamemaster/phases/04-MayorElection.js pour maintenir la cohérence architecturale

function renderMayorElectionPhase(gameUI) {
  // Utiliser la fonction renderMayorElection existante depuis 04-MayorElection.js
  return renderMayorElection(gameUI);
}

function attachMayorElectionPhaseEvents(gameUI) {
  // Utiliser la fonction attachMayorElectionEvents existante depuis 04-MayorElection.js
  attachMayorElectionEvents(gameUI);
}
