"""Assemble le player HTML : template commun + CONFIG du jeu + injections du jeu.

Points d'injection (fichiers optionnels dans games/<jeu>/inject/) :
  head-start.html -> dans <head>, AVANT les styles du template
  head.html       -> dans <head>, APRES les styles du template (pour les surcharger)
  header.html     -> boutons ajoutés dans l'en-tête, à gauche de "Stop all"
  body.html       -> juste avant </body> (scripts du jeu, etc.)
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(ROOT, "templates")
INJECT_SLOTS = {
    "HEAD_START": "head-start.html",
    "HEAD_END": "head.html",
    "HEADER_EXTRA": "header.html",
    "BODY_END": "body.html",
}


def read_file(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def tpl(name):
    return read_file(os.path.join(TEMPLATES, name))


def read_injects(game_dir):
    """Lit games/<jeu>/inject/*.html -> dict slot -> contenu ('' si absent)."""
    out = {}
    inject_dir = os.path.join(game_dir, "inject") if game_dir else None
    for slot, fname in INJECT_SLOTS.items():
        p = os.path.join(inject_dir, fname) if inject_dir else None
        out[slot] = read_file(p).rstrip() + "\n" if p and os.path.isfile(p) else ""
    return out


def _header_buttons(project, is_portable, extra):
    """Boutons de l'en-tête (avant "Stop all")."""
    parts = []
    if extra.strip():
        parts.append(extra.rstrip("\n"))
    if project.get("versionSwitch", True):
        if is_portable:
            other, label, title = ("index.html", "🪶 Light",
                                   "Basculer vers la version légère (utilise music/sfx/covers/ à côté)")
        else:
            other, label, title = ("index_aio.html", "📦 All-in-one",
                                   "Basculer vers la version all-in-one (un seul fichier auto-suffisant)")
        parts.append(f'        <a class="btn btn-switch" id="btnSwitchVersion"\n'
                     f'           href="{other}"\n'
                     f'           title="{title}">{label}</a>')
        parts.append('        <button class="btn btn-switch" id="btnDownload"\n'
                     '                title="Télécharger ce HTML autonome (un seul fichier)"\n'
                     '                style="display:none;">⬇ Télécharger</button>')
    if project.get("offline") == "button" and not is_portable:
        parts.append('        <button class="btn btn-switch" id="btnOffline"\n'
                     '                title="Charger tous les sons en cache pour une utilisation hors-ligne">📥 Hors-ligne</button>')
    return "\n".join(parts) + ("\n" if parts else "")


def build_output_html(config, is_portable: bool = False, game_dir: str | None = None):
    """
    Genere index.html (light) ou index_aio.html (autonome) pour un jeu.
    `game_dir` = dossier games/<jeu>/ (pour lire inject/). None = aucune injection.
    """
    project = config.get("project") or {}
    inj = read_injects(game_dir)

    play = tpl("play.js")
    offline = tpl("offline.js") if project.get("offline") and not is_portable else ""
    play = play.replace("  // {{OFFLINE_JS}}\n", offline).replace("// {{OFFLINE_JS}}", offline)

    html = tpl("base.html")
    html = html.replace("{{HEAD_START}}\n", inj["HEAD_START"]).replace("{{HEAD_START}}\r\n", inj["HEAD_START"])
    html = html.replace("{{HEAD_END}}", inj["HEAD_END"])
    html = html.replace("{{HEADER_BUTTONS}}", _header_buttons(project, is_portable, inj["HEADER_EXTRA"]))
    html = html.replace("{{BODY_END}}", inj["BODY_END"])
    html = html.replace("{{CONFIG}}", json.dumps(config, ensure_ascii=False))
    html = html.replace("{{STYLE}}", tpl("styles.css"))
    html = html.replace("{{PLAY_JS}}", play)
    html = html.replace("{{EDITOR_JS}}", "")
    return html
