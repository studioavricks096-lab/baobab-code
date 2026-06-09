/* ============================================================
   Baobab Code — files.js
   File tree, project management, context menus
   ============================================================ */

'use strict';

/* ── In-memory file store ───────────────────────────────────── */
const FileStore = {
  projects: [
    {
      name: 'MyWebsite',
      expanded: true,
      children: [
        { name: 'app.py',      type: 'python',  content: '# My Python app\n\nprint("Hello, Baobab Code!")\n' },
        {
          name: 'homework', type: 'folder', expanded: true,
          children: [
            { name: 'assets',     type: 'folder', expanded: false, children: [] },
            { name: 'index.html', type: 'html',   content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Website</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n' },
            { name: 'style.css',  type: 'css',    content: '/* Styles */\n\nbody {\n  margin: 0;\n  font-family: sans-serif;\n  background: #050d1a;\n  color: #e8f4ff;\n}\n' },
            { name: 'reset.css',  type: 'css',    content: '/* Reset */\n* { margin: 0; padding: 0; box-sizing: border-box; }\n' }
          ]
        }
      ]
    },
    {
      name: 'BaobabDemo', expanded: false,
      children: [
        { name: 'main.js', type: 'javascript', content: '// Main script\nconsole.log("Baobab Code");\n' }
      ]
    }
  ],
  activeProject: 'MyWebsite'
};

/* ── File type → icon colour map ───────────────────────────── */
const FILE_COLORS = {
  python:     '#ffd43b',
  html:       '#e34c26',
  css:        '#264de4',
  javascript: '#f7df1e',
  react:      '#61dafb',
  markdown:   '#aaa',
  folder:     '#00aaff',
  text:       '#888',
  default:    '#7aa0c4'
};

/* ── File SVGs ──────────────────────────────────────────────── */
function folderIcon(color = '#00aaff') {
  return `<svg viewBox="0 0 24 24" fill="${color}" class="file-item-icon"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`;
}
function fileIcon(type) {
  const c = FILE_COLORS[type] || FILE_COLORS.default;
  return `<svg viewBox="0 0 24 24" class="file-item-icon" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}
function chevronIcon(open) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="file-expand${open ? ' open' : ''}"><polyline points="6 9 12 15 18 9"/></svg>`;
}

/* ── Render tree ────────────────────────────────────────────── */
function renderFileTree() {
  const container = document.getElementById('file-tree');
  if (!container) return;
  container.innerHTML = '';

  FileStore.projects.forEach(project => {
    renderNode(container, project, 0, [project]);
  });
}

function renderNode(container, node, depth, path) {
  const el = document.createElement('div');
  el.className = `file-item${depth > 0 ? ` depth-${depth}` : ''}`;

  if (node.type === 'folder' || node.children) {
    el.innerHTML =
      folderIcon(FILE_COLORS.folder) +
      `<span class="file-item-name">${node.name}</span>` +
      (node.children?.length ? `<span class="file-badge">${node.children.length}</span>` : '') +
      chevronIcon(node.expanded);

    el.addEventListener('click', () => {
      node.expanded = !node.expanded;
      renderFileTree();
    });

    // Long press for context menu
    setupLongPress(el, node, path);
    container.appendChild(el);

    if (node.expanded && node.children) {
      node.children.forEach(child => {
        renderNode(container, child, depth + 1, [...path, child]);
      });
    }
  } else {
    el.innerHTML =
      fileIcon(node.type || 'default') +
      `<span class="file-item-name">${node.name}</span>`;

    el.addEventListener('click', () => openFile(node, path));
    setupLongPress(el, node, path);
    container.appendChild(el);
  }
}

/* ── Long press ─────────────────────────────────────────────── */
function setupLongPress(el, node, path) {
  let timer = null;

  const trigger = (e) => {
    const rect = el.getBoundingClientRect();
    showFileContextMenu(node, path, rect.left, rect.bottom);
  };

  el.addEventListener('touchstart', e => {
    timer = setTimeout(() => trigger(e), 500);
  }, { passive: true });
  el.addEventListener('touchend',  () => clearTimeout(timer));
  el.addEventListener('touchmove', () => clearTimeout(timer));
  el.addEventListener('contextmenu', e => { e.preventDefault(); trigger(e); });
}

/* ── Context menu for file items ────────────────────────────── */
function showFileContextMenu(node, path, x, y) {
  const items = [
    {
      label: 'New File', action: 'new',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      cb: () => showModal()
    },
    {
      label: 'Rename', action: 'rename',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      cb: () => renameFile(node)
    },
    {
      label: 'Duplicate', action: 'duplicate',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
      cb: () => duplicateFile(node, path)
    },
    {
      label: 'Export as Zip', action: 'export',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
      cb: () => alert('Export as Zip — coming in Stage 4!')
    },
    {
      label: 'Delete', action: 'delete', danger: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
      cb: () => deleteFile(node, path)
    }
  ];

  window.showContextMenu(items, x, y);
}

/* ── Open file ──────────────────────────────────────────────── */
function openFile(node, path) {
  const pathStr = path.map(n => n.name).join(' / ');
  window.dispatchEvent(new CustomEvent('openFile', {
    detail: { name: node.name, type: node.type, content: node.content || '', path: pathStr, node }
  }));
  window.navigateTo('editor');
}

/* ── File operations ────────────────────────────────────────── */
function renameFile(node) {
  const newName = prompt('Rename file:', node.name);
  if (newName && newName.trim()) {
    node.name = newName.trim();
    renderFileTree();
  }
}

function duplicateFile(node, path) {
  const parent = getParent(FileStore.projects, node);
  if (parent && parent.children) {
    const copy = JSON.parse(JSON.stringify(node));
    copy.name = 'copy_' + node.name;
    parent.children.push(copy);
    renderFileTree();
  }
}

function deleteFile(node, path) {
  if (!confirm(`Delete "${node.name}"?`)) return;
  removeNode(FileStore.projects, node);
  renderFileTree();
}

function getParent(nodes, target) {
  for (const n of nodes) {
    if (n.children) {
      if (n.children.includes(target)) return n;
      const found = getParent(n.children, target);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(nodes, target) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] === target) { nodes.splice(i, 1); return true; }
    if (nodes[i].children && removeNode(nodes[i].children, target)) return true;
  }
  return false;
}

