import React from "react";
import { DetectedMediaSource } from "../types";

interface QualitySelectorProps {
  sources: DetectedMediaSource[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  sources,
  selectedIndex,
  onSelect,
}) => {
  if (sources.length <= 1) return null;

  return (
    <div className="quality-selector-container">
      <label className="text-xs text-zinc-400 font-medium mr-2">Quality & Format:</label>
      <select
        value={selectedIndex}
        onChange={(e) => onSelect(parseInt(e.target.value, 10))}
        className="quality-select-dropdown"
      >
        {sources.map((source, idx) => (
          <option key={`${source.url}-${idx}`} value={idx}>
            {source.quality !== "Unknown" ? source.quality : "Default Quality"}
            {source.width > 0 && source.height > 0 ? ` (${source.width}x${source.height})` : ""}
            {` • ${source.format.toUpperCase()}`}
          </option>
        ))}
      </select>
    </div>
  );
};
