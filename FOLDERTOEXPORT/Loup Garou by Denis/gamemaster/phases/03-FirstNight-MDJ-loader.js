/**
 * FirstNightMDJ Loader
 * Charge tous les modules dans le bon ordre
 */

(function() {
  const modules = [
    'utils/html-helpers.js',
    'utils/night-state.js',
    'utils/night-summary-renderer.js',
    'utils/role-renderers.js',
    '03-FirstNight-MDJ.js'
  ];

  const basePath = '/gamemaster/phases/';

  async function loadModules() {
    console.log('[FirstNightMDJ Loader] Chargement des modules...');

    for (const module of modules) {
      try {
        const script = document.createElement('script');
        script.src = basePath + module + '?v=' + Date.now();
        script.async = false;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Impossible de charger ${module}`));
          document.head.appendChild(script);
        });
        console.log(`✓ Module chargé: ${module}`);
      } catch (error) {
        console.error(`✗ Erreur de chargement: ${module}`, error);
      }
    }

    console.log('[FirstNightMDJ Loader] Tous les modules chargés!');
  }

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModules);
  } else {
    loadModules();
  }
})();
