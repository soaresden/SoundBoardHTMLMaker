from __future__ import annotations
import os
import json
from typing import Dict, List, Any, Optional
from .id3 import read_mp3_tags

CONFIG_FILE = "config.json"


def _load_existing() -> Optional[Dict[str, Any]]:
    if not os.path.exists(CONFIG_FILE):
        return None
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _list_mp3(folder: str) -> List[str]:
    if not os.path.isdir(folder):
        return []
    return sorted(f for f in os.listdir(folder) if f.lower().endswith(".mp3"))


def _recalc_positions(items: List[Dict[str, Any]]) -> None:
    """pos = position dans la catégorie (1, 2, 3 par cat indépendamment)."""
    counters: Dict[str, int] = {}
    for it in items:
        # Pour le calcul de pos, on utilise la 1ere cat du array si multi-cat,
        # sinon la cat string. C'est l'ordre d'apparition dans la cat "primaire".
        cats = it.get("categories")
        if isinstance(cats, list) and cats:
            c = cats[0] or ""
        else:
            c = it.get("category") or ""
        counters[c] = counters.get(c, 0) + 1
        it["pos"] = counters[c]


def scan_project(music_dir: str = "music",
                 sfx_dir:   str = "sfx",
                 covers_dir: str = "covers") -> Dict[str, Any]:
    """
    Scan idempotent : NE JAMAIS écraser les choix utilisateur.
    - Préserve l'ordre du tableau plat (drag & drop dans l'editor)
    - Préserve catégories, volumes, assignations par fichier
    - Ajoute en queue les nouveaux mp3 (catégorie vide)
    - Retire les fichiers qui ont disparu du disque
    - Recalcule les pos par catégorie à la fin
    """
    old = _load_existing() or {}
    old_music_ordered = list(old.get("music", []))
    old_sfx_ordered   = list(old.get("sfx", []))

    fs_music = set(_list_mp3(music_dir))
    fs_sfx   = set(_list_mp3(sfx_dir))

    # ---------- MUSIC ----------
    musics: List[Dict[str, Any]] = []
    seen_music = set()
    # 1) garder l'ordre des morceaux existants encore présents
    for m in old_music_ordered:
        f = m.get("file")
        if not f or f not in fs_music:
            continue
        seen_music.add(f)
        tags = read_mp3_tags(os.path.join(music_dir, f), covers_dir=covers_dir)
        cover_rel = tags.cover_path.replace("\\", "/") if tags.cover_path else None
        entry = {
            "file": f,
            "title": m.get("title") or tags.title or os.path.splitext(f)[0],
            "disc":  m.get("disc",  tags.disc),
            "track": m.get("track", tags.track),
            "category": m.get("category", ""),
            "pos": m.get("pos", 0),
            "volume": m.get("volume", 0.7),
            "cover": m.get("cover") or cover_rel,
        }
        # Preserve `categories` (array) si defini -> support multi-cat
        if isinstance(m.get("categories"), list) and m.get("categories"):
            entry["categories"] = list(m["categories"])
        musics.append(entry)
    # 2) ajouter les NOUVEAUX morceaux en queue
    for f in sorted(fs_music):
        if f in seen_music:
            continue
        tags = read_mp3_tags(os.path.join(music_dir, f), covers_dir=covers_dir)
        cover_rel = tags.cover_path.replace("\\", "/") if tags.cover_path else None
        musics.append({
            "file": f,
            "title": tags.title or os.path.splitext(f)[0],
            "disc":  tags.disc,
            "track": tags.track,
            "category": "",
            "pos": 0,
            "volume": 0.7,
            "cover": cover_rel,
        })

    # ---------- SFX ----------
    sfx: List[Dict[str, Any]] = []
    seen_sfx = set()
    for s in old_sfx_ordered:
        f = s.get("file")
        if not f or f not in fs_sfx:
            continue
        seen_sfx.add(f)
        entry = {
            "file": f,
            "label": s.get("label") or os.path.splitext(f)[0],
            "category": s.get("category", ""),
            "pos": s.get("pos", 0),
            "volume": s.get("volume", 1.0),
        }
        if isinstance(s.get("categories"), list) and s.get("categories"):
            entry["categories"] = list(s["categories"])
        sfx.append(entry)
    for f in sorted(fs_sfx):
        if f in seen_sfx:
            continue
        sfx.append({
            "file": f,
            "label": os.path.splitext(f)[0],
            "category": "",
            "pos": 0,
            "volume": 1.0,
        })

    # ---------- POS par catégorie ----------
    _recalc_positions(musics)
    _recalc_positions(sfx)

    # ---------- PROJECT preservé ----------
    project = dict(old.get("project") or {})
    project.setdefault("name", "")
    project.setdefault("version", 1)
    project.setdefault("themeColor",  "#667eea")
    project.setdefault("themeColor2", "#764ba2")

    return {
        "project": project,
        "musicCategories": old.get("musicCategories", []),
        "sfxCategories":   old.get("sfxCategories", []),
        "music": musics,
        "sfx":   sfx,
    }
