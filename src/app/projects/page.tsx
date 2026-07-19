import AppShell from "@/components/AppShell";
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

  const [projects, skillsData, unreadNotificationsCount, userBookmarks] = await Promise.all([
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
    prisma.bookmark.findMany({
      where: { userId: currentUserId },
      select: { projectId: true },
    }),
  ]);

  const bookmarkedIds = new Set(userBookmarks.map((b) => b.projectId));

  const skills = skillsData.map((s) => s.name);

  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Food Processing Technology",
  ];

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-foreground mb-0.5">
              Discover
            </h1>
            <p className="text-[12px] text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <ProjectFilters skills={skills} departments={departments} />

        {/* Results */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project as any}
                initialBookmarked={bookmarkedIds.has(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <p className="text-[14px] font-medium text-foreground mb-1">No projects found</p>
            <p className="text-[12px] text-muted-foreground">
              Try clearing your filters or check back later.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
