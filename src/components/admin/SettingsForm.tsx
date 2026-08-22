"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStoreSettings,
  listLocations,
  updateLocation,
  updateStoreSettings,
  type AdminLocation,
  type AdminStoreSettings,
} from "@/providers/live/supabaseStore";
import type { StoreFeatures } from "@/models";

// These values drive every contact CTA on the public site (tel:, wa.me, Maps),
// so a typo here silently breaks conversions. Validate before saving.
function validate(s: AdminStoreSettings): string | null {
  if (!s.name.trim()) return "Store name is required.";
  if (!/^\+?[\d\s().-]{7,}$/.test(s.phone)) return "Phone doesn't look like a dialable number.";
  if (!/^\d{6,15}$/.test(s.whatsappNumber)) return "WhatsApp number must be digits only, including country code (e.g. 9779840260456 for Nepal) — no +, spaces, or dashes.";
  if (s.instagramUrl && !/^https:\/\/(www\.)?instagram\.com\//.test(s.instagramUrl)) return "Instagram URL must start with https://instagram.com/";
  if (s.tiktokUrl && !/^https:\/\/(www\.)?tiktok\.com\//.test(s.tiktokUrl)) return "TikTok URL must start with https://tiktok.com/";
  if (s.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return "That email address doesn't look right.";
  for (const [label, url] of [["Logo", s.logoUrl], ["Favicon", s.faviconUrl]] as const) {
    if (url && !/^https?:\/\//.test(url)) return `${label} URL must be a full https:// address.`;
  }
  if (!s.openingHours.trim()) return "Opening hours are required.";
  return null;
}

// Sections the storefront renders only when enabled. Unset counts as on, so a
// store that has never touched these keeps every section.
const FEATURE_LABELS: { key: keyof StoreFeatures; label: string }[] = [
  { key: "styleQuiz", label: "Style quiz" },
  { key: "instagramFeed", label: "Instagram feed" },
  { key: "testimonials", label: "Customer quotes" },
  { key: "faqs", label: "FAQs" },
  { key: "contactForm", label: "Contact form" },
  { key: "locations", label: "Branch list" },
];

export function SettingsForm() {
  const [settings, setSettings] = useState<AdminStoreSettings | null>(null);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([getStoreSettings(), listLocations()]);
      setSettings(s);
      setLocations(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function field<K extends keyof AdminStoreSettings>(key: K, value: AdminStoreSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  // Empty inputs are stored as NULL rather than "", so "not set" is one state in
  // the database instead of two.
  function optionalField(key: keyof AdminStoreSettings, value: string) {
    field(key, (value.trim() || null) as AdminStoreSettings[typeof key]);
  }

  function feature(key: keyof StoreFeatures, enabled: boolean) {
    setSettings((prev) => (prev ? { ...prev, features: { ...prev.features, [key]: enabled } } : prev));
    setSaved(false);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    const problem = validate(settings);
    if (problem) { setError(problem); return; }

    setSaving(true);
    setError(null);
    try {
      await updateStoreSettings(settings);
      for (const location of locations) {
        await updateLocation(location.id, {
          name: location.name,
          address: location.address,
          mapsUrl: location.mapsUrl,
          lat: location.lat,
          lng: location.lng,
          active: location.active,
        });
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-page"><p className="admin-muted" role="status">Loading settings…</p></div>;
  if (!settings) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Store settings</h1>
        <p className="admin-error" role="alert">{error ?? "No store row found. Apply the migrations in supabase/migrations."}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-title">Store settings</h1></div>
      <p className="admin-muted">
        These drive the Call, WhatsApp, Instagram, TikTok and Directions links across the site.
        Changes go live after you Publish.
      </p>

      <form className="admin-form" onSubmit={handleSave}>
        <h2 className="admin-section-title">Identity</h2>
        <label className="admin-field"><span>Store name</span>
          <input value={settings.name} onChange={(e) => field("name", e.target.value)} required />
        </label>
        <label className="admin-field"><span>Tagline (the hero headline)</span>
          <input value={settings.tagline ?? ""} onChange={(e) => optionalField("tagline", e.target.value)} />
        </label>
        <label className="admin-field"><span>Description</span>
          <textarea value={settings.description ?? ""} onChange={(e) => optionalField("description", e.target.value)} />
        </label>
        <label className="admin-field"><span>Location label</span>
          <input value={settings.locationLabel} onChange={(e) => field("locationLabel", e.target.value)} />
        </label>
        <label className="admin-field"><span>&ldquo;Visit us&rdquo; heading (a new line becomes a line break)</span>
          <textarea rows={2} value={settings.visitTitle ?? ""} onChange={(e) => optionalField("visitTitle", e.target.value)} />
        </label>
        <label className="admin-field"><span>&ldquo;Visit&rdquo; step, under How it works</span>
          <input value={settings.visitStepBody ?? ""} onChange={(e) => optionalField("visitStepBody", e.target.value)} />
        </label>
        <label className="admin-field"><span>Logo URL (optional)</span>
          <input value={settings.logoUrl ?? ""} onChange={(e) => optionalField("logoUrl", e.target.value)} type="url" />
        </label>
        <label className="admin-field"><span>Favicon URL (optional)</span>
          <input value={settings.faviconUrl ?? ""} onChange={(e) => optionalField("faviconUrl", e.target.value)} type="url" />
        </label>

        <h2 className="admin-section-title">Contact</h2>
        <label className="admin-field"><span>Phone (as dialled)</span>
          <input value={settings.phone} onChange={(e) => field("phone", e.target.value)} inputMode="tel" />
        </label>
        <label className="admin-field"><span>WhatsApp number (digits only, with country code)</span>
          <input value={settings.whatsappNumber} onChange={(e) => field("whatsappNumber", e.target.value)} inputMode="numeric" />
        </label>
        <label className="admin-field"><span>Email (optional)</span>
          <input value={settings.email ?? ""} onChange={(e) => optionalField("email", e.target.value)} type="email" />
        </label>
        <label className="admin-field"><span>Opening hours</span>
          <input value={settings.openingHours} onChange={(e) => field("openingHours", e.target.value)} />
        </label>

        <h2 className="admin-section-title">Social</h2>
        <label className="admin-field"><span>Instagram handle</span>
          <input value={settings.instagramHandle ?? ""} onChange={(e) => optionalField("instagramHandle", e.target.value)} />
        </label>
        <label className="admin-field"><span>Instagram URL</span>
          <input value={settings.instagramUrl ?? ""} onChange={(e) => optionalField("instagramUrl", e.target.value)} type="url" />
        </label>
        <label className="admin-field"><span>TikTok handle (shown exactly as typed)</span>
          <input value={settings.tiktokHandle ?? ""} onChange={(e) => optionalField("tiktokHandle", e.target.value)} />
        </label>
        <label className="admin-field"><span>TikTok profile URL</span>
          <input value={settings.tiktokUrl ?? ""} onChange={(e) => optionalField("tiktokUrl", e.target.value)} type="url" />
        </label>
        <label className="admin-field"><span>Facebook URL (optional)</span>
          <input value={settings.facebookUrl ?? ""} onChange={(e) => optionalField("facebookUrl", e.target.value)} type="url" />
        </label>

        <h2 className="admin-section-title">Search</h2>
        <label className="admin-field"><span>Browser tab / search result title</span>
          <input
            value={settings.seo.title ?? ""}
            onChange={(e) => { field("seo", { ...settings.seo, title: e.target.value.trim() || undefined }); }}
          />
        </label>
        <label className="admin-field"><span>Search result description</span>
          <textarea
            value={settings.seo.description ?? ""}
            onChange={(e) => { field("seo", { ...settings.seo, description: e.target.value.trim() || undefined }); }}
          />
        </label>

        <h2 className="admin-section-title">Sections</h2>
        <p className="admin-muted">Turn off a section to hide it from the storefront.</p>
        {FEATURE_LABELS.map(({ key, label }) => (
          <label className="admin-toggle" key={key}>
            <input
              type="checkbox"
              checked={settings.features[key] !== false}
              onChange={(e) => feature(key, e.target.checked)}
            />
            {label}
          </label>
        ))}

        <h2 className="admin-section-title">Branches</h2>
        {locations.length === 0 && <p className="admin-muted">No branches yet.</p>}
        {locations.map((location, index) => (
          <fieldset className="admin-fieldset" key={location.id}>
            <legend>{location.name || `Branch ${index + 1}`}</legend>
            <label className="admin-field"><span>Name</span>
              <input value={location.name} onChange={(e) => {
                const v = e.target.value;
                setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, name: v } : l)));
                setSaved(false);
              }} />
            </label>
            <label className="admin-field"><span>Address</span>
              <input value={location.address} onChange={(e) => {
                const v = e.target.value;
                setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, address: v } : l)));
                setSaved(false);
              }} />
            </label>
            <label className="admin-field"><span>Google Maps URL</span>
              <input value={location.mapsUrl} type="url" onChange={(e) => {
                const v = e.target.value;
                setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, mapsUrl: v } : l)));
                setSaved(false);
              }} />
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={location.active} onChange={(e) => {
                const v = e.target.checked;
                setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, active: v } : l)));
                setSaved(false);
              }} />
              Show this branch on the site
            </label>
            <p className="admin-muted admin-coords">Map pin: {location.lat}, {location.lng}</p>
          </fieldset>
        ))}

        {error && <p className="admin-error" role="alert">{error}</p>}
        {saved && <p className="admin-success" role="status">Saved. Publish to push these to the live site.</p>}

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-dark" type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        </div>
      </form>
    </div>
  );
}
