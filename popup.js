// PageNoter v0.1 — saves one note per page URL using chrome.storage.local.

const noteEl = document.getElementById("note");
const statusEl = document.getElementById("status");
const urlEl = document.getElementById("page-url");
const clearBtn = document.getElementById("clear");
const themesEl = document.getElementById("themes");

let storageKey = null;
let saveTimer = null;

// Color themes. Each maps to the CSS variables defined in popup.css.
// The chosen theme is saved globally and applies on every page.
const THEMES = {
  blue:   { label: "Blue",         bg: "#fafafa", surface: "#ffffff", text: "#1a1a1a", muted: "#666666", accent: "#4285f4", border: "#cccccc" },
  purple: { label: "Dark Purple",  bg: "#2a2433", surface: "#362f44", text: "#ece8f2", muted: "#a89db8", accent: "#9b87c4", border: "#4a4259" },
  cyan:   { label: "Cyan",         bg: "#f3fbfc", surface: "#ffffff", text: "#0c2b30", muted: "#5a8088", accent: "#00acc1", border: "#b8e0e6" },
  pink:   { label: "Pastel Pink",  bg: "#fdf3f7", surface: "#ffffff", text: "#4a2c39", muted: "#a87d8d", accent: "#e6849f", border: "#f3d4de" },
  mint:   { label: "Pastel Mint",  bg: "#f1faf5", surface: "#ffffff", text: "#213b30", muted: "#6e9384", accent: "#5fb89a", border: "#c8e8da" },
};
const DEFAULT_THEME = "blue";

// Use the URL without the hash so "#section" anchors share one note per page.
function keyForUrl(url) {
  try {
    const u = new URL(url);
    return "note:" + u.origin + u.pathname + u.search;
  } catch {
    return "note:" + url;
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

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    urlEl.textContent = "No page detected";
    noteEl.disabled = true;
    return;
  }

  urlEl.textContent = tab.url;
  urlEl.title = tab.url;
  storageKey = keyForUrl(tab.url);

  const stored = await chrome.storage.local.get(storageKey);
  noteEl.value = stored[storageKey] || "";
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

noteEl.addEventListener("input", scheduleSave);

clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  save();
});

initThemes();
init();
