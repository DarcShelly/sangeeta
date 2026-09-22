"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { youTubeWatchUrl } from "@/lib/youtube";

type VideoResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
};

export function YouTubeSearchDialog({
  initialQuery,
  onSelect,
  onClose,
}: {
  initialQuery?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VideoResult[] | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        setResults(null);
        return;
      }
      setResults(data.results ?? []);
      if (!data.results?.length) setError("No results found.");
    } catch {
      setError("Couldn't reach YouTube.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Search YouTube">
      <div className="flex gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Song title, artist…"
          className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          onClick={search}
          disabled={!query.trim() || loading}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-amber-400">{error}</p>}

      {results && results.length > 0 && (
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.videoId}
              onClick={() => onSelect(youTubeWatchUrl(r.videoId))}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-neutral-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.thumbnail}
                alt=""
                className="h-12 w-20 shrink-0 rounded object-cover bg-neutral-800"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-neutral-500">
                  {r.channel}
                  {r.duration ? ` · ${r.duration}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-600">
        Pulls from YouTube&apos;s own search page — best-effort, not an official API.
      </p>
    </Modal>
  );
}
