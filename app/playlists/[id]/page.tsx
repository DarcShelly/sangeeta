"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DEFAULT_PLAYLIST_ID, useStore } from "@/lib/store";
import { SortableSongRow } from "@/components/SortableSongRow";
import { SelectSongsDialog } from "@/components/SelectSongsDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, getPlaylist, songs, setPlaylistSongIds, renamePlaylist, deletePlaylist } =
    useStore();
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!ready) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Loading…</div>;
  }

  const playlist = getPlaylist(id);
  if (!playlist) {
    return <div className="flex min-h-full items-center justify-center text-neutral-500">Playlist not found.</div>;
  }

  const orderedSongs = playlist.songIds
    .map((sid) => songs.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = playlist.songIds.indexOf(String(active.id));
    const newIndex = playlist.songIds.indexOf(String(over.id));
    setPlaylistSongIds(playlist.id, arrayMove(playlist.songIds, oldIndex, newIndex));
  };

  const startEditingName = () => {
    setNameDraft(playlist.name);
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== playlist.name) await renamePlaylist(playlist.id, trimmed);
    setEditingName(false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-neutral-900 bg-neutral-950/95 px-3 py-2.5 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-full rounded bg-neutral-800 px-2 py-1 font-semibold outline-none"
            />
          ) : (
            <p
              onClick={() => playlist.id !== DEFAULT_PLAYLIST_ID && startEditingName()}
              className="truncate font-semibold"
            >
              {playlist.name}
            </p>
          )}
          <p className="text-xs text-neutral-500">{orderedSongs.length} songs</p>
        </div>
        {playlist.id !== DEFAULT_PLAYLIST_ID && (
          <button
            onClick={() => setShowDelete(true)}
            aria-label="Delete playlist"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>

      <div className="flex gap-2 border-b border-neutral-900 px-4 py-3">
        {orderedSongs.length > 0 && (
          <Link
            href={`/song/${orderedSongs[0].id}?pl=${playlist.id}`}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950"
          >
            <PlayIcon /> Play
          </Link>
        )}
        <button
          onClick={() => setShowAddSongs(true)}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100"
        >
          + Add songs
        </button>
      </div>

      {orderedSongs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-neutral-500">
          No songs in this playlist yet.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={playlist.songIds} strategy={verticalListSortingStrategy}>
            {orderedSongs.map((song) => (
              <SortableSongRow
                key={song.id}
                song={song}
                playlistId={playlist.id}
                onRemove={() => setPlaylistSongIds(playlist.id, playlist.songIds.filter((sid) => sid !== song.id))}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {showAddSongs && <SelectSongsDialog playlist={playlist} onClose={() => setShowAddSongs(false)} />}
      {showDelete && (
        <ConfirmDialog
          title="Delete playlist?"
          body={`"${playlist.name}" will be deleted. Songs stay in your library.`}
          onConfirm={() => {
            deletePlaylist(playlist.id);
            router.push("/playlists");
          }}
          onClose={() => setShowDelete(false)}
        />
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
