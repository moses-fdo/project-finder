import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Mail, GitBranch, Link2, ChevronLeft, FolderCheck, Users, Folder } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+profiles.");
  }

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) notFound();

  let currentUserId = Number((session.user as any)?.id);
  if ((isNaN(currentUserId) || !currentUserId) && session.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (dbUser) currentUserId = dbUser.id;
  }

  const [user, collabCount, unreadNotificationsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        projects: {
          include: { owner: true, skills: true },
        },
      },
    }),
    // Count collaborations: projects this user applied to that were ACCEPTED
    prisma.application.count({
      where: {
        userId,
        status: "ACCEPTED",
      },
    }),
    !isNaN(currentUserId) && currentUserId > 0
      ? prisma.notification.count({
          where: {
            userId: currentUserId,
            read: false,
          },
        })
      : Promise.resolve(0),
  ]);

  if (!user) notFound();

  const totalProjects = user.projects.length;
  const doneProjects = user.projects.filter((p) => p.status === "DONE").length;
  const activeProjects = user.projects.filter((p) => p.status === "OPEN").length;

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
          Back to projects
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Left column: identity ──────────────────────── */}
          <div className="space-y-4">

            {/* Avatar + name card */}
            <div className="card p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center font-semibold text-[22px] text-foreground mx-auto mb-4 overflow-hidden">
                {user.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  ((user?.name || "U").trim()[0] || "U").toUpperCase()
                )}
              </div>
              <h1 className="text-[16px] font-semibold text-foreground mb-0.5">{user.name}</h1>
              <p className="text-[12px] text-muted-foreground mb-3">
                {user.department} · Year {user.year}
              </p>
              <span className="badge badge-gray">{user.role}</span>
            </div>

            {/* Stats card */}
            <div className="card p-5 space-y-3">
              <p className="section-label">Stats</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[16px] font-extrabold text-foreground">
                    <Folder size={13} className="text-muted-foreground" />
                    {totalProjects}
                  </div>
                  <p className="text-[9.5px] text-muted-foreground font-medium leading-tight">Projects</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[16px] font-extrabold text-emerald-500">
                    <FolderCheck size={13} />
                    {doneProjects}
                  </div>
                  <p className="text-[9.5px] text-muted-foreground font-medium leading-tight">Completed</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[16px] font-extrabold text-indigo-500">
                    <Users size={13} />
                    {collabCount}
                  </div>
                  <p className="text-[9.5px] text-muted-foreground font-medium leading-tight">Collabs</p>
                </div>
              </div>

              {activeProjects > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{activeProjects}</span> active project{activeProjects !== 1 ? "s" : ""} currently open
                  </p>
                </div>
              )}
            </div>

            {/* Contact card */}
            <div className="card p-5 space-y-3">
              <p className="section-label">Contact</p>
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors break-all"
              >
                <Mail size={13} strokeWidth={1.75} className="shrink-0" />
                {user.email}
              </a>
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitBranch size={13} strokeWidth={1.75} className="shrink-0" />
                  GitHub
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Link2 size={13} strokeWidth={1.75} className="shrink-0" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* ── Right column: bio, skills, projects ───────── */}
          <div className="md:col-span-2 space-y-5">

            {/* Bio + skills */}
            <div className="card p-6 space-y-5">
              <div>
                <p className="section-label mb-2">About</p>
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {user.bio || <span className="text-muted-foreground italic">No bio added yet.</span>}
                </p>
              </div>

              {user.skills.length > 0 && (
                <div>
                  <p className="section-label mb-3">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Projects by {user?.name ? user.name.trim().split(" ")[0] : "User"}
                </h2>
                {doneProjects > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <FolderCheck size={12} /> {doneProjects} Done
                  </span>
                )}
              </div>

              {user.projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.projects.map((project) => (
                    <ProjectCard key={project.id} project={project as any} />
                  ))}
                </div>
              ) : (
                <div className="card p-10 text-center">
                  <p className="text-[13px] text-muted-foreground">No projects posted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
