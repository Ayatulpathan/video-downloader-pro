import React, { useEffect, useState } from "react";
import { UserSettings } from "../types";
import { DEFAULT_SETTINGS, getStoredSettings, saveStoredSettings } from "../utils/storage";
import { Check, Settings, Moon, Sun, Monitor, ShieldCheck } from "lucide-react";

export const Options: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getStoredSettings().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
  }, []);

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

  const handleUpdate = async (patch: Partial<UserSettings>) => {
    const updated = await saveStoredSettings(patch);
    setSettings(updated);
    if (patch.theme) {
      applyTheme(patch.theme);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="options-container">
      <div className="options-card">
        <div className="options-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Video Downloader Pro Settings</h1>
              <p className="text-xs text-zinc-400">Configure your download preferences and appearance</p>
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/50">
              <Check className="w-4 h-4" /> Preferences saved
            </div>
          )}
        </div>

        <div className="options-body">
          {/* Default Quality Setting */}
          <div className="setting-row">
            <div>
              <h3 className="setting-label">Default Preferred Quality</h3>
              <p className="setting-hint">Choose which video quality to select or prioritize when available</p>
            </div>
            <select
              value={settings.defaultQuality}
              onChange={(e) => handleUpdate({ defaultQuality: e.target.value as any })}
              className="setting-select"
            >
              <option value="highest">Highest Available (Recommended)</option>
              <option value="2160p">2160p (4K UHD)</option>
              <option value="1440p">1440p (2K QHD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
              <option value="480p">480p (SD)</option>
            </select>
          </div>

          {/* Ask Where to Save */}
          <div className="setting-row">
            <div>
              <h3 className="setting-label">Ask where to save each file</h3>
              <p className="setting-hint">Show the browser's "Save As" file dialog before downloading starts</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.askWhereToSave}
                onChange={(e) => handleUpdate({ askWhereToSave: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>

          {/* Auto Detect Media */}
          <div className="setting-row">
            <div>
              <h3 className="setting-label">Automatically detect media on page load</h3>
              <p className="setting-hint">Scan webpages in the background and update the extension icon badge counter</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoDetect}
                onChange={(e) => handleUpdate({ autoDetect: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>

          {/* Theme Preference */}
          <div className="setting-row">
            <div>
              <h3 className="setting-label">Interface Theme</h3>
              <p className="setting-hint">Select your preferred color scheme for popup and options</p>
            </div>
            <div className="theme-toggle-group">
              <button
                type="button"
                onClick={() => handleUpdate({ theme: "system" })}
                className={`theme-btn ${settings.theme === "system" ? "active" : ""}`}
              >
                <Monitor className="w-4 h-4 mr-1.5" /> System
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ theme: "light" })}
                className={`theme-btn ${settings.theme === "light" ? "active" : ""}`}
              >
                <Sun className="w-4 h-4 mr-1.5" /> Light
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ theme: "dark" })}
                className={`theme-btn ${settings.theme === "dark" ? "active" : ""}`}
              >
                <Moon className="w-4 h-4 mr-1.5" /> Dark
              </button>
            </div>
          </div>

          {/* Privacy & Safety Statement */}
          <div className="mt-8 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Safe, Private, & Local</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Video Downloader Pro processes all media detection locally in your browser.
                  No browsing history, cookies, or video files are ever sent to external servers.
                  DRM-protected and copyrighted streams requiring decryption are strictly respected and ignored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
