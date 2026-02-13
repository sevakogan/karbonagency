import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import Sidebar from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Karbon Agency",
    template: "%s | Karbon Agency",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
