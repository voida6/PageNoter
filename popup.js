// PageNoter v0.1 — saves one note per page URL using chrome.storage.local.

const noteEl = document.getElementById("note");
const statusEl = document.getElementById("status");
const urlEl = document.getElementById("page-url");
const clearBtn = document.getElementById("clear");

let storageKey = null;
let saveTimer = null;

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

noteEl.addEventListener("input", scheduleSave);

clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  save();
});

init();
