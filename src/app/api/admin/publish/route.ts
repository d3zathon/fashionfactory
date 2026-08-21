import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST() {
  const githubToken = process.env.GITHUB_PUBLISH_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE ?? "publish.yml";
  // No silent default: publishing to the wrong branch looks like success while
  // leaving the deployed site unchanged, so require this to be set explicitly.
  const ref = process.env.GITHUB_PUBLISH_REF;

  // Authorization, not just authentication — membership in admin_users is
  // re-checked here server-side, independent of middleware and of any client state.
  const identity = await requireAdmin();
  if (!identity) {
    return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
  }

  if (!githubToken || !githubRepo || !ref) {
    return NextResponse.json({ success: false, error: "Publish pipeline is not configured on this host yet." }, { status: 503 });
  }

  const response = await fetch(`https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref }),
  });

  if (!response.ok) {
    return NextResponse.json({ success: false, error: "Unable to trigger the publish workflow." }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
