// ========================================
// SYSTÈME DE NAVIGATION - Précédent/Suivant
// ========================================
// Permet de naviguer entre les étapes du jeu

class GameNavigation {
  constructor() {
    this.screens = [
      { id: 'chooseRoles', name: '① Sélection des Rôles', file: '01-ChooseCard.js' },
      { id: 'tableSetup', name: '② Agencement de la Table', file: '02-TableAndRename.js' },
      { id: 'firstNight', name: '③ Première Nuit', file: '03-FirstNight.js' },
      { id: 'mayorElection', name: '④ Élection du Maire', file: '04-MayorElection.js' }
    ];

    this.currentIndex = 0;
    this.history = [0]; // Historique de navigation
  }

  // ========== NAVIGATION ==========

  getCurrentScreen() {
    return this.screens[this.currentIndex];
  }

  canGoBack() {
    return this.currentIndex > 0;
  }

  canGoNext() {
    return this.currentIndex < this.screens.length - 1;
  }

  goBack() {
    if (this.canGoBack()) {
      this.currentIndex--;
      this.history.push(this.currentIndex);
      this.onScreenChange();
      return this.getCurrentScreen();
    }
    return null;
  }

  goNext() {
    if (this.canGoNext()) {
      this.currentIndex++;
      this.history.push(this.currentIndex);
      this.onScreenChange();
      return this.getCurrentScreen();
    }
    return null;
  }

  goToScreen(screenIndex) {
    if (screenIndex >= 0 && screenIndex < this.screens.length) {
      this.currentIndex = screenIndex;
      this.history.push(this.currentIndex);
      this.onScreenChange();
      return this.getCurrentScreen();
    }
    return null;
  }

  // ========== CALLBACKS ==========

  onScreenChange() {
    const screen = this.getCurrentScreen();
    console.log(
      `%c[Navigation] ${screen.name}`,
      'color: white; background: #2196F3; padding: 4px 8px; border-radius: 3px; font-weight: bold;'
    );

    // Logger la navigation
    if (window.gameLogger) {
      window.gameLogger.log('phase', `Navigation vers: ${screen.name}`, {
        screenId: screen.id,
        screenName: screen.name,
        canGoBack: this.canGoBack(),
        canGoNext: this.canGoNext(),
        historyLength: this.history.length
      });
    }

    // Émettre un événement personnalisé
    window.dispatchEvent(new CustomEvent('screenChange', {
      detail: {
        screen,
        index: this.currentIndex,
        canGoBack: this.canGoBack(),
        canGoNext: this.canGoNext()
      }
    }));
  }

  // ========== AFFICHAGE DES BOUTONS ==========

  createNavigationButtons() {
    const container = document.createElement('div');
    container.id = 'navigationButtons';
    container.style.cssText = `
      display: flex;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
      justify-content: space-between;
      align-items: center;
    `;

    // Bouton Précédent
    const btnBack = document.createElement('button');
    btnBack.id = 'btnNavigationBack';
    btnBack.textContent = '← Précédent';
    btnBack.style.cssText = `
      padding: 8px 12px;
      background: ${this.canGoBack() ? 'rgba(255, 152, 0, 0.3)' : 'rgba(150, 150, 150, 0.2)'};
      border: 1px solid ${this.canGoBack() ? 'rgba(255, 152, 0, 0.6)' : 'rgba(150, 150, 150, 0.4)'};
      color: ${this.canGoBack() ? '#ffaa88' : '#999'};
      border-radius: 3px;
      cursor: ${this.canGoBack() ? 'pointer' : 'not-allowed'};
      font-weight: 600;
      font-size: 11px;
      transition: 0.2s;
    `;
    btnBack.disabled = !this.canGoBack();

    if (this.canGoBack()) {
      btnBack.addEventListener('click', () => this.goBack());
      btnBack.addEventListener('mouseenter', () => {
        btnBack.style.background = 'rgba(255, 152, 0, 0.5)';
      });
      btnBack.addEventListener('mouseleave', () => {
        btnBack.style.background = 'rgba(255, 152, 0, 0.3)';
      });
    }

    // Indicateur d'étape
    const indicator = document.createElement('div');
    indicator.id = 'navigationIndicator';
    indicator.style.cssText = `
      color: #bbb;
      font-size: 11px;
      font-weight: 500;
    `;
    indicator.textContent = `${this.currentIndex + 1} / ${this.screens.length}: ${this.getCurrentScreen().name}`;

    // Bouton Suivant
    const btnNext = document.createElement('button');
    btnNext.id = 'btnNavigationNext';
    btnNext.textContent = 'Suivant →';
    btnNext.style.cssText = `
      padding: 8px 12px;
      background: ${this.canGoNext() ? 'rgba(76, 175, 80, 0.3)' : 'rgba(150, 150, 150, 0.2)'};
      border: 1px solid ${this.canGoNext() ? 'rgba(76, 175, 80, 0.6)' : 'rgba(150, 150, 150, 0.4)'};
      color: ${this.canGoNext() ? '#88ff88' : '#999'};
      border-radius: 3px;
      cursor: ${this.canGoNext() ? 'pointer' : 'not-allowed'};
      font-weight: 600;
      font-size: 11px;
      transition: 0.2s;
    `;
    btnNext.disabled = !this.canGoNext();

    if (this.canGoNext()) {
      btnNext.addEventListener('click', () => this.goNext());
      btnNext.addEventListener('mouseenter', () => {
        btnNext.style.background = 'rgba(76, 175, 80, 0.5)';
      });
      btnNext.addEventListener('mouseleave', () => {
        btnNext.style.background = 'rgba(76, 175, 80, 0.3)';
      });
    }

    container.appendChild(btnBack);
    container.appendChild(indicator);
    container.appendChild(btnNext);

    return container;
  }

