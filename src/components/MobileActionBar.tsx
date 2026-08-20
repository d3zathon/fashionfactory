"use client";

import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useStoreSettings } from "@/hooks";

export function MobileActionBar() {
  const { data: store } = useStoreSettings();
  const whatsapp = store?.whatsappNumber ? `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent("Hi Fashion Factory, I found you through your website and would like to know more about your collection.")}` : "#";

  return (
    <div className="mobile-actions" aria-label="Quick contact actions">
      <a href={store?.phone ? `tel:${store.phone}` : undefined}><Phone size={17} />Call</a>
      <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} />WhatsApp</a>
      <a href={store?.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={17} />Directions</a>
    </div>
  );
}
