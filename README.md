# PageNoter

A small Chrome extension that lets you save personal notes attached to specific web pages. Each page URL keeps its own note, stored locally in your browser.

## Features (v0.1)

- Click the toolbar icon to open a note pad for the current page.
- Notes auto-save as you type (per URL).
- "Clear" button to wipe the current page's note.
- Color themes: Blue, Dark Purple, Cyan, Pastel Pink, Pastel Mint (pick a swatch; saved globally).

## Install (developer mode)

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `PageNoter` folder.
4. Pin the extension and click its icon on any page to start taking notes.

## Icon

The toolbar icon is Google's Material Symbols `sticky_note_2`, recolored to the app blue
(`#4285f4`). The source vector is `icons/sticky_note_2.svg`; the PNGs in `icons/` are
rasterized from it at 16/32/48/128 px.

## Roadmap ideas

- A side panel or in-page widget instead of just the popup.
- List/search all saved notes across pages.
- Export / import and cloud sync.
