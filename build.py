from __future__ import annotations
import base64
import json
import mimetypes
import os
import re
import sys
import shutil

from src.scan import scan_project
from src.build_html import build_output_html

CONFIG_FILE = "config.json"
OUTPUT_FILE = "index.html"           # version light, auto-servi par GitHub Pages
PORTABLE_FILE = "index_aio.html"     # all-in-one : tout inliné en base64
EXPORT_DIR = "FOLDERTOEXPORT"


def _sanitize_name(name: str) -> str:
    """
    Transforme un nom de projet en nom de dossier sain :
    - vire les caracteres interdits Windows (<>:\"/\\|?*)
    - vire les emojis (non alnum unicode)
    - garde lettres (accents inclus), chiffres, espaces, tirets, etc.
    """
    if not name:
        return "soundboard"
    # caracteres interdits Windows
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name)
    # garde alnum unicode + ponctuation safe
    safe = "".join(c for c in name if c.isalnum() or c in " -_().,")
    safe = safe.strip(" .")
    safe = re.sub(r"\s+", " ", safe)   # collapse spaces multiples
    safe = safe[:80]                    # limite raisonnable
    return safe or "soundboard"


def _project_export_dir(cfg) -> str:
    """Retourne FOLDERTOEXPORT/<nom-projet-sanitize>/."""
    proj_name = (cfg or {}).get("project", {}).get("name") or "soundboard"
    sub = _sanitize_name(proj_name)
    return os.path.join(EXPORT_DIR, sub)


def load_config():
    if not os.path.exists(CONFIG_FILE):
        return None
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def _make_track(it, type_label, name_field, default_vol, want_cover):
    t = {
        "type": type_label,
        "file": it["file"],
        "name": it.get(name_field) or it["file"],
        "category": it.get("category") or "",
        "order": it.get("pos", 0),
        "volume": float(it.get("volume", default_vol)),
    }
    if want_cover:
        t["cover"] = it.get("cover")
    return t


# ------------------------------------------------------------------
#  SCAN  : ne JAMAIS écraser un config existant -- on merge.
# ------------------------------------------------------------------
def cmd_scan():
    """
    Le scan_project() de src/scan.py merge déjà l'existant
    (categories, volumes, loops, assignations par fichier).
    On préserve EN PLUS ici : project.name, project.themeColor,
    project.themeColor2, project.version.
    On NETTOIE le dossier covers/ avant pour repartir propre :
    les covers seront re-extraites depuis les ID3 tags des mp3.
    """
    # Vide covers/ pour repartir propre
    covers_dir = "covers"
    if os.path.isdir(covers_dir):
        for f in os.listdir(covers_dir):
            fp = os.path.join(covers_dir, f)
            if os.path.isfile(fp):
                try:
                    os.remove(fp)
                except OSError:
                    pass
    else:
        os.makedirs(covers_dir, exist_ok=True)

    new_cfg = scan_project()
    old = load_config() or {}

    # Préserve project.* si existant
    old_proj = old.get("project") or {}
    new_proj = new_cfg.get("project") or {}
    merged_proj = {
        "name":         old_proj.get("name") or new_proj.get("name") or "",
        "version":      old_proj.get("version") or new_proj.get("version") or 1,
        "themeColor":   old_proj.get("themeColor")  or new_proj.get("themeColor")  or "#667eea",
        "themeColor2":  old_proj.get("themeColor2") or new_proj.get("themeColor2") or "#764ba2",
    }

    # Si vraiment nouveau projet, demander un nom
    if not merged_proj["name"]:
        merged_proj["name"] = input("Nom du projet ? ").strip() or "My Soundboard"

    new_cfg["project"] = merged_proj
    save_config(new_cfg)
    print(f"OK config.json mis a jour ({len(new_cfg.get('music', []))} musiques, "
          f"{len(new_cfg.get('sfx', []))} sfx)")


