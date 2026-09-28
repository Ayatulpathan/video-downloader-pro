# 🎬 Video Downloader Pro (Manifest V3)

A high-performance, secure, and production-ready **Chrome Extension (Manifest V3)** built with **React**, **TypeScript**, and **Vite** that detects legitimate, non-DRM video resources on any webpage and allows users to download them in the highest available quality with a single click.

---

## ✨ Features

- 🎯 **Intelligent HTML5 Media Detection**: Automatically detects `<video>` tags, `<source>` elements, dynamic media sources, and direct downloadable video links (`.mp4`, `.webm`, `.ogg`, `.mov`, `.m4v`).
- ⚡ **MutationObserver Automation**: Detects dynamically loaded, lazily rendered, or user-initiated videos in real-time without requiring a page refresh.
- 🏆 **Strict Quality Sorting**: True resolution ranking (2160p 4K > 1440p 2K > 1080p FHD > 720p HD > 480p SD > 360p > 240p > 144p > Unknown). Never falsely labels or upscales lower quality video.
- 🚀 **1-Click "Download Highest Quality"**: Immediate download of the top-ranked stream, with manual override to choose alternative resolutions or formats.
- 📊 **Real-time Download Manager**: Live progress bar, downloaded size/total size calculation, cancel active downloads, and "Show in folder" upon completion.
- 🛡️ **Safe & Legal DRM Handling**: Strictly respects protected media and Digital Rights Management (DRM / EME). Clearly explains when a stream is protected rather than failing cryptically.
- 💾 **Safe Filename Sanitization**: Windows and cross-platform safe filename generation, preventing invalid characters (`< > : " / \ | ? *`), reserved device names (`CON`, `PRN`, `AUX`), and MAX_PATH truncation.
- ⚙️ **Customizable Settings**: Quality preference, "Ask where to save", auto-detect toggle, and dark/light/system theme options.
- 🔒 **Privacy First**: 100% local processing. No user data, cookies, or video files are ever collected or sent to external servers.

---

## 🏗️ Architecture

```
Current Webpage
      │
      ▼
Content Script (src/content/content.ts + MutationObserver)
      │
      ▼
Media Detector (src/services/mediaDetector.ts)
      │
      ▼
Background Service Worker (src/background/service-worker.ts)
      │
      ▼
Popup UI (React 18 + TypeScript) & Chrome Downloads API
```

---

## 📂 Project Structure

```
video-downloader-pro/
├── public/
│   ├── manifest.json              # Manifest V3 configuration
│   ├── icons/                     # Generated PNG icons (16, 32, 48, 128)
│   └── test.html                  # Built-in test suite webpage
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Service worker: download manager & message handler
│   ├── content/
│   │   └── content.ts             # Content script: DOM inspection & MutationObserver
│   ├── components/
│   │   ├── Header.tsx             # Title, rescan button, settings link, badge counter
│   │   ├── VideoCard.tsx          # Card displaying metadata, format, quality, download
│   │   ├── QualitySelector.tsx    # Dropdown for selecting available resolutions/formats
│   │   ├── DownloadButton.tsx     # Highest quality / selected quality download triggers
│   │   ├── DownloadProgress.tsx   # Progress bar, size metrics, cancel & show in folder
│   │   ├── EmptyState.tsx         # Empty state UI with "Scan Again" button
│   │   └── ErrorState.tsx         # Error notifications
│   ├── pages/
│   │   ├── Popup.tsx              # Extension popup UI (400px modern interface)
│   │   └── Options.tsx            # Settings & preferences page
│   ├── services/
│   │   ├── chromeApi.ts           # Wrapper for Chrome Tabs & Messaging APIs
│   │   ├── mediaDetector.ts       # HTML5 video/source parser & deduplicator
│   │   └── downloadManager.ts     # Download coordinator & task tracker
│   ├── utils/
│   │   ├── quality.ts             # Quality ranking & resolution matching
│   │   ├── filename.ts            # Windows-safe filename generator
│   │   ├── format.ts              # Byte formatting & format detection
│   │   └── storage.ts             # chrome.storage.local type-safe wrapper
│   ├── types/
│   │   └── index.ts               # Shared TypeScript models
│   ├── styles/
│   │   └── index.css              # Custom styling with dark & light mode
│   ├── popup.html                 # Popup HTML entry
│   ├── options.html               # Options HTML entry
│   ├── popup.tsx                  # Popup React root
│   └── options.tsx                # Options React root
├── scripts/
│   ├── build.js                   # Extension bundler (produces zero-chunk content/SW)
│   └── generate-icons.js          # Standalone PNG icon generator
├── dist/                          # Ready-to-load unpacked Chrome Extension
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler options
├── README.md                      # Documentation
├── CHROMEWEBSTORE.md              # Chrome Web Store submission metadata
└── TESTING.md                     # 14-point testing checklist
```

---

## 🛠️ Build & Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- Google Chrome (or Chromium-based browser)

### 1. Build from Source
```bash
# Install dependencies
npm install

# Build the extension into the dist/ directory
npm run build
```

### 2. Load Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory inside this repository (`C:\Users\User\.gemini\antigravity\scratch\video-downloader-pro\dist`).
5. The extension **Video Downloader Pro** is now installed and active!

---

## 🧪 Testing the Extension

We have included a comprehensive test suite in `public/test.html`.

To test:
1. Open `dist/test.html` in Chrome (or navigate to `chrome-extension://<EXTENSION_ID>/test.html`).
2. Click on the extension icon in the toolbar.
3. Observe detected video streams, multi-resolution selections, dynamic video insertion via the button, and DRM safety notifications.
4. For detailed step-by-step test verification, see [`TESTING.md`](./TESTING.md).

---

## 📜 License

MIT License. Designed with Manifest V3 security and privacy best practices.
