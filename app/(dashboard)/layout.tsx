import type { ReactElement } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-col min-h-[calc(100vh-5rem)] p-4 pt-0 ml-6 mr-6">
          <div className="flex-1 w-full">
            {children}
          </div>
          <footer className="px-4 lg:px-6 mt-auto pt-20 pb-4 text-right text-xs text-gray-400">
            © 2025 Next Level AI Agents. All Rights Reserved.
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}