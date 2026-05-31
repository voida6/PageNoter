// Shows a badge on the toolbar icon when the current tab has a page or site note.

const PAGE_PREFIX = "note:page:";
const SITE_PREFIX = "note:site:";

function keysForUrl(url) {
  try {
    const u = new URL(url);
    return [PAGE_PREFIX + u.origin + u.pathname + u.search, SITE_PREFIX + u.hostname];
  } catch {
    return null;
  }
}

async function updateBadge(tab) {
  if (!tab || tab.id == null) return;
  const keys = tab.url ? keysForUrl(tab.url) : null;
  let hasNote = false;
  if (keys) {
    const stored = await chrome.storage.local.get(keys);
    hasNote = keys.some((k) => typeof stored[k] === "string" && stored[k].trim() !== "");
  }
  chrome.action.setBadgeText({ tabId: tab.id, text: hasNote ? "●" : "" });
}

chrome.action.setBadgeBackgroundColor({ color: "#4285f4" });

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    updateBadge(await chrome.tabs.get(tabId));
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") updateBadge(tab);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;
  const noteChanged = Object.keys(changes).some(
    (k) => k.startsWith(PAGE_PREFIX) || k.startsWith(SITE_PREFIX)
  );
  if (!noteChanged) return;
  const tabs = await chrome.tabs.query({});
  tabs.forEach((t) => updateBadge(t));
});

async function refreshActiveTabs() {
  const tabs = await chrome.tabs.query({ active: true });
  tabs.forEach((t) => updateBadge(t));
}

chrome.runtime.onStartup.addListener(refreshActiveTabs);
chrome.runtime.onInstalled.addListener(refreshActiveTabs);
