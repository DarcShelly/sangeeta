export type VoiceCommand =
  | { type: "play-playlist"; query: string }
  | { type: "open-playlist"; query: string }
  | { type: "open-song"; query: string }
  | { type: "go-home" }
  | { type: "unknown"; raw: string };

export function parseVoiceCommand(raw: string): VoiceCommand {
  const text = raw.trim().toLowerCase();

  let m = text.match(/^play\s+playlist\s+(.+)$/);
  if (m) return { type: "play-playlist", query: m[1] };

  m = text.match(/^open\s+playlist\s+(.+)$/);
  if (m) return { type: "open-playlist", query: m[1] };

  m = text.match(/^open\s+song\s+(.+)$/);
  if (m) return { type: "open-song", query: m[1] };

  m = text.match(/^play\s+(?:song\s+)?(.+)$/);
  if (m) return { type: "open-song", query: m[1] };

  if (/^(go\s+)?home$/.test(text)) return { type: "go-home" };

  return { type: "unknown", raw: text };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

/** Simple fuzzy match: exact > startsWith > includes > word-overlap score. */
export function bestMatch<T>(query: string, items: T[], getLabel: (item: T) => string): T | null {
  const q = normalize(query);
  if (!q || items.length === 0) return null;

  const exact = items.find((item) => normalize(getLabel(item)) === q);
  if (exact) return exact;

  const startsWith = items.find((item) => normalize(getLabel(item)).startsWith(q));
  if (startsWith) return startsWith;

  const includes = items.find((item) => normalize(getLabel(item)).includes(q));
  if (includes) return includes;

  const qWords = new Set(q.split(/\s+/));
  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const words = normalize(getLabel(item)).split(/\s+/);
    const score = words.filter((w) => qWords.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { item, score };
  }
  return best?.item ?? null;
}
