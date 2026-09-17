// Fingerings for common chords. Strings ordered low E -> high e.
// fret: -1 = muted, 0 = open, n = fret number (relative to baseFret).
export type ChordShape = {
  frets: number[];
  fingers?: (number | null)[];
  baseFret?: number;
};

export const CHORD_SHAPES: Record<string, ChordShape> = {
  // ---- Open-position naturals ----
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  Csus4: { frets: [-1, 3, 3, 0, 1, 0], fingers: [null, 3, 4, null, 1, null] },
  Cadd9: { frets: [-1, 3, 2, 0, 3, 0], fingers: [null, 3, 2, null, 4, null] },

  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  "D7": { frets: [-1, -1, 0, 2, 1, 2], fingers: [null, null, null, 3, 1, 2] },
  Dsus2: { frets: [-1, -1, 0, 2, 3, 0], fingers: [null, null, null, 1, 2, null] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  // Real fretting is x54230 (absolute); shown here relative to baseFret 2.
  Dadd9: { frets: [-1, 4, 3, 1, 2, 0], baseFret: 2, fingers: [null, 3, 2, 1, 2, null] },

  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  Esus2: { frets: [0, 2, 4, 4, 0, 0], fingers: [null, 1, 3, 4, null, null] },
  Esus4: { frets: [0, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  Eadd9: { frets: [0, 2, 2, 1, 0, 2], fingers: [null, 2, 3, 1, null, 4] },

  F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] },

  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  Gsus4: { frets: [3, 3, 0, 0, 1, 3], fingers: [3, 4, null, null, 1, 4] },
  Gadd9: { frets: [3, 2, 0, 2, 0, 3], fingers: [2, 1, null, 3, null, 4] },

  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  "Am7": { frets: [-1, 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  "A7": { frets: [-1, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  Asus2: { frets: [-1, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  Asus4: { frets: [-1, 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  Aadd9: { frets: [-1, 0, 2, 4, 2, 0], fingers: [null, null, 1, 3, 2, null] },

  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 1 },

  // ---- Sharps/flats: standard movable barre shapes (E-shape and A-shape) ----
  // Diagrams always show a 4-fret window starting at `baseFret` (the real
  // fret the barre sits at), with `frets` values relative to that window —
  // NOT absolute fret numbers. So every root of the same shape reuses the
  // exact same `frets`/`fingers` pattern; only `baseFret` changes.
  //
  // E-shape (root on the low-E string), relative pattern:
  //   major [1,3,3,2,1,1]  minor [1,3,3,1,1,1]  7 [1,3,1,2,1,1]
  // baseFret = semitones up from E: F#/Gb=2, G#/Ab=4.
  "F#": { frets: [1, 3, 3, 2, 1, 1], baseFret: 2, fingers: [1, 3, 4, 2, 1, 1] },
  "Gb": { frets: [1, 3, 3, 2, 1, 1], baseFret: 2, fingers: [1, 3, 4, 2, 1, 1] },
  "F#m": { frets: [1, 3, 3, 1, 1, 1], baseFret: 2, fingers: [1, 3, 4, 1, 1, 1] },
  "Gbm": { frets: [1, 3, 3, 1, 1, 1], baseFret: 2, fingers: [1, 3, 4, 1, 1, 1] },
  "F#7": { frets: [1, 3, 1, 2, 1, 1], baseFret: 2, fingers: [1, 3, 1, 2, 1, 1] },
  "Ab": { frets: [1, 3, 3, 2, 1, 1], baseFret: 4, fingers: [1, 3, 4, 2, 1, 1] },
  "G#": { frets: [1, 3, 3, 2, 1, 1], baseFret: 4, fingers: [1, 3, 4, 2, 1, 1] },
  "Abm": { frets: [1, 3, 3, 1, 1, 1], baseFret: 4, fingers: [1, 3, 4, 1, 1, 1] },
  "G#m": { frets: [1, 3, 3, 1, 1, 1], baseFret: 4, fingers: [1, 3, 4, 1, 1, 1] },
  "Ab7": { frets: [1, 3, 1, 2, 1, 1], baseFret: 4, fingers: [1, 3, 1, 2, 1, 1] },
  "G#7": { frets: [1, 3, 1, 2, 1, 1], baseFret: 4, fingers: [1, 3, 1, 2, 1, 1] },

  // A-shape (root on the A string), relative pattern:
  //   major [x,1,3,3,3,1]  minor [x,1,3,3,2,1]  7 [x,1,3,1,3,1]
  // baseFret = semitones up from A: Bb/A#=1, C#/Db=4, Eb/D#=6.
  "Bb": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, fingers: [null, 1, 3, 3, 3, 1] },
  "A#": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, fingers: [null, 1, 3, 3, 3, 1] },
  "Bbm": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, fingers: [null, 1, 3, 4, 2, 1] },
  "A#m": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, fingers: [null, 1, 3, 4, 2, 1] },
  "Bb7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, fingers: [null, 1, 3, 1, 4, 1] },
  "A#7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, fingers: [null, 1, 3, 1, 4, 1] },
  "C#": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 4, fingers: [null, 1, 3, 3, 3, 1] },
  "Db": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 4, fingers: [null, 1, 3, 3, 3, 1] },
  "C#m": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 4, fingers: [null, 1, 3, 4, 2, 1] },
  "Dbm": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 4, fingers: [null, 1, 3, 4, 2, 1] },
  "C#7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 4, fingers: [null, 1, 3, 1, 4, 1] },
  "Db7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 4, fingers: [null, 1, 3, 1, 4, 1] },
  "Eb": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 6, fingers: [null, 1, 3, 3, 3, 1] },
  "D#": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 6, fingers: [null, 1, 3, 3, 3, 1] },
  "Ebm": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 6, fingers: [null, 1, 3, 4, 2, 1] },
  "D#m": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 6, fingers: [null, 1, 3, 4, 2, 1] },
  "Eb7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 6, fingers: [null, 1, 3, 1, 4, 1] },
  "D#7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 6, fingers: [null, 1, 3, 1, 4, 1] },
};

