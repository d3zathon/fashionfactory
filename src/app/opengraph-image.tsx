import { ImageResponse } from "next/og";
import { StoreSettingsService } from "@/services";
import { getStoreProfile } from "@/providers/static";
import { wordmarkTiers } from "@/components/Wordmark";

// Next.js picks this up by filename and emits the og:image / twitter:image tags
// automatically. Generated rather than a committed JPG so it stays in sync with
// the store settings and needs no binary asset in the repo.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const built = getStoreProfile();
export const alt = built.tagline ? `${built.name} — ${built.tagline}` : built.name;

export default async function OpengraphImage() {
  const store = await StoreSettingsService.getStoreSettings();
  const theme = store.branding ?? {};
  const social = store.instagramHandle ?? store.tiktokHandle ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: theme.paper ?? "#f5f2ec",
          color: theme.ink ?? "#171614",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "#6d6962" }}>
            {store.locationLabel}
          </div>
          <div style={{ fontSize: 130, fontFamily: "serif", letterSpacing: -4, lineHeight: 1.02, marginTop: 28 }}>
            {store.tagline ?? store.name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30, color: "#6d6962" }}>
            <span style={{ color: theme.ink ?? "#171614", fontWeight: 700, letterSpacing: 2 }}>
              {wordmarkTiers(store).join(" ")}
            </span>
            <span style={{ marginTop: 10 }}>{store.openingHours}</span>
          </div>
          {social && (
            <div style={{ display: "flex", background: theme.accent ?? "#8b3f35", color: "#fffdf9", padding: "18px 30px", fontSize: 28 }}>
              {social}
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
