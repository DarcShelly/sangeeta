"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { NewSongInput, Song } from "@/lib/types";

export function SongForm({
  existing,
  initial,
}: {
  existing?: Song;
  initial?: Partial<NewSongInput>;
}) {
  const router = useRouter();
  const { addSong, updateSong } = useStore();
  const base = existing ?? initial;
  const [title, setTitle] = useState(base?.title ?? "");
  const [artist, setArtist] = useState(base?.artist ?? "");
  const [key, setKey] = useState(base?.key ?? "");
  const [capo, setCapo] = useState(base?.capo?.toString() ?? "");
  const [bpm, setBpm] = useState(base?.bpm?.toString() ?? "");
  const [strummingPattern, setStrummingPattern] = useState(base?.strummingPattern ?? "");
  const [videoUrl, setVideoUrl] = useState(base?.videoUrl ?? "");
  const [body, setBody] = useState(base?.body ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const input: NewSongInput = {
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim() || undefined,
      capo: capo.trim() ? Number(capo) : undefined,
      bpm: bpm.trim() ? Number(bpm) : undefined,
      strummingPattern: strummingPattern.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      body,
    };
    if (existing) {
      await updateSong(existing.id, input);
      router.push(`/song/${existing.id}`);
    } else {
      const song = await addSong(input);
      router.push(`/song/${song.id}`);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <button onClick={() => router.back()} className="text-sm text-neutral-400">
          Cancel
        </button>
        <h1 className="font-semibold">{existing ? "Edit song" : "New song"}</h1>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
        >
          Save
        </button>
      </header>

      <div className="flex-1 space-y-4 px-4 py-4">
        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Singer / Artist">
          <input value={artist} onChange={(e) => setArtist(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex gap-3">
          <Field label="Key" className="flex-1">
            <input value={key} onChange={(e) => setKey(e.target.value)} className={inputClass} placeholder="G" />
          </Field>
          <Field label="Capo" className="flex-1">
            <input
              value={capo}
              onChange={(e) => setCapo(e.target.value.replace(/[^0-9]/g, ""))}
              className={inputClass}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
          <Field label="BPM" className="flex-1">
            <input
              value={bpm}
              onChange={(e) => setBpm(e.target.value.replace(/[^0-9]/g, ""))}
              className={inputClass}
              placeholder="90"
              inputMode="numeric"
            />
          </Field>
        </div>
        <Field label="Strumming pattern">
          <input
            value={strummingPattern}
            onChange={(e) => setStrummingPattern(e.target.value)}
            className={inputClass}
            placeholder="D D U U D U"
          />
        </Field>
        <Field label="Video link (YouTube or other)">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={inputClass}
            placeholder="https://youtube.com/watch?v=..."
          />
        </Field>
        <Field label="Chords & lyrics">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className={`${inputClass} font-mono text-sm leading-relaxed`}
            placeholder={"[Verse 1]\n[G]Amazing [C]grace how [G]sweet the sound"}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Put chord names in [brackets] right before the lyric they go with. Use [Verse]/[Chorus]
            on their own line for section headers. Need help importing? Use the Import tab.
          </p>
        </Field>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-400">{label}</span>
      {children}
    </label>
  );
}
