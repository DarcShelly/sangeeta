import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Best-effort: fetches YouTube's own public search results page (the same
// page you'd get typing the search into a browser) and reads the same
// ytInitialData JSON blob the page's own script uses to render itself.
// No API key, no quota — but unofficial, so it can break if YouTube changes
// that page's structure.

type VideoResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
};

/** Scan forward from `marker` for the first `{`, then return the balanced JSON object starting there. */
function extractJsonAfter(html: string, marker: string): string | null {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const start = html.indexOf("{", idx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

/** Walk the whole JSON tree collecting every `videoRenderer` object, wherever it's nested. */
function collectVideoRenderers(node: unknown, out: Record<string, unknown>[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  const vr = obj.videoRenderer;
  if (vr && typeof vr === "object") out.push(vr as Record<string, unknown>);
  for (const key in obj) {
    if (key === "videoRenderer") continue;
    collectVideoRenderers(obj[key], out);
  }
}

function textOf(field: unknown): string {
  if (!field || typeof field !== "object") return "";
  const f = field as { simpleText?: string; runs?: { text?: string }[] };
  if (typeof f.simpleText === "string") return f.simpleText;
  if (Array.isArray(f.runs)) return f.runs.map((r) => r.text ?? "").join("");
  return "";
}

function mapVideoRenderer(vr: Record<string, unknown>): VideoResult | null {
  const videoId = typeof vr.videoId === "string" ? vr.videoId : "";
  const title = textOf(vr.title);
  if (!videoId || !title) return null;
  const channel = textOf(vr.ownerText) || textOf(vr.longBylineText);
  const thumbs = (vr.thumbnail as { thumbnails?: { url?: string }[] } | undefined)?.thumbnails ?? [];
  const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const duration = textOf(vr.lengthText);
  return { videoId, title, channel, thumbnail, duration };
}

export async function POST(request: Request) {
  let query: string;
  try {
    ({ query } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Enter a search term" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TabsApp/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `YouTube responded with ${res.status}` }, { status: 502 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Couldn't reach YouTube" }, { status: 502 });
  }

  const jsonStr = extractJsonAfter(html, "var ytInitialData");
  if (!jsonStr) {
    return NextResponse.json({ error: "Couldn't read YouTube's results this time" }, { status: 502 });
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "Couldn't read YouTube's results this time" }, { status: 502 });
  }

  const renderers: Record<string, unknown>[] = [];
  collectVideoRenderers(data, renderers);

  const seen = new Set<string>();
  const results: VideoResult[] = [];
  for (const vr of renderers) {
    const mapped = mapVideoRenderer(vr);
    if (!mapped || seen.has(mapped.videoId)) continue;
    seen.add(mapped.videoId);
    results.push(mapped);
    if (results.length >= 12) break;
  }

  return NextResponse.json({ results });
}
