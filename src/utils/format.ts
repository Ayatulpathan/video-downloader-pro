import { VideoFormat } from "../types";

export function formatBytes(bytes?: number, decimals = 1): string {
  if (bytes === undefined || bytes === null || bytes <= 0) return "Unknown size";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds?: number): string {
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

export function detectFormatFromMimeOrUrl(mimeType?: string, url?: string): VideoFormat {
  if (mimeType) {
    const mime = mimeType.toLowerCase();
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("quicktime") || mime.includes("mov")) return "mov";
    if (mime.includes("m4v")) return "m4v";
  }

  if (url) {
    try {
      const pathname = new URL(url, window.location.href).pathname.toLowerCase();
      if (pathname.endsWith(".mp4")) return "mp4";
      if (pathname.endsWith(".webm")) return "webm";
      if (pathname.endsWith(".ogg") || pathname.endsWith(".ogv")) return "ogg";
      if (pathname.endsWith(".mov")) return "mov";
      if (pathname.endsWith(".m4v")) return "m4v";
    } catch {
      // Fallback
    }
  }

  return "mp4"; // Default web video format
}
