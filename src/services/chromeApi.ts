import { DetectedVideoItem, DownloadTask } from "../types";

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === "undefined" || !chrome.tabs) return null;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

export async function requestMediaRescan(tabId?: number): Promise<DetectedVideoItem[]> {
  let targetTabId = tabId;
  if (!targetTabId) {
    const activeTab = await getActiveTab();
    targetTabId = activeTab?.id;
  }
  if (!targetTabId) return [];

  try {
    const response = await chrome.tabs.sendMessage(targetTabId, { type: "REQUEST_SCAN" });
    return response?.videos || [];
  } catch {
    // If content script is not yet injected or frame is disconnected, try to inject scripting
    try {
      if (chrome.scripting && targetTabId) {
        await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          files: ["content.js"],
        });
        const retryResponse = await chrome.tabs.sendMessage(targetTabId, { type: "REQUEST_SCAN" });
        return retryResponse?.videos || [];
      }
    } catch (injectErr) {
      console.warn("Could not inject content script:", injectErr);
    }
  }
  return [];
}

export async function sendDownloadMessage(source: any, title: string): Promise<{ success: boolean; downloadId?: number; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "START_DOWNLOAD", source, title },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: "No response received" });
        }
      }
    );
  });
}

export async function cancelDownloadTask(downloadId: number): Promise<void> {
  await chrome.runtime.sendMessage({ type: "CANCEL_DOWNLOAD", downloadId });
}

export async function showDownloadItem(downloadId: number): Promise<void> {
  await chrome.runtime.sendMessage({ type: "SHOW_DOWNLOAD", downloadId });
}

export async function getDownloadTasks(): Promise<DownloadTask[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_DOWNLOAD_TASKS" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve([]);
      } else {
        resolve(response?.tasks || []);
      }
    });
  });
}
