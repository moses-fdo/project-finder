import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
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
  const activeTab = params.tab || "projects";

  let projects: any[] = [];
  let applications: any[] = [];
  let notifications: any[] = [];
  let profileData: any = null;
  let adminData: any = undefined;

  if (activeTab === "projects") {
    projects = await prisma.project.findMany({
      where: { ownerId: currentUserId },
      include: {
        skills: true,
        applications: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                year: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (activeTab === "applications") {
    applications = await prisma.application.findMany({
      where: { userId: currentUserId },
      include: {
        project: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (activeTab === "notifications") {
    notifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
    });
  } else if (activeTab === "profile") {
    profileData = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { skills: true },
    });
  } else if (activeTab === "admin" && (user as any).role === "ADMIN") {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        role: true,
        verified: true,
      },
      orderBy: { name: "asc" },
    });

    const allProjects = await prisma.project.findMany({
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    adminData = {
      users: allUsers,
      projects: allProjects,
    };
  }

  if (!profileData) {
    profileData = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { skills: true },
    });
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Sidebar userRole={(user as any).role} />

        <div className="flex-1">
          <DashboardViewClient
            activeTab={activeTab}
            currentUser={user}
            projects={projects}
            applications={applications}
            notifications={notifications}
            profileData={profileData}
            adminData={adminData}
          />
        </div>
      </main>
    </>
  );
}
