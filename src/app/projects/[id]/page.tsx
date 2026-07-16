import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  Sprout,
  Brain,
  Dumbbell,
  Folder,
} from "lucide-react";
import ProjectDetailClient from "./ProjectDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+project+details.");
  }

  const { id } = await params;
  const projectId = Number(id);
  if (isNaN(projectId)) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, department: true, year: true, bio: true },
      },
      skills: true,
    },
  });
  if (!project) notFound();

  const currentUserId = Number((session.user as any).id);
  const isOwner = currentUserId === project.ownerId;

  // Check existing application
  let hasApplied = false;
  let applicationStatus: string | undefined;
  if (!isOwner) {
    const application = await prisma.application.findUnique({
      where: { projectId_userId: { projectId, userId: currentUserId } },
    });
    if (application) {
      hasApplied = true;
      applicationStatus = application.status;
    }
  }

  // Check existing bookmark
  const existingBookmark = await prisma.bookmark.findUnique({
    where: { userId_projectId: { userId: currentUserId, projectId } },
  });
  const initialBookmarked = !!existingBookmark;

  const unreadNotificationsCount = await prisma.notification.count({
    where: { userId: currentUserId, read: false },
  });

  const iconInfo = getProjectIcon(project.title);
  const Icon = iconInfo.icon;
  const postedTime = getRelativeTimeString(project.createdAt);

  const t = project.title.toLowerCase() + " " + project.description.toLowerCase();
  const category =
    t.includes("eco") || t.includes("track") || t.includes("waste") || t.includes("green") || t.includes("environ") ? "Environment"
    : t.includes("study") || t.includes("buddy") ? "Education"
    : t.includes("fit") || t.includes("health") ? "Health & Fitness"
    : "Software Development";
  const experience = t.includes("rover") ? "Intermediate" : t.includes("kit") || t.includes("begin") ? "Beginner" : "Advanced";
  const type =
    t.includes("web") || t.includes("track") ? "Web App"
    : t.includes("mobile") || t.includes("app") ? "Mobile App"
    : t.includes("rover") || t.includes("ros") ? "Hardware / Robotics"
    : "Software";

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Back to projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main column ──────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Hero card */}
            <div className="card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className={`h-14 w-14 rounded-xl ${iconInfo.bg} border border-border flex items-center justify-center shrink-0`}>
                  <Icon size={26} className={iconInfo.text} />
                </div>

                {/* Bookmark button lives here in main column for non-owners */}
                {!isOwner && (
                  <span className="text-[10px] text-muted-foreground font-medium mt-1 select-none">
                    {/* Placeholder — bookmark toggled from sidebar widget */}
                  </span>
                )}
              </div>

              <div>
                <div className="mb-2">
                  {project.status === "OPEN" ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Looking for team</span>
                  ) : project.status === "FULL" ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">In Progress</span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Closed</span>
                  )}
                </div>
                <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-foreground leading-snug">
                  {project.title}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                  {project.description.split("\n")[0] || ""}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="card p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Category</span>
                  <p className="text-[12px] font-semibold text-foreground">{category}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Type</span>
                  <p className="text-[12px] font-semibold text-foreground">{type}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Experience</span>
                  <p className="text-[12px] font-semibold text-foreground">{experience}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Posted</span>
                  <p className="text-[12px] font-semibold text-foreground">{postedTime}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="card p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Skills &amp; Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="text-[11px] font-medium px-2.5 py-1 rounded bg-secondary border border-border text-muted-foreground"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Full description */}
            <div className="card p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">About this project</h3>
              <div className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            {/* What you'll do */}
            <div className="card p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">What you&apos;ll do</h3>
              <ul className="text-[13px] text-muted-foreground space-y-2 list-disc pl-5">
                <li>Collaborate with the team to define scope and specifications.</li>
                <li>Design, build, and test features according to the project goals.</li>
                <li>Participate in code reviews and weekly syncs.</li>
              </ul>
            </div>

          </div>

          {/* ── Sidebar column ───────────────────────────────── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Apply / bookmark / contact widget — fully interactive client component */}
            <ProjectDetailClient
              projectId={projectId}
              isOwner={isOwner}
              hasApplied={hasApplied}
              applicationStatus={applicationStatus}
              projectStatus={project.status}
              initialBookmarked={initialBookmarked}
              ownerEmail={project.owner.email}
            />

            {/* Owner card */}
            <div className="card p-5 space-y-4">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Owner</h3>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[13px] text-foreground shrink-0">
                  {project.owner.name[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground">
                    <Link href={`/profile/${project.owner.id}`} className="hover:underline">
                      {project.owner.name}
                    </Link>
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {project.owner.department} · Year {project.owner.year}
                  </p>
                </div>
              </div>

              {project.owner.bio && (
                <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-border pl-3">
                  {project.owner.bio}
                </p>
              )}
            </div>

          </div>
        </div>
      </main>
    </AppShell>
  );
}

/* ── helpers ──────────────────────────────────────────────── */

function getProjectIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("eco") || t.includes("track") || t.includes("waste") || t.includes("green") || t.includes("environ"))
    return { icon: Sprout,   bg: "bg-green-500/10",  text: "text-green-600 dark:text-green-400" };
  if (t.includes("study") || t.includes("buddy") || t.includes("learn") || t.includes("book") || t.includes("ai") || t.includes("companion"))
    return { icon: Brain,    bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
  if (t.includes("fit") || t.includes("gym") || t.includes("health") || t.includes("workout"))
    return { icon: Dumbbell, bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" };
  return { icon: Folder, bg: "bg-secondary", text: "text-foreground" };
}

function getRelativeTimeString(date: Date) {
  const diffMs    = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  < 60) return `${diffMins  || 1}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
