import React from "react";
import { RefreshCw, Settings, Video, ShieldAlert } from "lucide-react";

interface HeaderProps {
  videoCount: number;
  isScanning: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  hasProtected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  videoCount,
  isScanning,
  onRefresh,
  onOpenSettings,
  hasProtected,
}) => {
  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="header-icon-wrapper">
          <Video className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="header-title">Video Downloader Pro</h1>
          <p className="header-subtitle">
            {videoCount > 0 ? (
              <span className="badge-count">{videoCount} detected</span>
            ) : (
              "Manifest V3"
            )}
            {hasProtected && (
              <span className="badge-protected ml-2" title="Protected/DRM content on page">
                <ShieldAlert className="w-3 h-3 inline mr-1" /> DRM Notice
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onRefresh}
          disabled={isScanning}
          title="Rescan current page for videos"
          className="btn-icon"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin text-indigo-400" : ""}`} />
        </button>
        <button
          onClick={onOpenSettings}
          title="Open Extension Settings"
          className="btn-icon"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
