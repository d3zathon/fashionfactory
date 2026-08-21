import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const githubToken = process.env.GITHUB_PUBLISH_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE ?? "publish.yml";
  const ref = process.env.GITHUB_PUBLISH_REF ?? "main";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ success: false, error: "Supabase is not configured on this host yet." }, { status: 503 });
  }
  if (!githubToken || !githubRepo) {
    return NextResponse.json({ success: false, error: "Publish pipeline is not configured on this host yet." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
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
