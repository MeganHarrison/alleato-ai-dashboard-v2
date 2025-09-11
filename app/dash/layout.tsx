import Chat from "@/components/chat";
import { MobileChat } from "@/components/chat/mobile-chat";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import Notifications from "@/components/dashboard/notifications";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import Widget from "@/components/dashboard/widget";
import { SidebarProvider } from "@/components/ui/sidebar";
import { V0Provider } from "@/lib/v0-context";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";
import { Metadata } from "next";

const mockData = mockDataJson as MockData;

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false;

export const metadata: Metadata = {
  title: {
    template: "%s – M.O.N.K.Y OS",
    default: "M.O.N.K.Y OS",
  },
  description:
    "The ultimate OS for rebels. Making the web for brave individuals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <V0Provider isV0={isV0}>
      <SidebarProvider>
        {/* Mobile Header - only visible on mobile */}
        <MobileHeader mockData={mockData} />

        {/* Desktop Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
          <div className="hidden lg:block col-span-2 top-0 relative">
            <DashboardSidebar />
          </div>
          <div className="col-span-1 lg:col-span-7">{children}</div>
          <div className="col-span-3 hidden lg:block">
            <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
              <Widget widgetData={mockData.widgetData} />
              <Notifications initialNotifications={mockData.notifications} />
              <Chat />
            </div>
          </div>
        </div>

        {/* Mobile Chat - floating CTA with drawer */}
        <MobileChat />
      </SidebarProvider>
    </V0Provider>
  );
}
