import type { Category, Product, StoreSettings } from "@/models";
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

const storeSettings: StoreSettings = {
  ...storeData.settings,
  locations: [...storeData.locations]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ id, name, address, mapsUrl, lat, lng }) => ({ id, name, address, mapsUrl, lat, lng })),
};

export const staticStoreSettingsProvider: StoreSettingsProvider = {
  async getStoreSettings() { return storeSettings; },
};
