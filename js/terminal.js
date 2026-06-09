/* ============================================================
   Baobab Code — terminal.js
   Terminal / run output panel
   ============================================================ */

'use strict';

const Terminal = {
  history: [],
  activePanel: 'python'
};

function appendLine(text, cls = '') {
  const output = document.getElementById('terminal-output');
  if (!output) return;
  const div = document.createElement('div');
  div.className = `t-line${cls ? ' ' + cls : ''}`;
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  const output = document.getElementById('terminal-output');
  if (output) output.innerHTML = '';
}

function setResultLine(text) {
  const el = document.getElementById('terminal-result-line');
  if (el) el.innerHTML = `<span class="t-check">✓</span> ${text}`;
}

function runCurrentFile() {
  const tab = window.Editor?.tabs?.find(t => t.id === window.Editor?.activeTab);
  clearOutput();

  if (!tab) {
    appendLine('No file open. Open a file from the editor first.', 't-dim');
    return;
  }

  // Update file info bar
  const fnEl = document.getElementById('terminal-filename');
  if (fnEl) fnEl.textContent = tab.name;
  const wsEl = document.getElementById('terminal-workspace-name');
  if (wsEl) wsEl.textContent = 'MyWebsite';

  appendLine(`Running ${tab.name} in MyWebsite...`, 't-run');
  appendLine('');

  // Simulate execution
  setTimeout(() => {
    if (tab.lang === 'python') {
      const prints = (tab.content.match(/print\(["'](.+?)["']\)/g) || []);
      if (prints.length) {
        prints.forEach(p => {
          const msg = p.match(/print\(["'](.+?)["']\)/)[1];
          const line = document.createElement('div');
          line.className = 't-line t-ok';
          line.innerHTML = `<span class="t-check">✓</span> ${msg}`;
          document.getElementById('terminal-output')?.appendChild(line);
        });
      } else {
        const line = document.createElement('div');
        line.className = 't-line t-ok';
        line.innerHTML = `<span class="t-check">✓</span> (No output)`;
        document.getElementById('terminal-output')?.appendChild(line);
      }
    } else if (tab.lang === 'javascript') {
      const logs = (tab.content.match(/console\.log\(["'`](.+?)["'`]\)/g) || []);
      if (logs.length) {
        logs.forEach(l => {
          const msg = l.match(/console\.log\(["'`](.+?)["'`]\)/)[1];
          const line = document.createElement('div');
          line.className = 't-line t-ok';
          line.innerHTML = `<span class="t-check">✓</span> ${msg}`;
          document.getElementById('terminal-output')?.appendChild(line);
        });
      } else {
        appendLine('(No console.log output found)', 't-dim');
      }
    } else {
      appendLine(`[${tab.lang.toUpperCase()}] Execution preview not available in browser.`, 't-info');
      appendLine(`File: ${tab.name} — ${tab.content.split('\n').length} lines`, 't-dim');
    }

    appendLine('');
    appendLine('Process exited with code 0', 't-dim');
    appendLine(`Execution time: ${(Math.random() * 8 + 1).toFixed(0)}ms`, 't-dim');

    const lastOutput = document.querySelector('#terminal-output .t-ok');
    if (lastOutput) setResultLine(lastOutput.textContent.trim());

    Terminal.history.push({ name: tab.name, time: new Date().toLocaleTimeString() });
  }, 300);
}

window.addEventListener('screenChange', e => {
  if (e.detail.screen === 'terminal') {
    setTimeout(() => {
      // Tab switching
      document.querySelectorAll('.terminal-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.terminal-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // Bottom tabs
      document.querySelectorAll('.tbt').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tbt').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // Run badge click
      document.querySelector('.terminal-run-badge')
        ?.addEventListener('click', runCurrentFile);

      // Sync current file name
      const tab = window.Editor?.tabs?.find(t => t.id === window.Editor?.activeTab);
      if (tab) {
        const fnEl = document.getElementById('terminal-filename');
        if (fnEl) fnEl.textContent = tab.name;
      }

    }, 50);
  }
});

window.Terminal = Terminal;
window.runCurrentFile = runCurrentFile;
