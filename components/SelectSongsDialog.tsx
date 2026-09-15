"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import type { Playlist } from "@/lib/types";

export function SelectSongsDialog({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const { songs, setPlaylistSongIds } = useStore();
  const [selected, setSelected] = useState<Set<string>>(new Set(playlist.songIds));
  const [query, setQuery] = useState("");

  const available = songs.filter(
    (s) => !s.isArchived && (s.title + s.artist).toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    // Preserve existing order, then append newly selected songs at the end.
    const kept = playlist.songIds.filter((id) => selected.has(id));
    const added = Array.from(selected).filter((id) => !playlist.songIds.includes(id));
    await setPlaylistSongIds(playlist.id, [...kept, ...added]);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Add songs to "${playlist.name}"`}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs"
        className="mb-2 w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
      />
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {available.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-neutral-500">No songs found.</p>
        )}
        {available.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="min-w-0 flex-1 truncate">
              {s.title} <span className="text-neutral-500">· {s.artist}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-neutral-400">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
