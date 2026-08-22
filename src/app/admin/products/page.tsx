import { ProductList } from "@/components/admin/ProductList";

// Access is enforced in middleware.ts (session + admin_users membership) and
// again by RLS on every query. No client-side gate is relied upon.
export default function AdminProductsPage() {
  return <ProductList />;
}
