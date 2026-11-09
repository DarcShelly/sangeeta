"use client";

import { useState } from "react";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { YouTubeSearchDialog } from "./YouTubeSearchDialog";

export function SongVideo({
  videoUrl,
  searchQuery,
  onVideoSelected,
}: {
  videoUrl?: string;
  searchQuery: string;
  onVideoSelected: (url: string) => Promise<void>;
}) {
  const [playing, setPlaying] = useState(false);
  const [searching, setSearching] = useState(false);
  const youTubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

  const changeButton = (
    <button
      onClick={() => setSearching(true)}
      className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
    >
      Change
    </button>
  );

  return (
    <div className="border-b border-neutral-900">
      {!videoUrl ? (
        <button
          onClick={() => setSearching(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-900"
        >
          <PlaceholderThumb />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Find video on YouTube</p>
            <p className="truncate text-xs text-neutral-500">Search and attach one to this song</p>
          </div>
        </button>
      ) : playing && youTubeId ? (
        <>
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
            <button
              onClick={() => setPlaying(false)}
              aria-label="Close video"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-end px-4 py-1.5">{changeButton}</div>
        </>
      ) : (
        <div className="flex items-center hover:bg-neutral-900">
          {youTubeId ? (
            <button
              onClick={() => setPlaying(true)}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
            >
              <div className="relative h-14 w-24 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={youTubeThumbnail(youTubeId)}
                  alt="Video thumbnail"
                  className="h-14 w-24 rounded-lg object-cover bg-neutral-800"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                  <PlayIcon />
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Play video</p>
                <p className="truncate text-xs text-neutral-500">Plays here — chords stay visible</p>
              </div>
            </button>
          ) : (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
            >
              <PlaceholderThumb />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Watch video</p>
                <p className="truncate text-xs text-neutral-500">{videoUrl}</p>
              </div>
            </a>
          )}
          <div className="shrink-0 pr-4">{changeButton}</div>
        </div>
      )}

      {searching && (
        <YouTubeSearchDialog
          initialQuery={searchQuery}
          onSelect={async (url) => {
            await onVideoSelected(url);
            setPlaying(false);
            setSearching(false);
          }}
          onClose={() => setSearching(false)}
        />
      )}
    </div>
  );
}

function PlaceholderThumb() {
  return (
    <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
      <PlayIcon />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
