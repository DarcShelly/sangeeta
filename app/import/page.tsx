"use client";

import { useState } from "react";
import { importToBody } from "@/lib/chordpro";
import { SongForm } from "@/components/SongForm";
import type { NewSongInput } from "@/lib/types";

type Mode = "paste" | "fetch";

export default function ImportPage() {
  const [mode, setMode] = useState<Mode>("paste");
  const [pasteText, setPasteText] = useState("");
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<NewSongInput> | null>(null);

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const { body, meta } = importToBody(pasteText);
    setDraft({
      title: meta.title ?? "",
      artist: meta.artist ?? "",
      key: meta.key,
      capo: meta.capo,
      bpm: meta.bpm,
      strummingPattern: meta.strummingPattern,
      body,
    });
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/fetch-tab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Couldn't fetch that URL.");
        return;
      }
      if (data.source === "ultimate-guitar" && data.rawText) {
        const { body, meta } = importToBody(data.rawText);
        setDraft({
          title: data.title ?? meta.title ?? "",
          artist: data.artist ?? meta.artist ?? "",
          key: data.key ?? meta.key,
          capo: data.capo ?? meta.capo,
          bpm: data.bpm ?? meta.bpm,
          strummingPattern: data.strummingPattern ?? meta.strummingPattern,
          body,
          videoUrl: url.trim().includes("youtube") ? url.trim() : undefined,
        });
      } else {
        // Unstructured fallback: hand it to the paste flow instead of guessing
        // structure, but keep any tempo/strumming guess by folding it back in
        // as directives — the Parse step below already knows how to read those.
        const hints =
          (data.bpm ? `{tempo: ${data.bpm}}\n` : "") +
          (data.strummingPattern ? `{strum: ${data.strummingPattern}}\n` : "");
        setPasteText(hints + (data.rawText ?? ""));
        setMode("paste");
        setFetchError(
          "Couldn't confidently parse that page. Dropped its text below — trim it down to the chords/lyrics and hit Parse."
        );
      }
    } catch {
      setFetchError("Couldn't reach that URL.");
    } finally {
      setFetching(false);
    }
  };

  if (draft) {
    return <SongForm initial={draft} />;
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/95 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="mb-3 text-2xl font-bold">Import a song</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("paste")}
            className={`rounded-full px-3 py-1.5 text-sm ${mode === "paste" ? "bg-amber-500 text-neutral-950" : "bg-neutral-900 text-neutral-400"}`}
          >
            Paste text
          </button>
          <button
            onClick={() => setMode("fetch")}
            className={`rounded-full px-3 py-1.5 text-sm ${mode === "fetch" ? "bg-amber-500 text-neutral-950" : "bg-neutral-900 text-neutral-400"}`}
          >
            Fetch by URL
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {mode === "paste" ? (
          <div>
            <p className="mb-2 text-sm text-neutral-400">
              Copy the chords/lyrics from any site (Ultimate Guitar, ChordPro, or plain text with a
              chord line above the lyric line) and paste it here.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={14}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-amber-500"
              placeholder={"[Verse 1]\n[G]Amazing [C]grace how [G]sweet the sound\n\n...or a chord line above lyrics, or Ultimate Guitar's [ch]G[/ch] style."}
            />
            <button
              onClick={handleParsePaste}
              disabled={!pasteText.trim()}
              className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              Parse
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-neutral-400">
              Best-effort: fetches the page and tries to pull out the tab. Works reliably for
              Ultimate Guitar links; other sites may need manual trimming via paste-import.
            </p>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tabs.ultimate-guitar.com/..."
                className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleFetch}
                disabled={!url.trim() || fetching}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
              >
                {fetching ? "Fetching…" : "Fetch"}
              </button>
            </div>
            {fetchError && <p className="mt-3 text-sm text-amber-400">{fetchError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
