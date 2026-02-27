import * as vscode from "vscode";
import { ImportNode } from "./parser";

/**
 * Opens (or reveals) a webview editor panel showing the import profile tree.
 */
export function openProfilePanel(
  context: vscode.ExtensionContext,
  root: ImportNode,
  title: string
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "importProfileViewer",
    title,
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getWebviewHtml(root);
  return panel;
}

function getWebviewHtml(root: ImportNode): string {
  const treeHtml = root.children.map((c) => renderNode(c)).join("\n");

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Import Profile Viewer</title>
<style>
  :root {
    --green:  #4ec9b0;
    --yellow: #cca700;
    --orange: #d18616;
    --red:    #f44747;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family, Consolas, monospace);
    font-size: var(--vscode-font-size, 13px);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    padding: 12px 16px;
    line-height: 1.6;
  }
  h2 {
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 1.1em;
    color: var(--vscode-foreground);
  }
  .summary {
    margin-bottom: 14px;
    opacity: 0.8;
    font-size: 0.92em;
  }

  /* ── tree ── */
  ul.tree, ul.tree ul {
    list-style: none;
    padding-left: 20px;
  }
  ul.tree { padding-left: 0; }

  li { position: relative; }

  .row {
    display: flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: default;
    user-select: none;
    gap: 8px;
  }
  .row:hover {
    background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.06));
  }

  /* toggle arrow */
  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s;
  }
  .toggle.expanded { transform: rotate(90deg); }
  .toggle.leaf { visibility: hidden; }

  /* colour dot */
  .dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.green  { background: var(--green); }
  .dot.yellow { background: var(--yellow); }
  .dot.orange { background: var(--orange); }
  .dot.red    { background: var(--red); }

  .name {
    font-weight: 500;
    white-space: nowrap;
  }
  .timing {
    opacity: 0.65;
    white-space: nowrap;
    font-size: 0.92em;
  }

  /* children list */
  li > ul { display: none; }
  li.open > ul { display: block; }

  /* search box */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .search-bar input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--vscode-input-border, #555);
    background: var(--vscode-input-background, #1e1e1e);
    color: var(--vscode-input-foreground, #ccc);
    border-radius: 4px;
    font-size: 0.95em;
    outline: none;
  }
  .search-bar input:focus {
    border-color: var(--vscode-focusBorder, #007acc);
  }
  .search-bar .count {
    opacity: 0.65;
    font-size: 0.9em;
    white-space: nowrap;
  }
  .highlight {
    background: var(--vscode-editor-findMatchHighlightBackground, rgba(255,200,0,0.3));
    border-radius: 2px;
  }
  li.hidden { display: none; }
</style>
</head>
<body>
  <h2>Import Profile Viewer</h2>
  <div class="summary" id="summary"></div>
  <div class="search-bar">
    <input type="text" id="search" placeholder="Filter modules…" />
    <span class="count" id="matchCount"></span>
  </div>
  <ul class="tree" id="tree">
    ${treeHtml}
  </ul>
<script>
(function () {
  // ── toggle expand / collapse ──
  document.getElementById('tree').addEventListener('click', (e) => {
    const toggle = e.target.closest('.toggle');
    if (!toggle || toggle.classList.contains('leaf')) return;
    const li = toggle.closest('li');
    li.classList.toggle('open');
    toggle.classList.toggle('expanded');
  });

  // ── summary ──
  const allItems = document.querySelectorAll('#tree li');
  document.getElementById('summary').textContent =
    allItems.length + ' modules loaded';

  // ── search / filter ──
  const searchInput = document.getElementById('search');
  const matchCount  = document.getElementById('matchCount');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();

    // reset
    allItems.forEach(li => {
      li.classList.remove('hidden');
      const nameEl = li.querySelector(':scope > .row .name');
      // restore original text (strip <mark>)
      nameEl.innerHTML = nameEl.textContent;
    });

    if (!q) { matchCount.textContent = ''; return; }

    let matches = 0;
    allItems.forEach(li => {
      const nameEl = li.querySelector(':scope > .row .name');
      const text = nameEl.textContent.toLowerCase();
      if (text.includes(q)) {
        matches++;
        // highlight matched text
        const raw = nameEl.textContent;
        const idx = raw.toLowerCase().indexOf(q);
        nameEl.innerHTML =
          escapeHtml(raw.substring(0, idx)) +
          '<span class="highlight">' + escapeHtml(raw.substring(idx, idx + q.length)) + '</span>' +
          escapeHtml(raw.substring(idx + q.length));
        // make sure all ancestors are visible and open
        let parent = li.parentElement?.closest('li');
        while (parent) {
          parent.classList.remove('hidden');
          parent.classList.add('open');
          const tgl = parent.querySelector(':scope > .row .toggle');
          if (tgl) tgl.classList.add('expanded');
          parent = parent.parentElement?.closest('li');
        }
      } else {
        li.classList.add('hidden');
      }
    });

    matchCount.textContent = matches + ' match' + (matches !== 1 ? 'es' : '');
  });

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
</script>
</body>
</html>`;
}

/** Recursively render a tree node as nested <li>. */
function renderNode(node: ImportNode): string {
  const hasChildren = node.children.length > 0;
  const dotClass = getDotClass(node.cumulativeTime);
  const toggleClass = hasChildren ? "toggle" : "toggle leaf";

  const childrenHtml = hasChildren
    ? `<ul>${node.children.map((c) => renderNode(c)).join("\n")}</ul>`
    : "";

  return `<li>
  <div class="row">
    <span class="${toggleClass}">&#9654;</span>
    <span class="dot ${dotClass}"></span>
    <span class="name">${escapeHtml(node.name)}</span>
    <span class="timing">self: ${formatTime(node.selfTime)} | cumul: ${formatTime(node.cumulativeTime)}</span>
  </div>
  ${childrenHtml}
</li>`;
}

function getDotClass(cumulativeTime: number): string {
  if (cumulativeTime > 50_000) return "red";
  if (cumulativeTime > 10_000) return "orange";
  if (cumulativeTime > 2_000) return "yellow";
  return "green";
}

function formatTime(us: number): string {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)} s`;
  if (us >= 1_000) return `${(us / 1_000).toFixed(1)} ms`;
  return `${us} µs`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
