import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const resolvedParams = await params;
    const eventId = Number(resolvedParams.id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    // Try deleting from Event model first
    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (existingEvent) {
      await prisma.event.delete({ where: { id: eventId } });
      return NextResponse.json({ message: "Event deleted successfully." });
    }

    // Fallback to Hackathon model
    const existingHackathon = await prisma.hackathon.findUnique({ where: { id: eventId } });
    if (existingHackathon) {
      await prisma.hackathon.delete({ where: { id: eventId } });
      return NextResponse.json({ message: "Hackathon deleted successfully." });
    }

    return NextResponse.json({ error: "Event or Hackathon not found." }, { status: 404 });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error." }, { status: 500 });
  }
}
