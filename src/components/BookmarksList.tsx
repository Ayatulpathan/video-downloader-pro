import React from "react";
import { SavedBookmark } from "../types";
import { Play, Trash2, ExternalLink, Bookmark } from "lucide-react";

interface BookmarksListProps {
  bookmarks: SavedBookmark[];
  onPlay: (bookmark: SavedBookmark) => void;
  onRemove: (id: string) => void;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  onPlay,
  onRemove,
}) => {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <Bookmark className="w-8 h-8 text-zinc-500 mx-auto mb-2 opacity-50" />
        <p className="text-xs text-zinc-400">No saved videos yet.</p>
        <p className="text-[10px] text-zinc-500 mt-1">Click "Save for Later" on any video to bookmark it here.</p>
      </div>
    );
  }

  return (
    <div className="bookmarks-list">
      {bookmarks.map((b) => (
        <div key={b.id} className="bookmark-item">
          {b.thumbnailUrl && (
            <img src={b.thumbnailUrl} alt={b.title} className="bookmark-thumb" />
          )}
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="bookmark-title" title={b.title}>
              {b.title}
            </h4>
            {b.channelTitle && (
              <p className="text-[10px] text-zinc-400 truncate">{b.channelTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPlay(b)}
              title="Play in Mini-Player"
              className="btn-icon w-7 h-7 text-indigo-400 hover:text-white"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              title="Open link"
              className="btn-icon w-7 h-7 text-zinc-400 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onRemove(b.id)}
              title="Remove Bookmark"
              className="btn-icon w-7 h-7 text-zinc-400 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
