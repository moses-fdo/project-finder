import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import ProjectCreateForm from "./ProjectCreateForm";

export default async function CreateProjectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+create+a+project.");
  }

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: Number((session.user as any).id),
      read: false,
    },
  });

  return (
    <AppShell user={session.user} unreadNotifications={unreadNotificationsCount}>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="type-page-title text-[22px] sm:text-[28px] mb-1">
            New project
          </h1>
          <p className="type-meta">
            Share your idea and specify the skills you&apos;re looking for in collaborators.
          </p>
        </div>

        <ProjectCreateForm userId={Number((session.user as any).id)} user={session.user} />
      </main>
    </AppShell>
  );
}
