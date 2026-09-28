import React from "react";
import { X, ExternalLink } from "lucide-react";
import { YouTubeEmbedInfo } from "../types";

interface EmbeddedPlayerProps {
  info: YouTubeEmbedInfo;
  onClose: () => void;
}

export const EmbeddedPlayer: React.FC<EmbeddedPlayerProps> = ({ info, onClose }) => {
  return (
    <div className="embedded-player-modal">
      <div className="embedded-player-header">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs font-semibold text-white truncate">{info.title}</h4>
          <p className="text-[10px] text-zinc-400 truncate">{info.authorName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://www.youtube.com/watch?v=${info.videoId}`}
            target="_blank"
            rel="noreferrer"
            title="Open on YouTube"
            className="btn-icon w-6 h-6 text-zinc-400 hover:text-white"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            title="Close Player"
            className="btn-icon w-6 h-6 text-zinc-400 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="embedded-player-frame-wrapper">
        <iframe
          src={info.embedUrl}
          title={info.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="embedded-player-iframe"
        />
      </div>
    </div>
  );
};
