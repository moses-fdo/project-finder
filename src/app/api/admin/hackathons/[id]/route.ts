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
    const hackathonId = Number(resolvedParams.id);

    if (isNaN(hackathonId)) {
      return NextResponse.json({ error: "Invalid hackathon ID." }, { status: 400 });
    }

    // Try deleting from Hackathon model first
    const existingHackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (existingHackathon) {
      await prisma.hackathon.delete({ where: { id: hackathonId } });
      return NextResponse.json({ message: "Hackathon deleted successfully." });
    }

    // Fallback to Event model
    const existingEvent = await prisma.event.findUnique({ where: { id: hackathonId } });
    if (existingEvent) {
      await prisma.event.delete({ where: { id: hackathonId } });
      return NextResponse.json({ message: "Event deleted successfully." });
    }

    return NextResponse.json({ error: "Hackathon or Event not found." }, { status: 404 });
  } catch (error: any) {
    console.error("Delete hackathon error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error." }, { status: 500 });
  }
}
