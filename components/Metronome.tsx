"use client";

import { Modal } from "./Modal";
import { MAX_BPM, MIN_BPM, clampBpm } from "@/lib/useMetronome";

export function MetronomeModal({
  bpm,
  setBpm,
  running,
  pulse,
  toggle,
  onClose,
}: {
  bpm: number;
  setBpm: (updater: number | ((b: number) => number)) => void;
  running: boolean;
  pulse: boolean;
  toggle: () => void;
  onClose: () => void;
}) {
  // Closing the popup only hides it — the engine (owned by the song page)
  // keeps running until Stop is tapped or the song page itself is left.
  return (
    <Modal onClose={onClose} title="Metronome">
      <div className="flex flex-col items-center gap-5 py-2">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-bold transition-colors ${
            pulse ? "border-amber-400 bg-amber-400/20 text-amber-300" : "border-neutral-700 text-neutral-500"
          }`}
        >
          {bpm}
        </div>

        <div className="flex w-full items-center gap-3">
          <button
            onClick={() => setBpm((b) => clampBpm(b - 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-lg"
            aria-label="Decrease BPM"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
            className="flex-1 accent-amber-500"
          />
          <button
            onClick={() => setBpm((b) => clampBpm(b + 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-lg"
            aria-label="Increase BPM"
          >
            +
          </button>
        </div>
        <p className="text-xs text-neutral-500">{bpm} BPM</p>

        <button
          onClick={toggle}
          className={`w-full rounded-lg py-2.5 text-sm font-medium ${
            running ? "bg-red-600 text-white" : "bg-amber-500 text-neutral-950"
          }`}
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>
    </Modal>
  );
}
