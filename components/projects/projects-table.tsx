"use client";

import { DataTable } from "@/components/tables/database-table";
import { formatDate } from "@/utils/format";

interface ProjectsTableProps {
  projects: any[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  // Function to get status styling
  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      planning: "bg-brand-100 text-brand-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  // Format status for display
  const formatStatus = (status: string) => {
    if (!status) return "—";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const columns = [
    {
      key: "name",
      label: "Project Name",
    },
    {
      key: "description",
      label: "Description",
      format: (value: string) => (
        <div className="max-w-xs truncate" title={value || ""}>
          {value || "—"}
        </div>
      ),
    },
    {
      key: "client",
      label: "Client",
      format: (value: string) => value || "—",
    },
    {
      key: "status",
      label: "Status",
      format: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
            value
          )}`}
        >
          {formatStatus(value)}
        </span>
      ),
    },
    {
      key: "start_date",
      label: "Start Date",
      format: (value: string) => (value ? formatDate(value) : "—"),
    },
    {
      key: "end_date",
      label: "End Date",
      format: (value: string) => (value ? formatDate(value) : "—"),
    },
    {
      key: "created_at",
      label: "Created",
      format: (value: string) => (value ? formatDate(value) : "—"),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={projects} />
    </div>
  );
}
