(() => {
  const tracks = (CONFIG?.tracks || []);
  const projectName = (CONFIG?.project?.name) || "Soundboard";

  // ---- THEME : applique les 2 couleurs du profil ----
  const themeColor  = (CONFIG?.project?.themeColor)  || "#667eea";
  const themeColor2 = (CONFIG?.project?.themeColor2) || "#764ba2";
  document.documentElement.style.setProperty("--accent", themeColor);
  document.documentElement.style.setProperty("--accent-2", themeColor2);

  // ---- emojis dans le titre forcés en présentation "text" (monochrome) ----
  // Variation Selector-15 (︎) après chaque emoji = rendu noir & blanc.
  const monoEmoji = (str) => {
    if (!str) return str;
    return str.replace(/(\p{Extended_Pictographic})/gu, "$1︎");
  };

  // L'ordre est défini par build.py (cat -> ordre intra-cat).
  // On NE re-trie PAS ici : on préserve l'ordre d'arrivée des tracks.
  const musics = tracks.filter(t => t.type === "music");
  const sfx    = tracks.filter(t => t.type === "sfx");

  const elMusic = document.getElementById("musicList");
  const elSfx = document.getElementById("sfxList");

  const headerTitle = document.getElementById("headerTitle");
  const nowTitle = document.getElementById("nowTitle");
  const nowSub = document.getElementById("nowSub");
  const cover = document.getElementById("cover");

  const bar = document.getElementById("progressBar");
  const tCur = document.getElementById("tCur");
  const tDur = document.getElementById("tDur");

  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnStop = document.getElementById("btnStop");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnStopAll = document.getElementById("btnStopAll");

  const musicVol = document.getElementById("musicVol");
  const sfxVol = document.getElementById("sfxVol");
  const musicVolTxt = document.getElementById("musicVolTxt");
  const sfxVolTxt = document.getElementById("sfxVolTxt");

  const musicSearch = document.getElementById("musicSearch");
  const sfxSearch = document.getElementById("sfxSearch");

  // Audio en boucle infinie pour TOUTES les musiques
  const musicAudio = new Audio();
  musicAudio.preload = "auto";
  musicAudio.loop = true;

  let currentIndex = -1;
  let lastTrack = null;   // dernier track joué (pour cover persistante)
  let musicVolume = 0.7;
  let sfxVolume = 1.0;

  // ----- helpers -----
  const fmt = (sec) => {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const groupBy = (arr, key) => {
    const map = {};
    arr.forEach(x => {
      const k = (x[key] || "Other").trim() || "Other";
      if (!map[k]) map[k] = [];
      map[k].push(x);
    });
    return map;
  };

  // ----- titre & header -----
  const setHeaderTitle = (trackName) => {
    const raw = trackName ? `Soundboard — ${trackName}` : `Soundboard — ${projectName}`;
    const text = monoEmoji(raw);
    if (headerTitle) headerTitle.textContent = text;
    document.title = text;
  };

  const setCover = (track) => {
    const t = track || lastTrack;
    if (t && t.cover) {
      cover.style.backgroundImage = `url('${t.cover}')`;
      cover.style.backgroundSize = "cover";
      cover.style.backgroundPosition = "center";
      cover.textContent = "";
    } else if (t) {
      cover.style.backgroundImage = "";
      cover.textContent = "🎵";
    } else {
      cover.style.backgroundImage = "";
      cover.textContent = "🎲";
    }
  };

  const updateNow = () => {
    if (currentIndex < 0) {
      // Si on a déjà joué quelque chose, on garde la dernière cover.
      // Sinon on affiche la cover du 1er morceau dispo.
      nowTitle.textContent = lastTrack ? lastTrack.name : (musics[0]?.name || "Aucune musique");
      nowSub.textContent = lastTrack ? "(en pause)" : "Choisis une track à droite";
      btnPlayPause.textContent = "▶";
      bar.style.width = "0%";
      tCur.textContent = "0:00";
      tDur.textContent = "0:00";
      setCover(lastTrack || musics[0] || null);
      setHeaderTitle(null);
      return;
    }
    const t = musics[currentIndex];
    nowTitle.textContent = t.name || t.file;
    nowSub.textContent = t.category || "Musique";
    btnPlayPause.textContent = musicAudio.paused ? "▶" : "⏸";
    setCover(t);
    setHeaderTitle(t.name || t.file);
  };

  const highlightActive = () => {
    document.querySelectorAll(".track").forEach(n => n.classList.remove("active"));
    const node = document.querySelector(`.track[data-idx="${currentIndex}"]`);
    if (node) node.classList.add("active");
  };

  // ----- player controls -----
  const playIndex = (idx) => {
    if (idx < 0 || idx >= musics.length) return;
    currentIndex = idx;
    const t = musics[currentIndex];
    lastTrack = t;
    musicAudio.src = (t.file && t.file.startsWith("data:")) ? t.file : ("music/" + t.file);
    musicAudio.volume = Math.max(0, Math.min(1, (t.volume ?? musicVolume)));
    musicAudio.currentTime = 0;
    musicAudio.play();
    highlightActive();
    updateNow();
  };

  const togglePlay = () => {
    if (currentIndex < 0) {
      if (musics.length) playIndex(0);
      return;
    }
    if (musicAudio.paused) musicAudio.play();
    else musicAudio.pause();
    updateNow();
  };

  const stopMusic = () => {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    currentIndex = -1;
    highlightActive();
    updateNow();
  };

  const prev = () => {
    if (!musics.length) return;
    const idx = currentIndex <= 0 ? musics.length - 1 : currentIndex - 1;
    playIndex(idx);
  };

  const next = () => {
    if (!musics.length) return;
    const idx = currentIndex >= musics.length - 1 ? 0 : currentIndex + 1;
    playIndex(idx);
  };

  const stopAll = () => {
    stopMusic();
    sfxPool.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    sfxPool.length = 0;
  };

  // ----- SFX -----
  const sfxPool = [];
  const playSfx = (file, perTrackVol) => {
    const src = (file && file.startsWith("data:")) ? file : ("sfx/" + file);
    const a = new Audio(src);
    const v = (perTrackVol == null ? 1.0 : Number(perTrackVol)) * sfxVolume;
    a.volume = Math.max(0, Math.min(1, v));
    a.preload = "auto";
    a.play();
    sfxPool.push(a);
    a.addEventListener("ended", () => {
      const i = sfxPool.indexOf(a);
      if (i >= 0) sfxPool.splice(i, 1);
    });
  };

  // ----- helpers : état collapse persistant en localStorage -----
  const COLL_KEY = "sb_collapsed";
  const collapsed = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(COLL_KEY) || "[]")); }
    catch(e) { return new Set(); }
  })();
  const saveCollapsed = () => {
    try { localStorage.setItem(COLL_KEY, JSON.stringify([...collapsed])); } catch(e) {}
  };
  const collapseId = (kind, cat) => kind + "::" + (cat || "");
  const toggleCollapse = (id, sectionEl) => {
    if (collapsed.has(id)) {
      collapsed.delete(id);
      sectionEl.classList.remove("collapsed");
    } else {
      collapsed.add(id);
      sectionEl.classList.add("collapsed");
    }
    saveCollapsed();
  };

  // ----- music list -----
  const renderMusic = (filter = "") => {
    elMusic.innerHTML = "";
    const f = filter.trim().toLowerCase();
    const grouped = groupBy(musics, "category");
    Object.entries(grouped).forEach(([cat, items]) => {
      const section = document.createElement("div");
      section.className = "music-cat";
      const cid = collapseId("music", cat);
      if (collapsed.has(cid)) section.classList.add("collapsed");
      const title = document.createElement("div");
      title.className = "cat-title cat-toggle";
      title.innerHTML = `<span class="cat-chevron">▾</span><span class="cat-name">${cat}</span><span class="cat-count">${items.length}</span>`;
      title.addEventListener("click", () => toggleCollapse(cid, section));
      section.appendChild(title);

      // Wrapper pour le mode grille
      const wrap = document.createElement("div");
      wrap.className = "track-grid-wrap";

      items.forEach((t) => {
        const idx = musics.indexOf(t);
        const text = `${t.name || ""} ${t.file || ""} ${t.category || ""}`.toLowerCase();
        if (f && !text.includes(f)) return;
        const row = document.createElement("div");
        row.className = "track";
        row.dataset.idx = String(idx);
        const coverStyle = t.cover
          ? `style="background-image:url('${t.cover}')"`
          : ``;
        const coverFallback = t.cover ? "" : "🎵";
        row.innerHTML = `
          <div class="track-cover" ${coverStyle}>${coverFallback}</div>
          <div class="track-main">
            <div class="track-name">${t.name || t.file}</div>
            <div class="track-meta">
              <span class="chip">${Math.round((t.volume ?? musicVolume) * 100)}%</span>
              <span class="chip">#${t.order || idx+1}</span>
            </div>
          </div>`;
        row.addEventListener("click", () => playIndex(idx));
        wrap.appendChild(row);
      });
      section.appendChild(wrap);
      elMusic.appendChild(section);
    });
    highlightActive();
  };

  // ----- sfx list -----
  const renderSfx = (filter = "") => {
    elSfx.innerHTML = "";
    const f = filter.trim().toLowerCase();
    const grouped = groupBy(sfx, "category");
    Object.entries(grouped).forEach(([cat, items]) => {
      const bloc = document.createElement("div");
      bloc.className = "sfx-category";
      const cid = collapseId("sfx", cat);
      if (collapsed.has(cid)) bloc.classList.add("collapsed");
      const title = document.createElement("div");
      title.className = "sfx-title cat-toggle";
      title.innerHTML = `<span class="cat-chevron">▾</span><span class="cat-name">${cat}</span><span class="cat-count">${items.length}</span>`;
      title.addEventListener("click", () => toggleCollapse(cid, bloc));
      const grid = document.createElement("div");
      grid.className = "sfx-grid";
      items.forEach((t) => {
        const text = `${t.name || ""} ${t.file || ""} ${t.category || ""}`.toLowerCase();
        if (f && !text.includes(f)) return;
        const b = document.createElement("button");
        b.className = "sfx-btn";
        b.textContent = t.name || t.file;
        b.title = t.name || t.file;   // tooltip si tronqué
        b.addEventListener("click", () => {
          playSfx(t.file, t.volume);
          // re-trigger l'animation à chaque clic
          b.classList.remove("firing");
          void b.offsetWidth;
          b.classList.add("firing");
        });
        grid.appendChild(b);
      });
      bloc.appendChild(title);
      bloc.appendChild(grid);
      elSfx.appendChild(bloc);
    });
  };

  // ----- progress / time -----
  musicAudio.addEventListener("timeupdate", () => {
    if (!isFinite(musicAudio.duration) || musicAudio.duration <= 0) return;
    if (isSeeking) return;   // ne pas écraser pendant un drag
    const pct = (musicAudio.currentTime / musicAudio.duration) * 100;
    bar.style.width = pct + "%";
    tCur.textContent = fmt(musicAudio.currentTime);
  });

  // ---- SEEK : click + drag sur la barre de progression ----
  let isSeeking = false;
  const progressTrack = bar.parentElement;   // .progress
  const seekFromEvent = (e) => {
    if (!isFinite(musicAudio.duration) || musicAudio.duration <= 0) return;
    const rect = progressTrack.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = x / rect.width;
    bar.style.width = (pct * 100) + "%";
    tCur.textContent = fmt(pct * musicAudio.duration);
    return pct * musicAudio.duration;
  };
  progressTrack.style.cursor = "pointer";
  progressTrack.addEventListener("mousedown", (e) => {
    if (currentIndex < 0) return;
    isSeeking = true;
    seekFromEvent(e);
  });
  document.addEventListener("mousemove", (e) => {
    if (!isSeeking) return;
    seekFromEvent(e);
  });
  document.addEventListener("mouseup", (e) => {
    if (!isSeeking) return;
    const t = seekFromEvent(e);
    if (t != null) musicAudio.currentTime = t;
    isSeeking = false;
  });
  // touch (tablette)
  progressTrack.addEventListener("touchstart", (e) => {
    if (currentIndex < 0) return;
    isSeeking = true;
    seekFromEvent(e);
  }, { passive: true });
  progressTrack.addEventListener("touchmove", (e) => {
    if (!isSeeking) return;
    seekFromEvent(e);
  }, { passive: true });
  progressTrack.addEventListener("touchend", (e) => {
    if (!isSeeking) return;
    const t = seekFromEvent(e.changedTouches ? { clientX: e.changedTouches[0].clientX } : e);
    if (t != null) musicAudio.currentTime = t;
    isSeeking = false;
  });
  musicAudio.addEventListener("loadedmetadata", () => {
    tDur.textContent = fmt(musicAudio.duration);
    updateNow();
  });
  musicAudio.addEventListener("play", () => {
    cover.classList.add("playing");
    bar.classList.add("playing");
    if (btnPlayPause) btnPlayPause.classList.add("playing");
    updateNow();
  });
  musicAudio.addEventListener("pause", () => {
    cover.classList.remove("playing");
    bar.classList.remove("playing");
    if (btnPlayPause) btnPlayPause.classList.remove("playing");
    updateNow();
  });
  // pas de listener "ended" : musicAudio.loop = true gère ça automatiquement

  // ----- UI events -----
  btnPlayPause.addEventListener("click", togglePlay);
  btnStop.addEventListener("click", stopMusic);
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);
  btnStopAll.addEventListener("click", stopAll);

  musicVol.addEventListener("input", () => {
    musicVolume = Number(musicVol.value) / 100;
    musicVolTxt.textContent = `${musicVol.value}%`;
    if (currentIndex >= 0) musicAudio.volume = musicVolume;
  });
  sfxVol.addEventListener("input", () => {
    sfxVolume = Number(sfxVol.value) / 100;
    sfxVolTxt.textContent = `${sfxVol.value}%`;
  });

  musicSearch.addEventListener("input", () => renderMusic(musicSearch.value));
  sfxSearch.addEventListener("input", () => renderSfx(sfxSearch.value));

  // ----- toggle vue liste / vignettes -----
  const btnViewMode = document.getElementById("btnViewMode");
  let viewMode = "grid";
  try { viewMode = localStorage.getItem("sb_viewMode") || "grid"; } catch(e) {}
  const applyViewMode = () => {
    if (viewMode === "grid") {
      elMusic.classList.add("list-grid");
      if (btnViewMode) btnViewMode.textContent = "☰";
      if (btnViewMode) btnViewMode.title = "Vue liste";
    } else {
      elMusic.classList.remove("list-grid");
      if (btnViewMode) btnViewMode.textContent = "⊞";
      if (btnViewMode) btnViewMode.title = "Vue vignettes";
    }
  };
  if (btnViewMode) {
    btnViewMode.addEventListener("click", () => {
      viewMode = (viewMode === "grid") ? "list" : "grid";
      try { localStorage.setItem("sb_viewMode", viewMode); } catch(e) {}
      applyViewMode();
    });
  }
  applyViewMode();

  // ----- init -----
  musicVolTxt.textContent = "70%";
  sfxVolTxt.textContent = "100%";
  setHeaderTitle(null);
  renderMusic("");
  renderSfx("");
  updateNow();

  // Fallback emojis monochromes pour les navigateurs sans font-variant-emoji.
  // On parcourt les nœuds texte des en-têtes & libellés et on insère VS-15.
  const SELECTORS = ".panel-header,.now-sub,.toolbar .hint,.slider-label,.btn";
  document.querySelectorAll(SELECTORS).forEach(el => {
    el.childNodes.forEach(n => {
      if (n.nodeType === 3 && /\p{Extended_Pictographic}/u.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(/(\p{Extended_Pictographic})(?!︎)/gu, "$1︎");
      }
    });
  });
})();
