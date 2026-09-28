import { DetectedVideoItem, DetectedMediaSource, VideoFormat } from "../types";
import { determineQuality, sortQualities } from "../utils/quality";
import { detectFormatFromMimeOrUrl } from "../utils/format";

export function isDirectDownloadableUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr, window.location.href);
    const protocol = url.protocol.toLowerCase();
    return protocol === "http:" || protocol === "https:" || protocol === "data:";
  } catch {
    return false;
  }
}

export function detectDrmOrProtected(element: HTMLVideoElement, urlStr?: string): { isProtected: boolean; reason?: string } {
  const host = window.location.hostname.toLowerCase();

  // 1. YouTube specific restriction & policy check
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return {
      isProtected: true,
      reason: "YouTube video stream detected. YouTube uses chunked MediaSource streams (Blob/MSE), and Chrome Web Store policy strictly restricts downloading from YouTube.",
    };
  }

  // 2. Check HTML5 MediaKeys API presence (Encrypted Media Extensions)
  if ((element as any).mediaKeys) {
    return {
      isProtected: true,
      reason: "This stream is protected by Digital Rights Management (DRM / Encrypted Media Extensions) and cannot be downloaded.",
    };
  }

  // 3. Check URL patterns for DRM licensing endpoints
  if (urlStr) {
    const lower = urlStr.toLowerCase();
    if (lower.includes("widevine") || lower.includes("playready") || lower.includes("fairplay") || lower.includes("clearkey")) {
      return {
        isProtected: true,
        reason: "DRM-protected licensing stream detected.",
      };
    }
  }

  return { isProtected: false };
}

export function extractMediaSourcesFromVideo(videoEl: HTMLVideoElement): DetectedMediaSource[] {
  const sources: DetectedMediaSource[] = [];
  const seenUrls = new Set<string>();

  const addSource = (rawUrl: string, mimeType?: string, sourceWidth?: number, sourceHeight?: number) => {
    if (!rawUrl || rawUrl.startsWith("blob:") || rawUrl.startsWith("mediasource:")) {
      return;
    }

    try {
      const canonicalUrl = new URL(rawUrl, window.location.href).href;
      if (seenUrls.has(canonicalUrl)) return;
      seenUrls.add(canonicalUrl);

      const format: VideoFormat = detectFormatFromMimeOrUrl(mimeType, canonicalUrl);
      const width = sourceWidth || videoEl.videoWidth || parseInt(videoEl.getAttribute("width") || "0", 10) || 0;
      const height = sourceHeight || videoEl.videoHeight || parseInt(videoEl.getAttribute("height") || "0", 10) || 0;

      const qualityInfo = determineQuality(width, height, canonicalUrl);

      sources.push({
        url: canonicalUrl,
        format,
        quality: qualityInfo.label,
        qualityRank: qualityInfo.rank,
        width,
        height,
        mimeType: mimeType || undefined,
      });
    } catch {
      // Invalid URL
    }
  };

  // 1. Check currentSrc
  if (videoEl.currentSrc) {
    addSource(videoEl.currentSrc, undefined);
  }

  // 2. Check src attribute
  const srcAttr = videoEl.getAttribute("src") || videoEl.src;
  if (srcAttr && srcAttr !== videoEl.currentSrc) {
    addSource(srcAttr, undefined);
  }

  // 3. Check child <source> elements
  const childSources = videoEl.querySelectorAll("source");
  childSources.forEach((sourceEl) => {
    const src = sourceEl.getAttribute("src") || sourceEl.src;
    const type = sourceEl.getAttribute("type") || "";
    const resAttr = sourceEl.getAttribute("data-quality") || sourceEl.getAttribute("size") || "";
    let sWidth = 0;
    let sHeight = 0;
    if (resAttr) {
      const match = resAttr.match(/(\d+)/);
      if (match) sHeight = parseInt(match[1], 10);
    }

    if (src) {
      addSource(src, type, sWidth, sHeight);
    }
  });

  // 4. Check data attributes on video (e.g., data-src, data-video-url)
  const dataSrc = videoEl.getAttribute("data-src") || videoEl.getAttribute("data-video-url");
  if (dataSrc) {
    addSource(dataSrc, undefined);
  }

  return sortQualities(sources);
}

