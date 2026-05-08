from __future__ import annotations
import json
import os
import sys
import shutil

from src.scan import scan_project
from src.build_html import build_output_html

CONFIG_FILE = "config.json"
OUTPUT_FILE = "output.html"
EXPORT_DIR = "FOLDERTOEXPORT"


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
def cmd_build():
    cfg = load_config()
    if not cfg:
        print("ERR Pas de config.json. Lance d'abord: python build.py scan")
        sys.exit(1)

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

    html = build_output_html(runtime)

    # 1) On crée FOLDERTOEXPORT/ propre
    if os.path.exists(EXPORT_DIR):
        shutil.rmtree(EXPORT_DIR)
    os.makedirs(EXPORT_DIR, exist_ok=True)

    # 2) On écrit output.html dedans
    out_path = os.path.join(EXPORT_DIR, OUTPUT_FILE)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    # 3) On copie SEULEMENT les fichiers utilisés (par le config),
    #    pas tout le dossier source. Ca évite les leftovers.
    used_music = {m["file"] for m in cfg.get("music", []) if m.get("file")}
    used_sfx = {s["file"] for s in cfg.get("sfx", []) if s.get("file")}
    used_covers = {m["cover"] for m in cfg.get("music", []) if m.get("cover")}

    _copy_subset("music", os.path.join(EXPORT_DIR, "music"), used_music)
    _copy_subset("sfx",   os.path.join(EXPORT_DIR, "sfx"),   used_sfx)

    # Les covers sont en chemin relatif (ex: "covers/xxx.jpg")
    if used_covers:
        target_cov = os.path.join(EXPORT_DIR, "covers")
        os.makedirs(target_cov, exist_ok=True)
        for rel in used_covers:
            src = rel  # déjà relatif depuis racine projet
            if os.path.exists(src):
                dst = os.path.join(EXPORT_DIR, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)

    # 4) Aussi : on garde une copie du config.json pour debug
    shutil.copy2(CONFIG_FILE, os.path.join(EXPORT_DIR, CONFIG_FILE))

    print(f"OK FOLDERTOEXPORT/ pret ({_dir_size_mb(EXPORT_DIR):.1f} MB)")
    print(f"   -> ouvre {out_path} en double-clic, ou copie tout {EXPORT_DIR}/ sur tablette.")


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


def main():
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "build"
    if arg == "scan":
        cmd_scan()
    elif arg == "build":
        cmd_build()
    else:
        print("Usage: python build.py [scan|build]")


if __name__ == "__main__":
    main()
