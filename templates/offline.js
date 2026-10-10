  // ----- Mode hors-ligne : met tous les sons en cache via le Service Worker (sw.js) -----
  //   config.json > project.offline :
  //     "button" -> bouton "📥 Hors-ligne" dans l'en-tête (mise en cache à la demande)
  //     "auto"   -> mise en cache automatique en arrière-plan + popup "Version locale"
  //   Un jeu peut ajouter ses propres fichiers à mettre en cache en définissant
  //   window.SB_OFFLINE_EXTRA_URLS = () => ["chemin/fichier", ...]  (dans inject/body.html).
  (function setupOffline(){
    const mode = (CONFIG.project || {}).offline;
    if (!mode) return;
    const btn = document.getElementById("btnOffline");
    const httpOK = (location.protocol === "http:" || location.protocol === "https:");
    const supported = ("serviceWorker" in navigator) && httpOK;
    if (!supported) {
      if (btn) {
        btn.textContent = "📥 Hors-ligne (http requis)";
        btn.title = "Le mode hors-ligne nécessite que la page soit servie via http(s) (GitHub Pages ou un serveur local), pas en ouverture directe du fichier (file://).";
        btn.addEventListener("click", () => {
          alert("Le mode hors-ligne nécessite que la page soit servie via http(s) — par ex. GitHub Pages ou un petit serveur local — et non en double-cliquant le fichier (file://).");
        });
      } else {
        console.warn("[offline] indisponible : la page doit être servie via http(s), pas en file://");
      }
      return;
    }

    navigator.serviceWorker.register("sw.js").catch(e => console.warn("[offline] SW register KO:", e));

    if (mode === "auto") {
      // Demande au navigateur de rendre le stockage PERSISTANT (le cache ne sera pas purgé).
      try {
        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(ok => console.log("[offline] stockage persistant :", ok ? "accordé ✅" : "refusé (cache quand même conservé sauf manque d'espace)"));
        }
      } catch (_) {}
    }

    const buildUrlList = () => {
      const set = new Set();
      set.add(location.href.split("#")[0].split("?")[0]);
      document.querySelectorAll('script[src], link[rel="stylesheet"]').forEach(n => {
        const u = n.src || n.href; if (u) set.add(u);
      });
      (tracks || []).forEach(t => {
        if (t.file && !String(t.file).startsWith("data:")) {
          set.add((t.type === "sfx" ? "sfx/" : "music/") + t.file);
        }
        if (t.cover && !String(t.cover).startsWith("data:")) set.add(t.cover);
      });
      // Fichiers propres au jeu (déclarés dans inject/body.html)
      try {
        if (typeof window.SB_OFFLINE_EXTRA_URLS === "function") {
          (window.SB_OFFLINE_EXTRA_URLS() || []).forEach(u => { if (u) set.add(u); });
        }
      } catch (_) {}
      return [...set];
    };

    const precacheViaSW = (urls, onProgress) => new Promise(async (resolve, reject) => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sw = reg.active;
        if (!sw) { reject(new Error("Service Worker inactif")); return; }
        const ch = new MessageChannel();
        ch.port1.onmessage = (e) => {
          const d = e.data || {};
          if (d.finished) resolve(d);
          else onProgress(d.done, d.total, d.ok);
        };
        sw.postMessage({ type: "PRECACHE", urls }, [ch.port2]);
      } catch (e) { reject(e); }
    });

    // ----- MODE BOUTON -----
    if (mode === "button" && btn) {
      let busy = false;
      btn.addEventListener("click", async () => {
        if (busy) return; busy = true;
        const orig = "📥 Hors-ligne";
        btn.disabled = true;
        try {
          const urls = buildUrlList();
          const res = await precacheViaSW(urls, (done, total) => {
            btn.textContent = "📥 " + done + "/" + total + "…";
          });
          btn.textContent = "✅ Hors-ligne prêt (" + res.ok + ")";
          setTimeout(() => { btn.textContent = orig; }, 3000);
        } catch (e) {
          console.error("[offline] KO:", e);
          alert("Échec du chargement hors-ligne : " + e.message);
          btn.textContent = orig;
        } finally {
          btn.disabled = false; busy = false;
        }
      });
    }

    // ----- MODE AUTO : precache en arrière-plan + popup "Version locale" -----
    if (mode === "auto") {
      let pop = null;
      const ensurePopup = () => {
        if (pop) return pop;
        pop = document.createElement('div');
        pop.id = 'offline-progress-pop';
        pop.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;background:linear-gradient(135deg,rgba(25,25,45,0.96),rgba(40,30,60,0.96));border:1px solid rgba(199,125,255,0.5);border-radius:10px;padding:10px 14px;font:600 12px/1.3 system-ui,sans-serif;color:#e8e8f0;box-shadow:0 6px 24px rgba(0,0,0,0.5);max-width:250px;opacity:0;transition:opacity .3s;';
        pop.innerHTML = '<div id="ofp-txt">Preparation hors-ligne...</div><div style="margin-top:6px;height:5px;border-radius:3px;background:rgba(255,255,255,0.15);overflow:hidden;"><div id="ofp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#5174db,#c77dff);transition:width .2s;"></div></div>';
        document.body.appendChild(pop);
        requestAnimationFrame(() => { if (pop) pop.style.opacity = '1'; });
        return pop;
      };
      const setProg = (txt, pct) => {
        ensurePopup();
        const t = document.getElementById('ofp-txt'); if (t) t.textContent = txt;
        const b = document.getElementById('ofp-bar'); if (b && pct != null) b.style.width = Math.max(0, Math.min(100, pct)) + '%';
      };
      const showLocal = (n) => {
        ensurePopup();
        pop.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">✅</span><div><div style="color:#66d999;">Version locale</div><div style="font-weight:400;opacity:0.78;font-size:11px;">' + n + ' fichiers en cache — hors-ligne OK</div></div></div>';
        setTimeout(() => { if (pop) { pop.style.opacity = '0'; setTimeout(() => { if (pop) { pop.remove(); pop = null; } }, 400); } }, 5000);
      };
      const run = async (attempt = 1) => {
        try {
          await navigator.serviceWorker.ready;
          const urls = buildUrlList();
          let missing = urls;
          try {
            const checks = await Promise.all(urls.map(u => caches.match(u).then(r => !!r).catch(() => false)));
            missing = urls.filter((u, i) => !checks[i]);
          } catch (_) {}
          if (!missing.length) { showLocal(urls.length); return; }
          setProg('Telechargement des sons... 0/' + missing.length, 2);
          // WATCHDOG : si plus aucun progres pendant 60s (SW tue / fichier qui pend),
          // on relance automatiquement (les fichiers deja en cache sont sautes).
          let lastTick = Date.now();
          const watchdog = setInterval(() => {
            if (Date.now() - lastTick > 60000) {
              clearInterval(watchdog);
              console.warn('[offline auto] blocage detecte -> relance (tentative ' + (attempt + 1) + ')');
              if (attempt < 4) run(attempt + 1);
              else if (pop) { pop.remove(); pop = null; }
            }
          }, 5000);
          await precacheViaSW(missing, (done, total) => {
            lastTick = Date.now();
            setProg('Telechargement des sons... ' + done + '/' + total, total ? Math.round(done / total * 100) : 0);
          });
          clearInterval(watchdog);
          showLocal(urls.length);
        } catch (e) {
          console.warn('[offline auto] KO:', e);
          if (pop) { pop.remove(); pop = null; }
        }
      };
      // Laisse la page devenir interactive, puis precache en arriere-plan
      if (document.readyState === 'complete') setTimeout(run, 1500);
      else window.addEventListener('load', () => setTimeout(run, 1500));
    }
  })();
