import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import publishedData from "@/data/products.json";
import { ACTIVE_STORE_SLUG } from "@/providers/live/supabaseStore";

interface CategoryRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  is_visible: boolean;
  updated_at: string;
}

function categoryNamer(categories: CategoryRow[]) {
  return (id: string) => categories.find((c) => c.id === id)?.name ?? id;
}

function when(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AdminOverviewPage() {
  const supabase = await getServerSupabase();

  // Everything on this page is scoped to the store this deployment serves, so
  // the store id is resolved first and every query filters on it.
  const storeId = supabase
    ? (await supabase.from("stores").select("id").eq("slug", ACTIVE_STORE_SLUG).maybeSingle()).data?.id
    : null;

  const { data, error } = supabase && storeId
    ? await supabase.from("products").select("id,name,category_id,image_url,is_visible,updated_at").eq("store_id", storeId).order("updated_at", { ascending: false })
    : { data: null, error: { message: "" } };

  const { data: categoryData } = supabase && storeId
    ? await supabase.from("categories").select("id,name").eq("store_id", storeId).eq("active", true).order("sort_order", { ascending: true })
    : { data: null };

  // Three failures look identical from the outside and have completely
  // different fixes, so each says which one it is and what to do about it.
  if (!supabase || !storeId || error) {
    const { heading, body } = !supabase
      ? {
          heading: "Admin is not configured",
          body: "This host is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. They are inlined at build time, so redeploy after setting them.",
        }
      : !storeId
        ? {
            heading: "No store to manage",
            body: `Nothing in the database has the slug "${ACTIVE_STORE_SLUG}". Apply the migrations in supabase/migrations, or set NEXT_PUBLIC_STORE_SLUG to a store that exists.`,
          }
        : {
            heading: "Couldn't load store data",
            body: error?.message ?? "The database refused the request.",
          };

    return (
      <div className="admin-page">
        <p className="admin-eyebrow">Overview</p>
        <h1 className="admin-title">{heading}</h1>
        <p className="admin-error" role="alert">{body}</p>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];
  const categories = (categoryData ?? []) as CategoryRow[];
  const categoryName = categoryNamer(categories);
  const visible = products.filter((p) => p.is_visible);
  const hidden = products.filter((p) => !p.is_visible);
  const missingPhoto = products.filter((p) => !p.image_url);

  // Measured against the committed products.json the live site actually serves,
  // not a per-browser flag.
  const publishedAt = publishedData.generatedAt ? new Date(publishedData.generatedAt) : null;
  const latestEdit = products.length ? new Date(products[0].updated_at) : null;
  const unpublished = Boolean(latestEdit && publishedAt && latestEdit > publishedAt);
  const publishedCount = publishedData.products?.length ?? 0;

  const byCategory = categories.map((c) => ({ ...c, count: products.filter((p) => p.category_id === c.id).length }));
  const emptyCategories = byCategory.filter((c) => c.count === 0);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h1 className="admin-title">Store overview</h1>
        </div>
        <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add product</Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No products yet</h2>
          <p>
            Add your first product, then hit Publish to push it to the live site.
            The public site keeps showing its last published copy until you do.
          </p>
          <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add your first product</Link>
        </div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat"><span className="admin-stat-value">{products.length}</span><span className="admin-stat-label">Products</span></div>
            <div className="admin-stat"><span className="admin-stat-value">{visible.length}</span><span className="admin-stat-label">Live on site</span></div>
            <div className="admin-stat"><span className="admin-stat-value">{hidden.length}</span><span className="admin-stat-label">Hidden</span></div>
            <div className={missingPhoto.length ? "admin-stat admin-stat-warn" : "admin-stat"}>
              <span className="admin-stat-value">{missingPhoto.length}</span><span className="admin-stat-label">No photo</span>
            </div>
          </div>

          {/* What needs attention, before anything else. */}
          {(unpublished || missingPhoto.length > 0 || emptyCategories.length > 0) && (
            <section className="admin-section">
              <h2 className="admin-section-title">Needs your attention</h2>
              <ul className="admin-attention-list">
                {unpublished && (
                  <li>
                    <Link href="/admin/products">Unpublished changes</Link>
                    <span className="admin-row-meta">
                      edited {latestEdit ? when(latestEdit.toISOString()) : ""} · live site still shows {publishedCount}
                    </span>
                  </li>
                )}
                {missingPhoto.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <span className="admin-row-meta">no photo · {categoryName(p.category_id)}</span>
                  </li>
                ))}
                {emptyCategories.length > 0 && (
                  <li>
                    <Link href="/admin/categories">
                      {emptyCategories.length} empty categor{emptyCategories.length === 1 ? "y" : "ies"}
                    </Link>
                    <span className="admin-row-meta">{emptyCategories.map((c) => c.name).join(", ")}</span>
                  </li>
                )}
              </ul>
            </section>
          )}

          <section className="admin-section">
            <h2 className="admin-section-title">Publish status</h2>
            <div className={unpublished ? "admin-publish-row admin-publish-dirty" : "admin-publish-row"}>
              <div className="admin-publish-copy">
                <p className="admin-publish-headline">{unpublished ? "Unpublished changes" : "Live site is up to date"}</p>
                <span className="admin-publish-sub">
                  {publishedCount} product{publishedCount === 1 ? "" : "s"} published
                  {publishedAt ? ` · ${publishedAt.toLocaleString()}` : ""}
                </span>
              </div>
              <Link className="admin-btn admin-btn-light" href="/admin/products">
                Go to products <ArrowUpRight size={13} />
              </Link>
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">By category</h2>
            <div className="admin-category-grid">
              {byCategory.map((c) => (
                <div className="admin-category-stat" key={c.id}>
                  <span className="admin-stat-value">{c.count}</span>
                  <span className="admin-stat-label">{c.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">Recently edited</h2>
            <ul className="admin-activity-list">
              {products.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                  <span className="admin-row-meta">
                    {p.is_visible ? "live" : "hidden"} · {categoryName(p.category_id)} · {when(p.updated_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
