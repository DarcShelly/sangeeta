"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { favouriteSongs, useStore } from "@/lib/store";
import { extractChords } from "@/lib/chordpro";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { ChordDiagram } from "@/components/ChordDiagram";
import { TabBody } from "@/components/TabBody";
import { MoreMenu } from "@/components/MoreMenu";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, songs, getSong, getPlaylist } = useStore();
  const [autoScroll, setAutoScroll] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const playlistId = searchParams.get("pl");
  const playlist =
    playlistId === "favourites"
      ? { id: "favourites", name: "Favourites", songIds: favouriteSongs(songs).map((s) => s.id) }
      : playlistId
        ? getPlaylist(playlistId)
        : undefined;

  const toggleAutoScroll = () => {
    if (autoScroll) {
      if (scrollTimer.current) clearInterval(scrollTimer.current);
      scrollTimer.current = null;
      setAutoScroll(false);
    } else {
      scrollTimer.current = setInterval(() => window.scrollBy({ top: 1 }), 60);
      setAutoScroll(true);
    }
  };

  const goRelative = (delta: number) => {
    if (!playlist || playlist.songIds.length === 0) return;
    const currentIndex = playlist.songIds.indexOf(id);
    const base = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (base + delta + playlist.songIds.length) % playlist.songIds.length;
    const nextSongId = playlist.songIds[nextIndex];
    router.push(`/song/${nextSongId}?pl=${playlist.id}`);
  };

  if (!ready) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Loading…</div>;
  }

  const song = getSong(id);
  if (!song) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Song not found.</div>;
  }

  const chords = extractChords(song.body);
  const youTubeId = song.videoUrl ? extractYouTubeId(song.videoUrl) : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-neutral-900 bg-neutral-950/95 px-3 py-2.5 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{song.title}</p>
          <p className="truncate text-xs text-neutral-400">
            {song.artist}
            {song.key ? ` · Key ${song.key}` : ""}
            {song.capo ? ` · Capo ${song.capo}` : ""}
          </p>
        </div>
        <button
          onClick={toggleAutoScroll}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            autoScroll ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-300"
          }`}
        >
          {autoScroll ? "Stop" : "Autoscroll"}
        </button>
        <MoreMenu song={song} />
      </header>

      {chords.length > 0 && (
        <div className="flex gap-3 overflow-x-auto border-b border-neutral-900 px-4 py-3">
          {chords.map((c) => (
            <ChordDiagram key={c} name={c} />
          ))}
        </div>
      )}

      {song.strummingPattern && (
        <div className="border-b border-neutral-900 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Strumming pattern</p>
          <p className="mt-1 font-mono text-sm">{song.strummingPattern}</p>
        </div>
      )}

      {song.videoUrl && (
        <a
          href={song.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3 hover:bg-neutral-900"
        >
          {youTubeId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={youTubeThumbnail(youTubeId)}
              alt="Video thumbnail"
              className="h-14 w-24 shrink-0 rounded-lg object-cover bg-neutral-800"
            />
          ) : (
            <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
              <PlayIcon />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Watch video</p>
            <p className="truncate text-xs text-neutral-500">{song.videoUrl}</p>
          </div>
        </a>
      )}

      <TabBody body={song.body} />

      {playlist && (
        <div className="sticky bottom-20 z-20 mx-4 mb-4 flex items-center justify-between rounded-xl bg-neutral-900/95 px-4 py-3 shadow-lg backdrop-blur">
          <button onClick={() => goRelative(-1)} className="text-sm font-medium text-neutral-300">
            ← Prev
          </button>
          <Link href={`/playlists/${playlist.id}`} className="truncate px-2 text-xs text-neutral-500">
            {playlist.name}
          </Link>
          <button onClick={() => goRelative(1)} className="text-sm font-medium text-neutral-300">
            Next →
          </button>
        </div>
      )}
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
