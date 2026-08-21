"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const STORAGE_KEY = "ff-admin-last-published-at";

// Tracked per-browser in localStorage rather than in the database — this is a
// single-owner tool, so "did I publish since my last edit, on this device" is
// enough; it doesn't need to sync across devices.
export function usePublishState(latestUpdatedAt: string | null) {
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLastPublishedAt(localStorage.getItem(STORAGE_KEY));
    } catch {
      setLastPublishedAt(null);
    }
  }, []);

  const markPublished = useCallback(() => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, now);
    } catch {
      // Storage unavailable (private browsing, etc.) — publish still succeeded.
    }
    setLastPublishedAt(now);
  }, []);

  const dirty = Boolean(latestUpdatedAt && (!lastPublishedAt || new Date(latestUpdatedAt) > new Date(lastPublishedAt)));

  return { lastPublishedAt, dirty, markPublished };
}

export function PublishBar({ latestUpdatedAt }: { latestUpdatedAt: string | null }) {
  const { lastPublishedAt, dirty, markPublished } = usePublishState(latestUpdatedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const { data } = client ? await client.auth.getSession() : { data: { session: null } };
      const token = data.session?.access_token;
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "Publish failed.");
      markPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-publish-row">
      <button className="admin-btn admin-btn-dark" type="button" onClick={handlePublish} disabled={loading}>
        {loading ? "Publishing…" : "Publish to site"}
      </button>
      <span className={dirty ? "admin-publish-status admin-dirty" : "admin-publish-status"}>
        {dirty ? "Unpublished changes" : "Up to date"}
        {lastPublishedAt ? ` · Last published ${new Date(lastPublishedAt).toLocaleString()}` : ""}
      </span>
      {error && <span className="admin-error">{error}</span>}
    </div>
  );
}
