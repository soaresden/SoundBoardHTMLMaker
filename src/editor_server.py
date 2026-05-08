from __future__ import annotations
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

TEMPLATES_DIR = "templates"
CONFIG_FILE = "config.json"

def load_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

class Handler(BaseHTTPRequestHandler):
    def _send(self, code=200, body=b"", ctype="text/plain; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        p = urlparse(self.path).path
        if p in ("/", "/editor"):
            html = load_file(os.path.join(TEMPLATES_DIR, "editor.html"))
            self._send(200, html.encode("utf-8"), "text/html; charset=utf-8")
            return

        if p == "/editor.js":
            js = load_file(os.path.join(TEMPLATES_DIR, "editor.js"))
            self._send(200, js.encode("utf-8"), "application/javascript; charset=utf-8")
            return

        if p == "/styles.css":
            css = load_file(os.path.join(TEMPLATES_DIR, "styles.css"))
            self._send(200, css.encode("utf-8"), "text/css; charset=utf-8")
            return

        if p == "/config.json":
            if not os.path.exists(CONFIG_FILE):
                self._send(404, b"config.json not found")
                return
            with open(CONFIG_FILE, "rb") as f:
                self._send(200, f.read(), "application/json; charset=utf-8")
            return

        self._send(404, b"Not found")

    def do_POST(self):
        p = urlparse(self.path).path
        if p == "/save":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                data = json.loads(raw.decode("utf-8"))
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self._send(200, b'{"ok":true}', "application/json; charset=utf-8")
            except Exception as e:
                msg = (f'{{"ok":false,"error":"{str(e)}"}}').encode("utf-8")
                self._send(400, msg, "application/json; charset=utf-8")
            return

        self._send(404, b"Not found")

def run_editor(port=8765):
    httpd = HTTPServer(("127.0.0.1", port), Handler)
    print(f"✅ Editor ouvert: http://127.0.0.1:{port}/editor")
    httpd.serve_forever()