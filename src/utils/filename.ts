import { VideoFormat } from "../types";

const RESERVED_WINDOWS_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

export function sanitizeFilename(
  rawTitle: string,
  fallbackUrl: string,
  format: VideoFormat
): string {
  let baseName = rawTitle ? rawTitle.trim() : "";

  // If no title was found, extract from url path
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

  if (!baseName) {
    baseName = `video_${Date.now()}`;
  }

  // Remove illegal characters: < > : " / \ | ? * and control chars
  // eslint-disable-next-line no-control-regex
  baseName = baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

  // Collapse consecutive underscores or spaces
  baseName = baseName.replace(/[\s_]+/g, "_").trim();

  // Strip trailing periods and spaces (illegal on Windows)
  baseName = baseName.replace(/[. ]+$/, "");

  // Check reserved DOS device names
  const upper = baseName.toUpperCase();
  if (RESERVED_WINDOWS_NAMES.has(upper)) {
    baseName = `${baseName}_file`;
  }

  // Cap length to avoid MAX_PATH overflow (120 chars)
  if (baseName.length > 120) {
    baseName = baseName.substring(0, 120).trim().replace(/[. ]+$/, "");
  }

  const extension = format !== "unknown" ? `.${format}` : ".mp4";
  if (!baseName.toLowerCase().endsWith(extension)) {
    return `${baseName}${extension}`;
  }
  return baseName;
}
