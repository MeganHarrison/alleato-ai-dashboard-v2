"use client";

import { NavUser } from "@/components/nav/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

const data = {
  navMain: [
    {
      title: "Menu",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/",
        },
        {
          title: "Meetings",
          url: "/meetings",
        },
        {
          title: "FM Global Dashboard",
          url: "/fm-global-dashboard",
        },
        {
          title: "Tables & Figures",
          url: "/fm-global-tables",
        },
        {
          title: "FM-Global Form",
          url: "/asrs-form",
        },
        {
          title: "ASRS Form",
          url: "/asrs-form",
        },
        {
          title: "ASRS Form 2",
          url: "/asrs-form-2",
        },
        {
          title: "ASRS Form 3",
          url: "/asrs-form-3",
        },
        {
          title: "Alleato Intel",
          url: "/insights8",
        },
        {
          title: "FM Global Agent",
          url: "/asrs-chat",
        },
        {
          title: "FM Global Chat",
          url: "/asrs-chat2",
        },
        {
          title: "ASRS Requirements",
          url: "/asrs-requirements",
        },
        {
          title: "FM Global PDF",
          url: "/fm-global-pdf",
        },
      ],
    },
    {
      title: "Projects",
      url: "#",
      items: [
        {
          title: "Project Insights",
          url: "/insights",
        },
        {
          title: "Projects Dashboard",
          url: "/projects-dashboard",
        },
      ],
    },
    {
      title: "Tables",
      url: "#",
      items: [
        {
          title: "Clients",
          url: "/clients",
        },
        {
          title: "Team",
          url: "/team",
        },
        {
          title: "Documents",
          url: "/documents",
        },
        {
          title: "Leads",
          url: "/prospects",
        },
        {
          title: "Contacts",
          url: "/contacts",
        },
        {
          title: "Subcontractors",
          url: "/subcontractors",
        },
        {
          title: "Project Tasks",
          url: "/project-tasks",
        },
      ],
    },
    {
      title: "Admin",
      url: "#",
      items: [
        {
          title: "RAG Admin",
          url: "/rag-admin",
        },
        {
          title: "Sitemap",
          url: "/sitemap",
        },
        {
          title: "Trigger Vectorization",
          url: "/trigger-vectorization",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Use a default logo during SSR to prevent hydration mismatch
  const logoSrc = mounted
    ? resolvedTheme === "dark"
      ? "/logos/Alleato_Logo_Light.png"
      : "/logos/Alleato_Logo_Dark.png"
    : "/logos/Alleato_Logo_Dark.png";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center px-4 pt-6 pb-2">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src={logoSrc}
              alt="Alleato Group"
              width={160}
              height={55}
              className="object-contain"
              priority
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-4">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm font-bold"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name:
              user?.user_metadata?.full_name ||
              user?.email?.split("@")[0] ||
              "User",
            email: user?.email || "user@example.com",
            avatar: user?.user_metadata?.avatar_url || "/placeholder-user.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
