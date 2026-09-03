/**
 * Whether this host has usable Supabase config, asked in one place.
 *
 * Both createBrowserClient and createServerClient validate the URL and throw
 * *synchronously* on anything that is not http(s), so testing only for a
 * non-empty string is not enough: a malformed NEXT_PUBLIC_SUPABASE_URL sails
 * past that check and throws inside the client, server and edge runtimes
 * alike. Treat it as "not configured" instead, which every caller already
 * knows how to render.
 *
 * These values are inlined at build time, so what matters is what the *host*
 * had set when the deployment was built, not what is in a local .env.local.
 */

/** Is this a URL the Supabase clients will accept? They throw on anything else. */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && isHttpUrl(url));
}
