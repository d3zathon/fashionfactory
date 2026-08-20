"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { useCategories, useFAQs, useFeaturedProducts, useHomepageContent, useInstagram, useStoreSettings, useTestimonials } from "@/hooks";
import { AnalyticsService } from "@/services";

const whatsapp = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
const fallbackHero = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=88";

export default function HomePage() {
  const { data: home } = useHomepageContent();
  const { data: store } = useStoreSettings();
  const { data: categories } = useCategories();
  const { data: products } = useFeaturedProducts();
  const { data: instagram } = useInstagram();
  const { data: testimonials } = useTestimonials();
  const { data: faqs } = useFAQs();
  const track = (event: string, properties?: Record<string, string | number | boolean>) => AnalyticsService.track(event, properties);
  const wa = store?.whatsappNumber ? whatsapp(store.whatsappNumber, "Hi Fashion Factory, I found you through your website and would like to know more about your collection.") : "#";

  return <main>
    <Navbar />

    <section id="top" className="hero">
      <div className="hero-image" style={{ backgroundImage: `url(${home?.heroImage?.src ?? fallbackHero})` }} aria-hidden="true"><div className="hero-overlay" /></div>
      <div className="container hero-content">
        <p className="eyebrow">{home?.eyebrow}</p>
        <h1 className="serif">{home?.headline}</h1>
        <p>{home?.description}</p>
        <div className="hero-actions">
          <Link className="btn btn-dark" href="#collection" onClick={() => track("collection_click")}>Explore Collection <ArrowUpRight size={17} /></Link>
          <Link className="btn btn-light" href="#visit-us">Visit Store</Link>
        </div>
      </div>
    </section>

    <section className="quick" aria-label="Quick contact actions">
      <div className="container quick-grid">
        <a href={store?.phone ? `tel:${store.phone}` : undefined} onClick={() => track("phone_click")}><Phone size={19} /><span>Call</span></a>
        <a href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}><MessageCircle size={19} /><span>WhatsApp</span></a>
        <a href={store?.mapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}><MapPin size={19} /><span>Directions</span></a>
        <a href={store?.instagramUrl} target="_blank" rel="noreferrer" onClick={() => track("instagram_click")}><Instagram size={19} /><span>Instagram</span></a>
      </div>
    </section>

    <section id="about" className="section intro">
      <div className="container intro-grid">
        <p className="eyebrow">Fashion Factory Nepal</p>
        <div><h2 className="section-title">{home?.introductionTitle}</h2><p className="intro-copy">{home?.introductionBody}</p></div>
      </div>
    </section>

    <section id="collection" className="section collection">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">Curated for discovery</p><h2 className="section-title">Explore the Collection</h2></div>
          <Link className="btn btn-light" href="/collection">View Collection <ArrowUpRight size={16} /></Link>
        </div>
        <div className="category-grid">
          {categories.map((category, i) => (
            <Link href={`/collection#${category.slug}`} className={`category category-${i + 1}`} key={category.id} onClick={() => track("collection_click", { category: category.id })}>
              <div className="category-photo" style={{ backgroundImage: `url(${category.image?.src ?? products[i % Math.max(products.length, 1)]?.images[0]?.src ?? fallbackHero})` }} aria-hidden="true" />
              <div className="category-copy"><span>{category.name}</span><ArrowUpRight size={18} /></div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section id="lookbook" className="section lookbook">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">Featured lookbook</p><h2 className="section-title">Pieces worth a closer look.</h2></div>
          <p className="muted lookbook-note">Ask the store about current product availability.</p>
        </div>
        <div className="product-masonry">
          {products.map((product, i) => (
            <article className={`product product-${i + 1}`} key={product.id}>
              <div className="product-image">
                <Link href={`/products/${product.slug}`} onClick={() => track("product_click", { product: product.id })} aria-label={`View ${product.name}`}>
                  <img src={product.images[0]?.src} alt={product.images[0]?.alt ?? product.name} loading={i < 2 ? "eager" : "lazy"} />
                </Link>
                <a href={whatsapp(store?.whatsappNumber ?? "9779864831830", `Hi Fashion Factory, I would like to ask about ${product.name}. Is it currently available?`)} target="_blank" rel="noreferrer" className="product-action" onClick={() => track("whatsapp_click", { product: product.id })}>Ask for Availability <ArrowUpRight size={15} /></a>
              </div>
              <div className="product-meta">
                <div><p><Link href={`/products/${product.slug}`}>{product.name}</Link></p><small>{categories.find(c => c.id === product.categoryId)?.name}</small></div>
                {product.price !== undefined ? <span>{product.currency ?? "NPR"} {product.price.toLocaleString()}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="statement">
      <div className="container statement-inner">
        <p className="eyebrow">The store experience</p>
        <h2 className="serif">See It. Try It.<br />Find Your Style.</h2>
        <div className="statement-points">
          <span><b>01</b> Discover<br /><small>Explore different styles and collections.</small></span>
          <span><b>02</b> Experience<br /><small>Visit the physical store and see products in person.</small></span>
          <span><b>03</b> Connect<br /><small>Contact the store with product questions.</small></span>
        </div>
      </div>
    </section>

    <section id="instagram" className="section instagram">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">Social edit</p><h2 className="section-title">What's New at Fashion Factory</h2><p className="muted">Follow {store?.instagramHandle} for new styles and updates.</p></div>
          <a className="btn btn-light" href={store?.instagramUrl} target="_blank" rel="noreferrer" onClick={() => track("instagram_click")}>Follow on Instagram <Instagram size={16} /></a>
        </div>
        <div className="ig-grid">{instagram.map(post => <a href={post.permalink} target="_blank" rel="noreferrer" key={post.id}><img src={post.image.src} alt={post.image.alt} loading="lazy" /></a>)}</div>
      </div>
    </section>

    <section className="section social-proof">
      <div className="container">
        <div className="section-head"><div><p className="eyebrow">Social proof</p><h2 className="section-title">What customers say.</h2></div></div>
        {testimonials.length ? <div className="testimonial-grid">{testimonials.map(testimonial => <article key={testimonial.id} className="testimonial-card"><p>“{testimonial.quote}”</p><span>{testimonial.name}</span></article>)}</div> : <div className="state-block">Verified customer reviews will appear here when connected to the store's review or testimonial source.</div>}
      </div>
    </section>

    <section id="visit-us" className="section visit">
      <div className="container visit-grid">
        <div>
          <p className="eyebrow">Visit Fashion Factory</p><h2 className="section-title">Kathmandu,<br />Nepal.</h2><p className="muted">{store?.locationLabel}</p><p className="hours">{store?.openingHours}</p>
          <div className="visit-actions"><a className="btn btn-dark" href={store?.mapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click")}>Get Directions <MapPin size={16} /></a><a className="btn btn-light" href={store?.phone ? `tel:${store.phone}` : undefined} onClick={() => track("phone_click")}>Call Store</a></div>
        </div>
        <div className="map"><iframe title="Fashion Factory Kathmandu map" src="https://www.google.com/maps?q=27.6740549,85.2814038&z=16&output=embed" loading="lazy" /></div>
      </div>
    </section>

    <section className="section faq">
      <div className="container faq-grid">
        <div><p className="eyebrow">Need to know</p><h2 className="section-title">Questions,<br />answered.</h2></div>
        <div>{faqs.map(faq => <details key={faq.id}><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div>
      </div>
    </section>

    <section id="contact" className="section contact">
      <div className="container contact-grid">
        <div><p className="eyebrow">Talk to the store</p><h2 className="section-title">Have a question about a look?</h2><p className="muted">Send an inquiry and the store can follow up using the contact information you provide.</p></div>
        <ContactForm />
      </div>
    </section>

    <section className="final">
      <div className="container final-inner">
        <p className="eyebrow">Fashion Factory Nepal</p><h2 className="serif">{home?.finalCtaTitle}</h2><p>{home?.finalCtaBody}</p>
        <div className="final-actions"><a className="btn btn-dark" href={store?.mapsUrl} target="_blank" rel="noreferrer">Get Directions</a><a className="btn btn-light" href={wa} target="_blank" rel="noreferrer">WhatsApp Us</a><a className="btn btn-light" href={store?.instagramUrl} target="_blank" rel="noreferrer">Follow Instagram</a></div>
      </div>
    </section>

    <Footer />
    <MobileActionBar />
  </main>;
}
