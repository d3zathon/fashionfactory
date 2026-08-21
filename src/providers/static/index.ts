import type { Product } from "@/models";
import type { ProductProvider } from "../interfaces";
import productsData from "@/data/products.json";

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
