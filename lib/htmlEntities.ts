const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  bull: "•",
  middot: "·",
  deg: "°",
  copy: "©",
  reg: "®",
  trade: "™",
  times: "×",
  divide: "÷",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  // HTML also allows &#039; without a name; kept for clarity even though the
  // numeric-entity branch below already handles it.
  "#039": "'",
};

/** Decode HTML/XML entities (named, decimal, and hex) in one pass. */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, ref: string) => {
    if (ref[0] === "#") {
      const isHex = ref[1] === "x" || ref[1] === "X";
      const code = parseInt(ref.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    const lower = ref.toLowerCase();
    return lower in NAMED_ENTITIES ? NAMED_ENTITIES[lower] : full;
  });
}