# ------------------------------------------------------------------
#  BUILD : produit FOLDERTOEXPORT/ avec tout dedans
# ------------------------------------------------------------------
def _summarize_config(cfg, label="CONFIG"):
    """Imprime un résumé du config pour vérifier ce qui sera buildé."""
    proj = cfg.get("project", {}) or {}
    mcats = cfg.get("musicCategories", []) or []
    scats = cfg.get("sfxCategories", []) or []
    musics = cfg.get("music", []) or []
    sfx = cfg.get("sfx", []) or []
    print("=" * 60)
    print(f"[{label}]  config.json mtime: {_mtime(CONFIG_FILE)}")
    print(f"  Project   : {proj.get('name')!r}")
    print(f"  Theme     : {proj.get('themeColor')} / {proj.get('themeColor2')}")
    print(f"  Music cats ({len(mcats)}): {[c.get('name') for c in mcats]}")
    print(f"  SFX cats   ({len(scats)}): {[c.get('name') for c in scats]}")
    print(f"  Music tracks: {len(musics)}  |  SFX tracks: {len(sfx)}")
    # Détail par cat (pour voir l'ordre intra-cat)
    if musics:
        from collections import Counter
        by_cat = Counter(m.get("category") or "(sans cat)" for m in musics)
        print(f"    music par cat: {dict(by_cat)}")
    if sfx:
        from collections import Counter
        by_cat = Counter(s.get("category") or "(sans cat)" for s in sfx)
        print(f"    sfx par cat  : {dict(by_cat)}")
    print("=" * 60)


def _mtime(path):
    try:
        import datetime
        return datetime.datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M:%S")
    except OSError:
        return "?"


def _clean_orphans(cfg):
    """Retire les catégories orphelines des items (cat -> ''),
    avec un warning explicite par item concerné. Modifie cfg en place.
    """
    m_names = {c.get("name") for c in (cfg.get("musicCategories") or [])}
    s_names = {c.get("name") for c in (cfg.get("sfxCategories")   or [])}
    fixed = 0
    for m in cfg.get("music", []) or []:
        if m.get("category") and m.get("category") not in m_names:
            print(f"  WARN: music '{m.get('file')}' avait cat orpheline "
                  f"{m.get('category')!r} -> remis sans cat")
            m["category"] = ""
            fixed += 1
    for s in cfg.get("sfx", []) or []:
        if s.get("category") and s.get("category") not in s_names:
            print(f"  WARN: sfx '{s.get('file')}' avait cat orpheline "
                  f"{s.get('category')!r} -> remis sans cat")
            s["category"] = ""
            fixed += 1
    if fixed:
        print(f"  -> {fixed} orphelin(s) corrige(s) (config.json NON modifie, juste le build).")
    return fixed


