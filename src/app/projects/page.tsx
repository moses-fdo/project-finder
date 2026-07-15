import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import ProjectFilters from "@/components/ProjectFilters";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface SearchParams {
  search?: string;
  department?: string;
  status?: string;
  skill?: string;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+projects.");
  }

  const params = await searchParams;

  const where: any = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.department) {
    where.owner = {
      department: params.department,
    };
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.skill) {
    where.skills = {
      some: {
        name: params.skill,
      },
    };
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: true,
      skills: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const skillsData = await prisma.skill.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const skills = skillsData.map((s) => s.name);

  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Food Processing Technology"
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Discover Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore ongoing student and faculty initiatives, and apply to join teams.
          </p>
        </div>

        <ProjectFilters skills={skills} departments={departments} />

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project as any} />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-lg text-center border border-border bg-card">
            <p className="text-base font-semibold text-foreground mb-1">
              No projects found.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Try adjusting your search criteria or clear active filters.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
