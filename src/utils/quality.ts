import { VideoQualityLabel } from "../types";

export interface QualityInfo {
  label: VideoQualityLabel;
  rank: number;
}

export function determineQuality(width: number, height: number, urlHint?: string): QualityInfo {
  const effectiveHeight = height > 0 ? height : (width > 0 ? Math.round((width * 9) / 16) : 0);

  if (effectiveHeight >= 2160 || width >= 3840) {
    return { label: "2160p", rank: 2160 };
  }
  if (effectiveHeight >= 1440 || width >= 2560) {
    return { label: "1440p", rank: 1440 };
  }
  if (effectiveHeight >= 1080 || width >= 1920) {
    return { label: "1080p", rank: 1080 };
  }
  if (effectiveHeight >= 720 || width >= 1280) {
    return { label: "720p", rank: 720 };
  }
  if (effectiveHeight >= 480 || width >= 850) {
    return { label: "480p", rank: 480 };
  }
  if (effectiveHeight >= 360 || width >= 640) {
    return { label: "360p", rank: 360 };
  }
  if (effectiveHeight >= 240 || width >= 426) {
    return { label: "240p", rank: 240 };
  }
  if (effectiveHeight >= 144) {
    return { label: "144p", rank: 144 };
  }

  // Check URL hints only if reliable keyword patterns exist (e.g. /1080p/, _720p, etc.)
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

export function sortQualities<T extends { qualityRank: number; format: string }>(sources: T[]): T[] {
  const formatRank: Record<string, number> = {
    mp4: 10,
    webm: 8,
    mov: 6,
    m4v: 5,
    ogg: 4,
    unknown: 1,
  };

  return [...sources].sort((a, b) => {
    if (b.qualityRank !== a.qualityRank) {
      return b.qualityRank - a.qualityRank;
    }
    const rankA = formatRank[a.format] || 0;
    const rankB = formatRank[b.format] || 0;
    return rankB - rankA;
  });
}
