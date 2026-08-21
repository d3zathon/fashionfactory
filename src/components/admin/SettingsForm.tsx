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

// These values drive every contact CTA on the public site (tel:, wa.me, Maps),
// so a typo here silently breaks conversions. Validate before saving.
function validate(s: AdminStoreSettings): string | null {
  if (!s.name.trim()) return "Store name is required.";
  if (!/^\+?[\d\s().-]{7,}$/.test(s.phone)) return "Phone doesn't look like a dialable number.";
  if (!/^\d{6,15}$/.test(s.whatsappNumber)) return "WhatsApp number must be digits only, including country code (e.g. 9779840260456) — no +, spaces, or dashes.";
  if (!/^https:\/\/(www\.)?instagram\.com\//.test(s.instagramUrl)) return "Instagram URL must start with https://instagram.com/";
  if (!s.openingHours.trim()) return "Opening hours are required.";
  return null;
}

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
        <p className="admin-error" role="alert">{error ?? "No store settings row found. Re-run supabase/schema.sql."}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-title">Store settings</h1></div>
      <p className="admin-muted">
        These drive the Call, WhatsApp, Instagram and Directions links across the site.
        Changes go live after you Publish.
      </p>

      <form className="admin-form" onSubmit={handleSave}>
        <label className="admin-field"><span>Store name</span>
          <input value={settings.name} onChange={(e) => field("name", e.target.value)} required />
        </label>
        <label className="admin-field"><span>Location label</span>
          <input value={settings.locationLabel} onChange={(e) => field("locationLabel", e.target.value)} />
        </label>
        <label className="admin-field"><span>Phone (as dialled)</span>
          <input value={settings.phone} onChange={(e) => field("phone", e.target.value)} inputMode="tel" />
        </label>
        <label className="admin-field"><span>WhatsApp number (digits only, with country code)</span>
          <input value={settings.whatsappNumber} onChange={(e) => field("whatsappNumber", e.target.value)} inputMode="numeric" />
        </label>
        <label className="admin-field"><span>Instagram handle</span>
          <input value={settings.instagramHandle} onChange={(e) => field("instagramHandle", e.target.value)} />
        </label>
        <label className="admin-field"><span>Instagram URL</span>
          <input value={settings.instagramUrl} onChange={(e) => field("instagramUrl", e.target.value)} type="url" />
        </label>
        <label className="admin-field"><span>Opening hours</span>
          <input value={settings.openingHours} onChange={(e) => field("openingHours", e.target.value)} />
        </label>

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
