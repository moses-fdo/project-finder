import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import DashboardViewClient from "./DashboardViewClient";

interface SearchParams {
  tab?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=Please+log+in+to+access+the+dashboard.");
  }

  const user = session.user;
  const currentUserId = Number((user as any).id);
  const params = await searchParams;
  const activeTab = params.tab || "home";

  /* ── 0MS INSTANT DASHBOARD: ULTRA-FAST PARALLEL BATCH WITHOUT HEAVY JOINS ── */
  const [
    unreadNotificationsCount,
    inboxNotifications,
    profileData,
    projects,
    applications,
    notifications,
    collaborations,
    bookmarks,
    hackathons,
    recommendedProjects,
  ] = await Promise.all([
    // 0: Unread count
    prisma.notification.count({
      where: { userId: currentUserId, read: false },
    }),
    // 1: Inbox notifications
    prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, message: true, read: true, createdAt: true },
    }),
    // 2: Profile data
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: { select: { id: true, name: true } },
      },
    }),
    // 3: User projects
    prisma.project.findMany({
      where: { ownerId: currentUserId },
      take: 15,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        owner: { select: { id: true, name: true, department: true } },
        skills: { select: { id: true, name: true } },
        applications: {
          take: 5,
          select: {
            id: true,
            status: true,
            message: true,
            createdAt: true,
            user: { select: { id: true, name: true, department: true, year: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 4: User applications
    prisma.application.findMany({
      where: { userId: currentUserId },
      take: 15,
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            owner: { select: { id: true, name: true, department: true } },
            skills: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 5: Notifications
    prisma.notification.findMany({
      where: { userId: currentUserId },
      take: 15,
      select: { id: true, type: true, message: true, read: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    // 6: Collaborations directory (FLAT SELECT for ultra speed)
    prisma.user.findMany({
      where: { role: { not: "ADMIN" }, id: { not: currentUserId } },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    // 7: Saved Bookmarks
    prisma.bookmark.findMany({
      where: { userId: currentUserId },
      take: 15,
      select: {
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            owner: { select: { id: true, name: true, department: true } },
            skills: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 8: Hackathons
    prisma.hackathon.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    // 9: Recommended projects
    prisma.project.findMany({
      where: { status: "OPEN", ownerId: { not: currentUserId } },
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        owner: { select: { id: true, name: true, department: true } },
        skills: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Derived fast sidebars
  const myProjectsSidebar = projects.slice(0, 5).map((p) => ({ id: p.id, title: p.title, status: p.status }));
  const myApplicationsSidebar = applications.slice(0, 5).map((a) => ({ id: a.id, status: a.status, project: { id: a.project.id, title: a.project.title } }));
  const myBookmarksSidebar = bookmarks.slice(0, 5).map((b) => ({ project: { id: b.project.id, title: b.project.title } }));
  const recentNotifications = notifications.slice(0, 5);

  return (
    <AppShell user={user} unreadNotifications={unreadNotificationsCount} inboxNotifications={inboxNotifications}>
      <DashboardViewClient
        activeTab={activeTab}
        currentUser={user}
        projects={projects}
        applications={applications}
        notifications={notifications}
        profileData={profileData}
        collaborations={collaborations}
        bookmarks={bookmarks}
        hackathons={hackathons}
        recommendedProjects={recommendedProjects}
        myProjectsSidebar={myProjectsSidebar}
        myApplicationsSidebar={myApplicationsSidebar}
        myBookmarksSidebar={myBookmarksSidebar}
        recentNotifications={recentNotifications}
      />
    </AppShell>
  );
}
