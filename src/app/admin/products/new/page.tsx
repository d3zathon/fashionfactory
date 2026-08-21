"use client";

import { RequireAuth } from "@/components/admin/RequireAuth";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return <RequireAuth>{() => <ProductForm />}</RequireAuth>;
}
