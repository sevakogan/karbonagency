import Link from "next/link";
import NewClientWizard from "@/components/dashboard/new-client-wizard";

export const metadata = { title: "Add New Client — Karbon Agency" };

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            Agency
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">New Client</span>
        </nav>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Clients
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Add New Client</h1>
          <p className="text-sm text-gray-500 mt-1">Set up a new client and connect their Meta account.</p>
        </div>
        <NewClientWizard />
      </div>
    </div>
  );
}
