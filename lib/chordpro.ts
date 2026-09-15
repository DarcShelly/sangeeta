// ChordPro-lite: parsing, format detection/normalization, and rendering structure
// for "chords over lyrics" sheets. Real six-line tab notation is detected from
// its own content (a string letter glued to a dense run of frets/dashes) and
// rendered as monospace text, never reflowed — see isTabNotationLine below.

const CHORD_REGEX =
  /^[A-G](#|b)?(maj|min|sus|dim|aug|add|m)?[0-9]*(\/[A-G](#|b)?)?$/i;

const SECTION_REGEX =
  /^(intro|verse|chorus|pre-?chorus|bridge|outro|hook|interlude|solo|refrain|tag|breakdown|ending)\b/i;

export function isChordToken(token: string): boolean {
  return CHORD_REGEX.test(token) && /[A-G]/i.test(token[0]);
}

function isSectionLabel(token: string): boolean {
  return SECTION_REGEX.test(token.trim());
}

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isChordToken);
}

/** Merge a chord line's tokens into the lyric line below at matching column offsets. */
function mergeChordLineIntoLyric(chordLine: string, lyricLine: string): string {
  const matches = [...chordLine.matchAll(/\S+/g)];
  let result = "";
  let lastIndex = 0;
  for (const m of matches) {
    const insertAt = Math.min(m.index ?? 0, lyricLine.length);
    const at = Math.max(insertAt, lastIndex);
    result += lyricLine.slice(lastIndex, at) + `[${m[0]}]`;
    lastIndex = at;
  }
  result += lyricLine.slice(lastIndex);
  return result;
}

function standaloneChordLine(line: string): string {
  return line
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `[${t}]`)
    .join(" ");
}

export type DetectedFormat = "chordpro" | "ultimate-guitar" | "plain" | "empty";

export function detectFormat(raw: string): DetectedFormat {
  if (!raw.trim()) return "empty";
  if (/\[ch\]/i.test(raw)) return "ultimate-guitar";
  if (/\[[A-G](#|b)?[a-z0-9]*\]/.test(raw)) return "chordpro";
  return "plain";
}

export type ExtractedMeta = {
  title?: string;
  artist?: string;
  key?: string;
  capo?: number;
  body: string;
};

/** Pull {title:}/{artist:}/{key:}/{capo:} directives (ChordPro or UG style) out of the body. */
export function extractMetadata(raw: string): ExtractedMeta {
  let title: string | undefined;
  let artist: string | undefined;
  let key: string | undefined;
  let capo: number | undefined;

  const body = raw
    .split("\n")
    .filter((line) => {
      const m = line.match(/^\s*\{\s*(\w+)\s*:\s*(.*?)\s*\}\s*$/);
      if (!m) return true;
      const [, directive, value] = m;
      switch (directive.toLowerCase()) {
        case "title":
        case "t":
          title = value;
          return false;
        case "artist":
        case "subtitle":
        case "st":
          artist = value;
          return false;
        case "key":
          key = value;
          return false;
        case "capo":
          capo = Number(value) || undefined;
          return false;
        default:
          return true;
      }
    })
    .join("\n");

  return { title, artist, key, capo, body };
}

/** Normalize UG ([ch]G[/ch]) or plain (chord-line-above-lyric-line) text into ChordPro-lite. */
export function normalizeToChordPro(raw: string, format: DetectedFormat): string {
  if (format === "chordpro" || format === "empty") return raw;

  if (format === "ultimate-guitar") {
    return raw.replace(/\[ch\]\s*/gi, "[").replace(/\s*\[\/ch\]/gi, "]");
  }

  // plain: detect chord lines and merge them into the following lyric line.
  const lines = raw.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isChordLine(line)) {
      out.push(line);
      continue;
    }
    const next = lines[i + 1];
    if (next !== undefined && next.trim() !== "" && !isChordLine(next)) {
      out.push(mergeChordLineIntoLyric(line, next));
      i++; // consumed the lyric line
    } else {
      out.push(standaloneChordLine(line));
    }
  }
  return out.join("\n");
}

export function importToBody(raw: string): { body: string; meta: ExtractedMeta } {
  const format = detectFormat(raw);
  const normalized = normalizeToChordPro(raw, format);
  const meta = extractMetadata(normalized);
  return { body: meta.body, meta };
}

// ---- Rendering structure ----

export type LyricSegment = { chord: string | null; text: string };
export type ParsedLine =
  | { type: "section"; label: string }
  | { type: "lyric"; segments: LyricSegment[] }
  | { type: "tab"; text: string }
  | { type: "blank" };

function parseLyricLine(rawLine: string): ParsedLine {
  const trimmed = rawLine.trim();
  if (trimmed === "") return { type: "blank" };

  const soleBracket = trimmed.match(/^\[([^\]]+)\]$/);
  if (soleBracket && isSectionLabel(soleBracket[1])) {
    return { type: "section", label: soleBracket[1] };
  }

  // split on [chord] markers, keeping lead-in text.
  const segments: LyricSegment[] = [];
  const re = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let firstChord: string | null = null;
  let pendingText = "";
  while ((match = re.exec(rawLine)) !== null) {
    const leadText = rawLine.slice(lastIndex, match.index);
    if (firstChord === null && segments.length === 0) {
      pendingText = leadText;
    } else {
      segments.push({ chord: firstChord, text: leadText });
    }
    firstChord = match[1];
    lastIndex = re.lastIndex;
  }
  const tailText = rawLine.slice(lastIndex);
  if (firstChord !== null) {
    segments.push({ chord: firstChord, text: tailText });
  }
  if (segments.length === 0) {
    return { type: "lyric", segments: [{ chord: null, text: rawLine }] };
  }
  return {
    type: "lyric",
    segments: pendingText ? [{ chord: null, text: pendingText }, ...segments] : segments,
  };
}

