import React from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isHighestQuality?: boolean;
  label?: string;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onClick,
  isLoading,
  isHighestQuality,
  label,
  disabled,
}) => {
  const defaultLabel = isHighestQuality ? "⬇ Download Highest Quality" : "Download Video";
  const displayLabel = label || defaultLabel;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn-download ${isHighestQuality ? "btn-highest-quality" : "btn-standard"}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Starting Download...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  );
};
