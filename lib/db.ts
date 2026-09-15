import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Song, Playlist } from "./types";

interface TabsDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { "by-updatedAt": number };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: { "by-updatedAt": number };
  };
}

const DB_NAME = "guitar-tabs";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TabsDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TabsDB>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment");
  }
  if (!dbPromise) {
    dbPromise = openDB<TabsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const songs = db.createObjectStore("songs", { keyPath: "id" });
        songs.createIndex("by-updatedAt", "updatedAt");
        const playlists = db.createObjectStore("playlists", { keyPath: "id" });
        playlists.createIndex("by-updatedAt", "updatedAt");
      },
    });
  }
  return dbPromise;
}
