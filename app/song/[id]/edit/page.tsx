"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { SongForm } from "@/components/SongForm";

export default function EditSongPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getSong } = useStore();

  if (!ready) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Loading…</div>;
  }

  const song = getSong(id);
  if (!song) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Song not found.</div>;
  }

  return <SongForm existing={song} />;
}
