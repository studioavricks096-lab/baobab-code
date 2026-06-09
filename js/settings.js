/* ============================================================
   Baobab Code — settings.js
   Settings screen logic: font size, themes, toggles, tab width
   ============================================================ */

'use strict';

const THEMES = {
  savanna: { name: 'Savanna Sunset', gradient: 'linear-gradient(135deg,#c2410c,#1e3a5f)' },
  littor:  { name: 'Littor Trees',   gradient: 'linear-gradient(135deg,#1e1b4b,#2e1065)' },
  ocean:   { name: 'Deep Ocean',     gradient: 'linear-gradient(135deg,#0f172a,#1e3a5f)' },
  forest:  { name: 'Forest Dark',    gradient: 'linear-gradient(135deg,#064e3b,#1a2e1a)' },
  earth:   { name: 'Earth Green',    gradient: 'linear-gradient(135deg,#14532d,#052e16)' }
};

function applySettings() {
  const s = window.App?.settings;
  if (!s) return;

  // Font size in editor
  const codeInput = document.getElementById('code-input');
  const codeHL    = document.getElementById('code-highlight');
  if (codeInput) codeInput.style.fontSize = s.fontSize + 'px';
  if (codeHL)    codeHL.style.fontSize    = s.fontSize + 'px';

  // Word wrap
  if (codeInput) codeInput.style.whiteSpace = s.wordWrap ? 'pre-wrap' : 'pre';
  if (codeHL)    codeHL.style.whiteSpace    = s.wordWrap ? 'pre-wrap' : 'pre';
}

function refreshSettingsUI() {
  const s = window.App?.settings;
  if (!s) return;

  const fontEl    = document.getElementById('setting-font-size');
  const tabEl     = document.getElementById('setting-tab-width');
  const themeEl   = document.getElementById('setting-theme-name');
  const thumbEl   = document.getElementById('setting-theme-thumb');
  const toggleAS  = document.getElementById('toggle-autosave');
  const toggleWW  = document.getElementById('toggle-wordwrap');
  const backupEl  = document.getElementById('setting-backup-date');

  if (fontEl)   fontEl.textContent   = s.fontSize + ' px';
  if (tabEl)    tabEl.textContent    = s.tabWidth + ' Spaces';
  if (themeEl)  themeEl.textContent  = THEMES[s.theme]?.name || 'Savanna Sunset';
  if (thumbEl)  thumbEl.style.background = THEMES[s.theme]?.gradient || '';
  if (toggleAS) toggleAS.classList.toggle('off', !s.autosave);
  if (toggleWW) toggleWW.classList.toggle('off', !s.wordWrap);
  if (backupEl) backupEl.textContent = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  // Theme swatches
  document.querySelectorAll('.theme-item').forEach(el => {
    const isActive = el.dataset.theme === s.theme;
    el.querySelector('.theme-swatch')?.classList.toggle('selected', isActive);
  });
}

window.addEventListener('screenChange', e => {
  if (e.detail.screen !== 'settings') return;

  setTimeout(() => {
    const s = window.App?.settings;
    if (!s) return;

    refreshSettingsUI();

    // Back button
    document.getElementById('btn-settings-back')
      ?.addEventListener('click', () => window.navigateTo('home'), { once: true });

    // Font size row — tap to cycle
    document.querySelector('.setting-row')
      ?.addEventListener('click', () => {
        const sizes = [12, 13, 14, 15, 16, 18, 20];
        const idx   = sizes.indexOf(s.fontSize);
        s.fontSize  = sizes[(idx + 1) % sizes.length];
        refreshSettingsUI();
        applySettings();
        window.saveSettings?.();
      });

    // Tab width row — tap to cycle
    document.querySelectorAll('.setting-row')[2]
      ?.addEventListener('click', () => {
        const widths = [2, 4, 8];
        const idx    = widths.indexOf(s.tabWidth);
        s.tabWidth   = widths[(idx + 1) % widths.length];
        refreshSettingsUI();
        window.saveSettings?.();
      });

    // Autosave toggle
    document.getElementById('toggle-autosave')
      ?.addEventListener('click', function () {
        s.autosave = !s.autosave;
        this.classList.toggle('off', !s.autosave);
        window.saveSettings?.();
      });

    // Word wrap toggle
    document.getElementById('toggle-wordwrap')
      ?.addEventListener('click', function () {
        s.wordWrap = !s.wordWrap;
        this.classList.toggle('off', !s.wordWrap);
        applySettings();
        window.saveSettings?.();
      });

    // Theme swatches
    document.querySelectorAll('.theme-item').forEach(el => {
      el.addEventListener('click', () => {
        s.theme = el.dataset.theme;
        refreshSettingsUI();
        window.saveSettings?.();
      });
    });

    // Export backup
    document.querySelectorAll('.setting-card')[1]
      ?.addEventListener('click', () => {
        try {
          const data = JSON.stringify({
            settings: window.App?.settings,
            files:    window.FileStore?.projects
          }, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = 'baobab-backup.json';
          a.click();
          URL.revokeObjectURL(url);
        } catch (_) {
          alert('Backup export not available in this environment.');
        }
      });

  }, 50);
});

window.applySettings = applySettings;
