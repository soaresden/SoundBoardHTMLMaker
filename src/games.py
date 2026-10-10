"""Gestion des jeux : chaque jeu vit dans games/<id>/ (config.json, music/, sfx/, covers/, extras/, inject/)."""
from __future__ import annotations
import os
import re
import contextlib
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT, "games")
EXPORT_DIR = os.path.join(ROOT, "FOLDERTOEXPORT")
TEMPLATE_ID = "_template"
CURRENT_FILE = os.path.join(ROOT, ".current_game")


def list_games(include_template: bool = False) -> list[str]:
    if not os.path.isdir(GAMES_DIR):
        return []
    out = []
    for d in sorted(os.listdir(GAMES_DIR)):
        p = os.path.join(GAMES_DIR, d)
        if not os.path.isdir(p) or not os.path.isfile(os.path.join(p, "config.json")):
            continue
        if d.startswith("_") and not (include_template and d == TEMPLATE_ID):
            continue
        out.append(d)
    return out


def game_dir(game_id: str) -> str:
    return os.path.join(GAMES_DIR, game_id)


def get_current() -> str | None:
    try:
        with open(CURRENT_FILE, encoding="utf-8") as f:
            g = f.read().strip()
        return g if g in list_games(include_template=True) else None
    except OSError:
        return None


def set_current(game_id: str) -> None:
    with open(CURRENT_FILE, "w", encoding="utf-8") as f:
        f.write(game_id)


def resolve(arg: str | None) -> str:
    """Trouve le jeu demandé : id exact, début d'id, ou jeu courant / unique."""
    games = list_games(include_template=True)
    if arg:
        if arg in games:
            return arg
        low = arg.lower()
        hits = [g for g in games if g.lower().startswith(low)] or [g for g in games if low in g.lower()]
        if len(hits) == 1:
            return hits[0]
        raise SystemExit(f"ERR Jeu introuvable ou ambigu : {arg!r}. Jeux : {', '.join(list_games()) or '(aucun)'}")
    cur = get_current()
    if cur:
        return cur
    real = list_games()
    if len(real) == 1:
        return real[0]
    raise SystemExit("ERR Précise le jeu (ou choisis-le avec : python build.py use <jeu>). "
                     f"Jeux : {', '.join(real) or '(aucun)'}")


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "mon-jeu"


def sanitize_folder(name: str) -> str:
    """Nom de projet -> nom de dossier d'export (caractères interdits et emojis retirés)."""
    if not name:
        return "soundboard"
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name)
    safe = "".join(c for c in name if c.isalnum() or c in " -_().,")
    safe = re.sub(r"\s+", " ", safe.strip(" ."))[:80]
    return safe or "soundboard"


def export_dir(game_id: str) -> str:
    """Dossier d'export d'un jeu : FOLDERTOEXPORT/<id du jeu>/ (URL courte et stable)."""
    return os.path.join(EXPORT_DIR, game_id)


@contextlib.contextmanager
def inside(path: str):
    """Exécute un bloc avec `path` comme dossier courant (le scan/build travaillent en chemins relatifs)."""
    old = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)
