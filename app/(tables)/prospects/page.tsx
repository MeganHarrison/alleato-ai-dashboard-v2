import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/tables/database-table";
import { AddProspectButton } from "@/components/table-buttons/add-prospect-button";
import { formatDate } from "@/utils/format";

export const dynamic = "force-dynamic";

export default function ProspectsPage() {
  return (
    <div className="space-y-4 p-2 sm:p-4 md:p-6 w-[95%] sm:w-full mx-auto">
      <PageHeader
        title="Prospects"
        description="Manage your sales prospects and leads."
        action={{
          label: "Add Prospect", 
          component: <AddProspectButton />
        }}
      />

      <div className="rounded-md border">
        <DataTable
          columns={[
            {
              key: "full_name",
              label: "Name",
            },
            {
              key: "email",
              label: "Email",
            },
            {
              key: "phone",
              label: "Phone",
            },
            {
              key: "company",
              label: "Company",
            },
            {
              key: "status",
              label: "Status",
              format: (value) => {
                const status = value as string;
                return (
                  <div className="flex items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === "New"
                          ? "bg-blue-100 text-blue-800"
                          : status === "Contacted"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "Qualified"
                          ? "bg-green-100 text-green-800"
                          : status === "Proposal"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "created_at",
              label: "Created",
              format: (value) => {
                return formatDate(value);
              },
            },
          ]}
          data={[
            {
              id: 1,
              full_name: "John Smith",
              email: "john.smith@example.com",
              phone: "(555) 123-4567",
              company: "Acme Inc",
              status: "New",
              created_at: "2025-04-01T10:00:00Z",
            },
            {
              id: 2,
              full_name: "Sarah Johnson",
              email: "sarah.j@techcorp.com",
              phone: "(555) 987-6543",
              company: "TechCorp",
              status: "Contacted",
              created_at: "2025-04-03T14:30:00Z",
            },
            {
              id: 3,
              full_name: "Michael Brown",
              email: "m.brown@globalinc.com",
              phone: "(555) 456-7890",
              company: "Global Inc",
              status: "Qualified",
              created_at: "2025-04-05T09:15:00Z",
            },
            {
              id: 4,
              full_name: "Emily Davis",
              email: "emily.d@innovate.co",
              phone: "(555) 234-5678",
              company: "Innovate Co",
              status: "Proposal",
              created_at: "2025-04-07T16:45:00Z",
            },
            {
              id: 5,
              full_name: "Robert Wilson",
              email: "r.wilson@megacorp.org",
              phone: "(555) 876-5432",
              company: "MegaCorp",
              status: "Contacted",
              created_at: "2025-04-10T11:20:00Z",
            },
          ]}
        />
      </div>
    </div>
  );
}
