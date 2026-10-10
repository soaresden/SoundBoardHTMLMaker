// ========================================
// LISTE UNIFIÉE DES PRÉNOMS DE JOUEURS
// Source initiale : gamemaster/players.txt (1 prénom par ligne).
// - Au démarrage : on lit players.txt -> window.LG_PLAYER_NAMES (+ fallback).
// - Le cache de profils (localStorage) reste la liste de TRAVAIL modifiable et prioritaire.
// - window.reloadPlayerNamesFromTxt() permet de relire le fichier à la demande (bouton).
// ========================================
(function () {
  window.LG_PLAYER_NAMES = window.LG_PLAYER_NAMES || [
    'Denis', 'Cedric', 'Pauline', 'Benoit', 'Risleine',
    'Marine', 'Marion', 'Emmanuel', 'Katy', 'Loris',
    'Thibaut', 'Pierre', 'Anne', 'Sophie', 'Anthony',
    'Leo', 'Nicolas', 'Raphael', 'Thomas', 'Li', 'Ibrahim', 'Mary'
  ];

  function parseNames(txt) {
    if (!txt) return [];
    var names = txt.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    var seen = {}, uniq = [];
    names.forEach(function (n) { if (!seen[n]) { seen[n] = 1; uniq.push(n); } });
    return uniq;
  }

  window.reloadPlayerNamesFromTxt = function () {
    return fetch('gamemaster/players.txt?t=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) {
        var uniq = parseNames(txt);
        if (uniq.length) {
          window.LG_PLAYER_NAMES = uniq;
          console.log('[PlayerNames] OK ' + uniq.length + ' prenoms depuis players.txt');
        }
        return uniq;
      })
      .catch(function () { return []; });
  };

  window.reloadPlayerNamesFromTxt();
})();
