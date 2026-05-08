import os
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(ROOT, "templates")
CONFIG_FILE = os.path.join(ROOT, "config.json")


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
        return super().do_GET()

    def translate_path(self, path):
        path = unquote(path.split("?", 1)[0].split("#", 1)[0])

        if path in ("/", "/editor"):
            return os.path.join(TEMPLATES, "editor.html")

        # Alias: l'editor peut fetch soundboard-config.json -> on sert config.json
        if path in ("/soundboard-config.json", "/config.json"):
            return CONFIG_FILE

        if path.startswith("/music/"):
            return os.path.join(ROOT, "music", path[len("/music/"):])

        if path.startswith("/sfx/"):
            return os.path.join(ROOT, "sfx", path[len("/sfx/"):])

        if path.startswith("/covers/"):
            return os.path.join(ROOT, "covers", path[len("/covers/"):])

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

        if path == "/save":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b""
            try:
                data = json.loads(raw.decode("utf-8"))
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                body = b'{"ok":true,"path":"config.json"}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
                print("config.json sauvegarde (" + str(len(raw)) + " octets)")
            except Exception as e:
                err = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
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
    print("Editor: http://127.0.0.1:" + str(PORT) + "/editor")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
