export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getCampaigns } from "@/lib/actions/campaigns";
import Badge from "@/components/ui/badge";

export default async function CampaignsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const campaigns = await getCampaigns();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1">
            {isAdmin ? "All Campaigns" : "My Campaigns"}
          </h1>
          <p className="text-sm text-white/40">{campaigns.length} total</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            No campaigns yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Platform</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Budget</th>
                <th className="text-left py-3 px-4 font-medium">Dates</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-white/60 capitalize">{campaign.platform}</td>
                  <td className="py-3 px-4">
                    <Badge variant={campaign.status}>{campaign.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-white/60">
                    {campaign.budget ? `$${Number(campaign.budget).toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-white/40 text-xs">
                    {campaign.start_date
                      ? `${new Date(campaign.start_date).toLocaleDateString()} — ${
                          campaign.end_date
                            ? new Date(campaign.end_date).toLocaleDateString()
                            : "Ongoing"
                        }`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
