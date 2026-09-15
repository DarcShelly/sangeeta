"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useStore, favouriteSongs } from "@/lib/store";
import { bestMatch, parseVoiceCommand } from "@/lib/voice";

// Minimal shape of the Web Speech API we use; not in TS's default DOM lib.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

export function VoiceControl() {
  const router = useRouter();
  const { songs, playlists } = useStore();
  // Browser support can only be known client-side; useSyncExternalStore returns
  // the server snapshot (false) during SSR/hydration and the real value right after,
  // without the extra render a setState-in-effect would cause.
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getSpeechRecognitionCtor() !== null,
    () => false
  );
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), 3000);
  };

  const handleTranscript = (raw: string) => {
    const command = parseVoiceCommand(raw);
    const allPlaylists = [
      { id: "favourites", name: "Favourites", songIds: favouriteSongs(songs).map((s) => s.id) },
      ...playlists,
    ];

    switch (command.type) {
      case "go-home":
        router.push("/");
        showStatus("Opening home");
        return;
      case "open-playlist": {
        const match = bestMatch(command.query, allPlaylists, (p) => p.name);
        if (match) {
          router.push(`/playlists/${match.id}`);
          showStatus(`Opening playlist "${match.name}"`);
        } else {
          showStatus(`No playlist found for "${command.query}"`);
        }
        return;
      }
      case "play-playlist": {
        const match = bestMatch(command.query, allPlaylists, (p) => p.name);
        if (match && match.songIds.length > 0) {
          router.push(`/song/${match.songIds[0]}?pl=${match.id}`);
          showStatus(`Playing "${match.name}"`);
        } else {
          showStatus(`No playable playlist found for "${command.query}"`);
        }
        return;
      }
      case "open-song": {
        const nonArchived = songs.filter((s) => !s.isArchived);
        const match = bestMatch(command.query, nonArchived, (s) => s.title);
        if (match) {
          router.push(`/song/${match.id}`);
          showStatus(`Opening "${match.title}"`);
        } else {
          showStatus(`No song found for "${command.query}"`);
        }
        return;
      }
      default:
        showStatus(`Didn't understand "${raw}"`);
    }
  };

  const toggleListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2">
      {status && (
        <div className="max-w-56 rounded-lg bg-neutral-800 px-3 py-2 text-xs text-neutral-200 shadow-lg">
          {status}
        </div>
      )}
      <button
        onClick={toggleListening}
        aria-label={listening ? "Stop voice command" : "Start voice command"}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${
          listening ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-neutral-950"
        }`}
      >
        <MicIcon />
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0014 0M12 19v3" strokeLinecap="round" />
    </svg>
  );
}
