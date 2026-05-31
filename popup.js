// PageNoter — saves notes (per page or per whole site) using chrome.storage.local.

const noteEl = document.getElementById("note");
const statusEl = document.getElementById("status");
const urlEl = document.getElementById("page-url");
const clearBtn = document.getElementById("clear");
const themesEl = document.getElementById("themes");
const settingsEl = document.getElementById("settings");
const settingsToggle = document.getElementById("settings-toggle");
const scopeBtns = document.querySelectorAll(".scope-btn");

let tabUrl = null;
let currentScope = "page"; // "page" or "site"
let storageKey = null;
let saveTimer = null;

// Color themes. Each maps to the CSS variables defined in popup.css.
// The chosen theme is saved globally and applies on every page.
// Mix of light + dark; pastels tint the surface so they don't read as plain white.
const THEMES = {
  blue:     { label: "Blue",        bg: "#fafafa", surface: "#ffffff", text: "#1a1a1a", muted: "#666666", accent: "#4285f4", border: "#d4d4d4" },
  purple:   { label: "Dark Purple", bg: "#2a2433", surface: "#362f44", text: "#ece8f2", muted: "#a89db8", accent: "#9b87c4", border: "#4a4259" },
  midnight: { label: "Midnight",    bg: "#1e2433", surface: "#2a3142", text: "#e6ebf5", muted: "#8d9bb5", accent: "#5b9bd5", border: "#3a4458" },
  teal:     { label: "Dark Teal",   bg: "#16292b", surface: "#1f3a3c", text: "#e0f0f0", muted: "#7fa8aa", accent: "#2bb1b8", border: "#2f5052" },
  pink:     { label: "Pastel Pink", bg: "#f7dce8", surface: "#fceef4", text: "#5a2a3d", muted: "#b07d92", accent: "#d96a93", border: "#f0c4d6" },
  mint:     { label: "Pastel Mint", bg: "#d7efe3", surface: "#eaf7f1", text: "#1f3d32", muted: "#5f8a78", accent: "#3fa884", border: "#bfe3d3" },
};
const DEFAULT_THEME = "blue";

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
  chrome.storage.local.set({ [storageKey]: noteEl.value }, () => {
    showStatus("Saved");
  });
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
  noteEl.focus();
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
  noteEl.focus();
}

function applyTheme(name) {
  const theme = THEMES[name] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme)) {
    if (prop === "label") continue;
    root.style.setProperty("--" + prop, value);
  }
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

scopeBtns.forEach((b) => {
  b.addEventListener("click", () => setScope(b.dataset.scope));
});

noteEl.addEventListener("input", scheduleSave);

clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  save();
});

initThemes();
init();
