"""SoundBoardHTMLMaker — builder de soundboards / interfaces de jeux de société.

Chaque jeu vit dans games/<jeu>/ :
    config.json   musiques, sfx, catégories, options (project.*)
    music/ sfx/   tes mp3
    covers/       pochettes (extraites des tags ID3 par le scan)
    inject/       (optionnel) HTML ajouté au player : head-start.html, head.html, header.html, body.html
    extras/       (optionnel) fichiers copiés tels quels dans l'export (scripts, images, pages...)

Le build produit FOLDERTOEXPORT/<jeu>/ : on ne modifie JAMAIS ce dossier à la main.

Usage : python build.py <commande> [jeu]
    list                 liste les jeux (★ = jeu courant)
    use <jeu>            choisit le jeu courant (utilisé par défaut ensuite)
    new "<Nom>" [id]     crée un nouveau jeu à partir de games/_template/
    scan [jeu]           lit les mp3 et met à jour config.json (tes réglages sont conservés)
    build [jeu]          export LIGHT  : index.html + dossiers
    portable [jeu]       export AiO    : index_aio.html autonome (mp3 en base64)
    all [jeu]            LIGHT + AiO
    build-all            export LIGHT de tous les jeux + page d'accueil
    portal               régénère la page d'accueil (index.html à la racine)
    path [jeu] [light|portable]   affiche le chemin du player (utilisé par runme.bat)
"""
from __future__ import annotations
import base64
import html as htmlmod
import json
import mimetypes
import os
import shutil
import sys

from src import games as G
from src.build_html import build_output_html, tpl
from src.scan import scan_and_save
from src.convert import convert_folder

CONFIG_FILE = "config.json"
OUTPUT_FILE = "index.html"           # version light (servie par GitHub Pages)
PORTABLE_FILE = "index_aio.html"     # all-in-one : tout inliné en base64
MANIFEST = ".sb-build.json"          # liste des fichiers générés (pour nettoyer sans rien casser)


def load_config():
    if not os.path.exists(CONFIG_FILE):
        return None
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------------
#  Résumé / nettoyage du config
# ------------------------------------------------------------------
def _summarize_config(cfg, label="CONFIG"):
    proj = cfg.get("project", {}) or {}
    print("=" * 60)
    print(f"[{label}]  {os.path.relpath(os.getcwd(), G.ROOT)}{os.sep}{CONFIG_FILE}")
    print(f"  Projet    : {proj.get('name')!r}")
    print(f"  Thème     : {proj.get('themeColor')} / {proj.get('themeColor2')}"
          f"   | hors-ligne : {proj.get('offline') or 'non'}")
    print(f"  Catégories: {len(cfg.get('musicCategories') or [])} musique, {len(cfg.get('sfxCategories') or [])} sfx")
    print(f"  Pistes    : {len(cfg.get('music') or [])} musiques | {len(cfg.get('sfx') or [])} sfx")
    print("=" * 60)


def _item_categories(it):
    """Catégories d'un item : `categories` (array) ou `category` (string, legacy)."""
    cats = it.get("categories")
    if isinstance(cats, list) and cats:
        return list(cats)
    one = it.get("category")
    return [one] if one else [""]


def _clean_orphans(cfg):
    """Retire les catégories orphelines des items (dans le build seulement)."""
    m_names = {c.get("name") for c in (cfg.get("musicCategories") or [])}
    s_names = {c.get("name") for c in (cfg.get("sfxCategories") or [])}
    fixed = 0

    def _clean(it, valid):
        nonlocal fixed
        if isinstance(it.get("categories"), list):
            removed = [c for c in it["categories"] if c not in valid]
            if removed:
                print(f"  WARN: '{it.get('file')}' catégories orphelines retirées : {removed}")
                fixed += 1
            it["categories"] = [c for c in it["categories"] if c in valid]
        elif it.get("category") and it.get("category") not in valid:
            print(f"  WARN: '{it.get('file')}' catégorie orpheline {it.get('category')!r} -> sans catégorie")
            it["category"] = ""
            fixed += 1

    for m in cfg.get("music", []) or []:
        _clean(m, m_names)
    for s in cfg.get("sfx", []) or []:
        _clean(s, s_names)
    return fixed


