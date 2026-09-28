import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// 1. Quality logic tests
describe("1. Quality Detection & Ranking Logic", () => {
  function determineQuality(width, height, urlHint) {
    const effectiveHeight = height > 0 ? height : (width > 0 ? Math.round((width * 9) / 16) : 0);
    if (effectiveHeight >= 2160 || width >= 3840) return { label: "2160p", rank: 2160 };
    if (effectiveHeight >= 1440 || width >= 2560) return { label: "1440p", rank: 1440 };
    if (effectiveHeight >= 1080 || width >= 1920) return { label: "1080p", rank: 1080 };
    if (effectiveHeight >= 720 || width >= 1280) return { label: "720p", rank: 720 };
    if (effectiveHeight >= 480 || width >= 850) return { label: "480p", rank: 480 };
    if (effectiveHeight >= 360 || width >= 640) return { label: "360p", rank: 360 };
    if (effectiveHeight >= 240 || width >= 426) return { label: "240p", rank: 240 };
    if (effectiveHeight >= 144) return { label: "144p", rank: 144 };

    if (urlHint) {
      const hintMatch = urlHint.toLowerCase().match(/(2160p|4k|1440p|2k|1080p|720p|480p|360p|240p|144p)/);
      if (hintMatch) {
        const tag = hintMatch[1];
        if (tag === "2160p" || tag === "4k") return { label: "2160p", rank: 2160 };
        if (tag === "1440p" || tag === "2k") return { label: "1440p", rank: 1440 };
        if (tag === "1080p") return { label: "1080p", rank: 1080 };
        if (tag === "720p") return { label: "720p", rank: 720 };
        if (tag === "480p") return { label: "480p", rank: 480 };
        if (tag === "360p") return { label: "360p", rank: 360 };
        if (tag === "240p") return { label: "240p", rank: 240 };
        if (tag === "144p") return { label: "144p", rank: 144 };
      }
    }
    return { label: "Unknown", rank: 0 };
  }

  function sortQualities(sources) {
    const formatRank = { mp4: 10, webm: 8, mov: 6, m4v: 5, ogg: 4, unknown: 1 };
    return [...sources].sort((a, b) => {
      if (b.qualityRank !== a.qualityRank) {
        return b.qualityRank - a.qualityRank;
      }
      const rankA = formatRank[a.format] || 0;
      const rankB = formatRank[b.format] || 0;
      return rankB - rankA;
    });
  }

  test("Identifies 4K 2160p correctly", () => {
    const res = determineQuality(3840, 2160);
    assert.equal(res.label, "2160p");
    assert.equal(res.rank, 2160);
  });

  test("Identifies 1080p correctly", () => {
    const res = determineQuality(1920, 1080);
    assert.equal(res.label, "1080p");
    assert.equal(res.rank, 1080);
  });

  test("Identifies 720p correctly", () => {
    const res = determineQuality(1280, 720);
    assert.equal(res.label, "720p");
    assert.equal(res.rank, 720);
  });

  test("Identifies 480p correctly", () => {
    const res = determineQuality(854, 480);
    assert.equal(res.label, "480p");
    assert.equal(res.rank, 480);
  });

  test("Identifies 360p, 240p, 144p correctly", () => {
    assert.equal(determineQuality(640, 360).label, "360p");
    assert.equal(determineQuality(426, 240).label, "240p");
    assert.equal(determineQuality(256, 144).label, "144p");
  });

  test("Returns Unknown for zero dimensions and no URL hint (strict quality rule)", () => {
    const res = determineQuality(0, 0);
    assert.equal(res.label, "Unknown");
    assert.equal(res.rank, 0);
  });

  test("Extracts quality from reliable URL hint when dimensions are 0", () => {
    const res = determineQuality(0, 0, "https://example.com/video_1080p.mp4");
    assert.equal(res.label, "1080p");
    assert.equal(res.rank, 1080);
  });

  test("Sorts sources with highest quality first, then MP4 before WebM", () => {
    const sources = [
      { qualityRank: 720, format: "webm" },
      { qualityRank: 1080, format: "mp4" },
      { qualityRank: 720, format: "mp4" },
      { qualityRank: 480, format: "mp4" },
      { qualityRank: 2160, format: "mp4" },
    ];
    const sorted = sortQualities(sources);
    assert.equal(sorted[0].qualityRank, 2160);
    assert.equal(sorted[1].qualityRank, 1080);
    assert.equal(sorted[2].qualityRank, 720);
    assert.equal(sorted[2].format, "mp4");
    assert.equal(sorted[3].qualityRank, 720);
    assert.equal(sorted[3].format, "webm");
    assert.equal(sorted[4].qualityRank, 480);
  });
});

