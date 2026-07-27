import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandingPage from "./new-landing/NewLandingHero";

export const dynamic = "force-dynamic";

export default async function Home() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // If JWT session cookie is invalid or expired, catch error gracefully
  }
  if (session) redirect("/dashboard");

  // Run sequentially — Neon serverless wakes one connection at a time,
  // parallel Promise.all spikes the pool and causes timeout on cold start.
  let users = 0;
  let projects = 0;
  let openProjects = 0;
  let events = 0;

  try {
    users        = await prisma.user.count();
    projects     = await prisma.project.count();
    openProjects = await prisma.project.count({ where: { status: "OPEN" } });
    events       = await prisma.event.count();
  } catch {
    // DB unavailable — render page with zeros rather than 500ing
  }

  return (
    <LandingPage stats={{ users, projects, openProjects, events, hackathons: events }} />
  );
}
