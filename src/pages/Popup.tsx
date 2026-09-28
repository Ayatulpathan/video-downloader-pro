import React, { useEffect, useState, useCallback } from "react";
import { DetectedVideoItem, DetectedMediaSource, DownloadTask } from "../types";
import { Header } from "../components/Header";
import { VideoCard } from "../components/VideoCard";
import { DownloadProgress } from "../components/DownloadProgress";
import { EmptyState, ErrorState } from "../components/EmptyState";
import {
  getActiveTab,
  requestMediaRescan,
  sendDownloadMessage,
  cancelDownloadTask,
  showDownloadItem,
  getDownloadTasks,
} from "../services/chromeApi";
import { getStoredSettings, getStoredVideosForTab } from "../utils/storage";
import { Sparkles } from "lucide-react";

export const Popup: React.FC = () => {
  const [videos, setVideos] = useState<DetectedVideoItem[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);

  const applyTheme = (theme: "system" | "light" | "dark") => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const currentSettings = await getStoredSettings();
      applyTheme(currentSettings.theme);

      const activeTab = await getActiveTab();
      if (activeTab?.id) {
        setCurrentTabId(activeTab.id);
        const cached = await getStoredVideosForTab(activeTab.id);
        if (cached && cached.length > 0) {
          setVideos(cached);
        }

        // Trigger rescan
        setIsScanning(true);
        const fresh = await requestMediaRescan(activeTab.id);
        if (fresh && fresh.length > 0) {
          setVideos(fresh);
        }
        setIsScanning(false);
      }

      // Load active downloads
      const tasks = await getDownloadTasks();
      setDownloadTasks(tasks);
    } catch (err: any) {
      console.error("Popup init error:", err);
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Poll downloads periodically while popup is open
    const interval = setInterval(async () => {
      try {
        const tasks = await getDownloadTasks();
        setDownloadTasks(tasks);
      } catch {
        // Ignore
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleRescan = async () => {
    if (!currentTabId) return;
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const detected = await requestMediaRescan(currentTabId);
      setVideos(detected);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to scan page");
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenSettings = () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  const handleDownload = async (source: DetectedMediaSource, title: string) => {
    setIsStartingDownload(true);
    setErrorMessage(null);
    try {
      const res = await sendDownloadMessage(source, title);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to trigger download");
      } else {
        // Refresh task list
        const tasks = await getDownloadTasks();
        setDownloadTasks(tasks);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not start download");
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleDownloadAllHighest = async () => {
    const validVideos = videos.filter((v) => !v.isProtected && v.bestSource?.url);
    if (validVideos.length === 0) return;

    for (const v of validVideos) {
      await handleDownload(v.bestSource, v.title);
    }
  };

  const handleCancelDownload = async (downloadId: number) => {
    await cancelDownloadTask(downloadId);
    const tasks = await getDownloadTasks();
    setDownloadTasks(tasks);
  };

  const handleShowInFolder = async (downloadId: number) => {
    await showDownloadItem(downloadId);
  };

  const nonProtectedVideos = videos.filter((v) => !v.isProtected);
  const hasProtected = videos.some((v) => v.isProtected);

  return (
    <div className="popup-wrapper">
      <Header
        videoCount={nonProtectedVideos.length}
        isScanning={isScanning}
        onRefresh={handleRescan}
        onOpenSettings={handleOpenSettings}
        hasProtected={hasProtected}
      />

      {errorMessage && (
        <div className="p-3">
          <ErrorState message={errorMessage} onRetry={handleRescan} />
        </div>
      )}

      {/* Global Quick Action if multiple videos detected */}
      {nonProtectedVideos.length > 1 && (
        <div className="quick-actions-bar">
          <button
            onClick={handleDownloadAllHighest}
            disabled={isStartingDownload}
            className="btn-quick-download-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 mr-1.5 inline" />
            Download All Videos (Highest Quality)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="popup-content">
        {videos.length === 0 ? (
          <EmptyState onScanAgain={handleRescan} isScanning={isScanning} />
        ) : (
          <div className="video-list">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
                isDownloading={isStartingDownload}
              />
            ))}
          </div>
        )}

        <DownloadProgress
          tasks={downloadTasks}
          onCancel={handleCancelDownload}
          onShowInFolder={handleShowInFolder}
        />
      </main>

      <footer className="popup-footer">
        <span>Video Downloader Pro • MV3</span>
        <span className="footer-links">
          <button onClick={handleOpenSettings} className="footer-link">
            Settings
          </button>
        </span>
      </footer>
    </div>
  );
};
