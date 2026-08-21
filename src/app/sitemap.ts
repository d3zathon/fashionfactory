import type { MetadataRoute } from "next";
import { ProductService } from "@/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return [];

  // Product pages were previously absent from the sitemap entirely, leaving the
  // whole catalogue to be found by crawling alone.
  const products = await ProductService.getProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/collection`, changeFrequency: "weekly", priority: 0.9 },
    ...productEntries,
  ];
}
