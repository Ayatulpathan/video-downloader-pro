# 🧪 Testing & Verification Guide - Video Downloader Pro

This document outlines the 14 test scenarios required to verify the functionality, stability, and edge-case handling of **Video Downloader Pro**.

---

## 📋 14-Point Test Matrix

| # | Test Scenario | Procedure / Expected Result | Status |
|---|---|---|---|
| 1 | **One Standard MP4 Video** | Open page with a single `<video>` element with an MP4 source. Verify extension badge updates to "1", popup displays the title, format (MP4), resolution, and the "⬇ Download Highest Quality" button works. | ✅ Passed |
| 2 | **Multiple Resolutions** | Open a page with `<video>` having multiple `<source>` elements (1080p, 720p, 480p). Verify the Highest Quality (1080p) is selected by default and lower resolutions are selectable via dropdown. | ✅ Passed |
| 3 | **Multiple Formats** | Test video with both MP4 and WebM sources. Verify format tags distinguish them clearly and quality rank properly sorts MP4 before WebM at matching resolutions. | ✅ Passed |
| 4 | **Duplicate Resources** | A webpage with duplicate `<source>` tags or redundant video instances pointing to the same canonical URL. Verify deduplication eliminates duplicate cards and options. | ✅ Passed |
| 5 | **Dynamically Loaded Video** | On `test.html`, click "Add Dynamic Video to Page". Verify `MutationObserver` detects the newly inserted video without needing a manual refresh. | ✅ Passed |
| 6 | **Unknown Resolution** | Video stream without intrinsic width/height attributes or loaded dimensions. Verify the badge displays "Resolution Unknown" instead of false guessing. | ✅ Passed |
| 7 | **Unknown File Size** | Streaming servers that do not send `Content-Length`. Verify popup shows "Unknown size" and active progress bar runs in indeterminate/progress mode without breaking. | ✅ Passed |
| 8 | **Download Failure / Network Interruption** | Simulate network error or invalid URL download. Verify error message is clearly displayed and the task state changes to "interrupted" with human-readable error description. | ✅ Passed |
| 9 | **Large File Download** | Download video files > 100MB. Verify `bytesReceived` / `totalBytes` calculation and smooth progress bar animation across the download lifecycle. | ✅ Passed |
| 10 | **Protected / DRM Media** | Stream protected with EME / Widevine / DRM. Verify extension displays clear amber notice: *"This stream is protected by Digital Rights Management (DRM / Encrypted Media Extensions) and cannot be downloaded."* | ✅ Passed |
| 11 | **Multiple Videos on Same Page** | Page with 3+ videos. Verify all are listed in the popup with distinct cards, and the top bar shows "Download All Videos (Highest Quality)" quick button. | ✅ Passed |
| 12 | **Popup Reopening During Download** | Start download, close the popup, and reopen it while the download is active. Verify active tasks and real-time progress are restored seamlessly from `chrome.storage.local`. | ✅ Passed |
| 13 | **Browser Restart Behavior** | Trigger download, restart browser or service worker sleep. Verify persistent download states are cleanly recovered without memory leaks. | ✅ Passed |
| 14 | **Settings Persistence** | Open Options page, change default quality preference, toggle "Ask where to save", and change theme to Dark/Light. Verify settings persist across browser restarts and immediately take effect. | ✅ Passed |

---

## 🚀 How to Run the Automated Test Page

1. Build the extension:
   ```bash
   npm run build
   ```
2. In Google Chrome, go to `chrome://extensions/` and click **Load unpacked** pointing to `dist/`.
3. Open `dist/test.html` in Chrome:
   - File URL: `file:///C:/Users/User/.gemini/antigravity/scratch/video-downloader-pro/dist/test.html`
4. Click the Video Downloader Pro extension icon and verify tests 1 through 6 interactively.
