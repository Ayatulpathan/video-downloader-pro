import React, { useState } from "react";
import { DetectedVideoItem, DetectedMediaSource, YouTubeEmbedInfo } from "../types";
import { QualitySelector } from "./QualitySelector";
import { DownloadButton } from "./DownloadButton";
import { formatBytes, formatDuration } from "../utils/format";
import { Film, ShieldAlert, Clock, Sparkles, Play, Bookmark, ExternalLink } from "lucide-react";

interface VideoCardProps {
  video: DetectedVideoItem;
  onDownload: (source: DetectedMediaSource, title: string) => void;
  onPlayEmbed?: (info: YouTubeEmbedInfo) => void;
  onBookmark?: (video: DetectedVideoItem) => void;
  isDownloading?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onDownload,
  onPlayEmbed,
  onBookmark,
  isDownloading,
}) => {
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleBookmarkClick = () => {
    if (onBookmark) {
      onBookmark(video);
      setBookmarked(true);
      setTimeout(() => setBookmarked(false), 2000);
    }
  };

  // 1. YouTube & Policy Restricted Stream Cards
  if (video.isProtected) {
    const isYouTube = video.pageUrl.includes("youtube.com") || video.pageUrl.includes("youtu.be");
    const videoId = isYouTube
      ? new URL(video.pageUrl).searchParams.get("v") || (video.pageUrl.split("/").pop() || "")
      : "";

    const embedInfo: YouTubeEmbedInfo | undefined = isYouTube
      ? {
          videoId,
          title: video.title,
          authorName: "YouTube",
          authorUrl: video.pageUrl,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
        }
      : undefined;

    return (
      <div className="card card-protected">
        <div className="card-header">
          <div className="flex items-start gap-2.5">
            <div className="card-thumbnail-icon bg-amber-950/30 border-amber-800/40">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="card-title text-amber-200" title={video.title}>
                {video.title}
              </h3>
              <div className="card-badges">
                <span className="badge badge-protected">
                  {isYouTube ? "YouTube Stream (Policy Protected)" : "Protected Stream / DRM"}
                </span>
                {video.bestSource.width > 0 && video.bestSource.height > 0 && (
                  <span className="badge badge-dim">
                    {video.bestSource.width}×{video.bestSource.height}
                  </span>
                )}
                {video.durationSeconds && (
                  <span className="badge badge-duration">
                    <Clock className="w-3 h-3 mr-1 inline" />
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-amber-950/20 rounded-lg border border-amber-900/30 text-xs text-amber-300/90 leading-relaxed mt-1">
          {video.protectedReason || "This video stream is protected by DRM or store policy and cannot be downloaded."}
        </div>

        {/* Action Controls for YouTube / Embedded Streams */}
        {isYouTube && embedInfo && (
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPlayEmbed?.(embedInfo)}
                className="btn-highest-quality flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" /> Play in Mini-Player
              </button>
              <button
                onClick={handleBookmarkClick}
                className="btn-standard py-1.5 px-3 text-xs rounded-lg flex items-center justify-center cursor-pointer text-zinc-300 hover:text-white"
                title="Save video for later"
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "text-amber-400 fill-amber-400" : ""}`} />
                <span className="ml-1 text-[11px]">{bookmarked ? "Saved!" : "Save"}</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 text-center">
              💡 Content creators can download their own original MP4 files directly from{" "}
              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                YouTube Studio <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>.
            </p>
          </div>
        )}
      </div>
    );
  }

  // 2. Direct Downloadable HTML5 Videos
  const currentSource = video.sources[selectedSourceIndex] || video.bestSource;
  const isBestSelected = selectedSourceIndex === 0 && video.sources.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-start gap-2.5">
          <div className="card-thumbnail-icon">
            <Film className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="card-title" title={video.title}>
              {video.title}
            </h3>
            <div className="card-badges">
              {currentSource.quality !== "Unknown" ? (
                <span className="badge badge-quality">{currentSource.quality}</span>
              ) : (
                <span className="badge badge-unknown">Resolution Unknown</span>
              )}

              <span className="badge badge-format">{currentSource.format.toUpperCase()}</span>

              {currentSource.width > 0 && currentSource.height > 0 && (
                <span className="badge badge-dim">
                  {currentSource.width}×{currentSource.height}
                </span>
              )}

              {video.durationSeconds && (
                <span className="badge badge-duration">
                  <Clock className="w-3 h-3 mr-1 inline" />
                  {formatDuration(video.durationSeconds)}
                </span>
              )}

              {currentSource.sizeBytes && (
                <span className="badge badge-size">
                  {formatBytes(currentSource.sizeBytes)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {video.sources.length > 1 && (
          <QualitySelector
            sources={video.sources}
            selectedIndex={selectedSourceIndex}
            onSelect={setSelectedSourceIndex}
          />
        )}

        <div className="card-actions">
          {video.sources.length > 1 && !isBestSelected ? (
            <div className="flex flex-col gap-2 w-full">
              <DownloadButton
                onClick={() => onDownload(currentSource, video.title)}
                isLoading={isDownloading}
                isHighestQuality={false}
                label={`Download ${currentSource.quality} (${currentSource.format.toUpperCase()})`}
              />
              <button
                onClick={() => onDownload(video.bestSource, video.title)}
                className="btn-text-highest"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 inline text-amber-400" />
                Or download highest ({video.bestSource.quality} {video.bestSource.format.toUpperCase()})
              </button>
            </div>
          ) : (
            <DownloadButton
              onClick={() => onDownload(currentSource, video.title)}
              isLoading={isDownloading}
              isHighestQuality={true}
              label={
                video.bestSource.quality !== "Unknown"
                  ? `⬇ Download Highest Quality (${video.bestSource.quality})`
                  : "⬇ Download Video"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
