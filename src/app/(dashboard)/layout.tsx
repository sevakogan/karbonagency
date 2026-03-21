import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/lib/theme-provider";
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
      <ThemeProvider>
        <div
          className="min-h-screen"
          style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
        >
          <TopNav clients={clients} />
          <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 pb-12">{children}</main>
          <footer
            className="w-full py-4 text-center"
            style={{ fontSize: '10px', color: 'var(--text-quaternary)', fontFamily: 'var(--font-mono)' }}
          >
            v2.1.0 · Built {new Date().toISOString().split('T')[0]}
          </footer>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
