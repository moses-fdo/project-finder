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
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const userIdToDelete = Number(id);

    const user = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete an administrator account." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error: any) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
