import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "FM Global 8-34 Interactive Guide | ASRS Protection",
  description:
    "Comprehensive FM Global 8-34 ASRS protection requirements with interactive decision tree and table navigator",
};

export default function FMGlobalPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="space-y-6">
        <PageHeader
          title="FM Global Property Loss Prevention Data Sheets 8-34"
          description="Revised July 2024"
        />
        
        {/* TODO: Implement table components */}
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-2xl font-semibold mb-4">FM Global 8-34 Tables Coming Soon</h2>
          <p>Interactive table navigation and decision trees are under development.</p>
        </div>
      </div>
    </div>
  );
}