import React, { useEffect, useState, useCallback } from "react";
import { DetectedVideoItem, DetectedMediaSource, DownloadTask, YouTubeEmbedInfo, SavedBookmark } from "../types";
import { Header } from "../components/Header";
import { VideoCard } from "../components/VideoCard";
import { DownloadProgress } from "../components/DownloadProgress";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { EmbeddedPlayer } from "../components/EmbeddedPlayer";
import { BookmarksList } from "../components/BookmarksList";
import {
  getActiveTab,
  requestMediaRescan,
  sendDownloadMessage,
  cancelDownloadTask,
  showDownloadItem,
  getDownloadTasks,
} from "../services/chromeApi";
import {
  getStoredSettings,
  getStoredVideosForTab,
  getStoredBookmarks,
  addStoredBookmark,
  removeStoredBookmark,
} from "../utils/storage";
import { Sparkles, Video, Bookmark } from "lucide-react";

export const Popup: React.FC = () => {
  const [activeTabName, setActiveTabName] = useState<"media" | "bookmarks">("media");
  const [videos, setVideos] = useState<DetectedVideoItem[]>([]);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [activeEmbedInfo, setActiveEmbedInfo] = useState<YouTubeEmbedInfo | null>(null);
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

      const savedBookmarks = await getStoredBookmarks();
      setBookmarks(savedBookmarks);

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

  const handleAddBookmark = async (video: DetectedVideoItem) => {
    const isYouTube = video.pageUrl.includes("youtube.com") || video.pageUrl.includes("youtu.be");
    const videoId = isYouTube
      ? new URL(video.pageUrl).searchParams.get("v") || (video.pageUrl.split("/").pop() || "")
      : "";

    const newBookmark: SavedBookmark = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: video.title,
      url: video.pageUrl,
      thumbnailUrl: isYouTube
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : video.thumbnailUrl,
      channelTitle: isYouTube ? "YouTube" : undefined,
      addedAt: Date.now(),
    };

    const updated = await addStoredBookmark(newBookmark);
    setBookmarks(updated);
  };

  const handleRemoveBookmark = async (id: string) => {
    const updated = await removeStoredBookmark(id);
    setBookmarks(updated);
  };

  const handlePlayBookmark = (bookmark: SavedBookmark) => {
    const isYouTube = bookmark.url.includes("youtube.com") || bookmark.url.includes("youtu.be");
    const videoId = isYouTube
      ? new URL(bookmark.url).searchParams.get("v") || (bookmark.url.split("/").pop() || "")
      : "";

    if (videoId) {
      setActiveEmbedInfo({
        videoId,
        title: bookmark.title,
        authorName: bookmark.channelTitle || "Saved Video",
        authorUrl: bookmark.url,
        thumbnailUrl: bookmark.thumbnailUrl || "",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      });
    }
  };

  const nonProtectedVideos = videos.filter((v) => !v.isProtected);
  const hasProtected = videos.some((v) => v.isProtected);

  return (
    <div className="popup-wrapper">
      <Header
        videoCount={videos.length}
        isScanning={isScanning}
        onRefresh={handleRescan}
        onOpenSettings={handleOpenSettings}
        hasProtected={hasProtected}
      />

      {/* Tabs */}
      <div className="popup-tabs">
        <button
          onClick={() => setActiveTabName("media")}
          className={`popup-tab ${activeTabName === "media" ? "active" : ""}`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Detected ({videos.length})</span>
        </button>
        <button
          onClick={() => setActiveTabName("bookmarks")}
          className={`popup-tab ${activeTabName === "bookmarks" ? "active" : ""}`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved ({bookmarks.length})</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3">
          <ErrorState message={errorMessage} onRetry={handleRescan} />
        </div>
      )}

      {/* Global Quick Action if multiple downloadable videos exist */}
      {activeTabName === "media" && nonProtectedVideos.length > 1 && (
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
        {/* Floating Mini Player if active */}
        {activeEmbedInfo && (
          <EmbeddedPlayer
            info={activeEmbedInfo}
            onClose={() => setActiveEmbedInfo(null)}
          />
        )}

        {activeTabName === "media" ? (
          videos.length === 0 ? (
            <EmptyState onScanAgain={handleRescan} isScanning={isScanning} />
          ) : (
            <div className="video-list">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDownload={handleDownload}
                  onPlayEmbed={(info) => setActiveEmbedInfo(info)}
                  onBookmark={handleAddBookmark}
                  isDownloading={isStartingDownload}
                />
              ))}
            </div>
          )
        ) : (
          <BookmarksList
            bookmarks={bookmarks}
            onPlay={handlePlayBookmark}
            onRemove={handleRemoveBookmark}
          />
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
