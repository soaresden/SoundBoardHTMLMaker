/* English (original version) texts — overlays the French fields when MGS_LANG === 'en'.
   Only the display labels change; file names stay as they are (some voice clips are French recordings,
   their labels give the meaning of the line). */
(function () {
  if (window.MGS_LANG !== 'en' || !window.MGS_SOUNDS) return;
  // French label → English label (exact match)
  const L = {
    "00-Brief Jeu": "00-Game Brief",
    "Déplacements & objets": "Movement & items",
    "🐾 Pas (rampé) 1": "🐾 Footsteps (crawl) 1",
    "🐾 Pas (rampé) 2": "🐾 Footsteps (crawl) 2",
    "🏃 Course 1": "🏃 Running 1",
    "🏃 Course 2": "🏃 Running 2",
    "💧 Dans l'eau": "💧 In the water",
    "🧱 Dos au mur": "🧱 Back to the wall",
    "🚪 Porte": "🚪 Door",
    "🛗 Appel ascenseur": "🛗 Elevator call",
    "✨ Objet apparaît": "✨ Item appears",
    "📡 Brouillage chaff": "📡 Chaff jamming",
    "📹 Caméra pivote": "📹 Camera turns",
    "📹 Caméra te repère": "📹 Camera spots you",
    "✅ Fin d'alerte": "✅ Alert cleared",
    "Gardes": "Guards",
    "Dégâts": "Damage",
    "🐍 « Des caméras… »": "🐍 \"Cameras…\"",
    "🔫 Meryl : « pas une bleue »": "🔫 Meryl: \"not a rookie\"",
    "🗣️ Degaine": "🗣️ Draw",
    "🗣️ Inutile de te cacher": "🗣️ No use hiding",
    "🗣️ Odeur Mort": "🗣️ Smell of death",
    "💀 Ocelot vaincu": "💀 Ocelot defeated",
    "😈 Rire du tank": "😈 Tank laughs",
    "💥 Tank touché": "💥 Tank hit",
    "🗣️ Un fantome": "🗣️ A ghost",
    "🗣️ Bouge pas": "🗣️ Don't move",
    "🗣️ Fais moi sentir vivant": "🗣️ Make me feel alive",
    "🗣️ Combat roi": "🗣️ King of combat",
    "🗣️ Os et tendons": "🗣️ Bone and sinew",
    "🗣️ Comme dans le temps": "🗣️ Like old times",
    "🗣️ C'est bon snake": "🗣️ That's good, Snake",
    "🗣️ Frappe encore": "🗣️ Hit me again",
    "🗣️ Encore": "🗣️ More",
    "🗣️ C'est ca": "🗣️ That's it",
    "🗣️ J'ai attendu cette douleur": "🗣️ I've waited for this pain",
    "🗣️ C'est bien snake": "🗣️ Good, Snake",
    "🗣️ Bouge et attrape moi": "🗣️ Move and catch me",
    "🗣️ Je suis la": "🗣️ I'm here",
    "🗣️ Ton passe": "🗣️ Your past",
    "🗣️ Tu doutes de moi": "🗣️ You doubt me",
    "🗣️ Comme dans un livre ouvert": "🗣️ Like an open book",
    "🗣️ Cervelle arrete": "🗣️ Brain, stop",
    "🗣️ Nooon pas possible": "🗣️ Nooo, impossible",
    "🗣️ Pourquoi les pensee": "🗣️ Why these thoughts",
    "💀 Mantis vaincu": "💀 Mantis defeated",
    "🗣️ Pas mal": "🗣️ Not bad",
    "🗣️ Prends ca": "🗣️ Take that",
    "🗣️ Snake hurt pas bien": "🗣️ Snake hurt (bad)",
    "💀 Hind abattu": "💀 Hind shot down",
    "🦅 Raven : intro": "🦅 Raven: intro",
    "🔑 PAL normale": "🔑 PAL normal",
    "🧊 PAL froide": "🧊 PAL cold",
    "🔥 PAL chaude": "🔥 PAL hot",
    "🗣️ « Not yet, Snake! »": "🗣️ \"Not yet, Snake!\"",
    "💀 Liquid vaincu": "💀 Liquid defeated",
  };
  const S = window.MGS_SOUNDS;
  // lists of [file, label]: only index 1 (the label) is replaced
  const pairs = list => (list || []).forEach(p => { if (Array.isArray(p) && L[p[1]] != null) p[1] = L[p[1]]; });
  pairs(S.setup);
  pairs(S.alert);
  (S.groups || []).forEach(g => { if (L[g.t] != null) g.t = L[g.t]; pairs(g.sfx); });
  Object.keys(S.stages || {}).forEach(k => {
    const st = S.stages[k];
    ['music', 'sfx', 'voices', 'cues'].forEach(f => pairs(st[f]));
  });
})();
