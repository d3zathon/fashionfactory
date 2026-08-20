import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { CategoryService, ProductService, StoreSettingsService } from "@/services";
import styles from "./product.module.css";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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
  const message = `Hi Fashion Factory, I would like to ask about ${product.name}. Is it currently available?`;
  const whatsappUrl = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <main className={styles.page}>
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
            {product.sizes?.length ? <div className={styles.group}><span className={styles.label}>Sizes</span><div className={styles.values}>{product.sizes.map((size) => <span key={size}>{size}</span>)}</div></div> : null}
            {product.colors?.length ? <div className={styles.group}><span className={styles.label}>Colors</span><div className={styles.values}>{product.colors.map((color) => <span key={color}>{color}</span>)}</div></div> : null}
            <div className={styles.availability}><span>{product.available === true ? "Availability confirmed by the store" : "Ask the store about current availability"}</span></div>
            <div className={styles.actions}>
              <a className="btn btn-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Ask for Availability <ArrowUpRight size={16} /></a>
              <a className="btn btn-light" href={store.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> Visit Store</a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
