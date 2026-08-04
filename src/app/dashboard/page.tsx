import AppShell from "@/components/AppShell";
import DashboardViewClient from "./DashboardViewClient";
import { auth } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { calculateUserReputation } from "@/lib/reputation/calculator";

// Shared select shape for project cards
const projectCardSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  ownerId: true,
  owner: { select: { id: true, name: true, email: true, department: true, githubUrl: true } },
  skills: { select: { id: true, name: true } },
} satisfies Prisma.ProjectSelect;

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string; collabCursor?: string; collabPage?: string; collabLimit?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+the+dashboard.");
  }

  const user = session.user;
  let currentUserId = Number(user.id);

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

  const needsCollaborations = activeTab === "home" || activeTab === "collaborations";
  const needsEvents = activeTab === "home" || activeTab === "events" || activeTab === "hackathons";
  const needsProjects = activeTab === "home" || activeTab === "projects";
  const needsApplications = activeTab === "home" || activeTab === "applications";
  const needsInvitations = activeTab === "home" || activeTab === "invitations";
  const needsRecommended = activeTab === "home";

  const collabPage = params.collabPage ? Number(params.collabPage) : 1;
  const collabLimit = params.collabLimit ? Number(params.collabLimit) : 24;

  const tabData = await safeQuery(
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
          // 3: Campus projects (all projects uploaded across campus)
          needsProjects
            ? prisma.project.findMany({
                take: 100,
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
          // 5: Collaborations directory (offset-based pagination)
          needsCollaborations
            ? prisma.user.findMany({
                skip: (collabPage - 1) * collabLimit,
                take: collabLimit,
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
          // 6: Events (if needed)
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
          // 11: Total collaborations count
          needsCollaborations
            ? prisma.user.count()
            : Promise.resolve(0),
        ]),
      [0, null, [], [], [], [], [], [], [], [], 0]
    );

  const [
    unreadNotificationsCount,
    profileData,
    notifications,
    projects,
    applications,
    collaborations,
    hackathons,
    recommendedProjects,
    receivedInvitations,
    sentInvitations,
    totalCollabs = 0,
  ] = tabData;

  const events = hackathons; // destructuring alias

  const people = Array.isArray(collaborations) ? collaborations : [];

  const inboxNotifications = (notifications || []).slice(0, 10); // Slice top 10 for dropdown navbar

  const recentNotifications = (notifications || []).slice(0, 5);

  // Pre-compute reputations server-side for all collaborators using the same
  // calculateUserReputation function as the profile page so scores match.
  // GitHub API calls are cached by Next.js (revalidate: 3600) — fast after first load.
  let peopleWithReputation: any[] = people;
  if (needsCollaborations && Array.isArray(people) && people.length > 0) {
    const repResults = await Promise.allSettled(
      people.map((u: any) =>
        calculateUserReputation({
          userId: u.id,
          githubUrl: u.githubUrl,
          linkedinUrl: u.linkedinUrl,
          bio: u.bio,
          year: u.year,
          skills: u.skills,
          userProjectsCount: u.projects?.length || 0,
          userApplicationsCount: u.applications?.length || 0,
        })
      )
    );
    peopleWithReputation = people.map((u: any, i: number) => {
      const result = repResults[i];
      if (result.status === "fulfilled") {
        const rep = result.value;
        return {
          ...u,
          // Inject reputation so getDeveloperReputation() reads from this
          // object (path 1) instead of falling back to the hash fallback
          reputation: {
            score: rep.score,
            stars: rep.stars,
            tier: rep.tier,
            githubConnected: rep.githubConnected,
          },
        };
      }
      return u;
    });
  }

  console.log("SERVER SIDE DEBUG:", {
    userId: user.id,
    userType: typeof user.id,
    userEmail: user.email,
    collaborationsLength: peopleWithReputation.length,
    collaborationsIds: peopleWithReputation.map(u => ({ id: u.id, name: u.name, email: u.email }))
  });

  return (
    <AppShell user={user} unreadNotifications={unreadNotificationsCount} inboxNotifications={inboxNotifications}>
<DashboardViewClient
         activeTab={activeTab}
         currentUser={user}
         projects={projects}
         applications={applications}
         notifications={notifications}
         profileData={profileData}
         collaborations={peopleWithReputation}
         collabPage={collabPage}
         collabLimit={collabLimit}
         totalCollabs={totalCollabs}
           events={events}
          hackathons={events}
          recommendedProjects={recommendedProjects}
          receivedInvitations={receivedInvitations}
          sentInvitations={sentInvitations}
          recentNotifications={recentNotifications}
       />
    </AppShell>
  );
}
