export const dynamic = "force-dynamic";

import { getClients } from "@/lib/actions/clients";
import ClientsListView from "@/components/dashboard/clients-list-view";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsListView clients={clients} />;
}
