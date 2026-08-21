import { CategoryList } from "@/components/admin/CategoryList";

// Protected by middleware.ts (session + admin_users membership) and RLS.
export default function AdminCategoriesPage() {
  return <CategoryList />;
}
