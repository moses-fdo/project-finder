import AppShell from "@/components/AppShell";
import ProjectCard from "@/components/ProjectCard";
import ProjectFilters from "@/components/ProjectFilters";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { departments } from "@/lib/projects";

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
      { title:       { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.department) {
    where.owner = { department: params.department };
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.skill) {
    where.skills = { some: { name: params.skill } };
  }

  const currentUserId = Number((session.user as any).id);

  const [projects, skillsData, unreadNotificationsCount] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { owner: true, skills: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.skill.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.notification.count({
      where: {
        userId: currentUserId,
        read: false,
      },
    }),
  ]);

  const skills = skillsData.map((s: any) => s.name);

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <h1 className="type-page-title text-[22px] sm:text-[28px] mb-1">
              Discover
            </h1>
            <p className="type-meta">
              {projects.length} project{projects.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <Link
            href="/projects/create"
            className="btn-primary text-[12px] py-2 px-4 shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} /> New project
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          {/* Sticky filter rail on desktop; mobile trigger + sheet inside */}
          <ProjectFilters skills={skills} departments={departments} />

          {/* Results */}
          <div className="min-w-0">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project as any}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-12 sm:p-16 text-center max-w-2xl mx-auto">
                <div className="h-12 w-12 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center mx-auto mb-4">
                  <Search size={22} strokeWidth={1.75} className="text-muted-foreground" />
                </div>
                <p className="text-[14px] font-semibold text-foreground mb-1">No projects found</p>
                <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                  Try clearing your filters or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
