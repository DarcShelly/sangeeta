// Cleans up text pulled from an arbitrary web page before it's shown as a tab
// import draft. Two separate concerns:
//   1. Whitespace: collapse blank-line runs, trim the block's start/end.
//      Per-line LEADING whitespace is never touched — it's how the plain-text
//      chord-line-above-lyric-line heuristic (see chordpro.ts) knows which
//      column a chord sits above, so stripping it would silently break that.
//   2. Boilerplate: drop lines that are unmistakably site chrome (nav, cookie
//      banners, share buttons, comment counts, bare URLs, copyright footers)
//      rather than song content. Patterns require a full-line match, not a
//      substring, so a lyric that happens to contain one of these words is
//      never touched — only a line that is *entirely* boilerplate is dropped.

const GARBAGE_LINE_PATTERNS: RegExp[] = [
  /^(home|login|log ?out|sign ?up|sign ?in|register|subscribe|newsletter)$/i,
  /^(share|share this( (tab|song|chords?|article))?|tweet this|share on \w+|follow us( on \w+)?)$/i,
  /^(advertisement|sponsored( content)?|ads?)$/i,
  /^(add to favou?rites?|save (this )?(tab|song))$/i,
  /^(we use cookies.*|this site uses cookies.*|cookie policy|privacy policy|terms (of service|& conditions|and conditions))$/i,
  /^©\s?\d{0,4}.*(all rights reserved)?\.?$/i,
  /^\d+\s+(comments?|replies)$/i,
  /^(leave a (comment|reply)|post a comment|add (a )?comment)$/i,
  /^(related (tabs?|songs?|articles?|chords?)|you might also like|recommended for you|more (tabs?|from) .*)$/i,
  /^(back to top|scroll to top|skip to (main )?content)$/i,
  /^loading\.{0,3}$/i,
  /^(print|download|bookmark|favou?rite|rate this (tab|song))( this)?$/i,
  /^https?:\/\/\S+$/i, // a bare URL sitting on its own line
  /^(\d+\s*(views?|plays?|downloads?)|difficulty:.*|tuning:\s*standard)$/i,
];

function isGarbageLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return false; // blank lines are handled separately
  return GARBAGE_LINE_PATTERNS.some((re) => re.test(trimmed));
}

export function cleanFetchedText(text: string): string {
  const withoutGarbage = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, "")) // trailing whitespace only
    .filter((line) => !isGarbageLine(line));

  const collapsed: string[] = [];
  let blankRun = 0;
  for (const line of withoutGarbage) {
    if (line.trim() === "") {
      blankRun++;
      if (blankRun <= 1) collapsed.push("");
    } else {
      blankRun = 0;
      collapsed.push(line);
    }
  }

  while (collapsed.length && collapsed[0].trim() === "") collapsed.shift();
  while (collapsed.length && collapsed[collapsed.length - 1].trim() === "") collapsed.pop();

  return collapsed.join("\n");
}