def cmd_build():
    cfg = load_config()
    if not cfg:
        print("ERR Pas de config.json. Lance d'abord: python build.py scan")
        sys.exit(1)

    _summarize_config(cfg, "BUILD")
    _clean_orphans(cfg)

    # Transforme le config en format runtime player.
    # ORDRE FINAL = ordre des catégories (par cat.pos), puis ordre intra-tableau.
    def _emit(items_key, cats_key, type_label, name_field, default_vol, want_cover):
        items = cfg.get(items_key, [])
        cats  = cfg.get(cats_key, [])
        cat_order = [c["name"] for c in sorted(cats, key=lambda c: c.get("pos", 0))]
        # Map cat -> liste d'items dans l'ordre du tableau plat
        groups = {c: [] for c in cat_order}
        groups[""] = []   # bucket pour les items sans catégorie
        for it in items:
            c = it.get("category") or ""
            groups.setdefault(c, []).append(it)

        out = []
        # Cats déclarées d'abord (dans l'ordre)
        for c in cat_order:
            for it in groups.get(c, []):
                out.append(_make_track(it, type_label, name_field, default_vol, want_cover))
        # Items sans cat ensuite
        for it in groups.get("", []):
            out.append(_make_track(it, type_label, name_field, default_vol, want_cover))
        # Cats orphelines (présentes dans items mais pas dans cats déclarées)
        declared = set(cat_order) | {""}
        for c, lst in groups.items():
            if c in declared:
                continue
            for it in lst:
                out.append(_make_track(it, type_label, name_field, default_vol, want_cover))
        return out

    tracks = []
    tracks += _emit("music", "musicCategories", "music", "title", 0.7, True)
    tracks += _emit("sfx",   "sfxCategories",   "sfx",   "label", 1.0, False)

    runtime = {
        "project": cfg.get("project", {}),
        "tracks": tracks,
    }

    html = build_output_html(runtime, is_portable=False)

    # 1) Sous-dossier projet : FOLDERTOEXPORT/<nom-projet>/
    project_dir = _project_export_dir(cfg)
    if os.path.exists(project_dir):
        shutil.rmtree(project_dir)
    os.makedirs(project_dir, exist_ok=True)

    # 2) On écrit output.html dans le sous-dossier projet
    out_path = os.path.join(project_dir, OUTPUT_FILE)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    # 3) On copie SEULEMENT les fichiers utilisés (par le config),
    #    pas tout le dossier source. Ca évite les leftovers.
    used_music = {m["file"] for m in cfg.get("music", []) if m.get("file")}
    used_sfx = {s["file"] for s in cfg.get("sfx", []) if s.get("file")}
    used_covers = {m["cover"] for m in cfg.get("music", []) if m.get("cover")}

    _copy_subset("music", os.path.join(project_dir, "music"), used_music)
    _copy_subset("sfx",   os.path.join(project_dir, "sfx"),   used_sfx)

    # Covers (chemins relatifs depuis racine, ex: "covers/xxx.jpg")
    if used_covers:
        os.makedirs(os.path.join(project_dir, "covers"), exist_ok=True)
        for rel in used_covers:
            if os.path.exists(rel):
                dst = os.path.join(project_dir, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(rel, dst)

    # 4) Copie du config.json pour debug
    shutil.copy2(CONFIG_FILE, os.path.join(project_dir, CONFIG_FILE))

    rel_project_dir = os.path.relpath(project_dir).replace("\\", "/")
    print(f"OK {rel_project_dir}/ pret ({_dir_size_mb(project_dir):.1f} MB)")
    print(f"   -> ouvre {os.path.relpath(out_path)} en double-clic,")
    print(f"      ou copie tout {rel_project_dir}/ sur tablette.")


def _copy_subset(src_dir: str, dst_dir: str, files: set):
    if not files:
        return
    os.makedirs(dst_dir, exist_ok=True)
    for f in files:
        src = os.path.join(src_dir, f)
        dst = os.path.join(dst_dir, f)
        if os.path.exists(src):
            shutil.copy2(src, dst)


def _dir_size_mb(path: str) -> float:
    total = 0
    for dp, _, fs in os.walk(path):
        for f in fs:
            try:
                total += os.path.getsize(os.path.join(dp, f))
            except OSError:
                pass
    return total / (1024 * 1024)


def _file_to_data_uri(path: str) -> str | None:
    """Lit un fichier local et le retourne en data URI base64. None si introuvable."""
    if not path or not os.path.isfile(path):
        return None
    mime, _ = mimetypes.guess_type(path)
    if not mime:
        # fallback selon extension
        ext = os.path.splitext(path)[1].lower()
        mime = {
            ".mp3":  "audio/mpeg",
            ".ogg":  "audio/ogg",
            ".wav":  "audio/wav",
            ".m4a":  "audio/mp4",
            ".jpg":  "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png":  "image/png",
            ".webp": "image/webp",
        }.get(ext, "application/octet-stream")
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def cmd_build_portable(clean: bool = True):
    """
    Build ALL-IN-ONE : produit un SEUL fichier HTML auto-suffisant
    (index_aio.html), avec tous les mp3 + covers inlinés en base64.

    `clean=True` (défaut) vide le sous-dossier projet avant écriture.
    `clean=False` ajoute juste index_aio.html à un dossier existant
    (utile depuis cmd_build_all qui a déjà créé le light).
    """
    cfg = load_config()
    if not cfg:
        print("ERR Pas de config.json. Lance d'abord: python build.py scan")
        sys.exit(1)

    _summarize_config(cfg, "BUILD PORTABLE")
    _clean_orphans(cfg)
    print("Encodage en base64 en cours (peut prendre 30s+ si beaucoup de mp3)...")

    # Map fichier -> data URI (cache pour éviter de relire le même mp3 plusieurs fois)
    audio_cache = {}
    cover_cache = {}

    def audio_uri(folder: str, filename: str):
        key = folder + "/" + filename
        if key not in audio_cache:
            audio_cache[key] = _file_to_data_uri(os.path.join(folder, filename))
        return audio_cache[key]

    def cover_uri(rel_path: str):
        if not rel_path:
            return None
        if rel_path not in cover_cache:
            cover_cache[rel_path] = _file_to_data_uri(rel_path)
        return cover_cache[rel_path]

    tracks = []
    for m in cfg.get("music", []):
        data_audio = audio_uri("music", m["file"])
        if not data_audio:
            print(f"  WARN: music/{m['file']} introuvable, skip")
            continue
        tracks.append({
            "type": "music",
            "file": data_audio,                 # data URI à la place du chemin
            "name": m["title"],
            "category": m["category"],
            "order": m["pos"],
            "volume": float(m.get("volume", 0.7)),
            "cover": cover_uri(m.get("cover")),  # data URI pour la cover aussi
        })
    for s in cfg.get("sfx", []):
        data_audio = audio_uri("sfx", s["file"])
        if not data_audio:
            print(f"  WARN: sfx/{s['file']} introuvable, skip")
            continue
        tracks.append({
            "type": "sfx",
            "file": data_audio,
            "name": s["label"],
            "category": s["category"],
            "order": s["pos"],
            "volume": float(s.get("volume", 1.0)),
        })

    # Réordonne selon les catégories
    cat_pos_music = {c["name"]: c.get("pos", 0) for c in cfg.get("musicCategories", [])}
    cat_pos_sfx   = {c["name"]: c.get("pos", 0) for c in cfg.get("sfxCategories", [])}
    def cat_key(t):
        m = cat_pos_music if t["type"] == "music" else cat_pos_sfx
        return (m.get(t.get("category"), 999), t.get("order", 0))
    tracks_music = [t for t in tracks if t["type"] == "music"]
    tracks_sfx   = [t for t in tracks if t["type"] == "sfx"]
    tracks_music.sort(key=cat_key)
    tracks_sfx.sort(key=cat_key)
    tracks = tracks_music + tracks_sfx

    runtime = {
        "project": cfg.get("project", {}),
        "tracks": tracks,
    }
    html = build_output_html(runtime, is_portable=True)

    # Sortie dans le sous-dossier projet
    project_dir = _project_export_dir(cfg)
    if clean and os.path.exists(project_dir):
        shutil.rmtree(project_dir)
    os.makedirs(project_dir, exist_ok=True)
    out_path = os.path.join(project_dir, PORTABLE_FILE)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    rel = os.path.relpath(out_path).replace("\\", "/")
    print(f"OK {rel} ({size_mb:.1f} MB) -- un SEUL fichier auto-suffisant.")
    print(f"   Copie-le sur ta tablette, ouvre-le n'importe comment, ca marche.")


def cmd_build_all():
    """Build LIGHT puis ALL-IN-ONE dans le meme sous-dossier projet.
    Resultat : index.html + index_aio.html + music/ + sfx/ + covers/.
    """
    print(">> [1/2] Build LIGHT (index.html + dossiers)")
    cmd_build()
    print()
    print(">> [2/2] Build ALL-IN-ONE (index_aio.html, base64)")
    cmd_build_portable(clean=False)


def main():
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "build"
    if arg == "scan":
        cmd_scan()
    elif arg == "build":
        cmd_build()
    elif arg == "portable":
        cmd_build_portable()
    elif arg == "all":
        cmd_build_all()
    else:
        print("Usage: python build.py [scan|build|portable|all]")


if __name__ == "__main__":
    main()
