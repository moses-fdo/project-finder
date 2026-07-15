import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const currentUserId = Number((currentUser as any).id);

    await prisma.notification.updateMany({
      where: {
        userId: currentUserId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ message: "All notifications marked as read." });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