// 2. Safe Filename Sanitization tests
describe("2. Safe Filename Sanitization", () => {
  const RESERVED_WINDOWS_NAMES = new Set([
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
  ]);

  function sanitizeFilename(rawTitle, fallbackUrl, format) {
    let baseName = rawTitle ? rawTitle.trim() : "";
    if (!baseName && fallbackUrl) {
      try {
        const parsed = new URL(fallbackUrl);
        const pathname = parsed.pathname;
        const lastSegment = pathname.substring(pathname.lastIndexOf("/") + 1);
        if (lastSegment) {
          baseName = decodeURIComponent(lastSegment.replace(/\.[^/.]+$/, ""));
        }
      } catch {
        baseName = "video";
      }
    }
    if (!baseName) baseName = `video_${Date.now()}`;
    baseName = baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    baseName = baseName.replace(/[\s_]+/g, "_").trim();
    baseName = baseName.replace(/[._ ]+$/, "");

    const upper = baseName.toUpperCase();
    if (RESERVED_WINDOWS_NAMES.has(upper)) {
      baseName = `${baseName}_file`;
    }
    if (baseName.length > 120) {
      baseName = baseName.substring(0, 120).trim().replace(/[._ ]+$/, "");
    }
    const extension = format !== "unknown" ? `.${format}` : ".mp4";
    if (!baseName.toLowerCase().endsWith(extension)) {
      return `${baseName}${extension}`;
    }
    return baseName;
  }

  test("Sanitizes illegal characters in titles", () => {
    const raw = 'How:To / Build * "Cool" <Video> | Stream?';
    const result = sanitizeFilename(raw, "", "mp4");
    assert.equal(result, "How_To_Build_Cool_Video_Stream.mp4");
    assert.ok(!/[<>:"/\\|?*]/.test(result));
  });

  test("Protects against Windows reserved DOS device names", () => {
    assert.equal(sanitizeFilename("CON", "", "mp4"), "CON_file.mp4");
    assert.equal(sanitizeFilename("aux", "", "webm"), "aux_file.webm");
    assert.equal(sanitizeFilename("NUL", "", "mp4"), "NUL_file.mp4");
  });

  test("Strips trailing dots and spaces", () => {
    const result = sanitizeFilename("My Great Video...   ", "", "mp4");
    assert.equal(result, "My_Great_Video.mp4");
  });

  test("Falls back to URL filename when title is empty", () => {
    const result = sanitizeFilename("", "https://example.com/videos/awesome_trailer.mp4", "mp4");
    assert.equal(result, "awesome_trailer.mp4");
  });
});

// 3. Format & Byte Formatter tests
describe("3. Format & Byte Formatter", () => {
  function formatBytes(bytes, decimals = 1) {
    if (bytes === undefined || bytes === null || bytes <= 0) return "Unknown size";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return "";
    const totalSeconds = Math.round(seconds);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  test("Formats byte sizes correctly", () => {
    assert.equal(formatBytes(0), "Unknown size");
    assert.equal(formatBytes(1024), "1 KB");
    assert.equal(formatBytes(10485760), "10 MB");
    assert.equal(formatBytes(1073741824 * 2.5), "2.5 GB");
  });

  test("Formats video duration correctly", () => {
    assert.equal(formatDuration(65), "1:05");
    assert.equal(formatDuration(3665), "1:01:05");
    assert.equal(formatDuration(0), "");
  });
});

// 4. Manifest V3 & Build Distribution Validation
describe("4. Manifest V3 & Distribution Validation", () => {
  const distDir = path.resolve("dist");

  test("dist directory exists", () => {
    assert.ok(fs.existsSync(distDir), "dist/ directory must exist");
  });

  test("manifest.json is valid Manifest V3", () => {
    const manifestPath = path.join(distDir, "manifest.json");
    assert.ok(fs.existsSync(manifestPath), "dist/manifest.json must exist");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    assert.equal(manifest.manifest_version, 3, "Must be Manifest V3");
    assert.equal(manifest.name, "Video Downloader Pro");
    assert.ok(manifest.permissions.includes("downloads"), "Must have downloads permission");
    assert.ok(manifest.permissions.includes("storage"), "Must have storage permission");
    assert.ok(manifest.permissions.includes("activeTab"), "Must have activeTab permission");
    assert.ok(manifest.background.service_worker, "Must have background service_worker");
    assert.ok(manifest.action.default_popup, "Must have action default_popup");
  });

  test("PNG icons of all required dimensions exist in dist/icons/", () => {
    const iconSizes = [16, 32, 48, 128];
    for (const size of iconSizes) {
      const iconPath = path.join(distDir, "icons", `icon-${size}.png`);
      assert.ok(fs.existsSync(iconPath), `dist/icons/icon-${size}.png must exist`);
      const stat = fs.statSync(iconPath);
      assert.ok(stat.size > 0, `icon-${size}.png must not be empty`);
    }
  });

  test("content.js is a self-contained IIFE with 0 external import statements", () => {
    const contentPath = path.join(distDir, "content.js");
    assert.ok(fs.existsSync(contentPath), "dist/content.js must exist");
    const content = fs.readFileSync(contentPath, "utf8");
    // Verify no top-level import statements
    assert.ok(!/^import\s+/m.test(content), "content.js must not contain top-level import statements");
    assert.ok(content.startsWith("(function()"), "content.js must be an IIFE wrapper");
  });

  test("background.js is a self-contained IIFE with 0 external import statements", () => {
    const bgPath = path.join(distDir, "background.js");
    assert.ok(fs.existsSync(bgPath), "dist/background.js must exist");
    const bg = fs.readFileSync(bgPath, "utf8");
    assert.ok(!/^import\s+/m.test(bg), "background.js must not contain top-level import statements");
    assert.ok(bg.startsWith("(function()"), "background.js must be an IIFE wrapper");
  });

  test("popup.html, options.html, and test.html exist in dist/", () => {
    assert.ok(fs.existsSync(path.join(distDir, "popup.html")), "dist/popup.html must exist");
    assert.ok(fs.existsSync(path.join(distDir, "options.html")), "dist/options.html must exist");
    assert.ok(fs.existsSync(path.join(distDir, "test.html")), "dist/test.html must exist");
  });
});
