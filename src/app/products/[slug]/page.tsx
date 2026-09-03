import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { CategoryService, ProductService, StoreSettingsService } from "@/services";
import { productWhatsappMessage, whatsappHref } from "@/lib/links";
import styles from "./product.module.css";
import { getStoreProfile } from "@/providers/static";

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
  const storeName = getStoreProfile().name;
  if (!product) return { title: `Product | ${storeName}` };

  const description = product.description ?? `Ask ${storeName} about ${product.name}.`;
  const image = product.images[0]?.src;

  return {
    title: `${product.name} | ${storeName}`,
    description,
    // Relative canonical resolves against metadataBase (NEXT_PUBLIC_SITE_URL).
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | ${storeName}`,
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

  // An Offer only when the shop has actually published a price. A physical shop
  // selling an item at a stated price is exactly what an Offer describes, so
  // this is true structured data — and it is what puts the price in Google's
  // results. Without a price there is no Offer at all rather than an empty or
  // zero one: an invented Offer is false, and false structured data risks a
  // manual action against the whole site.
  //
  // `availability` is set only where the store has confirmed it. Omitted is
  // honest for a shop with no stock system; asserting InStock on every product
  // would contradict the page's own "ask which sizes are in stock".
  const offer =
    product.price !== undefined
      ? {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency ?? "NPR",
          ...(productUrl ? { url: productUrl } : {}),
          ...(product.available === true ? { availability: "https://schema.org/InStock" } : {}),
          seller: { "@type": "Organization", name: store.name },
        }
      : null;

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
    ...(offer ? { offers: offer } : {}),
  };

  const breadcrumbSchema = siteUrl
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/collection` },
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
        {/* Visible breadcrumb mirroring the BreadcrumbList schema above. */}
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/collection">Shop</Link>
          {category && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/collection?c=${category.slug}`}>{category.name}</Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className={styles.detail}>
          <div className={styles.gallery}>
            {product.images.map((image) => (
              <figure key={image.id} className={styles.image}>
                <img src={image.src} alt={image.alt} />
              </figure>
            ))}
          </div>

          <aside className={styles.info}>
            <p className="eyebrow">{category?.name ?? store.name}</p>
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
              <span>{product.available === true ? "Availability confirmed by the store" : "Ask the store which sizes are in stock"}</span>
            </div>

            <div className={styles.actions}>
              <a className="btn btn-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Ask About This Item <ArrowUpRight size={16} /></a>
              <Link className="btn btn-light" href="/#visit-us"><MapPin size={16} /> Visit Store</Link>
            </div>

            {/* The terms belong next to the buy decision, not only in the
                footer. Same string as the footer and the FAQ — all three read
                the store profile. */}
            {store.returnsPolicy && (
              <div className={styles.policy}>
                <span className={styles.label}>Returns &amp; Exchanges</span>
                <p>{store.returnsPolicy}</p>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-heading">
            <div className={styles.relatedHead}>
              <h2 id="related-heading" className="serif">
                {sameCategory.length > 0 && category ? `More in ${category.name}` : "More from the shop"}
              </h2>
              <Link className={styles.relatedLink} href="/collection">
                View the shop <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <Link className={styles.relatedCard} key={item.id} href={`/products/${item.slug}`}>
                  <figure>
                    <img src={item.images[0]?.src} alt={item.images[0]?.alt ?? item.name} loading="lazy" />
                  </figure>
                  <p>{item.name}</p>
                  <span>{item.categoryId === product.categoryId ? category?.name : "The shop"}</span>
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
