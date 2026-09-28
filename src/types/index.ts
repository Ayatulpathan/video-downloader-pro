export type VideoQualityLabel =
  | "2160p"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p"
  | "144p"
  | "Unknown";

export type VideoFormat = "mp4" | "webm" | "ogg" | "mov" | "m4v" | "unknown";

export interface DetectedMediaSource {
  url: string;
  format: VideoFormat;
  quality: VideoQualityLabel;
  qualityRank: number; // numeric value for sorting (2160, 1440, 1080, 720, 480, 360, 240, 144, 0)
  width: number;
  height: number;
  mimeType?: string;
  sizeBytes?: number;
}

export interface DetectedVideoItem {
  id: string;
  title: string;
  pageUrl: string;
  pageTitle: string;
  sources: DetectedMediaSource[];
  bestSource: DetectedMediaSource;
  isProtected?: boolean;
  protectedReason?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  timestamp: number;
}

export interface DownloadTask {
  downloadId: number;
  url: string;
  filename: string;
  quality: VideoQualityLabel;
  format: VideoFormat;
  state: "in_progress" | "interrupted" | "complete";
  bytesReceived: number;
  totalBytes: number;
  progressPercent: number;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface UserSettings {
  defaultQuality: "highest" | "2160p" | "1440p" | "1080p" | "720p" | "480p";
  askWhereToSave: boolean;
  autoDetect: boolean;
  theme: "system" | "light" | "dark";
}

export type ExtensionMessage =
  | { type: "MEDIA_DETECTED"; videos: DetectedVideoItem[] }
  | { type: "REQUEST_SCAN" }
  | { type: "GET_CURRENT_VIDEOS" }
  | { type: "VIDEOS_UPDATE"; videos: DetectedVideoItem[] }
  | { type: "START_DOWNLOAD"; source: DetectedMediaSource; title: string }
  | { type: "CANCEL_DOWNLOAD"; downloadId: number }
  | { type: "SHOW_DOWNLOAD"; downloadId: number }
  | { type: "GET_DOWNLOAD_TASKS" }
  | { type: "DOWNLOAD_TASKS_UPDATE"; tasks: DownloadTask[] };
