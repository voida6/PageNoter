// PageNoter — saves notes (per page or per whole site) using chrome.storage.local.

const noteEl = document.getElementById("note");
const statusEl = document.getElementById("status");
const urlEl = document.getElementById("page-url");
const clearBtn = document.getElementById("clear");
const pinBtn = document.getElementById("pin");
const themesEl = document.getElementById("themes");
const settingsEl = document.getElementById("settings");
const settingsToggle = document.getElementById("settings-toggle");
const allNotesBtn = document.getElementById("all-notes");
const scopeBtns = document.querySelectorAll(".scope-btn");

let tabUrl = null;
let currentScope = "page"; // "page" or "site"
let storageKey = null;
let saveTimer = null;

// THEMES, DEFAULT_THEME and applyThemeVars() come from theme.js (loaded first).

// Build the storage key for the current tab + scope.
// - page: the exact URL (ignoring the #hash so anchors share one note).
// - site: the whole website, keyed by hostname (any path on that host).
function keyForScope(url, scope) {
  try {
    const u = new URL(url);
    if (scope === "site") return "note:site:" + u.hostname;
    return "note:page:" + u.origin + u.pathname + u.search;
  } catch {
    return "note:" + scope + ":" + url;
  }
}

function showStatus(text) {
  statusEl.textContent = text;
  if (text) {
    setTimeout(() => {
      statusEl.textContent = "";
    }, 1500);
  }
}

function save() {
  if (!storageKey) return;
  saveNote(storageKey, noteEl.value).then(() => showStatus("Saved"));
}

// Debounce saves while the user is typing.
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

// Load the note for the current tab + scope into the textarea.
async function loadNote() {
  storageKey = keyForScope(tabUrl, currentScope);
  const stored = await chrome.storage.local.get(storageKey);
  noteEl.value = stored[storageKey] || "";
}

// Reflect the active scope in the buttons, the URL line, and the placeholder.
function reflectScope() {
  scopeBtns.forEach((b) => b.classList.toggle("active", b.dataset.scope === currentScope));

  let host = "this site";
  let display = tabUrl;
  try {
    const u = new URL(tabUrl);
    host = u.hostname;
    // Page scope shows the full URL; site scope shows just the origin.
    display = currentScope === "site" ? u.origin : tabUrl;
  } catch {}

  urlEl.textContent = display;
  urlEl.title = display;
  noteEl.placeholder =
    currentScope === "site"
      ? "Write a note for all of " + host + "..."
      : "Write a note for this page...";
}

// Switch scope, flushing any pending save to the previous scope first.
async function setScope(scope) {
  if (scope === currentScope) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    save();
  }
  currentScope = scope;
  reflectScope();
  await loadNote();
  updatePinState();
  noteEl.focus();
}

// A note can only be pinned on normal web pages (content scripts can't run on
// chrome://, edge://, the web store, etc.).
function isStickablePage() {
  return /^https?:\/\//i.test(tabUrl || "");
}

// Reflect whether the current scope's note is pinned as a sticky note.
async function updatePinState() {
  if (!isStickablePage()) {
    pinBtn.disabled = true;
    pinBtn.classList.remove("active");
    pinBtn.textContent = "Pin";
    pinBtn.title = "Sticky notes work only on normal web pages";
    return;
  }
  pinBtn.disabled = false;
  const { stickies = {} } = await chrome.storage.local.get("stickies");
  const pinned = !!stickies[storageKey];
  pinBtn.classList.toggle("active", pinned);
  pinBtn.textContent = pinned ? "Unpin" : "Pin";
  pinBtn.title = pinned
    ? "Remove the sticky note from the page"
    : "Show this note as a sticky note on the page";
}

// Toggle the current note's sticky state. The content script reacts to the
// "stickies" storage change and shows/hides the floating widget.
async function togglePin() {
  if (!storageKey || !isStickablePage()) return;
  const { stickies = {} } = await chrome.storage.local.get("stickies");
  if (stickies[storageKey]) {
    delete stickies[storageKey];
  } else {
    stickies[storageKey] = true; // default position; content script places it
  }
  await chrome.storage.local.set({ stickies });
  updatePinState();
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    urlEl.textContent = "No page detected";
    noteEl.disabled = true;
    scopeBtns.forEach((b) => (b.disabled = true));
    return;
  }

  tabUrl = tab.url;
  currentScope = "page"; // always open in page scope

  reflectScope();
  await loadNote();
  updatePinState();
  noteEl.focus();
}

function applyTheme(name) {
  applyThemeVars(name);
  themesEl.querySelectorAll(".swatch").forEach((s) => {
    s.classList.toggle("selected", s.dataset.theme === name);
  });
}

async function initThemes() {
  for (const [key, theme] of Object.entries(THEMES)) {
    const swatch = document.createElement("button");
    swatch.className = "swatch";
    swatch.dataset.theme = key;
    swatch.title = theme.label;
    swatch.style.background = theme.accent;
    swatch.addEventListener("click", () => {
      applyTheme(key);
      chrome.storage.local.set({ theme: key });
    });
    themesEl.appendChild(swatch);
  }

  const stored = await chrome.storage.local.get("theme");
  applyTheme(stored.theme || DEFAULT_THEME);
}

function toggleSettings() {
  const open = settingsEl.hasAttribute("hidden");
  settingsEl.toggleAttribute("hidden", !open);
  settingsToggle.classList.toggle("open", open);
  settingsToggle.setAttribute("aria-expanded", String(open));
}

settingsToggle.addEventListener("click", toggleSettings);

allNotesBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("notes.html") });
});

scopeBtns.forEach((b) => {
  b.addEventListener("click", () => setScope(b.dataset.scope));
});

noteEl.addEventListener("input", scheduleSave);

pinBtn.addEventListener("click", togglePin);

clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  save();
});

initThemes();
init();
