/* Langue de l'assistant / du guide MGS : français ou anglais (VO).
   Choix mémorisé (localStorage « mgs.lang ») ; sinon français si le navigateur est en français, anglais ailleurs.
   tx('texte FR', 'English text') renvoie le texte de la langue active.
   Les fichiers de données *.en.js remplacent les champs FR par leur version anglaise quand MGS_LANG === 'en'. */
(function () {
  let lang = null;
  try { lang = localStorage.getItem('sb.lang') || localStorage.getItem('mgs.lang'); } catch (_) {}
  if (lang !== 'fr' && lang !== 'en') lang = /^fr/i.test(navigator.language || '') ? 'fr' : 'en';
  window.MGS_LANG = lang;
  document.documentElement.lang = lang;
  window.tx = (fr, en) => (window.MGS_LANG === 'en' && en != null ? en : fr);
  window.MGS_setLang = l => { try { localStorage.setItem('sb.lang', l); localStorage.setItem('mgs.lang', l); } catch (_) {} location.reload(); };
  // remplace récursivement les champs d'un objet par ceux de sa version anglaise (tableaux remplacés en bloc)
  window.MGS_applyEN = (target, en) => {
    if (window.MGS_LANG !== 'en' || !target || !en) return target;
    Object.keys(en).forEach(k => {
      const v = en[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) window.MGS_applyEN(target[k], v);
      else target[k] = v;
    });
    return target;
  };
})();
