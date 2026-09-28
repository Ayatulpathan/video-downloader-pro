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

function scheduleScan(delay = 500) {
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

// Also scan on window load and when video events fire
window.addEventListener("load", () => scheduleScan(400));
document.addEventListener("play", () => scheduleScan(100), true);
document.addEventListener("loadedmetadata", () => scheduleScan(100), true);

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
    scheduleScan(600);
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
    return false; // synchronous response
  }
  return false;
});
