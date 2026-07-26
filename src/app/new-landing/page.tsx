import { prisma } from "@/lib/prisma";
import LandingPage from "./NewLandingHero";

export const dynamic = "force-dynamic";

export default async function NewLandingPage() {
  let users = 0, projects = 0, openProjects = 0, events = 0;
  try {
    users        = await prisma.user.count();
    projects     = await prisma.project.count();
    openProjects = await prisma.project.count({ where: { status: "OPEN" } });
    events       = await prisma.event.count();
  } catch { /* DB unreachable — render with zeros */ }

  return <LandingPage stats={{ users, projects, openProjects, events, hackathons: events }} />;
}
