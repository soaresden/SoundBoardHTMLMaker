/**
 * HTML Helper Functions
 * Réutilisable pour tous les phases
 */

class HTMLHelpers {
  /**
   * Échappe les caractères spéciaux pour les attributs HTML
   */
  static escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Décoder les entités HTML
   */
  static decodeHTML(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }

  /**
   * Crée un élément avec attributs et contenu
   */
  static createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('data-')) {
        el.dataset[key.replace('data-', '')] = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    if (content) {
      if (typeof content === 'string') {
        el.innerHTML = content;
      } else {
        el.appendChild(content);
      }
    }
    return el;
  }
}

// Export pour utilisation
window.HTMLHelpers = HTMLHelpers;
