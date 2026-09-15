"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import { getDB } from "./db";
import type { NewSongInput, Playlist, Song } from "./types";

export const DEFAULT_PLAYLIST_ID = "default";
export const FAVOURITES_PLAYLIST_ID = "favourites";

type BackupPayload = {
  version: 1;
  exportedAt: number;
  songs: Song[];
  playlists: Playlist[];
};

type StoreContextValue = {
  ready: boolean;
  songs: Song[];
  playlists: Playlist[];
  getSong: (id: string) => Song | undefined;
  getPlaylist: (id: string) => Playlist | undefined;
  addSong: (input: NewSongInput) => Promise<Song>;
  updateSong: (id: string, patch: Partial<NewSongInput>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  addPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  setPlaylistSongIds: (id: string, songIds: string[]) => Promise<void>;
  addSongToPlaylists: (songId: string, playlistIds: string[]) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  exportBackup: () => Promise<BackupPayload>;
  importBackup: (payload: BackupPayload) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDB();
      const existingPlaylists = await db.getAll("playlists");
      if (!existingPlaylists.some((p) => p.id === DEFAULT_PLAYLIST_ID)) {
        const now = Date.now();
        await db.put("playlists", {
          id: DEFAULT_PLAYLIST_ID,
          name: "Default",
          songIds: [],
          createdAt: now,
          updatedAt: now,
        });
      }
      const [allSongs, allPlaylists] = await Promise.all([
        db.getAll("songs"),
        db.getAll("playlists"),
      ]);
      if (cancelled) return;
      setSongs(allSongs.sort((a, b) => b.updatedAt - a.updatedAt));
      setPlaylists(allPlaylists.sort((a, b) => a.name.localeCompare(b.name)));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getSong = useCallback(
    (id: string) => songs.find((s) => s.id === id),
    [songs]
  );
  const getPlaylist = useCallback(
    (id: string) => playlists.find((p) => p.id === id),
    [playlists]
  );

  const addSong = useCallback(async (input: NewSongInput) => {
    const db = await getDB();
    const now = Date.now();
    const song: Song = {
      ...input,
      id: uuid(),
      isFavourite: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.put("songs", song);
    setSongs((prev) => [song, ...prev]);
    return song;
  }, []);

  const updateSong = useCallback(
    async (id: string, patch: Partial<NewSongInput>) => {
      const db = await getDB();
      const existing = await db.get("songs", id);
      if (!existing) return;
      const updated: Song = { ...existing, ...patch, updatedAt: Date.now() };
      await db.put("songs", updated);
      setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)));
    },
    []
  );

  const deleteSong = useCallback(async (id: string) => {
    const db = await getDB();
    const tx = db.transaction(["songs", "playlists"], "readwrite");
    await tx.objectStore("songs").delete(id);
    const allPlaylists = await tx.objectStore("playlists").getAll();
    for (const p of allPlaylists) {
      if (p.songIds.includes(id)) {
        await tx
          .objectStore("playlists")
          .put({ ...p, songIds: p.songIds.filter((sid) => sid !== id) });
      }
    }
    await tx.done;
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setPlaylists((prev) =>
      prev.map((p) => ({ ...p, songIds: p.songIds.filter((sid) => sid !== id) }))
    );
  }, []);

  const toggleFavourite = useCallback(async (id: string) => {
    const db = await getDB();
    const existing = await db.get("songs", id);
    if (!existing) return;
    const updated = { ...existing, isFavourite: !existing.isFavourite, updatedAt: Date.now() };
    await db.put("songs", updated);
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const toggleArchive = useCallback(async (id: string) => {
    const db = await getDB();
    const existing = await db.get("songs", id);
    if (!existing) return;
    const updated = { ...existing, isArchived: !existing.isArchived, updatedAt: Date.now() };
    await db.put("songs", updated);
    setSongs((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const addPlaylist = useCallback(async (name: string) => {
    const db = await getDB();
    const now = Date.now();
    const playlist: Playlist = {
      id: uuid(),
      name,
      songIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.put("playlists", playlist);
    setPlaylists((prev) => [...prev, playlist].sort((a, b) => a.name.localeCompare(b.name)));
    return playlist;
  }, []);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    const db = await getDB();
    const existing = await db.get("playlists", id);
    if (!existing) return;
    const updated = { ...existing, name, updatedAt: Date.now() };
    await db.put("playlists", updated);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => a.name.localeCompare(b.name))
    );
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    if (id === DEFAULT_PLAYLIST_ID) return;
    const db = await getDB();
    await db.delete("playlists", id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setPlaylistSongIds = useCallback(async (id: string, songIds: string[]) => {
    const db = await getDB();
    const existing = await db.get("playlists", id);
    if (!existing) return;
    const updated = { ...existing, songIds, updatedAt: Date.now() };
    await db.put("playlists", updated);
    setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const addSongToPlaylists = useCallback(async (songId: string, playlistIds: string[]) => {
    const db = await getDB();
    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");
    const all = await store.getAll();
    const updates: Playlist[] = [];
    for (const p of all) {
      const shouldContain = playlistIds.includes(p.id);
      const alreadyContains = p.songIds.includes(songId);
      if (shouldContain && !alreadyContains) {
        const updated = { ...p, songIds: [...p.songIds, songId], updatedAt: Date.now() };
        await store.put(updated);
        updates.push(updated);
      } else if (!shouldContain && alreadyContains) {
        const updated = { ...p, songIds: p.songIds.filter((sid) => sid !== songId), updatedAt: Date.now() };
        await store.put(updated);
        updates.push(updated);
      }
    }
    await tx.done;
    setPlaylists((prev) =>
      prev.map((p) => updates.find((u) => u.id === p.id) ?? p)
    );
  }, []);

  const removeSongFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    const db = await getDB();
    const existing = await db.get("playlists", playlistId);
    if (!existing) return;
    const updated = {
      ...existing,
      songIds: existing.songIds.filter((sid) => sid !== songId),
      updatedAt: Date.now(),
    };
    await db.put("playlists", updated);
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  }, []);

  const exportBackup = useCallback(async (): Promise<BackupPayload> => {
    const db = await getDB();
    const [allSongs, allPlaylists] = await Promise.all([
      db.getAll("songs"),
      db.getAll("playlists"),
    ]);
    return {
      version: 1,
      exportedAt: Date.now(),
      songs: allSongs,
      playlists: allPlaylists,
    };
  }, []);

  const importBackup = useCallback(async (payload: BackupPayload) => {
    const db = await getDB();
    const tx = db.transaction(["songs", "playlists"], "readwrite");
    for (const song of payload.songs) {
      await tx.objectStore("songs").put(song);
    }
    for (const playlist of payload.playlists) {
      await tx.objectStore("playlists").put(playlist);
    }
    await tx.done;
    const [allSongs, allPlaylists] = await Promise.all([
      db.getAll("songs"),
      db.getAll("playlists"),
    ]);
    setSongs(allSongs.sort((a, b) => b.updatedAt - a.updatedAt));
    setPlaylists(allPlaylists.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      songs,
      playlists,
      getSong,
      getPlaylist,
      addSong,
      updateSong,
      deleteSong,
      toggleFavourite,
      toggleArchive,
      addPlaylist,
      renamePlaylist,
      deletePlaylist,
      setPlaylistSongIds,
      addSongToPlaylists,
      removeSongFromPlaylist,
      exportBackup,
      importBackup,
    }),
    [
      ready,
      songs,
      playlists,
      getSong,
      getPlaylist,
      addSong,
      updateSong,
      deleteSong,
      toggleFavourite,
      toggleArchive,
      addPlaylist,
      renamePlaylist,
      deletePlaylist,
      setPlaylistSongIds,
      addSongToPlaylists,
      removeSongFromPlaylist,
      exportBackup,
      importBackup,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function favouriteSongs(songs: Song[]) {
  return songs.filter((s) => s.isFavourite && !s.isArchived);
}
