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
  const [queued, setQueued] = useState<{ runsUrl?: string } | null>(null);

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
      setQueued({ runsUrl: typeof result.runsUrl === "string" ? result.runsUrl : undefined });
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
        {loading ? "Starting publish…" : "Publish to site"}
      </button>
      <div className="admin-publish-copy">
        <span className={dirty ? "admin-publish-status admin-dirty" : "admin-publish-status"}>
          {dirty ? "Unpublished changes" : "Live site is up to date"}
        </span>
        <span className="admin-muted admin-publish-sub">
          {publishedAt ? `Last published ${publishedAt.toLocaleString()}` : "Never published"}
        </span>
      </div>

      {/* Publishing is not a save. It starts a build, and the shop owner needs
          to know that before they refresh the storefront and think it failed. */}
      {queued ? (
        <div className="admin-publish-note admin-success" role="status">
          <strong>Publish started.</strong> This does not update the website directly — it starts a
          GitHub Actions run that rebuilds the site data and redeploys. The live site usually catches
          up within a few minutes, and this page will keep saying &ldquo;unpublished changes&rdquo;
          until it does.
          {queued.runsUrl && (
            <>
              {" "}
              <a href={queued.runsUrl} target="_blank" rel="noreferrer">Watch the run on GitHub</a>.
            </>
          )}
        </div>
      ) : (
        <span className="admin-muted admin-publish-sub admin-publish-note">
          Publishing rebuilds and redeploys the site; changes appear a few minutes later, not instantly.
        </span>
      )}

      {error && (
        <div className="admin-publish-note admin-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
