// Moves a newly created tab immediately to the right of the tab that opened it
// (or, if opener isn't available, to the right of the currently active tab).

async function moveTabToRight(newTab) {
  // Ignore non-standard tabs (sometimes Chrome/Brave creates special internal pages).
  if (!newTab || typeof newTab.id !== "number") return;

  try {
    // Prefer the opener tab (most accurate for Ctrl+T, middle-click, "open in new tab", etc.)
    if (typeof newTab.openerTabId === "number") {
      const opener = await chrome.tabs.get(newTab.openerTabId);

      // Only reposition if it’s in the same window as its opener.
      if (opener.windowId === newTab.windowId) {
        const targetIndex = opener.index + 1;

        // If already at/near correct spot, do nothing.
        if (newTab.index !== targetIndex) {
          await chrome.tabs.move(newTab.id, { index: targetIndex });
        }
        return;
      }
    }

    // Fallback: move relative to the currently active tab in that window.
    const [active] = await chrome.tabs.query({ windowId: newTab.windowId, active: true });
    if (!active) return;

    const targetIndex = active.index + 1;
    if (newTab.index !== targetIndex) {
      await chrome.tabs.move(newTab.id, { index: targetIndex });
    }
  } catch (e) {
    // Best-effort: tab might already be gone, opener might be unavailable, etc.
    // No action needed.
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  // Service worker event listeners can be async; call an async handler.
  moveTabToRight(tab);
});