def _runtime_tracks(cfg):
    """Config -> pistes du player, dans l'ordre des catégories (un item multi-catégorie est émis une fois par catégorie)."""
    def _make_track(it, type_label, name_field, default_vol, want_cover, cat):
        t = {
            "type": type_label,
            "file": it["file"],
            "name": it.get(name_field) or it["file"],
            "category": cat,
            "order": it.get("pos", 0),
            "volume": float(it.get("volume", default_vol)),
        }
        if want_cover:
            t["cover"] = it.get("cover")
        return t

    def _emit(items_key, cats_key, type_label, name_field, default_vol, want_cover):
        cat_order = [c["name"] for c in sorted(cfg.get(cats_key, []), key=lambda c: c.get("pos", 0))]
        groups = {c: [] for c in cat_order}
        groups[""] = []
        for it in cfg.get(items_key, []):
            for c in _item_categories(it):
                groups.setdefault(c, []).append(it)
        ordered = cat_order + [""] + [c for c in groups if c not in set(cat_order) | {""}]
        return [_make_track(it, type_label, name_field, default_vol, want_cover, c)
                for c in ordered for it in groups.get(c, [])]

    return (_emit("music", "musicCategories", "music", "title", 0.7, True)
            + _emit("sfx", "sfxCategories", "sfx", "label", 1.0, False))


# ------------------------------------------------------------------
#  Export : écrit les fichiers + manifeste (ne supprime QUE ce que le build avait lui-même créé)
# ------------------------------------------------------------------
class Export:
    def __init__(self, out_dir: str):
        self.out_dir = out_dir
        self.files: set[str] = set()
        self.old = self._read_manifest()
        os.makedirs(out_dir, exist_ok=True)

    def _read_manifest(self):
        try:
            with open(os.path.join(self.out_dir, MANIFEST), encoding="utf-8") as f:
                return set(json.load(f).get("files", []))
        except (OSError, ValueError):
            return set()

    def write(self, rel: str, content: str):
        p = os.path.join(self.out_dir, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        self.files.add(rel.replace("\\", "/"))

    def copy(self, src: str, rel: str):
        if not os.path.isfile(src):
            print(f"  WARN: introuvable : {src}")
            return
        dst = os.path.join(self.out_dir, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if not (os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src)
                and os.path.getmtime(dst) >= os.path.getmtime(src)):
            shutil.copy2(src, dst)
        self.files.add(rel.replace("\\", "/"))

    def copy_tree(self, src_dir: str):
        for dp, dns, fns in os.walk(src_dir):
            dns[:] = [d for d in dns if d not in ("__pycache__",)]
            for fn in fns:
                if fn == ".gitkeep":
                    continue
                src = os.path.join(dp, fn)
                self.copy(src, os.path.relpath(src, src_dir))

    def finish(self, keep_from_old=()):
        """Supprime les fichiers générés lors du build précédent qui ne le sont plus."""
        keep = {k for k in keep_from_old if k in self.old and os.path.exists(os.path.join(self.out_dir, k))}
        self.files |= keep
        stale = sorted(self.old - self.files)
        for rel in stale:
            p = os.path.join(self.out_dir, rel)
            if os.path.isfile(p):
                os.remove(p)
        for rel in stale:  # dossiers devenus vides
            d = os.path.dirname(os.path.join(self.out_dir, rel))
            while d and os.path.normpath(d) != os.path.normpath(self.out_dir):
                try:
                    os.rmdir(d)
                except OSError:
                    break
                d = os.path.dirname(d)
        with open(os.path.join(self.out_dir, MANIFEST), "w", encoding="utf-8", newline="\n") as f:
            json.dump({"files": sorted(self.files)}, f, ensure_ascii=False, indent=1)
        if stale:
            print(f"  {len(stale)} ancien(s) fichier(s) généré(s) retiré(s).")


def _dir_size_mb(path: str) -> float:
    return sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(path) for f in fs) / (1024 * 1024)


def _load_game(game: str):
    gdir = G.game_dir(game)
    with G.inside(gdir):
        cfg = load_config()
    if not cfg:
        raise SystemExit(f"ERR Pas de config.json dans games/{game}/. Lance d'abord : python build.py scan {game}")
    return gdir, cfg


# ------------------------------------------------------------------
#  Commandes
# ------------------------------------------------------------------
def cmd_scan(game: str):
    gdir = G.game_dir(game)
    with G.inside(gdir):
        cfg = scan_and_save(wipe_covers=True)
        if not (cfg.get("project") or {}).get("name"):
            name = input("Nom du projet ? ").strip() or game
            cfg["project"]["name"] = name
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f"OK games/{game}/config.json mis à jour ({len(cfg.get('music', []))} musiques, {len(cfg.get('sfx', []))} sfx)")


