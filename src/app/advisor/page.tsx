import AppShell from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdvisorClient from "./AdvisorClient";

export default async function AdvisorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+the+AI+Advisor.");
  }

  return (
    <AppShell>
      <AdvisorClient />
    </AppShell>
  );
}