import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { CategoryService, ProductService, StoreSettingsService } from "@/services";
import { productWhatsappMessage, whatsappHref } from "@/lib/links";
import styles from "./product.module.css";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// The catalogue is enumerated by generateStaticParams, so any slug outside it
// does not exist. Allowing dynamic params here made unknown slugs render the
// not-found UI with a 200 status (a soft 404) cached for a year; false makes
// the router return a real 404 before the page renders.
export const dynamicParams = false;

export async function generateStaticParams() {
  const products = await ProductService.getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

async function getProduct(slug: string) {
  return ProductService.getProductBySlug(slug);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product | Fashion Factory Nepal" };

  const description = product.description ?? `Ask Fashion Factory Nepal about ${product.name}.`;
  const image = product.images[0]?.src;

  return {
    title: `${product.name} | Fashion Factory Nepal`,
    description,
    // Relative canonical resolves against metadataBase (NEXT_PUBLIC_SITE_URL).
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | Fashion Factory Nepal`,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      ...(image ? { images: [{ url: image, alt: product.images[0]?.alt ?? product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = await CategoryService.getCategory(product.categoryId);
  const store = await StoreSettingsService.getStoreSettings();
  const whatsappUrl = whatsappHref(store.whatsappNumber, productWhatsappMessage(product.name));

  // Same category first; top up from the rest of the catalogue so a category
  // with only one product still offers somewhere to go next.
  const sameCategory = (await ProductService.getProductsByCategory(product.categoryId))
    .filter((candidate) => candidate.id !== product.id);
  const others = (await ProductService.getProducts())
    .filter((candidate) => candidate.id !== product.id && candidate.categoryId !== product.categoryId);
  const related = [...sameCategory, ...others].slice(0, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productUrl = siteUrl ? `${siteUrl}/products/${product.slug}` : undefined;

  // Product schema without an Offer: this store publishes no prices and has no
  // checkout, so claiming price/availability would be false structured data.
  // Google accepts a priceless Product; a fabricated Offer risks a manual action.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images[0]?.src ? { image: product.images.map((i) => i.src) } : {}),
    ...(category ? { category: category.name } : {}),
    ...(productUrl ? { url: productUrl } : {}),
    brand: { "@type": "Brand", name: store.name },
    ...(product.colors?.length ? { color: product.colors.join(", ") } : {}),
    ...(product.sizes?.length ? { size: product.sizes } : {}),
  };

  const breadcrumbSchema = siteUrl
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Collection", item: `${siteUrl}/collection` },
          ...(category
            ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${siteUrl}/collection#${category.slug}` }]
            : []),
          { "@type": "ListItem", position: category ? 4 : 3, name: product.name, item: productUrl },
        ],
      }
    : null;

  return (
    <main id="main" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {breadcrumbSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      )}
      <Navbar tone="light" />
      <div className="container">
        <Link href="/collection" className={styles.back}><ArrowLeft size={16} /> Back to collection</Link>

        <div className={styles.detail}>
          <div className={styles.gallery}>
            {product.images.map((image) => (
              <figure key={image.id} className={styles.image}>
                <img src={image.src} alt={image.alt} />
              </figure>
            ))}
          </div>

          <aside className={styles.info}>
            <p className="eyebrow">{category?.name ?? "Fashion"}</p>
            <h1 className="serif">{product.name}</h1>
            {product.description && <p className={styles.description}>{product.description}</p>}
            {product.price !== undefined && <p className={styles.price}>{product.currency ?? "NPR"} {product.price.toLocaleString()}</p>}

            {product.sizes?.length ? (
              <div className={styles.group}>
                <span className={styles.label}>Sizes</span>
                <div className={styles.values}>{product.sizes.map((size) => <span key={size}>{size}</span>)}</div>
              </div>
            ) : null}

            {product.colors?.length ? (
              <div className={styles.group}>
                <span className={styles.label}>Colors</span>
                <div className={styles.values}>{product.colors.map((color) => <span key={color}>{color}</span>)}</div>
              </div>
            ) : null}

            <div className={styles.availability}>
              <span>{product.available === true ? "Availability confirmed by the store" : "Ask the store about current availability"}</span>
            </div>

            <div className={styles.actions}>
              <a className="btn btn-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Ask for Availability <ArrowUpRight size={16} /></a>
              <Link className="btn btn-light" href="/#visit-us"><MapPin size={16} /> Visit Store</Link>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-heading">
            <div className={styles.relatedHead}>
              <h2 id="related-heading" className="serif">
                {sameCategory.length > 0 && category ? `More in ${category.name}` : "More from the collection"}
              </h2>
              <Link className={styles.relatedLink} href="/collection">
                View the collection <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <Link className={styles.relatedCard} key={item.id} href={`/products/${item.slug}`}>
                  <figure>
                    <img src={item.images[0]?.src} alt={item.images[0]?.alt ?? item.name} loading="lazy" />
                  </figure>
                  <p>{item.name}</p>
                  <span>{item.categoryId === product.categoryId ? category?.name : "Collection"}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
      <MobileActionBar />
    </main>
  );
}
