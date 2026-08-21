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

  return {
    title: `${product.name} | Fashion Factory Nepal`,
    description: product.description ?? `Ask Fashion Factory Nepal about ${product.name}.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = await CategoryService.getCategory(product.categoryId);
  const store = await StoreSettingsService.getStoreSettings();
  const whatsappUrl = whatsappHref(store.whatsappNumber, productWhatsappMessage(product.name));

  return (
    <main className={styles.page}>
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
      </div>

      <Footer />
      <MobileActionBar />
    </main>
  );
}
