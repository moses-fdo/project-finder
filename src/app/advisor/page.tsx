import AppShell from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdvisorClient from "./AdvisorClient";

export default async function AdvisorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+the+AI+Advisor.");
  }

  const user = session.user;
  let currentUserId = Number(user.id);

  if ((isNaN(currentUserId) || !currentUserId) && session.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (dbUser) currentUserId = dbUser.id;
  }

  const sanitizedUser = {
    ...user,
    id: currentUserId,
  };

  return (
    <AppShell user={sanitizedUser} unreadNotifications={0} inboxNotifications={[]}>
      <AdvisorClient />
    </AppShell>
  );
}