/** Root + quality, e.g. "F#m7" -> { root: "F#", quality: "m7" }. */
function splitChordName(name: string): { root: string; quality: string } | null {
  const m = name.trim().match(/^([A-Ga-g])(#|b)?(.*)$/);
  if (!m) return null;
  const root = m[1].toUpperCase() + (m[2] ?? "");
  return { root, quality: m[3] };
}

function isMinorQuality(quality: string): boolean {
  return /^m(?!aj)/.test(quality);
}

export function findChordShape(name: string): ChordShape | null {
  const trimmed = name.trim();
  if (CHORD_SHAPES[trimmed]) return CHORD_SHAPES[trimmed];

  // Slash chord, e.g. "G/B" -> try "G".
  const base = trimmed.split("/")[0];
  if (base !== trimmed && CHORD_SHAPES[base]) return CHORD_SHAPES[base];

  // Last resort: approximate with the plain major/minor triad of the same
  // root, so an unusual quality (add11, 13, dim9, ...) still shows *something*
  // useful — the root and major/minor character are the two things a player
  // needs most at a glance — rather than a bare "?".
  const split = splitChordName(base);
  if (!split) return null;
  const approx = isMinorQuality(split.quality) ? `${split.root}m` : split.root;
  return CHORD_SHAPES[approx] ?? null;
}

/** True when the shape returned for `name` is an approximation, not an exact match. */
export function isApproximateShape(name: string): boolean {
  const trimmed = name.trim();
  if (CHORD_SHAPES[trimmed]) return false;
  const base = trimmed.split("/")[0];
  if (CHORD_SHAPES[base]) return false;
  return findChordShape(name) !== null;
}
