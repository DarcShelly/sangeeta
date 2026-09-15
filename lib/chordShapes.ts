// Open-position fingerings for common chords. Strings ordered low E -> high e.
// fret: -1 = muted, 0 = open, n = fret number (relative to baseFret).
export type ChordShape = {
  frets: number[];
  fingers?: (number | null)[];
  baseFret?: number;
};

export const CHORD_SHAPES: Record<string, ChordShape> = {
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  "D7": { frets: [-1, -1, 0, 2, 1, 2], fingers: [null, null, null, 3, 1, 2] },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  "Am7": { frets: [-1, 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  "A7": { frets: [-1, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 1 },
  Asus2: { frets: [-1, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  Asus4: { frets: [-1, 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  Csus4: { frets: [-1, 3, 3, 0, 1, 0], fingers: [null, 3, 4, null, 1, null] },
};

export function findChordShape(name: string): ChordShape | null {
  const trimmed = name.trim();
  if (CHORD_SHAPES[trimmed]) return CHORD_SHAPES[trimmed];
  // fall back to the base chord if it's a slash chord, e.g. "G/B" -> "G"
  const base = trimmed.split("/")[0];
  return CHORD_SHAPES[base] ?? null;
}
