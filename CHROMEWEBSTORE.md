# Chrome Web Store Listing — Video Downloader Pro

## Listing Metadata

- **Extension Name**: Video Downloader Pro
- **Short Name**: VideoDownloader
- **Version**: 1.0.0
- **Category**: Productivity / Media
- **Primary Language**: English
- **Website**: https://github.com/Ayatulpathan/video-downloader-pro

---

## Store Descriptions

### Summary (132 characters max)
Detect and download legitimate HTML5 videos in the highest available quality with a single click.

### Detailed Description
Video Downloader Pro is a fast, lightweight, and modern browser extension that helps you detect and save legitimate video media from the web in the best available quality.

Key Features:
- 🎬 Instant Media Detection: Automatically detects HTML5 video elements, media sources, and direct download links.
- ⚡ Real-Time Dynamic Updates: Detects newly added or loaded videos without page reloads.
- 🏆 Accurate Quality Detection: Identifies video resolutions (2160p 4K, 1440p, 1080p, 720p, 480p, and more).
- ⬇ 1-Click Download: Save the highest quality version instantly with one click.
- 📊 Live Progress Tracker: Track active download speeds, progress percentages, and downloaded sizes.
- 📁 Direct Folder Access: Open downloaded files directly in your downloads directory.
- 🛡️ Safe & Private: Operates completely locally on your computer with zero telemetry or data tracking.

Please Note:
Video Downloader Pro strictly complies with web standards and copyright regulations. It does not bypass DRM, paywalls, or stream encryption. Encrypted and DRM-protected streams are safely identified and cannot be downloaded.

---

## Permissions Justifications

### `downloads`
- **Plain-English Justification**: Required to initiate video downloads requested by the user, display live download progress in the popup, allow cancelling in-flight downloads, and reveal completed files in the downloads folder.

### `storage`
- **Plain-English Justification**: Required to save user preferences (default preferred quality, save-as file prompt, auto-detect preference, and theme) and maintain active download task progress between popup sessions.

### `activeTab`
- **Plain-English Justification**: Required to inspect the current active webpage for HTML5 video elements and display available video streams when the user opens the extension popup.

### `scripting`
- **Plain-English Justification**: Required to inject the media detection script into active tabs when rescanning pages or after extension reload.

---

## Privacy & Data Use Disclosure

- **Data Collection**: No personal data, browsing history, user credentials, cookies, or video files are collected, tracked, or sent to external servers.
- **Remote Code**: Does not use remote code or `eval()`.
- **Monetization**: Completely free, open-source, and contains no ads or affiliate trackers.
