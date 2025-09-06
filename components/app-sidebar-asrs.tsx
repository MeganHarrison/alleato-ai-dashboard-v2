import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// FM Global 8-34 navigation data
const data = {
  navMain: [
    {
      title: "Table of Contents",
      url: "/fm-global-8-34",
      items: [
        {
          title: "1.1 Changes",
          url: "/fm-global-8-34/changes",
        },
        {
          title: "1.2 How to Use",
          url: "/fm-global-8-34/how-to-use",
        },
      ],
    },
    {
      title: "1.0 Scope",
      url: "/fm-global-8-34/scope",
      items: [
        {
          title: "1.1 Purpose",
          url: "/fm-global-8-34/scope/purpose",
        },
        {
          title: "1.2 Application",
          url: "/fm-global-8-34/scope/application",
        },
      ],
    },
    {
      title: "2.0 Loss Prevention",
      url: "/fm-global-8-34/loss-prevention",
      items: [
        {
          title: "2.1 Recommendations",
          url: "/fm-global-8-34/loss-prevention/recommendations",
        },
        {
          title: "2.2 Risk Assessment",
          url: "/fm-global-8-34/loss-prevention/risk-assessment",
        },
        {
          title: "2.3 Fire Protection",
          url: "/fm-global-8-34/loss-prevention/fire-protection",
        },
        {
          title: "2.4 System Design",
          url: "/fm-global-8-34/loss-prevention/system-design",
        },
        {
          title: "2.5 Sprinkler Systems",
          url: "/fm-global-8-34/loss-prevention/sprinkler-systems",
        },
      ],
    },
    {
      title: "3.0 Support",
      url: "/fm-global-8-34/support",
      items: [
        {
          title: "3.1 Reference Tables",
          url: "/fm-global-8-34/support/tables",
        },
        {
          title: "3.2 Calculations",
          url: "/fm-global-8-34/support/calculations",
        },
        {
          title: "3.3 Design Tools",
          url: "/fm-global-8-34/support/design-tools",
        },
        {
          title: "3.4 Standards",
          url: "/fm-global-8-34/support/standards",
        },
      ],
    },
    {
      title: "4.0 Resources",
      url: "/fm-global-8-34/resources",
      items: [
        {
          title: "4.1 Documentation",
          url: "/fm-global-8-34/resources/documentation",
        },
        {
          title: "4.2 Forms",
          url: "/fm-global-8-34/resources/forms",
        },
        {
          title: "4.3 FAQs",
          url: "/fm-global-8-34/resources/faqs",
        },
      ],
    },
    {
      title: "Tools",
      url: "/fm-global-8-34/tools",
      items: [
        {
          title: "ASRS Design Form",
          url: "/asrs-form",
        },
        {
          title: "FM Chat Assistant",
          url: "/fm-chat",
        },
      ],
    },
  ],
};

export function AppSidebarASRS({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/fm-global-8-34">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">FM Global 8-34</span>
                  <span className="">ASRS Protection</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
