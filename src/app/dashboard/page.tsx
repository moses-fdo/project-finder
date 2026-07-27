import AppShell from "@/components/AppShell";
import DashboardViewClient from "./DashboardViewClient";
import { auth } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

// Shared select shape for project cards
const projectCardSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  owner: { select: { id: true, name: true, department: true } },
  skills: { select: { id: true, name: true } },
} satisfies Prisma.ProjectSelect;

// ── In-Memory Fast TTL Cache (5 seconds, keyed by userId + tab) ──
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5000;

function getValidCache(userId: number, tab: string): any | null {
  const key = `${userId}:${tab}`;
  const cached = dashboardCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function setDashboardCache(userId: number, tab: string, data: any) {
  const key = `${userId}:${tab}`;
  dashboardCache.set(key, { data, timestamp: Date.now() });
}

export function clearUserDashboardCache(userId: number) {
  for (const key of dashboardCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      dashboardCache.delete(key);
    }
  }
}

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+the+dashboard.");
  }

  const user = session.user;
  let currentUserId = Number((user as any).id);

  // Fallback resolving if session user ID is missing
  if ((isNaN(currentUserId) || !currentUserId) && session.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (dbUser) currentUserId = dbUser.id;
  }

  const params = await searchParams;
  const activeTab = params.tab || "home";

  /* ── TAB-CONDITIONAL CACHED FETCHING ── */
  let tabData = getValidCache(currentUserId, activeTab);

  if (!tabData) {
    // Determine which tab-specific queries to execute
    const needsCollaborations = activeTab === "home" || activeTab === "collaborations";
    const needsEvents = activeTab === "home" || activeTab === "events" || activeTab === "hackathons";
    const needsBookmarks = activeTab === "home" || activeTab === "bookmarks";
    const needsProjects = activeTab === "home" || activeTab === "projects";
    const needsApplications = activeTab === "home" || activeTab === "applications";
    const needsInvitations = activeTab === "home" || activeTab === "invitations";
    const needsRecommended = activeTab === "home";

    tabData = await safeQuery(
      () =>
        Promise.all([
          // 0: Unread notifications count
          prisma.notification.count({
            where: { userId: currentUserId, read: false },
          }),
          // 1: Profile data
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
          // 2: Notifications (fetched once, take 15)
          prisma.notification.findMany({
            where: { userId: currentUserId },
            take: 15,
            select: { id: true, type: true, message: true, link: true, read: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          }),
          // 3: User projects (if needed)
          needsProjects
            ? prisma.project.findMany({
                where: { ownerId: currentUserId },
                take: 15,
                select: {
                  ...projectCardSelect,
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
              })
            : Promise.resolve([]),
          // 4: User applications (if needed)
          needsApplications
            ? prisma.application.findMany({
                where: { userId: currentUserId },
                take: 15,
                select: {
                  id: true,
                  status: true,
                  message: true,
                  createdAt: true,
                  project: { select: projectCardSelect },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 5: Collaborations directory (if needed)
          needsCollaborations
            ? prisma.user.findMany({
                take: 200,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  year: true,
                  bio: true,
                  githubUrl: true,
                  linkedinUrl: true,
                  profileImage: true,
                  availability: true,
                  skills: { select: { id: true, name: true } },
                  projects: { select: { id: true, status: true } },
                  applications: { select: { id: true, status: true } },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 6: Saved Bookmarks (if needed)
          needsBookmarks
            ? prisma.bookmark.findMany({
                where: { userId: currentUserId },
                take: 15,
                select: {
                  createdAt: true,
                  project: { select: projectCardSelect },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 7: Events (if needed)
          needsEvents
            ? prisma.event.findMany({
                take: 20,
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 8: Recommended projects (if needed)
          needsRecommended
            ? prisma.project.findMany({
                where: { status: "OPEN", ownerId: { not: currentUserId } },
                take: 3,
                select: {
                  ...projectCardSelect,
                  _count: { select: { applications: true } },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 9: Received invitations (if needed)
          needsInvitations
            ? prisma.invitation.findMany({
                where: { receiverId: currentUserId },
                take: 20,
                select: {
                  id: true,
                  message: true,
                  role: true,
                  status: true,
                  createdAt: true,
                  project: { select: projectCardSelect },
                  sender: { select: { id: true, name: true, department: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
          // 10: Sent invitations (if needed)
          needsInvitations
            ? prisma.invitation.findMany({
                where: { senderId: currentUserId },
                take: 20,
                select: {
                  id: true,
                  message: true,
                  role: true,
                  status: true,
                  createdAt: true,
                  project: { select: { id: true, title: true } },
                  receiver: { select: { id: true, name: true, department: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),
        ]),
      [0, null, [], [], [], [], [], [], [], [], []]
    );
    setDashboardCache(currentUserId, activeTab, tabData);
  }

  const [
    unreadNotificationsCount,
    profileData,
    notifications,
    projects,
    applications,
    collaborations,
    bookmarks,
    hackathons,
    recommendedProjects,
    receivedInvitations,
    sentInvitations,
  ] = tabData;

  const events = hackathons; // destructuring alias
  const inboxNotifications = (notifications || []).slice(0, 10); // Slice top 10 for dropdown navbar

  // Derived fast sidebars
  const myProjectsSidebar = (projects || []).slice(0, 5).map((p: any) => ({ id: p.id, title: p.title, status: p.status }));
  const myApplicationsSidebar = (applications || []).slice(0, 5).map((a: any) => ({ id: a.id, status: a.status, project: { id: a.project.id, title: a.project.title } }));
  const myBookmarksSidebar = (bookmarks || []).slice(0, 5).map((b: any) => ({ project: { id: b.project.id, title: b.project.title } }));
  const recentNotifications = (notifications || []).slice(0, 5);

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
        events={events}
        hackathons={events}
        recommendedProjects={recommendedProjects}
        receivedInvitations={receivedInvitations}
        sentInvitations={sentInvitations}
        myProjectsSidebar={myProjectsSidebar}
        myApplicationsSidebar={myApplicationsSidebar}
        myBookmarksSidebar={myBookmarksSidebar}
        recentNotifications={recentNotifications}
      />
    </AppShell>
  );
}
