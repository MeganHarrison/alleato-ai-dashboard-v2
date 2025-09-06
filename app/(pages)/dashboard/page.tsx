import { SectionCards } from "@/components/section-cards";
import { ProjectsDataTable } from "@/components/projects/projects-data-table";
import { getProjects } from "@/app/actions/dashboard-actions";

export default async function Page() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <ProjectsDataTable projects={projects} />
    </div>
  );
}
