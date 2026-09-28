import React, { useState } from "react";
import { DetectedVideoItem, DetectedMediaSource } from "../types";
import { QualitySelector } from "./QualitySelector";
import { DownloadButton } from "./DownloadButton";
import { formatBytes, formatDuration } from "../utils/format";
import { Film, ShieldAlert, Clock, Sparkles } from "lucide-react";

interface VideoCardProps {
  video: DetectedVideoItem;
  onDownload: (source: DetectedMediaSource, title: string) => void;
  isDownloading?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onDownload,
  isDownloading,
}) => {
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);

  if (video.isProtected) {
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
                <span className="badge badge-protected">Protected Stream / Policy</span>
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
        <div className="p-2.5 bg-amber-950/20 rounded-lg border border-amber-900/30 text-xs text-amber-300/90 leading-relaxed mt-2">
          {video.protectedReason || "This video stream is protected by DRM or store policy and cannot be downloaded."}
        </div>
      </div>
    );
  }

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
