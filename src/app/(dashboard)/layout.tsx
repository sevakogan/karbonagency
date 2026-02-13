import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import TopNav from "@/components/dashboard/top-nav";
import { getClients } from "@/lib/actions/clients";

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Karbon Agency",
    template: "%s | Karbon Agency",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clients = await getClients();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <TopNav clients={clients} />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
