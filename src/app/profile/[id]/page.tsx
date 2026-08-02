import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Mail, GitBranch, Link2, ChevronLeft, FolderCheck } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import ReputationCard from "@/components/reputation/ReputationCard";
import { calculateUserReputation } from "@/lib/reputation/calculator";
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
        applications: { select: { id: true } },
      },
    }),
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

  const reputation = await calculateUserReputation({
    userId: user.id,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    bio: user.bio,
    year: user.year,
    skills: user.skills,
    userProjectsCount: user.projects.length,
    userApplicationsCount: user.applications.length,
  });

  const isCurrentUser = currentUserId === user.id;

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 sm:space-y-8">
        {/* Back */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
          Back to projects
        </Link>

        {/* ── Header row ─────────────────────────────────── */}
        <div className="card p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center font-semibold text-[22px] text-foreground shrink-0 overflow-hidden shadow-sm">
            {user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              ((user?.name || "U").trim()[0] || "U").toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="type-page-title text-[20px] sm:text-[24px]">{user.name}</h1>
            </div>
            <p className="type-meta mt-1">
              {user.department} · Year {user.year}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-start sm:items-end shrink-0">
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

        {/* ── Developer Reputation System Component ──────── */}
        <ReputationCard reputation={reputation} isCurrentUser={isCurrentUser} />

        {/* ── Stat band ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 sm:p-5 text-center space-y-1">
            <p className="type-stat-number !text-[20px] sm:!text-[24px] leading-none">{totalProjects}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Projects Posted</p>
          </div>
          <div className="card p-4 sm:p-5 text-center space-y-1">
            <p className="type-stat-number !text-[20px] sm:!text-[24px] leading-none !text-emerald-500">{doneProjects}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Completed</p>
          </div>
          <div className="card p-4 sm:p-5 text-center space-y-1">
            <p className="type-stat-number !text-[20px] sm:!text-[24px] leading-none !text-indigo-500">{collabCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Collaborations</p>
          </div>
          <div className="card p-4 sm:p-5 text-center space-y-1">
            <p className="type-stat-number !text-[20px] sm:!text-[24px] leading-none">{activeProjects}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Active Now</p>
          </div>
        </div>

        {/* ── About + Skills ───────────────────────────── */}
        <div className="card p-6 sm:p-7 space-y-6">
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

        {/* ── Projects ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="type-section-title text-[16px]">
              Projects by {user?.name ? user.name.trim().split(" ")[0] : "User"}
            </h2>
            {doneProjects > 0 && (
              <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <FolderCheck size={12} /> {doneProjects} Done
              </span>
            )}
          </div>

          {user.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </main>
    </AppShell>
  );
}
