import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProjectIcon } from "@/lib/projects";
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

  const currentUserId = Number((session.user as any).id);

  const [project, application, unreadNotificationsCount] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, department: true, year: true, bio: true },
        },
        skills: true,
      },
    }),
    prisma.application.findUnique({
      where: { projectId_userId: { projectId, userId: currentUserId } },
    }),
    prisma.notification.count({
      where: { userId: currentUserId, read: false },
    }),
  ]);

  if (!project) notFound();

  const isOwner = currentUserId === project.ownerId;
  const hasApplied = !isOwner && !!application;
  const applicationStatus = !isOwner && application ? application.status : undefined;

  const iconInfo = getProjectIcon(project.title);
  const Icon = iconInfo.icon;
  const postedTime = getRelativeTimeString(project.createdAt);

  const t = (project.title || "").toLowerCase() + " " + (project.description || "").toLowerCase();
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <div className="mb-7">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Back to projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main column — first in DOM for tab order and reading, left side on desktop ── */}
          <div className="lg:col-span-8 space-y-5 order-2 lg:order-1">

            {/* Hero card */}
            <div className="card p-6 sm:p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`h-14 w-14 rounded-2xl ${iconInfo.bg} border border-border flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon size={26} className={iconInfo.text} />
                </div>
              </div>

              <div>
                <div className="mb-2.5">
                  {project.status === "OPEN" ? (
                    <span className="badge badge-green">Looking for team</span>
                  ) : project.status === "FULL" ? (
                    <span className="badge badge-yellow">In Progress</span>
                  ) : (
                    <span className="badge badge-red">Closed</span>
                  )}
                </div>
                <h1 className="type-page-title text-[22px] sm:text-[28px] mb-2 leading-tight">
                  {project.title}
                </h1>
              </div>
            </div>

            {/* Full description */}
            <div className="card p-5 sm:p-6 space-y-4">
              <h3 className="section-label mb-0">About this project</h3>
              <div className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </div>


            {/* Skills */}
            <div className="card p-5 sm:p-6 space-y-4">
              <h3 className="section-label mb-0">Skills &amp; Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((skill: any) => (
                  <span
                    key={skill.id}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-secondary border border-border text-muted-foreground"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="card p-5 sm:p-6 space-y-4">
              <h3 className="section-label mb-0">Project Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                <div className="space-y-1">
                  <span className="type-meta block">Slots Filled</span>
                  <p className="text-[12px] font-semibold text-foreground">
                    {project.teamSize ? `${project.slotsFilled ?? 0} / ${project.teamSize}` : `${project.slotsFilled ?? 0} members`}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="type-meta block">Category</span>
                  <p className="text-[12px] font-semibold text-foreground">{category}</p>
                </div>
                <div className="space-y-1">
                  <span className="type-meta block">Type</span>
                  <p className="text-[12px] font-semibold text-foreground">{type}</p>
                </div>
                <div className="space-y-1">
                  <span className="type-meta block">Experience</span>
                  <p className="text-[12px] font-semibold text-foreground">{experience}</p>
                </div>
                <div className="space-y-1">
                  <span className="type-meta block">Posted</span>
                  <p className="text-[12px] font-semibold text-foreground">{postedTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar column ── */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex flex-col gap-4">
              {/* Owner card */}
              <div className="card p-5 space-y-4">
                <h3 className="section-label mb-0">Project Owner</h3>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[13px] text-foreground shrink-0 shadow-sm">
                    {((project.owner?.name || "U").trim()[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-foreground">
                      <Link href={`/profile/${project.owner.id}`} className="hover:underline">
                        {project.owner.name}
                      </Link>
                    </h4>
                    <p className="type-meta mt-0.5">
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

              {/* Apply / manage widget */}
              <ProjectDetailClient
                projectId={projectId}
                isOwner={isOwner}
                hasApplied={hasApplied}
                applicationStatus={applicationStatus}
                projectStatus={project.status}
                ownerEmail={project.owner.email}
                projectData={project}
              />
            </div>
          </div>

        </div>
      </main>
    </AppShell>
  );
}

/* ── helpers ──────────────────────────────────────────────── */

function getRelativeTimeString(date: Date) {
  const diffMs    = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  < 60) return `${diffMins  || 1}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
