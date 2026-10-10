from __future__ import annotations
import os
import re
from dataclasses import dataclass
from typing import Optional, Tuple

from mutagen import File as MutagenFile

def _safe_filename(s: str) -> str:
    s = re.sub(r"[^\w\-. ]+", "_", s, flags=re.UNICODE)
    s = s.strip().replace(" ", "_")
    return s[:120] if len(s) > 120 else s

def _first(v):
    if v is None:
        return None
    if isinstance(v, (list, tuple)) and v:
        return v[0]
    return v

def _parse_track_disc(value) -> Optional[int]:
    # "3/12" -> 3
    if value is None:
        return None
    value = str(value)
    m = re.match(r"^\s*(\d+)", value)
    return int(m.group(1)) if m else None

@dataclass
class AudioTags:
    title: str
    disc: int
    track: int
    has_cover: bool
    cover_path: Optional[str]

def read_mp3_tags(mp3_path: str, covers_dir: str) -> AudioTags:
    audio = MutagenFile(mp3_path)
    title = os.path.splitext(os.path.basename(mp3_path))[0]
    disc = 0
    track = 0
    cover_path = None
    has_cover = False

    if audio and audio.tags:
        tags = audio.tags

        # TITRE
        for key in ("TIT2", "title"):
            if key in tags:
                title = str(_first(tags.get(key)))
                break

        # DISC
        for key in ("TPOS", "discnumber"):
            if key in tags:
                disc = _parse_track_disc(_first(tags.get(key))) or 0
                break

        # TRACK
        for key in ("TRCK", "tracknumber"):
            if key in tags:
                track = _parse_track_disc(_first(tags.get(key))) or 0
                break

        # COVER (ID3 APIC)
        # mutagen ID3: tags.getall('APIC')
        apics = None
        try:
            apics = tags.getall("APIC")
        except Exception:
            apics = None

        if apics:
            apic = apics[0]
            mime = getattr(apic, "mime", "image/jpeg")
            ext = "jpg" if "jpeg" in mime else ("png" if "png" in mime else "bin")

            os.makedirs(covers_dir, exist_ok=True)
            base = _safe_filename(os.path.basename(mp3_path))
            out = os.path.join(covers_dir, f"{base}.{ext}")

            with open(out, "wb") as f:
                f.write(apic.data)

            cover_path = out
            has_cover = True

    return AudioTags(
        title=title or os.path.splitext(os.path.basename(mp3_path))[0],
        disc=disc,
        track=track,
        has_cover=has_cover,
        cover_path=cover_path
    )