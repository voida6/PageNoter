// Shared note storage helpers used by the popup, sticky widget, and all-notes page.

// Save a note's text. Empty/whitespace-only text deletes the note instead of
// storing a blank entry, so cleared notes don't linger in storage.
async function saveNote(key, text) {
  if (text.trim() === "") {
    await removeNote(key);
    return;
  }
  await chrome.storage.local.set({ [key]: text });
}

async function removeNote(key) {
  await chrome.storage.local.remove(key);
}
