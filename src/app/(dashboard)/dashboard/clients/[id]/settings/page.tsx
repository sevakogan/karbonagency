import Link from "next/link";
import ClientSettings from "@/components/dashboard/client-settings";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientSettingsPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-600">Agency</Link>
        <span>/</span>
        <Link href={`/dashboard/clients/${id}`} className="hover:text-gray-600">Ads Manager</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Settings</span>
        <div className="ml-auto">
          <Link
            href={`/dashboard/clients/${id}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
          >
            ← Back to Ads Manager
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage identity, contact info, and Meta API credentials for this client.</p>
      </div>

      <ClientSettings clientId={id} />
    </div>
  );
}
