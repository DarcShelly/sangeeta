"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Song } from "@/lib/types";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { ConfirmDialog } from "./ConfirmDialog";

export function MoreMenu({ song }: { song: Song }) {
  const router = useRouter();
  const { toggleFavourite, toggleArchive, deleteSong } = useStore();
  const [open, setOpen] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="More options"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-10 z-40 w-52 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg"
        >
          <MenuItem
            label={song.isFavourite ? "Remove from favourites" : "Add to favourites"}
            onClick={() => {
              toggleFavourite(song.id);
              setOpen(false);
            }}
          />
          <MenuItem
            label="Add to playlist"
            onClick={() => {
              setShowPlaylistDialog(true);
              setOpen(false);
            }}
          />
          <MenuItem
            label="Edit"
            onClick={() => {
              setOpen(false);
              router.push(`/song/${song.id}/edit`);
            }}
          />
          <MenuItem
            label={song.isArchived ? "Unarchive" : "Archive"}
            onClick={() => {
              toggleArchive(song.id);
              setOpen(false);
            }}
          />
          <MenuItem
            label="Delete"
            destructive
            onClick={() => {
              setShowDeleteConfirm(true);
              setOpen(false);
            }}
          />
        </div>
      )}

      {showPlaylistDialog && (
        <AddToPlaylistDialog song={song} onClose={() => setShowPlaylistDialog(false)} />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete song?"
          body={`"${song.title}" will be permanently deleted from your library and any playlists.`}
          onConfirm={() => deleteSong(song.id)}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  destructive,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-3 text-left text-sm hover:bg-neutral-800 ${
        destructive ? "text-red-400" : "text-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}
