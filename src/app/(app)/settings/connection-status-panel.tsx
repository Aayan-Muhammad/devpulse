"use client";

import { useEffect, useMemo, useState } from "react";
import { LAST_SYNC_AT_KEY, SYNC_UPDATED_EVENT } from "@/lib/preferences";

function formatRelativeSync(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

type ConnectionStatusPanelProps = {
  username: string;
  hasAccessToken: boolean;
  initialSyncedAt: string;
};

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="dp-surface dp-card-lift rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1.5 text-sm text-zinc-100">{value}</p>
    </div>
  );
}

export function ConnectionStatusPanel({
  username,
  hasAccessToken,
  initialSyncedAt,
}: ConnectionStatusPanelProps) {
  const [syncedAt, setSyncedAt] = useState(initialSyncedAt);

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_SYNC_AT_KEY);
    if (stored) {
      setSyncedAt(stored);
      return;
    }

    window.localStorage.setItem(LAST_SYNC_AT_KEY, initialSyncedAt);
  }, [initialSyncedAt]);

  useEffect(() => {
    const onSync = () => {
      const stored = window.localStorage.getItem(LAST_SYNC_AT_KEY);
      if (stored) {
        setSyncedAt(stored);
      }
    };

    window.addEventListener(SYNC_UPDATED_EVENT, onSync);
    return () => window.removeEventListener(SYNC_UPDATED_EVENT, onSync);
  }, []);

  const formattedAbsolute = useMemo(() => {
    const value = new Date(syncedAt);
    if (Number.isNaN(value.getTime())) {
      return "Unknown";
    }

    return value.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [syncedAt]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card label="Session" value="Authenticated" />
      <Card label="Connected account" value={`@${username}`} />
      <Card label="GitHub token" value={hasAccessToken ? "Available" : "Missing"} />
      <Card
        label="Last sync"
        value={`${formatRelativeSync(syncedAt)}${formattedAbsolute !== "Unknown" ? ` (${formattedAbsolute})` : ""}`}
      />
    </div>
  );
}