"use client";

import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useStoreSettings } from "@/hooks";
import { GENERAL_WHATSAPP_MESSAGE, telHref, whatsappHref } from "@/lib/links";

export function MobileActionBar() {
  const { data: store } = useStoreSettings();
  const whatsapp = whatsappHref(store?.whatsappNumber, GENERAL_WHATSAPP_MESSAGE);

  return (
    <div className="mobile-actions" aria-label="Quick contact actions">
      <a href={telHref(store?.phone)}><Phone size={17} />Call</a>
      <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} />WhatsApp</a>
      <a href={store?.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={17} />Directions</a>
    </div>
  );
}
