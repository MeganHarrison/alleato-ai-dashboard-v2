import { ContactsDataTable } from "@/components/tables/contacts-data-table"
import { getContacts } from "@/app/actions/contacts-actions"

export const dynamic = "force-dynamic"

export default async function ContactsPage() {
  const contacts = await getContacts()

  return <ContactsDataTable contacts={contacts} />
}