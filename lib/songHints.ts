// Best-effort extraction of tempo/strumming info from free-form fetched text.
// Neither is a structured field on most tab sites (they're written as prose
// or a loose line of D/U symbols), so this is pattern-matching, not parsing —
// it can miss things or occasionally guess wrong, same as a human skimming.

const BPM_LABELED_RE = /\b(?:tempo|bpm)\b\s*[:=]?\s*(\d{2,3})\s*(?:bpm)?\b/i;
const BPM_PAREN_RE = /\((\d{2,3})\s*bpm\)/i;

export function guessBpm(text: string): number | undefined {
  const m = text.match(BPM_LABELED_RE) ?? text.match(BPM_PAREN_RE);
  if (!m) return undefined;
  const value = Number(m[1]);
  return value >= 40 && value <= 220 ? value : undefined;
}

const STRUM_LABEL_RE = /\bstrumming\s*pattern\b\s*[:\-]?\s*([DUXdux](?:[\sDUXdux/\\]){1,30})/i;
const STRUM_TOKEN_RE = /^[DUXdux]{1,3}$/;

function normalizeStrumLine(line: string): string {
  return line.trim().toUpperCase().replace(/\s+/g, " ");
}

export function guessStrummingPattern(text: string): string | undefined {
  const labeled = text.match(STRUM_LABEL_RE);
  if (labeled) return normalizeStrumLine(labeled[1]);

  // Fallback: a standalone line that's nothing but D/U/x tokens (e.g. "D DU UDU"),
  // the common way sites write a strumming pattern without labeling it.
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 40 || !/\s/.test(trimmed)) continue;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 3 && tokens.length <= 12 && tokens.every((t) => STRUM_TOKEN_RE.test(t))) {
      return normalizeStrumLine(trimmed);
    }
  }
  return undefined;
}
