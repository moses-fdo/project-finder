import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();

  // Hard gate — non-admins and unauthenticated users are kicked out
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const currentUserId = Number(session.user.id);

  const [
    unreadNotifications,
    totalUsers,
    totalProjects,
    totalApplications,
    totalNotifications,

    users,
    projects,
    events,
    allowedEmails,
    idVerificationRequests,
    abuseLogs,
  ] = await Promise.all([
    prisma.notification.count({ where: { userId: currentUserId, read: false } }),
    prisma.user.count(),
    prisma.project.count(),
    prisma.application.count(),
    prisma.notification.count(),

    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        role: true,
        verified: true,
        createdAt: true,
        _count: {
          select: { projects: true, applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, department: true } },
        skills: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    }),

    prisma.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
    }),

    prisma.idVerificationRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),

    prisma.abusiveMessageLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            year: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const stats = { totalUsers, totalProjects, totalApplications, totalNotifications };

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotifications}>
      <AdminClient
        stats={stats}
        users={users}
        projects={projects}
        events={events}
        hackathons={events}
        allowedEmails={allowedEmails}
        idVerificationRequests={idVerificationRequests}
        abuseLogs={abuseLogs}
      />
    </AppShell>
  );
}
