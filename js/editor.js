/* ============================================================
   Baobab Code — editor.js
   Stage 1: Code Drift
   Live editor: real typing, syntax highlighting, tabs, autosave
   ============================================================ */

'use strict';

/* ── Editor state ───────────────────────────────────────────── */
const Editor = {
  tabs:       [],       // { id, name, type, content, modified, path }
  activeTab:  null,
  tabCounter: 0,
  undoStack:  [],
  redoStack:  [],
  autosaveTimer: null
};

/* ── Language definitions ───────────────────────────────────── */
const LANG_MAP = {
  py:   'python',   python: 'python',
  js:   'javascript', javascript: 'javascript', mjs: 'javascript',
  jsx:  'react',    tsx: 'react',
  html: 'html',     htm: 'html',
  css:  'css',
  md:   'markdown', markdown: 'markdown',
  cpp:  'cpp',      c: 'cpp',   h: 'cpp',
  ts:   'javascript'
};

const LANG_KEYWORDS = {
  python:     ['def','class','import','from','return','if','elif','else','while','for','in','and','or','not','True','False','None','print','len','range','try','except','with','as','pass','break','continue','lambda','yield','async','await'],
  javascript: ['function','const','let','var','return','if','else','while','for','of','in','class','new','this','import','export','default','async','await','try','catch','finally','throw','typeof','instanceof','true','false','null','undefined','=>','switch','case','break','continue'],
  react:      ['function','const','let','var','return','import','export','default','class','extends','render','useState','useEffect','useRef','useContext','if','else','for','of','in','async','await','true','false','null'],
  html:       [],
  css:        ['background','color','margin','padding','border','display','flex','grid','font','width','height','position','top','left','right','bottom','overflow','opacity','transform','transition','animation','z-index','content','cursor'],
  cpp:        ['int','float','double','char','void','bool','string','return','if','else','while','for','class','public','private','protected','new','delete','namespace','using','include','define','true','false','nullptr','const','auto','struct','enum'],
  markdown:   []
};

