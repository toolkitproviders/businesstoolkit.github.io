import { Dashboard } from "@/features/account/dashboard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Dashboard",
  description: "Your saved invoices, quotations, favourite tools and recent activity.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardPage() {
  return <Dashboard />;
}
