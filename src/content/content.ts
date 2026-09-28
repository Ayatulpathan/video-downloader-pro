import { scanPageForMedia } from "../services/mediaDetector";

let scanTimeout: number | null = null;

function performScanAndNotify() {
  try {
    const detected = scanPageForMedia();
    // Send to background service worker
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: "MEDIA_DETECTED",
        videos: detected,
      }).catch(() => {
        // Background might be waking up or closed
      });
    }
  } catch (err) {
    console.error("[Video Downloader Pro] Error scanning page:", err);
  }
}

function scheduleScan(delay = 400) {
  if (scanTimeout !== null) {
    window.clearTimeout(scanTimeout);
  }
  scanTimeout = window.setTimeout(() => {
    scanTimeout = null;
    performScanAndNotify();
  }, delay);
}

// 1. Initial scan on DOM ready / loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => scheduleScan(300));
} else {
  scheduleScan(200);
}

// Also scan on window load, SPA navigation, and when video events fire
window.addEventListener("load", () => scheduleScan(400));
document.addEventListener("play", () => scheduleScan(100), true);
document.addEventListener("playing", () => scheduleScan(100), true);
document.addEventListener("loadedmetadata", () => scheduleScan(100), true);
document.addEventListener("loadeddata", () => scheduleScan(100), true);
document.addEventListener("canplay", () => scheduleScan(100), true);

// SPA navigation events (YouTube, Twitter, Facebook, etc.)
window.addEventListener("popstate", () => scheduleScan(500));
window.addEventListener("yt-navigate-finish", () => scheduleScan(500));

// 2. MutationObserver for dynamically added videos
const observer = new MutationObserver((mutations) => {
  let shouldRescan = false;
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === "VIDEO" || el.tagName === "SOURCE" || el.querySelector?.("video, source")) {
            shouldRescan = true;
          }
        }
      });
    } else if (mutation.type === "attributes") {
      const target = mutation.target as HTMLElement;
      if (target.tagName === "VIDEO" || target.tagName === "SOURCE") {
        if (["src", "currentSrc", "width", "height"].includes(mutation.attributeName || "")) {
          shouldRescan = true;
        }
      }
    }
  }

  if (shouldRescan) {
    scheduleScan(400);
  }
});

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src", "currentSrc", "width", "height", "data-src"],
});

// 3. Message Listener for popup or background requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "REQUEST_SCAN") {
    const detected = scanPageForMedia();
    sendResponse({ videos: detected });
    return false;
  }
  return false;
});