/* ── Create file from modal ─────────────────────────────────── */
window.addEventListener('createFile', e => {
  const name = e.detail.name;
  const ext  = name.split('.').pop().toLowerCase();
  const typeMap = { py:'python', html:'html', css:'css', js:'javascript', jsx:'react', md:'markdown', ts:'javascript', cpp:'cpp', c:'cpp', txt:'text' };
  const type = typeMap[ext] || 'text';

  // Add to active project
  const project = FileStore.projects.find(p => p.name === FileStore.activeProject);
  if (project) {
    project.children.push({ name, type, content: '' });
    renderFileTree();
    // Auto-open the new file
    openFile({ name, type, content: '' }, [project, { name }]);
  }
});

/* ── Init on screen load ────────────────────────────────────── */
window.addEventListener('screenChange', e => {
  if (e.detail.screen === 'files') {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      renderFileTree();
      const projectLabel = document.getElementById('files-current-project');
      if (projectLabel) projectLabel.textContent = FileStore.activeProject;

      const btnNew = document.getElementById('btn-files-new');
      if (btnNew) btnNew.addEventListener('click', () => window.showModal(), { once: true });
    }, 50);
  }
});

/* ── Also wire home buttons once home loads ─────────────────── */
window.addEventListener('screenChange', e => {
  if (e.detail.screen === 'home') {
    setTimeout(() => {
      document.getElementById('btn-new-file')       ?.addEventListener('click', () => window.showModal(), { once: true });
      document.getElementById('btn-open-project')   ?.addEventListener('click', () => window.navigateTo('files'), { once: true });
      document.getElementById('btn-continue-session')?.addEventListener('click', () => window.navigateTo('editor'), { once: true });

      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          window.dispatchEvent(new CustomEvent('openLang', { detail: { lang } }));
          window.navigateTo('editor');
        });
      });
    }, 50);
  }
});

window.FileStore = FileStore;