// 5. Extract video links from metadata (OpenGraph, Twitter cards, JSON-LD)
export function extractVideosFromPageMetadata(): DetectedMediaSource[] {
  const sources: DetectedMediaSource[] = [];
  const seenUrls = new Set<string>();

  const addUrl = (urlStr: string | null | undefined, mimeType?: string) => {
    if (!urlStr || !isDirectDownloadableUrl(urlStr)) return;
    try {
      const canonical = new URL(urlStr, window.location.href).href;
      if (seenUrls.has(canonical)) return;
      seenUrls.add(canonical);

      const format = detectFormatFromMimeOrUrl(mimeType, canonical);
      const qualityInfo = determineQuality(0, 0, canonical);
      sources.push({
        url: canonical,
        format,
        quality: qualityInfo.label,
        qualityRank: qualityInfo.rank,
        width: 0,
        height: 0,
        mimeType,
      });
    } catch {
      // Ignore
    }
  };

  // OpenGraph meta tags
  const ogVideo = document.querySelector('meta[property="og:video"]')?.getAttribute("content");
  const ogVideoUrl = document.querySelector('meta[property="og:video:url"]')?.getAttribute("content");
  const ogVideoSecure = document.querySelector('meta[property="og:video:secure_url"]')?.getAttribute("content");
  const ogType = document.querySelector('meta[property="og:video:type"]')?.getAttribute("content") || undefined;

  addUrl(ogVideo, ogType);
  addUrl(ogVideoUrl, ogType);
  addUrl(ogVideoSecure, ogType);

  // Twitter cards
  const twitterStream = document.querySelector('meta[name="twitter:player:stream"]')?.getAttribute("content");
  addUrl(twitterStream);

  // Schema.org JSON-LD
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || "{}");
      const scanObject = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (obj["@type"] === "VideoObject" || obj.contentUrl || obj.embedUrl) {
          if (obj.contentUrl) addUrl(obj.contentUrl);
        }
        Object.values(obj).forEach(scanObject);
      };
      scanObject(data);
    } catch {
      // Ignore malformed JSON
    }
  });

  return sources;
}

// 6. Sniff video network requests from Performance Resource Timing API
export function extractVideosFromPerformance(): DetectedMediaSource[] {
  const sources: DetectedMediaSource[] = [];
  if (typeof window === "undefined" || !window.performance?.getEntriesByType) return sources;

  const entries = window.performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const videoRegex = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

  entries.forEach((entry) => {
    const name = entry.name;
    if (name && videoRegex.test(name) && isDirectDownloadableUrl(name)) {
      try {
        const canonical = new URL(name, window.location.href).href;
        const format = detectFormatFromMimeOrUrl(undefined, canonical);
        const qualityInfo = determineQuality(0, 0, canonical);
        sources.push({
          url: canonical,
          format,
          quality: qualityInfo.label,
          qualityRank: qualityInfo.rank,
          width: 0,
          height: 0,
          sizeBytes: entry.decodedBodySize > 0 ? entry.decodedBodySize : undefined,
        });
      } catch {
        // Ignore
      }
    }
  });

  return sources;
}

