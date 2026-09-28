import { YouTubeEmbedInfo } from "../types";

export function extractYouTubeVideoId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || null;
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2] || null;
      }
    } else if (host.includes("youtu.be")) {
      return url.pathname.substring(1) || null;
    }
  } catch {
    // Ignore invalid URLs
  }
  return null;
}

export async function fetchYouTubeOEmbed(urlStr: string): Promise<YouTubeEmbedInfo | null> {
  const videoId = extractYouTubeVideoId(urlStr);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}&format=json`;

    const res = await fetch(oembedUrl);
    if (!res.ok) throw new Error("OEmbed fetch failed");
    const data = await res.json();

    return {
      videoId,
      title: data.title || "YouTube Video",
      authorName: data.author_name || "YouTube Creator",
      authorUrl: data.author_url || "",
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    };
  } catch {
    return {
      videoId,
      title: "YouTube Video",
      authorName: "YouTube Channel",
      authorUrl: "",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    };
  }
}
