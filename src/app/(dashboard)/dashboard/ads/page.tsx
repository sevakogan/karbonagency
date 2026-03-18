export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import AdsManagerClient from "@/components/dashboard/ads-manager-client";
import Breadcrumb from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Ads Manager",
};

export default function AdsManagerPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ads Manager" },
        ]}
      />
      <AdsManagerClient />
    </div>
  );
}
