// All-notes page: lists every saved note (page + site), with search and delete.

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");

const PAGE_PREFIX = "note:page:";
const SITE_PREFIX = "note:site:";

let notes = []; // { scope, key, location, text }

// Where the location link should point.
function hrefFor(note) {
  return note.scope === "site" ? "https://" + note.location : note.location;
}

async function loadNotes() {
  const all = await chrome.storage.local.get(null);
  notes = [];
  for (const [key, value] of Object.entries(all)) {
    if (typeof value !== "string" || value.trim() === "") continue;
    if (key.startsWith(PAGE_PREFIX)) {
      notes.push({ scope: "page", key, location: key.slice(PAGE_PREFIX.length), text: value });
    } else if (key.startsWith(SITE_PREFIX)) {
      notes.push({ scope: "site", key, location: key.slice(SITE_PREFIX.length), text: value });
    }
  }
  notes.sort((a, b) => a.location.localeCompare(b.location));
  render();
}

function card(note) {
  const el = document.createElement("div");
  el.className = "card";

  const head = document.createElement("div");
  head.className = "card-head";

  const badge = document.createElement("span");
  badge.className = "badge badge-" + note.scope;
  badge.textContent = note.scope === "site" ? "Site" : "Page";

  const link = document.createElement("a");
  link.className = "loc";
  link.href = hrefFor(note);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = note.location;
  link.title = link.href;

  const del = document.createElement("button");
  del.className = "del";
  del.title = "Delete note";
  del.setAttribute("aria-label", "Delete note");
  del.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
    '<path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
  del.addEventListener("click", async () => {
    await chrome.storage.local.remove(note.key);
    notes = notes.filter((n) => n.key !== note.key);
    render();
  });

  head.append(badge, link, del);

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = note.text;

  el.append(head, text);
  return el;
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const filtered = q
    ? notes.filter(
        (n) => n.location.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
      )
    : notes;

  listEl.textContent = "";
  filtered.forEach((note) => listEl.appendChild(card(note)));

  if (notes.length === 0) {
    emptyEl.textContent = "No notes yet. Open the PageNoter popup on any page to write one.";
    emptyEl.hidden = false;
    countEl.textContent = "";
  } else if (filtered.length === 0) {
    emptyEl.textContent = "No notes match your search.";
    emptyEl.hidden = false;
    countEl.textContent = "";
  } else {
    emptyEl.hidden = true;
    const noun = filtered.length === 1 ? "note" : "notes";
    countEl.textContent = filtered.length + " " + noun + (q ? " (filtered)" : "");
  }
}

async function applySavedTheme() {
  const stored = await chrome.storage.local.get("theme");
  applyThemeVars(stored.theme || DEFAULT_THEME);
}

searchEl.addEventListener("input", render);

applySavedTheme();
loadNotes();
