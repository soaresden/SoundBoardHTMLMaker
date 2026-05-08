import json


def read_file(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def build_output_html(config):
    """
    Genere output.html : HTML autonome (CONFIG, CSS, JS du player tous inlines).
    Le fichier resultat marche en file:// du moment que les dossiers
    music/, sfx/, covers/ sont a cote.

    Note : on N'INJECTE PAS editor.js dans le player final (inutile et risque
    de bug), seulement play.js.
    """
    html = read_file("templates/base.html")
    html = html.replace("{{CONFIG}}", json.dumps(config, ensure_ascii=False))
    html = html.replace("{{STYLE}}", read_file("templates/styles.css"))
    html = html.replace("{{PLAY_JS}}", read_file("templates/play.js"))
    # editor.js retire du build : il ne sert que dans l'editor live.
    html = html.replace("{{EDITOR_JS}}", "")
    return html
