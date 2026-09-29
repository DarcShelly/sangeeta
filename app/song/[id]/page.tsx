"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { favouriteSongs, useStore } from "@/lib/store";
import { extractChords } from "@/lib/chordpro";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { useMetronome } from "@/lib/useMetronome";
import { ChordDiagram } from "@/components/ChordDiagram";
import { TabBody } from "@/components/TabBody";
import { MoreMenu } from "@/components/MoreMenu";
import { MetronomeModal } from "@/components/Metronome";

const MIN_SCROLL_SPEED = 0.25;
const MAX_SCROLL_SPEED = 4;
const SCROLL_SPEED_STEP = 0.05;
const BASE_SCROLL_PX = 2;
const SCROLL_INTERVAL_MS = 60;

// 0.1 + 0.05 in float math is 0.15000000000000002 — snap to the step grid so
// repeated +/- clicks land on clean values like 1.05, not 1.0500000000000003.
function roundToStep(value: number): number {
  return Math.round(value / SCROLL_SPEED_STEP) * SCROLL_SPEED_STEP;
}

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, songs, getSong, getPlaylist } = useStore();
  const song = getSong(id);

  // Hooks must run unconditionally (before the not-ready/not-found early
  // returns below), so the metronome engine — and its "only stop on Stop or
  // leaving this page" lifetime — is anchored to the page, not to whether
  // the song has loaded yet.
  const metronome = useMetronome(song?.bpm);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showMetronome, setShowMetronome] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollSpeedRef = useRef(scrollSpeed);
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  const playlistId = searchParams.get("pl");
  const playlist =
    playlistId === "favourites"
      ? { id: "favourites", name: "Favourites", songIds: favouriteSongs(songs).map((s) => s.id) }
      : playlistId
        ? getPlaylist(playlistId)
        : undefined;

  const stopAutoScroll = () => {
    if (scrollTimer.current) clearInterval(scrollTimer.current);
    scrollTimer.current = null;
    setAutoScroll(false);
  };

  const toggleAutoScroll = () => {
    if (autoScroll) {
      stopAutoScroll();
    } else {
      scrollTimer.current = setInterval(
        () => window.scrollBy({ top: BASE_SCROLL_PX * scrollSpeedRef.current }),
        SCROLL_INTERVAL_MS
      );
      setAutoScroll(true);
    }
  };

  // Stop scrolling when leaving this page (route change or unmount) — the
  // interval otherwise keeps calling window.scrollBy forever, scrolling
  // whatever page you've navigated to since.
  useEffect(() => {
    return () => {
      if (scrollTimer.current) clearInterval(scrollTimer.current);
    };
  }, []);

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

  if (!song) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Song not found.</div>;
  }

  const chords = extractChords(song.body);
  const youTubeId = song.videoUrl ? extractYouTubeId(song.videoUrl) : null;
  const infoBadges = [
    song.key && { label: "Key", value: song.key },
    song.capo ? { label: "Capo", value: String(song.capo) } : null,
    song.bpm ? { label: "BPM", value: String(song.bpm) } : null,
  ].filter((b): b is { label: string; value: string } => Boolean(b));

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-neutral-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{song.title}</p>
            {song.artist && <p className="truncate text-xs text-neutral-400">{song.artist}</p>}
          </div>
          <button
            onClick={() => setShowMetronome(true)}
            aria-label="Metronome"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-800"
          >
            <MetronomeIcon />
            {metronome.running && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <MoreMenu song={song} />
        </div>

        {infoBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2.5">
            {infoBadges.map((b) => (
              <span
                key={b.label}
                className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-300"
              >
                <span className="text-neutral-500">{b.label}</span> {b.value}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 pb-2.5">
          <button
            onClick={toggleAutoScroll}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              autoScroll ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {autoScroll ? "Stop" : "Autoscroll"}
          </button>
          <div className="flex items-center gap-1 rounded-full bg-neutral-900 px-1 py-1">
            <button
              onClick={() => setScrollSpeed((s) => Math.max(MIN_SCROLL_SPEED, roundToStep(s - SCROLL_SPEED_STEP)))}
              disabled={scrollSpeed <= MIN_SCROLL_SPEED}
              aria-label="Slower scroll"
              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-300 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-12 text-center text-xs text-neutral-400">{scrollSpeed.toFixed(2)}x</span>
            <button
              onClick={() => setScrollSpeed((s) => Math.min(MAX_SCROLL_SPEED, roundToStep(s + SCROLL_SPEED_STEP)))}
              disabled={scrollSpeed >= MAX_SCROLL_SPEED}
              aria-label="Faster scroll"
              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-300 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
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
        <div className="border-b border-neutral-900">
          {playingVideo && youTubeId ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              />
              <button
                onClick={() => setPlayingVideo(false)}
                aria-label="Close video"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
              >
                ✕
              </button>
            </div>
          ) : youTubeId ? (
            <button
              onClick={() => setPlayingVideo(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-900"
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
              href={song.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900"
            >
              <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
                <PlayIcon />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Watch video</p>
                <p className="truncate text-xs text-neutral-500">{song.videoUrl}</p>
              </div>
            </a>
          )}
        </div>
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

      {showMetronome && (
        <MetronomeModal
          bpm={metronome.bpm}
          setBpm={metronome.setBpm}
          running={metronome.running}
          pulse={metronome.pulse}
          toggle={metronome.toggle}
          onClose={() => setShowMetronome(false)}
        />
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

function MetronomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 21h8M9 21l3-15 3 15M8 10l7.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="6" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
