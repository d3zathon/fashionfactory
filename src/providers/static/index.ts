import type { Category, Product, StoreProfile } from "@/models";
import type { CategoryProvider, ProductProvider, StoreSettingsProvider } from "../interfaces";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import storeData from "@/data/store.json";

interface StaticProductRecord extends Product {
  sortOrder: number;
}

const products: Product[] = [...(productsData.products as StaticProductRecord[])]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((record): Product => {
    const { id, name, slug, categoryId, description, price, currency, images, sizes, colors, available, featured } = record;
    return { id, name, slug, categoryId, description, price, currency, images, sizes, colors, available, featured };
  });

export const staticProductProvider: ProductProvider = {
  async getProducts() { return products; },
  async getProduct(id) { return products.find((product) => product.id === id) ?? null; },
  async getProductBySlug(slug) { return products.find((product) => product.slug === slug) ?? null; },
  async getFeaturedProducts() { return products.filter((product) => product.featured); },
  async getProductsByCategory(categoryId) { return products.filter((product) => product.categoryId === categoryId); },
};

const categories: Category[] = (categoriesData.categories as Category[])
  .filter((category) => category.active)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const staticCategoryProvider: CategoryProvider = {
  async getCategories() { return categories; },
  async getCategory(identifier) {
    return categories.find((category) => category.id === identifier || category.slug === identifier) ?? null;
  },
};

// The tenant profile for whichever store this deployment was built for. Which
// store that is was decided at publish time (STORE_SLUG in
// scripts/generate-site-data.mjs), not at request time — the storefront is
// static, so there is exactly one store per build.
const storeProfile: StoreProfile = {
  ...storeData.settings,
  locations: [...storeData.locations]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ id, name, address, mapsUrl, lat, lng }) => ({ id, name, address, mapsUrl, lat, lng })),
};

export const staticStoreSettingsProvider: StoreSettingsProvider = {
  async getStoreSettings() { return storeProfile; },
};

/**
 * Synchronous access to the same profile.
 *
 * Everything else goes through the async provider chain, but three callers
 * cannot: Next's `metadata` export, the OG image, and module-level constants.
 * Reading the committed JSON is a pure import with no I/O, so exposing it
 * directly costs nothing and keeps those call sites from hardcoding a store.
 */
export function getStoreProfile(): StoreProfile {
  return storeProfile;
}
