import { EmployeesDataTable } from "@/components/tables/employees-data-table";
import { getEmployees } from "@/app/actions/employees-actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <EmployeesDataTable employees={employees} />
    </main>
  );
}
