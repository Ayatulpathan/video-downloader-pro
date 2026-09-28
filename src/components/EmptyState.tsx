import React from "react";
import { VideoOff, RefreshCw, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  onScanAgain: () => void;
  isScanning?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onScanAgain,
  isScanning,
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-icon-circle">
        <VideoOff className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="empty-title">No downloadable videos found.</h3>
      <p className="empty-desc">
        We could not detect direct video streams on this page. Try playing the video or click below to rescan.
      </p>
      <button
        onClick={onScanAgain}
        disabled={isScanning}
        className="btn-scan-again"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
        Scan Again
      </button>
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="error-state-container">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      <div className="flex-1 text-xs text-rose-200">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-rose-300 underline hover:text-white">
          Retry
        </button>
      )}
    </div>
  );
};
