import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { CATEGORY_OPTIONS } from "@/providers/live/supabaseProducts";
import publishedData from "@/data/products.json";

interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  is_visible: boolean;
  updated_at: string;
}

function categoryName(id: string) {
  return CATEGORY_OPTIONS.find((c) => c.id === id)?.name ?? id;
}

export default async function AdminOverviewPage() {
  const supabase = await getServerSupabase();
  const { data, error } = supabase
    ? await supabase.from("products").select("id,name,category_id,image_url,is_visible,updated_at").order("updated_at", { ascending: false })
    : { data: null, error: { message: "Supabase is not configured on this host." } };

  if (error) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Overview</h1>
        <p className="admin-error" role="alert">Couldn&rsquo;t load store data: {error.message}</p>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];
  const visible = products.filter((p) => p.is_visible);
  const hidden = products.filter((p) => !p.is_visible);
  const missingPhoto = products.filter((p) => !p.image_url);

  // "Unpublished changes" measured against the committed products.json the live
  // site actually serves — not a local flag that can drift per browser.
  const publishedAt = publishedData.generatedAt ? new Date(publishedData.generatedAt) : null;
  const latestEdit = products.length ? new Date(products[0].updated_at) : null;
  const unpublished = Boolean(latestEdit && publishedAt && latestEdit > publishedAt);
  const publishedCount = publishedData.products?.length ?? 0;

  const byCategory = CATEGORY_OPTIONS.map((c) => ({
    ...c,
    count: products.filter((p) => p.category_id === c.id).length,
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-title">Overview</h1>
        <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add product</Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No products yet</h2>
          <p className="admin-muted">
            Add your first product, then hit Publish to push it to the live site.
            The public site keeps showing its last published copy until you do.
          </p>
          <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add your first product</Link>
        </div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat"><span className="admin-stat-value">{products.length}</span><span className="admin-stat-label">Total products</span></div>
            <div className="admin-stat"><span className="admin-stat-value">{visible.length}</span><span className="admin-stat-label">Visible on site</span></div>
            <div className="admin-stat"><span className="admin-stat-value">{hidden.length}</span><span className="admin-stat-label">Hidden</span></div>
            <div className={missingPhoto.length ? "admin-stat admin-stat-warn" : "admin-stat"}>
              <span className="admin-stat-value">{missingPhoto.length}</span><span className="admin-stat-label">Missing a photo</span>
            </div>
          </div>

          <section className="admin-section">
            <h2 className="admin-section-title">Publish status</h2>
            <div className={unpublished ? "admin-publish-row admin-publish-dirty" : "admin-publish-row"}>
              <div>
                <p className="admin-publish-headline">
                  {unpublished ? "You have unpublished changes" : "Live site is up to date"}
                </p>
                <p className="admin-muted">
                  {publishedCount} product{publishedCount === 1 ? "" : "s"} currently published
                  {publishedAt ? ` · last published ${publishedAt.toLocaleString()}` : ""}
                </p>
              </div>
              <Link className="admin-btn admin-btn-light" href="/admin/products">Go to products</Link>
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

          {missingPhoto.length > 0 && (
            <section className="admin-section">
              <h2 className="admin-section-title">Needs attention</h2>
              <ul className="admin-attention-list">
                {missingPhoto.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <span className="admin-muted"> — no photo · {categoryName(p.category_id)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="admin-section">
            <h2 className="admin-section-title">Recent activity</h2>
            <ul className="admin-activity-list">
              {products.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                  <span className="admin-muted">
                    {" "}— {p.is_visible ? "visible" : "hidden"} · edited {new Date(p.updated_at).toLocaleString()}
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
