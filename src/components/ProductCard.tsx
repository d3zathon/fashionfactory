"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/models";
import { productWhatsappMessage, whatsappHref } from "@/lib/links";
import { AnalyticsService } from "@/services";

/**
 * A numbered archive entry. The whole card links to the product; the WhatsApp
 * CTA is a separate link layered on top (slides up on hover, always visible on
 * touch) so the primary conversion action is never more than one tap away.
 */
export function ProductCard({
  product,
  index,
  categoryName,
  whatsappNumber,
  priority = false,
}: {
  product: Product;
  index: number;
  categoryName?: string;
  whatsappNumber?: string;
  priority?: boolean;
}) {
  const image = product.images[0];
  const track = (event: string) => AnalyticsService.track(event, { product: product.id });

  return (
    <article className="card">
      <div className="card-media">
        <span className="card-idx">{String(index + 1).padStart(2, "0")}</span>
        <Link href={`/products/${product.slug}`} onClick={() => track("product_click")} aria-label={`View ${product.name}`}>
          {/* A product saved before its photo was uploaded has no image at all.
              Rendering <img> with an undefined src leaves an empty, sourceless
              element in the grid; this keeps the card's shape and stays a link.
              Decorative and aria-hidden on purpose — the Link above already
              names the product, so announcing this too would only repeat it. */}
          {image ? (
            <img
              src={image.src}
              alt={image.alt ?? product.name}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
          ) : (
            <span className="card-media-empty" aria-hidden="true">Photo coming soon</span>
          )}
        </Link>
        <a
          className="card-cta"
          href={whatsappHref(whatsappNumber, productWhatsappMessage(product.name))}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_click")}
        >
          Ask availability <ArrowUpRight size={13} />
        </a>
      </div>
      <div className="card-meta">
        <p className="card-name">
          <Link href={`/products/${product.slug}`} onClick={() => track("product_click")}>{product.name}</Link>
        </p>
        {categoryName && <span className="card-cat">{categoryName}</span>}
      </div>
    </article>
  );
}
