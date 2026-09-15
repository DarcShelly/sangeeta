"use client";

import { useRouter } from "next/navigation";
import type { Song } from "@/lib/types";
import { MoreMenu } from "./MoreMenu";

export function SongRow({ song }: { song: Song }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/song/${song.id}`)}
      className="flex cursor-pointer items-center gap-3 border-b border-neutral-900 px-4 py-3 active:bg-neutral-900"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{song.title || "Untitled"}</p>
        <p className="truncate text-sm text-neutral-400">{song.artist || "Unknown artist"}</p>
      </div>
      {song.isFavourite && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-amber-400">
          <path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.7 1.8 6 5 5c1.9-.6 3.8.1 5 1.6C11.2 5.1 13.1 4.4 15 5c3.2 1 4.2 4.7 2.3 7.9C18.7 16.65 12 21 12 21z" />
        </svg>
      )}
      <MoreMenu song={song} />
    </div>
  );
}
