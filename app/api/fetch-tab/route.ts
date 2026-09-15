import { NextResponse } from "next/server";
import { decodeHtmlEntities } from "@/lib/htmlEntities";
import { cleanFetchedText } from "@/lib/textCleanup";

export const runtime = "nodejs";

// Best-effort fetch-and-extract for pasting a tab site URL. Not a scraper/crawler:
// it fetches exactly the one page the user gave us, the same page they could open
// themselves, and tries to pull out the readable tab text. Anything it can't
// confidently parse is handed back as raw text for the paste-import flow.

function isPrivateHost(hostname: string) {
  return (
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  );
}

function extractUltimateGuitar(html: string): { title?: string; artist?: string; key?: string; capo?: number; content?: string } | null {
  const match = html.match(/class="js-store"\s+data-content="([^"]+)"/);
  if (!match) return null;
  try {
    const json = JSON.parse(decodeHtmlEntities(match[1]));
    const data = json?.store?.page?.data;
    const tab = data?.tab;
    const content: string | undefined = data?.tab_view?.wiki_tab?.content;
    if (!content) return null;
    // The JSON itself decoded cleanly, but entities can still be embedded inside
    // the string values (e.g. lyrics containing "&hellip;" or "&amp;") — decode again.
    return {
      title: tab?.song_name && decodeHtmlEntities(tab.song_name),
      artist: tab?.artist_name && decodeHtmlEntities(tab.artist_name),
      key: tab?.tonality_name && decodeHtmlEntities(tab.tonality_name),
      capo: data?.tab_view?.meta?.capo ?? undefined,
      content: decodeHtmlEntities(content),
    };
  } catch {
    return null;
  }
}

function stripHtmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
}

export async function POST(request: Request) {
  let url: string;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "That URL can't be fetched" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TabsApp/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Site responded with ${res.status}` }, { status: 502 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Couldn't reach that URL" }, { status: 502 });
  }

  if (parsed.hostname.includes("ultimate-guitar.com")) {
    const ug = extractUltimateGuitar(html);
    if (ug?.content) {
      return NextResponse.json({
        source: "ultimate-guitar",
        title: ug.title?.trim(),
        artist: ug.artist?.trim(),
        key: ug.key?.trim(),
        capo: ug.capo,
        rawText: cleanFetchedText(ug.content),
      });
    }
  }

  // Generic fallback: strip tags and hand back plain text for the user to
  // trim/paste-import by hand. We deliberately don't try to guess structure here.
  return NextResponse.json({
    source: "generic",
    rawText: cleanFetchedText(stripHtmlToText(html)).slice(0, 20000),
  });
}
