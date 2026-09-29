"use client";

import { useEffect, useRef, useState } from "react";

export const MIN_BPM = 40;
export const MAX_BPM = 240;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

type AudioContextCtor = typeof AudioContext;

export function clampBpm(value: number): number {
  if (Number.isNaN(value)) return MIN_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

/**
 * Owns the actual audio scheduling. Call this once per song page (not inside
 * the modal) so the metronome keeps running when the modal is just hidden —
 * it should only ever stop from an explicit Stop tap or this component
 * unmounting (leaving the song page), never from closing the popup.
 */
export function useMetronome(defaultBpm?: number) {
  const [bpm, setBpm] = useState(clampBpm(defaultBpm ?? 90));
  const [running, setRunning] = useState(false);
  const [pulse, setPulse] = useState(false);

  // The song's bpm often isn't known yet on first render (store loads async),
  // so the useState initializer above may have already locked in the 90
  // fallback. Apply the real value once, the first time it shows up, without
  // clobbering a manual adjustment made after that.
  const appliedDefaultRef = useRef(false);
  useEffect(() => {
    if (!appliedDefaultRef.current && defaultBpm) {
      setBpm(clampBpm(defaultBpm));
      appliedDefaultRef.current = true;
    }
  }, [defaultBpm]);

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

  // Only stops when the owning component (the song page) unmounts —
  // i.e. leaving the song, not closing the popup.
  useEffect(() => stop, []);

  return { bpm, setBpm, running, pulse, start, stop, toggle };
}
