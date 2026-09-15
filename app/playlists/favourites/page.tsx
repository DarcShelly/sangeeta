"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { favouriteSongs, useStore } from "@/lib/store";
import { SongRow } from "@/components/SongRow";

const FAVOURITES_PL_ID = "favourites";

export default function FavouritesPage() {
  const router = useRouter();
  const { ready, songs } = useStore();
  const favs = favouriteSongs(songs);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-neutral-900 bg-neutral-950/95 px-3 py-2.5 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Favourites</p>
          <p className="text-xs text-neutral-500">{favs.length} songs</p>
        </div>
      </header>

      {favs.length > 0 && (
        <div className="border-b border-neutral-900 px-4 py-3">
          <Link
            href={`/song/${favs[0].id}?pl=${FAVOURITES_PL_ID}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950"
          >
            <PlayIcon /> Play
          </Link>
        </div>
      )}

      {!ready ? (
        <div className="flex flex-1 items-center justify-center text-neutral-500">Loading…</div>
      ) : favs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-neutral-500">
          No favourites yet. Tap the ⋮ menu on a song and choose &quot;Add to favourites&quot;.
        </div>
      ) : (
        <div>
          {favs.map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
