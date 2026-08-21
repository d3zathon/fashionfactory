"use client";

import { RequireAuth } from "@/components/admin/RequireAuth";
import { ProductList } from "@/components/admin/ProductList";

export default function AdminProductsPage() {
  return <RequireAuth>{() => <ProductList />}</RequireAuth>;
}
