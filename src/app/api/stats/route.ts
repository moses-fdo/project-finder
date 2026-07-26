import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never statically prerender — this route hits the DB at runtime
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, projects, openProjects, events] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: "OPEN" } }),
      prisma.event.count(),
    ]);
    return NextResponse.json({ users, projects, openProjects, events, hackathons: events });
  } catch {
    // DB unreachable — return zeros rather than a 500
    return NextResponse.json({ users: 0, projects: 0, openProjects: 0, events: 0, hackathons: 0 });
  }
}
