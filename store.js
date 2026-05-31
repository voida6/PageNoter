// Shared note storage helpers used by the popup, sticky widget, and all-notes page.

// Per-note timestamps live in a single map under this key:
//   { "<noteKey>": { createdAt, updatedAt }, ... }
const NOTE_META_KEY = "noteMeta";

// Save a note's text. Empty/whitespace-only text deletes the note instead of
// storing a blank entry, so cleared notes don't linger in storage.
async function saveNote(key, text) {
  if (text.trim() === "") {
    await removeNote(key);
    return;
  }
  const { [NOTE_META_KEY]: meta = {} } = await chrome.storage.local.get(NOTE_META_KEY);
  const now = Date.now();
  const existing = meta[key];
  meta[key] = { createdAt: (existing && existing.createdAt) || now, updatedAt: now };
  await chrome.storage.local.set({ [key]: text, [NOTE_META_KEY]: meta });
}

async function removeNote(key) {
  const { [NOTE_META_KEY]: meta = {} } = await chrome.storage.local.get(NOTE_META_KEY);
  if (meta[key]) {
    delete meta[key];
    await chrome.storage.local.set({ [NOTE_META_KEY]: meta });
  }
  await chrome.storage.local.remove(key);
}
