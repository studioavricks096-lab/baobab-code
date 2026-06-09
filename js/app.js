/* ============================================================
   Baobab Code — app.js
   Core: screen loading, navigation, overlay, modal, stars
   ============================================================ */

'use strict';

/* ── State ──────────────────────────────────────────────────── */
const App = {
  currentScreen: 'home',
  screens: ['home', 'files', 'editor', 'terminal', 'settings'],
  settings: {
    fontSize: 14,
    tabWidth: 4,
    autosave: true,
    wordWrap: false,
    theme: 'savanna'
  }
};

/* ── Nav config ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    id: 'files', screen: 'files', label: 'Files',
    icon: `<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" fill="none"/></svg>`
  },
  {
    id: 'home', screen: 'home', label: 'Editor',
    icon: `<svg viewBox="0 0 24 24"><polyline points="4 7 12 3 20 7" stroke="currentColor" fill="none"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor"/><path d="M4 7v13h16V7" stroke="currentColor" fill="none"/></svg>`
  },
  {
    id: 'editor', screen: 'editor', label: 'Editor',
    icon: `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" stroke="currentColor" fill="none"/><polyline points="8 6 2 12 8 18" stroke="currentColor" fill="none"/></svg>`
  },
  {
    id: 'terminal', screen: 'terminal', label: 'Plugins',
    icon: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none"/></svg>`
  },
  {
    id: 'settings', screen: 'settings', label: 'Settings',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" fill="none"/></svg>`
  }
];

/* ── Boot ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  buildStars();
  buildNav();
  await loadAllScreens();
  setupOverlay();
  setupModal();
  navigateTo('home');
  loadSettings();
  registerServiceWorker();
});

/* ── Stars ──────────────────────────────────────────────────── */
function buildStars() {
  const container = document.getElementById('stars');
  const count = 45;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left   = Math.random() * 100 + '%';
    s.style.top    = Math.random() * 65  + '%';
    s.style.animationDelay    = (Math.random() * 3).toFixed(2) + 's';
    s.style.animationDuration = (2 + Math.random() * 2).toFixed(2) + 's';
    frag.appendChild(s);
  }
  container.appendChild(frag);
}

/* ── Build Navigation ───────────────────────────────────────── */
function buildNav() {
  const nav = document.getElementById('bottom-nav');
  NAV_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.dataset.navId = item.id;
    btn.innerHTML = item.icon + `<span>${item.label}</span>`;
    btn.addEventListener('click', () => navigateTo(item.screen));
    nav.appendChild(btn);
  });
}

/* ── Load all screen HTML ───────────────────────────────────── */
async function loadAllScreens() {
  const loads = App.screens.map(name =>
    fetch(`screens/${name}.html`)
      .then(r => r.text())
      .then(html => {
        const el = document.getElementById(`screen-${name}`);
        if (el) el.innerHTML = html;
      })
      .catch(err => console.warn(`Screen ${name} failed:`, err))
  );
  await Promise.all(loads);
}

/* ── Navigate ───────────────────────────────────────────────── */
function navigateTo(screenName) {
  // Deactivate all
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Activate target screen
  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) screen.classList.add('active');

  // Activate nav button
  const navItem = NAV_ITEMS.find(n => n.screen === screenName);
  if (navItem) {
    const btn = document.querySelector(`[data-nav-id="${navItem.id}"]`);
    if (btn) btn.classList.add('active');
  }

  App.currentScreen = screenName;

  // Notify modules
  window.dispatchEvent(new CustomEvent('screenChange', { detail: { screen: screenName } }));
}

/* ── Overlay ────────────────────────────────────────────────── */
function setupOverlay() {
  const overlay = document.getElementById('overlay');
  overlay.addEventListener('click', () => {
    hideModal();
    hideContextMenu();
  });
}

function showOverlay() { document.getElementById('overlay').classList.add('visible'); }
function hideOverlay() { document.getElementById('overlay').classList.remove('visible'); }

/* ── New File Modal ─────────────────────────────────────────── */
function setupModal() {
  const modal   = document.getElementById('modal-new-file');
  const input   = document.getElementById('input-filename');
  const btnCancel = document.getElementById('btn-modal-cancel');
  const btnCreate = document.getElementById('btn-modal-create');

  if (btnCancel) btnCancel.addEventListener('click', hideModal);
  if (btnCreate) btnCreate.addEventListener('click', () => {
    const name = input ? input.value.trim() : '';
    if (name) {
      window.dispatchEvent(new CustomEvent('createFile', { detail: { name } }));
      if (input) input.value = '';
      hideModal();
    }
  });

  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') btnCreate && btnCreate.click();
      if (e.key === 'Escape') hideModal();
    });
  }
}

function showModal() {
  const modal = document.getElementById('modal-new-file');
  const input = document.getElementById('input-filename');
  if (modal) modal.classList.add('visible');
  showOverlay();
  setTimeout(() => { if (input) input.focus(); }, 300);
}

function hideModal() {
  const modal = document.getElementById('modal-new-file');
  if (modal) modal.classList.remove('visible');
  const input = document.getElementById('input-filename');
  if (input) input.value = '';
  if (!document.getElementById('context-menu')?.classList.contains('visible')) {
    hideOverlay();
  }
}

/* ── Context Menu ───────────────────────────────────────────── */
function showContextMenu(items, x, y) {
  const menu = document.getElementById('context-menu');
  menu.innerHTML = items.map(item => `
    <div class="ctx-item ${item.danger ? 'danger' : ''}" data-action="${item.action}">
      ${item.icon || ''}
      ${item.label}
    </div>
  `).join('');

  menu.querySelectorAll('.ctx-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      items[i].cb && items[i].cb();
      hideContextMenu();
    });
  });

  // Position
  const appRect = document.getElementById('app').getBoundingClientRect();
  const menuTop = Math.min(y - appRect.top, window.innerHeight - 300);
  menu.style.top  = menuTop + 'px';
  menu.style.left = '50%';
  menu.style.transform = 'translateX(-50%)';
  menu.classList.add('visible');
  showOverlay();
}

function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.classList.remove('visible');
  if (!document.getElementById('modal-new-file')?.classList.contains('visible')) {
    hideOverlay();
  }
}

/* ── Settings persistence ───────────────────────────────────── */
function loadSettings() {
  try {
    const saved = localStorage.getItem('baobab-settings');
    if (saved) Object.assign(App.settings, JSON.parse(saved));
  } catch (_) {}
}

function saveSettings() {
  try { localStorage.setItem('baobab-settings', JSON.stringify(App.settings)); } catch (_) {}
}

/* ── Service Worker ─────────────────────────────────────────── */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.warn('SW:', err));
  }
}

/* ── Expose globals used by other modules ───────────────────── */
window.App        = App;
window.navigateTo = navigateTo;
window.showModal  = showModal;
window.hideModal  = hideModal;
window.showContextMenu  = showContextMenu;
window.hideContextMenu  = hideContextMenu;
window.showOverlay = showOverlay;
window.hideOverlay = hideOverlay;
window.saveSettings = saveSettings;
