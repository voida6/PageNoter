// Shared color themes, used by both the popup and the all-notes page.
// Each theme maps to the CSS variables defined in the page stylesheets.
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

// Apply a theme's colors to the document's CSS variables.
function applyThemeVars(name) {
  const theme = THEMES[name] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme)) {
    if (prop === "label") continue;
    root.style.setProperty("--" + prop, value);
  }
}