  updateNavigationButtons() {
    const btnBack = document.getElementById('btnNavigationBack');
    const btnNext = document.getElementById('btnNavigationNext');
    const indicator = document.getElementById('navigationIndicator');

    if (btnBack) {
      btnBack.disabled = !this.canGoBack();
      btnBack.style.opacity = this.canGoBack() ? '1' : '0.5';
      btnBack.style.cursor = this.canGoBack() ? 'pointer' : 'not-allowed';
    }

    if (btnNext) {
      btnNext.disabled = !this.canGoNext();
      btnNext.style.opacity = this.canGoNext() ? '1' : '0.5';
      btnNext.style.cursor = this.canGoNext() ? 'pointer' : 'not-allowed';
    }

    if (indicator) {
      indicator.textContent = `${this.currentIndex + 1} / ${this.screens.length}: ${this.getCurrentScreen().name}`;
    }
  }

  // ========== SHORTCUTS CLAVIER ==========

  attachKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + Flèche Gauche = Précédent
      if (e.altKey && e.key === 'ArrowLeft') {
        if (this.canGoBack()) {
          this.goBack();
          window.gameLogger?.log('action', '⌨️ Shortcut: Alt+← (Précédent)', {});
        }
      }

      // Alt + Flèche Droite = Suivant
      if (e.altKey && e.key === 'ArrowRight') {
        if (this.canGoNext()) {
          this.goNext();
          window.gameLogger?.log('action', '⌨️ Shortcut: Alt+→ (Suivant)', {});
        }
      }
    });

    console.log('%c[Navigation] ⌨️ Shortcuts: Alt+← Précédent | Alt+→ Suivant', 'color: #4CAF50;');
  }

  // ========== ÉTAT ET INFOS ==========

  getScreenName(index) {
    return this.screens[index]?.name || 'Inconnu';
  }

  printStatus() {
    console.group('📍 Status de Navigation');
    console.log(`Écran actuel: ${this.getCurrentScreen().name}`);
    console.log(`Position: ${this.currentIndex + 1}/${this.screens.length}`);
    console.log(`Peut revenir: ${this.canGoBack()}`);
    console.log(`Peut avancer: ${this.canGoNext()}`);
    console.log(`Historique: ${this.history.join(' → ')}`);
    console.table(this.screens.map((s, i) => ({
      index: i,
      name: s.name,
      current: i === this.currentIndex ? '✓' : ''
    })));
    console.groupEnd();
  }
}

// Instance globale
window.gameNavigation = new GameNavigation();

// Initialiser les shortcuts
window.gameNavigation.attachKeyboardShortcuts();

console.log('%c[Navigation] ✓ Système de navigation chargé', 'color: green; font-weight: bold;');
console.log('%c[Navigation] ⌨️ Utilisez Alt+← et Alt+→ pour naviguer', 'color: #2196F3;');
