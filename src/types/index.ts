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
  qualityRank: number;
  width: number;
  height: number;
  mimeType?: string;
  sizeBytes?: number;
}

export interface YouTubeEmbedInfo {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  embedUrl: string;
}

export interface SavedBookmark {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  addedAt: number;
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
  youtubeInfo?: YouTubeEmbedInfo;
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
