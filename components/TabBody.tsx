"use client";

import { useState } from "react";
import { parseBody, type ParsedLine } from "@/lib/chordpro";

export function TabBody({ body }: { body: string }) {
  const lines = parseBody(body);
  return (
    <div className="space-y-0.5 px-4 pb-8">
      {lines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
    </div>
  );
}

// A real tab line names its string before the dashes, e.g. "e|--0---0--|" or
// just "E--7-5-7--". Lines are already left-aligned by alignTabGroup, so the
// string letter is always the first character — match it with or without a
// following pipe and bold/color it, so the six (or fewer) strings read as a
// clear left-hand column instead of blending into the dash/fret soup.
const STRING_PREFIX_RE = /^([A-Ga-g](#|b)?\|*)/;

// In tab notation, a character's COLUMN is what says "this happens at the same
// time as whatever's in the same column on the other strings" — that's the
// entire point of the monospace grid. But eyeballing "is column 14 on this
// line the same as column 14 three lines down" across a wall of dashes is
// genuinely hard. Shading alternating 4-character bands, using the same
// column boundaries on every line in the group (alignTabGroup already made
// every line the same length), turns that into "is it in the light band or
// the dark band" — answerable at a glance instead of by counting characters.
const COLUMN_BAND_WIDTH = 4;

function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

function TabLine({ text }: { text: string }) {
  const match = text.match(STRING_PREFIX_RE);
  const prefix = match ? match[1] : "";
  const rest = text.slice(prefix.length);
  return (
    <div>
      {prefix && <span className="pr-px font-bold text-amber-400">{prefix}</span>}
      {chunk(rest, COLUMN_BAND_WIDTH).map((band, i) => (
        <span key={i} className={i % 2 === 1 ? "bg-neutral-100/[0.06]" : ""}>
          {band}
        </span>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be denied; not worth surfacing an error for this.
        }
      }}
      className="shrink-0 rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Line({ line }: { line: ParsedLine }) {
  // A blank line is the source's own signal for "new phrase/stanza" — give it
  // a clearly bigger gap than the small constant rhythm between ordinary
  // lines, so grouping reads at a glance instead of every line looking the
  // same distance apart regardless of whether it's mid-verse or a new one.
  if (line.type === "blank") return <div className="h-5" />;

  if (line.type === "section") {
    return (
      <div className="pt-4 pb-1 text-sm font-semibold uppercase tracking-wide text-amber-400">
        {line.label}
      </div>
    );
  }

  if (line.type === "tab") {
    const lines = line.text.split("\n");
    return (
      <div className="my-3 overflow-hidden rounded-lg border-l-2 border-amber-500/60 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Tab
          </span>
          <CopyButton text={line.text} />
        </div>
        <div className="overflow-x-auto p-3">
          <pre className="whitespace-pre font-mono text-base leading-[1.5] tracking-wide text-neutral-300">
            {lines.map((l, i) => (
              <TabLine key={i} text={l} />
            ))}
          </pre>
        </div>
      </div>
    );
  }

  // A small constant gap between every physical line (chorded or not) — tight
  // enough that a continuous verse reads as one block, with blank source
  // lines (above) providing the bigger gap for actual phrase/stanza breaks.
  return (
    <div className="mt-1 whitespace-normal font-mono leading-6">
      {line.segments.map((seg, i) => (
        // Each chord+text pair stacks and wraps as one unit, so a segment that
        // lands on a wrapped visual row still carries its own chord slot above
        // it instead of overlapping the row above it (absolute positioning only
        // reserves space on the first visual row of a line, not on wrapped ones).
        // Chord label and lyric text share the same monospace font — mixing
        // fonts made the chord look like it belonged to a different character
        // position than it actually did.
        <span key={i} className="inline-flex flex-col items-start align-top">
          <span className="h-4 whitespace-nowrap text-xs font-bold leading-4 text-amber-400">
            {seg.chord || " "}
          </span>
          <span className="whitespace-pre-wrap">{seg.text || (seg.chord ? "  " : "")}</span>
        </span>
      ))}
    </div>
  );
}