export function scanPageForMedia(): DetectedVideoItem[] {
  const items: DetectedVideoItem[] = [];
  const processedUrls = new Set<string>();

  const pageTitle = document.title || "Video";
  const pageUrl = window.location.href;

  // 1. Scan all HTML5 <video> elements
  const videoElements = document.querySelectorAll("video");
  videoElements.forEach((videoEl, index) => {
    const drmCheck = detectDrmOrProtected(videoEl, videoEl.currentSrc || videoEl.src);
    const sources = extractMediaSourcesFromVideo(videoEl);

    // Get meaningful title from element attributes, aria-labels, or page title
    let videoTitle =
      videoEl.getAttribute("title") ||
      videoEl.getAttribute("aria-label") ||
      videoEl.getAttribute("data-title") ||
      "";

    if (!videoTitle && videoElements.length === 1) {
      videoTitle = pageTitle;
    } else if (!videoTitle) {
      videoTitle = `${pageTitle} - Video ${index + 1}`;
    }

    const duration = isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : undefined;
    const poster = videoEl.poster || undefined;

    // Check if DRM or protected streaming platform (like YouTube)
    if (drmCheck.isProtected) {
      items.push({
        id: `protected_video_${index}_${Date.now()}`,
        title: videoTitle,
        pageUrl,
        pageTitle,
        sources: [],
        bestSource: {
          url: "",
          format: "unknown",
          quality: "Unknown",
          qualityRank: 0,
          width: videoEl.videoWidth || 0,
          height: videoEl.videoHeight || 0,
        },
        isProtected: true,
        protectedReason: drmCheck.reason,
        thumbnailUrl: poster,
        durationSeconds: duration,
        timestamp: Date.now(),
      });
      return;
    }

    // Direct sources found on HTML5 video element
    if (sources.length > 0) {
      const primaryUrl = sources[0].url;
      if (!processedUrls.has(primaryUrl)) {
        processedUrls.add(primaryUrl);
        items.push({
          id: `video_${index}_${Math.random().toString(36).substring(2, 9)}`,
          title: videoTitle,
          pageUrl,
          pageTitle,
          sources,
          bestSource: sources[0],
          thumbnailUrl: poster,
          durationSeconds: duration,
          timestamp: Date.now(),
        });
      }
    } else if (videoEl.currentSrc?.startsWith("blob:") || videoEl.src?.startsWith("blob:")) {
      // Blob/MSE video on custom site
      items.push({
        id: `blob_video_${index}_${Date.now()}`,
        title: videoTitle,
        pageUrl,
        pageTitle,
        sources: [],
        bestSource: {
          url: "",
          format: "unknown",
          quality: videoEl.videoHeight ? `${videoEl.videoHeight}p` as any : "Unknown",
          qualityRank: 0,
          width: videoEl.videoWidth || 0,
          height: videoEl.videoHeight || 0,
        },
        isProtected: true,
        protectedReason: "MediaSource (Blob) stream detected. This video is dynamically buffered in chunks and cannot be downloaded directly.",
        thumbnailUrl: poster,
        durationSeconds: duration,
        timestamp: Date.now(),
      });
    }
  });

  // 2. Scan metadata video sources (OpenGraph / JSON-LD)
  const metaSources = extractVideosFromPageMetadata();
  metaSources.forEach((src, idx) => {
    if (!processedUrls.has(src.url)) {
      processedUrls.add(src.url);
      items.push({
        id: `meta_video_${idx}_${Date.now()}`,
        title: `${pageTitle} (Embedded Stream)`,
        pageUrl,
        pageTitle,
        sources: [src],
        bestSource: src,
        timestamp: Date.now(),
      });
    }
  });

  // 3. Scan Network Performance entries for loaded videos
  const perfSources = extractVideosFromPerformance();
  perfSources.forEach((src, idx) => {
    if (!processedUrls.has(src.url)) {
      processedUrls.add(src.url);
      items.push({
        id: `perf_video_${idx}_${Date.now()}`,
        title: `${pageTitle} - Stream ${idx + 1}`,
        pageUrl,
        pageTitle,
        sources: [src],
        bestSource: src,
        timestamp: Date.now(),
      });
    }
  });

  // 4. Scan direct video links (<a> tags linking directly to .mp4, .webm, etc.)
  const directLinks = document.querySelectorAll<HTMLAnchorElement>("a[href]");
  const videoExtRegex = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

  directLinks.forEach((anchor, index) => {
    const href = anchor.href;
    if (href && videoExtRegex.test(href) && isDirectDownloadableUrl(href)) {
      if (!processedUrls.has(href)) {
        processedUrls.add(href);
        const format = detectFormatFromMimeOrUrl(undefined, href);
        const qualityInfo = determineQuality(0, 0, href);

        const source: DetectedMediaSource = {
          url: href,
          format,
          quality: qualityInfo.label,
          qualityRank: qualityInfo.rank,
          width: 0,
          height: 0,
        };

        const linkTitle = anchor.textContent?.trim() || anchor.getAttribute("title") || `Media Link ${index + 1}`;

        items.push({
          id: `link_${index}_${Math.random().toString(36).substring(2, 9)}`,
          title: linkTitle,
          pageUrl,
          pageTitle,
          sources: [source],
          bestSource: source,
          timestamp: Date.now(),
        });
      }
    }
  });

  return items;
}
