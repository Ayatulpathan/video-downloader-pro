import { UserSettings, DetectedVideoItem, DownloadTask } from "../types";

export const DEFAULT_SETTINGS: UserSettings = {
  defaultQuality: "highest",
  askWhereToSave: false,
  autoDetect: true,
  theme: "system",
};

export async function getStoredSettings(): Promise<UserSettings> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    try {
      const data = await chrome.storage.local.get("settings");
      return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    } catch (e) {
      console.warn("Error reading settings from chrome.storage.local:", e);
    }
  }
  return DEFAULT_SETTINGS;
}

export async function saveStoredSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getStoredSettings();
  const updated = { ...current, ...settings };
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ settings: updated });
  }
  return updated;
}

export async function getStoredVideosForTab(tabId: number): Promise<DetectedVideoItem[]> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const key = `tab_videos_${tabId}`;
    const data = await chrome.storage.local.get(key);
    return data[key] || [];
  }
  return [];
}

export async function setStoredVideosForTab(tabId: number, videos: DetectedVideoItem[]): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const key = `tab_videos_${tabId}`;
    await chrome.storage.local.set({ [key]: videos });
  }
}

export async function getActiveDownloadTasks(): Promise<DownloadTask[]> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const data = await chrome.storage.local.get("active_download_tasks");
    return data.active_download_tasks || [];
  }
  return [];
}

export async function saveActiveDownloadTasks(tasks: DownloadTask[]): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ active_download_tasks: tasks });
  }
}