def cmd_build(game: str, keep_portable: bool = False, portal: bool = True):
    gdir, cfg = _load_game(game)
    with G.inside(gdir):
        convert_folder("music")      # un .wav déposé devient un .mp3 (l'original reste en local)
        convert_folder("sfx")
        _summarize_config(cfg, f"BUILD {game}")
    _clean_orphans(cfg)
    runtime = {"project": cfg.get("project", {}), "tracks": _runtime_tracks(cfg)}
    html = build_output_html(runtime, is_portable=False, game_dir=gdir)

    out_dir = G.export_dir(game)
    ex = Export(out_dir)
    ex.write(OUTPUT_FILE, html)
    # Tout le contenu de music/ sfx/ covers/ est exporté (les scripts d'un jeu peuvent
    # jouer un son qui n'est pas listé dans le soundboard).
    for d in ("music", "sfx", "covers"):
        src = os.path.join(gdir, d)
        if os.path.isdir(src):
            for fn in sorted(os.listdir(src)):
                if os.path.isfile(os.path.join(src, fn)) and not fn.startswith(".") and not fn.lower().endswith(".wav"):
                    ex.copy(os.path.join(src, fn), f"{d}/{fn}")
    for m in cfg.get("music", []):   # pochette rangée ailleurs que dans covers/
        if m.get("cover") and not m["cover"].startswith("covers/"):
            ex.copy(os.path.join(gdir, m["cover"]), m["cover"])
    if (cfg.get("project") or {}).get("offline"):
        ex.write("sw.js", tpl("sw.js"))
    extras = os.path.join(gdir, "extras")
    if os.path.isdir(extras):
        ex.copy_tree(extras)          # les extras du jeu passent en dernier (peuvent remplacer sw.js)
    ex.copy(os.path.join(gdir, CONFIG_FILE), CONFIG_FILE)
    ex.finish(keep_from_old=[PORTABLE_FILE] if keep_portable else [])

    rel = os.path.relpath(out_dir, G.ROOT).replace("\\", "/")
    print(f"OK {rel}/ prêt ({_dir_size_mb(out_dir):.1f} MB) -> ouvre {rel}/{OUTPUT_FILE}")
    if portal:
        cmd_portal(quiet=True)


def _file_to_data_uri(path: str) -> str | None:
    if not path or not os.path.isfile(path):
        return None
    mime, _ = mimetypes.guess_type(path)
    if not mime:
        ext = os.path.splitext(path)[1].lower()
        mime = {".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".m4a": "audio/mp4",
                ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"
                }.get(ext, "application/octet-stream")
    with open(path, "rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode('ascii')}"


def cmd_build_portable(game: str):
    """Un SEUL fichier HTML autonome (index_aio.html) avec mp3 + covers en base64."""
    gdir, cfg = _load_game(game)
    with G.inside(gdir):
        _summarize_config(cfg, f"BUILD PORTABLE {game}")
    _clean_orphans(cfg)
    print("Encodage en base64 en cours (peut prendre 30s+ si beaucoup de mp3)...")
    cache = {}

    def uri(rel):
        if rel and rel not in cache:
            cache[rel] = _file_to_data_uri(os.path.join(gdir, rel))
        return cache.get(rel)

    tracks = []
    for kind, folder, name_field, vol in (("music", "music", "title", 0.7), ("sfx", "sfx", "label", 1.0)):
        for it in cfg.get(kind, []):
            data = uri(f"{folder}/{it['file']}")
            if not data:
                print(f"  WARN: {folder}/{it['file']} introuvable, ignoré")
                continue
            for cat in _item_categories(it):
                t = {"type": kind, "file": data, "name": it.get(name_field) or it["file"], "category": cat,
                     "order": it.get("pos", 0), "volume": float(it.get("volume", vol))}
                if kind == "music":
                    t["cover"] = uri(it.get("cover"))
                tracks.append(t)
    pos = {k: {c["name"]: c.get("pos", 0) for c in cfg.get(k + "Categories", [])} for k in ("music", "sfx")}
    tracks.sort(key=lambda t: (t["type"] != "music", pos[t["type"]].get(t.get("category"), 999), t.get("order", 0)))

    html = build_output_html({"project": cfg.get("project", {}), "tracks": tracks}, is_portable=True, game_dir=gdir)
    out_dir = G.export_dir(game)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, PORTABLE_FILE), "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    # ajoute index_aio.html au manifeste sans toucher au reste
    ex = Export(out_dir)
    ex.files = set(ex.old) | {PORTABLE_FILE}
    ex.finish()
    p = os.path.join(out_dir, PORTABLE_FILE)
    print(f"OK {os.path.relpath(p, G.ROOT)} ({os.path.getsize(p) / 1048576:.1f} MB) — un seul fichier autonome.")


