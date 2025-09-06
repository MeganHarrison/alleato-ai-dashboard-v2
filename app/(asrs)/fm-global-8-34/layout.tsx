import { AppSidebarASRS } from "@/components/app-sidebar-asrs";

import { ThemeProvider } from "@/components/theme-provider";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FM Global 8-34",
  description: "ASRS Requirements",
};

export default function ASRSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebarASRS />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumbs />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
