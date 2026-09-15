// Minimal Google Drive backup: one JSON file, created via the drive.file scope
// (visible in the user's own Drive, not a hidden appData folder) so a backup is
// something they can actually find. Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be
// set to a Web-application OAuth Client ID from Google Cloud Console.

const BACKUP_FILENAME = "guitar-tabs-backup.json";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function isDriveBackupConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}

export async function requestAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google Drive isn't configured for this app.");
  await loadGsiScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error(resp.error ?? "Google sign-in failed"));
      },
    });
    client.requestAccessToken();
  });
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${BACKUP_FILENAME}' and trashed=false`
    )}&spaces=drive&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Couldn't search Google Drive");
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

export async function uploadBackupToDrive(accessToken: string, json: string): Promise<void> {
  const existingId = await findBackupFileId(accessToken);
  const metadata = { name: BACKUP_FILENAME, mimeType: "application/json" };
  const boundary = "tabsbackupboundary";
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n` +
    `--${boundary}--`;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error("Upload to Google Drive failed");
}

export async function downloadBackupFromDrive(accessToken: string): Promise<string> {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) throw new Error("No backup file found in Google Drive");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Couldn't download backup from Google Drive");
  return res.text();
}
