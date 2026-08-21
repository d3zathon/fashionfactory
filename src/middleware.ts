import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";

// Server-side gate for the admin area. This runs before any admin page or
// admin API route renders, so protection never depends on client-side code.
// RLS is still the last line of defense; this stops unauthorized requests earlier
// and keeps admin URLs from rendering at all.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet: let the page render its own "not configured" state.
  if (!url || !anonKey) return response;

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

  // Signed in, but membership in admin_users is what grants access.
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    if (isApiRoute) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
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
