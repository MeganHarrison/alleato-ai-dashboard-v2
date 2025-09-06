import { ClientsDataTable } from "@/components/tables/clients-data-table"
import { getClients } from "@/app/actions/clients-actions"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <main className="flex flex-1 flex-col">
      <ClientsDataTable clients={clients} />
    </main>
  )
}