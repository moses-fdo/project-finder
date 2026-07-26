import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+messages.");
  }

  const userId = Number((session.user as any).id);

  const [unreadNotificationsCount, inboxNotifications] = await Promise.all([
    prisma.notification.count({
      where: { userId, read: false },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, message: true, link: true, read: true, createdAt: true },
    }),
  ]);

  return (
    <AppShell
      user={session.user}
      unreadNotifications={unreadNotificationsCount}
      inboxNotifications={inboxNotifications}
    >
      <MessagesClient userId={userId} />
    </AppShell>
  );
}