import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  UserCheck,
  Building2,
  Calendar,
  Package,
  DollarSign,
  LayoutDashboard,
  FileCode2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface TablePage {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: string;
}

const tablePages: TablePage[] = [
  {
    title: "Dashboard",
    description: "Main dashboard with overview table",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-6 w-6" />,
    category: "Overview",
  },
  {
    title: "Projects Database",
    description: "View and manage all projects",
    href: "/projects-db",
    icon: <FileCode2 className="h-6 w-6" />,
    category: "Core Data",
  },
  {
    title: "Documents Database",
    description: "Document library management",
    href: "/documents-db",
    icon: <FileText className="h-6 w-6" />,
    category: "Core Data",
  },
  {
    title: "Clients",
    description: "Manage your client database",
    href: "/clients-db",
    icon: <Building2 className="h-6 w-6" />,
    category: "CRM",
  },
  {
    title: "Prospects",
    description: "Sales prospects and leads",
    href: "/prospects",
    icon: <UserCheck className="h-6 w-6" />,
    category: "CRM",
  },
  {
    title: "Products",
    description: "Product catalog and inventory",
    href: "/products",
    icon: <Package className="h-6 w-6" />,
    category: "Commerce",
  },
  {
    title: "Services",
    description: "Service offerings management",
    href: "/services",
    icon: <ShoppingBag className="h-6 w-6" />,
    category: "Commerce",
  },
  {
    title: "Sales",
    description: "Track sales and revenue",
    href: "/sales",
    icon: <DollarSign className="h-6 w-6" />,
    category: "Commerce",
  },
  {
    title: "Content",
    description: "Content management tables",
    href: "/content",
    icon: <FileText className="h-6 w-6" />,
    category: "Content",
  },
];

export default function TablesOverviewPage() {
  const categories = [...new Set(tablePages.map((page) => page.category))];

  return (
    <div className="w-[90%] mx-auto">
      <PageHeader
        title="Tables Overview"
        description="Quick access to all data tables in the application"
      />

      <div className="space-y-8 mt-8">
        {categories.map((category) => {
          const categoryPages = tablePages.filter(
            (page) => page.category === category
          );

          return (
            <div key={category}>
              <h2 className="text-base mb-4 text-foreground/80">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-md bg-[#DB802D]/10 text-[#DB802D] group-hover:bg-[#DB802D] group-hover:text-white transition-colors">
                        {page.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold leading-none tracking-tight">
                          {page.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
