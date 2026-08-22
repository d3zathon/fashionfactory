import { NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/supabase/server";
import { ACTIVE_STORE_SLUG } from "@/lib/activeStore";

// Distinct messages per denial reason: "Not authorized" for a missing migration
// sends the owner hunting through Supabase users, and "not configured" for a
// wrong account sends them editing environment variables. Both waste the same
// afternoon.
const DENIAL: Record<string, { status: number; error: string }> = {
  unconfigured: {
    status: 503,
    error: "Supabase is not configured on this host, so publishing cannot verify who you are.",
  },
  unauthenticated: {
    status: 401,
    error: "Your session has expired. Sign in again to publish.",
  },
  "not-store-admin": {
    status: 403,
    error: `Your account does not manage ${ACTIVE_STORE_SLUG}, so it cannot publish this store.`,
  },
  "check-unavailable": {
    status: 503,
    error:
      "Publish authorization is unavailable — the database is missing admin_manages_store(). Apply supabase/migrations/0003_tenant_hardening.sql.",
  },
};

export async function POST() {
  // Authorization for THIS store, not merely "is an admin somewhere". Checked
  // before anything else, and independently of middleware, so the endpoint is
  // safe even if the matcher ever changes. An admin of another store reaching
  // this route is refused here rather than triggering someone else's publish.
  const auth = await requireStoreAdmin();
  if (!auth.ok) {
    const denial = DENIAL[auth.reason];
    return NextResponse.json({ success: false, error: denial.error }, { status: denial.status });
  }

  const githubToken = process.env.GITHUB_PUBLISH_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE ?? "publish.yml";
  // No silent default: publishing to the wrong branch looks like success while
  // leaving the deployed site unchanged, so require this to be set explicitly.
  const ref = process.env.GITHUB_PUBLISH_REF;

  if (!githubToken || !githubRepo || !ref) {
    const missing = [
      !githubToken && "GITHUB_PUBLISH_TOKEN",
      !githubRepo && "GITHUB_REPO",
      !ref && "GITHUB_PUBLISH_REF",
    ].filter(Boolean);
    return NextResponse.json(
      { success: false, error: `Publishing is not configured on this host yet — missing ${missing.join(", ")}.` },
      { status: 503 }
    );
  }

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      // The store is named explicitly rather than left to the generator's
      // fallback (whatever src/data/store.json happens to hold on that ref).
      // With several stores publishing from one repository, that fallback is
      // how one store's Publish quietly regenerates another store's data.
      body: JSON.stringify({ ref, inputs: { store_slug: ACTIVE_STORE_SLUG } }),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not reach GitHub to start the publish. Check the host's network access." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    // GitHub's own message is the difference between a bad token, a missing
    // workflow file and a branch that does not exist — worth surfacing.
    const detail = await response.text().catch(() => "");
    let reason = "";
    try {
      reason = (JSON.parse(detail) as { message?: string }).message ?? "";
    } catch {
      reason = "";
    }
    const suffix =
      response.status === 401 || response.status === 403
        ? " Check that GITHUB_PUBLISH_TOKEN is valid and has Actions: write on this repository."
        : response.status === 404
          ? ` Check that GITHUB_REPO, ${workflowFile} and the branch ${ref} all exist.`
          : "";
    return NextResponse.json(
      { success: false, error: `GitHub refused the publish (${response.status}${reason ? `: ${reason}` : ""}).${suffix}` },
      { status: 502 }
    );
  }

  // Where the owner can watch it actually happen. Publishing is asynchronous —
  // without this the only feedback is a button that stops spinning.
  return NextResponse.json({
    success: true,
    store: ACTIVE_STORE_SLUG,
    runsUrl: `https://github.com/${githubRepo}/actions/workflows/${workflowFile}`,
  });
}
