"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import type { Song } from "@/lib/types";

export function AddToPlaylistDialog({
  song,
  onClose,
}: {
  song: Song;
  onClose: () => void;
}) {
  const { playlists, addPlaylist, addSongToPlaylists } = useStore();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(playlists.filter((p) => p.songIds.includes(song.id)).map((p) => p.id))
  );
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await addSongToPlaylists(song.id, Array.from(selected));
    onClose();
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const playlist = await addPlaylist(name);
    setSelected((prev) => new Set(prev).add(playlist.id));
    setNewName("");
    setCreating(false);
  };

  return (
    <Modal onClose={onClose} title={`Add "${song.title}" to playlists`}>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {playlists.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="flex-1">{p.name}</span>
            <span className="text-xs text-neutral-500">{p.songIds.length}</span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="rounded-lg bg-neutral-800 px-3 py-2 text-sm disabled:opacity-40"
        >
          Create
        </button>
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
