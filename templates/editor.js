// ============================================================
//  SOUNDBOARD EDITOR  (v3 - FR, Vol en %, save POST /save)
// ============================================================
console.log("[editor.js v3] loaded at", new Date().toLocaleTimeString());

const editor = {
  cfg: null,
  audio: null,
  currentBtn: null,

  // ----------------- LOAD -----------------
  async load() {
    try {
      const r = await fetch("config.json?ts=" + Date.now(), { cache: "no-store" });
      this.cfg = await r.json();
      this._ensureShape();
      // Détecte (pour info) les orphelins au load — ils seront fixés au save.
      this._cleanOrphans();
      this.initAudio();
      this.render();
    } catch (e) {
      console.error("config.json load failed", e);
      const el = document.getElementById("musicTable");
      if (el) el.innerHTML = "config.json introuvable -- lance d'abord 'python build.py scan'";
    }
  },

  _ensureShape() {
    const c = this.cfg || {};
    c.project = c.project || { name: "", version: 1 };
    if (!c.project.themeColor)  c.project.themeColor  = "#667eea";
    if (!c.project.themeColor2) c.project.themeColor2 = "#764ba2";
    c.musicCategories = Array.isArray(c.musicCategories) ? c.musicCategories : [];
    c.sfxCategories = Array.isArray(c.sfxCategories) ? c.sfxCategories : [];
    c.music = Array.isArray(c.music) ? c.music : [];
    c.sfx = Array.isArray(c.sfx) ? c.sfx : [];
    c.music.forEach(m => { if (m.volume === undefined || m.volume === null) m.volume = 0.7; });
    c.sfx.forEach(s => { if (s.volume === undefined || s.volume === null) s.volume = 1.0; });
    this.cfg = c;
  },

  // =================================================================
  //  THEME : 2 couleurs indépendantes (--accent + --accent-2)
  // =================================================================
  applyTheme(c1, c2) {
    const root = document.documentElement;
    if (c1) root.style.setProperty("--accent", c1);
    if (c2) root.style.setProperty("--accent-2", c2);
  },

  setThemeColor1(hex) {
    if (!this.cfg) return;
    this.cfg.project.themeColor = hex;
    this.applyTheme(hex, null);
  },

  setThemeColor2(hex) {
    if (!this.cfg) return;
    this.cfg.project.themeColor2 = hex;
    this.applyTheme(null, hex);
  },

  // =================================================================
  //  AUTO THEME depuis une cover
  // =================================================================
  openAutoThemePicker() {
    const grid = document.getElementById("autoThemeGrid");
    const modal = document.getElementById("autoThemeModal");
    if (!grid || !modal) return;

    // Liste les covers uniques des morceaux
    const covers = [];
    const seen = new Set();
    (this.cfg.music || []).forEach(m => {
      if (m.cover && !seen.has(m.cover)) {
        seen.add(m.cover);
        covers.push({ cover: m.cover, title: m.title || m.file });
      }
    });

    if (!covers.length) {
      grid.innerHTML = `<div class="muted">Aucune cover disponible. Tes mp3 doivent contenir une image en tag ID3 pour que le scan en extraie une dans /covers.</div>`;
      modal.style.display = "flex";
      return;
    }

    grid.innerHTML = covers.map(c => `
      <div class="cover-item" onclick="editor.applyAutoThemeFromCover('${this._esc(c.cover)}')">
        <img src="${this._esc(c.cover)}?t=${Date.now()}" alt="">
        <div class="cover-item-name">${this._esc(c.title)}</div>
      </div>`).join("");

    modal.style.display = "flex";
  },

  closeAutoThemePicker() {
    const modal = document.getElementById("autoThemeModal");
    if (modal) modal.style.display = "none";
  },

  applyAutoThemeFromCover(coverPath) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const palette = this._extractPalette(img);
        if (!palette || palette.length === 0) {
          alert("Impossible d'extraire des couleurs de cette cover.");
          return;
        }
        const c1 = palette[0];
        const c2 = palette[1] || palette[0];
        this.cfg.project.themeColor = c1;
        this.cfg.project.themeColor2 = c2;
        this.applyTheme(c1, c2);
        // Met à jour les pickers
        const p1 = document.getElementById("themeColor");
        const p2 = document.getElementById("themeColor2");
        if (p1) p1.value = c1;
        if (p2) p2.value = c2;
        this.closeAutoThemePicker();
        console.log("[auto-theme]", coverPath, "->", c1, c2);
      } catch(e) {
        console.error("[auto-theme] failed:", e);
        alert("Erreur lors de l'analyse: " + e.message);
      }
    };
    img.onerror = () => alert("Impossible de charger la cover: " + coverPath);
    img.src = coverPath + "?t=" + Date.now();
  },

  // ----------------------------------------------------------------
  //  Extracteur de palette : top 2 couleurs dominantes ET saturées
  // ----------------------------------------------------------------
  _extractPalette(img) {
    const cv = document.createElement("canvas");
    const W = 80, H = 80;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;

    // Histogramme avec quantization 5 bits par canal
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 200) continue;

      // saturation HSL approximative
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      const l = (max + min) / 510;            // 0..1
      const sat = max === 0 ? 0 : (max - min) / max;  // 0..1

      // skip noir, blanc, gris pâle
      if (l < 0.10 || l > 0.92) continue;
      if (sat < 0.18) continue;

      const qr = r >> 3, qg = g >> 3, qb = b >> 3; // 5 bits
      const key = (qr << 10) | (qg << 5) | qb;

      if (!buckets[key]) buckets[key] = { r:0, g:0, b:0, n:0, sat:0 };
      const bk = buckets[key];
      bk.r += r; bk.g += g; bk.b += b; bk.n++; bk.sat += sat;
    }

    // Trie par fréquence pondérée par saturation
    const list = Object.values(buckets).map(bk => ({
      r: Math.round(bk.r / bk.n),
      g: Math.round(bk.g / bk.n),
      b: Math.round(bk.b / bk.n),
      score: bk.n * (1 + bk.sat / bk.n),
    })).sort((a,b) => b.score - a.score);

    if (!list.length) return null;

    // On veut 2 couleurs DIFFERENTES (assez éloignées en hue)
    const picked = [list[0]];
    for (let i = 1; i < list.length && picked.length < 2; i++) {
      const c = list[i];
      const dx = c.r - picked[0].r;
      const dy = c.g - picked[0].g;
      const dz = c.b - picked[0].b;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist > 70) picked.push(c);
    }
    if (picked.length < 2 && list.length > 1) picked.push(list[1]);

    const toHex = c =>
      "#" + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, "0")).join("");
    return picked.map(toHex);
  },

  // ----------------- EMOJIS MONOCHROMES (fallback no font-variant-emoji) -----------------
  applyMonoEmojis() {
    const SEL = ".panel-header,.modal-title,.cat-block-title,.toolbar .hint,.muted,.btn,.btn-small,label";
    document.querySelectorAll(SEL).forEach(el => {
      el.childNodes.forEach(n => {
        if (n.nodeType === 3 && /\p{Extended_Pictographic}/u.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/(\p{Extended_Pictographic})(?!︎)/gu, "$1︎");
        }
      });
    });
  },

  // ----------------- AUDIO -----------------
  initAudio() {
    if (this.audio) return;
    const audio = document.createElement("audio");
    audio.style.display = "none";
    document.body.appendChild(audio);
    this.audio = audio;
    const reset = () => {
      if (this.currentBtn) this.currentBtn.textContent = "▶";
      this.currentBtn = null;
    };
    audio.addEventListener("ended", reset);
    audio.addEventListener("pause", () => { if (this.currentBtn) this.currentBtn.textContent = "▶"; });
    audio.addEventListener("play", () => { if (this.currentBtn) this.currentBtn.textContent = "⏸"; });
  },

  // ----------------- RENDER -----------------
  render() {
    this.renderProject();
    this.renderCategories();
    this.renderMusic();
    this.renderSfx();
    this.applyTheme(this.cfg.project.themeColor, this.cfg.project.themeColor2);
    this.applyMonoEmojis();
  },

  renderProject() {
    const el = document.getElementById("projectName");
    if (el) {
      el.value = this.cfg.project.name || "";
      el.oninput = () => { this.cfg.project.name = el.value; };
    }
    const p1 = document.getElementById("themeColor");
    const p2 = document.getElementById("themeColor2");
    if (p1) p1.value = this.cfg.project.themeColor  || "#667eea";
    if (p2) p2.value = this.cfg.project.themeColor2 || "#764ba2";
  },

  // ---- categories ----
  renderCategories() {
    const el = document.getElementById("catTable");
    if (!el) return;
    el.innerHTML = `
      <div class="cat-block">
        <div class="cat-block-title">Catégories Music</div>
        <div id="musicCatList"></div>
        <button class="btn btn-small" onclick="editor.addCategory('music')">+ Ajouter</button>
      </div>
      <div class="cat-block">
        <div class="cat-block-title">Catégories SFX</div>
        <div id="sfxCatList"></div>
        <button class="btn btn-small" onclick="editor.addCategory('sfx')">+ Ajouter</button>
      </div>`;
    this._renderCatList("music", "musicCatList");
    this._renderCatList("sfx", "sfxCatList");
  },

  _renderCatList(kind, containerId) {
    const list = kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!list.length) { el.innerHTML = `<div class="muted">Aucune catégorie</div>`; return; }
    el.innerHTML = list.map((c, i) => `
      <div class="cat-row" draggable="true"
           data-kind="${kind}" data-idx="${i}"
           ondragstart="editor._dragStart(event)"
           ondragover="editor._dragOver(event)"
           ondragleave="editor._dragLeave(event)"
           ondrop="editor._drop(event)"
           ondragend="editor._dragEnd(event)">
        <span class="drag-handle" title="Glisse pour réordonner">⋮⋮</span>
        <input class="cat-input" value="${this._esc(c.name)}"
               oninput="editor.renameCategory('${kind}', ${i}, this.value)"
               onchange="editor.render()"
               onblur="editor.render()">
        <button class="btn-x" onclick="editor.deleteCategory('${kind}', ${i})" title="Supprimer">✕</button>
      </div>`).join("");
  },

  // ----------------- DRAG & DROP catégories -----------------
  _dragStart(e) {
    const row = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({
      kind: row.dataset.kind,
      idx: parseInt(row.dataset.idx, 10)
    }));
    row.classList.add("dragging");
  },
  _dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const row = e.currentTarget;
    // Détecte si on est dans la moitié haute ou basse de la cible
    const rect = row.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    row.classList.toggle("drop-before", before);
    row.classList.toggle("drop-after", !before);
  },
  _dragLeave(e) {
    e.currentTarget.classList.remove("drop-before", "drop-after");
  },
  _drop(e) {
    e.preventDefault();
    const row = e.currentTarget;
    const before = row.classList.contains("drop-before");
    row.classList.remove("drop-before", "drop-after");

    let payload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); }
    catch(err) { return; }

    const fromKind = payload.kind;
    const fromIdx  = payload.idx;
    const toKind   = row.dataset.kind;
    let   toIdx    = parseInt(row.dataset.idx, 10);
    if (fromKind !== toKind) return;     // pas de cross-kind (music/sfx)
    if (fromIdx === toIdx)   return;

    const list = fromKind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    const [moved] = list.splice(fromIdx, 1);
    // Si on droppe APRES la cible et que la cible est plus loin, on tient compte du splice
    if (!before) toIdx = (fromIdx < toIdx) ? toIdx : toIdx + 1;
    else         toIdx = (fromIdx < toIdx) ? toIdx - 1 : toIdx;
    list.splice(toIdx, 0, moved);
    list.forEach((c, k) => { c.pos = k + 1; });
    this.render();
  },
  _dragEnd(e) {
    document.querySelectorAll(".cat-row").forEach(r => {
      r.classList.remove("dragging", "drop-before", "drop-after");
    });
  },

  addCategory(kind) {
    const list = kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    list.push({ name: "Catégorie " + (list.length + 1), pos: list.length + 1 });
    this.render();
  },

  renameCategory(kind, idx, newName) {
    const list = kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    const items = kind === "music" ? this.cfg.music : this.cfg.sfx;
    const oldName = list[idx].name;
    list[idx].name = newName;
    items.forEach(it => { if (it.category === oldName) it.category = newName; });

    // Propage IMMEDIATEMENT le rename dans tous les <select> de la table
    // correspondante, pour pas attendre un re-render (qui casserait le focus
    // de l'input de rename).
    const tableId = kind === "music" ? "musicTable" : "sfxTable";
    const tableEl = document.getElementById(tableId);
    if (!tableEl) return;
    tableEl.querySelectorAll("select").forEach(sel => {
      sel.querySelectorAll("option").forEach(opt => {
        if (opt.value === oldName) {
          opt.value = newName;
          opt.textContent = newName;
        }
      });
      // Met aussi a jour le séparateur de catégorie dans la table
      // (les data-cat des rows et le label visible)
    });
    tableEl.querySelectorAll("tr.cat-separator").forEach(sep => {
      if (sep.dataset.cat === oldName) {
        sep.dataset.cat = newName;
        const td = sep.querySelector("td");
        if (td) td.textContent = newName;
      }
    });
    tableEl.querySelectorAll("tr[data-cat]").forEach(row => {
      if (row.dataset.cat === oldName) row.dataset.cat = newName;
    });
  },

  deleteCategory(kind, idx) {
    const list = kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    const items = kind === "music" ? this.cfg.music : this.cfg.sfx;
    const name = list[idx].name;
    if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
    list.splice(idx, 1);
    items.forEach(it => { if (it.category === name) it.category = ""; });
    this.render();
  },

  // ============================================================
  //  MUSIC : groupé par catégorie + drag & drop
  //  pos est RELATIVE à la catégorie (1,2,3 dans chaque cat).
  //  Pas de saisie manuelle : drag & drop recalcule auto.
  // ============================================================
  renderMusic() { this._renderItems("music"); },
  renderSfx()   { this._renderItems("sfx"); },

  _renderItems(kind) {
    const el = document.getElementById(kind === "music" ? "musicTable" : "sfxTable");
    if (!el) return;
    const items = kind === "music" ? this.cfg.music : this.cfg.sfx;
    if (!items.length) {
      el.innerHTML = "<div class='muted'>Aucun mp3 dans /" + kind + ". Dépose tes fichiers puis Rescan.</div>";
      return;
    }

    // Ordre des catégories selon leur 'pos'
    const cats = (kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories)
                  .slice().sort((a,b)=>(a.pos||0)-(b.pos||0));
    const orderedCatNames = cats.map(c => c.name);

    // Groupe les morceaux/sfx par catégorie en gardant l'ordre du tableau plat
    const grouped = new Map();
    orderedCatNames.forEach(n => grouped.set(n, []));
    grouped.set("", []);   // groupe "sans cat"
    items.forEach((it, originalIdx) => {
      const c = it.category || "";
      if (!grouped.has(c)) grouped.set(c, []);
      grouped.get(c).push({ it, originalIdx });
    });

    // Construit le HTML
    const colCount = 6;   // nb de colonnes pour le colspan du séparateur
    const labelTitle = kind === "music" ? "Titre" : "Texte";
    const updateLbl  = kind === "music" ? "title" : "label";
    const updateVol  = kind === "music" ? "updateMusicVol" : "updateSfxVol";
    const playClass  = kind === "music" ? "play-music" : "play-sfx";
    const playSubdir = kind === "music" ? "music" : "sfx";
    const defaultVol = kind === "music" ? 0.7 : 1.0;

    let html = `
    <table class="data-table">
      <thead><tr>
        <th style="width:24px;"></th>
        <th style="width:34px;">#</th>
        <th>File</th><th>${labelTitle}</th><th>Cat</th><th>Vol</th><th>🎧</th>
      </tr></thead><tbody>`;

    const renderGroup = (catName, arr) => {
      if (!arr.length && catName !== "") return;            // skip cats vraiment vides (sauf "")
      if (catName === "" && !arr.length)  return;
      const catLabel = catName || "— Sans catégorie —";
      html += `
        <tr class="cat-separator"
            data-kind="${kind}" data-cat="${this._esc(catName)}"
            ondragover="editor._dropZoneOver(event)"
            ondragleave="editor._dropZoneLeave(event)"
            ondrop="editor._dropOnCat(event)">
          <td colspan="${colCount + 1}">${this._esc(catLabel)}</td>
        </tr>`;

      arr.forEach((entry, posInCat) => {
        const it = entry.it;
        const i  = entry.originalIdx;
        const fileShort = it.file.length > 26 ? it.file.substring(0, 26) + "…" : it.file;
        const volPct = Math.round((it.volume ?? defaultVol) * 100);
        const lblValue = kind === "music" ? it.title : it.label;
        html += `
          <tr data-idx="${i}" data-kind="${kind}" data-cat="${this._esc(catName)}"
              draggable="true"
              ondragstart="editor._itemDragStart(event)"
              ondragover="editor._itemDragOver(event)"
              ondragleave="editor._itemDragLeave(event)"
              ondrop="editor._itemDrop(event)"
              ondragend="editor._itemDragEnd(event)">
            <td><span class="drag-handle">⋮⋮</span></td>
            <td class="pos-cell">${posInCat + 1}</td>
            <td title="${this._esc(it.file)}" class="cell-file">${this._esc(fileShort)}</td>
            <td><input value="${this._esc(lblValue)}"
                  oninput="editor.update${kind === "music" ? "Music" : "Sfx"}(${i},'${updateLbl}',this.value)"></td>
            <td>${this._catSelect(kind, it.category, i)}</td>
            <td><input type="number" min="0" max="100" value="${volPct}" style="width:55px;"
                  oninput="editor.${updateVol}(${i}, this.value)"></td>
            <td><button class="${playClass}" data-src="${playSubdir}/${encodeURIComponent(it.file)}">▶</button></td>
          </tr>`;
      });
    };

    orderedCatNames.forEach(name => renderGroup(name, grouped.get(name) || []));
    if ((grouped.get("") || []).length) renderGroup("", grouped.get(""));

    html += "</tbody></table>";
    el.innerHTML = html;
    this.enablePlay("." + playClass);
  },

  // ============================================================
  //  DRAG & DROP des items (musique ou sfx)
  // ============================================================
  _itemDragStart(e) {
    const row = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({
      kind: row.dataset.kind,
      idx:  parseInt(row.dataset.idx, 10),
    }));
    row.classList.add("dragging");
  },
  _itemDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const row = e.currentTarget;
    const rect = row.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    row.classList.toggle("drop-before", before);
    row.classList.toggle("drop-after", !before);
  },
  _itemDragLeave(e) {
    e.currentTarget.classList.remove("drop-before", "drop-after");
  },
  _itemDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const row = e.currentTarget;
    const before = row.classList.contains("drop-before");
    row.classList.remove("drop-before", "drop-after");

    let payload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); }
    catch(err) { return; }

    const fromKind = payload.kind;
    const toKind   = row.dataset.kind;
    if (fromKind !== toKind) return;       // pas de cross music<->sfx

    const fromIdx = payload.idx;
    const toIdx   = parseInt(row.dataset.idx, 10);
    const targetCat = row.dataset.cat || "";

    if (fromIdx === toIdx) return;

    const arr = fromKind === "music" ? this.cfg.music : this.cfg.sfx;
    const moved = arr[fromIdx];
    moved.category = targetCat;          // change la cat si différente

    // Splice & re-insertion à la bonne position du tableau plat
    arr.splice(fromIdx, 1);
    let insertAt = (fromIdx < toIdx) ? toIdx - 1 : toIdx;
    if (!before) insertAt += 1;
    arr.splice(insertAt, 0, moved);

    this._recalcPositions(fromKind);
    this.render();
  },
  _itemDragEnd(e) {
    document.querySelectorAll("tr").forEach(r => {
      r.classList.remove("dragging", "drop-before", "drop-after");
    });
  },

  // Drop sur une ligne séparatrice = ajoute en TÊTE de la cat
  _dropZoneOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drop-onto");
  },
  _dropZoneLeave(e) {
    e.currentTarget.classList.remove("drop-onto");
  },
  _dropOnCat(e) {
    e.preventDefault();
    const sep = e.currentTarget;
    sep.classList.remove("drop-onto");
    let payload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); }
    catch(err) { return; }
    const fromKind = payload.kind;
    if (fromKind !== sep.dataset.kind) return;
    const fromIdx = payload.idx;
    const targetCat = sep.dataset.cat || "";

    const arr = fromKind === "music" ? this.cfg.music : this.cfg.sfx;
    const moved = arr[fromIdx];
    moved.category = targetCat;

    // On pose l'item juste après le séparateur dans le tableau plat :
    // = avant le 1er item de la cat target s'il y en a, sinon en queue.
    arr.splice(fromIdx, 1);
    const firstOfTargetCat = arr.findIndex(it => (it.category || "") === targetCat);
    const insertAt = firstOfTargetCat >= 0 ? firstOfTargetCat : arr.length;
    arr.splice(insertAt, 0, moved);

    this._recalcPositions(fromKind);
    this.render();
  },

  // Recalcule pos par catégorie : 1,2,3 dans chaque cat indépendamment.
  _recalcPositions(kind) {
    const items = kind === "music" ? this.cfg.music : this.cfg.sfx;
    const counters = {};
    items.forEach(it => {
      const c = it.category || "";
      counters[c] = (counters[c] || 0) + 1;
      it.pos = counters[c];
    });
  },

  // ---- helpers ----
  _catSelect(kind, current, idx) {
    const list = kind === "music" ? this.cfg.musicCategories : this.cfg.sfxCategories;
    const onchange = kind === "music"
      ? `editor.updateMusic(${idx},'category',this.value)`
      : `editor.updateSfx(${idx},'category',this.value)`;
    let opts = `<option value="">— —</option>`;
    opts += list.map(c => {
      const sel = c.name === current ? "selected" : "";
      return `<option value="${this._esc(c.name)}" ${sel}>${this._esc(c.name)}</option>`;
    }).join("");
    return `<select onchange="${onchange}">${opts}</select>`;
  },

  updateMusic(i, field, value) { if (this.cfg.music[i]) this.cfg.music[i][field] = value; },
  updateSfx(i, field, value) { if (this.cfg.sfx[i]) this.cfg.sfx[i][field] = value; },

  // Volume saisi en %, stocké en 0..1
  updateMusicVol(i, pct) {
    if (!this.cfg.music[i]) return;
    let v = parseInt(pct, 10); if (isNaN(v)) v = 70;
    v = Math.max(0, Math.min(100, v));
    this.cfg.music[i].volume = v / 100;
  },
  updateSfxVol(i, pct) {
    if (!this.cfg.sfx[i]) return;
    let v = parseInt(pct, 10); if (isNaN(v)) v = 100;
    v = Math.max(0, Math.min(100, v));
    this.cfg.sfx[i].volume = v / 100;
  },

  _esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },

  // ---- play preview ----
  enablePlay(selector) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src");
        if (!src) return;
        if (this.currentBtn === btn) {
          if (this.audio.paused) this.audio.play(); else this.audio.pause();
          return;
        }
        document.querySelectorAll(selector).forEach(b => b.textContent = "▶");
        this.audio.src = src;
        this.audio.play();
        btn.textContent = "⏸";
        this.currentBtn = btn;
      });
    });
  },

  // ============================================================
  //  💾 SAVE  -> POST /save  (écrit config.json sur disque)
  // ============================================================
  async save() {
    if (!this.cfg) { alert("Aucune config chargée"); return; }

    // Cleanup défensif : retire les catégories orphelines avant d'écrire
    const fixed = this._cleanOrphans();
    if (fixed > 0) {
      // Re-render pour que l'UI reflète le cleanup
      this.render();
    }

    const json = JSON.stringify(this.cfg, null, 2);
    console.log("[save] POST /save (" + json.length + " octets)");
    try {
      const r = await fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: json
      });
      if (r.ok) {
        const data = await r.json().catch(() => ({}));
        if (data.ok) {
          const summary = data.summary || "";
          console.log("[save] OK", summary);
          alert("✅ config.json sauvegardé\n\n" + summary +
                "\n\n→ Tu peux maintenant Build (option 3 ou 5).");
          return;
        }
      }
      throw new Error("HTTP " + r.status);
    } catch (e) {
      console.warn("[save] serveur KO, fallback download:", e);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'config.json'; a.click();
      URL.revokeObjectURL(url);
      alert("⚠️ Serveur indisponible — config.json a été TÉLÉCHARGÉ.\nDéplace-le dans le dossier du projet.");
    }
  },

  // ============================================================
  //  RESCAN : relance vraiment le scan des dossiers music/sfx,
  //  puis recharge la page avec le config.json mis à jour.
  // ============================================================
  async rescan() {
    if (!confirm("Rescan : relire les fichiers dans music/ et sfx/ ?\n(Tes catégories, ordres et volumes sont préservés.)")) return;
    try {
      const r = await fetch("/scan", { method: "POST" });
      if (r.ok) {
        const data = await r.json().catch(() => ({}));
        console.log("[rescan] OK", data);
        location.reload();
        return;
      }
      throw new Error("HTTP " + r.status);
    } catch (e) {
      console.warn("[rescan] /scan KO, fallback simple reload:", e);
      alert("Le scan serveur a échoué. La page va juste recharger config.json.\nLance 'option 1' dans runme.bat pour un vrai scan.");
      location.reload();
    }
  },

  // Cleanup : tout item dont la catégorie n'existe plus = remis sans catégorie
  _cleanOrphans() {
    const mNames = new Set((this.cfg.musicCategories || []).map(c => c.name));
    const sNames = new Set((this.cfg.sfxCategories  || []).map(c => c.name));
    let fixed = 0;
    (this.cfg.music || []).forEach(m => {
      if (m.category && !mNames.has(m.category)) {
        console.warn("[cleanup] music orpheline:", m.file, "cat:", m.category, "-> ''");
        m.category = "";
        fixed++;
      }
    });
    (this.cfg.sfx || []).forEach(s => {
      if (s.category && !sNames.has(s.category)) {
        console.warn("[cleanup] sfx orpheline:", s.file, "cat:", s.category, "-> ''");
        s.category = "";
        fixed++;
      }
    });
    if (fixed > 0) console.log(`[cleanup] ${fixed} item(s) orphelin(s) corrigé(s)`);
    return fixed;
  }
};

// expose en global
window.editor = editor;

// Le script est chargé dynamiquement -> DOMContentLoaded peut être déjà passé.
// On boot tout de suite si le DOM est prêt, sinon on attend.
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => editor.load());
} else {
  editor.load();
}
