import { DetectedVideoItem, DetectedMediaSource, DownloadTask, UserSettings } from "../types";
import { sanitizeFilename } from "../utils/filename";
import { getStoredSettings } from "../utils/storage";

// Storage keys
const ACTIVE_TASKS_KEY = "active_download_tasks";

async function getSavedTasks(): Promise<DownloadTask[]> {
  const data = await chrome.storage.local.get(ACTIVE_TASKS_KEY);
  return data[ACTIVE_TASKS_KEY] || [];
}

async function saveTasks(tasks: DownloadTask[]): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_TASKS_KEY]: tasks });
}

// 1. Tab removed listener
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const key = `tab_videos_${tabId}`;
  await chrome.storage.local.remove(key);
});

// 2. Tab updated listener - reset badge on navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    await chrome.action.setBadgeText({ tabId, text: "" });
  }
});

// 3. Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MEDIA_DETECTED") {
    const tabId = sender.tab?.id;
    if (tabId) {
      const videos: DetectedVideoItem[] = message.videos || [];
      const key = `tab_videos_${tabId}`;
      chrome.storage.local.set({ [key]: videos });

      // Update badge
      const count = videos.filter((v) => !v.isProtected).length;
      chrome.action.setBadgeText({
        tabId,
        text: count > 0 ? String(count) : "",
      });
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: "#4f46e5",
      });
    }
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "START_DOWNLOAD") {
    (async () => {
      try {
        const source: DetectedMediaSource = message.source;
        const title: string = message.title || "video";
        const settings: UserSettings = await getStoredSettings();

        const safeName = sanitizeFilename(title, source.url, source.format);

        chrome.downloads.download(
          {
            url: source.url,
            filename: safeName,
            saveAs: settings.askWhereToSave,
            conflictAction: "uniquify",
          },
          async (downloadId) => {
            if (chrome.runtime.lastError || !downloadId) {
              sendResponse({
                success: false,
                error: chrome.runtime.lastError?.message || "Failed to start download",
              });
              return;
            }

            const newTask: DownloadTask = {
              downloadId,
              url: source.url,
              filename: safeName,
              quality: source.quality,
              format: source.format,
              state: "in_progress",
              bytesReceived: 0,
              totalBytes: source.sizeBytes || 0,
              progressPercent: 0,
              startTime: Date.now(),
            };

            const tasks = await getSavedTasks();
            const filtered = tasks.filter((t) => t.downloadId !== downloadId);
            await saveTasks([newTask, ...filtered].slice(0, 30));

            sendResponse({ success: true, downloadId });
          }
        );
      } catch (err: any) {
        sendResponse({ success: false, error: err.message || "Download initiation error" });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === "CANCEL_DOWNLOAD") {
    const downloadId = message.downloadId;
    chrome.downloads.cancel(downloadId, async () => {
      const tasks = await getSavedTasks();
      const updated = tasks.map((t) =>
        t.downloadId === downloadId ? { ...t, state: "interrupted" as const, error: "Cancelled by user" } : t
      );
      await saveTasks(updated);
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "SHOW_DOWNLOAD") {
    const downloadId = message.downloadId;
    try {
      chrome.downloads.show(downloadId);
      sendResponse({ success: true });
    } catch (e: any) {
      sendResponse({ success: false, error: e.message });
    }
    return false;
  }

  if (message.type === "GET_DOWNLOAD_TASKS") {
    (async () => {
      const tasks = await getSavedTasks();
      // Sync real progress from chrome.downloads API
      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          if (task.state !== "in_progress") return task;
          try {
            const [item] = await chrome.downloads.search({ id: task.downloadId });
            if (!item) return task;

            let state: "in_progress" | "interrupted" | "complete" = task.state;
            if (item.state === "complete") state = "complete";
            else if (item.state === "interrupted") state = "interrupted";

            const bytesReceived = item.bytesReceived || task.bytesReceived;
            const totalBytes = item.totalBytes > 0 ? item.totalBytes : task.totalBytes;
            const progressPercent = totalBytes > 0 ? Math.min(100, Math.round((bytesReceived / totalBytes) * 100)) : 0;

            return {
              ...task,
              state,
              bytesReceived,
              totalBytes,
              progressPercent,
              error: item.error || task.error,
              endTime: item.endTime ? new Date(item.endTime).getTime() : undefined,
            };
          } catch {
            return task;
          }
        })
      );

      await saveTasks(updatedTasks);
      sendResponse({ tasks: updatedTasks });
    })();
    return true;
  }

  return false;
});

// 4. Downloads progress change listener
chrome.downloads.onChanged.addListener(async (delta) => {
  const tasks = await getSavedTasks();
  const taskIndex = tasks.findIndex((t) => t.downloadId === delta.id);
  if (taskIndex === -1) return;

  const current = tasks[taskIndex];
  let updatedState = current.state;
  let errorMsg = current.error;

  if (delta.state) {
    if (delta.state.current === "complete") {
      updatedState = "complete";
    } else if (delta.state.current === "interrupted") {
      updatedState = "interrupted";
      errorMsg = delta.error?.current || "Download interrupted";
    }
  }

  const [item] = await chrome.downloads.search({ id: delta.id });
  const bytesReceived = item?.bytesReceived ?? current.bytesReceived;
  const totalBytes = item?.totalBytes && item.totalBytes > 0 ? item.totalBytes : current.totalBytes;
  const progressPercent = totalBytes > 0 ? Math.min(100, Math.round((bytesReceived / totalBytes) * 100)) : 0;

  tasks[taskIndex] = {
    ...current,
    state: updatedState,
    error: errorMsg,
    bytesReceived,
    totalBytes,
    progressPercent,
    endTime: updatedState === "complete" ? Date.now() : current.endTime,
  };

  await saveTasks(tasks);
});
