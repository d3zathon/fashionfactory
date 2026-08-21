import { SettingsForm } from "@/components/admin/SettingsForm";

// Protected by middleware.ts (session + admin_users membership) and RLS.
export default function AdminSettingsPage() {
  return <SettingsForm />;
}
