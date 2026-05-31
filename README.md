# PageNoter

A small Chrome extension for jotting personal notes tied to the web pages you visit.
Open the popup on any page, write a note, and it saves automatically — then it's waiting
for you next time you're there. Everything is stored locally in your browser.

## Features

- Notes attached to a specific page or to a whole website.
- Auto-save as you type.
- A settings panel with several color themes.

## Install (developer mode)

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `PageNoter` folder.
4. Pin the extension and click its icon on any page to start taking notes.

## Project layout

- `manifest.json` — extension manifest (Manifest V3).
- `popup.html` / `popup.css` / `popup.js` — the popup UI and logic.
- `icons/` — toolbar icons (rasterized from `icons/sticky_note_2.svg`, a Material symbol).

## Roadmap

- A page to browse and search all saved notes.
- Export / import and optional sync.
- Richer note editing.
