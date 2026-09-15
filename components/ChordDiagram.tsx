"use client";

import { findChordShape } from "@/lib/chordShapes";

const STRINGS = 6;
const FRETS = 4;
const W = 60;
const H = 72;
const LEFT = 10;
const TOP = 18;
const STRING_GAP = (W - LEFT * 2) / (STRINGS - 1);
const FRET_GAP = (H - TOP - 8) / FRETS;

export function ChordDiagram({ name }: { name: string }) {
  const shape = findChordShape(name);

  return (
    <div className="flex w-16 flex-col items-center gap-1 shrink-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="text-neutral-300">
        {shape ? (
          <>
            {/* nut or base-fret label */}
            {(!shape.baseFret || shape.baseFret === 1) ? (
              <rect x={LEFT - 1} y={TOP - 2} width={W - LEFT * 2 + 2} height={2} fill="currentColor" />
            ) : (
              <text x={LEFT - 8} y={TOP + FRET_GAP} fontSize={8} fill="currentColor">
                {shape.baseFret}
              </text>
            )}
            {/* frets */}
            {Array.from({ length: FRETS + 1 }).map((_, i) => (
              <line
                key={`f${i}`}
                x1={LEFT}
                x2={W - LEFT}
                y1={TOP + i * FRET_GAP}
                y2={TOP + i * FRET_GAP}
                stroke="currentColor"
                strokeWidth={0.75}
                opacity={0.6}
              />
            ))}
            {/* strings */}
            {Array.from({ length: STRINGS }).map((_, i) => (
              <line
                key={`s${i}`}
                x1={LEFT + i * STRING_GAP}
                x2={LEFT + i * STRING_GAP}
                y1={TOP}
                y2={TOP + FRETS * FRET_GAP}
                stroke="currentColor"
                strokeWidth={0.75}
                opacity={0.6}
              />
            ))}
            {/* markers */}
            {shape.frets.map((fret, i) => {
              const x = LEFT + i * STRING_GAP;
              if (fret === -1) {
                return (
                  <text key={i} x={x} y={TOP - 5} fontSize={7} textAnchor="middle" fill="currentColor">
                    x
                  </text>
                );
              }
              if (fret === 0) {
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={TOP - 6}
                    r={2.5}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={0.75}
                  />
                );
              }
              const y = TOP + (fret - 0.5) * FRET_GAP;
              return <circle key={i} cx={x} cy={y} r={3.5} fill="currentColor" />;
            })}
          </>
        ) : (
          <text x={W / 2} y={H / 2} fontSize={9} textAnchor="middle" fill="currentColor" opacity={0.6}>
            ?
          </text>
        )}
      </svg>
      <span className="text-xs font-semibold text-amber-400">{name}</span>
    </div>
  );
}
