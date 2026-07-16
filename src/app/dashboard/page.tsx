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

  let projects: any[] = [];
  let applications: any[] = [];
  let notifications: any[] = [];
  let profileData: any = null;
  let collaborations: any[] = [];
  let bookmarks: any[] = [];
  // Home-tab sidebar data
  let recommendedProjects: any[] = [];
  let myProjectsSidebar: any[] = [];
  let myApplicationsSidebar: any[] = [];
  let myBookmarksSidebar: any[] = [];
  let recentNotifications: any[] = [];

  const unreadNotificationsCount = await prisma.notification.count({
    where: { userId: currentUserId, read: false },
  });

  // Always fetch recent notifications for the inbox dropdown
  const inboxNotifications = await prisma.notification.findMany({
    where: { userId: currentUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, message: true, read: true, createdAt: true },
  });

  /* ── HOME ────────────────────────────────────────────────── */
  if (activeTab === "home") {
    recommendedProjects = await prisma.project.findMany({
      where: { status: "OPEN", ownerId: { not: currentUserId } },
      take: 3,
      include: {
        owner: { select: { id: true, name: true, email: true, department: true, year: true, bio: true } },
        skills: true,
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    });

    myProjectsSidebar = await prisma.project.findMany({
      where: { ownerId: currentUserId },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    myApplicationsSidebar = await prisma.application.findMany({
      where: { userId: currentUserId },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    myBookmarksSidebar = await prisma.bookmark.findMany({
      where: { userId: currentUserId },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    recentNotifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  /* ── MY PROJECTS ─────────────────────────────────────────── */
  if (activeTab === "projects" || activeTab === "home") {
    projects = await prisma.project.findMany({
      where: { ownerId: currentUserId },
      include: {
        skills: true,
        applications: {
          include: {
            user: { select: { id: true, name: true, department: true, year: true, bio: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ── APPLICATIONS ────────────────────────────────────────── */
  if (activeTab === "applications") {
    applications = await prisma.application.findMany({
      where: { userId: currentUserId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ── COLLABORATIONS — people finder ─────────────────────── */
  if (activeTab === "collaborations") {
    collaborations = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        verified: true,
        role: { not: "ADMIN" },   // never show admin accounts
      },
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
        projects: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /* ── NOTIFICATIONS ───────────────────────────────────────── */
  if (activeTab === "notifications") {
    notifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ── BOOKMARKS ───────────────────────────────────────────── */
  if (activeTab === "bookmarks") {
    bookmarks = await prisma.bookmark.findMany({
      where: { userId: currentUserId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, department: true, year: true } },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ── PROFILE ─────────────────────────────────────────────── */
  if (activeTab === "profile" || activeTab === "home") {
    profileData = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { skills: true },
    });
  }

  // Always ensure profileData is loaded
  if (!profileData) {
    profileData = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { skills: true },
    });
  }

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
        recommendedProjects={recommendedProjects}
        myProjectsSidebar={myProjectsSidebar}
        myApplicationsSidebar={myApplicationsSidebar}
        myBookmarksSidebar={myBookmarksSidebar}
        recentNotifications={recentNotifications}
      />
    </AppShell>
  );
}
