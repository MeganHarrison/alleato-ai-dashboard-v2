"use client";

import { DataTable } from "@/components/tables/database-table";
import type { Tables } from "@/types/database.types";

type Document = Tables<"document_metadata">;

function formatDateMMDDYYYY(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export function DocumentsDataTable({ documents }: { documents: Document[] }) {
  const columns = [
    {
      key: "title",
      label: "Title",
      format: (value: string) => {
        // Find the document with this title to get the url
        const doc = documents.find((d) => d.title === value);
        return doc && doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {value || "-"}
          </a>
        ) : (
          value || "-"
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      format: (value: string) => (value ? formatDateMMDDYYYY(value) : "-"),
    },
  ];

  return <DataTable data={documents} columns={columns} pageSize={15} />;
}
