import { CompaniesDataTable } from "@/components/tables/companies-data-table"
import { getCompanies } from "@/app/actions/companies-actions"

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return <CompaniesDataTable companies={companies} />
}