/* ── Syntax highlighter ─────────────────────────────────────── */
function highlight(code, lang) {
  if (!code) return '';

  const escape = s => s
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  if (lang === 'html') return highlightHTML(code);
  if (lang === 'css')  return highlightCSS(code);
  if (lang === 'markdown') return highlightMarkdown(code);

  const keywords = new Set(LANG_KEYWORDS[lang] || LANG_KEYWORDS.javascript);

  return code.split('\n').map(line => {
    // Comments
    if (lang === 'python' && /^\s*#/.test(line)) return `<span class="tok-cm">${escape(line)}</span>`;
    if (/^\s*\/\//.test(line)) return `<span class="tok-cm">${escape(line)}</span>`;

    let out = '';
    let i = 0;
    const chars = line;

    while (i < chars.length) {
      // Block comment
      if (chars[i] === '/' && chars[i+1] === '*') {
        const end = chars.indexOf('*/', i+2);
        const seg = end === -1 ? chars.slice(i) : chars.slice(i, end+2);
        out += `<span class="tok-cm">${escape(seg)}</span>`;
        i += seg.length;
        continue;
      }

      // String double
      if (chars[i] === '"' || chars[i] === '`') {
        const q = chars[i];
        let j = i + 1;
        while (j < chars.length && !(chars[j] === q && chars[j-1] !== '\\')) j++;
        const seg = chars.slice(i, j+1);
        out += `<span class="tok-str">${escape(seg)}</span>`;
        i = j + 1;
        continue;
      }
      // String single
      if (chars[i] === "'") {
        let j = i + 1;
        while (j < chars.length && !(chars[j] === "'" && chars[j-1] !== '\\')) j++;
        const seg = chars.slice(i, j+1);
        out += `<span class="tok-str">${escape(seg)}</span>`;
        i = j + 1;
        continue;
      }

      // Numbers
      if (/\d/.test(chars[i]) && (i === 0 || /\W/.test(chars[i-1]))) {
        let j = i;
        while (j < chars.length && /[\d.]/.test(chars[j])) j++;
        out += `<span class="tok-num">${escape(chars.slice(i,j))}</span>`;
        i = j;
        continue;
      }

      // Word
      if (/[a-zA-Z_$]/.test(chars[i])) {
        let j = i;
        while (j < chars.length && /\w/.test(chars[j])) j++;
        const word = chars.slice(i, j);
        if (keywords.has(word)) {
          out += `<span class="tok-kw">${escape(word)}</span>`;
        } else if (j < chars.length && chars[j] === '(') {
          out += `<span class="tok-fn">${escape(word)}</span>`;
        } else if (/^[A-Z]/.test(word)) {
          out += `<span class="tok-cls">${escape(word)}</span>`;
        } else {
          out += escape(word);
        }
        i = j;
        continue;
      }

      // Operators
      if (/[+\-*/%=<>!&|^~]/.test(chars[i])) {
        out += `<span class="tok-op">${escape(chars[i])}</span>`;
        i++;
        continue;
      }

      // Punctuation
      if (/[{}()\[\];,.]/.test(chars[i])) {
        out += `<span class="tok-punc">${escape(chars[i])}</span>`;
        i++;
        continue;
      }

      out += escape(chars[i]);
      i++;
    }
    return out;
  }).join('\n');
}

function highlightHTML(code) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escape(code)
    .replace(/&lt;(!--[\s\S]*?--)&gt;/g, '<span class="tok-cm">&lt;$1&gt;</span>')
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>')
    .replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="tok-attr">$1</span><span class="tok-op">$2</span><span class="tok-str">$3</span>');
}

function highlightCSS(code) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escape(code)
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-cm">$1</span>')
    .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="tok-sel">$1</span> {')
    .replace(/([\w-]+)(\s*:\s*)([^;{}]+)/g, '<span class="tok-prop">$1</span>$2<span class="tok-val">$3</span>');
}

function highlightMarkdown(code) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escape(code)
    .replace(/^(#{1,6} .+)$/gm, '<span class="tok-kw">$1</span>')
    .replace(/(`[^`]+`)/g, '<span class="tok-str">$1</span>')
    .replace(/(\*\*[^*]+\*\*)/g, '<span class="tok-cls">$1</span>')
    .replace(/^(\s*[-*+] )/gm, '<span class="tok-op">$1</span>');
}

/* ── DOM references (set after screen loads) ────────────────── */
let $input, $highlight, $lineNums, $wrap, $empty, $filepath, $tabBar, $statusPos, $statusLang, $statusChars, $activeBg;

function grabDOM() {
  $input     = document.getElementById('code-input');
  $highlight = document.getElementById('code-highlight');
  $lineNums  = document.getElementById('line-numbers');
  $wrap      = document.getElementById('editor-content-wrap');
  $empty     = document.getElementById('editor-empty');
  $filepath  = document.getElementById('editor-filepath');
  $tabBar    = document.getElementById('tab-bar');
  $statusPos = document.getElementById('statusbar-pos');
  $statusLang= document.getElementById('statusbar-lang');
  $statusChars=document.getElementById('statusbar-chars');
  $activeBg  = document.getElementById('active-line-bg');
}

/* ── Refresh syntax highlight overlay ──────────────────────── */
function refreshHighlight() {
  if (!$input || !$highlight) return;
  const tab = Editor.tabs.find(t => t.id === Editor.activeTab);
  if (!tab) return;
  $highlight.innerHTML = highlight($input.value, tab.lang);
}

/* ── Refresh line numbers ───────────────────────────────────── */
function refreshLineNumbers() {
  if (!$input || !$lineNums) return;
  const lines = $input.value.split('\n').length;
  const current = $lineNums.children.length;
  if (lines === current) return;
  $lineNums.innerHTML = Array.from({ length: lines }, (_, i) =>
    `<span class="line-num" id="ln-${i+1}">${i+1}</span>`
  ).join('');
}

/* ── Update status bar ──────────────────────────────────────── */
function refreshStatus() {
  if (!$input) return;
  const val = $input.value;
  const pos = $input.selectionStart;
  const before = val.slice(0, pos);
  const ln  = (before.match(/\n/g) || []).length + 1;
  const col = pos - before.lastIndexOf('\n');
  const tab = Editor.tabs.find(t => t.id === Editor.activeTab);

  if ($statusPos)   $statusPos.textContent   = `Ln ${ln}, Col ${col}`;
  if ($statusLang)  $statusLang.textContent  = tab ? tab.lang.toUpperCase() : '—';
  if ($statusChars) $statusChars.textContent = `${val.length} chars`;
}

/* ── Active line highlight ──────────────────────────────────── */
function refreshActiveLine() {
  if (!$input || !$activeBg) return;
  const val  = $input.value;
  const pos  = $input.selectionStart;
  const line = (val.slice(0, pos).match(/\n/g) || []).length;
  const lineH = 21; // matches line-height 1.75 * 13px ≈ 22.75; close enough
  $activeBg.style.top = `${12 + line * lineH}px`;
}

/* ── Sync scroll between textarea and highlight div ─────────── */
function syncScroll() {
  if (!$input || !$highlight) return;
  $highlight.scrollTop  = $input.scrollTop;
  $highlight.scrollLeft = $input.scrollLeft;
  if ($lineNums) $lineNums.scrollTop = $input.scrollTop;
}

/* ── Open file in editor ────────────────────────────────────── */
function openFileInEditor(name, type, content, pathStr, node) {
  grabDOM();
  if (!$input) return;

  const lang = LANG_MAP[type] || LANG_MAP[name.split('.').pop().toLowerCase()] || 'javascript';

  // Check if already open
  let tab = Editor.tabs.find(t => t.name === name);
  if (!tab) {
    tab = {
      id:       ++Editor.tabCounter,
      name,
      type,
      lang,
      content:  content || '',
      modified: false,
      path:     pathStr || name,
      node
    };
    Editor.tabs.push(tab);
  }

  setActiveTab(tab.id);
}

/* ── Set active tab ─────────────────────────────────────────── */
function setActiveTab(tabId) {
  grabDOM();

  // Save current content before switching
  const prev = Editor.tabs.find(t => t.id === Editor.activeTab);
  if (prev && $input) prev.content = $input.value;

  Editor.activeTab = tabId;
  const tab = Editor.tabs.find(t => t.id === tabId);
  if (!tab) return;

  // Show editor, hide empty state
  if ($empty)  $empty.style.display   = 'none';
  if ($wrap)   $wrap.style.display    = 'flex';
  if ($lineNums) $lineNums.style.display = 'flex';

  // Set content
  if ($input) {
    $input.value = tab.content;
    $input.focus();
  }

  // Update filepath
  if ($filepath) $filepath.textContent = tab.path;

  renderTabs();
  refreshHighlight();
  refreshLineNumbers();
  refreshStatus();
  refreshActiveLine();
}

/* ── Render tab bar ─────────────────────────────────────────── */
function renderTabs() {
  if (!$tabBar) $tabBar = document.getElementById('tab-bar');
  if (!$tabBar) return;
  $tabBar.innerHTML = Editor.tabs.map(tab => `
    <div class="tab ${tab.id === Editor.activeTab ? 'active' : ''}" data-tab-id="${tab.id}">
      ${tab.modified ? '<span class="tab-modified"></span>' : ''}
      ${tab.name}
      <span class="tab-close" data-close-id="${tab.id}">×</span>
    </div>
  `).join('');

  $tabBar.querySelectorAll('.tab').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.classList.contains('tab-close')) return;
      setActiveTab(Number(el.dataset.tabId));
    });
  });
  $tabBar.querySelectorAll('.tab-close').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      closeTab(Number(el.dataset.closeId));
    });
  });
}

/* ── Close tab ──────────────────────────────────────────────── */
function closeTab(tabId) {
  const idx = Editor.tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;
  Editor.tabs.splice(idx, 1);

  if (Editor.activeTab === tabId) {
    if (Editor.tabs.length) {
      setActiveTab(Editor.tabs[Math.max(0, idx-1)].id);
    } else {
      Editor.activeTab = null;
      grabDOM();
      if ($empty)   $empty.style.display   = 'flex';
      if ($wrap)    $wrap.style.display    = 'none';
      if ($lineNums) $lineNums.style.display = 'none';
      if ($tabBar)  $tabBar.innerHTML      = '';
      if ($filepath) $filepath.textContent = 'No file open';
    }
  } else {
    renderTabs();
  }
}

/* ── Input handler ──────────────────────────────────────────── */
function handleInput() {
  const tab = Editor.tabs.find(t => t.id === Editor.activeTab);
  if (!tab || !$input) return;
  tab.content  = $input.value;
  tab.modified = true;

  refreshHighlight();
  refreshLineNumbers();
  refreshStatus();
  refreshActiveLine();
  renderTabs();

  // Autosave
  if (window.App?.settings?.autosave) {
    clearTimeout(Editor.autosaveTimer);
    Editor.autosaveTimer = setTimeout(() => autosave(tab), 1500);
  }
}

/* ── Autosave ───────────────────────────────────────────────── */
function autosave(tab) {
  try {
    localStorage.setItem(`baobab-file-${tab.name}`, tab.content);
    tab.modified = false;
    renderTabs();
  } catch (_) {}
}

/* ── Tab key in editor ──────────────────────────────────────── */
function handleKeydown(e) {
  if (!$input) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    const spaces = ' '.repeat(window.App?.settings?.tabWidth || 4);
    insertAtCursor(spaces);
    return;
  }

  // Auto-close brackets
  const pairs = { '(':')', '[':']', '{':'}', '"':'"', "'":"'" };
  if (pairs[e.key]) {
    e.preventDefault();
    const close = pairs[e.key];
    insertAtCursor(e.key + close, -1);
    return;
  }
}

/* ── Insert text at cursor ──────────────────────────────────── */
function insertAtCursor(text, cursorOffset = 0) {
  if (!$input) return;
  const start = $input.selectionStart;
  const end   = $input.selectionEnd;
  const val   = $input.value;
  $input.value = val.slice(0, start) + text + val.slice(end);
  const pos = start + text.length + cursorOffset;
  $input.selectionStart = $input.selectionEnd = pos;
  handleInput();
}

/* ── Keyboard toolbar keys ──────────────────────────────────── */
function setupKbdToolbar() {
  document.querySelectorAll('.kbd-key[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => {
      const raw    = btn.dataset.insert || '';
      const text   = raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
      const offset = btn.dataset.cursor ? Number(btn.dataset.cursor) : 0;
      insertAtCursor(text, offset);
      $input && $input.focus();
    });
  });

  const undoBtn = document.getElementById('kbd-undo');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      $input && document.execCommand('undo');
    });
  }
}

/* ── Open Lang from Quick Start ─────────────────────────────── */
const LANG_STARTERS = {
  python:   { name: 'main.py',   type: 'python',   content: '# Python starter\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Baobab Code"))\n' },
  html:     { name: 'index.html',type: 'html',     content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n' },
  react:    { name: 'App.jsx',   type: 'react',    content: 'import { useState } from "react";\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <h1>Count: {count}</h1>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nexport default App;\n' },
  nodejs:   { name: 'server.js', type: 'javascript',content: 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Hello from Baobab Code!\\n");\n});\n\nserver.listen(3000, () => {\n  console.log("Server running on port 3000");\n});\n' },
  cpp:      { name: 'main.cpp',  type: 'cpp',      content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Baobab Code!" << endl;\n    return 0;\n}\n' },
  markdown: { name: 'README.md', type: 'markdown', content: '# My Project\n\n> Built with Baobab Code\n\n## Getting Started\n\n- Install dependencies\n- Run the app\n- Start coding!\n\n## Features\n\n- Feature one\n- Feature two\n' }
};

window.addEventListener('openLang', e => {
  const starter = LANG_STARTERS[e.detail.lang];
  if (starter) openFileInEditor(starter.name, starter.type, starter.content, starter.name);
});

window.addEventListener('openFile', e => {
  const { name, type, content, path, node } = e.detail;
  openFileInEditor(name, type, content, path, node);
});

/* ── Wire up on screen load ─────────────────────────────────── */
window.addEventListener('screenChange', e => {
  if (e.detail.screen === 'editor') {
    setTimeout(() => {
      grabDOM();

      if ($input) {
        $input.addEventListener('input',   handleInput);
        $input.addEventListener('keydown', handleKeydown);
        $input.addEventListener('scroll',  syncScroll);
        $input.addEventListener('click',   () => { refreshStatus(); refreshActiveLine(); });
        $input.addEventListener('keyup',   () => { refreshStatus(); refreshActiveLine(); });
      }

      // Settings button
      document.getElementById('btn-editor-settings')
        ?.addEventListener('click', () => window.navigateTo('settings'), { once: true });

      setupKbdToolbar();

      // Restore active tab if exists
      if (Editor.activeTab) setActiveTab(Editor.activeTab);

    }, 50);
  }
});

window.Editor = Editor;
window.openFileInEditor = openFileInEditor;
