import type { NextConfig } from "next";

/**
 * Hosts the storefront is allowed to load images from.
 *
 * The site uses plain <img> today, so this only binds if a component switches
 * to next/image — but it has to be right before that happens, not after: an
 * unlisted host makes next/image throw at request time rather than degrade.
 * The Supabase hostname is derived from the configured project so it stays
 * correct per environment instead of being pinned to one project ref.
 */
function imageHosts() {
  const hosts = [{ protocol: "https" as const, hostname: "images.unsplash.com" }];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      hosts.push({ protocol: "https" as const, hostname: new URL(supabaseUrl).hostname });
    } catch {
      // A malformed URL is reported by the app's own "not configured" state;
      // failing the build here would be a worse error message.
    }
  }
  return hosts;
}

/**
 * Headers that are cheap, static and safe for every response.
 *
 * Deliberately no Content-Security-Policy: GA4 and the Meta Pixel are injected
 * as inline scripts, so a CSP worth having needs per-request nonces, and a
 * loose one (`unsafe-inline`) would be security theatre.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site is never meant to be framed; this also blocks clickjacking of /admin.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: { remotePatterns: imageHosts() },

  // Nothing gains from advertising the framework version.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The admin panel renders per-session data and must never be cached by a
      // CDN or an intermediary, even though its pages are already dynamic.
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
