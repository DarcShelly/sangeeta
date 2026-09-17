"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

const MIN_BPM = 40;
const MAX_BPM = 240;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

type AudioContextCtor = typeof AudioContext;

export function MetronomeModal({
  defaultBpm,
  onClose,
}: {
  defaultBpm?: number;
  onClose: () => void;
}) {
  const [bpm, setBpm] = useState(clampBpm(defaultBpm ?? 90));
  const [running, setRunning] = useState(false);
  const [pulse, setPulse] = useState(false);

  const bpmRef = useRef(bpm);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const schedulerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleClick = (time: number, accent: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1400 : 1000;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 1 : 0.6, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.03);

    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    pulseTimersRef.current.push(
      setTimeout(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 90);
      }, delayMs)
    );
  };

  const runScheduler = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      scheduleClick(nextNoteTimeRef.current, beatCountRef.current % 4 === 0);
      beatCountRef.current += 1;
      nextNoteTimeRef.current += 60 / bpmRef.current;
    }
  };

  const stop = () => {
    if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current);
    schedulerTimerRef.current = null;
    pulseTimersRef.current.forEach(clearTimeout);
    pulseTimersRef.current = [];
    setRunning(false);
    setPulse(false);
  };

  const start = () => {
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
    audioCtxRef.current.resume();
    beatCountRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    schedulerTimerRef.current = setInterval(runScheduler, LOOKAHEAD_MS);
    setRunning(true);
  };

  const toggle = () => (running ? stop() : start());

  useEffect(() => stop, []);

  return (
    <Modal onClose={() => { stop(); onClose(); }} title="Metronome">
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

function clampBpm(value: number): number {
  if (Number.isNaN(value)) return MIN_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}
