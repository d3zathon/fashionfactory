import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_STORE_SLUG } from "@/lib/activeStore";

const LOGIN_PATH = "/admin/login";

// Server-side gate for the admin area. This runs before any admin page or
// admin API route renders, so protection never depends on client-side code.
// RLS is still the last line of defense; this stops unauthorized requests earlier
// and keeps admin URLs from rendering at all.
export async function middleware(request: NextRequest) {
  try {
    return await authorize(request);
  } catch {
    // Nothing below is allowed to take the whole admin area down. An uncaught
    // throw here is not a 500 on one page, it is MIDDLEWARE_INVOCATION_FAILED
    // for every matched request. Fail closed: the pages behind this cannot be
    // trusted to gate themselves, so an unanswerable check means "no".
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { success: false, error: "Authorization is temporarily unavailable." },
        { status: 503 }
      );
    }
    if (request.nextUrl.pathname === LOGIN_PATH) return NextResponse.next({ request });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

async function authorize(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet: let the page render its own "not configured" state.
  // A malformed URL counts as not configured rather than as a crash:
  // createServerClient throws synchronously on anything that is not a valid
  // http(s) URL, so checking only for a non-empty string is not enough.
  if (!url || !anonKey || !isHttpUrl(url)) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() revalidates against Supabase; getSession() would trust the cookie.
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === LOGIN_PATH;
  const isApiRoute = pathname.startsWith("/api/admin");

  if (!user) {
    if (isLoginRoute) return response;
    if (isApiRoute) {
      return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed in, but membership in admin_users is what grants access — and it
  // has to be membership for *this* deployment's store. An admin of another
  // store has no business in this one's panel: every query would come back
  // empty under RLS anyway, which reads as a broken page rather than a refusal.
  const { data: scopedRows, error: scopedError } = await supabase
    .from("admin_users")
    .select("user_id, store_id")
    .eq("user_id", user.id);

  // Selecting store_id on a project that has not run 0002 is an error, not an
  // empty result — falling straight through would lock the owner out of their
  // own panel. Fall back to the pre-tenancy question: are they an admin at all?
  const membership = scopedError
    ? await supabase.from("admin_users").select("user_id").eq("user_id", user.id)
    : { data: scopedRows, error: null };

  const isAdmin = Boolean(membership.data?.length);
  const manages = scopedError ? true : await managesActiveStore(supabase, scopedRows ?? null);

  if (!isAdmin || !manages) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: `This account does not manage ${ACTIVE_STORE_SLUG}.` },
        { status: 403 }
      );
    }
    if (isLoginRoute) return response;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set("denied", "1");
    return NextResponse.redirect(redirectUrl);
  }

  // Admin visiting the login page goes straight to the dashboard.
  if (isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

type AdminRow = { user_id: string; store_id: string | null };

/**
 * Does this admin manage the store this deployment serves?
 *
 * A row with store_id null is a platform admin and manages every store.
 *
 * Deliberately permissive when the question cannot be answered — a project that
 * has not run 0002 yet has no store_id column and no stores table, and there
 * every admin is by definition an admin of the only store there is. Failing
 * closed here would lock the owner out of their own panel for the window
 * between deploying the code and applying the migration, to protect against a
 * second store that does not exist yet. The publish route, whose blast radius
 * crosses tenants, fails closed instead.
 */
async function managesActiveStore(
  supabase: ReturnType<typeof createServerClient>,
  adminRows: AdminRow[] | null
): Promise<boolean> {
  if (!adminRows?.length) return false;
  if (adminRows.some((row) => row.store_id === null)) return true;

  const { data: store, error } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", ACTIVE_STORE_SLUG)
    .maybeSingle();

  if (error) return true; // stores table not there yet — see above.
  if (!store) return false;

  return adminRows.some((row) => row.store_id === store.id);
}

/** Is this a URL createServerClient will accept? It throws on anything else. */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
