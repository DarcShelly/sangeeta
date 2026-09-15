"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SongRow } from "@/components/SongRow";

type Filter = "all" | "favourites" | "archived";

export default function HomePage() {
  const { ready, songs } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = songs;
    if (filter === "all") list = list.filter((s) => !s.isArchived);
    else if (filter === "favourites") list = list.filter((s) => s.isFavourite && !s.isArchived);
    else if (filter === "archived") list = list.filter((s) => s.isArchived);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    return list;
  }, [songs, filter, query]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/95 px-4 pt-5 pb-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tabs</h1>
          <Link
            href="/song/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-neutral-950"
            aria-label="Add song"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs or artists"
          className="mb-3 w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />
        <div className="flex gap-2">
          {(["all", "favourites", "archived"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                filter === f ? "bg-amber-500 text-neutral-950" : "bg-neutral-900 text-neutral-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {!ready ? (
        <div className="flex flex-1 items-center justify-center text-neutral-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center text-neutral-500">
          <p>
            {filter === "all"
              ? "No songs yet. Add your first song or import one."
              : `No ${filter} songs.`}
          </p>
          {filter === "all" && (
            <Link href="/song/new" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950">
              Add a song
            </Link>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
