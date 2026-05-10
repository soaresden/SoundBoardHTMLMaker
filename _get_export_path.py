"""
Helper appele par runme.bat : imprime le chemin du output.html
courant, en fonction du nom de projet du config.json.
"""
import json
import os
import re
import sys


def sanitize(name: str) -> str:
    if not name:
        return "soundboard"
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name)
    safe = "".join(c for c in name if c.isalnum() or c in " -_().,")
    safe = safe.strip(" .")
    safe = re.sub(r"\s+", " ", safe)
    return safe[:80] or "soundboard"


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "output"
    fname = "index_aio.html" if which == "portable" else "index.html"

    if not os.path.exists("config.json"):
        # rien a faire
        sys.exit(2)

    with open("config.json", "r", encoding="utf-8") as f:
        cfg = json.load(f)

    name = (cfg.get("project") or {}).get("name") or "soundboard"
    sub = sanitize(name)
    path = os.path.join("FOLDERTOEXPORT", sub, fname)
    print(path)


if __name__ == "__main__":
    main()
