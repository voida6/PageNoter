// Sticky notes: renders pinned notes as floating widgets on the page.
// Runs in an isolated world; the widget lives in a Shadow DOM so the host
// page's styles can't affect it. THEMES / DEFAULT_THEME come from theme.js.

const PAGE_PREFIX = "note:page:";
const SITE_PREFIX = "note:site:";

function pageKey() {
  return PAGE_PREFIX + location.origin + location.pathname + location.search;
}
function siteKey() {
  return SITE_PREFIX + location.hostname;
}
function relevantKeys() {
  return [pageKey(), siteKey()];
}

const SHADOW_STYLE = `
  .note {
    position: fixed;
    width: 240px;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    overflow: hidden;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: var(--accent);
    color: #ffffff;
    font-size: 12px;
    cursor: move;
    user-select: none;
  }
  .bar .title { font-weight: 600; }
  .bar button {
    padding: 0 4px;
    font-size: 16px;
    line-height: 1;
    color: #ffffff;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .bar button:hover { background: rgba(255, 255, 255, 0.25); }
  textarea {
    min-height: 120px;
    padding: 8px;
    font-family: inherit;
    font-size: 13px;
    color: var(--text);
    background: var(--surface);
    border: none;
    resize: vertical;
    outline: none;
  }
  textarea::placeholder { color: var(--muted); }
`;

let host = null;
let shadow = null;
let container = null;
const widgets = new Map(); // key -> { el, textarea, saveTimer }

function ensureHost() {
  if (host) return;
  host = document.createElement("div");
  host.id = "pagenoter-sticky-host";
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.zIndex = "2147483647";

  shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = SHADOW_STYLE;
  shadow.appendChild(style);
  container = document.createElement("div");
  shadow.appendChild(container);

  (document.documentElement || document.body).appendChild(host);
}

function applyThemeColors(name) {
  if (!container) return;
  const theme = THEMES[name] || THEMES[DEFAULT_THEME];
  for (const [prop, value] of Object.entries(theme)) {
    if (prop === "label") continue;
    container.style.setProperty("--" + prop, value);
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function makeDraggable(noteEl, barEl, key) {
  barEl.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const rect = noteEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = rect.left;
    const originY = rect.top;

    function move(ev) {
      const left = clamp(originX + ev.clientX - startX, 0, window.innerWidth - 40);
      const top = clamp(originY + ev.clientY - startY, 0, window.innerHeight - 30);
      noteEl.style.left = left + "px";
      noteEl.style.top = top + "px";
      noteEl.style.right = "auto";
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      const r = noteEl.getBoundingClientRect();
      savePosition(key, Math.round(r.top), Math.round(r.left));
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

async function savePosition(key, top, left) {
  const { stickies = {} } = await chrome.storage.local.get("stickies");
  if (!stickies[key]) return; // unpinned meanwhile
  stickies[key] = { top, left };
  chrome.storage.local.set({ stickies });
}

async function unpin(key) {
  const { stickies = {} } = await chrome.storage.local.get("stickies");
  delete stickies[key];
  chrome.storage.local.set({ stickies });
}

async function addWidget(key, pos) {
  ensureHost();
  const isSite = key.startsWith(SITE_PREFIX);

  const note = document.createElement("div");
  note.className = "note";
  const offset = widgets.size * 24;
  if (pos && typeof pos === "object") {
    note.style.top = pos.top + "px";
    note.style.left = pos.left + "px";
  } else {
    note.style.top = 80 + offset + "px";
    note.style.left = window.innerWidth - 260 - offset + "px";
  }

  const bar = document.createElement("div");
  bar.className = "bar";
  const title = document.createElement("span");
  title.className = "title";
  title.textContent = isSite ? "Site note" : "Page note";
  const close = document.createElement("button");
  close.textContent = "×"; // ×
  close.title = "Unpin";
  close.addEventListener("click", () => unpin(key));
  bar.append(title, close);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write a note...";
  const stored = await chrome.storage.local.get(key);
  textarea.value = stored[key] || "";

  const widget = { el: note, textarea, saveTimer: null };
  textarea.addEventListener("input", () => {
    clearTimeout(widget.saveTimer);
    widget.saveTimer = setTimeout(() => {
      saveNote(key, textarea.value);
    }, 400);
  });

  note.append(bar, textarea);
  container.appendChild(note);
  makeDraggable(note, bar, key);
  widgets.set(key, widget);
}

function removeWidget(key) {
  const widget = widgets.get(key);
  if (!widget) return;
  clearTimeout(widget.saveTimer);
  widget.el.remove();
  widgets.delete(key);
}

async function refresh() {
  const { stickies = {} } = await chrome.storage.local.get("stickies");
  for (const key of relevantKeys()) {
    const sticky = stickies[key];
    if (sticky && !widgets.has(key)) {
      await addWidget(key, sticky);
    } else if (!sticky && widgets.has(key)) {
      removeWidget(key);
    }
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.stickies) refresh();
  if (changes.theme) applyThemeColors(changes.theme.newValue || DEFAULT_THEME);
  for (const key of relevantKeys()) {
    if (changes[key] && widgets.has(key)) {
      const { textarea } = widgets.get(key);
      // Don't clobber what the user is currently typing in the widget.
      if (textarea.getRootNode().activeElement !== textarea) {
        textarea.value = changes[key].newValue || "";
      }
    }
  }
});

(async function start() {
  const { theme } = await chrome.storage.local.get("theme");
  ensureHost();
  applyThemeColors(theme || DEFAULT_THEME);
  refresh();
})();
