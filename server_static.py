import os
import sys
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(ROOT, "templates")
sys.path.insert(0, ROOT)
from src import games as G  # noqa: E402

# Jeu édité : python server_static.py [--game <id>]  (sinon jeu courant, cf. build.py use)
_arg = sys.argv[sys.argv.index("--game") + 1] if "--game" in sys.argv[:-1] else None
GAME = G.resolve(_arg)
GAME_DIR = G.game_dir(GAME)
CONFIG_FILE = os.path.join(GAME_DIR, "config.json")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Pas de cache navigateur sur les assets dynamiques
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_GET(self):
        # Suppression du bruit favicon.ico 404
        if self.path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        # Endpoint /list-files : retourne les mp3 reellement presents dans music/ et sfx/
        if self.path.startswith("/list-files"):
            try:
                music_dir = os.path.join(GAME_DIR, "music")
                sfx_dir = os.path.join(GAME_DIR, "sfx")
                def _list(folder):
                    if not os.path.isdir(folder):
                        return []
                    return sorted(f for f in os.listdir(folder) if f.lower().endswith(".mp3"))
                payload = json.dumps({
                    "music": _list(music_dir),
                    "sfx":   _list(sfx_dir),
                }, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return
        return super().do_GET()

    def translate_path(self, path):
        path = unquote(path.split("?", 1)[0].split("#", 1)[0])

        if path in ("/", "/editor"):
            return os.path.join(TEMPLATES, "editor.html")

        # Alias: l'editor peut fetch soundboard-config.json -> on sert config.json
        if path in ("/soundboard-config.json", "/config.json"):
            return CONFIG_FILE

        if path.startswith("/music/"):
            return os.path.join(GAME_DIR, "music", path[len("/music/"):])

        if path.startswith("/sfx/"):
            return os.path.join(GAME_DIR, "sfx", path[len("/sfx/"):])

        if path.startswith("/covers/"):
            return os.path.join(GAME_DIR, "covers", path[len("/covers/"):])

        if path.startswith("/templates/"):
            return os.path.join(TEMPLATES, path[len("/templates/"):])

        # Fallback intelligent : racine puis templates
        candidate_root = os.path.join(ROOT, path.lstrip("/"))
        if os.path.exists(candidate_root):
            return candidate_root

        candidate_tpl = os.path.join(TEMPLATES, path.lstrip("/"))
        if os.path.exists(candidate_tpl):
            return candidate_tpl

        return candidate_root

    def do_POST(self):
        path = unquote(self.path.split("?", 1)[0])

        # ============================================================
        # POST /scan : relance le scan complet et écrit config.json
        # ============================================================
        if path == "/scan":
            try:
                import sys as _sys
                if ROOT not in _sys.path:
                    _sys.path.insert(0, ROOT)
                # Force la lecture fraîche (pas de cache module)
                if "src.scan" in _sys.modules:
                    import importlib
                    importlib.reload(_sys.modules["src.scan"])
                from src.scan import scan_and_save
                with G.inside(GAME_DIR):
                    cfg = scan_and_save()

                body = json.dumps({
                    "ok": True,
                    "music": len(cfg.get("music", [])),
                    "sfx":   len(cfg.get("sfx", [])),
                    "musicCategories": len(cfg.get("musicCategories", [])),
                    "sfxCategories":   len(cfg.get("sfxCategories", [])),
                }, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)

                try:
                    import datetime
                    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    with open(os.path.join(ROOT, "server.log"), "a", encoding="utf-8") as lf:
                        lf.write(f"{ts}  [SCAN] music={len(cfg.get('music', []))} sfx={len(cfg.get('sfx', []))}\n")
                except Exception:
                    pass
            except Exception as e:
                err = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        if path == "/save":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b""
            try:
                data = json.loads(raw.decode("utf-8"))
                # Ecriture + flush + fsync pour garantir que ca arrive sur disque
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.flush()
                    try: os.fsync(f.fileno())
                    except OSError: pass

                # Resume pour log
                proj = (data.get("project") or {}).get("name", "?")
                mcats = len(data.get("musicCategories", []))
                scats = len(data.get("sfxCategories", []))
                nm = len(data.get("music", []))
                ns = len(data.get("sfx", []))
                summary = (f"[SAVE] project={proj!r} "
                           f"mcats={mcats} scats={scats} "
                           f"music={nm} sfx={ns} bytes={len(raw)}")

                # Log dans server.log (le serveur tourne en pythonw, pas de console)
                try:
                    import datetime
                    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    with open(os.path.join(ROOT, "server.log"), "a", encoding="utf-8") as lf:
                        lf.write(f"{ts}  {summary}\n")
                except Exception:
                    pass

                body = json.dumps({
                    "ok": True,
                    "path": "config.json",
                    "summary": summary,
                }, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
                print(summary)
            except Exception as e:
                err = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                # log error aussi
                try:
                    import datetime
                    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    with open(os.path.join(ROOT, "server.log"), "a", encoding="utf-8") as lf:
                        lf.write(f"{ts}  [SAVE-ERROR] {e}\n")
                except Exception:
                    pass
                print("Erreur save:", e)
            return

        body = b"Not found"
        self.send_response(404)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print("%s - - [%s] %s" % (self.address_string(), self.log_date_time_string(), format % args))


if __name__ == "__main__":
    os.chdir(ROOT)
    print("Server root:", ROOT)
    print("Jeu édité  :", GAME, "->", GAME_DIR)
    print("Editor: http://127.0.0.1:" + str(PORT) + "/editor")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
