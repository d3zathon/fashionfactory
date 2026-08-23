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
import { HomeSearch } from "@/components/HomeSearch";
import { TikTokIcon } from "@/components/TikTokIcon";
import { useCategories, useFAQs, useFeaturedProducts, useHomepageContent, useInstagram, useStoreSettings, useTestimonials } from "@/hooks";
import { AnalyticsService } from "@/services";
import { generalWhatsappMessage, telHref, tiktokLink, whatsappHref } from "@/lib/links";
import { getStoreProfile } from "@/providers/static";

const fallbackHero = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=88";

// The store this deployment was built for. useStoreSettings resolves to the
// same data, but only after the first render, so this stands in for it wherever
// a fallback used to be a Fashion Factory literal.
const built = getStoreProfile();

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
  const wa = whatsappHref(store?.whatsappNumber, generalWhatsappMessage(store?.name));
  // Field-by-field rather than `store ?? built`: useStoreSettings seeds an empty
  // object, which is truthy, so a whole-object fallback would never fire.
  const tiktok = tiktokLink({
    tiktokUrl: store?.tiktokUrl ?? built.tiktokUrl,
    tiktokHandle: store?.tiktokHandle ?? built.tiktokHandle,
  });
  const heroSrc = home?.heroImage?.src ?? fallbackHero;

  // Headline is split so the second line can indent and shift to rust.
  const headline = home?.headline ?? built.tagline ?? built.name;
  const [headOne, ...headRest] = headline.split(" ");

  // The Index numbering is the spine of the design language, so it cannot show
  // gaps. Testimonials only render when the store actually has any, which used
  // to leave the sequence reading 02, 03, 04, 05, 07, 08, 09, 11 — both 06 (the
  // quiz, which was never labelled) and 10 missing. Consuming a counter in
  // source order keeps it contiguous whether or not testimonials are present.
  // Starts at 1 because the hero is entry 01 and carries no visible label.
  let entry = 1;
  const idx = () => String(++entry).padStart(2, "0");

  // Sections a store has switched off in its settings never render. Unset
  // counts as on, so a store that has never touched these keeps everything.
  const feature = (key: keyof NonNullable<typeof built.features>) => built.features?.[key] !== false;

  // Falls back to the built store's own profile rather than to literals: the
  // JSON is a build-time constant, so these read as stably as hardcoded strings
  // while staying correct on a storefront that isn't Fashion Factory's.
  const tickerItems = [
    "New arrivals in store",
    store?.locationLabel ?? built.locationLabel,
    store?.openingHours ?? built.openingHours,
    "Ask us on WhatsApp",
    store?.instagramHandle ?? built.instagramHandle,
    ...(built.tiktokHandle ? [`Follow us on TikTok — ${store?.tiktokHandle ?? built.tiktokHandle}`] : []),
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
        <p className="eyebrow hero-eyebrow">{home?.eyebrow ?? built.locationLabel}</p>
        <h1 className="hero-title">
          {headOne} <em>{headRest.join(" ")}</em>
        </h1>
        <div className="hero-row">
          <p className="hero-blurb">{home?.description ?? built.description}</p>
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
              <h2 className="intro-copy">{home?.introductionTitle ?? built.tagline}</h2>
              <p className="intro-body">{home?.introductionBody ?? built.description}</p>
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
                  <span>{store?.openingHours ?? built.openingHours}</span>
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
        {/* Search sits with the category index rather than in the hero: this is
            the section that already promises "find", and pairing a query with
            the categories mirrors how /collection itself is laid out. The hero
            keeps its two CTAs and nothing else. */}
        <HomeSearch />
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
            <div><p>Visit</p><small>{built.visitStepBody ?? "Come and try it on."}</small></div>
          </div>
        </div>
      </div>
    </section>

    {feature("styleQuiz") && (<>
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
    </>)}

    {feature("instagramFeed") && (<>
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
              href={store?.instagramUrl ?? built.instagramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("instagram_click")}
            >
              {store?.instagramHandle ?? built.instagramHandle} <Instagram size={14} />
            </a>
            {tiktok && (
              <a
                className="link-rule"
                href={tiktok}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("tiktok_click", { placement: "social_edit" })}
              >
                {store?.tiktokHandle ?? built.tiktokHandle} <TikTokIcon size={13} />
              </a>
            )}
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
    </>)}

    {feature("locations") && (<>
    {/* 08 — VISIT ------------------------------------------------------- */}
    <section id="visit-us" className="section band-wash rule-top">
      <div className="container visit-grid">
        <div>
          <div className="head-meta">
            <span className="idx">{idx()}</span>
            <p className="eyebrow">Visit us</p>
          </div>
          {/* Split on newlines so a store's own two-line heading keeps its break. */}
          <h2 className="section-title">
            {(built.visitTitle ?? "Where to find us.").split("\n").map((line, i) => (
              <span key={line}>{i > 0 && <br />}{line}</span>
            ))}
          </h2>
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
    </>)}

    {feature("faqs") && (<>
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
    </>)}

    {feature("testimonials") && testimonials.length > 0 && (
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

    {feature("contactForm") && (<>
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
    </>)}

    <section className="final">
      <div className="container final-inner">
        <p className="eyebrow">{store?.name ?? built.name}</p>
        <h2>{home?.finalCtaTitle ?? "Your Next Look Starts Here."}</h2>
        <p>{home?.finalCtaBody ?? `Visit ${store?.name ?? built.name}, or message the store to ask about a piece.`}</p>
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
