import DashboardChart from "@/components/dashboard/chart";
import DashboardPageLayout from "@/components/dashboard/layout";
import RebelsRanking from "@/components/dashboard/rebels-ranking";
import SecurityStatus from "@/components/dashboard/security-status";
import DashboardStat from "@/components/dashboard/stat";
import BoomIcon from "@/components/icons/boom";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";

const mockData = mockDataJson as MockData;

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
};

export default function DashboardOverview() {
  return (
    <DashboardPageLayout
      header={{
        title: "Alleato",
        description: "Last updated 12:05",
        icon: BracketsIcon,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {mockData.dashboardStats.map((stat, index) => (
          <DashboardStat
            key={index}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={iconMap[stat.icon as keyof typeof iconMap]}
            tag={stat.tag}
            intent={stat.intent}
            direction={stat.direction}
          />
        ))}
      </div>

      {/* Main 2-column grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RebelsRanking rebels={mockData.rebelsRanking} />
        <SecurityStatus statuses={mockData.securityStatus} />
      </div>

      <div className="mb-6">
        <DashboardChart />
      </div>
    </DashboardPageLayout>
  );
}
