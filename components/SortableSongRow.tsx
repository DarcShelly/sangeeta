"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import type { Song } from "@/lib/types";

export function SortableSongRow({
  song,
  playlistId,
  onRemove,
}: {
  song: Song;
  playlistId: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b border-neutral-900 bg-neutral-950 px-2 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="flex h-9 w-9 shrink-0 touch-none items-center justify-center text-neutral-600"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <Link href={`/song/${song.id}?pl=${playlistId}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{song.title}</p>
        <p className="truncate text-sm text-neutral-500">{song.artist}</p>
      </Link>
      <button
        onClick={onRemove}
        aria-label="Remove from playlist"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-neutral-500 hover:text-red-400"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
