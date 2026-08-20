"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useCategories, useProducts } from "@/hooks";
import { AnalyticsService } from "@/services";

export default function CollectionPage() {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  return <main className="collection-page"><div className="container collection-top"><Link href="/" className="back"><ArrowLeft size={16}/> Home</Link><p className="eyebrow">Fashion Factory Nepal</p><h1 className="serif">The Collection.</h1><p className="muted">Browse the current development catalogue. Product inventory and pricing can be connected to the backend later.</p></div><div className="container filter-row">{categories.map(category=><a key={category.id} href={`#${category.slug}`}>{category.name}</a>)}</div><div className="container collection-list">{categories.map(category=><section id={category.slug} key={category.id}><div className="section-head"><div><p className="eyebrow">Collection</p><h2 className="section-title">{category.name}</h2></div></div><div className="collection-products">{products.filter(p=>p.categoryId===category.id).map(product=><article key={product.id}><img src={product.images[0].src} alt={product.images[0].alt}/><div><p>{product.name}</p><span>{product.description}</span><a href={`https://wa.me/9779864831830?text=${encodeURIComponent(`Hi Fashion Factory, I would like to ask about ${product.name}. Is it currently available?`)}`} target="_blank" rel="noreferrer" onClick={()=>AnalyticsService.track("product_click")}>Ask for Availability <ArrowUpRight size={14}/></a></div></article>)}</div></section>)}</div></main>;
}
