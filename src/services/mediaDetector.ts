import { DetectedVideoItem, DetectedMediaSource, VideoFormat } from "../types";
import { determineQuality, sortQualities } from "../utils/quality";
import { detectFormatFromMimeOrUrl } from "../utils/format";

export function isDirectDownloadableUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr, window.location.href);
    const protocol = url.protocol.toLowerCase();
    // Chrome downloads API works with http, https, data, blob
    return protocol === "http:" || protocol === "https:" || protocol === "data:";
  } catch {
    return false;
  }
}

export function detectDrmOrProtected(element: HTMLVideoElement, urlStr?: string): { isProtected: boolean; reason?: string } {
  // Check HTML5 MediaKeys API presence on the element
  if ((element as any).mediaKeys) {
    return {
      isProtected: true,
      reason: "This stream is protected by Digital Rights Management (DRM / Encrypted Media Extensions) and cannot be downloaded.",
    };
  }

  // Check URL patterns for DRM licensing endpoints or manifests
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
      // Note: Blob/MediaSource streams that are chunked buffer streams are not direct standalone files
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
    // Check if source element has res or size attributes
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
          width: 0,
          height: 0,
        },
        isProtected: true,
        protectedReason: drmCheck.reason,
        thumbnailUrl: poster,
        durationSeconds: duration,
        timestamp: Date.now(),
      });
      return;
    }

    if (sources.length > 0) {
      // Check if primary source already captured to prevent duplicate video cards
      const primaryUrl = sources[0].url;
      if (!processedUrls.has(primaryUrl)) {
        processedUrls.add(primaryUrl);
        items.push({
          id: `video_${index}_${Math.random().toString(36).substring(2, 9)}`,
          title: videoTitle,
          pageUrl,
          pageTitle,
          sources,
          bestSource: sources[0], // Already sorted by quality rank
          thumbnailUrl: poster,
          durationSeconds: duration,
          timestamp: Date.now(),
        });
      }
    }
  });

  // 2. Scan direct video links (<a> tags linking directly to .mp4, .webm, etc.)
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
