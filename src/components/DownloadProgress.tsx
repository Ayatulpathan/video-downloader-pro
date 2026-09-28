import React from "react";
import { DownloadTask } from "../types";
import { formatBytes } from "../utils/format";
import { X, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";

interface DownloadProgressProps {
  tasks: DownloadTask[];
  onCancel: (downloadId: number) => void;
  onShowInFolder: (downloadId: number) => void;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  tasks,
  onCancel,
  onShowInFolder,
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="download-section">
      <div className="download-section-header">
        <h2 className="download-section-title">Active & Recent Downloads</h2>
        <span className="text-xs text-zinc-400">{tasks.length} item{tasks.length > 1 ? "s" : ""}</span>
      </div>

      <div className="download-list">
        {tasks.map((task) => (
          <div key={task.downloadId} className={`download-card download-state-${task.state}`}>
            <div className="download-card-header">
              <div className="flex-1 min-w-0 pr-2">
                <div className="download-filename" title={task.filename}>
                  {task.filename}
                </div>
                <div className="download-meta">
                  <span className="badge badge-quality text-[10px] py-0 px-1.5">{task.quality}</span>
                  <span className="badge badge-format text-[10px] py-0 px-1.5">{task.format.toUpperCase()}</span>

                  {task.state === "in_progress" && (
                    <span className="text-xs text-zinc-400">
                      {task.totalBytes > 0
                        ? `${formatBytes(task.bytesReceived)} / ${formatBytes(task.totalBytes)} (${task.progressPercent}%)`
                        : `${formatBytes(task.bytesReceived)} downloaded`}
                    </span>
                  )}

                  {task.state === "complete" && (
                    <span className="text-xs text-emerald-400 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 inline" /> Download completed
                    </span>
                  )}

                  {task.state === "interrupted" && (
                    <span className="text-xs text-rose-400 flex items-center" title={task.error}>
                      <AlertCircle className="w-3 h-3 mr-1 inline" /> {task.error || "Failed"}
                    </span>
                  )}
                </div>
              </div>

              <div className="download-actions shrink-0">
                {task.state === "in_progress" && (
                  <button
                    onClick={() => onCancel(task.downloadId)}
                    title="Cancel Download"
                    className="btn-icon text-zinc-400 hover:text-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {task.state === "complete" && (
                  <button
                    onClick={() => onShowInFolder(task.downloadId)}
                    title="Show in Folder"
                    className="btn-show-folder"
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1" /> Show File
                  </button>
                )}
              </div>
            </div>

            {task.state === "in_progress" && (
              <div className="download-progress-bar-container">
                <div
                  className={`download-progress-bar ${task.totalBytes <= 0 ? "animate-pulse" : ""}`}
                  style={{ width: `${task.totalBytes > 0 ? task.progressPercent : 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
