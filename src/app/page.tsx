"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { Ticker } from "@/components/Ticker";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIndex } from "@/components/CategoryIndex";
import { StyleQuiz } from "@/components/StyleQuiz";
import { TikTokIcon } from "@/components/TikTokIcon";
import { useCategories, useFAQs, useFeaturedProducts, useHomepageContent, useInstagram, useStoreSettings, useTestimonials } from "@/hooks";
import { AnalyticsService } from "@/services";
import { GENERAL_WHATSAPP_MESSAGE, TIKTOK_HANDLE, telHref, tiktokHref, whatsappHref } from "@/lib/links";

const fallbackHero = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=88";

export default function HomePage() {
  const { data: home } = useHomepageContent();
  const { data: store } = useStoreSettings();
  const { data: categories } = useCategories();
  const { data: products } = useFeaturedProducts();
  const { data: instagram } = useInstagram();
  const { data: testimonials } = useTestimonials();
  const { data: faqs } = useFAQs();

  const track = (event: string, properties?: Record<string, string | number | boolean>) =>
    AnalyticsService.track(event, properties);
  const wa = whatsappHref(store?.whatsappNumber, GENERAL_WHATSAPP_MESSAGE);
  const heroSrc = home?.heroImage?.src ?? fallbackHero;

  // Headline is split so the second line can indent and shift to rust.
  const headline = home?.headline ?? "Define Your Style.";
  const [headOne, ...headRest] = headline.split(" ");

  // The Index numbering is the spine of the design language, so it cannot show
  // gaps. Testimonials only render when the store actually has any, which used
  // to leave the sequence reading 02, 03, 04, 05, 07, 08, 09, 11 — both 06 (the
  // quiz, which was never labelled) and 10 missing. Consuming a counter in
  // source order keeps it contiguous whether or not testimonials are present.
  // Starts at 1 because the hero is entry 01 and carries no visible label.
  let entry = 1;
  const idx = () => String(++entry).padStart(2, "0");

  const tickerItems = [
    "New arrivals in store",
    store?.locationLabel ?? "Kathmandu Valley, Nepal",
    store?.openingHours ?? "9:00 AM – 5:00 PM daily",
    "Ask us on WhatsApp",
    store?.instagramHandle ?? "@fashion.factory_2022",
    `Follow us on TikTok — ${TIKTOK_HANDLE}`,
  ];

  return <main id="main">
    {/* The hero is the LCP element but is a CSS background image, which the
        browser cannot discover until stylesheets and JS have run. */}
    <link rel="preload" as="image" href={heroSrc} fetchPriority="high" />
    <Navbar />

    {/* 01 — HERO -------------------------------------------------------- */}
    <section id="top" className="hero">
      <div className="hero-image" style={{ backgroundImage: `url(${heroSrc})` }} aria-hidden="true" />
      <div className="container hero-content">
        <p className="eyebrow hero-eyebrow">{home?.eyebrow ?? "Kathmandu, Nepal"}</p>
        <h1 className="hero-title">
          {headOne} <em>{headRest.join(" ")}</em>
        </h1>
        <div className="hero-row">
          <p className="hero-blurb">{home?.description ?? "Discover fashion at Fashion Factory Nepal, Kathmandu."}</p>
          <div className="hero-actions">
            <Link className="btn btn-accent" href="/collection" onClick={() => track("collection_click")}>
              Browse the collection <ArrowUpRight size={15} />
            </Link>
            <Link className="btn" href="#visit-us">Visit the store</Link>
          </div>
        </div>
      </div>
    </section>

    <Ticker items={tickerItems} />

    {/* 02 — MANIFESTO --------------------------------------------------- */}
    <section id="about" className="section">
      <div className="container">
        <Reveal>
          <div className="intro-grid">
            <div className="head-meta">
              <span className="idx">{idx()}</span>
              <p className="eyebrow">The store</p>
            </div>
            <div>
              <h2 className="intro-copy">{home?.introductionTitle ?? "Fashion Made Easy to Discover."}</h2>
              <p className="intro-body">{home?.introductionBody ?? "Fashion Factory is a Kathmandu-based fashion and clothing retail destination. Browse the collection, connect with the store, and visit in person to find your next look."}</p>
              <div className="intro-stats">
                <div className="intro-stat">
                  <strong>{store?.locations?.length ?? 2}</strong>
                  <span>Branches</span>
                </div>
                <div className="intro-stat">
                  <strong>{categories.length || 5}</strong>
                  <span>Categories</span>
                </div>
                <div className="intro-stat">
                  <strong>Daily</strong>
                  <span>{store?.openingHours ?? "9–5"}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>

    {/* 03 — CATEGORY INDEX ---------------------------------------------- */}
    <section id="collection" className="section band-wash rule-top">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="head-meta">
              <span className="idx">{idx()}</span>
              <p className="eyebrow">The index</p>
            </div>
            <h2 className="section-title">Find your category.</h2>
          </div>
          <Link className="link-rule" href="/collection">
            View everything <ArrowUpRight size={14} />
          </Link>
        </div>
        <Reveal>
          <CategoryIndex categories={categories} products={products} fallbackImage={fallbackHero} />
        </Reveal>
      </div>
    </section>

    {/* 04 — FEATURED ---------------------------------------------------- */}
    <section id="lookbook" className="section rule-top">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="head-meta">
              <span className="idx">{idx()}</span>
              <p className="eyebrow">Selected pieces</p>
            </div>
            <h2 className="section-title">Worth a closer look.</h2>
          </div>
          <p className="muted" style={{ maxWidth: "30ch", margin: 0 }}>
            Ask the store about availability — every piece is answered on WhatsApp.
          </p>
        </div>
        <div className="product-grid">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 3) * 70}>
              <ProductCard
                product={product}
                index={i}
                categoryName={categories.find((c) => c.id === product.categoryId)?.name}
                whatsappNumber={store?.whatsappNumber}
                priority={i < 2}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* 05 — EDITORIAL --------------------------------------------------- */}
    <section className="editorial">
      <div className="editorial-media">
        <img src={products[1]?.images[0]?.src ?? fallbackHero} alt="" loading="lazy" />
      </div>
      <div className="editorial-body">
        <div className="head-meta">
          <span className="idx">{idx()}</span>
          <p className="eyebrow">How it works</p>
        </div>
        <h2 className="editorial-quote">See it. Try it.<br />Take it home.</h2>
        <div className="editorial-steps">
          <div className="editorial-step">
            <b>01</b>
            <div><p>Discover</p><small>Browse the collection here or on Instagram.</small></div>
          </div>
          <div className="editorial-step">
            <b>02</b>
            <div><p>Ask</p><small>Message the store on WhatsApp to check what&rsquo;s in stock.</small></div>
          </div>
          <div className="editorial-step">
            <b>03</b>
            <div><p>Visit</p><small>Come to Kirtipur or Budhanilkantha and try it on.</small></div>
          </div>
        </div>
      </div>
    </section>

    {/* 06 — STYLE QUIZ -------------------------------------------------- */}
    <section className="section band-wash">
      <div className="container">
        {/* The quiz was the one section carrying no entry label, which is what
            left a hole at 06. The eyebrow names the section rather than
            repeating the card's own "Find your edit" heading. */}
        <div className="section-head">
          <div>
            <div className="head-meta">
              <span className="idx">{idx()}</span>
              <p className="eyebrow">The styling quiz</p>
            </div>
          </div>
        </div>
        <Reveal>
          <StyleQuiz categories={categories} products={products} whatsappNumber={store?.whatsappNumber} />
        </Reveal>
      </div>
    </section>

    {/* 07 — INSTAGRAM --------------------------------------------------- */}
    <section id="instagram" className="section rule-top">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="head-meta">
              <span className="idx">{idx()}</span>
              <p className="eyebrow">Social edit</p>
            </div>
            <h2 className="section-title">What&rsquo;s new in store.</h2>
          </div>
          {/* Both handles sit in the existing section header rather than in a
              section of their own — the social edit is already the place a
              visitor looks for where to follow the store. */}
          <div className="social-rail">
            {/* Falls back for the same reason the ticker does: store settings
                load client-side, so before hydration this rendered as an empty
                anchor with no href — conspicuous now that a fully-populated
                TikTok handle sits next to it. */}
            <a
              className="link-rule"
              href={store?.instagramUrl ?? "https://www.instagram.com/fashion.factory_2022/"}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("instagram_click")}
            >
              {store?.instagramHandle ?? "@fashion.factory_2022"} <Instagram size={14} />
            </a>
            <a
              className="link-rule"
              href={tiktokHref()}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("tiktok_click", { placement: "social_edit" })}
            >
              {TIKTOK_HANDLE} <TikTokIcon size={13} />
            </a>
          </div>
        </div>
        <div className="ig-grid">
          {instagram.map((post) => (
            <a className="ig-tile" href={post.permalink} target="_blank" rel="noreferrer" key={post.id} onClick={() => track("instagram_click")}>
              <img src={post.image.src} alt={post.image.alt} loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>

    {/* 08 — VISIT ------------------------------------------------------- */}
    <section id="visit-us" className="section band-wash rule-top">
      <div className="container visit-grid">
        <div>
          <div className="head-meta">
            <span className="idx">{idx()}</span>
            <p className="eyebrow">Visit us</p>
          </div>
          <h2 className="section-title">Two doors in the<br />Kathmandu Valley.</h2>
          <div className="location-list">
            {store?.locations?.map((location) => (
              <div className="location-card" key={location.id}>
                <h3>{location.name}</h3>
                <p className="muted" style={{ margin: 0 }}>{location.address}</p>
                <p className="hours">{store?.openingHours}</p>
                <div className="visit-actions">
                  <a className="btn btn-dark" href={location.mapsUrl} target="_blank" rel="noreferrer" onClick={() => track("maps_click", { location: location.id })}>
                    Directions <MapPin size={15} />
                  </a>
                  <a className="btn" href={telHref(store?.phone)} onClick={() => track("phone_click")}>
                    <Phone size={15} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="visit-maps">
          {store?.locations?.map((location) => (
            <div className="map" key={location.id}>
              <iframe title={`${location.name} map`} src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* 09 — FAQ + CONTACT ----------------------------------------------- */}
    <section className="section faq rule-top">
      <div className="container faq-grid">
        <div>
          <div className="head-meta">
            <span className="idx">{idx()}</span>
            <p className="eyebrow">Need to know</p>
          </div>
          <h2 className="section-title">Questions,<br />answered.</h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <details key={faq.id}>
              <summary>{faq.question}<ChevronDown size={18} /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>

    {testimonials.length > 0 && (
      <section className="section rule-top">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="head-meta"><span className="idx">{idx()}</span><p className="eyebrow">Social proof</p></div>
              <h2 className="section-title">What customers say.</h2>
            </div>
          </div>
          <div className="quote-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.id} className="quote-card">
                <p className="quote-body">&ldquo;{testimonial.quote}&rdquo;</p>
                <span className="eyebrow">{testimonial.name}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    )}

    <section id="contact" className="section band-wash rule-top">
      <div className="container contact-grid">
        <div>
          <div className="head-meta">
            <span className="idx">{idx()}</span>
            <p className="eyebrow">Talk to the store</p>
          </div>
          <h2 className="section-title">Have a question<br />about a look?</h2>
          <p className="muted" style={{ marginTop: 18, maxWidth: "42ch", lineHeight: 1.7 }}>
            Send an inquiry and the store will follow up using the contact details you provide.
            For the fastest reply, message us on WhatsApp.
          </p>
          <a className="btn btn-dark" style={{ marginTop: 22 }} href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>
            <MessageCircle size={15} /> WhatsApp the store
          </a>
        </div>
        <ContactForm />
      </div>
    </section>

    <section className="final">
      <div className="container final-inner">
        <p className="eyebrow">Fashion Factory Nepal</p>
        <h2>{home?.finalCtaTitle ?? "Your Next Look Starts Here."}</h2>
        <p>{home?.finalCtaBody ?? "Visit Fashion Factory in the Kathmandu Valley, or message the store to ask about a piece."}</p>
        <div className="final-actions">
          <Link className="btn btn-dark" href="/collection">Browse the collection</Link>
          <a className="btn" href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")}>WhatsApp us</a>
          <Link className="btn" href="#visit-us">Get directions</Link>
        </div>
      </div>
    </section>

    <Footer />
    <MobileActionBar />
  </main>;
}
