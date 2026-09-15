"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  downloadBackupFromDrive,
  isDriveBackupConfigured,
  requestAccessToken,
  uploadBackupToDrive,
} from "@/lib/googleDrive";

export default function SettingsPage() {
  const { songs, playlists, exportBackup, importBackup } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const driveConfigured = isDriveBackupConfigured();

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExportFile = async () => {
    const payload = await exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guitar-tabs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importBackup(payload);
      flash("Backup restored.");
    } catch {
      flash("That file doesn't look like a valid backup.");
    } finally {
      setBusy(false);
    }
  };

  const handleDriveBackup = async () => {
    setBusy(true);
    try {
      const token = await requestAccessToken();
      const payload = await exportBackup();
      await uploadBackupToDrive(token, JSON.stringify(payload));
      flash("Backed up to Google Drive.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Backup to Google Drive failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDriveRestore = async () => {
    setBusy(true);
    try {
      const token = await requestAccessToken();
      const text = await downloadBackupFromDrive(token);
      await importBackup(JSON.parse(text));
      flash("Restored from Google Drive.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Restore from Google Drive failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/95 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 space-y-6 px-4 py-4">
        <section>
          <p className="text-sm text-neutral-400">
            {songs.length} songs · {playlists.length} playlists, stored on this device.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Backup file
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportFile}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium"
            >
              Export to file
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Import from file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Google Drive
          </h2>
          {driveConfigured ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDriveBackup}
                disabled={busy}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
              >
                Back up to Drive
              </button>
              <button
                onClick={handleDriveRestore}
                disabled={busy}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Restore from Drive
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Not connected. Set <code className="text-neutral-400">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
              (a Google Cloud OAuth Web Client ID with your app&apos;s origin authorized) to enable
              one-tap Drive backup. Until then, use the file export/import above — it&apos;s the
              same data.
            </p>
          )}
        </section>

        {message && (
          <div className="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-neutral-200">{message}</div>
        )}
      </div>
    </div>
  );
}
