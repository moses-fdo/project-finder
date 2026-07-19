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

    if (!currentUser || (currentUser as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const hackathonId = Number(id);

    if (isNaN(hackathonId)) {
      return NextResponse.json({ error: "Invalid hackathon ID." }, { status: 400 });
    }

    await prisma.hackathon.delete({
      where: { id: hackathonId },
    });

    return NextResponse.json({ message: "Hackathon deleted successfully." });
  } catch (error: any) {
    console.error("Delete hackathon error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
