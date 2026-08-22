"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category, Product } from "@/models";
import { AnalyticsService } from "@/services";

/**
 * Categories as an archive index rather than a photo grid: a typographic list
 * where hovering a name swaps the preview plate beside it. On tablet and below
 * the plate is hidden by CSS and the list stands alone, which reads better on a
 * phone than five cropped tiles.
 *
 * All preview images are rendered and cross-faded via opacity, so switching
 * never triggers a network request mid-interaction.
 */
export function CategoryIndex({
  categories,
  products,
  fallbackImage,
}: {
  categories: Category[];
  products: Product[];
  fallbackImage: string;
}) {
  const [active, setActive] = useState(0);

  const imageFor = (category: Category, i: number) =>
    category.image?.src ??
    products.find((product) => product.categoryId === category.id)?.images[0]?.src ??
    products[i % Math.max(products.length, 1)]?.images[0]?.src ??
    fallbackImage;

  return (
    <div className="cat-index">
      <div className="cat-list">
        {categories.map((category, i) => (
          <Link
            key={category.id}
            href={`/collection?c=${category.slug}`}
            className="cat-row"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => AnalyticsService.track("collection_click", { category: category.id })}
          >
            <span className="idx">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="cat-row-name">{category.name}</span>
              {category.description && <span className="cat-row-desc">{category.description}</span>}
            </span>
            <ArrowUpRight className="cat-row-arrow" size={22} aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="cat-preview" aria-hidden="true">
        {categories.map((category, i) => (
          <img
            key={category.id}
            src={imageFor(category, i)}
            alt=""
            loading="lazy"
            className={i === active ? "is-active" : ""}
          />
        ))}
        <span className="cat-preview-label">{categories[active]?.name}</span>
      </div>
    </div>
  );
}
