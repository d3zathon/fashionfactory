"use client";

import { use } from "react";
import { RequireAuth } from "@/components/admin/RequireAuth";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{() => <ProductForm productId={id} />}</RequireAuth>;
}
