"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import publishedData from "@/data/products.json";

// Dirty state is derived from the committed products.json the live site actually
// serves, compared against the newest edit in the database — not a per-browser
// localStorage flag, which drifted between devices and lied after a republish.
export function PublishBar({ latestUpdatedAt }: { latestUpdatedAt: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  const publishedAt = publishedData.generatedAt ? new Date(publishedData.generatedAt) : null;
  const dirty = Boolean(latestUpdatedAt && publishedAt && new Date(latestUpdatedAt) > publishedAt);

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      // Session travels as an httpOnly cookie; no token is handled in JS.
      const response = await fetch("/api/admin/publish", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error ?? "Publish failed.");
      setQueued(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={dirty ? "admin-publish-row admin-publish-dirty" : "admin-publish-row"}>
      <button className="admin-btn admin-btn-dark" type="button" onClick={handlePublish} disabled={loading}>
        {loading ? "Publishing…" : "Publish to site"}
      </button>
      <div className="admin-publish-copy">
        <span className={dirty ? "admin-publish-status admin-dirty" : "admin-publish-status"}>
          {dirty ? "Unpublished changes" : "Live site is up to date"}
        </span>
        <span className="admin-muted admin-publish-sub">
          {publishedAt ? `Last published ${publishedAt.toLocaleString()}` : "Never published"}
        </span>
      </div>
      {queued && <span className="admin-success" role="status">Publish started — the site updates in a few minutes.</span>}
      {error && <span className="admin-error" role="alert">{error}</span>}
    </div>
  );
}
