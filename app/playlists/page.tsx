"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, favouriteSongs } from "@/lib/store";

export default function PlaylistsPage() {
  const { ready, songs, playlists, addPlaylist } = useStore();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const favCount = favouriteSongs(songs).length;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    await addPlaylist(name);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/95 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="mb-3 text-2xl font-bold">Playlists</h1>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </header>

      {!ready ? (
        <div className="flex flex-1 items-center justify-center text-neutral-500">Loading…</div>
      ) : (
        <div>
          <Link
            href="/playlists/favourites"
            className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3 active:bg-neutral-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <HeartIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Favourites</p>
              <p className="text-sm text-neutral-500">{favCount} song{favCount === 1 ? "" : "s"}</p>
            </div>
          </Link>
          {playlists.map((p) => (
            <Link
              key={p.id}
              href={`/playlists/${p.id}`}
              className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3 active:bg-neutral-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <ListIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-neutral-500">
                  {p.songIds.length} song{p.songIds.length === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.7 1.8 6 5 5c1.9-.6 3.8.1 5 1.6C11.2 5.1 13.1 4.4 15 5c3.2 1 4.2 4.7 2.3 7.9C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
