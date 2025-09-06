import { getCurrentProjects } from "@/app/actions/dashboard-actions";
import { ProjectsDataTable } from "@/components/projects/projects-data-table";
import { SectionCards } from "@/components/section-cards";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardHome() {
  const currentProjects = await getCurrentProjects();
  const services = [
    {
      title: "ASRS GURU",
      description: "Navigating FM Global 8-34 with clarity and confidence.",
      href: "/asrs-design",
      isExternal: false,
    },
    {
      title: "Project Maestro",
      description:
        "Your right-hand strategist, research assistant, & business brain extension, all in one.",
      href: "/projects-dashboard",
      isExternal: false,
    },
    {
      title: "Company Knowledge Base",
      description: "Central hub for all SOP's and documentation",
      href: "http://localhost:4321/",
      isExternal: true,
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-[80px] font-didot text-[#DB802D] mb-8">hello.</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) =>
          service.isExternal ? (
            <a
              href={service.href}
              key={index}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-[14px_27px_45px_8px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6">
                  <h3 className="text-[#44403C] font-sans text-xs font-bold tracking-[2px] leading-6 uppercase mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </CardContent>
              </Card>
            </a>
          ) : (
            <Link
              href={service.href}
              key={index}
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-[14px_27px_45px_8px_rgba(0,0,0,0.07)]">
                <CardContent className="p-6">
                  <h3 className="text-[#44403C] font-sans text-xs font-bold tracking-[2px] leading-6 uppercase mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      <div className="flex flex-col gap-6 mt-12">
        <div>
          <ProjectsDataTable projects={currentProjects} />
        </div>
        <SectionCards />
      </div>
    </div>
  );
}
