"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, Instagram, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { useCategories, useFAQs, useFeaturedProducts, useHomepageContent, useInstagram, useStoreSettings } from "@/hooks";
import { AnalyticsService } from "@/services";

const whatsapp = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: home } = useHomepageContent();
  const { data: store } = useStoreSettings();
  const { data: categories } = useCategories();
  const { data: products } = useFeaturedProducts();
  const { data: instagram } = useInstagram();
  const { data: faqs } = useFAQs();

  const track = (event: string) => AnalyticsService.track(event);
  const wa = store?.whatsappNumber ? whatsapp(store.whatsappNumber, "Hi Fashion Factory, I found you through your website and would like to know more about your collection.") : "#";

  return <main>
    <header className="nav"><div className="container nav-inner">
      <a href="#top" className="brand"><span>FASHION</span><strong>FACTORY</strong><small>NEPAL</small></a>
      <nav className={menuOpen ? "nav-links open" : "nav-links"}>{["Collection","About","Instagram","Visit Us","Contact"].map((item)=><a key={item} href={`#${item.toLowerCase().replace(" ","-")}`} onClick={()=>setMenuOpen(false)}>{item}</a>)}<a className="nav-cta" href="#visit-us">Visit Store <ArrowUpRight size={16}/></a></nav>
      <button className="menu" aria-label="Toggle menu" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button>
    </div></header>

    <section id="top" className="hero"><div className="hero-image"><div className="hero-overlay"/></div><div className="container hero-content"><p className="eyebrow">{home?.eyebrow}</p><h1 className="serif">{home?.headline}</h1><p>{home?.description}</p><div className="hero-actions"><a className="btn btn-dark" href="#collection" onClick={()=>track("collection_click")}>Explore Collection <ArrowUpRight size={17}/></a><a className="btn btn-light" href="#visit-us">Visit Store</a></div></div></section>

    <section className="quick"><div className="container quick-grid">
      <a href={`tel:${store?.phone}`} onClick={()=>track("phone_click")}><Phone size={19}/><span>Call</span></a>
      <a href={wa} target="_blank" rel="noreferrer" onClick={()=>track("whatsapp_click")}><MessageCircle size={19}/><span>WhatsApp</span></a>
      <a href={store?.mapsUrl} target="_blank" rel="noreferrer" onClick={()=>track("maps_click")}><MapPin size={19}/><span>Directions</span></a>
      <a href={store?.instagramUrl} target="_blank" rel="noreferrer" onClick={()=>track("instagram_click")}><Instagram size={19}/><span>Instagram</span></a>
    </div></section>

    <section id="about" className="section intro"><div className="container intro-grid"><p className="eyebrow">Fashion Factory Nepal</p><div><h2 className="section-title">{home?.introductionTitle}</h2><p className="intro-copy">{home?.introductionBody}</p></div></div></section>

    <section id="collection" className="section collection"><div className="container"><div className="section-head"><div><p className="eyebrow">Curated for discovery</p><h2 className="section-title">Explore the Collection</h2></div><a className="btn btn-light" href="#lookbook">View Lookbook <ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map((category,i)=><a href="#lookbook" className={`category category-${i+1}`} key={category.id}><div className="category-photo" style={{backgroundImage:`url(${products[i%Math.max(products.length,1)]?.images[0]?.src ?? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"})`}}/><div className="category-copy"><span>{category.name}</span><ArrowUpRight size={18}/></div></a>)}</div></div></section>

    <section id="lookbook" className="section lookbook"><div className="container"><div className="section-head"><div><p className="eyebrow">Featured lookbook</p><h2 className="section-title">Pieces worth a closer look.</h2></div><p className="muted lookbook-note">Inventory is not connected yet. Ask the store about availability.</p></div><div className="product-masonry">{products.map((product,i)=><article className={`product product-${i+1}`} key={product.id}><div className="product-image"><img src={product.images[0]?.src} alt={product.images[0]?.alt}/><a href={wa} target="_blank" rel="noreferrer" className="product-action" onClick={()=>track("product_click")}>Ask for Availability <ArrowUpRight size={15}/></a></div><div className="product-meta"><div><p>{product.name}</p><small>{categories.find(c=>c.id===product.categoryId)?.name}</small></div>{product.price ? <span>{product.currency ?? "NPR"} {product.price}</span> : null}</div></article>)}</div></div></section>

    <section className="statement"><div className="container statement-inner"><p className="eyebrow">The store experience</p><h2 className="serif">See It. Try It.<br/>Find Your Style.</h2><div className="statement-points"><span><b>01</b> Discover<br/><small>Explore different styles and collections.</small></span><span><b>02</b> Experience<br/><small>Visit the physical store and see products in person.</small></span><span><b>03</b> Connect<br/><small>Contact the store with product questions.</small></span></div></div></section>

    <section id="instagram" className="section instagram"><div className="container"><div className="section-head"><div><p className="eyebrow">Social edit</p><h2 className="section-title">What's New at Fashion Factory</h2><p className="muted">Follow {store?.instagramHandle} for new styles and updates.</p></div><a className="btn btn-light" href={store?.instagramUrl} target="_blank" rel="noreferrer" onClick={()=>track("instagram_click")}>Follow on Instagram <Instagram size={16}/></a></div><div className="ig-grid">{instagram.map(post=><a href={post.permalink} target="_blank" rel="noreferrer" key={post.id}><img src={post.image.src} alt={post.image.alt}/></a>)}</div></div></section>

    <section id="visit-us" className="section visit"><div className="container visit-grid"><div><p className="eyebrow">Visit Fashion Factory</p><h2 className="section-title">Kathmandu,<br/>Nepal.</h2><p className="muted">{store?.locationLabel}</p><p className="hours">{store?.openingHours}</p><div className="visit-actions"><a className="btn btn-dark" href={store?.mapsUrl} target="_blank" rel="noreferrer" onClick={()=>track("maps_click")}>Get Directions <MapPin size={16}/></a><a className="btn btn-light" href={`tel:${store?.phone}`} onClick={()=>track("phone_click")}>Call Store</a></div></div><div className="map"><iframe title="Fashion Factory Kathmandu map" src="https://www.google.com/maps?q=27.6740549,85.2814038&z=16&output=embed" loading="lazy"/></div></div></section>

    <section className="section faq"><div className="container faq-grid"><div><p className="eyebrow">Need to know</p><h2 className="section-title">Questions,<br/>answered.</h2></div><div>{faqs.map(faq=><details key={faq.id}><summary>{faq.question}<ChevronDown size={18}/></summary><p>{faq.answer}</p></details>)}</div></div></section>

    <section id="contact" className="final"><div className="container final-inner"><p className="eyebrow">Fashion Factory Nepal</p><h2 className="serif">{home?.finalCtaTitle}</h2><p>{home?.finalCtaBody}</p><div className="final-actions"><a className="btn btn-dark" href={store?.mapsUrl} target="_blank" rel="noreferrer">Get Directions</a><a className="btn btn-light" href={wa} target="_blank" rel="noreferrer">WhatsApp Us</a><a className="btn btn-light" href={store?.instagramUrl} target="_blank" rel="noreferrer">Follow Instagram</a></div></div></section>

    <footer><div className="container footer-grid"><div><a className="brand footer-brand" href="#top"><span>FASHION</span><strong>FACTORY</strong><small>NEPAL</small></a><p className="muted">{store?.locationLabel}</p></div><div><p className="eyebrow">Explore</p><a href="#collection">Collection</a><a href="#about">About</a><a href="#instagram">Instagram</a><a href="#visit-us">Visit Us</a><a href="#contact">Contact</a></div><div><p className="eyebrow">Connect</p><a href={`tel:${store?.phone}`}>{store?.phone}</a><a href={wa} target="_blank" rel="noreferrer">WhatsApp</a><a href={store?.instagramUrl} target="_blank" rel="noreferrer">{store?.instagramHandle}</a><a href={store?.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Fashion Factory Nepal</span><span>{store?.openingHours}</span></div></footer>
    <div className="mobile-actions"><a href={`tel:${store?.phone}`}><Phone size={17}/>Call</a><a href={wa} target="_blank" rel="noreferrer"><MessageCircle size={17}/>WhatsApp</a><a href={store?.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={17}/>Directions</a></div>
  </main>;
}
