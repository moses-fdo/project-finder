import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Mail, GitBranch, Link2, ChevronLeft } from "lucide-react";
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: true,
      projects: {
        include: { owner: true, skills: true },
      },
    },
  });

  if (!user) notFound();

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: Number((session.user as any).id),
      read: false,
    },
  });

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
              <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center font-semibold text-[22px] text-foreground mx-auto mb-4">
                {user.name[0].toUpperCase()}
              </div>
              <h1 className="text-[16px] font-semibold text-foreground mb-0.5">{user.name}</h1>
              <p className="text-[12px] text-muted-foreground mb-3">
                {user.department} · Year {user.year}
              </p>
              <span className="badge badge-gray">{user.role}</span>
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
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                Projects by {user.name.split(" ")[0]}
              </h2>

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