def cmd_build_all_variants(game: str):
    print(">> [1/2] Build LIGHT")
    cmd_build(game)
    print("\n>> [2/2] Build ALL-IN-ONE")
    cmd_build_portable(game)


def cmd_build_every_game():
    for g in G.list_games():
        cmd_build(g, keep_portable=True, portal=False)
        print()
    cmd_portal()


def cmd_portal(quiet: bool = False):
    """Page d'accueil (index.html à la racine) : liste des jeux exportés, pour GitHub Pages."""
    cards = []
    for g in G.list_games():
        try:
            with open(os.path.join(G.game_dir(g), CONFIG_FILE), encoding="utf-8") as f:
                proj = json.load(f).get("project", {})
        except (OSError, ValueError):
            continue
        out_rel = os.path.relpath(G.export_dir(g), G.ROOT).replace("\\", "/")
        if not os.path.isfile(os.path.join(G.ROOT, out_rel, OUTPUT_FILE)):
            continue
        href = lambda p: "/".join(part.replace(" ", "%20") for part in f"{out_rel}/{p}".split("/"))
        e = htmlmod.escape
        links = "".join(f'<a class="sub" href="{href(l["href"])}">{e(l.get("title", l["href"]))}</a>'
                        for l in proj.get("links", []) if l.get("href"))
        cards.append(
            f'<article class="game" style="--c1:{e(proj.get("themeColor", "#667eea"))};--c2:{e(proj.get("themeColor2", "#764ba2"))}">'
            f'<h2>{e(proj.get("name", g))}</h2><p>{e(proj.get("description", ""))}</p>'
            f'<div class="links"><a class="main" href="{href(OUTPUT_FILE)}">▶ Ouvrir</a>{links}</div></article>')
    page = tpl("portal.html").replace("{{CARDS}}", "\n".join(cards) or "<p>Aucun jeu exporté pour l'instant.</p>")
    with open(os.path.join(G.ROOT, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    if not quiet:
        print(f"OK index.html (page d'accueil) : {len(cards)} jeu(x)")


def cmd_new(name: str, game_id: str | None = None):
    gid = game_id or G.slugify(name)
    dst = G.game_dir(gid)
    if os.path.exists(dst):
        raise SystemExit(f"ERR games/{gid}/ existe déjà.")
    shutil.copytree(G.game_dir(G.TEMPLATE_ID), dst)
    with G.inside(dst):
        cfg = load_config()
        cfg["project"]["name"] = name
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    G.set_current(gid)
    print(f"OK games/{gid}/ créé (jeu courant). Mets tes mp3 dans games/{gid}/music et games/{gid}/sfx, puis : python build.py scan")


def cmd_list():
    cur = G.get_current()
    for g in G.list_games():
        try:
            with open(os.path.join(G.game_dir(g), CONFIG_FILE), encoding="utf-8") as f:
                name = json.load(f).get("project", {}).get("name", "")
        except (OSError, ValueError):
            name = "?"
        print(f" {'★' if g == cur else ' '} {g:<20} {name}")


def main():
    args = sys.argv[1:]
    cmd = (args[0].lower() if args else "help")
    rest = args[1:]
    if cmd == "list":
        cmd_list()
    elif cmd == "use":
        g = G.resolve(rest[0] if rest else None)
        G.set_current(g)
        print(f"Jeu courant : {g}")
    elif cmd == "current":
        print(G.get_current() or "")
    elif cmd == "new":
        if not rest:
            raise SystemExit('Usage : python build.py new "Nom du jeu" [id]')
        cmd_new(rest[0], rest[1] if len(rest) > 1 else None)
    elif cmd == "scan":
        cmd_scan(G.resolve(rest[0] if rest else None))
    elif cmd == "build":
        cmd_build(G.resolve(rest[0] if rest else None))
    elif cmd == "portable":
        cmd_build_portable(G.resolve(rest[0] if rest else None))
    elif cmd == "all":
        cmd_build_all_variants(G.resolve(rest[0] if rest else None))
    elif cmd == "build-all":
        cmd_build_every_game()
    elif cmd == "portal":
        cmd_portal()
    elif cmd == "path":
        g = G.resolve(rest[0] if rest else None)
        which = rest[1] if len(rest) > 1 else "light"
        print(os.path.join(G.export_dir(g), PORTABLE_FILE if which == "portable" else OUTPUT_FILE))
    else:
        print(__doc__)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
