import json


def read_file(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def build_output_html(config, is_portable: bool = False):
    """
    Genere index.html (light) ou index_portable.html (autonome).
    Le bouton 'switch version' dans le header pointe vers l'autre fichier
    et ne s'affiche que si ce fichier existe (verifie en JS via fetch HEAD).
    """
    html = read_file("templates/base.html")
    html = html.replace("{{CONFIG}}", json.dumps(config, ensure_ascii=False))
    html = html.replace("{{STYLE}}", read_file("templates/styles.css"))
    html = html.replace("{{PLAY_JS}}", read_file("templates/play.js"))
    html = html.replace("{{EDITOR_JS}}", "")

    if is_portable:
        # On est dans la version ALL-IN-ONE -> bouton vers la version LIGHT
        html = html.replace("{{OTHER_VERSION}}", "index.html")
        html = html.replace("{{SWITCH_LABEL}}", "🪶 Light")
        html = html.replace("{{SWITCH_TITLE}}", "Basculer vers la version légère (utilise music/sfx/covers/ à côté)")
    else:
        # On est dans la version LIGHT -> bouton vers la version ALL-IN-ONE
        html = html.replace("{{OTHER_VERSION}}", "index_aio.html")
        html = html.replace("{{SWITCH_LABEL}}", "📦 All-in-one")
        html = html.replace("{{SWITCH_TITLE}}", "Basculer vers la version all-in-one (un seul fichier auto-suffisant)")

    return html