// Real tab notation names its string right up against a dense run of frets/
// rests: "e|--0---0--|", "E——7–5-7—" (dash variants and all — sites mangle
// plain hyphens into typographic dashes via "smart punctuation" all the time).
// This is deliberately content-based rather than relying on [tab] markup,
// because only Ultimate Guitar's own export format ever uses [tab] tags —
// every other site just hands back bare lines with no wrapper at all.
const DASH_CHARS = "\\-\\u2010-\\u2015\\u2212_";
const TAB_REMAINDER_RE = new RegExp(`^[${DASH_CHARS}|/\\\\0-9hpbsx~\\s]+$`, "i");

const HAS_DASH_RE = new RegExp(`[${DASH_CHARS}|]`);

function isTabNotationLine(line: string): boolean {
  const trimmed = line.trim();
  const m = trimmed.match(/^([A-Ga-g])\s?(.+)$/);
  if (!m) return false;
  const remainder = m[2];
  if (remainder.replace(/\s/g, "").length < 6) return false;
  // A string with nothing played on it (a "rest" line) is legitimate tab
  // content and has no digits at all — require dash/bar density instead of a
  // fret number, so an all-rest line like "B——————————-|" still counts.
  if (!HAS_DASH_RE.test(remainder)) return false;
  return TAB_REMAINDER_RE.test(remainder);
}

/** Typographic dash variants -> plain hyphen, so a mangled source still reads as a normal tab. */
function normalizeTabDashes(text: string): string {
  return text.replace(/[‐-―−]/g, "-");
}

/**
 * Force every line in a tab group to share a left edge and a right edge.
 * Sources routinely hand back each string line with different leading
 * whitespace and a different length (each was its own <p>/<div> with no
 * regard for its neighbors) — left as-is, the string letters don't line up
 * and the frets look scattered rather than gridded. This strips each line's
 * leading whitespace (which carries no meaning here — unlike the plain-text
 * chord-line-above-lyric case, a tab line doesn't encode position via
 * indentation) and pads every line's content out to the longest line's
 * length with dashes, so a bare string with nothing played still lines up
 * fret-for-fret with the others instead of trailing off early.
 */
function alignTabGroup(lines: string[]): string[] {
  const parts = lines.map((line) => {
    const trimmed = line.replace(/^\s+/, "");
    const m = trimmed.match(/^(.*?)(\|+)\s*$/);
    return m ? { body: m[1], tail: m[2] } : { body: trimmed, tail: "" };
  });
  const maxLen = Math.max(...parts.map((p) => p.body.length));
  return parts.map((p) => p.body.padEnd(maxLen, "-") + p.tail);
}

export function parseBody(body: string): ParsedLine[] {
  // [tab]/[/tab] tags (when present at all — only Ultimate Guitar writes them)
  // carry no extra information now that grouping is content-based; strip them
  // as noise whether they're paired, unpaired, or wrapping non-tab content.
  const lines = body.replace(/\[\/?tab\]/gi, "").split("\n");
  const result: ParsedLine[] = [];

  let i = 0;
  while (i < lines.length) {
    if (!isTabNotationLine(lines[i])) {
      result.push(parseLyricLine(lines[i]));
      i++;
      continue;
    }
    const group: string[] = [lines[i]];
    let j = i + 1;
    while (j < lines.length) {
      if (isTabNotationLine(lines[j])) {
        group.push(lines[j]);
        j++;
      } else if (lines[j].trim() === "" && j + 1 < lines.length && isTabNotationLine(lines[j + 1])) {
        // A lone blank line between two tab lines is almost always an artifact
        // of stripping each line out of its own <p>/<div> on the source page,
        // not a real gap — swallow it instead of splitting the group.
        j++;
      } else {
        break;
      }
    }
    const normalized = group.map((line) => normalizeTabDashes(line));
    result.push({ type: "tab", text: alignTabGroup(normalized).join("\n") });
    i = j;
  }

  return result;
}

/** All distinct chord names referenced in a body, in first-seen order. */
export function extractChords(body: string): string[] {
  const seen: string[] = [];
  const re = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const token = match[1];
    if (isChordToken(token) && !seen.includes(token)) seen.push(token);
  }
  return seen;
}
