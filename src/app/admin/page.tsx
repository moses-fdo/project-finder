import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();

  // Hard gate — non-admins and unauthenticated users are kicked out
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    totalProjects,
    totalApplications,
    totalNotifications,

    users,
    projects,
  ] = await Promise.all([
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
  ]);

  const stats = { totalUsers, totalProjects, totalApplications, totalNotifications };

  return (
    <AdminClient
      stats={stats}
      users={users}
      projects={projects}
    />
  );
}
