export type Song = {
  id: string;
  title: string;
  artist: string;
  key?: string;
  capo?: number;
  strummingPattern?: string;
  videoUrl?: string;
  /** Normalized ChordPro-style body: chords in [Brackets] inline with lyrics, [Section] headers. */
  body: string;
  isFavourite: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type NewSongInput = Omit<
  Song,
  "id" | "isFavourite" | "isArchived" | "createdAt" | "updatedAt"
>;
